"use strict";

const STEP = {
  AGE: 1,
  EXCLUSIONS: 2,
  RISK: 3,
};

const ui = {};
let currentStep = STEP.AGE;

document.addEventListener("DOMContentLoaded", initWizard);

function initWizard() {
  captureElements();
  bindEvents();
  refreshWizardState();
}

function captureElements() {
  ui.form = document.getElementById("risk-wizard");
  ui.steps = Array.from(document.querySelectorAll(".wizard-step[data-step]"));
  ui.stepperButtons = Array.from(
    document.querySelectorAll(".stepper__button[data-step-target]"),
  );

  ui.ageInput = document.getElementById("edad-input");
  ui.ageFeedback = document.getElementById("edad-feedback");
  ui.step1Stop = document.getElementById("step1-stop");
  ui.step1Next = document.getElementById("step1-next");

  ui.exclusionChecks = Array.from(document.querySelectorAll(".exclusion-check"));
  ui.step2Stop = document.getElementById("step2-stop");
  ui.step2Prev = document.getElementById("step2-prev");
  ui.step2Next = document.getElementById("step2-next");

  ui.riskChecks = Array.from(document.querySelectorAll(".risk-check"));
  ui.step3Prev = document.getElementById("step3-prev");
  ui.riskResult = document.getElementById("risk-result");
  ui.riskResultTitle = document.getElementById("risk-result-title");
  ui.riskResultText = document.getElementById("risk-result-text");

  ui.copyButton = document.getElementById("copy-summary");
  ui.resetButton = document.getElementById("reset-wizard");
  ui.copyFeedback = document.getElementById("copy-feedback");
}

function bindEvents() {
  ui.ageInput.addEventListener("input", () => {
    sanitizeAge();
    refreshWizardState();
  });

  ui.step1Next.addEventListener("click", () => {
    if (isAgeEligible()) goToStep(STEP.EXCLUSIONS);
  });

  ui.exclusionChecks.forEach((check) => {
    check.addEventListener("change", refreshWizardState);
  });

  ui.step2Prev.addEventListener("click", () => goToStep(STEP.AGE));
  ui.step2Next.addEventListener("click", () => {
    if (canProceedFromExclusions()) goToStep(STEP.RISK);
  });

  ui.riskChecks.forEach((check) => {
    check.addEventListener("change", refreshWizardState);
  });

  ui.step3Prev.addEventListener("click", () => goToStep(STEP.EXCLUSIONS));

  ui.stepperButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const step = Number(button.dataset.stepTarget || "");
      if (!Number.isFinite(step)) return;
      goToStep(step);
    });
  });

  ui.copyButton.addEventListener("click", copySummaryToClipboard);
  ui.resetButton.addEventListener("click", resetWizard);
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

function parseAge() {
  const raw = String(ui.ageInput.value || "").trim();
  if (raw === "") return null;

  const value = Number(raw);
  if (!Number.isFinite(value)) return null;
  return value;
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
  return age !== null && age >= 50;
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
  const maxAllowedStep = getMaxAllowedStep();
  currentStep = Math.min(boundedStep, maxAllowedStep);
  renderSteps();
  renderStepper();
}

function refreshWizardState() {
  renderStep1Validation();
  renderStep2Validation();
  renderRiskResult();

  const maxAllowedStep = getMaxAllowedStep();
  if (currentStep > maxAllowedStep) {
    currentStep = maxAllowedStep;
  }

  renderSteps();
  renderStepper();
}

function renderStep1Validation() {
  const age = parseAge();

  if (age === null) {
    ui.ageInput.setAttribute("aria-invalid", "false");
    ui.ageFeedback.textContent = "Ingresá la edad para continuar.";
    ui.step1Stop.hidden = true;
    ui.step1Next.disabled = true;
    return;
  }

  if (age < 50) {
    ui.ageInput.setAttribute("aria-invalid", "true");
    ui.ageFeedback.textContent =
      "Edad menor a 50 años. No cumple criterio de inclusión por edad.";
    ui.step1Stop.hidden = false;
    ui.step1Next.disabled = true;
    return;
  }

  ui.ageInput.setAttribute("aria-invalid", "false");
  ui.ageFeedback.textContent = "Edad válida para continuar al siguiente paso.";
  ui.step1Stop.hidden = true;
  ui.step1Next.disabled = false;
}

function renderStep2Validation() {
  const blocked = hasSelectedExclusion();
  ui.step2Stop.hidden = !blocked;
  ui.step2Next.disabled = !isAgeEligible() || blocked;
}

function renderRiskResult() {
  const riskSelected = hasSelectedRisk();

  if (riskSelected) {
    ui.riskResult.classList.add("result-card--risk");
    ui.riskResult.classList.remove("result-card--fit");
    ui.riskResultTitle.textContent =
      "RIESGO AUMENTADO \u2192 Derivación primaria a Colonoscopía (VCC). No entregar FIT.";
    ui.riskResultText.textContent =
      "Se detectó al menos un criterio de riesgo elevado en la entrevista.";
    return;
  }

  ui.riskResult.classList.add("result-card--fit");
  ui.riskResult.classList.remove("result-card--risk");
  ui.riskResultTitle.textContent = "RIESGO PROMEDIO \u2192 Candidato a Test FIT.";
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

    if (isCurrent) {
      button.setAttribute("aria-current", "step");
    } else {
      button.removeAttribute("aria-current");
    }
  });
}

function buildDecision() {
  const age = parseAge();
  const selectedExclusions = getSelectedLabels(ui.exclusionChecks);
  const selectedRisk = getSelectedLabels(ui.riskChecks);

  if (age === null) {
    return "Entrevista incompleta (edad no informada).";
  }

  if (age < 50) {
    return "No cumple criterio de inclusión por edad. Fin de la entrevista.";
  }

  if (selectedExclusions.length > 0) {
    return "Paciente en seguimiento activo o ventana de vigilancia vigente. No aplica al programa masivo.";
  }

  if (selectedRisk.length > 0) {
    return "RIESGO AUMENTADO -> Derivación primaria a Colonoscopía (VCC). No entregar FIT.";
  }

  return "RIESGO PROMEDIO -> Candidato a Test FIT.";
}

function buildSummaryText() {
  const age = parseAge();
  const selectedExclusions = getSelectedLabels(ui.exclusionChecks);
  const selectedRisk = getSelectedLabels(ui.riskChecks);

  return [
    "Resumen - Algoritmo / Criterios de Riesgo",
    `Edad: ${age === null ? "No informada" : age}`,
    `Exclusiones marcadas: ${
      selectedExclusions.length > 0
        ? selectedExclusions.join("; ")
        : "Ninguna"
    }`,
    `Riesgos marcados: ${selectedRisk.length > 0 ? selectedRisk.join("; ") : "Ninguno"}`,
    `Decision final: ${buildDecision()}`,
  ].join("\n");
}

async function copySummaryToClipboard() {
  const summary = buildSummaryText();
  const success = await writeClipboard(summary);

  ui.copyFeedback.textContent = success
    ? "Resumen copiado al portapapeles."
    : "No fue posible copiar automáticamente. Copiá el resumen manualmente.";
}

async function writeClipboard(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (_error) {
    // fallback con textarea
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

function resetWizard() {
  ui.form.reset();
  ui.copyFeedback.textContent = "";
  currentStep = STEP.AGE;
  refreshWizardState();
  ui.ageInput.focus();
}
