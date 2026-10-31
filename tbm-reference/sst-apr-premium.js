(()=>{
'use strict';
if(window.__tbmAprModule)return;window.__tbmAprModule=true;
const STORE='tbm_apr_registros_premium_v1',PENDING='tbm_apr_pendentes_premium_v1',COMPANIES='tbm_apr_empresas_terceiras_v1',COMPANY_QUEUE='tbm_apr_empresas_pendentes_v1';
const $=id=>document.getElementById(id);
const E=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const C=x=>JSON.parse(JSON.stringify(x));
const get=(k,def)=>{try{return JSON.parse(localStorage.getItem(k)||'null')??def}catch(e){return def}};
const id=()=>('apr-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8));
// Logotipo TBM extraído do PDF modelo de 2019: mantido dentro do módulo,
// sem depender de URLs externas nem do arquivo de imagem defeituoso.
const APR_TBM_LOGO='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAXIAAAB7AQAAAABBJzbYAAAFoklEQVR42uWYsW8cRRTGfzO7xFsY3xYURkrwgkRvhCJFEOEtKChTUqZDonJBQRHhOQkJCor8AyD/C0iUiKxRJIIUKSkpULJGkUgRkbVlKXvO7j2Kmd2d2bvY5xIxkn23N9/Ovnnv+957s0q4yDjQXGz8f/GHKl0Z/y1MM47MCjeIiEhhv2/JeaOw62cW/3RVe5zlp6viE2fbqvhL7sqsiFfmgv7fhS0pKM7Fx/ZjIsB1ygvxITIX5M/NC+LTCjh7EwF+HaD9USmllIqnSqkUmCkNMFXpGK8BvvZ3cXQu/9U0uMz6b8bjp4hIGYlsAJFzagTAmkhlQTDp+DkDUVmbYrpN9KPpee/ZEyulgWPygasukm2Hn0Pd4d0mxADcDINsQh5qAOUuimyRegWVb5j29/4Q2FglXvnww+5IBKULee3jt+1FnbJjJHRIFZLW4jeArZJGScF8mNyrhu9VoK9qTcqt0PAEmDg7yjEfJjWwPQeIRAR2ZMTV0rpIj+kZ+j4b8zvQl5dPnMfS3vhiCT+NY6Q4AizMjfA5MMtW12MGbZKPnWSg7lNfqN9DFZ+T4zTAPrRKaZJeJvg07HYz7/BvcxiD5F4CG54ivmrsdGZXuhcDm51rGuhZNtyhPS83+vycpb30P1+WqRM7U/v4eLB0I0RXXdwqH9/5ZEpUhc8uSZfFy5Gj2GpGriy6J5cB/rrLS+PRGi/BIb3pkQCTfhHnylYBeeM/KODD0sRgQIPpVtZewLeXWKTcn3FO155xSZeDzsjfw7VJY0BuhPPrNlJ3OhIM+OmJBn7Nwp9TIDbM4R2/noJmrkTBXseyamkLoq1yVA6CWWwJTqkg50/Ina9USquoHVSN2yMTCl7DkYpdiPKh8/CDkng60N2NysZrc4wvgYyqe7B2qWkOlFkvl3hgdBlQUPcl0wwtRGUXnkgNNaReodbOBLHOvh4as2Z64cY9/lKX3ColY8rdHO9dd5I128vYucncOqjTuAZuMZGimOz8MQKnEENuN5gOZkUCSUlRj7LCsp5Re5kgGRvbTcdAZh3Y40/GNfTsfB63r0Lsk+uh4Gg/+Yt69cKj+qI5zKfa40HQKw12OsDdD+HgYGhf0vHSql/3CYjKp2FdfOU+Na8nBxoKr0WxrjRj43N33yz3Fq7P7pvRXZS2R/2aVxJCu+yd5foACGv8TSDvY69d8q8iA2siI3saPw9RefrlFjt1L4bO9fU4Ehp27UQ0iMX0vKxQ1pWZu0nDBkTNrVeRx2X5fPCTksVuZKgvehRu1z0b/xQHO9ItEBGJVIhIyaQ7351BhDjkYIfPwzox3L0GkKgFPZ6EdbDf0EYPS6kHfNZmTNWSc9tlEj89Wvwsh0Nl4PYC/tqorEgOB0mdLqq+P/n5+SXmQAFNskg3684yVLlWAb+7cmK8Hjb1A6aHOhPW+MaXhfL2a8tF55kyNEoVRU/QhAa0XUHYBSYyPmF/tBA/q5BUBPbk/PcD2CXTFbDd+4QS9p6ef7Lu/bglMCtXxOvweGJVEkP7slfw3L2WaL86GfD1KCk8nDuNP+Olc9pJUfX4+HScy2a7/UXtFexuffH0FV3m1KuWdZf6f37kMekuqO4NUPvFN/eZXLnywbtHZBnV8e/HB0/uof0y3yoFx24DvxglXz1rHjcPRSrNg/oBPxQt93q8Cqx687P3H9L8NjP5/flHn/JsfX39vc3N5Mt0sMf4lVFMTrS7szX9JsXsV8VP/KT/ruK7xssPYRgM5OQ1TQOvpRRU02uap57efT1GpaFS/0R/oUhqmDB58lZWIQPe76uk/aCl3fnu+/2yjs2Nkqvp1dPPs+Pn1wb8Jfu+65FV91FR88btZD+p9K9FkjU0RQ2ffOy9fyhBROYi/f+9uYjInTsiL+SFPH88e275v/J4IF6+XWFs/6/ff/438f8CnSCrxYvHoUwAAAAASUVORK5CYII=';
const TERMS='Declaro que estou ciente que devo interromper minhas tarefas exercendo o direito de recusa sempre que constatar evidências de riscos graves e iminentes e informar imediatamente o fato ao meu supervisor, que diligenciará as medidas cabíveis. Estou ciente ainda das informações e determinações contidas nesta APR e da obrigatoriedade em atendê-las.';
const step=()=>({activity:'',risk:'',prevention:''}),person=()=>({date:'',name:'',role:'',signature:''});
const APPROVER_NAME='Jonatas Marques de Arruda';
const author=()=>({name:'',role:''}),approver=()=>({name:APPROVER_NAME,signature:''});
const TBM_DEFAULT={name:'TBM S A INDUSTRIA TEXTIL',address:'BR-163, S/N - KM 109, Parque Industrial Vetorasso, Rondonópolis-MT',cnpj:''};
const cuiabaDay=()=>{const p=Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:'America/Cuiaba',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()).filter(x=>['year','month','day'].includes(x.type)).map(x=>[x.type,x.value]));return p.year+'-'+p.month+'-'+p.day};
function tbmData(){const c=get('tbm_cipa_management_v2',{});return {name:String(c.company||TBM_DEFAULT.name),cnpj:String(c.cnpj||''),address:String(c.address||TBM_DEFAULT.address)}}
function fresh(){const c=tbmData();return{id:id(),kind:'sst-apr',companyRef:'tbm',companyType:'tbm',establishment:c.name,place:'',service:'',date:cuiabaDay(),number:'',address:c.address,cnpj:c.cnpj,steps:[step(),step(),step(),step()],people:[person(),person(),person(),person(),person(),person()],authors:[{name:APPROVER_NAME,role:'Técnico de Segurança do Trabalho'},author()],approvals:[approver()],photos:[],createdAt:new Date().toISOString(),updatedAt:'',cloudStamp:''}}
let records=get(STORE,{}),pending=get(PENDING,[]),current=fresh(),syncBusy=false,syncPromise=null,typing=null,companies=get(COMPANIES,{}),companyPending=get(COMPANY_QUEUE,[]),numberPromise=null,savePromise=null;
if(!records||typeof records!=='object'||Array.isArray(records))records={};
if(!Array.isArray(pending))pending=[];
if(!companies||typeof companies!=='object'||Array.isArray(companies))companies={};if(!Array.isArray(companyPending))companyPending=[];
function cache(){try{localStorage.setItem(STORE,JSON.stringify(records));localStorage.setItem(PENDING,JSON.stringify(pending));localStorage.setItem(COMPANIES,JSON.stringify(companies));localStorage.setItem(COMPANY_QUEUE,JSON.stringify(companyPending));return true}catch(e){notice('⚠️ Limite de armazenamento do navegador. Confira espaço antes de adicionar assinaturas.',true);return false}}
function notice(txt,warn=false){const n=$('aprNotice');if(n){n.textContent=txt;n.style.background=warn?'#fff7ed':'#eefcf3';n.style.color=warn?'#9a3412':'#166534'}}

const QUOTA_KEY='tbm_apr_firestore_quota_cooldown_v1';
let quotaUntil=Number(get(QUOTA_KEY,0))||0;
const isQuota=e=>/resource-exhausted|quota exceeded|daily quota|cota excedida/i.test(String(e?.code||'')+' '+String(e?.message||e||''));
function markQuota(err){
 if(!isQuota(err))return false;
 quotaUntil=Date.now()+30*60*1000;
 try{localStorage.setItem(QUOTA_KEY,JSON.stringify(quotaUntil))}catch(_){}
 return true;
}
function quotaPaused(){return Date.now()<quotaUntil}
function quotaNotice(){
 const minutes=Math.max(1,Math.ceil((quotaUntil-Date.now())/60000));
 notice('⚠️ Limite de operações do Firebase atingido (Quota exceeded). O rascunho da APR está no aparelho, mas as alterações NÃO foram confirmadas na nuvem.'+(current.number?' Nº reservado anteriormente: '+current.number+'.':' O número oficial ainda depende da nuvem.')+' As tentativas automáticas foram suspensas por '+minutes+' minuto(s). Isso NÃO significa que a cota será liberada nesse prazo. Confira Firebase → Firestore → Uso. Visualizar PDF, baixar e salvar no aparelho continuam disponíveis.',true);
}
function clearQuota(){quotaUntil=0;try{localStorage.removeItem(QUOTA_KEY)}catch(_){}}

function remember(){current.updatedAt=new Date().toISOString();records[current.id]=C(current);const ok=cache();if(ok)notice('💾 APR preservada neste aparelho. A nuvem ainda não foi confirmada.');return ok}
function schedule(){clearTimeout(typing);typing=setTimeout(remember,380)}
function normalize(x){const z={...fresh(),...C(x||{})};z.steps=Array.isArray(x?.steps)?x.steps.map(o=>({...step(),...o})):[];z.people=Array.isArray(x?.people)?x.people.map(o=>({...person(),...o})):[];z.authors=[0,1].map(i=>({...author(),...x?.authors?.[i]}));z.approvals=Array.isArray(x?.approvals)&&x.approvals.length?x.approvals.map(a=>({...approver(),...a})): [approver()];z.photos=Array.isArray(x?.photos)?x.photos.map(p=>({...p})):[];return z}

// As APRs antigas permanecem nos registros originais. A interface e novos PDFs
// mostram apenas a aprovação técnica, usando a assinatura já vinculada ao técnico.
function approvalEntry(r){
 const items=Array.isArray(r?.approvals)?r.approvals:[];
 return items.length>1?items[1]||approver():items[0]||approver();
}
function setApprovalSignature(r,signature){
 const items=Array.isArray(r.approvals)?r.approvals:[];
 const index=items.length>1?1:0;
 const old=items[index]||approver();
 items[index]={...old,name:APPROVER_NAME,signature};
 r.approvals=items;
}

function companyChoice(){
 const list=Object.values(companies).filter(x=>x&&x.name&&!x.deleted).sort((a,b)=>String(a.name).localeCompare(String(b.name),'pt-BR'));
 return '<div class="aprCompanySelect"><label><b>Empresa executante / estabelecimento</b><select id="aprCompanyChoice"><option value="tbm" '+(current.companyRef==='tbm'?'selected':'')+'>TBM — dados da empresa</option>'+list.map(x=>'<option value="'+E(x.id)+'" '+(current.companyRef===x.id?'selected':'')+'>'+E(x.name)+'</option>').join('')+'<option value="_new">➕ Cadastrar empresa terceirizada</option></select></label><div><button class="aprBtn secondary" id="aprCompanyNew" type="button">🏢 Cadastrar terceirizada</button></div></div><div id="aprCompanyEditor" class="aprCompanyEditor" hidden><div class="aprFields"><label><b>Nome da empresa *</b><input id="aprNewCompanyName" maxlength="160"></label><label><b>CNPJ (opcional)</b><input id="aprNewCompanyCnpj" maxlength="22" inputmode="numeric"></label><label><b>Endereço / sede (opcional)</b><input id="aprNewCompanyAddress" maxlength="240"></label><div><b>Cadastro de terceiros</b><p class="aprHint">Ao salvar, os dados estarão disponíveis na próxima APR. Não altera o cadastro principal da TBM.</p></div></div><div class="aprActions"><button class="aprBtn green" type="button" id="aprCompanyStore">💾 Salvar empresa</button><button class="aprBtn secondary" type="button" id="aprCompanyCancel">Cancelar</button></div></div>';
}
function applyCompany(ref){
 if(ref==='tbm'){const c=tbmData();current.companyRef='tbm';current.companyType='tbm';current.establishment=c.name;current.cnpj=c.cnpj;current.address=c.address}
 else {const c=companies[ref];if(!c||c.deleted)return;current.companyRef=c.id;current.companyType='third-party';current.establishment=c.name;current.cnpj=c.cnpj||'';current.address=c.address||''}
 remember();render();
}
function storeCompany(){
 const name=$('aprNewCompanyName')?.value.trim(),cnpj=$('aprNewCompanyCnpj')?.value.trim()||'',address=$('aprNewCompanyAddress')?.value.trim()||'';
 if(!name)return notice('Informe o nome da terceirizada antes de salvar.',true);
 if(cnpj&&cnpj.replace(/\D/g,'').length!==14)return notice('CNPJ incompleto. Informe 14 dígitos ou deixe em branco.',true);
 const cid='terceira-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7);
 companies[cid]={id:cid,name,cnpj,address,updatedAt:new Date().toISOString()};
 companyPending.push(cid);cache();applyCompany(cid);
 syncCompanies().catch(()=>{});
}
async function syncCompanies(){
 if(!companyPending.length)return;
 const f=await firestore();if(!f)throw Error('Firebase indisponível para empresas.');
 for(const key of companyPending.slice()){
  const company=companies[key];if(!company){companyPending=companyPending.filter(x=>x!==key);continue}
  const ref=f.collection('inspections').doc('_sst_apr_empresa_'+key);
  await ref.set({kind:'sst-apr-company',...company},{merge:true});
  const check=await ref.get({source:'server'});
  if(!check.exists||check.data()?.updatedAt!==company.updatedAt)throw Error('Cadastro da terceirizada não confirmado.');
  companyPending=companyPending.filter(x=>x!==key);cache();
 }
}
async function loadCompanies(){
 try{
  await syncCompanies();const f=await firestore();if(!f)return;
  const snap=await f.collection('inspections').where('kind','==','sst-apr-company').get({source:'server'});
  if(snap.metadata?.fromCache)throw Error('Empresas em cache.');
  for(const d of snap.docs){const x=d.data();if(x?.id&&!companyPending.includes(x.id)&&(!companies[x.id]||String(x.updatedAt)>=String(companies[x.id].updatedAt||'')))companies[x.id]={id:x.id,name:x.name,cnpj:x.cnpj||'',address:x.address||'',updatedAt:x.updatedAt,deleted:!!x.deleted}}
  cache();
  if($('aprCompanyChoice')){const selected=current.companyRef;const block=$('aprCompanyChoice');const wrapper=document.createElement('div');wrapper.innerHTML=companyChoice();block.innerHTML=wrapper.querySelector('select').innerHTML;block.value=selected}
 }catch(e){console.warn('[APR EMPRESAS]',e)}
}
async function pullTBM(){
 try{
  const f=await firestore();if(!f)return;
  const d=await f.collection('inspections').doc('_cipa_management_current').get({source:'server'});
  const c=d.data()?.payload;
  if(!d.metadata?.fromCache&&c?.company&&current.companyRef==='tbm'&&!records[current.id]){
   current.establishment=String(c.company);current.cnpj=String(c.cnpj||'');current.address=String(c.address||'');render();
  }
 }catch(e){console.warn('[APR DADOS TBM]',e)}
}
function fmtNum(n){return String(n).padStart(4,'0')}
const quotaHit=error=>/(quota[\s_-]*exceed|resource[\s_-]*exhausted|cota.*esgotad|limite.*excedido|RESOURCE_EXHAUSTED)/i.test(String(error?.code||'')+' '+String(error?.message||error||''));
let quotaWarningShown=false;
function describeCloudError(error){
 if(quotaHit(error)){
  quotaWarningShown=true;
  return '⚠️ Limite de uso do Firebase atingido (Quota exceeded). O banco recusou a gravação. A APR permanece no aparelho e o PDF pode ser gerado agora, mas a numeração oficial e a sincronização só serão confirmadas quando a cota estiver disponível. Confira Firestore → Uso no Firebase Console.';
 }
 if(/permission[\s_-]*denied|permiss[aã]o negada/i.test(String(error?.code||'')+' '+String(error?.message||error||'')))
  return '⚠️ Firebase recusou a permissão de gravação. A APR permanece no aparelho. Verifique autenticação e regras de acesso.';
 return '⚠️ Firebase indisponível: '+String(error?.message||error||'Falha desconhecida')+'. Documento local preservado; tente sincronizar novamente.';
}
async function reserveNumber(record=current){
 if(record.number)return record.number;
 if(numberPromise&&record.id===current.id)return numberPromise;
 const issue=async()=>{
  const f=await firestore();
  if(!f)throw Error('Firebase indisponível');
  const counter=f.collection('inspections').doc('_sst_apr_sequence_v1');
  const aprRef=f.collection('inspections').doc('_sst_apr_'+record.id);
  // Não faça uma busca de todas as APRs a cada emissão. Isso consome a cota de leituras.
  // Faça uma única consulta histórica apenas na migração inicial se o contador não existir.
  let initialMax=0;
  const counterCheck=await counter.get({source:'server'});
  if(counterCheck.metadata?.fromCache)throw Error('Contador APR indisponível na nuvem.');
  if(!counterCheck.exists){
   const existing=await f.collection('inspections').where('kind','==','sst-apr').limit(100).get({source:'server'});
   if(existing.size>=100)throw Error('Há muitas APRs anteriores sem contador. O administrador precisa inicializar a sequência antes de gerar um novo número.');
   if(existing.metadata?.fromCache)throw Error('Histórico indisponível para inicializar a sequência.');
   for(const item of existing.docs){
    const match=String(item.data()?.payload?.number||'').match(/\d+/);
    initialMax=Math.max(initialMax,Number(match?.[0]||0));
   }
  }
  let number='';
  await f.runTransaction(async tx=>{
   // Todas as leituras devem ocorrer antes de qualquer escrita na transação.
   const seqSnap=await tx.get(counter),old=await tx.get(aprRef);
   const previous=old.exists?old.data()?.payload?.number:'';
   if(previous){number=String(previous);return}
   const seq=Math.max(Number(seqSnap.data()?.lastNumber||0),initialMax)+1;
   number=String(seq).padStart(4,'0');
   tx.set(counter,{kind:'sst-apr-sequence',lastNumber:seq,updatedAt:firebase.firestore.FieldValue.serverTimestamp()},{merge:true});
   tx.set(aprRef,{kind:'sst-apr',payload:{...C(record),number},number,updatedAt:record.updatedAt||record.createdAt,cloudUpdatedAt:firebase.firestore.FieldValue.serverTimestamp()},{merge:true});
  });
  const verified=await aprRef.get({source:'server'});
  if(verified.metadata?.fromCache||!verified.exists||verified.data()?.number!==number)throw Error('Servidor não confirmou o número da APR.');
  record.number=number;
  record.cloudStamp=String(verified.data().updatedAt||record.createdAt);
  if(records[record.id]){records[record.id].number=number;records[record.id].cloudStamp=record.cloudStamp}
  cache();
  if(record.id===current.id){
   current.number=number;
   const field=document.querySelector('[data-ahead="number"]');if(field)field.value=number;
   const retry=$('aprRetryNumber');if(retry)retry.hidden=true;
  }
  return number;
 };
 const call=issue();
 if(record.id===current.id)numberPromise=call;
 try{return await call}finally{if(record.id===current.id)numberPromise=null}
}
async function ensureDraftNumber(){
 const rec=current;
 const field=document.querySelector('[data-ahead="number"]');
 if(field&&!rec.number)field.placeholder='Reservando número no Firebase...';
 try{await reserveNumber(rec)}
 catch(e){
  if(rec.id!==current.id)return;
  const el=document.querySelector('[data-ahead="number"]');if(el)el.placeholder='PENDENTE — sem conexão com a nuvem';
  const button=$('aprRetryNumber');if(button)button.hidden=false;
  notice('⚠️ Não foi possível reservar o número oficial. O rascunho e o PDF continuam acessíveis. Use Tentar novamente. Motivo: '+String(e.message||e),true);
 }
}
function photoMarkup(){
 const photos=(current.photos||[]).filter(p=>!p.deleted);
 return '<div class="aprCard" id="aprPhotosSection"><div class="aprCardTop"><h3>6. REGISTRO FOTOGRÁFICO DA APR</h3><div class="aprActions"><button id="aprChoosePhotos" class="aprBtn secondary" type="button">📷 Adicionar fotos</button><input id="aprPhotoFiles" type="file" accept="image/*" multiple style="display:none"></div></div><p class="aprHint">Até 15 fotografias por APR, com descrição individual, compactação e armazenamento separado na nuvem. As imagens integram o PDF.</p><div id="aprPhotosGallery"><p class="aprHint">'+photos.length+' imagem(ns) vinculada(s) a esta APR.</p></div></div>';
}
async function loadPhotos(){
 const gallery=$('aprPhotosGallery');if(!gallery)return;
 if(!window.TBMAPRPhotos)return gallery.innerHTML='<p class="aprHint">Módulo de fotografias ainda não carregado.</p>';
 const displayedId=current.id;
 try{await window.TBMAPRPhotos.decorate(gallery,current);if(current.id!==displayedId)return}
 catch(e){notice('⚠️ Fotos indisponíveis: '+String(e.message||e),true)}
}

function field(label,key,type='text',extra=''){return '<label class="aprField"><b>'+E(label)+'</b><input data-ahead="'+key+'" type="'+type+'" value="'+E(current[key])+'" maxlength="180" '+extra+'></label>'}
function textarea(title,item,key,value){return '<label><b>'+E(title)+'</b><textarea rows="4" maxlength="5000" data-astep="'+item+'" data-field="'+key+'" placeholder="Preencher aqui...">'+E(value)+'</textarea></label>'}
function stepRows(){return current.steps.map((v,i)=>'<section class="aprRow"><div class="aprRowTitle"><strong>Item '+String(i+1).padStart(2,'0')+'</strong><button type="button" data-del-step="'+i+'" class="aprRemove">Excluir etapa</button></div><div class="aprStepGrid">'+
textarea('Descrever as atividades passo à passo de cada etapa',i,'activity',v.activity)+
textarea('Descrever os Riscos Potenciais (o que poderá sair errado)',i,'risk',v.risk)+
textarea('Descrever as Medidas Preventivas necessárias (Evitar o acidente ou minimizar os danos, caso ocorra)',i,'prevention',v.prevention)+'</div></section>').join('')}
function peopleRows(){return current.people.map((v,i)=>'<section class="aprRow"><div class="aprRowTitle"><strong>Colaborador '+String(i+1).padStart(2,'0')+'</strong><button type="button" class="aprRemove" data-del-person="'+i+'">Remover linha</button></div><div class="aprPeopleGrid"><label><b>DATA</b><input type="date" data-aperson="'+i+'" data-field="date" value="'+E(v.date)+'"></label><label><b>Nome do Colaborador</b><input data-aperson="'+i+'" data-field="name" maxlength="160" value="'+E(v.name)+'"></label><label><b>Função</b><input data-aperson="'+i+'" data-field="role" maxlength="140" value="'+E(v.role)+'"></label><div><b>Assinatura</b><button type="button" class="aprSign" data-sign="person:'+i+'">'+(v.signature?'✓ Assinatura registrada • Editar':'✍ Assinar com dedo ou mouse')+'</button></div></div></section>').join('')}
function switchTab(which){
 const root=$('aprPremium');if(!root)return;
 const tab=['form','photos','signature'].includes(which)?which:'form';
 root.dataset.activeTab=tab;
 for(const name of ['Form','Photos','Signature'])$('aprTab'+name)?.classList.toggle('on',name.toLowerCase()===tab);
 const signatureSection=$('aprSignatureSection');
 if(signatureSection)signatureSection.hidden=tab!=='signature';
 if(tab==='signature')renderSignatureTab();
 if(tab==='photos')loadPhotos().catch(console.warn);
}
function renderSignatureTab(){
 const section=$('aprSignatureSection');
 if(!section)return;
 const signed=approvalEntry(current).signature||'';
 section.innerHTML='<h3>✍ Assinatura de aprovação da APR</h3>'+
  '<p class="aprApprovalName">'+E(APPROVER_NAME)+'</p>'+
  '<p class="aprSignHelp">Assine abaixo com o dedo, caneta digital ou mouse. A assinatura ficará vinculada a esta APR. Toque em <b>☁️ Salvar APR</b> para enviar documento e assinatura à nuvem.</p>'+
  '<canvas class="aprSignatureCanvas" id="aprTechnicalSignatureCanvas" width="1000" height="300" aria-label="Área para assinatura de Jonatas Marques de Arruda"></canvas>'+
  '<div class="aprActions"><button type="button" class="aprBtn secondary" id="aprSignatureClear">🧹 Limpar assinatura</button></div>'+
  '<p class="aprSignStatus" id="aprSignatureStatus" aria-live="polite">'+(signed?'✅ Assinatura registrada nesta APR.':'✍ Assine no espaço acima.')+'</p>';
 const canvas=$('aprTechnicalSignatureCanvas');if(!canvas)return;
 const ctx=canvas.getContext('2d');if(!ctx)return;
 const blank=()=>{ctx.fillStyle='#ffffff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.strokeStyle='#152238';ctx.lineWidth=3.4;ctx.lineCap='round';ctx.lineJoin='round'};
 blank();
 if(signed&&signed.startsWith('data:image/')){
  const img=new Image();img.onload=()=>ctx.drawImage(img,0,0,canvas.width,canvas.height);img.onerror=()=>blank();img.src=signed;
 }
 let drawing=false,hasInk=false;
 const point=e=>{const b=canvas.getBoundingClientRect();return [(e.clientX-b.left)*canvas.width/b.width,(e.clientY-b.top)*canvas.height/b.height]};
 const persist=()=>{
  if(!hasInk)return;
  setApprovalSignature(current,canvas.toDataURL('image/png'));
  remember();
  const status=$('aprSignatureStatus');
  if(status)status.textContent='✅ Assinatura registrada nesta APR. Toque em Salvar APR para sincronizar.';
  const tab=$('aprTabSignature');if(tab)tab.textContent='✍ Assinatura ✓';
 };
 canvas.addEventListener('pointerdown',e=>{
  e.preventDefault();drawing=true;hasInk=true;
  try{canvas.setPointerCapture(e.pointerId)}catch(_){}
  const [x,y]=point(e);ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+.1,y+.1);ctx.stroke();
 });
 canvas.addEventListener('pointermove',e=>{
  if(!drawing)return;e.preventDefault();const [x,y]=point(e);ctx.lineTo(x,y);ctx.stroke();
 });
 canvas.addEventListener('pointerup',e=>{if(!drawing)return;e.preventDefault();drawing=false;persist()});
 canvas.addEventListener('pointercancel',()=>{drawing=false;persist()});
 $('aprSignatureClear').onclick=()=>{
  if(!confirm('Limpar a assinatura de '+APPROVER_NAME+' desta APR?'))return;
  drawing=false;hasInk=false;blank();setApprovalSignature(current,'');remember();
  const status=$('aprSignatureStatus');if(status)status.textContent='✍ Assinatura retirada. Assine novamente antes de concluir.';
  const tab=$('aprTabSignature');if(tab)tab.textContent='✍ Assinatura';
 };
}

function render(){
 const root=$('aprContent');if(!root)return;
 root.innerHTML='<div class="aprCard"><h3>1- IDENTIFICAÇÃO DO SERVIÇO:</h3>'+companyChoice()+'<div class="aprFields">'+
 field('Identificação do Estabelecimento','establishment')+field('Local do Serviço','place')+
 field('Tipo de Serviço','service')+field('Data','date','date')+field('Nº DA APR • numeração automática','number','text','readonly aria-readonly="true" placeholder="Gerado automaticamente ao salvar na nuvem"')+
 field('Endereço para o rodapé','address')+field('CNPJ para o rodapé','cnpj')+
 '</div><p class="aprHint">Nova APR em branco. Os dados preenchidos no documento modelo (2019) não são copiados.</p></div>'+
 '<div class="aprCard"><div class="aprCardTop"><h3>2. PLANEJAMENTO DAS ETAPAS:</h3><button type="button" class="aprBtn secondary" id="aprAddStep">➕ Adicionar etapa</button></div><p class="aprHint">Tabela premium em quatro colunas no PDF, com cabeçalho repetido e ajuste de texto.</p><div>'+stepRows()+'</div></div>'+
 '<div class="aprCard"><div class="aprCardTop"><h3>3. IDENTIFICAÇÃO DA EQUIPE EXECUTANTE DO SERVIÇO:</h3><button type="button" class="aprBtn secondary" id="aprAddPerson">➕ Adicionar colaborador</button></div>'+peopleRows()+'<p class="aprTerm">'+E(TERMS)+'</p></div>'+
 '<div class="aprCard"><h3>4. ELABORAÇÃO:</h3><div class="aprTwo">'+current.authors.map((a,i)=>'<div class="aprRole"><b>Elaborador '+(i+1)+'</b><label><b>Nome completo</b><input data-aauthor="'+i+'" data-field="name" value="'+E(a.name)+'"></label><label><b>Função</b><input data-aauthor="'+i+'" data-field="role" value="'+E(a.role)+'"></label></div>').join('')+'</div></div>'+
 '<div class="aprCard"><h3>5. APROVAÇÃO:</h3><div class="aprRole"><b>Responsável Técnico da Empresa — SESMT Nº 74.2 – TBM</b><p class="aprApprovalName">'+APPROVER_NAME+'</p><p class="aprHint">Assinatura: '+(approvalEntry(current).signature?'✅ Registrada':'Pendente')+'. Use a aba ✍ Assinatura para assinar com o dedo ou mouse.</p><button type="button" class="aprBtn secondary" data-open-signature-tab="1">✍ Ir para assinatura</button></div></div>'+photoMarkup();
 if($('aprPremium')?.dataset.activeTab==='photos')loadPhotos().catch(console.warn);
 const deleteButton=$('aprDeleteCurrent');if(deleteButton)deleteButton.hidden=!(records[current.id]&&current.cloudStamp&&!pending.includes(current.id));
 const active=(current.photos||[]).filter(p=>!p.deleted).length;const tab=$('aprTabPhotos');if(tab)tab.textContent='📷 Fotos e evidências ('+active+')';
 const signatureLabel=$('aprTabSignature');if(signatureLabel)signatureLabel.textContent='✍ Assinatura'+(approvalEntry(current).signature?' ✓':'');
 if($('aprPremium')?.dataset.activeTab==='signature')renderSignatureTab();
}
function styles(){
 if($('aprPremiumCss'))return;
 const e=document.createElement('style');e.id='aprPremiumCss';
 e.textContent='#aprPremium{position:fixed;inset:0;z-index:9200;overflow:auto;background:#edf1f6;color:#14243b;font-family:Inter,Arial,sans-serif}#aprPremium *{box-sizing:border-box}#aprPremium .aprHeader{position:sticky;top:0;z-index:2;background:#8b1018;color:white;padding:15px 20px}#aprPremium .aprHeaderRow{max-width:1350px;margin:auto;display:flex;flex-wrap:wrap;justify-content:space-between;gap:10px;align-items:center}#aprPremium .aprHeader h2{color:white;font-size:20px;margin:0}#aprPremium .aprHeader p{color:#ffe7e7;font-size:12px;margin:4px 0}#aprPremium .aprWrap{max-width:1350px;margin:auto;padding:17px}#aprPremium button{font-family:inherit;cursor:pointer}#aprPremium .aprActions{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px}#aprPremium .aprBtn{border:0;background:#8b1018;color:#fff;font-weight:850;padding:10px 14px;border-radius:9px;font-size:13px;min-height:41px}#aprPremium .aprBtn.secondary{background:#e1e9f2;color:#182b42;border:1px solid #b8c6d6}#aprPremium .aprBtn.blue{background:#205599}#aprPremium .aprBtn.green{background:#197347}#aprPremium .aprCard{background:#fff;border:1px solid #d7e1eb;border-radius:14px;padding:17px;margin:13px 0;box-shadow:0 5px 16px #1728380a}#aprPremium .aprCard h3{font-size:16px;color:#74121d;font-weight:900;margin:0 0 13px}#aprPremium .aprCardTop{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:9px}#aprPremium .aprFields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}#aprPremium label{display:block;min-width:0}#aprPremium label>b,#aprPremium .aprPeopleGrid div>b{display:block;font-size:13px;font-weight:850;margin:0 0 6px;color:#182c45}#aprPremium input,#aprPremium textarea{width:100%;padding:10px;border:1px solid #aabacc;border-radius:9px;font-size:14px;color:#112033;background:white;line-height:1.45}#aprPremium textarea{min-height:105px;resize:vertical}#aprPremium .aprHint{font-size:12px;color:#64748b;line-height:1.55}#aprPremium .aprRow{padding:13px;margin:10px 0;background:#f8fafc;border:1px solid #d6dfe9;border-radius:11px}#aprPremium .aprRowTitle{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:10px}#aprPremium .aprRowTitle strong{font-size:14px;color:#821b22}#aprPremium .aprRemove{border:0;border-radius:8px;padding:8px 10px;font-size:12px;background:#fee2e2;color:#991b1b;font-weight:850}#aprPremium .aprStepGrid{display:grid;grid-template-columns:1.2fr 1fr 1.2fr;gap:12px}#aprPremium .aprPeopleGrid{display:grid;grid-template-columns:135px 1.2fr 1fr 205px;align-items:end;gap:10px}#aprPremium .aprSign{border:1px dashed #93abc4;background:#ecf3ff;border-radius:8px;color:#174b91;padding:10px;width:100%;min-height:42px;font-size:12px;font-weight:800}#aprPremium .aprTerm{padding:15px;background:#f2f6fb;border-left:4px solid #8b1018;font-size:13px;line-height:1.7}#aprPremium .aprTwo{display:grid;grid-template-columns:1fr 1fr;gap:12px}#aprPremium .aprRole{padding:12px;border:1px solid #dbe3ed;border-radius:9px}#aprPremium .aprRole>b{font-size:13px;display:block;margin-bottom:10px}#aprPremium .aprRole label{margin-top:9px}#aprPremium #aprNotice{padding:11px;border:1px solid #cbd5e1;border-radius:9px;margin-bottom:13px;font-size:12px;font-weight:800;line-height:1.6}#aprPremium .aprHistory{display:none}#aprPremium .aprHistory.show{display:block}#aprPremium .aprHistoryRow{display:flex;gap:10px;flex-wrap:wrap;align-items:center;justify-content:space-between;border-bottom:1px solid #dbe4ee;padding:10px}#aprPremium .aprHistoryRow strong{font-size:13px}#aprPremium .aprHistoryRow small{display:block;font-size:12px;color:#64748b;margin-top:4px}#aprSigDialog{position:fixed;inset:0;z-index:101000;background:#121b2bcc;display:flex;justify-content:center;align-items:center;padding:12px}#aprSigDialog .aprSigBox{max-width:680px;width:100%;background:white;color:#1e293b;border-radius:13px;padding:18px}#aprSigDialog canvas{display:block;width:100%;height:180px;touch-action:none;background:white;border:2px solid #91a5bc;border-radius:9px;margin:12px 0}#aprSigDialog .aprSigButtons{display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap}#aprSigDialog button{border:0;border-radius:8px;padding:10px;background:#e2e8f0;color:#1e293b;font-weight:850}#aprSigDialog button.primary{background:#8b1018;color:white}@media(max-width:970px){#aprPremium .aprPeopleGrid{grid-template-columns:1fr 1fr}}@media(max-width:680px){#aprPremium .aprWrap{padding:9px}#aprPremium .aprCard{padding:12px}#aprPremium .aprFields,#aprPremium .aprStepGrid,#aprPremium .aprPeopleGrid,#aprPremium .aprTwo{grid-template-columns:1fr}#aprPremium .aprActions .aprBtn{flex:1 1 42%}#aprPremium .aprCardTop .aprBtn{width:100%}}';
 e.textContent+='#aprPremium .aprCompanySelect{display:flex;flex-wrap:wrap;align-items:end;gap:12px;margin:10px 0 16px}#aprPremium .aprCompanySelect label{flex:1;min-width:220px}#aprPremium .aprCompanySelect select{width:100%;padding:10px;min-height:42px;border-radius:8px;border:1px solid #aabacc;color:#172638;background:white;font-size:14px}#aprPremium .aprCompanyEditor{background:#f8fafc;border:1px dashed #94a3b8;padding:13px;border-radius:10px;margin:12px 0}#aprPremium .aprCompanyEditor[hidden]{display:none}#aprPremium .aprPhotosGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}#aprPremium .aprPhotoCard{border:1px solid #d4dde8;border-radius:11px;padding:9px;background:#fafcff;display:flex;flex-direction:column;gap:8px}#aprPremium .aprPhotoBox{width:100%;aspect-ratio:4/3;display:flex;align-items:center;justify-content:center;background:#e2e8f0;border-radius:8px;overflow:hidden;color:#64748b;font-size:12px}#aprPremium .aprPhotoBox img{width:100%;height:100%;object-fit:contain}#aprPremium .aprPhotoCard label{flex:1}#aprPremium .aprPhotoCard textarea{min-height:60px}#aprPremium .aprPhotoStatus{font-size:11px;color:#64748b}#aprPremium .aprHistory .aprActions{margin:0}#aprPremium .aprHistoryRow .aprBtn{padding:9px} @media(max-width:950px){#aprPremium .aprPhotosGrid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:630px){#aprPremium .aprPhotosGrid{grid-template-columns:1fr}}';
 e.textContent+='#aprPremium .aprHistory{scroll-margin-top:130px;border:2px solid #becbdc}#aprPremium .aprHistory .aprCardTop{margin-bottom:8px}#aprPremium .aprHistory .aprCardTop h3{margin:0}#aprPremium .aprHistoryRow .aprActions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}#aprPremium .aprHistoryRow .aprBtnDelete{background:#b91c1c;color:#fff;border:2px solid #991b1b;min-height:44px}#aprPremium .aprHistoryRow .aprBtnDelete:disabled{opacity:.55;cursor:wait}@media(max-width:680px){#aprPremium .aprHistoryRow{align-items:stretch;flex-direction:column}#aprPremium .aprHistoryRow>.aprActions{width:100%;justify-content:stretch}#aprPremium .aprHistoryRow>.aprActions>.aprBtn{flex:1 1 45%;min-width:120px}}';
 e.textContent+='#aprPremium .aprTabs{display:flex;flex-wrap:wrap;gap:8px;padding:6px 0 5px}#aprPremium .aprTab{background:#fff;border:1px solid #bac8d8;color:#18324e;padding:11px 14px;border-radius:10px;font-weight:900;font-size:13px}#aprPremium .aprTab.on{background:#8b1018;border-color:#8b1018;color:white}#aprPremium[data-active-tab="form"] #aprPhotosSection{display:none}#aprPremium[data-active-tab="photos"] #aprContent>.aprCard:not(#aprPhotosSection){display:none}';
 e.textContent+='#aprPremium .aprSignatureCanvas{width:100%;height:190px;touch-action:none;display:block;background:#fff;border:2px solid #8da3ba;border-radius:8px;margin:12px 0;cursor:crosshair}#aprPremium .aprApprovalName{font-size:16px;font-weight:900;color:#14243b;margin:8px 0}#aprPremium #aprSignatureSection[hidden]{display:none}#aprPremium #aprSignatureSection{max-width:100%;margin:12px 0}#aprPremium[data-active-tab="signature"] #aprContent{display:none}#aprPremium .aprSignHelp{font-size:13px;line-height:1.5;color:#314155}#aprPremium .aprSignStatus{font-weight:800;font-size:13px;color:#197347}';
 document.head.appendChild(e);
}
function mount(){
 if($('aprMenu'))return;
 styles();const b=document.createElement('button');b.type='button';b.id='aprMenu';b.className='tile safety';b.innerHTML='<div class="ico">📋</div><div><b>APR • Análise Preliminar de Risco</b><span>Etapas, riscos, assinaturas e PDF premium</span></div>';b.onclick=open;document.querySelector('#home .tiles')?.appendChild(b);
}
function open(){
 if($('aprPremium'))return;
 styles();const p=document.createElement('section');p.id='aprPremium';p.innerHTML='<div class="aprHeader"><div class="aprHeaderRow"><div><h2>APR — ANÁLISE PRELIMINAR DE RISCO</h2><p>Modelo TBM • quatro colunas • A4 horizontal</p></div><button class="aprBtn secondary" id="aprClose" type="button">← Voltar ao SST</button></div></div><div class="aprWrap"><div class="aprActions"><button class="aprBtn" id="aprNew" type="button">➕ Nova APR</button><button class="aprBtn green" id="aprSave" type="button">☁️ Salvar APR</button><button class="aprBtn blue" id="aprPreview" type="button">👁️ Visualizar PDF</button><button class="aprBtn secondary" id="aprDownload" type="button">📥 Baixar PDF</button><button class="aprBtn secondary" id="aprHistoryButton" type="button">📂 Histórico</button><button class="aprBtn secondary" style="background:#fee2e2;color:#991b1b" id="aprDeleteCurrent" type="button" hidden>🗑️ Excluir APR salva</button></div><div id="aprNotice"></div><section id="aprHistoryPanel" class="aprCard aprHistory" aria-label="Histórico de APRs"></section><div class="aprTabs"><button class="aprTab on" id="aprTabForm" type="button">📝 Formulário da APR</button><button class="aprTab" id="aprTabSignature" type="button">✍ Assinatura</button><button class="aprTab" id="aprTabPhotos" type="button">📷 Fotos e evidências</button></div><section id="aprSignatureSection" class="aprCard" hidden></section><div id="aprContent"></div></div>';p.dataset.activeTab='form';document.body.appendChild(p);render();bind();notice('APR pronta. Toque em Salvar APR para gerar o número oficial e sincronizar automaticamente com a nuvem. Se o Firebase estiver indisponível, o rascunho será preservado neste aparelho.');if(quotaPaused())quotaNotice();else Promise.allSettled([loadCompanies(),pullTBM()]).catch(console.warn)
}
function bind(){
 $('aprClose').onclick=()=>{clearTimeout(typing);$('aprPremium')?.remove()};
 $('aprTabForm').onclick=()=>switchTab('form');
 $('aprTabSignature').onclick=()=>switchTab('signature');
 $('aprTabPhotos').onclick=()=>switchTab('photos');
 $('aprNew').onclick=()=>{if(!confirm('Criar nova APR? O número será gerado ao tocar em Salvar APR. O rascunho atual será preservado neste dispositivo.'))return;remember();current=fresh();$('aprPremium').dataset.activeTab='form';render();notice('Nova APR criada. O número será gerado ao salvar.')};
 $('aprSave').onclick=save;
 $('aprPreview').onclick=()=>pdf(current);
 $('aprDownload').onclick=()=>downloadPdf(current).catch(e=>notice('⚠️ '+String(e.message||e),true));
 $('aprDeleteCurrent').onclick=()=>deleteApr(current.id);
 $('aprHistoryButton').onclick=()=>{
  const panel=$('aprHistoryPanel');if(!panel)return;
  if(panel.classList.contains('show')){panel.classList.remove('show');return}
  list();panel.classList.add('show');
  try{panel.scrollIntoView({behavior:'smooth',block:'start'})}catch(_){}
  // Consultar a nuvem somente se ela estiver disponível.
  if(!quotaPaused())loadCloud(false).catch(console.warn);
 };
 $('aprPremium').addEventListener('input',e=>{
 const x=e.target,k=x.dataset.field;
 if(x.dataset.ahead&&x.dataset.ahead!=='number'){current[x.dataset.ahead]=x.value;schedule()}
 else if(x.dataset.astep!==undefined&&k){current.steps[+x.dataset.astep][k]=x.value;schedule()}
 else if(x.dataset.aperson!==undefined&&k){current.people[+x.dataset.aperson][k]=x.value;schedule()}
 else if(x.dataset.aauthor!==undefined&&k){current.authors[+x.dataset.aauthor][k]=x.value;schedule()}
 else if(x.dataset.aapproval!==undefined&&k){current.approvals[+x.dataset.aapproval][k]=x.value;schedule()}
 else if(x.dataset.photoCaption){const p=current.photos.find(p=>p.id===x.dataset.photoCaption);if(p){p.caption=x.value;p.synced=false;schedule()}}
 });
 $('aprPremium').addEventListener('change',async e=>{
  const x=e.target;
  if(x.id==='aprCompanyChoice'){if(x.value==='_new'){$('aprCompanyEditor').hidden=false;return}applyCompany(x.value)}
  if(x.id==='aprPhotoFiles'){
   const files=Array.from(x.files||[]);x.value='';if(!files.length)return;
   const userId=current.id;
   try{await window.TBMAPRPhotos.add(current,files);if(current.id!==userId)return;remember();await loadPhotos();notice('📷 Foto(s) registradas no aparelho; salve APR para sincronizar na nuvem.')}
   catch(err){notice('⚠️ '+String(err.message||err),true);await loadPhotos().catch(()=>{})}
  }
 });
 $('aprPremium').addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b)return;
 if(b.id==='aprAddStep'){current.steps.push(step());remember();render()}
 else if(b.id==='aprCompanyNew'){$('aprCompanyEditor').hidden=false;$('aprNewCompanyName')?.focus()}
 else if(b.id==='aprCompanyCancel'){$('aprCompanyEditor').hidden=true;$('aprCompanyChoice').value=current.companyRef}
 else if(b.id==='aprCompanyStore'){storeCompany()}
 else if(b.id==='aprChoosePhotos'){$('aprPhotoFiles')?.click()}
 else if(b.dataset.photoRemove){if(confirm('Excluir a fotografia desta APR?')){window.TBMAPRPhotos.remove(current,b.dataset.photoRemove).then(()=>{remember();loadPhotos().catch(()=>{})})}}
 else if(b.dataset.downloadApr){downloadPdf(records[b.dataset.downloadApr]).catch(e=>notice(String(e.message||e),true))}
 else if(b.dataset.deleteApr){
  const selectedId=b.dataset.deleteApr;
  b.disabled=true;b.textContent='⏳ Excluindo...';
  deleteApr(selectedId).catch(e=>notice('⚠️ '+String(e.message||e),true))
   .finally(()=>{if(b.isConnected){b.disabled=false;b.textContent='🗑️ Excluir'}})
 }
 else if(b.dataset.aprHistoryClose){$('aprHistoryPanel')?.classList.remove('show')}
 else if(b.dataset.openSignatureTab){switchTab('signature')}
 else if(b.id==='aprAddPerson'){current.people.push(person());remember();render()}
 else if(b.dataset.delStep!==undefined){if(current.steps.length<2)return alert('Mantenha pelo menos uma etapa.');if(confirm('Excluir a etapa selecionada?')){current.steps.splice(+b.dataset.delStep,1);remember();render()}}
 else if(b.dataset.delPerson!==undefined){if(confirm('Remover a linha e a assinatura deste colaborador?')){current.people.splice(+b.dataset.delPerson,1);remember();render()}}
 else if(b.dataset.sign)sign(b.dataset.sign);
 else if(b.dataset.openApr){remember();current=normalize(records[b.dataset.openApr]);switchTab('form');render();$('aprHistoryPanel').classList.remove('show')}
 else if(b.dataset.pdfApr)pdf(records[b.dataset.pdfApr]);
 });
}
function sign(pointer){
 const parts=pointer.split(':'),type=parts[0],i=Number(parts[1]);
 const target=type==='person'?current.people[i]:current.approvals[i];if(!target)return;
 const dialog=document.createElement('div');dialog.id='aprSigDialog';
 dialog.innerHTML='<div class="aprSigBox"><h3>✍ Assinatura do '+(type==='person'?'colaborador':'responsável')+'</h3><p>Assine com o dedo ou mouse.</p><canvas id="aprSignCanvas" width="1000" height="300"></canvas><div class="aprSigButtons"><button type="button" id="aprSigErase">Limpar</button><button type="button" id="aprSigCancel">Cancelar</button><button type="button" class="primary" id="aprSigStore">Salvar assinatura</button></div></div>';
 document.body.appendChild(dialog);
 const c=$('aprSignCanvas'),ctx=c.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,c.width,c.height);ctx.strokeStyle='#152238';ctx.lineWidth=3.5;ctx.lineCap='round';ctx.lineJoin='round';
 let down=false,hasInk=!!target.signature;
 if(target.signature){const image=new Image();image.onload=()=>ctx.drawImage(image,0,0,c.width,c.height);image.src=target.signature}
 const point=e=>{const box=c.getBoundingClientRect();return[(e.clientX-box.left)*c.width/box.width,(e.clientY-box.top)*c.height/box.height]};
 c.onpointerdown=e=>{e.preventDefault();down=true;c.setPointerCapture(e.pointerId);const p=point(e);ctx.beginPath();ctx.moveTo(p[0],p[1]);ctx.lineTo(p[0]+.1,p[1]+.1);ctx.stroke();hasInk=true};
 c.onpointermove=e=>{if(!down)return;e.preventDefault();const p=point(e);ctx.lineTo(p[0],p[1]);ctx.stroke()};
 c.onpointerup=()=>down=false;c.onpointercancel=()=>down=false;
 $('aprSigErase').onclick=()=>{ctx.fillStyle='#fff';ctx.fillRect(0,0,c.width,c.height);hasInk=false};
 $('aprSigCancel').onclick=()=>dialog.remove();
 $('aprSigStore').onclick=()=>{if(!hasInk)return alert('Desenhe a assinatura antes de salvar.');target.signature=c.toDataURL('image/png');remember();render();dialog.remove()};
}
async function firestore(){return typeof window.ensureFirestore==='function'?await window.ensureFirestore():window.SST?.fs}
async function save(){
 if(savePromise)return savePromise;
 const aprId=current.id;
 const btn=$('aprSave');
 savePromise=(async()=>{
  if(btn){btn.disabled=true;btn.textContent='⏳ Gerando número e salvando...'}
  try{
   clearTimeout(typing);
   if(!remember())return false;
   if(!pending.includes(aprId))pending.push(aprId);
   if(!cache()){notice('⚠️ Não foi possível guardar esta APR neste dispositivo. Libere espaço e tente novamente.',true);return false}
   notice('☁️ Salvando APR e reservando o número oficial na nuvem...');
   // O clique explícito em Salvar permite uma nova tentativa mesmo durante pausa de quota.
   // Somente sincronizações automáticas devem respeitar o cooldown.
   if(quotaPaused())clearQuota();
   const saved=await send(aprId);
   if(!saved)return false;
   const record=records[aprId];
   if(!record?.number||pending.includes(aprId)){
    notice('⚠️ O servidor ainda não confirmou o número e o salvamento. Verifique a conexão e tente novamente.',true);
    return false;
   }
   if(current.id===aprId){
    current.number=record.number;current.cloudStamp=record.cloudStamp;
    const field=document.querySelector('[data-ahead="number"]');if(field)field.value=record.number;
    if($('aprPremium'))render();
   }
   if($('aprHistoryPanel')?.classList.contains('show'))list();
   notice('✅ APR nº '+record.number+' salva e confirmada no Firebase. O PDF utilizará este mesmo número.');
   return true;
  }catch(e){
   console.error('[APR SALVAR]',e);
   notice('⚠️ APR mantida no aparelho, mas não confirmada na nuvem: '+String(e.message||e)+'. Tente salvar novamente.',true);
   return false;
  }finally{
   if(btn){btn.disabled=false;btn.textContent='☁️ Salvar APR'}
  }
 })();
 try{return await savePromise}finally{savePromise=null}
}
// Reserva o número E salva a APR na mesma transação. Não emitir duas transações
// nem fazer leituras de verificação: a transação resolvida já é confirmação do servidor.
async function writeAPRAtomic(record,firestoreDb){
 const ref=firestoreDb.collection('inspections').doc('_sst_apr_'+record.id);
 const counter=firestoreDb.collection('inspections').doc('_sst_apr_sequence_v1');
 const snapshot=C(record);
 if(!snapshot.updatedAt)snapshot.updatedAt=new Date().toISOString();
 let initialMax=0;
 if(!snapshot.number){
  // Consulta inicial apenas para migração de bases antigas sem contador.
  const check=await counter.get({source:'server'});
  if(check.metadata?.fromCache)throw Error('Contador APR não confirmado no servidor.');
  if(!check.exists){
   const history=await firestoreDb.collection('inspections').where('kind','==','sst-apr').limit(100).get({source:'server'});
   if(history.metadata?.fromCache||history.size>=100)throw Error('Não foi possível inicializar o contador com segurança. Confira a numeração histórica.');
   for(const doc of history.docs){
    const value=String(doc.data()?.number||doc.data()?.payload?.number||'').match(/^\d+$/);
    initialMax=Math.max(initialMax,Number(value?.[0]||0));
   }
  }
 }
 let assigned='';
 const transaction=firestoreDb.runTransaction(async tx=>{
  // Firestore: ler tudo antes de efetuar qualquer escrita.
  const [old,seq]=await Promise.all([
   tx.get(ref),
   !snapshot.number?tx.get(counter):Promise.resolve(null)
  ]);
  const previous=old.exists?old.data():null;
  if(previous?.kind&&previous.kind!=='sst-apr')throw Error('ID de APR incompatível com registro existente.');
  if(previous?.payload?.id&&previous.payload.id!==snapshot.id)throw Error('Documento da nuvem pertence a outra APR.');
  const remoteNumber=String(previous?.number||previous?.payload?.number||'');
  if(snapshot.number&&remoteNumber&&remoteNumber!==snapshot.number)throw Error('Número da APR divergente da nuvem.');
  if(previous?.updatedAt&&previous.updatedAt!==snapshot.cloudStamp&&previous.updatedAt!==snapshot.updatedAt)
   throw Error('APR modificada em outro aparelho. Sincronize o histórico antes de sobrescrever.');
  assigned=remoteNumber||snapshot.number;
  if(!assigned){
   const next=Math.max(Number(seq?.data()?.lastNumber||0),initialMax)+1;
   assigned=String(next).padStart(4,'0');
   tx.set(counter,{kind:'sst-apr-sequence',lastNumber:next,updatedAt:firebase.firestore.FieldValue.serverTimestamp()},{merge:true});
  }
  tx.set(ref,{
   kind:'sst-apr',number:assigned,
   payload:{...snapshot,number:assigned,cloudStamp:snapshot.updatedAt},
   updatedAt:snapshot.updatedAt,
   cloudUpdatedAt:firebase.firestore.FieldValue.serverTimestamp()
  },{merge:true});
 });
 let timeoutId;
 try{
  await Promise.race([
   transaction,
   new Promise((_,reject)=>{timeoutId=setTimeout(()=>reject(Error('Tempo limite de conexão ao Firebase. O rascunho permanece local; confira a nuvem antes de tentar novamente.')),18000)})
  ]);
 }finally{if(timeoutId)clearTimeout(timeoutId)}
 record.number=assigned;record.cloudStamp=snapshot.updatedAt;
 return assigned;
}
async function send(focusId){
 if(syncPromise){
  await syncPromise;
  return focusId?!pending.includes(focusId):!pending.length;
 }
 syncPromise=(async()=>{
  if(!pending.length)return true;
  if(quotaPaused()){quotaNotice();return false}
  let db;
  try{db=await firestore();if(!db)throw Error('Firebase indisponível.')}
  catch(e){
   if(markQuota(e)){quotaNotice();return false}
   notice('⚠️ Firebase indisponível. A APR permanece guardada neste aparelho: '+String(e.message||e),true);return false;
  }
  // Sincronizar a empresa do cadastro em fluxo independente, sem bloquear a APR.
  if(companyPending.length)syncCompanies().catch(e=>console.warn('[APR EMPRESA PENDENTE]',e));
  const ids=focusId&&pending.includes(focusId)?[focusId,...pending.filter(id=>id!==focusId)]:pending.slice();
  let confirmed=0,focusConfirmed=false;
  const problems=[];
  for(const key of ids){
   const record=records[key];
   if(!record){pending=pending.filter(x=>x!==key);cache();continue}
   try{
    notice('☁️ Salvando APR no Firebase e gerando o número oficial...');
    if(window.TBMAPRPhotos)await window.TBMAPRPhotos.saveToCloud(record,db);
    // Guardar localmente o resultado das fotos para não reenviá-las se a APR tiver erro de cota.
    cache();
    const stamp=record.updatedAt;
    const number=await writeAPRAtomic(record,db);
    // Não apagar edições realizadas enquanto uma gravação estava em andamento.
    const latest=records[key];
    if(latest&&latest.updatedAt===stamp){
     latest.number=number;latest.cloudStamp=stamp;latest.photos=record.photos;
     if(current.id===key&&current.updatedAt===stamp){
      current.number=number;current.cloudStamp=stamp;current.photos=record.photos;
      const field=document.querySelector('[data-ahead="number"]');if(field)field.value=number;
     }
     pending=pending.filter(id=>id!==key);
     confirmed++;
     if(key===focusId)focusConfirmed=true;
    }else{
     if(latest){latest.number=number;latest.cloudStamp=stamp}
     problems.push('APR nº '+number+' recebeu alterações durante o salvamento. Salve novamente para enviar a versão mais recente.');
    }
    clearQuota();cache();
   }catch(e){
    console.error('[APR SALVAR]',key,e);
    if(markQuota(e)){quotaNotice();problems.push('Limite de operações Firebase excedido.');break}
    problems.push('APR '+(record.number||'pendente')+': '+String(e.message||e));
    if(current.id===key&&!record.number){const retry=$('aprRetryNumber');if(retry)retry.hidden=false}
   }
  }
  if(problems.length){
   if(quotaPaused())quotaNotice();
   else notice('⚠️ '+problems[0]+' Os dados permanecem salvos no aparelho.',true);
  }else if(confirmed)notice('✅ APR nº '+(records[focusId||current.id]?.number||'')+' salva na nuvem. Número pronto para PDF.');
  if($('aprPremium')&&confirmed&&current.cloudStamp===current.updatedAt)render();
  return focusId?focusConfirmed:problems.length===0;
 })();
 try{return await syncPromise}finally{syncPromise=null}
}
async function loadCloud(show){
 if(quotaPaused()){if(show)quotaNotice();return false}
 if(show)notice('↻ Consultando histórico da APR...');
 try{
 await send();await loadCompanies();const f=await firestore();if(!f)throw Error('Firebase indisponível.');
 const snap=await f.collection('inspections').where('kind','==','sst-apr').limit(100).get({source:'server'});
 if(snap.metadata?.fromCache)throw Error('Apenas dados em cache foram retornados.');
 let count=0;
 for(const doc of snap.docs){
 const remote=doc.data();const p=remote?.payload;if(!p?.id||pending.includes(p.id))continue;
 if(records[p.id]&&String(records[p.id].updatedAt||'')>String(p.updatedAt||''))continue;
 records[p.id]=normalize({...p,cloudStamp:remote.updatedAt||p.updatedAt});count++;
 }
 cache();if($('aprHistoryPanel')?.classList.contains('show'))list();
 if(show)notice('✅ Consulta confirmada: '+snap.size+' APR(s) encontradas'+(snap.size>=100?' (exibindo até 100 nesta consulta)':'')+' na nuvem. '+count+' registro(s) conciliados.');
 }catch(e){if(show)notice('⚠️ Histórico indisponível na nuvem: '+String(e.message||e),true)}
}
async function deleteDraftLocal(aprId){
 if(savePromise||syncPromise){notice('⚠️ Aguarde a sincronização atual terminar antes de excluir um rascunho.',true);return false}
 const record=records[aprId];if(!record)return false;
 if(record.cloudStamp||record.number){
  notice('⚠️ Esta APR pode existir na nuvem e possui alterações pendentes. Sincronize antes de excluir.',true);
  return false;
 }
 const label='APR local — '+(record.service||record.place||'sem descrição');
 if(!confirm('Excluir o rascunho '+label+' deste aparelho?\\nAs fotos armazenadas no aparelho também serão removidas. Esta ação não exclui documentos da nuvem.'))return false;
 const wasPending=pending.includes(aprId);
 pending=pending.filter(id=>id!==aprId);
 delete records[aprId];
 if(!cache()){
  records[aprId]=record;if(wasPending)pending.push(aprId);
  cache();notice('⚠️ Exclusão não confirmada no aparelho; rascunho restaurado.',true);return false;
 }
 try{await window.TBMAPRPhotos?.purgeLocal?.(record)}
 catch(e){console.warn('[APR FOTOS EXCLUSÃO LOCAL]',e)}
 if(current.id===aprId){current=fresh();render()}
 if($('aprHistoryPanel')?.classList.contains('show'))list();
 notice('✅ Rascunho excluído do aparelho. Nenhuma exclusão foi enviada ao Firebase.');
 return true;
}
async function deleteApr(aprId){
 if(savePromise||syncPromise){notice('⚠️ Aguarde o salvamento em andamento terminar antes de excluir.',true);return false}
 const record=records[aprId];
 if(!record){notice('APR não encontrada para exclusão.',true);return false}
 if(!record.cloudStamp&&!record.number)return deleteDraftLocal(aprId);
 if(pending.includes(aprId)||record.updatedAt!==record.cloudStamp){notice('⚠️ Esta APR tem alterações não sincronizadas. Salve e confirme a nuvem antes de excluir.',true);return false}
 const label='APR nº '+(record.number||'sem número')+' — '+(record.service||'sem descrição do serviço');
 if(!confirm('ATENÇÃO — exclusão definitiva\n\n'+label+'\n\nA APR e suas fotos serão excluídas da nuvem e do histórico. Esta ação não pode ser desfeita e o número não será reutilizado.\n\nDeseja realmente excluir?'))return false;
 try{
  notice('🗑️ Conferindo documento e removendo APR na nuvem...');
  const f=await firestore();if(!f)throw Error('Firebase indisponível. Não é seguro excluir apenas localmente.');
  const ref=f.collection('inspections').doc('_sst_apr_'+aprId);
  const snap=await ref.get({source:'server'});
  if(snap.metadata?.fromCache)throw Error('Verificação da APR retornou apenas cache.');
  if(snap.exists){
   const remote=snap.data()||{};
   if(remote.kind!=='sst-apr'||remote.payload?.id!==aprId)throw Error('Identificação da APR não corresponde ao registro da nuvem.');
   if(remote.updatedAt!==record.cloudStamp)throw Error('A APR foi modificada em outro equipamento. Clique em Sincronizar antes de excluir.');
   const pictures=Array.isArray(remote.payload?.photos)?remote.payload.photos:[];
   const localPictures=Array.isArray(record.photos)?record.photos:[];
   const ids=[...new Set([...pictures,...localPictures].map(p=>p?.id).filter(Boolean))];
   const batch=f.batch();batch.delete(ref);
   for(const photoId of ids)batch.delete(f.collection('inspections').doc('_sst_apr_photo_'+aprId+'_'+photoId));
   const tombstone=f.collection('inspections').doc('_sst_apr_deleted_'+aprId);
   batch.set(tombstone,{kind:'sst-apr-deletion-log',aprId,number:record.number||'',deletedAt:firebase.firestore.FieldValue.serverTimestamp()});
   await batch.commit(); // Confirmação do servidor. Não reler o documento após excluir.
  }
  // Uma eventual falha na limpeza de imagens do aparelho não pode recriar
  // a APR que já foi definitivamente apagada do Firebase.
  try{await window.TBMAPRPhotos?.purgeLocal?.(record)}
  catch(imageErr){console.warn('[APR IMAGENS LOCAIS]',imageErr)}
  delete records[aprId];
  pending=pending.filter(x=>x!==aprId);
  cache();
  if(current.id===aprId){current=fresh();render();notice('APR excluída. Novo documento em branco; o número será gerado ao salvar.')}
  if($('aprHistoryPanel')?.classList.contains('show'))list();
  notice('✅ '+label+' excluída da nuvem e do histórico. O número não será reutilizado.');
  return true;
 }catch(err){
  console.error('[APR EXCLUSÃO]',err);
  notice('⚠️ A exclusão não foi confirmada. O registro foi mantido no histórico: '+String(err.message||err),true);
  return false;
 }
}

function list(){
 const root=$('aprHistoryPanel');if(!root)return;
 const a=Object.values(records).filter(x=>x&&!x.deleted).sort((x,y)=>String(y.updatedAt||'').localeCompare(String(x.updatedAt||'')));
 root.innerHTML='<div class="aprCardTop"><h3>📂 Histórico das APRs</h3><button type="button" class="aprBtn secondary" data-apr-history-close="1" aria-label="Fechar histórico">✕ Fechar histórico</button></div><p class="aprHint">Selecione a APR para editar, visualizar, baixar ou excluir. A exclusão é confirmada antes de remover dados.</p>'+
 (a.length?a.map(v=>'<div class="aprHistoryRow"><div><strong>APR '+E(v.number||'sem número')+' • '+E(v.service||'Serviço não informado')+'</strong><small>'+E(v.place||'Local a preencher')+' • '+E(v.date||'Sem data')+' • '+(pending.includes(v.id)?'⚠️ Pendente de sincronização':v.cloudStamp?'☁️ Confirmada':'💾 Local')+'</small></div><div class="aprActions"><button type="button" class="aprBtn secondary" data-open-apr="'+E(v.id)+'">Editar</button><button type="button" class="aprBtn blue" data-pdf-apr="'+E(v.id)+'">👁️ Visualizar PDF</button><button type="button" class="aprBtn green" data-download-apr="'+E(v.id)+'">📥 Baixar PDF</button>'+'<button type="button" class="aprBtn aprBtnDelete" data-delete-apr="'+E(v.id)+'" aria-label="Excluir APR '+E(v.number||'rascunho')+'">🗑️ Excluir</button>'+'</div></div>').join(''):'<p>Nenhuma APR cadastrada.</p>');
}
const displayDate=v=>{const m=String(v||'').match(/^(\d{4})-(\d{2})-(\d{2})$/);return m?m[3]+'/'+m[2]+'/'+m[1]:''};
const textCell=(str,opt={})=>({text:String(str||' '),fontSize:opt.size||10.3,bold:!!opt.bold,alignment:opt.align||'left',color:'#141c2b',margin:[0,6,0,6]});
const emptyCell=s=>s?textCell(s):{text:' ',margin:[0,11,0,11],fontSize:10};
async function logo(){return APR_TBM_LOGO;}
// Linhas exclusivamente vazias são campos do editor, não páginas obrigatórias do PDF.
// Preservar integralmente todas as etapas e assinaturas que têm algum preenchimento.
function aprVisibleSteps(record){
 const all=Array.isArray(record?.steps)?record.steps:[];
 const real=all.filter(p=>['activity','risk','prevention'].some(k=>String(p?.[k]||'').trim()));
 return real.length?real:[step()]; // Um espaço em branco, sem nove itens vazios.
}
function aprVisiblePeople(record){
 const all=Array.isArray(record?.people)?record.people:[];
 const real=all.filter(p=>['date','name','role','signature'].some(k=>String(p?.[k]||'').trim()));
 return real.length?real:[person(),person()]; // Dois campos para assinatura em formulário não preenchido.
}
function definition(record,logoImage){
 // APR tradicional TBM: mesmo formulário quadriculado do documento de referência.
 const r=normalize(record),isTbm=r.companyRef==='tbm'||r.companyType==='tbm';
 const width='*', border='#505050',ink='#111111';
 const company=isTbm?'TBM S A INDUSTRIA TEXTIL':(r.establishment||'________________________________');
 const address=isTbm?'Rodovia BR 163 km 109 – S/N – Zona Rural – Rondonópolis/MT.':(r.address||'Endereço: ______________________________________________');
 const cnpj=isTbm?'CNPJ 07.671.092/0015-86':(r.cnpj?'CNPJ '+r.cnpj:'CNPJ __________________________');
 const tableLayout={
  hLineWidth:()=>0.65,vLineWidth:()=>0.65,hLineColor:()=>border,vLineColor:()=>border,
  paddingLeft:()=>4,paddingRight:()=>4,paddingTop:()=>2.4,paddingBottom:()=>2.4
 };
 const c=(text,options={})=>({
  text:text||' ',fontSize:9.1,color:ink,alignment:options.align||'left',
  margin:options.margin||[0,3.5,0,3.5],bold:!!options.bold
 });
 const line=(name,value,options={})=>({
  text:[{text:name,bold:true},{text:' '+(value||' ')}],
  fontSize:9.1,color:ink,margin:options.margin||[0,2.2,0,2.2]
 });
 const title=(text,breakBefore=false)=>({
  text,bold:true,fontSize:10.2,color:ink,margin:[0,5,0,3],
  ...(breakBefore?{pageBreak:'before'}:{})
 });
 const stages=[
  [
   'Item',
   'Descrever as atividades passo à passo de cada etapa',
   'Descrever os Riscos Potenciais\n(o que poderá sair errado)',
   'Descrever as Medidas Preventivas necessárias (Evitar o acidente ou minimizar os danos, caso ocorra)'
  ].map(t=>c(t,{bold:true,align:'center',margin:[0,2,0,2]}))
 ];
 aprVisibleSteps(r).forEach((item,i)=>{
  stages.push([
   c(String(i+1).padStart(2,'0'),{align:'center',margin:[0,8,0,8]}),
   c(item.activity,{margin:[0,8,0,8]}),
   c(item.risk,{margin:[0,8,0,8]}),
   c(item.prevention,{margin:[0,8,0,8]})
  ]);
 });
 const people=[
  ['DATA','Nome do Colaborador','Função','Assinatura']
   .map(x=>c(x,{bold:true,align:'center',margin:[0,2,0,2]}))
 ];
 aprVisiblePeople(r).forEach(p=>{
  people.push([
   c(displayDate(p.date),{align:'center',margin:[0,5,0,5]}),
   c(p.name,{margin:[0,5,0,5]}),
   c(p.role,{margin:[0,5,0,5]}),
   p.signature?{image:p.signature,fit:[152,29],alignment:'center',margin:[0,1,0,1]}:c(' ',{margin:[0,7,0,7]})
  ]);
 });
 const approverSignature=approvalEntry(r);
 const signatureStack=[];
 if(approverSignature.signature)signatureStack.push({image:approverSignature.signature,fit:[230,42],alignment:'center'});
 else signatureStack.push({text:' ',margin:[0,0,0,30]});
 signatureStack.push({text:APPROVER_NAME,alignment:'center',fontSize:9.5,bold:true,margin:[0,2,0,0]});
 const approvalSignatures=[{stack:signatureStack,margin:[0,3,0,1]}];
 const approvalLabels=[
  {text:'Responsável Técnico da Empresa\nSESMT Nº 74.2 – TBM',alignment:'center',bold:true,fontSize:9.1,color:ink,margin:[0,2,0,3]}
 ];
 return{
  pageSize:'A4',pageOrientation:'landscape',
  pageMargins:[40,76,40,49],
  defaultStyle:{font:'Roboto',fontSize:9.1,color:ink,lineHeight:1.0},
  header:()=>({
   columns:[
    logoImage?{image:logoImage,fit:[83,40],width:95,margin:[18,0,0,0]}:{text:'TBM',bold:true,italic:true,fontSize:18,width:95,margin:[18,8,0,0]},
    {text:'APR – ANÁLISE PRELIMINAR DE RISCO',bold:true,alignment:'center',fontSize:16.5,color:ink,margin:[0,13,0,0]},
    {text:' ',width:95}
   ],margin:[40,20,40,0]
  }),
  footer:(page,pages)=>({
   columns:[
    {text:' ',width:52},
    {
     stack:[
      {text:company,bold:true,alignment:'center',fontSize:7.9,color:ink},
      {text:address,alignment:'center',fontSize:7.7,color:ink},
      {text:cnpj,alignment:'center',fontSize:7.7,color:ink}
     ],width
    },
    {text:String(page),alignment:'right',width:52,fontSize:8,color:ink,margin:[0,15,0,0]}
   ],margin:[48,4,48,0]
  }),
  content:[
   title('1- IDENTIFICAÇÃO DO SERVIÇO:'),
   {table:{
     widths:['54%','46%'],heights:()=>18.5,
     body:[
      [{...line('Identificação do Estabelecimento:',r.establishment),colSpan:2},{}],
      [{...line('Local do Serviço:',r.place),colSpan:2},{}],
      [{...line('Tipo de Serviço:',r.service),colSpan:2},{}],
      [line('Data:',displayDate(r.date)),line('Nº DA APR:',r.number||'________________')]
     ]
    },layout:tableLayout},
   title('2. PLANEJAMENTO DAS ETAPAS:'),
   {table:{
     headerRows:1,keepWithHeaderRows:1,dontBreakRows:true,
     heights:(row)=>row===0?26:(aprVisibleSteps(r)[row-1]?.activity||aprVisibleSteps(r)[row-1]?.risk||aprVisibleSteps(r)[row-1]?.prevention?30:27),
     widths:[39,308,187,'*'],body:stages
    },layout:tableLayout},
   title('3. IDENTIFICAÇÃO DA EQUIPE EXECUTANTE DO SERVIÇO:'),
   {table:{
     headerRows:1,keepWithHeaderRows:1,dontBreakRows:true,
     heights:(row)=>row===0?20:22,
     widths:[100,255,179,'*'],body:people
    },layout:tableLayout},
   {text:TERMS,fontSize:9.1,color:ink,alignment:'justify',margin:[1,4,1,5],lineHeight:1.0},
   title('4. ELABORAÇÃO:'),
   {table:{
     widths:['53%','47%'],
     body:(r.authors||[author(),author()]).map(a=>[
      line('Nome completo:',a.name),
      line('Função:',a.role)
     ])
    },layout:tableLayout},
   title('5. APROVAÇÃO:'),
   {table:{widths:['*'],heights:(row)=>row===0?51:24,body:[approvalSignatures,approvalLabels]},layout:tableLayout}
  ]
 };
}

let pdfLoader=null;
async function ensurePdfEngine(){
 // O index importa pdfmake e fontes. Evitar CDNs adicionais no clique,
 // pois no Android o carregamento externo podia demorar excessivamente.
 return !!(window.pdfMake&&typeof window.pdfMake.createPdf==='function');
}
function aprSheetFooter(r,n){
 const isTbm=r.companyRef==='tbm'||r.companyType==='tbm';
 const establishment=isTbm?'TBM S A INDUSTRIA TEXTIL':(r.establishment||'_____________________');
 const address=isTbm?'Rodovia BR 163 km 109 – S/N – Zona Rural – Rondonópolis/MT.':(r.address||'Endereço: ______________________________');
 const cnpj=isTbm?'CNPJ 07.671.092/0015-86':(r.cnpj?'CNPJ '+r.cnpj:'CNPJ: __________________');
 return '<div class="aprSheetFooter"><div class="aprSheetOrg"><b>'+E(establishment)+'</b><div>'+E(address)+'</div><div>'+E(cnpj)+'</div></div><span class="aprPageNumber">'+n+'</span></div>';
}
function aprSheetHeader(){
 const src=APR_TBM_LOGO;
 return '<div class="aprSheetHead"><img src="'+src+'" alt="TBM" onerror="this.style.display=\'none\'"><h1>APR – ANÁLISE PRELIMINAR DE RISCO</h1></div>';
}
function fallbackHtml(r,images=[]){
 const stages=aprVisibleSteps(r);
 const workers=aprVisiblePeople(r);
 const header=['Item','Descrever as atividades passo à passo de cada etapa',
  'Descrever os Riscos Potenciais (o que poderá sair errado)',
  'Descrever as Medidas Preventivas necessárias (Evitar o acidente ou minimizar os danos, caso ocorra)'];
 const td=t=>'<td>'+E(t||'')+'</td>';
 const rows=stages.map((x,i)=>'<tr class="aprStepPrint"><td class="aprItemNumber">'+String(i+1).padStart(2,'0')+'</td>'+td(x.activity)+td(x.risk)+td(x.prevention)+'</tr>').join('');
 const people=workers.map(x=>'<tr class="aprWorkerPrint">'+td(displayDate(x.date))+td(x.name)+td(x.role)+
   '<td class="aprSignatureCell">'+(x.signature?'<img class="sign" src="'+E(x.signature)+'" alt="Assinatura">':'')+'</td></tr>').join('');
 const authors=[0,1].map(i=>{const x=r.authors?.[i]||{};return '<tr><td><b>Nome completo:</b> '+E(x.name||'')+'</td><td><b>Função:</b> '+E(x.role||'')+'</td></tr>'}).join('');
 const currentApprover=approvalEntry(r);
 const approvalTop='<td class="aprApprovalTop">'+
  (currentApprover.signature?'<img class="sign" src="'+E(currentApprover.signature)+'" alt="Assinatura">':'<div class="aprSignatureBlank"></div>')+
  '<div><b>'+E(APPROVER_NAME)+'</b></div></td>';
 const approvalBottom='<td class="aprApprovalLabel"><b>Responsável Técnico da Empresa<br>SESMT Nº 74.2 – TBM</b></td>';
 const first='<section class="aprSheetPage">'+aprSheetHeader()+
  '<h2>1- IDENTIFICAÇÃO DO SERVIÇO:</h2>'+
  '<table class="aprGridTable aprIdentity"><tbody>'+
  '<tr><td colspan="2"><b>Identificação do Estabelecimento:</b> '+E(r.establishment||'')+'</td></tr>'+
  '<tr><td colspan="2"><b>Local do Serviço:</b> '+E(r.place||'')+'</td></tr>'+
  '<tr><td colspan="2"><b>Tipo de Serviço:</b> '+E(r.service||'')+'</td></tr>'+
  '<tr><td><b>Data:</b> '+E(displayDate(r.date))+'</td><td><b>Nº DA APR:</b> '+E(r.number||'PENDENTE')+'</td></tr>'+
  '</tbody></table><h2>2. PLANEJAMENTO DAS ETAPAS:</h2>'+
  '<table class="aprGridTable aprStepsTable"><colgroup><col style="width:5%"><col style="width:42%"><col style="width:25%"><col style="width:28%"></colgroup>'+
  '<thead><tr>'+header.map(t=>'<th>'+E(t)+'</th>').join('')+'</tr></thead><tbody>'+rows+'</tbody></table>';
 const second=
  '<h2>3. IDENTIFICAÇÃO DA EQUIPE EXECUTANTE DO SERVIÇO:</h2>'+
  '<table class="aprGridTable aprWorkersTable"><colgroup><col style="width:13%"><col style="width:34%"><col style="width:24%"><col style="width:29%"></colgroup>'+
  '<thead><tr><th>DATA</th><th>Nome do Colaborador</th><th>Função</th><th>Assinatura</th></tr></thead><tbody>'+people+'</tbody></table>'+
  '<p class="aprTermPrint">'+E(TERMS)+'</p>'+
  '<h2>4. ELABORAÇÃO:</h2><table class="aprGridTable aprAuthorsTable"><tbody>'+authors+'</tbody></table>'+
  '<h2>5. APROVAÇÃO:</h2><table class="aprGridTable aprApprovalTable"><tbody><tr>'+approvalTop+'</tr><tr>'+approvalBottom+'</tr></tbody></table>'+
  aprSheetFooter(r,'1')+'</section>';
 return '<div class="aprPrintDoc">'+first+second+'</div>';
}
async function showFallback(r,reason){
 const list=[]; // Abrir a prévia imediatamente, sem esperar fotos ou CDN.
 const prior=$('aprPrintFallback');if(prior)prior.remove();
 const overlay=document.createElement('div');overlay.id='aprPrintFallback';
 overlay.style.cssText='position:fixed;inset:0;z-index:9999999;background:#e9eff5;overflow:auto;color:#101827;padding:12px;font-family:Arial,sans-serif';
 overlay.innerHTML='<div class="aprPrintControls" style="background:white;border:1px solid #b9c7d6;border-radius:9px;padding:12px;display:flex;gap:8px;flex-wrap:wrap;position:sticky;top:0;z-index:1"><strong style="flex:1">Prévia APR • modo compatível</strong><button type="button" id="aprFallbackPrint" style="background:#166534;color:white;border:0;padding:10px 14px;border-radius:8px;font-weight:bold">🖨️ Imprimir / Salvar como PDF</button><button type="button" id="aprFallbackClose" style="padding:10px;border:1px solid #94a3b8;border-radius:8px">Fechar</button></div><p class="aprPrintControls" style="font-size:12px">Se a geração automática estiver indisponível, use Imprimir → Destino: Salvar como PDF.</p>'+fallbackHtml(r,list);
 document.body.appendChild(overlay);
 const styleId='aprFallbackPrintStyle';
 const prev=$(styleId);if(prev)prev.remove();
 const css=document.createElement('style');css.id=styleId;
 css.textContent="\n#aprPrintFallback .aprPrintDoc{width:min(100%,1122px);margin:12px auto;background:transparent;box-shadow:none;padding:0}\n#aprPrintFallback .aprSheetPage{position:relative;box-sizing:border-box;min-height:500px;background:#fff;margin:0 0 17px;padding:36px 42px 68px;box-shadow:0 2px 12px #0002;color:#111;font-family:Arial,sans-serif}\n#aprPrintFallback .aprSheetHead{height:62px;position:relative;display:flex;align-items:flex-start}\n#aprPrintFallback .aprSheetHead img{position:absolute;left:0;top:0;max-width:92px;height:48px;object-fit:contain}\n#aprPrintFallback .aprSheetHead h1{font-size:17px!important;line-height:1.3;text-align:center!important;margin:11px 100px 0!important;flex:1;font-weight:800;color:#111}\n#aprPrintFallback .aprSheetPage h2{font-size:12px!important;font-weight:800!important;color:#111!important;margin:10px 0 5px!important}\n#aprPrintFallback .aprSheetPage .aprGridTable{border-collapse:collapse;table-layout:fixed;width:100%;margin:0;background:#fff}\n#aprPrintFallback .aprSheetPage .aprGridTable th,#aprPrintFallback .aprSheetPage .aprGridTable td{border:1px solid #595959;padding:4px 5px;vertical-align:middle;line-height:1.22;font-size:11px;color:#111;text-align:left;background:#fff!important;white-space:pre-wrap;overflow-wrap:anywhere}\n#aprPrintFallback .aprSheetPage .aprGridTable th{text-align:center;font-weight:800}\n#aprPrintFallback .aprSheetPage .aprStepsTable .aprStepPrint td{height:27px;vertical-align:top;padding-top:5px}\n#aprPrintFallback .aprSheetPage .aprStepsTable .aprItemNumber{text-align:center;vertical-align:top}\n#aprPrintFallback .aprSheetPage .aprWorkersTable .aprWorkerPrint td{height:30px}\n#aprPrintFallback .aprSheetPage .aprApprovalTop{text-align:center!important;height:78px;vertical-align:bottom!important}\n#aprPrintFallback .aprSheetPage .aprApprovalTop b{display:block}#aprPrintFallback .aprSheetPage .aprApprovalLabel{text-align:center!important;vertical-align:middle!important;height:27px}\n#aprPrintFallback .aprSheetPage .aprSignatureBlank{height:47px}\n#aprPrintFallback .aprSheetPage .sign{max-width:165px;max-height:45px;object-fit:contain}\n#aprPrintFallback .aprSheetPage .aprTermPrint{font-size:11px;text-align:justify;line-height:1.26;margin:7px 0 8px}\n#aprPrintFallback .aprSheetFooter{position:absolute;bottom:20px;left:48px;right:48px;display:flex;align-items:flex-end;justify-content:center;font-size:9.5px;color:#111;line-height:1.24}\n#aprPrintFallback .aprSheetFooter .aprSheetOrg{text-align:center}\n#aprPrintFallback .aprSheetFooter .aprPageNumber{position:absolute;right:0;bottom:4px}\n#aprPrintFallback .aprPrintPhotos{display:grid;grid-template-columns:1fr 1fr;gap:0}\n#aprPrintFallback .aprPrintPhotos>div{border:1px solid #595959;padding:8px;font-size:11px}\n#aprPrintFallback .aprPrintPhotos img{display:block;max-width:100%;height:190px;object-fit:contain;margin:6px auto}\n@page{size:A4 landscape;margin:12mm}\n@media print{\n body>*:not(#aprPrintFallback){display:none!important}\n #aprPrintFallback{position:static!important;overflow:visible!important;padding:0!important;background:#fff!important}\n #aprPrintFallback .aprPrintControls{display:none!important}\n #aprPrintFallback .aprPrintDoc{max-width:none!important;width:100%!important;margin:0!important;box-shadow:none!important;padding:0!important}\n #aprPrintFallback .aprSheetPage{margin:0!important;min-height:0!important;padding:0 0 16mm!important;box-shadow:none!important;break-after:auto;page-break-after:auto}\n #aprPrintFallback .aprSheetPage:last-child{break-after:auto;page-break-after:auto}\n #aprPrintFallback .aprSheetHead{height:15mm}\n #aprPrintFallback .aprSheetFooter{bottom:2mm;left:3mm;right:3mm}\n #aprPrintFallback .aprGridTable tr,#aprPrintFallback .aprPrintPhotos>div{break-inside:avoid}\n #aprPrintFallback .aprPrintPhotos img{height:48mm}\n}";
 document.head.appendChild(css);
 const photoList=(r.photos||[]).filter(p=>!p.deleted);
 if(photoList.length){
  const page=document.createElement('section');page.className='aprSheetPage aprPage';
  page.innerHTML=aprSheetHeader()+'<h2>6. REGISTRO FOTOGRÁFICO:</h2><p class="aprPrintControls">Carregando fotografias salvas no aparelho...</p><div class="aprPrintPhotos"></div>'+aprSheetFooter(r,'2');
  overlay.querySelector('.aprPrintDoc')?.appendChild(page);
  const printButton=$('aprFallbackPrint');if(printButton){printButton.disabled=true;printButton.title='Carregando as imagens da APR'}
  (async()=>{
   // Fotos recuperadas em paralelo para não aguardar cada imagem separadamente.
   const prepared=await Promise.all(photoList.map(async photo=>{
    try{
     const image=await Promise.race([
      Promise.resolve(window.TBMAPRPhotos?.getImage?.(r.id,photo.id)),
      new Promise(resolve=>setTimeout(()=>resolve(null),2500))
     ]);
     return image&&String(image).startsWith('data:image/')?{...photo,data:image}:null;
    }catch(err){console.warn('[APR PRÉVIA FOTO]',err);return null}
   }));
   const photos=prepared.filter(Boolean);
   if(!page.isConnected)return;
   page.querySelector('.aprPrintPhotos').innerHTML=photos.map((p,i)=>'<div><b>FOTO '+String(i+1).padStart(2,'0')+'</b><img src="'+E(p.data)+'"><p>'+E(p.caption||'')+'</p></div>').join('');
   const status=page.querySelector('.aprPrintControls');
   if(status)status.textContent=photos.length===photoList.length?'':'Atenção: '+(photoList.length-photos.length)+' foto(s) ainda não estão acessíveis neste aparelho; a prévia mostra apenas as disponíveis.';
   if(printButton){printButton.disabled=false;printButton.removeAttribute('title')}
  })().catch(err=>{if(printButton)printButton.disabled=false;console.warn('[APR FOTOS PRÉVIA]',err)});
 }
 $('aprFallbackClose').onclick=()=>overlay.remove();
 $('aprFallbackPrint').onclick=()=>window.print();
 notice('✅ Prévia aberta. Para salvar como PDF no Android, toque em Imprimir / Salvar como PDF. '+reason, false);
}

function pdfName(r){return 'APR_'+String(r.number||'NUMERACAO_PENDENTE').replace(/[^a-zA-Z0-9_-]/g,'_')+'_'+(r.date||'SEM_DATA')+'.pdf'}
async function fullDefinition(r){
 const doc=definition(r,await logo());
 const photos=(r.photos||[]).filter(x=>!x.deleted);
 const list=window.TBMAPRPhotos?await Promise.all(photos.map(async photo=>{
  try{
   const data=await Promise.race([
    Promise.resolve(window.TBMAPRPhotos.getImage(r.id,photo.id)),
    new Promise(resolve=>setTimeout(()=>resolve(null),3500))
   ]);
   return data?{...photo,data}:null;
  }catch(err){console.warn('[APR FOTO PDF]',photo.id,err);return null}
 })): [];
 const images=list.filter(Boolean);
 if(!images.length)return doc;
 const photoBorder={
  hLineWidth:()=>0.65,vLineWidth:()=>0.65,
  hLineColor:()=>'#505050',vLineColor:()=>'#505050',
  paddingLeft:()=>5,paddingRight:()=>5,paddingTop:()=>6,paddingBottom:()=>6
 };
 doc.content.push({
  text:'6. REGISTRO FOTOGRÁFICO:',
  bold:true,fontSize:10.1,color:'#111111',margin:[0,6,0,5]
 });
 for(let i=0;i<images.length;i+=2){
  // No máximo quatro fotos por folha no tamanho padrão, com cabeçalho e rodapé da TBM.
  if(i>0&&i%4===0){
   doc.content.push({
    text:'6. REGISTRO FOTOGRÁFICO – CONTINUAÇÃO:',
    bold:true,fontSize:10.1,color:'#111111',margin:[0,6,0,4]
   });
  }
  const cells=images.slice(i,i+2).map((p,k)=>({
   stack:[
    {text:'FOTO '+String(i+k+1).padStart(2,'0'),bold:true,fontSize:9.1,alignment:'center',margin:[0,0,0,4]},
    {image:p.data,fit:[319,147],alignment:'center',margin:[0,0,0,4]},
    {text:p.caption||' ',fontSize:9.1,color:'#111111',margin:[0,2,0,0]}
   ],margin:[0,1,0,1]
  }));
  if(cells.length===1)cells.push({text:' ',fontSize:9.1});
  doc.content.push({
   table:{widths:['50%','50%'],body:[cells],dontBreakRows:true},
   layout:photoBorder,margin:[0,0,0,7]
  });
 }
 return doc;
}
// Reutiliza o último arquivo gerado se a APR não mudou (visualizar e baixar imediatos).
let aprPdfMemo={key:'',blob:null,promise:null};
function aprPdfKey(r){
 const photos=(r.photos||[]).map(p=>[p.id,p.caption,p.deleted,p.synced,p.createdAt]);
 return JSON.stringify([r.id,r.number,r.updatedAt,photos]);
}
async function aprBlob(r){
 const key=aprPdfKey(r);
 if(aprPdfMemo.key===key&&aprPdfMemo.blob)return aprPdfMemo.blob;
 if(aprPdfMemo.key===key&&aprPdfMemo.promise)return aprPdfMemo.promise;
 const promise=(async()=>{
  if(!await ensurePdfEngine())throw Error('Gerador PDF não carregado no navegador.');
  const definitionOfApr=await fullDefinition(r);
  return new Promise((resolve,reject)=>{
   let settled=false;
   const timeout=setTimeout(()=>{if(settled)return;settled=true;reject(Error('Tempo limite da geração PDF. Use a prévia para imprimir ou salvar como PDF.'))},12000);
   const complete=(error,blob)=>{
    if(settled)return;
    settled=true;clearTimeout(timeout);
    if(error)reject(error);else if(blob&&blob.size>10)resolve(blob);else reject(Error('Arquivo PDF vazio.'));
   };
   try{
    const pdf=window.pdfMake.createPdf(definitionOfApr);
    if(!pdf||typeof pdf.getBlob!=='function')throw Error('Gerador PDF incompatível.');
    pdf.getBlob(blob=>complete(null,blob));
   }catch(err){complete(err)}
  });
 })();
 aprPdfMemo={key,promise,blob:null};
 try{
  const blob=await promise;
  if(aprPdfMemo.key===key)aprPdfMemo={key,blob,promise:null};
  return blob;
 }catch(err){
  if(aprPdfMemo.key===key)aprPdfMemo={key:'',blob:null,promise:null};
  throw err;
 }
}
async function downloadPdf(r){
 if(!r){notice('APR não encontrada no histórico.',true);return false}
 try{
  if(!await ensurePdfEngine()){
   await showFallback(r,'O gerador automático está indisponível neste navegador.');
   return false;
  }
  notice('📥 Gerando o arquivo PDF...');
  const blob=await aprBlob(r),name=pdfName(r);
  if(typeof window.tbmDownloadPdfBlob==='function')window.tbmDownloadPdfBlob(blob,name);
  else{
   const url=URL.createObjectURL(blob),a=document.createElement('a');
   a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();
   setTimeout(()=>URL.revokeObjectURL(url),60000);
  }
  notice('✅ PDF gerado: '+name);return true;
 }catch(err){
  console.error('[APR DOWNLOAD]',err);
  await showFallback(r,'Falha no arquivo PDF automático: '+String(err.message||err)+'.');
  return false;
 }
}
function openAprOriginalPdf(blob){
 if(!blob||blob.size<10)throw Error('PDF oficial indisponível.');
 const url=URL.createObjectURL(blob);
 // Acionado por um toque do usuário, preservando a permissão do navegador móvel.
 let opened=null;
 try{opened=window.open(url,'_blank')}catch(_){}
 if(!opened){
  const anchor=document.createElement('a');
  anchor.href=url;anchor.target='_blank';anchor.rel='noopener noreferrer';
  document.body.appendChild(anchor);anchor.click();anchor.remove();
 }
 setTimeout(()=>{try{URL.revokeObjectURL(url)}catch(_){}},120000);
}
async function pdf(r){
 if(!r){notice('APR não encontrada.',true);return false}
 // Prévia do formulário aparece antes de carregar fontes, fotos ou pdf.js.
 // A versão PDF real é gerada depois, sem bloquear a tela no Android.
 try{await showFallback(r,'')}
 catch(err){console.error('[APR PRÉVIA RÁPIDA]',err);notice('⚠️ Falha ao abrir prévia: '+String(err.message||err),true);return false}
 const overlay=$('aprPrintFallback');if(!overlay)return false;
 const header=overlay.querySelector('.aprPrintControls');
 if(!header)return false;
 const key=aprPdfKey(r),filename=pdfName(r);
 overlay.dataset.aprId=String(r.id||'');
 overlay.dataset.aprKey=key;
 const original=document.createElement('button');
 original.type='button';original.id='aprFastOpenOriginal';
 original.textContent='📄 Abrir PDF oficial';original.disabled=true;
 original.style.cssText='padding:10px;border:0;border-radius:8px;background:#205599;color:#fff;font-weight:800';
 const download=document.createElement('button');
 download.type='button';download.id='aprFastDownload';
 download.textContent='📥 Baixar PDF';download.disabled=true;
 download.style.cssText='padding:10px;border:0;border-radius:8px;background:#166534;color:#fff;font-weight:800';
 const state=document.createElement('span');
 state.id='aprFastPdfStatus';state.setAttribute('aria-live','polite');
 state.textContent='⏳ Preparando PDF oficial...';
 state.style.cssText='font-size:12px;font-weight:700;color:#475569;flex-basis:100%';
 const close=header.querySelector('#aprFallbackClose');
 header.insertBefore(original,close||null);header.insertBefore(download,close||null);header.appendChild(state);
 const ready=blob=>{
  if(!overlay.isConnected||overlay.dataset.aprKey!==key)return;
  original.disabled=false;download.disabled=false;
  state.textContent='✅ PDF oficial pronto — você já pode abrir ou baixar.';
  original.onclick=()=>{try{openAprOriginalPdf(blob)}catch(e){notice('⚠️ '+String(e.message||e),true)}};
  download.onclick=()=>{
   if(typeof window.tbmDownloadPdfBlob==='function')window.tbmDownloadPdfBlob(blob,filename);
   else{const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000)}
  };
 };
 const cached=aprPdfMemo.key===key?aprPdfMemo.blob:null;
 if(cached){ready(cached);notice('✅ Prévia rápida da APR aberta. PDF oficial disponível.');return true}
 notice('✅ Prévia da APR aberta. O PDF oficial está sendo preparado sem bloquear a visualização.');
 // Ceder o primeiro quadro para o navegador exibir a prévia antes do processamento.
 await new Promise(resolve=>setTimeout(resolve,45));
 if(!overlay.isConnected)return true;
 if(!await ensurePdfEngine()){
  state.textContent='ℹ️ Gerador PDF indisponível. Use Imprimir / Salvar como PDF.';
  return true;
 }
 try{ready(await aprBlob(r))}
 catch(err){
  console.warn('[APR PDF EM SEGUNDO PLANO]',err);
  if(overlay.isConnected&&overlay.dataset.aprKey===key){
   state.textContent='⚠️ PDF automático indisponível. Use Imprimir / Salvar como PDF.';
  }
 }
 return true;
}
function init(){
 mount();setTimeout(mount,1100);
 window.addEventListener('online',()=>{if(quotaPaused())return;if(pending.length)send().catch(()=>{});else if(companyPending.length)syncCompanies().catch(()=>{})});
 window.addEventListener('tbm-firestore-ready',()=>{if(quotaPaused())return;if(pending.length)send().catch(()=>{});else if(companyPending.length)syncCompanies().catch(()=>{})});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
window.SSTAPRQuota={isPaused:quotaPaused};
window.SSTAPR={open,save,definition,fresh,downloadPdf,fullDefinition,reserveNumber,deleteApr,deleteDraftLocal};
})();