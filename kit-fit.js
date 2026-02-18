"use strict";

document.addEventListener("DOMContentLoaded", () => {
  initFixedHeaderOffset();
  initBackToTopButton();
  initTogglePopover({
    wrapSelector: ".kf-inline-hint",
    triggerId: "kf-coldchain-trigger",
    popoverId: "kf-coldchain-tooltip",
  });
  initTogglePopover({
    wrapSelector: ".kf-role-legend",
    triggerId: "kf-role-legend-trigger",
    popoverId: "kf-role-legend-popover",
  });
  initStepAccordion();
  initMediaModal();
});

function initFixedHeaderOffset() {
  const header = document.querySelector(".kf-hero.site-header.site-topbar");
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
    root.style.setProperty("--kf-fixed-header-h", `${height}px`);
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

function initStepAccordion() {
  const steps = Array.from(document.querySelectorAll(".kf-steps .kf-step"));
  if (steps.length === 0) return;

  steps.forEach((step) => {
    step.addEventListener("toggle", () => {
      if (!step.open) return;

      steps.forEach((otherStep) => {
        if (otherStep === step || !otherStep.open) return;
        otherStep.open = false;
      });
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

function initMediaModal() {
  const triggers = Array.from(document.querySelectorAll("[data-kf-preview]"));
  const modal = document.getElementById("kf-media-modal");
  const image = document.getElementById("kf-media-modal-image");
  const title = document.getElementById("kf-media-modal-title");
  const openLink = document.getElementById("kf-media-modal-open");
  const closeButton = document.getElementById("kf-media-modal-close");
  const overlay = modal?.querySelector("[data-kf-modal-close='overlay']");

  if (
    triggers.length === 0 ||
    !modal ||
    !image ||
    !title ||
    !openLink ||
    !closeButton ||
    !overlay
  ) {
    return;
  }

  let lastFocused = null;

  function openModal({ src, label, alt }) {
    lastFocused = document.activeElement;
    image.src = src;
    image.alt = alt || label || "Imagen ampliada";
    title.textContent = label || "Vista ampliada";
    openLink.href = src;

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    closeButton.focus();
  }

  function closeModal({ returnFocus = false } = {}) {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.documentElement.style.overflow = "";
    document.body.style.overflow = "";

    // Limpia después de cerrar para evitar parpadeo en transición.
    window.setTimeout(() => {
      if (modal.classList.contains("is-open")) return;
      image.src = "";
      image.alt = "";
      openLink.href = "#";
    }, 180);

    if (returnFocus && lastFocused && typeof lastFocused.focus === "function") {
      lastFocused.focus();
    }
  }

  triggers.forEach((trigger) => {
    trigger.addEventListener("click", (event) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const src = trigger.getAttribute("href") || trigger.dataset.kfPreviewSrc;
      if (!src) return;

      const label =
        trigger.dataset.kfPreviewTitle || trigger.textContent?.trim();
      const alt = trigger.dataset.kfPreviewAlt || label;

      event.preventDefault();
      openModal({ src, label, alt });
    });
  });

  closeButton.addEventListener("click", () => {
    closeModal({ returnFocus: true });
  });

  overlay.addEventListener("click", () => {
    closeModal({ returnFocus: true });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (!modal.classList.contains("is-open")) return;
    event.preventDefault();
    closeModal({ returnFocus: true });
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
