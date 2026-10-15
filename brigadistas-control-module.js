(function(){
'use strict';
if(window.__tbmBrigadistasControl)return;window.__tbmBrigadistasControl=true;

const KEY='tbm_brigadistas_controle_v1';
const DOC='_brigadistas_controle_current';
const COL='inspections';
const INSTRUCTOR='Responsável SST';
const COMPANY='EMPRESA CADASTRADA';
const CNPJ='';
const UNIT='';
const LOGO='./icon.svg';
const SHIFTS=['Turno A','Turno B','Turno C','Turno E','Administrativo'];
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const cp=x=>JSON.parse(JSON.stringify(x));
const esc=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const uid=p=>p+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7);
const nowIso=()=>new Date().toISOString();
const localDate=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
const currentMonth=()=>localDate().slice(0,7);
let selectedMonth=currentMonth(),searchText='',shiftFilter='';

function base(){return{version:1,company:COMPANY,unit:UNIT,instructor:INSTRUCTOR,updatedAt:'',members:[],trainings:[]}}
function load(){try{const x=JSON.parse(localStorage.getItem(KEY)||'null');return x&&Array.isArray(x.members)&&Array.isArray(x.trainings)?Object.assign(base(),x):base()}catch(_){return base()}}
let st=load();
function migrate(){
  st=Object.assign(base(),st||{});
  st.members=(Array.isArray(st.members)?st.members:[]).map(x=>Object.assign({uid:uid('brig'),name:'',matricula:'',turno:'Turno A',funcao:'',setor:'',ativo:true,createdAt:nowIso()},x,{ativo:x.ativo!==false}));
  st.trainings=(Array.isArray(st.trainings)?st.trainings:[]).map(x=>Object.assign({uid:uid('treino'),date:localDate(),startTime:'',endTime:'',title:'Treinamento Mensal da Brigada de Emergência',location:'',topics:'',notes:'',instructor:INSTRUCTOR,attendance:{},createdAt:nowIso(),updatedAt:nowIso()},x,{attendance:x&&typeof x.attendance==='object'&&!Array.isArray(x.attendance)?x.attendance:{},instructor:INSTRUCTOR}));
}
migrate();

async function fs(){if(typeof window.ensureFirestore==='function')return await window.ensureFirestore();if(window.SST&&window.SST.fs)return window.SST.fs;throw new Error('Nuvem SST indisponível')}
async function cloudSave(){
  window.tbmSyncStart&&window.tbmSyncStart('Sincronizando controle de brigadistas...');
  try{
    if(window.__SST_COMMERCIAL&&window.SSTCommercialCloud?.saveModuleState){await window.SSTCommercialCloud.saveModuleState('brigadistas',cp(st));window.tbmSyncOk&&window.tbmSyncOk('Controle de brigadistas sincronizado com a conta da empresa.');return}
    const f=await fs();
    await f.collection(COL).doc(DOC).set({kind:'brigade-control',payload:cp(st),cloudUpdatedAt:firebase.firestore.FieldValue.serverTimestamp()},{merge:true});
    window.tbmSyncOk&&window.tbmSyncOk('Controle de brigadistas sincronizado com a nuvem.');
  }catch(e){console.warn('[BRIGADISTAS CLOUD SAVE]',e);window.tbmSyncError&&window.tbmSyncError(e&&e.message?e.message:'Falha ao sincronizar brigadistas.')}
}
async function cloudLoad(){
  try{
    if(window.__SST_COMMERCIAL&&window.SSTCommercialCloud?.loadModuleState){const v=await window.SSTCommercialCloud.loadModuleState('brigadistas');if(v){st=Object.assign(base(),v);migrate();localStorage.setItem(KEY,JSON.stringify(st));if($('#brigOv'))render()}return}
    const f=await fs(),d=await f.collection(COL).doc(DOC).get();
    if(d.exists&&d.data()&&d.data().payload){
      st=Object.assign(base(),d.data().payload);migrate();localStorage.setItem(KEY,JSON.stringify(st));
      if($('#brigOv'))render();
    }
  }catch(e){console.warn('[BRIGADISTAS CLOUD LOAD]',e)}
}
function save(label){
  st.updatedAt=nowIso();localStorage.setItem(KEY,JSON.stringify(st));
  window.tbmSystemAudit&&window.tbmSystemAudit('ALTERAÇÃO','BRIGADISTAS',label||'Controle de brigadistas atualizado',{entityId:DOC});
  window.tbmSyncLocal&&window.tbmSyncLocal('Brigadistas salvos localmente; sincronizando com a nuvem...');
  cloudSave();
}
function norm(v){return String(v==null?'':v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim()}
function fmtDate(v){if(!v)return'—';const p=String(v).split('-');return p.length===3?p[2]+'/'+p[1]+'/'+p[0]:String(v)}
function monthLabel(v){if(!v)return'—';const d=new Date(v+'-01T12:00:00');return d.toLocaleDateString('pt-BR',{month:'long',year:'numeric'}).replace(/^./,x=>x.toUpperCase())}
function activeMembers(){return st.members.filter(x=>x.ativo!==false).sort((a,b)=>norm(a.name).localeCompare(norm(b.name)))}
function monthSessions(){return st.trainings.filter(x=>String(x.date||'').slice(0,7)===selectedMonth).sort((a,b)=>String(a.date).localeCompare(String(b.date)))}
function statusLabel(v){return v==='present'?'PRESENTE':v==='absent'?'FALTOU':'PENDENTE'}
function statusClass(v){return v==='present'?'brigOk':v==='absent'?'brigBad':'brigPend'}
function monthStats(){
  const sessions=monthSessions();let present=0,absent=0,pending=0;
  sessions.forEach(t=>Object.values(t.attendance||{}).forEach(v=>{if(v==='present')present++;else if(v==='absent')absent++;else pending++}));
  return{sessions:sessions.length,present,absent,pending,total:activeMembers().length};
}

function installCss(){
  if($('#brigStyle'))return;
  const s=document.createElement('style');s.id='brigStyle';
  s.textContent='.brigOv{position:fixed;inset:0;z-index:9400;background:#eef2f6;overflow:auto;color:#17202b}.brigOv *{box-sizing:border-box}.brigTop{position:sticky;top:0;z-index:30;background:linear-gradient(135deg,#5f0b12,#a31822);color:#fff;box-shadow:0 7px 25px #0003}.brigTopIn{max-width:1400px;margin:auto;padding:13px 18px;display:flex;align-items:center;gap:12px}.brigTop img{width:54px;height:54px;object-fit:contain;background:#fff;border-radius:12px;padding:5px}.brigTop h2{margin:0;font-size:20px}.brigTop p{margin:3px 0 0;font-size:12px;opacity:.9}.brigClose{margin-left:auto;border:1px solid #ffffff55;background:#ffffff18;color:#fff;border-radius:10px;padding:10px 14px;font-weight:900}.brigWrap{max-width:1400px;margin:auto;padding:18px}.brigHero{background:#fff;border:1px solid #dbe2ea;border-radius:18px;padding:20px;margin-bottom:14px;box-shadow:0 8px 30px #0f172a0b}.brigHero h1{margin:0 0 5px;font-size:26px}.brigHero p{margin:0;color:#64748b}.brigMetrics{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:14px}.brigMetric{background:#fff;border:1px solid #dbe2ea;border-radius:16px;padding:15px;box-shadow:0 6px 20px #0f172a0b}.brigMetric small{display:block;color:#64748b;font-weight:800}.brigMetric b{display:block;font-size:28px;margin:5px 0}.brigCard{background:#fff;border:1px solid #dbe2ea;border-radius:17px;padding:16px;margin-bottom:14px;box-shadow:0 6px 20px #0f172a0b}.brigCard h3{margin:0 0 12px}.brigToolbar{display:flex;gap:8px;flex-wrap:wrap;align-items:center}.brigToolbar input,.brigToolbar select,.brigForm input,.brigForm select,.brigForm textarea{border:1px solid #cbd5e1;border-radius:10px;padding:10px 11px;background:#fff;color:#17202b;font:inherit}.brigToolbar input{min-width:240px;flex:1}.brigBtn{border:0;border-radius:10px;padding:10px 13px;font-weight:900;cursor:pointer}.brigPrimary{background:#8b1018;color:#fff}.brigDark{background:#1f2937;color:#fff}.brigGreen{background:#166534;color:#fff}.brigAmber{background:#92400e;color:#fff}.brigSoft{background:#e5e7eb;color:#17202b}.brigDanger{background:#991b1b;color:#fff}.brigTableWrap{overflow:auto}.brigTable{width:100%;border-collapse:collapse;min-width:760px}.brigTable th,.brigTable td{padding:10px;border-bottom:1px solid #e5e7eb;text-align:left;font-size:12px}.brigTable th{background:#f8fafc;font-size:11px;text-transform:uppercase;color:#475569}.brigStatus{display:inline-flex;border-radius:999px;padding:5px 8px;font-size:10px;font-weight:900}.brigOk{background:#dcfce7;color:#166534}.brigBad{background:#fee2e2;color:#991b1b}.brigPend{background:#fef3c7;color:#92400e}.brigInactive{background:#e2e8f0;color:#475569}.brigSessions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.brigSession{border:1px solid #dbe2ea;border-radius:14px;padding:14px}.brigSession h4{margin:0 0 7px}.brigSession p{margin:4px 0;color:#475569;font-size:12px}.brigForm{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}.brigField{display:flex;flex-direction:column;gap:5px}.brigField label{font-size:11px;font-weight:900;color:#475569}.brigField.full{grid-column:1/-1}.brigModal{position:fixed;inset:0;z-index:9500;background:#0f172aa8;display:flex;align-items:flex-start;justify-content:center;padding:24px;overflow:auto}.brigModalBox{width:min(960px,100%);background:#fff;border-radius:18px;box-shadow:0 30px 90px #0006;padding:18px}.brigModalHead{display:flex;align-items:center;gap:10px;margin-bottom:15px}.brigModalHead h3{margin:0}.brigAttend{display:grid;grid-template-columns:1.7fr .8fr .8fr 1fr;gap:8px;align-items:center;padding:8px;border-bottom:1px solid #e5e7eb}.brigAttend.head{font-size:10px;font-weight:900;text-transform:uppercase;color:#64748b;background:#f8fafc}.brigEmpty{padding:18px;text-align:center;color:#64748b;background:#f8fafc;border-radius:12px}.brigNote{font-size:11px;color:#64748b;margin-top:6px}@media(max-width:820px){.brigMetrics{grid-template-columns:1fr 1fr}.brigSessions{grid-template-columns:1fr}.brigForm{grid-template-columns:1fr}.brigField.full{grid-column:auto}.brigAttend{grid-template-columns:1.5fr .8fr}.brigAttend .hideMob{display:none}.brigWrap{padding:12px}.brigTopIn{padding:10px 12px}}';
  document.head.appendChild(s);
}
function ensureTile(){
  if($('#tbmBrigTile'))return;const tiles=$('#home .tiles');if(!tiles)return;
  const b=document.createElement('button');b.id='tbmBrigTile';b.className='tile general';
  b.innerHTML='<div class="ico">🚨</div><div><b>Brigadistas</b><span>Cadastro, treinamentos e presença mensal</span></div>';
  b.onclick=open;tiles.appendChild(b);
}
function shell(){
  let o=$('#brigOv');if(o)return o;installCss();
  o=document.createElement('div');o.id='brigOv';o.className='brigOv';
  o.innerHTML='<div class="brigTop"><div class="brigTopIn"><img src="'+esc(LOGO)+'" onerror="this.onerror=null;this.src=\'./icon.svg\'"><div><h2>Controle de Brigadistas</h2><p>Treinamentos, presença, faltas e relatórios</p></div><button id="brigClose" class="brigClose">✕ Fechar</button></div></div><div id="brigBody" class="brigWrap"></div>';
  document.body.appendChild(o);$('#brigClose').onclick=()=>o.remove();return o;
}
function filteredMembers(){
  const q=norm(searchText);return st.members.filter(x=>(!q||norm([x.name,x.matricula,x.turno,x.funcao,x.setor].join(' ')).includes(q))&&(!shiftFilter||x.turno===shiftFilter)).sort((a,b)=>(a.ativo===b.ativo?norm(a.name).localeCompare(norm(b.name)):(a.ativo?-1:1)));
}
function renderMembersRows(){
  const body=$('#brigMemberRows');if(!body)return;const list=filteredMembers();
  body.innerHTML=list.length?list.map(x=>'<tr><td><b>'+esc(x.name)+'</b><div class="brigNote">'+esc(x.funcao||'Função não informada')+'</div></td><td>'+esc(x.matricula||'—')+'</td><td>'+esc(x.setor||'—')+'</td><td>'+esc(x.turno||'—')+'</td><td><span class="brigStatus '+(x.ativo?'brigOk':'brigInactive')+'">'+(x.ativo?'ATIVO':'INATIVO')+'</span></td><td><div class="brigToolbar"><button class="brigBtn brigSoft" data-brig-edit="'+esc(x.uid)+'">Editar</button><button class="brigBtn '+(x.ativo?'brigAmber':'brigGreen')+'" data-brig-toggle="'+esc(x.uid)+'">'+(x.ativo?'Inativar':'Reativar')+'</button></div></td></tr>').join(''):'<tr><td colspan="6"><div class="brigEmpty">Nenhum brigadista encontrado.</div></td></tr>';
}
function render(){
  shell();const m=monthStats(),sessions=monthSessions(),shifts=Array.from(new Set(st.members.map(x=>x.turno).filter(Boolean))).sort();
  $('#brigBody').innerHTML='<div class="brigHero"><h1>🚨 Brigadistas</h1><p>Controle dos brigadistas da empresa, treinamentos mensais, frequência e documentação em PDF.</p></div>'+
  '<div class="brigMetrics"><div class="brigMetric"><small>Brigadistas ativos</small><b>'+m.total+'</b><span>Cadastro atual</span></div><div class="brigMetric"><small>Treinamentos no mês</small><b>'+m.sessions+'</b><span>'+esc(monthLabel(selectedMonth))+'</span></div><div class="brigMetric"><small>Presenças</small><b>'+m.present+'</b><span>Registros no mês</span></div><div class="brigMetric"><small>Faltas</small><b>'+m.absent+'</b><span>Registros no mês</span></div></div>'+
  '<div class="brigCard"><div class="brigToolbar" style="justify-content:space-between"><div><h3 style="margin-bottom:3px">Treinamentos e controle mensal</h3><div class="brigNote">Instrutor padrão: '+esc(INSTRUCTOR)+'</div></div><div class="brigToolbar"><input id="brigMonth" type="month" value="'+esc(selectedMonth)+'" style="min-width:170px;flex:0 0 auto"><button id="brigNewTraining" class="brigBtn brigPrimary">＋ Novo treinamento</button><button id="brigTrainingList" class="brigBtn brigGreen">🖊️ Gerar lista de presença</button><button id="brigReports" class="brigBtn brigDark">📊 Relatórios</button><button id="brigMonthPdf" class="brigBtn brigSoft">📄 Relatório mensal</button></div></div><div id="brigSessions" class="brigSessions" style="margin-top:14px">'+
  (sessions.length?sessions.map(t=>{const vals=Object.values(t.attendance||{}),p=vals.filter(v=>v==='present').length,a=vals.filter(v=>v==='absent').length;return '<div class="brigSession"><h4>'+esc(t.title||'Treinamento da Brigada')+'</h4><p><b>Data:</b> '+esc(fmtDate(t.date))+' • <b>Local:</b> '+esc(t.location||'—')+'</p><p><b>Temas:</b> '+esc(t.topics||'Não informado')+'</p><p><span class="brigStatus brigOk">'+p+' presentes</span> <span class="brigStatus brigBad">'+a+' faltas</span></p><div class="brigToolbar" style="margin-top:10px"><button class="brigBtn brigSoft" data-training-edit="'+esc(t.uid)+'">Editar presença</button><button class="brigBtn brigPrimary" data-training-signpdf="'+esc(t.uid)+'">🖊️ Lista para assinatura</button><button class="brigBtn brigDark" data-training-pdf="'+esc(t.uid)+'">📄 Relatório PDF</button><button class="brigBtn brigDanger" data-training-delete="'+esc(t.uid)+'">Excluir</button></div></div>'}).join(''):'<div class="brigEmpty" style="grid-column:1/-1">Nenhum treinamento registrado em '+esc(monthLabel(selectedMonth))+'.</div>')+
  '</div></div>'+
  '<div class="brigCard"><div class="brigToolbar" style="justify-content:space-between"><div><h3 style="margin-bottom:3px">Cadastro de brigadistas</h3><div class="brigNote">Cadastre uma vez. Os nomes serão carregados automaticamente nos treinamentos.</div></div><button id="brigNewMember" class="brigBtn brigGreen">＋ Novo brigadista</button></div><div class="brigToolbar" style="margin-top:12px"><input id="brigSearch" placeholder="🔎 Pesquisar nome, matrícula, setor, turno ou função" value="'+esc(searchText)+'"><select id="brigShift"><option value="">Todos os turnos</option>'+shifts.map(v=>'<option value="'+esc(v)+'" '+(v===shiftFilter?'selected':'')+'>'+esc(v)+'</option>').join('')+'</select></div><div class="brigTableWrap" style="margin-top:12px"><table class="brigTable"><thead><tr><th>Nome / Função</th><th>Matrícula</th><th>Setor</th><th>Turno</th><th>Situação</th><th>Ações</th></tr></thead><tbody id="brigMemberRows"></tbody></table></div></div>';
  renderMembersRows();bindMain();
}
function bindMain(){
  $('#brigMonth').onchange=e=>{selectedMonth=e.target.value||currentMonth();render()};
  $('#brigSearch').oninput=e=>{searchText=e.target.value;renderMembersRows()};
  $('#brigShift').onchange=e=>{shiftFilter=e.target.value;renderMembersRows()};
  $('#brigNewMember').onclick=()=>memberForm();
  $('#brigNewTraining').onclick=()=>trainingForm();
  $('#brigTrainingList').onclick=()=>generalTrainingList();
  $('#brigReports').onclick=()=>reportsMenu();
  $('#brigMonthPdf').onclick=()=>monthPdf();
  $$('#brigMemberRows [data-brig-edit]').forEach(b=>b.onclick=()=>memberForm(b.dataset.brigEdit));
  $$('#brigMemberRows [data-brig-toggle]').forEach(b=>b.onclick=()=>{const x=st.members.find(v=>v.uid===b.dataset.brigToggle);if(!x)return;x.ativo=!x.ativo;save((x.ativo?'Reativou ':'Inativou ')+x.name);render()});
  $$('[data-training-edit]').forEach(b=>b.onclick=()=>trainingForm(b.dataset.trainingEdit));
  $$('[data-training-signpdf]').forEach(b=>b.onclick=()=>trainingPdf(b.dataset.trainingSignpdf,true));
  $$('[data-training-pdf]').forEach(b=>b.onclick=()=>trainingPdf(b.dataset.trainingPdf,false));
  $$('[data-training-delete]').forEach(b=>b.onclick=()=>{const t=st.trainings.find(x=>x.uid===b.dataset.trainingDelete);if(!t)return;if(!confirm('Excluir este treinamento de '+fmtDate(t.date)+'?'))return;st.trainings=st.trainings.filter(x=>x.uid!==t.uid);save('Excluiu treinamento da brigada');render()});
}
function modal(html){
  $('#brigModal')&&$('#brigModal').remove();const o=document.createElement('div');o.id='brigModal';o.className='brigModal';o.innerHTML='<div class="brigModalBox">'+html+'</div>';document.body.appendChild(o);return o;
}
function closeModal(){$('#brigModal')&&$('#brigModal').remove()}
function memberForm(id){
  const x=id?st.members.find(v=>v.uid===id):null,m=x?cp(x):{uid:uid('brig'),name:'',matricula:'',turno:'Turno A',funcao:'',setor:'',ativo:true,createdAt:nowIso()};
  const o=modal('<div class="brigModalHead"><h3>'+ (x?'Editar brigadista':'Novo brigadista') +'</h3><button id="brigModalClose" class="brigBtn brigSoft" style="margin-left:auto">✕</button></div><div class="brigForm"><div class="brigField full"><label>Nome completo *</label><input id="bmName" value="'+esc(m.name)+'" placeholder="Nome do brigadista"></div><div class="brigField"><label>Matrícula *</label><input id="bmMat" value="'+esc(m.matricula)+'" placeholder="Matrícula"></div><div class="brigField"><label>Turno *</label><select id="bmShift">'+SHIFTS.map(v=>'<option '+(m.turno===v?'selected':'')+'>'+esc(v)+'</option>').join('')+'</select></div><div class="brigField"><label>Função / Cargo</label><input id="bmRole" value="'+esc(m.funcao)+'" placeholder="Ex.: Operador"></div><div class="brigField"><label>Setor</label><input id="bmSector" value="'+esc(m.setor||'')+'" placeholder="Ex.: Produção, Manutenção"></div></div><div class="brigToolbar" style="justify-content:flex-end;margin-top:16px"><button id="bmCancel" class="brigBtn brigSoft">Cancelar</button><button id="bmSave" class="brigBtn brigGreen">Salvar brigadista</button></div>');
  $('#brigModalClose',o).onclick=closeModal;$('#bmCancel',o).onclick=closeModal;
  $('#bmSave',o).onclick=()=>{
    const name=$('#bmName',o).value.trim(),mat=$('#bmMat',o).value.trim(),turno=$('#bmShift',o).value,funcao=$('#bmRole',o).value.trim(),setor=$('#bmSector',o).value.trim();
    if(!name)return alert('Informe o nome do brigadista.');if(!mat)return alert('Informe a matrícula.');
    if(st.members.some(v=>v.uid!==m.uid&&norm(v.matricula)===norm(mat)))return alert('Esta matrícula já está cadastrada.');
    if(st.members.some(v=>v.uid!==m.uid&&norm(v.name)===norm(name)))return alert('Este nome já está cadastrado como brigadista.');
    Object.assign(m,{name,matricula:mat,turno,funcao,setor});
    if(x)Object.assign(x,m);else st.members.push(m);
    save((x?'Editou ':'Cadastrou ')+name);closeModal();render();
  };
}
function trainingMembers(t){
  const ids=new Set(Object.keys((t&&t.attendance)||{}));activeMembers().forEach(m=>ids.add(m.uid));
  return Array.from(ids).map(id=>st.members.find(m=>m.uid===id)).filter(Boolean).sort((a,b)=>norm(a.name).localeCompare(norm(b.name)));
}
function trainingForm(id){
  const old=id?st.trainings.find(v=>v.uid===id):null;
  const t=old?cp(old):{uid:uid('treino'),date:localDate(),startTime:'',endTime:'',title:'Treinamento Mensal da Brigada de Emergência',location:'',topics:'',notes:'',instructor:INSTRUCTOR,attendance:{},createdAt:nowIso(),updatedAt:nowIso()};
  activeMembers().forEach(m=>{if(!Object.prototype.hasOwnProperty.call(t.attendance,m.uid))t.attendance[m.uid]='pending'});
  const members=trainingMembers(t);
  const o=modal('<div class="brigModalHead"><h3>'+(old?'Editar treinamento':'Novo treinamento da brigada')+'</h3><button id="brigModalClose" class="brigBtn brigSoft" style="margin-left:auto">✕</button></div><div class="brigForm"><div class="brigField"><label>Data *</label><input id="btDate" type="date" value="'+esc(t.date)+'"></div><div class="brigField"><label>Horário</label><div style="display:grid;grid-template-columns:1fr auto 1fr;gap:8px;align-items:center"><input id="btStart" type="time" value="'+esc(t.startTime||'')+'"><span>às</span><input id="btEnd" type="time" value="'+esc(t.endTime||'')+'"></div></div><div class="brigField"><label>Local</label><input id="btLocation" value="'+esc(t.location)+'"></div><div class="brigField full"><label>Título do treinamento</label><input id="btTitle" value="'+esc(t.title)+'"></div><div class="brigField full"><label>Temas discutidos *</label><textarea id="btTopics" rows="4" placeholder="Ex.: Uso de extintores; abandono de área; primeiros socorros">'+esc(t.topics)+'</textarea></div><div class="brigField full"><label>Instrutor</label><input value="'+esc(INSTRUCTOR)+'" readonly disabled></div><div class="brigField full"><label>Observações</label><textarea id="btNotes" rows="3">'+esc(t.notes||'')+'</textarea></div></div><div class="brigToolbar" style="margin:16px 0 8px"><b>Controle de presença</b><span style="flex:1"></span><button id="btAllPresent" class="brigBtn brigGreen">Todos presentes</button><button id="btAllAbsent" class="brigBtn brigAmber">Todos faltaram</button><button id="btAllPending" class="brigBtn brigSoft">Limpar status</button></div><div class="brigAttend head"><div>Nome</div><div>Matrícula</div><div class="hideMob">Turno</div><div>Status</div></div><div id="btAttendance">'+members.map(m=>'<div class="brigAttend"><div><b>'+esc(m.name)+'</b><div class="brigNote">'+esc(m.funcao||'')+'</div></div><div>'+esc(m.matricula||'—')+'</div><div class="hideMob">'+esc(m.turno||'—')+'</div><select data-att="'+esc(m.uid)+'"><option value="pending" '+(t.attendance[m.uid]==='pending'?'selected':'')+'>Pendente</option><option value="present" '+(t.attendance[m.uid]==='present'?'selected':'')+'>Presente</option><option value="absent" '+(t.attendance[m.uid]==='absent'?'selected':'')+'>Faltou</option></select></div>').join('')+'</div><div class="brigToolbar" style="justify-content:flex-end;margin-top:16px"><button id="btCancel" class="brigBtn brigSoft">Cancelar</button><button id="btSave" class="brigBtn brigPrimary">Salvar treinamento</button></div>');
  $('#brigModalClose',o).onclick=closeModal;$('#btCancel',o).onclick=closeModal;
  const mark=v=>$$('[data-att]',o).forEach(s=>s.value=v);
  $('#btAllPresent',o).onclick=()=>mark('present');$('#btAllAbsent',o).onclick=()=>mark('absent');$('#btAllPending',o).onclick=()=>mark('pending');
  $('#btSave',o).onclick=()=>{
    const date=$('#btDate',o).value,startTime=$('#btStart',o).value,endTime=$('#btEnd',o).value,title=$('#btTitle',o).value.trim(),location=$('#btLocation',o).value.trim(),topics=$('#btTopics',o).value.trim(),notes=$('#btNotes',o).value.trim();
    if(!date)return alert('Informe a data do treinamento.');if(!topics)return alert('Informe os temas discutidos no treinamento.');
    const attendance={};$$('[data-att]',o).forEach(s=>attendance[s.dataset.att]=s.value);
    Object.assign(t,{date,startTime,endTime,title:title||'Treinamento Mensal da Brigada de Emergência',location,topics,notes,instructor:INSTRUCTOR,attendance,updatedAt:nowIso()});
    if(old)Object.assign(old,t);else st.trainings.push(t);
    selectedMonth=date.slice(0,7);save((old?'Atualizou':'Registrou')+' treinamento da brigada em '+fmtDate(date));closeModal();render();
  };
}
async function logoData(){
  try{if(window.logoTBM&&/^data:image\//.test(window.logoTBM))return window.logoTBM;if(typeof window.carregarLogo==='function')return await window.carregarLogo(LOGO)}catch(_){}
  try{const r=await fetch(LOGO,{cache:'force-cache'});if(!r.ok)return null;const b=await r.blob();return await new Promise((ok,no)=>{const f=new FileReader();f.onload=()=>ok(f.result);f.onerror=no;f.readAsDataURL(b)})}catch(_){return null}
}
function pdfLayout(){return{hLineColor:()=> '#d1d5db',vLineColor:()=> '#d1d5db',hLineWidth:()=>.7,vLineWidth:()=>.7,paddingLeft:()=>6,paddingRight:()=>6,paddingTop:()=>6,paddingBottom:()=>6}}
function pdfHeader(logo,title,subtitle){
  return{columns:[logo?{image:logo,width:78,margin:[0,0,12,0]}:{text:'SST',bold:true,fontSize:16,color:'#8b1018',width:90},{stack:[{text:title,bold:true,fontSize:15,color:'#8b1018',alignment:'center'},{text:subtitle||COMPANY,fontSize:8.5,color:'#475569',alignment:'center',margin:[0,4,0,0]}],margin:[0,8,0,0]},{text:'SISTEMA SST\n'+UNIT,bold:true,fontSize:8,alignment:'right',width:90,margin:[0,8,0,0]}],margin:[0,0,0,8]};
}

async function pdfBlob(doc){
  return await new Promise((resolve,reject)=>{
    try{window.pdfMake.createPdf(doc).getBlob(resolve)}catch(e){reject(e)}
  });
}
async function previewDoc(doc,name,title){
  if(!window.pdfMake||typeof window.pdfMake.createPdf!=='function')return alert('Biblioteca de PDF indisponível.');
  try{
    const blob=await pdfBlob(doc),url=URL.createObjectURL(blob);
    $('#brigPdfPreview')&&$('#brigPdfPreview').remove();
    const o=document.createElement('div');o.id='brigPdfPreview';o.className='brigModal';
    o.innerHTML='<div class="brigModalBox" style="width:min(1200px,100%);padding:0;overflow:hidden"><div style="display:flex;align-items:center;gap:10px;padding:14px 16px;background:#111827;color:#fff"><div><b style="font-size:16px">'+esc(title||'Pré-visualização do PDF')+'</b><div style="font-size:11px;opacity:.75">Confira o documento antes de baixar, imprimir ou compartilhar.</div></div><button id="brigPdfClose" class="brigBtn brigSoft" style="margin-left:auto">✕ Fechar</button></div><iframe id="brigPdfFrame" title="Pré-visualização PDF" style="width:100%;height:72vh;border:0;background:#e5e7eb"></iframe><div class="brigToolbar" style="padding:12px 16px;justify-content:flex-end;background:#fff;border-top:1px solid #e5e7eb"><button id="brigPdfDownload" class="brigBtn brigPrimary">📥 Baixar PDF</button><button id="brigPdfPrint" class="brigBtn brigDark">🖨️ Imprimir</button><button id="brigPdfShare" class="brigBtn brigGreen">📲 Compartilhar</button><button id="brigPdfClose2" class="brigBtn brigSoft">Fechar</button></div></div>';
    document.body.appendChild(o);
    $('#brigPdfFrame',o).src=url;
    const close=()=>{try{URL.revokeObjectURL(url)}catch(_){}o.remove()};
    $('#brigPdfClose',o).onclick=close;$('#brigPdfClose2',o).onclick=close;
    $('#brigPdfDownload',o).onclick=()=>window.pdfMake.createPdf(doc).download(name);
    $('#brigPdfPrint',o).onclick=()=>{try{window.pdfMake.createPdf(doc).print()}catch(_){const fr=$('#brigPdfFrame',o);try{fr.contentWindow.focus();fr.contentWindow.print()}catch(__){window.open(url,'_blank')}}};
    $('#brigPdfShare',o).onclick=async()=>{
      try{
        const file=new File([blob],name,{type:'application/pdf'});
        if(navigator.share&&(!navigator.canShare||navigator.canShare({files:[file]})))await navigator.share({title:title||name,files:[file]});
        else window.pdfMake.createPdf(doc).download(name);
      }catch(e){if(e&&e.name!=='AbortError')window.pdfMake.createPdf(doc).download(name)}
    };
  }catch(e){console.error('[BRIGADISTAS PDF PREVIEW]',e);alert('Falha ao preparar visualização do PDF: '+(e&&e.message?e.message:e))}
}
function blankLine(text){return{text:text||' ',margin:[0,8,0,8]}}
async function buildTrainingListDoc(t,list){
  const members=(list&&list.length?list:activeMembers()),logo=await logoData();
  const rows=members.map((m,i)=>[
    {text:String(i+1),alignment:'center',margin:[0,14,0,14]},
    {text:m.name||'',bold:true,fontSize:10.2,margin:[0,14,0,14]},
    {text:m.matricula||'',margin:[0,14,0,14]},
    {text:m.funcao||'',margin:[0,14,0,14]},
    {text:m.setor||'',margin:[0,14,0,14]},
    {text:m.turno||'',margin:[0,14,0,14]},
    {text:'',margin:[0,22,0,22]},
    {text:'',margin:[0,22,0,22]}
  ]);
  const data=t&&t.date?fmtDate(t.date):'____/____/________';
  const horario=t&&((t.startTime||'')||(t.endTime||''))?((t.startTime||'______')+' às '+(t.endTime||'______')):'______ às ______';
  const local=t&&t.location?t.location:'________________________________';
  const tema=t&&t.topics?t.topics:'____________________________________________';
  const turma=t&&t.date?monthLabel(String(t.date).slice(0,7)):'________________________________';
  const doc={
    __tbmIsolatedPdf:true,__tbmDocumentType:'brigadistas-training-signature',
    pageSize:'A4',pageOrientation:'landscape',pageMargins:[16,18,16,30],
    defaultStyle:{font:'Roboto',fontSize:9.8,color:'#111827'},
    content:[
      pdfHeader(logo,'LISTA DE PRESENÇA DE TREINAMENTO DE BRIGADISTAS',COMPANY+' • CNPJ: '+CNPJ),
      {canvas:[{type:'line',x1:0,y1:0,x2:790,y2:0,lineWidth:1.7,lineColor:'#8b1018'}],margin:[0,0,0,8]},
      {table:{widths:[105,'*',90,'*'],body:[
        [{text:'Instrutor responsável',bold:true,fillColor:'#f3f4f6'},{text:'RESPONSÁVEL SST',bold:true},{text:'Data',bold:true,fillColor:'#f3f4f6'},{text:data}],
        [{text:'Horário',bold:true,fillColor:'#f3f4f6'},{text:horario},{text:'Local',bold:true,fillColor:'#f3f4f6'},{text:local}],
        [{text:'Tema do treinamento',bold:true,fillColor:'#f3f4f6'},{text:tema,colSpan:3},{},{ }],
        [{text:'Turma / mês',bold:true,fillColor:'#f3f4f6'},{text:turma,colSpan:3},{},{}]
      ]},layout:pdfLayout(),margin:[0,0,0,10]},
      {table:{
        headerRows:1,dontBreakRows:true,
        widths:[22,150,68,88,76,54,215,92],
        body:[['Nº','Nome do brigadista','Matrícula','Função','Setor','Turno','Assinatura','Observação'].map(h=>({text:h,bold:true,fillColor:'#e5e7eb',alignment:h==='Nº'?'center':'left'}))].concat(rows)
      },layout:pdfLayout(),margin:[0,0,0,10]},
      {text:'Total de brigadistas na lista: '+members.length,bold:true,fontSize:9.5,margin:[0,2,0,10]},
      {columns:[
        {width:'*',stack:[{text:'Responsável pelo treinamento',bold:true},{text:'RESPONSÁVEL SST',margin:[0,6,0,16]},{text:'Assinatura: ______________________________________________'}]},
        {width:'*',stack:[{text:'Responsável da área',bold:true},{text:'Nome: _________________________________________________',margin:[0,6,0,16]},{text:'Assinatura: ______________________________________________'}]}
      ],columnGap:28,margin:[0,0,0,14]},
      {text:'Observações gerais:',bold:true,margin:[0,0,0,5]},
      {text:'______________________________________________________________________________________________________________________________\n______________________________________________________________________________________________________________________________\n______________________________________________________________________________________________________________________________',fontSize:9,lineHeight:1.55}
    ],
    footer:(p,n)=>({text:'EMPRESA CADASTRADA • Lista de Presença de Treinamento • Página '+p+' de '+n,alignment:'center',fontSize:7,color:'#64748b',margin:[0,10,0,0]}),
    info:{title:'Lista de Presença de Treinamento de Brigadistas',author:'Sistema de Gestão SST',subject:'Brigada de Emergência'}
  };
  return doc;
}
async function trainingPdf(id,signatureOnly){
  const t=st.trainings.find(x=>x.uid===id);if(!t)return;
  if(signatureOnly){
    const doc=await buildTrainingListDoc(t,trainingMembers(t));
    return previewDoc(doc,'Lista_Presenca_Brigadistas_SST_'+t.date+'.pdf','Lista de Presença de Treinamento de Brigadistas');
  }
  const members=trainingMembers(t),logo=await logoData();
  const rows=members.map((m,i)=>{
    const status=t.attendance&&t.attendance[m.uid]||'pending';
    return[{text:String(i+1),alignment:'center'},{text:m.name||'—'},{text:m.matricula||'—'},{text:m.setor||'—'},{text:m.turno||'—'},{text:statusLabel(status),bold:true,color:status==='present'?'#166534':status==='absent'?'#991b1b':'#92400e'},{text:t.notes||'',fontSize:7}];
  });
  const doc={__tbmIsolatedPdf:true,__tbmDocumentType:'brigadistas-control',pageSize:'A4',pageOrientation:'landscape',pageMargins:[28,30,28,42],defaultStyle:{font:'Roboto',fontSize:8.5,color:'#17202b'},content:[
    pdfHeader(logo,'BRIGADA DE EMERGÊNCIA - RELATÓRIO DE TREINAMENTO',COMPANY+' • CNPJ: '+CNPJ),
    {table:{widths:[88,'*',72,'*'],body:[
      [{text:'Treinamento',bold:true,fillColor:'#f3f4f6'},{text:t.title||'Treinamento da Brigada',colSpan:3},{},{}],
      [{text:'Data',bold:true,fillColor:'#f3f4f6'},{text:fmtDate(t.date)},{text:'Horário',bold:true,fillColor:'#f3f4f6'},{text:(t.startTime||'—')+' às '+(t.endTime||'—')}],
      [{text:'Local',bold:true,fillColor:'#f3f4f6'},{text:t.location||'Não informado'},{text:'Instrutor',bold:true,fillColor:'#f3f4f6'},{text:INSTRUCTOR}],
      [{text:'Temas',bold:true,fillColor:'#f3f4f6'},{text:t.topics||'Não informado',colSpan:3},{},{}]
    ]},layout:pdfLayout(),margin:[0,0,0,12]},
    {text:'CONTROLE DE PARTICIPAÇÃO',bold:true,color:'#fff',background:'#8b1018',margin:[0,0,0,5]},
    {table:{headerRows:1,dontBreakRows:true,widths:[24,'*',70,90,60,72,110],body:[['#','Nome','Matrícula','Setor','Turno','Presença','Observação'].map(h=>({text:h,bold:true,fillColor:'#e5e7eb'}))].concat(rows)},layout:pdfLayout()}
  ],footer:(p,n)=>({text:'EMPRESA CADASTRADA • Brigada de Emergência • Página '+p+' de '+n,alignment:'center',fontSize:7,color:'#64748b',margin:[0,14,0,0]}),info:{title:'Relatório de Treinamento da Brigada',author:'Sistema de Gestão SST',subject:t.title||'Treinamento da Brigada'}};
  await previewDoc(doc,'Relatorio_Treinamento_Brigada_'+t.date+'.pdf','Relatório de Treinamento da Brigada');
}
async function generalTrainingList(){
  if(!activeMembers().length)return alert('Cadastre ao menos um brigadista.');
  const doc=await buildTrainingListDoc(null,activeMembers());
  await previewDoc(doc,'Lista_Treinamento_Brigadistas_SST_'+localDate()+'.pdf','Lista de Presença de Treinamento de Brigadistas');
}

async function buildMembersReportDoc(title,list,subtitle){
  const logo=await logoData(),members=list||[];
  const rows=members.map((m,i)=>[
    {text:String(i+1),alignment:'center'},
    {text:m.name||''},
    {text:m.matricula||''},
    {text:m.funcao||''},
    {text:m.setor||''},
    {text:m.turno||''},
    {text:m.ativo===false?'INATIVO':'ATIVO',bold:true,color:m.ativo===false?'#64748b':'#166534'}
  ]);
  return{
    __tbmIsolatedPdf:true,__tbmDocumentType:'brigadistas-report',
    pageSize:'A4',pageOrientation:'landscape',pageMargins:[28,30,28,42],
    defaultStyle:{font:'Roboto',fontSize:9,color:'#17202b'},
    content:[
      pdfHeader(logo,title,subtitle||COMPANY+' • CNPJ: '+CNPJ),
      {canvas:[{type:'line',x1:0,y1:0,x2:785,y2:0,lineWidth:1.5,lineColor:'#8b1018'}],margin:[0,0,0,9]},
      {table:{headerRows:1,dontBreakRows:true,widths:[24,'*',70,115,100,62,62],body:[
        ['#','Nome','Matrícula','Função','Setor','Turno','Situação'].map(h=>({text:h,bold:true,fillColor:'#e5e7eb'}))
      ].concat(rows)},layout:pdfLayout()},
      {text:'Total: '+members.length+' brigadista(s)',bold:true,margin:[0,10,0,0]}
    ],
    footer:(p,n)=>({text:'EMPRESA CADASTRADA • Controle de Brigadistas • Página '+p+' de '+n,alignment:'center',fontSize:7,color:'#64748b',margin:[0,13,0,0]}),
    info:{title,author:'Sistema de Gestão SST',subject:'Controle de Brigadistas'}
  };
}
function attendanceRowsForMonth(kind){
  const sessions=monthSessions(),map=new Map();
  activeMembers().forEach(m=>map.set(m.uid,{member:m,present:0,absent:0,pending:0}));
  sessions.forEach(t=>Object.entries(t.attendance||{}).forEach(([id,v])=>{
    const m=st.members.find(x=>x.uid===id);if(!m)return;
    if(!map.has(id))map.set(id,{member:m,present:0,absent:0,pending:0});
    const r=map.get(id);if(v==='present')r.present++;else if(v==='absent')r.absent++;else r.pending++;
  }));
  let rows=[...map.values()];
  if(kind==='absent')rows=rows.filter(x=>x.absent>0).sort((a,b)=>b.absent-a.absent||norm(a.member.name).localeCompare(norm(b.member.name)));
  if(kind==='participation')rows=rows.filter(x=>x.present>0).sort((a,b)=>b.present-a.present||norm(a.member.name).localeCompare(norm(b.member.name)));
  return rows;
}
async function attendanceReport(kind){
  const sessions=monthSessions();if(!sessions.length)return alert('Não há treinamentos registrados em '+monthLabel(selectedMonth)+'.');
  const logo=await logoData(),rows=attendanceRowsForMonth(kind);
  const title=kind==='absent'?'RELATÓRIO DE FALTAS - BRIGADISTAS':'RELATÓRIO DE PARTICIPAÇÃO - BRIGADISTAS';
  const body=rows.map((r,i)=>{
    const total=r.present+r.absent,rate=total?Math.round(r.present/total*100):0,m=r.member;
    return[String(i+1),m.name||'',m.matricula||'',m.setor||'',m.turno||'',String(r.present),String(r.absent),total?rate+'%':'—'];
  });
  const doc={__tbmIsolatedPdf:true,__tbmDocumentType:'brigadistas-attendance',pageSize:'A4',pageOrientation:'landscape',pageMargins:[28,30,28,42],defaultStyle:{font:'Roboto',fontSize:9,color:'#17202b'},content:[
    pdfHeader(logo,title,monthLabel(selectedMonth)+' • '+COMPANY),
    {table:{widths:[78,'*'],body:[
      [{text:'Período',bold:true,fillColor:'#f3f4f6'},{text:monthLabel(selectedMonth)}],
      [{text:'Instrutor',bold:true,fillColor:'#f3f4f6'},{text:INSTRUCTOR}],
      [{text:'Treinamentos',bold:true,fillColor:'#f3f4f6'},{text:String(sessions.length)}]
    ]},layout:pdfLayout(),margin:[0,0,0,10]},
    {table:{headerRows:1,dontBreakRows:true,widths:[24,'*',70,90,60,62,62,72],body:[
      ['#','Nome','Matrícula','Setor','Turno','Presenças','Faltas','Frequência'].map(h=>({text:h,bold:true,fillColor:'#e5e7eb'}))
    ].concat(body)},layout:pdfLayout()}
  ],footer:(p,n)=>({text:'EMPRESA CADASTRADA • '+title+' • Página '+p+' de '+n,alignment:'center',fontSize:7,color:'#64748b',margin:[0,13,0,0]}),info:{title,author:'Sistema de Gestão SST'}};
  await previewDoc(doc,(kind==='absent'?'Relatorio_Faltas_Brigadistas_':'Relatorio_Participacao_Brigadistas_')+selectedMonth+'.pdf',title);
}
async function membersFilteredReport(mode,value){
  let list=activeMembers(),title='LISTA GERAL DE BRIGADISTAS',suffix='Geral';
  if(mode==='shift'){list=list.filter(x=>x.turno===value);title='LISTA DE BRIGADISTAS POR TURNO - '+String(value||'').toUpperCase();suffix='Turno_'+String(value||'').replace(/\s+/g,'_')}
  if(mode==='sector'){list=list.filter(x=>norm(x.setor)===norm(value));title='LISTA DE BRIGADISTAS POR SETOR - '+String(value||'').toUpperCase();suffix='Setor_'+String(value||'').replace(/\s+/g,'_')}
  const doc=await buildMembersReportDoc(title,list,COMPANY+' • CNPJ: '+CNPJ);
  await previewDoc(doc,'Relatorio_Brigadistas_'+suffix+'_SST_'+localDate()+'.pdf',title);
}
function reportsMenu(){
  const shifts=[...new Set(activeMembers().map(x=>x.turno).filter(Boolean))].sort();
  const sectors=[...new Set(activeMembers().map(x=>x.setor).filter(Boolean))].sort();
  const o=modal('<div class="brigModalHead"><div><h3>📊 Relatórios de Brigadistas</h3><div class="brigNote">Todos os documentos abrem primeiro na pré-visualização.</div></div><button id="brClose" class="brigBtn brigSoft" style="margin-left:auto">✕</button></div>'+
  '<div class="brigCard" style="box-shadow:none"><div class="brigForm">'+
  '<div class="brigField full"><label>1. Lista geral de brigadistas</label><button id="brGeneral" class="brigBtn brigDark">Visualizar lista geral</button></div>'+
  '<div class="brigField"><label>2. Lista por turno</label><select id="brShift"><option value="">Selecione o turno</option>'+shifts.map(v=>'<option>'+esc(v)+'</option>').join('')+'</select><button id="brShiftGo" class="brigBtn brigDark">Visualizar por turno</button></div>'+
  '<div class="brigField"><label>3. Lista por setor</label><select id="brSector"><option value="">Selecione o setor</option>'+sectors.map(v=>'<option>'+esc(v)+'</option>').join('')+'</select><button id="brSectorGo" class="brigBtn brigDark">Visualizar por setor</button></div>'+
  '<div class="brigField full"><label>4. Lista de presença para treinamento</label><button id="brTraining" class="brigBtn brigGreen">Gerar lista para assinatura</button></div>'+
  '<div class="brigField"><label>5. Lista mensal de participação</label><button id="brMonth" class="brigBtn brigPrimary">Visualizar relatório mensal</button></div>'+
  '<div class="brigField"><label>6. Relatório de faltas</label><button id="brAbsent" class="brigBtn brigAmber">Visualizar faltas</button></div>'+
  '<div class="brigField"><label>7. Relatório de participação</label><button id="brParticipation" class="brigBtn brigGreen">Visualizar participação</button></div>'+
  '</div></div>');
  $('#brClose',o).onclick=closeModal;
  $('#brGeneral',o).onclick=()=>{closeModal();membersFilteredReport('all','')};
  $('#brShiftGo',o).onclick=()=>{const v=$('#brShift',o).value;if(!v)return alert('Selecione o turno.');closeModal();membersFilteredReport('shift',v)};
  $('#brSectorGo',o).onclick=()=>{const v=$('#brSector',o).value;if(!v)return alert('Selecione o setor.');closeModal();membersFilteredReport('sector',v)};
  $('#brTraining',o).onclick=()=>{closeModal();generalTrainingList()};
  $('#brMonth',o).onclick=()=>{closeModal();monthPdf()};
  $('#brAbsent',o).onclick=()=>{closeModal();attendanceReport('absent')};
  $('#brParticipation',o).onclick=()=>{closeModal();attendanceReport('participation')};
}
async function monthPdf(){
  const sessions=monthSessions();if(!sessions.length)return alert('Não há treinamentos registrados em '+monthLabel(selectedMonth)+'.');
  const logo=await logoData(),memberIds=new Set();sessions.forEach(t=>Object.keys(t.attendance||{}).forEach(id=>memberIds.add(id)));activeMembers().forEach(m=>memberIds.add(m.uid));
  const members=Array.from(memberIds).map(id=>st.members.find(m=>m.uid===id)).filter(Boolean).sort((a,b)=>norm(a.name).localeCompare(norm(b.name)));
  const rows=members.map((m,i)=>{let p=0,a=0,pend=0;sessions.forEach(t=>{const v=t.attendance&&t.attendance[m.uid];if(v==='present')p++;else if(v==='absent')a++;else if(v)pend++});const total=p+a,rate=total?Math.round(p/total*100):0;return[String(i+1),m.name||'—',m.matricula||'—',m.turno||'—',String(p),String(a),total?rate+'%':'—']});
  const topicRows=sessions.map(t=>[{text:fmtDate(t.date),bold:true},{text:t.title||'Treinamento da Brigada'},{text:t.topics||'Não informado'},{text:t.location||'—'}]);
  const totals=monthStats();
  const doc={__tbmIsolatedPdf:true,__tbmDocumentType:'brigadistas-control',pageSize:'A4',pageOrientation:'landscape',pageMargins:[34,34,34,44],defaultStyle:{font:'Roboto',fontSize:8,color:'#17202b'},content:[pdfHeader(logo,'CONTROLE MENSAL - BRIGADA DE EMERGÊNCIA',monthLabel(selectedMonth)+' • '+COMPANY),{canvas:[{type:'line',x1:0,y1:0,x2:770,y2:0,lineWidth:1.5,lineColor:'#8b1018'}],margin:[0,0,0,8]},{table:{widths:['*','*','*','*'],body:[[{stack:[{text:String(totals.total),fontSize:18,bold:true,alignment:'center'},{text:'Brigadistas ativos',fontSize:7,alignment:'center'}]},{stack:[{text:String(totals.sessions),fontSize:18,bold:true,alignment:'center'},{text:'Treinamentos',fontSize:7,alignment:'center'}]},{stack:[{text:String(totals.present),fontSize:18,bold:true,color:'#166534',alignment:'center'},{text:'Presenças',fontSize:7,alignment:'center'}]},{stack:[{text:String(totals.absent),fontSize:18,bold:true,color:'#991b1b',alignment:'center'},{text:'Faltas',fontSize:7,alignment:'center'}]}]]},layout:pdfLayout(),margin:[0,0,0,12]},{text:'TREINAMENTOS E TEMAS DISCUTIDOS',bold:true,color:'#fff',background:'#8b1018',margin:[0,0,0,5]},{table:{headerRows:1,widths:[60,175,'*',120],body:[['Data','Treinamento','Temas discutidos','Local'].map(h=>({text:h,bold:true,fillColor:'#e5e7eb'}))].concat(topicRows)},layout:pdfLayout(),margin:[0,0,0,12]},{text:'FREQUÊNCIA MENSAL DOS BRIGADISTAS',bold:true,color:'#fff',background:'#8b1018',margin:[0,0,0,5]},{table:{headerRows:1,widths:[24,'*',72,70,58,58,70],body:[['#','Nome','Matrícula','Turno','Presentes','Faltas','Frequência'].map(h=>({text:h,bold:true,fillColor:'#e5e7eb'}))].concat(rows)},layout:pdfLayout(),margin:[0,0,0,10]},{table:{widths:[90,'*'],body:[[{text:'Instrutor',bold:true,fillColor:'#f3f4f6'},{text:INSTRUCTOR}],[{text:'Período',bold:true,fillColor:'#f3f4f6'},{text:monthLabel(selectedMonth)}]]},layout:pdfLayout()}],footer:(p,n)=>({text:'EMPRESA CADASTRADA • Controle Mensal de Brigadistas • Página '+p+' de '+n,alignment:'center',fontSize:7,color:'#64748b',margin:[0,13,0,0]}),info:{title:'Controle Mensal de Brigadistas - '+monthLabel(selectedMonth),author:'Sistema de Gestão SST',subject:'Brigada de Emergência'}};
  await previewDoc(doc,'Controle_Mensal_Brigadistas_'+selectedMonth+'.pdf','Controle Mensal de Brigadistas');
}
function open(){shell();render();cloudLoad()}
window.openBrigadistasControl=open;
window.__tbmBrigadistasVersion='2026.10.14.4';
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ensureTile,{once:true});else ensureTile();
window.addEventListener('tbm-firestore-ready',()=>cloudLoad().catch(()=>{}));
})();