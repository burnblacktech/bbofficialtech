/**
 * notifications.js
 * In-app notification routes — list, unread count, mark read.
 */

const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { authenticateToken } = require('../middleware/auth');
const { AppError } = require('../middleware/errorHandler');
const { InAppNotification } = require('../models');

// All notification routes require authentication
router.use(authenticateToken);

// =====================================================
// GET /in-app — List recent notifications
// =====================================================

router.get('/in-app', async (req, res, next) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);

    const notifications = await InAppNotification.findAll({
      where: { userId: req.user.userId },
      order: [['created_at', 'DESC']],
      limit,
    });

    res.json({ success: true, data: notifications });
  } catch (err) {
    next(err);
  }
});

// =====================================================
// GET /in-app/unread-count — Unread notification count
// =====================================================

router.get('/in-app/unread-count', async (req, res, next) => {
  try {
    const count = await InAppNotification.count({
      where: { userId: req.user.userId, isRead: false },
    });

    res.json({ success: true, data: { count } });
  } catch (err) {
    next(err);
  }
});

// =====================================================
// PATCH /in-app/:id/read — Mark single notification read
// =====================================================

router.patch('/in-app/:id/read', async (req, res, next) => {
  try {
    const notification = await InAppNotification.findOne({
      where: { id: req.params.id, userId: req.user.userId },
    });

    if (!notification) {
      throw new AppError('Notification not found', 404, 'NOT_FOUND');
    }

    if (!notification.isRead) {
      await notification.update({ isRead: true, readAt: new Date() });
    }

    res.json({ success: true, data: notification });
  } catch (err) {
    next(err);
  }
});

// =====================================================
// PATCH /in-app/mark-all-read — Mark all as read
// =====================================================

router.patch('/in-app/mark-all-read', async (req, res, next) => {
  try {
    const [updatedCount] = await InAppNotification.update(
      { isRead: true, readAt: new Date() },
      { where: { userId: req.user.userId, isRead: false } },
    );

    res.json({ success: true, data: { updatedCount } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
