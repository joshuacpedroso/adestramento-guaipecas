// Cache simples pra abrir rápido e funcionar com internet ruim. A API nunca é cacheada.
const V = "guaipecas-v1";
const CORE = ["/", "/assets/styles.css?v=1", "/assets/content.js?v=1", "/assets/brain.js?v=1", "/assets/app.js?v=1", "/assets/logo.webp", "/assets/mark.webp", "/icon-192.png"];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(V).then((c) => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== V).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin || u.pathname.startsWith("/api/")) return;
  e.respondWith(fetch(e.request).then((r) => { const c = r.clone(); caches.open(V).then((ca) => ca.put(e.request, c)); return r; }).catch(() => caches.match(e.request).then((r) => r || caches.match("/"))));
});
