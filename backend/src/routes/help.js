// =====================================================
// HELP ROUTES
// Help content, search, articles, and feedback
// Mounted at: /api/help
// =====================================================

const express = require('express');
const helpController = require('../controllers/HelpController');
const router = express.Router();

/**
 * Search help content
 * GET /api/help/search?q=query&category=category&type=type
 */
router.get('/search', helpController.search.bind(helpController));

/**
 * Get articles by category
 * GET /api/help/articles?category=category&page=page&limit=limit
 */
router.get('/articles', helpController.getArticles.bind(helpController));

/**
 * Get article details
 * GET /api/help/articles/:id
 */
router.get('/articles/:id', helpController.getArticleById.bind(helpController));

/**
 * Submit article feedback
 * POST /api/help/articles/:id/feedback
 */
router.post('/articles/:id/feedback', helpController.submitFeedback.bind(helpController));

module.exports = router;

