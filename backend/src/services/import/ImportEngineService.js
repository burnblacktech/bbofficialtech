/**
 * ImportEngineService — Orchestrates document import:
 * validate → parse → map → detect conflicts → (user reviews) → confirm → merge + audit
 */

const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const { ITRFiling } = require('../../models');
const { sequelize } = require('../../config/database');
const AuditService = require('../core/AuditService');
const FilingSnapshotService = require('../itr/FilingSnapshotService');
const Form16Parser = require('./parsers/Form16Parser');
const Form16AParser = require('./parsers/Form16AParser');
const Form16BParser = require('./parsers/Form16BParser');
const Form16CParser = require('./parsers/Form16CParser');
const TwentySixASParser = require('./parsers/TwentySixASParser');
const AISParser = require('./parsers/AISParser');
const DataMapper = require('./DataMapper');
const ConflictResolver = require('./ConflictResolver');
const { AppError } = require('../../middleware/errorHandler');
const ErrorCodes = require('../../constants/ErrorCodes');
const enterpriseLogger = require('../../utils/logger');

const SIZE_LIMITS = { form16: 10 * 1024 * 1024, form16a: 10 * 1024 * 1024, form16b: 10 * 1024 * 1024, form16c: 10 * 1024 * 1024, '26as': 5 * 1024 * 1024, ais: 10 * 1024 * 1024 };
const MIME_MAP = { form16: 'application/pdf', form16a: 'application/pdf', form16b: 'application/pdf', form16c: 'application/pdf', '26as': 'application/json', ais: 'application/json' };

class ImportEngineService {

  /**
   * Parse document — extract data + detect conflicts (NO save)
   */
  static async parseDocument(filingId, userId, { documentType, fileContent, fileName }) {
    // 1. Load filing
    const filing = await ITRFiling.findByPk(filingId);
    if (!filing) throw new AppError('Filing not found', 404, ErrorCodes.RESOURCE_NOT_FOUND);
    if (filing.createdBy !== userId) throw new AppError('Not authorized', 403, ErrorCodes.IMPORT_ACCESS_DENIED);
    if (filing.lifecycleState !== 'draft') throw new AppError('Only draft filings accept imports', 409, ErrorCodes.IMPORT_FILING_NOT_DRAFT);

    // 2. Decode base64
    let buffer;
    try { buffer = Buffer.from(fileContent, 'base64'); }
    catch { throw new AppError('Invalid file content', 400, ErrorCodes.IMPORT_PARSE_FAILED); }

    // 3. Validate size
    const limit = SIZE_LIMITS[documentType];
    if (!limit) throw new AppError(`Unknown document type: ${documentType}`, 400, ErrorCodes.IMPORT_INVALID_FILE_TYPE);
    if (buffer.length > limit) throw new AppError(`File exceeds ${Math.round(limit / 1024 / 1024)}MB limit`, 413, ErrorCodes.IMPORT_FILE_TOO_LARGE);

    // 4. Parse
    let parsed;
    if (documentType === 'form16') {
      parsed = await Form16Parser.parse(buffer);
      // Validate AY
      if (parsed.partA.assessmentYear && parsed.partA.assessmentYear !== filing.assessmentYear) {
        throw new AppError(`Form 16 is for AY ${parsed.partA.assessmentYear} but filing is for AY ${filing.assessmentYear}`, 409, ErrorCodes.IMPORT_AY_MISMATCH);
      }
    } else if (documentType === '26as') {
      const json = JSON.parse(buffer.toString('utf8'));
      parsed = TwentySixASParser.parse(json);
      if (parsed.pan && parsed.pan !== filing.taxpayerPan) {
        throw new AppError(`PAN mismatch: document has ${parsed.pan}, filing has ${filing.taxpayerPan}`, 409, ErrorCodes.IMPORT_PAN_MISMATCH);
      }
    } else if (documentType === 'ais') {
      const json = JSON.parse(buffer.toString('utf8'));
      parsed = AISParser.parse(json);
      if (parsed.pan && parsed.pan !== filing.taxpayerPan) {
        throw new AppError(`PAN mismatch: document has ${parsed.pan}, filing has ${filing.taxpayerPan}`, 409, ErrorCodes.IMPORT_PAN_MISMATCH);
      }
    } else if (documentType === 'form16a') {
      parsed = await Form16AParser.parse(buffer);
    } else if (documentType === 'form16b') {
      parsed = await Form16BParser.parse(buffer);
    } else if (documentType === 'form16c') {
      parsed = await Form16CParser.parse(buffer);
    }

    // 5. Map to jsonPayload paths
    const existingPayload = filing.jsonPayload || {};
    let mappedData;
    if (documentType === 'form16') mappedData = DataMapper.mapForm16(parsed);
    else if (documentType === '26as') mappedData = DataMapper.map26AS(parsed, existingPayload);
    else if (documentType === 'form16a') mappedData = DataMapper.mapForm16A(parsed);
    else if (documentType === 'form16b') mappedData = DataMapper.mapForm16B(parsed);
    else if (documentType === 'form16c') mappedData = DataMapper.mapForm16C(parsed);
    else mappedData = DataMapper.mapAIS(parsed);

    // 6. Detect conflicts
    const conflicts = ConflictResolver.detectConflicts(existingPayload, mappedData, existingPayload._importMeta);
    conflicts.forEach(c => { c.newSource = documentType; });

    // 7. Check re-import
    const prevImports = (existingPayload._importMeta?.imports || []).filter(i => i.documentType === documentType && i.status === 'confirmed');
    const requiresConfirmation = prevImports.length > 0;

    enterpriseLogger.info('Document parsed', { filingId, documentType, fieldsExtracted: Object.keys(mappedData).length, conflicts: conflicts.length });

    return {
      extractedData: mappedData,
      conflicts,
      fieldMapping: this.buildFieldMapping(mappedData),
      documentMeta: { documentType, assessmentYear: filing.assessmentYear, pan: filing.taxpayerPan, extractedFieldCount: Object.keys(mappedData).length },
      requiresConfirmation,
      warnings: parsed.warnings || [],
    };
  }

  /**
   * Confirm import — snapshot + merge + audit
   */
  static async confirmImport(filingId, userId, { resolvedData, documentType, fileName, fileContent }) {
    const transaction = await sequelize.transaction();
    try {
      const filing = await ITRFiling.findByPk(filingId, { transaction });
      if (!filing) throw new AppError('Filing not found', 404);
      if (filing.createdBy !== userId) throw new AppError('Not authorized', 403);

      // Create pre-import snapshot
      let snapshotId = null;
      try {
        const snapshot = await FilingSnapshotService.createSnapshot(filingId, userId, 'pre_import', transaction);
        snapshotId = snapshot?.id || null;
      } catch { /* snapshot service may not be available */ }

      // Merge
      const importId = uuidv4();
      const importMeta = {
        importId, documentType, fileName: fileName || `${documentType}_import`,
        importedAt: new Date().toISOString(), importedBy: userId,
        fieldsPopulated: Object.keys(resolvedData),
        preImportSnapshotId: snapshotId,
        fileContentHash: fileContent ? crypto.createHash('sha256').update(fileContent.slice(0, 1000)).digest('hex') : null,
        status: 'confirmed',
      };

      // Store original file (base64) if provided
      if (fileContent) {
        importMeta.originalFile = {
          content: fileContent.length > 5 * 1024 * 1024 ? null : fileContent, // Skip if > 5MB
          mimeType: MIME_MAP[documentType] || 'application/octet-stream',
          sizeBytes: Buffer.from(fileContent, 'base64').length,
          fileName: fileName || `${documentType}_import`,
        };
      }

      const { mergedPayload, fieldsUpdated } = DataMapper.mergeIntoPayload(filing.jsonPayload || {}, resolvedData, importMeta);
      filing.jsonPayload = mergedPayload;
      await filing.save({ transaction });

      // Audit
      try {
        await AuditService.logEvent({
          entityType: 'ITRFiling', entityId: filingId, action: 'DOCUMENT_IMPORT',
          actorId: userId, metadata: { documentType, importId, fieldCount: fieldsUpdated.length },
        }, transaction);
      } catch { /* audit is best-effort */ }

      await transaction.commit();
      enterpriseLogger.info('Import confirmed', { filingId, importId, documentType, fieldsUpdated: fieldsUpdated.length });

      return { updatedPayload: mergedPayload, importId, fieldsUpdated };
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  /**
   * Undo a confirmed import
   */
  static async undoImport(filingId, userId, importId) {
    const filing = await ITRFiling.findByPk(filingId);
    if (!filing) throw new AppError('Filing not found', 404);
    if (filing.createdBy !== userId) throw new AppError('Not authorized', 403);

    const meta = filing.jsonPayload?._importMeta;
    const importRecord = meta?.imports?.find(i => i.importId === importId);
    if (!importRecord) throw new AppError('Import not found', 404, ErrorCodes.IMPORT_NOT_FOUND);
    if (importRecord.status === 'undone') throw new AppError('Import already undone', 409);

    // Restore from snapshot if available
    if (importRecord.preImportSnapshotId) {
      try {
        const snapshot = await FilingSnapshotService.getSnapshot(importRecord.preImportSnapshotId);
        if (snapshot?.jsonPayload) {
          filing.jsonPayload = snapshot.jsonPayload;
          // Mark import as undone in the restored payload
          if (!filing.jsonPayload._importMeta) filing.jsonPayload._importMeta = meta;
          const rec = filing.jsonPayload._importMeta.imports.find(i => i.importId === importId);
          if (rec) rec.status = 'undone';
          await filing.save();
          return { restoredPayload: filing.jsonPayload };
        }
      } catch { /* fallback to field-level undo */ }
    }

    // Field-level undo: remove fields populated by this import
    const payload = { ...filing.jsonPayload };
    for (const field of importRecord.fieldsPopulated || []) {
      delete payload._importMeta?.fieldSources?.[field];
    }
    importRecord.status = 'undone';
    filing.jsonPayload = payload;
    await filing.save();

    return { restoredPayload: payload };
  }

  /**
   * Get import history for a filing
   */
  static async getImportHistory(filingId, userId) {
    const filing = await ITRFiling.findByPk(filingId);
    if (!filing) throw new AppError('Filing not found', 404);
    if (filing.createdBy !== userId) throw new AppError('Not authorized', 403);

    const imports = filing.jsonPayload?._importMeta?.imports || [];
    return imports.map(i => ({
      importId: i.importId, documentType: i.documentType, fileName: i.fileName,
      importedAt: i.importedAt, fieldCount: i.fieldsPopulated?.length || 0, status: i.status,
    }));
  }

  /** Build human-readable field mapping */
  static buildFieldMapping(mappedData) {
    const mapping = {};
    for (const path of Object.keys(mappedData)) {
      mapping[path] = { section: this.getSectionForPath(path), label: ConflictResolver.getFieldLabel(path) };
    }
    return mapping;
  }

  static getSectionForPath(path) {
    if (path.includes('salary')) return 'Salary';
    if (path.includes('houseProperty')) return 'House Property';
    if (path.includes('otherSources')) return 'Other Income';
    if (path.includes('capitalGains')) return 'Capital Gains';
    if (path.startsWith('deductions')) return 'Deductions';
    if (path.startsWith('taxes')) return 'Taxes Paid';
    return 'Other';
  }
}

module.exports = ImportEngineService;
