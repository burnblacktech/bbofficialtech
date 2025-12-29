/**
 * regimeSignals.js
 * Generates signals related to Tax Regime selection
 */

module.exports = {
    evaluate: (formData, taxComputation) => {
        const signals = [];

        // 1. Regime Optimization Check
        const currentRegime = formData?.personalInfo?.files?.regime || 'NEW';
        const taxPayable = taxComputation?.taxSummary?.totalTaxPayable || 0;

        // Use comparison object if available in computation result
        const comparison = taxComputation?.regimeComparison;

        if (comparison) {
            const otherRegime = currentRegime === 'NEW' ? 'OLD' : 'NEW';
            const otherTax = comparison[otherRegime]?.totalTaxPayable;

            // Only trigger if otherTax is defined and significantly lower
            if (otherTax !== undefined && taxPayable > (otherTax + 100)) {
                signals.push({
                    id: "REGIME_OPTIMIZATION",
                    category: "regime",
                    severity: "important",
                    confidence: 1.0,
                    reasonCode: "RULE_BETTER_REGIME_AVAILABLE",
                    facts: {
                        currentRegime,
                        currentTax: taxPayable,
                        betterRegime: otherRegime,
                        savings: taxPayable - otherTax
                    },
                    recommendation: {
                        action: "SWITCH_REGIME",
                        target: "REGIME_TOGGLE"
                    }
                });
            }
        }

        return signals;
    }
};
