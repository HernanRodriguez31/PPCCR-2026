"use strict";

(() => {
  if (!("serviceWorker" in navigator)) return;
  const swUrl = "/sw.js?v=20260313-home-phase2-release-blockers1";

  window.addEventListener(
    "load",
    async () => {
      try {
        await navigator.serviceWorker.register(swUrl, { scope: "/" });
      } catch (error) {
        console.warn("[pwa] No se pudo registrar el service worker.", error);
      }
    },
    { once: true },
  );
})();
