/**
 * Income Controller
 * Handles income-related API requests
 */

const incomeService = require('../services/incomeService');

/**
 * Get all income sources
 * GET /api/income
 */
const getAllIncome = async (req, res) => {
    try {
        const userId = req.user?.userId || req.user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated',
            });
        }

        const financialYear = req.query.financialYear || '2024-25';
        const incomeSources = await incomeService.getIncomeSources(userId, financialYear);

        return res.status(200).json({
            success: true,
            data: incomeSources,
        });
    } catch (error) {
        console.error('Error fetching income sources:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch income sources',
            error: error.message,
        });
    }
};

/**
 * Get income by type
 * GET /api/income/:type
 */
const getIncomeByType = async (req, res) => {
    try {
        const userId = req.user?.userId || req.user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated',
            });
        }

        const { type } = req.params;
        const financialYear = req.query.financialYear || '2024-25';

        const incomeSources = await incomeService.getIncomeByType(userId, type, financialYear);

        return res.status(200).json({
            success: true,
            data: incomeSources,
        });
    } catch (error) {
        console.error('Error fetching income by type:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch income by type',
            error: error.message,
        });
    }
};

/**
 * Create new income source
 * POST /api/income
 */
const createIncome = async (req, res) => {
    try {
        const userId = req.user?.userId || req.user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated',
            });
        }

        const { sourceType, sourceData, amount, financialYear, filingId, dataSource } = req.body;

        // Validation
        if (!sourceType || !amount) {
            return res.status(400).json({
                success: false,
                message: 'Source type and amount are required',
            });
        }

        const incomeData = {
            userId,
            filingId,
            financialYear: financialYear || '2024-25',
            sourceType,
            sourceData: sourceData || {},
            amount: parseFloat(amount),
            dataSource: dataSource || 'MANUAL',
        };

        const newIncome = await incomeService.createIncome(incomeData);

        return res.status(201).json({
            success: true,
            message: 'Income source created successfully',
            data: newIncome,
        });
    } catch (error) {
        console.error('Error creating income source:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to create income source',
            error: error.message,
        });
    }
};

/**
 * Update income source
 * PUT /api/income/:id
 */
const updateIncome = async (req, res) => {
    try {
        const userId = req.user?.userId || req.user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated',
            });
        }

        const { id } = req.params;
        const { sourceData, amount } = req.body;

        const updateData = {
            sourceData,
            amount: parseFloat(amount),
        };

        const updatedIncome = await incomeService.updateIncome(id, userId, updateData);

        if (!updatedIncome) {
            return res.status(404).json({
                success: false,
                message: 'Income source not found',
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Income source updated successfully',
            data: updatedIncome,
        });
    } catch (error) {
        console.error('Error updating income source:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update income source',
            error: error.message,
        });
    }
};

/**
 * Delete income source
 * DELETE /api/income/:id
 */
const deleteIncome = async (req, res) => {
    try {
        const userId = req.user?.userId || req.user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated',
            });
        }

        const { id } = req.params;
        await incomeService.deleteIncome(id, userId);

        return res.status(200).json({
            success: true,
            message: 'Income source deleted successfully',
        });
    } catch (error) {
        console.error('Error deleting income source:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to delete income source',
            error: error.message,
        });
    }
};

/**
 * Get income summary
 * GET /api/income/summary
 */
const getIncomeSummary = async (req, res) => {
    try {
        const userId = req.user?.userId || req.user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated',
            });
        }

        const financialYear = req.query.financialYear || '2024-25';
        const summary = await incomeService.getIncomeSummary(userId, financialYear);

        return res.status(200).json({
            success: true,
            data: summary,
        });
    } catch (error) {
        console.error('Error fetching income summary:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch income summary',
            error: error.message,
        });
    }
};

module.exports = {
    getAllIncome,
    getIncomeByType,
    createIncome,
    updateIncome,
    deleteIncome,
    getIncomeSummary,
};
