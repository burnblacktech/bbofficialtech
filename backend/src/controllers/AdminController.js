// =====================================================
// ADMIN CONTROLLER (USER MANAGEMENT)
// =====================================================

const { User, ServiceTicket, ITRFiling, Document } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');
const enterpriseLogger = require('../utils/logger');
const { AppError } = require('../middleware/errorHandler');
const auditService = require('../services/utils/AuditService');

class AdminController {
  /**
   * Get all users with pagination and filters
   * GET /api/admin/users
   */
  async getUsers(req, res, next) {
    try {
      const {
        page = 1,
        limit = 20,
        role,
        status,
        search,
        sortBy = 'createdAt',
        sortOrder = 'DESC',
      } = req.query;

      const offset = (page - 1) * limit;
      const whereClause = { isDeleted: false };

      // Apply filters
      if (role) {
        whereClause.role = role;
      }
      if (status) {
        whereClause.status = status;
      }
      if (search) {
        whereClause[Op.or] = [
          { fullName: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } },
          { phone: { [Op.iLike]: `%${search}%` } },
        ];
      }

      const { count, rows: users } = await User.findAndCountAll({
        where: whereClause,
        order: [[sortBy, sortOrder]],
        limit: parseInt(limit),
        offset: parseInt(offset),
        attributes: [
          'id', 'fullName', 'email', 'phone', 'role', 'status',
          'emailVerified', 'phoneVerified', 'createdAt', 'updatedAt',
          'lastLoginAt', 'loginCount',
        ],
      });

      const userList = users.map(user => ({
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        roleLabel: this.getRoleLabel(user.role),
        status: user.status,
        statusLabel: this.getStatusLabel(user.status),
        statusColor: this.getStatusColor(user.status),
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastLoginAt: user.lastLoginAt,
        loginCount: user.loginCount,
        isActive: user.status === 'active',
      }));

      enterpriseLogger.info('Users retrieved via admin API', {
        adminId: req.user.id,
        count: userList.length,
        totalCount: count,
        filters: { role, status, search },
      });

      res.status(200).json({
        success: true,
        message: 'Users retrieved successfully',
        data: {
          users: userList,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / limit),
            totalItems: count,
            itemsPerPage: parseInt(limit),
            hasNext: page * limit < count,
            hasPrev: page > 1,
          },
        },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to get users via admin API', {
        error: error.message,
        adminId: req.user?.id,
        query: req.query,
      });
      next(error);
    }
  }

  /**
   * Get user details with statistics
   * GET /api/admin/users/:id
   */
  async getUserDetails(req, res, next) {
    try {
      const { id } = req.params;
      const adminId = req.user.id;

      const user = await User.findByPk(id, {
        attributes: [
          'id', 'fullName', 'email', 'phone', 'role', 'status',
          'emailVerified', 'phoneVerified', 'createdAt', 'updatedAt',
          'lastLoginAt', 'loginCount', 'metadata',
        ],
      });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Get user statistics
      const [ticketStats, filingStats, documentStats] = await Promise.all([
        ServiceTicket.getTicketStats(user.id),
        this.getUserFilingStats(user.id),
        Document.getUserStorageStats(user.id),
      ]);

      const userDetails = {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        roleLabel: this.getRoleLabel(user.role),
        status: user.status,
        statusLabel: this.getStatusLabel(user.status),
        statusColor: this.getStatusColor(user.status),
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastLoginAt: user.lastLoginAt,
        loginCount: user.loginCount,
        metadata: user.metadata,
        statistics: {
          tickets: ticketStats,
          filings: filingStats,
          documents: documentStats,
        },
      };

      enterpriseLogger.info('User details retrieved via admin API', {
        adminId,
        userId: id,
      });

      res.status(200).json({
        success: true,
        message: 'User details retrieved successfully',
        data: userDetails,
      });

    } catch (error) {
      enterpriseLogger.error('Failed to get user details via admin API', {
        error: error.message,
        adminId: req.user?.id,
        userId: req.params.id,
      });
      next(error);
    }
  }

  /**
   * Update user status
   * PUT /api/admin/users/:id/status
   */
  async updateUserStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status, reason } = req.body;
      const adminId = req.user.id;

      if (!status) {
        throw new AppError('Status is required', 400);
      }

      const validStatuses = ['active', 'inactive', 'suspended', 'pending'];
      if (!validStatuses.includes(status)) {
        throw new AppError(`Invalid status: ${status}`, 400);
      }

      const user = await User.findByPk(id);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      const oldStatus = user.status;
      user.status = status;
      user.metadata = {
        ...user.metadata,
        statusChangeHistory: [
          ...(user.metadata?.statusChangeHistory || []),
          {
            oldStatus,
            newStatus: status,
            changedBy: adminId,
            reason: reason || 'No reason provided',
            changedAt: new Date().toISOString(),
          },
        ],
      };

      await user.save();

      // Log audit event
      await auditService.logDataAccess(
        adminId,
        'update',
        'user_status',
        id,
        {
          oldStatus,
          newStatus: status,
          reason,
          userId: id,
        },
        req.ip,
      );

      enterpriseLogger.info('User status updated via admin API', {
        adminId,
        userId: id,
        oldStatus,
        newStatus: status,
        reason,
      });

      res.status(200).json({
        success: true,
        message: 'User status updated successfully',
        data: {
          userId: id,
          oldStatus,
          newStatus: status,
          reason,
        },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to update user status via admin API', {
        error: error.message,
        adminId: req.user?.id,
        userId: req.params.id,
      });
      next(error);
    }
  }

  /**
   * Update user role
   * PUT /api/admin/users/:id/role
   */
  async updateUserRole(req, res, next) {
    try {
      const { id } = req.params;
      const { role, reason } = req.body;
      const adminId = req.user.id;

      if (!role) {
        throw new AppError('Role is required', 400);
      }

      const validRoles = ['user', 'ca', 'ca_firm_admin', 'admin', 'super_admin'];
      if (!validRoles.includes(role)) {
        throw new AppError(`Invalid role: ${role}`, 400);
      }

      const user = await User.findByPk(id);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      const oldRole = user.role;
      user.role = role;
      user.metadata = {
        ...user.metadata,
        roleChangeHistory: [
          ...(user.metadata?.roleChangeHistory || []),
          {
            oldRole,
            newRole: role,
            changedBy: adminId,
            reason: reason || 'No reason provided',
            changedAt: new Date().toISOString(),
          },
        ],
      };

      await user.save();

      // Log audit event
      await auditService.logDataAccess(
        adminId,
        'update',
        'user_role',
        id,
        {
          oldRole,
          newRole: role,
          reason,
          userId: id,
        },
        req.ip,
      );

      enterpriseLogger.info('User role updated via admin API', {
        adminId,
        userId: id,
        oldRole,
        newRole: role,
        reason,
      });

      res.status(200).json({
        success: true,
        message: 'User role updated successfully',
        data: {
          userId: id,
          oldRole,
          newRole: role,
          reason,
        },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to update user role via admin API', {
        error: error.message,
        adminId: req.user?.id,
        userId: req.params.id,
      });
      next(error);
    }
  }

  /**
   * Get system statistics
   * GET /api/admin/stats
   */
  async getSystemStats(req, res, next) {
    try {
      const adminId = req.user.id;

      const [
        userStats,
        ticketStats,
        filingStats,
        documentStats,
      ] = await Promise.all([
        this.getUserStats(),
        ServiceTicket.getTicketStats(),
        this.getFilingStats(),
        this.getDocumentStats(),
      ]);

      const systemStats = {
        users: userStats,
        tickets: ticketStats,
        filings: filingStats,
        documents: documentStats,
        system: {
          uptime: process.uptime(),
          memoryUsage: process.memoryUsage(),
          nodeVersion: process.version,
          platform: process.platform,
        },
      };

      enterpriseLogger.info('System statistics retrieved via admin API', {
        adminId,
      });

      res.status(200).json({
        success: true,
        message: 'System statistics retrieved successfully',
        data: systemStats,
      });

    } catch (error) {
      enterpriseLogger.error('Failed to get system statistics via admin API', {
        error: error.message,
        adminId: req.user?.id,
      });
      next(error);
    }
  }

  /**
   * Get recent activity
   * GET /api/admin/activity
   */
  async getRecentActivity(req, res, next) {
    try {
      const { limit = 50 } = req.query;
      const adminId = req.user.id;

      // This would typically query an audit log table
      // For now, return mock data
      const recentActivity = [
        {
          id: '1',
          type: 'user_registration',
          description: 'New user registered',
          userId: 'user-123',
          timestamp: new Date().toISOString(),
          metadata: { email: 'user@example.com' },
        },
        {
          id: '2',
          type: 'filing_created',
          description: 'ITR filing created',
          userId: 'user-456',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          metadata: { itrType: 'ITR-1' },
        },
      ];

      enterpriseLogger.info('Recent activity retrieved via admin API', {
        adminId,
        limit,
      });

      res.status(200).json({
        success: true,
        message: 'Recent activity retrieved successfully',
        data: {
          activities: recentActivity,
          count: recentActivity.length,
        },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to get recent activity via admin API', {
        error: error.message,
        adminId: req.user?.id,
      });
      next(error);
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats() {
    const stats = await User.findAll({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalUsers'],
        [sequelize.fn('COUNT', sequelize.literal('CASE WHEN status = \'active\' THEN 1 END')), 'activeUsers'],
        [sequelize.fn('COUNT', sequelize.literal('CASE WHEN status = \'inactive\' THEN 1 END')), 'inactiveUsers'],
        [sequelize.fn('COUNT', sequelize.literal('CASE WHEN status = \'suspended\' THEN 1 END')), 'suspendedUsers'],
        [sequelize.fn('COUNT', sequelize.literal('CASE WHEN role = \'user\' THEN 1 END')), 'regularUsers'],
        [sequelize.fn('COUNT', sequelize.literal('CASE WHEN role = \'ca\' THEN 1 END')), 'caUsers'],
        [sequelize.fn('COUNT', sequelize.literal('CASE WHEN role = \'admin\' THEN 1 END')), 'adminUsers'],
      ],
      where: { isDeleted: false },
      raw: true,
    });

    return {
      totalUsers: parseInt(stats[0].totalUsers) || 0,
      activeUsers: parseInt(stats[0].activeUsers) || 0,
      inactiveUsers: parseInt(stats[0].inactiveUsers) || 0,
      suspendedUsers: parseInt(stats[0].suspendedUsers) || 0,
      regularUsers: parseInt(stats[0].regularUsers) || 0,
      caUsers: parseInt(stats[0].caUsers) || 0,
      adminUsers: parseInt(stats[0].adminUsers) || 0,
    };
  }

  /**
   * Get user filing statistics
   */
  async getUserFilingStats(userId) {
    const stats = await ITRFiling.findAll({
      where: { userId },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalFilings'],
        [sequelize.fn('COUNT', sequelize.literal('CASE WHEN status = \'draft\' THEN 1 END')), 'draftFilings'],
        [sequelize.fn('COUNT', sequelize.literal('CASE WHEN status = \'submitted\' THEN 1 END')), 'submittedFilings'],
        [sequelize.fn('COUNT', sequelize.literal('CASE WHEN status = \'acknowledged\' THEN 1 END')), 'acknowledgedFilings'],
      ],
      raw: true,
    });

    return {
      totalFilings: parseInt(stats[0]?.totalFilings) || 0,
      draftFilings: parseInt(stats[0]?.draftFilings) || 0,
      submittedFilings: parseInt(stats[0]?.submittedFilings) || 0,
      acknowledgedFilings: parseInt(stats[0]?.acknowledgedFilings) || 0,
    };
  }

  /**
   * Get filing statistics
   */
  async getFilingStats() {
    const stats = await ITRFiling.findAll({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalFilings'],
        [sequelize.fn('COUNT', sequelize.literal('CASE WHEN status = \'draft\' THEN 1 END')), 'draftFilings'],
        [sequelize.fn('COUNT', sequelize.literal('CASE WHEN status = \'submitted\' THEN 1 END')), 'submittedFilings'],
        [sequelize.fn('COUNT', sequelize.literal('CASE WHEN status = \'acknowledged\' THEN 1 END')), 'acknowledgedFilings'],
        [sequelize.fn('COUNT', sequelize.literal('CASE WHEN itr_type = \'ITR-1\' THEN 1 END')), 'itr1Filings'],
        [sequelize.fn('COUNT', sequelize.literal('CASE WHEN itr_type = \'ITR-2\' THEN 1 END')), 'itr2Filings'],
        [sequelize.fn('COUNT', sequelize.literal('CASE WHEN itr_type = \'ITR-3\' THEN 1 END')), 'itr3Filings'],
        [sequelize.fn('COUNT', sequelize.literal('CASE WHEN itr_type = \'ITR-4\' THEN 1 END')), 'itr4Filings'],
      ],
      raw: true,
    });

    return {
      totalFilings: parseInt(stats[0]?.totalFilings) || 0,
      draftFilings: parseInt(stats[0]?.draftFilings) || 0,
      submittedFilings: parseInt(stats[0]?.submittedFilings) || 0,
      acknowledgedFilings: parseInt(stats[0]?.acknowledgedFilings) || 0,
      itr1Filings: parseInt(stats[0]?.itr1Filings) || 0,
      itr2Filings: parseInt(stats[0]?.itr2Filings) || 0,
      itr3Filings: parseInt(stats[0]?.itr3Filings) || 0,
      itr4Filings: parseInt(stats[0]?.itr4Filings) || 0,
    };
  }

  /**
   * Get document statistics
   */
  async getDocumentStats() {
    const stats = await Document.findAll({
      where: { isDeleted: false },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalDocuments'],
        [sequelize.fn('SUM', sequelize.col('size_bytes')), 'totalStorage'],
        [sequelize.fn('COUNT', sequelize.literal('CASE WHEN verification_status = \'VERIFIED\' THEN 1 END')), 'verifiedDocuments'],
      ],
      raw: true,
    });

    return {
      totalDocuments: parseInt(stats[0]?.totalDocuments) || 0,
      totalStorage: parseInt(stats[0]?.totalStorage) || 0,
      verifiedDocuments: parseInt(stats[0]?.verifiedDocuments) || 0,
    };
  }

  /**
   * Get role label
   */
  getRoleLabel(role) {
    const labels = {
      'user': 'End User',
      'ca': 'CA',
      'ca_firm_admin': 'CA Firm Admin',
      'admin': 'Admin',
      'super_admin': 'Super Admin',
    };
    return labels[role] || 'Unknown';
  }

  /**
   * Get status label
   */
  getStatusLabel(status) {
    const labels = {
      'active': 'Active',
      'inactive': 'Inactive',
      'suspended': 'Suspended',
      'pending': 'Pending',
    };
    return labels[status] || 'Unknown';
  }

  /**
   * Get status color
   */
  getStatusColor(status) {
    const colors = {
      'active': 'green',
      'inactive': 'gray',
      'suspended': 'red',
      'pending': 'yellow',
    };
    return colors[status] || 'gray';
  }
}

module.exports = new AdminController();
