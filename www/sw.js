// Oflayn iş üçün sadə keş (yalnız brauzer/PWA rejimi)
const CACHE = 'cbc-sb-v23';
const ASSETS = ['./', 'index.html', 'css/app.css', 'vendor/fontawesome/css/all.min.css', 'vendor/jszip.min.js',
  'js/data.js', 'js/xlsx-reader.js', 'js/parser.js', 'js/operators.js', 'js/weather.js', 'js/firebase-config.js', 'js/cloud.js', 'js/push.js', 'js/notify.js', 'js/timepicker.js', 'js/datepicker.js', 'js/app.js', 'icons/icon-192.png', 'icons/icon-180.png', 'manifest.json', 'vendor/fontawesome/webfonts/fa-solid-900.woff2', 'vendor/fontawesome/webfonts/fa-regular-400.woff2'];
self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(res => {
    const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return res;
  })));
});
// Server (FCM Web Push) bildirişi: "Həftəlik çəkiliş cədvəli yeniləndi"
self.addEventListener('push', e => {
  let p = {};
  try { p = e.data ? e.data.json() : {}; } catch (err) { p = {}; }
  const n = p.notification || {};
  const data = p.data || {};
  e.waitUntil(self.registration.showNotification(n.title || 'CBC Sport Broadcast', {
    body: n.body || '📅 Həftəlik çəkiliş cədvəli yeniləndi',
    icon: 'icons/icon-192.png', badge: 'icons/icon-192.png',
    tag: data.type === 'schedule' ? 'schedule-update' : undefined,
    data
  }));
});
// Bildirişə toxunanda tətbiqi aç (cədvəl bildirişi → həftəlik cədvəl)
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const week = e.notification.data && e.notification.data.type === 'schedule';
  const url = week ? './?view=week' : './';
  e.waitUntil(self.clients.matchAll({ type: 'window' }).then(cs => {
    if (cs.length) { const c = cs[0]; return (week && c.navigate ? c.navigate(url).then(w => (w || c).focus()) : c.focus()); }
    return self.clients.openWindow(url);
  }));
});
