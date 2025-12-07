const CACHE_NAME = 'chaotic-shift-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Install: Cache core app shell
self.addEventListener('install', (event) => {
  self.skipWaiting(); // Activate immediately
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Activate: Cleanup old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch: Network First for API, Stale-While-Revalidate for Assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. Bypass cache for Google Gemini API (AI Service)
  // We want this to always fail fast or succeed via network
  if (url.hostname.includes('googleapis.com')) {
    return; 
  }

  // 2. Handle requests
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Return cached response if found
      if (cachedResponse) {
        // Optional: Update cache in background (Stale-While-Revalidate)
        // For immutable libraries, this isn't strictly necessary, but good for app code
        fetch(event.request).then((networkResponse) => {
            if(networkResponse && networkResponse.status === 200 && networkResponse.type === 'cors') {
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, networkResponse.clone());
                });
            }
        }).catch(() => {}); // Eat errors

        return cachedResponse;
      }

      // 3. Network fallback
      return fetch(event.request).then((networkResponse) => {
        // Check if we received a valid response
        if (!networkResponse || networkResponse.status !== 200) {
          return networkResponse;
        }

        // Cache the new resource (React, Framer Motion, local files)
        // We only cache basic or cors requests
        if(networkResponse.type === 'basic' || networkResponse.type === 'cors') {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
        }

        return networkResponse;
      });
    })
  );
});