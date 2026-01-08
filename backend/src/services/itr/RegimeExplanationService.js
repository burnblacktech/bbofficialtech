// =====================================================
// REGIME EXPLANATION SERVICE (F1.2.4)
// Translates regime comparison into human language
// =====================================================

const enterpriseLogger = require('../../utils/logger');

class RegimeExplanationService {
    /**
     * Explain regime recommendation in human language
     * @param {object} comparisonResult - Result from TaxRegimeCalculator.compareRegimes()
     * @param {object} formData - Filing form data
     * @returns {object} - Human-readable explanation
     */
    explainRecommendation(comparisonResult, formData) {
        try {
            const { comparison, oldRegime, newRegime } = comparisonResult;
            const { recommendedRegime, savings } = comparison;

            // Generate reasoning
            const reasoning = this.generateReasoning(oldRegime, newRegime, formData);

            // Get deduction impact
            const deductionImpact = this.getDeductionImpact(formData);

            // Generate trade-off
            const tradeoff = this.generateTradeoff(deductionImpact);

            return {
                recommendedRegime,
                savings: Math.round(savings),
                explanation: `You save ₹${Math.round(savings).toLocaleString('en-IN')} by choosing the ${recommendedRegime === 'new' ? 'New' : 'Old'} Tax Regime`,
                reasoning,
                deductionImpact,
                tradeoff,
                comparisonTable: this.generateComparisonTable(oldRegime, newRegime),
            };
        } catch (error) {
            enterpriseLogger.error('Explain recommendation failed', {
                error: error.message,
            });
            throw error;
        }
    }

    /**
     * Generate reasoning for recommendation
     * @param {object} oldRegime - Old regime result
     * @param {object} newRegime - New regime result
     * @param {object} formData - Form data
     * @returns {Array} - Array of reasoning strings
     */
    generateReasoning(oldRegime, newRegime, formData) {
        const reasoning = [];
        const income = formData.income || {};
        const deductions = formData.deductions || {};

        const totalIncome = oldRegime.grossTotalIncome;
        const oldDeductions = oldRegime.totalDeductions;
        const newDeductions = newRegime.totalDeductions;

        // Income level reasoning
        if (totalIncome > 1500000) {
            reasoning.push('Your income is in the highest tax bracket (>₹15L)');
        } else if (totalIncome > 1000000) {
            reasoning.push('Your income level (₹10L-15L) benefits from new regime\'s lower rates');
        } else if (totalIncome > 500000) {
            reasoning.push('Your income level (₹5L-10L) can benefit from either regime depending on deductions');
        }

        // Deduction reasoning
        const deductionDiff = oldDeductions - newDeductions;
        if (deductionDiff > 150000) {
            reasoning.push(`You have significant deductions (₹${Math.round(deductionDiff).toLocaleString('en-IN')}) that reduce tax in old regime`);
        } else if (deductionDiff < 50000) {
            reasoning.push('You don\'t have many deductions to claim, so new regime\'s lower rates work better');
        }

        // 80C specific
        const section80C = deductions.section80C || 0;
        if (section80C >= 150000) {
            reasoning.push('You\'re maximizing 80C deductions (₹1.5L) - old regime rewards this');
        } else if (section80C === 0 && newRegime.finalTaxLiability < oldRegime.finalTaxLiability) {
            reasoning.push('Without 80C investments, new regime\'s ₹50K standard deduction is simpler');
        }

        // HRA specific
        const hra = income.hra || 0;
        if (hra > 50000) {
            reasoning.push(`Your HRA deduction (₹${Math.round(hra).toLocaleString('en-IN')}) is only available in old regime`);
        }

        // Tax rate comparison
        const oldTaxRate = (oldRegime.finalTaxLiability / oldRegime.grossTotalIncome) * 100;
        const newTaxRate = (newRegime.finalTaxLiability / newRegime.grossTotalIncome) * 100;

        if (newTaxRate < oldTaxRate - 2) {
            reasoning.push(`New regime has effectively lower tax rate (${newTaxRate.toFixed(1)}% vs ${oldTaxRate.toFixed(1)}%)`);
        } else if (oldTaxRate < newTaxRate - 2) {
            reasoning.push(`Old regime has effectively lower tax rate (${oldTaxRate.toFixed(1)}% vs ${newTaxRate.toFixed(1)}%) due to deductions`);
        }

        return reasoning;
    }

    /**
     * Get deduction impact (what's lost in new regime)
     * @param {object} formData - Form data
     * @returns {object} - Deduction impact breakdown
     */
    getDeductionImpact(formData) {
        const deductions = formData.deductions || {};
        const income = formData.income || {};

        const oldRegimeDeductions = {
            section80C: Math.min(deductions.section80C || 0, 150000),
            section80D: deductions.section80D || 0,
            section80E: deductions.section80E || 0,
            section80G: deductions.section80G || 0,
            section80TTA: Math.min(deductions.section80TTA || 0, 10000),
            section80TTB: Math.min(deductions.section80TTB || 0, 50000),
            hra: income.hra || 0,
            standardDeduction: income.salary > 0 ? 50000 : 0,
            otherDeductions: deductions.otherDeductions || 0,
        };

        const oldTotal = Object.values(oldRegimeDeductions).reduce((sum, val) => sum + val, 0);

        const newRegimeDeductions = {
            standardDeduction: income.salary > 0 ? 50000 : 0,
        };

        const newTotal = Object.values(newRegimeDeductions).reduce((sum, val) => sum + val, 0);

        const lostDeductions = oldTotal - newTotal;

        // Generate human-readable list of lost deductions
        const lostDeductionsHuman = [];
        if (oldRegimeDeductions.section80C > 0) {
            lostDeductionsHuman.push(`₹${oldRegimeDeductions.section80C.toLocaleString('en-IN')} in 80C (PPF, ELSS, life insurance, etc.)`);
        }
        if (oldRegimeDeductions.section80D > 0) {
            lostDeductionsHuman.push(`₹${oldRegimeDeductions.section80D.toLocaleString('en-IN')} in 80D (Health insurance)`);
        }
        if (oldRegimeDeductions.hra > 0) {
            lostDeductionsHuman.push(`₹${oldRegimeDeductions.hra.toLocaleString('en-IN')} in HRA (House rent allowance)`);
        }
        if (oldRegimeDeductions.section80E > 0) {
            lostDeductionsHuman.push(`₹${oldRegimeDeductions.section80E.toLocaleString('en-IN')} in 80E (Education loan interest)`);
        }
        if (oldRegimeDeductions.section80G > 0) {
            lostDeductionsHuman.push(`₹${oldRegimeDeductions.section80G.toLocaleString('en-IN')} in 80G (Donations)`);
        }

        return {
            oldRegimeDeductions,
            newRegimeDeductions,
            oldTotal,
            newTotal,
            lostDeductions,
            lostDeductionsHuman,
        };
    }

    /**
     * Generate trade-off explanation
     * @param {object} deductionImpact - Deduction impact object
     * @returns {object} - Trade-off pros/cons
     */
    generateTradeoff(deductionImpact) {
        const hasSignificantDeductions = deductionImpact.lostDeductions > 100000;

        return {
            newRegime: {
                pros: [
                    'Lower tax rates (especially for income ₹7L-15L)',
                    'Simpler - no need to track investments or collect proofs',
                    '₹50,000 standard deduction automatically applied',
                ],
                cons: hasSignificantDeductions
                    ? [
                        `Can't claim ₹${Math.round(deductionImpact.lostDeductions).toLocaleString('en-IN')} in deductions`,
                        'No benefit for 80C investments (PPF, ELSS, etc.)',
                        'HRA not allowed',
                    ]
                    : [
                        'Can\'t claim 80C, 80D, HRA deductions (but you don\'t have many)',
                    ],
            },
            oldRegime: {
                pros: hasSignificantDeductions
                    ? [
                        `Can claim ₹${Math.round(deductionImpact.oldTotal).toLocaleString('en-IN')} in deductions`,
                        'Rewards investments (80C up to ₹1.5L)',
                        'HRA, health insurance (80D) deductions available',
                    ]
                    : [
                        'Can claim deductions if you invest (80C, 80D, HRA)',
                        'Better if you have high rent or insurance premiums',
                    ],
                cons: [
                    'Higher tax rates',
                    'Requires investment proofs and documentation',
                    'More complex to file',
                ],
            },
        };
    }

    /**
     * Generate side-by-side comparison table
     * @param {object} oldResult - Old regime result
     * @param {object} newResult - New regime result
     * @returns {object} - Comparison table
     */
    generateComparisonTable(oldResult, newResult) {
        const winner = oldResult.finalTaxLiability < newResult.finalTaxLiability ? 'old' : 'new';
        const savings = Math.abs(oldResult.finalTaxLiability - newResult.finalTaxLiability);

        return {
            income: {
                label: 'Your total income',
                value: `₹${Math.round(oldResult.grossTotalIncome).toLocaleString('en-IN')}`,
            },
            deductions: {
                label: 'Deductions you can claim',
                oldRegime: `₹${Math.round(oldResult.totalDeductions).toLocaleString('en-IN')}`,
                newRegime: `₹${Math.round(newResult.totalDeductions).toLocaleString('en-IN')} (only standard deduction)`,
            },
            taxableIncome: {
                label: 'Income on which tax is calculated',
                oldRegime: `₹${Math.round(oldResult.taxableIncome).toLocaleString('en-IN')}`,
                newRegime: `₹${Math.round(newResult.taxableIncome).toLocaleString('en-IN')}`,
            },
            tax: {
                label: 'Tax you pay',
                oldRegime: `₹${Math.round(oldResult.finalTaxLiability).toLocaleString('en-IN')}`,
                newRegime: `₹${Math.round(newResult.finalTaxLiability).toLocaleString('en-IN')}`,
                winner,
            },
            winner,
            savings: Math.round(savings),
            savingsFormatted: `₹${Math.round(savings).toLocaleString('en-IN')}`,
        };
    }
}

module.exports = new RegimeExplanationService();
