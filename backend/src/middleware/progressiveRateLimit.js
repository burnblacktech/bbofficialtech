// =====================================================
// PROGRESSIVE RATE LIMITING MIDDLEWARE
// =====================================================

const rateLimit = require('express-rate-limit');
const { AuditLog } = require('../models');
const enterpriseLogger = require('../utils/logger');

// Store failed attempts in memory (in production, use Redis)
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

    // Check if IP is currently locked out
    if (lockouts.has(key) && lockouts.get(key) > now) {
      const remainingTime = Math.ceil((lockouts.get(key) - now) / 1000 / 60);

      await AuditLog.logAuthEvent({
        userId: null,
        action: 'rate_limit_exceeded',
        resource: 'auth',
        ipAddress: key,
        userAgent: req.headers['user-agent'],
        metadata: {
          reason: 'IP locked out',
          remainingMinutes: remainingTime,
        },
        success: false,
        errorMessage: `Too many failed attempts. Try again in ${remainingTime} minutes.`,
      });

      return res.status(429).json({
        error: `Too many failed attempts. Try again in ${remainingTime} minutes.`,
        retryAfter: Math.ceil((lockouts.get(key) - now) / 1000),
      });
    }

    // Clean up expired lockouts
    if (lockouts.has(key) && lockouts.get(key) <= now) {
      lockouts.delete(key);
    }

    // Get current failed attempts
    const attempts = failedAttempts.get(key) || { count: 0, firstAttempt: now };

    // Reset if window has passed
    if (now - attempts.firstAttempt > windowMs) {
      attempts.count = 0;
      attempts.firstAttempt = now;
    }

    // Check if max attempts exceeded
    if (attempts.count >= maxAttempts) {
      // Lock out the IP
      lockouts.set(key, now + lockoutDuration);
      failedAttempts.delete(key);

      await AuditLog.logAuthEvent({
        userId: null,
        action: 'ip_locked_out',
        resource: 'auth',
        ipAddress: key,
        userAgent: req.headers['user-agent'],
        metadata: {
          reason: 'Max failed attempts exceeded',
          lockoutDuration: lockoutDuration / 1000 / 60,
        },
        success: false,
        errorMessage: 'IP address locked out due to excessive failed attempts',
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

    // Store the attempt
    failedAttempts.set(key, attempts);

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

  // Get current attempts
  const attempts = failedAttempts.get(key) || { count: 0, firstAttempt: now };

  // Increment failed attempts
  attempts.count++;
  if (attempts.count === 1) {
    attempts.firstAttempt = now;
  }

  failedAttempts.set(key, attempts);

  await AuditLog.logAuthEvent({
    userId: null,
    action: 'failed_auth_attempt',
    resource: 'auth',
    ipAddress: key,
    userAgent: req.headers['user-agent'],
    metadata: {
      attemptCount: attempts.count,
      timeSinceFirstAttempt: now - attempts.firstAttempt,
    },
    success: false,
    errorMessage: 'Failed authentication attempt',
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

  if (failedAttempts.has(key)) {
    failedAttempts.delete(key);

    await AuditLog.logAuthEvent({
      userId: req.user?.userId || null,
      action: 'failed_attempts_cleared',
      resource: 'auth',
      ipAddress: key,
      userAgent: req.headers['user-agent'],
      metadata: {
        reason: 'Successful authentication',
      },
      success: true,
    });

    enterpriseLogger.info('Failed attempts cleared', {
      ip: key,
      userId: req.user?.userId,
    });
  }

  next();
};

/**
 * Standard rate limiting for general endpoints
 */
const standardRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: async (req, res) => {
    await AuditLog.logAuthEvent({
      userId: req.user?.userId || null,
      action: 'rate_limit_exceeded',
      resource: 'api',
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
      metadata: {
        reason: 'Standard rate limit exceeded',
        endpoint: req.originalUrl,
      },
      success: false,
      errorMessage: 'Too many requests from this IP',
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
  message: {
    error: 'Too many requests to sensitive endpoint, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: async (req, res) => {
    await AuditLog.logAuthEvent({
      userId: req.user?.userId || null,
      action: 'strict_rate_limit_exceeded',
      resource: 'sensitive',
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
      metadata: {
        reason: 'Strict rate limit exceeded',
        endpoint: req.originalUrl,
      },
      success: false,
      errorMessage: 'Too many requests to sensitive endpoint',
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
