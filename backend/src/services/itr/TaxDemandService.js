// =====================================================
// TAX DEMAND SERVICE
// Service for managing tax demands from Income Tax Department
// =====================================================

const enterpriseLogger = require('../../utils/logger');
const { AppError } = require('../../middleware/errorHandler');
const { TaxDemand, ITRFiling } = require('../../models');
const { query: dbQuery } = require('../../utils/dbQuery');
const eriIntegrationService = require('../eri/ERIIntegrationService');
const sseNotificationService = require('../utils/NotificationService');
// TaxPaymentService integration can be added later if needed

class TaxDemandService {
  constructor() {
    this.isLiveMode = process.env.FEATURE_ERI_LIVE === 'true';
  }

  /**
   * Create a new tax demand record
   * @param {string} userId - User ID
   * @param {object} demandData - Demand data
   * @returns {Promise<object>} - Created demand
   */
  async createDemand(userId, demandData) {
    try {
      const {
        filingId,
        demandNumber,
        demandType,
        assessmentYear,
        receivedDate,
        dueDate,
        subject,
        description,
        totalAmount,
        breakdown = {},
        documentUrl,
        metadata = {},
      } = demandData;

      // Validate demand number uniqueness
      const existing = await TaxDemand.findOne({
        where: { demandNumber },
      });

      if (existing) {
        throw new AppError('Demand with this number already exists', 400);
      }

      const outstandingAmount = parseFloat(totalAmount);

      const timeline = [{
        status: 'pending',
        date: new Date().toISOString(),
        message: 'Tax demand received',
      }];

      const demand = await TaxDemand.create({
        userId,
        filingId: filingId || null,
        demandNumber,
        demandType,
        assessmentYear,
        receivedDate: receivedDate || new Date(),
        dueDate,
        subject,
        description,
        totalAmount: outstandingAmount,
        outstandingAmount,
        paidAmount: 0,
        breakdown,
        documentUrl: documentUrl || null,
        status: 'pending',
        timeline,
        metadata,
      });

      enterpriseLogger.info('Tax demand created', {
        demandId: demand.id,
        userId,
        demandNumber,
        demandType,
        totalAmount: outstandingAmount,
      });

      // Send notification
      await this.sendDemandNotification(userId, demand.id, 'received');

      return await this.getDemandById(demand.id);
    } catch (error) {
      enterpriseLogger.error('Failed to create tax demand', {
        userId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get demand by ID
   * @param {string} demandId - Demand ID
   * @param {string} userId - User ID (for authorization)
   * @returns {Promise<object>} - Demand details
   */
  async getDemandById(demandId, userId = null) {
    try {
      const where = { id: demandId };
      if (userId) {
        where.userId = userId;
      }

      const demand = await TaxDemand.findOne({
        where,
        include: [{
          model: ITRFiling,
          as: 'filing',
          attributes: ['id', 'ackNumber', 'assessmentYear', 'itrType', 'status'],
        }],
      });

      if (!demand) {
        throw new AppError('Tax demand not found', 404);
      }

      // Recalculate outstanding amount
      const outstanding = parseFloat(demand.totalAmount) - parseFloat(demand.paidAmount || 0);

      return {
        id: demand.id,
        filingId: demand.filingId,
        userId: demand.userId,
        demandNumber: demand.demandNumber,
        demandType: demand.demandType,
        assessmentYear: demand.assessmentYear,
        status: demand.status,
        totalAmount: parseFloat(demand.totalAmount),
        paidAmount: parseFloat(demand.paidAmount || 0),
        outstandingAmount: outstanding,
        receivedDate: demand.receivedDate,
        dueDate: demand.dueDate,
        paidAt: demand.paidAt,
        subject: demand.subject,
        description: demand.description,
        breakdown: demand.breakdown || {},
        documentUrl: demand.documentUrl,
        disputeReason: demand.disputeReason,
        disputeDocuments: demand.disputeDocuments || [],
        disputeStatus: demand.disputeStatus,
        paymentHistory: demand.paymentHistory || [],
        timeline: demand.timeline || [],
        metadata: demand.metadata || {},
        isOverdue: demand.dueDate ? new Date(demand.dueDate) < new Date() && demand.status !== 'paid' && demand.status !== 'closed' : false,
        daysUntilDue: demand.dueDate ? Math.ceil((new Date(demand.dueDate) - new Date()) / (1000 * 60 * 60 * 24)) : null,
        filing: demand.filing,
      };
    } catch (error) {
      enterpriseLogger.error('Failed to get tax demand', {
        demandId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get all demands for a user
   * @param {string} userId - User ID
   * @param {object} filters - Optional filters (status, demandType, assessmentYear)
   * @returns {Promise<Array>} - Array of demands
   */
  async getUserDemands(userId, filters = {}) {
    try {
      const { status, demandType, assessmentYear, page = 1, limit = 20 } = filters;
      const offset = (page - 1) * limit;

      const where = { userId };
      if (status) where.status = status;
      if (demandType) where.demandType = demandType;
      if (assessmentYear) where.assessmentYear = assessmentYear;

      const { count, rows: demands } = await TaxDemand.findAndCountAll({
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
        demands: demands.map(demand => {
          const outstanding = parseFloat(demand.totalAmount) - parseFloat(demand.paidAmount || 0);
          return {
            id: demand.id,
            filingId: demand.filingId,
            demandNumber: demand.demandNumber,
            demandType: demand.demandType,
            assessmentYear: demand.assessmentYear,
            status: demand.status,
            totalAmount: parseFloat(demand.totalAmount),
            paidAmount: parseFloat(demand.paidAmount || 0),
            outstandingAmount: outstanding,
            receivedDate: demand.receivedDate,
            dueDate: demand.dueDate,
            subject: demand.subject,
            isOverdue: demand.dueDate ? new Date(demand.dueDate) < new Date() && demand.status !== 'paid' && demand.status !== 'closed' : false,
            daysUntilDue: demand.dueDate ? Math.ceil((new Date(demand.dueDate) - new Date()) / (1000 * 60 * 60 * 24)) : null,
            filing: demand.filing,
          };
        }),
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit),
        },
      };
    } catch (error) {
      enterpriseLogger.error('Failed to get user demands', {
        userId,
        error: error.message,
      });
      throw new AppError(`Failed to get demands: ${error.message}`, 500);
    }
  }

  /**
   * Record payment for a demand
   * @param {string} demandId - Demand ID
   * @param {string} userId - User ID
   * @param {object} paymentData - Payment data
   * @returns {Promise<object>} - Updated demand
   */
  async recordPayment(demandId, userId, paymentData) {
    try {
      const { amount, paymentMethod, transactionId, paymentDate } = paymentData;

      if (!amount || amount <= 0) {
        throw new AppError('Invalid payment amount', 400);
      }

      const demand = await TaxDemand.findOne({
        where: { id: demandId, userId },
      });

      if (!demand) {
        throw new AppError('Tax demand not found', 404);
      }

      const currentPaid = parseFloat(demand.paidAmount || 0);
      const newPaid = currentPaid + parseFloat(amount);
      const totalAmount = parseFloat(demand.totalAmount);
      const outstanding = totalAmount - newPaid;

      if (newPaid > totalAmount) {
        throw new AppError('Payment amount exceeds total demand amount', 400);
      }

      // Update payment history
      const paymentHistory = demand.paymentHistory || [];
      paymentHistory.push({
        amount: parseFloat(amount),
        paymentMethod,
        transactionId,
        paymentDate: paymentDate || new Date().toISOString(),
        recordedAt: new Date().toISOString(),
      });

      // Update timeline
      const timeline = demand.timeline || [];
      const newStatus = outstanding === 0 ? 'paid' : newPaid > 0 ? 'partially_paid' : demand.status;

      timeline.push({
        status: newStatus,
        date: new Date().toISOString(),
        message: `Payment of ₹${parseFloat(amount).toLocaleString('en-IN')} recorded`,
        paymentMethod,
        transactionId,
      });

      const updateData = {
        paidAmount: newPaid,
        outstandingAmount: outstanding,
        paymentHistory,
        timeline,
      };

      if (newStatus === 'paid') {
        updateData.status = 'paid';
        updateData.paidAt = new Date();
      } else if (newStatus === 'partially_paid' && demand.status === 'pending') {
        updateData.status = 'partially_paid';
      }

      await demand.update(updateData);

      // Note: Tax payment record creation can be handled separately
      // The payment is already recorded in the demand's payment history

      // Send notification
      await this.sendDemandNotification(userId, demandId, newStatus === 'paid' ? 'paid' : 'payment_received');

      enterpriseLogger.info('Tax demand payment recorded', {
        demandId,
        amount,
        newStatus,
      });

      return await this.getDemandById(demandId, userId);
    } catch (error) {
      enterpriseLogger.error('Failed to record payment', {
        demandId,
        userId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Dispute a demand
   * @param {string} demandId - Demand ID
   * @param {string} userId - User ID
   * @param {object} disputeData - Dispute data
   * @returns {Promise<object>} - Updated demand
   */
  async disputeDemand(demandId, userId, disputeData) {
    try {
      const { disputeReason, disputeDocuments = [] } = disputeData;

      if (!disputeReason || !disputeReason.trim()) {
        throw new AppError('Dispute reason is required', 400);
      }

      const demand = await TaxDemand.findOne({
        where: { id: demandId, userId },
      });

      if (!demand) {
        throw new AppError('Tax demand not found', 404);
      }

      if (demand.status === 'paid' || demand.status === 'closed') {
        throw new AppError('Cannot dispute a paid or closed demand', 400);
      }

      // Update timeline
      const timeline = demand.timeline || [];
      timeline.push({
        status: 'disputed',
        date: new Date().toISOString(),
        message: 'Demand disputed',
        disputeReason: disputeReason.substring(0, 100), // First 100 chars
      });

      await demand.update({
        status: 'disputed',
        disputeReason,
        disputeDocuments,
        disputeStatus: 'pending',
        timeline,
      });

      // Send notification
      await this.sendDemandNotification(userId, demandId, 'disputed');

      enterpriseLogger.info('Tax demand disputed', {
        demandId,
        userId,
      });

      return await this.getDemandById(demandId, userId);
    } catch (error) {
      enterpriseLogger.error('Failed to dispute demand', {
        demandId,
        userId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Update demand status
   * @param {string} demandId - Demand ID
   * @param {string} userId - User ID
   * @param {string} status - New status
   * @param {object} updateData - Additional update data
   * @returns {Promise<object>} - Updated demand
   */
  async updateDemandStatus(demandId, userId, status, updateData = {}) {
    try {
      const validStatuses = ['pending', 'acknowledged', 'disputed', 'partially_paid', 'paid', 'waived', 'closed'];
      if (!validStatuses.includes(status)) {
        throw new AppError(`Invalid demand status: ${status}`, 400);
      }

      const demand = await TaxDemand.findOne({
        where: { id: demandId, userId },
      });

      if (!demand) {
        throw new AppError('Tax demand not found', 404);
      }

      const timeline = demand.timeline || [];
      const oldStatus = demand.status;

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

      if (status === 'acknowledged' && !demand.acknowledgedAt) {
        updateFields.acknowledgedAt = new Date();
      }

      await demand.update(updateFields);

      // Send notification if status changed
      if (oldStatus !== status) {
        await this.sendDemandNotification(userId, demandId, status);
      }

      enterpriseLogger.info('Tax demand status updated', {
        demandId,
        oldStatus,
        newStatus: status,
      });

      return await this.getDemandById(demandId, userId);
    } catch (error) {
      enterpriseLogger.error('Failed to update demand status', {
        demandId,
        userId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get overdue demands for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} - Array of overdue demands
   */
  async getOverdueDemands(userId) {
    try {
      const demands = await TaxDemand.findAll({
        where: {
          userId,
          status: {
            [require('sequelize').Op.in]: ['pending', 'acknowledged', 'partially_paid'],
          },
          dueDate: {
            [require('sequelize').Op.lt]: new Date(),
          },
        },
        order: [['dueDate', 'ASC']],
      });

      return demands.map(demand => {
        const outstanding = parseFloat(demand.totalAmount) - parseFloat(demand.paidAmount || 0);
        return {
          id: demand.id,
          demandNumber: demand.demandNumber,
          demandType: demand.demandType,
          subject: demand.subject,
          totalAmount: parseFloat(demand.totalAmount),
          outstandingAmount: outstanding,
          dueDate: demand.dueDate,
          daysOverdue: Math.ceil((new Date() - new Date(demand.dueDate)) / (1000 * 60 * 60 * 24)),
        };
      });
    } catch (error) {
      enterpriseLogger.error('Failed to get overdue demands', {
        userId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Send demand notification
   * @param {string} userId - User ID
   * @param {string} demandId - Demand ID
   * @param {string} event - Event type (received, due_soon, overdue, paid, etc.)
   */
  async sendDemandNotification(userId, demandId, event) {
    try {
      const demand = await TaxDemand.findByPk(demandId);
      if (!demand) return;

      const messages = {
        received: `New tax demand received: ${demand.demandNumber} - ₹${parseFloat(demand.totalAmount).toLocaleString('en-IN')}`,
        due_soon: `Tax demand ${demand.demandNumber} is due soon`,
        overdue: `Tax demand ${demand.demandNumber} is overdue - ₹${parseFloat(demand.outstandingAmount || demand.totalAmount).toLocaleString('en-IN')} outstanding`,
        paid: `Tax demand ${demand.demandNumber} has been fully paid`,
        payment_received: `Payment received for demand ${demand.demandNumber}`,
        disputed: `Tax demand ${demand.demandNumber} has been disputed`,
      };

      const message = messages[event] || `Tax demand ${demand.demandNumber} status updated`;

      if (sseNotificationService && typeof sseNotificationService.sendToUser === 'function') {
        sseNotificationService.sendToUser(userId, 'tax_demand', {
          title: 'Tax Demand Update',
          message,
          demandId,
          demandNumber: demand.demandNumber,
          status: demand.status,
          priority: event === 'overdue' ? 'high' : 'normal',
        });
      }
    } catch (error) {
      enterpriseLogger.error('Failed to send demand notification', {
        userId,
        demandId,
        error: error.message,
      });
      // Don't throw - notification failure shouldn't break the flow
    }
  }
}

module.exports = new TaxDemandService();

