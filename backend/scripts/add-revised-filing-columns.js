/**
 * Migration: Add revised filing columns to itr_filings table
 * Run: node backend/scripts/add-revised-filing-columns.js
 *
 * Adds: filing_type, original_ack_number, original_filing_id
 * Safe to run multiple times (checks if columns exist first)
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { sequelize } = require('../src/config/database');

async function migrate() {
  try {
    await sequelize.authenticate();
    console.log('Connected to database');

    const qi = sequelize.getQueryInterface();
    const columns = await qi.describeTable('itr_filings');

    if (!columns.filing_type) {
      await qi.addColumn('itr_filings', 'filing_type', {
        type: require('sequelize').DataTypes.STRING,
        allowNull: false,
        defaultValue: 'original',
      });
      console.log('Added filing_type column');
    } else {
      console.log('filing_type column already exists');
    }

    if (!columns.original_ack_number) {
      await qi.addColumn('itr_filings', 'original_ack_number', {
        type: require('sequelize').DataTypes.STRING,
        allowNull: true,
      });
      console.log('Added original_ack_number column');
    } else {
      console.log('original_ack_number column already exists');
    }

    if (!columns.original_filing_id) {
      await qi.addColumn('itr_filings', 'original_filing_id', {
        type: require('sequelize').DataTypes.UUID,
        allowNull: true,
      });
      console.log('Added original_filing_id column');
    } else {
      console.log('original_filing_id column already exists');
    }

    console.log('Migration complete');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  }
}

migrate();
