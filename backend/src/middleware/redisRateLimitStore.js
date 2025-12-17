// =====================================================
// REDIS RATE LIMIT STORE
// Redis-backed store for express-rate-limit
// =====================================================

const redisService = require('../services/core/RedisService');
const enterpriseLogger = require('../utils/logger');

class RedisRateLimitStore {
  /**
   * Initialize the store
   */
  async init() {
    // Store is ready when Redis is connected
    return redisService.isReady();
  }

  /**
   * Increment counter for a key
   */
  async increment(key) {
    try {
      if (!redisService.isReady()) {
        // Fallback to in-memory if Redis not available
        return this._fallbackIncrement(key);
      }

      const client = redisService.getClient();
      if (!client || !redisService.isReady()) {
        return this._fallbackIncrement(key);
      }
      
      const now = Date.now();
      const windowMs = 15 * 60 * 1000; // 15 minutes default
      
      // Use Redis pipeline for atomic operations
      const pipeline = client.pipeline();
      
      // Get current count
      const countKey = `rate_limit:${key}`;
      const windowKey = `rate_limit:window:${key}`;
      
      // Increment counter
      pipeline.incr(countKey);
      
      // Set expiration on first increment
      pipeline.expire(countKey, Math.ceil(windowMs / 1000));
      
      // Store window start time
      pipeline.set(windowKey, now, 'EX', Math.ceil(windowMs / 1000), 'NX');
      
      const results = await pipeline.exec();
      
      if (!results || results.length === 0) {
        return this._fallbackIncrement(key);
      }
      
      const count = results[0][1] || 1;
      const windowStart = results[2] && results[2][1] ? parseInt(results[2][1]) : now;
      
      return {
        totalHits: count,
        resetTime: new Date(windowStart + windowMs),
      };
    } catch (error) {
      enterpriseLogger.error('Redis rate limit increment error', {
        error: error.message,
        key,
      });
      // Fallback to in-memory
      return this._fallbackIncrement(key);
    }
  }

  /**
   * Decrement counter for a key
   */
  async decrement(key) {
    try {
      if (!redisService.isReady()) {
        return;
      }

      const client = redisService.getClient();
      const countKey = `rate_limit:${key}`;
      await client.decr(countKey);
    } catch (error) {
      enterpriseLogger.error('Redis rate limit decrement error', {
        error: error.message,
        key,
      });
    }
  }

  /**
   * Reset counter for a key
   */
  async resetKey(key) {
    try {
      if (!redisService.isReady()) {
        if (this._fallbackStore && this._fallbackStore.has(key)) {
          this._fallbackStore.delete(key);
        }
        return;
      }

      const client = redisService.getClient();
      const countKey = `rate_limit:${key}`;
      const windowKey = `rate_limit:window:${key}`;
      
      await client.del(countKey, windowKey);
    } catch (error) {
      enterpriseLogger.error('Redis rate limit reset error', {
        error: error.message,
        key,
      });
    }
  }

  /**
   * Shutdown the store
   */
  shutdown() {
    // Redis connection is managed by RedisService
    // No cleanup needed here
  }

  /**
   * Fallback in-memory increment (when Redis unavailable)
   */
  _fallbackIncrement(key) {
    if (!this._fallbackStore) {
      this._fallbackStore = new Map();
    }
    
    const now = Date.now();
    const windowMs = 15 * 60 * 1000;
    
    const entry = this._fallbackStore.get(key) || { count: 0, windowStart: now };
    
    // Reset if window expired
    if (now - entry.windowStart > windowMs) {
      entry.count = 0;
      entry.windowStart = now;
    }
    
    entry.count++;
    this._fallbackStore.set(key, entry);
    
    return {
      totalHits: entry.count,
      resetTime: new Date(entry.windowStart + windowMs),
    };
  }
}

module.exports = RedisRateLimitStore;

