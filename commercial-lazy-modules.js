(()=>{
'use strict';
if(window.__sstCommercialLazyModulesV1)return;
window.__sstCommercialLazyModulesV1=true;

const loaded=new Map();
function script(src){
  if(loaded.has(src))return loaded.get(src);
  const p=new Promise((resolve,reject)=>{
    const absolute=/^https?:\/\//i.test(src);
    const existing=[...document.scripts].find(s=>s.src&&(absolute?s.src===src:s.src.includes('/'+src)));
    if(existing){
      if(existing.dataset.lazyReady==='1')return resolve(true);
      existing.addEventListener('load',()=>resolve(true),{once:true});
      existing.addEventListener('error',()=>reject(new Error('Falha ao carregar '+src)),{once:true});
      return;
    }
    const s=document.createElement('script');
    s.src=absolute?src:('./'+src+'?lazy=1&v=20261015-cipafix02');
    s.async=true;
    s.onload=()=>{s.dataset.lazyReady='1';resolve(true)};
    s.onerror=()=>reject(new Error('Falha ao carregar '+src));
    document.body.appendChild(s);
  });
  loaded.set(src,p);
  return p;
}
function tiles(){return document.querySelector('#home .tiles')}
function make(id,cls,icon,title,sub,onClick){
  if(document.getElementById(id))return;
  const host=tiles();if(!host)return;
  const b=document.createElement('button');
  b.id=id;b.type='button';b.className='tile '+cls;
  b.innerHTML='<div class="ico">'+icon+'</div><div><b>'+title+'</b><span>'+sub+'</span></div>';
  b.addEventListener('click',async e=>{
    e.preventDefault();e.stopPropagation();
    if(b.dataset.loading==='1')return;
    b.dataset.loading='1';
    const old=b.innerHTML;
    b.innerHTML='<div class="ico">⏳</div><div><b>Abrindo...</b><span>'+title+'</span></div>';
    try{await onClick()}
    catch(err){
      console.error('[SST LAZY]',title,err);
      alert('Não foi possível abrir '+title+'. Tente novamente.');
    }finally{
      b.dataset.loading='0';
      if(document.body.contains(b))b.innerHTML=old;
    }
  },{passive:false});
  host.appendChild(b);
}
async function loadAndClick(src,generatedId){
  await script(src);
  await new Promise(r=>setTimeout(r,20));
  const target=document.getElementById(generatedId);
  if(!target)throw new Error('Botão do módulo não encontrado: '+generatedId);
  target.click();
}
async function openCipa(){
  await script('cipa-management-module.js');
  await new Promise(r=>setTimeout(r,20));
  const t=document.getElementById('cgTile');
  if(!t)throw new Error('Gestão CIPA não inicializou');
  t.click();
}
async function openCipaPanel(){
  await script('cipa-management-module.js');
  await new Promise(r=>setTimeout(r,20));
  const t=document.getElementById('cgPanelTile');
  if(!t)throw new Error('Painel CIPA não inicializou');
  t.click();
}
async function openAta(){return loadAndClick('cipa-ata-module.js','tbmCipaTile')}
async function openBrig(){
  await script('brigadistas-control-module.js');
  await new Promise(r=>setTimeout(r,20));
  if(typeof window.openBrigadistasControl==='function')return window.openBrigadistasControl();
  return loadAndClick('brigadistas-control-module.js','tbmBrigTile');
}
async function openExt(){
  await script('extintores-control-module.js');
  await new Promise(r=>setTimeout(r,20));
  if(typeof window.openExtinguisherControl==='function')return window.openExtinguisherControl();
  return loadAndClick('extintores-control-module.js','tbmExtTile');
}
async function openSecurity(){return loadAndClick('system-safety-module.js','tbmSystemSecurityTile')}
async function openEmployees(){
  await script('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js');
  await script('commercial-employees.js');
  await new Promise(r=>setTimeout(r,20));
  if(typeof window.SSTEmployees?.open==='function')return window.SSTEmployees.open();
  const b=document.getElementById('seOpenEmployees');if(b)return b.click();
  throw new Error('Funcionários não inicializou');
}
async function openPT(){
  await script('pt-altura.js');
  script('pt-contrast-fix.js').catch(()=>{});
  script('pt-share-preview-fix.js').catch(()=>{});
  await new Promise(r=>setTimeout(r,20));
  if(typeof window.openPTAltura==='function')return window.openPTAltura();
  throw new Error('PT não inicializou');
}
function ensureWordActivation(){
  if(document.getElementById('lazyWordAttachments'))return;
  const photo=document.getElementById('photoInput')?.closest('.card');
  if(!photo)return;
  const b=document.createElement('button');
  b.id='lazyWordAttachments';
  b.type='button';
  b.className='btn secondary full no-print';
  b.textContent='📎 Ativar anexos Word';
  b.onclick=async()=>{
    if(b.disabled)return;
    b.disabled=true;b.textContent='⏳ Carregando anexos...';
    try{
      await script('commercial-word-attachments.js');
      b.remove();
    }catch(e){
      b.disabled=false;b.textContent='📎 Ativar anexos Word';
      alert('Não foi possível carregar os anexos Word.');
    }
  };
  photo.appendChild(b);
}
function install(){
  make('lazyCipa','general','🗳️','Gestão CIPA – NR-5','Eleição, atas, calendário e PDFs',openCipa);
  make('lazyCipaPanel','general','📸','Painel de Candidatos – CIPA','Fotos e PDF para mural',openCipaPanel);
  make('lazyCipaAta','general','📝','Ata da CIPA','Reunião mensal ou extraordinária',openAta);
  make('lazyBrig','general','🚨','Brigadistas','Cadastro, treinamentos e presença',openBrig);
  make('lazyExt','fire','🧯','Controle de Extintores','Recargas, vencimentos e testes',openExt);
  make('lazyPT','machine','🪜','Permissão de Trabalho (PT)','NR 35 • Escadas, Andaimes e PTA',openPT);
  make('lazySecurity','safety','🛡️','Segurança do Sistema','Backup, alterações e sincronização',openSecurity);
  make('lazyEmployees','general','👥','Funcionários','Cadastro e importação da equipe',openEmployees);
  ensureWordActivation();
  window.__sstCommercialLazyReady=true;
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
setTimeout(install,400);
document.addEventListener('click',e=>{
  if(e.target.closest?.('#home .tile[data-type]'))setTimeout(ensureWordActivation,120);
},{passive:true});
})();