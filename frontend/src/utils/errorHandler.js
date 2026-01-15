// Comprehensive Error Handling System
// Provides user-friendly error messages and recovery mechanisms

export const ERROR_TYPES = {
  NETWORK: 'network',
  AUTHENTICATION: 'authentication',
  VALIDATION: 'validation',
  SERVER: 'server',
  CLIENT: 'client',
  FILE_UPLOAD: 'file_upload',
  PERMISSION: 'permission',
  RATE_LIMIT: 'rate_limit',
  MAINTENANCE: 'maintenance',
};

export const ERROR_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
};

export class AppError extends Error {
  constructor(message, type = ERROR_TYPES.CLIENT, severity = ERROR_SEVERITY.MEDIUM, code = null, originalError = null) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.severity = severity;
    this.code = code;
    this.originalError = originalError;
    this.timestamp = new Date().toISOString();
    this.userId = this.getCurrentUserId();
  }

  getCurrentUserId() {
    try {
      // Get user ID from auth store or local storage
      return localStorage.getItem('userId') || 'anonymous';
    } catch {
      return 'anonymous';
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      type: this.type,
      severity: this.severity,
      code: this.code,
      timestamp: this.timestamp,
      userId: this.userId,
      stack: this.stack,
      originalError: this.originalError?.message,
    };
  }
}

// Error message mappings for user-friendly display
export const ERROR_MESSAGES = {
  [ERROR_TYPES.NETWORK]: {
    title: 'Connection Problem',
    message: 'Unable to connect to our servers. Please check your internet connection.',
    suggestion: 'Try refreshing the page or check your network settings.',
    icon: '📶',
  },
  [ERROR_TYPES.AUTHENTICATION]: {
    title: 'Authentication Required',
    message: 'Your session has expired or you need to log in again.',
    suggestion: 'Please log in to continue.',
    icon: '🔐',
  },
  [ERROR_TYPES.VALIDATION]: {
    title: 'Invalid Input',
    message: 'Please check your input and try again.',
    suggestion: 'Review the highlighted fields and correct any errors.',
    icon: '⚠️',
  },
  [ERROR_TYPES.SERVER]: {
    title: 'Server Error',
    message: 'Something went wrong on our end. Our team has been notified.',
    suggestion: 'Please try again in a few moments.',
    icon: '🔧',
  },
  [ERROR_TYPES.FILE_UPLOAD]: {
    title: 'Upload Failed',
    message: 'Unable to upload your file. Please check the file format and size.',
    suggestion: 'Ensure the file is under 10MB and in a supported format.',
    icon: '📎',
  },
  [ERROR_TYPES.PERMISSION]: {
    title: 'Permission Denied',
    message: 'You don\'t have permission to perform this action.',
    suggestion: 'Contact your administrator if you believe this is an error.',
    icon: '🚫',
  },
  [ERROR_TYPES.RATE_LIMIT]: {
    title: 'Too Many Requests',
    message: 'You\'ve made too many requests. Please wait before trying again.',
    suggestion: 'Wait a few minutes before retrying.',
    icon: '⏱️',
  },
  [ERROR_TYPES.MAINTENANCE]: {
    title: 'Under Maintenance',
    message: 'The service is currently under maintenance.',
    suggestion: 'Please check back later.',
    icon: '🔨',
  },
};

// HTTP status code to error type mapping
export const HTTP_STATUS_MAPPING = {
  400: ERROR_TYPES.VALIDATION,
  401: ERROR_TYPES.AUTHENTICATION,
  403: ERROR_TYPES.PERMISSION,
  404: ERROR_TYPES.CLIENT,
  408: ERROR_TYPES.NETWORK,
  429: ERROR_TYPES.RATE_LIMIT,
  500: ERROR_TYPES.SERVER,
  502: ERROR_TYPES.SERVER,
  503: ERROR_TYPES.MAINTENANCE,
  504: ERROR_TYPES.NETWORK,
};

// Error parsing and classification
export const parseError = (error) => {
  // Handle Axios errors
  if (error.response) {
    const { status, data } = error.response;
    const errorType = HTTP_STATUS_MAPPING[status] || ERROR_TYPES.SERVER;

    return new AppError(
      data?.message || error.message,
      errorType,
      status >= 500 ? ERROR_SEVERITY.HIGH : ERROR_SEVERITY.MEDIUM,
      status,
      error,
    );
  }

  // Handle network errors
  if (error.request) {
    return new AppError(
      'Network request failed',
      ERROR_TYPES.NETWORK,
      ERROR_SEVERITY.HIGH,
      null,
      error,
    );
  }

  // Handle client-side errors
  return new AppError(
    error.message || 'An unexpected error occurred',
    ERROR_TYPES.CLIENT,
    ERROR_SEVERITY.MEDIUM,
    null,
    error,
  );
};

// User-friendly error display
export const getErrorDisplay = (error) => {
  const errorType = error.type || ERROR_TYPES.CLIENT;
  const config = ERROR_MESSAGES[errorType] || ERROR_MESSAGES[ERROR_TYPES.CLIENT];

  return {
    ...config,
    severity: error.severity,
    code: error.code,
    timestamp: error.timestamp,
  };
};

// Retry mechanism with exponential backoff
export const createRetryFunction = (fn, maxRetries = 3, baseDelay = 1000) => {
  return async (...args) => {
    let lastError;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fn(...args);
      } catch (error) {
        lastError = error;

        // Don't retry for certain error types
        if (error.type === ERROR_TYPES.AUTHENTICATION ||
          error.type === ERROR_TYPES.PERMISSION ||
          error.type === ERROR_TYPES.VALIDATION) {
          throw error;
        }

        // Calculate delay with exponential backoff
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  };
};

// Error logging utility
export const logError = (error, context = {}) => {
  const errorReport = {
    ...error.toJSON(),
    context,
    userAgent: navigator.userAgent,
    url: window.location.href,
    timestamp: new Date().toISOString(),
  };

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error Report:', errorReport);
  }

  // Store locally for debugging
  try {
    const errorKey = `error_${error.timestamp}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(errorKey, JSON.stringify(errorReport));
  } catch (storageError) {
    console.warn('Failed to store error locally:', storageError);
  }

  // Here you would typically send to error reporting service
  // Example: errorReportingService.send(errorReport);
};

// Global error handler
export const setupGlobalErrorHandler = () => {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const error = parseError(event.reason);
    logError(error, { type: 'unhandled_promise_rejection' });
    event.preventDefault();
  });

  // Handle uncaught errors
  window.addEventListener('error', (event) => {
    const error = new AppError(
      event.message,
      ERROR_TYPES.CLIENT,
      ERROR_SEVERITY.HIGH,
      null,
      event.error,
    );
    logError(error, {
      type: 'uncaught_error',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  // Handle network errors
  window.addEventListener('offline', () => {
    console.warn('Network connection lost');
  });

  window.addEventListener('online', () => {
    // Network connection restored - could trigger reconnection logic
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.info('Network connection restored');
    }
  });
};

// Toast notification helpers
export const showErrorToast = (error, toast) => {
  const display = getErrorDisplay(error);

  toast.error(`${display.icon} ${display.title}: ${display.message}`, {
    description: display.suggestion,
    duration: error.severity === ERROR_SEVERITY.CRITICAL ? 10000 : 5000,
    action: error.type === ERROR_TYPES.NETWORK ? {
      label: 'Retry',
      onClick: () => window.location.reload(),
    } : undefined,
  });
};

export const showSuccessToast = (message, toast) => {
  toast.success(message, {
    duration: 3000,
  });
};

// File upload error handling
export const handleFileUploadError = (error) => {
  let message = 'File upload failed';

  if (error.code === 'FILE_TOO_LARGE') {
    message = 'File is too large';
  } else if (error.code === 'INVALID_FILE_TYPE') {
    message = 'Invalid file type';
  } else if (error.type === ERROR_TYPES.NETWORK) {
    message = 'Upload failed due to network issues';
  }

  return new AppError(message, ERROR_TYPES.FILE_UPLOAD, ERROR_SEVERITY.MEDIUM, error.code, error);
};

// Form validation error handling
export const handleValidationError = (errors) => {
  const errorMessages = Object.values(errors).flat();
  return new AppError(
    errorMessages[0] || 'Please correct the form errors',
    ERROR_TYPES.VALIDATION,
    ERROR_SEVERITY.LOW,
    'VALIDATION_ERROR',
    { fieldErrors: errors },
  );
};

// API response error handling
export const handleApiError = (error, context = {}) => {
  const parsedError = parseError(error);
  logError(parsedError, context);

  // Handle specific error types
  switch (parsedError.type) {
    case ERROR_TYPES.AUTHENTICATION:
      // Redirect to login or refresh token
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      break;

    case ERROR_TYPES.RATE_LIMIT:
      // Show rate limit message
      console.warn('Rate limit exceeded, slowing down requests');
      break;

    default:
      // Log and continue
      break;
  }

  return parsedError;
};

const errorHandlerUtils = {
  AppError,
  ERROR_TYPES,
  ERROR_SEVERITY,
  parseError,
  getErrorDisplay,
  createRetryFunction,
  logError,
  setupGlobalErrorHandler,
  showErrorToast,
  showSuccessToast,
  handleFileUploadError,
  handleValidationError,
  handleApiError,
};

export default errorHandlerUtils;
