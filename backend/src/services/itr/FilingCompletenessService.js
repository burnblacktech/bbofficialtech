// =====================================================
// FILING COMPLETENESS SERVICE
// Pre-submission validation gate — checks ALL required fields
// across all editors before allowing submission.
// Pure function — no DB, no side effects.
// =====================================================

const n = (v) => Number(v) || 0;
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;

class FilingCompletenessService {

  /**
   * Validate filing completeness for submission
   * @param {object} filing - ITRFiling instance
   * @returns {{ complete: boolean, errors: Array<{section, field, message}>, warnings: Array<{section, field, message}> }}
   */
  static validate(filing) {
    const errors = [];
    const warnings = [];
    const payload = filing.jsonPayload || {};
    const itrType = filing.itrType || 'ITR-1';

    // Personal info
    this._validatePersonalInfo(payload, filing, errors, warnings);

    // Income sources (ITR-specific)
    this._validateIncome(payload, itrType, errors, warnings);

    // Deductions (old regime only — warnings, not blockers)
    if (payload.selectedRegime === 'old' || filing.selectedRegime === 'old') {
      this._validateDeductions(payload, warnings);
    }

    // Bank details
    this._validateBank(payload, errors);

    // ITR-specific limits
    this._validateITRLimits(payload, itrType, errors);

    // Numeric bounds and cross-field sanity checks
    this._validateNumericBounds(payload, errors, warnings);

    return {
      complete: errors.length === 0,
      errors,
      warnings,
    };
  }

  static _validatePersonalInfo(payload, filing, errors, warnings) {
    const pi = payload.personalInfo || {};
    const pan = filing.taxpayerPan || pi.pan;

    // PAN
    if (!pan || !PAN_REGEX.test(pan)) {
      errors.push({ section: 'Personal Info', field: 'pan', message: 'Valid PAN is required' });
    }

    // Name
    if (!pi.firstName?.trim()) {
      errors.push({ section: 'Personal Info', field: 'firstName', message: 'First name is required' });
    }
    if (!pi.lastName?.trim()) {
      errors.push({ section: 'Personal Info', field: 'lastName', message: 'Last name is required' });
    }

    // DOB
    if (!pi.dob?.trim()) {
      errors.push({ section: 'Personal Info', field: 'dob', message: 'Date of birth is required' });
    }

    // Gender
    if (!pi.gender?.trim()) {
      errors.push({ section: 'Personal Info', field: 'gender', message: 'Gender is required' });
    }

    // Aadhaar — warning, not blocker (needed for e-verification, not for JSON)
    if (!pi.aadhaar?.trim()) {
      warnings.push({ section: 'Personal Info', field: 'aadhaar', message: 'Aadhaar number is recommended for e-verification after filing' });
    } else if (!/^\d{12}$/.test(pi.aadhaar)) {
      errors.push({ section: 'Personal Info', field: 'aadhaar', message: 'Aadhaar must be exactly 12 digits' });
    }

    // Email
    if (!pi.email?.trim()) {
      errors.push({ section: 'Personal Info', field: 'email', message: 'Email is required' });
    }

    // Phone
    if (!pi.phone?.trim()) {
      errors.push({ section: 'Personal Info', field: 'phone', message: 'Phone number is required' });
    } else if (!/^[6-9]\d{9}$/.test(pi.phone)) {
      errors.push({ section: 'Personal Info', field: 'phone', message: 'Phone must be 10 digits starting with 6-9' });
    }

    // Residential status
    if (!pi.residentialStatus?.trim()) {
      errors.push({ section: 'Personal Info', field: 'residentialStatus', message: 'Residential status is required' });
    }

    // Employer category
    if (!pi.employerCategory?.trim()) {
      errors.push({ section: 'Personal Info', field: 'employerCategory', message: 'Employer category is required' });
    }

    // Filing status
    if (!pi.filingStatus?.trim()) {
      errors.push({ section: 'Personal Info', field: 'filingStatus', message: 'Filing status is required' });
    }

    // Conditional: revised return
    if (pi.filingStatus === 'R' && !pi.originalAckNumber?.trim()) {
      errors.push({ section: 'Personal Info', field: 'originalAckNumber', message: 'Original acknowledgment number is required for revised returns' });
    }

    // Conditional: updated return
    if (pi.filingStatus === 'U' && !pi.updatedReturnReason?.trim()) {
      errors.push({ section: 'Personal Info', field: 'updatedReturnReason', message: 'Reason is required for updated returns' });
    }

    // Address
    const addr = pi.address || {};
    if (!addr.flatDoorBuilding?.trim()) {
      errors.push({ section: 'Personal Info', field: 'address.flatDoorBuilding', message: 'Flat/Door/Building is required' });
    }
    if (!addr.city?.trim()) {
      errors.push({ section: 'Personal Info', field: 'address.city', message: 'City is required' });
    }
    if (!addr.stateCode?.trim()) {
      errors.push({ section: 'Personal Info', field: 'address.stateCode', message: 'State is required' });
    }
    if (!addr.pincode?.trim()) {
      errors.push({ section: 'Personal Info', field: 'address.pincode', message: 'Pincode is required' });
    } else if (!/^[1-9]\d{5}$/.test(addr.pincode)) {
      errors.push({ section: 'Personal Info', field: 'address.pincode', message: 'Pincode must be 6 digits starting with 1-9' });
    }
  }

  static _validateIncome(payload, itrType, errors, warnings) {
    const income = payload.income || {};

    // ITR-1: salary required
    if (itrType === 'ITR-1') {
      if (!income.salary?.employers?.length) {
        errors.push({ section: 'Salary', field: 'income.salary', message: 'At least one employer is required for ITR-1' });
      } else {
        income.salary.employers.forEach((emp, i) => {
          if (!emp.name?.trim()) {
            errors.push({ section: 'Salary', field: `employer.${i}.name`, message: `Employer ${i + 1}: Name is required` });
          }
          if (n(emp.grossSalary) <= 0) {
            errors.push({ section: 'Salary', field: `employer.${i}.grossSalary`, message: `Employer ${i + 1}: Gross salary must be > 0` });
          }
        });
      }
    }

    // ITR-3: business required
    if (itrType === 'ITR-3') {
      if (!income.business?.businesses?.length) {
        errors.push({ section: 'Business', field: 'income.business', message: 'At least one business is required for ITR-3' });
      } else {
        income.business.businesses.forEach((biz, i) => {
          if (!biz.name?.trim()) {
            errors.push({ section: 'Business', field: `business.${i}.name`, message: `Business ${i + 1}: Name required` });
          }
          if (n(biz.turnover) <= 0 && n(biz.grossProfit) <= 0) {
            errors.push({ section: 'Business', field: `business.${i}.turnover`, message: `Business ${i + 1}: Turnover or gross profit required` });
          }
        });
      }
    }

    // ITR-4: presumptive required
    if (itrType === 'ITR-4') {
      if (!income.presumptive?.entries?.length) {
        errors.push({ section: 'Presumptive', field: 'income.presumptive', message: 'At least one presumptive income entry required for ITR-4' });
      }
    }

    // Capital gains validation (ITR-2, ITR-3)
    if (income.capitalGains?.transactions?.length) {
      income.capitalGains.transactions.forEach((t, i) => {
        if (!t.assetType) {
          warnings.push({ section: 'Capital Gains', field: `cg.${i}.assetType`, message: `Transaction ${i + 1}: Asset type not specified` });
        }
        if (n(t.saleValue) <= 0) {
          errors.push({ section: 'Capital Gains', field: `cg.${i}.saleValue`, message: `Transaction ${i + 1}: Sale value must be > 0` });
        }
      });
    }

    // At least some income should exist
    const hasAnyIncome = (income.salary?.employers?.length > 0) ||
      (income.houseProperty?.type && income.houseProperty.type !== 'NONE') ||
      n(income.otherSources?.savingsInterest) + n(income.otherSources?.fdInterest) + n(income.otherSources?.dividendIncome) > 0 ||
      (income.capitalGains?.transactions?.length > 0) ||
      (income.business?.businesses?.length > 0) ||
      (income.presumptive?.entries?.length > 0);

    if (!hasAnyIncome) {
      errors.push({ section: 'Income', field: 'income', message: 'At least one income source must be entered' });
    }
  }

  static _validateDeductions(payload, warnings) {
    const d = payload.deductions || {};
    const raw80C = n(d.ppf) + n(d.elss) + n(d.lifeInsurance) + n(d.nsc) + n(d.tuitionFees) + n(d.homeLoanPrincipal) + n(d.sukanyaSamriddhi) + n(d.fiveYearFD);
    if (raw80C > 150000) {
      warnings.push({ section: 'Deductions', field: 'section80C', message: `80C total ₹${raw80C.toLocaleString('en-IN')} exceeds ₹1,50,000 limit — will be capped` });
    }
    if (n(d.nps) > 50000) {
      warnings.push({ section: 'Deductions', field: 'section80CCD', message: '80CCD(1B) NPS exceeds ₹50,000 limit — will be capped' });
    }
  }

  static _validateBank(payload, errors) {
    const bank = payload.bankDetails || {};
    if (!bank.bankName?.trim()) {
      errors.push({ section: 'Bank', field: 'bankDetails.bankName', message: 'Bank name is required' });
    }
    if (!bank.accountNumber?.trim()) {
      errors.push({ section: 'Bank', field: 'bankDetails.accountNumber', message: 'Account number is required' });
    }
    if (bank.ifsc && !IFSC_REGEX.test(bank.ifsc)) {
      errors.push({ section: 'Bank', field: 'bankDetails.ifsc', message: 'Invalid IFSC format' });
    }
  }

  static _validateITRLimits(payload, itrType, errors) {
    // Compute gross total from payload (lightweight — no full computation)
    const income = payload.income || {};
    const salaryGross = (income.salary?.employers || []).reduce((s, e) => s + n(e.grossSalary), 0);
    const otherTotal = n(income.otherSources?.savingsInterest) + n(income.otherSources?.fdInterest) + n(income.otherSources?.dividendIncome) + n(income.otherSources?.familyPension) + n(income.otherSources?.otherIncome);
    const roughTotal = salaryGross + otherTotal;

    if ((itrType === 'ITR-1' || itrType === 'ITR-4') && roughTotal > 5000000) {
      errors.push({ section: 'Income', field: 'incomeLimit', message: `Total income exceeds ₹50L limit for ${itrType}. Use ITR-2 instead.` });
    }

    // ITR-4 turnover limit
    if (itrType === 'ITR-4') {
      const totalReceipts = (income.presumptive?.entries || []).reduce((s, e) => s + n(e.grossReceipts), 0);
      if (totalReceipts > 20000000) {
        errors.push({ section: 'Presumptive', field: 'turnoverLimit', message: 'Total receipts exceed ₹2Cr — use ITR-3 instead' });
      }
    }
  }
  /**
   * Validate numeric bounds, negative values, and cross-field sanity
   * This is the backend enforcement layer — catches API bypass attempts
   */
  static _validateNumericBounds(payload, errors, warnings) {
    const income = payload.income || {};
    const MAX_AMOUNT = 9999999999; // ₹999.99 Cr — practical upper bound

    // ── Salary bounds ──
    (income.salary?.employers || []).forEach((emp, i) => {
      const prefix = `Employer ${i + 1}`;
      if (n(emp.grossSalary) < 0) {
        errors.push({ section: 'Salary', field: `employer.${i}.grossSalary`, message: `${prefix}: Gross salary cannot be negative` });
      }
      if (n(emp.grossSalary) > MAX_AMOUNT) {
        errors.push({ section: 'Salary', field: `employer.${i}.grossSalary`, message: `${prefix}: Gross salary exceeds maximum` });
      }
      if (n(emp.tdsDeducted) < 0) {
        errors.push({ section: 'Salary', field: `employer.${i}.tds`, message: `${prefix}: TDS cannot be negative` });
      }
      if (n(emp.tdsDeducted) > n(emp.grossSalary) && n(emp.grossSalary) > 0) {
        errors.push({ section: 'Salary', field: `employer.${i}.tds`, message: `${prefix}: TDS (₹${n(emp.tdsDeducted).toLocaleString('en-IN')}) cannot exceed gross salary (₹${n(emp.grossSalary).toLocaleString('en-IN')})` });
      }
      if (n(emp.allowances?.hra?.exempt) > n(emp.allowances?.hra?.received) && n(emp.allowances?.hra?.received) > 0) {
        errors.push({ section: 'Salary', field: `employer.${i}.hra`, message: `${prefix}: HRA exempt cannot exceed HRA received` });
      }
      if (n(emp.deductions?.professionalTax) < 0) {
        errors.push({ section: 'Salary', field: `employer.${i}.pt`, message: `${prefix}: Professional tax cannot be negative` });
      }
    });

    // ── House property bounds ──
    const hp = income.houseProperty || {};
    if (hp.type === 'SELF_OCCUPIED' && n(hp.interestOnHomeLoan) < 0) {
      errors.push({ section: 'House Property', field: 'interestOnHomeLoan', message: 'Home loan interest cannot be negative' });
    }
    if (hp.type === 'LET_OUT') {
      if (n(hp.annualRentReceived) < 0) {
        errors.push({ section: 'House Property', field: 'annualRentReceived', message: 'Rent received cannot be negative' });
      }
      if (n(hp.municipalTaxesPaid) < 0) {
        errors.push({ section: 'House Property', field: 'municipalTaxesPaid', message: 'Municipal taxes cannot be negative' });
      }
      if (n(hp.municipalTaxesPaid) > n(hp.annualRentReceived) && n(hp.annualRentReceived) > 0) {
        errors.push({ section: 'House Property', field: 'municipalTaxesPaid', message: 'Municipal taxes cannot exceed rent received' });
      }
    }

    // ── Other income bounds ──
    const os = income.otherSources || {};
    const otherFields = ['savingsInterest', 'fdInterest', 'dividendIncome', 'familyPension', 'otherIncome'];
    otherFields.forEach(f => {
      if (n(os[f]) < 0) {
        errors.push({ section: 'Other Income', field: f, message: `${f} cannot be negative` });
      }
    });

    // ── Capital gains bounds ──
    (income.capitalGains?.transactions || []).forEach((t, i) => {
      if (n(t.saleValue) < 0) {
        errors.push({ section: 'Capital Gains', field: `cg.${i}.saleValue`, message: `Transaction ${i + 1}: Sale value cannot be negative` });
      }
      if (n(t.purchaseValue) < 0) {
        errors.push({ section: 'Capital Gains', field: `cg.${i}.purchaseValue`, message: `Transaction ${i + 1}: Purchase value cannot be negative` });
      }
      if (n(t.expenses) < 0) {
        errors.push({ section: 'Capital Gains', field: `cg.${i}.expenses`, message: `Transaction ${i + 1}: Expenses cannot be negative` });
      }
      if (n(t.exemption) < 0) {
        errors.push({ section: 'Capital Gains', field: `cg.${i}.exemption`, message: `Transaction ${i + 1}: Exemption cannot be negative` });
      }
      // Exemption should not exceed gain — blocker
      const gain = n(t.saleValue) - n(t.purchaseValue || t.indexedCost) - n(t.expenses);
      if (gain > 0 && n(t.exemption) > gain) {
        errors.push({ section: 'Capital Gains', field: `cg.${i}.exemption`, message: `Transaction ${i + 1}: Exemption (₹${n(t.exemption).toLocaleString('en-IN')}) cannot exceed gain (₹${gain.toLocaleString('en-IN')})` });
      }
    });

    // ── Business bounds ──
    (income.business?.businesses || []).forEach((biz, i) => {
      if (n(biz.turnover) < 0) {
        errors.push({ section: 'Business', field: `business.${i}.turnover`, message: `Business ${i + 1}: Turnover cannot be negative` });
      }
    });

    // ── Presumptive bounds ──
    (income.presumptive?.entries || []).forEach((e, i) => {
      if (n(e.grossReceipts) < 0) {
        errors.push({ section: 'Presumptive', field: `pres.${i}.grossReceipts`, message: `Entry ${i + 1}: Gross receipts cannot be negative` });
      }
      // Minimum income rate enforcement (44AD: 6-8%, 44ADA: 50%)
      const receipts = n(e.grossReceipts);
      if (receipts > 0 && e.section === '44AD') {
        const minRate = e.digitalReceipts ? 6 : 8;
        const minIncome = Math.round(receipts * minRate / 100);
        if (n(e.declaredIncome) < minIncome) {
          errors.push({ section: 'Presumptive', field: `pres.${i}.declaredIncome`, message: `Entry ${i + 1}: Declared income must be at least ${minRate}% of receipts (₹${minIncome.toLocaleString('en-IN')})` });
        }
      }
      if (receipts > 0 && e.section === '44ADA') {
        const minIncome = Math.round(receipts * 50 / 100);
        if (n(e.declaredIncome) < minIncome) {
          errors.push({ section: 'Presumptive', field: `pres.${i}.declaredIncome`, message: `Entry ${i + 1}: Declared income must be at least 50% of receipts (₹${minIncome.toLocaleString('en-IN')})` });
        }
      }
    });

    // ── Foreign income bounds ──
    (income.foreignIncome?.incomes || []).forEach((inc, i) => {
      if (n(inc.amountINR) < 0) {
        errors.push({ section: 'Foreign Income', field: `fi.${i}.amountINR`, message: `Entry ${i + 1}: Amount cannot be negative` });
      }
      if (n(inc.taxPaidAbroad) < 0) {
        errors.push({ section: 'Foreign Income', field: `fi.${i}.taxPaidAbroad`, message: `Entry ${i + 1}: Tax paid abroad cannot be negative` });
      }
    });

    // ── TDS bounds ──
    const tds = payload.taxes?.tds || {};
    (tds.nonSalaryEntries || []).forEach((e, i) => {
      if (n(e.tdsDeducted) < 0) {
        errors.push({ section: 'TDS', field: `tds.${i}.tdsDeducted`, message: `TDS entry ${i + 1}: TDS deducted cannot be negative` });
      }
      if (n(e.tdsClaimed) < 0) {
        errors.push({ section: 'TDS', field: `tds.${i}.tdsClaimed`, message: `TDS entry ${i + 1}: TDS claimed cannot be negative` });
      }
      if (n(e.tdsClaimed) > n(e.tdsDeducted) && n(e.tdsDeducted) > 0) {
        errors.push({ section: 'TDS', field: `tds.${i}.tdsClaimed`, message: `TDS entry ${i + 1}: TDS claimed (₹${n(e.tdsClaimed).toLocaleString('en-IN')}) cannot exceed TDS deducted (₹${n(e.tdsDeducted).toLocaleString('en-IN')})` });
      }
    });

    // ── Advance tax / SAT bounds ──
    if (n(payload.taxes?.advanceTax) < 0) {
      errors.push({ section: 'Taxes Paid', field: 'advanceTax', message: 'Advance tax cannot be negative' });
    }
    if (n(payload.taxes?.selfAssessmentTax) < 0) {
      errors.push({ section: 'Taxes Paid', field: 'selfAssessmentTax', message: 'Self-assessment tax cannot be negative' });
    }

    // ── Deduction bounds (enforce caps as errors, not just warnings) ──
    const d = payload.deductions || {};
    const deductionFields = ['ppf', 'elss', 'lic', 'nsc', 'tuitionFees', 'homeLoanPrincipal', 'sukanyaSamriddhi', 'fiveYearFD', 'nps', 'healthSelf', 'healthParents', 'eduLoan', 'savingsInt', 'rentPaid', 'disability'];
    deductionFields.forEach(f => {
      if (n(d[f]) < 0) {
        errors.push({ section: 'Deductions', field: f, message: `${f}: Deduction amount cannot be negative` });
      }
    });
  }
}

module.exports = FilingCompletenessService;
