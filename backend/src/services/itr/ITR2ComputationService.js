// =====================================================
// ITR-2 COMPUTATION SERVICE
// For individuals with capital gains, multiple properties, foreign income
// Extends ITR-1 computation with additional income heads
// =====================================================

const ITR1ComputationService = require('./ITR1ComputationService');

class ITR2ComputationService {

  /**
   * Compute full ITR-2 tax for both regimes
   */
  static compute(payload) {
    const safePayload = payload || {};
    const income = this.computeIncome(safePayload);
    const agriIncome = n(safePayload.income?.agriculturalIncome);
    const oldRegime = this.computeRegime(income, safePayload.deductions, 'old', agriIncome, safePayload);
    const newRegime = this.computeRegime(income, safePayload.deductions, 'new', agriIncome, safePayload);

    const tds = this.computeTDS(safePayload);
    const foreignTaxCredit = this.computeForeignTaxCredit(safePayload.income?.foreignIncome, income.grossTotal, oldRegime.taxOnIncome);

    oldRegime.tdsCredit = tds.total;
    oldRegime.foreignTaxCredit = foreignTaxCredit.credit;
    oldRegime.netPayable = oldRegime.totalTax - tds.total - foreignTaxCredit.credit;
    newRegime.tdsCredit = tds.total;
    newRegime.foreignTaxCredit = foreignTaxCredit.credit;
    newRegime.netPayable = newRegime.totalTax - tds.total - foreignTaxCredit.credit;

    const recommended = oldRegime.totalTax <= newRegime.totalTax ? 'old' : 'new';
    const savings = Math.abs(oldRegime.totalTax - newRegime.totalTax);

    // Note: ITR-2 ignores business/presumptive sections if present in payload.

    return { income, oldRegime, newRegime, tds, foreignTaxCredit, recommended, savings, grossTotalIncome: income.grossTotal };
  }

  // ── Income ──

  static computeIncome(payload) {
    const employerCategory = payload.personalInfo?.employerCategory || 'OTH';
    let salary, hp, other, cg, foreign;
    try { salary = ITR1ComputationService.computeSalary(payload.income?.salary, employerCategory); }
    catch { salary = { grossSalary: 0, exemptAllowances: 0, salaryExemptions: 0, standardDeduction: 0, professionalTax: 0, entertainmentAllowanceDeduction: 0, netTaxable: 0, employers: [], tds: 0 }; }
    try { hp = this.computeHouseProperties(payload.income?.houseProperty); }
    catch { hp = { type: 'NONE', netIncome: 0 }; }
    try { other = ITR1ComputationService.computeOtherIncome(payload.income?.otherSources); }
    catch { other = { savingsInterest: 0, fdInterest: 0, dividends: 0, familyPension: 0, familyPensionExempt: 0, other: 0, interestOnITRefund: 0, winnings: 0, gifts: 0, total: 0 }; }
    try { cg = this.computeCapitalGains(payload.income?.capitalGains); }
    catch { cg = { stcg: { equity: 0, other: 0, total: 0 }, ltcg: { equity: 0, property: 0, other: 0, total: 0 }, exemptions: 0, totalTaxable: 0, transactions: [] }; }
    try { foreign = this.computeForeignIncome(payload.income?.foreignIncome); }
    catch { foreign = { incomes: [], totalIncome: 0, totalTaxPaidAbroad: 0 }; }

    // Note: ITR-2 ignores business/presumptive sections if present in payload.

    return {
      salary, houseProperty: hp, otherSources: other, capitalGains: cg, foreignIncome: foreign,
      grossTotal: salary.netTaxable + hp.netIncome + other.total + cg.totalTaxable + foreign.totalIncome,
    };
  }

  static computeHouseProperties(hpData) {
    if (!hpData?.properties?.length) {
      // Fall back to single property format from ITR-1
      return ITR1ComputationService.computeHouseProperty(hpData);
    }

    let totalIncome = 0;
    const properties = [];

    for (const prop of hpData.properties) {
      // Normalize type
      const typeMap = { selfoccupied: 'SELF_OCCUPIED', selfOccupied: 'SELF_OCCUPIED', letout: 'LET_OUT', letOut: 'LET_OUT', deemedletout: 'DEEMED_LET_OUT' };
      const pType = typeMap[prop.type] || (prop.type ? prop.type.toUpperCase() : '');

      if (pType === 'SELF_OCCUPIED') {
        const interest = Math.min(n(prop.interestOnHomeLoan), 200000);
        const net = -interest;
        properties.push({ type: 'SELF_OCCUPIED', interestOnHomeLoan: n(prop.interestOnHomeLoan), interestAllowed: interest, netIncome: net });
        totalIncome += net;
      } else if (pType === 'LET_OUT' || pType === 'DEEMED_LET_OUT') {
        const rent = n(prop.annualRentReceived);
        const municipal = n(prop.municipalTaxesPaid);
        const nav = Math.max(0, rent - municipal);
        const stdDed = Math.round(nav * 0.30);
        const interest = n(prop.interestOnHomeLoan);
        const net = nav - stdDed - interest;
        properties.push({ type: prop.type, annualRent: rent, municipalTaxes: municipal, nav, standardDeduction30: stdDed, interestOnHomeLoan: interest, netIncome: net });
        totalIncome += net;
      }
    }

    // Loss from house property: max ₹2L set-off against other income
    const setOffLimit = -200000;
    const carryForwardLoss = totalIncome < setOffLimit ? totalIncome - setOffLimit : 0;
    const adjustedIncome = totalIncome < setOffLimit ? setOffLimit : totalIncome;

    return { properties, totalIncome, adjustedIncome, carryForwardLoss, netIncome: adjustedIncome };
  }

  static computeCapitalGains(cgData) {
    if (!cgData?.transactions?.length) {
      return { stcg: { equity: 0, other: 0, total: 0 }, ltcg: { equity: 0, property: 0, other: 0, total: 0 }, exemptions: 0, totalTaxable: 0, transactions: [] };
    }

    let stcgEquity = 0, stcgOther = 0;
    let ltcgProperty = 0, ltcgOther = 0;
    let ltcgEquity = 0;
    let totalExemptions = 0;
    const transactions = [];

    // Task 9.4: Process in batches of 100 to avoid blocking the event loop
    const BATCH_SIZE = 100;
    const allTxns = cgData.transactions;
    for (let batchStart = 0; batchStart < allTxns.length; batchStart += BATCH_SIZE) {
      const batch = allTxns.slice(batchStart, batchStart + BATCH_SIZE);
      for (const txn of batch) {
      // Normalize gainType: accept 'STCG'/'LTCG' or 'short-term'/'long-term'
      const gt = (txn.gainType || '').toUpperCase();
      const isShortTerm = gt === 'STCG' || gt === 'SHORT-TERM';
      const sale = n(txn.saleValue);
      const cost = isShortTerm ? n(txn.purchaseValue) : n(txn.indexedCost || txn.purchaseValue);
      const expenses = n(txn.expenses);
      const gain = sale - cost - expenses;
      const exemption = n(txn.exemption);
      // Allow negative gains (losses) — they offset within the same category
      const taxableGain = gain - exemption;
      totalExemptions += exemption;

      if (isShortTerm) {
        if (txn.assetType === 'equity' || txn.assetType === 'equity_mf' || txn.assetType === 'mutualFund') {
          stcgEquity += taxableGain;
        } else {
          stcgOther += taxableGain;
        }
      } else {
        if (txn.assetType === 'equity' || txn.assetType === 'equity_mf' || txn.assetType === 'mutualFund') {
          ltcgEquity += taxableGain;
        } else if (txn.assetType === 'property') {
          ltcgProperty += taxableGain;
        } else {
          ltcgOther += taxableGain;
        }
      }

      transactions.push({ ...txn, gain, exemption, taxableGain });
      }
    }

    const stcgTotal = stcgEquity + stcgOther;
    const ltcgTotal = ltcgEquity + ltcgProperty + ltcgOther;

    // STCG loss can offset LTCG, LTCG loss can offset STCG (inter-category set-off)
    // But net CG loss carries forward (not set off against other income heads except house property)
    const totalTaxable = Math.max(0, stcgTotal + ltcgTotal);
    const carryForwardLoss = (stcgTotal + ltcgTotal) < 0 ? Math.abs(stcgTotal + ltcgTotal) : 0;

    return {
      stcg: { equity: stcgEquity, other: stcgOther, total: stcgTotal },
      ltcg: { equity: ltcgEquity, property: ltcgProperty, other: ltcgOther, total: ltcgTotal },
      exemptions: totalExemptions,
      totalTaxable,
      carryForwardLoss,
      transactions,
    };
  }

  static computeForeignIncome(foreignData) {
    if (!foreignData?.incomes?.length) {
      return { incomes: [], totalIncome: 0, totalTaxPaidAbroad: 0 };
    }

    let totalIncome = 0, totalTaxPaid = 0;
    const incomes = [];

    for (const inc of foreignData.incomes) {
      const amount = n(inc.amountINR);
      totalIncome += amount;
      const hasDtaa = !!(inc.dtaaApplicable || inc.dtaa);
      if (hasDtaa) totalTaxPaid += n(inc.taxPaidAbroad);
      incomes.push({ country: inc.country, type: inc.incomeType, amountINR: amount, taxPaidAbroad: n(inc.taxPaidAbroad), dtaaApplicable: hasDtaa });
    }

    return { incomes, totalIncome, totalTaxPaidAbroad: totalTaxPaid };
  }

  // ── Tax Computation ──

  static computeRegime(income, deductionData, regime, agriculturalIncome = 0, payload = null) {
    ITR1ComputationService._lastGrossTotal = income.grossTotal;
    const deductions = regime === 'old' ? ITR1ComputationService.computeDeductions(deductionData, payload) : { total: 0, breakdown: {}, warnings: [] };

    // Normal income (taxed at slab rates) — exclude VDA which is taxed at flat 30%
    const vdaGain = income.otherSources?.vdaGain || 0;
    const vdaTax = income.otherSources?.vdaTax || 0;
    const normalIncome = income.salary.netTaxable + income.houseProperty.netIncome + (income.otherSources.total - vdaGain) + income.capitalGains.stcg.other + income.foreignIncome.totalIncome;
    const taxableNormal = Math.max(0, normalIncome - deductions.total);

    // Special rate incomes
    const stcgEquity = income.capitalGains.stcg.equity; // 20% (AY 2025-26)
    const ltcgEquity = Math.max(0, income.capitalGains.ltcg.equity - 125000); // ₹1.25L exempt, 12.5%
    const ltcgOther = income.capitalGains.ltcg.property + income.capitalGains.ltcg.other; // 20%

    const grossTotal = income.grossTotal;
    const taxableIncome = taxableNormal + stcgEquity + ltcgEquity + ltcgOther;

    // Tax on normal income (slab rates) — with agricultural income partial integration
    const slabs = regime === 'old' ? OLD_SLABS : NEW_SLABS;
    const basicExemption = regime === 'old' ? 250000 : 300000;
    let normalTax = 0;
    let slabBreakdown = [];

    if (agriculturalIncome > 5000 && taxableNormal > basicExemption) {
      // Partial integration: tax on (agri + normal) minus tax on (agri + exemption)
      const { tax: taxCombined } = ITR1ComputationService.applySlabs(taxableNormal + agriculturalIncome, slabs);
      const { tax: taxAgriExempt } = ITR1ComputationService.applySlabs(agriculturalIncome + basicExemption, slabs);
      normalTax = Math.max(0, taxCombined - taxAgriExempt);
      const result = ITR1ComputationService.applySlabs(taxableNormal, slabs);
      slabBreakdown = result.slabBreakdown;
    } else {
      const result = ITR1ComputationService.applySlabs(taxableNormal, slabs);
      normalTax = result.tax;
      slabBreakdown = result.slabBreakdown;
    }

    // Tax on special rate incomes
    const stcgEquityTax = Math.round(stcgEquity * 20 / 100); // 20% for AY 2025-26
    const ltcgEquityTax = Math.round(ltcgEquity * 12.5 / 100); // 12.5% for AY 2025-26
    const ltcgOtherTax = Math.round(ltcgOther * 20 / 100); // 20%

    const totalTaxOnIncome = normalTax + stcgEquityTax + ltcgEquityTax + ltcgOtherTax + vdaTax;

    // Rebate 87A — not available if special rate income exists (for new regime, only on normal income ≤ ₹7L)
    const rebateLimit = regime === 'old' ? 500000 : 700000;
    const rebateMax = regime === 'old' ? 12500 : 25000;
    const rebateEligibleIncome = taxableNormal; // Rebate only on normal income
    const rebate = (stcgEquity + ltcgEquity + ltcgOther === 0 && rebateEligibleIncome <= rebateLimit) ? Math.min(normalTax, rebateMax) : 0;

    const taxAfterRebate = totalTaxOnIncome - rebate;

    // Surcharge
    let surchargeRate = 0;
    if (grossTotal > 50000000) surchargeRate = 37;
    else if (grossTotal > 20000000) surchargeRate = 25;
    else if (grossTotal > 10000000) surchargeRate = 15;
    else if (grossTotal > 5000000) surchargeRate = 10;
    // Cap surcharge on LTCG equity at 15%
    const surcharge = Math.round(taxAfterRebate * surchargeRate / 100);

    const cess = Math.round((taxAfterRebate + surcharge) * 4 / 100);
    const totalTax = taxAfterRebate + surcharge + cess;

    return {
      regime, grossTotalIncome: grossTotal,
      deductions: deductions.total, deductionBreakdown: deductions.breakdown,
      taxableIncome, taxableNormal, stcgEquity, ltcgEquity, ltcgOther,
      slabBreakdown, normalTax, stcgEquityTax, ltcgEquityTax, ltcgOtherTax,
      taxOnIncome: totalTaxOnIncome, rebate, surcharge, surchargeRate, cess, totalTax,
    };
  }

  // ── TDS ──

  static computeTDS(payload) {
    const base = ITR1ComputationService.computeTDS(payload);
    // Add TDS on capital gains (from broker statements)
    const fromCG = n(payload.taxes?.tds?.fromCapitalGains);
    base.fromCapitalGains = fromCG;
    base.total += fromCG;
    return base;
  }

  // ── Foreign Tax Credit ──

  static computeForeignTaxCredit(foreignData, totalIncome, taxOnIncome) {
    if (!foreignData?.incomes?.length) return { credit: 0, breakdown: [] };

    let totalCredit = 0;
    const breakdown = [];

    for (const inc of foreignData.incomes) {
      if (!(inc.dtaaApplicable || inc.dtaa) || !inc.taxPaidAbroad) continue;
      const foreignIncome = n(inc.amountINR);
      const foreignTax = n(inc.taxPaidAbroad);
      const proportionateTax = totalIncome > 0 ? Math.round((foreignIncome / totalIncome) * taxOnIncome) : 0;
      const credit = Math.min(foreignTax, proportionateTax);
      totalCredit += credit;
      breakdown.push({ country: inc.country, foreignIncome, foreignTax, indianTax: proportionateTax, credit });
    }

    return { credit: totalCredit, breakdown };
  }

  // ── Validation ──

  static validate(payload) {
    const errors = [];

    if (!payload.personalInfo?.pan || !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(payload.personalInfo.pan)) {
      errors.push({ field: 'personalInfo.pan', message: 'Valid PAN is required' });
    }

    // At least one income source
    const hasIncome = payload.income?.salary?.employers?.length > 0 ||
      payload.income?.capitalGains?.transactions?.length > 0 ||
      payload.income?.houseProperty?.properties?.length > 0 ||
      n(payload.income?.otherSources?.savingsInterest) > 0;

    if (!hasIncome) {
      errors.push({ field: 'income', message: 'At least one income source is required' });
    }

    // Capital gains transactions validation
    if (payload.income?.capitalGains?.transactions) {
      for (const [i, txn] of payload.income.capitalGains.transactions.entries()) {
        if (!txn.assetType) errors.push({ field: `capitalGains.${i}.assetType`, message: `Transaction ${i + 1}: Asset type is required` });
        if (!txn.saleValue) errors.push({ field: `capitalGains.${i}.saleValue`, message: `Transaction ${i + 1}: Sale value is required` });
        if (!txn.purchaseValue && !txn.indexedCost) errors.push({ field: `capitalGains.${i}.cost`, message: `Transaction ${i + 1}: Purchase value or indexed cost is required` });
      }
    }

    if (!payload.bankAccount?.accountNumber) {
      errors.push({ field: 'bankAccount', message: 'Bank account is required for refund' });
    }

    return { valid: errors.length === 0, errors };
  }
}

const OLD_SLABS = [
  { min: 0, max: 250000, rate: 0 },
  { min: 250000, max: 500000, rate: 5 },
  { min: 500000, max: 1000000, rate: 20 },
  { min: 1000000, max: Infinity, rate: 30 },
];

const NEW_SLABS = [
  { min: 0, max: 300000, rate: 0 },
  { min: 300000, max: 700000, rate: 5 },
  { min: 700000, max: 1000000, rate: 10 },
  { min: 1000000, max: 1200000, rate: 15 },
  { min: 1200000, max: 1500000, rate: 20 },
  { min: 1500000, max: Infinity, rate: 30 },
];

function n(val) { return Number(val) || 0; }

module.exports = ITR2ComputationService;
