// =====================================================
// AUTHENTICATION SERVICE
// Authentication (enhanced) using unified API client
// =====================================================

import apiClient from '../core/APIClient';
import errorHandler from '../core/ErrorHandler';

class AuthService {
  // Login with email/password
  async login(credentials) {
    try {
      const response = await apiClient.post('/auth/login', credentials);
      return response.data;
    } catch (error) {
      errorHandler.handleAuthError(error);
      throw error;
    }
  }

  // Register new user
  async register(userData) {
    try {
      const response = await apiClient.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      errorHandler.handleValidationError(error);
      throw error;
    }
  }

  // Logout user
  async logout() {
    try {
      const response = await apiClient.post('/auth/logout');
      apiClient.clearAuthTokens();
      return response.data;
    } catch (error) {
      // Even if logout fails on server, clear local tokens
      apiClient.clearAuthTokens();
      throw error;
    }
  }

  // Refresh access token
  async refreshToken() {
    try {
      const response = await apiClient.post('/auth/refresh', {}, { _skipAuth: true });

      if (response.data.success) {
        apiClient.setAuthToken(response.data.accessToken);

        if (response.data.refreshToken) {
          apiClient.setRefreshToken(response.data.refreshToken);
        }
      }

      return response.data;
    } catch (error) {
      // Refresh failed - clear tokens and re-throw
      apiClient.clearAuthTokens();
      throw error;
    }
  }

  // Get current user profile
  async getProfile() {
    try {
      const response = await apiClient.get('/auth/profile');
      return response.data;
    } catch (error) {
      errorHandler.handle(error);
      throw error;
    }
  }

  // Update user profile
  async updateProfile(profileData) {
    try {
      const response = await apiClient.put('/auth/profile', profileData);
      return response.data;
    } catch (error) {
      errorHandler.handleValidationError(error);
      throw error;
    }
  }

  // Request password reset
  async requestPasswordReset(email) {
    try {
      const response = await apiClient.post('/auth/forgot-password', { email });
      return response.data;
    } catch (error) {
      errorHandler.handle(error);
      throw error;
    }
  }

  // Reset password with token
  async resetPassword(token, newPassword) {
    try {
      const response = await apiClient.post('/auth/reset-password', {
        token,
        newPassword,
      });
      return response.data;
    } catch (error) {
      errorHandler.handleValidationError(error);
      throw error;
    }
  }

  // Set password for OAuth users (first time)
  async setPassword(newPassword) {
    try {
      const response = await apiClient.put('/users/set-password', {
        newPassword,
      });
      return response.data;
    } catch (error) {
      errorHandler.handleValidationError(error);
      throw error;
    }
  }

  // Change password
  async changePassword(currentPassword, newPassword) {
    try {
      const response = await apiClient.put('/users/password', {
        currentPassword,
        newPassword,
      });
      return response.data;
    } catch (error) {
      errorHandler.handleValidationError(error);
      throw error;
    }
  }

  // Verify email
  async verifyEmail(token) {
    try {
      const response = await apiClient.post('/auth/verify-email', { token });
      return response.data;
    } catch (error) {
      errorHandler.handle(error);
      throw error;
    }
  }

  // Persist onboarding completion server-side (preferred over localStorage-only)
  async completeOnboarding() {
    try {
      const response = await apiClient.post('/auth/complete-onboarding', { onboardingCompleted: true });

      // Best-effort: also update cached local user record
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const u = JSON.parse(userStr);
          localStorage.setItem('user', JSON.stringify({ ...u, onboardingCompleted: true }));
        }
      } catch (e) {
        // ignore localStorage errors
      }

      return response.data;
    } catch (error) {
      errorHandler.handle(error);
      throw error;
    }
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!apiClient.getAuthToken();
  }

  // Get current user from localStorage (checks both regular user and admin user)
  getCurrentUser() {
    try {
      // Check for regular user first
      const userStr = localStorage.getItem('user');
      if (userStr) {
        return JSON.parse(userStr);
      }

      // Check for admin user
      const adminUserStr = localStorage.getItem('adminUser');
      if (adminUserStr) {
        return JSON.parse(adminUserStr);
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  // Google OAuth login redirect
  googleLoginRedirect() {
    // Get the base URL - use centralized config
    // Dynamic import to avoid circular dependency
    const getApiBaseUrl = () => {
      if (process.env.REACT_APP_API_URL) {
        return process.env.REACT_APP_API_URL;
      }
      return process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:3002/api';
    };
    const baseURL = getApiBaseUrl();
    // Redirect to backend Google OAuth endpoint.
    // Pass the current frontend origin so backend can redirect back correctly even if FRONTEND_URL is misconfigured.
    // Backend validates this against an allowlist to prevent open redirects.
    const redirectBase = window.location.origin;
    window.location.href = `${baseURL}/auth/google?redirectBase=${encodeURIComponent(redirectBase)}`;
  }

  // Handle OAuth login (sets tokens directly without calling login endpoint)
  handleOAuthLogin(user, token, refreshToken) {
    try {
      // Store tokens
      apiClient.setAuthToken(token);
      if (refreshToken) {
        apiClient.setRefreshToken(refreshToken);
      }

      // Store user data
      localStorage.setItem('user', JSON.stringify(user));

      return {
        success: true,
        user,
        token,
        refreshToken,
      };
    } catch (error) {
      console.error('OAuth login handling error:', error);
      throw error;
    }
  }
}

// Create singleton instance
const authService = new AuthService();

export default authService;
