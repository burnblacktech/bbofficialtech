// =====================================================
// ITR-4 COMPUTATION SERVICE
// Presumptive income under 44AD/44ADA/44AE
// =====================================================

const ITR1ComputationService = require('./ITR1ComputationService');

class ITR4ComputationService {

  static compute(payload) {
    const safePayload = payload || {};
    const income = this.computeIncome(safePayload);
    const agriIncome = n(safePayload.income?.agriculturalIncome);
    const oldRegime = this.computeRegime(income, safePayload.deductions, 'old', agriIncome, safePayload);
    const newRegime = this.computeRegime(income, safePayload.deductions, 'new', agriIncome, safePayload);
    const tds = ITR1ComputationService.computeTDS(safePayload);

    for (const r of [oldRegime, newRegime]) { r.tdsCredit = tds.total; r.netPayable = r.totalTax - tds.total; }

    // Note: ITR-4 ignores capitalGains, foreignIncome sections if present in payload.

    const recommended = oldRegime.totalTax <= newRegime.totalTax ? 'old' : 'new';
    return { income, oldRegime, newRegime, tds, recommended, savings: Math.abs(oldRegime.totalTax - newRegime.totalTax), grossTotalIncome: income.grossTotal };
  }

  static computeIncome(payload) {
    const employerCategory = payload.personalInfo?.employerCategory || 'OTH';
    let salary, hp, other, presumptive;
    try { salary = ITR1ComputationService.computeSalary(payload.income?.salary, employerCategory); }
    catch { salary = { grossSalary: 0, exemptAllowances: 0, salaryExemptions: 0, standardDeduction: 0, professionalTax: 0, entertainmentAllowanceDeduction: 0, netTaxable: 0, employers: [], tds: 0 }; }
    try { hp = ITR1ComputationService.computeHouseProperty(payload.income?.houseProperty); }
    catch { hp = { type: 'NONE', netIncome: 0 }; }
    try { other = ITR1ComputationService.computeOtherIncome(payload.income?.otherSources); }
    catch { other = { savingsInterest: 0, fdInterest: 0, dividends: 0, familyPension: 0, familyPensionExempt: 0, other: 0, interestOnITRefund: 0, winnings: 0, gifts: 0, total: 0 }; }
    try { presumptive = this.computePresumptive(payload.income?.presumptive); }
    catch { presumptive = { entries: [], totalGrossReceipts: 0, totalIncome: 0 }; }

    // Note: ITR-4 ignores capitalGains, foreignIncome, business sections if present.

    return {
      salary, houseProperty: hp, otherSources: other, presumptive,
      grossTotal: salary.netTaxable + hp.netIncome + other.total + presumptive.totalIncome,
    };
  }

  static computePresumptive(presData) {
    if (!presData?.entries?.length) {
      return { entries: [], totalGrossReceipts: 0, totalIncome: 0 };
    }

    let totalReceipts = 0, totalIncome = 0;
    const entries = [];

    for (const entry of presData.entries) {
      const receipts = n(entry.grossReceipts);
      let rate, income;

      switch (entry.section) {
        case '44AD':
          // 8% for cash, 6% for digital receipts
          rate = entry.digitalReceipts ? 6 : 8;
          income = Math.max(n(entry.declaredIncome), Math.round(receipts * rate / 100));
          break;
        case '44ADA':
          // 50% of gross receipts
          rate = 50;
          income = Math.max(n(entry.declaredIncome), Math.round(receipts * rate / 100));
          break;
        case '44AE':
          // ₹7,500 per vehicle per month
          rate = 0;
          income = n(entry.vehicles) * 7500 * n(entry.monthsOwned || 12);
          break;
        default:
          rate = 8;
          income = Math.round(receipts * rate / 100);
      }

      totalReceipts += receipts;
      totalIncome += income;

      entries.push({
        section: entry.section, businessName: entry.businessName || '',
        grossReceipts: receipts, rate, declaredIncome: income,
        digitalReceipts: !!entry.digitalReceipts,
        vehicles: n(entry.vehicles), monthsOwned: n(entry.monthsOwned || 12),
      });
    }

    return { entries, totalGrossReceipts: totalReceipts, totalIncome };
  }

  static computeRegime(income, deductionData, regime, agriculturalIncome = 0, payload = null) {
    ITR1ComputationService._lastGrossTotal = income.grossTotal;
    const deductions = regime === 'old' ? ITR1ComputationService.computeDeductions(deductionData, payload) : { total: 0, breakdown: {}, warnings: [] };
    const taxableIncome = Math.max(0, income.grossTotal - deductions.total);

    // VDA income taxed at flat 30% separately
    const vdaGain = income.otherSources?.vdaGain || 0;
    const vdaTax = income.otherSources?.vdaTax || 0;
    const nonVdaTaxableIncome = Math.max(0, taxableIncome - vdaGain);

    const slabs = regime === 'old' ? OLD_SLABS : NEW_SLABS;
    const basicExemption = regime === 'old' ? 250000 : 300000;

    // Agricultural income partial integration
    let tax = 0;
    let slabBreakdown = [];
    if (agriculturalIncome > 5000 && nonVdaTaxableIncome > basicExemption) {
      const { tax: taxCombined } = ITR1ComputationService.applySlabs(nonVdaTaxableIncome + agriculturalIncome, slabs);
      const { tax: taxAgriExempt } = ITR1ComputationService.applySlabs(agriculturalIncome + basicExemption, slabs);
      tax = Math.max(0, taxCombined - taxAgriExempt);
      slabBreakdown = ITR1ComputationService.applySlabs(nonVdaTaxableIncome, slabs).slabBreakdown;
    } else {
      const result = ITR1ComputationService.applySlabs(nonVdaTaxableIncome, slabs);
      tax = result.tax;
      slabBreakdown = result.slabBreakdown;
    }

    // Add VDA flat tax
    tax += vdaTax;

    const rebateLimit = regime === 'old' ? 500000 : 700000;
    const rebateMax = regime === 'old' ? 12500 : 25000;
    const slabTax = tax - vdaTax;
    const rebate = nonVdaTaxableIncome <= rebateLimit ? Math.min(slabTax, rebateMax) : 0;
    const taxAfterRebate = tax - rebate;

    let surchargeRate = 0;
    if (income.grossTotal > 5000000) surchargeRate = 10;
    const surcharge = Math.round(taxAfterRebate * surchargeRate / 100);
    const cess = Math.round((taxAfterRebate + surcharge) * 4 / 100);

    return {
      regime, grossTotalIncome: income.grossTotal, deductions: deductions.total, deductionBreakdown: deductions.breakdown,
      taxableIncome, agriculturalIncome: agriculturalIncome || 0, vdaGain, vdaTax, slabBreakdown, taxOnIncome: tax, rebate, surcharge, surchargeRate, cess,
      totalTax: taxAfterRebate + surcharge + cess,
    };
  }

  static validate(payload) {
    const errors = [];
    if (!payload.personalInfo?.pan || !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(payload.personalInfo.pan)) {
      errors.push({ field: 'personalInfo.pan', message: 'Valid PAN required' });
    }
    if (!payload.income?.presumptive?.entries?.length) {
      errors.push({ field: 'income.presumptive', message: 'At least one presumptive income entry required for ITR-4' });
    }
    // Turnover limit
    const totalReceipts = (payload.income?.presumptive?.entries || []).reduce((s, e) => s + n(e.grossReceipts), 0);
    if (totalReceipts > 20000000) {
      errors.push({ field: 'income.presumptive', message: 'Total receipts exceed ₹2Cr — ITR-3 required instead of ITR-4' });
    }
    // Income limit
    const income = this.computeIncome(payload);
    if (income.grossTotal > 5000000) {
      errors.push({ field: 'income', message: 'Total income exceeds ₹50L — ITR-4 limit' });
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

module.exports = ITR4ComputationService;
