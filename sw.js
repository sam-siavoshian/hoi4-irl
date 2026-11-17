// Offline shell. Network-first so updates arrive immediately; cache as fallback when offline.
// The build (vite.config.js) writes the names of the built files in place of the marker below and puts the result in dist/.
// The countries' flags (icons/flags/, written in at the second marker) and the first scenario's map are cached up front; any other country's map is cached the first time it is played.
const CACHE = 'homefront-v12';
const SHELL = ['./', 'index.html', 'theme-boot.js', /*BUILT*/ 'data/scenarios.json', 'data/maps/iran.json', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/apple-touch-icon.png', /*FLAGS*/];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin || url.pathname.includes('/api/')) return;
  e.respondWith(fetch(e.request).then(res => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); } return res; }).catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('index.html'))));
});
