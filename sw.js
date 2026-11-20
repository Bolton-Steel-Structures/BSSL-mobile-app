// iCONSTRUCTE Site service worker: keeps the app itself available offline.
// Drawings are NOT cached here (the app stores offline copies itself and removes superseded ones).
// API calls (/api/) are never cached: forms, check-ins and claims are queued on the phone by the app instead.
const VERSION = "icsite-v24";
const SHELL = ["./", "index.html", "app.css", "core.js", "time.js", "forms.js", "leave.js", "expenses.js", "cards.js", "manager.js", "week.js", "xlsx.js", "model.js", "cert.js", "qa.js", "app.js", "config.js", "manifest.webmanifest",
  "vendor/msal-browser.min.js", "vendor/pdf.min.js", "vendor/pdf.worker.min.js", "vendor/jspdf.umd.min.js", "icons/bss-logo.jpg",
  "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png", "icons/mark.png", "icons/iconstructe-logo.png"];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin || u.pathname.includes("/demo/") || u.pathname.includes("/api/")) return;
  // network first (so updates to the app arrive), cached copy when offline
  e.respondWith(fetch(e.request).then((r) => { const copy = r.clone(); caches.open(VERSION).then((c) => c.put(e.request, copy)); return r; })
    .catch(() => caches.match(e.request, { ignoreSearch: true }).then((r) => r || caches.match("index.html"))));
});
