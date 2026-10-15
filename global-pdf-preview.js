(()=>{
'use strict';

const VERSION='2026.10.13.global-pdf-preview.7-mobile-canvas-force';
const PREVIEW_IDS=['tbmGlobalPreview','ptView','trainingPreview','tbmReportPreview'];
const DOWNLOAD_IDS=['tbmGlobalDownload','ptPdf','trainingDownload','reportPdf'];
const SHARE_IDS=['pdf','ptShare','trainingShare','reportShare'];
let busy=false;
let actionRefreshTimer=null;

const $=id=>document.getElementById(id);
function visible(el){
  if(!el)return false;
  const cs=getComputedStyle(el);
  return !el.classList.contains('hidden')&&cs.display!=='none'&&cs.visibility!=='hidden';
}
function setText(el,text){if(el&&el.textContent!==text)el.textContent=text}
function setAction(el,action){if(el&&el.dataset.tbmGlobalPdfAction!==action)el.dataset.tbmGlobalPdfAction=action}
function setClass(el,className){if(el&&el.className!==className)el.className=className}

function activeContext(){
  const pt=$('ptAlturaOverlay');
  if(visible(pt)&&typeof window.makePTAlturaPdf==='function'){
    return {
      name:'PT - Trabalho em Altura',
      save:()=>typeof window.savePTAltura==='function'?window.savePTAltura(false,false):true,
      generate:action=>window.makePTAlturaPdf(action)
    };
  }
  if(typeof window.makePdf==='function'){
    let x=null;try{x=typeof state!=='undefined'?state:window.state}catch(_){x=window.state}
    return {
      name:x?.title||x?.type||'Inspeção SST',
      save:()=>typeof window.saveInspection==='function'?window.saveInspection(true):true,
      generate:action=>window.makePdf(action)
    };
  }
  return null;
}

function toast(text,type='ok'){
  if(typeof window.tbmToast==='function'){window.tbmToast(text,type);return}
  let el=$('tbm-global-preview-toast');
  if(!el){
    el=document.createElement('div');el.id='tbm-global-preview-toast';
    Object.assign(el.style,{position:'fixed',left:'50%',bottom:'22px',transform:'translateX(-50%)',zIndex:'100000',maxWidth:'calc(100vw - 28px)',padding:'12px 16px',borderRadius:'12px',font:'700 13px Arial,sans-serif',boxShadow:'0 10px 30px #0004',textAlign:'center'});
    document.body.appendChild(el);
  }
  el.style.background=type==='err'?'#991b1b':type==='warn'?'#92400e':'#166534';
  el.style.color='#fff';
  if(el.textContent!==text)el.textContent=text;
  el.style.opacity='1';
  clearTimeout(el.__timer);el.__timer=setTimeout(()=>{el.style.opacity='0'},2800);
}
function setBusy(on){
  busy=on;
  [...PREVIEW_IDS,...DOWNLOAD_IDS,...SHARE_IDS].forEach(id=>{const b=$(id);if(b)b.disabled=on});
}
function fakePdfHandle(){
  return {
    download(){},open(){},print(){},
    getBlob(cb){if(typeof cb==='function')cb(new Blob([],{type:'application/pdf'}))},
    getBuffer(cb){if(typeof cb==='function')cb(new Uint8Array())},
    getBase64(cb){if(typeof cb==='function')cb('')},
    getDataUrl(cb){if(typeof cb==='function')cb('data:application/pdf;base64,')}
  };
}

async function captureActiveDocDefinition(){
  const ctx=activeContext();
  if(!ctx)throw new Error('Nenhum módulo de inspeção ativo foi identificado.');
  if(!window.pdfMake||typeof window.pdfMake.createPdf!=='function')throw new Error('Biblioteca pdfmake indisponível.');
  if(typeof window.carregarLogo==='function')await window.carregarLogo(window.LOGO_TBM_URL);
  const pm=window.pdfMake;
  const originalCreatePdf=pm.createPdf;
  const previousBypass=window.__tbmPdfSummaryBypass;
  window.__tbmPdfSummaryBypass=true;
  return await new Promise((resolve,reject)=>{
    let done=false;let timer=null;
    const restore=()=>{
      if(pm.createPdf===intercept)pm.createPdf=originalCreatePdf;
      window.__tbmPdfSummaryBypass=previousBypass;
    };
    const finish=(fn,value)=>{
      if(done)return;done=true;clearTimeout(timer);restore();fn(value);
    };
    function intercept(docDefinition){
      finish(resolve,{docDefinition,createPdf:originalCreatePdf,pdfMake:pm,context:ctx});
      return fakePdfHandle();
    }
    pm.createPdf=intercept;
    timer=setTimeout(()=>finish(reject,new Error('Tempo esgotado ao montar o PDF para visualização.')),30000);
    try{
      Promise.resolve(ctx.generate('download')).then(()=>{
        if(!done)setTimeout(()=>{if(!done)finish(reject,new Error('O gerador ativo não produziu um docDefinition.'))},50);
      }).catch(err=>finish(reject,err));
    }catch(err){finish(reject,err)}
  });
}

function pdfBlob(captured){
  return new Promise((resolve,reject)=>{
    try{
      const pdf=captured.createPdf.call(captured.pdfMake,captured.docDefinition);
      if(!pdf||typeof pdf.getBlob!=='function')return reject(new Error('Não foi possível gerar o arquivo para visualização.'));
      let settled=false;
      const timer=setTimeout(()=>{if(!settled){settled=true;reject(new Error('Tempo esgotado ao gerar o preview.'))}},30000);
      pdf.getBlob(blob=>{
        if(settled)return;settled=true;clearTimeout(timer);
        if(blob&&blob.size!==0)resolve(blob);else reject(new Error('PDF vazio ou inválido.'));
      });
    }catch(err){reject(err)}
  });
}

function activeFilename(ctx){
  try{if(typeof window.gerarNomeArquivoPdf==='function'){const n=window.gerarNomeArquivoPdf();if(n)return n}}catch(_){}
  let st=null;try{st=typeof state!=='undefined'?state:window.state}catch(_){st=window.state}
  const id=String(st?.id||Date.now()).replace(/[^a-zA-Z0-9._-]+/g,'_');
  const prefix=String(ctx?.name||'Relatorio_SST').replace(/[^a-zA-Z0-9À-ÿ._-]+/g,'_').replace(/^_+|_+$/g,'')||'Relatorio_SST';
  return prefix+'_'+id+'.pdf';
}
function downloadBlob(blob,filename){
  const url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download=filename||'Relatorio_SST.pdf';document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),60000);
}
function closePreview(){
  const old=$('tbmPdfPreviewOverlay');if(!old)return;
  const url=old.dataset.blobUrl;if(url)try{URL.revokeObjectURL(url)}catch(_){}
  old.remove();
}
let pdfJsLoadPromise=null;
function loadPdfJs(){
  if(window.pdfjsLib?.getDocument)return Promise.resolve(window.pdfjsLib);
  if(pdfJsLoadPromise)return pdfJsLoadPromise;
  pdfJsLoadPromise=new Promise((resolve,reject)=>{
    const done=()=>{
      if(!window.pdfjsLib?.getDocument)return reject(new Error('Visualizador de PDF não carregou.'));
      window.pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      resolve(window.pdfjsLib);
    };
    const existing=document.getElementById('tbm-pdfjs-lib');
    if(existing){
      if(window.pdfjsLib?.getDocument)return done();
      existing.addEventListener('load',done,{once:true});
      existing.addEventListener('error',()=>reject(new Error('Falha ao carregar o visualizador de PDF.')),{once:true});
      return;
    }
    const script=document.createElement('script');
    script.id='tbm-pdfjs-lib';
    script.src='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.async=true;script.crossOrigin='anonymous';
    script.onload=done;
    script.onerror=()=>reject(new Error('Falha ao carregar o visualizador de PDF.'));
    document.head.appendChild(script);
  }).catch(err=>{pdfJsLoadPromise=null;throw err});
  return pdfJsLoadPromise;
}
async function renderPdfPages(blob,viewer){
  const pdfjs=await loadPdfJs();
  const bytes=await blob.arrayBuffer();
  const pdf=await pdfjs.getDocument({data:bytes}).promise;
  viewer.innerHTML='';
  const available=Math.max(280,Math.min(980,(viewer.clientWidth||window.innerWidth)-24));
  const pixelRatio=Math.min(window.devicePixelRatio||1,1.6);
  for(let pageNo=1;pageNo<=pdf.numPages;pageNo++){
    if(!viewer.isConnected)return;
    const page=await pdf.getPage(pageNo);
    const base=page.getViewport({scale:1});
    const cssScale=Math.min(1.65,available/base.width);
    const renderScale=cssScale*pixelRatio;
    const viewport=page.getViewport({scale:renderScale});
    const canvas=document.createElement('canvas');
    canvas.width=Math.max(1,Math.floor(viewport.width));
    canvas.height=Math.max(1,Math.floor(viewport.height));
    canvas.style.width=Math.floor(viewport.width/pixelRatio)+'px';
    canvas.style.height='auto';
    canvas.style.maxWidth='100%';
    canvas.style.display='block';
    canvas.style.margin='0 auto 12px';
    canvas.style.background='#fff';
    canvas.style.boxShadow='0 2px 12px #0003';
    canvas.style.borderRadius='4px';
    viewer.appendChild(canvas);
    await page.render({canvasContext:canvas.getContext('2d',{alpha:false}),viewport}).promise;
  }
}
function showPreview(blob,filename,title){
  closePreview();
  const url=URL.createObjectURL(blob),root=document.createElement('div');
  root.id='tbmPdfPreviewOverlay';root.dataset.blobUrl=url;
  Object.assign(root.style,{position:'fixed',inset:'0',zIndex:'1000000',background:'#071018f4',display:'flex',flexDirection:'column',padding:'10px'});
  root.innerHTML='<div style="max-width:1180px;width:100%;height:100%;margin:auto;display:flex;flex-direction:column;min-height:0"><div style="background:#fff;color:#17202b;padding:10px;border-radius:14px 14px 0 0;display:flex;gap:8px;align-items:center;flex-wrap:wrap"><b style="flex:1;min-width:160px">'+String(title||'Relatório SST').replace(/[&<>"]/g,'')+'</b><button type="button" id="tbmPreviewDownload" class="btn primary">📥 Baixar PDF</button><button type="button" id="tbmPreviewShare" class="btn blue">📲 Compartilhar</button><button type="button" id="tbmPreviewClose" class="btn secondary">✕ Fechar</button></div><div id="tbmPdfCanvasViewer" role="document" aria-label="Visualização do PDF" style="width:100%;flex:1;min-height:0;overflow:auto;background:#2b2d31;padding:12px;border-radius:0 0 14px 14px;-webkit-overflow-scrolling:touch"><div id="tbmPdfPreviewLoading" style="color:#fff;text-align:center;padding:34px 12px;font-weight:800">⏳ Carregando páginas do PDF...</div></div></div>';
  document.body.appendChild(root);
  $('tbmPreviewClose').onclick=closePreview;
  $('tbmPreviewDownload').onclick=()=>downloadBlob(blob,filename);
  $('tbmPreviewShare').onclick=()=>shareBlob(blob,filename,title);
  const viewer=$('tbmPdfCanvasViewer');
  renderPdfPages(blob,viewer).catch(err=>{
    console.error('[PDF CANVAS PREVIEW]',err);
    if(!viewer?.isConnected)return;
    viewer.innerHTML='<div style="max-width:560px;margin:40px auto;background:#fff;color:#17202b;border-radius:14px;padding:18px;text-align:center"><b>Não foi possível mostrar as páginas aqui.</b><p style="font-size:13px;color:#64748b">O PDF foi gerado normalmente. Toque abaixo para abrir no visualizador do aparelho.</p><button type="button" id="tbmPreviewExternalOpen" class="btn primary">📄 Abrir PDF</button></div>';
    const open=$('tbmPreviewExternalOpen');
    if(open)open.onclick=()=>{
      const w=window.open(url,'_blank');
      if(!w)downloadBlob(blob,filename);
    };
  });
}
async function shareBlob(blob,filename,title){
  const file=new File([blob],filename||'Relatorio_SST.pdf',{type:'application/pdf'});
  try{
    if(navigator.share&&(!navigator.canShare||navigator.canShare({files:[file]}))){
      await navigator.share({title:title||'Relatório SST',text:title||'Relatório SST',files:[file]});return true;
    }
  }catch(err){
    if(err?.name==='AbortError')return false;
    console.warn('[GLOBAL PDF SHARE]',err);
  }
  downloadBlob(blob,filename);
  toast('ℹ️ Compartilhamento de arquivo não disponível neste navegador. O PDF foi baixado.','warn');
  return false;
}
async function generateActiveBlob(){
  const captured=await captureActiveDocDefinition();
  const blob=await pdfBlob(captured);
  return {blob,filename:activeFilename(captured.context),title:captured.context?.name||'Relatório SST',captured};
}
async function previewActive(){
  if(busy)return;
  setBusy(true);toast('👁️ Preparando visualização do PDF...','ok');
  try{
    const out=await generateActiveBlob();
    showPreview(out.blob,out.filename,out.title);
    toast('✅ PDF pronto para visualização.','ok');
  }catch(err){
    console.error('[GLOBAL PDF PREVIEW]',err);
    toast('❌ '+(err?.message||'Não foi possível visualizar o PDF.'),'err');
  }finally{setBusy(false)}
}
async function runAction(action){
  if(busy)return;
  const ctx=activeContext();if(!ctx)return toast('❌ Nenhuma inspeção ativa.','err');
  setBusy(true);
  try{
    const out=await generateActiveBlob();
    if(action==='download'){downloadBlob(out.blob,out.filename);toast('✅ PDF baixado.','ok');return}
    if(action==='share'){await shareBlob(out.blob,out.filename,out.title);return}
  }catch(err){
    console.error('[GLOBAL PDF ACTION]',err);
    toast('❌ '+(err?.message||'Falha ao gerar o PDF.'),'err');
  }finally{setBusy(false)}
}
window.tbmGenerateActivePdfBlob=generateActiveBlob;
window.tbmShowPdfPreview=showPreview;
window.tbmDownloadPdfBlob=downloadBlob;
window.tbmSharePdfBlob=shareBlob;

function button(id,label,cls,action){
  const b=document.createElement('button');b.type='button';b.id=id;b.className='btn '+cls;b.textContent=label;b.dataset.tbmGlobalPdfAction=action;return b;
}
function normalizeGenericActions(){
  const save=$('save'),legacy=$('pdf');if(!save||!legacy)return;
  const card=save.closest('.card');if(!card)return;
  let row=card.querySelector(':scope > .actions');
  if(!row){
    row=document.createElement('div');row.className='actions';card.insertBefore(row,card.firstChild);row.appendChild(save);row.appendChild(legacy);
  }
  save.classList.remove('full');legacy.classList.remove('full');
  setText(save,'💾 Salvar');
  setText(legacy,'📲 Compartilhar');setClass(legacy,'btn blue');setAction(legacy,'share');
  let preview=$('tbmGlobalPreview');
  if(!preview){preview=button('tbmGlobalPreview','👁️ Visualizar PDF','secondary','preview');row.insertBefore(preview,legacy)}
  let download=$('tbmGlobalDownload');
  if(!download){download=button('tbmGlobalDownload','📥 Baixar PDF','primary','download');row.insertBefore(download,legacy)}
}
function normalizePTActions(){
  const row=document.querySelector('#ptAlturaBody .pt-actions');if(!row)return;
  const save=$('ptSave'),download=$('ptPdf'),share=$('ptShare');
  setText(save,'💾 Salvar');
  if(download){setText(download,'📥 Baixar PDF');setAction(download,'download')}
  if(share){setText(share,'📲 Compartilhar');setAction(share,'share')}
  let preview=$('ptView');
  if(!preview){preview=button('ptView','👁️ Visualizar PDF','secondary','preview');row.insertBefore(preview,download||share||null)}
  else{setText(preview,'👁️ Visualizar PDF');setAction(preview,'preview')}
}
function normalizeTrainingActions(){
  const row=$('trainingAttendanceActions')?.querySelector('.actions');if(!row)return;
  const map=[['trainingSave','💾 Salvar',null],['trainingPreview','👁️ Visualizar PDF','preview'],['trainingDownload','📥 Baixar PDF','download'],['trainingShare','📲 Compartilhar','share']];
  map.forEach(([id,label,action])=>{const b=$(id);if(!b)return;setText(b,label);if(action)setAction(b,action)});
}
function normalizeReportActions(){
  const row=document.querySelector('#report .actions');if(!row)return;
  const download=$('reportPdf'),share=$('reportShare');
  if(download){setText(download,'📥 Baixar PDF');setAction(download,'download')}
  if(share){setText(share,'📲 Compartilhar');setAction(share,'share')}
  let preview=$('tbmReportPreview');
  if(!preview){preview=button('tbmReportPreview','👁️ Visualizar PDF','secondary','preview');row.insertBefore(preview,download||share||null)}
}
function ensureActions(){
  try{normalizeGenericActions();normalizePTActions();normalizeTrainingActions();normalizeReportActions()}catch(err){console.warn('[GLOBAL PDF UI]',err)}
}
function queueEnsureActions(delay=0){
  clearTimeout(actionRefreshTimer);
  actionRefreshTimer=setTimeout(ensureActions,delay);
}
function captureClick(e){
  const b=e.target?.closest?.('[data-tbm-global-pdf-action]');if(!b)return;
  e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
  const action=b.dataset.tbmGlobalPdfAction;
  if(action==='preview')previewActive();else if(action==='download'||action==='share')runAction(action);
}
function install(){
  ensureActions();
  document.addEventListener('click',captureClick,true);
  document.addEventListener('click',()=>queueEnsureActions(0),false);
  window.addEventListener('sst-modules-loaded',()=>queueEnsureActions(0));
  window.addEventListener('tbm-nr24-ready',()=>queueEnsureActions(0));
  [250,700,1400,2500].forEach(ms=>setTimeout(ensureActions,ms));
  window.tbmRefreshGlobalPdfActions=ensureActions;
  window.tbmPreviewActiveInspection=previewActive;
  window.__tbmGlobalPdfPreviewVersion=VERSION;
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
