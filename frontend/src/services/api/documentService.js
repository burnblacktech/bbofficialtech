// =====================================================
// DOCUMENT SERVICE
// Document management using unified API client
// =====================================================

import apiClient from '../core/APIClient';
import errorHandler from '../core/ErrorHandler';

class DocumentService {
  // Generate presigned upload URL
  async generatePresignedUploadUrl(fileData) {
    try {
      const response = await apiClient.post('/documents/presign', fileData);
      return response.data;
    } catch (error) {
      errorHandler.handleValidationError(error);
      throw error;
    }
  }

  // Complete file upload
  async completeUpload(uploadData) {
    try {
      const response = await apiClient.post('/documents/complete', uploadData);
      return response.data;
    } catch (error) {
      errorHandler.handle(error);
      throw error;
    }
  }

  // Upload file directly (for development/local)
  async uploadFile(file, metadata) {
    try {
      const response = await apiClient.uploadFile('/documents/upload', file, null, {
        onUploadProgress: metadata.onProgress,
        headers: {
          'X-Document-Type': metadata.documentType,
          'X-Category': metadata.category,
          'X-Filing-ID': metadata.filingId || ''
        }
      });
      return response.data;
    } catch (error) {
      errorHandler.handle(error);
      throw error;
    }
  }

  // Get user documents
  async getUserDocuments(params = {}) {
    try {
      const response = await apiClient.get('/documents', { params });
      return response.data;
    } catch (error) {
      errorHandler.handle(error);
      throw error;
    }
  }

  // Get document download URL
  async getDownloadUrl(documentId) {
    try {
      const response = await apiClient.get(`/documents/${documentId}/download`);
      return response.data;
    } catch (error) {
      errorHandler.handle(error);
      throw error;
    }
  }

  // Delete document
  async deleteDocument(documentId) {
    try {
      const response = await apiClient.delete(`/documents/${documentId}`);
      return response.data;
    } catch (error) {
      errorHandler.handle(error);
      throw error;
    }
  }

  // Get document statistics
  async getDocumentStats() {
    try {
      const response = await apiClient.get('/documents/stats');
      return response.data;
    } catch (error) {
      errorHandler.handle(error);
      throw error;
    }
  }

  // Get document categories
  async getDocumentCategories() {
    try {
      const response = await apiClient.get('/documents/categories');
      return response.data;
    } catch (error) {
      errorHandler.handle(error);
      throw error;
    }
  }

  // Process Form 16 with OCR
  async processForm16(file) {
    try {
      const response = await apiClient.uploadFile('/documents/process-form16', file);
      return response.data;
    } catch (error) {
      errorHandler.handleServerError(error);
      throw error;
    }
  }

  // Process broker file
  async processBrokerFile(file) {
    try {
      const response = await apiClient.uploadFile('/documents/process-broker', file);
      return response.data;
    } catch (error) {
      errorHandler.handleServerError(error);
      throw error;
    }
  }

  // Validate document
  async validateDocument(documentId) {
    try {
      const response = await apiClient.post(`/documents/${documentId}/validate`);
      return response.data;
    } catch (error) {
      errorHandler.handleValidationError(error);
      throw error;
    }
  }

  // Extract data from document
  async extractData(documentId) {
    try {
      const response = await apiClient.post(`/documents/${documentId}/extract-data`);
      return response.data;
    } catch (error) {
      errorHandler.handleServerError(error);
      throw error;
    }
  }
}

// Create singleton instance
const documentService = new DocumentService();

export default documentService;