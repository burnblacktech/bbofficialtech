/**
 * Document Controller
 * Handles document uploads and OCR processing
 */

const documentService = require('../services/documentService');
const enterpriseLogger = require('../utils/logger');

/**
 * Upload document
 * POST /api/documents/upload
 */
const uploadDocument = async (req, res) => {
    try {
        const userId = req.user.id;
        const { documentType } = req.body;
        const file = req.file;

        if (!file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded',
            });
        }

        enterpriseLogger.info('Document upload initiated', {
            userId,
            documentType,
            fileName: file.originalname,
            fileSize: file.size,
        });

        const result = await documentService.uploadDocument(userId, file, documentType);

        res.status(201).json({
            success: true,
            message: 'Document uploaded successfully',
            data: result,
        });
    } catch (error) {
        enterpriseLogger.error('Document upload failed', {
            error: error.message,
            userId: req.user?.id,
        });

        res.status(500).json({
            success: false,
            message: error.message || 'Document upload failed',
        });
    }
};

/**
 * Get user documents
 * GET /api/documents
 */
const getUserDocuments = async (req, res) => {
    try {
        const userId = req.user.id;
        const { financialYear, documentType } = req.query;

        const documents = await documentService.getUserDocuments(userId, {
            financialYear,
            documentType,
        });

        res.json({
            success: true,
            data: documents,
        });
    } catch (error) {
        enterpriseLogger.error('Failed to fetch documents', {
            error: error.message,
            userId: req.user?.id,
        });

        res.status(500).json({
            success: false,
            message: 'Failed to fetch documents',
        });
    }
};

/**
 * Get document by ID
 * GET /api/documents/:id
 */
const getDocumentById = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const document = await documentService.getDocumentById(id, userId);

        if (!document) {
            return res.status(404).json({
                success: false,
                message: 'Document not found',
            });
        }

        res.json({
            success: true,
            data: document,
        });
    } catch (error) {
        enterpriseLogger.error('Failed to fetch document', {
            error: error.message,
            documentId: req.params.id,
        });

        res.status(500).json({
            success: false,
            message: 'Failed to fetch document',
        });
    }
};

/**
 * Delete document
 * DELETE /api/documents/:id
 */
const deleteDocument = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        await documentService.deleteDocument(id, userId);

        res.json({
            success: true,
            message: 'Document deleted successfully',
        });
    } catch (error) {
        enterpriseLogger.error('Failed to delete document', {
            error: error.message,
            documentId: req.params.id,
        });

        res.status(500).json({
            success: false,
            message: 'Failed to delete document',
        });
    }
};

module.exports = {
    uploadDocument,
    getUserDocuments,
    getDocumentById,
    deleteDocument,
};
