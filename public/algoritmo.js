"use strict";

const STEP = {
  AGE: 1,
  EXCLUSIONS: 2,
  RISK: 3,
};

const CRITERIA_AGE = {
  DEFAULT: 50,
  NEW: 45,
};

const ui = {};
let currentStep = STEP.AGE;
let lastFocusedBeforeModal = null;

document.addEventListener("DOMContentLoaded", initWizard);

function initWizard() {
  captureElements();
  bindEvents();
  refreshWizardState();
}

function captureElements() {
  ui.form = document.getElementById("risk-wizard");
  ui.steps = Array.from(document.querySelectorAll(".page-algoritmo__step[data-step]"));
  ui.stepperButtons = Array.from(
    document.querySelectorAll(".page-algoritmo__stepper-button[data-step-target]"),
  );

  ui.ageInput = document.getElementById("edad-input");
  ui.ageFeedback = document.getElementById("edad-feedback");
  ui.step1ThresholdCopy = document.getElementById("step1-threshold-copy");
  ui.criterionSwitch = document.getElementById("criterion45-switch");
  ui.criterionHelp = document.getElementById("criterion45-help");

  ui.step1Stop = document.getElementById("step1-stop");
  ui.step1StopText = document.getElementById("step1-stop-text");
  ui.step1Ok = document.getElementById("step1-ok");
  ui.step1OkText = document.getElementById("step1-ok-text");
  ui.step1Next = document.getElementById("step1-next");

  ui.exclusionChecks = Array.from(document.querySelectorAll(".exclusion-check"));
  ui.step2Ok = document.getElementById("step2-ok");
  ui.step2Stop = document.getElementById("step2-stop");
  ui.step2Prev = document.getElementById("step2-prev");
  ui.step2Next = document.getElementById("step2-next");

  ui.riskChecks = Array.from(document.querySelectorAll(".risk-check"));
  ui.riskResult = document.getElementById("risk-result");
  ui.riskResultTitle = document.getElementById("risk-result-title");
  ui.riskResultText = document.getElementById("risk-result-text");

  ui.openSummaryModalButton = document.getElementById("copy-summary");
  ui.resetButton = document.getElementById("reset-wizard");

  ui.summaryModal = document.getElementById("summary-modal");
  ui.summaryDialog = document.getElementById("summary-modal-dialog");
  ui.modalCopyButton = document.getElementById("modal-copy-text");
  ui.modalDownloadButton = document.getElementById("modal-download-image");
  ui.modalCloseButton = document.getElementById("modal-close");
  ui.modalToast = document.getElementById("summary-modal-toast");

  ui.summaryAge = document.getElementById("summary-age");
  ui.summaryStep1 = document.getElementById("summary-step1");
  ui.summaryStep2 = document.getElementById("summary-step2");
  ui.summaryFinal = document.getElementById("summary-final");
  ui.summaryDecisionPill = document.getElementById("summary-decision-pill");
}

function bindEvents() {
  ui.ageInput.addEventListener("input", () => {
    sanitizeAge();
    refreshWizardState();
  });

  document.addEventListener("keydown", onWizardKeydown);
  ui.form.addEventListener("submit", onWizardSubmit);

  ui.criterionSwitch.addEventListener("change", refreshWizardState);

  ui.step1Next.addEventListener("click", () => {
    if (isAgeEligible()) {
      goToStep(STEP.EXCLUSIONS);
    }
  });

  ui.exclusionChecks.forEach((checkbox) => {
    checkbox.addEventListener("change", refreshWizardState);
  });

  ui.step2Prev.addEventListener("click", () => goToStep(STEP.AGE));
  ui.step2Next.addEventListener("click", () => {
    if (canProceedFromExclusions()) {
      goToStep(STEP.RISK);
    }
  });

  ui.riskChecks.forEach((checkbox) => {
    checkbox.addEventListener("change", refreshWizardState);
  });

  ui.stepperButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const step = Number(button.dataset.stepTarget || "");
      if (!Number.isFinite(step)) return;
      goToStep(step);
    });
  });

  ui.openSummaryModalButton.addEventListener("click", openSummaryModal);
  ui.resetButton.addEventListener("click", resetWizard);

  ui.summaryModal.addEventListener("click", (event) => {
    const closeTrigger = event.target.closest("[data-modal-close='true']");
    if (closeTrigger) closeSummaryModal();
  });

  ui.modalCopyButton.addEventListener("click", copySummaryTextFromModal);
  ui.modalDownloadButton.addEventListener("click", downloadSummaryImage);
  ui.modalCloseButton.addEventListener("click", closeSummaryModal);
}

function onWizardKeydown(event) {
  if (!ui.summaryModal.hidden) return;
  if (!shouldHandleWizardEnter(event)) return;

  const actionButton = getPrimaryActionButtonForCurrentStep();
  if (!canActivateButton(actionButton)) return;

  event.preventDefault();
  actionButton.click();
}

function onWizardSubmit(event) {
  event.preventDefault();

  const actionButton = getPrimaryActionButtonForCurrentStep();
  if (!canActivateButton(actionButton)) return;

  actionButton.click();
}

function shouldHandleWizardEnter(event) {
  if (event.key !== "Enter") return false;
  if (event.defaultPrevented || event.isComposing) return false;
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return false;

  const target = event.target;
  if (!(target instanceof Element)) return false;
  if (target.closest("button, a, summary, textarea")) return false;

  return true;
}

function getPrimaryActionButtonForCurrentStep() {
  if (currentStep === STEP.AGE) return ui.step1Next;
  if (currentStep === STEP.EXCLUSIONS) return ui.step2Next;
  if (currentStep === STEP.RISK) return ui.openSummaryModalButton;
  return null;
}

function canActivateButton(button) {
  if (!button) return false;
  if (button.hidden || button.disabled) return false;
  if (button.getAttribute("aria-disabled") === "true") return false;
  return true;
}

function getInclusionThreshold() {
  return ui.criterionSwitch.checked ? CRITERIA_AGE.NEW : CRITERIA_AGE.DEFAULT;
}

function parseAge() {
  const raw = String(ui.ageInput.value || "").trim();
  if (raw === "") return null;

  const value = Number(raw);
  if (!Number.isFinite(value)) return null;
  return value;
}

function sanitizeAge() {
  const age = parseAge();
  if (age === null) return;

  if (age < 0) {
    ui.ageInput.value = "";
  } else if (age > 120) {
    ui.ageInput.value = "120";
  }
}

function getSelectedLabels(inputs) {
  return inputs.filter((input) => input.checked).map((input) => input.dataset.label);
}

function hasSelectedExclusion() {
  return getSelectedLabels(ui.exclusionChecks).length > 0;
}

function hasSelectedRisk() {
  return getSelectedLabels(ui.riskChecks).length > 0;
}

function isAgeEligible() {
  const age = parseAge();
  return age !== null && age >= getInclusionThreshold();
}

function canProceedFromExclusions() {
  return isAgeEligible() && !hasSelectedExclusion();
}

function getMaxAllowedStep() {
  if (!isAgeEligible()) return STEP.AGE;
  if (!canProceedFromExclusions()) return STEP.EXCLUSIONS;
  return STEP.RISK;
}

function goToStep(targetStep) {
  const normalizedStep = Number(targetStep);
  if (!Number.isFinite(normalizedStep)) return;

  const boundedStep = Math.min(Math.max(normalizedStep, STEP.AGE), STEP.RISK);
  currentStep = Math.min(boundedStep, getMaxAllowedStep());
  renderSteps();
  renderStepper();
}

function refreshWizardState() {
  renderStep1State();
  renderStep2State();
  renderStep3State();

  const maxAllowedStep = getMaxAllowedStep();
  if (currentStep > maxAllowedStep) {
    currentStep = maxAllowedStep;
  }

  renderSteps();
  renderStepper();
}

function renderStep1State() {
  const age = parseAge();
  const threshold = getInclusionThreshold();

  ui.step1ThresholdCopy.textContent = `Criterio mínimo de inclusión: ${threshold} años.`;
  ui.criterionHelp.textContent =
    threshold === CRITERIA_AGE.NEW
      ? "Criterio actual: inclusión desde 45 años."
      : "Criterio actual: inclusión desde 50 años.";

  ui.step1StopText.textContent = `No cumple criterio de inclusión por edad (<${threshold}). Fin de la entrevista.`;
  ui.step1OkText.textContent = `Cumple criterio de inclusión (≥${threshold}). Puede continuar.`;

  if (age === null) {
    ui.ageInput.setAttribute("aria-invalid", "false");
    ui.ageFeedback.textContent = "Ingresá la edad para evaluar inclusión.";
    ui.step1Stop.hidden = true;
    ui.step1Ok.hidden = true;
    ui.step1Next.hidden = true;
    return;
  }

  if (age < threshold) {
    ui.ageInput.setAttribute("aria-invalid", "true");
    ui.ageFeedback.textContent = "No es necesario continuar el algoritmo.";
    ui.step1Stop.hidden = false;
    ui.step1Ok.hidden = true;
    ui.step1Next.hidden = true;
    return;
  }

  ui.ageInput.setAttribute("aria-invalid", "false");
  ui.ageFeedback.textContent = "Paciente apto para continuar al Paso 2.";
  ui.step1Stop.hidden = true;
  ui.step1Ok.hidden = false;
  ui.step1Next.hidden = false;
}

function renderStep2State() {
  if (!isAgeEligible()) {
    ui.step2Ok.hidden = true;
    ui.step2Stop.hidden = true;
    ui.step2Next.hidden = true;
    return;
  }

  const blocked = hasSelectedExclusion();
  ui.step2Stop.hidden = !blocked;
  ui.step2Ok.hidden = blocked;
  ui.step2Next.hidden = blocked;
}

function renderStep3State() {
  const riskSelected = hasSelectedRisk();

  if (riskSelected) {
    ui.riskResult.classList.add("page-algoritmo__result-card--risk");
    ui.riskResult.classList.remove("page-algoritmo__result-card--fit");
    ui.riskResultTitle.textContent =
      "RIESGO AUMENTADO → Derivación a Colonoscopía (VCC). No entregar FIT.";
    ui.riskResultText.textContent =
      "Se detectó al menos un criterio de riesgo elevado en la entrevista.";
    return;
  }

  ui.riskResult.classList.add("page-algoritmo__result-card--fit");
  ui.riskResult.classList.remove("page-algoritmo__result-card--risk");
  ui.riskResultTitle.textContent = "RIESGO PROMEDIO → Candidato a Test FIT.";
  ui.riskResultText.textContent =
    "No se detectaron criterios de riesgo elevado en esta entrevista.";
}

function renderSteps() {
  ui.steps.forEach((stepSection) => {
    const stepNumber = Number(stepSection.dataset.step || "");
    stepSection.hidden = stepNumber !== currentStep;
  });
}

function renderStepper() {
  const maxAllowedStep = getMaxAllowedStep();

  ui.stepperButtons.forEach((button) => {
    const stepNumber = Number(button.dataset.stepTarget || "");
    const isCurrent = stepNumber === currentStep;
    const isEnabled = stepNumber <= maxAllowedStep;

    button.classList.toggle("is-current", isCurrent);
    button.disabled = !isEnabled;
    button.setAttribute("aria-disabled", String(!isEnabled));

    if (isCurrent) {
      button.setAttribute("aria-current", "step");
    } else {
      button.removeAttribute("aria-current");
    }
  });
}

function getSummaryState() {
  const age = parseAge();
  const threshold = getInclusionThreshold();
  const exclusions = getSelectedLabels(ui.exclusionChecks);
  const risks = getSelectedLabels(ui.riskChecks);

  const ageEligible = age !== null && age >= threshold;
  const hasExclusion = exclusions.length > 0;
  const hasRisk = risks.length > 0;

  let step1Status = "Pendiente";
  let step2Status = "No evaluado";
  let finalStatus = "No evaluado";
  let tone = "neutral";
  let decision = "Entrevista incompleta.";

  if (age === null) {
    step1Status = `Pendiente (criterio actual ≥${threshold})`;
  } else if (!ageEligible) {
    step1Status = `STOP por edad (<${threshold})`;
    step2Status = "No evaluado (bloqueado por edad)";
    finalStatus = "No evaluado";
    tone = "danger";
    decision = `No cumple criterio de inclusión por edad (<${threshold}). Fin de la entrevista.`;
  } else {
    step1Status = `Incluye (≥${threshold})`;

    if (hasExclusion) {
      step2Status = "STOP por vigilancia vigente";
      finalStatus = "No aplica al programa masivo";
      tone = "warning";
      decision =
        "Paciente en seguimiento activo / ventana de vigilancia vigente. No aplica al programa masivo.";
    } else {
      step2Status = "Sin criterios de exclusión";

      if (hasRisk) {
        finalStatus = "Derivación a Colonoscopía (VCC)";
        tone = "danger";
        decision =
          "RIESGO AUMENTADO → Derivación a Colonoscopía (VCC). No entregar FIT.";
      } else {
        finalStatus = "Candidato a Test FIT";
        tone = "success";
        decision = "RIESGO PROMEDIO → Candidato a Test FIT.";
      }
    }
  }

  return {
    age,
    threshold,
    exclusions,
    risks,
    step1Status,
    step2Status,
    finalStatus,
    tone,
    decision,
  };
}

function populateSummaryModal() {
  const summary = getSummaryState();

  ui.summaryAge.textContent =
    summary.age === null ? "No informada" : `${summary.age} años`;
  ui.summaryStep1.textContent = summary.step1Status;
  ui.summaryStep2.textContent = summary.step2Status;
  ui.summaryFinal.textContent = summary.finalStatus;

  ui.summaryDecisionPill.classList.remove(
    "page-algoritmo__decision-pill--success",
    "page-algoritmo__decision-pill--warning",
    "page-algoritmo__decision-pill--danger",
    "page-algoritmo__decision-pill--neutral",
  );

  const toneClass = {
    success: "page-algoritmo__decision-pill--success",
    warning: "page-algoritmo__decision-pill--warning",
    danger: "page-algoritmo__decision-pill--danger",
    neutral: "page-algoritmo__decision-pill--neutral",
  }[summary.tone];

  ui.summaryDecisionPill.classList.add(toneClass || "page-algoritmo__decision-pill--neutral");
  ui.summaryDecisionPill.textContent = summary.decision;
}

function openSummaryModal() {
  populateSummaryModal();
  ui.modalToast.textContent = "";

  lastFocusedBeforeModal = document.activeElement;
  ui.summaryModal.hidden = false;
  ui.summaryModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("is-modal-open");

  document.addEventListener("keydown", onModalKeydown);

  const focusables = getModalFocusableElements();
  if (focusables.length > 0) {
    focusables[0].focus();
  } else {
    ui.summaryDialog.focus();
  }
}

function closeSummaryModal() {
  if (ui.summaryModal.hidden) return;

  ui.summaryModal.hidden = true;
  ui.summaryModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("is-modal-open");
  document.removeEventListener("keydown", onModalKeydown);

  if (lastFocusedBeforeModal && typeof lastFocusedBeforeModal.focus === "function") {
    lastFocusedBeforeModal.focus();
  }
}

function onModalKeydown(event) {
  if (ui.summaryModal.hidden) return;

  if (event.key === "Escape") {
    event.preventDefault();
    closeSummaryModal();
    return;
  }

  if (event.key !== "Tab") return;

  const focusables = getModalFocusableElements();
  if (focusables.length === 0) {
    event.preventDefault();
    ui.summaryDialog.focus();
    return;
  }

  const first = focusables[0];
  const last = focusables[focusables.length - 1];

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
    return;
  }

  if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function getModalFocusableElements() {
  return Array.from(
    ui.summaryDialog.querySelectorAll(
      "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])",
    ),
  ).filter((el) => !el.disabled && el.offsetParent !== null);
}

function buildSummaryText() {
  const summary = getSummaryState();

  return [
    "Estratificación de Riesgo - PPCCR",
    `Edad ingresada: ${summary.age === null ? "No informada" : `${summary.age} años`}`,
    `Estado Paso 1: ${summary.step1Status}`,
    `Estado Paso 2: ${summary.step2Status}`,
    `Resultado final: ${summary.finalStatus}`,
    `Exclusiones marcadas: ${summary.exclusions.length > 0 ? summary.exclusions.join("; ") : "Ninguna"}`,
    `Riesgos marcados: ${summary.risks.length > 0 ? summary.risks.join("; ") : "Ninguno"}`,
    `Determinación: ${summary.decision}`,
  ].join("\n");
}

async function copySummaryTextFromModal() {
  const success = await writeClipboard(buildSummaryText());
  showModalToast(
    success
      ? "Resumen copiado al portapapeles."
      : "No se pudo copiar automáticamente. Podés copiarlo manualmente.",
  );
}

async function writeClipboard(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (_error) {
    // fallback
  }

  try {
    const helper = document.createElement("textarea");
    helper.value = text;
    helper.setAttribute("readonly", "true");
    helper.style.position = "fixed";
    helper.style.top = "-9999px";
    document.body.appendChild(helper);
    helper.select();
    const copied = document.execCommand("copy");
    document.body.removeChild(helper);
    return copied;
  } catch (_error) {
    return false;
  }
}

function showModalToast(message) {
  ui.modalToast.textContent = message;
}

function getTimestampForFilename() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hour = String(now.getHours()).padStart(2, "0");
  const minute = String(now.getMinutes()).padStart(2, "0");
  return `${year}${month}${day}-${hour}${minute}`;
}

function isIOSLikeDevice() {
  return /iP(ad|hone|od)/.test(navigator.userAgent);
}

function drawRoundedRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function getWrappedLines(ctx, text, maxWidth) {
  const words = String(text || "").trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [""];

  const lines = [];
  let line = "";

  words.forEach((word) => {
    const candidate = line ? `${line} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth || !line) {
      line = candidate;
    } else {
      lines.push(line);
      line = word;
    }
  });

  if (line) lines.push(line);
  return lines;
}

function drawTextBlock(ctx, options) {
  const {
    text,
    x,
    y,
    maxWidth,
    lineHeight,
    font,
    color,
  } = options;

  ctx.font = font;
  ctx.fillStyle = color;
  const lines = getWrappedLines(ctx, text, maxWidth);

  lines.forEach((line, index) => {
    ctx.fillText(line, x, y + index * lineHeight);
  });

  return y + (lines.length - 1) * lineHeight;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

async function buildSummaryCanvas() {
  const summary = getSummaryState();

  const canvas = document.createElement("canvas");
  canvas.width = 1280;
  canvas.height = 920;
  const ctx = canvas.getContext("2d");
  const card = {
    x: 64,
    y: 52,
    width: 1152,
    height: 816,
  };
  const rowsX = {
    label: card.x + 36,
    value: card.x + 390,
  };

  const bgGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  bgGradient.addColorStop(0, "#f5f9ff");
  bgGradient.addColorStop(1, "#e9f3ff");
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  drawRoundedRect(ctx, card.x, card.y, card.width, card.height, 30);
  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = "rgba(5, 28, 57, 0.16)";
  ctx.shadowBlur = 28;
  ctx.shadowOffsetY = 12;
  ctx.fill();
  ctx.restore();

  ctx.save();
  drawRoundedRect(ctx, card.x, card.y, card.width, 142, 30);
  const headerGradient = ctx.createLinearGradient(
    card.x,
    card.y,
    card.x + card.width,
    card.y + 142,
  );
  headerGradient.addColorStop(0, "#0f5fa6");
  headerGradient.addColorStop(1, "#0b3e72");
  ctx.fillStyle = headerGradient;
  ctx.fill();
  ctx.restore();

  try {
    const logo = await loadImage("assets/logo-cinta-azul.png");
    ctx.drawImage(logo, card.x + 28, card.y + 24, 78, 78);
  } catch (_error) {
    // si falla el logo, continuar sin bloquear descarga
  }

  ctx.fillStyle = "#ffffff";
  ctx.font = "800 44px 'Avenir Next', 'Segoe UI', sans-serif";
  ctx.fillText("Estratificación de Riesgo", card.x + 126, card.y + 85);
  ctx.font = "600 24px 'Avenir Next', 'Segoe UI', sans-serif";
  ctx.fillText(
    "Programa de Prevención de Cáncer Colorrectal",
    card.x + 126,
    card.y + 128,
  );

  const rowsTop = card.y + 182;
  let rowY = rowsTop;
  const rowLineHeight = 32;
  const rowLabelOffset = 28;
  const rowsRuleX1 = card.x + 28;
  const rowsRuleX2 = card.x + card.width - 30;
  const rowValueMaxWidth = card.width - 460;

  const rows = [
    ["Edad ingresada", summary.age === null ? "No informada" : `${summary.age} años`],
    ["Estado Paso 1", summary.step1Status],
    ["Estado Paso 2", summary.step2Status],
    ["Resultado final", summary.finalStatus],
  ];

  rows.forEach((row) => {
    ctx.font = "700 25px 'Avenir Next', 'Segoe UI', sans-serif";
    const valueLines = getWrappedLines(ctx, row[1], rowValueMaxWidth);
    const valueHeight = valueLines.length * rowLineHeight;
    const rowHeight = Math.max(54, valueHeight + 12);

    ctx.fillStyle = "#5a6f89";
    ctx.font = "700 24px 'Avenir Next', 'Segoe UI', sans-serif";
    ctx.fillText(row[0], rowsX.label, rowY + rowLabelOffset);

    drawTextBlock(ctx, {
      text: row[1],
      x: rowsX.value,
      y: rowY + rowLabelOffset,
      maxWidth: rowValueMaxWidth,
      lineHeight: rowLineHeight,
      font: "800 25px 'Avenir Next', 'Segoe UI', sans-serif",
      color: "#0b3e72",
    });

    const ruleY = rowY + rowHeight + 10;
    ctx.strokeStyle = "rgba(15, 95, 166, 0.24)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(rowsRuleX1, ruleY);
    ctx.lineTo(rowsRuleX2, ruleY);
    ctx.stroke();

    rowY = ruleY + 20;
  });

  const toneStyles = {
    success: { bg: "#dcf4e7", text: "#0e5f3a", border: "#76be99" },
    warning: { bg: "#ffe9bc", text: "#7d530a", border: "#d6ac5b" },
    danger: { bg: "#ffd8d8", text: "#8e2626", border: "#d58a8a" },
    neutral: { bg: "#e9f0f7", text: "#415974", border: "#9cb1c8" },
  };

  const tone = toneStyles[summary.tone] || toneStyles.neutral;
  const decisionTextY = rowY + 62;

  ctx.font = "900 34px 'Avenir Next', 'Segoe UI', sans-serif";
  const decisionLines = getWrappedLines(ctx, summary.decision, card.width - 116);
  const decisionLineHeight = 42;
  const decisionInnerPadding = 28;
  const decisionHeight = Math.max(
    112,
    decisionInnerPadding * 2 + decisionLines.length * decisionLineHeight - 14,
  );

  ctx.save();
  drawRoundedRect(
    ctx,
    card.x + 26,
    decisionTextY - 54,
    card.width - 52,
    decisionHeight,
    18,
  );
  ctx.fillStyle = tone.bg;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = tone.border;
  ctx.stroke();
  ctx.restore();

  const lastDecisionY = drawTextBlock(ctx, {
    text: summary.decision,
    x: card.x + 54,
    y: decisionTextY,
    maxWidth: card.width - 116,
    lineHeight: decisionLineHeight,
    font: "900 34px 'Avenir Next', 'Segoe UI', sans-serif",
    color: tone.text,
  });

  const generatedAt = (() => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = now.getFullYear();
    const hour = String(now.getHours()).padStart(2, "0");
    const minute = String(now.getMinutes()).padStart(2, "0");
    return `${day}/${month}/${year} ${hour}:${minute}`;
  })();
  ctx.fillStyle = "#537091";
  ctx.font = "600 21px 'Avenir Next', 'Segoe UI', sans-serif";
  ctx.fillText(`Generado: ${generatedAt}`, card.x + 30, lastDecisionY + 68);

  return canvas;
}

async function downloadSummaryImage() {
  try {
    const canvas = await buildSummaryCanvas();
    const dataUrl = canvas.toDataURL("image/png");
    const filename = `ppccr-resumen-${getTimestampForFilename()}.png`;

    let downloaded = false;

    if ("download" in HTMLAnchorElement.prototype && !isIOSLikeDevice()) {
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      downloaded = true;
    }

    if (!downloaded) {
      const newTab = window.open();
      if (newTab) {
        newTab.document.title = filename;
        newTab.document.body.style.margin = "0";
        newTab.document.body.style.background = "#0f172a";
        newTab.document.body.style.display = "grid";
        newTab.document.body.style.placeItems = "center";

        const image = newTab.document.createElement("img");
        image.src = dataUrl;
        image.alt = "Estratificación de Riesgo PPCCR";
        image.style.maxWidth = "100vw";
        image.style.maxHeight = "100vh";
        image.style.objectFit = "contain";
        newTab.document.body.appendChild(image);
      } else {
        window.location.href = dataUrl;
      }
    }

    showModalToast("Imagen generada correctamente.");
  } catch (_error) {
    showModalToast("No se pudo generar la imagen. Intentá nuevamente.");
  }
}

function resetWizard() {
  ui.form.reset();
  currentStep = STEP.AGE;

  if (!ui.summaryModal.hidden) {
    closeSummaryModal();
  }

  refreshWizardState();
  ui.ageInput.focus();
}
