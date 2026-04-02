"use strict";

(() => {
  if (!("serviceWorker" in navigator)) return;
  const swUrl = "/sw.js?v=20260401-merck-logo-v1";
  const isLocalDevHost =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";

  async function disableServiceWorkerInLocalhost() {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      const unregisterResults = await Promise.allSettled(
        registrations.map((registration) => registration.unregister()),
      );
      const unregisteredCount = unregisterResults.filter((result) => {
        return result.status === "fulfilled" && result.value;
      }).length;

      let removedCaches = 0;
      let cacheMatches = 0;

      if ("caches" in window) {
        const cacheKeys = await caches.keys();
        const ppccrCacheKeys = cacheKeys.filter((key) => key.startsWith("ppccr-"));
        cacheMatches = ppccrCacheKeys.length;

        const cacheDeleteResults = await Promise.allSettled(
          ppccrCacheKeys.map((key) => caches.delete(key)),
        );
        removedCaches = cacheDeleteResults.filter((result) => {
          return result.status === "fulfilled" && result.value;
        }).length;
      }

      console.info("[pwa] Service worker deshabilitado en localhost.", {
        hostname: window.location.hostname,
        registrationsFound: registrations.length,
        registrationsRemoved: unregisteredCount,
        cachesFound: cacheMatches,
        cachesRemoved: removedCaches,
      });
    } catch (error) {
      if (
        error &&
        typeof error === "object" &&
        (error.name === "InvalidStateError" ||
          String(error.message || "").includes("invalid state"))
      ) {
        return;
      }
      console.warn(
        "[pwa] No se pudo limpiar service workers o caches en localhost.",
        error,
      );
    }
  }

  window.addEventListener(
    "load",
    async () => {
      if (isLocalDevHost) {
        await disableServiceWorkerInLocalhost();
        return;
      }

      try {
        await navigator.serviceWorker.register(swUrl, { scope: "/" });
      } catch (error) {
        console.warn("[pwa] No se pudo registrar el service worker.", error);
      }
    },
    { once: true },
  );
})();
