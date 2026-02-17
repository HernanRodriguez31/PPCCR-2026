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
  desiredScale: 3.2,
  snapshotScale: 4,
  maxDimPx: 15000,
  maxAreaPx: 160000000,
  marginsMm: { top: 10, right: 10, bottom: 10, left: 10 },
  contentGapMm: 4,
  footerMm: 8,
  headerHeightMultiplier: 1,
  fitSinglePage: true,
  minSinglePageScale: 0.9,
  repeatHeaderOnEachPage: true,
  enableSnapshotSwap: true,
  snapshotSelectors: [
    ".kpiDash__trkGauge",
  ],
  ignoreSelectors: [],
  extraCloneCss: "",
  debug: false,
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

let createPatternGuardState = null;

const PDF_HEADER_VISUAL_ENHANCE_CSS = [
  "#top .site-topbar__inner,",
  "#top .topbar {",
  "  padding-top: 14px !important;",
  "  padding-bottom: 12px !important;",
  "}",
  "#top .brand-mark,",
  "#top .brand-mark--left {",
  "  width: clamp(78px, 8.8vw, 110px) !important;",
  "  height: clamp(78px, 8.8vw, 110px) !important;",
  "  min-width: 78px !important;",
  "  display: flex !important;",
  "  align-items: center !important;",
  "  justify-content: center !important;",
  "  aspect-ratio: 1 / 1 !important;",
  "}",
  "#top .brand-ribbon {",
  "  width: clamp(64px, 7vw, 90px) !important;",
  "  max-width: none !important;",
  "  height: auto !important;",
  "  object-fit: contain !important;",
  "  transform: none !important;",
  "}",
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
  "#kpi-dashboard-ppccr .kpiDash__reportUpdated {",
  "  display: block !important;",
  "  visibility: visible !important;",
  "  opacity: 1 !important;",
  "}",
  "#kpi-dashboard-ppccr .kpiDash__reportStatus {",
  "  display: inline-flex !important;",
  "  visibility: visible !important;",
  "}",
  "#kpi-dashboard-ppccr .kpiDash__reportExportedAt {",
  "  display: none !important;",
  "}",
  "#kpi-dashboard-ppccr .kpiDash__summaryBar {",
  "  overflow: hidden !important;",
  "  border-radius: 999px !important;",
  "}",
  "#kpi-dashboard-ppccr .kpiDash__summaryBarSegment {",
  "  overflow: hidden !important;",
  "  border-radius: inherit !important;",
  "  clip-path: inset(0 0 0 0 round 999px) !important;",
  "}",
  "#kpi-dashboard-ppccr .kpiDash__summaryBarSegment + .kpiDash__summaryBarSegment {",
  "  box-shadow: inset 2px 0 0 rgba(255, 255, 255, 0.95) !important;",
  "}",
  "#kpi-dashboard-ppccr .kpiDash__summaryBarSegment::before,",
  "#kpi-dashboard-ppccr .kpiDash__summaryBarSegment::after {",
  "  content: none !important;",
  "  display: none !important;",
  "}",
  "#kpi-dashboard-ppccr .kpiDash__summaryBarSegment--fit {",
  "  background: #0f5fa6 !important;",
  "}",
  "#kpi-dashboard-ppccr .kpiDash__summaryBarSegment--outside {",
  "  background: #79b3ea !important;",
  "}",
  "#kpi-dashboard-ppccr .kpiDash__summaryBadgeLabel {",
  "  width: 100% !important;",
  "  text-align: center !important;",
  "  justify-self: center !important;",
  "}",
  "#kpi-dashboard-ppccr .kpiDash__summaryBadge {",
  "  align-content: center !important;",
  "}",
  "#kpi-dashboard-ppccr .kpiDash__table--flow tbody td:nth-child(3),",
  "#kpi-dashboard-ppccr .kpiDash__table--flow tbody td:nth-child(6) {",
  "  vertical-align: middle !important;",
  "}",
  "#kpi-dashboard-ppccr .kpiDash__flowCell {",
  "  grid-template-columns: 3ch minmax(4.35rem, 4.75rem) !important;",
  "  align-items: center !important;",
  "  column-gap: 0.22rem !important;",
  "}",
  "#kpi-dashboard-ppccr .kpiDash__flowPrimary {",
  "  width: 3ch !important;",
  "  min-width: 3ch !important;",
  "  padding: 0 !important;",
  "  border-radius: 0 !important;",
  "  border: 0 !important;",
  "  background: transparent !important;",
  "  text-align: right !important;",
  "  font-weight: 600 !important;",
  "}",
  "#kpi-dashboard-ppccr .kpiDash__flowProgress {",
  "  min-width: 4.35rem !important;",
  "  width: 4.35rem !important;",
  "  height: 0.88rem !important;",
  "  background: linear-gradient(180deg, #dce9f7, #c7dcf2) !important;",
  "  border: 1px solid rgba(107, 153, 205, 0.58) !important;",
  "  box-shadow: inset 0 1px 0 rgba(255,255,255,0.78) !important;",
  "}",
  "#kpi-dashboard-ppccr .kpiDash__flowProgress::after {",
  "  display: none !important;",
  "}",
  "#kpi-dashboard-ppccr .kpiDash__flowProgressFill {",
  "  background: linear-gradient(90deg, #155a9c, #4a96da) !important;",
  "  box-shadow: none !important;",
  "  filter: none !important;",
  "}",
  "#kpi-dashboard-ppccr .kpiDash__flowProgressLabel {",
  "  color: #18456f !important;",
  "  font-size: 0.59rem !important;",
  "  letter-spacing: 0.02em !important;",
  "  text-shadow: none !important;",
  "}",
  "#kpi-dashboard-ppccr .kpiDash__informCell {",
  "  grid-template-columns: minmax(1.92rem, auto) minmax(4.85rem, auto) !important;",
  "  align-items: center !important;",
  "  justify-content: center !important;",
  "  gap: 0.22rem !important;",
  "}",
  "#kpi-dashboard-ppccr .kpiDash__informTotal {",
  "  min-width: 1.92rem !important;",
  "  height: 1.14rem !important;",
  "  padding: 0 0.42rem !important;",
  "  border-radius: 7px !important;",
  "  font-size: 0.79rem !important;",
  "  font-weight: 760 !important;",
  "  color: #0f3f72 !important;",
  "  border-color: rgba(76, 134, 197, 0.66) !important;",
  "  background: linear-gradient(160deg, rgba(230, 242, 255, 0.98), rgba(190, 217, 246, 0.95)) !important;",
  "  box-shadow: inset 0 1px 0 rgba(255,255,255,0.92) !important;",
  "}",
  "#kpi-dashboard-ppccr .kpiDash__informDetail {",
  "  min-width: 4.85rem !important;",
  "  width: auto !important;",
  "  justify-content: flex-start !important;",
  "}",
  "#kpi-dashboard-ppccr .kpiDash__informSplit {",
  "  width: 4.85rem !important;",
  "  padding: 0.07rem 0.1rem !important;",
  "  gap: 0.1rem !important;",
  "  background: #f3f8fe !important;",
  "  border: 1px solid rgba(181, 204, 232, 0.58) !important;",
  "  box-shadow: none !important;",
  "}",
  "#kpi-dashboard-ppccr .kpiDash__informSplitSep {",
  "  height: 0.56rem !important;",
  "}",
  "#kpi-dashboard-ppccr .kpiDash__informChip {",
  "  min-width: 1.56rem !important;",
  "  width: auto !important;",
  "  height: 0.92rem !important;",
  "  padding: 0 0.24rem !important;",
  "  box-shadow: none !important;",
  "}",
  "#kpi-dashboard-ppccr .kpiDash__informChipSign {",
  "  width: 0.66rem !important;",
  "  height: 0.66rem !important;",
  "  margin-right: 0.1rem !important;",
  "  border-radius: 999px !important;",
  "  background: rgba(255,255,255,0.18) !important;",
  "  font-size: 0.54rem !important;",
  "}",
  "#kpi-dashboard-ppccr .kpiDash__informChip--pos .kpiDash__informChipSign {",
  "  background: rgba(255,255,255,0.56) !important;",
  "}",
  "#kpi-dashboard-ppccr .kpiDash__informChipValue {",
  "  font-size: 0.64rem !important;",
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
  "#kpi-dashboard-ppccr .kpiDash__fitFlowPanel--trk .kpiDash__trkGauge {",
  "  width: 68px !important;",
  "  height: 68px !important;",
  "  background: conic-gradient(from -90deg, #0a3f78 0deg, #125fa8 calc(var(--trk-pct) * 2deg), #2f82c5 calc(var(--trk-pct) * 3.6deg), #d9e5f1 calc(var(--trk-pct) * 3.6deg), #ebf1f8 360deg) !important;",
  "}",
  "#kpi-dashboard-ppccr .kpiDash__fitFlowPanel--trk .kpiDash__trkGaugeWrap {",
  "  align-items: end !important;",
  "  justify-items: end !important;",
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

    try {
      resultMeta.canvasReport = await waitForCanvasStable(dashEl, {
        timeoutMs: cfg.canvasStableTimeoutMs,
        stableFrames: cfg.canvasStableFrames,
      });
    } catch (canvasError) {
      resultMeta.canvasReport = [];
      console.warn(
        "[PPCCR PDF] Canvas no estable al iniciar captura. Se continúa con exportación resiliente.",
        canvasError,
      );
    }

    const scaleHeader = computeSafeScale(headerEl, cfg.desiredScale, cfg.maxDimPx);
    const scaleDash = computeSafeScale(dashEl, cfg.desiredScale, cfg.maxDimPx);
    const headerCloneCss = mergeCloneCss(cfg.extraCloneCss, PDF_HEADER_VISUAL_ENHANCE_CSS);
    const dashboardCloneCss = mergeCloneCss(cfg.extraCloneCss, PDF_DASHBOARD_VISUAL_ENHANCE_CSS);
    const snapshotReplacements = cfg.enableSnapshotSwap
      ? await captureSnapshotReplacements({
          root: dashEl,
          html2canvas: libs.html2canvas,
          selectors: cfg.snapshotSelectors,
          scale: cfg.snapshotScale,
          debug: cfg.debug,
        })
      : [];

    let headerCanvas = null;
    try {
      headerCanvas = await captureElement(headerEl, {
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
    } catch (headerError) {
      console.warn(
        "[PPCCR PDF] Falló captura del encabezado. Se usa placeholder para continuar.",
        headerError,
      );
      headerCanvas = createPlaceholderCanvasFromElement(
        headerEl,
        scaleHeader,
        "Encabezado",
      );
    }

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
    let dashboardRenderWidthMm = pageMetrics.contentWidthMm;

    try {
      dashboardCanvas = await captureElement(dashEl, {
        html2canvas: libs.html2canvas,
        scale: scaleDash,
        backgroundColor: "#FFF",
        extraCloneCss: dashboardCloneCss,
        ignoreSelectors: cfg.ignoreSelectors,
        debug: cfg.debug,
        targetSelector: cfg.dashboardSelector,
        snapshotReplacements,
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
      try {
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
          targetSelector: cfg.dashboardSelector,
          snapshotReplacements,
          cloneMutator(clonedDoc) {
            stabilizeTrkGaugeInClone(clonedDoc, cfg.dashboardSelector);
          },
        });
      } catch (tileError) {
        console.warn(
          "[PPCCR PDF] Falló captura por tiles. Se usa placeholder para completar exportación.",
          tileError,
        );
        dashboardSlices = [
          createPlaceholderCanvasFromElement(dashEl, scaleDash, "Dashboard"),
        ];
      }

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
      dashboardRenderWidthMm = resolveDashboardRenderWidthMm({
        canvas: dashboardCanvas,
        pageMetrics,
        cfg,
        headerHeightMm,
        dashboardAvailMm,
      });

      appendCanvasWithPaging({
        doc,
        canvas: dashboardCanvas,
        headerCanvas,
        headerHeightMm,
        renderWidthMm: dashboardRenderWidthMm,
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
          renderWidthMm: dashboardRenderWidthMm,
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
      console.log("snapshotReplacements:", snapshotReplacements.length);
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
    const intrinsicWidth = Number(canvas.width) || 0;
    const intrinsicHeight = Number(canvas.height) || 0;
    return (
      rect.width > 0 &&
      rect.height > 0 &&
      intrinsicWidth > 0 &&
      intrinsicHeight > 0 &&
      style.display !== "none"
    );
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
    targetSelector = "",
    snapshotReplacements = [],
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
    allowTaint: true,
    logging: Boolean(debug),
    foreignObjectRendering: true,
    removeContainer: true,
    ignoreElements(node) {
      return shouldIgnoreElementForHtml2Canvas(node);
    },
    onclone(clonedDoc) {
      patchCreatePatternPrototypeForWindow(
        clonedDoc && clonedDoc.defaultView ? clonedDoc.defaultView : null,
        debug,
      );
      injectCloneStyles(clonedDoc, {
        hiddenSelectors,
        extraCloneCss,
      });
      if (typeof cloneMutator === "function") {
        cloneMutator(clonedDoc);
      }
      if (Array.isArray(snapshotReplacements) && snapshotReplacements.length > 0) {
        applySnapshotReplacements({
          clonedDoc,
          targetSelector,
          replacements: snapshotReplacements,
          debug,
        });
      }
      sanitizeCloneCanvases(clonedDoc, {
        targetSelector,
        debug,
      });
    },
  };

  if (crop && Number.isFinite(crop.height) && crop.height > 0) {
    options.x = Math.max(0, Math.floor(crop.x || 0));
    options.y = Math.max(0, Math.floor(crop.y || 0));
    options.width = Math.max(1, Math.ceil(crop.width || rect.width));
    options.height = Math.max(1, Math.ceil(crop.height));
  }

  let firstCanvas = null;
  try {
    firstCanvas = await runHtml2CanvasSafely(
      html2canvas,
      element,
      options,
      debug,
    );
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
    try {
      return await runHtml2CanvasSafely(
        html2canvas,
        element,
        fallbackOptions,
        debug,
      );
    } catch (fallbackError) {
      // Si el fallback falla, preservamos la primera captura (puede ser válida aunque muy clara).
      if (firstCanvas) {
        if (debug) {
          console.warn(
            "[PPCCR PDF] Fallback de captura falló. Se utiliza primera captura.",
            fallbackError,
          );
        }
        return firstCanvas;
      }
      throw fallbackError;
    }
  } catch (primaryError) {
    const fallbackOptions = {
      ...options,
      foreignObjectRendering: false,
    };
    try {
      return await runHtml2CanvasSafely(
        html2canvas,
        element,
        fallbackOptions,
        debug,
      );
    } catch (fallbackError) {
      if (isCreatePatternZeroSizeError(primaryError) || isCreatePatternZeroSizeError(fallbackError)) {
        if (debug) {
          console.warn(
            "[PPCCR PDF] Error createPattern persistente. Se devuelve placeholder de captura.",
            fallbackError,
          );
        }
        return createPlaceholderCanvas(
          Math.max(1, Math.round((rect.width || 1) * Math.max(1, Number(scale) || 1))),
          Math.max(1, Math.round((rect.height || 1) * Math.max(1, Number(scale) || 1))),
          "Captura",
        );
      }
      throw fallbackError;
    }
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

async function runHtml2CanvasSafely(renderer, node, options, debug) {
  const releaseGuard = acquireSafeCreatePatternGuard(debug);
  try {
    return await renderer(node, options);
  } finally {
    releaseGuard();
  }
}

function acquireSafeCreatePatternGuard(debug) {
  const proto =
    window.CanvasRenderingContext2D &&
    window.CanvasRenderingContext2D.prototype;

  if (!proto || typeof proto.createPattern !== "function") {
    return function noopRelease() {};
  }

  if (createPatternGuardState && createPatternGuardState.proto === proto) {
    createPatternGuardState.refs += 1;
    return function releaseExistingGuard() {
      releaseSafeCreatePatternGuard();
    };
  }

  const original = proto.createPattern;
  const fallbackCanvas = document.createElement("canvas");
  fallbackCanvas.width = 1;
  fallbackCanvas.height = 1;
  const fallbackCtx = fallbackCanvas.getContext("2d");
  if (fallbackCtx) {
    fallbackCtx.clearRect(0, 0, 1, 1);
  }

  createPatternGuardState = {
    proto,
    original,
    refs: 1,
    warns: 0,
    fallbackCanvas,
  };

  proto.createPattern = function guardedCreatePattern(image, repetition) {
    const hasNumericSize =
      image &&
      typeof image.width === "number" &&
      typeof image.height === "number";
    const isZeroSized = hasNumericSize && (image.width <= 0 || image.height <= 0);
    const repeatMode =
      typeof repetition === "string" && repetition.length > 0
        ? repetition
        : "repeat";

    if (isZeroSized) {
      if (debug && createPatternGuardState && createPatternGuardState.warns < 5) {
        createPatternGuardState.warns += 1;
        console.warn(
          "[PPCCR PDF] createPattern recibió imagen 0x0. Se aplica fallback 1x1.",
          image,
        );
      }
      try {
        return original.call(this, fallbackCanvas, repeatMode);
      } catch (fallbackError) {
        return null;
      }
    }

    try {
      return original.call(this, image, repetition);
    } catch (error) {
      if (!isCreatePatternZeroSizeError(error)) {
        throw error;
      }
      if (debug && createPatternGuardState && createPatternGuardState.warns < 5) {
        createPatternGuardState.warns += 1;
        console.warn(
          "[PPCCR PDF] createPattern lanzó error por imagen inválida. Se aplica fallback 1x1.",
          error,
        );
      }
      try {
        return original.call(this, fallbackCanvas, repeatMode);
      } catch (fallbackError) {
        return null;
      }
    }
  };

  return function releaseGuard() {
    releaseSafeCreatePatternGuard();
  };
}

function patchCreatePatternPrototypeForWindow(targetWindow, debug) {
  if (!targetWindow || !targetWindow.CanvasRenderingContext2D) {
    return;
  }

  const proto = targetWindow.CanvasRenderingContext2D.prototype;
  if (!proto || typeof proto.createPattern !== "function") {
    return;
  }

  if (proto.__ppccrCreatePatternGuardInstalled) {
    return;
  }

  const original = proto.createPattern;
  const ownerDocument = targetWindow.document || document;
  const fallbackCanvas = ownerDocument.createElement("canvas");
  fallbackCanvas.width = 1;
  fallbackCanvas.height = 1;
  const fallbackCtx = fallbackCanvas.getContext("2d");
  if (fallbackCtx) {
    fallbackCtx.clearRect(0, 0, 1, 1);
  }

  try {
    Object.defineProperty(proto, "__ppccrCreatePatternGuardInstalled", {
      value: true,
      enumerable: false,
      configurable: true,
    });
  } catch (error) {
    proto.__ppccrCreatePatternGuardInstalled = true;
  }

  proto.createPattern = function guardedCreatePattern(image, repetition) {
    const hasNumericSize =
      image &&
      typeof image.width === "number" &&
      typeof image.height === "number";
    const isZeroSized = hasNumericSize && (image.width <= 0 || image.height <= 0);
    const repeatMode =
      typeof repetition === "string" && repetition.length > 0
        ? repetition
        : "repeat";

    if (isZeroSized) {
      if (debug) {
        console.warn(
          "[PPCCR PDF] [clone] createPattern recibió imagen 0x0. Se aplica fallback 1x1.",
        );
      }
      try {
        return original.call(this, fallbackCanvas, repeatMode);
      } catch (fallbackError) {
        return null;
      }
    }

    try {
      return original.call(this, image, repetition);
    } catch (error) {
      if (!isCreatePatternZeroSizeError(error)) {
        throw error;
      }
      if (debug) {
        console.warn(
          "[PPCCR PDF] [clone] createPattern lanzó error por imagen inválida. Se aplica fallback 1x1.",
          error,
        );
      }
      try {
        return original.call(this, fallbackCanvas, repeatMode);
      } catch (fallbackError) {
        return null;
      }
    }
  };
}

function releaseSafeCreatePatternGuard() {
  if (!createPatternGuardState) {
    return;
  }

  createPatternGuardState.refs -= 1;
  if (createPatternGuardState.refs > 0) {
    return;
  }

  const state = createPatternGuardState;
  createPatternGuardState = null;
  state.proto.createPattern = state.original;
}

function isCreatePatternZeroSizeError(error) {
  const message =
    error && error.message ? String(error.message).toLowerCase() : "";

  return (
    message.indexOf("createpattern") >= 0 &&
    message.indexOf("width or height of 0") >= 0
  );
}

function createPlaceholderCanvas(widthPx, heightPx, label) {
  const canvas = document.createElement("canvas");
  const w = Math.max(1, Math.round(Number(widthPx) || 1));
  const h = Math.max(1, Math.round(Number(heightPx) || 1));

  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return canvas;
  }

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = "#d6e4f4";
  ctx.lineWidth = Math.max(1, Math.round(Math.min(w, h) * 0.004));
  ctx.strokeRect(0, 0, w, h);

  const text = String(label || "PPCCR");
  const fontSize = Math.max(10, Math.round(Math.min(w, h) * 0.065));
  ctx.fillStyle = "#4b6b90";
  ctx.font = "600 " + fontSize + "px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, Math.round(w / 2), Math.round(h / 2));

  return canvas;
}

function createPlaceholderCanvasFromElement(element, scale, label) {
  const rect = element.getBoundingClientRect();
  const safeScale = Math.max(1, Number(scale) || 1);
  return createPlaceholderCanvas(
    Math.max(1, Math.round((rect.width || 1) * safeScale)),
    Math.max(1, Math.round((rect.height || 1) * safeScale)),
    label,
  );
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
  targetSelector,
  snapshotReplacements,
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
    let canvas = null;
    try {
      canvas = await captureElement(element, {
        html2canvas,
        scale,
        backgroundColor: "#FFF",
        extraCloneCss,
        ignoreSelectors,
        cloneMutator,
        debug,
        targetSelector,
        snapshotReplacements,
        crop: {
          x: 0,
          y,
          width: widthCss,
          height: currentHeight,
        },
      });
    } catch (sliceError) {
      console.warn(
        "[PPCCR PDF] Slice con error de captura. Se reemplaza por placeholder.",
        sliceError,
      );
      canvas = createPlaceholderCanvas(
        Math.max(1, Math.round(widthCss * scale)),
        Math.max(1, Math.round(currentHeight * scale)),
        "Slice",
      );
    }

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
  renderWidthMm,
  cfg,
  pageMetrics,
  renderState,
}) {
  const sourceWidthPx = Math.max(1, canvas.width);
  const sourceHeightPx = Math.max(1, canvas.height);
  const targetWidthMm = Math.max(
    40,
    Math.min(pageMetrics.contentWidthMm, Number(renderWidthMm) || pageMetrics.contentWidthMm),
  );
  const contentOffsetMm = (pageMetrics.contentWidthMm - targetWidthMm) / 2;
  const contentX = pageMetrics.margins.left + contentOffsetMm;
  const mmPerPx = targetWidthMm / sourceWidthPx;

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
        contentX,
        contentStartY,
        targetWidthMm,
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
        contentX,
        contentStartY,
        targetWidthMm,
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

function resolveDashboardRenderWidthMm({
  canvas,
  pageMetrics,
  cfg,
  headerHeightMm,
  dashboardAvailMm,
}) {
  const baseWidthMm = pageMetrics.contentWidthMm;
  if (!canvas || !cfg.fitSinglePage) {
    return baseWidthMm;
  }

  const currentHeightMm = toHeightMm(canvas, baseWidthMm);
  if (currentHeightMm <= dashboardAvailMm) {
    return baseWidthMm;
  }

  const requiredScale = dashboardAvailMm / Math.max(1, currentHeightMm);
  const minAllowed = Math.max(0.7, Math.min(1, Number(cfg.minSinglePageScale) || 0.9));

  if (requiredScale < minAllowed) {
    return baseWidthMm;
  }

  const nextWidthMm = Math.max(40, baseWidthMm * requiredScale);
  if (cfg.debug) {
    console.log("[PPCCR PDF] Ajuste fit-one-page aplicado:", {
      requiredScale,
      nextWidthMm,
      currentHeightMm,
      dashboardAvailMm,
      headerHeightMm,
    });
  }

  return nextWidthMm;
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
    0.9,
    Number(options.headerHeightMultiplier) || DEFAULT_OPTIONS.headerHeightMultiplier,
  );
  merged.fitSinglePage = options.fitSinglePage !== false;
  merged.minSinglePageScale = Math.max(
    0.7,
    Math.min(1, Number(options.minSinglePageScale) || DEFAULT_OPTIONS.minSinglePageScale),
  );
  merged.snapshotScale = Math.max(
    2,
    Number(options.snapshotScale) || DEFAULT_OPTIONS.snapshotScale,
  );
  merged.enableSnapshotSwap = options.enableSnapshotSwap !== false;
  merged.snapshotSelectors = Array.isArray(options.snapshotSelectors)
    ? options.snapshotSelectors.filter(Boolean)
    : DEFAULT_OPTIONS.snapshotSelectors.slice();

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

function shouldIgnoreElementForHtml2Canvas(node) {
  if (!node || node.nodeType !== 1) {
    return false;
  }

  if (node.hasAttribute("data-html2canvas-ignore")) {
    return true;
  }

  if (String(node.tagName || "").toUpperCase() !== "CANVAS") {
    return false;
  }

  const intrinsicWidth = Number(node.width) || 0;
  const intrinsicHeight = Number(node.height) || 0;
  if (intrinsicWidth <= 0 || intrinsicHeight <= 0) {
    return true;
  }

  try {
    const rect = node.getBoundingClientRect();
    return rect.width <= 0 || rect.height <= 0;
  } catch (error) {
    return false;
  }
}

function sanitizeCloneCanvases(clonedDoc, { targetSelector = "", debug = false } = {}) {
  const root =
    (targetSelector && clonedDoc.querySelector(targetSelector)) ||
    clonedDoc.body ||
    clonedDoc.documentElement;

  if (!root) {
    return;
  }

  let sanitizedCount = 0;

  Array.from(root.querySelectorAll("canvas")).forEach((canvas) => {
    const intrinsicWidth = Number(canvas.width) || 0;
    const intrinsicHeight = Number(canvas.height) || 0;
    if (intrinsicWidth > 0 && intrinsicHeight > 0) {
      return;
    }

    canvas.setAttribute("data-html2canvas-ignore", "true");
    canvas.style.setProperty("display", "none", "important");
    canvas.style.setProperty("visibility", "hidden", "important");
    canvas.style.setProperty("width", "0px", "important");
    canvas.style.setProperty("height", "0px", "important");
    sanitizedCount += 1;
  });

  if (debug && sanitizedCount > 0) {
    console.warn("[PPCCR PDF] Canvases inválidos sanitizados en clon:", sanitizedCount);
  }
}

async function captureSnapshotReplacements({
  root,
  html2canvas,
  selectors,
  scale,
  debug,
}) {
  if (!root || !Array.isArray(selectors) || selectors.length === 0) {
    return [];
  }

  const replacements = [];
  const seenPaths = new Set();

  for (let s = 0; s < selectors.length; s += 1) {
    const selector = selectors[s];
    const nodes = Array.from(root.querySelectorAll(selector));

    for (let i = 0; i < nodes.length; i += 1) {
      const node = nodes[i];
      const rect = node.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) {
        continue;
      }

      const path = getNodePathWithinRoot(node, root);
      if (!path || path.length === 0) {
        continue;
      }

      const pathKey = path.join(".");
      if (seenPaths.has(pathKey)) {
        continue;
      }

      try {
        const canvas = await captureLiveNodeSnapshot({
          node,
          html2canvas,
          scale,
          debug,
        });
        replacements.push({
          selector,
          path,
          width: rect.width,
          height: rect.height,
          dataUrl: canvas.toDataURL("image/png", 1),
        });
        seenPaths.add(pathKey);
      } catch (error) {
        if (debug) {
          console.warn("[PPCCR PDF] Snapshot selectivo omitido:", selector, error);
        }
      }
    }
  }

  return replacements;
}

async function captureLiveNodeSnapshot({ node, html2canvas, scale, debug }) {
  const isTrkNode = Boolean(
    node &&
      (node.matches(".kpiDash__trkGauge, .kpiDash__trkGaugeWrap, .apexcharts-canvas, .apexcharts-svg") ||
        node.closest(".kpiDash__trk")),
  );
  const resolvedScale = isTrkNode
    ? Math.max(4, Number(scale) || 4)
    : Math.max(3, Number(scale) || 3);
  const options = {
    backgroundColor: null,
    scale: resolvedScale,
    useCORS: true,
    allowTaint: true,
    logging: Boolean(debug),
    foreignObjectRendering: !isTrkNode,
    removeContainer: true,
    ignoreElements(nodeCandidate) {
      return shouldIgnoreElementForHtml2Canvas(nodeCandidate);
    },
  };

  try {
    const firstCanvas = await runHtml2CanvasSafely(
      html2canvas,
      node,
      options,
      debug,
    );
    if (!isLikelyBlankCanvas(firstCanvas)) {
      return firstCanvas;
    }
  } catch (error) {
    // fallback below
  }

  try {
    return await runHtml2CanvasSafely(
      html2canvas,
      node,
      {
        ...options,
        foreignObjectRendering: isTrkNode,
      },
      debug,
    );
  } catch (error) {
    const rect = node && node.getBoundingClientRect ? node.getBoundingClientRect() : null;
    if (isCreatePatternZeroSizeError(error)) {
      return createPlaceholderCanvas(
        Math.max(1, Math.round((rect && rect.width ? rect.width : 1) * resolvedScale)),
        Math.max(1, Math.round((rect && rect.height ? rect.height : 1) * resolvedScale)),
        "Snapshot",
      );
    }
    throw error;
  }
}

function applySnapshotReplacements({
  clonedDoc,
  targetSelector,
  replacements,
  debug,
}) {
  const clonedRoot = clonedDoc.querySelector(targetSelector);
  if (!clonedRoot) {
    return;
  }

  const ordered = replacements
    .slice()
    .sort((a, b) => b.path.length - a.path.length);

  ordered.forEach((replacement) => {
    const target = resolveNodeByPath(clonedRoot, replacement.path);
    if (!target || !target.parentElement) {
      return;
    }

    const targetStyle =
      clonedDoc.defaultView && target
        ? clonedDoc.defaultView.getComputedStyle(target)
        : null;
    const widthPx = Number(replacement.width) > 0 ? Number(replacement.width) : target.offsetWidth;
    const heightPx = Number(replacement.height) > 0
      ? Number(replacement.height)
      : target.offsetHeight;

    const img = clonedDoc.createElement("img");
    img.src = replacement.dataUrl;
    img.alt = "";
    img.setAttribute("aria-hidden", "true");
    img.className = "kpiDash__pdfSwapImage";
    img.style.display =
      targetStyle && targetStyle.display && targetStyle.display !== "inline"
        ? targetStyle.display
        : "inline-block";
    img.style.width = widthPx > 0 ? widthPx + "px" : "100%";
    img.style.height = heightPx > 0 ? heightPx + "px" : "auto";
    img.style.maxWidth = "100%";
    img.style.objectFit = "contain";
    img.style.verticalAlign = "middle";
    img.style.borderRadius = (targetStyle && targetStyle.borderRadius) || "";
    img.style.boxShadow = (targetStyle && targetStyle.boxShadow) || "";

    target.parentElement.replaceChild(img, target);
  });

  if (debug) {
    console.log("[PPCCR PDF] Snapshot replacements aplicados:", ordered.length);
  }
}

function getNodePathWithinRoot(node, root) {
  if (!node || !root) {
    return null;
  }

  const path = [];
  let current = node;

  while (current && current !== root) {
    const parent = current.parentElement;
    if (!parent) {
      return null;
    }

    const index = Array.prototype.indexOf.call(parent.children, current);
    if (index < 0) {
      return null;
    }

    path.unshift(index);
    current = parent;
  }

  return current === root ? path : null;
}

function resolveNodeByPath(root, path) {
  let current = root;
  for (let i = 0; i < path.length; i += 1) {
    const idx = path[i];
    if (!current || !current.children || idx >= current.children.length) {
      return null;
    }
    current = current.children[idx];
  }
  return current || null;
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

  const ribbonWrap = headerRoot.querySelector(".brand-mark--left");
  if (ribbonWrap) {
    ribbonWrap.style.setProperty("width", "clamp(78px, 8.8vw, 110px)", "important");
    ribbonWrap.style.setProperty("height", "clamp(78px, 8.8vw, 110px)", "important");
    ribbonWrap.style.setProperty("min-width", "78px", "important");
    ribbonWrap.style.setProperty("display", "flex", "important");
    ribbonWrap.style.setProperty("align-items", "center", "important");
    ribbonWrap.style.setProperty("justify-content", "center", "important");
    ribbonWrap.style.setProperty("aspect-ratio", "1 / 1", "important");
  }

  const brandMark = headerRoot.querySelector(".brand-mark");
  if (brandMark) {
    brandMark.style.setProperty("width", "clamp(78px, 8.8vw, 110px)", "important");
    brandMark.style.setProperty("height", "clamp(78px, 8.8vw, 110px)", "important");
  }

  const ribbon = headerRoot.querySelector(".brand-ribbon");
  if (ribbon) {
    ribbon.style.setProperty("width", "clamp(64px, 7vw, 90px)", "important");
    ribbon.style.setProperty("max-width", "none", "important");
    ribbon.style.setProperty("height", "auto", "important");
    ribbon.style.setProperty("object-fit", "contain", "important");
    ribbon.style.setProperty("transform", "none", "important");
  }
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
