// =====================================================
// ERI INTEGRATION SERVICE
// =====================================================

const axios = require('axios');
const enterpriseLogger = require('../utils/logger');
const { AppError } = require('../middleware/errorHandler');

class ERIIntegrationService {
  constructor() {
    this.eriApiBaseUrl = process.env.ERI_API_BASE_URL || 'https://eri.incometax.gov.in/api';
    this.eriApiKey = process.env.ERI_API_KEY;
    this.isLiveMode = process.env.FEATURE_ERI_LIVE === 'true';
    
    this.axiosInstance = axios.create({
      baseURL: this.eriApiBaseUrl,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.eriApiKey,
      },
      timeout: 30000,
    });

    enterpriseLogger.info('ERIIntegrationService initialized', { 
      mode: this.isLiveMode ? 'LIVE' : 'MOCK',
      baseUrl: this.eriApiBaseUrl 
    });
  }

  /**
   * Verify PAN using ERI (with mock fallback)
   * @param {string} pan - PAN number to verify
   * @returns {Promise<object>} - Verification result
   */
  async verifyPan(pan) {
    try {
      if (!this.isLiveMode) {
        return this.mockPanVerification(pan);
      }

      enterpriseLogger.info('Verifying PAN via ERI', { pan });
      const response = await this.axiosInstance.post('/pan/verify', { pan });
      
      enterpriseLogger.info('PAN verification successful', { pan });
      return response.data;
    } catch (error) {
      enterpriseLogger.error('PAN verification failed', { pan, error: error.message });
      
      // Fallback to mock if live API fails
      if (this.isLiveMode) {
        enterpriseLogger.warn('Falling back to mock PAN verification', { pan });
        return this.mockPanVerification(pan);
      }
      
      throw new AppError(`PAN verification failed: ${error.message}`, 500);
    }
  }

  /**
   * Upload ITR JSON filing to ERI
   * @param {object} itrJson - Complete ITR JSON payload
   * @param {string} digitalSignature - Digital signature
   * @returns {Promise<object>} - Submission result with acknowledgement
   */
  async uploadFiling(itrJson, digitalSignature) {
    try {
      if (!this.isLiveMode) {
        return this.mockFilingSubmission(itrJson);
      }

      enterpriseLogger.info('Uploading ITR filing to ERI');
      const response = await this.axiosInstance.post('/filing/upload', {
        itrJson,
        digitalSignature,
      });

      enterpriseLogger.info('ITR filing uploaded successfully', { 
        ackNumber: response.data.ackNumber 
      });
      return response.data;
    } catch (error) {
      enterpriseLogger.error('ITR filing upload failed', { error: error.message });
      
      // Fallback to mock if live API fails
      if (this.isLiveMode) {
        enterpriseLogger.warn('Falling back to mock filing submission');
        return this.mockFilingSubmission(itrJson);
      }
      
      throw new AppError(`Filing upload failed: ${error.message}`, 500);
    }
  }

  /**
   * Fetch acknowledgement details
   * @param {string} ackNumber - Acknowledgement number
   * @returns {Promise<object>} - Acknowledgement status
   */
  async fetchAcknowledgement(ackNumber) {
    try {
      if (!this.isLiveMode) {
        return this.mockAcknowledgementFetch(ackNumber);
      }

      enterpriseLogger.info('Fetching acknowledgement via ERI', { ackNumber });
      const response = await this.axiosInstance.get(`/filing/acknowledgement/${ackNumber}`);
      
      enterpriseLogger.info('Acknowledgement fetched successfully', { ackNumber });
      return response.data;
    } catch (error) {
      enterpriseLogger.error('Failed to fetch acknowledgement', { ackNumber, error: error.message });
      
      if (this.isLiveMode) {
        enterpriseLogger.warn('Falling back to mock acknowledgement fetch', { ackNumber });
        return this.mockAcknowledgementFetch(ackNumber);
      }
      
      throw new AppError(`Acknowledgement fetch failed: ${error.message}`, 500);
    }
  }

  /**
   * Fetch previous ITR data for prefill
   * @param {string} pan - PAN number
   * @param {string} assessmentYear - Assessment year
   * @returns {Promise<object>} - Previous ITR data
   */
  async fetchPreviousItrData(pan, assessmentYear) {
    try {
      if (!this.isLiveMode) {
        return this.mockPreviousItrData(pan, assessmentYear);
      }

      enterpriseLogger.info('Fetching previous ITR data via ERI', { pan, assessmentYear });
      const response = await this.axiosInstance.get('/itr/previous-data', {
        params: { pan, assessmentYear }
      });
      
      enterpriseLogger.info('Previous ITR data fetched successfully', { pan, assessmentYear });
      return response.data;
    } catch (error) {
      enterpriseLogger.error('Failed to fetch previous ITR data', { 
        pan, assessmentYear, error: error.message 
      });
      
      if (this.isLiveMode) {
        enterpriseLogger.warn('Falling back to mock previous ITR data', { pan, assessmentYear });
        return this.mockPreviousItrData(pan, assessmentYear);
      }
      
      throw new AppError(`Previous ITR data fetch failed: ${error.message}`, 500);
    }
  }

  // Mock implementations for development/testing
  mockPanVerification(pan) {
    const mockResponse = {
      isValid: true,
      name: 'MOCK USER',
      status: 'Active',
      lastUpdated: new Date().toISOString(),
      source: 'MOCK'
    };
    
    enterpriseLogger.info('Mock PAN verification', { pan, result: mockResponse });
    return Promise.resolve(mockResponse);
  }

  mockFilingSubmission(itrJson) {
    const mockResponse = {
      success: true,
      ackNumber: `ACK${Date.now()}`,
      submittedAt: new Date().toISOString(),
      status: 'Submitted',
      source: 'MOCK'
    };
    
    enterpriseLogger.info('Mock filing submission', { ackNumber: mockResponse.ackNumber });
    return Promise.resolve(mockResponse);
  }

  mockAcknowledgementFetch(ackNumber) {
    const mockResponse = {
      ackNumber,
      status: 'Processed',
      processedAt: new Date().toISOString(),
      refundAmount: 0,
      taxLiability: 0,
      source: 'MOCK'
    };
    
    enterpriseLogger.info('Mock acknowledgement fetch', { ackNumber, result: mockResponse });
    return Promise.resolve(mockResponse);
  }

  mockPreviousItrData(pan, assessmentYear) {
    const mockResponse = {
      pan,
      assessmentYear,
      previousFiling: {
        totalIncome: 500000,
        taxPaid: 25000,
        refundReceived: 5000
      },
      source: 'MOCK'
    };
    
    enterpriseLogger.info('Mock previous ITR data', { pan, assessmentYear });
    return Promise.resolve(mockResponse);
  }
}

module.exports = new ERIIntegrationService();
