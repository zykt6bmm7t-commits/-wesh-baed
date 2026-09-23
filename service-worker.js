const CACHE_NAME='wesh-baed-v197-non-legal-hardening';
const APP_SHELL=['./manifest.webmanifest','./icon.svg'];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(
    keys.filter(key=>key!==CACHE_NAME).map(key=>caches.delete(key))
  )));
  self.clients.claim();
});

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin)return;

  if(event.request.mode==='navigate'){
    event.respondWith(fetch(event.request,{cache:'no-store'}));
    return;
  }

  if(APP_SHELL.some(path=>url.href===new URL(path,self.registration.scope).href)){
    event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request)));
  }
});
