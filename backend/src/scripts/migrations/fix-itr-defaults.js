// =====================================================
// MIGRATION: Fix ITR table defaults (id/created_at/updated_at)
// =====================================================
// Makes itr_filings and itr_drafts resilient across environments where defaults are missing.
//
// Usage:
//   node backend/src/scripts/migrations/fix-itr-defaults.js
//
// Notes:
// - Uses gen_random_uuid() if available (pgcrypto), else uuid_generate_v4() if uuid-ossp is available.
// - Safe to run multiple times.

require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });
require('dotenv').config();

const { sequelize } = require('../../config/database');
const enterpriseLogger = require('../../utils/logger');

async function fixItrDefaults() {
  try {
    enterpriseLogger.info('Fixing ITR table defaults...');
    console.log('\n=== Fix ITR Defaults (itr_filings, itr_drafts) ===\n');

    // Ensure one UUID generator exists
    // Prefer pgcrypto (gen_random_uuid)
    await sequelize.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);
    // Also try uuid-ossp (uuid_generate_v4) for older installs
    await sequelize.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);

    // Helper: set default for id using whichever function exists
    // We can't easily branch in SQL without checking, so we attempt gen_random_uuid first, fallback to uuid_generate_v4.
    const setIdDefault = async (tableName) => {
      try {
        await sequelize.query(`ALTER TABLE ${tableName} ALTER COLUMN id SET DEFAULT gen_random_uuid();`);
        console.log(`✅ ${tableName}.id default set to gen_random_uuid()`);        
      } catch (e) {
        await sequelize.query(`ALTER TABLE ${tableName} ALTER COLUMN id SET DEFAULT uuid_generate_v4();`);
        console.log(`✅ ${tableName}.id default set to uuid_generate_v4()`);        
      }
    };

    // itr_filings defaults
    console.log('Updating itr_filings defaults...');
    await setIdDefault('itr_filings');
    await sequelize.query(`ALTER TABLE itr_filings ALTER COLUMN created_at SET DEFAULT NOW();`);
    await sequelize.query(`ALTER TABLE itr_filings ALTER COLUMN updated_at SET DEFAULT NOW();`);
    await sequelize.query(`ALTER TABLE itr_filings ALTER COLUMN json_payload SET DEFAULT '{}'::jsonb;`);
    console.log('✅ itr_filings defaults updated');

    // itr_drafts defaults
    console.log('Updating itr_drafts defaults...');
    await setIdDefault('itr_drafts');
    await sequelize.query(`ALTER TABLE itr_drafts ALTER COLUMN created_at SET DEFAULT NOW();`);
    await sequelize.query(`ALTER TABLE itr_drafts ALTER COLUMN updated_at SET DEFAULT NOW();`);
    await sequelize.query(`ALTER TABLE itr_drafts ALTER COLUMN data SET DEFAULT '{}'::jsonb;`);
    await sequelize.query(`ALTER TABLE itr_drafts ALTER COLUMN is_completed SET DEFAULT false;`);
    await sequelize.query(`ALTER TABLE itr_drafts ALTER COLUMN last_saved_at SET DEFAULT NOW();`);
    console.log('✅ itr_drafts defaults updated');

    enterpriseLogger.info('✅ ITR defaults fixed successfully');
    console.log('\n✅ Migration completed successfully!\n');
    process.exit(0);
  } catch (error) {
    enterpriseLogger.error('fix-itr-defaults migration failed', {
      error: error.message,
      stack: error.stack,
    });
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

fixItrDefaults();


