// =====================================================
// ASSESSMENT NOTICE CONTROLLER
// Handles assessment notice management endpoints
// =====================================================

const assessmentNoticeService = require('../services/itr/AssessmentNoticeService');
const enterpriseLogger = require('../utils/logger');
const { AppError } = require('../middleware/errorHandler');
const { sendSuccess, sendError } = require('../utils/responseFormatter');
// const auditService = require('../services/itr/AuditInformationService');
const auditService = require('../services/itr/AuditInformationService');

class AssessmentNoticeController {
  /**
   * Create a new assessment notice
   * POST /api/assessment-notices
   */
  async createNotice(req, res, next) {
    try {
      const userId = req.user.id;
      const noticeData = req.body;

      // Validate required fields
      if (!noticeData.noticeNumber || !noticeData.noticeType || !noticeData.assessmentYear || !noticeData.subject) {
        return validationErrorResponse(res, 'Missing required fields: noticeNumber, noticeType, assessmentYear, subject');
      }

      const notice = await assessmentNoticeService.createNotice(userId, noticeData);

      // Log audit event
      await auditService.logDataAccess(
        userId,
        'create',
        'assessment_notice',
        notice.id,
        {
          action: 'create_assessment_notice',
          noticeNumber: notice.noticeNumber,
          noticeType: notice.noticeType,
        },
        req.ip,
      );

      return successResponse(res, 'Assessment notice created successfully', notice, 201);
    } catch (error) {
      enterpriseLogger.error('Failed to create assessment notice', {
        userId: req.user?.id,
        error: error.message,
      });
      next(error);
    }
  }

  /**
   * Get notice by ID
   * GET /api/assessment-notices/:id
   */
  async getNotice(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const notice = await assessmentNoticeService.getNoticeById(id, userId);

      return successResponse(res, 'Assessment notice retrieved successfully', notice);
    } catch (error) {
      enterpriseLogger.error('Failed to get assessment notice', {
        noticeId: req.params.id,
        userId: req.user?.id,
        error: error.message,
      });
      next(error);
    }
  }

  /**
   * Get all notices for user
   * GET /api/assessment-notices
   */
  async getUserNotices(req, res, next) {
    try {
      const userId = req.user.id;
      const { status, noticeType, assessmentYear, page = 1, limit = 20 } = req.query;

      const filters = { page, limit };
      if (status) filters.status = status;
      if (noticeType) filters.noticeType = noticeType;
      if (assessmentYear) filters.assessmentYear = assessmentYear;

      const result = await assessmentNoticeService.getUserNotices(userId, filters);

      return successResponse(res, 'Assessment notices retrieved successfully', result);
    } catch (error) {
      enterpriseLogger.error('Failed to get user notices', {
        userId: req.user?.id,
        error: error.message,
      });
      next(error);
    }
  }

  /**
   * Update notice status
   * PATCH /api/assessment-notices/:id/status
   */
  async updateStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status, message } = req.body;
      const userId = req.user.id;

      if (!status) {
        return validationErrorResponse(res, 'Status is required');
      }

      const notice = await assessmentNoticeService.updateNoticeStatus(id, userId, status, { message });

      // Log audit event
      await auditService.logDataAccess(
        userId,
        'update',
        'assessment_notice',
        id,
        {
          action: 'update_notice_status',
          oldStatus: notice.metadata?.oldStatus,
          newStatus: status,
        },
        req.ip,
      );

      return successResponse(res, 'Notice status updated successfully', notice);
    } catch (error) {
      enterpriseLogger.error('Failed to update notice status', {
        noticeId: req.params.id,
        userId: req.user?.id,
        error: error.message,
      });
      next(error);
    }
  }

  /**
   * Submit response to notice
   * POST /api/assessment-notices/:id/response
   */
  async submitResponse(req, res, next) {
    try {
      const { id } = req.params;
      const { responseText, responseDocuments } = req.body;
      const userId = req.user.id;

      if (!responseText && (!responseDocuments || responseDocuments.length === 0)) {
        return validationErrorResponse(res, 'Response text or documents are required');
      }

      const notice = await assessmentNoticeService.submitResponse(id, userId, {
        responseText,
        responseDocuments,
      });

      // Log audit event
      await auditService.logDataAccess(
        userId,
        'update',
        'assessment_notice',
        id,
        {
          action: 'submit_notice_response',
          noticeNumber: notice.noticeNumber,
        },
        req.ip,
      );

      return successResponse(res, 'Response submitted successfully', notice);
    } catch (error) {
      enterpriseLogger.error('Failed to submit notice response', {
        noticeId: req.params.id,
        userId: req.user?.id,
        error: error.message,
      });
      next(error);
    }
  }

  /**
   * Check for new notices from portal
   * POST /api/assessment-notices/check-portal
   */
  async checkPortal(req, res, next) {
    try {
      const userId = req.user.id;

      const newNotices = await assessmentNoticeService.checkNoticesFromPortal(userId);

      return successResponse(res, 'Portal check completed', {
        newNotices,
        count: newNotices.length,
      });
    } catch (error) {
      enterpriseLogger.error('Failed to check notices from portal', {
        userId: req.user?.id,
        error: error.message,
      });
      next(error);
    }
  }

  /**
   * Get overdue notices
   * GET /api/assessment-notices/overdue
   */
  async getOverdueNotices(req, res, next) {
    try {
      const userId = req.user.id;

      const notices = await assessmentNoticeService.getOverdueNotices(userId);

      return successResponse(res, 'Overdue notices retrieved successfully', {
        notices,
        count: notices.length,
      });
    } catch (error) {
      enterpriseLogger.error('Failed to get overdue notices', {
        userId: req.user?.id,
        error: error.message,
      });
      next(error);
    }
  }
}

module.exports = new AssessmentNoticeController();

