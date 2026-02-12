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
        url: "#algoritmo",
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

let homeAlgorithmState = null;

/* ----------------------------- Helpers ----------------------------- */

const $ = (sel, ctx = document) => ctx.querySelector(sel);

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

  const roles = [{ key: "enfermeria" }, { key: "medicos" }, { key: "pacientes" }];

  roles.forEach((r, roleIndex) => {
    const roleCfg = CONFIG.links.formularios[r.key];
    if (!roleCfg) return;

    const card = document.createElement("article");
    card.className = "role-card";
    card.dataset.animate = "";
    card.style.setProperty("--delay", `${120 + roleIndex * 70}ms`);

    const header = document.createElement("header");
    header.className = "role-card__header";

    const h = document.createElement("h3");
    h.className = "role-card__title";
    h.textContent = roleCfg.title;

    const desc = document.createElement("p");
    desc.className = "role-card__desc";
    desc.textContent = roleCfg.desc;

    header.appendChild(h);
    header.appendChild(desc);

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

    card.appendChild(header);
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

function setHomeAlgorithmFeedback(message, tone = "neutral") {
  if (!homeAlgorithmState?.step1Feedback) return;
  homeAlgorithmState.step1Feedback.textContent = message;
  homeAlgorithmState.step1Feedback.dataset.tone = tone;
}

function getHomeAlgorithmMaxStep() {
  if (!homeAlgorithmState) return ALGORITHM_HOME.steps.AGE;
  return homeAlgorithmState.currentStep >= ALGORITHM_HOME.steps.VIGILANCE
    ? ALGORITHM_HOME.steps.VIGILANCE
    : ALGORITHM_HOME.steps.AGE;
}

function renderHomeAlgorithmStepper() {
  if (!homeAlgorithmState) return;
  const maxStep = getHomeAlgorithmMaxStep();

  homeAlgorithmState.stepButtons.forEach((button) => {
    const step = Number(button.dataset.homeAlgoStepTarget || "");
    if (!Number.isFinite(step)) return;
    const isCurrent = step === homeAlgorithmState.currentStep;
    const isComplete = step < homeAlgorithmState.currentStep;
    const isLocked = step > maxStep;

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
    panel.hidden = step !== homeAlgorithmState.currentStep;
  });
}

function renderHomeAlgorithmSexButtons() {
  if (!homeAlgorithmState) return;
  const selected = homeAlgorithmState.selectedSex;

  homeAlgorithmState.sexButtons.forEach((button) => {
    const value = String(button.dataset.homeAlgoSex || "");
    const isSelected = selected !== "" && value === selected;
    button.classList.toggle("is-selected", isSelected);
    button.setAttribute("aria-checked", String(isSelected));
  });
}

function resetHomeAlgorithmStep1Evaluation() {
  if (!homeAlgorithmState) return;
  homeAlgorithmState.evaluated = false;
  homeAlgorithmState.eligible = false;
  homeAlgorithmState.savedOutcome = "";

  homeAlgorithmState.step1Stop.hidden = true;
  homeAlgorithmState.step1Ok.hidden = true;
  homeAlgorithmState.step1Finish.hidden = true;
  homeAlgorithmState.step1Continue.hidden = true;
  homeAlgorithmState.saveStatus.textContent = "";

  if (homeAlgorithmState.currentStep > ALGORITHM_HOME.steps.AGE) {
    homeAlgorithmState.currentStep = ALGORITHM_HOME.steps.AGE;
    renderHomeAlgorithmPanels();
  }
  renderHomeAlgorithmStepper();
}

function sanitizeHomeAlgorithmInputs() {
  if (!homeAlgorithmState) return;

  const participantRaw = String(homeAlgorithmState.participantInput.value || "");
  const participantNormalized = participantRaw.replace(/\D+/g, "").slice(0, 24);
  if (participantNormalized !== participantRaw) {
    homeAlgorithmState.participantInput.value = participantNormalized;
  }

  const ageRaw = String(homeAlgorithmState.ageInput.value || "").trim();
  if (ageRaw === "") return;
  const age = Number.parseInt(ageRaw, 10);
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

function getHomeAlgorithmStep1Values() {
  if (!homeAlgorithmState) {
    return { ok: false, message: "No se pudo iniciar la Etapa 1 del algoritmo." };
  }

  const participantNumber = String(homeAlgorithmState.participantInput.value || "").trim();
  if (!/^\d{1,24}$/.test(participantNumber)) {
    return { ok: false, message: "Ingresá un número de participante válido." };
  }

  const ageRaw = String(homeAlgorithmState.ageInput.value || "").trim();
  if (ageRaw === "") {
    return { ok: false, message: "Ingresá la edad para evaluar inclusión." };
  }

  const age = Number.parseInt(ageRaw, 10);
  if (!Number.isFinite(age) || age < 0 || age > 120) {
    return { ok: false, message: "La edad debe estar entre 0 y 120 años." };
  }

  const stationName = normalizeAlgorithmStationName(homeAlgorithmState.stationSelect.value);
  if (!stationName) {
    return { ok: false, message: "Seleccioná una estación saludable válida." };
  }

  const sex = String(homeAlgorithmState.selectedSex || "").trim();
  if (!sex) {
    return { ok: false, message: "Seleccioná el sexo (M, Otros o F)." };
  }

  return {
    ok: true,
    values: {
      participantNumber,
      stationName,
      sex,
      age,
    },
  };
}

function setHomeAlgorithmBusyState(isBusy) {
  if (!homeAlgorithmState) return;

  homeAlgorithmState.step1Evaluate.disabled = isBusy;
  homeAlgorithmState.step1Finish.disabled = isBusy;
  homeAlgorithmState.step1Continue.disabled = isBusy;
}

async function postHomeAlgorithmStage1(endpoint, payload) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  let json = null;
  try {
    json = await response.json();
  } catch (_error) {
    // respuesta no JSON
  }

  if (!response.ok) {
    const message = json?.message || "No se pudo guardar la Etapa 1.";
    throw new Error(message);
  }
  if (!json || json.ok !== true) {
    throw new Error("Respuesta inválida del guardado de Etapa 1.");
  }

  return json;
}

async function submitHomeAlgorithmStage1(payload) {
  const primaryEndpoint = String(CONFIG.integrations?.algorithmStage1Endpoint || "").trim();
  const fallbackEndpoint = String(
    CONFIG.integrations?.algorithmStage1FallbackEndpoint || "",
  ).trim();

  if (!primaryEndpoint && !fallbackEndpoint) {
    throw new Error("No hay endpoint configurado para guardar Etapa 1.");
  }

  if (primaryEndpoint) {
    try {
      return await postHomeAlgorithmStage1(primaryEndpoint, payload);
    } catch (primaryError) {
      if (!fallbackEndpoint || fallbackEndpoint === primaryEndpoint) {
        throw primaryError;
      }
    }
  }

  return postHomeAlgorithmStage1(fallbackEndpoint, payload);
}

function buildHomeAlgorithmSaveStatusMessage(responsePayload) {
  const sheetsStatus = String(responsePayload?.sheets?.status || "").toLowerCase();
  const backupStatus = String(responsePayload?.backup?.status || "").toLowerCase();

  if (sheetsStatus === "saved" && backupStatus === "saved") {
    return "Etapa 1 guardada en Google Sheets y respaldo Firebase.";
  }
  if (sheetsStatus === "saved") {
    return "Etapa 1 guardada en Google Sheets.";
  }
  if (backupStatus === "saved" && sheetsStatus === "not_configured") {
    return "Etapa 1 guardada en Firebase. Falta configurar integración con Google Sheets.";
  }
  if (backupStatus === "saved") {
    return "Etapa 1 guardada en Firebase (Google Sheets pendiente).";
  }
  return "Etapa 1 procesada.";
}

function fillHomeAlgorithmModal(values) {
  if (!homeAlgorithmState) return;

  homeAlgorithmState.modalParticipant.textContent = values.participantNumber || "-";
  homeAlgorithmState.modalStation.textContent = values.stationName || "-";
  homeAlgorithmState.modalSex.textContent = values.sex || "-";
  homeAlgorithmState.modalAge.textContent = Number.isFinite(values.age)
    ? `${values.age} años`
    : "-";
}

function openHomeAlgorithmModal(message, values) {
  if (!homeAlgorithmState) return;

  homeAlgorithmState.modalText.textContent = message;
  fillHomeAlgorithmModal(values);
  homeAlgorithmState.modal.hidden = false;
  homeAlgorithmState.modal.setAttribute("aria-hidden", "false");
  homeAlgorithmState.modalDialog.focus();
}

function closeHomeAlgorithmModal() {
  if (!homeAlgorithmState) return;
  if (homeAlgorithmState.modal.hidden) return;

  homeAlgorithmState.modal.hidden = true;
  homeAlgorithmState.modal.setAttribute("aria-hidden", "true");
}

async function persistHomeAlgorithmStage1(values, outcome) {
  if (!homeAlgorithmState) {
    throw new Error("No se pudo preparar el guardado de Etapa 1.");
  }

  const payload = {
    participantNumber: values.participantNumber,
    stationName: values.stationName,
    sex: values.sex,
    age: values.age,
    outcome,
    criterionAge: ALGORITHM_HOME.minAge,
    source: "home",
    submittedAt: new Date().toISOString(),
  };

  setHomeAlgorithmBusyState(true);
  homeAlgorithmState.saveStatus.textContent = "Guardando Etapa 1...";

  try {
    const responsePayload = await submitHomeAlgorithmStage1(payload);
    homeAlgorithmState.savedOutcome = outcome;
    homeAlgorithmState.saveStatus.textContent = buildHomeAlgorithmSaveStatusMessage(
      responsePayload,
    );
    return responsePayload;
  } catch (error) {
    homeAlgorithmState.saveStatus.textContent =
      error instanceof Error ? error.message : "Error inesperado al guardar la Etapa 1.";
    throw error;
  } finally {
    setHomeAlgorithmBusyState(false);
  }
}

function syncHomeAlgorithmStationFromBridge({ force = false } = {}) {
  if (!homeAlgorithmState?.stationSelect) return;
  if (homeAlgorithmState.stationEditedByUser && !force) return;

  const stationFromBridge =
    window.PPCCR?.getActiveStation && typeof window.PPCCR.getActiveStation === "function"
      ? window.PPCCR.getActiveStation()
      : null;
  const stationName = normalizeAlgorithmStationName(
    stationFromBridge?.stationName || stationFromBridge?.name || "",
  );
  if (!stationName) return;

  homeAlgorithmState.stationSelect.value = stationName;
}

function goToHomeAlgorithmStep(step) {
  if (!homeAlgorithmState) return;
  const target = Number(step);
  if (!Number.isFinite(target)) return;

  const bounded = Math.min(
    Math.max(target, ALGORITHM_HOME.steps.AGE),
    ALGORITHM_HOME.steps.DECISION,
  );
  const maxStep = getHomeAlgorithmMaxStep();
  homeAlgorithmState.currentStep = Math.min(bounded, maxStep);
  renderHomeAlgorithmPanels();
  renderHomeAlgorithmStepper();
}

function evaluateHomeAlgorithmStep1() {
  if (!homeAlgorithmState) return;
  sanitizeHomeAlgorithmInputs();

  const result = getHomeAlgorithmStep1Values();
  if (!result.ok) {
    setHomeAlgorithmFeedback(result.message, "danger");
    homeAlgorithmState.step1Stop.hidden = true;
    homeAlgorithmState.step1Ok.hidden = true;
    homeAlgorithmState.step1Finish.hidden = true;
    homeAlgorithmState.step1Continue.hidden = true;
    return;
  }

  const { values } = result;
  homeAlgorithmState.lastStep1Values = values;
  homeAlgorithmState.evaluated = true;
  homeAlgorithmState.eligible = values.age >= ALGORITHM_HOME.minAge;
  homeAlgorithmState.savedOutcome = "";
  homeAlgorithmState.saveStatus.textContent = "";

  if (homeAlgorithmState.eligible) {
    homeAlgorithmState.step1Stop.hidden = true;
    homeAlgorithmState.step1Ok.hidden = false;
    homeAlgorithmState.step1Finish.hidden = true;
    homeAlgorithmState.step1Continue.hidden = false;
    setHomeAlgorithmFeedback("Criterio de edad cumplido. Podés avanzar a Etapa 2.", "success");
    return;
  }

  homeAlgorithmState.step1Stop.hidden = false;
  homeAlgorithmState.step1Ok.hidden = true;
  homeAlgorithmState.step1Finish.hidden = false;
  homeAlgorithmState.step1Continue.hidden = true;
  setHomeAlgorithmFeedback(
    "No cumple criterio por edad. Finalizá la Etapa 1 para registrar el caso.",
    "danger",
  );
}

async function onHomeAlgorithmFinishStep1() {
  if (!homeAlgorithmState?.evaluated || homeAlgorithmState.eligible) return;
  const values = homeAlgorithmState.lastStep1Values;
  if (!values) return;

  try {
    await persistHomeAlgorithmStage1(values, "sin_criterio_inclusion_edad");
    openHomeAlgorithmModal("Sin criterios de inclusion al programa.", values);
  } catch (_error) {
    // feedback visible en save status
  }
}

async function onHomeAlgorithmContinueStep1() {
  if (!homeAlgorithmState?.evaluated || !homeAlgorithmState.eligible) return;
  const values = homeAlgorithmState.lastStep1Values;
  if (!values) return;

  try {
    await persistHomeAlgorithmStage1(values, "cumple_criterio_edad");
    homeAlgorithmState.currentStep = ALGORITHM_HOME.steps.VIGILANCE;
    renderHomeAlgorithmPanels();
    renderHomeAlgorithmStepper();
    setHomeAlgorithmFeedback("Etapa 1 registrada. Continúa en Etapa 2.", "success");
  } catch (_error) {
    // feedback visible en save status
  }
}

function initHomeAlgorithm() {
  const root = $("#home-algo");
  if (!root) return;

  homeAlgorithmState = {
    root,
    currentStep: ALGORITHM_HOME.steps.AGE,
    evaluated: false,
    eligible: false,
    selectedSex: "",
    savedOutcome: "",
    stationEditedByUser: false,
    lastStep1Values: null,
    stepButtons: Array.from(root.querySelectorAll("[data-home-algo-step-target]")),
    stepPanels: Array.from(root.querySelectorAll("[data-home-algo-step-panel]")),
    participantInput: $("#home-algo-participant"),
    stationSelect: $("#home-algo-station"),
    ageInput: $("#home-algo-age"),
    sexButtons: Array.from(root.querySelectorAll("[data-home-algo-sex]")),
    step1Feedback: $("#home-algo-step1-feedback"),
    step1Stop: $("#home-algo-step1-stop"),
    step1Ok: $("#home-algo-step1-ok"),
    step1Evaluate: $("#home-algo-step1-evaluate"),
    step1Finish: $("#home-algo-step1-finish"),
    step1Continue: $("#home-algo-step1-continue"),
    saveStatus: $("#home-algo-step1-save-status"),
    modal: $("#home-algo-finish-modal"),
    modalDialog: $(".home-algo__modal-card"),
    modalText: $("#home-algo-modal-text"),
    modalParticipant: $("#home-algo-modal-participant"),
    modalStation: $("#home-algo-modal-station"),
    modalSex: $("#home-algo-modal-sex"),
    modalAge: $("#home-algo-modal-age"),
  };

  if (
    !homeAlgorithmState.participantInput ||
    !homeAlgorithmState.stationSelect ||
    !homeAlgorithmState.ageInput ||
    !homeAlgorithmState.step1Evaluate ||
    !homeAlgorithmState.step1Finish ||
    !homeAlgorithmState.step1Continue ||
    !homeAlgorithmState.modal ||
    !homeAlgorithmState.modalDialog
  ) {
    homeAlgorithmState = null;
    return;
  }

  syncHomeAlgorithmStationFromBridge({ force: true });
  renderHomeAlgorithmStepper();
  renderHomeAlgorithmPanels();
  renderHomeAlgorithmSexButtons();

  homeAlgorithmState.stepButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const step = Number(button.dataset.homeAlgoStepTarget || "");
      goToHomeAlgorithmStep(step);
    });
  });

  homeAlgorithmState.sexButtons.forEach((button) => {
    button.addEventListener("click", () => {
      homeAlgorithmState.selectedSex = String(button.dataset.homeAlgoSex || "");
      renderHomeAlgorithmSexButtons();
      resetHomeAlgorithmStep1Evaluation();
      setHomeAlgorithmFeedback("Sexo seleccionado. Completá o revisá el resto de los datos.");
    });
  });

  homeAlgorithmState.participantInput.addEventListener("input", () => {
    sanitizeHomeAlgorithmInputs();
    resetHomeAlgorithmStep1Evaluation();
  });

  homeAlgorithmState.ageInput.addEventListener("input", () => {
    sanitizeHomeAlgorithmInputs();
    resetHomeAlgorithmStep1Evaluation();
  });

  homeAlgorithmState.stationSelect.addEventListener("change", () => {
    homeAlgorithmState.stationEditedByUser = true;
    resetHomeAlgorithmStep1Evaluation();
  });

  homeAlgorithmState.step1Evaluate.addEventListener("click", evaluateHomeAlgorithmStep1);
  homeAlgorithmState.step1Finish.addEventListener("click", onHomeAlgorithmFinishStep1);
  homeAlgorithmState.step1Continue.addEventListener("click", onHomeAlgorithmContinueStep1);

  homeAlgorithmState.modal.addEventListener("click", (event) => {
    const shouldClose = event.target.closest("[data-home-algo-close-modal='true']");
    if (shouldClose) closeHomeAlgorithmModal();
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
