// =====================================================
// ITR SERVICE
// ITR operations using unified API client
// =====================================================

import apiClient from '../core/APIClient';
import errorHandler from '../core/ErrorHandler';

class ITRService {
  // Get available ITR types
  async getITRTypes() {
    try {
      const response = await apiClient.get('/itr/types');
      return response.data;
    } catch (error) {
      errorHandler.handle(error);
      throw error;
    }
  }

  // Create new ITR filing (creates both filing and draft)
  async createITR(filingData) {
    try {
      // Use /drafts endpoint which creates both filing and draft
      const response = await apiClient.post('/itr/drafts', {
        itrType: filingData.itrType,
        formData: filingData.formData,
        assessmentYear: filingData.assessmentYear,
        taxRegime: filingData.taxRegime,
      });
      // Return in expected format for backward compatibility
      // Backend returns: { draft: { id, filingId, ... } }
      const draftData = response.data.draft || response.data;
      return {
        filing: {
          id: draftData.filingId || draftData.id,
        },
        draft: {
          id: draftData.id,
        },
        filingId: draftData.filingId,
        id: draftData.id,
        ...response.data,
      };
    } catch (error) {
      errorHandler.handleValidationError(error);
      throw error;
    }
  }

  // Get ITR filing details
  async getITR(id) {
    try {
      const response = await apiClient.get(`/itr/${id}`);
      return response.data;
    } catch (error) {
      errorHandler.handle(error);
      throw error;
    }
  }

  // Update ITR filing
  async updateITR(id, filingData) {
    try {
      const response = await apiClient.put(`/itr/${id}`, filingData);
      return response.data;
    } catch (error) {
      errorHandler.handleValidationError(error);
      throw error;
    }
  }

  // Submit ITR filing
  async submitITR(id) {
    try {
      const response = await apiClient.post(`/itr/${id}/submit`);
      return response.data;
    } catch (error) {
      errorHandler.handleBusinessError(error);
      throw error;
    }
  }

  // Get user's ITR filings
  async getUserITRs(params = {}) {
    try {
      const response = await apiClient.get('/itr/filings', { params });
      return response.data;
    } catch (error) {
      errorHandler.handle(error);
      throw error;
    }
  }

  // Pause a filing
  async pauseFiling(filingId, reason = null) {
    try {
      const response = await apiClient.post(`/itr/filings/${filingId}/pause`, { reason });
      return response.data;
    } catch (error) {
      errorHandler.handle(error);
      throw error;
    }
  }

  // Resume a paused filing
  async resumeFiling(filingId) {
    try {
      const response = await apiClient.post(`/itr/filings/${filingId}/resume`);
      return response.data;
    } catch (error) {
      errorHandler.handle(error);
      throw error;
    }
  }

  // Delete ITR filing
  async deleteITR(id) {
    try {
      const response = await apiClient.delete(`/itr/${id}`);
      return response.data;
    } catch (error) {
      errorHandler.handle(error);
      throw error;
    }
  }

  // Auto-detect ITR type based on income sources
  async detectITRType(incomeData) {
    try {
      const response = await apiClient.post('/itr/detect-type', incomeData);
      return response.data;
    } catch (error) {
      errorHandler.handleValidationError(error);
      throw error;
    }
  }

  // Validate ITR data
  async validateITR(id, section = null) {
    try {
      const url = section ? `/itr/${id}/validate/${section}` : `/itr/${id}/validate`;
      const response = await apiClient.post(url);
      return response.data;
    } catch (error) {
      errorHandler.handleValidationError(error);
      throw error;
    }
  }

  // Save ITR draft
  async saveDraft(id, draftData) {
    try {
      const response = await apiClient.post(`/itr/${id}/draft`, draftData);
      return response.data;
    } catch (error) {
      errorHandler.handle(error);
      throw error;
    }
  }

  // Get ITR draft
  async getDraft(id) {
    try {
      const response = await apiClient.get(`/itr/${id}/draft`);
      return response.data;
    } catch (error) {
      errorHandler.handle(error);
      throw error;
    }
  }

  // Get draft by draftId (new route)
  async getDraftById(draftId) {
    try {
      const response = await apiClient.get(`/itr/drafts/${draftId}`);
      return response.data;
    } catch (error) {
      errorHandler.handle(error);
      throw error;
    }
  }

  // Get user's drafts
  async getUserDrafts(params = {}) {
    try {
      const response = await apiClient.get('/itr/drafts', { params });
      return response.data;
    } catch (error) {
      errorHandler.handle(error);
      throw error;
    }
  }

  // Get filing by filingId
  async getFilingById(filingId) {
    try {
      const response = await apiClient.get(`/itr/filings/${filingId}`);
      return response.data;
    } catch (error) {
      errorHandler.handle(error);
      throw error;
    }
  }

  // Update draft
  async updateDraft(draftId, formData) {
    try {
      const response = await apiClient.put(`/itr/drafts/${draftId}`, { formData });
      return response.data;
    } catch (error) {
      errorHandler.handleValidationError(error);
      throw error;
    }
  }

  // Compute tax for draft
  async computeTaxForDraft(draftId) {
    try {
      const response = await apiClient.post(`/itr/drafts/${draftId}/compute`);
      return response.data;
    } catch (error) {
      errorHandler.handleBusinessError(error);
      throw error;
    }
  }

  // Compute tax with formData
  async computeTax(formData, regime = 'old', assessmentYear = '2024-25') {
    try {
      const response = await apiClient.post('/itr/compute-tax', {
        formData,
        regime,
        assessmentYear,
      });
      return response.data;
    } catch (error) {
      errorHandler.handleBusinessError(error);
      throw error;
    }
  }

  // Generate ITR PDF
  async generatePDF(id) {
    try {
      const response = await apiClient.get(`/itr/${id}/generate-pdf`, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      errorHandler.handleServerError(error);
      throw error;
    }
  }

  // Get ITR status
  async getStatus(id) {
    try {
      const response = await apiClient.get(`/itr/${id}/status`);
      return response.data;
    } catch (error) {
      errorHandler.handle(error);
      throw error;
    }
  }

  // Download ITR-V/Acknowledgment PDF
  async downloadAcknowledgment(filingId) {
    try {
      const response = await apiClient.get(`/itr/filings/${filingId}/acknowledgment/pdf`, {
        responseType: 'blob',
      });

      // Create blob URL and trigger download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ITR-V-${filingId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return { success: true };
    } catch (error) {
      errorHandler.handle(error);
      throw error;
    }
  }

  // Download ITR PDF
  async downloadITR(filingId) {
    try {
      const response = await apiClient.get(`/itr/filings/${filingId}/tax-computation/pdf`, {
        responseType: 'blob',
      });

      // Create blob URL and trigger download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ITR-${filingId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return { success: true };
    } catch (error) {
      errorHandler.handle(error);
      throw error;
    }
  }

  // Get available previous year filings (optional feature - errors are expected)
  async getAvailablePreviousYears(memberId = null, currentAssessmentYear = '2025-26') {
    try {
      const response = await apiClient.get('/itr/previous-years', {
        params: { memberId, currentAssessmentYear },
        _suppressErrorLog: true, // Suppress error logging for optional features
      });
      return response.data;
    } catch (error) {
      // Don't log errors for optional features - no previous year filing is normal
      // Return empty result for any error (404, 500, etc. are all expected for new users)
      return { success: false, previousYears: [], count: 0 };
    }
  }

  // Check if user already filed for current AY (for revised return) - optional feature
  async checkExistingFiling(memberId = null, assessmentYear = '2025-26') {
    try {
      const response = await apiClient.get('/itr/filings', {
        params: { memberId, assessmentYear, status: 'submitted,acknowledged,processed' },
        _suppressErrorLog: true, // Suppress error logging for optional features
      });
      return response.data?.data?.length > 0 ? response.data.data[0] : null;
    } catch (error) {
      // Silently fail - no existing filing is normal for first-time filers
      return null;
    }
  }
}

// Create singleton instance
const itrService = new ITRService();

export default itrService;
