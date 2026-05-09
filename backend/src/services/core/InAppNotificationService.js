const { InAppNotification } = require('../../models');
const enterpriseLogger = require('../../utils/logger');

class InAppNotificationService {
  static async notify(userId, type, message, { actionUrl = null, metadata = {} } = {}) {
    try {
      await InAppNotification.create({ userId, type, message, actionUrl, metadata });
    } catch (err) {
      enterpriseLogger.error('Failed to create in-app notification', { userId, type, error: err.message });
    }
  }

  static async notifyFilingStateChange(userId, filingId, newState) {
    const messages = {
      submitted_to_eri: 'Your ITR has been submitted for processing.',
      eri_in_progress: 'Your ITR submission is being processed by the Income Tax Department.',
      eri_success: 'Your ITR has been successfully filed! Check your acknowledgment.',
      eri_failed: 'Your ITR submission encountered an error. Please review and retry.',
      review_pending: 'Your filing is pending CA review.',
      approved_by_ca: 'Your filing has been approved by your CA.',
    };
    const msg = messages[newState] || `Filing status updated to: ${newState}`;
    await this.notify(userId, 'filing_state', msg, {
      actionUrl: `/filing/${filingId}`,
      metadata: { filingId, newState },
    });
  }

  static async notifySecurityEvent(userId, message) {
    await this.notify(userId, 'security', message);
  }
}

module.exports = InAppNotificationService;
