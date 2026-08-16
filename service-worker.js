const CACHE_NAME = 'ozarpa-cache-v2';
const FILES_TO_CACHE = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(()=> self.clients.claim())
  );
});

// Site içeriği (HTML/CSS/JS) her zaman önce internetten taze çekilir;
// internet yoksa (ya da yavaşsa) önbellekteki son bilinen haline düşer.
// Böylece güncellemeler telefonda hemen görünür, eski önbellek takılı kalmaz.
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('firebaseio.com') || event.request.url.includes('googleapis.com')) {
    return; // Firebase isteklerine dokunma
  }
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});
