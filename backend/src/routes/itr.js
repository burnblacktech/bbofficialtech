// =====================================================
// ITR ROUTES - ITR UTILITIES & FILING ORCHESTRATION
// Handles PAN verification, assessment year selection, and ITR status
// =====================================================

const express = require('express');
const router = express.Router();
const panVerificationService = require('../services/common/PANVerificationService');
const { authenticateToken } = require('../middleware/auth');
const enterpriseLogger = require('../utils/logger');
const { AppError } = require('../middleware/errorHandler');

/**
 * @route POST /api/itr/pan/verify
 * @desc Verify PAN number with SurePass
 * @access Private
 */
router.post('/pan/verify', authenticateToken, async (req, res, next) => {
    try {
        const { pan, memberId, memberType = 'self' } = req.body;
        const userId = req.user.userId;

        if (!pan) {
            throw new AppError('PAN number is required', 400);
        }

        enterpriseLogger.info('PAN verification request', {
            userId,
            pan: pan.toUpperCase(),
            memberType,
            memberId
        });

        const verificationResult = await panVerificationService.verifyPAN(pan.toUpperCase(), userId);

        res.status(200).json({
            success: true,
            message: 'PAN verified successfully',
            data: verificationResult
        });
    } catch (error) {
        enterpriseLogger.error('PAN verification route error', {
            error: error.message,
            userId: req.user?.userId
        });
        next(error);
    }
});

/**
 * @route GET /api/itr/pan/status
 * @desc Get status of PAN verification service
 * @access Private
 */
router.get('/pan/status', authenticateToken, async (req, res, next) => {
    try {
        const status = await panVerificationService.getServiceStatus();
        res.status(200).json({
            success: true,
            data: status
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
