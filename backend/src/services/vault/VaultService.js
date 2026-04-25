/**
 * VaultService — Year-round document storage with S3 + PostgreSQL metadata.
 *
 * Upload → S3, metadata → DB. Import to filing via existing ImportEngineService.
 * OCR for receipt images (future: Textract/Tesseract).
 * Expiry reminders via NotificationService.
 */

const crypto = require('crypto');
const { VaultDocument } = require('../../models');
const { AppError } = require('../../middleware/errorHandler');
const ErrorCodes = require('../../constants/ErrorCodes');
const enterpriseLogger = require('../../utils/logger');

const ALLOWED_MIMES = ['application/pdf', 'image/jpeg', 'image/png', 'image/heic'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const CATEGORIES = ['salary', 'investments', 'insurance', 'rent', 'donations', 'medical', 'capital_gains', 'business', 'other'];

class VaultService {

  /**
   * Upload document — validate, store (local for MVP, S3 for prod), create DB record.
   */
  static async uploadDocument(userId, file, { category, fy, expiryDate, memberId }) {
    // Validate
    if (!file || !file.buffer) throw new AppError('File is required', 400);
    if (!CATEGORIES.includes(category)) throw new AppError(ErrorCodes.VAULT_INVALID_FORMAT, `Invalid category. Must be one of: ${CATEGORIES.join(', ')}`, 422);
    if (!fy) throw new AppError('Financial year is required', 400);

    const mimeType = file.mimetype || file.mimeType || 'application/octet-stream';
    if (!ALLOWED_MIMES.includes(mimeType)) {
      throw new AppError(ErrorCodes.VAULT_INVALID_FORMAT, `Unsupported file format: ${mimeType}. Accepted: PDF, JPEG, PNG, HEIC.`, 422);
    }
    if (file.buffer.length > MAX_FILE_SIZE) {
      throw new AppError(ErrorCodes.VAULT_FILE_TOO_LARGE, `File size ${(file.buffer.length / 1024 / 1024).toFixed(1)}MB exceeds the 10MB limit.`, 413);
    }

    // Generate S3 key
    const ext = mimeType.split('/')[1] === 'jpeg' ? 'jpg' : mimeType.split('/')[1] || 'bin';
    const s3Key = `vault/${userId}/${fy}/${category}/${crypto.randomUUID()}.${ext}`;

    // Upload to S3 (or local storage for MVP)
    try {
      await this._uploadToStorage(s3Key, file.buffer, mimeType);
    } catch (err) {
      throw new AppError('File upload failed. Please try again.', 503);
    }

    // Determine OCR status
    const isImage = ['image/jpeg', 'image/png', 'image/heic'].includes(mimeType);
    const ocrStatus = isImage ? 'pending' : 'not_applicable';

    // Create DB record
    const doc = await VaultDocument.create({
      userId,
      memberId: memberId || null,
      s3Key,
      fileName: file.originalname || file.name || 'document',
      fileSize: file.buffer.length,
      mimeType,
      category,
      financialYear: fy,
      expiryDate: expiryDate || null,
      ocrStatus,
    });

    // Schedule expiry reminder if date set
    if (expiryDate) {
      this._scheduleExpiryReminder(userId, doc.id, doc.fileName, category, expiryDate).catch(() => {});
    }

    enterpriseLogger.info('Vault document uploaded', { userId, docId: doc.id, category, fy });
    return doc;
  }

  /**
   * List documents with optional filtering.
   */
  static async listDocuments(userId, { fy, category, memberId } = {}) {
    const where = { userId };
    if (fy) where.financialYear = fy;
    if (category) where.category = category;
    if (memberId) where.memberId = memberId;

    return VaultDocument.findAll({
      where,
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'fileName', 'fileSize', 'mimeType', 'category', 'financialYear', 'expiryDate', 'ocrStatus', 'usedInFilings', 'createdAt'],
    });
  }

  /**
   * Get document summary — counts by FY and category.
   */
  static async getDocumentSummary(userId) {
    const docs = await VaultDocument.findAll({
      where: { userId },
      attributes: ['financialYear', 'category', 'fileSize'],
    });

    const byFY = {};
    let totalSize = 0;
    for (const doc of docs) {
      const fy = doc.financialYear;
      if (!byFY[fy]) byFY[fy] = {};
      byFY[fy][doc.category] = (byFY[fy][doc.category] || 0) + 1;
      totalSize += doc.fileSize;
    }

    return { byFY, totalDocuments: docs.length, totalSizeBytes: totalSize };
  }

  /**
   * Import a vault document into a filing.
   */
  static async importToFiling(docId, filingId, userId) {
    const doc = await VaultDocument.findOne({ where: { id: docId, userId } });
    if (!doc) throw new AppError(ErrorCodes.VAULT_DOC_NOT_FOUND, 'Document not found', 404);

    // Check duplicate import
    const alreadyImported = (doc.usedInFilings || []).some(u => u.filingId === filingId);
    if (alreadyImported) {
      throw new AppError(ErrorCodes.VAULT_DUPLICATE_IMPORT, 'This document has already been imported into this filing.', 409);
    }

    // Get file from storage
    const buffer = await this._getFromStorage(doc.s3Key);

    // Determine document type for ImportEngineService
    const typeMap = {
      salary: 'form16',
      investments: null,
      insurance: null,
      rent: null,
      donations: null,
      medical: null,
      capital_gains: null,
      business: null,
      other: null,
    };
    // For PDF salary docs, use form16 parser. For others, return raw data.
    const importType = typeMap[doc.category];

    let result = { extractedData: null, conflicts: [] };

    if (importType && doc.mimeType === 'application/pdf') {
      // Use existing ImportEngineService
      try {
        const ImportEngineService = require('../import/ImportEngineService');
        result = await ImportEngineService.parseDocument(filingId, userId, {
          documentType: importType,
          fileContent: buffer.toString('base64'),
          fileName: doc.fileName,
        });
      } catch (err) {
        // Parse failed — still mark as imported but with no extracted data
        enterpriseLogger.warn('Vault import parse failed', { docId, error: err.message });
        result = { extractedData: null, conflicts: [], error: err.message };
      }
    }

    // Mark document as used in this filing
    const { ITRFiling } = require('../../models');
    const filing = await ITRFiling.findByPk(filingId);
    doc.usedInFilings = [
      ...(doc.usedInFilings || []),
      { filingId, assessmentYear: filing?.assessmentYear, importedAt: new Date().toISOString() },
    ];
    await doc.save();

    return result;
  }

  /**
   * Set/update expiry date and schedule reminder.
   */
  static async setExpiry(docId, userId, expiryDate) {
    const doc = await VaultDocument.findOne({ where: { id: docId, userId } });
    if (!doc) throw new AppError(ErrorCodes.VAULT_DOC_NOT_FOUND, 'Document not found', 404);

    doc.expiryDate = expiryDate;
    await doc.save();

    if (expiryDate) {
      await this._scheduleExpiryReminder(userId, doc.id, doc.fileName, doc.category, expiryDate);
    }

    return doc;
  }

  /**
   * Delete document (storage + DB).
   */
  static async deleteDocument(docId, userId) {
    const doc = await VaultDocument.findOne({ where: { id: docId, userId } });
    if (!doc) throw new AppError(ErrorCodes.VAULT_DOC_NOT_FOUND, 'Document not found', 404);

    try { await this._deleteFromStorage(doc.s3Key); } catch { /* silent — orphan cleanup job handles this */ }
    await doc.destroy();
    return true;
  }

  /**
   * Get matching documents for a filing's financial year.
   * AY 2025-26 → FY 2024-25
   */
  static async getMatchingDocuments(userId, assessmentYear) {
    // Convert AY to FY: AY 2025-26 → FY 2024-25
    const ayYear = parseInt(assessmentYear);
    const fy = `${ayYear - 1}-${String(ayYear).slice(2)}`;

    return VaultDocument.findAll({
      where: { userId, financialYear: fy },
      order: [['category', 'ASC'], ['createdAt', 'DESC']],
      attributes: ['id', 'fileName', 'fileSize', 'mimeType', 'category', 'financialYear', 'usedInFilings', 'createdAt'],
    });
  }

  // ── Storage helpers (MVP: local filesystem, prod: S3) ──

  static async _uploadToStorage(key, buffer, mimeType) {
    // MVP: store in memory/local. Production: use AWS S3.
    const fs = require('fs');
    const path = require('path');
    const dir = path.resolve(process.cwd(), 'uploads', path.dirname(key));
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.resolve(process.cwd(), 'uploads', key), buffer);
  }

  static async _getFromStorage(key) {
    const fs = require('fs');
    const path = require('path');
    const filePath = path.resolve(process.cwd(), 'uploads', key);
    if (!fs.existsSync(filePath)) throw new Error('File not found in storage');
    return fs.readFileSync(filePath);
  }

  static async _deleteFromStorage(key) {
    const fs = require('fs');
    const path = require('path');
    const filePath = path.resolve(process.cwd(), 'uploads', key);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }

  static async _scheduleExpiryReminder(userId, docId, fileName, category, expiryDate) {
    try {
      const NotificationService = require('../integration/NotificationService');
      const reminderDate = new Date(new Date(expiryDate).getTime() - 30 * 86400000); // 30 days before
      if (reminderDate > new Date()) {
        await NotificationService.schedule(userId, 'vault_expiry_reminder', {
          documentName: fileName, category, expiryDate,
        }, reminderDate);
      }
    } catch { /* silent */ }
  }
}

module.exports = VaultService;
