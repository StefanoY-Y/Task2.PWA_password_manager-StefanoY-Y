const CACHE_NAME = 'pwa-pwmgr-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/manifest.json',
  '/icon-192.svg',
  '/icon-512.svg'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(clients.claim());
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  // simple cache-first for navigation / app shell
  e.respondWith(
    caches.match(req).then(res => res || fetch(req).catch(()=> caches.match('/index.html')))
  );
});
