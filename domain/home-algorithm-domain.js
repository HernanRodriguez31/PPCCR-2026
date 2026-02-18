"use strict";

(function attachHomeAlgorithmDomain(windowRef) {
  if (!windowRef) return;

  const root = (windowRef.PPCCR = windowRef.PPCCR || {});
  const domainRoot = (root.domain = root.domain || {});

  const OUTCOME = Object.freeze({
    AGE_EXCLUDED: "AGE_EXCLUDED",
    ACTIVE_SURVEILLANCE_EXCLUDED: "ACTIVE_SURVEILLANCE_EXCLUDED",
    HIGH_RISK_REFERRAL: "HIGH_RISK_REFERRAL",
    FIT_CANDIDATE: "FIT_CANDIDATE",
  });

  const OUTCOME_LABELS = Object.freeze({
    [OUTCOME.AGE_EXCLUDED]: "No incluye (<{minAge})",
    [OUTCOME.ACTIVE_SURVEILLANCE_EXCLUDED]:
      "Seguimiento vigente. No se considera candidato a campaña de screening poblacional. En estos casos la recomendación es que la persona realice una consulta médica. No entregar FIT.",
    [OUTCOME.HIGH_RISK_REFERRAL]:
      "Riesgo elevado. No se considera candidato a campaña de screening poblacional. En estos casos la recomendación es que la persona realice una consulta médica. No entregar FIT.",
    [OUTCOME.FIT_CANDIDATE]: "Candidato a Test FIT",
  });

  const OUTCOME_FINAL_LABELS = Object.freeze({
    [OUTCOME.AGE_EXCLUDED]: "Excluido por edad",
    [OUTCOME.ACTIVE_SURVEILLANCE_EXCLUDED]: "Excluido Paso 2",
    [OUTCOME.HIGH_RISK_REFERRAL]: "Excluido Paso 3",
    [OUTCOME.FIT_CANDIDATE]: "Candidato a Test FIT",
  });

  function normalizeCodeList(value) {
    if (!Array.isArray(value)) return [];
    const codes = [];
    value.forEach((item) => {
      const code = String(item || "").trim();
      if (!code || codes.includes(code)) return;
      codes.push(code);
    });
    return codes;
  }

  function normalizeAge(value, { min = 0, max = 120 } = {}) {
    const parsed = Number.parseInt(String(value ?? "").trim(), 10);
    const valid = Number.isFinite(parsed) && parsed >= min && parsed <= max;
    return { valid, value: valid ? parsed : null };
  }

  function normalizeSex(value, { allowed = [] } = {}) {
    const normalized = String(value || "").trim().toUpperCase();
    const valid = allowed.includes(normalized);
    return { valid, value: valid ? normalized : "" };
  }

  function computeAgeInclusion(age, minAge) {
    return Number.isFinite(age) && Number.isFinite(minAge) && age >= minAge;
  }

  function normalizeStep1Input(step1, { minAge, allowedSex = [], otherSex = "OTRO" } = {}) {
    const source = step1 && typeof step1 === "object" ? step1 : {};
    const normalizedAge = normalizeAge(source.age);
    const normalizedSex = normalizeSex(source.sex, { allowed: allowedSex });
    const sexOtherDetail = String(source.sexOtherDetail || "").trim();
    const includedByAge =
      typeof source.includedByAge === "boolean"
        ? source.includedByAge
        : computeAgeInclusion(normalizedAge.value, minAge);

    return {
      age: normalizedAge.value,
      sex: normalizedSex.value,
      sexOtherDetail: normalizedSex.value === otherSex ? sexOtherDetail : "",
      includedByAge,
    };
  }

  function isOutcome(value) {
    return Object.values(OUTCOME).includes(value);
  }

  function getOutcomeLabel(outcome, { ageExcludedLabel = "", fallbackLabel = "-" } = {}) {
    if (outcome === OUTCOME.AGE_EXCLUDED && ageExcludedLabel) return ageExcludedLabel;
    return OUTCOME_LABELS[outcome] || fallbackLabel;
  }

  function getOutcomeFinalLabel(outcome, { ageExcludedFinalLabel = "", fallbackLabel = "-" } = {}) {
    if (outcome === OUTCOME.AGE_EXCLUDED && ageExcludedFinalLabel) return ageExcludedFinalLabel;
    return OUTCOME_FINAL_LABELS[outcome] || fallbackLabel;
  }

  domainRoot.homeAlgorithm = Object.freeze({
    OUTCOME,
    normalizeCodeList,
    normalizeAge,
    normalizeSex,
    computeAgeInclusion,
    normalizeStep1Input,
    isOutcome,
    getOutcomeLabel,
    getOutcomeFinalLabel,
  });
})(window);
