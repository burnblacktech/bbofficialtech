// =====================================================
// GSTIN ROUTES - GSTIN Lookup API Endpoints
// =====================================================

const express = require('express');
const GSTINService = require('../services/admin/GSTINService');
const { authenticateToken } = require('../middleware/auth');
const enterpriseLogger = require('../utils/logger');

const router = express.Router();

/**
 * @route POST /api/gstin/lookup
 * @desc Lookup GSTIN details via SurePass API
 * @access Private (GSTIN_ADMIN role)
 */
router.post('/lookup', authenticateToken, async (req, res) => {
    try {
        const { gstin } = req.body;
        const userId = req.user.userId;
        const userRole = req.user.role;

        // Validate request
        if (!gstin) {
            return res.status(400).json({
                success: false,
                error: 'GSTIN number is required',
            });
        }

        // Check if user has permission (GSTIN_ADMIN or SUPER_ADMIN)
        if (userRole !== 'GSTIN_ADMIN' && userRole !== 'SUPER_ADMIN') {
            enterpriseLogger.warn('Unauthorized GSTIN lookup attempt', {
                userId,
                userRole,
                gstin,
            });
            return res.status(403).json({
                success: false,
                error: 'You do not have permission to access this resource',
            });
        }

        // Lookup GSTIN
        const result = await GSTINService.lookupGSTIN(gstin, userId);

        enterpriseLogger.info('GSTIN lookup successful', {
            userId,
            userRole,
            gstin: result.gstin,
        });

        res.json(result);

    } catch (error) {
        enterpriseLogger.error('GSTIN lookup failed', {
            error: error.message,
            userId: req.user?.userId,
            gstin: req.body?.gstin,
        });

        res.status(400).json({
            success: false,
            error: error.message || 'Failed to lookup GSTIN',
        });
    }
});

/**
 * @route GET /api/gstin/health
 * @desc Get GSTIN service health status
 * @access Private
 */
router.get('/health', authenticateToken, async (req, res) => {
    try {
        const health = GSTINService.getHealthStatus();
        res.json({
            success: true,
            data: health,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to get service health',
        });
    }
});

module.exports = router;
