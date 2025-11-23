// =====================================================
// DOCUMENT SERVICE
// =====================================================

const fs = require('fs').promises;
const path = require('path');
const multer = require('multer');
const enterpriseLogger = require('../utils/logger');

class DocumentService {
  constructor() {
    this.uploadDir = path.join(__dirname, '../../uploads');
    this.allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    this.maxFileSize = 10 * 1024 * 1024; // 10MB
    this.setupUpload();
  }

  /**
   * Setup multer for file uploads
   */
  setupUpload() {
    // Ensure upload directory exists
    this.ensureUploadDir();
    
    // Configure storage
    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, this.uploadDir);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
      }
    });

    // Configure file filter
    const fileFilter = (req, file, cb) => {
      if (this.allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type'), false);
      }
    };

    // Create multer instance
    this.upload = multer({
      storage,
      fileFilter,
      limits: {
        fileSize: this.maxFileSize
      }
    });
  }

  /**
   * Ensure upload directory exists
   */
  async ensureUploadDir() {
    try {
      await fs.access(this.uploadDir);
    } catch (error) {
      await fs.mkdir(this.uploadDir, { recursive: true });
      enterpriseLogger.info('Created upload directory', { path: this.uploadDir });
    }
  }

  /**
   * Upload document
   * @param {Object} file - Uploaded file
   * @param {Object} metadata - File metadata
   * @returns {Object} Upload result
   */
  async uploadDocument(file, metadata = {}) {
    try {
      if (!file) {
        throw new Error('No file provided');
      }

      // Validate file
      const validation = this.validateFile(file);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      // Generate document ID
      const documentId = this.generateDocumentId();
      
      // Create document record
      const document = {
        id: documentId,
        originalName: file.originalname,
        filename: file.filename,
        path: file.path,
        size: file.size,
        mimetype: file.mimetype,
        uploadedAt: new Date().toISOString(),
        metadata: {
          ...metadata,
          uploadedBy: metadata.userId,
          category: metadata.category || 'general'
        }
      };

      // Save document metadata (in a real app, this would be saved to database)
      await this.saveDocumentMetadata(document);

      enterpriseLogger.info('Document uploaded successfully', {
        documentId,
        filename: file.filename,
        size: file.size,
        mimetype: file.mimetype
      });

      return {
        success: true,
        documentId,
        filename: file.filename,
        size: file.size,
        mimetype: file.mimetype,
        uploadedAt: document.uploadedAt
      };
    } catch (error) {
      enterpriseLogger.error('Document upload error', {
        error: error.message,
        stack: error.stack
      });
      
      throw error;
    }
  }

  /**
   * Get document by ID
   * @param {string} documentId - Document ID
   * @returns {Object} Document information
   */
  async getDocument(documentId) {
    try {
      const document = await this.getDocumentMetadata(documentId);
      if (!document) {
        throw new Error('Document not found');
      }

      // Check if file exists
      const filePath = path.join(this.uploadDir, document.filename);
      try {
        await fs.access(filePath);
      } catch (error) {
        throw new Error('Document file not found');
      }

      return {
        ...document,
        filePath
      };
    } catch (error) {
      enterpriseLogger.error('Get document error', {
        documentId,
        error: error.message
      });
      
      throw error;
    }
  }

  /**
   * Delete document
   * @param {string} documentId - Document ID
   * @returns {Object} Deletion result
   */
  async deleteDocument(documentId) {
    try {
      const document = await this.getDocumentMetadata(documentId);
      if (!document) {
        throw new Error('Document not found');
      }

      // Delete file
      const filePath = path.join(this.uploadDir, document.filename);
      try {
        await fs.unlink(filePath);
      } catch (error) {
        enterpriseLogger.warn('File deletion failed', {
          documentId,
          filePath,
          error: error.message
        });
      }

      // Delete metadata
      await this.deleteDocumentMetadata(documentId);

      enterpriseLogger.info('Document deleted successfully', { documentId });

      return {
        success: true,
        documentId,
        deletedAt: new Date().toISOString()
      };
    } catch (error) {
      enterpriseLogger.error('Document deletion error', {
        documentId,
        error: error.message
      });
      
      throw error;
    }
  }

  /**
   * List documents
   * @param {Object} filters - Filter options
   * @returns {Array} List of documents
   */
  async listDocuments(filters = {}) {
    try {
      // In a real app, this would query the database
      // For now, return empty array
      return [];
    } catch (error) {
      enterpriseLogger.error('List documents error', {
        error: error.message
      });
      
      throw error;
    }
  }

  /**
   * Validate uploaded file
   * @param {Object} file - Uploaded file
   * @returns {Object} Validation result
   */
  validateFile(file) {
    try {
      // Check file type
      if (!this.allowedTypes.includes(file.mimetype)) {
        return {
          isValid: false,
          error: 'Invalid file type. Allowed types: ' + this.allowedTypes.join(', ')
        };
      }

      // Check file size
      if (file.size > this.maxFileSize) {
        return {
          isValid: false,
          error: `File size exceeds limit of ${this.maxFileSize / (1024 * 1024)}MB`
        };
      }

      // Check file name
      if (!file.originalname || file.originalname.trim() === '') {
        return {
          isValid: false,
          error: 'Invalid file name'
        };
      }

      return { isValid: true };
    } catch (error) {
      return {
        isValid: false,
        error: 'File validation error: ' + error.message
      };
    }
  }

  /**
   * Generate unique document ID
   * @returns {string} Document ID
   */
  generateDocumentId() {
    return 'doc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Save document metadata
   * @param {Object} document - Document metadata
   */
  async saveDocumentMetadata(document) {
    try {
      // In a real app, this would save to database
      // For now, just log the action
      enterpriseLogger.info('Document metadata saved', {
        documentId: document.id,
        filename: document.filename
      });
    } catch (error) {
      enterpriseLogger.error('Save document metadata error', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get document metadata
   * @param {string} documentId - Document ID
   * @returns {Object} Document metadata
   */
  async getDocumentMetadata(documentId) {
    try {
      // In a real app, this would query the database
      // For now, return null
      return null;
    } catch (error) {
      enterpriseLogger.error('Get document metadata error', {
        documentId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Delete document metadata
   * @param {string} documentId - Document ID
   */
  async deleteDocumentMetadata(documentId) {
    try {
      // In a real app, this would delete from database
      // For now, just log the action
      enterpriseLogger.info('Document metadata deleted', { documentId });
    } catch (error) {
      enterpriseLogger.error('Delete document metadata error', {
        documentId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get multer upload middleware
   * @param {string} fieldName - Form field name
   * @param {number} maxCount - Maximum number of files
   * @returns {Function} Multer middleware
   */
  getUploadMiddleware(fieldName = 'document', maxCount = 1) {
    return this.upload.single(fieldName);
  }

  /**
   * Get multer upload middleware for multiple files
   * @param {string} fieldName - Form field name
   * @param {number} maxCount - Maximum number of files
   * @returns {Function} Multer middleware
   */
  getMultipleUploadMiddleware(fieldName = 'documents', maxCount = 5) {
    return this.upload.array(fieldName, maxCount);
  }
}

// Create singleton instance
const documentService = new DocumentService();

module.exports = documentService;
