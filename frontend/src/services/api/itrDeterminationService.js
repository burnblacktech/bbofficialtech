import api from '../api';

const itrDeterminationService = {
    /**
     * Determine ITR Form based on user data
     * @param {Object} data - Determination data (profile, income sources, etc.)
     * @returns {Promise<Object>} Determination result
     */
    determineITR: async (data) => {
        try {
            const response = await api.post('/itr/determine', data);
            return response.data;
        } catch (error) {
            console.error('ITR Determination failed:', error);
            throw error;
        }
    },

    /**
     * Get applicable forms list
     * @returns {Promise<Array>} List of ITR forms
     */
    getForms: async () => {
        try {
            const response = await api.get('/itr/forms');
            return response.data;
        } catch (error) {
            console.error('Failed to fetch ITR forms:', error);
            throw error;
        }
    }
};

export default itrDeterminationService;
