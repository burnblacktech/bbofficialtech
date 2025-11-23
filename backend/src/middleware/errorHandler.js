// =====================================================
// ENHANCED GLOBAL ERROR HANDLER MIDDLEWARE
// Standardized error response format
// Error categorization (validation, business, system)
// Structured logging with correlation IDs
// Integration with monitoring systems
// =====================================================

const enterpriseLogger = require('../utils/logger');
const { ErrorFactory } = require('../utils/errorClasses');

/**
 * Global error handler middleware
 * Handles all unhandled errors in the application
 */
const globalErrorHandler = (err, req, res, next) => {
  // Convert plain errors to AppError instances
  const appError = ErrorFactory.fromError(err);

  // Structured error logging with correlation ID
  const logData = {
    correlationId: appError.correlationId,
    statusCode: appError.statusCode,
    code: appError.code,
    category: appError.category,
    message: appError.message,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id,
    requestId: req.id,
    timestamp: appError.timestamp,
    isOperational: appError.isOperational
  };

  // Add category-specific logging data
  if (appError.category === 'validation' && appError.field) {
    logData.field = appError.field;
    logData.value = appError.value;
  }
  if (appError.category === 'authorization' && appError.requiredRole) {
    logData.requiredRole = appError.requiredRole;
  }
  if (appError.category === 'external_service' && appError.service) {
    logData.service = appError.service;
    logData.operation = appError.operation;
  }
  if (appError.category === 'database' && appError.operation) {
    logData.operation = appError.operation;
  }

  // Log with appropriate level
  if (appError.statusCode >= 500) {
    enterpriseLogger.error('Server error', logData, { stack: appError.stack });
  } else if (appError.statusCode === 429) {
    enterpriseLogger.warn('Rate limit exceeded', logData);
  } else if (appError.isOperational) {
    enterpriseLogger.info('Operational error', logData);
  } else {
    enterpriseLogger.error('Application error', logData, { stack: appError.stack });
  }

  // Send standardized error response
  const errorResponse = appError.toJSON();

  // Add request context
  errorResponse.request = {
    method: req.method,
    url: req.originalUrl,
    requestId: req.id,
    timestamp: new Date().toISOString()
  };

  // Add monitoring and alerting data
  if (appError.statusCode >= 500) {
    errorResponse.alert = {
      level: 'high',
      needsAttention: true,
      correlationId: appError.correlationId
    };
  }

  res.status(appError.statusCode).json(errorResponse);
};

/**
 * 404 handler middleware
 * Handles requests to non-existent routes
 */
const notFoundHandler = (req, res) => {
  enterpriseLogger.warn('Route not found', {
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  res.status(404).json({
    status: 'error',
    message: 'Route not found',
    code: 'ROUTE_NOT_FOUND',
    timestamp: new Date().toISOString(),
    availableRoutes: [
      '/api',
      '/api/docs',
      '/api/auth',
      '/api/itr',
      '/api/users',
      '/api/health',
      '/api/admin'
    ]
  });
};

module.exports = {
  globalErrorHandler,
  notFoundHandler
};
