/**
 * Dashboard Controller
 * Handles dashboard API requests
 */

const dashboardService = require('../services/dashboardService');

/**
 * Get dashboard data
 * GET /api/dashboard
 */
const getDashboardData = async (req, res) => {
    try {
        const userId = req.user?.userId || req.user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated',
            });
        }

        // Get financial year from query params or use current
        const financialYear = req.query.financialYear || '2024-25';

        const dashboardData = await dashboardService.getDashboardData(userId, financialYear);

        return res.status(200).json({
            success: true,
            data: dashboardData,
        });
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch dashboard data',
            error: error.message,
        });
    }
};

/**
 * Get financial overview
 * GET /api/dashboard/overview
 */
const getFinancialOverview = async (req, res) => {
    try {
        const userId = req.user?.userId || req.user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated',
            });
        }

        const financialYear = req.query.financialYear || '2024-25';
        const overview = await dashboardService.getFinancialOverview(userId, financialYear);

        return res.status(200).json({
            success: true,
            data: overview,
        });
    } catch (error) {
        console.error('Error fetching financial overview:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch financial overview',
            error: error.message,
        });
    }
};

/**
 * Get recommendations
 * GET /api/dashboard/recommendations
 */
const getRecommendations = async (req, res) => {
    try {
        const userId = req.user?.userId || req.user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated',
            });
        }

        const financialYear = req.query.financialYear || '2024-25';
        const recommendations = await dashboardService.getRecommendations(userId, financialYear);

        return res.status(200).json({
            success: true,
            data: recommendations,
        });
    } catch (error) {
        console.error('Error fetching recommendations:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch recommendations',
            error: error.message,
        });
    }
};

/**
 * Get income breakdown
 * GET /api/dashboard/income-breakdown
 */
const getIncomeBreakdown = async (req, res) => {
    try {
        const userId = req.user?.userId || req.user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated',
            });
        }

        const financialYear = req.query.financialYear || '2024-25';
        const breakdown = await dashboardService.getIncomeBreakdown(userId, financialYear);

        return res.status(200).json({
            success: true,
            data: breakdown,
        });
    } catch (error) {
        console.error('Error fetching income breakdown:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch income breakdown',
            error: error.message,
        });
    }
};

/**
 * Get upcoming deadlines
 * GET /api/dashboard/deadlines
 */
const getDeadlines = async (req, res) => {
    try {
        const financialYear = req.query.financialYear || '2024-25';
        const deadlines = await dashboardService.getUpcomingDeadlines(financialYear);

        return res.status(200).json({
            success: true,
            data: deadlines,
        });
    } catch (error) {
        console.error('Error fetching deadlines:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch deadlines',
            error: error.message,
        });
    }
};

module.exports = {
    getDashboardData,
    getFinancialOverview,
    getRecommendations,
    getIncomeBreakdown,
    getDeadlines,
};
