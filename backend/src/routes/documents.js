/**
 * documents.js
 * Document management and OCR processing routes
 */

const express = require('express');
const router = express.Router();
const documentService = require('../services/core/DocumentService');
const taxFormOCRService = require('../services/itr/TaxFormOCRService');
const propertyDocumentOCRService = require('../services/itr/PropertyDocumentOCRService');
const { authenticateToken } = require('../middleware/auth');
const enterpriseLogger = require('../utils/logger');
const fs = require('fs-extra');

// Upload document
router.post('/upload', authenticateToken, documentService.getUploadMiddleware(), async (req, res, next) => {
    try {
        const result = await documentService.uploadDocument(req.file, {
            userId: req.user.userId,
            category: req.headers['x-category'],
            documentType: req.headers['x-document-type'],
            filingId: req.headers['x-filing-id']
        });
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
});

// Process Form 16
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

// Process Form 16A
router.post('/process-form16a', authenticateToken, documentService.getUploadMiddleware(), async (req, res, next) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' });

        const fileBuffer = await fs.readFile(req.file.path);
        const result = await taxFormOCRService.processForm(fileBuffer, req.file.originalname, 'FORM_16A');

        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
});

// Process Form 16B
router.post('/process-form16b', authenticateToken, documentService.getUploadMiddleware(), async (req, res, next) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' });

        const fileBuffer = await fs.readFile(req.file.path);
        const result = await taxFormOCRService.processForm(fileBuffer, req.file.originalname, 'FORM_16B');

        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
});

module.exports = router;
