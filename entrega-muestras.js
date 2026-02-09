"use strict";

document.addEventListener("DOMContentLoaded", () => {
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
  initStepAccordion();
});

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
