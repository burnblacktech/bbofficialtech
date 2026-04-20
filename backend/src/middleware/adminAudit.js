/**
 * adminAuditMiddleware — Logs all admin write operations to AuditEvent.
 * Fire-and-forget: audit failures never block the response.
 */

const enterpriseLogger = require('../utils/logger');

function adminAuditMiddleware(req, res, next) {
  // Skip read-only methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();

  const originalJson = res.json.bind(res);
  res.json = function (body) {
    // Fire-and-forget audit log
    try {
      const { AuditEvent } = require('../models');
      const entityType = deriveEntityType(req.path);
      AuditEvent.create({
        userId: req.user?.userId || req.user?.id,
        eventType: `ADMIN_${req.method}_${entityType}`.toUpperCase(),
        metadata: {
          actorRole: 'SUPER_ADMIN',
          method: req.method,
          path: req.originalUrl,
          params: req.params,
          targetId: req.params.userId || req.params.couponId || req.params.id || null,
          statusCode: res.statusCode,
        },
      }).catch(err => {
        enterpriseLogger.error('Admin audit log failed', { error: err.message, path: req.originalUrl });
      });
    } catch (err) {
      enterpriseLogger.error('Admin audit middleware error', { error: err.message });
    }

    return originalJson(body);
  };
  next();
}

function deriveEntityType(path) {
  if (path.includes('/users')) return 'USER';
  if (path.includes('/coupons')) return 'COUPON';
  if (path.includes('/filings') || path.includes('/stats')) return 'FILING';
  return 'ADMIN';
}

module.exports = adminAuditMiddleware;
