// =====================================================
// ADMIN SUPPORT CONTROLLER
// Admin-specific endpoints for managing support tickets
// =====================================================

const { ServiceTicket, ServiceTicketMessage, User, ITRFiling, CAFirm } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');
const { AppError } = require('../middleware/errorHandler');
const enterpriseLogger = require('../utils/logger');
const auditService = require('../services/utils/AuditService');

class AdminSupportController {
  /**
   * Get single ticket details with full history
   * GET /api/admin/support/tickets/:id
   */
  async getTicketDetails(req, res, next) {
    try {
      const { id } = req.params;
      const adminId = req.user.id;

      const ticket = await ServiceTicket.findByPk(id, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'fullName', 'email', 'phone'],
          },
          {
            model: User,
            as: 'assignedUser',
            attributes: ['id', 'name', 'fullName', 'email'],
            foreignKey: 'assignedTo',
          },
          {
            model: ITRFiling,
            as: 'filing',
            attributes: ['id', 'itrType', 'assessmentYear', 'status'],
          },
          {
            model: CAFirm,
            as: 'firm',
            attributes: ['id', 'firmName', 'status'],
          },
          {
            model: ServiceTicketMessage,
            as: 'messages',
            where: { isDeleted: false },
            required: false,
            order: [['createdAt', 'ASC']],
            include: [
              {
                model: User,
                as: 'sender',
                attributes: ['id', 'name', 'fullName', 'email', 'role'],
              },
            ],
          },
        ],
      });

      if (!ticket) {
        throw new AppError('Ticket not found', 404);
      }

      // Calculate SLA metrics
      const createdAt = new Date(ticket.createdAt);
      const now = new Date();
      const ageHours = Math.round((now - createdAt) / (1000 * 60 * 60));

      // Get first response time (first message from non-user)
      let firstResponseTime = null;
      const staffMessages = ticket.messages?.filter(m => m.senderType !== 'user');
      if (staffMessages?.length > 0) {
        const firstStaffResponse = new Date(staffMessages[0].createdAt);
        firstResponseTime = Math.round((firstStaffResponse - createdAt) / (1000 * 60 * 60));
      }

      // SLA thresholds (in hours)
      const slaThresholds = {
        CRITICAL: 4,
        HIGH: 12,
        MEDIUM: 24,
        LOW: 48,
      };
      const slaThreshold = slaThresholds[ticket.priority] || 24;
      const slaStatus = ageHours <= slaThreshold ? 'on_track' : 'breached';

      // Log audit event
      await auditService.logDataAccess(
        adminId,
        'read',
        'service_ticket',
        id,
        { action: 'admin_view_ticket_details' },
        req.ip,
      );

      enterpriseLogger.info('Admin viewed ticket details', {
        adminId,
        ticketId: id,
      });

      res.status(200).json({
        success: true,
        message: 'Ticket details retrieved successfully',
        data: {
          ticket: ticket,
          slaMetrics: {
            ageHours,
            firstResponseTimeHours: firstResponseTime,
            slaThreshold,
            slaStatus,
          },
        },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to get ticket details via admin API', {
        error: error.message,
        adminId: req.user?.id,
        ticketId: req.params.id,
      });
      next(error);
    }
  }

  /**
   * Get tickets list with admin filters
   * GET /api/admin/support/tickets
   */
  async getTickets(req, res, next) {
    try {
      const adminId = req.user.id;
      const {
        status,
        ticketType,
        priority,
        assignedTo,
        userId,
        filingId,
        caFirmId,
        category,
        search,
        limit = 50,
        offset = 0,
        sortBy = 'createdAt',
        sortOrder = 'DESC',
      } = req.query;

      const whereClause = {
        isDeleted: false,
      };

      // Apply filters
      if (status) {
        whereClause.status = status;
      }
      if (ticketType) {
        whereClause.ticketType = ticketType;
      }
      if (priority) {
        whereClause.priority = priority;
      }
      if (assignedTo) {
        whereClause.assignedTo = assignedTo;
      }
      if (userId) {
        whereClause.userId = userId;
      }
      if (filingId) {
        whereClause.filingId = filingId;
      }
      if (caFirmId) {
        whereClause.caFirmId = caFirmId;
      }
      if (category) {
        whereClause.category = category;
      }
      if (search) {
        whereClause[Op.or] = [
          { ticketNumber: { [Op.iLike]: `%${search}%` } },
          { subject: { [Op.iLike]: `%${search}%` } },
          { description: { [Op.iLike]: `%${search}%` } },
        ];
      }

      const { count, rows: tickets } = await ServiceTicket.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'email', 'phone'],
            required: false,
          },
          {
            model: User,
            as: 'assignedUser',
            attributes: ['id', 'name', 'email'],
            foreignKey: 'assignedTo',
            required: false,
          },
          {
            model: ITRFiling,
            as: 'filing',
            attributes: ['id', 'itrType', 'assessmentYear', 'status'],
            required: false,
          },
          {
            model: CAFirm,
            as: 'firm',
            attributes: ['id', 'firmName', 'status'],
            required: false,
          },
          {
            model: ServiceTicketMessage,
            as: 'messages',
            where: { isDeleted: false },
            required: false,
            limit: 1,
            order: [['createdAt', 'DESC']],
          },
        ],
        order: [[sortBy, sortOrder]],
        limit: parseInt(limit),
        offset: parseInt(offset),
      });

      // Log audit event
      await auditService.logDataAccess(
        adminId,
        'read',
        'service_ticket',
        null,
        {
          action: 'admin_get_tickets',
          filters: whereClause,
          count: count,
        },
        req.ip,
      );

      enterpriseLogger.info('Admin retrieved tickets', {
        adminId,
        count,
        filters: whereClause,
      });

      res.status(200).json({
        success: true,
        message: 'Tickets retrieved successfully',
        data: {
          tickets: tickets,
          pagination: {
            total: count,
            limit: parseInt(limit),
            offset: parseInt(offset),
            totalPages: Math.ceil(count / limit),
          },
        },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to get tickets via admin API', {
        error: error.message,
        adminId: req.user?.id,
        stack: error.stack,
      });
      next(error);
    }
  }

  /**
   * Update ticket (admin override)
   * PUT /api/admin/support/tickets/:id
   */
  async updateTicket(req, res, next) {
    try {
      const { id } = req.params;
      const adminId = req.user.id;
      const updateData = req.body;

      const ticket = await ServiceTicket.findByPk(id, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'email'],
            required: false,
          },
        ],
      });

      if (!ticket) {
        throw new AppError('Ticket not found', 404);
      }

      // Admin can update any field
      const allowedFields = [
        'status',
        'priority',
        'ticketType',
        'category',
        'subject',
        'description',
        'tags',
        'assignedTo',
        'caFirmId',
        'metadata',
      ];

      const updateFields = {};
      allowedFields.forEach((field) => {
        if (updateData[field] !== undefined) {
          updateFields[field] = updateData[field];
        }
      });

      await ticket.update(updateFields);

      // Log audit event
      await auditService.logDataAccess(
        adminId,
        'update',
        'service_ticket',
        id,
        {
          action: 'admin_update_ticket',
          changes: updateFields,
          originalStatus: ticket.status,
        },
        req.ip,
      );

      enterpriseLogger.info('Admin updated ticket', {
        adminId,
        ticketId: id,
        changes: updateFields,
      });

      res.status(200).json({
        success: true,
        message: 'Ticket updated successfully',
        data: {
          ticket: ticket,
        },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to update ticket via admin API', {
        error: error.message,
        adminId: req.user?.id,
        ticketId: req.params.id,
      });
      next(error);
    }
  }

  /**
   * Assign ticket to agent
   * POST /api/admin/support/tickets/:id/assign
   */
  async assignTicket(req, res, next) {
    try {
      const { id } = req.params;
      const adminId = req.user.id;
      const { assignedTo, caFirmId } = req.body;

      const ticket = await ServiceTicket.findByPk(id);
      if (!ticket) {
        throw new AppError('Ticket not found', 404);
      }

      // Verify assigned user exists (if provided)
      if (assignedTo) {
        const assignedUser = await User.findByPk(assignedTo);
        if (!assignedUser) {
          throw new AppError('Assigned user not found', 404);
        }
      }

      // Verify CA firm exists (if provided)
      if (caFirmId) {
        const caFirm = await CAFirm.findByPk(caFirmId);
        if (!caFirm) {
          throw new AppError('CA firm not found', 404);
        }
      }

      const updateData = {};
      if (assignedTo !== undefined) {
        updateData.assignedTo = assignedTo;
      }
      if (caFirmId !== undefined) {
        updateData.caFirmId = caFirmId;
      }

      await ticket.update(updateData);

      // Log audit event
      await auditService.logDataAccess(
        adminId,
        'update',
        'service_ticket',
        id,
        {
          action: 'admin_assign_ticket',
          assignedTo: assignedTo || null,
          caFirmId: caFirmId || null,
        },
        req.ip,
      );

      enterpriseLogger.info('Admin assigned ticket', {
        adminId,
        ticketId: id,
        assignedTo,
        caFirmId,
      });

      res.status(200).json({
        success: true,
        message: 'Ticket assigned successfully',
        data: {
          ticket: ticket,
        },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to assign ticket via admin API', {
        error: error.message,
        adminId: req.user?.id,
        ticketId: req.params.id,
      });
      next(error);
    }
  }

  /**
   * Add reply/response to ticket
   * POST /api/admin/support/tickets/:id/reply
   */
  async addReply(req, res, next) {
    try {
      const { id } = req.params;
      const adminId = req.user.id;
      const { message, isInternal = false, attachments = [] } = req.body;

      if (!message || !message.trim()) {
        throw new AppError('Message content is required', 400);
      }

      const ticket = await ServiceTicket.findByPk(id);
      if (!ticket) {
        throw new AppError('Ticket not found', 404);
      }

      // Get admin user details
      const adminUser = await User.findByPk(adminId, {
        attributes: ['id', 'name', 'fullName', 'email', 'role'],
      });

      // Create message
      const newMessage = await ServiceTicketMessage.create({
        ticketId: id,
        senderId: adminId,
        senderType: 'admin',
        message: message.trim(),
        isInternal: isInternal,
        attachments: attachments,
        metadata: {
          senderName: adminUser?.fullName || adminUser?.name || 'Admin',
          senderEmail: adminUser?.email,
          addedAt: new Date().toISOString(),
        },
      });

      // Update ticket status if it was OPEN
      if (ticket.status === 'OPEN') {
        await ticket.update({ status: 'IN_PROGRESS' });
      }

      // Log audit event
      await auditService.logDataAccess(
        adminId,
        'create',
        'service_ticket_message',
        newMessage.id,
        {
          action: 'admin_add_reply',
          ticketId: id,
          isInternal,
        },
        req.ip,
      );

      enterpriseLogger.info('Admin added reply to ticket', {
        adminId,
        ticketId: id,
        messageId: newMessage.id,
        isInternal,
      });

      res.status(201).json({
        success: true,
        message: isInternal ? 'Internal note added successfully' : 'Reply added successfully',
        data: {
          message: {
            ...newMessage.toJSON(),
            sender: adminUser,
          },
        },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to add reply via admin API', {
        error: error.message,
        adminId: req.user?.id,
        ticketId: req.params.id,
      });
      next(error);
    }
  }

  /**
   * Add internal note to ticket
   * POST /api/admin/support/tickets/:id/note
   */
  async addInternalNote(req, res, next) {
    try {
      const { id } = req.params;
      const adminId = req.user.id;
      const { note } = req.body;

      if (!note || !note.trim()) {
        throw new AppError('Note content is required', 400);
      }

      const ticket = await ServiceTicket.findByPk(id);
      if (!ticket) {
        throw new AppError('Ticket not found', 404);
      }

      // Get admin user details
      const adminUser = await User.findByPk(adminId, {
        attributes: ['id', 'name', 'fullName', 'email'],
      });

      // Add to internal notes array in metadata
      const existingNotes = ticket.metadata?.internalNotes || [];
      const newNote = {
        id: require('crypto').randomUUID(),
        content: note.trim(),
        addedBy: adminId,
        addedByName: adminUser?.fullName || adminUser?.name || 'Admin',
        addedAt: new Date().toISOString(),
      };

      await ticket.update({
        metadata: {
          ...(ticket.metadata || {}),
          internalNotes: [...existingNotes, newNote],
        },
      });

      // Log audit event
      await auditService.logDataAccess(
        adminId,
        'update',
        'service_ticket',
        id,
        {
          action: 'admin_add_internal_note',
          noteId: newNote.id,
        },
        req.ip,
      );

      enterpriseLogger.info('Admin added internal note to ticket', {
        adminId,
        ticketId: id,
        noteId: newNote.id,
      });

      res.status(201).json({
        success: true,
        message: 'Internal note added successfully',
        data: {
          note: newNote,
          allNotes: [...existingNotes, newNote],
        },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to add internal note via admin API', {
        error: error.message,
        adminId: req.user?.id,
        ticketId: req.params.id,
      });
      next(error);
    }
  }

  /**
   * Escalate ticket
   * POST /api/admin/support/tickets/:id/escalate
   */
  async escalateTicket(req, res, next) {
    try {
      const { id } = req.params;
      const adminId = req.user.id;
      const { reason, escalateTo, newPriority } = req.body;

      if (!reason || !reason.trim()) {
        throw new AppError('Escalation reason is required', 400);
      }

      const ticket = await ServiceTicket.findByPk(id);
      if (!ticket) {
        throw new AppError('Ticket not found', 404);
      }

      const previousPriority = ticket.priority;
      const updateData = {
        priority: newPriority || 'CRITICAL',
        metadata: {
          ...(ticket.metadata || {}),
          escalations: [
            ...(ticket.metadata?.escalations || []),
            {
              id: require('crypto').randomUUID(),
              escalatedBy: adminId,
              escalatedAt: new Date().toISOString(),
              reason: reason.trim(),
              previousPriority,
              newPriority: newPriority || 'CRITICAL',
              escalateTo: escalateTo || null,
            },
          ],
          isEscalated: true,
          lastEscalatedAt: new Date().toISOString(),
        },
      };

      if (escalateTo) {
        updateData.assignedTo = escalateTo;
      }

      await ticket.update(updateData);

      // Log audit event
      await auditService.logDataAccess(
        adminId,
        'update',
        'service_ticket',
        id,
        {
          action: 'admin_escalate_ticket',
          reason,
          previousPriority,
          newPriority: newPriority || 'CRITICAL',
        },
        req.ip,
      );

      enterpriseLogger.info('Admin escalated ticket', {
        adminId,
        ticketId: id,
        previousPriority,
        newPriority: newPriority || 'CRITICAL',
      });

      res.status(200).json({
        success: true,
        message: 'Ticket escalated successfully',
        data: {
          ticket: ticket,
        },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to escalate ticket via admin API', {
        error: error.message,
        adminId: req.user?.id,
        ticketId: req.params.id,
      });
      next(error);
    }
  }

  /**
   * Change ticket priority
   * POST /api/admin/support/tickets/:id/priority
   */
  async changePriority(req, res, next) {
    try {
      const { id } = req.params;
      const adminId = req.user.id;
      const { priority, reason } = req.body;

      if (!priority) {
        throw new AppError('Priority is required', 400);
      }

      const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
      if (!validPriorities.includes(priority.toUpperCase())) {
        throw new AppError('Invalid priority. Valid values: LOW, MEDIUM, HIGH, CRITICAL', 400);
      }

      const ticket = await ServiceTicket.findByPk(id);
      if (!ticket) {
        throw new AppError('Ticket not found', 404);
      }

      const previousPriority = ticket.priority;
      await ticket.update({
        priority: priority.toUpperCase(),
        metadata: {
          ...(ticket.metadata || {}),
          priorityChanges: [
            ...(ticket.metadata?.priorityChanges || []),
            {
              changedBy: adminId,
              changedAt: new Date().toISOString(),
              previousPriority,
              newPriority: priority.toUpperCase(),
              reason: reason || null,
            },
          ],
        },
      });

      // Log audit event
      await auditService.logDataAccess(
        adminId,
        'update',
        'service_ticket',
        id,
        {
          action: 'admin_change_priority',
          previousPriority,
          newPriority: priority.toUpperCase(),
          reason,
        },
        req.ip,
      );

      enterpriseLogger.info('Admin changed ticket priority', {
        adminId,
        ticketId: id,
        previousPriority,
        newPriority: priority.toUpperCase(),
      });

      res.status(200).json({
        success: true,
        message: 'Priority changed successfully',
        data: {
          ticket: ticket,
        },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to change priority via admin API', {
        error: error.message,
        adminId: req.user?.id,
        ticketId: req.params.id,
      });
      next(error);
    }
  }

  /**
   * Close ticket
   * POST /api/admin/support/tickets/:id/close
   */
  async closeTicket(req, res, next) {
    try {
      const { id } = req.params;
      const adminId = req.user.id;
      const { resolution, resolutionNotes } = req.body;

      const ticket = await ServiceTicket.findByPk(id);
      if (!ticket) {
        throw new AppError('Ticket not found', 404);
      }

      if (ticket.status === 'CLOSED') {
        throw new AppError('Ticket is already closed', 400);
      }

      const updateData = {
        status: 'CLOSED',
        resolvedAt: new Date(),
        resolvedBy: adminId,
      };

      if (resolution) {
        updateData.resolution = resolution;
      }
      if (resolutionNotes) {
        updateData.resolutionNotes = resolutionNotes;
      }

      await ticket.update(updateData);

      // Log audit event
      await auditService.logDataAccess(
        adminId,
        'update',
        'service_ticket',
        id,
        {
          action: 'admin_close_ticket',
          resolution,
          resolutionNotes,
        },
        req.ip,
      );

      enterpriseLogger.info('Admin closed ticket', {
        adminId,
        ticketId: id,
        resolution,
      });

      res.status(200).json({
        success: true,
        message: 'Ticket closed successfully',
        data: {
          ticket: ticket,
        },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to close ticket via admin API', {
        error: error.message,
        adminId: req.user?.id,
        ticketId: req.params.id,
      });
      next(error);
    }
  }

  /**
   * Get ticket statistics
   * GET /api/admin/support/tickets/stats
   */
  async getTicketStats(req, res, next) {
    try {
      const adminId = req.user.id;
      const { startDate, endDate } = req.query;

      const whereClause = {
        isDeleted: false,
      };

      if (startDate || endDate) {
        whereClause.createdAt = {};
        if (startDate) {
          whereClause.createdAt[Op.gte] = new Date(startDate);
        }
        if (endDate) {
          whereClause.createdAt[Op.lte] = new Date(endDate);
        }
      }

      // Get total tickets
      const totalTickets = await ServiceTicket.count({ where: whereClause });

      // Get tickets by status
      const ticketsByStatus = await ServiceTicket.findAll({
        where: whereClause,
        attributes: [
          'status',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        ],
        group: ['status'],
        raw: true,
      });

      // Get tickets by priority
      const ticketsByPriority = await ServiceTicket.findAll({
        where: whereClause,
        attributes: [
          'priority',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        ],
        group: ['priority'],
        raw: true,
      });

      // Get tickets by type
      const ticketsByType = await ServiceTicket.findAll({
        where: whereClause,
        attributes: [
          'ticketType',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        ],
        group: ['ticketType'],
        raw: true,
      });

      // Get open tickets
      const openTickets = await ServiceTicket.count({
        where: {
          ...whereClause,
          status: {
            [Op.in]: ['OPEN', 'IN_PROGRESS', 'PENDING'],
          },
        },
      });

      // Get closed tickets
      const closedTickets = await ServiceTicket.count({
        where: {
          ...whereClause,
          status: 'CLOSED',
        },
      });

      // Get average resolution time (in hours)
      const resolvedTickets = await ServiceTicket.findAll({
        where: {
          ...whereClause,
          status: 'CLOSED',
          resolvedAt: { [Op.ne]: null },
          createdAt: { [Op.ne]: null },
        },
        attributes: ['createdAt', 'resolvedAt'],
        raw: true,
      });

      let avgResolutionTime = 0;
      if (resolvedTickets.length > 0) {
        const totalHours = resolvedTickets.reduce((sum, ticket) => {
          const created = new Date(ticket.createdAt);
          const resolved = new Date(ticket.resolvedAt);
          const hours = (resolved - created) / (1000 * 60 * 60);
          return sum + hours;
        }, 0);
        avgResolutionTime = Math.round(totalHours / resolvedTickets.length);
      }

      // Get unassigned tickets
      const unassignedTickets = await ServiceTicket.count({
        where: {
          ...whereClause,
          assignedTo: null,
          status: {
            [Op.in]: ['OPEN', 'IN_PROGRESS', 'PENDING'],
          },
        },
      });

      const stats = {
        total: totalTickets,
        open: openTickets,
        closed: closedTickets,
        unassigned: unassignedTickets,
        avgResolutionTimeHours: avgResolutionTime,
        byStatus: ticketsByStatus.reduce((acc, item) => {
          acc[item.status] = parseInt(item.count);
          return acc;
        }, {}),
        byPriority: ticketsByPriority.reduce((acc, item) => {
          acc[item.priority] = parseInt(item.count);
          return acc;
        }, {}),
        byType: ticketsByType.reduce((acc, item) => {
          acc[item.ticketType] = parseInt(item.count);
          return acc;
        }, {}),
      };

      enterpriseLogger.info('Admin retrieved ticket statistics', {
        adminId,
        stats,
      });

      res.status(200).json({
        success: true,
        message: 'Ticket statistics retrieved successfully',
        data: {
          stats: stats,
        },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to get ticket statistics via admin API', {
        error: error.message,
        adminId: req.user?.id,
        stack: error.stack,
      });
      next(error);
    }
  }
}

module.exports = new AdminSupportController();

