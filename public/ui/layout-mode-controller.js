"use strict";

(() => {
  const rootApi = (window.PPCCR = window.PPCCR || {});
  if (rootApi.layout && typeof rootApi.layout.getState === "function") {
    rootApi.layout.sync({ force: true, reason: "duplicate-load" });
    return;
  }

  const listeners = new Set();
  const mediaQueries = Object.freeze({
    anyHover: window.matchMedia("(any-hover: hover)"),
    hover: window.matchMedia("(hover: hover)"),
    anyFine: window.matchMedia("(any-pointer: fine)"),
    fine: window.matchMedia("(pointer: fine)"),
    anyCoarse: window.matchMedia("(any-pointer: coarse)"),
    coarse: window.matchMedia("(pointer: coarse)"),
  });
  const state = {
    mode: "desktop",
    density: "desktop-wide",
    isDesktop: true,
    isTablet: false,
    isPhone: false,
    isHandheld: false,
    viewportWidth: 0,
    viewportHeight: 0,
    screenShortSide: 0,
    hasHover: false,
    hasFinePointer: false,
    hasCoarsePointer: false,
    maxTouchPoints: 0,
  };

  function getBody() {
    return document.body || null;
  }

  function readPlatform() {
    const ua = String(navigator.userAgent || "").toLowerCase();
    const platform = String(
      navigator.userAgentData?.platform || navigator.platform || "",
    ).toLowerCase();
    const maxTouchPoints = Number(navigator.maxTouchPoints || 0);
    const hasHover =
      mediaQueries.anyHover.matches || mediaQueries.hover.matches;
    const hasFinePointer =
      mediaQueries.anyFine.matches || mediaQueries.fine.matches;
    const hasCoarsePointer =
      mediaQueries.anyCoarse.matches || mediaQueries.coarse.matches;
    const isIpadOs = platform.includes("mac") && maxTouchPoints > 1;
    const isAndroid = ua.includes("android");
    const isIPhone = ua.includes("iphone");
    const isIPad = ua.includes("ipad") || isIpadOs;
    const isIOS = isIPhone || isIPad;
    const isMobileUa = /\bmobile\b/.test(ua);
    const isDesktopPlatform =
      /(mac|win|linux|x11|cros)/.test(platform) && !isIpadOs;
    const screenWidth = Number(window.screen?.width || window.innerWidth || 0);
    const screenHeight = Number(
      window.screen?.height || window.innerHeight || 0,
    );
    const screenShortSide = Math.max(
      0,
      Math.min(screenWidth || 0, screenHeight || 0),
    );

    return {
      hasHover,
      hasFinePointer,
      hasCoarsePointer,
      isAndroid,
      isDesktopPlatform,
      isIOS,
      isIPad,
      isIpadOs,
      isIPhone,
      isMobileUa,
      maxTouchPoints,
      screenShortSide,
      viewportHeight: Math.max(
        0,
        Number(window.innerHeight || document.documentElement?.clientHeight || 0),
      ),
      viewportWidth: Math.max(
        0,
        Number(window.innerWidth || document.documentElement?.clientWidth || 0),
      ),
    };
  }

  function resolveMode(platformState) {
    const {
      hasHover,
      hasFinePointer,
      hasCoarsePointer,
      isAndroid,
      isDesktopPlatform,
      isIOS,
      isIpadOs,
      isMobileUa,
      maxTouchPoints,
      screenShortSide,
    } = platformState;
    const isHandheldContext =
      isAndroid || isIOS || isMobileUa || hasCoarsePointer || maxTouchPoints > 0;

    if (!isIpadOs && hasHover && hasFinePointer && isDesktopPlatform) {
      return "desktop";
    }

    if (!isHandheldContext && isDesktopPlatform) {
      return "desktop";
    }

    if (screenShortSide >= 768) {
      return "tablet";
    }

    return "phone";
  }

  function resolveDensity(mode, viewportWidth) {
    if (mode !== "desktop") return "";
    if (viewportWidth >= 1440) return "desktop-wide";
    if (viewportWidth >= 1100) return "desktop-compact";
    return "desktop-narrow";
  }

  function buildSnapshot() {
    const platformState = readPlatform();
    const mode = resolveMode(platformState);
    const density = resolveDensity(mode, platformState.viewportWidth);

    return {
      mode,
      density,
      isDesktop: mode === "desktop",
      isTablet: mode === "tablet",
      isPhone: mode === "phone",
      isHandheld: mode === "tablet" || mode === "phone",
      viewportWidth: platformState.viewportWidth,
      viewportHeight: platformState.viewportHeight,
      screenShortSide: platformState.screenShortSide,
      hasHover: platformState.hasHover,
      hasFinePointer: platformState.hasFinePointer,
      hasCoarsePointer: platformState.hasCoarsePointer,
      maxTouchPoints: platformState.maxTouchPoints,
    };
  }

  function applyBodyState(nextState) {
    const body = getBody();
    if (!body) return;

    body.classList.toggle("layout-mode-desktop", nextState.mode === "desktop");
    body.classList.toggle("layout-mode-tablet", nextState.mode === "tablet");
    body.classList.toggle("layout-mode-phone", nextState.mode === "phone");
    body.classList.toggle("layout-handheld", nextState.isHandheld);
    body.classList.toggle("layout-density-desktop-wide", nextState.density === "desktop-wide");
    body.classList.toggle(
      "layout-density-desktop-compact",
      nextState.density === "desktop-compact",
    );
    body.classList.toggle(
      "layout-density-desktop-narrow",
      nextState.density === "desktop-narrow",
    );

    body.dataset.layoutMode = nextState.mode;
    if (nextState.density) {
      body.dataset.layoutDensity = nextState.density;
    } else {
      delete body.dataset.layoutDensity;
    }
  }

  function snapshotsEqual(nextState, previousState) {
    return (
      nextState.mode === previousState.mode &&
      nextState.density === previousState.density &&
      nextState.viewportWidth === previousState.viewportWidth &&
      nextState.viewportHeight === previousState.viewportHeight &&
      nextState.screenShortSide === previousState.screenShortSide &&
      nextState.hasHover === previousState.hasHover &&
      nextState.hasFinePointer === previousState.hasFinePointer &&
      nextState.hasCoarsePointer === previousState.hasCoarsePointer &&
      nextState.maxTouchPoints === previousState.maxTouchPoints
    );
  }

  function notify(nextState, previousState, reason) {
    const detail = Object.freeze({
      ...nextState,
      previousMode: previousState.mode,
      previousDensity: previousState.density,
      modeChanged: nextState.mode !== previousState.mode,
      densityChanged: nextState.density !== previousState.density,
      reason,
    });

    window.dispatchEvent(
      new CustomEvent("ppccr:layout-mode-change", {
        detail,
      }),
    );

    listeners.forEach((listener) => {
      try {
        listener(detail);
      } catch (error) {
        console.error("[layout-mode] listener error", error);
      }
    });
  }

  function sync(options = {}) {
    const { force = false, reason = "sync" } = options;
    const previousState = { ...state };
    const nextState = buildSnapshot();

    Object.assign(state, nextState);
    applyBodyState(state);

    if (force || !snapshotsEqual(nextState, previousState)) {
      notify({ ...state }, previousState, reason);
    }

    return { ...state };
  }

  function addListener(listener) {
    if (typeof listener !== "function") return () => {};
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  rootApi.layout = Object.freeze({
    addListener,
    getState() {
      return { ...state };
    },
    sync,
  });

  const onViewportChange = () => {
    sync({ reason: "viewport-change" });
  };

  Object.values(mediaQueries).forEach((mediaQuery) => {
    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", onViewportChange);
    } else if (typeof mediaQuery.addListener === "function") {
      mediaQuery.addListener(onViewportChange);
    }
  });

  window.addEventListener("resize", onViewportChange, { passive: true });
  window.addEventListener("orientationchange", onViewportChange, {
    passive: true,
  });
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", onViewportChange, {
      passive: true,
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      () => {
        sync({ force: true, reason: "dom-content-loaded" });
      },
      { once: true },
    );
  } else {
    sync({ force: true, reason: "init" });
  }
})();
