// Service Worker for Squirt PWA

const CACHE_NAME = 'squirt-cache-v1';
const assetsToCache = [
  '/',
  '/index.html',
  '/main.bundle.js',
  '/main.*.css',
  '/manifest.json'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching files');
        return cache.addAll(assetsToCache);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Clearing old cache');
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Return cached response if found
        if (cachedResponse) {
          return cachedResponse;
        }

        // Otherwise fetch from network
        return fetch(event.request)
          .then((response) => {
            // Only cache successful responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            // Add to cache
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          });
      })
  );
});

// Handle ShareTarget API for mobile devices
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  if (url.searchParams.has('share-target')) {
    event.respondWith(
      (async () => {
        try {
          // Get shared data
          const formData = await event.request.formData();
          const title = formData.get('title') || '';
          const text = formData.get('text') || '';
          const url = formData.get('url') || '';
          
          // Store the data for client retrieval
          const client = await self.clients.get(event.resultingClientId);
          client.postMessage({
            type: 'SHARE_TARGET_DATA',
            data: { title, text, url }
          });
          
          // Redirect to app
          return Response.redirect('/?share-received=1', 303);
        } catch (error) {
          console.error('Error handling share target:', error);
          return Response.redirect('/?share-error=1', 303);
        }
      })()
    );
  }
});