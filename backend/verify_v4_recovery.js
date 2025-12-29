const { sequelize } = require('./src/config/database');
const SubmissionRecoveryService = require('./src/services/core/SubmissionRecoveryService');
const AdminRescueService = require('./src/services/core/AdminRescueService');
const { ITRFiling } = require('./src/models');
const AuditEvent = require('./src/models/AuditEvent');
const STATES = require('./src/domain/SubmissionStates');
const crypto = require('crypto');

async function verifyRecovery() {
    console.log('--- Verifying V4.4 Recovery Flow ---');
    const t = await sequelize.transaction();

    const filingId = crypto.randomUUID();
    const userId = crypto.randomUUID();

    try {
        // 1. Seed Stuck Filing (ERI_IN_PROGRESS, 1 hour ago)
        console.log('[Setup] Seeding Stuck Filing...');

        // Ensure User
        await sequelize.query(`
            INSERT INTO users (id, email, full_name, role, auth_provider, token_version, status, created_at, updated_at)
            VALUES ('${userId}', 'recovery_${userId}@test.com', 'Rec User', 'END_USER', 'LOCAL', 0, 'active', NOW(), NOW())
        `, { transaction: t });

        // Ensure Filing
        // Note: setting updated_at to 1 hour ago
        await sequelize.query(`
            INSERT INTO itr_filings (id, user_id, assessment_year, status, lifecycle_state, tax_computation, created_at, updated_at)
            VALUES (
                '${filingId}', 
                '${userId}', 
                '2024-25', 
                '${STATES.ERI_IN_PROGRESS}', 
                'DRAFT_INIT',
                '{"caContext":{"requests":[]}}', 
                NOW() - INTERVAL '2 HOURS', 
                NOW() - INTERVAL '2 HOURS'
            )
        `, { transaction: t });

        await t.commit();
        console.log('[Setup] Stuck Filing Created.');

        // 2. Run Sweeper
        console.log('[Action] Running Recovery Sweep...');
        const stuck = await SubmissionRecoveryService.findStuckSubmissions(15); // >15 mins
        console.log(`[Sweeper] Found stuck: ${stuck.length} (Expected >= 1)`);

        if (stuck.length === 0) throw new Error('Sweeper failed to find stale filing');

        const target = stuck.find(f => f.id === filingId);
        if (!target) throw new Error('Our specific test filing was not found');

        const result = await SubmissionRecoveryService.recoverFiling(target);
        console.log('[Sweeper] Result:', result);

        // 3. Verify Result
        const final = await ITRFiling.findOne({ where: { id: filingId } });
        console.log(`[Result] Status: ${final.status}`);

        if (final.status === STATES.FILED || final.status === STATES.ERI_FAILED) {
            console.log('✅ Auto-Recovery Successful');
        } else {
            throw new Error(`Recovery failed, status is ${final.status}`);
        }

        // 4. Test Admin Rescue (Force Retry)
        console.log('[Action] Testing Admin Force Retry...');
        await AdminRescueService.forceRetry(filingId, 'admin_001');

        const resetFiling = await ITRFiling.findOne({ where: { id: filingId } });
        console.log(`[Result] Post-Retry Status: ${resetFiling.status}`);

        if (resetFiling.status === STATES.CA_APPROVED) {
            console.log('✅ Admin Retry Successful');
        } else {
            throw new Error('Admin retry failed');
        }

        process.exit(0);

    } catch (e) {
        console.error('VERIFY FAILED', e);
        process.exit(1);
    }
}

verifyRecovery();
