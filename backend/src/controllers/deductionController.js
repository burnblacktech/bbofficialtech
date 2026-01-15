/**
 * Deduction Controller
 * Handles deduction-related API requests
 */

const deductionService = require('../services/deductionService');

const getDeductions = async (req, res) => {
    try {
        const userId = req.user?.userId || req.user?.id;
        const financialYear = req.query.financialYear || '2024-25';
        const deductions = await deductionService.getDeductions(userId, financialYear);

        return res.status(200).json({
            success: true,
            data: deductions,
        });
    } catch (error) {
        console.error('Error fetching deductions:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch deductions',
            error: error.message,
        });
    }
};

const createDeduction = async (req, res) => {
    try {
        const userId = req.user?.userId || req.user?.id;
        const { section, amount, financialYear, filingId, deductionType, deductionData } = req.body;

        if (!section || amount === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Section and amount are required',
            });
        }

        const newDeduction = await deductionService.createDeduction({
            userId,
            filingId,
            financialYear: financialYear || '2024-25',
            section,
            deductionType,
            deductionData,
            amount: parseFloat(amount),
        });

        return res.status(201).json({
            success: true,
            message: 'Deduction created successfully',
            data: newDeduction,
        });
    } catch (error) {
        console.error('Error creating deduction:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to create deduction',
            error: error.message,
        });
    }
};

const updateDeduction = async (req, res) => {
    try {
        const userId = req.user?.userId || req.user?.id;
        const { id } = req.params;
        const { deductionData, amount } = req.body;

        const updatedDeduction = await deductionService.updateDeduction(id, userId, {
            deductionData,
            amount: amount !== undefined ? parseFloat(amount) : undefined,
        });

        if (!updatedDeduction) {
            return res.status(404).json({
                success: false,
                message: 'Deduction not found',
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Deduction updated successfully',
            data: updatedDeduction,
        });
    } catch (error) {
        console.error('Error updating deduction:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update deduction',
            error: error.message,
        });
    }
};

const deleteDeduction = async (req, res) => {
    try {
        const userId = req.user?.userId || req.user?.id;
        const { id } = req.params;
        await deductionService.deleteDeduction(id, userId);

        return res.status(200).json({
            success: true,
            message: 'Deduction deleted successfully',
        });
    } catch (error) {
        console.error('Error deleting deduction:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to delete deduction',
            error: error.message,
        });
    }
};

module.exports = {
    getDeductions,
    createDeduction,
    updateDeduction,
    deleteDeduction,
};
