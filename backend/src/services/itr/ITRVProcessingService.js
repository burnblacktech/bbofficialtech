// =====================================================
// ITR-V PROCESSING SERVICE
// Service for tracking ITR-V generation, processing, and verification
// =====================================================

const enterpriseLogger = require('../../utils/logger');
const { AppError } = require('../../middleware/errorHandler');
const { ITRVProcessing, ITRFiling } = require('../../models');
const { query: dbQuery } = require('../../utils/dbQuery');
const eriIntegrationService = require('../eri/ERIIntegrationService');
const sseNotificationService = require('../utils/NotificationService');
const { ITR_DOMAIN_STATES } = require('../../domain/states');

class ITRVProcessingService {
  constructor() {
    this.isLiveMode = process.env.FEATURE_ERI_LIVE === 'true';
  }

  /**
   * Initialize ITR-V tracking for a filing
   * @param {string} filingId - Filing ID
   * @returns {Promise<object>} - ITR-V tracking record
   */
  async initializeITRVTracking(filingId) {
    try {
      // Check if already exists
      const existing = await ITRVProcessing.findOne({
        where: { filingId },
      });

      if (existing) {
        return await this.getITRVStatus(filingId);
      }

      // Get filing details
      const filing = await ITRFiling.findByPk(filingId, {
        attributes: ['id', 'ackNumber', 'assessmentYear', 'submittedAt', 'status', 'lifecycle_state'],
      });

      if (!filing) {
        throw new AppError('Filing not found', 404);
      }

      if (!filing.ackNumber) {
        throw new AppError('Filing must be submitted with acknowledgement number', 400);
      }

      const state = filing.lifecycle_state || filing.status;
      if (state !== ITR_DOMAIN_STATES.ACKNOWLEDGED && state !== 'processed') {
        throw new AppError('Filing must be acknowledged before ITR-V tracking can be initialized', 400);
      }

      // Calculate expiry date (120 days from submission)
      const submittedDate = filing.submittedAt || new Date();
      const expiryDate = new Date(submittedDate);
      expiryDate.setDate(expiryDate.getDate() + 120);

      const timeline = [{
        status: 'pending',
        date: new Date().toISOString(),
        message: 'ITR-V tracking initialized',
      }];

      const itrv = await ITRVProcessing.create({
        filingId,
        ackNumber: filing.ackNumber,
        status: 'pending',
        expiryDate,
        timeline,
        metadata: {
          assessmentYear: filing.assessmentYear,
          submittedAt: filing.submittedAt,
        },
      });

      enterpriseLogger.info('ITR-V tracking initialized', {
        filingId,
        ackNumber: filing.ackNumber,
        itrvId: itrv.id,
      });

      return await this.getITRVStatus(filingId);
    } catch (error) {
      enterpriseLogger.error('Failed to initialize ITR-V tracking', {
        filingId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get ITR-V status for a filing
   * @param {string} filingId - Filing ID
   * @returns {Promise<object>} - ITR-V status
   */
  async getITRVStatus(filingId) {
    try {
      const itrv = await ITRVProcessing.findOne({
        where: { filingId },
        include: [{
          model: ITRFiling,
          as: 'filing',
          attributes: ['id', 'ackNumber', 'assessmentYear', 'itrType', 'status', 'lifecycle_state'],
        }],
      });

      if (!itrv) {
        // Auto-initialize if filing is acknowledged
        const filing = await ITRFiling.findByPk(filingId);
        const state = filing?.lifecycle_state || filing?.status;
        if (filing && filing.ackNumber && (state === ITR_DOMAIN_STATES.ACKNOWLEDGED || state === 'processed')) {
          return await this.initializeITRVTracking(filingId);
        }
        throw new AppError('ITR-V tracking not found. Filing must be submitted and acknowledged first.', 404);
      }

      return {
        id: itrv.id,
        filingId: itrv.filingId,
        ackNumber: itrv.ackNumber,
        status: itrv.status,
        generatedAt: itrv.generatedAt,
        deliveredAt: itrv.deliveredAt,
        verifiedAt: itrv.verifiedAt,
        expiryDate: itrv.expiryDate,
        deliveryMethod: itrv.deliveryMethod,
        documentUrl: itrv.documentUrl,
        verificationMethod: itrv.verificationMethod,
        timeline: itrv.timeline || [],
        metadata: itrv.metadata || {},
        lastCheckedAt: itrv.lastCheckedAt,
        isExpired: itrv.expiryDate ? new Date(itrv.expiryDate) < new Date() : false,
        daysUntilExpiry: itrv.expiryDate ? Math.ceil((new Date(itrv.expiryDate) - new Date()) / (1000 * 60 * 60 * 24)) : null,
        filing: itrv.filing,
      };
    } catch (error) {
      enterpriseLogger.error('Failed to get ITR-V status', {
        filingId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get all ITR-V records for a user
   * @param {string} userId - User ID
   * @param {object} filters - Optional filters (status, assessmentYear)
   * @returns {Promise<Array>} - Array of ITR-V records
   */
  async getUserITRVRecords(userId, filters = {}) {
    try {
      const { status, assessmentYear, page = 1, limit = 20 } = filters;
      const offset = (page - 1) * limit;

      // Count query
      let countQuery = `
        SELECT COUNT(*) as total
        FROM itr_v_processing itrv
        INNER JOIN itr_filings f ON itrv.filing_id = f.id
        WHERE f.user_id = $1
      `;
      const countParams = [userId];
      if (status) {
        countQuery += ' AND itrv.status = $2';
        countParams.push(status);
      }
      if (assessmentYear) {
        countQuery += ` AND f.assessment_year = $${countParams.length + 1}`;
        countParams.push(assessmentYear);
      }

      const countResult = await dbQuery(countQuery, countParams);
      const total = parseInt(countResult.rows[0].total, 10);

      // Data query with pagination
      const query = `
        SELECT 
          itrv.*,
          f.assessment_year,
          f.itr_type,
          f.status as filing_status
        FROM itr_v_processing itrv
        INNER JOIN itr_filings f ON itrv.filing_id = f.id
        WHERE f.user_id = $1
        ${status ? `AND itrv.status = $2` : ''}
        ${assessmentYear ? `AND f.assessment_year = $${status ? 3 : 2}` : ''}
        ORDER BY itrv.created_at DESC
        LIMIT $${countParams.length + 1} OFFSET $${countParams.length + 2}
      `;

      const params = [userId, limit, offset];
      if (status) params.splice(1, 0, status);
      if (assessmentYear) params.splice(status ? 2 : 1, 0, assessmentYear);

      const result = await dbQuery(query, params);

      return {
        records: result.rows.map(row => ({
          id: row.id,
          filingId: row.filing_id,
          ackNumber: row.ack_number,
          status: row.status,
          generatedAt: row.generated_at,
          deliveredAt: row.delivered_at,
          verifiedAt: row.verified_at,
          expiryDate: row.expiry_date,
          deliveryMethod: row.delivery_method,
          documentUrl: row.document_url,
          verificationMethod: row.verification_method,
          timeline: row.timeline ? JSON.parse(row.timeline) : [],
          metadata: row.metadata ? JSON.parse(row.metadata) : {},
          assessmentYear: row.assessment_year,
          itrType: row.itr_type,
          filingStatus: row.filing_status,
          isExpired: row.expiry_date ? new Date(row.expiry_date) < new Date() : false,
        })),
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      enterpriseLogger.error('Failed to get user ITR-V records', {
        userId,
        error: error.message,
      });
      throw new AppError(`Failed to get ITR-V records: ${error.message}`, 500);
    }
  }

  /**
   * Check ITR-V status from Income Tax Portal
   * @param {string} filingId - Filing ID
   * @returns {Promise<object>} - Updated ITR-V status
   */
  async checkITRVStatusFromPortal(filingId) {
    try {
      const itrv = await ITRVProcessing.findOne({
        where: { filingId },
        include: [{
          model: ITRFiling,
          as: 'filing',
          attributes: ['id', 'ackNumber', 'userId'],
        }],
      });

      if (!itrv) {
        throw new AppError('ITR-V tracking not found', 404);
      }

      enterpriseLogger.info('Checking ITR-V status from portal', {
        filingId,
        ackNumber: itrv.ackNumber,
      });

      if (!this.isLiveMode) {
        // Mock implementation
        const mockStatus = this.getMockITRVStatus(itrv.status);
        return await this.updateITRVStatus(filingId, mockStatus, {
          source: 'MOCK',
          checkedAt: new Date().toISOString(),
        });
      }

      // In live mode, call ERI/ITD API to check status
      // This would integrate with actual ITD portal API
      // For now, using mock but with ERI source
      const portalStatus = await this.fetchITRVStatusFromERI(itrv.ackNumber);
      return await this.updateITRVStatus(filingId, portalStatus, {
        source: 'ERI',
        checkedAt: new Date().toISOString(),
      });
    } catch (error) {
      enterpriseLogger.error('Failed to check ITR-V status from portal', {
        filingId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Fetch ITR-V status from ERI (mock for now)
   * @param {string} ackNumber - Acknowledgement number
   * @returns {Promise<object>} - Status from portal
   */
  async fetchITRVStatusFromERI(ackNumber) {
    // This would call actual ERI API
    // For now, returning mock progression
    return {
      status: 'generated',
      generatedAt: new Date().toISOString(),
      deliveryMethod: 'email',
      documentUrl: `https://portal.incometax.gov.in/itrv/${ackNumber}`,
    };
  }

  /**
   * Get mock ITR-V status for testing
   * @param {string} currentStatus - Current status
   * @returns {object} - Mock status progression
   */
  getMockITRVStatus(currentStatus) {
    const statusProgression = {
      pending: { status: 'generated', generatedAt: new Date().toISOString() },
      generated: { status: 'processing', generatedAt: new Date(Date.now() - 86400000).toISOString() },
      processing: { status: 'delivered', deliveredAt: new Date().toISOString(), deliveryMethod: 'email' },
      delivered: { status: 'delivered' }, // Stay delivered until verified
    };

    return statusProgression[currentStatus] || { status: currentStatus };
  }

  /**
   * Update ITR-V status
   * @param {string} filingId - Filing ID
   * @param {object} statusUpdate - Status update data
   * @param {object} metadata - Additional metadata
   * @returns {Promise<object>} - Updated ITR-V status
   */
  async updateITRVStatus(filingId, statusUpdate, metadata = {}) {
    try {
      const itrv = await ITRVProcessing.findOne({ where: { filingId } });

      if (!itrv) {
        throw new AppError('ITR-V tracking not found', 404);
      }

      const timeline = itrv.timeline || [];
      const oldStatus = itrv.status;
      const newStatus = statusUpdate.status || itrv.status;

      // Add timeline entry
      timeline.push({
        status: newStatus,
        date: new Date().toISOString(),
        message: statusUpdate.message || `Status updated to ${newStatus}`,
        ...metadata,
      });

      const updateData = {
        status: newStatus,
        timeline,
        lastCheckedAt: new Date(),
        metadata: {
          ...(itrv.metadata || {}),
          ...metadata,
        },
      };

      if (statusUpdate.generatedAt) updateData.generatedAt = new Date(statusUpdate.generatedAt);
      if (statusUpdate.deliveredAt) updateData.deliveredAt = new Date(statusUpdate.deliveredAt);
      if (statusUpdate.verifiedAt) updateData.verifiedAt = new Date(statusUpdate.verifiedAt);
      if (statusUpdate.deliveryMethod) updateData.deliveryMethod = statusUpdate.deliveryMethod;
      if (statusUpdate.documentUrl) updateData.documentUrl = statusUpdate.documentUrl;
      if (statusUpdate.verificationMethod) updateData.verificationMethod = statusUpdate.verificationMethod;

      await itrv.update(updateData);

      // Send notification if status changed
      if (oldStatus !== newStatus) {
        const filing = await ITRFiling.findByPk(filingId);
        if (filing) {
          await this.sendStatusNotification(filing.userId, filingId, oldStatus, newStatus);
        }
      }

      enterpriseLogger.info('ITR-V status updated', {
        filingId,
        oldStatus,
        newStatus,
      });

      return await this.getITRVStatus(filingId);
    } catch (error) {
      enterpriseLogger.error('Failed to update ITR-V status', {
        filingId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Mark ITR-V as verified
   * @param {string} filingId - Filing ID
   * @param {string} verificationMethod - Verification method used
   * @returns {Promise<object>} - Updated ITR-V status
   */
  async markAsVerified(filingId, verificationMethod) {
    try {
      return await this.updateITRVStatus(filingId, {
        status: 'verified',
        verifiedAt: new Date().toISOString(),
        verificationMethod,
        message: `ITR-V verified using ${verificationMethod}`,
      });
    } catch (error) {
      enterpriseLogger.error('Failed to mark ITR-V as verified', {
        filingId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Send status notification
   * @param {string} userId - User ID
   * @param {string} filingId - Filing ID
   * @param {string} oldStatus - Old status
   * @param {string} newStatus - New status
   */
  async sendStatusNotification(userId, filingId, oldStatus, newStatus) {
    try {
      const statusMessages = {
        generated: 'Your ITR-V has been generated and is being processed.',
        processing: 'Your ITR-V is being processed and will be delivered soon.',
        delivered: 'Your ITR-V has been delivered. Please verify it within 120 days.',
        verified: 'Your ITR-V has been successfully verified.',
        expired: 'Your ITR-V has expired. Please contact support for assistance.',
        failed: 'There was an issue processing your ITR-V. Please contact support.',
      };

      const message = statusMessages[newStatus] || `Your ITR-V status has been updated to ${newStatus}.`;

      // Send notification via SSE if available
      if (sseNotificationService && typeof sseNotificationService.sendToUser === 'function') {
        sseNotificationService.sendToUser(userId, 'itrv_status_update', {
          title: 'ITR-V Status Update',
          message,
          filingId,
          status: newStatus,
          oldStatus,
          priority: newStatus === 'expired' || newStatus === 'failed' ? 'high' : 'normal',
        });
      }
    } catch (error) {
      enterpriseLogger.error('Failed to send ITR-V status notification', {
        userId,
        filingId,
        error: error.message,
      });
      // Don't throw - notification failure shouldn't break the flow
    }
  }

  /**
   * Get expiring ITR-V records (within 30 days)
   * @returns {Promise<Array>} - Array of expiring ITR-V records
   */
  async getExpiringITRVRecords() {
    try {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      const itrvRecords = await ITRVProcessing.findAll({
        where: {
          status: {
            [require('sequelize').Op.in]: ['pending', 'generated', 'processing', 'delivered'],
          },
          expiryDate: {
            [require('sequelize').Op.lte]: thirtyDaysFromNow,
            [require('sequelize').Op.gte]: new Date(),
          },
        },
        include: [{
          model: ITRFiling,
          as: 'filing',
          attributes: ['id', 'userId', 'ackNumber'],
        }],
      });

      return itrvRecords.map(itrv => ({
        id: itrv.id,
        filingId: itrv.filingId,
        ackNumber: itrv.ackNumber,
        status: itrv.status,
        expiryDate: itrv.expiryDate,
        daysUntilExpiry: Math.ceil((new Date(itrv.expiryDate) - new Date()) / (1000 * 60 * 60 * 24)),
        userId: itrv.filing?.userId,
      }));
    } catch (error) {
      enterpriseLogger.error('Failed to get expiring ITR-V records', {
        error: error.message,
      });
      throw error;
    }
  }
}

module.exports = new ITRVProcessingService();

