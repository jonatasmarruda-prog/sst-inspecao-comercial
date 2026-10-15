(function moduleFactory(SEED){
'use strict';
if(window.__tbmExtControlV2)return;window.__tbmExtControlV2=true;
const KEY='tbm_extintores_controle_v1',DOC='_extintores_controle_current',COL='inspections';
const LOGO=window.SST_DEMO_CONFIG?.logo||window.LOGO_TBM_URL||'./icon.svg';
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#039;'}[c]));
const cp=x=>JSON.parse(JSON.stringify(x));
const nowIso=()=>new Date().toISOString();
const localDate=()=>{const d=new Date(),y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');return y+'-'+m+'-'+day};
let st=load(),filterStatus='all',selected=new Set(),thFilter=false,searchQuery='',typeFilter='',locFilter='';
function base(){return{version:2,company:'',unit:'',updatedAt:'',settings:{notify:true,rechargeCompany:'',rechargeLegalName:'',rechargeCnpj:'',rechargeContact:''},items:[]}}
function load(){try{const x=JSON.parse(localStorage.getItem(KEY)||'null');return x&&Array.isArray(x.items)?Object.assign(base(),x):base()}catch(_){return base()}}
function migrate(){st.items=Array.isArray(st.items)?st.items:[];st.settings=Object.assign(base().settings,st.settings||{});st.items=st.items.map((x,i)=>{const n=Object.assign({uid:'ext-'+String(i+1).padStart(3,'0'),numero:'',local:'',patrimonio:'',inmetro:'',tipo:'',carga:'',dataRecarga:'',validadeRecarga:'',proximaRecarga:'',ultimoTH:'',proximoTH:'',empresa:'',valorRecarga:'',valorTH:'',observacoes:'',ativo:true,historico:[],auditoria:[],createdAt:'',qrId:'',movimentacao:'NA_FABRICA',dataSaida:'',previsaoRetorno:'',dataRetorno:'',empresaRecarga:'',substituto:'',historicoMov:[],identificacao:'',usadoRecarga:false,usadoEm:''},x,{historico:Array.isArray(x.historico)?x.historico:[],auditoria:Array.isArray(x.auditoria)?x.auditoria:[],historicoMov:Array.isArray(x.historicoMov)?x.historicoMov:[],ativo:x.ativo!==false,usadoRecarga:x.usadoRecarga===true});if(n.dataRecarga){const due=nextRecharge(n.dataRecarga);n.proximaRecarga=due;n.validadeRecarga=due}return n})}
migrate();
async function fs(){if(typeof window.ensureFirestore==='function')return await window.ensureFirestore();if(window.SST?.fs)return window.SST.fs;throw Error('Nuvem SST indisponível')}
async function cloudSave(){window.tbmSyncStart?.('Sincronizando Controle de Extintores...');try{if(window.__SST_COMMERCIAL&&window.SSTCommercialCloud?.saveModuleState){await window.SSTCommercialCloud.saveModuleState('extintores',cp(st));window.tbmSyncOk?.('Controle de Extintores sincronizado com a conta da empresa.');return}const f=await fs();await f.collection(COL).doc(DOC).set({kind:'extinguisher-control',payload:cp(st),cloudUpdatedAt:firebase.firestore.FieldValue.serverTimestamp()},{merge:true});window.tbmSyncOk?.('Controle de Extintores sincronizado com a nuvem.')}catch(e){console.warn('[EXTINTORES CLOUD SAVE]',e);window.tbmSyncError?.(e?.message||'Falha ao sincronizar Controle de Extintores.')}}
async function cloudLoad(){try{if(window.__SST_COMMERCIAL&&window.SSTCommercialCloud?.loadModuleState){const v=await window.SSTCommercialCloud.loadModuleState('extintores');if(v?.items){st=Object.assign(base(),v);migrate();localStorage.setItem(KEY,JSON.stringify(st));render()}return}const f=await fs(),d=await f.collection(COL).doc(DOC).get();if(d.exists&&d.data()?.payload?.items?.length){st=Object.assign(base(),d.data().payload);migrate();localStorage.setItem(KEY,JSON.stringify(st));render()}}catch(e){console.warn('[EXTINTORES CLOUD LOAD]',e)}}
function save(){st.updatedAt=nowIso();localStorage.setItem(KEY,JSON.stringify(st));window.tbmSystemAudit?.('ALTERAÇÃO','EXTINTORES','Controle de extintores atualizado',{entityId:DOC});window.tbmSyncLocal?.('Extintores salvos localmente; sincronizando com a nuvem...');cloudSave()}
function audit(x,tipo,detalhe=''){x.auditoria=x.auditoria||[];x.auditoria.push({tipo,detalhe,em:nowIso()})}
function parseDate(v){if(!v)return null;const d=new Date(v+'T12:00:00');return isNaN(d)?null:d}
function days(v){const d=parseDate(v);if(!d)return null;const t=new Date();t.setHours(12,0,0,0);return Math.ceil((d-t)/86400000)}
function statusOf(x,field='proximaRecarga'){const n=days(x[field]);if(n===null)return{key:'sem',label:'SEM DATA',cls:'xGray',days:null,text:'Sem data'};if(n<0)return{key:'vencido',label:'VENCIDO',cls:'xRed',days:n,text:'Vencido há '+Math.abs(n)+' dia(s)'};if(n<=7)return{key:'7',label:'ATÉ 7 DIAS',cls:'xRed2',days:n,text:'Vence em '+n+' dia(s)'};if(n<=15)return{key:'15',label:'ATÉ 15 DIAS',cls:'xOrange',days:n,text:'Vence em '+n+' dia(s)'};if(n<=30)return{key:'30',label:'ATÉ 30 DIAS',cls:'xAmber',days:n,text:'Vence em '+n+' dia(s)'};if(n<=60)return{key:'60',label:'ATÉ 60 DIAS',cls:'xYellow',days:n,text:'Vence em '+n+' dia(s)'};return{key:'ok',label:'EM DIA',cls:'xGreen',days:n,text:'Vence em '+n+' dia(s)'}}
function fmt(v){const d=parseDate(v);return d?d.toLocaleDateString('pt-BR'):'—'}
function money(v){const n=Number(String(v||'').replace(',','.'));return isFinite(n)?n.toLocaleString('pt-BR',{style:'currency',currency:'BRL'}):'—'}
function addDays(v,n){const d=parseDate(v)||new Date();d.setDate(d.getDate()+Number(n||0));const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');return y+'-'+m+'-'+day}
function nextRecharge(v){return addDays(v,365)}
function nextHydro(v){return addDays(v,1825)}
function nextYear(v){return nextRecharge(v)}
function activeItems(){return st.items.filter(x=>x.ativo!==false)}
function movKey(x){return x.movimentacao||'NA_FABRICA'}
function movLabel(x){const k=movKey(x);return k==='PROGRAMADO'?'PROGRAMADO':k==='ENVIADO'?'ENVIADO P/ RECARGA':k==='AGUARDANDO_RETORNO'?'AGUARDANDO RETORNO':k==='RETORNOU'?'RETORNOU':'NA FÁBRICA'}
function movClass(x){const k=movKey(x);return k==='ENVIADO'||k==='AGUARDANDO_RETORNO'?'xOrange':k==='PROGRAMADO'?'xYellow':k==='RETORNOU'?'xGreen':'xGray'}
function nextExtNumber(){const nums=st.items.map(x=>Number.parseInt(String(x.numero||''),10)).filter(Number.isFinite);return nums.length?Math.max(...nums)+1:1}
function isWaterType(tipo){return searchNorm(tipo)==='agua'}
function isPqsBcType(tipo){const t=searchNorm(tipo);return t.includes('po quimico bc')||t==='pqs bc'||t.includes('pqs bc')}
function isPqsAbcType(tipo){const t=searchNorm(tipo);return t.includes('po quimico abc')||t==='pqs abc'||t.includes('pqs abc')}
function isPqsType(tipo){return isPqsBcType(tipo)||isPqsAbcType(tipo)}
function isCo2Type(tipo){return searchNorm(tipo).includes('co2')||searchNorm(tipo).includes('dioxido de carbono')}
function cargaUnit(tipo){return isWaterType(tipo)?'L':'kg'}
function cargaLabel(x){return x&&String(x.carga??'').trim()?String(x.carga)+' '+cargaUnit(x.tipo):'—'}
function identificacao(x){return x.identificacao||x.patrimonio||('Extintor nº '+x.numero)}
function reportStatus(x){if(x.usadoRecarga&& !['ENVIADO','AGUARDANDO_RETORNO'].includes(movKey(x)))return{label:'USADO / ENVIAR PARA RECARGA',fill:'#ffedd5',color:'#9a3412'};if(movKey(x)==='ENVIADO')return{label:'ENVIADO PARA RECARGA',fill:'#dbeafe',color:'#1e40af'};if(movKey(x)==='AGUARDANDO_RETORNO')return{label:'AGUARDANDO RETORNO',fill:'#dbeafe',color:'#1e40af'};if(movKey(x)==='RETORNOU')return{label:'RETORNOU',fill:'#dcfce7',color:'#166534'};const a=statusOf(x);if(a.key==='vencido')return{label:'VENCIDO',fill:'#fee2e2',color:'#991b1b'};if(['60','30','15','7'].includes(a.key))return{label:'VENCENDO',fill:'#fef3c7',color:'#92400e'};if(a.key==='ok')return{label:'EM DIA',fill:'#dcfce7',color:'#166534'};return{label:'SEM DATA',fill:'#e2e8f0',color:'#475569'}}
function duplicateNums(){const c={};activeItems().forEach(x=>c[x.numero]=(c[x.numero]||0)+1);return c}
function counts(){const a={total:activeItems().length,ok:0,vencido:0,d60:0,d30:0,d15:0,d7:0,sem:0,enviados:0,programados:0,usados:0,inativos:st.items.filter(x=>x.ativo===false).length};activeItems().forEach(x=>{const s=statusOf(x);if(s.key==='ok')a.ok++;if(s.key==='vencido')a.vencido++;if(s.key==='60')a.d60++;if(s.key==='30')a.d30++;if(s.key==='15')a.d15++;if(s.key==='7')a.d7++;if(s.key==='sem')a.sem++;if(['ENVIADO','AGUARDANDO_RETORNO'].includes(movKey(x)))a.enviados++;if(movKey(x)==='PROGRAMADO')a.programados++;if(x.usadoRecarga)a.usados++});return a}
function mainCounts(){const c=counts();return{total:c.total,vencidos:c.vencido,vaiVencer:c.d60+c.d30+c.d15+c.d7,validos:c.ok}}
function priorityOf(x){const k=statusOf(x).key;if(k==='vencido')return 0;if(['60','30','15','7'].includes(k))return 1;if(x.usadoRecarga)return 2;if(['ENVIADO','AGUARDANDO_RETORNO'].includes(movKey(x)))return 3;if(k==='ok')return 4;return 5}
function costSummary(){const y=new Date().getFullYear(),m=new Date().getMonth(),vals=[];st.items.forEach(x=>(x.historico||[]).forEach(h=>{const d=new Date(h.registradoEm||h.dataRecarga||'');const v=Number(String(h.valor||'').replace(',','.'));if(isFinite(v))vals.push({d,v})}));return{month:vals.filter(r=>r.d.getFullYear()===y&&r.d.getMonth()===m).reduce((s,r)=>s+r.v,0),year:vals.filter(r=>r.d.getFullYear()===y).reduce((s,r)=>s+r.v,0)}}
function style(){if($('#extStyleV2'))return;const s=document.createElement('style');s.id='extStyleV2';s.textContent=`
.extOv{position:fixed;inset:0;z-index:9300;background:#eef2f6;overflow:auto;color:#17202b}.extOv *{box-sizing:border-box}.extTop{position:sticky;top:0;z-index:20;background:linear-gradient(135deg,#65090f,#b91c1c);color:#fff;box-shadow:0 7px 25px #0003}.extTopIn{max-width:1450px;margin:auto;padding:13px 18px;display:flex;align-items:center;gap:12px}.extTop img{width:62px;height:48px;object-fit:contain}.extTop h2{margin:0;font-size:20px;color:#fff}.extTop p{margin:2px 0 0;font-size:11px;opacity:.86;color:#fff}.extClose{margin-left:auto;background:#fff1;color:#fff;border:1px solid #ffffff55;border-radius:11px;padding:10px 13px;font-weight:900}.extWrap{max-width:1450px;margin:auto;padding:18px}.extHero{background:linear-gradient(135deg,#111827,#253248);border-radius:22px;padding:20px;color:#fff;box-shadow:0 18px 45px #0f172a24}.extHero h1{margin:0;font-size:27px;color:#fff}.extHero p{margin:5px 0 0;color:#cbd5e1}.extMetrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin:15px 0}.extMetric{border:0;border-radius:20px;padding:18px;text-align:left;box-shadow:0 9px 28px #0f172a14;min-height:116px}.extMetric small{display:block;font-size:12px;font-weight:950;text-transform:uppercase;letter-spacing:.3px}.extMetric b{display:block;font-size:38px;margin-top:8px;line-height:1}.extMetric span{font-size:11px}.extMetric.active{outline:3px solid #111827}.extMetric.total{background:#dbeafe;color:#1e3a8a}.extMetric.expired{background:#fee2e2;color:#991b1b}.extMetric.soon{background:#fef3c7;color:#92400e}.extMetric.valid{background:#dcfce7;color:#166534}.extMainAlert{border-radius:16px;padding:14px 16px;margin:12px 0;font-weight:900;font-size:13px}.extMainAlert.red{background:#fee2e2;color:#991b1b;border:1px solid #fecaca}.extMainAlert.yellow{background:#fef3c7;color:#92400e;border:1px solid #fde68a}.extDetailsBox{background:#fff;border:1px solid #e2e8f0;border-radius:16px;margin:12px 0;overflow:hidden}.extDetailsBox summary{cursor:pointer;padding:13px 16px;font-weight:900;color:#334155}.extDetailsGrid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;padding:0 14px 14px}.extMini{background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:10px}.extMini span{font-size:10px;color:#64748b}.extMini b{display:block;font-size:18px;color:#0f172a}.extCard{background:#fff;border:1px solid #e2e8f0;border-radius:18px;padding:16px;margin:13px 0;box-shadow:0 8px 25px #0f172a0c;color:#17202b}.extCard h3,.extCard h4{color:#17202b}.extTools{display:grid;grid-template-columns:2fr 1fr 1fr auto auto auto;gap:8px}.extTools input,.extTools select,.extField input,.extField select,.extField textarea{width:100%;padding:11px;border:1px solid #cbd5e1;border-radius:10px;background:#fff;color:#17202b}.extBtn{border:0;border-radius:10px;padding:10px 12px;font-weight:900;cursor:pointer}.extP{background:#8b1018;color:#fff}.extS{background:#e2e8f0;color:#17202b}.extG{background:#15803d;color:#fff}.extD{background:#dc2626;color:#fff}.extO{background:#ea580c;color:#fff}.extTable{width:100%;border-collapse:separate;border-spacing:0}.extTable thead th{position:static!important;background:#111827;color:#fff;font-size:9px;text-transform:uppercase;padding:10px;white-space:nowrap;z-index:auto!important}.extTable td{border-bottom:1px solid #e2e8f0;padding:9px;font-size:11px;vertical-align:middle;background:#fff;color:#17202b}.extTable tr:hover td{background:#f8fafc}.extStatus{display:inline-flex;padding:5px 8px;border-radius:999px;font-size:9px;font-weight:900;white-space:nowrap}.xGreen{background:#dcfce7;color:#166534}.xYellow{background:#fef9c3;color:#854d0e}.xAmber{background:#ffedd5;color:#9a3412}.xOrange{background:#fed7aa;color:#9a3412}.xRed2,.xRed{background:#fee2e2;color:#991b1b}.xGray{background:#e2e8f0;color:#475569}.extGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.extField label{display:block;font-size:10px;font-weight:900;margin-bottom:5px;color:#475569;text-transform:uppercase}.extModal{position:fixed;inset:0;z-index:9500;background:#0009;display:flex;align-items:center;justify-content:center;padding:15px}.extBox{width:min(900px,96vw);max-height:92vh;overflow:auto;background:#fff!important;color:#17202b!important;border-radius:20px;padding:18px;box-shadow:0 25px 70px #0007}.extBox h3,.extBox h4,.extBox b,.extBox div,.extBox span,.extBox label{color:inherit}.extBar{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px;align-items:center}.extTypeGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:9px}.extTypeCard{padding:12px;border-radius:13px;background:#f8fafc;border:1px solid #e2e8f0;color:#17202b;text-align:left;cursor:pointer}.extTypeCard b{display:block;font-size:20px}.extWarn{padding:10px 12px;border-radius:12px;background:#fff7ed;color:#9a3412;font-size:11px;margin-top:10px}.extCheck{width:18px;height:18px}.extHistory{padding:10px;border-left:3px solid #8b1018;background:#f8fafc;margin:7px 0;font-size:11px;color:#17202b}.extDup{font-size:8px;background:#ede9fe;color:#6d28d9;border-radius:999px;padding:3px 6px;font-weight:900}.extAlertGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.extAlert{border:1px solid #fecaca;background:#fff7f7;border-radius:13px;padding:12px}.extAlert b{display:block;margin-bottom:4px}.extViewGrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.extInfo{border:1px solid #e2e8f0;background:#f8fafc;border-radius:12px;padding:11px;color:#17202b}.extInfo small{display:block;color:#64748b;font-weight:900;text-transform:uppercase;margin-bottom:4px}.extFilterRow{display:flex;gap:7px;flex-wrap:wrap}.extFilterChip{padding:8px 10px;border-radius:999px;border:1px solid #cbd5e1;background:#fff;color:#334155;font-size:10px;font-weight:900}.extFilterChip.active{background:#111827;color:#fff;border-color:#111827}.extKpiNote{font-size:9px;color:#64748b;margin-top:3px}.extInactive{opacity:.55}.extReportMenu{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}.extCost{display:flex;gap:12px;flex-wrap:wrap}.extCost>div{background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:10px 12px;min-width:180px}.extStickyAction{position:sticky;bottom:0;background:#fff;padding-top:10px}
@media(max-width:980px){.extMetrics{grid-template-columns:repeat(2,1fr)}.extTools{grid-template-columns:1fr 1fr}.extGrid{grid-template-columns:1fr 1fr}.extTypeGrid{grid-template-columns:1fr 1fr}.extViewGrid{grid-template-columns:1fr 1fr}}
@media(max-width:620px){.extMetrics{grid-template-columns:1fr 1fr}.extDetailsGrid{grid-template-columns:1fr 1fr}.extTools,.extGrid,.extTypeGrid,.extViewGrid,.extAlertGrid,.extReportMenu{grid-template-columns:1fr}.extTop p{display:none}.extTop h2{font-size:16px}.extWrap{padding:10px}.extMetric b{font-size:21px}.extTable{min-width:1050px}.extCard{padding:12px}.extBtn{min-height:42px}}
`;document.head.appendChild(s)}
function ensureTile(){if($('#tbmExtTile'))return;const tiles=$('#home .tiles');if(!tiles)return;const b=document.createElement('button');b.id='tbmExtTile';b.className='tile fire';b.innerHTML='<div class="ico">🧯</div><div><b>Controle de Extintores</b><span>Recargas, vencimentos e testes</span></div>';b.onclick=open;tiles.appendChild(b)}
function shell(){let o=$('#extOv');if(o)return o;style();o=document.createElement('div');o.id='extOv';o.className='extOv';o.innerHTML='<div class="extTop"><div class="extTopIn"><img src="'+LOGO+'" onerror="this.onerror=null;this.src=\'./icon.svg\'"><div><h2>Controle de Extintores</h2><p>Recargas, vencimentos, teste hidrostático e histórico</p></div><button id="extClose" class="extClose">✕ Fechar</button></div></div><div id="extBody" class="extWrap"></div>';document.body.appendChild(o);$('#extClose').onclick=()=>o.remove();return o}
function statusMatch(x){const s=statusOf(x),th=statusOf(x,'proximoTH'),dups=duplicateNums();if(thFilter)return true;switch(filterStatus){case'all':return true;case'ok':return s.key==='ok';case'vencido':return s.key==='vencido';case'soon':return ['60','30','15','7'].includes(s.key);case'attention':return s.key==='vencido'||['60','30','15','7'].includes(s.key);case'sem':return s.key==='sem';case'dup':return dups[x.numero]>1;case'thsoon':return true;case'enviado':return ['ENVIADO','AGUARDANDO_RETORNO'].includes(movKey(x));case'programado':return movKey(x)==='PROGRAMADO';case'usado':return x.usadoRecarga===true;case'selected':return selected.has(x.uid);case'inativo':return x.ativo===false;default:return true}}
function searchNorm(v){return String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim()}
function filtered(){const q=searchNorm($('#extSearch')?.value??searchQuery),type=$('#extType')?.value??typeFilter,loc=$('#extLoc')?.value??locFilter;searchQuery=q;typeFilter=type||'';locFilter=loc||'';const terms=q?q.split(' ').filter(Boolean):[];return st.items.filter(x=>{const hay=searchNorm([x.uid,x.numero,x.identificacao,x.local,x.patrimonio,x.inmetro,x.tipo,x.carga,x.empresa,x.empresaRecarga,x.substituto,x.observacoes,movLabel(x)].join(' '));if(q){return terms.every(t=>hay.includes(t))}if(filterStatus!=='inativo'&&x.ativo===false)return false;return statusMatch(x)&&(!type||x.tipo===type)&&(!loc||x.local===loc)}).sort((a,b)=>{if(q){const aq=searchNorm(a.numero)===q?0:1,bq=searchNorm(b.numero)===q?0:1;return aq-bq||(+a.numero||0)-(+b.numero||0)||searchNorm(a.local).localeCompare(searchNorm(b.local))}const ad=days(a.proximaRecarga),bd=days(b.proximaRecarga);return priorityOf(a)-priorityOf(b)||(ad??99999)-(bd??99999)||(+a.numero||0)-(+b.numero||0)})}
function runGlobalSearch(query){searchQuery=searchNorm(query);if($('#extSearch'))$('#extSearch').value=String(query??'');if(searchQuery){filterStatus='all';thFilter=false;typeFilter='';locFilter='';if($('#extType'))$('#extType').value='';if($('#extLoc'))$('#extLoc').value=''}renderRows();paintFilters();const list=filtered();if(!list.length){alert('Nenhum extintor encontrado para esta pesquisa.');return false}const count=$('#extCountShown');if(count)count.textContent=list.length+' resultado(s) encontrado(s) para "'+String(query??'').trim()+'"';const table=$('#extMainTable');if(table)table.scrollIntoView({behavior:'smooth',block:'start'});return true}
function searchAndOpen(query){if(!runGlobalSearch(query))return false;const list=filtered();if(list.length===1){view(list[0].uid);return true}const table=$('#extRows');if(table)table.scrollIntoView({behavior:'smooth',block:'start'});return true}
function setFilter(k,th=false){filterStatus=k;thFilter=th;renderRows();paintFilters()}
function paintFilters(){$$('.extFilterChip').forEach(b=>b.classList.toggle('active',b.dataset.f===filterStatus&&String(!!b.dataset.th)===String(thFilter)));$$('.extMetric').forEach(b=>b.classList.toggle('active',b.dataset.stat===filterStatus&&String(!!b.dataset.th)===String(thFilter)))}
function alertItems(){return activeItems().filter(x=>['vencido','7','15','30'].includes(statusOf(x).key)||statusOf(x).key==='sem').sort((a,b)=>(days(a.proximaRecarga)??9999)-(days(b.proximaRecarga)??9999))}
function render(){if(!$('#extOv'))return;const c=counts(),m=mainCounts(),types=[...new Set(activeItems().map(x=>x.tipo).filter(Boolean))].sort(),locs=[...new Set(activeItems().map(x=>x.local).filter(Boolean))].sort(),alerts=alertItems(),cost=costSummary();$('#extBody').innerHTML=`
<div class="extHero"><h1>🧯 Controle de Extintores</h1><p>Vencimentos, recargas, teste hidrostático e relatórios</p></div>
<div class="extMetrics">
<button class="extMetric total" data-stat="all"><small>Total de extintores</small><b>${m.total}</b><span>Equipamentos ativos</span></button>
<button class="extMetric expired" data-stat="vencido"><small>Vencidos</small><b>${m.vencidos}</b><span>Ação imediata</span></button>
<button class="extMetric valid" data-stat="ok"><small>Válidos</small><b>${m.validos}</b><span>Em situação regular</span></button>
<button class="extMetric soon" data-stat="soon"><small>Vai vencer</small><b>${m.vaiVencer}</b><span>Próximos 60 dias</span></button>
</div>
${m.vencidos?'<div class="extMainAlert red">⚠️ ATENÇÃO: Existem '+m.vencidos+' extintor(es) vencido(s) que precisam de ação imediata.</div>':''}
${m.vaiVencer?'<div class="extMainAlert yellow">⏳ ATENÇÃO: Existem '+m.vaiVencer+' extintor(es) próximos do vencimento.</div>':''}
<div class="extCard" id="extAttentionCard"><h3 style="margin-top:0">⚠️ Atenção necessária</h3>${alerts.length?'<div class="extAlertGrid">'+alerts.slice(0,6).map(x=>{const sx=statusOf(x);return '<div class="extAlert"><b>Extintor nº '+esc(x.numero)+' • '+esc(x.local)+'</b><div>'+esc(x.tipo)+' • '+esc(cargaLabel(x))+'</div><div style="margin-top:5px"><span class="extStatus '+sx.cls+'">'+sx.text+'</span></div></div>'}).join('')+'</div>':'<div style="color:#166534">Nenhum alerta de recarga no momento.</div>'}</div>

<div class="extCard" id="extSearchCard"><div class="extTools"><input id="extSearch" placeholder="🔎 Buscar nº, local, patrimônio, INMETRO, tipo ou carga..."><button id="extOpenSearch" class="extBtn extG">🔎 Pesquisar</button><select id="extType"><option value="">Todos os tipos</option>${types.map(x=>'<option>'+esc(x)+'</option>').join('')}</select><select id="extLoc"><option value="">Todos os locais</option>${locs.map(x=>'<option>'+esc(x)+'</option>').join('')}</select><button id="extNew" class="extBtn extP">＋ Novo</button><button id="extReports" class="extBtn extS">📄 Relatórios</button><button id="extRechargeCompany" class="extBtn extS">🏢 Extinpaulo / Empresa de recarga</button></div>
<div class="extBar"><button id="extBatch" class="extBtn extG">🔄 Recarga em lote</button><button id="extMove" class="extBtn extO">🚚 Saída / Retorno</button><button id="extUsed" class="extBtn extD">🔥 Marcar usado p/ recarga</button><button id="extSelectShown" class="extBtn extS">☑ Selecionar todos exibidos</button><button id="extSelectedReport" class="extBtn extP">📄 Gerar relatório dos selecionados</button><button id="extResetFilter" class="extBtn extS">Limpar filtros</button><span style="margin-left:auto;font-size:10px;color:#64748b" id="extCountShown"></span></div>
<div class="extFilterRow" style="margin-top:12px">
${[['all','Todos'],['attention','Vencidos + A vencer'],['vencido','Vencidos'],['soon','A vencer'],['ok','Válidos'],['selected','Selecionados']].map(a=>'<button class="extFilterChip" data-f="'+a[0]+'">'+a[1]+'</button>').join('')}
</div></div>

<div class="extCard" id="extMainTable"><div style="overflow:auto"><table class="extTable"><thead><tr><th><input id="extAllCheck" class="extCheck" type="checkbox"></th><th>Nº</th><th>Local</th><th>Tipo</th><th>Carga</th><th>INMETRO</th><th>Última recarga</th><th>Próxima recarga</th><th>Status recarga</th><th>Próx. TH <small>(informativo)</small></th><th>Movimentação</th><th>Ações</th></tr></thead><tbody id="extRows"></tbody></table></div></div>
<div class="extCard"><h3 style="margin-top:0">Resumo por tipo</h3><div class="extTypeGrid">${types.map(t=>'<button class="extTypeCard" data-type-card="'+esc(t)+'"><span>'+esc(t)+'</span><b>'+activeItems().filter(x=>x.tipo===t).length+'</b></button>').join('')}</div></div>
<details class="extDetailsBox"><summary>Ver detalhes técnicos</summary><div class="extDetailsGrid">
<div class="extMini"><span>Até 60 dias</span><b>${c.d60}</b></div>
<div class="extMini"><span>Até 30 dias</span><b>${c.d30+c.d15+c.d7}</b></div>

<div class="extMini"><span>Programados</span><b>${c.programados}</b></div>
<div class="extMini"><span>Usados</span><b>${c.usados}</b></div>
<div class="extMini"><span>Fora da fábrica</span><b>${c.enviados}</b></div>
<div class="extMini"><span>Sem data</span><b>${c.sem}</b></div>
<div class="extMini"><span>Inativos</span><b>${c.inativos}</b></div>
</div></details>`;
if($('#extSearch'))$('#extSearch').value=searchQuery;if($('#extType'))$('#extType').value=typeFilter;if($('#extLoc'))$('#extLoc').value=locFilter;bind();renderRows();paintFilters();notifyIfNeeded()}
function renderRows(){const list=filtered(),dups=duplicateNums();$('#extCountShown').textContent=list.length+' exibido(s) • '+selected.size+' selecionado(s)';$('#extRows').innerHTML=list.map(x=>{const s=statusOf(x);return '<tr data-open-row="'+x.uid+'" title="Clique para abrir a ficha do extintor" class="'+(x.ativo===false?'extInactive':'')+'"><td><input class="extCheck" type="checkbox" data-sel="'+x.uid+'" '+(selected.has(x.uid)?'checked':'')+'></td><td><b>'+esc(x.numero)+'</b> '+(dups[x.numero]>1?'<span class="extDup">Nº repetido</span>':'')+(x.usadoRecarga?' <span class="extStatus xOrange">USADO</span>':'')+'</td><td>'+esc(x.local)+'</td><td>'+esc(x.tipo)+'</td><td>'+esc(cargaLabel(x))+'</td><td>'+esc(x.inmetro||'—')+'</td><td>'+fmt(x.dataRecarga)+'</td><td><b>'+fmt(x.proximaRecarga)+'</b></td><td><span class="extStatus '+s.cls+'">'+s.label+'</span><div class="extKpiNote">'+s.text+'</div></td><td>'+fmt(x.proximoTH)+'</td><td><span class="extStatus '+movClass(x)+'">'+movLabel(x)+'</span>'+(x.dataSaida?'<div class="extKpiNote">Saída: '+fmt(x.dataSaida)+'</div>':'')+'</td><td style="white-space:nowrap"><button class="extBtn extS" data-view="'+x.uid+'">Abrir ficha</button> <button class="extBtn extG" data-recharge="'+x.uid+'">Recarga</button> <button class="extBtn extS" data-edit="'+x.uid+'">Editar</button></td></tr>'}).join('')||'<tr><td colspan="12" style="text-align:center;padding:25px">Nenhum extintor encontrado.</td></tr>';$('[data-sel]').forEach(e=>e.onchange=ev=>{ev.stopPropagation();e.checked?selected.add(e.dataset.sel):selected.delete(e.dataset.sel);renderRows()});$('[data-view]').forEach(b=>b.onclick=ev=>{ev.stopPropagation();view(b.dataset.view)});$('[data-edit]').forEach(b=>b.onclick=ev=>{ev.stopPropagation();edit(b.dataset.edit)});$('[data-recharge]').forEach(b=>b.onclick=ev=>{ev.stopPropagation();recharge([b.dataset.recharge])});$('[data-open-row]').forEach(r=>r.onclick=ev=>{if(ev.target.closest('button,input,select,a,label'))return;view(r.dataset.openRow)})}
function bind(){$('#extSearch').oninput=e=>{searchQuery=searchNorm(e.target.value);if(searchQuery){filterStatus='all';thFilter=false;typeFilter='';locFilter='';$('#extType').value='';$('#extLoc').value=''}renderRows();paintFilters()};$('#extSearch').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();runGlobalSearch(e.target.value)}};$('#extOpenSearch').onclick=()=>runGlobalSearch($('#extSearch').value);$('#extType').onchange=e=>{typeFilter=e.target.value;renderRows()};$('#extLoc').onchange=e=>{locFilter=e.target.value;renderRows()};$('#extNew').onclick=()=>edit(null);$('#extReports').onclick=reportsMenu;$('#extRechargeCompany').onclick=rechargeCompanyModal;$('#extBatch').onclick=()=>{if(!selected.size)return alert('Selecione os extintores que foram recarregados.');recharge([...selected])};$('#extMove').onclick=()=>{if(!selected.size)return alert('Selecione um ou mais extintores para registrar saída/retorno.');movementModal([...selected])};$('#extUsed').onclick=()=>{if(!selected.size)return alert('Selecione o extintor usado que deve ir para recarga.');markUsed([...selected])};$('#extSelectShown').onclick=()=>{const list=filtered();if(!list.length)return alert('Nenhum extintor exibido para selecionar.');list.forEach(x=>selected.add(x.uid));renderRows();};$('#extSelectedReport').onclick=()=>{const ids=[...selected];const list=cp(st.items.filter(x=>ids.includes(x.uid)));if(!list.length)return alert('Selecione ao menos um extintor.');reportPDF(list,'selecionados')};$('#extResetFilter').onclick=()=>{filterStatus='all';thFilter=false;searchQuery='';typeFilter='';locFilter='';$('#extSearch').value='';$('#extType').value='';$('#extLoc').value='';renderRows();paintFilters()};$('#extAllCheck').onchange=e=>{filtered().forEach(x=>e.target.checked?selected.add(x.uid):selected.delete(x.uid));renderRows()};$$('[data-stat]').forEach(b=>b.onclick=()=>setFilter(b.dataset.stat,!!b.dataset.th));$$('.extFilterChip').forEach(b=>b.onclick=()=>setFilter(b.dataset.f,!!b.dataset.th));$('[data-type-card]').forEach(b=>b.onclick=()=>{typeFilter=b.dataset.typeCard;$('#extType').value=typeFilter;renderRows()});$('[data-loc-card]').forEach(b=>b.onclick=()=>{locFilter=b.dataset.locCard;$('#extLoc').value=locFilter;renderRows()});$('#extAllLocs').onclick=()=>{const o=modal('<h3>Todos os locais / setores</h3><div class="extTypeGrid">'+[...new Set(activeItems().map(x=>x.local).filter(Boolean))].sort().map(l=>'<button class="extTypeCard" data-all-loc="'+esc(l)+'"><span>'+esc(l)+'</span><b>'+activeItems().filter(x=>x.local===l).length+'</b></button>').join('')+'</div><div class="extBar"><button id="locClose" class="extBtn extS">Fechar</button></div>');$('#locClose').onclick=()=>o.remove();$('[data-all-loc]',o).forEach(b=>b.onclick=()=>{locFilter=b.dataset.allLoc;$('#extLoc').value=locFilter;o.remove();renderRows()})};}
function modal(html){$('#extModal')?.remove();const o=document.createElement('div');o.id='extModal';o.className='extModal';o.innerHTML='<div class="extBox">'+html+'</div>';document.body.appendChild(o);return o}
function field(id,label,val,type='text'){if(type==='select')return '<div class="extField"><label>'+label+'</label><select id="'+id+'"></select></div>';return '<div class="extField"><label>'+label+'</label><input id="'+id+'" type="'+type+'" value="'+esc(val||'')+'"></div>'}
function edit(uid){
  const isNew=!uid;
  const original=uid?st.items.find(z=>z.uid===uid):null;
  const x=original||{uid:'ext-'+Date.now(),numero:String(nextExtNumber()),local:'',patrimonio:'',inmetro:'',tipo:'Dióxido de carbono (CO2)',carga:'8',dataRecarga:'',validadeRecarga:'',proximaRecarga:'',ultimoTH:'',proximoTH:'',empresa:'',valorRecarga:'',valorTH:'',observacoes:'',ativo:true,historico:[],auditoria:[],createdAt:nowIso(),qrId:'',movimentacao:'NA_FABRICA',dataSaida:'',previsaoRetorno:'',dataRetorno:'',empresaRecarga:'',substituto:'',historicoMov:[]};
  const initialType=String(x.tipo||'Dióxido de carbono (CO2)');
  const initialCarga=String(x.carga??'');
  const o=modal('<h3>'+(uid?'Editar extintor':'Cadastrar novo extintor')+'</h3><div class="extWarn">'+(isNew?'O <b>número é gerado automaticamente</b>. ':'')+'Regra de controle: recarga válida por <b>365 dias</b>. Carga conforme o tipo: <b>CO₂ 8 kg</b> • <b>Água 12 L ou 75 L</b> • <b>Pó químico BC 6 kg, 10 kg ou 50 kg</b> • <b>Pó químico ABC 6 kg ou 12 kg</b>.</div><div class="extGrid" style="margin-top:12px">'+field('eNum','Número',x.numero)+field('eId','Nome / identificação',x.identificacao||'')+field('eLocal','Local / setor',x.local)+field('ePat','Nº patrimônio',x.patrimonio)+field('eInmetro','Nº INMETRO',x.inmetro)+field('eTipo','Tipo',x.tipo,'select')+'<div class="extField" id="eCargaWrap"><label id="eCargaLabel">Carga</label><div id="eCargaControl"></div></div>'+field('eRec','Data da última recarga',x.dataRecarga,'date')+field('eVal','Validade da recarga',x.validadeRecarga,'date')+field('eProx','Próxima recarga',x.proximaRecarga,'date')+field('eTH','Último teste hidrostático',x.ultimoTH,'date')+field('eProxTH','Próximo teste hidrostático',x.proximoTH,'date')+field('eEmpresa','Empresa responsável',x.empresa)+field('eVR','Valor da recarga',x.valorRecarga,'number')+field('eVTH','Valor do teste hidrostático',x.valorTH,'number')+'</div><div id="eOutroWrap" class="extField" style="margin-top:10px;display:none"><label>Outro tipo</label><input id="eOutro"></div><div class="extField" style="margin-top:10px"><label>Observações</label><textarea id="eObs">'+esc(x.observacoes||'')+'</textarea></div><div class="extBar extStickyAction"><button id="eSave" class="extBtn extG">💾 Salvar</button><button id="eCancel" class="extBtn extS">Cancelar</button>'+(uid?'<button id="eToggle" class="extBtn extO">'+(x.ativo===false?'Reativar':'Inativar')+'</button><button id="eDelete" class="extBtn extD">Excluir definitivamente</button>':'')+'</div>');
  const types=['Dióxido de carbono (CO2)','Água','Pó químico BC','Pó químico ABC','Espuma','Outros'];
  $('#eTipo').innerHTML=types.map(t=>'<option '+(t===x.tipo?'selected':'')+'>'+t+'</option>').join('')+(types.includes(x.tipo)?'':'<option selected>'+esc(x.tipo)+'</option>');
  if(isNew){$('#eNum').value=String(nextExtNumber());$('#eNum').readOnly=true;$('#eNum').title='Número gerado automaticamente pelo sistema'}
  const cargaControl=()=>$('#eCargaControl')?.querySelector('[data-carga]');
  const renderCarga=(preserveLegacy=false)=>{
    const tipo=$('#eTipo').value;
    const legacy=preserveLegacy?initialCarga:'';
    let html='',label='Carga';
    if(isCo2Type(tipo)){
      label='Carga (kg)';
      const vals=['8'];if(legacy&&initialType===tipo&&!vals.includes(legacy))vals.unshift(legacy);
      html='<select data-carga id="eCarga">'+vals.map(v=>'<option value="'+esc(v)+'" '+((legacy||'8')===v?'selected':'')+'>'+esc(v)+' kg'+(legacy===v&&v!=='8'?' • cadastrado':'')+'</option>').join('')+'</select>';
    }else if(isWaterType(tipo)){
      label='Capacidade (L)';
      const vals=['12','75'];if(legacy&&initialType===tipo&&!vals.includes(legacy))vals.unshift(legacy);
      const sel=legacy&&initialType===tipo?legacy:'';
      html='<select data-carga id="eCarga"><option value="">Escolha 12 L ou 75 L</option>'+vals.map(v=>'<option value="'+esc(v)+'" '+(sel===v?'selected':'')+'>'+esc(v)+' L'+(legacy===v&&!['12','75'].includes(v)?' • cadastrado':'')+'</option>').join('')+'</select>';
    }else if(isPqsBcType(tipo)){
      label='Carga (kg)';
      const vals=['6','10','50'];if(legacy&&initialType===tipo&&!vals.includes(legacy))vals.unshift(legacy);
      const sel=legacy&&initialType===tipo?legacy:'';
      html='<select data-carga id="eCarga"><option value="">Escolha 6 kg, 10 kg ou 50 kg</option>'+vals.map(v=>'<option value="'+esc(v)+'" '+(sel===v?'selected':'')+'>'+esc(v)+' kg'+(legacy===v&&!['6','10','50'].includes(v)?' • cadastrado':'')+'</option>').join('')+'</select>';
    }else if(isPqsAbcType(tipo)){
      label='Carga (kg)';
      const vals=['6','12'];if(legacy&&initialType===tipo&&!vals.includes(legacy))vals.unshift(legacy);
      const sel=legacy&&initialType===tipo?legacy:'';
      html='<select data-carga id="eCarga"><option value="">Escolha 6 kg ou 12 kg</option>'+vals.map(v=>'<option value="'+esc(v)+'" '+(sel===v?'selected':'')+'>'+esc(v)+' kg'+(legacy===v&&!['6','12'].includes(v)?' • cadastrado':'')+'</option>').join('')+'</select>';
    }else{
      label='Carga';
      html='<input data-carga id="eCarga" type="number" min="0" step="0.1" value="'+esc(legacy)+'" placeholder="Informe a carga">';
    }
    $('#eCargaLabel').textContent=label;$('#eCargaControl').innerHTML=html;
  };
  renderCarga(!isNew);
  $('#eOutroWrap').style.display=$('#eTipo').value==='Outros'?'block':'none';
  $('#eTipo').onchange=()=>{$('#eOutroWrap').style.display=$('#eTipo').value==='Outros'?'block':'none';renderCarga(false)};
  const syncRechargeDates=()=>{const d=$('#eRec').value;if(!d)return;const due=nextRecharge(d);$('#eVal').value=due;$('#eProx').value=due;$('#eTH').value=d;$('#eProxTH').value=nextHydro(d)};
  $('#eRec').onchange=syncRechargeDates;$('#eVal').readOnly=true;$('#eProx').readOnly=true;$('#eProxTH').readOnly=true;$('#eCancel').onclick=()=>o.remove();
  $('#eSave').onclick=()=>{
    let tipo=$('#eTipo').value;if(tipo==='Outros')tipo=$('#eOutro').value.trim();
    const carga=String(cargaControl()?.value||'').trim();
    if(!carga)return alert(isWaterType(tipo)?'Escolha a capacidade: 12 L ou 75 L.':isPqsBcType(tipo)?'Escolha a carga do Pó químico BC: 6 kg, 10 kg ou 50 kg.':isPqsAbcType(tipo)?'Escolha a carga do Pó químico ABC: 6 kg ou 12 kg.':'Informe a carga do extintor.');
    const old=cp(x),recDate=$('#eRec').value,recChanged=isNew||recDate!==String(old.dataRecarga||''),fixedDue=recDate?nextRecharge(recDate):'';
    const numero=isNew?String(nextExtNumber()):$('#eNum').value.trim();
    if(st.items.some(z=>z.uid!==x.uid&&String(z.numero).trim()===numero))return alert('O número '+numero+' já existe. O sistema recalculou o próximo número; feche e abra o cadastro novamente.');
    const n={...x,numero,identificacao:$('#eId').value.trim(),local:$('#eLocal').value.trim(),patrimonio:$('#ePat').value.trim(),inmetro:$('#eInmetro').value.trim(),tipo,carga,dataRecarga:recDate,validadeRecarga:fixedDue,proximaRecarga:fixedDue,ultimoTH:recChanged&&recDate?recDate:$('#eTH').value,proximoTH:recChanged&&recDate?nextHydro(recDate):$('#eProxTH').value,empresa:$('#eEmpresa').value.trim(),valorRecarga:$('#eVR').value,valorTH:$('#eVTH').value,observacoes:$('#eObs').value.trim()};
    if(!n.numero||!n.local||!n.tipo)return alert('Informe local e tipo.');
    if(isNew)audit(n,'EXTINTOR CADASTRADO','Nº '+n.numero+' • '+n.local+' • '+cargaLabel(n));else{if(old.local!==n.local)audit(n,'LOCAL ALTERADO',old.local+' → '+n.local);if(old.tipo!==n.tipo||String(old.carga)!==String(n.carga))audit(n,'TIPO / CARGA ALTERADOS',(old.tipo||'—')+' '+cargaLabel(old)+' → '+n.tipo+' '+cargaLabel(n));if(old.proximaRecarga!==n.proximaRecarga)audit(n,'DATA ALTERADA','Próxima recarga: '+fmt(old.proximaRecarga)+' → '+fmt(n.proximaRecarga));audit(n,'CADASTRO EDITADO','Dados atualizados')};
    const idx=st.items.findIndex(z=>z.uid===x.uid);idx>=0?st.items[idx]=n:st.items.push(n);save();o.remove();render();
  };
  if($('#eToggle'))$('#eToggle').onclick=()=>{x.ativo=x.ativo===false;audit(x,x.ativo?'EXTINTOR REATIVADO':'EXTINTOR INATIVADO',x.local);save();o.remove();render()};
  if($('#eDelete'))$('#eDelete').onclick=()=>{if(confirm('Tem certeza que deseja excluir este extintor definitivamente? O histórico também será removido.')){st.items=st.items.filter(z=>z.uid!==x.uid);save();o.remove();render()}};
}
function view(uid){const x=st.items.find(z=>z.uid===uid);if(!x)return;const s=statusOf(x),hist=x.historico||[],aud=x.auditoria||[];const o=modal('<h3>🧯 Extintor nº '+esc(x.numero)+'</h3><div class="extViewGrid">'+[['Identificação',identificacao(x)],['Local',x.local],['Tipo',x.tipo],['Carga',cargaLabel(x)],['Patrimônio',x.patrimonio||'—'],['INMETRO',x.inmetro||'—'],['Última recarga',fmt(x.dataRecarga)],['Próxima recarga',fmt(x.proximaRecarga)+'<br><span class="extStatus '+s.cls+'">'+s.text+'</span>'],['Último TH',fmt(x.ultimoTH)],['Próximo TH',fmt(x.proximoTH)+'<br><span class="extKpiNote">Informativo • não gera alerta</span>'],['Empresa',x.empresa||'—'],['Valor recarga',money(x.valorRecarga)],['Situação',x.ativo===false?'INATIVO':'ATIVO'],['Uso para recarga',x.usadoRecarga?'<span class="extStatus xOrange">USADO / ENVIAR PARA RECARGA</span>':'—'],['Movimentação','<span class="extStatus '+movClass(x)+'">'+movLabel(x)+'</span>'],['Empresa recarga',x.empresaRecarga||'—'],['Saída / retorno',(x.dataSaida?fmt(x.dataSaida):'—')+' / '+(x.dataRetorno?fmt(x.dataRetorno):'—')]].map(a=>'<div class="extInfo"><small>'+a[0]+'</small>'+a[1]+'</div>').join('')+'</div><div class="extCard"><b>Observações</b><div style="margin-top:5px">'+esc(x.observacoes||'Sem observações')+'</div></div><h4>Histórico de recargas</h4>'+(hist.length?hist.slice().reverse().map(h=>'<div class="extHistory"><b>'+fmt(h.dataRecarga)+'</b> → próxima '+fmt(h.proximaRecarga)+(h.empresa?' • '+esc(h.empresa):'')+(h.valor?' • '+money(h.valor):'')+(h.obs?' • '+esc(h.obs):'')+'<div style="color:#64748b;margin-top:3px">Registrado: '+(h.registradoEm?new Date(h.registradoEm).toLocaleString('pt-BR'):'—')+'</div></div>').join(''):'<div style="color:#64748b">Nenhuma recarga registrada pelo sistema ainda.</div>')+'<h4>Histórico de movimentação</h4>'+((x.historicoMov||[]).length?(x.historicoMov||[]).slice().reverse().map(m=>'<div class="extHistory"><b>'+esc(m.para||'MOVIMENTAÇÃO')+'</b> • '+(m.registradoEm?new Date(m.registradoEm).toLocaleString('pt-BR'):'—')+'<div>'+esc(m.empresa||'')+(m.dataSaida?' • saída '+fmt(m.dataSaida):'')+(m.dataRetorno?' • retorno '+fmt(m.dataRetorno):'')+(m.substituto?' • reserva '+esc(m.substituto):'')+'</div></div>').join(''):'<div style="color:#64748b">Nenhuma movimentação registrada ainda.</div>')+'<h4>Auditoria</h4>'+(aud.length?aud.slice().reverse().slice(0,20).map(a=>'<div class="extHistory"><b>'+esc(a.tipo)+'</b> • '+new Date(a.em).toLocaleString('pt-BR')+(a.detalhe?'<div>'+esc(a.detalhe)+'</div>':'')+'</div>').join(''):'<div style="color:#64748b">Nenhuma alteração auditada ainda.</div>')+'<div class="extBar extStickyAction"><button id="vRec" class="extBtn extG">Registrar recarga</button><button id="vMove" class="extBtn extO">Saída / Retorno</button><button id="vEdit" class="extBtn extS">Editar</button><button id="vClose" class="extBtn extS">Fechar</button></div>');$('#vClose').onclick=()=>o.remove();$('#vRec').onclick=()=>{o.remove();recharge([uid])};$('#vMove').onclick=()=>{o.remove();movementModal([uid])};$('#vEdit').onclick=()=>{o.remove();edit(uid)}}
function markUsed(uids){const list=st.items.filter(x=>uids.includes(x.uid));if(!list.length)return;if(!confirm('Marcar '+list.length+' extintor(es) como USADO / ENVIAR PARA RECARGA?'))return;list.forEach(x=>{x.usadoRecarga=true;x.usadoEm=nowIso();if(movKey(x)==='NA_FABRICA')x.movimentacao='PROGRAMADO';audit(x,'EXTINTOR USADO','Marcado para envio à recarga')});save();render();alert('Extintor(es) marcado(s) para recarga.')} 
function movementModal(uids){const list=st.items.filter(x=>uids.includes(x.uid));if(!list.length)return;const first=list[0],o=modal('<h3>🚚 Controle de saída / retorno</h3><div class="extWarn">'+list.length+' extintor(es) selecionado(s). O histórico de movimentação será preservado.</div><div class="extGrid" style="margin-top:12px"><div class="extField"><label>Situação</label><select id="mStatus"><option value="PROGRAMADO">Programado para recarga</option><option value="ENVIADO">Enviado para recarga</option><option value="AGUARDANDO_RETORNO">Aguardando retorno</option><option value="RETORNOU">Retornou da recarga</option><option value="NA_FABRICA">Na fábrica</option></select></div>'+field('mEmpresa','Empresa responsável',first.empresaRecarga||first.empresa||'')+field('mSaida','Data de saída',first.dataSaida||localDate(),'date')+field('mPrev','Previsão de retorno',first.previsaoRetorno||'','date')+field('mRetorno','Data de retorno',first.dataRetorno||'','date')+field('mSub','Extintor reserva/substituto',first.substituto||'')+'</div><div class="extField" style="margin-top:10px"><label>Observação</label><textarea id="mObs"></textarea></div><div class="extBar"><button id="mSave" class="extBtn extG">💾 Salvar movimentação</button><button id="mCancel" class="extBtn extS">Cancelar</button></div>');$('#mStatus').value=movKey(first);$('#mCancel').onclick=()=>o.remove();$('#mSave').onclick=()=>{const status=$('#mStatus').value,empresa=$('#mEmpresa').value.trim(),saida=$('#mSaida').value,prev=$('#mPrev').value,ret=$('#mRetorno').value,sub=$('#mSub').value.trim(),obs=$('#mObs').value.trim();list.forEach(x=>{x.historicoMov=x.historicoMov||[];x.historicoMov.push({de:movKey(x),para:status,empresa,dataSaida:saida,previsaoRetorno:prev,dataRetorno:ret,substituto:sub,obs,registradoEm:nowIso()});x.movimentacao=status;x.empresaRecarga=empresa;x.dataSaida=saida;x.previsaoRetorno=prev;x.dataRetorno=ret;x.substituto=sub;audit(x,status==='RETORNOU'?'RETORNO DA RECARGA':status==='ENVIADO'?'ENVIADO PARA RECARGA':'MOVIMENTAÇÃO ATUALIZADA',movLabel(x)+(empresa?' • '+empresa:''))});save();selected.clear();o.remove();render();alert('Movimentação atualizada para '+list.length+' extintor(es).')}}
function recharge(uids){const list=st.items.filter(x=>uids.includes(x.uid));if(!list.length)return;const today=localDate(),o=modal('<h3>🔄 Registrar recarga '+(list.length>1?'em lote':'')+'</h3><div class="extWarn">'+list.length+' extintor(es) selecionado(s). <b>Validade da recarga: 365 dias.</b> O teste hidrostático/inspeção de TH será atualizado junto com esta recarga, eliminando o alerta anterior.</div><div style="margin-top:10px;font-size:11px">'+list.map(x=>'Nº '+esc(x.numero)+' • '+esc(x.local)).join('<br>')+'</div><div class="extGrid" style="margin-top:12px">'+field('rDate','Data da recarga',today,'date')+field('rNext','Próxima recarga (+365 dias)',nextRecharge(today),'date')+field('rTHNext','Próximo TH',nextHydro(today),'date')+field('rCompany','Empresa responsável','')+field('rValue','Valor da recarga (opcional)','', 'number')+'</div><div class="extField" style="margin-top:10px"><label>Observação da recarga</label><textarea id="rObs"></textarea></div><div class="extBar"><button id="rSave" class="extBtn extG">✓ Confirmar recarga + TH</button><button id="rCancel" class="extBtn extS">Cancelar</button></div>');$('#rNext').readOnly=true;$('#rTHNext').readOnly=true;$('#rCancel').onclick=()=>o.remove();$('#rDate').onchange=()=>{const d=$('#rDate').value;$('#rNext').value=d?nextRecharge(d):'';$('#rTHNext').value=d?nextHydro(d):''};$('#rSave').onclick=()=>{const d=$('#rDate').value,n=d?nextRecharge(d):'',thNext=d?nextHydro(d):'',empresa=$('#rCompany').value.trim(),obs=$('#rObs').value.trim(),valor=$('#rValue').value;if(!d||!n)return alert('Informe a data da recarga.');list.forEach(x=>{x.historico=x.historico||[];x.historico.push({dataRecarga:d,proximaRecarga:n,ultimoTH:d,proximoTH:thNext,empresa,obs,valor,registradoEm:nowIso(),anterior:{dataRecarga:x.dataRecarga,proximaRecarga:x.proximaRecarga,ultimoTH:x.ultimoTH,proximoTH:x.proximoTH}});x.dataRecarga=d;x.validadeRecarga=n;x.proximaRecarga=n;x.ultimoTH=d;x.proximoTH=thNext;x.empresa=empresa||x.empresa;x.valorRecarga=valor||x.valorRecarga;audit(x,'RECARGA + TH REGISTRADOS',fmt(d)+' • recarga válida até '+fmt(n)+' • próximo TH '+fmt(thNext)+(empresa?' • '+empresa:''))});save();selected.clear();o.remove();render();alert('Recarga e TH atualizados com sucesso para '+list.length+' extintor(es). Próxima recarga em 365 dias.')}}
function alerts(){const o=modal('<h3>🔔 Controle de notificações</h3><div class="extWarn">O painel e as notificações consideram somente o vencimento da recarga. O TH fica apenas como informação técnica.</div><div class="extField" style="margin-top:12px"><label><input id="aNotify" type="checkbox" '+(st.settings.notify?'checked':'')+'> Ativar alerta diário ao abrir o sistema</label></div><div class="extBar"><button id="aPerm" class="extBtn extP">Permitir notificações do navegador</button><button id="aSave" class="extBtn extG">Salvar</button><button id="aClose" class="extBtn extS">Fechar</button></div>');$('#aClose').onclick=()=>o.remove();$('#aPerm').onclick=async()=>{if(!('Notification'in window))return alert('Este navegador não oferece notificações.');const p=await Notification.requestPermission();alert('Permissão: '+p)};$('#aSave').onclick=()=>{st.settings.notify=$('#aNotify').checked;save();o.remove();notifyIfNeeded()}}
function notifyIfNeeded(){if(!st.settings.notify||!('Notification'in window)||Notification.permission!=='granted')return;const bad=activeItems().filter(x=>['vencido','7','15','30'].includes(statusOf(x).key));if(!bad.length)return;const key='tbm_ext_notify_'+localDate();if(localStorage.getItem(key))return;localStorage.setItem(key,'1');try{new Notification('Controle de Extintores',{body:bad.length+' extintor(es) exigem atenção por prazo de recarga.',icon:LOGO})}catch(_){}}
function rechargeCompanyModal(){
  const cfg=st.settings||{};
  const o=modal('<h3>🏢 Empresa responsável pela recarga</h3><div class="extWarn">Cadastre uma vez. Esses dados serão preenchidos automaticamente nos relatórios de recarga.</div><div class="extGrid" style="margin-top:12px">'+field('rcName','Nome fantasia',cfg.rechargeCompany||'Extinpaulo')+field('rcLegal','Razão social',cfg.rechargeLegalName||'C D Santos Custodio Extinpaulo Extintores LTDA')+field('rcCnpj','CNPJ da empresa',cfg.rechargeCnpj||'44.225.671/0001-26')+field('rcContact','Contato / telefone',cfg.rechargeContact||'')+'</div><div class="extBar"><button id="rcSave" class="extBtn extG">💾 Salvar empresa</button><button id="rcClose" class="extBtn extS">Fechar</button></div>');
  $('#rcClose').onclick=()=>o.remove();
  $('#rcSave').onclick=()=>{
    st.settings.rechargeCompany=$('#rcName').value.trim();
    st.settings.rechargeCnpj=$('#rcCnpj').value.trim();
    st.settings.rechargeContact=$('#rcContact').value.trim();
    save();o.remove();alert('Empresa de recarga salva com sucesso.');
  };
}
function reportsMenu(){const o=modal('<h3>📄 Relatórios de Extintores</h3><div class="extReportMenu">'+[['geral','Relatório geral'],['vencido','Relatório de vencidos'],['verificacao','Relatório para verificação'],['soon','Relatório a vencer'],['validos','Relatório de válidos'],['usados','Relatório dos usados'],['recargaaberta','Relatório dos enviados'],['selecionados','Relatório dos selecionados'],['recarga','Relação para recarga']].map(a=>'<button class="extBtn extS" data-report="'+a[0]+'">'+a[1]+'</button>').join('')+'</div><div class="extBar"><button id="repClose" class="extBtn extS">Fechar</button></div>');$('#repClose').onclick=()=>o.remove();$$('[data-report]',o).forEach(b=>b.onclick=()=>{const k=b.dataset.report;let list=activeItems(),mode='geral';if(k==='vencido'){list=list.filter(x=>statusOf(x).key==='vencido');mode='vencidos'}else if(k==='verificacao'){const map=new Map();activeItems().filter(x=>statusOf(x).key==='vencido').forEach(x=>map.set(x.uid,x));st.items.filter(x=>selected.has(x.uid)&&x.ativo!==false).forEach(x=>map.set(x.uid,x));list=cp([...map.values()]);if(!list.length)return alert('Não há extintores vencidos nem selecionados para verificar.');mode='verificacao'}else if(k==='soon'){list=list.filter(x=>['60','30','15','7'].includes(statusOf(x).key));mode='geral'}else if(k==='validos'){list=list.filter(x=>statusOf(x).key==='ok');mode='geral'}else if(k==='usados'){list=list.filter(x=>x.usadoRecarga);mode='usados'}else if(k==='recargaaberta'){list=list.filter(x=>['ENVIADO','AGUARDANDO_RETORNO'].includes(movKey(x)));mode='movimentacao'}else if(k==='selecionados'){list=cp(st.items.filter(x=>selected.has(x.uid)));if(!list.length)return alert('Selecione ao menos um extintor.');mode='selecionados'}else if(k==='recarga'){list=selected.size?cp(st.items.filter(x=>selected.has(x.uid))):list.filter(x=>statusOf(x).key==='vencido'||x.usadoRecarga);mode='recarga'}o.remove();reportPDF(list,mode)})}
async function logoData(){
  const candidates=[window.SST_DEMO_CONFIG?.logo||LOGO,'./icon.svg'];
  for(const src of candidates){
    try{
      const r=await fetch(src,{cache:'no-store'});
      if(!r.ok)continue;
      const b=await r.blob();
      const data=await new Promise((resolve,reject)=>{const fr=new FileReader();fr.onload=()=>resolve(fr.result);fr.onerror=reject;fr.readAsDataURL(b)});
      if(/^data:image\//i.test(String(data||'')))return data;
    }catch(_){}
  }
  return '';
}
function pdfBlob(doc){return new Promise((resolve,reject)=>{try{window.pdfMake.createPdf(doc).getBlob(b=>b&&b.size?resolve(b):reject(new Error('PDF vazio')))}catch(e){reject(e)}})}
function downloadBlob(blob,filename){const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=filename;a.style.display='none';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),60000)}
function openPrintBlob(blob){const u=URL.createObjectURL(blob),w=window.open(u,'_blank');if(w)setTimeout(()=>{try{w.print()}catch(_){ }},1200);setTimeout(()=>URL.revokeObjectURL(u),300000)}
async function showPdfPreview(blob,filename,title){const u=URL.createObjectURL(blob);const o=modal('<h3>👁️ Pré-visualização do relatório de extintores</h3><div style="font-size:12px;color:#334155;margin-bottom:4px"><b>'+esc(title)+'</b></div><div style="font-size:11px;color:#64748b;margin-bottom:10px">Nome do arquivo: <b>'+esc(filename)+'</b><br>Use o botão <b>Baixar PDF</b> abaixo para salvar com esse nome.</div><iframe id="extPdfFrame" style="width:100%;height:62vh;border:1px solid #cbd5e1;border-radius:12px;background:#f8fafc"></iframe><div class="extBar extStickyAction"><button id="extPrevDown" class="extBtn extG">📥 Baixar PDF</button><button id="extPrevShare" class="extBtn extP">📤 Compartilhar</button><button id="extPrevPrint" class="extBtn extS">🖨️ Imprimir</button><button id="extPrevClose" class="extBtn extS">Fechar</button></div>');$('#extPdfFrame').src=u+'#toolbar=0&navpanes=0';$('#extPrevClose').onclick=()=>{URL.revokeObjectURL(u);o.remove()};$('#extPrevDown').onclick=()=>downloadBlob(blob,filename);$('#extPrevPrint').onclick=()=>openPrintBlob(blob);$('#extPrevShare').onclick=async()=>{try{const file=new File([blob],filename,{type:'application/pdf'});if(navigator.share&&(!navigator.canShare||navigator.canShare({files:[file]}))){await navigator.share({title,text:title,files:[file]})}else{downloadBlob(blob,filename);alert('Este navegador não permite compartilhar o PDF diretamente. O arquivo foi baixado para você anexar no WhatsApp ou e-mail.')}}catch(e){if(e?.name!=='AbortError'){console.error(e);alert('Não foi possível compartilhar diretamente. Use Baixar PDF.')}}}}
async function reportPDF(inputList,mode='geral'){
  if(!window.pdfMake)return alert('Gerador de PDF indisponível.');
  const list=cp((Array.isArray(inputList)?inputList:[]).filter(Boolean));
  if(!list.length)return alert('Nenhum extintor encontrado para este relatório.');

  const l=await logoData();
  const CNPJ='';
  const cfg=st.settings||{};
  const byType={};
  list.forEach(x=>byType[x.tipo||'Não informado']=(byType[x.tipo||'Não informado']||0)+1);

  const expired=list.filter(x=>statusOf(x).key==='vencido').length;
  const soon=list.filter(x=>['60','30','15','7'].includes(statusOf(x).key)).length;
  const ok=list.filter(x=>statusOf(x).key==='ok').length;
  const used=list.filter(x=>x.usadoRecarga).length;
  const sent=list.filter(x=>['ENVIADO','AGUARDANDO_RETORNO'].includes(movKey(x))).length;

  const titles={
    geral:'CONTROLE DE VENCIMENTO DE EXTINTORES',
    vencidos:'RELATÓRIO DE EXTINTORES VENCIDOS',
    verificacao:'RELATÓRIO PARA VERIFICAÇÃO DE EXTINTORES',
    recarga:'RELAÇÃO DE EXTINTORES PARA RECARGA',
    selecionados:'RELATÓRIO DE EXTINTORES SELECIONADOS',
    usados:'RELATÓRIO DE EXTINTORES USADOS',
    movimentacao:'EXTINTORES ENVIADOS / AGUARDANDO RETORNO',
    th:'RELATÓRIO DE TESTE HIDROSTÁTICO'
  };
  const title=titles[mode]||'CONTROLE DE VENCIMENTO DE EXTINTORES';
  const fileNames={
  geral:'Relatorio_Geral_Extintores_SST.pdf',
  vencidos:'Relatorio_Extintores_Vencidos_SST.pdf',
  verificacao:'Relatorio_Verificacao_Extintores_SST.pdf',
  recarga:'Relatorio_de_Recarga_Extintores_SST.pdf',
  selecionados:'Relatorio_Extintores_Selecionados_SST.pdf',
  usados:'Relatorio_Extintores_Usados_SST.pdf',
  movimentacao:'Relatorio_Extintores_Enviados_Recarga_SST.pdf',
  th:'Relatorio_Teste_Hidrostatico_Extintores_SST.pdf'
};
const filename=fileNames[mode]||'Relatorio_Extintores_SST.pdf';

  const isVerification=mode==='verificacao';
  const body=isVerification
    ? [[{text:'Nº / IDENT.',style:'th'},{text:'LOCAL DO EXTINTOR',style:'th'},{text:'TIPO',style:'th'},{text:'CARGA',style:'th'},{text:'RECARGA',style:'th'},{text:'VALIDADE',style:'th'},{text:'STATUS SISTEMA',style:'th'},{text:'VERIFICAÇÃO',style:'th'}]]
    : [[{text:'Nº / IDENT.',style:'th'},{text:'LOCAL DO EXTINTOR',style:'th'},{text:'TIPO',style:'th'},{text:'CARGA',style:'th'},{text:'INMETRO',style:'th'},{text:'RECARGA',style:'th'},{text:'VALIDADE',style:'th'},{text:'STATUS',style:'th'}]];
  list.forEach(x=>{
    const v=statusOf(x),r=reportStatus(x);
    const validityFill=v.key==='vencido'?'#FEE2E2':['60','30','15','7'].includes(v.key)?'#FEF3C7':v.key==='ok'?'#DCFCE7':'#E2E8F0';
    const validityColor=v.key==='vencido'?'#991B1B':['60','30','15','7'].includes(v.key)?'#92400E':v.key==='ok'?'#166534':'#475569';
    const ident={text:'Nº '+String(x.numero||'—')+(x.identificacao?'\n'+String(x.identificacao):''),style:'tdStrong'};
    const base=[ident,{text:String(x.local||'—'),style:'td'},{text:String(x.tipo||'—'),style:'td'},{text:cargaLabel(x),style:'tdC'}];
    if(isVerification){
      body.push([
        ...base,
        {text:fmt(x.dataRecarga),style:'tdC'},
        {text:v.text,style:'tdStatus',fillColor:validityFill,color:validityColor},
        {text:r.label,style:'tdStatus',fillColor:r.fill,color:r.color},
        {text:'OK [   ]\nVENCIDO [   ]',style:'verifyCell'}
      ]);
    }else{
      body.push([
        ...base,
        {text:String(x.inmetro||'—'),style:'tdC'},
        {text:fmt(x.dataRecarga),style:'tdC'},
        {text:v.text,style:'tdStatus',fillColor:validityFill,color:validityColor},
        {text:r.label,style:'tdStatus',fillColor:r.fill,color:r.color}
      ]);
    }
  });

  const typeEntries=Object.entries(byType);
  const typeSummaryInline=typeEntries.map(([k,v])=>k+': '+v).join('   •   ');

  const infoBlock={
    table:{widths:['23%','27%','23%','27%'],body:[
      [{text:'EMPRESA',style:'metaLabel'},{text:'SISTEMA SST',style:'metaValue'},{text:'CNPJ',style:'metaLabel'},{text:CNPJ,style:'metaValue'}],
      [{text:'TÉCNICO RESPONSÁVEL',style:'metaLabel'},{text:'',style:'metaValue'},{text:'EMISSÃO',style:'metaLabel'},{text:new Date().toLocaleString('pt-BR'),style:'metaValue'}]
    ]},
    layout:{hLineWidth:()=>0.6,vLineWidth:()=>0.6,hLineColor:()=>'#CBD5E1',vLineColor:()=>'#CBD5E1',paddingLeft:()=>5,paddingRight:()=>5,paddingTop:()=>5,paddingBottom:()=>5},
    margin:[0,0,0,9]
  };

  const summary={
    table:{widths:['*','*','*','*','*'],body:[[
      {text:'TOTAL\n'+list.length,style:'kpi'},
      {text:'VENCIDOS\n'+expired,style:'kpiRed'},
      {text:'A VENCER\n'+soon,style:'kpiWarn'},
      {text:'VÁLIDOS\n'+ok,style:'kpiOk'},
      {text:'USADOS / ENVIADOS\n'+(used+sent),style:'kpiBlue'}
    ]]},
    layout:{hLineWidth:()=>0,vLineWidth:()=>0,paddingLeft:()=>4,paddingRight:()=>4,paddingTop:()=>6,paddingBottom:()=>6},
    margin:[0,0,0,9]
  };

  const closing=[
    ...(isVerification?[
      {text:'CONFERÊNCIA EM CAMPO',bold:true,fontSize:12,color:'#8B1018',margin:[0,12,0,5],characterSpacing:.2},
      {table:{widths:['*','36%'],body:[
        [{text:'Verificação realizada por: ______________________________________________',style:'verifySign'},{text:'Data: ____/____/________',style:'verifySign'}],
        [{text:'Observações: ______________________________________________________________________________________',style:'verifySign',colSpan:2},'']
      ]},layout:'lightHorizontalLines'}
    ]:[]),
    {text:'RESUMO FINAL',bold:true,fontSize:12,color:'#8B1018',margin:[0,12,0,5],characterSpacing:.2},
    {table:{widths:['70%','30%'],body:[
      [{text:'Quantidade total de extintores neste relatório',style:'totalLabel'},{text:String(list.length),style:'totalValue'}],
      ...typeEntries.map(([tipo,qtd])=>[{text:'Total • '+tipo,style:'totalLabel'},{text:String(qtd),style:'totalValue'}]),
      [{text:'TOTAL GERAL',style:'grandLabel'},{text:String(list.length),style:'grandValue'}]
    ]},layout:{hLineWidth:()=>0.6,vLineWidth:()=>0.6,hLineColor:()=>'#94A3B8',vLineColor:()=>'#94A3B8',paddingLeft:()=>6,paddingRight:()=>6,paddingTop:()=>5,paddingBottom:()=>5}}
  ];

  const recargaFields=[];
  if(['recarga','selecionados','usados','movimentacao'].includes(mode)){
    recargaFields.push(
      {text:'DADOS DA EMPRESA DE RECARGA',bold:true,fontSize:12,color:'#8B1018',margin:[0,12,0,5],characterSpacing:.2},
      {table:{widths:['34%','66%'],body:[
        [{text:'Empresa',style:'metaLabel'},{text:(cfg.rechargeCompany||'Extinpaulo')+(cfg.rechargeLegalName?'\n'+cfg.rechargeLegalName:''),style:'metaValue'}],
        [{text:'CNPJ',style:'metaLabel'},{text:cfg.rechargeCnpj||'44.225.671/0001-26',style:'metaValue'}],
        [{text:'Contato',style:'metaLabel'},{text:cfg.rechargeContact||'Não informado',style:'metaValue'}],
        [{text:'Data de retirada',style:'metaLabel'},{text:(list.find(x=>x.dataSaida)?.dataSaida?fmt(list.find(x=>x.dataSaida).dataSaida):'____/____/____'),style:'metaValue'}],
        [{text:'Previsão de retorno',style:'metaLabel'},{text:(list.find(x=>x.previsaoRetorno)?.previsaoRetorno?fmt(list.find(x=>x.previsaoRetorno).previsaoRetorno):'____/____/____'),style:'metaValue'}],
        [{text:'Responsável SST',style:'metaLabel'},{text:'',style:'metaValue'}]
      ]},layout:'lightHorizontalLines'},
      {text:'Assinatura do responsável SST: _______________________________________________',fontSize:8.5,margin:[0,12,0,0]}
    );
  }

  const doc={
    __tbmIsolatedPdf:true,
    __tbmDocumentType:'extinguisher-control',
    info:{title,subject:filename.replace('.pdf','').replaceAll('_',' '),author:'Sistema SST'},
    pageSize:'A4',
    pageOrientation:'portrait',
    pageMargins:[17,90,17,28],
    header:()=>({
      margin:[17,10,17,0],
      columns:[
        {width:70,stack:[l?{image:l,fit:[64,58],alignment:'left'}:{text:(window.SST_DEMO_CONFIG?.nomeFantasia||window.SST_DEMO_CONFIG?.razaoSocial||'SST'),bold:true,fontSize:16,color:'#8B1018'}]},
        {width:'*',stack:[
          {text:'SISTEMA SST',bold:true,fontSize:19,alignment:'center',color:'#8B1018',characterSpacing:.4},
          {text:title,bold:true,fontSize:15.5,alignment:'center',color:'#111827',margin:[0,3,0,0],characterSpacing:.15},
          {text:'CONTROLE PROFISSIONAL DE EXTINTORES',bold:true,fontSize:8.5,alignment:'center',color:'#475569',margin:[0,3,0,0]}
        ]},
        {width:70,text:'',alignment:'right'}
      ]
    }),
    content:[
      infoBlock,
      summary,
      {text:'RESUMO POR TIPO: '+typeSummaryInline,bold:true,fontSize:10,color:'#1F2937',margin:[0,1,0,8]},
      ...(isVerification?[{text:'FINALIDADE: conferir fisicamente os extintores apontados como vencidos e os selecionados manualmente antes do envio para recarga. Marque OK ou VENCIDO na última coluna.',bold:true,fontSize:9.5,color:'#7C2D12',fillColor:'#FFF7ED',margin:[0,0,0,8]}]:[]),
      {table:{headerRows:1,dontBreakRows:true,keepWithHeaderRows:1,widths:isVerification?[48,92,68,34,50,70,58,'*']:[48,88,66,32,38,48,70,'*'],body},
       layout:{hLineWidth:()=>0.75,vLineWidth:()=>0.75,hLineColor:()=>'#94A3B8',vLineColor:()=>'#94A3B8',paddingLeft:()=>3,paddingRight:()=>3,paddingTop:()=>5,paddingBottom:()=>5}},
      ...closing,
      ...recargaFields
    ],
    styles:{
      th:{bold:true,fontSize:8.8,alignment:'center',fillColor:'#DDE5EE',color:'#0F172A'},
      td:{fontSize:8.3,color:'#111827'},
      tdC:{fontSize:8.3,color:'#111827',alignment:'center'},
      tdStrong:{fontSize:8.3,bold:true,color:'#111827'},
      tdStatus:{fontSize:7.9,bold:true,alignment:'center'},
      verifyCell:{fontSize:8.7,bold:true,alignment:'center',color:'#1F2937',fillColor:'#F8FAFC'},
      verifySign:{fontSize:8.5,color:'#111827'},
      metaLabel:{fontSize:8.4,bold:true,fillColor:'#EEF2F7',color:'#1F2937'},
      metaValue:{fontSize:8.7,bold:true,color:'#111827'},
      kpi:{fontSize:7.8,bold:true,alignment:'center',fillColor:'#F1F5F9',color:'#0F172A'},
      kpiRed:{fontSize:7.8,bold:true,alignment:'center',fillColor:'#FEE2E2',color:'#991B1B'},
      kpiWarn:{fontSize:7.8,bold:true,alignment:'center',fillColor:'#FEF3C7',color:'#92400E'},
      kpiOk:{fontSize:7.8,bold:true,alignment:'center',fillColor:'#DCFCE7',color:'#166534'},
      kpiBlue:{fontSize:7.8,bold:true,alignment:'center',fillColor:'#DBEAFE',color:'#1E40AF'},
      totalLabel:{fontSize:8,color:'#334155'},
      totalValue:{fontSize:8.5,bold:true,alignment:'center',color:'#111827'},
      grandLabel:{fontSize:10,bold:true,fillColor:'#DDE5EE',color:'#111827'},
      grandValue:{fontSize:10.5,bold:true,alignment:'center',fillColor:'#DDE5EE',color:'#8B1018'}
    },
    defaultStyle:{fontSize:8},
    footer:(p,n)=>({text:'Sistema SST • Controle de Extintores • Página '+p+' de '+n,alignment:'center',fontSize:7,color:'#64748B',margin:[0,8,0,0]})
  };

  try{
    const blob=await pdfBlob(doc);
    await showPdfPreview(blob,filename,title);
  }catch(e){
    console.error('[EXTINTORES PDF]',e);
    alert('Não foi possível gerar o relatório de extintores.');
  }
}
function exportMenu(){const o=modal('<h3>⬇ Exportar dados filtrados</h3><div class="extBar"><button id="exCsv" class="extBtn extS">CSV</button><button id="exXls" class="extBtn extS">Excel</button><button id="exPdf" class="extBtn extS">PDF</button><button id="exClose" class="extBtn extS">Fechar</button></div>');$('#exClose').onclick=()=>o.remove();$('#exCsv').onclick=()=>{o.remove();downloadDelimited(filtered(),',','csv')};$('#exXls').onclick=()=>{o.remove();downloadXls(filtered())};$('#exPdf').onclick=()=>{o.remove();reportPDF(filtered())}}
function rowsForExport(list){return [['Nº','Local','Tipo','Carga','INMETRO','Última recarga','Próxima recarga','Status recarga','Próximo TH (informativo)','Movimentação','Empresa recarga','Saída','Previsão retorno','Retorno','Substituto','Observações'],...list.map(x=>[x.numero,x.local,x.tipo,cargaLabel(x),x.inmetro,fmt(x.dataRecarga),fmt(x.proximaRecarga),statusOf(x).text,fmt(x.proximoTH),movLabel(x),x.empresaRecarga||'',fmt(x.dataSaida),fmt(x.previsaoRetorno),fmt(x.dataRetorno),x.substituto||'',x.observacoes||''])]}
function downloadDelimited(list,sep,ext){const txt=rowsForExport(list).map(r=>r.map(v=>'"'+String(v??'').replaceAll('"','""')+'"').join(sep)).join('\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['\ufeff'+txt],{type:'text/csv;charset=utf-8'}));a.download='extintores_sst_'+localDate()+'.'+ext;a.click();URL.revokeObjectURL(a.href)}
function downloadXls(list){const rows=rowsForExport(list).map(r=>'<tr>'+r.map(v=>'<td>'+esc(v)+'</td>').join('')+'</tr>').join('');const html='<html><head><meta charset="utf-8"></head><body><table>'+rows+'</table></body></html>';const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([html],{type:'application/vnd.ms-excel'}));a.download='extintores_sst_'+localDate()+'.xls';a.click();URL.revokeObjectURL(a.href)}
function open(){shell();render();cloudLoad()}
window.openExtinguisherControl=open;window.openExtinguisherBySearch=function(q){open();setTimeout(()=>runGlobalSearch(q),80)};window.__tbmExtControlVersion='2026.10.14.25';
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ensureTile,{once:true});else ensureTile();
window.addEventListener('tbm-firestore-ready',()=>cloudLoad().catch(()=>{}));
})([]);