/**
 * Verify all 4 ITR computation + JSON builders with sample data
 */

const ITR1 = require('../src/services/itr/ITR1ComputationService');
const ITR2 = require('../src/services/itr/ITR2ComputationService');
const ITR3 = require('../src/services/itr/ITR3ComputationService');
const ITR4 = require('../src/services/itr/ITR4ComputationService');
const ITR1Json = require('../src/services/itr/ITR1JsonBuilder');
const ITR2Json = require('../src/services/itr/ITR2JsonBuilder');
const ITR3Json = require('../src/services/itr/ITR3JsonBuilder');
const ITR4Json = require('../src/services/itr/ITR4JsonBuilder');

const AY = '2025-26';

// Sample payloads
const itr1Payload = {
  personalInfo: { pan: 'ABCDE1234F', firstName: 'Test', lastName: 'User' },
  income: {
    salary: { employers: [{ name: 'Acme Corp', grossSalary: 1200000, tdsDeducted: 80000, deductions: { professionalTax: 2400 } }] },
    houseProperty: { type: 'selfOccupied', interestOnHomeLoan: 150000 },
    otherSources: { savingsInterest: 25000, fdInterest: 40000, dividendIncome: 10000 },
  },
  deductions: { ppf: 50000, elss: 50000, lic: 30000, nps: 50000, healthSelf: 15000, healthParents: 20000, eduLoan: 0, savingsInt: 10000, donations: 5000 },
  selectedRegime: 'old',
  bankAccount: { bankName: 'SBI', accountNumber: '1234567890', ifsc: 'SBIN0001234' },
};

const itr2Payload = {
  ...itr1Payload,
  income: {
    ...itr1Payload.income,
    capitalGains: { transactions: [
      { assetType: 'equity', gainType: 'STCG', saleValue: 500000, purchaseValue: 300000, expenses: 1000, exemption: 0 },
      { assetType: 'mutualFund', gainType: 'LTCG', saleValue: 800000, purchaseValue: 400000, indexedCost: 450000, expenses: 500, exemption: 0 },
    ]},
  },
};

const itr3Payload = {
  ...itr2Payload,
  income: {
    ...itr2Payload.income,
    business: { businesses: [{ name: 'Freelance Dev', turnover: 3000000, grossProfit: 1500000, expenses: { rent: 120000, salary: 0, interest: 0, other: 80000 }, depreciation: 50000 }] },
  },
};

const itr4Payload = {
  ...itr1Payload,
  income: {
    ...itr1Payload.income,
    presumptive: { entries: [{ section: '44AD', grossReceipts: 1500000, isDigital: true, declaredIncome: 120000 }] },
  },
};

function test(name, computeFn, buildFn, payload) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`${name}`);
  console.log('='.repeat(60));
  try {
    const comp = computeFn(payload);
    console.log(`  Gross Total: ${comp.grossTotalIncome || comp.income?.grossTotal}`);
    console.log(`  Old Regime Tax: ${comp.oldRegime?.totalTax}`);
    console.log(`  New Regime Tax: ${comp.newRegime?.totalTax}`);
    console.log(`  Recommended: ${comp.recommended} (saves ${comp.savings})`);
    console.log(`  TDS: ${comp.tds?.total}`);
    console.log(`  Net Payable (${comp.recommended}): ${comp[comp.recommended === 'old' ? 'oldRegime' : 'newRegime']?.netPayable}`);

    const json = buildFn(payload, AY);
    const formName = json[`Form_${name}`]?.FormName || json[`Form_${name.replace('-', '')}`]?.FormName || Object.keys(json)[0];
    const taxComp = json.TaxComputation || {};
    console.log(`  JSON Form: ${formName}`);
    console.log(`  JSON Taxable Income: ${taxComp.TotalTaxableIncome}`);
    console.log(`  JSON Net Payable: ${taxComp.NetTaxPayable}`);
    console.log(`  JSON Refund: ${taxComp.RefundDue}`);
    console.log(`  JSON Keys: ${Object.keys(json).join(', ')}`);
    console.log(`  PASS`);
  } catch (e) {
    console.log(`  FAIL: ${e.message}`);
    console.log(`  Stack: ${e.stack?.split('\n')[1]}`);
  }
}

test('ITR-1', ITR1.compute.bind(ITR1), ITR1Json.build.bind(ITR1Json), itr1Payload);
test('ITR-2', ITR2.compute.bind(ITR2), ITR2Json.build.bind(ITR2Json), itr2Payload);
test('ITR-3', ITR3.compute.bind(ITR3), ITR3Json.build.bind(ITR3Json), itr3Payload);
test('ITR-4', ITR4.compute.bind(ITR4), ITR4Json.build.bind(ITR4Json), itr4Payload);

console.log('\n' + '='.repeat(60));
console.log('ALL DONE');
