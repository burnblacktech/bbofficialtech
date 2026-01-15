/**
 * Tax Task Controller
 * Handles API requests for tax tasks/calendar
 */

const taxTaskService = require('../services/taxTaskService');

class TaxTaskController {
    /**
     * Get all tax calendar tasks
     */
    async getTasks(req, res) {
        try {
            const userId = req.user?.userId || req.user?.id;
            const { financialYear = '2024-25' } = req.query;

            const tasks = await taxTaskService.getTaxTasks(userId, financialYear);

            return res.status(200).json({
                success: true,
                data: tasks
            });
        } catch (error) {
            console.error('Error fetching tax tasks:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch tax tasks'
            });
        }
    }

    /**
     * Toggle task status
     */
    async toggleStatus(req, res) {
        try {
            const userId = req.user?.userId || req.user?.id;
            const { title, dueDate, type, isCompleted } = req.body;

            if (!title) {
                return res.status(400).json({
                    success: false,
                    message: 'Task title is required'
                });
            }

            const task = await taxTaskService.toggleTaskStatus(userId, title, dueDate, type, isCompleted);

            return res.status(200).json({
                success: true,
                data: task
            });
        } catch (error) {
            console.error('Error toggling task status:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to update task status'
            });
        }
    }
}

module.exports = new TaxTaskController();
