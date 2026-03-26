// =====================================================
// ITR-1 COMPUTATION SERVICE
// Complete tax computation for ITR-1 (Sahaj)
// Pure functions — no DB, no side effects
// =====================================================

class ITR1ComputationService {

  /**
   * Compute full ITR-1 tax for both regimes
   * @param {object} payload - The filing's jsonPayload
   * @returns {object} Complete computation with old + new regime
   */
  static compute(payload) {
    const income = this.computeIncome(payload);
    const agriIncome = n(payload.income?.agriculturalIncome);
    const oldRegime = this.computeRegime(income, payload.deductions, 'old', agriIncome);
    const newRegime = this.computeRegime(income, payload.deductions, 'new', agriIncome);

    const tds = this.computeTDS(payload);
    oldRegime.tdsCredit = tds.total;
    oldRegime.netPayable = oldRegime.totalTax - tds.total;
    newRegime.tdsCredit = tds.total;
    newRegime.netPayable = newRegime.totalTax - tds.total;

    const recommended = oldRegime.totalTax <= newRegime.totalTax ? 'old' : 'new';
    const savings = Math.abs(oldRegime.totalTax - newRegime.totalTax);

    return {
      income,
      agriculturalIncome: agriIncome,
      oldRegime,
      newRegime,
      tds,
      recommended,
      savings,
      grossTotalIncome: income.grossTotal,
    };
  }

  // ── Income Computation ──

  static computeIncome(payload) {
    const salary = this.computeSalary(payload.income?.salary);
    const hp = this.computeHouseProperty(payload.income?.houseProperty);
    const other = this.computeOtherIncome(payload.income?.otherSources);

    return {
      salary,
      houseProperty: hp,
      otherSources: other,
      grossTotal: salary.netTaxable + hp.netIncome + other.total,
    };
  }

  static computeSalary(salaryData) {
    if (!salaryData?.employers?.length) {
      return { grossSalary: 0, exemptAllowances: 0, standardDeduction: 0, professionalTax: 0, netTaxable: 0, employers: [], tds: 0 };
    }

    let grossSalary = 0;
    let exemptAllowances = 0;
    let professionalTax = 0;
    let tds = 0;
    const employers = [];

    for (const emp of salaryData.employers) {
      const gross = n(emp.grossSalary);
      const hraExempt = n(emp.allowances?.hra?.exempt);
      const ltaExempt = n(emp.allowances?.lta?.exempt);
      const otherExempt = n(emp.allowances?.other);
      const profTax = n(emp.deductions?.professionalTax || emp.professionalTax);
      const empTds = n(emp.tdsDeducted);

      grossSalary += gross;
      exemptAllowances += hraExempt + ltaExempt + otherExempt;
      professionalTax += profTax;
      tds += empTds;

      employers.push({
        name: emp.name || 'Employer',
        gross,
        hraExempt,
        ltaExempt,
        profTax,
        tds: empTds,
        net: gross - hraExempt - ltaExempt - otherExempt,
      });
    }

    const standardDeduction = 75000; // AY 2025-26
    const netTaxable = Math.max(0, grossSalary - exemptAllowances - standardDeduction - professionalTax);

    return { grossSalary, exemptAllowances, standardDeduction, professionalTax, netTaxable, employers, tds };
  }

  static computeHouseProperty(hpData) {
    if (!hpData || hpData.type === 'NONE' || !hpData.type) {
      return { type: 'NONE', netIncome: 0 };
    }

    if (hpData.type === 'SELF_OCCUPIED') {
      const interest = Math.min(n(hpData.interestOnHomeLoan), 200000);
      return { type: 'SELF_OCCUPIED', interestOnHomeLoan: n(hpData.interestOnHomeLoan), interestAllowed: interest, netIncome: -interest };
    }

    // LET_OUT or DEEMED_LET_OUT
    const rent = n(hpData.annualRentReceived);
    const municipal = n(hpData.municipalTaxesPaid);
    const nav = Math.max(0, rent - municipal);
    const stdDed = Math.round(nav * 0.30);
    const interest = n(hpData.interestOnHomeLoan);
    const netIncome = nav - stdDed - interest;

    return {
      type: hpData.type,
      annualRent: rent, municipalTaxes: municipal,
      netAnnualValue: nav, standardDeduction30: stdDed,
      interestOnHomeLoan: interest, netIncome,
    };
  }

  static computeOtherIncome(otherData) {
    if (!otherData) return { savingsInterest: 0, fdInterest: 0, dividends: 0, familyPension: 0, familyPensionExempt: 0, other: 0, total: 0 };

    const savings = n(otherData.savingsInterest);
    const fd = n(otherData.fdInterest);
    const div = n(otherData.dividendIncome);
    const fpGross = n(otherData.familyPension);
    const fpExempt = Math.min(Math.round(fpGross / 3), 15000);
    const other = n(otherData.otherIncome);
    const total = savings + fd + div + (fpGross - fpExempt) + other;

    return { savingsInterest: savings, fdInterest: fd, dividends: div, familyPension: fpGross, familyPensionExempt: fpExempt, other, total };
  }

  // ── Deductions ──

  static computeDeductions(deductionData) {
    if (!deductionData) return { total: 0, breakdown: {} };

    // Accept both nested (section80C.ppf) and flat (ppf) formats
    const d = deductionData;
    const c = d.section80C || d;
    const raw80C = n(c.ppf) + n(c.elss) + n(c.lifeInsurance || c.lic) + n(c.nsc) +
      n(c.tuitionFees) + n(c.homeLoanPrincipal) + n(c.sukanyaSamriddhi) + n(c.fiveYearFD) + n(c.otherC);
    const s80c = Math.min(raw80C, 150000);

    const s80ccd1b = Math.min(n(d.section80CCD1B?.nps || d.nps), 50000);
    const s80d = this.compute80D(d.section80D || { selfPremium: n(d.healthSelf), parentsPremium: n(d.healthParents) });
    const s80e = n(d.section80E?.educationLoanInterest || d.eduLoan);
    const s80g = n(d.section80G?.total || d.donations);
    const s80tta = Math.min(n(d.section80TTA?.savingsInterest || d.savingsInt), 10000);
    const s80gg = Math.min(n(d.rentPaid), 60000); // 80GG: max ₹5000/month
    const s80u = n(d.disability);

    const total = s80c + s80ccd1b + s80d + s80e + s80g + s80tta + s80gg + s80u;

    return {
      total,
      breakdown: {
        section80C: s80c,
        section80CCD1B: s80ccd1b,
        section80D: s80d,
        section80E: s80e,
        section80G: s80g,
        section80TTA: s80tta,
        section80GG: s80gg,
        section80U: s80u,
      },
    };
  }

  static sum80C(data) {
    if (!data) return 0;
    return n(data.ppf) + n(data.elss) + n(data.lifeInsurance || data.lic) + n(data.nsc) +
      n(data.tuitionFees) + n(data.homeLoanPrincipal) + n(data.sukanyaSamriddhi) + n(data.fiveYearFD) + n(data.otherC);
  }

  static compute80D(data) {
    if (!data) return 0;
    const selfLimit = data.selfSenior ? 50000 : 25000;
    const parentLimit = data.parentsSenior ? 50000 : 25000;
    const selfClaim = Math.min(n(data.selfPremium) + Math.min(n(data.selfPreventive), 5000), selfLimit);
    const parentClaim = Math.min(n(data.parentsPremium) + Math.min(n(data.parentsPreventive), 5000), parentLimit);
    return selfClaim + parentClaim;
  }

  // ── Tax Computation ──

  static computeRegime(income, deductionData, regime, agriculturalIncome = 0) {
    const deductions = regime === 'old' ? this.computeDeductions(deductionData) : { total: 0, breakdown: {} };
    const taxableIncome = Math.max(0, income.grossTotal - deductions.total);

    const slabs = regime === 'old' ? OLD_SLABS : NEW_SLABS;
    const basicExemption = regime === 'old' ? 250000 : 300000;

    // Agricultural income partial integration method (Section 2(1A) + Rule 8)
    // Applies when: agri income > ₹5,000 AND non-agri income > basic exemption
    let tax = 0;
    let slabBreakdown = [];
    let agriIntegrationApplied = false;

    if (agriculturalIncome > 5000 && taxableIncome > basicExemption) {
      // Step 1: Tax on (agricultural + non-agricultural) combined
      const combined = taxableIncome + agriculturalIncome;
      const { tax: taxOnCombined } = this.applySlabs(combined, slabs);

      // Step 2: Tax on (agricultural + basic exemption)
      const agriPlusExemption = agriculturalIncome + basicExemption;
      const { tax: taxOnAgriExemption } = this.applySlabs(agriPlusExemption, slabs);

      // Step 3: Difference is the actual tax
      tax = Math.max(0, taxOnCombined - taxOnAgriExemption);
      agriIntegrationApplied = true;

      // Generate slab breakdown for display (on the combined amount, for transparency)
      const result = this.applySlabs(taxableIncome, slabs);
      slabBreakdown = result.slabBreakdown;
    } else {
      const result = this.applySlabs(taxableIncome, slabs);
      tax = result.tax;
      slabBreakdown = result.slabBreakdown;
    }

    const rebateLimit = regime === 'old' ? 500000 : 700000;
    const rebateMax = regime === 'old' ? 12500 : 25000;
    const rebate = taxableIncome <= rebateLimit ? Math.min(tax, rebateMax) : 0;

    const taxAfterRebate = tax - rebate;

    let surchargeRate = 0;
    if (taxableIncome > 5000000) surchargeRate = 10;
    if (taxableIncome > 10000000) surchargeRate = 15;
    if (taxableIncome > 20000000) surchargeRate = 25;
    if (taxableIncome > 50000000) surchargeRate = 37;
    // ITR-1 cap: income ≤ 50L, so surcharge is max 10%
    const surcharge = Math.round(taxAfterRebate * surchargeRate / 100);

    const cess = Math.round((taxAfterRebate + surcharge) * 4 / 100);
    const totalTax = taxAfterRebate + surcharge + cess;

    return {
      regime,
      grossTotalIncome: income.grossTotal,
      deductions: deductions.total,
      deductionBreakdown: deductions.breakdown,
      taxableIncome,
      agriculturalIncome: agriculturalIncome || 0,
      agriIntegrationApplied,
      slabBreakdown,
      taxOnIncome: tax,
      rebate,
      surcharge,
      surchargeRate,
      cess,
      totalTax,
    };
  }

  static applySlabs(income, slabs) {
    let remaining = income;
    let tax = 0;
    const slabBreakdown = [];

    for (const slab of slabs) {
      if (remaining <= 0) break;
      const width = slab.max === Infinity ? remaining : Math.min(remaining, slab.max - slab.min);
      const slabTax = Math.round(width * slab.rate / 100);
      tax += slabTax;
      slabBreakdown.push({ min: slab.min, max: slab.max, rate: slab.rate, taxableInSlab: width, tax: slabTax });
      remaining -= width;
    }

    return { tax, slabBreakdown };
  }

  // ── TDS ──

  static computeTDS(payload) {
    const fromSalary = payload.income?.salary?.employers?.reduce((sum, e) => sum + n(e.tdsDeducted), 0) || 0;
    const fromFD = n(payload.taxes?.tds?.fromFD);
    const fromOther = n(payload.taxes?.tds?.fromOther);
    const advanceTax = n(payload.taxes?.advanceTax);
    const selfAssessment = n(payload.taxes?.selfAssessmentTax);
    const total = fromSalary + fromFD + fromOther + advanceTax + selfAssessment;

    return { fromSalary, fromFD, fromOther, advanceTax, selfAssessment, total };
  }

  // ── Validation ──

  static validate(payload) {
    const errors = [];

    // Personal info
    if (!payload.personalInfo?.pan || !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(payload.personalInfo.pan)) {
      errors.push({ field: 'personalInfo.pan', message: 'Valid PAN is required' });
    }

    // Salary
    if (!payload.income?.salary?.employers?.length) {
      errors.push({ field: 'income.salary', message: 'At least one employer is required' });
    }

    // Income limit
    const income = this.computeIncome(payload);
    if (income.grossTotal > 5000000) {
      errors.push({ field: 'income', message: 'Total income exceeds ₹50L — ITR-1 not applicable' });
    }

    // Bank account
    if (!payload.bankAccount?.accountNumber) {
      errors.push({ field: 'bankAccount', message: 'Bank account is required for refund' });
    }
    if (payload.bankAccount?.ifsc && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(payload.bankAccount.ifsc)) {
      errors.push({ field: 'bankAccount.ifsc', message: 'Invalid IFSC code' });
    }

    return { valid: errors.length === 0, errors };
  }
}

// ── Tax Slabs AY 2025-26 ──

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

module.exports = ITR1ComputationService;
