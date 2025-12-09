// =====================================================
// ERROR UTILITIES
// Helper functions for handling error objects consistently
// =====================================================

/**
 * Safely extract error message from various error object structures
 * Handles:
 * - Standard Error objects
 * - Axios errors
 * - Backend standardized error responses {error: {code, message, details, timestamp}}
 * - Direct error objects with {code, message, details, timestamp} structure
 * - React Query errors
 * - Plain strings
 */
export const getErrorMessage = (error) => {
  if (!error) return 'An unknown error occurred';

  // If it's already a string, return it
  if (typeof error === 'string') {
    return error;
  }

  // Handle direct error object structure: {code, message, details, timestamp}
  // This is a common backend error format that might be passed directly
  if (error && typeof error === 'object' && error.message && typeof error.message === 'string') {
    // Check if it has the structure {code, message, details, timestamp}
    if (error.code !== undefined || error.details !== undefined || error.timestamp !== undefined) {
      return error.message;
    }
  }

  // Try standardized backend error format: {success: false, error: {code, message, details, timestamp}}
  if (error?.error?.message) {
    return error.error.message;
  }

  // Try Axios error response with standardized format
  if (error?.response?.data?.error?.message) {
    return error.response.data.error.message;
  }

  // Try Axios error response with legacy format
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }

  // Try standard Error object
  if (error?.message) {
    return error.message;
  }

  // Try React Query error structure
  if (error?.data?.error?.message) {
    return error.data.error.message;
  }

  if (error?.data?.message) {
    return error.data.message;
  }

  // Fallback: stringify if it's an object (but only as last resort)
  if (typeof error === 'object') {
    try {
      // Try to extract a meaningful message from the object
      if (error.toString && typeof error.toString === 'function') {
        const stringified = error.toString();
        if (stringified !== '[object Object]') {
          return stringified;
        }
      }
      // Last resort: JSON stringify, but limit length
      const jsonString = JSON.stringify(error);
      return jsonString.length > 200 ? jsonString.substring(0, 200) + '...' : jsonString;
    } catch {
      return 'An error occurred';
    }
  }

  return 'An unknown error occurred';
};

/**
 * Extract error code from error object
 */
export const getErrorCode = (error) => {
  if (!error) return 'UNKNOWN_ERROR';

  return (
    error?.error?.code ||
    error?.response?.data?.error?.code ||
    error?.code ||
    'UNKNOWN_ERROR'
  );
};

/**
 * Extract error details from error object
 */
export const getErrorDetails = (error) => {
  if (!error) return null;

  return (
    error?.error?.details ||
    error?.response?.data?.error?.details ||
    error?.details ||
    null
  );
};

/**
 * Check if error is a network error
 */
export const isNetworkError = (error) => {
  return !error?.response && error?.message?.includes('Network');
};

/**
 * Check if error is an authentication error
 */
export const isAuthError = (error) => {
  return (
    error?.response?.status === 401 ||
    error?.response?.status === 403 ||
    getErrorCode(error) === 'UNAUTHORIZED' ||
    getErrorCode(error) === 'FORBIDDEN'
  );
};

export default {
  getErrorMessage,
  getErrorCode,
  getErrorDetails,
  isNetworkError,
  isAuthError,
};

