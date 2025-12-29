const { sequelize } = require('./src/config/database');
const CAApprovalService = require('./src/services/ca/CAApprovalService');
const { ITRFiling } = require('./src/models');
const AuditEvent = require('./src/models/AuditEvent');
const STATES = require('./src/domain/SubmissionStates');
const crypto = require('crypto');

async function verifyAsyncFlow() {
    console.log('--- Verifying V4.3 Async ERI Flow (Catch & Patch) ---');
    const t = await sequelize.transaction();

    // Setup Context
    const filingId = crypto.randomUUID();
    const mockUserId = crypto.randomUUID();
    const mockEmail = `audit_test_${Date.now()}_${crypto.randomInt(1000)}@example.com`;

    try {
        console.log(`[Setup] Seeding Data...`);
        console.log(` - FilingID: ${filingId}`);
        console.log(` - UserID:   ${mockUserId}`);

        // 1. Ensure User
        try {
            await sequelize.query(`
                INSERT INTO users (id, email, full_name, role, auth_provider, token_version, status, created_at, updated_at)
                VALUES ('${mockUserId}', '${mockEmail}', 'Audit User', 'END_USER', 'LOCAL', 0, 'active', NOW(), NOW())
            `, { transaction: t });
        } catch (err) {
            console.log('[Setup] User Insert Skipped/Failed (Safe):', err.message);
        }

        // 2. Ensure Filing
        try {
            await sequelize.query(`
                INSERT INTO itr_filings (id, user_id, assessment_year, status, lifecycle_state, tax_computation, created_at, updated_at)
                VALUES (
                    '${filingId}', 
                    '${mockUserId}', 
                    '2024-25', 
                    '${STATES.SUBMITTED_TO_CA}', 
                    'DRAFT_INIT',
                    '{"caContext":{"requests":[]}}', 
                    NOW(), 
                    NOW()
                )
            `, { transaction: t });
        } catch (err) {
            console.log('[Setup] Filing Insert Skipped/Failed (Safe):', err.message);
            // If insert failed, maybe it exists? Or collided on index?
            // We try to force update regardless.
        }

        // Force Update to ensure clean state
        await sequelize.query(`
            UPDATE itr_filings 
            SET status = '${STATES.SUBMITTED_TO_CA}', ack_number = NULL, rejection_reason = NULL 
            WHERE id = '${filingId}'
        `, { transaction: t });

        await t.commit();
        console.log('[Setup] Done. Filing seeded/patched.');

        // 3. Trigger Async Submit
        console.log('[Action] Calling submitToITD (Async)...');
        const caStub = { id: 'ca_async_tester', caFirmId: 'firm_apex_001' };

        const result = await CAApprovalService.submitToITD(filingId, caStub);

        console.log('[Response]', result);
        if (result.status !== STATES.ERI_IN_PROGRESS) throw new Error(`Response should be ERI_IN_PROGRESS, got ${result.status}`);
        if (result.ackNumber) throw new Error('Response should NOT have ackNumber yet');

        // 4. Wait for Worker
        console.log('[Wait] Waiting for Worker (5s)...');
        await new Promise(r => setTimeout(r, 5000));

        // 5. Check Final State
        const finalFiling = await ITRFiling.findOne({ where: { id: filingId } });
        console.log(`[Result] Final Status: ${finalFiling ? finalFiling.status : 'NOT FOUND'}`);
        if (!finalFiling) throw new Error('Filing vanished after setup!');

        console.log(`[Result] ACK: ${finalFiling.ackNumber}`);

        if (finalFiling.status === STATES.FILED) {
            console.log('✅ Async Submission SUCCESS');
        } else if (finalFiling.status === STATES.ERI_FAILED) {
            console.log('⚠️ Async Submission FAILED (Simulated?)');
            console.log('Reason:', finalFiling.rejectionReason);
        } else {
            throw new Error(`Worker did not complete! Stuck in ${finalFiling.status}`);
        }

        // 6. Check Audit
        const logs = await AuditEvent.findAll({ where: { entityId: filingId } });
        const actions = logs.map(l => l.action);

        if (actions.includes('ERI_RESPONSE_RAW')) console.log('✅ ERI Evidence Recorded');

        process.exit(0);

    } catch (e) {
        console.error('VERIFY FAILED', e);
        process.exit(1);
    }
}

verifyAsyncFlow();
