// =====================================================
// UNIFIED API CLIENT
// Single, unified API client to eliminate service duplication
// Consistent error handling across all services
// Built-in request/response caching
// Automatic retry logic
// =====================================================

import axios from 'axios';
import toast from 'react-hot-toast';
import { enterpriseLogger } from '../../utils/logger';
import { getApiBaseUrl } from '../../utils/apiConfig';

class APIClient {
  constructor() {
    this.baseURL = getApiBaseUrl();
    this.defaultTimeout = 30000;
    this.cache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
    this.isRefreshing = false; // Flag to prevent multiple simultaneous refresh attempts
    this.refreshPromise = null; // Store the refresh promise to reuse it
    this.refreshAttempts = 0; // Track refresh attempts to prevent infinite loops
    this.maxRefreshAttempts = 1; // Maximum refresh attempts before giving up
    this.retryConfig = {
      retries: 2, // Reduced from 3 to prevent excessive retries
      retryDelay: 1000,
      retryCondition: (error) => {
        // Only retry on network errors or 5xx errors (but not 500 specifically to avoid cascading failures)
        // Don't retry on 500 errors as they usually indicate server-side bugs that won't be fixed by retrying
        if (!error.response) {
          return true; // Network error - retry
        }
        const status = error.response.status;
        // Retry on 502, 503, 504 (temporary server issues) but not 500 (server errors)
        return status >= 502 && status <= 504;
      },
    };

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: this.defaultTimeout,
      withCredentials: true, // Required for HttpOnly cookies (refresh tokens)
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
    });

    this.setupInterceptors();
  }

  setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add correlation ID for tracking
        config.headers['X-Correlation-ID'] = this.generateCorrelationId();

        // Add auth token (skip if _skipAuth flag is set)
        if (!config._skipAuth) {
          const token = this.getAuthToken();
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }

        // Log request in development
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          enterpriseLogger.info(`API Request: ${config.method?.toUpperCase()} ${config.url}`, {
            data: config.data,
            params: config.params,
          });
        }

        return config;
      },
      (error) => {
        // eslint-disable-next-line no-console
        enterpriseLogger.error('Request interceptor error', { error });
        return Promise.reject(error);
      },
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        // Log response in development
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          enterpriseLogger.info(`API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, {
            status: response.status,
            data: response.data,
          });
        }

        return response;
      },
      async (error) => {
        const originalRequest = error.config;

        // Log error in development (skip if suppressed for optional endpoints)
        if (process.env.NODE_ENV === 'development' && !originalRequest?._suppressErrorLog) {
          // eslint-disable-next-line no-console
          enterpriseLogger.error(`API Error: ${originalRequest?.method?.toUpperCase()} ${originalRequest?.url}`, {
            status: error.response?.status,
            message: error.message,
            data: error.response?.data,
          });
        }

        // Handle 401 unauthorized - attempt token refresh
        // Skip if this is already a refresh request or if we're already refreshing
        if (error.response?.status === 401 && !originalRequest._retry && !originalRequest._isRefreshRequest) {
          return this.handleTokenRefresh(originalRequest);
        }

        // Handle other HTTP errors with user-friendly messages (skip if suppressed)
        if (!originalRequest?._suppressErrorLog) {
          this.handleHttpError(error);
        }

        return Promise.reject(error);
      },
    );
  }

  async handleTokenRefresh(originalRequest) {
    // Prevent infinite refresh loops
    if (this.refreshAttempts >= this.maxRefreshAttempts) {
      this.clearAuthTokens();
      if (!window.location.pathname.includes('/login')) {
        toast.error('Session expired. Please login again.');
        window.location.href = '/login';
      }
      return Promise.reject(new Error('Max refresh attempts exceeded'));
    }

    // Prevent multiple simultaneous refresh attempts
    if (this.isRefreshing) {
      // Wait for the existing refresh to complete
      try {
        await this.refreshPromise;
        // Retry original request after refresh completes
        const token = this.getAuthToken();
        if (token) {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return this.client(originalRequest);
        }
      } catch {
        // Refresh failed, fall through to handle error
      }
    }

    originalRequest._retry = true;
    this.isRefreshing = true;
    this.refreshAttempts++;

    try {
      // Get refresh token from localStorage or cookie
      const refreshToken = this.getRefreshToken();

      // Mark this request as a refresh request to prevent infinite loops
      const refreshRequestConfig = {
        _skipAuth: true,
        _isRefreshRequest: true,
      };

      // Attempt to refresh token - try cookie-based first, then body-based
      let refreshResponse;
      try {
        // Try cookie-based refresh (sends cookies automatically)
        refreshResponse = await this.post('/auth/refresh', {}, refreshRequestConfig);
      } catch (cookieError) {
        // If cookie-based fails and we have a refresh token, try body-based
        if (refreshToken && cookieError.response?.status === 401) {
          refreshResponse = await this.post('/auth/refresh', { refreshToken }, refreshRequestConfig);
        } else {
          throw cookieError;
        }
      }

      if (refreshResponse.data.success && refreshResponse.data.accessToken) {
        // Update stored token
        this.setAuthToken(refreshResponse.data.accessToken);

        // Update user data if provided
        if (refreshResponse.data.user) {
          localStorage.setItem('user', JSON.stringify(refreshResponse.data.user));
        }

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${refreshResponse.data.accessToken}`;
        return this.client(originalRequest);
      }
    } catch (refreshError) {
      // Refresh failed - clear auth and stop retrying
      this.isRefreshing = false;
      this.refreshPromise = null;
      this.refreshAttempts = 0; // Reset attempts
      this.clearAuthTokens();

      // Log the error for debugging
      if (process.env.NODE_ENV === 'development') {
        enterpriseLogger.error('Token refresh failed', {
          status: refreshError.response?.status,
          message: refreshError.message,
          data: refreshError.response?.data,
        });
      }

      // Only show toast and redirect if not already on login page or auth page
      const isAuthPage = window.location.pathname.includes('/login') ||
        window.location.pathname.includes('/auth') ||
        window.location.pathname.includes('/signup');
      if (!isAuthPage) {
        // Don't show toast if it's a silent refresh (e.g., background prefetch)
        if (!originalRequest?._suppressErrorLog) {
          toast.error('Your session has expired. Please login again.', {
            duration: 4000,
          });
        }
        // Delay redirect slightly to allow toast to show
        setTimeout(() => {
          window.location.href = '/login';
        }, 100);
      }

      // Reject the original request
      return Promise.reject(refreshError);
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
      // Reset attempts on successful refresh
      if (this.refreshAttempts > 0) {
        this.refreshAttempts = 0;
      }
    }
  }

  handleHttpError(error) {
    const { response } = error;

    if (!response) {
      // Network error
      toast.error('Network error. Please check your connection.');
      return;
    }

    const { status, data } = response;

    // Handle different status codes with appropriate messages
    switch (status) {
      case 400:
        toast.error(data?.message || 'Invalid request. Please check your input.');
        break;
      case 403:
        toast.error('Access denied. You do not have permission to perform this action.');
        break;
      case 404:
        toast.error('The requested resource was not found.');
        break;
      case 409:
        toast.error(data?.message || 'Conflict with existing data.');
        break;
      case 422:
        toast.error(data?.message || 'Invalid data provided.');
        break;
      case 429:
        toast.error('Too many requests. Please try again later.');
        break;
      case 500:
      case 502:
      case 503:
      case 504:
        toast.error('Server error. Please try again later.');
        break;
      default:
        toast.error(data?.message || 'An unexpected error occurred.');
    }
  }

  // HTTP methods with retry logic and caching
  async get(url, config = {}) {
    const cacheKey = `GET:${url}`;

    // Check cache if enabled
    if (!config._skipCache && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheExpiry) {
        return cached.data;
      }
    }

    const response = await this.withRetry(() => this.client.get(url, config));

    // Cache successful responses
    if (!config._skipCache && response.status === 200) {
      this.cache.set(cacheKey, {
        data: response,
        timestamp: Date.now(),
      });
    }

    return response;
  }

  async post(url, data = {}, config = {}) {
    return this.withRetry(() => this.client.post(url, data, config));
  }

  async put(url, data = {}, config = {}) {
    return this.withRetry(() => this.client.put(url, data, config));
  }

  async patch(url, data = {}, config = {}) {
    return this.withRetry(() => this.client.patch(url, data, config));
  }

  async delete(url, config = {}) {
    return this.withRetry(() => this.client.delete(url, config));
  }

  // File upload with progress tracking
  async uploadFile(url, file, onProgress = null, config = {}) {
    const formData = new FormData();
    formData.append('file', file);

    const uploadConfig = {
      ...config,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...config.headers,
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total,
          );
          onProgress(percentCompleted);
        }
      },
    };

    return this.withRetry(() => this.client.post(url, formData, uploadConfig));
  }

  // Retry logic with exponential backoff
  async withRetry(requestFn, attempt = 1) {
    try {
      return await requestFn();
    } catch (error) {
      const { retries, retryDelay, retryCondition } = this.retryConfig;

      if (attempt <= retries && retryCondition(error)) {
        const delay = retryDelay * Math.pow(2, attempt - 1); // Exponential backoff

        await new Promise(resolve => setTimeout(resolve, delay));

        return this.withRetry(requestFn, attempt + 1);
      }

      throw error;
    }
  }

  // Cache management
  clearCache(pattern = null) {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }

  // Token management
  generateCorrelationId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getAuthToken() {
    return localStorage.getItem('accessToken');
  }

  setAuthToken(token) {
    if (token) {
      localStorage.setItem('accessToken', token);
    } else {
      localStorage.removeItem('accessToken');
    }
  }

  getRefreshToken() {
    return localStorage.getItem('refreshToken');
  }

  setRefreshToken(token) {
    if (token) {
      localStorage.setItem('refreshToken', token);
    } else {
      localStorage.removeItem('refreshToken');
    }
  }

  clearAuthTokens() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    // Also clear admin tokens
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    // Reset refresh state to prevent loops
    this.isRefreshing = false;
    this.refreshAttempts = 0;
    this.refreshPromise = null;
  }

  // Utility methods
  isOnline() {
    return navigator.onLine;
  }

  getServerHealth() {
    return this.get('/health', { _skipCache: true });
  }
}

// Create singleton instance
const apiClient = new APIClient();

export default apiClient;
export { apiClient };
