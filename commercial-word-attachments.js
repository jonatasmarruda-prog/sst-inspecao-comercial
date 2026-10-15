(()=>{
'use strict';
const DB='SST_COMMERCIAL_DOCS_V1',STORE='docs';
const WORD_EXT=/\.(doc|docx)$/i;
const WORD_TYPES=new Set([
 'application/msword',
 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]);
const MAX_FILE=20*1024*1024;
const $=s=>document.querySelector(s);
function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function human(n){n=Number(n)||0;if(n<1024)return n+' B';if(n<1048576)return (n/1024).toFixed(1)+' KB';return (n/1048576).toFixed(1)+' MB'}
function db(){return new Promise((ok,no)=>{const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>{const d=r.result;if(!d.objectStoreNames.contains(STORE))d.createObjectStore(STORE,{keyPath:'id'})};r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)})}
async function put(row){const d=await db();return new Promise((ok,no)=>{const tx=d.transaction(STORE,'readwrite');tx.objectStore(STORE).put(row);tx.oncomplete=()=>{d.close();ok(true)};tx.onerror=()=>{d.close();no(tx.error)}})}
async function get(id){const d=await db();return new Promise((ok,no)=>{const tx=d.transaction(STORE,'readonly'),r=tx.objectStore(STORE).get(id);r.onsuccess=()=>{d.close();ok(r.result||null)};r.onerror=()=>{d.close();no(r.error)}})}
async function del(id){const d=await db();return new Promise((ok,no)=>{const tx=d.transaction(STORE,'readwrite');tx.objectStore(STORE).delete(id);tx.oncomplete=()=>{d.close();ok(true)};tx.onerror=()=>{d.close();no(tx.error)}})}
function ensureState(){
 try{
  if(typeof state==='object'&&state){
   if(!Array.isArray(state.documents))state.documents=[];
   return state;
  }
 }catch(_){}
 return null;
}
function ensureCss(){
 if($('#sstWordCss'))return;
 const s=document.createElement('style');s.id='sstWordCss';s.textContent=`
 .sstWordList{display:grid;gap:8px;margin-top:10px}.sstWordItem{display:flex;align-items:center;gap:10px;border:1px solid #dbe2ea;background:#f8fafc;border-radius:12px;padding:10px}
 .sstWordIcon{font-size:28px}.sstWordInfo{min-width:0;flex:1}.sstWordName{font-weight:900;color:#17202b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.sstWordMeta{font-size:11px;color:#64748b;margin-top:2px}
 .sstWordActions{display:flex;gap:6px;flex-wrap:wrap}.sstWordBtn{border:0;border-radius:9px;padding:8px 10px;font-weight:900;cursor:pointer}.sstWordOpen{background:#1d4ed8;color:#fff}.sstWordDelete{background:#fee2e2;color:#991b1b}
 .sstWordHint{font-size:11px;color:#64748b;margin-top:7px;line-height:1.4}@media(max-width:620px){.sstWordItem{align-items:flex-start;flex-wrap:wrap}.sstWordActions{width:100%}.sstWordBtn{flex:1}}
 `;document.head.appendChild(s)
}
function ensureCard(){
 ensureCss();
 if($('#wordAttachmentsCard'))return;
 const photo=$('#photoInput')?.closest('.card');
 if(!photo)return;
 const card=document.createElement('div');card.className='card';card.id='wordAttachmentsCard';
 card.innerHTML='<div class="sectionTitle">📎 Documentos anexos</div><input id="wordAttachmentInput" class="no-print" type="file" accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" multiple><div class="sstWordHint">Aceita arquivos Microsoft Word (.doc e .docx), até 20 MB por arquivo.</div><div id="wordAttachmentList" class="sstWordList"></div>';
 photo.insertAdjacentElement('afterend',card);
 $('#wordAttachmentInput').addEventListener('change',async e=>{await addFiles(e.target.files);e.target.value=''});
 render();
}
async function addFiles(files){
 const st=ensureState();if(!st)return;
 for(const file of [...(files||[])]){
  if(!(WORD_EXT.test(file.name)||WORD_TYPES.has(file.type))){
   try{notice('Arquivo ignorado: '+file.name+'. Use documento Word .doc ou .docx.','error')}catch(_){alert('Use documento Word .doc ou .docx.')}
   continue;
  }
  if(file.size>MAX_FILE){
   try{notice('O arquivo '+file.name+' ultrapassa 20 MB.','error')}catch(_){alert('O arquivo ultrapassa 20 MB.')}
   continue;
  }
  const duplicate=st.documents.some(d=>d.name===file.name&&Number(d.size)===Number(file.size));
  if(duplicate)continue;
  const id='DOC-'+Date.now().toString(36).toUpperCase()+'-'+Math.random().toString(36).slice(2,8).toUpperCase();
  await put({id,name:file.name,type:file.type||'application/octet-stream',size:file.size,blob:file,addedAt:new Date().toISOString()});
  st.documents.push({id,name:file.name,type:file.type||'',size:file.size,addedAt:new Date().toISOString()});
 }
 render();
 try{scheduleSave()}catch(_){}
}
function render(){
 const box=$('#wordAttachmentList'),st=ensureState();if(!box||!st)return;
 box.innerHTML=st.documents.length?st.documents.map(d=>'<div class="sstWordItem"><div class="sstWordIcon">📝</div><div class="sstWordInfo"><div class="sstWordName">'+esc(d.name)+'</div><div class="sstWordMeta">'+human(d.size)+' • Documento Word</div></div><div class="sstWordActions"><button type="button" class="sstWordBtn sstWordOpen" data-word-open="'+esc(d.id)+'">Abrir / baixar</button><button type="button" class="sstWordBtn sstWordDelete" data-word-delete="'+esc(d.id)+'">Excluir</button></div></div>').join(''):'<div class="sstWordHint">Nenhum documento Word anexado.</div>';
}
async function openDoc(id){
 const row=await get(id);if(!row?.blob){alert('Este anexo não está disponível neste aparelho.');return}
 const u=URL.createObjectURL(row.blob),a=document.createElement('a');a.href=u;a.download=row.name||'documento.docx';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),30000)
}
async function deleteDoc(id){
 const st=ensureState();if(!st)return;
 st.documents=st.documents.filter(d=>d.id!==id);await del(id).catch(()=>{});render();try{scheduleSave()}catch(_){}
}
function addReportList(){
 const report=$('#reportContent .reportPage'),st=ensureState();if(!report||!st?.documents?.length||$('#wordReportSection'))return;
 const footer=report.querySelector('.footer');
 const sec=document.createElement('div');sec.className='rsection';sec.id='wordReportSection';
 sec.innerHTML='<div class="rtitle">Documentos anexos</div><div class="rfield"><div class="rvalue">'+st.documents.map((d,i)=>(i+1)+'. '+esc(d.name)+' ('+human(d.size)+')').join('<br>')+'</div></div>';
 if(footer)report.insertBefore(sec,footer);else report.appendChild(sec);
}
document.addEventListener('click',e=>{
 const o=e.target.closest?.('[data-word-open]'),d=e.target.closest?.('[data-word-delete]');
 if(o){e.preventDefault();openDoc(o.dataset.wordOpen)}
 if(d){e.preventDefault();deleteDoc(d.dataset.wordDelete)}
 setTimeout(()=>{ensureCard();render();addReportList()},50);
},true);
document.addEventListener('sst-company-updated',()=>setTimeout(()=>{ensureCard();render()},100));
const mo=new MutationObserver(()=>{ensureCard();render();addReportList()});
function boot(){ensureCard();render();mo.observe(document.body,{subtree:true,attributes:true,attributeFilter:['class'],childList:true});setInterval(()=>{ensureCard();render();addReportList()},1800)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.SSTWordAttachments={render,addFiles};
})();