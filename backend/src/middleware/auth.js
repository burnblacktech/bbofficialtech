// =====================================================
// AUTHENTICATION MIDDLEWARE
// =====================================================

const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const enterpriseLogger = require('../utils/logger');

// JWT Secret from environment
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is required');
}

/**
 * Rate limiting for authentication endpoints
 */
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    status: 'error',
    message: 'Too many authentication attempts, please try again later',
    code: 'RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Authentication middleware
 * Verifies JWT token and adds user info to request
 */
const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Access token required',
        code: 'AUTH_TOKEN_MISSING',
      });
    }

    console.log('[JWT VERIFY]', {
      secretPreview: JWT_SECRET?.slice(0, 6),
      secretLength: JWT_SECRET?.length,
    });
    jwt.verify(token, JWT_SECRET, { clockTolerance: 60 }, (err, user) => {
      if (err) {
        enterpriseLogger.warn('Invalid token attempt', {
          error: err.message,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
        });

        return res.status(401).json({
          status: 'error',
          message: 'Invalid or expired token',
          code: 'AUTH_TOKEN_INVALID',
        });
      }

      req.user = user;
      next();
    });
  } catch (error) {
    enterpriseLogger.error('Authentication middleware error', {
      error: error.message,
      stack: error.stack,
    });

    res.status(500).json({
      status: 'error',
      message: 'Authentication service error',
      code: 'AUTH_SERVICE_ERROR',
    });
  }
};

/**
 * Optional authentication middleware
 * Adds user info if token is present, but doesn't require it
 */
const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      jwt.verify(token, JWT_SECRET, { clockTolerance: 60 }, (err, user) => {
        if (!err) {
          req.user = user;
        }
      });
    }

    next();
  } catch (error) {
    enterpriseLogger.error('Optional auth middleware error', {
      error: error.message,
    });
    next(); // Continue even if auth fails
  }
};

/**
 * Role-based authorization middleware
 * @param {string[]} allowedRoles - Array of allowed roles
 */
const authorize = (allowedRoles = []) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required',
          code: 'AUTH_REQUIRED',
        });
      }

      const userRole = req.user.role;

      if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
        enterpriseLogger.warn('Unauthorized access attempt', {
          userId: req.user.id,
          userRole,
          allowedRoles,
          path: req.path,
          method: req.method,
        });

        return res.status(403).json({
          status: 'error',
          message: 'Insufficient permissions',
          code: 'AUTH_INSUFFICIENT_PERMISSIONS',
        });
      }

      next();
    } catch (error) {
      enterpriseLogger.error('Authorization middleware error', {
        error: error.message,
      });

      res.status(500).json({
        status: 'error',
        message: 'Authorization service error',
        code: 'AUTH_SERVICE_ERROR',
      });
    }
  };
};

module.exports = {
  authenticateToken,
  optionalAuth,
  authorize,
  authRateLimit,
};
