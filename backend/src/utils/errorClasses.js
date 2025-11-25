// =====================================================
// CUSTOM ERROR CLASSES
// Error categorization with proper error codes and messages
// Error serialization for API responses
// =====================================================

const enterpriseLogger = require('./logger');

/**
 * Base application error class
 */
class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', isOperational = true) {
    super(message);

    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();
    this.correlationId = require('crypto').randomUUID();

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }

    // Log error creation
    enterpriseLogger.error('AppError created', {
      message: this.message,
      statusCode: this.statusCode,
      code: this.code,
      correlationId: this.correlationId,
      stack: this.stack,
    });
  }

  /**
   * Serialize error for API response
   */
  toJSON() {
    return {
      status: 'error',
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      correlationId: this.correlationId,
      timestamp: this.timestamp,
      ...(process.env.NODE_ENV === 'development' && { stack: this.stack }),
    };
  }
}

/**
 * Validation errors (400)
 */
class ValidationError extends AppError {
  constructor(message, field = null, value = null) {
    super(message, 400, 'VALIDATION_ERROR');
    this.field = field;
    this.value = value;
    this.category = 'validation';
  }

  toJSON() {
    const base = super.toJSON();
    return {
      ...base,
      field: this.field,
      value: this.value,
      category: this.category,
    };
  }
}

/**
 * Authentication errors (401)
 */
class AuthenticationError extends AppError {
  constructor(message = 'Authentication required', reason = null) {
    super(message, 401, 'AUTHENTICATION_ERROR');
    this.reason = reason;
    this.category = 'authentication';
  }

  toJSON() {
    const base = super.toJSON();
    return {
      ...base,
      reason: this.reason,
      category: this.category,
    };
  }
}

/**
 * Authorization errors (403)
 */
class AuthorizationError extends AppError {
  constructor(message = 'Access forbidden', requiredRole = null) {
    super(message, 403, 'AUTHORIZATION_ERROR');
    this.requiredRole = requiredRole;
    this.category = 'authorization';
  }

  toJSON() {
    const base = super.toJSON();
    return {
      ...base,
      requiredRole: this.requiredRole,
      category: this.category,
    };
  }
}

/**
 * Not found errors (404)
 */
class NotFoundError extends AppError {
  constructor(resource = 'Resource', identifier = null) {
    super(`${resource} not found`, 404, 'NOT_FOUND');
    this.resource = resource;
    this.identifier = identifier;
    this.category = 'not_found';
  }

  toJSON() {
    const base = super.toJSON();
    return {
      ...base,
      resource: this.resource,
      identifier: this.identifier,
      category: this.category,
    };
  }
}

/**
 * Conflict errors (409)
 */
class ConflictError extends AppError {
  constructor(message = 'Resource conflict', conflictingField = null) {
    super(message, 409, 'CONFLICT_ERROR');
    this.conflictingField = conflictingField;
    this.category = 'conflict';
  }

  toJSON() {
    const base = super.toJSON();
    return {
      ...base,
      conflictingField: this.conflictingField,
      category: this.category,
    };
  }
}

/**
 * Business logic errors (422)
 */
class BusinessLogicError extends AppError {
  constructor(message, businessRule = null) {
    super(message, 422, 'BUSINESS_LOGIC_ERROR');
    this.businessRule = businessRule;
    this.category = 'business_logic';
  }

  toJSON() {
    const base = super.toJSON();
    return {
      ...base,
      businessRule: this.businessRule,
      category: this.category,
    };
  }
}

/**
 * Rate limiting errors (429)
 */
class RateLimitError extends AppError {
  constructor(limit = null, windowMs = null) {
    super('Rate limit exceeded', 429, 'RATE_LIMIT_ERROR');
    this.limit = limit;
    this.windowMs = windowMs;
    this.category = 'rate_limit';
  }

  toJSON() {
    const base = super.toJSON();
    return {
      ...base,
      limit: this.limit,
      windowMs: this.windowMs,
      category: this.category,
    };
  }
}

/**
 * External service errors (502, 503, 504)
 */
class ExternalServiceError extends AppError {
  constructor(service, operation, originalError = null) {
    super(`External service error: ${service} ${operation} failed`, 502, 'EXTERNAL_SERVICE_ERROR');
    this.service = service;
    this.operation = operation;
    this.originalError = originalError;
    this.category = 'external_service';
  }

  toJSON() {
    const base = super.toJSON();
    return {
      ...base,
      service: this.service,
      operation: this.operation,
      category: this.category,
      ...(process.env.NODE_ENV === 'development' && { originalError: this.originalError }),
    };
  }
}

/**
 * Database errors (500)
 */
class DatabaseError extends AppError {
  constructor(operation, originalError = null) {
    super(`Database operation failed: ${operation}`, 500, 'DATABASE_ERROR');
    this.operation = operation;
    this.originalError = originalError;
    this.category = 'database';
  }

  toJSON() {
    const base = super.toJSON();
    return {
      ...base,
      operation: this.operation,
      category: this.category,
      ...(process.env.NODE_ENV === 'development' && { originalError: this.originalError }),
    };
  }
}

/**
 * File handling errors
 */
class FileError extends AppError {
  constructor(message, operation = null, filename = null) {
    super(message, 400, 'FILE_ERROR');
    this.operation = operation;
    this.filename = filename;
    this.category = 'file_handling';
  }

  toJSON() {
    const base = super.toJSON();
    return {
      ...base,
      operation: this.operation,
      filename: this.filename,
      category: this.category,
    };
  }
}

/**
 * Tax computation errors
 */
class TaxComputationError extends AppError {
  constructor(message, computationType = null, inputData = null) {
    super(`Tax computation error: ${message}`, 422, 'TAX_COMPUTATION_ERROR');
    this.computationType = computationType;
    this.inputData = inputData;
    this.category = 'tax_computation';
  }

  toJSON() {
    const base = super.toJSON();
    return {
      ...base,
      computationType: this.computationType,
      category: this.category,
      ...(process.env.NODE_ENV === 'development' && { inputData: this.inputData }),
    };
  }
}

/**
 * Payment processing errors
 */
class PaymentError extends AppError {
  constructor(message, paymentMethod = null, transactionId = null) {
    super(`Payment error: ${message}`, 402, 'PAYMENT_ERROR');
    this.paymentMethod = paymentMethod;
    this.transactionId = transactionId;
    this.category = 'payment';
  }

  toJSON() {
    const base = super.toJSON();
    return {
      ...base,
      paymentMethod: this.paymentMethod,
      transactionId: this.transactionId,
      category: this.category,
    };
  }
}

/**
 * Error factory - creates appropriate error type based on conditions
 */
class ErrorFactory {
  /**
   * Create error from Sequelize validation error
   */
  static fromSeValidationError(error) {
    const message = error.errors?.map(e => e.message).join(', ') || error.message;
    const field = error.errors?.[0]?.path;
    return new ValidationError(message, field);
  }

  /**
   * Create error from JWT error
   */
  static fromJWTError(error) {
    if (error.name === 'TokenExpiredError') {
      return new AuthenticationError('Token expired', 'TOKEN_EXPIRED');
    }
    if (error.name === 'JsonWebTokenError') {
      return new AuthenticationError('Invalid token', 'INVALID_TOKEN');
    }
    return new AuthenticationError('Authentication error', error.message);
  }

  /**
   * Create error from network error
   */
  static fromNetworkError(error, service) {
    if (error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
      return new ExternalServiceError(service, 'connection', error.message);
    }
    return new ExternalServiceError(service, 'request', error.message);
  }

  /**
   * Create error from general Error object
   */
  static fromError(error) {
    // If it's already an AppError, return as-is
    if (error instanceof AppError) {
      return error;
    }

    // Handle known error types
    if (error.name === 'ValidationError') {
      return new ValidationError(error.message);
    }
    if (error.name === 'CastError') {
      return new ValidationError('Invalid data format');
    }

    // Default to generic AppError
    return new AppError(error.message, error.statusCode || 500);
  }
}

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  BusinessLogicError,
  RateLimitError,
  ExternalServiceError,
  DatabaseError,
  FileError,
  TaxComputationError,
  PaymentError,
  ErrorFactory,
};