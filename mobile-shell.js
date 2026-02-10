"use strict";

(() => {
  const body = document.body;
  if (!body || !body.classList.contains("page-internal")) return;

  const root = document.documentElement;
  const header = document.querySelector(".site-header.site-topbar");
  const dock = document.getElementById("mobile-fixed-dock");
  const backToTop = document.getElementById("back-to-top");
  const mq = window.matchMedia("(max-width: 520px)");
  const COMPACT_Y = 28;

  let lastCompact = null;
  let scrollRaf = 0;

  const measureShell = () => {
    if (!mq.matches) {
      root.style.removeProperty("--mobile-header-h");
      root.style.removeProperty("--mobile-dock-h");
      root.style.removeProperty("--dock-h");
      return;
    }

    const headerH = header
      ? Math.max(0, Math.round(header.getBoundingClientRect().height))
      : 0;
    const dockH = dock
      ? Math.max(0, Math.round(dock.getBoundingClientRect().height))
      : 0;

    root.style.setProperty("--mobile-header-h", `${headerH}px`);
    root.style.setProperty("--mobile-dock-h", `${dockH}px`);
    root.style.setProperty("--dock-h", `${dockH}px`);
    root.style.setProperty("--header-offset", `${Math.max(88, headerH + 12)}px`);
  };

  const toggleCompact = (shouldCompact) => {
    if (!mq.matches || shouldCompact === lastCompact) return;

    lastCompact = shouldCompact;
    body.classList.toggle("is-header-compact", shouldCompact);
    if (header) header.classList.toggle("is-compact", shouldCompact);

    window.requestAnimationFrame(measureShell);
  };

  const syncState = () => {
    if (!mq.matches) {
      lastCompact = null;
      body.classList.remove("is-header-compact");
      if (header) header.classList.remove("is-compact");
      measureShell();
      return;
    }

    lastCompact = null;
    toggleCompact(window.scrollY > COMPACT_Y);
    measureShell();
  };

  const onScroll = () => {
    if (!mq.matches) return;

    const shouldCompact = window.scrollY > COMPACT_Y;
    if (shouldCompact === lastCompact) return;

    if (scrollRaf) return;
    scrollRaf = window.requestAnimationFrame(() => {
      scrollRaf = 0;
      toggleCompact(shouldCompact);
    });
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", measureShell, { passive: true });
  window.addEventListener("orientationchange", measureShell, { passive: true });

  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", measureShell, {
      passive: true,
    });
  }

  if (typeof mq.addEventListener === "function") {
    mq.addEventListener("change", syncState);
  } else if (typeof mq.addListener === "function") {
    mq.addListener(syncState);
  }

  if ("ResizeObserver" in window) {
    const ro = new ResizeObserver(() => measureShell());
    if (header) ro.observe(header);
    if (dock) ro.observe(dock);
  }

  if (backToTop) {
    let btRaf = 0;

    const syncBackToTop = () => {
      backToTop.classList.toggle("is-visible", window.scrollY > 140);
    };

    window.addEventListener(
      "scroll",
      () => {
        if (btRaf) return;
        btRaf = window.requestAnimationFrame(() => {
          btRaf = 0;
          syncBackToTop();
        });
      },
      { passive: true },
    );

    backToTop.addEventListener("click", (event) => {
      if (backToTop.getAttribute("href") !== "#top") return;
      event.preventDefault();
      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      window.scrollTo({ top: 0, left: 0, behavior: reduceMotion ? "auto" : "smooth" });
    });

    syncBackToTop();
  }

  window.addEventListener(
    "load",
    () => {
      window.requestAnimationFrame(() => {
        syncState();
        measureShell();
      });
    },
    { once: true },
  );

  syncState();
})();
