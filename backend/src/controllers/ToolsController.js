// =====================================================
// TOOLS CONTROLLER
// Handles investment planning, deadlines, and knowledge base
// =====================================================

const { query: dbQuery } = require('../utils/dbQuery');
const enterpriseLogger = require('../utils/logger');
const InvestmentPlanningService = require('../services/itr/InvestmentPlanningService');
const DeadlineService = require('../services/common/DeadlineService');

class ToolsController {
  // =====================================================
  // INVESTMENT PLANNING ENDPOINTS
  // =====================================================

  /**
   * Get investment recommendations
   * GET /api/tools/investment-planning/recommendations
   */
  async getInvestmentRecommendations(req, res) {
    try {
      const userId = req.user.userId;
      const { availableAmount, riskProfile, currentDeductions } = req.query;

      const options = {
        availableAmount: availableAmount ? parseFloat(availableAmount) : null,
        riskProfile: riskProfile || 'moderate',
        currentDeductions: currentDeductions ? JSON.parse(currentDeductions) : {},
      };

      const result = await InvestmentPlanningService.generateRecommendations(userId, options);

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      enterpriseLogger.error('Get investment recommendations failed', {
        error: error.message,
        userId: req.user?.userId,
        stack: error.stack,
      });
      res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to get investment recommendations',
      });
    }
  }

  /**
   * Calculate NPS benefits
   * POST /api/tools/investment-planning/nps-calculator
   */
  async calculateNPSBenefits(req, res) {
    try {
      const { contribution, years, expectedReturns } = req.body;

      if (!contribution || contribution <= 0) {
        return res.status(400).json({
          error: 'Contribution amount is required and must be greater than 0',
        });
      }

      const benefits = InvestmentPlanningService.calculateNPSBenefits(
        contribution,
        years || 30,
        expectedReturns || 9
      );

      res.json({
        success: true,
        benefits,
      });
    } catch (error) {
      enterpriseLogger.error('Calculate NPS benefits failed', {
        error: error.message,
        userId: req.user?.userId,
        stack: error.stack,
      });
      res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to calculate NPS benefits',
      });
    }
  }

  // =====================================================
  // DEADLINES & REMINDERS ENDPOINTS
  // =====================================================

  /**
   * Get tax deadlines for user
   * GET /api/tools/deadlines
   */
  async getDeadlines(req, res) {
    try {
      const userId = req.user.userId;
      const { year, type } = req.query;

      const deadlines = await DeadlineService.getDeadlines(userId, { year, type });

      res.json({
        success: true,
        deadlines,
      });
    } catch (error) {
      enterpriseLogger.error('Get deadlines failed', {
        error: error.message,
        userId: req.user?.userId,
        stack: error.stack,
      });
      res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to get deadlines',
      });
    }
  }

  /**
   * Create or update deadline reminder
   * POST /api/tools/deadlines/reminders
   */
  async createReminder(req, res) {
    try {
      const userId = req.user.userId;
      const { deadlineId, reminderDays } = req.body;

      if (!deadlineId || !reminderDays) {
        return res.status(400).json({
          error: 'Deadline ID and reminder days are required',
        });
      }

      const reminder = await DeadlineService.createReminder(userId, deadlineId, reminderDays);

      res.json({
        success: true,
        reminder,
      });
    } catch (error) {
      enterpriseLogger.error('Create reminder failed', {
        error: error.message,
        userId: req.user?.userId,
        stack: error.stack,
      });
      res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to create reminder',
      });
    }
  }

  /**
   * Update reminder settings
   * PUT /api/tools/deadlines/reminders/:reminderId
   */
  async updateReminder(req, res) {
    try {
      const userId = req.user.userId;
      const { reminderId } = req.params;
      const updateData = req.body;

      const reminder = await DeadlineService.updateReminder(userId, reminderId, updateData);

      res.json({
        success: true,
        reminder,
      });
    } catch (error) {
      enterpriseLogger.error('Update reminder failed', {
        error: error.message,
        userId: req.user?.userId,
        reminderId: req.params.reminderId,
        stack: error.stack,
      });
      res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to update reminder',
      });
    }
  }

  /**
   * Delete reminder
   * DELETE /api/tools/deadlines/reminders/:reminderId
   */
  async deleteReminder(req, res) {
    try {
      const userId = req.user.userId;
      const { reminderId } = req.params;

      await DeadlineService.deleteReminder(userId, reminderId);

      res.json({
        success: true,
        message: 'Reminder deleted successfully',
      });
    } catch (error) {
      enterpriseLogger.error('Delete reminder failed', {
        error: error.message,
        userId: req.user?.userId,
        reminderId: req.params.reminderId,
        stack: error.stack,
      });
      res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to delete reminder',
      });
    }
  }

  // =====================================================
  // KNOWLEDGE BASE ENDPOINTS
  // =====================================================

  /**
   * Search knowledge base
   * GET /api/tools/knowledge-base/search
   */
  async searchKnowledgeBase(req, res) {
    try {
      const { query, category, section } = req.query;

      // For now, return basic structure
      // In production, this would search a database or content management system
      const KnowledgeBaseService = require('../services/common/KnowledgeBaseService');
      const results = await KnowledgeBaseService.search(query, { category, section });

      res.json({
        success: true,
        results,
      });
    } catch (error) {
      enterpriseLogger.error('Search knowledge base failed', {
        error: error.message,
        query: req.query.query,
        stack: error.stack,
      });
      res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to search knowledge base',
      });
    }
  }

  /**
   * Get knowledge base topic
   * GET /api/tools/knowledge-base/topics/:topicId
   */
  async getTopic(req, res) {
    try {
      const { topicId } = req.params;

      const KnowledgeBaseService = require('../services/common/KnowledgeBaseService');
      const topic = await KnowledgeBaseService.getTopic(topicId);

      if (!topic) {
        return res.status(404).json({
          error: 'Topic not found',
        });
      }

      res.json({
        success: true,
        topic,
      });
    } catch (error) {
      enterpriseLogger.error('Get topic failed', {
        error: error.message,
        topicId: req.params.topicId,
        stack: error.stack,
      });
      res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to get topic',
      });
    }
  }

  /**
   * Get section explanation
   * GET /api/tools/knowledge-base/sections/:sectionId
   */
  async getSectionExplanation(req, res) {
    try {
      const { sectionId } = req.params;

      const KnowledgeBaseService = require('../services/common/KnowledgeBaseService');
      const explanation = await KnowledgeBaseService.getSectionExplanation(sectionId);

      if (!explanation) {
        return res.status(404).json({
          error: 'Section explanation not found',
        });
      }

      res.json({
        success: true,
        explanation,
      });
    } catch (error) {
      enterpriseLogger.error('Get section explanation failed', {
        error: error.message,
        sectionId: req.params.sectionId,
        stack: error.stack,
      });
      res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to get section explanation',
      });
    }
  }
}

module.exports = ToolsController;

