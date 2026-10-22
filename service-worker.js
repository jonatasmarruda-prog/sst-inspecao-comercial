/* SST Comercial PWA, independente do aplicativo TBM original.
   Cache apenas de recursos estáticos do próprio domínio: nunca persiste
   respostas da API Supabase ou dados dos clientes. */
const CACHE='sst-comercial-install-v175';
const BASE=new URL('./',self.registration.scope);
const CORE=['./','./index.html','./app.html','./manifest.json','./commercial-pwa-install.js','./icon.svg','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>{
 e.waitUntil(caches.open(CACHE).then(async cache=>{
  await Promise.allSettled(CORE.map(async file=>{
   const target=new URL(file,BASE);
   const response=await fetch(target,{cache:'no-store'});
   if(response.ok&&response.type!=='opaque')await cache.put(target,response);
  }));
 }).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
 e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>
  (k.startsWith('inspecao-sst-comercial-')||k.startsWith('sst-comercial-install-'))&&k!==CACHE
 ).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
 const req=e.request;
 if(req.method!=='GET')return;
 const url=new URL(req.url);
 if(url.origin!==self.location.origin||!url.pathname.startsWith(BASE.pathname))return;
 // Não armazenar arquivos com parâmetros sensíveis; scripts e a interface
 // têm estratégia network-first e fallback somente aos arquivos estáticos.
 e.respondWith(fetch(req,{cache:'no-store'}).then(response=>{
  if(response.ok&&response.type!=='opaque'&&
    !url.searchParams.has('access')&&
    !url.searchParams.has('token')&&
    !url.searchParams.has('code')){
   const cacheKey=new URL(url.pathname,url.origin).href;
   const saved=response.clone();
   e.waitUntil(caches.open(CACHE).then(cache=>cache.put(cacheKey,saved)).catch(()=>{}));
  }
  return response;
 }).catch(async()=>{
  const cached=await caches.match(new URL(url.pathname,url.origin).href);
  if(cached)return cached;
  if(req.mode==='navigate'){
   const login=await caches.match(new URL('index.html',BASE).href);
   if(login)return login;
  }
  return new Response('É necessária conexão com a internet para entrar e sincronizar.',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}});
 }));
});