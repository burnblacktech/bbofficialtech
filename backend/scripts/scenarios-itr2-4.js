/**
 * ITR-2 and ITR-4 Test Scenarios (corrected field paths)
 */
const { assert, assertApprox, section, fmt, n, basePersonal, baseBank, ITR2, ITR4 } = require('./validate-filing-flows');

function runITR2Tests() {

  section('ITR-2 Scenario 1: Salary ₹12L + LTCG equity ₹3L');
  {
    const r = ITR2.compute({
      personalInfo: { ...basePersonal },
      income: {
        salary: { employers: [{ name: 'Co', grossSalary: 1200000, tdsDeducted: 100000 }] },
        capitalGains: { transactions: [
          { gainType: 'LTCG', assetType: 'equity', saleValue: 800000, purchaseValue: 500000, expenses: 0 },
        ] },
      },
      deductions: { section80C: { ppf: 100000 } }, bankDetails: baseBank,
    });
    assert('Both regimes', !!r.oldRegime && !!r.newRegime);
    // LTCG equity: 3L gain, 1.25L exempt → 1.75L taxable @ 12.5%
    assertApprox('LTCG equity taxable', r.income.capitalGains.ltcg.equity, 300000, 1000);
    assert('CG total > 0', n(r.income.capitalGains.totalTaxable) > 0);
    console.log(`  → CG taxable: ${fmt(r.income.capitalGains.totalTaxable)}, Old: ${fmt(r.oldRegime.totalTax)}, New: ${fmt(r.newRegime.totalTax)}`);
  }

  section('ITR-2 Scenario 2: STCG equity ₹2L');
  {
    const r = ITR2.compute({
      personalInfo: { ...basePersonal },
      income: {
        salary: { employers: [{ name: 'Co', grossSalary: 1000000, tdsDeducted: 80000 }] },
        capitalGains: { transactions: [
          { gainType: 'STCG', assetType: 'equity', saleValue: 500000, purchaseValue: 300000, expenses: 0 },
        ] },
      },
      deductions: {}, bankDetails: baseBank,
    });
    assertApprox('STCG equity', r.income.capitalGains.stcg.equity, 200000, 1000);
    console.log(`  → STCG: ${fmt(r.income.capitalGains.stcg.equity)}, Old: ${fmt(r.oldRegime.totalTax)}, New: ${fmt(r.newRegime.totalTax)}`);
  }

  section('ITR-2 Scenario 3: Foreign income with DTAA');
  {
    const r = ITR2.compute({
      personalInfo: { ...basePersonal },
      income: {
        salary: { employers: [{ name: 'US Corp', grossSalary: 2000000, tdsDeducted: 200000 }] },
        foreignIncome: { incomes: [
          { country: 'US', incomeType: 'salary', amountINR: 500000, taxPaidAbroad: 80000, dtaaApplicable: true },
        ] },
      },
      deductions: {}, bankDetails: baseBank,
    });
    assertApprox('Foreign total', r.income.foreignIncome.totalIncome, 500000);
    assert('FTC credit > 0', n(r.foreignTaxCredit?.credit) > 0);
    console.log(`  → Foreign: ${fmt(r.income.foreignIncome.totalIncome)}, FTC: ${fmt(r.foreignTaxCredit?.credit)}, Old: ${fmt(r.oldRegime.totalTax)}`);
  }

  section('ITR-2 Scenario 4: Mixed CG + HP loss');
  {
    const r = ITR2.compute({
      personalInfo: { ...basePersonal },
      income: {
        salary: { employers: [{ name: 'Co', grossSalary: 1500000, tdsDeducted: 120000 }] },
        houseProperty: { type: 'selfOccupied', interestOnHomeLoan: 200000 },
        capitalGains: { transactions: [
          { gainType: 'LTCG', assetType: 'equity', saleValue: 600000, purchaseValue: 400000, expenses: 0 },
          { gainType: 'STCG', assetType: 'other', saleValue: 300000, purchaseValue: 200000, expenses: 5000 },
          { gainType: 'LTCG', assetType: 'property', saleValue: 5000000, indexedCost: 3500000, expenses: 50000, exemption: 500000 },
        ] },
      },
      deductions: { section80C: { ppf: 150000 } }, bankDetails: baseBank,
    });
    assert('HP loss', n(r.income.houseProperty.netIncome) < 0);
    assert('CG taxable > 0', n(r.income.capitalGains.totalTaxable) > 0);
    console.log(`  → HP: ${fmt(r.income.houseProperty.netIncome)}, CG: ${fmt(r.income.capitalGains.totalTaxable)}, Old: ${fmt(r.oldRegime.totalTax)}`);
  }

  section('ITR-2 Scenario 5: No CG — graceful');
  {
    const r = ITR2.compute({
      personalInfo: { ...basePersonal },
      income: { salary: { employers: [{ name: 'Co', grossSalary: 800000, tdsDeducted: 30000 }] } },
      deductions: {}, bankDetails: baseBank,
    });
    assert('No crash', !!r.oldRegime);
    console.log(`  → Old: ${fmt(r.oldRegime.totalTax)}, New: ${fmt(r.newRegime.totalTax)}`);
  }
}

function runITR4Tests() {

  section('ITR-4 Scenario 1: 44AD cash (8%)');
  {
    const r = ITR4.compute({
      personalInfo: { ...basePersonal },
      income: { presumptive: { entries: [
        { section: '44AD', businessName: 'Kirana', grossReceipts: 5000000, digitalReceipts: false },
      ] } },
      deductions: { section80C: { ppf: 100000 } }, bankDetails: baseBank,
    });
    assertApprox('Presumptive income', r.income.presumptive.totalIncome, 400000, 1000);
    assert('Both regimes', !!r.oldRegime && !!r.newRegime);
    console.log(`  → Presumptive: ${fmt(r.income.presumptive.totalIncome)}, Old: ${fmt(r.oldRegime.totalTax)}, New: ${fmt(r.newRegime.totalTax)}`);
  }

  section('ITR-4 Scenario 2: 44AD digital (6%)');
  {
    const r = ITR4.compute({
      personalInfo: { ...basePersonal },
      income: { presumptive: { entries: [
        { section: '44AD', businessName: 'Online', grossReceipts: 5000000, digitalReceipts: true },
      ] } },
      deductions: {}, bankDetails: baseBank,
    });
    assertApprox('Presumptive digital', r.income.presumptive.totalIncome, 300000, 1000);
    console.log(`  → Presumptive: ${fmt(r.income.presumptive.totalIncome)}, Old: ${fmt(r.oldRegime.totalTax)}`);
  }

  section('ITR-4 Scenario 3: 44ADA professional (50%)');
  {
    const r = ITR4.compute({
      personalInfo: { ...basePersonal },
      income: { presumptive: { entries: [
        { section: '44ADA', businessName: 'CA Practice', grossReceipts: 3000000 },
      ] } },
      deductions: { section80C: { ppf: 150000 }, section80D: { selfPremium: 25000 } }, bankDetails: baseBank,
    });
    assertApprox('Presumptive 44ADA', r.income.presumptive.totalIncome, 1500000, 1000);
    console.log(`  → Presumptive: ${fmt(r.income.presumptive.totalIncome)}, Old: ${fmt(r.oldRegime.totalTax)}, New: ${fmt(r.newRegime.totalTax)}`);
  }

  section('ITR-4 Scenario 4: Salary + 44AD combined');
  {
    const r = ITR4.compute({
      personalInfo: { ...basePersonal },
      income: {
        salary: { employers: [{ name: 'Co', grossSalary: 800000, tdsDeducted: 40000 }] },
        presumptive: { entries: [
          { section: '44AD', businessName: 'Side Biz', grossReceipts: 2000000, digitalReceipts: false },
        ] },
      },
      deductions: {}, bankDetails: baseBank,
    });
    assert('Salary > 0', n(r.income.salary.netTaxable) > 0);
    assert('Presumptive > 0', n(r.income.presumptive.totalIncome) > 0);
    console.log(`  → Salary: ${fmt(r.income.salary.netTaxable)}, Presumptive: ${fmt(r.income.presumptive.totalIncome)}, Tax: ${fmt(r.oldRegime.totalTax)}`);
  }

  section('ITR-4 Scenario 5: Empty — graceful');
  {
    const r = ITR4.compute({});
    assert('No crash', !!r);
    assertApprox('Zero tax', r.oldRegime?.totalTax, 0);
  }
}

module.exports = { runITR2Tests, runITR4Tests };
