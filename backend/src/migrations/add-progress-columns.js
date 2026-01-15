/**
 * Migration: Add progress and last_updated columns to itr_filings table
 * Run with: node src/migrations/add-progress-columns.js
 */

const { sequelize } = require('../config/database');

async function migrate() {
    try {
        console.log('Starting migration: Add progress and last_updated columns...');

        // Add progress column
        await sequelize.query(`
      ALTER TABLE itr_filings 
      ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100);
    `);
        console.log('✓ Added progress column');

        // Add last_updated column
        await sequelize.query(`
      ALTER TABLE itr_filings 
      ADD COLUMN IF NOT EXISTS last_updated TIMESTAMP;
    `);
        console.log('✓ Added last_updated column');

        // Add comment
        await sequelize.query(`
      COMMENT ON COLUMN itr_filings.progress IS 'Filing completion progress (0-100)';
    `);
        console.log('✓ Added column comment');

        console.log('Migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
