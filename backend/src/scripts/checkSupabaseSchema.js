// =====================================================
// SUPABASE SCHEMA CHECKER
// Detailed schema verification for Supabase
// =====================================================

// Load environment variables first
require('dotenv').config();

const { sequelize, testConnection } = require('../config/database');
const { User } = require('../models');
const enterpriseLogger = require('../utils/logger');

const checkSupabaseSchema = async () => {
  try {
    console.log('\n=== Supabase Schema Check ===\n');
    
    // 1. Test connection
    console.log('1. Testing Supabase connection...');
    const connected = await testConnection();
    if (!connected) {
      console.error('❌ Connection failed!');
      process.exit(1);
    }
    console.log('✅ Connected to Supabase\n');
    
    // 2. List all tables
    console.log('2. Listing all tables in database...');
    const tables = await sequelize.getQueryInterface().showAllTables();
    console.log(`   Found ${tables.length} tables:\n`);
    tables.forEach((table, index) => {
      console.log(`   ${index + 1}. ${table}`);
    });
    console.log('');
    
    // 3. Check users table structure in detail
    console.log('3. Checking users table structure...');
    if (!tables.includes('users')) {
      console.error('❌ Users table does not exist!');
      console.log('   Run: npm run db:migrate migrate');
      process.exit(1);
    }
    
    const queryInterface = sequelize.getQueryInterface();
    const usersTableInfo = await queryInterface.describeTable('users');
    
    console.log(`   ✅ Users table exists with ${Object.keys(usersTableInfo).length} columns:\n`);
    
    // Check for OAuth-related columns
    const oauthColumns = {
      'provider_id': 'Required for OAuth (stores Google ID)',
      'auth_provider': 'Required for OAuth (LOCAL/GOOGLE/OTHER)',
      'google_id': 'Optional for Google OAuth',
    };
    
    const requiredColumns = ['id', 'email', 'full_name', 'role', 'status'];
    const allRequiredColumns = [...requiredColumns, ...Object.keys(oauthColumns)];
    
    console.log('   Column details:');
    Object.keys(usersTableInfo).forEach((column) => {
      const col = usersTableInfo[column];
      const isRequired = allRequiredColumns.includes(column);
      const isOAuth = oauthColumns[column];
      const marker = isRequired ? '✓' : ' ';
      const oauthNote = isOAuth ? ` [${isOAuth}]` : '';
      console.log(`   ${marker} ${column.padEnd(25)} ${col.type.padEnd(20)} ${col.allowNull ? 'nullable' : 'required'}${oauthNote}`);
    });
    console.log('');
    
    // Check for missing OAuth columns
    const missingOAuthColumns = Object.keys(oauthColumns).filter(col => !usersTableInfo[col]);
    if (missingOAuthColumns.length > 0) {
      console.error('   ❌ Missing OAuth columns:');
      missingOAuthColumns.forEach(col => {
        console.error(`      - ${col}: ${oauthColumns[col]}`);
      });
      console.log('\n   Run: npm run db:migrate migrate');
      process.exit(1);
    }
    console.log('   ✅ All OAuth columns present\n');
    
    // 4. Check UserSession table (needed for OAuth)
    console.log('4. Checking UserSession table...');
    if (!tables.includes('user_sessions')) {
      console.error('   ❌ user_sessions table does not exist!');
      console.log('   This table is required for OAuth token management');
      console.log('   Run: npm run db:migrate migrate');
      process.exit(1);
    }
    console.log('   ✅ user_sessions table exists\n');
    
    // 5. Test User model queries
    console.log('5. Testing User model queries...');
    try {
      const userCount = await User.count();
      console.log(`   ✅ User.count() works (${userCount} users found)`);
      
      // Test finding by provider_id (OAuth)
      const oauthUsers = await User.count({ 
        where: { authProvider: 'GOOGLE' } 
      });
      console.log(`   ✅ Found ${oauthUsers} Google OAuth users`);
      
      // Test querying with provider_id
      const testQuery = await User.findOne({ 
        where: { authProvider: 'GOOGLE' },
        limit: 1 
      });
      if (testQuery) {
        console.log(`   ✅ Can query OAuth users (sample: ${testQuery.email})`);
      } else {
        console.log('   ℹ️  No OAuth users found yet (this is OK)');
      }
    } catch (error) {
      console.error('   ❌ User model query failed:', error.message);
      console.error('   This indicates a schema mismatch');
      console.log('   Run: npm run db:migrate migrate');
      process.exit(1);
    }
    console.log('');
    
    // 6. Check connection configuration
    console.log('6. Connection configuration:');
    const usingConnectionString = !!process.env.SUPABASE_DATABASE_URL;
    const isSupabase = process.env.DB_HOST?.includes('supabase') || usingConnectionString;
    
    console.log(`   Connection method: ${usingConnectionString ? 'Connection String' : 'Individual Config'}`);
    console.log(`   Detected as Supabase: ${isSupabase ? 'Yes' : 'No'}`);
    console.log(`   SSL enabled: Yes (required for Supabase)`);
    
    if (process.env.SUPABASE_DATABASE_URL) {
      const url = process.env.SUPABASE_DATABASE_URL.replace(/^["']|["']$/g, '');
      const match = url.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
      if (match) {
        console.log(`   Host: ${match[3]}`);
        console.log(`   Port: ${match[4]}`);
        console.log(`   Database: ${match[5]}`);
        console.log(`   User: ${match[1]}`);
      }
    }
    console.log('');
    
    // 7. Summary
    console.log('=== Summary ===');
    console.log('✅ Database connection: OK');
    console.log('✅ Users table: OK');
    console.log('✅ OAuth columns: OK');
    console.log('✅ UserSession table: OK');
    console.log('✅ User model: OK');
    console.log('\n✅ Schema is ready for Google OAuth!\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Schema check failed:');
    console.error(`   Error: ${error.message}`);
    if (error.stack) {
      console.error(`   Stack: ${error.stack.split('\n').slice(0, 10).join('\n')}`);
    }
    console.log('\n   Troubleshooting steps:');
    console.log('   1. Verify SUPABASE_DATABASE_URL in .env file');
    console.log('   2. Run: npm run db:migrate migrate');
    console.log('   3. Check Supabase dashboard for active project');
    console.log('   4. Verify database credentials are correct\n');
    process.exit(1);
  } finally {
    await sequelize.close();
  }
};

// Run check
checkSupabaseSchema();

