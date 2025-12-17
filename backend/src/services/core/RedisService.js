// =====================================================
// REDIS SERVICE
// Centralized Redis connection and utility service
// Supports rate limiting, sessions, caching, and pub/sub
// =====================================================

const enterpriseLogger = require('../../utils/logger');

let Redis;
try {
  Redis = require('ioredis');
} catch (error) {
  // ioredis not installed - Redis functionality will be disabled
  enterpriseLogger.warn('ioredis not found - Redis features will be disabled', {
    error: error.message,
  });
  Redis = null;
}

class RedisService {
  constructor() {
    this.client = null;
    this.subscriber = null;
    this.publisher = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
  }

  /**
   * Initialize Redis connection
   */
  async initialize() {
    if (!Redis) {
      enterpriseLogger.warn('Redis (ioredis) not available - Redis features disabled');
      this.isConnected = false;
      return false;
    }
    
    try {
      const redisConfig = {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        db: parseInt(process.env.REDIS_DB) || 0,
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          this.reconnectAttempts = times;
          if (times > this.maxReconnectAttempts) {
            enterpriseLogger.error('Redis max reconnection attempts reached');
            return null; // Stop retrying
          }
          enterpriseLogger.warn(`Redis reconnecting (attempt ${times})...`, { delay });
          return delay;
        },
        maxRetriesPerRequest: null, // Don't retry on individual commands (will use retryStrategy)
        enableReadyCheck: true,
        enableOfflineQueue: false, // Don't queue commands when offline
        connectTimeout: 10000,
        lazyConnect: true, // Use lazy connect to avoid immediate connection attempts
        showFriendlyErrorStack: false,
        retryOnFailover: true,
      };

      // Main client for general operations
      try {
        this.client = new Redis(redisConfig);
      } catch (error) {
        enterpriseLogger.error('Failed to create Redis client', { error: error.message });
        this.isConnected = false;
        return false;
      }

      // Subscriber client for pub/sub (separate connection required)
      try {
        this.subscriber = new Redis(redisConfig);
      } catch (error) {
        enterpriseLogger.error('Failed to create Redis subscriber', { error: error.message });
        this.isConnected = false;
        return false;
      }

      // Publisher client for pub/sub
      try {
        this.publisher = new Redis(redisConfig);
      } catch (error) {
        enterpriseLogger.error('Failed to create Redis publisher', { error: error.message });
        this.isConnected = false;
        return false;
      }

      // Event handlers for main client
      this.client.on('connect', () => {
        enterpriseLogger.info('Redis client connecting...');
      });

      this.client.on('ready', () => {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        enterpriseLogger.info('Redis client ready', {
          host: redisConfig.host,
          port: redisConfig.port,
          db: redisConfig.db,
        });
      });

      this.client.on('error', (error) => {
        this.isConnected = false;
        enterpriseLogger.error('Redis client error', {
          error: error.message,
          stack: error.stack,
        });
      });

      this.client.on('close', () => {
        this.isConnected = false;
        enterpriseLogger.warn('Redis client connection closed');
      });

      this.client.on('reconnecting', (delay) => {
        enterpriseLogger.warn('Redis client reconnecting', { delay });
      });

      // Event handlers for subscriber
      this.subscriber.on('ready', () => {
        enterpriseLogger.info('Redis subscriber ready');
      });

      this.subscriber.on('error', (error) => {
        enterpriseLogger.error('Redis subscriber error', { error: error.message });
      });

      // Event handlers for publisher
      this.publisher.on('ready', () => {
        enterpriseLogger.info('Redis publisher ready');
      });

      this.publisher.on('error', (error) => {
        enterpriseLogger.error('Redis publisher error', { error: error.message });
      });

      // With lazyConnect: true, connections happen on first command
      // Try to ping to trigger connection
      // Wait for connection with timeout
      try {
        await Promise.race([
          Promise.all([
            this.client.ping(),
            this.subscriber.ping(),
            this.publisher.ping(),
          ]),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Redis connection timeout')), 5000)
          ),
        ]);
        enterpriseLogger.info('Redis service initialized successfully');
        this.isConnected = true;
        return true;
      } catch (pingError) {
        // If ping fails, Redis might not be available but we can still continue
        enterpriseLogger.warn('Redis ping failed, but connections will retry in background', {
          error: pingError.message,
        });
        // Set a flag that Redis is not ready yet but connections are established
        this.isConnected = false;
        return false; // Return false so server knows Redis is not ready
      }
    } catch (error) {
      enterpriseLogger.error('Failed to initialize Redis service', {
        error: error.message,
        stack: error.stack,
      });
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Get main Redis client
   * Returns null if not connected (graceful degradation)
   */
  getClient() {
    if (!this.client || !this.isConnected) {
      return null;
    }
    return this.client;
  }

  /**
   * Get subscriber client for pub/sub
   * Returns null if not connected (graceful degradation)
   */
  getSubscriber() {
    if (!this.subscriber || !this.isConnected) {
      return null;
    }
    return this.subscriber;
  }

  /**
   * Get publisher client for pub/sub
   * Returns null if not connected (graceful degradation)
   */
  getPublisher() {
    if (!this.publisher || !this.isConnected) {
      return null;
    }
    return this.publisher;
  }

  /**
   * Check if Redis is connected
   */
  isReady() {
    // Check if client exists and is in a ready state
    // Also check if status is 'ready' or 'connect' (connecting but usable)
    if (!this.client) {
      return false;
    }
    const status = this.client.status;
    // ioredis status can be: 'wait', 'end', 'close', 'ready', 'connect', 'reconnecting'
    return this.isConnected && (status === 'ready' || status === 'connect');
  }

  /**
   * Graceful shutdown
   */
  async disconnect() {
    try {
      if (this.client) {
        try {
          await this.client.quit();
          enterpriseLogger.info('Redis client disconnected');
        } catch (error) {
          enterpriseLogger.warn('Error disconnecting Redis client', { error: error.message });
        }
      }
      if (this.subscriber) {
        try {
          await this.subscriber.quit();
          enterpriseLogger.info('Redis subscriber disconnected');
        } catch (error) {
          enterpriseLogger.warn('Error disconnecting Redis subscriber', { error: error.message });
        }
      }
      if (this.publisher) {
        try {
          await this.publisher.quit();
          enterpriseLogger.info('Redis publisher disconnected');
        } catch (error) {
          enterpriseLogger.warn('Error disconnecting Redis publisher', { error: error.message });
        }
      }
      this.isConnected = false;
    } catch (error) {
      enterpriseLogger.error('Error disconnecting Redis', { error: error.message });
    }
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      if (!this.isReady()) {
        return { healthy: false, error: 'Redis not connected' };
      }
      const start = Date.now();
      await this.client.ping();
      const latency = Date.now() - start;
      return {
        healthy: true,
        latency,
        status: this.client.status,
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
      };
    }
  }
}

// Singleton instance
const redisService = new RedisService();

module.exports = redisService;

