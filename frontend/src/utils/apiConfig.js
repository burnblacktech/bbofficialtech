// =====================================================
// API CONFIGURATION UTILITY
// Centralized API base URL configuration
// Ensures consistent API URL usage across the application
// =====================================================

/**
 * Get API base URL based on environment
 * @returns {string} API base URL
 *
 * Note: React environment variables are embedded at BUILD time.
 * In Vercel, NODE_ENV is set to 'production' during build.
 * If REACT_APP_API_URL is not set, default to '/api' for production builds.
 */
export const getApiBaseUrl = () => {
  // If explicitly set, use that value
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  // Check if we're in a production build
  // Vercel sets NODE_ENV=production during build
  const isProduction = process.env.NODE_ENV === 'production';
  const isDevelopment = process.env.NODE_ENV === 'development';
  // Runtime check: if we're on a production domain (not localhost), use relative path
  // This handles cases where NODE_ENV might not be set correctly during build
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const isProductionDomain = hostname !== 'localhost' &&
                              hostname !== '127.0.0.1' &&
                              !hostname.startsWith('192.168.') &&
                              !hostname.startsWith('10.') &&
                              !hostname.endsWith('.local');
// If on production domain, always use relative path
    if (isProductionDomain) {
      return '/api';
    }
  }
// Build-time check: production build should use relative path
  if (isProduction || !isDevelopment) {
    return '/api';
  }
// Development: use localhost
  return 'http://localhost:3002/api';
};

export default getApiBaseUrl;

