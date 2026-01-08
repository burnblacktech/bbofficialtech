// =====================================================
// CAPITAL GAINS INTELLIGENCE SIGNALS (F1.2.3)
// Detects capital gains and prompts user in human language
// =====================================================

module.exports = {
    evaluate: (formData, taxComputation) => {
        const signals = [];

        // Check if AIS has capital gains data
        const aisData = formData?.ais || {};
        const capitalGains = formData?.income?.capitalGains || {};
        const aisHasCG = aisData.capitalGains && (
            (aisData.capitalGains.stcg && aisData.capitalGains.stcg > 0) ||
            (aisData.capitalGains.ltcg && aisData.capitalGains.ltcg > 0)
        );

        // Check if user has declared CG
        const userIntent = formData?.capitalGainsIntent || {};
        const userDeclared = userIntent.declared;

        // Estimate total gains from AIS
        const estimatedGains = (aisData.capitalGains?.stcg || 0) + (aisData.capitalGains?.ltcg || 0);

        // 1. Prompt user if AIS has CG but no user response yet
        if (aisHasCG && userDeclared === null) {
            signals.push({
                id: "POSSIBLE_CAPITAL_GAINS",
                category: "capital_gains",
                severity: "info",
                confidence: 0.9,
                reasonCode: "RULE_AIS_HAS_CG",
                message: "Investment sale activity detected in AIS",
                prompt: {
                    question: "Did you sell any shares, mutual funds, or crypto this year?",
                    options: ["Yes", "No", "Not sure"],
                    context: "We noticed investment activity in your AIS data"
                },
                facts: {
                    aisHasCG: true,
                    estimatedGains,
                    source: "AIS"
                },
                recommendation: {
                    action: "ANSWER_PROMPT",
                    target: "CAPITAL_GAINS_INTENT"
                }
            });
        }

        // 2. AIS Mismatch Warning - User says "No" but AIS has CG
        if (aisHasCG && userDeclared === false) {
            signals.push({
                id: "CG_AIS_MISMATCH",
                category: "capital_gains",
                severity: "warning",
                confidence: 1.0,
                reasonCode: "RULE_CG_USER_AIS_MISMATCH",
                message: "AIS shows investment sale income but you indicated 'No'",
                facts: {
                    aisAmount: estimatedGains,
                    userResponse: "no",
                    mismatchType: "user_denial"
                },
                recommendation: {
                    action: "REVIEW_AIS",
                    target: "CAPITAL_GAINS",
                    userMessage: "Please review your AIS data or update your response. Ignoring capital gains can lead to tax notices."
                }
            });
        }

        // 3. Dividend income heuristic (soft signal)
        const dividendIncome = formData?.income?.otherSources?.dividends || 0;
        if (dividendIncome > 10000 && !aisHasCG && userDeclared === null) {
            signals.push({
                id: "POSSIBLE_CAPITAL_GAINS_DIVIDEND",
                category: "capital_gains",
                severity: "info",
                confidence: 0.5,
                reasonCode: "RULE_DIVIDEND_HEURISTIC",
                message: "Dividend income detected - you may have sold investments",
                prompt: {
                    question: "Did you sell any shares or mutual funds this year?",
                    options: ["Yes", "No", "Not sure"],
                    context: "We noticed dividend income, which often indicates investment holdings"
                },
                facts: {
                    dividendIncome,
                    source: "HEURISTIC"
                },
                recommendation: {
                    action: "ANSWER_PROMPT",
                    target: "CAPITAL_GAINS_INTENT"
                }
            });
        }

        // 4. LTCG Exemption Awareness (if user has LTCG)
        const ltcgAmount = capitalGains.ltcgDetails?.reduce((sum, entry) => sum + (entry.gainAmount || 0), 0) || 0;
        const exemptionLimit = 100000; // ₹1L

        if (ltcgAmount > 0 && userDeclared === true) {
            const exemptAmount = Math.min(ltcgAmount, exemptionLimit);
            const taxableAmount = Math.max(0, ltcgAmount - exemptionLimit);

            signals.push({
                id: "LTCG_EXEMPTION_INFO",
                category: "capital_gains",
                severity: "info",
                confidence: 1.0,
                reasonCode: "RULE_LTCG_EXEMPTION",
                message: `₹${exemptAmount.toLocaleString('en-IN')} of your long-term gains is tax-free`,
                facts: {
                    totalLTCG: ltcgAmount,
                    exemptAmount,
                    taxableAmount,
                    exemptionLimit
                },
                recommendation: {
                    action: "SHOW_INFO",
                    target: "TAX_SUMMARY",
                    userMessage: `Good news: The first ₹1 lakh of long-term gains from shares/MF is tax-free. Your taxable amount: ₹${taxableAmount.toLocaleString('en-IN')}`
                }
            });
        }

        return signals;
    }
};
