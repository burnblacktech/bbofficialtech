/**
 * ITR Field Validation — shared rules for all ITR types
 * Returns { valid: boolean, errors: { [field]: string } }
 */

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
const TAN_REGEX = /^[A-Z]{4}[0-9]{5}[A-Z]{1}$/;
const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;

const n = (v) => Number(v) || 0;

// ── Salary ──
export function validateSalaryStep(employers) {
  const errors = {};
  if (!employers || employers.length === 0) {
    errors._form = 'Add at least one employer';
    return { valid: false, errors };
  }
  employers.forEach((emp, i) => {
    if (!emp.name?.trim()) errors[`emp${i}_name`] = `Employer ${i + 1}: Name is required`;
    if (n(emp.grossSalary) <= 0) errors[`emp${i}_gross`] = `Employer ${i + 1}: Gross salary must be > 0`;
    if (n(emp.grossSalary) > 9999999999) errors[`emp${i}_gross`] = `Employer ${i + 1}: Gross salary exceeds maximum`;
    if (n(emp.tdsDeducted) < 0) errors[`emp${i}_tds`] = `Employer ${i + 1}: TDS cannot be negative`;
    if (n(emp.tdsDeducted) > n(emp.grossSalary)) errors[`emp${i}_tds`] = `Employer ${i + 1}: TDS cannot exceed gross salary`;
    if (n(emp.allowances?.hra?.exempt) > n(emp.allowances?.hra?.received)) errors[`emp${i}_hra`] = `Employer ${i + 1}: HRA exempt cannot exceed HRA received`;
    if (emp.tan && !TAN_REGEX.test(emp.tan)) errors[`emp${i}_tan`] = `Employer ${i + 1}: Invalid TAN format`;
    if (n(emp.deductions?.professionalTax) < 0) errors[`emp${i}_pt`] = `Employer ${i + 1}: Professional tax cannot be negative`;
  });
  return { valid: Object.keys(errors).length === 0, errors };
}

// ── House Property (single — ITR-1) ──
export function validateHousePropertyStep(type, data) {
  const errors = {};
  if (type === 'SELF_OCCUPIED') {
    if (n(data.interestOnHomeLoan) < 0) errors.interest = 'Interest cannot be negative';
  }
  if (type === 'LET_OUT') {
    if (n(data.annualRentReceived) < 0) errors.rent = 'Rent cannot be negative';
    if (n(data.municipalTaxesPaid) < 0) errors.municipal = 'Municipal taxes cannot be negative';
    if (n(data.municipalTaxesPaid) > n(data.annualRentReceived)) errors.municipal = 'Municipal taxes cannot exceed rent received';
    if (n(data.interestOnHomeLoan) < 0) errors.interest = 'Interest cannot be negative';
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

// ── House Properties (multiple — ITR-2/3) ──
export function validateHousePropertiesStep(properties) {
  const errors = {};
  if (!properties) return { valid: true, errors };
  properties.forEach((p, i) => {
    if (p.type === 'LET_OUT' && n(p.annualRentReceived) <= 0) errors[`prop${i}_rent`] = `Property ${i + 1}: Rent must be > 0 for let-out`;
    if (n(p.interestOnHomeLoan) < 0) errors[`prop${i}_interest`] = `Property ${i + 1}: Interest cannot be negative`;
  });
  return { valid: Object.keys(errors).length === 0, errors };
}

// ── Other Income ──
export function validateOtherIncomeStep(data) {
  const errors = {};
  const fields = ['savingsInterest', 'fdInterest', 'dividendIncome', 'familyPension', 'otherIncome'];
  fields.forEach(f => {
    if (n(data[f]) < 0) errors[f] = `${f.replace(/([A-Z])/g, ' $1')} cannot be negative`;
  });
  return { valid: Object.keys(errors).length === 0, errors };
}

// ── Deductions ──
export function validateDeductionsStep(data, regime) {
  if (regime === 'new') return { valid: true, errors: {} };
  const errors = {};
  const raw80C = n(data.ppf) + n(data.elss) + n(data.lifeInsurance) + n(data.nsc) + n(data.tuitionFees) + n(data.homeLoanPrincipal) + n(data.sukanyaSamriddhi) + n(data.fiveYearFD);
  if (raw80C > 150000) errors.section80C = `80C total (₹${raw80C.toLocaleString('en-IN')}) exceeds ₹1,50,000 limit — only ₹1,50,000 will be allowed`;
  if (n(data.nps) > 50000) errors.nps = '80CCD(1B) NPS cannot exceed ₹50,000';
  if (n(data.selfPremium) + n(data.selfPreventive) > (data.selfSenior ? 50000 : 25000)) errors.section80DSelf = 'Self 80D exceeds limit';
  if (n(data.parentsPremium) + n(data.parentsPreventive) > (data.parentsSenior ? 50000 : 25000)) errors.section80DParents = 'Parents 80D exceeds limit';
  // These are warnings, not blockers — amounts will be capped automatically
  return { valid: true, errors }; // Always valid — caps are enforced in computation
}

// ── Capital Gains ──
export function validateCapitalGainsStep(transactions) {
  const errors = {};
  if (!transactions) return { valid: true, errors };
  transactions.forEach((t, i) => {
    if (!t.assetType) errors[`txn${i}_type`] = `Transaction ${i + 1}: Asset type required`;
    if (n(t.saleValue) <= 0) errors[`txn${i}_sale`] = `Transaction ${i + 1}: Sale value must be > 0`;
    if (n(t.purchaseValue) <= 0 && n(t.indexedCost) <= 0) errors[`txn${i}_cost`] = `Transaction ${i + 1}: Purchase value or indexed cost required`;
    if (n(t.expenses) < 0) errors[`txn${i}_exp`] = `Transaction ${i + 1}: Expenses cannot be negative`;
    if (n(t.exemption) < 0) errors[`txn${i}_exempt`] = `Transaction ${i + 1}: Exemption cannot be negative`;
  });
  return { valid: Object.keys(errors).length === 0, errors };
}

// ── Foreign Income ──
export function validateForeignIncomeStep(incomes) {
  const errors = {};
  if (!incomes) return { valid: true, errors };
  incomes.forEach((inc, i) => {
    if (!inc.country?.trim()) errors[`fi${i}_country`] = `Entry ${i + 1}: Country required`;
    if (n(inc.amountINR) <= 0) errors[`fi${i}_amount`] = `Entry ${i + 1}: Amount must be > 0`;
    if (n(inc.taxPaidAbroad) < 0) errors[`fi${i}_tax`] = `Entry ${i + 1}: Tax paid cannot be negative`;
  });
  return { valid: Object.keys(errors).length === 0, errors };
}

// ── Business Income ──
export function validateBusinessIncomeStep(businesses) {
  const errors = {};
  if (!businesses || businesses.length === 0) {
    errors._form = 'Add at least one business';
    return { valid: false, errors };
  }
  businesses.forEach((b, i) => {
    if (!b.name?.trim()) errors[`biz${i}_name`] = `Business ${i + 1}: Name required`;
    if (n(b.turnover) <= 0 && n(b.grossProfit) <= 0) errors[`biz${i}_turnover`] = `Business ${i + 1}: Turnover or gross profit required`;
  });
  return { valid: Object.keys(errors).length === 0, errors };
}

// ── Balance Sheet ──
export function validateBalanceSheetStep(data) {
  const errors = {};
  const totalAssets = n(data.fixedAssets) + n(data.currentAssets) + n(data.investments) + n(data.otherAssets);
  const totalLiabilities = n(data.capital) + n(data.reserves) + n(data.securedLoans) + n(data.unsecuredLoans) + n(data.currentLiabilities);
  if (Math.abs(totalAssets - totalLiabilities) > 1) {
    errors.balance = `Assets (₹${totalAssets.toLocaleString('en-IN')}) ≠ Liabilities (₹${totalLiabilities.toLocaleString('en-IN')})`;
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

// ── Presumptive Income ──
export function validatePresumptiveStep(entries) {
  const errors = {};
  if (!entries || entries.length === 0) {
    errors._form = 'Add at least one income source';
    return { valid: false, errors };
  }
  let totalReceipts = 0;
  entries.forEach((e, i) => {
    if (e.section === '44AE') {
      if (n(e.vehicles) <= 0) errors[`pres${i}_vehicles`] = `Entry ${i + 1}: Number of vehicles required`;
    } else {
      if (n(e.grossReceipts) <= 0) errors[`pres${i}_receipts`] = `Entry ${i + 1}: Gross receipts must be > 0`;
      totalReceipts += n(e.grossReceipts);
    }
  });
  if (totalReceipts > 20000000) errors.turnoverLimit = 'Total receipts exceed ₹2Cr — use ITR-3 instead';
  return { valid: Object.keys(errors).length === 0, errors };
}

// ── Bank Account ──
export function validateBankAccount(bank) {
  const errors = {};
  if (!bank?.bankName?.trim()) errors.bankName = 'Bank name required';
  if (!bank?.accountNumber?.trim()) errors.accountNumber = 'Account number required';
  if (bank?.ifsc && !IFSC_REGEX.test(bank.ifsc)) errors.ifsc = 'Invalid IFSC format (e.g., SBIN0001234)';
  return { valid: Object.keys(errors).length === 0, errors };
}

// ── ITR-1 Income Limit ──
export function validateITR1Limit(grossTotal) {
  if (grossTotal > 5000000) {
    return { valid: false, errors: { incomeLimit: 'Total income exceeds ₹50L — ITR-1 not applicable. Use ITR-2.' } };
  }
  return { valid: true, errors: {} };
}

// ── Personal Info ──
const NAME_REGEX = /^[A-Za-z\s.]+$/;
const AADHAAR_REGEX = /^\d{12}$/;
const PHONE_REGEX = /^[6-9]\d{9}$/;
const PINCODE_REGEX = /^[1-9]\d{5}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const VALID_RESIDENTIAL_STATUSES = ['RES', 'NRI', 'RNOR'];
const VALID_EMPLOYER_CATEGORIES = ['GOV', 'PSU', 'PE', 'OTH', 'NA'];
const VALID_FILING_STATUSES = ['O', 'R', 'B', 'U'];

export function validatePersonalInfo(data) {
  const errors = {};
  if (!data) {
    errors._form = 'Personal info is required';
    return { valid: false, errors };
  }

  // firstName
  if (!data.firstName?.trim()) {
    errors.firstName = 'First name is required';
  } else if (!NAME_REGEX.test(data.firstName)) {
    errors.firstName = 'First name must contain only letters, spaces, and dots';
  } else if (data.firstName.length > 50) {
    errors.firstName = 'First name must be 50 characters or less';
  }

  // lastName
  if (!data.lastName?.trim()) {
    errors.lastName = 'Last name is required';
  } else if (!NAME_REGEX.test(data.lastName)) {
    errors.lastName = 'Last name must contain only letters, spaces, and dots';
  } else if (data.lastName.length > 50) {
    errors.lastName = 'Last name must be 50 characters or less';
  }

  // PAN
  if (!data.pan?.trim()) {
    errors.pan = 'PAN is required';
  } else if (!PAN_REGEX.test(data.pan)) {
    errors.pan = 'Invalid PAN format (e.g., ABCDE1234F)';
  }

  // DOB
  if (!data.dob?.trim()) {
    errors.dob = 'Date of birth is required';
  } else {
    const dobDate = new Date(data.dob);
    const now = new Date();
    if (isNaN(dobDate.getTime())) {
      errors.dob = 'Invalid date format';
    } else if (dobDate >= now) {
      errors.dob = 'Date of birth must be in the past';
    } else {
      const ageDiff = now.getFullYear() - dobDate.getFullYear();
      const age = now < new Date(now.getFullYear(), dobDate.getMonth(), dobDate.getDate()) ? ageDiff - 1 : ageDiff;
      if (age > 150) {
        errors.dob = 'Age cannot exceed 150 years';
      }
    }
  }

  // Aadhaar — optional for JSON download, needed for e-verification
  // Only validate format if provided, don't block if empty
  if (data.aadhaar?.trim() && !AADHAAR_REGEX.test(data.aadhaar)) {
    errors.aadhaar = 'Aadhaar must be exactly 12 digits';
  }

  // Email
  if (!data.email?.trim()) {
    errors.email = 'Email is required';
  } else if (!EMAIL_REGEX.test(data.email)) {
    errors.email = 'Invalid email format';
  }

  // Phone
  if (!data.phone?.trim()) {
    errors.phone = 'Phone number is required';
  } else if (!PHONE_REGEX.test(data.phone)) {
    errors.phone = 'Phone must be 10 digits starting with 6-9';
  }

  // Residential Status
  if (!data.residentialStatus?.trim()) {
    errors.residentialStatus = 'Residential status is required';
  } else if (!VALID_RESIDENTIAL_STATUSES.includes(data.residentialStatus)) {
    errors.residentialStatus = 'Invalid residential status';
  }

  // Employer Category
  if (!data.employerCategory?.trim()) {
    errors.employerCategory = 'Employer category is required';
  } else if (!VALID_EMPLOYER_CATEGORIES.includes(data.employerCategory)) {
    errors.employerCategory = 'Invalid employer category';
  }

  // Filing Status
  if (!data.filingStatus?.trim()) {
    errors.filingStatus = 'Filing status is required';
  } else if (!VALID_FILING_STATUSES.includes(data.filingStatus)) {
    errors.filingStatus = 'Invalid filing status';
  }

  // Conditional: revised return requires originalAckNumber
  if (data.filingStatus === 'R' && !data.originalAckNumber?.trim()) {
    errors.originalAckNumber = 'Original acknowledgment number is required for revised returns';
  }

  // Conditional: updated return requires updatedReturnReason
  if (data.filingStatus === 'U' && !data.updatedReturnReason?.trim()) {
    errors.updatedReturnReason = 'Reason is required for updated returns';
  }

  // Address
  const addr = data.address || {};
  if (!addr.flatDoorBuilding?.trim()) {
    errors['address.flatDoorBuilding'] = 'Flat/Door/Building is required';
  }
  if (!addr.city?.trim()) {
    errors['address.city'] = 'City is required';
  }
  if (!addr.stateCode?.trim()) {
    errors['address.stateCode'] = 'State is required';
  }
  if (!addr.pincode?.trim()) {
    errors['address.pincode'] = 'Pincode is required';
  } else if (!PINCODE_REGEX.test(addr.pincode)) {
    errors['address.pincode'] = 'Pincode must be 6 digits starting with 1-9';
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

// ── TDS2 Entry ──
export function validateTDS2Entry(entry) {
  const errors = {};
  if (!entry) {
    errors._form = 'TDS entry is required';
    return { valid: false, errors };
  }

  if (!entry.deductorTan?.trim()) {
    errors.deductorTan = 'Deductor TAN is required';
  } else if (!TAN_REGEX.test(entry.deductorTan)) {
    errors.deductorTan = 'Invalid TAN format (e.g., ABCD12345E)';
  }

  if (!entry.deductorName?.trim()) {
    errors.deductorName = 'Deductor name is required';
  }

  if (!entry.sectionCode?.trim()) {
    errors.sectionCode = 'Section code is required';
  }

  if (n(entry.amountPaid) < 0) {
    errors.amountPaid = 'Amount paid cannot be negative';
  }

  if (n(entry.tdsDeducted) < 0) {
    errors.tdsDeducted = 'TDS deducted cannot be negative';
  }

  if (n(entry.tdsClaimed) < 0) {
    errors.tdsClaimed = 'TDS claimed cannot be negative';
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

// ── 80G Donation ──
const VALID_80G_CATEGORIES = ['100_no_limit', '100_with_limit', '50_no_limit', '50_with_limit'];

export function validateDonation80G(entry) {
  const errors = {};
  if (!entry) {
    errors._form = 'Donation entry is required';
    return { valid: false, errors };
  }

  if (!entry.doneeName?.trim()) {
    errors.doneeName = 'Donee name is required';
  }

  if (n(entry.amount) <= 0) {
    errors.amount = 'Donation amount must be greater than 0';
  }

  // Donee PAN required for donations > ₹2000
  if (n(entry.amount) > 2000 && !entry.doneePan?.trim()) {
    errors.doneePan = 'Donee PAN is required for donations exceeding ₹2,000';
  } else if (entry.doneePan?.trim() && !PAN_REGEX.test(entry.doneePan)) {
    errors.doneePan = 'Invalid PAN format (e.g., ABCDE1234F)';
  }

  if (!entry.category?.trim()) {
    errors.category = 'Donation category is required';
  } else if (!VALID_80G_CATEGORIES.includes(entry.category)) {
    errors.category = 'Invalid donation category';
  }

  return { valid: Object.keys(errors).length === 0, errors };
}
