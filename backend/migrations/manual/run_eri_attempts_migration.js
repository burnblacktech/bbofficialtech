// =====================================================
// RUN ERI SUBMISSION ATTEMPTS MIGRATION
// S21: Creates eri_submission_attempts table
// =====================================================

const fs = require('fs');
const path = require('path');
const { sequelize } = require('./src/config/database');

async function runMigration() {
    try {
        console.log('Running ERI Submission Attempts migration...\n');

        // Read SQL file
        const sqlPath = path.join(__dirname, 'migrations', 'create_eri_submission_attempts.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        // Execute migration
        await sequelize.query(sql);

        console.log('✅ Migration completed successfully\n');
        console.log('Table created: eri_submission_attempts');
        console.log('Indexes created: filing_id, next_attempt_at, status\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

runMigration();
