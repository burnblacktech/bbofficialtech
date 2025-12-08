// =====================================================
// ADMIN DOCUMENTS SERVICE
// API service for admin document management operations
// =====================================================

import api from '../../../../services/api';

const DOCUMENTS_BASE_URL = '/admin/documents';

export const adminDocumentsService = {
  getDocuments: async (params = {}) => {
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        queryParams.append(key, params[key]);
      }
    });

    const response = await api.get(`${DOCUMENTS_BASE_URL}?${queryParams.toString()}`);
    return response.data;
  },

  getDocumentDetails: async (documentId) => {
    const response = await api.get(`${DOCUMENTS_BASE_URL}/${documentId}`);
    return response.data;
  },

  deleteDocument: async (documentId, reason) => {
    const response = await api.delete(`${DOCUMENTS_BASE_URL}/${documentId}`, { data: { reason } });
    return response.data;
  },

  reprocessDocument: async (documentId, reason) => {
    const response = await api.post(`${DOCUMENTS_BASE_URL}/${documentId}/reprocess`, { reason });
    return response.data;
  },

  getExtractedData: async (documentId) => {
    const response = await api.get(`${DOCUMENTS_BASE_URL}/${documentId}/extracted-data`);
    return response.data;
  },

  updateExtractedData: async (documentId, data) => {
    const response = await api.put(`${DOCUMENTS_BASE_URL}/${documentId}/extracted-data`, data);
    return response.data;
  },

  getDocumentTemplates: async () => {
    const response = await api.get(`${DOCUMENTS_BASE_URL}/templates`);
    return response.data;
  },

  createDocumentTemplate: async (data) => {
    const response = await api.post(`${DOCUMENTS_BASE_URL}/templates`, data);
    return response.data;
  },

  updateDocumentTemplate: async (templateId, data) => {
    const response = await api.put(`${DOCUMENTS_BASE_URL}/templates/${templateId}`, data);
    return response.data;
  },

  getStorageStats: async () => {
    const response = await api.get(`${DOCUMENTS_BASE_URL}/storage`);
    return response.data;
  },
};

export default adminDocumentsService;

