// Stub — dashboard service for MVP
import api from './api';
const dashboardService = {
  getDashboardData: async () => ({ filings: [], stats: {} }),
  getRecentActivity: async () => ({ activities: [] }),
};
export default dashboardService;
