// =====================================================
// VERIFY CONNECTION AND CHECK SCHEMA BEFORE MIGRATION
// =====================================================

require('dotenv').config();
const { Sequelize } = require('sequelize');
const enterpriseLogger = require('../utils/logger');
const dns = require('dns').promises;

const verifyConnectionAndSchema = async () => {
  console.log('\n=== Database Connection & Schema Verification ===\n');
  
  // Step 1: Test DNS resolution
  console.log('1. Testing DNS Resolution...');
  const hostsToTest = [
    'db.cgdafnbmqalyjchvhwsf.supabase.co',
    'aws-0-ap-south-1.pooler.supabase.com',
    'cgdafnbmqalyjchvhwsf.supabase.co',
  ];
  
  let workingHost = null;
  for (const host of hostsToTest) {
    try {
      const addresses = await dns.resolve4(host);
      console.log(`   ✅ ${host} resolves to: ${addresses[0]}`);
      if (!workingHost) workingHost = host;
    } catch (error) {
      console.log(`   ❌ ${host} - ${error.message}`);
    }
  }
  console.log('');
  
  if (!workingHost) {
    console.error('❌ No hostnames resolve! This suggests:');
    console.error('   1. Supabase project is PAUSED - go to dashboard and restore it');
    console.error('   2. Hostnames are incorrect - verify in Supabase dashboard');
    console.error('   3. Network/DNS issues - check internet connection\n');
    process.exit(1);
  }
  
  // Step 2: Test connection strings
  console.log('2. Testing Connection Strings...');
  
  const connectionStrings = [];
  
  // Test DIRECT_URI
  if (process.env.DIRECT_URI) {
    const uri = process.env.DIRECT_URI.replace(/^["']|["']$/g, '');
    const match = uri.match(/@([^:]+):/);
    if (match && match[1] === workingHost) {
      connectionStrings.push({ name: 'DIRECT_URI', uri });
    }
  }
  
  // Test SUPABASE_DATABASE_URL
  if (process.env.SUPABASE_DATABASE_URL) {
    const uri = process.env.SUPABASE_DATABASE_URL.replace(/^["']|["']$/g, '');
    const match = uri.match(/@([^:]+):/);
    if (match && match[1] === workingHost) {
      connectionStrings.push({ name: 'SUPABASE_DATABASE_URL', uri });
    }
  }
  
  if (connectionStrings.length === 0) {
    console.error('❌ No connection strings match working hostname!');
    console.error('   Update .env file with correct connection strings from Supabase dashboard\n');
    process.exit(1);
  }
  
  // Step 3: Test actual database connection
  console.log('3. Testing Database Connection...');
  let sequelize = null;
  let connected = false;
  
  for (const conn of connectionStrings) {
    try {
      console.log(`   Trying ${conn.name}...`);
      sequelize = new Sequelize(conn.uri, {
        dialect: 'postgres',
        logging: false,
        dialectOptions: {
          ssl: {
            require: true,
            rejectUnauthorized: false,
          },
          connectTimeout: 10000,
        },
      });
      
      await sequelize.authenticate();
      console.log(`   ✅ ${conn.name}: Connection successful!\n`);
      connected = true;
      break;
    } catch (error) {
      console.log(`   ❌ ${conn.name}: ${error.message}`);
      if (sequelize) {
        try {
          await sequelize.close();
        } catch (e) {
          // Ignore close errors
        }
      }
    }
  }
  
  if (!connected) {
    console.error('\n❌ All connection attempts failed!');
    console.error('   Check:');
    console.error('   1. Password is correct');
    console.error('   2. Database credentials in .env match Supabase dashboard');
    console.error('   3. IP allowlist allows your IP (or is disabled)\n');
    process.exit(1);
  }
  
  // Step 4: Check current schema
  console.log('4. Checking Current Database Schema...');
  try {
    const tables = await sequelize.getQueryInterface().showAllTables();
    console.log(`   Found ${tables.length} tables in database:\n`);
    
    if (tables.length === 0) {
      console.log('   ℹ️  Database is empty - ready for migration\n');
    } else {
      tables.forEach((table, index) => {
        console.log(`   ${index + 1}. ${table}`);
      });
      console.log('');
      
      // Check if users table exists and its structure
      if (tables.includes('users')) {
        console.log('5. Checking users table structure...');
        try {
          const usersTableInfo = await sequelize.getQueryInterface().describeTable('users');
          const columns = Object.keys(usersTableInfo);
          console.log(`   ✅ users table exists with ${columns.length} columns`);
          
          // Check for OAuth columns
          const oauthColumns = ['provider_id', 'auth_provider', 'google_id'];
          const missingColumns = oauthColumns.filter(col => !columns.includes(col));
          
          if (missingColumns.length > 0) {
            console.log(`   ⚠️  Missing OAuth columns: ${missingColumns.join(', ')}`);
            console.log('   → Migration will add these columns\n');
          } else {
            console.log('   ✅ All OAuth columns present\n');
          }
        } catch (error) {
          console.log(`   ⚠️  Could not describe users table: ${error.message}\n`);
        }
      } else {
        console.log('   ℹ️  users table does not exist - will be created by migration\n');
      }
    }
  } catch (error) {
    console.error(`   ❌ Error checking schema: ${error.message}\n`);
  }
  
  // Step 5: Summary
  console.log('=== Summary ===');
  console.log('✅ DNS resolution: OK');
  console.log('✅ Database connection: OK');
  console.log('✅ Schema check: Complete');
  console.log('\n✅ Ready for migration!\n');
  console.log('Next step: Run "npm run db:migrate"\n');
  
  await sequelize.close();
  process.exit(0);
};

verifyConnectionAndSchema().catch(error => {
  console.error('\n❌ Verification failed:', error.message);
  if (error.stack) {
    console.error(error.stack.split('\n').slice(0, 5).join('\n'));
  }
  process.exit(1);
});

