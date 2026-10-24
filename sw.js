// Offline cache for the installed app. Bump VERSION when files change.
const VERSION = 'sss-v7';
const FILES = ['./', './index.html', './style.css', './manifest.webmanifest', './fonts/fonts.css', './icons/icon-192.png', './icons/icon-512.png',
  './js/audio.js', './js/character.js', './js/scenes.js', './js/figures.js', './js/cutscenes.js', './js/meta.js', './js/minigames.js', './js/minigames2.js', './js/ops.js',
  './js/story.js', './js/story2.js', './js/story3.js', './js/story4.js', './js/story5.js', './js/events.js', './js/engine.js'];
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
    if (res.ok && new URL(e.request.url).origin === location.origin) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(e.request, copy)); }
    return res;
  }).catch(() => caches.match('./index.html'))));
});
