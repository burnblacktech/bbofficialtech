/**
 * Database Migration: Add ITR Determination Fields
 * Run with: node src/migrations/add-itr-determination-fields.js
 */

const { sequelize } = require('../config/database');

async function migrate() {
    try {
        console.log('Starting migration: Add ITR determination fields...');

        // Add determined_itr column
        await sequelize.query(`
      ALTER TABLE itr_filings 
      ADD COLUMN IF NOT EXISTS determined_itr VARCHAR(10);
    `);
        console.log('✓ Added determined_itr column');

        // Add determination_data column
        await sequelize.query(`
      ALTER TABLE itr_filings 
      ADD COLUMN IF NOT EXISTS determination_data JSONB;
    `);
        console.log('✓ Added determination_data column');

        // Add income source flags
        await sequelize.query(`
      ALTER TABLE itr_filings 
      ADD COLUMN IF NOT EXISTS has_salary_income BOOLEAN DEFAULT false;
    `);
        console.log('✓ Added has_salary_income column');

        await sequelize.query(`
      ALTER TABLE itr_filings 
      ADD COLUMN IF NOT EXISTS has_house_property BOOLEAN DEFAULT false;
    `);
        console.log('✓ Added has_house_property column');

        await sequelize.query(`
      ALTER TABLE itr_filings 
      ADD COLUMN IF NOT EXISTS has_business_income BOOLEAN DEFAULT false;
    `);
        console.log('✓ Added has_business_income column');

        await sequelize.query(`
      ALTER TABLE itr_filings 
      ADD COLUMN IF NOT EXISTS has_capital_gains BOOLEAN DEFAULT false;
    `);
        console.log('✓ Added has_capital_gains column');

        // Add indexes
        await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_itr_filings_determined_itr 
      ON itr_filings(determined_itr);
    `);
        console.log('✓ Added index on determined_itr');

        // Add comments
        await sequelize.query(`
      COMMENT ON COLUMN itr_filings.determined_itr IS 'Determined ITR form (ITR-1/2/3/4)';
    `);
        await sequelize.query(`
      COMMENT ON COLUMN itr_filings.determination_data IS 'Data used for ITR determination';
    `);
        console.log('✓ Added column comments');

        console.log('Migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
