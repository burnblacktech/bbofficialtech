/**
 * Migration: Add version column to itr_filings table (optimistic locking)
 * Run: node backend/scripts/add-version-column.js
 *
 * Adds: version INTEGER NOT NULL DEFAULT 0
 * Safe to run multiple times (checks if column exists first)
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { sequelize } = require('../src/config/database');

async function migrate() {
  try {
    await sequelize.authenticate();
    console.log('Connected to database');

    const qi = sequelize.getQueryInterface();
    const columns = await qi.describeTable('itr_filings');

    if (!columns.version) {
      await qi.addColumn('itr_filings', 'version', {
        type: require('sequelize').DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      });
      console.log('Added version column');
    } else {
      console.log('version column already exists');
    }

    console.log('Migration complete');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  }
}

migrate();
