/**
 * Tax Slabs Configuration
 * Income tax slabs for old and new regime
 */

// Old Regime Tax Slabs (FY 2023-24)
const oldRegimeSlabs = [
    { min: 0, max: 250000, rate: 0 },
    { min: 250001, max: 500000, rate: 5 },
    { min: 500001, max: 1000000, rate: 20 },
    { min: 1000001, max: Infinity, rate: 30 },
];

// New Regime Tax Slabs (FY 2023-24)
const newRegimeSlabs = [
    { min: 0, max: 300000, rate: 0 },
    { min: 300001, max: 600000, rate: 5 },
    { min: 600001, max: 900000, rate: 10 },
    { min: 900001, max: 1200000, rate: 15 },
    { min: 1200001, max: 1500000, rate: 20 },
    { min: 1500001, max: Infinity, rate: 30 },
];

// Deduction Limits
const deductionLimits = {
    section80C: 150000,
    section80CCD1B: 50000,
    section80D: {
        selfAndFamily: 25000,
        selfAndFamilySenior: 50000,
        parents: 25000,
        parentsSenior: 50000,
        preventiveHealthCheckup: 5000,
    },
    section80G: Infinity, // No limit, but 50% or 100% eligible
    section80E: Infinity, // No limit
    section80TTA: 10000,
    section80TTB: 50000,
    standardDeduction: 50000,
};

// Rebate and Cess
const rebateAndCess = {
    rebate87A: {
        maxRebate: 12500,
        incomeLimit: 500000,
    },
    healthAndEducationCess: 4, // 4% of (tax + surcharge)
};

// Surcharge Slabs
const surchargeSlabs = [
    { min: 0, max: 5000000, rate: 0 },
    { min: 5000001, max: 10000000, rate: 10 },
    { min: 10000001, max: 20000000, rate: 15 },
    { min: 20000001, max: 50000000, rate: 25 },
    { min: 50000001, max: Infinity, rate: 37 },
];

module.exports = {
    oldRegimeSlabs,
    newRegimeSlabs,
    deductionLimits,
    rebateAndCess,
    surchargeSlabs,
};
