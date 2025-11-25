// =====================================================
// AUDIT LOGGING MIDDLEWARE
// =====================================================

const { AuditLog } = require('../models');
const enterpriseLogger = require('../utils/logger');

/**
 * Middleware to log all authentication events
 */
const auditAuthEvents = (action) => {
  return async (req, res, next) => {
    const startTime = Date.now();

    // Store original res.json to intercept response
    const originalJson = res.json;
    let responseData = null;
    let statusCode = null;

    res.json = function(data) {
      responseData = data;
      statusCode = res.statusCode;
      return originalJson.call(this, data);
    };

    // Override res.end to capture the response
    res.on('finish', async () => {
      try {
        const duration = Date.now() - startTime;
        const userId = req.user?.userId || null;
        const success = statusCode >= 200 && statusCode < 400;

        await AuditLog.logAuthEvent({
          userId,
          action,
          resource: 'auth',
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.headers['user-agent'],
          metadata: {
            method: req.method,
            url: req.originalUrl,
            statusCode,
            duration,
            requestBody: req.method === 'POST' || req.method === 'PUT' ?
              sanitizeRequestBody(req.body) : null,
            responseData: success ? responseData : null,
          },
          success,
          errorMessage: success ? null : responseData?.error || responseData?.message,
        });

        enterpriseLogger.info('Audit event logged', {
          action,
          userId,
          success,
          duration,
          statusCode,
        });
      } catch (error) {
        enterpriseLogger.error('Failed to log audit event', {
          action,
          error: error.message,
        });
      }
    });

    next();
  };
};

/**
 * Middleware to log general API events
 */
const auditApiEvents = (resource) => {
  return async (req, res, next) => {
    const startTime = Date.now();

    // Store original res.json to intercept response
    const originalJson = res.json;
    let responseData = null;
    let statusCode = null;

    res.json = function(data) {
      responseData = data;
      statusCode = res.statusCode;
      return originalJson.call(this, data);
    };

    // Override res.end to capture the response
    res.on('finish', async () => {
      try {
        const duration = Date.now() - startTime;
        const userId = req.user?.userId || null;
        const success = statusCode >= 200 && statusCode < 400;

        await AuditLog.create({
          userId,
          action: `${req.method}_${resource}`,
          resource,
          resourceId: req.params.id || null,
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.headers['user-agent'],
          metadata: {
            method: req.method,
            url: req.originalUrl,
            statusCode,
            duration,
            requestBody: req.method === 'POST' || req.method === 'PUT' ?
              sanitizeRequestBody(req.body) : null,
            responseData: success ? responseData : null,
          },
          success,
          errorMessage: success ? null : responseData?.error || responseData?.message,
        });

        enterpriseLogger.info('API audit event logged', {
          action: `${req.method}_${resource}`,
          userId,
          success,
          duration,
          statusCode,
        });
      } catch (error) {
        enterpriseLogger.error('Failed to log API audit event', {
          resource,
          error: error.message,
        });
      }
    });

    next();
  };
};

/**
 * Sanitize request body to remove sensitive data
 */
const sanitizeRequestBody = (body) => {
  if (!body || typeof body !== 'object') {
    return body;
  }

  const sanitized = { ...body };
  const sensitiveFields = ['password', 'passwordHash', 'token', 'refreshToken', 'secret'];

  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });

  return sanitized;
};

/**
 * Middleware to log failed authentication attempts
 */
const auditFailedAuth = (action) => {
  return async (req, res, next) => {
    const originalJson = res.json;
    let responseData = null;

    res.json = function(data) {
      responseData = data;
      return originalJson.call(this, data);
    };

    res.on('finish', async () => {
      if (res.statusCode === 401 || res.statusCode === 403) {
        try {
          await AuditLog.logAuthEvent({
            userId: null,
            action: `${action}_failed`,
            resource: 'auth',
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.headers['user-agent'],
            metadata: {
              method: req.method,
              url: req.originalUrl,
              statusCode: res.statusCode,
              requestBody: sanitizeRequestBody(req.body),
            },
            success: false,
            errorMessage: responseData?.error || responseData?.message,
          });

          enterpriseLogger.warn('Failed authentication attempt logged', {
            action: `${action}_failed`,
            ipAddress: req.ip || req.connection.remoteAddress,
            statusCode: res.statusCode,
          });
        } catch (error) {
          enterpriseLogger.error('Failed to log failed auth event', {
            action: `${action}_failed`,
            error: error.message,
          });
        }
      }
    });

    next();
  };
};

module.exports = {
  auditAuthEvents,
  auditApiEvents,
  auditFailedAuth,
};
