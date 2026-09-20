// Service Worker für den Offline-Start. Beim Build ersetzt vite.config.ts die beiden Platzhalter
// durch die Dateiliste und einen Hash darüber: neue Version = neuer Cache, alte Caches werden gelöscht.
const VERSION = "__VERSION__";
const FILES = __FILES__;
const PREFIX = "goalimo-";
const CACHE = PREFIX + VERSION;

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith(PREFIX) && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// Erst der Cache, dann das Netz. Seitenaufrufe (auch mit ?parametern) bekommen immer index.html.
// ignoreVary: Manche Server schicken „Vary: Origin“. Die Seite lädt Skript und CSS mit crossorigin, der Cache wurde
// ohne gefüllt. Ohne ignoreVary gäbe es dann offline keinen Treffer, obwohl die Datei im Cache liegt.
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(req.mode === "navigate" ? "./index.html" : req, { ignoreVary: true });
    return hit || fetch(req);
  })());
});
