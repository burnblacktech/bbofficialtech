const express = require('express');
const router = express.Router();
const documentService = require('../services/core/DocumentService');
const taxFormOCRService = require('../services/itr/TaxFormOCRService');
const { authenticateToken } = require('../middleware/auth');
const enterpriseLogger = require('../utils/logger');
const fs = require('fs-extra');
const path = require('path');

// List documents
router.get('/', authenticateToken, async (req, res, next) => {
    try {
        const filters = {
            category: req.query.category,
            filingId: req.query.filingId,
            memberId: req.query.memberId
        };
        const documents = await documentService.listDocuments(req.user.userId, filters);
        res.status(200).json({ success: true, data: documents });
    } catch (error) {
        next(error);
    }
});

// Get document statistics
router.get('/stats', authenticateToken, async (req, res, next) => {
    try {
        const stats = await documentService.getDocumentStats(req.user.userId);
        res.status(200).json({ success: true, data: stats });
    } catch (error) {
        next(error);
    }
});

// Upload document
router.post('/upload', authenticateToken, documentService.getUploadMiddleware(), async (req, res, next) => {
    try {
        const result = await documentService.uploadDocument(req.file, {
            userId: req.user.userId,
            category: req.body.category || req.headers['x-category'],
            documentType: req.body.documentType || req.headers['x-document-type'],
            filingId: req.body.filingId || req.headers['x-filing-id'],
            memberId: req.body.memberId
        });
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
});

// Download document
router.get('/:id/download', authenticateToken, async (req, res, next) => {
    try {
        const document = await documentService.getDocument(req.params.id, req.user.userId);

        const filePath = document.localPath;
        if (!await fs.exists(filePath)) {
            return res.status(404).json({ success: false, error: 'File not found on server' });
        }

        res.download(filePath, document.originalFilename);
    } catch (error) {
        next(error);
    }
});

// Delete document
router.delete('/:id', authenticateToken, async (req, res, next) => {
    try {
        const result = await documentService.deleteDocument(req.params.id, req.user.userId);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
});

// OCR Processing Routes
router.post('/process-form16', authenticateToken, documentService.getUploadMiddleware(), async (req, res, next) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' });
        const fileBuffer = await fs.readFile(req.file.path);
        const result = await taxFormOCRService.processForm(fileBuffer, req.file.originalname, 'FORM_16');
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
});

module.exports = router;
