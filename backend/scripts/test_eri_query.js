// Simple test to query ERI-related data
const { ITRFiling } = require('../src/models');
const ERISubmissionAttempt = require('../src/models/ERISubmissionAttempt');
const STATES = require('../src/domain/SubmissionStates');

async function test() {
    console.log('\n=== Testing Database Queries ===\n');

    // Test 1: Find filings in submitted_to_eri state
    console.log(`1. Looking for filings in state: "${STATES.SUBMITTED_TO_ERI}"`);
    const filings = await ITRFiling.findAll({
        where: { lifecycleState: STATES.SUBMITTED_TO_ERI },
        limit: 5
    });
    console.log(`   Found ${filings.length} filing(s)`);

    if (filings.length > 0) {
        filings.forEach((f, idx) => {
            console.log(`   [${idx + 1}] ID: ${f.id.substring(0, 12)}... | PAN: ${f.pan} | State: ${f.lifecycleState}`);
        });
    }

    // Test 2: Find all ERI attempts
    console.log(`\n2. Looking for ERI submission attempts`);
    const attempts = await ERISubmissionAttempt.findAll({
        order: [['createdAt', 'DESC']],
        limit: 5
    });
    console.log(`   Found ${attempts.length} attempt(s)`);

    if (attempts.length > 0) {
        attempts.forEach((a, idx) => {
            console.log(`   [${idx + 1}] Filing: ${a.filingId.substring(0, 12)}... | Status: ${a.status} | Attempt #${a.attemptNumber}`);
        });
    }

    console.log('\n=== Query Test Complete ===\n');
    process.exit(0);
}

test().catch(err => {
    console.error('Error:', err.message);
    console.error(err);
    process.exit(1);
});
