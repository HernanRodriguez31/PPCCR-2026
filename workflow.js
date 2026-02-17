"use strict";

const ROLE_LABELS = {
  EN: "Enfermería / Navegación / Facilitación",
  LO: "Logística",
  CO: "Coordinación",
};

const WORKFLOW_PHASES = [
  {
    id: "etapa-1",
    iconKey: "megaphone",
    title: "Etapa 1 — Difusión e información + preparación",
    timelineTitle: "Difusión e información",
    range: "del 9 al 22 de marzo",
    rangeShort: "9–22 mar",
    objective:
      "Difusión, organización del equipo y alistamiento para iniciar el operativo en estación.",
    steps: [
      {
        id: "paso-1",
        number: 1,
        title: "Difusión y concientización",
        desc: "Campaña en redes + comunicación institucional.",
        details: [
          "Objetivo: informar a participantes y promover el acceso al tamizaje.",
        ],
        roles: ["CO", "EN"],
      },
      {
        id: "paso-2",
        number: 2,
        title: "Planificación y preparación operativa",
        desc: "Planificación y programación del operativo. Diseño y ajustes de la plataforma y circuitos de trabajo.",
        details: ["Definición de roles, circuitos y criterios operativos."],
        roles: ["CO", "EN"],
      },
      {
        id: "paso-3",
        number: 3,
        title: "Instrucción al equipo y alistamiento",
        desc: "Instrucción al equipo EN sobre el flujo de trabajo y ultimar detalles para la etapa operativa.",
        details: ["Checklist operativo y materiales."],
        roles: ["CO", "EN"],
      },
    ],
  },
  {
    id: "etapa-2",
    iconKey: "station",
    title: "Etapa 2 — Operativo en estación",
    timelineTitle: "Operativo en estación",
    range: "del 23 de marzo al 1 de abril",
    rangeShort: "23 mar – 1 abr",
    objective:
      "Evaluación de criterios de tamizaje y definición de la ruta operativa para cada participante.",
    steps: [
      {
        id: "paso-4",
        number: 4,
        title: "Entrevista de tamizaje (Algoritmo)",
        desc: "Evaluar criterios de tamizaje y clasificar riesgo.",
        details: [
          "Determinar conducta: criterio para test FIT / sin criterio por edad o seguimiento vigente / sin criterio por riesgo elevado. En casos sin criterio, brindar orientación a consulta a salud.",
        ],
        roles: ["EN"],
        type: "decision",
        decisionTitle: "Bloque de decisión",
        branches: [
          {
            id: "ruta-a",
            tone: "success",
            tag: "Ruta A",
            title: "Criterio para tamizaje y test FIT",
            desc: "Cumple criterio para tamizaje con test FIT. Continúa a educación y entrega de kit.",
            roles: ["EN"],
            status: "Continúa",
          },
          {
            id: "ruta-b",
            tone: "neutral",
            tag: "Ruta B",
            title: "Sin criterio para tamizaje",
            reasons: "Fuera de rango etario, seguimiento vigente o colonoscopía reciente.",
            action: "Orientar a consulta a salud, registrar y finalizar.",
            roles: ["EN"],
            status: "Fin",
          },
          {
            id: "ruta-c",
            tone: "warning",
            tag: "Ruta C",
            title: "Riesgo elevado y orientación a consulta a salud",
            reasons:
              "Antecedentes personales/familiares o signos y síntomas de mayor riesgo.",
            action: "Orientar a consulta a salud, registrar y finalizar.",
            roles: ["EN"],
            status: "Fin",
          },
        ],
      },
    ],
  },
  {
    id: "etapa-3",
    iconKey: "fit",
    title: "Etapa 3 — Test FIT (Ruta A)",
    timelineTitle: "Test FIT + resultados",
    range: "del 23 de marzo al 1 de abril",
    rangeShort: "23 mar – 1 abr",
    objective:
      "Ejecución del circuito FIT: entrega, recepción, traslado de muestras e información del resultado.",
    steps: [
      {
        id: "paso-5",
        number: 5,
        title: "Información sobre uso y entrega del test FIT",
        desc: "Información sobre el uso y entrega del test FIT.",
        details: [
          "Instrucción para toma de muestra y rotulado.",
          "Se informa sobre los plazos y la importancia de realizar el FIT.",
          "Registrar entrega.",
        ],
        roles: ["EN"],
      },
      {
        id: "paso-6",
        number: 6,
        title: "Recepción de muestra en estación",
        desc: "Verificación del rotulado, indemnidad del producto y se registra la recepción.",
        roles: ["EN"],
      },
      {
        id: "paso-7",
        number: 7,
        title: "Traslado a laboratorio",
        desc: "Se retiran las muestras de la estación saludable y se trasladan al laboratorio.",
        details: [
          "Cadena de custodia y trazabilidad operativa. Registro de la entrega de muestras.",
        ],
        roles: ["LO", "CO"],
      },
      {
        id: "paso-8",
        number: 8,
        title: "Recepción de resultado FIT",
        desc: "Los resultados del test FIT llegan a la coordinación operativa del programa y directamente al participante por correo.",
        roles: ["CO"],
      },
      {
        id: "paso-9",
        number: 9,
        title: "Información al participante sobre el resultado FIT",
        desc: "Cierre operativo para cada participante.",
        roles: ["EN"],
        type: "decision",
        decisionTitle: "Sub-ramas de resultado FIT",
        branches: [
          {
            id: "fit-negativo",
            tone: "success",
            tag: "FIT negativo",
            title: "Información y cierre del circuito",
            desc: "Informar el resultado y reforzar la educación y concientización sobre prevención de cáncer colorrectal.",
            action: "Fin del programa para ese participante.",
            roles: ["EN"],
            status: "Fin",
          },
          {
            id: "fit-positivo",
            tone: "warning",
            tag: "FIT positivo",
            title: "Información, contención y orientación",
            desc: "Informar el resultado, tranquilizar y brindar contención.",
            action:
              "Recomendar orientación a consulta a salud por mayor riesgo. Fin del programa para ese participante.",
            roles: ["EN"],
            status: "Fin",
          },
        ],
      },
    ],
  },
  {
    id: "etapa-4",
    iconKey: "check",
    title: "Etapa 4 — Cierre operativo",
    timelineTitle: "Cierre operativo",
    range: "1 de abril",
    rangeShort: "1 abr",
    objective: "Consolidación final de registros, parámetros y métricas del operativo.",
    steps: [
      {
        id: "paso-10",
        number: 10,
        title: "Cierre y consolidación de parámetros y métricas",
        desc: "Consolidación de registros y reporte operativo.",
        roles: ["CO"],
      },
    ],
  },
];

document.addEventListener("DOMContentLoaded", () => {
  const page = document.body;
  if (!page || !page.classList.contains("workflow-page")) return;

  const root = document.getElementById("workflow-root");
  initFixedHeaderOffset();
  initBackToTopButton();
  initRolesDisclosure();

  if (!root) return;
  renderWorkflow(root, WORKFLOW_PHASES);
  initStageTimeline(WORKFLOW_PHASES);
});

function renderWorkflow(root, phases) {
  const fragment = document.createDocumentFragment();

  phases.forEach((phase) => {
    const phaseCard = document.createElement("section");
    phaseCard.className = "wf-stage";
    phaseCard.id = phase.id;
    phaseCard.setAttribute("aria-labelledby", `${phase.id}-title`);

    const phaseHeader = document.createElement("header");
    phaseHeader.className = "wf-stage__header";

    const phaseTitle = document.createElement("h3");
    phaseTitle.className = "wf-stage__title";
    phaseTitle.id = `${phase.id}-title`;
    phaseTitle.textContent = phase.title;

    const phaseRange = document.createElement("p");
    phaseRange.className = "wf-stage__range";
    phaseRange.textContent = phase.range || "—";

    phaseHeader.appendChild(phaseTitle);
    phaseHeader.appendChild(phaseRange);
    phaseCard.appendChild(phaseHeader);

    if (phase.objective) {
      const objective = document.createElement("p");
      objective.className = "wf-stage__objective";
      objective.textContent = phase.objective;
      phaseCard.appendChild(objective);
    }

    const timeline = document.createElement("div");
    timeline.className = "wf-stage__timeline";

    phase.steps.forEach((step, index) => {
      timeline.appendChild(renderStep(step, index === phase.steps.length - 1));
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
  const hasBranches =
    step.type === "decision" && Array.isArray(step.branches) && step.branches.length > 0;
  const shouldShowStepRoles = step.showStepRoles ?? !hasBranches;

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

  const title = document.createElement("h4");
  title.className = "wf-step-card__title";
  title.textContent = step.title;

  head.appendChild(badge);
  head.appendChild(title);
  body.appendChild(head);

  if (step.desc) {
    const desc = document.createElement("p");
    desc.className = "wf-step-card__desc";
    desc.textContent = step.desc;
    body.appendChild(desc);
  }

  if (Array.isArray(step.details) && step.details.length > 0) {
    const detailsList = document.createElement("ul");
    detailsList.className = "wf-step-card__list";

    step.details.forEach((detail) => {
      const item = document.createElement("li");
      item.textContent = detail;
      detailsList.appendChild(item);
    });

    body.appendChild(detailsList);
  }

  if (hasBranches) {
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

      const branchHeading = document.createElement("div");
      branchHeading.className = "wf-branch__heading";

      if (branch.tag) {
        const branchTag = document.createElement("span");
        branchTag.className = "wf-branch__tag";
        branchTag.textContent = branch.tag;
        branchHeading.appendChild(branchTag);
      }

      const branchTitle = document.createElement("h5");
      branchTitle.className = "wf-branch__title";
      branchTitle.textContent = branch.title;

      branchHeading.appendChild(branchTitle);
      branchTop.appendChild(branchHeading);

      if (branch.status) {
        const branchStatus = document.createElement("span");
        branchStatus.className = "wf-branch__status";
        branchStatus.textContent = branch.status;
        branchTop.appendChild(branchStatus);
      }

      branchEl.appendChild(branchTop);

      const headerDivider = document.createElement("div");
      headerDivider.className = "wf-branch__header-divider";
      headerDivider.setAttribute("aria-hidden", "true");
      branchEl.appendChild(headerDivider);

      const branchContent = document.createElement("div");
      branchContent.className = "wf-branch__content";

      if (branch.desc) {
        const branchDesc = document.createElement("p");
        branchDesc.className = "wf-branch__desc";
        branchDesc.textContent = branch.desc;
        branchContent.appendChild(branchDesc);
      }

      if (branch.reasons) {
        const reasons = document.createElement("p");
        reasons.className = "wf-branch__reason";

        const label = document.createElement("span");
        label.className = "wf-branch__label";
        label.textContent = "Motivos:";

        const text = document.createElement("span");
        text.textContent = ` ${branch.reasons}`;

        reasons.appendChild(label);
        reasons.appendChild(text);
        branchContent.appendChild(reasons);
      }

      if (branch.action) {
        const action = document.createElement("p");
        action.className = "wf-branch__action";

        const label = document.createElement("span");
        label.className = "wf-branch__action-label";
        label.textContent = "Acción:";

        const text = document.createElement("span");
        text.textContent = ` ${branch.action}`;

        action.appendChild(label);
        action.appendChild(text);
        branchContent.appendChild(action);
      }

      branchEl.appendChild(branchContent);
      branchEl.appendChild(createRoleMeta(branch.roles));
      branchGrid.appendChild(branchEl);
    });

    body.appendChild(branchGrid);
  }

  if (shouldShowStepRoles) {
    body.appendChild(createRoleMeta(step.roles));
  }
  stepWrap.appendChild(marker);
  stepWrap.appendChild(body);
  return stepWrap;
}

function createRoleMeta(roles) {
  const meta = document.createElement("div");
  meta.className = "wf-step-card__meta";

  const label = document.createElement("span");
  label.className = "wf-step-card__roles-label";
  label.textContent = "Responsables";

  const roleList = document.createElement("div");
  roleList.className = "wf-role-list";
  roleList.setAttribute("aria-label", "Responsables del paso");

  const uniqueRoles = Array.from(new Set(roles || []));
  uniqueRoles.forEach((role) => {
    const chip = document.createElement("abbr");
    chip.className = "wf-role-chip";
    chip.textContent = role;
    chip.title = ROLE_LABELS[role] || role;
    chip.setAttribute("aria-label", ROLE_LABELS[role] || role);
    roleList.appendChild(chip);
  });

  if (uniqueRoles.length === 0) {
    const chip = document.createElement("span");
    chip.className = "wf-role-chip";
    chip.textContent = "—";
    chip.setAttribute("aria-label", "Sin responsables definidos");
    roleList.appendChild(chip);
  }

  meta.appendChild(label);
  meta.appendChild(roleList);
  return meta;
}

function initStageTimeline(phases) {
  const timelineList = document.getElementById("wf-stage-timeline");
  if (!(timelineList instanceof HTMLOListElement)) return;

  const stageSections = phases
    .map((phase) => document.getElementById(phase.id))
    .filter((section) => section instanceof HTMLElement);
  if (stageSections.length === 0) return;

  const linkMap = new Map();
  timelineList.innerHTML = "";

  phases.forEach((phase, index) => {
    const stage = document.getElementById(phase.id);
    if (!(stage instanceof HTMLElement)) return;

    const item = document.createElement("li");
    item.className = "wf-stage-nav__item";

    const link = document.createElement("a");
    link.className = "wf-stage-nav__link";
    link.href = `#${phase.id}`;
    link.dataset.stageTarget = phase.id;

    const icon = document.createElement("span");
    icon.className = "wf-stage-nav__icon";
    icon.setAttribute("aria-hidden", "true");
    icon.innerHTML = getStageIconSvg(phase.iconKey);

    const stageLabel = document.createElement("span");
    stageLabel.className = "wf-stage-nav__stage";
    stageLabel.textContent = `Etapa ${index + 1}`;

    const head = document.createElement("span");
    head.className = "wf-stage-nav__head";
    head.appendChild(icon);
    head.appendChild(stageLabel);

    const text = document.createElement("span");
    text.className = "wf-stage-nav__text";

    const subtitle = document.createElement("span");
    subtitle.className = "wf-stage-nav__name";
    subtitle.textContent =
      phase.timelineTitle || phase.title.replace(/^Etapa\s+\d+\s+—\s+/i, "");

    const range = document.createElement("span");
    range.className = "wf-stage-nav__range";
    range.textContent = phase.rangeShort || phase.range || "—";

    text.appendChild(subtitle);
    text.appendChild(range);
    link.appendChild(head);
    link.appendChild(text);
    item.appendChild(link);
    timelineList.appendChild(item);

    linkMap.set(phase.id, { item, link });
  });

  let activeStageId = "";

  const activateStage = (stageId) => {
    if (stageId === activeStageId) return;
    activeStageId = stageId;

    linkMap.forEach(({ item, link }, currentId) => {
      const isActive = currentId === stageId;
      item.classList.toggle("is-active", isActive);
      link.classList.toggle("is-active", isActive);
      if (isActive) {
        link.setAttribute("aria-current", "step");
      } else {
        link.removeAttribute("aria-current");
      }
    });

    if (window.matchMedia("(max-width: 768px)").matches) {
      const active = linkMap.get(stageId);
      if (active) {
        active.item.scrollIntoView({
          inline: "center",
          block: "nearest",
          behavior: isReduceMotion() ? "auto" : "smooth",
        });
      }
    }
  };

  timelineList.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const link = target.closest(".wf-stage-nav__link");
    if (!(link instanceof HTMLAnchorElement)) return;

    const stageId = link.dataset.stageTarget;
    if (!stageId) return;

    event.preventDefault();
    scrollToStage(stageId, { updateHash: true });
    activateStage(stageId);
  });

  const threshold = [0.1, 0.25, 0.45, 0.7];
  const observer = new IntersectionObserver(
    (entries) => {
      const visibleEntries = entries.filter((entry) => entry.isIntersecting);
      if (!visibleEntries.length) return;

      visibleEntries.sort((a, b) => {
        const aDelta = Math.abs(a.boundingClientRect.top - getFixedHeaderOffset());
        const bDelta = Math.abs(b.boundingClientRect.top - getFixedHeaderOffset());
        if (aDelta !== bDelta) return aDelta - bDelta;
        return b.intersectionRatio - a.intersectionRatio;
      });

      const next = visibleEntries[0];
      if (next?.target?.id) {
        activateStage(next.target.id);
      }
    },
    {
      root: null,
      rootMargin: `-${Math.round(getFixedHeaderOffset())}px 0px -45% 0px`,
      threshold,
    },
  );

  stageSections.forEach((section) => observer.observe(section));

  const hashId = decodeURIComponent(window.location.hash || "").replace("#", "");
  if (hashId && linkMap.has(hashId)) {
    window.requestAnimationFrame(() => {
      scrollToStage(hashId, { updateHash: false });
      activateStage(hashId);
    });
  } else if (phases[0]?.id) {
    activateStage(phases[0].id);
  }
}

function initRolesDisclosure() {
  const details = document.getElementById("wf-roles-details");
  if (!(details instanceof HTMLDetailsElement)) return;

  const summary = details.querySelector("summary");

  document.addEventListener("click", (event) => {
    if (!details.open) return;
    const target = event.target;
    if (!(target instanceof Node)) return;
    if (details.contains(target)) return;
    details.open = false;
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || !details.open) return;
    details.open = false;
    if (summary instanceof HTMLElement) summary.focus();
  });
}

function initFixedHeaderOffset() {
  const header = document.querySelector(".wf-hero.site-header.site-topbar");
  if (!(header instanceof HTMLElement)) return;

  const root = document.documentElement;
  let raf = 0;

  const sync = () => {
    raf = 0;
    const measured = Math.max(
      Math.round(header.getBoundingClientRect().height),
      header.offsetHeight || 0,
      header.scrollHeight || 0,
    );
    const height = Math.min(300, Math.max(120, measured));
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

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: isReduceMotion() ? "auto" : "smooth",
    });

    if (location.hash === "#top") {
      history.replaceState(null, "", `${location.pathname}${location.search}`);
    }
  });
}

function scrollToStage(stageId, { updateHash = true } = {}) {
  const target = document.getElementById(stageId);
  if (!(target instanceof HTMLElement)) return;

  const top =
    window.scrollY + target.getBoundingClientRect().top - getFixedHeaderOffset() - 20;

  window.scrollTo({
    top: Math.max(0, Math.round(top)),
    left: 0,
    behavior: isReduceMotion() ? "auto" : "smooth",
  });

  if (updateHash) {
    history.replaceState(null, "", `${location.pathname}${location.search}#${stageId}`);
  }
}

function getFixedHeaderOffset() {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue("--wf-fixed-header-h")
    .trim();
  const offset = Number.parseFloat(raw);
  return Number.isFinite(offset) && offset > 0 ? offset : 180;
}

function isReduceMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getStageIconSvg(iconKey) {
  const iconMap = {
    megaphone:
      '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M3.5 12.5v-1.8c0-.7.5-1.2 1.2-1.2h2.3l8-3.8c.8-.4 1.7.2 1.7 1.1v9.4c0 .9-.9 1.5-1.7 1.1l-8-3.8H4.7c-.7 0-1.2-.5-1.2-1.2Z"/><path d="M8 13.7l1.4 5.1c.2.7 1 .9 1.5.4l1.1-1.1"/><path d="M18.8 9.2c1 .9 1.6 2.1 1.6 3.3s-.6 2.4-1.6 3.3"/></svg>',
    station:
      '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 21s6-4.5 6-10a6 6 0 1 0-12 0c0 5.5 6 10 6 10Z"/><circle cx="12" cy="11" r="2.2"/><path d="M9.3 5.6h5.4"/></svg>',
    fit:
      '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="7" y="3.5" width="10" height="17" rx="2"/><path d="M10 7.5h4M10 11h4M10 14.5h4"/><path d="M9.5 20.5h5"/></svg>',
    check:
      '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="8.5"/><path d="m8.5 12.3 2.2 2.2 4.8-4.8"/></svg>',
  };
  return iconMap[iconKey] || iconMap.check;
}
