const CACHE_NAME = "ricardo-routine-v3";
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./manifest.webmanifest",
  "./service-worker.js",
  "./assets/app-icon-192.png",
  "./assets/app-icon-512.png",
  "./assets/lottie/loop.json",
  "./assets/icons/dumbbell.svg",
  "./assets/icons/ezbar.svg",
  "./assets/icons/cable.svg",
  "./assets/icons/mobility.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(req, {ignoreSearch:true});
    if (cached) return cached;
    try {
      const fresh = await fetch(req);
      if (req.method === "GET" && new URL(req.url).origin === location.origin) {
        cache.put(req, fresh.clone());
      }
      return fresh;
    } catch (e) {
      if (req.mode === "navigate") return cache.match("./index.html");
      throw e;
    }
  })());
});
