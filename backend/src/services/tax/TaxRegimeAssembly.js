// =====================================================
// TAX REGIME ASSEMBLY (S24.C)
// Regime-specific tax computation orchestration
// Assembles chapter outputs into final tax liability
// =====================================================

const TaxComputationEngine = require('./TaxComputationEngine');
const TAX_FACT_CONTRACT = require('../../domain/TAX_FACT_CONTRACT');
const enterpriseLogger = require('../../utils/logger');

/**
 * S24.C: Tax Regime Assembly
 * 
 * Orchestrates chapter-wise computations into regime-specific tax liability.
 * Regime = assembly logic, not computation logic.
 * 
 * Each regime function:
 * - Calls chapter functions
 * - Applies slab taxation
 * - Computes rebate, surcharge, cess
 * - Returns full breakdown + explainability
 */
class TaxRegimeAssembly {
    /**
     * Compute tax under Old Regime
     */
    static computeOldRegime(snapshotFacts) {
        try {
            // Step 1: Compute income from all heads
            const salary = TaxComputationEngine.computeSalaryIncome(snapshotFacts.income?.salary);
            const houseProperty = TaxComputationEngine.computeHousePropertyIncome(snapshotFacts.income?.houseProperty);
            const capitalGains = TaxComputationEngine.computeCapitalGains(snapshotFacts.income?.capitalGains);
            const business = TaxComputationEngine.computeBusinessIncome(snapshotFacts.income?.business);
            const presumptive = TaxComputationEngine.computePresumptiveIncome(snapshotFacts.income?.presumptive);

            // Step 2: Aggregate gross total income
            const grossTotalIncome =
                salary.taxableAmount +
                houseProperty.taxableAmount +
                capitalGains.taxableAmount +
                business.taxableAmount +
                presumptive.taxableAmount;

            // Step 3: Compute Chapter VI-A deductions
            const deductions = TaxComputationEngine.computeChapterVIA(snapshotFacts.deductions, 'old');

            // Step 4: Total income after deductions
            const totalIncome = Math.max(0, grossTotalIncome - deductions.totalDeduction);

            // Step 5: Compute tax on total income (slab-based)
            const taxOnIncome = this._computeSlabTax(totalIncome, 'old', snapshotFacts.taxpayerAge);

            // Step 6: Rebate u/s 87A
            const rebate = TaxComputationEngine.computeRebate87A(totalIncome, taxOnIncome, 'old');
            const taxAfterRebate = Math.max(0, taxOnIncome - rebate.rebate);

            // Step 7: Surcharge
            const surcharge = TaxComputationEngine.computeSurcharge(totalIncome, taxAfterRebate);
            const taxPlusSurcharge = taxAfterRebate + surcharge.surcharge;

            // Step 8: Health and Education Cess
            const cess = TaxComputationEngine.computeCess(taxPlusSurcharge);

            // Step 9: Final tax liability (rounded to nearest ₹10)
            const finalTaxLiability = this._roundToNearest10(taxPlusSurcharge + cess.cess);

            return {
                regime: 'old',
                grossTotalIncome,
                totalDeductions: deductions.totalDeduction,
                totalIncome,
                taxOnIncome,
                rebate: rebate.rebate,
                taxAfterRebate,
                surcharge: surcharge.surcharge,
                cess: cess.cess,
                finalTaxLiability,
                breakdown: {
                    income: {
                        salary: salary.taxableAmount,
                        houseProperty: houseProperty.taxableAmount,
                        capitalGains: capitalGains.taxableAmount,
                        business: business.taxableAmount,
                        presumptive: presumptive.taxableAmount
                    },
                    deductions: deductions.breakdown,
                    slabsApplied: this._getSlabsApplied(totalIncome, 'old', snapshotFacts.taxpayerAge)
                },
                notes: [
                    ...salary.notes,
                    ...houseProperty.notes,
                    ...capitalGains.notes,
                    ...business.notes,
                    ...presumptive.notes,
                    ...deductions.notes,
                    ...rebate.notes,
                    ...surcharge.notes,
                    ...cess.notes,
                    `Final tax liability (Old Regime): ₹${finalTaxLiability}`
                ]
            };
        } catch (error) {
            enterpriseLogger.error('Old regime computation failed', { error: error.message });
            throw error;
        }
    }

    /**
     * Compute tax under New Regime
     */
    static computeNewRegime(snapshotFacts) {
        try {
            // Step 1: Compute income from all heads
            const salary = TaxComputationEngine.computeSalaryIncome(snapshotFacts.income?.salary);
            const houseProperty = TaxComputationEngine.computeHousePropertyIncome(snapshotFacts.income?.houseProperty);
            const capitalGains = TaxComputationEngine.computeCapitalGains(snapshotFacts.income?.capitalGains);
            const business = TaxComputationEngine.computeBusinessIncome(snapshotFacts.income?.business);
            const presumptive = TaxComputationEngine.computePresumptiveIncome(snapshotFacts.income?.presumptive);

            // Step 2: Aggregate gross total income
            const grossTotalIncome =
                salary.taxableAmount +
                houseProperty.taxableAmount +
                capitalGains.taxableAmount +
                business.taxableAmount +
                presumptive.taxableAmount;

            // Step 3: No Chapter VI-A deductions in new regime (except 80CCD(2))
            const deductions = TaxComputationEngine.computeChapterVIA(null, 'new');

            // Step 4: Total income (no deductions)
            const totalIncome = Math.max(0, grossTotalIncome);

            // Step 5: Compute tax on total income (new regime slabs)
            const taxOnIncome = this._computeSlabTax(totalIncome, 'new', snapshotFacts.taxpayerAge);

            // Step 6: Rebate u/s 87A (higher limit in new regime)
            const rebate = TaxComputationEngine.computeRebate87A(totalIncome, taxOnIncome, 'new');
            const taxAfterRebate = Math.max(0, taxOnIncome - rebate.rebate);

            // Step 7: Surcharge
            const surcharge = TaxComputationEngine.computeSurcharge(totalIncome, taxAfterRebate);
            const taxPlusSurcharge = taxAfterRebate + surcharge.surcharge;

            // Step 8: Health and Education Cess
            const cess = TaxComputationEngine.computeCess(taxPlusSurcharge);

            // Step 9: Final tax liability (rounded to nearest ₹10)
            const finalTaxLiability = this._roundToNearest10(taxPlusSurcharge + cess.cess);

            return {
                regime: 'new',
                grossTotalIncome,
                totalDeductions: 0,
                totalIncome,
                taxOnIncome,
                rebate: rebate.rebate,
                taxAfterRebate,
                surcharge: surcharge.surcharge,
                cess: cess.cess,
                finalTaxLiability,
                breakdown: {
                    income: {
                        salary: salary.taxableAmount,
                        houseProperty: houseProperty.taxableAmount,
                        capitalGains: capitalGains.taxableAmount,
                        business: business.taxableAmount,
                        presumptive: presumptive.taxableAmount
                    },
                    deductions: {},
                    slabsApplied: this._getSlabsApplied(totalIncome, 'new', snapshotFacts.taxpayerAge)
                },
                notes: [
                    ...salary.notes,
                    ...houseProperty.notes,
                    ...capitalGains.notes,
                    ...business.notes,
                    ...presumptive.notes,
                    'New Regime: No Chapter VI-A deductions allowed',
                    ...rebate.notes,
                    ...surcharge.notes,
                    ...cess.notes,
                    `Final tax liability (New Regime): ₹${finalTaxLiability}`
                ]
            };
        } catch (error) {
            enterpriseLogger.error('New regime computation failed', { error: error.message });
            throw error;
        }
    }

    /**
     * Compute slab-based tax
     * @private
     */
    static _computeSlabTax(totalIncome, regime, taxpayerAge = 'below60') {
        const slabStructure = this._getSlabStructure(regime, taxpayerAge);
        let tax = 0;
        let remainingIncome = totalIncome;

        for (const slab of slabStructure) {
            if (remainingIncome <= 0) break;

            const slabMin = slab.min;
            const slabMax = slab.max;
            const slabRate = slab.rate;

            if (totalIncome > slabMin) {
                const taxableInThisSlab = Math.min(remainingIncome, slabMax - slabMin);
                const taxInThisSlab = (taxableInThisSlab * slabRate) / 100;
                tax += taxInThisSlab;
                remainingIncome -= taxableInThisSlab;
            }
        }

        return Math.round(tax);
    }

    /**
     * Get slab structure based on regime and age
     * @private
     */
    static _getSlabStructure(regime, taxpayerAge = 'below60') {
        if (regime === 'new') {
            return TAX_FACT_CONTRACT.taxSlabs.newRegime.ay2024_25;
        }

        // Old regime: Age-dependent slabs
        if (taxpayerAge === 'superSenior' || taxpayerAge === 'above80') {
            return TAX_FACT_CONTRACT.taxSlabs.oldRegime.superSeniorCitizen;
        } else if (taxpayerAge === 'senior' || taxpayerAge === 'above60') {
            return TAX_FACT_CONTRACT.taxSlabs.oldRegime.seniorCitizen;
        }

        return TAX_FACT_CONTRACT.taxSlabs.oldRegime.ay2024_25;
    }

    /**
     * Get slabs applied for explainability
     * @private
     */
    static _getSlabsApplied(totalIncome, regime, taxpayerAge = 'below60') {
        const slabStructure = this._getSlabStructure(regime, taxpayerAge);
        const slabsApplied = [];
        let remainingIncome = totalIncome;

        for (const slab of slabStructure) {
            if (remainingIncome <= 0) break;

            if (totalIncome > slab.min) {
                const taxableInThisSlab = Math.min(remainingIncome, slab.max - slab.min);
                slabsApplied.push({
                    range: `₹${slab.min} - ₹${slab.max === Infinity ? '∞' : slab.max}`,
                    rate: `${slab.rate}%`,
                    taxableAmount: taxableInThisSlab,
                    tax: Math.round((taxableInThisSlab * slab.rate) / 100)
                });
                remainingIncome -= taxableInThisSlab;
            }
        }

        return slabsApplied;
    }

    /**
     * Round to nearest ₹10
     * @private
     */
    static _roundToNearest10(amount) {
        return Math.round(amount / 10) * 10;
    }

    /**
     * Compute tax with agricultural income rate impact
     * Agricultural income is exempt but affects the rate of tax
     * 
     * Method: Tax on (Total + Agri) - Tax on Agri
     * This ensures agricultural income pushes total income into higher slabs
     * but the agricultural portion itself is not taxed
     * 
     * @param {number} totalIncome - Total taxable income (excluding agricultural)
     * @param {number} agriculturalIncome - Agricultural income (exempt)
     * @param {string} regime - 'old' or 'new'
     * @param {string} taxpayerAge - Age category
     * @returns {number} Tax amount considering agricultural income rate impact
     */
    static computeWithAgriculturalIncome(totalIncome, agriculturalIncome, regime = 'old', taxpayerAge = 'below60') {
        if (!agriculturalIncome || agriculturalIncome <= 0) {
            // No agricultural income, compute tax normally
            return this._computeSlabTax(totalIncome, regime, taxpayerAge);
        }

        // Step 1: Compute tax on (Total income + Agricultural income)
        const combinedIncome = totalIncome + agriculturalIncome;
        const taxOnCombined = this._computeSlabTax(combinedIncome, regime, taxpayerAge);

        // Step 2: Compute tax on Agricultural income alone
        const taxOnAgri = this._computeSlabTax(agriculturalIncome, regime, taxpayerAge);

        // Step 3: Difference is the tax on total income with rate impact
        const taxWithRateImpact = Math.max(0, taxOnCombined - taxOnAgri);

        return taxWithRateImpact;
    }
}

module.exports = TaxRegimeAssembly;
