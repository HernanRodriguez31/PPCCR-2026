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
        key: "estructuraPrograma",
        title: "Estructura del programa",
        meta: "PDF / Documento",
        url: "PEGAR_AQUI_URL_ESTRUCTURA_DEL_PROGRAMA",
      },
      {
        key: "algoritmoRiesgo",
        title: "Algoritmo / Criterios de riesgo",
        meta: "Herramienta clínica",
        url: "/algoritmo.html",
      },
      {
        key: "rolesResponsabilidades",
        title: "Roles y responsabilidades",
        meta: "PDF / Documento",
        url: "PEGAR_AQUI_URL_ROLES_RESPONSABILIDADES",
      },
      {
        key: "manejoKitFIT",
        title: "Manejo de kit FIT",
        meta: "PDF / Documento",
        url: "PEGAR_AQUI_URL_MANEJO_KIT_FIT",
      },
      {
        key: "entregaMuestras",
        title: "Entrega de muestras",
        meta: "PDF / Documento",
        url: "PEGAR_AQUI_URL_ENTREGA_MUESTRAS",
      },
      {
        key: "workflow",
        title: "Workflow operativo",
        meta: "PDF / Documento",
        url: "PEGAR_AQUI_URL_WORKFLOW",
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
            label: "Entrega de Kit de FIT a pacientes",
            url: "https://kitfit.programadeprevencion.com",
          },
          {
            key: "recepcionMuestraFIT",
            label: "Recepción de Muestra de Test FIT",
            url: "https://recepcionmuestra.programadeprevencion.com",
          },
          {
            key: "envioMuestrasLaboratorio",
            label: "Envío de Muestras de FIT al Laboratorio",
            url: "https://enviolab.programadeprevencion.com",
          },
          {
            key: "recepcionResultadosFIT",
            label: "Recepción de Resultados de FIT",
            url: "https://recepcionresultados.programadeprevencion.com",
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
            url: "https://entrevista.programadeprevencion.com",
          },
          {
            key: "informePacienteResultadoFIT",
            label: "Informe al paciente del resultado del Test FIT",
            url: "https://informeprograma.programadeprevencion.com",
          },
        ],
      },

      pacientes: {
        title: "Participantes",
        desc: "Cuestionario / evaluación inicial del programa.",
        items: [
          {
            key: "evaluacionInicialSalud",
            label: "Formularios de evaluación inicial de salud",
            url: "https://cuestionario.programadeprevencion.com",
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

function updateEmbedLoadState(wrapperEl, state) {
  if (!wrapperEl) return;

  const { embedLoadingClass, embedReadyClass } = CONFIG.ui;
  wrapperEl.classList.remove(embedLoadingClass, embedReadyClass);

  if (state === "loading") wrapperEl.classList.add(embedLoadingClass);
  if (state === "ready") wrapperEl.classList.add(embedReadyClass);
}

function loadEmbedWithSkeleton(iframeEl, wrapperEl, src) {
  if (!iframeEl || !src) return;

  if (wrapperEl) {
    updateEmbedLoadState(wrapperEl, "loading");

    iframeEl.addEventListener(
      "load",
      () => {
        updateEmbedLoadState(wrapperEl, "ready");
      },
      { once: true },
    );
  }

  iframeEl.src = src;
}

/* ----------------------------- Renderers ----------------------------- */

function renderPartnerLogos() {
  const wrap = $("#partner-logos");
  const footerWrap = $("#footer-logos");
  if (!wrap || !footerWrap) return;

  const partners = [
    { key: "fep", ...CONFIG.assets.logos.fep },
    { key: "gedyt", ...CONFIG.assets.logos.gedyt },
    { key: "merck", ...CONFIG.assets.logos.merck },
    { key: "gcba", ...CONFIG.assets.logos.gcba },
  ];

  partners.forEach((p) => {
    // Header strip item
    const chip = document.createElement("div");
    chip.className = "partner-logo";
    chip.dataset.partner = p.key;

    const img = document.createElement("img");
    img.src = p.src;
    img.alt = p.alt;
    img.loading = "lazy";
    img.decoding = "async";
    img.dataset.partner = p.key;

    const label = document.createElement("span");
    label.textContent = p.alt;

    chip.appendChild(img);
    chip.appendChild(label);
    wrap.appendChild(chip);

    // Footer mini logo
    const fImg = document.createElement("img");
    fImg.src = p.src;
    fImg.alt = p.alt;
    fImg.loading = "lazy";
    fImg.decoding = "async";
    fImg.dataset.partner = p.key;
    footerWrap.appendChild(fImg);
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

  CONFIG.links.guias.forEach((g) => {
    const a = document.createElement("a");
    a.className = "pill";
    a.dataset.key = g.key;

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

  const roles = [{ key: "enfermeria" }, { key: "medicos" }, { key: "pacientes" }];

  roles.forEach((r) => {
    const roleCfg = CONFIG.links.formularios[r.key];
    if (!roleCfg) return;

    const card = document.createElement("article");
    card.className = "role-card";

    const header = document.createElement("div");
    header.className = "role-card__header";

    const h = document.createElement("h3");
    h.className = "role-card__title";
    h.textContent = roleCfg.title;

    const desc = document.createElement("p");
    desc.className = "role-card__desc";
    desc.textContent = roleCfg.desc;

    header.appendChild(h);
    header.appendChild(desc);

    const body = document.createElement("div");
    body.className = "role-card__body";

    const actions = document.createElement("div");
    actions.className = "role-actions";

    roleCfg.items.forEach((item) => {
      const a = document.createElement("a");
      a.className = "role-link";
      a.dataset.key = item.key;

      const icon = document.createElement("span");
      icon.className = "role-link__icon";
      icon.setAttribute("aria-hidden", "true");
      icon.innerHTML =
        roleFormIcons[item.key] ||
        '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="6" y="4.5" width="12" height="15" rx="2"></rect><path d="M9 9h6"></path><path d="M9 12.5h6"></path></svg>';

      const label = document.createElement("span");
      label.className = "role-link__label";
      label.textContent = item.label;

      const chev = document.createElement("span");
      chev.className = "role-link__chev";
      chev.setAttribute("aria-hidden", "true");
      chev.textContent = "↗";

      a.appendChild(icon);
      a.appendChild(label);
      a.appendChild(chev);

      // Formularios SIEMPRE nueva pestaña
      safeSetLink(a, item.url, { newTab: true });

      if (!item.url || isPlaceholderUrl(item.url)) {
        a.setAttribute("aria-label", `${item.label} (URL pendiente)`);
      }

      actions.appendChild(a);
    });

    body.appendChild(actions);
    card.appendChild(header);
    card.appendChild(body);
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
    updateEmbedLoadState(calWrap, "idle");
    calFallback.hidden = false;
    calHint.textContent = "Falta pegar URL de calendario (embed).";
  }
}

function setMetaText() {
  const brandKickerEl = $("#brand-kicker");
  if (brandKickerEl) {
    const unitLabel = String(CONFIG.meta.unitLabel || "").trim();
    brandKickerEl.textContent = unitLabel;
    brandKickerEl.hidden = unitLabel.length === 0;
  }

  const yearLabel = String(CONFIG.meta.yearLabel || "").trim();
  const programSuffix = yearLabel ? ` – ${yearLabel}` : "";
  const heroSuffix = yearLabel ? ` (${yearLabel})` : "";

  $("#brand-title").textContent = `${CONFIG.meta.programName}${programSuffix}`;
  $("#hero-title").textContent = `Accesos rápidos del programa${heroSuffix}`;

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

function setupActiveNavObserver() {
  const navLinks = Array.from(document.querySelectorAll(".nav-link[data-nav]"));
  const sections = navLinks
    .map((a) => document.querySelector(a.getAttribute("href")))
    .filter(Boolean);

  if (!("IntersectionObserver" in window) || sections.length === 0) return;

  const obs = new IntersectionObserver(
    (entries) => {
      // Tomamos la sección más visible
      const visible = entries
        .filter((en) => en.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (!visible) return;

      navLinks.forEach((a) => a.removeAttribute("aria-current"));
      const activeLink = navLinks.find(
        (a) => a.getAttribute("href") === `#${visible.target.id}`,
      );
      if (activeLink) activeLink.setAttribute("aria-current", "page");
    },
    { root: null, threshold: [0.2, 0.4, 0.6] },
  );

  sections.forEach((s) => obs.observe(s));
}

function setupSmoothAnchorScroll() {
  document.addEventListener("click", (e) => {
    if (e.defaultPrevented) return;

    const a = e.target.closest("a[href^='#']");
    if (!a) return;

    const href = a.getAttribute("href");
    if (!href || href === "#") return;

    const target = document.querySelector(href);
    if (!target) return;

    e.preventDefault();
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    history.pushState(null, "", href);
  });
}

function setupHeaderScrollState() {
  const header = $(".site-header");
  if (!header) return;

  const scrolledClass = CONFIG.ui.headerScrolledClass;
  const threshold = 24;
  let ticking = false;

  const syncState = () => {
    header.classList.toggle(scrolledClass, window.scrollY > threshold);
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
  setMetaText();
  renderPartnerLogos();
  renderGuides();
  renderRoles();
  renderTimelinePlaceholder();
  renderEmbeds();

  setupMobileNav();
  setupHeaderScrollState();
  setupActiveNavObserver();
  setupSmoothAnchorScroll();
  setupRevealAnimations();
  setupBackToTopButton();
  setupLookerModal();

  // Footer year (si existe nodo dinámico)
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
}

document.addEventListener("DOMContentLoaded", init);
