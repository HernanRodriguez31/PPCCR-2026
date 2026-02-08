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
        src: "assets/logo-fep.png",
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
        meta: "PDF / Documento",
        url: "PEGAR_AQUI_URL_ALGORITMO_CRITERIOS_RIESGO",
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
      {
        key: "reporteConsolidado",
        title: "Reporte consolidado",
        meta: "Ir a sección",
        url: "#kpis",
      },
    ],

    /**
     * Formularios por rol (solo links; deben abrir en nueva pestaña).
     */
    formularios: {
      enfermeria: {
        title: "Enfermería",
        desc: "Registro operativo de kits, muestras y resultados.",
        items: [
          {
            key: "entregaKitFIT",
            label: "Entrega de Kit de FIT a pacientes",
            url: "PEGAR_AQUI_URL_FORM_ENTREGA_KIT_FIT",
          },
          {
            key: "recepcionMuestraFIT",
            label: "Recepción de Muestra de Test FIT",
            url: "PEGAR_AQUI_URL_FORM_RECEPCION_MUESTRA_FIT",
          },
          {
            key: "envioMuestrasLaboratorio",
            label: "Envío de Muestras de FIT al Laboratorio",
            url: "PEGAR_AQUI_URL_FORM_ENVIO_MUESTRAS_LAB",
          },
          {
            key: "recepcionResultadosFIT",
            label: "Recepción de Resultados de FIT",
            url: "PEGAR_AQUI_URL_FORM_RECEPCION_RESULTADOS_FIT",
          },
        ],
      },

      medicos: {
        title: "Médicos",
        desc: "Entrevista clínica e informe de resultado FIT al paciente.",
        items: [
          {
            key: "entrevistaMedica",
            label: "Entrevista médica (presencial)",
            url: "PEGAR_AQUI_URL_FORM_ENTREVISTA_MEDICA",
          },
          {
            key: "informePacienteResultadoFIT",
            label: "Informe al paciente del resultado del Test FIT",
            url: "PEGAR_AQUI_URL_FORM_INFORME_PACIENTE_RESULTADO_FIT",
          },
        ],
      },

      pacientes: {
        title: "Pacientes",
        desc: "Cuestionario / evaluación inicial del programa.",
        items: [
          {
            key: "evaluacionInicialSalud",
            label: "Formularios de evaluación inicial de salud",
            url: "PEGAR_AQUI_URL_FORM_EVALUACION_INICIAL",
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
      openUrl: "PEGAR_AQUI_URL_CALENDARIO_ABRIR",
      embedUrl: "PEGAR_AQUI_URL_CALENDARIO_EMBED",
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
      "Períodos críticos del despliegue qFIT mientras se integra el calendario en vivo.",
    phases: [
      {
        id: "etapa-1",
        stageLabel: "Etapa 1",
        periodLabel: "Semana 1 · 01-07 Mar",
        startDate: "2026-03-01",
        endDate: "2026-03-07",
        title: "Capacitación y alistamiento operativo",
        objective: "Asegurar capacidades, materiales y circuitos validados.",
        highlights: [
          "Capacitación técnica completada para personal y referentes operativos.",
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
        periodLabel: "09-22 Mar",
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
        periodLabel: "23 Mar-01 Abr",
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
    estructuraPrograma: "📁",
    algoritmoRiesgo: "🧭",
    rolesResponsabilidades: "👥",
    manejoKitFIT: "🧪",
    entregaMuestras: "📦",
    workflow: "🔁",
    kpis: "📊",
    reporteConsolidado: "🧾",
  };

  CONFIG.links.guias.forEach((g) => {
    const a = document.createElement("a");
    a.className = "pill";
    a.dataset.key = g.key;

    const icon = document.createElement("span");
    icon.className = "pill__icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = iconMap[g.key] || "📄";

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

    // Guías: si son documentos externos/PDF, suele convenir nueva pestaña.
    // Si es ancla (#...), queda en la misma.
    const openInNewTab = !isAnchor(g.url);
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

  const roles = [
    { key: "enfermeria", icon: "🧑‍⚕️" },
    { key: "medicos", icon: "🩺" },
    { key: "pacientes", icon: "🧾" },
  ];

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
      icon.textContent = r.icon;

      const label = document.createElement("span");
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

  phases.forEach((phaseCfg, index) => {
    const item = document.createElement("li");
    item.className = "phase-card";
    item.id = phaseCfg.id || `etapa-${index + 1}`;

    const stage = document.createElement("span");
    stage.className = "phase-stage";
    stage.textContent = phaseCfg.stageLabel || `Etapa ${index + 1}`;

    const period = document.createElement("p");
    period.className = "phase-period";

    const periodTime = document.createElement("time");
    periodTime.textContent = phaseCfg.periodLabel || "";
    if (phaseCfg.startDate && phaseCfg.endDate) {
      periodTime.dateTime = `${phaseCfg.startDate}/${phaseCfg.endDate}`;
    } else if (phaseCfg.startDate) {
      periodTime.dateTime = phaseCfg.startDate;
    }
    period.appendChild(periodTime);

    const titleEl = document.createElement("h3");
    titleEl.className = "phase-title";
    titleEl.textContent = phaseCfg.title || "";

    const objective = document.createElement("p");
    objective.className = "phase-objective";
    const objectiveLabel = document.createElement("strong");
    objectiveLabel.textContent = "Objetivo:";
    objective.appendChild(objectiveLabel);
    objective.appendChild(document.createTextNode(` ${phaseCfg.objective || ""}`));

    const highlightsLabel = document.createElement("p");
    highlightsLabel.className = "phase-highlights-label";
    highlightsLabel.textContent = "Hitos clave";

    const highlightsList = document.createElement("ul");
    highlightsList.className = "phase-highlights";
    (Array.isArray(phaseCfg.highlights) ? phaseCfg.highlights : [])
      .slice(0, 3)
      .forEach((highlight) => {
        const li = document.createElement("li");
        li.textContent = highlight;
        highlightsList.appendChild(li);
      });

    item.appendChild(stage);
    item.appendChild(period);
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
      summary.textContent = "Ver detalles operativos";
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
    lookerHint.textContent =
      "Si ves “permiso requerido”, revisá la compartición del reporte.";
    lookerFullscreenBtn.removeAttribute("aria-disabled");
    lookerFullscreenBtn.disabled = false;
  } else {
    lookerIframe.removeAttribute("src");
    updateEmbedLoadState(lookerWrap, "idle");
    lookerFallback.hidden = false;
    lookerHint.textContent = "Falta configurar URL de embed.";
    lookerFullscreenBtn.setAttribute("aria-disabled", "true");
    lookerFullscreenBtn.disabled = true;
  }

  // Calendar
  const calOpen = $("#calendar-open");
  const calIframe = $("#calendar-iframe");
  const calWrap = $("#calendar-embed-wrap");
  const calFallback = $("#calendar-fallback");
  const calHint = $("#calendar-hint");
  const timelineWrap = $("#timeline-placeholder");

  safeSetLink(calOpen, CONFIG.embeds.calendar.openUrl, { newTab: true });

  const calOk =
    CONFIG.embeds.calendar.embedUrl &&
    !isPlaceholderUrl(CONFIG.embeds.calendar.embedUrl);
  if (calOk) {
    calWrap.hidden = false;
    loadEmbedWithSkeleton(calIframe, calWrap, CONFIG.embeds.calendar.embedUrl);
    calFallback.hidden = true;
    calHint.textContent = "";
    if (timelineWrap) timelineWrap.hidden = true;
  } else {
    calIframe.removeAttribute("src");
    calWrap.hidden = true;
    updateEmbedLoadState(calWrap, "idle");
    calFallback.hidden = false;
    calHint.textContent = "Falta pegar URL de calendario (embed).";
    if (timelineWrap) timelineWrap.hidden = false;
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
  supportEmailEl.textContent = CONFIG.meta.supportEmail;
  if (!isPlaceholderUrl(CONFIG.meta.supportEmail)) {
    supportEmailEl.setAttribute("href", `mailto:${CONFIG.meta.supportEmail}`);
  } else {
    supportEmailEl.setAttribute("href", "#");
    supportEmailEl.setAttribute("aria-disabled", "true");
    supportEmailEl.setAttribute("tabindex", "-1");
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
  setupLookerModal();

  // Footer year
  $("#year").textContent = String(new Date().getFullYear());
}

document.addEventListener("DOMContentLoaded", init);
