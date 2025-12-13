/**
 * Generate Secure Secrets for Environment Variables
 * 
 * Windows-friendly alternative to openssl for generating secure random secrets
 * 
 * Usage:
 *   node scripts/generate-secrets.js
 *   node scripts/generate-secrets.js --type jwt
 *   node scripts/generate-secrets.js --type session
 *   node scripts/generate-secrets.js --type all
 */

const crypto = require('crypto');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function generateSecret(length = 64) {
  // Generate random bytes and convert to hex string
  return crypto.randomBytes(length).toString('hex');
}

function generateBase64Secret(length = 32) {
  // Generate random bytes and convert to base64
  return crypto.randomBytes(length).toString('base64');
}

function generateJWTSecret() {
  // JWT secrets are typically 64 bytes (128 hex characters) or base64
  return generateSecret(64);
}

function generateSessionSecret() {
  // Session secrets are typically base64 encoded
  return generateBase64Secret(32);
}

function generatePasswordResetSecret() {
  return generateSecret(32);
}

function generateShareTokenSecret() {
  return generateSecret(32);
}

// Parse command line arguments
const args = process.argv.slice(2);
const type = args.find(arg => arg.startsWith('--type'))?.split('=')[1] || 'all';

log('\n╔════════════════════════════════════════════════════════════╗', 'cyan');
log('║         SECURE SECRET GENERATOR                             ║', 'cyan');
log('╚════════════════════════════════════════════════════════════╝', 'cyan');
log('');

if (type === 'all' || type === 'jwt') {
  log('JWT Secret:', 'green');
  log(`JWT_SECRET=${generateJWTSecret()}`);
  log('');
}

if (type === 'all' || type === 'session') {
  log('Session Secret:', 'green');
  log(`SESSION_SECRET=${generateSessionSecret()}`);
  log('');
}

if (type === 'all') {
  log('Password Reset Secret:', 'green');
  log(`PASSWORD_RESET_SECRET=${generatePasswordResetSecret()}`);
  log('');
  
  log('Share Token Secret:', 'green');
  log(`SHARE_TOKEN_SECRET=${generateShareTokenSecret()}`);
  log('');
  
  log('Supabase JWT Secret (if different from JWT_SECRET):', 'green');
  log(`SUPABASE_JWT_SECRET=${generateJWTSecret()}`);
  log('');
}

log('✅ Secrets generated successfully!', 'green');
log('');
log('⚠️  IMPORTANT: Copy these secrets to your .env file', 'yellow');
log('⚠️  Never commit secrets to version control!', 'yellow');
log('');

