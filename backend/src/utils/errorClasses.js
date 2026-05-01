// =====================================================
// ERROR CLASSES - Standardized application errors
// =====================================================

const crypto = require('crypto');

class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = {}) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.category = statusCode < 500 ? 'business' : 'system';
    this.isOperational = true;
    this.correlationId = crypto.randomUUID();
    this.timestamp = new Date().toISOString();
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  // Static factories for common errors
  static badRequest(message, code = 'VALIDATION_FAILED', details = {}) {
    return new AppError(message, 400, code, details);
  }

  static validationFailed(details, message = 'Validation failed') {
    return new AppError(message, 422, 'VALIDATION_FAILED', details);
  }

  static unauthorized(message = 'Authentication required') {
    return new AppError(message, 401, 'AUTH_REQUIRED');
  }

  static forbidden(message = 'Access denied', code = 'FORBIDDEN') {
    return new AppError(message, 403, code);
  }

  static notFound(resource = 'Resource', details = {}) {
    return new AppError(`${resource} not found`, 404, 'RESOURCE_NOT_FOUND', details);
  }

  static invalidState(message = 'Invalid operation for current state', details = {}) {
    return new AppError(message, 409, 'INVALID_STATE_TRANSITION', details);
  }

  toJSON() {
    // Don't leak internal error details (SQL, connection strings) in 500 responses
    const safeMessage = (this.isOperational || this.statusCode < 500)
      ? this.message
      : 'Internal server error';

    return {
      status: 'error',
      message: safeMessage,
      code: this.code,
      statusCode: this.statusCode,
      category: this.category,
      correlationId: this.correlationId,
      timestamp: this.timestamp,
      ...(Object.keys(this.details).length > 0 && { details: this.details }),
    };
  }
}

class ExternalServiceError extends AppError {
  constructor(service, operation, message) {
    super(message, 502, 'EXTERNAL_SERVICE_ERROR');
    this.category = 'external_service';
    this.service = service;
    this.operation = operation;
  }
}

class ErrorFactory {
  static fromError(err) {
    if (err instanceof AppError) {return err;}

    const appError = new AppError(
      err.message || 'Internal server error',
      err.statusCode || err.status || 500,
      err.code || 'INTERNAL_ERROR',
    );
    appError.stack = err.stack;
    appError.isOperational = false;
    return appError;
  }
}

module.exports = { AppError, ExternalServiceError, ErrorFactory };
