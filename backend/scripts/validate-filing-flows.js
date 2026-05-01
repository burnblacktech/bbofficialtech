#!/usr/bin/env node
/**
 * Comprehensive Filing Flow Validation
 * Tests ITR-1/2/4 computation, regime switching, edge cases, and PDF generation.
 * Run: node backend/scripts/validate-filing-flows.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const ITR1 = require('../src/services/itr/ITR1ComputationService');
const ITR2 = require('../src/services/itr/ITR2ComputationService');
const ITR4 = require('../src/services/itr/ITR4ComputationService');
const PDFService = require('../src/services/itr/ComputationPDFService');
const fs = require('fs');
const path = require('path');

const n = (v) => Number(v) || 0;
let passed = 0, failed = 0, total = 0;

function assert(label, condition, detail = '') {
  total++;
  if (condition) { passed++; console.log(`  ✅ ${label}`); }
  else { failed++; console.error(`  ❌ ${label} ${detail}`); }
}

function assertApprox(label, actual, expected, tolerance = 1) {
  const diff = Math.abs(n(actual) - n(expected));
  assert(label, diff <= tolerance, `— got ${n(actual)}, expected ${n(expected)}, diff ${diff}`);
}

function section(name) { console.log(`\n${'═'.repeat(60)}\n${name}\n${'═'.repeat(60)}`); }

function fmt(v) { return `₹${n(v).toLocaleString('en-IN')}`; }

// ─── Shared payload fragments ───
const basePersonal = {
  pan: 'ABCDE1234F', firstName: 'Rahul', lastName: 'Sharma',
  dob: '1990-05-15', gender: 'male', email: 'r@test.com', phone: '9876543210',
  employerCategory: 'OTH', residentialStatus: 'RES',
};

const baseBank = { bankName: 'SBI', accountNumber: '12345678901', ifsc: 'SBIN0001234' };

module.exports = { assert, assertApprox, section, fmt, n, basePersonal, baseBank, ITR1, ITR2, ITR4, PDFService, fs, path };

// ─── Main runner ───
if (require.main === module) {
  (async () => {
    console.log('\n🔥 BurnBlack Filing Flow Validation\n');

    const { runITR1Tests } = require('./scenarios-itr1');
    const { runITR2Tests, runITR4Tests } = require('./scenarios-itr2-4');
    const { runEdgeCaseTests, runPDFTests } = require('./scenarios-edge-pdf');

    runITR1Tests();
    runITR2Tests();
    runITR4Tests();
    runEdgeCaseTests();
    await runPDFTests();

    console.log(`\n${'═'.repeat(60)}`);
    console.log(`RESULTS: ${passed}/${total} passed, ${failed} failed`);
    console.log(`${'═'.repeat(60)}\n`);
    process.exit(failed > 0 ? 1 : 0);
  })();
}
