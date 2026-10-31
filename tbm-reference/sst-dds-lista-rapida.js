(()=>{
'use strict';
if(window.__tbmQuickDdsV1)return;window.__tbmQuickDdsV1=true;
const COL='inspections',MAX_PER_SHEET=20,INSTRUCTOR='Jonatas Marques de Arruda';
const UNIFIED_TITLE='Lista de Presença de Treinamento / DDS';
const DEFAULT_LOCATION='Sala de Treinamento';
const locationLabel=v=>{const value=String(v||'').trim();return !value||value==='TBM Têxtil'?DEFAULT_LOCATION:value};
let officialLogoCache=null;
async function pdfLogo(){
 if(officialLogoCache)return officialLogoCache;
 const cached=window.logoTBM;
 if(typeof cached==='string'&&/^data:image\//.test(cached))return officialLogoCache=cached;
 const url=window.LOGO_TBM_URL||'./Têxtil Bezerra de Menezes 2.jpeg';
 return officialLogoCache=await new Promise((resolve,reject)=>{
  const image=new Image();
  image.onload=()=>{try{const canvas=document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;canvas.getContext('2d').drawImage(image,0,0);resolve(canvas.toDataURL('image/png'))}catch(e){reject(e)}};
  image.onerror=()=>reject(new Error('Não foi possível carregar a logo oficial da TBM. Confira o arquivo de imagem.'));
  image.src=url;
 });
}
const MODES=[['all','Todos os turnos juntos'],['a','Somente Turno A'],['b','Somente Turno B'],['c','Somente Turno C'],['e','Somente Turno E']];
const SEX_FILTERS=[['all','Masculino e feminino'],['f','Somente feminino'],['m','Somente masculino']];
function sexCode(value){
 const v=norm(value);
 if(['f','feminino','mulher'].includes(v))return 'f';
 if(['m','masculino','homem'].includes(v))return 'm';
 return '';
}
const sexLabel=code=>({f:'Feminino',m:'Masculino'}[code]||'Não informado');
// Sugestão conservadora por primeiro nome; não comprova sexo e nunca atualiza o cadastro.
const FEMALE_FIRST_NAMES=new Set('adriana adriane alana alessandra aline alice amanda ana andrea andreia andressa angela angelica antonia aparecida ariane barbara beatriz bianca brenda bruna camila carla carolina cassia catarina cecilia celia cibele cintia clara claudia cristiane cristina daiane daniela daniele debora denise diana diane edna eduarda elaine elen eliana eliane elisa elisangela elizabete emanuela emilia erica erika ester esther evelin evelyn fabiana fabiane fabiola fatima fernanda flavia franciele francisca gabriela geovana geovanna gisele graziela greice helena heloisa ingrid irene isabel isabela isabella ivone janaina jaqueline jessica joana joice josefa josiane joyce julia juliana juliane juliene karina karine katia kelly lais larissa laura leila leticia lidia lilian lorena lourdes luana lucia luciana luciane luciene luiza luzia magali maira manoela manuela marcela marcia margarida maria mariana mariane marilia marilene marilza marina marlene marli marlucia mayara melissa michele michelle milena mirela miriam monica nadia naiane natalia natasha nayara neide neusa nicole nilza olivia pamela patricia paula priscila rafaela raissa raquel regina renata rita roberta rosa rosana rosangela rose roselaine rosiclea rosimar rosimeire rosineide ruth sabrina samara sandra sara sarah selma silvana silvia simone solange sonia stefani stefany sueli suellen suzana taina tais talita tania tatiana tereza teresa thais valeria vanessa vera veronica vitoria viviane vivian wanda yasmin'.split(' '));
const MALE_FIRST_NAMES=new Set('abel adalberto adriano afonso alan alberto alexandre alfredo almir alvaro anderson andre antonio arnaldo arthur augusto benedito benicio bernardo breno bruno caio carlos cassiano cesar charles claudio cleber cristiano daniel davi david denis diego diogo douglas ederson edgar edson eduardo elias eliel eliseu emerson emilio enzo erick eric ernesto estevao evandro everton fabio fabricio felipe fernando filipe flavio francisco gabriel genivaldo geraldo gilberto gilmar giovanni gustavo guilherme heitor helio henrique hugo igor isaac isaque italo ivan ivo jairo jair james jefferson joao joaquim jonas jonatan jonatas jorge jose josue julio junior kaique kauan kevin leandro leonardo levi lucas luciano luiz luis manoel manuel marcelo marcio marcos mario mateus matheus mauricio michael miguel milton murilo natan natanael nelson nicolas nilson oscar osvaldo otavio paulo pedro rafael raimundo ramon raul reginaldo renan renato ricardo roberto rodrigo rogerio romario ronaldo ronald rubens samuel sandro saulo sebastiao sergio sidnei silvio thiago tiago tomas valdir valter vanderlei vitor victor vinicius wagner wallace washington wesley william wilson yago yuri'.split(' '));
function nameSexSuggestion(fullName){
 const first=norm(fullName).split(' ')[0].replace(/[^a-z]/g,'');
 if(!first)return '';
 const f=FEMALE_FIRST_NAMES.has(first),m=MALE_FIRST_NAMES.has(first);
 return f&&!m?'f':m&&!f?'m':'';
}
const $=id=>document.getElementById(id);
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','"':'&quot;',"'":'&#39;'}[c]));
const norm=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
function today(){const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function shiftCode(value){
 const v=norm(value);
 if(/^(?:turno\s*)?a(?:\s.*)?$/.test(v)||v==='1')return 'a';
 if(/^(?:turno\s*)?b(?:\s.*)?$/.test(v)||v==='2')return 'b';
 if(/^(?:turno\s*)?c(?:\s.*)?$/.test(v)||v==='3')return 'c';
 if(/^(?:turno\s*)?e(?:\s.*)?$/.test(v)||v==='4'||v==='e')return 'e';
 // Valor legado: somente para abrir listas antigas, não como opção para novos DDS.
 if(/admin|escritorio|expediente/.test(v))return 'admin';
 return 'other';
}
function shiftLabel(code,raw=''){
 return {a:'Turno A',b:'Turno B',c:'Turno C',e:'Turno E',admin:'Administrativo'}[code]||String(raw||'Turno não cadastrado');
}
let draft=null,roster=[],manualRows=[],busy=false,editing=null,loaded=false;
function cleanPeople(items){
 const known=new Set();
 return items.map(p=>({name:String(p.name||'').replace(/\s+/g,' ').trim(),shift:String(p.shift||'').trim(),matricula:String(p.matricula||'').trim()}))
 .filter(p=>{if(!p.name)return false;const key=p.matricula||norm(p.name)+'|'+norm(p.shift);if(known.has(key))return false;known.add(key);return true});
}
function initDraft(){
 draft={id:null,date:today(),theme:'',location:DEFAULT_LOCATION,scope:'all',sexScope:'all',sheets:1,held:false,people:[],registeredAt:'',instructor:INSTRUCTOR};
 roster=[];manualRows=[];editing=null;
}
function ensureStyle(){
 if($('quickDdsStyle'))return;
 const style=document.createElement('style');style.id='quickDdsStyle';
 style.textContent='#quickDdsOverlay{position:fixed;inset:0;background:#111827b8;z-index:100000;display:none;overflow-y:auto;padding:12px}#quickDdsOverlay .quickDdsDialog{max-width:850px;margin:20px auto;background:#fff;border-radius:14px;padding:20px;color:#17202b;box-shadow:0 15px 50px #0003;font:14px/1.5 Arial,sans-serif}#quickDdsOverlay h2{font-size:19px;margin:0 0 9px}#quickDdsOverlay label{font-weight:700;font-size:12px}#quickDdsOverlay input:not([type="checkbox"]),#quickDdsOverlay select,#quickDdsOverlay textarea{width:100%;min-height:40px;border-radius:8px;padding:9px;border:1px solid #a8b6c8;background:#fff;color:#17202b}#quickDdsOverlay .quickDdsGrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(185px,1fr));gap:12px;margin:12px 0}#quickDdsOverlay .quickDdsActions{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0}#quickDdsOverlay button{min-height:43px;padding:10px 13px;border:0;border-radius:9px;background:#173b64;color:white;font-weight:800;cursor:pointer}#quickDdsOverlay button:disabled{opacity:.55;cursor:not-allowed}#quickDdsOverlay .quickDdsSecondary{background:#e2e8f0;color:#17202b}#quickDdsRoster{display:grid;grid-template-columns:repeat(auto-fit,minmax(235px,1fr));gap:5px;max-height:240px;overflow:auto}#quickDdsRoster label{background:#f8fafc;border:1px solid #d4dde7;border-radius:8px;padding:8px;display:flex;gap:8px;align-items:center}#quickDdsRoster input{width:18px;height:18px;flex-shrink:0}#quickDdsStatus{font-size:12px;font-weight:650;color:#334155;margin:10px 0;white-space:pre-wrap}#quickDdsSaved{border-top:1px solid #ddd;padding-top:10px;margin-top:15px}#quickDdsOverlay .quickDdsSavedRow{display:flex;gap:8px;justify-content:space-between;align-items:center;padding:9px;border-bottom:1px solid #e2e8f0;flex-wrap:wrap}@media(max-width:550px){#quickDdsOverlay .quickDdsDialog{padding:12px}}';
 style.textContent+='#quickDdsSearch{max-width:320px}#quickDdsRoster label:has(input:checked){background:#e8f5ee;border-color:#27835e}#quickDdsStatus[data-overflow="true"]{color:#9b1c1c;font-weight:900}#quickDdsSelectionCount{font-size:13px;font-weight:900;color:#12543f;margin:8px 0}';
 style.textContent+='#quickDdsManualRows .manual-person{display:grid;grid-template-columns:minmax(160px,2fr) minmax(125px,1fr) minmax(110px,1fr) auto;gap:6px;margin:7px 0;align-items:end}#quickDdsManualRows .manual-person button{min-width:45px;padding:8px}#quickDdsInstructorOtherWrap{display:block;margin-top:6px}#quickDdsInstructorOtherWrap[hidden]{display:none}#quickDdsRoster .person-name{font-weight:800}#quickDdsRoster .person-meta{display:block;font-size:11px;color:#334155;font-weight:500}@media(max-width:600px){#quickDdsManualRows .manual-person{grid-template-columns:1fr 1fr}#quickDdsManualRows .manual-person .name-field{grid-column:1/-1}}';
 document.head.appendChild(style);
}
function unifyTrainingTile(){
 const host=document.querySelector('#home .tiles');
 if(!host)return;
 const own=$('quickDdsNav');
 if(own){
  const title=own.querySelector('b');
  if(title&&title.textContent!==UNIFIED_TITLE)title.textContent=UNIFIED_TITLE;
  own.onclick=open;
 }
 for(const btn of host.querySelectorAll('button.tile')){
  if(btn===own)continue;
  const label=norm(btn.textContent);
  if(btn.dataset?.type==='training-attendance'||/lista de presenca.*treinamento|lista.*treinamento.*dds/.test(label))btn.remove();
 }
}
function mount(){
 ensureStyle();
 if(!$('quickDdsNav')){
  const host=document.querySelector('#home .tiles')||document.getElementById('home');
  if(host){const b=document.createElement('button');b.type='button';b.className='tile general';b.id='quickDdsNav';b.innerHTML='<div class="ico">📋</div><div><b>'+UNIFIED_TITLE+'</b><span>Nome, turno e matrícula • páginas contínuas</span></div>';b.onclick=open;host.appendChild(b)}
 }
 unifyTrainingTile();
 if(window.MutationObserver&&!window.__tbmQuickDdsMenuObserver){const home=document.querySelector('#home .tiles');if(home){window.__tbmQuickDdsMenuObserver=new MutationObserver(unifyTrainingTile);window.__tbmQuickDdsMenuObserver.observe(home,{childList:true})}}
 if($('quickDdsOverlay'))return;
 const wrap=document.createElement('div');wrap.id='quickDdsOverlay';
 wrap.innerHTML='<div class="quickDdsDialog" role="dialog" aria-modal="true" aria-labelledby="quickDdsTitle">'+
 '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px"><h2 id="quickDdsTitle">📋 '+UNIFIED_TITLE+'</h2><button type="button" id="quickDdsClose" class="quickDdsSecondary">✕ Fechar</button></div>'+
 '<p>Preencha o tema, escolha o turno ou una todos, selecione os nomes cadastrados e gere a lista com espaço para assinaturas.</p>'+
 '<div class="quickDdsGrid"><label>Tema do DDS / treinamento *<input id="quickDdsTheme" maxlength="160" placeholder="Ex.: Uso correto de EPIs"></label>'+
 '<label>Data *<input id="quickDdsDate" type="date"></label>'+
 '<label>Local / setor<input id="quickDdsLocation" maxlength="120" placeholder="Sala de Treinamento"></label>'+
 '<label>Turno<select id="quickDdsScope">'+MODES.map(([v,t])=>'<option value="'+v+'">'+t+'</option>').join('')+'</select></label>'+
 '<label>Sexo dos participantes<select id="quickDdsSexScope">'+SEX_FILTERS.map(([v,t])=>'<option value="'+v+'">'+t+'</option>').join('')+'</select></label>'+
 '<label>Limite de nomes no PDF<select id="quickDdsSheets"><option value="1">Até 20 nomes (paginação automática)</option><option value="2">Até 40 nomes (paginação automática)</option><option value="0">Todos os selecionados (paginação automática)</option></select></label>'+ 
 '<label>Instrutor<select id="quickDdsInstructorMode"><option value="default">Jonatas Marques de Arruda</option><option value="other">Outro</option></select><span id="quickDdsInstructorOtherWrap" hidden><input id="quickDdsInstructorOther" maxlength="130" placeholder="Nome do outro instrutor"></span></label></div>'+
 '<div class="quickDdsActions"><button id="quickDdsFetch" type="button">🔄 Buscar colaboradores</button><button id="quickDdsSelectAll" type="button" class="quickDdsSecondary">☑ Selecionar todos</button><button id="quickDdsClearAll" type="button" class="quickDdsSecondary">☐ Desmarcar todos</button></div>'+
 '<label style="display:block;margin:8px 0 5px">Buscar nome ou matrícula para selecionar individualmente<input id="quickDdsSearch" type="search" placeholder="Digite o nome do colaborador"></label>'+
 '<p id="quickDdsSelectionCount" aria-live="polite">0 selecionados</p>'+
 '<p style="font-weight:800;font-size:12px">Participantes — Nome • Turno • Matrícula</p>'+
 '<p style="font-size:12px;color:#475569">Quando o cadastro não informa o sexo, o sistema apresenta sugestões pelo primeiro nome para conferência. Sugestões podem estar erradas. Você decide quem incluir; o cadastro não é alterado. Participantes digitados manualmente não passam pelo filtro.</p>'+ 
 '<div id="quickDdsNameReview" hidden style="border:1px solid #d5dfeb;border-radius:9px;padding:9px;margin:8px 0;background:#f8fafc"><p id="quickDdsNameHint" style="margin:0 0 7px;font-size:12px"></p><label style="display:flex;align-items:center;gap:8px"><input type="checkbox" id="quickDdsShowOtherNames" style="width:19px;height:19px"> Mostrar os demais nomes para revisar e incluir manualmente</label></div>'+
 '<div id="quickDdsRoster" aria-label="Colaboradores para a lista"></div>'+
 '<div style="margin-top:14px"><b>Adicionar participante manualmente</b> <small>(Nome, Turno e Matrícula)</small><div id="quickDdsManualRows"></div><button type="button" id="quickDdsManualAdd" class="quickDdsSecondary">➕ Adicionar participante</button></div>'+
 '<p id="quickDdsStatus" role="status"></p>'+
 '<label style="display:flex;gap:10px;align-items:center;margin:14px 0;font-weight:750"><input type="checkbox" id="quickDdsHeld" style="width:20px;height:20px"> Confirmo que o DDS/treinamento já foi realizado.</label>'+
 '<p style="font-size:12px;color:#5a6575">A lista preparada não comprova participação. O relatório mensal só apresentará DDS realizado após confirmação do técnico, sem inventar assinaturas.</p>'+
 '<div class="quickDdsActions"><button type="button" id="quickDdsSave">💾 Salvar lista</button><button type="button" id="quickDdsPDF">📄 Salvar e gerar PDF</button><button type="button" class="quickDdsSecondary" id="quickDdsNew">➕ Nova lista</button></div>'+
 '<div id="quickDdsSaved"><h3 style="font-size:14px">Listas anteriores</h3><div id="quickDdsSavedRows"></div><button id="quickDdsReload" class="quickDdsSecondary" type="button">↻ Atualizar histórico de listas</button></div>'+
 '</div>';
 document.body.appendChild(wrap);
 $('quickDdsClose').onclick=()=>{wrap.style.display='none'};
 wrap.onclick=e=>{if(e.target===wrap)wrap.style.display='none'};
 $('quickDdsFetch').onclick=()=>safe(fetchRoster);
 $('quickDdsSelectAll').onclick=selectAllFiltered;
 $('quickDdsClearAll').onclick=()=>{
  roster.forEach(p=>p.selected=false);
  renderRoster();
 };
 $('quickDdsSearch').oninput=()=>renderRoster();
 $('quickDdsShowOtherNames').onchange=()=>renderRoster();
 $('quickDdsRoster').onchange=e=>{
  const box=e.target.closest('[data-quick-dds-person]');
  if(!box)return;
  const p=roster[Number(box.dataset.quickDdsPerson)];if(p)p.selected=box.checked;status();
 };
 const resetRosterFilter=()=>{roster=[];if($('quickDdsShowOtherNames'))$('quickDdsShowOtherNames').checked=false;renderRoster();status('Filtro alterado. Clique em Buscar colaboradores para atualizar os nomes. A seleção anterior foi desmarcada.')};
 $('quickDdsScope').onchange=resetRosterFilter;
 $('quickDdsSexScope').onchange=resetRosterFilter;
 $('quickDdsSheets').onchange=()=>status();
 $('quickDdsInstructorMode').onchange=()=>syncInstructor();
 $('quickDdsInstructorOther').oninput=()=>status();
 $('quickDdsManualAdd').onclick=()=>{manualRows.push({name:'',shift:defaultManualShift(),matricula:''});renderManualRows()};
 $('quickDdsManualRows').addEventListener('input',updateManualRow);
 $('quickDdsManualRows').addEventListener('change',updateManualRow);
 $('quickDdsManualRows').onclick=e=>{const del=e.target.closest('[data-dds-remove-row]');if(!del)return;manualRows.splice(Number(del.dataset.ddsRemoveRow),1);renderManualRows()};
 $('quickDdsSave').onclick=()=>safe(()=>save(false));
 $('quickDdsPDF').onclick=()=>safe(()=>save(true));
 $('quickDdsNew').onclick=()=>{if(!confirm('Iniciar uma nova lista? As alterações não salvas serão descartadas.'))return;initDraft();render();status('Nova lista iniciada.')};
 $('quickDdsReload').onclick=()=>safe(reloadSaved);
 initDraft();render();
}
function selectAllFiltered(){
 if(!roster.length)return status('Busque os colaboradores cadastrados primeiro.');
 const sexScope=$('quickDdsSexScope')?.value||'all';
 const eligible=roster.filter(p=>sexScope==='all'||p.matchesSexFilter);
 if(!eligible.length)return status('Nenhuma sugestão para este filtro. Confira os nomes e selecione manualmente.');
 const suggested=eligible.filter(p=>!p.sex&&p.suggestion===sexScope).length;
 if(suggested&&!confirm('ATENÇÃO: '+suggested+' pessoa(s) foram sugeridas pelo PRIMEIRO NOME, sem sexo confirmado no cadastro. A sugestão pode estar incorreta. Confira os nomes antes de usar a lista.\n\nDeseja selecionar os nomes sugeridos junto com os confirmados?'))return;
 eligible.forEach(p=>p.selected=true);
 if(selectedPeople().length>capacity())$('quickDdsSheets').value='0';
 renderRoster();
 status('Selecionados '+eligible.length+' nomes do filtro'+(suggested?' (incluindo '+suggested+' sugestão(ões) a conferir)':'')+'.'+(capacity()===Infinity?' PDF com paginação automática.':''));
}
function capacity(){const value=Number($('quickDdsSheets')?.value);return value===0?Infinity:value===2?40:20}
function defaultManualShift(){const scope=$('quickDdsScope')?.value||'all';return scope==='all'?'Turno A':shiftLabel(scope)}
function instructorChoice(){
 return $('quickDdsInstructorMode')?.value==='other'?
  String($('quickDdsInstructorOther')?.value||'').replace(/\s+/g,' ').trim():INSTRUCTOR;
}
function syncInstructor(){
 const other=$('quickDdsInstructorMode')?.value==='other';
 const wrapper=$('quickDdsInstructorOtherWrap');
 if(wrapper)wrapper.hidden=!other;
 if(other)$('quickDdsInstructorOther')?.focus();
}
function updateManualRow(e){
 const el=e.target.closest('[data-dds-row]');if(!el)return;
 const person=manualRows[Number(el.dataset.ddsRow)];if(!person)return;
 const field=e.target.dataset.ddsField;
 if(['name','shift','matricula'].includes(field))person[field]=e.target.value;
 status();
}
function renderManualRows(){
 const host=$('quickDdsManualRows');if(!host)return;
 host.innerHTML=manualRows.map((p,i)=>'<div class="manual-person" data-dds-row="'+i+'">'+
  '<label class="name-field">Nome<input data-dds-field="name" maxlength="140" placeholder="Nome completo" value="'+esc(p.name)+'"></label>'+
  '<label>Turno<select data-dds-field="shift">'+['Turno A','Turno B','Turno C','Turno E',...(p.shift==='Administrativo'?['Administrativo']:[])].map(v=>'<option'+(p.shift===v?' selected':'')+'>'+v+'</option>').join('')+'</select></label>'+
  '<label>Matrícula<input data-dds-field="matricula" maxlength="35" placeholder="Matrícula" value="'+esc(p.matricula)+'"></label>'+
  '<button type="button" class="quickDdsSecondary" data-dds-remove-row="'+i+'" aria-label="Remover participante">✕</button></div>').join('');
 status();
}
function manualPeople(){return manualRows.map(p=>({
 name:String(p.name||'').replace(/\s+/g,' ').trim(),
 shift:String(p.shift||'Turno A'),matricula:String(p.matricula||'').trim()
})).filter(p=>p.name)}
function selectedPeople(){
 const chosen=roster.filter(p=>p.selected).map(p=>({name:p.name,shift:p.shift,matricula:p.matricula||''}));
 return cleanPeople([...chosen,...manualPeople()]);
}
function status(message=''){
 const limit=capacity(),selected=selectedPeople().length;
 const info=(message?message+'\n':'')+roster.length+' nomes localizados • '+selected+' selecionados • capacidade: '+(Number.isFinite(limit)?limit:'todos os selecionados')+' nomes. '+(selected>limit?'⚠️ Excesso de '+(selected-limit)+' nome(s). Desmarque nomes ou aumente o limite para 40 antes de salvar/gerar PDF.':'');
 if($('quickDdsStatus')){
  $('quickDdsStatus').textContent=info;
  $('quickDdsStatus').dataset.overflow=selected>limit?'true':'false';
 }
 const counter=$('quickDdsSelectionCount');
 if(counter)counter.textContent='☑ '+selected+' selecionado(s) de '+roster.length+' colaborador(es) cadastrado(s)'+
  (manualPeople().length?' • '+manualPeople().length+' nome(s) digitado(s) manualmente':'');
}
function renderRoster(){
 const el=$('quickDdsRoster');if(!el)return;
 const query=norm($('quickDdsSearch')?.value||'');
 const sexScope=$('quickDdsSexScope')?.value||'all';
 const review=$('quickDdsNameReview');
 if(review)review.hidden=sexScope==='all';
 const eligible=roster.filter(p=>p.matchesSexFilter);
 const suggestions=eligible.filter(p=>!p.sex&&p.suggestion===sexScope).length;
 const unknown=roster.filter(p=>!p.sex).length;
 const hint=$('quickDdsNameHint');
 if(hint&&sexScope!=='all')hint.textContent=eligible.length+' nome(s) compatível(is) com o filtro, sendo '+suggestions+' sugestão(ões) pelo primeiro nome (não confirmadas). '+unknown+' cadastro(s) sem sexo informado. Pesquise qualquer nome ou marque "Mostrar os demais nomes" para incluir pessoas não sugeridas.';
 const showOthers=$('quickDdsShowOtherNames')?.checked===true;
 const visible=roster.map((p,i)=>({...p,index:i})).filter(p=>
  query?(norm(p.name).includes(query)||norm(p.matricula).includes(query)):
  sexScope==='all'||p.matchesSexFilter||p.selected||showOthers);
 el.innerHTML=visible.map(p=>{
  const label=p.sex?'Sexo cadastrado: '+sexLabel(p.sex):p.suggestion?'⚠ Sugestão pelo primeiro nome: '+sexLabel(p.suggestion)+' (conferir)':'⚠ Sexo não informado — conferir';
  return '<label><input data-quick-dds-person="'+p.index+'" type="checkbox" '+(p.selected?'checked':'')+'><span><strong class="person-name">'+esc(p.name)+'</strong><small class="person-meta">Turno: '+esc(p.shift)+' • Matrícula: '+esc(p.matricula||'Não informada')+' • '+esc(label)+'</small></span></label>';
 }).join('')||'<p style="color:#64748b">Nenhuma sugestão por nome. Ative "Mostrar os demais nomes" ou pesquise e selecione manualmente.</p>';
 status(query?'Mostrando '+visible.length+' de '+roster.length+' colaboradores. Selecione individualmente os nomes conferidos.':'Marque os nomes conferidos ou use Selecionar todos para as sugestões do filtro.');
}
function render(){
 if(!draft)initDraft();
 for(const [id,value] of [['quickDdsTheme',draft.theme],['quickDdsDate',draft.date],['quickDdsLocation',draft.location],['quickDdsScope',draft.scope],['quickDdsSexScope',draft.sexScope||'all'],['quickDdsSheets',String(draft.sheets)]])if($(id))$(id).value=value;
 if($('quickDdsHeld'))$('quickDdsHeld').checked=draft.held===true;
 const savedInstructor=String(draft.instructor||INSTRUCTOR);
 if(draft.scope==='admin'&&$('quickDdsScope')&&!$('quickDdsScope').querySelector('option[value="admin"]')){
   const option=document.createElement('option');option.value='admin';option.textContent='Administrativo (lista antiga)';$('quickDdsScope').appendChild(option);
 }
 if($('quickDdsInstructorMode'))$('quickDdsInstructorMode').value=savedInstructor===INSTRUCTOR?'default':'other';
 if($('quickDdsInstructorOther'))$('quickDdsInstructorOther').value=savedInstructor===INSTRUCTOR?'':savedInstructor;
 syncInstructor();manualRows=(draft.manualRows||[]).map(p=>({...p}));
 if($('quickDdsSearch'))$('quickDdsSearch').value='';
 if($('quickDdsShowOtherNames'))$('quickDdsShowOtherNames').checked=false;
 renderManualRows();renderRoster();
}
async function db(){if(typeof window.ensureFirestore==='function')return await window.ensureFirestore();if(window.SST?.fs)return window.SST.fs;throw Error('Não foi possível acessar o Firebase.')}
async function fetchRoster(){
 const scope=$('quickDdsScope').value,sexScope=$('quickDdsSexScope').value;
 status('Consultando colaboradores ativos no Firebase...');
 const fs=await db(),snap=await fs.collection(COL).where('kind','==','employee-registry').get({source:'server'});
 if(snap.metadata?.fromCache)throw Error('Cadastro consultado somente no cache, não no servidor.');
 const byPerson=new Map();let missingSex=0;
 for(const d of snap.docs){
  const p=d.data()||{};
  if(p.recordType!=='employee'||p.inactive===true||p.onLeave===true)continue;
  const name=String(p.name||'').replace(/\s+/g,' ').trim();
  if(!name)continue;
  const code=shiftCode(p.shift);
  if(scope!=='all'&&code!==scope)continue;
  if(scope==='all'&&!['a','b','c','e'].includes(code))continue;
  const sex=sexCode(p.sexo||p.gender),suggestion=sex?'':nameSexSuggestion(name);
  if(!sex)missingSex++;
  const matchesSexFilter=sexScope==='all'||sex===sexScope||(!sex&&suggestion===sexScope);
  const key=String(p.matricula||'').trim()||norm(name)+'|'+code;
  if(!byPerson.has(key))byPerson.set(key,{name,shift:shiftLabel(code,p.shift),matricula:String(p.matricula||''),sex,suggestion,matchesSexFilter,selected:false});
 }
 const people=[...byPerson.values()].sort((a,b)=>a.shift.localeCompare(b.shift,'pt-BR')||a.name.localeCompare(b.name,'pt-BR'));
 if(!people.length){roster=[];renderRoster();throw Error('Nenhum colaborador ativo encontrado nos turnos escolhidos. Confira o cadastro de colaboradores.')}
 const cap=capacity();
 roster=people.map(x=>({...x,selected:sexScope==='all'&&people.length<=cap}));
 if($('quickDdsSearch'))$('quickDdsSearch').value='';
 if($('quickDdsShowOtherNames'))$('quickDdsShowOtherNames').checked=false;
 renderRoster();
 const matched=roster.filter(p=>p.matchesSexFilter).length,suggested=roster.filter(p=>p.matchesSexFilter&&!p.sex).length;
 status(sexScope==='all'?'Colaboradores ativos consultados. '+(people.length>cap?'Use Selecionar todos para incluir todas as pessoas e paginar automaticamente.':''):'Encontrados '+matched+' nome(s) para o filtro, incluindo '+suggested+' sugestão(ões) pelo primeiro nome. Confira antes de selecionar todos.'+(matched===0?' Use Mostrar os demais nomes para revisão manual.':'')+(missingSex?' '+missingSex+' cadastro(s) sem sexo confirmado.':''));
}
function readDraft(){
 if(!draft)initDraft();
 const theme=String($('quickDdsTheme')?.value||'').trim(),date=$('quickDdsDate')?.value||'',
  scope=$('quickDdsScope')?.value||'all',sexScope=$('quickDdsSexScope')?.value||'all',
  sheets=Number($('quickDdsSheets')?.value||1),location=String($('quickDdsLocation')?.value||'').trim();
 if(theme.length<3)throw Error('Informe o tema do DDS/treinamento.');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date))throw Error('Informe uma data válida.');
 const people=selectedPeople();
 if(!people.length)throw Error('Selecione pelo menos um nome ou inclua um participante manualmente.');
 if(sheets!==0&&people.length>sheets*MAX_PER_SHEET)throw Error('Esta lista tem '+people.length+' pessoas. O limite selecionado é '+(sheets*MAX_PER_SHEET)+' nomes.');
 const instructor=instructorChoice();
 if(instructor.length<3)throw Error('Informe o nome completo do instrutor quando selecionar Outro.');
 const held=$('quickDdsHeld')?.checked===true;
 const changedAfterConfirmation=draft.held===true&&(
  theme!==draft.theme||date!==draft.date||location!==draft.location||scope!==draft.scope||sexScope!==(draft.sexScope||'all')||
  instructor!==String(draft.instructor||INSTRUCTOR)||sheets!==draft.sheets||
  JSON.stringify(people.map(p=>[p.name,p.shift,p.matricula]))!==
  JSON.stringify((draft.people||[]).map(p=>[p.name,p.shift,p.matricula])));
 if(held&&(!draft.held||changedAfterConfirmation)&&
    !confirm('Confirma que o DDS foi REALIZADO com estes nomes, tema, data e turnos? O registro refletirá sua declaração, sem inventar assinaturas digitais.'))
  throw Error('Declaração de realização não confirmada.');
 return {id:draft.id||('INS-DDS-'+Date.now().toString(36).toUpperCase()+'-'+Math.random().toString(36).slice(2,7).toUpperCase()),
  theme,date,location:locationLabel(location),scope,sexScope,sheets,people,held,
  instructor,manualRows:manualRows.map(p=>({...p})),registeredAt:draft.registeredAt||new Date().toISOString()};
}
function snapshotFrom(d){
 const labels=MODES.find(x=>x[0]===d.scope)?.[1]||'Todos os turnos';
 return {id:d.id,type:'training-attendance',kind:'inspection',title:UNIFIED_TITLE,
  company:'TBM Têxtil',sector:d.scope==='all'?'Todos os turnos':labels,date:d.date,
  inspector:d.instructor,findings:'',actions:'',equipment:[],checks:{},photos:[],signature1:'',signature2:'',
  workflowStatus:d.held?'concluido':'rascunho',workflowUpdatedAt:new Date().toISOString(),
  createdAt:d.registeredAt,trainingAttendance:{
   theme:d.theme,date:d.date,location:d.location,instructor:d.instructor,
   participants:d.people.map(p=>({name:p.name,shift:p.shift,matricula:p.matricula,signature:''})),
   quickListMode:true,pdfSheets:d.sheets,shiftScope:d.scope,sexScope:d.sexScope||'all',held:d.held,
   declaration:d.held?'DDS declarado realizado pelo técnico; assinaturas não digitalizadas':'Lista preparada, realização não comprovada'
  }};
}
async function save(makePdf){
 const d=readDraft();
 const full=snapshotFrom(d);
 if(!window.cloudSetReport||!window.cloudGetReport)throw Error('Salvamento em nuvem indisponível; nenhum PDF será identificado como salvo.');
 const btns=[$('quickDdsSave'),$('quickDdsPDF')].filter(Boolean);btns.forEach(b=>b.disabled=true);
 try{
  const saved=await window.cloudSetReport(full);
  if(!saved)throw Error('Não foi possível salvar a lista.');
  if(!saved._offlinePending){
    const verified=await window.cloudGetReport(d.id);
    if(!verified?.id||verified.id!==d.id||verified._offlinePending)
      throw Error('O documento não foi confirmado no servidor.');
  }
  editing=d.id;draft=d;
  status((saved._offlinePending?'📱 Lista salva neste aparelho; aguardando internet. ':'✅ Lista salva na nuvem. ')+d.people.length+' nomes. '+(d.held?'DDS realizado conforme declaração do técnico.':'Aguardando realização e assinaturas presenciais.'));
  if(makePdf)await printPdf(d);
  await reloadSaved();
 }finally{btns.forEach(b=>b.disabled=false)}
}
function pdfDefinition(d,logoData){
 const formatDate=s=>s.slice(8,10)+'/'+s.slice(5,7)+'/'+s.slice(0,4);
 const nameList=Array.isArray(d.people)?d.people:[];
 const capacity=Number(d.sheets)===0?Infinity:(Number(d.sheets)===2?2:1)*MAX_PER_SHEET;
 if(!nameList.length)throw Error('A lista precisa ter pelo menos um participante.');
 if(nameList.length>capacity)throw Error('Lista excede a capacidade de participantes selecionada.');
 // Tabela ÚNICA e contínua: o pdfmake quebra automaticamente entre as páginas.
 // Não dividir artificialmente a cada 20 nomes nem criar linhas fictícias até 40:
 // a quebra fixa anterior gerava uma página quase vazia (18-20) e outra com 21-40.
 const body=[[{text:'Nº',bold:true},{text:'NOME DO COLABORADOR',bold:true},
  {text:'TURNO',bold:true},{text:'MATRÍCULA',bold:true},{text:'ASSINATURA',bold:true}]];
 nameList.forEach((person,i)=>body.push([
  {text:String(i+1),fontSize:8.2},
  {text:String(person.name||'').trim(),fontSize:8.4},
  {text:String(person.shift||'').trim(),fontSize:8},
  {text:String(person.matricula||'').trim(),fontSize:8},
  {text:' ',fontSize:8}
 ]));
 const content=[
  ...(logoData?[{image:logoData,fit:[95,43],alignment:'center',margin:[0,0,0,7]}]:[]),
  {text:'TBM S A INDUSTRIA TEXTIL',fontSize:12,bold:true,color:'#8b1018',alignment:'center',margin:[0,0,0,3]},
  {text:UNIFIED_TITLE.toUpperCase(),fontSize:13,bold:true,alignment:'center',margin:[0,0,0,8]},
  {table:{widths:[55,'*',45,90],body:[
   [{text:'TEMA:',bold:true},{text:d.theme,colSpan:3},{},{}],
   [{text:'DATA:',bold:true},{text:formatDate(d.date)},{text:'TOTAL:',bold:true},{text:nameList.length+' participante(s)'}],
   [{text:'LOCAL:',bold:true},{text:locationLabel(d.location)},{text:'TURNO:',bold:true},{text:d.scope==='all'?'Todos':'Conforme seleção'}],
   [{text:'INSTRUTOR:',bold:true},{text:d.instructor||INSTRUCTOR,colSpan:3},{},{}]
  ]},layout:'lightHorizontalLines',margin:[0,0,0,8]},
  {table:{headerRows:1,dontBreakRows:true,keepWithHeaderRows:1,
   widths:[25,'*',72,65,106],heights:()=>18,body},
   layout:{hLineWidth:()=>.6,vLineWidth:()=>.45,
    hLineColor:()=>'#aebacc',vLineColor:()=>'#b7c1cf',
    paddingLeft:()=>5,paddingRight:()=>5,paddingTop:()=>2,paddingBottom:()=>2}}
 ];
 return {__tbmDocumentType:'training-dds-quick-list',__tbmIsolatedPdf:true,pageSize:'A4',pageMargins:[38,35,38,48],
  defaultStyle:{font:'Roboto',fontSize:9,color:'#17202b'},
  content,
  // O rodapé usa a contagem REAL de páginas, não a capacidade de 20/40 nomes.
  // Na continuação, repetir um cabeçalho discreto sem ocupar espaço de outra folha.
  header:(page,total)=>page>1?{columns:[
   {text:'TBM TÊXTIL • LISTA DE PRESENÇA / DDS',bold:true},
   {text:'Continuação • '+page+' de '+total,alignment:'right'}
  ],fontSize:7.5,color:'#5b6473',margin:[38,13,38,0]}:null,
  // A observação fica no rodapé reservado: nunca abre uma folha extra sozinha.
  footer:(page,total)=>({stack:[
   {text:'Assinaturas a coletar presencialmente. A lista impressa não comprova presença até ser assinada.',
    fontSize:7,italics:true,color:'#4b5563',alignment:'left',margin:[0,0,0,5]},
   {text:'TBM TÊXTIL • SST • (66) 3411-7050 • Página '+page+' de '+total,
    fontSize:7,color:'#5b6473',alignment:'center'}
  ],margin:[38,4,38,0]}),
  info:{title:UNIFIED_TITLE+' — '+d.theme,author:d.instructor||INSTRUCTOR,
   subject:'Lista de presença para assinaturas'}};
}
async function printPdf(d){
 if(!window.pdfMake?.createPdf)throw Error('Biblioteca PDF indisponível.');
 const logoData=await pdfLogo();
  const file='LISTA_PRESENCA_TREINAMENTO_DDS_'+d.date+'_'+d.id+'.pdf',def=pdfDefinition(d,logoData);
 if(typeof window.tbmPreviewPdfDocument==='function')
  return window.tbmPreviewPdfDocument(def,file,UNIFIED_TITLE+' • '+d.theme);
 window.pdfMake.createPdf(def).download(file);
}
async function reloadSaved(){
 let rows=[];
 if(navigator.onLine===false&&window.TBMOffline){
   rows=await window.TBMOffline.listCached();
 }else{
   try{
     const fs=await db(),snap=await fs.collection(COL).where('type','==','training-attendance').limit(150).get({source:'server'});
     if(snap.metadata?.fromCache)throw Error('O histórico não foi confirmado na nuvem.');
     rows=snap.docs.map(x=>({id:x.id,...x.data()}));
     if(window.TBMOffline){
       const local=await window.TBMOffline.listCached();
       const map=new Map(rows.map(x=>[x.id,x]));
       local.filter(x=>x._offlinePending).forEach(x=>map.set(x.id,x));
       rows=[...map.values()];
     }
   }catch(e){
     if(!window.TBMOffline?.isNetworkError(e))throw e;
     rows=await window.TBMOffline.listCached();
   }
 }
 const items=rows.filter(x=>x.trainingAttendance?.quickListMode===true)
  .sort((a,b)=>String(b.trainingAttendance?.date||'').localeCompare(String(a.trainingAttendance?.date||''))).slice(0,30);
 const box=$('quickDdsSavedRows');if(!box)return;
 box.innerHTML=items.length?items.map(x=>{
  const a=x.trainingAttendance,n=(a.participants||[]).filter(p=>p.name).length;
  return '<div class="quickDdsSavedRow"><div><b>'+esc(a.theme)+'</b> • '+esc(a.date)+' • '+n+' nome(s)<br><small>'+esc(x.sector||'')+
  ' • '+(x._offlinePending?'📱 Aguardando sincronização • ':'')+(a.held?'DDS realizado (declarado)':'Lista preparada, pendente')+'</small></div><button type="button" class="quickDdsSecondary" data-dds-edit="'+esc(x.id)+'">Abrir</button></div>';
 }).join(''):'<p>Nenhuma lista rápida salva na nuvem.</p>';
 box.querySelectorAll('[data-dds-edit]').forEach(btn=>btn.onclick=()=>safe(()=>loadSaved(btn.dataset.ddsEdit)));
}
async function loadSaved(id){
 const doc=await window.cloudGetReport(id);
 if(!doc||!doc.trainingAttendance?.quickListMode)throw Error('Lista não localizada.');
 const t=doc.trainingAttendance,scope=t.shiftScope||'all',people=cleanPeople(t.participants||[]);
 draft={id:doc.id,theme:t.theme,date:t.date,location:locationLabel(t.location),scope,sexScope:t.sexScope||'all',sheets:t.pdfSheets===0?0:t.pdfSheets===2?2:1,instructor:t.instructor||INSTRUCTOR,
  held:t.held===true,registeredAt:doc.createdAt||new Date().toISOString(),manualText:'',people};
 roster=people.map(p=>({...p,selected:true}));
 render();status('Lista carregada para edição. Para atualizar nomes, consulte novamente os colaboradores.');
}
async function safe(fn){if(busy)return;busy=true;try{await fn()}catch(e){console.error('[DDS SST]',e);status('⚠️ '+(e.message||e));alert('DDS / Lista rápida: '+(e.message||e))}finally{busy=false}}
function open(){
 mount();const el=$('quickDdsOverlay');el.style.display='block';
 safe(reloadSaved);
}
window.TBMQuickDDS={open,pdfDefinition,shiftCode,sexCode,nameSexSuggestion,fetchRoster,selectAllFiltered,selectedPeople,cleanPeople};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();