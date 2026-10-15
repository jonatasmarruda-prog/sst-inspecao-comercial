(()=>{
'use strict';

const $=(s,r=document)=>r.querySelector(s);
let authSubscription=null;

function css(){
  if($('#sstClientAuthStyle'))return;
  const s=document.createElement('style');
  s.id='sstClientAuthStyle';
  s.textContent=`
  #sstClientAuth{position:fixed;inset:0;z-index:999999;background:linear-gradient(145deg,#0f172a,#7f1d1d);display:flex;align-items:center;justify-content:center;padding:18px}
  #sstClientAuth.hidden{display:none!important}
  .sca{width:min(460px,100%);background:#fff;border-radius:22px;padding:24px;box-shadow:0 30px 90px #0008}
  .sca h2{margin:0 0 6px;color:#17202b}.sca p{margin:0 0 16px;color:#64748b;line-height:1.45}
  .sca label{display:block;font-size:12px;font-weight:900;color:#334155;margin:10px 0 5px}
  .sca input{width:100%;box-sizing:border-box;padding:12px;border:1px solid #cbd5e1;border-radius:10px;background:#fff;color:#111827}
  .sca input:focus{outline:none;border-color:#8b1018;box-shadow:0 0 0 3px #8b101818}
  .pw{position:relative}.pw input{padding-right:50px}
  .eye{position:absolute;right:7px;top:50%;transform:translateY(-50%);width:38px!important;height:38px;margin:0!important;padding:0!important;border-radius:9px!important;background:#f1f5f9!important;color:#17202b!important;font-size:18px}
  .sca button{width:100%;border:0;border-radius:10px;padding:12px;font-weight:900;margin-top:10px;cursor:pointer}
  .sca button:disabled{opacity:.6;cursor:not-allowed}
  .sca .p{background:#8b1018;color:#fff}.sca .s{background:#e2e8f0;color:#17202b}
  .sca .msg{font-size:12px;margin-top:10px;line-height:1.45;min-height:18px}.sca .err{color:#991b1b}.sca .ok{color:#166534}.sca .info{color:#334155}
  .sca .lock{display:inline-flex;align-items:center;gap:6px;padding:6px 9px;border-radius:999px;background:#f1f5f9;color:#475569;font-size:10px;font-weight:900;margin-bottom:10px}
  #scaLogoutHeader{margin-left:8px;padding:8px 10px;border-radius:9px;background:#fff2;color:#fff;border:1px solid #ffffff55;font-weight:900;font-size:11px}
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
    <p>Entre com seu e-mail e senha para acessar os dados da sua empresa.</p>
    <label for="scaEmail">E-mail</label>
    <input id="scaEmail" type="email" inputmode="email" autocomplete="username" autocapitalize="none" spellcheck="false">
    <label for="scaPass">Senha</label>
    <div class="pw">
      <input id="scaPass" type="password" autocomplete="current-password">
      <button id="scaEye" class="eye" type="button" title="Mostrar senha" aria-label="Mostrar senha">👁️</button>
    </div>
    <button id="scaLogin" class="p" type="button">Entrar</button>
    <button id="scaCreate" class="s" type="button">Criar acesso</button>
    <button id="scaForgot" class="s" type="button">Esqueci minha senha</button>
    <div id="scaMsg" class="msg info">Verificando sessão...</div>
  </div>`;
  document.body.appendChild(root);
  return root;
}

function msg(t,kind='err'){
  const m=$('#scaMsg');
  if(!m)return;
  m.textContent=t||'';
  m.className='msg '+(kind==='ok'?'ok':kind==='info'?'info':'err');
}

function friendly(error,fallback='Não foi possível entrar.'){
  const code=String(error?.code||'').toLowerCase();
  const raw=String(error?.message||'').trim();
  const low=raw.toLowerCase();
  if(code==='invalid_credentials'||/invalid login credentials|invalid credentials/.test(low))return 'E-mail ou senha incorretos.';
  if(code==='email_not_confirmed'||/email not confirmed/.test(low))return 'Seu e-mail ainda não foi liberado para acesso.';
  if(code==='over_request_rate_limit'||code==='too_many_requests'||/rate limit|too many/.test(low))return 'Muitas tentativas em pouco tempo. Tente novamente mais tarde.';
  if(/failed to fetch|network|load failed/.test(low))return 'Falha de conexão. Verifique a internet e tente novamente.';
  if(/user already registered|already.*registered|already.*exists/.test(low))return 'Este e-mail já possui cadastro. Use Entrar ou Esqueci minha senha.';
  if(/password/.test(low)&&/least|characters|weak/.test(low))return 'A senha precisa ter pelo menos 8 caracteres.';
  return raw||fallback;
}

function setBusy(on,label='Entrando...'){
  const ids=['#scaLogin','#scaCreate','#scaForgot','#scaEmail','#scaPass'];
  ids.forEach(id=>{const el=$(id);if(el)el.disabled=!!on});
  const b=$('#scaLogin');
  if(b)b.textContent=on?label:'Entrar';
}

function showLogin(text='Entre para continuar.'){
  gate().classList.remove('hidden');
  setBusy(false);
  msg(text,'info');
  setTimeout(()=>$('#scaEmail')?.focus(),50);
}

function installHeaderLogout(ctx){
  const top=$('.topin');
  if(!top)return;
  let b=$('#scaLogoutHeader');
  if(!b){
    b=document.createElement('button');
    b.id='scaLogoutHeader';
    b.type='button';
    b.textContent='Sair';
    b.onclick=async()=>{
      try{
        b.disabled=true;
        await window.SSTCommercialCloud?.signOut?.();
      }finally{
        location.reload();
      }
    };
    top.appendChild(b);
  }
  b.title=ctx?.user?.email?('Conta: '+ctx.user.email):'Sair da conta';
}

async function ready(){
  gate();
  const api=window.SSTCommercialCloud;
  if(!api?.configured){
    showLogin('O serviço de acesso está indisponível. Atualize a página e tente novamente.');
    return;
  }

  try{
    const sessionResult=await api.sb.auth.getSession();
    if(sessionResult.error)throw sessionResult.error;
    if(!sessionResult.data?.session){
      showLogin('Entre para continuar.');
      return;
    }

    msg('Carregando sua empresa...','info');
    const c=await api.loadContext();
    if(!c?.user){
      showLogin('Entre para continuar.');
      return;
    }

    $('#sstClientAuth')?.classList.add('hidden');
    installHeaderLogout(c);
    await api.installCompatibility();
    document.dispatchEvent(new CustomEvent('sst-client-authenticated',{detail:c}));
  }catch(e){
    console.error('[SST LOGIN READY]',e);
    const session=await api.sb.auth.getSession().catch(()=>({data:{session:null}}));
    if(session?.data?.session){
      gate().classList.remove('hidden');
      setBusy(false);
      msg('Sua conta foi reconhecida, mas não foi possível carregar os dados. Atualize a página.','err');
    }else{
      showLogin('Entre para continuar.');
    }
  }
}

async function login(){
  const api=window.SSTCommercialCloud;
  try{
    const email=$('#scaEmail').value.trim().toLowerCase();
    const password=$('#scaPass').value;
    if(!email||!password)throw new Error('Informe e-mail e senha.');
    setBusy(true,'Entrando...');
    msg('Validando acesso...','info');
    await api.signIn(email,password);
    await ready();
  }catch(e){
    setBusy(false);
    msg(friendly(e,'Falha no login.'));
  }
}

async function create(){
  const api=window.SSTCommercialCloud;
  const b=$('#scaCreate');
  try{
    const email=$('#scaEmail').value.trim().toLowerCase();
    const password=$('#scaPass').value;
    if(!email||!password)throw new Error('Informe e-mail e senha.');
    if(password.length<8)throw new Error('A senha precisa ter pelo menos 8 caracteres.');
    setBusy(true,'Criando acesso...');
    if(b)b.textContent='Criando acesso...';
    msg('Criando sua conta com segurança...','info');
    await api.signUp(email,password,'');
    msg('Acesso criado com sucesso. Abrindo o sistema...','ok');
    await ready();
  }catch(e){
    setBusy(false);
    if(b)b.textContent='Criar acesso';
    msg(friendly(e,'Não foi possível criar o acesso.'));
  }finally{
    if(b)b.textContent='Criar acesso';
  }
}

async function forgot(){
  const api=window.SSTCommercialCloud;
  try{
    const email=$('#scaEmail').value.trim().toLowerCase();
    if(!email)throw new Error('Informe seu e-mail.');
    setBusy(true,'Enviando...');
    msg('Solicitando recuperação de senha...','info');
    await api.resetPassword(email);
    setBusy(false);
    msg('Se este e-mail estiver cadastrado, enviaremos o link de redefinição. Verifique também a pasta Spam.','ok');
  }catch(e){
    setBusy(false);
    msg(friendly(e,'Não foi possível solicitar a recuperação.'));
  }
}

function togglePassword(){
  const p=$('#scaPass');
  const e=$('#scaEye');
  if(!p||!e)return;
  const show=p.type==='password';
  p.type=show?'text':'password';
  e.textContent=show?'🙈':'👁️';
  e.title=show?'Ocultar senha':'Mostrar senha';
  e.setAttribute('aria-label',e.title);
}

function bindAuthEvents(){
  const api=window.SSTCommercialCloud;
  if(!api?.configured||authSubscription)return;
  const result=api.sb.auth.onAuthStateChange((event,session)=>{
    if(event==='SIGNED_OUT'||!session){
      $('#scaLogoutHeader')?.remove();
      showLogin('Sessão encerrada. Entre novamente.');
      return;
    }
    if(['SIGNED_IN','TOKEN_REFRESHED','PASSWORD_RECOVERY'].includes(event)){
      setTimeout(()=>ready(),0);
    }
  });
  authSubscription=result?.data?.subscription||true;
}

function boot(){
  const r=gate();
  $('#scaLogin',r).onclick=login;
  $('#scaCreate',r).onclick=create;
  $('#scaForgot',r).onclick=forgot;
  $('#scaEye',r).onclick=togglePassword;
  $('#scaEmail',r).addEventListener('keydown',e=>{if(e.key==='Enter')login()});
  $('#scaPass',r).addEventListener('keydown',e=>{if(e.key==='Enter')login()});
  bindAuthEvents();
  ready();
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();