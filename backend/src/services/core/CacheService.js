// =====================================================
// CACHE SERVICE
// Redis-backed caching with proper invalidation
// =====================================================

const redisService = require('./RedisService');
const enterpriseLogger = require('../../utils/logger');

class CacheService {
  constructor() {
    this.defaultTTL = 5 * 60; // 5 minutes in seconds
    this.keyPrefix = 'cache:';
  }

  /**
   * Set a cache value
   */
  async set(key, data, ttl = this.defaultTTL) {
    try {
      if (!redisService.isReady()) {
        return false; // Cache unavailable
      }

      const cacheKey = this._buildKey(key);
      const serialized = JSON.stringify(data);
      const client = redisService.getClient();
      
      if (!client) {
        return false; // Cache unavailable
      }

      await client.setex(cacheKey, ttl, serialized);

      enterpriseLogger.debug('Cache set', {
        key: cacheKey,
        ttl,
        size: serialized.length,
      });

      return true;
    } catch (error) {
      enterpriseLogger.error('Cache set error', {
        error: error.message,
        key,
      });
      return false;
    }
  }

  /**
   * Get a cache value
   */
  async get(key) {
    try {
      if (!redisService.isReady()) {
        return null; // Cache unavailable
      }

      const cacheKey = this._buildKey(key);
      const client = redisService.getClient();
      
      if (!client) {
        return null; // Cache unavailable
      }
      
      const cached = await client.get(cacheKey);

      if (!cached) {
        return null;
      }

      const data = JSON.parse(cached);

      enterpriseLogger.debug('Cache hit', {
        key: cacheKey,
      });

      return data;
    } catch (error) {
      enterpriseLogger.error('Cache get error', {
        error: error.message,
        key,
      });
      return null;
    }
  }

  /**
   * Delete a cache key
   */
  async delete(key) {
    try {
      if (!redisService.isReady()) {
        return false;
      }

      const cacheKey = this._buildKey(key);
      const client = redisService.getClient();
      
      if (!client) {
        return false; // Cache unavailable
      }
      
      const deleted = await client.del(cacheKey);

      enterpriseLogger.debug('Cache deleted', {
        key: cacheKey,
        deleted: deleted > 0,
      });

      return deleted > 0;
    } catch (error) {
      enterpriseLogger.error('Cache delete error', {
        error: error.message,
        key,
      });
      return false;
    }
  }

  /**
   * Delete multiple cache keys matching a pattern
   */
  async deletePattern(pattern) {
    try {
      if (!redisService.isReady()) {
        return 0;
      }

      const client = redisService.getClient();
      
      if (!client) {
        return 0; // Cache unavailable
      }
      
      const searchPattern = this._buildKey(pattern);
      const keys = await client.keys(searchPattern);

      if (keys.length === 0) {
        return 0;
      }

      const deleted = await client.del(...keys);

      enterpriseLogger.info('Cache pattern deleted', {
        pattern: searchPattern,
        keysDeleted: deleted,
      });

      return deleted;
    } catch (error) {
      enterpriseLogger.error('Cache pattern delete error', {
        error: error.message,
        pattern,
      });
      return 0;
    }
  }

  /**
   * Check if a key exists
   */
  async has(key) {
    try {
      if (!redisService.isReady()) {
        return false;
      }

      const cacheKey = this._buildKey(key);
      const client = redisService.getClient();
      
      if (!client) {
        return false; // Cache unavailable
      }
      
      const exists = await client.exists(cacheKey);

      return exists === 1;
    } catch (error) {
      enterpriseLogger.error('Cache has error', {
        error: error.message,
        key,
      });
      return false;
    }
  }

  /**
   * Get or set a value (cache-aside pattern)
   */
  async getOrSet(key, fetchFn, ttl = this.defaultTTL) {
    try {
      // Try to get from cache
      const cached = await this.get(key);
      if (cached !== null) {
        return cached;
      }

      // Cache miss - fetch data
      const data = await fetchFn();

      // Store in cache
      await this.set(key, data, ttl);

      return data;
    } catch (error) {
      enterpriseLogger.error('Cache getOrSet error', {
        error: error.message,
        key,
      });
      // On error, try to fetch directly
      return await fetchFn();
    }
  }

  /**
   * Invalidate cache for a user
   */
  async invalidateUser(userId) {
    const patterns = [
      `user:${userId}:*`,
      `filing:user:${userId}:*`,
      `draft:user:${userId}:*`,
    ];

    let totalDeleted = 0;
    for (const pattern of patterns) {
      const deleted = await this.deletePattern(pattern);
      totalDeleted += deleted;
    }

    enterpriseLogger.info('User cache invalidated', {
      userId,
      keysDeleted: totalDeleted,
    });

    return totalDeleted;
  }

  /**
   * Invalidate cache for a filing
   */
  async invalidateFiling(filingId) {
    const patterns = [
      `filing:${filingId}:*`,
      `draft:filing:${filingId}:*`,
      `tax:filing:${filingId}:*`,
    ];

    let totalDeleted = 0;
    for (const pattern of patterns) {
      const deleted = await this.deletePattern(pattern);
      totalDeleted += deleted;
    }

    enterpriseLogger.info('Filing cache invalidated', {
      filingId,
      keysDeleted: totalDeleted,
    });

    return totalDeleted;
  }

  /**
   * Clear all cache (use with caution)
   */
  async clear() {
    try {
      if (!redisService.isReady()) {
        return false;
      }

      const client = redisService.getClient();
      
      if (!client) {
        return false; // Cache unavailable
      }
      
      const keys = await client.keys(this._buildKey('*'));

      if (keys.length === 0) {
        return true;
      }

      await client.del(...keys);

      enterpriseLogger.warn('Cache cleared', {
        keysDeleted: keys.length,
      });

      return true;
    } catch (error) {
      enterpriseLogger.error('Cache clear error', {
        error: error.message,
      });
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats() {
    try {
      if (!redisService.isReady()) {
        return {
          available: false,
          size: 0,
        };
      }

      const client = redisService.getClient();
      
      if (!client) {
        return false; // Cache unavailable
      }
      
      const keys = await client.keys(this._buildKey('*'));

      return {
        available: true,
        size: keys.length,
      };
    } catch (error) {
      enterpriseLogger.error('Cache stats error', {
        error: error.message,
      });
      return {
        available: false,
        size: 0,
      };
    }
  }

  /**
   * Build cache key with prefix
   */
  _buildKey(key) {
    return `${this.keyPrefix}${key}`;
  }
}

// Singleton instance
const cacheService = new CacheService();

module.exports = cacheService;

