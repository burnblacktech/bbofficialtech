/**
 * Notification Controller
 * API endpoints for managing notifications
 */

const notificationService = require('../services/integration/NotificationService');
const enterpriseLogger = require('../utils/logger');

/**
 * Send a notification (Admin/System usually, but exposed for testing)
 * POST /api/notifications/send
 */
const sendNotification = async (req, res, next) => {
    try {
        const { type, data, channels, recipient } = req.body;

        // If recipient is NOT provided, default to current logged in user
        const targetRecipient = recipient || {
            userId: req.user.userId,
            email: req.user.email,
            phone: req.user.phone
        };

        if (!type) {
            return res.status(400).json({ success: false, error: 'Notification type is required' });
        }

        const result = await notificationService.send(
            targetRecipient,
            type,
            data,
            channels || ['email']
        );

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get notification history
 * GET /api/notifications
 */
const getHistory = async (req, res, next) => {
    // TODO: Implement database storage for notifications to support history
    res.status(200).json({
        success: true,
        data: [],
        message: 'Notification history not yet implemented'
    });
};

module.exports = {
    sendNotification,
    getHistory
};
