/**
 * Tax Task Service
 * Manages tax-related deadlines and completion status
 */

const { sequelize } = require('../config/database');
const dashboardService = require('./dashboardService');

class TaxTaskService {
    /**
     * Get all tax tasks for a user
     * Merges hardcoded deadlines with user-specific completion status
     */
    async getTaxTasks(userId, financialYear = '2024-25') {
        try {
            // Get base deadlines from dashboard service
            const baseDeadlines = await dashboardService.getUpcomingDeadlines(financialYear);

            // Get user's task status from DB
            const query = `
                SELECT title, is_completed, completed_at
                FROM tax_tasks
                WHERE user_id = $1
            `;
            const result = await sequelize.query(query, {
                bind: [userId],
                type: sequelize.QueryTypes.SELECT
            });
            const userTasks = result;

            // Merge status
            return baseDeadlines.map(deadline => {
                const userTask = userTasks.find(t => t.title === deadline.title);
                return {
                    ...deadline,
                    isCompleted: userTask ? userTask.is_completed : false,
                    completedAt: userTask ? userTask.completed_at : null
                };
            });
        } catch (error) {
            console.error('Error in getTaxTasks:', error);
            throw error;
        }
    }

    /**
     * Toggle task completion status
     */
    async toggleTaskStatus(userId, title, dueDate, type, isCompleted) {
        // We use a check-then-insert/update pattern since we might not have a unique constraint yet
        const checkQuery = `SELECT id FROM tax_tasks WHERE user_id = $1 AND title = $2`;
        const checkResult = await sequelize.query(checkQuery, {
            bind: [userId, title],
            type: sequelize.QueryTypes.SELECT
        });

        if (checkResult.length > 0) {
            const updateQuery = `
                UPDATE tax_tasks
                SET is_completed = $1,
                    completed_at = $2,
                    updated_at = NOW()
                WHERE user_id = $3 AND title = $4
                RETURNING *
            `;
            const result = await sequelize.query(updateQuery, {
                bind: [isCompleted, isCompleted ? new Date() : null, userId, title],
                type: sequelize.QueryTypes.UPDATE
            });
            return result[0][0];
        } else {
            const insertQuery = `
                INSERT INTO tax_tasks (user_id, title, due_date, type, is_completed, completed_at)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING *
            `;
            const result = await sequelize.query(insertQuery, {
                bind: [userId, title, dueDate, type, isCompleted, isCompleted ? new Date() : null],
                type: sequelize.QueryTypes.INSERT
            });
            return result[0][0];
        }
    }
}

module.exports = new TaxTaskService();
