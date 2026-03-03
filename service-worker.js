const CACHE_NAME = 'tictac-v1';
const ASSETS = ['/', '/index.html', '/game.html', '/css/style.css', '/js/auth.js', '/js/game.js', '/js/firebase.js'];

self.addEventListener('install', event => {
    event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
});

self.addEventListener('fetch', event => {
    event.respondWith(caches.match(event.request).then(response => response || fetch(event.request)));
});
