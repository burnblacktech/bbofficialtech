const { sequelize } = require('./src/config/database');

async function patchEnums() {
    console.log('--- Patching ENUMs for V4 States ---');
    try {
        const values = [
            'READY_TO_FILE',
            'SUBMITTED_TO_CA',
            'CA_APPROVED',
            'ERI_IN_PROGRESS',
            'ERI_ACK_RECEIVED',
            'FILED',
            'ERI_FAILED',
            'CANCELLED'
        ];

        for (const val of values) {
            try {
                // Postgres allows Adding Value. 
                // Must be done outside transaction block usually, OR cannot ran inside same transaction as usage.
                // We run raw query.
                await sequelize.query(`ALTER TYPE "enum_itr_filings_status" ADD VALUE IF NOT EXISTS '${val}'`);
                console.log(`Added ENUM value: ${val}`);
            } catch (e) {
                // If it fails, maybe it exists (PG<12 doesn't support IF NOT EXISTS in ADD VALUE, but we assume PG12+)
                // Or "Duplicate value".
                console.log(`Skipped ${val}: ${e.message}`);
            }
        }

        console.log('✅ Enums Patched');
        process.exit(0);
    } catch (e) {
        console.error('Patch Failed', e);
        process.exit(1);
    }
}

patchEnums();
