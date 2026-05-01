// =====================================================
// API CLIENT - Axios instance with auth interceptors
// =====================================================

import axios from 'axios';
import { tokenStore } from './tokenStore';

const API_BASE_URL = process.env.REACT_APP_API_URL
  || (process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:3002/api');

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 30000, // 30s default; file uploads override per-request
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: attach access token
api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Refresh lock — prevents thundering herd when multiple 401s fire concurrently
let refreshPromise = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // If a refresh is already in-flight, wait for it instead of firing another
        if (!refreshPromise) {
          refreshPromise = axios
            .post(`${API_BASE_URL}/auth/refresh`, {}, { withCredentials: true })
            .finally(() => { refreshPromise = null; });
        }

        const refreshResponse = await refreshPromise;

        if (refreshResponse.data?.accessToken) {
          tokenStore.set(refreshResponse.data.accessToken);
          originalRequest.headers.Authorization = `Bearer ${refreshResponse.data.accessToken}`;
          return api(originalRequest);
        }
      } catch {
        refreshPromise = null;
        tokenStore.clear();
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  },
);

/**
 * Create an AbortController-backed cancel token for use in useEffect cleanup.
 */
export const createCancelToken = () => {
  const controller = new AbortController();
  return { signal: controller.signal, cancel: () => controller.abort() };
};

export default api;
