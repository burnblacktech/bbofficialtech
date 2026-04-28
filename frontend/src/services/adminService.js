/**
 * adminService — API methods for all /api/admin/* endpoints.
 *
 * Uses the shared axios instance from api.js which handles
 * JWT attachment and token refresh automatically.
 */
import api from './api';

const adminService = {
  // ── Users ──
  getUsers: (params) => api.get('/admin/users', { params }).then((r) => r.data),
  getUserDetail: (userId) => api.get(`/admin/users/${userId}`).then((r) => r.data),
  deactivateUser: (userId) => api.post(`/admin/users/${userId}/deactivate`).then((r) => r.data),
  reactivateUser: (userId) => api.post(`/admin/users/${userId}/reactivate`).then((r) => r.data),
  resetPassword: (userId) => api.post(`/admin/users/${userId}/reset-password`).then((r) => r.data),
  getUserAudit: (userId, params) =>
    api.get(`/admin/users/${userId}/audit`, { params }).then((r) => r.data),

  // ── Filing Statistics ──
  getFilingStats: () => api.get('/admin/stats/filings').then((r) => r.data),
  getFilingTrends: (period) =>
    api.get('/admin/stats/filings/trends', { params: { period } }).then((r) => r.data),

  // ── Revenue ──
  getRevenue: () => api.get('/admin/revenue').then((r) => r.data),

  // ── ERI Monitor ──
  getERIData: () => api.get('/admin/eri').then((r) => r.data),

  // ── Coupons ──
  getCoupons: (params) => api.get('/admin/coupons', { params }).then((r) => r.data),
  createCoupon: (data) => api.post('/admin/coupons', data).then((r) => r.data),
  deactivateCoupon: (couponId) =>
    api.post(`/admin/coupons/${couponId}/deactivate`).then((r) => r.data),
  getCouponUsage: (couponId, params) =>
    api.get(`/admin/coupons/${couponId}/usage`, { params }).then((r) => r.data),

  // ── Filing Management ──
  createFiling: (data) => api.post('/admin/filings', data).then((r) => r.data),
  batchCreateFilings: (data) => api.post('/admin/filings/batch', data).then((r) => r.data),
  deleteAdminFiling: (filingId) => api.delete(`/admin/filings/${filingId}`).then((r) => r.data),
  getAdminFilings: (params) => api.get('/admin/filings', { params }).then((r) => r.data),

  // ── Filing Browser ──
  getFilingBrowser: (params) => api.get('/admin/filing-browser', { params }).then((r) => r.data),
  getFilingBrowserDetail: (filingId) => api.get(`/admin/filing-browser/${filingId}`).then((r) => r.data),
  exportFilingBrowser: (params) => api.get('/admin/filing-browser/export', { params }).then((r) => r.data),

  // ── Health ──
  getHealth: () => api.get('/admin/health').then((r) => r.data),
};

export default adminService;
