// =====================================================
// CA REVIEW QUEUE SERVICE
// Manages CA review queue for firm-level review workflow
// =====================================================

const { ITRFiling, ServiceTicket, User, CAFirm } = require('../../models');
const ServiceTicketService = require('../common/ServiceTicketService');
const enterpriseLogger = require('../../utils/logger');

class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AppError';
  }
}

class CAReviewQueueService {
  /**
   * Add return to CA review queue
   * @param {string} returnId - ITR filing ID
   * @param {string} reason - Review reason
   * @param {string} priority - Priority level ('low', 'medium', 'high', 'urgent')
   * @param {string} requestedBy - User ID who requested review
   * @returns {Promise<Object>} Created queue entry (ServiceTicket)
   */
  async addToQueue(returnId, reason, priority = 'medium', requestedBy) {
    try {
      enterpriseLogger.info('Adding to CA review queue', { returnId, reason, priority });

      // Get filing and verify
      const filing = await ITRFiling.findByPk(returnId);
      if (!filing) {
        throw new AppError('ITR filing not found', 404);
      }

      // Get firm ID from filing
      const firmId = filing.firmId;
      if (!firmId) {
        throw new AppError('Filing does not have firm context', 400);
      }

      // Update filing review status
      await filing.requestReview(reason);

      // Create service ticket for review queue
      const ticketData = {
        userId: filing.userId,
        filingId: returnId,
        ticketType: 'CA_REVIEW',
        priority: priority.toUpperCase() || 'MEDIUM',
        subject: `CA Review Request - ${filing.itrType} - AY ${filing.assessmentYear}`,
        description: `CA review requested for ITR filing.\n\nReason: ${reason}\n\nFiling ID: ${returnId}`,
        tags: ['ca_review', 'itr_review'],
        attachments: [],
      };

      const ticket = await ServiceTicketService.createTicket(ticketData, requestedBy);

      // Update ticket with firm context and metadata
      await ticket.update({
        caFirmId: firmId,
        assignedTo: null, // Will be assigned by firm admin
        metadata: {
          ...(ticket.metadata || {}),
          type: 'ca_review',
          returnId,
          firmId,
          itrType: filing.itrType,
          assessmentYear: filing.assessmentYear,
          reason,
          requestedBy,
          requestedAt: new Date().toISOString(),
        },
      });

      enterpriseLogger.info('Added to CA review queue', {
        ticketId: ticket.id,
        returnId,
        firmId,
      });

      return ticket;
    } catch (error) {
      enterpriseLogger.error('Add to review queue error', {
        returnId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get review queue for a firm
   * @param {string} firmId - Firm ID
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} Array of queue entries
   */
  async getFirmQueue(firmId, filters = {}) {
    try {
      const whereClause = {
        ticketType: 'CA_REVIEW',
        caFirmId: firmId,
      };

      if (filters.status) {
        whereClause.status = filters.status;
      }

      if (filters.priority) {
        whereClause.priority = filters.priority;
      }

      const tickets = await ServiceTicket.findAll({
        where: whereClause,
        include: [{
          model: ITRFiling,
          as: 'filing',
          attributes: ['id', 'itrType', 'assessmentYear', 'status', 'reviewStatus'],
        }],
        order: [
          ['priority', 'DESC'],
          ['createdAt', 'ASC'],
        ],
        limit: filters.limit || 50,
        offset: filters.offset || 0,
      });

      return tickets;
    } catch (error) {
      enterpriseLogger.error('Get firm queue error', {
        firmId,
        filters,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Assign reviewer to a queue item
   * @param {string} ticketId - Service ticket ID
   * @param {string} reviewerId - Reviewer user ID
   * @param {string} assignedBy - User ID who assigned
   * @returns {Promise<Object>} Updated ticket
   */
  async assignReviewer(ticketId, reviewerId, assignedBy) {
    try {
      const ticket = await ServiceTicket.findByPk(ticketId);
      if (!ticket) {
        throw new AppError('Review ticket not found', 404);
      }

      // Verify reviewer exists and has appropriate role
      const reviewer = await User.findByPk(reviewerId);
      if (!reviewer) {
        throw new AppError('Reviewer not found', 404);
      }
      if (!['CA', 'REVIEWER', 'CA_FIRM_ADMIN'].includes(reviewer.role)) {
        throw new AppError('User role not eligible for review', 400);
      }

      // Update ticket assignment
      await ticket.update({
        assignedTo: reviewerId,
        status: 'IN_PROGRESS',
        metadata: {
          ...(ticket.metadata || {}),
          assignedBy,
          assignedAt: new Date().toISOString(),
        },
      });

      // Update filing assignment
      if (ticket.filingId) {
        const filing = await ITRFiling.findByPk(ticket.filingId);
        if (filing) {
          await filing.assignTo(reviewerId);
          await filing.update({ reviewStatus: 'in_review' });
        }
      }

      enterpriseLogger.info('Reviewer assigned', {
        ticketId,
        reviewerId,
        assignedBy,
      });

      return ticket;
    } catch (error) {
      enterpriseLogger.error('Assign reviewer error', {
        ticketId,
        reviewerId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Complete a review
   * @param {string} ticketId - Service ticket ID
   * @param {string} reviewerId - Reviewer user ID
   * @param {string} decision - Review decision ('approved', 'rejected')
   * @param {string} comments - Review comments
   * @returns {Promise<Object>} Updated ticket and filing
   */
  async completeReview(ticketId, reviewerId, decision, comments = null) {
    try {
      const ticket = await ServiceTicket.findByPk(ticketId);
      if (!ticket) {
        throw new AppError('Review ticket not found', 404);
      }

      if (ticket.assignedTo !== reviewerId) {
        throw new AppError('Reviewer not assigned to this ticket', 403);
      }

      const validDecisions = ['approved', 'rejected'];
      if (!validDecisions.includes(decision)) {
        throw new AppError(`Invalid decision: ${decision}`, 400);
      }

      // Update ticket
      await ticket.update({
        status: 'CLOSED',
        resolvedAt: new Date(),
        resolution: comments || `Review ${decision}`,
        metadata: {
          ...(ticket.metadata || {}),
          reviewedAt: new Date().toISOString(),
          reviewerId,
          decision,
          comments,
        },
      });

      // Update filing review status
      if (ticket.filingId) {
        const filing = await ITRFiling.findByPk(ticket.filingId);
        if (filing) {
          if (decision === 'approved') {
            await filing.approveReview(reviewerId, comments);
          } else {
            await filing.update({
              reviewStatus: 'rejected',
              metadata: {
                ...(filing.metadata || {}),
                reviewedAt: new Date().toISOString(),
                reviewerId,
                reviewComments: comments,
                reviewDecision: 'rejected',
              },
            });
          }
        }
      }

      enterpriseLogger.info('Review completed', {
        ticketId,
        reviewerId,
        decision,
      });

      return {
        ticket,
        filing: ticket.filingId ? await ITRFiling.findByPk(ticket.filingId) : null,
      };
    } catch (error) {
      enterpriseLogger.error('Complete review error', {
        ticketId,
        reviewerId,
        decision,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get review queue for a specific user
   * @param {string} userId - User ID
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} Array of queue entries
   */
  async getUserQueue(userId, filters = {}) {
    try {
      const whereClause = {
        ticketType: 'CA_REVIEW',
      };

      // If user is assigned, show assigned tickets
      if (filters.showAssigned !== false) {
        whereClause.assignedTo = userId;
        whereClause.status = ['OPEN', 'IN_PROGRESS'];
      }

      if (filters.status) {
        whereClause.status = filters.status;
      }

      const tickets = await ServiceTicket.findAll({
        where: whereClause,
        include: [{
          model: ITRFiling,
          as: 'filing',
          attributes: ['id', 'itrType', 'assessmentYear', 'status', 'reviewStatus'],
        }],
        order: [
          ['priority', 'DESC'],
          ['createdAt', 'ASC'],
        ],
        limit: filters.limit || 50,
      });

      return tickets;
    } catch (error) {
      enterpriseLogger.error('Get user queue error', {
        userId,
        filters,
        error: error.message,
      });
      throw error;
    }
  }
}

module.exports = new CAReviewQueueService();

