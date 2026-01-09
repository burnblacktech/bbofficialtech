// =====================================================
// MIGRATION: Add jsonPayload to itr_filings
// =====================================================

const { sequelize } = require('./src/config/database');

async function runMigration() {
    try {
        console.log('Running migration: add_json_payload_to_itr_filings...\n');

        // Add column
        await sequelize.query(`
            ALTER TABLE public.itr_filings
            ADD COLUMN IF NOT EXISTS json_payload JSONB NOT NULL DEFAULT '{}'::jsonb;
        `);
        console.log('✅ Added json_payload column');

        // Add comment
        await sequelize.query(`
            COMMENT ON COLUMN public.itr_filings.json_payload IS 'All filing data: income, deductions, capital gains, regime comparison, etc.';
        `);
        console.log('✅ Added column comment');

        // Create GIN index
        await sequelize.query(`
            CREATE INDEX IF NOT EXISTS idx_itr_filings_json_payload ON public.itr_filings USING GIN (json_payload);
        `);
        console.log('✅ Created GIN index');

        // Verify
        const [results] = await sequelize.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'itr_filings'
              AND column_name = 'json_payload';
        `);

        console.log('\nVerification:');
        console.log(results[0]);

        console.log('\n✅ Migration complete!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    }
}

runMigration();
