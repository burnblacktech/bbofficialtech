/**
 * API Retry Utility with Exponential Backoff
 * Provides retry mechanism for API calls with configurable retry attempts and delays
 */

/**
 * Retry an async function with exponential backoff
 * @param {Function} fetchFn - The async function to retry
 * @param {Object} options - Retry options
 * @param {number} options.maxRetries - Maximum number of retry attempts (default: 3)
 * @param {number} options.initialDelay - Initial delay in milliseconds (default: 1000)
 * @param {number} options.maxDelay - Maximum delay in milliseconds (default: 10000)
 * @param {Function} options.shouldRetry - Function to determine if error should be retried (default: retry on network errors)
 * @param {AbortSignal} options.signal - AbortSignal to cancel retry attempts
 * @returns {Promise} The result of the fetchFn
 */
export const fetchWithRetry = async (fetchFn, options = {}) => {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    shouldRetry = (error) => {
      // Retry on network errors or 5xx server errors
      if (!error.response) return true; // Network error
      const status = error.response?.status;
      return status >= 500 && status < 600; // Server error
    },
    signal,
  } = options;

  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    // Check if aborted
    if (signal?.aborted) {
      throw new Error('Request aborted');
    }

    try {
      return await fetchFn();
    } catch (error) {
      lastError = error;

      // Don't retry if it's the last attempt or error shouldn't be retried
      if (attempt === maxRetries || !shouldRetry(error)) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(initialDelay * Math.pow(2, attempt), maxDelay);

      // Wait before retrying
      await new Promise((resolve, reject) => {
        const timeoutId = setTimeout(resolve, delay);

        // Handle abort signal
        if (signal) {
          signal.addEventListener('abort', () => {
            clearTimeout(timeoutId);
            reject(new Error('Request aborted'));
          });
        }
      });
    }
  }

  throw lastError;
};

/**
 * Create a retry wrapper for API client methods
 * @param {Object} apiClient - The API client instance
 * @param {Object} retryOptions - Retry options
 * @returns {Object} Wrapped API client with retry logic
 */
export const withRetry = (apiClient, retryOptions = {}) => {
  const wrappedClient = { ...apiClient };

  // Wrap common HTTP methods
  ['get', 'post', 'put', 'patch', 'delete'].forEach((method) => {
    const originalMethod = apiClient[method];
    if (typeof originalMethod === 'function') {
      wrappedClient[method] = async (...args) => {
        return fetchWithRetry(
          () => originalMethod.apply(apiClient, args),
          retryOptions,
        );
      };
    }
  });

  return wrappedClient;
};

export default fetchWithRetry;

