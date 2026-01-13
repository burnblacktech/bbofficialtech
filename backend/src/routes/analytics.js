// =====================================================
// ANALYTICS ROUTES
// Financial storytelling and insights API endpoints
// =====================================================

const express = require('express');
const router = express.Router();
const AnalyticsController = require('../controllers/AnalyticsController');
const { authenticateToken } = require('../middleware/auth');

// All analytics routes require authentication
router.use(authenticateToken);

// Financial Story
router.get('/financial-story', AnalyticsController.getFinancialStory);

// Timeline
router.get('/timeline', AnalyticsController.getTimeline);

// Year Comparison
router.get('/year-comparison', AnalyticsController.getYearComparison);

// Insights
router.get('/insights/:assessmentYear', AnalyticsController.getInsights);

// Growth Metrics
router.get('/growth-metrics', AnalyticsController.getGrowthMetrics);

// Create Snapshot (called after filing computation)
router.post('/snapshot/:filingId', AnalyticsController.createSnapshot);

// Track Event (Frontend Analytics)
router.post('/events', AnalyticsController.trackEvent);

module.exports = router;
