// =====================================================
// CONNECTION TEST SCRIPT
// Tests different Supabase connection methods
// =====================================================

require('dotenv').config();
const { Sequelize } = require('sequelize');
const enterpriseLogger = require('../utils/logger');

const testConnection = async (name, connectionString, options = {}) => {
  console.log(`\n=== Testing ${name} ===`);
  console.log(`Connection string: ${connectionString.substring(0, 60)}...`);
  
  try {
    const sequelize = new Sequelize(connectionString, {
      dialect: 'postgres',
      logging: false,
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
        connectTimeout: 10000,
      },
      ...options,
    });
    
    await sequelize.authenticate();
    console.log(`✅ ${name}: Connection successful!`);
    
    // Test a simple query
    const [results] = await sequelize.query('SELECT version()');
    console.log(`✅ ${name}: Query test successful`);
    
    await sequelize.close();
    return true;
  } catch (error) {
    console.error(`❌ ${name}: Failed`);
    console.error(`   Error: ${error.message}`);
    return false;
  }
};

const main = async () => {
  console.log('\n🔍 Testing Supabase Connection Methods\n');
  
  const results = [];
  
  // Test 1: DIRECT_URI (as-is)
  if (process.env.DIRECT_URI) {
    const directUri = process.env.DIRECT_URI.replace(/^["']|["']$/g, '');
    const success = await testConnection('DIRECT_URI (as-is)', directUri);
    results.push({ name: 'DIRECT_URI', success });
  }
  
  // Test 2: DIRECT_URI with URL-encoded password
  if (process.env.DIRECT_URI) {
    const directUri = process.env.DIRECT_URI.replace(/^["']|["']$/g, '');
    // URL encode the password part
    const encodedUri = directUri.replace(
      /:([^:@]+)@/,
      (match, password) => `:${encodeURIComponent(password)}@`
    );
    const success = await testConnection('DIRECT_URI (URL-encoded password)', encodedUri);
    results.push({ name: 'DIRECT_URI (encoded)', success });
  }
  
  // Test 3: SUPABASE_DATABASE_URL (pooler)
  if (process.env.SUPABASE_DATABASE_URL) {
    const poolerUrl = process.env.SUPABASE_DATABASE_URL.replace(/^["']|["']$/g, '');
    const success = await testConnection('SUPABASE_DATABASE_URL (pooler)', poolerUrl);
    results.push({ name: 'SUPABASE_DATABASE_URL', success });
  }
  
  // Test 4: Individual config
  if (process.env.DB_HOST && process.env.DB_USER && process.env.DB_PASSWORD) {
    const individualConfig = {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'postgres',
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      dialect: 'postgres',
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      },
    };
    
    try {
      const sequelize = new Sequelize(individualConfig);
      await sequelize.authenticate();
      console.log(`\n✅ Individual Config: Connection successful!`);
      const [results] = await sequelize.query('SELECT version()');
      console.log(`✅ Individual Config: Query test successful`);
      await sequelize.close();
      results.push({ name: 'Individual Config', success: true });
    } catch (error) {
      console.error(`\n❌ Individual Config: Failed`);
      console.error(`   Error: ${error.message}`);
      results.push({ name: 'Individual Config', success: false });
    }
  }
  
  // Summary
  console.log('\n=== Summary ===');
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  if (successful.length > 0) {
    console.log('\n✅ Working connection methods:');
    successful.forEach(r => console.log(`   - ${r.name}`));
  }
  
  if (failed.length > 0) {
    console.log('\n❌ Failed connection methods:');
    failed.forEach(r => console.log(`   - ${r.name}`));
  }
  
  if (successful.length === 0) {
    console.log('\n❌ No working connection method found!');
    console.log('\nTroubleshooting:');
    console.log('1. Verify your Supabase project is active');
    console.log('2. Check database credentials in .env');
    console.log('3. Ensure your IP is allowed in Supabase dashboard');
    console.log('4. Try using the direct connection URI from Supabase dashboard\n');
    process.exit(1);
  } else {
    console.log(`\n✅ Found ${successful.length} working connection method(s)!\n`);
    process.exit(0);
  }
};

main().catch(error => {
  console.error('Test script failed:', error);
  process.exit(1);
});

