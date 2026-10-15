(()=>{
'use strict';
if(window.__sstResilienceGuardV1)return;
window.__sstResilienceGuardV1=true;
const VERSION='2026.10.14-01',ERROR_KEY='sst_resilience_errors_v1',SNAPSHOT_KEY='sst_resilience_snapshot_v1';
let lastSnapshot=0,badge=null;
function parse(v,f){try{return JSON.parse(v)}catch(_){return f}}
function cut(v,n=1200){v=String(v??'');return v.length>n?v.slice(0,n)+'…':v}
function record(kind,error,extra={}){
  try{
    const list=parse(localStorage.getItem(ERROR_KEY),[])||[];
    list.unshift({at:new Date().toISOString(),kind,message:cut(error?.message||error),source:cut(extra.source||'',300),online:navigator.onLine!==false,path:location.pathname});
    localStorage.setItem(ERROR_KEY,JSON.stringify(list.slice(0,30)));
  }catch(_){}
}
function allowed(k){
  k=String(k||'');
  return /^(tbm_|sst_|cipa|inspec|nr\d|pt_)/i.test(k)&&!/auth|token|session|secret|credential/i.test(k)&&k!==ERROR_KEY&&k!==SNAPSHOT_KEY;
}
function snapshot(force=false){
  try{
    if(!force&&Date.now()-lastSnapshot<120000)return;
    const data={};let size=0;
    for(let i=0;i<localStorage.length;i++){
      const k=localStorage.key(i);if(!allowed(k))continue;
      const v=localStorage.getItem(k)||'';if(v.length>250000||size+v.length>1500000)continue;
      data[k]=v;size+=v.length;
    }
    localStorage.setItem(SNAPSHOT_KEY,JSON.stringify({at:new Date().toISOString(),version:VERSION,data}));
    lastSnapshot=Date.now();
  }catch(e){record('snapshot',e)}
}
function restore(){
  const p=parse(localStorage.getItem(SNAPSHOT_KEY),null);if(!p?.data)return{ok:false};
  let n=0;for(const k of Object.keys(p.data)){try{localStorage.setItem(k,p.data[k]);n++}catch(_){}}
  return{ok:true,restored:n,at:p.at};
}
function offline(v){
  if(!v){badge?.remove();badge=null;return}
  if(badge)return;badge=document.createElement('div');badge.textContent='⚠ Sem internet • dados locais preservados';
  badge.style.cssText='position:fixed;left:50%;bottom:12px;transform:translateX(-50%);z-index:2147483000;background:#7f1d1d;color:#fff;padding:8px 12px;border-radius:999px;font:800 11px Arial;box-shadow:0 8px 24px #0004';document.body.appendChild(badge);
}
function health(){const issues=[];if(!window.pdfMake?.createPdf)issues.push('pdfMake indisponível');if(navigator.onLine===false)issues.push('sem conexão');return{ok:!issues.length,issues,version:VERSION,errors:(parse(localStorage.getItem(ERROR_KEY),[])||[]).slice(0,5)}}
function install(){
  window.addEventListener('error',e=>record('error',e.error||e.message,{source:e.filename}));
  window.addEventListener('unhandledrejection',e=>record('promise',e.reason||'Promise rejeitada'));
  window.addEventListener('offline',()=>{offline(true);snapshot(true)});window.addEventListener('online',()=>offline(false));
  document.addEventListener('visibilitychange',()=>{if(document.hidden)snapshot()});window.addEventListener('pagehide',()=>snapshot(true));
  setInterval(()=>snapshot(),180000);setTimeout(()=>{snapshot();offline(navigator.onLine===false)},1200);
}
window.SSTResilience={version:VERSION,snapshot:()=>snapshot(true),restore,health,errors:()=>parse(localStorage.getItem(ERROR_KEY),[])||[]};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();