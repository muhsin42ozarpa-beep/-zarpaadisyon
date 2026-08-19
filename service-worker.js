const CACHE_NAME = 'ozarpa-cache-v27-no-dark-mode';

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
            .filter(
              (key) =>
                key.startsWith('ozarpa-cache') &&
                key !== CACHE_NAME
            )
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const request = event.request;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Firebase ve diğer harici servis isteklerine
  // service worker kesinlikle karışmaz.
  if (url.origin !== self.location.origin) return;

  const isNavigation = request.mode === 'navigate';

  const isIndex =
    /\/index\.html$/i.test(url.pathname) ||
    url.pathname.endsWith('/');

  // index.html her zaman önce internetten güncel alınır.
  if (isNavigation || isIndex) {
    event.respondWith(
      fetch(request, { cache: 'no-store' })
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();

            caches
              .open(CACHE_NAME)
              .then((cache) => {
                cache.put('./index.html', copy);
              })
              .catch(() => {});
          }

          return response;
        })
        .catch(() => caches.match('./index.html'))
    );

    return;
  }

  // Manifest, ikon ve diğer aynı-site dosyaları:
  // önce internet, internet yoksa cache.
  event.respondWith(
    fetch(request, { cache: 'no-cache' })
      .then((response) => {
        if (response && response.ok) {
          const copy = response.clone();

          caches
            .open(CACHE_NAME)
            .then((cache) => {
              cache.put(request, copy);
            })
            .catch(() => {});
        }

        return response;
      })
      .catch(() => caches.match(request))
  );
});
