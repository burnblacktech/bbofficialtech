// =====================================================
// DOCUMENT CONTROLLER (API ENDPOINTS)
// =====================================================

const documentService = require('../services/core/DocumentService');
const enterpriseLogger = require('../utils/logger');
const { AppError } = require('../middleware/errorHandler');

class DocumentController {
  /**
   * Generate presigned upload URL
   * POST /api/documents/presign
   */
  async generatePresignedUrl(req, res, next) {
    try {
      const { fileName, fileType, sizeBytes, category, filingId, memberId } = req.body;
      const userId = req.user.id;
      const uploadedBy = req.user.id;
      const ipAddress = req.ip;

      // Validate required fields
      if (!fileName || !fileType || !sizeBytes || !category) {
        throw new AppError('Missing required fields: fileName, fileType, sizeBytes, category', 400);
      }

      const uploadData = await documentService.generateUploadUrl(
        { fileName, fileType, sizeBytes, category, filingId, memberId },
        userId,
        uploadedBy,
        ipAddress,
      );

      enterpriseLogger.info('Presigned URL generated via API', {
        userId,
        fileName,
        category,
        sizeBytes,
      });

      res.status(200).json({
        success: true,
        message: 'Presigned URL generated successfully',
        data: uploadData,
      });

    } catch (error) {
      enterpriseLogger.error('Failed to generate presigned URL via API', {
        error: error.message,
        userId: req.user?.id,
        body: req.body,
      });
      next(error);
    }
  }

  /**
   * Complete file upload
   * POST /api/documents/complete
   */
  async completeUpload(req, res, next) {
    try {
      const { s3Key, localPath, fileName, fileType, sizeBytes, category, filingId, memberId } = req.body;
      const userId = req.user.id;
      const uploadedBy = req.user.id;
      const ipAddress = req.ip;

      // Validate required fields
      if (!fileName || !fileType || !sizeBytes || !category) {
        throw new AppError('Missing required fields: fileName, fileType, sizeBytes, category', 400);
      }

      if (!s3Key && !localPath) {
        throw new AppError('Either s3Key or localPath is required', 400);
      }

      const result = await documentService.completeUpload(
        { s3Key, localPath, fileName, fileType, sizeBytes, category, filingId, memberId },
        userId,
        uploadedBy,
        ipAddress,
      );

      enterpriseLogger.info('Document upload completed via API', {
        userId,
        fileName,
        category,
        documentId: result.document.id,
      });

      res.status(201).json({
        success: true,
        message: 'Document uploaded successfully',
        data: result.document,
      });

    } catch (error) {
      enterpriseLogger.error('Failed to complete upload via API', {
        error: error.message,
        userId: req.user?.id,
        body: req.body,
      });
      next(error);
    }
  }

  /**
   * Get user documents
   * GET /api/documents
   */
  async getUserDocuments(req, res, next) {
    try {
      const userId = req.user.id;
      const filters = {
        filingId: req.query.filingId,
        category: req.query.category,
        verificationStatus: req.query.verificationStatus,
        limit: parseInt(req.query.limit) || 50,
        offset: parseInt(req.query.offset) || 0,
      };

      // Remove undefined filters
      Object.keys(filters).forEach(key => {
        if (filters[key] === undefined) {
          delete filters[key];
        }
      });

      const documents = await documentService.getUserDocuments(userId, filters);

      enterpriseLogger.info('User documents retrieved via API', {
        userId,
        count: documents.length,
        filters,
      });

      res.status(200).json({
        success: true,
        message: 'Documents retrieved successfully',
        data: {
          documents,
          count: documents.length,
          filters,
        },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to get user documents via API', {
        error: error.message,
        userId: req.user?.id,
        query: req.query,
      });
      next(error);
    }
  }

  /**
   * Get document download URL
   * GET /api/documents/:id/download
   */
  async getDownloadUrl(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const requestedBy = req.user.id;
      const ipAddress = req.ip;

      const downloadUrl = await documentService.getDownloadUrl(
        id,
        userId,
        requestedBy,
        ipAddress,
      );

      enterpriseLogger.info('Document download URL generated via API', {
        documentId: id,
        userId,
      });

      res.status(200).json({
        success: true,
        message: 'Download URL generated successfully',
        data: {
          downloadUrl,
          expiresIn: 3600, // 1 hour
        },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to get download URL via API', {
        error: error.message,
        documentId: req.params.id,
        userId: req.user?.id,
      });
      next(error);
    }
  }

  /**
   * Delete document
   * DELETE /api/documents/:id
   */
  async deleteDocument(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const deletedBy = req.user.id;
      const ipAddress = req.ip;

      await documentService.deleteDocument(id, userId, deletedBy, ipAddress);

      enterpriseLogger.info('Document deleted via API', {
        documentId: id,
        userId,
      });

      res.status(200).json({
        success: true,
        message: 'Document deleted successfully',
      });

    } catch (error) {
      enterpriseLogger.error('Failed to delete document via API', {
        error: error.message,
        documentId: req.params.id,
        userId: req.user?.id,
      });
      next(error);
    }
  }

  /**
   * Get document statistics
   * GET /api/documents/stats
   */
  async getDocumentStats(req, res, next) {
    try {
      const userId = req.user.id;

      const stats = await documentService.getDocumentStats(userId);

      enterpriseLogger.info('Document statistics retrieved via API', {
        userId,
      });

      res.status(200).json({
        success: true,
        message: 'Document statistics retrieved successfully',
        data: stats,
      });

    } catch (error) {
      enterpriseLogger.error('Failed to get document statistics via API', {
        error: error.message,
        userId: req.user?.id,
      });
      next(error);
    }
  }

  /**
   * Get document categories
   * GET /api/documents/categories
   */
  async getDocumentCategories(req, res, next) {
    try {
      const categories = [
        {
          key: 'FORM_16',
          label: 'Form 16',
          description: 'Salary certificate from employer',
          icon: '📄',
          allowedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
        },
        {
          key: 'BANK_STATEMENT',
          label: 'Bank Statement',
          description: 'Bank account statements',
          icon: '🏦',
          allowedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
        },
        {
          key: 'INVESTMENT_PROOF',
          label: 'Investment Proof',
          description: 'Investment certificates and statements',
          icon: '📈',
          allowedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
        },
        {
          key: 'RENT_RECEIPTS',
          label: 'Rent Receipts',
          description: 'Rent payment receipts',
          icon: '🏠',
          allowedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
        },
        {
          key: 'CAPITAL_GAINS',
          label: 'Capital Gains',
          description: 'Capital gains statements and certificates',
          icon: '💰',
          allowedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
        },
        {
          key: 'BUSINESS_INCOME',
          label: 'Business Income',
          description: 'Business income documents',
          icon: '🏢',
          allowedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
        },
        {
          key: 'HOUSE_PROPERTY',
          label: 'House Property',
          description: 'House property related documents',
          icon: '🏘️',
          allowedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
        },
        {
          key: 'OTHER',
          label: 'Other',
          description: 'Other supporting documents',
          icon: '📎',
          allowedTypes: ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        },
      ];

      res.status(200).json({
        success: true,
        message: 'Document categories retrieved successfully',
        data: categories,
      });

    } catch (error) {
      enterpriseLogger.error('Failed to get document categories via API', {
        error: error.message,
      });
      next(error);
    }
  }

  /**
   * Get service status
   * GET /api/documents/status
   */
  async getServiceStatus(req, res, next) {
    try {
      const status = documentService.getServiceStatus();

      res.status(200).json({
        success: true,
        message: 'Document service status retrieved successfully',
        data: status,
      });

    } catch (error) {
      enterpriseLogger.error('Failed to get service status via API', {
        error: error.message,
      });
      next(error);
    }
  }

  /**
   * Local file upload (for development)
   * POST /api/documents/upload-local
   */
  async uploadLocalFile(req, res, next) {
    try {
      // This endpoint is for local development when S3 is disabled
      const file = req.file;
      const { localPath, category, filingId, memberId } = req.body;
      const userId = req.user.id;
      const uploadedBy = req.user.id;
      const ipAddress = req.ip;

      if (!file) {
        throw new AppError('No file uploaded', 400);
      }

      if (!localPath || !category) {
        throw new AppError('Missing required fields: localPath, category', 400);
      }

      const result = await documentService.completeUpload(
        {
          localPath,
          fileName: file.originalname,
          fileType: file.mimetype,
          sizeBytes: file.size,
          category,
          filingId,
          memberId,
        },
        userId,
        uploadedBy,
        ipAddress,
      );

      enterpriseLogger.info('Local file uploaded via API', {
        userId,
        fileName: file.originalname,
        category,
        documentId: result.document.id,
      });

      res.status(201).json({
        success: true,
        message: 'File uploaded successfully',
        data: result.document,
      });

    } catch (error) {
      enterpriseLogger.error('Failed to upload local file via API', {
        error: error.message,
        userId: req.user?.id,
        file: req.file?.originalname,
      });
      next(error);
    }
  }

  /**
   * Local file download (for development)
   * GET /api/documents/download-local/:path
   */
  async downloadLocalFile(req, res, next) {
    try {
      const { path } = req.params;
      const userId = req.user.id;
      const requestedBy = req.user.id;
      const ipAddress = req.ip;

      // Decode the path
      const decodedPath = decodeURIComponent(path);

      // For security, ensure the path is within uploads directory
      if (!decodedPath.startsWith('uploads/')) {
        throw new AppError('Invalid file path', 400);
      }

      // In a real implementation, you would:
      // 1. Verify the user has access to this file
      // 2. Stream the file to the response
      // 3. Set appropriate headers

      res.status(200).json({
        success: true,
        message: 'Local file download endpoint',
        data: {
          path: decodedPath,
          note: 'This is a development endpoint. Implement file streaming for production.',
        },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to download local file via API', {
        error: error.message,
        path: req.params.path,
        userId: req.user?.id,
      });
      next(error);
    }
  }
}

module.exports = new DocumentController();
