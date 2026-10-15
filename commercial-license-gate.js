(()=>{
'use strict';
const $=id=>document.getElementById(id);
function ensureStyle(){
  if($('sstLicenseStyle'))return;
  const s=document.createElement('style');s.id='sstLicenseStyle';s.textContent=`
#sstLicenseGate{position:fixed;inset:0;z-index:999998;background:linear-gradient(145deg,#0f172aeF,#075985ef);display:flex;align-items:center;justify-content:center;padding:18px}
#sstLicenseGate.hidden{display:none!important}.slg-card{width:min(520px,100%);background:#fff;border-radius:24px;padding:24px;box-shadow:0 28px 90px #0008;text-align:center}.slg-card h2{margin:0 0 8px}.slg-card p{color:#64748b;line-height:1.5}.slg-pill{display:inline-flex;padding:7px 11px;border-radius:999px;background:#fee2e2;color:#991b1b;font-size:11px;font-weight:900;margin-bottom:12px}.slg-btn{width:100%;border:0;border-radius:11px;padding:13px;font-weight:900;margin-top:8px;cursor:pointer}.slg-primary{background:#0f766e;color:#fff}.slg-secondary{background:#e2e8f0;color:#17202b}
`;document.head.appendChild(s);
}
function daysLeft(v){if(!v)return 0;return Math.max(0,Math.ceil((new Date(v)-new Date())/86400000))}
function show(ctx){
  ensureStyle();let root=$('sstLicenseGate');if(root)root.remove();
  const l=ctx?.license||{},company=ctx?.company;
  if(!company)return;
  const active=window.SSTCommercialCloud?.activeLicense?.(l);
  if(active){
    if(['trial','demo'].includes(l.status)){
      let badge=$('sstTrialBadge');
      if(!badge){badge=document.createElement('div');badge.id='sstTrialBadge';badge.style.cssText='position:fixed;right:12px;bottom:12px;z-index:5000;background:#fef3c7;color:#92400e;border:1px solid #fde68a;padding:8px 10px;border-radius:999px;font:900 11px Arial;box-shadow:0 8px 24px #0002';document.body.appendChild(badge)}
      badge.textContent='TESTE • '+daysLeft(l.trial_ends_at)+' dia(s) restante(s)';
    }
    return;
  }
  root=document.createElement('div');root.id='sstLicenseGate';
  const status=l.status||'expired';
  root.innerHTML='<div class="slg-card"><div class="slg-pill">'+String(status).toUpperCase()+'</div><h2>Acesso temporariamente indisponível</h2><p>O período de demonstração ou a licença desta empresa terminou. Seus dados continuam guardados com segurança e voltarão a aparecer assim que o acesso for liberado pelo administrador.</p><button id="slgRefresh" class="slg-btn slg-primary">Verificar liberação novamente</button><button id="slgLogout" class="slg-btn slg-secondary">Sair da conta</button></div>';
  document.body.appendChild(root);
  $('slgRefresh').onclick=async()=>{const c=await window.SSTCommercialCloud.loadContext();root.remove();show(c)};
  $('slgLogout').onclick=async()=>{await window.SSTCommercialCloud.signOut();location.reload()};
}
document.addEventListener('sst-commercial-context',e=>show(e.detail));
document.addEventListener('sst-commercial-ready',e=>show(e.detail));
window.SSTLicenseGate={show};
})();