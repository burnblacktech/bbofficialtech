// =====================================================
// SUPABASE PROJECT STATUS CHECKER
// Checks if Supabase project is accessible
// =====================================================

require('dotenv').config();
const https = require('https');
const dns = require('dns').promises;

const checkSupabaseStatus = async () => {
  console.log('\n=== Supabase Project Status Check ===\n');
  
  const projectRef = 'cgdafnbmqalyjchvhwsf';
  const supabaseUrl = `https://${projectRef}.supabase.co`;
  
  // 1. Check DNS resolution
  console.log('1. DNS Resolution Test:');
  const hostsToCheck = [
    `${projectRef}.supabase.co`,
    `aws-0-ap-south-1.pooler.supabase.com`,
    `db.${projectRef}.supabase.co`,
  ];
  
  for (const host of hostsToCheck) {
    try {
      const addresses = await dns.resolve4(host);
      console.log(`   ✅ ${host}`);
      console.log(`      → Resolves to: ${addresses[0]}`);
    } catch (error) {
      console.log(`   ❌ ${host}`);
      console.log(`      → Error: ${error.message}`);
    }
  }
  console.log('');
  
  // 2. Check Supabase API endpoint
  console.log('2. Supabase API Endpoint Test:');
  try {
    await new Promise((resolve, reject) => {
      const req = https.get(`${supabaseUrl}/rest/v1/`, (res) => {
        console.log(`   ✅ API endpoint accessible`);
        console.log(`      → Status: ${res.statusCode}`);
        resolve();
      });
      
      req.on('error', (error) => {
        console.log(`   ❌ API endpoint error: ${error.message}`);
        reject(error);
      });
      
      req.setTimeout(5000, () => {
        req.destroy();
        console.log(`   ❌ API endpoint timeout`);
        reject(new Error('Timeout'));
      });
    });
  } catch (error) {
    console.log(`   ❌ Cannot reach Supabase API`);
    console.log(`      → This might mean the project is paused`);
  }
  console.log('');
  
  // 3. Check connection strings
  console.log('3. Connection String Analysis:');
  if (process.env.SUPABASE_DATABASE_URL) {
    const uri = process.env.SUPABASE_DATABASE_URL.replace(/^["']|["']$/g, '');
    const match = uri.match(/@([^:]+):/);
    if (match) {
      console.log(`   Pooler hostname: ${match[1]}`);
      try {
        const addresses = await dns.resolve4(match[1]);
        console.log(`   ✅ Resolves to: ${addresses[0]}`);
      } catch (error) {
        console.log(`   ❌ DNS error: ${error.message}`);
      }
    }
  }
  
  if (process.env.DIRECT_URI) {
    const uri = process.env.DIRECT_URI.replace(/^["']|["']$/g, '');
    const match = uri.match(/@([^:]+):/);
    if (match) {
      console.log(`   Direct hostname: ${match[1]}`);
      try {
        const addresses = await dns.resolve4(match[1]);
        console.log(`   ✅ Resolves to: ${addresses[0]}`);
      } catch (error) {
        console.log(`   ❌ DNS error: ${error.message}`);
      }
    }
  }
  console.log('');
  
  // 4. Recommendations
  console.log('4. Recommendations:');
  console.log('   📋 If DNS resolution fails:');
  console.log('   1. Go to https://app.supabase.com/');
  console.log('   2. Check if project is ACTIVE (not paused)');
  console.log('   3. If paused, click "Restore" or "Resume"');
  console.log('   4. Wait 2-3 minutes for project to start');
  console.log('   5. Copy NEW connection strings from Settings → Database');
  console.log('');
  console.log('   📋 If project is active but DNS fails:');
  console.log('   1. Check your internet connection');
  console.log('   2. Try: ping aws-0-ap-south-1.pooler.supabase.com');
  console.log('   3. Check firewall/antivirus settings');
  console.log('   4. Try using a VPN if behind corporate firewall\n');
};

checkSupabaseStatus().catch(error => {
  console.error('Status check failed:', error);
  process.exit(1);
});

