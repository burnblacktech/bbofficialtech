// =====================================================
// REFUND TRACKING SERVICE
// Service for tracking refund status and history
// =====================================================

const enterpriseLogger = require('../../utils/logger');
const { AppError } = require('../../middleware/errorHandler');
const { ITRFiling, RefundTracking } = require('../../models');
const eriIntegrationService = require('../eri/ERIIntegrationService');

class RefundTrackingService {
  /**
   * Get refund status for a filing
   * @param {string} filingId - Filing ID
   * @returns {Promise<object>} - Refund status
   */
  async getRefundStatus(filingId) {
    try {
      const refund = await RefundTracking.findOne({
        where: { filingId },
        include: [{
          model: ITRFiling,
          as: 'filing',
          attributes: ['ackNumber', 'assessmentYear', 'refundAmount']
        }],
        order: [['statusDate', 'DESC']]
      });

      if (!refund) {
        // Check if filing exists to initialize tracking
        const filing = await ITRFiling.findByPk(filingId);
        if (!filing) {
          throw new AppError('Filing not found', 404);
        }
        return await this.initializeRefundTracking(filingId, filing.refundAmount);
      }

      return {
        id: refund.id,
        filingId: refund.filingId,
        expectedAmount: parseFloat(refund.expectedAmount || 0),
        status: refund.status,
        statusDate: refund.statusDate,
        bankAccount: refund.bankAccount,
        refundReference: refund.refundReference,
        interestAmount: parseFloat(refund.interestAmount || 0),
        timeline: refund.timeline || [],
        ackNumber: refund.filing?.ackNumber,
        assessmentYear: refund.filing?.assessmentYear,
      };
    } catch (error) {
      enterpriseLogger.error('Failed to get refund status', {
        filingId,
        error: error.message,
      });
      throw error instanceof AppError ? error : new AppError(`Failed to get refund status: ${error.message}`, 500);
    }
  }

  /**
   * Initialize refund tracking for a filing
   * @param {string} filingId - Filing ID
   * @param {number} expectedAmount - Expected refund amount
   * @returns {Promise<object>} - Initialized refund tracking
   */
  async initializeRefundTracking(filingId, expectedAmount) {
    try {
      const filing = await ITRFiling.findByPk(filingId);

      if (!filing) {
        throw new AppError('Filing not found', 404);
      }

      // S28: Derivce bank account from jsonPayload (SSOT)
      const formData = filing.jsonPayload || {};
      const bankAccount = (formData.bankDetails?.accounts || []).find(
        acc => acc.isRefundAccount || acc.is_refund_account
      );

      const timeline = [{
        status: 'processing',
        date: new Date().toISOString(),
        message: 'Refund processing initiated',
      }];

      const refund = await RefundTracking.create({
        filingId,
        expectedAmount: expectedAmount || 0,
        status: 'processing',
        statusDate: new Date(),
        bankAccount: bankAccount || null,
        timeline,
      });

      return {
        id: refund.id,
        filingId,
        expectedAmount: parseFloat(expectedAmount || 0),
        status: 'processing',
        statusDate: refund.statusDate,
        bankAccount: bankAccount || null,
        refundReference: null,
        interestAmount: 0,
        timeline,
        ackNumber: filing.ackNumber,
        assessmentYear: filing.assessmentYear,
      };
    } catch (error) {
      enterpriseLogger.error('Failed to initialize refund tracking', {
        filingId,
        error: error.message,
      });
      throw error instanceof AppError ? error : new AppError(`Failed to initialize refund tracking: ${error.message}`, 500);
    }
  }

  /**
   * Get refund history for a user
   * @param {string} userId - User ID
   * @param {string} assessmentYear - Optional assessment year filter
   * @returns {Promise<Array>} - Array of refund records
   */
  async getRefundHistory(userId, assessmentYear = null) {
    try {
      const where = {};
      if (assessmentYear) {
        where.assessmentYear = assessmentYear;
      }

      // S28: Use model associations instead of raw SQL joins
      const filings = await ITRFiling.findAll({
        where: { ...where, createdBy: userId },
        include: [{
          model: RefundTracking,
          as: 'refundTracking'
        }],
        order: [['submittedAt', 'DESC']]
      });

      return filings
        .filter(f => f.refundTracking)
        .map(f => ({
          id: f.refundTracking.id,
          filingId: f.id,
          expectedAmount: parseFloat(f.refundTracking.expectedAmount || 0),
          status: f.refundTracking.status,
          statusDate: f.refundTracking.statusDate,
          bankAccount: f.refundTracking.bankAccount,
          refundReference: f.refundTracking.refundReference,
          interestAmount: parseFloat(f.refundTracking.interestAmount || 0),
          timeline: f.refundTracking.timeline || [],
          ackNumber: f.ackNumber,
          assessmentYear: f.assessmentYear,
          itrType: f.itrType,
          submittedAt: f.submittedAt,
        }));
    } catch (error) {
      enterpriseLogger.error('Failed to get refund history', {
        userId,
        assessmentYear,
        error: error.message,
      });
      throw new AppError(`Failed to get refund history: ${error.message}`, 500);
    }
  }

  /**
   * Update refund status
   * @param {string} filingId - Filing ID
   * @param {string} status - New status
   * @param {object} additionalData - Additional data (refundReference, interestAmount, etc.)
   * @returns {Promise<object>} - Updated refund status
   */
  async updateRefundStatus(filingId, status, additionalData = {}) {
    try {
      const validStatuses = ['processing', 'issued', 'credited', 'failed', 'adjusted'];
      if (!validStatuses.includes(status)) {
        throw new AppError(`Invalid refund status: ${status}`, 400);
      }

      const refund = await RefundTracking.findOne({ where: { filingId } });
      if (!refund) {
        throw new AppError('Refund tracking not found', 404);
      }

      const timeline = refund.timeline || [];
      timeline.push({
        status,
        date: new Date().toISOString(),
        message: additionalData.message || `Refund status updated to ${status}`,
        ...additionalData,
      });

      await refund.update({
        status,
        statusDate: new Date(),
        refundReference: additionalData.refundReference || refund.refundReference,
        interestAmount: additionalData.interestAmount || refund.interestAmount,
        timeline
      });

      return await this.getRefundStatus(filingId);
    } catch (error) {
      enterpriseLogger.error('Failed to update refund status', {
        filingId,
        status,
        error: error.message,
      });
      throw error instanceof AppError ? error : new AppError(`Failed to update refund status: ${error.message}`, 500);
    }
  }

  /**
   * Update refund bank account
   * @param {string} filingId - Filing ID
   * @param {object} bankAccount - Bank account details
   * @returns {Promise<object>} - Updated refund status
   */
  async updateRefundBankAccount(filingId, bankAccount) {
    try {
      const [updatedCount] = await RefundTracking.update(
        { bankAccount },
        { where: { filingId } }
      );

      if (updatedCount === 0) {
        throw new AppError('Refund tracking not found', 404);
      }

      enterpriseLogger.info('Refund bank account updated', {
        filingId,
        bankAccount: bankAccount.accountNumber,
      });

      return await this.getRefundStatus(filingId);
    } catch (error) {
      enterpriseLogger.error('Failed to update refund bank account', {
        filingId,
        error: error.message,
      });
      throw error instanceof AppError ? error : new AppError(`Failed to update refund bank account: ${error.message}`, 500);
    }
  }

  /**
   * Check refund status with ITD via ERI
   * @param {string} ackNumber - Acknowledgement number
   * @returns {Promise<object>} - Refund status from ITD
   */
  async checkRefundWithITD(ackNumber) {
    try {
      enterpriseLogger.info('Checking refund status with ITD', { ackNumber });

      const filing = await ITRFiling.findOne({ where: { ackNumber } });
      if (!filing) {
        throw new AppError('Filing not found', 404);
      }

      const filingId = filing.id;

      // In live mode, fetch from ERI
      // For now, return mock data
      const mockRefundStatus = {
        status: 'processing',
        refundAmount: 0,
        refundDate: null,
        source: 'MOCK',
      };

      const currentStatus = await this.getRefundStatus(filingId);
      if (mockRefundStatus.status !== currentStatus.status) {
        await this.updateRefundStatus(filingId, mockRefundStatus.status, {
          message: 'Refund status updated from ITD',
        });
      }

      return mockRefundStatus;
    } catch (error) {
      enterpriseLogger.error('Failed to check refund with ITD', {
        ackNumber,
        error: error.message,
      });
      throw error instanceof AppError ? error : new AppError(`Failed to check refund with ITD: ${error.message}`, 500);
    }
  }
}

module.exports = new RefundTrackingService();

