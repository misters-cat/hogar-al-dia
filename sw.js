/* App shell offline: no almacena datos personales ni se conecta con servicios externos */
const CACHE='hogar-al-dia-static-v1';
const FILES=['./','./index.html','./styles.css','./app.js','./manifest.webmanifest','./favicon.svg','./icon-192.png','./icon-512.png'];
self.addEventListener('install',evt=>{evt.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',evt=>{evt.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('hogar-al-dia-static-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',evt=>{if(evt.request.method!=='GET'||new URL(evt.request.url).origin!==self.location.origin)return;
 evt.respondWith(fetch(evt.request).then(resp=>{if(resp.ok){const copy=resp.clone();caches.open(CACHE).then(c=>c.put(evt.request,copy)).catch(()=>{});}return resp;}).catch(()=>caches.match(evt.request).then(r=>r||caches.match('./index.html'))));
});