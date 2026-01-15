/**
 * Document Routes
 * Handles document upload, retrieval, and management
 */

const express = require('express');
const multer = require('multer');
const documentController = require('../controllers/documentController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Configure multer for memory storage (files stored in buffer)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        // Accept only specific file types
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only PDF, JPG, and PNG are allowed.'));
        }
    },
});

// All routes require authentication
router.use(authenticateToken);

/**
 * @route   POST /api/documents/upload
 * @desc    Upload a document
 * @access  Private
 */
router.post('/upload', upload.single('file'), documentController.uploadDocument);

/**
 * @route   GET /api/documents
 * @desc    Get user documents
 * @access  Private
 */
router.get('/', documentController.getUserDocuments);

/**
 * @route   GET /api/documents/:id
 * @desc    Get document by ID
 * @access  Private
 */
router.get('/:id', documentController.getDocumentById);

/**
 * @route   DELETE /api/documents/:id
 * @desc    Delete document
 * @access  Private
 */
router.delete('/:id', documentController.deleteDocument);

module.exports = router;
