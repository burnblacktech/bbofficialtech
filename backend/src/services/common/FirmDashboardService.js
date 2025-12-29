// =====================================================
// FIRM DASHBOARD SERVICE
// Provides firm-level statistics and dashboard data
// =====================================================

const { CAFirm, User, FamilyMember, ITRFiling, Assignment, ServiceTicket } = require('../../models');
const enterpriseLogger = require('../../utils/logger');

class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AppError';
  }
}

class FirmDashboardService {
  /**
   * Get comprehensive firm statistics
   * @param {string} firmId - Firm ID
   * @returns {Promise<Object>} Firm statistics
   */
  async getFirmStats(firmId) {
    try {
      const firm = await CAFirm.findByPk(firmId);
      if (!firm) {
        throw new AppError('CA firm not found', 404);
      }

      // Get staff count by role
      const staffCounts = await User.findAll({
        where: {
          caFirmId: firmId,
          role: ['CA_FIRM_ADMIN', 'CA', 'PREPARER', 'REVIEWER'],
          status: 'active',
        },
        attributes: [
          'role',
          [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count'],
        ],
        group: ['role'],
        raw: true,
      });

      const staffByRole = staffCounts.reduce((acc, item) => {
        acc[item.role] = parseInt(item.count);
        return acc;
      }, {});

      // Get client count
      const clientCount = await FamilyMember.count({
        where: {
          firmId,
          clientType: 'ca_client',
          status: 'active',
        },
      });

      // Get active filings count
      const activeFilingsCount = await ITRFiling.count({
        where: {
          firmId,
          status: ['draft', 'submitted', 'acknowledged'],
        },
      });

      // Get assignment statistics
      const totalAssignments = await Assignment.count({
        where: {
          status: 'active',
        },
        include: [{
          model: FamilyMember,
          as: 'client',
          where: { firmId, clientType: 'ca_client' },
          required: true,
        }],
      });

      return {
        firm: {
          id: firm.id,
          name: firm.name,
          status: firm.status,
        },
        stats: {
          staff: {
            total: Object.values(staffByRole).reduce((a, b) => a + b, 0),
            byRole: staffByRole,
          },
          clients: {
            total: clientCount,
            active: clientCount,
          },
          filings: {
            active: activeFilingsCount,
          },
          assignments: {
            total: totalAssignments,
          },
        },
      };
    } catch (error) {
      enterpriseLogger.error('Get firm stats error', {
        firmId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get queue statistics for a firm
   * @param {string} firmId - Firm ID
   * @returns {Promise<Object>} Queue statistics
   */
  async getQueueStats(firmId) {
    try {
      const queueTickets = await ServiceTicket.findAll({
        where: {
          ticketType: 'CA_REVIEW',
          caFirmId: firmId,
        },
        attributes: [
          'status',
          'priority',
          [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count'],
        ],
        group: ['status', 'priority'],
        raw: true,
      });

      const stats = {
        pending: 0,
        assigned: 0,
        inReview: 0,
        completed: 0,
        byPriority: {
          URGENT: 0,
          HIGH: 0,
          MEDIUM: 0,
          LOW: 0,
        },
      };

      queueTickets.forEach(ticket => {
        const count = parseInt(ticket.count);
        if (ticket.status === 'OPEN') stats.pending += count;
        if (ticket.status === 'IN_PROGRESS') stats.inReview += count;
        if (ticket.status === 'CLOSED' || ticket.status === 'RESOLVED') stats.completed += count;
        
        const priorityKey = ticket.priority?.toUpperCase();
        if (stats.byPriority[priorityKey] !== undefined) {
          stats.byPriority[priorityKey] += count;
        }
      });

      return stats;
    } catch (error) {
      enterpriseLogger.error('Get queue stats error', {
        firmId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get client list with assignment status
   * @param {string} firmId - Firm ID
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} Array of clients with assignment info
   */
  async getClientList(firmId, filters = {}) {
    try {
      const whereClause = {
        firmId,
        clientType: 'ca_client',
      };

      if (filters.status) {
        whereClause.status = filters.status;
      }

      const clients = await FamilyMember.findAll({
        where: whereClause,
        include: [{
          model: Assignment,
          as: 'assignments',
          where: { status: 'active' },
          required: false,
          include: [{
            model: User,
            as: 'user',
            attributes: ['id', 'fullName', 'email', 'role'],
          }],
        }],
        order: [['createdAt', 'DESC']],
        limit: filters.limit || 100,
        offset: filters.offset || 0,
      });

      return clients.map(client => ({
        client: {
          id: client.id,
          name: `${client.firstName} ${client.lastName}`,
          panNumber: client.panNumber,
          status: client.status,
          createdAt: client.createdAt,
        },
        assignments: client.assignments || [],
        hasPreparer: client.assignments?.some(a => a.role === 'preparer') || false,
        hasReviewer: client.assignments?.some(a => a.role === 'reviewer') || false,
      }));
    } catch (error) {
      enterpriseLogger.error('Get client list error', {
        firmId,
        filters,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get staff list with their assignments
   * @param {string} firmId - Firm ID
   * @returns {Promise<Array>} Array of staff with assignment counts
   */
  async getStaffList(firmId) {
    try {
      const staff = await User.findAll({
        where: {
          caFirmId: firmId,
          role: ['CA_FIRM_ADMIN', 'CA', 'PREPARER', 'REVIEWER'],
          status: 'active',
        },
        attributes: ['id', 'fullName', 'email', 'role'],
        order: [['role', 'ASC'], ['fullName', 'ASC']],
      });

      // Get assignment counts for each staff member
      const staffWithAssignments = await Promise.all(
        staff.map(async (member) => {
          const assignments = await Assignment.findActiveByUser(member.id);
          const clientCount = new Set(assignments.map(a => a.clientId)).size;

          return {
            staff: {
              id: member.id,
              name: member.fullName,
              email: member.email,
              role: member.role,
            },
            assignments: {
              total: assignments.length,
              clients: clientCount,
              byRole: assignments.reduce((acc, a) => {
                acc[a.role] = (acc[a.role] || 0) + 1;
                return acc;
              }, {}),
            },
          };
        })
      );

      return staffWithAssignments;
    } catch (error) {
      enterpriseLogger.error('Get staff list error', {
        firmId,
        error: error.message,
      });
      throw error;
    }
  }
}

module.exports = new FirmDashboardService();

