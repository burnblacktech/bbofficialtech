// =====================================================
// ADMIN FINANCIAL CONTROLLER
// Handles financial management operations for admin
// =====================================================

const { Invoice, ITRFiling, User, RefundTracking, PricingPlan, Coupon } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');
const enterpriseLogger = require('../utils/logger');
const { AppError } = require('../middleware/errorHandler');
const auditService = require('../services/utils/AuditService');
const wsManager = require('../services/websocket/WebSocketManager');

class AdminFinancialController {
  /**
   * Get transaction statistics
   * GET /api/admin/financial/transactions/stats
   */
  async getTransactionStats(req, res, next) {
    try {
      const { startDate, endDate, timeRange = '30d' } = req.query;

      // Calculate date range
      let dateFrom, dateTo;
      if (startDate && endDate) {
        dateFrom = new Date(startDate);
        dateTo = new Date(endDate);
      } else {
        dateTo = new Date();
        const days = timeRange === '7d' ? 7 : timeRange === '90d' ? 90 : timeRange === '1y' ? 365 : 30;
        dateFrom = new Date(dateTo - days * 24 * 60 * 60 * 1000);
      }

      // Get transaction statistics
      const [stats] = await sequelize.query(`
        SELECT 
          COUNT(*) as total_transactions,
          COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) as successful_transactions,
          COUNT(CASE WHEN payment_status = 'failed' THEN 1 END) as failed_transactions,
          COUNT(CASE WHEN payment_status = 'pending' THEN 1 END) as pending_transactions,
          COUNT(CASE WHEN status = 'refunded' THEN 1 END) as refunded_transactions,
          COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END), 0) as total_revenue,
          COALESCE(AVG(CASE WHEN payment_status = 'paid' THEN total_amount END), 0) as average_transaction,
          COALESCE(SUM(CASE WHEN status = 'refunded' THEN total_amount ELSE 0 END), 0) as total_refunded
        FROM invoices
        WHERE invoice_date BETWEEN :dateFrom AND :dateTo
      `, {
        replacements: { dateFrom, dateTo },
        type: sequelize.QueryTypes.SELECT,
      });

      // Get revenue by payment method
      const revenueByMethod = await Invoice.findAll({
        where: {
          invoiceDate: { [Op.between]: [dateFrom, dateTo] },
          paymentStatus: 'paid',
        },
        attributes: [
          'paymentMethod',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
          [sequelize.fn('SUM', sequelize.col('total_amount')), 'total'],
        ],
        group: ['paymentMethod'],
        raw: true,
      });

      // Get daily revenue trend
      const dailyRevenue = await sequelize.query(`
        SELECT 
          DATE(invoice_date) as date,
          COUNT(*) as transactions,
          COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END), 0) as revenue
        FROM invoices
        WHERE invoice_date BETWEEN :dateFrom AND :dateTo
        GROUP BY DATE(invoice_date)
        ORDER BY date ASC
      `, {
        replacements: { dateFrom, dateTo },
        type: sequelize.QueryTypes.SELECT,
      });

      // Calculate success rate
      const successRate = stats.total_transactions > 0
        ? ((parseInt(stats.successful_transactions) / parseInt(stats.total_transactions)) * 100).toFixed(2)
        : 0;

      enterpriseLogger.info('Transaction stats retrieved via admin API', {
        adminId: req.user?.id,
        dateRange: { dateFrom, dateTo },
      });

      res.status(200).json({
        success: true,
        message: 'Transaction statistics retrieved successfully',
        data: {
          summary: {
            totalTransactions: parseInt(stats.total_transactions),
            successfulTransactions: parseInt(stats.successful_transactions),
            failedTransactions: parseInt(stats.failed_transactions),
            pendingTransactions: parseInt(stats.pending_transactions),
            refundedTransactions: parseInt(stats.refunded_transactions),
            totalRevenue: parseFloat(stats.total_revenue),
            averageTransaction: parseFloat(stats.average_transaction),
            totalRefunded: parseFloat(stats.total_refunded),
            successRate: parseFloat(successRate),
          },
          revenueByMethod: revenueByMethod.map(item => ({
            method: item.paymentMethod || 'Unknown',
            count: parseInt(item.count),
            total: parseFloat(item.total),
          })),
          dailyTrend: dailyRevenue,
          dateRange: { from: dateFrom, to: dateTo },
        },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to get transaction stats via admin API', {
        error: error.message,
        adminId: req.user?.id,
        stack: error.stack,
      });
      next(error);
    }
  }

  /**
   * Get transactions list
   * GET /api/admin/financial/transactions
   */
  async getTransactions(req, res, next) {
    try {
      const adminId = req.user.id;
      const {
        status,
        paymentStatus,
        paymentMethod,
        invoiceNumber,
        search,
        startDate,
        endDate,
        userId,
        minAmount,
        maxAmount,
        disputed,
        limit = 50,
        offset = 0,
      } = req.query;

      const whereClause = {};

      // Status filter
      if (status) {
        whereClause.status = status.toLowerCase();
      }

      // Payment status filter
      if (paymentStatus) {
        whereClause.paymentStatus = paymentStatus.toLowerCase();
      }

      // Payment method filter
      if (paymentMethod) {
        whereClause.paymentMethod = paymentMethod.toLowerCase();
      }

      // Invoice number search
      if (invoiceNumber) {
        whereClause.invoiceNumber = { [Op.iLike]: `%${invoiceNumber}%` };
      }

      // Disputed filter
      if (disputed === 'true') {
        whereClause['metadata.disputed'] = true;
      }

      if (userId) {
        whereClause.userId = userId;
      }

      if (startDate || endDate) {
        whereClause.invoiceDate = {};
        if (startDate) {
          whereClause.invoiceDate[Op.gte] = startDate;
        }
        if (endDate) {
          whereClause.invoiceDate[Op.lte] = endDate;
        }
      }

      if (minAmount || maxAmount) {
        whereClause.totalAmount = {};
        if (minAmount) {
          whereClause.totalAmount[Op.gte] = parseFloat(minAmount);
        }
        if (maxAmount) {
          whereClause.totalAmount[Op.lte] = parseFloat(maxAmount);
        }
      }

      const { count, rows: invoices } = await Invoice.findAndCountAll({
        where: whereClause,
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset),
      });

      // Get user details for each invoice
      const invoicesWithUsers = await Promise.all(
        invoices.map(async (invoice) => {
          const user = await User.findByPk(invoice.userId, {
            attributes: ['id', 'fullName', 'email', 'phone'],
          });
          return { invoice, user };
        })
      );

      // Format transactions with user data
      const transactions = invoicesWithUsers.map(({ invoice, user }) => ({
        ...invoice.toJSON(),
        user: user,
      }));

      res.status(200).json({
        success: true,
        message: 'Transactions retrieved successfully',
        data: {
          transactions: transactions,
          pagination: {
            total: count,
            limit: parseInt(limit),
            offset: parseInt(offset),
            totalPages: Math.ceil(count / limit),
          },
        },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to get transactions via admin API', {
        error: error.message,
        adminId: req.user?.id,
        stack: error.stack,
      });
      next(error);
    }
  }

  /**
   * Get transaction details
   * GET /api/admin/financial/transactions/:id
   */
  async getTransactionDetails(req, res, next) {
    try {
      const { id } = req.params;
      const adminId = req.user.id;

      const invoice = await Invoice.findByPk(id);
      if (!invoice) {
        throw new AppError('Transaction not found', 404);
      }

      // Get user details
      const user = await User.findByPk(invoice.userId, {
        attributes: ['id', 'fullName', 'email', 'phone'],
      });

      // Get filing if exists
      let filing = null;
      if (invoice.filingId) {
        filing = await ITRFiling.findByPk(invoice.filingId, {
          attributes: ['id', 'itrType', 'assessmentYear', 'status'],
        });
      }

      if (!invoice) {
        throw new AppError('Transaction not found', 404);
      }

      // Get related transactions (refunds, chargebacks, etc.)
      const relatedTransactions = await Invoice.findAll({
        where: {
          [Op.or]: [
            { 'metadata.originalInvoiceId': id },
            { filingId: invoice.filingId, id: { [Op.ne]: id } },
          ],
        },
        attributes: ['id', 'invoiceNumber', 'status', 'totalAmount', 'invoiceDate'],
        order: [['createdAt', 'DESC']],
        limit: 10,
      });

      res.status(200).json({
        success: true,
        message: 'Transaction details retrieved successfully',
        data: {
          transaction: {
            ...invoice.toJSON(),
            user: user,
            filing: filing,
            relatedTransactions: relatedTransactions,
          },
        },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to get transaction details via admin API', {
        error: error.message,
        adminId: req.user?.id,
        transactionId: req.params.id,
      });
      next(error);
    }
  }

  /**
   * Add notes to a transaction
   * POST /api/admin/financial/transactions/:id/notes
   */
  async addTransactionNotes(req, res, next) {
    try {
      const { id } = req.params;
      const { notes } = req.body;
      const adminId = req.user.id;

      if (!notes || !notes.trim()) {
        throw new AppError('Notes content is required', 400);
      }

      const invoice = await Invoice.findByPk(id);
      if (!invoice) {
        throw new AppError('Transaction not found', 404);
      }

      // Get admin user info for the note
      const adminUser = await User.findByPk(adminId, {
        attributes: ['fullName', 'email'],
      });

      // Append to existing notes with timestamp
      const existingNotes = invoice.metadata?.adminNotes || [];
      const newNote = {
        id: require('crypto').randomUUID(),
        content: notes.trim(),
        addedBy: adminId,
        addedByName: adminUser?.fullName || 'Admin',
        addedAt: new Date().toISOString(),
      };

      await invoice.update({
        metadata: {
          ...(invoice.metadata || {}),
          adminNotes: [...existingNotes, newNote],
        },
      });

      // Log audit event
      await auditService.logDataAccess(
        adminId,
        'update',
        'transaction_notes',
        id,
        { action: 'add_notes', noteId: newNote.id },
        req.ip,
      );

      enterpriseLogger.info('Transaction notes added via admin API', {
        adminId,
        transactionId: id,
      });

      res.status(200).json({
        success: true,
        message: 'Notes added successfully',
        data: {
          note: newNote,
          allNotes: [...existingNotes, newNote],
        },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to add transaction notes via admin API', {
        error: error.message,
        adminId: req.user?.id,
        transactionId: req.params.id,
      });
      next(error);
    }
  }

  /**
   * Mark transaction as disputed
   * POST /api/admin/financial/transactions/:id/dispute
   */
  async markAsDisputed(req, res, next) {
    try {
      const { id } = req.params;
      const { reason, details } = req.body;
      const adminId = req.user.id;

      if (!reason || !reason.trim()) {
        throw new AppError('Dispute reason is required', 400);
      }

      const invoice = await Invoice.findByPk(id);
      if (!invoice) {
        throw new AppError('Transaction not found', 404);
      }

      if (invoice.metadata?.disputed) {
        throw new AppError('Transaction is already marked as disputed', 400);
      }

      await invoice.update({
        metadata: {
          ...(invoice.metadata || {}),
          disputed: true,
          disputedAt: new Date().toISOString(),
          disputedBy: adminId,
          disputeReason: reason.trim(),
          disputeDetails: details || null,
          disputeStatus: 'open',
        },
      });

      // Log audit event
      await auditService.logDataAccess(
        adminId,
        'update',
        'transaction_dispute',
        id,
        { action: 'mark_disputed', reason: reason },
        req.ip,
      );

      enterpriseLogger.info('Transaction marked as disputed via admin API', {
        adminId,
        transactionId: id,
        reason,
      });

      res.status(200).json({
        success: true,
        message: 'Transaction marked as disputed',
        data: {
          transaction: invoice,
        },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to mark transaction as disputed via admin API', {
        error: error.message,
        adminId: req.user?.id,
        transactionId: req.params.id,
      });
      next(error);
    }
  }

  /**
   * Resolve dispute
   * POST /api/admin/financial/transactions/:id/resolve-dispute
   */
  async resolveDispute(req, res, next) {
    try {
      const { id } = req.params;
      const { resolution, notes } = req.body;
      const adminId = req.user.id;

      if (!resolution || !resolution.trim()) {
        throw new AppError('Resolution is required', 400);
      }

      const invoice = await Invoice.findByPk(id);
      if (!invoice) {
        throw new AppError('Transaction not found', 404);
      }

      if (!invoice.metadata?.disputed) {
        throw new AppError('Transaction is not disputed', 400);
      }

      await invoice.update({
        metadata: {
          ...(invoice.metadata || {}),
          disputeStatus: 'resolved',
          disputeResolvedAt: new Date().toISOString(),
          disputeResolvedBy: adminId,
          disputeResolution: resolution.trim(),
          disputeResolutionNotes: notes || null,
        },
      });

      // Log audit event
      await auditService.logDataAccess(
        adminId,
        'update',
        'transaction_dispute_resolution',
        id,
        { action: 'resolve_dispute', resolution: resolution },
        req.ip,
      );

      enterpriseLogger.info('Transaction dispute resolved via admin API', {
        adminId,
        transactionId: id,
      });

      res.status(200).json({
        success: true,
        message: 'Dispute resolved successfully',
        data: {
          transaction: invoice,
        },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to resolve transaction dispute via admin API', {
        error: error.message,
        adminId: req.user?.id,
        transactionId: req.params.id,
      });
      next(error);
    }
  }

  /**
   * Retry failed payment
   * POST /api/admin/financial/transactions/:id/retry
   */
  async retryFailedPayment(req, res, next) {
    try {
      const { id } = req.params;
      const adminId = req.user.id;

      const invoice = await Invoice.findByPk(id);
      if (!invoice) {
        throw new AppError('Transaction not found', 404);
      }

      if (invoice.paymentStatus !== 'failed') {
        throw new AppError('Only failed payments can be retried', 400);
      }

      // Reset payment status to pending for retry
      await invoice.update({
        paymentStatus: 'pending',
        status: 'sent',
        metadata: {
          ...(invoice.metadata || {}),
          retryCount: (invoice.metadata?.retryCount || 0) + 1,
          lastRetryAt: new Date().toISOString(),
          lastRetryBy: adminId,
        },
      });

      // Log audit event
      await auditService.logDataAccess(
        adminId,
        'update',
        'transaction_retry',
        id,
        { action: 'retry_payment', retryCount: invoice.metadata?.retryCount },
        req.ip,
      );

      // TODO: Trigger actual payment retry via payment gateway
      // This would integrate with Razorpay/Stripe to create a new payment link
      // For now, we just reset the status

      enterpriseLogger.info('Payment retry initiated via admin API', {
        adminId,
        transactionId: id,
      });

      res.status(200).json({
        success: true,
        message: 'Payment retry initiated. User will be notified to complete payment.',
        data: {
          transaction: invoice,
        },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to retry payment via admin API', {
        error: error.message,
        adminId: req.user?.id,
        transactionId: req.params.id,
      });
      next(error);
    }
  }

  /**
   * Process refund for a transaction
   * POST /api/admin/financial/transactions/:id/refund
   */
  async processRefund(req, res, next) {
    try {
      const { id } = req.params;
      const { amount, reason, refundType = 'full' } = req.body;
      const adminId = req.user.id;

      const invoice = await Invoice.findByPk(id);
      if (!invoice) {
        throw new AppError('Transaction not found', 404);
      }

      if (invoice.status !== 'paid') {
        throw new AppError('Only paid transactions can be refunded', 400);
      }

      const refundAmount = refundType === 'full'
        ? parseFloat(invoice.totalAmount)
        : parseFloat(amount);

      if (refundAmount <= 0 || refundAmount > parseFloat(invoice.totalAmount)) {
        throw new AppError('Invalid refund amount', 400);
      }

      // Update invoice status
      await invoice.update({
        status: 'REFUNDED',
        paymentStatus: 'refunded',
        metadata: {
          ...(invoice.metadata || {}),
          refundedAt: new Date().toISOString(),
          refundedBy: adminId,
          refundAmount: refundAmount,
          refundReason: reason,
          refundType: refundType,
        },
      });

      // Create refund tracking record if filing exists
      if (invoice.filingId) {
        await RefundTracking.create({
          filingId: invoice.filingId,
          expectedAmount: refundAmount,
          status: 'processing',
          bankAccount: invoice.metadata?.bankAccount || null,
        });
      }

      // Log audit event
      await auditService.logDataAccess(
        adminId,
        'update',
        'transaction_refund',
        id,
        {
          action: 'process_refund',
          refundAmount: refundAmount,
          refundType: refundType,
          reason: reason,
        },
        req.ip,
      );

      enterpriseLogger.info('Transaction refund processed via admin API', {
        adminId,
        transactionId: id,
        refundAmount,
      });

      res.status(200).json({
        success: true,
        message: 'Refund processed successfully',
        data: {
          transaction: invoice,
          refundAmount: refundAmount,
        },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to process refund via admin API', {
        error: error.message,
        adminId: req.user?.id,
        transactionId: req.params.id,
      });
      next(error);
    }
  }

  /**
   * Export transactions
   * GET /api/admin/financial/transactions/export
   */
  async exportTransactions(req, res, next) {
    try {
      const adminId = req.user.id;
      const { format = 'csv', ...filters } = req.query;

      // Get all transactions matching filters (no pagination for export)
      const whereClause = {};

      if (filters.status) {
        whereClause.status = filters.status.toUpperCase();
      }

      if (filters.startDate || filters.endDate) {
        whereClause.invoiceDate = {};
        if (filters.startDate) {
          whereClause.invoiceDate[Op.gte] = filters.startDate;
        }
        if (filters.endDate) {
          whereClause.invoiceDate[Op.lte] = filters.endDate;
        }
      }

      const invoices = await Invoice.findAll({
        where: whereClause,
        order: [['createdAt', 'DESC']],
      });

      // Get user details for export
      const invoicesWithUsers = await Promise.all(
        invoices.map(async (invoice) => {
          const user = await User.findByPk(invoice.userId, {
            attributes: ['fullName', 'email'],
          });
          return { invoice, user };
        })
      );

      // Format for CSV export
      if (format === 'csv') {
        const csvHeader = 'Invoice Number,Date,User,Amount,Status,Payment Method\n';
        const csvRows = invoicesWithUsers.map(({ invoice, user }) => {
          return [
            invoice.invoiceNumber,
            invoice.invoiceDate,
            user?.fullName || 'N/A',
            invoice.totalAmount,
            invoice.status,
            invoice.metadata?.paymentMethod || 'N/A',
          ].join(',');
        }).join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=transactions-${Date.now()}.csv`);
        res.send(csvHeader + csvRows);
      } else {
        // JSON export
        const transactions = invoicesWithUsers.map(({ invoice, user }) => ({
          ...invoice.toJSON(),
          user: user,
        }));

        res.status(200).json({
          success: true,
          message: 'Transactions exported successfully',
          data: {
            transactions: transactions,
            exportedAt: new Date().toISOString(),
          },
        });
      }

    } catch (error) {
      enterpriseLogger.error('Failed to export transactions via admin API', {
        error: error.message,
        adminId: req.user?.id,
      });
      next(error);
    }
  }

  /**
   * Get refunds list
   * GET /api/admin/financial/refunds
   */
  async getRefunds(req, res, next) {
    try {
      const adminId = req.user.id;
      const {
        status,
        startDate,
        endDate,
        userId,
        limit = 50,
        offset = 0,
      } = req.query;

      const whereClause = {};

      if (status) {
        whereClause.status = status.toLowerCase();
      }

      if (userId) {
        // Get user's filing IDs
        const userFilings = await ITRFiling.findAll({
          where: { userId },
          attributes: ['id'],
        });
        const filingIds = userFilings.map(f => f.id);
        whereClause.filingId = { [Op.in]: filingIds };
      }

      const { count, rows: refunds } = await RefundTracking.findAndCountAll({
        where: whereClause,
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset),
      });

      // Get filing and user details for each refund
      const refundsWithDetails = await Promise.all(
        refunds.map(async (refund) => {
          let filing = null;
          let user = null;
          if (refund.filingId) {
            filing = await ITRFiling.findByPk(refund.filingId, {
              attributes: ['id', 'itrType', 'assessmentYear', 'userId'],
            });
            if (filing && filing.userId) {
              user = await User.findByPk(filing.userId, {
                attributes: ['id', 'fullName', 'email'],
              });
            }
          }
          return { refund, filing, user };
        })
      );

      const formattedRefunds = refundsWithDetails.map(({ refund, filing, user }) => ({
        ...refund.toJSON(),
        user: user,
        filing: filing,
      }));

      res.status(200).json({
        success: true,
        message: 'Refunds retrieved successfully',
        data: {
          refunds: formattedRefunds,
          pagination: {
            total: count,
            limit: parseInt(limit),
            offset: parseInt(offset),
            totalPages: Math.ceil(count / limit),
          },
        },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to get refunds via admin API', {
        error: error.message,
        adminId: req.user?.id,
        stack: error.stack,
      });
      next(error);
    }
  }

  /**
   * Approve refund request
   * POST /api/admin/financial/refunds/:id/approve
   */
  async approveRefund(req, res, next) {
    try {
      const { id } = req.params;
      const { notes } = req.body;
      const adminId = req.user.id;

      const refund = await RefundTracking.findByPk(id);
      if (!refund) {
        throw new AppError('Refund request not found', 404);
      }

      await refund.update({
        status: 'issued',
        metadata: {
          ...(refund.metadata || {}),
          approvedAt: new Date().toISOString(),
          approvedBy: adminId,
          approvalNotes: notes,
        },
      });

      // Log audit event
      await auditService.logDataAccess(
        adminId,
        'update',
        'refund_approval',
        id,
        {
          action: 'approve_refund',
          refundId: id,
          notes: notes,
        },
        req.ip,
      );

      enterpriseLogger.info('Refund approved via admin API', {
        adminId,
        refundId: id,
      });

      res.status(200).json({
        success: true,
        message: 'Refund approved successfully',
        data: {
          refund: refund,
        },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to approve refund via admin API', {
        error: error.message,
        adminId: req.user?.id,
        refundId: req.params.id,
      });
      next(error);
    }
  }

  /**
   * Reject refund request
   * POST /api/admin/financial/refunds/:id/reject
   */
  async rejectRefund(req, res, next) {
    try {
      const { id } = req.params;
      const { reason, notes } = req.body;
      const adminId = req.user.id;

      if (!reason) {
        throw new AppError('Rejection reason is required', 400);
      }

      const refund = await RefundTracking.findByPk(id);
      if (!refund) {
        throw new AppError('Refund request not found', 404);
      }

      await refund.update({
        status: 'failed',
        metadata: {
          ...(refund.metadata || {}),
          rejectedAt: new Date().toISOString(),
          rejectedBy: adminId,
          rejectionReason: reason,
          rejectionNotes: notes,
        },
      });

      // Log audit event
      await auditService.logDataAccess(
        adminId,
        'update',
        'refund_rejection',
        id,
        {
          action: 'reject_refund',
          refundId: id,
          reason: reason,
          notes: notes,
        },
        req.ip,
      );

      enterpriseLogger.info('Refund rejected via admin API', {
        adminId,
        refundId: id,
        reason,
      });

      res.status(200).json({
        success: true,
        message: 'Refund rejected successfully',
        data: {
          refund: refund,
        },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to reject refund via admin API', {
        error: error.message,
        adminId: req.user?.id,
        refundId: req.params.id,
      });
      next(error);
    }
  }

  /**
   * Process approved refund
   * POST /api/admin/financial/refunds/:id/process
   */
  async processRefundRequest(req, res, next) {
    try {
      const { id } = req.params;
      const adminId = req.user.id;

      const refund = await RefundTracking.findByPk(id);

      if (!refund) {
        throw new AppError('Refund request not found', 404);
      }

      if (refund.status !== 'issued') {
        throw new AppError('Refund must be approved before processing', 400);
      }

      // Update refund status to credited
      await refund.update({
        status: 'credited',
        statusDate: new Date(),
        metadata: {
          ...(refund.metadata || {}),
          processedAt: new Date().toISOString(),
          processedBy: adminId,
        },
      });

      // Update related invoice if exists
      if (refund.filingId) {
        const invoice = await Invoice.findOne({
          where: { filingId: refund.filingId },
        });
        if (invoice) {
          await invoice.update({
            status: 'REFUNDED',
            paymentStatus: 'refunded',
          });
        }
      }

      // Log audit event
      await auditService.logDataAccess(
        adminId,
        'update',
        'refund_processing',
        id,
        {
          action: 'process_refund',
          refundId: id,
          amount: refund.expectedAmount,
        },
        req.ip,
      );

      enterpriseLogger.info('Refund processed via admin API', {
        adminId,
        refundId: id,
      });

      res.status(200).json({
        success: true,
        message: 'Refund processed successfully',
        data: {
          refund: refund,
        },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to process refund via admin API', {
        error: error.message,
        adminId: req.user?.id,
        refundId: req.params.id,
      });
      next(error);
    }
  }

  /**
   * Get pricing plans
   * GET /api/admin/financial/pricing/plans
   */
  async getPricingPlans(req, res, next) {
    try {
      const adminId = req.user.id;
      const { isActive, limit = 100, offset = 0 } = req.query;

      const whereClause = {};
      if (isActive !== undefined) {
        whereClause.isActive = isActive === 'true';
      }

      const { count, rows: plans } = await PricingPlan.findAndCountAll({
        where: whereClause,
        order: [['price', 'ASC']],
        limit: parseInt(limit),
        offset: parseInt(offset),
      });

      res.status(200).json({
        success: true,
        message: 'Pricing plans retrieved successfully',
        data: {
          plans: plans,
          pagination: {
            total: count,
            limit: parseInt(limit),
            offset: parseInt(offset),
            totalPages: Math.ceil(count / limit),
          },
        },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to get pricing plans via admin API', {
        error: error.message,
        adminId: req.user?.id,
        stack: error.stack,
      });
      next(error);
    }
  }

  /**
   * Create pricing plan
   * POST /api/admin/financial/pricing/plans
   */
  async createPricingPlan(req, res, next) {
    try {
      const adminId = req.user.id;
      const {
        name,
        description,
        price,
        currency = 'INR',
        features = [],
        itrTypesAllowed = [],
        validityPeriod = 365,
        userTypeRestrictions = [],
        metadata = {},
      } = req.body;

      if (!name || !price) {
        throw new AppError('Name and price are required', 400);
      }

      const plan = await PricingPlan.create({
        name,
        description,
        price: parseFloat(price),
        currency,
        features,
        itrTypesAllowed,
        validityPeriod: parseInt(validityPeriod),
        userTypeRestrictions,
        isActive: true,
        metadata,
      });

      // Log audit event
      await auditService.logDataAccess(
        adminId,
        'create',
        'pricing_plan',
        plan.id,
        {
          action: 'create_pricing_plan',
          planName: name,
          price: price,
        },
        req.ip,
      );

      enterpriseLogger.info('Pricing plan created via admin API', {
        adminId,
        planId: plan.id,
        planName: name,
      });

      res.status(201).json({
        success: true,
        message: 'Pricing plan created successfully',
        data: {
          plan: plan,
        },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to create pricing plan via admin API', {
        error: error.message,
        adminId: req.user?.id,
      });
      next(error);
    }
  }

  /**
   * Update pricing plan
   * PUT /api/admin/financial/pricing/plans/:id
   */
  async updatePricingPlan(req, res, next) {
    try {
      const { id } = req.params;
      const adminId = req.user.id;
      const updateData = req.body;

      const plan = await PricingPlan.findByPk(id);
      if (!plan) {
        throw new AppError('Pricing plan not found', 404);
      }

      // Convert price to float if provided
      if (updateData.price !== undefined) {
        updateData.price = parseFloat(updateData.price);
      }

      // Convert validityPeriod to int if provided
      if (updateData.validityPeriod !== undefined) {
        updateData.validityPeriod = parseInt(updateData.validityPeriod);
      }

      await plan.update(updateData);

      // Log audit event
      await auditService.logDataAccess(
        adminId,
        'update',
        'pricing_plan',
        id,
        {
          action: 'update_pricing_plan',
          changes: updateData,
        },
        req.ip,
      );

      enterpriseLogger.info('Pricing plan updated via admin API', {
        adminId,
        planId: id,
      });

      res.status(200).json({
        success: true,
        message: 'Pricing plan updated successfully',
        data: {
          plan: plan,
        },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to update pricing plan via admin API', {
        error: error.message,
        adminId: req.user?.id,
        planId: req.params.id,
      });
      next(error);
    }
  }

  /**
   * Delete pricing plan (soft delete)
   * DELETE /api/admin/financial/pricing/plans/:id
   */
  async deletePricingPlan(req, res, next) {
    try {
      const { id } = req.params;
      const adminId = req.user.id;

      const plan = await PricingPlan.findByPk(id);
      if (!plan) {
        throw new AppError('Pricing plan not found', 404);
      }

      // Soft delete by deactivating
      await plan.update({ isActive: false });

      // Log audit event
      await auditService.logDataAccess(
        adminId,
        'delete',
        'pricing_plan',
        id,
        {
          action: 'delete_pricing_plan',
          planName: plan.name,
        },
        req.ip,
      );

      enterpriseLogger.info('Pricing plan deleted via admin API', {
        adminId,
        planId: id,
      });

      res.status(200).json({
        success: true,
        message: 'Pricing plan deleted successfully',
      });

    } catch (error) {
      enterpriseLogger.error('Failed to delete pricing plan via admin API', {
        error: error.message,
        adminId: req.user?.id,
        planId: req.params.id,
      });
      next(error);
    }
  }

  /**
   * Get coupons list
   * GET /api/admin/financial/coupons
   */
  async getCoupons(req, res, next) {
    try {
      const adminId = req.user.id;
      const {
        isActive,
        code,
        discountType,
        limit = 50,
        offset = 0,
      } = req.query;

      const whereClause = {};

      if (isActive !== undefined) {
        whereClause.isActive = isActive === 'true';
      }

      if (code) {
        whereClause.code = { [Op.iLike]: `%${code}%` };
      }

      if (discountType) {
        whereClause.discountType = discountType;
      }

      const { count, rows } = await Coupon.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['createdAt', 'DESC']],
      });

      enterpriseLogger.info('Coupons retrieved via admin API', {
        adminId,
        count: rows.length,
        total: count,
      });

      res.status(200).json({
        success: true,
        data: {
          coupons: rows,
          pagination: {
            total: count,
            limit: parseInt(limit),
            offset: parseInt(offset),
            totalPages: Math.ceil(count / limit),
          },
        },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to get coupons via admin API', {
        error: error.message,
        adminId: req.user?.id,
      });
      next(error);
    }
  }

  /**
   * Create a new coupon
   * POST /api/admin/financial/coupons
   */
  async createCoupon(req, res, next) {
    try {
      const adminId = req.user.id;
      const {
        code,
        discountType,
        discountValue,
        usageLimit,
        startDate,
        endDate,
        applicablePlans,
        userRestrictions,
        minimumOrderValue,
        isActive,
        metadata,
      } = req.body;

      // Validate required fields
      if (!code || !discountType || !discountValue || !startDate || !endDate) {
        throw new AppError('Missing required fields: code, discountType, discountValue, startDate, endDate', 400);
      }

      // Validate discount value
      if (discountType === 'percentage' && (discountValue < 0 || discountValue > 100)) {
        throw new AppError('Percentage discount must be between 0 and 100', 400);
      }

      if (discountType === 'flat' && discountValue < 0) {
        throw new AppError('Flat discount must be positive', 400);
      }

      // Check if code already exists
      const existingCoupon = await Coupon.findOne({ where: { code: code.toUpperCase() } });
      if (existingCoupon) {
        throw new AppError('Coupon code already exists', 409);
      }

      const coupon = await Coupon.create({
        code: code.toUpperCase(),
        discountType,
        discountValue,
        usageLimit: usageLimit || null,
        startDate,
        endDate,
        applicablePlans: applicablePlans || [],
        userRestrictions: userRestrictions || {},
        minimumOrderValue: minimumOrderValue || 0,
        isActive: isActive !== undefined ? isActive : true,
        metadata: metadata || {},
      });

      // Log audit event
      await auditService.logDataAccess(
        adminId,
        'create',
        'coupon',
        coupon.id,
        {
          action: 'create_coupon',
          code: coupon.code,
        },
        req.ip,
      );

      enterpriseLogger.info('Coupon created via admin API', {
        adminId,
        couponId: coupon.id,
        code: coupon.code,
      });

      res.status(201).json({
        success: true,
        message: 'Coupon created successfully',
        data: { coupon },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to create coupon via admin API', {
        error: error.message,
        adminId: req.user?.id,
      });
      next(error);
    }
  }

  /**
   * Update a coupon
   * PUT /api/admin/financial/coupons/:id
   */
  async updateCoupon(req, res, next) {
    try {
      const { id } = req.params;
      const adminId = req.user.id;
      const updateData = req.body;

      const coupon = await Coupon.findByPk(id);
      if (!coupon) {
        throw new AppError('Coupon not found', 404);
      }

      // If code is being updated, check for duplicates
      if (updateData.code && updateData.code.toUpperCase() !== coupon.code) {
        const existingCoupon = await Coupon.findOne({
          where: { code: updateData.code.toUpperCase() },
        });
        if (existingCoupon) {
          throw new AppError('Coupon code already exists', 409);
        }
        updateData.code = updateData.code.toUpperCase();
      }

      // Validate discount value if being updated
      if (updateData.discountValue !== undefined) {
        const discountType = updateData.discountType || coupon.discountType;
        if (discountType === 'percentage' && (updateData.discountValue < 0 || updateData.discountValue > 100)) {
          throw new AppError('Percentage discount must be between 0 and 100', 400);
        }
        if (discountType === 'flat' && updateData.discountValue < 0) {
          throw new AppError('Flat discount must be positive', 400);
        }
      }

      await coupon.update(updateData);

      // Log audit event
      await auditService.logDataAccess(
        adminId,
        'update',
        'coupon',
        id,
        {
          action: 'update_coupon',
          code: coupon.code,
          changes: updateData,
        },
        req.ip,
      );

      enterpriseLogger.info('Coupon updated via admin API', {
        adminId,
        couponId: id,
      });

      res.status(200).json({
        success: true,
        message: 'Coupon updated successfully',
        data: { coupon },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to update coupon via admin API', {
        error: error.message,
        adminId: req.user?.id,
        couponId: req.params.id,
      });
      next(error);
    }
  }

  /**
   * Delete a coupon
   * DELETE /api/admin/financial/coupons/:id
   */
  async deleteCoupon(req, res, next) {
    try {
      const { id } = req.params;
      const adminId = req.user.id;

      const coupon = await Coupon.findByPk(id);
      if (!coupon) {
        throw new AppError('Coupon not found', 404);
      }

      // Soft delete by deactivating
      await coupon.update({ isActive: false });

      // Log audit event
      await auditService.logDataAccess(
        adminId,
        'delete',
        'coupon',
        id,
        {
          action: 'delete_coupon',
          code: coupon.code,
        },
        req.ip,
      );

      enterpriseLogger.info('Coupon deleted via admin API', {
        adminId,
        couponId: id,
      });

      res.status(200).json({
        success: true,
        message: 'Coupon deleted successfully',
      });

    } catch (error) {
      enterpriseLogger.error('Failed to delete coupon via admin API', {
        error: error.message,
        adminId: req.user?.id,
        couponId: req.params.id,
      });
      next(error);
    }
  }

  /**
   * Get coupon usage statistics
   * GET /api/admin/financial/coupons/:id/usage
   */
  async getCouponUsage(req, res, next) {
    try {
      const { id } = req.params;
      const adminId = req.user.id;

      const coupon = await Coupon.findByPk(id);
      if (!coupon) {
        throw new AppError('Coupon not found', 404);
      }

      // Get invoices that used this coupon (check metadata for coupon code)
      // Get all invoices with discounts and filter by coupon code in metadata
      const allInvoices = await Invoice.findAll({
        where: {
          discountAmount: {
            [Op.gt]: 0,
          },
        },
        include: [
          {
            model: User,
            attributes: ['id', 'email', 'name'],
          },
        ],
        order: [['createdAt', 'DESC']],
      });

      // Filter invoices that used this specific coupon
      const invoices = allInvoices.filter(invoice => {
        return invoice.metadata?.couponCode === coupon.code;
      });

      const totalDiscount = invoices.reduce((sum, invoice) => {
        return sum + parseFloat(invoice.discountAmount || 0);
      }, 0);

      const usageStats = {
        coupon: {
          id: coupon.id,
          code: coupon.code,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          usageLimit: coupon.usageLimit,
          usedCount: coupon.usedCount,
          isActive: coupon.isActive,
        },
        statistics: {
          totalUsage: invoices.length,
          totalDiscountGiven: totalDiscount,
          averageDiscount: invoices.length > 0 ? totalDiscount / invoices.length : 0,
          usageRate: coupon.usageLimit
            ? ((coupon.usedCount / coupon.usageLimit) * 100).toFixed(2)
            : null,
        },
        recentUsage: invoices.slice(0, 10).map(invoice => ({
          invoiceId: invoice.id,
          userId: invoice.userId,
          userEmail: invoice.User?.email,
          userName: invoice.User?.name,
          discountAmount: invoice.discountAmount,
          invoiceDate: invoice.invoiceDate,
        })),
      };

      enterpriseLogger.info('Coupon usage retrieved via admin API', {
        adminId,
        couponId: id,
        usageCount: invoices.length,
      });

      res.status(200).json({
        success: true,
        data: usageStats,
      });

    } catch (error) {
      enterpriseLogger.error('Failed to get coupon usage via admin API', {
        error: error.message,
        adminId: req.user?.id,
        couponId: req.params.id,
      });
      next(error);
    }
  }
}

module.exports = new AdminFinancialController();

