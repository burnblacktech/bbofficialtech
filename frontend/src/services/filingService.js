// =====================================================
// FILING SERVICE
// =====================================================

import apiClient from './core/APIClient';
import { enterpriseLogger } from '../utils/logger';

class FilingService {
  constructor() {
    this.basePath = '/itr';
  }

  /**
   * Create a new filing draft
   * @param {string} itrType - ITR type
   * @param {string} assessmentYear - Assessment year
   * @param {string} memberId - Member ID (optional)
   * @returns {Promise<Object>} Created filing
   */
  async createDraft(itrType, assessmentYear, memberId = null) {
    try {
      const response = await apiClient.post(`${this.basePath}/draft`, {
        itrType,
        assessmentYear,
        memberId
      });

      enterpriseLogger.info('Filing draft created', {
        filingId: response.filing?.id,
        itrType,
        assessmentYear
      });

      return response;
    } catch (error) {
      enterpriseLogger.error('Create draft error', {
        itrType,
        assessmentYear,
        error: error.message
      });
      
      throw error;
    }
  }

  /**
   * Update draft data for a specific step
   * @param {string} filingId - Filing ID
   * @param {string} step - Step name
   * @param {Object} data - Step data
   * @returns {Promise<Object>} Update result
   */
  async updateDraft(filingId, step, data) {
    try {
      const response = await apiClient.put(`${this.basePath}/draft/${filingId}`, {
        step,
        data
      });

      enterpriseLogger.info('Draft updated', {
        filingId,
        step,
        hasValidationErrors: !!response.validationErrors
      });

      return response;
    } catch (error) {
      enterpriseLogger.error('Update draft error', {
        filingId,
        step,
        error: error.message
      });
      
      throw error;
    }
  }

  /**
   * Submit filing
   * @param {string} filingId - Filing ID
   * @param {string} digitalSignature - Digital signature
   * @returns {Promise<Object>} Submission result
   */
  async submitFiling(filingId, digitalSignature) {
    try {
      const response = await apiClient.post(`${this.basePath}/submit`, {
        filingId,
        digitalSignature
      });

      enterpriseLogger.info('Filing submitted', {
        filingId,
        ackNumber: response.ackNumber
      });

      return response;
    } catch (error) {
      enterpriseLogger.error('Submit filing error', {
        filingId,
        error: error.message
      });
      
      throw error;
    }
  }

  /**
   * Get filing history
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Filing history
   */
  async getFilingHistory(filters = {}) {
    try {
      const response = await apiClient.get(`${this.basePath}/history`, {
        params: filters
      });

      return response;
    } catch (error) {
      enterpriseLogger.error('Get filing history error', {
        filters,
        error: error.message
      });
      
      throw error;
    }
  }

  /**
   * Get filing details
   * @param {string} filingId - Filing ID
   * @returns {Promise<Object>} Filing details
   */
  async getFilingDetails(filingId) {
    try {
      const response = await apiClient.get(`${this.basePath}/${filingId}`);

      return response;
    } catch (error) {
      enterpriseLogger.error('Get filing details error', {
        filingId,
        error: error.message
      });
      
      throw error;
    }
  }

  /**
   * Delete draft filing
   * @param {string} filingId - Filing ID
   * @returns {Promise<Object>} Deletion result
   */
  async deleteDraft(filingId) {
    try {
      const response = await apiClient.delete(`${this.basePath}/draft/${filingId}`);

      enterpriseLogger.info('Draft filing deleted', {
        filingId
      });

      return response;
    } catch (error) {
      enterpriseLogger.error('Delete draft error', {
        filingId,
        error: error.message
      });
      
      throw error;
    }
  }

  /**
   * Get filing progress
   * @param {string} filingId - Filing ID
   * @returns {Promise<Object>} Progress status
   */
  async getFilingProgress(filingId) {
    try {
      const response = await apiClient.get(`${this.basePath}/${filingId}/progress`);

      return response;
    } catch (error) {
      enterpriseLogger.error('Get filing progress error', {
        filingId,
        error: error.message
      });
      
      throw error;
    }
  }

  /**
   * Validate filing data
   * @param {string} filingId - Filing ID
   * @param {string} step - Step to validate
   * @returns {Promise<Object>} Validation result
   */
  async validateFiling(filingId, step = null) {
    try {
      const response = await apiClient.post(`${this.basePath}/${filingId}/validate`, {
        step
      });

      return response;
    } catch (error) {
      enterpriseLogger.error('Validate filing error', {
        filingId,
        step,
        error: error.message
      });
      
      throw error;
    }
  }

  /**
   * Get tax computation
   * @param {string} filingId - Filing ID
   * @returns {Promise<Object>} Tax computation result
   */
  async getTaxComputation(filingId) {
    try {
      const response = await apiClient.get(`${this.basePath}/${filingId}/tax-computation`);

      return response;
    } catch (error) {
      enterpriseLogger.error('Get tax computation error', {
        filingId,
        error: error.message
      });
      
      throw error;
    }
  }

  /**
   * Save filing as draft
   * @param {string} filingId - Filing ID
   * @param {Object} data - Data to save
   * @returns {Promise<Object>} Save result
   */
  async saveDraft(filingId, data) {
    try {
      const response = await apiClient.post(`${this.basePath}/${filingId}/save`, data);

      return response;
    } catch (error) {
      enterpriseLogger.error('Save draft error', {
        filingId,
        error: error.message
      });
      
      throw error;
    }
  }

  /**
   * Get filing status
   * @param {string} filingId - Filing ID
   * @returns {Promise<Object>} Filing status
   */
  async getFilingStatus(filingId) {
    try {
      const response = await apiClient.get(`${this.basePath}/${filingId}/status`);

      return response;
    } catch (error) {
      enterpriseLogger.error('Get filing status error', {
        filingId,
        error: error.message
      });
      
      throw error;
    }
  }

  /**
   * Get filing statistics
   * @returns {Promise<Object>} Filing statistics
   */
  async getFilingStats() {
    try {
      const response = await apiClient.get(`${this.basePath}/stats`);

      return response;
    } catch (error) {
      enterpriseLogger.error('Get filing stats error', {
        error: error.message
      });
      
      throw error;
    }
  }

  /**
   * Get available ITR types
   * @returns {Promise<Object>} Available ITR types
   */
  async getAvailableITRTypes() {
    try {
      const response = await apiClient.get(`${this.basePath}/types`);

      return response;
    } catch (error) {
      enterpriseLogger.error('Get available ITR types error', {
        error: error.message
      });
      
      throw error;
    }
  }

  /**
   * Get assessment years
   * @returns {Promise<Object>} Available assessment years
   */
  async getAssessmentYears() {
    try {
      const response = await apiClient.get(`${this.basePath}/assessment-years`);

      return response;
    } catch (error) {
      enterpriseLogger.error('Get assessment years error', {
        error: error.message
      });
      
      throw error;
    }
  }

  /**
   * Get filing templates
   * @param {string} itrType - ITR type
   * @returns {Promise<Object>} Filing templates
   */
  async getFilingTemplates(itrType) {
    try {
      const response = await apiClient.get(`${this.basePath}/templates/${itrType}`);

      return response;
    } catch (error) {
      enterpriseLogger.error('Get filing templates error', {
        itrType,
        error: error.message
      });
      
      throw error;
    }
  }

  /**
   * Export filing data
   * @param {string} filingId - Filing ID
   * @param {string} format - Export format (pdf, excel, json)
   * @returns {Promise<Object>} Export result
   */
  async exportFiling(filingId, format = 'pdf') {
    try {
      const response = await apiClient.get(`${this.basePath}/${filingId}/export`, {
        params: { format },
        responseType: 'blob'
      });

      return response;
    } catch (error) {
      enterpriseLogger.error('Export filing error', {
        filingId,
        format,
        error: error.message
      });
      
      throw error;
    }
  }

  /**
   * Get service status
   * @returns {Object} Service status
   */
  getServiceStatus() {
    return {
      basePath: this.basePath,
      apiClientStatus: apiClient.getServiceStatus()
    };
  }
}

// Create singleton instance
const filingService = new FilingService();

export default filingService;