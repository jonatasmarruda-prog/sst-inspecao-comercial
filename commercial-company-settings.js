(()=>{
'use strict';
const KEY='sst_comercial_empresa_cloud_v1';
const $=(s,r=document)=>r.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const empty=()=>({id:'',legal_name:'',trade_name:'',cnpj:'',unit_name:'',address:'',city:'',state:'',zip_code:'',phone:'',email:'',logo:'',technicians:[]});
const read=()=>{try{return {...empty(),...(JSON.parse(localStorage.getItem(KEY)||'null')||{})}}catch{return empty()}};
const write=v=>{localStorage.setItem(KEY,JSON.stringify(v));return v};
const label=c=>c.trade_name||c.legal_name||'Empresa';
const full=c=>[c.address,c.city&&c.state?c.city+' - '+c.state:c.city||c.state,c.zip_code?'CEP '+c.zip_code:''].filter(Boolean).join(', ');
function api(){const a=window.SSTCommercialCloud;if(!a?.configured)throw new Error('Nuvem comercial indisponível.');return a}
function style(){if($('#sstCompanyStyle'))return;const s=document.createElement('style');s.id='sstCompanyStyle';s.textContent=`
#sstCompanyModal{position:fixed;inset:0;z-index:90000;background:#0f172add;display:flex;align-items:flex-start;justify-content:center;padding:18px;overflow:auto}#sstCompanyModal.hidden{display:none!important}.scm{width:min(860px,100%);background:#fff;border-radius:20px;padding:20px;box-shadow:0 30px 90px #0008}.scm h2{margin:0 0 5px}.scm p{margin:0 0 14px;color:#64748b}.scg{display:grid;grid-template-columns:1fr 1fr;gap:10px}.scf label{display:block;font-size:11px;font-weight:900;color:#334155;margin-bottom:4px}.scf input{width:100%;padding:10px;border:1px solid #cbd5e1;border-radius:9px;background:#fff;color:#111827}.scf.full{grid-column:1/-1}.sct{border:1px solid #e2e8f0;border-radius:12px;padding:10px;margin-top:8px;background:#f8fafc}.sctgrid{display:grid;grid-template-columns:1.3fr 1fr 1fr auto;gap:8px}.sct input{width:100%;padding:9px;border:1px solid #cbd5e1;border-radius:8px}.sca{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}.sca button,.scs{border:0;border-radius:9px;padding:10px 12px;font-weight:900;cursor:pointer}.scp{background:#8b1018;color:#fff}.scs{background:#e2e8f0;color:#17202b}.scrm{background:#fee2e2;color:#991b1b;border:0;border-radius:8px;font-weight:900;padding:9px}.scLogoPreview{max-width:160px;max-height:90px;object-fit:contain;margin-top:8px;border:1px solid #e2e8f0;border-radius:8px;padding:5px}.scmsg{font-size:12px;margin-top:10px;color:#991b1b}.scok{color:#166534}@media(max-width:700px){.scg,.sctgrid{grid-template-columns:1fr}.scf.full{grid-column:auto}}
`;document.head.appendChild(s)}
function techRow(t={}){const d=document.createElement('div');d.className='sct';d.dataset.id=t.id||'';d.innerHTML='<div class="sctgrid"><input data-k="nome" placeholder="Nome do técnico" value="'+esc(t.nome||t.full_name||'')+'"><input data-k="funcao" placeholder="Função" value="'+esc(t.funcao||t.job_title||'Técnico de Segurança do Trabalho')+'"><input data-k="registro" placeholder="Registro profissional" value="'+esc(t.registro||t.professional_registration||'')+'"><button class="scrm" type="button">Excluir</button></div>';$('.scrm',d).onclick=()=>d.remove();return d}
function showLogo(src){const b=$('#scLogoBox');if(b)b.innerHTML=src?'<img class="scLogoPreview" src="'+src+'">':''}
function modal(){style();let r=$('#sstCompanyModal');if(r)return r;r=document.createElement('div');r.id='sstCompanyModal';r.className='hidden';r.innerHTML='<div class="scm"><h2>🏢 Cadastro da empresa</h2><p>Cadastre os dados que serão usados no sistema e nos relatórios.</p><div class="scg"><div class="scf"><label>Razão Social *</label><input id="scLegal"></div><div class="scf"><label>Nome Fantasia</label><input id="scTrade"></div><div class="scf"><label>CNPJ</label><input id="scCnpj"></div><div class="scf"><label>Unidade / Filial</label><input id="scUnit"></div><div class="scf full"><label>Endereço</label><input id="scAddress"></div><div class="scf"><label>Cidade</label><input id="scCity"></div><div class="scf"><label>UF</label><input id="scState" maxlength="2"></div><div class="scf"><label>CEP</label><input id="scZip"></div><div class="scf"><label>Telefone</label><input id="scPhone"></div><div class="scf"><label>E-mail da empresa</label><input id="scEmail" type="email"></div><div class="scf full"><label>Logo da empresa</label><input id="scLogo" type="file" accept="image/*"><div id="scLogoBox"></div></div></div><h3 style="margin:18px 0 6px">Técnicos / responsáveis SST</h3><div id="scTechs"></div><button id="scAddTech" class="scs" type="button">＋ Adicionar técnico</button><div id="scMsg" class="scmsg"></div><div class="sca"><button id="scSave" class="scp">Salvar empresa</button><button id="scClose" class="scs">Fechar</button></div></div>';document.body.appendChild(r);$('#scAddTech',r).onclick=()=>$('#scTechs',r).appendChild(techRow());$('#scClose',r).onclick=()=>{if(r.dataset.required==='1'){msg('Cadastre a empresa para continuar.');return}r.classList.add('hidden')};$('#scLogo',r).onchange=e=>{const f=e.target.files?.[0];r._logoFile=f||null;if(f){const fr=new FileReader();fr.onload=()=>showLogo(String(fr.result||''));fr.readAsDataURL(f)}};$('#scSave',r).onclick=save;return r}
function msg(t,ok=false){const m=$('#scMsg');if(m){m.textContent=t||'';m.className='scmsg '+(ok?'scok':'')}}
async function syncCloud(){
 const a=api(),ctx=await a.loadContext();if(!ctx?.user)return null;
 if(!ctx.company){write(empty());apply();return ctx}
 const [logo,techs]=await Promise.all([a.logoDataUrl().catch(()=>''),a.listResponsibles().catch(()=>[])]);
 const c=write({id:ctx.company.id,legal_name:ctx.company.legal_name||'',trade_name:ctx.company.trade_name||'',cnpj:ctx.company.cnpj||'',unit_name:ctx.company.unit_name||'',address:ctx.company.address||'',city:ctx.company.city||'',state:ctx.company.state||'',zip_code:ctx.company.zip_code||'',phone:ctx.company.phone||'',email:ctx.company.email||ctx.user.email||'',logo,technicians:techs.map(t=>({id:t.id,nome:t.full_name,funcao:t.job_title,registro:t.professional_registration||''}))});
 apply();return {...ctx,company:c};
}
function fillModal(r,c,ctx=null){
 r.dataset.required=ctx?.user&&!ctx?.company?'1':'0';
 $('#scLegal',r).value=c.legal_name||'';
 $('#scTrade',r).value=c.trade_name||'';
 $('#scCnpj',r).value=c.cnpj||'';
 $('#scUnit',r).value=c.unit_name||'';
 $('#scAddress',r).value=c.address||'';
 $('#scCity',r).value=c.city||'';
 $('#scState',r).value=c.state||'';
 $('#scZip',r).value=c.zip_code||'';
 $('#scPhone',r).value=c.phone||'';
 $('#scEmail',r).value=c.email||window.SST_COMMERCIAL_CONTEXT?.user?.email||'';
 showLogo(c.logo||'');
 const box=$('#scTechs',r);box.innerHTML='';
 (c.technicians||[]).forEach(t=>box.appendChild(techRow(t)));
}
async function open(){
 const r=modal(),cached=read(),ctx=window.SST_COMMERCIAL_CONTEXT||null;
 fillModal(r,cached,ctx);
 r.classList.remove('hidden');
 msg('');

 // Atualiza os dados da nuvem depois que o modal já abriu.
 Promise.resolve()
  .then(()=>syncCloud())
  .then(freshCtx=>{
    if(r.classList.contains('hidden'))return;
    fillModal(r,read(),freshCtx||window.SST_COMMERCIAL_CONTEXT||null);
  })
  .catch(e=>{
    console.warn('[SST EMPRESA SYNC]',e);
    if(!r.classList.contains('hidden'))msg('Formulário aberto. A sincronização será refeita em segundo plano.');
  });
}
async function save(){
 const r=modal(),legal=$('#scLegal',r).value.trim();if(!legal){msg('Informe a Razão Social.');return}
 const btn=$('#scSave',r);btn.disabled=true;btn.textContent='Salvando...';msg('');
 try{
  const a=api(),data={legal_name:legal,trade_name:$('#scTrade',r).value.trim(),cnpj:$('#scCnpj',r).value.trim(),unit_name:$('#scUnit',r).value.trim(),address:$('#scAddress',r).value.trim(),city:$('#scCity',r).value.trim(),state:$('#scState',r).value.trim().toUpperCase(),zip_code:$('#scZip',r).value.trim(),phone:$('#scPhone',r).value.trim(),email:$('#scEmail',r).value.trim()};
  let ctx=await a.loadContext();if(!ctx?.user)throw new Error('Sua sessão expirou. Entre novamente.');
  if(ctx.company)await a.updateCompany(data);else await a.createCompany(data);
  ctx=await a.loadContext();
  if(r._logoFile)await a.uploadLogo(r._logoFile);
  const existing=await a.listResponsibles(),keep=new Set();
  for(const el of [...r.querySelectorAll('.sct')]){
    const nome=el.querySelector('[data-k="nome"]').value.trim();if(!nome)continue;
    const id=el.dataset.id||'',saved=await a.saveResponsible({id,full_name:nome,job_title:el.querySelector('[data-k="funcao"]').value.trim(),professional_registration:el.querySelector('[data-k="registro"]').value.trim()});
    if(saved?.id)keep.add(saved.id);
  }
  for(const x of existing)if(!keep.has(x.id))await a.deleteResponsible(x.id);
  await a.installCompatibility();await syncCloud();r.dataset.required='0';r.classList.add('hidden');document.dispatchEvent(new CustomEvent('sst-company-updated'));alert('Empresa cadastrada com sucesso.');
 }catch(e){msg(e.message||'Não foi possível salvar a empresa.')}
 finally{btn.disabled=false;btn.textContent='Salvar empresa'}
}
function apply(){
 const c=read();window.SST_DEMO_CONFIG={empresaId:c.id,razaoSocial:c.legal_name,nomeFantasia:c.trade_name,cnpj:c.cnpj,unidade:c.unit_name,endereco:c.address,cidade:c.city,uf:c.state,cep:c.zip_code,telefone:c.phone,email:c.email,logo:c.logo,tecnicos:c.technicians||[]};window.SST_COMMERCIAL_BRAND=window.SST_DEMO_CONFIG;document.title='Sistema de Gestão SST';const brand=$('.brand');if(brand){$('b',brand).textContent='Sistema de Gestão SST';$('span',brand).textContent=c.legal_name?label(c)+(c.unit_name?' • '+c.unit_name:''):'Cadastre sua empresa'}const img=$('.top .logo');if(img){img.src=c.logo||'./icon.svg';img.alt=c.legal_name?label(c):'Sistema SST'}const home=$('#home .hero');if(home&&!$('#scCompanyButton')){const b=document.createElement('button');b.id='scCompanyButton';b.className='btn secondary full';b.style.marginTop='10px';b.textContent='⚙️ Empresa, logo e técnicos';b.onclick=()=>open().catch(e=>alert(e.message));home.appendChild(b)}const company=$('#company'),addr=$('#address'),insp=$('#inspector'),otherBox=$('#otherCompanyBox'),other=$('#otherCompany'),role=$('#role');if(c.legal_name){if(company)company.innerHTML='<option>'+esc(label(c))+'</option>';if(otherBox)otherBox.classList.add('hidden');if(addr)addr.value=full(c);if(insp){insp.innerHTML=(c.technicians||[]).map(t=>'<option value="'+esc(t.nome)+'">'+esc(t.nome)+'</option>').join('')+'<option>Outro</option>';if(c.technicians?.[0]&&role)role.value=c.technicians[0].funcao||''}}else{if(company){company.innerHTML='<option>Outro</option>';company.value='Outro'}if(otherBox)otherBox.classList.remove('hidden');if(other)other.value='';if(addr)addr.value='';if(insp){insp.innerHTML='<option>Outro</option>';insp.value='Outro'}}}
function seedFromContext(){
 const ctx=window.SST_COMMERCIAL_CONTEXT||null,company=ctx?.company;
 if(!company?.id)return false;
 const prev=read();
 write({
  ...prev,
  id:company.id,
  legal_name:company.legal_name||prev.legal_name||'',
  trade_name:company.trade_name||prev.trade_name||'',
  cnpj:company.cnpj||prev.cnpj||'',
  unit_name:company.unit_name||prev.unit_name||'',
  address:company.address||prev.address||'',
  city:company.city||prev.city||'',
  state:company.state||prev.state||'',
  zip_code:company.zip_code||prev.zip_code||'',
  phone:company.phone||prev.phone||'',
  email:company.email||prev.email||'',
  technicians:prev.technicians||[]
 });
 apply();
 return true;
}
async function afterLogin(){
 seedFromContext();
 syncCloud().then(ctx=>{
   seedFromContext();
   if(ctx?.user&&!ctx.company)setTimeout(()=>open().catch(()=>{}),100);
 }).catch(e=>console.warn('[SST EMPRESA BACKGROUND]',e));
}
function boot(){
 modal();
 seedFromContext();
 apply();
 document.addEventListener('sst-client-authenticated',()=>afterLogin().catch(console.error));
 document.addEventListener('sst-commercial-context',()=>seedFromContext());
 document.addEventListener('sst-commercial-ready',()=>syncCloud().catch(()=>{}));
 if(window.SST_COMMERCIAL_CONTEXT?.user)afterLogin().catch(()=>{});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.SSTCompanySettings={open,apply,read,syncCloud};
})();