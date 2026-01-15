/**
 * Deduction Service
 * Handles deduction-related CRUD operations
 */

const { sequelize } = require('../config/database');
const TimelineService = require('./analytics/TimelineService');

class DeductionService {
    /**
     * Get all deductions for a user
     * @param {string} userId - User ID
     * @param {string} financialYear - Financial year
     * @returns {Array} Deductions
     */
    async getDeductions(userId, financialYear = '2024-25') {
        const query = `
      SELECT 
        id,
        section,
        deduction_type,
        deduction_data,
        amount,
        verified,
        created_at,
        updated_at
      FROM deductions
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
     * Create new deduction
     * @param {Object} deductionData - Deduction data
     * @returns {Object} Created deduction
     */
    async createDeduction(deductionData) {
        const {
            userId,
            filingId,
            financialYear,
            section,
            deductionType = 'INVESTMENT',
            deductionData: data = {},
            amount,
        } = deductionData;

        const query = `
      INSERT INTO deductions (
        user_id,
        filing_id,
        financial_year,
        section,
        deduction_type,
        deduction_data,
        amount,
        verified
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

        const result = await sequelize.query(query, {
            bind: [
                userId,
                filingId || null,
                financialYear,
                section,
                deductionType,
                JSON.stringify(data),
                amount,
                false,
            ],
            type: sequelize.QueryTypes.INSERT,
        });

        const newDeduction = result[0][0];

        // Log financial event
        TimelineService.logEvent({
            userId,
            eventType: 'DEDUCTION_ADDED',
            eventDate: new Date(),
            entityType: 'DEDUCTION',
            entityId: newDeduction.id,
            amount: amount,
            description: `Added deduction ${section}`,
            source: 'MANUAL',
            metadata: { section, deductionType }
        });

        return newDeduction;
    }

    /**
     * Update deduction
     * @param {string} deductionId - Deduction ID
     * @param {string} userId - User ID
     * @param {Object} updateData - Data to update
     * @returns {Object} Updated deduction
     */
    async updateDeduction(deductionId, userId, updateData) {
        const { deductionData: data, amount } = updateData;

        let query = `UPDATE deductions SET updated_at = NOW()`;
        const binds = [];
        let index = 1;

        if (data !== undefined) {
            query += `, deduction_data = $${index++}`;
            binds.push(JSON.stringify(data));
        }
        if (amount !== undefined) {
            query += `, amount = $${index++}`;
            binds.push(amount);
        }

        query += ` WHERE id = $${index++} AND user_id = $${index} RETURNING *`;
        binds.push(deductionId, userId);

        const result = await sequelize.query(query, {
            bind: binds,
            type: sequelize.QueryTypes.UPDATE,
        });

        const updatedDeduction = result[0][0];

        // Log financial event
        if (updatedDeduction) {
            TimelineService.logEvent({
                userId,
                eventType: 'DEDUCTION_UPDATED',
                eventDate: new Date(),
                entityType: 'DEDUCTION',
                entityId: deductionId,
                amount: amount,
                description: `Updated deduction`,
                source: 'MANUAL',
            });
        }

        return updatedDeduction;
    }

    /**
     * Delete deduction
     * @param {string} deductionId - Deduction ID
     * @param {string} userId - User ID
     * @returns {boolean} Success
     */
    async deleteDeduction(deductionId, userId) {
        const query = `
      DELETE FROM deductions
      WHERE id = $1
      AND user_id = $2
    `;

        await sequelize.query(query, {
            bind: [deductionId, userId],
            type: sequelize.QueryTypes.DELETE,
        });

        // Log financial event
        TimelineService.logEvent({
            userId,
            eventType: 'DEDUCTION_DELETED',
            eventDate: new Date(),
            entityType: 'DEDUCTION',
            entityId: deductionId,
            description: `Deleted deduction`,
            source: 'MANUAL',
        });

        return true;
    }
}

module.exports = new DeductionService();
