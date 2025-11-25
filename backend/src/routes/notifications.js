// =====================================================
// SSE NOTIFICATION ROUTES
// =====================================================

const express = require('express');
const router = express.Router();
const sseNotificationService = require('../services/utils/NotificationService');
const authMiddleware = require('../middleware/auth');
const enterpriseLogger = require('../utils/logger');

// Apply authentication middleware to all routes
router.use(authMiddleware.authenticateToken);

/**
 * SSE connection endpoint
 * GET /api/notifications/sse
 */
router.get('/sse', (req, res) => {
  try {
    const userId = req.user.id;

    enterpriseLogger.info('SSE connection attempt', { userId });

    const success = sseNotificationService.addClient(userId, res);

    if (!success) {
      res.status(503).json({
        success: false,
        message: 'SSE notifications are currently disabled',
      });
    }

  } catch (error) {
    enterpriseLogger.error('SSE connection error', {
      error: error.message,
      userId: req.user?.id,
    });

    res.status(500).json({
      success: false,
      message: 'Failed to establish SSE connection',
    });
  }
});

/**
 * Send test notification
 * POST /api/notifications/test
 */
router.post('/test', (req, res) => {
  try {
    const userId = req.user.id;
    const { message = 'Test notification' } = req.body;

    sseNotificationService.sendGeneralNotification(
      userId,
      'Test Notification',
      message,
      { test: true },
    );

    enterpriseLogger.info('Test notification sent', { userId });

    res.status(200).json({
      success: true,
      message: 'Test notification sent successfully',
    });

  } catch (error) {
    enterpriseLogger.error('Failed to send test notification', {
      error: error.message,
      userId: req.user?.id,
    });

    res.status(500).json({
      success: false,
      message: 'Failed to send test notification',
    });
  }
});

/**
 * Get notification service status
 * GET /api/notifications/status
 */
router.get('/status', (req, res) => {
  try {
    const status = sseNotificationService.getServiceStatus();

    res.status(200).json({
      success: true,
      message: 'Notification service status retrieved successfully',
      data: status,
    });

  } catch (error) {
    enterpriseLogger.error('Failed to get notification status', {
      error: error.message,
    });

    res.status(500).json({
      success: false,
      message: 'Failed to get notification status',
    });
  }
});

/**
 * Send notification to specific user (admin only)
 * POST /api/notifications/send
 */
router.post('/send', (req, res) => {
  try {
    const { userId, type, data } = req.body;
    const senderId = req.user.id;

    // Check if user is admin
    if (!['admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required',
      });
    }

    if (!userId || !type) {
      return res.status(400).json({
        success: false,
        message: 'userId and type are required',
      });
    }

    sseNotificationService.sendToUser(userId, type, {
      ...data,
      sentBy: senderId,
      sentAt: new Date().toISOString(),
    });

    enterpriseLogger.info('Admin notification sent', {
      senderId,
      targetUserId: userId,
      type,
    });

    res.status(200).json({
      success: true,
      message: 'Notification sent successfully',
    });

  } catch (error) {
    enterpriseLogger.error('Failed to send admin notification', {
      error: error.message,
      senderId: req.user?.id,
    });

    res.status(500).json({
      success: false,
      message: 'Failed to send notification',
    });
  }
});

/**
 * Broadcast notification to all users (admin only)
 * POST /api/notifications/broadcast
 */
router.post('/broadcast', (req, res) => {
  try {
    const { type, data } = req.body;
    const senderId = req.user.id;

    // Check if user is admin
    if (!['admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required',
      });
    }

    if (!type) {
      return res.status(400).json({
        success: false,
        message: 'type is required',
      });
    }

    sseNotificationService.sendToAll(type, {
      ...data,
      sentBy: senderId,
      sentAt: new Date().toISOString(),
    });

    enterpriseLogger.info('Admin broadcast sent', {
      senderId,
      type,
    });

    res.status(200).json({
      success: true,
      message: 'Broadcast sent successfully',
    });

  } catch (error) {
    enterpriseLogger.error('Failed to send admin broadcast', {
      error: error.message,
      senderId: req.user?.id,
    });

    res.status(500).json({
      success: false,
      message: 'Failed to send broadcast',
    });
  }
});

/**
 * Send notification to users by role (admin only)
 * POST /api/notifications/send-to-role
 */
router.post('/send-to-role', (req, res) => {
  try {
    const { role, type, data } = req.body;
    const senderId = req.user.id;

    // Check if user is admin
    if (!['admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required',
      });
    }

    if (!role || !type) {
      return res.status(400).json({
        success: false,
        message: 'role and type are required',
      });
    }

    sseNotificationService.sendToRole(role, type, {
      ...data,
      sentBy: senderId,
      sentAt: new Date().toISOString(),
    });

    enterpriseLogger.info('Admin role notification sent', {
      senderId,
      targetRole: role,
      type,
    });

    res.status(200).json({
      success: true,
      message: 'Role notification sent successfully',
    });

  } catch (error) {
    enterpriseLogger.error('Failed to send role notification', {
      error: error.message,
      senderId: req.user?.id,
    });

    res.status(500).json({
      success: false,
      message: 'Failed to send role notification',
    });
  }
});

// Error handling middleware
router.use((error, req, res, next) => {
  enterpriseLogger.error('SSE notification route error', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    userId: req.user?.id,
  });

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  });
});

enterpriseLogger.info('SSE notification routes configured');

module.exports = router;