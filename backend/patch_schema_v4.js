const { sequelize } = require('./src/config/database');

async function patchSchema() {
    console.log('--- Patching Schema for V4.3 ---');
    try {
        await sequelize.query(`
            ALTER TABLE itr_filings 
            ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
            ADD COLUMN IF NOT EXISTS ack_number TEXT,
            ADD COLUMN IF NOT EXISTS filed_at TIMESTAMPTZ,
            ADD COLUMN IF NOT EXISTS filed_by UUID
        `);
        console.log('✅ Schema Patched (rejection_reason, ack_number, filed_at, filed_by ensured)');
        process.exit(0);
    } catch (e) {
        console.error('Patch Failed', e);
        process.exit(1);
    }
}

patchSchema();
