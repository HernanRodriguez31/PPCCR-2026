"use strict";

(function attachHomeAlgorithmApp(windowRef) {
  if (!windowRef) return;

  const root = (windowRef.PPCCR = windowRef.PPCCR || {});
  const appRoot = (root.app = root.app || {});
  const domain = root.domain && root.domain.homeAlgorithm;

  if (!domain) {
    console.warn("[home-algo-app] domain.homeAlgorithm no disponible.");
    return;
  }

  appRoot.homeAlgorithm = Object.freeze({
    OUTCOME: domain.OUTCOME,
    normalizeCodeList: domain.normalizeCodeList,
    normalizeAge: domain.normalizeAge,
    normalizeSex: domain.normalizeSex,
    isIncludedByAge: (age, minAge, maxAge) => domain.computeAgeInclusion(age, minAge, maxAge),
    normalizeStep1Input: (step1, options) => domain.normalizeStep1Input(step1, options),
    isOutcome: domain.isOutcome,
    getOutcomeLabel: domain.getOutcomeLabel,
    getOutcomeFinalLabel: domain.getOutcomeFinalLabel,
  });
})(window);
