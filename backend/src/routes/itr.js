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

/**
 * @route POST /api/itr/determine
 * @desc Determine appropriate ITR form based on income sources and profile
 * @access Private
 */
router.post('/determine', authenticateToken, async (req, res, next) => {
    try {
        const { profile, incomeSources, additionalInfo } = req.body;

        // Map frontend income source selections to domain signals
        const signals = {
            salary: incomeSources?.includes('salary') ? 1 : 0,
            businessIncome: incomeSources?.includes('business') ? 1 : 0,
            professionalIncome: incomeSources?.includes('profession') ? 1 : 0,
            capitalGains: incomeSources?.includes('capital_gains') ? 1 : 0,
            foreignIncome: profile?.hasForeignAssets ? 1 : 0,
            hasForeignAssets: profile?.hasForeignAssets || false,
            agriculturalIncome: 0,
            housePropertyCount: additionalInfo?.housePropertyCount || 0,
            isDirector: profile?.isDirector || false,
            totalIncome: profile?.totalIncome || 0,
        };

        // Check for presumptive income (ITR-4)
        const wantsPresumptive = additionalInfo?.wantsPresumptive || false;
        const turnover = additionalInfo?.businessTurnover || 0;

        const ITRDomainCore = require('../domain/ITRDomainCore');
        let result = ITRDomainCore.determineITR(signals);

        // Override to ITR-4 if presumptive conditions met
        if (wantsPresumptive && (signals.businessIncome > 0 || signals.professionalIncome > 0)) {
            if (turnover <= 20000000) { // ₹2Cr limit for 44AD
                result = {
                    recommendedITR: 'ITR-4',
                    confidence: 0.9,
                    reason: 'Presumptive taxation under Section 44AD/44ADA',
                    triggeredRules: result.triggeredRules || [],
                };
            }
        }

        // Override to ITR-2 if multiple house properties or director
        if (signals.housePropertyCount > 1 || signals.isDirector) {
            if (result.recommendedITR === 'ITR-1') {
                result.recommendedITR = 'ITR-2';
                result.reason = signals.isDirector
                    ? 'Director of a company requires ITR-2'
                    : 'Multiple house properties require ITR-2';
            }
        }

        // Build explanation for frontend
        const explanations = {
            'ITR-1': {
                title: 'ITR-1 (Sahaj)',
                description: 'For salaried individuals with income up to ₹50 lakhs',
                complexity: 'Simple',
                estimatedTime: '15-20 minutes',
                benefits: ['Simplest form', 'Quick processing', 'Suitable for most salaried individuals'],
                requirements: ['Salary/pension income', 'One house property', 'Other sources (interest, etc.)', 'Total income ≤ ₹50 lakhs'],
            },
            'ITR-2': {
                title: 'ITR-2',
                description: 'For individuals with capital gains, multiple properties, or foreign assets',
                complexity: 'Moderate',
                estimatedTime: '30-45 minutes',
                benefits: ['Covers capital gains', 'Multiple house properties', 'Foreign income/assets'],
                requirements: ['Capital gains from shares/property', 'Multiple house properties', 'Foreign assets/income', 'Director of a company'],
            },
            'ITR-3': {
                title: 'ITR-3',
                description: 'For individuals with business or professional income (regular books)',
                complexity: 'Complex',
                estimatedTime: '60-90 minutes',
                benefits: ['Full business income reporting', 'P&L and Balance Sheet', 'All deductions available'],
                requirements: ['Business income with regular books', 'Professional income above presumptive limits', 'Partnership firm income'],
            },
            'ITR-4': {
                title: 'ITR-4 (Sugam)',
                description: 'For presumptive income under Section 44AD/44ADA/44AE',
                complexity: 'Moderate',
                estimatedTime: '20-30 minutes',
                benefits: ['No detailed books required', 'Simplified reporting', 'Lower compliance burden'],
                requirements: ['Business turnover ≤ ₹2 crore', 'Professional receipts ≤ ₹75 lakhs', 'Presumptive taxation opted'],
            },
        };

        res.status(200).json({
            success: true,
            data: {
                recommendedITR: result.recommendedITR,
                confidence: result.confidence,
                reason: result.reason,
                eligibility: {
                    eligible: [result.recommendedITR],
                    triggeredRules: result.triggeredRules || [],
                },
                explanation: explanations[result.recommendedITR] || explanations['ITR-1'],
            },
        });
    } catch (error) {
        enterpriseLogger.error('ITR determination error', { error: error.message });
        next(error);
    }
});

module.exports = router;
