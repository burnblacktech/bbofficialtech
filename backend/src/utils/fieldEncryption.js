// =====================================================
// FIELD-LEVEL ENCRYPTION (AES-256-GCM)
// =====================================================
// Encrypts sensitive PII (PAN, Aadhaar, bank account) at rest.
// Uses AES-256-GCM for confidentiality + integrity.
// Stores a deterministic HMAC-SHA256 hash alongside for indexed lookups.
//
// Required env vars:
//   FIELD_ENCRYPTION_KEY — 64-char hex (32 bytes)
//   FIELD_HMAC_KEY       — 64-char hex (32 bytes)
//
// In production, the app will refuse to start without these.
// In development, encryption is skipped if keys are absent.

const crypto = require('crypto');

const ALGO = 'aes-256-gcm';
const IV_LEN = 12;

const isProduction = process.env.NODE_ENV === 'production';

let _encKey = null;
let _hmacKey = null;
let _enabled = false;

function init() {
  const encHex = process.env.FIELD_ENCRYPTION_KEY;
  const hmacHex = process.env.FIELD_HMAC_KEY;

  if (encHex && encHex.length === 64 && hmacHex && hmacHex.length === 64) {
    _encKey = Buffer.from(encHex, 'hex');
    _hmacKey = Buffer.from(hmacHex, 'hex');
    _enabled = true;
  } else if (isProduction) {
    throw new Error(
      'FATAL: FIELD_ENCRYPTION_KEY and FIELD_HMAC_KEY must be 64-char hex strings. ' +
      'Generate with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"',
    );
  }
  // In dev, silently skip encryption if keys are absent
}

init();

/** Encrypt plaintext → "iv:ciphertext:tag" (hex). No-op in dev without keys. */
function encrypt(plaintext) {
  if (!plaintext) {return null;}
  if (!_enabled) {return plaintext;}
  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv(ALGO, _encKey, iv);
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${enc.toString('hex')}:${tag.toString('hex')}`;
}

/** Decrypt "iv:ciphertext:tag" → plaintext. Passes through unencrypted values. */
function decrypt(blob) {
  if (!blob) {return null;}
  if (!_enabled) {return blob;}
  // If the value doesn't look encrypted (no colons), return as-is (migration compat)
  if (!blob.includes(':')) {return blob;}
  const [ivHex, encHex, tagHex] = blob.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const enc = Buffer.from(encHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGO, _encKey, iv);
  decipher.setAuthTag(tag);
  return decipher.update(enc, undefined, 'utf8') + decipher.final('utf8');
}

/** Deterministic HMAC-SHA256 hash for indexed lookups. No-op without keys. */
function hmacHash(plaintext) {
  if (!plaintext) {return null;}
  if (!_enabled) {return plaintext;}
  return crypto.createHmac('sha256', _hmacKey).update(plaintext).digest('hex');
}

module.exports = { encrypt, decrypt, hmacHash };
