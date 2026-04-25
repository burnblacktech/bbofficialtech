/**
 * Document Routes — Filing-free document parsing for Finance Tracker
 * POST /parse — Parse document without filing context
 */

const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const ImportEngineService = require('../services/import/ImportEngineService');

const router = express.Router();

// Parse document without filing context
router.post('/parse', authenticateToken, async (req, res, next) => {
  try {
    const { documentType, fileContent, fileName, password } = req.body;
    if (!documentType || !fileContent) {
      return res.status(400).json({ success: false, error: 'documentType and fileContent (base64) are required' });
    }
    if (!['form16', 'form16a', 'form16b', 'form16c', '26as', 'ais'].includes(documentType)) {
      return res.status(400).json({ success: false, error: 'documentType must be form16, form16a, form16b, form16c, 26as, or ais' });
    }

    const result = await ImportEngineService.parseDocumentOnly(req.user.userId, { documentType, fileContent, fileName, password });
    res.json({ success: true, data: result });
  } catch (error) { next(error); }
});

module.exports = router;
