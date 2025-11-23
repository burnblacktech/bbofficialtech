// =====================================================
// EXPERT REVIEW SERVICE - FLAGGING AND TICKET MANAGEMENT
// Automated expert review flagging and service ticket creation
// =====================================================

const { ITRFiling, ServiceTicket, ServiceTicketMessage, User } = require('../models');
const ServiceTicketService = require('./ServiceTicketService');
const emailService = require('./emailService');
const enterpriseLogger = require('../utils/logger');

class ExpertReviewService {
  /**
   * Flag ITR filing for expert review and create service ticket
   * @param {Object} filingData - ITR filing data
   * @param {Object} paymentData - Payment confirmation data
   * @returns {Promise<Object>} - Expert review request data
   */
  async flagForExpertReview(filingData, paymentData) {
    try {
      enterpriseLogger.info('ExpertReviewService: Flagging filing for expert review', {
        filingId: filingData.id,
        userId: filingData.userId,
        paymentId: paymentData.paymentId
      });

      // Update ITR filing with expert review flag
      const updatedFiling = await ITRFiling.update(
        {
          expert_review_requested: true,
          expert_review_payment_id: paymentData.paymentId,
          expert_review_status: 'pending',
          expert_review_requested_at: new Date()
        },
        {
          where: { id: filingData.id },
          returning: true
        }
      );

      // Create service ticket for expert review
      const ticketData = {
        title: `Expert Review Request for Filing #${filingData.id}`,
        description: `Expert review requested for ITR filing. Payment ID: ${paymentData.paymentId}`,
        category: 'expert_review',
        priority: 'high',
        status: 'open',
        userId: filingData.userId,
        filingId: filingData.id,
        assignedTo: null, // Will be assigned by admin
        metadata: {
          filingId: filingData.id,
          paymentId: paymentData.paymentId,
          assessmentYear: filingData.assessmentYear,
          pan: filingData.pan,
          expertReviewRequested: true
        }
      };

      const serviceTicket = await ServiceTicketService.createTicket(ticketData);

      // Create initial ticket message
      const initialMessage = {
        ticketId: serviceTicket.id,
        senderId: 'system',
        message: `Expert review requested for ITR filing #${filingData.id}. The filing has been flagged for manual review by our tax experts.`,
        messageType: 'system'
      };

      await ServiceTicketService.addMessage(serviceTicket.id, initialMessage);

      // Send confirmation email to user
      await this.sendExpertReviewConfirmationEmail(filingData, paymentData);

      // Notify admin team
      await this.notifyAdminTeam(filingData, serviceTicket);

      enterpriseLogger.info('ExpertReviewService: Expert review flagged successfully', {
        filingId: filingData.id,
        ticketId: serviceTicket.id
      });

      return {
        success: true,
        filingId: filingData.id,
        ticketId: serviceTicket.id,
        status: 'pending',
        message: 'Expert review request created successfully'
      };

    } catch (error) {
      enterpriseLogger.error('ExpertReviewService: Error flagging for expert review', {
        error: error.message,
        filingId: filingData.id,
        stack: error.stack
      });

      throw new Error('Failed to flag filing for expert review');
    }
  }

  /**
   * Process expert review completion
   * @param {string} filingId - ITR filing ID
   * @param {Object} reviewData - Expert review data
   * @returns {Promise<Object>} - Review completion data
   */
  async completeExpertReview(filingId, reviewData) {
    try {
      enterpriseLogger.info('ExpertReviewService: Completing expert review', {
        filingId,
        reviewerId: reviewData.reviewerId
      });

      // Update ITR filing with review results
      const updatedFiling = await ITRFiling.update(
        {
          expert_review_status: 'completed',
          expert_review_completed_at: new Date(),
          expert_reviewer_id: reviewData.reviewerId,
          expert_review_notes: reviewData.notes,
          expert_review_recommendations: reviewData.recommendations,
          expert_review_approved: reviewData.approved
        },
        {
          where: { id: filingId },
          returning: true
        }
      );

      // Update service ticket status
      const ticket = await ServiceTicket.findOne({
        where: { filingId, category: 'expert_review' }
      });

      if (ticket) {
        await ServiceTicket.update(
          {
            status: 'resolved',
            resolvedAt: new Date(),
            resolvedBy: reviewData.reviewerId
          },
          { where: { id: ticket.id } }
        );

        // Add resolution message
        const resolutionMessage = {
          ticketId: ticket.id,
          senderId: reviewData.reviewerId,
          message: `Expert review completed. ${reviewData.approved ? 'Approved' : 'Requires changes'}. ${reviewData.notes}`,
          messageType: 'admin'
        };

        await ServiceTicketService.addMessage(ticket.id, resolutionMessage);
      }

      // Send completion email to user
      await this.sendExpertReviewCompletionEmail(filingId, reviewData);

      enterpriseLogger.info('ExpertReviewService: Expert review completed successfully', {
        filingId,
        approved: reviewData.approved
      });

      return {
        success: true,
        filingId,
        approved: reviewData.approved,
        message: 'Expert review completed successfully'
      };

    } catch (error) {
      enterpriseLogger.error('ExpertReviewService: Error completing expert review', {
        error: error.message,
        filingId,
        stack: error.stack
      });

      throw new Error('Failed to complete expert review');
    }
  }

  /**
   * Get expert review status
   * @param {string} filingId - ITR filing ID
   * @returns {Promise<Object>} - Expert review status
   */
  async getExpertReviewStatus(filingId) {
    try {
      const filing = await ITRFiling.findByPk(filingId, {
        include: [
          {
            model: ServiceTicket,
            where: { category: 'expert_review' },
            required: false
          }
        ]
      });

      if (!filing) {
        throw new Error('ITR filing not found');
      }

      return {
        filingId,
        expertReviewRequested: filing.expert_review_requested,
        expertReviewStatus: filing.expert_review_status,
        expertReviewRequestedAt: filing.expert_review_requested_at,
        expertReviewCompletedAt: filing.expert_review_completed_at,
        expertReviewerId: filing.expert_reviewer_id,
        expertReviewNotes: filing.expert_review_notes,
        expertReviewRecommendations: filing.expert_review_recommendations,
        expertReviewApproved: filing.expert_review_approved,
        ticketId: filing.ServiceTickets?.[0]?.id,
        ticketStatus: filing.ServiceTickets?.[0]?.status
      };

    } catch (error) {
      enterpriseLogger.error('ExpertReviewService: Error getting expert review status', {
        error: error.message,
        filingId,
        stack: error.stack
      });

      throw new Error('Failed to get expert review status');
    }
  }

  /**
   * Send expert review confirmation email
   * @param {Object} filingData - ITR filing data
   * @param {Object} paymentData - Payment confirmation data
   */
  async sendExpertReviewConfirmationEmail(filingData, paymentData) {
    try {
      const user = await User.findByPk(filingData.userId);

      const emailData = {
        to: user.email,
        subject: 'Expert Review Request Confirmed - BurnBlack',
        template: 'expert-review-confirmation',
        data: {
          userName: user.fullName,
          filingId: filingData.id,
          assessmentYear: filingData.assessmentYear,
          pan: filingData.pan,
          paymentId: paymentData.paymentId,
          amount: paymentData.amount,
          expectedCompletionTime: '24 hours'
        }
      };

      await emailService.sendEmail(emailData);

      enterpriseLogger.info('ExpertReviewService: Expert review confirmation email sent', {
        filingId: filingData.id,
        userEmail: user.email
      });

    } catch (error) {
      enterpriseLogger.error('ExpertReviewService: Error sending confirmation email', {
        error: error.message,
        filingId: filingData.id
      });
    }
  }

  /**
   * Send expert review completion email
   * @param {string} filingId - ITR filing ID
   * @param {Object} reviewData - Expert review data
   */
  async sendExpertReviewCompletionEmail(filingId, reviewData) {
    try {
      const filing = await ITRFiling.findByPk(filingId, {
        include: [{ model: User }]
      });

      if (!filing || !filing.User) {
        throw new Error('Filing or user not found');
      }

      const emailData = {
        to: filing.User.email,
        subject: 'Expert Review Completed - BurnBlack',
        template: 'expert-review-completion',
        data: {
          userName: filing.User.fullName,
          filingId: filing.id,
          assessmentYear: filing.assessmentYear,
          pan: filing.pan,
          approved: reviewData.approved,
          notes: reviewData.notes,
          recommendations: reviewData.recommendations
        }
      };

      await emailService.sendEmail(emailData);

      enterpriseLogger.info('ExpertReviewService: Expert review completion email sent', {
        filingId,
        userEmail: filing.User.email
      });

    } catch (error) {
      enterpriseLogger.error('ExpertReviewService: Error sending completion email', {
        error: error.message,
        filingId
      });
    }
  }

  /**
   * Notify admin team about expert review request
   * @param {Object} filingData - ITR filing data
   * @param {Object} serviceTicket - Service ticket data
   */
  async notifyAdminTeam(filingData, serviceTicket) {
    try {
      // Get admin users
      const adminUsers = await User.findAll({
        where: {
          role: ['admin', 'super_admin', 'platform_admin']
        }
      });

      // Send notification to each admin
      for (const admin of adminUsers) {
        const emailData = {
          to: admin.email,
          subject: 'New Expert Review Request - BurnBlack',
          template: 'admin-expert-review-notification',
          data: {
            adminName: admin.fullName,
            filingId: filingData.id,
            ticketId: serviceTicket.id,
            userName: filingData.userName,
            assessmentYear: filingData.assessmentYear,
            pan: filingData.pan,
            priority: 'high'
          }
        };

        await emailService.sendEmail(emailData);
      }

      enterpriseLogger.info('ExpertReviewService: Admin team notified', {
        filingId: filingData.id,
        ticketId: serviceTicket.id,
        adminCount: adminUsers.length
      });

    } catch (error) {
      enterpriseLogger.error('ExpertReviewService: Error notifying admin team', {
        error: error.message,
        filingId: filingData.id
      });
    }
  }

  /**
   * Get expert review queue
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} - Expert review queue
   */
  async getExpertReviewQueue(filters = {}) {
    try {
      const whereClause = {
        expert_review_requested: true,
        expert_review_status: 'pending'
      };

      if (filters.priority) {
        whereClause.priority = filters.priority;
      }

      const filings = await ITRFiling.findAll({
        where: whereClause,
        include: [
          {
            model: User,
            attributes: ['id', 'fullName', 'email', 'phone']
          },
          {
            model: ServiceTicket,
            where: { category: 'expert_review' },
            required: false
          }
        ],
        order: [['expert_review_requested_at', 'ASC']],
        limit: filters.limit || 50
      });

      return filings.map(filing => ({
        filingId: filing.id,
        userId: filing.userId,
        userName: filing.User.fullName,
        userEmail: filing.User.email,
        assessmentYear: filing.assessmentYear,
        pan: filing.pan,
        expertReviewRequestedAt: filing.expert_review_requested_at,
        ticketId: filing.ServiceTickets?.[0]?.id,
        ticketStatus: filing.ServiceTickets?.[0]?.status,
        priority: filing.ServiceTickets?.[0]?.priority
      }));

    } catch (error) {
      enterpriseLogger.error('ExpertReviewService: Error getting expert review queue', {
        error: error.message,
        stack: error.stack
      });

      throw new Error('Failed to get expert review queue');
    }
  }
}

module.exports = new ExpertReviewService();
