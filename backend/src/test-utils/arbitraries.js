/**
 * Custom fast-check arbitraries for BurnBlack domain types.
 * Used in property-based tests across all services.
 */

const fc = require('fast-check');

// ── PAN: 5 uppercase letters + 4 digits + 1 uppercase letter ──
const panArb = fc.tuple(
  fc.stringOf(fc.constantFrom(...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'), { minLength: 5, maxLength: 5 }),
  fc.stringOf(fc.constantFrom(...'0123456789'), { minLength: 4, maxLength: 4 }),
  fc.constantFrom(...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'),
).map(([prefix, digits, suffix]) => prefix + digits + suffix);

// ── TAN: 4 uppercase letters + 5 digits + 1 uppercase letter ──
const tanArb = fc.tuple(
  fc.stringOf(fc.constantFrom(...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'), { minLength: 4, maxLength: 4 }),
  fc.stringOf(fc.constantFrom(...'0123456789'), { minLength: 5, maxLength: 5 }),
  fc.constantFrom(...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'),
).map(([prefix, digits, suffix]) => prefix + digits + suffix);

// ── Assessment Year: "YYYY-YY" format ──
const assessmentYearArb = fc.integer({ min: 2021, max: 2030 })
  .map(y => `${y}-${String(y + 1).slice(2)}`);

// ── Financial Year: "YYYY-YY" format (one year before AY) ──
const financialYearArb = fc.integer({ min: 2020, max: 2029 })
  .map(y => `${y}-${String(y + 1).slice(2)}`);

// ── Money amount (non-negative, reasonable range) ──
const moneyArb = fc.integer({ min: 0, max: 99999999 });

// ── Salary employer ──
const employerArb = fc.record({
  name: fc.string({ minLength: 1, maxLength: 50 }),
  tan: tanArb,
  grossSalary: fc.integer({ min: 100000, max: 50000000 }),
  tdsDeducted: fc.integer({ min: 0, max: 10000000 }),
  basicPlusDA: fc.integer({ min: 50000, max: 30000000 }),
  allowances: fc.record({
    hra: fc.record({
      received: fc.integer({ min: 0, max: 500000 }),
      exempt: fc.integer({ min: 0, max: 500000 }),
    }),
  }),
  rentPaid: fc.integer({ min: 0, max: 1200000 }),
  cityOfEmployment: fc.constantFrom('Mumbai', 'Delhi', 'Bangalore', 'Pune', 'Jaipur'),
  deductions: fc.record({
    professionalTax: fc.integer({ min: 0, max: 5000 }),
  }),
});

// ── Deductions ──
const deductionsArb = fc.record({
  ppf: fc.integer({ min: 0, max: 150000 }),
  elss: fc.integer({ min: 0, max: 150000 }),
  lic: fc.integer({ min: 0, max: 150000 }),
  tuitionFees: fc.integer({ min: 0, max: 150000 }),
  homeLoanPrincipal: fc.integer({ min: 0, max: 150000 }),
  sukanyaSamriddhi: fc.integer({ min: 0, max: 150000 }),
  fiveYearFD: fc.integer({ min: 0, max: 150000 }),
  nsc: fc.integer({ min: 0, max: 150000 }),
  nps: fc.integer({ min: 0, max: 50000 }),
  healthSelf: fc.integer({ min: 0, max: 50000 }),
  healthParents: fc.integer({ min: 0, max: 50000 }),
  eduLoan: fc.integer({ min: 0, max: 500000 }),
  savingsInt: fc.integer({ min: 0, max: 10000 }),
  rentPaid: fc.integer({ min: 0, max: 60000 }),
  disability: fc.integer({ min: 0, max: 125000 }),
});

// ── Filing payload (simplified for property tests) ──
const filingPayloadArb = fc.record({
  personalInfo: fc.record({
    firstName: fc.string({ minLength: 1, maxLength: 30 }),
    lastName: fc.string({ minLength: 1, maxLength: 30 }),
    pan: panArb,
    dob: fc.date({ min: new Date('1940-01-01'), max: new Date('2005-12-31') }).map(d => d.toISOString().slice(0, 10)),
    gender: fc.constantFrom('Male', 'Female', 'Other'),
    aadhaar: fc.stringOf(fc.constantFrom(...'0123456789'), { minLength: 12, maxLength: 12 }),
    email: fc.emailAddress(),
    phone: fc.tuple(fc.constantFrom('6', '7', '8', '9'), fc.stringOf(fc.constantFrom(...'0123456789'), { minLength: 9, maxLength: 9 })).map(([f, r]) => f + r),
    residentialStatus: fc.constantFrom('RES', 'NRI'),
    employerCategory: fc.constantFrom('GOV', 'PSU', 'PE', 'OTH', 'NA'),
    filingStatus: fc.constantFrom('O', 'R', 'B'),
    address: fc.record({
      flatDoorBuilding: fc.string({ minLength: 1, maxLength: 50 }),
      city: fc.string({ minLength: 1, maxLength: 30 }),
      stateCode: fc.stringOf(fc.constantFrom(...'0123456789'), { minLength: 2, maxLength: 2 }),
      pincode: fc.tuple(fc.constantFrom('1', '2', '3', '4', '5', '6', '7', '8', '9'), fc.stringOf(fc.constantFrom(...'0123456789'), { minLength: 5, maxLength: 5 })).map(([f, r]) => f + r),
    }),
  }),
  income: fc.record({
    salary: fc.record({
      employers: fc.array(employerArb, { minLength: 0, maxLength: 3 }),
    }),
    otherSources: fc.record({
      savingsInterest: moneyArb,
      fdInterest: moneyArb,
      dividendIncome: moneyArb,
      familyPension: moneyArb,
      otherIncome: moneyArb,
    }),
    agriculturalIncome: fc.integer({ min: 0, max: 500000 }),
  }),
  deductions: deductionsArb,
  selectedRegime: fc.constantFrom('old', 'new'),
});

// ── Email address (simple) ──
const emailArb = fc.emailAddress();

// ── Phone number (Indian) ──
const phoneArb = fc.tuple(
  fc.constantFrom('6', '7', '8', '9'),
  fc.stringOf(fc.constantFrom(...'0123456789'), { minLength: 9, maxLength: 9 }),
).map(([f, r]) => f + r);

// ── OTP code (6 digits) ──
const otpCodeArb = fc.stringOf(fc.constantFrom(...'0123456789'), { minLength: 6, maxLength: 6 });

// ── Document category ──
const docCategoryArb = fc.constantFrom('salary', 'investments', 'insurance', 'rent', 'donations', 'medical', 'capital_gains', 'business', 'other');

// ── Relationship ──
const relationshipArb = fc.constantFrom('spouse', 'parent', 'child', 'other');

module.exports = {
  panArb, tanArb, assessmentYearArb, financialYearArb, moneyArb,
  employerArb, deductionsArb, filingPayloadArb,
  emailArb, phoneArb, otpCodeArb, docCategoryArb, relationshipArb,
};
