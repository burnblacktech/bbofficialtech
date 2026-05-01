/**
 * Unit tests for fieldEncryption (AES-256-GCM)
 */

// Set encryption keys BEFORE requiring the module (init() runs on require)
const TEST_ENC_KEY = 'a'.repeat(64);
const TEST_HMAC_KEY = 'b'.repeat(64);
process.env.FIELD_ENCRYPTION_KEY = TEST_ENC_KEY;
process.env.FIELD_HMAC_KEY = TEST_HMAC_KEY;

const { encrypt, decrypt, hmacHash } = require('../fieldEncryption');

describe('fieldEncryption', () => {
  describe('encrypt / decrypt round-trip', () => {
    it('round-trips plaintext correctly', () => {
      const plain = 'ABCDE1234F';
      expect(decrypt(encrypt(plain))).toBe(plain);
    });

    it('handles unicode text', () => {
      const plain = '₹50,000 — PAN: ABCDE1234F';
      expect(decrypt(encrypt(plain))).toBe(plain);
    });
  });

  describe('decrypt passthrough', () => {
    it('passes through unencrypted values (no colons)', () => {
      expect(decrypt('ABCDE1234F')).toBe('ABCDE1234F');
    });
  });

  describe('hmacHash', () => {
    it('is deterministic', () => {
      expect(hmacHash('ABCDE1234F')).toBe(hmacHash('ABCDE1234F'));
    });

    it('produces different hashes for different inputs', () => {
      expect(hmacHash('AAA')).not.toBe(hmacHash('BBB'));
    });
  });

  describe('encrypt non-determinism', () => {
    it('produces different ciphertext each time', () => {
      const a = encrypt('same-input');
      const b = encrypt('same-input');
      expect(a).not.toBe(b);
      // But both decrypt to the same value
      expect(decrypt(a)).toBe(decrypt(b));
    });
  });

  describe('null / empty inputs', () => {
    it('encrypt returns null for null', () => {
      expect(encrypt(null)).toBeNull();
    });

    it('encrypt returns null for empty string', () => {
      expect(encrypt('')).toBeNull();
    });

    it('decrypt returns null for null', () => {
      expect(decrypt(null)).toBeNull();
    });

    it('hmacHash returns null for null', () => {
      expect(hmacHash(null)).toBeNull();
    });

    it('hmacHash returns null for empty string', () => {
      expect(hmacHash('')).toBeNull();
    });
  });
});
