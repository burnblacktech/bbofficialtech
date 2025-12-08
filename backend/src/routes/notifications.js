// =====================================================
// SSE NOTIFICATION ROUTES
// =====================================================

const express = require('express');
const router = express.Router();
const sseNotificationService = require('../services/utils/NotificationService');
const authMiddleware = require('../middleware/auth');
const enterpriseLogger = require('../utils/logger');
const { Notification } = require('../models');

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

/**
 * Get all notifications for the current user
 * GET /api/notifications
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, read, page = 1, limit = 20 } = req.query;

    const { Op } = require('sequelize');
    const { validatePagination } = require('../utils/validators');
    const { sendPaginated, sendError } = require('../utils/responseFormatter');

    const { page: validatedPage, limit: validatedLimit, offset } = validatePagination(req.query);

    // Build where clause
    const whereClause = { userId };
    if (type && type !== 'all') {
      whereClause.type = type;
    }
    if (read === 'read') {
      whereClause.read = true;
    } else if (read === 'unread') {
      whereClause.read = false;
    }

    // Fetch notifications from database
    const { count, rows: notifications } = await Notification.findAndCountAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit: validatedLimit,
      offset,
    });

    sendPaginated(
      res,
      notifications.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        read: n.read,
        readAt: n.readAt,
        actionUrl: n.actionUrl,
        metadata: n.metadata,
        createdAt: n.createdAt,
        updatedAt: n.updatedAt,
      })),
      count,
      validatedPage,
      validatedLimit
    );
  } catch (error) {
    enterpriseLogger.error('Get notifications failed', {
      error: error.message,
      userId: req.user?.id,
      stack: error.stack,
    });
    sendError(res, 500, 'Internal server error');
  }
});

/**
 * Get unread notification count
 * GET /api/notifications/unread-count
 */
router.get('/unread-count', async (req, res) => {
  try {
    const userId = req.user.id;
    const { sendSuccess, sendError } = require('../utils/responseFormatter');

    const count = await Notification.count({
      where: {
        userId,
        read: false,
      },
    });

    sendSuccess(res, 200, null, { count });
  } catch (error) {
    enterpriseLogger.error('Get unread count failed', {
      error: error.message,
      userId: req.user?.id,
      stack: error.stack,
    });
    sendError(res, 500, 'Internal server error');
  }
});

/**
 * Mark notification as read
 * PUT /api/notifications/:notificationId/read
 */
router.put('/:notificationId/read', async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;
    const { isValidUUID } = require('../utils/validators');
    const { sendSuccess, sendError, sendNotFound, sendValidationError } = require('../utils/responseFormatter');

    if (!isValidUUID(notificationId)) {
      return sendValidationError(res, ['Invalid notification ID format']);
    }

    const notification = await Notification.findOne({
      where: {
        id: notificationId,
        userId,
      },
    });

    if (!notification) {
      return sendNotFound(res, 'Notification');
    }

    await notification.markAsRead();

    sendSuccess(res, 200, 'Notification marked as read', {
      id: notification.id,
      read: notification.read,
      readAt: notification.readAt,
    });
  } catch (error) {
    enterpriseLogger.error('Mark as read failed', {
      error: error.message,
      notificationId: req.params.notificationId,
      userId: req.user?.id,
      stack: error.stack,
    });
    sendError(res, 500, 'Internal server error');
  }
});

/**
 * Mark notification as unread
 * PUT /api/notifications/:notificationId/unread
 */
router.put('/:notificationId/unread', async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;
    const { isValidUUID } = require('../utils/validators');
    const { sendSuccess, sendError, sendNotFound, sendValidationError } = require('../utils/responseFormatter');

    if (!isValidUUID(notificationId)) {
      return sendValidationError(res, ['Invalid notification ID format']);
    }

    const notification = await Notification.findOne({
      where: {
        id: notificationId,
        userId,
      },
    });

    if (!notification) {
      return sendNotFound(res, 'Notification');
    }

    await notification.update({
      read: false,
      readAt: null,
    });

    sendSuccess(res, 200, 'Notification marked as unread', {
      id: notification.id,
      read: notification.read,
    });
  } catch (error) {
    enterpriseLogger.error('Mark as unread failed', {
      error: error.message,
      notificationId: req.params.notificationId,
      userId: req.user?.id,
      stack: error.stack,
    });
    sendError(res, 500, 'Internal server error');
  }
});

/**
 * Mark all notifications as read
 * PUT /api/notifications/read-all
 */
router.put('/read-all', async (req, res) => {
  try {
    const userId = req.user.id;
    const { sendSuccess, sendError } = require('../utils/responseFormatter');

    const updatedCount = await Notification.markAllAsRead(userId);

    sendSuccess(res, 200, 'All notifications marked as read', {
      updatedCount,
    });
  } catch (error) {
    enterpriseLogger.error('Mark all as read failed', {
      error: error.message,
      userId: req.user?.id,
      stack: error.stack,
    });
    sendError(res, 500, 'Internal server error');
  }
});

/**
 * Delete notification
 * DELETE /api/notifications/:notificationId
 */
router.delete('/:notificationId', async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;
    const { isValidUUID } = require('../utils/validators');
    const { sendSuccess, sendError, sendNotFound, sendValidationError, sendDeleted } = require('../utils/responseFormatter');

    if (!isValidUUID(notificationId)) {
      return sendValidationError(res, ['Invalid notification ID format']);
    }

    const notification = await Notification.findOne({
      where: {
        id: notificationId,
        userId,
      },
    });

    if (!notification) {
      return sendNotFound(res, 'Notification');
    }

    await notification.destroy();

    sendDeleted(res, 'Notification deleted');
  } catch (error) {
    enterpriseLogger.error('Delete notification failed', {
      error: error.message,
      notificationId: req.params.notificationId,
      userId: req.user?.id,
      stack: error.stack,
    });
    sendError(res, 500, 'Internal server error');
  }
});

/**
 * Delete all notifications
 * DELETE /api/notifications/all
 */
router.delete('/all', async (req, res) => {
  try {
    const userId = req.user.id;
    const { sendSuccess, sendError, sendDeleted } = require('../utils/responseFormatter');

    const deletedCount = await Notification.destroy({
      where: { userId },
    });

    sendDeleted(res, 'All notifications deleted');
  } catch (error) {
    enterpriseLogger.error('Delete all notifications failed', {
      error: error.message,
      userId: req.user?.id,
      stack: error.stack,
    });
    sendError(res, 500, 'Internal server error');
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