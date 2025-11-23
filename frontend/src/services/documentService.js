// =====================================================
// DOCUMENT SERVICE - FRONTEND BACKEND INTEGRATION
// =====================================================

import apiClient from './core/APIClient';

class DocumentService {
  /**
   * Generate presigned upload URL
   */
  async generatePresignedUrl(fileData) {
    try {
      const response = await apiClient.post('/documents/presign', fileData);
      return response.data;
    } catch (error) {
      console.error('Failed to generate presigned URL:', error);
      throw error;
    }
  }

  /**
   * Complete file upload
   */
  async completeUpload(uploadData) {
    try {
      const response = await apiClient.post('/documents/complete', uploadData);
      return response.data;
    } catch (error) {
      console.error('Failed to complete upload:', error);
      throw error;
    }
  }

  /**
   * Get user documents
   */
  async getUserDocuments(params = {}) {
    try {
      const response = await apiClient.get('/documents', { params });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch documents:', error);
      throw error;
    }
  }

  /**
   * Get document download URL
   */
  async getDownloadUrl(documentId) {
    try {
      const response = await apiClient.get(`/documents/${documentId}/download`);
      return response.data;
    } catch (error) {
      console.error('Failed to get download URL:', error);
      throw error;
    }
  }

  /**
   * Delete document
   */
  async deleteDocument(documentId) {
    try {
      const response = await apiClient.delete(`/documents/${documentId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to delete document:', error);
      throw error;
    }
  }

  /**
   * Get document statistics
   */
  async getDocumentStats() {
    try {
      const response = await apiClient.get('/documents/stats');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch document stats:', error);
      throw error;
    }
  }

  /**
   * Get document categories
   */
  async getDocumentCategories() {
    try {
      const response = await apiClient.get('/documents/categories');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch document categories:', error);
      throw error;
    }
  }

  /**
   * Upload file directly (for development)
   */
  async uploadLocalFile(file, category, filingId = null, memberId = null) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', category);
      if (filingId) formData.append('filingId', filingId);
      if (memberId) formData.append('memberId', memberId);

      const response = await apiClient.post('/documents/upload-local', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Failed to upload file locally:', error);
      throw error;
    }
  }

  /**
   * Download local file (for development)
   */
  async downloadLocalFile(filePath) {
    try {
      const response = await apiClient.get(`/documents/download-local/${filePath}`, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      console.error('Failed to download local file:', error);
      throw error;
    }
  }

  /**
   * Upload file with progress tracking
   */
  async uploadFileWithProgress(file, category, filingId = null, memberId = null, onProgress = null) {
    try {
      // For development, use local upload
      if (process.env.NODE_ENV === 'development') {
        return await this.uploadLocalFile(file, category, filingId, memberId);
      }

      // For production, use presigned URL flow
      const fileData = {
        fileName: file.name,
        fileType: file.type,
        sizeBytes: file.size,
        category,
        filingId,
        memberId
      };

      // Generate presigned URL
      const presignResponse = await this.generatePresignedUrl(fileData);
      const { uploadUrl, key } = presignResponse.data;

      // Upload to S3
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file to S3');
      }

      // Complete upload
      const completeData = {
        key,
        fileName: file.name,
        fileType: file.type,
        sizeBytes: file.size,
        category,
        filingId,
        memberId
      };

      return await this.completeUpload(completeData);
    } catch (error) {
      console.error('Failed to upload file:', error);
      throw error;
    }
  }
}

// Create singleton instance
const documentService = new DocumentService();

export default documentService;

