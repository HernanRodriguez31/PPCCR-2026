"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const ui = window.PPCCR && window.PPCCR.ui;
  if (!ui) return;

  ui.initFixedHeaderOffset({
    headerSelector: ".em-hero.site-header.site-topbar",
    cssVar: "--em-fixed-header-h",
    min: 120,
    max: 320,
  });

  ui.initBackToTopButton({
    buttonId: "back-to-top",
    threshold: 130,
  });

  ui.initTogglePopover({
    wrapSelector: ".kf-role-legend",
    triggerId: "em-role-legend-trigger",
    popoverId: "em-role-legend-popover",
  });

  ui.initTogglePopover({
    wrapSelector: ".kf-inline-hint",
    triggerId: "em-coldchain-trigger",
    popoverId: "em-coldchain-tooltip",
  });

  const stepAccordion = ui.createAccordion({
    root: "[data-em-step-accordion]",
    itemSelector: ".em-step-card",
    triggerSelector: ".em-accordion__trigger",
    panelSelector: ".em-accordion__panel",
    singleOpen: false,
  });

  ui.createAccordion({
    root: "[data-em-faq-accordion]",
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
