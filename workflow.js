"use strict";

const ROLE_LABELS = {
  EN: "Navegación/Enfermería",
  ME: "Médico/a",
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
        title: "Registro de interesados / Base operativa",
        desc: "Consolidar base (nombre, contacto, elegibilidad inicial).",
        details: ["Usar formularios digitales del portal."],
        roles: ["CO", "EN"],
        routeTags: ["fit", "primary", "noapply"],
      },
      {
        id: "paso-3",
        number: 3,
        title: "Programación de entrevista",
        desc: "Contacto y coordinación para entrevista presencial.",
        roles: ["EN", "CO"],
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
        title: "Entrevista médica de tamizaje (Algoritmo)",
        desc: "Evaluar inclusión/exclusión y riesgo.",
        details: [
          "Determinar conducta: No aplica / Derivación primaria / Test FIT.",
        ],
        roles: ["ME"],
        routeTags: ["fit", "primary", "noapply"],
        type: "decision",
        decisionTitle: "Bloque de decisión",
        branches: [
          {
            id: "ruta-a",
            routeTag: "noapply",
            tone: "neutral",
            title: "Ruta A — No aplica al programa",
            desc: "Motivos: no inclusión / seguimiento vigente / colonoscopía reciente, etc.",
            action: "Acción: registrar decisión y finalizar.",
            roles: ["ME"],
            status: "Fin",
          },
          {
            id: "ruta-b",
            routeTag: "primary",
            tone: "warning",
            title: "Ruta B — Riesgo elevado → Derivación primaria",
            desc: "Acción: emitir orden/derivación a colonoscopía (primaria) y registrar.",
            action: "Fin del operativo para ese paciente.",
            roles: ["ME"],
            status: "Fin",
          },
          {
            id: "ruta-c",
            routeTag: "fit",
            tone: "success",
            title: "Ruta C — Riesgo promedio → Test FIT",
            desc: "Continuar a entrega de kit.",
            roles: ["ME", "EN"],
            status: "Continúa",
          },
        ],
      },
    ],
  },
  {
    id: "etapa-3",
    title: "Etapa 3 — Test FIT (Ruta C)",
    range: "23 marzo – 1 abril",
    steps: [
      {
        id: "paso-5",
        number: 5,
        title: "Educación + entrega de kit FIT",
        desc: "Instrucción: toma de muestra, rotulado, conservación y plazos.",
        details: ["Registrar entrega."],
        roles: ["EN"],
        routeTags: ["fit"],
      },
      {
        id: "paso-6",
        number: 6,
        title: "Recepción de muestra en estación",
        desc: "Verificación básica (rotulado/integridad) + registro.",
        roles: ["EN"],
        routeTags: ["fit"],
      },
      {
        id: "paso-7",
        number: 7,
        title: "Traslado a laboratorio",
        desc: "Cadena de custodia / trazabilidad operativa.",
        roles: ["LO", "CO"],
        routeTags: ["fit"],
      },
      {
        id: "paso-8",
        number: 8,
        title: "Recepción de resultado FIT (canal definido)",
        desc: "Resultado llega por canal asignado (mail operativo).",
        roles: ["ME", "CO"],
        routeTags: ["fit"],
      },
      {
        id: "paso-9",
        number: 9,
        title: "Devolución médica del resultado",
        desc: "Cierre clínico del operativo para cada paciente.",
        roles: ["ME"],
        routeTags: ["fit"],
        type: "decision",
        decisionTitle: "Sub-ramas de resultado FIT",
        branches: [
          {
            id: "fit-negativo",
            routeTag: "fit",
            tone: "success",
            title: "FIT negativo",
            desc: "Informar resultado, reforzar educación breve y registrar.",
            action: "Fin del programa para ese paciente.",
            roles: ["ME"],
            status: "Fin",
          },
          {
            id: "fit-positivo",
            routeTag: "fit",
            tone: "warning",
            title: "FIT positivo",
            desc: "Informar, brindar contención clínica y emitir derivación secundaria a colonoscopía.",
            action: "Registrar y finalizar programa para ese paciente.",
            roles: ["ME"],
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
        title: "Cierre y consolidación de métricas",
        desc: "Consolidación de registros y reporte.",
        roles: ["CO"],
        routeTags: ["fit", "primary", "noapply"],
      },
    ],
  },
];

document.addEventListener("DOMContentLoaded", () => {
  const root = document.getElementById("workflow-root");

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

  (roles || []).forEach((role) => {
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

  let lockedOpen = false;

  function closePopover({ force = false, returnFocus = false } = {}) {
    if (!force && lockedOpen) return;
    popover.hidden = true;
    trigger.setAttribute("aria-expanded", "false");
    if (force) lockedOpen = false;
    if (returnFocus) trigger.focus();
  }

  function openPopover({ lock = false } = {}) {
    if (lock) lockedOpen = true;
    popover.hidden = false;
    trigger.setAttribute("aria-expanded", "true");
  }

  trigger.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    const expanded = trigger.getAttribute("aria-expanded") === "true";
    if (expanded && lockedOpen) {
      closePopover({ force: true });
      return;
    }
    openPopover({ lock: true });
  });

  wrap.addEventListener("mouseenter", () => {
    if (!lockedOpen) openPopover();
  });

  wrap.addEventListener("mouseleave", () => {
    if (!lockedOpen) closePopover({ force: true });
  });

  trigger.addEventListener("focus", () => {
    openPopover();
  });

  trigger.addEventListener("blur", () => {
    window.setTimeout(() => {
      const activeInside = wrap.contains(document.activeElement);
      if (!activeInside && !wrap.matches(":hover") && !lockedOpen) {
        closePopover({ force: true });
      }
    }, 0);
  });

  document.addEventListener("click", (event) => {
    if (popover.hidden) return;
    const target = event.target;
    if (target instanceof Node && (wrap.contains(target) || popover.contains(target))) {
      return;
    }
    closePopover({ force: true });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (popover.hidden) return;
    event.preventDefault();
    closePopover({ force: true, returnFocus: true });
  });
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
