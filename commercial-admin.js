(()=>{
'use strict';
const $=id=>document.getElementById(id);
const cfg=window.SST_COMMERCIAL_CONFIG||{};
let sb=null,all=[],accesses=[],lastAccess=null;
const ACCESS_ADMIN_URL=()=>cfg.supabaseUrl.replace(/\/$/,'')+'/functions/v1/sst-commercial-access-admin';
const CLIENT_URL='https://jonatasmarruda-prog.github.io/sst-inspecao-comercial/';

function box(id,t,err=false,ok=false){
  const el=$(id);if(!el)return;
  el.replaceChildren();
  if(t){
    const d=document.createElement('div');
    d.className='notice '+(err?'error':ok?'success':'');
    d.textContent=String(t);
    el.appendChild(d);
  }
}
function msg(t,err=false,ok=false){
  const id=$('app')?.classList.contains('hidden')?'loginMsg':'adminMsg';
  box(id,t,err,ok);
}
function requireConfig(){
  if(!cfg.supabaseUrl||!cfg.publishableKey)throw new Error('Nuvem comercial ainda não conectada.');
  if(!window.supabase?.createClient)throw new Error('Biblioteca Supabase indisponível.');
  sb=window.supabase.createClient(cfg.supabaseUrl,cfg.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
}
function statusClass(s){return ['active','trial','demo','pending','blocked','expired'].includes(s)?s:''}
function fmt(v){if(!v)return'—';try{return new Date(v).toLocaleString('pt-BR')}catch{return String(v)}}
function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}

async function ensureAdmin(){
  const {data,error}=await sb.auth.getUser();
  if(error||!data?.user)throw new Error('Faça login.');
  const {data:allowed,error:aErr}=await sb.rpc('is_sst_platform_admin');
  if(aErr)throw aErr;
  if(!allowed)throw new Error('Esta conta não possui permissão de administrador.');
  return data.user;
}
async function login(){
  const button=$('adminLogin');if(button.disabled)return;button.disabled=true;button.textContent='Entrando…';
  try{
    msg('');
    const email=$('adminEmail').value.trim().toLowerCase(),password=$('adminPass').value;
    if(!email||!password)throw new Error('Informe e-mail e senha.');
    const {error}=await sb.auth.signInWithPassword({email,password});
    if(error){
      const m=String(error.message||'');
      if(/invalid login credentials/i.test(m))throw new Error('E-mail ou senha incorretos. Se não lembrar a senha, use “Esqueci minha senha”.');
      throw error;
    }
    await ensureAdmin();
    $('loginCard').classList.add('hidden');$('app').classList.remove('hidden');await load();
  }catch(e){msg(e.message||'Falha no acesso.',true)}
  finally{button.disabled=false;button.textContent='Entrar'}
}
async function forgotAdminPassword(){
  try{
    msg('');
    const email=$('adminEmail').value.trim().toLowerCase()||'jonatasmarruda@gmail.com';
    if(email!=='jonatasmarruda@gmail.com')throw new Error('Informe o e-mail administrador cadastrado.');
    const {error}=await sb.auth.resetPasswordForEmail(email,{redirectTo:location.origin+'/commercial-reset.html'});
    if(error)throw error;
    msg('E-mail de recuperação enviado para '+email+'. Abra a mensagem e crie uma nova senha.',false,true);
  }catch(e){msg(e.message||'Não foi possível enviar a recuperação de senha.',true)}
}
async function createAdminAccess(){
  try{
    msg('');
    const email=$('adminEmail').value.trim().toLowerCase(),password=$('adminPass').value;
    if(email!=='jonatasmarruda@gmail.com')throw new Error('Este painel está autorizado somente para o administrador cadastrado.');
    if(String(password).length<8)throw new Error('Use uma senha com pelo menos 8 caracteres.');
    const {data,error}=await sb.auth.signUp({email,password,options:{data:{full_name:'Jonatas Marruda'}}});
    if(error)throw error;
    if(data?.session){
      await ensureAdmin();$('loginCard').classList.add('hidden');$('app').classList.remove('hidden');await load();
    }else msg('Acesso criado. Confirme o cadastro e depois clique em Entrar.',false,true);
  }catch(e){msg(e.message||'Não foi possível criar o acesso administrativo.',true)}
}

async function adminAction(payload){
  await ensureAdmin();
  const {data}=await sb.auth.getSession();
  const token=data?.session?.access_token;
  if(!token)throw new Error('Sessão administrativa expirada. Entre novamente.');
  const r=await fetch(ACCESS_ADMIN_URL(),{
    method:'POST',
    headers:{'Content-Type':'application/json','apikey':cfg.publishableKey,'Authorization':'Bearer '+token},
    body:JSON.stringify(payload)
  });
  const out=await r.json().catch(()=>({}));
  if(!r.ok||!out?.ok)throw new Error(out?.message||'Operação não concluída.');
  return out;
}

async function load(){
  try{
    await ensureAdmin();
    const results=await Promise.all([
      sb.from('companies').select('*').eq('commercial_archived',false).order('created_at',{ascending:false}),
      sb.from('licenses').select('*'),
      sb.from('company_members').select('*'),
      sb.from('profiles').select('*'),
      sb.from('sst_access_accounts').select('*').order('created_at',{ascending:false})
    ]);
    const [companies,licenses,members,profiles,accessRows]=results.map(x=>x.data||[]);
    const firstErr=results.find(x=>x.error)?.error;if(firstErr)throw firstErr;
    accesses=accessRows;
    const lic=new Map(licenses.map(x=>[x.company_id,x]));
    const prof=new Map(profiles.map(x=>[x.user_id,x]));
    const accessByCompany=new Map(accesses.map(x=>[x.company_id,x]));
    all=companies.map(c=>{
      const owner=members.find(m=>m.company_id===c.id&&m.member_role==='owner'&&m.active!==false);
      return {...c,license:lic.get(c.id)||{},owner:owner?prof.get(owner.user_id)||{}:{},access:accessByCompany.get(c.id)||null};
    });
    render();renderLogins();
  }catch(e){msg(e.message||'Erro ao carregar clientes.',true)}
}

function render(){
  const q=$('search').value.trim().toLowerCase();
  const items=all.filter(x=>[x.legal_name,x.trade_name,x.cnpj,x.email,x.owner?.email,x.owner?.full_name,x.access?.login].join(' ').toLowerCase().includes(q));
  $('kTotal').textContent=all.length;
  $('kTrial').textContent=all.filter(x=>['trial','demo'].includes(x.license?.status)).length;
  $('kActive').textContent=all.filter(x=>x.license?.status==='active').length;
  $('kBlocked').textContent=all.filter(x=>['pending','blocked','expired'].includes(x.license?.status)).length;
  $('clients').innerHTML=items.length?items.map(x=>{
    const l=x.license||{},name=x.trade_name||x.legal_name||'Empresa';
    const loginTag=x.access?.login?'<span class="loginTag">Login: '+esc(x.access.login)+'</span>':'<span class="pill">Acesso antigo</span>';
    const deleteBtn=x.access?.id
      ?'<button class="btn danger" data-act="deleteAccess" data-access="'+esc(x.access.id)+'">Excluir cadastro</button>'
      :'<button class="btn danger" data-act="archiveCompany">Excluir cadastro</button>';
    const openBtn=x.access?.login
      ?'<a class="btn green" href="'+CLIENT_URL+'?login='+encodeURIComponent(x.access.login)+'" target="_blank" rel="noopener" style="text-decoration:none">Abrir sistema</a>'
      :'<a class="btn green" href="'+CLIENT_URL+'" target="_blank" rel="noopener" style="text-decoration:none">Abrir sistema</a>';
    return '<div class="client" data-id="'+esc(x.id)+'"><div class="clientTop"><div class="main"><h3>'+esc(name)+'</h3><div class="mini">'+esc(x.legal_name||'')+' • '+esc(x.cnpj||'Sem CNPJ')+'</div><div class="mini">'+esc(x.owner?.full_name||x.owner?.email||x.email||'Sem responsável')+'</div><div class="mini">Teste até: '+esc(fmt(l.trial_ends_at))+' • Ativo até: '+esc(fmt(l.active_until))+'</div><div style="margin-top:6px">'+loginTag+'</div></div><span class="pill '+statusClass(l.status)+'">'+esc(String(l.status||'sem licença').toUpperCase())+'</span></div><div class="actions">'+
      '<button class="btn blue" data-act="trial2">Teste +2 dias</button>'+
      '<button class="btn blue" data-act="trial3">Teste +3 dias</button>'+
      '<button class="btn primary" data-act="activate">Liberar</button>'+
      '<button class="btn danger" data-act="block">Bloquear</button>'+
      '<button class="btn secondary" data-act="expire">Expirar</button>'+
      openBtn+
      deleteBtn+
      '</div></div>';
  }).join(''):'<div class="card mini">Nenhum cliente encontrado.</div>';
}
function renderLogins(){
  const q=$('loginSearch').value.trim().toLowerCase();
  const companyById=new Map(all.map(x=>[x.id,x]));
  const items=accesses.filter(a=>{
    const c=companyById.get(a.company_id)||{};
    return [a.login,a.display_name,c.trade_name,c.legal_name].join(' ').toLowerCase().includes(q);
  });
  $('logins').innerHTML=items.length?items.map(a=>{
    const c=companyById.get(a.company_id)||{};
    return '<div class="client" data-access-id="'+esc(a.id)+'"><div class="clientTop"><div class="main"><h3>'+esc(a.display_name||c.trade_name||'Cliente')+'</h3><div class="mini">'+esc(c.trade_name||c.legal_name||'Empresa')+'</div><div style="margin-top:6px"><span class="loginTag">Login: '+esc(a.login)+'</span></div><div class="mini" style="margin-top:6px">Senha: •••••••• <span style="opacity:.8">— por segurança, use “Redefinir senha” para trocar.</span></div></div></div><div class="actions"><a class="btn green" href="'+CLIENT_URL+'?login='+encodeURIComponent(a.login)+'" target="_blank" rel="noopener" style="text-decoration:none">Abrir sistema</a><button class="btn blue" data-access-act="reset">Redefinir senha</button><button class="btn danger" data-access-act="delete">Excluir cadastro</button></div></div>';
  }).join(''):'<div class="mini" style="padding:14px">Nenhum login cadastrado.</div>';
}

async function setLicense(companyId,patch){
  const {error}=await sb.from('licenses').update({...patch,updated_at:new Date().toISOString()}).eq('company_id',companyId);
  if(error)throw error;await load();
}
async function act(companyId,action,button){
  try{
    if(action==='trial2'||action==='trial3'){
      const days=action==='trial2'?2:3,end=new Date(Date.now()+days*86400000).toISOString();
      await setLicense(companyId,{status:'trial',trial_started_at:new Date().toISOString(),trial_ends_at:end,active_until:null});return;
    }
    if(action==='activate'){await setLicense(companyId,{status:'active',trial_ends_at:null,active_until:null});return}
    if(action==='block'){await setLicense(companyId,{status:'blocked'});return}
    if(action==='expire'){await setLicense(companyId,{status:'expired',trial_ends_at:new Date(0).toISOString(),active_until:new Date(0).toISOString()});return}
    if(action==='deleteAccess'){
      const accessId=button?.dataset.access;
      if(!accessId)return;
      if(!confirm('Excluir este cadastro e acesso? A pessoa perderá o acesso imediatamente. Os relatórios históricos serão preservados.'))return;
      await adminAction({action:'delete',accessId});msg('Acesso excluído com sucesso.',false,true);await load();return;
    }
    if(action==='archiveCompany'){
      if(!confirm('Excluir este cadastro do painel e bloquear este cliente? Os relatórios históricos serão preservados.'))return;
      await adminAction({action:'archive_company',companyId});msg('Cliente removido do painel e bloqueado.',false,true);await load();return;
    }
  }catch(e){msg(e.message||'Não foi possível alterar o cliente.',true)}
}

function genPassword(){
  const chars='ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  const arr=new Uint32Array(10);crypto.getRandomValues(arr);
  let s='';for(const n of arr)s+=chars[n%chars.length];
  $('newPassword').value=s;return s;
}
function clearCreate(){
  ['newCompany','newResponsible','newLogin','newPhone','newCnpj'].forEach(id=>$(id).value='');
  $('newMode').value='trial';$('newDays').value='3';genPassword();$('createdBox').classList.add('hidden');lastAccess=null;box('createMsg','');
}
function createBusy(v){
  ['newCompany','newResponsible','newLogin','newPhone','newCnpj','newMode','newDays','newPassword','genPassword','createClient','clearCreate'].forEach(id=>$(id).disabled=!!v);
  $('createClient').textContent=v?'Criando acesso...':'Criar acesso';
}
async function createClient(){
  try{
    const companyName=$('newCompany').value.trim();
    const responsibleName=$('newResponsible').value.trim();
    const login=$('newLogin').value.trim().toLowerCase();
    const phone=$('newPhone').value.trim();
    const cnpj=$('newCnpj').value.trim();
    const mode=$('newMode').value;
    const trialDays=Number($('newDays').value||3);
    const password=$('newPassword').value;
    if(!companyName)throw new Error('Informe o nome da empresa.');
    if(!/^[a-z0-9._-]{3,32}$/.test(login))throw new Error('Login inválido. Use letras minúsculas, números, ponto, hífen ou underline.');
    if(password.length<6)throw new Error('A senha precisa ter pelo menos 6 caracteres.');
    createBusy(true);box('createMsg','Criando empresa, Login e licença...');
    const out=await adminAction({action:'create',companyName,responsibleName,login,password,phone,cnpj,mode,trialDays});
    lastAccess={company:companyName,login,password,status:out.client?.status||mode};
    $('doneCompany').textContent=companyName;$('doneLogin').textContent=login;$('donePassword').textContent=password;
    $('doneStatus').textContent=out.client?.status==='active'?'LIBERADO':'TESTE';
    const openCreated=$('openCreatedSystem');if(openCreated)openCreated.href=CLIENT_URL+'?login='+encodeURIComponent(login);
    $('createdBox').classList.remove('hidden');box('createMsg','Acesso criado com sucesso.',false,true);
    await load();
  }catch(e){box('createMsg',e.message||'Não foi possível criar o acesso.',true)}
  finally{createBusy(false)}
}
async function copyAccess(){
  if(!lastAccess)return;
  const t='ACESSO AO SISTEMA SST\n\nEmpresa: '+lastAccess.company+'\nLogin: '+lastAccess.login+'\nSenha: '+lastAccess.password+'\n\nAcesse: '+CLIENT_URL+'\n\nDigite somente o Login e a Senha.';
  try{await navigator.clipboard.writeText(t);$('copyAccess').textContent='✓ Copiado';setTimeout(()=>$('copyAccess').textContent='Copiar Login e Senha',1800)}
  catch{prompt('Copie os dados de acesso:',t)}
}
function switchTab(name){
  document.querySelectorAll('[data-tab]').forEach(b=>b.classList.toggle('active',b.dataset.tab===name));
  $('tab-clients').classList.toggle('hidden',name!=='clients');
  $('tab-create').classList.toggle('hidden',name!=='create');
  $('tab-logins').classList.toggle('hidden',name!=='logins');
  if(name!=='create')load().catch(e=>msg(e.message,true));
}

async function boot(){
  try{
    requireConfig();
    const {data}=await sb.auth.getSession();
    if(data?.session){
      try{await ensureAdmin();$('loginCard').classList.add('hidden');$('app').classList.remove('hidden');genPassword();await load()}catch(_){}
    }
    $('adminLogin').onclick=login;
    ['adminEmail','adminPass'].forEach(id=>$(id).addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();login()}}));
    $('adminForgot').onclick=forgotAdminPassword;$('adminCreate').onclick=createAdminAccess;
    $('adminEye').onclick=()=>{const p=$('adminPass'),show=p.type==='password';p.type=show?'text':'password';$('adminEye').textContent=show?'🙈':'👁️';$('adminEye').title=show?'Ocultar senha':'Mostrar senha'};
    $('adminLogout').onclick=async()=>{await sb.auth.signOut();location.reload()};
    $('refresh').onclick=load;$('refreshLogins').onclick=load;$('search').oninput=render;$('loginSearch').oninput=renderLogins;

    $('newEye').onclick=()=>{const p=$('newPassword'),show=p.type==='password';p.type=show?'text':'password';$('newEye').textContent=show?'🙈':'👁️'};
    $('newLogin').oninput=()=>{$('newLogin').value=$('newLogin').value.toLowerCase().replace(/\s+/g,'')};
    $('genPassword').onclick=genPassword;$('clearCreate').onclick=clearCreate;$('createClient').onclick=createClient;$('copyAccess').onclick=copyAccess;
    $('newMode').onchange=()=>$('daysBox').classList.toggle('hidden',$('newMode').value==='active');

    document.addEventListener('click',async e=>{
      const tab=e.target.closest('[data-tab]');if(tab){switchTab(tab.dataset.tab);return}
      const lb=e.target.closest('[data-access-act]');
      if(lb){
        const card=lb.closest('[data-access-id]'),accessId=card?.dataset.accessId,action=lb.dataset.accessAct;if(!accessId)return;
        try{
          if(action==='reset'){
            const np=prompt('Digite a NOVA senha (mínimo 6 caracteres):');if(np===null)return;if(np.length<6)throw new Error('A senha precisa ter pelo menos 6 caracteres.');
            await adminAction({action:'reset_password',accessId,password:np});alert('Senha alterada com sucesso.');
          }else if(action==='delete'){
            if(!confirm('Excluir este cadastro? A pessoa deixará de entrar. Os relatórios históricos serão preservados.'))return;
            await adminAction({action:'delete',accessId});await load();
          }
        }catch(x){alert(x.message||x)}
        return;
      }
      const b=e.target.closest('[data-act]');if(!b)return;
      const card=b.closest('[data-id]');if(card)act(card.dataset.id,b.dataset.act,b);
    });

    setInterval(()=>{if(!$('app').classList.contains('hidden'))load().catch(()=>{})},30000);
    window.addEventListener('focus',()=>{if(!$('app').classList.contains('hidden'))load().catch(()=>{})});
  }catch(e){msg(e.message,true)}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();