// =====================================================
// TAX COMPUTATION ENGINE (S24.B)
// Chapter-wise pure computation functions
// Deterministic, explainable, edge-safe
// =====================================================

const TAX_FACT_CONTRACT = require('../../domain/TAX_FACT_CONTRACT');
const enterpriseLogger = require('../../utils/logger');

/**
 * S24.B: Chapter-Wise Tax Computation
 * 
 * Pure functions for each income/deduction chapter.
 * Each function returns: { taxableAmount, breakdown, notes }
 * 
 * Constitutional guarantees:
 * - Pure functions (no mutations)
 * - Deterministic (same input → same output)
 * - Explainable (breakdown + notes)
 * - Edge-safe (handles zero, negative, boundary values)
 */
class TaxComputationEngine {
    /**
     * Compute salary income
     * Section 15-17
     */
    static computeSalaryIncome(salaryFacts) {
        if (!salaryFacts || !salaryFacts.employers || salaryFacts.employers.length === 0) {
            return {
                taxableAmount: 0,
                breakdown: [],
                notes: ['No salary income']
            };
        }

        const breakdown = [];
        let totalGross = 0;
        let totalDeductions = 0;

        for (const employer of salaryFacts.employers) {
            const gross = employer.grossSalary || 0;
            const professionalTax = employer.professionalTax || 0;
            const standardDeduction = employer.standardDeduction || 50000; // FY 2023-24 onwards

            totalGross += gross;
            totalDeductions += (professionalTax + standardDeduction);

            breakdown.push({
                employer: employer.name,
                gross,
                professionalTax,
                standardDeduction,
                netSalary: gross - professionalTax - standardDeduction
            });
        }

        const taxableAmount = Math.max(0, totalGross - totalDeductions);

        return {
            taxableAmount,
            breakdown,
            notes: [
                `Total gross salary: ₹${totalGross}`,
                `Standard deduction: ₹${totalDeductions}`,
                `Taxable salary income: ₹${taxableAmount}`
            ]
        };
    }

    /**
     * Compute house property income
     * Section 22-27
     */
    static computeHousePropertyIncome(hpFacts) {
        if (!hpFacts || !hpFacts.properties || hpFacts.properties.length === 0) {
            return {
                taxableAmount: 0,
                breakdown: [],
                notes: ['No house property income']
            };
        }

        const breakdown = [];
        let totalIncome = 0;

        for (const property of hpFacts.properties) {
            if (property.type === 'self-occupied') {
                // Self-occupied: Loss limited to ₹2L for interest
                const interestLoss = Math.min(property.interestOnLoan || 0, 200000);
                const netIncome = -interestLoss;

                breakdown.push({
                    type: 'self-occupied',
                    annualValue: 0,
                    interestOnLoan: property.interestOnLoan || 0,
                    netIncome
                });

                totalIncome += netIncome;
            } else if (property.type === 'let-out') {
                // Let-out: NAV - Municipal taxes - 30% standard deduction - Interest
                const annualValue = property.annualValue || 0;
                const municipalTaxes = property.municipalTaxes || 0;
                const nav = annualValue - municipalTaxes;
                const standardDeduction = nav * 0.30;
                const interest = property.interestOnLoan || 0;
                const netIncome = nav - standardDeduction - interest;

                breakdown.push({
                    type: 'let-out',
                    annualValue,
                    municipalTaxes,
                    nav,
                    standardDeduction,
                    interestOnLoan: interest,
                    netIncome
                });

                totalIncome += netIncome;
            }
        }

        return {
            taxableAmount: totalIncome,  // Can be negative (loss)
            breakdown,
            notes: [
                `Total house property income: ₹${totalIncome}`,
                totalIncome < 0 ? 'Loss can be set off against other heads' : ''
            ].filter(Boolean)
        };
    }

    /**
     * Compute capital gains
     * Section 45-55A
     */
    static computeCapitalGains(cgFacts) {
        if (!cgFacts || !cgFacts.transactions || cgFacts.transactions.length === 0) {
            return {
                taxableAmount: 0,
                breakdown: { shortTerm: 0, longTerm: 0 },
                notes: ['No capital gains']
            };
        }

        let shortTermGains = 0;
        let longTermGains = 0;
        const transactions = [];

        for (const txn of cgFacts.transactions) {
            const saleValue = txn.saleValue || 0;
            const cost = txn.gainType === 'long-term'
                ? (txn.indexedCost || txn.purchaseValue || 0)
                : (txn.purchaseValue || 0);
            const expenses = txn.expenses || 0;
            const gain = saleValue - cost - expenses;

            if (txn.gainType === 'short-term') {
                shortTermGains += gain;
            } else {
                longTermGains += gain;
            }

            transactions.push({
                assetType: txn.assetType,
                gainType: txn.gainType,
                saleValue,
                cost,
                expenses,
                gain
            });
        }

        return {
            taxableAmount: shortTermGains + longTermGains,
            breakdown: {
                shortTerm: shortTermGains,
                longTerm: longTermGains,
                transactions
            },
            notes: [
                `Short-term capital gains: ₹${shortTermGains}`,
                `Long-term capital gains: ₹${longTermGains}`,
                'LTCG on equity > ₹1L taxed at 10%',
                'STCG on equity taxed at 15%'
            ]
        };
    }

    /**
     * Compute business income
     * Section 28-44
     */
    static computeBusinessIncome(businessFacts) {
        if (!businessFacts || !businessFacts.businesses || businessFacts.businesses.length === 0) {
            return {
                taxableAmount: 0,
                breakdown: [],
                notes: ['No business income']
            };
        }

        let totalIncome = 0;
        const breakdown = [];

        for (const business of businessFacts.businesses) {
            const netProfit = business.netProfit || 0;
            totalIncome += netProfit;

            breakdown.push({
                name: business.name,
                turnover: business.turnover || 0,
                grossProfit: business.grossProfit || 0,
                netProfit
            });
        }

        return {
            taxableAmount: totalIncome,
            breakdown,
            notes: [`Total business income: ₹${totalIncome}`]
        };
    }

    /**
     * Compute presumptive income
     * Section 44AD / 44ADA / 44AE
     * @param {object|array} presumptiveFacts - Array of sections or single section object
     */
    static computePresumptiveIncome(presumptiveFacts) {
        if (!presumptiveFacts) {
            return { taxableAmount: 0, breakdown: [], notes: ['No presumptive income'] };
        }

        const entries = Array.isArray(presumptiveFacts) ? presumptiveFacts : [presumptiveFacts];

        if (entries.length === 0 || !entries[0].section) {
            return { taxableAmount: 0, breakdown: [], notes: ['No presumptive income'] };
        }

        let totalTaxableIncome = 0;
        const breakdown = [];
        const notes = [];

        for (const entry of entries) {
            const grossReceipts = entry.grossReceipts || 0;
            const presumptiveRate = entry.presumptiveRate || (entry.section === '44ADA' ? 50 : 8);
            const declaredIncome = entry.declaredIncome || (grossReceipts * presumptiveRate / 100);

            totalTaxableIncome += declaredIncome;
            breakdown.push({
                section: entry.section,
                businessName: entry.businessName,
                grossReceipts,
                presumptiveRate,
                declaredIncome
            });

            notes.push(`Presumptive income (${entry.section}): ₹${declaredIncome} on receipts of ₹${grossReceipts}`);
        }

        return {
            taxableAmount: totalTaxableIncome,
            breakdown,
            notes
        };
    }

    /**
     * Compute Chapter VI-A deductions
     * Section 80C-80U
     */
    static computeChapterVIA(deductionFacts, regime = 'old') {
        if (regime === 'new') {
            // New regime: No Chapter VI-A deductions (except 80CCD(2))
            return {
                totalDeduction: 0,
                breakdown: {},
                notes: ['New regime: Chapter VI-A deductions not allowed']
            };
        }

        if (!deductionFacts) {
            return {
                totalDeduction: 0,
                breakdown: {},
                notes: ['No deductions claimed']
            };
        }

        const breakdown = {};
        let totalDeduction = 0;

        // 80C
        if (deductionFacts.section80C) {
            const claimed = Math.min(
                deductionFacts.section80C.totalInvestments || 0,
                TAX_FACT_CONTRACT.chapterVIA.section80C.maxLimit
            );
            breakdown.section80C = claimed;
            totalDeduction += claimed;
        }

        // 80D
        if (deductionFacts.section80D) {
            const claimed = Math.min(
                (deductionFacts.section80D.healthInsurance || 0) + (deductionFacts.section80D.preventiveCheckup || 0),
                deductionFacts.section80D.maxLimit || 25000
            );
            breakdown.section80D = claimed;
            totalDeduction += claimed;
        }

        // 80E
        if (deductionFacts.section80E) {
            breakdown.section80E = deductionFacts.section80E.educationLoanInterest || 0;
            totalDeduction += breakdown.section80E;
        }

        // 80TTA/80TTB
        if (deductionFacts.section80TTA) {
            const claimed = Math.min(
                deductionFacts.section80TTA.savingsInterest || 0,
                TAX_FACT_CONTRACT.chapterVIA.section80TTA.maxLimit
            );
            breakdown.section80TTA = claimed;
            totalDeduction += claimed;
        }

        return {
            totalDeduction,
            breakdown,
            notes: [
                `Total Chapter VI-A deductions: ₹${totalDeduction}`,
                ...Object.entries(breakdown).map(([section, amount]) => `${section}: ₹${amount}`)
            ]
        };
    }

    /**
     * Compute rebate under Section 87A
     */
    static computeRebate87A(totalIncome, taxBeforeRebate, regime = 'old') {
        const rebateConfig = TAX_FACT_CONTRACT.rebate87A[regime === 'old' ? 'oldRegime' : 'newRegime'];

        if (totalIncome <= rebateConfig.incomeLimit) {
            const rebate = Math.min(taxBeforeRebate, rebateConfig.rebateAmount);
            return {
                rebate,
                notes: [`Rebate u/s 87A: ₹${rebate} (income ≤ ₹${rebateConfig.incomeLimit})`]
            };
        }

        return {
            rebate: 0,
            notes: [`No rebate u/s 87A (income > ₹${rebateConfig.incomeLimit})`]
        };
    }

    /**
     * Compute surcharge
     */
    static computeSurcharge(totalIncome, taxAfterRebate) {
        const slabs = TAX_FACT_CONTRACT.surcharge.slabs;
        const applicableSlab = slabs.find(slab => totalIncome >= slab.min && totalIncome < slab.max);

        if (!applicableSlab || applicableSlab.rate === 0) {
            return {
                surcharge: 0,
                rate: 0,
                notes: ['No surcharge applicable']
            };
        }

        const surcharge = Math.round(taxAfterRebate * applicableSlab.rate / 100);

        return {
            surcharge,
            rate: applicableSlab.rate,
            notes: [`Surcharge: ${applicableSlab.rate}% on tax = ₹${surcharge}`]
        };
    }

    /**
     * Compute Health and Education Cess
     */
    static computeCess(taxPlusSurcharge) {
        const cess = Math.round(taxPlusSurcharge * TAX_FACT_CONTRACT.cess.rate / 100);

        return {
            cess,
            rate: TAX_FACT_CONTRACT.cess.rate,
            notes: [`Health and Education Cess: ${TAX_FACT_CONTRACT.cess.rate}% = ₹${cess}`]
        };
    }
}

module.exports = TaxComputationEngine;
