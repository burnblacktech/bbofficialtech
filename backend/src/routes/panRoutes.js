/**
 * PAN Management Routes
 * API endpoints for managing verified PANs
 */

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const PANVerificationService = require('../services/PANVerificationService');
const enterpriseLogger = require('../utils/logger');

/**
 * GET /api/user/verified-pans
 * Get all verified PANs for the authenticated user
 */
router.get('/verified-pans', authenticateToken, async (req, res) => {
    try {
        // Fetch full User model from database (req.user from JWT doesn't include verifiedPans)
        const { User } = require('../models');
        const user = await User.findByPk(req.user.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found',
            });
        }

        const verifiedPans = user.verifiedPans || [];

        console.log('[GET VERIFIED PANS]', {
            userId: user.id,
            verifiedPans,
            count: verifiedPans.length
        });

        res.json({
            success: true,
            data: verifiedPans,
        });

    } catch (error) {
        enterpriseLogger.error('Get verified PANs error', {
            userId: req.user?.userId,
            error: error.message,
        });
        res.status(500).json({
            success: false,
            error: 'Failed to fetch verified PANs',
        });
    }
});

/**
 * POST /api/user/verified-pans
 * Verify and add a new PAN
 */
router.post('/verified-pans', authenticateToken, async (req, res) => {
    try {
        const { pan, label, dob } = req.body;

        // Validate input
        if (!pan) {
            return res.status(400).json({
                success: false,
                error: 'PAN is required',
            });
        }

        // Verify PAN
        const verificationResult = await PANVerificationService.verifyPAN(pan, dob);

        if (!verificationResult.success) {
            return res.status(400).json({
                success: false,
                error: verificationResult.error || 'PAN verification failed',
            });
        }

        // Add to user profile
        const updatedUser = await PANVerificationService.addVerifiedPAN(
            req.user,
            pan,
            label || 'Self',
            verificationResult.data
        );

        res.json({
            success: true,
            data: updatedUser.verifiedPans,
            message: 'PAN verified and added successfully',
        });

    } catch (error) {
        enterpriseLogger.error('Add verified PAN error', {
            userId: req.user?.id,
            error: error.message,
        });
        res.status(500).json({
            success: false,
            error: 'Failed to add verified PAN',
        });
    }
});

/**
 * PUT /api/user/verified-pans/:pan
 * Update PAN label or set as default
 */
router.put('/verified-pans/:pan', authenticateToken, async (req, res) => {
    try {
        const { pan } = req.params;
        const { label, isDefault } = req.body;

        let updatedUser = req.user;

        // Update label if provided
        if (label) {
            updatedUser = await PANVerificationService.updatePANLabel(updatedUser, pan, label);
        }

        // Set as default if requested
        if (isDefault === true) {
            updatedUser = await PANVerificationService.setDefaultPAN(updatedUser, pan);
        }

        res.json({
            success: true,
            data: updatedUser.verifiedPans,
            message: 'PAN updated successfully',
        });

    } catch (error) {
        enterpriseLogger.error('Update verified PAN error', {
            userId: req.user?.id,
            pan: req.params.pan,
            error: error.message,
        });
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to update PAN',
        });
    }
});

/**
 * DELETE /api/user/verified-pans/:pan
 * Remove a verified PAN
 */
router.delete('/verified-pans/:pan', authenticateToken, async (req, res) => {
    try {
        const { pan } = req.params;

        const updatedUser = await PANVerificationService.removeVerifiedPAN(req.user, pan);

        res.json({
            success: true,
            data: updatedUser.verifiedPans,
            message: 'PAN removed successfully',
        });

    } catch (error) {
        enterpriseLogger.error('Remove verified PAN error', {
            userId: req.user?.id,
            pan: req.params.pan,
            error: error.message,
        });
        res.status(500).json({
            success: false,
            error: 'Failed to remove PAN',
        });
    }
});

module.exports = router;
