"use strict";

(() => {
  const body = document.body;
  if (!body || !body.classList.contains("page-home")) return;

  const mqShell = window.matchMedia("(max-width: 1024px)");
  const mqTablet = window.matchMedia("(min-width: 769px) and (max-width: 1024px)");
  let resizeRaf = 0;
  let lastState = {
    shell: null,
    tablet: null,
    authLocked: null,
    banner: null,
  };

  const emitLayoutSync = () => {
    if (resizeRaf) return;
    resizeRaf = window.requestAnimationFrame(() => {
      resizeRaf = 0;
      window.dispatchEvent(new Event("resize"));
      window.dispatchEvent(new CustomEvent("ppccr:home-shell-sync"));
    });
  };

  const syncShellState = () => {
    const nextState = {
      shell: mqShell.matches,
      tablet: mqTablet.matches,
      authLocked: body.classList.contains("is-auth-locked"),
      banner: body.classList.contains("has-user-banner"),
    };

    body.classList.toggle("is-home-shell", nextState.shell);
    body.classList.toggle("is-home-shell-tablet", nextState.tablet);
    body.classList.toggle(
      "is-home-shell-phone",
      nextState.shell && !nextState.tablet,
    );

    if (
      nextState.shell !== lastState.shell ||
      nextState.tablet !== lastState.tablet ||
      nextState.authLocked !== lastState.authLocked ||
      nextState.banner !== lastState.banner
    ) {
      emitLayoutSync();
      lastState = nextState;
    }
  };

  const bindMediaChange = (mq) => {
    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", syncShellState);
    } else if (typeof mq.addListener === "function") {
      mq.addListener(syncShellState);
    }
  };

  bindMediaChange(mqShell);
  bindMediaChange(mqTablet);

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
