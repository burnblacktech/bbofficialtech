import { useState, useCallback } from 'react';
import frontendErrorRecoveryService from '../services/frontendErrorRecoveryService';
import toast from 'react-hot-toast';

/**
 * React Hook for Error Recovery and Retry Logic
 * Provides easy integration of error recovery service with React components
 */
export const useErrorRecovery = (operationType = 'api') => {
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [lastError, setLastError] = useState(null);

  /**
   * Execute operation with retry logic
   * @param {Function} operation - The operation to execute
   * @param {Object} options - Additional options
   * @returns {Promise} Result of the operation
   */
  const executeWithRetry = useCallback(async (operation, options = {}) => {
    const {
      showToast = true,
      toastMessage = 'Operation failed, retrying...',
      context = {},
    } = options;

    setIsRetrying(true);
    setLastError(null);

    try {
      const result = await frontendErrorRecoveryService.executeWithRetry(
        operation,
        operationType,
        context,
      );

      if (retryCount > 0) {
        toast.success('Operation completed successfully after retry');
      }

      setRetryCount(0);
      return result;

    } catch (error) {
      setLastError(error);

      if (showToast) {
        if (error.retryExhausted) {
          toast.error(`Operation failed after ${error.maxRetries} attempts`);
        } else {
          toast.error(error.message || 'Operation failed');
        }
      }

      throw error;
    } finally {
      setIsRetrying(false);
    }
  }, [operationType, retryCount]);

  /**
   * Execute API call with retry logic
   * @param {Function} apiCall - The API call function
   * @param {Object} options - Additional options
   * @returns {Promise} API response
   */
  const executeAPICall = useCallback(async (apiCall, options = {}) => {
    return executeWithRetry(apiCall, {
      operationType: 'api',
      ...options,
    });
  }, [executeWithRetry]);

  /**
   * Execute file upload with retry logic
   * @param {Function} uploadFunction - The upload function
   * @param {Object} options - Additional options
   * @returns {Promise} Upload result
   */
  const executeFileUpload = useCallback(async (uploadFunction, options = {}) => {
    return executeWithRetry(uploadFunction, {
      operationType: 'fileUpload',
      ...options,
    });
  }, [executeWithRetry]);

  /**
   * Execute authentication operation with retry logic
   * @param {Function} authOperation - The auth operation function
   * @param {Object} options - Additional options
   * @returns {Promise} Auth result
   */
  const executeAuthOperation = useCallback(async (authOperation, options = {}) => {
    return executeWithRetry(authOperation, {
      operationType: 'auth',
      ...options,
    });
  }, [executeWithRetry]);

  /**
   * Get circuit breaker status
   * @returns {Object} Circuit breaker status
   */
  const getCircuitBreakerStatus = useCallback(() => {
    return frontendErrorRecoveryService.getCircuitBreakerStatus(operationType);
  }, [operationType]);

  /**
   * Get all circuit breaker statuses
   * @returns {Object} All circuit breaker statuses
   */
  const getAllCircuitBreakerStatuses = useCallback(() => {
    return frontendErrorRecoveryService.getAllCircuitBreakerStatuses();
  }, []);

  /**
   * Reset circuit breaker
   * @param {string} operationType - Type of operation to reset
   */
  const resetCircuitBreaker = useCallback((operationType) => {
    frontendErrorRecoveryService.resetCircuitBreaker(operationType);
  }, []);

  return {
    executeWithRetry,
    executeAPICall,
    executeFileUpload,
    executeAuthOperation,
    getCircuitBreakerStatus,
    getAllCircuitBreakerStatuses,
    resetCircuitBreaker,
    isRetrying,
    retryCount,
    lastError,
  };
};

/**
 * Hook for API calls with automatic retry
 */
export const useAPIRetry = () => {
  return useErrorRecovery('api');
};

/**
 * Hook for file uploads with automatic retry
 */
export const useFileUploadRetry = () => {
  return useErrorRecovery('fileUpload');
};

/**
 * Hook for authentication operations with automatic retry
 */
export const useAuthRetry = () => {
  return useErrorRecovery('auth');
};

/**
 * Hook for monitoring circuit breaker status
 */
export const useCircuitBreakerMonitor = () => {
  const [statuses, setStatuses] = useState({});
  const [isMonitoring, setIsMonitoring] = useState(false);

  const startMonitoring = useCallback(() => {
    setIsMonitoring(true);

    const updateStatuses = () => {
      const currentStatuses = frontendErrorRecoveryService.getAllCircuitBreakerStatuses();
      setStatuses(currentStatuses);
    };

    // Update immediately
    updateStatuses();

    // Set up interval for updates
    const interval = setInterval(updateStatuses, 5000); // Update every 5 seconds

    return () => {
      clearInterval(interval);
      setIsMonitoring(false);
    };
  }, []);

  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
  }, []);

  return {
    statuses,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
  };
};

export default useErrorRecovery;
