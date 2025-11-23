// =====================================================
// CENTRALIZED ERROR HANDLER
// Centralized error handling for frontend services
// =====================================================

import toast from 'react-hot-toast';

class ErrorHandler {
  constructor() {
    this.errorCategories = {
      NETWORK: 'network',
      AUTHENTICATION: 'authentication',
      AUTHORIZATION: 'authorization',
      VALIDATION: 'validation',
      BUSINESS: 'business',
      SERVER: 'server',
      UNKNOWN: 'unknown'
    };
  }

  categorizeError(error) {
    if (!error.response) {
      return this.errorCategories.NETWORK;
    }

    const { status } = error.response;

    if (status === 401) return this.errorCategories.AUTHENTICATION;
    if (status === 403) return this.errorCategories.AUTHORIZATION;
    if (status >= 400 && status < 500) return this.errorCategories.VALIDATION;
    if (status >= 500) return this.errorCategories.SERVER;

    return this.errorCategories.UNKNOWN;
  }

  getMessage(error, defaultMessage = 'An unexpected error occurred') {
    // Try to extract message from different error structures
    if (error.response?.data?.message) {
      return error.response.data.message;
    }

    if (error.response?.data?.error) {
      return error.response.data.error;
    }

    if (error.message) {
      return error.message;
    }

    return defaultMessage;
  }

  getSeverity(error) {
    const category = this.categorizeError(error);

    switch (category) {
      case this.errorCategories.NETWORK:
        return 'error';
      case this.errorCategories.AUTHENTICATION:
        return 'warning';
      case this.errorCategories.AUTHORIZATION:
        return 'error';
      case this.errorCategories.VALIDATION:
        return 'warning';
      case this.errorCategories.BUSINESS:
        return 'warning';
      case this.errorCategories.SERVER:
        return 'error';
      default:
        return 'error';
    }
  }

  handle(error, options = {}) {
    const {
      showMessage = true,
      logError = true,
      customMessage = null,
      onError = null
    } = options;

    const category = this.categorizeError(error);
    const message = customMessage || this.getMessage(error);
    const severity = this.getSeverity(error);

    // Log error details in development
    if (logError && process.env.NODE_ENV === 'development') {
      console.error('🚨 Error handled:', {
        category,
        message,
        severity,
        status: error.response?.status,
        url: error.config?.url,
        method: error.config?.method,
        error
      });
    }

    // Show user-friendly message
    if (showMessage) {
      this.showUserMessage(message, severity, category);
    }

    // Call custom error handler
    if (onError) {
      onError(error, { category, message, severity });
    }

    // Track error for analytics (in production)
    if (process.env.NODE_ENV === 'production') {
      this.trackError(error, { category, message, severity });
    }

    return {
      category,
      message,
      severity,
      handled: true
    };
  }

  showUserMessage(message, severity, category) {
    const toastOptions = {
      duration: category === this.errorCategories.NETWORK ? 5000 : 4000,
      position: 'top-right'
    };

    switch (severity) {
      case 'success':
        toast.success(message, toastOptions);
        break;
      case 'warning':
        toast(message, { ...toastOptions, icon: '⚠️' });
        break;
      case 'info':
        toast(message, toastOptions);
        break;
      case 'error':
      default:
        toast.error(message, toastOptions);
        break;
    }
  }

  trackError(error, metadata) {
    // In production, send error to analytics service
    if (window.gtag) {
      window.gtag('event', 'exception', {
        description: metadata.message,
        fatal: false,
        custom_map: {
          error_category: metadata.category,
          error_severity: metadata.severity,
          error_status: error.response?.status
        }
      });
    }

    // Could also send to Sentry, LogRocket, etc.
    console.log('Error tracked:', { error, metadata });
  }

  // Specific handlers for common error types
  handleNetworkError(error, options = {}) {
    return this.handle(error, {
      customMessage: 'Network error. Please check your connection and try again.',
      ...options
    });
  }

  handleAuthError(error, options = {}) {
    return this.handle(error, {
      customMessage: 'Authentication required. Please login again.',
      ...options
    });
  }

  handleValidationError(error, options = {}) {
    return this.handle(error, {
      showMessage: true, // Show validation errors to user
      ...options
    });
  }

  handleServerError(error, options = {}) {
    return this.handle(error, {
      customMessage: 'Server error. Our team has been notified. Please try again later.',
      ...options
    });
  }

  // Batch error handler for multiple errors
  handleBatch(errors, options = {}) {
    const results = errors.map(error => this.handle(error, { showMessage: false, ...options }));

    // Show a summary message
    const errorTypes = [...new Set(results.map(r => r.category))];
    if (errorTypes.length > 0 && options.showMessage !== false) {
      toast.error(`Multiple errors occurred (${errorTypes.join(', ')})`);
    }

    return results;
  }
}

// Create singleton instance
const errorHandler = new ErrorHandler();

export default errorHandler;