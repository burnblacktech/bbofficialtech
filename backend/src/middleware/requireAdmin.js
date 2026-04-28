// =====================================================
// SUPER_ADMIN AUTHORIZATION MIDDLEWARE
// =====================================================
// Must be used AFTER authenticateToken in the middleware chain.
// authenticateToken sets req.user from the JWT; this middleware
// verifies the user exists and holds the SUPER_ADMIN role.

const enterpriseLogger = require('../utils/logger');

/**
 * Require SUPER_ADMIN role.
 * Returns 401 if req.user is missing (token was not validated),
 * 403 if the user's role is not SUPER_ADMIN.
 */
const requireAdmin = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Access token required',
        code: 'AUTH_TOKEN_MISSING',
      });
    }

    if (req.user.role !== 'SUPER_ADMIN') {
      enterpriseLogger.warn('Admin access denied', {
        userId: req.user.id,
        userRole: req.user.role,
        path: req.path,
        method: req.method,
      });

      return res.status(403).json({
        status: 'error',
        message: 'Insufficient permissions — SUPER_ADMIN role required',
        code: 'AUTH_INSUFFICIENT_PERMISSIONS',
      });
    }

    next();
  } catch (error) {
    enterpriseLogger.error('requireAdmin middleware error', {
      error: error.message,
      stack: error.stack,
    });

    res.status(500).json({
      status: 'error',
      message: 'Authorization service error',
      code: 'AUTH_SERVICE_ERROR',
    });
  }
};

module.exports = requireAdmin;
