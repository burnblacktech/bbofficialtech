// =====================================================
// PAN VERIFICATION SERVICE (MOCK + REAL SWITCHING)
// =====================================================

const axios = require('axios');
const enterpriseLogger = require('../utils/logger');
const { AppError } = require('../middleware/errorHandler');

class PANVerificationService {
  constructor() {
    this.surepassApiBaseUrl = process.env.SUREPASS_API_BASE_URL || 'https://api.surepass.io/api/v1';
    this.surepassApiKey = process.env.SUREPASS_API_KEY;
    this.isLiveMode = process.env.FEATURE_PAN_VERIFICATION_LIVE === 'true';
    
    this.axiosInstance = axios.create({
      baseURL: this.surepassApiBaseUrl,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.surepassApiKey}`,
      },
      timeout: 30000,
    });

    enterpriseLogger.info('PANVerificationService initialized', { 
      mode: this.isLiveMode ? 'LIVE' : 'MOCK',
      baseUrl: this.surepassApiBaseUrl 
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
        return this.mockPANVerification(pan, userId);
      }

      enterpriseLogger.info('Verifying PAN via SurePass', { pan, userId });
      
      const response = await this.axiosInstance.post('/pan/verify', {
        pan: pan.toUpperCase()
      });
      
      const verificationResult = {
        pan: pan.toUpperCase(),
        isValid: response.data.status === 'success',
        name: response.data.data?.name || null,
        status: response.data.data?.status || 'Active',
        lastUpdated: response.data.data?.last_updated || new Date().toISOString(),
        source: 'SUREPASS_LIVE',
        verifiedAt: new Date().toISOString(),
        userId: userId
      };

      enterpriseLogger.info('PAN verification successful', { 
        pan, 
        isValid: verificationResult.isValid,
        name: verificationResult.name,
        userId 
      });

      return verificationResult;

    } catch (error) {
      enterpriseLogger.error('PAN verification failed', { 
        pan, 
        error: error.message,
        userId 
      });
      
      // Fallback to mock if live API fails
      if (this.isLiveMode) {
        enterpriseLogger.warn('Falling back to mock PAN verification', { pan, userId });
        return this.mockPANVerification(pan, userId);
      }
      
      throw new AppError(`PAN verification failed: ${error.message}`, 500);
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
            userId: userId
          });
        }
      }

      enterpriseLogger.info('Bulk PAN verification completed', {
        totalPans: pans.length,
        successful: results.filter(r => r.isValid).length,
        failed: results.filter(r => !r.isValid).length,
        userId
      });

      return results;

    } catch (error) {
      enterpriseLogger.error('Bulk PAN verification failed', {
        error: error.message,
        pansCount: pans.length,
        userId
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
          userId: userId
        }
      ];

      enterpriseLogger.info('Retrieved PAN verification history', {
        userId,
        count: mockHistory.length,
        filters
      });

      return mockHistory;

    } catch (error) {
      enterpriseLogger.error('Failed to retrieve PAN verification history', {
        error: error.message,
        userId,
        filters
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
      lastUpdated: new Date().toISOString(),
      source: 'SUREPASS_MOCK',
      verifiedAt: new Date().toISOString(),
      userId: userId
    };
    
    enterpriseLogger.info('Mock PAN verification', { 
      pan, 
      result: mockResponse,
      userId 
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
      'Kavita Agarwal'
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
        mode: this.isLiveMode ? 'LIVE' : 'MOCK'
      };

      // In production, this would query database
      enterpriseLogger.info('Retrieved PAN verification statistics', {
        stats,
        filters
      });

      return stats;

    } catch (error) {
      enterpriseLogger.error('Failed to retrieve PAN verification statistics', {
        error: error.message,
        filters
      });
      throw error;
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
        try {
          await this.axiosInstance.get('/health');
          return {
            status: 'available',
            mode: 'LIVE',
            message: 'SurePass API is available'
          };
        } catch (error) {
          return {
            status: 'degraded',
            mode: 'FALLBACK',
            message: 'SurePass API unavailable, using mock responses'
          };
        }
      }

      return {
        status: 'available',
        mode: 'MOCK',
        message: 'Mock PAN verification is available'
      };

    } catch (error) {
      enterpriseLogger.error('Failed to check PAN verification service status', {
        error: error.message
      });
      return {
        status: 'unavailable',
        mode: 'ERROR',
        message: 'PAN verification service is unavailable'
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
      mode: isLive ? 'LIVE' : 'MOCK'
    });
  }
}

module.exports = new PANVerificationService();
