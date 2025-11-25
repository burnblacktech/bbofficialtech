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

  // Create new ITR filing
  async createITR(filingData) {
    try {
      const response = await apiClient.post('/itr/create', filingData);
      return response.data;
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
      const response = await apiClient.get('/itr', { params });
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

  // Compute tax for ITR
  async computeTax(id, assessmentYear) {
    try {
      const response = await apiClient.post(`/itr/${id}/compute-tax`, { assessmentYear });
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
}

// Create singleton instance
const itrService = new ITRService();

export default itrService;
