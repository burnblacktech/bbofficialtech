// Filing service — wraps the main API client
import api from './api';

const newFilingService = {
  createFiling: (data) => api.post('/filings', data),
  getFiling: (id) => api.get(`/filings/${id}`),
  updateFiling: (id, data) => api.put(`/filings/${id}`, data),
  getFilings: () => api.get('/filings'),
  submitFiling: (id) => api.post(`/filings/${id}/submit`),
  getReadiness: (id) => api.get(`/filings/${id}/readiness`),
  getTaxBreakdown: (id) => api.get(`/filings/${id}/tax-breakdown`),
  getOverview: (id) => api.get(`/filings/${id}/overview`),
};

export default newFilingService;
