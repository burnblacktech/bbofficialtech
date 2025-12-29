// =====================================================
// FILING ANALYTICS CONTROLLER
// Handles filing analytics endpoints
// =====================================================

const filingAnalyticsService = require('../services/itr/FilingAnalyticsService');
const enterpriseLogger = require('../utils/logger');
const { AppError } = require('../middleware/errorHandler');
const {
  successResponse,
  errorResponse,
} = require('../utils/responseFormatter');

class FilingAnalyticsController {
  /**
   * Get comprehensive analytics for user
   * GET /api/itr/analytics
   */
  async getAnalytics(req, res, next) {
    try {
      const userId = req.user.id;
      const { assessmentYear, years } = req.query;

      const options = {};
      if (assessmentYear) options.assessmentYear = assessmentYear;
      if (years) options.years = parseInt(years);

      const analytics = await filingAnalyticsService.getUserAnalytics(userId, options);

      return successResponse(res, 'Analytics retrieved successfully', analytics);
    } catch (error) {
      enterpriseLogger.error('Failed to get filing analytics', {
        userId: req.user?.id,
        error: error.message,
      });
      next(error);
    }
  }
}

module.exports = new FilingAnalyticsController();

