// =====================================================
// USER DASHBOARD SERVICE - BACKEND INTEGRATION
// =====================================================

import apiClient from './core/APIClient';

class UserDashboardService {
  /**
   * Get user dashboard data
   */
  async getDashboardData() {
    try {
      const response = await apiClient.get('/users/dashboard');
            return response.data;
        } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
            throw error;
        }
    }

  /**
   * Get user profile
   */
  async getUserProfile() {
    try {
      const response = await apiClient.get('/users/profile');
            return response.data;
        } catch (error) {
      console.error('Failed to fetch user profile:', error);
            throw error;
        }
    }

  /**
   * Update user profile
   */
  async updateUserProfile(profileData) {
    try {
      const response = await apiClient.put('/users/profile', profileData);
            return response.data;
        } catch (error) {
      console.error('Failed to update user profile:', error);
            throw error;
        }
    }

  /**
   * Change user password
   */
  async changePassword(passwordData) {
    try {
      const response = await apiClient.put('/users/password', passwordData);
            return response.data;
        } catch (error) {
      console.error('Failed to change password:', error);
            throw error;
        }
    }

  /**
   * Get user settings
   */
  async getUserSettings() {
    try {
      const response = await apiClient.get('/users/settings');
            return response.data;
        } catch (error) {
      console.error('Failed to fetch user settings:', error);
            throw error;
        }
    }

  /**
   * Update user settings
   */
  async updateUserSettings(settingsData) {
    try {
      const response = await apiClient.put('/users/settings', settingsData);
            return response.data;
        } catch (error) {
      console.error('Failed to update user settings:', error);
            throw error;
        }
    }

  /**
   * Get user notifications
   */
  async getUserNotifications(params = {}) {
    try {
      const response = await apiClient.get('/users/notifications', { params });
            return response.data;
        } catch (error) {
      console.error('Failed to fetch notifications:', error);
            throw error;
        }
    }

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(notificationId) {
    try {
      const response = await apiClient.put(`/users/notifications/${notificationId}/read`);
            return response.data;
        } catch (error) {
      console.error('Failed to mark notification as read:', error);
            throw error;
        }
    }

  /**
   * Mark all notifications as read
   */
  async markAllNotificationsAsRead() {
    try {
      const response = await apiClient.put('/users/notifications/read-all');
            return response.data;
        } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
            throw error;
        }
    }
}

// Create singleton instance
const userDashboardService = new UserDashboardService();

export default userDashboardService;