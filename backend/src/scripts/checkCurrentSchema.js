// =====================================================
// CHECK CURRENT DATABASE SCHEMA
// Shows what tables and columns currently exist
// =====================================================

require('dotenv').config();
const { sequelize } = require('../config/database');

const checkSchema = async () => {
  try {
    console.log('\n=== Current Database Schema ===\n');
    
    const queryInterface = sequelize.getQueryInterface();
    
    // List all tables
    const tables = await queryInterface.showAllTables();
    console.log(`Found ${tables.length} tables:\n`);
    
    for (const table of tables) {
      console.log(`Table: ${table}`);
      try {
        const columns = await queryInterface.describeTable(table);
        console.log(`  Columns (${Object.keys(columns).length}):`);
        Object.keys(columns).forEach(col => {
          const colInfo = columns[col];
          console.log(`    - ${col}: ${colInfo.type}${colInfo.allowNull ? ' (nullable)' : ' (required)'}`);
        });
        
        // Check for indexes
        const indexes = await queryInterface.showIndex(table);
        if (indexes.length > 0) {
          console.log(`  Indexes (${indexes.length}):`);
          indexes.forEach(idx => {
            console.log(`    - ${idx.name}: ${idx.fields.map(f => f.attribute).join(', ')}`);
          });
        }
        console.log('');
      } catch (error) {
        console.log(`  Error describing table: ${error.message}\n`);
      }
    }
    
    // Specifically check ca_firms table
    if (tables.includes('ca_firms')) {
      console.log('=== CA_FIRMS Table Details ===\n');
      const caFirmsColumns = await queryInterface.describeTable('ca_firms');
      console.log('Current columns:');
      Object.keys(caFirmsColumns).forEach(col => {
        console.log(`  - ${col}`);
      });
      
      // Check for foreign keys
      try {
        const [fkResults] = await sequelize.query(`
          SELECT
            tc.constraint_name, 
            tc.table_name, 
            kcu.column_name, 
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name 
          FROM information_schema.table_constraints AS tc 
          JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
          JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
          WHERE tc.constraint_type = 'FOREIGN KEY' 
            AND tc.table_name = 'ca_firms';
        `);
        
        if (fkResults.length > 0) {
          console.log('\nForeign Keys:');
          fkResults.forEach(fk => {
            console.log(`  - ${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`);
          });
        }
      } catch (error) {
        console.log(`\nCould not check foreign keys: ${error.message}`);
      }
    }
    
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('Error checking schema:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

checkSchema();

