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

  toJSON() {
    return {
      status: 'error',
      message: this.message,
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
    if (err instanceof AppError) return err;

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
