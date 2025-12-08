// =====================================================
// SHARED RESPONSE FORMATTER UTILITIES
// Standardized API response formatting to reduce redundancy
// =====================================================

/**
 * Format successful API response
 * @param {object} res - Express response object
 * @param {number} statusCode - HTTP status code (default: 200)
 * @param {string} message - Success message
 * @param {*} data - Response data
 * @param {object} meta - Additional metadata (pagination, etc.)
 * @returns {object} - Formatted response
 */
function sendSuccess(res, statusCode = 200, message = null, data = null, meta = null) {
  const response = {
    success: true,
  };

  if (message) {
    response.message = message;
  }

  if (data !== null) {
    response.data = data;
  }

  if (meta) {
    response.meta = meta;
  }

  return res.status(statusCode).json(response);
}

/**
 * Format error API response
 * @param {object} res - Express response object
 * @param {number} statusCode - HTTP status code (default: 400)
 * @param {string} error - Error message
 * @param {*} details - Additional error details
 * @returns {object} - Formatted error response
 */
function sendError(res, statusCode = 400, error = 'Bad request', details = null) {
  const response = {
    success: false,
    error,
  };

  if (details) {
    response.details = details;
  }

  return res.status(statusCode).json(response);
}

/**
 * Format validation error response
 * @param {object} res - Express response object
 * @param {string[]} errors - Array of validation error messages
 * @param {object} fields - Field-specific errors
 * @returns {object} - Formatted validation error response
 */
function sendValidationError(res, errors = [], fields = null) {
  const response = {
    success: false,
    error: 'Validation failed',
    errors: Array.isArray(errors) ? errors : [errors],
  };

  if (fields) {
    response.fields = fields;
  }

  return res.status(400).json(response);
}

/**
 * Format not found error response
 * @param {object} res - Express response object
 * @param {string} resource - Resource name (e.g., 'User', 'Article')
 * @returns {object} - Formatted not found response
 */
function sendNotFound(res, resource = 'Resource') {
  return res.status(404).json({
    success: false,
    error: `${resource} not found`,
  });
}

/**
 * Format unauthorized error response
 * @param {object} res - Express response object
 * @param {string} message - Custom error message
 * @returns {object} - Formatted unauthorized response
 */
function sendUnauthorized(res, message = 'Unauthorized access') {
  return res.status(401).json({
    success: false,
    error: message,
  });
}

/**
 * Format forbidden error response
 * @param {object} res - Express response object
 * @param {string} message - Custom error message
 * @returns {object} - Formatted forbidden response
 */
function sendForbidden(res, message = 'Access forbidden') {
  return res.status(403).json({
    success: false,
    error: message,
  });
}

/**
 * Format paginated response
 * @param {object} res - Express response object
 * @param {Array} items - Array of items
 * @param {number} total - Total count
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @param {string} message - Success message
 * @returns {object} - Formatted paginated response
 */
function sendPaginated(res, items, total, page, limit, message = null) {
  return sendSuccess(
    res,
    200,
    message,
    items,
    {
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    }
  );
}

/**
 * Format created response
 * @param {object} res - Express response object
 * @param {string} message - Success message
 * @param {*} data - Created resource data
 * @returns {object} - Formatted created response
 */
function sendCreated(res, message = 'Resource created successfully', data = null) {
  return sendSuccess(res, 201, message, data);
}

/**
 * Format updated response
 * @param {object} res - Express response object
 * @param {string} message - Success message
 * @param {*} data - Updated resource data
 * @returns {object} - Formatted updated response
 */
function sendUpdated(res, message = 'Resource updated successfully', data = null) {
  return sendSuccess(res, 200, message, data);
}

/**
 * Format deleted response
 * @param {object} res - Express response object
 * @param {string} message - Success message
 * @returns {object} - Formatted deleted response
 */
function sendDeleted(res, message = 'Resource deleted successfully') {
  return sendSuccess(res, 200, message);
}

module.exports = {
  sendSuccess,
  sendError,
  sendValidationError,
  sendNotFound,
  sendUnauthorized,
  sendForbidden,
  sendPaginated,
  sendCreated,
  sendUpdated,
  sendDeleted,
};

