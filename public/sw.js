// sw.js
const CACHE_NAME = 'sunshine-guard-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Use addAll safely or cache core shell items individually
      return Promise.all(
        ASSETS_TO_CACHE.map(path => 
          cache.add(path).catch(err => console.warn(`Failed to cache ${path}:`, err))
        )
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
  self.client.claim();
});

self.addEventListener('fetch', (event) => {
  // Network-first strategy for API requests, Cache-first for UI assets
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response(JSON.stringify({ offline: true, message: "Action queued locally." }), {
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
  } else {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request).then((fetchResponse) => {
          // Dynamically cache successful static assets
          return caches.open(CACHE_NAME).then((cache) => {
            if (event.request.method === 'GET' && event.request.url.startsWith(self.location.origin)) {
              cache.put(event.request, fetchResponse.clone());
            }
            return fetchResponse;
          });
        });
      }).catch(() => {
        // Fallback for offline navigation if needed
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      })
    );
  }
});