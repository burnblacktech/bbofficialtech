/**
 * Document Import Routes
 * POST /:filingId/import — Parse document (no save)
 * PUT /:filingId/import/confirm — Confirm and merge
 * DELETE /:filingId/import/:importId — Undo import
 * GET /:filingId/import/history — Import history
 * POST /:filingId/import/surepass/auth — Authenticate with ITD portal
 * POST /:filingId/import/surepass/fetch — Fetch 26AS/AIS data
 */

const express = require('express');
const rateLimit = require('express-rate-limit');

const { authenticateToken } = require('../middleware/auth');
const ImportEngineService = require('../services/import/ImportEngineService');
const ReconciliationService = require('../services/import/ReconciliationService');
const SurePassITRClient = require('../services/common/SurePassITRClient');
const SurePass26ASTransformer = require('../services/import/transformers/SurePass26ASTransformer');
const SurePassAISTransformer = require('../services/import/transformers/SurePassAISTransformer');
const DataMapper = require('../services/import/DataMapper');
const ConflictResolver = require('../services/import/ConflictResolver');
const { validatePANMatch, validateAYMatch } = require('../services/import/validators/importValidators');
const { ITRFiling } = require('../models');
const { AppError } = require('../middleware/errorHandler');
const enterpriseLogger = require('../utils/logger');

const router = express.Router();

// Rate limit: 10 imports per filing per hour
const importRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => `import:${req.params.filingId}:${req.user?.userId}`,
  message: { success: false, error: 'Import rate limit exceeded. Max 10 uploads per filing per hour.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Parse document — extract data + conflicts (no save)
router.post('/:filingId/import', authenticateToken, importRateLimit, async (req, res, next) => {
  try {
    const { documentType, fileContent, fileName, password } = req.body;
    if (!documentType || !fileContent) {
      return res.status(400).json({ success: false, error: 'documentType and fileContent (base64) are required' });
    }
    if (!['form16', 'form16a', 'form16b', 'form16c', '26as', 'ais'].includes(documentType)) {
      return res.status(400).json({ success: false, error: 'documentType must be form16, form16a, form16b, form16c, 26as, or ais' });
    }

    const result = await ImportEngineService.parseDocument(req.params.filingId, req.user.userId, { documentType, fileContent, fileName, password });
    res.json({ success: true, data: result });
  } catch (error) { next(error); }
});

// Confirm import — merge into jsonPayload
router.put('/:filingId/import/confirm', authenticateToken, async (req, res, next) => {
  try {
    const { resolvedData, documentType, fileName, fileContent } = req.body;
    if (!resolvedData || !documentType) {
      return res.status(400).json({ success: false, error: 'resolvedData and documentType are required' });
    }

    // Gap fix #1: Verify filing is in draft state before confirming import
    const filing = await ITRFiling.findByPk(req.params.filingId);
    if (!filing) throw new AppError('Filing not found', 404);
    if (filing.createdBy !== req.user.userId) throw new AppError('Not authorized', 403);
    if (filing.lifecycleState !== 'draft') throw new AppError('Only draft filings accept imports', 409, 'IMPORT_FILING_NOT_DRAFT');

    const result = await ImportEngineService.confirmImport(req.params.filingId, req.user.userId, { resolvedData, documentType, fileName, fileContent });
    res.json({ success: true, data: result });
  } catch (error) { next(error); }
});

// Undo import
router.delete('/:filingId/import/:importId', authenticateToken, async (req, res, next) => {
  try {
    const result = await ImportEngineService.undoImport(req.params.filingId, req.user.userId, req.params.importId);
    res.json({ success: true, data: result });
  } catch (error) { next(error); }
});

// Import history
router.get('/:filingId/import/history', authenticateToken, async (req, res, next) => {
  try {
    const history = await ImportEngineService.getImportHistory(req.params.filingId, req.user.userId);
    res.json({ success: true, data: history });
  } catch (error) { next(error); }
});

// TDS Reconciliation — compare 26AS TDS entries against filing income
router.get('/:filingId/reconcile-tds', authenticateToken, async (req, res, next) => {
  try {
    const filing = await ITRFiling.findByPk(req.params.filingId);
    if (!filing) throw new AppError('Filing not found', 404);
    if (filing.createdBy !== req.user.userId) throw new AppError('Not authorized', 403);

    const result = ReconciliationService.reconcile(filing.jsonPayload || {});
    res.json({ success: true, data: result });
  } catch (error) { next(error); }
});

// =====================================================
// SUREPASS ITD PORTAL ROUTES
// =====================================================

// Rate limit: 5 auth attempts per user per hour (separate from import limiter)
const surepassAuthRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  keyGenerator: (req) => `surepass-auth:${req.user?.userId}`,
  message: { success: false, error: 'Too many login attempts. Try again in an hour, or upload the PDF instead.' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Password masking middleware — redact itdPassword/password from logs
 */
function maskPasswordForLogging(req, _res, next) {
  const originalBody = req.body;
  if (originalBody && (originalBody.password || originalBody.itdPassword)) {
    // Attach a sanitized copy for logging; original body is untouched
    req._sanitizedBody = { ...originalBody };
    if (req._sanitizedBody.password) req._sanitizedBody.password = '[REDACTED]';
    if (req._sanitizedBody.itdPassword) req._sanitizedBody.itdPassword = '[REDACTED]';
  }
  next();
}

// Authenticate with ITD portal via SurePass
router.post('/:filingId/import/surepass/auth', authenticateToken, surepassAuthRateLimit, maskPasswordForLogging, async (req, res, next) => {
  try {
    const { pan, itdPassword } = req.body;
    if (!pan || !itdPassword) {
      return res.status(400).json({ success: false, error: 'pan and itdPassword are required' });
    }

    enterpriseLogger.info('SurePass auth request', {
      filingId: req.params.filingId,
      userId: req.user.userId,
      body: req._sanitizedBody || { pan },
    });

    await SurePassITRClient.authenticate(pan, itdPassword, req.user.userId);
    res.json({ success: true, data: { authenticated: true } });
  } catch (error) { next(error); }
});

// Fetch 26AS/AIS data from ITD portal via SurePass
router.post('/:filingId/import/surepass/fetch', authenticateToken, async (req, res, next) => {
  try {
    const { documentType } = req.body;
    if (!documentType || !['26as', 'ais', 'both'].includes(documentType)) {
      return res.status(400).json({ success: false, error: 'documentType must be 26as, ais, or both' });
    }

    const filing = await ITRFiling.findByPk(req.params.filingId);
    if (!filing) throw new AppError('Filing not found', 404);
    if (filing.createdBy !== req.user.userId) throw new AppError('Not authorized', 403);
    if (filing.lifecycleState !== 'draft') throw new AppError('Only draft filings accept imports', 409);

    const session = SurePassITRClient.getSession(req.user.userId);
    if (!session) {
      throw new AppError('Your ITD session has expired. Please re-enter your credentials.', 401, 'ITR_SESSION_EXPIRED');
    }

    const existingPayload = filing.jsonPayload || {};
    const results = { extractedData: {}, conflicts: [], fieldMapping: {}, documentMeta: {}, warnings: [] };

    // Fetch and transform 26AS
    if (documentType === '26as' || documentType === 'both') {
      const raw26AS = await SurePassITRClient.fetch26AS(req.user.userId, filing.assessmentYear);
      const normalized = SurePass26ASTransformer.transform(raw26AS, session.pan);

      // Validate PAN and AY
      validatePANMatch(normalized.pan, filing.taxpayerPan);
      validateAYMatch(normalized.assessmentYear, filing.assessmentYear);

      // Map through existing DataMapper for flat field paths
      const mapped = DataMapper.map26AS(normalized, existingPayload);
      const conflicts = ConflictResolver.detectConflicts(existingPayload, mapped, existingPayload._importMeta);
      conflicts.forEach(c => { c.newSource = '26as'; });

      Object.assign(results.extractedData, mapped);
      results.conflicts.push(...conflicts);
      Object.assign(results.fieldMapping, ImportEngineService.buildFieldMapping(mapped));
      results.documentMeta['26as'] = { assessmentYear: normalized.assessmentYear, entryCount: normalized.summary.entryCount, source: 'SUREPASS_API' };
      results.warnings.push(...(normalized.warnings || []));
    }

    // Fetch and transform AIS
    if (documentType === 'ais' || documentType === 'both') {
      const rawAIS = await SurePassITRClient.fetchAIS(req.user.userId, filing.assessmentYear?.replace('-', '-'));
      const normalized = SurePassAISTransformer.transform(rawAIS, session.pan);

      // Validate PAN
      validatePANMatch(normalized.pan, filing.taxpayerPan);

      // Map through existing DataMapper for flat field paths
      const mapped = DataMapper.mapAIS(normalized);
      const conflicts = ConflictResolver.detectConflicts(existingPayload, mapped, existingPayload._importMeta);
      conflicts.forEach(c => { c.newSource = 'ais'; });

      Object.assign(results.extractedData, mapped);
      results.conflicts.push(...conflicts);
      Object.assign(results.fieldMapping, ImportEngineService.buildFieldMapping(mapped));
      results.documentMeta.ais = { financialYear: normalized.financialYear, entryCount: normalized.summary.entryCount, source: 'SUREPASS_API' };
      results.warnings.push(...(normalized.warnings || []));
    }

    enterpriseLogger.info('SurePass fetch complete', {
      filingId: req.params.filingId,
      documentType,
      fieldsExtracted: Object.keys(results.extractedData).length,
      conflicts: results.conflicts.length,
    });

    res.json({ success: true, data: results });
  } catch (error) { next(error); }
});

module.exports = router;
