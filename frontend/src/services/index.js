// =====================================================
// SERVICES INDEX - MVP exports
// =====================================================

import api from './api';
import { tokenStore } from './tokenStore';

// ── Auth Service ──
export const authService = {
  async login(credentials) {
    const res = await api.post('/auth/login', credentials);
    if (res.data.accessToken) {
      tokenStore.set(res.data.accessToken);
      localStorage.setItem('user', JSON.stringify(res.data.user));
    }
    return { success: true, user: res.data.user, accessToken: res.data.accessToken };
  },

  handleOAuthLogin(user, token, refreshToken) {
    tokenStore.set(token);
    localStorage.setItem('user', JSON.stringify(user));
    return { success: true, user };
  },

  async logout() {
    try { await api.post('/auth/logout'); } catch { /* ignore */ }
    // Clear ALL sensitive keys — not just accessToken/user
    tokenStore.clear();
    const keysToRemove = ['user', 'adminToken', 'adminUser', 'userId', 'rememberedEmail'];
    keysToRemove.forEach((k) => localStorage.removeItem(k));
    // Clear error logs that may contain userId/URLs
    Object.keys(localStorage).filter((k) => k.startsWith('error_')).forEach((k) => localStorage.removeItem(k));
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

  googleLoginRedirect() {
    const backendUrl = process.env.REACT_APP_API_URL
      || (process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:3002/api');
    const redirectBase = window.location.origin;
    window.location.href = `${backendUrl}/auth/google?redirectBase=${encodeURIComponent(redirectBase)}`;
  },

  async register(data) {
    const res = await api.post('/auth/register', data);
    return res.data;
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
