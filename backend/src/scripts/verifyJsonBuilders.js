const ITR1 = require('../services/itr/ITR1JsonBuilder');
const ITR2 = require('../services/itr/ITR2JsonBuilder');
const ITR3 = require('../services/itr/ITR3JsonBuilder');
const ITR4 = require('../services/itr/ITR4JsonBuilder');

const basePayload = {
  personalInfo: { firstName: 'Test', lastName: 'User', pan: 'ABCDE1234F', dateOfBirth: '1985-01-01', gender: 'MALE', email: 'test@test.com', phone: '9876543210', residentialStatus: 'resident' },
  bankDetails: { bankName: 'SBI', accountNumber: '12345678', ifsc: 'SBIN0001234', accountType: 'savings' },
  selectedRegime: 'new',
};

try {
  const j1 = ITR1.build({ ...basePayload, income: { salary: { employers: [{ name: 'Corp', grossSalary: 1000000, tdsDeducted: 50000 }] } }, deductions: { ppf: 50000 } });
  console.log('ITR-1: ✓', Object.keys(j1).length, 'keys');
} catch(e) { console.log('ITR-1: ✗', e.message); }

try {
  const j2 = ITR2.build({ ...basePayload, income: { salary: { employers: [{ name: 'Corp', grossSalary: 1500000, tdsDeducted: 100000 }] }, capitalGains: { transactions: [{ section: '112A', gain: 200000 }] } }, deductions: { ppf: 100000 } }, '2026-27');
  console.log('ITR-2: ✓', Object.keys(j2).length, 'keys');
} catch(e) { console.log('ITR-2: ✗', e.message); }

try {
  const j3 = ITR3.build({ ...basePayload, income: { salary: { employers: [{ name: 'Corp', grossSalary: 800000, tdsDeducted: 40000 }] }, business: { businesses: [{ name: 'Shop', turnover: 5000000, grossProfit: 1000000, expenses: { rent: 100000 }, depreciation: 50000 }] } }, deductions: { ppf: 50000 } }, '2026-27');
  console.log('ITR-3: ✓', Object.keys(j3).length, 'keys');
} catch(e) { console.log('ITR-3: ✗', e.message); }

try {
  const j4 = ITR4.build({ ...basePayload, income: { presumptive: { entries: [{ section: '44AD', grossReceipts: 2000000, digitalReceipts: true }] } }, deductions: { ppf: 50000 } }, '2026-27');
  console.log('ITR-4: ✓', Object.keys(j4).length, 'keys');
} catch(e) { console.log('ITR-4: ✗', e.message); }
