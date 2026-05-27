// Mind Reminders — Service Worker
const CACHE = 'mind-reminders-v1';

const SHELL = [
  './',
  'index.html',
  'manifest.json',
  'icon.png',
  'icon-192.png',
  'icon-512.png',
];

// Install: cache app shell
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

// Activate: drop old caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// Fetch: network-first for fonts, cache-first for everything else
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  if (url.hostname.includes('fonts.')) {
    e.respondWith(
      fetch(e.request)
        .then(r => {
          const clone = r.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return r;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request)
        .then(r => {
          if (r.ok && e.request.method === 'GET') {
            const clone = r.clone();
            caches.open(CACHE).then(c => c.put(e.request, clone));
          }
          return r;
        })
        .catch(() => caches.match('index.html'));
    })
  );
});
