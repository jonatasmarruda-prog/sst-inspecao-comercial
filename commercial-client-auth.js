(()=>{
'use strict';

const $=(s,r=document)=>r.querySelector(s);
let authSubscription=null;
let loading=false;
let authenticated=false;

function css(){
  if($('#sstClientAuthStyle'))return;
  const s=document.createElement('style');
  s.id='sstClientAuthStyle';
  s.textContent=`
  #sstClientAuth{position:fixed;inset:0;z-index:999999;background:linear-gradient(145deg,#0f172a,#7f1d1d);display:flex;align-items:center;justify-content:center;padding:18px}
  #sstClientAuth.hidden{display:none!important}
  .sca{width:min(440px,100%);background:#fff;border-radius:22px;padding:24px;box-shadow:0 30px 90px #0008;text-align:center}
  .sca h2{margin:0 0 6px;color:#17202b}.sca p{margin:0 0 16px;color:#64748b;line-height:1.45}
  .sca .spin{width:34px;height:34px;border:4px solid #e2e8f0;border-top-color:#8b1018;border-radius:50%;margin:16px auto;animation:scaspin .8s linear infinite}
  .sca button{width:100%;border:0;border-radius:10px;padding:12px;font-weight:900;margin-top:10px;cursor:pointer}
  .sca .p{background:#8b1018;color:#fff}.sca .s{background:#e2e8f0;color:#17202b}
  .sca .msg{font-size:12px;margin-top:10px;line-height:1.45;min-height:18px;color:#334155}
  .sca .err{color:#991b1b}
  .sca .lock{display:inline-flex;align-items:center;gap:6px;padding:6px 9px;border-radius:999px;background:#f1f5f9;color:#475569;font-size:10px;font-weight:900;margin-bottom:10px}
  #scaLogoutHeader{margin-left:8px;padding:8px 10px;border-radius:9px;background:#fff2;color:#fff;border:1px solid #ffffff55;font-weight:900;font-size:11px}
  @keyframes scaspin{to{transform:rotate(360deg)}}
  `;
  document.head.appendChild(s);
}
function gate(){
  css();
  let root=$('#sstClientAuth');
  if(root)return root;
  root=document.createElement('div');
  root.id='sstClientAuth';
  root.innerHTML=`<div class="sca">
    <div class="lock">🔒 ACESSO CONTROLADO</div>
    <h2>Sistema de Gestão SST</h2>
    <div class="spin" id="scaSpin"></div>
    <p id="scaText">Carregando seu acesso...</p>
    <div id="scaMsg" class="msg"></div>
    <button id="scaRetry" class="p hidden" type="button">Tentar novamente</button>
    <button id="scaBack" class="s hidden" type="button">Voltar ao Login</button>
  </div>`;
  document.body.appendChild(root);
  $('#scaRetry',root).onclick=()=>ready(true);
  $('#scaBack',root).onclick=async()=>{
    try{await window.SSTCommercialCloud?.signOut?.()}catch{}
    location.replace('./');
  };
  return root;
}
function state(text,msg='',error=false){
  const r=gate();
  $('#scaText',r).textContent=text||'';
  $('#scaMsg',r).textContent=msg||'';
  $('#scaMsg',r).className='msg'+(error?' err':'');
}
function withTimeout(promise,ms,label){
  return Promise.race([
    promise,
    new Promise((_,reject)=>setTimeout(()=>reject(new Error(label||'Tempo de carregamento excedido.')),ms))
  ]);
}
function waitForInitialSession(client,ms=8000){
  return new Promise((resolve,reject)=>{
    let finished=false;
    let subscription=null;
    const timer=setTimeout(()=>{
      if(finished)return;
      finished=true;
      try{subscription?.unsubscribe?.()}catch{}
      reject(new Error('Não foi possível carregar a sessão neste navegador.'));
    },ms);

    const result=client.auth.onAuthStateChange((event,session)=>{
      if(finished)return;
      if(event==='INITIAL_SESSION'||event==='SIGNED_IN'||event==='TOKEN_REFRESHED'){
        finished=true;
        clearTimeout(timer);
        setTimeout(()=>{try{subscription?.unsubscribe?.()}catch{}},0);
        resolve(session||null);
      }else if(event==='SIGNED_OUT'){
        finished=true;
        clearTimeout(timer);
        setTimeout(()=>{try{subscription?.unsubscribe?.()}catch{}},0);
        resolve(null);
      }
    });
    subscription=result?.data?.subscription||null;
  });
}
function showError(message){
  const r=gate();
  $('#scaSpin',r).classList.add('hidden');
  $('#scaRetry',r).classList.remove('hidden');
  $('#scaBack',r).classList.remove('hidden');
  state('Não foi possível concluir o carregamento.',message||'Tente novamente.',true);
}
function showLoading(text='Carregando seu acesso...'){
  if(authenticated)return;
  const r=gate();
  r.classList.remove('hidden');
  $('#scaSpin',r).classList.remove('hidden');
  $('#scaRetry',r).classList.add('hidden');
  $('#scaBack',r).classList.add('hidden');
  state(text,'');
}
function installHeaderLogout(){
  const top=$('.topin');
  if(!top)return;
  let b=$('#scaLogoutHeader');
  if(!b){
    b=document.createElement('button');
    b.id='scaLogoutHeader';
    b.type='button';
    b.textContent='Sair';
    b.onclick=async()=>{
      try{b.disabled=true;await window.SSTCommercialCloud?.signOut?.()}catch{}
      location.replace('./');
    };
    top.appendChild(b);
  }
}
async function ready(force=false){
  if(authenticated)return;
  if(loading&&!force)return;
  loading=true;
  showLoading('Verificando seu acesso...');
  const api=window.SSTCommercialCloud;
  if(!api?.configured){
    loading=false;
    showError('Serviço de acesso indisponível. Volte ao Login e tente novamente.');
    return;
  }
  try{
    let directToken=api.getRuntimeAccessToken?.()||'';

    // Se veio da tela de Login, usa imediatamente o token emitido.
    // Nenhuma espera por localStorage/getSession é necessária.
    if(!directToken){
      const session=await waitForInitialSession(api.authSb,8000);
      if(session?.access_token){
        api.setRuntimeTokens?.(session.access_token,session.refresh_token||'');
        directToken=session.access_token;
      }
    }

    if(!directToken){
      location.replace('./?v=directopen01');
      return;
    }

    showLoading('Carregando sua empresa...');
    const ctx=await withTimeout(api.loadContext(),10000,'Demorou demais para carregar os dados da empresa.');
    if(!ctx?.user||!ctx?.company)throw new Error('Conta sem empresa vinculada ou acesso indisponível.');

    // A partir daqui o acesso principal já está validado.
    // Libera a interface imediatamente; tarefas complementares não podem bloquear o usuário.
    authenticated=true;
    installHeaderLogout();
    gate().classList.add('hidden');
    document.documentElement.dataset.sstAuthenticated='true';
    document.dispatchEvent(new CustomEvent('sst-client-authenticated',{detail:ctx}));

    Promise.resolve()
      .then(()=>withTimeout(api.installCompatibility(),8000,'Preparação complementar excedeu o tempo.'))
      .catch(e=>console.warn('[SST PREPARAÇÃO COMPLEMENTAR]',e));

    // Restaura/renova a sessão Auth em segundo plano, sem bloquear a abertura.
    const refreshToken=api.getRuntimeRefreshToken?.()||'';
    const accessToken=api.getRuntimeAccessToken?.()||'';
    if(accessToken&&refreshToken){
      Promise.resolve()
        .then(()=>withTimeout(
          api.authSb.auth.setSession({access_token:accessToken,refresh_token:refreshToken}),
          8000,
          'Restauração de sessão em segundo plano excedeu o tempo.'
        ))
        .then(result=>{
          const s=result?.data?.session;
          if(s?.access_token)api.setRuntimeTokens?.(s.access_token,s.refresh_token||refreshToken);
        })
        .catch(e=>console.warn('[SST SESSÃO EM SEGUNDO PLANO]',e));
    }
  }catch(e){
    console.error('[SST ACCESS LOAD]',e);
    showError(String(e?.message||'Falha ao carregar o sistema.'));
  }finally{
    loading=false;
  }
}
function bind(){
  const api=window.SSTCommercialCloud;
  if(!api?.configured||authSubscription||!api.authSb)return;
  const result=api.authSb.auth.onAuthStateChange((event,session)=>{
    if(event==='TOKEN_REFRESHED'&&session?.access_token){
      api.setRuntimeTokens?.(session.access_token,session.refresh_token||'');
      return;
    }
    if(event==='SIGNED_OUT'&&authenticated){
      api.setRuntimeTokens?.('','');
      location.replace('./?v=directopen01');
      return;
    }
  });
  authSubscription=result?.data?.subscription||true;
}
function readBootstrap(){
  let raw='';
  try{raw=sessionStorage.getItem('sst_bootstrap_context_v1')||''}catch{}
  if(!raw){try{raw=localStorage.getItem('sst_bootstrap_context_v1')||''}catch{}}
  if(!raw)return null;
  try{
    const value=JSON.parse(raw);
    const fresh=value?.created_at&&(Date.now()-Number(value.created_at))<10*60*1000;
    if(!fresh||!value?.user?.id||!value?.company?.id)return null;
    return value;
  }catch{return null}
}
function openImmediately(api,ctx){
  if(!api?.bootstrapContext?.(ctx))return false;
  authenticated=true;
  document.documentElement.dataset.sstAuthenticated='true';
  installHeaderLogout();
  document.dispatchEvent(new CustomEvent('sst-client-authenticated',{detail:ctx}));

  // Nunca bloqueia a interface: tudo abaixo é só sincronização em segundo plano.
  Promise.resolve()
    .then(()=>withTimeout(api.installCompatibility(),8000,'Preparação complementar excedeu o tempo.'))
    .catch(e=>console.warn('[SST PREPARAÇÃO COMPLEMENTAR]',e));

  const refreshToken=api.getRuntimeRefreshToken?.()||'';
  const accessToken=api.getRuntimeAccessToken?.()||'';
  if(accessToken&&refreshToken){
    Promise.resolve()
      .then(()=>withTimeout(
        api.authSb.auth.setSession({access_token:accessToken,refresh_token:refreshToken}),
        8000,
        'Restauração de sessão em segundo plano excedeu o tempo.'
      ))
      .then(result=>{
        const s=result?.data?.session;
        if(s?.access_token)api.setRuntimeTokens?.(s.access_token,s.refresh_token||refreshToken);
      })
      .catch(e=>console.warn('[SST SESSÃO EM SEGUNDO PLANO]',e));
  }

  // Revalida os dados sem colocar tela por cima do sistema.
  Promise.resolve()
    .then(()=>withTimeout(api.loadContext(),10000,'Revalidação excedeu o tempo.'))
    .catch(e=>console.warn('[SST REVALIDAÇÃO EM SEGUNDO PLANO]',e));
  return true;
}
function boot(){
  if(window.__SST_CLIENT_AUTH_BOOTED__)return;
  window.__SST_CLIENT_AUTH_BOOTED__=true;

  const api=window.SSTCommercialCloud;
  const bootstrap=readBootstrap();
  const cameFromLogin=new URLSearchParams(location.search).get('access')==='ok';

  // REGRA PRINCIPAL:
  // se o Login já foi aceito, nunca mostrar overlay de "Verificando" / "Carregando empresa".
  if(cameFromLogin&&api?.configured){
    bind();
    authenticated=true;
    document.documentElement.dataset.sstAuthenticated='true';
    installHeaderLogout();

    if(bootstrap&&api.activeLicense?.(bootstrap.license)){
      openImmediately(api,bootstrap);
    }else{
      // Abre a interface imediatamente e recupera o contexto sem bloquear a tela.
      Promise.resolve()
        .then(()=>withTimeout(api.loadContext(),10000,'Revalidação excedeu o tempo.'))
        .then(ctx=>{
          if(ctx?.user&&ctx?.company){
            api.bootstrapContext?.(ctx);
            document.dispatchEvent(new CustomEvent('sst-client-authenticated',{detail:ctx}));
            return withTimeout(api.installCompatibility(),8000,'Preparação complementar excedeu o tempo.');
          }
        })
        .catch(e=>console.warn('[SST CONTEXTO EM SEGUNDO PLANO]',e));
    }
    return;
  }

  // Fallback para quem tenta abrir app.html diretamente sem passar pelo Login.
  if(api?.configured&&bootstrap&&api.activeLicense?.(bootstrap.license)){
    bind();
    openImmediately(api,bootstrap);
    return;
  }

  gate();bind();ready();
}
boot();
})();