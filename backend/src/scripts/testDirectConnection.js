// =====================================================
// TEST DIRECT CONNECTION TO SUPABASE
// Tests the exact connection string format
// =====================================================

require('dotenv').config();
const { Sequelize } = require('sequelize');

const testConnection = async () => {
  console.log('\n=== Testing Supabase Direct Connection ===\n');
  
  // Use the exact connection string format from Supabase
  const connectionString = 'postgresql://postgres:BNZKHp6c4mJddMFm@db.cgdafnbmqalyjchvhwsf.supabase.co:5432/postgres';
  
  console.log('Connection String:');
  console.log(`postgresql://postgres:***@db.cgdafnbmqalyjchvhwsf.supabase.co:5432/postgres\n`);
  
  console.log('Attempting connection...');
  
  try {
    const sequelize = new Sequelize(connectionString, {
      dialect: 'postgres',
      logging: (msg) => console.log(`   SQL: ${msg}`),
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
        connectTimeout: 30000, // 30 seconds
      },
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
    });
    
    console.log('   Testing authentication...');
    await sequelize.authenticate();
    console.log('   ✅ Connection successful!\n');
    
    console.log('   Testing query...');
    const [results] = await sequelize.query('SELECT version()');
    console.log('   ✅ Query successful!\n');
    
    console.log('   Checking tables...');
    const tables = await sequelize.getQueryInterface().showAllTables();
    console.log(`   ✅ Found ${tables.length} tables\n`);
    
    if (tables.length > 0) {
      console.log('   Tables:');
      tables.forEach((table, i) => {
        console.log(`      ${i + 1}. ${table}`);
      });
    }
    
    await sequelize.close();
    console.log('\n✅ All tests passed!\n');
    process.exit(0);
  } catch (error) {
    console.error(`\n❌ Connection failed: ${error.message}\n`);
    
    if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
      console.log('🔍 DNS Resolution Issue:');
      console.log('   - Hostname cannot be resolved');
      console.log('   - This usually means:');
      console.log('     1. Supabase project is PAUSED');
      console.log('     2. Go to https://app.supabase.com/');
      console.log('     3. Check project status and RESTORE if paused\n');
    } else if (error.message.includes('timeout')) {
      console.log('🔍 Connection Timeout:');
      console.log('   - Hostname resolves but connection times out');
      console.log('   - Check firewall/antivirus settings');
      console.log('   - Verify project is active in Supabase dashboard\n');
    } else if (error.message.includes('password') || error.message.includes('authentication')) {
      console.log('🔍 Authentication Issue:');
      console.log('   - Password might be incorrect');
      console.log('   - Verify password in Supabase dashboard\n');
    }
    
    console.log('Full error:', error.stack);
    process.exit(1);
  }
};

testConnection();

