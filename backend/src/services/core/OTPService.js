/**
 * OTPService — Redis-backed OTP generation and verification.
 *
 * Features:
 * - Crypto-random 6-digit codes
 * - 10-minute TTL in Redis
 * - Lockout after 5 consecutive failures (30 min)
 * - Graceful degradation to in-memory when Redis unavailable
 * - Development mode bypass (logs OTP, accepts '123456')
 *
 * Redis key structure:
 *   otp:{channel}:{identifier}:code     → bcrypt hash (TTL: 600s)
 *   otp:{channel}:{identifier}:attempts → failure count (TTL: 1800s)
 *   otp:{channel}:{identifier}:lockout  → "1" (TTL: 1800s)
 */

const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const enterpriseLogger = require('../../utils/logger');
const ErrorCodes = require('../../constants/ErrorCodes');
const { AppError } = require('../../middleware/errorHandler');

// In-memory fallback when Redis is unavailable
const memoryStore = new Map();

class OTPService {
  static _getRedis() {
    try {
      const RedisService = require('./RedisService');
      return RedisService.getClient?.() || null;
    } catch { return null; }
  }

  static _key(channel, identifier, suffix) {
    return `otp:${channel}:${identifier}:${suffix}`;
  }

  /**
   * Generate a cryptographically random 6-digit OTP code
   */
  static _generateCode() {
    return String(crypto.randomInt(100000, 999999));
  }

  /**
   * Generate and store an OTP for the given identifier.
   * @param {string} identifier - Phone number or email
   * @param {string} channel - 'sms' or 'email'
   * @returns {{ code: string, expiresAt: Date }}
   */
  static async generateOTP(identifier, channel = 'email') {
    // Check lockout
    if (await this.isLockedOut(identifier, channel)) {
      throw new AppError(ErrorCodes.OTP_LOCKED_OUT, 'Too many failed attempts. Try again in 30 minutes.', 429);
    }

    const code = this._generateCode();
    const hash = await bcrypt.hash(code, 8);
    const expiresAt = new Date(Date.now() + 600000); // 10 minutes

    const redis = this._getRedis();
    const codeKey = this._key(channel, identifier, 'code');

    if (redis) {
      try {
        await redis.set(codeKey, hash, 'EX', 600);
      } catch (err) {
        enterpriseLogger.warn('Redis unavailable for OTP, using memory fallback', { error: err.message });
        memoryStore.set(codeKey, { hash, expiresAt: Date.now() + 600000 });
      }
    } else {
      memoryStore.set(codeKey, { hash, expiresAt: Date.now() + 600000 });
    }

    // Dev mode: log OTP for testing
    if (process.env.NODE_ENV !== 'production') {
      enterpriseLogger.info('OTP generated (dev mode)', { identifier: identifier.slice(0, 4) + '***', code, channel });
    }

    return { code, expiresAt };
  }

  /**
   * Verify an OTP code.
   * @param {string} identifier - Phone number or email
   * @param {string} code - 6-digit code to verify
   * @param {string} channel - 'sms' or 'email'
   * @returns {{ valid: boolean, reason?: string }}
   */
  static async verifyOTP(identifier, code, channel = 'email') {
    // Dev mode bypass
    if (process.env.NODE_ENV !== 'production' && code === '123456') {
      await this._deleteCode(identifier, channel);
      return { valid: true };
    }

    // Check lockout
    if (await this.isLockedOut(identifier, channel)) {
      return { valid: false, reason: 'locked_out' };
    }

    const redis = this._getRedis();
    const codeKey = this._key(channel, identifier, 'code');
    let storedHash = null;

    if (redis) {
      try {
        storedHash = await redis.get(codeKey);
      } catch {
        // Fallback to memory
        const mem = memoryStore.get(codeKey);
        if (mem && mem.expiresAt > Date.now()) storedHash = mem.hash;
      }
    } else {
      const mem = memoryStore.get(codeKey);
      if (mem && mem.expiresAt > Date.now()) storedHash = mem.hash;
    }

    if (!storedHash) {
      await this._recordFailure(identifier, channel);
      return { valid: false, reason: 'expired' };
    }

    const isMatch = await bcrypt.compare(code, storedHash);
    if (!isMatch) {
      await this._recordFailure(identifier, channel);
      return { valid: false, reason: 'invalid' };
    }

    // Success — delete code to prevent replay
    await this._deleteCode(identifier, channel);
    // Reset failure count
    await this._resetFailures(identifier, channel);

    return { valid: true };
  }

  /**
   * Check if an identifier is locked out.
   */
  static async isLockedOut(identifier, channel = 'email') {
    const redis = this._getRedis();
    const lockKey = this._key(channel, identifier, 'lockout');

    if (redis) {
      try {
        const locked = await redis.get(lockKey);
        return locked === '1';
      } catch { return false; }
    }
    const mem = memoryStore.get(lockKey);
    return mem && mem.expiresAt > Date.now();
  }

  /**
   * Record a failed verification attempt.
   */
  static async _recordFailure(identifier, channel) {
    const redis = this._getRedis();
    const attemptsKey = this._key(channel, identifier, 'attempts');
    const lockKey = this._key(channel, identifier, 'lockout');

    let attempts = 0;
    if (redis) {
      try {
        attempts = await redis.incr(attemptsKey);
        if (attempts === 1) await redis.expire(attemptsKey, 1800);
        if (attempts >= 5) {
          await redis.set(lockKey, '1', 'EX', 1800);
          enterpriseLogger.warn('OTP lockout triggered', { identifier: identifier.slice(0, 4) + '***', channel });
        }
      } catch { /* silent */ }
    } else {
      const mem = memoryStore.get(attemptsKey) || { count: 0, expiresAt: Date.now() + 1800000 };
      mem.count++;
      memoryStore.set(attemptsKey, mem);
      if (mem.count >= 5) {
        memoryStore.set(lockKey, { expiresAt: Date.now() + 1800000 });
      }
    }
  }

  static async _deleteCode(identifier, channel) {
    const redis = this._getRedis();
    const codeKey = this._key(channel, identifier, 'code');
    if (redis) {
      try { await redis.del(codeKey); } catch { /* silent */ }
    }
    memoryStore.delete(codeKey);
  }

  static async _resetFailures(identifier, channel) {
    const redis = this._getRedis();
    const attemptsKey = this._key(channel, identifier, 'attempts');
    const lockKey = this._key(channel, identifier, 'lockout');
    if (redis) {
      try { await redis.del(attemptsKey); await redis.del(lockKey); } catch { /* silent */ }
    }
    memoryStore.delete(attemptsKey);
    memoryStore.delete(lockKey);
  }
}

module.exports = OTPService;
