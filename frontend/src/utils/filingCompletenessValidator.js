// =====================================================
// FILING COMPLETENESS VALIDATOR
// Frontend mirror of backend FilingCompletenessService.
// Pure function — no side effects, no API calls.
// Validates payload completeness for submission gating.
// =====================================================

const n = (v) => Number(v) || 0;
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;

/**
 * Validate filing completeness for submission.
 *
 * @param {object|null|undefined} payload - The filing jsonPayload
 * @param {string} [itrType='ITR-1'] - The ITR form type
 * @returns {{ complete: boolean, missing: Array<{section: string, field: string, message: string}> }}
 */
export function validateFilingCompleteness(payload, itrType = 'ITR-1') {
  if (!payload || typeof payload !== 'object') {
    return {
      complete: false,
      missing: [{ section: 'General', field: 'payload', message: 'No filing data available' }],
    };
  }

  const missing = [];

  validatePersonalInfo(payload, missing);
  validateIncome(payload, itrType, missing);
  validateBank(payload, missing);
  validateNumericBounds(payload, missing);

  return { complete: missing.length === 0, missing };
}

// ── Personal Info ──

function validatePersonalInfo(payload, missing) {
  const pi = payload.personalInfo || {};

  if (!pi.firstName?.trim()) {
    missing.push({ section: 'Personal Info', field: 'firstName', message: 'First name is required' });
  }
  if (!pi.lastName?.trim()) {
    missing.push({ section: 'Personal Info', field: 'lastName', message: 'Last name is required' });
  }

  const pan = pi.pan || '';
  if (!pan || !PAN_REGEX.test(pan)) {
    missing.push({ section: 'Personal Info', field: 'pan', message: 'Valid PAN is required (e.g. ABCDE1234F)' });
  }

  if (!pi.dob?.trim()) {
    missing.push({ section: 'Personal Info', field: 'dob', message: 'Date of birth is required' });
  }
  if (!pi.gender?.trim()) {
    missing.push({ section: 'Personal Info', field: 'gender', message: 'Gender is required' });
  }
  if (!pi.email?.trim()) {
    missing.push({ section: 'Personal Info', field: 'email', message: 'Email is required' });
  }
  if (!pi.phone?.trim()) {
    missing.push({ section: 'Personal Info', field: 'phone', message: 'Phone number is required' });
  }
  if (!pi.residentialStatus?.trim()) {
    missing.push({ section: 'Personal Info', field: 'residentialStatus', message: 'Residential status is required' });
  }
  if (!pi.employerCategory?.trim()) {
    missing.push({ section: 'Personal Info', field: 'employerCategory', message: 'Employer category is required' });
  }
  if (!pi.filingStatus?.trim()) {
    missing.push({ section: 'Personal Info', field: 'filingStatus', message: 'Filing status is required' });
  }

  // Address
  const addr = pi.address || {};
  if (!addr.flatDoorBuilding?.trim()) {
    missing.push({ section: 'Personal Info', field: 'address.flatDoorBuilding', message: 'Flat/Door/Building is required' });
  }
  if (!addr.city?.trim()) {
    missing.push({ section: 'Personal Info', field: 'address.city', message: 'City is required' });
  }
  if (!addr.stateCode?.trim()) {
    missing.push({ section: 'Personal Info', field: 'address.stateCode', message: 'State is required' });
  }
  if (!addr.pincode?.trim()) {
    missing.push({ section: 'Personal Info', field: 'address.pincode', message: 'Pincode is required' });
  }
}

// ── Income ──

function validateIncome(payload, itrType, missing) {
  const income = payload.income || {};

  const hasAnyIncome =
    income.salary?.employers?.length > 0 ||
    (income.houseProperty?.type && income.houseProperty.type !== 'NONE') ||
    n(income.otherSources?.savingsInterest) +
      n(income.otherSources?.fdInterest) +
      n(income.otherSources?.dividendIncome) >
      0 ||
    income.capitalGains?.transactions?.length > 0 ||
    income.business?.businesses?.length > 0 ||
    income.presumptive?.entries?.length > 0;

  if (!hasAnyIncome) {
    missing.push({ section: 'Income', field: 'income', message: 'At least one income source must be entered' });
  }
}

// ── Bank Details ──

function validateBank(payload, missing) {
  const bank = payload.bankDetails || {};

  if (!bank.bankName?.trim()) {
    missing.push({ section: 'Bank', field: 'bankDetails.bankName', message: 'Bank name is required' });
  }
  if (!bank.accountNumber?.trim()) {
    missing.push({ section: 'Bank', field: 'bankDetails.accountNumber', message: 'Account number is required' });
  }
  if (bank.ifsc && !IFSC_REGEX.test(bank.ifsc)) {
    missing.push({ section: 'Bank', field: 'bankDetails.ifsc', message: 'Invalid IFSC format (e.g. SBIN0001234)' });
  }
}

// ── Numeric Bounds ──

function validateNumericBounds(payload, missing) {
  const income = payload.income || {};

  // Salary bounds
  (income.salary?.employers || []).forEach((emp, i) => {
    const prefix = `Employer ${i + 1}`;
    if (n(emp.grossSalary) < 0) {
      missing.push({ section: 'Salary', field: `employer.${i}.grossSalary`, message: `${prefix}: Gross salary cannot be negative` });
    }
    if (n(emp.tdsDeducted) < 0) {
      missing.push({ section: 'Salary', field: `employer.${i}.tds`, message: `${prefix}: TDS cannot be negative` });
    }
  });

  // Other income bounds
  const os = income.otherSources || {};
  const otherFields = ['savingsInterest', 'fdInterest', 'dividendIncome', 'familyPension', 'otherIncome'];
  otherFields.forEach((f) => {
    if (n(os[f]) < 0) {
      missing.push({ section: 'Other Income', field: f, message: `${f} cannot be negative` });
    }
  });

  // House property bounds
  const hp = income.houseProperty || {};
  if (hp.type === 'LET_OUT' && n(hp.annualRentReceived) < 0) {
    missing.push({ section: 'House Property', field: 'annualRentReceived', message: 'Rent received cannot be negative' });
  }

  // Capital gains bounds
  (income.capitalGains?.transactions || []).forEach((t, i) => {
    if (n(t.saleValue) < 0) {
      missing.push({ section: 'Capital Gains', field: `cg.${i}.saleValue`, message: `Transaction ${i + 1}: Sale value cannot be negative` });
    }
    if (n(t.purchaseValue) < 0) {
      missing.push({ section: 'Capital Gains', field: `cg.${i}.purchaseValue`, message: `Transaction ${i + 1}: Purchase value cannot be negative` });
    }
  });

  // Business bounds
  (income.business?.businesses || []).forEach((biz, i) => {
    if (n(biz.turnover) < 0) {
      missing.push({ section: 'Business', field: `business.${i}.turnover`, message: `Business ${i + 1}: Turnover cannot be negative` });
    }
  });

  // Presumptive bounds
  (income.presumptive?.entries || []).forEach((e, i) => {
    if (n(e.grossReceipts) < 0) {
      missing.push({ section: 'Presumptive', field: `pres.${i}.grossReceipts`, message: `Entry ${i + 1}: Gross receipts cannot be negative` });
    }
  });

  // Taxes paid bounds
  if (n(payload.taxes?.advanceTax) < 0) {
    missing.push({ section: 'Taxes Paid', field: 'advanceTax', message: 'Advance tax cannot be negative' });
  }
  if (n(payload.taxes?.selfAssessmentTax) < 0) {
    missing.push({ section: 'Taxes Paid', field: 'selfAssessmentTax', message: 'Self-assessment tax cannot be negative' });
  }

  // Deduction bounds
  const d = payload.deductions || {};
  const deductionFields = [
    'ppf', 'elss', 'lic', 'nsc', 'tuitionFees', 'homeLoanPrincipal',
    'sukanyaSamriddhi', 'fiveYearFD', 'nps', 'healthSelf', 'healthParents',
    'eduLoan', 'savingsInt', 'rentPaid', 'disability',
  ];
  deductionFields.forEach((f) => {
    if (n(d[f]) < 0) {
      missing.push({ section: 'Deductions', field: f, message: `${f}: Deduction amount cannot be negative` });
    }
  });
}
