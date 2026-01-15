/**
 * ITR Determination Controller
 * Handles API requests for ITR form determination
 */

const itrDeterminationService = require('../services/itrDeterminationService');
const enterpriseLogger = require('../utils/logger');

/**
 * Determine ITR form
 * @route POST /api/itr/determine
 */
const determineITRForm = async (req, res) => {
    try {
        const { profile, incomeSources, additionalInfo } = req.body;

        // Validate input
        if (!profile || !incomeSources || !Array.isArray(incomeSources)) {
            return res.status(400).json({
                success: false,
                message: 'Profile and income sources are required',
            });
        }

        // Determine ITR
        const result = await itrDeterminationService.determineITR(
            profile,
            incomeSources,
            additionalInfo || {},
            req.user?.userId
        );

        enterpriseLogger.info('ITR determined successfully', {
            userId: req.user?.userId,
            recommendedITR: result.recommendedITR,
        });

        return res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        enterpriseLogger.error('Determine ITR error', {
            error: error.message,
            stack: error.stack,
        });

        return res.status(500).json({
            success: false,
            message: 'Failed to determine ITR form',
            error: error.message,
        });
    }
};

/**
 * Get all ITR forms
 * @route GET /api/itr/forms
 */
const getAllITRForms = async (req, res) => {
    try {
        const forms = itrDeterminationService.getAllITRForms();

        return res.status(200).json({
            success: true,
            data: forms,
        });
    } catch (error) {
        enterpriseLogger.error('Get ITR forms error', {
            error: error.message,
        });

        return res.status(500).json({
            success: false,
            message: 'Failed to get ITR forms',
            error: error.message,
        });
    }
};

/**
 * Validate ITR eligibility
 * @route POST /api/itr/validate-eligibility
 */
const validateITREligibility = async (req, res) => {
    try {
        const { itrForm, userData } = req.body;

        // Validate input
        if (!itrForm || !userData) {
            return res.status(400).json({
                success: false,
                message: 'ITR form and user data are required',
            });
        }

        // Validate eligibility
        const result = itrDeterminationService.validateITREligibility(
            itrForm,
            userData
        );

        return res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        enterpriseLogger.error('Validate ITR eligibility error', {
            error: error.message,
            stack: error.stack,
        });

        return res.status(500).json({
            success: false,
            message: 'Failed to validate ITR eligibility',
            error: error.message,
        });
    }
};

module.exports = {
    determineITRForm,
    getAllITRForms,
    validateITREligibility,
};
