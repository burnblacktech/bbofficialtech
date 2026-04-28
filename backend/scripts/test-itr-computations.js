#!/usr/bin/env node
// =====================================================
// ITR Computation Services — Comprehensive Test Script
// Run: node backend/scripts/test-itr-computations.js
// No DB required — pure computation tests
// =====================================================

'use strict';

const ITR1 = require('../src/services/itr/ITR1ComputationService');
const ITR2 = require('../src/services/itr/ITR2ComputationService');
const ITR3 = require('../src/services/itr/ITR3ComputationService');
const ITR4 = require('../src/services/itr/ITR4ComputationService');

// ── Test harness ──

let passed = 0;
let failed = 0;
const failures = [];

function assert(condition, name) {
  if (condition) {
    passed++;
    console.log(`  ✅ PASS: ${name}`);
  } else {
    failed++;
    failures.push(name);
    console.log(`  ❌ FAIL: ${name}`);
  }
}

function assertEq(actual, expected, name) {
  if (actual === expected) {
    passed++;
    console.log(`  ✅ PASS: ${name}`);
  } else {
    failed++;
    failures.push(`${name} (got ${actual}, expected ${expected})`);
    console.log(`  ❌ FAIL: ${name} — got ${actual}, expected ${expected}`);
  }
}

function assertApprox(actual, expected, tolerance, name) {
  if (Math.abs(actual - expected) <= tolerance) {
    passed++;
    console.log(`  ✅ PASS: ${name}`);
  } else {
    failed++;
    failures.push(`${name} (got ${actual}, expected ~${expected} ±${tolerance})`);
    console.log(`  ❌ FAIL: ${name} — got ${actual}, expected ~${expected} ±${tolerance}`);
  }
}

function section(title) {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  ${title}`);
  console.log('═'.repeat(60));
}

// ── Helper: build a minimal payload ──

function basePayload(overrides = {}) {
  return {
    personalInfo: { pan: 'ABCDE1234F', name: 'Test User', employerCategory: 'OTH', ...overrides.personalInfo },
    income: { salary: { employers: [] }, ...overrides.income },
    deductions: overrides.deductions || {},
    bankDetails: { accountNumber: '1234567890', ifsc: 'SBIN0001234', ...overrides.bankDetails },
    taxes: overrides.taxes || {},
  };
}

function salaryEmployer(gross, opts = {}) {
  return {
    name: opts.name || 'Employer',
    grossSalary: gross,
    basicPlusDA: opts.basicPlusDA || Math.round(gross * 0.5),
    allowances: {
      hra: { exempt: opts.hraExempt || 0 },
      lta: { exempt: opts.ltaExempt || 0 },
      other: opts.otherExempt || 0,
    },
    deductions: { professionalTax: opts.professionalTax || 0 },
    tdsDeducted: opts.tds || 0,
    entertainmentAllowance: opts.entertainmentAllowance || 0,
    gratuityReceived: opts.gratuity || 0,
    leaveEncashmentReceived: opts.leaveEncashment || 0,
    commutedPensionReceived: opts.commutedPension || 0,
  };
}

// ════════════════════════════════════════════════════════
//  1. ITR-1 TESTS
// ════════════════════════════════════════════════════════

section('1. ITR-1: Salary Only');
{
  const payload = basePayload({
    income: { salary: { employers: [salaryEmployer(1000000, { tds: 50000 })] } },
  });
  const r = ITR1.compute(payload);
  assert(r.income.salary.grossSalary === 1000000, 'ITR1 salary gross = 10L');
  assert(r.income.salary.standardDeduction === 75000, 'ITR1 standard deduction = 75K');
  assert(r.income.grossTotal > 0, 'ITR1 grossTotal > 0');
  assert(r.oldRegime.totalTax >= 0, 'ITR1 old regime tax computed');
  assert(r.newRegime.totalTax >= 0, 'ITR1 new regime tax computed');
  assert(r.recommended === 'old' || r.recommended === 'new', 'ITR1 recommendation present');
  assert(typeof r.savings === 'number', 'ITR1 savings is a number');
  assert(r.tds.fromSalary === 50000, 'ITR1 TDS from salary = 50K');
  assert(r.tds.total === 50000, 'ITR1 TDS total = 50K');
  // Net taxable salary = 1000000 - 75000 = 925000
  assertEq(r.income.salary.netTaxable, 925000, 'ITR1 net taxable salary = 9.25L');
}

section('1b. ITR-1: Salary + House Property (Self-Occupied)');
{
  const payload = basePayload({
    income: {
      salary: { employers: [salaryEmployer(800000)] },
      houseProperty: { type: 'selfOccupied', interestOnHomeLoan: 180000 },
    },
  });
  const r = ITR1.compute(payload);
  assertEq(r.income.houseProperty.type, 'SELF_OCCUPIED', 'ITR1 HP type normalized');
  assertEq(r.income.houseProperty.netIncome, -180000, 'ITR1 HP loss = -1.8L');
  // Gross = (800000 - 75000) + (-180000) = 545000
  assertEq(r.income.grossTotal, 545000, 'ITR1 salary+HP gross total');
}

section('1c. ITR-1: Salary + Other Income');
{
  const payload = basePayload({
    income: {
      salary: { employers: [salaryEmployer(600000)] },
      otherSources: { savingsInterest: 15000, fdInterest: 30000, dividendIncome: 10000 },
    },
  });
  const r = ITR1.compute(payload);
  assertEq(r.income.otherSources.savingsInterest, 15000, 'ITR1 savings interest');
  assertEq(r.income.otherSources.fdInterest, 30000, 'ITR1 FD interest');
  assertEq(r.income.otherSources.dividends, 10000, 'ITR1 dividends');
  assertEq(r.income.otherSources.total, 55000, 'ITR1 other income total = 55K');
}

section('1d. ITR-1: Salary + Let-Out Property');
{
  const payload = basePayload({
    income: {
      salary: { employers: [salaryEmployer(500000)] },
      houseProperty: { type: 'letOut', annualRentReceived: 240000, municipalTaxesPaid: 10000, interestOnHomeLoan: 50000 },
    },
  });
  const r = ITR1.compute(payload);
  // NAV = 240000 - 10000 = 230000, stdDed = 69000, net = 230000 - 69000 - 50000 = 111000
  assertEq(r.income.houseProperty.netAnnualValue, 230000, 'ITR1 let-out NAV');
  assertEq(r.income.houseProperty.standardDeduction30, 69000, 'ITR1 let-out 30% std ded');
  assertEq(r.income.houseProperty.netIncome, 111000, 'ITR1 let-out net income');
}

// ════════════════════════════════════════════════════════
//  2. ITR-2 TESTS
// ════════════════════════════════════════════════════════

section('2. ITR-2: Capital Gains');
{
  const payload = basePayload({
    income: {
      salary: { employers: [salaryEmployer(800000)] },
      capitalGains: {
        transactions: [
          { gainType: 'STCG', assetType: 'equity', saleValue: 500000, purchaseValue: 300000, expenses: 5000 },
          { gainType: 'LTCG', assetType: 'equity', saleValue: 1000000, purchaseValue: 600000, expenses: 10000 },
          { gainType: 'LTCG', assetType: 'property', saleValue: 5000000, indexedCost: 3500000, expenses: 50000 },
        ],
      },
    },
  });
  const r = ITR2.compute(payload);
  // STCG equity = 500000 - 300000 - 5000 = 195000
  assertEq(r.income.capitalGains.stcg.equity, 195000, 'ITR2 STCG equity = 1.95L');
  // LTCG equity = 1000000 - 600000 - 10000 = 390000
  assertEq(r.income.capitalGains.ltcg.equity, 390000, 'ITR2 LTCG equity = 3.9L');
  // LTCG property = 5000000 - 3500000 - 50000 = 1450000
  assertEq(r.income.capitalGains.ltcg.property, 1450000, 'ITR2 LTCG property = 14.5L');
  assert(r.income.capitalGains.totalTaxable > 0, 'ITR2 total CG taxable > 0');
  assert(r.oldRegime.stcgEquityTax > 0, 'ITR2 STCG equity taxed at special rate');
  assert(r.oldRegime.ltcgOtherTax > 0, 'ITR2 LTCG other taxed at special rate');
}

section('2b. ITR-2: Foreign Income');
{
  const payload = basePayload({
    income: {
      salary: { employers: [salaryEmployer(1200000)] },
      foreignIncome: {
        incomes: [
          { country: 'US', incomeType: 'salary', amountINR: 500000, taxPaidAbroad: 80000, dtaaApplicable: true },
          { country: 'UK', incomeType: 'dividend', amountINR: 100000, taxPaidAbroad: 15000, dtaa: true },
        ],
      },
    },
  });
  const r = ITR2.compute(payload);
  assertEq(r.income.foreignIncome.totalIncome, 600000, 'ITR2 foreign income total = 6L');
  assertEq(r.income.foreignIncome.totalTaxPaidAbroad, 95000, 'ITR2 foreign tax paid = 95K');
  assert(r.foreignTaxCredit.credit > 0, 'ITR2 foreign tax credit > 0');
  assert(r.oldRegime.foreignTaxCredit > 0, 'ITR2 FTC applied to old regime');
}

section('2c. ITR-2: Multiple House Properties');
{
  const payload = basePayload({
    income: {
      salary: { employers: [salaryEmployer(600000)] },
      houseProperty: {
        properties: [
          { type: 'selfOccupied', interestOnHomeLoan: 200000 },
          { type: 'letOut', annualRentReceived: 360000, municipalTaxesPaid: 20000, interestOnHomeLoan: 100000 },
        ],
      },
    },
  });
  const r = ITR2.compute(payload);
  assert(r.income.houseProperty.properties.length === 2, 'ITR2 two properties computed');
  assertEq(r.income.houseProperty.properties[0].netIncome, -200000, 'ITR2 self-occupied HP loss = -2L');
  // Let-out: NAV = 360000-20000=340000, stdDed=102000, net=340000-102000-100000=138000
  assertEq(r.income.houseProperty.properties[1].netIncome, 138000, 'ITR2 let-out HP income');
  // Total = -200000 + 138000 = -62000
  assertEq(r.income.houseProperty.totalIncome, -62000, 'ITR2 total HP income = -62K');
}

// ════════════════════════════════════════════════════════
//  3. ITR-3 TESTS
// ════════════════════════════════════════════════════════

section('3. ITR-3: Business Income with P&L');
{
  const payload = basePayload({
    income: {
      salary: { employers: [] },
      business: {
        businesses: [
          {
            name: 'Tech Consulting',
            natureOfBusiness: 'IT Services',
            turnover: 5000000,
            grossProfit: 2000000,
            depreciation: 100000,
            expenses: { rent: 120000, salary: 500000, interest: 50000, utilities: 30000, travel: 40000, other: 60000 },
          },
        ],
      },
    },
  });
  const r = ITR3.compute(payload);
  assertEq(r.income.business.totalTurnover, 5000000, 'ITR3 turnover = 50L');
  assertEq(r.income.business.totalGrossProfit, 2000000, 'ITR3 gross profit = 20L');
  // Expenses = 120000+500000+50000+30000+40000+60000 = 800000
  assertEq(r.income.business.totalExpenses, 800000, 'ITR3 total expenses = 8L');
  assertEq(r.income.business.totalDepreciation, 100000, 'ITR3 depreciation = 1L');
  // Net profit = 2000000 - 800000 - 100000 = 1100000
  assertEq(r.income.business.netProfit, 1100000, 'ITR3 net profit = 11L');
  assert(r.oldRegime.totalTax > 0, 'ITR3 old regime tax > 0');
  assert(r.newRegime.totalTax > 0, 'ITR3 new regime tax > 0');
}

section('3b. ITR-3: Business + Capital Gains + Salary');
{
  const payload = basePayload({
    income: {
      salary: { employers: [salaryEmployer(500000)] },
      business: {
        businesses: [{ name: 'Shop', turnover: 2000000, grossProfit: 800000, depreciation: 50000, expenses: { rent: 60000, other: 40000 } }],
      },
      capitalGains: {
        transactions: [{ gainType: 'STCG', assetType: 'other', saleValue: 300000, purchaseValue: 200000, expenses: 5000 }],
      },
    },
  });
  const r = ITR3.compute(payload);
  assert(r.income.business.netProfit > 0, 'ITR3 business net profit > 0');
  assert(r.income.capitalGains.totalTaxable > 0, 'ITR3 capital gains > 0');
  assert(r.income.salary.netTaxable > 0, 'ITR3 salary income > 0');
  assert(r.income.grossTotal > 0, 'ITR3 combined gross total > 0');
}

section('3c. ITR-3: Audit Requirement Check');
{
  const payload = basePayload({
    income: {
      business: {
        businesses: [{ name: 'Big Biz', turnover: 15000000, grossProfit: 5000000, depreciation: 200000, expenses: {} }],
      },
    },
  });
  const r = ITR3.compute(payload);
  assert(r.income.business.auditRequired === true, 'ITR3 audit required for turnover > 1Cr');
}

// ════════════════════════════════════════════════════════
//  4. ITR-4 TESTS
// ════════════════════════════════════════════════════════

section('4. ITR-4: Presumptive 44AD (Cash)');
{
  const payload = basePayload({
    income: {
      presumptive: {
        entries: [{ section: '44AD', businessName: 'Retail Shop', grossReceipts: 5000000, digitalReceipts: false }],
      },
    },
  });
  const r = ITR4.compute(payload);
  // 44AD cash: 8% of 50L = 400000
  assertEq(r.income.presumptive.totalIncome, 400000, 'ITR4 44AD cash income = 4L (8%)');
  assertEq(r.income.presumptive.entries[0].rate, 8, 'ITR4 44AD cash rate = 8%');
}

section('4b. ITR-4: Presumptive 44AD (Digital)');
{
  const payload = basePayload({
    income: {
      presumptive: {
        entries: [{ section: '44AD', businessName: 'Online Shop', grossReceipts: 5000000, digitalReceipts: true }],
      },
    },
  });
  const r = ITR4.compute(payload);
  // 44AD digital: 6% of 50L = 300000
  assertEq(r.income.presumptive.totalIncome, 300000, 'ITR4 44AD digital income = 3L (6%)');
  assertEq(r.income.presumptive.entries[0].rate, 6, 'ITR4 44AD digital rate = 6%');
}

section('4c. ITR-4: Presumptive 44ADA (Profession)');
{
  const payload = basePayload({
    income: {
      presumptive: {
        entries: [{ section: '44ADA', businessName: 'CA Practice', grossReceipts: 4000000 }],
      },
    },
  });
  const r = ITR4.compute(payload);
  // 44ADA: 50% of 40L = 2000000
  assertEq(r.income.presumptive.totalIncome, 2000000, 'ITR4 44ADA income = 20L (50%)');
  assertEq(r.income.presumptive.entries[0].rate, 50, 'ITR4 44ADA rate = 50%');
}

section('4d. ITR-4: Presumptive 44AE (Goods Carriage)');
{
  const payload = basePayload({
    income: {
      presumptive: {
        entries: [{ section: '44AE', businessName: 'Transport Co', vehicles: 5, monthsOwned: 10 }],
      },
    },
  });
  const r = ITR4.compute(payload);
  // 44AE: 5 vehicles × ₹7500 × 10 months = 375000
  assertEq(r.income.presumptive.totalIncome, 375000, 'ITR4 44AE income = 3.75L');
}

section('4e. ITR-4: Presumptive + Salary');
{
  const payload = basePayload({
    income: {
      salary: { employers: [salaryEmployer(400000)] },
      presumptive: {
        entries: [{ section: '44AD', businessName: 'Side Biz', grossReceipts: 2000000, digitalReceipts: false }],
      },
    },
  });
  const r = ITR4.compute(payload);
  // Salary net = 400000 - 75000 = 325000, Presumptive = 160000
  assert(r.income.salary.netTaxable === 325000, 'ITR4 salary net = 3.25L');
  assert(r.income.presumptive.totalIncome === 160000, 'ITR4 presumptive = 1.6L');
  assertEq(r.income.grossTotal, 485000, 'ITR4 combined gross = 4.85L');
}

// ════════════════════════════════════════════════════════
//  5. ITR TYPE SWITCHING
// ════════════════════════════════════════════════════════

section('5. ITR Type Switching: Add CG → ITR-2, Remove → ITR-1');
{
  // Start with ITR-1 payload
  const itr1Payload = basePayload({
    income: { salary: { employers: [salaryEmployer(800000)] } },
  });
  const r1 = ITR1.compute(itr1Payload);
  assert(r1.income.grossTotal > 0, 'Switch: ITR-1 computes fine');

  // Add capital gains → should compute as ITR-2
  const itr2Payload = basePayload({
    income: {
      salary: { employers: [salaryEmployer(800000)] },
      capitalGains: {
        transactions: [{ gainType: 'STCG', assetType: 'equity', saleValue: 200000, purchaseValue: 150000, expenses: 1000 }],
      },
    },
  });
  const r2 = ITR2.compute(itr2Payload);
  assert(r2.income.capitalGains.totalTaxable > 0, 'Switch: ITR-2 has CG income');
  assert(r2.income.grossTotal > r1.income.grossTotal, 'Switch: ITR-2 gross > ITR-1 gross (CG added)');

  // Remove capital gains → back to ITR-1
  const backToItr1 = basePayload({
    income: { salary: { employers: [salaryEmployer(800000)] } },
  });
  const r3 = ITR1.compute(backToItr1);
  assertEq(r3.income.grossTotal, r1.income.grossTotal, 'Switch: back to ITR-1 same gross');
}

// ════════════════════════════════════════════════════════
//  6. EDGE CASES
// ════════════════════════════════════════════════════════

section('6a. Edge: Income exactly at ₹50L (ITR-1 limit)');
{
  // Need gross total = 5000000. Net taxable salary = gross - 75000 std ded.
  // So gross salary = 5075000 to get net = 5000000
  const payload = basePayload({
    income: { salary: { employers: [salaryEmployer(5075000)] } },
  });
  const r = ITR1.compute(payload);
  assertEq(r.income.grossTotal, 5000000, 'Edge: gross total exactly 50L');
  assert(r.oldRegime.totalTax > 0, 'Edge: 50L tax computed');
  // Surcharge should be 0 at exactly 50L (threshold is > 50L)
  assertEq(r.oldRegime.surchargeRate, 0, 'Edge: no surcharge at exactly 50L');
}

section('6b. Edge: Income at ₹50,00,001 (exceeds ITR-1)');
{
  const payload = basePayload({
    income: { salary: { employers: [salaryEmployer(5075001)] } },
  });
  const r = ITR1.compute(payload);
  assertEq(r.income.grossTotal, 5000001, 'Edge: gross total = 50L+1');
  // Surcharge kicks in at > 50L
  assertEq(r.oldRegime.surchargeRate, 10, 'Edge: 10% surcharge at 50L+1');
}

section('6c. Edge: 80C at exactly ₹1,50,000 (cap)');
{
  const payload = basePayload({
    income: { salary: { employers: [salaryEmployer(1000000)] } },
    deductions: { section80C: { ppf: 100000, elss: 50000 } },
  });
  const r = ITR1.compute(payload);
  assertEq(r.oldRegime.deductionBreakdown.section80C, 150000, 'Edge: 80C at cap = 1.5L');
}

section('6d. Edge: 80C at ₹2,00,000 (over cap — should be capped)');
{
  const payload = basePayload({
    income: { salary: { employers: [salaryEmployer(1000000)] } },
    deductions: { section80C: { ppf: 120000, elss: 80000 } },
  });
  const r = ITR1.compute(payload);
  assertEq(r.oldRegime.deductionBreakdown.section80C, 150000, 'Edge: 80C capped at 1.5L (not 2L)');
  assert(r.oldRegime.deductions === 150000, 'Edge: total deductions = 1.5L (capped)');
}

section('6e. Edge: HRA Exemption — Metro vs Non-Metro');
{
  // Metro: HRA exempt is passed through from employer data
  const metroPayload = basePayload({
    income: { salary: { employers: [salaryEmployer(800000, { hraExempt: 120000 })] } },
  });
  const rMetro = ITR1.compute(metroPayload);
  assertEq(rMetro.income.salary.exemptAllowances, 120000, 'Edge: metro HRA exempt = 1.2L');

  // Non-metro: lower HRA exempt
  const nonMetroPayload = basePayload({
    income: { salary: { employers: [salaryEmployer(800000, { hraExempt: 80000 })] } },
  });
  const rNonMetro = ITR1.compute(nonMetroPayload);
  assertEq(rNonMetro.income.salary.exemptAllowances, 80000, 'Edge: non-metro HRA exempt = 80K');
  assert(rMetro.income.salary.netTaxable < rNonMetro.income.salary.netTaxable, 'Edge: metro HRA → lower taxable');
}

section('6f. Edge: Agricultural Income Partial Integration (agri > ₹5000)');
{
  const payload = basePayload({
    income: {
      salary: { employers: [salaryEmployer(800000)] },
      agriculturalIncome: 100000,
    },
  });
  const r = ITR1.compute(payload);
  assertEq(r.agriculturalIncome, 100000, 'Edge: agri income = 1L');
  assert(r.oldRegime.agriIntegrationApplied === true, 'Edge: agri integration applied (old)');
  assert(r.newRegime.agriIntegrationApplied === true, 'Edge: agri integration applied (new)');
  // Agricultural income should increase tax via partial integration
  const noAgriPayload = basePayload({
    income: { salary: { employers: [salaryEmployer(800000)] } },
  });
  const rNoAgri = ITR1.compute(noAgriPayload);
  assert(r.oldRegime.totalTax >= rNoAgri.oldRegime.totalTax, 'Edge: agri integration increases or equals tax');
}

section('6f2. Edge: Agricultural Income ≤ ₹5000 (no integration)');
{
  const payload = basePayload({
    income: {
      salary: { employers: [salaryEmployer(800000)] },
      agriculturalIncome: 4000,
    },
  });
  const r = ITR1.compute(payload);
  assert(r.oldRegime.agriIntegrationApplied === false, 'Edge: no agri integration when ≤ 5K');
}

section('6g. Edge: VDA/Crypto Income (flat 30% tax)');
{
  const payload = basePayload({
    income: {
      salary: { employers: [salaryEmployer(600000)] },
      otherSources: { vdaSaleValue: 500000, vdaCostOfAcquisition: 200000 },
    },
  });
  const r = ITR1.compute(payload);
  // VDA gain = 500000 - 200000 = 300000, tax = 300000 * 30% = 90000
  assertEq(r.income.otherSources.vdaGain, 300000, 'Edge: VDA gain = 3L');
  assertEq(r.income.otherSources.vdaTax, 90000, 'Edge: VDA tax = 90K (flat 30%)');
  // VDA tax should be included in both regimes
  assert(r.oldRegime.vdaTax === 90000, 'Edge: VDA tax in old regime');
  assert(r.newRegime.vdaTax === 90000, 'Edge: VDA tax in new regime');
}

section('6h. Edge: Zero Income (should not crash)');
{
  const payload = basePayload({});
  const r1 = ITR1.compute(payload);
  assert(r1.income.grossTotal === 0, 'Edge: ITR1 zero income gross = 0');
  assertEq(r1.oldRegime.totalTax, 0, 'Edge: ITR1 zero income old tax = 0');
  assertEq(r1.newRegime.totalTax, 0, 'Edge: ITR1 zero income new tax = 0');

  const r2 = ITR2.compute(payload);
  assert(r2.income.grossTotal === 0, 'Edge: ITR2 zero income gross = 0');
  assertEq(r2.oldRegime.totalTax, 0, 'Edge: ITR2 zero income old tax = 0');

  const r3 = ITR3.compute(payload);
  assert(r3.income.grossTotal === 0, 'Edge: ITR3 zero income gross = 0');
  assertEq(r3.oldRegime.totalTax, 0, 'Edge: ITR3 zero income old tax = 0');

  const r4 = ITR4.compute(payload);
  assert(r4.income.grossTotal === 0, 'Edge: ITR4 zero income gross = 0');
  assertEq(r4.oldRegime.totalTax, 0, 'Edge: ITR4 zero income old tax = 0');
}

section('6h2. Edge: Null/Undefined Payload (should not crash)');
{
  const r1 = ITR1.compute(null);
  assert(r1.income.grossTotal === 0, 'Edge: ITR1 null payload → gross = 0');
  const r2 = ITR2.compute(undefined);
  assert(r2.income.grossTotal === 0, 'Edge: ITR2 undefined payload → gross = 0');
  const r3 = ITR3.compute(null);
  assert(r3.income.grossTotal === 0, 'Edge: ITR3 null payload → gross = 0');
  const r4 = ITR4.compute(undefined);
  assert(r4.income.grossTotal === 0, 'Edge: ITR4 undefined payload → gross = 0');
}

section('6i. Edge: Negative HP Income — Loss Capped at ₹2L (ITR-2)');
{
  const payload = basePayload({
    income: {
      salary: { employers: [salaryEmployer(1000000)] },
      houseProperty: {
        properties: [
          { type: 'selfOccupied', interestOnHomeLoan: 200000 },
          { type: 'letOut', annualRentReceived: 100000, municipalTaxesPaid: 5000, interestOnHomeLoan: 400000 },
        ],
      },
    },
  });
  const r = ITR2.compute(payload);
  // Self-occupied: net = -200000
  // Let-out: NAV = 95000, stdDed = 28500, net = 95000 - 28500 - 400000 = -333500
  // Total = -200000 + (-333500) = -533500
  // Capped at -200000 for set-off
  assertEq(r.income.houseProperty.adjustedIncome, -200000, 'Edge: HP loss capped at -2L');
  assertEq(r.income.houseProperty.netIncome, -200000, 'Edge: HP netIncome = -2L (capped)');
  // Carry forward = -533500 - (-200000) = -333500
  assertEq(r.income.houseProperty.carryForwardLoss, -333500, 'Edge: HP carry forward loss');
}

section('6j. Edge: New Regime vs Old Regime Comparison');
{
  // High deductions → old regime should be better
  const highDedPayload = basePayload({
    income: { salary: { employers: [salaryEmployer(1500000)] } },
    deductions: {
      section80C: { ppf: 150000 },
      section80D: { selfPremium: 25000 },
      section80E: { educationLoanInterest: 50000 },
    },
  });
  const rHigh = ITR1.compute(highDedPayload);
  assert(rHigh.oldRegime.deductions > 0, 'Edge: old regime has deductions');
  assertEq(rHigh.newRegime.deductions, 0, 'Edge: new regime has 0 deductions');
  assert(rHigh.oldRegime.taxableIncome < rHigh.newRegime.taxableIncome, 'Edge: old regime taxable < new regime taxable');

  // Low deductions → new regime should be better (lower slab rates)
  const lowDedPayload = basePayload({
    income: { salary: { employers: [salaryEmployer(1500000)] } },
    deductions: {},
  });
  const rLow = ITR1.compute(lowDedPayload);
  assert(rLow.recommended === 'new', 'Edge: new regime recommended with no deductions');
}

section('6k. Edge: Senior Citizen 80TTB (₹50K limit vs 80TTA ₹10K)');
{
  // Senior citizen: 80TTB up to ₹50K
  const seniorPayload = basePayload({
    income: { salary: { employers: [salaryEmployer(800000)] } },
    deductions: { isSeniorCitizen: true, savingsInt: 45000 },
  });
  const rSenior = ITR1.compute(seniorPayload);
  assertEq(rSenior.oldRegime.deductionBreakdown.section80TTB, 45000, 'Edge: senior 80TTB = 45K');
  assertEq(rSenior.oldRegime.deductionBreakdown.section80TTA, 0, 'Edge: senior 80TTA = 0 (mutually exclusive)');

  // Non-senior: 80TTA up to ₹10K
  const nonSeniorPayload = basePayload({
    income: { salary: { employers: [salaryEmployer(800000)] } },
    deductions: { isSeniorCitizen: false, savingsInt: 45000 },
  });
  const rNonSenior = ITR1.compute(nonSeniorPayload);
  assertEq(rNonSenior.oldRegime.deductionBreakdown.section80TTA, 10000, 'Edge: non-senior 80TTA capped at 10K');
  assertEq(rNonSenior.oldRegime.deductionBreakdown.section80TTB, 0, 'Edge: non-senior 80TTB = 0');
}

section('6k2. Edge: Senior 80TTB at cap (₹50K)');
{
  const payload = basePayload({
    income: { salary: { employers: [salaryEmployer(800000)] } },
    deductions: { isSeniorCitizen: true, savingsInt: 80000 },
  });
  const r = ITR1.compute(payload);
  assertEq(r.oldRegime.deductionBreakdown.section80TTB, 50000, 'Edge: 80TTB capped at 50K');
}

section('6l. Edge: Rebate 87A Eligibility');
{
  // Old regime: income ≤ ₹5L → rebate up to ₹12,500
  const oldPayload = basePayload({
    income: { salary: { employers: [salaryEmployer(575000)] } },
    // Net taxable = 575000 - 75000 = 500000 = exactly 5L
  });
  const rOld = ITR1.compute(oldPayload);
  assertEq(rOld.income.grossTotal, 500000, 'Edge: rebate old gross = 5L');
  assert(rOld.oldRegime.rebate > 0, 'Edge: old regime rebate applied at 5L');
  // Tax on 5L old = 5% of (500000-250000) = 12500, rebate = 12500 → net tax = 0
  assertEq(rOld.oldRegime.rebate, 12500, 'Edge: old regime rebate = 12500');
  assertEq(rOld.oldRegime.totalTax, 0, 'Edge: old regime total tax = 0 after rebate');

  // New regime: income ≤ ₹7L → rebate up to ₹25,000
  const newPayload = basePayload({
    income: { salary: { employers: [salaryEmployer(775000)] } },
    // Net taxable = 775000 - 75000 = 700000 = exactly 7L
  });
  const rNew = ITR1.compute(newPayload);
  assertEq(rNew.income.grossTotal, 700000, 'Edge: rebate new gross = 7L');
  assert(rNew.newRegime.rebate > 0, 'Edge: new regime rebate applied at 7L');
  // Tax on 7L new = 5% of (700000-300000) = 20000, rebate = 20000 → net tax = 0
  assertEq(rNew.newRegime.rebate, 20000, 'Edge: new regime rebate = 20000');
  assertEq(rNew.newRegime.totalTax, 0, 'Edge: new regime total tax = 0 after rebate');

  // Above rebate limit: income = 7L+1 → no rebate in new regime
  const overPayload = basePayload({
    income: { salary: { employers: [salaryEmployer(775001)] } },
  });
  const rOver = ITR1.compute(overPayload);
  assertEq(rOver.newRegime.rebate, 0, 'Edge: no new regime rebate at 7L+1');
  assert(rOver.newRegime.totalTax > 0, 'Edge: new regime tax > 0 at 7L+1');
}

section('6m. Edge: Surcharge Thresholds');
{
  // ₹50L: no surcharge
  const p50L = basePayload({ income: { salary: { employers: [salaryEmployer(5075000)] } } });
  const r50L = ITR1.compute(p50L);
  assertEq(r50L.oldRegime.surchargeRate, 0, 'Edge: surcharge 0% at 50L');

  // ₹50L+1: 10% surcharge
  const p50L1 = basePayload({ income: { salary: { employers: [salaryEmployer(5075001)] } } });
  const r50L1 = ITR1.compute(p50L1);
  assertEq(r50L1.oldRegime.surchargeRate, 10, 'Edge: surcharge 10% at >50L');

  // ₹1Cr+1: 15% surcharge (use ITR-2 since ITR-1 has 50L limit)
  const p1Cr = basePayload({
    income: {
      salary: { employers: [salaryEmployer(5000000)] },
      capitalGains: {
        transactions: [{ gainType: 'STCG', assetType: 'other', saleValue: 6075001, purchaseValue: 0, expenses: 0 }],
      },
    },
  });
  const r1Cr = ITR2.compute(p1Cr);
  assert(r1Cr.income.grossTotal > 10000000, 'Edge: gross > 1Cr for surcharge test');
  assertEq(r1Cr.oldRegime.surchargeRate, 15, 'Edge: surcharge 15% at >1Cr');

  // ₹2Cr+: 25% surcharge
  const p2Cr = basePayload({
    income: {
      salary: { employers: [salaryEmployer(5000000)] },
      capitalGains: {
        transactions: [{ gainType: 'STCG', assetType: 'other', saleValue: 16075001, purchaseValue: 0, expenses: 0 }],
      },
    },
  });
  const r2Cr = ITR2.compute(p2Cr);
  assert(r2Cr.income.grossTotal > 20000000, 'Edge: gross > 2Cr for surcharge test');
  assertEq(r2Cr.oldRegime.surchargeRate, 25, 'Edge: surcharge 25% at >2Cr');

  // ₹5Cr+: 37% surcharge
  const p5Cr = basePayload({
    income: {
      salary: { employers: [salaryEmployer(5000000)] },
      capitalGains: {
        transactions: [{ gainType: 'STCG', assetType: 'other', saleValue: 46075001, purchaseValue: 0, expenses: 0 }],
      },
    },
  });
  const r5Cr = ITR2.compute(p5Cr);
  assert(r5Cr.income.grossTotal > 50000000, 'Edge: gross > 5Cr for surcharge test');
  assertEq(r5Cr.oldRegime.surchargeRate, 37, 'Edge: surcharge 37% at >5Cr');
}

// ════════════════════════════════════════════════════════
//  ADDITIONAL: Both Regimes for Each ITR Type
// ════════════════════════════════════════════════════════

section('7. Both Regimes: ITR-1 with Deductions');
{
  const payload = basePayload({
    income: { salary: { employers: [salaryEmployer(1200000)] } },
    deductions: { section80C: { ppf: 100000, elss: 50000 }, section80D: { selfPremium: 20000 } },
  });
  const r = ITR1.compute(payload);
  assert(r.oldRegime.deductions > 0, 'Both: ITR1 old has deductions');
  assertEq(r.newRegime.deductions, 0, 'Both: ITR1 new has 0 deductions');
  assert(r.oldRegime.taxableIncome < r.newRegime.taxableIncome, 'Both: ITR1 old taxable < new taxable');
}

section('7b. Both Regimes: ITR-2 with CG');
{
  const payload = basePayload({
    income: {
      salary: { employers: [salaryEmployer(1000000)] },
      capitalGains: {
        transactions: [{ gainType: 'LTCG', assetType: 'equity', saleValue: 500000, purchaseValue: 200000, expenses: 5000 }],
      },
    },
    deductions: { section80C: { ppf: 150000 } },
  });
  const r = ITR2.compute(payload);
  assert(r.oldRegime.deductions > 0, 'Both: ITR2 old has deductions');
  assertEq(r.newRegime.deductions, 0, 'Both: ITR2 new has 0 deductions');
  assert(r.oldRegime.totalTax >= 0, 'Both: ITR2 old tax ≥ 0');
  assert(r.newRegime.totalTax >= 0, 'Both: ITR2 new tax ≥ 0');
}

section('7c. Both Regimes: ITR-3 with Business');
{
  const payload = basePayload({
    income: {
      business: {
        businesses: [{ name: 'Biz', turnover: 3000000, grossProfit: 1200000, depreciation: 50000, expenses: { rent: 60000, salary: 200000 } }],
      },
    },
    deductions: { section80C: { ppf: 100000 } },
  });
  const r = ITR3.compute(payload);
  assert(r.oldRegime.deductions > 0, 'Both: ITR3 old has deductions');
  assertEq(r.newRegime.deductions, 0, 'Both: ITR3 new has 0 deductions');
}

section('7d. Both Regimes: ITR-4 Presumptive');
{
  const payload = basePayload({
    income: {
      presumptive: {
        entries: [{ section: '44AD', businessName: 'Shop', grossReceipts: 8000000, digitalReceipts: false }],
      },
    },
    deductions: { section80C: { ppf: 150000 } },
  });
  const r = ITR4.compute(payload);
  // 44AD: 8% of 80L = 640000
  assertEq(r.income.presumptive.totalIncome, 640000, 'Both: ITR4 presumptive = 6.4L');
  assert(r.oldRegime.deductions > 0, 'Both: ITR4 old has deductions');
  assertEq(r.newRegime.deductions, 0, 'Both: ITR4 new has 0 deductions');
}

// ════════════════════════════════════════════════════════
//  ADDITIONAL: Family Pension Exemption
// ════════════════════════════════════════════════════════

section('8. Family Pension Exemption (1/3 or ₹15K whichever is less)');
{
  // Low pension: 1/3 of 30000 = 10000 < 15000 → exempt = 10000
  const lowPayload = basePayload({
    income: {
      salary: { employers: [salaryEmployer(500000)] },
      otherSources: { familyPension: 30000 },
    },
  });
  const rLow = ITR1.compute(lowPayload);
  assertEq(rLow.income.otherSources.familyPensionExempt, 10000, 'FP: low pension exempt = 10K');

  // High pension: 1/3 of 60000 = 20000 > 15000 → exempt = 15000
  const highPayload = basePayload({
    income: {
      salary: { employers: [salaryEmployer(500000)] },
      otherSources: { familyPension: 60000 },
    },
  });
  const rHigh = ITR1.compute(highPayload);
  assertEq(rHigh.income.otherSources.familyPensionExempt, 15000, 'FP: high pension exempt capped at 15K');
}

// ════════════════════════════════════════════════════════
//  ADDITIONAL: TDS Computation
// ════════════════════════════════════════════════════════

section('9. TDS Computation');
{
  const payload = basePayload({
    income: { salary: { employers: [salaryEmployer(1000000, { tds: 80000 })] } },
    taxes: {
      tds: { fromFD: 5000, fromOther: 3000, fromVDA: 10000 },
      advanceTax: 20000,
      selfAssessmentTax: 5000,
    },
  });
  const r = ITR1.compute(payload);
  assertEq(r.tds.fromSalary, 80000, 'TDS: from salary = 80K');
  assertEq(r.tds.fromFD, 5000, 'TDS: from FD = 5K');
  assertEq(r.tds.fromOther, 3000, 'TDS: from other = 3K');
  assertEq(r.tds.fromVDA, 10000, 'TDS: from VDA = 10K');
  assertEq(r.tds.advanceTax, 20000, 'TDS: advance tax = 20K');
  assertEq(r.tds.selfAssessment, 5000, 'TDS: self assessment = 5K');
  assertEq(r.tds.total, 123000, 'TDS: total = 1.23L');
}

// ════════════════════════════════════════════════════════
//  ADDITIONAL: Net Payable (tax - TDS)
// ════════════════════════════════════════════════════════

section('10. Net Payable / Refund');
{
  // High TDS → refund
  const refundPayload = basePayload({
    income: { salary: { employers: [salaryEmployer(600000, { tds: 200000 })] } },
  });
  const rRefund = ITR1.compute(refundPayload);
  assert(rRefund.oldRegime.netPayable < 0, 'NetPay: refund when TDS > tax (old)');
  assert(rRefund.newRegime.netPayable < 0, 'NetPay: refund when TDS > tax (new)');

  // Low TDS → payable
  const payablePayload = basePayload({
    income: { salary: { employers: [salaryEmployer(2000000, { tds: 10000 })] } },
  });
  const rPayable = ITR1.compute(payablePayload);
  assert(rPayable.oldRegime.netPayable > 0, 'NetPay: payable when TDS < tax (old)');
  assert(rPayable.newRegime.netPayable > 0, 'NetPay: payable when TDS < tax (new)');
}

// ════════════════════════════════════════════════════════
//  ADDITIONAL: VDA with Zero Gain
// ════════════════════════════════════════════════════════

section('11. VDA: Zero/Negative Gain');
{
  // Cost > sale → gain = 0 (clamped)
  const payload = basePayload({
    income: {
      salary: { employers: [salaryEmployer(500000)] },
      otherSources: { vdaSaleValue: 100000, vdaCostOfAcquisition: 200000 },
    },
  });
  const r = ITR1.compute(payload);
  assertEq(r.income.otherSources.vdaGain, 0, 'VDA: negative gain clamped to 0');
  assertEq(r.income.otherSources.vdaTax, 0, 'VDA: no tax on zero gain');
}

// ════════════════════════════════════════════════════════
//  ADDITIONAL: 44AD Declared Income Higher Than Minimum
// ════════════════════════════════════════════════════════

section('12. ITR-4: 44AD Declared Income > Minimum');
{
  const payload = basePayload({
    income: {
      presumptive: {
        entries: [{ section: '44AD', businessName: 'Shop', grossReceipts: 1000000, digitalReceipts: false, declaredIncome: 200000 }],
      },
    },
  });
  const r = ITR4.compute(payload);
  // Min = 8% of 10L = 80000, declared = 200000 → use 200000
  assertEq(r.income.presumptive.totalIncome, 200000, 'ITR4: declared income > minimum used');
}

// ════════════════════════════════════════════════════════
//  SUMMARY
// ════════════════════════════════════════════════════════

console.log('\n' + '═'.repeat(60));
console.log(`  SUMMARY: ${passed} passed, ${failed} failed`);
console.log('═'.repeat(60));

if (failures.length > 0) {
  console.log('\nFailed tests:');
  for (const f of failures) {
    console.log(`  ❌ ${f}`);
  }
}

console.log('');
process.exit(failed > 0 ? 1 : 0);
