const { sequelize } = require('./src/config/database');
const CAApprovalService = require('./src/services/ca/CAApprovalService');
const { ITRFiling } = require('./src/models');
const AuditEvent = require('./src/models/AuditEvent');

async function verifyAudit() {
    console.log('--- STARTING VERIFY AUDIT ---');
    const t = await sequelize.transaction();
    try {
        console.log('Transaction started.');

        const filingId = '123e4567-e89b-12d3-a456-426614174000';

        // 1. Ensure User Exists
        // Using Model to handle column mapping/UUIDs safely
        const mockUser = await require('./src/models/User').findOne({ where: { id: '2020a71f-99c8-448d-9d02-4dea8aec0ee7' }, transaction: t });

        if (!mockUser) {
            console.log('Creating Mock User...');
            await require('./src/models/User').create({
                id: '2020a71f-99c8-448d-9d02-4dea8aec0ee7',
                email: 'audit_test@example.com',
                fullName: 'Audit User',
                role: 'END_USER',
                authProvider: 'LOCAL',
                tokenVersion: 0,
                status: 'active'
            }, { transaction: t });
        }

        // 2. Ensure Filing Exists
        let filing = await ITRFiling.findOne({ where: { id: filingId }, transaction: t });
        if (!filing) {
            console.log('Creating Mock Filing...');
            filing = await ITRFiling.create({
                id: filingId,
                userId: '2020a71f-99c8-448d-9d02-4dea8aec0ee7',
                assessmentYear: '2024-25',
                status: 'READY_TO_FILE',
                taxComputation: { caContext: { requests: [] } }
            }, { transaction: t });
        } else {
            // Reset status safely
            filing.status = 'READY_TO_FILE';
            await filing.save({ transaction: t });
        }

        const userId = filing.userId;

        // 3. Submit to CA
        console.log('[Action] Submit to CA');
        await CAApprovalService.submitToCA(filingId, userId);

        // 4. Verify Audit
        const logs = await AuditEvent.findAll({
            where: { entityId: filingId, action: 'STATE_CHANGE' },
            transaction: t
        });

        const submitLog = logs.find(l => l.payload.to === 'SUBMITTED_TO_CA');
        if (!submitLog) throw new Error('Audit Log Missing for SUBMITTED_TO_CA');
        console.log('✅ Audit Log Found: SUBMITTED_TO_CA');

        // 4. Submit to ERI
        console.log('[Action] Submit to ITD');
        const caStub = { id: 'ca_audit_tester', caFirmId: 'firm_apex_001' };
        await CAApprovalService.submitToITD(filingId, caStub);

        // 5. Verify ERI Logs
        const allLogs = await AuditEvent.findAll({
            where: { entityId: filingId },
            order: [['timestamp', 'ASC']],
            transaction: t
        });

        // Check Sequence
        const actions = allLogs.map(l => l.payload && l.payload.to ? `TRANSITION:${l.payload.to}` : l.action);
        console.log('Audit Trail:', actions);

        if (!actions.includes('TRANSITION:CA_APPROVED')) throw new Error('Missing CA_APPROVED log');
        if (!actions.includes('TRANSITION:FILED')) throw new Error('Missing FILED log');
        if (!actions.includes('ERI_CALL')) throw new Error('Missing ERI_CALL log'); // Mock call

        console.log('✅ Audit Trail Verified');

        await t.rollback(); // Cleanup
        process.exit(0);

    } catch (e) {
        console.error('VERIFY FAILED', e);
        await t.rollback();
        process.exit(1);
    }
}

verifyAudit();
