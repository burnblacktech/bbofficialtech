/**
 * Migration: Add soft-delete infrastructure to itr_filings table
 * Run: node backend/scripts/add-soft-delete-column.js
 *
 * Adds: deleted_at column (DATE, nullable)
 * Creates: partial unique index on (user_id, assessment_year, itr_type) WHERE deleted_at IS NULL
 * Safe to run multiple times (idempotent — checks if column/index exist first)
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { sequelize } = require('../src/config/database');

async function migrate() {
  try {
    await sequelize.authenticate();
    console.log('Connected to database');

    const qi = sequelize.getQueryInterface();
    const columns = await qi.describeTable('itr_filings');

    // 1. Add deleted_at column
    if (!columns.deleted_at) {
      await qi.addColumn('itr_filings', 'deleted_at', {
        type: require('sequelize').DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
      });
      console.log('Added deleted_at column');
    } else {
      console.log('deleted_at column already exists');
    }

    // 2. Create partial unique index for active filings
    const indexName = 'idx_itr_filings_unique_active';
    const [indexes] = await sequelize.query(
      `SELECT indexname FROM pg_indexes WHERE tablename = 'itr_filings' AND indexname = '${indexName}'`
    );

    if (indexes.length === 0) {
      await sequelize.query(`
        CREATE UNIQUE INDEX ${indexName}
        ON itr_filings (user_id, assessment_year, itr_type)
        WHERE deleted_at IS NULL
      `);
      console.log('Created partial unique index: ' + indexName);
    } else {
      console.log('Partial unique index already exists: ' + indexName);
    }

    console.log('Migration complete');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  }
}

migrate();
