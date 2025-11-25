// =====================================================
// SUPABASE DEBUG SCRIPT
// Detailed debugging for Supabase connection issues
// =====================================================

require('dotenv').config();

console.log('\n=== Supabase Connection Debug ===\n');

// 1. Check environment variables
console.log('1. Environment Variables:');
console.log(`   DIRECT_URI exists: ${!!process.env.DIRECT_URI}`);
console.log(`   SUPABASE_DATABASE_URL exists: ${!!process.env.SUPABASE_DATABASE_URL}`);
console.log(`   DB_HOST: ${process.env.DB_HOST || 'NOT SET'}`);
console.log(`   DB_USER: ${process.env.DB_USER || 'NOT SET'}`);
console.log(`   DB_NAME: ${process.env.DB_NAME || 'NOT SET'}`);
console.log(`   DB_PASSWORD: ${process.env.DB_PASSWORD ? '***SET***' : 'NOT SET'}`);

// 2. Parse connection strings
console.log('\n2. Connection String Analysis:');

if (process.env.DIRECT_URI) {
  const uri = process.env.DIRECT_URI.replace(/^["']|["']$/g, '');
  const match = uri.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
  if (match) {
    console.log('   DIRECT_URI parsed:');
    console.log(`     User: ${match[1]}`);
    console.log(`     Password: ${match[2].substring(0, 5)}... (length: ${match[2].length})`);
    console.log(`     Host: ${match[3]}`);
    console.log(`     Port: ${match[4]}`);
    console.log(`     Database: ${match[5]}`);
    
    // Check if password is encoded
    const isEncoded = match[2].includes('%');
    console.log(`     Password encoded: ${isEncoded ? 'Yes' : 'No'}`);
    
    // Check hostname format
    const hostParts = match[3].split('.');
    console.log(`     Hostname parts: ${hostParts.length} (${hostParts.join(' -> ')})`);
    
    if (!match[3].includes('supabase')) {
      console.log('     ⚠️  WARNING: Hostname does not contain "supabase"');
    }
  } else {
    console.log('   ❌ DIRECT_URI format invalid');
  }
}

if (process.env.SUPABASE_DATABASE_URL) {
  const uri = process.env.SUPABASE_DATABASE_URL.replace(/^["']|["']$/g, '');
  const match = uri.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
  if (match) {
    console.log('\n   SUPABASE_DATABASE_URL parsed:');
    console.log(`     User: ${match[1]}`);
    console.log(`     Password: ${match[2].substring(0, 5)}... (length: ${match[2].length})`);
    console.log(`     Host: ${match[3]}`);
    console.log(`     Port: ${match[4]}`);
    console.log(`     Database: ${match[5]}`);
    
    // Check if using pooler
    const isPooler = match[3].includes('pooler');
    console.log(`     Using pooler: ${isPooler ? 'Yes' : 'No'}`);
  }
}

// 3. DNS Resolution Test
console.log('\n3. DNS Resolution Test:');
const dns = require('dns').promises;

const hostsToTest = [];
if (process.env.DIRECT_URI) {
  const uri = process.env.DIRECT_URI.replace(/^["']|["']$/g, '');
  const match = uri.match(/@([^:]+):/);
  if (match) hostsToTest.push(match[1]);
}
if (process.env.SUPABASE_DATABASE_URL) {
  const uri = process.env.SUPABASE_DATABASE_URL.replace(/^["']|["']$/g, '');
  const match = uri.match(/@([^:]+):/);
  if (match && !hostsToTest.includes(match[1])) hostsToTest.push(match[1]);
}

for (const host of hostsToTest) {
  try {
    const addresses = await dns.resolve4(host);
    console.log(`   ✅ ${host} resolves to: ${addresses[0]}`);
  } catch (error) {
    console.log(`   ❌ ${host} DNS resolution failed: ${error.message}`);
    console.log(`      This hostname might be incorrect or the domain doesn't exist`);
  }
}

// 4. Network connectivity test
console.log('\n4. Network Connectivity Test:');
const net = require('net');

for (const host of hostsToTest) {
  const [hostname, port] = host.includes(':') ? host.split(':') : [host, '5432'];
  try {
    await new Promise((resolve, reject) => {
      const socket = new net.Socket();
      const timeout = setTimeout(() => {
        socket.destroy();
        reject(new Error('Connection timeout'));
      }, 5000);
      
      socket.connect(parseInt(port), hostname, () => {
        clearTimeout(timeout);
        socket.destroy();
        resolve();
      });
      
      socket.on('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });
    console.log(`   ✅ ${hostname}:${port} - Port is reachable`);
  } catch (error) {
    console.log(`   ❌ ${hostname}:${port} - Cannot connect: ${error.message}`);
  }
}

// 5. Recommendations
console.log('\n5. Recommendations:');
console.log('   📋 Next steps:');
console.log('   1. Go to Supabase Dashboard → Settings → Database');
console.log('   2. Copy the EXACT connection string from there');
console.log('   3. Verify the hostname matches exactly');
console.log('   4. Check if project is paused or inactive');
console.log('   5. Verify IP allowlist settings');
console.log('   6. Try resetting database password if credentials are wrong\n');

