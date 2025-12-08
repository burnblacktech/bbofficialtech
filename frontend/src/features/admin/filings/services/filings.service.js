// =====================================================
// ADMIN FILINGS SERVICE
// API service for admin filing management operations
// =====================================================

import api from '../../../../services/api';

const FILINGS_BASE_URL = '/admin/filings';

export const adminFilingsService = {
  /**
   * Get all filings with pagination and filters
   */
  getFilings: async (params = {}) => {
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        queryParams.append(key, params[key]);
      }
    });

    const response = await api.get(`${FILINGS_BASE_URL}?${queryParams.toString()}`);
    return response.data;
  },

  /**
   * Get filing details
   */
  getFilingDetails: async (filingId) => {
    const response = await api.get(`${FILINGS_BASE_URL}/${filingId}`);
    return response.data;
  },

  /**
   * Update filing
   */
  updateFiling: async (filingId, data) => {
    const response = await api.put(`${FILINGS_BASE_URL}/${filingId}`, data);
    return response.data;
  },

  /**
   * Reprocess filing
   */
  reprocessFiling: async (filingId, reason) => {
    const response = await api.post(`${FILINGS_BASE_URL}/${filingId}/reprocess`, { reason });
    return response.data;
  },

  /**
   * Cancel filing
   */
  cancelFiling: async (filingId, reason) => {
    const response = await api.post(`${FILINGS_BASE_URL}/${filingId}/cancel`, { reason });
    return response.data;
  },

  /**
   * Get filing audit log
   */
  getFilingAuditLog: async (filingId) => {
    const response = await api.get(`${FILINGS_BASE_URL}/${filingId}/audit-log`);
    return response.data;
  },

  /**
   * Get filing documents
   */
  getFilingDocuments: async (filingId) => {
    const response = await api.get(`${FILINGS_BASE_URL}/${filingId}/documents`);
    return response.data;
  },

  /**
   * Get filings with issues
   */
  getFilingIssues: async (params = {}) => {
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        queryParams.append(key, params[key]);
      }
    });

    const response = await api.get(`${FILINGS_BASE_URL}/issues?${queryParams.toString()}`);
    return response.data;
  },

  /**
   * Get filing statistics
   */
  getFilingStats: async () => {
    const response = await api.get(`${FILINGS_BASE_URL}/stats`);
    return response.data;
  },

  /**
   * Get filing analytics
   */
  getFilingAnalytics: async (params = {}) => {
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        queryParams.append(key, params[key]);
      }
    });

    const response = await api.get(`${FILINGS_BASE_URL}/analytics?${queryParams.toString()}`);
    return response.data;
  },

  /**
   * Export filings
   */
  exportFilings: async (format = 'csv', params = {}) => {
    const queryParams = new URLSearchParams();
    queryParams.append('format', format);
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        queryParams.append(key, params[key]);
      }
    });

    const response = await api.get(`${FILINGS_BASE_URL}/export?${queryParams.toString()}`, {
      responseType: format === 'csv' ? 'blob' : 'json',
    });
    return response.data;
  },

  /**
   * Override validation
   */
  overrideValidation: async (filingId, reason) => {
    const response = await api.post(`${FILINGS_BASE_URL}/${filingId}/override-validation`, { reason });
    return response.data;
  },

  /**
   * Flag for review
   */
  flagForReview: async (filingId, reason) => {
    const response = await api.post(`${FILINGS_BASE_URL}/${filingId}/flag-review`, { reason });
    return response.data;
  },

  /**
   * Add admin notes
   */
  addAdminNotes: async (filingId, notes, reason) => {
    const response = await api.post(`${FILINGS_BASE_URL}/${filingId}/add-notes`, { notes, reason });
    return response.data;
  },
};

export default adminFilingsService;

