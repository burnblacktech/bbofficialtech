/**
 * ITR Determination Routes
 * Routes for ITR form determination
 */

const express = require('express');
const router = express.Router();
const itrDeterminationController = require('../controllers/itrDeterminationController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

/**
 * @route POST /api/itr/determine
 * @desc Determine appropriate ITR form
 * @access Private
 */
router.post('/determine', itrDeterminationController.determineITRForm);

/**
 * @route GET /api/itr/forms
 * @desc Get all ITR form details
 * @access Private
 */
router.get('/forms', itrDeterminationController.getAllITRForms);

/**
 * @route POST /api/itr/validate-eligibility
 * @desc Validate ITR form eligibility
 * @access Private
 */
router.post('/validate-eligibility', itrDeterminationController.validateITREligibility);

module.exports = router;
