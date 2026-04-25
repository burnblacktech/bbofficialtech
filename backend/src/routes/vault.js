/**
 * Vault Routes — Document storage and management
 */

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const VaultService = require('../services/vault/VaultService');
const multer = require('multer');

// Multer for file uploads (memory storage — buffer passed to VaultService)
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.get('/documents', authenticateToken, async (req, res, next) => {
  try {
    const { fy, category, memberId } = req.query;
    const docs = await VaultService.listDocuments(req.user.userId, { fy, category, memberId });
    res.json({ success: true, data: docs });
  } catch (err) { next(err); }
});

router.post('/documents', authenticateToken, upload.single('file'), async (req, res, next) => {
  try {
    const { category, fy, expiryDate, memberId } = req.body;
    const doc = await VaultService.uploadDocument(req.user.userId, req.file, { category, fy, expiryDate, memberId });
    res.status(201).json({ success: true, data: doc });
  } catch (err) { next(err); }
});

router.delete('/documents/:id', authenticateToken, async (req, res, next) => {
  try {
    await VaultService.deleteDocument(req.params.id, req.user.userId);
    res.json({ success: true, message: 'Document deleted' });
  } catch (err) { next(err); }
});

router.patch('/documents/:id/expiry', authenticateToken, async (req, res, next) => {
  try {
    const { expiryDate } = req.body;
    const doc = await VaultService.setExpiry(req.params.id, req.user.userId, expiryDate);
    res.json({ success: true, data: doc });
  } catch (err) { next(err); }
});

router.post('/documents/:id/import-to-filing', authenticateToken, async (req, res, next) => {
  try {
    const { filingId } = req.body;
    if (!filingId) return res.status(400).json({ success: false, error: 'filingId is required' });
    const result = await VaultService.importToFiling(req.params.id, filingId, req.user.userId);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

router.get('/summary', authenticateToken, async (req, res, next) => {
  try {
    const summary = await VaultService.getDocumentSummary(req.user.userId);
    res.json({ success: true, data: summary });
  } catch (err) { next(err); }
});

router.get('/matching/:filingId', authenticateToken, async (req, res, next) => {
  try {
    const { ITRFiling } = require('../models');
    const filing = await ITRFiling.findByPk(req.params.filingId);
    if (!filing) return res.status(404).json({ success: false, error: 'Filing not found' });
    const docs = await VaultService.getMatchingDocuments(req.user.userId, filing.assessmentYear);
    res.json({ success: true, data: docs });
  } catch (err) { next(err); }
});

module.exports = router;
