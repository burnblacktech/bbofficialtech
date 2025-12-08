// =====================================================
// HELP CONTROLLER
// Manages help articles, search, and feedback
// =====================================================

const { HelpArticle } = require('../models');
const { Op } = require('sequelize');
const enterpriseLogger = require('../utils/logger');
const { AppError } = require('../middleware/errorHandler');
const { validatePagination, isValidUUID } = require('../utils/validators');
const { sendSuccess, sendError, sendNotFound, sendValidationError } = require('../utils/responseFormatter');

class HelpController {
  /**
   * Search help content
   * GET /api/help/search?q=query&category=category&type=type
   */
  async search(req, res, next) {
    try {
      const { q, category, type } = req.query;
      const { page, limit, offset } = validatePagination(req.query);

      const options = {
        limit,
        offset,
      };

      // Build search query
      if (q) {
        options.search = q;
      }

      if (category) {
        options.category = category;
      }

      // Find published articles
      const { count, rows: articles } = await HelpArticle.findPublished(options);

      sendSuccess(res, 200, null, {
        results: articles.map((article) => ({
          id: article.id,
          title: article.title,
          snippet: article.snippet || article.content.substring(0, 200).replace(/<[^>]*>/g, ''),
          category: article.category,
          url: `/help/articles/${article.id}`,
          readTime: article.readTime,
          views: article.views,
          helpfulCount: article.helpfulCount,
          publishedDate: article.publishedAt ? article.publishedAt.toISOString().split('T')[0] : null,
        })),
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
        query: q,
      });
    } catch (error) {
      enterpriseLogger.error('Help search failed', {
        error: error.message,
        stack: error.stack,
        query: req.query,
      });
      next(error);
    }
  }

  /**
   * Get articles by category
   * GET /api/help/articles?category=category&page=page&limit=limit
   */
  async getArticles(req, res, next) {
    try {
      const { category, search } = req.query;
      const { page, limit, offset } = validatePagination(req.query);

      const options = {
        limit,
        offset,
      };

      if (category) {
        options.category = category;
      }

      if (search) {
        options.search = search;
      }

      const { count, rows: articles } = await HelpArticle.findPublished(options);

      sendSuccess(res, 200, null, {
        articles: articles.map((article) => ({
          id: article.id,
          title: article.title,
          snippet: article.snippet || article.content.substring(0, 200).replace(/<[^>]*>/g, ''),
          content: article.content,
          category: article.category,
          tags: article.tags || [],
          readTime: article.readTime,
          views: article.views,
          helpfulCount: article.helpfulCount,
          notHelpfulCount: article.notHelpfulCount,
          publishedDate: article.publishedAt ? article.publishedAt.toISOString().split('T')[0] : null,
          createdAt: article.createdAt,
          updatedAt: article.updatedAt,
        })),
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      });
    } catch (error) {
      enterpriseLogger.error('Get articles failed', {
        error: error.message,
        stack: error.stack,
        query: req.query,
      });
      next(error);
    }
  }

  /**
   * Get article details
   * GET /api/help/articles/:id
   */
  async getArticleById(req, res, next) {
    try {
      const { id } = req.params;

      if (!isValidUUID(id)) {
        return sendValidationError(res, ['Invalid article ID format']);
      }

      const article = await HelpArticle.findOne({
        where: {
          id,
          published: true,
        },
      });

      if (!article) {
        return sendNotFound(res, 'Article');
      }

      // Increment view count
      await article.incrementViews();

      // Get related articles
      let relatedArticles = [];
      if (article.relatedArticleIds && article.relatedArticleIds.length > 0) {
        relatedArticles = await HelpArticle.findAll({
          where: {
            id: {
              [Op.in]: article.relatedArticleIds,
            },
            published: true,
          },
          limit: 4,
          attributes: ['id', 'title', 'snippet', 'category', 'readTime', 'views'],
        });
      } else {
        // Fallback: get articles from same category
        relatedArticles = await HelpArticle.findAll({
          where: {
            category: article.category,
            published: true,
            id: {
              [Op.ne]: id,
            },
          },
          limit: 4,
          order: [['publishedAt', 'DESC']],
          attributes: ['id', 'title', 'snippet', 'category', 'readTime', 'views'],
        });
      }

      sendSuccess(res, 200, null, {
        article: {
          id: article.id,
          title: article.title,
          content: article.content,
          snippet: article.snippet,
          category: article.category,
          tags: article.tags || [],
          readTime: article.readTime,
          views: article.views,
          helpfulCount: article.helpfulCount,
          notHelpfulCount: article.notHelpfulCount,
          publishedDate: article.publishedAt ? article.publishedAt.toISOString().split('T')[0] : null,
          createdAt: article.createdAt,
          updatedAt: article.updatedAt,
        },
        relatedArticles: relatedArticles.map((a) => ({
          id: a.id,
          title: a.title,
          snippet: a.snippet || a.content?.substring(0, 200).replace(/<[^>]*>/g, ''),
          category: a.category,
          readTime: a.readTime,
          views: a.views,
        })),
      });
    } catch (error) {
      enterpriseLogger.error('Get article details failed', {
        error: error.message,
        stack: error.stack,
        articleId: req.params.id,
      });
      next(error);
    }
  }

  /**
   * Submit article feedback
   * POST /api/help/articles/:id/feedback
   */
  async submitFeedback(req, res, next) {
    try {
      const { id } = req.params;
      const { helpful, comment } = req.body;

      if (!isValidUUID(id)) {
        return sendValidationError(res, ['Invalid article ID format']);
      }

      if (typeof helpful !== 'boolean') {
        return sendValidationError(res, ['helpful field is required and must be a boolean']);
      }

      const article = await HelpArticle.findOne({
        where: {
          id,
          published: true,
        },
      });

      if (!article) {
        return sendNotFound(res, 'Article');
      }

      // Record feedback
      await article.recordFeedback(helpful);

      // Log feedback with comment if provided
      enterpriseLogger.info('Article feedback received', {
        articleId: id,
        helpful,
        comment: comment || null,
        userId: req.user?.userId || null,
        ip: req.ip,
      });

      sendSuccess(res, 200, 'Feedback submitted successfully', {
        helpfulCount: article.helpfulCount + (helpful ? 1 : 0),
        notHelpfulCount: article.notHelpfulCount + (helpful ? 0 : 1),
      });
    } catch (error) {
      enterpriseLogger.error('Submit feedback failed', {
        error: error.message,
        stack: error.stack,
        articleId: req.params.id,
      });
      next(error);
    }
  }
}

module.exports = new HelpController();

