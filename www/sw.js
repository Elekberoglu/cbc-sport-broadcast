// Oflayn iş üçün sadə keş (yalnız brauzer/PWA rejimi)
const CACHE = 'cbc-sb-v7';
const ASSETS = ['./', 'index.html', 'css/app.css', 'vendor/fontawesome/css/all.min.css', 'vendor/jszip.min.js',
  'js/data.js', 'js/xlsx-reader.js', 'js/parser.js', 'js/weather.js', 'js/notify.js', 'js/timepicker.js', 'js/datepicker.js', 'js/app.js', 'icons/icon-192.png'];
self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(res => {
    const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return res;
  })));
});
