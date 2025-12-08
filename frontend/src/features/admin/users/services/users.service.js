// =====================================================
// ADMIN USERS SERVICE
// API service for admin user management operations
// =====================================================

import api from '../../../../services/api';

const USERS_BASE_URL = '/admin/users';

export const adminUsersService = {
  /**
   * Get all users with pagination and filters
   */
  getUsers: async (params = {}) => {
    const {
      page = 1,
      limit = 20,
      search,
      role,
      status,
      userType,
      registrationDateFrom,
      registrationDateTo,
      lastLoginFrom,
      lastLoginTo,
      emailVerified,
      phoneVerified,
      panVerified,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = params;

    const queryParams = new URLSearchParams();
    queryParams.append('page', page);
    queryParams.append('limit', limit);
    if (search) queryParams.append('search', search);
    if (role) queryParams.append('role', role);
    if (status) queryParams.append('status', status);
    if (userType) queryParams.append('userType', userType);
    if (registrationDateFrom) queryParams.append('registrationDateFrom', registrationDateFrom);
    if (registrationDateTo) queryParams.append('registrationDateTo', registrationDateTo);
    if (lastLoginFrom) queryParams.append('lastLoginFrom', lastLoginFrom);
    if (lastLoginTo) queryParams.append('lastLoginTo', lastLoginTo);
    if (emailVerified !== undefined) queryParams.append('emailVerified', emailVerified);
    if (phoneVerified !== undefined) queryParams.append('phoneVerified', phoneVerified);
    if (panVerified !== undefined) queryParams.append('panVerified', panVerified);
    queryParams.append('sortBy', sortBy);
    queryParams.append('sortOrder', sortOrder);

    const response = await api.get(`${USERS_BASE_URL}?${queryParams.toString()}`);
    return response.data;
  },

  /**
   * Get user details
   */
  getUserDetails: async (userId) => {
    const response = await api.get(`${USERS_BASE_URL}/${userId}`);
    return response.data;
  },

  /**
   * Update user profile
   */
  updateUser: async (userId, data) => {
    const response = await api.put(`${USERS_BASE_URL}/${userId}`, data);
    return response.data;
  },

  /**
   * Update user status
   */
  updateUserStatus: async (userId, status, reason) => {
    const response = await api.put(`${USERS_BASE_URL}/${userId}/status`, { status, reason });
    return response.data;
  },

  /**
   * Activate user
   */
  activateUser: async (userId, reason) => {
    const response = await api.post(`${USERS_BASE_URL}/${userId}/activate`, { reason });
    return response.data;
  },

  /**
   * Deactivate user
   */
  deactivateUser: async (userId, reason) => {
    const response = await api.post(`${USERS_BASE_URL}/${userId}/deactivate`, { reason });
    return response.data;
  },

  /**
   * Suspend user
   */
  suspendUser: async (userId, reason) => {
    const response = await api.post(`${USERS_BASE_URL}/${userId}/suspend`, { reason });
    return response.data;
  },

  /**
   * Delete user (soft delete)
   */
  deleteUser: async (userId, reason, force = false) => {
    const response = await api.delete(`${USERS_BASE_URL}/${userId}`, {
      data: { reason, force },
    });
    return response.data;
  },

  /**
   * Reset user password
   */
  resetPassword: async (userId, reason) => {
    const response = await api.post(`${USERS_BASE_URL}/${userId}/reset-password`, { reason });
    return response.data;
  },

  /**
   * Invalidate all user sessions
   */
  invalidateSessions: async (userId, reason) => {
    const response = await api.post(`${USERS_BASE_URL}/${userId}/invalidate-sessions`, { reason });
    return response.data;
  },

  /**
   * Get user activity log
   */
  getUserActivity: async (userId, params = {}) => {
    const { limit = 100, offset = 0 } = params;
    const queryParams = new URLSearchParams();
    queryParams.append('limit', limit);
    queryParams.append('offset', offset);

    const response = await api.get(`${USERS_BASE_URL}/${userId}/activity?${queryParams.toString()}`);
    return response.data;
  },

  /**
   * Get user's filings
   */
  getUserFilings: async (userId, params = {}) => {
    const { page = 1, limit = 20, status, itrType } = params;
    const queryParams = new URLSearchParams();
    queryParams.append('page', page);
    queryParams.append('limit', limit);
    if (status) queryParams.append('status', status);
    if (itrType) queryParams.append('itrType', itrType);

    const response = await api.get(`${USERS_BASE_URL}/${userId}/filings?${queryParams.toString()}`);
    return response.data;
  },

  /**
   * Get user's transactions
   */
  getUserTransactions: async (userId, params = {}) => {
    const { page = 1, limit = 20, status, type } = params;
    const queryParams = new URLSearchParams();
    queryParams.append('page', page);
    queryParams.append('limit', limit);
    if (status) queryParams.append('status', status);
    if (type) queryParams.append('type', type);

    const response = await api.get(`${USERS_BASE_URL}/${userId}/transactions?${queryParams.toString()}`);
    return response.data;
  },

  /**
   * Bulk operations
   */
  bulkOperations: async (userIds, operation, data = {}) => {
    const response = await api.post(`${USERS_BASE_URL}/bulk`, {
      userIds,
      operation,
      data,
    });
    return response.data;
  },

  /**
   * Export users
   */
  exportUsers: async (format = 'csv', params = {}) => {
    const queryParams = new URLSearchParams();
    queryParams.append('format', format);
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        queryParams.append(key, params[key]);
      }
    });

    const response = await api.get(`${USERS_BASE_URL}/export?${queryParams.toString()}`, {
      responseType: format === 'csv' ? 'blob' : 'json',
    });
    return response.data;
  },

  /**
   * Impersonate user
   */
  impersonateUser: async (userId, reason) => {
    const response = await api.post(`/admin/auth/impersonate/${userId}`, { reason });
    return response.data;
  },

  /**
   * Stop impersonation
   */
  stopImpersonation: async () => {
    const response = await api.post('/admin/auth/stop-impersonation');
    return response.data;
  },

  /**
   * Get user notes
   */
  getUserNotes: async (userId) => {
    const response = await api.get(`${USERS_BASE_URL}/${userId}/notes`);
    return response.data;
  },

  /**
   * Create user note
   */
  createUserNote: async (userId, noteData) => {
    const response = await api.post(`${USERS_BASE_URL}/${userId}/notes`, noteData);
    return response.data;
  },

  /**
   * Update user note
   */
  updateUserNote: async (userId, noteId, noteData) => {
    const response = await api.put(`${USERS_BASE_URL}/${userId}/notes/${noteId}`, noteData);
    return response.data;
  },

  /**
   * Delete user note
   */
  deleteUserNote: async (userId, noteId) => {
    const response = await api.delete(`${USERS_BASE_URL}/${userId}/notes/${noteId}`);
    return response.data;
  },

  /**
   * Get user tags
   */
  getUserTags: async (userId) => {
    const response = await api.get(`${USERS_BASE_URL}/${userId}/tags`);
    return response.data;
  },

  /**
   * Add user tag
   */
  addUserTag: async (userId, tag) => {
    const response = await api.post(`${USERS_BASE_URL}/${userId}/tags`, { tag });
    return response.data;
  },

  /**
   * Remove user tag
   */
  removeUserTag: async (userId, tag) => {
    const response = await api.delete(`${USERS_BASE_URL}/${userId}/tags/${encodeURIComponent(tag)}`);
    return response.data;
  },

  /**
   * Get user groups
   */
  getUserGroups: async (params = {}) => {
    const response = await api.get('/admin/users/groups', { params });
    return response.data;
  },

  /**
   * Create user group
   */
  createUserGroup: async (groupData) => {
    const response = await api.post('/admin/users/groups', groupData);
    return response.data;
  },

  /**
   * Get user group
   */
  getUserGroup: async (groupId) => {
    const response = await api.get(`/admin/users/groups/${encodeURIComponent(groupId)}`);
    return response.data;
  },

  /**
   * Update user group
   */
  updateUserGroup: async (groupId, groupData) => {
    const response = await api.put(`/admin/users/groups/${encodeURIComponent(groupId)}`, groupData);
    return response.data;
  },

  /**
   * Delete user group
   */
  deleteUserGroup: async (groupId) => {
    const response = await api.delete(`/admin/users/groups/${encodeURIComponent(groupId)}`);
    return response.data;
  },

  /**
   * Get group members
   */
  getGroupMembers: async (groupId, params = {}) => {
    const response = await api.get(`/admin/users/groups/${encodeURIComponent(groupId)}/members`, { params });
    return response.data;
  },

  /**
   * Add group members
   */
  addGroupMembers: async (groupId, userIds) => {
    const response = await api.post(`/admin/users/groups/${encodeURIComponent(groupId)}/members`, { userIds });
    return response.data;
  },

  /**
   * Remove group member
   */
  removeGroupMember: async (groupId, userId) => {
    const response = await api.delete(`/admin/users/groups/${encodeURIComponent(groupId)}/members/${userId}`);
    return response.data;
  },

  /**
   * Get user templates
   */
  getUserTemplates: async () => {
    const response = await api.get('/admin/users/templates');
    return response.data;
  },

  /**
   * Create user template
   */
  createUserTemplate: async (templateData) => {
    const response = await api.post('/admin/users/templates', templateData);
    return response.data;
  },

  /**
   * Get user template
   */
  getUserTemplate: async (templateId) => {
    const response = await api.get(`/admin/users/templates/${templateId}`);
    return response.data;
  },

  /**
   * Update user template
   */
  updateUserTemplate: async (templateId, templateData) => {
    const response = await api.put(`/admin/users/templates/${templateId}`, templateData);
    return response.data;
  },

  /**
   * Delete user template
   */
  deleteUserTemplate: async (templateId) => {
    const response = await api.delete(`/admin/users/templates/${templateId}`);
    return response.data;
  },

  /**
   * Apply user template
   */
  applyUserTemplate: async (templateId, userId) => {
    const response = await api.post(`/admin/users/templates/${templateId}/apply`, { userId });
    return response.data;
  },
};

export default adminUsersService;

