"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const wrap = document.querySelector(".raci-tooltip-wrap");
  const trigger = document.getElementById("raci-info-trigger");
  const tooltip = document.getElementById("raci-tooltip");
  const accordionToggle = document.getElementById("raci-toggle");
  const panel = document.getElementById("raci-panel");

  if (!wrap || !trigger || !tooltip || !accordionToggle || !panel) return;

  let lockedOpen = false;

  function isAccordionOpen() {
    return accordionToggle.getAttribute("aria-expanded") === "true";
  }

  function setAccordion(open) {
    accordionToggle.setAttribute("aria-expanded", open ? "true" : "false");

    if (open) {
      panel.hidden = false;
      window.requestAnimationFrame(() => {
        panel.classList.add("is-open");
      });
      return;
    }

    panel.classList.remove("is-open");
    forceCloseTooltip();

    const closePanel = () => {
      if (!isAccordionOpen()) {
        panel.hidden = true;
      }
    };

    panel.addEventListener(
      "transitionend",
      (event) => {
        if (event.target === panel && event.propertyName === "max-height") {
          closePanel();
        }
      },
      { once: true },
    );

    window.setTimeout(closePanel, 260);
  }

  function setPlacement() {
    const triggerRect = trigger.getBoundingClientRect();
    const tooltipWidth = tooltip.offsetWidth || 320;
    const tooltipHeight = tooltip.offsetHeight || 180;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const spaceRight = viewportWidth - triggerRect.right;
    const spaceLeft = triggerRect.left;
    const spaceBottom = viewportHeight - triggerRect.bottom;

    let placement = "right";

    if (spaceRight < tooltipWidth + 24) {
      if (spaceLeft >= tooltipWidth + 24) {
        placement = "left";
      } else if (spaceBottom >= tooltipHeight + 20) {
        placement = "bottom";
      } else {
        placement = "bottom";
      }
    }

    wrap.dataset.placement = placement;
  }

  function openTooltip({ lock = false } = {}) {
    if (panel.hidden) return;

    if (lock) {
      lockedOpen = true;
    }

    setPlacement();
    wrap.classList.add("is-open");
    trigger.setAttribute("aria-expanded", "true");
  }

  function closeTooltip({ force = false } = {}) {
    if (!force && lockedOpen) return;

    wrap.classList.remove("is-open");
    trigger.setAttribute("aria-expanded", "false");

    if (force) {
      lockedOpen = false;
    }
  }

  function forceCloseTooltip() {
    closeTooltip({ force: true });
  }

  accordionToggle.addEventListener("click", () => {
    setAccordion(!isAccordionOpen());
  });

  trigger.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (lockedOpen && wrap.classList.contains("is-open")) {
      forceCloseTooltip();
      return;
    }

    openTooltip({ lock: true });
  });

  trigger.addEventListener("focus", () => {
    if (!wrap.classList.contains("is-open")) {
      openTooltip();
    }
  });

  trigger.addEventListener("blur", () => {
    window.setTimeout(() => {
      const stillInside = wrap.contains(document.activeElement);
      if (!stillInside && !wrap.matches(":hover") && !lockedOpen) {
        forceCloseTooltip();
      }
    }, 0);
  });

  wrap.addEventListener("mouseenter", () => {
    if (!lockedOpen) {
      openTooltip();
    }
  });

  wrap.addEventListener("mouseleave", () => {
    const stillInside = wrap.contains(document.activeElement);
    if (!lockedOpen && !stillInside) {
      forceCloseTooltip();
    }
  });

  document.addEventListener("click", (event) => {
    if (!wrap.classList.contains("is-open")) return;
    if (wrap.contains(event.target)) return;
    forceCloseTooltip();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (wrap.classList.contains("is-open")) {
        event.preventDefault();
        forceCloseTooltip();
        trigger.focus();
        return;
      }
    }
  });

  window.addEventListener("resize", () => {
    if (wrap.classList.contains("is-open")) {
      setPlacement();
    }
  });

  window.addEventListener(
    "scroll",
    () => {
      if (wrap.classList.contains("is-open")) {
        setPlacement();
      }
    },
    { passive: true },
  );

  panel.hidden = true;
  panel.classList.remove("is-open");
  accordionToggle.setAttribute("aria-expanded", "false");
  trigger.setAttribute("aria-expanded", "false");
});
