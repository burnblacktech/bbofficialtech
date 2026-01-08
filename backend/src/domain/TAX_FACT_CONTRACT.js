// =====================================================
// TAX FACT CONTRACT (S24.A)
// Legal declaration of tax computation inputs
// Defines what facts each chapter expects
// =====================================================

/**
 * S24.A: Tax Fact Contract
 * 
 * Canonical definition of facts required for tax computation.
 * Each chapter declares its input requirements explicitly.
 * 
 * This is law, not logic - changes only when tax rules change.
 */

const TAX_FACT_CONTRACT = {
    /**
     * Salary Income Facts
     * Section: Income from Salary (Section 15-17)
     */
    salaryIncome: {
        required: [
            'employers'  // Array of employer objects
        ],
        employerShape: {
            name: 'string',
            grossSalary: 'number',
            allowances: 'object',      // HRA, LTA, etc.
            perquisites: 'number',
            professionalTax: 'number',
            standardDeduction: 'number'  // Auto-computed or explicit
        }
    },

    /**
     * House Property Income Facts
     * Section: Income from House Property (Section 22-27)
     */
    houseProperty: {
        required: [
            'properties'  // Array of property objects
        ],
        propertyShape: {
            type: 'enum[self-occupied, let-out]',
            annualValue: 'number',
            municipalTaxes: 'number',
            interestOnLoan: 'number',
            standardDeduction: 'number'  // 30% of NAV for let-out
        }
    },

    /**
     * Capital Gains Facts
     * Section: Capital Gains (Section 45-55A)
     */
    capitalGains: {
        required: [
            'transactions'  // Array of transaction objects
        ],
        transactionShape: {
            assetType: 'enum[equity, debt, property, other]',
            saleDate: 'date',
            purchaseDate: 'date',
            saleValue: 'number',
            purchaseValue: 'number',
            indexedCost: 'number',  // For LTCG
            expenses: 'number',
            holdingPeriod: 'number',  // In months
            gainType: 'enum[short-term, long-term]',
            exemptionClaimed: 'object'  // 54, 54F, etc.
        }
    },

    /**
     * Business/Profession Income Facts
     * Section: Profits and Gains of Business or Profession (Section 28-44)
     */
    businessIncome: {
        required: [
            'businesses'  // Array of business objects
        ],
        businessShape: {
            name: 'string',
            natureOfBusiness: 'string',
            turnover: 'number',
            grossProfit: 'number',
            expenses: 'object',
            depreciation: 'number',
            netProfit: 'number',
            booksRequired: 'boolean'
        }
    },

    /**
     * Presumptive Income Facts
     * Section: Presumptive Taxation (Section 44AD/44ADA/44AE)
     */
    presumptiveIncome: {
        required: [
            'section',  // 44AD | 44ADA | 44AE
            'grossReceipts',
            'presumptiveRate'
        ],
        section44AD: {
            grossReceipts: 'number',
            presumptiveRate: 'number',  // 8% or 6% (digital)
            declaredIncome: 'number'
        },
        section44ADA: {
            grossReceipts: 'number',
            presumptiveRate: 'number',  // 50%
            declaredIncome: 'number'
        }
    },

    /**
     * Chapter VI-A Deductions Facts
     * Section: Deductions (Section 80C-80U)
     */
    chapterVIA: {
        section80C: {
            investments: 'array',  // PPF, ELSS, LIC, etc.
            maxLimit: 150000
        },
        section80D: {
            healthInsurance: 'number',
            preventiveCheckup: 'number',
            maxLimit: 'number'  // Age-dependent
        },
        section80E: {
            educationLoanInterest: 'number'
        },
        section80G: {
            donations: 'array'
        },
        section80TTA: {
            savingsInterest: 'number',
            maxLimit: 10000
        },
        section80TTB: {
            savingsInterest: 'number',  // For senior citizens
            maxLimit: 50000
        }
    },

    /**
     * Tax Slab Structures
     */
    taxSlabs: {
        oldRegime: {
            ay2024_25: [
                { min: 0, max: 250000, rate: 0 },
                { min: 250000, max: 500000, rate: 5 },
                { min: 500000, max: 1000000, rate: 20 },
                { min: 1000000, max: Infinity, rate: 30 }
            ],
            seniorCitizen: [
                { min: 0, max: 300000, rate: 0 },
                { min: 300000, max: 500000, rate: 5 },
                { min: 500000, max: 1000000, rate: 20 },
                { min: 1000000, max: Infinity, rate: 30 }
            ],
            superSeniorCitizen: [
                { min: 0, max: 500000, rate: 0 },
                { min: 500000, max: 1000000, rate: 20 },
                { min: 1000000, max: Infinity, rate: 30 }
            ]
        },
        newRegime: {
            ay2024_25: [
                { min: 0, max: 300000, rate: 0 },
                { min: 300000, max: 600000, rate: 5 },
                { min: 600000, max: 900000, rate: 10 },
                { min: 900000, max: 1200000, rate: 15 },
                { min: 1200000, max: 1500000, rate: 20 },
                { min: 1500000, max: Infinity, rate: 30 }
            ]
        }
    },

    /**
     * Rebate 87A
     */
    rebate87A: {
        oldRegime: {
            incomeLimit: 500000,
            rebateAmount: 12500
        },
        newRegime: {
            incomeLimit: 700000,
            rebateAmount: 25000  // FY 2023-24 onwards
        }
    },

    /**
     * Surcharge Slabs
     */
    surcharge: {
        slabs: [
            { min: 0, max: 5000000, rate: 0 },
            { min: 5000000, max: 10000000, rate: 10 },
            { min: 10000000, max: 20000000, rate: 15 },
            { min: 20000000, max: 50000000, rate: 25 },
            { min: 50000000, max: Infinity, rate: 37 }
        ]
    },

    /**
     * Health and Education Cess
     */
    cess: {
        rate: 4  // 4% on (tax + surcharge)
    }
};

module.exports = TAX_FACT_CONTRACT;
