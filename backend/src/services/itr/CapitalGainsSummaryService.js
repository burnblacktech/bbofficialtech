// =====================================================
// CAPITAL GAINS SUMMARY SERVICE (F1.2.3)
// Provides human-readable CG summaries and tax impact
// =====================================================

const enterpriseLogger = require('../../utils/logger');

class CapitalGainsSummaryService {
    /**
     * Get human-readable capital gains summary
     * @param {object} capitalGainsData - Capital gains data from filing
     * @returns {object} - Human-readable summary
     */
    getSummary(capitalGainsData) {
        try {
            const stcgDetails = capitalGainsData?.stcgDetails || [];
            const ltcgDetails = capitalGainsData?.ltcgDetails || [];

            // Calculate totals
            const totalSTCG = stcgDetails.reduce((sum, entry) => sum + (entry.gainAmount || 0), 0);
            const totalLTCG = ltcgDetails.reduce((sum, entry) => sum + (entry.gainAmount || 0), 0);
            const totalGains = totalSTCG + totalLTCG;

            // Calculate tax impact
            const taxImpact = this.calculateTaxImpact(totalSTCG, totalLTCG);

            // Explain holding period
            const holdingPeriodExplanation = this.explainHoldingPeriod(stcgDetails, ltcgDetails);

            return {
                totalGains,
                stcg: totalSTCG,
                ltcg: totalLTCG,
                taxImpact,
                holdingPeriodExplanation,
                transactionCount: stcgDetails.length + ltcgDetails.length,
                summary: this.generateSummaryText(totalSTCG, totalLTCG, taxImpact),
            };
        } catch (error) {
            enterpriseLogger.error('Get CG summary failed', {
                error: error.message,
            });
            throw error;
        }
    }

    /**
     * Calculate tax impact with ₹1L LTCG exemption
     * @param {number} stcg - Short-term capital gains
     * @param {number} ltcg - Long-term capital gains
     * @returns {object} - Tax impact breakdown
     */
    calculateTaxImpact(stcg, ltcg) {
        const exemptionLimit = 100000; // ₹1L LTCG exemption

        // LTCG exemption
        const ltcgExempt = Math.min(ltcg, exemptionLimit);
        const ltcgTaxable = Math.max(0, ltcg - exemptionLimit);

        // Tax rates
        const stcgTaxRate = 0.15; // 15% for equity/MF STCG (Section 111A)
        const ltcgTaxRate = 0.10; // 10% for equity/MF LTCG above ₹1L (Section 112A)

        // Calculate tax
        const stcgTax = stcg * stcgTaxRate;
        const ltcgTax = ltcgTaxable * ltcgTaxRate;
        const totalTax = stcgTax + ltcgTax;

        return {
            stcg: {
                amount: stcg,
                taxRate: stcgTaxRate,
                tax: stcgTax,
            },
            ltcg: {
                amount: ltcg,
                exemptAmount: ltcgExempt,
                taxableAmount: ltcgTaxable,
                taxRate: ltcgTaxRate,
                tax: ltcgTax,
            },
            totalTax,
            explanation: this.generateTaxExplanation(stcg, ltcg, ltcgExempt, ltcgTaxable, totalTax),
        };
    }

    /**
     * Explain holding period in human language
     * @param {Array} stcgDetails - STCG entries
     * @param {Array} ltcgDetails - LTCG entries
     * @returns {string} - Human-readable explanation
     */
    explainHoldingPeriod(stcgDetails, ltcgDetails) {
        const hasSTCG = stcgDetails.length > 0;
        const hasLTCG = ltcgDetails.length > 0;

        if (hasSTCG && hasLTCG) {
            return 'You sold some investments held for less than 1 year (short-term) and some held for more than 1 year (long-term).';
        } else if (hasSTCG) {
            return 'You sold investments held for less than 1 year (short-term gains).';
        } else if (hasLTCG) {
            return 'You sold investments held for more than 1 year (long-term gains).';
        }

        return 'No capital gains transactions recorded.';
    }

    /**
     * Generate summary text
     * @param {number} stcg - STCG amount
     * @param {number} ltcg - LTCG amount
     * @param {object} taxImpact - Tax impact object
     * @returns {string} - Summary text
     */
    generateSummaryText(stcg, ltcg, taxImpact) {
        const parts = [];

        if (stcg > 0) {
            parts.push(`Short-term gains: ₹${stcg.toLocaleString('en-IN')} (taxed at 15%)`);
        }

        if (ltcg > 0) {
            if (taxImpact.ltcg.exemptAmount > 0) {
                parts.push(`Long-term gains: ₹${ltcg.toLocaleString('en-IN')} (₹${taxImpact.ltcg.exemptAmount.toLocaleString('en-IN')} tax-free)`);
            } else {
                parts.push(`Long-term gains: ₹${ltcg.toLocaleString('en-IN')}`);
            }
        }

        if (parts.length === 0) {
            return 'No capital gains to report.';
        }

        return parts.join('. ') + `. Total tax: ₹${taxImpact.totalTax.toLocaleString('en-IN')}.`;
    }

    /**
     * Generate tax explanation
     * @param {number} stcg - STCG amount
     * @param {number} ltcg - LTCG amount
     * @param {number} ltcgExempt - LTCG exempt amount
     * @param {number} ltcgTaxable - LTCG taxable amount
     * @param {number} totalTax - Total tax
     * @returns {string} - Tax explanation
     */
    generateTaxExplanation(stcg, ltcg, ltcgExempt, ltcgTaxable, totalTax) {
        const parts = [];

        if (stcg > 0) {
            parts.push(`Short-term gains are taxed at 15%.`);
        }

        if (ltcg > 0) {
            if (ltcgExempt > 0) {
                parts.push(`The first ₹1 lakh of long-term gains from shares/mutual funds is tax-free. You saved ₹${(ltcgExempt * 0.1).toLocaleString('en-IN')} in taxes!`);
            }
            if (ltcgTaxable > 0) {
                parts.push(`Long-term gains above ₹1 lakh are taxed at 10%.`);
            }
        }

        if (parts.length === 0) {
            return 'No tax on capital gains.';
        }

        return parts.join(' ');
    }

    /**
     * Get asset type in human language
     * @param {string} assetType - Asset type code
     * @returns {string} - Human-readable asset type
     */
    getHumanAssetType(assetType) {
        const typeMap = {
            'equity_shares': 'Shares (stocks)',
            'mutual_funds': 'Mutual funds',
            'property': 'Property',
            'bonds': 'Bonds',
            'crypto': 'Cryptocurrency',
            'other': 'Other investments',
        };
        return typeMap[assetType] || assetType || 'Investment';
    }
}

module.exports = new CapitalGainsSummaryService();
