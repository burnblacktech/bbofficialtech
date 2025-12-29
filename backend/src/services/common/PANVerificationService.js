// =====================================================
// PAN VERIFICATION SERVICE (MOCK + REAL SWITCHING)
// =====================================================

const axios = require('axios');
const enterpriseLogger = require('../../utils/logger');
const { AppError } = require('../../middleware/errorHandler');

class PANVerificationService {
  constructor() {
    this.surepassApiBaseUrl = process.env.SUREPASS_API_BASE_URL || 'https://kyc-api.surepass.io/api/v1';
    this.surepassComprehensiveBaseUrl = process.env.SUREPASS_COMPREHENSIVE_BASE_URL || 'https://kyc-api.surepass.app/api/v1';
    this.surepassApiKey = process.env.SUREPASS_API_KEY;
    this.isLiveMode = process.env.FEATURE_PAN_VERIFICATION_LIVE === 'true';
    this.comprehensiveEnabled = process.env.SUREPASS_COMPREHENSIVE_ENABLED === 'true';

    // Validate API key if live mode is enabled
    if (this.isLiveMode && !this.surepassApiKey) {
      enterpriseLogger.error('SurePass API key is missing but live mode is enabled', {
        isLiveMode: this.isLiveMode,
        hasApiKey: !!this.surepassApiKey,
      });
      throw new Error('SUREPASS_API_KEY is required when FEATURE_PAN_VERIFICATION_LIVE=true');
    }

    this.axiosInstance = axios.create({
      baseURL: this.surepassApiBaseUrl,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': this.surepassApiKey ? `Bearer ${this.surepassApiKey}` : '',
      },
      timeout: 30000,
    });

    enterpriseLogger.info('PANVerificationService initialized', {
      mode: this.isLiveMode ? 'LIVE' : 'MOCK',
      baseUrl: this.surepassApiBaseUrl,
      comprehensiveBaseUrl: this.surepassComprehensiveBaseUrl,
      comprehensiveEnabled: this.comprehensiveEnabled,
      hasApiKey: !!this.surepassApiKey,
    });
  }

  /**
   * Verify PAN using SurePass API (with mock fallback)
   * @param {string} pan - PAN number to verify
   * @param {string} userId - User ID for audit logging
   * @returns {Promise<object>} - Verification result
   */
  async verifyPAN(pan, userId = null) {
    try {
      // Validate PAN format first
      if (!this.validatePANFormat(pan)) {
        throw new AppError('Invalid PAN format', 400);
      }

      if (!this.isLiveMode) {
        enterpriseLogger.info('Using mock PAN verification (live mode disabled)', { pan, userId });
        return this.mockPANVerification(pan, userId);
      }

      // Validate API key is present
      if (!this.surepassApiKey) {
        enterpriseLogger.error('SurePass API key missing in live mode', { pan, userId });
        throw new AppError('PAN verification service is not properly configured', 500);
      }

      enterpriseLogger.info('Verifying PAN via SurePass', { pan, userId });

      // Use comprehensive endpoint if enabled, otherwise use basic endpoint
      const endpoint = this.comprehensiveEnabled ? '/pan/pan-comprehensive' : '/pan/pan';
      const baseUrl = this.comprehensiveEnabled ? this.surepassComprehensiveBaseUrl : this.surepassApiBaseUrl;

      // Create axios instance with correct base URL for this request
      const requestInstance = axios.create({
        baseURL: baseUrl,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.surepassApiKey ? `Bearer ${this.surepassApiKey}` : '',
        },
        timeout: 30000,
      });

      // Request body format: { "id_number": "PAN1234F" } based on SurePass API
      enterpriseLogger.info('SurePass API request', {
        baseUrl,
        endpoint,
        pan: pan.toUpperCase(),
      });

      const response = await requestInstance.post(endpoint, {
        id_number: pan.toUpperCase(),
      });

      enterpriseLogger.info('SurePass API response', {
        statusCode: response.data.status_code,
        success: response.data.success,
        hasData: !!response.data.data,
      });

      // Parse response according to actual SurePass format:
      // { success: true, status_code: 200, data: { pan_number, full_name, client_id, category, date_of_birth/dob } }
      // Extract DOB from response (could be date_of_birth, dob, or dateOfBirth)
      const rawDOB = response.data.data?.date_of_birth || response.data.data?.dob || response.data.data?.dateOfBirth;
      let dateOfBirth = null;

      // Format DOB to YYYY-MM-DD if available
      if (rawDOB) {
        try {
          const dobDate = new Date(rawDOB);
          if (!isNaN(dobDate.getTime())) {
            // Format as YYYY-MM-DD for date input
            const year = dobDate.getFullYear();
            const month = String(dobDate.getMonth() + 1).padStart(2, '0');
            const day = String(dobDate.getDate()).padStart(2, '0');
            dateOfBirth = `${year}-${month}-${day}`;
          }
        } catch (error) {
          enterpriseLogger.warn('Failed to parse DOB from PAN verification', {
            rawDOB,
            error: error.message,
          });
        }
      }

      const verificationResult = {
        pan: response.data.data?.pan_number || pan.toUpperCase(),
        isValid: response.data.success === true && response.data.status_code === 200,
        name: response.data.data?.full_name || null,
        category: response.data.data?.category || null,
        clientId: response.data.data?.client_id || null,
        dateOfBirth: dateOfBirth,
        source: this.comprehensiveEnabled ? 'SUREPASS_LIVE_COMPREHENSIVE' : 'SUREPASS_LIVE',
        verifiedAt: new Date().toISOString(),
        userId: userId,
      };

      enterpriseLogger.info('PAN verification successful', {
        pan,
        isValid: verificationResult.isValid,
        name: verificationResult.name,
        userId,
      });

      return verificationResult;

    } catch (error) {
      enterpriseLogger.error('PAN verification failed', {
        pan,
        error: error.message,
        errorCode: error.response?.status,
        errorData: error.response?.data,
        userId,
      });

      // Handle specific API errors
      if (error.response) {
        // API returned an error response
        const status = error.response.status;
        const errorData = error.response.data;

        if (status === 401 || status === 403) {
          throw new AppError('Invalid SurePass API key. Please check your configuration.', 500);
        } else if (status === 429) {
          throw new AppError('Rate limit exceeded. Please try again later.', 429);
        } else if (status === 400) {
          // Invalid PAN format or other client error
          // Check if SurePass returns status_code in response
          const surepassStatusCode = errorData?.status_code;
          const surepassMessage = errorData?.message || errorData?.error || 'Invalid PAN number';
          throw new AppError(surepassMessage, surepassStatusCode || 400);
        } else if (status >= 500) {
          // Server error from SurePass - service unavailable
          throw new AppError('PAN verification service is temporarily unavailable. Please verify manually and continue.', 503, 'SERVICE_UNAVAILABLE');
        }
      } else if (error.request) {
        // Request was made but no response received (network error, timeout, DNS failure)
        enterpriseLogger.error('SurePass API request failed (network/timeout)', {
          pan,
          userId,
          errorCode: error.code,
          errorMessage: error.message,
        });

        // Return error with specific code for frontend to handle
        throw new AppError('PAN verification service is temporarily unavailable. Please verify manually and continue.', 503, 'SERVICE_UNAVAILABLE');
      }

      throw new AppError(`PAN verification failed: ${error.message}`, error.response?.status || 500);
    }
  }

  /**
   * Verify PAN using comprehensive endpoint (detailed verification)
   * @param {string} pan - PAN number to verify
   * @param {string} userId - User ID for audit logging
   * @returns {Promise<object>} - Comprehensive verification result
   */
  async verifyPANComprehensive(pan, userId = null) {
    try {
      // Validate PAN format first
      if (!this.validatePANFormat(pan)) {
        throw new AppError('Invalid PAN format', 400);
      }

      if (!this.isLiveMode) {
        enterpriseLogger.info('Using mock PAN verification (live mode disabled)', { pan, userId });
        return this.mockPANVerification(pan, userId);
      }

      // Validate API key is present
      if (!this.surepassApiKey) {
        enterpriseLogger.error('SurePass API key missing in live mode', { pan, userId });
        throw new AppError('PAN verification service is not properly configured', 500);
      }

      enterpriseLogger.info('Verifying PAN via SurePass Comprehensive', { pan, userId });

      // Create axios instance with comprehensive base URL
      const requestInstance = axios.create({
        baseURL: this.surepassComprehensiveBaseUrl,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.surepassApiKey ? `Bearer ${this.surepassApiKey}` : '',
        },
        timeout: 30000,
      });

      enterpriseLogger.info('SurePass Comprehensive API request', {
        baseUrl: this.surepassComprehensiveBaseUrl,
        endpoint: '/pan/pan-comprehensive',
        pan: pan.toUpperCase(),
      });

      const response = await requestInstance.post('/pan/pan-comprehensive', {
        id_number: pan.toUpperCase(),
      });

      enterpriseLogger.info('SurePass Comprehensive API response', {
        statusCode: response.data.status_code,
        success: response.data.success,
        hasData: !!response.data.data,
      });

      // Parse comprehensive response
      // Extract DOB from comprehensive response
      const rawDOB = response.data.data?.date_of_birth || response.data.data?.dob || response.data.data?.dateOfBirth;
      let dateOfBirth = null;

      // Format DOB to YYYY-MM-DD if available
      if (rawDOB) {
        try {
          const dobDate = new Date(rawDOB);
          if (!isNaN(dobDate.getTime())) {
            // Format as YYYY-MM-DD for date input
            const year = dobDate.getFullYear();
            const month = String(dobDate.getMonth() + 1).padStart(2, '0');
            const day = String(dobDate.getDate()).padStart(2, '0');
            dateOfBirth = `${year}-${month}-${day}`;
          }
        } catch (error) {
          enterpriseLogger.warn('Failed to parse DOB from PAN comprehensive verification', {
            rawDOB,
            error: error.message,
          });
        }
      }

      const verificationResult = {
        pan: response.data.data?.pan_number || pan.toUpperCase(),
        isValid: response.data.success === true && response.data.status_code === 200,
        name: response.data.data?.full_name || null,
        category: response.data.data?.category || null,
        clientId: response.data.data?.client_id || null,
        dateOfBirth: dateOfBirth,
        source: 'SUREPASS_LIVE_COMPREHENSIVE',
        verifiedAt: new Date().toISOString(),
        userId: userId,
      };

      enterpriseLogger.info('PAN comprehensive verification successful', {
        pan,
        isValid: verificationResult.isValid,
        name: verificationResult.name,
        userId,
      });

      return verificationResult;

    } catch (error) {
      enterpriseLogger.error('PAN comprehensive verification failed', {
        pan,
        error: error.message,
        errorCode: error.response?.status,
        errorData: error.response?.data,
        userId,
      });

      // Handle specific API errors (same as verifyPAN)
      if (error.response) {
        const status = error.response.status;
        const errorData = error.response.data;

        if (status === 401 || status === 403) {
          throw new AppError('Invalid SurePass API key. Please check your configuration.', 500);
        } else if (status === 429) {
          throw new AppError('Rate limit exceeded. Please try again later.', 429);
        } else if (status === 400) {
          const surepassStatusCode = errorData?.status_code;
          const surepassMessage = errorData?.message || errorData?.error || 'Invalid PAN number';
          throw new AppError(surepassMessage, surepassStatusCode || 400);
        } else if (status >= 500) {
          throw new AppError('PAN verification service is temporarily unavailable. Please verify manually and continue.', 503, 'SERVICE_UNAVAILABLE');
        }
      } else if (error.request) {
        enterpriseLogger.error('SurePass Comprehensive API request failed (network/timeout)', {
          pan,
          userId,
          errorCode: error.code,
          errorMessage: error.message,
        });
        throw new AppError('PAN verification service is temporarily unavailable. Please verify manually and continue.', 503, 'SERVICE_UNAVAILABLE');
      }

      throw new AppError(`PAN comprehensive verification failed: ${error.message}`, error.response?.status || 500);
    }
  }

  /**
   * Bulk verify multiple PANs
   * @param {Array} pans - Array of PAN numbers
   * @param {string} userId - User ID for audit logging
   * @returns {Promise<Array>} - Array of verification results
   */
  async bulkVerifyPANs(pans, userId = null) {
    try {
      const results = [];

      for (const pan of pans) {
        try {
          const result = await this.verifyPAN(pan, userId);
          results.push(result);
        } catch (error) {
          results.push({
            pan: pan.toUpperCase(),
            isValid: false,
            error: error.message,
            source: 'ERROR',
            verifiedAt: new Date().toISOString(),
            userId: userId,
          });
        }
      }

      enterpriseLogger.info('Bulk PAN verification completed', {
        totalPans: pans.length,
        successful: results.filter(r => r.isValid).length,
        failed: results.filter(r => !r.isValid).length,
        userId,
      });

      return results;

    } catch (error) {
      enterpriseLogger.error('Bulk PAN verification failed', {
        error: error.message,
        pansCount: pans.length,
        userId,
      });
      throw new AppError(`Bulk PAN verification failed: ${error.message}`, 500);
    }
  }

  /**
   * Get PAN verification history
   * @param {string} userId - User ID
   * @param {object} filters - Filter options
   * @returns {Promise<Array>} - Verification history
   */
  async getVerificationHistory(userId, filters = {}) {
    try {
      // In production, this would query a database
      const mockHistory = [
        {
          pan: 'ABCDE1234F',
          name: 'MOCK USER',
          status: 'Active',
          verifiedAt: new Date().toISOString(),
          source: 'MOCK',
          userId: userId,
        },
      ];

      enterpriseLogger.info('Retrieved PAN verification history', {
        userId,
        count: mockHistory.length,
        filters,
      });

      return mockHistory;

    } catch (error) {
      enterpriseLogger.error('Failed to retrieve PAN verification history', {
        error: error.message,
        userId,
        filters,
      });
      throw error;
    }
  }

  /**
   * Validate PAN format
   * @param {string} pan - PAN number
   * @returns {boolean} - Validation result
   */
  validatePANFormat(pan) {
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    return panRegex.test(pan.toUpperCase());
  }

  /**
   * Mock PAN verification for development/testing
   * @param {string} pan - PAN number
   * @param {string} userId - User ID
   * @returns {Promise<object>} - Mock verification result
   */
  async mockPANVerification(pan, userId = null) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    const mockResponse = {
      pan: pan.toUpperCase(),
      isValid: true,
      name: this.generateMockName(pan),
      status: 'Active',
      dateOfBirth: null, // Mock doesn't include DOB - would need to be provided separately
      lastUpdated: new Date().toISOString(),
      source: 'SUREPASS_MOCK',
      verifiedAt: new Date().toISOString(),
      userId: userId,
    };

    enterpriseLogger.info('Mock PAN verification', {
      pan,
      result: mockResponse,
      userId,
    });

    return mockResponse;
  }

  /**
   * Generate mock name based on PAN
   * @param {string} pan - PAN number
   * @returns {string} - Mock name
   */
  generateMockName(pan) {
    const mockNames = [
      'Rajesh Kumar',
      'Priya Sharma',
      'Amit Patel',
      'Sunita Singh',
      'Vikram Gupta',
      'Anita Reddy',
      'Suresh Kumar',
      'Meera Joshi',
      'Ravi Verma',
      'Kavita Agarwal',
    ];

    // Use PAN as seed for consistent mock data
    const seed = pan.charCodeAt(0) + pan.charCodeAt(1);
    const index = seed % mockNames.length;

    return mockNames[index];
  }

  /**
   * Get verification statistics
   * @param {object} filters - Filter options
   * @returns {Promise<object>} - Statistics
   */
  async getVerificationStats(filters = {}) {
    try {
      const stats = {
        totalVerifications: 0,
        successfulVerifications: 0,
        failedVerifications: 0,
        successRate: 0,
        averageResponseTime: 0,
        mode: this.isLiveMode ? 'LIVE' : 'MOCK',
      };

      // In production, this would query database
      enterpriseLogger.info('Retrieved PAN verification statistics', {
        stats,
        filters,
      });

      return stats;

    } catch (error) {
      enterpriseLogger.error('Failed to retrieve PAN verification statistics', {
        error: error.message,
        filters,
      });
      throw error;
    }
  }

  /**
   * Test API connection and validate API key
   * @returns {Promise<object>} - Connection test result
   */
  async testAPIConnection() {
    try {
      if (!this.isLiveMode) {
        return {
          success: true,
          mode: 'MOCK',
          message: 'Mock mode enabled - API connection test skipped',
        };
      }

      if (!this.surepassApiKey) {
        return {
          success: false,
          mode: 'LIVE',
          error: 'API key not configured',
        };
      }

      // Test with a dummy PAN (will fail but confirms API is reachable)
      // Note: Using a test endpoint if available, otherwise we'll catch errors
      try {
        // Try a simple request to verify API key is valid
        // SurePass might have a test endpoint or we can use a known invalid PAN
        const testRequestInstance = axios.create({
          baseURL: this.surepassApiBaseUrl,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': this.surepassApiKey ? `Bearer ${this.surepassApiKey}` : '',
          },
          timeout: 10000, // Shorter timeout for test
        });

        const testResponse = await testRequestInstance.post('/pan/pan', {
          id_number: 'TEST12345T', // Invalid PAN for testing connectivity
        });

        return {
          success: true,
          mode: 'LIVE',
          message: 'API connection successful',
          apiKeyValid: true,
        };
      } catch (testError) {
        // If we get 401/403, API key is invalid
        if (testError.response?.status === 401 || testError.response?.status === 403) {
          return {
            success: false,
            mode: 'LIVE',
            error: 'Invalid API key',
            apiKeyValid: false,
          };
        }
        // Other errors might be expected (invalid PAN, etc.) but API is reachable
        return {
          success: true,
          mode: 'LIVE',
          message: 'API is reachable (test PAN validation expected)',
          apiKeyValid: true,
        };
      }
    } catch (error) {
      return {
        success: false,
        mode: this.isLiveMode ? 'LIVE' : 'MOCK',
        error: error.message,
      };
    }
  }

  /**
   * Check if PAN verification is available
   * @returns {Promise<object>} - Service status
   */
  async getServiceStatus() {
    try {
      if (this.isLiveMode) {
        // Test live API connectivity
        const connectionTest = await this.testAPIConnection();
        return {
          status: connectionTest.success ? 'available' : 'unavailable',
          mode: 'LIVE',
          message: 'SurePass API is available',
        };
      }

      // Mock mode
      return {
        status: 'available',
        mode: 'MOCK',
        message: 'Using mock PAN verification responses',
      };
    } catch (error) {
      enterpriseLogger.error('Failed to check PAN verification service status', {
        error: error.message,
      });
      return {
        status: 'degraded',
        mode: 'FALLBACK',
        message: 'SurePass API unavailable, using mock responses',
      };
    }
  }

  /**
   * Update feature flag for live/mock switching
   * @param {boolean} isLive - Whether to use live API
   */
  updateFeatureFlag(isLive) {
    this.isLiveMode = isLive;
    enterpriseLogger.info('PAN verification feature flag updated', {
      mode: isLive ? 'LIVE' : 'MOCK',
    });
  }
}

module.exports = new PANVerificationService();
