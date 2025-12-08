// =====================================================
// REFUND TRACKING SERVICE
// Service for tracking refund status and history
// =====================================================

const enterpriseLogger = require('../../utils/logger');
const { AppError } = require('../../middleware/errorHandler');
const { query: dbQuery } = require('../../utils/dbQuery');
const eriIntegrationService = require('./ERIIntegrationService');

class RefundTrackingService {
  /**
   * Get refund status for a filing
   * @param {string} filingId - Filing ID
   * @returns {Promise<object>} - Refund status
   */
  async getRefundStatus(filingId) {
    try {
      const query = `
        SELECT 
          rt.*,
          f.ack_number,
          f.assessment_year,
          f.refund_amount as expected_amount
        FROM refund_tracking rt
        RIGHT JOIN itr_filings f ON rt.filing_id = f.id
        WHERE f.id = $1
        ORDER BY rt.status_date DESC
        LIMIT 1
      `;

      const result = await dbQuery(query, [filingId]);

      if (result.rows.length === 0) {
        throw new AppError('Filing not found', 404);
      }

      const row = result.rows[0];

      // If no refund tracking record exists, create one
      if (!row.id) {
        return await this.initializeRefundTracking(filingId, row.expected_amount);
      }

      return {
        id: row.id,
        filingId: row.filing_id,
        expectedAmount: parseFloat(row.expected_amount || 0),
        status: row.status,
        statusDate: row.status_date,
        bankAccount: row.bank_account ? JSON.parse(row.bank_account) : null,
        refundReference: row.refund_reference,
        interestAmount: parseFloat(row.interest_amount || 0),
        timeline: row.timeline ? JSON.parse(row.timeline) : [],
        ackNumber: row.ack_number,
        assessmentYear: row.assessment_year,
      };
    } catch (error) {
      // Handle case where refund_tracking table doesn't exist yet
      if (error.message && (
        error.message.includes('does not exist') ||
        error.message.includes('relation') ||
        error.message.includes('refund_tracking')
      )) {
        enterpriseLogger.warn('Refund tracking table does not exist yet, initializing tracking', {
          filingId,
          error: error.message,
        });
        // Try to initialize refund tracking (will fail if table doesn't exist, but that's okay)
        // The table should be created via Sequelize sync
        throw new AppError('Refund tracking table not initialized. Please sync database models.', 503);
      }

      enterpriseLogger.error('Failed to get refund status', {
        filingId,
        error: error.message,
      });
      throw new AppError(`Failed to get refund status: ${error.message}`, 500);
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
      // Get filing details
      const filingQuery = `
        SELECT id, ack_number, assessment_year, json_payload
        FROM itr_filings
        WHERE id = $1
      `;
      const filing = await dbQuery(filingQuery, [filingId]);

      if (filing.rows.length === 0) {
        throw new AppError('Filing not found', 404);
      }

      const formData = JSON.parse(filing.rows[0].json_payload || '{}');
      const bankAccount = formData.bank_details?.accounts?.find(
        acc => acc.is_refund_account || acc.isRefundAccount
      ) || formData.bankDetails?.accounts?.find(
        acc => acc.is_refund_account || acc.isRefundAccount
      );

      const insertQuery = `
        INSERT INTO refund_tracking (
          filing_id, expected_amount, status, status_date,
          bank_account, timeline
        )
        VALUES ($1, $2, 'processing', NOW(), $3, $4)
        RETURNING *
      `;

      const timeline = [{
        status: 'processing',
        date: new Date().toISOString(),
        message: 'Refund processing initiated',
      }];

      const result = await dbQuery(insertQuery, [
        filingId,
        expectedAmount || 0,
        bankAccount ? JSON.stringify(bankAccount) : null,
        JSON.stringify(timeline),
      ]);

      return {
        id: result.rows[0].id,
        filingId,
        expectedAmount: parseFloat(expectedAmount || 0),
        status: 'processing',
        statusDate: result.rows[0].status_date,
        bankAccount: bankAccount || null,
        refundReference: null,
        interestAmount: 0,
        timeline,
        ackNumber: filing.rows[0].ack_number,
        assessmentYear: filing.rows[0].assessment_year,
      };
    } catch (error) {
      enterpriseLogger.error('Failed to initialize refund tracking', {
        filingId,
        error: error.message,
      });
      throw error;
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
      let query = `
        SELECT 
          rt.*,
          f.ack_number,
          f.assessment_year,
          f.itr_type,
          f.submitted_at
        FROM refund_tracking rt
        JOIN itr_filings f ON rt.filing_id = f.id
        WHERE f.user_id = $1
      `;
      const params = [userId];

      if (assessmentYear) {
        query += ' AND f.assessment_year = $2';
        params.push(assessmentYear);
      }

      query += ' ORDER BY f.submitted_at DESC';

      const result = await dbQuery(query, params);

      return result.rows.map(row => ({
        id: row.id,
        filingId: row.filing_id,
        expectedAmount: parseFloat(row.expected_amount || 0),
        status: row.status,
        statusDate: row.status_date,
        bankAccount: row.bank_account ? JSON.parse(row.bank_account) : null,
        refundReference: row.refund_reference,
        interestAmount: parseFloat(row.interest_amount || 0),
        timeline: row.timeline ? JSON.parse(row.timeline) : [],
        ackNumber: row.ack_number,
        assessmentYear: row.assessment_year,
        itrType: row.itr_type,
        submittedAt: row.submitted_at,
      }));
    } catch (error) {
      // Handle case where refund_tracking table doesn't exist yet
      if (error.message && (
        error.message.includes('does not exist') ||
        error.message.includes('relation') ||
        error.message.includes('refund_tracking')
      )) {
        // Only log as warning, not error - this is expected if table hasn't been created yet
        enterpriseLogger.warn('Refund tracking table does not exist yet, returning empty array', {
          userId,
          assessmentYear,
          error: error.message,
        });
        return [];
      }

      // For other errors, log and throw
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

      // Get current refund tracking
      const current = await this.getRefundStatus(filingId);
      const timeline = current.timeline || [];

      // Add new timeline entry
      timeline.push({
        status,
        date: new Date().toISOString(),
        message: additionalData.message || `Refund status updated to ${status}`,
        ...additionalData,
      });

      const updateQuery = `
        UPDATE refund_tracking
        SET 
          status = $1,
          status_date = NOW(),
          refund_reference = COALESCE($2, refund_reference),
          interest_amount = COALESCE($3, interest_amount),
          timeline = $4
        WHERE filing_id = $5
        RETURNING *
      `;

      const result = await dbQuery(updateQuery, [
        status,
        additionalData.refundReference || null,
        additionalData.interestAmount || null,
        JSON.stringify(timeline),
        filingId,
      ]);

      if (result.rows.length === 0) {
        throw new AppError('Refund tracking not found', 404);
      }

      enterpriseLogger.info('Refund status updated', {
        filingId,
        oldStatus: current.status,
        newStatus: status,
      });

      return await this.getRefundStatus(filingId);
    } catch (error) {
      enterpriseLogger.error('Failed to update refund status', {
        filingId,
        status,
        error: error.message,
      });
      throw new AppError(`Failed to update refund status: ${error.message}`, 500);
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
      const updateQuery = `
        UPDATE refund_tracking
        SET bank_account = $1
        WHERE filing_id = $2
        RETURNING *
      `;

      const result = await dbQuery(updateQuery, [
        JSON.stringify(bankAccount),
        filingId,
      ]);

      if (result.rows.length === 0) {
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
      throw new AppError(`Failed to update refund bank account: ${error.message}`, 500);
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

      // Get filing by ack number
      const filingQuery = `
        SELECT id FROM itr_filings WHERE ack_number = $1
      `;
      const filing = await dbQuery(filingQuery, [ackNumber]);

      if (filing.rows.length === 0) {
        throw new AppError('Filing not found', 404);
      }

      const filingId = filing.rows[0].id;

      // In live mode, fetch from ERI
      // For now, return mock data
      const mockRefundStatus = {
        status: 'processing',
        refundAmount: 0,
        refundDate: null,
        source: 'MOCK',
      };

      // Update refund tracking if status changed
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
      throw new AppError(`Failed to check refund with ITD: ${error.message}`, 500);
    }
  }
}

module.exports = new RefundTrackingService();

