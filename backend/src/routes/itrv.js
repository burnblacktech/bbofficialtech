// =====================================================
// ITR-V ROUTES
// Routes for ITR-V processing and tracking
// =====================================================

const express = require('express');
const router = express.Router();
const Joi = require('joi');
const itrvController = require('../controllers/ITRVController');
const { authenticateToken } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validateRequest');

// All routes require authentication
router.use(authenticateToken);

/**
 * @route   POST /api/itrv/initialize/:filingId
 * @desc    Initialize ITR-V tracking for a filing
 * @access  Private
 */
router.post('/initialize/:filingId', itrvController.initializeTracking);

/**
 * @route   GET /api/itrv/status/:filingId
 * @desc    Get ITR-V status for a filing
 * @access  Private
 */
router.get('/status/:filingId', itrvController.getStatus);

/**
 * @route   GET /api/itrv/user
 * @desc    Get all ITR-V records for the authenticated user
 * @access  Private
 * @query   status - Filter by status (optional)
 * @query   assessmentYear - Filter by assessment year (optional)
 */
router.get('/user', itrvController.getUserRecords);

/**
 * @route   POST /api/itrv/check-status/:filingId
 * @desc    Check ITR-V status from Income Tax Portal
 * @access  Private
 */
router.post('/check-status/:filingId', itrvController.checkStatusFromPortal);

/**
 * @route   POST /api/itrv/verify/:filingId
 * @desc    Mark ITR-V as verified
 * @access  Private
 * @body    { verificationMethod: string } - Verification method used
 */
router.post(
  '/verify/:filingId',
  validateRequest(Joi.object({
    verificationMethod: Joi.string()
      .valid('AADHAAR_OTP', 'NETBANKING', 'DSC', 'EVC', 'MANUAL')
      .required(),
  })),
  itrvController.markAsVerified,
);

/**
 * @route   GET /api/itrv/expiring
 * @desc    Get expiring ITR-V records (admin only)
 * @access  Private (Admin)
 */
router.get('/expiring', itrvController.getExpiringRecords);

module.exports = router;

