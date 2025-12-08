// =====================================================
// STANDARDIZED API RESPONSE FORMATTER
// Ensures consistent response format across all endpoints
// =====================================================

const enterpriseLogger = require('./logger');

/**
 * Standardized success response
 */
const successResponse = (res, data, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Standardized error response
 */
const errorResponse = (res, error, statusCode = 500) => {
  const errorMessage = error?.message || 'Internal server error';
  const errorCode = error?.code || 'INTERNAL_ERROR';
  const errorDetails = error?.details || null;

  enterpriseLogger.error('API Error Response', {
    statusCode,
    errorCode,
    message: errorMessage,
    details: errorDetails,
    stack: error?.stack,
  });

  return res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message: errorMessage,
      details: errorDetails,
      timestamp: new Date().toISOString(),
    },
  });
};

/**
 * Standardized validation error response
 */
const validationErrorResponse = (res, errors, message = 'Validation failed') => {
  return res.status(400).json({
    success: false,
    error: {
      code: 'VALIDATION_ERROR',
      message,
      details: errors,
      timestamp: new Date().toISOString(),
    },
  });
};

/**
 * Standardized not found response
 */
const notFoundResponse = (res, resource = 'Resource', message = null) => {
  return res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: message || `${resource} not found`,
      timestamp: new Date().toISOString(),
    },
  });
};

/**
 * Standardized unauthorized response
 */
const unauthorizedResponse = (res, message = 'Unauthorized access') => {
  return res.status(403).json({
    success: false,
    error: {
      code: 'UNAUTHORIZED',
      message,
      timestamp: new Date().toISOString(),
    },
  });
};

/**
 * Standardized paginated response
 */
const paginatedResponse = (res, data, pagination, message = 'Success') => {
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination,
    timestamp: new Date().toISOString(),
  });
};

module.exports = {
  successResponse,
  errorResponse,
  validationErrorResponse,
  notFoundResponse,
  unauthorizedResponse,
  paginatedResponse,
};
