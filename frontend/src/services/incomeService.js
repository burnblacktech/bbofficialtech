import apiClient from './core/APIClient';

class IncomeService {
    async getIncomeSummary(financialYear = '2024-25') {
        const response = await apiClient.get('/income/summary', {
            params: { financialYear },
        });
        return response.data;
    }

    async getAllIncome(params = {}) {
        const response = await apiClient.get('/income', { params });
        return response.data;
    }

    async createIncome(incomeData) {
        const response = await apiClient.post('/income', incomeData);
        return response.data;
    }

    async updateIncome(id, incomeData) {
        const response = await apiClient.put(`/income/${id}`, incomeData);
        return response.data;
    }

    async deleteIncome(id) {
        const response = await apiClient.delete(`/income/${id}`);
        return response.data;
    }
}

export default new IncomeService();
