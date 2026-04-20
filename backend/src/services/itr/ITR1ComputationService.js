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
    const oldRegime = this.computeRegime(income, payload.deductions, 'old', agriIncome, payload);
    const newRegime = this.computeRegime(income, payload.deductions, 'new', agriIncome, payload);

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
    const employerCategory = payload.personalInfo?.employerCategory || 'OTH';
    const salary = this.computeSalary(payload.income?.salary, employerCategory);
    const hp = this.computeHouseProperty(payload.income?.houseProperty);
    const other = this.computeOtherIncome(payload.income?.otherSources);

    return {
      salary,
      houseProperty: hp,
      otherSources: other,
      grossTotal: salary.netTaxable + hp.netIncome + other.total,
    };
  }

  static computeSalary(salaryData, employerCategory) {
    if (!salaryData?.employers?.length) {
      return { grossSalary: 0, exemptAllowances: 0, salaryExemptions: 0, standardDeduction: 0, professionalTax: 0, entertainmentAllowanceDeduction: 0, netTaxable: 0, employers: [], tds: 0 };
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

    // Salary exemptions (gratuity, leave encashment, commuted pension)
    const salaryExemptions = this.computeSalaryExemptions(salaryData, employerCategory);

    // Entertainment allowance deduction (GOV only): min(actual, 5000, 20% of basicPlusDA)
    let entertainmentAllowanceDeduction = 0;
    if (employerCategory === 'GOV') {
      const totalEntertainment = salaryData.employers.reduce((sum, emp) => sum + n(emp.entertainmentAllowance), 0);
      const totalBasicPlusDA = salaryData.employers.reduce((sum, emp) => sum + n(emp.basicPlusDA), 0);
      entertainmentAllowanceDeduction = Math.min(totalEntertainment, 5000, Math.round(0.20 * totalBasicPlusDA));
      entertainmentAllowanceDeduction = Math.max(0, entertainmentAllowanceDeduction);
    }

    const standardDeduction = 75000; // AY 2025-26
    const netTaxable = Math.max(0, grossSalary - exemptAllowances - salaryExemptions - standardDeduction - professionalTax - entertainmentAllowanceDeduction);

    return { grossSalary, exemptAllowances, salaryExemptions, standardDeduction, professionalTax, entertainmentAllowanceDeduction, netTaxable, employers, tds };
  }

  static computeHouseProperty(hpData) {
    if (!hpData || !hpData.type) {
      return { type: 'NONE', netIncome: 0 };
    }

    // Normalize type: frontend sends camelCase, backend expects UPPER_SNAKE
    const typeMap = {
      selfoccupied: 'SELF_OCCUPIED', selfOccupied: 'SELF_OCCUPIED', 'SELF_OCCUPIED': 'SELF_OCCUPIED', self_occupied: 'SELF_OCCUPIED',
      letout: 'LET_OUT', letOut: 'LET_OUT', 'LET_OUT': 'LET_OUT', let_out: 'LET_OUT',
      none: 'NONE', NONE: 'NONE',
    };
    const normalizedType = typeMap[hpData.type] || (hpData.type ? hpData.type.toUpperCase().replace(/([a-z])([A-Z])/g, '$1_$2') : 'NONE');

    if (normalizedType === 'NONE') {
      return { type: 'NONE', netIncome: 0 };
    }

    if (normalizedType === 'SELF_OCCUPIED') {
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
      type: normalizedType,
      annualRent: rent, municipalTaxes: municipal,
      netAnnualValue: nav, standardDeduction30: stdDed,
      interestOnHomeLoan: interest, netIncome,
    };
  }

  static computeOtherIncome(otherData) {
    if (!otherData) return { savingsInterest: 0, fdInterest: 0, dividends: 0, familyPension: 0, familyPensionExempt: 0, other: 0, interestOnITRefund: 0, winnings: 0, gifts: 0, total: 0 };

    const savings = n(otherData.savingsInterest);
    const fd = n(otherData.fdInterest);
    const div = n(otherData.dividendIncome);
    const fpGross = n(otherData.familyPension);
    const fpExempt = Math.min(Math.round(fpGross / 3), 15000);
    const itRefund = n(otherData.interestOnITRefund);
    const winnings = n(otherData.winnings);
    const gifts = n(otherData.gifts);
    const other = n(otherData.otherIncome);
    const total = savings + fd + div + (fpGross - fpExempt) + itRefund + winnings + gifts + other;

    return { savingsInterest: savings, fdInterest: fd, dividends: div, familyPension: fpGross, familyPensionExempt: fpExempt, interestOnITRefund: itRefund, winnings, gifts, other, total };
  }

  // ── Salary Exemptions ──

  /**
   * Compute salary exemptions based on employer category
   * @param {object} salaryData - salary data with employers array
   * @param {string} employerCategory - GOV, PSU, OTH, PE, NA
   * @returns {number} total exempt amount
   */
  static computeSalaryExemptions(salaryData, employerCategory) {
    if (!salaryData?.employers?.length) return 0;

    let totalExempt = 0;

    for (const emp of salaryData.employers) {
      const gratuity = n(emp.gratuityReceived);
      const leaveEncashment = n(emp.leaveEncashmentReceived);
      const commutedPension = n(emp.commutedPensionReceived);

      if (employerCategory === 'GOV') {
        // Government: full exemption
        totalExempt += gratuity + leaveEncashment + commutedPension;
      } else {
        // OTH / PSU / PE: capped exemptions
        totalExempt += Math.min(gratuity, 2000000);
        totalExempt += Math.min(leaveEncashment, 2500000);
        // Commuted pension: 1/3 exempt if gratuity received, 1/2 if no gratuity
        if (gratuity > 0) {
          totalExempt += Math.round(commutedPension * (1 / 3));
        } else {
          totalExempt += Math.round(commutedPension * (1 / 2));
        }
      }
    }

    return totalExempt;
  }

  // ── Deductions ──

  static computeDeductions(deductionData, payload) {
    if (!deductionData) return { total: 0, breakdown: {}, warnings: [] };

    const d = deductionData;
    const c = d.section80C || d;
    const deductionWarnings = [];

    // ── 80CCE Aggregate: 80C + 80CCC + 80CCD(1) share ₹1.5L limit ──
    // 80CCD(1) = employee NPS contribution (part of 80C limit)
    // 80CCD(1B) = additional NPS (₹50K, OUTSIDE the 80C limit)
    // 80CCD(2) = employer NPS (separate, no limit overlap)
    const raw80CItems = n(c.ppf) + n(c.elss) + n(c.lifeInsurance || c.lic) + n(c.nsc) +
      n(c.tuitionFees) + n(c.homeLoanPrincipal) + n(c.sukanyaSamriddhi) + n(c.fiveYearFD) + n(c.otherC);
    const npsEmployee = n(d.npsEmployee || d.section80CCD1?.nps); // 80CCD(1) — part of 80C limit
    const raw80CCE = raw80CItems + npsEmployee; // Combined 80C + 80CCC + 80CCD(1)
    const s80c = Math.min(raw80CCE, 150000); // 80CCE cap: ₹1.5L

    if (raw80CCE > 150000) {
      deductionWarnings.push(`80C+80CCD(1) total ₹${raw80CCE.toLocaleString('en-IN')} exceeds ₹1.5L — capped at ₹1,50,000`);
    }

    // 80CCD(1B): additional NPS — OUTSIDE the 80CCE limit, separate ₹50K cap
    const s80ccd1b = Math.min(n(d.section80CCD1B?.nps || d.nps), 50000);

    // 80CCD(2): employer NPS — separate, no overlap with 80C
    const s80ccd2 = n(d.section80CCD2?.employerNps || d.employerNps);
    // 80CCD(2) limit: 14% of salary for GOV, 10% for others
    const employerCategory = payload?.personalInfo?.employerCategory || 'OTH';
    const salaryForNPS = (payload?.income?.salary?.employers || []).reduce((s, e) => s + n(e.basicPlusDA || e.grossSalary), 0);
    const ccd2Limit = employerCategory === 'GOV' ? Math.round(salaryForNPS * 0.14) : Math.round(salaryForNPS * 0.10);
    const s80ccd2Capped = salaryForNPS > 0 ? Math.min(s80ccd2, ccd2Limit) : s80ccd2;

    const s80d = this.compute80D(d.section80D || { selfPremium: n(d.healthSelf), parentsPremium: n(d.healthParents) });
    const s80e = n(d.section80E?.educationLoanInterest || d.eduLoan);

    // ── 80G: Categorized donations ──
    let s80g = 0;
    const donations80G = d.donations80G;
    if (Array.isArray(donations80G) && donations80G.length > 0) {
      const grossTotal = this._lastGrossTotal || 0;
      const sum100NoLimit = donations80G.filter(e => e.category === '100_no_limit').reduce((s, e) => s + n(e.amount), 0);
      const sum100WithLimit = donations80G.filter(e => e.category === '100_with_limit').reduce((s, e) => s + n(e.amount), 0);
      const sum50NoLimit = donations80G.filter(e => e.category === '50_no_limit').reduce((s, e) => s + n(e.amount), 0);
      const sum50WithLimit = donations80G.filter(e => e.category === '50_with_limit').reduce((s, e) => s + n(e.amount), 0);
      const tenPercentATI = Math.round(grossTotal * 0.10);
      s80g = sum100NoLimit + Math.min(sum100WithLimit, tenPercentATI) + Math.round(0.5 * sum50NoLimit) + Math.round(0.5 * Math.min(sum50WithLimit, tenPercentATI));
    } else {
      s80g = n(d.section80G?.total || d.donations);
    }

    // ── 80TTA vs 80TTB: mutually exclusive ──
    // Senior citizens (age ≥ 60) should use 80TTB (₹50K), others use 80TTA (₹10K)
    const isSenior = d.isSeniorCitizen || false;
    let s80tta = 0;
    let s80ttb = 0;
    if (isSenior) {
      s80ttb = Math.min(n(d.section80TTB?.interest || d.savingsInt), 50000);
    } else {
      s80tta = Math.min(n(d.section80TTA?.savingsInterest || d.savingsInt), 10000);
    }

    // ── 80GG vs HRA: mutually exclusive ──
    // If HRA is claimed by any employer, 80GG cannot be claimed
    const hasHRA = (payload?.income?.salary?.employers || []).some(e => n(e.allowances?.hra?.exempt) > 0);
    let s80gg = 0;
    if (!hasHRA) {
      s80gg = Math.min(n(d.rentPaid), 60000); // 80GG: max ₹5000/month
    } else if (n(d.rentPaid) > 0) {
      deductionWarnings.push('80GG rent deduction not available when HRA is claimed from employer');
    }

    const s80u = n(d.disability);

    const total = s80c + s80ccd1b + s80ccd2Capped + s80d + s80e + s80g + s80tta + s80ttb + s80gg + s80u;

    return {
      total,
      breakdown: {
        section80C: s80c,
        section80CCD1B: s80ccd1b,
        section80CCD2: s80ccd2Capped,
        section80D: s80d,
        section80E: s80e,
        section80G: s80g,
        section80TTA: s80tta,
        section80TTB: s80ttb,
        section80GG: s80gg,
        section80U: s80u,
      },
      warnings: deductionWarnings,
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

  static computeRegime(income, deductionData, regime, agriculturalIncome = 0, payload = null) {
    // Store gross total for 80G adjusted total income computation (v1 simplification)
    this._lastGrossTotal = income.grossTotal;
    const deductions = regime === 'old' ? this.computeDeductions(deductionData, payload) : { total: 0, breakdown: {}, warnings: [] };
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

    // Itemized TDS2: sum nonSalaryEntries if present, else fall back to fromFD + fromOther
    const nonSalaryEntries = payload.taxes?.tds?.nonSalaryEntries;
    let fromNonSalary = 0;
    let fromFD = 0;
    let fromOther = 0;

    if (Array.isArray(nonSalaryEntries) && nonSalaryEntries.length > 0) {
      fromNonSalary = nonSalaryEntries.reduce((sum, e) => sum + n(e.tdsClaimed), 0);
    } else {
      fromFD = n(payload.taxes?.tds?.fromFD);
      fromOther = n(payload.taxes?.tds?.fromOther);
      fromNonSalary = fromFD + fromOther;
    }

    const advanceTax = n(payload.taxes?.advanceTax);
    const selfAssessment = n(payload.taxes?.selfAssessmentTax);
    const total = fromSalary + fromNonSalary + advanceTax + selfAssessment;

    return { fromSalary, fromFD, fromOther, fromNonSalary, advanceTax, selfAssessment, total };
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

    // Bank details (frontend uses bankDetails, not bankAccount)
    const bank = payload.bankDetails || payload.bankAccount || {};
    if (!bank.accountNumber) {
      errors.push({ field: 'bankDetails', message: 'Bank account is required for refund' });
    }
    if (bank.ifsc && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(bank.ifsc)) {
      errors.push({ field: 'bankDetails.ifsc', message: 'Invalid IFSC code' });
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
