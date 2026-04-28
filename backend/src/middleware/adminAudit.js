/**
 * adminAuditMiddleware — Logs all admin write operations to AuditEvent.
 * Intercepts res.json on POST/PUT/PATCH/DELETE to fire-and-forget an
 * AuditEvent.logEvent() call. Audit failures are caught and logged via
 * Winston at error level — never blocks the response.
 *
 * Requirements: 2.1, 2.2, 2.3
 */

const logger = require('../utils/logger');

function adminAuditMiddleware(req, res, next) {
  // Skip read-only methods — no audit needed
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();

  const originalJson = res.json.bind(res);
  res.json = function (body) {
    // Fire-and-forget audit log
    try {
      const AuditEvent = require('../models/AuditEvent');
      const entityType = deriveEntityType(req.path);
      const entityId =
        req.params.id || req.params.userId || req.params.couponId || (req.user && req.user.id) || null;

      AuditEvent.logEvent({
        entityType,
        entityId: entityId || '00000000-0000-0000-0000-000000000000',
        eventType: `ADMIN_${req.method}_${entityType}`,
        actorId: req.user && req.user.id,
        actorRole: 'SUPER_ADMIN',
        metadata: {
          method: req.method,
          path: req.originalUrl,
          params: req.params,
          statusCode: res.statusCode,
        },
      }).catch((err) => {
        logger.error('Admin audit log failed', { error: err.message, path: req.originalUrl });
      });
    } catch (err) {
      logger.error('Admin audit middleware error', { error: err.message });
    }

    return originalJson(body);
  };
  next();
}

/**
 * Derive the entity type from the request path.
 * Maps URL segments to domain entity names for the audit trail.
 */
function deriveEntityType(path) {
  if (path.includes('/users')) return 'USER';
  if (path.includes('/coupons')) return 'COUPON';
  if (path.includes('/filings') || path.includes('/stats')) return 'FILING';
  if (path.includes('/revenue')) return 'REVENUE';
  if (path.includes('/eri')) return 'ERI';
  if (path.includes('/health')) return 'HEALTH';
  return 'ADMIN';
}

module.exports = adminAuditMiddleware;
