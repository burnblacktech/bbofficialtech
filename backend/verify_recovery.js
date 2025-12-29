/**
 * verify_recovery.js
 * V4.4 Verification Script
 * Tests the Failure Recovery Protocol:
 * 1. Simulates a FAILED filing.
 * 2. Triggers Recovery Service.
 * 3. Expects transition to ERI_IN_PROGRESS (Retry).
 */

const { sequelize } = require('./src/config/database');
const ITRFiling = require('./src/models/ITRFiling');
const STATES = require('./src/domain/SubmissionStates');
const SubmissionRecoveryService = require('./src/services/submission/SubmissionRecoveryService');
const SubmissionWorker = require('./src/workers/SubmissionWorker');

// Mock Worker to avoid actual async execution affecting the test
SubmissionWorker.processSubmission = async (filingId) => {
    console.log(`[MOCK WORKER] Processing filing ${filingId}... (Simulated)`);
};

async function verifyRecovery() {
    console.log('--- STARTING V4.4 RECOVERY VERIFICATION ---');
    const t = await sequelize.transaction();

    try {
        // 0. Create Dummy User (FK Constraint)
        console.log('0. Creating Dummy User...');
        // We need to import User model.
        // Assuming path is src/models/User (but verify_recovery is in backend/, so ./src/models/User)
        const User = require('./src/models/User');

        // Randomize email/pan to avoid unique constraint collisions
        const randomId = Math.floor(Math.random() * 10000);
        const user = await User.create({
            firstName: 'Recovery',
            lastName: 'Test',
            email: `recovery${randomId}@test.com`,
            passwordHash: 'password123', // Mapped to field
            role: 'END_USER', // Valid Enum
            fullName: 'Recovery Test User', // Required field
            phone: `999999${randomId}`, // Ensure >10 chars (6+4) // Assuming basic unique
            panNumber: `ABCDE${randomId}F`
        }, { transaction: t });

        console.log(`   Created User ID: ${user.id}`);

        // 1. Setup: Create a FAILED filing
        console.log('1. Seeding FAILED filing...');
        const filing = await ITRFiling.create({
            userId: user.id,
            itr_type: 'ITR-1',
            status: STATES.ERI_FAILED,
            assessmentYear: '2024-25',
            jsonPayload: { test: 'recovery_data' }, // Corrected: camelCase
            rejectionReason: 'Network Error (ETIMEDOUT)', // Trigger Retry Strategy
            retryCount: 0
        }, { transaction: t });

        await t.commit();
        const filingId = filing.id;
        console.log(`   Created Filing ID: ${filingId} in state ${filing.status}`);

        // 2. Trigger Recovery
        console.log('2. Triggering SubmissionRecoveryService.recover()...');
        const result = await SubmissionRecoveryService.recover(filingId);

        console.log('   Recovery Result:', result);

        // 3. Verify Outcome
        const updatedFiling = await ITRFiling.findByPk(filingId);
        console.log(`3. Verified Filing State: ${updatedFiling.status}`);

        const currentRetryCount = updatedFiling.jsonPayload?.retryCount;
        console.log(`   Retry Count: ${currentRetryCount}`);

        if (updatedFiling.status === STATES.ERI_IN_PROGRESS && currentRetryCount === 1) {
            console.log('✅ TEST PASSED: Filing recovered and retrying.');
        } else {
            console.error('❌ TEST FAILED: Unexpected state or retry count.');
            process.exit(1);
        }

    } catch (error) {
        if (!t.finished) await t.rollback();
        console.error('❌ CRASH:', error);
        process.exit(1);
    } finally {
        // Cleanup? 
        // await sequelize.close(); // Keep open if needed, but script usually exits.
    }
}

// Run
verifyRecovery().then(() => {
    console.log('--- VERIFICATION COMPLETE ---');
    process.exit(0);
});
