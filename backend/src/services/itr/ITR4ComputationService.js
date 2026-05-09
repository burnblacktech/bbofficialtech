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
    const winnings = income.otherSources?.winnings || 0;
    const winningsTax = income.otherSources?.winningsTax || 0;

    const dob = payload?.personalInfo?.dateOfBirth || payload?.personalDetails?.dateOfBirth;
    const ay = payload?.assessmentYear;
    const slabs = regime === 'old' ? ITR1ComputationService.getOldRegimeSlabs(dob, ay) : NEW_SLABS;
    const basicExemption = regime === 'old' ? (slabs[0].max) : 400000;

    // 80CCD(2) employer NPS allowed in new regime
    let newRegime80CCD2 = 0;
    if (regime === 'new' && deductionData) {
      newRegime80CCD2 = n(deductionData.section80CCD2?.employerNps || deductionData.employerNps);
    }
    const adjustedTaxableIncome = Math.max(0, taxableIncome - newRegime80CCD2);
    const nonVdaTaxableIncome = Math.max(0, adjustedTaxableIncome - vdaGain - winnings);

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
    tax += vdaTax + winningsTax;

    const rebateLimit = regime === 'old' ? 500000 : 1200000;
    const rebateMax = regime === 'old' ? 12500 : 60000;
    const slabTax = tax - vdaTax - winningsTax;
    const rebate = nonVdaTaxableIncome <= rebateLimit ? Math.min(slabTax, rebateMax) : 0;
    const taxAfterRebate = tax - rebate;

    let surchargeRate = 0;
    if (adjustedTaxableIncome > 5000000) surchargeRate = 10;
    // AY 2025-26: New regime caps surcharge at 25%
    if (regime === 'new' && surchargeRate > 25) surchargeRate = 25;
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
    // 44AD threshold validation
    for (const entry of (payload.income?.presumptive?.entries || [])) {
      if (entry.section === '44AD') {
        const totalReceipts = n(entry.grossReceipts) || n(entry.turnover) || 0;
        const digitalReceipts = n(entry.digitalReceipts) || 0;
        const digitalRatio = totalReceipts > 0 ? digitalReceipts / totalReceipts : 0;
        const threshold = digitalRatio >= 0.95 ? 30000000 : 20000000;
        if (totalReceipts > threshold) {
          errors.push({ field: 'presumptive', message: `44AD not applicable: turnover ₹${(totalReceipts/100000).toFixed(0)}L exceeds ₹${threshold/10000000}Cr threshold` });
        }
      }
    }
    // Turnover limit (aggregate)
    const totalReceipts = (payload.income?.presumptive?.entries || []).reduce((s, e) => s + n(e.grossReceipts), 0);
    if (totalReceipts > 20000000) {
      errors.push({ field: 'income.presumptive', message: 'Total receipts exceed ₹2Cr — ITR-3 required instead of ITR-4' });
    }
    // Income limit
    const income = this.computeIncome(payload);
    if (income.grossTotal > 5000000) {
      errors.push({ field: 'income', message: 'Total income exceeds ₹50L — ITR-4 limit' });
    }
    const bank = payload.bankDetails || payload.bankAccount || {};
    if (!bank.accountNumber) {
      errors.push({ field: 'bankDetails', message: 'Bank account required' });
    }
    return { valid: errors.length === 0, errors };
  }
}

const OLD_SLABS = [{ min: 0, max: 250000, rate: 0 }, { min: 250000, max: 500000, rate: 5 }, { min: 500000, max: 1000000, rate: 20 }, { min: 1000000, max: Infinity, rate: 30 }];
const NEW_SLABS = [{ min: 0, max: 400000, rate: 0 }, { min: 400000, max: 800000, rate: 5 }, { min: 800000, max: 1200000, rate: 10 }, { min: 1200000, max: 1600000, rate: 15 }, { min: 1600000, max: 2000000, rate: 20 }, { min: 2000000, max: 2400000, rate: 25 }, { min: 2400000, max: Infinity, rate: 30 }];
function n(val) { return Number(val) || 0; }

module.exports = ITR4ComputationService;
