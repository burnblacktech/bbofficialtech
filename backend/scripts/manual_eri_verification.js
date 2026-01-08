// Manual ERI Worker Execution - Authoritative Verification
// Database truth is the oracle

const { ITRFiling } = require('../src/models');
const ERISubmissionAttempt = require('../src/models/ERISubmissionAttempt');
const ERIWorker = require('../src/workers/ERIWorker');
const STATES = require('../src/domain/SubmissionStates');

const c = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[36m',
};

async function verify() {
    console.log('\n' + '='.repeat(70));
    console.log(`${c.bright}${c.blue}S21 ERI Worker — Manual Verification${c.reset}`);
    console.log('='.repeat(70));

    // Step 1: Current state
    console.log(`\n${c.bright}Step 1: Current State${c.reset}`);
    const filings = await ITRFiling.findAll({
        where: { lifecycleState: STATES.SUBMITTED_TO_ERI },
        limit: 5
    });

    if (filings.length === 0) {
        console.log(`${c.red}❌ No filings in submitted_to_eri state${c.reset}`);
        console.log(`${c.yellow}   Create test filings first${c.reset}`);
        process.exit(0);
    }

    console.log(`${c.green}✓ Found ${filings.length} pending filing(s)${c.reset}`);
    filings.forEach((f, i) => {
        console.log(`  [${i + 1}] ${f.id.substring(0, 10)}... | PAN: ${f.pan || 'N/A'}`);
    });

    // Step 2: Execute worker
    console.log(`\n${c.bright}Step 2: Execute ERIWorker.runOnce()${c.reset}`);
    const start = Date.now();
    await ERIWorker.runOnce();
    console.log(`${c.green}✓ Worker completed in ${Date.now() - start}ms${c.reset}`);

    // Step 3: Validate outcomes
    console.log(`\n${c.bright}Step 3: Validate Outcomes (Database Truth)${c.reset}`);

    for (const filing of filings) {
        console.log(`\n${c.bright}Filing: ${filing.id.substring(0, 10)}...${c.reset}`);

        // Query attempts
        const attempts = await ERISubmissionAttempt.findAll({
            where: { filingId: filing.id },
            order: [['createdAt', 'DESC']],
            limit: 3
        });

        console.log(`  Attempts: ${attempts.length}`);
        attempts.forEach((a, i) => {
            console.log(`    [${i + 1}] Status: ${a.status} | Attempt #${a.attemptNumber}`);
            if (a.eriAckNumber) console.log(`        ${c.green}ACK: ${a.eriAckNumber}${c.reset}`);
            if (a.errorCode) console.log(`        ${c.red}Error: ${a.errorCode}${c.reset}`);
        });

        // Query filing state
        const updated = await ITRFiling.findByPk(filing.id);
        console.log(`  Filing State: ${updated.lifecycleState}`);
        if (updated.eriAckNumber) {
            console.log(`  ${c.green}ACK Number: ${updated.eriAckNumber}${c.reset}`);
        }

        // Validate invariants
        if (attempts.length > 0) {
            const latest = attempts[0];

            if (latest.status === 'success' && updated.lifecycleState === STATES.ERI_SUCCESS) {
                console.log(`  ${c.green}✓ State transition: submitted_to_eri → eri_success${c.reset}`);
            } else if (latest.status === 'terminal_failure' && updated.lifecycleState === STATES.ERI_FAILED) {
                console.log(`  ${c.green}✓ State transition: submitted_to_eri → eri_failed${c.reset}`);
            } else if (latest.status === 'pending' || latest.status === 'retryable_failure') {
                console.log(`  ${c.green}✓ Retry scheduled (state unchanged)${c.reset}`);
            } else {
                console.log(`  ${c.yellow}⚠ State: attempt=${latest.status}, filing=${updated.lifecycleState}${c.reset}`);
            }
        }
    }

    // Step 4: Idempotency test
    console.log(`\n${c.bright}Step 4: Idempotency Test${c.reset}`);
    const beforeCount = (await ERISubmissionAttempt.findAll()).length;
    await ERIWorker.runOnce();
    const afterCount = (await ERISubmissionAttempt.findAll()).length;

    if (afterCount === beforeCount) {
        console.log(`${c.green}✓ Idempotent: No new attempts${c.reset}`);
    } else {
        console.log(`${c.yellow}⚠ ${afterCount - beforeCount} new attempt(s) (expected for retries)${c.reset}`);
    }

    // Summary
    console.log('\n' + '='.repeat(70));
    console.log(`${c.bright}${c.green}Verification Complete${c.reset}`);
    console.log('='.repeat(70));
    console.log(`${c.bright}Database truth is the oracle.${c.reset}`);
    console.log(`${c.bright}If state transitions match expected outcomes → ERI works.${c.reset}\n`);

    process.exit(0);
}

verify().catch(err => {
    console.error(`\n${c.red}❌ Verification failed: ${err.message}${c.reset}`);
    console.error(err);
    process.exit(1);
});
