// =====================================================
// ITR FACT CONTRACT (S22)
// Legal declaration of ITR requirements per Income Tax Department
// This is law, not logic - changes only when ITD rules change
// =====================================================

/**
 * Canonical ITR requirements per Income Tax Department
 * 
 * Each ITR type defines:
 * - label: Human-readable name
 * - description: Who should use this ITR
 * - requires: Mandatory fact paths (OR groups supported with |)
 * - forbids: Disqualifying fact paths
 * - conditions: Additional eligibility rules
 */
const ITR_FACT_CONTRACT = {
    ITR1: {
        label: 'Sahaj',
        description: 'For resident individuals with salary, one house property, other income',
        primaryFact: 'income.salary',
        requires: [
            'personalInfo',
            'income.salary',
            'taxes.tds',
            'bankAccounts',
            'verification'
        ],
        forbids: [
            'income.capitalGains',
            'income.business',
            'income.presumptive'
        ],
        conditions: {
            resident: true,
            maxIncome: 50_00_000 // ₹50 lakhs
        }
    },

    ITR2: {
        label: 'Capital Gains / No Business',
        description: 'For individuals with capital gains, multiple properties, foreign income',
        primaryFact: 'income.capitalGains',
        requires: [
            'income.salary|houseProperty|capitalGains', // At least one income source
            'taxes',
            'bankAccounts',
            'verification'
        ],
        forbids: [
            'income.business',
            'income.presumptive'
        ],
        conditions: {
            resident: true
        }
    },

    ITR3: {
        label: 'Business / Profession',
        description: 'For individuals/HUFs with business or professional income',
        primaryFact: 'income.business',
        requires: [
            'income.business.profile',
            'income.business.profitLoss',
            'income.business.balanceSheet',
            'income.business.assetsLiabilities',
            'bankAccounts',
            'verification'
        ],
        forbids: [],
        conditions: {}
    },

    ITR4: {
        label: 'Presumptive',
        description: 'For individuals/HUFs with presumptive business income (Section 44AD/44ADA/44AE)',
        primaryFact: 'income.presumptive',
        requires: [
            'income.presumptive',
            'taxes',
            'bankAccounts',
            'verification'
        ],
        forbids: [
            'income.capitalGains',
            'income.business'
        ],
        conditions: {
            maxTurnover: 2_00_00_000 // ₹2 crores
        }
    }
};

module.exports = ITR_FACT_CONTRACT;
