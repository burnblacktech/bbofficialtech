/**
 * Migration Script: Add financial_year to documents table
 * This script adds the missing financial_year column to the documents table
 */

const { sequelize } = require('../config/database');
const enterpriseLogger = require('../utils/logger');

async function migrate() {
    try {
        enterpriseLogger.info('Starting migration: Add financial_year to documents table');

        // Check if column already exists
        const [results] = await sequelize.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'documents' AND column_name = 'financial_year';
        `);

        if (results.length > 0) {
            enterpriseLogger.info('Column financial_year already exists in documents table');
            return;
        }

        // Add the column
        await sequelize.query(`
            ALTER TABLE documents 
            ADD COLUMN financial_year VARCHAR(10) DEFAULT '2024-25';
        `);

        enterpriseLogger.info('Successfully added financial_year column to documents table');

        // Optional: Update initial documents if any to a default value (already done by DEFAULT clause above)

    } catch (error) {
        enterpriseLogger.error('Migration failed:', error);
        process.exit(1);
    } finally {
        await sequelize.close();
    }
}

migrate();
