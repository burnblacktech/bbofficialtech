/**
 * Income Routes
 * API endpoints for income management
 */

const express = require('express');
const router = express.Router();
const incomeController = require('../controllers/incomeController');
const { authenticateToken } = require('../middleware/auth');

// All income routes require authentication
router.use(authenticateToken);

// Get income summary
router.get('/summary', incomeController.getIncomeSummary);

// Get all income sources
router.get('/', incomeController.getAllIncome);

// Get income by type
router.get('/:type', incomeController.getIncomeByType);

// Create new income source
router.post('/', incomeController.createIncome);

// Update income source
router.put('/:id', incomeController.updateIncome);

// Delete income source
router.delete('/:id', incomeController.deleteIncome);

module.exports = router;
