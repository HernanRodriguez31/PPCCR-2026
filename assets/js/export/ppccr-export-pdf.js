const HTML2PDF_BUNDLE_CDN =
  "https://cdn.jsdelivr.net/npm/html2pdf.js@0.10.1/dist/html2pdf.bundle.min.js";
const HTML2CANVAS_CDN =
  "https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js";
const JSPDF_CDN =
  "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js";

const PAGE_A4_MM = {
  width: 210,
  height: 297,
};

const DEFAULT_OPTIONS = {
  headerSelector: "#top",
  dashboardSelector: "#kpi-dashboard-ppccr",
  filenamePrefix: "PPCCR_Reporte",
  desiredScale: 3,
  maxDimPx: 15000,
  maxAreaPx: 160000000,
  marginsMm: { top: 10, right: 10, bottom: 10, left: 10 },
  contentGapMm: 4,
  footerMm: 8,
  headerHeightMultiplier: 1.34,
  repeatHeaderOnEachPage: true,
  ignoreSelectors: [],
  extraCloneCss: "",
  debug: true,
};

const DEFAULT_CLONE_HIDE_SELECTORS = [
  ".mobile-fixed-dock",
  ".back-to-top",
  ".modal",
  ".modal-backdrop",
  "[data-state='loading']",
  "[aria-busy='true']",
  ".kpiDash__reportActions",
  ".kpiDash__reportBtn",
  ".kpiDash__reportBtn--primary",
  ".site-nav",
  "#mobileDockWrap",
  ".nav-toggle",
  ".toast",
  ".snackbar",
  ".tooltip",
  ".tippy-box",
  ".loading-overlay",
];

const PDF_HEADER_VISUAL_ENHANCE_CSS = [
  "#top .partners-bar,",
  "#top .logo-strip.partners-bar {",
  "  padding-top: 10px !important;",
  "  padding-bottom: 10px !important;",
  "}",
  "#top #partner-logos.partners-strip > *,",
  "#top #partner-logos.partners-strip > a,",
  "#top #partner-logos.partners-strip > .partner-logo,",
  "#top #partner-logos.partners-strip > .partner-pill {",
  "  min-height: 44px !important;",
  "}",
].join("\n");

const PDF_DASHBOARD_VISUAL_ENHANCE_CSS = [
  "#kpi-dashboard-ppccr .kpiDash__summaryBar {",
  "  overflow: hidden !important;",
  "}",
  "#kpi-dashboard-ppccr .kpiDash__summaryBarSegment::before,",
  "#kpi-dashboard-ppccr .kpiDash__summaryBarSegment::after {",
  "  content: none !important;",
  "  display: none !important;",
  "}",
  "#kpi-dashboard-ppccr .kpiDash__flowProgress {",
  "  background: linear-gradient(180deg, rgba(227, 238, 251, 0.96), rgba(212, 228, 246, 0.92)) !important;",
  "  border: 1px solid rgba(136, 173, 218, 0.45) !important;",
  "}",
  "#kpi-dashboard-ppccr .kpiDash__flowProgressFill {",
  "  background: linear-gradient(90deg, rgba(26, 96, 168, 0.96), rgba(102, 164, 230, 0.95)) !important;",
  "}",
  "#kpi-dashboard-ppccr .kpiDash__informSplit {",
  "  background: linear-gradient(145deg, rgba(244, 249, 255, 0.95), rgba(225, 237, 252, 0.9)) !important;",
  "  border: 1px solid rgba(181, 204, 232, 0.58) !important;",
  "}",
  "#kpi-dashboard-ppccr .kpiDash__informChip--neg {",
  "  color: #f3f8ff !important;",
  "  background: linear-gradient(145deg, #1f66ad, #2b79c1) !important;",
  "  border-color: rgba(24, 90, 158, 0.72) !important;",
  "}",
  "#kpi-dashboard-ppccr .kpiDash__informChip--pos {",
  "  color: #24568d !important;",
  "  background: linear-gradient(145deg, rgba(224, 237, 252, 0.96), rgba(196, 218, 244, 0.94)) !important;",
  "  border-color: rgba(130, 171, 216, 0.72) !important;",
  "}",
  "#kpi-dashboard-ppccr .kpiDash__trkGaugeOverlay {",
  "  z-index: 7 !important;",
  "}",
  "#kpi-dashboard-ppccr .kpiDash__trkGaugeHit {",
  "  fill: none !important;",
  "  stroke-linecap: round !important;",
  "  pointer-events: none !important;",
  "}",
  "#kpi-dashboard-ppccr .kpiDash__trkGaugeHit--delivered {",
  "  stroke: #1d69b3 !important;",
  "  stroke-width: 14 !important;",
  "}",
  "#kpi-dashboard-ppccr .kpiDash__trkGaugeHit--pending {",
  "  stroke: #d7e6f4 !important;",
  "  stroke-width: 14 !important;",
  "}",
].join("\n");

export async function exportPPCCRToPdf(options = {}) {
  const cfg = normalizeOptions(options);
  const libs = await ensureExportLibs();
  const headerEl = resolveElement(cfg.headerSelector, "Header");
  const dashEl = resolveElement(cfg.dashboardSelector, "Dashboard");

  ensureElementHasSize(headerEl, "Header");
  ensureElementHasSize(dashEl, "Dashboard");

  const resultMeta = {
    fallbackTilesUsed: false,
    tilesCount: 0,
    dashboardCapture: null,
    canvasReport: [],
  };

  try {
    await waitForAssets(headerEl);
    await waitForAssets(dashEl);

    resultMeta.canvasReport = await waitForCanvasStable(dashEl, {
      timeoutMs: cfg.canvasStableTimeoutMs,
      stableFrames: cfg.canvasStableFrames,
    });

    const scaleHeader = computeSafeScale(headerEl, cfg.desiredScale, cfg.maxDimPx);
    const scaleDash = computeSafeScale(dashEl, cfg.desiredScale, cfg.maxDimPx);
    const headerCloneCss = mergeCloneCss(cfg.extraCloneCss, PDF_HEADER_VISUAL_ENHANCE_CSS);
    const dashboardCloneCss = mergeCloneCss(cfg.extraCloneCss, PDF_DASHBOARD_VISUAL_ENHANCE_CSS);

    const headerCanvas = await captureElement(headerEl, {
      html2canvas: libs.html2canvas,
      scale: scaleHeader,
      backgroundColor: "#FFF",
      extraCloneCss: headerCloneCss,
      ignoreSelectors: cfg.ignoreSelectors,
      debug: cfg.debug,
      cloneMutator(clonedDoc) {
        normalizeHeaderForPdfClone(clonedDoc, cfg.headerSelector);
      },
    });

    const pageMetrics = createPageMetrics(cfg);
    const headerHeightMm =
      toHeightMm(headerCanvas, pageMetrics.contentWidthMm) * cfg.headerHeightMultiplier;

    const dashboardAvailMm = getDashboardAvailableMm({
      pageMetrics,
      headerHeightMm,
      footerMm: cfg.footerMm,
      contentGapMm: cfg.contentGapMm,
      repeatHeaderOnEachPage: cfg.repeatHeaderOnEachPage,
      pageIndex: 0,
    });

    let dashboardCanvas = null;
    let primaryDashboardCaptureError = null;

    try {
      dashboardCanvas = await captureElement(dashEl, {
        html2canvas: libs.html2canvas,
        scale: scaleDash,
        backgroundColor: "#FFF",
        extraCloneCss: dashboardCloneCss,
        ignoreSelectors: cfg.ignoreSelectors,
        debug: cfg.debug,
        cloneMutator(clonedDoc) {
          stabilizeTrkGaugeInClone(clonedDoc, cfg.dashboardSelector);
        },
      });
    } catch (error) {
      primaryDashboardCaptureError = error;
      if (cfg.debug) {
        console.warn(
          "[PPCCR PDF] Captura única de dashboard falló. Se intentará fallback por tiles.",
          error,
        );
      }
    }

    let dashboardSlices = null;
    const shouldUseTiles =
      !dashboardCanvas || isCanvasOverLimits(dashboardCanvas, cfg.maxDimPx, cfg.maxAreaPx);

    if (shouldUseTiles) {
      dashboardSlices = await captureDashboardTiles({
        element: dashEl,
        html2canvas: libs.html2canvas,
        scale: scaleDash,
        maxDimPx: cfg.maxDimPx,
        maxAreaPx: cfg.maxAreaPx,
        pageContentWidthMm: pageMetrics.contentWidthMm,
        pageContentHeightMm: dashboardAvailMm,
        extraCloneCss: dashboardCloneCss,
        ignoreSelectors: cfg.ignoreSelectors,
        debug: cfg.debug,
        cloneMutator(clonedDoc) {
          stabilizeTrkGaugeInClone(clonedDoc, cfg.dashboardSelector);
        },
      });

      resultMeta.fallbackTilesUsed = true;
      resultMeta.tilesCount = dashboardSlices.length;
      dashboardCanvas = null;

      if (cfg.debug && primaryDashboardCaptureError) {
        console.log("[PPCCR PDF] Motivo fallback tiles:", primaryDashboardCaptureError.message);
      }
    }

    const doc = new libs.jsPDF({
      orientation: "p",
      unit: "mm",
      format: "a4",
    });

    const renderState = { pageIndex: 0 };

    if (dashboardCanvas) {
      appendCanvasWithPaging({
        doc,
        canvas: dashboardCanvas,
        headerCanvas,
        headerHeightMm,
        cfg,
        pageMetrics,
        renderState,
      });

      resultMeta.dashboardCapture = {
        mode: "single",
        width: dashboardCanvas.width,
        height: dashboardCanvas.height,
        area: dashboardCanvas.width * dashboardCanvas.height,
      };
    } else {
      for (let i = 0; i < dashboardSlices.length; i += 1) {
        appendCanvasWithPaging({
          doc,
          canvas: dashboardSlices[i],
          headerCanvas,
          headerHeightMm,
          cfg,
          pageMetrics,
          renderState,
        });
      }

      resultMeta.dashboardCapture = {
        mode: "tiles",
        width: null,
        height: null,
        area: null,
      };
    }

    applyFooterPageNumbers(doc, pageMetrics, cfg.footerMm);

    const filename = buildFilename(cfg.filenamePrefix, new Date());
    doc.save(filename);

    if (cfg.debug) {
      console.groupCollapsed("[PPCCR PDF] Export debug");
      console.log("canvasReport:", resultMeta.canvasReport);
      console.log("headerCanvas:", {
        width: headerCanvas.width,
        height: headerCanvas.height,
      });
      console.log("dashboardCapture:", resultMeta.dashboardCapture);
      console.log("fallbackTilesUsed:", resultMeta.fallbackTilesUsed);
      console.log("tilesCount:", resultMeta.tilesCount);
      console.groupEnd();
    }

    return {
      filename,
      pages: doc.getNumberOfPages(),
      fallbackTilesUsed: resultMeta.fallbackTilesUsed,
      tilesCount: resultMeta.tilesCount,
      canvasReport: resultMeta.canvasReport,
    };
  } catch (error) {
    console.error("[PPCCR PDF] ERROR", error);
    console.groupCollapsed("[PPCCR PDF] Diagnóstico");
    console.log("canvasReport:", resultMeta.canvasReport);
    console.log("dashboardCapture:", resultMeta.dashboardCapture);
    console.log("fallbackTilesUsed:", resultMeta.fallbackTilesUsed);
    console.log("tilesCount:", resultMeta.tilesCount);
    console.groupEnd();
    window.alert("No se pudo exportar. Ver consola.");
    throw error;
  }
}

export function raf() {
  return new Promise((resolve) => {
    window.requestAnimationFrame(() => resolve());
  });
}

export function sleep(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, Math.max(0, Number(ms) || 0));
  });
}

export function getVisibleCanvases(root) {
  if (!root) {
    return [];
  }

  const canvases = Array.from(root.querySelectorAll("canvas"));
  return canvases.filter((canvas) => {
    const rect = canvas.getBoundingClientRect();
    const style = window.getComputedStyle(canvas);
    return rect.width > 0 && rect.height > 0 && style.display !== "none";
  });
}

export async function waitForCanvasStable(
  root,
  { timeoutMs = 4000, stableFrames = 2 } = {},
) {
  const start = performance.now();
  const requiredStableFrames = Math.max(1, Number(stableFrames) || 1);
  let stableCount = 0;
  let previous = null;

  while (performance.now() - start < timeoutMs) {
    const visibles = getVisibleCanvases(root);
    const state = snapshotCanvases(visibles);

    if (state.length > 0 && previous && areCanvasStatesEqual(previous, state)) {
      stableCount += 1;
    } else {
      stableCount = 0;
    }

    previous = state;

    if (state.length > 0 && stableCount >= requiredStableFrames) {
      return state;
    }

    await raf();
  }

  const all = root ? Array.from(root.querySelectorAll("canvas")) : [];
  const report = all.map((canvas) => {
    const rect = canvas.getBoundingClientRect();
    return {
      selector: selectorForElement(canvas),
      internal: {
        width: canvas.width,
        height: canvas.height,
      },
      rect: normalizeRect(rect),
      display: window.getComputedStyle(canvas).display,
    };
  });

  console.group("[PPCCR PDF] Canvas stability timeout");
  console.log("canvases report:", report);
  console.groupEnd();

  throw new Error("Canvas inestable o con dimensiones inválidas para exportación.");
}

export async function waitForAssets(root) {
  if (!root) {
    return;
  }

  if (document.fonts && document.fonts.ready) {
    try {
      await document.fonts.ready;
    } catch (error) {
      // no-op
    }
  }

  const images = Array.from(root.querySelectorAll("img"));

  await Promise.all(
    images.map(async (img) => {
      if (img.complete && img.naturalWidth > 0) {
        return;
      }

      if (typeof img.decode === "function") {
        try {
          await img.decode();
          if (img.naturalWidth > 0) {
            return;
          }
        } catch (error) {
          // fallback to event listeners below
        }
      }

      await new Promise((resolve) => {
        let done = false;
        const finish = () => {
          if (done) {
            return;
          }
          done = true;
          resolve();
        };

        img.addEventListener("load", finish, { once: true });
        img.addEventListener("error", finish, { once: true });
        window.setTimeout(finish, 2500);
      });
    }),
  );

  await raf();
  await raf();
}

export function computeSafeScale(element, desired = 2, maxDimPx = 15000) {
  const rect = element.getBoundingClientRect();
  const maxDim = Math.max(rect.width, rect.height);

  if (!Number.isFinite(maxDim) || maxDim <= 0) {
    throw new Error("Elemento sin dimensiones válidas para calcular escala segura.");
  }

  const desiredScale = Math.max(1, Number(desired) || 1);
  const dimBound = maxDimPx / maxDim;
  let scale = Math.min(desiredScale, dimBound);

  if (!Number.isFinite(scale) || scale <= 0) {
    scale = 1;
  }

  if (scale < 1) {
    console.warn("[PPCCR PDF] Escala calculada < 1. Se fuerza a 1.", {
      scale,
      maxDim,
      maxDimPx,
      desiredScale,
    });
    return 1;
  }

  return scale;
}

export async function captureElement(
  element,
  {
    html2canvas,
    scale,
    backgroundColor = "#FFF",
    extraCloneCss = "",
    ignoreSelectors = [],
    crop = null,
    cloneMutator = null,
    debug = false,
  } = {},
) {
  if (typeof html2canvas !== "function") {
    throw new Error("html2canvas no disponible en captureElement.");
  }

  const rect = element.getBoundingClientRect();
  const hiddenSelectors = normalizeIgnoreSelectors(ignoreSelectors);

  const options = {
    backgroundColor,
    scale,
    useCORS: true,
    allowTaint: false,
    logging: false,
    foreignObjectRendering: true,
    removeContainer: true,
    onclone(clonedDoc) {
      injectCloneStyles(clonedDoc, {
        hiddenSelectors,
        extraCloneCss,
      });
      if (typeof cloneMutator === "function") {
        cloneMutator(clonedDoc);
      }
    },
  };

  if (crop && Number.isFinite(crop.height) && crop.height > 0) {
    options.x = Math.max(0, Math.floor(crop.x || 0));
    options.y = Math.max(0, Math.floor(crop.y || 0));
    options.width = Math.max(1, Math.ceil(crop.width || rect.width));
    options.height = Math.max(1, Math.ceil(crop.height));
  }

  try {
    const firstCanvas = await html2canvas(element, options);
    if (!isLikelyBlankCanvas(firstCanvas)) {
      return firstCanvas;
    }
    if (debug) {
      console.warn(
        "[PPCCR PDF] Captura potencialmente vacía con foreignObject. Reintentando sin foreignObjectRendering.",
      );
    }
    const fallbackOptions = {
      ...options,
      foreignObjectRendering: false,
    };
    return html2canvas(element, fallbackOptions);
  } catch (primaryError) {
    const fallbackOptions = {
      ...options,
      foreignObjectRendering: false,
    };
    return html2canvas(element, fallbackOptions);
  }
}

async function ensureExportLibs() {
  const html2canvasFn = resolveHtml2Canvas();
  const jsPdfCtor = resolveJsPdfCtor();

  if (html2canvasFn && jsPdfCtor) {
    return {
      html2canvas: html2canvasFn,
      jsPDF: jsPdfCtor,
    };
  }

  if (!window.__ppccrPdfExportLibsPromise) {
    window.__ppccrPdfExportLibsPromise = (async () => {
      try {
        await Promise.all([
          loadScript(HTML2CANVAS_CDN, () => Boolean(resolveHtml2Canvas())),
          loadScript(JSPDF_CDN, () => Boolean(resolveJsPdfCtor())),
        ]);
      } catch (primaryError) {
        // Fallback bundle por si algún CDN puntual está bloqueado.
        await loadScript(
          HTML2PDF_BUNDLE_CDN,
          () =>
            Boolean(resolveHtml2Canvas()) &&
            Boolean(resolveJsPdfCtor()),
        );
      }

      const h2c = resolveHtml2Canvas();
      const ctor = resolveJsPdfCtor();

      if (!h2c || !ctor) {
        throw new Error(
          "No se pudieron inicializar html2canvas/jsPDF desde CDNs disponibles.",
        );
      }

      return {
        html2canvas: h2c,
        jsPDF: ctor,
      };
    })().catch((error) => {
      window.__ppccrPdfExportLibsPromise = null;
      throw error;
    });
  }

  return window.__ppccrPdfExportLibsPromise;
}

function resolveHtml2Canvas() {
  return typeof window.html2canvas === "function" ? window.html2canvas : null;
}

function resolveJsPdfCtor() {
  if (window.jspdf && typeof window.jspdf.jsPDF === "function") {
    return window.jspdf.jsPDF;
  }
  if (typeof window.jsPDF === "function") {
    return window.jsPDF;
  }
  return null;
}

function loadScript(src, validator) {
  if (typeof validator === "function" && validator()) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const existing = Array.from(document.scripts).find((script) => {
      return script.src === src || script.src.indexOf(src) === 0;
    });

    if (existing) {
      if (existing.getAttribute("data-ppccr-loaded") === "1") {
        if (typeof validator === "function" && validator()) {
          resolve();
          return;
        }
      }

      if (typeof validator === "function" && validator()) {
        resolve();
        return;
      }

      let settled = false;
      const finishResolve = () => {
        if (settled) {
          return;
        }
        settled = true;
        resolve();
      };
      const finishReject = (error) => {
        if (settled) {
          return;
        }
        settled = true;
        reject(error);
      };

      const onLoad = () => {
        existing.setAttribute("data-ppccr-loaded", "1");
        if (typeof validator === "function" && !validator()) {
          finishReject(new Error("Script cargado sin objeto esperado: " + src));
          return;
        }
        finishResolve();
      };

      existing.addEventListener("load", onLoad, { once: true });
      existing.addEventListener(
        "error",
        () => finishReject(new Error("No se pudo cargar: " + src)),
        { once: true },
      );
      // Poll corto para el caso de script ya cargado donde no vuelve a disparar load.
      const start = Date.now();
      const poll = () => {
        if (settled) {
          return;
        }
        if (typeof validator === "function" && validator()) {
          finishResolve();
          return;
        }
        if (Date.now() - start >= 5000) {
          finishReject(
            new Error("Script cargado sin objeto esperado: " + src),
          );
          return;
        }
        window.setTimeout(poll, 120);
      };
      poll();

      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.onload = () => {
      script.setAttribute("data-ppccr-loaded", "1");
      if (typeof validator === "function" && !validator()) {
        reject(new Error("Script cargado sin objeto esperado: " + src));
        return;
      }
      resolve();
    };
    script.onerror = () => reject(new Error("No se pudo cargar: " + src));
    document.head.appendChild(script);
  });
}

async function captureDashboardTiles({
  element,
  html2canvas,
  scale,
  maxDimPx,
  maxAreaPx,
  pageContentWidthMm,
  pageContentHeightMm,
  extraCloneCss,
  ignoreSelectors,
  cloneMutator,
  debug,
}) {
  const rect = element.getBoundingClientRect();
  const widthCss = Math.max(1, Math.ceil(rect.width));
  const heightCss = Math.max(1, Math.ceil(rect.height));

  const maxByDimCss = Math.max(1, Math.floor(maxDimPx / scale));
  const maxByAreaCss = Math.max(
    1,
    Math.floor(maxAreaPx / Math.max(1, widthCss * scale * scale)),
  );

  const a4DrivenCss = Math.max(
    64,
    Math.floor((widthCss * Math.max(20, pageContentHeightMm)) / Math.max(20, pageContentWidthMm)),
  );

  const sliceHeightCss = Math.max(
    64,
    Math.min(heightCss, a4DrivenCss, maxByDimCss, maxByAreaCss),
  );

  const slices = [];

  for (let y = 0; y < heightCss; y += sliceHeightCss) {
    const currentHeight = Math.min(sliceHeightCss, heightCss - y);
    const canvas = await captureElement(element, {
      html2canvas,
      scale,
      backgroundColor: "#FFF",
      extraCloneCss,
      ignoreSelectors,
      cloneMutator,
      debug,
      crop: {
        x: 0,
        y,
        width: widthCss,
        height: currentHeight,
      },
    });

    slices.push(canvas);
    await raf();
  }

  return slices;
}

function appendCanvasWithPaging({
  doc,
  canvas,
  headerCanvas,
  headerHeightMm,
  cfg,
  pageMetrics,
  renderState,
}) {
  const sourceWidthPx = Math.max(1, canvas.width);
  const sourceHeightPx = Math.max(1, canvas.height);
  const mmPerPx = pageMetrics.contentWidthMm / sourceWidthPx;

  let sourceY = 0;

  while (sourceY < sourceHeightPx) {
    if (renderState.pageIndex > 0) {
      doc.addPage();
    }

    const shouldRenderHeader = renderState.pageIndex === 0 || cfg.repeatHeaderOnEachPage;

    if (shouldRenderHeader) {
      doc.addImage(
        headerCanvas,
        "PNG",
        pageMetrics.margins.left,
        pageMetrics.margins.top,
        pageMetrics.contentWidthMm,
        headerHeightMm,
      );
    }

    const contentStartY =
      pageMetrics.margins.top +
      (shouldRenderHeader ? headerHeightMm + cfg.contentGapMm : 0);

    const availableMm =
      pageMetrics.pageHeightMm - pageMetrics.margins.bottom - cfg.footerMm - contentStartY;

    if (availableMm <= 0) {
      throw new Error("Área útil de página insuficiente para renderizar dashboard.");
    }

    const sliceHeightPx = Math.max(
      1,
      Math.min(sourceHeightPx - sourceY, Math.floor(availableMm / mmPerPx)),
    );
    const renderHeightMm = sliceHeightPx * mmPerPx;
    const fullCanvasFitsSinglePage = sourceY === 0 && sliceHeightPx === sourceHeightPx;

    if (fullCanvasFitsSinglePage) {
      doc.addImage(
        canvas,
        "PNG",
        pageMetrics.margins.left,
        contentStartY,
        pageMetrics.contentWidthMm,
        renderHeightMm,
      );
    } else {
      const sliceCanvas = document.createElement("canvas");
      sliceCanvas.width = sourceWidthPx;
      sliceCanvas.height = sliceHeightPx;

      const ctx = sliceCanvas.getContext("2d");
      if (!ctx) {
        throw new Error("No se pudo crear contexto 2D para paginado del dashboard.");
      }

      ctx.imageSmoothingEnabled = true;
      if ("imageSmoothingQuality" in ctx) {
        ctx.imageSmoothingQuality = "high";
      }

      ctx.drawImage(
        canvas,
        0,
        sourceY,
        sourceWidthPx,
        sliceHeightPx,
        0,
        0,
        sourceWidthPx,
        sliceHeightPx,
      );

      doc.addImage(
        sliceCanvas,
        "PNG",
        pageMetrics.margins.left,
        contentStartY,
        pageMetrics.contentWidthMm,
        renderHeightMm,
      );
    }

    sourceY += sliceHeightPx;
    renderState.pageIndex += 1;
  }
}

function applyFooterPageNumbers(doc, pageMetrics, footerMm) {
  const total = doc.getNumberOfPages();

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(110, 122, 141);

  for (let i = 1; i <= total; i += 1) {
    doc.setPage(i);
    const y = pageMetrics.pageHeightMm - Math.max(2, footerMm / 2);
    doc.text(
      "Pag " + i + "/" + total,
      pageMetrics.pageWidthMm / 2,
      y,
      { align: "center" },
    );
  }
}

function createPageMetrics(cfg) {
  const margins = cfg.marginsMm;

  return {
    pageWidthMm: PAGE_A4_MM.width,
    pageHeightMm: PAGE_A4_MM.height,
    margins,
    contentWidthMm: PAGE_A4_MM.width - margins.left - margins.right,
  };
}

function getDashboardAvailableMm({
  pageMetrics,
  headerHeightMm,
  footerMm,
  contentGapMm,
  repeatHeaderOnEachPage,
  pageIndex,
}) {
  const withHeader = pageIndex === 0 || repeatHeaderOnEachPage;
  const startY = pageMetrics.margins.top + (withHeader ? headerHeightMm + contentGapMm : 0);

  return pageMetrics.pageHeightMm - pageMetrics.margins.bottom - footerMm - startY;
}

function toHeightMm(canvas, targetWidthMm) {
  return (Math.max(1, canvas.height) * targetWidthMm) / Math.max(1, canvas.width);
}

function isCanvasOverLimits(canvas, maxDimPx, maxAreaPx) {
  const width = Math.max(0, Number(canvas.width) || 0);
  const height = Math.max(0, Number(canvas.height) || 0);
  const area = width * height;

  return width > maxDimPx || height > maxDimPx || area > maxAreaPx;
}

function normalizeOptions(options) {
  const merged = {
    ...DEFAULT_OPTIONS,
    ...options,
    marginsMm: {
      ...DEFAULT_OPTIONS.marginsMm,
      ...(options.marginsMm || {}),
    },
  };

  merged.canvasStableTimeoutMs = Number(options.canvasStableTimeoutMs) || 4000;
  merged.canvasStableFrames = Number(options.canvasStableFrames) || 2;
  merged.headerHeightMultiplier = Math.max(
    1,
    Number(options.headerHeightMultiplier) || DEFAULT_OPTIONS.headerHeightMultiplier,
  );

  return merged;
}

function mergeCloneCss(...chunks) {
  return chunks
    .filter((chunk) => typeof chunk === "string" && chunk.trim().length > 0)
    .join("\n");
}

function normalizeIgnoreSelectors(extraSelectors) {
  const merged = DEFAULT_CLONE_HIDE_SELECTORS.concat(
    Array.isArray(extraSelectors) ? extraSelectors : [],
  );

  return Array.from(new Set(merged.filter(Boolean)));
}

function injectCloneStyles(clonedDoc, { hiddenSelectors, extraCloneCss }) {
  const style = clonedDoc.createElement("style");
  style.setAttribute("data-ppccr-pdf-clone-style", "true");

  const hideRule = hiddenSelectors.length
    ? hiddenSelectors.join(",\n") + " { display: none !important; visibility: hidden !important; }"
    : "";

  style.textContent = [
    "html, body {",
    "  background: #fff !important;",
    "  -webkit-print-color-adjust: exact !important;",
    "  print-color-adjust: exact !important;",
    "}",
    "*, *::before, *::after {",
    "  animation: none !important;",
    "  transition: none !important;",
    "}",
    "#top, #kpis, #kpi-dashboard-ppccr, .kpiDash, .kpiDash__reportRoot {",
    "  background: #fff !important;",
    "}",
    hideRule,
    extraCloneCss || "",
  ]
    .filter(Boolean)
    .join("\n");

  clonedDoc.head.appendChild(style);
}

function normalizeHeaderForPdfClone(clonedDoc, headerSelector) {
  const headerRoot = clonedDoc.querySelector(headerSelector) || clonedDoc.querySelector("#top");
  if (!headerRoot) {
    return;
  }

  headerRoot.classList.remove("is-scrolled", "is-compact", "partners-collapsed");
  headerRoot.classList.add("partners-expanded");
  headerRoot.style.setProperty("transform", "none", "important");
  headerRoot.style.setProperty("top", "0", "important");

  const partnersStrip = headerRoot.querySelector("#partner-logos.partners-strip");
  if (partnersStrip) {
    partnersStrip.style.setProperty("display", "flex", "important");
    partnersStrip.style.setProperty("align-items", "center", "important");
    partnersStrip.style.setProperty("flex-wrap", "nowrap", "important");
    partnersStrip.style.setProperty("gap", "12px", "important");
  }

  headerRoot
    .querySelectorAll("#partner-logos.partners-strip > *, #partner-logos.partners-strip img")
    .forEach((node) => {
      node.style.setProperty("transform", "none", "important");
    });
}

function isLikelyBlankCanvas(canvas) {
  if (!canvas || canvas.width <= 0 || canvas.height <= 0) {
    return true;
  }

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return false;
  }

  const width = canvas.width;
  const height = canvas.height;
  const stepX = Math.max(8, Math.floor(width / 42));
  const stepY = Math.max(8, Math.floor(height / 42));
  const lightThreshold = 248;
  let samples = 0;
  let nonBlank = 0;

  for (let y = 0; y < height; y += stepY) {
    for (let x = 0; x < width; x += stepX) {
      const pixel = ctx.getImageData(x, y, 1, 1).data;
      samples += 1;
      if (
        pixel[3] > 8 &&
        (pixel[0] < lightThreshold || pixel[1] < lightThreshold || pixel[2] < lightThreshold)
      ) {
        nonBlank += 1;
      }
    }
  }

  if (samples === 0) {
    return true;
  }

  const nonBlankRatio = nonBlank / samples;
  return nonBlankRatio < 0.008;
}

function stabilizeTrkGaugeInClone(clonedDoc, dashboardSelector) {
  const scope = clonedDoc.querySelector(dashboardSelector) || clonedDoc;
  if (scope.classList && scope.classList.contains("kpiDash__reportRoot")) {
    scope.classList.add("kpiDash--exporting");
  }
  scope.querySelectorAll(".kpiDash__reportRoot").forEach((node) => {
    node.classList.add("kpiDash--exporting");
  });

  const gauges = Array.from(scope.querySelectorAll(".kpiDash__trkGauge"));

  gauges.forEach((gauge) => {
    const pct = readTrkPercentFromGauge(gauge, clonedDoc);
    if (!Number.isFinite(pct)) {
      return;
    }

    const pctClamped = Math.max(0, Math.min(100, pct));
    const deliveredDeg = pctClamped * 3.6;
    const midDeg = deliveredDeg * 0.55;

    gauge.style.setProperty(
      "background",
      "conic-gradient(" +
        "from -90deg," +
        " #0a3f78 0deg," +
        " #0f5c9f " +
        midDeg.toFixed(2) +
        "deg," +
        " #2f82c5 " +
        deliveredDeg.toFixed(2) +
        "deg," +
        " #d9e5f1 " +
        deliveredDeg.toFixed(2) +
        "deg," +
        " #ebf1f8 360deg" +
        ")",
      "important",
    );

    gauge.style.setProperty(
      "box-shadow",
      "inset 0 0 0 1px rgba(14,72,127,0.2), 0 6px 14px rgba(14,55,98,0.2)",
      "important",
    );
  });
}

function readTrkPercentFromGauge(gauge, clonedDoc) {
  const inline = gauge.getAttribute("style") || "";
  const inlineMatch = inline.match(/--trk-pct\s*:\s*([0-9]+(?:\.[0-9]+)?)/i);
  if (inlineMatch) {
    return Number(inlineMatch[1]);
  }

  const win = clonedDoc.defaultView || window;
  const cssVar = win.getComputedStyle(gauge).getPropertyValue("--trk-pct");
  const parsed = Number(String(cssVar).trim().replace(",", "."));
  return Number.isFinite(parsed) ? parsed : NaN;
}

function resolveElement(selector, label) {
  const el = document.querySelector(selector);
  if (!el) {
    throw new Error(label + " no encontrado para selector: " + selector);
  }
  return el;
}

function ensureElementHasSize(element, label) {
  const rect = element.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) {
    throw new Error(label + " sin tamaño visible para exportar.");
  }
}

function snapshotCanvases(canvases) {
  return canvases.map((canvas) => {
    const rect = canvas.getBoundingClientRect();
    return {
      selector: selectorForElement(canvas),
      width: canvas.width,
      height: canvas.height,
      rect: normalizeRect(rect),
    };
  });
}

function areCanvasStatesEqual(prev, next) {
  if (!Array.isArray(prev) || !Array.isArray(next) || prev.length !== next.length) {
    return false;
  }

  for (let i = 0; i < prev.length; i += 1) {
    const a = prev[i];
    const b = next[i];

    if (
      a.selector !== b.selector ||
      a.width !== b.width ||
      a.height !== b.height ||
      Math.abs(a.rect.x - b.rect.x) > 0.5 ||
      Math.abs(a.rect.y - b.rect.y) > 0.5 ||
      Math.abs(a.rect.width - b.rect.width) > 0.5 ||
      Math.abs(a.rect.height - b.rect.height) > 0.5
    ) {
      return false;
    }
  }

  return true;
}

function normalizeRect(rect) {
  return {
    x: round2(rect.x),
    y: round2(rect.y),
    width: round2(rect.width),
    height: round2(rect.height),
  };
}

function round2(value) {
  return Math.round(Number(value) * 100) / 100;
}

function selectorForElement(node) {
  if (!node) {
    return "unknown";
  }

  if (node.id) {
    return "#" + node.id;
  }

  const classList = Array.from(node.classList || []).filter(Boolean);
  if (classList.length > 0) {
    return node.tagName.toLowerCase() + "." + classList.slice(0, 3).join(".");
  }

  return node.tagName.toLowerCase();
}

function buildFilename(prefix, date) {
  const d = date instanceof Date ? date : new Date();
  const yyyy = String(d.getFullYear());
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");

  return prefix + "_" + yyyy + "-" + mm + "-" + dd + "_" + hh + min + ".pdf";
}
