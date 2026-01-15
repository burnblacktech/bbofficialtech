/**
 * Income Service
 * Handles income source CRUD operations
 */

const { sequelize } = require('../config/database');
const TimelineService = require('./analytics/TimelineService');

class IncomeService {
  /**
   * Get all income sources for a user
   * @param {string} userId - User ID
   * @param {string} financialYear - Financial year
   * @returns {Array} Income sources
   */
  async getIncomeSources(userId, financialYear = '2024-25') {
    const query = `
      SELECT 
        id,
        source_type,
        source_data,
        amount,
        data_source,
        verified,
        created_at,
        updated_at
      FROM income_sources
      WHERE user_id = $1
      AND financial_year = $2
      ORDER BY created_at DESC
    `;

    const result = await sequelize.query(query, {
      bind: [userId, financialYear],
      type: sequelize.QueryTypes.SELECT,
    });

    return result;
  }

  /**
   * Get income sources by type
   * @param {string} userId - User ID
   * @param {string} sourceType - Source type (salary, business, rental, etc.)
   * @param {string} financialYear - Financial year
   * @returns {Array} Income sources
   */
  async getIncomeByType(userId, sourceType, financialYear = '2024-25') {
    const query = `
      SELECT 
        id,
        source_type,
        source_data,
        amount,
        data_source,
        verified,
        created_at,
        updated_at
      FROM income_sources
      WHERE user_id = $1
      AND source_type = $2
      AND financial_year = $3
      ORDER BY created_at DESC
    `;

    const result = await sequelize.query(query, {
      bind: [userId, sourceType, financialYear],
      type: sequelize.QueryTypes.SELECT,
    });

    return result;
  }

  /**
   * Create new income source
   * @param {Object} incomeData - Income data
   * @returns {Object} Created income source
   */
  async createIncome(incomeData) {
    const {
      userId,
      filingId,
      financialYear,
      sourceType,
      sourceData,
      amount,
      dataSource = 'MANUAL',
    } = incomeData;

    const query = `
      INSERT INTO income_sources (
        user_id,
        filing_id,
        financial_year,
        source_type,
        source_data,
        amount,
        data_source,
        verified
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const result = await sequelize.query(query, {
      bind: [
        userId,
        filingId || null,
        financialYear,
        sourceType,
        JSON.stringify(sourceData),
        amount,
        dataSource,
        false,
      ],
      type: sequelize.QueryTypes.INSERT,
    });

    const newIncome = result[0][0];

    // Log financial event
    TimelineService.logEvent({
      userId,
      eventType: 'INCOME_SOURCE_ADDED',
      eventDate: new Date(),
      entityType: 'INCOME_SOURCE',
      entityId: newIncome.id,
      amount: amount,
      description: `Added ${sourceType.toLowerCase()} income`,
      source: dataSource,
      metadata: { sourceType }
    });

    return newIncome;
  }

  /**
   * Update income source
   * @param {string} incomeId - Income ID
   * @param {string} userId - User ID
   * @param {Object} updateData - Data to update
   * @returns {Object} Updated income source
   */
  async updateIncome(incomeId, userId, updateData) {
    const { sourceData, amount } = updateData;

    const query = `
      UPDATE income_sources
      SET 
        source_data = $1,
        amount = $2,
        updated_at = NOW()
      WHERE id = $3
      AND user_id = $4
      RETURNING *
    `;

    const result = await sequelize.query(query, {
      bind: [
        JSON.stringify(sourceData),
        amount,
        incomeId,
        userId,
      ],
      type: sequelize.QueryTypes.UPDATE,
    });

    const updatedIncome = result[0][0];

    // Log financial event
    if (updatedIncome) {
      TimelineService.logEvent({
        userId,
        eventType: 'INCOME_SOURCE_UPDATED',
        eventDate: new Date(),
        entityType: 'INCOME_SOURCE',
        entityId: incomeId,
        amount: amount,
        description: `Updated income source`,
        source: 'MANUAL',
      });
    }

    return updatedIncome;
  }

  /**
   * Delete income source
   * @param {string} incomeId - Income ID
   * @param {string} userId - User ID
   * @returns {boolean} Success
   */
  async deleteIncome(incomeId, userId) {
    const query = `
      DELETE FROM income_sources
      WHERE id = $1
      AND user_id = $2
    `;

    await sequelize.query(query, {
      bind: [incomeId, userId],
      type: sequelize.QueryTypes.DELETE,
    });

    // Log financial event
    TimelineService.logEvent({
      userId,
      eventType: 'INCOME_SOURCE_DELETED',
      eventDate: new Date(),
      entityType: 'INCOME_SOURCE',
      entityId: incomeId,
      description: `Deleted income source`,
      source: 'MANUAL',
    });

    return true;
  }

  /**
   * Get total income by type
   * @param {string} userId - User ID
   * @param {string} financialYear - Financial year
   * @returns {Object} Income summary by type
   */
  async getIncomeSummary(userId, financialYear = '2024-25') {
    const query = `
      SELECT 
        source_type,
        COUNT(*) as count,
        SUM(amount) as total_amount
      FROM income_sources
      WHERE user_id = $1
      AND financial_year = $2
      GROUP BY source_type
      ORDER BY total_amount DESC
    `;

    const result = await sequelize.query(query, {
      bind: [userId, financialYear],
      type: sequelize.QueryTypes.SELECT,
    });

    return result.map(row => ({
      sourceType: row.source_type,
      count: parseInt(row.count),
      totalAmount: parseFloat(row.total_amount),
    }));
  }

  /**
   * Verify income source (mark as verified)
   * @param {string} incomeId - Income ID
   * @param {string} userId - User ID
   * @returns {Object} Updated income source
   */
  async verifyIncome(incomeId, userId) {
    const query = `
      UPDATE income_sources
      SET 
        verified = true,
        updated_at = NOW()
      WHERE id = $1
      AND user_id = $2
      RETURNING *
    `;

    const result = await sequelize.query(query, {
      bind: [incomeId, userId],
      type: sequelize.QueryTypes.UPDATE,
    });

    return result[0][0];
  }
}

module.exports = new IncomeService();
