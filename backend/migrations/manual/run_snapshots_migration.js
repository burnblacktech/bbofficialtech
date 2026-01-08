// =====================================================
// MIGRATION: Add snapshots to itr_filings (S18)
// =====================================================

const { sequelize } = require('./src/config/database');

async function runMigration() {
    try {
        console.log('Running migration: add_snapshots_to_itr_filings...\n');

        // Add column
        await sequelize.query(`
            ALTER TABLE public.itr_filings
            ADD COLUMN IF NOT EXISTS snapshots JSONB NOT NULL DEFAULT '[]'::jsonb;
        `);
        console.log('✅ Added snapshots column');

        // Add comment
        await sequelize.query(`
            COMMENT ON COLUMN public.itr_filings.snapshots IS 'Immutable snapshots at lifecycle transitions';
        `);
        console.log('✅ Added column comment');

        // Create GIN index
        await sequelize.query(`
            CREATE INDEX IF NOT EXISTS idx_itr_filings_snapshots ON public.itr_filings USING GIN (snapshots);
        `);
        console.log('✅ Created GIN index');

        // Verify
        const [results] = await sequelize.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'itr_filings'
              AND column_name = 'snapshots';
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
