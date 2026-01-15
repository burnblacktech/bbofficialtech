/**
 * Document Service
 * Handles document storage, OCR processing, and data extraction
 */

const { Document } = require('../models');
const DocumentVersion = require('../models/DocumentVersion');
const DocumentMetadata = require('../models/DocumentMetadata');
const enterpriseLogger = require('../utils/logger');
const path = require('path');
const fs = require('fs').promises;

class DocumentService {
    /**
     * Upload document and trigger OCR processing
     */
    async uploadDocument(userId, file, documentType) {
        try {
            // Store file (in production, upload to S3/Supabase Storage)
            const uploadDir = path.join(__dirname, '../../uploads/documents', userId);
            await fs.mkdir(uploadDir, { recursive: true });

            const fileName = `${Date.now()}-${file.originalname}`;
            const filePath = path.join(uploadDir, fileName);

            await fs.writeFile(filePath, file.buffer);

            // Create document record
            const document = await Document.create({
                userId,
                documentType,
                filePath, // Points to latest/current file
                fileName: file.originalname,
                fileSize: file.size,
                mimeType: file.mimetype,
                financialYear: '2024-25',
                ocrStatus: 'pending',
                version: 1, // Start at version 1
            });

            // Create initial version
            await DocumentVersion.create({
                documentId: document.id,
                versionNumber: 1,
                filename: file.originalname,
                localPath: filePath,
                mimeType: file.mimetype,
                sizeBytes: file.size,
                uploadedBy: userId,
                // checksum: ... // Calculate sha256 later if needed
            });

            // Trigger OCR processing (async)
            this.processOCR(document.id).catch(err => {
                enterpriseLogger.error('OCR processing failed', {
                    documentId: document.id,
                    error: err.message,
                });
            });

            return document;
        } catch (error) {
            enterpriseLogger.error('Document upload failed', {
                userId,
                error: error.message,
            });
            throw error;
        }
    }

    /**
     * Process OCR for document
     * (Mock implementation - replace with real OCR service)
     */
    async processOCR(documentId) {
        try {
            const document = await Document.findByPk(documentId);
            if (!document) return;

            // Update status to processing
            await document.update({ ocrStatus: 'processing' });

            // Mock OCR extraction (replace with Tesseract.js or Google Vision API)
            await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate processing

            const mockOCRData = {
                employerName: 'ABC Corporation Ltd',
                employerTAN: 'ABCD12345E',
                grossSalary: 1200000,
                hra: 240000,
                standardDeduction: 50000,
                tds: 150000,
                pan: document.userId, // Would extract from document
                assessmentYear: '2025-26',
            };

            // Update document with OCR data
            await document.update({
                ocrData: mockOCRData,
                ocrStatus: 'completed',
            });

            enterpriseLogger.info('OCR processing completed', {
                documentId,
                extractedFields: Object.keys(mockOCRData).length,
            });

            return mockOCRData;
        } catch (error) {
            await Document.update(
                { ocrStatus: 'failed' },
                { where: { id: documentId } }
            );
            throw error;
        }
    }

    /**
     * Get user documents
     */
    async getUserDocuments(userId, filters = {}) {
        const where = { userId };

        if (filters.financialYear) {
            where.financialYear = filters.financialYear;
        }

        if (filters.documentType) {
            where.documentType = filters.documentType;
        }

        return Document.findAll({
            where,
            order: [['createdAt', 'DESC']],
        });
    }

    /**
     * Get document by ID
     */
    async getDocumentById(documentId, userId) {
        return Document.findOne({
            where: { id: documentId, userId },
        });
    }

    /**
     * Delete document
     */
    async deleteDocument(documentId, userId) {
        const document = await this.getDocumentById(documentId, userId);

        if (!document) {
            throw new Error('Document not found');
        }

        // Delete file from storage
        try {
            await fs.unlink(document.filePath);
        } catch (err) {
            enterpriseLogger.warn('Failed to delete file from storage', {
                filePath: document.filePath,
                error: err.message,
            });
        }

        // Delete database record
        await document.destroy();

        return true;
    }

    /**
     * Create a new version of a document
     */
    async createNewVersion(documentId, userId, file) {
        try {
            const document = await Document.findByPk(documentId);
            if (!document) throw new Error('Document not found');

            // Save new file
            const uploadDir = path.join(__dirname, '../../uploads/documents', userId);
            const fileName = `${Date.now()}-v${(document.version || 1) + 1}-${file.originalname}`;
            const filePath = path.join(uploadDir, fileName);
            await fs.writeFile(filePath, file.buffer);

            // Create version record
            const nextVersion = (document.version || 1) + 1;
            await DocumentVersion.create({
                documentId: document.id,
                versionNumber: nextVersion,
                filename: file.originalname,
                localPath: filePath,
                mimeType: file.mimetype,
                sizeBytes: file.size,
                uploadedBy: userId,
            });

            // Update main document pointer
            await document.update({
                version: nextVersion,
                filePath: filePath, // Point to latest
                fileName: file.originalname,
                fileSize: file.size
            });

            return document;
        } catch (error) {
            enterpriseLogger.error('Create version failed', { documentId, error: error.message });
            throw error;
        }
    }

    /**
     * Add metadata to document
     */
    async addMetadata(documentId, key, value, numericValue = null) {
        try {
            await DocumentMetadata.create({
                documentId,
                key,
                value,
                numericValue
            });
        } catch (error) {
            enterpriseLogger.error('Add metadata failed', { documentId, key, error: error.message });
            // Non-blocking
        }
    }
}

module.exports = new DocumentService();
