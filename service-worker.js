const CACHE_NAME = 'ozarpa-cache-v6';

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

// Firebase isteklerine kesinlikle müdahale etme.
// Site dosyalarında önce güncel dosyayı internetten getir.
// İnternet yoksa önbellekteki son sürümü kullan.
self.addEventListener('fetch', (event) => {
  if (
    event.request.url.includes('firebaseio.com') ||
    event.request.url.includes('googleapis.com')
  ) {
    return;
  }

  event.respondWith(
    fetch(
      event.request,
      event.request.mode === 'navigate'
        ? { cache: 'no-store' }
        : undefined
    )
      .then((response) => {
        const responseClone = response.clone();

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });

        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
