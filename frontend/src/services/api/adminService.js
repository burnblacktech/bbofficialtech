// =====================================================
// ADMIN SERVICE
// Admin operations using unified API client
// =====================================================

import apiClient from '../core/APIClient';
import errorHandler from '../core/ErrorHandler';

class AdminService {
  /**
   * Get platform statistics
   * @param {string} timeRange - Time range (7d, 30d, 90d, 1y)
   * @returns {Promise<Object>} Platform stats data
   */
  async getPlatformStats(timeRange = '30d') {
    try {
      const response = await apiClient.get('/admin/platform/stats', {
        params: { timeRange },
      });
      return response.data?.data || {};
    } catch (error) {
      errorHandler.handle(error);
      throw error;
    }
  }

  /**
   * Get platform settings
   * @returns {Promise<Object>} Settings data
   */
  async getSettings() {
    try {
      const response = await apiClient.get('/admin/settings');
      return response.data?.data || {};
    } catch (error) {
      errorHandler.handle(error);
      throw error;
    }
  }

  /**
   * Update platform settings
   * @param {Object} settings - Settings to update
   * @returns {Promise<Object>} Updated settings
   */
  async updateSettings(settings) {
    try {
      const response = await apiClient.put('/admin/settings', settings);
      return response.data?.data;
    } catch (error) {
      errorHandler.handle(error);
      throw error;
    }
  }

  /**
   * Get CA firms statistics
   * @returns {Promise<Array>} CA firms with stats
   */
  async getCAFirmsStats() {
    try {
      const response = await apiClient.get('/admin/ca-firms/stats');
      return response.data?.data || [];
    } catch (error) {
      errorHandler.handle(error);
      throw error;
    }
  }

  /**
   * Get user limits
   * @returns {Promise<Object>} User limits data
   */
  async getUserLimits() {
    try {
      const response = await apiClient.get('/admin/users/limits');
      return response.data?.data || {};
    } catch (error) {
      errorHandler.handle(error);
      throw error;
    }
  }

  /**
   * Get system health metrics
   * @returns {Promise<Object>} System health data
   */
  async getSystemHealth() {
    try {
      const response = await apiClient.get('/admin/system/health');
      return response.data?.data || {};
    } catch (error) {
      errorHandler.handle(error);
      throw error;
    }
  }

  /**
   * Get top performing CA firms
   * @returns {Promise<Array>} Top performers data
   */
  async getTopPerformers() {
    try {
      const response = await apiClient.get('/admin/cas/top-performers');
      return response.data?.data || [];
    } catch (error) {
      errorHandler.handle(error);
      throw error;
    }
  }

  /**
   * Get system metrics
   * @returns {Promise<Object>} System metrics data
   */
  async getSystemMetrics() {
    try {
      const response = await apiClient.get('/admin/system/metrics');
      return response.data?.data || {};
    } catch (error) {
      errorHandler.handle(error);
      throw error;
    }
  }

  /**
   * Get system errors
   * @param {Object} params - Query parameters (severity, limit, startDate, endDate)
   * @returns {Promise<Object>} System errors data
   */
  async getSystemErrors(params = {}) {
    try {
      const response = await apiClient.get('/admin/system/errors', { params });
      return response.data?.data || {};
    } catch (error) {
      errorHandler.handle(error);
      throw error;
    }
  }

  /**
   * Approve CA firm
   * @param {string} firmId - CA firm ID
   * @returns {Promise<Object>} Approved firm data
   */
  async approveCA(firmId) {
    try {
      const response = await apiClient.post(`/admin/cas/${firmId}/approve`);
      return response.data?.data;
    } catch (error) {
      errorHandler.handle(error);
      throw error;
    }
  }

  /**
   * Reject CA firm
   * @param {string} firmId - CA firm ID
   * @param {string} reason - Rejection reason
   * @returns {Promise<Object>} Rejected firm data
   */
  async rejectCA(firmId, reason) {
    try {
      const response = await apiClient.post(`/admin/cas/${firmId}/reject`, { reason });
      return response.data?.data;
    } catch (error) {
      errorHandler.handle(error);
      throw error;
    }
  }

  /**
   * Suspend CA firm
   * @param {string} firmId - CA firm ID
   * @param {string} reason - Suspension reason
   * @returns {Promise<Object>} Suspended firm data
   */
  async suspendCA(firmId, reason) {
    try {
      const response = await apiClient.post(`/admin/cas/${firmId}/suspend`, { reason });
      return response.data?.data;
    } catch (error) {
      errorHandler.handle(error);
      throw error;
    }
  }

  /**
   * Get CA performance metrics
   * @param {string} firmId - CA firm ID
   * @returns {Promise<Object>} CA performance data
   */
  async getCAPerformance(firmId) {
    try {
      const response = await apiClient.get(`/admin/cas/${firmId}/performance`);
      return response.data?.data || {};
    } catch (error) {
      errorHandler.handle(error);
      throw error;
    }
  }

  /**
   * Get CA payouts
   * @param {string} status - Payout status filter (pending, all)
   * @returns {Promise<Array>} Payouts data
   */
  async getCAPayouts(status = 'pending') {
    try {
      const response = await apiClient.get('/admin/cas/payouts', {
        params: { status },
      });
      return response.data?.data || [];
    } catch (error) {
      errorHandler.handle(error);
      throw error;
    }
  }

  /**
   * Process CA payouts
   * @param {Array<string>} firmIds - Array of firm IDs to process
   * @returns {Promise<Object>} Processed payouts data
   */
  async processCAPayouts(firmIds) {
    try {
      const response = await apiClient.post('/admin/cas/payouts/process', { firmIds });
      return response.data?.data;
    } catch (error) {
      errorHandler.handle(error);
      throw error;
    }
  }

  /**
   * Get CA verification queue
   * @param {Object} params - Query parameters (status, limit, offset)
   * @returns {Promise<Object>} Verification queue data
   */
  async getCAVerificationQueue(params = {}) {
    try {
      const response = await apiClient.get('/admin/cas/verification-queue', { params });
      return response.data?.data || {};
    } catch (error) {
      errorHandler.handle(error);
      throw error;
    }
  }

  /**
   * Approve CA verification
   * @param {string} firmId - CA firm ID
   * @param {Object} data - Approval data (notes, etc.)
   * @returns {Promise<Object>} Approved firm data
   */
  async approveCAVerification(firmId, data = {}) {
    try {
      const response = await apiClient.post(`/admin/cas/verification/${firmId}/approve`, data);
      return response.data?.data;
    } catch (error) {
      errorHandler.handle(error);
      throw error;
    }
  }

  /**
   * Reject CA verification
   * @param {string} firmId - CA firm ID
   * @param {Object} data - Rejection data (reason, notes)
   * @returns {Promise<Object>} Rejected firm data
   */
  async rejectCAVerification(firmId, data) {
    try {
      const response = await apiClient.post(`/admin/cas/verification/${firmId}/reject`, data);
      return response.data?.data;
    } catch (error) {
      errorHandler.handle(error);
      throw error;
    }
  }

  /**
   * Get CA payout history
   * @param {string} firmId - CA firm ID
   * @param {Object} params - Query parameters (limit, offset)
   * @returns {Promise<Object>} Payout history data
   */
  async getCAPayoutHistory(firmId, params = {}) {
    try {
      const response = await apiClient.get(`/admin/cas/${firmId}/payout-history`, { params });
      return response.data?.data || {};
    } catch (error) {
      errorHandler.handle(error);
      throw error;
    }
  }

  /**
   * Schedule recurring payouts
   * @param {Object} data - Schedule data (scheduleType, dayOfMonth, time)
   * @returns {Promise<Object>} Schedule data
   */
  async scheduleCAPayouts(data) {
    try {
      const response = await apiClient.post('/admin/cas/payouts/schedule', data);
      return response.data?.data;
    } catch (error) {
      errorHandler.handle(error);
      throw error;
    }
  }

  /**
   * Get transaction statistics
   * @param {Object} params - Query parameters (timeRange, startDate, endDate)
   * @returns {Promise<Object>} Transaction statistics
   */
  async getTransactionStats(params = {}) {
    try {
      const response = await apiClient.get('/admin/financial/transactions/stats', { params });
      return response.data?.data || {};
    } catch (error) {
      errorHandler.handle(error);
      throw error;
    }
  }

  /**
   * Get transactions
   * @param {Object} params - Query parameters (status, paymentStatus, paymentMethod, invoiceNumber, startDate, endDate, userId, minAmount, maxAmount, disputed, limit, offset)
   * @returns {Promise<Object>} Transactions data
   */
  async getTransactions(params = {}) {
    try {
      const response = await apiClient.get('/admin/financial/transactions', { params });
      return response.data?.data || {};
    } catch (error) {
      errorHandler.handle(error);
      throw error;
    }
  }

  /**
   * Get transaction details
   * @param {string} transactionId - Transaction ID
   * @returns {Promise<Object>} Transaction details with related transactions
   */
  async getTransactionDetails(transactionId) {
    try {
      const response = await apiClient.get(`/admin/financial/transactions/${transactionId}`);
      return response.data?.data || {};
    } catch (error) {
      errorHandler.handle(error);
      throw error;
    }
  }

  /**
   * Add notes to a transaction
   * @param {string} transactionId - Transaction ID
   * @param {string} notes - Notes content
   * @returns {Promise<Object>} Updated notes
   */
  async addTransactionNotes(transactionId, notes) {
    try {
      const response = await apiClient.post(`/admin/financial/transactions/${transactionId}/notes`, { notes });
      return response.data?.data;
    } catch (error) {
      errorHandler.handle(error);
      throw error;
    }
  }

  /**
   * Mark transaction as disputed
   * @param {string} transactionId - Transaction ID
   * @param {Object} data - Dispute data (reason, details)
   * @returns {Promise<Object>} Updated transaction
   */
  async markAsDisputed(transactionId, data) {
    try {
      const response = await apiClient.post(`/admin/financial/transactions/${transactionId}/dispute`, data);
      return response.data?.data;
    } catch (error) {
      errorHandler.handle(error);
      throw error;
    }
  }

  /**
   * Resolve dispute
   * @param {string} transactionId - Transaction ID
   * @param {Object} data - Resolution data (resolution, notes)
   * @returns {Promise<Object>} Updated transaction
   */
  async resolveDispute(transactionId, data) {
    try {
      const response = await apiClient.post(`/admin/financial/transactions/${transactionId}/resolve-dispute`, data);
      return response.data?.data;
    } catch (error) {
      errorHandler.handle(error);
      throw error;
    }
  }

  /**
   * Retry failed payment
   * @param {string} transactionId - Transaction ID
   * @returns {Promise<Object>} Updated transaction
   */
  async retryFailedPayment(transactionId) {
    try {
      const response = await apiClient.post(`/admin/financial/transactions/${transactionId}/retry`);
      return response.data?.data;
    } catch (error) {
      errorHandler.handle(error);
      throw error;
    }
  }

  /**
   * Process refund for a transaction
   * @param {string} transactionId - Transaction ID
   * @param {Object} data - Refund data (amount, reason, refundType)
   * @returns {Promise<Object>} Refund result
   */
  async processRefund(transactionId, data) {
    try {
      const response = await apiClient.post(`/admin/financial/transactions/${transactionId}/refund`, data);
      return response.data?.data;
    } catch (error) {
      errorHandler.handle(error);
      throw error;
    }
  }

  /**
   * Export transactions
   * @param {Object} params - Export parameters (format, filters)
   * @returns {Promise<string|Object>} Exported data (CSV string or JSON object)
   */
  async exportTransactions(params = {}) {
    try {
      const response = await apiClient.get('/admin/financial/transactions/export', {
        params,
        responseType: params.format === 'csv' ? 'text' : 'json',
      });
      return response.data;
    } catch (error) {
      errorHandler.handle(error);
      throw error;
    }
  }

  /**
   * Get refunds
   * @param {Object} params - Query parameters (status, startDate, endDate, userId, limit, offset)
   * @returns {Promise<Object>} Refunds data
   */
  async getRefunds(params = {}) {
    try {
      const response = await apiClient.get('/admin/financial/refunds', { params });
      return response.data?.data || {};
    } catch (error) {
      errorHandler.handle(error);
      throw error;
    }
  }

  /**
   * Approve refund request
   * @param {string} refundId - Refund ID
   * @param {Object} data - Approval data (notes)
   * @returns {Promise<Object>} Approved refund data
   */
  async approveRefund(refundId, data = {}) {
    try {
      const response = await apiClient.post(`/admin/financial/refunds/${refundId}/approve`, data);
      return response.data?.data;
    } catch (error) {
      errorHandler.handle(error);
      throw error;
    }
  }

  /**
   * Reject refund request
   * @param {string} refundId - Refund ID
   * @param {Object} data - Rejection data (reason, notes)
   * @returns {Promise<Object>} Rejected refund data
   */
  async rejectRefund(refundId, data) {
    try {
      const response = await apiClient.post(`/admin/financial/refunds/${refundId}/reject`, data);
      return response.data?.data;
    } catch (error) {
      errorHandler.handle(error);
      throw error;
    }
  }

  /**
   * Process approved refund
   * @param {string} refundId - Refund ID
   * @returns {Promise<Object>} Processed refund data
   */
  async processRefundRequest(refundId) {
    try {
      const response = await apiClient.post(`/admin/financial/refunds/${refundId}/process`);
      return response.data?.data;
    } catch (error) {
      errorHandler.handle(error);
      throw error;
    }
  }

  /**
   * Get pricing plans
   * @param {Object} params - Query parameters (isActive, limit, offset)
   * @returns {Promise<Object>} Pricing plans data
   */
  async getPricingPlans(params = {}) {
    try {
      const response = await apiClient.get('/admin/financial/pricing/plans', { params });
      return response.data?.data || {};
    } catch (error) {
      errorHandler.handle(error);
      throw error;
    }
  }

  /**
   * Create pricing plan
   * @param {Object} data - Plan data
   * @returns {Promise<Object>} Created plan data
   */
  async createPricingPlan(data) {
    try {
      const response = await apiClient.post('/admin/financial/pricing/plans', data);
      return response.data?.data;
    } catch (error) {
      errorHandler.handle(error);
      throw error;
    }
  }

  /**
   * Update pricing plan
   * @param {string} planId - Plan ID
   * @param {Object} data - Update data
   * @returns {Promise<Object>} Updated plan data
   */
  async updatePricingPlan(planId, data) {
    try {
      const response = await apiClient.put(`/admin/financial/pricing/plans/${planId}`, data);
      return response.data?.data;
    } catch (error) {
      errorHandler.handle(error);
      throw error;
    }
  }

  /**
   * Delete pricing plan
   * @param {string} planId - Plan ID
   * @returns {Promise<Object>} Deletion result
   */
  async deletePricingPlan(planId) {
    try {
      const response = await apiClient.delete(`/admin/financial/pricing/plans/${planId}`);
      return response.data?.data;
    } catch (error) {
      errorHandler.handle(error);
      throw error;
    }
  }

  /**
   * Get coupons
   * @param {Object} params - Query parameters (isActive, limit, offset)
   * @returns {Promise<Object>} Coupons data
   */
  async getCoupons(params = {}) {
    try {
      const response = await apiClient.get('/admin/financial/coupons', { params });
      return response.data?.data || {};
    } catch (error) {
      errorHandler.handle(error);
      throw error;
    }
  }

  /**
   * Create coupon
   * @param {Object} data - Coupon data
   * @returns {Promise<Object>} Created coupon data
   */
  async createCoupon(data) {
    try {
      const response = await apiClient.post('/admin/financial/coupons', data);
      return response.data?.data;
    } catch (error) {
      errorHandler.handle(error);
      throw error;
    }
  }

  /**
   * Update coupon
   * @param {string} couponId - Coupon ID
   * @param {Object} data - Update data
   * @returns {Promise<Object>} Updated coupon data
   */
  async updateCoupon(couponId, data) {
    try {
      const response = await apiClient.put(`/admin/financial/coupons/${couponId}`, data);
      return response.data?.data;
    } catch (error) {
      errorHandler.handle(error);
      throw error;
    }
  }

  /**
   * Delete coupon
   * @param {string} couponId - Coupon ID
   * @returns {Promise<Object>} Deletion result
   */
  async deleteCoupon(couponId) {
    try {
      const response = await apiClient.delete(`/admin/financial/coupons/${couponId}`);
      return response.data?.data;
    } catch (error) {
      errorHandler.handle(error);
      throw error;
    }
  }

  /**
   * Get coupon usage statistics
   * @param {string} couponId - Coupon ID
   * @returns {Promise<Object>} Coupon usage data
   */
  async getCouponUsage(couponId) {
    try {
      const response = await apiClient.get(`/admin/financial/coupons/${couponId}/usage`);
      return response.data?.data || {};
    } catch (error) {
      errorHandler.handle(error);
      throw error;
    }
  }

  /**
   * Get admin tickets
   * @param {Object} params - Query parameters (status, ticketType, priority, assignedTo, userId, filingId, caFirmId, category, search, limit, offset, sortBy, sortOrder)
   * @returns {Promise<Object>} Tickets data
   */
  async getAdminTickets(params = {}) {
    try {
      const response = await apiClient.get('/admin/support/tickets', { params });
      return response.data?.data || {};
    } catch (error) {
      errorHandler.handle(error);
      throw error;
    }
  }

  /**
   * Update admin ticket
   * @param {string} ticketId - Ticket ID
   * @param {Object} data - Update data
   * @returns {Promise<Object>} Updated ticket data
   */
  async updateAdminTicket(ticketId, data) {
    try {
      const response = await apiClient.put(`/admin/support/tickets/${ticketId}`, data);
      return response.data?.data;
    } catch (error) {
      errorHandler.handle(error);
      throw error;
    }
  }

  /**
   * Assign ticket to agent
   * @param {string} ticketId - Ticket ID
   * @param {Object} data - Assignment data (assignedTo, caFirmId)
   * @returns {Promise<Object>} Updated ticket data
   */
  async assignTicket(ticketId, data) {
    try {
      const response = await apiClient.post(`/admin/support/tickets/${ticketId}/assign`, data);
      return response.data?.data;
    } catch (error) {
      errorHandler.handle(error);
      throw error;
    }
  }

  /**
   * Close ticket
   * @param {string} ticketId - Ticket ID
   * @param {Object} data - Closure data (resolution, resolutionNotes)
   * @returns {Promise<Object>} Updated ticket data
   */
  async closeTicket(ticketId, data) {
    try {
      const response = await apiClient.post(`/admin/support/tickets/${ticketId}/close`, data);
      return response.data?.data;
    } catch (error) {
      errorHandler.handle(error);
      throw error;
    }
  }

  /**
   * Get ticket statistics
   * @param {Object} params - Query parameters (startDate, endDate)
   * @returns {Promise<Object>} Ticket statistics
   */
  async getTicketStats(params = {}) {
    try {
      const response = await apiClient.get('/admin/support/tickets/stats', { params });
      return response.data?.data || {};
    } catch (error) {
      errorHandler.handle(error);
      throw error;
    }
  }

  /**
   * Get single ticket details with full history
   * @param {string} ticketId - Ticket ID
   * @returns {Promise<Object>} Ticket details with messages and SLA metrics
   */
  async getTicketDetails(ticketId) {
    try {
      const response = await apiClient.get(`/admin/support/tickets/${ticketId}`);
      return response.data?.data || {};
    } catch (error) {
      errorHandler.handle(error);
      throw error;
    }
  }

  /**
   * Add reply to ticket
   * @param {string} ticketId - Ticket ID
   * @param {Object} data - Reply data (message, isInternal, attachments)
   * @returns {Promise<Object>} Created message
   */
  async addTicketReply(ticketId, data) {
    try {
      const response = await apiClient.post(`/admin/support/tickets/${ticketId}/reply`, data);
      return response.data?.data;
    } catch (error) {
      errorHandler.handle(error);
      throw error;
    }
  }

  /**
   * Add internal note to ticket
   * @param {string} ticketId - Ticket ID
   * @param {string} note - Note content
   * @returns {Promise<Object>} Created note
   */
  async addTicketNote(ticketId, note) {
    try {
      const response = await apiClient.post(`/admin/support/tickets/${ticketId}/note`, { note });
      return response.data?.data;
    } catch (error) {
      errorHandler.handle(error);
      throw error;
    }
  }

  /**
   * Escalate ticket
   * @param {string} ticketId - Ticket ID
   * @param {Object} data - Escalation data (reason, escalateTo, newPriority)
   * @returns {Promise<Object>} Updated ticket
   */
  async escalateTicket(ticketId, data) {
    try {
      const response = await apiClient.post(`/admin/support/tickets/${ticketId}/escalate`, data);
      return response.data?.data;
    } catch (error) {
      errorHandler.handle(error);
      throw error;
    }
  }

  /**
   * Change ticket priority
   * @param {string} ticketId - Ticket ID
   * @param {Object} data - Priority data (priority, reason)
   * @returns {Promise<Object>} Updated ticket
   */
  async changeTicketPriority(ticketId, data) {
    try {
      const response = await apiClient.post(`/admin/support/tickets/${ticketId}/priority`, data);
      return response.data?.data;
    } catch (error) {
      errorHandler.handle(error);
      throw error;
    }
  }

  /**
   * Get user segments
   * @param {Object} params - Query parameters (isActive, limit, offset)
   * @returns {Promise<Object>} User segments data
   */
  async getUserSegments(params = {}) {
    try {
      const response = await apiClient.get('/admin/users/segments', { params });
      return response.data?.data || {};
    } catch (error) {
      errorHandler.handle(error);
      throw error;
    }
  }

  /**
   * Create user segment
   * @param {Object} data - Segment data (name, description, criteria, metadata)
   * @returns {Promise<Object>} Created segment data
   */
  async createUserSegment(data) {
    try {
      const response = await apiClient.post('/admin/users/segments', data);
      return response.data?.data;
    } catch (error) {
      errorHandler.handle(error);
      throw error;
    }
  }

  /**
   * Update user segment
   * @param {string} segmentId - Segment ID
   * @param {Object} data - Update data
   * @returns {Promise<Object>} Updated segment data
   */
  async updateUserSegment(segmentId, data) {
    try {
      const response = await apiClient.put(`/admin/users/segments/${segmentId}`, data);
      return response.data?.data;
    } catch (error) {
      errorHandler.handle(error);
      throw error;
    }
  }

  /**
   * Delete user segment
   * @param {string} segmentId - Segment ID
   * @returns {Promise<Object>} Deletion result
   */
  async deleteUserSegment(segmentId) {
    try {
      const response = await apiClient.delete(`/admin/users/segments/${segmentId}`);
      return response.data?.data;
    } catch (error) {
      errorHandler.handle(error);
      throw error;
    }
  }

  /**
   * Get segment members
   * @param {string} segmentId - Segment ID
   * @param {Object} params - Query parameters (limit, offset)
   * @returns {Promise<Object>} Segment members data
   */
  async getSegmentMembers(segmentId, params = {}) {
    try {
      const response = await apiClient.get(`/admin/users/segments/${segmentId}/members`, { params });
      return response.data?.data || {};
    } catch (error) {
      errorHandler.handle(error);
      throw error;
    }
  }

  // =====================================================
  // AUDIT LOG METHODS
  // =====================================================

  /**
   * Get audit logs with filters
   * @param {Object} params - Query parameters (userId, action, resource, startDate, endDate, etc.)
   * @returns {Promise<Object>} Audit logs data
   */
  async getAuditLogs(params = {}) {
    try {
      const response = await apiClient.get('/admin/audit/logs', { params });
      return response.data?.data || {};
    } catch (error) {
      errorHandler.handle(error);
      throw error;
    }
  }

  /**
   * Get audit statistics
   * @param {Object} params - Query parameters (timeRange, startDate, endDate)
   * @returns {Promise<Object>} Audit statistics
   */
  async getAuditStats(params = {}) {
    try {
      const response = await apiClient.get('/admin/audit/stats', { params });
      return response.data?.data || {};
    } catch (error) {
      errorHandler.handle(error);
      throw error;
    }
  }

  /**
   * Get security logs
   * @param {Object} params - Query parameters (startDate, endDate, limit, offset)
   * @returns {Promise<Object>} Security logs
   */
  async getSecurityLogs(params = {}) {
    try {
      const response = await apiClient.get('/admin/audit/security', { params });
      return response.data?.data || {};
    } catch (error) {
      errorHandler.handle(error);
      throw error;
    }
  }

  /**
   * Get admin activity logs
   * @param {Object} params - Query parameters (adminUserId, startDate, endDate)
   * @returns {Promise<Object>} Admin activity logs
   */
  async getAdminActivityLogs(params = {}) {
    try {
      const response = await apiClient.get('/admin/audit/admin-activity', { params });
      return response.data?.data || {};
    } catch (error) {
      errorHandler.handle(error);
      throw error;
    }
  }

  /**
   * Export audit logs
   * @param {Object} params - Export parameters (format, filters)
   * @returns {Promise<string|Object>} Exported data
   */
  async exportAuditLogs(params = {}) {
    try {
      const response = await apiClient.get('/admin/audit/export', {
        params,
        responseType: params.format === 'csv' ? 'text' : 'json',
      });
      return response.data;
    } catch (error) {
      errorHandler.handle(error);
      throw error;
    }
  }

  /**
   * Get all users with pagination and filters
   * @param {Object} params - Query parameters (page, limit, role, status, search, sortBy, sortOrder)
   * @returns {Promise<Object>} Users data with pagination
   */
  async getUsers(params = {}) {
    try {
      const response = await apiClient.get('/admin/users', { params });
      return response.data?.data || {};
    } catch (error) {
      errorHandler.handle(error);
      throw error;
    }
  }
}

// Create singleton instance
const adminService = new AdminService();
export default adminService;

