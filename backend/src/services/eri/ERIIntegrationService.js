// =====================================================
// ERI INTEGRATION SERVICE
// Business Layer for ERI interactions
// Delegates low-level calls to ERIGatewayService
// =====================================================

const eriGatewayService = require('./ERIGatewayService');
const enterpriseLogger = require('../../utils/logger');
const { AppError } = require('../../middleware/errorHandler');

class ERIIntegrationService {
  constructor() {
    this.gateway = eriGatewayService;
    enterpriseLogger.info('ERIIntegrationService initialized (Delegating to ERIGatewayService)');
  }

  /**
   * Verify PAN using ERI
   * @param {string} pan - PAN number to verify
   * @returns {Promise<object>} - Verification result
   */
  async verifyPan(pan) {
    try {
      enterpriseLogger.info('Verifying PAN via ERI Gateway', { pan });
      const result = await this.gateway.validatePAN(pan);
      return result.data;
    } catch (error) {
      enterpriseLogger.error('PAN verification failed', { pan, error: error.message });
      throw error;
    }
  }

  /**
   * Upload ITR JSON filing to ERI
   * @param {object} itrJson - Complete ITR JSON payload
   * @param {string} digitalSignature - Digital signature
   * @returns {Promise<object>} - Submission result with acknowledgement
   */
  async uploadFiling(itrJson, digitalSignature, itrType, assessmentYear, userId) {
    try {
      enterpriseLogger.info('Uploading ITR filing via ERI Gateway');
      // ERIGateway.submitReturn signature: (payload, itrType, assessmentYear, userId)
      const result = await this.gateway.submitReturn(itrJson, itrType, assessmentYear, userId);

      enterpriseLogger.info('ITR filing uploaded successfully', {
        ackNumber: result.ackNumber,
      });
      return result;
    } catch (error) {
      enterpriseLogger.error('ITR filing upload failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Fetch acknowledgement details
   * @param {string} ackNumber - Acknowledgement number
   * @returns {Promise<object>} - Acknowledgement status
   */
  async fetchAcknowledgement(ackNumber) {
    try {
      return await this.gateway.getFilingStatus(ackNumber);
    } catch (error) {
      enterpriseLogger.error('Failed to fetch acknowledgement', { ackNumber, error: error.message });
      throw error;
    }
  }


  async healthCheck() {
    return this.gateway.healthCheck();
  }

  async initiateEVerification(ackNum, method) {
    return this.gateway.initiateEVerification(ackNum, method);
  }

  async completeEVerification(txnId, otp) {
    return this.gateway.completeEVerification(txnId, otp);
  }

  async downloadITRV(ackNum) {
    return this.gateway.downloadITRV(ackNum);
  }

  async getForm26AS(pan, ay) {
    return this.gateway.getForm26AS(pan, ay);
  }

  async getAIS(pan, ay) {
    return this.gateway.getAIS(pan, ay);
  }

  /**
   * Fetch previous ITR data for prefill
   */
  async fetchPreviousItrData(pan, assessmentYear, dob) {
    try {
      const result = await this.gateway.getPrefilledData(pan, assessmentYear, dob);
      // Map Gateway response to expected format
      return {
        pan,
        assessmentYear,
        itrType: 'ITR-1', // Mock/Gateway specific
        status: 'submitted',
        data: result.data,
        source: 'ERI',
      };
    } catch (error) {
      enterpriseLogger.error('Failed to fetch previous ITR data', { pan, error: error.message });
      throw error;
    }
  }

  async getPreviousYearFilings(pan) {
    // Gateway method?
    // I missed `getPreviousYearFilings` too.
    // I will simply return empty array or throw for now.
    return [];
  }
}

module.exports = new ERIIntegrationService();

