(()=>{'use strict';
if(window.__tbmSystemSafetyLoaded)return;
window.__tbmSystemSafetyLoaded=true;
window.__tbmSystemSafetyVersion='2026.10.14.3';

const AUDIT_KEY='tbm_system_audit_v1';
const LAST_SYNC_KEY='tbm-sst-last-cloud-sync';
const COL='inspections';
const MAX_AUDIT=500;
const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const now=()=>new Date().toISOString();
const fmt=v=>{try{return new Date(v).toLocaleString('pt-BR')}catch(_){return String(v||'—')}};
const cp=x=>JSON.parse(JSON.stringify(x));

let syncState='connecting',syncDetail='Conectando à nuvem...',syncTimer=null,lastAuditSig='',lastAuditAt=0;

function loadAudit(){
  try{const a=JSON.parse(localStorage.getItem(AUDIT_KEY)||'[]');return Array.isArray(a)?a:[]}catch(_){return[]}
}
function saveAudit(a){
  try{localStorage.setItem(AUDIT_KEY,JSON.stringify(a.slice(-MAX_AUDIT)))}catch(e){console.warn('[TBM AUDIT LOCAL]',e)}
}
function audit(action,module,detail,meta={}){
  try{
    const entityId=String(meta.entityId||'');
    const sig=[action,module,detail,entityId].join('|');
    const t=Date.now();
    if(sig===lastAuditSig&&t-lastAuditAt<3500)return;
    lastAuditSig=sig;lastAuditAt=t;
    const entry={
      id:'AUD-'+t.toString(36).toUpperCase()+'-'+Math.random().toString(36).slice(2,6).toUpperCase(),
      at:now(),action:String(action||'ALTERAÇÃO'),module:String(module||'SISTEMA'),
      detail:String(detail||''),entityId,
      online:navigator.onLine!==false,
      version:window.__tbmSystemSafetyVersion
    };
    const a=loadAudit();a.push(entry);saveAudit(a);
    renderAuditIfOpen();
    (async()=>{
      try{
        const fs=typeof window.ensureFirestore==='function'?await window.ensureFirestore():window.SST?.fs;
        if(fs)await fs.collection('system_audit').doc(entry.id).set(entry,{merge:true});
      }catch(_){}
    })();
  }catch(e){console.warn('[TBM AUDIT]',e)}
}
window.tbmSystemAudit=audit;

function setSync(state,detail){
  syncState=state||syncState;syncDetail=detail||syncDetail;
  const el=$('#cloudState');
  if(el){
    const map={
      synced:['☁️','Sincronizado','#dcfce7','#166534'],
      saving:['↻','Salvando...','#fef3c7','#92400e'],
      local:['💾','Salvo localmente','#e0e7ff','#3730a3'],
      offline:['⚠️','Sem conexão','#fee2e2','#991b1b'],
      error:['⚠️','Falha na sincronização','#fee2e2','#991b1b'],
      connecting:['●','Conectando...','#e2e8f0','#475569']
    };
    const v=map[syncState]||map.connecting;
    el.textContent=v[0]+' '+v[1];
    Object.assign(el.style,{background:v[2],color:v[3],padding:'7px 10px',borderRadius:'999px',fontWeight:'900',whiteSpace:'nowrap',fontSize:'11px'});
    el.title=syncDetail||v[1];
  }
  renderSyncIfOpen();
}
function syncStart(detail='Salvando alterações na nuvem...'){clearTimeout(syncTimer);setSync('saving',detail)}
function syncOk(detail='Dados sincronizados com a nuvem.'){
  clearTimeout(syncTimer);
  const t=now();try{localStorage.setItem(LAST_SYNC_KEY,t)}catch(_){}
  setSync('synced',detail);
}
function syncLocal(detail='Dados preservados localmente.'){clearTimeout(syncTimer);setSync('local',detail)}
function syncError(detail='Não foi possível sincronizar agora. Os dados locais permanecem preservados.'){
  clearTimeout(syncTimer);
  setSync(navigator.onLine===false?'offline':'local',detail);
}
window.tbmSyncStart=syncStart;window.tbmSyncOk=syncOk;window.tbmSyncLocal=syncLocal;window.tbmSyncError=syncError;

window.addEventListener('online',()=>{setSync('connecting','Conexão restaurada. Verificando nuvem...');setTimeout(()=>{if(window.SST?.fs)syncOk('Conexão restaurada e nuvem disponível.')},900)});
window.addEventListener('offline',()=>setSync('offline','Sem internet. Alterações locais devem ser sincronizadas quando a conexão voltar.'));
window.addEventListener('tbm-firestore-ready',()=>syncOk('Firestore conectado.'));
window.addEventListener('sst-cloud-ready',()=>syncOk('Sincronização SST ativa.'));
window.addEventListener('sst-cloud-error',e=>syncError(e?.detail?.message||'Falha na sincronização SST.'));

function plain(v){
  if(v==null)return v;
  if(typeof v?.toDate==='function'){try{return v.toDate().toISOString()}catch(_){}}
  if(Array.isArray(v))return v.map(plain);
  if(typeof v==='object'){const o={};Object.keys(v).forEach(k=>o[k]=plain(v[k]));return o}
  return v;
}
function downloadJson(data,name){
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json;charset=utf-8'});
  const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function localDump(){
  const out={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(!k||k===AUDIT_KEY)continue;out[k]=localStorage.getItem(k)}return out;
}
async function idbDump(){
  if(!window.indexedDB)return[];
  let dbs=[];
  try{dbs=typeof indexedDB.databases==='function'?await indexedDB.databases():[{name:'SSTInspecoes'}]}catch(_){dbs=[{name:'SSTInspecoes'}]}
  const out=[];
  for(const d of dbs.filter(x=>x?.name)){
    try{
      const db=await new Promise((ok,no)=>{const r=indexedDB.open(d.name);r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error);r.onupgradeneeded=()=>{}});
      const stores={};
      for(const storeName of [...db.objectStoreNames]){
        stores[storeName]=await new Promise((ok,no)=>{const tx=db.transaction(storeName,'readonly'),st=tx.objectStore(storeName),rq=st.getAll();rq.onsuccess=()=>ok(rq.result||[]);rq.onerror=()=>no(rq.error)});
      }
      out.push({name:d.name,version:db.version,stores:plain(stores)});db.close();
    }catch(e){console.warn('[TBM BACKUP IDB]',d.name,e)}
  }
  return out;
}
async function firestoreDump(){
  const fs=typeof window.ensureFirestore==='function'?await window.ensureFirestore():window.SST?.fs;
  if(!fs)throw new Error('Firestore indisponível.');
  const snap=await fs.collection(COL).get();
  return snap.docs.map(d=>({id:d.id,data:plain(d.data())}));
}
async function createBackup(){
  const btn=$('#tbmBackupNow');if(btn){btn.disabled=true;btn.textContent='⏳ Gerando backup...'}
  syncStart('Gerando backup completo do sistema...');
  try{
    let cloud=[],cloudError='';
    try{cloud=await firestoreDump()}catch(e){cloudError=String(e.message||e)}
    const backup={
      schema:'tbm-sst-full-backup-v1',createdAt:now(),system:'TBM SST',
      app:{safety:window.__tbmSystemSafetyVersion,cipa:window.__tbmCipaManagementVersion||'',extintores:window.__tbmExtControlVersion||''},
      localStorage:localDump(),indexedDB:await idbDump(),firestore:{collection:COL,documents:cloud,error:cloudError||null},
      audit:loadAudit()
    };
    const date=new Date().toISOString().slice(0,10);
    downloadJson(backup,'Backup_Sistema_TBM_SST_'+date+'.json');
    audit('BACKUP','SISTEMA','Backup completo do sistema gerado',{entityId:date});
    if(cloudError)syncError('Backup local gerado; nuvem não pôde ser incluída: '+cloudError);else syncOk('Backup completo gerado com dados locais e nuvem.');
    alert(cloudError?'Backup gerado. Atenção: a parte da nuvem não pôde ser incluída.':'Backup completo gerado com sucesso.');
  }catch(e){console.error(e);syncError(String(e.message||e));alert('Não foi possível gerar o backup: '+(e.message||e))}
  finally{if(btn){btn.disabled=false;btn.textContent='💾 Gerar backup completo'}}
}
async function restoreIdb(list){
  if(!Array.isArray(list))return;
  for(const item of list){
    if(!item?.name||!item.stores)continue;
    try{
      let db=await new Promise((ok,no)=>{const r=indexedDB.open(item.name);r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error);r.onupgradeneeded=()=>{if(item.name==='SSTInspecoes'&&!r.result.objectStoreNames.contains('registros'))r.result.createObjectStore('registros',{keyPath:'id'})}});
      for(const [storeName,rows] of Object.entries(item.stores)){
        if(!db.objectStoreNames.contains(storeName))continue;
        await new Promise((ok,no)=>{const tx=db.transaction(storeName,'readwrite'),st=tx.objectStore(storeName);(rows||[]).forEach(x=>st.put(x));tx.oncomplete=ok;tx.onerror=()=>no(tx.error)});
      }
      db.close();
    }catch(e){console.warn('[TBM RESTORE IDB]',e)}
  }
}
async function restoreFirestore(block){
  const docs=block?.documents;if(!Array.isArray(docs)||!docs.length)return 0;
  const fs=typeof window.ensureFirestore==='function'?await window.ensureFirestore():window.SST?.fs;
  if(!fs)throw new Error('Firestore indisponível para restauração.');
  let n=0;
  for(let i=0;i<docs.length;i+=350){
    const batch=fs.batch();
    docs.slice(i,i+350).forEach(doc=>{
      if(!doc?.id||!doc.data)return;
      const data=cp(doc.data);delete data.cloudUpdatedAt;
      data.cloudUpdatedAt=firebase.firestore.FieldValue.serverTimestamp();
      batch.set(fs.collection(COL).doc(String(doc.id)),data,{merge:true});n++;
    });
    await batch.commit();
  }
  return n;
}
async function restoreBackup(file){
  if(!file)return;
  let data;
  try{data=JSON.parse(await file.text())}catch(_){return alert('Arquivo de backup inválido.')}
  if(data?.schema!=='tbm-sst-full-backup-v1')return alert('Este arquivo não é um backup completo válido do Sistema TBM SST.');
  if(!confirm('ATENÇÃO: restaurar este backup pode substituir dados atuais por versões anteriores. Deseja continuar?'))return;
  if(!confirm('Confirma a restauração do backup de '+fmt(data.createdAt)+'?'))return;
  const btn=$('#tbmRestoreBtn');if(btn){btn.disabled=true;btn.textContent='⏳ Restaurando...'}
  syncStart('Restaurando backup...');
  try{
    if(data.localStorage&&typeof data.localStorage==='object'){
      Object.entries(data.localStorage).forEach(([k,v])=>{if(k!==AUDIT_KEY&&v!=null)localStorage.setItem(k,String(v))});
    }
    if(Array.isArray(data.audit))saveAudit(data.audit);
    await restoreIdb(data.indexedDB);
    const cloudCount=await restoreFirestore(data.firestore).catch(e=>{console.warn(e);return 0});
    audit('RESTAURAÇÃO','SISTEMA','Backup restaurado com sucesso',{entityId:data.createdAt});
    syncOk('Backup restaurado. '+cloudCount+' documento(s) de nuvem processado(s).');
    alert('Backup restaurado com sucesso. O sistema será recarregado para aplicar todos os dados.');
    location.reload();
  }catch(e){console.error(e);syncError(String(e.message||e));alert('Falha ao restaurar o backup: '+(e.message||e))}
  finally{if(btn){btn.disabled=false;btn.textContent='♻️ Restaurar backup'}}
}

function css(){
  if($('#tbmSystemSafetyCss'))return;
  const st=document.createElement('style');st.id='tbmSystemSafetyCss';st.textContent=`
#tbmSystemSafetyOverlay{position:fixed;inset:0;z-index:99990;background:#0f172acc;display:none;align-items:flex-start;justify-content:center;padding:20px;overflow:auto}
#tbmSystemSafetyOverlay.open{display:flex}.tbmSysBox{width:min(980px,100%);background:#f8fafc;border-radius:22px;overflow:hidden;box-shadow:0 30px 80px #0006}
.tbmSysHead{background:#0f172a;color:white;padding:18px 20px;display:flex;gap:12px;align-items:center}.tbmSysHead h2{margin:0;font-size:22px}.tbmSysHead p{margin:4px 0 0;font-size:12px;color:#e2e8f0;font-weight:650}.tbmSysClose{margin-left:auto;background:#334155;color:white;border-radius:12px;padding:10px 14px;font-weight:900}
.tbmSysTabs{display:flex;gap:8px;padding:12px;background:#ffffff;border-bottom:1px solid #cbd5e1;flex-wrap:wrap}.tbmSysTab{padding:11px 14px;border-radius:10px;background:#e2e8f0;color:#1e293b!important;font-weight:950;font-size:14px}.tbmSysTab.active{background:#991b1b;color:#ffffff!important}
.tbmSysContent{padding:18px;background:#f8fafc;color:#111827}.tbmSysPane{display:none;color:#111827}.tbmSysPane.active{display:block}.tbmSysCard{background:#ffffff!important;color:#111827!important;border:1px solid #cbd5e1;border-radius:16px;padding:18px;margin-bottom:14px;box-shadow:0 4px 14px #0f172a0d}.tbmSysCard h3{margin:0 0 9px;color:#0f172a!important;font-size:19px;font-weight:950}.tbmSysCard p{margin:0 0 12px;color:#334155!important;font-size:14px;line-height:1.55;font-weight:600}.tbmSysCard label,.tbmSysCard span,.tbmSysCard small{color:#334155}.tbmSysCard input[type="file"],.tbmSysCard input[type="text"],.tbmSysCard input:not([type]){color:#111827!important;background:#fff!important;border:1px solid #94a3b8;border-radius:9px;padding:9px;font-size:13px}.tbmSysBtn{border:0;border-radius:11px;padding:12px 16px;font-weight:950;margin:4px;font-size:14px}.tbmSysPrimary{background:#a30f19;color:#fff!important}.tbmSysGreen{background:#15803d;color:#fff!important}.tbmSysGray{background:#e2e8f0;color:#111827!important}
.tbmAuditRow{border-bottom:1px solid #cbd5e1;padding:11px 2px;display:grid;grid-template-columns:145px 110px 120px 1fr;gap:8px;font-size:12.5px;color:#1f2937!important}.tbmAuditRow b,.tbmAuditRow strong{color:#0f172a!important;font-weight:900}.tbmAuditRow span{color:#334155!important}.tbmAuditEmpty{padding:20px;text-align:center;color:#475569!important;font-weight:700}
.tbmSyncPanel{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.tbmSyncStat{border-radius:14px;padding:15px;background:#f1f5f9;border:1px solid #dbe3ec;color:#111827!important}.tbmSyncStat small{display:block;color:#475569!important;font-weight:900;font-size:11px}.tbmSyncStat b{display:block;font-size:15px;margin-top:6px;color:#111827!important;font-weight:900}
@media(max-width:700px){.tbmAuditRow{grid-template-columns:1fr}.tbmSyncPanel{grid-template-columns:1fr}}
`;document.head.appendChild(st);
}
function ensureTile(){
  if($('#tbmSystemSecurityTile'))return;
  const tiles=$('#home .tiles');if(!tiles)return;
  const b=document.createElement('button');b.id='tbmSystemSecurityTile';b.className='tile safety';b.innerHTML='<div class="ico">🛡️</div><div><b>Segurança do Sistema</b><span>Backup, alterações e sincronização</span></div>';b.onclick=openPanel;tiles.appendChild(b);
}
function ensureOverlay(){
  if($('#tbmSystemSafetyOverlay'))return $('#tbmSystemSafetyOverlay');
  const o=document.createElement('div');o.id='tbmSystemSafetyOverlay';o.innerHTML=`
<div class="tbmSysBox">
  <div class="tbmSysHead"><div><h2>🛡️ Segurança do Sistema</h2><p>Backup, rastreabilidade e sincronização dos dados TBM SST</p></div><button class="tbmSysClose" id="tbmSysClose">✕ Fechar</button></div>
  <div class="tbmSysTabs"><button class="tbmSysTab active" data-sys-tab="backup">💾 Backup & Restauração</button><button class="tbmSysTab" data-sys-tab="audit">🧾 Log de Alterações</button><button class="tbmSysTab" data-sys-tab="sync">☁️ Sincronização</button></div>
  <div class="tbmSysContent">
    <section class="tbmSysPane active" data-sys-pane="backup">
      <div class="tbmSysCard"><h3>Backup completo</h3><p>Salva dados locais, bancos IndexedDB, documentos da nuvem e log de alterações em um único arquivo JSON.</p><button id="tbmBackupNow" class="tbmSysBtn tbmSysGreen">💾 Gerar backup completo</button></div>
      <div class="tbmSysCard"><h3>Restaurar backup</h3><p>A restauração é confirmada duas vezes e não apaga documentos extras da nuvem; ela repõe os registros presentes no arquivo.</p><input type="file" id="tbmRestoreFile" accept=".json,application/json" style="margin:8px 0"><br><button id="tbmRestoreBtn" class="tbmSysBtn tbmSysPrimary">♻️ Restaurar backup</button></div>
    </section>
    <section class="tbmSysPane" data-sys-pane="audit">
      <div class="tbmSysCard"><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><h3 style="margin-right:auto">Histórico de alterações</h3><input id="tbmAuditSearch" placeholder="Buscar no log..." style="padding:10px;border:1px solid #cbd5e1;border-radius:10px"><button id="tbmAuditExport" class="tbmSysBtn tbmSysGray">⬇️ Exportar log</button></div><div id="tbmAuditList"></div></div>
    </section>
    <section class="tbmSysPane" data-sys-pane="sync"><div class="tbmSysCard"><h3>Status da sincronização</h3><div id="tbmSyncPanel"></div><div style="margin-top:12px"><button id="tbmSyncTest" class="tbmSysBtn tbmSysPrimary">☁️ Testar conexão com a nuvem</button></div></div></section>
  </div>
</div>`;
  document.body.appendChild(o);
  $('#tbmSysClose').onclick=()=>o.classList.remove('open');
  o.addEventListener('click',e=>{if(e.target===o)o.classList.remove('open')});
  $$('[data-sys-tab]').forEach(b=>b.onclick=()=>{$$('[data-sys-tab]').forEach(x=>x.classList.toggle('active',x===b));$$('[data-sys-pane]').forEach(x=>x.classList.toggle('active',x.dataset.sysPane===b.dataset.sysTab));if(b.dataset.sysTab==='audit')renderAuditIfOpen();if(b.dataset.sysTab==='sync')renderSyncIfOpen()});
  $('#tbmBackupNow').onclick=createBackup;
  $('#tbmRestoreBtn').onclick=()=>restoreBackup($('#tbmRestoreFile').files?.[0]);
  $('#tbmAuditSearch').oninput=renderAuditIfOpen;
  $('#tbmAuditExport').onclick=()=>downloadJson({schema:'tbm-system-audit-v1',exportedAt:now(),entries:loadAudit()},'Log_Alteracoes_TBM_SST_'+new Date().toISOString().slice(0,10)+'.json');
  $('#tbmSyncTest').onclick=async()=>{syncStart('Testando conexão com a nuvem...');try{const fs=await window.ensureFirestore();await fs.collection(COL).limit(1).get();syncOk('Teste concluído: nuvem acessível.');audit('TESTE','SINCRONIZAÇÃO','Conexão com a nuvem testada com sucesso')}catch(e){syncError(e.message||String(e));alert('Falha na conexão com a nuvem: '+(e.message||e))}};
  return o;
}
function openPanel(){css();const o=ensureOverlay();o.classList.add('open');renderAuditIfOpen();renderSyncIfOpen()}
function renderAuditIfOpen(){
  const box=$('#tbmAuditList');if(!box)return;
  const q=String($('#tbmAuditSearch')?.value||'').toLowerCase();
  const arr=loadAudit().slice().reverse().filter(x=>!q||[x.action,x.module,x.detail,x.entityId].join(' ').toLowerCase().includes(q));
  box.innerHTML=arr.length?arr.slice(0,250).map(x=>'<div class="tbmAuditRow"><span>'+esc(fmt(x.at))+'</span><b>'+esc(x.module)+'</b><strong>'+esc(x.action)+'</strong><span>'+esc(x.detail)+(x.entityId?' <small>• '+esc(x.entityId)+'</small>':'')+'</span></div>').join(''):'<div class="tbmAuditEmpty">Nenhuma alteração registrada ainda.</div>';
}
function renderSyncIfOpen(){
  const box=$('#tbmSyncPanel');if(!box)return;
  const last=localStorage.getItem(LAST_SYNC_KEY);
  const online=navigator.onLine!==false;
  const cloud=!!window.SST?.fs;
  box.innerHTML='<div class="tbmSyncPanel"><div class="tbmSyncStat"><small>Status atual</small><b>'+esc(syncDetail)+'</b></div><div class="tbmSyncStat"><small>Internet</small><b>'+(online?'✅ Conectado':'⚠️ Sem conexão')+'</b></div><div class="tbmSyncStat"><small>Última sincronização</small><b>'+esc(last?fmt(last):'Ainda não registrada')+'</b></div><div class="tbmSyncStat"><small>Firestore</small><b>'+(cloud?'✅ Disponível':'⏳ Aguardando')+'</b></div><div class="tbmSyncStat"><small>Registros no log local</small><b>'+loadAudit().length+'</b></div><div class="tbmSyncStat"><small>Versão segurança</small><b>'+esc(window.__tbmSystemSafetyVersion)+'</b></div></div>';
}

function init(){
  css();ensureTile();setTimeout(ensureTile,1000);setTimeout(ensureTile,3000);
  ensureOverlay();
  if(navigator.onLine===false)setSync('offline','Sem conexão com a internet.');
  else if(window.SST?.fs)syncOk('Nuvem disponível.');
  else setSync('connecting','Conectando à nuvem...');
  audit('INICIALIZAÇÃO','SISTEMA','Camada de segurança do sistema carregada',{entityId:window.__tbmSystemSafetyVersion});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();