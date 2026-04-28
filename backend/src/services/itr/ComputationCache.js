/**
 * ComputationCache — In-memory LRU cache for tax computation results
 *
 * Key:   ${filingId}:${sha256(JSON.stringify(jsonPayload))}
 * Max:   500 entries
 * TTL:   300 seconds (5 minutes)
 * Evict: LRU when full
 */

const crypto = require('crypto');
const logger = require('../../utils/logger');

const MAX_ENTRIES = 500;
const TTL_MS = 300 * 1000; // 300 seconds

class ComputationCache {
  constructor() {
    /** @type {Map<string, { result: object, timestamp: number, filingId: string }>} */
    this._cache = new Map();
  }

  /**
   * Generate a sha256 hash of the JSON payload
   * @param {object} jsonPayload
   * @returns {string}
   */
  static hashPayload(jsonPayload) {
    return crypto.createHash('sha256').update(JSON.stringify(jsonPayload)).digest('hex');
  }

  /**
   * Build cache key from filingId and payloadHash
   */
  static buildKey(filingId, payloadHash) {
    return `${filingId}:${payloadHash}`;
  }

  /**
   * Get cached computation result
   * @param {string} filingId
   * @param {string} payloadHash - sha256 hash of the payload
   * @returns {object|null} cached result or null on miss/expired
   */
  get(filingId, payloadHash) {
    const key = ComputationCache.buildKey(filingId, payloadHash);
    const entry = this._cache.get(key);

    if (!entry) return null;

    // Check TTL
    if (Date.now() - entry.timestamp > TTL_MS) {
      this._cache.delete(key);
      return null;
    }

    // LRU: move to end (most recently used)
    this._cache.delete(key);
    this._cache.set(key, entry);

    return entry.result;
  }

  /**
   * Store computation result in cache
   * @param {string} filingId
   * @param {string} payloadHash - sha256 hash of the payload
   * @param {object} result - computation result to cache
   */
  set(filingId, payloadHash, result) {
    const key = ComputationCache.buildKey(filingId, payloadHash);

    // If key already exists, delete first to refresh position
    if (this._cache.has(key)) {
      this._cache.delete(key);
    }

    // Evict LRU if at capacity
    while (this._cache.size >= MAX_ENTRIES) {
      const oldestKey = this._cache.keys().next().value;
      this._cache.delete(oldestKey);
    }

    this._cache.set(key, {
      result,
      timestamp: Date.now(),
      filingId,
    });
  }

  /**
   * Invalidate all cache entries for a given filing
   * @param {string} filingId
   */
  invalidate(filingId) {
    const keysToDelete = [];
    for (const [key, entry] of this._cache) {
      if (entry.filingId === filingId) {
        keysToDelete.push(key);
      }
    }
    for (const key of keysToDelete) {
      this._cache.delete(key);
    }
    if (keysToDelete.length > 0) {
      logger.info('ComputationCache invalidated', { filingId, entriesRemoved: keysToDelete.length });
    }
  }

  /** Current cache size */
  get size() {
    return this._cache.size;
  }

  /** Clear entire cache */
  clear() {
    this._cache.clear();
  }
}

// Export singleton instance
module.exports = new ComputationCache();
module.exports.ComputationCache = ComputationCache;
