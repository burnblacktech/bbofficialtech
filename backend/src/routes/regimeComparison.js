// =====================================================
// REGIME COMPARISON ROUTES (F1.2.4)
// Human-language regime comparison and explanation
// =====================================================

const express = require('express');
const router = express.Router();
const TaxRegimeCalculatorV2 = require('../services/itr/TaxRegimeCalculatorV2');
const RegimeExplanationService = require('../services/itr/RegimeExplanationService');
const { authenticateToken } = require('../middleware/auth');
const { ITRFiling } = require('../models');

/**
 * Get full regime comparison with explanation
 * GET /api/regime-comparison/:filingId
 */
router.get('/:filingId', authenticateToken, async (req, res, next) => {
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

        const formData = filing.jsonPayload || {};

        // S24: Use formal tax computation engine
        const comparisonResult = TaxRegimeCalculatorV2.compareRegimes(formData);

        // Get human explanation
        const explanation = RegimeExplanationService.explainRecommendation(
            comparisonResult,
            formData
        );

        res.status(200).json({
            success: true,
            data: {
                ...comparisonResult,
                explanation,
            },
        });
    } catch (error) {
        next(error);
    }
});

/**
 * Get regime recommendation only (lightweight)
 * GET /api/regime-comparison/:filingId/recommendation
 */
router.get('/:filingId/recommendation', authenticateToken, async (req, res, next) => {
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

        const formData = filing.jsonPayload || {};

        // S24: Use formal tax computation engine
        const comparisonResult = TaxRegimeCalculatorV2.compareRegimes(formData);

        // Get explanation
        const explanation = RegimeExplanationService.explainRecommendation(
            comparisonResult,
            formData
        );

        // Return lightweight response
        res.status(200).json({
            success: true,
            data: {
                recommendedRegime: explanation.recommendedRegime,
                savings: explanation.savings,
                explanation: explanation.explanation,
                reasoning: explanation.reasoning,
            },
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
