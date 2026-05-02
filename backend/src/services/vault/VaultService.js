/**
 * VaultService — Document storage with Cloudflare R2 (S3-compatible) + PostgreSQL metadata.
 *
 * Storage: R2 (production) or local filesystem (dev without R2 credentials).
 * Downloads: Pre-signed URLs with 15-minute expiry.
 */

const crypto = require('crypto');
const path = require('path');
const { VaultDocument } = require('../../models');
const { AppError } = require('../../middleware/errorHandler');
const ErrorCodes = require('../../constants/ErrorCodes');
const enterpriseLogger = require('../../utils/logger');

const ALLOWED_MIMES = ['application/pdf', 'image/jpeg', 'image/png', 'image/heic'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const CATEGORIES = ['salary', 'investments', 'insurance', 'rent', 'donations', 'medical', 'capital_gains', 'business', 'other'];
const SIGNED_URL_EXPIRY = 900; // 15 minutes

// ── R2/S3 Client (lazy-initialized) ──
let _s3Client = null;
function getS3() {
  if (_s3Client) return _s3Client;
  const endpoint = process.env.R2_ENDPOINT; // e.g. https://<account_id>.r2.cloudflarestorage.com
  if (!endpoint) return null; // Fall back to local storage
  const { S3Client } = require('@aws-sdk/client-s3');
  _s3Client = new S3Client({
    region: 'auto',
    endpoint,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  });
  return _s3Client;
}

function getBucket() {
  return process.env.R2_BUCKET || 'burnblack-vault';
}

class VaultService {

  static async uploadDocument(userId, file, { category, fy, expiryDate, memberId }) {
    if (!file || !file.buffer) throw new AppError('File is required', 400);
    if (!CATEGORIES.includes(category)) throw new AppError(ErrorCodes.VAULT_INVALID_FORMAT, `Invalid category. Must be one of: ${CATEGORIES.join(', ')}`, 422);
    if (!fy || !/^\d{4}-\d{2}$/.test(fy)) throw new AppError('Valid financial year is required (e.g. 2024-25)', 400);

    const mimeType = file.mimetype || file.mimeType || 'application/octet-stream';
    if (!ALLOWED_MIMES.includes(mimeType)) {
      throw new AppError(ErrorCodes.VAULT_INVALID_FORMAT, `Unsupported format: ${mimeType}. Accepted: PDF, JPEG, PNG, HEIC.`, 422);
    }
    if (file.buffer.length > MAX_FILE_SIZE) {
      throw new AppError(ErrorCodes.VAULT_FILE_TOO_LARGE, `File size ${(file.buffer.length / 1024 / 1024).toFixed(1)}MB exceeds 10MB limit.`, 413);
    }

    const ext = mimeType.split('/')[1] === 'jpeg' ? 'jpg' : mimeType.split('/')[1] || 'bin';
    const s3Key = `vault/${userId}/${fy}/${category}/${crypto.randomUUID()}.${ext}`;

    await this._upload(s3Key, file.buffer, mimeType);

    const isImage = ['image/jpeg', 'image/png', 'image/heic'].includes(mimeType);
    const doc = await VaultDocument.create({
      userId, memberId: memberId || null, s3Key,
      fileName: file.originalname || file.name || 'document',
      fileSize: file.buffer.length, mimeType, category,
      financialYear: fy, expiryDate: expiryDate || null,
      ocrStatus: isImage ? 'pending' : 'not_applicable',
    });

    if (expiryDate) this._scheduleExpiryReminder(userId, doc.id, doc.fileName, category, expiryDate).catch(() => {});
    enterpriseLogger.info('Vault document uploaded', { userId, docId: doc.id, category, fy, storage: getS3() ? 'r2' : 'local' });
    return doc;
  }

  /**
   * Get a pre-signed download URL (R2) or stream the file (local).
   * Returns { url, expiresIn } for R2, or { buffer, mimeType, fileName } for local.
   */
  static async getDownloadUrl(docId, userId) {
    const doc = await VaultDocument.findOne({ where: { id: docId, userId } });
    if (!doc) throw new AppError(ErrorCodes.VAULT_DOC_NOT_FOUND, 'Document not found', 404);

    const s3 = getS3();
    if (s3) {
      const { GetObjectCommand } = require('@aws-sdk/client-s3');
      const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
      const url = await getSignedUrl(s3, new GetObjectCommand({
        Bucket: getBucket(), Key: doc.s3Key,
        ResponseContentDisposition: `attachment; filename="${doc.fileName}"`,
        ResponseContentType: doc.mimeType,
      }), { expiresIn: SIGNED_URL_EXPIRY });
      return { url, expiresIn: SIGNED_URL_EXPIRY };
    }

    // Local fallback — return buffer for the route to stream
    const buffer = await this._getLocal(doc.s3Key);
    return { buffer, mimeType: doc.mimeType, fileName: doc.fileName };
  }

  static async listDocuments(userId, { fy, category, memberId } = {}) {
    const where = { userId };
    if (fy) where.financialYear = fy;
    if (category) where.category = category;
    if (memberId) where.memberId = memberId;
    return VaultDocument.findAll({
      where, order: [['createdAt', 'DESC']],
      attributes: ['id', 'fileName', 'fileSize', 'mimeType', 'category', 'financialYear', 'expiryDate', 'ocrStatus', 'usedInFilings', 'createdAt'],
    });
  }

  static async getDocumentSummary(userId) {
    const docs = await VaultDocument.findAll({ where: { userId }, attributes: ['financialYear', 'category', 'fileSize'] });
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

  static async importToFiling(docId, filingId, userId) {
    const doc = await VaultDocument.findOne({ where: { id: docId, userId } });
    if (!doc) throw new AppError(ErrorCodes.VAULT_DOC_NOT_FOUND, 'Document not found', 404);

    const alreadyImported = (doc.usedInFilings || []).some(u => u.filingId === filingId);
    if (alreadyImported) throw new AppError(ErrorCodes.VAULT_DUPLICATE_IMPORT, 'Already imported into this filing.', 409);

    const buffer = await this._get(doc.s3Key);
    let result = { extractedData: null, conflicts: [] };

    if (doc.category === 'salary' && doc.mimeType === 'application/pdf') {
      try {
        const ImportEngineService = require('../import/ImportEngineService');
        result = await ImportEngineService.parseDocument(filingId, userId, {
          documentType: 'form16', fileContent: buffer.toString('base64'), fileName: doc.fileName,
        });
      } catch (err) {
        enterpriseLogger.warn('Vault import parse failed', { docId, error: err.message });
        result = { extractedData: null, conflicts: [], error: err.message };
      }
    }

    const { ITRFiling } = require('../../models');
    const filing = await ITRFiling.findByPk(filingId);
    doc.usedInFilings = [...(doc.usedInFilings || []), { filingId, assessmentYear: filing?.assessmentYear, importedAt: new Date().toISOString() }];
    await doc.save();
    return result;
  }

  static async setExpiry(docId, userId, expiryDate) {
    const doc = await VaultDocument.findOne({ where: { id: docId, userId } });
    if (!doc) throw new AppError(ErrorCodes.VAULT_DOC_NOT_FOUND, 'Document not found', 404);
    doc.expiryDate = expiryDate;
    await doc.save();
    if (expiryDate) await this._scheduleExpiryReminder(userId, doc.id, doc.fileName, doc.category, expiryDate);
    return doc;
  }

  static async deleteDocument(docId, userId) {
    const doc = await VaultDocument.findOne({ where: { id: docId, userId } });
    if (!doc) throw new AppError(ErrorCodes.VAULT_DOC_NOT_FOUND, 'Document not found', 404);
    try { await this._delete(doc.s3Key); } catch { /* orphan cleanup handles this */ }
    await doc.destroy();
    return true;
  }

  static async getMatchingDocuments(userId, assessmentYear) {
    const ayYear = parseInt(assessmentYear);
    const fy = `${ayYear - 1}-${String(ayYear).slice(2)}`;
    return VaultDocument.findAll({
      where: { userId, financialYear: fy },
      order: [['category', 'ASC'], ['createdAt', 'DESC']],
      attributes: ['id', 'fileName', 'fileSize', 'mimeType', 'category', 'financialYear', 'usedInFilings', 'createdAt'],
    });
  }

  /**
   * Get a pre-signed URL or buffer for a raw S3 key (no DB lookup).
   */
  static async getDownloadUrlForKey(s3Key, mimeType, fileName) {
    const s3 = getS3();
    if (s3) {
      const { GetObjectCommand } = require('@aws-sdk/client-s3');
      const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
      const url = await getSignedUrl(s3, new GetObjectCommand({
        Bucket: getBucket(), Key: s3Key,
        ResponseContentDisposition: `attachment; filename="${fileName || 'document'}"`,
        ResponseContentType: mimeType || 'application/octet-stream',
      }), { expiresIn: SIGNED_URL_EXPIRY });
      return { url };
    }
    const buffer = await this._getLocal(s3Key);
    return { buffer, mimeType, fileName };
  }

  // ── Storage layer: R2 (production) / local filesystem (dev) ──

  static async _upload(key, buffer, contentType) {
    const s3 = getS3();
    if (s3) {
      const { PutObjectCommand } = require('@aws-sdk/client-s3');
      await s3.send(new PutObjectCommand({ Bucket: getBucket(), Key: key, Body: buffer, ContentType: contentType }));
    } else {
      await this._uploadLocal(key, buffer);
    }
  }

  static async _get(key) {
    const s3 = getS3();
    if (s3) {
      const { GetObjectCommand } = require('@aws-sdk/client-s3');
      const res = await s3.send(new GetObjectCommand({ Bucket: getBucket(), Key: key }));
      return Buffer.from(await res.Body.transformToByteArray());
    }
    return this._getLocal(key);
  }

  static async _delete(key) {
    const s3 = getS3();
    if (s3) {
      const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
      await s3.send(new DeleteObjectCommand({ Bucket: getBucket(), Key: key }));
    } else {
      this._deleteLocal(key);
    }
  }

  // ── Local filesystem fallback (dev only) ──

  static async _uploadLocal(key, buffer) {
    const fs = require('fs');
    const dir = path.resolve(process.cwd(), 'uploads', path.dirname(key));
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.resolve(process.cwd(), 'uploads', key), buffer);
  }

  static async _getLocal(key) {
    const fs = require('fs');
    const filePath = path.resolve(process.cwd(), 'uploads', key);
    if (!fs.existsSync(filePath)) throw new Error('File not found in storage');
    return fs.readFileSync(filePath);
  }

  static _deleteLocal(key) {
    const fs = require('fs');
    const filePath = path.resolve(process.cwd(), 'uploads', key);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }

  static async _scheduleExpiryReminder(userId, docId, fileName, category, expiryDate) {
    try {
      const NotificationService = require('../integration/NotificationService');
      const reminderDate = new Date(new Date(expiryDate).getTime() - 30 * 86400000);
      if (reminderDate > new Date()) {
        await NotificationService.schedule(userId, 'vault_expiry_reminder', { documentName: fileName, category, expiryDate }, reminderDate);
      }
    } catch { /* silent */ }
  }
}

module.exports = VaultService;
