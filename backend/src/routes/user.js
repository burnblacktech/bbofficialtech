// =====================================================
// USER ROUTES - CANONICAL USER MANAGEMENT
// =====================================================

const express = require('express');
const router = express.Router();
const userController = require('../controllers/UserController');
const { authenticateToken } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');
const { Op } = require('sequelize');
const enterpriseLogger = require('../utils/logger');
const { AppError } = require('../middleware/errorHandler');
const { FamilyMember } = require('../models');

// Rate limiting for sensitive operations
const sensitiveOperationLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    status: 'error',
    message: 'Too many attempts, please try again later',
  },
});

// Apply authentication middleware to all routes
router.use(authenticateToken);

// =====================================================
// PROFILE MANAGEMENT
// =====================================================

/**
 * @route GET /api/users/profile
 * @description Get authenticated user's profile details
 * @access Private
 */
router.get('/profile', userController.getUserProfile);

/**
 * @route PUT /api/users/profile
 * @description Update authenticated user's profile details
 * @access Private
 */
router.put('/profile', userController.updateUserProfile);

// =====================================================
// PASSWORD MANAGEMENT
// =====================================================

/**
 * @route PUT /api/users/password
 * @description Change authenticated user's password
 * @access Private
 */
router.put('/password', sensitiveOperationLimit, userController.changePassword);

// =====================================================
// DASHBOARD & STATISTICS
// =====================================================

/**
 * @route GET /api/users/dashboard
 * @description Get aggregated data for user dashboard
 * @access Private
 */
router.get('/dashboard', userController.getUserDashboard);

// =====================================================
// SETTINGS MANAGEMENT
// =====================================================

/**
 * @route GET /api/users/settings
 * @description Get authenticated user's settings
 * @access Private
 */
router.get('/settings', userController.getUserSettings);

/**
 * @route PUT /api/users/settings
 * @description Update authenticated user's settings
 * @access Private
 */
router.put('/settings', userController.updateUserSettings);

// =====================================================
// NOTIFICATIONS
// =====================================================

/**
 * @route GET /api/users/notifications
 * @description Get authenticated user's notifications
 * @access Private
 */
router.get('/notifications', userController.getUserNotifications);

/**
 * @route PUT /api/users/notifications/:id/read
 * @description Mark a specific notification as read
 * @access Private
 */
router.put('/notifications/:id/read', userController.markNotificationAsRead);

/**
 * @route PUT /api/users/notifications/read-all
 * @description Mark all notifications as read
 * @access Private
 */
router.put('/notifications/read-all', userController.markAllNotificationsAsRead);

module.exports = router;