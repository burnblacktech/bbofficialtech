// =====================================================
// ERI (E-Return Intermediary) SERVICE
// Integration with Income Tax Department's E-Filing API
// =====================================================

const axios = require('axios');
const crypto = require('crypto');
const enterpriseLogger = require('../utils/logger');

// ERI API Endpoints (Sandbox/Production)
const ERI_ENDPOINTS = {
  sandbox: {
    baseUrl: 'https://eportal.incometax.gov.in/iec/api/v1',
    authUrl: 'https://eportal.incometax.gov.in/iec/api/auth/token',
  },
  production: {
    baseUrl: 'https://eportal.incometax.gov.in/iec/api/v1',
    authUrl: 'https://eportal.incometax.gov.in/iec/api/auth/token',
  },
};

class ERIService {
  constructor() {
    this.environment = process.env.ERI_ENVIRONMENT || 'sandbox';
    this.endpoints = ERI_ENDPOINTS[this.environment];
    this.clientId = process.env.ERI_CLIENT_ID;
    this.clientSecret = process.env.ERI_CLIENT_SECRET;
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  /**
   * Get authentication token from ERI portal
   */
  async authenticate() {
    try {
      if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
        return this.accessToken;
      }

      enterpriseLogger.info('Authenticating with ERI portal', {
        environment: this.environment,
      });

      const response = await axios.post(this.endpoints.authUrl, {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: 'client_credentials',
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      this.accessToken = response.data.access_token;
      // Token typically expires in 1 hour
      this.tokenExpiry = new Date(Date.now() + (response.data.expires_in || 3600) * 1000);

      enterpriseLogger.info('ERI authentication successful', {
        tokenExpiry: this.tokenExpiry,
      });

      return this.accessToken;

    } catch (error) {
      enterpriseLogger.error('ERI authentication failed', {
        error: error.message,
        response: error.response?.data,
      });
      throw new Error('ERI authentication failed: ' + error.message);
    }
  }

  /**
   * Get request headers with authentication
   */
  async getAuthHeaders() {
    const token = await this.authenticate();
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-Request-Id': crypto.randomUUID(),
    };
  }

  /**
   * Validate PAN and get taxpayer details
   */
  async validatePAN(pan) {
    try {
      const headers = await this.getAuthHeaders();

      const response = await axios.get(
        `${this.endpoints.baseUrl}/pan/verify/${pan}`,
        { headers }
      );

      enterpriseLogger.info('PAN validation successful', { pan: pan.substring(0, 5) + '****' });

      return {
        success: true,
        data: response.data,
      };

    } catch (error) {
      enterpriseLogger.error('PAN validation failed', {
        pan: pan.substring(0, 5) + '****',
        error: error.message,
      });
      throw new Error('PAN validation failed: ' + error.message);
    }
  }

  /**
   * Get pre-filled ITR data for a PAN
   */
  async getPrefilledData(pan, assessmentYear) {
    try {
      const headers = await this.getAuthHeaders();

      const response = await axios.get(
        `${this.endpoints.baseUrl}/itr/prefill/${pan}/${assessmentYear}`,
        { headers }
      );

      enterpriseLogger.info('Prefilled data fetched', {
        pan: pan.substring(0, 5) + '****',
        assessmentYear,
      });

      return {
        success: true,
        data: response.data,
      };

    } catch (error) {
      enterpriseLogger.error('Prefilled data fetch failed', {
        error: error.message,
      });
      throw new Error('Failed to fetch prefilled data: ' + error.message);
    }
  }

  /**
   * Submit ITR to Income Tax portal
   */
  async submitITR(itrData, itrType, assessmentYear) {
    try {
      const headers = await this.getAuthHeaders();

      // Validate JSON structure before submission
      const validationResult = this.validateITRJson(itrData, itrType);
      if (!validationResult.isValid) {
        throw new Error('ITR validation failed: ' + validationResult.errors.join(', '));
      }

      // Generate digital signature if available
      const signedData = await this.signITRData(itrData);

      const response = await axios.post(
        `${this.endpoints.baseUrl}/itr/submit`,
        {
          itrType,
          assessmentYear,
          itrData: signedData,
          timestamp: new Date().toISOString(),
        },
        { headers }
      );

      enterpriseLogger.info('ITR submitted successfully', {
        itrType,
        assessmentYear,
        acknowledgmentNumber: response.data.acknowledgmentNumber,
      });

      return {
        success: true,
        acknowledgmentNumber: response.data.acknowledgmentNumber,
        filingDate: response.data.filingDate,
        status: response.data.status,
        data: response.data,
      };

    } catch (error) {
      enterpriseLogger.error('ITR submission failed', {
        itrType,
        assessmentYear,
        error: error.message,
      });
      throw new Error('ITR submission failed: ' + error.message);
    }
  }

  /**
   * Get filing status
   */
  async getFilingStatus(acknowledgmentNumber) {
    try {
      const headers = await this.getAuthHeaders();

      const response = await axios.get(
        `${this.endpoints.baseUrl}/itr/status/${acknowledgmentNumber}`,
        { headers }
      );

      return {
        success: true,
        status: response.data.status,
        data: response.data,
      };

    } catch (error) {
      enterpriseLogger.error('Filing status check failed', {
        acknowledgmentNumber,
        error: error.message,
      });
      throw new Error('Failed to get filing status: ' + error.message);
    }
  }

  /**
   * Initiate e-verification
   */
  async initiateEVerification(acknowledgmentNumber, method) {
    try {
      const headers = await this.getAuthHeaders();

      const validMethods = ['AADHAAR_OTP', 'NET_BANKING', 'DEMAT', 'ATM'];
      if (!validMethods.includes(method)) {
        throw new Error('Invalid e-verification method');
      }

      const response = await axios.post(
        `${this.endpoints.baseUrl}/itr/everify/initiate`,
        {
          acknowledgmentNumber,
          verificationMethod: method,
        },
        { headers }
      );

      enterpriseLogger.info('E-verification initiated', {
        acknowledgmentNumber,
        method,
        transactionId: response.data.transactionId,
      });

      return {
        success: true,
        transactionId: response.data.transactionId,
        data: response.data,
      };

    } catch (error) {
      enterpriseLogger.error('E-verification initiation failed', {
        acknowledgmentNumber,
        method,
        error: error.message,
      });
      throw new Error('E-verification initiation failed: ' + error.message);
    }
  }

  /**
   * Complete e-verification with OTP
   */
  async completeEVerification(transactionId, otp) {
    try {
      const headers = await this.getAuthHeaders();

      const response = await axios.post(
        `${this.endpoints.baseUrl}/itr/everify/complete`,
        {
          transactionId,
          otp,
        },
        { headers }
      );

      enterpriseLogger.info('E-verification completed', {
        transactionId,
        status: response.data.status,
      });

      return {
        success: true,
        verified: response.data.verified,
        data: response.data,
      };

    } catch (error) {
      enterpriseLogger.error('E-verification completion failed', {
        transactionId,
        error: error.message,
      });
      throw new Error('E-verification failed: ' + error.message);
    }
  }

  /**
   * Download ITR-V acknowledgment
   */
  async downloadITRV(acknowledgmentNumber) {
    try {
      const headers = await this.getAuthHeaders();

      const response = await axios.get(
        `${this.endpoints.baseUrl}/itr/itrv/${acknowledgmentNumber}`,
        {
          headers,
          responseType: 'arraybuffer',
        }
      );

      return {
        success: true,
        pdf: response.data,
        filename: `ITR-V_${acknowledgmentNumber}.pdf`,
      };

    } catch (error) {
      enterpriseLogger.error('ITR-V download failed', {
        acknowledgmentNumber,
        error: error.message,
      });
      throw new Error('ITR-V download failed: ' + error.message);
    }
  }

  /**
   * Get Form 26AS data
   */
  async getForm26AS(pan, assessmentYear) {
    try {
      const headers = await this.getAuthHeaders();

      const response = await axios.get(
        `${this.endpoints.baseUrl}/tax-credit/26as/${pan}/${assessmentYear}`,
        { headers }
      );

      return {
        success: true,
        data: response.data,
      };

    } catch (error) {
      enterpriseLogger.error('Form 26AS fetch failed', {
        pan: pan.substring(0, 5) + '****',
        assessmentYear,
        error: error.message,
      });
      throw new Error('Form 26AS fetch failed: ' + error.message);
    }
  }

  /**
   * Get AIS (Annual Information Statement) data
   */
  async getAIS(pan, assessmentYear) {
    try {
      const headers = await this.getAuthHeaders();

      const response = await axios.get(
        `${this.endpoints.baseUrl}/ais/${pan}/${assessmentYear}`,
        { headers }
      );

      return {
        success: true,
        data: response.data,
      };

    } catch (error) {
      enterpriseLogger.error('AIS fetch failed', {
        pan: pan.substring(0, 5) + '****',
        assessmentYear,
        error: error.message,
      });
      throw new Error('AIS fetch failed: ' + error.message);
    }
  }

  /**
   * Validate ITR JSON structure
   */
  validateITRJson(itrData, itrType) {
    const errors = [];

    // Check for root element
    const rootKey = `Form_${itrType.replace('-', '')}`;
    if (!itrData[rootKey]) {
      errors.push(`Missing root element: ${rootKey}`);
    }

    // Check for required sections
    const form = itrData[rootKey] || {};
    
    if (!form.Verification) {
      errors.push('Missing Verification section');
    }

    // PAN check
    const personalInfo = form.PartA_GEN1?.PersonalInfo || form.PartA_GEN?.PersonalInfo;
    if (!personalInfo?.PAN) {
      errors.push('Missing PAN in PersonalInfo');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Sign ITR data (placeholder for DSC integration)
   */
  async signITRData(itrData) {
    // In production, this would integrate with Digital Signature Certificate
    // For now, return the data as-is
    return itrData;
  }

  /**
   * Check ERI service health
   */
  async healthCheck() {
    try {
      await this.authenticate();
      return {
        status: 'healthy',
        environment: this.environment,
        tokenValid: true,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        environment: this.environment,
        error: error.message,
      };
    }
  }
}

module.exports = new ERIService();
module.exports.ERIService = ERIService;

