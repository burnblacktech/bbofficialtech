// =====================================================
// FIX CA_FIRMS SCHEMA - RENAME owner_id TO created_by
// Run this BEFORE migration if ca_firms table has owner_id column
// =====================================================

require('dotenv').config();
const { sequelize } = require('../config/database');
const enterpriseLogger = require('../utils/logger');

const fixCAFirmSchema = async () => {
  try {
    console.log('\n=== Fixing CA_FIRMS Schema ===\n');
    
    const queryInterface = sequelize.getQueryInterface();
    
    // Check if ca_firms table exists
    const tables = await queryInterface.showAllTables();
    if (!tables.includes('ca_firms')) {
      console.log('✅ ca_firms table does not exist - nothing to fix\n');
      await sequelize.close();
      process.exit(0);
    }
    
    console.log('Checking ca_firms table schema...');
    const columns = await queryInterface.describeTable('ca_firms');
    
    if (!columns.owner_id) {
      console.log('✅ owner_id column does not exist - schema is already correct\n');
      await sequelize.close();
      process.exit(0);
    }
    
    if (columns.created_by) {
      console.log('✅ created_by column already exists');
      console.log('   You may want to drop owner_id column manually if it\'s no longer needed\n');
      await sequelize.close();
      process.exit(0);
    }
    
    console.log('⚠️  Found owner_id column that needs to be renamed to created_by\n');
    
    // Step 1: Find all dependencies
    console.log('Step 1: Finding dependencies on owner_id...');
    const [fkResults] = await sequelize.query(`
      SELECT 
        tc.constraint_name, 
        tc.constraint_type,
        kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_name = 'ca_firms' 
        AND kcu.column_name = 'owner_id';
    `);
    
    const [indexResults] = await sequelize.query(`
      SELECT indexname, indexdef
      FROM pg_indexes 
      WHERE tablename = 'ca_firms' 
        AND (indexdef LIKE '%owner_id%' OR indexname LIKE '%owner_id%');
    `);
    
    console.log(`   Found ${fkResults.length} constraints`);
    console.log(`   Found ${indexResults.length} indexes\n`);
    
    // Step 2: Drop foreign key constraints
    if (fkResults.length > 0) {
      console.log('Step 2: Dropping foreign key constraints...');
      for (const fk of fkResults) {
        if (fk.constraint_type === 'FOREIGN KEY') {
          console.log(`   Dropping: ${fk.constraint_name}`);
          await sequelize.query(
            `ALTER TABLE ca_firms DROP CONSTRAINT IF EXISTS "${fk.constraint_name}";`
          );
        }
      }
      console.log('   ✅ Foreign keys dropped\n');
    }
    
    // Step 3: Drop indexes
    if (indexResults.length > 0) {
      console.log('Step 3: Dropping indexes...');
      for (const idx of indexResults) {
        console.log(`   Dropping: ${idx.indexname}`);
        await sequelize.query(`DROP INDEX IF EXISTS "${idx.indexname}";`);
      }
      console.log('   ✅ Indexes dropped\n');
    }
    
    // Step 4: Rename column
    console.log('Step 4: Renaming owner_id to created_by...');
    await queryInterface.renameColumn('ca_firms', 'owner_id', 'created_by');
    console.log('   ✅ Column renamed\n');
    
    // Step 5: Recreate foreign key constraint
    console.log('Step 5: Recreating foreign key constraint...');
    try {
      await sequelize.query(`
        ALTER TABLE ca_firms 
        ADD CONSTRAINT ca_firms_created_by_fkey 
        FOREIGN KEY (created_by) REFERENCES users(id);
      `);
      console.log('   ✅ Foreign key constraint recreated\n');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('   ℹ️  Foreign key constraint already exists\n');
      } else {
        console.log(`   ⚠️  Could not recreate FK: ${error.message}`);
        console.log('   You may need to add it manually\n');
      }
    }
    
    console.log('✅ Schema fix completed successfully!\n');
    console.log('Next step: Run "npm run db:migrate"\n');
    
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Schema fix failed:');
    console.error(`   Error: ${error.message}`);
    if (error.stack) {
      console.error(`   Stack: ${error.stack.split('\n').slice(0, 5).join('\n')}`);
    }
    console.log('\n   Troubleshooting:');
    console.log('   1. Check if users table exists');
    console.log('   2. Verify database connection');
    console.log('   3. Check if there are views or triggers using owner_id\n');
    await sequelize.close();
    process.exit(1);
  }
};

fixCAFirmSchema();

