/**
 * Tax Calculation Routes
 * API endpoints for tax calculations
 */

const express = require('express');
const router = express.Router();
const taxController = require('../controllers/taxController');
const { authenticateToken } = require('../middleware/auth');

// All tax routes require authentication
router.use(authenticateToken);

// Calculate tax
router.post('/calculate', taxController.calculateTax);

// Compare regimes
router.post('/compare-regimes', taxController.compareRegimes);

// Get tax slabs
router.get('/slabs', taxController.getTaxSlabs);

// Tax Calendar / Tasks
const taxTaskController = require('../controllers/taxTaskController');
router.get('/tasks', taxTaskController.getTasks);
router.post('/tasks/toggle', taxTaskController.toggleStatus);

module.exports = router;
