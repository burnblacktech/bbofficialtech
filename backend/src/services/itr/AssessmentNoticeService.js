// =====================================================
// ASSESSMENT NOTICE SERVICE
// Service for managing assessment notices from Income Tax Department
// =====================================================

const enterpriseLogger = require('../../utils/logger');
const { AppError } = require('../../middleware/errorHandler');
const { AssessmentNotice, ITRFiling } = require('../../models');
const { query: dbQuery } = require('../../utils/dbQuery');
const eriIntegrationService = require('../eri/ERIIntegrationService');
const sseNotificationService = require('../utils/NotificationService');

class AssessmentNoticeService {
  constructor() {
    this.isLiveMode = process.env.FEATURE_ERI_LIVE === 'true';
  }

  /**
   * Create a new assessment notice record
   * @param {string} userId - User ID
   * @param {object} noticeData - Notice data
   * @returns {Promise<object>} - Created notice
   */
  async createNotice(userId, noticeData) {
    try {
      const {
        filingId,
        noticeNumber,
        noticeType,
        assessmentYear,
        receivedDate,
        dueDate,
        subject,
        description,
        amount,
        documentUrl,
        metadata = {},
      } = noticeData;

      // Validate notice number uniqueness
      const existing = await AssessmentNotice.findOne({
        where: { noticeNumber },
      });

      if (existing) {
        throw new AppError('Notice with this number already exists', 400);
      }

      const timeline = [{
        status: 'pending',
        date: new Date().toISOString(),
        message: 'Assessment notice received',
      }];

      const notice = await AssessmentNotice.create({
        userId,
        filingId: filingId || null,
        noticeNumber,
        noticeType,
        assessmentYear,
        receivedDate: receivedDate || new Date(),
        dueDate,
        subject,
        description,
        amount: amount || null,
        documentUrl: documentUrl || null,
        status: 'pending',
        timeline,
        metadata,
      });

      enterpriseLogger.info('Assessment notice created', {
        noticeId: notice.id,
        userId,
        noticeNumber,
        noticeType,
      });

      // Send notification
      await this.sendNoticeNotification(userId, notice.id, 'received');

      return await this.getNoticeById(notice.id);
    } catch (error) {
      enterpriseLogger.error('Failed to create assessment notice', {
        userId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get notice by ID
   * @param {string} noticeId - Notice ID
   * @param {string} userId - User ID (for authorization)
   * @returns {Promise<object>} - Notice details
   */
  async getNoticeById(noticeId, userId = null) {
    try {
      const where = { id: noticeId };
      if (userId) {
        where.userId = userId;
      }

      const notice = await AssessmentNotice.findOne({
        where,
        include: [{
          model: ITRFiling,
          as: 'filing',
          attributes: ['id', 'ackNumber', 'assessmentYear', 'itrType', 'status'],
        }],
      });

      if (!notice) {
        throw new AppError('Assessment notice not found', 404);
      }

      return {
        id: notice.id,
        filingId: notice.filingId,
        userId: notice.userId,
        noticeNumber: notice.noticeNumber,
        noticeType: notice.noticeType,
        assessmentYear: notice.assessmentYear,
        status: notice.status,
        receivedDate: notice.receivedDate,
        dueDate: notice.dueDate,
        respondedAt: notice.respondedAt,
        resolvedAt: notice.resolvedAt,
        subject: notice.subject,
        description: notice.description,
        amount: notice.amount ? parseFloat(notice.amount) : null,
        documentUrl: notice.documentUrl,
        responseText: notice.responseText,
        responseDocuments: notice.responseDocuments || [],
        timeline: notice.timeline || [],
        metadata: notice.metadata || {},
        isOverdue: notice.dueDate ? new Date(notice.dueDate) < new Date() && notice.status !== 'resolved' && notice.status !== 'closed' : false,
        daysUntilDue: notice.dueDate ? Math.ceil((new Date(notice.dueDate) - new Date()) / (1000 * 60 * 60 * 24)) : null,
        filing: notice.filing,
      };
    } catch (error) {
      enterpriseLogger.error('Failed to get assessment notice', {
        noticeId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get all notices for a user
   * @param {string} userId - User ID
   * @param {object} filters - Optional filters (status, noticeType, assessmentYear)
   * @returns {Promise<Array>} - Array of notices
   */
  async getUserNotices(userId, filters = {}) {
    try {
      const { status, noticeType, assessmentYear, page = 1, limit = 20 } = filters;
      const offset = (page - 1) * limit;

      const where = { userId };
      if (status) where.status = status;
      if (noticeType) where.noticeType = noticeType;
      if (assessmentYear) where.assessmentYear = assessmentYear;

      const { count, rows: notices } = await AssessmentNotice.findAndCountAll({
        where,
        include: [{
          model: ITRFiling,
          as: 'filing',
          attributes: ['id', 'ackNumber', 'assessmentYear', 'itrType'],
        }],
        order: [['receivedDate', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset),
      });

      return {
        notices: notices.map(notice => ({
          id: notice.id,
          filingId: notice.filingId,
          noticeNumber: notice.noticeNumber,
          noticeType: notice.noticeType,
          assessmentYear: notice.assessmentYear,
          status: notice.status,
          receivedDate: notice.receivedDate,
          dueDate: notice.dueDate,
          subject: notice.subject,
          amount: notice.amount ? parseFloat(notice.amount) : null,
          isOverdue: notice.dueDate ? new Date(notice.dueDate) < new Date() && notice.status !== 'resolved' && notice.status !== 'closed' : false,
          daysUntilDue: notice.dueDate ? Math.ceil((new Date(notice.dueDate) - new Date()) / (1000 * 60 * 60 * 24)) : null,
          filing: notice.filing,
        })),
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit),
        },
      };
    } catch (error) {
      enterpriseLogger.error('Failed to get user notices', {
        userId,
        error: error.message,
      });
      throw new AppError(`Failed to get notices: ${error.message}`, 500);
    }
  }

  /**
   * Update notice status
   * @param {string} noticeId - Notice ID
   * @param {string} userId - User ID
   * @param {string} status - New status
   * @param {object} updateData - Additional update data
   * @returns {Promise<object>} - Updated notice
   */
  async updateNoticeStatus(noticeId, userId, status, updateData = {}) {
    try {
      const validStatuses = ['pending', 'acknowledged', 'responded', 'resolved', 'disputed', 'closed'];
      if (!validStatuses.includes(status)) {
        throw new AppError(`Invalid notice status: ${status}`, 400);
      }

      const notice = await AssessmentNotice.findOne({
        where: { id: noticeId, userId },
      });

      if (!notice) {
        throw new AppError('Assessment notice not found', 404);
      }

      const timeline = notice.timeline || [];
      const oldStatus = notice.status;

      // Add timeline entry
      timeline.push({
        status,
        date: new Date().toISOString(),
        message: updateData.message || `Status updated to ${status}`,
        ...updateData,
      });

      const updateFields = {
        status,
        timeline,
      };

      if (status === 'acknowledged' && !notice.respondedAt) {
        // Auto-set acknowledged date
        updateFields.acknowledgedAt = new Date();
      }

      if (status === 'responded' && !notice.respondedAt) {
        updateFields.respondedAt = new Date();
        if (updateData.responseText) updateFields.responseText = updateData.responseText;
        if (updateData.responseDocuments) updateFields.responseDocuments = updateData.responseDocuments;
      }

      if (status === 'resolved' && !notice.resolvedAt) {
        updateFields.resolvedAt = new Date();
      }

      await notice.update(updateFields);

      // Send notification if status changed
      if (oldStatus !== status) {
        await this.sendNoticeNotification(userId, noticeId, status);
      }

      enterpriseLogger.info('Assessment notice status updated', {
        noticeId,
        oldStatus,
        newStatus: status,
      });

      return await this.getNoticeById(noticeId, userId);
    } catch (error) {
      enterpriseLogger.error('Failed to update notice status', {
        noticeId,
        userId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Submit response to notice
   * @param {string} noticeId - Notice ID
   * @param {string} userId - User ID
   * @param {object} responseData - Response data
   * @returns {Promise<object>} - Updated notice
   */
  async submitResponse(noticeId, userId, responseData) {
    try {
      const { responseText, responseDocuments = [] } = responseData;

      if (!responseText && (!responseDocuments || responseDocuments.length === 0)) {
        throw new AppError('Response text or documents are required', 400);
      }

      return await this.updateNoticeStatus(noticeId, userId, 'responded', {
        responseText,
        responseDocuments,
        message: 'Response submitted to assessment notice',
      });
    } catch (error) {
      enterpriseLogger.error('Failed to submit notice response', {
        noticeId,
        userId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Check for new notices from Income Tax Portal
   * @param {string} userId - User ID
   * @returns {Promise<Array>} - Array of new notices
   */
  async checkNoticesFromPortal(userId) {
    try {
      enterpriseLogger.info('Checking assessment notices from portal', { userId });

      if (!this.isLiveMode) {
        // Mock implementation - return empty array
        return [];
      }

      // In live mode, call ERI/ITD API to check for notices
      // This would integrate with actual ITD portal API
      const portalNotices = await this.fetchNoticesFromERI(userId);

      const newNotices = [];
      for (const portalNotice of portalNotices) {
        // Check if notice already exists
        const existing = await AssessmentNotice.findOne({
          where: { noticeNumber: portalNotice.noticeNumber },
        });

        if (!existing) {
          const notice = await this.createNotice(userId, portalNotice);
          newNotices.push(notice);
        }
      }

      return newNotices;
    } catch (error) {
      enterpriseLogger.error('Failed to check notices from portal', {
        userId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Fetch notices from ERI (mock for now)
   * @param {string} userId - User ID
   * @returns {Promise<Array>} - Notices from portal
   */
  async fetchNoticesFromERI(userId) {
    // This would call actual ERI API
    // For now, returning empty array
    return [];
  }

  /**
   * Get overdue notices for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} - Array of overdue notices
   */
  async getOverdueNotices(userId) {
    try {
      const notices = await AssessmentNotice.findAll({
        where: {
          userId,
          status: {
            [require('sequelize').Op.in]: ['pending', 'acknowledged'],
          },
          dueDate: {
            [require('sequelize').Op.lt]: new Date(),
          },
        },
        order: [['dueDate', 'ASC']],
      });

      return notices.map(notice => ({
        id: notice.id,
        noticeNumber: notice.noticeNumber,
        noticeType: notice.noticeType,
        subject: notice.subject,
        dueDate: notice.dueDate,
        daysOverdue: Math.ceil((new Date() - new Date(notice.dueDate)) / (1000 * 60 * 60 * 24)),
      }));
    } catch (error) {
      enterpriseLogger.error('Failed to get overdue notices', {
        userId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Send notice notification
   * @param {string} userId - User ID
   * @param {string} noticeId - Notice ID
   * @param {string} event - Event type (received, due_soon, overdue, etc.)
   */
  async sendNoticeNotification(userId, noticeId, event) {
    try {
      const notice = await AssessmentNotice.findByPk(noticeId);
      if (!notice) return;

      const messages = {
        received: `New assessment notice received: ${notice.noticeNumber}`,
        due_soon: `Assessment notice ${notice.noticeNumber} is due soon`,
        overdue: `Assessment notice ${notice.noticeNumber} is overdue`,
        responded: `Response submitted for notice ${notice.noticeNumber}`,
        resolved: `Assessment notice ${notice.noticeNumber} has been resolved`,
      };

      const message = messages[event] || `Assessment notice ${notice.noticeNumber} status updated`;

      if (sseNotificationService && typeof sseNotificationService.sendToUser === 'function') {
        sseNotificationService.sendToUser(userId, 'assessment_notice', {
          title: 'Assessment Notice Update',
          message,
          noticeId,
          noticeNumber: notice.noticeNumber,
          status: notice.status,
          priority: event === 'overdue' ? 'high' : 'normal',
        });
      }
    } catch (error) {
      enterpriseLogger.error('Failed to send notice notification', {
        userId,
        noticeId,
        error: error.message,
      });
      // Don't throw - notification failure shouldn't break the flow
    }
  }
}

module.exports = new AssessmentNoticeService();

