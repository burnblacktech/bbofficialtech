// =====================================================
// SERVICE TICKET CONTROLLER (API ENDPOINTS)
// =====================================================

const serviceTicketService = require('../services/business/ServiceTicketService');
const enterpriseLogger = require('../utils/logger');
const { AppError } = require('../middleware/errorHandler');

class ServiceTicketController {
  /**
   * Create a new service ticket
   * POST /api/tickets
   */
  async createTicket(req, res, next) {
    try {
      const {
        filingId,
        memberId,
        ticketType,
        priority,
        subject,
        description,
        tags,
        attachments,
      } = req.body;

      const userId = req.user.id;
      const createdBy = req.user.id;
      const ipAddress = req.ip;

      // Validate required fields
      if (!ticketType || !subject || !description) {
        throw new AppError('Missing required fields: ticketType, subject, description', 400);
      }

      const ticketData = {
        userId,
        filingId,
        memberId,
        ticketType,
        priority,
        subject,
        description,
        tags: tags || [],
        attachments: attachments || [],
      };

      const result = await serviceTicketService.createTicket(
        ticketData,
        createdBy,
        ipAddress,
      );

      enterpriseLogger.info('Service ticket created via API', {
        userId,
        ticketId: result.ticket.id,
        ticketNumber: result.ticket.ticketNumber,
        ticketType,
      });

      res.status(201).json({
        success: true,
        message: 'Service ticket created successfully',
        data: result.ticket,
      });

    } catch (error) {
      enterpriseLogger.error('Failed to create service ticket via API', {
        error: error.message,
        userId: req.user?.id,
        body: req.body,
      });
      next(error);
    }
  }

  /**
   * Get user tickets
   * GET /api/tickets
   */
  async getUserTickets(req, res, next) {
    try {
      const userId = req.user.id;
      const filters = {
        status: req.query.status,
        ticketType: req.query.ticketType,
        priority: req.query.priority,
        filingId: req.query.filingId,
        limit: parseInt(req.query.limit) || 50,
        offset: parseInt(req.query.offset) || 0,
      };

      // Remove undefined filters
      Object.keys(filters).forEach(key => {
        if (filters[key] === undefined) {
          delete filters[key];
        }
      });

      const tickets = await serviceTicketService.getUserTickets(userId, filters);

      enterpriseLogger.info('User tickets retrieved via API', {
        userId,
        count: tickets.length,
        filters,
      });

      res.status(200).json({
        success: true,
        message: 'Tickets retrieved successfully',
        data: {
          tickets,
          count: tickets.length,
          filters,
        },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to get user tickets via API', {
        error: error.message,
        userId: req.user?.id,
        query: req.query,
      });
      next(error);
    }
  }

  /**
   * Get ticket details
   * GET /api/tickets/:id
   */
  async getTicketDetails(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const ticketDetails = await serviceTicketService.getTicketDetails(id, userId);

      enterpriseLogger.info('Ticket details retrieved via API', {
        ticketId: id,
        userId,
      });

      res.status(200).json({
        success: true,
        message: 'Ticket details retrieved successfully',
        data: ticketDetails,
      });

    } catch (error) {
      enterpriseLogger.error('Failed to get ticket details via API', {
        error: error.message,
        ticketId: req.params.id,
        userId: req.user?.id,
      });
      next(error);
    }
  }

  /**
   * Add message to ticket
   * POST /api/tickets/:id/messages
   */
  async addMessage(req, res, next) {
    try {
      const { id } = req.params;
      const { message, attachments } = req.body;
      const senderId = req.user.id;
      const senderType = req.user.role === 'admin' ? 'ADMIN' :
        req.user.role === 'ca' ? 'CA' : 'USER';

      if (!message || message.length === 0) {
        throw new AppError('Message content is required', 400);
      }

      const result = await serviceTicketService.addMessage(
        id,
        senderId,
        message,
        senderType,
        attachments || [],
      );

      enterpriseLogger.info('Message added to ticket via API', {
        ticketId: id,
        senderId,
        senderType,
        messageLength: message.length,
      });

      res.status(201).json({
        success: true,
        message: 'Message added successfully',
        data: result.message,
      });

    } catch (error) {
      enterpriseLogger.error('Failed to add message via API', {
        error: error.message,
        ticketId: req.params.id,
        userId: req.user?.id,
      });
      next(error);
    }
  }

  /**
   * Update ticket status
   * PUT /api/tickets/:id/status
   */
  async updateTicketStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status, resolution } = req.body;
      const updatedBy = req.user.id;

      if (!status) {
        throw new AppError('Status is required', 400);
      }

      const validStatuses = [
        'OPEN', 'IN_PROGRESS', 'PENDING_USER', 'PENDING_CA',
        'RESOLVED', 'CLOSED', 'ESCALATED',
      ];

      if (!validStatuses.includes(status)) {
        throw new AppError(`Invalid status: ${status}`, 400);
      }

      await serviceTicketService.updateTicketStatus(id, status, updatedBy, resolution);

      enterpriseLogger.info('Ticket status updated via API', {
        ticketId: id,
        newStatus: status,
        updatedBy,
      });

      res.status(200).json({
        success: true,
        message: 'Ticket status updated successfully',
      });

    } catch (error) {
      enterpriseLogger.error('Failed to update ticket status via API', {
        error: error.message,
        ticketId: req.params.id,
        userId: req.user?.id,
      });
      next(error);
    }
  }

  /**
   * Assign ticket
   * PUT /api/tickets/:id/assign
   */
  async assignTicket(req, res, next) {
    try {
      const { id } = req.params;
      const { assignedTo } = req.body;
      const assignedBy = req.user.id;

      if (!assignedTo) {
        throw new AppError('AssignedTo is required', 400);
      }

      await serviceTicketService.assignTicket(id, assignedTo, assignedBy);

      enterpriseLogger.info('Ticket assigned via API', {
        ticketId: id,
        assignedTo,
        assignedBy,
      });

      res.status(200).json({
        success: true,
        message: 'Ticket assigned successfully',
      });

    } catch (error) {
      enterpriseLogger.error('Failed to assign ticket via API', {
        error: error.message,
        ticketId: req.params.id,
        userId: req.user?.id,
      });
      next(error);
    }
  }

  /**
   * Get ticket statistics
   * GET /api/tickets/stats
   */
  async getTicketStats(req, res, next) {
    try {
      const userId = req.user.role === 'admin' ? null : req.user.id;

      const stats = await serviceTicketService.getTicketStats(userId);

      enterpriseLogger.info('Ticket statistics retrieved via API', {
        userId: req.user.id,
        userRole: req.user.role,
      });

      res.status(200).json({
        success: true,
        message: 'Ticket statistics retrieved successfully',
        data: stats,
      });

    } catch (error) {
      enterpriseLogger.error('Failed to get ticket statistics via API', {
        error: error.message,
        userId: req.user?.id,
      });
      next(error);
    }
  }

  /**
   * Get ticket types
   * GET /api/tickets/types
   */
  async getTicketTypes(req, res, next) {
    try {
      const ticketTypes = [
        {
          key: 'FILING_SUPPORT',
          label: 'Filing Support',
          description: 'Help with ITR filing process',
          icon: '📄',
          slaHours: 24,
          priority: 'MEDIUM',
        },
        {
          key: 'DOCUMENT_REVIEW',
          label: 'Document Review',
          description: 'Review uploaded documents',
          icon: '📋',
          slaHours: 12,
          priority: 'HIGH',
        },
        {
          key: 'TAX_QUERY',
          label: 'Tax Query',
          description: 'Tax-related questions',
          icon: '❓',
          slaHours: 48,
          priority: 'MEDIUM',
        },
        {
          key: 'TECHNICAL_ISSUE',
          label: 'Technical Issue',
          description: 'Platform technical problems',
          icon: '🔧',
          slaHours: 6,
          priority: 'HIGH',
        },
        {
          key: 'PAYMENT_ISSUE',
          label: 'Payment Issue',
          description: 'Payment-related problems',
          icon: '💳',
          slaHours: 4,
          priority: 'URGENT',
        },
        {
          key: 'REFUND_REQUEST',
          label: 'Refund Request',
          description: 'Request for refund',
          icon: '💰',
          slaHours: 72,
          priority: 'MEDIUM',
        },
        {
          key: 'GENERAL_INQUIRY',
          label: 'General Inquiry',
          description: 'General questions',
          icon: '💬',
          slaHours: 48,
          priority: 'LOW',
        },
      ];

      res.status(200).json({
        success: true,
        message: 'Ticket types retrieved successfully',
        data: ticketTypes,
      });

    } catch (error) {
      enterpriseLogger.error('Failed to get ticket types via API', {
        error: error.message,
      });
      next(error);
    }
  }

  /**
   * Get ticket priorities
   * GET /api/tickets/priorities
   */
  async getTicketPriorities(req, res, next) {
    try {
      const priorities = [
        {
          key: 'LOW',
          label: 'Low',
          description: 'Low priority issue',
          color: 'green',
          slaHours: 72,
        },
        {
          key: 'MEDIUM',
          label: 'Medium',
          description: 'Normal priority issue',
          color: 'blue',
          slaHours: 24,
        },
        {
          key: 'HIGH',
          label: 'High',
          description: 'High priority issue',
          color: 'orange',
          slaHours: 12,
        },
        {
          key: 'URGENT',
          label: 'Urgent',
          description: 'Urgent issue requiring immediate attention',
          color: 'red',
          slaHours: 6,
        },
        {
          key: 'CRITICAL',
          label: 'Critical',
          description: 'Critical issue affecting system',
          color: 'purple',
          slaHours: 2,
        },
      ];

      res.status(200).json({
        success: true,
        message: 'Ticket priorities retrieved successfully',
        data: priorities,
      });

    } catch (error) {
      enterpriseLogger.error('Failed to get ticket priorities via API', {
        error: error.message,
      });
      next(error);
    }
  }

  /**
   * Get service status
   * GET /api/tickets/status
   */
  async getServiceStatus(req, res, next) {
    try {
      const status = serviceTicketService.getServiceStatus();

      res.status(200).json({
        success: true,
        message: 'Service status retrieved successfully',
        data: status,
      });

    } catch (error) {
      enterpriseLogger.error('Failed to get service status via API', {
        error: error.message,
      });
      next(error);
    }
  }

  /**
   * Auto-create ticket for filing (internal endpoint)
   * POST /api/tickets/auto-create
   */
  async autoCreateFilingTicket(req, res, next) {
    try {
      const { filingData } = req.body;

      if (!filingData) {
        throw new AppError('Filing data is required', 400);
      }

      const result = await serviceTicketService.autoCreateFilingTicket(filingData);

      enterpriseLogger.info('Auto-generated filing ticket created via API', {
        filingId: filingData.id,
        ticketId: result.ticket.id,
        ticketNumber: result.ticket.ticketNumber,
      });

      res.status(201).json({
        success: true,
        message: 'Auto-generated ticket created successfully',
        data: result.ticket,
      });

    } catch (error) {
      enterpriseLogger.error('Failed to auto-create filing ticket via API', {
        error: error.message,
        filingData: req.body.filingData,
      });
      next(error);
    }
  }
}

module.exports = new ServiceTicketController();
