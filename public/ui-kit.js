"use strict";

(function attachUiKit(windowRef) {
  if (!windowRef || !windowRef.document) return;

  const documentRef = windowRef.document;
  const rootApi = (windowRef.PPCCR = windowRef.PPCCR || {});
  const uiApi = (rootApi.ui = rootApi.ui || {});

  function asFinite(value, fallback) {
    return Number.isFinite(value) ? Number(value) : fallback;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function prefersReducedMotion() {
    return (
      typeof windowRef.matchMedia === "function" &&
      windowRef.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }

  function safeFocus(node) {
    if (node && typeof node.focus === "function") {
      node.focus();
    }
  }

  function resolveRoot(root) {
    if (typeof root === "string") return documentRef.querySelector(root);
    if (root === documentRef) return documentRef;
    if (root instanceof Element) return root;
    return null;
  }

  function addListener(bucket, target, type, handler, options) {
    if (!target || typeof target.addEventListener !== "function") return;
    target.addEventListener(type, handler, options);
    bucket.push(() => target.removeEventListener(type, handler, options));
  }

  function initFixedHeaderOffset({
    headerSelector,
    cssVar,
    min = 120,
    max = 320,
  } = {}) {
    if (typeof headerSelector !== "string" || typeof cssVar !== "string") return null;

    const header = documentRef.querySelector(headerSelector);
    if (!(header instanceof HTMLElement)) return null;

    const minPx = asFinite(min, 120);
    const maxPx = asFinite(max, 320);
    const floor = Math.min(minPx, maxPx);
    const ceil = Math.max(minPx, maxPx);

    const listeners = [];
    let rafId = 0;
    let observer = null;

    const syncNow = () => {
      rafId = 0;
      const measured = Math.max(
        Math.round(header.getBoundingClientRect().height),
        header.offsetHeight || 0,
        header.scrollHeight || 0,
      );
      const height = clamp(measured, floor, ceil);
      documentRef.documentElement.style.setProperty(cssVar, `${height}px`);
    };

    const scheduleSync = () => {
      if (rafId) return;
      rafId = windowRef.requestAnimationFrame(syncNow);
    };

    addListener(listeners, windowRef, "resize", scheduleSync, { passive: true });
    addListener(listeners, windowRef, "orientationchange", scheduleSync, {
      passive: true,
    });
    addListener(listeners, windowRef, "load", scheduleSync, { once: true });

    if ("ResizeObserver" in windowRef) {
      observer = new ResizeObserver(() => scheduleSync());
      observer.observe(header);
    }

    scheduleSync();

    return {
      sync: scheduleSync,
      destroy() {
        if (rafId) {
          windowRef.cancelAnimationFrame(rafId);
          rafId = 0;
        }
        listeners.forEach((off) => off());
        listeners.length = 0;
        if (observer) {
          observer.disconnect();
          observer = null;
        }
      },
    };
  }

  function initBackToTopButton({ buttonId = "back-to-top", threshold = 130 } = {}) {
    if (typeof buttonId !== "string" || !buttonId) return null;
    const button = documentRef.getElementById(buttonId);
    if (!(button instanceof HTMLElement)) return null;

    const thresholdPx = asFinite(threshold, 130);
    const listeners = [];

    let lastY = windowRef.scrollY || 0;
    let ticking = false;

    const syncVisibility = () => {
      const currentY = windowRef.scrollY || 0;
      const scrollingDown = currentY > lastY + 2;
      const scrollingUp = currentY < lastY - 2;

      if (currentY <= thresholdPx) {
        button.classList.remove("is-visible");
      } else if (scrollingDown) {
        button.classList.add("is-visible");
      } else if (scrollingUp) {
        button.classList.remove("is-visible");
      }

      lastY = currentY;
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      windowRef.requestAnimationFrame(() => {
        syncVisibility();
        ticking = false;
      });
    };

    const onClick = (event) => {
      event.preventDefault();
      windowRef.scrollTo({
        top: 0,
        left: 0,
        behavior: prefersReducedMotion() ? "auto" : "smooth",
      });

      if (windowRef.location.hash === "#top") {
        windowRef.history.replaceState(
          null,
          "",
          `${windowRef.location.pathname}${windowRef.location.search}`,
        );
      }
    };

    syncVisibility();
    addListener(listeners, windowRef, "scroll", onScroll, { passive: true });
    addListener(listeners, button, "click", onClick);

    return {
      destroy() {
        listeners.forEach((off) => off());
        listeners.length = 0;
      },
    };
  }

  function initTogglePopover({ wrapSelector, triggerId, popoverId } = {}) {
    if (
      typeof wrapSelector !== "string" ||
      typeof triggerId !== "string" ||
      typeof popoverId !== "string"
    ) {
      return null;
    }

    const wrap = documentRef.querySelector(wrapSelector);
    const trigger = documentRef.getElementById(triggerId);
    const popover = documentRef.getElementById(popoverId);

    if (!(wrap instanceof Element)) return null;
    if (!(trigger instanceof HTMLElement)) return null;
    if (!(popover instanceof HTMLElement)) return null;

    const listeners = [];
    let lockedOpen = false;

    const expanded = trigger.getAttribute("aria-expanded") === "true";
    popover.hidden = !expanded;
    if (!expanded) trigger.setAttribute("aria-expanded", "false");

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
      if (returnFocus) safeFocus(trigger);
    }

    const onTriggerClick = (event) => {
      event.preventDefault();
      event.stopPropagation();
      const isExpanded = trigger.getAttribute("aria-expanded") === "true";
      if (isExpanded && lockedOpen) {
        close({ force: true });
        return;
      }
      open({ lock: true });
    };

    const onTriggerBlur = () => {
      windowRef.setTimeout(() => {
        const activeInside = wrap.contains(documentRef.activeElement);
        if (!activeInside && !wrap.matches(":hover") && !lockedOpen) {
          close({ force: true });
        }
      }, 0);
    };

    const onDocumentClick = (event) => {
      if (popover.hidden) return;
      if (event.target instanceof Node && wrap.contains(event.target)) return;
      close({ force: true });
    };

    const onDocumentKeydown = (event) => {
      if (event.key !== "Escape" || popover.hidden) return;
      event.preventDefault();
      close({ force: true, returnFocus: true });
    };

    addListener(listeners, trigger, "click", onTriggerClick);
    addListener(listeners, wrap, "mouseenter", () => {
      if (!lockedOpen) open();
    });
    addListener(listeners, wrap, "mouseleave", () => {
      if (!lockedOpen) close({ force: true });
    });
    addListener(listeners, trigger, "focus", () => open());
    addListener(listeners, trigger, "blur", onTriggerBlur);
    addListener(listeners, documentRef, "click", onDocumentClick);
    addListener(listeners, documentRef, "keydown", onDocumentKeydown);

    return {
      open,
      close,
      isOpen() {
        return !popover.hidden;
      },
      destroy() {
        listeners.forEach((off) => off());
        listeners.length = 0;
      },
    };
  }

  function createAccordion({
    root,
    itemSelector,
    triggerSelector,
    panelSelector,
    singleOpen = false,
  } = {}) {
    const rootNode = resolveRoot(root);
    if (!rootNode) return null;
    if (
      typeof itemSelector !== "string" ||
      typeof triggerSelector !== "string" ||
      typeof panelSelector !== "string"
    ) {
      return null;
    }

    const items = Array.from(rootNode.querySelectorAll(itemSelector));
    if (items.length === 0) return null;

    const listeners = [];

    function getParts(item) {
      const trigger = item.querySelector(triggerSelector);
      const panel = item.querySelector(panelSelector);
      if (!(trigger instanceof HTMLElement)) return null;
      if (!(panel instanceof HTMLElement)) return null;
      return { trigger, panel };
    }

    function applyState(item, expanded) {
      const parts = getParts(item);
      if (!parts) return false;
      parts.trigger.setAttribute("aria-expanded", expanded ? "true" : "false");
      parts.panel.hidden = !expanded;
      item.classList.toggle("is-open", expanded);
      return true;
    }

    function setExpanded(item, expanded) {
      const changed = applyState(item, !!expanded);
      if (!changed || !expanded || !singleOpen) return changed;

      items.forEach((otherItem) => {
        if (otherItem === item) return;
        applyState(otherItem, false);
      });
      return true;
    }

    function toggle(item) {
      const parts = getParts(item);
      if (!parts) return false;
      const expanded = parts.trigger.getAttribute("aria-expanded") === "true";
      return setExpanded(item, !expanded);
    }

    let firstExpandedSeen = false;
    items.forEach((item) => {
      const parts = getParts(item);
      if (!parts) return;
      let expanded = parts.trigger.getAttribute("aria-expanded") === "true";
      if (singleOpen && expanded) {
        if (firstExpandedSeen) expanded = false;
        firstExpandedSeen = true;
      }
      applyState(item, expanded);
      addListener(listeners, parts.trigger, "click", () => {
        toggle(item);
      });
    });

    return {
      root: rootNode,
      items,
      setExpanded,
      toggle,
      expandAll() {
        if (singleOpen) {
          if (items[0]) setExpanded(items[0], true);
          return;
        }
        items.forEach((item) => setExpanded(item, true));
      },
      collapseAll() {
        items.forEach((item) => setExpanded(item, false));
      },
      openById(id, { scroll = false, focusTrigger = false } = {}) {
        const cleanId = String(id || "").replace(/^#/, "");
        const target = cleanId ? documentRef.getElementById(cleanId) : null;
        if (!target || !items.includes(target)) return false;

        setExpanded(target, true);

        if (scroll) {
          target.scrollIntoView({
            behavior: prefersReducedMotion() ? "auto" : "smooth",
            block: "start",
          });
        }

        if (focusTrigger) {
          const parts = getParts(target);
          if (parts) safeFocus(parts.trigger);
        }

        return true;
      },
      destroy() {
        listeners.forEach((off) => off());
        listeners.length = 0;
      },
    };
  }

  function initDetailsSingleOpen({ rootSelector, detailsSelector } = {}) {
    if (typeof rootSelector !== "string" || typeof detailsSelector !== "string") {
      return null;
    }

    const root = documentRef.querySelector(rootSelector);
    if (!(root instanceof Element)) return null;

    const detailsList = Array.from(root.querySelectorAll(detailsSelector)).filter(
      (node) => node instanceof HTMLDetailsElement,
    );
    if (detailsList.length === 0) return null;

    const listeners = [];

    function syncSummaryAria(detailsEl) {
      const summary = detailsEl.querySelector("summary");
      if (summary instanceof HTMLElement) {
        summary.setAttribute("aria-expanded", detailsEl.open ? "true" : "false");
      }
    }

    let firstOpenSeen = false;
    detailsList.forEach((detailsEl) => {
      if (detailsEl.open) {
        if (firstOpenSeen) detailsEl.open = false;
        firstOpenSeen = true;
      }
      syncSummaryAria(detailsEl);
    });

    detailsList.forEach((detailsEl) => {
      addListener(listeners, detailsEl, "toggle", () => {
        if (detailsEl.open) {
          detailsList.forEach((other) => {
            if (other === detailsEl || !other.open) return;
            other.open = false;
            syncSummaryAria(other);
          });
        }
        syncSummaryAria(detailsEl);
      });
    });

    return {
      root,
      details: detailsList,
      destroy() {
        listeners.forEach((off) => off());
        listeners.length = 0;
      },
    };
  }

  function initMediaModal({
    triggerSelector,
    modalId,
    imageId,
    titleId,
    openLinkId,
    closeButtonId,
    overlaySelector,
  } = {}) {
    if (typeof triggerSelector !== "string" || !triggerSelector) return null;
    if (
      typeof modalId !== "string" ||
      typeof imageId !== "string" ||
      typeof titleId !== "string" ||
      typeof openLinkId !== "string" ||
      typeof closeButtonId !== "string"
    ) {
      return null;
    }

    const triggers = Array.from(documentRef.querySelectorAll(triggerSelector));
    const modal = documentRef.getElementById(modalId);
    const image = documentRef.getElementById(imageId);
    const title = documentRef.getElementById(titleId);
    const openLink = documentRef.getElementById(openLinkId);
    const closeButton = documentRef.getElementById(closeButtonId);
    const overlay =
      modal instanceof Element && typeof overlaySelector === "string"
        ? modal.querySelector(overlaySelector)
        : null;

    if (triggers.length === 0) return null;
    if (!(modal instanceof HTMLElement)) return null;
    if (!(image instanceof HTMLImageElement)) return null;
    if (!(title instanceof HTMLElement)) return null;
    if (!(openLink instanceof HTMLAnchorElement)) return null;
    if (!(closeButton instanceof HTMLElement)) return null;

    const listeners = [];
    let lastFocused = null;
    let cleanupTimer = 0;

    function isOpen() {
      return modal.classList.contains("is-open") && modal.getAttribute("aria-hidden") !== "true";
    }

    function lockScroll() {
      documentRef.documentElement.style.overflow = "hidden";
      documentRef.body.style.overflow = "hidden";
    }

    function unlockScroll() {
      documentRef.documentElement.style.overflow = "";
      documentRef.body.style.overflow = "";
    }

    function clearMediaContent() {
      image.removeAttribute("src");
      image.alt = "";
      openLink.href = "#";
    }

    function scheduleMediaCleanup() {
      if (cleanupTimer) {
        windowRef.clearTimeout(cleanupTimer);
      }
      const delay = prefersReducedMotion() ? 0 : 180;
      cleanupTimer = windowRef.setTimeout(() => {
        cleanupTimer = 0;
        if (!isOpen()) {
          clearMediaContent();
        }
      }, delay);
    }

    function readTriggerPayload(trigger) {
      const src =
        trigger.getAttribute("href") ||
        trigger.getAttribute("data-preview-src") ||
        trigger.getAttribute("data-kf-preview-src") ||
        "";

      let label =
        trigger.getAttribute("data-preview-title") ||
        trigger.getAttribute("data-kf-preview-title") ||
        trigger.getAttribute("aria-label") ||
        "";
      if (!label) {
        label = (trigger.textContent || "").trim();
      }

      const alt =
        trigger.getAttribute("data-preview-alt") ||
        trigger.getAttribute("data-kf-preview-alt") ||
        label ||
        "Imagen ampliada";

      return { src, label, alt };
    }

    function openModal({ src, label, alt }) {
      if (!src) return false;

      if (cleanupTimer) {
        windowRef.clearTimeout(cleanupTimer);
        cleanupTimer = 0;
      }

      lastFocused =
        documentRef.activeElement instanceof HTMLElement ? documentRef.activeElement : null;

      image.src = src;
      image.alt = alt || label || "Imagen ampliada";
      title.textContent = label || "Vista ampliada";
      openLink.href = src;

      modal.classList.add("is-open");
      modal.setAttribute("aria-hidden", "false");
      lockScroll();
      safeFocus(closeButton);
      return true;
    }

    function closeModal({ returnFocus = true } = {}) {
      if (!isOpen()) return;
      modal.classList.remove("is-open");
      modal.setAttribute("aria-hidden", "true");
      unlockScroll();
      scheduleMediaCleanup();
      if (returnFocus && lastFocused) {
        safeFocus(lastFocused);
      }
    }

    triggers.forEach((trigger) => {
      addListener(listeners, trigger, "click", (event) => {
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
        const payload = readTriggerPayload(trigger);
        if (!payload.src) return;
        event.preventDefault();
        openModal(payload);
      });
    });

    addListener(listeners, closeButton, "click", () => {
      closeModal({ returnFocus: true });
    });

    if (overlay instanceof Element) {
      addListener(listeners, overlay, "click", () => {
        closeModal({ returnFocus: true });
      });
    }

    addListener(listeners, documentRef, "keydown", (event) => {
      if (event.key !== "Escape" || !isOpen()) return;
      event.preventDefault();
      closeModal({ returnFocus: true });
    });

    return {
      openModal,
      closeModal,
      destroy() {
        listeners.forEach((off) => off());
        listeners.length = 0;
        if (cleanupTimer) {
          windowRef.clearTimeout(cleanupTimer);
          cleanupTimer = 0;
        }
        unlockScroll();
      },
    };
  }

  uiApi.initFixedHeaderOffset = initFixedHeaderOffset;
  uiApi.initBackToTopButton = initBackToTopButton;
  uiApi.initTogglePopover = initTogglePopover;
  uiApi.createAccordion = createAccordion;
  uiApi.initDetailsSingleOpen = initDetailsSingleOpen;
  uiApi.initMediaModal = initMediaModal;
})(window);
