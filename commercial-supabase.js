(()=>{
'use strict';
const cfg=window.SST_COMMERCIAL_CONFIG||{};
if(!cfg.supabaseUrl||!cfg.publishableKey||!window.supabase?.createClient){
  console.error('[SST COMERCIAL] Configuração de autenticação indisponível.');
  window.SSTCommercialCloud={configured:false,error:'auth_unavailable'};
  return;
}
const sb=window.supabase.createClient(cfg.supabaseUrl,cfg.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
let ctx={user:null,company:null,license:null,membership:null};

function clone(x){return JSON.parse(JSON.stringify(x))}
function nowIso(){return new Date().toISOString()}
function activeLicense(l){
  if(!l)return false;
  if(l.status==='active')return !l.active_until||new Date(l.active_until)>new Date();
  if(['trial','demo'].includes(l.status))return !!l.trial_ends_at&&new Date(l.trial_ends_at)>new Date();
  return false;
}
async function getUser(){
  const {data,error}=await sb.auth.getUser();
  if(error){
    const code=String(error.code||'').toLowerCase(),msg=String(error.message||'').toLowerCase();
    if(code==='session_not_found'||code==='auth_session_missing'||/session.*missing/.test(msg))return null;
    throw error;
  }
  return data?.user||null;
}
async function loadContext(){
  const user=await getUser();
  if(!user){
    ctx={user:null,company:null,license:null,membership:null};
    return clone(ctx);
  }

  // O Login comercial é a fonte principal do vínculo com a empresa.
  // Isso evita travas quando existir cadastro antigo/duplicado em company_members.
  const {data:access,error:aErr}=await sb
    .from('sst_access_accounts')
    .select('company_id,active')
    .eq('user_id',user.id)
    .eq('active',true)
    .limit(1)
    .maybeSingle();
  if(aErr)throw aErr;

  let membership=null;
  let companyId=access?.company_id||null;

  if(companyId){
    const {data:m,error:mErr}=await sb
      .from('company_members')
      .select('*')
      .eq('user_id',user.id)
      .eq('company_id',companyId)
      .eq('active',true)
      .limit(1)
      .maybeSingle();
    if(mErr)throw mErr;
    membership=m||{company_id:companyId,user_id:user.id,member_role:'owner',active:true};
  }else{
    const {data:members,error:mErr}=await sb
      .from('company_members')
      .select('*')
      .eq('user_id',user.id)
      .eq('active',true)
      .order('created_at',{ascending:false})
      .limit(1);
    if(mErr)throw mErr;
    membership=members?.[0]||null;
    companyId=membership?.company_id||null;
  }

  let company=null,license=null;
  if(companyId){
    const [{data:companyRow,error:cErr},{data:licenseRow,error:lErr}]=await Promise.all([
      sb.from('companies').select('*').eq('id',companyId).limit(1).maybeSingle(),
      sb.from('licenses').select('*').eq('company_id',companyId).limit(1).maybeSingle()
    ]);
    if(cErr)throw cErr;
    if(lErr)throw lErr;
    company=companyRow||null;
    license=licenseRow||null;
  }

  ctx={user,company,license,membership};
  window.SST_COMMERCIAL_CONTEXT=clone(ctx);
  document.dispatchEvent(new CustomEvent('sst-commercial-context',{detail:clone(ctx)}));
  return clone(ctx);
}
async function signUp(email,password,fullName=''){
  const endpoint=String(cfg.supabaseUrl||'').replace(/\/$/,'')+'/functions/v1/sst-commercial-signup';
  const r=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json','apikey':cfg.publishableKey},body:JSON.stringify({email,password,fullName})});
  const out=await r.json().catch(()=>({}));
  if(!r.ok||!out?.ok)throw new Error(out?.message||'Não foi possível criar o acesso.');
  const data=await signIn(email,password);
  return data;
}
async function resendSignup(){throw new Error('Confirmação por e-mail não é necessária neste sistema.');}
async function signIn(email,password){
  const normalized=String(email||'').trim().toLowerCase();
  const {data,error}=await sb.auth.signInWithPassword({email:normalized,password});
  if(error)throw error;
  if(!data?.session||!data?.user)throw new Error('Não foi possível iniciar a sessão.');
  const p=await sb.from('profiles').upsert({user_id:data.user.id,full_name:data.user.user_metadata?.full_name||'',email:data.user.email||normalized,updated_at:nowIso()},{onConflict:'user_id'});
  if(p.error)throw p.error;
  await loadContext();
  return data;
}
async function signOut(){
  const {error}=await sb.auth.signOut({scope:'local'});
  if(error)throw error;
  ctx={user:null,company:null,license:null,membership:null};
  window.SST_COMMERCIAL_CONTEXT=clone(ctx);
}
async function resetPassword(email){
  const normalized=String(email||'').trim().toLowerCase();
  const redirectTo=new URL('./commercial-reset.html',location.href).href;
  const {error}=await sb.auth.resetPasswordForEmail(normalized,{redirectTo});
  if(error)throw error;
  return true;
}

async function createCompany(data){
  const user=await getUser();if(!user)throw new Error('Faça login.');
  const payload={
    owner_user_id:user.id,
    legal_name:String(data.legal_name||data.razaoSocial||'').trim(),
    trade_name:String(data.trade_name||data.nomeFantasia||'').trim()||null,
    cnpj:String(data.cnpj||'').trim()||null,
    unit_name:String(data.unit_name||data.unidade||'').trim()||null,
    address:String(data.address||data.endereco||'').trim()||null,
    city:String(data.city||data.cidade||'').trim()||null,
    state:String(data.state||data.uf||'').trim()||null,
    zip_code:String(data.zip_code||data.cep||'').trim()||null,
    phone:String(data.phone||data.telefone||'').trim()||null,
    email:String(data.email||user.email||'').trim()||null,
    updated_at:nowIso()
  };
  if(!payload.legal_name)throw new Error('Informe a Razão Social.');
  const {data:company,error}=await sb.from('companies').insert(payload).select().single();if(error)throw error;
  await sb.from('profiles').upsert({user_id:user.id,email:user.email||'',full_name:data.owner_name||data.responsavel||'',updated_at:nowIso()},{onConflict:'user_id'});
  await loadContext();
  return company;
}
async function updateCompany(data){
  if(!ctx.company)await loadContext();if(!ctx.company)throw new Error('Empresa não cadastrada.');
  const payload={
    legal_name:String(data.legal_name||data.razaoSocial||ctx.company.legal_name||'').trim(),
    trade_name:String(data.trade_name||data.nomeFantasia||'').trim()||null,
    cnpj:String(data.cnpj||'').trim()||null,
    unit_name:String(data.unit_name||data.unidade||'').trim()||null,
    address:String(data.address||data.endereco||'').trim()||null,
    city:String(data.city||data.cidade||'').trim()||null,
    state:String(data.state||data.uf||'').trim()||null,
    zip_code:String(data.zip_code||data.cep||'').trim()||null,
    phone:String(data.phone||data.telefone||'').trim()||null,
    email:String(data.email||'').trim()||null,
    onboarding_complete:true,
    updated_at:nowIso()
  };
  const {data:company,error}=await sb.from('companies').update(payload).eq('id',ctx.company.id).select().single();if(error)throw error;
  ctx.company=company;window.SST_COMMERCIAL_CONTEXT=clone(ctx);return company;
}
async function uploadLogo(file){
  if(!ctx.company)await loadContext();if(!ctx.company)throw new Error('Empresa não cadastrada.');
  const ext=(file.name?.split('.').pop()||'png').toLowerCase().replace(/[^a-z0-9]/g,'')||'png';
  const path=ctx.company.id+'/logo.'+ext;
  const {error:uErr}=await sb.storage.from('sst-company-logos').upload(path,file,{upsert:true,contentType:file.type||'image/png'});if(uErr)throw uErr;
  const {error:cErr}=await sb.from('companies').update({logo_path:path,updated_at:nowIso()}).eq('id',ctx.company.id);if(cErr)throw cErr;
  ctx.company.logo_path=path;return path;
}
async function logoDataUrl(){
  if(!ctx.company)await loadContext();const path=ctx.company?.logo_path;if(!path)return'';
  const {data,error}=await sb.storage.from('sst-company-logos').download(path);if(error)throw error;
  return await new Promise((resolve,reject)=>{const fr=new FileReader();fr.onload=()=>resolve(String(fr.result||''));fr.onerror=reject;fr.readAsDataURL(data)});
}
function requireCompany(){if(!ctx.company?.id)throw new Error('Cadastre a empresa primeiro.');return ctx.company.id}
function requireWrite(){if(!activeLicense(ctx.license))throw new Error('Licença de uso expirada ou bloqueada.');return true}

async function listResponsibles(){
  if(!ctx.company)await loadContext();const id=requireCompany();
  const {data,error}=await sb.from('safety_responsibles').select('*').eq('company_id',id).order('full_name');if(error)throw error;return data||[];
}
async function saveResponsible(x){
  if(!ctx.company||!activeLicense(ctx.license))await loadContext();requireWrite();const company_id=requireCompany();
  const payload={company_id,full_name:x.full_name||x.nome,job_title:x.job_title||x.funcao,professional_registration:x.professional_registration||x.registro||null,email:x.email||null,phone:x.phone||x.telefone||null,active:x.active!==false,updated_at:nowIso()};
  if(x.id){
    const {data,error}=await sb.from('safety_responsibles').update(payload).eq('id',x.id).select().single();if(error)throw error;return data;
  }
  const {data,error}=await sb.from('safety_responsibles').insert(payload).select().single();if(error)throw error;return data;
}
async function deleteResponsible(id){if(!activeLicense(ctx.license))await loadContext();requireWrite();const {error}=await sb.from('safety_responsibles').delete().eq('id',id);if(error)throw error;return true}

async function listReports(){
  if(!ctx.company)await loadContext();const id=requireCompany();
  const {data,error}=await sb.from('reports').select('*').eq('company_id',id).order('updated_at',{ascending:false});if(error)throw error;
  return (data||[]).map(r=>({...r.payload,id:r.source_id||r.id,cloudId:r.id,reportType:r.report_type,updatedAt:r.updated_at,createdAt:r.created_at}));
}
async function getReport(id){
  if(!ctx.company)await loadContext();const company_id=requireCompany();
  let q=sb.from('reports').select('*').eq('company_id',company_id);
  q=/^[0-9a-f-]{36}$/i.test(String(id||''))?q.or('id.eq.'+id+',source_id.eq.'+id):q.eq('source_id',String(id));
  const {data,error}=await q.limit(1).maybeSingle();if(error)throw error;
  return data?({...data.payload,id:data.source_id||data.id,cloudId:data.id,reportType:data.report_type,updatedAt:data.updated_at,createdAt:data.created_at}):null
}
async function saveReport(x){
  if(!ctx.company||!activeLicense(ctx.license))await loadContext();requireWrite();const company_id=requireCompany(),user=await getUser();
  const source_id=String(x.id||('INS-'+Date.now().toString(36).toUpperCase()+'-'+Math.random().toString(36).slice(2,7).toUpperCase()));
  const payload=clone(x);delete payload.cloudId;payload.id=source_id;
  const {data:existing,error:eErr}=await sb.from('reports').select('id').eq('company_id',company_id).eq('source_id',source_id).limit(1).maybeSingle();if(eErr)throw eErr;
  const row={id:existing?.id||crypto.randomUUID(),source_id,company_id,created_by:user.id,report_type:String(x.reportType||x.title||x.type||'Relatório SST'),title:String(x.title||''),payload,updated_at:nowIso()};
  const {data,error}=await sb.from('reports').upsert(row,{onConflict:'id'}).select().single();if(error)throw error;
  return {...payload,id:source_id,cloudId:data.id,reportType:data.report_type,updatedAt:data.updated_at,createdAt:data.created_at};
}
async function deleteReport(id){
  if(!ctx.company||!activeLicense(ctx.license))await loadContext();requireWrite();const company_id=requireCompany();
  let q=sb.from('reports').delete().eq('company_id',company_id);
  q=/^[0-9a-f-]{36}$/i.test(String(id||''))?q.or('id.eq.'+id+',source_id.eq.'+id):q.eq('source_id',String(id));
  const {error}=await q;if(error)throw error;return true
}

async function listCipaMembers(){if(!ctx.company)await loadContext();const id=requireCompany();const {data,error}=await sb.from('cipa_members').select('*').eq('company_id',id).eq('active',true).order('sort_order').order('full_name');if(error)throw error;return data||[]}
async function saveCipaMember(x){
  if(!ctx.company||!activeLicense(ctx.license))await loadContext();requireWrite();const company_id=requireCompany(),payload={company_id,full_name:x.full_name||x.name,cipa_role:x.cipa_role||x.role||'Membro Eleito',active:x.active!==false,sort_order:Number(x.sort_order||99),updated_at:nowIso()};
  if(x.id){const {data,error}=await sb.from('cipa_members').update(payload).eq('id',x.id).select().single();if(error)throw error;return data}
  const {data,error}=await sb.from('cipa_members').insert(payload).select().single();if(error)throw error;return data
}
async function deleteCipaMember(id){if(!activeLicense(ctx.license))await loadContext();requireWrite();const {error}=await sb.from('cipa_members').delete().eq('id',id);if(error)throw error;return true}
async function listCipaMinutes(){
  const company_id=requireCompany();const {data,error}=await sb.from('cipa_minutes').select('*').eq('company_id',company_id).order('meeting_date',{ascending:false});if(error)throw error;
  return (data||[]).map(r=>({...r.payload,id:r.source_id||r.id,cloudId:r.id,meetingNumber:r.meeting_number,term:r.term,date:r.meeting_date,startTime:String(r.start_time||'').slice(0,5),endTime:String(r.end_time||'').slice(0,5),subjects:r.subjects,members:r.present_members||[]}))
}
async function saveCipaMinute(x){
  if(!ctx.company||!activeLicense(ctx.license))await loadContext();requireWrite();const company_id=requireCompany(),user=await getUser(),source_id=String(x.id||('CIPA-'+Date.now()));
  const {data:existing,error:eErr}=await sb.from('cipa_minutes').select('id').eq('company_id',company_id).eq('source_id',source_id).limit(1).maybeSingle();if(eErr)throw eErr;
  const payload=clone(x);payload.id=source_id;delete payload.cloudId;
  const row={id:existing?.id||crypto.randomUUID(),source_id,company_id,created_by:user.id,meeting_number:Number(x.meetingNumber||1),term:String(x.term||''),meeting_date:x.date,start_time:x.startTime,end_time:x.endTime,subjects:String(x.subjects||''),present_members:clone(x.members||[]),payload,updated_at:nowIso()};
  const {data,error}=await sb.from('cipa_minutes').upsert(row,{onConflict:'id'}).select().single();if(error)throw error;return {...payload,cloudId:data.id}
}
async function deleteCipaMinute(id){
  if(!ctx.company||!activeLicense(ctx.license))await loadContext();requireWrite();const company_id=requireCompany();let q=sb.from('cipa_minutes').delete().eq('company_id',company_id);
  q=/^[0-9a-f-]{36}$/i.test(String(id||''))?q.or('id.eq.'+id+',source_id.eq.'+id):q.eq('source_id',String(id));
  const {error}=await q;if(error)throw error;return true
}

async function saveModuleState(key,value){
  const source_id='_module_'+String(key||'state').replace(/[^a-z0-9_-]/gi,'_');
  return await saveReport({id:source_id,reportType:'module-state',title:'Estado do módulo '+key,kind:'module-state',moduleKey:key,moduleValue:clone(value)});
}
async function loadModuleState(key){
  const source_id='_module_'+String(key||'state').replace(/[^a-z0-9_-]/gi,'_');
  const row=await getReport(source_id);
  return row&&row.kind==='module-state'?clone(row.moduleValue):null;
}
async function installCompatibility(){
  if(!ctx?.user||!ctx?.company)await loadContext();
  window.cloudSetReport=saveReport;
  window.cloudListReports=listReports;
  window.cloudGetReport=getReport;
  window.cloudDeleteReport=deleteReport;
  window.idbPut=saveReport;window.idbAll=listReports;window.idbGet=getReport;window.idbDelete=deleteReport;
  window.SST_DEMO_CONFIG=window.SST_DEMO_CONFIG||{};
  if(ctx.company){
    const logo=await logoDataUrl().catch(()=> '');
    window.SST_DEMO_CONFIG={
      empresaId:ctx.company.id,
      razaoSocial:ctx.company.legal_name||'',
      nomeFantasia:ctx.company.trade_name||'',
      cnpj:ctx.company.cnpj||'',
      unidade:ctx.company.unit_name||'',
      endereco:ctx.company.address||'',
      cidade:ctx.company.city||'',
      uf:ctx.company.state||'',
      cep:ctx.company.zip_code||'',
      telefone:ctx.company.phone||'',
      email:ctx.company.email||'',
      logo,
      tecnicos:(await listResponsibles().catch(()=>[])).map(t=>({id:t.id,nome:t.full_name,funcao:t.job_title,registro:t.professional_registration,email:t.email,telefone:t.phone}))
    };
  }
  document.dispatchEvent(new CustomEvent('sst-commercial-ready',{detail:clone(ctx)}));
  return clone(ctx);
}

window.SSTCommercialCloud={
  configured:true,sb,activeLicense,loadContext,getContext:()=>clone(ctx),
  signUp,resendSignup,signIn,signOut,resetPassword,
  createCompany,updateCompany,uploadLogo,logoDataUrl,
  listResponsibles,saveResponsible,deleteResponsible,
  listReports,getReport,saveReport,deleteReport,
  listCipaMembers,saveCipaMember,deleteCipaMember,
  listCipaMinutes,saveCipaMinute,deleteCipaMinute,
  saveModuleState,loadModuleState,
  installCompatibility
};
})();