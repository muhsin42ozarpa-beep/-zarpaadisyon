const CACHE_NAME = 'ozarpa-cache-v8';

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
    caches.keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Firebase verilerine müdahale etme
  if (
    event.request.url.includes('firebaseio.com') ||
    event.request.url.includes('googleapis.com')
  ) {
    return;
  }

  // Önce güncel dosyayı internetten al.
  // İnternet yoksa cache'deki sürümü kullan.
  event.respondWith(
    fetch(
      event.request,
      event.request.mode === 'navigate'
        ? { cache: 'no-store' }
        : undefined
    )
      .then((response) => {
        const copy = response.clone();

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, copy);
        });

        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
