// S22 Market Service Worker v1.0
const CACHE_NAME = 's22-cache-v1';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/cart.html',
    '/app-style.css',
    '/app-core.js',
    'https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap'
];

// Install - Cache static assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(STATIC_ASSETS))
            .then(() => self.skipWaiting())
    );
});

// Activate - Clean old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch - Network first, fallback to cache
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests and Firebase/external APIs
    if (event.request.method !== 'GET' ||
        event.request.url.includes('firebasejs') ||
        event.request.url.includes('firestore.googleapis.com')) {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Clone and cache successful responses
                if (response.status === 200) {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                }
                return response;
            })
            .catch(() => {
                // Fallback to cache on network failure
                return caches.match(event.request);
            })
    );
});
