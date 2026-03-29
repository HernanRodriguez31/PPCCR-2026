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

const DEFAULT_SCALE_PRESETS = [
  { name: "preset-1", scale: 2.8, jpegQuality: 0.96 },
  { name: "preset-2", scale: 2.6, jpegQuality: 0.94 },
  { name: "preset-3", scale: 2.4, jpegQuality: 0.92 },
  { name: "preset-4", scale: 2.2, jpegQuality: 0.9 },
  { name: "preset-5", scale: 2.0, jpegQuality: 0.88 },
];

const POSTER_DEFAULT_WEBP_QUALITY = 0.96;
const POSTER_DEFAULT_JPEG_QUALITY = 0.92;
const POSTER_HOST_ID = "ppccr-pdf-poster-host";
const POSTER_HOST_DASHBOARD_ID = "ppccr-pdf-poster-dashboard";
const POSTER_HOST_SCOPE_ID = "ppccr-pdf-poster-scope";
const TRUE_LIVE_SNAPSHOT_FRAME_CLASS = "kpiDash__trueLiveSnapshotFrame";
const TRUE_LIVE_SNAPSHOT_SOURCE = "live-iframe:index.html#kpis";
const TRUE_LIVE_SNAPSHOT_QUERY_KEY = "ppccr_snapshot";
const TRUE_LIVE_SNAPSHOT_QUERY_VALUE = "panels-live";
const TRUE_LIVE_SNAPSHOT_TIMEOUT_MS = 45000;
const TRUE_LIVE_SNAPSHOT_FRAME_WIDTH_PX = 1460;
const TRUE_LIVE_SNAPSHOT_FRAME_HEIGHT_PX = 2200;
const TRUE_LIVE_SNAPSHOT_SESSION_SEED = Object.freeze({
  ppccr_auth: "1",
  ppccr_auth_ok: "1",
  ppccr_station_id: "saavedra",
  ppccr_station: JSON.stringify({
    id: "saavedra",
    name: "Parque Saavedra",
  }),
  ppccr_auth_user: "saavedra",
});
const DEFAULT_PANEL_SNAPSHOT_SELECTORS = Object.freeze([
  Object.freeze({
    selector: ".kpiDash__summary.kpiDash__execPanel",
    scale: 4,
    fitToTarget: true,
    label: "participants-panel",
  }),
  Object.freeze({
    selector: ".kpiDash__fitFlowPanel--trk",
    scale: 5,
    fitToTarget: true,
    label: "trk-panel",
  }),
]);
const DEFAULT_SNAPSHOT_SELECTORS = DEFAULT_PANEL_SNAPSHOT_SELECTORS.concat([
  ".kpiDash__trkGaugeWrap",
  ".ppccr-sankey svg",
]);

const DEFAULT_OPTIONS = {
  headerSelector: "#top",
  exportScopeSelector: "#kpis .container",
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
  softMaxPdfBytes: 12 * 1024 * 1024,
  hardMaxPdfBytes: 25 * 1024 * 1024,
  maxPdfBytes: 25 * 1024 * 1024,
  preferredScalePresets: DEFAULT_SCALE_PRESETS,
  preferLegibilityOverSinglePage: false,
  repeatHeaderOnEachPage: true,
  enableSnapshotSwap: true,
  snapshotSelectors: DEFAULT_SNAPSHOT_SELECTORS,
  includeSectionHeader: true,
  pageStrategy: "single-page-poster",
  pdfPageSizeMode: "custom",
  posterLayoutBasis: "desktop-fixed",
  posterViewportWidthPx: 1460,
  posterMarginMm: 2,
  targetReportWidthMm: 190,
  pageOrientation: "portrait",
  blockLayoutMode: "wysiwyg-v3",
  ignoreSelectors: [],
  extraCloneCss: "",
  debug: false,
  debugPdf: false,
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
  ".auth-gate",
  "#auth-gate",
  ".auth-gate-backdrop",
];

let createPatternGuardState = null;

const PDF_HEADER_VISUAL_ENHANCE_CSS = [
  "#top, #top * {",
  "  -webkit-print-color-adjust: exact !important;",
  "  print-color-adjust: exact !important;",
  "}",
].join("\n");

const PDF_DASHBOARD_VISUAL_ENHANCE_CSS = [
  "#kpi-dashboard-ppccr .kpiDash__reportRoot,",
  "#kpi-dashboard-ppccr .kpiDash__reportRoot * {",
  "  -webkit-print-color-adjust: exact !important;",
  "  print-color-adjust: exact !important;",
  "}",
].join("\n");

export async function exportPPCCRToPdf(options = {}) {
  const cfg = normalizeOptions(options);
  initPdfDebugState();
  updatePdfDebugState({
    mode: cfg.pageStrategy,
    chosenPreset: null,
    pageCount: 0,
    pages: 0,
    blobSizeBytes: 0,
    finalBlobBytes: 0,
    captureMode: cfg.pageStrategy === "single-page-poster" ? "single-page-poster" : "block-layout",
    usedTiles: false,
    renderWidthMm: null,
    renderHeightMm: null,
    imageXmm: null,
    imageYmm: null,
    exportedScope: null,
    pageBreaks: [],
    softBudgetHit: false,
    hardBudgetHit: false,
    includedSectionHeader: false,
    layoutMode: null,
    blockFormats: {},
    selectedCodecPerBlock: {},
    finalPosterCodec: null,
    finalPosterBytesEstimate: 0,
    posterCanvasPx: null,
    pdfPageMm: null,
    usedCustomPageSize: false,
    singlePageSatisfied: false,
    visualBlocksIncluded: [],
    warnings: [],
    timings: {},
  });
  const totalStart = nowMs();
  const timings = {};
  const libs = await ensureExportLibs();
  const headerEl = resolveElement(cfg.headerSelector, "Branding");
  const exportScopeEl = resolveElement(
    cfg.exportScopeSelector,
    "Scope de exportación",
  );
  const dashEl = resolveElement(cfg.dashboardSelector, "Dashboard");
  const reportRootEl =
    dashEl.querySelector("[data-kpi-report-root]") ||
    resolveElement("[data-kpi-report-root]", "Reporte KPI");
  const sectionHeaderEl = cfg.includeSectionHeader
    ? resolveElementWithin(
        exportScopeEl,
        ".section-header",
        "Section header de KPIs",
      )
    : null;

  ensureElementHasSize(headerEl, "Header");
  ensureElementHasSize(dashEl, "Dashboard");
  if (sectionHeaderEl) {
    ensureElementHasSize(sectionHeaderEl, "Section header de KPIs");
  }

  const resultMeta = {
    mode: cfg.pageStrategy,
    fallbackTilesUsed: false,
    tilesCount: 0,
    dashboardCapture: null,
    blockCaptures: [],
    canvasReport: [],
    headerCaptureScale: null,
    dashboardCaptureScale: null,
    posterLayoutMetrics: null,
    snapshotReplacementStats: null,
    pageBreaks: [],
    warnings: [],
  };
  let posterHostContext = null;

  try {
    const assetsStart = nowMs();
    await waitForAssets(headerEl);
    await waitForAssets(exportScopeEl);
    await waitForAssets(dashEl);
    timings.assetsReadyMs = round2(nowMs() - assetsStart);

    const canvasStableStart = nowMs();
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
      pushPdfWarning(
        resultMeta,
        "Canvas no estable al iniciar captura. Se continúa con exportación resiliente.",
      );
    }
    timings.canvasStableMs = round2(nowMs() - canvasStableStart);

    const baseCaptureScale = resolveBaseCaptureScale(cfg);
    const headerCloneCss = mergeCloneCss(cfg.extraCloneCss, PDF_HEADER_VISUAL_ENHANCE_CSS);
    const dashboardCloneCss = mergeCloneCss(cfg.extraCloneCss, PDF_DASHBOARD_VISUAL_ENHANCE_CSS);
    const snapshotStart = nowMs();
    const snapshotReplacements = cfg.enableSnapshotSwap
      ? await captureSnapshotReplacements({
          root: dashEl,
          html2canvas: libs.html2canvas,
          selectors: cfg.snapshotSelectors,
          scale: cfg.snapshotScale,
          debug: cfg.debug,
        })
      : [];
    const panelSnapshotBlocks = snapshotReplacements
      .filter((replacement) => replacement && replacement.label)
      .map((replacement) => replacement.label)
      .filter((label) => label === "participants-panel" || label === "trk-panel");
    resultMeta.snapshotReplacementStats = {
      total: snapshotReplacements.length,
      labels: Array.from(
        new Set(
          snapshotReplacements
            .map((replacement) => replacement.label || replacement.selector || "")
            .filter(Boolean),
        ),
      ),
      panelBlocks: Array.from(new Set(panelSnapshotBlocks)),
      panelCount: panelSnapshotBlocks.length,
      mode:
        panelSnapshotBlocks.length > 0
          ? "true-live-source-panel-snapshot"
          : "css-only",
    };
    timings.snapshotPrepMs = round2(nowMs() - snapshotStart);

    const pageMetrics = createPageMetrics(cfg);
    const blockCaptureStart = nowMs();
    if (cfg.pageStrategy === "single-page-poster") {
      posterHostContext = await createPosterSnapshotHost({
        cfg,
        libs,
        headerEl,
        exportScopeEl,
        dashEl,
        reportRootEl,
        sectionHeaderEl,
        snapshotReplacements,
      });
      await waitForAssets(posterHostContext.host);
    }
    const activeHeaderEl = posterHostContext ? posterHostContext.headerEl : headerEl;
    const activeSectionHeaderEl = posterHostContext
      ? posterHostContext.sectionHeaderEl
      : sectionHeaderEl;
    const activeReportRootEl = posterHostContext
      ? posterHostContext.reportRootEl
      : reportRootEl;
    const activeDashboardSelector = posterHostContext
      ? posterHostContext.dashboardSelector
      : cfg.dashboardSelector;
    const blockManifest = buildExportBlockManifest({
      cfg,
      headerEl: activeHeaderEl,
      sectionHeaderEl: activeSectionHeaderEl,
      reportRootEl: activeReportRootEl,
      dashboardSelector: activeDashboardSelector,
    });
    const capturedBlocks = await captureExportBlocks({
      manifest: blockManifest,
      libs,
      cfg,
      pageMetrics,
      headerCloneCss,
      dashboardCloneCss,
      snapshotReplacements:
        cfg.pageStrategy === "single-page-poster" ? [] : snapshotReplacements,
      dashboardSelector: activeDashboardSelector,
      baseCaptureScale,
      resultMeta,
    });
    timings.blockCaptureMs = round2(nowMs() - blockCaptureStart);
    resultMeta.dashboardCapture = {
      mode: cfg.pageStrategy === "single-page-poster" ? "single-page-poster" : "block-layout",
      width: null,
      height: null,
      area: capturedBlocks.reduce((sum, block) => {
        return sum + Math.max(1, block.canvas.width) * Math.max(1, block.canvas.height);
      }, 0),
    };

    const variantStart = nowMs();
    const chosenVariant =
      cfg.pageStrategy === "single-page-poster"
        ? await buildAdaptiveSinglePagePosterPdfVariant({
            libs,
            blocks: capturedBlocks,
            cfg,
            resultMeta,
          })
        : await buildAdaptiveBlockPdfVariant({
            libs,
            blocks: capturedBlocks,
            pageMetrics,
            cfg,
            resultMeta,
          });
    timings.variantSelectionMs = round2(nowMs() - variantStart);
    const filename = buildFilename(cfg.filenamePrefix, new Date());
    saveBlobAsFile(chosenVariant.blob, filename);
    timings.totalMs = round2(nowMs() - totalStart);
    updatePdfDebugState({
      mode: cfg.pageStrategy,
      chosenPreset: chosenVariant.chosenPreset,
      pageCount: chosenVariant.pages,
      pages: chosenVariant.pages,
      blobSizeBytes: chosenVariant.blobSizeBytes,
      finalBlobBytes: chosenVariant.blobSizeBytes,
      captureMode: chosenVariant.captureMode,
      usedTiles: chosenVariant.usedTiles,
      renderWidthMm: chosenVariant.renderWidthMm,
      renderHeightMm: chosenVariant.renderHeightMm || null,
      imageXmm: chosenVariant.imageXmm || null,
      imageYmm: chosenVariant.imageYmm || null,
      exportedScope: {
        headerSelector: cfg.headerSelector,
        exportScopeSelector: cfg.exportScopeSelector,
        blocks: capturedBlocks.map((block) => block.id),
      },
      pageBreaks: chosenVariant.pageBreaks,
      softBudgetHit: chosenVariant.softBudgetHit,
      hardBudgetHit: chosenVariant.hardBudgetHit,
      includedSectionHeader: Boolean(sectionHeaderEl),
      layoutMode: chosenVariant.layoutMode,
      blockFormats: chosenVariant.blockFormats,
      selectedCodecPerBlock: chosenVariant.selectedCodecPerBlock || {},
      finalPosterCodec: chosenVariant.finalPosterCodec || null,
      finalPosterBytesEstimate: chosenVariant.finalPosterBytesEstimate || 0,
      posterCanvasPx: chosenVariant.posterCanvasPx || null,
      pdfPageMm: chosenVariant.pdfPageMm || null,
      usedCustomPageSize: Boolean(chosenVariant.usedCustomPageSize),
      singlePageSatisfied: Boolean(chosenVariant.singlePageSatisfied),
      visualBlocksIncluded: chosenVariant.visualBlocksIncluded || [],
      posterReportRootLeftPx: resultMeta.posterLayoutMetrics
        ? resultMeta.posterLayoutMetrics.reportRootLeftPx
        : null,
      posterReportRootRightPx: resultMeta.posterLayoutMetrics
        ? resultMeta.posterLayoutMetrics.reportRootRightPx
        : null,
      posterReportRootCenterDeltaPx: resultMeta.posterLayoutMetrics
        ? resultMeta.posterLayoutMetrics.reportRootCenterDeltaPx
        : null,
      snapshotReplacementMode: resultMeta.snapshotReplacementStats
        ? resultMeta.snapshotReplacementStats.mode
        : "css-only",
      snapshotReplacementTotal: resultMeta.snapshotReplacementStats
        ? resultMeta.snapshotReplacementStats.total
        : 0,
      snapshotReplacementLabels: resultMeta.snapshotReplacementStats
        ? resultMeta.snapshotReplacementStats.labels
        : [],
      panelSnapshotBlocks: resultMeta.snapshotReplacementStats
        ? resultMeta.snapshotReplacementStats.panelBlocks
        : [],
      warnings: resultMeta.warnings.slice(),
      timings: {
        ...timings,
        presetAttempts: chosenVariant.variantAttempts,
      },
    });

    if (cfg.debugPdf || cfg.debug) {
      console.groupCollapsed("[PPCCR PDF] Export debug");
      console.log("canvasReport:", resultMeta.canvasReport);
      console.log("dashboardCapture:", resultMeta.dashboardCapture);
      console.log("blockCaptures:", resultMeta.blockCaptures);
      console.log("fallbackTilesUsed:", resultMeta.fallbackTilesUsed);
      console.log("tilesCount:", resultMeta.tilesCount);
      console.log("snapshotReplacements:", snapshotReplacements.length);
      console.log("snapshotReplacementStats:", resultMeta.snapshotReplacementStats);
      console.log("chosenPreset:", chosenVariant.chosenPreset);
      console.log("blobSizeBytes:", chosenVariant.blobSizeBytes);
      console.log("layoutMode:", chosenVariant.layoutMode);
      console.log("pageBreaks:", chosenVariant.pageBreaks);
      console.log("posterCanvasPx:", chosenVariant.posterCanvasPx);
      console.log("posterLayoutMetrics:", resultMeta.posterLayoutMetrics);
      console.log("pdfPageMm:", chosenVariant.pdfPageMm);
      console.log("imageXmm:", chosenVariant.imageXmm);
      console.log("imageYmm:", chosenVariant.imageYmm);
      console.log("selectedCodecPerBlock:", chosenVariant.selectedCodecPerBlock);
      console.log("finalPosterCodec:", chosenVariant.finalPosterCodec);
      console.groupEnd();
    }

    return {
      filename,
      pages: chosenVariant.pages,
      blobSizeBytes: chosenVariant.blobSizeBytes,
      chosenPreset: chosenVariant.chosenPreset,
      captureMode: chosenVariant.captureMode,
      usedTiles: chosenVariant.usedTiles,
      fallbackTilesUsed: resultMeta.fallbackTilesUsed,
      tilesCount: resultMeta.tilesCount,
      canvasReport: resultMeta.canvasReport,
      layoutMode: chosenVariant.layoutMode,
      includedSectionHeader: Boolean(sectionHeaderEl),
      pageBreaks: chosenVariant.pageBreaks,
      blockFormats: chosenVariant.blockFormats,
      pageCount: chosenVariant.pages,
      selectedCodecPerBlock: chosenVariant.selectedCodecPerBlock || {},
      finalPosterCodec: chosenVariant.finalPosterCodec || null,
      finalPosterBytesEstimate: chosenVariant.finalPosterBytesEstimate || 0,
      finalBlobBytes: chosenVariant.blobSizeBytes,
      posterCanvasPx: chosenVariant.posterCanvasPx || null,
      pdfPageMm: chosenVariant.pdfPageMm || null,
      imageXmm: chosenVariant.imageXmm || null,
      imageYmm: chosenVariant.imageYmm || null,
      usedCustomPageSize: Boolean(chosenVariant.usedCustomPageSize),
      singlePageSatisfied: Boolean(chosenVariant.singlePageSatisfied),
      visualBlocksIncluded: chosenVariant.visualBlocksIncluded || [],
      posterReportRootLeftPx: resultMeta.posterLayoutMetrics
        ? resultMeta.posterLayoutMetrics.reportRootLeftPx
        : null,
      posterReportRootRightPx: resultMeta.posterLayoutMetrics
        ? resultMeta.posterLayoutMetrics.reportRootRightPx
        : null,
      posterReportRootCenterDeltaPx: resultMeta.posterLayoutMetrics
        ? resultMeta.posterLayoutMetrics.reportRootCenterDeltaPx
        : null,
      snapshotReplacementMode: resultMeta.snapshotReplacementStats
        ? resultMeta.snapshotReplacementStats.mode
        : "css-only",
      snapshotReplacementTotal: resultMeta.snapshotReplacementStats
        ? resultMeta.snapshotReplacementStats.total
        : 0,
      snapshotReplacementLabels: resultMeta.snapshotReplacementStats
        ? resultMeta.snapshotReplacementStats.labels
        : [],
      panelSnapshotBlocks: resultMeta.snapshotReplacementStats
        ? resultMeta.snapshotReplacementStats.panelBlocks
        : [],
      softBudgetHit: chosenVariant.softBudgetHit,
      hardBudgetHit: chosenVariant.hardBudgetHit,
    };
  } catch (error) {
    timings.totalMs = round2(nowMs() - totalStart);
    updatePdfDebugState({
      warnings: resultMeta.warnings.slice(),
      timings,
    });
    console.error("[PPCCR PDF] ERROR", error);
    console.groupCollapsed("[PPCCR PDF] Diagnóstico");
    console.log("canvasReport:", resultMeta.canvasReport);
    console.log("dashboardCapture:", resultMeta.dashboardCapture);
    console.log("fallbackTilesUsed:", resultMeta.fallbackTilesUsed);
    console.log("tilesCount:", resultMeta.tilesCount);
    console.groupEnd();
    window.alert("No se pudo exportar. Ver consola.");
    throw error;
  } finally {
    cleanupPosterSnapshotHost(posterHostContext);
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

async function ensureHtml2CanvasLib() {
  const html2canvasFn = resolveHtml2Canvas();
  if (html2canvasFn) {
    return html2canvasFn;
  }

  if (!window.__ppccrHtml2CanvasPromise) {
    window.__ppccrHtml2CanvasPromise = (async () => {
      try {
        await loadScript(HTML2CANVAS_CDN, () => Boolean(resolveHtml2Canvas()));
      } catch (primaryError) {
        await loadScript(
          HTML2PDF_BUNDLE_CDN,
          () => Boolean(resolveHtml2Canvas()),
        );
      }

      const resolved = resolveHtml2Canvas();
      if (!resolved) {
        throw new Error("No se pudo inicializar html2canvas para snapshots de print.");
      }
      return resolved;
    })().catch((error) => {
      window.__ppccrHtml2CanvasPromise = null;
      throw error;
    });
  }

  return window.__ppccrHtml2CanvasPromise;
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

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
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

function resolveElementWithin(root, selector, label) {
  if (!root) {
    throw new Error((label || "Elemento") + " no encontró root para buscar " + selector + ".");
  }

  const el = root.querySelector(selector);
  if (!el) {
    throw new Error((label || "Elemento") + " no encontrado para selector: " + selector);
  }

  return el;
}

function buildExportBlockManifest({
  cfg,
  headerEl,
  sectionHeaderEl,
  reportRootEl,
  dashboardSelector,
}) {
  const isPosterMode = cfg && cfg.pageStrategy === "single-page-poster";
  const blockFormat = isPosterMode ? "PNG" : null;

  return [
    {
      id: "branding-top",
      label: "Branding superior",
      element: headerEl,
      format: "PNG",
      cloneArea: "header",
      pageBreakBefore: false,
    },
    sectionHeaderEl
      ? {
          id: "section-header",
          label: "Encabezado de sección KPI",
          element: sectionHeaderEl,
          format: "PNG",
          cloneArea: "scope",
          pageBreakBefore: false,
        }
      : null,
    {
      id: "report-header",
      label: "Encabezado consolidado KPI",
      element: resolveElementWithin(
        reportRootEl,
        ".kpiDash__reportHeader",
        "Encabezado consolidado KPI",
      ),
      format: "PNG",
      cloneArea: "dashboard",
      pageBreakBefore: false,
      captureTargetSelector: dashboardSelector || "",
    },
    {
      id: "executive",
      label: "Resumen ejecutivo KPI",
      element: resolveElementWithin(reportRootEl, ".kpiDash__exec", "Resumen ejecutivo KPI"),
      format: blockFormat || "JPEG",
      cloneArea: "dashboard",
      pageBreakBefore: false,
      captureTargetSelector: dashboardSelector || "",
    },
    {
      id: "charts-row",
      label: "Fila de charts KPI",
      element: resolveElementWithin(reportRootEl, ".kpiDash__charts", "Fila de charts KPI"),
      format: blockFormat || "JPEG",
      cloneArea: "dashboard",
      pageBreakBefore: false,
      captureTargetSelector: dashboardSelector || "",
    },
    {
      id: "funnel",
      label: "Flujo FIT por estación",
      element: resolveElementWithin(reportRootEl, ".kpiDash__funnel", "Flujo FIT por estación"),
      format: blockFormat || "JPEG",
      cloneArea: "dashboard",
      pageBreakBefore: isPosterMode ? false : true,
      captureTargetSelector: dashboardSelector || "",
    },
    {
      id: "stock",
      label: "Stock de kits por estación",
      element: resolveElementWithin(reportRootEl, ".kpiDash__stock", "Stock de kits por estación"),
      format: "PNG",
      cloneArea: "dashboard",
      pageBreakBefore: false,
      captureTargetSelector: dashboardSelector || "",
    },
    {
      id: "consultas-post-stock",
      label: "Consultas realizadas posteriormente a finalizar stock",
      element: resolveElementWithin(
        reportRootEl,
        ".kpiDash__consultasPostStock",
        "Consultas realizadas posteriormente a finalizar stock",
      ),
      format: blockFormat || "PNG",
      cloneArea: "dashboard",
      pageBreakBefore: false,
      captureTargetSelector: dashboardSelector || "",
    },
  ].filter(Boolean);
}

async function captureExportBlocks({
  manifest,
  libs,
  cfg,
  pageMetrics,
  headerCloneCss,
  dashboardCloneCss,
  snapshotReplacements,
  dashboardSelector,
  baseCaptureScale,
  resultMeta,
}) {
  const captured = [];

  for (let i = 0; i < manifest.length; i += 1) {
    const block = manifest[i];
    const startedAt = nowMs();
    const capture = await captureExportBlock({
      block,
      libs,
      cfg,
      pageMetrics,
      headerCloneCss,
      dashboardCloneCss,
      snapshotReplacements,
      dashboardSelector,
      baseCaptureScale,
      resultMeta,
    });

    const capturedBlock = {
      ...block,
      canvas: capture.canvas,
      captureScale: capture.captureScale,
      usedTiles: capture.usedTiles,
      tileCount: capture.tileCount,
    };

    resultMeta.blockCaptures.push({
      id: block.id,
      label: block.label,
      format: block.format,
      captureScale: round2(capture.captureScale),
      width: capture.canvas.width,
      height: capture.canvas.height,
      usedTiles: capture.usedTiles,
      tileCount: capture.tileCount,
      durationMs: round2(nowMs() - startedAt),
    });

    captured.push(capturedBlock);
  }

  return captured;
}

async function captureExportBlock({
  block,
  libs,
  cfg,
  pageMetrics,
  headerCloneCss,
  dashboardCloneCss,
  snapshotReplacements,
  dashboardSelector,
  baseCaptureScale,
  resultMeta,
}) {
  const captureScale = computeSafeScale(
    block.element,
    baseCaptureScale,
    cfg.maxDimPx,
  );

  const isHeaderBlock = block.cloneArea === "header";
  const isDashboardBlock = block.cloneArea === "dashboard";
  const extraCloneCss = isHeaderBlock ? headerCloneCss : dashboardCloneCss;
  const captureTargetSelector =
    typeof block.captureTargetSelector === "string"
      ? block.captureTargetSelector
      : isDashboardBlock
        ? dashboardSelector
        : "";
  const cloneMutator = isHeaderBlock
    ? (clonedDoc) => {
        normalizeHeaderForPdfClone(clonedDoc, cfg.headerSelector);
      }
    : isDashboardBlock
      ? (clonedDoc) => {
          stabilizeTrkGaugeInClone(clonedDoc, dashboardSelector, "kpiDash--pdfV3");
        }
      : null;
  const replacements = isDashboardBlock ? snapshotReplacements : [];

  try {
    const canvas = await captureElement(block.element, {
      html2canvas: libs.html2canvas,
      scale: captureScale,
      backgroundColor: "#FFF",
      extraCloneCss,
      ignoreSelectors: cfg.ignoreSelectors,
      debug: cfg.debug,
      targetSelector: captureTargetSelector,
      snapshotReplacements: replacements,
      cloneMutator,
    });

    if (!isCanvasOverLimits(canvas, cfg.maxDimPx, cfg.maxAreaPx)) {
      return {
        canvas,
        captureScale,
        usedTiles: false,
        tileCount: 0,
      };
    }

    throw new Error("Captura por bloque excedió límites seguros. Se intentará fallback por tiles.");
  } catch (captureError) {
    try {
      const pageContentHeightMm =
        pageMetrics.pageHeightMm -
        pageMetrics.margins.top -
        pageMetrics.margins.bottom -
        cfg.footerMm;
      const slices = await captureDashboardTiles({
        element: block.element,
        html2canvas: libs.html2canvas,
        scale: captureScale,
        maxDimPx: cfg.maxDimPx,
        maxAreaPx: cfg.maxAreaPx,
        pageContentWidthMm: pageMetrics.contentWidthMm,
        pageContentHeightMm,
        extraCloneCss,
        ignoreSelectors: cfg.ignoreSelectors,
        cloneMutator,
        debug: cfg.debug,
        targetSelector: captureTargetSelector,
        snapshotReplacements: replacements,
      });
      const stitched = stitchCanvasesVertically(slices);
      resultMeta.fallbackTilesUsed = true;
      resultMeta.tilesCount += slices.length;
      pushPdfWarning(
        resultMeta,
        "Se utilizó fallback por tiles para el bloque " + block.id + ".",
      );

      return {
        canvas: stitched,
        captureScale,
        usedTiles: true,
        tileCount: slices.length,
      };
    } catch (tileError) {
      console.warn(
        "[PPCCR PDF] Falló captura del bloque. Se usa placeholder.",
        {
          blockId: block.id,
          captureError,
          tileError,
        },
      );
      pushPdfWarning(
        resultMeta,
        "Falló captura del bloque " + block.id + ". Se usa placeholder.",
      );
      return {
        canvas: createPlaceholderCanvasFromElement(
          block.element,
          captureScale,
          block.label,
        ),
        captureScale,
        usedTiles: false,
        tileCount: 0,
      };
    }
  }
}

function stitchCanvasesVertically(slices) {
  const validSlices = Array.isArray(slices) ? slices.filter(Boolean) : [];
  if (validSlices.length === 0) {
    throw new Error("No hay slices válidos para recomponer el bloque exportado.");
  }

  if (validSlices.length === 1) {
    return validSlices[0];
  }

  const width = Math.max.apply(
    null,
    validSlices.map((slice) => Math.max(1, Number(slice.width) || 1)),
  );
  const height = validSlices.reduce((sum, slice) => {
    return sum + Math.max(1, Number(slice.height) || 1);
  }, 0);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = Math.max(1, height);

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return validSlices[0];
  }

  let offsetY = 0;
  validSlices.forEach((slice) => {
    const drawHeight = Math.max(1, Number(slice.height) || 1);
    ctx.drawImage(slice, 0, offsetY);
    offsetY += drawHeight;
  });

  return canvas;
}

async function createPosterSnapshotHost({
  cfg,
  libs,
  headerEl,
  exportScopeEl,
  dashEl,
  reportRootEl,
  sectionHeaderEl,
  snapshotReplacements,
}) {
  cleanupPosterSnapshotHost({ host: document.getElementById(POSTER_HOST_ID) });

  const host = document.createElement("div");
  host.id = POSTER_HOST_ID;
  host.className = "kpiDash__posterSnapshot";
  host.setAttribute("aria-hidden", "true");

  const style = document.createElement("style");
  style.setAttribute("data-ppccr-pdf-poster-style", "true");
  style.textContent = buildPosterSnapshotStyles(cfg);
  host.appendChild(style);

  const headerClone = headerEl.cloneNode(true);
  headerClone.removeAttribute("id");
  headerClone.setAttribute("data-ppccr-pdf-block", "branding-top");
  normalizeHeaderCloneForPoster(headerClone);
  host.appendChild(headerClone);

  const scopeClone = exportScopeEl.cloneNode(false);
  scopeClone.id = POSTER_HOST_SCOPE_ID;
  scopeClone.classList.add("kpiDash__posterScope");

  let sectionHeaderClone = null;
  if (sectionHeaderEl) {
    sectionHeaderClone = sectionHeaderEl.cloneNode(true);
    sectionHeaderClone.setAttribute("data-ppccr-pdf-block", "section-header");
    scopeClone.appendChild(sectionHeaderClone);
  }

  const dashboardClone = dashEl.cloneNode(false);
  dashboardClone.id = POSTER_HOST_DASHBOARD_ID;
  dashboardClone.classList.add("kpiDash__posterDashboard");
  dashboardClone.removeAttribute("data-kpi-dashboard");

  const reportRootClone = reportRootEl.cloneNode(true);
  reportRootClone.setAttribute("data-ppccr-poster-report-root", "true");
  reportRootClone.classList.add("kpiDash--pdfV4Poster");
  dashboardClone.appendChild(reportRootClone);
  scopeClone.appendChild(dashboardClone);
  host.appendChild(scopeClone);

  document.body.appendChild(host);

  snapshotCanvasNodesToImages({
    sourceRoot: dashEl,
    targetRoot: dashboardClone,
  });
  applySnapshotReplacementsToRoot({
    targetRoot: dashboardClone,
    replacements: snapshotReplacements,
  });
  await replaceSvgNodesWithSnapshots({
    sourceRoot: dashEl,
    targetRoot: dashboardClone,
    html2canvas: libs.html2canvas,
    selectors: cfg.snapshotSelectors,
    scale: cfg.snapshotScale,
    debug: cfg.debug,
  });

  return {
    host,
    headerEl: headerClone,
    sectionHeaderEl: sectionHeaderClone,
    reportRootEl: reportRootClone,
    dashboardSelector: "#" + POSTER_HOST_DASHBOARD_ID,
  };
}

function cleanupPosterSnapshotHost(context) {
  const host = context && context.host ? context.host : null;
  if (host && host.parentNode) {
    host.parentNode.removeChild(host);
  }
}

function buildPosterSnapshotStyles(cfg) {
  const widthPx = Math.max(1280, Number(cfg.posterViewportWidthPx) || 1460);
  return [
    ".kpiDash__posterSnapshot {",
    "  position: fixed;",
    "  left: -24000px;",
    "  top: 0;",
    "  width: " + widthPx + "px;",
    "  background: #ffffff;",
    "  z-index: -1;",
    "  pointer-events: none;",
    "  overflow: hidden;",
    "  --desktop-shell-max: 1280px;",
    "  --desktop-reading-max: 1120px;",
    "  --desktop-wide-max: 1380px;",
    "  --desktop-gutter: 18px;",
    "  --desktop-section-gap: clamp(36px, 4vw, 64px);",
    "  --desktop-card-gap: clamp(18px, 1.8vw, 28px);",
    "  --desktop-panel-radius: 30px;",
    "}",
    ".kpiDash__posterSnapshot, .kpiDash__posterSnapshot * {",
    "  -webkit-print-color-adjust: exact !important;",
    "  print-color-adjust: exact !important;",
    "}",
    ".kpiDash__posterSnapshot .container {",
    "  width: calc(100% - (var(--desktop-gutter) * 2)) !important;",
    "  max-width: none !important;",
    "  margin-inline: auto !important;",
    "}",
    ".kpiDash__posterSnapshot .kpiDash__posterScope,",
    ".kpiDash__posterSnapshot .kpiDash__posterDashboard {",
    "  width: calc(100% - (var(--desktop-gutter) * 2)) !important;",
    "  max-width: none !important;",
    "  margin-inline: auto !important;",
    "}",
    ".kpiDash__posterSnapshot .kpiDash__posterScope {",
    "  padding-left: 0 !important;",
    "  padding-right: 0 !important;",
    "  box-sizing: border-box !important;",
    "}",
    ".kpiDash__posterSnapshot #ppccr-pdf-poster-dashboard,",
    ".kpiDash__posterSnapshot .kpiDash__posterDashboard,",
    ".kpiDash__posterSnapshot [data-kpi-dashboard] {",
    "  margin-inline: auto !important;",
    "  padding-inline: 12px !important;",
    "  box-sizing: border-box !important;",
    "}",
    ".kpiDash__posterSnapshot [data-ppccr-poster-report-root],",
    ".kpiDash__posterSnapshot [data-kpi-report-root] {",
    "  width: 100% !important;",
    "  max-width: none !important;",
    "  margin-inline: auto !important;",
    "}",
    ".kpiDash__posterSnapshot .partners-bar .container {",
    "  width: calc(100% - (var(--desktop-gutter) * 2)) !important;",
    "  max-width: none !important;",
    "}",
    ".kpiDash__posterSnapshot .site-header {",
    "  position: static !important;",
    "  left: auto !important;",
    "  top: auto !important;",
    "  width: 100% !important;",
    "  max-width: none !important;",
    "}",
    ".kpiDash__posterSnapshot .site-topbar,",
    ".kpiDash__posterSnapshot .topbar,",
    ".kpiDash__posterSnapshot .site-topbar__inner {",
    "  width: 100% !important;",
    "  max-width: none !important;",
    "}",
    ".kpiDash__posterSnapshot .site-topbar__inner {",
    "  width: calc(100% - (var(--desktop-gutter) * 2)) !important;",
    "  margin-inline: auto !important;",
    "  background: transparent !important;",
    "}",
    ".kpiDash__posterSnapshot .site-nav,",
    ".kpiDash__posterSnapshot #mobileDockWrap,",
    ".kpiDash__posterSnapshot .nav-toggle,",
    ".kpiDash__posterSnapshot .mobile-fixed-dock,",
    ".kpiDash__posterSnapshot .back-to-top,",
    ".kpiDash__posterSnapshot .modal,",
    ".kpiDash__posterSnapshot .modal-backdrop,",
    ".kpiDash__posterSnapshot .auth-gate,",
    ".kpiDash__posterSnapshot #auth-gate,",
    ".kpiDash__posterSnapshot .auth-gate-backdrop,",
    ".kpiDash__posterSnapshot .toast,",
    ".kpiDash__posterSnapshot .snackbar,",
    ".kpiDash__posterSnapshot .tooltip,",
    ".kpiDash__posterSnapshot .tippy-box,",
    ".kpiDash__posterSnapshot .loading-overlay {",
    "  display: none !important;",
    "  visibility: hidden !important;",
    "}",
    ".kpiDash__posterSnapshot .logo-strip {",
    "  margin-bottom: 16px !important;",
    "}",
    ".kpiDash__posterSnapshot .kpiDash__reportActions,",
    ".kpiDash__posterSnapshot .kpiDash__reportBtn,",
    ".kpiDash__posterSnapshot .kpiDash__reportBtn--primary {",
    "  display: none !important;",
    "}",
    ".kpiDash__posterSnapshot .kpiDash__reportHeader,",
    ".kpiDash__posterSnapshot .kpiDash__execPanel,",
    ".kpiDash__posterSnapshot .kpiDash__panel,",
    ".kpiDash__posterSnapshot .kpiDash__funnel,",
    ".kpiDash__posterSnapshot .kpiDash__stock,",
    ".kpiDash__posterSnapshot .kpiDash__consultasPostStock,",
    ".kpiDash__posterSnapshot .kpiDash__tableWrap,",
    ".kpiDash__posterSnapshot .kpiDash__chart,",
    ".kpiDash__posterSnapshot .ppccr-sankey {",
    "  overflow: visible !important;",
    "  break-inside: avoid;",
    "  page-break-inside: avoid;",
    "}",
    ".kpiDash__posterSnapshot .kpiDash__tableWrap {",
    "  overflow: visible !important;",
    "}",
    ".kpiDash__posterSnapshot .kpiDash__table {",
    "  min-width: 0 !important;",
    "  width: 100% !important;",
    "}",
    ".kpiDash__posterSnapshot .kpiDash {",
    "  margin-top: 0 !important;",
    "}",
    ".kpiDash__posterSnapshot .kpiDash__reportRoot {",
    "  margin-top: 22px !important;",
    "}",
    ".kpiDash__posterSnapshot .kpiDash__shell {",
    "  display: grid !important;",
    "  grid-template-columns: repeat(12, minmax(0, 1fr)) !important;",
    "}",
    ".kpiDash__posterSnapshot .kpiDash__reportHeader,",
    ".kpiDash__posterSnapshot .kpiDash__exec,",
    ".kpiDash__posterSnapshot .kpiDash__charts,",
    ".kpiDash__posterSnapshot .kpiDash__funnel--avance,",
    ".kpiDash__posterSnapshot .kpiDash__funnel[aria-label='Flujo FIT por estación'],",
    ".kpiDash__posterSnapshot .kpiDash__stock,",
    ".kpiDash__posterSnapshot .kpiDash__consultasPostStock {",
    "  grid-column: 1 / -1 !important;",
    "}",
    ".kpiDash__posterSnapshot .kpiDash__reportHeader {",
    "  flex-direction: row !important;",
    "  align-items: center !important;",
    "  padding: 0.92rem 0.96rem !important;",
    "}",
    ".kpiDash__posterSnapshot .kpiDash__reportHeadMeta {",
    "  width: auto !important;",
    "  justify-items: end !important;",
    "}",
    ".kpiDash__posterSnapshot .kpiDash__reportHeadMain h3 {",
    "  font-size: 1.04rem !important;",
    "  letter-spacing: -0.015em !important;",
    "}",
    ".kpiDash__posterSnapshot .kpiDash__reportHeadMain p {",
    "  margin-top: 0.18rem !important;",
    "  font-size: 0.76rem !important;",
    "  line-height: 1.32 !important;",
    "}",
    ".kpiDash__posterSnapshot .kpiDash__consultasPostStockHeader {",
    "  grid-template-columns: minmax(0, 1fr) minmax(198px, 214px) !important;",
    "  align-items: center !important;",
    "  column-gap: 0.88rem !important;",
    "  row-gap: 0.6rem !important;",
    "  margin-bottom: 0.72rem !important;",
    "}",
    ".kpiDash__posterSnapshot .kpiDash__consultasPostStockIntro,",
    ".kpiDash__posterSnapshot .kpiDash__consultasPostStockSubtitle,",
    ".kpiDash__posterSnapshot .kpiDash__consultasPostStockNarrativeGroup {",
    "  max-width: none !important;",
    "}",
    ".kpiDash__posterSnapshot .kpiDash__consultasPostStockNarrativeGroup {",
    "  row-gap: 0.12rem !important;",
    "}",
    ".kpiDash__posterSnapshot .kpiDash__consultasPostStockNarrativeLine {",
    "  font-size: 0.74rem !important;",
    "  line-height: 1.28 !important;",
    "  white-space: nowrap !important;",
    "}",
    ".kpiDash__posterSnapshot .kpiDash__consultasPostStockTotal {",
    "  width: 214px !important;",
    "  min-height: 118px !important;",
    "  border: 1px solid rgba(12, 86, 156, 0.28) !important;",
    "  border-radius: 16px !important;",
    "  background: #1768b6 !important;",
    "  padding: 0.88rem 0.94rem 0.92rem !important;",
    "  box-shadow: 0 10px 18px rgba(8, 58, 112, 0.12) !important;",
    "  justify-self: center !important;",
    "  justify-items: center !important;",
    "  align-content: center !important;",
    "  text-align: center !important;",
    "  grid-template-rows: auto auto !important;",
    "  gap: 0.44rem !important;",
    "}",
    ".kpiDash__posterSnapshot .kpiDash__consultasPostStockLabel {",
    "  max-width: 18.4ch !important;",
    "  font-size: 0.59rem !important;",
    "  line-height: 1.08 !important;",
    "  letter-spacing: 0.029em !important;",
    "  font-weight: 600 !important;",
    "  text-align: center !important;",
    "  text-wrap: balance !important;",
    "  transform: translateX(-6px) !important;",
    "}",
    ".kpiDash__posterSnapshot .kpiDash__consultasPostStockLabelLine {",
    "  white-space: nowrap !important;",
    "}",
    ".kpiDash__posterSnapshot .kpiDash__consultasPostStockValue {",
    "  font-size: 2.12rem !important;",
    "  line-height: 0.96 !important;",
    "  letter-spacing: -0.04em !important;",
    "}",
    ".kpiDash__posterSnapshot .kpiDash__consultasPostStockMeta {",
    "  display: none !important;",
    "}",
    ".kpiDash__posterSnapshot .kpiDash__exec {",
    "  display: grid !important;",
    "  grid-template-columns: repeat(12, minmax(0, 1fr)) !important;",
    "}",
    ".kpiDash__posterSnapshot .kpiDash__exec > .kpiDash__summary {",
    "  grid-column: span 6 !important;",
    "}",
    ".kpiDash__posterSnapshot .kpiDash__exec > .kpiDash__fitFlow {",
    "  grid-column: span 6 !important;",
    "}",
    ".kpiDash__posterSnapshot .kpiDash__execHeader h4 {",
    "  font-size: 1.02rem !important;",
    "  letter-spacing: -0.012em !important;",
    "}",
    ".kpiDash__posterSnapshot .kpiDash__execHeader p {",
    "  font-size: 0.76rem !important;",
    "  line-height: 1.32 !important;",
    "}",
    ".kpiDash__posterSnapshot .kpiDash__summaryHeadTotal {",
    "  font-size: 2.24rem !important;",
    "  letter-spacing: -0.028em !important;",
    "  line-height: 0.9 !important;",
    "}",
    ".kpiDash__posterSnapshot .kpiDash__summaryDistribution {",
    "  gap: 0.82rem !important;",
    "  padding-top: 0.74rem !important;",
    "}",
    ".kpiDash__posterSnapshot .kpiDash__summaryBar {",
    "  height: 13px !important;",
    "  box-shadow: inset 0 0 0 1px rgba(115, 160, 208, 0.14) !important;",
    "}",
    ".kpiDash__posterSnapshot .kpiDash__summaryBarSegment--fit {",
    "  background: linear-gradient(92deg, #0b4d8d, #2f7ec8) !important;",
    "}",
    ".kpiDash__posterSnapshot .kpiDash__summaryBarSegment--outside {",
    "  background: linear-gradient(92deg, #69a7e1, #9bc8f2) !important;",
    "}",
    ".kpiDash__posterSnapshot .kpiDash__summarySplit {",
    "  gap: 0.82rem !important;",
    "}",
    ".kpiDash__posterSnapshot .kpiDash__summaryMainMetric {",
    "  column-gap: 0.5rem !important;",
    "  row-gap: 0.12rem !important;",
    "  padding: 0.3rem 0 0.2rem !important;",
    "}",
    ".kpiDash__posterSnapshot .kpiDash__summaryMainLabel {",
    "  font-size: 0.79rem !important;",
    "}",
    ".kpiDash__posterSnapshot .kpiDash__summaryMainValue {",
    "  font-size: 1.18rem !important;",
    "  width: 3.25ch !important;",
    "}",
    ".kpiDash__posterSnapshot .kpiDash__summaryMainMeta {",
    "  font-size: 0.74rem !important;",
    "  line-height: 1.28 !important;",
    "}",
    ".kpiDash__posterSnapshot .kpiDash__summaryReasons {",
    "  gap: 0.8rem !important;",
    "  padding-top: 0.82rem !important;",
    "}",
    ".kpiDash__posterSnapshot .kpiDash__summaryBadge {",
    "  min-height: 86px !important;",
    "  padding: 0.7rem 0.74rem !important;",
    "  box-shadow: 0 5px 14px rgba(18, 72, 128, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.84) !important;",
    "}",
    ".kpiDash__posterSnapshot .kpiDash__summaryBadgeLabel {",
    "  font-size: 0.75rem !important;",
    "}",
    ".kpiDash__posterSnapshot .kpiDash__summaryBadgeValue {",
    "  font-size: 1.08rem !important;",
    "}",
    ".kpiDash__posterSnapshot .kpiDash__summaryBadgePct {",
    "  font-size: 0.73rem !important;",
    "}",
    ".kpiDash__posterSnapshot .kpiDash__trkBody {",
    "  padding: 0.78rem 0.9rem !important;",
    "  gap: 0.8rem !important;",
    "  background: linear-gradient(160deg, #ffffff, rgba(241, 247, 253, 0.96)) !important;",
    "  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.84), 0 7px 16px rgba(18, 72, 128, 0.09) !important;",
    "}",
    ".kpiDash__posterSnapshot .kpiDash__trkTitle {",
    "  font-size: 0.98rem !important;",
    "}",
    ".kpiDash__posterSnapshot .kpiDash__trkSub {",
    "  font-size: 0.66rem !important;",
    "  line-height: 1.22 !important;",
    "}",
    ".kpiDash__posterSnapshot .kpiDash__trkValue {",
    "  font-size: 1.48rem !important;",
    "}",
    ".kpiDash__posterSnapshot .kpiDash__trkTarget {",
    "  font-size: 0.68rem !important;",
    "}",
    ".kpiDash__posterSnapshot .kpiDash__trkGap {",
    "  font-size: 0.75rem !important;",
    "}",
    ".kpiDash__posterSnapshot .kpiDash__trkFactLine {",
    "  font-size: 0.74rem !important;",
    "  line-height: 1.22 !important;",
    "}",
    ".kpiDash__posterSnapshot .kpiDash__trkFactLine strong {",
    "  font-size: 0.9rem !important;",
    "}",
    ".kpiDash__posterSnapshot .kpiDash__trkGaugeWrap {",
    "  justify-items: center !important;",
    "  min-width: 98px !important;",
    "}",
    ".kpiDash__posterSnapshot .kpiDash__trkGauge {",
    "  width: 106px !important;",
    "  height: 106px !important;",
    "}",
    ".kpiDash__posterSnapshot .kpiDash__trkGaugeValue {",
    "  font-size: 0.9rem !important;",
    "}",
    ".kpiDash__posterSnapshot .kpiDash__trkGaugeGoal {",
    "  font-size: 0.56rem !important;",
    "}",
    ".kpiDash__posterSnapshot .kpiDash__charts {",
    "  display: grid !important;",
    "  grid-template-columns: repeat(12, minmax(0, 1fr)) !important;",
    "  gap: 0.96rem !important;",
    "  align-items: stretch !important;",
    "  --kpi-chart-row-height: 314px;",
    "}",
    ".kpiDash__posterSnapshot .kpiDash__panel--bars,",
    ".kpiDash__posterSnapshot .kpiDash__panel--aux {",
    "  grid-column: span 6 !important;",
    "  padding: 0.94rem 0.88rem 0.96rem !important;",
    "}",
    ".kpiDash__posterSnapshot .kpiDash__panelHeader {",
    "  align-items: flex-start !important;",
    "  margin-bottom: 0.68rem !important;",
    "}",
    ".kpiDash__posterSnapshot .kpiDash__panelHeader h4 {",
    "  font-size: 1.04rem !important;",
    "  letter-spacing: -0.018em !important;",
    "}",
    ".kpiDash__posterSnapshot .kpiDash__panelHeader p {",
    "  padding-top: 0.08rem !important;",
    "  font-size: 0.73rem !important;",
    "  line-height: 1.32 !important;",
    "}",
  ].join("\n");
}

function normalizeHeaderCloneForPoster(headerClone) {
  if (!headerClone) {
    return;
  }

  headerClone
    .querySelectorAll(".site-nav, #mobileDockWrap, .mobile-fixed-dock, .nav-toggle")
    .forEach((node) => {
      node.remove();
    });

  headerClone.querySelectorAll(".site-topbar").forEach((node) => {
    node.style.position = "static";
    node.style.top = "auto";
    node.style.left = "auto";
  });
}

function snapshotCanvasNodesToImages({ sourceRoot, targetRoot }) {
  if (!sourceRoot || !targetRoot) {
    return;
  }

  const sourceCanvases = Array.from(sourceRoot.querySelectorAll("canvas"));
  const targetCanvases = Array.from(targetRoot.querySelectorAll("canvas"));
  const total = Math.min(sourceCanvases.length, targetCanvases.length);

  for (let i = 0; i < total; i += 1) {
    const sourceCanvas = sourceCanvases[i];
    const targetCanvas = targetCanvases[i];

    if (!sourceCanvas || !targetCanvas || !targetCanvas.parentElement) {
      continue;
    }

    if ((Number(sourceCanvas.width) || 0) <= 0 || (Number(sourceCanvas.height) || 0) <= 0) {
      continue;
    }

    try {
      const img = document.createElement("img");
      img.src = sourceCanvas.toDataURL("image/png");
      img.alt = "";
      img.decoding = "sync";
      img.setAttribute("aria-hidden", "true");
      img.style.display = "block";
      img.style.width = "100%";
      img.style.height = "auto";
      img.style.maxWidth = "100%";
      if (targetCanvas.className) {
        img.className = targetCanvas.className;
      }
      targetCanvas.parentElement.replaceChild(img, targetCanvas);
    } catch (error) {
      // no-op: se mantiene el canvas clonado como fallback.
    }
  }
}

function applySnapshotReplacementsToRoot({ targetRoot, replacements }) {
  if (!targetRoot || !Array.isArray(replacements) || replacements.length === 0) {
    return [];
  }

  const applied = [];

  replacements
    .slice()
    .sort((a, b) => b.path.length - a.path.length)
    .forEach((replacement) => {
      const target = resolveNodeByPath(targetRoot, replacement.path);
      if (!target || !target.parentElement) {
        return;
      }

      const widthPx = Number(replacement.width) > 0 ? Number(replacement.width) : target.offsetWidth;
      const heightPx =
        Number(replacement.height) > 0 ? Number(replacement.height) : target.offsetHeight;
      const fitToTarget = replacement.fitToTarget === true;
      const targetRect = target.getBoundingClientRect ? target.getBoundingClientRect() : null;
      const renderedWidth = fitToTarget
        ? Math.max(1, Math.round((targetRect && targetRect.width) || target.offsetWidth || widthPx || 1))
        : widthPx;
      const renderedHeight = fitToTarget
        ? Math.max(
            1,
            Math.round((targetRect && targetRect.height) || target.offsetHeight || heightPx || 1),
          )
        : heightPx;
      const targetClass =
        typeof target.getAttribute === "function"
          ? target.getAttribute("class") || ""
          : String(target.className || "").trim();
      const targetStyle =
        typeof window !== "undefined" && typeof window.getComputedStyle === "function"
          ? window.getComputedStyle(target)
          : null;

      const img = document.createElement("img");
      img.src = replacement.dataUrl;
      img.alt = "";
      img.decoding = "sync";
      img.setAttribute("aria-hidden", "true");
      img.className = [targetClass, "kpiDash__pdfSwapImage"].filter(Boolean).join(" ");
      img.setAttribute(
        "data-ppccr-pdf-snapshot",
        String(replacement.label || replacement.selector || "snapshot"),
      );
      img.style.display = "inline-block";
      img.style.width = renderedWidth > 0 ? renderedWidth + "px" : "100%";
      img.style.height = renderedHeight > 0 ? renderedHeight + "px" : "auto";
      img.style.maxWidth = "100%";
      img.style.objectFit = "contain";
      img.style.verticalAlign = "middle";
      img.style.boxSizing = "border-box";
      img.style.border = "0";
      img.style.padding = "0";
      img.style.background = "transparent";
      img.style.overflow = "visible";
      if (targetStyle) {
        if (targetStyle.borderRadius && targetStyle.borderRadius !== "0px") {
          img.style.borderRadius = targetStyle.borderRadius;
        }
        if (targetStyle.boxShadow && targetStyle.boxShadow !== "none") {
          img.style.boxShadow = targetStyle.boxShadow;
        }
      }

      target.parentElement.replaceChild(img, target);
      applied.push({
        label: String(replacement.label || replacement.selector || "snapshot"),
        width: renderedWidth,
        height: renderedHeight,
        element: img,
      });
    });

  return applied;
}

async function replaceSvgNodesWithSnapshots({
  sourceRoot,
  targetRoot,
  html2canvas,
  selectors,
  scale,
  debug,
}) {
  if (!sourceRoot || !targetRoot || !Array.isArray(selectors) || selectors.length === 0) {
    return;
  }

  const seenPaths = new Set();

  for (let i = 0; i < selectors.length; i += 1) {
    const selectorEntry = normalizeSnapshotSelectorEntry(selectors[i]);
    if (!selectorEntry) {
      continue;
    }
    const sourceNodes = Array.from(sourceRoot.querySelectorAll(selectorEntry.selector));

    for (let index = 0; index < sourceNodes.length; index += 1) {
      const sourceNode = sourceNodes[index];
      if (!sourceNode || String(sourceNode.tagName || "").toLowerCase() !== "svg") {
        continue;
      }

      const path = getNodePathWithinRoot(sourceNode, sourceRoot);
      const pathKey = Array.isArray(path) ? path.join(".") : "";
      if (!path || !pathKey || seenPaths.has(pathKey)) {
        continue;
      }

      const targetNode = resolveNodeByPath(targetRoot, path);
      if (!targetNode || !targetNode.parentElement) {
        continue;
      }

      const rect = sourceNode.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) {
        continue;
      }

      try {
        const canvas = await captureLiveNodeSnapshot({
          node: sourceNode,
          html2canvas,
          scale: selectorEntry.scale || scale,
          debug,
        });
        const img = document.createElement("img");
        img.src = canvas.toDataURL("image/png");
        img.alt = "";
        img.decoding = "sync";
        img.setAttribute("aria-hidden", "true");
        const targetClass =
          typeof targetNode.getAttribute === "function"
            ? targetNode.getAttribute("class") || ""
            : String(targetNode.className || "").trim();
        img.className = [targetClass, "kpiDash__pdfSwapImage"].filter(Boolean).join(" ");
        img.setAttribute(
          "data-ppccr-pdf-snapshot",
          String(selectorEntry.label || selectorEntry.selector),
        );
        img.style.display = "block";
        img.style.width = rect.width + "px";
        img.style.height = rect.height + "px";
        img.style.maxWidth = "100%";
        img.style.objectFit = "contain";
        targetNode.parentElement.replaceChild(img, targetNode);
        seenPaths.add(pathKey);
      } catch (error) {
        // Se conserva el SVG clonado si el snapshot falla.
      }
    }
  }
}

async function buildAdaptiveSinglePagePosterPdfVariant({
  libs,
  blocks,
  cfg,
  resultMeta,
}) {
  const attempts = [];
  const posterAssetCache = new Map();
  const strategies = await buildPosterCodecStrategies({ libs, blocks });
  let bestSoftBudget = null;
  let bestHardBudget = null;
  let smallestVariant = null;

  outer: for (let i = 0; i < cfg.preferredScalePresets.length; i += 1) {
    const preset = cfg.preferredScalePresets[i];

    for (let j = 0; j < strategies.length; j += 1) {
      const strategy = strategies[j];
      const variant = await buildSinglePagePosterPdfVariant({
        libs,
        blocks,
        cfg,
        resultMeta,
        preset,
        strategy,
        posterAssetCache,
      });

      attempts.push({
        name: preset.name,
        scale: preset.scale,
        jpegQuality: preset.jpegQuality,
        strategy: strategy.name,
        pages: variant.pages,
        blobSizeBytes: variant.blobSizeBytes,
        captureMode: variant.captureMode,
        usedTiles: variant.usedTiles,
        renderWidthMm: variant.renderWidthMm,
        layoutMode: variant.layoutMode,
        finalPosterCodec: variant.finalPosterCodec,
      });

      if (!smallestVariant || variant.blobSizeBytes < smallestVariant.blobSizeBytes) {
        smallestVariant = variant;
      }

      if (
        !bestHardBudget &&
        variant.singlePageSatisfied &&
        variant.blobSizeBytes <= cfg.hardMaxPdfBytes
      ) {
        bestHardBudget = variant;
      }

      if (
        variant.singlePageSatisfied &&
        variant.blobSizeBytes <= cfg.softMaxPdfBytes
      ) {
        bestSoftBudget = variant;
        break outer;
      }
    }
  }

  const chosenVariant = bestSoftBudget || bestHardBudget || smallestVariant;
  if (!chosenVariant) {
    throw new Error("No se pudo generar ninguna variante válida del PDF single-page poster.");
  }

  if (!bestSoftBudget && bestHardBudget) {
    pushPdfWarning(
      resultMeta,
      "Ninguna variante single-page entró en el soft budget. Se usa la más fiel dentro del hard budget.",
    );
  }

  if (!bestHardBudget) {
    pushPdfWarning(
      resultMeta,
      "Ninguna variante single-page entró en el hard budget. Se usa la más liviana generada.",
    );
  }

  if (!chosenVariant.singlePageSatisfied) {
    pushPdfWarning(
      resultMeta,
      "La variante elegida no confirmó una sola página. Revisar composición poster.",
    );
  }

  if (chosenVariant.finalPosterCodec === "JPEG") {
    pushPdfWarning(
      resultMeta,
      "Se utilizó JPEG como último recurso para el poster final.",
    );
  }

  chosenVariant.variantAttempts = attempts;
  chosenVariant.softBudgetHit = chosenVariant.blobSizeBytes <= cfg.softMaxPdfBytes;
  chosenVariant.hardBudgetHit = chosenVariant.blobSizeBytes <= cfg.hardMaxPdfBytes;

  return chosenVariant;
}

async function buildSinglePagePosterPdfVariant({
  libs,
  blocks,
  cfg,
  resultMeta,
  preset,
  strategy,
  posterAssetCache,
}) {
  const layout = computePosterLayoutMetrics(blocks);
  resultMeta.posterLayoutMetrics = {
    reportRootLeftPx: layout.reportRootLeftPx,
    reportRootRightPx: layout.reportRootRightPx,
    reportRootCenterDeltaPx: layout.reportRootCenterDeltaPx,
    reportRootWidthPx: layout.reportRootWidthPx,
    widthPx: layout.widthPx,
    heightPx: layout.heightPx,
  };
  const posterCanvas = await composePosterCanvas({
    blocks,
    layout,
    preset,
    strategy,
    posterAssetCache,
  });

  const drawableWidthMm =
    (cfg.targetReportWidthMm * posterCanvas.width) /
    Math.max(1, layout.reportRootWidthPx);
  const drawableHeightMm = (drawableWidthMm * posterCanvas.height) / Math.max(1, posterCanvas.width);
  const isLandscape = cfg.pageOrientation === "landscape";
  const a4PageWidthMm = isLandscape ? PAGE_A4_MM.height : PAGE_A4_MM.width;
  const a4PageHeightMm = isLandscape ? PAGE_A4_MM.width : PAGE_A4_MM.height;
  const useCustomPageSize = cfg.pdfPageSizeMode === "custom";
  let pageWidthMm = drawableWidthMm + cfg.posterMarginMm * 2;
  let pageHeightMm = drawableHeightMm + cfg.posterMarginMm * 2;
  let renderWidthMm = drawableWidthMm;
  let renderHeightMm = drawableHeightMm;
  let imageXmm = cfg.posterMarginMm;
  let imageYmm = cfg.posterMarginMm;

  if (!useCustomPageSize) {
    const margins = cfg.marginsMm || DEFAULT_OPTIONS.marginsMm;
    const availableWidthMm = Math.max(20, a4PageWidthMm - margins.left - margins.right);
    const availableHeightMm = Math.max(20, a4PageHeightMm - margins.top - margins.bottom);
    const fitScale = Math.min(
      availableWidthMm / Math.max(1, drawableWidthMm),
      availableHeightMm / Math.max(1, drawableHeightMm),
    );

    pageWidthMm = a4PageWidthMm;
    pageHeightMm = a4PageHeightMm;
    renderWidthMm = drawableWidthMm * fitScale;
    renderHeightMm = drawableHeightMm * fitScale;
    imageXmm = margins.left + (availableWidthMm - renderWidthMm) / 2;
    imageYmm = margins.top;
  }

  const posterAsset = await createPosterPdfImageAsset(posterCanvas, {
    codec: strategy.finalCodec,
    jpegQuality: preset.jpegQuality,
  });

  const doc = new libs.jsPDF({
    orientation: pageWidthMm > pageHeightMm ? "l" : "p",
    unit: "mm",
    format: useCustomPageSize ? [pageWidthMm, pageHeightMm] : "a4",
    compress: true,
  });

  doc.addImage(
    posterAsset.dataUrl,
    posterAsset.format,
    imageXmm,
    imageYmm,
    renderWidthMm,
    renderHeightMm,
  );

  const blob = await measurePdfVariant(doc);
  const pages = doc.getNumberOfPages();

  return {
    blob,
    blobSizeBytes: blob.size,
    pages,
    chosenPreset: {
      name: preset.name,
      scale: preset.scale,
      jpegQuality: preset.jpegQuality,
      strategy: strategy.name,
    },
    captureMode: "single-page-poster",
    usedTiles: Boolean(resultMeta.fallbackTilesUsed),
    renderWidthMm: round2(renderWidthMm),
    renderHeightMm: round2(renderHeightMm),
    imageXmm: round2(imageXmm),
    imageYmm: round2(imageYmm),
    layoutMode: pages === 1
      ? useCustomPageSize
        ? "single-page-poster-custom"
        : "single-page-poster-a4"
      : "single-page-unexpected",
    pageBreaks: [],
    blockFormats: { ...strategy.blockFormats },
    selectedCodecPerBlock: { ...strategy.blockFormats },
    finalPosterCodec: posterAsset.format,
    finalPosterBytesEstimate: posterAsset.bytes,
    posterCanvasPx: {
      width: posterCanvas.width,
      height: posterCanvas.height,
    },
    pdfPageMm: {
      width: round2(pageWidthMm),
      height: round2(pageHeightMm),
    },
    usedCustomPageSize: useCustomPageSize,
    singlePageSatisfied: pages === 1,
    visualBlocksIncluded: blocks.map((block) => block.id),
  };
}

async function buildPosterCodecStrategies({ libs, blocks }) {
  const baseFormats = blocks.reduce((acc, block) => {
    acc[block.id] = "PNG";
    return acc;
  }, {});
  const supportsWebp = await canUsePdfImageFormat({
    libs,
    format: "WEBP",
  });
  const strategies = [
    {
      name: "all-png-final-png",
      blockFormats: { ...baseFormats },
      finalCodec: "PNG",
    },
  ];

  if (supportsWebp) {
    strategies.push(
      {
        name: "all-png-final-webp",
        blockFormats: { ...baseFormats },
        finalCodec: "WEBP",
      },
      {
        name: "charts-webp-final-webp",
        blockFormats: {
          ...baseFormats,
          "charts-row": "WEBP",
        },
        finalCodec: "WEBP",
      },
      {
        name: "charts-executive-webp-final-webp",
        blockFormats: {
          ...baseFormats,
          executive: "WEBP",
          "charts-row": "WEBP",
        },
        finalCodec: "WEBP",
      },
    );
  }

  strategies.push({
    name: supportsWebp
      ? "charts-executive-webp-final-jpeg"
      : "all-png-final-jpeg",
    blockFormats: supportsWebp
      ? {
          ...baseFormats,
          executive: "WEBP",
          "charts-row": "WEBP",
        }
      : { ...baseFormats },
    finalCodec: "JPEG",
  });

  return strategies;
}

async function composePosterCanvas({
  blocks,
  layout,
  preset,
  strategy,
  posterAssetCache,
}) {
  const posterCanvas = document.createElement("canvas");
  posterCanvas.width = Math.max(1, Math.round(layout.widthPx * preset.scale));
  posterCanvas.height = Math.max(1, Math.round(layout.heightPx * preset.scale));

  const ctx = posterCanvas.getContext("2d");
  if (!ctx) {
    throw new Error("No se pudo crear el canvas maestro del poster PDF.");
  }

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, posterCanvas.width, posterCanvas.height);
  ctx.imageSmoothingEnabled = true;
  if ("imageSmoothingQuality" in ctx) {
    ctx.imageSmoothingQuality = "high";
  }

  for (let i = 0; i < blocks.length; i += 1) {
    const block = blocks[i];
    const blockLayout = layout.blocks.find((entry) => entry.id === block.id);
    if (!blockLayout) {
      continue;
    }

    const preparedCanvas = await getPreparedPosterBlockCanvas({
      block,
      preset,
      codec: strategy.blockFormats[block.id] || "PNG",
      cache: posterAssetCache,
    });
    const x = Math.round(blockLayout.x * preset.scale);
    const y = Math.round(blockLayout.y * preset.scale);
    const width = Math.max(1, Math.round(blockLayout.width * preset.scale));
    const height = Math.max(1, Math.round(blockLayout.height * preset.scale));

    ctx.drawImage(preparedCanvas, x, y, width, height);
  }

  return posterCanvas;
}

async function getPreparedPosterBlockCanvas({ block, preset, codec, cache }) {
  const normalizedCodec = normalizePosterCodec(codec);
  const cacheKey = [
    block.id,
    normalizedCodec,
    round2(preset.scale),
    round2(block.captureScale),
  ].join("|");

  if (cache && cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  const factor = resolvePresetDownsampleFactor(block.captureScale, preset.scale);
  const resizedCanvas = resizeCanvasForFactor(block.canvas, factor);
  let preparedCanvas = resizedCanvas;

  if (normalizedCodec === "WEBP") {
    preparedCanvas = await transcodeCanvasToCanvas(resizedCanvas, {
      mimeType: "image/webp",
      quality: POSTER_DEFAULT_WEBP_QUALITY,
    });
  } else if (normalizedCodec === "JPEG") {
    preparedCanvas = await transcodeCanvasToCanvas(resizedCanvas, {
      mimeType: "image/jpeg",
      quality: preset.jpegQuality,
    });
  }

  if (cache) {
    cache.set(cacheKey, preparedCanvas);
  }

  return preparedCanvas;
}

function computePosterLayoutMetrics(blocks) {
  const rects = blocks
    .map((block) => {
      const rect = block.element.getBoundingClientRect();
      return {
        id: block.id,
        rect,
      };
    })
    .filter((entry) => entry.rect.width > 0 && entry.rect.height > 0);

  if (rects.length === 0) {
    throw new Error("No hay bloques visibles para componer el poster PDF.");
  }

  const union = rects.reduce(
    (acc, entry) => {
      acc.left = Math.min(acc.left, entry.rect.left);
      acc.top = Math.min(acc.top, entry.rect.top);
      acc.right = Math.max(acc.right, entry.rect.right);
      acc.bottom = Math.max(acc.bottom, entry.rect.bottom);
      return acc;
    },
    {
      left: Infinity,
      top: Infinity,
      right: -Infinity,
      bottom: -Infinity,
    },
  );

  const reportHeaderBlock = blocks.find((block) => block.id === "report-header");
  const reportRootEl = reportHeaderBlock
    ? reportHeaderBlock.element.closest("[data-ppccr-poster-report-root], [data-kpi-report-root]")
    : null;
  const reportRootRect = reportRootEl ? reportRootEl.getBoundingClientRect() : null;

  return {
    widthPx: Math.max(1, Math.round(union.right - union.left)),
    heightPx: Math.max(1, Math.round(union.bottom - union.top)),
    reportRootWidthPx: Math.max(
      1,
      round2(reportRootRect ? reportRootRect.width : union.right - union.left),
    ),
    reportRootLeftPx: reportRootRect ? round2(reportRootRect.left - union.left) : 0,
    reportRootRightPx: reportRootRect ? round2(union.right - reportRootRect.right) : 0,
    reportRootCenterDeltaPx: reportRootRect
      ? round2(
          Math.abs((reportRootRect.left - union.left) - (union.right - reportRootRect.right)),
        )
      : 0,
    blocks: rects.map((entry) => {
      return {
        id: entry.id,
        x: round2(entry.rect.left - union.left),
        y: round2(entry.rect.top - union.top),
        width: round2(entry.rect.width),
        height: round2(entry.rect.height),
      };
    }),
  };
}

async function createPosterPdfImageAsset(
  canvas,
  { codec = "PNG", jpegQuality = POSTER_DEFAULT_JPEG_QUALITY } = {},
) {
  const normalizedCodec = normalizePosterCodec(codec);
  const mimeType =
    normalizedCodec === "PNG"
      ? "image/png"
      : normalizedCodec === "WEBP"
        ? "image/webp"
        : "image/jpeg";
  const quality =
    normalizedCodec === "PNG"
      ? undefined
      : normalizedCodec === "WEBP"
        ? POSTER_DEFAULT_WEBP_QUALITY
        : clampJpegQuality(jpegQuality);
  const blob = await canvasToBlobAsync(canvas, mimeType, quality);
  const dataUrl = await blobToDataUrl(blob);

  return {
    dataUrl,
    format: normalizedCodec,
    bytes: blob.size,
  };
}

function normalizePosterCodec(codec) {
  const upper = String(codec || "PNG").trim().toUpperCase();
  if (upper === "WEBP") {
    return "WEBP";
  }
  if (upper === "JPEG" || upper === "JPG") {
    return "JPEG";
  }
  return "PNG";
}

async function transcodeCanvasToCanvas(sourceCanvas, { mimeType, quality }) {
  const blob = await canvasToBlobAsync(sourceCanvas, mimeType, quality);
  return blobToCanvas(blob, sourceCanvas.width, sourceCanvas.height);
}

async function canvasToBlobAsync(canvas, mimeType, quality) {
  if (!canvas) {
    throw new Error("Canvas inválido para serializar asset PDF.");
  }

  if (typeof canvas.toBlob === "function") {
    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (nextBlob) => {
          if (nextBlob) {
            resolve(nextBlob);
            return;
          }
          reject(new Error("No se pudo serializar el canvas como blob."));
        },
        mimeType,
        quality,
      );
    });
    return blob;
  }

  return dataUrlToBlob(canvas.toDataURL(mimeType, quality));
}

async function blobToCanvas(blob, width, height) {
  const image = await loadImageFromBlob(blob);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width || image.width || 1));
  canvas.height = Math.max(1, Math.round(height || image.height || 1));

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return canvas;
  }

  ctx.imageSmoothingEnabled = true;
  if ("imageSmoothingQuality" in ctx) {
    ctx.imageSmoothingQuality = "high";
  }
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

  return canvas;
}

async function loadImageFromBlob(blob) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = async () => {
      try {
        if (typeof img.decode === "function") {
          await img.decode().catch(() => {});
        }
      } finally {
        URL.revokeObjectURL(url);
      }
      resolve(img);
    };
    img.onerror = (error) => {
      URL.revokeObjectURL(url);
      reject(error || new Error("No se pudo cargar el blob como imagen."));
    };
    img.src = url;
  });
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () =>
      reject(reader.error || new Error("No se pudo convertir blob a data URL."));
    reader.readAsDataURL(blob);
  });
}

function dataUrlToBlob(dataUrl) {
  const match = String(dataUrl || "").match(/^data:([^;,]+)?(?:;base64)?,(.*)$/);
  if (!match) {
    throw new Error("Data URL inválida para convertir a blob.");
  }

  const mimeType = match[1] || "application/octet-stream";
  const payload = match[2] || "";
  const binary = atob(payload);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return new Blob([bytes], { type: mimeType });
}

async function canUsePdfImageFormat({ libs, format }) {
  const normalizedFormat = normalizePosterCodec(format);
  if (normalizedFormat === "PNG" || normalizedFormat === "JPEG") {
    return true;
  }

  const supportKey = "__ppccrPdfImageSupport_" + normalizedFormat;
  if (Object.prototype.hasOwnProperty.call(window, supportKey)) {
    return Boolean(window[supportKey]);
  }

  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    window[supportKey] = false;
    return false;
  }

  ctx.fillStyle = "#0f5fa6";
  ctx.fillRect(0, 0, 1, 1);

  let dataUrl = "";
  try {
    dataUrl = canvas.toDataURL("image/webp", 1);
  } catch (error) {
    window[supportKey] = false;
    return false;
  }

  if (dataUrl.indexOf("data:image/webp") !== 0) {
    window[supportKey] = false;
    return false;
  }

  try {
    const doc = new libs.jsPDF({
      orientation: "p",
      unit: "mm",
      format: [10, 10],
    });
    doc.addImage(dataUrl, normalizedFormat, 1, 1, 8, 8);
    window[supportKey] = true;
  } catch (error) {
    window[supportKey] = false;
  }

  return Boolean(window[supportKey]);
}

async function buildAdaptiveBlockPdfVariant({
  libs,
  blocks,
  pageMetrics,
  cfg,
  resultMeta,
}) {
  const attempts = [];
  let bestSoftBudget = null;
  let bestHardBudget = null;
  let smallestVariant = null;

  for (let i = 0; i < cfg.preferredScalePresets.length; i += 1) {
    const preset = cfg.preferredScalePresets[i];
    const variant = await buildBlockPdfVariant({
      libs,
      blocks,
      pageMetrics,
      cfg,
      resultMeta,
      preset,
    });

    attempts.push({
      name: preset.name,
      scale: preset.scale,
      jpegQuality: preset.jpegQuality,
      pages: variant.pages,
      blobSizeBytes: variant.blobSizeBytes,
      captureMode: variant.captureMode,
      usedTiles: variant.usedTiles,
      renderWidthMm: variant.renderWidthMm,
      layoutMode: variant.layoutMode,
    });

    if (!smallestVariant || variant.blobSizeBytes < smallestVariant.blobSizeBytes) {
      smallestVariant = variant;
    }

    if (!bestHardBudget && variant.blobSizeBytes <= cfg.hardMaxPdfBytes) {
      bestHardBudget = variant;
    }

    if (variant.blobSizeBytes <= cfg.softMaxPdfBytes) {
      bestSoftBudget = variant;
      break;
    }
  }

  const chosenVariant = bestSoftBudget || bestHardBudget || smallestVariant;
  if (!chosenVariant) {
    throw new Error("No se pudo generar ninguna variante válida del PDF por bloques.");
  }

  if (!bestSoftBudget && bestHardBudget) {
    pushPdfWarning(
      resultMeta,
      "Ningún preset entró en el soft budget. Se usa la variante más fiel dentro del hard budget.",
    );
  }

  if (!bestHardBudget) {
    pushPdfWarning(
      resultMeta,
      "Ningún preset entró en el hard budget. Se usa la variante más liviana generada.",
    );
  }

  chosenVariant.variantAttempts = attempts;
  chosenVariant.softBudgetHit = chosenVariant.blobSizeBytes <= cfg.softMaxPdfBytes;
  chosenVariant.hardBudgetHit = chosenVariant.blobSizeBytes <= cfg.hardMaxPdfBytes;

  return chosenVariant;
}

async function buildBlockPdfVariant({
  libs,
  blocks,
  pageMetrics,
  cfg,
  resultMeta,
  preset,
}) {
  const doc = new libs.jsPDF({
    orientation: cfg.pageOrientation === "landscape" ? "l" : "p",
    unit: "mm",
    format: "a4",
  });

  const blockAssets = blocks.map((block) => {
    return {
      ...block,
      asset: createPdfImageAsset(block.canvas, {
        sourceCaptureScale: block.captureScale,
        targetScale: preset.scale,
        jpegQuality: preset.jpegQuality,
        format: block.format,
      }),
      baseHeightMm: toHeightMm(block.canvas, pageMetrics.contentWidthMm),
    };
  });

  const composition = composeBlockPages({
    blockAssets,
    pageMetrics,
    cfg,
    resultMeta,
  });

  renderComposedBlockPages({
    doc,
    pages: composition.pages,
    pageMetrics,
    cfg,
  });
  applyFooterPageNumbers(doc, pageMetrics, cfg.footerMm);
  const blob = await measurePdfVariant(doc);
  const pages = doc.getNumberOfPages();

  return {
    blob,
    blobSizeBytes: blob.size,
    pages,
    chosenPreset: {
      name: preset.name,
      scale: preset.scale,
      jpegQuality: preset.jpegQuality,
    },
    captureMode: "block-layout",
    usedTiles: Boolean(resultMeta.fallbackTilesUsed),
    renderWidthMm: round2(pageMetrics.contentWidthMm),
    layoutMode: pages > 1 ? "multi-page" : "single-page",
    pageBreaks: composition.pageBreaks,
    blockFormats: blockAssets.reduce((acc, block) => {
      acc[block.id] = block.asset.format;
      return acc;
    }, {}),
  };
}

function composeBlockPages({ blockAssets, pageMetrics, cfg, resultMeta }) {
  const availableHeightMm =
    pageMetrics.pageHeightMm -
    pageMetrics.margins.top -
    pageMetrics.margins.bottom -
    cfg.footerMm;
  const minScale = 0.97;
  const pages = [];
  const pageBreaks = [];
  let currentPage = { blocks: [] };

  blockAssets.forEach((block) => {
    if (block.pageBreakBefore && currentPage.blocks.length > 0) {
      pages.push(finalizeBlockPage(currentPage, availableHeightMm, cfg, minScale, resultMeta));
      pageBreaks.push({
        beforeBlock: block.id,
        reason: "planned-break",
        page: pages.length + 1,
      });
      currentPage = { blocks: [] };
    }

    const nextBlocks = currentPage.blocks.concat(block);
    const nextHeight = calculatePageBlocksHeight(nextBlocks, cfg.contentGapMm);
    const nextScale = nextHeight > 0 ? availableHeightMm / nextHeight : 1;

    if (
      currentPage.blocks.length > 0 &&
      nextHeight > availableHeightMm &&
      nextScale < minScale
    ) {
      pages.push(finalizeBlockPage(currentPage, availableHeightMm, cfg, minScale, resultMeta));
      pageBreaks.push({
        beforeBlock: block.id,
        reason: "overflow-break",
        page: pages.length + 1,
      });
      currentPage = { blocks: [block] };
      return;
    }

    currentPage.blocks = nextBlocks;
  });

  if (currentPage.blocks.length > 0) {
    pages.push(finalizeBlockPage(currentPage, availableHeightMm, cfg, minScale, resultMeta));
  }

  return {
    pages,
    pageBreaks,
  };
}

function finalizeBlockPage(page, availableHeightMm, cfg, minScale, resultMeta) {
  const totalHeightMm = calculatePageBlocksHeight(page.blocks, cfg.contentGapMm);
  if (totalHeightMm <= 0) {
    return {
      blocks: page.blocks.slice(),
      scale: 1,
      totalHeightMm: 0,
    };
  }

  let scale = Math.min(1, availableHeightMm / totalHeightMm);
  if (scale < minScale && page.blocks.length === 1) {
    pushPdfWarning(
      resultMeta,
      "Un bloque individual superó el alto disponible y requirió shrink excepcional.",
    );
    scale = Math.max(0.9, scale);
  } else {
    scale = Math.max(minScale, scale);
  }

  return {
    blocks: page.blocks.slice(),
    scale: round2(scale),
    totalHeightMm: round2(totalHeightMm),
  };
}

function calculatePageBlocksHeight(blocks, gapMm) {
  if (!Array.isArray(blocks) || blocks.length === 0) {
    return 0;
  }

  const safeGap = Math.max(0, Number(gapMm) || 0);
  return blocks.reduce((sum, block, index) => {
    const next = sum + Math.max(0, Number(block.baseHeightMm) || 0);
    return index === 0 ? next : next + safeGap;
  }, 0);
}

function renderComposedBlockPages({ doc, pages, pageMetrics, cfg }) {
  pages.forEach((page, pageIndex) => {
    if (pageIndex > 0) {
      doc.addPage();
    }

    const scale = Math.max(0.9, Math.min(1, Number(page.scale) || 1));
    const targetWidthMm = pageMetrics.contentWidthMm * scale;
    const contentX =
      pageMetrics.margins.left + (pageMetrics.contentWidthMm - targetWidthMm) / 2;
    const gapMm = Math.max(0, Number(cfg.contentGapMm) || 0) * scale;
    let cursorY = pageMetrics.margins.top;

    page.blocks.forEach((block, index) => {
      if (index > 0) {
        cursorY += gapMm;
      }
      const targetHeightMm = Math.max(1, block.baseHeightMm * scale);
      doc.addImage(
        block.asset.dataUrl,
        block.asset.format,
        contentX,
        cursorY,
        targetWidthMm,
        targetHeightMm,
      );
      cursorY += targetHeightMm;
    });
  });
}

async function buildAdaptivePdfVariant({
  libs,
  headerCanvas,
  headerHeightMm,
  dashboardCanvas,
  dashboardSlices,
  pageMetrics,
  dashboardAvailMm,
  cfg,
  resultMeta,
}) {
  const attempts = [];
  let bestUnderBudget = null;
  let smallestVariant = null;

  for (let i = 0; i < cfg.preferredScalePresets.length; i += 1) {
    const preset = cfg.preferredScalePresets[i];
    const variant = await buildPdfVariant({
      libs,
      headerCanvas,
      headerHeightMm,
      dashboardCanvas,
      dashboardSlices,
      pageMetrics,
      dashboardAvailMm,
      cfg,
      resultMeta,
      preset,
    });

    attempts.push({
      name: preset.name,
      scale: preset.scale,
      jpegQuality: preset.jpegQuality,
      pages: variant.pages,
      blobSizeBytes: variant.blobSizeBytes,
      captureMode: variant.captureMode,
      usedTiles: variant.usedTiles,
      renderWidthMm: variant.renderWidthMm,
      layoutMode: variant.layoutMode,
    });

    if (!smallestVariant || variant.blobSizeBytes < smallestVariant.blobSizeBytes) {
      smallestVariant = variant;
    }

    if (variant.blobSizeBytes <= cfg.maxPdfBytes) {
      bestUnderBudget = variant;
      break;
    }
  }

  const chosenVariant = bestUnderBudget || smallestVariant;
  if (!chosenVariant) {
    throw new Error("No se pudo generar ninguna variante válida del PDF.");
  }

  if (!bestUnderBudget) {
    pushPdfWarning(
      resultMeta,
      "Ningún preset entró en el presupuesto. Se usa la variante más liviana generada.",
    );
  }

  chosenVariant.variantAttempts = attempts;
  return chosenVariant;
}

async function buildPdfVariant({
  libs,
  headerCanvas,
  headerHeightMm,
  dashboardCanvas,
  dashboardSlices,
  pageMetrics,
  dashboardAvailMm,
  cfg,
  resultMeta,
  preset,
}) {
  const doc = new libs.jsPDF({
    orientation: "p",
    unit: "mm",
    format: "a4",
  });
  const renderState = { pageIndex: 0 };
  const captureMode = dashboardCanvas ? "single" : "tiles";
  const headerAsset = createPdfImageAsset(headerCanvas, {
    sourceCaptureScale: resultMeta.headerCaptureScale,
    targetScale: preset.scale,
    jpegQuality: preset.jpegQuality,
  });
  const renderWidthMm = dashboardCanvas
    ? resolveDashboardRenderWidthMm({
        canvas: dashboardCanvas,
        pageMetrics,
        cfg,
        dashboardAvailMm,
      })
    : pageMetrics.contentWidthMm;

  if (dashboardCanvas) {
    appendCanvasWithPaging({
      doc,
      canvas: dashboardCanvas,
      headerAsset,
      headerHeightMm,
      renderWidthMm,
      cfg,
      pageMetrics,
      renderState,
      preset,
      sourceCaptureScale: resultMeta.dashboardCaptureScale,
    });
  } else {
    const slices = Array.isArray(dashboardSlices) ? dashboardSlices : [];
    for (let i = 0; i < slices.length; i += 1) {
      appendCanvasWithPaging({
        doc,
        canvas: slices[i],
        headerAsset,
        headerHeightMm,
        renderWidthMm,
        cfg,
        pageMetrics,
        renderState,
        preset,
        sourceCaptureScale: resultMeta.dashboardCaptureScale,
      });
    }
  }

  applyFooterPageNumbers(doc, pageMetrics, cfg.footerMm);
  const blob = await measurePdfVariant(doc);
  const pages = doc.getNumberOfPages();

  return {
    blob,
    blobSizeBytes: blob.size,
    pages,
    chosenPreset: {
      name: preset.name,
      scale: preset.scale,
      jpegQuality: preset.jpegQuality,
    },
    captureMode,
    usedTiles: Boolean(resultMeta.fallbackTilesUsed),
    renderWidthMm: round2(renderWidthMm),
    layoutMode: pages > 1 ? "multi-page" : "single-page",
  };
}

async function measurePdfVariant(doc) {
  if (!doc || typeof doc.output !== "function") {
    throw new Error("jsPDF no disponible para medir el tamaño final del PDF.");
  }

  const blob = doc.output("blob");
  if (blob && typeof blob.size === "number") {
    return blob;
  }

  const arrayBuffer = doc.output("arraybuffer");
  return new Blob([arrayBuffer], { type: "application/pdf" });
}

function createPdfImageAsset(
  sourceCanvas,
  { sourceCaptureScale, targetScale, jpegQuality, format = "JPEG" },
) {
  const factor = resolvePresetDownsampleFactor(sourceCaptureScale, targetScale);
  const preparedCanvas = resizeCanvasForFactor(sourceCanvas, factor);
  const normalizedFormat = String(format || "JPEG").toUpperCase() === "PNG" ? "PNG" : "JPEG";

  return {
    dataUrl:
      normalizedFormat === "PNG"
        ? preparedCanvas.toDataURL("image/png")
        : preparedCanvas.toDataURL("image/jpeg", clampJpegQuality(jpegQuality)),
    format: normalizedFormat,
    widthPx: preparedCanvas.width,
    heightPx: preparedCanvas.height,
  };
}

function resolvePresetDownsampleFactor(sourceCaptureScale, targetScale) {
  const source = Math.max(1, Number(sourceCaptureScale) || 1);
  const target = Math.max(1, Number(targetScale) || 1);
  return Math.max(0.3, Math.min(1, target / source));
}

function resizeCanvasForFactor(sourceCanvas, factor) {
  if (!sourceCanvas) {
    throw new Error("Canvas inválido para preparar asset PDF.");
  }

  const safeFactor = Math.max(0.3, Math.min(1, Number(factor) || 1));
  if (safeFactor >= 0.999) {
    return sourceCanvas;
  }

  const targetCanvas = document.createElement("canvas");
  targetCanvas.width = Math.max(1, Math.round(sourceCanvas.width * safeFactor));
  targetCanvas.height = Math.max(1, Math.round(sourceCanvas.height * safeFactor));

  const ctx = targetCanvas.getContext("2d");
  if (!ctx) {
    return sourceCanvas;
  }

  ctx.imageSmoothingEnabled = true;
  if ("imageSmoothingQuality" in ctx) {
    ctx.imageSmoothingQuality = "high";
  }
  ctx.drawImage(
    sourceCanvas,
    0,
    0,
    sourceCanvas.width,
    sourceCanvas.height,
    0,
    0,
    targetCanvas.width,
    targetCanvas.height,
  );

  return targetCanvas;
}

function clampJpegQuality(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return 0.88;
  }
  return Math.max(0.55, Math.min(0.98, numeric));
}

function saveBlobAsFile(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  window.setTimeout(() => {
    URL.revokeObjectURL(url);
    link.remove();
  }, 1500);
}

function appendCanvasWithPaging({
  doc,
  canvas,
  headerAsset,
  headerHeightMm,
  renderWidthMm,
  cfg,
  pageMetrics,
  renderState,
  preset,
  sourceCaptureScale,
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

    if (shouldRenderHeader && headerAsset) {
      doc.addImage(
        headerAsset.dataUrl,
        headerAsset.format,
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
      const canvasAsset = createPdfImageAsset(canvas, {
        sourceCaptureScale,
        targetScale: preset.scale,
        jpegQuality: preset.jpegQuality,
      });
      doc.addImage(
        canvasAsset.dataUrl,
        canvasAsset.format,
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

      const sliceAsset = createPdfImageAsset(sliceCanvas, {
        sourceCaptureScale,
        targetScale: preset.scale,
        jpegQuality: preset.jpegQuality,
      });
      doc.addImage(
        sliceAsset.dataUrl,
        sliceAsset.format,
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
  doc.setFontSize(6.4);
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
  const isLandscape = cfg.pageOrientation === "landscape";
  const pageWidthMm = isLandscape ? PAGE_A4_MM.height : PAGE_A4_MM.width;
  const pageHeightMm = isLandscape ? PAGE_A4_MM.width : PAGE_A4_MM.height;

  return {
    pageWidthMm,
    pageHeightMm,
    margins,
    contentWidthMm: pageWidthMm - margins.left - margins.right,
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
  const minAllowed = cfg.preferLegibilityOverSinglePage
    ? 0.98
    : Math.max(0.7, Math.min(1, Number(cfg.minSinglePageScale) || 0.9));

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
  merged.softMaxPdfBytes = Math.max(
    1024 * 1024,
    Number(options.softMaxPdfBytes) || DEFAULT_OPTIONS.softMaxPdfBytes,
  );
  merged.hardMaxPdfBytes = Math.max(
    merged.softMaxPdfBytes,
    Number(options.hardMaxPdfBytes) ||
      Number(options.maxPdfBytes) ||
      DEFAULT_OPTIONS.hardMaxPdfBytes,
  );
  merged.maxPdfBytes = merged.hardMaxPdfBytes;
  merged.fitSinglePage = options.fitSinglePage !== false;
  merged.pageStrategy =
    String(options.pageStrategy || DEFAULT_OPTIONS.pageStrategy).trim() ===
    "single-page-poster"
      ? "single-page-poster"
      : "multi-page";
  merged.preferLegibilityOverSinglePage =
    merged.pageStrategy === "single-page-poster"
      ? options.preferLegibilityOverSinglePage === true
      : options.preferLegibilityOverSinglePage !== false;
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
  merged.includeSectionHeader = options.includeSectionHeader !== false;
  merged.exportScopeSelector =
    typeof options.exportScopeSelector === "string" &&
    options.exportScopeSelector.trim().length > 0
      ? options.exportScopeSelector.trim()
      : DEFAULT_OPTIONS.exportScopeSelector;
  merged.pageOrientation =
    String(options.pageOrientation || DEFAULT_OPTIONS.pageOrientation).toLowerCase() ===
    "landscape"
      ? "landscape"
      : "portrait";
  merged.pdfPageSizeMode =
    String(options.pdfPageSizeMode || DEFAULT_OPTIONS.pdfPageSizeMode).trim() === "custom"
      ? "custom"
      : "a4";
  merged.posterLayoutBasis =
    typeof options.posterLayoutBasis === "string" &&
    options.posterLayoutBasis.trim().length > 0
      ? options.posterLayoutBasis.trim()
      : DEFAULT_OPTIONS.posterLayoutBasis;
  merged.posterViewportWidthPx = Math.max(
    1280,
    Number(options.posterViewportWidthPx) || DEFAULT_OPTIONS.posterViewportWidthPx,
  );
  merged.posterMarginMm = Math.max(
    0,
    Number(options.posterMarginMm) || DEFAULT_OPTIONS.posterMarginMm,
  );
  merged.targetReportWidthMm = Math.max(
    120,
    Number(options.targetReportWidthMm) || DEFAULT_OPTIONS.targetReportWidthMm,
  );
  merged.blockLayoutMode =
    typeof options.blockLayoutMode === "string" && options.blockLayoutMode.trim().length > 0
      ? options.blockLayoutMode.trim()
      : DEFAULT_OPTIONS.blockLayoutMode;
  merged.preferredScalePresets = normalizeScalePresets(options.preferredScalePresets);
  merged.debugPdf = options.debugPdf === true || options.debug === true;

  return merged;
}

function normalizeScalePresets(rawPresets) {
  const source = Array.isArray(rawPresets) && rawPresets.length > 0
    ? rawPresets
    : DEFAULT_SCALE_PRESETS;

  const normalized = source
    .map((preset, index) => {
      const scale = Math.max(1, Number(preset && preset.scale) || 0);
      const jpegQuality = clampJpegQuality(preset && preset.jpegQuality);
      return {
        name:
          preset && typeof preset.name === "string" && preset.name.trim()
            ? preset.name.trim()
            : "preset-" + (index + 1),
        scale,
        jpegQuality,
      };
    })
    .filter((preset) => Number.isFinite(preset.scale) && preset.scale > 0)
    .sort((a, b) => b.scale - a.scale);

  return normalized.length > 0 ? normalized : DEFAULT_SCALE_PRESETS.slice();
}

function resolveBaseCaptureScale(cfg) {
  if (Array.isArray(cfg.preferredScalePresets) && cfg.preferredScalePresets.length > 0) {
    return Math.max.apply(
      null,
      cfg.preferredScalePresets.map((preset) => Math.max(1, Number(preset.scale) || 1)),
    );
  }

  return Math.max(1, Number(cfg.desiredScale) || 1);
}

function initPdfDebugState() {
  if (typeof window === "undefined") {
    return null;
  }

  window.__PPCCR_PDF_DEBUG__ = {
    mode: null,
    chosenPreset: null,
    pageCount: 0,
    pages: 0,
    blobSizeBytes: 0,
    finalBlobBytes: 0,
    captureMode: null,
    usedTiles: false,
    renderWidthMm: null,
    renderHeightMm: null,
    imageXmm: null,
    imageYmm: null,
    exportedScope: null,
    pageBreaks: [],
    softBudgetHit: false,
    hardBudgetHit: false,
    includedSectionHeader: false,
    layoutMode: null,
    blockFormats: {},
    selectedCodecPerBlock: {},
    finalPosterCodec: null,
    finalPosterBytesEstimate: 0,
    posterCanvasPx: null,
    pdfPageMm: null,
    usedCustomPageSize: false,
    singlePageSatisfied: false,
    visualBlocksIncluded: [],
    posterReportRootLeftPx: null,
    posterReportRootRightPx: null,
    posterReportRootCenterDeltaPx: null,
    snapshotReplacementMode: "css-only",
    snapshotReplacementTotal: 0,
    snapshotReplacementLabels: [],
    panelSnapshotBlocks: [],
    warnings: [],
    timings: {},
  };

  return window.__PPCCR_PDF_DEBUG__;
}

function updatePdfDebugState(patch) {
  if (typeof window === "undefined") {
    return null;
  }

  const target = window.__PPCCR_PDF_DEBUG__ || initPdfDebugState();
  Object.assign(target, patch || {});
  return target;
}

function pushPdfWarning(resultMeta, message) {
  const warning = String(message || "Advertencia de exportación PDF");
  if (resultMeta && Array.isArray(resultMeta.warnings)) {
    resultMeta.warnings.push(warning);
  }

  const target = updatePdfDebugState({});
  if (target && Array.isArray(target.warnings)) {
    target.warnings.push(warning);
  }
}

function nowMs() {
  return typeof performance !== "undefined" && typeof performance.now === "function"
    ? performance.now()
    : Date.now();
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
    const selectorEntry = normalizeSnapshotSelectorEntry(selectors[s]);
    if (!selectorEntry) {
      continue;
    }
    const nodes = Array.from(root.querySelectorAll(selectorEntry.selector));

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
          scale: selectorEntry.scale || scale,
          debug,
        });
        replacements.push({
          selector: selectorEntry.selector,
          label: selectorEntry.label || selectorEntry.selector,
          path,
          width: rect.width,
          height: rect.height,
          fitToTarget: selectorEntry.fitToTarget === true,
          dataUrl: canvas.toDataURL("image/png", 1),
        });
        seenPaths.add(pathKey);
      } catch (error) {
        if (debug) {
          console.warn(
            "[PPCCR PDF] Snapshot selectivo omitido:",
            selectorEntry.selector,
            error,
          );
        }
      }
    }
  }

  return replacements;
}

function normalizePanelSnapshotSelectors(selectors) {
  const source =
    Array.isArray(selectors) && selectors.length > 0
      ? selectors
      : DEFAULT_PANEL_SNAPSHOT_SELECTORS;

  return source
    .map((entry) => normalizeSnapshotSelectorEntry(entry))
    .filter((entry) => Boolean(entry && entry.fitToTarget === true));
}

function resolveSnapshotRoot(root) {
  if (!root) {
    return null;
  }

  if (root.matches && root.matches("[data-kpi-report-root]")) {
    return root;
  }

  if (root.querySelector) {
    return root.querySelector("[data-kpi-report-root]") || root;
  }

  return null;
}

async function waitForSnapshotImages(images) {
  const targets = (Array.isArray(images) ? images : []).filter(Boolean);
  await Promise.all(
    targets.map((img) => {
      if (!img || img.complete) {
        if (img && typeof img.decode === "function") {
          return img.decode().catch(() => undefined);
        }
        return Promise.resolve();
      }

      return new Promise((resolve) => {
        const done = () => resolve();
        img.addEventListener("load", done, { once: true });
        img.addEventListener("error", done, { once: true });
      });
    }),
  );
}

function nextFrame() {
  if (typeof window === "undefined" || typeof window.requestAnimationFrame !== "function") {
    return new Promise((resolve) => setTimeout(resolve, 16));
  }

  return new Promise((resolve) => {
    window.requestAnimationFrame(() => resolve());
  });
}

async function waitForStableSnapshotLayout(doc) {
  const documentRef = doc || document;
  if (documentRef && documentRef.fonts && typeof documentRef.fonts.ready === "object") {
    try {
      await documentRef.fonts.ready;
    } catch (error) {
      // ignore font readiness failures and continue with best effort capture
    }
  }

  await nextFrame();
  await nextFrame();
}

function buildTrueLiveSnapshotUrl(version) {
  const url = new URL("index.html", window.location.href);
  url.searchParams.set(TRUE_LIVE_SNAPSHOT_QUERY_KEY, TRUE_LIVE_SNAPSHOT_QUERY_VALUE);
  if (version) {
    url.searchParams.set("cb", String(version));
  }
  url.hash = "kpis";
  return url.href;
}

function createTrueLiveSnapshotFrame() {
  const iframe = document.createElement("iframe");
  iframe.className = TRUE_LIVE_SNAPSHOT_FRAME_CLASS;
  iframe.setAttribute("aria-hidden", "true");
  iframe.setAttribute("tabindex", "-1");
  iframe.setAttribute("title", "PPCCR KPI live snapshot source");
  iframe.style.width = TRUE_LIVE_SNAPSHOT_FRAME_WIDTH_PX + "px";
  iframe.style.height = TRUE_LIVE_SNAPSHOT_FRAME_HEIGHT_PX + "px";
  iframe.src = "about:blank";
  document.body.appendChild(iframe);
  return iframe;
}

function cleanupTrueLiveSnapshotFrame(frame) {
  if (frame && frame.parentNode) {
    frame.parentNode.removeChild(frame);
  }
}

function waitForFrameLoad(iframe, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    if (!iframe) {
      reject(new Error("No se pudo crear el iframe de snapshot live."));
      return;
    }

    const currentDoc = iframe.contentDocument;
    if (currentDoc && currentDoc.readyState === "complete") {
      resolve();
      return;
    }

    let done = false;
    const timer = window.setTimeout(() => {
      if (done) {
        return;
      }
      done = true;
      reject(new Error("Timeout esperando load del iframe live."));
    }, Math.max(1000, Number(timeoutMs) || 15000));

    const finish = (error) => {
      if (done) {
        return;
      }
      done = true;
      window.clearTimeout(timer);
      iframe.removeEventListener("load", handleLoad);
      iframe.removeEventListener("error", handleError);
      if (error) {
        reject(error);
        return;
      }
      resolve();
    };

    const handleLoad = () => finish();
    const handleError = () =>
      finish(new Error("Error cargando el iframe live para snapshots KPI."));

    iframe.addEventListener("load", handleLoad);
    iframe.addEventListener("error", handleError);
  });
}

function seedTrueLiveSnapshotSession(iframe) {
  const frameWindow = iframe && iframe.contentWindow;
  if (!frameWindow || !frameWindow.sessionStorage) {
    throw new Error("No se pudo acceder al sessionStorage del iframe live.");
  }

  const storage = frameWindow.sessionStorage;
  const previousValues = {};
  Object.keys(TRUE_LIVE_SNAPSHOT_SESSION_SEED).forEach((key) => {
    previousValues[key] = window.sessionStorage.getItem(key);
    storage.setItem(key, TRUE_LIVE_SNAPSHOT_SESSION_SEED[key]);
  });

  return () => {
    Object.keys(TRUE_LIVE_SNAPSHOT_SESSION_SEED).forEach((key) => {
      const previousValue = previousValues[key];
      if (typeof previousValue === "string") {
        window.sessionStorage.setItem(key, previousValue);
        return;
      }
      window.sessionStorage.removeItem(key);
    });
  };
}

function escapeHtmlAttribute(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

async function injectTrueLiveSnapshotDocument({
  iframe,
  sourceUrl,
}) {
  if (!iframe || !sourceUrl) {
    throw new Error("Faltan datos para inyectar el source live en iframe.");
  }

  const response = await fetch(sourceUrl, {
    credentials: "same-origin",
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error("No se pudo descargar index.html para snapshot live.");
  }

  const html = await response.text();
  const frameDocument = iframe.contentDocument;
  if (!frameDocument) {
    throw new Error("No se pudo acceder al documento del iframe live.");
  }

  const baseHref = new URL(".", sourceUrl).href;
  const bootstrapScript = [
    "<script>",
    "(function(){",
    "try{",
    "history.replaceState({}, '', " + JSON.stringify(sourceUrl) + ");",
    Object.keys(TRUE_LIVE_SNAPSHOT_SESSION_SEED)
      .map((key) => {
        return (
          "sessionStorage.setItem(" +
          JSON.stringify(key) +
          ", " +
          JSON.stringify(TRUE_LIVE_SNAPSHOT_SESSION_SEED[key]) +
          ");"
        );
      })
      .join(""),
    "}catch(error){console.warn('[PPCCR PDF] No se pudo bootstrapear iframe live.', error);}",
    "})();",
    "</script>",
  ].join("");

  let patchedHtml = html;
  if (/<head[^>]*>/i.test(patchedHtml)) {
    patchedHtml = patchedHtml.replace(
      /<head([^>]*)>/i,
      '<head$1><base href="' +
        escapeHtmlAttribute(baseHref) +
        '">' +
        bootstrapScript,
    );
  } else {
    patchedHtml =
      "<!doctype html><html><head><base href=\"" +
      escapeHtmlAttribute(baseHref) +
      "\">" +
      bootstrapScript +
      "</head><body>" +
      patchedHtml +
      "</body></html>";
  }

  frameDocument.open();
  frameDocument.write(patchedHtml);
  frameDocument.close();
}

async function waitForElementImagesReady(root) {
  const images = Array.from((root && root.querySelectorAll ? root.querySelectorAll("img") : []) || []);
  await Promise.all(
    images.map((img) => {
      if (img.complete && img.naturalWidth > 0) {
        return Promise.resolve();
      }
      return new Promise((resolve) => {
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
}

async function waitForTrueLiveSnapshotSourceReady({
  iframe,
  timeoutMs = TRUE_LIVE_SNAPSHOT_TIMEOUT_MS,
}) {
  const start = nowMs();

  while (nowMs() - start < timeoutMs) {
    const frameWindow = iframe && iframe.contentWindow;
    const frameDocument = iframe && iframe.contentDocument;
    const reportRoot =
      frameDocument && frameDocument.querySelector
        ? frameDocument.querySelector("[data-kpi-report-root]")
        : null;
    const debugState =
      frameWindow && typeof frameWindow === "object" ? frameWindow.__PPCCR_KPI_DEBUG__ : null;
    const loadingShell =
      frameDocument && frameDocument.querySelector
        ? frameDocument.querySelector(".kpiDash__loadingShell")
        : null;
    const totalEl = reportRoot ? reportRoot.querySelector(".kpiDash__summaryHeadTotal") : null;
    const trkValueEl = reportRoot ? reportRoot.querySelector(".kpiDash__trkValue") : null;
    const trkGaugeEl = reportRoot ? reportRoot.querySelector(".kpiDash__trkGauge") : null;

    if (
      reportRoot &&
      totalEl &&
      trkValueEl &&
      trkGaugeEl &&
      !loadingShell &&
      debugState &&
      debugState.stage === "rendered"
    ) {
      if (
        frameDocument.fonts &&
        typeof frameDocument.fonts.ready === "object"
      ) {
        try {
          await Promise.race([
            frameDocument.fonts.ready,
            sleep(2500),
          ]);
        } catch (error) {
          // best effort
        }
      }

      await waitForElementImagesReady(reportRoot);
      await waitForStableSnapshotLayout(frameDocument);

      if (!frameDocument.querySelector(".kpiDash__loadingShell")) {
        return {
          frameWindow,
          frameDocument,
          reportRoot,
        };
      }
    }

    await sleep(120);
  }

  throw new Error("Timeout esperando que index.html#kpis estabilice Participantes/TRK en iframe.");
}

export async function prepareTrueLivePanelSnapshots({
  targetRoot,
  selectors = DEFAULT_PANEL_SNAPSHOT_SELECTORS,
  debug = false,
  version = "",
} = {}) {
  const resolvedTargetRoot = resolveSnapshotRoot(targetRoot);
  const sourceUrl = buildTrueLiveSnapshotUrl(version);
  if (!resolvedTargetRoot) {
    return {
      mode: "true-live-source-failed",
      source: TRUE_LIVE_SNAPSHOT_SOURCE,
      sourceUrl,
      format: null,
      labels: [],
      scales: {},
      panels: [],
      total: 0,
    };
  }

  const snapshotSelectors = normalizePanelSnapshotSelectors(selectors);
  if (snapshotSelectors.length === 0) {
    return {
      mode: "true-live-source-failed",
      source: TRUE_LIVE_SNAPSHOT_SOURCE,
      sourceUrl,
      format: null,
      labels: [],
      scales: {},
      panels: [],
      total: 0,
    };
  }

  const html2canvas = await ensureHtml2CanvasLib();
  let lastError = null;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    let iframe = null;
    let restoreSession = null;

    try {
      iframe = createTrueLiveSnapshotFrame();
      await waitForFrameLoad(iframe, 5000);
      restoreSession = seedTrueLiveSnapshotSession(iframe);
      await injectTrueLiveSnapshotDocument({
        iframe,
        sourceUrl,
      });

      const liveContext = await waitForTrueLiveSnapshotSourceReady({
        iframe,
        timeoutMs: TRUE_LIVE_SNAPSHOT_TIMEOUT_MS,
      });

      const replacements = await captureSnapshotReplacements({
        root: liveContext.reportRoot,
        html2canvas,
        selectors: snapshotSelectors,
        scale: DEFAULT_OPTIONS.snapshotScale,
        debug,
      });

      const applied = applySnapshotReplacementsToRoot({
        targetRoot: resolvedTargetRoot,
        replacements,
      }).map((entry) => {
        entry.element.setAttribute("data-kpi-print-snapshot", entry.label);
        entry.element.setAttribute("data-kpi-print-snapshot-source", "live-iframe");
        entry.element.setAttribute("data-kpi-print-snapshot-format", "image/png");
        entry.element.style.display = "block";
        return entry;
      });

      await waitForSnapshotImages(applied.map((entry) => entry.element));

      const labels = Array.from(
        new Set(
          applied
            .map((entry) => String(entry.label || ""))
            .filter(Boolean),
        ),
      );
      const scales = snapshotSelectors.reduce((acc, selectorEntry) => {
        const key = String(selectorEntry.label || selectorEntry.selector || "");
        if (key) {
          acc[key] = Number(selectorEntry.scale) || DEFAULT_OPTIONS.snapshotScale;
        }
        return acc;
      }, {});

      if (applied.length === 0) {
        throw new Error("No se aplicaron snapshots hi-DPI desde iframe live.");
      }

      return {
        mode: "true-live-source-hi-dpi",
        source: TRUE_LIVE_SNAPSHOT_SOURCE,
        sourceUrl,
        format: "image/png",
        labels,
        scales,
        total: applied.length,
        panels: applied.map((entry) => ({
          label: entry.label,
          width: round2(entry.width),
          height: round2(entry.height),
        })),
      };
    } catch (error) {
      lastError = error;
      if (debug) {
        console.warn("[PPCCR PDF] Snapshot iframe live falló.", {
          attempt: attempt + 1,
          error,
        });
      }
      if (attempt < 1) {
        await sleep(180);
      }
    } finally {
      if (typeof restoreSession === "function") {
        restoreSession();
      }
      cleanupTrueLiveSnapshotFrame(iframe);
    }
  }

  if (debug && lastError) {
    console.warn("[PPCCR PDF] Snapshot iframe live agotó reintentos.", lastError);
  }

  return {
    mode: "true-live-source-failed",
    source: TRUE_LIVE_SNAPSHOT_SOURCE,
    sourceUrl,
    format: null,
    labels: [],
    scales: {},
    panels: [],
    total: 0,
  };
}

export async function prepareKpiPrintPanelSnapshots({
  root,
  selectors = DEFAULT_PANEL_SNAPSHOT_SELECTORS,
  debug = false,
  version = "",
} = {}) {
  const reportRoot = resolveSnapshotRoot(root);
  if (!reportRoot) {
    return {
      mode: "true-live-source-failed",
      source: TRUE_LIVE_SNAPSHOT_SOURCE,
      sourceUrl: buildTrueLiveSnapshotUrl(version),
      format: null,
      labels: [],
      scales: {},
      panels: [],
      total: 0,
    };
  }

  const snapshotSelectors = normalizePanelSnapshotSelectors(selectors);
  if (snapshotSelectors.length === 0) {
    return {
      mode: "true-live-source-failed",
      source: TRUE_LIVE_SNAPSHOT_SOURCE,
      sourceUrl: buildTrueLiveSnapshotUrl(version),
      format: null,
      labels: [],
      scales: {},
      panels: [],
      total: 0,
    };
  }

  return prepareTrueLivePanelSnapshots({
    targetRoot: reportRoot,
    selectors: snapshotSelectors,
    debug,
    version,
  });
}

async function captureLiveNodeSnapshot({ node, html2canvas, scale, debug }) {
  const isTrkNode = Boolean(
    node &&
      (node.matches(
        ".kpiDash__trkGauge, .kpiDash__trkGaugeWrap, .kpiDash__fitFlowPanel--trk, .apexcharts-canvas, .apexcharts-svg",
      ) ||
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
    const fitToTarget = replacement.fitToTarget === true;
    const widthPx = Number(replacement.width) > 0 ? Number(replacement.width) : target.offsetWidth;
    const heightPx = Number(replacement.height) > 0
      ? Number(replacement.height)
      : target.offsetHeight;
    const renderedWidth = fitToTarget
      ? Math.max(1, Math.round(target.offsetWidth || widthPx || 1))
      : widthPx;
    const renderedHeight = fitToTarget
      ? Math.max(1, Math.round(target.offsetHeight || heightPx || 1))
      : heightPx;
    const targetClass =
      typeof target.getAttribute === "function"
        ? target.getAttribute("class") || ""
        : String(target.className || "").trim();

    const img = clonedDoc.createElement("img");
    img.src = replacement.dataUrl;
    img.alt = "";
    img.setAttribute("aria-hidden", "true");
    img.className = [targetClass, "kpiDash__pdfSwapImage"].filter(Boolean).join(" ");
    img.setAttribute(
      "data-ppccr-pdf-snapshot",
      String(replacement.label || replacement.selector || "snapshot"),
    );
    img.style.display =
      targetStyle && targetStyle.display && targetStyle.display !== "inline"
        ? targetStyle.display
        : "inline-block";
    img.style.width = renderedWidth > 0 ? renderedWidth + "px" : "100%";
    img.style.height = renderedHeight > 0 ? renderedHeight + "px" : "auto";
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

function normalizeSnapshotSelectorEntry(entry) {
  if (typeof entry === "string") {
    const selector = entry.trim();
    return selector ? { selector, scale: null, fitToTarget: false, label: selector } : null;
  }

  if (!entry || typeof entry !== "object") {
    return null;
  }

  const selector = String(entry.selector || "")
    .trim();
  if (!selector) {
    return null;
  }

  const parsedScale = Number(entry.scale);
  return {
    selector,
    scale: Number.isFinite(parsedScale) && parsedScale > 0 ? parsedScale : null,
    fitToTarget: entry.fitToTarget === true,
    label:
      typeof entry.label === "string" && entry.label.trim().length > 0
        ? entry.label.trim()
        : selector,
  };
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
    partnersStrip.style.setProperty("justify-content", "center", "important");
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

function stabilizeTrkGaugeInClone(
  clonedDoc,
  dashboardSelector,
  exportClassName = "kpiDash--pdfV2",
) {
  const scope = clonedDoc.querySelector(dashboardSelector) || clonedDoc;
  const extraClass =
    typeof exportClassName === "string" && exportClassName.trim()
      ? exportClassName.trim()
      : "kpiDash--pdfV2";
  if (scope.classList && scope.classList.contains("kpiDash__reportRoot")) {
    scope.classList.add(extraClass);
  }
  scope.querySelectorAll(".kpiDash__reportRoot").forEach((node) => {
    node.classList.add(extraClass);
  });

  const gauges = Array.from(scope.querySelectorAll(".kpiDash__trkGauge"));

  gauges.forEach((gauge) => {
    const pct = readTrkPercentFromGauge(gauge, clonedDoc);
    if (!Number.isFinite(pct)) {
      return;
    }

    const pctClamped = Math.max(0, Math.min(100, pct));
    const deliveredNode = gauge.querySelector(".kpiDash__trkGaugeHit--delivered");
    const pendingNode = gauge.querySelector(".kpiDash__trkGaugeHit--pending");
    const targetCx = 50;
    const targetCy = 50;
    // Con gauge de 68px y stroke de 14 (en viewBox 100), r=43 alinea exacto con la base.
    const targetRadius = 43;
    const radius =
      targetRadius ||
      (deliveredNode && Number(deliveredNode.getAttribute("r"))) ||
      (pendingNode && Number(pendingNode.getAttribute("r"))) ||
      44;
    const safeRadius = Number.isFinite(radius) && radius > 0 ? radius : 44;
    const circumference = 2 * Math.PI * safeRadius;
    const deliveredLength = (circumference * pctClamped) / 100;
    const pendingLength = Math.max(0, circumference - deliveredLength);

    gauge.style.setProperty(
      "background",
      "#d9e5f1",
      "important",
    );
    gauge.style.setProperty(
      "background-image",
      "none",
      "important",
    );
    gauge.style.setProperty(
      "box-shadow",
      "inset 0 0 0 1px rgba(14,72,127,0.2), 0 5px 12px rgba(14,55,98,0.14)",
      "important",
    );

    if (deliveredNode) {
      deliveredNode.setAttribute("cx", String(targetCx));
      deliveredNode.setAttribute("cy", String(targetCy));
      deliveredNode.setAttribute("r", String(safeRadius));
      deliveredNode.setAttribute(
        "stroke-dasharray",
        deliveredLength.toFixed(2) + " " + circumference.toFixed(2),
      );
      deliveredNode.setAttribute("stroke-dashoffset", "0");
      deliveredNode.style.setProperty("fill", "none", "important");
      deliveredNode.style.setProperty("stroke", "#1d69b3", "important");
      deliveredNode.style.setProperty("stroke-width", "14", "important");
      deliveredNode.style.setProperty("stroke-linecap", "round", "important");
      deliveredNode.style.setProperty("opacity", "1", "important");
      deliveredNode.style.setProperty("pointer-events", "none", "important");
    }

    if (pendingNode) {
      pendingNode.setAttribute("cx", String(targetCx));
      pendingNode.setAttribute("cy", String(targetCy));
      pendingNode.setAttribute("r", String(safeRadius));
      pendingNode.setAttribute(
        "stroke-dasharray",
        pendingLength.toFixed(2) + " " + circumference.toFixed(2),
      );
      pendingNode.setAttribute(
        "stroke-dashoffset",
        (-deliveredLength).toFixed(2),
      );
      pendingNode.style.setProperty("fill", "none", "important");
      pendingNode.style.setProperty("stroke", "#d7e6f4", "important");
      pendingNode.style.setProperty("stroke-width", "14", "important");
      pendingNode.style.setProperty("stroke-linecap", "round", "important");
      pendingNode.style.setProperty("opacity", "1", "important");
      pendingNode.style.setProperty("pointer-events", "none", "important");
    }
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
