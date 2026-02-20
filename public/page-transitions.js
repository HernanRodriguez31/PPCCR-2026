"use strict";

(function initPageTransitions(windowRef) {
  const documentRef = windowRef.document;
  const root = documentRef.documentElement;
  const LEAVE_DELAY_MS = 160;
  let leaving = false;

  function prefersReducedMotion() {
    return (
      typeof windowRef.matchMedia === "function" &&
      windowRef.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }

  function isModifiedEvent(event) {
    return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
  }

  function isSameDocument(url) {
    return (
      url.pathname === windowRef.location.pathname &&
      url.search === windowRef.location.search
    );
  }

  documentRef.addEventListener("DOMContentLoaded", () => {
    root.classList.add("is-ready");
  });

  documentRef.addEventListener("click", (event) => {
    if (event.defaultPrevented) return;
    if (event.button !== 0) return;
    if (isModifiedEvent(event)) return;

    const target = event.target;
    if (!(target instanceof Element)) return;

    const anchor = target.closest("a[href]");
    if (!(anchor instanceof HTMLAnchorElement)) return;

    const rawHref = anchor.getAttribute("href") || "";
    if (!rawHref || rawHref.startsWith("#")) return;
    if (anchor.hasAttribute("download")) return;
    if (anchor.target && anchor.target.toLowerCase() !== "_self") return;
    if (/^(mailto:|tel:|javascript:)/i.test(rawHref)) return;
    if (anchor.dataset.noTransition === "true") return;

    let url;
    try {
      url = new URL(anchor.href, windowRef.location.href);
    } catch {
      return;
    }

    if (!/^https?:$/.test(url.protocol)) return;
    if (url.origin !== windowRef.location.origin) return;
    if (isSameDocument(url)) return;

    event.preventDefault();

    if (prefersReducedMotion()) {
      windowRef.location.assign(url.href);
      return;
    }

    if (leaving) return;
    leaving = true;
    root.classList.add("is-leaving");

    windowRef.setTimeout(() => {
      windowRef.location.assign(url.href);
    }, LEAVE_DELAY_MS);
  });

  windowRef.addEventListener("pageshow", () => {
    leaving = false;
    root.classList.remove("is-leaving");
  });
})(window);
