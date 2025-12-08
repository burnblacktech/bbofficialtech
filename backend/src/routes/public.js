// =====================================================
// PUBLIC ROUTES
// Public landing page data (stats, testimonials)
// Mounted at: /api/public
// =====================================================

const express = require('express');
const enterpriseLogger = require('../utils/logger');
const publicController = require('../controllers/PublicController');
const router = express.Router();

/**
 * Get public stats for landing page
 * GET /api/public/stats
 */
router.get('/stats', publicController.getPublicStats.bind(publicController));

/**
 * Get public testimonials for landing page
 * GET /api/public/testimonials
 */
router.get('/testimonials', publicController.getPublicTestimonials.bind(publicController));

module.exports = router;

