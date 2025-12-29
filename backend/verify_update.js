const { sequelize } = require('./src/config/database');
const crypto = require('crypto');

async function verifyUpdate() {
    console.log('--- DB Write Test ---');
    const t = await sequelize.transaction();
    const id = crypto.randomUUID();
    const userId = crypto.randomUUID();
    try {
        console.log('1. User Insert');
        await sequelize.query(`INSERT INTO users (id, email, full_name, role, auth_provider, token_version, status, created_at, updated_at) VALUES ('${userId}', 'test_${id}@q.com', 'T', 'END_USER', 'LOCAL', 0, 'active', NOW(), NOW())`, { transaction: t });

        console.log('2. Filing Insert');
        await sequelize.query(`INSERT INTO itr_filings (id, user_id, assessment_year, lifecycle_state, status, created_at, updated_at) VALUES ('${id}', '${userId}', '2024-25', 'DRAFT_INIT', 'draft', NOW(), NOW())`, { transaction: t });

        console.log('3. Filing Update (Test Columns)');
        await sequelize.query(`UPDATE itr_filings SET rejection_reason = 'TEST', ack_number = 'TEST' WHERE id = '${id}'`, { transaction: t });

        console.log('✅ Update Success');
        await t.rollback();
        process.exit(0);
    } catch (e) {
        console.error('❌ FAIL:', e.original ? e.original.message : e.message);
        await t.rollback();
        process.exit(1);
    }
}
verifyUpdate();
