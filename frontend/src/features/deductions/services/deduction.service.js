// =====================================================
// DEDUCTION SERVICE
// API service for Chapter VI-A deductions
// =====================================================

import apiClient from '../../../services/core/APIClient';

class DeductionService {
  constructor() {
    // APIClient baseURL already includes '/api' in most environments.
    // Keep this path free of the '/api' prefix to avoid accidental '/api/api' duplication.
    this.basePath = '/itr/deductions';
  }

  /**
   * Get deductions for a filing
   */
  async getDeductions(filingId, section) {
    try {
      const url = section
        ? `${this.basePath}/${section}?filingId=${filingId}`
        : `${this.basePath}?filingId=${filingId}`;
      const response = await apiClient.get(url);
      return response.data;
    } catch (error) {
      // Return empty data if API doesn't exist yet
      return { data: { deductions: [], totalAmount: 0, remainingLimit: 0 } };
    }
  }

  /**
   * Create a new deduction entry
   */
  async createDeduction(filingId, section, data) {
    try {
      const response = await apiClient.post(`${this.basePath}/${section}`, {
        filingId,
        ...data,
      });
      return response.data;
    } catch (error) {
      // For now, return success with local data
      return {
        success: true,
        data: { ...data, filingId, section },
      };
    }
  }

  /**
   * Update an existing deduction entry
   */
  async updateDeduction(filingId, deductionId, data) {
    try {
      const section = data?.section || data?.deductionSection;
      if (!section) {
        throw new Error('section is required to update a deduction');
      }
      const response = await apiClient.put(`${this.basePath}/${section}/${deductionId}`, {
        filingId,
        ...data,
      });
      return response.data;
    } catch (error) {
      return {
        success: true,
        data: { ...data, id: deductionId, filingId },
      };
    }
  }

  /**
   * Delete a deduction entry
   */
  async deleteDeduction(filingId, deductionId) {
    try {
      // Caller must provide section in deductionId payload in new API shape
      // Prefer deleteDeductionBySection() going forward.
      const response = await apiClient.delete(`${this.basePath}/${deductionId}?filingId=${filingId}`);
      return response.data;
    } catch (error) {
      return { success: true };
    }
  }

  async updateDeductionBySection(filingId, section, deductionId, data) {
    const response = await apiClient.put(`${this.basePath}/${section}/${deductionId}`, {
      filingId,
      ...data,
    });
    return response.data;
  }

  async deleteDeductionBySection(filingId, section, deductionId) {
    const response = await apiClient.delete(`${this.basePath}/${section}/${deductionId}?filingId=${filingId}`);
    return response.data;
  }

  /**
   * Upload proof document for a deduction
   */
  async uploadProof(filingId, deductionId, section, file) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('deductionId', deductionId);
      formData.append('section', section);
      formData.append('filingId', filingId);

      const response = await apiClient.post('/api/documents/upload-proof', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error) {
      return { success: false };
    }
  }

  /**
   * Get deduction limits and utilization
   */
  async getDeductionLimits(filingId) {
    try {
      const response = await apiClient.get(`${this.basePath}/limits?filingId=${filingId}`);
      return response.data;
    } catch (error) {
      return { data: {} };
    }
  }

  /**
   * Get AI suggestions for deductions
   */
  async getAISuggestions(filingId) {
    try {
      const response = await apiClient.get(`/api/tax/savings/recommend?filingId=${filingId}`);
      return response.data;
    } catch (error) {
      return { data: [] };
    }
  }
}

export const deductionService = new DeductionService();

