"use strict";

const ROLE_LABELS = {
  EN: "Enfermería / Navegación / Facilitación de Pacientes",
  LO: "Logística",
  CO: "Coordinación",
};

const WORKFLOW_PHASES = [
  {
    id: "etapa-1",
    title: "Etapa 1 — Captación y preparación",
    range: "9–22 marzo",
    steps: [
      {
        id: "paso-1",
        number: 1,
        title: "Difusión y concientización",
        desc: "Campaña en redes + comunicación institucional.",
        details: [
          "Objetivo: captar interesados y dirigir al registro inicial.",
        ],
        roles: ["CO", "EN"],
        routeTags: ["fit", "primary", "noapply"],
      },
      {
        id: "paso-2",
        number: 2,
        title: "Planificación y preparación operativa",
        desc: "Planificación y programación del operativo. Diseño y ajustes de la plataforma y circuitos de trabajo.",
        details: ["Definición de roles, circuitos y criterios operativos."],
        roles: ["CO", "EN"],
        routeTags: ["fit", "primary", "noapply"],
      },
      {
        id: "paso-3",
        number: 3,
        title: "Instrucción al equipo y alistamiento",
        desc: "Instrucción al equipo EN sobre el flujo de trabajo y ultimar detalles para la etapa operativa.",
        details: ["Checklist operativo y materiales."],
        roles: ["CO", "EN"],
        routeTags: ["fit", "primary", "noapply"],
      },
    ],
  },
  {
    id: "etapa-2",
    title: "Etapa 2 — Operativo en estación",
    range: "23 marzo – 1 abril",
    steps: [
      {
        id: "paso-4",
        number: 4,
        title: "NODO CLAVE — Entrevista de tamizaje (Algoritmo)",
        desc: "Evaluar criterios de tamizaje y clasificar riesgo.",
        details: [
          "Determinar conducta: criterio para test FIT / sin criterio por edad o seguimiento vigente / sin criterio por riesgo elevado. En casos sin criterio, brindar orientación a consulta a salud.",
        ],
        roles: ["EN"],
        routeTags: ["fit", "primary", "noapply"],
        type: "decision",
        decisionTitle: "Bloque de decisión",
        branches: [
          {
            id: "ruta-a",
            routeTag: "fit",
            tone: "success",
            title: "Ruta A — Criterio para tamizaje → Test FIT",
            desc: "Cumple criterio para tamizaje con test FIT. Continuar a educación y entrega de kit.",
            roles: ["EN"],
            status: "Continúa",
          },
          {
            id: "ruta-b",
            routeTag: "noapply",
            tone: "neutral",
            title: "Ruta B — Sin criterio para tamizaje",
            desc: "Motivos: fuera de rango etario / seguimiento vigente por profesional de la salud / colonoscopía reciente, etc.",
            action: "Acción: brindar orientación a consulta a salud, registrar y finalizar.",
            roles: ["EN"],
            status: "Fin",
          },
          {
            id: "ruta-c",
            routeTag: "primary",
            tone: "warning",
            title: "Ruta C — Riesgo elevado → Orientación a consulta a salud",
            desc: "Detección de antecedentes personales o familiares, signos o síntomas que confieren mayor riesgo de cáncer colorrectal.",
            action: "Acción: brindar orientación a consulta a salud, registrar y finalizar.",
            roles: ["EN"],
            status: "Fin",
          },
        ],
      },
    ],
  },
  {
    id: "etapa-3",
    title: "Etapa 3 — Test FIT (Ruta A)",
    range: "23 marzo – 1 abril",
    steps: [
      {
        id: "paso-5",
        number: 5,
        title: "Educación + entrega de kit FIT",
        desc: "Educación a la población y entrega de test FIT.",
        details: [
          "Instrucción: toma de muestra y rotulado.",
          "Se informa sobre los plazos y la importancia de realizar el FIT.",
          "Registrar entrega.",
        ],
        roles: ["EN"],
        routeTags: ["fit"],
      },
      {
        id: "paso-6",
        number: 6,
        title: "Recepción de muestra en estación",
        desc: "Verificación del rotulado, indemnidad del producto y se registra la recepción.",
        roles: ["EN"],
        routeTags: ["fit"],
      },
      {
        id: "paso-7",
        number: 7,
        title: "Traslado a laboratorio",
        desc: "Se retiran las muestras de la estación saludable y se trasladan al laboratorio.",
        details: ["Cadena de custodia y trazabilidad operativa. Registro de la entrega de muestras."],
        roles: ["LO", "CO"],
        routeTags: ["fit"],
      },
      {
        id: "paso-8",
        number: 8,
        title: "Recepción de resultado FIT (canal definido)",
        desc: "Los resultados del test FIT llegan a la coordinación operativa del programa y directamente al participante por correo.",
        roles: ["CO"],
        routeTags: ["fit"],
      },
      {
        id: "paso-9",
        number: 9,
        title: "Información al participante sobre el resultado FIT",
        desc: "Cierre operativo para cada paciente/participante.",
        roles: ["EN"],
        routeTags: ["fit"],
        type: "decision",
        decisionTitle: "Sub-ramas de resultado FIT",
        branches: [
          {
            id: "fit-negativo",
            routeTag: "fit",
            tone: "success",
            title: "FIT negativo",
            desc: "Informar el resultado y reforzar la educación y concientización sobre prevención de cáncer colorrectal.",
            action: "Fin del programa para ese participante.",
            roles: ["EN"],
            status: "Fin",
          },
          {
            id: "fit-positivo",
            routeTag: "fit",
            tone: "warning",
            title: "FIT positivo",
            desc: "Informar el resultado, tranquilizar y brindar contención.",
            action: "Recomendar orientación a consulta a salud por mayor riesgo. Fin del programa para ese participante.",
            roles: ["EN"],
            status: "Fin",
          },
        ],
      },
    ],
  },
  {
    id: "etapa-4",
    title: "Etapa 4 — Cierre operativo",
    range: "1 de abril",
    steps: [
      {
        id: "paso-10",
        number: 10,
        title: "Cierre y consolidación de parámetros y métricas",
        desc: "Consolidación de registros y reporte operativo.",
        roles: ["CO"],
        routeTags: ["fit", "primary", "noapply"],
      },
    ],
  },
];

document.addEventListener("DOMContentLoaded", () => {
  const root = document.getElementById("workflow-root");

  initFixedHeaderOffset();
  initRoleLegendPopover();
  initBackToTopButton();
  if (!root) return;

  renderWorkflow(root, WORKFLOW_PHASES);
});

function renderWorkflow(root, phases) {
  const fragment = document.createDocumentFragment();

  phases.forEach((phase) => {
    const phaseCard = document.createElement("article");
    phaseCard.className = "wf-phase";
    phaseCard.setAttribute("aria-labelledby", `${phase.id}-title`);

    const phaseHeader = document.createElement("header");
    phaseHeader.className = "wf-phase__header";

    const phaseTitle = document.createElement("h2");
    phaseTitle.className = "wf-phase__title";
    phaseTitle.id = `${phase.id}-title`;
    phaseTitle.textContent = phase.title;

    const phaseRange = document.createElement("p");
    phaseRange.className = "wf-phase__range";
    phaseRange.textContent = phase.range;

    phaseHeader.appendChild(phaseTitle);
    phaseHeader.appendChild(phaseRange);
    phaseCard.appendChild(phaseHeader);

    const timeline = document.createElement("div");
    timeline.className = "wf-timeline";

    phase.steps.forEach((step, index) => {
      const stepEl = renderStep(step, index === phase.steps.length - 1);
      timeline.appendChild(stepEl);
    });

    phaseCard.appendChild(timeline);
    fragment.appendChild(phaseCard);
  });

  root.innerHTML = "";
  root.appendChild(fragment);
}

function renderStep(step, isLastStep) {
  const stepWrap = document.createElement("article");
  stepWrap.className = "wf-step";
  if (isLastStep) stepWrap.classList.add("wf-step--last");

  const marker = document.createElement("span");
  marker.className = "wf-step__marker";
  marker.setAttribute("aria-hidden", "true");
  marker.textContent = step.number;

  const body = document.createElement("div");
  body.className = "wf-step-card";

  if (step.type === "decision") {
    body.classList.add("wf-step-card--decision");
  }

  const head = document.createElement("div");
  head.className = "wf-step-card__head";

  const badge = document.createElement("span");
  badge.className = "wf-step-card__badge";
  badge.textContent = step.type === "decision" ? "Nodo clave" : `Paso ${step.number}`;

  const title = document.createElement("h3");
  title.className = "wf-step-card__title";
  title.textContent = step.title;

  head.appendChild(badge);
  head.appendChild(title);

  const desc = document.createElement("p");
  desc.className = "wf-step-card__desc";
  desc.textContent = step.desc;

  body.appendChild(head);
  body.appendChild(desc);

  if (Array.isArray(step.details) && step.details.length > 0) {
    const detailsList = document.createElement("ul");
    detailsList.className = "wf-step-card__list";

    step.details.forEach((detail) => {
      const li = document.createElement("li");
      li.textContent = detail;
      detailsList.appendChild(li);
    });

    body.appendChild(detailsList);
  }

  if (step.type === "decision" && Array.isArray(step.branches) && step.branches.length > 0) {
    const decisionTitle = document.createElement("p");
    decisionTitle.className = "wf-decision__title";
    decisionTitle.textContent = step.decisionTitle || "Rutas de decisión";
    body.appendChild(decisionTitle);

    const branchGrid = document.createElement("div");
    branchGrid.className = "wf-branch-grid";

    step.branches.forEach((branch) => {
      const branchEl = document.createElement("article");
      branchEl.className = `wf-branch wf-branch--${branch.tone || "neutral"}`;

      const branchTop = document.createElement("div");
      branchTop.className = "wf-branch__top";

      const branchTitle = document.createElement("h4");
      branchTitle.className = "wf-branch__title";
      branchTitle.textContent = branch.title;

      const branchStatus = document.createElement("span");
      branchStatus.className = "wf-branch__status";
      branchStatus.textContent = branch.status || "";

      branchTop.appendChild(branchTitle);
      if (branch.status) branchTop.appendChild(branchStatus);

      const branchDesc = document.createElement("p");
      branchDesc.className = "wf-branch__desc";
      branchDesc.textContent = branch.desc;

      branchEl.appendChild(branchTop);
      branchEl.appendChild(branchDesc);

      if (branch.action) {
        const action = document.createElement("p");
        action.className = "wf-branch__action";
        action.textContent = branch.action;
        branchEl.appendChild(action);
      }

      branchEl.appendChild(createRoleMeta(branch.roles));
      branchGrid.appendChild(branchEl);
    });

    body.appendChild(branchGrid);
  }

  body.appendChild(createRoleMeta(step.roles));

  stepWrap.appendChild(marker);
  stepWrap.appendChild(body);

  return stepWrap;
}

function createRoleMeta(roles) {
  const meta = document.createElement("div");
  meta.className = "wf-step-card__meta";

  const label = document.createElement("span");
  label.className = "wf-step-card__roles-label";
  label.textContent = "Roles";

  const roleList = document.createElement("div");
  roleList.className = "wf-role-list";
  roleList.setAttribute("aria-label", "Roles involucrados");

  const uniqueRoles = Array.from(new Set(roles || []));
  uniqueRoles.forEach((role) => {
    const chip = document.createElement("abbr");
    chip.className = "wf-role-chip";
    chip.textContent = role;
    chip.title = ROLE_LABELS[role] || role;
    chip.setAttribute("aria-label", ROLE_LABELS[role] || role);
    roleList.appendChild(chip);
  });

  meta.appendChild(label);
  meta.appendChild(roleList);
  return meta;
}

function initRoleLegendPopover() {
  const wrap = document.querySelector(".wf-role-legend");
  const trigger = document.getElementById("wf-role-legend-trigger");
  const popover = document.getElementById("roleLegendPopover");
  if (!wrap || !trigger || !popover) return;

  let isOpen = false;
  let frame = 0;

  function setPopoverPosition() {
    if (popover.hidden) return;

    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    if (isMobile) {
      popover.style.top = "auto";
      popover.style.left = "16px";
      popover.style.right = "16px";
      popover.style.bottom = "90px";
      popover.style.transform = "none";
      return;
    }

    const gap = 12;
    const viewportMargin = 16;
    const triggerRect = trigger.getBoundingClientRect();
    const popRect = popover.getBoundingClientRect();

    let left = triggerRect.left - popRect.width - gap;
    let top = triggerRect.top + triggerRect.height / 2;

    const minLeft = viewportMargin;
    const maxLeft = window.innerWidth - popRect.width - viewportMargin;
    if (left < minLeft) left = minLeft;
    if (left > maxLeft) left = maxLeft;

    const minTop = viewportMargin + popRect.height / 2;
    const maxTop = window.innerHeight - viewportMargin - popRect.height / 2;
    if (top < minTop) top = minTop;
    if (top > maxTop) top = maxTop;

    popover.style.left = `${Math.round(left)}px`;
    popover.style.top = `${Math.round(top)}px`;
    popover.style.right = "auto";
    popover.style.bottom = "auto";
    popover.style.transform = "translateY(-50%)";
  }

  function schedulePosition() {
    if (frame) window.cancelAnimationFrame(frame);
    frame = window.requestAnimationFrame(() => {
      frame = 0;
      setPopoverPosition();
    });
  }

  function openPopover() {
    if (isOpen) return;
    isOpen = true;
    popover.hidden = false;
    trigger.setAttribute("aria-expanded", "true");
    schedulePosition();
    window.addEventListener("resize", schedulePosition, { passive: true });
    window.addEventListener("scroll", schedulePosition, true);
  }

  function closePopover({ returnFocus = false } = {}) {
    if (!isOpen) return;
    isOpen = false;
    popover.hidden = true;
    trigger.setAttribute("aria-expanded", "false");
    window.removeEventListener("resize", schedulePosition);
    window.removeEventListener("scroll", schedulePosition, true);
    if (returnFocus) trigger.focus();
  }

  trigger.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (isOpen) {
      closePopover();
      return;
    }
    openPopover();
  });

  document.addEventListener("click", (event) => {
    if (!isOpen) return;
    const target = event.target;
    if (!(target instanceof Node)) return;
    if (wrap.contains(target) || popover.contains(target)) return;
    closePopover();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || !isOpen) return;
    event.preventDefault();
    closePopover({ returnFocus: true });
  });
}

function initFixedHeaderOffset() {
  const header = document.querySelector(".wf-hero.site-header.site-topbar");
  if (!(header instanceof HTMLElement)) return;

  const root = document.documentElement;
  let raf = 0;

  const sync = () => {
    raf = 0;
    const height = Math.max(0, Math.round(header.getBoundingClientRect().height));
    root.style.setProperty("--wf-fixed-header-h", `${height}px`);
  };

  const schedule = () => {
    if (raf) return;
    raf = window.requestAnimationFrame(sync);
  };

  schedule();
  window.addEventListener("resize", schedule, { passive: true });
  window.addEventListener("orientationchange", schedule, { passive: true });
  window.addEventListener("load", schedule, { once: true });

  if ("ResizeObserver" in window) {
    const observer = new ResizeObserver(() => schedule());
    observer.observe(header);
  }
}

function initBackToTopButton() {
  const btn = document.getElementById("back-to-top");
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

  btn.addEventListener("click", (event) => {
    event.preventDefault();

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: reduceMotion ? "auto" : "smooth",
    });

    if (location.hash === "#top") {
      history.replaceState(null, "", `${location.pathname}${location.search}`);
    }
  });
}
