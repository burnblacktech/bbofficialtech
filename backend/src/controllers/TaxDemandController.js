// =====================================================
// TAX DEMAND CONTROLLER
// Handles tax demand management endpoints
// =====================================================

const taxDemandService = require('../services/itr/TaxDemandService');
const enterpriseLogger = require('../utils/logger');
const { AppError } = require('../middleware/errorHandler');
const {
  successResponse,
  errorResponse,
  validationErrorResponse,
  notFoundResponse,
} = require('../utils/responseFormatter');
const auditService = require('../services/itr/AuditInformationService');

class TaxDemandController {
  /**
   * Create a new tax demand
   * POST /api/tax-demands
   */
  async createDemand(req, res, next) {
    try {
      const userId = req.user.id;
      const demandData = req.body;

      // Validate required fields
      if (!demandData.demandNumber || !demandData.demandType || !demandData.assessmentYear || !demandData.subject || !demandData.totalAmount) {
        return validationErrorResponse(res, 'Missing required fields: demandNumber, demandType, assessmentYear, subject, totalAmount');
      }

      const demand = await taxDemandService.createDemand(userId, demandData);

      // Log audit event
      await auditService.logDataAccess(
        userId,
        'create',
        'tax_demand',
        demand.id,
        {
          action: 'create_tax_demand',
          demandNumber: demand.demandNumber,
          demandType: demand.demandType,
          totalAmount: demand.totalAmount,
        },
        req.ip,
      );

      return successResponse(res, 'Tax demand created successfully', demand, 201);
    } catch (error) {
      enterpriseLogger.error('Failed to create tax demand', {
        userId: req.user?.id,
        error: error.message,
      });
      next(error);
    }
  }

  /**
   * Get demand by ID
   * GET /api/tax-demands/:id
   */
  async getDemand(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const demand = await taxDemandService.getDemandById(id, userId);

      return successResponse(res, 'Tax demand retrieved successfully', demand);
    } catch (error) {
      enterpriseLogger.error('Failed to get tax demand', {
        demandId: req.params.id,
        userId: req.user?.id,
        error: error.message,
      });
      next(error);
    }
  }

  /**
   * Get all demands for user
   * GET /api/tax-demands
   */
  async getUserDemands(req, res, next) {
    try {
      const userId = req.user.id;
      const { status, demandType, assessmentYear, page = 1, limit = 20 } = req.query;

      const filters = { page, limit };
      if (status) filters.status = status;
      if (demandType) filters.demandType = demandType;
      if (assessmentYear) filters.assessmentYear = assessmentYear;

      const result = await taxDemandService.getUserDemands(userId, filters);

      return successResponse(res, 'Tax demands retrieved successfully', result);
    } catch (error) {
      enterpriseLogger.error('Failed to get user demands', {
        userId: req.user?.id,
        error: error.message,
      });
      next(error);
    }
  }

  /**
   * Record payment for a demand
   * POST /api/tax-demands/:id/payment
   */
  async recordPayment(req, res, next) {
    try {
      const { id } = req.params;
      const { amount, paymentMethod, transactionId, paymentDate } = req.body;
      const userId = req.user.id;

      if (!amount || !paymentMethod) {
        return validationErrorResponse(res, 'Amount and paymentMethod are required');
      }

      const demand = await taxDemandService.recordPayment(id, userId, {
        amount,
        paymentMethod,
        transactionId,
        paymentDate,
      });

      // Log audit event
      await auditService.logDataAccess(
        userId,
        'update',
        'tax_demand',
        id,
        {
          action: 'record_payment',
          amount,
          paymentMethod,
          transactionId,
        },
        req.ip,
      );

      return successResponse(res, 'Payment recorded successfully', demand);
    } catch (error) {
      enterpriseLogger.error('Failed to record payment', {
        demandId: req.params.id,
        userId: req.user?.id,
        error: error.message,
      });
      next(error);
    }
  }

  /**
   * Dispute a demand
   * POST /api/tax-demands/:id/dispute
   */
  async disputeDemand(req, res, next) {
    try {
      const { id } = req.params;
      const { disputeReason, disputeDocuments } = req.body;
      const userId = req.user.id;

      if (!disputeReason) {
        return validationErrorResponse(res, 'Dispute reason is required');
      }

      const demand = await taxDemandService.disputeDemand(id, userId, {
        disputeReason,
        disputeDocuments,
      });

      // Log audit event
      await auditService.logDataAccess(
        userId,
        'update',
        'tax_demand',
        id,
        {
          action: 'dispute_demand',
          demandNumber: demand.demandNumber,
        },
        req.ip,
      );

      return successResponse(res, 'Demand disputed successfully', demand);
    } catch (error) {
      enterpriseLogger.error('Failed to dispute demand', {
        demandId: req.params.id,
        userId: req.user?.id,
        error: error.message,
      });
      next(error);
    }
  }

  /**
   * Update demand status
   * PATCH /api/tax-demands/:id/status
   */
  async updateStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status, message } = req.body;
      const userId = req.user.id;

      if (!status) {
        return validationErrorResponse(res, 'Status is required');
      }

      const demand = await taxDemandService.updateDemandStatus(id, userId, status, { message });

      // Log audit event
      await auditService.logDataAccess(
        userId,
        'update',
        'tax_demand',
        id,
        {
          action: 'update_demand_status',
          newStatus: status,
        },
        req.ip,
      );

      return successResponse(res, 'Demand status updated successfully', demand);
    } catch (error) {
      enterpriseLogger.error('Failed to update demand status', {
        demandId: req.params.id,
        userId: req.user?.id,
        error: error.message,
      });
      next(error);
    }
  }

  /**
   * Get overdue demands
   * GET /api/tax-demands/overdue
   */
  async getOverdueDemands(req, res, next) {
    try {
      const userId = req.user.id;

      const demands = await taxDemandService.getOverdueDemands(userId);

      return successResponse(res, 'Overdue demands retrieved successfully', {
        demands,
        count: demands.length,
      });
    } catch (error) {
      enterpriseLogger.error('Failed to get overdue demands', {
        userId: req.user?.id,
        error: error.message,
      });
      next(error);
    }
  }
}

module.exports = new TaxDemandController();

