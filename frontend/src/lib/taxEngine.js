// =====================================================
// TAX COMPUTATION ENGINE
// Comprehensive client-side tax calculation for ITR 1-4
// FY 2024-25 (AY 2025-26) Tax Rules
// =====================================================

// Tax slabs for FY 2024-25
const TAX_SLABS = {
  // Old Regime (with deductions)
  OLD: [
    { min: 0, max: 250000, rate: 0 },
    { min: 250001, max: 500000, rate: 0.05 },
    { min: 500001, max: 1000000, rate: 0.2 },
    { min: 1000001, max: Infinity, rate: 0.3 },
  ],
  // New Regime (FY 2024-25 updated)
  NEW: [
    { min: 0, max: 300000, rate: 0 },
    { min: 300001, max: 700000, rate: 0.05 },
    { min: 700001, max: 1000000, rate: 0.1 },
    { min: 1000001, max: 1200000, rate: 0.15 },
    { min: 1200001, max: 1500000, rate: 0.2 },
    { min: 1500001, max: Infinity, rate: 0.3 },
  ],
  // Senior Citizens (60-80 years) Old Regime
  OLD_SENIOR: [
    { min: 0, max: 300000, rate: 0 },
    { min: 300001, max: 500000, rate: 0.05 },
    { min: 500001, max: 1000000, rate: 0.2 },
    { min: 1000001, max: Infinity, rate: 0.3 },
  ],
  // Super Senior Citizens (80+ years) Old Regime
  OLD_SUPER_SENIOR: [
    { min: 0, max: 500000, rate: 0 },
    { min: 500001, max: 1000000, rate: 0.2 },
    { min: 1000001, max: Infinity, rate: 0.3 },
  ],
};

// Surcharge rates
const SURCHARGE_RATES = {
  OLD: [
    { min: 0, max: 5000000, rate: 0 },
    { min: 5000001, max: 10000000, rate: 0.1 },
    { min: 10000001, max: 20000000, rate: 0.15 },
    { min: 20000001, max: 50000000, rate: 0.25 },
    { min: 50000001, max: Infinity, rate: 0.37 },
  ],
  NEW: [
    { min: 0, max: 5000000, rate: 0 },
    { min: 5000001, max: 10000000, rate: 0.1 },
    { min: 10000001, max: 20000000, rate: 0.15 },
    { min: 20000001, max: Infinity, rate: 0.25 }, // Capped at 25% for new regime
  ],
};

// Rebate u/s 87A
const REBATE_87A = {
  OLD: { limit: 500000, maxRebate: 12500 },
  NEW: { limit: 700000, maxRebate: 25000 },
};

// Standard Deduction (New Regime FY 2024-25)
const STANDARD_DEDUCTION = {
  NEW: 75000,
  OLD: 50000,
};

// Health & Education Cess
const CESS_RATE = 0.04;

/**
 * Calculate tax based on income slabs
 */
const calculateSlabTax = (income, slabs) => {
  let tax = 0;
  let remaining = income;

  for (const slab of slabs) {
    if (remaining <= 0) break;

    const slabAmount = Math.min(remaining, slab.max - slab.min + 1);
    if (income > slab.min) {
      const taxableInSlab = Math.min(slabAmount, income - slab.min);
      tax += taxableInSlab * slab.rate;
      remaining -= taxableInSlab;
    }
  }

  return Math.round(tax);
};

/**
 * Calculate surcharge
 */
const calculateSurcharge = (tax, totalIncome, regime) => {
  const rates = SURCHARGE_RATES[regime];
  
  for (const rate of rates) {
    if (totalIncome >= rate.min && totalIncome <= rate.max) {
      return Math.round(tax * rate.rate);
    }
  }
  
  return 0;
};

/**
 * Calculate rebate u/s 87A
 */
const calculateRebate = (tax, totalIncome, regime) => {
  const rebateConfig = REBATE_87A[regime];
  
  if (totalIncome <= rebateConfig.limit) {
    return Math.min(tax, rebateConfig.maxRebate);
  }
  
  return 0;
};

/**
 * Calculate cess
 */
const calculateCess = (taxAfterSurcharge) => {
  return Math.round(taxAfterSurcharge * CESS_RATE);
};

/**
 * Aggregate agricultural income for rate calculation (Partial Integration Method)
 * Agricultural income is exempt but affects tax rates when:
 * 1. Agricultural income > ₹5,000 AND
 * 2. Non-agricultural income > basic exemption limit
 * 
 * Formula (Partial Integration):
 * Step 1: Tax on (non-agri income + agri income)
 * Step 2: Tax on (agri income + basic exemption limit)
 * Step 3: Tax payable = Step 1 - Step 2
 * 
 * @param {number} nonAgriIncome - Non-agricultural income (gross, before deductions)
 * @param {number} agriIncome - Agricultural income (exempt but used for rate calculation)
 * @param {number} age - Taxpayer age (for determining basic exemption limit)
 * @returns {number} Additional tax due to agricultural income affecting the rate
 */
const calculateAgriculturalAggregation = (nonAgriIncome, agriIncome, age = 0) => {
  // Determine basic exemption limit based on age
  const basicExemption = age >= 80 ? 500000 : age >= 60 ? 300000 : 250000;
  
  // Partial integration applies only if:
  // 1. Agricultural income > ₹5,000 (regulatory threshold)
  // 2. Non-agricultural income > basic exemption limit
  if (agriIncome <= 5000 || nonAgriIncome <= basicExemption) {
    return 0;
  }

  // Determine which tax slabs to use based on age
  let taxSlabs;
  if (age >= 80) {
    taxSlabs = TAX_SLABS.OLD_SUPER_SENIOR;
  } else if (age >= 60) {
    taxSlabs = TAX_SLABS.OLD_SENIOR;
  } else {
    taxSlabs = TAX_SLABS.OLD;
  }

  // Step 1: Calculate tax on (non-agri + agri) - total income for rate purposes
  const totalIncome = nonAgriIncome + agriIncome;
  const taxOnTotal = calculateSlabTax(totalIncome, taxSlabs);

  // Step 2: Calculate tax on (agri + basic exemption) - tax on agricultural income portion
  const agriWithExemption = agriIncome + basicExemption;
  const taxOnAgriExemption = calculateSlabTax(agriWithExemption, taxSlabs);

  // Step 3: Additional tax due to agricultural income affecting the rate
  // This is the difference: tax calculated at higher rate due to agri income
  return Math.max(0, taxOnTotal - taxOnAgriExemption);
};

/**
 * Calculate total deductions under Old Regime
 */
const calculateDeductions = (deductionData = {}) => {
  const deductions = {
    section80C: Math.min(deductionData.section80C || 0, 150000),
    section80CCC: Math.min(deductionData.section80CCC || 0, 150000),
    section80CCD1: Math.min(deductionData.section80CCD1 || 0, 150000),
    section80CCD1B: Math.min(deductionData.section80CCD1B || 0, 50000), // NPS additional
    section80CCD2: deductionData.section80CCD2 || 0, // Employer NPS (no limit)
    section80D: Math.min(deductionData.section80D || 0, 100000), // Health insurance
    section80DD: Math.min(deductionData.section80DD || 0, 125000), // Disabled dependent
    section80DDB: Math.min(deductionData.section80DDB || 0, 100000), // Medical treatment
    section80E: deductionData.section80E || 0, // Education loan (no limit)
    section80EE: Math.min(deductionData.section80EE || 0, 50000), // Home loan interest
    section80EEA: Math.min(deductionData.section80EEA || 0, 150000), // Affordable housing
    section80G: deductionData.section80G || 0, // Donations
    section80GG: Math.min(deductionData.section80GG || 0, 60000), // Rent paid (no HRA)
    section80TTA: Math.min(deductionData.section80TTA || 0, 10000), // Savings interest
    section80TTB: Math.min(deductionData.section80TTB || 0, 50000), // Senior citizen interest
    section80U: deductionData.section80U || 0, // Self disability
  };

  // 80C, 80CCC, 80CCD(1) combined limit is 1.5L
  const combinedLimit = 150000;
  const combined80C = deductions.section80C + deductions.section80CCC + deductions.section80CCD1;
  const capped80C = Math.min(combined80C, combinedLimit);

  return {
    ...deductions,
    combined80C: capped80C,
    total:
      capped80C +
      deductions.section80CCD1B +
      deductions.section80CCD2 +
      deductions.section80D +
      deductions.section80DD +
      deductions.section80DDB +
      deductions.section80E +
      deductions.section80EE +
      deductions.section80EEA +
      deductions.section80G +
      deductions.section80GG +
      deductions.section80TTA +
      deductions.section80TTB +
      deductions.section80U,
  };
};

/**
 * Main tax computation function
 */
export const computeTax = (params) => {
  const {
    // Income sources
    salary = 0,
    housePropertyIncome = 0,
    capitalGains = { stcg: 0, ltcg: 0 },
    businessIncome = 0,
    professionalIncome = 0,
    otherIncome = 0,
    
    // Exempt income (for rate purposes)
    agriculturalIncome = 0,
    
    // Presumptive income (ITR-4)
    presumptiveBusiness44AD = 0,
    presumptiveProfessional44ADA = 0,
    presumptiveGoodsCarriage44AE = 0,
    
    // Deductions
    deductions = {},
    
    // TDS and taxes paid
    tdsDeducted = 0,
    advanceTax = 0,
    selfAssessmentTax = 0,
    
    // Taxpayer details
    regime = 'NEW',
    isSeniorCitizen = false,
    isSuperSeniorCitizen = false,
    assessmentYear = '2025-26',
  } = params;

  // Calculate gross total income
  let grossTotalIncome =
    salary +
    housePropertyIncome +
    capitalGains.stcg +
    capitalGains.ltcg +
    businessIncome +
    professionalIncome +
    otherIncome +
    presumptiveBusiness44AD +
    presumptiveProfessional44ADA +
    presumptiveGoodsCarriage44AE;

  // Apply standard deduction
  const standardDeduction = salary > 0 ? STANDARD_DEDUCTION[regime] : 0;
  grossTotalIncome -= standardDeduction;

  // Calculate deductions (Old Regime only)
  const deductionDetails = regime === 'OLD' ? calculateDeductions(deductions) : { total: 0 };
  const totalDeductions = deductionDetails.total;

  // Calculate taxable income
  let taxableIncome = Math.max(0, grossTotalIncome - totalDeductions);

  // Determine tax slabs based on age and regime
  let taxSlabs = TAX_SLABS[regime];
  if (regime === 'OLD' && isSuperSeniorCitizen) {
    taxSlabs = TAX_SLABS.OLD_SUPER_SENIOR;
  } else if (regime === 'OLD' && isSeniorCitizen) {
    taxSlabs = TAX_SLABS.OLD_SENIOR;
  }

  // Calculate base tax (excluding special rate incomes)
  const normalIncome = taxableIncome - capitalGains.stcg - capitalGains.ltcg;
  let baseTax = calculateSlabTax(normalIncome, taxSlabs);

  // STCG is taxed at 15% (after adjusting for basic exemption used)
  const stcgTax = Math.round(capitalGains.stcg * 0.15);

  // LTCG above 1L is taxed at 10% (no indexation) or 20% (with indexation)
  const ltcgExempt = Math.min(capitalGains.ltcg, 100000);
  const ltcgTaxable = Math.max(0, capitalGains.ltcg - 100000);
  const ltcgTax = Math.round(ltcgTaxable * 0.10); // Assuming equity (10%)

  // Total tax before rebate
  let totalTax = baseTax + stcgTax + ltcgTax;

  // Agricultural income aggregation (Old Regime only)
  // Partial integration applies when:
  // 1. Agricultural income > ₹5,000 AND
  // 2. Non-agricultural income > basic exemption limit
  if (regime === 'OLD' && agriculturalIncome > 5000) {
    // Use gross non-agricultural income (before deductions) for aggregation
    const nonAgriGrossIncome = grossTotalIncome - agriculturalIncome;
    const age = isSuperSeniorCitizen ? 80 : isSeniorCitizen ? 60 : 0;
    const agriAggregation = calculateAgriculturalAggregation(nonAgriGrossIncome, agriculturalIncome, age);
    totalTax += agriAggregation;
  }

  // Apply rebate u/s 87A
  const rebate = calculateRebate(totalTax, taxableIncome, regime);
  let taxAfterRebate = Math.max(0, totalTax - rebate);

  // Calculate surcharge
  const surcharge = calculateSurcharge(taxAfterRebate, taxableIncome, regime);
  const taxAfterSurcharge = taxAfterRebate + surcharge;

  // Calculate cess
  const cess = calculateCess(taxAfterSurcharge);
  const totalTaxLiability = taxAfterSurcharge + cess;

  // Calculate taxes already paid
  const totalTaxesPaid = tdsDeducted + advanceTax + selfAssessmentTax;

  // Calculate net tax payable/refund
  const netTaxPayable = totalTaxLiability - totalTaxesPaid;

  return {
    // Income breakdown
    income: {
      salary,
      housePropertyIncome,
      capitalGains,
      businessIncome,
      professionalIncome,
      otherIncome,
      agriculturalIncome,
      presumptiveIncome: {
        business44AD: presumptiveBusiness44AD,
        professional44ADA: presumptiveProfessional44ADA,
        goodsCarriage44AE: presumptiveGoodsCarriage44AE,
      },
      grossTotalIncome: grossTotalIncome + standardDeduction, // Before standard deduction
    },
    
    // Deductions
    deductions: {
      standardDeduction,
      ...deductionDetails,
    },
    
    // Tax calculation
    taxableIncome,
    taxCalculation: {
      baseTax,
      stcgTax,
      ltcgTax,
      agriculturalAggregation: regime === 'OLD' && agriculturalIncome > 5000
        ? (() => {
            const nonAgriGrossIncome = grossTotalIncome - agriculturalIncome;
            const age = isSuperSeniorCitizen ? 80 : isSeniorCitizen ? 60 : 0;
            return calculateAgriculturalAggregation(nonAgriGrossIncome, agriculturalIncome, age);
          })()
        : 0,
      totalTaxBeforeRebate: totalTax,
      rebate,
      taxAfterRebate,
      surcharge,
      cess,
      totalTaxLiability,
    },
    
    // Taxes paid
    taxesPaid: {
      tdsDeducted,
      advanceTax,
      selfAssessmentTax,
      totalTaxesPaid,
    },
    
    // Final result
    result: {
      netTaxPayable,
      isRefund: netTaxPayable < 0,
      refundAmount: netTaxPayable < 0 ? Math.abs(netTaxPayable) : 0,
      taxDue: netTaxPayable > 0 ? netTaxPayable : 0,
    },
    
    // Metadata
    meta: {
      regime,
      assessmentYear,
      isSeniorCitizen,
      isSuperSeniorCitizen,
      computedAt: new Date().toISOString(),
    },
  };
};

/**
 * Compare both regimes and recommend the better one
 */
export const compareRegimes = (params) => {
  const oldRegimeResult = computeTax({ ...params, regime: 'OLD' });
  const newRegimeResult = computeTax({ ...params, regime: 'NEW' });

  const oldTax = oldRegimeResult.taxCalculation.totalTaxLiability;
  const newTax = newRegimeResult.taxCalculation.totalTaxLiability;

  const savings = Math.abs(oldTax - newTax);
  const recommendedRegime = oldTax <= newTax ? 'OLD' : 'NEW';

  return {
    oldRegime: oldRegimeResult,
    newRegime: newRegimeResult,
    comparison: {
      oldTax,
      newTax,
      savings,
      recommendedRegime,
      reason:
        recommendedRegime === 'OLD'
          ? `Old regime saves ₹${savings.toLocaleString('en-IN')} due to deductions`
          : `New regime saves ₹${savings.toLocaleString('en-IN')} due to lower slab rates`,
    },
  };
};

/**
 * Format currency for display
 */
export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) return '₹0';
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
};

/**
 * Format compact currency (1L, 1Cr, etc.)
 */
export const formatCompactCurrency = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) return '₹0';
  
  const num = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  
  if (num >= 10000000) {
    return `${sign}₹${(num / 10000000).toFixed(2)}Cr`;
  }
  if (num >= 100000) {
    return `${sign}₹${(num / 100000).toFixed(2)}L`;
  }
  if (num >= 1000) {
    return `${sign}₹${(num / 1000).toFixed(1)}K`;
  }
  
  return `${sign}₹${num}`;
};

export default {
  computeTax,
  compareRegimes,
  formatCurrency,
  formatCompactCurrency,
  TAX_SLABS,
  SURCHARGE_RATES,
  REBATE_87A,
  STANDARD_DEDUCTION,
  CESS_RATE,
};

