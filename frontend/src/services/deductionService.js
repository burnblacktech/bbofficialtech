import apiClient from './core/APIClient';

class DeductionService {
    async getDeductions(params = {}) {
        const response = await apiClient.get('/deductions', { params });
        return response.data;
    }

    async createDeduction(deductionData) {
        const response = await apiClient.post('/deductions', deductionData);
        return response.data;
    }

    async updateDeduction(id, deductionData) {
        const response = await apiClient.put(`/deductions/${id}`, deductionData);
        return response.data;
    }

    async deleteDeduction(id) {
        const response = await apiClient.delete(`/deductions/${id}`);
        return response.data;
    }
}

export default new DeductionService();
