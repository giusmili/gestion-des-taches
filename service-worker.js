const CACHE_NAME = 'taskboard-cache-v1';
const ASSETS = [
    '/',
    '/index.html',
    '/css/style.css',
    '/js/app.js',
    'https://cdn.tailwindcss.com',
    'https://cdn.jsdelivr.net/npm/chart.js'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys
                    .filter((key) => key !== CACHE_NAME)
                    .map((oldKey) => caches.delete(oldKey))
            )
        ).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;

    const { request } = event;
    const isNavigation = request.mode === 'navigate';

    if (isNavigation) {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    const copy = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
                    return response;
                })
                .catch(() => caches.match(request))
        );
        return;
    }

    event.respondWith(
        caches.match(request).then((cached) => {
            if (cached) {
                // Stale-while-revalidate for assets
                fetch(request)
                    .then((response) => {
                        caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()));
                    })
                    .catch(() => {});
                return cached;
            }
            return fetch(request)
                .then((response) => {
                    caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()));
                    return response;
                })
                .catch(() => caches.match('/index.html'));
        })
    );
});
