/**
 * Dashboard Routes
 * API endpoints for dashboard data
 */

const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticateToken } = require('../middleware/auth');

// All dashboard routes require authentication
router.use(authenticateToken);

// Get complete dashboard data
router.get('/', dashboardController.getDashboardData);
router.get('/data', dashboardController.getDashboardData);

// Get financial overview
router.get('/overview', dashboardController.getFinancialOverview);

// Get smart recommendations
router.get('/recommendations', dashboardController.getRecommendations);

// Get income breakdown
router.get('/income-breakdown', dashboardController.getIncomeBreakdown);

// Get upcoming deadlines
router.get('/deadlines', dashboardController.getDeadlines);

module.exports = router;
