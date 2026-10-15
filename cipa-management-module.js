/* Gestão CIPA NR-5 — módulo isolado */
(()=>{
'use strict';
if(window.__cipaManagementNR5)return; window.__cipaManagementNR5=true;
const KEY='sst_comercial_cipa_management_v2', DOC='_cipa_management_current', COL='inspections', LOGO=(window.SST_DEMO_CONFIG?.logo||window.LOGO_SST_URL||'./icon.svg');
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const cp=x=>JSON.parse(JSON.stringify(x));
const DIM={1:{e:[0,0,0,0,1,1,1,1,2,4,5,6,8],s:[0,0,0,0,1,1,1,1,2,3,4,5,6],i:1},2:{e:[0,0,0,1,1,2,2,3,4,5,6,8,10],s:[0,0,0,1,1,1,1,2,3,4,5,6,8],i:1},3:{e:[0,1,1,2,2,2,3,4,5,6,8,10,12],s:[0,1,1,1,1,1,2,2,4,4,6,8,8],i:2},4:{e:[0,1,2,3,3,4,4,4,5,6,9,11,13],s:[0,1,1,2,2,2,2,3,4,5,7,8,10],i:2}};
const R=[[0,19],[20,29],[30,50],[51,80],[81,100],[101,120],[121,140],[141,300],[301,500],[501,1000],[1001,2500],[2501,5000],[5001,10000]];
function base(){
  const y=new Date().getFullYear();
  return {
    updatedAt:'',company:'',unit:'',cnpj:'',
    address:'',union:'',
    risk:3,employees:0,currentTerm:(y-1)+'/'+y,nextTerm:y+'/'+(y+1),mandateEnd:'',firstMandate:false,
    president:'',vice:'',eligible:0,electionDate:'',electionStartTime:'',electionEndTime:'',totalVoters:0,blankVotes:0,nullVotes:0,lastCandidateSeq:0,day1:0,day2:0,day3:0,
    meetingDay:10,meetingTime:'07:30',candidates:[],employer:[],newPresident:'',newVice:'',
    managerName:'',managerRole:'Responsável da Empresa',safetyTechName:'',safetyTechRole:'Técnico de Segurança do Trabalho',
    committeeMember1:'',committeeMember2:'',committeeMember3:'',unionRepresentative:'',
    tablePresident:'',tableSecretary:'',tableMember:'',guest1:'',guest2:'',
    sessionPresident:'',sessionSecretary:'',alerts:[],
    stageLocks:{registration:false,voting:false,composition:false},
    documentHistory:{},isArchived:false,archivedAt:'',archiveId:'',
    templateVersion:'tbm-model-v3',docTexts:{}
  };
}
let st=(()=>{try{return Object.assign(base(),JSON.parse(localStorage.getItem(KEY)||'null')||{})}catch(_){return base()}})();
let editingCandidate=-1;
let candidateWatchUnsub=null,candidateWatchPrimed=false;
const candidateKnownIds=new Set();
function migrate(){
  st=Object.assign(base(),st||{});
  st.docTexts=st.docTexts&&typeof st.docTexts==='object'?st.docTexts:{};
  st.alerts=Array.isArray(st.alerts)?st.alerts:[];
  st.stageLocks=Object.assign({registration:false,voting:false,composition:false},st.stageLocks||{});
  st.documentHistory=st.documentHistory&&typeof st.documentHistory==='object'?st.documentHistory:{};
  st.isArchived=!!st.isArchived;
  st.archivedAt=String(st.archivedAt||'');
  st.archiveId=String(st.archiveId||'');
  if(st.templateVersion!=='tbm-model-v3'){
    st.docTexts={};
    st.templateVersion='tbm-model-v3';
  }
  st.candidates=Array.isArray(st.candidates)?st.candidates.map((c,i)=>({
    ...c,
    seq:Math.max(1,+c.seq||i+1),
    name:String(c.name||''),
    role:String(c.role||c.function||''),
    shift:String(c.shift||''),
    matricula:String(c.matricula||''),
    sector:String(c.sector||''),
    admission:String(c.admission||''),
    signatureData:String(c.signatureData||''),
    signatureConfirmed:!!c.signatureData||!!c.signatureConfirmed,
    photoData:String(c.photoData||''),
    photoStatus:['none','pending','approved','rejected','deleted'].includes(c.photoStatus)?c.photoStatus:'none',
    photoConsent:!!c.photoConsent,
    photoReviewedAt:String(c.photoReviewedAt||''),
    status:['Recebida','Conferida','Cancelada'].includes(c.status)?c.status:'Recebida',
    cancelledAt:String(c.cancelledAt||''),
    votes:Math.max(0,+c.votes||0),
    registeredAt:c.registeredAt||new Date().toISOString()
  })):[];
  if(!('totalVoters' in st)||st.totalVoters===null)st.totalVoters=Math.max(0,+st.day1||0);
  st.blankVotes=Math.max(0,+st.blankVotes||0);
  st.nullVotes=Math.max(0,+st.nullVotes||0);
  st.lastCandidateSeq=Math.max(...st.candidates.map(c=>+c.seq||0),0);
  if(!Array.isArray(st.employer))st.employer=[];
}
migrate();
function save(){
  st.compositionSnapshot=buildCompositionSnapshot();
  st.updatedAt=new Date().toISOString();
  localStorage.setItem(KEY,JSON.stringify(st));
  window.tbmSystemAudit?.('ALTERAÇÃO','CIPA','Dados da gestão CIPA atualizados',{entityId:DOC});
  window.tbmSyncLocal?.('CIPA salva localmente; sincronizando com a nuvem...');
  cloudSave().catch(()=>{});
}
async function fs(){if(typeof window.ensureFirestore==='function')return await window.ensureFirestore();if(window.SST?.fs)return window.SST.fs;throw Error('Nuvem SST indisponível')}
async function cloudSave(){
  try{
    localStorage.setItem(KEY,JSON.stringify(st));
    window.tbmSyncOk?.('Gestão CIPA salva neste sistema.');
    return true;
  }catch(e){window.tbmSyncError?.(e?.message||'Falha ao salvar Gestão CIPA.');throw e}
}
function activeCandidates(){return (st.candidates||[]).filter(c=>c.status!=='Cancelada')}
function termKey(v){return String(v||'gestao').replace(/[^0-9A-Za-z_-]+/g,'-').replace(/^-+|-+$/g,'')}
function candidateKey(v){return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9_-]+/g,'_').replace(/^_+|_+$/g,'').slice(0,80)}
function sameCandidateName(a,b){return !!candidateKey(a)&&candidateKey(a)===candidateKey(b)}
function stageLabel(k){return({registration:'Inscrições',voting:'Votação',composition:'Composição'})[k]||k}
function isStageLocked(k){return !!st.isArchived||!!st.stageLocks?.[k]}
async function toggleStage(k,lock){
  if(st.isArchived){alert('Esta gestão está arquivada e não pode ser alterada.');return}
  if(lock){
    if(k==='voting'){
      const q=qrm();if(!q.ok){alert('Não é possível encerrar a votação: total de votantes não confere com candidatos + brancos + nulos.');return}
    }
    if(k==='composition'){
      const v=validateDocument('composition');if(v.errors.length){alert('Não é possível concluir a composição:\n\n- '+v.errors.join('\n- '));return}
    }
  }
  const action=lock?'encerrar/bloquear':'reabrir';
  if(!confirm('Confirma '+action+' a etapa '+stageLabel(k)+'?'))return;
  st.stageLocks=Object.assign({registration:false,voting:false,composition:false},st.stageLocks||{});
  st.stageLocks[k]=!!lock;save();render();
  toast(stageLabel(k)+(lock?' encerrada e bloqueada.':' reaberta para edição.'));
}
function downloadTextFile(name,text,type='application/json'){
  const blob=new Blob([text],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
}
function downloadBackup(){
  const pack={schema:'tbm-cipa-backup-v1',exportedAt:new Date().toISOString(),term:st.nextTerm||'',payload:cp(st)};
  downloadTextFile('Backup_CIPA_'+termKey(st.nextTerm)+'_'+todayCuiaba()+'.json',JSON.stringify(pack,null,2));
}
async function restoreBackupFile(file){
  if(!file)return;
  try{
    const raw=await file.text(),data=JSON.parse(raw),payload=data?.payload;
    if(!payload||typeof payload!=='object')throw new Error('Arquivo não é um backup válido da CIPA.');
    if(!confirm('Restaurar este backup substituirá os dados atuais da Gestão CIPA. Continuar?'))return;
    st=Object.assign(base(),payload);migrate();save();await cloudSave();render();toast('Backup da CIPA restaurado.');
  }catch(e){alert('Falha ao restaurar backup: '+(e?.message||e))}
}
function incrementTerm(term){
  const m=String(term||'').match(/(\d{4})\D+(\d{4})/);
  if(!m){const y=new Date().getFullYear();return (y+1)+'/'+(y+2)}
  return (+m[1]+1)+'/'+(+m[2]+1);
}
async function archiveCurrentManagement(){
  if(st.isArchived){alert('Esta gestão já está arquivada.');return}
  const check=validateDocument('composition');
  if(check.errors.length){alert('Antes de arquivar, corrija a composição:\n\n- '+check.errors.join('\n- '));return}
  if(!confirm('Encerrar e arquivar a gestão '+(st.nextTerm||'')+'? Após isso, ela ficará bloqueada para alterações.'))return;
  try{
    const f=await fs(),id='_cipa_archive_'+termKey(st.nextTerm);
    const snapshot=cp(st);snapshot.isArchived=true;snapshot.archivedAt=new Date().toISOString();snapshot.stageLocks={registration:true,voting:true,composition:true};
    await f.collection(COL).doc(id).set({kind:'cipa-archive',term:st.nextTerm||'',payload:snapshot,archivedAt:firebase.firestore.FieldValue.serverTimestamp()},{merge:true});
    st=snapshot;st.archiveId=id;localStorage.setItem(KEY,JSON.stringify(st));await cloudSave();render();toast('Gestão '+st.nextTerm+' arquivada com segurança.');
  }catch(e){alert('Não foi possível arquivar a gestão: '+(e?.message||e))}
}
async function startNextManagement(){
  if(!st.isArchived){alert('Arquive a gestão atual antes de iniciar a próxima.');return}
  if(!confirm('Iniciar a próxima gestão? A gestão arquivada continuará preservada no histórico.'))return;
  const keep={company:st.company,unit:st.unit,cnpj:st.cnpj,address:st.address,union:st.union,risk:st.risk,employees:st.employees,
    managerName:st.managerName,managerRole:st.managerRole,safetyTechName:st.safetyTechName,safetyTechRole:st.safetyTechRole,
    meetingDay:st.meetingDay,meetingTime:st.meetingTime};
  const prevTerm=st.nextTerm,next=incrementTerm(prevTerm),n=Object.assign(base(),keep,{currentTerm:prevTerm,nextTerm:next,mandateEnd:'',firstMandate:false});
  st=n;migrate();localStorage.setItem(KEY,JSON.stringify(st));await cloudSave();render();toast('Nova gestão '+next+' iniciada.');
}
async function showArchiveList(){
  try{
    const f=await fs(),snap=await f.collection(COL).where('kind','==','cipa-archive').get();
    const items=snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>String(b.term||'').localeCompare(String(a.term||'')));
    $('#cgEditOv')?.remove();const o=document.createElement('div');o.id='cgEditOv';o.className='cgEditOv';
    o.innerHTML='<div class="cgEditBox"><h3>📚 Gestões CIPA arquivadas</h3><div style="max-height:60vh;overflow:auto">'+
      (items.length?items.map((x,i)=>'<div style="padding:11px;border:1px solid #e2e8f0;border-radius:10px;margin:8px 0"><b>Gestão '+esc(x.term||x.payload?.nextTerm||'')+'</b><div class="cgHint">Arquivada em '+fmtDateTime(x.payload?.archivedAt||'')+'</div><button class="cgBtn cgS" data-archive-view="'+i+'" style="margin-top:7px">Consultar</button></div>').join(''):'<div class="cgHint">Nenhuma gestão arquivada encontrada.</div>')+
      '</div><div style="text-align:right;margin-top:10px"><button id="cgArchiveClose" class="cgBtn cgS">Fechar</button></div></div>';
    document.body.appendChild(o);$('#cgArchiveClose').onclick=()=>o.remove();
    $$('[data-archive-view]',o).forEach(b=>b.onclick=()=>showArchiveSnapshot(items[+b.dataset.archiveView]));
  }catch(e){alert('Não foi possível consultar o arquivo de gestões: '+(e?.message||e))}
}
function showArchiveSnapshot(item){
  const p=item?.payload||{},cand=Array.isArray(p.candidates)?p.candidates:[],snap=p.compositionSnapshot||{};
  $('#cgEditOv')?.remove();const o=document.createElement('div');o.id='cgEditOv';o.className='cgEditOv';
  const comp=[...(snap.electedTitular||[]),...(snap.electedSuplente||[]),...(snap.employerTitular||[]),...(snap.employerSuplente||[])];
  o.innerHTML='<div class="cgEditBox"><h3>Consulta — CIPA '+esc(item.term||p.nextTerm||'')+'</h3><div class="cgHint">Modo somente leitura. Nenhum dado desta gestão será alterado.</div>'+
    '<div class="cgGrid" style="margin-top:12px"><div class="cgCard"><b>Candidatos</b><div style="font-size:26px;font-weight:900">'+cand.length+'</div></div><div class="cgCard"><b>Documentos gerados</b><div style="font-size:26px;font-weight:900">'+Object.keys(p.documentHistory||{}).length+'</div></div></div>'+
    '<div class="cgCard"><h3>Candidatos registrados</h3><div style="max-height:240px;overflow:auto">'+cand.sort((a,b)=>(+a.seq||0)-(+b.seq||0)).map(c=>'<div style="padding:7px;border-bottom:1px solid #e2e8f0">'+fmtSeq(c.seq)+' — <b>'+esc(c.name||'')+'</b> • '+esc(c.status||'Recebida')+'</div>').join('')+'</div></div>'+
    '<div class="cgCard"><h3>Composição arquivada</h3><div>'+(comp.length?comp.map(x=>'<div style="padding:7px;border-bottom:1px solid #e2e8f0"><b>'+esc(x.name||'')+'</b> — '+esc(x.role||'')+'</div>').join(''):'<div class="cgHint">Sem composição registrada.</div>')+'</div></div>'+
    '<div style="display:flex;gap:8px;justify-content:flex-end"><button id="cgArchiveBackup" class="cgBtn cgP">⬇ Baixar cópia JSON</button><button id="cgArchiveBack" class="cgBtn cgS">Voltar</button></div></div>';
  document.body.appendChild(o);
  $('#cgArchiveBackup').onclick=()=>downloadTextFile('Arquivo_CIPA_'+termKey(item.term||p.nextTerm)+'.json',JSON.stringify({schema:'tbm-cipa-archive-v1',term:item.term||p.nextTerm,payload:p},null,2));
  $('#cgArchiveBack').onclick=showArchiveList;
}
async function ensureQrLib(){
  if(window.QRCode)return;
  await new Promise((resolve,reject)=>{
    const old=document.getElementById('cgQrLib');if(old){old.addEventListener('load',resolve,{once:true});old.addEventListener('error',reject,{once:true});return}
    const sc=document.createElement('script');sc.id='cgQrLib';sc.src='https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';sc.onload=resolve;sc.onerror=()=>reject(new Error('Biblioteca de QR Code indisponível'));document.head.appendChild(sc);
  });
}
async function showQrCode(){
  const link=cipaPublicLink();
  try{await ensureQrLib()}catch(e){alert('Não foi possível carregar o gerador de QR Code. O link continua disponível para copiar.');return}
  $('#cgEditOv')?.remove();
  const o=document.createElement('div');o.id='cgEditOv';o.className='cgEditOv';
  o.innerHTML='<div class="cgEditBox" style="max-width:520px;text-align:center"><h3>QR Code — Inscrição CIPA</h3><div id="cgQrTarget" style="display:flex;justify-content:center;padding:18px;background:#fff"></div><div class="cgHint">'+esc(link)+'</div><div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:12px"><button id="cgQrPrint" class="cgBtn cgP">🖨 Imprimir QR Code</button><button id="cgQrClose" class="cgBtn cgS">Fechar</button></div></div>';
  document.body.appendChild(o);
  new QRCode($('#cgQrTarget'),{text:link,width:260,height:260,correctLevel:QRCode.CorrectLevel.H});
  $('#cgQrClose').onclick=()=>o.remove();
  $('#cgQrPrint').onclick=()=>setTimeout(()=>{
    const img=$('#cgQrTarget img'),canvas=$('#cgQrTarget canvas'),src=img?.src||canvas?.toDataURL('image/png');if(!src)return;
    const w=window.open('','_blank');if(!w)return;
    w.document.write('<!doctype html><html><head><meta charset="utf-8"><title>QR Code CIPA</title><style>body{font-family:Arial;text-align:center;padding:45px}img{width:300px;height:300px}h1{font-size:24px}p{font-size:14px}</style></head><body><h1>INSCRIÇÃO CIPA '+esc(st.nextTerm||'')+'</h1><img src="'+src+'"><p>Aponte a câmera do celular para realizar sua inscrição.</p><p>'+esc(link)+'</p><script>onload=()=>print()<\/script></body></html>');w.document.close();
  },200);
}
function validateDocument(t){
  const c=cal(),errors=[],warnings=[],active=activeCandidates(),d=dim(),co=comp(),q=qrm();
  const need=(cond,msg)=>{if(!cond)errors.push(msg)};
  need(st.company,'Empresa não preenchida.');
  need(st.nextTerm,'Gestão da CIPA não preenchida.');
  if(t!=='registrationForm'&&t!=='registrationReceipt')need(st.mandateEnd,'Término do mandato atual não preenchido.');
  if(['union'].includes(t)){need(st.union,'Sindicato não preenchido.');need(c.union,'Data de comunicação ao sindicato indisponível.')}
  if(['committee'].includes(t)){
    need(st.committeeMember1,'Comissão Eleitoral: membro 1 não preenchido.');
    need(st.committeeMember2,'Comissão Eleitoral: membro 2 não preenchido.');
    need(st.committeeMember3,'Comissão Eleitoral: membro 3 não preenchido.');
  }
  if(['candidateList','electionNotice','registeredReport','election','result','composition','installationPossession','dossier'].includes(t))need(active.length>0,'Nenhum candidato ativo inscrito.');
  if(['election','result','composition','installationPossession','dossier'].includes(t)){
    need(st.electionDate||c.election,'Data da eleição não preenchida.');
    if(!q.ok)errors.push('Apuração não confere: votantes devem ser candidatos + brancos + nulos.');
  }
  if(['designation','composition','installationPossession','dossier'].includes(t)){
    const indicated=(st.employer||[]).filter(x=>x.name).length;
    need(indicated>=d.e+d.s,'Faltam representantes indicados pela empresa.');
    need(st.newPresident,'Presidente da CIPA não definido.');
    need(st.newVice,'Vice-presidente da CIPA não definido.');
  }
  if(['processNotice','union','designation'].includes(t)&&!st.managerName)warnings.push('Gerente/responsável da empresa não preenchido.');
  if(['registrationNotice','electionNotice'].includes(t)&&!st.safetyTechName)warnings.push('Técnico de Segurança não preenchido.');
  if(t==='election'){
    if(!st.tablePresident)warnings.push('Presidente da Mesa não preenchido.');
    if(!st.tableSecretary)warnings.push('Secretário da Mesa não preenchido.');
  }
  if(t==='dossier'){
    const parts=['processNotice','union','committee','registrationNotice','candidateList','electionNotice','election','result','designation','installationPossession','composition','meetings','registeredReport'];
    parts.forEach(x=>{
      const v=validateDocument(x);
      v.errors.forEach(e=>errors.push(e));
      v.warnings.forEach(w=>warnings.push(w));
    });
  }
  return{errors:[...new Set(errors)],warnings:[...new Set(warnings)]};
}
function documentState(t){
  const v=validateDocument(t),h=st.documentHistory?.[t];
  if(h?.generatedAt)return{label:'Gerado',cls:'cgBadge',detail:fmtDateTime(h.generatedAt)};
  if(v.errors.length)return{label:'Pendente',cls:'cgBadge cgErrBadge',detail:v.errors[0]};
  return{label:'Pronto',cls:'cgBadge cgReadyBadge',detail:v.warnings[0]||'Pronto para emissão'};
}
function recordDocumentGenerated(t,action){
  st.documentHistory=st.documentHistory||{};
  const prev=st.documentHistory[t]||{};
  st.documentHistory[t]={generatedAt:new Date().toISOString(),count:(+prev.count||0)+1,lastAction:action||'gerado'};
  save();
}
function scanPdfNodes(node,cb,path='root'){
  if(!node||typeof node!=='object')return;
  cb(node,path);
  if(Array.isArray(node)){node.forEach((x,i)=>scanPdfNodes(x,cb,path+'['+i+']'));return}
  for(const k of Object.keys(node)){if(typeof node[k]!=='function')scanPdfNodes(node[k],cb,path+'.'+k)}
}
function preflightPdfDefinition(d,t){
  const errors=[],warnings=[];
  if(!d||!Array.isArray(d.content)||!d.content.length)errors.push('PDF sem conteúdo.');
  if(Array.isArray(d.pageMargins)&&(+d.pageMargins[3]||0)<96)d.pageMargins[3]=96;
  const margins=d?.pageMargins||[];if((+margins[3]||0)<88)errors.push('Margem inferior insuficiente para proteger o rodapé.');
  let bodyCorporateLogos=0;
  scanPdfNodes(d,(n,p)=>{
    if(p.startsWith('root.content')&&p.split('.').length<4&&n.image&&(+n.width||0)>=80)bodyCorporateLogos++;
    if(n.table){
      if(n.table.headerRows&&n.table.headerRows>0){n.table.dontBreakRows=true;n.table.keepWithHeaderRows=Math.max(1,+n.table.keepWithHeaderRows||1)}
      if(Array.isArray(n.table.body)&&n.table.body.some(r=>Array.isArray(r)&&r.length===0))errors.push('Tabela contém linha vazia inválida.');
    }
  });
  if(bodyCorporateLogos>0)errors.push('Logo corporativa encontrada no corpo; o padrão permite somente a logo do cabeçalho.');
  if(!d.header)errors.push('PDF sem cabeçalho corporativo.');
  if(!d.footer)errors.push('PDF sem rodapé institucional.');
  if(t==='dossier'&&d.content.filter(x=>x?.pageBreak==='before').length<5)warnings.push('Dossiê pode não estar separando todos os documentos em páginas próprias.');
  return{errors,warnings};
}
function showValidationReport(){
  const results=docs.filter(x=>x[0]!=='dossier').map(x=>({name:x[1],state:documentState(x[0]),v:validateDocument(x[0])}));
  $('#cgEditOv')?.remove();const o=document.createElement('div');o.id='cgEditOv';o.className='cgEditOv';
  o.innerHTML='<div class="cgEditBox"><h3>Validação automática dos documentos</h3><div style="max-height:60vh;overflow:auto">'+results.map(x=>'<div style="padding:10px;border-bottom:1px solid #e2e8f0"><b>'+esc(x.name)+'</b> — <span class="'+x.state.cls+'">'+x.state.label+'</span>'+(x.v.errors.length?'<div style="color:#b91c1c;font-size:11px;margin-top:5px">• '+x.v.errors.map(esc).join('<br>• ')+'</div>':'')+(x.v.warnings.length?'<div style="color:#9a3412;font-size:11px;margin-top:5px">⚠ '+x.v.warnings.map(esc).join('<br>⚠ ')+'</div>':'')+'</div>').join('')+'</div><div style="text-align:right;margin-top:10px"><button id="cgValidationClose" class="cgBtn cgS">Fechar</button></div></div>';
  document.body.appendChild(o);$('#cgValidationClose').onclick=()=>o.remove();
}
async function syncPublicCandidates(){
  const f=await fs();
  const snap=await f.collection(COL).where('kind','==','cipa-candidate').get();
  let changed=false;
  snap.forEach(doc=>{
    const d=doc.data()||{};
    if(String(d.term||'')!==String(st.nextTerm||''))return;
    const idx=st.candidates.findIndex(c=>String(c.publicDocId||'')===doc.id || (d.matricula&&String(c.matricula||'')===String(d.matricula)));
    st.lastCandidateSeq=Math.max(+st.lastCandidateSeq||0,+d.seq||0);
    if(idx>=0){
      const old=st.candidates[idx];
      const merged={...old,
        seq:Math.max(1,+d.seq||+old.seq||1),
        name:String(d.name||old.name||''),
        nameKey:String(d.nameKey||old.nameKey||candidateKey(d.name||old.name||'')),
        role:String(d.role||old.role||''),
        shift:String(d.shift||old.shift||''),
        matricula:String(d.matricula||old.matricula||''),
        sector:String(d.sector||old.sector||''),
        signatureData:String(d.signatureData||old.signatureData||''),
        signatureConfirmed:!!(d.signatureData||old.signatureData||d.signatureConfirmed),
        photoData:String(d.photoData||old.photoData||''),
        photoStatus:['none','pending','approved','rejected','deleted'].includes(d.photoStatus)?d.photoStatus:(old.photoStatus||'none'),
        photoConsent:!!(d.photoConsent||old.photoConsent),
        photoReviewedAt:String(d.photoReviewedAt||old.photoReviewedAt||''),
        status:['Recebida','Conferida','Cancelada'].includes(d.status)?d.status:(old.status||'Recebida'),
        cancelledAt:String(d.cancelledAt||old.cancelledAt||''),
        registeredAt:d.registeredAtIso||old.registeredAt||new Date().toISOString(),
        publicDocId:doc.id,source:'public'
      };
      if(JSON.stringify(merged)!==JSON.stringify(old)){st.candidates[idx]=merged;changed=true}
      return;
    }
    st.candidates.push({
      seq:Math.max(1,+d.seq||st.candidates.length+1),
      name:String(d.name||''),
      nameKey:String(d.nameKey||candidateKey(d.name||'')),
      role:String(d.role||''),
      shift:String(d.shift||''),
      matricula:String(d.matricula||''),
      sector:String(d.sector||''),
      admission:String(d.admission||''),
      signatureData:String(d.signatureData||''),
      signatureConfirmed:!!d.signatureData||!!d.signatureConfirmed,
      photoData:String(d.photoData||''),
      photoStatus:['none','pending','approved','rejected','deleted'].includes(d.photoStatus)?d.photoStatus:'none',
      photoConsent:!!d.photoConsent,
      photoReviewedAt:String(d.photoReviewedAt||''),
      status:['Recebida','Conferida','Cancelada'].includes(d.status)?d.status:'Recebida',
      cancelledAt:String(d.cancelledAt||''),
      votes:0,
      registeredAt:d.registeredAtIso||new Date().toISOString(),
      publicDocId:doc.id,
      source:'public'
    });
    changed=true;
  });
  if(changed){
    st.candidates.sort((a,b)=>(+a.seq||9999)-(+b.seq||9999));
    save();
  }
}
function todayCuiaba(){
  return new Date().toLocaleDateString('en-CA',{timeZone:'America/Cuiaba'});
}
function daysUntil(v){
  if(!v)return null;
  const a=String(todayCuiaba()).split('-').map(Number),b=String(v).split('-').map(Number);
  if(a.length!==3||b.length!==3)return null;
  return Math.round((Date.UTC(b[0],b[1]-1,b[2])-Date.UTC(a[0],a[1]-1,a[2]))/86400000);
}
function calendarAlerts(){
  return rows().map(x=>({label:x[0],date:x[1],days:daysUntil(x[1])}))
    .filter(x=>x.date&&x.days!==null&&x.days>=0&&x.days<=60)
    .sort((a,b)=>a.days-b.days).slice(0,6);
}
function toast(message){
  let t=document.getElementById('cgToast');
  if(!t){t=document.createElement('div');t.id='cgToast';t.style.cssText='position:fixed;right:18px;bottom:18px;z-index:14050;max-width:370px;background:#0f172a;color:#fff;padding:14px 16px;border-radius:12px;box-shadow:0 18px 50px #0005;font-weight:800;font-size:13px';document.body.appendChild(t)}
  t.textContent=message;t.style.display='block';clearTimeout(t._hide);t._hide=setTimeout(()=>{t.style.display='none'},7000);
}
function browserNotification(title,body){
  try{if('Notification' in window&&Notification.permission==='granted')new Notification(title,{body,icon:LOGO})}catch(_){}
}
function addCandidateAlert(id,d){
  const alertId='candidate:'+id;
  if(st.alerts.some(a=>a.id===alertId))return;
  const item={id:alertId,type:'candidate',message:'Inscrição recebida: Nº '+fmtSeq(d.seq)+' — '+String(d.name||'Candidato'),createdAt:new Date().toISOString()};
  st.alerts.unshift(item);st.alerts=st.alerts.slice(0,50);
  localStorage.setItem(KEY,JSON.stringify(st));
  toast(item.message);browserNotification('Nova inscrição da CIPA',item.message);
}
async function startCandidateWatch(){
  if(candidateWatchUnsub)return;
  try{
    const f=await fs();
    candidateWatchPrimed=false;
    candidateWatchUnsub=f.collection(COL).where('kind','==','cipa-candidate').onSnapshot(async snap=>{
      let changed=false;
      snap.docChanges().forEach(ch=>{
        const d=ch.doc.data()||{};
        if(String(d.term||'')!==String(st.nextTerm||''))return;
        const known=candidateKnownIds.has(ch.doc.id);
        candidateKnownIds.add(ch.doc.id);
        if(candidateWatchPrimed&&ch.type==='added'&&!known)addCandidateAlert(ch.doc.id,d);
        if(ch.type==='added'||ch.type==='modified')changed=true;
      });
      if(changed){
        await syncPublicCandidates();
        if($('#cgOv')){renderCand();renderData()}
      }
      candidateWatchPrimed=true;
    },e=>console.warn('[CIPA REALTIME]',e));
  }catch(e){console.warn('[CIPA WATCH START]',e)}
}
function stopCandidateWatch(){
  try{candidateWatchUnsub&&candidateWatchUnsub()}catch(_){}
  candidateWatchUnsub=null;candidateWatchPrimed=false;candidateKnownIds.clear();
}
function alertsPanel(){
  const upcoming=calendarAlerts();
  const recentCandidates=[...(st.candidates||[])].filter(x=>x.name).sort((a,b)=>String(b.registeredAt||'').localeCompare(String(a.registeredAt||''))).slice(0,6);
  const upcomingHtml=upcoming.length?upcoming.map(x=>{
    const msg=x.days===0?'Hoje: '+x.label:(x.days===1?'Falta 1 dia para '+x.label:'Faltam '+x.days+' dias para '+x.label);
    return '<div style="padding:9px 0;border-bottom:1px solid #e2e8f0"><b>📅 '+esc(msg)+'</b><div class="cgHint">'+br(x.date)+'</div></div>';
  }).join(''):'<div class="cgHint">Nenhuma etapa do calendário nos próximos 60 dias.</div>';
  const receivedHtml=recentCandidates.length?recentCandidates.map(c=>'<div style="padding:9px 0;border-bottom:1px solid #e2e8f0"><b>🔔 Inscrição recebida: Nº '+fmtSeq(c.seq)+' — '+esc(c.name)+'</b><div class="cgHint">'+fmtDateTime(c.registeredAt)+' • Matrícula '+esc(c.matricula||'')+'</div></div>').join(''):'<div class="cgHint">Nenhuma inscrição recebida nesta gestão.</div>';
  return '<div class="cgCard"><h3>🔔 Alertas da CIPA</h3><div class="cgGrid"><div><b>Próximas datas</b>'+upcomingHtml+'</div><div><b>Últimas inscrições recebidas</b>'+receivedHtml+'</div></div>'+
    '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px"><button id="cgEnableNotif" class="cgBtn cgS">Ativar notificações do navegador</button><button id="cgClearAlerts" class="cgBtn cgS">Limpar avisos em tempo real</button></div>'+
    '<div class="cgHint">As últimas inscrições sempre aparecem aqui. Os alertas em tempo real funcionam enquanto a Gestão CIPA estiver aberta; notificações do navegador dependem da permissão.</div></div>';
}
function notifyUpcomingOnOpen(){
  const next=calendarAlerts()[0];if(!next)return;
  const key='tbm_cipa_date_alert_'+todayCuiaba()+'_'+next.label+'_'+next.date;
  if(localStorage.getItem(key))return;
  const msg=next.days===0?'Hoje é a data de '+next.label:(next.days===1?'Falta 1 dia para '+next.label:'Faltam '+next.days+' dias para '+next.label);
  toast(msg+' — '+br(next.date));
  browserNotification('Prazo da CIPA',msg+' — '+br(next.date));
  localStorage.setItem(key,'1');
}
async function cloudLoad(){
  try{
    const local=JSON.parse(localStorage.getItem(KEY)||'null');
    if(local){st=Object.assign(base(),local);migrate()}
    render();notifyUpcomingOnOpen();setCloud('💾 Dados desta empresa',1);
  }catch(e){console.warn('[CIPA LOCAL]',e);setCloud('💾 Modo local',0)}
}
function setCloud(t,ok){const e=$('#cgCloud');if(e){e.textContent=t;e.style.color=ok?'#bbf7d0':'#fecaca'}}
function pd(v){const m=String(v||'').match(/^(\d{4})-(\d{2})-(\d{2})$/);return m?new Date(+m[1],+m[2]-1,+m[3],12):null}
function iso(d){return d&&!isNaN(d)?[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-'):''}
function plus(v,n){const d=pd(v);if(!d)return'';d.setDate(d.getDate()+n);return iso(d)}
function nextWork(v){const d=pd(v);if(!d)return'';do{d.setDate(d.getDate()+1)}while([0,6].includes(d.getDay()));return iso(d)}
function br(v){const d=pd(v);return d?d.toLocaleDateString('pt-BR'):'—'}
function long(v){const d=pd(v);return d?d.toLocaleDateString('pt-BR',{day:'2-digit',month:'long',year:'numeric'}):''}
function longTbm(v){
  const t=long(v);
  return t?t.replace(/ de ([a-záéíóúç]+)/i,(m,mes)=>' de '+mes.charAt(0).toUpperCase()+mes.slice(1)):'';
}
function dim(){const r=DIM[+st.risk]||DIM[3],n=Math.max(0,+st.employees||0);if(n>10000){const g=Math.ceil((n-10000)/2500);return{e:r.e[12]+g*r.i,s:r.s[12]+g*r.i}}let i=R.findIndex(x=>n>=x[0]&&n<=x[1]);if(i<0)i=0;return{e:r.e[i],s:r.s[i]}}
function cal(){
  if(!st.mandateEnd)return{};
  const c=plus(st.mandateEnd,-60),rs=c,re=plus(rs,14);
  const el=st.electionDate||plus(st.mandateEnd,-30);
  const po=nextWork(st.mandateEnd);
  return {
    conv:c,union:c,ce:c,regStart:rs,regEnd:re,list:plus(re,1),
    election:el,result:el,posse:po,
    training:st.firstMandate?plus(po,30):plus(po,-1)
  };
}
function qrm(){
  const candidateVotes=st.candidates.filter(c=>c.status!=='Cancelada').reduce((n,c)=>n+Math.max(0,+c.votes||0),0);
  const voters=Math.max(0,+st.totalVoters||0);
  const blank=Math.max(0,+st.blankVotes||0),nul=Math.max(0,+st.nullVotes||0);
  const totalComputed=candidateVotes+blank+nul;
  const eligible=Math.max(0,+st.eligible||+st.employees||0);
  return {
    ok:voters===totalComputed,
    t:'Votação realizada em um único dia.',
    v:voters,candidateVotes,blank,nul,totalComputed,eligible,
    participation:eligible?((voters/eligible)*100):0,
    difference:voters-totalComputed
  };
}

function rank(){
  return st.candidates.filter(c=>c.status!=='Cancelada').sort((a,b)=>{
    const dv=(+b.votes||0)-(+a.votes||0);
    if(dv)return dv;
    if(a.admission&&b.admission&&a.admission!==b.admission)return String(a.admission).localeCompare(String(b.admission));
    const ds=(+a.seq||9999)-(+b.seq||9999);
    if(ds)return ds;
    return String(a.name||'').localeCompare(String(b.name||''),'pt-BR');
  });
}
function comp(){const d=dim(),r=rank();return{d,eff:r.slice(0,d.e),sup:r.slice(d.e,d.e+d.s),rest:r.slice(d.e+d.s)}}
function buildCompositionSnapshot(){
  const c=comp();
  return {
    term:st.nextTerm||'',
    president:st.newPresident||'',
    vice:st.newVice||'',
    electedTitular:c.eff.map(x=>({name:x.name||'',seq:+x.seq||0,votes:+x.votes||0,role:'Representante dos Empregados - Titular'})),
    electedSuplente:c.sup.map(x=>({name:x.name||'',seq:+x.seq||0,votes:+x.votes||0,role:'Representante dos Empregados - Suplente'})),
    employerTitular:(st.employer||[]).filter(x=>x.role==='Titular'&&x.name).map(x=>({name:x.name,function:x.function||'',role:'Representante da Empresa - Titular'})),
    employerSuplente:(st.employer||[]).filter(x=>x.role==='Suplente'&&x.name).map(x=>({name:x.name,function:x.function||'',role:'Representante da Empresa - Suplente'})),
    safetyTech:st.safetyTechName?{name:st.safetyTechName,role:st.safetyTechRole||'Técnico de Segurança do Trabalho'}:null,
    manager:st.managerName?{name:st.managerName,role:st.managerRole||'Gerente Industrial ROO'}:null,
    updatedAt:new Date().toISOString()
  };
}
function meetings(){const c=cal(),p=pd(c.posse);if(!p)return[];return Array.from({length:12},(_,i)=>{const d=new Date(p.getFullYear(),p.getMonth()+i,Math.max(1,Math.min(28,+st.meetingDay||10)),12);if(d.getDay()===0)d.setDate(d.getDate()+1);if(d.getDay()===6)d.setDate(d.getDate()+2);return{i:i+1,date:iso(d),time:st.meetingTime||'07:30'}})}
function style(){if($('#cgStyle'))return;const s=document.createElement('style');s.id='cgStyle';s.textContent='.cgTile{background:linear-gradient(145deg,#123b5d,#0f766e)}.cgOv{position:fixed;inset:0;z-index:12500;background:#03111ddd;overflow:auto;padding:16px}.cgSh{max-width:1100px;margin:auto;background:#f3f6f9;border-radius:20px;overflow:hidden}.cgTop{position:sticky;top:0;z-index:4;background:linear-gradient(135deg,#0f2940,#0f766e);color:#fff;padding:15px;display:flex;gap:11px;align-items:center}.cgTop img{width:56px;height:56px;background:#fff;padding:5px;border-radius:11px;object-fit:contain}.cgTop h2{margin:0;font-size:22px}.cgTop p{margin:3px 0;font-size:11px;opacity:.8}.cgClose{margin-left:auto;background:#fff;color:#123b5d;border:0;border-radius:9px;padding:10px 12px;font-weight:900}.cgBody{padding:15px}.cgTabs{display:flex;gap:6px;overflow:auto}.cgTab{white-space:nowrap;border:1px solid #cbd5e1;background:#fff;border-radius:999px;padding:9px 12px;font-weight:900}.cgTab.on{background:#0f766e;color:#fff}.cgPane{display:none}.cgPane.on{display:block}.cgCard{background:#fff;border:1px solid #dbe2e8;border-radius:14px;padding:14px;margin:11px 0}.cgCard h3{margin:0 0 11px}.cgGrid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.cgF label{display:block;font-size:11px;font-weight:900;margin-bottom:5px;color:#475569}.cgF input,.cgF select{width:100%;padding:10px;border:1px solid #cbd5e1;border-radius:8px;background:#fff}.cgHint{font-size:11px;color:#64748b;line-height:1.4;margin-top:5px}.cgTable{width:100%;border-collapse:collapse;font-size:12px}.cgTable th,.cgTable td{border:1px solid #dbe2e8;padding:7px;text-align:left}.cgTable th{background:#eef2f6}.cgBtn{border:0;border-radius:9px;padding:9px 12px;font-weight:900}.cgP{background:#0f766e;color:#fff}.cgS{background:#e2e8f0;color:#17202b}.cgD{background:#fee2e2;color:#991b1b}.cgRow{display:grid;grid-template-columns:1.3fr 1fr 1fr 80px 40px;gap:6px;margin:7px 0}.cgRow input,.cgRow select{min-width:0;padding:8px;border:1px solid #cbd5e1;border-radius:8px}.cgDoc{display:flex;justify-content:space-between;gap:8px;align-items:center;border:1px solid #dbe2e8;border-radius:10px;padding:10px;margin:7px 0}.cgBadge{display:inline-block;padding:5px 8px;border-radius:999px;font-size:10px;font-weight:900;background:#dcfce7;color:#166534}.cgWarn{background:#ffedd5;color:#9a3412}.cgReadyBadge{background:#dbeafe;color:#1d4ed8}.cgErrBadge{background:#fee2e2;color:#991b1b}.cgLockCard{border-left:5px solid #0f766e}.cgLockOff{background:#f1f5f9}.cgArchived{background:#ede9fe;color:#6d28d9}.cgStatusReceived{background:#dbeafe;color:#1d4ed8}.cgStatusChecked{background:#dcfce7;color:#166534}.cgStatusCancelled{background:#fee2e2;color:#991b1b}@media(max-width:760px){.cgOv{padding:0}.cgSh{min-height:100vh;border-radius:0}.cgGrid{grid-template-columns:1fr}.cgRow{grid-template-columns:1fr 1fr}.cgRow .wide{grid-column:1/-1}.cgDoc{align-items:flex-start;flex-direction:column}}';s.textContent+=`.cgSh,.cgBody,.cgPane,.cgCard,.cgCard h3,.cgCard b,.cgCard strong,.cgCard li,.cgTable,.cgTable td,.cgTable th,.cgDoc{color:#17202b!important}.cgCard h3{color:#0f172a!important}.cgF input,.cgF select,.cgRow input,.cgRow select,.cgVoteInput{background:#fff!important;color:#0f172a!important}.cgF input::placeholder,.cgRow input::placeholder{color:#64748b!important}.cgCandidateForm{display:grid;grid-template-columns:1.4fr 1fr .8fr .8fr auto;gap:7px;margin:12px 0}.cgCandidateForm input,.cgCandidateForm select{min-width:0;padding:10px;border:1px solid #cbd5e1;border-radius:8px;background:#fff;color:#0f172a}.cgLinkBox{display:grid;grid-template-columns:1fr auto auto;gap:7px;align-items:center}.cgLinkBox input{width:100%;padding:10px;border:1px solid #cbd5e1;border-radius:8px;background:#f8fafc;color:#0f172a}.cgEditOv{position:fixed;inset:0;z-index:13000;background:#0009;display:flex;align-items:center;justify-content:center;padding:16px}.cgEditBox{width:min(760px,100%);background:#fff;color:#17202b;border-radius:16px;padding:18px;box-shadow:0 25px 70px #0007}.cgEditBox textarea{width:100%;min-height:280px;padding:12px;border:1px solid #cbd5e1;border-radius:10px;color:#0f172a;background:#fff;line-height:1.5}.cgMetrics{display:grid;grid-template-columns:repeat(3,1fr);gap:9px;margin:12px 0}.cgMetric{background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:12px;text-align:center}.cgMetric b{display:block;font-size:24px;color:#0f766e!important}.cgEmployerRow{display:grid;grid-template-columns:1.4fr 1fr .8fr;gap:7px;margin:7px 0}.cgEmployerRow input,.cgEmployerRow select{padding:9px;border:1px solid #cbd5e1;border-radius:8px;background:#fff;color:#0f172a}@media(max-width:760px){.cgCandidateForm,.cgLinkBox,.cgEmployerRow{grid-template-columns:1fr}.cgMetrics{grid-template-columns:1fr}.cgTable{min-width:720px}}`;document.head.appendChild(s)}
function activatePane(name){
  const root=$('#cgOv');if(!root)return;
  $$('.cgTab',root).forEach(x=>x.classList.toggle('on',x.dataset.t===name));
  $$('.cgPane',root).forEach(x=>x.classList.toggle('on',x.dataset.p===name));
  if(name==='cand')setTimeout(()=>$('#cg-cand')?.scrollIntoView({behavior:'smooth',block:'start'}),80);
}
function openCandidatesPanel(){open();setTimeout(()=>activatePane('cand'),120)}
function tile(){
  const t=$('#home .tiles');if(!t)return;
  if(!$('#cgTile')){
    const b=document.createElement('button');b.id='cgTile';b.className='tile cgTile';b.type='button';
    b.innerHTML='<div class="ico">🗳️</div><div><b>Gestão CIPA – NR-5</b><span>Eleição, atas, calendário e PDFs A4</span></div>';
    b.onclick=open;t.appendChild(b);
  }
  if(!$('#cgPanelTile')){
    const p=document.createElement('button');p.id='cgPanelTile';p.className='tile cgTile';p.type='button';
    p.innerHTML='<div class="ico">📸</div><div><b>Painel de Candidatos – CIPA</b><span>Fotos, aprovação e PDF para mural</span></div>';
    p.onclick=openCandidatesPanel;t.appendChild(p);
  }
}
function open(){style();$('#cgOv')?.remove();const r=document.createElement('div');r.id='cgOv';r.className='cgOv';r.innerHTML='<div class="cgSh"><div class="cgTop"><img src="'+LOGO+'"><div><h2>Gestão CIPA – NR-5</h2><p>Processo eleitoral completo e documentos A4</p><div id="cgCloud" style="font-size:10px">☁️ Sincronizando...</div></div><button id="cgTopPanel" class="cgBtn cgP" style="margin-left:auto;white-space:nowrap">📸 Painel PDF dos Candidatos</button><button id="cgClose" class="cgClose" style="margin-left:0">✕ Fechar</button></div><div class="cgBody"><div class="cgTabs">'+[['dados','Dados'],['cal','Calendário'],['cand','Candidatos'],['vote','Votação'],['comp','Composição'],['docs','PDFs A4']].map((x,i)=>'<button class="cgTab '+(!i?'on':'')+'" data-t="'+x[0]+'">'+x[1]+'</button>').join('')+'</div>'+['dados','cal','cand','vote','comp','docs'].map((x,i)=>'<div class="cgPane '+(!i?'on':'')+'" data-p="'+x+'" id="cg-'+x+'"></div>').join('')+'</div></div>';document.body.appendChild(r);$('#cgClose').onclick=()=>{stopCandidateWatch();r.remove()};$('#cgTopPanel').onclick=()=>activatePane('cand');$$('.cgTab',r).forEach(b=>b.onclick=()=>activatePane(b.dataset.t));render();cloudLoad()}
function f(id,l,type='text',attr=''){return '<div class="cgF"><label>'+l+'</label><input id="'+id+'" type="'+type+'" '+attr+'></div>'}
function bind(map){Object.entries(map).forEach(([id,k])=>{const e=$('#'+id);if(!e)return;e.value=st[k]??'';e.onchange=()=>{st[k]=e.type==='number'?+e.value:e.value;save();render()}})}
function renderPaneSafe(name,fn){
  try{fn()}
  catch(e){
    console.error('[CIPA RENDER '+name+']',e);
    const pane=$('#cg-'+name);
    if(pane)pane.innerHTML='<div class="cgCard" style="border-left:5px solid #b91c1c"><h3>⚠ Não foi possível carregar esta seção</h3><div class="cgHint">'+esc(e?.message||String(e))+'</div><button class="cgBtn cgS" style="margin-top:10px" onclick="location.reload()">Atualizar sistema</button></div>';
  }
}
function render(){
  if(!$('#cgOv'))return;
  renderPaneSafe('dados',renderData);
  renderPaneSafe('cal',renderCal);
  renderPaneSafe('cand',renderCand);
  renderPaneSafe('vote',renderVote);
  renderPaneSafe('comp',renderComp);
  renderPaneSafe('docs',renderDocs);
  if(!$('.cgPane.on',$('#cgOv')))activatePane('dados');
}
function renderData(){
  const d=dim();
  $('#cg-dados').innerHTML=
    alertsPanel()+
    '<div class="cgCard"><h3>Dados da gestão '+(st.isArchived?'<span class="cgBadge cgArchived">ARQUIVADA</span>':'')+'</h3><div class="cgGrid">'+
      f('cgCompany','Empresa *')+f('cgUnit','Unidade')+f('cgCnpj','CNPJ')+f('cgAddress','Endereço')+
      f('cgUnion','Sindicato da categoria')+
      '<div class="cgF"><label>Grau de risco *</label><select id="cgRisk"><option>1</option><option>2</option><option>3</option><option>4</option></select></div>'+
      f('cgEmployees','Número de empregados *','number','min="0"')+f('cgCurrentTerm','Gestão atual')+f('cgNextTerm','Próxima gestão')+
      f('cgMandateEnd','Término do mandato atual *','date')+
      '<div class="cgF"><label>Primeira constituição?</label><select id="cgFirst"><option value="false">Não</option><option value="true">Sim</option></select></div>'+
      f('cgPresident','Presidente atual da CIPA')+f('cgVice','Vice-presidente atual da CIPA')+
    '</div></div>'+
    '<div class="cgCard"><h3>Responsáveis e assinaturas dos documentos</h3>'+
      '<div class="cgHint">Preencha somente os responsáveis que serão usados nesta gestão. Estes nomes são digitados manualmente e não são buscados em cadastro de funcionários.</div>'+
      '<div class="cgGrid" style="margin-top:10px">'+
        f('cgManagerName','Gerente / responsável da empresa')+f('cgManagerRole','Cargo do gerente / responsável')+
        f('cgSafetyTechName','Técnico de Segurança')+f('cgSafetyTechRole','Cargo do Técnico de Segurança')+
        f('cgUnionRep','Representante do sindicato')+
        f('cgCommittee1','Comissão Eleitoral — Membro 1')+
        f('cgCommittee2','Comissão Eleitoral — Membro 2')+
        f('cgCommittee3','Comissão Eleitoral — Membro 3')+
        f('cgTablePresident','Presidente da Mesa de votação')+
        f('cgTableSecretary','Secretário da Mesa')+
        f('cgTableMember','Membro da Mesa')+
        f('cgGuest1','Convidado para apuração 1')+
        f('cgGuest2','Convidado para apuração 2')+
        f('cgSessionPresident','Presidente da Sessão de Posse')+
        f('cgSessionSecretary','Secretário da Sessão de Posse')+
      '</div>'+
    '</div>'+
    '<div class="cgGrid"><div class="cgCard"><b>Titulares eleitos</b><div style="font-size:28px;font-weight:900">'+d.e+'</div><div class="cgHint">Quadro I da NR-5</div></div>'+
    '<div class="cgCard"><b>Suplentes eleitos</b><div style="font-size:28px;font-weight:900">'+d.s+'</div><div class="cgHint">Mesma quantidade de representantes é designada pela organização.</div></div></div>'+
    '<div class="cgCard"><h3>🛡️ Backup e encerramento da gestão</h3>'+
      '<div class="cgHint">O backup salva candidatos, assinaturas, votos, composição, calendário, responsáveis, textos e histórico documental.</div>'+
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">'+
        '<button id="cgBackup" class="cgBtn cgP">⬇ Baixar backup</button>'+
        '<button id="cgRestore" class="cgBtn cgS">⬆ Restaurar backup</button>'+
        '<button id="cgArchiveList" class="cgBtn cgS">📚 Consultar gestões arquivadas</button>'+
        '<input id="cgRestoreFile" type="file" accept="application/json,.json" style="display:none">'+
        (!st.isArchived?'<button id="cgArchive" class="cgBtn cgD">🔒 Encerrar e arquivar gestão</button>':'<button id="cgNextManagement" class="cgBtn cgP">＋ Iniciar próxima gestão</button>')+
      '</div>'+
      (st.isArchived?'<div class="cgHint">Arquivada em '+fmtDateTime(st.archivedAt)+' • ID '+esc(st.archiveId||'')+'</div>':'')+
    '</div>';
  bind({
    cgCompany:'company',cgUnit:'unit',cgCnpj:'cnpj',cgAddress:'address',cgUnion:'union',cgRisk:'risk',
    cgEmployees:'employees',cgCurrentTerm:'currentTerm',cgNextTerm:'nextTerm',cgMandateEnd:'mandateEnd',
    cgPresident:'president',cgVice:'vice',
    cgManagerName:'managerName',cgManagerRole:'managerRole',cgSafetyTechName:'safetyTechName',cgSafetyTechRole:'safetyTechRole',
    cgUnionRep:'unionRepresentative',cgCommittee1:'committeeMember1',cgCommittee2:'committeeMember2',cgCommittee3:'committeeMember3',
    cgTablePresident:'tablePresident',cgTableSecretary:'tableSecretary',cgTableMember:'tableMember',
    cgGuest1:'guest1',cgGuest2:'guest2',cgSessionPresident:'sessionPresident',cgSessionSecretary:'sessionSecretary'
  });
  $('#cgEnableNotif')&&($('#cgEnableNotif').onclick=async()=>{
    if(!('Notification' in window)){alert('Este navegador não oferece notificações.');return}
    const p=await Notification.requestPermission();
    if(p==='granted'){alert('Notificações do navegador ativadas para quando o sistema estiver aberto.')}else alert('Permissão de notificações não concedida.');
  });
  $('#cgClearAlerts')&&($('#cgClearAlerts').onclick=()=>{st.alerts=[];save();renderData()});
  $('#cgFirst').value=String(!!st.firstMandate);
  $('#cgFirst').onchange=()=>{if(st.isArchived)return;st.firstMandate=$('#cgFirst').value==='true';save();render()};
  $('#cgBackup').onclick=downloadBackup;
  $('#cgRestore').onclick=()=>$('#cgRestoreFile').click();
  $('#cgArchiveList').onclick=showArchiveList;
  $('#cgRestoreFile').onchange=e=>restoreBackupFile(e.target.files?.[0]);
  $('#cgArchive')&&($('#cgArchive').onclick=archiveCurrentManagement);
  $('#cgNextManagement')&&($('#cgNextManagement').onclick=startNextManagement);
  if(st.isArchived)$$('#cg-dados input,#cg-dados select').forEach(e=>{if(e.id!=='cgRestoreFile')e.disabled=true});
}

function rows(){const c=cal();return[['Convocação',c.conv,'mínimo 60 dias antes','5.5.1'],['Comunicação ao sindicato',c.union,'com antecedência','5.5.1.1'],['Comissão Eleitoral',c.ce,'sem prazo numérico; sugerido junto à convocação','5.5.2'],['Abertura de inscrições',c.regStart,'início do período','5.5.3(a)'],['Fim das inscrições',c.regEnd,'mínimo 15 dias corridos','5.5.3(b)'],['Divulgação dos inscritos',c.list,'data sugerida após encerramento','5.5.3(e)'],['Eleição',c.election,'mínimo 30 dias antes','5.5.3(f)'],['Resultado',c.result,'após apuração válida','5.5.6'],['Posse',c.posse,'1º dia útil após o mandato','5.4.7'],['Treinamento',c.training,st.firstMandate?'até 30 dias após a posse':'antes da posse','5.7.1']]}
function renderCal(){
  const m=meetings(),locks=st.stageLocks||{};
  const lockButton=(key,label)=>{
    const locked=isStageLocked(key);
    return '<div class="cgCard cgLockCard '+(locked?'':'cgLockOff')+'"><b>'+label+'</b><div class="cgHint">'+(locked?'Etapa encerrada e protegida contra alterações.':'Etapa aberta para trabalho.')+'</div><button class="cgBtn '+(locked?'cgS':'cgP')+'" data-stage="'+key+'" data-lock="'+(locked?'0':'1')+'" '+(st.isArchived?'disabled':'')+'>'+(locked?'🔓 Reabrir etapa':'🔒 Encerrar etapa')+'</button></div>';
  };
  $('#cg-cal').innerHTML=
    '<div class="cgCard"><h3>Calendário automático</h3><div class="cgHint">Prazos mínimos da NR-5 são calculados automaticamente a partir do término do mandato.</div><div style="overflow:auto"><table class="cgTable"><tr><th>Etapa</th><th>Data</th><th>Regra</th><th>NR-5</th></tr>'+rows().map(x=>'<tr><td><b>'+x[0]+'</b></td><td>'+br(x[1])+'</td><td>'+x[2]+'</td><td>'+x[3]+'</td></tr>').join('')+'</table></div></div>'+
    '<div class="cgCard"><h3>Controle das etapas</h3><div class="cgGrid">'+lockButton('registration','Inscrições')+lockButton('voting','Votação')+lockButton('composition','Composição')+'</div></div>'+
    '<div class="cgCard"><h3>Reuniões ordinárias</h3><div class="cgGrid">'+f('cgMeetingDay','Dia do mês','number','min="1" max="28"')+f('cgMeetingTime','Horário','time')+'</div><table class="cgTable"><tr><th>Reunião</th><th>Data</th><th>Hora</th></tr>'+m.map(x=>'<tr><td>'+x.i+'ª</td><td>'+br(x.date)+'</td><td>'+x.time+'</td></tr>').join('')+'</table></div>';
  bind({cgMeetingDay:'meetingDay',cgMeetingTime:'meetingTime'});
  $$('[data-stage]').forEach(b=>b.onclick=()=>toggleStage(b.dataset.stage,b.dataset.lock==='1'));
  if(st.isArchived)$$('#cg-cal input,#cg-cal select').forEach(e=>e.disabled=true);
}

function cipaPublicLink(){
  return new URL('cipa-inscricao.html',window.location.href).href;
}
function nextSeq(){
  const maxExisting=st.candidates.reduce((m,c)=>Math.max(m,+c.seq||0),0);
  st.lastCandidateSeq=Math.max(+st.lastCandidateSeq||0,maxExisting)+1;
  return st.lastCandidateSeq;
}
function fmtSeq(v){return String(Math.max(1,+v||1)).padStart(2,'0')}
async function deleteCandidate(i){
  const c=st.candidates[i];
  if(!c)return;
  if(st.isArchived){alert('Gestão arquivada: exclusão bloqueada.');return}
  const msg='EXCLUIR DEFINITIVAMENTE a inscrição nº '+fmtSeq(c.seq)+' de '+(c.name||'este candidato')+'?\n\nUse esta opção apenas para teste ou cadastro lançado por engano. A inscrição, assinatura, foto e aviso serão removidos e não ficarão na lista/histórico da CIPA.';
  if(!confirm(msg))return;
  try{
    const f=await fs();
    if(c.publicDocId){
      await f.collection(COL).doc(c.publicDocId).delete();
      candidateKnownIds.delete(c.publicDocId);
    }
    const publicTerm=candidateKey(st.nextTerm);
    const publicName=String(c.nameKey||candidateKey(c.name));
    if(publicTerm&&publicName){
      try{await f.collection(COL).doc('_cipa_candidate_name_'+publicTerm+'_'+publicName).delete()}catch(e){console.warn('[CIPA DELETE NAME LOCK]',e)}
    }
    st.candidates.splice(i,1);
    st.alerts=(st.alerts||[]).filter(a=>a.id!=='candidate:'+String(c.publicDocId||'') && !String(a.message||'').includes('Nº '+fmtSeq(c.seq)+' — '+String(c.name||'')));
    const maxRemaining=st.candidates.reduce((m,x)=>Math.max(m,+x.seq||0),0);
    st.lastCandidateSeq=maxRemaining;
    const counterId='_cipa_candidate_counter_'+candidateKey(st.nextTerm);
    await f.collection(COL).doc(counterId).set({
      kind:'cipa-candidate-counter',
      term:st.nextTerm||'',
      count:maxRemaining,
      updatedAt:firebase.firestore.FieldValue.serverTimestamp()
    },{merge:true});
    editingCandidate=-1;
    save();
    window.tbmSystemAudit?.('EXCLUIU','CIPA','Candidato excluído definitivamente; sequência recalculada',{entityId:fmtSeq(c.seq)+' '+String(c.name||'')});
    render();
    toast(maxRemaining===0?'Candidato excluído. Numeração zerada: a próxima inscrição será 01.':'Candidato excluído. Próxima numeração seguirá após '+fmtSeq(maxRemaining)+'.');
  }catch(e){
    console.error('[CIPA DELETE CANDIDATE]',e);
    alert('Não foi possível excluir definitivamente o candidato. Nenhum dado local foi removido.\n\n'+(e?.message||e));
  }
}
function fmtDateTime(v){
  const d=new Date(v||'');if(isNaN(d))return'—';
  return d.toLocaleString('pt-BR',{timeZone:'America/Cuiaba',day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});
}
function showCandidateSignature(i){
  const c=st.candidates[i];if(!c)return;
  const old=$('#cgEditOv');if(old)old.remove();
  const o=document.createElement('div');o.id='cgEditOv';o.className='cgEditOv';
  o.innerHTML='<div class="cgEditBox"><h3>Assinatura — '+esc(c.name||'Candidato')+'</h3>'+
    (c.signatureData?'<div style="border:1px solid #cbd5e1;border-radius:10px;padding:12px;background:#fff;text-align:center"><img src="'+esc(c.signatureData)+'" style="max-width:100%;max-height:220px"></div>':'<div class="cgHint">Este candidato ainda não possui assinatura digital salva.</div>')+
    '<div style="text-align:right;margin-top:10px"><button id="cgSigClose" class="cgBtn cgS">Fechar</button></div></div>';
  document.body.appendChild(o);$('#cgSigClose').onclick=()=>o.remove();
}
async function saveCandidateSignatureCloud(c){
  if(!c?.publicDocId)return;
  try{
    const f=await fs();
    await f.collection(COL).doc(c.publicDocId).set({
      signatureData:c.signatureData||'',
      signatureConfirmed:!!c.signatureData,
      signatureUpdatedAt:firebase.firestore.FieldValue.serverTimestamp()
    },{merge:true});
  }catch(e){console.warn('[CIPA SIGNATURE CLOUD]',e)}
}
function redrawCandidateSignature(i){
  const c=st.candidates[i];if(!c)return;
  $('#cgEditOv')?.remove();
  const o=document.createElement('div');o.id='cgEditOv';o.className='cgEditOv';
  o.innerHTML='<div class="cgEditBox"><h3>Refazer assinatura — '+esc(c.name||'Candidato')+'</h3><div class="cgHint">Assine com o dedo no celular ou com o mouse. A nova assinatura substituirá a anterior somente ao salvar.</div>'+
    '<div style="border:2px dashed #94a3b8;border-radius:10px;background:#fff;overflow:hidden;margin-top:12px"><canvas id="cgSigCanvas" style="display:block;width:100%;height:190px;touch-action:none;background:#fff"></canvas></div>'+
    '<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:10px"><button id="cgSigClear" class="cgBtn cgS">Limpar</button><button id="cgSigCancel" class="cgBtn cgS">Cancelar</button><button id="cgSigSave" class="cgBtn cgP">Salvar assinatura</button></div></div>';
  document.body.appendChild(o);
  const canvas=$('#cgSigCanvas'),ctx=canvas.getContext('2d');let drawing=false,last=null,dirty=false;
  const rect=()=>canvas.getBoundingClientRect();
  const ratio=Math.max(1,Math.min(2,window.devicePixelRatio||1));
  canvas.width=Math.round(rect().width*ratio);canvas.height=Math.round(190*ratio);
  ctx.setTransform(ratio,0,0,ratio,0,0);ctx.lineCap='round';ctx.lineJoin='round';ctx.lineWidth=2.2;ctx.strokeStyle='#111827';
  if(c.signatureData){const img=new Image();img.onload=()=>ctx.drawImage(img,0,0,rect().width,190);img.src=c.signatureData}
  const pt=e=>{const r=rect();return{x:e.clientX-r.left,y:e.clientY-r.top}};
  canvas.onpointerdown=e=>{e.preventDefault();drawing=true;last=pt(e);dirty=true;try{canvas.setPointerCapture(e.pointerId)}catch(_){}};
  canvas.onpointermove=e=>{if(!drawing)return;e.preventDefault();const p=pt(e);ctx.beginPath();ctx.moveTo(last.x,last.y);ctx.lineTo(p.x,p.y);ctx.stroke();last=p};
  canvas.onpointerup=canvas.onpointercancel=e=>{if(!drawing)return;e.preventDefault();drawing=false;last=null};
  $('#cgSigClear').onclick=()=>{ctx.clearRect(0,0,canvas.width,canvas.height);dirty=true};
  $('#cgSigCancel').onclick=()=>o.remove();
  $('#cgSigSave').onclick=async()=>{
    if(!dirty){alert('Faça ou altere a assinatura antes de salvar.');return}
    c.signatureData=canvas.toDataURL('image/png');c.signatureConfirmed=true;
    save();await saveCandidateSignatureCloud(c);o.remove();renderCand();
    alert('Assinatura atualizada.');
  };
}
async function setCandidateStatus(i,status){
  const c=st.candidates[i];if(!c||!['Recebida','Conferida','Cancelada'].includes(status))return;
  if(st.isArchived){alert('Gestão arquivada: alterações bloqueadas.');return}
  if(status==='Cancelada'&&!confirm('Cancelar a inscrição nº '+fmtSeq(c.seq)+' de '+c.name+'? O registro será preservado no histórico.'))return;
  c.status=status;c.cancelledAt=status==='Cancelada'?new Date().toISOString():'';
  if(status==='Cancelada')c.votes=0;
  if(c.publicDocId){
    try{
      const f=await fs();await f.collection(COL).doc(c.publicDocId).set({status,cancelledAt:c.cancelledAt},{merge:true});
    }catch(e){console.warn('[CIPA STATUS CLOUD]',e)}
  }
  save();render();
}
function photoStatusLabel(c){
  return ({approved:'APROVADA',pending:'PENDENTE',rejected:'REPROVADA',deleted:'EXCLUÍDA',none:'SEM FOTO'})[c?.photoStatus||'none']||'SEM FOTO';
}
function photoStatusClass(c){
  return c?.photoStatus==='approved'?'cgStatusChecked':c?.photoStatus==='pending'?'cgWarn':c?.photoStatus==='rejected'?'cgStatusCancelled':'';
}
function showCandidatePhoto(i){
  const c=st.candidates[i];if(!c?.photoData){alert('Este candidato não possui foto enviada.');return}
  $('#cgPhotoOv')?.remove();
  const o=document.createElement('div');o.id='cgPhotoOv';o.className='cgEditOv';
  o.innerHTML='<div class="cgEditBox" style="max-width:520px;text-align:center"><h3>Foto do candidato</h3><img src="'+c.photoData+'" style="max-width:100%;max-height:62vh;border-radius:14px;border:1px solid #cbd5e1;object-fit:contain"><div style="font-weight:900;margin-top:10px">'+esc(c.name||'')+'</div><div class="cgHint">Inscrição '+fmtSeq(c.seq)+' • '+esc(photoStatusLabel(c))+'</div><div style="margin-top:14px"><button id="cgPhotoClose" class="cgBtn cgS">Fechar</button></div></div>';
  document.body.appendChild(o);$('#cgPhotoClose').onclick=()=>o.remove();
}
async function reviewCandidatePhoto(i,action){
  const c=st.candidates[i];if(!c||st.isArchived)return;
  if(!c.photoData&&action!=='delete'){alert('Este candidato não possui foto enviada.');return}
  const map={approve:'approved',reject:'rejected',delete:'deleted'},next=map[action];if(!next)return;
  if(action==='delete'&&!confirm('Excluir somente a foto de '+c.name+'? A inscrição será mantida.'))return;
  if(action==='reject'&&!confirm('Reprovar esta foto? Ela não será usada no painel dos candidatos.'))return;
  try{
    c.photoStatus=next;c.photoReviewedAt=new Date().toISOString();
    if(action==='delete')c.photoData='';
    if(c.publicDocId){
      const f=await fs();
      await f.collection(COL).doc(c.publicDocId).set({
        photoData:c.photoData||'',
        photoStatus:c.photoStatus,
        photoReviewedAt:c.photoReviewedAt
      },{merge:true});
    }
    save();renderCand();
    toast(action==='approve'?'Foto aprovada para divulgação.':action==='reject'?'Foto reprovada. Não será usada no painel.':'Foto excluída. A inscrição foi mantida.');
  }catch(e){alert('Não foi possível atualizar a foto: '+(e?.message||e))}
}
function candidatePhotoCard(c,large=false){
  const photoW=large?150:128,photoH=large?132:112;
  const photo=(c.photoStatus==='approved'&&c.photoData)
    ?{image:c.photoData,fit:[photoW,photoH],alignment:'center',margin:[0,2,0,7]}
    :{
      table:{widths:['*'],heights:[photoH],body:[[
        {stack:[
          {text:'SEM FOTO',alignment:'center',bold:true,color:'#8b1018',fontSize:13,margin:[0,30,0,4]},
          {text:'Foto ainda não aprovada\nou não informada',alignment:'center',color:'#64748b',fontSize:8}
        ]}
      ]]},
      layout:{
        hLineWidth:()=>1,vLineWidth:()=>1,
        hLineColor:()=>'#cbd5e1',vLineColor:()=>'#cbd5e1',
        fillColor:()=>'#f8fafc'
      },
      margin:[0,2,0,7]
    };
  return {
    table:{
      widths:['*'],
      body:[[
        {
          stack:[
            {
              table:{widths:['*','auto'],body:[[
                {text:'CANDIDATO',bold:true,color:'#ffffff',fontSize:8,margin:[7,5,0,5]},
                {text:'Nº '+fmtSeq(c.seq),bold:true,color:'#ffffff',fontSize:15,alignment:'right',margin:[0,2,8,2]}
              ]]},
              layout:{hLineWidth:()=>0,vLineWidth:()=>0,fillColor:()=>'#8b1018'},
              margin:[0,0,0,7]
            },
            photo,
            {text:(c.name||'—').toUpperCase(),alignment:'center',bold:true,fontSize:large?13.5:12.3,color:'#111827',margin:[4,1,4,5]},
            {
              table:{
                widths:['auto','*'],
                body:[
                  [{text:'Matrícula',bold:true,color:'#64748b',fontSize:7.7},{text:c.matricula||'—',bold:true,fontSize:8.4}],
                  [{text:'Função',bold:true,color:'#64748b',fontSize:7.7},{text:c.role||'—',fontSize:8.4}],
                  [{text:'Turno',bold:true,color:'#64748b',fontSize:7.7},{text:c.shift||'—',bold:true,fontSize:8.4}],
                  [{text:'Setor',bold:true,color:'#64748b',fontSize:7.7},{text:c.sector||'—',fontSize:8.4}]
                ]
              },
              layout:{
                hLineWidth:(i)=>i===0?0:.35,vLineWidth:()=>0,
                hLineColor:()=>'#e5e7eb',
                paddingTop:()=>2,paddingBottom:()=>2,paddingLeft:()=>5,paddingRight:()=>5
              },
              margin:[3,1,3,4]
            },
            {text:'ELEIÇÃO CIPA • GESTÃO '+termText(),alignment:'center',bold:true,color:'#8b1018',fontSize:7.4,margin:[0,4,0,1]}
          ],
          margin:[0,0,0,4]
        }
      ]]
    },
    layout:{
      hLineWidth:()=>1.2,vLineWidth:()=>1.2,
      hLineColor:()=>'#cbd5e1',vLineColor:()=>'#cbd5e1',
      fillColor:()=>'#ffffff',
      paddingLeft:()=>6,paddingRight:()=>6,paddingTop:()=>6,paddingBottom:()=>5
    },
    margin:[4,4,4,4]
  };
}
function candidatePanelGrid(chunk){
  const n=chunk.length;
  let cols=n<=1?1:n===2?2:n===3?3:n===4?2:3;
  const large=n<=4;
  const cards=chunk.map(c=>candidatePhotoCard(c,large));
  const rows=[];
  for(let i=0;i<cards.length;i+=cols){
    const row=cards.slice(i,i+cols);
    while(row.length<cols)row.push({text:''});
    rows.push(row);
  }
  const widths=Array(cols).fill('*');
  const table={widths,body:rows,dontBreakRows:true};
  const grid={table,layout:'noBorders',margin:[0,0,0,0]};
  if(n===1){
    return {
      table:{widths:['*',340,'*'],body:[[{text:''},cards[0],{text:''}]]},
      layout:'noBorders'
    };
  }
  return grid;
}
async function buildCandidatePanelPdf(perPage=6,formal=false){
  const l=await logo(),list=activeCandidates().slice().sort((a,b)=>(+a.seq||9999)-(+b.seq||9999));
  const emissao=new Date().toLocaleDateString('pt-BR',{timeZone:'America/Cuiaba'});
  if(!list.length)throw new Error('Nenhum candidato ativo inscrito.');
  if(formal){
    const body=[[{text:'Nº',bold:true},{text:'Foto',bold:true},{text:'Nome',bold:true},{text:'Matrícula',bold:true},{text:'Função',bold:true},{text:'Turno',bold:true},{text:'Setor',bold:true}]];
    list.forEach(c=>body.push([
      fmtSeq(c.seq),
      c.photoStatus==='approved'&&c.photoData?{image:c.photoData,fit:[55,55],alignment:'center'}:{text:'FOTO NÃO\nINFORMADA',alignment:'center',fontSize:7,color:'#64748b'},
      c.name||'',c.matricula||'',c.role||'',c.shift||'',c.sector||''
    ]));
    return {
      __tbmDocumentType:'cipa-management',__tbmIsolatedPdf:true,pageSize:'A4',pageOrientation:'portrait',pageMargins:[36,86,36,54],
      header:()=>({
        margin:[36,12,36,0],
        table:{widths:[115,'*'],body:[[
          l?{image:l,width:105,fit:[105,52],alignment:'left',margin:[0,3,0,3]}:{text:'SST',bold:true,fontSize:18,width:105},
          {stack:[
            {text:'RELAÇÃO DE CANDIDATOS INSCRITOS',bold:true,alignment:'right',fontSize:13,color:'#8b1018'},
            {text:'CIPA • GESTÃO '+termText(),bold:true,alignment:'right',fontSize:10},
            {text:'EMPRESA CADASTRADA',alignment:'right',fontSize:7.5,color:'#475569'}
          ],margin:[0,6,0,0]}
        ]]},
        layout:{hLineWidth:()=>0,vLineWidth:()=>0}
      }),
      footer:(p,pc)=>({text:'Emissão: '+emissao+' • Página '+p+' de '+pc,alignment:'center',fontSize:7,margin:[0,8,0,0]}),
      content:[
        {canvas:[{type:'rect',x:0,y:0,w:523,h:3,color:'#8b1018'}],margin:[0,0,0,12]},
        {table:{headerRows:1,widths:[28,62,'*',62,82,38,55],body},layout:'lightHorizontalLines',fontSize:7.4}
      ]
    };
  }

  const chunks=[];for(let i=0;i<list.length;i+=Math.min(6,Math.max(1,perPage)))chunks.push(list.slice(i,i+Math.min(6,Math.max(1,perPage))));
  const content=[];
  chunks.forEach((chunk,ci)=>{
    content.push(
      {
        table:{
          widths:[122,'*',126],
          body:[[
            l?{image:l,width:112,fit:[112,54],alignment:'left',margin:[4,8,0,7]}:{text:'SST',bold:true,fontSize:20,color:'#ffffff',margin:[8,14,0,10]},
            {stack:[
              {text:'CANDIDATOS INSCRITOS',alignment:'center',bold:true,fontSize:21,color:'#ffffff',margin:[0,5,0,1]},
              {text:'CIPA • GESTÃO '+termText(),alignment:'center',bold:true,fontSize:12,color:'#ffffff'},
              {text:'EMPRESA CADASTRADA',alignment:'center',fontSize:8.2,color:'#f8fafc',margin:[0,2,0,0]}
            ],margin:[0,5,0,4]},
            {stack:[
              {text:'ELEIÇÃO CIPA',alignment:'center',bold:true,fontSize:9,color:'#8b1018',margin:[0,8,0,2]},
              {text:'PARTICIPE',alignment:'center',bold:true,fontSize:13,color:'#111827'},
              {text:'Emissão '+emissao,alignment:'center',fontSize:6.8,color:'#64748b',margin:[0,3,0,0]}
            ],fillColor:'#ffffff',margin:[6,4,6,4]}
          ]]
        },
        layout:{hLineWidth:()=>0,vLineWidth:()=>0,fillColor:(row,node,col)=>col<2?'#8b1018':'#ffffff'},
        margin:[0,0,0,10]
      },
      {text:'CONHEÇA OS CANDIDATOS',alignment:'center',bold:true,fontSize:10,color:'#475569',characterSpacing:1.4,margin:[0,0,0,5]},
      candidatePanelGrid(chunk),
      {
        table:{widths:['*'],body:[[
          {text:'Vote consciente. Conheça os candidatos e participe do processo eleitoral da CIPA.',alignment:'center',bold:true,fontSize:8.3,color:'#ffffff',margin:[8,4,8,4]}
        ]]},
        layout:{hLineWidth:()=>0,vLineWidth:()=>0,fillColor:()=>'#8b1018'},
        margin:[0,8,0,0],
        pageBreak:ci<chunks.length-1?'after':undefined
      }
    );
  });
  return {
    __tbmDocumentType:'cipa-management',
    __tbmIsolatedPdf:true,
    pageSize:'A4',
    pageOrientation:'landscape',
    pageMargins:[20,18,20,18],
    defaultStyle:{font:'Roboto',color:'#17202b'},
    content
  };
}
async function generateCandidatePanel(action='preview',perPage=6,formal=false){
  try{
    save();
    const doc=await buildCandidatePanelPdf(perPage,formal);
    const filename=(formal?'Relacao_Candidatos_CIPA_':'Painel_Candidatos_CIPA_')+termKey(st.nextTerm)+'.pdf';
    const pdf=window.pdfMake?.createPdf?.(doc);if(!pdf)throw new Error('Gerador de PDF indisponível.');
    if(action==='download'){pdf.download(filename);return}
    const win=window.open('about:blank','_blank');
    const real=pdf;
    real.getBlob(blob=>{
      const u=URL.createObjectURL(blob);
      if(win){win.location=u;setTimeout(()=>URL.revokeObjectURL(u),300000)}else real.download(filename);
    });
  }catch(e){alert('Não foi possível gerar o painel de candidatos: '+(e?.message||e))}
}
function candidateInlinePanel(){
  const list=(Array.isArray(st.candidates)?st.candidates:[])
    .filter(c=>c&&c.status!=='Cancelada')
    .slice()
    .sort((a,b)=>(+a.seq||9999)-(+b.seq||9999))
    .slice(0,6);
  if(!list.length)return '<div class="cgHint" style="padding:18px;text-align:center">Nenhum candidato ativo inscrito para exibir no painel.</div>';
  return '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(155px,1fr));gap:12px;margin-top:12px">'+list.map(c=>{
    const photo=c.photoData
      ?'<img src="'+esc(c.photoData)+'" alt="Foto de '+esc(c.name||'candidato')+'" style="width:100%;height:170px;object-fit:cover;border-radius:14px 14px 8px 8px;background:#f1f5f9">'
      :'<div style="height:170px;border-radius:14px 14px 8px 8px;background:#f1f5f9;display:flex;align-items:center;justify-content:center;color:#64748b;font-weight:900">SEM FOTO</div>';
    return '<div style="border:1px solid #dbe2ea;border-radius:16px;padding:8px;background:#fff;box-shadow:0 8px 22px #0f172a12;overflow:hidden">'+
      photo+
      '<div style="padding:8px 5px 6px;text-align:center">'+
        '<div style="display:inline-flex;align-items:center;justify-content:center;min-width:36px;height:28px;padding:0 9px;border-radius:999px;background:#8b1018;color:#fff;font-weight:900;font-size:12px;margin-bottom:6px">Nº '+fmtSeq(c.seq)+'</div>'+
        '<div style="font-weight:900;font-size:14px;color:#17202b;line-height:1.2">'+esc(c.name||'')+'</div>'+
        '<div style="font-size:11px;color:#475569;margin-top:4px">'+esc(c.role||'')+(c.sector?' • '+esc(c.sector):'')+'</div>'+
        '<div style="margin-top:7px"><span class="cgBadge '+photoStatusClass(c)+'">'+photoStatusLabel(c)+'</span></div>'+
      '</div>'+
    '</div>';
  }).join('')+'</div>';
}

function renderCand(){
  st.candidates=Array.isArray(st.candidates)?st.candidates:[];
  const link=cipaPublicLink(),regLocked=isStageLocked('registration');
  const rows=st.candidates.length?st.candidates
    .slice().sort((a,b)=>(+a.seq||9999)-(+b.seq||9999))
    .map(c=>{
      const i=st.candidates.indexOf(c);
      const status=c.status||'Recebida';
      const cls=status==='Conferida'?'cgStatusChecked':status==='Cancelada'?'cgStatusCancelled':'cgStatusReceived';
      const photoCell=c.photoData
        ?'<div style="display:flex;align-items:center;gap:7px;min-width:132px"><img src="'+c.photoData+'" alt="" style="width:48px;height:58px;object-fit:cover;border-radius:8px;border:1px solid #cbd5e1"><div><span class="cgBadge '+photoStatusClass(c)+'">'+photoStatusLabel(c)+'</span><div style="margin-top:5px"><button class="cgBtn cgS" data-viewphoto="'+i+'">Ver foto</button></div></div></div>'
        :'<span class="cgBadge">'+photoStatusLabel(c)+'</span>';
      const photoActions=c.photoData
        ?(c.photoStatus!=='approved'?'<button class="cgBtn cgS" data-approvephoto="'+i+'" '+(st.isArchived?'disabled':'')+'>✓ Aprovar foto</button> ':'')+
         (c.photoStatus!=='rejected'?'<button class="cgBtn cgS" data-rejectphoto="'+i+'" '+(st.isArchived?'disabled':'')+'>✕ Reprovar foto</button> ':'')+
         '<button class="cgBtn cgD" data-deletephoto="'+i+'" '+(st.isArchived?'disabled':'')+'>Excluir foto</button> '
        :'';
      return '<tr style="'+(status==='Cancelada'?'opacity:.6':'')+'"><td><b>'+fmtSeq(c.seq)+'</b></td><td>'+photoCell+'</td><td>'+esc(c.name||'')+'</td><td>'+esc(c.role||'')+'</td><td>'+esc(c.sector||'')+'</td><td>'+esc(c.shift||'')+'</td><td>'+esc(c.matricula||'')+'</td><td>'+fmtDateTime(c.registeredAt)+'</td><td>'+(c.signatureData?'✓ Assinado':'—')+'</td><td><span class="cgBadge '+cls+'">'+status+'</span></td><td>'+(c.source==='public'?'Link/QR':'Manual')+'</td><td>'+
        '<button class="cgBtn cgS" data-viewcand="'+i+'">Visualizar</button> '+
        photoActions+
        (status!=='Cancelada'?'<button class="cgBtn cgS" data-checkcand="'+i+'">'+(status==='Conferida'?'↩ Recebida':'✓ Conferir')+'</button> ':'')+
        (status==='Cancelada'?'<button class="cgBtn cgS" data-reactcand="'+i+'">Reativar</button> ':'<button class="cgBtn cgD" data-cancelcand="'+i+'">Cancelar</button> ')+
        '<button class="cgBtn cgD" data-deletecand="'+i+'" '+(st.isArchived?'disabled':'')+'>Excluir definitivamente</button> '+
        '<button class="cgBtn cgS" data-editcand="'+i+'" '+(st.isArchived?'disabled':'')+'>Editar</button> <button class="cgBtn cgS" data-pdfcand="'+i+'">Gerar PDF</button></td></tr>';
    }).join(''):'<tr><td colspan="11" class="cgHint">Nenhum candidato inscrito.</td></tr>';
  const edit=editingCandidate>=0?st.candidates[editingCandidate]:null;
  $('#cg-cand').innerHTML=
    '<div class="cgCard"><h3>Link público para inscrição '+(regLocked?'<span class="cgBadge cgWarn">INSCRIÇÕES ENCERRADAS</span>':'')+'</h3>'+
      '<div class="cgHint">O QR Code abre o mesmo formulário sincronizado. Quando a etapa for encerrada, o formulário público também bloqueia novas inscrições.</div>'+
      '<div class="cgLinkBox"><input id="cgPublicLink" readonly value="'+esc(link)+'"><button id="cgCopyLink" class="cgBtn cgS">📋 Copiar link</button><button id="cgOpenLink" class="cgBtn cgP" '+(regLocked?'disabled':'')+'>↗ Abrir formulário</button><button id="cgQrCode" class="cgBtn cgS">▦ Gerar QR Code</button></div>'+
    '</div>'+
    '<div class="cgCard"><h3>'+(edit?'Editar candidato':'Cadastrar candidato manualmente')+'</h3>'+
      '<div class="cgCandidateForm" style="grid-template-columns:1.3fr 1fr 1fr .7fr .8fr auto">'+
        '<input id="cgCandName" placeholder="Nome completo" value="'+esc(edit?.name||'')+'">'+
        '<input id="cgCandRole" placeholder="Função" value="'+esc(edit?.role||'')+'">'+
        '<input id="cgCandSector" placeholder="Setor" value="'+esc(edit?.sector||'')+'">'+
        '<select id="cgCandShift"><option value="">Turno</option><option '+(edit?.shift==='A'?'selected':'')+'>A</option><option '+(edit?.shift==='B'?'selected':'')+'>B</option><option '+(edit?.shift==='C'?'selected':'')+'>C</option><option '+(edit?.shift==='E'?'selected':'')+'>E</option></select>'+
        '<input id="cgCandMat" placeholder="Matrícula" value="'+esc(edit?.matricula||'')+'">'+
        '<button id="cgSaveCand" class="cgBtn cgP" '+((regLocked&&!edit)||st.isArchived?'disabled':'')+'>'+(edit?'Salvar':'＋ Inscrever')+'</button>'+
      '</div>'+
      (edit?'<div style="display:flex;gap:8px;flex-wrap:wrap"><button id="cgCancelEdit" class="cgBtn cgS">Cancelar edição</button>'+(edit.signatureData?'<button id="cgViewEditSig" class="cgBtn cgS">Ver assinatura salva</button>':'')+'<button id="cgRedrawSig" class="cgBtn cgS" '+(st.isArchived?'disabled':'')+'>Refazer assinatura</button></div>':'')+
    '</div>'+
    '<div class="cgCard"><h3>📸 Painel dos candidatos</h3><div class="cgHint">Visualização rápida dos candidatos ativos. Exibe até 6 por vez; o PDF continua disponível logo abaixo.</div>'+
      candidateInlinePanel()+
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin:14px 0 4px"><button id="cgPanelPreview6" class="cgBtn cgP">👁 Visualizar Painel PDF • 6 por folha</button><button id="cgPanelDownload6" class="cgBtn cgP">📥 Baixar Painel PDF • 6 por folha</button><button id="cgPanelPreview5" class="cgBtn cgS">👁 Painel • 5 por folha</button><button id="cgFormalPhotoPreview" class="cgBtn cgS">👁 Relação formal com fotos</button><button id="cgFormalPhotoDownload" class="cgBtn cgS">📥 Baixar relação com fotos</button></div>'+
    '</div>'+
    '<div class="cgCard"><h3>📄 Documentação dos inscritos — sem fotos</h3>'+
      '<div class="cgHint">Gera uma ficha A4 individual para cada candidato ativo, com dados da inscrição e assinatura registrada. Ideal para arquivo e documentação do processo eleitoral.</div>'+
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px"><button id="cgRegistrationReportPreview" class="cgBtn cgP">👁 Visualizar fichas dos inscritos</button><button id="cgRegistrationReportDownload" class="cgBtn cgP">📥 Baixar fichas dos inscritos</button></div>'+
    '</div>'+
    '<div class="cgCard"><h3>Candidatos inscritos</h3><div class="cgHint">A foto enviada fica pendente até aprovação. Somente fotos aprovadas entram no painel/mural PDF. Excluir a foto não exclui a inscrição.</div>'+
      '<div style="overflow:auto"><table class="cgTable"><tr><th>Nº</th><th>Foto</th><th>Nome</th><th>Função</th><th>Setor</th><th>Turno</th><th>Matrícula</th><th>Data/Hora</th><th>Assinatura</th><th>Status</th><th>Origem</th><th>Ações</th></tr>'+rows+'</table></div>'+
      '<button id="cgRefreshCand" class="cgBtn cgS" style="margin-top:10px">↻ Atualizar inscrições</button>'+
    '</div>';
  $('#cgCopyLink').onclick=async()=>{try{await navigator.clipboard.writeText(link);alert('Link de inscrição copiado.')}catch(_){const e=$('#cgPublicLink');e.select();document.execCommand('copy');alert('Link de inscrição copiado.')}};
  $('#cgOpenLink').onclick=()=>window.open(link,'_blank');
  $('#cgQrCode').onclick=showQrCode;
  $('#cgRefreshCand').onclick=async()=>{await syncPublicCandidates();render()};
  $('#cgSaveCand').onclick=()=>{
    if(st.isArchived)return;
    if(regLocked&&!edit){alert('As inscrições estão encerradas. Reabra a etapa no Calendário para incluir novo candidato.');return}
    const name=$('#cgCandName').value.trim(),role=$('#cgCandRole').value.trim(),sector=$('#cgCandSector').value.trim(),shift=$('#cgCandShift').value.trim(),matricula=$('#cgCandMat').value.trim();
    if(!name||!role||!sector||!shift||!matricula){alert('Preencha Nome, Função, Setor, Turno e Matrícula.');return}
    const dupMat=st.candidates.findIndex((c,i)=>i!==editingCandidate&&String(c.matricula||'').trim().toLowerCase()===matricula.toLowerCase());
    if(dupMat>=0){alert('Esta pessoa já possui candidatura registrada nesta gestão com esta matrícula. Só é permitida uma candidatura por pessoa.');return}
    const dupName=st.candidates.findIndex((c,i)=>i!==editingCandidate&&sameCandidateName(c.name,name));
    if(dupName>=0){alert('Já existe candidatura registrada para '+st.candidates[dupName].name+'. Só é permitida uma candidatura por pessoa, mesmo usando outra matrícula.');return}
    if(editingCandidate>=0){const old=st.candidates[editingCandidate];st.candidates[editingCandidate]={...old,name,role,sector,shift,matricula}}
    else st.candidates.push({seq:nextSeq(),name,role,sector,shift,matricula,signatureData:'',signatureConfirmed:false,photoData:'',photoStatus:'none',photoConsent:false,photoReviewedAt:'',status:'Recebida',cancelledAt:'',votes:0,registeredAt:new Date().toISOString(),source:'manual'});
    editingCandidate=-1;save();render();
  };
  $('#cgCancelEdit')&&($('#cgCancelEdit').onclick=()=>{editingCandidate=-1;renderCand()});
  $('#cgViewEditSig')&&($('#cgViewEditSig').onclick=()=>showCandidateSignature(editingCandidate));
  $('#cgRedrawSig')&&($('#cgRedrawSig').onclick=()=>redrawCandidateSignature(editingCandidate));
  $('#cgPanelPreview6').onclick=()=>generateCandidatePanel('preview',6,false);
  $('#cgPanelDownload6').onclick=()=>generateCandidatePanel('download',6,false);
  $('#cgPanelPreview5').onclick=()=>generateCandidatePanel('preview',5,false);
  $('#cgFormalPhotoPreview').onclick=()=>generateCandidatePanel('preview',6,true);
  $('#cgFormalPhotoDownload').onclick=()=>generateCandidatePanel('download',6,true);
  $('#cgRegistrationReportPreview').onclick=()=>generateCandidateRegistrationReport('preview');
  $('#cgRegistrationReportDownload').onclick=()=>generateCandidateRegistrationReport('download');
  $$('[data-viewphoto]').forEach(b=>b.onclick=()=>showCandidatePhoto(+b.dataset.viewphoto));
  $$('[data-approvephoto]').forEach(b=>b.onclick=()=>reviewCandidatePhoto(+b.dataset.approvephoto,'approve'));
  $$('[data-rejectphoto]').forEach(b=>b.onclick=()=>reviewCandidatePhoto(+b.dataset.rejectphoto,'reject'));
  $$('[data-deletephoto]').forEach(b=>b.onclick=()=>reviewCandidatePhoto(+b.dataset.deletephoto,'delete'));
  $$('[data-viewcand]').forEach(b=>b.onclick=()=>showCandidateSignature(+b.dataset.viewcand));
  $$('[data-editcand]').forEach(b=>b.onclick=()=>{editingCandidate=+b.dataset.editcand;renderCand()});
  $$('[data-pdfcand]').forEach(b=>b.onclick=()=>candidatePdf(st.candidates[+b.dataset.pdfcand],1));
  $$('[data-checkcand]').forEach(b=>b.onclick=()=>{const i=+b.dataset.checkcand,c=st.candidates[i];setCandidateStatus(i,c.status==='Conferida'?'Recebida':'Conferida')});
  $('[data-cancelcand]').forEach(b=>b.onclick=()=>setCandidateStatus(+b.dataset.cancelcand,'Cancelada'));
  $('[data-reactcand]').forEach(b=>b.onclick=()=>setCandidateStatus(+b.dataset.reactcand,'Recebida'));
  $('[data-deletecand]').forEach(b=>b.onclick=()=>deleteCandidate(+b.dataset.deletecand));
}
function renderVote(){
  const c=cal(),q=qrm(),locked=isStageLocked('voting');
  const rows=activeCandidates().slice().sort((a,b)=>(+a.seq||9999)-(+b.seq||9999)).map(cand=>{
    const i=st.candidates.indexOf(cand);
    return '<tr><td>'+fmtSeq(cand.seq)+'</td><td>'+esc(cand.name)+'</td><td>'+esc(cand.matricula)+'</td><td>'+esc(cand.sector)+'</td><td>'+esc(cand.shift)+'</td><td><input class="cgVoteInput" style="width:90px;padding:8px;border:1px solid #cbd5e1;border-radius:8px" type="number" min="0" data-votei="'+i+'" value="'+Math.max(0,+cand.votes||0)+'" '+(locked?'disabled':'')+'></td></tr>';
  }).join('')||'<tr><td colspan="6">Nenhum candidato ativo inscrito.</td></tr>';
  const status=q.ok?'<span class="cgBadge">✓ Apuração confere</span>':'<span class="cgBadge cgWarn">⚠ Divergência de '+Math.abs(q.difference)+' voto(s)</span>';
  $('#cg-vote').innerHTML=
    '<div class="cgCard"><h3>Votação — único dia '+(locked?'<span class="cgBadge cgArchived">ENCERRADA</span>':'')+'</h3><div class="cgHint">O total de votantes deve ser igual a votos dos candidatos + brancos + nulos. Candidatos cancelados não entram na apuração.</div>'+
      '<div class="cgGrid">'+f('cgElectionDate','Data da votação','date')+f('cgElectionStart','Início da votação','time')+f('cgElectionEnd','Encerramento','time')+f('cgEligible','Total de funcionários aptos','number','min="0"')+f('cgTotalVoters','Total de votantes','number','min="0"')+f('cgBlankVotes','Votos brancos','number','min="0"')+f('cgNullVotes','Votos nulos','number','min="0"')+'</div>'+
      '<div class="cgMetrics"><div class="cgMetric"><span>Votos nos candidatos</span><b>'+q.candidateVotes+'</b></div><div class="cgMetric"><span>Total calculado</span><b>'+q.totalComputed+'</b></div><div class="cgMetric"><span>Participação</span><b>'+q.participation.toFixed(1)+'%</b></div></div>'+
      '<div style="margin-top:9px">'+status+'</div>'+
    '</div>'+
    '<div class="cgCard"><h3>Apuração</h3><div style="overflow:auto"><table class="cgTable"><tr><th>Inscrição</th><th>Nome</th><th>Matrícula</th><th>Setor</th><th>Turno</th><th>Votos</th></tr>'+rows+'</table></div></div>'+
    '<div class="cgCard"><h3>Classificação</h3><table class="cgTable"><tr><th>Pos.</th><th>Inscrição</th><th>Nome</th><th>Votos</th></tr>'+rank().map((x,i)=>'<tr><td>'+(i+1)+'º</td><td>'+fmtSeq(x.seq)+'</td><td>'+esc(x.name)+'</td><td>'+Math.max(0,+x.votes||0)+'</td></tr>').join('')+'</table></div>';
  $('#cgElectionDate').value=st.electionDate||c.election||'';
  $('#cgElectionDate').onchange=()=>{if(locked)return;st.electionDate=$('#cgElectionDate').value;save();render()};
  $('#cgElectionStart').value=st.electionStartTime||'';$('#cgElectionStart').onchange=()=>{if(locked)return;st.electionStartTime=$('#cgElectionStart').value;save()};
  $('#cgElectionEnd').value=st.electionEndTime||'';$('#cgElectionEnd').onchange=()=>{if(locked)return;st.electionEndTime=$('#cgElectionEnd').value;save()};
  [['cgEligible','eligible'],['cgTotalVoters','totalVoters'],['cgBlankVotes','blankVotes'],['cgNullVotes','nullVotes']].forEach(([id,key])=>{
    $('#'+id).value=st[key]||0;$('#'+id).onchange=()=>{if(locked)return;st[key]=Math.max(0,+$('#'+id).value||0);save();render()};
  });
  $$('[data-votei]').forEach(e=>e.onchange=()=>{if(locked)return;st.candidates[+e.dataset.votei].votes=Math.max(0,+e.value||0);save();render()});
  if(locked)$$('#cg-vote input,#cg-vote select').forEach(e=>e.disabled=true);
}

function syncEmployer(){
  const d=dim(),n=d.e+d.s;
  st.employer=Array.isArray(st.employer)?st.employer:[];
  while(st.employer.length<n)st.employer.push({name:'',function:'',role:st.employer.length<d.e?'Titular':'Suplente'});
  if(st.employer.length>n)st.employer.length=n;
  st.employer=st.employer.map((x,i)=>({name:x.name||'',function:x.function||'',role:x.role|| (i<d.e?'Titular':'Suplente')}));
}
function renderComp(){
  syncEmployer();
  const c=comp(),locked=isStageLocked('composition');
  $('#cg-comp').innerHTML=
    '<div class="cgCard"><h3>Representantes eleitos pelos empregados '+(locked?'<span class="cgBadge cgArchived">CONCLUÍDA</span>':'')+'</h3><div class="cgGrid"><div><b>Titulares</b><ol>'+c.eff.map(x=>'<li>'+fmtSeq(x.seq)+' — '+esc(x.name)+' — '+Math.max(0,+x.votes||0)+' votos</li>').join('')+'</ol></div><div><b>Suplentes</b><ol>'+c.sup.map(x=>'<li>'+fmtSeq(x.seq)+' — '+esc(x.name)+' — '+Math.max(0,+x.votes||0)+' votos</li>').join('')+'</ol></div></div></div>'+
    '<div class="cgCard"><h3>Representantes indicados pela empresa</h3><div class="cgHint">Preencha os nomes e funções dos representantes da organização.</div>'+
      st.employer.map((x,i)=>'<div class="cgEmployerRow" data-e="'+i+'"><input data-k="name" value="'+esc(x.name||'')+'" placeholder="Nome" '+(locked?'disabled':'')+'><input data-k="function" value="'+esc(x.function||'')+'" placeholder="Função" '+(locked?'disabled':'')+'><select data-k="role" '+(locked?'disabled':'')+'><option '+(x.role==='Titular'?'selected':'')+'>Titular</option><option '+(x.role==='Suplente'?'selected':'')+'>Suplente</option></select></div>').join('')+
      '<div class="cgGrid" style="margin-top:14px">'+f('cgNewPresident','Presidente da CIPA')+f('cgNewVice','Vice-presidente da CIPA')+'</div>'+
    '</div>';
  $$('[data-e]').forEach(r=>r.querySelectorAll('input,select').forEach(e=>e.onchange=()=>{if(locked)return;st.employer[+r.dataset.e][e.dataset.k]=e.value;save()}));
  bind({cgNewPresident:'newPresident',cgNewVice:'newVice'});
  if(locked)$$('#cg-comp input,#cg-comp select').forEach(e=>e.disabled=true);
}

const docs=[
  ['processNotice','1. Edital de Convocação — Processo Eleitoral da CIPA',true],
  ['union','2. Comunicação ao Sindicato',true],
  ['committee','3. Convocação da Comissão Eleitoral - CE',true],
  ['registrationNotice','4. Edital de Inscrição para Eleição CIPA',true],
  ['registrationForm','5. Ficha de Inscrição à Eleição da CIPA',false],
  ['registrationReceipt','6. Comprovante de Inscrição',false],
  ['candidateList','7. Relação dos Candidatos Inscritos',false],
  ['electionNotice','8. Edital de Convocação de Eleição da CIPA',true],
  ['election','9. Ata de Eleição e Apuração',true],
  ['result','10. Resultado da Eleição',false],
  ['designation','11. Designação dos Representantes da Empresa',false],
  ['installationPossession','12. Ata de Instalação e Posse',true],
  ['composition','13. Composição Oficial da CIPA',false],
  ['meetings','14. Calendário de Reuniões',false],
  ['registeredReport','15. Relatório Geral dos Inscritos',false],
  ['calendar','Cronograma eleitoral',false],
  ['dossier','16. Dossiê Completo do Processo Eleitoral',false]
];

function dateBlank(v){return v?br(v):'____/____/______'}
function timeBlank(v){return v||'____:____'}
function tbmCompany(){return st.company||window.SST_DEMO_CONFIG?.nomeFantasia||window.SST_DEMO_CONFIG?.razaoSocial||'EMPRESA CADASTRADA'}
function tbmAddress(){return st.address||[window.SST_DEMO_CONFIG?.endereco,window.SST_DEMO_CONFIG?.cidade&&window.SST_DEMO_CONFIG?.uf?(window.SST_DEMO_CONFIG.cidade+' - '+window.SST_DEMO_CONFIG.uf):window.SST_DEMO_CONFIG?.cidade||window.SST_DEMO_CONFIG?.uf].filter(Boolean).join(', ')||'ENDEREÇO CADASTRADO'}
function termText(){return String(st.nextTerm||'____/____').replace(/\s+/g,' ')}
function ceNames(){
  return [st.committeeMember1,st.committeeMember2,st.committeeMember3].map(x=>String(x||'').trim()).filter(Boolean);
}
function docDefaultText(t){
  const c=cal(),q=qrm(),term=termText(),company=tbmCompany();
  const regStart=dateBlank(c.regStart),regEnd=dateBlank(c.regEnd),election=dateBlank(c.election);
  const unionName=st.union||'';
  const members=ceNames();
  const memberText=members.length?members.join(', ').toUpperCase():'________________________________, ________________________________ E ________________________________';
  const map={
    processNotice:
      'COMUNICAMOS A TODOS OS COLABORADORES QUE A '+company+', (UNIDADE CADASTRADA), LOCALIZADA NA ENDEREÇO CADASTRADO, ESTARÁ INICIANDO O PROCESSO ELEITORAL DA COMISSÃO INTERNA DE PREVENÇÃO DE ACIDENTES E DE ASSÉDIO - CIPA, GESTÃO '+term+'. PORTANTO, SOLICITAMOS A PARTICIPAÇÃO DE TODOS NA ELEIÇÃO, QUANTO À ESCOLHA DOS REPRESENTANTES DOS EMPREGADOS, DE CONFORMIDADE COM A NORMA REGULAMENTADORA NR-5, DO MINISTÉRIO DO TRABALHO E EMPREGO.\n\nLEMBRAMOS AINDA QUE O PERÍODO PARA AS INSCRIÇÕES SERÁ ESTABELECIDO POSTERIORMENTE, ASSIM QUE O PRESIDENTE DA CIPA FORMAR SUA COMISSÃO ELEITORAL.',
    union:
      'À '+company+', (UNIDADE CADASTRADA), LOCALIZADA NA ENDEREÇO CADASTRADO, COM CNPJ Nº '+(st.cnpj||'________________')+', ATIVIDADE PRINCIPAL EM FIAÇÃO DE ALGODÃO, GRAU DE RISCO '+String(st.risk||3).padStart(2,'0')+' (TRÊS), COM SEU QUADRO FUNCIONAL DE '+(Math.max(0,+st.employees||0)||'________')+' EMPREGADOS, TENDO COMO OBJETIVO ATENDER OS PRECEITOS DA NORMA REGULAMENTADORA NR – 5, ITEM 5.5.1.1 DO MINISTÉRIO DO TRABALHO E EMPREGO, VEM INFORMAR AO SINDICATO DA CATEGORIA DOS TRABALHADORES, O INÍCIO DO PROCESSO ELEITORAL – CE, DE SUA COMISSÃO INTERNA DE PREVENÇÃO DE ACIDENTES E DE ASSÉDIO – CIPA, GESTÃO '+term+', CONFORME PROTOCOLO DE RECEBIMENTO DA COMUNICAÇÃO PRÉVIA AOS SEUS EMPREGADOS SOBRE O INÍCIO DO PROCESSO ELEITORAL DA CIPA:\n\n1. CONVOCAÇÃO PRÉVIA PARA ELEIÇÃO – '+dateBlank(c.conv)+'\n2. CONVOCAÇÃO DA COMISSÃO ELEITORAL – '+dateBlank(c.ce)+'\n3. EDITAL DE INSCRIÇÃO DA CIPA – '+regStart+' A '+regEnd,
    committee:
      'CONVOCAMOS OS SENHORES (AS) '+memberText+', A FORMAREM A PARTIR DESTA DATA '+dateBlank(c.ce)+', A COMISSÃO ELEITORAL DA CIPA–CE, GESTÃO '+term+', NO SENTIDO DE ORGANIZAREM E ACOMPANHAREM TODO PROCESSO ELEITORAL, DE CONFORMIDADE COM A NORMA REGULAMENTADORA NR-5, DO MINISTÉRIO DO TRABALHO E EMPREGO.',
    registrationNotice:
      'Ficam convocados os empregados desta empresa, À '+company+', (unidade cadastrada), localizada na ENDEREÇO CADASTRADO, para inscrever-se como candidato (a) a eleição da Comissão Interna de Prevenção de Acidentes e de Assédio - CIPA, no período '+regStart+' a '+regEnd+', de acordo com a portaria SSST Nº 08 de 23 de Fevereiro de 1999, do Ministério do Trabalho e Emprego.\n\nOs Interessados devem procurar a Comissão Eleitoral - CE na sala da Segurança do Trabalho.',
    electionNotice:
      'Ficam convocados os empregados desta empresa, '+company+', localizada na ENDEREÇO CADASTRADO, para eleição dos membros da Comissão Interna de Prevenção de Acidentes e de Assédio - CIPA, de acordo com a portaria SSST Nº 08 de 23 de Fevereiro de 1999, do Ministério do Trabalho, a ser realizada em escrutínio secreto, no dia '+election+', no horário das '+timeBlank(st.electionStartTime)+' às '+timeBlank(st.electionEndTime)+', na mesa da Segurança do Trabalho.',
    election:
      'Aos '+(long(c.election)||'____________________________')+', no local designado no edital de convocação, situado na Rodovia BR 163, S/N, km 109 Parque Industrial Vetorasso, Rondonópolis – MT, nesta cidade, instalou-se a mesa receptora e apuradora de votos. Às '+timeBlank(st.electionStartTime)+' horas, o presidente da mesa declarou iniciados os trabalhos. A votação transcorreu na mais perfeita ordem, nada havendo de anormal.\n\nÀs '+timeBlank(st.electionEndTime)+' horas do dia '+dateBlank(c.election)+', o presidente declarou encerrados os trabalhos de eleição, verificando-se que compareceram '+Math.max(0,+st.totalVoters||0)+' empregados de um total de '+Math.max(0,+st.employees||0)+', passando-se a apuração na presença de quantos desejassem.\n\nApós a apuração chegou-se ao seguinte resultado. Total de votos lançados nos candidatos: '+q.candidateVotes+'.',
    installationPossession:
      'Aos '+(long(c.posse)||'____________________________')+', na sala de treinamento da empresa, '+company+', situada na RODOVIA BR 163 no KM 109 - PARQUE INDUSTRIAL VETORASSO, , nesta cidade, reuniram-se os representantes para instalação e posse da CIPA, conforme o estabelecido pela legislação aplicável.\n\nDeclarados abertos os trabalhos, foram lembrados a todos os objetivos da reunião, quais sejam: Instalação e Posse da Comissão Interna de Prevenção de Acidentes e de Assédio. Continuando, declarou-se instalada a Comissão e empossados os representantes dos empregados e do empregador.'
  };
  return map[t]||'';
}
function docText(t){
  if(st.docTextsVersion!=='tbm-pdf-v4')return String(docDefaultText(t)||'');
  return String(st.docTexts?.[t]||docDefaultText(t)||'');
}
function editDocText(t){
  const old=$('#cgEditOv');if(old)old.remove();
  const o=document.createElement('div');o.id='cgEditOv';o.className='cgEditOv';
  o.innerHTML='<div class="cgEditBox"><h3>Editar texto do documento</h3><div class="cgHint">Texto-base salvo a partir do modelo completo da SST. Datas, gestão e dados da empresa são montados automaticamente. Nenhum nome antigo é importado.</div><textarea id="cgDocText">'+esc(docText(t))+'</textarea><div style="display:flex;gap:8px;justify-content:flex-end;margin-top:10px"><button id="cgDocCancel" class="cgBtn cgS">Cancelar</button><button id="cgDocReset" class="cgBtn cgS">Restaurar padrão</button><button id="cgDocSave" class="cgBtn cgP">Salvar texto</button></div></div>';
  document.body.appendChild(o);
  $('#cgDocCancel').onclick=()=>o.remove();
  $('#cgDocReset').onclick=()=>{$('#cgDocText').value=docDefaultText(t)};
  $('#cgDocSave').onclick=()=>{
    if(st.docTextsVersion!=='tbm-pdf-v4'){st.docTexts={};st.docTextsVersion='tbm-pdf-v4'}
    st.docTexts=st.docTexts||{};
    st.docTexts[t]=$('#cgDocText').value.trim();
    save();o.remove();renderDocs();
  };
}
function renderDocs(){
  $('#cg-docs').innerHTML=
    '<div class="cgCard"><h3>Central de documentos — CIPA '+esc(st.nextTerm||'')+'</h3>'+
    '<div class="cgHint">Pendente = faltam informações obrigatórias. Pronto = pode emitir. Gerado = já houve visualização/download registrado pelo sistema.</div>'+
    '<div style="display:flex;gap:8px;flex-wrap:wrap;margin:12px 0"><button id="cgValidateDocs" class="cgBtn cgP">✓ Validar todos os documentos</button></div>'+
    docs.map(x=>{
      const state=documentState(x[0]);
      return '<div class="cgDoc"><div><b>'+x[1]+'</b><div style="margin-top:5px"><span class="'+state.cls+'">'+state.label+'</span> <span class="cgHint">'+esc(state.detail||'')+'</span></div></div><div>'+
        (x[2]?'<button class="cgBtn cgS" data-editdoc="'+x[0]+'" '+(st.isArchived?'disabled':'')+'>✏ Editar texto</button> ':'')+
        '<button class="cgBtn cgS" data-v="'+x[0]+'">👁 Visualizar</button> <button class="cgBtn cgP" data-d="'+x[0]+'">📥 Baixar A4</button></div></div>';
    }).join('')+
    '</div>';
  $('#cgValidateDocs').onclick=showValidationReport;
  $$('[data-editdoc]').forEach(b=>b.onclick=()=>editDocText(b.dataset.editdoc));
  $$('[data-v]').forEach(b=>b.onclick=()=>pdf(b.dataset.v,1));
  $$('[data-d]').forEach(b=>b.onclick=()=>pdf(b.dataset.d,0));
}

async function logo(){try{if(typeof window.carregarLogo==='function')return await window.carregarLogo(window.LOGO_SST_URL||LOGO);const r=await fetch(LOGO),bl=await r.blob();return await new Promise((ok,no)=>{const f=new FileReader();f.onload=()=>ok(f.result);f.onerror=no;f.readAsDataURL(bl)})}catch(_){return''}}
function header(title,l){
  return()=>({
    margin:[42,12,42,0],
    columns:[
      l?{image:l,width:128,fit:[128,58]}:{text:'SST',bold:true,fontSize:18,width:128},
      {text:'',width:'*'}
    ]
  });
}
function basePdf(title,l){
  return{
    __tbmDocumentType:'cipa-management',
    __tbmIsolatedPdf:true,
    pageSize:'A4',
    pageMargins:[42,84,42,96],
    defaultStyle:{font:'Roboto',fontSize:11.3,lineHeight:1.42,color:'#111111',alignment:'justify'},
    header:header(title,l),
    footer:(currentPage,pageCount)=>({
      margin:[42,0,42,14],
      stack:[
        {text:String(tbmCompany()).toUpperCase(),bold:true,alignment:'center',fontSize:7.2},
        {text:'',alignment:'center',fontSize:7.2},
        {text:'CNPJ – '+(st.cnpj||'________________'),alignment:'center',fontSize:7.2},
        {text:'CEP – ________________',alignment:'center',fontSize:7.2},
        {text:'Página '+currentPage+' de '+pageCount,alignment:'center',fontSize:6.8,margin:[0,2,0,0]}
      ]
    }),
    info:{title:(title||'CIPA')+' • '+termText()},
    content:[]
  };
}
function heading(text,size=15,margin=[0,16,0,22]){
  return{text,alignment:'center',bold:true,fontSize:size,decoration:'underline',margin};
}
function managementLine(){
  return{text:'CIPA — GESTÃO '+termText(),alignment:'center',bold:true,fontSize:10.5,margin:[0,2,0,12]};
}
function placeDate(v,margin=[0,26,0,10],alignment='left'){
  return{text:''+(longTbm(v)||'____________________________')+'.',alignment,margin};
}
function signatureItem(name,role){
  return{
    stack:[
      {text:'\n_______________________________',alignment:'center'},
      {text:name||' ',alignment:'center',bold:!!name,fontSize:9.5},
      {text:role||' ',alignment:'center',fontSize:8.5}
    ],
    margin:[5,4,5,6]
  };
}
function signatureGrid(items,margin=[0,18,0,0]){
  const cells=(items||[]).map(x=>signatureItem(x.name,x.role));
  const rows=[];
  for(let i=0;i<cells.length;i+=2)rows.push([cells[i],cells[i+1]||{text:''}]);
  return{table:{widths:['*','*'],body:rows},layout:'noBorders',margin};
}
function blankRegistrationBlock(){
  return{
    stack:[
      {columns:[{text:'NOME._____________________________________________'},{text:'Nº DA INSCRIÇÃO_______________',width:185}],margin:[0,3,0,3]},
      {columns:[{text:'FUNÇÃO.__________________________________'},{text:'MATRICULA.____________________________',width:225}],margin:[0,3,0,3]},
      {columns:[{text:'SETOR.___________________________________'},{text:'TURNO. ______________________________',width:225}],margin:[0,3,0,3]},
      {columns:[{text:'ASSINATURA._______________________________'},{text:'DATA.______________',width:230}],margin:[0,3,0,10]}
    ],
    fontSize:9.4,
    margin:[0,2,0,5]
  };
}
function receiptCell(candidateSignature=false){
  return{
    stack:[
      {text:'COMPROVANTE DE INSCRIÇÃO',bold:true,alignment:'center',fontSize:10.2,margin:[0,0,0,8]},
      {text:'Nº DE INSCRIÇÃO _________',bold:true,margin:[20,0,0,2]},
      {text:'DATA :______/_____/______',bold:true,margin:[20,0,0,9]},
      {text:'A EMPRESA CADASTRADA, CERTIFICA',bold:true,fontSize:8.5},
      {text:'QUE O FUNCIONÁRIO (a)',bold:true,fontSize:8.5,margin:[0,3,0,0]},
      {text:'_________________________________',margin:[0,5,0,2]},
      {text:'MATRÍCULA______________,',bold:true,fontSize:8.5},
      {text:'SETOR____________  COMPARECEU A COMISSÃO ELEITORAL DA CIPA E SE INSCREVEU COMO CANDIDATO À ELEIÇÃO MARCADA PARA O DIA '+dateBlank(cal().election),bold:true,fontSize:8.2,alignment:'justify',margin:[0,2,0,7]},
      {text:'_______________________________',alignment:'center'},
      {text:candidateSignature?'Assinatura do Candidato':'Assinatura da Comissão Eleitoral',alignment:'center',fontSize:8}
    ],
    margin:[6,7,6,7]
  };
}
function candidateRows(minRows=14){
  const rows=activeCandidates().slice().sort((a,b)=>(+a.seq||9999)-(+b.seq||9999)).map(x=>[fmtSeq(x.seq),x.matricula||'',x.name||'',x.sector||'',x.shift||'']);
  while(rows.length<minRows)rows.push(['','','','','']);
  return rows;
}
function safeTable(headers,rows,widths,fontSize=8.5){
  return {
    table:{
      headerRows:1,
      dontBreakRows:true,
      keepWithHeaderRows:1,
      widths,
      body:[
        headers.map(x=>({text:x,bold:true,alignment:'center',fontSize})),
        ...rows
      ]
    },
    layout:{hLineWidth:()=>0.7,vLineWidth:()=>0.7,hLineColor:()=>'#333',vLineColor:()=>'#333',paddingTop:()=>3,paddingBottom:()=>3,paddingLeft:()=>3,paddingRight:()=>3},
    fontSize
  };
}
function signedLabel(c){return c.signatureData?'ASSINADO':'—'}
function registeredDate(c){return fmtDateTime(c.registeredAt)}
function registeredDateOnly(c){
  const d=new Date(c?.registeredAt||'');if(isNaN(d))return'—';
  return d.toLocaleDateString('pt-BR',{timeZone:'America/Cuiaba'});
}
function candidateInfoRows(){
  return st.candidates.slice().sort((a,b)=>(+a.seq||9999)-(+b.seq||9999)).map(c=>[
    fmtSeq(c.seq),c.matricula||'',c.name||'',c.role||'',c.sector||'',c.shift||'',registeredDate(c),c.status||'Recebida',signedLabel(c)
  ]);
}
function candidatePdfFilename(c){
  const name=String(c.name||'candidato').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9]+/g,'_').replace(/^_+|_+$/g,'');
  return 'CIPA_'+String(st.nextTerm||'gestao').replace('/','-')+'_Candidato_'+fmtSeq(c.seq)+'_'+name+'.pdf';
}
async function candidatePdf(c,view=1){
  if(!c)return;
  const preview=view?window.open('about:blank','_blank'):null;
  try{
    const l=await logo(),d=basePdf('FICHA INDIVIDUAL DO CANDIDATO',l);
    d.info.title='Ficha Individual do Candidato • CIPA '+termText();
    d.content.push(
      managementLine(),
      heading('FICHA INDIVIDUAL DO CANDIDATO',15,[0,8,0,18]),
      {table:{dontBreakRows:true,widths:[125,'*'],body:[
        [{text:'Nº da inscrição',bold:true},fmtSeq(c.seq)],
        [{text:'Nome',bold:true},c.name||''],
        [{text:'Função',bold:true},c.role||''],
        [{text:'Setor',bold:true},c.sector||''],
        [{text:'Turno',bold:true},c.shift||''],
        [{text:'Matrícula',bold:true},c.matricula||''],
        [{text:'Data/hora da inscrição',bold:true},registeredDate(c)]
      ]},layout:'lightHorizontalLines',margin:[0,0,0,18]},
      {text:'Atendendo à convocação da empresa SST, o(a) empregado(a) acima identificado(a) registrou sua candidatura à eleição da Comissão Interna de Prevenção de Acidentes e de Assédio - CIPA, gestão '+termText()+'.',alignment:'justify',margin:[0,0,0,16]},
      {text:'ASSINATURA DO CANDIDATO',bold:true,alignment:'center',margin:[0,10,0,8]},
      c.signatureData?{image:c.signatureData,width:230,height:85,fit:[230,85],alignment:'center',margin:[0,0,0,6]}:{text:'________________________________________',alignment:'center',margin:[0,26,0,6]},
      {text:c.name||'',alignment:'center',bold:true,fontSize:9},
      placeDate(cal().list,[0,26,0,0],'right'),
      {text:'',pageBreak:'before'},
      heading('COMPROVANTE DE INSCRIÇÃO',15,[0,20,0,22]),
      {table:{dontBreakRows:true,widths:[150,'*'],body:[
        [{text:'Nº DE INSCRIÇÃO',bold:true},fmtSeq(c.seq)],
        [{text:'DATA DA INSCRIÇÃO',bold:true},registeredDateOnly(c)],
        [{text:'NOME',bold:true},c.name||''],
        [{text:'MATRÍCULA',bold:true},c.matricula||''],
        [{text:'SETOR',bold:true},c.sector||''],
        [{text:'TURNO',bold:true},c.shift||'']
      ]},layout:'lightHorizontalLines',margin:[0,0,0,18]},
      {text:'A EMPRESA CADASTRADA certifica que o(a) funcionário(a) acima identificado(a) realizou sua inscrição como candidato(a) à eleição da CIPA, gestão '+termText()+', marcada para '+dateBlank(cal().election)+'.',alignment:'justify',margin:[0,0,0,20]},
      {columns:[
        {width:'*',stack:[
          c.signatureData?{image:c.signatureData,width:190,height:70,fit:[190,70],alignment:'center'}:{text:'\n\n_______________________________',alignment:'center'},
          {text:c.name||'Assinatura do Candidato',alignment:'center',fontSize:8.5,bold:!!c.name}
        ]},
        {width:'*',stack:[
          {text:'\n\n_______________________________',alignment:'center'},
          {text:'Assinatura da Comissão Eleitoral',alignment:'center',fontSize:8.5}
        ]}
      ],columnGap:24,margin:[0,20,0,0]}
    );
    const api=window.pdfMake.createPdf(d),name=candidatePdfFilename(c);
    if(view){
      api.getBlob(b=>{const u=URL.createObjectURL(b);if(preview){preview.location=u;setTimeout(()=>URL.revokeObjectURL(u),300000)}else api.download(name)});
    }else api.download(name);
  }catch(e){
    console.error('[CIPA CANDIDATE PDF]',e);if(preview)preview.close();alert('Erro ao gerar ficha do candidato: '+(e?.message||e));
  }
}

async function buildCandidateRegistrationReportPdf(){
  const l=await logo();
  const list=activeCandidates().slice().sort((a,b)=>(+a.seq||9999)-(+b.seq||9999));
  if(!list.length)throw new Error('Nenhum candidato ativo inscrito.');
  const unsigned=list.filter(c=>!c.signatureData);
  if(unsigned.length){
    throw new Error('Existem '+unsigned.length+' candidato(s) sem assinatura registrada: '+unsigned.map(c=>fmtSeq(c.seq)+' - '+(c.name||'Sem nome')).join(', ')+'.');
  }
  const c=cal();
  const content=[];
  list.forEach((cand,i)=>{
    if(i)content.push({text:'',pageBreak:'before'});
    content.push(
      {text:'FICHA DE INSCRIÇÃO DO CANDIDATO',alignment:'center',bold:true,fontSize:16,color:'#111827',margin:[0,8,0,4]},
      {text:'CIPA • GESTÃO '+termText(),alignment:'center',bold:true,fontSize:11,color:'#8b1018',margin:[0,0,0,14]},
      {table:{widths:[145,'*'],body:[
        [{text:'Nº DA INSCRIÇÃO',bold:true,fillColor:'#f1f5f9'}, {text:fmtSeq(cand.seq),bold:true}],
        [{text:'NOME COMPLETO',bold:true,fillColor:'#f1f5f9'}, {text:cand.name||''}],
        [{text:'MATRÍCULA',bold:true,fillColor:'#f1f5f9'}, {text:cand.matricula||''}],
        [{text:'FUNÇÃO',bold:true,fillColor:'#f1f5f9'}, {text:cand.role||''}],
        [{text:'SETOR',bold:true,fillColor:'#f1f5f9'}, {text:cand.sector||''}],
        [{text:'TURNO',bold:true,fillColor:'#f1f5f9'}, {text:cand.shift||''}],
        [{text:'DATA/HORA DA INSCRIÇÃO',bold:true,fillColor:'#f1f5f9'}, {text:registeredDate(cand)}],
        [{text:'STATUS DA INSCRIÇÃO',bold:true,fillColor:'#f1f5f9'}, {text:cand.status||'Recebida',bold:true}],
        [{text:'ASSINATURA',bold:true,fillColor:'#f1f5f9'}, {text:'ASSINATURA REGISTRADA',bold:true,color:'#166534'}]
      ]},layout:{hLineWidth:()=>0.7,vLineWidth:()=>0.7,hLineColor:()=>'#94a3b8',vLineColor:()=>'#94a3b8',paddingLeft:()=>6,paddingRight:()=>6,paddingTop:()=>6,paddingBottom:()=>6},margin:[0,0,0,18]},
      {text:'DECLARAÇÃO DE INSCRIÇÃO',bold:true,alignment:'center',fontSize:11.5,color:'#111827',margin:[0,2,0,8]},
      {text:'Atendendo à convocação da empresa '+tbmCompany()+', o(a) empregado(a) acima identificado(a) registra sua candidatura à eleição da Comissão Interna de Prevenção de Acidentes e de Assédio - CIPA, gestão '+termText()+', declarando ciência das regras aplicáveis ao processo eleitoral e confirmando os dados informados nesta ficha.',alignment:'justify',fontSize:10.2,lineHeight:1.4,margin:[0,0,0,16]},
      {text:'ASSINATURA DO CANDIDATO',bold:true,alignment:'center',fontSize:10.5,margin:[0,6,0,7]},
      {image:cand.signatureData,width:230,height:80,fit:[230,80],alignment:'center',margin:[0,0,0,4]},
      {text:cand.name||'',alignment:'center',bold:true,fontSize:9.5,margin:[0,0,0,2]},
      {text:'Matrícula: '+(cand.matricula||'—'),alignment:'center',fontSize:8.5,color:'#475569'},
      {text:'Inscrição registrada em '+registeredDate(cand)+'.',alignment:'center',fontSize:8.2,color:'#64748b',margin:[0,6,0,0]},
      {text:'Data prevista da eleição: '+dateBlank(c.election),alignment:'right',fontSize:9,margin:[0,22,0,0]}
    );
  });
  return{
    __tbmDocumentType:'cipa-management',
    __tbmIsolatedPdf:true,
    pageSize:'A4',
    pageOrientation:'portrait',
    pageMargins:[40,92,40,70],
    defaultStyle:{font:'Roboto',fontSize:10,color:'#111827'},
    header:()=>({
      margin:[40,12,40,0],
      columns:[
        l?{image:l,width:112,fit:[112,54],alignment:'left'}:{text:'SST',bold:true,fontSize:18,width:112},
        {width:'*',stack:[
          {text:'EMPRESA CADASTRADA',bold:true,fontSize:10.5,alignment:'right',color:'#8b1018'},
          {text:'UNIDADE RONDONÓPOLIS',bold:true,fontSize:8.5,alignment:'right',color:'#475569'},
          {text:'CNPJ: '+(st.cnpj||''),fontSize:7.8,alignment:'right',color:'#64748b'}
        ]}
      ]
    }),
    footer:(p,pc)=>({
      margin:[40,0,40,14],
      stack:[
        {text:'RELATÓRIO DE INSCRITOS • CIPA '+termText(),bold:true,alignment:'center',fontSize:7.5,color:'#475569'},
        {text:'Página '+p+' de '+pc,alignment:'center',fontSize:7,color:'#64748b',margin:[0,2,0,0]}
      ]
    }),
    info:{title:'Fichas de Inscrição dos Candidatos • CIPA '+termText(),author:'SST S/A Indústria Têxtil'},
    content
  };
}
async function generateCandidateRegistrationReport(action='preview'){
  const preview=action==='preview'?window.open('about:blank','_blank'):null;
  try{
    save();
    const doc=await buildCandidateRegistrationReportPdf();
    const filename='CIPA_'+termKey(st.nextTerm)+'_Fichas_de_Inscricao_dos_Candidatos.pdf';
    const pdf=window.pdfMake?.createPdf?.(doc);
    if(!pdf)throw new Error('Gerador de PDF indisponível.');
    if(action==='download'){pdf.download(filename);return}
    pdf.getBlob(blob=>{
      const u=URL.createObjectURL(blob);
      if(preview){preview.location=u;setTimeout(()=>URL.revokeObjectURL(u),300000)}
      else pdf.download(filename);
    });
  }catch(e){
    if(preview)preview.close();
    alert('Não foi possível gerar as fichas dos inscritos: '+(e?.message||e));
  }
}
function memberLine(name,index){
  return{text:(name||('MEMBRO '+index))+ ' ______________________________________________________________',bold:true,margin:[0,7,0,7]};
}
function section(t,l){
  const c=cal(),co=comp();
  let title='',body=[];
  const narrative=(txt,opts={})=>body.push({text:txt,alignment:'justify',fontSize:opts.fontSize||11.3,lineHeight:opts.lineHeight||1.45,margin:opts.margin||[0,0,0,10]});
  if(t==='processNotice'){
    title='PROCESSO ELEITORAL DA CIPA';
    body.push(managementLine(),heading(title,15,[0,8,0,26]));
    const muralText=String(docText(t)||'')
      .replace(/A PARTIR DESTA DATA\s+(?:\d{1,2}\/\d{1,2}\/\d{2,4}|_{2,}\/_{2,}\/_{2,})\s*,?\s*/i,'')
      .replace(/A PARTIR DESTA DATA\s*,?\s*/i,'');
    narrative(muralText,{fontSize:12.2,lineHeight:1.55,margin:[8,0,8,0]});
    body.push({text:'Rondonópolis – MT',alignment:'right',margin:[0,46,0,0]});
    body.push(signatureGrid([{name:st.managerName,role:st.managerRole||'Gerente Industrial ROO'}],[0,28,0,0]));
  }else if(t==='union'){
    title='COMUNICAÇÃO AO SINDICATO';
    body.push(heading((st.union||'SINDTÊXTIL – SINDICATO DOS TRABALHADORES NAS INDÚSTRIAS DE FIAÇÃO E TECELAGEM DO CEARÁ').toUpperCase(),11.5,[0,10,0,22]));
    narrative(docText(t),{fontSize:10.6,lineHeight:1.38});
    body.push({text:'PROTOCOLO DE RECEBIMENTO DO PROCESSO ELEITORAL DA CIPA:',bold:true,decoration:'underline',fontSize:10.5,margin:[0,18,0,18]});
    body.push({text:'Eu, '+(st.unionRepresentative||'_____________________________________')+' representante do Sindicato dos Trabalhadores nas Indústrias de Fiação e Tecelagem, declaro ter recebido nesta data, através da empresa SST S.A Indústria Têxtil., cópia autêntica do Processo Eleitoral da CIPA, gestão '+termText()+', de conformidade com o item 5.5.1.1 da NR-5.',fontSize:10.2,lineHeight:1.4,alignment:'justify'});
    body.push(placeDate(c.union,[0,22,0,5]));
    body.push(signatureGrid([{name:st.managerName,role:st.managerRole||'Gerente Industrial ROO'},{name:st.unionRepresentative,role:'Sindicato dos Trabalhadores'}],[0,12,0,0]));
  }else if(t==='committee'){
    title='CONVOCAÇÃO DA COMISSÃO ELEITORAL - CE';
    body.push({text:'COMUNICAÇÃO INTERNA '+String(long(c.ce)||'____________________________').toUpperCase(),alignment:'right',bold:true,fontSize:9.5,margin:[0,6,0,32]},heading(title,14.5,[0,0,0,26]));
    narrative(docText(t),{fontSize:10.8,lineHeight:1.42});
    body.push(memberLine(st.committeeMember1,1),memberLine(st.committeeMember2,2),memberLine(st.committeeMember3,3));
    body.push(placeDate(c.ce,[0,34,0,0],'right'));
    body.push(signatureGrid([{name:st.president,role:'Presidente da CIPA'},{name:st.vice,role:'Vice-Presidente da CIPA'}],[0,28,0,0]));
  }else if(t==='registrationNotice'){
    title='EDITAL DE INSCRIÇÃO PARA ELEIÇÃO CIPA – '+termText();
    body.push(heading(title,18,[0,8,0,30]));
    narrative(docText(t),{fontSize:13,lineHeight:1.55,margin:[0,0,0,0]});
    body.push(placeDate(c.regStart,[0,54,0,0]));
    body.push(signatureGrid([{name:st.safetyTechName,role:st.safetyTechRole||'Técnico de Segurança do Trabalho'}],[0,42,0,0]));
  }else if(t==='registrationForm'){
    title='FICHA DE INSCRIÇÃO À ELEIÇÃO DA CIPA '+termText();
    body.push(heading(title,13.5,[0,6,0,12]));
    body.push({text:'Atendendo a convocação da empresa SST, localizada na ENDEREÇO CADASTRADO, em cumprimento da Norma NR-05, venho inscrever-me como candidato (a) à eleição da Comissão Interna de Prevenção de Acidentes e de Assédio - CIPA, referente ao mandato de '+termText()+'.',fontSize:9.7,lineHeight:1.35,alignment:'justify',margin:[0,0,0,4]});
    body.push({text:'Ciente de que neste processo de eleição serão observados todos os preceitos legais constantes na portaria SSST Nº 08 de 23 de Fevereiro de 1999, do Ministério do Trabalho.',fontSize:9.7,lineHeight:1.35,alignment:'justify',margin:[0,0,0,8]});
    for(let i=0;i<5;i++)body.push(blankRegistrationBlock());
  }else if(t==='registrationReceipt'){
    title='COMPROVANTE DE INSCRIÇÃO';
    body.push({table:{widths:['*','*'],body:[[receiptCell(false),receiptCell(true)],[receiptCell(false),receiptCell(false)]]},layout:{hLineWidth:()=>1.4,vLineWidth:()=>1.4,hLineColor:()=>'#111',vLineColor:()=>'#111',paddingLeft:()=>1,paddingRight:()=>1,paddingTop:()=>1,paddingBottom:()=>1},margin:[0,92,0,0]});
  }else if(t==='candidateList'){
    title='RELAÇÃO DE CANDIDATOS INSCRITOS À ELEIÇÃO DA CIPA – GESTÃO '+termText();
    body.push(heading(title,13.5,[0,12,0,18]));
    const rows=activeCandidates().slice().sort((a,b)=>(+a.seq||9999)-(+b.seq||9999)).map(c=>[fmtSeq(c.seq),c.matricula||'',c.name||'',c.sector||'',c.shift||'']);
    body.push(safeTable(['Nº INSC.','MATRÍCULA','NOME DO CANDIDATO','SETOR','TURNO'],rows,[48,70,'*',95,55],8.2));
    body.push(placeDate(cal().list,[0,18,0,0],'right'));
  }else if(t==='electionNotice'){
    title='EDITAL DE CONVOCAÇÃO DE ELEIÇÃO DA CIPA – '+termText();
    body.push(heading(title,13.5,[0,84,0,20]));
    narrative(docText(t),{fontSize:11,lineHeight:1.42});
    body.push({text:'Apresentaram-se e serão votados os seguintes candidatos:',alignment:'center',bold:true,fontSize:12.5,margin:[0,16,0,8]});
    body.push(safeTable(['Nº INSC.','MAT.','NOME DO CANDIDATO','SETOR','TURNO'],candidateRows(14),[44,56,'*',82,56],8.4));
    body.push(placeDate(c.list,[0,10,0,0],'right'));
    if(st.safetyTechName)body.push(signatureGrid([{name:st.safetyTechName,role:st.safetyTechRole||'Técnico de Segurança do Trabalho'}],[0,8,0,0]));
  }else if(t==='election'){
    title='ATA DE ELEIÇÃO DA COMISSÃO INTERNA DE PREVENÇÃO DE ACIDENTES E DE ASSÉDIO – CIPA, GESTÃO '+termText()+' DA EMPRESA '+tbmCompany()+'.';
    body.push(heading(title,12,[0,80,0,18]));
    narrative(docText(t),{fontSize:10.7,lineHeight:1.42});
    body.push({text:'Após a apuração chegou-se ao seguinte resultado:',fontSize:10.8,margin:[0,14,0,8]});
    const effRows=co.eff.length?co.eff.map(x=>[x.name||'',Math.max(0,+x.votes||0)]):[['',''],['',''],['','']];
    const supRows=co.sup.length?co.sup.map(x=>[x.name||'',Math.max(0,+x.votes||0)]):[['',''],['','']];
    body.push({table:{headerRows:1,widths:['*',120],body:[[{text:'TITULARES',bold:true,alignment:'center'},{text:'TOTAL DE VOTOS',bold:true,alignment:'center'}],...effRows]},layout:'lightHorizontalLines',margin:[0,0,0,12]});
    body.push({table:{headerRows:1,widths:['*',120],body:[[{text:'SUPLENTES',bold:true,alignment:'center'},{text:'TOTAL DE VOTOS',bold:true,alignment:'center'}],...supRows]},layout:'lightHorizontalLines',margin:[0,0,0,10]});
    body.push({text:'Após a classificação dos representantes dos empregados por ordem de votação dos titulares e suplentes, esses representantes elegeram o(a) vice-presidente da CIPA.',fontSize:10.5,alignment:'justify',margin:[0,8,0,4]});
    if(co.rest.length)body.push({text:'Os demais votados por ordem decrescente de votos:',fontSize:10.5,margin:[0,4,0,4]},{table:{widths:['*',70],body:co.rest.map(x=>[x.name||'',Math.max(0,+x.votes||0)])},layout:'lightHorizontalLines'});
    body.push({text:'E para constar mandou o senhor presidente da mesa que fosse lavrada a presente ata, pelo secretário da mesa, pelos convidados e membros da Comissão Eleitoral e eleitos escolhidos pelos empregados.',fontSize:10.5,alignment:'justify',pageBreak:'before',margin:[0,155,0,14]});
    body.push(placeDate(c.election,[0,12,0,4],'right'));
    body.push(signatureGrid([{name:st.tablePresident,role:'Presidente da Mesa'},{name:st.tableSecretary,role:'Secretário da Mesa'}],[0,8,0,8]));
    body.push({text:'Membros da Mesa:',bold:true,margin:[0,12,0,4]});
    body.push(signatureGrid([{name:st.tableMember,role:'Membro da Mesa'}],[0,0,0,6]));
    body.push({text:'COMISSÃO ELEITORAL – MT:',bold:true,margin:[0,10,0,3]});
    body.push({text:ceNames().length?ceNames().join('\n'):'_______________________________________________',margin:[0,0,0,8]});
    body.push({text:'CONVIDADOS PARA APURAÇÃO DOS VOTOS:',bold:true,margin:[0,8,0,3]});
    body.push({text:[st.guest1,st.guest2].filter(Boolean).join('\n')||'_______________________________________________',margin:[0,0,0,8]});
    body.push({text:'TITULARES:',bold:true,decoration:'underline',margin:[0,8,0,4]},{text:co.eff.map(x=>x.name).filter(Boolean).join('\n')||'________________________________',margin:[0,0,0,8]});
    body.push({text:'SUPLENTES:',bold:true,decoration:'underline',margin:[0,8,0,4]},{text:co.sup.map(x=>x.name).filter(Boolean).join('\n')||'________________________________',margin:[0,0,0,4]});
  }else if(t==='result'){
    title='RESULTADO DA ELEIÇÃO DA CIPA – GESTÃO '+termText();
    const co=comp(),q=qrm();
    body.push(heading(title,14,[0,14,0,18]));
    body.push({text:'Concluída a apuração realizada em '+dateBlank(cal().election)+', fica divulgado o resultado da eleição dos representantes dos empregados para a CIPA.',alignment:'justify',margin:[0,0,0,12]});
    body.push({text:'Total de votantes: '+q.v+' • Brancos: '+q.blank+' • Nulos: '+q.nul+' • Participação: '+q.participation.toFixed(1)+'%',bold:true,margin:[0,0,0,12]});
    body.push(safeTable(['CONDIÇÃO','Nº','NOME','VOTOS'],[
      ...co.eff.map(x=>['Titular',fmtSeq(x.seq),x.name||'',+x.votes||0]),
      ...co.sup.map(x=>['Suplente',fmtSeq(x.seq),x.name||'',+x.votes||0]),
      ...co.rest.map(x=>['Demais votados',fmtSeq(x.seq),x.name||'',+x.votes||0])
    ],[90,45,'*',60],8.6));
    body.push(placeDate(cal().result,[0,18,0,0],'right'));
  }else if(t==='designation'){
    title='DESIGNAÇÃO DOS REPRESENTANTES DA EMPRESA – CIPA '+termText();
    body.push(heading(title,14,[0,14,0,18]));
    body.push({text:'A '+tbmCompany()+' designa os representantes da organização abaixo relacionados para compor a CIPA, gestão '+termText()+'.',alignment:'justify',margin:[0,0,0,14]});
    const rows=(st.employer||[]).filter(x=>x.name).map(x=>[x.name||'',x.function||'',x.role||'']);
    body.push(safeTable(['NOME','FUNÇÃO','CONDIÇÃO'],rows,['*',150,90],8.8));
    body.push({text:'Presidente da CIPA: '+(st.newPresident||'________________________________'),bold:true,margin:[0,16,0,5]});
    body.push({text:'Vice-Presidente da CIPA: '+(st.newVice||'________________________________'),bold:true});
    body.push(placeDate(cal().posse,[0,24,0,0],'right'));
    body.push(signatureGrid([{name:st.managerName,role:st.managerRole||'Representante da Empresa'}],[0,18,0,0]));
  }else if(t==='installationPossession'){
    title='ATA DE INSTALAÇÃO E POSSE DA COMISSÃO INTERNA DE PREVENÇÃO DE ACIDENTES E DE ASSÉDIO – CIPA '+termText()+', SST TÊXTIL - INDÚSTRIA E COMÉRCIO S/A';
    body.push(placeDate(c.posse,[0,18,0,20]),heading(title,12.2,[0,0,0,20]));
    narrative(docText(t),{fontSize:10.6,lineHeight:1.4});
    body.push({text:'TITULARES:',bold:true,decoration:'underline',margin:[0,18,0,5]},{text:co.eff.map(x=>x.name).filter(Boolean).join('\n')||'________________________________________',margin:[0,0,0,14]});
    body.push({text:'SUPLENTES:',bold:true,decoration:'underline',margin:[0,8,0,5]},{text:co.sup.map(x=>x.name).filter(Boolean).join('\n')||'________________________________________',margin:[0,0,0,18]});
    body.push({text:'Da mesma forma declarou empossados os indicados pela empresa:',bold:true,margin:[0,10,0,8]});
    const et=st.employer.filter(x=>x.role==='Titular'&&x.name).map(x=>x.name);
    const es=st.employer.filter(x=>x.role==='Suplente'&&x.name).map(x=>x.name);
    body.push({text:'TITULARES:',bold:true,decoration:'underline',margin:[0,5,0,5]},{text:et.join('\n')||'________________________________________',margin:[0,0,0,14]});
    body.push({text:'SUPLENTES:',bold:true,decoration:'underline',margin:[0,5,0,5]},{text:es.join('\n')||'________________________________________',margin:[0,0,0,16]});
    body.push({text:'Tendo sido escolhido entre os representantes do empregador para presidente da CIPA, '+(st.newPresident||'________________________________')+', e eleito entre os empregados para vice-presidente, '+(st.newVice||'________________________________')+'. Nada mais havendo a ser tratado, o presidente da sessão deu por encerrada a reunião, lembrando a todos que o período da gestão da CIPA será de 01 (um) ano e, para constar, lavrou-se a presente ata.',fontSize:10.6,alignment:'justify',margin:[0,8,0,12]});
    body.push({text:'A presente ata, depois de lida, será assinada pelo secretário da mesa, presidente da sessão e todos os representantes eleitos e/ou designados, inclusive os suplentes.',fontSize:10.6,alignment:'justify',pageBreak:'before',margin:[0,50,0,82]});
    body.push(signatureGrid([{name:st.sessionPresident,role:'Presidente da Sessão'},{name:st.sessionSecretary,role:'Secretário da Mesa'}],[0,0,0,30]));
    body.push(placeDate(c.posse,[0,28,0,42],'right'));
    body.push({text:'Continuação da ata de instalação e posse da CIPA, gestão '+termText()+', com a relação dos componentes e devidas assinaturas:',fontSize:10.6,margin:[0,0,0,16]});
    body.push({text:'TITULARES:',bold:true,decoration:'underline',margin:[0,8,0,25]},{text:'\n\n',margin:[0,0,0,10]},{text:'SUPLENTES:',bold:true,decoration:'underline',margin:[0,8,0,25]});
  }else if(t==='composition'){
    title='COMPOSIÇÃO OFICIAL DA CIPA – GESTÃO '+termText();
    const co=comp();
    body.push(heading(title,14,[0,12,0,18]));
    const rows=[
      ...co.eff.map(x=>['Empregados',x.name||'','Titular',+x.votes||0]),
      ...co.sup.map(x=>['Empregados',x.name||'','Suplente',+x.votes||0]),
      ...(st.employer||[]).filter(x=>x.name).map(x=>['Empresa',x.name||'',x.role||'',x.function||''])
    ];
    body.push(safeTable(['REPRESENTAÇÃO','NOME','CONDIÇÃO','VOTOS / FUNÇÃO'],rows,[90,'*',80,100],8.5));
    body.push({text:'Presidente: '+(st.newPresident||'________________________________'),bold:true,margin:[0,18,0,4]});
    body.push({text:'Vice-Presidente: '+(st.newVice||'________________________________'),bold:true});
    body.push(placeDate(cal().posse,[0,20,0,0],'right'));
  }else if(t==='registeredReport'){
    title='RELATÓRIO GERAL DOS INSCRITOS – CIPA '+termText();
    body.push(heading(title,14,[0,12,0,18]));
    body.push(safeTable(['Nº','MATRÍCULA','NOME','FUNÇÃO','SETOR','TURNO','DATA/HORA','STATUS','ASSIN.'],candidateInfoRows(),[25,45,78,58,50,30,65,48,40],6.5));
    body.push(placeDate(cal().list,[0,18,0,0],'right'));
  }else if(t==='calendar'){
    title='CRONOGRAMA DO PROCESSO ELEITORAL DA CIPA';
    body.push(managementLine(),heading(title,14,[0,10,0,20]),{table:{headerRows:1,widths:[110,70,'*',55],body:[['Etapa','Data','Regra','NR-5'].map(x=>({text:x,bold:true,fillColor:'#e2e8f0'})),...rows().map(x=>[x[0],br(x[1]),x[2],x[3]])]},layout:'lightHorizontalLines'});
  }else if(t==='meetings'){
    title='CALENDÁRIO ANUAL DE REUNIÕES ORDINÁRIAS';
    body.push(managementLine(),heading(title,14,[0,10,0,20]),{table:{headerRows:1,widths:[70,'*',90],body:[['Reunião','Data','Horário'].map(x=>({text:x,bold:true,fillColor:'#e2e8f0'})),...meetings().map(x=>[x.i+'ª',br(x.date),x.time])]},layout:'lightHorizontalLines'});
  }
  return{title,body};
}
async function pdf(t,view){
  const validation=validateDocument(t);
  if(validation.errors.length){
    alert('Documento não liberado. Corrija antes de gerar:\n\n- '+validation.errors.join('\n- '));
    return;
  }
  if(validation.warnings.length&&!confirm('Há avisos antes da emissão:\n\n- '+validation.warnings.join('\n- ')+'\n\nDeseja continuar?'))return;
  const preview=view?window.open('about:blank','_blank'):null;
  try{
    const l=await logo();
    const official=['processNotice','union','committee','registrationNotice','registrationForm','registrationReceipt','candidateList','electionNotice','election','result','designation','installationPossession','composition','meetings','registeredReport'];
    const list=t==='dossier'?[...official,'calendar']:[t];
    let d=basePdf(t==='dossier'?'DOSSIÊ COMPLETO DO PROCESSO ELEITORAL DA CIPA':'',l);
    if(t==='dossier'){
      d.info.title='Dossiê Completo da CIPA • Gestão '+termText();
      d.content.push(
        {text:'DOSSIÊ COMPLETO DO PROCESSO ELEITORAL DA CIPA',alignment:'center',bold:true,fontSize:20,margin:[0,180,0,16]},
        {text:'GESTÃO '+termText(),alignment:'center',bold:true,fontSize:15,margin:[0,0,0,12]},
        {text:tbmCompany(),alignment:'center',fontSize:12,margin:[0,0,0,8]},
        {text:'Unidade cadastrada',alignment:'center',fontSize:11},
        {text:'Cidade / UF cadastradas',alignment:'center',fontSize:10,margin:[0,40,0,0]},
        {text:'',pageBreak:'before'},
        {text:'ÍNDICE',alignment:'center',bold:true,fontSize:17,decoration:'underline',margin:[0,20,0,20]},
        ...list.map((x,i)=>{
          const item=docs.find(d=>d[0]===x);
          return{text:(i+1)+'. '+(item?.[1]?.replace(/^\d+\.\s*/, '')||x),fontSize:11,margin:[18,4,0,4]};
        })
      );
    }
    list.forEach((x,i)=>{
      const p=section(x,l);
      if(t==='dossier'||i)d.content.push({text:'',pageBreak:'before'});
      d.content.push(...p.body);
      if(list.length===1)d.info.title=p.title+' • CIPA '+(st.nextTerm||'');
    });
    const pre=preflightPdfDefinition(d,t);
    if(t==='union'){
      pre.errors=(pre.errors||[]).filter(e=>!String(e||'').toUpperCase().includes('TÍTULO ISOLADO TEXTIL')&&!String(e||'').toUpperCase().includes('TÍTULO ISOLADO TÊXTIL'));
    }
    if(pre.errors.length){
      if(preview)preview.close();
      alert('O teste automático bloqueou este PDF:\n\n- '+pre.errors.join('\n- '));
      return;
    }
    if(pre.warnings.length&&!confirm('Teste automático encontrou avisos:\n\n- '+[...new Set(pre.warnings)].join('\n- ')+'\n\nGerar mesmo assim?')){
      if(preview)preview.close();return;
    }
    const fileLabels={union:'Comunicacao_ao_Sindicato',processNotice:'Edital_de_Convocacao_Processo_Eleitoral',committee:'Comissao_Eleitoral',registrationNotice:'Edital_de_Inscricao',registrationForm:'Ficha_de_Inscricao',registrationReceipt:'Comprovante_de_Inscricao',candidateList:'Lista_de_Candidatos',electionNotice:'Edital_de_Eleicao',election:'Ata_de_Eleicao',result:'Resultado_da_Eleicao',designation:'Designacao_do_Empregador',installationPossession:'Ata_de_Instalacao_e_Posse',composition:'Composicao_CIPA',meetings:'Calendario_de_Reunioes',registeredReport:'Relacao_de_Inscritos',calendar:'Calendario_CIPA',dossier:'Dossie_Completo_CIPA'};
    const name='CIPA_'+(st.nextTerm||'gestao').replace('/','-')+'_'+(fileLabels[t]||t)+'.pdf';
    const api=window.pdfMake.createPdf(d);
    if(view){
      api.getBlob(b=>{
        const u=URL.createObjectURL(b);
        if(preview){preview.location=u;setTimeout(()=>URL.revokeObjectURL(u),300000)}
        else api.download(name);
        recordDocumentGenerated(t,'visualizado');renderDocs();
      });
    }else{
      api.download(name);
      recordDocumentGenerated(t,'baixado');renderDocs();
    }
  }catch(e){
    console.error('[CIPA PDF]',e);
    if(preview)preview.close();
    alert('Erro ao gerar PDF da CIPA: '+(e?.message||e));
  }
}

window.__tbmCipaManagementVersion='2026.10.14.12';
function init(){style();tile();setTimeout(tile,900);setTimeout(tile,2500)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
