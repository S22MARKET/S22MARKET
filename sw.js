const CACHE_NAME = 's22-market-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/classproductindex.html',
  '/cart.html',
  '/profile.html',
  '/dashboard.html',
  '/s22marketfood.html',
  '/manifest.json',
  '/LOGO.jpg',
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap'
];

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Activate Event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

// Fetch Event
self.addEventListener('fetch', (event) => {
  // Network First, Fallback to Cache logic
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Build a copy of the response
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          // Only cache http/https requests
          if (event.request.url.startsWith('http')) {
            cache.put(event.request, responseClone);
          }
        });
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
