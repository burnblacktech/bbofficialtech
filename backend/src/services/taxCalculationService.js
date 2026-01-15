/**
 * Tax Calculation Service
 * Core tax calculation engine for ITR filing
 */

const {
    oldRegimeSlabs,
    newRegimeSlabs,
    deductionLimits,
    rebateAndCess,
    surchargeSlabs,
} = require('../utils/taxSlabs');

class TaxCalculationService {
    /**
     * Calculate tax based on regime
     * @param {number} taxableIncome - Taxable income after deductions
     * @param {string} regime - 'OLD' or 'NEW'
     * @returns {number} Tax amount
     */
    calculateTaxOnIncome(taxableIncome, regime = 'OLD') {
        const slabs = regime === 'OLD' ? oldRegimeSlabs : newRegimeSlabs;
        let tax = 0;

        for (const slab of slabs) {
            if (taxableIncome > slab.min) {
                const taxableInSlab = Math.min(taxableIncome, slab.max) - slab.min;
                tax += (taxableInSlab * slab.rate) / 100;
            }
        }

        return Math.round(tax);
    }

    /**
     * Calculate total deductions (only for old regime)
     * @param {object} deductions - Deduction details
     * @returns {number} Total deductions
     */
    calculateTotalDeductions(deductions) {
        let total = 0;

        // Section 80C
        if (deductions.section80C) {
            const section80CTotal = Object.values(deductions.section80C).reduce(
                (sum, val) => sum + (val || 0),
                0
            );
            total += Math.min(section80CTotal, deductionLimits.section80C);
        }

        // Section 80D
        if (deductions.section80D) {
            const { selfAndFamily = 0, parents = 0, preventiveHealthCheckup = 0 } = deductions.section80D;
            const selfLimit = deductionLimits.section80D.selfAndFamily;
            const parentsLimit = deductionLimits.section80D.parents;

            total += Math.min(selfAndFamily, selfLimit);
            total += Math.min(parents, parentsLimit);
            total += Math.min(preventiveHealthCheckup, deductionLimits.section80D.preventiveHealthCheckup);
        }

        // Section 80G (Donations)
        if (deductions.section80G && Array.isArray(deductions.section80G)) {
            const donationsTotal = deductions.section80G.reduce(
                (sum, donation) => sum + (donation.eligibleAmount || 0),
                0
            );
            total += donationsTotal;
        }

        // Other deductions
        if (deductions.otherDeductions) {
            total += deductions.otherDeductions.section80E || 0;
            total += Math.min(
                deductions.otherDeductions.section80TTA || 0,
                deductionLimits.section80TTA
            );
            total += Math.min(
                deductions.otherDeductions.section80TTB || 0,
                deductionLimits.section80TTB
            );
        }

        return Math.round(total);
    }

    /**
     * Calculate surcharge
     * @param {number} totalIncome - Total income
     * @param {number} tax - Tax before surcharge
     * @returns {number} Surcharge amount
     */
    calculateSurcharge(totalIncome, tax) {
        for (const slab of surchargeSlabs) {
            if (totalIncome >= slab.min && totalIncome <= slab.max) {
                return Math.round((tax * slab.rate) / 100);
            }
        }
        return 0;
    }

    /**
     * Calculate health and education cess
     * @param {number} taxPlusSurcharge - Tax + Surcharge
     * @returns {number} Cess amount
     */
    calculateCess(taxPlusSurcharge) {
        return Math.round((taxPlusSurcharge * rebateAndCess.healthAndEducationCess) / 100);
    }

    /**
     * Calculate rebate under section 87A
     * @param {number} totalIncome - Total income
     * @param {number} tax - Tax before rebate
     * @returns {number} Rebate amount
     */
    calculateRebate87A(totalIncome, tax) {
        if (totalIncome <= rebateAndCess.rebate87A.incomeLimit) {
            return Math.min(tax, rebateAndCess.rebate87A.maxRebate);
        }
        return 0;
    }

    /**
     * Complete tax calculation for a filing
     * @param {object} filingData - Filing data with income and deductions
     * @param {string} regime - 'OLD' or 'NEW'
     * @returns {object} Complete tax calculation
     */
    calculateCompleteTax(filingData, regime = 'OLD') {
        // Calculate gross total income
        const grossTotalIncome = this.calculateGrossTotalIncome(filingData);

        // Calculate deductions (only for old regime)
        const totalDeductions = regime === 'OLD'
            ? this.calculateTotalDeductions(filingData.deductions || {})
            : 0;

        // Calculate taxable income
        const taxableIncome = Math.max(0, grossTotalIncome - totalDeductions);

        // Calculate tax on taxable income
        const taxBeforeRebate = this.calculateTaxOnIncome(taxableIncome, regime);

        // Calculate rebate 87A
        const rebate87A = this.calculateRebate87A(taxableIncome, taxBeforeRebate);

        // Tax after rebate
        const taxAfterRebate = Math.max(0, taxBeforeRebate - rebate87A);

        // Calculate surcharge
        const surcharge = this.calculateSurcharge(grossTotalIncome, taxAfterRebate);

        // Calculate cess
        const healthAndEducationCess = this.calculateCess(taxAfterRebate + surcharge);

        // Total tax liability
        const totalTaxLiability = taxAfterRebate + surcharge + healthAndEducationCess;

        // Calculate TDS and other payments
        const tdsAndTcs = this.calculateTDSAndTCS(filingData);
        const advanceTax = filingData.advanceTax || 0;
        const selfAssessmentTax = filingData.selfAssessmentTax || 0;

        // Calculate refund or payable
        const totalPayments = tdsAndTcs + advanceTax + selfAssessmentTax;
        const refundOrPayable = totalPayments - totalTaxLiability;

        return {
            regime,
            grossTotalIncome,
            totalDeductions,
            taxableIncome,
            taxBeforeRebate,
            rebate87A,
            taxAfterRebate,
            surcharge,
            healthAndEducationCess,
            totalTaxLiability,
            tdsAndTcs,
            advanceTax,
            selfAssessmentTax,
            totalPayments,
            refundOrPayable,
            isRefund: refundOrPayable > 0,
        };
    }

    /**
     * Calculate gross total income from all sources
     * @param {object} filingData - Filing data
     * @returns {number} Gross total income
     */
    calculateGrossTotalIncome(filingData) {
        let total = 0;

        // Income from salary
        if (filingData.incomeFromSalary && Array.isArray(filingData.incomeFromSalary)) {
            total += filingData.incomeFromSalary.reduce(
                (sum, salary) => sum + (salary.netSalary || 0),
                0
            );
        }

        // Income from house property
        if (filingData.incomeFromHouseProperty && Array.isArray(filingData.incomeFromHouseProperty)) {
            total += filingData.incomeFromHouseProperty.reduce(
                (sum, property) => sum + (property.netIncome || 0),
                0
            );
        }

        // Income from business
        if (filingData.incomeFromBusiness) {
            total += filingData.incomeFromBusiness.netProfit || 0;
        }

        // Capital gains
        if (filingData.capitalGains) {
            if (filingData.capitalGains.shortTerm && Array.isArray(filingData.capitalGains.shortTerm)) {
                total += filingData.capitalGains.shortTerm.reduce(
                    (sum, gain) => sum + (gain.gain || 0),
                    0
                );
            }
            if (filingData.capitalGains.longTerm && Array.isArray(filingData.capitalGains.longTerm)) {
                total += filingData.capitalGains.longTerm.reduce(
                    (sum, gain) => sum + (gain.gain || 0),
                    0
                );
            }
        }

        // Other sources
        if (filingData.otherSources) {
            total += filingData.otherSources.interestIncome || 0;
            total += filingData.otherSources.dividendIncome || 0;
            total += filingData.otherSources.otherIncome || 0;
        }

        return Math.round(total);
    }

    /**
     * Calculate total TDS and TCS
     * @param {object} filingData - Filing data
     * @returns {number} Total TDS and TCS
     */
    calculateTDSAndTCS(filingData) {
        let total = 0;

        // TDS from salary
        if (filingData.incomeFromSalary && Array.isArray(filingData.incomeFromSalary)) {
            total += filingData.incomeFromSalary.reduce(
                (sum, salary) => sum + (salary.tdsDeducted || 0),
                0
            );
        }

        // Add other TDS/TCS if available
        if (filingData.otherTDS) {
            total += filingData.otherTDS;
        }

        return Math.round(total);
    }

    /**
     * Compare old vs new regime
     * @param {object} filingData - Filing data
     * @returns {object} Comparison result
     */
    compareRegimes(filingData) {
        const oldRegimeCalc = this.calculateCompleteTax(filingData, 'OLD');
        const newRegimeCalc = this.calculateCompleteTax(filingData, 'NEW');

        const savings = oldRegimeCalc.totalTaxLiability - newRegimeCalc.totalTaxLiability;
        const recommendation = savings > 0 ? 'NEW' : 'OLD';

        return {
            oldRegime: oldRegimeCalc,
            newRegime: newRegimeCalc,
            savings: Math.abs(savings),
            recommendation,
            savingsPercentage: Math.round(
                (Math.abs(savings) / Math.max(oldRegimeCalc.totalTaxLiability, 1)) * 100
            ),
        };
    }
}

// Create singleton instance
const taxCalculationService = new TaxCalculationService();

module.exports = taxCalculationService;
