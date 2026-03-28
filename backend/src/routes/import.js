/**
 * Document Import Routes
 * POST /:filingId/import — Parse document (no save)
 * PUT /:filingId/import/confirm — Confirm and merge
 * DELETE /:filingId/import/:importId — Undo import
 * GET /:filingId/import/history — Import history
 */

const express = require('express');
const rateLimit = require('express-rate-limit');

const { authenticateToken } = require('../middleware/auth');
const ImportEngineService = require('../services/import/ImportEngineService');

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
    const { documentType, fileContent, fileName } = req.body;
    if (!documentType || !fileContent) {
      return res.status(400).json({ success: false, error: 'documentType and fileContent (base64) are required' });
    }
    if (!['form16', 'form16a', 'form16b', 'form16c', '26as', 'ais'].includes(documentType)) {
      return res.status(400).json({ success: false, error: 'documentType must be form16, form16a, form16b, form16c, 26as, or ais' });
    }

    const result = await ImportEngineService.parseDocument(req.params.filingId, req.user.userId, { documentType, fileContent, fileName });
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

module.exports = router;
