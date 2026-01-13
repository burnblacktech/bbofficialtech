// =====================================================
// ANALYTICS API SERVICE
// Frontend service for financial storytelling API calls
// =====================================================

import apiClient from '../core/APIClient';

export const analyticsService = {
    /**
     * Get complete financial story
     * @param {number} years - Number of years to fetch (default: 5)
     * @returns {Promise} Financial story data
     */
    getFinancialStory: (years = 5) => {
        return apiClient.get(`/analytics/financial-story?years=${years}`);
    },

    /**
     * Get timeline with milestones
     * @param {string} startYear - Start assessment year (optional)
     * @param {string} endYear - End assessment year (optional)
     * @returns {Promise} Timeline data
     */
    getTimeline: (startYear = null, endYear = null) => {
        const params = new URLSearchParams();
        if (startYear) params.append('start', startYear);
        if (endYear) params.append('end', endYear);
        const query = params.toString() ? `?${params.toString()}` : '';
        return apiClient.get(`/analytics/timeline${query}`);
    },

    /**
     * Get year-over-year comparison
     * @param {string} currentYear - Current assessment year
     * @param {string} previousYear - Previous assessment year
     * @returns {Promise} Comparison data
     */
    getYearComparison: (currentYear, previousYear) => {
        return apiClient.get(`/analytics/year-comparison?current=${currentYear}&previous=${previousYear}`);
    },

    /**
     * Get insights for assessment year
     * @param {string} assessmentYear - Assessment year
     * @returns {Promise} Insights data
     */
    getInsights: (assessmentYear) => {
        return apiClient.get(`/analytics/insights/${assessmentYear}`);
    },

    /**
     * Get growth metrics
     * @param {number} years - Number of years (default: 5)
     * @returns {Promise} Growth metrics
     */
    getGrowthMetrics: (years = 5) => {
        return apiClient.get(`/analytics/growth-metrics?years=${years}`);
    },

    /**
     * Create snapshot from filing
     * @param {string} filingId - Filing ID
     * @returns {Promise} Created snapshot
     */
    createSnapshot: (filingId) => {
        return apiClient.post(`/analytics/snapshot/${filingId}`);
    },
};

export default analyticsService;
