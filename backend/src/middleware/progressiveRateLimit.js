// =====================================================
// PROGRESSIVE RATE LIMITING MIDDLEWARE
// =====================================================

const rateLimit = require('express-rate-limit');
const AuditService = require('../services/core/AuditService');
const enterpriseLogger = require('../utils/logger');
const redisService = require('../services/core/RedisService');

// Fallback in-memory stores (used when Redis unavailable)
const failedAttempts = new Map();
const lockouts = new Map();

/**
 * Progressive rate limiting based on failed attempts
 */
const progressiveRateLimit = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    maxAttempts = 5,
    lockoutDuration = 30 * 60 * 1000, // 30 minutes
    skipSuccessfulRequests = true,
  } = options;

  return async (req, res, next) => {
    const key = req.ip || req.connection.remoteAddress;
    const now = Date.now();

    // Check if IP is currently locked out (Redis or fallback)
    let isLockedOut = false;
    let lockoutExpiry = null;

    if (redisService.isReady()) {
      try {
        const client = redisService.getClient();
        if (!client) {
          throw new Error('Redis client not available');
        }
        const lockoutKey = `rate_limit:lockout:${key}`;
        const lockoutValue = await client.get(lockoutKey);
        if (lockoutValue) {
          lockoutExpiry = parseInt(lockoutValue);
          isLockedOut = lockoutExpiry > now;
        }
      } catch (error) {
        enterpriseLogger.error('Redis lockout check error', { error: error.message });
        // Fallback to in-memory
        isLockedOut = lockouts.has(key) && lockouts.get(key) > now;
        if (isLockedOut) {
          lockoutExpiry = lockouts.get(key);
        }
      }
    } else {
      isLockedOut = lockouts.has(key) && lockouts.get(key) > now;
      if (isLockedOut) {
        lockoutExpiry = lockouts.get(key);
      }
    }

    if (isLockedOut && lockoutExpiry) {
      const remainingTime = Math.ceil((lockoutExpiry - now) / 1000 / 60);

      await AuditService.logEvent({
        actorId: null,
        actorRole: 'SYSTEM',
        action: 'RATE_LIMIT_EXCEEDED',
        entityType: 'AUTH_GATE',
        entityId: null,
        metadata: {
          ipAddress: key,
          reason: 'IP locked out',
          remainingMinutes: remainingTime,
        },
      });

      return res.status(429).json({
        error: `Too many failed attempts. Try again in ${remainingTime} minutes.`,
        retryAfter: Math.ceil((lockoutExpiry - now) / 1000),
      });
    }

    // Clean up expired lockouts
    if (redisService.isReady()) {
      try {
        const client = redisService.getClient();
        const lockoutKey = `rate_limit:lockout:${key}`;
        const lockoutValue = await client.get(lockoutKey);
        if (lockoutValue && parseInt(lockoutValue) <= now) {
          await client.del(lockoutKey);
        }
      } catch (error) {
        enterpriseLogger.error('Redis lockout cleanup error', { error: error.message });
      }
    } else {
      if (lockouts.has(key) && lockouts.get(key) <= now) {
        lockouts.delete(key);
      }
    }

    // Get current failed attempts (Redis or fallback)
    let attempts = { count: 0, firstAttempt: now };

    if (redisService.isReady()) {
      try {
        const client = redisService.getClient();
        const attemptsKey = `rate_limit:attempts:${key}`;
        const attemptsData = await client.get(attemptsKey);

        if (attemptsData) {
          attempts = JSON.parse(attemptsData);
        }

        // Reset if window has passed
        if (now - attempts.firstAttempt > windowMs) {
          attempts.count = 0;
          attempts.firstAttempt = now;
        }
      } catch (error) {
        enterpriseLogger.error('Redis attempts get error', { error: error.message });
        // Fallback to in-memory
        attempts = failedAttempts.get(key) || { count: 0, firstAttempt: now };
        if (now - attempts.firstAttempt > windowMs) {
          attempts.count = 0;
          attempts.firstAttempt = now;
        }
      }
    } else {
      attempts = failedAttempts.get(key) || { count: 0, firstAttempt: now };
      if (now - attempts.firstAttempt > windowMs) {
        attempts.count = 0;
        attempts.firstAttempt = now;
      }
    }

    // Check if max attempts exceeded
    if (attempts.count >= maxAttempts) {
      // Lock out the IP (Redis or fallback)
      const lockoutExpiry = now + lockoutDuration;

      if (redisService.isReady()) {
        try {
          const client = redisService.getClient();
          const lockoutKey = `rate_limit:lockout:${key}`;
          await client.setex(lockoutKey, Math.ceil(lockoutDuration / 1000), lockoutExpiry.toString());

          // Clear attempts
          const attemptsKey = `rate_limit:attempts:${key}`;
          await client.del(attemptsKey);
        } catch (error) {
          enterpriseLogger.error('Redis lockout set error', { error: error.message });
          // Fallback
          lockouts.set(key, lockoutExpiry);
          failedAttempts.delete(key);
        }
      } else {
        lockouts.set(key, lockoutExpiry);
        failedAttempts.delete(key);
      }

      await AuditService.logEvent({
        actorId: null,
        actorRole: 'SYSTEM',
        action: 'IP_LOCKED_OUT',
        entityType: 'AUTH_GATE',
        entityId: null,
        metadata: {
          ipAddress: key,
          reason: 'Max failed attempts exceeded',
          lockoutDuration: lockoutDuration / 1000 / 60,
        },
      });

      enterpriseLogger.warn('IP address locked out', {
        ip: key,
        attempts: attempts.count,
        lockoutDuration: lockoutDuration / 1000 / 60,
      });

      return res.status(429).json({
        error: `Too many failed attempts. IP locked for ${lockoutDuration / 1000 / 60} minutes.`,
        retryAfter: Math.ceil(lockoutDuration / 1000),
      });
    }

    // Store the attempt (Redis or fallback)
    if (redisService.isReady()) {
      try {
        const client = redisService.getClient();
        const attemptsKey = `rate_limit:attempts:${key}`;
        await client.setex(
          attemptsKey,
          Math.ceil(windowMs / 1000),
          JSON.stringify(attempts)
        );
      } catch (error) {
        enterpriseLogger.error('Redis attempts set error', { error: error.message });
        // Fallback
        failedAttempts.set(key, attempts);
      }
    } else {
      failedAttempts.set(key, attempts);
    }

    // Continue to next middleware
    next();
  };
};

/**
 * Record failed authentication attempt
 */
const recordFailedAttempt = async (req, res, next) => {
  const key = req.ip || req.connection.remoteAddress;
  const now = Date.now();

  // Get current attempts (Redis or fallback)
  let attempts = { count: 0, firstAttempt: now };

  if (redisService.isReady()) {
    try {
      const client = redisService.getClient();
      const attemptsKey = `rate_limit:attempts:${key}`;
      const attemptsData = await client.get(attemptsKey);

      if (attemptsData) {
        attempts = JSON.parse(attemptsData);
      }

      // Increment failed attempts
      attempts.count++;
      if (attempts.count === 1) {
        attempts.firstAttempt = now;
      }

      // Store back to Redis
      const windowMs = 15 * 60 * 1000;
      await client.setex(
        attemptsKey,
        Math.ceil(windowMs / 1000),
        JSON.stringify(attempts)
      );
    } catch (error) {
      enterpriseLogger.error('Redis record failed attempt error', { error: error.message });
      // Fallback
      attempts = failedAttempts.get(key) || { count: 0, firstAttempt: now };
      attempts.count++;
      if (attempts.count === 1) {
        attempts.firstAttempt = now;
      }
      failedAttempts.set(key, attempts);
    }
  } else {
    attempts = failedAttempts.get(key) || { count: 0, firstAttempt: now };
    attempts.count++;
    if (attempts.count === 1) {
      attempts.firstAttempt = now;
    }
    failedAttempts.set(key, attempts);
  }

  await AuditService.logEvent({
    actorId: null,
    actorRole: 'ANONYMOUS',
    action: 'FAILED_AUTH_ATTEMPT',
    entityType: 'AUTH_GATE',
    entityId: null,
    metadata: {
      ipAddress: key,
      attemptCount: attempts.count,
      timeSinceFirstAttempt: now - attempts.firstAttempt,
    },
  });

  enterpriseLogger.warn('Failed authentication attempt', {
    ip: key,
    attemptCount: attempts.count,
    userAgent: req.headers['user-agent'],
  });

  next();
};

/**
 * Clear failed attempts on successful authentication
 */
const clearFailedAttempts = async (req, res, next) => {
  const key = req.ip || req.connection.remoteAddress;

  let hasAttempts = false;

  if (redisService.isReady()) {
    try {
      const client = redisService.getClient();
      const attemptsKey = `rate_limit:attempts:${key}`;
      const exists = await client.exists(attemptsKey);
      if (exists) {
        hasAttempts = true;
        await client.del(attemptsKey);
      }
    } catch (error) {
      enterpriseLogger.error('Redis clear failed attempts error', { error: error.message });
      hasAttempts = failedAttempts.has(key);
      if (hasAttempts) {
        failedAttempts.delete(key);
      }
    }
  } else {
    hasAttempts = failedAttempts.has(key);
    if (hasAttempts) {
      failedAttempts.delete(key);
    }
  }

  if (hasAttempts) {

    await AuditService.logEvent({
      actorId: req.user?.userId,
      actorRole: req.user?.role || 'USER',
      action: 'FAILED_ATTEMPTS_CLEARED',
      entityType: 'AUTH_GATE',
      entityId: req.user?.userId,
      metadata: {
        ipAddress: key,
        reason: 'Successful authentication',
      },
    });

    enterpriseLogger.info('Failed attempts cleared', {
      ip: key,
      userId: req.user?.userId,
    });
  }

  next();
};

/**
 * Create Redis store for express-rate-limit
 */
const createRedisStore = () => {
  if (!redisService.isReady()) {
    return undefined; // Use default in-memory store
  }

  const RedisStore = require('rate-limit-redis');
  return new RedisStore({
    client: redisService.getClient(),
    prefix: 'rl:',
  });
};

/**
 * Standard rate limiting for general endpoints
 */
const standardRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  store: createRedisStore(), // Use Redis if available, fallback to memory
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: async (req, res) => {
    await AuditService.logEvent({
      actorId: req.user?.userId,
      actorRole: req.user?.role || 'ANONYMOUS',
      action: 'STANDARD_RATE_LIMIT_EXCEEDED',
      entityType: 'API_GATE',
      entityId: req.user?.userId,
      metadata: {
        ipAddress: req.ip || req.connection.remoteAddress,
        endpoint: req.originalUrl,
      },
    });

    res.status(429).json({
      error: 'Too many requests from this IP, please try again later.',
    });
  },
});

/**
 * Strict rate limiting for sensitive endpoints
 */
const strictRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  store: createRedisStore(), // Use Redis if available, fallback to memory
  message: {
    error: 'Too many requests to sensitive endpoint, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: async (req, res) => {
    await AuditService.logEvent({
      actorId: req.user?.userId,
      actorRole: req.user?.role || 'ANONYMOUS',
      action: 'STRICT_RATE_LIMIT_EXCEEDED',
      entityType: 'SENSITIVE_GATE',
      entityId: req.user?.userId,
      metadata: {
        ipAddress: req.ip || req.connection.remoteAddress,
        endpoint: req.originalUrl,
      },
    });

    res.status(429).json({
      error: 'Too many requests to sensitive endpoint, please try again later.',
    });
  },
});

module.exports = {
  progressiveRateLimit,
  recordFailedAttempt,
  clearFailedAttempts,
  standardRateLimit,
  strictRateLimit,
};
