const CACHE_NAME = 'ozarpa-cache-v10';

const APP_SHELL = [
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.all(
        APP_SHELL.map((url) =>
          cache.add(url).catch(() => null)
        )
      )
    )
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
  const url = event.request.url;

  // Firebase verilerine dokunma
  if (
    url.includes('firebaseio.com') ||
    url.includes('googleapis.com')
  ) {
    return;
  }

  // index.html her zaman güncel olarak internetten gelsin.
  // Eski PC / mobil arayüz cache'de kalmasın.
  if (
    event.request.mode === 'navigate' ||
    url.includes('index.html')
  ) {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .catch(() => caches.match('./index.html'))
    );

    return;
  }

  // Diğer dosyalarda önce internet,
  // internet yoksa cache kullan.
  event.respondWith(
    fetch(event.request, { cache: 'no-cache' })
      .then((response) => {
        if (response && response.ok) {
          const copy = response.clone();

          caches
            .open(CACHE_NAME)
            .then((cache) => cache.put(event.request, copy))
            .catch(() => {});
        }

        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
