/* Instalação PWA do SST Comercial. Escopo restrito ao diretório deste app.
   Nunca desinstale Service Workers nem limpe dados locais ao abrir a página. */
(()=>{
'use strict';
if(window.__SSTComercialInstallV1)return;
window.__SSTComercialInstallV1=true;
let promptEvent=null;
const $=id=>document.getElementById(id);
const standalone=()=>window.matchMedia?.('(display-mode: standalone)')?.matches||navigator.standalone===true;
function android(){return /android/i.test(navigator.userAgent||'')}
function ios(){return /iphone|ipad|ipod/i.test(navigator.userAgent||'')}
function supportedContext(){return location.protocol==='https:'||location.hostname==='localhost'}
function label(){
 if(promptEvent)return'📲 Instalar aplicativo';
 if(ios())return'📲 Instalar no iPhone';
 return'📲 Instalar no celular';
}
function showTip(){
 let tip=$('sstCommercialInstallHelp');
 if(!tip){
  tip=document.createElement('aside');tip.id='sstCommercialInstallHelp';tip.setAttribute('role','dialog');
  tip.setAttribute('aria-label','Como instalar o aplicativo SST');
  tip.style.cssText='position:fixed;z-index:99999;bottom:78px;left:12px;right:12px;max-width:460px;margin:auto;background:#fff;border:2px solid #0f766e;box-shadow:0 15px 42px #0f172a40;border-radius:15px;padding:18px;color:#17202b;font:14px/1.55 Arial,sans-serif';
  document.body.appendChild(tip);
 }
 let copy='';
 if(ios())copy='No Safari, toque em <b>Compartilhar</b> (quadrado com seta) e depois em <b>Adicionar à Tela de Início</b>.';
 else if(android())copy='Abra este endereço no <b>Google Chrome</b>, toque no menu <b>⋮</b> e escolha <b>Instalar aplicativo</b> ou <b>Adicionar à tela inicial</b>.';
 else copy='No navegador, abra o menu e escolha <b>Instalar aplicativo</b> ou <b>Adicionar à tela inicial</b>, quando disponível.';
 tip.innerHTML='<b style="font-size:17px;display:block;margin-bottom:8px">📱 Instalar SST Comercial</b><p style="margin:0 0 12px">'+copy+'</p><p style="margin:0 0 12px;color:#64748b;font-size:12px">Depois da instalação, o sistema abre como aplicativo. Para acessar dados e sincronizar com a nuvem, é necessário conectar-se à internet e fazer login.</p><button type="button" id="sstCommercialInstallClose" style="padding:9px 15px;color:#fff;background:#8b1018;border:0;border-radius:8px;font-weight:800">Entendi</button>';
 $('sstCommercialInstallClose').onclick=()=>tip.remove();
}
async function clickInstall(){
 if(standalone()){refreshButtons();return}
 if(!supportedContext()){showTip();return}
 if(promptEvent){
  const request=promptEvent;promptEvent=null;
  try{
   await request.prompt();
   const choice=await request.userChoice;
   if(choice?.outcome==='accepted'){refreshButtons();return}
  }catch(err){console.warn('[SST COMERCIAL PWA]',err)}
 }
 showTip();
}
function refreshButtons(){
 const installed=standalone();
 document.querySelectorAll('[data-sst-install]').forEach(btn=>{
  btn.hidden=installed;
  btn.style.display=installed?'none':'block';
  btn.textContent=label();
  btn.disabled=false;
 });
}
function mount(){
 if(!document.body)return;
 const login=!!$('loginBtn');
 const target=login?$('msg'):(document.querySelector('#home .tiles')||document.querySelector('.topin')||document.body);
 if(!target)return;
 let btn=$('sstCommercialInstallButton');
 if(!btn){
  btn=document.createElement('button');btn.type='button';btn.id='sstCommercialInstallButton';
  btn.setAttribute('data-sst-install','true');btn.setAttribute('aria-label','Instalar o SST Comercial como aplicativo no celular');
  btn.textContent=label();
  btn.style.cssText=login?
   'display:block;width:100%;margin:12px 0;padding:13px 15px;border:2px solid #0f766e;border-radius:12px;background:#ecfdf5;color:#065f46;font:800 14px Arial,sans-serif;cursor:pointer':
   'position:fixed;z-index:900;right:14px;bottom:16px;padding:13px 18px;border:2px solid #ffffff;border-radius:24px;background:#047857;color:#fff;box-shadow:0 8px 26px #0f172a40;font:800 13px Arial,sans-serif;cursor:pointer;max-width:200px';
  btn.onclick=clickInstall;
  if(login)target.parentNode.insertBefore(btn,target);
  else target.appendChild(btn);
 }
 refreshButtons();
}
async function register(){
 if(!supportedContext()||!('serviceWorker' in navigator))return;
 try{
  const script=new URL('./service-worker.js',document.baseURI);
  const scope=new URL('./',document.baseURI).pathname;
  await navigator.serviceWorker.register(script.href,{scope,updateViaCache:'none'});
 }catch(e){console.warn('[SST COMERCIAL SERVICE WORKER]',e)}
}
window.addEventListener('beforeinstallprompt',event=>{
 event.preventDefault();promptEvent=event;
 mount();refreshButtons();
});
window.addEventListener('appinstalled',()=>{
 promptEvent=null;refreshButtons();
 const help=$('sstCommercialInstallHelp');if(help)help.remove();
});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});
else mount();
window.addEventListener('load',register,{once:true});
window.SSTComercialInstall={open:clickInstall,isInstalled:standalone};
})();