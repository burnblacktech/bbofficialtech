// =====================================================
// MIGRATION: Add idempotency_key to itr_filings
// Prevent duplicate filing/draft creation when clients retry POST /itr/drafts
// Usage: node src/scripts/migrations/add-itr-filings-idempotency-key.js
// =====================================================

const { sequelize } = require('../../config/database');
const enterpriseLogger = require('../../utils/logger');

async function addIdempotencyKeyToItrFilings() {
  try {
    enterpriseLogger.info('Starting migration: add idempotency_key to itr_filings');
    console.log('\n=== Migration: Add idempotency_key to itr_filings ===\n');

    // Ensure itr_filings exists
    const [tables] = await sequelize.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'itr_filings'
    `);

    if (!tables?.length) {
      console.log('⚠️  itr_filings table does not exist. Run create-itr-tables.js first.');
      return;
    }

    // Check existing columns
    const [columns] = await sequelize.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'itr_filings'
    `);
    const existingColumns = (columns || []).map(c => c.column_name);

    if (!existingColumns.includes('idempotency_key')) {
      console.log('Adding column itr_filings.idempotency_key...');
      await sequelize.query(`
        ALTER TABLE itr_filings
        ADD COLUMN idempotency_key TEXT
      `);
      console.log('✅ Added column: idempotency_key');
    } else {
      console.log('✅ Column already exists: idempotency_key');
    }

    console.log('Creating indexes for idempotency_key...');
    // Per-user idempotency: allow same key across different users, but not within the same user.
    await sequelize.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_itr_filings_user_idempotency_key_unique
      ON itr_filings(user_id, idempotency_key)
      WHERE idempotency_key IS NOT NULL
    `);
    console.log('✅ Created unique index: idx_itr_filings_user_idempotency_key_unique');

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_itr_filings_idempotency_key
      ON itr_filings(idempotency_key)
      WHERE idempotency_key IS NOT NULL
    `);
    console.log('✅ Created index: idx_itr_filings_idempotency_key');

    console.log('\n✅ Migration completed successfully.\n');
  } catch (error) {
    enterpriseLogger.error('Migration failed: add idempotency_key to itr_filings', { error: error.message });
    console.error('\n❌ Migration failed:', error);
    process.exitCode = 1;
  } finally {
    try {
      await sequelize.close();
    } catch {
      // ignore
    }
  }
}

addIdempotencyKeyToItrFilings();


