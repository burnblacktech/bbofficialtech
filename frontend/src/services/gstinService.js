// =====================================================
// GSTIN SERVICE - Frontend API Client
// =====================================================

import api from './api';

/**
 * Lookup GSTIN details
 * @param {string} gstin - GSTIN number to lookup
 * @returns {Promise<Object>} - GSTIN details
 */
export const lookupGSTIN = async (gstin) => {
    try {
        const response = await api.post('/gstin/lookup', { gstin });
        return response.data;
    } catch (error) {
        if (error.response?.data?.error) {
            throw new Error(error.response.data.error);
        }
        throw new Error('Failed to lookup GSTIN. Please try again.');
    }
};

/**
 * Get GSTIN service health status
 * @returns {Promise<Object>} - Service health information
 */
export const getGSTINServiceHealth = async () => {
    try {
        const response = await api.get('/gstin/health');
        return response.data;
    } catch (error) {
        throw new Error('Failed to get service health');
    }
};

export default {
    lookupGSTIN,
    getGSTINServiceHealth,
};
