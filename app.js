"use strict";

/**
 * CONFIG CENTRAL
 * - Cambiás URLs y logos acá, sin tocar HTML.
 * - Usá "PEGAR_AQUI" como placeholder.
 */
const CONFIG = {
  meta: {
    programName: "Programa de Prevención de Cáncer Colorrectal",
    yearLabel: "",
    locationLabel: "Buenos Aires",
    unitLabel: "",
    supportEmail: "PEGAR_EMAIL_SOPORTE",
  },

  assets: {
    logos: {
      ppccr: { src: "assets/logo-ppccr.png", alt: "Logo PPCCR" },
      fep: {
        src: "assets/logo-fep.png?v=20260208",
        alt: "Fundación Enfermeros Protagonistas",
      },
      gedyt: { src: "assets/logo-gedyt.png", alt: "Fundación GEDyT" },
      merck: { src: "assets/logo-merck.png", alt: "Merck Foundation" },
      gcba: {
        src: "assets/logo-gcba.png",
        alt: "Gobierno de la Ciudad de Buenos Aires",
      },
    },
  },

  /**
   * Guías / Protocolos
   * - Pueden ser PDFs, páginas internas o anclas (#kpis, #registro, etc).
   */
  links: {
    guias: [
      {
        key: "workflow",
        title: "Workflow operativo",
        meta: "Página interna",
        url: "/workflow.html",
      },
      {
        key: "algoritmoRiesgo",
        title: "Algoritmo / Criterios de riesgo",
        meta: "Ir a sección",
        url: "#algoritmo-section",
      },
      {
        key: "rolesResponsabilidades",
        title: "Roles y responsabilidades",
        meta: "Página interna",
        url: "/roles.html",
      },
      {
        key: "manejoKitFIT",
        title: "Manejo de kit FIT",
        meta: "Página interna",
        url: "/kit-fit.html",
      },
      {
        key: "entregaMuestras",
        title: "Entrega de muestras",
        meta: "Página interna",
        url: "/entrega-muestras.html",
      },
      {
        key: "kpis",
        title: "KPIs del programa",
        meta: "Ir a sección",
        url: "#kpis",
      },
    ],

    /**
     * Formularios por rol (solo links; deben abrir en nueva pestaña).
     */
    formularios: {
      enfermeria: {
        title: "Enfermeros/as \"Navigators\"",
        desc: "Registro operativo de kits, muestras y resultados.",
        items: [
          {
            key: "entregaKitFIT",
            label: "Entrega de kit FIT",
            url: "https://9kxsjveuebz.typeform.com/to/CA9UQXTK",
          },
          {
            key: "recepcionMuestraFIT",
            label: "Recepción de muestra FIT",
            url: "https://9kxsjveuebz.typeform.com/to/ICgvwiBh",
          },
          {
            key: "envioMuestrasLaboratorio",
            label: "Envío a laboratorio",
            url: "https://9kxsjveuebz.typeform.com/to/EDtlnghR",
          },
          {
            key: "recepcionResultadosFIT",
            label: "Recepción de resultados FIT",
            url: "https://9kxsjveuebz.typeform.com/to/zbS6LWx7",
          },
        ],
      },

      medicos: {
        title: "Médicos",
        desc: "Entrevista clínica e informe de resultado FIT al paciente.",
        items: [
          {
            key: "entrevistaMedica",
            label: "Entrevista médica",
            url: "https://9kxsjveuebz.typeform.com/to/xP8fOLC4",
          },
          {
            key: "informePacienteResultadoFIT",
            label: "Informe de resultado FIT",
            url: "https://9kxsjveuebz.typeform.com/to/CPDHPjyy",
          },
        ],
      },

      pacientes: {
        title: "Participantes",
        desc: "Cuestionario / evaluación inicial del programa.",
        items: [
          {
            key: "evaluacionInicialSalud",
            label: "Evaluación inicial",
            url: "https://9kxsjveuebz.typeform.com/to/X2jtQ7NT",
          },
        ],
      },
    },
  },

  /**
   * EMBEDS
   * - Looker: ya existe. Se embebe en home.
   * - Calendar: placeholder hasta que pegues URL.
   */
  embeds: {
    looker: {
      openUrl:
        "https://lookerstudio.google.com/reporting/a67eced8-d80b-4ce1-8282-6241d855dee0",
      /**
       * Sugerencia de embed:
       * - si tu URL es .../reporting/<id> o .../reporting/<id>/page/<pageId>
       *   el embed suele ser .../embed/reporting/<id> (y/o .../embed/reporting/<id>/page/<pageId>)
       * - Si el iframe queda en blanco, copiá el "Embed URL" desde Looker y pegalo acá.
       */
      embedUrl: "", // si está vacío, se intenta derivar desde openUrl
    },

    calendar: {
      openUrl:
        "https://calendar.google.com/calendar/embed?src=6a56f786245ebf6eef16d66f6207ece6ac91120fd3ed6a60505d77020b73779f%40group.calendar.google.com&ctz=America%2FArgentina%2FBuenos_Aires",
      embedUrl:
        "https://calendar.google.com/calendar/embed?height=600&wkst=2&bgcolor=%23ffffff&ctz=America%2FArgentina%2FBuenos_Aires&showTitle=0&showNav=1&showDate=1&showPrint=0&showTabs=1&showCalendars=0&src=6a56f786245ebf6eef16d66f6207ece6ac91120fd3ed6a60505d77020b73779f%40group.calendar.google.com&color=%23F6BF26&src=6b266ba27c58230fd212794413a7c7596bca9276278ddad124cc682b6c0a93c9%40group.calendar.google.com&color=%23039BE5&src=60266d5c54150e7d3e2903e3c70956ebc932fae4df94a9284fccfe898d832078%40group.calendar.google.com&color=%233F51B5",
    },
  },

  ui: {
    headerScrolledClass: "is-scrolled",
    embedLoadingClass: "is-embed-loading",
    embedReadyClass: "is-embed-ready",
  },

  integrations: {
    algorithmStage1Endpoint: "/api/algorithm/stage1",
    algorithmStage1FallbackEndpoint:
      "https://us-central1-ppccr-2026.cloudfunctions.net/submitAlgorithmStage1",
  },

  timeline: {
    title: "Línea de tiempo operativa",
    subtitle:
      "Resumen ejecutivo por etapas con foco en períodos críticos del despliegue qFIT.",
    phases: [
      {
        id: "etapa-1",
        stageLabel: "Etapa 1",
        periodLabel: "Semana 1 · 01–07 Mar",
        startDate: "2026-03-01",
        endDate: "2026-03-07",
        title: "Capacitación y alistamiento operativo",
        objective: "Asegurar capacidades, materiales y circuitos validados.",
        highlights: [
          "Capacitación técnica completada para personal y referentes.",
          "Materiales operativos y stock qFIT listos para despliegue.",
          "Circuito de registro y derivación validado y comunicado.",
        ],
        details: [
          "Capacitación técnica dictada por Fundación GEDyT para el personal de estaciones.",
          "Cobertura de prevención general de cáncer colorrectal.",
          "Práctica de uso operativo del test qFIT en terreno.",
          "Alineamiento de roles, trazabilidad y criterios de derivación.",
        ],
      },
      {
        id: "etapa-2",
        stageLabel: "Etapa 2",
        periodLabel: "09–22 Mar",
        startDate: "2026-03-09",
        endDate: "2026-03-22",
        title: "Difusión y educación",
        objective:
          "Impulsar la participación y asegurar comprensión del proceso.",
        highlights: [
          "Campaña multicanal coordinada con aliados institucionales.",
          "Acciones en estaciones con material impreso y digital para convocatoria.",
          "Webinars breves con Q&A para equipos y población objetivo.",
        ],
        details: [
          "9 al 15 de marzo: campaña intensiva en redes (Fundación, LALCEC, Bienestar Ciudadano, Ministerio de Salud, AAOC y SAGE).",
          "16 al 22 de marzo: educación presencial en estaciones, reparto de folletería y formularios digitales para personas interesadas.",
          "Webinars Estaciones Saludables Clic: charlas de 35 minutos con Q&A por Zoom junto a especialista médico.",
          "31 de marzo (Día Mundial del Cáncer de Colon): evento presencial en la estación de mayor concurrencia con charlas y actividades de prevención.",
        ],
      },
      {
        id: "etapa-3",
        stageLabel: "Etapa 3",
        periodLabel: "23 Mar–01 Abr",
        startDate: "2026-03-23",
        endDate: "2026-04-01",
        title: "Operativo de testeo qFIT",
        objective:
          "Ejecutar entrega, recepción y gestión de muestras con trazabilidad.",
        highlights: [
          "Distribución de kits y orientación al participante en estaciones priorizadas.",
          "Recepción y devolución de muestras según ventana logística definida.",
          "Consolidación de resultados y seguimiento según protocolo.",
        ],
        details: [
          "Stock operativo: 300 qFIT para despliegue en estaciones de mayor concurrencia.",
          "Estaciones priorizadas: Parque Saavedra, Aristóbulo del Valle, Parque Rivadavia y Parque Chacabuco.",
          "Entrega de kits: del lunes 23 al sábado 28 de marzo.",
          "Recepción y devolución de muestras: del domingo 29 de marzo al miércoles 1 de abril.",
          "Navegadores: 1 por estación para entrega, recepción y seguimiento virtual paralelo.",
        ],
      },
    ],
  },
};

const STATION_BRIDGE_KEYS = Object.freeze({
  station: "ppccr_station",
  stationId: "ppccr_station_id",
  stationName: "ppccr_station_name",
  stationLegacy: "ppccr_auth_user",
});

const STATION_NAME_BY_ID = Object.freeze({
  saavedra: "Parque Saavedra",
  aristobulo: "Aristóbulo del Valle",
  rivadavia: "Parque Rivadavia",
  chacabuco: "Parque Chacabuco",
  admin: "Administrador",
});

let stationBridgeBound = false;
let stationBridgeLastSignature = "";

const ALGORITHM_HOME = Object.freeze({
  minAge: 45,
  steps: Object.freeze({
    AGE: 1,
    VIGILANCE: 2,
    RISK: 3,
    DECISION: 4,
  }),
  stations: Object.freeze([
    "Parque Saavedra",
    "Parque Rivadavia",
    "Parque Chacabuco",
    "Aristóbulo del Valle",
  ]),
});

const HOME_ALGO_STORAGE_KEY = "ppccr_home_algorithm_interview_v1";
const HOME_ALGO_PARTICIPANT_COUNTER_KEY = "ppccr_home_algorithm_counter_v1";
const HOME_ALGO_STAGE1_SUBMIT_URL =
  "https://us-central1-ppccr-2026.cloudfunctions.net/submitAlgorithmStage1";

const HOME_ALGO_OUTCOME = Object.freeze({
  AGE_EXCLUDED: "AGE_EXCLUDED",
  ACTIVE_SURVEILLANCE_EXCLUDED: "ACTIVE_SURVEILLANCE_EXCLUDED",
  HIGH_RISK_REFERRAL: "HIGH_RISK_REFERRAL",
  FIT_CANDIDATE: "FIT_CANDIDATE",
});

const HOME_ALGO_OUTCOME_TEXT = Object.freeze({
  [HOME_ALGO_OUTCOME.AGE_EXCLUDED]: "No incluye (<45)",
  [HOME_ALGO_OUTCOME.ACTIVE_SURVEILLANCE_EXCLUDED]:
    "Exclusión por vigilancia activa. No se considera candidato a campaña de screening poblacional. En estos casos la recomendación es que la persona realice una consulta médica. No entregar FIT.",
  [HOME_ALGO_OUTCOME.HIGH_RISK_REFERRAL]:
    "Riesgo elevado. No se considera candidato a campaña de screening poblacional. En estos casos la recomendación es que la persona realice una consulta médica. No entregar FIT.",
  [HOME_ALGO_OUTCOME.FIT_CANDIDATE]: "Candidato a Test FIT",
});

const HOME_ALGO_STEP1_FIELDS = Object.freeze({
  station: "station",
  age: "age",
  sex: "sex",
  sexOther: "sexOther",
});

const HOME_ALGO_SEX = Object.freeze({
  MALE: "M",
  FEMALE: "F",
  OTHER: "OTRO",
});

const HOME_ALGO_STEP4_FIELDS = Object.freeze({
  fullName: "fullName",
  documentId: "documentId",
  email: "email",
  phone: "phone",
});

const HOME_ALGO_PRIMARY_BUTTON_CLASS = "btn btn-primary";
const HOME_ALGO_SECONDARY_BUTTON_CLASS = "btn btn-outline-secondary";
const HOME_ALGO_CONTINUE_BUTTON_CLASS = "btn btn-primary px-4 fw-bold";
const HOME_ALGO_UI_TRANSITION_MS = 180;

let homeAlgorithmState = null;
let homeAlgorithmFlowModalState = {
  modal: null,
  card: null,
  body: null,
  source: null,
  completionDialog: null,
  completionCard: null,
  completionText: null,
  completionCloseBtn: null,
  completionNewBtn: null,
  lastFocused: null,
  escListenerBound: false,
  captureListenerBound: false,
  autoCloseTimerId: 0,
  modalTransitionTimerId: 0,
  deviceClockTimerId: 0,
  previewDeviceTimestamp: "",
  scrollLockY: 0,
};
let interviewState = {
  step1: {},
  step2: {},
  step3: {},
  step4: {},
  status: "pending",
};

/* ----------------------------- Helpers ----------------------------- */

const $ = (sel, ctx = document) => ctx.querySelector(sel);

function userPrefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getHomeAlgorithmTransitionMs() {
  return userPrefersReducedMotion() ? 0 : HOME_ALGO_UI_TRANSITION_MS;
}

function isPlaceholderUrl(url) {
  if (!url) return true;
  return String(url).includes("PEGAR_AQUI");
}

function isAnchor(url) {
  return typeof url === "string" && url.startsWith("#");
}

function isInternalPage(url) {
  if (typeof url !== "string") return false;
  const normalized = url.trim();
  if (!normalized || isAnchor(normalized)) return false;

  return (
    normalized.startsWith("/") ||
    normalized.startsWith("./") ||
    normalized.startsWith("../") ||
    /^[\w-]+\.html(?:[?#].*)?$/.test(normalized)
  );
}

function safeSetLink(anchorEl, url, { newTab = false } = {}) {
  if (!anchorEl) return;

  if (!url || isPlaceholderUrl(url)) {
    anchorEl.setAttribute("href", "#");
    anchorEl.setAttribute("aria-disabled", "true");
    anchorEl.setAttribute("tabindex", "-1");
    return;
  }

  anchorEl.setAttribute("href", url);

  if (newTab && !isAnchor(url)) {
    anchorEl.setAttribute("target", "_blank");
    anchorEl.setAttribute("rel", "noopener noreferrer");
  }
}

function deriveLookerEmbedUrl(openUrl) {
  if (!openUrl) return "";
  // Si ya viene como embed, lo devolvemos.
  if (openUrl.includes("/embed/")) return openUrl;

  // Caso típico: /reporting/<id>...
  if (openUrl.includes("lookerstudio.google.com/reporting/")) {
    return openUrl.replace(
      "lookerstudio.google.com/reporting/",
      "lookerstudio.google.com/embed/reporting/",
    );
  }

  // Backwards compatibility (por si aparece datastudio)
  if (openUrl.includes("datastudio.google.com/reporting/")) {
    return openUrl.replace(
      "datastudio.google.com/reporting/",
      "datastudio.google.com/embed/reporting/",
    );
  }

  return openUrl;
}

function debounce(fn, wait = 140) {
  let timeoutId = null;
  return (...args) => {
    window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => fn(...args), wait);
  };
}

function safeSessionGetStation(key) {
  try {
    return sessionStorage.getItem(key) || "";
  } catch (error) {
    return "";
  }
}

function safeSessionSetStation(key, value) {
  try {
    sessionStorage.setItem(key, value);
  } catch (error) {
    // no-op: storage restringido
  }
}

function normalizeStationDetail(detailCandidate, fallbackName = "") {
  if (!detailCandidate || typeof detailCandidate !== "object") return null;

  const rawId = String(
    detailCandidate.stationId || detailCandidate.id || "",
  ).trim();
  if (!rawId) return null;

  const stationId = rawId.toLowerCase();
  const stationName =
    String(detailCandidate.stationName || detailCandidate.name || "").trim() ||
    String(fallbackName || "").trim() ||
    STATION_NAME_BY_ID[stationId] ||
    "Estación";

  return { stationId, stationName };
}

function readStationFromStorageBridge() {
  const bodyId = String(document.body?.dataset.station || "").trim().toLowerCase();
  const bodyName = String(document.body?.dataset.stationName || "").trim();
  if (bodyId) {
    return normalizeStationDetail({ stationId: bodyId, stationName: bodyName });
  }

  const rawStation = safeSessionGetStation(STATION_BRIDGE_KEYS.station);
  if (rawStation) {
    try {
      const parsed = JSON.parse(rawStation);
      const normalized = normalizeStationDetail(parsed);
      if (normalized) return normalized;
    } catch (error) {
      // compat: valor legacy no JSON
      const normalized = normalizeStationDetail({
        stationName: rawStation,
      });
      if (normalized) return normalized;
    }
  }

  const sessionId = safeSessionGetStation(STATION_BRIDGE_KEYS.stationId).trim();
  const sessionName =
    safeSessionGetStation(STATION_BRIDGE_KEYS.stationName).trim() ||
    safeSessionGetStation(STATION_BRIDGE_KEYS.stationLegacy).trim();

  if (!sessionId) return null;
  return normalizeStationDetail({
    stationId: sessionId,
    stationName: sessionName,
  });
}

function syncStationBridgeState(station) {
  if (!station || !document.body) return;

  document.body.dataset.station = station.stationId;
  document.body.dataset.stationName = station.stationName;

  safeSessionSetStation(
    STATION_BRIDGE_KEYS.station,
    JSON.stringify({
      id: station.stationId,
      name: station.stationName,
      stationId: station.stationId,
      stationName: station.stationName,
    }),
  );
  safeSessionSetStation(STATION_BRIDGE_KEYS.stationId, station.stationId);
  safeSessionSetStation(STATION_BRIDGE_KEYS.stationName, station.stationName);
  safeSessionSetStation(STATION_BRIDGE_KEYS.stationLegacy, station.stationName);
}

function emitStationChangedBridge(station) {
  if (!station) return;

  const signature = `${station.stationId}|${station.stationName}`;
  if (signature === stationBridgeLastSignature) return;
  stationBridgeLastSignature = signature;

  window.dispatchEvent(
    new CustomEvent("ppccr:station-changed", {
      detail: {
        stationId: station.stationId,
        stationName: station.stationName,
      },
    }),
  );
}

function setupStationBridge() {
  if (stationBridgeBound) return;
  stationBridgeBound = true;

  window.addEventListener("ppccr:stationChanged", (event) => {
    if (!(event instanceof CustomEvent)) return;
    const station = normalizeStationDetail(event.detail || {});
    if (!station) return;
    syncStationBridgeState(station);
    emitStationChangedBridge(station);
  });

  window.addEventListener("ppccr:open-station-picker", () => {
    if (window.PPCCR?.station && typeof window.PPCCR.station.openSwitcher === "function") {
      window.PPCCR.station.openSwitcher();
      return;
    }

    const trigger = document.querySelector("#station-switch-trigger, #user-banner");
    if (trigger instanceof HTMLElement) {
      trigger.click();
    }
  });

  window.PPCCR = window.PPCCR || {};
  window.PPCCR.getActiveStation = () => {
    const station = readStationFromStorageBridge();
    if (!station) return null;
    return {
      stationId: station.stationId,
      stationName: station.stationName,
      id: station.stationId,
      name: station.stationName,
    };
  };

  const initialStation =
    window.PPCCR?.station && typeof window.PPCCR.station.get === "function"
      ? normalizeStationDetail(window.PPCCR.station.get())
      : readStationFromStorageBridge();
  if (initialStation) {
    syncStationBridgeState(initialStation);
    emitStationChangedBridge(initialStation);
  }
}

let currentHeaderOffset = 180;
let mobileBarsResizeTimer = null;
let mobileBarsObserver = null;
let mobileShellResizeObserver = null;
let mobilePremiumHeaderBound = false;

function setHeaderOffset() {
  const root = document.documentElement;
  const header = $(".site-header");
  const headerHeight = header ? header.getBoundingClientRect().height : 160;
  const headerFixed = Math.max(0, Math.round(headerHeight));
  const nextOffset = Math.max(96, Math.round(headerHeight + 16));

  root.style.setProperty("--header-fixed-h", `${headerFixed}px`);

  if (nextOffset !== currentHeaderOffset) {
    currentHeaderOffset = nextOffset;
    root.style.setProperty("--header-offset", `${nextOffset}px`);
  }

  if (document.body.classList.contains("page-home")) {
    const mobileQuery = window.matchMedia("(max-width: 520px)");
    const mobileTopbar = $("#siteTopbar") || $(".topbar");
    const topbarHeight = mobileTopbar
      ? Math.max(48, Math.round(mobileTopbar.getBoundingClientRect().height))
      : 64;

    if (mobileQuery.matches) {
      const mobileHeaderHeight = Math.max(0, Math.round(headerHeight));
      root.style.setProperty("--topbar-h", `${topbarHeight}px`);
      root.style.setProperty("--mobile-header-h", `${mobileHeaderHeight}px`);
      root.style.setProperty(
        "--home-mobile-header-offset",
        `${mobileHeaderHeight + 8}px`,
      );
      root.style.setProperty("--h-offset", `${topbarHeight + 12}px`);
    }
  }

  return currentHeaderOffset;
}

function getHeaderOffset() {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue("--header-offset")
    .trim();
  const parsed = Number.parseFloat(raw);
  if (Number.isFinite(parsed) && parsed > 0) return parsed;
  return currentHeaderOffset;
}

function updateMobileBars() {
  if (!document.body.classList.contains("page-home")) return;

  const root = document.documentElement;
  const isMobile = window.matchMedia("(max-width: 520px)").matches;
  const header = $(".site-header");
  const topbar = $("#siteTopbar") || $(".topbar");
  const headerHeight = header
    ? Math.max(0, Math.round(header.getBoundingClientRect().height))
    : 0;
  const fixedDock =
    document.querySelector("#mobile-fixed-dock.is-visible") ||
    document.querySelector("#mobileFixedDock.is-visible");
  const fallbackDock = document.querySelector(".site-nav .nav-list");
  const dock = fixedDock || fallbackDock;

  root.style.setProperty("--header-fixed-h", `${headerHeight}px`);

  if (!isMobile) {
    root.style.setProperty("--mobile-header-h", "0px");
    root.style.setProperty("--mobile-dock-h", "0px");
    return;
  }
  const topbarHeight = topbar
    ? Math.max(48, Math.ceil(topbar.getBoundingClientRect().height))
    : 64;
  const dockHeight = dock
    ? Math.max(64, Math.ceil(dock.getBoundingClientRect().height))
    : 76;

  root.style.setProperty("--topbar-h", `${topbarHeight}px`);
  root.style.setProperty("--mobile-header-h", `${headerHeight}px`);
  root.style.setProperty("--dock-h", `${dockHeight}px`);
  root.style.setProperty("--mobile-dock-h", `${dockHeight}px`);
  root.style.setProperty("--home-mobile-header-offset", `${headerHeight + 8}px`);
  root.style.setProperty("--h-offset", `${topbarHeight + 12}px`);
}

function updateEmbedLoadState(wrapperEl, state) {
  if (!wrapperEl) return;

  const { embedLoadingClass, embedReadyClass } = CONFIG.ui;
  wrapperEl.classList.remove(embedLoadingClass, embedReadyClass);

  if (state === "loading") wrapperEl.classList.add(embedLoadingClass);
  if (state === "ready") wrapperEl.classList.add(embedReadyClass);
}

const embedTimeoutByShell = new WeakMap();

function clearEmbedTimeout(shell) {
  if (!shell) return;
  const timeoutId = embedTimeoutByShell.get(shell);
  if (timeoutId) {
    window.clearTimeout(timeoutId);
    embedTimeoutByShell.delete(shell);
  }
}

function markEmbedLoaded(shell) {
  if (!shell) return;
  clearEmbedTimeout(shell);
  shell.classList.add("is-loaded");
  shell.classList.remove("is-timeout");
  updateEmbedLoadState(shell, "ready");
}

function armEmbedTimeout(shell) {
  if (!shell) return;
  clearEmbedTimeout(shell);
  const timeoutId = window.setTimeout(() => {
    if (!shell.classList.contains("is-loaded")) {
      shell.classList.add("is-timeout");
    }
  }, 8000);
  embedTimeoutByShell.set(shell, timeoutId);
}

function initEmbeds() {
  const shells = document.querySelectorAll("[data-embed]");
  shells.forEach((shell) => {
    if (shell.dataset.embedInit === "true") return;
    const iframe = shell.querySelector("iframe");
    if (!iframe) return;

    shell.dataset.embedInit = "true";
    iframe.addEventListener("load", () => {
      markEmbedLoaded(shell);
    });
  });
}

function loadEmbedWithSkeleton(iframeEl, wrapperEl, src) {
  if (!iframeEl || !src) return;

  if (wrapperEl) {
    initEmbeds();
    wrapperEl.classList.remove("is-loaded", "is-timeout");
    updateEmbedLoadState(wrapperEl, "loading");
    armEmbedTimeout(wrapperEl);
  }

  iframeEl.src = src;
}

/* ----------------------------- Renderers ----------------------------- */

function renderPartnerLogos() {
  const wrap = $("#partner-logos");
  const footerWrap = $("#footer-logos");
  if (!wrap) return;

  const partners = [
    { key: "fep", ...CONFIG.assets.logos.fep },
    { key: "gedyt", ...CONFIG.assets.logos.gedyt },
    { key: "merck", ...CONFIG.assets.logos.merck },
    { key: "gcba", ...CONFIG.assets.logos.gcba },
  ];

  partners.forEach((p) => {
    // Header strip item
    const chip = document.createElement("div");
    chip.className = "partner-logo partner-pill";
    chip.dataset.partner = p.key;

    const img = document.createElement("img");
    img.src = p.src;
    img.alt = p.alt;
    img.loading = "eager";
    img.fetchPriority = "high";
    img.decoding = "async";
    // Reserva proporción desde el primer layout en mobile para evitar "pills" vacíos.
    img.width = 290;
    img.height = 110;
    img.dataset.partner = p.key;

    const label = document.createElement("span");
    label.textContent = p.alt;

    chip.appendChild(img);
    chip.appendChild(label);
    wrap.appendChild(chip);

    if (footerWrap) {
      // Footer mini logo (si existe footer)
      const fImg = document.createElement("img");
      fImg.src = p.src;
      fImg.alt = p.alt;
      fImg.loading = "lazy";
      fImg.decoding = "async";
      fImg.dataset.partner = p.key;
      footerWrap.appendChild(fImg);
    }
  });
}

function renderGuides() {
  const grid = $("#guides-grid");
  if (!grid) return;

  const iconMap = {
    estructuraPrograma:
      '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M3.5 7.4a1.9 1.9 0 0 1 1.9-1.9h4l1.3 1.3h7.8a1.9 1.9 0 0 1 1.9 1.9v8.8a1.9 1.9 0 0 1-1.9 1.9H5.4a1.9 1.9 0 0 1-1.9-1.9z"></path><path d="M8 12h8"></path></svg>',
    algoritmoRiesgo:
      '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="8.2"></circle><path d="M12 12 16 9"></path><circle cx="12" cy="12" r="1.2"></circle><path d="M12 5.5v1.3"></path><path d="M18.5 12h-1.3"></path></svg>',
    rolesResponsabilidades:
      '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="8.2" cy="9" r="2.4"></circle><circle cx="15.8" cy="9" r="2.4"></circle><path d="M4.8 16.8a3.4 3.4 0 0 1 6.8 0"></path><path d="M12.4 16.8a3.4 3.4 0 0 1 6.8 0"></path></svg>',
    manejoKitFIT:
      '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7.8 7.3h8.4"></path><path d="M8.6 7.3v3.5l-2.8 4.8A4.7 4.7 0 0 0 9.9 22h4.2a4.7 4.7 0 0 0 4.1-6.4l-2.8-4.8V7.3"></path><path d="M9.1 14.2h5.8"></path></svg>',
    entregaMuestras:
      '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m12 3.6 7.2 4.1v8.2L12 20l-7.2-4.1V7.7z"></path><path d="m12 3.6 7.2 4.1L12 11.8 4.8 7.7z"></path><path d="M12 11.8V20"></path></svg>',
    workflow:
      '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="4.5" y="5" width="15" height="14" rx="2.5"></rect><path d="M8.5 9.2h7"></path><path d="M8.5 12h4.8"></path><path d="m9.1 15.2 1.8 1.7 3.9-3.9"></path></svg>',
    kpis:
      '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 19.5h16"></path><rect x="5.5" y="10.5" width="3.2" height="7" rx="1"></rect><rect x="10.4" y="7.8" width="3.2" height="9.7" rx="1"></rect><rect x="15.3" y="5.5" width="3.2" height="12" rx="1"></rect></svg>',
  };

  CONFIG.links.guias.forEach((g, index) => {
    const a = document.createElement("a");
    a.className = "pill";
    a.dataset.key = g.key;
    a.dataset.animate = "";
    a.style.setProperty("--delay", `${Math.min(index * 35, 210)}ms`);

    const icon = document.createElement("span");
    icon.className = "pill__icon";
    icon.setAttribute("aria-hidden", "true");
    icon.innerHTML =
      iconMap[g.key] ||
      '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="6" y="4.5" width="12" height="15" rx="2"></rect><path d="M9 9h6"></path><path d="M9 12.5h6"></path></svg>';

    const text = document.createElement("span");
    text.className = "pill__text";

    const title = document.createElement("span");
    title.className = "pill__title";
    title.textContent = g.title;

    const meta = document.createElement("span");
    meta.className = "pill__meta";
    meta.textContent = g.meta || "";

    text.appendChild(title);
    if (g.meta) text.appendChild(meta);

    a.appendChild(icon);
    a.appendChild(text);

    // Guías externas abren en nueva pestaña. Anclas y páginas internas no.
    const openInNewTab = !isAnchor(g.url) && !isInternalPage(g.url);
    safeSetLink(a, g.url, { newTab: openInNewTab });

    if (!g.url || isPlaceholderUrl(g.url)) {
      meta.textContent = "Pendiente (pegar URL)";
    }

    grid.appendChild(a);
  });
}

function renderRoles() {
  const grid = $("#roles-grid");
  if (!grid) return;
  grid.innerHTML = "";

  const roleFormIcons = {
    entregaKitFIT:
      '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4.5 10.2h15v8.3a1.8 1.8 0 0 1-1.8 1.8H6.3a1.8 1.8 0 0 1-1.8-1.8z"></path><path d="M8.2 10.2V7.8a2.2 2.2 0 0 1 2.2-2.2h3.2a2.2 2.2 0 0 1 2.2 2.2v2.4"></path><path d="M12 12.6v4"></path><path d="M10 14.6h4"></path></svg>',
    recepcionMuestraFIT:
      '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M9.8 4.5h4.4"></path><path d="M10.4 4.5v3.6l-2.8 4.7a5 5 0 0 0 4.4 7.2 5 5 0 0 0 4.4-7.2l-2.8-4.7V4.5"></path><path d="M9.4 13.1h5.2"></path><path d="M12 17.8v.01"></path></svg>',
    envioMuestrasLaboratorio:
      '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M3.5 9h11.5v7.8H3.5z"></path><path d="M15 11h3.3l2.2 2.2v3.6H15z"></path><path d="M6.8 18.2h.1"></path><path d="M17.8 18.2h.1"></path><path d="M6.8 18.2a1.7 1.7 0 1 0 0 .01"></path><path d="M17.8 18.2a1.7 1.7 0 1 0 0 .01"></path><path d="M6 6.3h5.6"></path></svg>',
    recepcionResultadosFIT:
      '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="6" y="4.5" width="12" height="15" rx="2"></rect><path d="M9 9h6"></path><path d="M9 12h6"></path><path d="m9.2 15.2 1.6 1.6 3.2-3.2"></path></svg>',
    entrevistaMedica:
      '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M8 4.2v4.2a3.1 3.1 0 0 0 3.1 3.1h1.8A3.1 3.1 0 0 0 16 8.4V4.2"></path><path d="M12 11.5v2.4a4.2 4.2 0 1 0 8.4 0v-2.5"></path><circle cx="16.2" cy="17.9" r="2.1"></circle></svg>',
    informePacienteResultadoFIT:
      '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 4.5h8l4 4v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-13a2 2 0 0 1 2-2z"></path><path d="M14 4.5V9h4"></path><circle cx="10.2" cy="12.7" r="1.8"></circle><path d="M7.9 17.2a2.8 2.8 0 0 1 4.6 0"></path></svg>',
    evaluacionInicialSalud:
      '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="5.5" y="4.5" width="13" height="15" rx="2"></rect><path d="M9 8h6"></path><path d="M9 11h6"></path><path d="M10.1 15.4h3.8"></path><path d="M12 13.5v3.8"></path></svg>',
  };

  const shortLabels = {
    entregaKitFIT: "Entrega de kit FIT",
    recepcionMuestraFIT: "Recepción de muestra FIT",
    envioMuestrasLaboratorio: "Envío a laboratorio",
    recepcionResultadosFIT: "Recepción de resultados FIT",
    entrevistaMedica: "Entrevista médica",
    informePacienteResultadoFIT: "Informe de resultado FIT",
    evaluacionInicialSalud: "Evaluación inicial",
  };

  const enfermeriaItems = Array.isArray(CONFIG.links.formularios?.enfermeria?.items)
    ? [...CONFIG.links.formularios.enfermeria.items]
    : [];
  const medicosItems = Array.isArray(CONFIG.links.formularios?.medicos?.items)
    ? CONFIG.links.formularios.medicos.items
    : [];
  const informeResultadoFIT = medicosItems.find(
    (item) => item?.key === "informePacienteResultadoFIT",
  );

  const consolidatedItems = [...enfermeriaItems];
  if (
    informeResultadoFIT &&
    !consolidatedItems.some((item) => item.key === informeResultadoFIT.key)
  ) {
    consolidatedItems.push(informeResultadoFIT);
  }

  const roles = consolidatedItems.length
    ? [{ key: "registroOperativo", title: "", desc: "", items: consolidatedItems }]
    : [];

  grid.classList.toggle("role-grid--single", roles.length === 1);

  roles.forEach((roleCfg, roleIndex) => {
    if (!roleCfg || !Array.isArray(roleCfg.items) || roleCfg.items.length === 0) return;

    const card = document.createElement("article");
    card.className = "role-card";
    card.dataset.animate = "";
    card.style.setProperty("--delay", `${120 + roleIndex * 70}ms`);

    const titleText = String(roleCfg.title || "").trim();
    const descText = String(roleCfg.desc || "").trim();
    const hasHeader = titleText.length > 0 || descText.length > 0;

    if (hasHeader) {
      const header = document.createElement("header");
      header.className = "role-card__header";

      if (titleText) {
        const h = document.createElement("h3");
        h.className = "role-card__title";
        h.textContent = titleText;
        header.appendChild(h);
      }

      if (descText) {
        const desc = document.createElement("p");
        desc.className = "role-card__desc";
        desc.textContent = descText;
        header.appendChild(desc);
      }

      card.appendChild(header);
    } else {
      card.classList.add("role-card--single-nohead");
    }

    const actions = document.createElement("div");
    actions.className = "role-card__actions role-actions";

    roleCfg.items.forEach((item) => {
      const a = document.createElement("a");
      a.className = "action-pill role-link";
      a.dataset.key = item.key;

      const icon = document.createElement("span");
      icon.className = "action-pill__icon role-link__icon";
      icon.setAttribute("aria-hidden", "true");
      icon.innerHTML =
        roleFormIcons[item.key] ||
        '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="6" y="4.5" width="12" height="15" rx="2"></rect><path d="M9 9h6"></path><path d="M9 12.5h6"></path></svg>';

      const label = document.createElement("span");
      label.className = "action-pill__label role-link__label";
      label.textContent = shortLabels[item.key] || item.label;

      const chev = document.createElement("span");
      chev.className = "action-pill__chev role-link__chev";
      chev.setAttribute("aria-hidden", "true");
      chev.textContent = "↗";

      a.appendChild(icon);
      a.appendChild(label);
      a.appendChild(chev);

      // Formularios SIEMPRE nueva pestaña
      safeSetLink(a, item.url, { newTab: true });

      if (!item.url || isPlaceholderUrl(item.url)) {
        a.setAttribute("aria-label", `${item.label} (URL pendiente)`);
      } else {
        a.setAttribute(
          "aria-label",
          `${label.textContent} (abre en nueva pestaña)`,
        );
      }

      actions.appendChild(a);
    });

    card.appendChild(actions);
    grid.appendChild(card);
  });
}

function renderTimelinePlaceholder() {
  const wrap = $("#timeline-placeholder");
  const list = $("#timeline-list");
  const title = $("#timeline-placeholder-title");
  const subtitle = $("#timeline-placeholder-subtitle");
  if (!wrap || !list) return;

  if (title && CONFIG.timeline?.title) title.textContent = CONFIG.timeline.title;
  if (subtitle && CONFIG.timeline?.subtitle) {
    subtitle.textContent = CONFIG.timeline.subtitle;
  }

  list.innerHTML = "";
  const phases = Array.isArray(CONFIG.timeline?.phases)
    ? CONFIG.timeline.phases
    : Array.isArray(CONFIG.timeline?.milestones)
      ? CONFIG.timeline.milestones.map((milestone, index) => ({
          id: `etapa-${index + 1}`,
          stageLabel: milestone.phase || `Etapa ${index + 1}`,
          periodLabel: milestone.phase || "",
          title: milestone.title || "",
          objective: milestone.description || "",
          highlights: [],
          details: Array.isArray(milestone.details) ? milestone.details : [],
        }))
      : [];

  if (phases.length === 0) {
    wrap.hidden = true;
    return;
  }

  wrap.hidden = false;

  phases.forEach((phaseCfg, index) => {
    const item = document.createElement("li");
    item.className = "phase-card";
    item.id = phaseCfg.id || `etapa-${index + 1}`;

    const top = document.createElement("div");
    top.className = "phase-top";

    const stage = document.createElement("span");
    stage.className = "phase-stage";
    stage.textContent = phaseCfg.stageLabel || `Etapa ${index + 1}`;

    const period = document.createElement("p");
    period.className = "phase-period";

    const periodTime = document.createElement("time");
    const periodLabel = String(phaseCfg.periodLabel || "").trim();
    periodTime.textContent = periodLabel || "Período por confirmar";
    if (phaseCfg.startDate && phaseCfg.endDate) {
      periodTime.dateTime = `${phaseCfg.startDate}/${phaseCfg.endDate}`;
    } else if (phaseCfg.startDate) {
      periodTime.dateTime = phaseCfg.startDate;
    }
    period.appendChild(periodTime);
    top.appendChild(period);
    top.appendChild(stage);

    const titleEl = document.createElement("h3");
    titleEl.className = "phase-title";
    titleEl.textContent = phaseCfg.title || "";

    const objective = document.createElement("p");
    objective.className = "phase-objective";
    objective.textContent = phaseCfg.objective || "";

    const highlightsLabel = document.createElement("p");
    highlightsLabel.className = "phase-highlights-label";
    highlightsLabel.textContent = "Hitos clave";
    highlightsLabel.id = `${item.id}-highlights`;

    const highlightsList = document.createElement("ul");
    highlightsList.className = "phase-highlights";
    highlightsList.setAttribute("aria-labelledby", highlightsLabel.id);
    (Array.isArray(phaseCfg.highlights) ? phaseCfg.highlights : [])
      .slice(0, 3)
      .forEach((highlight) => {
        const li = document.createElement("li");
        li.textContent = highlight;
        highlightsList.appendChild(li);
      });

    item.appendChild(top);
    item.appendChild(titleEl);
    item.appendChild(objective);
    if (highlightsList.children.length > 0) {
      item.appendChild(highlightsLabel);
      item.appendChild(highlightsList);
    }

    if (Array.isArray(phaseCfg.details) && phaseCfg.details.length > 0) {
      const details = document.createElement("details");
      details.className = "phase-details";

      const summary = document.createElement("summary");
      summary.className = "phase-details__summary";
      summary.textContent = "Ver detalle operativo";
      details.appendChild(summary);

      const detailList = document.createElement("ul");
      detailList.className = "phase-details__list";

      phaseCfg.details.forEach((detail) => {
        const detailItem = document.createElement("li");
        detailItem.textContent = detail;
        detailList.appendChild(detailItem);
      });

      details.appendChild(detailList);
      item.appendChild(details);
    }

    list.appendChild(item);
  });
}

function renderEmbeds() {
  // Looker
  const lookerOpen = $("#looker-open");
  const lookerIframe = $("#looker-iframe");
  const lookerWrap = $("#looker-embed-wrap");
  const lookerFallback = $("#looker-fallback");
  const lookerHint = $("#looker-hint");
  const lookerFullscreenBtn = $("#looker-fullscreen");

  const lookerOpenUrl = CONFIG.embeds.looker.openUrl;
  const lookerEmbedUrl =
    CONFIG.embeds.looker.embedUrl || deriveLookerEmbedUrl(lookerOpenUrl);

  safeSetLink(lookerOpen, lookerOpenUrl, { newTab: true });

  const lookerOk = !!lookerEmbedUrl && !isPlaceholderUrl(lookerEmbedUrl);
  if (lookerOk) {
    loadEmbedWithSkeleton(lookerIframe, lookerWrap, lookerEmbedUrl);
    lookerFallback.hidden = true;
    if (lookerHint) {
      lookerHint.textContent = "";
      lookerHint.hidden = true;
    }
    lookerFullscreenBtn.removeAttribute("aria-disabled");
    lookerFullscreenBtn.disabled = false;
  } else {
    lookerIframe.removeAttribute("src");
    clearEmbedTimeout(lookerWrap);
    lookerWrap.classList.remove("is-loaded", "is-timeout");
    updateEmbedLoadState(lookerWrap, "idle");
    lookerFallback.hidden = false;
    if (lookerHint) {
      lookerHint.hidden = false;
      lookerHint.textContent = "Falta configurar URL de embed.";
    }
    lookerFullscreenBtn.setAttribute("aria-disabled", "true");
    lookerFullscreenBtn.disabled = true;
  }

  // Calendar
  const calOpen = $("#calendar-open");
  const calIframe = $("#calendar-iframe");
  const calWrap = $("#calendar-embed-wrap");
  const calFallback = $("#calendar-fallback");
  const calHint = $("#calendar-hint");

  safeSetLink(calOpen, CONFIG.embeds.calendar.openUrl, { newTab: true });

  const calOk =
    CONFIG.embeds.calendar.embedUrl &&
    !isPlaceholderUrl(CONFIG.embeds.calendar.embedUrl);
  if (calOk) {
    calWrap.hidden = false;
    loadEmbedWithSkeleton(calIframe, calWrap, CONFIG.embeds.calendar.embedUrl);
    calFallback.hidden = true;
    calHint.textContent = "Vista mensual disponible en el calendario embebido.";
  } else {
    calIframe.removeAttribute("src");
    calWrap.hidden = true;
    clearEmbedTimeout(calWrap);
    calWrap.classList.remove("is-loaded", "is-timeout");
    updateEmbedLoadState(calWrap, "idle");
    calFallback.hidden = false;
    calHint.textContent = "Falta pegar URL de calendario (embed).";
  }
}

function setMetaText() {
  const brandKickerEl = $("#brand-kicker");
  if (brandKickerEl) {
    const unitLabelRaw = String(CONFIG.meta.unitLabel || "").trim();
    const unitLabel = /reporte\s+semanal\s+de\s+salud/i.test(unitLabelRaw)
      ? ""
      : unitLabelRaw;
    brandKickerEl.textContent = unitLabel;
    brandKickerEl.hidden = unitLabel.length === 0;
  }

  const yearLabel = String(CONFIG.meta.yearLabel || "").trim();
  const programSuffix = yearLabel ? ` – ${yearLabel}` : "";

  $("#brand-title").textContent = `${CONFIG.meta.programName}${programSuffix}`;

  const heroSubtitleEl = $("#hero-subtitle");
  if (heroSubtitleEl) {
    heroSubtitleEl.textContent = "Accesos rápidos, formularios y reportes";
  }

  const supportEmailEl = $("#support-email");
  if (supportEmailEl) {
    supportEmailEl.textContent = CONFIG.meta.supportEmail;
    if (!isPlaceholderUrl(CONFIG.meta.supportEmail)) {
      supportEmailEl.setAttribute("href", `mailto:${CONFIG.meta.supportEmail}`);
    } else {
      supportEmailEl.setAttribute("href", "#");
      supportEmailEl.setAttribute("aria-disabled", "true");
      supportEmailEl.setAttribute("tabindex", "-1");
    }
  }
}

/* -------------------------- Home: Algoritmo -------------------------- */

function foldAlgorithmText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function normalizeAlgorithmStationName(value) {
  const normalized = foldAlgorithmText(value);
  const stationByKey = {
    "parque saavedra": "Parque Saavedra",
    saavedra: "Parque Saavedra",
    "parque rivadavia": "Parque Rivadavia",
    rivadavia: "Parque Rivadavia",
    "parque chacabuco": "Parque Chacabuco",
    chacabuco: "Parque Chacabuco",
    "aristobulo del valle": "Aristóbulo del Valle",
    aristobulo: "Aristóbulo del Valle",
  };
  return stationByKey[normalized] || "";
}

function normalizeAlgorithmStationId(value) {
  const normalized = foldAlgorithmText(value);
  const stationIdByKey = {
    saavedra: "saavedra",
    "parque saavedra": "saavedra",
    rivadavia: "rivadavia",
    "parque rivadavia": "rivadavia",
    chacabuco: "chacabuco",
    "parque chacabuco": "chacabuco",
    aristobulo: "aristobulo",
    "aristobulo del valle": "aristobulo",
    admin: "admin",
    administrador: "admin",
  };
  return stationIdByKey[normalized] || "";
}

function safeLocalStorageGetJson(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (_error) {
    return null;
  }
}

function safeLocalStorageSetJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (_error) {
    return false;
  }
}

function resolveHomeAlgorithmStationFromBridge() {
  const stationFromBridge =
    window.PPCCR?.getActiveStation && typeof window.PPCCR.getActiveStation === "function"
      ? window.PPCCR.getActiveStation()
      : null;

  const rawId = String(
    stationFromBridge?.stationId || stationFromBridge?.id || "",
  )
    .trim()
    .toLowerCase();
  const rawName = String(
    stationFromBridge?.stationName || stationFromBridge?.name || "",
  ).trim();

  const stationId = normalizeAlgorithmStationId(rawId || rawName);
  const stationName =
    normalizeAlgorithmStationName(rawName) ||
    STATION_NAME_BY_ID[stationId] ||
    "";

  return {
    stationId,
    stationName,
  };
}

function readHomeAlgorithmParticipantCounters() {
  const parsed = safeLocalStorageGetJson(HOME_ALGO_PARTICIPANT_COUNTER_KEY);
  if (!parsed || typeof parsed !== "object") return {};
  return parsed;
}

function writeHomeAlgorithmParticipantCounters(value) {
  safeLocalStorageSetJson(HOME_ALGO_PARTICIPANT_COUNTER_KEY, value);
}

function getHomeAlgorithmParticipantPrefix(stationId, stationName = "") {
  const id = normalizeAlgorithmStationId(stationId || stationName);
  const byStationId = {
    saavedra: "SA",
    rivadavia: "RV",
    chacabuco: "CH",
    aristobulo: "AR",
    admin: "AD",
  };
  return byStationId[id] || "PP";
}

function reserveHomeAlgorithmParticipantNumber(stationId, stationName = "") {
  const prefix = getHomeAlgorithmParticipantPrefix(stationId, stationName);
  const counters = readHomeAlgorithmParticipantCounters();
  const currentCounter = Number.parseInt(String(counters[prefix] || "0"), 10);
  const safeCurrentCounter = Number.isFinite(currentCounter) ? currentCounter : 0;
  const nextCounter = safeCurrentCounter + 1;
  counters[prefix] = nextCounter;
  writeHomeAlgorithmParticipantCounters(counters);
  return `${prefix}-${String(nextCounter).padStart(3, "0")}`;
}

function createHomeAlgorithmInterviewSkeleton(stationDetail = {}) {
  const stationId = normalizeAlgorithmStationId(stationDetail.stationId || stationDetail.stationName);
  const stationName =
    normalizeAlgorithmStationName(stationDetail.stationName) ||
    STATION_NAME_BY_ID[stationId] ||
    "";

  return {
    participantNumber: "",
    stationId,
    stationName,
    deviceTimestamp: "",
    step1: { age: null, sex: "", sexOtherDetail: "", includedByAge: false },
    step2: { exclusions: [], hasExclusion: false },
    step3: { riskFlags: [], hasHighRisk: false },
    step4: { fullName: "", documentId: "", email: "", phone: "" },
    outcome: "",
  };
}

function createHomeAlgorithmInterview(stationDetail = {}) {
  const interview = createHomeAlgorithmInterviewSkeleton(stationDetail);
  interview.participantNumber = reserveHomeAlgorithmParticipantNumber(
    interview.stationId,
    interview.stationName,
  );
  return interview;
}

function sanitizeHomeAlgorithmCodeList(value) {
  if (!Array.isArray(value)) return [];
  const codes = [];
  value.forEach((item) => {
    const code = String(item || "").trim();
    if (!code || codes.includes(code)) return;
    codes.push(code);
  });
  return codes;
}

function isHomeAlgorithmOutcome(value) {
  return Object.values(HOME_ALGO_OUTCOME).includes(value);
}

function normalizeHomeAlgorithmInterview(rawInterview, stationDetail = {}) {
  const source = rawInterview && typeof rawInterview === "object" ? rawInterview : {};
  const normalized = createHomeAlgorithmInterviewSkeleton(stationDetail);

  const resolvedStationId = normalizeAlgorithmStationId(
    source.stationId || source.stationName || stationDetail.stationId || stationDetail.stationName,
  );
  const resolvedStationName =
    normalizeAlgorithmStationName(source.stationName || stationDetail.stationName) ||
    STATION_NAME_BY_ID[resolvedStationId] ||
    "";

  normalized.stationId = resolvedStationId;
  normalized.stationName = resolvedStationName;

  normalized.participantNumber = String(source.participantNumber || "").trim();

  const sourceTimestamp = String(source.deviceTimestamp || "").trim();
  if (sourceTimestamp) {
    const parsedDate = new Date(sourceTimestamp);
    if (!Number.isNaN(parsedDate.getTime())) {
      normalized.deviceTimestamp = parsedDate.toISOString();
    }
  }

  const rawAge = Number.parseInt(String(source?.step1?.age ?? ""), 10);
  normalized.step1.age =
    Number.isFinite(rawAge) && rawAge >= 0 && rawAge <= 120 ? rawAge : null;
  const sourceSex = String(source?.step1?.sex || "").trim().toUpperCase();
  normalized.step1.sex =
    sourceSex === HOME_ALGO_SEX.MALE ||
    sourceSex === HOME_ALGO_SEX.FEMALE ||
    sourceSex === HOME_ALGO_SEX.OTHER
      ? sourceSex
      : "";
  normalized.step1.sexOtherDetail = String(source?.step1?.sexOtherDetail || "").trim();
  if (normalized.step1.sex !== HOME_ALGO_SEX.OTHER) {
    normalized.step1.sexOtherDetail = "";
  }
  normalized.step1.includedByAge =
    typeof source?.step1?.includedByAge === "boolean"
      ? source.step1.includedByAge
      : Number.isFinite(normalized.step1.age) && normalized.step1.age >= ALGORITHM_HOME.minAge;

  normalized.step2.exclusions = sanitizeHomeAlgorithmCodeList(source?.step2?.exclusions);
  normalized.step2.hasExclusion =
    typeof source?.step2?.hasExclusion === "boolean"
      ? source.step2.hasExclusion
      : normalized.step2.exclusions.length > 0;

  normalized.step3.riskFlags = sanitizeHomeAlgorithmCodeList(source?.step3?.riskFlags);
  normalized.step3.hasHighRisk =
    typeof source?.step3?.hasHighRisk === "boolean"
      ? source.step3.hasHighRisk
      : normalized.step3.riskFlags.length > 0;

  normalized.step4.fullName = String(source?.step4?.fullName || "").trim();
  normalized.step4.documentId = String(source?.step4?.documentId || "").trim();
  normalized.step4.email = String(source?.step4?.email || "").trim();
  normalized.step4.phone = String(source?.step4?.phone || "").trim();

  const sourceOutcome = String(source.outcome || "").trim();
  normalized.outcome = isHomeAlgorithmOutcome(sourceOutcome) ? sourceOutcome : "";

  if (!normalized.participantNumber) {
    normalized.participantNumber = reserveHomeAlgorithmParticipantNumber(
      normalized.stationId,
      normalized.stationName,
    );
  }

  return normalized;
}

function loadHomeAlgorithmDraft(stationDetail = {}) {
  const parsed = safeLocalStorageGetJson(HOME_ALGO_STORAGE_KEY);
  if (!parsed || typeof parsed !== "object") return null;
  if (parsed.version !== 1) return null;

  const interview = normalizeHomeAlgorithmInterview(parsed.interview, stationDetail);

  const rawCurrentStep = Number.parseInt(String(parsed.currentStep || ""), 10);
  const rawMaxUnlockedStep = Number.parseInt(String(parsed.maxUnlockedStep || ""), 10);
  const rawFinalStep = Number.parseInt(String(parsed.finalStep || ""), 10);

  const currentStep = Number.isFinite(rawCurrentStep)
    ? Math.min(Math.max(rawCurrentStep, ALGORITHM_HOME.steps.AGE), ALGORITHM_HOME.steps.DECISION)
    : ALGORITHM_HOME.steps.AGE;

  const maxUnlockedStep = Number.isFinite(rawMaxUnlockedStep)
    ? Math.min(Math.max(rawMaxUnlockedStep, ALGORITHM_HOME.steps.AGE), ALGORITHM_HOME.steps.DECISION)
    : ALGORITHM_HOME.steps.AGE;

  const finalStep = Number.isFinite(rawFinalStep)
    ? Math.min(Math.max(rawFinalStep, ALGORITHM_HOME.steps.AGE), ALGORITHM_HOME.steps.DECISION)
    : 0;

  const finalized = Boolean(parsed.finalized) && Boolean(interview.outcome);

  return {
    interview,
    currentStep: Math.min(currentStep, maxUnlockedStep),
    maxUnlockedStep,
    step1Confirmed: Boolean(parsed.step1Confirmed) || Boolean(interview.deviceTimestamp),
    step2Reviewed: Boolean(parsed.step2Reviewed),
    step3Reviewed: Boolean(parsed.step3Reviewed),
    finalized,
    finalStep: finalized ? Math.max(finalStep, ALGORITHM_HOME.steps.AGE) : 0,
  };
}

function formatHomeAlgorithmDeviceTimestamp(timestamp, fallback = "-") {
  if (!timestamp) return fallback;
  const parsed = new Date(timestamp);
  if (Number.isNaN(parsed.getTime())) return fallback;

  try {
    return new Intl.DateTimeFormat("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).format(parsed);
  } catch (_error) {
    const day = String(parsed.getDate()).padStart(2, "0");
    const month = String(parsed.getMonth() + 1).padStart(2, "0");
    const year = parsed.getFullYear();
    const hour = String(parsed.getHours()).padStart(2, "0");
    const minute = String(parsed.getMinutes()).padStart(2, "0");
    return `${day}/${month}/${year}, ${hour}:${minute}`;
  }
}

function setHomeAlgorithmFeedback(element, message, tone = "neutral") {
  if (!element) return;
  element.textContent = message;
  element.dataset.tone = tone;

  if (!homeAlgorithmState?.flowStatus) return;

  const panel = element.closest("[data-home-algo-step-panel]");
  if (!panel) return;

  const step = Number(panel.getAttribute("data-home-algo-step-panel") || "");
  if (!Number.isFinite(step)) return;
  if (step !== homeAlgorithmState.currentStep) return;

  homeAlgorithmState.flowStatus.textContent = message;
  homeAlgorithmState.flowStatus.dataset.tone = tone;
}

function setHomeAlgorithmButtonLoading(
  button,
  { loading = false, label = "Guardando..." } = {},
) {
  if (!(button instanceof HTMLButtonElement)) return;

  if (loading) {
    if (!button.dataset.originalLabel) {
      button.dataset.originalLabel = button.innerHTML;
    }
    button.disabled = true;
    button.classList.add("is-loading");
    button.setAttribute("aria-busy", "true");
    button.textContent = label;
    return;
  }

  button.classList.remove("is-loading");
  button.removeAttribute("aria-busy");
  if (button.dataset.originalLabel) {
    button.innerHTML = button.dataset.originalLabel;
    delete button.dataset.originalLabel;
  }
  button.disabled = false;
}

function updateHomeAlgorithmPanelOverflowHints(panel) {
  if (!(panel instanceof HTMLElement)) return;
  if (panel.hidden) {
    panel.classList.remove("is-overflow-scrollable", "is-overflow-top", "is-overflow-bottom");
    return;
  }

  const hasOverflow = panel.scrollHeight - panel.clientHeight > 4;
  panel.classList.toggle("is-overflow-scrollable", hasOverflow);
  if (!hasOverflow) {
    panel.classList.remove("is-overflow-top", "is-overflow-bottom");
    return;
  }

  const isAtTop = panel.scrollTop <= 2;
  const isAtBottom = panel.scrollTop + panel.clientHeight >= panel.scrollHeight - 2;
  panel.classList.toggle("is-overflow-top", !isAtTop);
  panel.classList.toggle("is-overflow-bottom", !isAtBottom);
}

function refreshHomeAlgorithmOverflowHints() {
  if (!homeAlgorithmState?.stepPanels) return;
  homeAlgorithmState.stepPanels.forEach((panel) => {
    if (!panel.hidden) {
      updateHomeAlgorithmPanelOverflowHints(panel);
    }
  });
}

function getHomeAlgorithmOutcomeText(outcome) {
  return HOME_ALGO_OUTCOME_TEXT[outcome] || "-";
}

function getHomeAlgorithmSexDisplay(step1 = {}) {
  const sex = String(step1.sex || "").trim().toUpperCase();
  if (sex === HOME_ALGO_SEX.OTHER) {
    const detail = String(step1.sexOtherDetail || "").trim();
    if (detail) return `Otro (${detail})`;
    return "Otro";
  }
  if (sex === HOME_ALGO_SEX.MALE || sex === HOME_ALGO_SEX.FEMALE) {
    return sex;
  }
  return "-";
}

function getHomeAlgorithmCodesFromInputs(inputs, attributeName) {
  const codes = [];
  inputs.forEach((input) => {
    if (!input.checked) return;
    const code = String(input.getAttribute(attributeName) || "").trim();
    if (!code || codes.includes(code)) return;
    codes.push(code);
  });
  return codes;
}

function collectHomeAlgorithmCodeLabels(inputs, attributeName) {
  const labels = new Map();
  inputs.forEach((input) => {
    const code = String(input.getAttribute(attributeName) || "").trim();
    if (!code) return;
    const text = String(
      input.closest("label")?.querySelector("span")?.textContent ||
        input.closest("label")?.textContent ||
        code,
    )
      .replace(/\s+/g, " ")
      .trim();
    labels.set(code, text || code);
  });
  return labels;
}

function describeHomeAlgorithmCodes(codes, labelMap) {
  if (!Array.isArray(codes) || codes.length === 0) {
    return "- Ninguno marcado";
  }
  return codes
    .map((code) => `- ${labelMap.get(code) || code}`)
    .join("\n");
}

function getHomeAlgorithmCodeItems(codes, labelMap) {
  if (!Array.isArray(codes) || codes.length === 0) return [];
  return codes.map((code) => labelMap.get(code) || code).filter(Boolean);
}

function buildHomeAlgorithmModalReason(outcome, interview, labelMaps) {
  if (outcome === HOME_ALGO_OUTCOME.AGE_EXCLUDED) {
    const age = Number.isFinite(interview?.step1?.age) ? interview.step1.age : "-";
    return `Motivo de cierre: edad ${age} (<45).`;
  }

  if (outcome === HOME_ALGO_OUTCOME.ACTIVE_SURVEILLANCE_EXCLUDED) {
    const items = getHomeAlgorithmCodeItems(
      interview?.step2?.exclusions || [],
      labelMaps?.step2 || new Map(),
    );
    if (items.length === 0) {
      return "Motivo de exclusión: vigilancia activa.";
    }
    return `Motivo de exclusión: ${items.join(" | ")}`;
  }

  if (outcome === HOME_ALGO_OUTCOME.HIGH_RISK_REFERRAL) {
    const items = getHomeAlgorithmCodeItems(
      interview?.step3?.riskFlags || [],
      labelMaps?.step3 || new Map(),
    );
    if (items.length === 0) {
      return "Motivo de cierre: riesgo elevado.";
    }
    return `Motivo de cierre por riesgo elevado: ${items.join(" | ")}`;
  }

  if (outcome === HOME_ALGO_OUTCOME.FIT_CANDIDATE) {
    return "Sin criterios excluyentes en pasos 1, 2 y 3.";
  }

  return "-";
}

function buildHomeAlgorithmSummaryText(interview, labelMaps, { includeJson = false } = {}) {
  const ageText = Number.isFinite(interview?.step1?.age) ? String(interview.step1.age) : "-";
  const step2Lines = describeHomeAlgorithmCodes(
    interview?.step2?.exclusions || [],
    labelMaps?.step2 || new Map(),
  );
  const step3Lines = describeHomeAlgorithmCodes(
    interview?.step3?.riskFlags || [],
    labelMaps?.step3 || new Map(),
  );

  const lines = [
    "PPCCR - Resumen de entrevista",
    `Resultado final: ${getHomeAlgorithmOutcomeText(interview?.outcome)}`,
    `Código resultado: ${interview?.outcome || "-"}`,
    "",
    `Número de participante: ${interview?.participantNumber || "-"}`,
    `Estación: ${interview?.stationName || "-"}`,
    `Estación ID: ${interview?.stationId || "-"}`,
    `Fecha/hora dispositivo: ${formatHomeAlgorithmDeviceTimestamp(
      interview?.deviceTimestamp,
      "Pendiente de confirmar Paso 1",
    )}`,
    "",
    "Paso 1 - Criterio por edad",
    `Edad: ${ageText}`,
    `Sexo: ${getHomeAlgorithmSexDisplay(interview?.step1)}`,
    `Incluye por edad: ${interview?.step1?.includedByAge ? "Sí" : "No"}`,
    "",
    "Paso 2 - Vigilancia activa",
    `Tiene exclusión: ${interview?.step2?.hasExclusion ? "Sí" : "No"}`,
    "Criterios marcados:",
    step2Lines,
    "",
    "Paso 3 - Riesgo elevado",
    `Tiene riesgo elevado: ${interview?.step3?.hasHighRisk ? "Sí" : "No"}`,
    "Criterios marcados:",
    step3Lines,
    "",
    "Paso 4 - Datos de contacto",
    `Apellido y nombre: ${interview?.step4?.fullName || "-"}`,
    `Documento: ${interview?.step4?.documentId || "-"}`,
    `Email: ${interview?.step4?.email || "-"}`,
    `Celular: ${interview?.step4?.phone || "-"}`,
  ];

  if (includeJson) {
    lines.push("");
    lines.push("JSON:");
    lines.push(JSON.stringify(interview, null, 2));
  }

  return lines.join("\n");
}

function clearHomeAlgorithmFieldError(field) {
  if (!homeAlgorithmState) return;

  if (field === HOME_ALGO_STEP1_FIELDS.station && homeAlgorithmState.stationInput) {
    homeAlgorithmState.stationInput.classList.remove("is-invalid");
    homeAlgorithmState.stationInput.removeAttribute("aria-invalid");
    return;
  }

  if (field === HOME_ALGO_STEP1_FIELDS.age && homeAlgorithmState.ageInput) {
    homeAlgorithmState.ageInput.classList.remove("is-invalid");
    homeAlgorithmState.ageInput.removeAttribute("aria-invalid");
    return;
  }

  if (field === HOME_ALGO_STEP1_FIELDS.sex) {
    homeAlgorithmState.sexGroup?.classList.remove("is-invalid");
    homeAlgorithmState.sexRadios.forEach((radio) => {
      radio.removeAttribute("aria-invalid");
    });
    return;
  }

  if (field === HOME_ALGO_STEP1_FIELDS.sexOther && homeAlgorithmState.sexOtherInput) {
    homeAlgorithmState.sexOtherInput.classList.remove("is-invalid");
    homeAlgorithmState.sexOtherInput.removeAttribute("aria-invalid");
    return;
  }

  if (field === HOME_ALGO_STEP4_FIELDS.fullName && homeAlgorithmState.fullNameInput) {
    homeAlgorithmState.fullNameInput.classList.remove("is-invalid");
    homeAlgorithmState.fullNameInput.removeAttribute("aria-invalid");
    return;
  }

  if (field === HOME_ALGO_STEP4_FIELDS.documentId && homeAlgorithmState.documentIdInput) {
    homeAlgorithmState.documentIdInput.classList.remove("is-invalid");
    homeAlgorithmState.documentIdInput.removeAttribute("aria-invalid");
    return;
  }

  if (field === HOME_ALGO_STEP4_FIELDS.email && homeAlgorithmState.emailInput) {
    homeAlgorithmState.emailInput.classList.remove("is-invalid");
    homeAlgorithmState.emailInput.removeAttribute("aria-invalid");
    return;
  }

  if (field === HOME_ALGO_STEP4_FIELDS.phone && homeAlgorithmState.phoneInput) {
    homeAlgorithmState.phoneInput.classList.remove("is-invalid");
    homeAlgorithmState.phoneInput.removeAttribute("aria-invalid");
  }
}

function clearHomeAlgorithmAllFieldErrors() {
  clearHomeAlgorithmFieldError(HOME_ALGO_STEP1_FIELDS.station);
  clearHomeAlgorithmFieldError(HOME_ALGO_STEP1_FIELDS.age);
  clearHomeAlgorithmFieldError(HOME_ALGO_STEP1_FIELDS.sex);
  clearHomeAlgorithmFieldError(HOME_ALGO_STEP1_FIELDS.sexOther);
  clearHomeAlgorithmFieldError(HOME_ALGO_STEP4_FIELDS.fullName);
  clearHomeAlgorithmFieldError(HOME_ALGO_STEP4_FIELDS.documentId);
  clearHomeAlgorithmFieldError(HOME_ALGO_STEP4_FIELDS.email);
  clearHomeAlgorithmFieldError(HOME_ALGO_STEP4_FIELDS.phone);
}

function markHomeAlgorithmFieldError(field) {
  if (!homeAlgorithmState) return;

  if (field === HOME_ALGO_STEP1_FIELDS.station && homeAlgorithmState.stationInput) {
    homeAlgorithmState.stationInput.classList.add("is-invalid");
    homeAlgorithmState.stationInput.setAttribute("aria-invalid", "true");
    return;
  }

  if (field === HOME_ALGO_STEP1_FIELDS.age && homeAlgorithmState.ageInput) {
    homeAlgorithmState.ageInput.classList.add("is-invalid");
    homeAlgorithmState.ageInput.setAttribute("aria-invalid", "true");
    return;
  }

  if (field === HOME_ALGO_STEP1_FIELDS.sex) {
    homeAlgorithmState.sexGroup?.classList.add("is-invalid");
    homeAlgorithmState.sexRadios.forEach((radio) => {
      radio.setAttribute("aria-invalid", "true");
    });
    return;
  }

  if (field === HOME_ALGO_STEP1_FIELDS.sexOther && homeAlgorithmState.sexOtherInput) {
    homeAlgorithmState.sexOtherInput.classList.add("is-invalid");
    homeAlgorithmState.sexOtherInput.setAttribute("aria-invalid", "true");
    return;
  }

  if (field === HOME_ALGO_STEP4_FIELDS.fullName && homeAlgorithmState.fullNameInput) {
    homeAlgorithmState.fullNameInput.classList.add("is-invalid");
    homeAlgorithmState.fullNameInput.setAttribute("aria-invalid", "true");
    return;
  }

  if (field === HOME_ALGO_STEP4_FIELDS.documentId && homeAlgorithmState.documentIdInput) {
    homeAlgorithmState.documentIdInput.classList.add("is-invalid");
    homeAlgorithmState.documentIdInput.setAttribute("aria-invalid", "true");
    return;
  }

  if (field === HOME_ALGO_STEP4_FIELDS.email && homeAlgorithmState.emailInput) {
    homeAlgorithmState.emailInput.classList.add("is-invalid");
    homeAlgorithmState.emailInput.setAttribute("aria-invalid", "true");
    return;
  }

  if (field === HOME_ALGO_STEP4_FIELDS.phone && homeAlgorithmState.phoneInput) {
    homeAlgorithmState.phoneInput.classList.add("is-invalid");
    homeAlgorithmState.phoneInput.setAttribute("aria-invalid", "true");
  }
}

function focusHomeAlgorithmField(field) {
  if (!homeAlgorithmState) return;

  if (field === HOME_ALGO_STEP1_FIELDS.station && homeAlgorithmState.stationInput) {
    homeAlgorithmState.stationInput.focus();
    return;
  }

  if (field === HOME_ALGO_STEP1_FIELDS.age && homeAlgorithmState.ageInput) {
    homeAlgorithmState.ageInput.focus();
    return;
  }

  if (field === HOME_ALGO_STEP1_FIELDS.sex) {
    const selected = homeAlgorithmState.sexRadios.find((radio) => radio.checked);
    const first = selected || homeAlgorithmState.sexRadios[0];
    if (first) first.focus();
    return;
  }

  if (field === HOME_ALGO_STEP1_FIELDS.sexOther && homeAlgorithmState.sexOtherInput) {
    homeAlgorithmState.sexOtherInput.focus();
    return;
  }

  if (field === HOME_ALGO_STEP4_FIELDS.fullName && homeAlgorithmState.fullNameInput) {
    homeAlgorithmState.fullNameInput.focus();
    return;
  }

  if (field === HOME_ALGO_STEP4_FIELDS.documentId && homeAlgorithmState.documentIdInput) {
    homeAlgorithmState.documentIdInput.focus();
    return;
  }

  if (field === HOME_ALGO_STEP4_FIELDS.email && homeAlgorithmState.emailInput) {
    homeAlgorithmState.emailInput.focus();
    return;
  }

  if (field === HOME_ALGO_STEP4_FIELDS.phone && homeAlgorithmState.phoneInput) {
    homeAlgorithmState.phoneInput.focus();
  }
}

function applyHomeAlgorithmFieldErrors(fields, { focusFirst = false } = {}) {
  const unique = [];
  (fields || []).forEach((field) => {
    if (!field || unique.includes(field)) return;
    unique.push(field);
  });

  clearHomeAlgorithmAllFieldErrors();
  unique.forEach((field) => markHomeAlgorithmFieldError(field));

  if (focusFirst && unique.length > 0) {
    focusHomeAlgorithmField(unique[0]);
  }
}

function sanitizeHomeAlgorithmAgeInput() {
  if (!homeAlgorithmState?.ageInput) return;
  const raw = String(homeAlgorithmState.ageInput.value || "").trim();
  if (raw === "") return;

  const age = Number.parseInt(raw, 10);
  if (!Number.isFinite(age)) {
    homeAlgorithmState.ageInput.value = "";
    return;
  }
  if (age < 0) {
    homeAlgorithmState.ageInput.value = "0";
    return;
  }
  if (age > 120) {
    homeAlgorithmState.ageInput.value = "120";
  }
}

function persistHomeAlgorithmDraft({ message = "" } = {}) {
  if (!homeAlgorithmState) return;

  const payload = {
    version: 1,
    currentStep: homeAlgorithmState.currentStep,
    maxUnlockedStep: homeAlgorithmState.maxUnlockedStep,
    step1Confirmed: homeAlgorithmState.step1Confirmed,
    step2Reviewed: homeAlgorithmState.step2Reviewed,
    step3Reviewed: homeAlgorithmState.step3Reviewed,
    finalized: homeAlgorithmState.finalized,
    finalStep: homeAlgorithmState.finalStep,
    interview: homeAlgorithmState.interview,
  };

  const saved = safeLocalStorageSetJson(HOME_ALGO_STORAGE_KEY, payload);
  if (!homeAlgorithmState.saveStatus) return;

  if (message) {
    homeAlgorithmState.saveStatus.textContent = saved
      ? message
      : "No se pudo actualizar el borrador local.";
    return;
  }

  if (!saved) {
    homeAlgorithmState.saveStatus.textContent = "No se pudo actualizar el borrador local.";
  }
}

function setHomeAlgorithmStationInputs() {
  if (!homeAlgorithmState) return;

  if (homeAlgorithmState.stationInput) {
    homeAlgorithmState.stationInput.value = homeAlgorithmState.interview.stationName || "";
  }

  if (homeAlgorithmState.participantInput) {
    homeAlgorithmState.participantInput.value =
      homeAlgorithmState.interview.participantNumber || "";
  }

  if (homeAlgorithmState.deviceTimeInput) {
    if (homeAlgorithmState.interview.deviceTimestamp) {
      homeAlgorithmState.deviceTimeInput.value = formatHomeAlgorithmDeviceTimestamp(
        homeAlgorithmState.interview.deviceTimestamp,
        "",
      );
    } else if (homeAlgorithmFlowModalState.previewDeviceTimestamp && isAlgoFlowModalOpen()) {
      homeAlgorithmState.deviceTimeInput.value = formatHomeAlgorithmDeviceTimestamp(
        homeAlgorithmFlowModalState.previewDeviceTimestamp,
        "",
      );
    } else {
      homeAlgorithmState.deviceTimeInput.value = "";
    }
  }
}

function renderHomeAlgorithmSexOtherInput({ focus = false, lock = false } = {}) {
  if (!homeAlgorithmState) return;

  const isOtherSelected = homeAlgorithmState.interview.step1.sex === HOME_ALGO_SEX.OTHER;

  if (homeAlgorithmState.sexOtherWrap) {
    homeAlgorithmState.sexOtherWrap.hidden = !isOtherSelected;
  }

  if (homeAlgorithmState.sexOtherInput) {
    homeAlgorithmState.sexOtherInput.disabled = !isOtherSelected || lock;
    if (!isOtherSelected) {
      homeAlgorithmState.sexOtherInput.value = "";
    } else {
      homeAlgorithmState.sexOtherInput.value =
        homeAlgorithmState.interview.step1.sexOtherDetail || "";
      if (focus && !homeAlgorithmState.finalized) {
        homeAlgorithmState.sexOtherInput.focus();
      }
    }
  }
}

function hydrateHomeAlgorithmFormFromInterview() {
  if (!homeAlgorithmState) return;

  setHomeAlgorithmStationInputs();

  homeAlgorithmState.ageInput.value = Number.isFinite(homeAlgorithmState.interview.step1.age)
    ? String(homeAlgorithmState.interview.step1.age)
    : "";

  const selectedSex = homeAlgorithmState.interview.step1.sex;
  homeAlgorithmState.sexRadios.forEach((radio) => {
    radio.checked = String(radio.value || "") === selectedSex;
  });
  renderHomeAlgorithmSexOtherInput();

  homeAlgorithmState.step2Checks.forEach((input) => {
    const code = String(input.getAttribute("data-home-algo-step2-code") || "").trim();
    input.checked = homeAlgorithmState.interview.step2.exclusions.includes(code);
  });

  homeAlgorithmState.step3Checks.forEach((input) => {
    const code = String(input.getAttribute("data-home-algo-step3-code") || "").trim();
    input.checked = homeAlgorithmState.interview.step3.riskFlags.includes(code);
  });

  homeAlgorithmState.fullNameInput.value = homeAlgorithmState.interview.step4.fullName || "";
  homeAlgorithmState.documentIdInput.value = homeAlgorithmState.interview.step4.documentId || "";
  homeAlgorithmState.emailInput.value = homeAlgorithmState.interview.step4.email || "";
  homeAlgorithmState.phoneInput.value = homeAlgorithmState.interview.step4.phone || "";
}

function renderHomeAlgorithmStepper() {
  if (!homeAlgorithmState) return;

  homeAlgorithmState.stepButtons.forEach((button) => {
    const step = Number(button.dataset.homeAlgoStepTarget || "");
    if (!Number.isFinite(step)) return;

    const isCurrent = step === homeAlgorithmState.currentStep;
    const isComplete = step < homeAlgorithmState.currentStep;
    const isLocked = step > homeAlgorithmState.maxUnlockedStep;

    button.classList.toggle("is-current", isCurrent);
    button.classList.toggle("is-complete", isComplete);
    button.classList.toggle("is-locked", isLocked);
    button.disabled = isLocked;
    button.setAttribute("aria-disabled", String(isLocked));

    if (isCurrent) {
      button.setAttribute("aria-current", "step");
    } else {
      button.removeAttribute("aria-current");
    }
  });
}

function renderHomeAlgorithmPanels() {
  if (!homeAlgorithmState) return;
  homeAlgorithmState.stepPanels.forEach((panel) => {
    const step = Number(panel.dataset.homeAlgoStepPanel || "");
    const isCurrent = step === homeAlgorithmState.currentStep;
    const wasHidden = panel.hidden;
    panel.hidden = !isCurrent;

    if (!isCurrent) {
      panel.classList.remove("is-step-entering");
      updateHomeAlgorithmPanelOverflowHints(panel);
      return;
    }

    if (wasHidden && !userPrefersReducedMotion()) {
      panel.classList.remove("is-step-entering");
      // Restart animation only when switching panel.
      void panel.offsetWidth;
      panel.classList.add("is-step-entering");
      window.setTimeout(() => {
        panel.classList.remove("is-step-entering");
      }, HOME_ALGO_UI_TRANSITION_MS);
    }

    updateHomeAlgorithmPanelOverflowHints(panel);
  });
}

function renderHomeAlgorithmStatusChip() {
  if (!homeAlgorithmState?.statusChip) return;

  if (homeAlgorithmState.finalized && homeAlgorithmState.interview.outcome) {
    const outcomeText = getHomeAlgorithmOutcomeText(homeAlgorithmState.interview.outcome);
    homeAlgorithmState.statusChip.textContent = "";

    const label = document.createElement("span");
    label.className = "home-algo__status-label";
    label.textContent = "Resultado final";

    const value = document.createElement("span");
    value.className = "home-algo__status-value";
    value.textContent = outcomeText;

    homeAlgorithmState.statusChip.append(label, value);
    homeAlgorithmState.statusChip.dataset.state = "final";
    return;
  }

  homeAlgorithmState.statusChip.textContent = `Paso ${homeAlgorithmState.currentStep} de 4 · Entrevista en curso`;
  homeAlgorithmState.statusChip.dataset.state = "active";
}

function renderHomeAlgorithmStep1State() {
  if (!homeAlgorithmState) return;

  const includedByAge = Boolean(homeAlgorithmState.interview.step1.includedByAge);
  const wasConfirmed = homeAlgorithmState.step1Confirmed;

  homeAlgorithmState.step1Stop.hidden = true;
  homeAlgorithmState.step1Ok.hidden = true;
  homeAlgorithmState.step1Confirm.hidden = true;
  homeAlgorithmState.step1Edit.hidden = true;
  homeAlgorithmState.step1Finish.hidden = true;
  homeAlgorithmState.step1Continue.hidden = true;

  if (!wasConfirmed) {
    homeAlgorithmState.step1Confirm.hidden = false;
    setHomeAlgorithmFeedback(
      homeAlgorithmState.step1Feedback,
      "Completá los datos para confirmar el Paso 1.",
      "neutral",
    );
    return;
  }

  if (includedByAge) {
    homeAlgorithmState.step1Ok.hidden = false;
    homeAlgorithmState.step1Edit.hidden = false;
    homeAlgorithmState.step1Continue.hidden = false;
    setHomeAlgorithmFeedback(
      homeAlgorithmState.step1Feedback,
      "Cumple criterio por edad. Podés continuar al Paso 2.",
      "success",
    );
    return;
  }

  homeAlgorithmState.step1Stop.hidden = false;
  homeAlgorithmState.step1Edit.hidden = false;
  homeAlgorithmState.step1Finish.hidden = false;
  setHomeAlgorithmFeedback(
    homeAlgorithmState.step1Feedback,
    "No incluye por edad. Podés editar o finalizar entrevista.",
    "danger",
  );
}

function renderHomeAlgorithmStep2State() {
  if (!homeAlgorithmState) return;

  homeAlgorithmState.step2Stop.hidden = true;
  homeAlgorithmState.step2Ok.hidden = true;
  homeAlgorithmState.step2Evaluate.hidden = true;
  homeAlgorithmState.step2Edit.hidden = true;
  homeAlgorithmState.step2Finish.hidden = true;
  homeAlgorithmState.step2Continue.hidden = true;
  homeAlgorithmState.step2Back.hidden = true;

  if (!homeAlgorithmState.step2Reviewed) {
    homeAlgorithmState.step2Evaluate.hidden = false;
    homeAlgorithmState.step2Back.hidden = false;
    setHomeAlgorithmFeedback(
      homeAlgorithmState.step2Feedback,
      "Revisá los criterios y confirmá el Paso 2.",
      "neutral",
    );
    return;
  }

  if (homeAlgorithmState.interview.step2.hasExclusion) {
    homeAlgorithmState.step2Stop.hidden = false;
    homeAlgorithmState.step2Edit.hidden = false;
    homeAlgorithmState.step2Finish.hidden = false;
    homeAlgorithmState.step2Back.hidden = false;
    setHomeAlgorithmFeedback(
      homeAlgorithmState.step2Feedback,
      "Criterio de exclusión detectado. La persona no es candidata a screening poblacional. Recomendación: consulta médica.",
      "danger",
    );
    return;
  }

  homeAlgorithmState.step2Ok.hidden = false;
  homeAlgorithmState.step2Edit.hidden = false;
  homeAlgorithmState.step2Continue.hidden = false;
  homeAlgorithmState.step2Back.hidden = false;
  setHomeAlgorithmFeedback(
    homeAlgorithmState.step2Feedback,
    "Sin criterios de exclusión. Podés continuar.",
    "success",
  );
}

function renderHomeAlgorithmStep3State() {
  if (!homeAlgorithmState) return;

  homeAlgorithmState.step3Stop.hidden = true;
  homeAlgorithmState.step3Ok.hidden = true;
  homeAlgorithmState.step3Evaluate.hidden = true;
  homeAlgorithmState.step3Edit.hidden = true;
  homeAlgorithmState.step3Finish.hidden = true;
  homeAlgorithmState.step3Continue.hidden = true;
  homeAlgorithmState.step3Back.hidden = true;

  if (!homeAlgorithmState.step3Reviewed) {
    homeAlgorithmState.step3Evaluate.hidden = false;
    homeAlgorithmState.step3Back.hidden = false;
    setHomeAlgorithmFeedback(
      homeAlgorithmState.step3Feedback,
      "Revisá los criterios y confirmá el Paso 3.",
      "neutral",
    );
    return;
  }

  if (homeAlgorithmState.interview.step3.hasHighRisk) {
    homeAlgorithmState.step3Stop.hidden = false;
    homeAlgorithmState.step3Edit.hidden = false;
    homeAlgorithmState.step3Finish.hidden = false;
    homeAlgorithmState.step3Back.hidden = false;
    setHomeAlgorithmFeedback(
      homeAlgorithmState.step3Feedback,
      "Riesgo aumentado. La persona no es candidata a screening poblacional. Recomendación: consulta médica.",
      "danger",
    );
    return;
  }

  homeAlgorithmState.step3Ok.hidden = false;
  homeAlgorithmState.step3Edit.hidden = false;
  homeAlgorithmState.step3Continue.hidden = false;
  homeAlgorithmState.step3Back.hidden = false;
  setHomeAlgorithmFeedback(
    homeAlgorithmState.step3Feedback,
    "Riesgo promedio. Candidata/o a Test FIT. Podés continuar a Datos de contacto.",
    "success",
  );
}

function renderHomeAlgorithmStep4State() {
  if (!homeAlgorithmState) return;
  homeAlgorithmState.step4Back.hidden = false;
  homeAlgorithmState.step4Edit.hidden = false;
}

function renderHomeAlgorithmActionHierarchy() {
  if (!homeAlgorithmState) return;

  const continueButtons = [
    { button: homeAlgorithmState.step1Continue, label: "Continuar a paso 2" },
    { button: homeAlgorithmState.step2Continue, label: "Continuar a paso 3" },
    { button: homeAlgorithmState.step3Continue, label: "Continuar a paso 4" },
  ];

  continueButtons.forEach(({ button, label }) => {
    if (!button) return;
    button.className = HOME_ALGO_CONTINUE_BUTTON_CLASS;
    button.innerHTML = `${label} <i class="fa-solid fa-arrow-right ms-2" aria-hidden="true"></i>`;
  });

  [
    homeAlgorithmState.step1Confirm,
    homeAlgorithmState.step2Evaluate,
    homeAlgorithmState.step3Evaluate,
    homeAlgorithmState.step1Finish,
    homeAlgorithmState.step2Finish,
    homeAlgorithmState.step3Finish,
    homeAlgorithmState.step4Finish,
  ].forEach((button) => {
    if (!button) return;
    button.className = HOME_ALGO_PRIMARY_BUTTON_CLASS;
  });

  [
    homeAlgorithmState.step1Edit,
    homeAlgorithmState.step2Edit,
    homeAlgorithmState.step3Edit,
    homeAlgorithmState.step4Edit,
    homeAlgorithmState.step2Back,
    homeAlgorithmState.step3Back,
    homeAlgorithmState.step4Back,
    homeAlgorithmState.restartBtn,
  ].forEach((button) => {
    if (!button) return;
    button.className = HOME_ALGO_SECONDARY_BUTTON_CLASS;
  });
}

function renderHomeAlgorithmStepLocks() {
  if (!homeAlgorithmState) return;

  const lockStep1 =
    homeAlgorithmState.finalized ||
    homeAlgorithmState.currentStep !== ALGORITHM_HOME.steps.AGE ||
    homeAlgorithmState.step1Confirmed;
  const lockStep2 =
    homeAlgorithmState.finalized ||
    homeAlgorithmState.currentStep !== ALGORITHM_HOME.steps.VIGILANCE ||
    homeAlgorithmState.step2Reviewed;
  const lockStep3 =
    homeAlgorithmState.finalized ||
    homeAlgorithmState.currentStep !== ALGORITHM_HOME.steps.RISK ||
    homeAlgorithmState.step3Reviewed;
  const lockStep4 =
    homeAlgorithmState.finalized ||
    homeAlgorithmState.currentStep !== ALGORITHM_HOME.steps.DECISION;

  homeAlgorithmState.ageInput.disabled = lockStep1;
  homeAlgorithmState.sexRadios.forEach((radio) => {
    radio.disabled = lockStep1;
  });
  renderHomeAlgorithmSexOtherInput({ lock: lockStep1 });

  homeAlgorithmState.step1Confirm.disabled = lockStep1;

  homeAlgorithmState.step2Checks.forEach((input) => {
    input.disabled = lockStep2;
  });
  homeAlgorithmState.step2Evaluate.disabled = lockStep2;

  homeAlgorithmState.step3Checks.forEach((input) => {
    input.disabled = lockStep3;
  });
  homeAlgorithmState.step3Evaluate.disabled = lockStep3;

  homeAlgorithmState.fullNameInput.disabled = lockStep4;
  homeAlgorithmState.documentIdInput.disabled = lockStep4;
  homeAlgorithmState.emailInput.disabled = lockStep4;
  homeAlgorithmState.phoneInput.disabled = lockStep4;
  homeAlgorithmState.step4Finish.disabled = lockStep4;
}

function renderHomeAlgorithm() {
  renderHomeAlgorithmActionHierarchy();
  renderHomeAlgorithmStepper();
  renderHomeAlgorithmPanels();
  renderHomeAlgorithmStatusChip();
  renderHomeAlgorithmStep1State();
  renderHomeAlgorithmStep2State();
  renderHomeAlgorithmStep3State();
  renderHomeAlgorithmStep4State();
  renderHomeAlgorithmStepLocks();
  mountHomeAlgorithmFlowStatus();
  mountHomeAlgorithmRestartAction();
  refreshHomeAlgorithmOverflowHints();
}

function goToHomeAlgorithmStep(step) {
  if (!homeAlgorithmState) return;
  const targetStep = Number(step);
  if (!Number.isFinite(targetStep)) return;

  const bounded = Math.min(
    Math.max(targetStep, ALGORITHM_HOME.steps.AGE),
    ALGORITHM_HOME.steps.DECISION,
  );
  homeAlgorithmState.currentStep = Math.min(bounded, homeAlgorithmState.maxUnlockedStep);
  renderHomeAlgorithm();
  persistHomeAlgorithmDraft();
}

function syncHomeAlgorithmStationFromBridge({ force = false } = {}) {
  if (!homeAlgorithmState) return;

  const station = resolveHomeAlgorithmStationFromBridge();
  if (!station.stationId && !station.stationName) return;

  const canMutateStation =
    force ||
    (!homeAlgorithmState.step1Confirmed &&
      homeAlgorithmState.maxUnlockedStep === ALGORITHM_HOME.steps.AGE &&
      !homeAlgorithmState.finalized);

  if (!canMutateStation) return;

  homeAlgorithmState.interview.stationId = station.stationId;
  homeAlgorithmState.interview.stationName = station.stationName;

  if (!homeAlgorithmState.interview.participantNumber || force) {
    homeAlgorithmState.interview.participantNumber = reserveHomeAlgorithmParticipantNumber(
      station.stationId,
      station.stationName,
    );
  }

  setHomeAlgorithmStationInputs();
  persistHomeAlgorithmDraft();
}

function getHomeAlgorithmStep1Values() {
  if (!homeAlgorithmState) {
    return { ok: false, message: "No se pudo iniciar el Paso 1." };
  }

  const invalidFields = [];

  const stationName = String(homeAlgorithmState.interview.stationName || "").trim();
  const stationId = String(homeAlgorithmState.interview.stationId || "").trim();
  if (!stationName || !stationId) {
    invalidFields.push(HOME_ALGO_STEP1_FIELDS.station);
  }

  const ageRaw = String(homeAlgorithmState.ageInput.value || "").trim();
  const age = Number.parseInt(ageRaw, 10);
  if (ageRaw === "" || !Number.isFinite(age) || age < 0 || age > 120) {
    invalidFields.push(HOME_ALGO_STEP1_FIELDS.age);
  }

  const sex = String(
    homeAlgorithmState.sexRadios.find((radio) => radio.checked)?.value || "",
  )
    .trim()
    .toUpperCase();
  if (
    !(
      sex === HOME_ALGO_SEX.MALE ||
      sex === HOME_ALGO_SEX.FEMALE ||
      sex === HOME_ALGO_SEX.OTHER
    )
  ) {
    invalidFields.push(HOME_ALGO_STEP1_FIELDS.sex);
  }

  const sexOtherDetail = String(homeAlgorithmState.sexOtherInput?.value || "").trim();
  if (sex === HOME_ALGO_SEX.OTHER && !sexOtherDetail) {
    invalidFields.push(HOME_ALGO_STEP1_FIELDS.sexOther);
  }

  if (invalidFields.length > 0) {
    return {
      ok: false,
      message:
        sex === HOME_ALGO_SEX.OTHER
          ? "Si seleccionás \"Otro\", debés especificarlo antes de confirmar."
          : "Completá edad y sexo válidos para confirmar el Paso 1.",
      invalidFields,
    };
  }

  return {
    ok: true,
    values: {
      stationName,
      stationId,
      age,
      sex,
      sexOtherDetail,
    },
  };
}

function getHomeAlgorithmParticipantId() {
  if (!homeAlgorithmState) return "";
  return String(
    homeAlgorithmState.participantInput?.value ||
      homeAlgorithmState.interview.participantNumber ||
      "",
  ).trim();
}

function resetInterviewState() {
  interviewState = {
    step1: {},
    step2: {},
    step3: {},
    step4: {},
    status: "pending",
  };
}

function syncInterviewStateFromInterview({ status = interviewState.status } = {}) {
  if (!homeAlgorithmState) return;

  interviewState = {
    step1: {
      age: homeAlgorithmState.interview.step1.age ?? null,
      sex: homeAlgorithmState.interview.step1.sex || "",
      sexOtherDetail: homeAlgorithmState.interview.step1.sexOtherDetail || "",
      includedByAge: Boolean(homeAlgorithmState.interview.step1.includedByAge),
      stationId: homeAlgorithmState.interview.stationId || "",
      stationName: homeAlgorithmState.interview.stationName || "",
      deviceTimestamp: homeAlgorithmState.interview.deviceTimestamp || "",
    },
    step2: {
      exclusions: Array.isArray(homeAlgorithmState.interview.step2.exclusions)
        ? [...homeAlgorithmState.interview.step2.exclusions]
        : [],
      hasExclusion: Boolean(homeAlgorithmState.interview.step2.hasExclusion),
    },
    step3: {
      riskFlags: Array.isArray(homeAlgorithmState.interview.step3.riskFlags)
        ? [...homeAlgorithmState.interview.step3.riskFlags]
        : [],
      hasHighRisk: Boolean(homeAlgorithmState.interview.step3.hasHighRisk),
    },
    step4: {
      fullName: homeAlgorithmState.interview.step4.fullName || "",
      documentId: homeAlgorithmState.interview.step4.documentId || "",
      email: homeAlgorithmState.interview.step4.email || "",
      phone: homeAlgorithmState.interview.step4.phone || "",
    },
    status,
  };
}

function clearInterviewAfterStep1() {
  if (!homeAlgorithmState) return;
  homeAlgorithmState.step2Reviewed = false;
  homeAlgorithmState.step3Reviewed = false;
  homeAlgorithmState.interview.step2 = { exclusions: [], hasExclusion: false };
  homeAlgorithmState.interview.step3 = { riskFlags: [], hasHighRisk: false };
  homeAlgorithmState.interview.step4 = {
    fullName: "",
    documentId: "",
    email: "",
    phone: "",
  };
  homeAlgorithmState.step2Checks.forEach((input) => {
    input.checked = false;
  });
  homeAlgorithmState.step3Checks.forEach((input) => {
    input.checked = false;
  });
  homeAlgorithmState.fullNameInput.value = "";
  homeAlgorithmState.documentIdInput.value = "";
  homeAlgorithmState.emailInput.value = "";
  homeAlgorithmState.phoneInput.value = "";
  syncInterviewStateFromInterview();
}

function clearInterviewAfterStep2() {
  if (!homeAlgorithmState) return;
  homeAlgorithmState.step3Reviewed = false;
  homeAlgorithmState.interview.step3 = { riskFlags: [], hasHighRisk: false };
  homeAlgorithmState.interview.step4 = {
    fullName: "",
    documentId: "",
    email: "",
    phone: "",
  };
  homeAlgorithmState.step3Checks.forEach((input) => {
    input.checked = false;
  });
  homeAlgorithmState.fullNameInput.value = "";
  homeAlgorithmState.documentIdInput.value = "";
  homeAlgorithmState.emailInput.value = "";
  homeAlgorithmState.phoneInput.value = "";
  syncInterviewStateFromInterview();
}

function clearInterviewAfterStep3() {
  if (!homeAlgorithmState) return;
  homeAlgorithmState.interview.step4 = {
    fullName: "",
    documentId: "",
    email: "",
    phone: "",
  };
  homeAlgorithmState.fullNameInput.value = "";
  homeAlgorithmState.documentIdInput.value = "";
  homeAlgorithmState.emailInput.value = "";
  homeAlgorithmState.phoneInput.value = "";
  syncInterviewStateFromInterview();
}

function getFinalResultLabel(outcome) {
  if (outcome === HOME_ALGO_OUTCOME.AGE_EXCLUDED) return "Excluido por edad";
  if (outcome === HOME_ALGO_OUTCOME.ACTIVE_SURVEILLANCE_EXCLUDED) return "Excluido Paso 2";
  if (outcome === HOME_ALGO_OUTCOME.HIGH_RISK_REFERRAL) return "Excluido Paso 3";
  if (outcome === HOME_ALGO_OUTCOME.FIT_CANDIDATE) return "Candidato a Test FIT";
  return getHomeAlgorithmOutcomeText(outcome);
}

async function saveHomeAlgorithmInterview(finalResult) {
  const participantId = getHomeAlgorithmParticipantId();
  if (!participantId) {
    return { ok: false, error: new Error("participantId vacío.") };
  }

  syncInterviewStateFromInterview({ status: "submitting" });

  const selectedStep2Items = getHomeAlgorithmCodeItems(
    interviewState.step2.exclusions,
    homeAlgorithmState?.step2Labels || new Map(),
  );
  const selectedStep3Items = getHomeAlgorithmCodeItems(
    interviewState.step3.riskFlags,
    homeAlgorithmState?.step3Labels || new Map(),
  );

  const step1ResultText = interviewState.step1.includedByAge
    ? "Cumple criterio por edad"
    : "No incluye por edad";

  const reachedStep2 =
    homeAlgorithmState &&
    (homeAlgorithmState.step2Reviewed ||
      homeAlgorithmState.maxUnlockedStep >= ALGORITHM_HOME.steps.VIGILANCE);
  const reachedStep3 =
    homeAlgorithmState &&
    (homeAlgorithmState.step3Reviewed ||
      homeAlgorithmState.maxUnlockedStep >= ALGORITHM_HOME.steps.RISK);
  const reachedStep4 =
    homeAlgorithmState && homeAlgorithmState.maxUnlockedStep >= ALGORITHM_HOME.steps.DECISION;

  const payload = {
    participantId,
    stationId: interviewState.step1.stationId,
    timestamp: homeAlgorithmState?.interview?.deviceTimestamp || new Date().toISOString(),
    finalResult: String(finalResult || "").trim(),
    step1Data: {
      age: interviewState.step1.age,
      sex: interviewState.step1.sex,
      result: step1ResultText,
    },
    step2Data: reachedStep2
      ? {
          excluded: Boolean(interviewState.step2.hasExclusion),
          details: selectedStep2Items.join(" | "),
        }
      : null,
    step3Data: reachedStep3
      ? {
          risk: Boolean(interviewState.step3.hasHighRisk),
          details: selectedStep3Items.join(" | "),
        }
      : null,
    step4Data: reachedStep4
      ? {
          name: interviewState.step4.fullName,
          dni: interviewState.step4.documentId,
          email: interviewState.step4.email,
          phone: interviewState.step4.phone,
        }
      : null,
  };

  console.log("🟡 Enviando entrevista final:", payload);

  try {
    const response = await fetch(HOME_ALGO_STAGE1_SUBMIT_URL, {
      method: "POST",
      mode: "cors",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    const rawBody = await response.text();
    let parsedBody = rawBody;
    try {
      parsedBody = rawBody ? JSON.parse(rawBody) : {};
    } catch (_error) {
      parsedBody = rawBody;
    }

    console.log("🟢 Respuesta guardado final:", {
      ok: response.ok,
      status: response.status,
      body: parsedBody,
    });

    if (!response.ok) {
      const message =
        (parsedBody && typeof parsedBody === "object" && parsedBody.message) ||
        `HTTP ${response.status}`;
      interviewState.status = "error";
      return { ok: false, error: new Error(String(message)) };
    }

    interviewState.status = "saved";
    return { ok: true, body: parsedBody };
  } catch (error) {
    interviewState.status = "error";
    console.error("❌ Error guardando entrevista final:", error);
    return { ok: false, error };
  }
}

async function finalizeAndPersistHomeInterview(
  outcome,
  finalStep,
  feedbackElement,
  triggerButton = null,
) {
  const finalResult = getFinalResultLabel(outcome);
  const loadingButton =
    triggerButton instanceof HTMLButtonElement ? triggerButton : null;
  if (loadingButton) {
    setHomeAlgorithmButtonLoading(loadingButton, { loading: true, label: "Guardando..." });
  }
  if (feedbackElement) {
    setHomeAlgorithmFeedback(feedbackElement, "Guardando entrevista final...", "neutral");
  }

  const result = await saveHomeAlgorithmInterview(finalResult);
  if (!result.ok) {
    const message =
      result.error instanceof Error ? result.error.message : "No se pudo guardar la entrevista.";
    if (feedbackElement) {
      setHomeAlgorithmFeedback(feedbackElement, `Error al guardar: ${message}`, "danger");
    }
    if (loadingButton) {
      setHomeAlgorithmButtonLoading(loadingButton, { loading: false });
    }
    return;
  }

  if (feedbackElement) {
    setHomeAlgorithmFeedback(
      feedbackElement,
      "Entrevista guardada correctamente.",
      "success",
    );
  }

  if (loadingButton) {
    setHomeAlgorithmButtonLoading(loadingButton, { loading: false });
  }

  openHomeAlgorithmCompletionDialog({
    message: "La entrevista se registró correctamente en la base de datos.",
  });
}

function onHomeAlgorithmConfirmStep1() {
  if (!homeAlgorithmState || homeAlgorithmState.finalized) return;

  sanitizeHomeAlgorithmAgeInput();
  clearHomeAlgorithmAllFieldErrors();

  const result = getHomeAlgorithmStep1Values();
  if (!result.ok) {
    applyHomeAlgorithmFieldErrors(result.invalidFields, { focusFirst: true });
    setHomeAlgorithmFeedback(homeAlgorithmState.step1Feedback, result.message, "danger");
    return;
  }

  const confirmedAt = new Date();
  const confirmedAtIso = confirmedAt.toISOString();
  const confirmedAtDisplay = formatHomeAlgorithmDeviceTimestamp(confirmedAtIso, "");
  stopAlgoFlowDeviceClockPreview();

  homeAlgorithmState.interview.stationId = result.values.stationId;
  homeAlgorithmState.interview.stationName = result.values.stationName;
  homeAlgorithmState.interview.deviceTimestamp = confirmedAtIso;
  homeAlgorithmState.interview.step1.age = result.values.age;
  homeAlgorithmState.interview.step1.sex = result.values.sex;
  homeAlgorithmState.interview.step1.sexOtherDetail =
    result.values.sex === HOME_ALGO_SEX.OTHER ? result.values.sexOtherDetail : "";
  homeAlgorithmState.interview.step1.includedByAge = result.values.age >= ALGORITHM_HOME.minAge;
  syncInterviewStateFromInterview({ status: "pending" });

  if (homeAlgorithmState.deviceTimeInput) {
    homeAlgorithmState.deviceTimeInput.value = confirmedAtDisplay;
  }

  homeAlgorithmState.step1Confirmed = true;
  homeAlgorithmState.currentStep = ALGORITHM_HOME.steps.AGE;

  if (!homeAlgorithmState.interview.step1.includedByAge) {
    clearInterviewAfterStep1();
  }

  setHomeAlgorithmStationInputs();
  renderHomeAlgorithm();
  persistHomeAlgorithmDraft({ message: "Paso 1 confirmado y guardado en borrador local." });
}

async function onHomeAlgorithmFinishStep1() {
  if (!homeAlgorithmState || homeAlgorithmState.finalized) return;
  if (!homeAlgorithmState.step1Confirmed) return;
  if (homeAlgorithmState.interview.step1.includedByAge) return;
  await finalizeAndPersistHomeInterview(
    HOME_ALGO_OUTCOME.AGE_EXCLUDED,
    ALGORITHM_HOME.steps.AGE,
    homeAlgorithmState.step1Feedback,
    homeAlgorithmState.step1Finish,
  );
}

function onHomeAlgorithmContinueStep1() {
  if (!homeAlgorithmState || homeAlgorithmState.finalized) return;
  if (!homeAlgorithmState.step1Confirmed) return;
  if (!homeAlgorithmState.interview.step1.includedByAge) return;

  homeAlgorithmState.maxUnlockedStep = Math.max(
    homeAlgorithmState.maxUnlockedStep,
    ALGORITHM_HOME.steps.VIGILANCE,
  );
  homeAlgorithmState.currentStep = ALGORITHM_HOME.steps.VIGILANCE;

  renderHomeAlgorithm();
  persistHomeAlgorithmDraft({ message: "Paso 1 completado. Continuá con Paso 2." });
}

function onHomeAlgorithmEditStep1() {
  if (!homeAlgorithmState || homeAlgorithmState.finalized) return;

  clearAlgoFlowModalAutoCloseTimer();
  homeAlgorithmState.step1Confirmed = false;
  homeAlgorithmState.currentStep = ALGORITHM_HOME.steps.AGE;
  homeAlgorithmState.maxUnlockedStep = ALGORITHM_HOME.steps.AGE;
  homeAlgorithmState.interview.deviceTimestamp = "";
  clearInterviewAfterStep1();

  renderHomeAlgorithm();
  startAlgoFlowDeviceClockPreview();
  persistHomeAlgorithmDraft({ message: "Paso 1 habilitado para edición." });
}

function onHomeAlgorithmStep2Changed() {
  if (!homeAlgorithmState || homeAlgorithmState.finalized) return;

  const exclusions = getHomeAlgorithmCodesFromInputs(
    homeAlgorithmState.step2Checks,
    "data-home-algo-step2-code",
  );
  homeAlgorithmState.interview.step2.exclusions = exclusions;
  homeAlgorithmState.interview.step2.hasExclusion = exclusions.length > 0;
  homeAlgorithmState.step2Reviewed = false;
  homeAlgorithmState.step3Reviewed = false;
  homeAlgorithmState.maxUnlockedStep = Math.min(
    homeAlgorithmState.maxUnlockedStep,
    ALGORITHM_HOME.steps.VIGILANCE,
  );
  homeAlgorithmState.currentStep = ALGORITHM_HOME.steps.VIGILANCE;
  clearInterviewAfterStep2();

  setHomeAlgorithmFeedback(
    homeAlgorithmState.step2Feedback,
    "Cambios detectados. Presioná Confirmar paso 2.",
    "neutral",
  );
  renderHomeAlgorithm();
  persistHomeAlgorithmDraft();
}

function onHomeAlgorithmEvaluateStep2() {
  if (!homeAlgorithmState || homeAlgorithmState.finalized) return;
  if (homeAlgorithmState.maxUnlockedStep < ALGORITHM_HOME.steps.VIGILANCE) return;

  const exclusions = getHomeAlgorithmCodesFromInputs(
    homeAlgorithmState.step2Checks,
    "data-home-algo-step2-code",
  );
  homeAlgorithmState.interview.step2.exclusions = exclusions;
  homeAlgorithmState.interview.step2.hasExclusion = exclusions.length > 0;
  homeAlgorithmState.step2Reviewed = true;
  syncInterviewStateFromInterview({ status: "pending" });

  renderHomeAlgorithm();
  persistHomeAlgorithmDraft({ message: "Paso 2 evaluado y guardado en borrador local." });
}

async function onHomeAlgorithmFinishStep2() {
  if (!homeAlgorithmState || homeAlgorithmState.finalized) return;
  if (!homeAlgorithmState.step2Reviewed) return;
  if (!homeAlgorithmState.interview.step2.hasExclusion) return;

  await finalizeAndPersistHomeInterview(
    HOME_ALGO_OUTCOME.ACTIVE_SURVEILLANCE_EXCLUDED,
    ALGORITHM_HOME.steps.VIGILANCE,
    homeAlgorithmState.step2Feedback,
    homeAlgorithmState.step2Finish,
  );
}

function onHomeAlgorithmContinueStep2() {
  if (!homeAlgorithmState || homeAlgorithmState.finalized) return;
  if (!homeAlgorithmState.step2Reviewed) return;
  if (homeAlgorithmState.interview.step2.hasExclusion) return;

  homeAlgorithmState.maxUnlockedStep = Math.max(
    homeAlgorithmState.maxUnlockedStep,
    ALGORITHM_HOME.steps.RISK,
  );
  homeAlgorithmState.currentStep = ALGORITHM_HOME.steps.RISK;

  renderHomeAlgorithm();
  persistHomeAlgorithmDraft({ message: "Paso 2 completado. Continuá con Paso 3." });
}

function onHomeAlgorithmEditStep2() {
  if (!homeAlgorithmState || homeAlgorithmState.finalized) return;
  homeAlgorithmState.step2Reviewed = false;
  homeAlgorithmState.currentStep = ALGORITHM_HOME.steps.VIGILANCE;
  homeAlgorithmState.maxUnlockedStep = Math.min(
    homeAlgorithmState.maxUnlockedStep,
    ALGORITHM_HOME.steps.VIGILANCE,
  );
  clearInterviewAfterStep2();
  renderHomeAlgorithm();
  persistHomeAlgorithmDraft({ message: "Paso 2 habilitado para edición." });
}

function onHomeAlgorithmBackToStep1() {
  if (!homeAlgorithmState || homeAlgorithmState.finalized) return;
  goToHomeAlgorithmStep(ALGORITHM_HOME.steps.AGE);
}

function onHomeAlgorithmStep3Changed() {
  if (!homeAlgorithmState || homeAlgorithmState.finalized) return;

  const riskFlags = getHomeAlgorithmCodesFromInputs(
    homeAlgorithmState.step3Checks,
    "data-home-algo-step3-code",
  );
  homeAlgorithmState.interview.step3.riskFlags = riskFlags;
  homeAlgorithmState.interview.step3.hasHighRisk = riskFlags.length > 0;
  homeAlgorithmState.step3Reviewed = false;
  homeAlgorithmState.maxUnlockedStep = Math.min(
    homeAlgorithmState.maxUnlockedStep,
    ALGORITHM_HOME.steps.RISK,
  );
  homeAlgorithmState.currentStep = ALGORITHM_HOME.steps.RISK;
  clearInterviewAfterStep3();

  setHomeAlgorithmFeedback(
    homeAlgorithmState.step3Feedback,
    "Cambios detectados. Presioná Confirmar paso 3.",
    "neutral",
  );
  renderHomeAlgorithm();
  persistHomeAlgorithmDraft();
}

function onHomeAlgorithmEvaluateStep3() {
  if (!homeAlgorithmState || homeAlgorithmState.finalized) return;
  if (homeAlgorithmState.maxUnlockedStep < ALGORITHM_HOME.steps.RISK) return;

  const riskFlags = getHomeAlgorithmCodesFromInputs(
    homeAlgorithmState.step3Checks,
    "data-home-algo-step3-code",
  );
  homeAlgorithmState.interview.step3.riskFlags = riskFlags;
  homeAlgorithmState.interview.step3.hasHighRisk = riskFlags.length > 0;
  homeAlgorithmState.step3Reviewed = true;
  syncInterviewStateFromInterview({ status: "pending" });

  renderHomeAlgorithm();
  persistHomeAlgorithmDraft({ message: "Paso 3 evaluado y guardado en borrador local." });
}

async function onHomeAlgorithmFinishStep3() {
  if (!homeAlgorithmState || homeAlgorithmState.finalized) return;
  if (!homeAlgorithmState.step3Reviewed) return;
  if (!homeAlgorithmState.interview.step3.hasHighRisk) return;

  await finalizeAndPersistHomeInterview(
    HOME_ALGO_OUTCOME.HIGH_RISK_REFERRAL,
    ALGORITHM_HOME.steps.RISK,
    homeAlgorithmState.step3Feedback,
    homeAlgorithmState.step3Finish,
  );
}

function onHomeAlgorithmContinueStep3() {
  if (!homeAlgorithmState || homeAlgorithmState.finalized) return;
  if (!homeAlgorithmState.step3Reviewed) return;
  if (homeAlgorithmState.interview.step3.hasHighRisk) return;

  homeAlgorithmState.maxUnlockedStep = Math.max(
    homeAlgorithmState.maxUnlockedStep,
    ALGORITHM_HOME.steps.DECISION,
  );
  homeAlgorithmState.currentStep = ALGORITHM_HOME.steps.DECISION;

  renderHomeAlgorithm();
  persistHomeAlgorithmDraft({ message: "Paso 3 completado. Continuá con Paso 4." });
}

function onHomeAlgorithmEditStep3() {
  if (!homeAlgorithmState || homeAlgorithmState.finalized) return;
  homeAlgorithmState.step3Reviewed = false;
  homeAlgorithmState.currentStep = ALGORITHM_HOME.steps.RISK;
  homeAlgorithmState.maxUnlockedStep = Math.min(
    homeAlgorithmState.maxUnlockedStep,
    ALGORITHM_HOME.steps.RISK,
  );
  clearInterviewAfterStep3();
  renderHomeAlgorithm();
  persistHomeAlgorithmDraft({ message: "Paso 3 habilitado para edición." });
}

function onHomeAlgorithmBackToStep2() {
  if (!homeAlgorithmState || homeAlgorithmState.finalized) return;
  goToHomeAlgorithmStep(ALGORITHM_HOME.steps.VIGILANCE);
}

function getHomeAlgorithmStep4Values() {
  if (!homeAlgorithmState) {
    return { ok: false, message: "No se pudo iniciar Paso 4." };
  }

  const fullName = String(homeAlgorithmState.fullNameInput.value || "").trim();
  const documentId = String(homeAlgorithmState.documentIdInput.value || "").trim();
  const email = String(homeAlgorithmState.emailInput.value || "").trim();
  const phone = String(homeAlgorithmState.phoneInput.value || "").trim();

  const invalidFields = [];

  if (!fullName) invalidFields.push(HOME_ALGO_STEP4_FIELDS.fullName);
  if (!documentId) invalidFields.push(HOME_ALGO_STEP4_FIELDS.documentId);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) invalidFields.push(HOME_ALGO_STEP4_FIELDS.email);
  if (!phone) invalidFields.push(HOME_ALGO_STEP4_FIELDS.phone);

  if (invalidFields.length > 0) {
    return {
      ok: false,
      message: "Completá todos los datos de contacto obligatorios.",
      invalidFields,
    };
  }

  return {
    ok: true,
    values: {
      fullName,
      documentId,
      email,
      phone,
    },
  };
}

function onHomeAlgorithmStep4InputChanged() {
  if (!homeAlgorithmState || homeAlgorithmState.finalized) return;

  homeAlgorithmState.interview.step4.fullName = String(
    homeAlgorithmState.fullNameInput.value || "",
  ).trim();
  homeAlgorithmState.interview.step4.documentId = String(
    homeAlgorithmState.documentIdInput.value || "",
  ).trim();
  homeAlgorithmState.interview.step4.email = String(
    homeAlgorithmState.emailInput.value || "",
  ).trim();
  homeAlgorithmState.interview.step4.phone = String(
    homeAlgorithmState.phoneInput.value || "",
  ).trim();

  clearHomeAlgorithmFieldError(HOME_ALGO_STEP4_FIELDS.fullName);
  clearHomeAlgorithmFieldError(HOME_ALGO_STEP4_FIELDS.documentId);
  clearHomeAlgorithmFieldError(HOME_ALGO_STEP4_FIELDS.email);
  clearHomeAlgorithmFieldError(HOME_ALGO_STEP4_FIELDS.phone);

  setHomeAlgorithmFeedback(
    homeAlgorithmState.step4Feedback,
    "Completá los datos de contacto para cerrar como candidato FIT.",
    "neutral",
  );

  syncInterviewStateFromInterview({ status: "pending" });
  persistHomeAlgorithmDraft();
}

async function onHomeAlgorithmFinishStep4() {
  if (!homeAlgorithmState || homeAlgorithmState.finalized) return;

  clearHomeAlgorithmAllFieldErrors();
  const result = getHomeAlgorithmStep4Values();
  if (!result.ok) {
    applyHomeAlgorithmFieldErrors(result.invalidFields, { focusFirst: true });
    setHomeAlgorithmFeedback(homeAlgorithmState.step4Feedback, result.message, "danger");
    return;
  }

  homeAlgorithmState.interview.step4 = {
    fullName: result.values.fullName,
    documentId: result.values.documentId,
    email: result.values.email,
    phone: result.values.phone,
  };
  syncInterviewStateFromInterview({ status: "pending" });
  await finalizeAndPersistHomeInterview(
    HOME_ALGO_OUTCOME.FIT_CANDIDATE,
    ALGORITHM_HOME.steps.DECISION,
    homeAlgorithmState.step4Feedback,
    homeAlgorithmState.step4Finish,
  );
}

function onHomeAlgorithmEditStep4() {
  if (!homeAlgorithmState || homeAlgorithmState.finalized) return;
  homeAlgorithmState.currentStep = ALGORITHM_HOME.steps.DECISION;
  homeAlgorithmState.fullNameInput.focus();
  renderHomeAlgorithm();
}

function onHomeAlgorithmBackToStep3() {
  if (!homeAlgorithmState || homeAlgorithmState.finalized) return;
  goToHomeAlgorithmStep(ALGORITHM_HOME.steps.RISK);
}

/* ----------------------------- Home Algorithm Flow Modal ----------------------------- */

function syncHomeAlgorithmFlowModalElements() {
  homeAlgorithmFlowModalState.modal = $("#ppccr-algo-modal");
  homeAlgorithmFlowModalState.card = $(".ppccr-modal__card", homeAlgorithmFlowModalState.modal || document);
  homeAlgorithmFlowModalState.body = $("#ppccr-algo-modal-content");
  homeAlgorithmFlowModalState.source = $("#ppccr-algo-source");
  homeAlgorithmFlowModalState.completionDialog = $("#home-algo-complete-dialog");
  homeAlgorithmFlowModalState.completionCard = $(".home-algo-complete__card", homeAlgorithmFlowModalState.modal || document);
  homeAlgorithmFlowModalState.completionText = $("#home-algo-complete-text");
  homeAlgorithmFlowModalState.completionCloseBtn = $("#home-algo-complete-close");
  homeAlgorithmFlowModalState.completionNewBtn = $("#home-algo-complete-new");
}

function mountHomeAlgorithmInFlowModal() {
  syncHomeAlgorithmFlowModalElements();
  if (!homeAlgorithmFlowModalState.source || !homeAlgorithmFlowModalState.body) return;

  while (homeAlgorithmFlowModalState.source.firstChild) {
    homeAlgorithmFlowModalState.body.appendChild(homeAlgorithmFlowModalState.source.firstChild);
  }
}

function isAlgoFlowModalOpen() {
  syncHomeAlgorithmFlowModalElements();
  return Boolean(homeAlgorithmFlowModalState.modal && !homeAlgorithmFlowModalState.modal.hidden);
}

function clearAlgoFlowModalAutoCloseTimer() {
  if (homeAlgorithmFlowModalState.autoCloseTimerId) {
    window.clearTimeout(homeAlgorithmFlowModalState.autoCloseTimerId);
    homeAlgorithmFlowModalState.autoCloseTimerId = 0;
  }
}

function clearAlgoFlowModalTransitionTimer() {
  if (homeAlgorithmFlowModalState.modalTransitionTimerId) {
    window.clearTimeout(homeAlgorithmFlowModalState.modalTransitionTimerId);
    homeAlgorithmFlowModalState.modalTransitionTimerId = 0;
  }
}

function updateAlgoFlowDeviceClockPreview() {
  if (!homeAlgorithmState?.deviceTimeInput) return;
  if (!isAlgoFlowModalOpen()) return;
  if (homeAlgorithmState?.interview?.deviceTimestamp) return;

  const nowIso = new Date().toISOString();
  homeAlgorithmFlowModalState.previewDeviceTimestamp = nowIso;
  homeAlgorithmState.deviceTimeInput.value = formatHomeAlgorithmDeviceTimestamp(nowIso, "");
}

function stopAlgoFlowDeviceClockPreview() {
  if (homeAlgorithmFlowModalState.deviceClockTimerId) {
    window.clearInterval(homeAlgorithmFlowModalState.deviceClockTimerId);
    homeAlgorithmFlowModalState.deviceClockTimerId = 0;
  }
  homeAlgorithmFlowModalState.previewDeviceTimestamp = "";
}

function startAlgoFlowDeviceClockPreview() {
  stopAlgoFlowDeviceClockPreview();
  if (!homeAlgorithmState || homeAlgorithmState.interview.deviceTimestamp) return;
  if (!isAlgoFlowModalOpen()) return;

  updateAlgoFlowDeviceClockPreview();
  homeAlgorithmFlowModalState.deviceClockTimerId = window.setInterval(() => {
    updateAlgoFlowDeviceClockPreview();
  }, 1000);
}

function isHomeAlgorithmCompletionDialogOpen() {
  return Boolean(
    homeAlgorithmFlowModalState.completionDialog &&
      !homeAlgorithmFlowModalState.completionDialog.hidden,
  );
}

function lockAlgoFlowBackgroundScroll() {
  if (document.body.classList.contains("ppccr-modal-open")) return;
  homeAlgorithmFlowModalState.scrollLockY = window.scrollY || window.pageYOffset || 0;
  document.body.classList.add("ppccr-modal-open");
  document.documentElement.classList.add("ppccr-modal-open");
  document.body.style.position = "fixed";
  document.body.style.top = `-${homeAlgorithmFlowModalState.scrollLockY}px`;
  document.body.style.left = "0";
  document.body.style.right = "0";
  document.body.style.width = "100%";
}

function unlockAlgoFlowBackgroundScroll() {
  document.body.classList.remove("ppccr-modal-open");
  document.documentElement.classList.remove("ppccr-modal-open");
  document.body.style.position = "";
  document.body.style.top = "";
  document.body.style.left = "";
  document.body.style.right = "";
  document.body.style.width = "";

  const targetY = Number(homeAlgorithmFlowModalState.scrollLockY || 0);
  window.scrollTo(0, targetY);
  homeAlgorithmFlowModalState.scrollLockY = 0;
}

function resetAlgoFlowModalViewport() {
  if (homeAlgorithmFlowModalState.body) {
    homeAlgorithmFlowModalState.body.scrollTop = 0;
  }
  if (!homeAlgorithmState?.stepPanels) return;
  homeAlgorithmState.stepPanels.forEach((panel) => {
    panel.scrollTop = 0;
    updateHomeAlgorithmPanelOverflowHints(panel);
  });
}

function mountHomeAlgorithmFlowStatus() {
  if (!homeAlgorithmState?.flowStatus) return;
  const visiblePanel = homeAlgorithmState.stepPanels.find((panel) => !panel.hidden);
  if (!visiblePanel) return;

  const anchor =
    visiblePanel.querySelector(".home-algo__panel-copy") ||
    visiblePanel.querySelector(".home-algo__panel-title");
  if (!anchor) return;

  if (
    homeAlgorithmState.flowStatus.parentElement === visiblePanel &&
    anchor.nextElementSibling === homeAlgorithmState.flowStatus
  ) {
    return;
  }

  anchor.insertAdjacentElement("afterend", homeAlgorithmState.flowStatus);
}

function mountHomeAlgorithmRestartAction() {
  if (!homeAlgorithmState?.restartBtn) return;
  const visiblePanel = homeAlgorithmState.stepPanels.find((panel) => !panel.hidden);
  const actions = visiblePanel?.querySelector(".home-algo__actions");
  if (!actions) return;

  if (
    homeAlgorithmState.restartBtn.parentElement !== actions ||
    actions.lastElementChild !== homeAlgorithmState.restartBtn
  ) {
    actions.append(homeAlgorithmState.restartBtn);
  }
  homeAlgorithmState.restartBtn.hidden = false;
}

function getHomeAlgorithmCompletionFocusableElements() {
  if (!homeAlgorithmFlowModalState.completionDialog) return [];
  const selectors =
    'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])';
  const candidates = Array.from(
    homeAlgorithmFlowModalState.completionDialog.querySelectorAll(selectors),
  );
  return candidates.filter((element) => {
    if (!(element instanceof HTMLElement)) return false;
    if (element.hidden) return false;
    const styles = window.getComputedStyle(element);
    return styles.display !== "none" && styles.visibility !== "hidden";
  });
}

function closeHomeAlgorithmCompletionDialog() {
  if (!homeAlgorithmFlowModalState.completionDialog) return;
  homeAlgorithmFlowModalState.completionDialog.hidden = true;
  homeAlgorithmFlowModalState.completionDialog.setAttribute("aria-hidden", "true");
}

function openHomeAlgorithmCompletionDialog({
  message = "La entrevista se registró correctamente.",
} = {}) {
  syncHomeAlgorithmFlowModalElements();
  if (!homeAlgorithmFlowModalState.completionDialog) return;

  clearAlgoFlowModalAutoCloseTimer();
  stopAlgoFlowDeviceClockPreview();
  closeHomeAlgorithmCompletionDialog();
  closeHomeAlgorithmModal();

  if (homeAlgorithmFlowModalState.completionText) {
    homeAlgorithmFlowModalState.completionText.textContent = message;
  }

  homeAlgorithmFlowModalState.completionDialog.hidden = false;
  homeAlgorithmFlowModalState.completionDialog.setAttribute("aria-hidden", "false");
  const preferredButton = homeAlgorithmFlowModalState.completionNewBtn;
  if (preferredButton instanceof HTMLElement) {
    preferredButton.focus();
  } else if (homeAlgorithmFlowModalState.completionCard instanceof HTMLElement) {
    homeAlgorithmFlowModalState.completionCard.focus();
  }
}

function startNewHomeAlgorithmInterviewInModal() {
  closeHomeAlgorithmCompletionDialog();
  if (typeof restartHomeAlgorithm === "function") {
    restartHomeAlgorithm({ confirmRestart: false });
  }
  if (typeof goToHomeAlgorithmStep === "function") {
    goToHomeAlgorithmStep(ALGORITHM_HOME.steps.AGE);
  }
  clearAlgoFlowModalAutoCloseTimer();
  startAlgoFlowDeviceClockPreview();
  resetAlgoFlowModalViewport();
  refreshHomeAlgorithmOverflowHints();
  focusAlgoFlowStep1Input();
}

function closeAlgoFlowModalFromCompletion() {
  closeHomeAlgorithmCompletionDialog();
  closeAlgoFlowModal({ force: true });
}

function trapHomeAlgorithmCompletionFocus(event) {
  if (!isHomeAlgorithmCompletionDialogOpen()) return;
  if (event.key !== "Tab") return;

  const focusables = getHomeAlgorithmCompletionFocusableElements();
  if (focusables.length === 0) {
    event.preventDefault();
    return;
  }

  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  const active = document.activeElement;

  if (event.shiftKey && active === first) {
    event.preventDefault();
    last.focus();
    return;
  }

  if (!event.shiftKey && active === last) {
    event.preventDefault();
    first.focus();
  }
}

function getAlgoFlowFocusableElements() {
  if (!homeAlgorithmFlowModalState.modal) return [];
  const selectors =
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  const candidates = Array.from(homeAlgorithmFlowModalState.modal.querySelectorAll(selectors));
  return candidates.filter((element) => {
    if (!(element instanceof HTMLElement)) return false;
    if (element.hidden) return false;
    if (element.getAttribute("aria-hidden") === "true") return false;
    const style = window.getComputedStyle(element);
    return style.visibility !== "hidden" && style.display !== "none";
  });
}

function trapAlgoFlowModalFocus(event) {
  if (!isAlgoFlowModalOpen()) return;
  if (isHomeAlgorithmCompletionDialogOpen()) return;
  if (event.key !== "Tab") return;

  const focusables = getAlgoFlowFocusableElements();
  if (focusables.length === 0) {
    event.preventDefault();
    return;
  }

  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  const active = document.activeElement;

  if (event.shiftKey && active === first) {
    event.preventDefault();
    last.focus();
    return;
  }

  if (!event.shiftKey && active === last) {
    event.preventDefault();
    first.focus();
  }
}

function focusAlgoFlowStep1Input() {
  const ageInput = $("#home-algo-step1-age") || $("#home-algo-age");
  if (ageInput && typeof ageInput.focus === "function") {
    ageInput.focus();
  }
}

function hasAlgoFlowModalMeaningfulDataFallback() {
  if (!homeAlgorithmState) return false;

  if (Number(homeAlgorithmState.currentStep || ALGORITHM_HOME.steps.AGE) > ALGORITHM_HOME.steps.AGE) {
    return true;
  }

  const ageFilled = String(homeAlgorithmState.ageInput?.value || "").trim().length > 0;
  if (ageFilled) return true;

  const hasSex = homeAlgorithmState.sexRadios.some((radio) => radio.checked);
  if (hasSex) return true;

  const hasMarkedChecks =
    homeAlgorithmState.step2Checks.some((input) => input.checked) ||
    homeAlgorithmState.step3Checks.some((input) => input.checked);

  return hasMarkedChecks;
}

function shouldConfirmCloseAlgoFlowModal() {
  if (typeof homeAlgorithmHasMeaningfulData === "function") {
    try {
      return homeAlgorithmHasMeaningfulData();
    } catch (_error) {
      return hasAlgoFlowModalMeaningfulDataFallback();
    }
  }
  return hasAlgoFlowModalMeaningfulDataFallback();
}

function openAlgoFlowModal(opener = null) {
  mountHomeAlgorithmInFlowModal();
  syncHomeAlgorithmFlowModalElements();
  if (!homeAlgorithmFlowModalState.modal) return;

  clearAlgoFlowModalAutoCloseTimer();
  clearAlgoFlowModalTransitionTimer();
  stopAlgoFlowDeviceClockPreview();

  const activeElement = document.activeElement;
  homeAlgorithmFlowModalState.lastFocused =
    opener instanceof HTMLElement
      ? opener
      : activeElement instanceof HTMLElement
        ? activeElement
        : null;

  if (typeof restartHomeAlgorithm === "function") {
    restartHomeAlgorithm({ confirmRestart: false });
  }
  if (typeof goToHomeAlgorithmStep === "function") {
    goToHomeAlgorithmStep(ALGORITHM_HOME.steps.AGE);
  }
  closeHomeAlgorithmCompletionDialog();

  homeAlgorithmFlowModalState.modal.classList.remove("is-closing");
  homeAlgorithmFlowModalState.modal.hidden = false;
  homeAlgorithmFlowModalState.modal.setAttribute("aria-hidden", "false");
  window.requestAnimationFrame(() => {
    if (!homeAlgorithmFlowModalState.modal || homeAlgorithmFlowModalState.modal.hidden) return;
    if (homeAlgorithmFlowModalState.modal.classList.contains("is-closing")) return;
    homeAlgorithmFlowModalState.modal.classList.add("is-open");
  });
  lockAlgoFlowBackgroundScroll();

  startAlgoFlowDeviceClockPreview();
  resetAlgoFlowModalViewport();
  refreshHomeAlgorithmOverflowHints();
  focusAlgoFlowStep1Input();
}

function closeAlgoFlowModal({ force = false } = {}) {
  syncHomeAlgorithmFlowModalElements();
  if (!homeAlgorithmFlowModalState.modal) return false;
  if (homeAlgorithmFlowModalState.modal.classList.contains("is-closing")) return true;
  if (homeAlgorithmFlowModalState.modal.hidden) {
    unlockAlgoFlowBackgroundScroll();
    return true;
  }

  if (!force && shouldConfirmCloseAlgoFlowModal()) {
    const allowClose = window.confirm(
      "Hay una entrevista en curso. ¿Cerrar y descartar cambios?",
    );
    if (!allowClose) return false;
  }

  clearAlgoFlowModalAutoCloseTimer();
  clearAlgoFlowModalTransitionTimer();
  stopAlgoFlowDeviceClockPreview();
  closeHomeAlgorithmCompletionDialog();

  if (typeof closeHomeAlgorithmModal === "function") {
    closeHomeAlgorithmModal();
  }
  if (typeof restartHomeAlgorithm === "function") {
    restartHomeAlgorithm({ confirmRestart: false });
  }

  const targetToRestore = homeAlgorithmFlowModalState.lastFocused;
  homeAlgorithmFlowModalState.lastFocused = null;

  const finishClose = () => {
    if (!homeAlgorithmFlowModalState.modal) return;
    homeAlgorithmFlowModalState.modal.hidden = true;
    homeAlgorithmFlowModalState.modal.classList.remove("is-closing", "is-open");
    unlockAlgoFlowBackgroundScroll();
    if (targetToRestore && typeof targetToRestore.focus === "function") {
      targetToRestore.focus();
    }
  };

  const closeDelay = getHomeAlgorithmTransitionMs();
  homeAlgorithmFlowModalState.modal.classList.remove("is-open");
  homeAlgorithmFlowModalState.modal.classList.add("is-closing");
  homeAlgorithmFlowModalState.modal.setAttribute("aria-hidden", "true");

  if (closeDelay > 0) {
    homeAlgorithmFlowModalState.modalTransitionTimerId = window.setTimeout(() => {
      homeAlgorithmFlowModalState.modalTransitionTimerId = 0;
      finishClose();
    }, closeDelay);
  } else {
    finishClose();
  }

  return true;
}

function onAlgoFlowModalCaptureClick(event) {
  const target = event.target;
  if (!(target instanceof Element)) return;

  if (isHomeAlgorithmCompletionDialogOpen()) {
    const completionAction = target.closest("[data-home-algo-complete-action]");
    if (completionAction) {
      event.preventDefault();
      event.stopPropagation();
      closeAlgoFlowModalFromCompletion();
      return;
    }

    if (target.closest("#home-algo-complete-close")) {
      event.preventDefault();
      event.stopPropagation();
      closeAlgoFlowModalFromCompletion();
      return;
    }

    if (target.closest("#home-algo-complete-new")) {
      event.preventDefault();
      event.stopPropagation();
      startNewHomeAlgorithmInterviewInModal();
      return;
    }
  }

  const opener = target.closest('[data-open-algo="true"]');
  if (opener) {
    event.preventDefault();
    event.stopPropagation();
    openAlgoFlowModal(opener);
    return;
  }

  const anchorOpener = target.closest('a[href="#algoritmo"], a[href="#algoritmo-section"]');
  if (anchorOpener) {
    event.preventDefault();
    event.stopPropagation();
    openAlgoFlowModal(anchorOpener);
    return;
  }

  if (!isAlgoFlowModalOpen()) return;

  const closer = target.closest("[data-algo-close='true']");
  if (closer && homeAlgorithmFlowModalState.modal?.contains(closer)) {
    event.preventDefault();
    event.stopPropagation();
    closeAlgoFlowModal();
  }
}

function onAlgoFlowModalCaptureKeydown(event) {
  if (!isAlgoFlowModalOpen()) return;

  if (isHomeAlgorithmCompletionDialogOpen()) {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      closeAlgoFlowModalFromCompletion();
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      event.stopPropagation();
      startNewHomeAlgorithmInterviewInModal();
      return;
    }
    trapHomeAlgorithmCompletionFocus(event);
    return;
  }

  if (event.key === "Escape") {
    event.preventDefault();
    event.stopPropagation();
    closeAlgoFlowModal();
    return;
  }

  trapAlgoFlowModalFocus(event);
}

function setupAlgoFlowModalLifecycle() {
  mountHomeAlgorithmInFlowModal();
  syncHomeAlgorithmFlowModalElements();
  if (!homeAlgorithmFlowModalState.modal) return;

  homeAlgorithmFlowModalState.modal.classList.remove("is-open", "is-closing");

  if (homeAlgorithmFlowModalState.completionDialog) {
    homeAlgorithmFlowModalState.completionDialog.hidden = true;
    homeAlgorithmFlowModalState.completionDialog.setAttribute("aria-hidden", "true");
  }

  if (!homeAlgorithmFlowModalState.captureListenerBound) {
    document.addEventListener("click", onAlgoFlowModalCaptureClick, true);
    homeAlgorithmFlowModalState.captureListenerBound = true;
  }

  if (!homeAlgorithmFlowModalState.escListenerBound) {
    document.addEventListener("keydown", onAlgoFlowModalCaptureKeydown, true);
    homeAlgorithmFlowModalState.escListenerBound = true;
  }

}

function fillHomeAlgorithmModal() {
  if (!homeAlgorithmState) return;
  const outcome = homeAlgorithmState.interview.outcome;
  const outcomeText = getHomeAlgorithmOutcomeText(outcome);

  homeAlgorithmState.modalOutcome.textContent = outcomeText;
  homeAlgorithmState.modalText.textContent = buildHomeAlgorithmModalReason(
    outcome,
    homeAlgorithmState.interview,
    {
      step2: homeAlgorithmState.step2Labels,
      step3: homeAlgorithmState.step3Labels,
    },
  );
  homeAlgorithmState.modalSummary.textContent = buildHomeAlgorithmSummaryText(
    homeAlgorithmState.interview,
    {
      step2: homeAlgorithmState.step2Labels,
      step3: homeAlgorithmState.step3Labels,
    },
  );
}

function openHomeAlgorithmModal() {
  if (!homeAlgorithmState?.modal || !homeAlgorithmState.modalDialog) return;
  fillHomeAlgorithmModal();
  homeAlgorithmState.modal.hidden = false;
  homeAlgorithmState.modal.setAttribute("aria-hidden", "false");
  homeAlgorithmState.modalDialog.focus();
}

function closeHomeAlgorithmModal() {
  if (!homeAlgorithmState?.modal) return;
  homeAlgorithmState.modal.hidden = true;
  homeAlgorithmState.modal.setAttribute("aria-hidden", "true");
}

function enableHomeAlgorithmEditingFromModal() {
  if (!homeAlgorithmState) return;
  clearAlgoFlowModalAutoCloseTimer();

  const finalStep =
    Number.isFinite(homeAlgorithmState.finalStep) && homeAlgorithmState.finalStep > 0
      ? homeAlgorithmState.finalStep
      : ALGORITHM_HOME.steps.AGE;

  homeAlgorithmState.finalized = false;
  homeAlgorithmState.interview.outcome = "";
  homeAlgorithmState.currentStep = finalStep;
  homeAlgorithmState.maxUnlockedStep = Math.max(
    homeAlgorithmState.maxUnlockedStep,
    finalStep,
  );

  syncInterviewStateFromInterview({ status: "pending" });
  closeHomeAlgorithmModal();
  renderHomeAlgorithm();
  persistHomeAlgorithmDraft({ message: "Modo edición habilitado para ajustar la entrevista." });
}

function finalizeHomeAlgorithmInterview(outcome, finalStep) {
  if (!homeAlgorithmState) return;

  homeAlgorithmState.interview.outcome = outcome;
  homeAlgorithmState.finalized = true;
  homeAlgorithmState.finalStep = finalStep;
  homeAlgorithmState.currentStep = finalStep;
  homeAlgorithmState.maxUnlockedStep = Math.max(
    homeAlgorithmState.maxUnlockedStep,
    finalStep,
  );

  if (finalStep >= ALGORITHM_HOME.steps.AGE) {
    homeAlgorithmState.step1Confirmed = true;
  }
  if (finalStep >= ALGORITHM_HOME.steps.VIGILANCE) {
    homeAlgorithmState.step2Reviewed = true;
  }
  if (finalStep >= ALGORITHM_HOME.steps.RISK) {
    homeAlgorithmState.step3Reviewed = true;
  }

  syncInterviewStateFromInterview({ status: "saved" });
  renderHomeAlgorithm();
  persistHomeAlgorithmDraft({
    message: `Entrevista finalizada: ${getHomeAlgorithmOutcomeText(outcome)}`,
  });
  openHomeAlgorithmModal();
}

function homeAlgorithmHasMeaningfulData() {
  if (!homeAlgorithmState) return false;
  const i = homeAlgorithmState.interview;

  return Boolean(
    i.outcome ||
      i.deviceTimestamp ||
      Number.isFinite(i.step1.age) ||
      i.step1.sex ||
      i.step1.sexOtherDetail ||
      i.step2.exclusions.length > 0 ||
      i.step3.riskFlags.length > 0 ||
      i.step4.fullName ||
      i.step4.documentId ||
      i.step4.email ||
      i.step4.phone,
  );
}

function restartHomeAlgorithm({ confirmRestart = true } = {}) {
  if (!homeAlgorithmState) return;

  if (confirmRestart && homeAlgorithmHasMeaningfulData()) {
    const allow = window.confirm(
      "Se perderá la entrevista actual. ¿Querés reiniciar de todos modos?",
    );
    if (!allow) return;
  }

  clearAlgoFlowModalAutoCloseTimer();
  stopAlgoFlowDeviceClockPreview();
  closeHomeAlgorithmModal();

  const station = resolveHomeAlgorithmStationFromBridge();
  const fallbackStation = {
    stationId: station.stationId || homeAlgorithmState.interview.stationId,
    stationName: station.stationName || homeAlgorithmState.interview.stationName,
  };

  homeAlgorithmState.interview = createHomeAlgorithmInterview(fallbackStation);
  homeAlgorithmState.currentStep = ALGORITHM_HOME.steps.AGE;
  homeAlgorithmState.maxUnlockedStep = ALGORITHM_HOME.steps.AGE;
  homeAlgorithmState.step1Confirmed = false;
  homeAlgorithmState.step2Reviewed = false;
  homeAlgorithmState.step3Reviewed = false;
  homeAlgorithmState.finalized = false;
  homeAlgorithmState.finalStep = 0;

  resetInterviewState();
  clearHomeAlgorithmAllFieldErrors();
  hydrateHomeAlgorithmFormFromInterview();
  renderHomeAlgorithm();
  resetAlgoFlowModalViewport();
  persistHomeAlgorithmDraft({ message: "Entrevista reiniciada y borrador local renovado." });
}

function initHomeAlgorithm() {
  const root = $("#home-algo");
  if (!root) return;

  const stepButtons = Array.from(root.querySelectorAll("[data-home-algo-step-target]"));
  const stepPanels = Array.from(root.querySelectorAll("[data-home-algo-step-panel]"));

  const stationInput = $("#home-algo-station");
  const participantInput = $("#home-algo-participant");
  const deviceTimeInput = $("#home-algo-device-time");
  const ageInput = $("#home-algo-age");
  const sexGroup = $("#home-algo-sex-switch", root);
  const sexRadios = Array.from(root.querySelectorAll('input[name="home-algo-sex"]'));
  const sexOtherWrap = $("#home-algo-sex-other-wrap", root);
  const sexOtherInput = $("#home-algo-sex-other-text", root);

  const step1Feedback = $("#home-algo-step1-feedback");
  const step1Stop = $("#home-algo-step1-stop");
  const step1Ok = $("#home-algo-step1-ok");
  const step1Confirm = $("#btn-confirm-step1");
  const step1Edit = $("#home-algo-step1-edit");
  const step1Finish = $("#home-algo-step1-finish");
  const step1Continue = $("#home-algo-step1-continue");

  const step2Checks = Array.from(root.querySelectorAll("[data-home-algo-step2-code]"));
  const step2Feedback = $("#home-algo-step2-feedback");
  const step2Stop = $("#home-algo-step2-stop");
  const step2Ok = $("#home-algo-step2-ok");
  const step2Evaluate = $("#home-algo-step2-evaluate");
  const step2Edit = $("#home-algo-step2-edit");
  const step2Finish = $("#home-algo-step2-finish");
  const step2Continue = $("#home-algo-step2-continue");
  const step2Back = $("#home-algo-step2-back");

  const step3Checks = Array.from(root.querySelectorAll("[data-home-algo-step3-code]"));
  const step3Feedback = $("#home-algo-step3-feedback");
  const step3Stop = $("#home-algo-step3-stop");
  const step3Ok = $("#home-algo-step3-ok");
  const step3Evaluate = $("#home-algo-step3-evaluate");
  const step3Edit = $("#home-algo-step3-edit");
  const step3Finish = $("#home-algo-step3-finish");
  const step3Continue = $("#home-algo-step3-continue");
  const step3Back = $("#home-algo-step3-back");

  const fullNameInput = $("#home-algo-full-name");
  const documentIdInput = $("#home-algo-document-id");
  const emailInput = $("#home-algo-email");
  const phoneInput = $("#home-algo-phone");
  const step4Feedback = $("#home-algo-step4-feedback");
  const step4Edit = $("#home-algo-step4-edit");
  const step4Back = $("#home-algo-step4-back");
  const step4Finish = $("#home-algo-step4-finish");

  const statusChip = $("#home-algo-status-chip");
  const flowStatus = $("#home-algo-flow-status");
  const restartBtn = $("#home-algo-restart");

  const modal = $("#home-algo-finish-modal");
  const modalDialog = $(".home-algo__modal-card", modal || document);
  const modalOutcome = $("#home-algo-modal-outcome");
  const modalText = $("#home-algo-modal-text");
  const modalSummary = $("#home-algo-modal-summary");
  const modalEditBtn = $("#home-algo-modal-edit");
  const modalFinalizeBtn = $("#home-algo-modal-finalize");

  if (
    stepButtons.length === 0 ||
    stepPanels.length === 0 ||
    !stationInput ||
    !participantInput ||
    !deviceTimeInput ||
    !ageInput ||
    sexRadios.length === 0 ||
    !sexOtherWrap ||
    !sexOtherInput ||
    !step1Feedback ||
    !step1Stop ||
    !step1Ok ||
    !step1Confirm ||
    !step1Edit ||
    !step1Finish ||
    !step1Continue ||
    step2Checks.length === 0 ||
    !step2Feedback ||
    !step2Stop ||
    !step2Ok ||
    !step2Evaluate ||
    !step2Edit ||
    !step2Finish ||
    !step2Continue ||
    !step2Back ||
    step3Checks.length === 0 ||
    !step3Feedback ||
    !step3Stop ||
    !step3Ok ||
    !step3Evaluate ||
    !step3Edit ||
    !step3Finish ||
    !step3Continue ||
    !step3Back ||
    !fullNameInput ||
    !documentIdInput ||
    !emailInput ||
    !phoneInput ||
    !step4Feedback ||
    !step4Edit ||
    !step4Back ||
    !step4Finish ||
    !statusChip ||
    !flowStatus ||
    !restartBtn ||
    !modal ||
    !modalDialog ||
    !modalOutcome ||
    !modalText ||
    !modalSummary ||
    !modalEditBtn ||
    !modalFinalizeBtn
  ) {
    homeAlgorithmState = null;
    return;
  }

  const stationFromBridge = resolveHomeAlgorithmStationFromBridge();
  const draft = loadHomeAlgorithmDraft(stationFromBridge);

  homeAlgorithmState = {
    root,
    currentStep: draft?.currentStep || ALGORITHM_HOME.steps.AGE,
    maxUnlockedStep: draft?.maxUnlockedStep || ALGORITHM_HOME.steps.AGE,
    step1Confirmed: draft?.step1Confirmed || false,
    step2Reviewed: draft?.step2Reviewed || false,
    step3Reviewed: draft?.step3Reviewed || false,
    finalized: draft?.finalized || false,
    finalStep: draft?.finalStep || 0,
    interview: draft?.interview || createHomeAlgorithmInterview(stationFromBridge),

    stepButtons,
    stepPanels,

    stationInput,
    participantInput,
    deviceTimeInput,
    ageInput,
    sexGroup,
    sexRadios,
    sexOtherWrap,
    sexOtherInput,

    step1Feedback,
    step1Stop,
    step1Ok,
    step1Confirm,
    step1Edit,
    step1Finish,
    step1Continue,

    step2Checks,
    step2Feedback,
    step2Stop,
    step2Ok,
    step2Evaluate,
    step2Edit,
    step2Finish,
    step2Continue,
    step2Back,

    step3Checks,
    step3Feedback,
    step3Stop,
    step3Ok,
    step3Evaluate,
    step3Edit,
    step3Finish,
    step3Continue,
    step3Back,

    fullNameInput,
    documentIdInput,
    emailInput,
    phoneInput,
    step4Feedback,
    step4Edit,
    step4Back,
    step4Finish,

    statusChip,
    flowStatus,
    restartBtn,

    modal,
    modalDialog,
    modalOutcome,
    modalText,
    modalSummary,
    modalEditBtn,
    modalFinalizeBtn,

    step2Labels: collectHomeAlgorithmCodeLabels(step2Checks, "data-home-algo-step2-code"),
    step3Labels: collectHomeAlgorithmCodeLabels(step3Checks, "data-home-algo-step3-code"),
  };

  if (!homeAlgorithmState.interview.participantNumber) {
    homeAlgorithmState.interview.participantNumber = reserveHomeAlgorithmParticipantNumber(
      homeAlgorithmState.interview.stationId,
      homeAlgorithmState.interview.stationName,
    );
  }

  if (!homeAlgorithmState.interview.stationId || !homeAlgorithmState.interview.stationName) {
    syncHomeAlgorithmStationFromBridge({ force: true });
  }

  if (homeAlgorithmState.finalized && !homeAlgorithmState.interview.outcome) {
    homeAlgorithmState.finalized = false;
    homeAlgorithmState.finalStep = 0;
  }

  if (homeAlgorithmState.finalized && homeAlgorithmState.finalStep > 0) {
    homeAlgorithmState.currentStep = homeAlgorithmState.finalStep;
    homeAlgorithmState.maxUnlockedStep = Math.max(
      homeAlgorithmState.maxUnlockedStep,
      homeAlgorithmState.finalStep,
    );
  }

  syncInterviewStateFromInterview({
    status: homeAlgorithmState.finalized ? "saved" : "pending",
  });

  hydrateHomeAlgorithmFormFromInterview();
  renderHomeAlgorithm();

  homeAlgorithmState.stepPanels.forEach((panel) => {
    panel.addEventListener(
      "scroll",
      () => {
        updateHomeAlgorithmPanelOverflowHints(panel);
      },
      { passive: true },
    );
  });

  window.addEventListener(
    "resize",
    () => {
      if (!isAlgoFlowModalOpen()) return;
      refreshHomeAlgorithmOverflowHints();
    },
    { passive: true },
  );

  if (!draft) {
    persistHomeAlgorithmDraft({ message: "Borrador local inicializado." });
  }

  homeAlgorithmState.stepButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const step = Number(button.dataset.homeAlgoStepTarget || "");
      goToHomeAlgorithmStep(step);
    });
  });

  homeAlgorithmState.ageInput.addEventListener("input", () => {
    if (homeAlgorithmState.finalized) return;
    sanitizeHomeAlgorithmAgeInput();
    clearHomeAlgorithmFieldError(HOME_ALGO_STEP1_FIELDS.age);

    const parsedAge = Number.parseInt(
      String(homeAlgorithmState.ageInput.value || ""),
      10,
    );
    homeAlgorithmState.interview.step1.age =
      Number.isFinite(parsedAge) && parsedAge >= 0 && parsedAge <= 120 ? parsedAge : null;
    homeAlgorithmState.interview.step1.includedByAge =
      Number.isFinite(homeAlgorithmState.interview.step1.age) &&
      homeAlgorithmState.interview.step1.age >= ALGORITHM_HOME.minAge;
    homeAlgorithmState.interview.deviceTimestamp = "";

    homeAlgorithmState.step1Confirmed = false;
    homeAlgorithmState.step2Reviewed = false;
    homeAlgorithmState.step3Reviewed = false;
    homeAlgorithmState.maxUnlockedStep = ALGORITHM_HOME.steps.AGE;
    homeAlgorithmState.currentStep = ALGORITHM_HOME.steps.AGE;
    setHomeAlgorithmStationInputs();
    syncInterviewStateFromInterview({ status: "pending" });
    renderHomeAlgorithm();
    persistHomeAlgorithmDraft();
  });

  homeAlgorithmState.sexRadios.forEach((radio) => {
    radio.addEventListener("change", () => {
      if (homeAlgorithmState.finalized || !radio.checked) return;
      clearHomeAlgorithmFieldError(HOME_ALGO_STEP1_FIELDS.sex);
      clearHomeAlgorithmFieldError(HOME_ALGO_STEP1_FIELDS.sexOther);
      homeAlgorithmState.step1Confirmed = false;
      homeAlgorithmState.interview.step1.sex = String(radio.value || "").trim().toUpperCase();
      if (homeAlgorithmState.interview.step1.sex !== HOME_ALGO_SEX.OTHER) {
        homeAlgorithmState.interview.step1.sexOtherDetail = "";
      }
      homeAlgorithmState.interview.deviceTimestamp = "";
      homeAlgorithmState.step2Reviewed = false;
      homeAlgorithmState.step3Reviewed = false;
      homeAlgorithmState.maxUnlockedStep = ALGORITHM_HOME.steps.AGE;
      homeAlgorithmState.currentStep = ALGORITHM_HOME.steps.AGE;
      renderHomeAlgorithmSexOtherInput({
        focus: homeAlgorithmState.interview.step1.sex === HOME_ALGO_SEX.OTHER,
      });
      setHomeAlgorithmStationInputs();
      syncInterviewStateFromInterview({ status: "pending" });
      renderHomeAlgorithm();
      persistHomeAlgorithmDraft();
    });
  });

  homeAlgorithmState.sexOtherInput.addEventListener("input", () => {
    if (homeAlgorithmState.finalized) return;
    if (homeAlgorithmState.interview.step1.sex !== HOME_ALGO_SEX.OTHER) return;

    clearHomeAlgorithmFieldError(HOME_ALGO_STEP1_FIELDS.sexOther);
    homeAlgorithmState.step1Confirmed = false;
    homeAlgorithmState.interview.step1.sexOtherDetail = String(
      homeAlgorithmState.sexOtherInput.value || "",
    ).trim();
    homeAlgorithmState.interview.deviceTimestamp = "";
    homeAlgorithmState.step2Reviewed = false;
    homeAlgorithmState.step3Reviewed = false;
    homeAlgorithmState.maxUnlockedStep = ALGORITHM_HOME.steps.AGE;
    homeAlgorithmState.currentStep = ALGORITHM_HOME.steps.AGE;
    setHomeAlgorithmStationInputs();
    syncInterviewStateFromInterview({ status: "pending" });
    renderHomeAlgorithm();
    persistHomeAlgorithmDraft();
  });

  homeAlgorithmState.step1Confirm.addEventListener("click", onHomeAlgorithmConfirmStep1);
  homeAlgorithmState.step1Edit.addEventListener("click", onHomeAlgorithmEditStep1);
  homeAlgorithmState.step1Finish.addEventListener("click", onHomeAlgorithmFinishStep1);
  homeAlgorithmState.step1Continue.addEventListener("click", onHomeAlgorithmContinueStep1);

  homeAlgorithmState.step2Checks.forEach((input) => {
    input.addEventListener("change", onHomeAlgorithmStep2Changed);
  });
  homeAlgorithmState.step2Evaluate.addEventListener("click", onHomeAlgorithmEvaluateStep2);
  homeAlgorithmState.step2Edit.addEventListener("click", onHomeAlgorithmEditStep2);
  homeAlgorithmState.step2Finish.addEventListener("click", onHomeAlgorithmFinishStep2);
  homeAlgorithmState.step2Continue.addEventListener("click", onHomeAlgorithmContinueStep2);
  homeAlgorithmState.step2Back.addEventListener("click", onHomeAlgorithmBackToStep1);

  homeAlgorithmState.step3Checks.forEach((input) => {
    input.addEventListener("change", onHomeAlgorithmStep3Changed);
  });
  homeAlgorithmState.step3Evaluate.addEventListener("click", onHomeAlgorithmEvaluateStep3);
  homeAlgorithmState.step3Edit.addEventListener("click", onHomeAlgorithmEditStep3);
  homeAlgorithmState.step3Finish.addEventListener("click", onHomeAlgorithmFinishStep3);
  homeAlgorithmState.step3Continue.addEventListener("click", onHomeAlgorithmContinueStep3);
  homeAlgorithmState.step3Back.addEventListener("click", onHomeAlgorithmBackToStep2);

  [
    homeAlgorithmState.fullNameInput,
    homeAlgorithmState.documentIdInput,
    homeAlgorithmState.emailInput,
    homeAlgorithmState.phoneInput,
  ].forEach((input) => {
    input.addEventListener("input", onHomeAlgorithmStep4InputChanged);
  });
  homeAlgorithmState.step4Edit.addEventListener("click", onHomeAlgorithmEditStep4);
  homeAlgorithmState.step4Back.addEventListener("click", onHomeAlgorithmBackToStep3);
  homeAlgorithmState.step4Finish.addEventListener("click", onHomeAlgorithmFinishStep4);

  homeAlgorithmState.restartBtn.addEventListener("click", () => {
    restartHomeAlgorithm({ confirmRestart: true });
  });

  homeAlgorithmState.modal.addEventListener("click", (event) => {
    const shouldClose = event.target.closest("[data-home-algo-close-modal='true']");
    if (shouldClose) {
      closeHomeAlgorithmModal();
    }
  });

  homeAlgorithmState.modalEditBtn.addEventListener("click", () => {
    enableHomeAlgorithmEditingFromModal();
  });
  homeAlgorithmState.modalFinalizeBtn.addEventListener("click", () => {
    closeHomeAlgorithmModal();
  });

  document.addEventListener("keydown", (event) => {
    if (!homeAlgorithmState || homeAlgorithmState.modal.hidden) return;
    if (event.key !== "Escape") return;
    event.preventDefault();
    closeHomeAlgorithmModal();
  });

  window.addEventListener("ppccr:station-changed", () => {
    syncHomeAlgorithmStationFromBridge();
  });
}
/* ----------------------------- Nav / UX ----------------------------- */

function setupMobileNav() {
  const btn = $("#nav-toggle");
  const list = $("#nav-list");
  if (!btn || !list) return;

  btn.addEventListener("click", () => {
    const isOpen = list.classList.toggle("is-open");
    btn.setAttribute("aria-expanded", String(isOpen));
  });

  // Cerrar menú al hacer click en un link (mobile)
  list.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (!a) return;
    list.classList.remove("is-open");
    btn.setAttribute("aria-expanded", "false");
  });
}

function setupHomeMobileBottomNavDock() {
  if (!document.body.classList.contains("page-home")) return;

  const sourceNav = $(".site-nav");
  const sourceList = $("#nav-list");
  const fixedDock = $("#mobile-fixed-dock");
  if (!sourceNav || !sourceList || !fixedDock) return;

  const isMobile = window.matchMedia("(max-width: 520px)").matches;

  if (isMobile) {
    sourceNav.classList.add("is-mobile-source-hidden");
    sourceNav.setAttribute("aria-hidden", "true");

    if (!fixedDock.querySelector(".mobile-dock-list")) {
      const list = document.createElement("ul");
      list.className = "mobile-dock-list";

      const links = sourceList.querySelectorAll("a.nav-link[data-nav]");
      links.forEach((link) => {
        if (link.dataset.nav === "inicio") return;
        const li = document.createElement("li");
        const clone = link.cloneNode(true);
        clone.removeAttribute("aria-current");
        clone.classList.remove("is-active");
        li.appendChild(clone);
        list.appendChild(li);
      });

      fixedDock.innerHTML = "";
      fixedDock.appendChild(list);
    }

    fixedDock.hidden = false;
    fixedDock.classList.add("is-visible");
  } else {
    sourceNav.classList.remove("is-mobile-source-hidden");
    sourceNav.removeAttribute("aria-hidden");
    fixedDock.classList.remove("is-visible");
    fixedDock.hidden = true;
  }

  updateMobileBars();
}

function initMobilePremiumHeader() {
  if (!document.body.classList.contains("page-home")) return;

  if (mobilePremiumHeaderBound) return;

  const root = document.documentElement;
  const body = document.body;
  const header = document.getElementById("top");
  const dock = document.getElementById("mobile-fixed-dock");
  const topbar =
    document.getElementById("siteTopbar") ||
    header?.querySelector(".site-topbar__inner");
  if (!header) return;

  const mq = window.matchMedia("(max-width: 520px)");
  const COMPACT_Y = 24;
  let lastCompact = null;

  // Mobile App Shell: medimos alturas reales solo cuando hace falta.
  const measureShell = () => {
    const liveHeaderH = Math.max(0, Math.round(header.getBoundingClientRect().height));
    root.style.setProperty("--header-fixed-h", `${liveHeaderH}px`);

    if (!mq.matches) {
      root.style.removeProperty("--mobile-header-h");
      root.style.removeProperty("--topbar-h");
      root.style.removeProperty("--mobile-dock-h");
      root.style.removeProperty("--dock-h");
      root.style.removeProperty("--home-mobile-header-offset");
      root.style.removeProperty("--h-offset");
      return;
    }

    const headerH = liveHeaderH;
    const topbarH = topbar
      ? Math.max(48, Math.round(topbar.getBoundingClientRect().height))
      : Math.max(48, headerH);
    const dockH = dock ? Math.max(0, Math.round(dock.getBoundingClientRect().height)) : 0;

    root.style.setProperty("--mobile-header-h", `${headerH}px`);
    root.style.setProperty("--topbar-h", `${topbarH}px`);
    root.style.setProperty("--mobile-dock-h", `${dockH}px`);
    root.style.setProperty("--dock-h", `${dockH}px`);
    root.style.setProperty("--home-mobile-header-offset", `${headerH + 8}px`);
    root.style.setProperty("--h-offset", `${topbarH + 12}px`);
    root.style.setProperty("--header-offset", `${Math.max(96, headerH + 16)}px`);
  };

  const toggleCompact = (shouldCompact) => {
    if (!mq.matches || shouldCompact === lastCompact) return;

    lastCompact = shouldCompact;
    body.classList.toggle("is-header-compact", shouldCompact);
    header.classList.toggle("is-compact", shouldCompact);
    header.classList.toggle("partners-collapsed", shouldCompact);
    header.classList.toggle("partners-expanded", !shouldCompact);

    window.requestAnimationFrame(() => {
      measureShell();
      updateMobileBars();
    });
  };

  const syncMobileState = () => {
    if (!mq.matches) {
      lastCompact = null;
      body.classList.remove("is-header-compact");
      header.classList.remove("is-compact", "partners-collapsed");
      header.classList.add("partners-expanded");
      measureShell();
      updateMobileBars();
      return;
    }

    lastCompact = null;
    toggleCompact(window.scrollY > COMPACT_Y);
    measureShell();
    updateMobileBars();
  };

  const onScroll = () => {
    if (!mq.matches) return;
    const shouldCompact = window.scrollY > COMPACT_Y;
    if (shouldCompact === lastCompact) return;
    toggleCompact(shouldCompact);
  };

  const onResize = () => {
    if (!mq.matches) {
      syncMobileState();
      return;
    }
    measureShell();
    updateMobileBars();
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onResize, { passive: true });
  window.addEventListener("orientationchange", onResize, { passive: true });
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", onResize, { passive: true });
  }

  if (typeof mq.addEventListener === "function") {
    mq.addEventListener("change", syncMobileState);
  } else if (typeof mq.addListener === "function") {
    mq.addListener(syncMobileState);
  }

  window.addEventListener(
    "load",
    () => {
      window.requestAnimationFrame(() => {
        measureShell();
        updateMobileBars();
      });
    },
    { once: true },
  );

  if ("ResizeObserver" in window) {
    if (mobileShellResizeObserver) mobileShellResizeObserver.disconnect();
    mobileShellResizeObserver = new ResizeObserver(() => {
      measureShell();
      updateMobileBars();
    });
    mobileShellResizeObserver.observe(header);
    if (topbar) mobileShellResizeObserver.observe(topbar);
    if (dock) mobileShellResizeObserver.observe(dock);
  }

  mobilePremiumHeaderBound = true;
  syncMobileState();
}

function setupActiveNavObserver() {
  const navLinks = Array.from(document.querySelectorAll(".nav-link[data-nav]"));
  const sections = navLinks
    .map((a) => {
      const href = a.getAttribute("href");
      if (!href || !isAnchor(href)) return null;
      try {
        return document.querySelector(href);
      } catch (error) {
        console.warn("[nav] enlace no válido para observer:", href, error);
        return null;
      }
    })
    .filter(Boolean);

  if (sections.length === 0) return;

  const setActiveLink = (sectionId) => {
    navLinks.forEach((a) => {
      a.removeAttribute("aria-current");
      a.classList.remove("is-active");
    });
    const active = navLinks.find((a) => a.getAttribute("href") === `#${sectionId}`);
    if (active) {
      active.setAttribute("aria-current", "true");
      active.classList.add("is-active");
    }
  };

  const getSectionByScroll = () => {
    const line = window.scrollY + getHeaderOffset() + 24;
    let current = sections[0];
    sections.forEach((section) => {
      if (section.offsetTop <= line) current = section;
    });
    return current?.id ?? null;
  };

  const syncFromScroll = () => {
    const currentSectionId = getSectionByScroll();
    if (currentSectionId) setActiveLink(currentSectionId);
  };

  syncFromScroll();

  let observer = null;
  const supportsObserver = "IntersectionObserver" in window;

  const buildObserver = () => {
    if (!supportsObserver) return;
    if (observer) observer.disconnect();

    const rootMarginTop = -Math.round(getHeaderOffset());
    observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => {
            if (b.intersectionRatio !== a.intersectionRatio) {
              return b.intersectionRatio - a.intersectionRatio;
            }
            return (
              Math.abs(a.boundingClientRect.top) -
              Math.abs(b.boundingClientRect.top)
            );
          })[0];

        if (visible?.target?.id) {
          setActiveLink(visible.target.id);
          return;
        }

        syncFromScroll();
      },
      {
        root: null,
        threshold: [0.2, 0.35, 0.55, 0.75],
        rootMargin: `${rootMarginTop}px 0px -55% 0px`,
      },
    );

    sections.forEach((section) => observer.observe(section));
  };

  buildObserver();

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(() => {
      syncFromScroll();
      ticking = false;
    });
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener(
    "resize",
    debounce(() => {
      setHeaderOffset();
      buildObserver();
      syncFromScroll();
    }, 170),
  );
}

function setupSmoothAnchorScroll() {
  const navLinks = Array.from(document.querySelectorAll(".nav-link[data-nav]"));
  const getScrollOffset = () => {
    setHeaderOffset();
    const rootStyles = getComputedStyle(document.documentElement);
    const mobileOffset = Number.parseFloat(
      rootStyles.getPropertyValue("--h-offset").trim(),
    );
    const desktopOffset = getHeaderOffset();
    const isMobile = window.matchMedia("(max-width: 768px)").matches;

    if (isMobile && Number.isFinite(mobileOffset) && mobileOffset > 0) {
      return mobileOffset;
    }

    return desktopOffset;
  };

  document.addEventListener("click", (e) => {
    if (e.defaultPrevented) return;

    const a = e.target.closest("a[href^='#']");
    if (!a) return;

    const href = a.getAttribute("href");
    if (!href || href === "#") return;

    const target = document.querySelector(href);
    if (!target) return;

    e.preventDefault();
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const scrollOffset = getScrollOffset();
    const targetTop =
      window.scrollY + target.getBoundingClientRect().top - scrollOffset - 8;

    window.scrollTo({
      top: Math.max(0, Math.round(targetTop)),
      left: 0,
      behavior: reduceMotion ? "auto" : "smooth",
    });

    const activeLink = navLinks.find((link) => link.getAttribute("href") === href);
    if (activeLink) {
      navLinks.forEach((link) => {
        link.removeAttribute("aria-current");
        link.classList.remove("is-active");
      });
      activeLink.setAttribute("aria-current", "true");
      activeLink.classList.add("is-active");
    }

    history.pushState(null, "", href);
  });
}

function setupHeaderScrollState() {
  const header = $(".site-header");
  if (!header) return;

  const scrolledClass = CONFIG.ui.headerScrolledClass;
  const threshold = 24;
  const mobileSolidQuery = window.matchMedia("(max-width: 520px)");
  let ticking = false;

  const syncState = () => {
    if (mobileSolidQuery.matches) {
      header.classList.remove(scrolledClass);
      return;
    }

    header.classList.toggle(scrolledClass, window.scrollY > threshold);
    setHeaderOffset();
  };

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(() => {
      syncState();
      ticking = false;
    });
  };

  syncState();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener(
    "resize",
    debounce(() => {
      syncState();
    }, 150),
  );
  window.addEventListener(
    "load",
    () => {
      syncState();
    },
    { once: true },
  );

  if (typeof mobileSolidQuery.addEventListener === "function") {
    mobileSolidQuery.addEventListener("change", syncState);
  } else if (typeof mobileSolidQuery.addListener === "function") {
    mobileSolidQuery.addListener(syncState);
  }
}

function setupRevealAnimations() {
  const targets = Array.from(
    document.querySelectorAll(
      ".section > .container, .site-footer .container",
    ),
  );
  if (targets.length === 0) return;

  targets.forEach((el, index) => {
    el.classList.add("reveal");
    el.style.setProperty("--reveal-delay", `${Math.min(index * 45, 280)}ms`);
  });

  if (!("IntersectionObserver" in window)) {
    targets.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.18, rootMargin: "0px 0px -40px 0px" },
  );

  targets.forEach((el) => observer.observe(el));
}

function setupHomeDataAnimateReveal() {
  if (!document.body.classList.contains("page-home")) return;

  const targets = Array.from(document.querySelectorAll("[data-animate]"));
  if (targets.length === 0) return;

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  if (reduceMotion || !("IntersectionObserver" in window)) {
    targets.forEach((el) => el.classList.add("is-inview"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-inview");
        observer.unobserve(entry.target);
      });
    },
    {
      threshold: 0.22,
      rootMargin: "0px 0px -12% 0px",
    },
  );

  targets.forEach((el) => observer.observe(el));
}

function setupBackToTopButton() {
  const btn = $("#back-to-top");
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

  btn.addEventListener("click", (e) => {
    e.preventDefault();

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: reduceMotion ? "auto" : "smooth",
    });

    // Evita dejar "#top" en la URL al usar el botón flotante.
    if (location.hash === "#top") {
      history.replaceState(null, "", `${location.pathname}${location.search}`);
    }
  });
}

/* ----------------------------- Modal (Looker fullscreen) ----------------------------- */

function setupLookerModal() {
  const openBtn = $("#looker-fullscreen");
  const modal = $("#modal");
  const overlay = modal?.querySelector(".modal__overlay");
  const closeBtn = $("#modal-close");
  const modalIframe = $("#modal-iframe");
  const lookerIframe = $("#looker-iframe");

  if (
    !openBtn ||
    !modal ||
    !overlay ||
    !closeBtn ||
    !modalIframe ||
    !lookerIframe
  )
    return;

  let lastFocused = null;

  function openModal() {
    if (openBtn.disabled || openBtn.getAttribute("aria-disabled") === "true")
      return;

    lastFocused = document.activeElement;

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");

    // clonar src del iframe principal
    modalIframe.src = lookerIframe.src;

    // bloquear scroll
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    closeBtn.focus();
  }

  function closeModal() {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");

    // liberar scroll
    document.documentElement.style.overflow = "";
    document.body.style.overflow = "";

    // liberar iframe (evita audio/uso innecesario)
    modalIframe.src = "";

    if (lastFocused && typeof lastFocused.focus === "function") {
      lastFocused.focus();
    }
  }

  openBtn.addEventListener("click", openModal);
  closeBtn.addEventListener("click", closeModal);
  overlay.addEventListener("click", (e) => {
    if (e.target && e.target.dataset.close === "true") closeModal();
  });

  document.addEventListener("keydown", (e) => {
    if (!modal.classList.contains("is-open")) return;
    if (e.key === "Escape") closeModal();
  });

  // focus trap simple
  modal.addEventListener("keydown", (e) => {
    if (!modal.classList.contains("is-open")) return;
    if (e.key !== "Tab") return;

    const focusables = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    const list = Array.from(focusables).filter(
      (el) => !el.hasAttribute("disabled"),
    );
    if (list.length === 0) return;

    const first = list[0];
    const last = list[list.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });
}

/* ----------------------------- Init ----------------------------- */

function init() {
  setupStationBridge();
  setMetaText();
  renderPartnerLogos();
  initEmbeds();
  renderGuides();
  renderRoles();
  initHomeAlgorithm();
  setupAlgoFlowModalLifecycle();
  renderTimelinePlaceholder();
  renderEmbeds();

  setupMobileNav();
  setupHomeMobileBottomNavDock();
  initMobilePremiumHeader();
  setupHeaderScrollState();
  setHeaderOffset();
  updateMobileBars();
  setupActiveNavObserver();
  setupSmoothAnchorScroll();
  setupRevealAnimations();
  setupHomeDataAnimateReveal();
  setupBackToTopButton();
  setupLookerModal();

  window.addEventListener(
    "resize",
    () => {
      window.clearTimeout(mobileBarsResizeTimer);
      mobileBarsResizeTimer = window.setTimeout(() => {
        setupHomeMobileBottomNavDock();
        setHeaderOffset();
        updateMobileBars();
      }, 120);
    },
    { passive: true },
  );

  window.addEventListener("orientationchange", () => {
    setupHomeMobileBottomNavDock();
    setHeaderOffset();
    updateMobileBars();
  });

  if ("ResizeObserver" in window && !mobileBarsObserver) {
    mobileBarsObserver = new ResizeObserver(() => {
      setHeaderOffset();
      updateMobileBars();
    });
    const topbar = $("#siteTopbar") || $(".topbar");
    const header = $(".site-header");
    const dock =
      document.querySelector("#mobile-fixed-dock") ||
      document.querySelector(".site-nav .nav-list");
    if (header) mobileBarsObserver.observe(header);
    if (topbar) mobileBarsObserver.observe(topbar);
    if (dock) mobileBarsObserver.observe(dock);
  }

  // Footer year (si existe nodo dinámico)
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
}

document.addEventListener("DOMContentLoaded", init);
