// =====================================================
// TAX REGIME CALCULATOR (S24 ADAPTER)
// Adapter to use S24 formal engine for regime comparison
// Replaces stub logic with deterministic, explainable computation
// =====================================================

const TaxRegimeAssembly = require('../tax/TaxRegimeAssembly');
const enterpriseLogger = require('../../utils/logger');

/**
 * S24.E: Regime Comparison Adapter
 * 
 * Wraps S24 formal tax computation engine for regime comparison.
 * Maintains API compatibility with existing RegimeComparisonService.
 * 
 * Constitutional guarantees:
 * - No state mutation
 * - Deterministic output
 * - Explainability preserved
 * - Pure delegation to S24 engine
 */
class TaxRegimeCalculatorV2 {
    /**
     * Compare both regimes side-by-side using S24 engine
     * @param {object} formData - ITR form data (jsonPayload)
     * @param {string} assessmentYear - Assessment year
     * @returns {object} Comparison result
     */
    static compareRegimes(formData, assessmentYear = '2024-25') {
        try {
            enterpriseLogger.info('S24 regime comparison', { assessmentYear });

            // Prepare snapshot facts for S24 engine
            const snapshotFacts = this._prepareSnapshotFacts(formData);

            // Compute old regime using S24 engine
            const oldRegimeResult = TaxRegimeAssembly.computeOldRegime(snapshotFacts);

            // Compute new regime using S24 engine
            const newRegimeResult = TaxRegimeAssembly.computeNewRegime(snapshotFacts);

            // Calculate savings and recommendation
            const savings = oldRegimeResult.finalTaxLiability - newRegimeResult.finalTaxLiability;
            const recommendedRegime = savings > 0 ? 'new' : 'old';

            return {
                oldRegime: oldRegimeResult,
                newRegime: newRegimeResult,
                comparison: {
                    savings: Math.abs(savings),
                    savingsType: savings > 0 ? 'new_regime' : 'old_regime',
                    recommendedRegime,
                    difference: savings
                }
            };
        } catch (error) {
            enterpriseLogger.error('S24 regime comparison failed', {
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }

    /**
     * Prepare snapshot facts from formData for S24 engine
     * Maps existing jsonPayload structure to S24 fact contract
     * @private
     */
    static _prepareSnapshotFacts(formData) {
        const income = formData.income || {};
        const deductions = formData.deductions || {};

        return {
            income: {
                salary: this._prepareSalaryFacts(income),
                houseProperty: this._prepareHousePropertyFacts(income),
                capitalGains: this._prepareCapitalGainsFacts(income),
                business: this._prepareBusinessFacts(income),
                presumptive: this._preparePresumptiveFacts(income)
            },
            deductions: this._prepareDeductionFacts(deductions),
            taxpayerAge: this._getTaxpayerAge(formData.personalInfo)
        };
    }

    /**
     * Prepare salary facts
     * @private
     */
    static _prepareSalaryFacts(income) {
        if (!income.salary || income.salary === 0) {
            return null;
        }

        // Simple format: just gross salary
        return {
            employers: [
                {
                    name: 'Employer',
                    grossSalary: parseFloat(income.salary || 0),
                    standardDeduction: 50000,
                    professionalTax: 0
                }
            ]
        };
    }

    /**
     * Prepare house property facts
     * @private
     */
    static _prepareHousePropertyFacts(income) {
        if (!income.houseProperty || income.houseProperty === 0) {
            return null;
        }

        // Simple format: assume let-out property
        return {
            properties: [
                {
                    type: 'let-out',
                    annualValue: parseFloat(income.houseProperty || 0),
                    municipalTaxes: 0,
                    interestOnLoan: 0
                }
            ]
        };
    }

    /**
     * Prepare capital gains facts
     * @private
     */
    static _prepareCapitalGainsFacts(income) {
        if (!income.capitalGains || income.capitalGains === 0) {
            return null;
        }

        // Simple format: assume short-term gains
        return {
            transactions: [
                {
                    assetType: 'equity',
                    gainType: 'short-term',
                    saleValue: parseFloat(income.capitalGains || 0),
                    purchaseValue: 0,
                    expenses: 0
                }
            ]
        };
    }

    /**
     * Prepare business facts
     * @private
     */
    static _prepareBusinessFacts(income) {
        if (!income.businessIncome || income.businessIncome === 0) {
            return null;
        }

        return {
            businesses: [
                {
                    name: 'Business',
                    turnover: 0,
                    grossProfit: 0,
                    netProfit: parseFloat(income.businessIncome || 0)
                }
            ]
        };
    }

    /**
     * Prepare presumptive income facts
     * @private
     */
    static _preparePresumptiveFacts(income) {
        const entryList = [];
        const presumptive = income.presumptive;

        if (!presumptive) return null;

        // 44AD: Business
        if (presumptive.business) {
            const biz = presumptive.business;
            const grossReceipts = parseFloat(biz.grossReceipts || 0);
            const presumptiveIncome = parseFloat(biz.presumptiveIncome || 0);

            if (grossReceipts > 0 || presumptiveIncome > 0) {
                entryList.push({
                    section: '44AD',
                    businessName: biz.businessName || 'Business',
                    grossReceipts,
                    presumptiveRate: grossReceipts > 0 ? (presumptiveIncome / grossReceipts * 100) : 8,
                    declaredIncome: presumptiveIncome
                });
            }
        }

        // 44ADA: Professional
        if (presumptive.professional) {
            const prof = presumptive.professional;
            const grossReceipts = parseFloat(prof.grossReceipts || 0);
            const presumptiveIncome = parseFloat(prof.presumptiveIncome || 0);

            if (grossReceipts > 0 || presumptiveIncome > 0) {
                entryList.push({
                    section: '44ADA',
                    businessName: prof.professionName || 'Profession',
                    grossReceipts,
                    presumptiveRate: grossReceipts > 0 ? (presumptiveIncome / grossReceipts * 100) : 50,
                    declaredIncome: presumptiveIncome
                });
            }
        }

        return entryList.length > 0 ? entryList : null;
    }

    /**
     * Prepare deduction facts
     * @private
     */
    static _prepareDeductionFacts(deductions) {
        if (!deductions || Object.keys(deductions).length === 0) {
            return null;
        }

        return {
            section80C: {
                totalInvestments: parseFloat(deductions.section80C || 0)
            },
            section80D: {
                healthInsurance: parseFloat(deductions.section80D || 0),
                preventiveCheckup: 0,
                maxLimit: 25000
            },
            section80E: {
                educationLoanInterest: parseFloat(deductions.section80E || 0)
            },
            section80TTA: {
                savingsInterest: parseFloat(deductions.section80TTA || 0)
            }
        };
    }

    /**
     * Get taxpayer age from personal info
     * @private
     */
    static _getTaxpayerAge(personalInfo) {
        if (!personalInfo || !personalInfo.dob) {
            return 'below60';
        }

        const dob = new Date(personalInfo.dob);
        const today = new Date();
        let age = today.getFullYear() - dob.getFullYear();
        const monthDiff = today.getMonth() - dob.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
            age--;
        }

        if (age >= 80) return 'above80';
        if (age >= 60) return 'above60';
        return 'below60';
    }
}

module.exports = TaxRegimeCalculatorV2;
