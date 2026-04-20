/**
 * Custom fast-check arbitraries for BurnBlack frontend tests.
 */

import fc from 'fast-check';

// ── Money amount (non-negative, reasonable range for Indian taxes) ──
export const moneyArb = fc.integer({ min: 0, max: 99999999 });

// ── PAN ──
export const panArb = fc.tuple(
  fc.stringOf(fc.constantFrom(...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'), { minLength: 5, maxLength: 5 }),
  fc.stringOf(fc.constantFrom(...'0123456789'), { minLength: 4, maxLength: 4 }),
  fc.constantFrom(...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'),
).map(([prefix, digits, suffix]) => prefix + digits + suffix);

// ── Assessment Year ──
export const assessmentYearArb = fc.integer({ min: 2021, max: 2030 })
  .map(y => `${y}-${String(y + 1).slice(2)}`);

// ── Deductions ──
export const deductionsArb = fc.record({
  ppf: fc.integer({ min: 0, max: 150000 }),
  elss: fc.integer({ min: 0, max: 150000 }),
  lic: fc.integer({ min: 0, max: 150000 }),
  nps: fc.integer({ min: 0, max: 50000 }),
  healthSelf: fc.integer({ min: 0, max: 50000 }),
  healthParents: fc.integer({ min: 0, max: 50000 }),
});

// ── Filing payload (simplified) ──
export const filingPayloadArb = fc.record({
  personalInfo: fc.record({
    employerCategory: fc.constantFrom('GOV', 'PSU', 'PVT', 'OTH', 'NA'),
    dob: fc.date({ min: new Date('1940-01-01'), max: new Date('2005-12-31') }).map(d => d.toISOString().slice(0, 10)),
  }),
  income: fc.record({
    salary: fc.record({
      employers: fc.array(fc.record({
        grossSalary: fc.integer({ min: 0, max: 50000000 }),
        basicPlusDA: fc.integer({ min: 0, max: 30000000 }),
        tdsDeducted: fc.integer({ min: 0, max: 10000000 }),
        allowances: fc.record({
          hra: fc.record({
            received: fc.integer({ min: 0, max: 500000 }),
            exempt: fc.integer({ min: 0, max: 500000 }),
          }),
        }),
        rentPaid: fc.integer({ min: 0, max: 1200000 }),
      }), { minLength: 0, maxLength: 3 }),
    }),
    otherSources: fc.record({
      savingsInterest: fc.integer({ min: 0, max: 500000 }),
      fdInterest: fc.integer({ min: 0, max: 500000 }),
    }),
  }),
  deductions: deductionsArb,
  selectedRegime: fc.constantFrom('old', 'new'),
});
