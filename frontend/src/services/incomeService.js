// Income service — wraps the main API client
import api from './api';

const incomeService = {
  getIncomeSources: async (filingId) => {
    const res = await api.get(`/filings/${filingId}`);
    return res.data?.data?.jsonPayload?.income || {};
  },
  getIncomeSummary: async () => {
    // Returns empty summary — will be populated once a filing exists
    return { totalIncome: 0, breakdown: {} };
  },
  updateIncome: async (filingId, incomeData) => {
    const res = await api.put(`/filings/${filingId}`, { jsonPayload: { income: incomeData } });
    return res.data;
  },
};

export default incomeService;
