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
 * @route PUT /api/users/set-password
 * @description Set password for OAuth users (first time)
 * @access Private
 */
router.put('/set-password', sensitiveOperationLimit, userController.setPassword);

/**
 * @route PUT /api/users/password
 * @description Change authenticated user's password
 * @access Private
 */
router.put('/password', sensitiveOperationLimit, userController.changePassword);

// =====================================================
// PAN MANAGEMENT
// =====================================================

/**
 * @route PATCH /api/user/pan
 * @description Update authenticated user's PAN number
 * @access Private
 * @body {string} panNumber - PAN number to set
 */
router.patch('/pan', async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { panNumber } = req.body;
    const User = require('../models/User');
    const enterpriseLogger = require('../utils/logger');

    if (!panNumber) {
      return res.status(400).json({
        success: false,
        error: 'PAN number is required',
      });
    }

    // Validate PAN format
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!panRegex.test(panNumber.toUpperCase())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid PAN format',
      });
    }

    // Verify PAN using SurePass service
    const panVerificationService = require('../services/business/PANVerificationService');
    const verificationResult = await panVerificationService.verifyPAN(panNumber.toUpperCase(), userId);

    if (!verificationResult.isValid) {
      return res.status(400).json({
        success: false,
        error: 'PAN verification failed. Please enter a valid PAN number.',
      });
    }

    // Update user's PAN with verified status
    await User.update(
      {
        panNumber: panNumber.toUpperCase(),
        panVerified: true,
        panVerifiedAt: new Date(),
      },
      {
        where: {
          id: userId,
        },
      }
    );

    enterpriseLogger.info('User PAN updated', {
      userId,
      panNumber: panNumber.toUpperCase(),
    });

    res.json({
      success: true,
      message: 'PAN number updated and verified successfully',
      data: {
        panNumber: panNumber.toUpperCase(),
        panVerified: true,
        panVerifiedAt: new Date(),
      },
    });
  } catch (error) {
    const enterpriseLogger = require('../utils/logger');
    enterpriseLogger.error('Failed to update user PAN', {
      error: error.message,
      userId: req.user?.userId,
      stack: error.stack,
    });
    next(error);
  }
});

/**
 * @route POST /api/user/verify-pan
 * @description Verify authenticated user's PAN number
 * @access Private
 * @body {string} pan - PAN number to verify (optional, uses user's PAN if not provided)
 */
router.post('/verify-pan', async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { pan } = req.body;
    const User = require('../models/User');
    const panVerificationService = require('../services/business/PANVerificationService');
    const enterpriseLogger = require('../utils/logger');

    // Get the user
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Use provided PAN or user's PAN
    const panToVerify = pan || user.panNumber;

    if (!panToVerify) {
      return res.status(400).json({
        success: false,
        error: 'PAN number is required',
      });
    }

    // Verify PAN using SurePass service
    const verificationResult = await panVerificationService.verifyPAN(panToVerify, userId);

    if (!verificationResult.isValid) {
      return res.status(400).json({
        success: false,
        error: 'PAN verification failed',
        data: verificationResult,
      });
    }

    // Update user's PAN verification status
    await User.update(
      {
        panNumber: panToVerify.toUpperCase(),
        panVerified: true,
        panVerifiedAt: new Date(),
      },
      {
        where: {
          id: userId,
        },
      }
    );

    enterpriseLogger.info('User PAN verified successfully', {
      userId,
      pan: panToVerify,
    });

    res.json({
      success: true,
      message: 'PAN verified successfully',
      data: {
        pan: verificationResult.pan,
        isValid: verificationResult.isValid,
        name: verificationResult.name,
        status: verificationResult.status,
        verifiedAt: verificationResult.verifiedAt,
      },
    });
  } catch (error) {
    const enterpriseLogger = require('../utils/logger');
    enterpriseLogger.error('User PAN verification failed', {
      error: error.message,
      userId: req.user?.userId,
      stack: error.stack,
    });
    next(error);
  }
});

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

// =====================================================
// BANK ACCOUNT MANAGEMENT
// =====================================================

/**
 * @route GET /api/users/bank-accounts
 * @description Get authenticated user's bank accounts
 * @access Private
 */
router.get('/bank-accounts', userController.getBankAccounts);

/**
 * @route POST /api/users/bank-accounts
 * @description Add a new bank account
 * @access Private
 */
router.post('/bank-accounts', userController.addBankAccount);

/**
 * @route PUT /api/users/bank-accounts/:id
 * @description Update a bank account
 * @access Private
 */
router.put('/bank-accounts/:id', userController.updateBankAccount);

/**
 * @route DELETE /api/users/bank-accounts/:id
 * @description Delete a bank account
 * @access Private
 */
router.delete('/bank-accounts/:id', userController.deleteBankAccount);

/**
 * @route PATCH /api/users/bank-accounts/:id/set-primary
 * @description Set a bank account as primary
 * @access Private
 */
router.patch('/bank-accounts/:id/set-primary', userController.setPrimaryBankAccount);

module.exports = router;