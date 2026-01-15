/**
 * New Filing Service
 * API calls for new filing endpoints (/api/filings/*)
 */

import api from './api';

export const newFilingService = {
    /**
     * Create new filing
     */
    createFiling: async (data) => {
        const response = await api.post('/api/filings/create', data);
        return response.data;
    },

    /**
     * Get filing by ID
     */
    getFiling: async (filingId) => {
        const response = await api.get(`/api/filings/${filingId}`);
        return response.data;
    },

    /**
     * Update filing
     */
    updateFiling: async (filingId, updates) => {
        const response = await api.patch(`/api/filings/${filingId}`, updates);
        return response.data;
    },

    /**
     * Add salary income
     */
    addSalaryIncome: async (filingId, salaryData) => {
        const response = await api.post(`/api/filings/${filingId}/income/salary`, salaryData);
        return response.data;
    },

    /**
     * Add 80C deductions
     */
    add80CDeductions: async (filingId, deductionData) => {
        const response = await api.post(`/api/filings/${filingId}/deductions/80c`, deductionData);
        return response.data;
    },

    /**
     * Calculate tax
     */
    calculateTax: async (filingId, regime = 'OLD') => {
        const response = await api.post(`/api/filings/${filingId}/calculate-tax`, { regime });
        return response.data;
    },

    /**
     * Compare regimes
     */
    compareRegimes: async (filingId) => {
        const response = await api.post(`/api/filings/${filingId}/compare-regimes`);
        return response.data;
    },

    /**
     * Validate filing
     */
    validateFiling: async (filingId) => {
        const response = await api.post(`/api/filings/${filingId}/validate`);
        return response.data;
    },
};

export default newFilingService;
