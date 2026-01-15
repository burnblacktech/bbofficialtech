/**
 * Dashboard Service
 * API calls for dashboard data
 */

import api from './api';

export const dashboardService = {
    /* Get filing history
      * @returns { Promise } Array of past filings
     */
    getFilingHistory: async () => {
        try {
            const response = await api.get('/api/filings/history');
            return response.data;
        } catch (error) {
            console.error('Error fetching filing history:', error);
            throw error;
        }
    },

    /**
     * Get recent user activity
     * @returns {Promise} Array of recent activities
     */
    getRecentActivity: async () => {
        try {
            const response = await api.get('/api/user/activity');
            return response.data;
        } catch (error) {
            console.error('Error fetching recent activity:', error);
            throw error;
        }
    },

    /**
     * Get upcoming deadlines
     * @returns {Promise} Array of deadlines
     */
    getDeadlines: async () => {
        try {
            const response = await api.get('/api/deadlines');
            return response.data;
        } catch (error) {
            console.error('Error fetching deadlines:', error);
            throw error;
        }
    },

    /**
     * Get smart recommendations
     * @returns {Promise} Array of recommendations
     */
    getRecommendations: async () => {
        try {
            const response = await api.get('/api/dashboard/recommendations');
            return response.data;
        } catch (error) {
            console.error('Error fetching recommendations:', error);
            throw error;
        }
    },

    /**
     * Get income breakdown
     * @returns {Promise} Income breakdown object
     */
    getIncomeBreakdown: async () => {
        try {
            const response = await api.get('/api/dashboard/income-breakdown');
            return response.data;
        } catch (error) {
            console.error('Error fetching income breakdown:', error);
            throw error;
        }
    },

    /**
     * Get dashboard stats/metrics
     * @returns {Promise} Stats object
     */
    getStats: async () => {
        try {
            const response = await api.get('/api/dashboard/overview');
            return response.data;
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
            throw error;
        }
    },
};

export default dashboardService;
