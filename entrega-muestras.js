"use strict";

document.addEventListener("DOMContentLoaded", () => {
  initFixedHeaderOffset();
  initBackToTopButton();
  initTogglePopover({
    wrapSelector: ".kf-role-legend",
    triggerId: "em-role-legend-trigger",
    popoverId: "em-role-legend-popover",
  });
  initTogglePopover({
    wrapSelector: ".kf-inline-hint",
    triggerId: "em-coldchain-trigger",
    popoverId: "em-coldchain-tooltip",
  });

  const stepAccordion = initAccordion({
    rootSelector: "[data-em-step-accordion]",
    itemSelector: ".em-step-card",
    triggerSelector: ".em-accordion__trigger",
    panelSelector: ".em-accordion__panel",
    singleOpen: false,
  });

  initAccordion({
    rootSelector: "[data-em-faq-accordion]",
    itemSelector: ".em-faq__item",
    triggerSelector: ".em-faq__trigger",
    panelSelector: ".em-faq__panel",
    singleOpen: false,
  });

  if (stepAccordion) {
    initStepControls(stepAccordion);
    initStepDeepLink(stepAccordion);
    initChecklistLinks(stepAccordion);
  }
});

function initFixedHeaderOffset() {
  const header = document.querySelector(".em-hero.site-header.site-topbar");
  if (!(header instanceof HTMLElement)) return;

  const root = document.documentElement;
  let raf = 0;

  const sync = () => {
    raf = 0;
    const measured = Math.max(
      Math.round(header.getBoundingClientRect().height),
      header.offsetHeight || 0,
      header.scrollHeight || 0,
    );
    const height = Math.min(320, Math.max(120, measured));
    root.style.setProperty("--em-fixed-header-h", `${height}px`);
  };

  const schedule = () => {
    if (raf) return;
    raf = window.requestAnimationFrame(sync);
  };

  schedule();
  window.addEventListener("resize", schedule, { passive: true });
  window.addEventListener("orientationchange", schedule, { passive: true });
  window.addEventListener("load", schedule, { once: true });

  if ("ResizeObserver" in window) {
    const observer = new ResizeObserver(() => schedule());
    observer.observe(header);
  }
}

function initAccordion({
  rootSelector,
  itemSelector,
  triggerSelector,
  panelSelector,
  singleOpen = false,
}) {
  const root = document.querySelector(rootSelector);
  if (!root) return null;

  const items = Array.from(root.querySelectorAll(itemSelector));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function getParts(item) {
    const trigger = item.querySelector(triggerSelector);
    const panel = item.querySelector(panelSelector);
    if (!trigger || !panel) return null;
    return { trigger, panel };
  }

  function setExpanded(item, expanded) {
    const parts = getParts(item);
    if (!parts) return;

    parts.trigger.setAttribute("aria-expanded", expanded ? "true" : "false");
    parts.panel.hidden = !expanded;
    item.classList.toggle("is-open", expanded);

    if (expanded && singleOpen) {
      items.forEach((other) => {
        if (other === item) return;
        const otherParts = getParts(other);
        if (!otherParts) return;
        otherParts.trigger.setAttribute("aria-expanded", "false");
        otherParts.panel.hidden = true;
        other.classList.remove("is-open");
      });
    }
  }

  function toggleItem(item) {
    const parts = getParts(item);
    if (!parts) return;
    const expanded = parts.trigger.getAttribute("aria-expanded") === "true";
    setExpanded(item, !expanded);
  }

  items.forEach((item) => {
    const parts = getParts(item);
    if (!parts) return;

    const expanded = parts.trigger.getAttribute("aria-expanded") === "true";
    parts.panel.hidden = !expanded;
    item.classList.toggle("is-open", expanded);

    parts.trigger.addEventListener("click", () => {
      toggleItem(item);
    });
  });

  return {
    items,
    setExpanded,
    expandAll() {
      items.forEach((item) => setExpanded(item, true));
    },
    collapseAll() {
      items.forEach((item) => setExpanded(item, false));
    },
    openById(id, { scroll = false } = {}) {
      const cleanId = String(id || "").replace(/^#/, "");
      const item = cleanId ? document.getElementById(cleanId) : null;
      if (!item || !items.includes(item)) return false;

      setExpanded(item, true);
      if (scroll) {
        item.scrollIntoView({
          behavior: reduceMotion ? "auto" : "smooth",
          block: "start",
        });
      }
      return true;
    },
  };
}

function initStepControls(accordion) {
  const openAllButton = document.getElementById("em-open-all");
  const closeAllButton = document.getElementById("em-close-all");

  if (openAllButton) {
    openAllButton.addEventListener("click", () => {
      accordion.expandAll();
    });
  }

  if (closeAllButton) {
    closeAllButton.addEventListener("click", () => {
      accordion.collapseAll();
    });
  }
}

function initStepDeepLink(accordion) {
  function applyHash({ scroll = true } = {}) {
    const hash = window.location.hash;
    if (!hash || !hash.startsWith("#paso-")) return;
    accordion.openById(hash, { scroll });
  }

  window.setTimeout(() => {
    applyHash({ scroll: true });
  }, 0);
  window.addEventListener("hashchange", () => {
    applyHash({ scroll: true });
  });
}

function initChecklistLinks(accordion) {
  const links = Array.from(document.querySelectorAll('.em-check-item[href^="#paso-"]'));
  if (links.length === 0) return;

  links.forEach((link) => {
    link.addEventListener("click", (event) => {
      const href = link.getAttribute("href");
      if (!href) return;

      event.preventDefault();
      const opened = accordion.openById(href, { scroll: true });
      if (!opened) return;

      if (window.location.hash !== href) {
        history.pushState(null, "", href);
      }
    });
  });
}

function initTogglePopover({ wrapSelector, triggerId, popoverId }) {
  const wrap = document.querySelector(wrapSelector);
  const trigger = document.getElementById(triggerId);
  const popover = document.getElementById(popoverId);
  if (!wrap || !trigger || !popover) return;

  let lockedOpen = false;

  function open({ lock = false } = {}) {
    if (lock) lockedOpen = true;
    popover.hidden = false;
    trigger.setAttribute("aria-expanded", "true");
  }

  function close({ force = false, returnFocus = false } = {}) {
    if (!force && lockedOpen) return;
    popover.hidden = true;
    trigger.setAttribute("aria-expanded", "false");
    if (force) lockedOpen = false;
    if (returnFocus) trigger.focus();
  }

  trigger.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    const expanded = trigger.getAttribute("aria-expanded") === "true";
    if (expanded && lockedOpen) {
      close({ force: true });
      return;
    }
    open({ lock: true });
  });

  wrap.addEventListener("mouseenter", () => {
    if (!lockedOpen) open();
  });

  wrap.addEventListener("mouseleave", () => {
    if (!lockedOpen) close({ force: true });
  });

  trigger.addEventListener("focus", () => {
    open();
  });

  trigger.addEventListener("blur", () => {
    window.setTimeout(() => {
      const activeInside = wrap.contains(document.activeElement);
      if (!activeInside && !wrap.matches(":hover") && !lockedOpen) {
        close({ force: true });
      }
    }, 0);
  });

  document.addEventListener("click", (event) => {
    if (popover.hidden) return;
    if (event.target instanceof Node && wrap.contains(event.target)) return;
    close({ force: true });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (popover.hidden) return;
    event.preventDefault();
    close({ force: true, returnFocus: true });
  });
}

function initBackToTopButton() {
  const btn = document.getElementById("back-to-top");
  if (!btn) return;

  const threshold = 130;
  let lastY = window.scrollY;
  let ticking = false;

  const sync = () => {
    const currentY = window.scrollY;
    const scrollingDown = currentY > lastY + 2;
    const scrollingUp = currentY < lastY - 2;

    if (currentY <= threshold) {
      btn.classList.remove("is-visible");
    } else if (scrollingDown) {
      btn.classList.add("is-visible");
    } else if (scrollingUp) {
      btn.classList.remove("is-visible");
    }

    lastY = currentY;
  };

  sync();
  window.addEventListener(
    "scroll",
    () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        sync();
        ticking = false;
      });
    },
    { passive: true },
  );

  btn.addEventListener("click", (event) => {
    event.preventDefault();

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: reduceMotion ? "auto" : "smooth",
    });

    if (location.hash === "#top") {
      history.replaceState(null, "", `${location.pathname}${location.search}`);
    }
  });
}
