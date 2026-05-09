/**
 * Environment variable validation — fails fast at boot if critical vars are missing.
 */
const enterpriseLogger = require('../utils/logger');

const REQUIRED_VARS = [
  'JWT_SECRET',
  'SESSION_SECRET',
  'FIELD_ENCRYPTION_KEY',
  'FIELD_HMAC_KEY',
];

const REQUIRED_IN_PRODUCTION = [
  'DATABASE_URL',
  'FRONTEND_URL',
];

function validateEnv() {
  const missing = [];

  for (const v of REQUIRED_VARS) {
    if (!process.env[v]) missing.push(v);
  }

  if (process.env.NODE_ENV === 'production') {
    for (const v of REQUIRED_IN_PRODUCTION) {
      if (!process.env[v]) missing.push(v);
    }
  }

  if (missing.length > 0) {
    const msg = `FATAL: Missing required environment variables: ${missing.join(', ')}`;
    enterpriseLogger.error(msg);
    throw new Error(msg);
  }

  // Warn about optional but recommended vars
  const recommended = ['RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET', 'SUREPASS_API_KEY', 'SMTP_HOST'];
  const missingRecommended = recommended.filter(v => !process.env[v]);
  if (missingRecommended.length > 0) {
    enterpriseLogger.warn(`Optional env vars not set: ${missingRecommended.join(', ')}`);
  }
}

module.exports = { validateEnv };
