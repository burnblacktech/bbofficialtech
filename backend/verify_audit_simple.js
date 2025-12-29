const { sequelize } = require('./src/config/database');
const AuditEvent = require('./src/models/AuditEvent');
const AuditService = require('./src/services/core/AuditService');

async function verifyAuditSimple() {
    console.log('--- Verifying AuditService Isolation ---');
    const t = await sequelize.transaction();
    try {
        const testId = 'audit-test-' + Date.now();

        // 1. Direct Model Create
        console.log('[1] Testing Model Direct Create...');
        await AuditEvent.create({
            entityType: 'TEST',
            entityId: testId,
            action: 'TEST_CREATE',
            actorId: 'tester',
            payload: { ok: true }
        }, { transaction: t });

        const logs = await AuditEvent.findAll({ where: { entityId: testId }, transaction: t });
        if (logs.length !== 1) throw new Error('Direct Create Failed');
        console.log('✅ Model Create Works');

        // 2. Service Log
        console.log('[2] Testing AuditService.log...');
        await AuditService.log({
            entityType: 'TEST',
            entityId: testId,
            action: 'SERVICE_LOG',
            actorId: 'tester',
            payload: { via: 'service' }
        }, t);

        const logs2 = await AuditEvent.findAll({ where: { entityId: testId }, transaction: t });
        if (logs2.length !== 2) throw new Error('Service Log Failed');
        console.log('✅ AuditService.log Works');

        // 3. Service Transition Log
        console.log('[3] Testing AuditService.logTransition...');
        await AuditService.logTransition(testId, 'A', 'B', 'tester', 'USER', t);

        const logs3 = await AuditEvent.findAll({ where: { entityId: testId, action: 'STATE_CHANGE' }, transaction: t });
        if (logs3.length !== 1) throw new Error('Transition Log Failed');
        console.log('✅ AuditService.logTransition Works');

        await t.rollback();
        console.log('--- Audit Subsystem Verified ---');
        process.exit(0);

    } catch (e) {
        console.error('VERIFY FAILED', e);
        await t.rollback();
        process.exit(1);
    }
}

verifyAuditSimple();
