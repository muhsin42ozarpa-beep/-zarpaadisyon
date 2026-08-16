const CACHE_NAME = 'ozarpa-cache-v1';
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
    )
  );
  self.clients.claim();
});

// Site içeriği (HTML/CSS/JS) önbellekten hızlı yüklenir;
// canlı veriler (Firebase) her zaman internetten taze çekilir, önbelleğe alınmaz.
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('firebaseio.com') || event.request.url.includes('googleapis.com')) {
    return; // Firebase isteklerine dokunma
  }
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
