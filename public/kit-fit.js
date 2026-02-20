"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const ui = window.PPCCR && window.PPCCR.ui;
  if (!ui) return;

  ui.initFixedHeaderOffset({
    headerSelector: ".kf-hero.site-header.site-topbar",
    cssVar: "--kf-fixed-header-h",
    min: 120,
    max: 320,
  });

  ui.initBackToTopButton({
    buttonId: "back-to-top",
    threshold: 130,
  });

  ui.initTogglePopover({
    wrapSelector: ".kf-inline-hint",
    triggerId: "kf-coldchain-trigger",
    popoverId: "kf-coldchain-tooltip",
  });

  ui.initTogglePopover({
    wrapSelector: ".kf-role-legend",
    triggerId: "kf-role-legend-trigger",
    popoverId: "kf-role-legend-popover",
  });

  ui.initDetailsSingleOpen({
    rootSelector: ".kf-steps",
    detailsSelector: ".kf-step",
  });

  ui.initMediaModal({
    triggerSelector: "[data-kf-preview]",
    modalId: "kf-media-modal",
    imageId: "kf-media-modal-image",
    titleId: "kf-media-modal-title",
    openLinkId: "kf-media-modal-open",
    closeButtonId: "kf-media-modal-close",
    overlaySelector: "[data-kf-modal-close='overlay']",
  });
});
