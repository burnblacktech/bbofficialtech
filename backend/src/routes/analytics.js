const express = require('express');
const router = express.Router();
const enterpriseLogger = require('../utils/logger');

/**
 * Capture analytics events from frontend
 * POST /api/analytics/events
 */
router.post('/events', async (req, res) => {
    try {
        const { event, properties, context } = req.body;

        // Log event for internal monitoring
        enterpriseLogger.info(`[Analytics] ${event}`, {
            properties,
            context,
            userId: req.user?.userId || 'anonymous'
        });

        res.status(200).json({ success: true });
    } catch (error) {
        // Silently fail to not block UI
        enterpriseLogger.error('Analytics error', error);
        res.status(200).json({ success: true });
    }
});

module.exports = router;
