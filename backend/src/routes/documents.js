// =====================================================
// DOCUMENT ROUTES
// =====================================================

const express = require('express');
const router = express.Router();
const documentController = require('../controllers/DocumentController');
const authMiddleware = require('../middleware/auth');
const S3Service = require('../services/integration/S3Service');
const enterpriseLogger = require('../utils/logger');

// Apply authentication middleware to all routes
router.use(authMiddleware.authenticateToken);

// Generate presigned upload URL
router.post('/presign', documentController.generatePresignedUrl);

// Complete file upload
router.post('/complete', documentController.completeUpload);

// Get user documents
router.get('/', documentController.getUserDocuments);

// Get document download URL
router.get('/:id/download', documentController.getDownloadUrl);

// Delete document
router.delete('/:id', documentController.deleteDocument);

// Get document statistics
router.get('/stats', documentController.getDocumentStats);

// Get document categories
router.get('/categories', documentController.getDocumentCategories);

// Get service status
router.get('/status', documentController.getServiceStatus);

// Local file upload (for development)
router.post('/upload-local',
  S3Service.getMulterMiddleware().single('file'),
  documentController.uploadLocalFile,
);

// Local file download (for development)
router.get('/download-local/:path', documentController.downloadLocalFile);

// Error handling middleware
router.use((error, req, res, next) => {
  enterpriseLogger.error('Document route error', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    userId: req.user?.id,
  });

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  });
});

enterpriseLogger.info('Document routes configured');

module.exports = router;