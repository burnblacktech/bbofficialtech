// =====================================================
// DATABASE VERIFICATION SCRIPT
// Verifies Supabase connection and schema
// =====================================================

// Load environment variables first
require('dotenv').config();

const { sequelize, testConnection } = require('../config/database');
const { User } = require('../models');
const enterpriseLogger = require('../utils/logger');

const verifyDatabase = async () => {
  try {
    console.log('\n=== Database Verification ===\n');
    
    // 1. Test connection
    console.log('1. Testing database connection...');
    const connected = await testConnection();
    if (!connected) {
      console.error('❌ Database connection failed!');
      process.exit(1);
    }
    console.log('✅ Database connection successful\n');
    
    // 2. List all tables
    console.log('2. Checking database schema...');
    const tables = await sequelize.getQueryInterface().showAllTables();
    console.log(`✅ Found ${tables.length} tables:`);
    tables.forEach((table, index) => {
      console.log(`   ${index + 1}. ${table}`);
    });
    console.log('');
    
    // 3. Check if users table exists
    console.log('3. Verifying users table...');
    const hasUsersTable = tables.includes('users');
    if (!hasUsersTable) {
      console.error('❌ Users table not found!');
      console.log('   Run: npm run db:migrate');
      process.exit(1);
    }
    console.log('✅ Users table exists\n');
    
    // 4. Check users table structure
    console.log('4. Checking users table structure...');
    try {
      const queryInterface = sequelize.getQueryInterface();
      const usersTableInfo = await queryInterface.describeTable('users');
      console.log('✅ Users table columns:');
      Object.keys(usersTableInfo).forEach((column) => {
        const col = usersTableInfo[column];
        console.log(`   - ${column}: ${col.type}${col.allowNull ? ' (nullable)' : ' (required)'}`);
      });
      console.log('');
      
      // Check for required OAuth columns
      const requiredColumns = ['provider_id', 'auth_provider', 'google_id'];
      const missingColumns = requiredColumns.filter(col => !usersTableInfo[col]);
      if (missingColumns.length > 0) {
        console.error(`❌ Missing required columns for OAuth: ${missingColumns.join(', ')}`);
        console.log('   Run: npm run db:migrate');
        process.exit(1);
      }
      console.log('✅ All required OAuth columns exist\n');
    } catch (error) {
      console.error('❌ Failed to describe users table:', error.message);
      console.log('   Run: npm run db:migrate');
      process.exit(1);
    }
    
    // 5. Test User model query
    console.log('5. Testing User model...');
    try {
      const userCount = await User.count();
      console.log(`✅ User model working (${userCount} users found)\n`);
    } catch (error) {
      console.error('❌ User model query failed:', error.message);
      console.log('   This might indicate a schema mismatch');
      console.log('   Run: npm run db:migrate');
      process.exit(1);
    }
    
    // 6. Check connection string format
    console.log('6. Connection configuration...');
    const usingConnectionString = !!process.env.SUPABASE_DATABASE_URL;
    const isSupabase = process.env.DB_HOST?.includes('supabase') || usingConnectionString;
    
    console.log(`   Using connection string: ${usingConnectionString ? 'Yes' : 'No'}`);
    console.log(`   Detected as Supabase: ${isSupabase ? 'Yes' : 'No'}`);
    if (process.env.SUPABASE_DATABASE_URL) {
      const preview = process.env.SUPABASE_DATABASE_URL.substring(0, 50);
      console.log(`   Connection string preview: ${preview}...`);
    }
    console.log('');
    
    console.log('✅ Database verification complete!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Database verification failed:');
    console.error(`   Error: ${error.message}`);
    if (error.stack) {
      console.error(`   Stack: ${error.stack.split('\n').slice(0, 5).join('\n')}`);
    }
    console.log('\n   Troubleshooting:');
    console.log('   1. Check your .env file for correct database credentials');
    console.log('   2. Ensure SUPABASE_DATABASE_URL is set correctly');
    console.log('   3. Run: npm run db:migrate to create tables');
    console.log('   4. Verify your Supabase project is active\n');
    process.exit(1);
  }
};

// Run verification
verifyDatabase();

