/**
 * End-to-end MVP flow test
 * Tests: Register → Login → Profile → ITR Determination → Create Filing → Update Filing → Tax Calculation → Readiness
 */
const http = require('http');

const BASE = 'http://localhost:3002/api';
let TOKEN = '';
let FILING_ID = '';

async function api(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE + path);
    const data = body ? JSON.stringify(body) : null;
    const headers = { 'Content-Type': 'application/json' };
    if (TOKEN) headers['Authorization'] = `Bearer ${TOKEN}`;
    if (data) headers['Content-Length'] = Buffer.byteLength(data);

    const req = http.request({ hostname: url.hostname, port: url.port, path: url.pathname, method, headers }, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(body) }); }
        catch { resolve({ status: res.statusCode, data: body }); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

function check(label, res, expectStatus = 200) {
  const ok = res.status >= 200 && res.status < 300;
  const icon = ok ? '✓' : '✗';
  console.log(`  ${icon} ${label} [${res.status}]`);
  if (!ok) {
    console.log(`    Error: ${JSON.stringify(res.data).substring(0, 200)}`);
  }
  return ok;
}

(async () => {
  console.log('\n=== MVP End-to-End Flow Test ===\n');

  // 1. Health
  const health = await api('GET', '/health');
  check('Health check', health);

  // 2. Register
  const reg = await api('POST', '/auth/register', {
    email: 'mvptest@example.com', password: 'Test1234!', fullName: 'MVP Test User',
  });
  check('Register', reg);

  // 3. Login
  const login = await api('POST', '/auth/login', {
    email: 'mvptest@example.com', password: 'Test1234!',
  });
  check('Login', login);
  TOKEN = login.data.accessToken;

  // 4. Profile
  const profile = await api('GET', '/auth/profile');
  check('Get profile', profile);

  // 5. Update PAN
  const pan = await api('PATCH', '/auth/pan', { panNumber: 'ABCDE1234F', dateOfBirth: '1995-06-15' });
  check('Update PAN', pan);

  // 6. ITR Determination
  const det = await api('POST', '/itr/determine', {
    profile: { isResident: true, age: 30, isDirector: false, hasForeignAssets: false, totalIncome: 800000 },
    incomeSources: ['salary'],
    additionalInfo: { housePropertyCount: 0 },
  });
  check('ITR Determination', det);
  console.log(`    → Recommended: ${det.data.data?.recommendedITR}`);

  // 7. Create Filing
  const filing = await api('POST', '/filings', { assessmentYear: '2025-26', taxpayerPan: 'ABCDE1234F' });
  check('Create filing', filing);
  FILING_ID = filing.data.data?.filingId || filing.data.data?.id;
  console.log(`    → Filing ID: ${FILING_ID}`);
  console.log(`    → State: ${filing.data.data?.lifecycleState}`);

  if (!FILING_ID) {
    console.log('\n  ✗ Cannot continue without filing ID\n');
    process.exit(1);
  }

  // 8. Update Filing with income data
  const update = await api('PUT', `/filings/${FILING_ID}`, {
    jsonPayload: {
      income: {
        salary: { employers: [{ name: 'Acme Corp', grossSalary: 800000, professionalTax: 2400, standardDeduction: 75000 }] },
      },
      deductions: { section80C: 150000, section80D: 25000 },
      selectedIncomeSources: ['salary'],
    },
    selectedRegime: 'new',
  });
  check('Update filing with income', update);

  // 9. Tax Calculation
  const tax = await api('POST', '/tax/calculate', {
    filingData: { income: { salary: { grossSalary: 800000 } } }, regime: 'NEW',
  });
  check('Tax calculation', tax);

  // 10. Tax Comparison
  const compare = await api('POST', '/tax/compare-regimes', {
    filingData: { income: { salary: { grossSalary: 800000 } }, deductions: { section80C: 150000, section80D: 25000 } },
  });
  check('Regime comparison', compare);

  // 11. Get Filing
  const getFiling = await api('GET', `/filings/${FILING_ID}`);
  check('Get filing', getFiling);

  // 12. Filing Overview
  const overview = await api('GET', `/filings/${FILING_ID}/overview`);
  check('Filing overview', overview);

  // 13. Tax Breakdown
  const breakdown = await api('GET', `/filings/${FILING_ID}/tax-breakdown`);
  check('Tax breakdown', breakdown);

  // 14. Filing Readiness
  const readiness = await api('GET', `/filings/${FILING_ID}/readiness`);
  check('Filing readiness', readiness);

  // 15. List Filings
  const list = await api('GET', '/filings');
  check('List filings', list);
  console.log(`    → Count: ${list.data.data?.length}`);

  console.log('\n=== Test Complete ===\n');
  process.exit(0);
})().catch(e => {
  console.error('Test failed:', e.message);
  process.exit(1);
});
