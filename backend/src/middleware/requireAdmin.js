/**
 * requireAdmin — Middleware that restricts access to SUPER_ADMIN role.
 * Must be used AFTER authenticateToken in the middleware chain.
 */

function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Authentication required', code: 'AUTH_TOKEN_MISSING' });
  }
  if (req.user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ success: false, error: 'Admin access required', code: 'AUTH_INSUFFICIENT_PERMISSIONS' });
  }
  next();
}

module.exports = requireAdmin;
