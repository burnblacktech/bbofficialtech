/**
 * Financial Story UX API Verification Script
 * 
 * Tests all 4 new API endpoints for financial story screens
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3002';
const TEST_EMAIL = `financial.story.${Date.now()}@burnblack.com`;
const TEST_PASSWORD = 'FinancialStory123!';

// Colors
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[36m',
    bright: '\x1b[1m',
};

function log(message, color = colors.reset) {
    console.log(`${color}${message}${colors.reset}`);
}

function section(title) {
    console.log('\n' + '='.repeat(70));
    log(title, colors.bright + colors.blue);
    console.log('='.repeat(70));
}

async function main() {
    section('Financial Story UX API Verification');

    let token, filingId;

    try {
        // Step 1: Authenticate
        section('Step 1: Authenticate');
        await axios.post(`${BASE_URL}/api/auth/register`, {
            email: TEST_EMAIL,
            password: TEST_PASSWORD,
            fullName: 'Financial Story Test'
        });

        const loginRes = await axios.post(`${BASE_URL}/api/auth/login`, {
            email: TEST_EMAIL,
            password: TEST_PASSWORD
        });

        token = loginRes.data.accessToken;
        log('✓ Authenticated', colors.green);

        // Step 2: Create filing with salary
        section('Step 2: Create Filing with Salary');
        const filingRes = await axios.post(
            `${BASE_URL}/api/filings`,
            { assessmentYear: '2024-25', taxpayerPan: 'ABCDE1234F' },
            { headers: { Authorization: `Bearer ${token}` } }
        );

        filingId = filingRes.data.data.filingId;
        log(`✓ Filing created: ${filingId}`, colors.green);

        // Add salary
        await axios.post(
            `${BASE_URL}/api/employers/${filingId}`,
            {
                name: 'TechCorp India',
                tan: 'DELC12345D',
                workPeriodFrom: '2023-04',
                workPeriodTo: '2024-03',
                gross: 1200000,
                tds: 120000
            },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        log('✓ Salary data added', colors.green);

        // Step 3: Test Overview API
        section('Step 3: Test Overview API');
        const overviewRes = await axios.get(
            `${BASE_URL}/api/filings/${filingId}/overview`,
            { headers: { Authorization: `Bearer ${token}` } }
        );

        const overview = overviewRes.data.data;
        log(`✓ Overview API successful`, colors.green);
        log(`  Assessment Year: ${overview.identity.assessmentYear}`);
        log(`  PAN: ${overview.identity.taxpayerPan}`);
        log(`  ITR Type: ${overview.identity.itrType}`);
        log(`  Total Income: ₹${overview.incomeSummary.totalIncome.toLocaleString('en-IN')}`);
        log(`  Eligibility: ${overview.eligibilityBadge.message}`);

        // Step 4: Test Income Story API
        section('Step 4: Test Income Story API');
        const incomeStoryRes = await axios.get(
            `${BASE_URL}/api/filings/${filingId}/income-story`,
            { headers: { Authorization: `Bearer ${token}` } }
        );

        const incomeStory = incomeStoryRes.data.data;
        log(`✓ Income Story API successful`, colors.green);
        log(`  Salary Total: ₹${incomeStory.salary?.total?.toLocaleString('en-IN') || 0}`);
        log(`  Employers: ${incomeStory.salary?.employers?.length || 0}`);
        log(`  Capital Gains: ${incomeStory.capitalGains?.intent || 'not_declared'}`);

        // Step 5: Test Tax Breakdown API
        section('Step 5: Test Tax Breakdown API');
        const taxBreakdownRes = await axios.get(
            `${BASE_URL}/api/filings/${filingId}/tax-breakdown`,
            { headers: { Authorization: `Bearer ${token}` } }
        );

        const taxBreakdown = taxBreakdownRes.data.data;
        log(`✓ Tax Breakdown API successful`, colors.green);
        log(`  Regime: ${taxBreakdown.regime}`);
        log(`  Gross Total Income: ₹${taxBreakdown.steps.taxableIncome.grossTotalIncome.toLocaleString('en-IN')}`);
        log(`  Total Deductions: ₹${taxBreakdown.steps.taxableIncome.deductions.toLocaleString('en-IN')}`);
        log(`  Total Income: ₹${taxBreakdown.steps.taxableIncome.totalIncome.toLocaleString('en-IN')}`);
        log(`  Final Tax: ₹${taxBreakdown.steps.finalLiability.totalTax.toLocaleString('en-IN')}`);
        log(`  TDS Deducted: ₹${taxBreakdown.steps.finalLiability.tdsDeducted.toLocaleString('en-IN')}`);
        log(`  Refund/Payable: ₹${Math.abs(taxBreakdown.steps.finalLiability.refundOrPayable).toLocaleString('en-IN')} ${taxBreakdown.steps.finalLiability.isRefund ? '(Refund)' : '(Payable)'}`);

        // Step 6: Test Readiness API
        section('Step 6: Test Readiness API');
        const readinessRes = await axios.get(
            `${BASE_URL}/api/filings/${filingId}/readiness`,
            { headers: { Authorization: `Bearer ${token}` } }
        );

        const readiness = readinessRes.data.data;
        log(`✓ Readiness API successful`, colors.green);
        log(`  Safe to Submit: ${readiness.legalStatus.safeToSubmit ? 'Yes' : 'No'}`);
        log(`  Reason: ${readiness.legalStatus.reason}`);
        log(`  CA Required: ${readiness.caRequirement.status}`);
        log(`  Can Download JSON: ${readiness.actions.canDownloadJSON ? 'Yes' : 'No'}`);
        log(`  Missing Blocks: ${readiness.legalStatus.missingBlocks.join(', ') || 'None'}`);

        // Summary
        section('Test Summary');
        log('✓ Overview API: PASSED', colors.green);
        log('✓ Income Story API: PASSED', colors.green);
        log('✓ Tax Breakdown API: PASSED', colors.green);
        log('✓ Readiness API: PASSED', colors.green);
        log('\n✅ All Financial Story UX APIs verified successfully!', colors.bright + colors.green);

    } catch (error) {
        log(`\n✗ Test failed: ${error.message}`, colors.red);
        if (error.response) {
            console.error('Response:', error.response.data);
        }
        console.error(error);
        process.exit(1);
    }
}

main().catch(error => {
    log(`\n✗ Fatal error: ${error.message}`, colors.red);
    console.error(error);
    process.exit(1);
});
