"use strict";

(() => {
  const body = document.body;
  if (!body || !body.classList.contains("page-home")) return;

  let resizeRaf = 0;
  let lastState = {
    mode: "",
    shell: null,
    tablet: null,
    phone: null,
    authLocked: null,
    banner: null,
  };

  const fallbackState = () => {
    const isShell = window.matchMedia("(max-width: 1024px)").matches;
    const isTablet = window.matchMedia(
      "(min-width: 769px) and (max-width: 1024px)",
    ).matches;
    return {
      mode: isShell ? (isTablet ? "tablet" : "phone") : "desktop",
      isHandheld: isShell,
      isTablet,
      isPhone: isShell && !isTablet,
    };
  };

  const getLayoutState = () => {
    if (window.PPCCR?.layout && typeof window.PPCCR.layout.getState === "function") {
      return window.PPCCR.layout.getState();
    }
    return fallbackState();
  };

  const emitLayoutSync = () => {
    if (resizeRaf) return;
    resizeRaf = window.requestAnimationFrame(() => {
      resizeRaf = 0;
      window.dispatchEvent(new Event("resize"));
      window.dispatchEvent(new CustomEvent("ppccr:home-shell-sync"));
      window.dispatchEvent(new CustomEvent("ppccr:shell-layout-stable"));
    });
  };

  const syncShellState = () => {
    const layoutState = getLayoutState();
    const nextState = {
      mode: layoutState.mode,
      shell: layoutState.isHandheld,
      tablet: layoutState.mode === "tablet",
      phone: layoutState.mode === "phone",
      authLocked: body.classList.contains("is-auth-locked"),
      banner: body.classList.contains("has-user-banner"),
    };

    body.classList.toggle("is-home-shell", nextState.shell);
    body.classList.toggle("is-home-shell-tablet", nextState.tablet);
    body.classList.toggle("is-home-shell-phone", nextState.phone);

    if (
      nextState.mode !== lastState.mode ||
      nextState.shell !== lastState.shell ||
      nextState.tablet !== lastState.tablet ||
      nextState.phone !== lastState.phone ||
      nextState.authLocked !== lastState.authLocked ||
      nextState.banner !== lastState.banner
    ) {
      emitLayoutSync();
      lastState = nextState;
    }
  };

  if (window.PPCCR?.layout && typeof window.PPCCR.layout.addListener === "function") {
    window.PPCCR.layout.addListener(syncShellState);
  }

  const mutationObserver = new MutationObserver(() => {
    syncShellState();
  });
  mutationObserver.observe(body, {
    attributes: true,
    attributeFilter: ["class"],
  });

  window.addEventListener("orientationchange", syncShellState, { passive: true });
  window.addEventListener("hashchange", syncShellState, { passive: true });
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", syncShellState, {
      passive: true,
    });
  }

  window.addEventListener(
    "load",
    () => {
      syncShellState();
      emitLayoutSync();
    },
    { once: true },
  );

  syncShellState();
})();
