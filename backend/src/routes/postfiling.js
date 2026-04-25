/**
 * Post-Filing Routes — Refund tracking, CPC decoding, revised returns, e-verification
 */

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const PostFilingService = require('../services/postfiling/PostFilingService');

router.get('/:filingId/summary', authenticateToken, async (req, res, next) => {
  try {
    const summary = await PostFilingService.generateSummary(req.params.filingId);
    res.json({ success: true, data: summary });
  } catch (err) { next(err); }
});

router.get('/:filingId/refund-status', authenticateToken, async (req, res, next) => {
  try {
    const status = await PostFilingService.checkRefundStatus(req.params.filingId);
    res.json({ success: true, data: status });
  } catch (err) { next(err); }
});

router.post('/:filingId/cpc-decode', authenticateToken, async (req, res, next) => {
  try {
    const result = await PostFilingService.decodeCPCIntimation(req.params.filingId, req.body);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

router.post('/:filingId/detect-differences', authenticateToken, async (req, res, next) => {
  try {
    const result = await PostFilingService.detectDifferences(req.params.filingId, req.body);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

router.post('/:filingId/revised-return', authenticateToken, async (req, res, next) => {
  try {
    const revised = await PostFilingService.createRevisedReturn(req.params.filingId, req.user.userId);
    res.status(201).json({ success: true, data: revised });
  } catch (err) { next(err); }
});

router.get('/:filingId/everify-status', authenticateToken, async (req, res, next) => {
  try {
    const status = await PostFilingService.getEVerificationStatus(req.params.filingId);
    res.json({ success: true, data: status });
  } catch (err) { next(err); }
});

module.exports = router;
