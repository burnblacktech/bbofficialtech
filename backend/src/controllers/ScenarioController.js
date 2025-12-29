// =====================================================
// SCENARIO CONTROLLER
// Handles scenario management endpoints
// =====================================================

const scenarioService = require('../services/itr/ScenarioService');
const enterpriseLogger = require('../utils/logger');
const { AppError } = require('../middleware/errorHandler');
const {
  successResponse,
  validationErrorResponse,
} = require('../utils/responseFormatter');

class ScenarioController {
  /**
   * Save a scenario
   * POST /api/itr/scenarios
   */
  async saveScenario(req, res, next) {
    try {
      const userId = req.user.id;
      const scenarioData = req.body;

      if (!scenarioData.name || !scenarioData.scenarioType || !scenarioData.changes) {
        return validationErrorResponse(res, 'Name, scenarioType, and changes are required');
      }

      const scenario = await scenarioService.saveScenario(userId, scenarioData);

      return successResponse(res, 'Scenario saved successfully', scenario, 201);
    } catch (error) {
      enterpriseLogger.error('Failed to save scenario', {
        userId: req.user?.id,
        error: error.message,
      });
      next(error);
    }
  }

  /**
   * Get user scenarios
   * GET /api/itr/scenarios
   */
  async getUserScenarios(req, res, next) {
    try {
      const userId = req.user.id;
      const { filingId, scenarioType, isFavorite, tags, page = 1, limit = 20 } = req.query;

      const filters = { page, limit };
      if (filingId) filters.filingId = filingId;
      if (scenarioType) filters.scenarioType = scenarioType;
      if (isFavorite !== undefined) filters.isFavorite = isFavorite === 'true';
      if (tags) filters.tags = tags.split(',');

      const result = await scenarioService.getUserScenarios(userId, filters);

      return successResponse(res, 'Scenarios retrieved successfully', result);
    } catch (error) {
      enterpriseLogger.error('Failed to get user scenarios', {
        userId: req.user?.id,
        error: error.message,
      });
      next(error);
    }
  }

  /**
   * Get scenario by ID
   * GET /api/itr/scenarios/:id
   */
  async getScenario(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const scenario = await scenarioService.getScenarioById(id, userId);

      return successResponse(res, 'Scenario retrieved successfully', scenario);
    } catch (error) {
      enterpriseLogger.error('Failed to get scenario', {
        scenarioId: req.params.id,
        userId: req.user?.id,
        error: error.message,
      });
      next(error);
    }
  }

  /**
   * Update scenario
   * PATCH /api/itr/scenarios/:id
   */
  async updateScenario(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const updateData = req.body;

      const scenario = await scenarioService.updateScenario(id, userId, updateData);

      return successResponse(res, 'Scenario updated successfully', scenario);
    } catch (error) {
      enterpriseLogger.error('Failed to update scenario', {
        scenarioId: req.params.id,
        userId: req.user?.id,
        error: error.message,
      });
      next(error);
    }
  }

  /**
   * Delete scenario
   * DELETE /api/itr/scenarios/:id
   */
  async deleteScenario(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      await scenarioService.deleteScenario(id, userId);

      return successResponse(res, 'Scenario deleted successfully');
    } catch (error) {
      enterpriseLogger.error('Failed to delete scenario', {
        scenarioId: req.params.id,
        userId: req.user?.id,
        error: error.message,
      });
      next(error);
    }
  }
}

module.exports = new ScenarioController();

