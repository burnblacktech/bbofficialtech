/**
 * Deduction Routes
 * API endpoints for deduction management
 */

const express = require('express');
const router = express.Router();
const deductionController = require('../controllers/deductionController');
const { authenticateToken } = require('../middleware/auth');

// All deduction routes require authentication
router.use(authenticateToken);

// Get all deductions
router.get('/', deductionController.getDeductions);

// Create new deduction
router.post('/', deductionController.createDeduction);

// Update deduction
router.put('/:id', deductionController.updateDeduction);

// Delete deduction
router.delete('/:id', deductionController.deleteDeduction);

module.exports = router;
