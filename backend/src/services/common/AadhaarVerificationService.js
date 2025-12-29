// =====================================================
// AADHAAR VERIFICATION SERVICE (MOCK + REAL SWITCHING)
// Uses SurePass API for Aadhaar verification
// =====================================================

const axios = require('axios');
const enterpriseLogger = require('../../utils/logger');
const { AppError } = require('../../middleware/errorHandler');

class AadhaarVerificationService {
  constructor() {
    this.surepassApiBaseUrl = process.env.SUREPASS_API_BASE_URL || 'https://kyc-api.surepass.io/api/v1';
    this.surepassApiKey = process.env.SUREPASS_API_KEY;
    this.isLiveMode = process.env.FEATURE_AADHAAR_VERIFICATION_LIVE === 'true';

    // Validate API key if live mode is enabled
    if (this.isLiveMode && !this.surepassApiKey) {
      enterpriseLogger.error('SurePass API key is missing but live mode is enabled', {
        isLiveMode: this.isLiveMode,
        hasApiKey: !!this.surepassApiKey,
      });
      throw new Error('SUREPASS_API_KEY is required when FEATURE_AADHAAR_VERIFICATION_LIVE=true');
    }

    this.axiosInstance = axios.create({
      baseURL: this.surepassApiBaseUrl,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': this.surepassApiKey ? `Bearer ${this.surepassApiKey}` : '',
      },
      timeout: 30000,
    });

    enterpriseLogger.info('AadhaarVerificationService initialized', {
      mode: this.isLiveMode ? 'LIVE' : 'MOCK',
      baseUrl: this.surepassApiBaseUrl,
      hasApiKey: !!this.surepassApiKey,
    });
  }

  /**
   * Validate Aadhaar number format
   * @param {string} aadhaar - Aadhaar number
   * @returns {boolean} - True if valid format
   */
  validateAadhaarFormat(aadhaar) {
    if (!aadhaar) return false;
    // Aadhaar should be 12 digits
    const aadhaarRegex = /^\d{12}$/;
    return aadhaarRegex.test(aadhaar.replace(/\s/g, ''));
  }

  /**
   * Verify Aadhaar using SurePass API (with mock fallback)
   * @param {string} aadhaarNumber - Aadhaar number to verify
   * @param {string} userId - User ID for audit logging
   * @returns {Promise<object>} - Verification result
   */
  async verifyAadhaar(aadhaarNumber, userId = null) {
    try {
      // Validate Aadhaar format first
      if (!this.validateAadhaarFormat(aadhaarNumber)) {
        throw new AppError('Invalid Aadhaar format. Aadhaar must be 12 digits', 400);
      }

      // Clean Aadhaar number (remove spaces)
      const cleanAadhaar = aadhaarNumber.replace(/\s/g, '');

      if (!this.isLiveMode) {
        enterpriseLogger.info('Using mock Aadhaar verification (live mode disabled)', { 
          aadhaar: this.maskAadhaar(cleanAadhaar), 
          userId 
        });
        return this.mockAadhaarVerification(cleanAadhaar, userId);
      }

      // Validate API key is present
      if (!this.surepassApiKey) {
        enterpriseLogger.error('SurePass API key missing in live mode', { 
          aadhaar: this.maskAadhaar(cleanAadhaar), 
          userId 
        });
        throw new AppError('Aadhaar verification service is not properly configured', 500);
      }

      enterpriseLogger.info('Verifying Aadhaar via SurePass', { 
        aadhaar: this.maskAadhaar(cleanAadhaar), 
        userId 
      });

      // SurePass Aadhaar validation endpoint
      const endpoint = '/aadhaar/aadhaar-validation';
      
      // Request body format based on SurePass API
      const response = await this.axiosInstance.post(endpoint, {
        id_number: cleanAadhaar,
      });

      enterpriseLogger.info('SurePass Aadhaar API response', {
        statusCode: response.status,
        success: response.data?.success,
        hasData: !!response.data?.data,
      });

      if (response.data?.success && response.data?.data) {
        const verificationData = response.data.data;

        return {
          success: true,
          verified: true,
          aadhaarNumber: cleanAadhaar,
          name: verificationData.full_name || verificationData.name || null,
          dateOfBirth: verificationData.dob || verificationData.date_of_birth || null,
          gender: verificationData.gender || null,
          address: verificationData.address || null,
          pincode: verificationData.pincode || verificationData.pin_code || null,
          state: verificationData.state || null,
          district: verificationData.district || null,
          verificationTimestamp: new Date().toISOString(),
          source: 'SUREPASS',
          rawData: verificationData,
        };
      } else {
        throw new AppError('Aadhaar verification failed: Invalid response from verification service', 400);
      }

    } catch (error) {
      enterpriseLogger.error('Aadhaar verification error', {
        error: error.message,
        aadhaar: error.config?.data ? this.maskAadhaar(JSON.parse(error.config.data).id_number) : 'N/A',
        userId,
        stack: error.stack,
      });

      if (error instanceof AppError) {
        throw error;
      }

      if (error.response?.data) {
        const errorMessage = error.response.data.message || error.response.data.error || 'Aadhaar verification failed';
        throw new AppError(`Aadhaar verification failed: ${errorMessage}`, error.response.status || 400);
      }

      throw new AppError(`Aadhaar verification failed: ${error.message}`, 500);
    }
  }

  /**
   * Mock Aadhaar verification for development/testing
   * @param {string} aadhaarNumber - Aadhaar number
   * @param {string} userId - User ID
   * @returns {Promise<object>} - Mock verification result
   */
  async mockAadhaarVerification(aadhaarNumber, userId = null) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Mock verification - accept any valid format Aadhaar
    return {
      success: true,
      verified: true,
      aadhaarNumber: aadhaarNumber,
      name: 'Mock User Name',
      dateOfBirth: null,
      gender: null,
      address: null,
      pincode: null,
      state: null,
      district: null,
      verificationTimestamp: new Date().toISOString(),
      source: 'MOCK',
      rawData: {
        aadhaar_number: aadhaarNumber,
        status: 'active',
      },
    };
  }

  /**
   * Mask Aadhaar number for logging (show only first 4 and last 4 digits)
   * @param {string} aadhaar - Aadhaar number
   * @returns {string} - Masked Aadhaar
   */
  maskAadhaar(aadhaar) {
    if (!aadhaar || aadhaar.length < 8) return '****';
    return `${aadhaar.substring(0, 4)}****${aadhaar.substring(aadhaar.length - 4)}`;
  }

  /**
   * Link verified Aadhaar to user profile
   * @param {string} userId - User ID
   * @param {string} aadhaarNumber - Verified Aadhaar number
   * @param {object} verificationData - Verification result data
   * @returns {Promise<object>} - Link result
   */
  async linkAadhaarToUser(userId, aadhaarNumber, verificationData) {
    try {
      // This method will be called by the controller after verification
      // The actual linking is done in the controller/database layer
      enterpriseLogger.info('Aadhaar linked to user', {
        userId,
        aadhaar: this.maskAadhaar(aadhaarNumber),
      });

      return {
        success: true,
        linked: true,
        aadhaarNumber: aadhaarNumber,
        verificationData,
      };
    } catch (error) {
      enterpriseLogger.error('Aadhaar linking error', {
        userId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Unlink Aadhaar from user profile
   * @param {string} userId - User ID
   * @returns {Promise<object>} - Unlink result
   */
  async unlinkAadhaar(userId) {
    try {
      enterpriseLogger.info('Aadhaar unlinked from user', {
        userId,
      });

      return {
        success: true,
        unlinked: true,
      };
    } catch (error) {
      enterpriseLogger.error('Aadhaar unlinking error', {
        userId,
        error: error.message,
      });
      throw error;
    }
  }
}

module.exports = new AadhaarVerificationService();

