/* Ata da CIPA — geração mensal simples com cipeiros salvos */
(()=>{
'use strict';
if(window.__tbmCipaAtaV1)return;
window.__tbmCipaAtaV1=true;

const MEMBERS_KEY='sst_comercial_cipa_membros_v1';
const MINUTES_KEY='sst_comercial_cipa_atas_v1';
const LOGO_LOCAL=(window.SST_DEMO_CONFIG?.logo||window.LOGO_TBM_URL||'./icon.svg');
const TERM_KEY='tbm_cipa_gestao_inicio_v1';
const CLOUD_COLLECTION='inspections';
const CLOUD_MEMBERS_ID='_cipa_members';
const CIPA_MANAGEMENT_ID='_cipa_management_current';
const DEFAULT_TERM_START=2025;
const CIPA_DIM={1:{e:[0,0,0,0,1,1,1,1,2,4,5,6,8],s:[0,0,0,0,1,1,1,1,2,3,4,5,6]},2:{e:[0,0,0,1,1,2,2,3,4,5,6,8,10],s:[0,0,0,1,1,1,1,2,3,4,5,6,8]},3:{e:[0,1,1,2,2,2,3,4,5,6,8,10,12],s:[0,1,1,1,1,1,2,2,4,4,6,8,8]},4:{e:[0,1,2,3,3,4,4,4,5,6,9,11,13],s:[0,1,1,2,2,2,2,3,4,5,7,8,10]}};
const CIPA_R=[[0,19],[20,29],[30,50],[51,80],[81,100],[101,120],[121,140],[141,300],[301,500],[501,1000],[1001,2500],[2501,5000],[5001,10000]];
let currentMeetingNumber=8;
let currentTermStartYear=DEFAULT_TERM_START;
let currentMinuteId='';

const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const q=(s,r=document)=>r.querySelector(s);
const qa=(s,r=document)=>[...r.querySelectorAll(s)];
const isoToday=()=>new Date().toLocaleDateString('en-CA',{timeZone:'America/Cuiaba'});
const months=['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
const weekdays=['domingo','segunda-feira','terça-feira','quarta-feira','quinta-feira','sexta-feira','sábado'];

function readJSON(key,fallback=[]){try{const v=JSON.parse(localStorage.getItem(key)||'null');return v??fallback}catch(_){return fallback}}
function writeJSON(key,value){localStorage.setItem(key,JSON.stringify(value))}
function members(){return readJSON(MEMBERS_KEY,[])}
function saveMembers(list){writeJSON(MEMBERS_KEY,list);cloudSaveMembers(list).catch(e=>console.warn('[CIPA MEMBERS CLOUD]',e))}
function ensureDefaultMember(){
  return members();
}
function minutes(){return readJSON(MINUTES_KEY,[])}
function saveMinutes(list){writeJSON(MINUTES_KEY,list)}

function setCloudState(text,type=''){
  const el=q('#cipaCloudState');if(!el)return;
  el.textContent=text;
  el.style.color=type==='err'?'#b91c1c':type==='ok'?'#15803d':'#64748b';
}
function commercialCloud(){
  const api=window.SSTCommercialCloud;
  return api?.configured?api:null;
}
async function cipaFirestore(){
  if(typeof window.ensureFirestore==='function')return await window.ensureFirestore();
  if(window.SST?.fs)return window.SST.fs;
  throw new Error('Nuvem SST indisponível');
}
function cleanCloudMinute(data,id){
  const x={...(data||{})};delete x.cloudUpdatedAt;x.id=id||x.id;return x;
}
async function cloudSaveMinute(x){
  const api=commercialCloud();
  if(api?.saveCipaMinute)return await api.saveCipaMinute(x);
  const fs=await cipaFirestore();
  const data={...x,kind:'cipa-minute',cloudUpdatedAt:firebase.firestore.FieldValue.serverTimestamp()};
  await fs.collection(CLOUD_COLLECTION).doc(String(x.id)).set(data,{merge:true});
  return x;
}
async function cloudDeleteMinute(id){
  const api=commercialCloud();
  if(api?.deleteCipaMinute)return await api.deleteCipaMinute(id);
  const fs=await cipaFirestore();
  await fs.collection(CLOUD_COLLECTION).doc(String(id)).delete();
}
async function cloudLoadMinutes(){
  const api=commercialCloud();
  if(api?.listCipaMinutes)return await api.listCipaMinutes();
  const fs=await cipaFirestore();
  const snap=await fs.collection(CLOUD_COLLECTION).get();
  return snap.docs.filter(d=>d.data()?.kind==='cipa-minute').map(d=>cleanCloudMinute(d.data(),d.id));
}
async function cloudSaveMembers(list){
  const api=commercialCloud();
  if(api?.saveModuleState)return await api.saveModuleState('cipa-ata-members',{members:list,updatedAt:new Date().toISOString()});
  const fs=await cipaFirestore();
  await fs.collection(CLOUD_COLLECTION).doc(CLOUD_MEMBERS_ID).set({kind:'cipa-members',members:list,cloudUpdatedAt:firebase.firestore.FieldValue.serverTimestamp()},{merge:true});
}
async function cloudLoadMembers(){
  const api=commercialCloud();
  if(api?.loadModuleState){
    const row=await api.loadModuleState('cipa-ata-members');
    return Array.isArray(row?.members)?row.members:[];
  }
  const fs=await cipaFirestore();
  const doc=await fs.collection(CLOUD_COLLECTION).doc(CLOUD_MEMBERS_ID).get();
  return doc.exists&&Array.isArray(doc.data()?.members)?doc.data().members:[];
}
function cipaDimension(payload){
  const risk=Math.max(1,Math.min(4,+payload?.risk||3)),n=Math.max(0,+payload?.employees||0);
  const idx=Math.max(0,CIPA_R.findIndex(x=>n>=x[0]&&n<=x[1]));
  const row=CIPA_DIM[risk]||CIPA_DIM[3];
  return {e:row.e[idx]||0,s:row.s[idx]||0};
}
function normalizedName(v){
  return String(v||'').trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR');
}
function buildMembersFromManagement(payload){
  if(!payload||typeof payload!=='object')return[];
  const snap=payload.compositionSnapshot;
  const list=[];
  const push=(name,role)=>{
    name=String(name||'').trim();if(!name)return;
    const key=normalizedName(name),idx=list.findIndex(x=>normalizedName(x.name)===key);
    if(idx>=0){
      const special=/presidente|vice-presidente/i.test(role||'');
      if(special)list[idx].role=role;
      return;
    }
    list.push({name,role:role||'Membro da CIPA',source:'gestao-cipa'});
  };
  if(snap){
    push(snap.president,'Presidente da CIPA');
    push(snap.vice,'Vice-Presidente da CIPA');
    (snap.electedTitular||[]).forEach(x=>push(x.name,'Representante dos Empregados - Titular'));
    (snap.electedSuplente||[]).forEach(x=>push(x.name,'Representante dos Empregados - Suplente'));
    (snap.employerTitular||[]).forEach(x=>push(x.name,'Representante da Empresa - Titular'));
    (snap.employerSuplente||[]).forEach(x=>push(x.name,'Representante da Empresa - Suplente'));
    if(snap.safetyTech)push(snap.safetyTech.name,snap.safetyTech.role||'Técnico de Segurança do Trabalho');
    if(snap.manager)push(snap.manager.name,snap.manager.role||'Representante da Empresa');
    return list;
  }
  push(payload.newPresident,'Presidente da CIPA');
  push(payload.newVice,'Vice-Presidente da CIPA');
  const d=cipaDimension(payload);
  const ranked=[...(payload.candidates||[])].sort((a,b)=>(+b.votes||0)-(+a.votes||0)||(+a.seq||9999)-(+b.seq||9999));
  ranked.slice(0,d.e).forEach(x=>push(x.name,'Representante dos Empregados - Titular'));
  ranked.slice(d.e,d.e+d.s).forEach(x=>push(x.name,'Representante dos Empregados - Suplente'));
  (payload.employer||[]).filter(x=>x.name).forEach(x=>push(x.name,'Representante da Empresa - '+(x.role||'Titular')));
  push(payload.safetyTechName,payload.safetyTechRole||'Técnico de Segurança do Trabalho');
  push(payload.managerName,payload.managerRole||'Representante da Empresa');
  return list;
}
async function loadCipaManagement(){
  try{
    const local=JSON.parse(localStorage.getItem('sst_comercial_cipa_management_v2')||'null');
    if(local)return local;
  }catch(_){}
  const api=commercialCloud();
  if(api?.loadModuleState){
    const row=await api.loadModuleState('cipa-management').catch(()=>null);
    if(row)return row;
  }
  const fs=await cipaFirestore();
  const doc=await fs.collection(CLOUD_COLLECTION).doc(CIPA_MANAGEMENT_ID).get();
  return doc.exists?(doc.data()?.payload||null):null;
}
function mergeImportedMembers(imported){
  const list=members();
  imported.forEach(m=>{
    const key=normalizedName(m.name);
    const idx=list.findIndex(x=>normalizedName(x.name)===key);
    if(idx>=0)list[idx]={...list[idx],role:m.role||list[idx].role,source:'gestao-cipa'};
    else list.push({...m,source:'gestao-cipa'});
  });
  saveMembers(list);
  return list;
}
function showCompositionPreview(payload,imported){
  q('#cipaImportPreview')?.remove();
  const box=document.createElement('div');box.id='cipaImportPreview';
  box.style.cssText='position:fixed;inset:0;z-index:13050;background:#0009;display:flex;align-items:center;justify-content:center;padding:16px';
  box.innerHTML='<div style="width:min(680px,100%);max-height:88vh;overflow:auto;background:#fff;border-radius:16px;padding:18px;color:#17202b"><h3 style="margin-top:0">Prévia da composição — '+esc(payload.nextTerm||payload.compositionSnapshot?.term||'Gestão CIPA')+'</h3>'+
    '<div class="cipaHint">Somente estes integrantes serão importados. Candidatos que não fazem parte da composição não entram na Ata.</div>'+
    '<div style="margin:12px 0">'+imported.map(x=>'<div style="padding:9px;border-bottom:1px solid #e2e8f0"><b>'+esc(x.name)+'</b><br><small>'+esc(x.role)+'</small></div>').join('')+'</div>'+
    '<div class="cipaActions" style="justify-content:flex-end"><button id="cipaImportCancel" class="cipaBtn cipaSecondary">Cancelar</button><button id="cipaImportConfirm" class="cipaBtn cipaSuccess">Confirmar importação</button></div></div>';
  document.body.appendChild(box);
  q('#cipaImportCancel').onclick=()=>box.remove();
  q('#cipaImportConfirm').onclick=()=>{
    mergeImportedMembers(imported);
    const start=Number(String(payload.nextTerm||payload.compositionSnapshot?.term||'').slice(0,4));
    if(start){
      currentTermStartYear=start;localStorage.setItem(TERM_KEY,String(start));
      const sel=q('#cipaTermStart');if(sel){if(![...sel.options].some(o=>+o.value===start)){const op=document.createElement('option');op.value=String(start);op.textContent=termLabel(start);sel.appendChild(op)}sel.value=String(start)}
    }
    renderMembers();renderPresence();refreshMeetingInfo();box.remove();
    alert('Composição da Gestão CIPA importada sem duplicar nomes.');
  };
}
async function importCipaComposition(){
  setCloudState('☁️ Buscando composição da Gestão CIPA...');
  try{
    const payload=await loadCipaManagement();
    if(!payload){alert('Nenhuma Gestão CIPA salva foi encontrada.');setCloudState('☁️ Gestão CIPA não encontrada','err');return}
    const imported=buildMembersFromManagement(payload);
    if(!imported.length){alert('A composição ainda não possui integrantes definidos.');setCloudState('☁️ Composição vazia','err');return}
    showCompositionPreview(payload,imported);setCloudState('☁️ Composição localizada','ok');
  }catch(e){console.error('[CIPA IMPORT]',e);setCloudState('☁️ Falha ao carregar composição','err');alert('Não foi possível carregar a composição da Gestão CIPA.')}
}
function minuteKey(x){return [x.term||'',x.date||'',x.meetingNumber||''].join('|')}
function mergeMinutes(localList,cloudList){
  const map=new Map();
  [...cloudList,...localList].forEach(x=>{if(!x)return;const k=x.id||minuteKey(x);const prev=map.get(k);if(!prev||String(x.updatedAt||x.createdAt||'')>=String(prev.updatedAt||prev.createdAt||''))map.set(k,x)});
  const byMeeting=new Map();
  [...map.values()].forEach(x=>{const k=minuteKey(x);const prev=byMeeting.get(k);if(!prev||String(x.updatedAt||x.createdAt||'')>=String(prev.updatedAt||prev.createdAt||''))byMeeting.set(k,x)});
  return [...byMeeting.values()].sort((a,b)=>String(b.date||'').localeCompare(String(a.date||''))).slice(0,120);
}
async function syncCloudOnOpen(){
  setCloudState('☁️ Sincronizando com a nuvem...');
  try{
    const [cloudAtas,cloudMembers]=await Promise.all([cloudLoadMinutes(),cloudLoadMembers()]);
    const localAtas=minutes();
    const merged=mergeMinutes(localAtas,cloudAtas);
    saveMinutes(merged);
    if(cloudMembers.length){writeJSON(MEMBERS_KEY,cloudMembers);ensureDefaultMember();await cloudSaveMembers(members());renderMembers();renderPresence()}
    else if(members().length)await cloudSaveMembers(members());
    const cloudIds=new Set(cloudAtas.map(x=>x.id));
    for(const ata of localAtas){if(ata?.id&&!cloudIds.has(ata.id))await cloudSaveMinute(ata)}
    renderHistory();
    setCloudState('☁️ Nuvem sincronizada','ok');
  }catch(e){
    console.warn('[CIPA CLOUD]',e);
    setCloudState('☁️ Sem conexão com a nuvem • histórico local mantido','err');
  }
}

function formatDateBR(value){
  const s=String(value||'').slice(0,10);
  if(!/^\d{4}-\d{2}-\d{2}$/.test(s))return'';
  const [y,m,d]=s.split('-');
  return `${d}/${m}/${y}`;
}
function dateWords(value){
  const s=String(value||'').slice(0,10);
  if(!/^\d{4}-\d{2}-\d{2}$/.test(s))return'';
  const [y,m,d]=s.split('-').map(Number);
  const dt=new Date(y,m-1,d,12,0,0);
  return {day:d,month:months[m-1],year:y,weekday:weekdays[dt.getDay()]};
}
function meetingLabel(){return 'REUNIÃO ORDINÁRIA'}
function ordinal(n){return String(Number(n)||1)+'ª'}
function meetingNumberForDate(value){
  const m=Number(String(value||'').slice(5,7));
  return m>=1&&m<=12?m:1;
}
function termStartYear(){
  const n=Number(localStorage.getItem(TERM_KEY)||DEFAULT_TERM_START);
  return Number.isFinite(n)&&n>=2020&&n<=2100?n:DEFAULT_TERM_START;
}
function termLabel(startYear){
  const y=Number(startYear)||DEFAULT_TERM_START;
  return y+'/'+(y+1);
}
function termOptions(selected){
  const nowYear=new Date().getFullYear();
  const years=new Set([DEFAULT_TERM_START,nowYear-1,nowYear,nowYear+1,nowYear+2,Number(selected)]);
  return [...years].filter(y=>Number.isFinite(y)&&y>=2020).sort((a,b)=>a-b).map(y=>'<option value="'+y+'" '+(Number(selected)===y?'selected':'')+'>'+termLabel(y)+'</option>').join('');
}
function dayWord(n){
  const map={1:'um',2:'dois',3:'três',4:'quatro',5:'cinco',6:'seis',7:'sete',8:'oito',9:'nove',10:'dez',11:'onze',12:'doze',13:'treze',14:'quatorze',15:'quinze',16:'dezesseis',17:'dezessete',18:'dezoito',19:'dezenove',20:'vinte',21:'vinte e um',22:'vinte e dois',23:'vinte e três',24:'vinte e quatro',25:'vinte e cinco',26:'vinte e seis',27:'vinte e sete',28:'vinte e oito',29:'vinte e nove',30:'trinta',31:'trinta e um'};
  return map[n]||String(n);
}
function yearWord(y){
  const map={2024:'dois mil e vinte e quatro',2025:'dois mil e vinte e cinco',2026:'dois mil e vinte e seis',2027:'dois mil e vinte e sete',2028:'dois mil e vinte e oito',2029:'dois mil e vinte e nove',2030:'dois mil e trinta'};
  return map[Number(y)]||String(y);
}
function timeText(value){
  const m=String(value||'').match(/^(\d{2}):(\d{2})$/);
  return m?m[1]+'h'+m[2]+'min':String(value||'');
}
function introText(date,startTime){
  const x=dateWords(date);if(!x)return'';
  return 'Aos '+dayWord(x.day)+' dias do mês de '+x.month+' de '+yearWord(x.year)+', às '+timeText(startTime)+', reuniram-se na sala de treinamento os membros da CIPA da empresa empresa cadastrada.\n\nA reunião teve início às '+timeText(startTime)+', com a presença dos membros da comissão, sendo discutidos os seguintes assuntos:';
}
function closingText(endTime){
  return 'Não havendo mais assuntos a tratar, a reunião foi encerrada às '+timeText(endTime)+'. A ata foi confirmada, lida e assinada por todos os participantes, conforme abaixo.';
}
function cipaRoleOrder(role){
  const r=String(role||'').toLocaleLowerCase('pt-BR');
  if(r.includes('presidente')&&!r.includes('vice'))return 1;
  if(r.includes('vice-presidente')||r.includes('vice presidente'))return 2;
  if(r.includes('membro eleito')||r.includes('representante dos empregados'))return 3;
  if(r.includes('membro indicado')||r.includes('representante do empregador')||r.includes('representante da empresa'))return 4;
  if(r.includes('técnico de segurança')||r.includes('tecnico de seguranca'))return 5;
  if(r.includes('secretário')||r.includes('secretario'))return 6;
  if(r.includes('titular'))return 7;
  if(r.includes('suplente'))return 8;
  return 9;
}
function sortCipaMembers(list){
  return [...(list||[])].sort((a,b)=>{
    const d=cipaRoleOrder(a?.role)-cipaRoleOrder(b?.role);
    return d||String(a?.name||'').localeCompare(String(b?.name||''),'pt-BR',{sensitivity:'base'});
  });
}
function subjectsForPdf(value){
  const lines=String(value||'').split(/\n+/).map(x=>x.trim()).filter(Boolean);
  if(!lines.length)return [{text:'Nenhum assunto informado.',italics:true,color:'#64748b',margin:[0,0,0,12]}];
  if(lines.length===1)return [{text:lines[0],alignment:'justify',margin:[0,0,0,12]}];
  return [{ul:lines,alignment:'justify',margin:[8,0,0,12]}];
}

async function logoBase64(){
  try{
    if(typeof window.carregarLogo==='function')return await window.carregarLogo(window.LOGO_TBM_URL);
  }catch(_){}
  try{
    const r=await fetch(LOGO_LOCAL,{cache:'force-cache'});
    const b=await r.blob();
    return await new Promise((res,rej)=>{const fr=new FileReader();fr.onload=()=>res(fr.result);fr.onerror=rej;fr.readAsDataURL(b)});
  }catch(_){return''}
}

function injectStyle(){
  if(q('#tbmCipaStyle'))return;
  const s=document.createElement('style');s.id='tbmCipaStyle';s.textContent=`
  .cipaTile{background:linear-gradient(145deg,#7f1d1d,#dc2626)}
  .cipaOverlay{position:fixed;inset:0;z-index:12000;background:rgba(5,12,20,.78);backdrop-filter:blur(6px);overflow:auto;padding:18px}
  .cipaShell{max-width:980px;margin:0 auto;background:#f3f6f9;border-radius:24px;overflow:hidden;box-shadow:0 28px 90px #0007}
  .cipaTop{background:linear-gradient(135deg,#670b12,#a50f1b);color:#fff;padding:20px;display:flex;align-items:center;gap:14px;position:sticky;top:0;z-index:3}
  .cipaTop img{width:88px;height:58px;border-radius:0;background:transparent!important;padding:0!important;object-fit:contain}
  .cipaTop h2{margin:0;font-size:24px;color:#fff!important}.cipaTop p{margin:4px 0 0;opacity:.88;font-size:12px;color:#fff!important}.cipaTop button{margin-left:auto;background:#fff;color:#7f1d1d;border:0;border-radius:12px;padding:11px 14px;font-weight:900}
  .cipaBody{padding:18px;color:#17202b!important}.cipaCard{background:#fff!important;color:#17202b!important;border:1px solid #dfe5ec;border-radius:18px;padding:17px;margin-bottom:14px}
  .cipaCard h1,.cipaCard h2,.cipaCard h3,.cipaCard h4,.cipaCard b,.cipaCard strong,.cipaCard span,.cipaCard p{color:#17202b!important}
  .cipaCard h3{margin:0 0 13px;color:#0f172a!important;font-weight:900!important}.cipaGrid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.cipaField label{display:block;font-size:11px;font-weight:900;margin-bottom:6px;color:#334155!important}.cipaField input,.cipaField select,.cipaField textarea{width:100%;border:1px solid #cfd8e3!important;border-radius:10px;padding:11px;background:#fff!important;color:#111827!important;-webkit-text-fill-color:#111827!important}.cipaField input::placeholder,.cipaField textarea::placeholder{color:#6b7280!important;opacity:1!important}.cipaField select option{background:#fff!important;color:#111827!important}.cipaField textarea{min-height:220px;resize:vertical}
  .cipaMember{display:grid;grid-template-columns:minmax(0,1fr) 220px auto;gap:8px;align-items:center;margin:8px 0;color:#17202b!important}.cipaMember input,.cipaMember select{width:100%;border:1px solid #cfd8e3!important;border-radius:9px;padding:10px;background:#fff!important;color:#111827!important;-webkit-text-fill-color:#111827!important}.cipaMember button{background:#fee2e2;color:#991b1b;border-radius:9px;padding:10px;font-weight:900}
  .cipaActions{display:flex;gap:8px;flex-wrap:wrap}.cipaHint{color:#64748b!important}.cipaHistoryItem,.cipaHistoryItem b,.cipaHistoryItem span{color:#17202b!important}.cipaBtn{padding:12px 15px;border-radius:10px;font-weight:900;border:0}.cipaPrimary{background:#8b1018;color:#fff}.cipaSecondary{background:#e6ebf0;color:#17202b}.cipaSuccess{background:#15803d;color:#fff}.cipaHint{font-size:12px;color:#64748b;margin-top:7px}.cipaHistoryItem{padding:11px;border:1px solid #e2e8f0;border-radius:11px;margin:8px 0;display:flex;justify-content:space-between;gap:10px;align-items:center}.cipaHistoryItem small{display:block;color:#64748b;margin-top:3px}
  @media(max-width:700px){.cipaGrid{grid-template-columns:1fr}.cipaMember{grid-template-columns:1fr}.cipaTop h2{font-size:19px}.cipaOverlay{padding:0}.cipaShell{border-radius:0;min-height:100vh}}
  `;document.head.appendChild(s);
}

function addHomeTile(){
  if(q('#tbmCipaTile'))return;
  const tiles=q('#home .tiles');
  if(!tiles)return;
  const btn=document.createElement('button');
  btn.type='button';btn.id='tbmCipaTile';btn.className='tile cipaTile';
  btn.innerHTML='<div class="ico">📝</div><div><b>Ata da CIPA</b><span>Reunião mensal ou extraordinária</span></div>';
  btn.onclick=openModule;
  tiles.appendChild(btn);
}

function memberRoleOptions(selected=''){
  const roles=['Presidente da CIPA','Vice-Presidente da CIPA','Representante dos Empregados - Titular','Representante dos Empregados - Suplente','Representante da Empresa - Titular','Representante da Empresa - Suplente','Representante da Empresa','Membro Eleito','Membro Indicado','Secretário(a)','Técnico de Segurança do Trabalho','Membro Titular','Membro Suplente','Representante do Empregador','Representante dos Empregados','Outro'];
  return roles.map(r=>`<option ${r===selected?'selected':''}>${esc(r)}</option>`).join('');
}

function renderMembers(){
  const box=q('#cipaMembers');
  if(!box)return;
  const list=ensureDefaultMember();
  box.innerHTML=list.length?list.map((m,i)=>`<div class="cipaMember" data-cipa-member="${i}"><input data-k="name" value="${esc(m.name||'')}" placeholder="Nome completo do cipeiro"><select data-k="role">${memberRoleOptions(m.role||'Membro Titular')}</select><button type="button" data-del="${i}" ${m.default?'disabled title="Participante padrão"':''}>${m.default?'Salvo':'Excluir'}</button></div>`).join(''):'<div class="cipaHint">Nenhum cipeiro cadastrado ainda.</div>';
  qa('[data-cipa-member]',box).forEach(row=>row.querySelectorAll('input,select').forEach(el=>el.onchange=()=>{
    const idx=Number(row.dataset.cipaMember),list=members();if(!list[idx])return;list[idx][el.dataset.k]=el.value;saveMembers(list);renderPresence();
  }));
  qa('[data-del]',box).forEach(b=>b.onclick=()=>{
    const list=members(),idx=Number(b.dataset.del);if(list[idx]?.default)return;list.splice(idx,1);saveMembers(list);renderMembers();renderPresence();
  });
}
function renderPresence(){
  const box=q('#cipaPresence');if(!box)return;
  const list=members();
  box.innerHTML=list.length?list.map((m,i)=>`<label style="display:flex;align-items:center;gap:10px;padding:10px;border:1px solid #e2e8f0;border-radius:10px;margin:7px 0"><input type="checkbox" data-presence="${i}" checked style="width:18px;height:18px"><span><b>${esc(m.name||'Sem nome')}</b><small style="display:block;color:#64748b">${esc(m.role||'Membro')}</small></span></label>`).join(''):'<div class="cipaHint">Cadastre os cipeiros acima. Eles ficarão salvos para os próximos meses.</div>';
}
function refreshMeetingInfo(){
  const date=q('#cipaDate')?.value;
  currentMeetingNumber=meetingNumberForDate(date);
  currentTermStartYear=Number(q('#cipaTermStart')?.value)||termStartYear();
  try{localStorage.setItem(TERM_KEY,String(currentTermStartYear))}catch(_){}
  const dw=q('#cipaDayInfo'),x=dateWords(date);
  if(dw)dw.textContent=x?(x.weekday+', '+formatDateBR(date)):'';
  const title=q('#cipaMeetingTitle');
  if(title)title.textContent='ATA DA '+ordinal(currentMeetingNumber)+' REUNIÃO ORDINÁRIA DA CIPA – '+termLabel(currentTermStartYear);
}

function openModule(){
  injectStyle();
  q('#tbmCipaOverlay')?.remove();
  currentTermStartYear=termStartYear();
  currentMeetingNumber=meetingNumberForDate(isoToday());
  const wrap=document.createElement('div');wrap.id='tbmCipaOverlay';wrap.className='cipaOverlay';
  wrap.innerHTML=`<div class="cipaShell">
    <div class="cipaTop"><img src="${LOGO_LOCAL}" alt="Empresa"><div><h2>Ata da CIPA</h2><p>Preencha somente os dados da reunião. O texto formal é montado automaticamente.</p></div><button id="cipaClose">✕ Fechar</button></div>
    <div class="cipaBody">
      <div class="cipaCard"><h3 id="cipaMeetingTitle"></h3><div class="cipaGrid">
        <div class="cipaField"><label>Gestão da CIPA *</label><select id="cipaTermStart">${termOptions(currentTermStartYear)}</select><div class="cipaHint">Ex.: 2025/2026. Quando mudar a gestão, selecione 2026/2027.</div></div>
        <div class="cipaField"><label>Data da reunião *</label><input id="cipaDate" type="date" value="${isoToday()}"><div id="cipaDayInfo" class="cipaHint"></div></div>
        <div class="cipaField"><label>Hora de início *</label><input id="cipaStartTime" type="time" value="07:15"></div>
        <div class="cipaField"><label>Hora de término *</label><input id="cipaEndTime" type="time" value="08:00"></div>
      </div></div>
      <div class="cipaCard"><h3>Assuntos e ações discutidos</h3><div class="cipaField"><textarea id="cipaSubjects" placeholder="Digite o que foi discutido na reunião. Você pode colocar um assunto por linha."></textarea></div><div class="cipaHint">Os textos de abertura e encerramento já ficam prontos automaticamente no relatório.</div></div>
      <div class="cipaCard"><h3>Cipeiros cadastrados</h3><div class="cipaActions" style="margin-bottom:12px"><button id="cipaImportComposition" class="cipaBtn cipaSuccess">↻ Importar composição da Gestão CIPA</button></div><div id="cipaMembers"></div><div class="cipaActions" style="margin-top:10px"><button id="cipaAddMember" class="cipaBtn cipaSecondary">➕ Adicionar cipeiro</button></div><div class="cipaHint">A importação traz presidente, vice, titulares, suplentes e indicados da gestão atual sem duplicar nomes. Você ainda pode adicionar participantes manualmente.</div></div>
      <div class="cipaCard"><h3>Presentes nesta reunião</h3><div id="cipaPresence"></div></div>
      <div class="cipaCard"><div id="cipaCloudState" class="cipaHint" style="margin-bottom:10px">☁️ Preparando sincronização...</div><div class="cipaActions"><button id="cipaPreview" class="cipaBtn cipaSecondary">👁️ Visualizar documento</button><button id="cipaDownload" class="cipaBtn cipaPrimary">📥 Baixar PDF</button><button id="cipaSave" class="cipaBtn cipaSuccess">💾 Salvar</button><button id="cipaShare" class="cipaBtn cipaSecondary">📲 Compartilhar</button></div><div class="cipaHint">Ao salvar, a ata também é sincronizada e uma cópia em PDF é enviada automaticamente por e-mail.</div></div>
      <div class="cipaCard"><h3>Atas salvas</h3><div id="cipaHistory"></div></div>
    </div></div>`;
  document.body.appendChild(wrap);
  q('#cipaClose').onclick=()=>wrap.remove();
  q('#cipaDate').onchange=()=>{currentMinuteId='';refreshMeetingInfo()};
  q('#cipaTermStart').onchange=refreshMeetingInfo;
  q('#cipaImportComposition').onclick=importCipaComposition;
  q('#cipaAddMember').onclick=()=>{const list=members();list.push({name:'',role:'Membro Titular'});saveMembers(list);renderMembers();renderPresence()};
  q('#cipaPreview').onclick=()=>makeCipaPdf('preview');
  q('#cipaDownload').onclick=()=>makeCipaPdf('download');
  q('#cipaSave').onclick=saveCurrent;
  q('#cipaShare').onclick=()=>makeCipaPdf('share');
  renderMembers();renderPresence();refreshMeetingInfo();renderHistory();syncCloudOnOpen();
}

function collect(){
  const list=members();
  const present=qa('[data-presence]').filter(x=>x.checked).map(x=>list[Number(x.dataset.presence)]).filter(x=>x?.name?.trim());
  return {
    id:currentMinuteId||('CIPA-'+Date.now()),
    type:'ordinaria',
    meetingNumber:currentMeetingNumber,
    term:termLabel(currentTermStartYear),
    termStartYear:currentTermStartYear,
    date:q('#cipaDate')?.value||'',
    startTime:q('#cipaStartTime')?.value||'',
    endTime:q('#cipaEndTime')?.value||'',
    subjects:q('#cipaSubjects')?.value?.trim()||'',
    members:present,
    createdAt:new Date().toISOString()
  };
}
function validateMeeting(x){
  if(!x.date){alert('Informe a data da reunião.');return false}
  if(!x.startTime){alert('Informe a hora de início da reunião.');return false}
  if(!x.endTime){alert('Informe a hora de término da reunião.');return false}
  if(!x.subjects){alert('Digite os assuntos e ações discutidos na reunião.');return false}
  if(!x.members.length){alert('Cadastre e selecione pelo menos um cipeiro presente.');return false}
  return true;
}
async function saveCurrent(){
  const x=collect();if(!validateMeeting(x))return;
  const list=minutes();
  const same=list.findIndex(a=>a.date===x.date&&String(a.term||'')===String(x.term||''));
  if(same>=0){
    x.id=list[same].id;currentMinuteId=x.id;x.createdAt=list[same].createdAt||x.createdAt;x.updatedAt=new Date().toISOString();list[same]={...list[same],...x};
  }else{
    currentMinuteId=x.id;x.updatedAt=new Date().toISOString();list.unshift(x);
  }
  saveMinutes(list.slice(0,120));renderHistory();
  setCloudState('☁️ Salvando na nuvem...');
  try{
    const saved=await cloudSaveMinute(x);
    if(saved?.cloudId)x.cloudId=saved.cloudId;
    setCloudState('✅ Ata salva e sincronizada na nuvem','ok');
  }catch(e){
    console.warn('[CIPA SAVE CLOUD]',e);
    setCloudState('⚠️ Ata salva no aparelho • sincronização pendente','err');
  }
  setTimeout(()=>{try{window.tbmAutoEmailSavedReport?.({mode:'cipa'})}catch(e){console.warn('[CIPA EMAIL]',e)}},600);
}
function renderHistory(){
  const box=q('#cipaHistory');if(!box)return;
  const list=minutes();
  box.innerHTML=list.length?list.map((a,i)=>`<div class="cipaHistoryItem"><div><b>${ordinal(a.meetingNumber||meetingNumberForDate(a.date))} REUNIÃO ORDINÁRIA</b><small>${a.term||termLabel(a.termStartYear||DEFAULT_TERM_START)} • ${formatDateBR(a.date)} • ${(a.members||[]).length} cipeiro(s)</small></div><div class="cipaActions"><button class="cipaBtn cipaSecondary" data-open-ata="${i}">Abrir</button><button class="cipaBtn cipaSecondary" data-del-ata="${i}">Excluir</button></div></div>`).join(''):'<div class="cipaHint">Nenhuma ata salva ainda.</div>';
  qa('[data-open-ata]',box).forEach(b=>b.onclick=()=>{
    const a=minutes()[Number(b.dataset.openAta)];if(!a)return;
    currentMinuteId=a.id||'';
    currentMeetingNumber=Number(a.meetingNumber)||meetingNumberForDate(a.date);
    currentTermStartYear=Number(a.termStartYear)||Number(String(a.term||'').slice(0,4))||DEFAULT_TERM_START;
    const select=q('#cipaTermStart');
    if(select&&!([...select.options].some(o=>Number(o.value)===currentTermStartYear))){const op=document.createElement('option');op.value=String(currentTermStartYear);op.textContent=termLabel(currentTermStartYear);select.appendChild(op)}
    if(select)select.value=String(currentTermStartYear);
    q('#cipaDate').value=a.date||isoToday();
    q('#cipaStartTime').value=a.startTime||'07:15';
    q('#cipaEndTime').value=a.endTime||'08:00';
    q('#cipaSubjects').value=a.subjects||a.body||'';
    refreshMeetingInfo();renderPresence();
    const present=new Set((a.members||[]).map(m=>m.name));
    qa('[data-presence]').forEach(el=>{const m=members()[Number(el.dataset.presence)];el.checked=present.has(m?.name)});
  });
  qa('[data-del-ata]',box).forEach(b=>b.onclick=async()=>{
    if(!confirm('Excluir esta ata salva?'))return;
    const list=minutes(),idx=Number(b.dataset.delAta),item=list[idx];if(!item)return;
    list.splice(idx,1);saveMinutes(list);renderHistory();
    try{if(item.id)await cloudDeleteMinute(item.id);setCloudState('☁️ Exclusão sincronizada','ok')}
    catch(e){console.warn('[CIPA DELETE CLOUD]',e);setCloudState('☁️ Exclusão local concluída • falha na nuvem','err')}
  });
}
async function ensurePdf(){
  for(let i=0;i<40;i++){if(window.pdfMake?.createPdf)return true;await new Promise(r=>setTimeout(r,100))}
  return false;
}
function cipaFilename(x){
  return 'ATA_CIPA_'+ordinal(x.meetingNumber).replace('ª','')+'_REUNIAO_ORDINARIA_'+x.date.split('-').reverse().join('-')+'.pdf';
}
async function buildCipaPdf(x){
  if(!await ensurePdf())throw new Error('Gerador de PDF indisponível. Abra o sistema com internet uma vez e tente novamente.');
  const logo=await logoBase64();
  const title='ATA DA '+ordinal(x.meetingNumber)+' REUNIÃO ORDINÁRIA DA CIPA - '+x.term;
  const rows=sortCipaMembers(x.members).map((m,i)=>[
    {text:String(i+1),alignment:'center',color:'#000000',fontSize:8.5,margin:[0,1,0,1]},
    {text:m.name,color:'#000000',fontSize:8.5,margin:[0,1,0,1]},
    {text:m.role||'Membro',color:'#000000',fontSize:8,margin:[0,1,0,1]},
    {text:'',color:'#000000',fontSize:8,margin:[0,9,0,9]}
  ]);
  const tableLayout={
    hLineWidth:()=>0.35,vLineWidth:()=>0.35,
    hLineColor:()=> '#6b7280',vLineColor:()=> '#6b7280',
    paddingLeft:()=>3,paddingRight:()=>3,paddingTop:()=>2,paddingBottom:()=>2
  };
  const doc={
    __tbmDocumentType:'cipa',
    __tbmIsolatedPdf:true,
    pageSize:'A4',
    pageOrientation:'portrait',
    pageMargins:[70,96,55,88],
    info:{title,subject:'Ata da CIPA '+x.term},
    defaultStyle:{font:'Roboto',fontSize:11,color:'#000000',lineHeight:1.5},
    header:()=>({margin:[55,12,55,0],columns:[
      logo?{image:logo,width:128,fit:[128,58]}:{text:(window.SST_DEMO_CONFIG?.nomeFantasia||window.SST_DEMO_CONFIG?.razaoSocial||'SST'),bold:true,fontSize:18,width:128},
      {text:'',width:'*'}
    ]}),
    content:[
      {text:(window.SST_DEMO_CONFIG?.nomeFantasia||window.SST_DEMO_CONFIG?.razaoSocial||'EMPRESA CADASTRADA'),alignment:'center',bold:true,fontSize:9,color:'#000000',margin:[0,0,0,12]},
      {text:title,alignment:'center',bold:true,fontSize:13,color:'#000000',margin:[0,0,0,8]},
      {canvas:[{type:'line',x1:0,y1:0,x2:425,y2:0,lineWidth:1,lineColor:'#000000'}],margin:[0,0,0,18]},
      {text:introText(x.date,x.startTime),alignment:'justify',color:'#000000',margin:[0,0,0,14]},
      {text:'ASSUNTOS E AÇÕES DISCUTIDOS',bold:true,fontSize:11,color:'#000000',margin:[0,6,0,8]},
      ...subjectsForPdf(x.subjects).map(n=>({...n,color:'#000000'})),
      {text:closingText(x.endTime),alignment:'justify',color:'#000000',margin:[0,6,0,18]},
      {text:'MEMBROS PRESENTES E ASSINATURAS',bold:true,fontSize:11,color:'#000000',margin:[0,4,0,8]},
      {table:{headerRows:1,widths:[18,145,80,'*'],body:[
        [
          {text:'Nº',bold:true,fillColor:'#eeeeee',color:'#000000',alignment:'center',fontSize:8.5},
          {text:'NOME',bold:true,fillColor:'#eeeeee',color:'#000000',alignment:'center',fontSize:8.5},
          {text:'FUNÇÃO',bold:true,fillColor:'#eeeeee',color:'#000000',alignment:'center',fontSize:8.5},
          {text:'ASSINATURA',bold:true,fillColor:'#eeeeee',color:'#000000',alignment:'center',fontSize:8.5}
        ],
        ...rows
      ]},layout:tableLayout},
      {text:'Documento emitido pelo Sistema de Gestão SST',alignment:'center',fontSize:8,color:'#000000',margin:[0,18,0,0]}
    ],
    footer:(currentPage,pageCount)=>({
      text:'Ata da CIPA - '+formatDateBR(x.date)+' - Página '+currentPage+' de '+pageCount,
      alignment:'center',fontSize:8,color:'#000000',margin:[0,8,0,14]
    })
  };
  return {doc,title,filename:cipaFilename(x)};
}

function pdfBlob(doc){
  return new Promise((resolve,reject)=>{try{window.pdfMake.createPdf(doc).getBlob(blob=>blob&&blob.size?resolve(blob):reject(new Error('PDF vazio.')))}catch(e){reject(e)}});
}
async function makeCipaPdf(action='preview'){
  const x=collect();if(!validateMeeting(x))return false;

  // Abre a aba no mesmo gesto do usuário; navegadores móveis bloqueiam
  // window.open quando ele acontece somente depois de awaits demorados.
  let preview=null;
  if(action==='preview'){
    try{
      preview=window.open('about:blank','_blank');
      if(preview){
        preview.document.write('<!doctype html><meta charset="utf-8"><title>Gerando Ata da CIPA</title><style>body{font-family:Arial;padding:28px;color:#17202b} .box{max-width:520px;margin:40px auto;padding:24px;border:1px solid #ddd;border-radius:16px}</style><div class="box"><h2>Gerando Ata da CIPA...</h2><p>O documento será exibido nesta aba.</p></div>');
        preview.document.close();
      }
    }catch(_){}
  }

  try{
    const built=await buildCipaPdf(x);
    if(action==='download'){window.pdfMake.createPdf(built.doc).download(built.filename);return true}
    if(action==='share'){
      const blob=await pdfBlob(built.doc);
      const file=new File([blob],built.filename,{type:'application/pdf'});
      if(navigator.share&&(!navigator.canShare||navigator.canShare({files:[file]}))){await navigator.share({title:built.title,text:'Ata da CIPA • '+formatDateBR(x.date),files:[file]});return true}
      window.pdfMake.createPdf(built.doc).download(built.filename);
      return true;
    }
    const blob=await pdfBlob(built.doc),url=URL.createObjectURL(blob);
    if(preview){
      preview.location.replace(url);
      setTimeout(()=>URL.revokeObjectURL(url),300000);
      return true;
    }
    window.pdfMake.createPdf(built.doc).download(built.filename);
    return true;
  }catch(e){
    console.error('[CIPA PDF]',e);
    try{if(preview&&!preview.closed)preview.close()}catch(_){}
    alert(e?.message||'Não foi possível gerar a ata.');
    return false;
  }
}
window.makeCipaPdf=makeCipaPdf;
window.tbmCipaPdfMeta=()=>{const x=collect();return {id:x.id,type:'Ata da CIPA - '+ordinal(x.meetingNumber)+' Reunião Ordinária - '+x.term,company:(window.SST_DEMO_CONFIG?.nomeFantasia||window.SST_DEMO_CONFIG?.razaoSocial||'Empresa cadastrada'),sector:'CIPA',filename:cipaFilename(x)}};

function boot(){injectStyle();addHomeTile();[500,1200,2500].forEach(ms=>setTimeout(addHomeTile,ms))}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();