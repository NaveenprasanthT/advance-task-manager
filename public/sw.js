// Minimal service worker: makes the app installable and gives repeat visits
// a faster shell + a real offline fallback. Deliberately does NOT cache
// /api/* responses - this app is entirely data-driven from a per-user
// database, and caching API responses risks serving stale or (on a shared
// device) another user's data instead of a clear "you're offline" state.
const CACHE_NAME = "taskflow-shell-v1";
const APP_SHELL = ["/offline", "/manifest.webmanifest", "/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;

  // Page navigations: network-first, falling back to the cached offline
  // page when there's truly no connection - never serve a stale page as if
  // it were live data.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match("/offline").then((cached) => cached ?? Response.error())),
    );
    return;
  }

  // Static assets (icons, manifest, etc.): cache-first with a network
  // fallback, so the installed shell still has something to show offline.
  event.respondWith(
    caches.match(request).then((cached) => cached ?? fetch(request)),
  );
});
