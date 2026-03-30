"use strict";

const SHELL_CACHE = "ppccr-shell-v20260330-pdf-live-body-snapshot-v3";
const STATIC_CACHE = "ppccr-static-v20260330-pdf-live-body-snapshot-v3";
const ACTIVE_CACHES = [SHELL_CACHE, STATIC_CACHE];
const PRECACHE_URLS = [
  "/",
  "/index.html",
  "/manifest.webmanifest?v=20260313-home-phase2-release-blockers1",
  "/styles.css?v=20260311-home-sponsors-spacing1",
  "/kpis-dashboard.css?v=20260330-pdf-live-body-snapshot-v3",
  "/ppccr-sankey-participantes.css?v=20260325-dashboard-live-fix1",
  "/home-mobile-shell.css?v=20260313-home-phase2-release-blockers1",
  "/host-guard.js",
  "/page-transitions.js",
  "/domain/home-algorithm-domain.js",
  "/app/home-algorithm-service.js",
  "/app.js?v=20260328-registro-botones-v1",
  "/kpis-dashboard.js?v=20260330-pdf-live-body-snapshot-v3",
  "/ppccr-sankey-participantes.js?v=20260325-dashboard-live-fix1",
  "/auth-gate.js?v=20260313-home-phase2-release-blockers1",
  "/home-mobile-shell.js?v=20260313-home-phase2-release-blockers1",
  "/pwa-register.js?v=20260330-pdf-live-body-snapshot-v3",
  "/assets/favicon.png",
  "/assets/logo-ppccr.png",
  "/assets/logo%20cinta%20azul.png",
  "/assets/logo-fep.png?v=20260208",
  "/assets/logo-gedyt.png",
  "/assets/logo-merck.png",
  "/assets/logo-gcba.png",
  "/assets/icons/ppccr-app-192.png",
  "/assets/icons/ppccr-app-512.png",
  "/assets/icons/ppccr-app-maskable-512.png"
];
const BYPASS_PATHS = new Set([
  "/api/algorithm/stage1",
  "/api/export-kpi-pdf-a4",
  "/exports/informe-fit-entregados-lab.xlsx",
]);

function isSameOrigin(urlString) {
  return new URL(urlString, self.location.origin).origin === self.location.origin;
}

function shouldBypassRequest(request) {
  if (!request || request.method !== "GET") return true;
  if (!isSameOrigin(request.url)) return true;

  const url = new URL(request.url);
  if (BYPASS_PATHS.has(url.pathname)) return true;
  return false;
}

async function networkFirst(request) {
  const cache = await caches.open(SHELL_CACHE);

  try {
    const response = await fetch(request);
    if (response && response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cachedResponse =
      (await cache.match(request, { ignoreSearch: false })) ||
      (await cache.match("/index.html"));

    if (cachedResponse) return cachedResponse;
    throw error;
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cachedResponse = await cache.match(request, { ignoreSearch: false });
  const networkResponsePromise = fetch(request)
    .then((response) => {
      if (response && response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => null);

  if (cachedResponse) {
    return cachedResponse;
  }

  const networkResponse = await networkResponsePromise;
  if (networkResponse) {
    return networkResponse;
  }

  const shellFallback = await caches.match("/index.html");
  return shellFallback || Response.error();
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => !ACTIVE_CACHES.includes(key))
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (shouldBypassRequest(request)) return;

  const url = new URL(request.url);
  const accept = request.headers.get("accept") || "";

  if (request.mode === "navigate" || accept.includes("text/html")) {
    event.respondWith(networkFirst(request));
    return;
  }

  if (
    ["style", "script", "image", "font", "manifest"].includes(
      request.destination,
    ) ||
    url.pathname.startsWith("/assets/")
  ) {
    event.respondWith(staleWhileRevalidate(request));
  }
});
