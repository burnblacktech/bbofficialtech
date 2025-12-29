// =====================================================
// ITR-V CONTROLLER
// Handles ITR-V processing and tracking endpoints
// =====================================================

const itrvProcessingService = require('../services/itr/ITRVProcessingService');
const enterpriseLogger = require('../utils/logger');
const { AppError } = require('../middleware/errorHandler');
const {
  successResponse,
  errorResponse,
  validationErrorResponse,
  notFoundResponse,
} = require('../utils/responseFormatter');
const auditService = require('../services/itr/AuditInformationService');

class ITRVController {
  /**
   * Initialize ITR-V tracking for a filing
   * POST /api/itrv/initialize/:filingId
   */
  async initializeTracking(req, res, next) {
    try {
      const { filingId } = req.params;
      const userId = req.user.id;

      // Verify user owns the filing
      const { ITRFiling } = require('../models');
      const filing = await ITRFiling.findByPk(filingId);
      if (!filing) {
        return notFoundResponse(res, 'Filing not found');
      }
      if (filing.userId !== userId) {
        return errorResponse(res, 'Unauthorized access to filing', 403);
      }

      const itrv = await itrvProcessingService.initializeITRVTracking(filingId);

      // Log audit event
      await auditService.logDataAccess(
        userId,
        'create',
        'itrv_tracking',
        itrv.id,
        {
          action: 'initialize_itrv_tracking',
          filingId,
          ackNumber: itrv.ackNumber,
        },
        req.ip,
      );

      return successResponse(res, 'ITR-V tracking initialized successfully', itrv, 201);
    } catch (error) {
      enterpriseLogger.error('Failed to initialize ITR-V tracking', {
        filingId: req.params.filingId,
        userId: req.user?.id,
        error: error.message,
      });
      next(error);
    }
  }

  /**
   * Get ITR-V status for a filing
   * GET /api/itrv/status/:filingId
   */
  async getStatus(req, res, next) {
    try {
      const { filingId } = req.params;
      const userId = req.user.id;

      // Verify user owns the filing
      const { ITRFiling } = require('../models');
      const filing = await ITRFiling.findByPk(filingId);
      if (!filing) {
        return notFoundResponse(res, 'Filing not found');
      }
      if (filing.userId !== userId) {
        return errorResponse(res, 'Unauthorized access to filing', 403);
      }

      const itrv = await itrvProcessingService.getITRVStatus(filingId);

      return successResponse(res, 'ITR-V status retrieved successfully', itrv);
    } catch (error) {
      enterpriseLogger.error('Failed to get ITR-V status', {
        filingId: req.params.filingId,
        userId: req.user?.id,
        error: error.message,
      });
      next(error);
    }
  }

  /**
   * Get all ITR-V records for a user
   * GET /api/itrv/user
   */
  async getUserRecords(req, res, next) {
    try {
      const userId = req.user.id;
      const { status, assessmentYear, page = 1, limit = 20 } = req.query;

      const filters = { page, limit };
      if (status) filters.status = status;
      if (assessmentYear) filters.assessmentYear = assessmentYear;

      const result = await itrvProcessingService.getUserITRVRecords(userId, filters);

      return successResponse(res, 'ITR-V records retrieved successfully', result);
    } catch (error) {
      enterpriseLogger.error('Failed to get user ITR-V records', {
        userId: req.user?.id,
        error: error.message,
      });
      next(error);
    }
  }

  /**
   * Check ITR-V status from Income Tax Portal
   * POST /api/itrv/check-status/:filingId
   */
  async checkStatusFromPortal(req, res, next) {
    try {
      const { filingId } = req.params;
      const userId = req.user.id;

      // Verify user owns the filing
      const { ITRFiling } = require('../models');
      const filing = await ITRFiling.findByPk(filingId);
      if (!filing) {
        return notFoundResponse(res, 'Filing not found');
      }
      if (filing.userId !== userId) {
        return errorResponse(res, 'Unauthorized access to filing', 403);
      }

      const itrv = await itrvProcessingService.checkITRVStatusFromPortal(filingId);

      // Log audit event
      await auditService.logDataAccess(
        userId,
        'read',
        'itrv_tracking',
        itrv.id,
        {
          action: 'check_itrv_status_from_portal',
          filingId,
        },
        req.ip,
      );

      return successResponse(res, 'ITR-V status checked from portal', itrv);
    } catch (error) {
      enterpriseLogger.error('Failed to check ITR-V status from portal', {
        filingId: req.params.filingId,
        userId: req.user?.id,
        error: error.message,
      });
      next(error);
    }
  }

  /**
   * Mark ITR-V as verified
   * POST /api/itrv/verify/:filingId
   */
  async markAsVerified(req, res, next) {
    try {
      const { filingId } = req.params;
      const { verificationMethod } = req.body;
      const userId = req.user.id;

      if (!verificationMethod) {
        return validationErrorResponse(res, 'Verification method is required');
      }

      const validMethods = ['AADHAAR_OTP', 'NETBANKING', 'DSC', 'EVC', 'MANUAL'];
      if (!validMethods.includes(verificationMethod)) {
        return validationErrorResponse(res, `Invalid verification method. Must be one of: ${validMethods.join(', ')}`);
      }

      // Verify user owns the filing
      const { ITRFiling } = require('../models');
      const filing = await ITRFiling.findByPk(filingId);
      if (!filing) {
        return notFoundResponse(res, 'Filing not found');
      }
      if (filing.userId !== userId) {
        return errorResponse(res, 'Unauthorized access to filing', 403);
      }

      const itrv = await itrvProcessingService.markAsVerified(filingId, verificationMethod);

      // Log audit event
      await auditService.logDataAccess(
        userId,
        'update',
        'itrv_tracking',
        itrv.id,
        {
          action: 'mark_itrv_verified',
          filingId,
          verificationMethod,
        },
        req.ip,
      );

      return successResponse(res, 'ITR-V marked as verified successfully', itrv);
    } catch (error) {
      enterpriseLogger.error('Failed to mark ITR-V as verified', {
        filingId: req.params.filingId,
        userId: req.user?.id,
        error: error.message,
      });
      next(error);
    }
  }

  /**
   * Get expiring ITR-V records (admin only)
   * GET /api/itrv/expiring
   */
  async getExpiringRecords(req, res, next) {
    try {
      // Check if user is admin
      if (req.user.role !== 'super_admin' && req.user.role !== 'admin') {
        return errorResponse(res, 'Unauthorized - Admin access required', 403);
      }

      const records = await itrvProcessingService.getExpiringITRVRecords();

      return successResponse(res, 'Expiring ITR-V records retrieved successfully', {
        records,
        count: records.length,
      });
    } catch (error) {
      enterpriseLogger.error('Failed to get expiring ITR-V records', {
        userId: req.user?.id,
        error: error.message,
      });
      next(error);
    }
  }
}

module.exports = new ITRVController();

