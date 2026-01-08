// =====================================================
// FILING SAFETY ROUTES (F1.2.5 / S17)
// Psychological safety and completion confidence
// =====================================================

const express = require('express');
const router = express.Router();
const FilingSafetyService = require('../services/itr/FilingSafetyService');
const CompletionChecklistService = require('../services/itr/CompletionChecklistService');
const { authenticateToken } = require('../middleware/auth');

/**
 * Get safety status
 * GET /api/filing-safety/:filingId/status
 */
router.get('/:filingId/status', authenticateToken, async (req, res, next) => {
    try {
        const { filingId } = req.params;

        const status = await FilingSafetyService.getSafetyStatus(filingId);

        res.status(200).json({
            success: true,
            data: status,
        });
    } catch (error) {
        next(error);
    }
});

/**
 * Get completion checklist
 * GET /api/filing-safety/:filingId/checklist
 */
router.get('/:filingId/checklist', authenticateToken, async (req, res, next) => {
    try {
        const { filingId } = req.params;

        const checklist = await CompletionChecklistService.getChecklist(filingId);

        res.status(200).json({
            success: true,
            data: checklist,
        });
    } catch (error) {
        next(error);
    }
});

/**
 * Get error protections
 * GET /api/filing-safety/:filingId/protections
 */
router.get('/:filingId/protections', authenticateToken, async (req, res, next) => {
    try {
        const { filingId } = req.params;

        const protections = await FilingSafetyService.getErrorProtections(filingId);

        res.status(200).json({
            success: true,
            data: protections,
        });
    } catch (error) {
        next(error);
    }
});

/**
 * Get exit message
 * GET /api/filing-safety/:filingId/exit-message
 */
router.get('/:filingId/exit-message', authenticateToken, async (req, res, next) => {
    try {
        const { context } = req.query;

        const message = FilingSafetyService.getExitMessage(context);

        res.status(200).json({
            success: true,
            data: message,
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
