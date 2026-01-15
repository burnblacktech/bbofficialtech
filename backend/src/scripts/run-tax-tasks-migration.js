/**
 * Migration Runner
 * Script to run the tax_tasks migration
 */

const fs = require('fs');
const path = require('path');
const db = require('../config/database');

async function runMigration() {
    try {
        console.log('Reading migration file...');
        const sqlPath = path.join(__dirname, '../migrations/add-tax-tasks-table-simple.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Executing SQL...');
        const { sequelize } = db;
        await sequelize.query(sql);

        console.log('Migration successful!');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

runMigration();
