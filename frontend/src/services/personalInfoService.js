// =====================================================
// PERSONAL INFO SERVICE
// Service for managing personal information in ITR drafts
// =====================================================

import apiClient from './core/APIClient';
import { enterpriseLogger } from '../utils/logger';

const personalInfoService = {
  /**
   * Get personal information from ITR draft
   * @param {string} draftId - The draft ID
   * @returns {Promise<{success: boolean, data?: object, error?: string}>}
   */
  async getPersonalInfo(draftId) {
    try {
      if (!draftId) {
        return {
          success: false,
          error: 'Draft ID is required',
        };
      }

      const response = await apiClient.get(`/api/itr/drafts/${draftId}`);
      
      if (response.data && response.data.draft) {
        // Extract personalInfo from draft formData
        const formData = response.data.draft.formData || {};
        const personalInfo = formData.personalInfo || formData.personal_info || {};
        
        return {
          success: true,
          data: personalInfo,
        };
      }

      return {
        success: false,
        error: 'No personal information found',
      };
    } catch (error) {
      enterpriseLogger.error('Failed to get personal info', {
        error: error.message,
        draftId,
        response: error.response?.data,
      });

      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to load personal information',
      };
    }
  },

  /**
   * Update personal information in ITR draft
   * @param {string} draftId - The draft ID
   * @param {object} data - Personal information data
   * @returns {Promise<{success: boolean, data?: object, error?: string}>}
   */
  async updatePersonalInfo(draftId, data) {
    try {
      if (!draftId) {
        return {
          success: false,
          error: 'Draft ID is required',
        };
      }

      if (!data || typeof data !== 'object') {
        return {
          success: false,
          error: 'Personal information data is required',
        };
      }

      // Get current draft data first
      let currentFormData = {};
      try {
        const getResponse = await apiClient.get(`/api/itr/drafts/${draftId}`);
        if (getResponse.data?.draft?.formData) {
          currentFormData = getResponse.data.draft.formData;
        }
      } catch (getError) {
        enterpriseLogger.warn('Could not fetch current draft data', {
          error: getError.message,
          draftId,
        });
      }

      // Merge personalInfo into formData
      const updatedFormData = {
        ...currentFormData,
        personalInfo: {
          ...(currentFormData.personalInfo || currentFormData.personal_info || {}),
          ...data,
        },
      };

      // Update draft with merged data
      const response = await apiClient.put(`/api/itr/drafts/${draftId}`, {
        formData: updatedFormData,
      });

      if (response.data) {
        return {
          success: true,
          data: response.data,
        };
      }

      return {
        success: false,
        error: 'Failed to update personal information',
      };
    } catch (error) {
      enterpriseLogger.error('Failed to update personal info', {
        error: error.message,
        draftId,
        response: error.response?.data,
      });

      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to save personal information',
      };
    }
  },

  /**
   * Validate personal information in ITR draft
   * @param {string} draftId - The draft ID
   * @returns {Promise<{success: boolean, data?: object, error?: string}>}
   */
  async validatePersonalInfo(draftId) {
    try {
      if (!draftId) {
        return {
          success: false,
          error: 'Draft ID is required',
        };
      }

      const response = await apiClient.post(`/api/itr/drafts/${draftId}/validate`);

      if (response.data) {
        return {
          success: true,
          data: response.data,
        };
      }

      return {
        success: false,
        error: 'Validation failed',
      };
    } catch (error) {
      enterpriseLogger.error('Failed to validate personal info', {
        error: error.message,
        draftId,
        response: error.response?.data,
      });

      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to validate personal information',
      };
    }
  },
};

export { personalInfoService };
export default personalInfoService;

