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
    isIncludedByAge: domain.computeAgeInclusion,
    normalizeStep1Input: domain.normalizeStep1Input,
    isOutcome: domain.isOutcome,
    getOutcomeLabel: domain.getOutcomeLabel,
    getOutcomeFinalLabel: domain.getOutcomeFinalLabel,
  });
})(window);
