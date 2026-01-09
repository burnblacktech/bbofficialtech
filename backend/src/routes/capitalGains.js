// =====================================================
// CAPITAL GAINS ROUTES (F1.2.3)
// Human-language capital gains management
// =====================================================

const express = require('express');
const router = express.Router();
const capitalGainsIntentService = require('../services/itr/CapitalGainsIntentService');
const capitalGainsSummaryService = require('../services/itr/CapitalGainsSummaryService');
const { authenticateToken } = require('../middleware/auth');
const { ITRFiling } = require('../models');

/**
 * Record capital gains intent
 * POST /api/capital-gains/:filingId/intent
 */
router.post('/:filingId/intent', authenticateToken, async (req, res, next) => {
    try {
        const { filingId } = req.params;
        const { userResponse } = req.body;

        if (!userResponse) {
            return res.status(400).json({
                success: false,
                error: 'userResponse is required (yes, no, or not_sure)',
            });
        }

        const result = await capitalGainsIntentService.recordIntent(filingId, userResponse);

        res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        next(error);
    }
});

/**
 * Get capital gains summary
 * GET /api/capital-gains/:filingId/summary
 */
router.get('/:filingId/summary', authenticateToken, async (req, res, next) => {
    try {
        const { filingId } = req.params;

        // Get filing
        const filing = await ITRFiling.findByPk(filingId);
        if (!filing) {
            return res.status(404).json({
                success: false,
                error: 'Filing not found',
            });
        }

        const capitalGainsData = filing.jsonPayload?.income?.capitalGains || {};
        const summary = capitalGainsSummaryService.getSummary(capitalGainsData);

        res.status(200).json({
            success: true,
            data: summary,
        });
    } catch (error) {
        next(error);
    }
});

/**
 * Get AIS mismatch warnings
 * GET /api/capital-gains/:filingId/warnings
 */
router.get('/:filingId/warnings', authenticateToken, async (req, res, next) => {
    try {
        const { filingId } = req.params;

        const warnings = await capitalGainsIntentService.getMismatchWarnings(filingId);

        res.status(200).json({
            success: true,
            data: {
                hasWarnings: warnings.length > 0,
                warnings,
            },
        });
    } catch (error) {
        next(error);
    }
});

/**
 * Get capital gains intent
 * GET /api/capital-gains/:filingId/intent
 */
router.get('/:filingId/intent', authenticateToken, async (req, res, next) => {
    try {
        const { filingId } = req.params;

        const intent = await capitalGainsIntentService.getIntent(filingId);

        res.status(200).json({
            success: true,
            data: intent,
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
