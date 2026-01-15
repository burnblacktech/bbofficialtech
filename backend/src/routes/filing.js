/**
 * Filing Routes
 * API routes for ITR filing management
 */

const express = require('express');
const router = express.Router();
const filingController = require('../controllers/filingController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Filing CRUD
router.post('/create', filingController.createFiling);
router.get('/:filingId', filingController.getFiling);
router.patch('/:filingId', filingController.updateFiling);
router.delete('/:filingId', filingController.deleteFiling);

// Income sources
router.post('/:filingId/income/salary', filingController.addSalaryIncome);

// Deductions
router.post('/:filingId/deductions/80c', filingController.add80CDeductions);

// Tax calculation
router.post('/:filingId/calculate-tax', filingController.calculateTax);
router.post('/:filingId/compare-regimes', filingController.compareRegimes);

// Validation
router.post('/:filingId/validate', filingController.validateFiling);

module.exports = router;
