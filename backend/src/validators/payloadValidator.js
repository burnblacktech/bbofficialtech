/**
 * payloadValidator.js
 * Joi-based structural validator for filing jsonPayload.
 *
 * Enforces types (strings for PAN, numbers for amounts, arrays for lists)
 * without enforcing business-level completeness — that remains in
 * FilingCompletenessService.
 *
 * Options: allowUnknown: true (top level), abortEarly: false
 */

const Joi = require('joi');

// --- Nested schemas ---

const employerSchema = Joi.object({
  name: Joi.string().allow('', null),
  grossSalary: Joi.number().allow(null),
  tdsDeducted: Joi.number().allow(null),
}).unknown(true);

const housePropertySchema = Joi.object({
  type: Joi.string().allow('', null),
  annualRentReceived: Joi.number().allow(null),
  interestOnHomeLoan: Joi.number().allow(null),
}).unknown(true);

const otherSourcesSchema = Joi.object({
  savingsInterest: Joi.number().allow(null),
  fdInterest: Joi.number().allow(null),
  dividendIncome: Joi.number().allow(null),
}).unknown(true);

const transactionSchema = Joi.object({
  type: Joi.string().allow('', null),
  purchasePrice: Joi.number().allow(null),
  salePrice: Joi.number().allow(null),
}).unknown(true);

const businessSchema = Joi.object({
  name: Joi.string().allow('', null),
  turnover: Joi.number().allow(null),
}).unknown(true);

const presumptiveSchema = Joi.object({
  section: Joi.string().allow('', null),
  grossReceipts: Joi.number().allow(null),
}).unknown(true);

const foreignIncomeSchema = Joi.object({
  country: Joi.string().allow('', null),
  amount: Joi.number().allow(null),
}).unknown(true);

const donation80GSchema = Joi.object({
  doneeName: Joi.string().allow('', null),
  doneeAddress: Joi.string().allow('', null),
  doneePan: Joi.string().allow('', null),
  amount: Joi.number().allow(null),
  qualifyingPercent: Joi.number().allow(null),
}).unknown(true);

const deductionsSchema = Joi.object({
  // Section 80C components
  ppf: Joi.number().allow(null),
  elss: Joi.number().allow(null),
  lic: Joi.number().allow(null),
  nps: Joi.number().allow(null),
  sukanya: Joi.number().allow(null),
  taxFd: Joi.number().allow(null),
  ulip: Joi.number().allow(null),
  other80c: Joi.number().allow(null),
  tuitionFees: Joi.number().allow(null),
  homeLoanPrincipal: Joi.number().allow(null),
  total80C: Joi.number().allow(null),
  // Section 80D — health insurance
  healthSelf: Joi.number().allow(null),
  healthParents: Joi.number().allow(null),
  preventiveCheckup: Joi.number().allow(null),
  // Section 80CCD(1B) — additional NPS
  nps80ccd1b: Joi.number().allow(null),
  // Section 80DD — disabled dependent
  section80DD: Joi.number().allow(null),
  // Section 80DDB — medical treatment
  section80DDB: Joi.number().allow(null),
  // Section 80E — education loan
  educationLoan80E: Joi.number().allow(null),
  // Section 80EE — home loan interest (first-time buyer)
  section80EE: Joi.number().allow(null),
  // Section 80G — donations
  donations80G: Joi.array().items(donation80GSchema).allow(null),
  // Section 80TTA / 80TTB — savings interest
  section80TTA: Joi.number().allow(null),
  section80TTB: Joi.number().allow(null),
}).unknown(true);

const salarySchema = Joi.object({
  employers: Joi.array().items(employerSchema).allow(null),
}).unknown(true);

const capitalGainsSchema = Joi.object({
  transactions: Joi.array().items(transactionSchema).allow(null),
}).unknown(true);

const businessIncomeSchema = Joi.object({
  businesses: Joi.array().items(businessSchema).allow(null),
}).unknown(true);

const presumptiveIncomeSchema = Joi.object({
  entries: Joi.array().items(presumptiveSchema).allow(null),
}).unknown(true);

const foreignIncomeWrapperSchema = Joi.object({
  incomes: Joi.array().items(foreignIncomeSchema).allow(null),
}).unknown(true);

const incomeSchema = Joi.object({
  salary: salarySchema.allow(null),
  houseProperty: housePropertySchema.allow(null),
  otherSources: otherSourcesSchema.allow(null),
  capitalGains: capitalGainsSchema.allow(null),
  business: businessIncomeSchema.allow(null),
  presumptive: presumptiveIncomeSchema.allow(null),
  foreignIncome: foreignIncomeWrapperSchema.allow(null),
}).unknown(true);

const personalInfoSchema = Joi.object({
  pan: Joi.string().pattern(/^[A-Z]{5}[0-9]{4}[A-Z]$/).allow('', null),
  firstName: Joi.string().allow('', null),
  lastName: Joi.string().allow('', null),
  dob: Joi.string().allow('', null),
}).unknown(true);

const bankDetailsSchema = Joi.object({
  bankName: Joi.string().allow('', null),
  accountNumber: Joi.string().allow('', null),
  ifsc: Joi.string().allow('', null),
}).unknown(true);

const taxesSchema = Joi.object().unknown(true);

const payloadSchema = Joi.object({
  personalInfo: personalInfoSchema.allow(null),
  income: incomeSchema.allow(null),
  deductions: deductionsSchema.allow(null),
  bankDetails: bankDetailsSchema.allow(null),
  taxes: taxesSchema.allow(null),
  _selectedSources: Joi.array().items(Joi.string()).allow(null),
  _onboarding: Joi.object().unknown(true).allow(null),
  _defaultsApplied: Joi.boolean().allow(null),
  _importMeta: Joi.object().unknown(true).allow(null),
  selectedRegime: Joi.string().valid('old', 'new').allow('', null),
}).options({ allowUnknown: true, abortEarly: false });

/**
 * Validate a jsonPayload against the structural schema.
 * @param {object} payload - The merged jsonPayload to validate
 * @returns {{ error?: Joi.ValidationError, value: object }}
 */
function validatePayload(payload) {
  return payloadSchema.validate(payload);
}

module.exports = { validatePayload };
