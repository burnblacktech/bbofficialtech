// =====================================================
// ITR-3 COMPUTATION SERVICE
// Business/Profession income with regular books
// Extends ITR-2 + adds business income computation
// =====================================================

const ITR2ComputationService = require('./ITR2ComputationService');
const ITR1ComputationService = require('./ITR1ComputationService');

class ITR3ComputationService {

  static compute(payload) {
    const safePayload = payload || {};
    const income = this.computeIncome(safePayload);
    const agriIncome = n(safePayload.income?.agriculturalIncome);
    const oldRegime = this.computeRegime(income, safePayload.deductions, 'old', agriIncome, safePayload);
    const newRegime = this.computeRegime(income, safePayload.deductions, 'new', agriIncome, safePayload);

    const tds = this.computeTDS(safePayload);
    const ftc = ITR2ComputationService.computeForeignTaxCredit(safePayload.income?.foreignIncome, income.grossTotal, oldRegime.taxOnIncome);

    for (const r of [oldRegime, newRegime]) {
      r.tdsCredit = tds.total;
      r.foreignTaxCredit = ftc.credit;
      r.netPayable = r.totalTax - tds.total - ftc.credit;
    }

    const recommended = oldRegime.totalTax <= newRegime.totalTax ? 'old' : 'new';
    return { income, oldRegime, newRegime, tds, foreignTaxCredit: ftc, recommended, savings: Math.abs(oldRegime.totalTax - newRegime.totalTax), grossTotalIncome: income.grossTotal };
  }

  static computeIncome(payload) {
    const employerCategory = payload.personalInfo?.employerCategory || 'OTH';
    let salary, hp, cg, other, foreign, business;
    try { salary = ITR1ComputationService.computeSalary(payload.income?.salary, employerCategory); }
    catch { salary = { grossSalary: 0, exemptAllowances: 0, salaryExemptions: 0, standardDeduction: 0, professionalTax: 0, entertainmentAllowanceDeduction: 0, netTaxable: 0, employers: [], tds: 0 }; }
    try { hp = ITR2ComputationService.computeHouseProperties(payload.income?.houseProperty); }
    catch { hp = { type: 'NONE', netIncome: 0 }; }
    try { cg = ITR2ComputationService.computeCapitalGains(payload.income?.capitalGains); }
    catch { cg = { stcg: { equity: 0, other: 0, total: 0 }, ltcg: { equity: 0, property: 0, other: 0, total: 0 }, exemptions: 0, totalTaxable: 0, transactions: [] }; }
    try { other = ITR1ComputationService.computeOtherIncome(payload.income?.otherSources); }
    catch { other = { savingsInterest: 0, fdInterest: 0, dividends: 0, familyPension: 0, familyPensionExempt: 0, other: 0, interestOnITRefund: 0, winnings: 0, gifts: 0, total: 0 }; }
    try { foreign = ITR2ComputationService.computeForeignIncome(payload.income?.foreignIncome); }
    catch { foreign = { incomes: [], totalIncome: 0, totalTaxPaidAbroad: 0 }; }
    try { business = this.computeBusinessIncome(payload.income?.business); }
    catch { business = { businesses: [], totalTurnover: 0, totalGrossProfit: 0, totalExpenses: 0, totalDepreciation: 0, netProfit: 0 }; }

    return {
      salary, houseProperty: hp, capitalGains: cg, otherSources: other, foreignIncome: foreign, business,
      grossTotal: salary.netTaxable + hp.netIncome + cg.totalTaxable + other.total + foreign.totalIncome + business.netProfit,
    };
  }

  static computeBusinessIncome(bizData) {
    if (!bizData?.businesses?.length) {
      return { businesses: [], totalTurnover: 0, totalGrossProfit: 0, totalExpenses: 0, totalDepreciation: 0, netProfit: 0 };
    }

    let totalTurnover = 0, totalGross = 0, totalExp = 0, totalDep = 0, totalNet = 0;
    const businesses = [];

    for (const biz of bizData.businesses) {
      const turnover = n(biz.turnover);
      const grossProfit = n(biz.grossProfit);
      const expenses = this.sumExpenses(biz.expenses);
      const depreciation = n(biz.depreciation);
      const netProfit = grossProfit - expenses - depreciation;

      totalTurnover += turnover;
      totalGross += grossProfit;
      totalExp += expenses;
      totalDep += depreciation;
      totalNet += netProfit;

      businesses.push({
        name: biz.name || 'Business',
        natureOfBusiness: biz.natureOfBusiness || '',
        turnover, grossProfit, expenses, depreciation, netProfit,
        expenseBreakdown: biz.expenses || {},
      });
    }

    // Audit requirement check
    const auditRequired = totalTurnover > 10000000; // ₹1Cr (44AB) — simplified; actual rules are more nuanced

    return { businesses, totalTurnover, totalGrossProfit: totalGross, totalExpenses: totalExp, totalDepreciation: totalDep, netProfit: totalNet, auditRequired };
  }

  static sumExpenses(exp) {
    if (!exp) return 0;
    return n(exp.rent) + n(exp.salary) + n(exp.interest) + n(exp.depreciation) + n(exp.repairs) +
      n(exp.insurance) + n(exp.utilities) + n(exp.travel) + n(exp.professional) + n(exp.office) + n(exp.other);
  }

  // Balance sheet validation
  static validateBalanceSheet(bs) {
    if (!bs) return { valid: true, errors: [] };
    const totalAssets = n(bs.fixedAssets) + n(bs.currentAssets) + n(bs.investments) + n(bs.otherAssets);
    const totalLiabilities = n(bs.capital) + n(bs.reserves) + n(bs.securedLoans) + n(bs.unsecuredLoans) + n(bs.currentLiabilities);
    const balanced = Math.abs(totalAssets - totalLiabilities) < 1; // Allow ₹1 rounding
    return {
      valid: balanced,
      totalAssets, totalLiabilities,
      errors: balanced ? [] : [{ field: 'balanceSheet', message: `Assets (₹${totalAssets}) ≠ Liabilities (₹${totalLiabilities})` }],
    };
  }

  static computeRegime(income, deductionData, regime, agriculturalIncome = 0, payload = null) {
    ITR1ComputationService._lastGrossTotal = income.grossTotal;
    const deductions = regime === 'old' ? ITR1ComputationService.computeDeductions(deductionData, payload) : { total: 0, breakdown: {}, warnings: [] };

    // Normal income — exclude VDA (flat 30% separately)
    const vdaGain = income.otherSources?.vdaGain || 0;
    const vdaTax = income.otherSources?.vdaTax || 0;
    const normalIncome = income.salary.netTaxable + income.houseProperty.netIncome + (income.otherSources.total - vdaGain) +
      income.capitalGains.stcg.other + income.foreignIncome.totalIncome + income.business.netProfit;
    const taxableNormal = Math.max(0, normalIncome - deductions.total);

    const stcgEquity = income.capitalGains.stcg.equity;
    const ltcgEquity = Math.max(0, income.capitalGains.ltcg.equity - 125000);
    const ltcgOther = income.capitalGains.ltcg.property + income.capitalGains.ltcg.other;

    const taxableIncome = taxableNormal + stcgEquity + ltcgEquity + ltcgOther;

    const slabs = regime === 'old' ? OLD_SLABS : NEW_SLABS;
    const basicExemption = regime === 'old' ? 250000 : 300000;

    // Agricultural income partial integration for normal income tax
    let normalTax = 0;
    let slabBreakdown = [];
    if (agriculturalIncome > 5000 && taxableNormal > basicExemption) {
      const { tax: taxCombined } = ITR1ComputationService.applySlabs(taxableNormal + agriculturalIncome, slabs);
      const { tax: taxAgriExempt } = ITR1ComputationService.applySlabs(agriculturalIncome + basicExemption, slabs);
      normalTax = Math.max(0, taxCombined - taxAgriExempt);
      slabBreakdown = ITR1ComputationService.applySlabs(taxableNormal, slabs).slabBreakdown;
    } else {
      const result = ITR1ComputationService.applySlabs(taxableNormal, slabs);
      normalTax = result.tax;
      slabBreakdown = result.slabBreakdown;
    }

    const stcgEquityTax = Math.round(stcgEquity * 20 / 100);
    const ltcgEquityTax = Math.round(ltcgEquity * 12.5 / 100);
    const ltcgOtherTax = Math.round(ltcgOther * 20 / 100);
    const totalTaxOnIncome = normalTax + stcgEquityTax + ltcgEquityTax + ltcgOtherTax + vdaTax;

    const rebateLimit = regime === 'old' ? 500000 : 700000;
    const rebateMax = regime === 'old' ? 12500 : 25000;
    const rebate = (stcgEquity + ltcgEquity + ltcgOther === 0 && taxableNormal <= rebateLimit) ? Math.min(normalTax, rebateMax) : 0;
    const taxAfterRebate = totalTaxOnIncome - rebate;

    let surchargeRate = 0;
    if (income.grossTotal > 50000000) surchargeRate = 37;
    else if (income.grossTotal > 20000000) surchargeRate = 25;
    else if (income.grossTotal > 10000000) surchargeRate = 15;
    else if (income.grossTotal > 5000000) surchargeRate = 10;
    const surcharge = Math.round(taxAfterRebate * surchargeRate / 100);
    const cess = Math.round((taxAfterRebate + surcharge) * 4 / 100);

    return {
      regime, grossTotalIncome: income.grossTotal, deductions: deductions.total, deductionBreakdown: deductions.breakdown,
      taxableIncome, taxableNormal, stcgEquity, ltcgEquity, ltcgOther,
      slabBreakdown, normalTax, stcgEquityTax, ltcgEquityTax, ltcgOtherTax,
      taxOnIncome: totalTaxOnIncome, rebate, surcharge, surchargeRate, cess,
      totalTax: taxAfterRebate + surcharge + cess,
    };
  }

  static computeTDS(payload) {
    return ITR2ComputationService.computeTDS(payload);
  }

  static validate(payload) {
    const errors = [];
    if (!payload.personalInfo?.pan || !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(payload.personalInfo.pan)) {
      errors.push({ field: 'personalInfo.pan', message: 'Valid PAN is required' });
    }
    if (!payload.income?.business?.businesses?.length) {
      errors.push({ field: 'income.business', message: 'At least one business is required for ITR-3' });
    }
    if (payload.income?.business?.businesses) {
      for (const [i, biz] of payload.income.business.businesses.entries()) {
        if (!biz.name) errors.push({ field: `business.${i}.name`, message: `Business ${i + 1}: Name required` });
        if (!biz.turnover && !biz.grossProfit) errors.push({ field: `business.${i}.turnover`, message: `Business ${i + 1}: Turnover or gross profit required` });
      }
    }
    // Balance sheet check
    if (payload.income?.business?.balanceSheet) {
      const bsCheck = this.validateBalanceSheet(payload.income.business.balanceSheet);
      errors.push(...bsCheck.errors);
    }
    if (!payload.bankAccount?.accountNumber) {
      errors.push({ field: 'bankAccount', message: 'Bank account required' });
    }
    return { valid: errors.length === 0, errors };
  }
}

const OLD_SLABS = [{ min: 0, max: 250000, rate: 0 }, { min: 250000, max: 500000, rate: 5 }, { min: 500000, max: 1000000, rate: 20 }, { min: 1000000, max: Infinity, rate: 30 }];
const NEW_SLABS = [{ min: 0, max: 300000, rate: 0 }, { min: 300000, max: 700000, rate: 5 }, { min: 700000, max: 1000000, rate: 10 }, { min: 1000000, max: 1200000, rate: 15 }, { min: 1200000, max: 1500000, rate: 20 }, { min: 1500000, max: Infinity, rate: 30 }];
function n(val) { return Number(val) || 0; }

module.exports = ITR3ComputationService;
