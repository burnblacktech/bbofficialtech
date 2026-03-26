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
