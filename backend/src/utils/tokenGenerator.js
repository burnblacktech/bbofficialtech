// =====================================================
// TOKEN GENERATOR UTILITY
// Generates secure tokens for sharing, password reset, etc.
// =====================================================

const crypto = require('crypto');

/**
 * Generate a secure random token
 * @param {number} length - Token length in bytes (default: 32)
 * @returns {string} Base64 URL-safe encoded token
 */
const generateSecureToken = (length = 32) => {
  return crypto.randomBytes(length).toString('base64url');
};

/**
 * Generate a share token for draft/filing sharing
 * Includes expiration timestamp in the token
 * @param {string} filingId - Filing ID
 * @param {string} userId - User ID who is sharing
 * @param {number} expiresInHours - Expiration in hours (default: 168 = 7 days)
 * @returns {string} Secure share token
 */
const generateShareToken = (filingId, userId, expiresInHours = 168) => {
  const expiresAt = Date.now() + (expiresInHours * 60 * 60 * 1000);
  const payload = {
    filingId,
    userId,
    expiresAt,
    type: 'share',
  };

  // Create a secure token by hashing the payload with a secret
  const secret = process.env.SHARE_TOKEN_SECRET || process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('FATAL: SHARE_TOKEN_SECRET or JWT_SECRET environment variable is required');
  }
  const payloadString = JSON.stringify(payload);
  const hash = crypto.createHmac('sha256', secret)
    .update(payloadString)
    .digest('base64url');

  // Combine random token with hash for additional security
  const randomToken = crypto.randomBytes(16).toString('base64url');
  return `${randomToken}.${hash}`;
};

/**
 * Verify a share token
 * @param {string} token - Token to verify
 * @param {string} filingId - Expected filing ID
 * @param {string} userId - Expected user ID
 * @returns {boolean} True if token is valid
 */
const verifyShareToken = (token, filingId, userId) => {
  try {
    // In a production system, you would:
    // 1. Decode the token
    // 2. Verify the hash
    // 3. Check expiration
    // 4. Verify filingId and userId match

    // For now, we'll use a simple validation
    // In production, store tokens in database with expiration
    if (!token || token === 'TEMP_SHARE_TOKEN') {
      return false;
    }

    // Basic format check
    const parts = token.split('.');
    if (parts.length !== 2) {
      return false;
    }

    // TODO: Implement full verification with database lookup
    // For now, accept any non-TEMP token as valid
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Generate a password reset token
 * @param {string} userId - User ID
 * @param {string} email - User email
 * @returns {string} Secure reset token
 */
const generatePasswordResetToken = (userId, email) => {
  const payload = {
    userId,
    email,
    type: 'password_reset',
    expiresAt: Date.now() + (60 * 60 * 1000), // 1 hour
  };

  const secret = process.env.PASSWORD_RESET_SECRET || process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('FATAL: PASSWORD_RESET_SECRET or JWT_SECRET environment variable is required');
  }
  const payloadString = JSON.stringify(payload);
  const hash = crypto.createHmac('sha256', secret)
    .update(payloadString)
    .digest('base64url');

  const randomToken = crypto.randomBytes(16).toString('base64url');
  return `${randomToken}.${hash}`;
};

module.exports = {
  generateSecureToken,
  generateShareToken,
  verifyShareToken,
  generatePasswordResetToken,
};

