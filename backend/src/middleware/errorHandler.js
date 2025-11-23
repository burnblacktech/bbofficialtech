// =====================================================
// ENHANCED GLOBAL ERROR HANDLER MIDDLEWARE
// Standardized error response format
// Error categorization (validation, business, system)
// Structured logging with correlation IDs
// Integration with monitoring systems
// =====================================================

const enterpriseLogger = require('../utils/logger');
const { ErrorFactory, AppError } = require('../utils/errorClasses');

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
 * Async error wrapper for route handlers
 * Automatically catches async errors and passes them to the error handler
 */
const asyncErrorHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 404 handler middleware
 * Handles requests to non-existent routes
 */
const notFoundHandler = (req, res) => {
  const message = `Route ${req.method} ${req.originalUrl} not found`;

  enterpriseLogger.warn('Route not found', {
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    requestId: req.id,
    userId: req.user?.id
  });

  res.status(404).json({
    status: 'error',
    message,
    code: 'ROUTE_NOT_FOUND',
    statusCode: 404,
    category: 'not_found',
    timestamp: new Date().toISOString(),
    correlationId: require('crypto').randomUUID(),
    request: {
      method: req.method,
      url: req.originalUrl,
      requestId: req.id
    },
    availableRoutes: [
      '/api',
      '/api/docs',
      '/api/routes',
      '/api/health',
      '/api/auth',
      '/api/itr',
      '/api/users',
      '/api/admin',
      '/api/documents',
      '/api/notifications',
      '/api/tickets'
    ]
  });
};

/**
 * Request timeout handler
 */
const timeoutHandler = (timeout = 30000) => {
  return (req, res, next) => {
    const timer = setTimeout(() => {
      if (!res.headersSent) {
        enterpriseLogger.warn('Request timeout', {
          url: req.originalUrl,
          method: req.method,
          timeout: timeout,
          requestId: req.id
        });

        res.status(408).json({
          status: 'error',
          message: 'Request timeout',
          code: 'REQUEST_TIMEOUT',
          statusCode: 408,
          category: 'timeout',
          timestamp: new Date().toISOString(),
          correlationId: require('crypto').randomUUID(),
          timeout: timeout
        });
      }
    }, timeout);

    // Clear timeout when response is sent
    res.on('finish', () => clearTimeout(timer));
    res.on('close', () => clearTimeout(timer));

    next();
  };
};

/**
 * Circuit breaker pattern for external service calls
 */
class CircuitBreaker {
  constructor(threshold = 5, timeout = 60000) {
    this.failureThreshold = threshold;
    this.timeout = timeout;
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
  }

  async execute(operation, service) {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'HALF_OPEN';
      } else {
        const { ExternalServiceError } = require('../utils/errorClasses');
        throw new ExternalServiceError(service, 'circuit_breaker_open',
          `Service ${service} is temporarily unavailable due to circuit breaker`);
      }
    }

    try {
      const result = await operation();

      if (this.state === 'HALF_OPEN') {
        this.state = 'CLOSED';
        this.failureCount = 0;
      }

      return result;
    } catch (error) {
      this.failureCount++;
      this.lastFailureTime = Date.now();

      if (this.failureCount >= this.failureThreshold) {
        this.state = 'OPEN';
        enterpriseLogger.error('Circuit breaker opened', {
          service,
          failureCount: this.failureCount,
          threshold: this.failureThreshold
        });
      }

      throw error;
    }
  }
}

// Global circuit breaker instance
const circuitBreaker = new CircuitBreaker();

/**
 * External service call wrapper with circuit breaker
 */
const withCircuitBreaker = (operation, serviceName) => {
  return circuitBreaker.execute(operation, serviceName);
};

module.exports = {
  globalErrorHandler,
  notFoundHandler,
  asyncErrorHandler,
  timeoutHandler,
  CircuitBreaker,
  withCircuitBreaker,
  circuitBreaker,
  AppError
};
