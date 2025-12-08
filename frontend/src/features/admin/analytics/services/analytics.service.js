// =====================================================
// ADMIN ANALYTICS SERVICE
// API service for admin dashboard & analytics operations
// =====================================================

import api from '../../../../services/api';

export const adminAnalyticsService = {
  getDashboardStats: async () => {
    const response = await api.get('/admin/dashboard/stats');
    return response.data?.data?.stats || response.data?.stats || response.data;
  },

  getChartData: async (type, params = {}) => {
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        queryParams.append(key, params[key]);
      }
    });

    const response = await api.get(`/admin/dashboard/charts/${type}?${queryParams.toString()}`);
    return response.data?.data?.chartData || response.data?.chartData || response.data;
  },

  getSystemAlerts: async () => {
    const response = await api.get('/admin/dashboard/alerts');
    return response.data?.data || response.data;
  },

  getRecentActivity: async (params = {}) => {
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        queryParams.append(key, params[key]);
      }
    });

    const response = await api.get(`/admin/activity?${queryParams.toString()}`);
    return response.data?.data || response.data;
  },

  getUserAnalytics: async (params = {}) => {
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        queryParams.append(key, params[key]);
      }
    });

    const response = await api.get(`/admin/analytics/users?${queryParams.toString()}`);
    return response.data;
  },

  getRevenueAnalytics: async (params = {}) => {
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        queryParams.append(key, params[key]);
      }
    });

    const response = await api.get(`/admin/analytics/revenue?${queryParams.toString()}`);
    return response.data;
  },

  getAnalytics: async (params = {}) => {
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        queryParams.append(key, params[key]);
      }
    });

    const response = await api.get(`/admin/analytics?${queryParams.toString()}`);
    return response.data?.data || response.data;
  },

  getCAAnalytics: async (params = {}) => {
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        queryParams.append(key, params[key]);
      }
    });

    const response = await api.get(`/admin/analytics/ca?${queryParams.toString()}`);
    return response.data?.data || response.data;
  },
};

export default adminAnalyticsService;

