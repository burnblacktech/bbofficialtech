// =====================================================
// UNIFIED API CLIENT
// Single, unified API client to eliminate service duplication
// Consistent error handling across all services
// Built-in request/response caching
// Automatic retry logic
// =====================================================

import axios from 'axios';
import toast from 'react-hot-toast';

class APIClient {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3002/api';
    this.defaultTimeout = 30000;
    this.cache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
    this.retryConfig = {
      retries: 3,
      retryDelay: 1000,
      retryCondition: (error) => {
        return !error.response || (error.response.status >= 500 && error.response.status <= 599);
      }
    };

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: this.defaultTimeout,
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });

    this.setupInterceptors();
  }

  setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add correlation ID for tracking
        config.headers['X-Correlation-ID'] = this.generateCorrelationId();

        // Add auth token
        const token = this.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Log request in development
        if (process.env.NODE_ENV === 'development') {
          console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`, {
            data: config.data,
            params: config.params
          });
        }

        return config;
      },
      (error) => {
        console.error('❌ Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        // Log response in development
        if (process.env.NODE_ENV === 'development') {
          console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, {
            status: response.status,
            data: response.data
          });
        }

        return response;
      },
      async (error) => {
        const originalRequest = error.config;

        // Log error in development
        if (process.env.NODE_ENV === 'development') {
          console.error(`❌ API Error: ${originalRequest?.method?.toUpperCase()} ${originalRequest?.url}`, {
            status: error.response?.status,
            message: error.message,
            data: error.response?.data
          });
        }

        // Handle 401 unauthorized - attempt token refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
          return this.handleTokenRefresh(originalRequest);
        }

        // Handle other HTTP errors with user-friendly messages
        this.handleHttpError(error);

        return Promise.reject(error);
      }
    );
  }

  async handleTokenRefresh(originalRequest) {
    originalRequest._retry = true;

    try {
      // Attempt to refresh token
      const refreshResponse = await this.post('/auth/refresh', {}, { _skipAuth: true });

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
      // Refresh failed - clear auth and redirect
      this.clearAuthTokens();
      toast.error('Session expired. Please login again.');

      // Avoid redirect loops
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }

    return Promise.reject(originalRequest);
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
        timestamp: Date.now()
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
        ...config.headers
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        }
      }
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