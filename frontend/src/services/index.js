// =====================================================
// SERVICES INDEX - MVP exports
// =====================================================

import api from './api';

// ── Auth Service ──
export const authService = {
  async login(credentials) {
    const res = await api.post('/auth/login', credentials);
    if (res.data.accessToken) {
      localStorage.setItem('accessToken', res.data.accessToken);
      localStorage.setItem('user', JSON.stringify(res.data.user));
    }
    return { success: true, user: res.data.user, accessToken: res.data.accessToken };
  },

  handleOAuthLogin(user, token, refreshToken) {
    localStorage.setItem('accessToken', token);
    localStorage.setItem('user', JSON.stringify(user));
    return { success: true, user };
  },

  async logout() {
    try { await api.post('/auth/logout'); } catch { /* ignore */ }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
  },

  async getProfile() {
    const res = await api.get('/auth/profile');
    return res.data.data || res.data;
  },

  async updateProfile(data) {
    const res = await api.put('/auth/profile', data);
    return { success: true, profile: res.data.user || res.data };
  },

  getCurrentUser() {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  },
};

// ── ITR / Filing Service ──
export const itrService = {
  async getUserITRs() {
    const res = await api.get('/filings');
    return { success: true, filings: res.data.data };
  },

  async createITR(data) {
    const res = await api.post('/filings', data);
    return { success: true, filing: res.data.data };
  },

  async getITR(filingId) {
    const res = await api.get(`/filings/${filingId}`);
    return { success: true, filing: res.data.data };
  },

  async updateITR(filingId, updates) {
    const res = await api.put(`/filings/${filingId}`, updates);
    return { success: true, filing: res.data.data };
  },

  async validateITR(filingId, section) {
    const res = await api.get(`/filings/${filingId}/readiness`);
    return { success: true, errors: res.data.data?.completionChecklist || {} };
  },

  async submitITR(filingId) {
    const res = await api.post(`/filings/${filingId}/submit`);
    return { success: true, data: res.data.data };
  },

  async computeTax(filingId, assessmentYear) {
    const res = await api.get(`/filings/${filingId}/tax-breakdown`);
    return { success: true, computation: res.data.data };
  },

  async deleteITR(filingId) {
    await api.delete(`/filings/${filingId}`);
    return { success: true };
  },
};

export default api;
