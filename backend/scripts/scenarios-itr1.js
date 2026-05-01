/**
 * ITR-1 Test Scenarios (corrected field paths)
 */
const { assert, assertApprox, section, fmt, n, basePersonal, baseBank, ITR1 } = require('./validate-filing-flows');

function runITR1Tests() {

  section('ITR-1 Scenario 1: Simple salaried ₹10L, no deductions (new regime wins)');
  {
    const r = ITR1.compute({
      personalInfo: { ...basePersonal },
      income: { salary: { employers: [{ name: 'TCS', grossSalary: 1000000, tdsDeducted: 50000 }] } },
      deductions: {}, bankDetails: baseBank,
    });
    assert('Returns both regimes', !!r.oldRegime && !!r.newRegime);
    assert('Recommends new regime', r.recommended === 'new');
    assertApprox('New regime total tax', r.newRegime.totalTax, 44200);
    assertApprox('Old regime total tax', r.oldRegime.totalTax, 101400);
    assert('Savings > 0', r.savings > 0);
    console.log(`  → Old: ${fmt(r.oldRegime.totalTax)}, New: ${fmt(r.newRegime.totalTax)}, Savings: ${fmt(r.savings)}`);
  }

  section('ITR-1 Scenario 2: ₹15L salary + heavy deductions (old regime wins)');
  {
    const r = ITR1.compute({
      personalInfo: { ...basePersonal },
      income: {
        salary: { employers: [{ name: 'Infosys', grossSalary: 1500000, tdsDeducted: 150000, deductions: { professionalTax: 2400 } }] },
        houseProperty: { type: 'selfOccupied', interestOnHomeLoan: 200000 },
      },
      deductions: {
        section80C: { ppf: 100000, elss: 50000 },
        section80CCD1B: { nps: 50000 },
        section80D: { selfPremium: 25000, parentsPremium: 25000 },
        section80E: { educationLoanInterest: 40000 },
      },
      bankDetails: baseBank,
    });
    // Old: 15L - 75K std - 2.4K PT - 2L HP - 1.5L 80C - 50K NPS - 50K 80D - 40K 80E = 7.325L
    const expectedTaxable = 1500000 - 75000 - 2400 - 200000 - 150000 - 50000 - 50000 - 40000;
    assertApprox('Old taxable income', r.oldRegime.taxableIncome, expectedTaxable, 500);
    assert('Old has deductions', n(r.oldRegime.deductions) > 200000);
    console.log(`  → Old: ${fmt(r.oldRegime.totalTax)} (taxable: ${fmt(r.oldRegime.taxableIncome)}), New: ${fmt(r.newRegime.totalTax)}`);
    console.log(`  → Recommended: ${r.recommended}, Savings: ${fmt(r.savings)}`);
  }

  section('ITR-1 Scenario 3: Rebate 87A — ₹5L income, zero tax');
  {
    const r = ITR1.compute({
      personalInfo: { ...basePersonal },
      income: { salary: { employers: [{ name: 'Startup', grossSalary: 500000, tdsDeducted: 0 }] } },
      deductions: {}, bankDetails: baseBank,
    });
    assertApprox('Old regime total tax', r.oldRegime.totalTax, 0);
    assertApprox('New regime total tax', r.newRegime.totalTax, 0);
    console.log(`  → Old: ${fmt(r.oldRegime.totalTax)}, New: ${fmt(r.newRegime.totalTax)}, Taxable: ${fmt(r.oldRegime.taxableIncome)}`);
  }

  section('ITR-1 Scenario 4: Rebate 87A — ₹7.5L, zero tax new only');
  {
    const r = ITR1.compute({
      personalInfo: { ...basePersonal },
      income: { salary: { employers: [{ name: 'MNC', grossSalary: 750000, tdsDeducted: 10000 }] } },
      deductions: {}, bankDetails: baseBank,
    });
    assertApprox('New regime total tax', r.newRegime.totalTax, 0);
    assert('Old regime has tax', r.oldRegime.totalTax > 0);
    console.log(`  → Old: ${fmt(r.oldRegime.totalTax)}, New: ${fmt(r.newRegime.totalTax)}`);
  }

  section('ITR-1 Scenario 5: Crypto/VDA — flat 30%');
  {
    const r = ITR1.compute({
      personalInfo: { ...basePersonal },
      income: {
        salary: { employers: [{ name: 'Co', grossSalary: 800000, tdsDeducted: 40000 }] },
        otherSources: { vdaSaleValue: 500000, vdaCostOfAcquisition: 200000 },
      },
      deductions: {}, bankDetails: baseBank,
    });
    assertApprox('VDA tax', r.oldRegime.vdaTax, 90000, 100);
    assert('VDA adds to total', r.oldRegime.totalTax > 0);
    console.log(`  → VDA tax: ${fmt(r.oldRegime.vdaTax)}, Total old: ${fmt(r.oldRegime.totalTax)}`);
  }

  section('ITR-1 Scenario 6: Multiple employers');
  {
    const r = ITR1.compute({
      personalInfo: { ...basePersonal },
      income: { salary: { employers: [
        { name: 'Old Co', grossSalary: 400000, tdsDeducted: 20000 },
        { name: 'New Co', grossSalary: 800000, tdsDeducted: 60000 },
      ] } },
      deductions: { section80C: { ppf: 50000 } }, bankDetails: baseBank,
    });
    assertApprox('Total gross salary', r.income.salary.grossSalary, 1200000);
    assertApprox('Total TDS', r.tds.fromSalary, 80000);
    console.log(`  → Gross: ${fmt(r.income.salary.grossSalary)}, Old: ${fmt(r.oldRegime.totalTax)}, New: ${fmt(r.newRegime.totalTax)}`);
  }

  section('ITR-1 Scenario 7: Let-out house property');
  {
    const r = ITR1.compute({
      personalInfo: { ...basePersonal },
      income: {
        salary: { employers: [{ name: 'Co', grossSalary: 1000000, tdsDeducted: 50000 }] },
        houseProperty: { type: 'letOut', annualRentReceived: 240000, municipalTaxesPaid: 10000, interestOnHomeLoan: 150000 },
      },
      deductions: {}, bankDetails: baseBank,
    });
    // NAV=230K, 30% std=69K, net=230K-69K-150K=11K
    assertApprox('HP net income', r.income.houseProperty.netIncome, 11000, 1000);
    console.log(`  → HP: ${fmt(r.income.houseProperty.netIncome)}, Total old: ${fmt(r.oldRegime.totalTax)}`);
  }

  section('ITR-1 Scenario 8: Empty payload — graceful');
  {
    const r = ITR1.compute({});
    assert('No crash', !!r);
    assertApprox('Zero tax old', r.oldRegime?.totalTax, 0);
    assertApprox('Zero tax new', r.newRegime?.totalTax, 0);
  }

  section('ITR-1 Scenario 9: GOV employer exemptions');
  {
    const r = ITR1.compute({
      personalInfo: { ...basePersonal, employerCategory: 'GOV' },
      income: { salary: { employers: [{
        name: 'Govt', grossSalary: 1200000, basicPlusDA: 600000, tdsDeducted: 80000,
        entertainmentAllowance: 10000, gratuityReceived: 100000, leaveEncashmentReceived: 50000,
      }] } },
      deductions: {}, bankDetails: baseBank,
    });
    assert('Salary exemptions applied', n(r.income.salary.salaryExemptions) > 0);
    console.log(`  → Exemptions: ${fmt(r.income.salary.salaryExemptions)}, Entertainment ded: ${fmt(r.income.salary.entertainmentAllowanceDeduction)}`);
  }

  section('ITR-1 Scenario 10: 80G categorized donations');
  {
    const r = ITR1.compute({
      personalInfo: { ...basePersonal },
      income: { salary: { employers: [{ name: 'Co', grossSalary: 2000000, tdsDeducted: 200000 }] } },
      deductions: {
        section80C: { ppf: 150000 },
        donations80G: [
          { doneeName: 'PM Relief', amount: 50000, category: '100_no_limit' },
          { doneeName: 'Trust', amount: 100000, category: '50_with_limit' },
        ],
      },
      bankDetails: baseBank,
    });
    assert('Deductions > 80C alone', n(r.oldRegime.deductions) > 150000);
    console.log(`  → Total deductions: ${fmt(r.oldRegime.deductions)}, Old: ${fmt(r.oldRegime.totalTax)}`);
  }
}

module.exports = { runITR1Tests };
