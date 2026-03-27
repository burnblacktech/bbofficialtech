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

    return {
      complete: errors.length === 0,
      errors,
      warnings,
    };
  }

  static _validatePersonalInfo(payload, filing, errors) {
    const pan = filing.taxpayerPan || payload.personalInfo?.pan;
    if (!pan || !PAN_REGEX.test(pan)) {
      errors.push({ section: 'Personal Info', field: 'pan', message: 'Valid PAN is required' });
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
}

module.exports = FilingCompletenessService;
