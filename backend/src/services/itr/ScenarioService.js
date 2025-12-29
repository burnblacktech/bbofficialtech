// =====================================================
// SCENARIO SERVICE
// Service for managing saved tax scenarios
// =====================================================

const enterpriseLogger = require('../../utils/logger');
const { AppError } = require('../../middleware/errorHandler');
const { Scenario } = require('../../models');

class ScenarioService {
  /**
   * Save a scenario
   * @param {string} userId - User ID
   * @param {object} scenarioData - Scenario data
   * @returns {Promise<object>} - Saved scenario
   */
  async saveScenario(userId, scenarioData) {
    try {
      const {
        filingId,
        name,
        description,
        scenarioType,
        changes,
        simulationResult,
        tags = [],
        metadata = {},
      } = scenarioData;

      if (!name || !scenarioType || !changes) {
        throw new AppError('Name, scenarioType, and changes are required', 400);
      }

      const scenario = await Scenario.create({
        userId,
        filingId: filingId || null,
        name,
        description: description || null,
        scenarioType,
        changes,
        simulationResult: simulationResult || null,
        tags,
        metadata,
      });

      enterpriseLogger.info('Scenario saved', {
        scenarioId: scenario.id,
        userId,
        scenarioType,
      });

      return {
        id: scenario.id,
        userId: scenario.userId,
        filingId: scenario.filingId,
        name: scenario.name,
        description: scenario.description,
        scenarioType: scenario.scenarioType,
        changes: scenario.changes,
        simulationResult: scenario.simulationResult,
        isFavorite: scenario.isFavorite,
        tags: scenario.tags || [],
        metadata: scenario.metadata || {},
        createdAt: scenario.createdAt,
        updatedAt: scenario.updatedAt,
      };
    } catch (error) {
      enterpriseLogger.error('Failed to save scenario', {
        userId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get user scenarios
   * @param {string} userId - User ID
   * @param {object} filters - Optional filters
   * @returns {Promise<Array>} - Array of scenarios
   */
  async getUserScenarios(userId, filters = {}) {
    try {
      const { filingId, scenarioType, isFavorite, tags, page = 1, limit = 20 } = filters;
      const offset = (page - 1) * limit;

      const where = { userId };
      if (filingId) where.filingId = filingId;
      if (scenarioType) where.scenarioType = scenarioType;
      if (isFavorite !== undefined) where.isFavorite = isFavorite;
      if (tags && tags.length > 0) {
        where.tags = {
          [require('sequelize').Op.overlap]: tags,
        };
      }

      const { count, rows: scenarios } = await Scenario.findAndCountAll({
        where,
        order: [['isFavorite', 'DESC'], ['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset),
      });

      return {
        scenarios: scenarios.map(scenario => ({
        id: scenario.id,
        userId: scenario.userId,
        filingId: scenario.filingId,
        name: scenario.name,
        description: scenario.description,
        scenarioType: scenario.scenarioType,
        changes: scenario.changes,
        simulationResult: scenario.simulationResult,
        isFavorite: scenario.isFavorite,
        tags: scenario.tags || [],
        metadata: scenario.metadata || {},
        createdAt: scenario.createdAt,
        updatedAt: scenario.updatedAt,
      })),
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    };
    } catch (error) {
      enterpriseLogger.error('Failed to get user scenarios', {
        userId,
        error: error.message,
      });
      throw new AppError(`Failed to get scenarios: ${error.message}`, 500);
    }
  }

  /**
   * Get scenario by ID
   * @param {string} scenarioId - Scenario ID
   * @param {string} userId - User ID (for authorization)
   * @returns {Promise<object>} - Scenario details
   */
  async getScenarioById(scenarioId, userId) {
    try {
      const scenario = await Scenario.findOne({
        where: { id: scenarioId, userId },
      });

      if (!scenario) {
        throw new AppError('Scenario not found', 404);
      }

      return {
        id: scenario.id,
        userId: scenario.userId,
        filingId: scenario.filingId,
        name: scenario.name,
        description: scenario.description,
        scenarioType: scenario.scenarioType,
        changes: scenario.changes,
        simulationResult: scenario.simulationResult,
        isFavorite: scenario.isFavorite,
        tags: scenario.tags || [],
        metadata: scenario.metadata || {},
        createdAt: scenario.createdAt,
        updatedAt: scenario.updatedAt,
      };
    } catch (error) {
      enterpriseLogger.error('Failed to get scenario', {
        scenarioId,
        userId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Update scenario
   * @param {string} scenarioId - Scenario ID
   * @param {string} userId - User ID
   * @param {object} updateData - Update data
   * @returns {Promise<object>} - Updated scenario
   */
  async updateScenario(scenarioId, userId, updateData) {
    try {
      const scenario = await Scenario.findOne({
        where: { id: scenarioId, userId },
      });

      if (!scenario) {
        throw new AppError('Scenario not found', 404);
      }

      const allowedFields = ['name', 'description', 'changes', 'simulationResult', 'isFavorite', 'tags', 'metadata'];
      const updateFields = {};
      
      allowedFields.forEach(field => {
        if (updateData[field] !== undefined) {
          updateFields[field] = updateData[field];
        }
      });

      await scenario.update(updateFields);

      enterpriseLogger.info('Scenario updated', {
        scenarioId,
        userId,
      });

      return await this.getScenarioById(scenarioId, userId);
    } catch (error) {
      enterpriseLogger.error('Failed to update scenario', {
        scenarioId,
        userId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Delete scenario
   * @param {string} scenarioId - Scenario ID
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} - Success status
   */
  async deleteScenario(scenarioId, userId) {
    try {
      const scenario = await Scenario.findOne({
        where: { id: scenarioId, userId },
      });

      if (!scenario) {
        throw new AppError('Scenario not found', 404);
      }

      await scenario.destroy();

      enterpriseLogger.info('Scenario deleted', {
        scenarioId,
        userId,
      });

      return true;
    } catch (error) {
      enterpriseLogger.error('Failed to delete scenario', {
        scenarioId,
        userId,
        error: error.message,
      });
      throw error;
    }
  }
}

module.exports = new ScenarioService();

