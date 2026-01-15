/**
 * Migration Script: Add financial_year to itr_filings table
 * This script adds the missing financial_year column to the itr_filings table
 */

const { sequelize } = require('../config/database');
const enterpriseLogger = require('../utils/logger');

async function migrate() {
    try {
        enterpriseLogger.info('Starting migration: Add financial_year to itr_filings table');

        // Check if column already exists
        const [results] = await sequelize.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'itr_filings' AND column_name = 'financial_year';
        `);

        if (results.length > 0) {
            enterpriseLogger.info('Column financial_year already exists in itr_filings table');
            return;
        }

        // Add the column
        await sequelize.query(`
            ALTER TABLE itr_filings 
            ADD COLUMN financial_year VARCHAR(10) DEFAULT '2024-25';
        `);

        enterpriseLogger.info('Successfully added financial_year column to itr_filings table');

    } catch (error) {
        enterpriseLogger.error('Migration failed:', error);
        process.exit(1);
    } finally {
        await sequelize.close();
    }
}

migrate();
