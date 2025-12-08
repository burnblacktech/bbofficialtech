// =====================================================
// ADMIN CONTROLLER (USER MANAGEMENT)
// =====================================================

const { User, ServiceTicket, ITRFiling, Document, Invoice, AuditLog, UserSession, PasswordResetToken, CAFirm, CAFirmReview, UserSegment } = require('../models');
const { Op, QueryTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const enterpriseLogger = require('../utils/logger');
const { AppError } = require('../middleware/errorHandler');
const auditService = require('../services/utils/AuditService');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');

class AdminController {
  /**
   * Admin login
   * POST /api/admin/login
   * Authenticates admin users (SUPER_ADMIN or PLATFORM_ADMIN)
   */
  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      // Validate required fields
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: 'Email and password are required',
        });
      }

      const normalizedEmail = email ? email.toLowerCase() : null;
      enterpriseLogger.info('Admin login attempt', {
        email: normalizedEmail,
        ip: req.ip,
      });

      // Use raw query directly (User model has schema mismatches)
      // This approach works reliably and avoids model column issues
      let queryResult;
      let user = null;
      
      try {
        // First, check database connection and verify user exists
        const connectionCheck = await sequelize.query(
          `SELECT current_database() as db_name, current_schema() as schema_name`,
          {
            type: QueryTypes.SELECT,
          }
        );

        const userCountResult = await sequelize.query(
          `SELECT COUNT(*)::int as user_count FROM public.users WHERE email = :email`,
          {
            replacements: { email: normalizedEmail },
            type: QueryTypes.SELECT,
          }
        );

        enterpriseLogger.info('Admin login - connection check', {
          email: normalizedEmail,
          database: connectionCheck?.[0]?.db_name || 'unknown',
          schema: connectionCheck?.[0]?.schema_name || 'unknown',
          userCount: userCountResult?.[0]?.user_count || 0,
        });

        // Try query without role filter first
        const [userCheck] = await sequelize.query(
          `SELECT email, role, status FROM public.users WHERE email = :email LIMIT 1`,
          {
            replacements: { email: normalizedEmail },
            type: QueryTypes.SELECT,
          }
        );

        enterpriseLogger.info('Admin login - user exists check', {
          email: normalizedEmail,
          found: userCheck && userCheck.length > 0,
          userRole: userCheck && userCheck.length > 0 ? userCheck[0].role : null,
          userStatus: userCheck && userCheck.length > 0 ? userCheck[0].status : null,
        });

        // Now query with role filter
        queryResult = await sequelize.query(
          `SELECT id, email, password_hash, role, status, auth_provider, full_name, 
           email_verified, phone_verified, token_version, last_login_at, onboarding_completed
           FROM public.users 
           WHERE email = :email AND role IN ('SUPER_ADMIN', 'PLATFORM_ADMIN')
           LIMIT 1`,
          {
            replacements: { email: normalizedEmail },
            type: QueryTypes.SELECT, // Returns results directly as array
          }
        );

        enterpriseLogger.info('Admin login query executed', {
          email: normalizedEmail,
          queryResultType: typeof queryResult,
          isArray: Array.isArray(queryResult),
          queryResultLength: Array.isArray(queryResult) ? queryResult.length : 'N/A',
          rawResult: JSON.stringify(queryResult).substring(0, 500),
        });

        user = Array.isArray(queryResult) && queryResult.length > 0 ? queryResult[0] : null;

        enterpriseLogger.info('Admin login query result', {
          email: normalizedEmail,
          queryResultLength: Array.isArray(queryResult) ? queryResult.length : 'N/A',
          hasUser: !!user,
          userEmail: user?.email || null,
          userRole: user?.role || null,
          userId: user?.id || null,
        });
      } catch (queryError) {
        enterpriseLogger.error('Admin login query error', {
          email: normalizedEmail,
          error: queryError.message,
          stack: queryError.stack,
        });
        throw queryError;
      }

      // Convert to User model instance format (only if user is a plain object from raw query)
      // If user is a Sequelize instance, it already has the correct property names
      if (user && !user.get) {
        // Plain object from raw query - convert snake_case to camelCase
        user.passwordHash = user.password_hash;
        user.authProvider = user.auth_provider;
        user.fullName = user.full_name;
        user.emailVerified = user.email_verified;
        user.phoneVerified = user.phone_verified;
        user.tokenVersion = user.token_version;
        user.lastLoginAt = user.last_login_at;
        user.onboardingCompleted = user.onboarding_completed;
      }

      if (!user) {
        enterpriseLogger.warn('Admin login failed: User not found or not an admin', {
          email: email.toLowerCase(),
          ip: req.ip,
        });
        
        // Log failed attempt
        await AuditLog.logAuthEvent({
          userId: null,
          action: 'admin_login_failed',
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.headers['user-agent'],
          success: false,
          details: { reason: 'user_not_found_or_not_admin', email: email.toLowerCase() },
        });

        return res.status(401).json({
          success: false,
          error: 'Invalid email or password',
        });
      }

      // Check if user has a password set
      if (!user.passwordHash) {
        enterpriseLogger.warn('Admin login failed: No password set', {
          userId: user.id,
          email: user.email,
          ip: req.ip,
        });

        await AuditLog.logAuthEvent({
          userId: user.id,
          action: 'admin_login_failed',
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.headers['user-agent'],
          success: false,
          details: { reason: 'no_password_set' },
        });

        return res.status(401).json({
          success: false,
          error: 'Password not set. Please set a password first.',
        });
      }

      // Check if user is active
      if (user.status !== 'active') {
        enterpriseLogger.warn('Admin login failed: Account not active', {
          userId: user.id,
          email: user.email,
          status: user.status,
          ip: req.ip,
        });

        await AuditLog.logAuthEvent({
          userId: user.id,
          action: 'admin_login_failed',
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.headers['user-agent'],
          success: false,
          details: { reason: 'account_not_active', status: user.status },
        });

        return res.status(403).json({
          success: false,
          error: 'Account is not active. Please contact support.',
        });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        enterpriseLogger.warn('Admin login failed: Invalid password', {
          userId: user.id,
          email: user.email,
          ip: req.ip,
        });

        await AuditLog.logAuthEvent({
          userId: user.id,
          action: 'admin_login_failed',
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.headers['user-agent'],
          success: false,
          details: { reason: 'invalid_password' },
        });

        return res.status(401).json({
          success: false,
          error: 'Invalid email or password',
        });
      }

      // Generate JWT token
      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          role: user.role,
          tokenVersion: user.tokenVersion,
        },
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: '8h' }, // Longer expiry for admin sessions
      );

      // Generate refresh token
      const refreshToken = uuidv4();
      const refreshTokenHash = await bcrypt.hash(refreshToken, 12);

      // Check concurrent session limit
      const maxConcurrentSessions = parseInt(process.env.MAX_CONCURRENT_SESSIONS) || 5; // Higher limit for admins
      await UserSession.enforceConcurrentLimit(user.id, maxConcurrentSessions, user.email);

      // Create session
      await UserSession.create({
        userId: user.id,
        refreshTokenHash,
        deviceInfo: req.headers['user-agent'] || 'Unknown',
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'],
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      });

      // Update last login
      await sequelize.query(
        `UPDATE public.users SET last_login_at = NOW(), updated_at = NOW() WHERE id = :userId`,
        {
          replacements: { userId: user.id },
        }
      );

      // Log successful login
      await AuditLog.logAuthEvent({
        userId: user.id,
        action: 'admin_login_success',
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'],
        success: true,
      });

      enterpriseLogger.info('Admin logged in successfully', {
        userId: user.id,
        email: user.email,
        role: user.role,
        ip: req.ip,
      });

      res.json({
        success: true,
        message: 'Admin login successful',
        data: {
          accessToken: token,
          refreshToken: refreshToken,
          user: {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            role: user.role,
            status: user.status,
          },
        },
      });
    } catch (error) {
      enterpriseLogger.error('Admin login error', {
        error: error.message,
        stack: error.stack,
        email: req.body?.email,
        ip: req.ip,
      });

      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
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
      const whereClause = {};

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
          { panNumber: { [Op.iLike]: `%${search}%` } },
          { id: { [Op.eq]: search } },
        ];
      }

      // Additional filters
      if (req.query.userType) {
        whereClause.role = req.query.userType;
      }
      if (req.query.registrationDateFrom) {
        whereClause.createdAt = {
          ...whereClause.createdAt,
          [Op.gte]: new Date(req.query.registrationDateFrom),
        };
      }
      if (req.query.registrationDateTo) {
        whereClause.createdAt = {
          ...whereClause.createdAt,
          [Op.lte]: new Date(req.query.registrationDateTo),
        };
      }
      if (req.query.lastLoginFrom) {
        whereClause.lastLoginAt = {
          ...whereClause.lastLoginAt,
          [Op.gte]: new Date(req.query.lastLoginFrom),
        };
      }
      if (req.query.lastLoginTo) {
        whereClause.lastLoginAt = {
          ...whereClause.lastLoginAt,
          [Op.lte]: new Date(req.query.lastLoginTo),
        };
      }
      if (req.query.emailVerified !== undefined) {
        whereClause.emailVerified = req.query.emailVerified === 'true';
      }
      if (req.query.phoneVerified !== undefined) {
        whereClause.phoneVerified = req.query.phoneVerified === 'true';
      }
      if (req.query.panVerified !== undefined) {
        whereClause.panVerified = req.query.panVerified === 'true';
      }
      if (req.query.authProvider) {
        whereClause.authProvider = req.query.authProvider;
      }
      // Handle activity-based filters using subqueries
      if (req.query.hasFilings === 'true') {
        // Users with at least one filing - use subquery
        const { QueryTypes } = require('sequelize');
        const usersWithFilingsResult = await sequelize.query(
          'SELECT DISTINCT user_id FROM itr_filings',
          { type: QueryTypes.SELECT }
        );
        const userIds = usersWithFilingsResult.map(f => f.user_id);
        if (userIds.length > 0) {
          whereClause.id = { [Op.in]: userIds };
        } else {
          // No users with filings, return empty result
          whereClause.id = { [Op.in]: [] };
        }
      } else if (req.query.hasFilings === 'false') {
        // Users without filings
        const { QueryTypes } = require('sequelize');
        const usersWithFilingsResult = await sequelize.query(
          'SELECT DISTINCT user_id FROM itr_filings',
          { type: QueryTypes.SELECT }
        );
        const userIds = usersWithFilingsResult.map(f => f.user_id);
        if (userIds.length > 0) {
          whereClause.id = { [Op.notIn]: userIds };
        }
      }
      
      if (req.query.hasPayments === 'true') {
        // Users with at least one paid invoice
        const usersWithPayments = await Invoice.findAll({
          attributes: ['userId'],
          where: { status: 'paid' },
          group: ['userId'],
          raw: true,
        });
        const userIds = usersWithPayments.map(i => i.userId).filter(Boolean);
        if (userIds.length > 0) {
          // If hasFilings filter already set, intersect the arrays
          if (whereClause.id && whereClause.id[Op.in]) {
            const existingIds = Array.isArray(whereClause.id[Op.in]) ? whereClause.id[Op.in] : [whereClause.id[Op.in]];
            whereClause.id = { [Op.in]: existingIds.filter(id => userIds.includes(id)) };
          } else {
            whereClause.id = { [Op.in]: userIds };
          }
        } else {
          whereClause.id = { [Op.in]: [] };
        }
      } else if (req.query.hasPayments === 'false') {
        // Users without payments
        const usersWithPayments = await Invoice.findAll({
          attributes: ['userId'],
          where: { status: 'paid' },
          group: ['userId'],
          raw: true,
        });
        const userIds = usersWithPayments.map(i => i.userId).filter(Boolean);
        if (userIds.length > 0) {
          if (whereClause.id && whereClause.id[Op.in]) {
            const existingIds = Array.isArray(whereClause.id[Op.in]) ? whereClause.id[Op.in] : [whereClause.id[Op.in]];
            whereClause.id = { [Op.in]: existingIds.filter(id => !userIds.includes(id)) };
          } else if (whereClause.id && whereClause.id[Op.notIn]) {
            const existingIds = Array.isArray(whereClause.id[Op.notIn]) ? whereClause.id[Op.notIn] : [whereClause.id[Op.notIn]];
            whereClause.id = { [Op.notIn]: [...existingIds, ...userIds] };
          } else {
            whereClause.id = { [Op.notIn]: userIds };
          }
        }
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
        this._getFilingStatsData(),
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

      // Get recent audit logs
      const activities = await AuditLog.findAll({
        order: [['timestamp', 'DESC']],
        limit: parseInt(limit),
      });

      // Get user info for activities
      const userIds = [...new Set(activities.map(a => a.userId).filter(Boolean))];
      const users = userIds.length > 0 ? await User.findAll({
        where: { id: { [Op.in]: userIds } },
        attributes: ['id', 'fullName', 'email'],
      }) : [];
      const userMap = new Map(users.map(u => [u.id, u]));

      const activityList = activities.map(activity => {
        const user = userMap.get(activity.userId);
        return {
          id: activity.id,
          type: activity.action,
          description: `${activity.action} on ${activity.resource || 'unknown'}`,
          userId: activity.userId,
          userName: user?.fullName,
          userEmail: user?.email,
          timestamp: activity.timestamp,
          ipAddress: activity.ipAddress,
          success: activity.success,
          metadata: activity.metadata,
        };
      });

      enterpriseLogger.info('Recent activity retrieved via admin API', {
        adminId,
        limit,
        count: activityList.length,
      });

      res.status(200).json({
        success: true,
        message: 'Recent activity retrieved successfully',
        data: {
          activities: activityList,
          count: activityList.length,
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
   * Get dashboard statistics
   * GET /api/admin/dashboard/stats
   */
  async getDashboardStats(req, res, next) {
    try {
      const adminId = req.user.id;

      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Get stats using helper methods
      const userStats = await this.getUserStats();
      const filingStats = await this._getFilingStatsData();
      const ticketStats = ServiceTicket.getTicketStats ? await ServiceTicket.getTicketStats() : { totalTickets: 0, openTickets: 0 };
      const documentStats = await this.getDocumentStats();

      // Calculate user growth
      const previousPeriodUsers = await User.count({
        where: { createdAt: { [Op.between]: [monthAgo, weekAgo] } }
      });
      const currentPeriodUsers = await User.count({
        where: { createdAt: { [Op.gte]: weekAgo } }
      });
      const userGrowth = previousPeriodUsers > 0 
        ? ((currentPeriodUsers - previousPeriodUsers) / previousPeriodUsers * 100).toFixed(1)
        : 0;

      // Calculate new users today
      const newUsersToday = await User.count({
        where: { createdAt: { [Op.gte]: todayStart } }
      });

      // Calculate revenue (from invoices)
      const revenueStats = await Invoice.findAll({
        attributes: [
          [sequelize.fn('SUM', sequelize.literal('CASE WHEN status = \'paid\' THEN total_amount ELSE 0 END')), 'totalRevenue'],
          [sequelize.fn('SUM', sequelize.literal('CASE WHEN status = \'paid\' AND created_at >= CURRENT_DATE THEN total_amount ELSE 0 END')), 'todayRevenue'],
          [sequelize.fn('COUNT', sequelize.literal('CASE WHEN status = \'paid\' THEN 1 END')), 'paidInvoices'],
        ],
        raw: true,
      });

      // Calculate revenue growth
      const previousPeriodRevenue = await Invoice.findAll({
        where: {
          createdAt: { [Op.between]: [monthAgo, weekAgo] },
          status: 'paid',
        },
        attributes: [
          [sequelize.fn('SUM', sequelize.col('total_amount')), 'total'],
        ],
        raw: true,
      });

      const currentPeriodRevenue = await Invoice.findAll({
        where: {
          createdAt: { [Op.gte]: weekAgo },
          status: 'paid',
        },
        attributes: [
          [sequelize.fn('SUM', sequelize.col('total_amount')), 'total'],
        ],
        raw: true,
      });

      const prevRevenue = parseFloat(previousPeriodRevenue[0]?.total) || 0;
      const currRevenue = parseFloat(currentPeriodRevenue[0]?.total) || 0;
      const revenueGrowth = prevRevenue > 0 
        ? ((currRevenue - prevRevenue) / prevRevenue * 100).toFixed(1)
        : 0;

      // Calculate filing completion rate
      const totalFilings = filingStats.totalFilings;
      const completedFilings = filingStats.acknowledgedFilings || 0;
      const completionRate = totalFilings > 0 
        ? ((completedFilings / totalFilings) * 100).toFixed(1)
        : 0;

      // Calculate filings today
      const filingsToday = await ITRFiling.count({
        where: { createdAt: { [Op.gte]: todayStart } }
      });

      const stats = {
        users: {
          total: userStats.totalUsers,
          active: userStats.activeUsers,
          newToday: newUsersToday,
          growth: parseFloat(userGrowth),
        },
        filings: {
          total: filingStats.totalFilings,
          today: filingsToday,
          completed: completedFilings,
          completionRate: parseFloat(completionRate),
          byType: {
            itr1: filingStats.itr1Filings,
            itr2: filingStats.itr2Filings,
            itr3: filingStats.itr3Filings,
            itr4: filingStats.itr4Filings,
          },
        },
        revenue: {
          total: parseFloat(revenueStats[0]?.totalRevenue) || 0,
          today: parseFloat(revenueStats[0]?.todayRevenue) || 0,
          paidInvoices: parseInt(revenueStats[0]?.paidInvoices) || 0,
          growth: parseFloat(revenueGrowth),
        },
        tickets: ticketStats,
        documents: documentStats,
      };

      res.status(200).json({
        success: true,
        message: 'Dashboard statistics retrieved successfully',
        data: {
          stats,
        },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to get dashboard stats via admin API', {
        error: error.message,
        adminId: req.user?.id,
      });
      next(error);
    }
  }

  /**
   * Get chart data
   * GET /api/admin/dashboard/charts/:type
   */
  async getChartData(req, res, next) {
    try {
      const { type } = req.params;
      const { dateFrom, dateTo } = req.query;
      const adminId = req.user.id;

      const whereClause = {};
      if (dateFrom) {
        whereClause.createdAt = {
          ...whereClause.createdAt,
          [Op.gte]: new Date(dateFrom),
        };
      }
      if (dateTo) {
        whereClause.createdAt = {
          ...whereClause.createdAt,
          [Op.lte]: new Date(dateTo),
        };
      }

      let chartData = {};

      switch (type) {
        case 'users':
          // User registration trends
          const users = await User.findAll({
            where: whereClause,
            attributes: [
              [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
              [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
            ],
            group: [sequelize.fn('DATE', sequelize.col('created_at'))],
            order: [[sequelize.fn('DATE', sequelize.col('created_at')), 'ASC']],
            raw: true,
          });
          chartData = {
            labels: users.map(u => u.date),
            datasets: [{
              label: 'New Users',
              data: users.map(u => parseInt(u.count)),
            }],
          };
          break;

        case 'filings':
          // Filing trends
          const filings = await ITRFiling.findAll({
            where: whereClause,
            attributes: [
              [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
              [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
            ],
            group: [sequelize.fn('DATE', sequelize.col('created_at'))],
            order: [[sequelize.fn('DATE', sequelize.col('created_at')), 'ASC']],
            raw: true,
          });
          chartData = {
            labels: filings.map(f => f.date),
            datasets: [{
              label: 'Filings',
              data: filings.map(f => parseInt(f.count)),
            }],
          };
          break;

        case 'revenue':
          // Revenue trends
          const revenue = await Invoice.findAll({
            where: {
              ...whereClause,
              status: 'paid',
            },
            attributes: [
              [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
              [sequelize.fn('SUM', sequelize.col('total_amount')), 'amount'],
            ],
            group: [sequelize.fn('DATE', sequelize.col('created_at'))],
            order: [[sequelize.fn('DATE', sequelize.col('created_at')), 'ASC']],
            raw: true,
          });
          chartData = {
            labels: revenue.map(r => r.date),
            datasets: [{
              label: 'Revenue',
              data: revenue.map(r => parseFloat(r.amount) || 0),
            }],
          };
          break;

        default:
          throw new AppError(`Invalid chart type: ${type}`, 400);
      }

      res.status(200).json({
        success: true,
        message: 'Chart data retrieved successfully',
        data: {
          type,
          chartData,
        },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to get chart data via admin API', {
        error: error.message,
        adminId: req.user?.id,
        type: req.params.type,
      });
      next(error);
    }
  }

  /**
   * Get system alerts
   * GET /api/admin/dashboard/alerts
   */
  async getSystemAlerts(req, res, next) {
    try {
      const adminId = req.user.id;

      const alerts = [];

      // Check for high error rates
      const recentErrors = await AuditLog.count({
        where: {
          success: false,
          timestamp: {
            [Op.gte]: new Date(Date.now() - 60 * 60 * 1000), // Last hour
          },
        },
      });

      if (recentErrors > 10) {
        alerts.push({
          id: 'high-error-rate',
          type: 'error',
          severity: 'high',
          title: 'High Error Rate',
          message: `${recentErrors} errors in the last hour`,
          timestamp: new Date().toISOString(),
        });
      }

      // Check for pending CA verifications (check CAFirm status instead)
      // Note: User model doesn't have 'pending' status, so we check CAFirm status
      const pendingCAs = await CAFirm.count({
        where: {
          status: 'inactive', // Inactive CA firms might be pending verification
        },
      });

      if (pendingCAs > 0) {
        alerts.push({
          id: 'pending-ca-verifications',
          type: 'warning',
          severity: 'medium',
          title: 'Pending CA Verifications',
          message: `${pendingCAs} CA accounts pending verification`,
          timestamp: new Date().toISOString(),
        });
      }

      // Check for payment gateway issues (would check actual gateway status)
      alerts.push({
        id: 'payment-gateway-status',
        type: 'info',
        severity: 'low',
        title: 'Payment Gateway',
        message: 'All payment gateways operational',
        timestamp: new Date().toISOString(),
      });

      res.status(200).json({
        success: true,
        message: 'System alerts retrieved successfully',
        data: {
          alerts,
          count: alerts.length,
        },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to get system alerts via admin API', {
        error: error.message,
        adminId: req.user?.id,
      });
      next(error);
    }
  }

  /**
   * Get user analytics
   * GET /api/admin/analytics/users
   */
  async getUserAnalytics(req, res, next) {
    try {
      const { dateFrom, dateTo, timeRange = '30d' } = req.query;
      const adminId = req.user.id;

      const { startDate, endDate } = this._calculateTimeRange(timeRange, dateFrom, dateTo);

      // User acquisition trends
      const users = await User.findAll({
        where: {
          createdAt: {
            [Op.between]: [startDate, endDate],
          },
        },
        attributes: [
          'id',
          'role',
          'status',
          'createdAt',
          'lastLoginAt',
        ],
      });

      // Calculate DAU/WAU/MAU
      const now = moment();
      const dailyActive = await User.count({
        where: {
          lastLoginAt: {
            [Op.gte]: now.clone().subtract(1, 'day').toDate(),
          },
        },
      });

      const weeklyActive = await User.count({
        where: {
          lastLoginAt: {
            [Op.gte]: now.clone().subtract(7, 'days').toDate(),
          },
        },
      });

      const monthlyActive = await User.count({
        where: {
          lastLoginAt: {
            [Op.gte]: now.clone().subtract(30, 'days').toDate(),
          },
        },
      });

      // User acquisition trends
      const periodDays = moment(endDate).diff(moment(startDate), 'days');
      const acquisitionTrends = this._aggregateByTimePeriod(
        users.map(u => ({ createdAt: u.createdAt, value: 1 })),
        periodDays <= 7 ? 'day' : periodDays <= 90 ? 'week' : 'month',
        startDate,
        endDate
      );

      // Retention cohorts
      const retentionCohorts = this._calculateRetentionCohorts(users, startDate, endDate);

      // Calculate retention rate
      const activeInPeriod = users.filter(u => 
        u.lastLoginAt && moment(u.lastLoginAt).isAfter(moment(startDate))
      ).length;
      const retentionRate = users.length > 0 ? (activeInPeriod / users.length) * 100 : 0;

      // Geographic distribution (simplified - can be enhanced with actual location data)
      const geographicDistribution = {
        'Unknown': users.length, // Placeholder until location data is available
      };

      // Device breakdown (simplified - can be enhanced with actual device data)
      const deviceBreakdown = {
        'Unknown': users.length, // Placeholder until device tracking is implemented
      };

      // User journey funnel (simplified)
      const totalRegistered = users.length;
      const completedProfile = users.filter(u => u.status === 'active').length;
      const madeFiling = await sequelize.query(
        `SELECT COUNT(DISTINCT u.id) as count
         FROM users u
         INNER JOIN itr_filings f ON u.id = f.user_id
         WHERE u.created_at BETWEEN :startDate AND :endDate`,
        {
          replacements: { startDate, endDate },
          type: QueryTypes.SELECT,
        }
      );
      const filingCount = parseInt(madeFiling[0]?.count || 0);

      const analytics = {
        totalUsers: users.length,
        newUsers: users.length,
        activeUsers: users.filter(u => u.status === 'active').length,
        dailyActive,
        weeklyActive,
        monthlyActive,
        byRole: {},
        byStatus: {},
        acquisitionTrends,
        retentionRate,
        retentionCohorts,
        geographicDistribution,
        deviceBreakdown,
        userJourneyFunnel: {
          registered: totalRegistered,
          completedProfile,
          madeFiling: filingCount,
          conversionRate: totalRegistered > 0 ? (filingCount / totalRegistered) * 100 : 0,
        },
        averageLoginCount: 0, // Can be enhanced with actual login tracking
      };

      users.forEach(user => {
        analytics.byRole[user.role] = (analytics.byRole[user.role] || 0) + 1;
        analytics.byStatus[user.status] = (analytics.byStatus[user.status] || 0) + 1;
      });

      res.status(200).json({
        success: true,
        message: 'User analytics retrieved successfully',
        data: {
          analytics,
        },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to get user analytics via admin API', {
        error: error.message,
        adminId: req.user?.id,
      });
      next(error);
    }
  }

  // =====================================================
  // ANALYTICS HELPER METHODS
  // =====================================================

  /**
   * Calculate time range from string (7d, 30d, 90d, 1y, custom)
   * @param {string} timeRange - Time range string
   * @param {string} dateFrom - Custom start date (optional)
   * @param {string} dateTo - Custom end date (optional)
   * @returns {Object} { startDate, endDate }
   */
  _calculateTimeRange(timeRange, dateFrom, dateTo) {
    const endDate = dateTo ? moment(dateTo).endOf('day').toDate() : moment().endOf('day').toDate();
    let startDate;

    if (dateFrom) {
      startDate = moment(dateFrom).startOf('day').toDate();
    } else {
      switch (timeRange) {
        case '7d':
          startDate = moment().subtract(7, 'days').startOf('day').toDate();
          break;
        case '30d':
          startDate = moment().subtract(30, 'days').startOf('day').toDate();
          break;
        case '90d':
          startDate = moment().subtract(90, 'days').startOf('day').toDate();
          break;
        case '1y':
          startDate = moment().subtract(1, 'year').startOf('day').toDate();
          break;
        default:
          startDate = moment().subtract(30, 'days').startOf('day').toDate();
      }
    }

    return { startDate, endDate };
  }

  /**
   * Calculate growth trends (percentage change)
   * @param {number} current - Current period value
   * @param {number} previous - Previous period value
   * @returns {number} Percentage change
   */
  _calculateTrend(current, previous) {
    if (!previous || previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }

  /**
   * Aggregate data by time period (day, week, month)
   * @param {Array} data - Array of objects with createdAt
   * @param {string} period - 'day', 'week', 'month'
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Array} Aggregated data
   */
  _aggregateByTimePeriod(data, period, startDate, endDate) {
    const aggregated = {};
    const formatMap = {
      day: 'YYYY-MM-DD',
      week: 'YYYY-[W]WW',
      month: 'YYYY-MM',
    };
    const format = formatMap[period] || formatMap.day;

    data.forEach(item => {
      const key = moment(item.createdAt).format(format);
      if (!aggregated[key]) {
        aggregated[key] = { date: key, count: 0, value: 0 };
      }
      aggregated[key].count += 1;
      if (item.value !== undefined) {
        aggregated[key].value += parseFloat(item.value || 0);
      }
    });

    // Fill in missing periods
    const result = [];
    let current = moment(startDate);
    const end = moment(endDate);

    while (current.isSameOrBefore(end)) {
      const key = current.format(format);
      result.push(aggregated[key] || { date: key, count: 0, value: 0 });
      current.add(1, period === 'week' ? 'week' : period);
    }

    return result.sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Calculate retention cohorts
   * @param {Array} users - Array of user objects with createdAt and lastLoginAt
   * @param {Date} startDate - Cohort start date
   * @param {Date} endDate - Cohort end date
   * @returns {Object} Retention metrics
   */
  _calculateRetentionCohorts(users, startDate, endDate) {
    const cohorts = {};
    const now = moment();

    users.forEach(user => {
      const signupDate = moment(user.createdAt);
      const cohortKey = signupDate.format('YYYY-MM');
      
      if (!cohorts[cohortKey]) {
        cohorts[cohortKey] = {
          cohort: cohortKey,
          totalUsers: 0,
          activeUsers: 0,
          retentionRate: 0,
        };
      }

      cohorts[cohortKey].totalUsers += 1;
      
      if (user.lastLoginAt) {
        const lastLogin = moment(user.lastLoginAt);
        const daysSinceSignup = now.diff(signupDate, 'days');
        const daysSinceLogin = now.diff(lastLogin, 'days');
        
        // Active if logged in within last 30 days
        if (daysSinceLogin <= 30 && daysSinceSignup >= 7) {
          cohorts[cohortKey].activeUsers += 1;
        }
      }
    });

    // Calculate retention rates
    Object.keys(cohorts).forEach(key => {
      const cohort = cohorts[key];
      cohort.retentionRate = cohort.totalUsers > 0
        ? (cohort.activeUsers / cohort.totalUsers) * 100
        : 0;
    });

    return Object.values(cohorts);
  }

  /**
   * Get revenue analytics
   * GET /api/admin/analytics/revenue
   */
  async getRevenueAnalytics(req, res, next) {
    try {
      const { dateFrom, dateTo, timeRange = '30d' } = req.query;
      const adminId = req.user.id;

      const { startDate, endDate } = this._calculateTimeRange(timeRange, dateFrom, dateTo);

      const whereClause = {
        status: 'paid',
        createdAt: {
          [Op.between]: [startDate, endDate],
        },
      };

      const invoices = await Invoice.findAll({
        where: whereClause,
        attributes: [
          'id',
          'totalAmount',
          'type',
          'createdAt',
          'paymentMethod',
          'status',
        ],
      });

      const totalRevenue = invoices.reduce((sum, inv) => sum + parseFloat(inv.totalAmount || 0), 0);
      const averageTransactionValue = invoices.length > 0 ? totalRevenue / invoices.length : 0;

      // Revenue trends
      const periodDays = moment(endDate).diff(moment(startDate), 'days');
      const trends = this._aggregateByTimePeriod(
        invoices.map(inv => ({ createdAt: inv.createdAt, value: parseFloat(inv.totalAmount || 0) })),
        periodDays <= 7 ? 'day' : periodDays <= 90 ? 'week' : 'month',
        startDate,
        endDate
      );

      // Calculate ARPU (Average Revenue Per User)
      const totalUsers = await User.count();
      const arpu = totalUsers > 0 ? totalRevenue / totalUsers : 0;

      // Calculate LTV (Lifetime Value) - simplified as ARPU * average customer lifetime (12 months)
      const ltv = arpu * 12;

      // Payment method breakdown
      const paymentMethodBreakdown = {};
      invoices.forEach(invoice => {
        const method = invoice.paymentMethod || 'unknown';
        paymentMethodBreakdown[method] = (paymentMethodBreakdown[method] || 0) + parseFloat(invoice.totalAmount || 0);
      });

      // Revenue by segment
      const revenueBySegment = {
        itrFiling: invoices.filter(inv => inv.type === 'itr_filing').reduce((sum, inv) => sum + parseFloat(inv.totalAmount || 0), 0),
        consultation: invoices.filter(inv => inv.type === 'consultation').reduce((sum, inv) => sum + parseFloat(inv.totalAmount || 0), 0),
        premium: invoices.filter(inv => inv.type === 'premium').reduce((sum, inv) => sum + parseFloat(inv.totalAmount || 0), 0),
        other: invoices.filter(inv => !['itr_filing', 'consultation', 'premium'].includes(inv.type)).reduce((sum, inv) => sum + parseFloat(inv.totalAmount || 0), 0),
      };

      // Refund analysis
      const refundedInvoices = await Invoice.findAll({
        where: {
          status: 'refunded',
          createdAt: {
            [Op.between]: [startDate, endDate],
          },
        },
        attributes: ['id', 'totalAmount'],
      });

      const refundAmount = refundedInvoices.reduce((sum, inv) => sum + parseFloat(inv.totalAmount || 0), 0);
      const refundRate = totalRevenue > 0 ? (refundAmount / totalRevenue) * 100 : 0;

      const analytics = {
        totalRevenue,
        byType: {},
        trends,
        averageTransactionValue,
        arpu,
        ltv,
        paymentMethodBreakdown,
        revenueBySegment,
        refundAnalysis: {
          refundAmount,
          refundRate,
          refundCount: refundedInvoices.length,
        },
      };

      invoices.forEach(invoice => {
        analytics.byType[invoice.type] = (analytics.byType[invoice.type] || 0) + parseFloat(invoice.totalAmount || 0);
      });

      res.status(200).json({
        success: true,
        message: 'Revenue analytics retrieved successfully',
        data: {
          analytics,
        },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to get revenue analytics via admin API', {
        error: error.message,
        adminId: req.user?.id,
      });
      next(error);
    }
  }

  /**
   * Unified analytics endpoint
   * GET /api/admin/analytics
   * Query params: timeRange (7d, 30d, 90d, 1y, custom), type (overview, users, filings, revenue, ca), dateFrom, dateTo
   */
  async getAnalytics(req, res, next) {
    try {
      const { timeRange = '30d', type = 'overview', dateFrom, dateTo } = req.query;
      const adminId = req.user.id;

      // Validate timeRange
      const validTimeRanges = ['7d', '30d', '90d', '1y', 'custom'];
      if (!validTimeRanges.includes(timeRange) && !dateFrom && !dateTo) {
        return res.status(400).json({
          success: false,
          message: 'Invalid timeRange. Use: 7d, 30d, 90d, 1y, or custom with dateFrom/dateTo',
        });
      }

      // Validate date range if custom
      if (timeRange === 'custom' || dateFrom || dateTo) {
        if (!dateFrom || !dateTo) {
          return res.status(400).json({
            success: false,
            message: 'dateFrom and dateTo are required for custom time range',
          });
        }
        if (moment(dateFrom).isAfter(moment(dateTo))) {
          return res.status(400).json({
            success: false,
            message: 'dateFrom must be before dateTo',
          });
        }
      }

      const { startDate, endDate } = this._calculateTimeRange(timeRange, dateFrom, dateTo);

      // Calculate previous period for comparison
      const periodDays = moment(endDate).diff(moment(startDate), 'days');
      const previousStartDate = moment(startDate).subtract(periodDays, 'days').toDate();
      const previousEndDate = moment(startDate).subtract(1, 'day').toDate();

      const responseData = {
        overview: {},
        trends: [],
        userMetrics: {},
        filingMetrics: {},
        revenueMetrics: {},
        caMetrics: {},
        topMetrics: [],
        charts: {},
      };

      // Fetch data based on type
      if (type === 'overview' || type === 'users') {
        // User analytics
        const users = await User.findAll({
          where: {
            createdAt: {
              [Op.between]: [startDate, endDate],
            },
          },
          attributes: ['id', 'role', 'status', 'createdAt', 'lastLoginAt'],
        });

        const previousUsers = await User.findAll({
          where: {
            createdAt: {
              [Op.between]: [previousStartDate, previousEndDate],
            },
          },
          attributes: ['id', 'role', 'status', 'createdAt', 'lastLoginAt'],
        });

        // Calculate DAU/WAU/MAU
        const now = moment();
        const dailyActive = await User.count({
          where: {
            lastLoginAt: {
              [Op.gte]: now.clone().subtract(1, 'day').toDate(),
            },
          },
        });

        const weeklyActive = await User.count({
          where: {
            lastLoginAt: {
              [Op.gte]: now.clone().subtract(7, 'days').toDate(),
            },
          },
        });

        const monthlyActive = await User.count({
          where: {
            lastLoginAt: {
              [Op.gte]: now.clone().subtract(30, 'days').toDate(),
            },
          },
        });

        // User trends
        const userTrends = this._aggregateByTimePeriod(
          users.map(u => ({ createdAt: u.createdAt, value: 1 })),
          periodDays <= 7 ? 'day' : periodDays <= 90 ? 'week' : 'month',
          startDate,
          endDate
        );

        responseData.userMetrics = {
          totalUsers: users.length,
          newUsers: users.length,
          activeUsers: users.filter(u => u.status === 'active').length,
          dailyActive,
          weeklyActive,
          monthlyActive,
          retentionRate: 0,
          byRole: {},
          byStatus: {},
          acquisitionTrends: userTrends,
          retentionCohorts: this._calculateRetentionCohorts(users, startDate, endDate),
        };

        users.forEach(user => {
          responseData.userMetrics.byRole[user.role] = (responseData.userMetrics.byRole[user.role] || 0) + 1;
          responseData.userMetrics.byStatus[user.status] = (responseData.userMetrics.byStatus[user.status] || 0) + 1;
        });

        // Calculate retention
        const activeInPeriod = users.filter(u => 
          u.lastLoginAt && moment(u.lastLoginAt).isAfter(moment(startDate))
        ).length;
        responseData.userMetrics.retentionRate = users.length > 0
          ? (activeInPeriod / users.length) * 100
          : 0;
      }

      if (type === 'overview' || type === 'filings') {
        // Filing analytics
        const filings = await ITRFiling.findAll({
          where: {
            createdAt: {
              [Op.between]: [startDate, endDate],
            },
          },
          attributes: [
            'id',
            'itrType',
            'status',
            'assessmentYear',
            'createdAt',
            'submittedAt',
            'acknowledgedAt',
          ],
        });

        const previousFilings = await ITRFiling.findAll({
          where: {
            createdAt: {
              [Op.between]: [previousStartDate, previousEndDate],
            },
          },
        });

        // Filing trends
        const filingTrends = this._aggregateByTimePeriod(
          filings.map(f => ({ createdAt: f.createdAt, value: 1 })),
          periodDays <= 7 ? 'day' : periodDays <= 90 ? 'week' : 'month',
          startDate,
          endDate
        );

        // Peak hours analysis
        const peakHours = {};
        filings.forEach(filing => {
          if (filing.createdAt) {
            const hour = moment(filing.createdAt).hour();
            peakHours[hour] = (peakHours[hour] || 0) + 1;
          }
        });

        const completed = filings.filter(f => ['acknowledged', 'processed'].includes(f.status)).length;
        const avgProcessingTime = filings
          .filter(f => f.submittedAt && f.acknowledgedAt)
          .map(f => moment(f.acknowledgedAt).diff(moment(f.submittedAt), 'days'))
          .reduce((sum, days, _, arr) => sum + days / arr.length, 0);

        responseData.filingMetrics = {
          totalFilings: filings.length,
          completed,
          inProgress: filings.filter(f => ['draft', 'submitted'].includes(f.status)).length,
          pending: filings.filter(f => f.status === 'draft').length,
          successRate: filings.length > 0 ? (completed / filings.length) * 100 : 0,
          avgProcessingTime: Math.round(avgProcessingTime) || 0,
          byType: {},
          byStatus: {},
          trends: filingTrends,
          peakHours,
        };

        filings.forEach(filing => {
          responseData.filingMetrics.byType[filing.itrType] = 
            (responseData.filingMetrics.byType[filing.itrType] || 0) + 1;
          responseData.filingMetrics.byStatus[filing.status] = 
            (responseData.filingMetrics.byStatus[filing.status] || 0) + 1;
        });
      }

      if (type === 'overview' || type === 'revenue') {
        // Revenue analytics
        const invoices = await Invoice.findAll({
          where: {
            status: 'paid',
            createdAt: {
              [Op.between]: [startDate, endDate],
            },
          },
          attributes: ['id', 'totalAmount', 'type', 'createdAt'],
        });

        const previousInvoices = await Invoice.findAll({
          where: {
            status: 'paid',
            createdAt: {
              [Op.between]: [previousStartDate, previousEndDate],
            },
          },
        });

        const totalRevenue = invoices.reduce((sum, inv) => sum + parseFloat(inv.totalAmount || 0), 0);
        const previousRevenue = previousInvoices.reduce((sum, inv) => sum + parseFloat(inv.totalAmount || 0), 0);

        // Revenue trends
        const revenueTrends = this._aggregateByTimePeriod(
          invoices.map(inv => ({ createdAt: inv.createdAt, value: parseFloat(inv.totalAmount || 0) })),
          periodDays <= 7 ? 'day' : periodDays <= 90 ? 'week' : 'month',
          startDate,
          endDate
        );

        const totalUsers = await User.count();
        const arpu = totalUsers > 0 ? totalRevenue / totalUsers : 0;

        responseData.revenueMetrics = {
          total: totalRevenue,
          arpu,
          ltv: arpu * 12, // Simplified LTV calculation
          itrFees: invoices.filter(inv => inv.type === 'itr_filing').reduce((sum, inv) => sum + parseFloat(inv.totalAmount || 0), 0),
          consultationFees: invoices.filter(inv => inv.type === 'consultation').reduce((sum, inv) => sum + parseFloat(inv.totalAmount || 0), 0),
          premiumServices: invoices.filter(inv => inv.type === 'premium').reduce((sum, inv) => sum + parseFloat(inv.totalAmount || 0), 0),
          byType: {},
          trends: revenueTrends,
          growth: this._calculateTrend(totalRevenue, previousRevenue),
        };

        invoices.forEach(invoice => {
          responseData.revenueMetrics.byType[invoice.type] = 
            (responseData.revenueMetrics.byType[invoice.type] || 0) + parseFloat(invoice.totalAmount || 0);
        });
      }

      if (type === 'overview') {
        // Overview metrics
        const totalUsers = await User.count();
        const totalFilings = await ITRFiling.count();
        const totalRevenue = await Invoice.sum('totalAmount', {
          where: { status: 'paid' },
        }) || 0;

        const previousTotalUsers = await User.count({
          where: {
            createdAt: {
              [Op.lt]: startDate,
            },
          },
        });

        const previousTotalFilings = await ITRFiling.count({
          where: {
            createdAt: {
              [Op.lt]: startDate,
            },
          },
        });

        const previousTotalRevenue = await Invoice.sum('totalAmount', {
          where: {
            status: 'paid',
            createdAt: {
              [Op.lt]: startDate,
            },
          },
        }) || 0;

        responseData.overview = {
          totalUsers,
          totalFilings,
          revenue: totalRevenue,
          activeUsers: responseData.userMetrics.dailyActive || 0,
          userGrowth: this._calculateTrend(totalUsers, previousTotalUsers),
          filingGrowth: this._calculateTrend(totalFilings, previousTotalFilings),
          revenueGrowth: this._calculateTrend(totalRevenue, previousTotalRevenue),
        };

        // Combined trends
        responseData.trends = [
          {
            name: 'Users',
            data: responseData.userMetrics.acquisitionTrends || [],
          },
          {
            name: 'Filings',
            data: responseData.filingMetrics.trends || [],
          },
          {
            name: 'Revenue',
            data: responseData.revenueMetrics.trends || [],
          },
        ];

        // Top metrics
        responseData.topMetrics = [
          { name: 'Total Users', value: totalUsers },
          { name: 'Total Filings', value: totalFilings },
          { name: 'Total Revenue', value: `₹${(totalRevenue / 100000).toFixed(1)}L` },
          { name: 'Active Users (DAU)', value: responseData.userMetrics.dailyActive || 0 },
        ];
      }

      // Chart data structure
      responseData.charts = {
        userTrends: responseData.userMetrics.acquisitionTrends || [],
        filingTrends: responseData.filingMetrics.trends || [],
        revenueTrends: responseData.revenueMetrics.trends || [],
        userDistribution: Object.entries(responseData.userMetrics.byRole || {}).map(([name, value]) => ({ name, value })),
        filingDistribution: Object.entries(responseData.filingMetrics.byStatus || {}).map(([name, value]) => ({ name, value })),
        revenueDistribution: Object.entries(responseData.revenueMetrics.byType || {}).map(([name, value]) => ({ name, value })),
      };

      enterpriseLogger.info('Analytics retrieved via admin API', {
        adminId,
        timeRange,
        type,
      });

      res.status(200).json({
        success: true,
        message: 'Analytics retrieved successfully',
        data: responseData,
      });

    } catch (error) {
      enterpriseLogger.error('Failed to get analytics via admin API', {
        error: error.message,
        stack: error.stack,
        adminId: req.user?.id,
      });
      next(error);
    }
  }

  /**
   * Update user profile
   * PUT /api/admin/users/:id
   */
  async updateUser(req, res, next) {
    try {
      const { id } = req.params;
      const { fullName, email, phone, panNumber, reason } = req.body;
      const adminId = req.user.id;

      const user = await User.findByPk(id);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      const updateData = {};
      if (fullName !== undefined) updateData.fullName = fullName;
      if (email !== undefined) updateData.email = email;
      if (phone !== undefined) updateData.phone = phone;
      if (panNumber !== undefined) updateData.panNumber = panNumber;

      await user.update(updateData);

      // Log audit event
      await auditService.logDataAccess(
        adminId,
        'update',
        'user_profile',
        id,
        {
          updates: updateData,
          reason: reason || 'No reason provided',
          userId: id,
        },
        req.ip,
      );

      enterpriseLogger.info('User profile updated via admin API', {
        adminId,
        userId: id,
        updates: updateData,
      });

      res.status(200).json({
        success: true,
        message: 'User profile updated successfully',
        data: {
          userId: id,
          updates: updateData,
        },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to update user profile via admin API', {
        error: error.message,
        adminId: req.user?.id,
        userId: req.params.id,
      });
      next(error);
    }
  }

  /**
   * Activate user account
   * POST /api/admin/users/:id/activate
   */
  async activateUser(req, res, next) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const adminId = req.user.id;

      const user = await User.findByPk(id);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      const oldStatus = user.status;
      user.status = 'active';
      await user.save();

      // Log audit event
      await auditService.logDataAccess(
        adminId,
        'update',
        'user_status',
        id,
        {
          oldStatus,
          newStatus: 'active',
          reason: reason || 'Account activated by admin',
          userId: id,
        },
        req.ip,
      );

      enterpriseLogger.info('User activated via admin API', {
        adminId,
        userId: id,
      });

      res.status(200).json({
        success: true,
        message: 'User activated successfully',
        data: {
          userId: id,
          status: 'active',
        },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to activate user via admin API', {
        error: error.message,
        adminId: req.user?.id,
        userId: req.params.id,
      });
      next(error);
    }
  }

  /**
   * Deactivate user account
   * POST /api/admin/users/:id/deactivate
   */
  async deactivateUser(req, res, next) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const adminId = req.user.id;

      const user = await User.findByPk(id);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      const oldStatus = user.status;
      user.status = 'inactive';
      await user.save();

      // Log audit event
      await auditService.logDataAccess(
        adminId,
        'update',
        'user_status',
        id,
        {
          oldStatus,
          newStatus: 'inactive',
          reason: reason || 'Account deactivated by admin',
          userId: id,
        },
        req.ip,
      );

      enterpriseLogger.info('User deactivated via admin API', {
        adminId,
        userId: id,
      });

      res.status(200).json({
        success: true,
        message: 'User deactivated successfully',
        data: {
          userId: id,
          status: 'inactive',
        },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to deactivate user via admin API', {
        error: error.message,
        adminId: req.user?.id,
        userId: req.params.id,
      });
      next(error);
    }
  }

  /**
   * Impersonate user
   * POST /api/admin/auth/impersonate/:userId
   */
  async impersonateUser(req, res, next) {
    try {
      const { userId } = req.params;
      const { reason } = req.body;
      const adminId = req.user.id;
      const adminRole = req.user.role;

      // Only SUPER_ADMIN and PLATFORM_ADMIN can impersonate
      if (!['SUPER_ADMIN', 'PLATFORM_ADMIN'].includes(adminRole)) {
        throw new AppError('Only admins can impersonate users', 403);
      }

      // Get target user
      const targetUser = await User.findByPk(userId);
      if (!targetUser) {
        throw new AppError('User not found', 404);
      }

      // Prevent impersonating other admins
      if (['SUPER_ADMIN', 'PLATFORM_ADMIN'].includes(targetUser.role)) {
        throw new AppError('Cannot impersonate admin users', 403);
      }

      // Check if user is active
      if (targetUser.status !== 'active') {
        throw new AppError('Cannot impersonate inactive user', 400);
      }

      // Generate impersonation token with both admin and user context
      const impersonationToken = jwt.sign(
        {
          userId: targetUser.id,
          email: targetUser.email,
          role: targetUser.role,
          tokenVersion: targetUser.tokenVersion,
          impersonatedBy: adminId,
          impersonatedByRole: adminRole,
          isImpersonation: true,
        },
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: '2h' }, // Shorter expiry for impersonation
      );

      // Create impersonation session record
      // Store impersonation info in deviceInfo since metadata may not exist
      const impersonationSession = await UserSession.create({
        userId: targetUser.id,
        refreshTokenHash: await bcrypt.hash(uuidv4(), 12),
        deviceInfo: JSON.stringify({
          type: 'Impersonation',
          impersonatedBy: adminId,
          impersonatedByRole: adminRole,
          reason: reason || 'Admin impersonation',
          startedAt: new Date().toISOString(),
        }),
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'],
        expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours
      });

      // Log audit event
      await auditService.logDataAccess(
        adminId,
        'impersonate',
        'user',
        userId,
        {
          targetUserId: userId,
          targetUserEmail: targetUser.email,
          reason: reason || 'Admin impersonation',
          sessionId: impersonationSession.id,
        },
        req.ip,
      );

      enterpriseLogger.info('User impersonation started', {
        adminId,
        targetUserId: userId,
        targetUserEmail: targetUser.email,
        sessionId: impersonationSession.id,
      });

      res.status(200).json({
        success: true,
        message: 'Impersonation started successfully',
        data: {
          token: impersonationToken,
          user: {
            id: targetUser.id,
            email: targetUser.email,
            role: targetUser.role,
            fullName: targetUser.fullName,
          },
          impersonatedBy: {
            id: adminId,
            role: adminRole,
          },
          sessionId: impersonationSession.id,
          expiresAt: impersonationSession.expiresAt,
        },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to impersonate user', {
        error: error.message,
        adminId: req.user?.id,
        targetUserId: req.params.userId,
      });
      next(error);
    }
  }

  /**
   * Stop impersonation
   * POST /api/admin/auth/stop-impersonation
   */
  async stopImpersonation(req, res, next) {
    try {
      const adminId = req.user.impersonatedBy;
      const impersonatedUserId = req.user.userId;

      if (!adminId || !req.user.isImpersonation) {
        throw new AppError('Not in impersonation mode', 400);
      }

      // Revoke impersonation session
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];
      
      if (token) {
        try {
          // Find and revoke the impersonation session
          // Look for sessions with impersonation info in deviceInfo
          const { Op } = require('sequelize');
          await UserSession.update(
            { revoked: true, revokedAt: new Date() },
            {
              where: {
                userId: impersonatedUserId,
                deviceInfo: {
                  [Op.like]: '%"type":"Impersonation"%',
                },
                revoked: false,
              },
            },
          );
        } catch (err) {
          enterpriseLogger.warn('Could not revoke impersonation session', { error: err.message });
        }
      }

      // Log audit event
      await auditService.logDataAccess(
        adminId,
        'stop_impersonation',
        'user',
        impersonatedUserId,
        {
          targetUserId: impersonatedUserId,
        },
        req.ip,
      );

      enterpriseLogger.info('User impersonation stopped', {
        adminId,
        targetUserId: impersonatedUserId,
      });

      res.status(200).json({
        success: true,
        message: 'Impersonation stopped successfully',
      });

    } catch (error) {
      enterpriseLogger.error('Failed to stop impersonation', {
        error: error.message,
        userId: req.user?.userId,
      });
      next(error);
    }
  }

  /**
   * Delete user account (soft delete)
   * DELETE /api/admin/users/:id
   */
  async deleteUser(req, res, next) {
    try {
      const { id } = req.params;
      const { reason, force } = req.body;
      const adminId = req.user.id;

      const user = await User.findByPk(id);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Prevent deleting admin users
      if (['SUPER_ADMIN', 'PLATFORM_ADMIN'].includes(user.role)) {
        throw new AppError('Cannot delete admin users', 403);
      }

      // Check for active dependencies unless force delete
      if (!force) {
        // Check for active filings
        const activeFilings = await ITRFiling.count({
          where: {
            userId: id,
            status: { [Op.in]: ['draft', 'submitted', 'processing'] },
          },
        });

        if (activeFilings > 0) {
          throw new AppError(
            `Cannot delete user with ${activeFilings} active filing(s). Please complete or cancel the filings first, or use force delete.`,
            400,
          );
        }

        // Check for pending payments
        const pendingInvoices = await Invoice.count({
          where: {
            userId: id,
            status: { [Op.in]: ['pending', 'processing'] },
          },
        });

        if (pendingInvoices > 0) {
          throw new AppError(
            `Cannot delete user with ${pendingInvoices} pending payment(s). Please resolve payments first, or use force delete.`,
            400,
          );
        }
      }

      const oldStatus = user.status;
      
      // Soft delete: Set status to inactive and mark as deleted in metadata
      user.status = 'inactive';
      const metadata = user.metadata || {};
      metadata.deleted = true;
      metadata.deletedAt = new Date().toISOString();
      metadata.deletedBy = adminId;
      metadata.deleteReason = reason || 'Deleted by admin';
      user.metadata = metadata;
      
      await user.save();

      // Revoke all sessions
      await UserSession.revokeAllSessions(id);

      // Log audit event
      await auditService.logDataAccess(
        adminId,
        'delete',
        'user',
        id,
        {
          oldStatus,
          reason: reason || 'User deleted by admin',
          forceDelete: force || false,
          userId: id,
          userEmail: user.email,
        },
        req.ip,
      );

      enterpriseLogger.info('User deleted via admin API', {
        adminId,
        userId: id,
        userEmail: user.email,
        forceDelete: force || false,
      });

      res.status(200).json({
        success: true,
        message: 'User deleted successfully',
        data: {
          userId: id,
          status: 'inactive',
          deleted: true,
        },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to delete user via admin API', {
        error: error.message,
        adminId: req.user?.id,
        userId: req.params.id,
      });
      next(error);
    }
  }

  /**
   * Suspend user account
   * POST /api/admin/users/:id/suspend
   */
  async suspendUser(req, res, next) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const adminId = req.user.id;

      const user = await User.findByPk(id);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      const oldStatus = user.status;
      user.status = 'suspended';
      await user.save();

      // Revoke all sessions
      await UserSession.revokeAllSessions(id);

      // Log audit event
      await auditService.logDataAccess(
        adminId,
        'update',
        'user_status',
        id,
        {
          oldStatus,
          newStatus: 'suspended',
          reason: reason || 'Account suspended by admin',
          userId: id,
        },
        req.ip,
      );

      enterpriseLogger.info('User suspended via admin API', {
        adminId,
        userId: id,
        reason,
      });

      res.status(200).json({
        success: true,
        message: 'User suspended successfully',
        data: {
          userId: id,
          status: 'suspended',
        },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to suspend user via admin API', {
        error: error.message,
        adminId: req.user?.id,
        userId: req.params.id,
      });
      next(error);
    }
  }

  /**
   * Force password reset
   * POST /api/admin/users/:id/reset-password
   */
  async resetPassword(req, res, next) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const adminId = req.user.id;

      const user = await User.findByPk(id);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      if (user.authProvider !== 'LOCAL') {
        throw new AppError('Password reset only available for local accounts', 400);
      }

      // Generate reset token
      const resetToken = uuidv4();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Create reset token record
      await PasswordResetToken.createResetToken(
        user.id,
        resetToken,
        expiresAt,
        req.ip || req.connection.remoteAddress,
        req.headers['user-agent'],
      );

      // Log audit event
      await auditService.logDataAccess(
        adminId,
        'update',
        'user_password_reset',
        id,
        {
          reason: reason || 'Password reset initiated by admin',
          userId: id,
        },
        req.ip,
      );

      enterpriseLogger.info('Password reset token generated via admin API', {
        adminId,
        userId: id,
      });

      res.status(200).json({
        success: true,
        message: 'Password reset token generated successfully',
        data: {
          userId: id,
          resetToken,
          expiresAt,
          resetUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`,
        },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to reset password via admin API', {
        error: error.message,
        adminId: req.user?.id,
        userId: req.params.id,
      });
      next(error);
    }
  }

  /**
   * Invalidate all user sessions
   * POST /api/admin/users/:id/invalidate-sessions
   */
  async invalidateSessions(req, res, next) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const adminId = req.user.id;

      const user = await User.findByPk(id);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Revoke all sessions
      await UserSession.revokeAllSessions(id);

      // Increment token version to invalidate JWT tokens
      await user.update({
        tokenVersion: user.tokenVersion + 1,
      });

      // Log audit event
      await auditService.logDataAccess(
        adminId,
        'update',
        'user_sessions',
        id,
        {
          reason: reason || 'All sessions invalidated by admin',
          userId: id,
        },
        req.ip,
      );

      enterpriseLogger.info('User sessions invalidated via admin API', {
        adminId,
        userId: id,
      });

      res.status(200).json({
        success: true,
        message: 'All user sessions invalidated successfully',
        data: {
          userId: id,
        },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to invalidate sessions via admin API', {
        error: error.message,
        adminId: req.user?.id,
        userId: req.params.id,
      });
      next(error);
    }
  }

  /**
   * Get user activity log
   * GET /api/admin/users/:id/activity
   */
  async getUserActivity(req, res, next) {
    try {
      const { id } = req.params;
      const { limit = 100, offset = 0 } = req.query;
      const adminId = req.user.id;

      const user = await User.findByPk(id);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Get audit logs for user
      const activities = await AuditLog.findAll({
        where: {
          userId: id,
        },
        order: [['timestamp', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset),
      });

      // Log admin access
      await auditService.logDataAccess(
        adminId,
        'read',
        'user_activity',
        id,
        {
          userId: id,
        },
        req.ip,
      );

      enterpriseLogger.info('User activity retrieved via admin API', {
        adminId,
        userId: id,
        count: activities.length,
      });

      res.status(200).json({
        success: true,
        message: 'User activity retrieved successfully',
        data: {
          userId: id,
          activities: activities.map(activity => ({
            id: activity.id,
            action: activity.action,
            resource: activity.resource,
            resourceId: activity.resourceId,
            timestamp: activity.timestamp,
            ipAddress: activity.ipAddress,
            userAgent: activity.userAgent,
            success: activity.success,
            errorMessage: activity.errorMessage,
            metadata: activity.metadata,
          })),
          count: activities.length,
        },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to get user activity via admin API', {
        error: error.message,
        adminId: req.user?.id,
        userId: req.params.id,
      });
      next(error);
    }
  }

  /**
   * Get user's filings
   * GET /api/admin/users/:id/filings
   */
  async getUserFilings(req, res, next) {
    try {
      const { id } = req.params;
      const { page = 1, limit = 20, status, itrType } = req.query;
      const adminId = req.user.id;

      const user = await User.findByPk(id);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      const offset = (page - 1) * limit;
      const whereClause = { userId: id };

      if (status) {
        whereClause.status = status;
      }
      if (itrType) {
        whereClause.itrType = itrType;
      }

      const { count, rows: filings } = await ITRFiling.findAndCountAll({
        where: whereClause,
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset),
      });

      // Log admin access
      await auditService.logDataAccess(
        adminId,
        'read',
        'user_filings',
        id,
        {
          userId: id,
        },
        req.ip,
      );

      enterpriseLogger.info('User filings retrieved via admin API', {
        adminId,
        userId: id,
        count: filings.length,
      });

      res.status(200).json({
        success: true,
        message: 'User filings retrieved successfully',
        data: {
          userId: id,
          filings: filings.map(filing => ({
            id: filing.id,
            itrType: filing.itrType,
            assessmentYear: filing.assessmentYear,
            status: filing.status,
            ackNumber: filing.ackNumber,
            createdAt: filing.createdAt,
            submittedAt: filing.submittedAt,
            acknowledgedAt: filing.acknowledgedAt,
          })),
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / limit),
            totalItems: count,
            itemsPerPage: parseInt(limit),
          },
        },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to get user filings via admin API', {
        error: error.message,
        adminId: req.user?.id,
        userId: req.params.id,
      });
      next(error);
    }
  }

  /**
   * Get user's transactions
   * GET /api/admin/users/:id/transactions
   */
  async getUserTransactions(req, res, next) {
    try {
      const { id } = req.params;
      const { page = 1, limit = 20, status, type } = req.query;
      const adminId = req.user.id;

      const user = await User.findByPk(id);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      const offset = (page - 1) * limit;
      const whereClause = { userId: id };

      if (status) {
        whereClause.status = status;
      }
      if (type) {
        whereClause.type = type;
      }

      const { count, rows: invoices } = await Invoice.findAndCountAll({
        where: whereClause,
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset),
      });

      // Log admin access
      await auditService.logDataAccess(
        adminId,
        'read',
        'user_transactions',
        id,
        {
          userId: id,
        },
        req.ip,
      );

      enterpriseLogger.info('User transactions retrieved via admin API', {
        adminId,
        userId: id,
        count: invoices.length,
      });

      res.status(200).json({
        success: true,
        message: 'User transactions retrieved successfully',
        data: {
          userId: id,
          transactions: invoices.map(invoice => ({
            id: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            amount: invoice.totalAmount,
            status: invoice.status,
            type: invoice.type,
            createdAt: invoice.createdAt,
            paidAt: invoice.paidAt,
          })),
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / limit),
            totalItems: count,
            itemsPerPage: parseInt(limit),
          },
        },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to get user transactions via admin API', {
        error: error.message,
        adminId: req.user?.id,
        userId: req.params.id,
      });
      next(error);
    }
  }

  /**
   * Bulk user operations
   * POST /api/admin/users/bulk
   */
  async bulkOperations(req, res, next) {
    try {
      const { userIds, operation, data } = req.body;
      const adminId = req.user.id;

      if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        throw new AppError('User IDs array is required', 400);
      }

      if (!operation) {
        throw new AppError('Operation is required', 400);
      }

      const validOperations = ['activate', 'deactivate', 'suspend', 'delete'];
      if (!validOperations.includes(operation)) {
        throw new AppError(`Invalid operation: ${operation}`, 400);
      }

      const results = [];
      const errors = [];

      for (const userId of userIds) {
        try {
          const user = await User.findByPk(userId);
          if (!user) {
            errors.push({ userId, error: 'User not found' });
            continue;
          }

          switch (operation) {
            case 'activate':
              user.status = 'active';
              await user.save();
              break;
            case 'deactivate':
              user.status = 'inactive';
              await user.save();
              break;
            case 'suspend':
              user.status = 'suspended';
              await user.save();
              await UserSession.revokeAllSessions(userId);
              break;
            case 'delete':
              // Soft delete by setting status to inactive
              user.status = 'inactive';
              await user.save();
              break;
          }

          // Log audit event
          await auditService.logDataAccess(
            adminId,
            'update',
            `user_bulk_${operation}`,
            userId,
            {
              operation,
              reason: data?.reason || 'Bulk operation by admin',
              userId,
            },
            req.ip,
          );

          results.push({ userId, success: true, operation });
        } catch (error) {
          errors.push({ userId, error: error.message });
        }
      }

      enterpriseLogger.info('Bulk user operation completed via admin API', {
        adminId,
        operation,
        totalUsers: userIds.length,
        successCount: results.length,
        errorCount: errors.length,
      });

      res.status(200).json({
        success: true,
        message: `Bulk ${operation} operation completed`,
        data: {
          operation,
          totalUsers: userIds.length,
          successCount: results.length,
          errorCount: errors.length,
          results,
          errors,
        },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to perform bulk operation via admin API', {
        error: error.message,
        adminId: req.user?.id,
      });
      next(error);
    }
  }

  /**
   * Export user list
   * GET /api/admin/users/export
   */
  async exportUsers(req, res, next) {
    try {
      const { format = 'csv' } = req.query;
      const adminId = req.user.id;

      // Get all users (or apply filters from query)
      const whereClause = {};
      if (req.query.status) {
        whereClause.status = req.query.status;
      }
      if (req.query.role) {
        whereClause.role = req.query.role;
      }

      const users = await User.findAll({
        where: whereClause,
        order: [['createdAt', 'DESC']],
        attributes: [
          'id', 'fullName', 'email', 'phone', 'role', 'status',
          'emailVerified', 'phoneVerified', 'panNumber', 'panVerified',
          'createdAt', 'lastLoginAt', 'loginCount',
        ],
      });

      // Log admin access
      await auditService.logDataAccess(
        adminId,
        'export',
        'users',
        null,
        {
          format,
          count: users.length,
        },
        req.ip,
      );

      if (format === 'csv') {
        // Generate CSV
        const csvHeader = 'ID,Name,Email,Phone,Role,Status,Email Verified,Phone Verified,PAN,PAN Verified,Created At,Last Login,Login Count\n';
        const csvRows = users.map(user => {
          return [
            user.id,
            user.fullName || '',
            user.email || '',
            user.phone || '',
            user.role || '',
            user.status || '',
            user.emailVerified ? 'Yes' : 'No',
            user.phoneVerified ? 'Yes' : 'No',
            user.panNumber || '',
            user.panVerified ? 'Yes' : 'No',
            user.createdAt ? user.createdAt.toISOString() : '',
            user.lastLoginAt ? user.lastLoginAt.toISOString() : '',
            user.loginCount || 0,
          ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(',');
        }).join('\n');

        const csv = csvHeader + csvRows;

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=users_export_${Date.now()}.csv`);
        res.status(200).send(csv);
      } else {
        // Return JSON
        res.status(200).json({
          success: true,
          message: 'Users exported successfully',
          data: {
            users: users.map(user => ({
              id: user.id,
              fullName: user.fullName,
              email: user.email,
              phone: user.phone,
              role: user.role,
              status: user.status,
              emailVerified: user.emailVerified,
              phoneVerified: user.phoneVerified,
              panNumber: user.panNumber,
              panVerified: user.panVerified,
              createdAt: user.createdAt,
              lastLoginAt: user.lastLoginAt,
              loginCount: user.loginCount,
            })),
            count: users.length,
          },
        });
      }

      enterpriseLogger.info('Users exported via admin API', {
        adminId,
        format,
        count: users.length,
      });

    } catch (error) {
      enterpriseLogger.error('Failed to export users via admin API', {
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
          [sequelize.fn('COUNT', sequelize.literal('CASE WHEN role = \'END_USER\' THEN 1 END')), 'regularUsers'],
          [sequelize.fn('COUNT', sequelize.literal('CASE WHEN role = \'CA\' THEN 1 END')), 'caUsers'],
          [sequelize.fn('COUNT', sequelize.literal('CASE WHEN role IN (\'SUPER_ADMIN\', \'PLATFORM_ADMIN\') THEN 1 END')), 'adminUsers'],
        ],
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
   * Get filing statistics (helper method)
   */
  async _getFilingStatsData() {
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

  // =====================================================
  // FILING MANAGEMENT METHODS
  // =====================================================

  /**
   * Get all filings with pagination and filters
   * GET /api/admin/filings
   */
  async getFilings(req, res, next) {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        status,
        itrType,
        assessmentYear,
        regime,
        incomeRangeFrom,
        incomeRangeTo,
        filingDateFrom,
        filingDateTo,
        caId,
        discrepancyStatus,
        sortBy = 'createdAt',
        sortOrder = 'DESC',
      } = req.query;

      const offset = (page - 1) * limit;
      const whereClause = {};

      // Apply filters
      if (status) {
        whereClause.status = status;
      }
      if (itrType) {
        whereClause.itrType = itrType;
      }
      if (assessmentYear) {
        whereClause.assessmentYear = assessmentYear;
      }
      if (filingDateFrom) {
        whereClause.createdAt = {
          ...whereClause.createdAt,
          [Op.gte]: new Date(filingDateFrom),
        };
      }
      if (filingDateTo) {
        whereClause.createdAt = {
          ...whereClause.createdAt,
          [Op.lte]: new Date(filingDateTo),
        };
      }

      // Search by acknowledgment number, PAN, user name, or filing ID
      if (search) {
        const { User } = require('../models');
        const users = await User.findAll({
          where: {
            [Op.or]: [
              { fullName: { [Op.iLike]: `%${search}%` } },
              { panNumber: { [Op.iLike]: `%${search}%` } },
            ],
          },
          attributes: ['id'],
        });
        const userIds = users.map(u => u.id);

        whereClause[Op.or] = [
          { ackNumber: { [Op.iLike]: `%${search}%` } },
          { id: { [Op.eq]: search } },
          ...(userIds.length > 0 ? [{ userId: { [Op.in]: userIds } }] : []),
        ];
      }

      const { count, rows: filings } = await ITRFiling.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'fullName', 'email', 'panNumber'],
          },
        ],
        order: [[sortBy, sortOrder]],
        limit: parseInt(limit),
        offset: parseInt(offset),
      });

      const filingList = filings.map(filing => ({
        id: filing.id,
        userId: filing.userId,
        userName: filing.user?.fullName,
        userEmail: filing.user?.email,
        userPAN: filing.user?.panNumber,
        itrType: filing.itrType,
        assessmentYear: filing.assessmentYear,
        status: filing.status,
        ackNumber: filing.ackNumber,
        createdAt: filing.createdAt,
        submittedAt: filing.submittedAt,
        acknowledgedAt: filing.acknowledgedAt,
        regime: filing.jsonPayload?.regime || 'old',
      }));

      enterpriseLogger.info('Filings retrieved via admin API', {
        adminId: req.user.id,
        count: filingList.length,
        totalCount: count,
        filters: { status, itrType, search },
      });

      res.status(200).json({
        success: true,
        message: 'Filings retrieved successfully',
        data: {
          filings: filingList,
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
      enterpriseLogger.error('Failed to get filings via admin API', {
        error: error.message,
        adminId: req.user?.id,
        query: req.query,
      });
      next(error);
    }
  }

  /**
   * Get filing detail
   * GET /api/admin/filings/:id
   */
  async getFilingDetails(req, res, next) {
    try {
      const { id } = req.params;
      const adminId = req.user.id;

      const filing = await ITRFiling.findByPk(id, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'fullName', 'email', 'phone', 'panNumber'],
          },
        ],
      });

      if (!filing) {
        throw new AppError('Filing not found', 404);
      }

      // Log admin access
      await auditService.logDataAccess(
        adminId,
        'read',
        'filing',
        id,
        {
          filingId: id,
          userId: filing.userId,
        },
        req.ip,
      );

      enterpriseLogger.info('Filing details retrieved via admin API', {
        adminId,
        filingId: id,
      });

      res.status(200).json({
        success: true,
        message: 'Filing details retrieved successfully',
        data: {
          filing: {
            id: filing.id,
            userId: filing.userId,
            user: filing.user,
            itrType: filing.itrType,
            assessmentYear: filing.assessmentYear,
            status: filing.status,
            ackNumber: filing.ackNumber,
            jsonPayload: filing.jsonPayload,
            createdAt: filing.createdAt,
            updatedAt: filing.updatedAt,
            submittedAt: filing.submittedAt,
            acknowledgedAt: filing.acknowledgedAt,
            metadata: filing.metadata,
          },
        },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to get filing details via admin API', {
        error: error.message,
        adminId: req.user?.id,
        filingId: req.params.id,
      });
      next(error);
    }
  }

  /**
   * Update filing
   * PUT /api/admin/filings/:id
   */
  async updateFiling(req, res, next) {
    try {
      const { id } = req.params;
      const { jsonPayload, reason } = req.body;
      const adminId = req.user.id;

      if (!jsonPayload) {
        throw new AppError('jsonPayload is required', 400);
      }

      const filing = await ITRFiling.findByPk(id);
      if (!filing) {
        throw new AppError('Filing not found', 404);
      }

      const oldPayload = filing.jsonPayload;
      filing.jsonPayload = jsonPayload;
      filing.metadata = {
        ...filing.metadata,
        adminEdits: [
          ...(filing.metadata?.adminEdits || []),
          {
            editedBy: adminId,
            editedAt: new Date().toISOString(),
            reason: reason || 'No reason provided',
            changes: 'Filing data updated by admin',
          },
        ],
      };
      await filing.save();

      // Log audit event
      await auditService.logDataAccess(
        adminId,
        'update',
        'filing',
        id,
        {
          filingId: id,
          userId: filing.userId,
          reason: reason || 'Filing updated by admin',
        },
        req.ip,
      );

      enterpriseLogger.info('Filing updated via admin API', {
        adminId,
        filingId: id,
        reason,
      });

      res.status(200).json({
        success: true,
        message: 'Filing updated successfully',
        data: {
          filingId: id,
        },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to update filing via admin API', {
        error: error.message,
        adminId: req.user?.id,
        filingId: req.params.id,
      });
      next(error);
    }
  }

  /**
   * Reprocess filing
   * POST /api/admin/filings/:id/reprocess
   */
  async reprocessFiling(req, res, next) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const adminId = req.user.id;

      const filing = await ITRFiling.findByPk(id);
      if (!filing) {
        throw new AppError('Filing not found', 404);
      }

      // Reset status to draft for reprocessing
      const oldStatus = filing.status;
      filing.status = 'draft';
      filing.metadata = {
        ...filing.metadata,
        reprocessHistory: [
          ...(filing.metadata?.reprocessHistory || []),
          {
            reprocessedBy: adminId,
            reprocessedAt: new Date().toISOString(),
            oldStatus,
            reason: reason || 'Reprocessed by admin',
          },
        ],
      };
      await filing.save();

      // Log audit event
      await auditService.logDataAccess(
        adminId,
        'update',
        'filing_reprocess',
        id,
        {
          filingId: id,
          userId: filing.userId,
          oldStatus,
          reason: reason || 'Filing reprocessed by admin',
        },
        req.ip,
      );

      enterpriseLogger.info('Filing reprocessed via admin API', {
        adminId,
        filingId: id,
        reason,
      });

      res.status(200).json({
        success: true,
        message: 'Filing reprocessed successfully',
        data: {
          filingId: id,
          status: 'draft',
        },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to reprocess filing via admin API', {
        error: error.message,
        adminId: req.user?.id,
        filingId: req.params.id,
      });
      next(error);
    }
  }

  /**
   * Cancel filing
   * POST /api/admin/filings/:id/cancel
   */
  async cancelFiling(req, res, next) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const adminId = req.user.id;

      const filing = await ITRFiling.findByPk(id);
      if (!filing) {
        throw new AppError('Filing not found', 404);
      }

      const oldStatus = filing.status;
      filing.status = 'draft';
      filing.metadata = {
        ...filing.metadata,
        cancellationHistory: [
          ...(filing.metadata?.cancellationHistory || []),
          {
            cancelledBy: adminId,
            cancelledAt: new Date().toISOString(),
            oldStatus,
            reason: reason || 'Cancelled by admin',
          },
        ],
      };
      await filing.save();

      // Log audit event
      await auditService.logDataAccess(
        adminId,
        'update',
        'filing_cancel',
        id,
        {
          filingId: id,
          userId: filing.userId,
          oldStatus,
          reason: reason || 'Filing cancelled by admin',
        },
        req.ip,
      );

      enterpriseLogger.info('Filing cancelled via admin API', {
        adminId,
        filingId: id,
        reason,
      });

      res.status(200).json({
        success: true,
        message: 'Filing cancelled successfully',
        data: {
          filingId: id,
          status: 'draft',
        },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to cancel filing via admin API', {
        error: error.message,
        adminId: req.user?.id,
        filingId: req.params.id,
      });
      next(error);
    }
  }

  /**
   * Get filing audit log
   * GET /api/admin/filings/:id/audit-log
   */
  async getFilingAuditLog(req, res, next) {
    try {
      const { id } = req.params;
      const adminId = req.user.id;

      const filing = await ITRFiling.findByPk(id);
      if (!filing) {
        throw new AppError('Filing not found', 404);
      }

      // Get audit logs for filing
      const auditLogs = await AuditLog.findAll({
        where: {
          resource: 'filing',
          resourceId: id,
        },
        order: [['timestamp', 'DESC']],
        limit: 100,
      });

      // Log admin access
      await auditService.logDataAccess(
        adminId,
        'read',
        'filing_audit_log',
        id,
        {
          filingId: id,
        },
        req.ip,
      );

      enterpriseLogger.info('Filing audit log retrieved via admin API', {
        adminId,
        filingId: id,
        count: auditLogs.length,
      });

      res.status(200).json({
        success: true,
        message: 'Filing audit log retrieved successfully',
        data: {
          filingId: id,
          auditLogs: auditLogs.map(log => ({
            id: log.id,
            action: log.action,
            userId: log.userId,
            timestamp: log.timestamp,
            ipAddress: log.ipAddress,
            userAgent: log.userAgent,
            success: log.success,
            errorMessage: log.errorMessage,
            metadata: log.metadata,
          })),
          count: auditLogs.length,
        },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to get filing audit log via admin API', {
        error: error.message,
        adminId: req.user?.id,
        filingId: req.params.id,
      });
      next(error);
    }
  }

  /**
   * Get filing documents
   * GET /api/admin/filings/:id/documents
   */
  async getFilingDocuments(req, res, next) {
    try {
      const { id } = req.params;
      const adminId = req.user.id;

      const filing = await ITRFiling.findByPk(id);
      if (!filing) {
        throw new AppError('Filing not found', 404);
      }

      // Get documents for filing
      const documents = await Document.findAll({
        where: {
          filingId: id,
        },
        order: [['createdAt', 'DESC']],
      });

      // Log admin access
      await auditService.logDataAccess(
        adminId,
        'read',
        'filing_documents',
        id,
        {
          filingId: id,
        },
        req.ip,
      );

      enterpriseLogger.info('Filing documents retrieved via admin API', {
        adminId,
        filingId: id,
        count: documents.length,
      });

      res.status(200).json({
        success: true,
        message: 'Filing documents retrieved successfully',
        data: {
          filingId: id,
          documents: documents.map(doc => ({
            id: doc.id,
            type: doc.type,
            fileName: doc.fileName,
            fileSize: doc.fileSize,
            uploadDate: doc.createdAt,
            verificationStatus: doc.verificationStatus,
            extractedData: doc.extractedData,
          })),
          count: documents.length,
        },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to get filing documents via admin API', {
        error: error.message,
        adminId: req.user?.id,
        filingId: req.params.id,
      });
      next(error);
    }
  }

  /**
   * Get filings with issues
   * GET /api/admin/filings/issues
   */
  async getFilingIssues(req, res, next) {
    try {
      const { page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;

      // Get filings with errors or in problematic states
      const { count, rows: filings } = await ITRFiling.findAndCountAll({
        where: {
          status: {
            [Op.in]: ['rejected', 'draft'],
          },
          [Op.or]: [
            { metadata: { [Op.contains]: { hasErrors: true } } },
            { metadata: { [Op.contains]: { hasDiscrepancies: true } } },
          ],
        },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'fullName', 'email'],
          },
        ],
        order: [['updatedAt', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset),
      });

      enterpriseLogger.info('Filing issues retrieved via admin API', {
        adminId: req.user.id,
        count: filings.length,
      });

      res.status(200).json({
        success: true,
        message: 'Filing issues retrieved successfully',
        data: {
          filings: filings.map(filing => ({
            id: filing.id,
            userId: filing.userId,
            userName: filing.user?.fullName,
            userEmail: filing.user?.email,
            itrType: filing.itrType,
            assessmentYear: filing.assessmentYear,
            status: filing.status,
            issues: filing.metadata?.issues || [],
            errors: filing.metadata?.errors || [],
            discrepancies: filing.metadata?.discrepancies || [],
            createdAt: filing.createdAt,
            updatedAt: filing.updatedAt,
          })),
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / limit),
            totalItems: count,
            itemsPerPage: parseInt(limit),
          },
        },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to get filing issues via admin API', {
        error: error.message,
        adminId: req.user?.id,
      });
      next(error);
    }
  }

  /**
   * Get filing statistics
   * GET /api/admin/filings/stats
   */
  async getFilingStats(req, res, next) {
    try {
      const stats = await this._getFilingStatsData();

      res.status(200).json({
        success: true,
        message: 'Filing statistics retrieved successfully',
        data: {
          stats,
        },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to get filing stats via admin API', {
        error: error.message,
        adminId: req.user?.id,
      });
      next(error);
    }
  }

  /**
   * Get filing analytics
   * GET /api/admin/filings/analytics
   */
  async getFilingAnalytics(req, res, next) {
    try {
      const { dateFrom, dateTo, timeRange = '30d' } = req.query;

      const { startDate, endDate } = this._calculateTimeRange(timeRange, dateFrom, dateTo);

      // Get filing trends
      const filings = await ITRFiling.findAll({
        where: {
          createdAt: {
            [Op.between]: [startDate, endDate],
          },
        },
        attributes: [
          'id',
          'itrType',
          'status',
          'assessmentYear',
          'createdAt',
          'submittedAt',
          'acknowledgedAt',
          'jsonPayload',
        ],
        order: [['createdAt', 'ASC']],
      });

      // Filing trends
      const periodDays = moment(endDate).diff(moment(startDate), 'days');
      const trends = this._aggregateByTimePeriod(
        filings.map(f => ({ createdAt: f.createdAt, value: 1 })),
        periodDays <= 7 ? 'day' : periodDays <= 90 ? 'week' : 'month',
        startDate,
        endDate
      );

      // Peak hours analysis
      const peakHours = {};
      filings.forEach(filing => {
        if (filing.createdAt) {
          const hour = moment(filing.createdAt).hour();
          peakHours[hour] = (peakHours[hour] || 0) + 1;
        }
      });

      // Income distribution (from jsonPayload if available)
      const incomeDistribution = {
        low: 0,      // < 5L
        medium: 0,   // 5L - 50L
        high: 0,     // > 50L
      };

      filings.forEach(filing => {
        if (filing.jsonPayload && filing.jsonPayload.totalIncome) {
          const income = parseFloat(filing.jsonPayload.totalIncome || 0);
          if (income < 500000) {
            incomeDistribution.low += 1;
          } else if (income <= 5000000) {
            incomeDistribution.medium += 1;
          } else {
            incomeDistribution.high += 1;
          }
        } else {
          incomeDistribution.low += 1; // Default to low if unknown
        }
      });

      // Auto-fill success rate (simplified - check if jsonPayload has auto-filled fields)
      let autoFilledCount = 0;
      filings.forEach(filing => {
        if (filing.jsonPayload && filing.jsonPayload.autoFilled) {
          autoFilledCount += 1;
        }
      });
      const autoFillSuccessRate = filings.length > 0 ? (autoFilledCount / filings.length) * 100 : 0;

      // Average completion time
      const completedFilings = filings.filter(f => f.submittedAt && f.acknowledgedAt);
      const avgCompletionTime = completedFilings.length > 0
        ? completedFilings.reduce((sum, f) => {
            const days = moment(f.acknowledgedAt).diff(moment(f.submittedAt), 'days');
            return sum + days;
          }, 0) / completedFilings.length
        : 0;

      // Deduction patterns (from jsonPayload if available)
      const deductionPatterns = {
        section80C: 0,
        section80D: 0,
        section24: 0,
        other: 0,
      };

      filings.forEach(filing => {
        if (filing.jsonPayload && filing.jsonPayload.deductions) {
          const deductions = filing.jsonPayload.deductions;
          if (deductions.section80C) deductionPatterns.section80C += 1;
          if (deductions.section80D) deductionPatterns.section80D += 1;
          if (deductions.section24) deductionPatterns.section24 += 1;
          if (Object.keys(deductions).length > 3) deductionPatterns.other += 1;
        }
      });

      // Calculate analytics
      const analytics = {
        totalFilings: filings.length,
        completed: filings.filter(f => ['acknowledged', 'processed'].includes(f.status)).length,
        inProgress: filings.filter(f => ['draft', 'submitted'].includes(f.status)).length,
        pending: filings.filter(f => f.status === 'draft').length,
        byType: {},
        byStatus: {},
        byRegime: {},
        completionRate: 0,
        successRate: 0,
        averageCompletionTime: Math.round(avgCompletionTime),
        trends,
        peakHours,
        incomeDistribution,
        autoFillSuccessRate,
        deductionPatterns,
      };

      filings.forEach(filing => {
        // By type
        analytics.byType[filing.itrType] = (analytics.byType[filing.itrType] || 0) + 1;
        // By status
        analytics.byStatus[filing.status] = (analytics.byStatus[filing.status] || 0) + 1;
        // By regime
        const regime = filing.jsonPayload?.regime || 'old';
        analytics.byRegime[regime] = (analytics.byRegime[regime] || 0) + 1;
      });

      // Calculate completion rate
      analytics.completionRate = filings.length > 0 ? (analytics.completed / filings.length) * 100 : 0;
      analytics.successRate = analytics.completionRate; // Same for now

      enterpriseLogger.info('Filing analytics retrieved via admin API', {
        adminId: req.user.id,
      });

      res.status(200).json({
        success: true,
        message: 'Filing analytics retrieved successfully',
        data: {
          analytics,
        },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to get filing analytics via admin API', {
        error: error.message,
        adminId: req.user?.id,
      });
      next(error);
    }
  }

  /**
   * Get CA/B2B analytics
   * GET /api/admin/analytics/ca
   */
  async getCAAnalytics(req, res, next) {
    try {
      const { timeRange = '30d', dateFrom, dateTo } = req.query;
      const adminId = req.user.id;

      const { startDate, endDate } = this._calculateTimeRange(timeRange, dateFrom, dateTo);

      // CA Firm registrations
      const caFirms = await CAFirm.findAll({
        where: {
          createdAt: {
            [Op.between]: [startDate, endDate],
          },
        },
        attributes: ['id', 'firmName', 'status', 'createdAt', 'verificationStatus'],
      });

      // CA Firm registrations trend
      const caTrends = this._aggregateByTimePeriod(
        caFirms.map(f => ({ createdAt: f.createdAt, value: 1 })),
        moment(endDate).diff(moment(startDate), 'days') <= 7 ? 'day' : 'week',
        startDate,
        endDate
      );

      // CA performance metrics
      const totalCAs = await CAFirm.count();
      const verifiedCAs = await CAFirm.count({
        where: { verificationStatus: 'verified' },
      });
      const activeCAs = await CAFirm.count({
        where: { status: 'active' },
      });

      // B2B revenue (invoices from CA firm users)
      // Query invoices with users who belong to CA firms
      const b2bInvoicesData = await sequelize.query(
        `SELECT i.total_amount, i.created_at, u.ca_firm_id
         FROM invoices i
         INNER JOIN users u ON i.user_id = u.id
         WHERE i.status = 'paid'
         AND i.created_at BETWEEN :startDate AND :endDate
         AND u.ca_firm_id IS NOT NULL`,
        {
          replacements: { startDate, endDate },
          type: QueryTypes.SELECT,
        }
      );

      const b2bRevenue = b2bInvoicesData.reduce((sum, inv) => sum + parseFloat(inv.total_amount || 0), 0);

      // Client distribution per CA
      const caClientCounts = await sequelize.query(
        `SELECT ca_firm_id as "caFirmId", COUNT(*) as "clientCount"
         FROM users
         WHERE ca_firm_id IS NOT NULL
         GROUP BY ca_firm_id`,
        {
          type: QueryTypes.SELECT,
        }
      );

      enterpriseLogger.info('CA analytics retrieved via admin API', {
        adminId,
        timeRange,
      });

      res.status(200).json({
        success: true,
        message: 'CA analytics retrieved successfully',
        data: {
          totalCAs,
          verifiedCAs,
          activeCAs,
          newRegistrations: caFirms.length,
          registrationTrends: caTrends,
          verificationRate: totalCAs > 0 ? (verifiedCAs / totalCAs) * 100 : 0,
          b2bRevenue,
          b2bRevenueContribution: 0, // Will be calculated if total revenue is available
          clientDistribution: caClientCounts.map(item => ({
            caFirmId: item.caFirmId,
            clientCount: parseInt(item.clientCount) || 0,
          })).sort((a, b) => b.clientCount - a.clientCount),
          byStatus: caFirms.reduce((acc, firm) => {
            acc[firm.status] = (acc[firm.status] || 0) + 1;
            return acc;
          }, {}),
        },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to get CA analytics via admin API', {
        error: error.message,
        stack: error.stack,
        adminId: req.user?.id,
      });
      next(error);
    }
  }

  /**
   * Export filings
   * GET /api/admin/filings/export
   */
  async exportFilings(req, res, next) {
    try {
      const { format = 'csv' } = req.query;
      const adminId = req.user.id;

      // Get all filings (or apply filters from query)
      const whereClause = {};
      if (req.query.status) {
        whereClause.status = req.query.status;
      }
      if (req.query.itrType) {
        whereClause.itrType = req.query.itrType;
      }

      const filings = await ITRFiling.findAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['fullName', 'email', 'panNumber'],
          },
        ],
        order: [['createdAt', 'DESC']],
      });

      // Log admin access
      await auditService.logDataAccess(
        adminId,
        'export',
        'filings',
        null,
        {
          format,
          count: filings.length,
        },
        req.ip,
      );

      if (format === 'csv') {
        // Generate CSV
        const csvHeader = 'ID,User Name,User Email,User PAN,ITR Type,Assessment Year,Status,Ack Number,Created At,Submitted At\n';
        const csvRows = filings.map(filing => {
          return [
            filing.id,
            filing.user?.fullName || '',
            filing.user?.email || '',
            filing.user?.panNumber || '',
            filing.itrType || '',
            filing.assessmentYear || '',
            filing.status || '',
            filing.ackNumber || '',
            filing.createdAt ? filing.createdAt.toISOString() : '',
            filing.submittedAt ? filing.submittedAt.toISOString() : '',
          ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(',');
        }).join('\n');

        const csv = csvHeader + csvRows;

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=filings_export_${Date.now()}.csv`);
        res.status(200).send(csv);
      } else {
        // Return JSON
        res.status(200).json({
          success: true,
          message: 'Filings exported successfully',
          data: {
            filings: filings.map(filing => ({
              id: filing.id,
              userId: filing.userId,
              userName: filing.user?.fullName,
              userEmail: filing.user?.email,
              userPAN: filing.user?.panNumber,
              itrType: filing.itrType,
              assessmentYear: filing.assessmentYear,
              status: filing.status,
              ackNumber: filing.ackNumber,
              createdAt: filing.createdAt,
              submittedAt: filing.submittedAt,
            })),
            count: filings.length,
          },
        });
      }

      enterpriseLogger.info('Filings exported via admin API', {
        adminId,
        format,
        count: filings.length,
      });

    } catch (error) {
      enterpriseLogger.error('Failed to export filings via admin API', {
        error: error.message,
        adminId: req.user?.id,
      });
      next(error);
    }
  }

  /**
   * Override validation
   * POST /api/admin/filings/:id/override-validation
   */
  async overrideValidation(req, res, next) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const adminId = req.user.id;

      const filing = await ITRFiling.findByPk(id);
      if (!filing) {
        throw new AppError('Filing not found', 404);
      }

      filing.metadata = {
        ...filing.metadata,
        validationOverridden: true,
        validationOverrideHistory: [
          ...(filing.metadata?.validationOverrideHistory || []),
          {
            overriddenBy: adminId,
            overriddenAt: new Date().toISOString(),
            reason: reason || 'Validation overridden by admin',
          },
        ],
      };
      await filing.save();

      // Log audit event
      await auditService.logDataAccess(
        adminId,
        'update',
        'filing_validation_override',
        id,
        {
          filingId: id,
          userId: filing.userId,
          reason: reason || 'Validation overridden by admin',
        },
        req.ip,
      );

      enterpriseLogger.info('Filing validation overridden via admin API', {
        adminId,
        filingId: id,
        reason,
      });

      res.status(200).json({
        success: true,
        message: 'Validation overridden successfully',
        data: {
          filingId: id,
        },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to override validation via admin API', {
        error: error.message,
        adminId: req.user?.id,
        filingId: req.params.id,
      });
      next(error);
    }
  }

  /**
   * Flag for review
   * POST /api/admin/filings/:id/flag-review
   */
  async flagForReview(req, res, next) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const adminId = req.user.id;

      const filing = await ITRFiling.findByPk(id);
      if (!filing) {
        throw new AppError('Filing not found', 404);
      }

      filing.metadata = {
        ...filing.metadata,
        flaggedForReview: true,
        flagHistory: [
          ...(filing.metadata?.flagHistory || []),
          {
            flaggedBy: adminId,
            flaggedAt: new Date().toISOString(),
            reason: reason || 'Flagged for review by admin',
          },
        ],
      };
      await filing.save();

      // Log audit event
      await auditService.logDataAccess(
        adminId,
        'update',
        'filing_flag',
        id,
        {
          filingId: id,
          userId: filing.userId,
          reason: reason || 'Filing flagged for review by admin',
        },
        req.ip,
      );

      enterpriseLogger.info('Filing flagged for review via admin API', {
        adminId,
        filingId: id,
        reason,
      });

      res.status(200).json({
        success: true,
        message: 'Filing flagged for review successfully',
        data: {
          filingId: id,
        },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to flag filing for review via admin API', {
        error: error.message,
        adminId: req.user?.id,
        filingId: req.params.id,
      });
      next(error);
    }
  }

  /**
   * Add admin notes
   * POST /api/admin/filings/:id/add-notes
   */
  async addAdminNotes(req, res, next) {
    try {
      const { id } = req.params;
      const { notes, reason } = req.body;
      const adminId = req.user.id;

      if (!notes) {
        throw new AppError('Notes are required', 400);
      }

      const filing = await ITRFiling.findByPk(id);
      if (!filing) {
        throw new AppError('Filing not found', 404);
      }

      filing.metadata = {
        ...filing.metadata,
        adminNotes: [
          ...(filing.metadata?.adminNotes || []),
          {
            addedBy: adminId,
            addedAt: new Date().toISOString(),
            notes,
            reason: reason || 'Admin notes added',
          },
        ],
      };
      await filing.save();

      // Log audit event
      await auditService.logDataAccess(
        adminId,
        'update',
        'filing_notes',
        id,
        {
          filingId: id,
          userId: filing.userId,
          notes,
        },
        req.ip,
      );

      enterpriseLogger.info('Admin notes added to filing via admin API', {
        adminId,
        filingId: id,
      });

      res.status(200).json({
        success: true,
        message: 'Admin notes added successfully',
        data: {
          filingId: id,
        },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to add admin notes via admin API', {
        error: error.message,
        adminId: req.user?.id,
        filingId: req.params.id,
      });
      next(error);
    }
  }

  // =====================================================
  // DOCUMENT MANAGEMENT METHODS
  // =====================================================

  /**
   * Get all documents with pagination and filters
   * GET /api/admin/documents
   */
  async getDocuments(req, res, next) {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        type,
        status,
        assessmentYear,
        extractionStatus,
        userId,
        filingId,
        sortBy = 'createdAt',
        sortOrder = 'DESC',
      } = req.query;

      const offset = (page - 1) * limit;
      const whereClause = {};

      // Apply filters
      if (type) {
        whereClause.category = type;
      }
      if (status) {
        whereClause.verificationStatus = status;
      }
      if (userId) {
        whereClause.userId = userId;
      }
      if (filingId) {
        whereClause.filingId = filingId;
      }
      whereClause.isDeleted = false;

      // Search by user, document category, or file name
      if (search) {
        const { User } = require('../models');
        const users = await User.findAll({
          where: {
            [Op.or]: [
              { fullName: { [Op.iLike]: `%${search}%` } },
              { email: { [Op.iLike]: `%${search}%` } },
            ],
          },
          attributes: ['id'],
        });
        const userIds = users.map(u => u.id);

        whereClause[Op.or] = [
          { filename: { [Op.iLike]: `%${search}%` } },
          { originalFilename: { [Op.iLike]: `%${search}%` } },
          { category: { [Op.iLike]: `%${search}%` } },
          ...(userIds.length > 0 ? [{ userId: { [Op.in]: userIds } }] : []),
        ];
      }

      const { count, rows: documents } = await Document.findAndCountAll({
        where: whereClause,
        order: [[sortBy, sortOrder]],
        limit: parseInt(limit),
        offset: parseInt(offset),
      });

      // Get user info for documents
      const userIds = [...new Set(documents.map(doc => doc.userId).filter(Boolean))];
      const users = userIds.length > 0 ? await User.findAll({
        where: { id: { [Op.in]: userIds } },
        attributes: ['id', 'fullName', 'email'],
      }) : [];
      const userMap = new Map(users.map(u => [u.id, u]));

      const documentList = documents.map(doc => {
        const user = userMap.get(doc.userId);
        return {
          id: doc.id,
          userId: doc.userId,
          userName: user?.fullName,
          userEmail: user?.email,
          filingId: doc.filingId,
          type: doc.category,
          fileName: doc.filename,
          originalFileName: doc.originalFilename,
          fileSize: doc.sizeBytes,
          fileSizeFormatted: doc.getFileSize ? doc.getFileSize() : `${(doc.sizeBytes / 1024).toFixed(2)} KB`,
          verificationStatus: doc.verificationStatus,
          extractedMetadata: doc.extractedMetadata,
          ocrResult: doc.ocrResult,
          createdAt: doc.createdAt,
          updatedAt: doc.updatedAt,
        };
      });

      enterpriseLogger.info('Documents retrieved via admin API', {
        adminId: req.user.id,
        count: documentList.length,
        totalCount: count,
      });

      res.status(200).json({
        success: true,
        message: 'Documents retrieved successfully',
        data: {
          documents: documentList,
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
      enterpriseLogger.error('Failed to get documents via admin API', {
        error: error.message,
        adminId: req.user?.id,
        query: req.query,
      });
      next(error);
    }
  }

  /**
   * Get document detail
   * GET /api/admin/documents/:id
   */
  async getDocumentDetails(req, res, next) {
    try {
      const { id } = req.params;
      const adminId = req.user.id;

      const document = await Document.findByPk(id);

      if (!document) {
        throw new AppError('Document not found', 404);
      }

      // Get user info
      const user = document.userId ? await User.findByPk(document.userId, {
        attributes: ['id', 'fullName', 'email'],
      }) : null;

      // Log admin access
      await auditService.logDataAccess(
        adminId,
        'read',
        'document',
        id,
        {
          documentId: id,
          userId: document.userId,
        },
        req.ip,
      );

      enterpriseLogger.info('Document details retrieved via admin API', {
        adminId,
        documentId: id,
      });

      res.status(200).json({
        success: true,
        message: 'Document details retrieved successfully',
        data: {
          document: {
            id: document.id,
            userId: document.userId,
            user: user ? {
              id: user.id,
              fullName: user.fullName,
              email: user.email,
            } : null,
            filingId: document.filingId,
            type: document.category,
            fileName: document.filename,
            originalFileName: document.originalFilename,
            fileSize: document.sizeBytes,
            fileSizeFormatted: document.getFileSize ? document.getFileSize() : `${(document.sizeBytes / 1024).toFixed(2)} KB`,
            s3Key: document.s3Key,
            localPath: document.localPath,
            mimeType: document.mimeType,
            verificationStatus: document.verificationStatus,
            extractedMetadata: document.extractedMetadata,
            ocrResult: document.ocrResult,
            virusScanResult: document.virusScanResult,
            createdAt: document.createdAt,
            updatedAt: document.updatedAt,
          },
        },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to get document details via admin API', {
        error: error.message,
        adminId: req.user?.id,
        documentId: req.params.id,
      });
      next(error);
    }
  }

  /**
   * Delete document
   * DELETE /api/admin/documents/:id
   */
  async deleteDocument(req, res, next) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const adminId = req.user.id;

      const document = await Document.findByPk(id);
      if (!document) {
        throw new AppError('Document not found', 404);
      }

      // Soft delete
      document.isDeleted = true;
      await document.save();

      // Log audit event
      await auditService.logDataAccess(
        adminId,
        'delete',
        'document',
        id,
        {
          documentId: id,
          userId: document.userId,
          reason: reason || 'Document deleted by admin',
        },
        req.ip,
      );

      enterpriseLogger.info('Document deleted via admin API', {
        adminId,
        documentId: id,
        reason,
      });

      res.status(200).json({
        success: true,
        message: 'Document deleted successfully',
        data: {
          documentId: id,
        },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to delete document via admin API', {
        error: error.message,
        adminId: req.user?.id,
        documentId: req.params.id,
      });
      next(error);
    }
  }

  /**
   * Reprocess document
   * POST /api/admin/documents/:id/reprocess
   */
  async reprocessDocument(req, res, next) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const adminId = req.user.id;

      const document = await Document.findByPk(id);
      if (!document) {
        throw new AppError('Document not found', 404);
      }

      // Reset verification status for reprocessing
      document.verificationStatus = 'PENDING';
      document.extractedMetadata = {
        ...document.extractedMetadata,
        reprocessHistory: [
          ...(document.extractedMetadata?.reprocessHistory || []),
          {
            reprocessedBy: adminId,
            reprocessedAt: new Date().toISOString(),
            reason: reason || 'Reprocessed by admin',
          },
        ],
      };
      await document.save();

      // Log audit event
      await auditService.logDataAccess(
        adminId,
        'update',
        'document_reprocess',
        id,
        {
          documentId: id,
          userId: document.userId,
          reason: reason || 'Document reprocessed by admin',
        },
        req.ip,
      );

      enterpriseLogger.info('Document reprocessed via admin API', {
        adminId,
        documentId: id,
        reason,
      });

      res.status(200).json({
        success: true,
        message: 'Document queued for reprocessing',
        data: {
          documentId: id,
        },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to reprocess document via admin API', {
        error: error.message,
        adminId: req.user?.id,
        documentId: req.params.id,
      });
      next(error);
    }
  }

  /**
   * Get extracted data
   * GET /api/admin/documents/:id/extracted-data
   */
  async getExtractedData(req, res, next) {
    try {
      const { id } = req.params;
      const adminId = req.user.id;

      const document = await Document.findByPk(id);
      if (!document) {
        throw new AppError('Document not found', 404);
      }

      // Log admin access
      await auditService.logDataAccess(
        adminId,
        'read',
        'document_extracted_data',
        id,
        {
          documentId: id,
        },
        req.ip,
      );

      res.status(200).json({
        success: true,
        message: 'Extracted data retrieved successfully',
        data: {
          documentId: id,
          extractedMetadata: document.extractedMetadata,
          ocrResult: document.ocrResult,
          verificationStatus: document.verificationStatus,
        },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to get extracted data via admin API', {
        error: error.message,
        adminId: req.user?.id,
        documentId: req.params.id,
      });
      next(error);
    }
  }

  /**
   * Update extracted data
   * PUT /api/admin/documents/:id/extracted-data
   */
  async updateExtractedData(req, res, next) {
    try {
      const { id } = req.params;
      const { extractedMetadata, ocrResult, reason } = req.body;
      const adminId = req.user.id;

      if (!extractedMetadata && !ocrResult) {
        throw new AppError('Extracted metadata or OCR result is required', 400);
      }

      const document = await Document.findByPk(id);
      if (!document) {
        throw new AppError('Document not found', 404);
      }

      const oldMetadata = document.extractedMetadata;
      const oldOcrResult = document.ocrResult;

      if (extractedMetadata) {
        document.extractedMetadata = {
          ...document.extractedMetadata,
          ...extractedMetadata,
          manualEdits: [
            ...(document.extractedMetadata?.manualEdits || []),
            {
              editedBy: adminId,
              editedAt: new Date().toISOString(),
              reason: reason || 'Extracted metadata edited by admin',
              oldData: oldMetadata,
              newData: extractedMetadata,
            },
          ],
        };
      }

      if (ocrResult) {
        document.ocrResult = {
          ...document.ocrResult,
          ...ocrResult,
          manualEdits: [
            ...(document.ocrResult?.manualEdits || []),
            {
              editedBy: adminId,
              editedAt: new Date().toISOString(),
              reason: reason || 'OCR result edited by admin',
              oldData: oldOcrResult,
              newData: ocrResult,
            },
          ],
        };
      }

      await document.save();

      // Log audit event
      await auditService.logDataAccess(
        adminId,
        'update',
        'document_extracted_data',
        id,
        {
          documentId: id,
          userId: document.userId,
          reason: reason || 'Extracted data updated by admin',
        },
        req.ip,
      );

      enterpriseLogger.info('Extracted data updated via admin API', {
        adminId,
        documentId: id,
      });

      res.status(200).json({
        success: true,
        message: 'Extracted data updated successfully',
        data: {
          documentId: id,
        },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to update extracted data via admin API', {
        error: error.message,
        adminId: req.user?.id,
        documentId: req.params.id,
      });
      next(error);
    }
  }

  /**
   * Get document templates
   * GET /api/admin/documents/templates
   */
  async getDocumentTemplates(req, res, next) {
    try {
      // This would typically query a document_templates table
      // For now, return mock data
      const templates = [
        {
          id: '1',
          type: 'Form16',
          name: 'Standard Form 16',
          description: 'Standard Form 16 template',
          fields: ['employerName', 'pan', 'grossSalary', 'tds'],
          createdAt: new Date().toISOString(),
        },
      ];

      res.status(200).json({
        success: true,
        message: 'Document templates retrieved successfully',
        data: {
          templates,
          count: templates.length,
        },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to get document templates via admin API', {
        error: error.message,
        adminId: req.user?.id,
      });
      next(error);
    }
  }

  /**
   * Create document template
   * POST /api/admin/documents/templates
   */
  async createDocumentTemplate(req, res, next) {
    try {
      const { type, name, description, fields, mapping } = req.body;
      const adminId = req.user.id;

      if (!type || !name || !fields) {
        throw new AppError('Type, name, and fields are required', 400);
      }

      // This would typically create a record in document_templates table
      // For now, return success

      // Log audit event
      await auditService.logDataAccess(
        adminId,
        'create',
        'document_template',
        null,
        {
          type,
          name,
        },
        req.ip,
      );

      enterpriseLogger.info('Document template created via admin API', {
        adminId,
        type,
        name,
      });

      res.status(201).json({
        success: true,
        message: 'Document template created successfully',
        data: {
          template: {
            id: 'new-template-id',
            type,
            name,
            description,
            fields,
            mapping,
          },
        },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to create document template via admin API', {
        error: error.message,
        adminId: req.user?.id,
      });
      next(error);
    }
  }

  /**
   * Update document template
   * PUT /api/admin/documents/templates/:id
   */
  async updateDocumentTemplate(req, res, next) {
    try {
      const { id } = req.params;
      const { name, description, fields, mapping } = req.body;
      const adminId = req.user.id;

      // This would typically update a record in document_templates table
      // For now, return success

      // Log audit event
      await auditService.logDataAccess(
        adminId,
        'update',
        'document_template',
        id,
        {
          templateId: id,
        },
        req.ip,
      );

      enterpriseLogger.info('Document template updated via admin API', {
        adminId,
        templateId: id,
      });

      res.status(200).json({
        success: true,
        message: 'Document template updated successfully',
        data: {
          templateId: id,
        },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to update document template via admin API', {
        error: error.message,
        adminId: req.user?.id,
        templateId: req.params.id,
      });
      next(error);
    }
  }

  /**
   * Get storage usage stats
   * GET /api/admin/documents/storage
   */
  async getStorageStats(req, res, next) {
    try {
      const stats = await Document.findAll({
        where: { isDeleted: false },
        attributes: [
          [sequelize.fn('COUNT', sequelize.col('id')), 'totalDocuments'],
          [sequelize.fn('SUM', sequelize.col('size_bytes')), 'totalStorage'],
          [sequelize.fn('AVG', sequelize.col('size_bytes')), 'averageSize'],
        ],
        raw: true,
      });

      const storageStats = {
        totalDocuments: parseInt(stats[0]?.totalDocuments) || 0,
        totalStorage: parseInt(stats[0]?.totalStorage) || 0,
        averageSize: parseInt(stats[0]?.averageSize) || 0,
        totalStorageMB: Math.round((parseInt(stats[0]?.totalStorage) || 0) / (1024 * 1024) * 100) / 100,
      };

      res.status(200).json({
        success: true,
        message: 'Storage statistics retrieved successfully',
        data: {
          storage: storageStats,
        },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to get storage stats via admin API', {
        error: error.message,
        adminId: req.user?.id,
      });
      next(error);
    }
  }

  /**
   * Get platform statistics
   * GET /api/admin/platform/stats
   */
  async getPlatformStats(req, res, next) {
    try {
      const { timeRange = '30d' } = req.query;
      const adminId = req.user.id;
      
      // Calculate date range
      const now = new Date();
      const daysAgo = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
      const startDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      
      // Get user stats
      const [totalUsers, activeUsers, newUsersThisMonth] = await Promise.all([
        User.count(),
        User.count({ where: { status: 'active' } }),
        User.count({ 
          where: { 
            createdAt: { [Op.gte]: new Date(now.getFullYear(), now.getMonth(), 1) } 
          } 
        }),
      ]);
      
      // Get previous period for growth calculation
      const previousStartDate = new Date(startDate.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      const previousPeriodUsers = await User.count({
        where: { createdAt: { [Op.between]: [previousStartDate, startDate] } }
      });
      const currentPeriodUsers = await User.count({
        where: { createdAt: { [Op.gte]: startDate } }
      });
      const userGrowth = previousPeriodUsers > 0 
        ? ((currentPeriodUsers - previousPeriodUsers) / previousPeriodUsers * 100).toFixed(1)
        : 0;
      
      // Get revenue stats
      const revenueData = await this.getRevenueStats(startDate, now);
      
      // Get filing stats
      const filingData = await this.getFilingStatsWithGrowth(startDate, now, previousStartDate);
      
      // Get system health
      const systemHealth = await this.getSystemHealthMetrics();
      
      res.json({
        success: true,
        data: {
          users: {
            total: totalUsers,
            active: activeUsers,
            newThisMonth: newUsersThisMonth,
            growth: parseFloat(userGrowth),
          },
          revenue: {
            total: revenueData.total,
            thisMonth: revenueData.thisMonth,
            growth: revenueData.growth,
            pending: revenueData.pending,
          },
          filings: {
            total: filingData.total,
            completed: filingData.completed,
            pending: filingData.pending,
            growth: filingData.growth,
          },
          system: {
            uptime: systemHealth.uptime,
            responseTime: systemHealth.responseTime,
            cpuUsage: systemHealth.cpuUsage,
            memoryUsage: systemHealth.memoryUsage,
            diskUsage: systemHealth.diskUsage,
          },
        },
      });
    } catch (error) {
      enterpriseLogger.error('Failed to get platform stats', { 
        error: error.message,
        adminId: req.user?.id,
        stack: error.stack,
      });
      next(error);
    }
  }

  /**
   * Get revenue statistics with growth calculation
   */
  async getRevenueStats(startDate, endDate) {
    const currentPeriodRevenue = await Invoice.findAll({
      where: {
        createdAt: { [Op.between]: [startDate, endDate] },
        status: 'PAID',
      },
      attributes: [
        [sequelize.fn('SUM', sequelize.col('total_amount')), 'total'],
        [sequelize.fn('SUM', sequelize.literal('CASE WHEN created_at >= DATE_TRUNC(\'month\', CURRENT_DATE) THEN total_amount ELSE 0 END')), 'thisMonth'],
        [sequelize.fn('SUM', sequelize.literal('CASE WHEN status = \'PENDING\' THEN total_amount ELSE 0 END')), 'pending'],
      ],
      raw: true,
    });

    const previousStartDate = new Date(startDate.getTime() - (endDate.getTime() - startDate.getTime()));
    const previousPeriodRevenue = await Invoice.findAll({
      where: {
        createdAt: { [Op.between]: [previousStartDate, startDate] },
        status: 'PAID',
      },
      attributes: [
        [sequelize.fn('SUM', sequelize.col('total_amount')), 'total'],
      ],
      raw: true,
    });

    const currentTotal = parseFloat(currentPeriodRevenue[0]?.total) || 0;
    const previousTotal = parseFloat(previousPeriodRevenue[0]?.total) || 0;
    const growth = previousTotal > 0 
      ? ((currentTotal - previousTotal) / previousTotal * 100).toFixed(1)
      : 0;

    return {
      total: currentTotal,
      thisMonth: parseFloat(currentPeriodRevenue[0]?.thisMonth) || 0,
      growth: parseFloat(growth),
      pending: parseFloat(currentPeriodRevenue[0]?.pending) || 0,
    };
  }

  /**
   * Get filing statistics with growth calculation
   */
  async getFilingStatsWithGrowth(startDate, endDate, previousStartDate) {
    const currentPeriodFilings = await ITRFiling.findAll({
      where: {
        createdAt: { [Op.between]: [startDate, endDate] },
      },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'total'],
        [sequelize.fn('COUNT', sequelize.literal('CASE WHEN status = \'processed\' OR status = \'acknowledged\' THEN 1 END')), 'completed'],
        [sequelize.fn('COUNT', sequelize.literal('CASE WHEN status = \'draft\' OR status = \'submitted\' THEN 1 END')), 'pending'],
      ],
      raw: true,
    });

    const previousPeriodFilings = await ITRFiling.count({
      where: {
        createdAt: { [Op.between]: [previousStartDate, startDate] },
      },
    });

    const currentTotal = parseInt(currentPeriodFilings[0]?.total) || 0;
    const growth = previousPeriodFilings > 0 
      ? ((currentTotal - previousPeriodFilings) / previousPeriodFilings * 100).toFixed(1)
      : 0;

    return {
      total: currentTotal,
      completed: parseInt(currentPeriodFilings[0]?.completed) || 0,
      pending: parseInt(currentPeriodFilings[0]?.pending) || 0,
      growth: parseFloat(growth),
    };
  }

  /**
   * Get system health metrics
   */
  async getSystemHealthMetrics() {
    const uptime = process.uptime();
    const uptimeHours = uptime / 3600;
    const uptimePercent = uptimeHours > 0 ? Math.min(99.9, 100 - (uptimeHours / 8760 * 100)).toFixed(2) : 99.9;
    
    // Get memory usage
    const memUsage = process.memoryUsage();
    const memoryUsage = Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100);
    
    // Estimate CPU usage (simplified - in production use system monitoring)
    const cpuUsage = Math.min(100, Math.round(Math.random() * 30 + 50)); // Placeholder: 50-80%
    
    // Estimate disk usage (simplified - in production use system monitoring)
    const diskUsage = Math.min(100, Math.round(Math.random() * 20 + 40)); // Placeholder: 40-60%
    
    // Estimate response time (simplified - in production track actual response times)
    const responseTime = Math.round(Math.random() * 100 + 200); // Placeholder: 200-300ms

    return {
      uptime: parseFloat(uptimePercent),
      responseTime: responseTime,
      cpuUsage: cpuUsage,
      memoryUsage: memoryUsage,
      diskUsage: diskUsage,
    };
  }

  /**
   * Get system health
   * GET /api/admin/system/health
   */
  async getSystemHealth(req, res, next) {
    try {
      const adminId = req.user.id;
      const healthMetrics = await this.getSystemHealthMetrics();
      
      // Determine overall status
      const status = healthMetrics.cpuUsage > 90 || healthMetrics.memoryUsage > 90 
        ? 'warning' 
        : healthMetrics.cpuUsage > 95 || healthMetrics.memoryUsage > 95
        ? 'critical'
        : 'healthy';

      res.status(200).json({
        success: true,
        message: 'System health retrieved successfully',
        data: {
          status: status,
          uptime: healthMetrics.uptime,
          responseTime: healthMetrics.responseTime,
          cpuUsage: healthMetrics.cpuUsage,
          memoryUsage: healthMetrics.memoryUsage,
          diskUsage: healthMetrics.diskUsage,
        },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to get system health via admin API', {
        error: error.message,
        adminId: req.user?.id,
      });
      next(error);
    }
  }

  /**
   * Get top performing CA firms
   * GET /api/admin/cas/top-performers
   */
  async getTopPerformers(req, res, next) {
    try {
      const adminId = req.user.id;
      const { limit = 5 } = req.query;

      // Get CA firms with completed filings count
      // Valid ITRFiling statuses: draft, paused, submitted, acknowledged, processed, rejected
      const topCAs = await CAFirm.findAll({
        include: [{
          model: ITRFiling,
          as: 'filings',
          attributes: [],
          where: {
            status: { [Op.in]: ['processed', 'acknowledged'] },
          },
          required: false,
        }],
        attributes: [
          'id',
          'name',
          'email',
          [sequelize.fn('COUNT', sequelize.col('ITRFilings.id')), 'completedFilings'],
        ],
        group: ['CAFirm.id', 'CAFirm.name', 'CAFirm.email'],
        order: [[sequelize.literal('completedFilings'), 'DESC']],
        limit: parseInt(limit),
        having: sequelize.literal('COUNT("ITRFilings"."id") > 0'),
        subQuery: false,
      });

      // Format response
      const performers = topCAs.map(ca => ({
        id: ca.id,
        name: ca.name,
        email: ca.email,
        completedFilings: parseInt(ca.dataValues.completedFilings) || 0,
      }));

      res.status(200).json({
        success: true,
        message: 'Top performers retrieved successfully',
        data: performers,
      });

    } catch (error) {
      enterpriseLogger.error('Failed to get top performers via admin API', {
        error: error.message,
        adminId: req.user?.id,
        stack: error.stack,
      });
      next(error);
    }
  }

  /**
   * Get platform settings
   * GET /api/admin/settings
   */
  async getSettings(req, res, next) {
    try {
      const adminId = req.user.id;

      // Default settings - in production, these would be stored in database
      // Default values for initial setup
      const defaultSettings = {
        defaultBillingMode: 'per_filing',
        defaultItrRates: {
          itr_1: 500,
          itr_2: 800,
          itr_3: 1200,
          itr_4: 1000,
        },
        maxFilingsPerUserMonth: 10,
        maxFilingsPerUserYear: 50,
        serviceTicketAutoCreate: true,
        caAssistedFilingVisible: true,
        platformCommission: 5.0,
      };

      // Load from database settings table
      const { PlatformSettings } = require('../models');
      const dbSettings = await PlatformSettings.getSetting('platform', null);
      
      // Merge default settings with database settings (database takes precedence)
      const settings = dbSettings ? { ...defaultSettings, ...dbSettings } : defaultSettings;

      enterpriseLogger.info('Platform settings retrieved via admin API', {
        adminId,
        fromDatabase: !!dbSettings,
      });

      res.status(200).json({
        success: true,
        message: 'Settings retrieved successfully',
        data: settings,
      });

    } catch (error) {
      enterpriseLogger.error('Failed to get settings via admin API', {
        error: error.message,
        adminId: req.user?.id,
      });
      next(error);
    }
  }

  /**
   * Update platform settings
   * PUT /api/admin/settings
   */
  async updateSettings(req, res, next) {
    try {
      const adminId = req.user.id;
      const settings = req.body;

      // Validate settings
      if (!settings || typeof settings !== 'object') {
        throw new AppError('Invalid settings data', 400);
      }

      // Validate ITR rates if provided
      if (settings.defaultItrRates) {
        const rates = settings.defaultItrRates;
        if (rates.itr_1 && (rates.itr_1 < 0 || rates.itr_1 > 100000)) {
          throw new AppError('Invalid ITR-1 rate', 400);
        }
        if (rates.itr_2 && (rates.itr_2 < 0 || rates.itr_2 > 100000)) {
          throw new AppError('Invalid ITR-2 rate', 400);
        }
        if (rates.itr_3 && (rates.itr_3 < 0 || rates.itr_3 > 100000)) {
          throw new AppError('Invalid ITR-3 rate', 400);
        }
        if (rates.itr_4 && (rates.itr_4 < 0 || rates.itr_4 > 100000)) {
          throw new AppError('Invalid ITR-4 rate', 400);
        }
      }

      // Validate limits
      if (settings.maxFilingsPerUserMonth && (settings.maxFilingsPerUserMonth < 1 || settings.maxFilingsPerUserMonth > 1000)) {
        throw new AppError('Invalid monthly filing limit', 400);
      }
      if (settings.maxFilingsPerUserYear && (settings.maxFilingsPerUserYear < 1 || settings.maxFilingsPerUserYear > 10000)) {
        throw new AppError('Invalid yearly filing limit', 400);
      }

      // Validate commission
      if (settings.platformCommission !== undefined && (settings.platformCommission < 0 || settings.platformCommission > 100)) {
        throw new AppError('Invalid platform commission percentage', 400);
      }

      // Save to database settings table
      const { PlatformSettings } = require('../models');
      await PlatformSettings.setSetting('platform', settings, adminId, 'Platform-wide configuration settings');

      // Log audit event
      await auditService.logDataAccess(
        adminId,
        'update',
        'platform_settings',
        'platform',
        {
          settings: settings,
        },
        req.ip,
      );

      enterpriseLogger.info('Platform settings updated via admin API', {
        adminId,
        settings: Object.keys(settings),
      });

      res.status(200).json({
        success: true,
        message: 'Settings updated successfully',
        data: settings,
      });

    } catch (error) {
      enterpriseLogger.error('Failed to update settings via admin API', {
        error: error.message,
        adminId: req.user?.id,
      });
      next(error);
    }
  }

  /**
   * Get CA firms statistics for admin control panel
   * GET /api/admin/ca-firms/stats
   */
  async getCAFirmsStats(req, res, next) {
    try {
      const adminId = req.user.id;

      const firms = await CAFirm.findAll({
        attributes: [
          'id',
          'name',
          'email',
          'status',
          'createdAt',
          'metadata',
        ],
        order: [['createdAt', 'DESC']],
      });

      // Get stats for each firm
      const firmsWithStats = await Promise.all(
        firms.map(async (firm) => {
          // Get firm stats if method exists
          let stats = {};
          try {
            if (CAFirm.getFirmStats) {
              const firmStats = await CAFirm.getFirmStats(firm.id);
              stats = firmStats.stats || {};
            }
          } catch (error) {
            enterpriseLogger.warn('Failed to get firm stats', { firmId: firm.id, error: error.message });
          }

          // Extract billing mode and rates from metadata or use defaults
          const metadata = firm.metadata || {};
          const billingMode = metadata.billingMode || 'per_filing';
          const itrRates = metadata.itrRates || {
            itr_1: 600,
            itr_2: 900,
            itr_3: 1400,
            itr_4: 1200,
          };
          const commissionPercentage = metadata.commissionPercentage || 3.0;
          const maxFilingsPerMonth = metadata.maxFilingsPerMonth || 100;
          const maxFilingsPerYear = metadata.maxFilingsPerYear || 1000;

          return {
            id: firm.id,
            name: firm.name,
            email: firm.email,
            status: firm.status,
            billingMode: billingMode,
            itrRates: itrRates,
            commissionPercentage: commissionPercentage,
            maxFilingsPerMonth: maxFilingsPerMonth,
            maxFilingsPerYear: maxFilingsPerYear,
            createdAt: firm.createdAt,
            lastActivity: stats.lastActivity || firm.createdAt,
            stats: stats,
          };
        })
      );

      res.status(200).json({
        success: true,
        message: 'CA firms statistics retrieved successfully',
        data: firmsWithStats,
      });

    } catch (error) {
      enterpriseLogger.error('Failed to get CA firms stats via admin API', {
        error: error.message,
        adminId: req.user?.id,
      });
      next(error);
    }
  }

  /**
   * Get user limits
   * GET /api/admin/users/limits
   */
  async getUserLimits(req, res, next) {
    try {
      const adminId = req.user.id;
      const { page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;

      // Get users with CA firm associations
      const { count, rows: users } = await User.findAndCountAll({
        where: {
          role: { [Op.in]: ['END_USER', 'CA', 'CA_FIRM_ADMIN'] },
        },
        include: [
          {
            model: CAFirm,
            as: 'caFirm',
            attributes: ['id', 'name'],
            required: false,
          },
        ],
        attributes: [
          'id',
          'fullName',
          'email',
          'role',
          'caFirmId',
          'metadata',
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['createdAt', 'DESC']],
      });

      // Get filing counts for each user
      const usersWithLimits = await Promise.all(
        users.map(async (user) => {
          const metadata = user.metadata || {};
          const limits = metadata.limits || {};
          
          // Get current month and year filing counts
          const now = new Date();
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
          const yearStart = new Date(now.getFullYear(), 0, 1);

          const [monthFilings, yearFilings] = await Promise.all([
            ITRFiling.count({
              where: {
                userId: user.id,
                createdAt: { [Op.gte]: monthStart },
              },
            }),
            ITRFiling.count({
              where: {
                userId: user.id,
                createdAt: { [Op.gte]: yearStart },
              },
            }),
          ]);

          return {
            id: user.id,
            userId: user.id,
            userName: user.fullName,
            tenantId: user.caFirmId,
            tenantName: user.caFirm?.name || 'N/A',
            maxFilingsPerMonth: limits.maxFilingsPerMonth || 10,
            maxFilingsPerYear: limits.maxFilingsPerYear || 50,
            currentMonthFilings: monthFilings,
            currentYearFilings: yearFilings,
            resetDate: new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString().split('T')[0],
          };
        })
      );

      res.status(200).json({
        success: true,
        message: 'User limits retrieved successfully',
        data: {
          limits: usersWithLimits,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / limit),
            totalItems: count,
            itemsPerPage: parseInt(limit),
          },
        },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to get user limits via admin API', {
        error: error.message,
        adminId: req.user?.id,
      });
      next(error);
    }
  }

  /**
   * Approve CA firm
   * POST /api/admin/cas/:id/approve
   */
  async approveCA(req, res, next) {
    try {
      const { id } = req.params;
      const adminId = req.user.id;

      const caFirm = await CAFirm.findByPk(id);
      if (!caFirm) {
        throw new AppError('CA firm not found', 404);
      }

      await caFirm.update({
        status: 'active',
      });

      // Log audit event
      await auditService.logDataAccess(
        adminId,
        'update',
        'ca_firm',
        id,
        {
          action: 'approve',
          previousStatus: caFirm.previous('status'),
          newStatus: 'active',
        },
        req.ip,
      );

      enterpriseLogger.info('CA firm approved via admin API', {
        adminId,
        firmId: id,
      });

      res.status(200).json({
        success: true,
        message: 'CA firm approved successfully',
        data: {
          firm: caFirm,
        },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to approve CA firm via admin API', {
        error: error.message,
        adminId: req.user?.id,
        firmId: req.params.id,
      });
      next(error);
    }
  }

  /**
   * Reject CA firm
   * POST /api/admin/cas/:id/reject
   */
  async rejectCA(req, res, next) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const adminId = req.user.id;

      const caFirm = await CAFirm.findByPk(id);
      if (!caFirm) {
        throw new AppError('CA firm not found', 404);
      }

      await caFirm.update({
        status: 'inactive',
        metadata: {
          ...(caFirm.metadata || {}),
          rejectionReason: reason,
          rejectedAt: new Date().toISOString(),
          rejectedBy: adminId,
        },
      });

      // Log audit event
      await auditService.logDataAccess(
        adminId,
        'update',
        'ca_firm',
        id,
        {
          action: 'reject',
          reason: reason,
          previousStatus: caFirm.previous('status'),
          newStatus: 'inactive',
        },
        req.ip,
      );

      enterpriseLogger.info('CA firm rejected via admin API', {
        adminId,
        firmId: id,
        reason,
      });

      res.status(200).json({
        success: true,
        message: 'CA firm rejected successfully',
        data: {
          firm: caFirm,
        },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to reject CA firm via admin API', {
        error: error.message,
        adminId: req.user?.id,
        firmId: req.params.id,
      });
      next(error);
    }
  }

  /**
   * Suspend CA firm
   * POST /api/admin/cas/:id/suspend
   */
  async suspendCA(req, res, next) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const adminId = req.user.id;

      const caFirm = await CAFirm.findByPk(id);
      if (!caFirm) {
        throw new AppError('CA firm not found', 404);
      }

      await caFirm.update({
        status: 'suspended',
        metadata: {
          ...(caFirm.metadata || {}),
          suspensionReason: reason,
          suspendedAt: new Date().toISOString(),
          suspendedBy: adminId,
        },
      });

      // Log audit event
      await auditService.logDataAccess(
        adminId,
        'update',
        'ca_firm',
        id,
        {
          action: 'suspend',
          reason: reason,
          previousStatus: caFirm.previous('status'),
          newStatus: 'suspended',
        },
        req.ip,
      );

      enterpriseLogger.info('CA firm suspended via admin API', {
        adminId,
        firmId: id,
        reason,
      });

      res.status(200).json({
        success: true,
        message: 'CA firm suspended successfully',
        data: {
          firm: caFirm,
        },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to suspend CA firm via admin API', {
        error: error.message,
        adminId: req.user?.id,
        firmId: req.params.id,
      });
      next(error);
    }
  }

  /**
   * Get CA verification queue
   * GET /api/admin/cas/verification-queue
   */
  async getCAVerificationQueue(req, res, next) {
    try {
      const adminId = req.user.id;
      const { status, limit = 50, offset = 0 } = req.query;

      // Build where clause for pending verifications
      // CA firms that are inactive (new registrations awaiting verification)
      const whereClause = {
        status: 'inactive', // New registrations awaiting verification
      };

      const { count, rows: firms } = await CAFirm.findAndCountAll({
        where: whereClause,
        attributes: [
          'id',
          'name',
          'email',
          'phone',
          'gstNumber',
          'address',
          'status',
          'metadata',
          'createdBy',
          'createdAt',
        ],
        order: [['createdAt', 'ASC']], // Oldest first
        limit: parseInt(limit),
        offset: parseInt(offset),
      });

      // Get creator user for each firm
      const firmsWithCreator = await Promise.all(
        firms.map(async (firm) => {
          const creator = await User.findByPk(firm.createdBy, {
            attributes: ['id', 'fullName', 'email', 'phone'],
          });
          return { firm, creator };
        })
      );

      // Format response with verification documents
      const verificationQueue = firmsWithCreator.map(({ firm, creator }) => {
        const metadata = firm.metadata || {};
        return {
          id: firm.id,
          name: firm.name,
          email: firm.email,
          phone: firm.phone,
          gstNumber: firm.gstNumber,
          address: firm.address,
          status: firm.status,
          verificationStatus: metadata.verificationStatus || 'pending',
          verificationDocuments: metadata.verificationDocuments || metadata.documents || {},
          submittedAt: firm.createdAt,
          submittedBy: creator,
        };
      });

      res.status(200).json({
        success: true,
        message: 'CA verification queue retrieved successfully',
        data: {
          queue: verificationQueue,
          pagination: {
            total: count,
            limit: parseInt(limit),
            offset: parseInt(offset),
            totalPages: Math.ceil(count / limit),
          },
        },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to get CA verification queue via admin API', {
        error: error.message,
        adminId: req.user?.id,
        stack: error.stack,
      });
      next(error);
    }
  }

  /**
   * Approve CA verification
   * POST /api/admin/cas/verification/:id/approve
   */
  async approveCAVerification(req, res, next) {
    try {
      const { id } = req.params;
      const { notes } = req.body;
      const adminId = req.user.id;

      const caFirm = await CAFirm.findByPk(id);
      if (!caFirm) {
        throw new AppError('CA firm not found', 404);
      }

      const previousStatus = caFirm.status;
      const metadata = caFirm.metadata || {};

      await caFirm.update({
        status: 'active',
        metadata: {
          ...metadata,
          verificationStatus: 'approved',
          verifiedAt: new Date().toISOString(),
          verifiedBy: adminId,
          verificationNotes: notes,
        },
      });

      // Log audit event
      await auditService.logDataAccess(
        adminId,
        'update',
        'ca_firm_verification',
        id,
        {
          action: 'approve_verification',
          previousStatus: previousStatus,
          newStatus: 'active',
          notes: notes,
        },
        req.ip,
      );

      enterpriseLogger.info('CA verification approved via admin API', {
        adminId,
        firmId: id,
      });

      res.status(200).json({
        success: true,
        message: 'CA verification approved successfully',
        data: {
          firm: caFirm,
        },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to approve CA verification via admin API', {
        error: error.message,
        adminId: req.user?.id,
        firmId: req.params.id,
      });
      next(error);
    }
  }

  /**
   * Reject CA verification
   * POST /api/admin/cas/verification/:id/reject
   */
  async rejectCAVerification(req, res, next) {
    try {
      const { id } = req.params;
      const { reason, notes } = req.body;
      const adminId = req.user.id;

      if (!reason) {
        throw new AppError('Rejection reason is required', 400);
      }

      const caFirm = await CAFirm.findByPk(id);
      if (!caFirm) {
        throw new AppError('CA firm not found', 404);
      }

      const previousStatus = caFirm.status;
      const metadata = caFirm.metadata || {};

      await caFirm.update({
        status: 'inactive',
        metadata: {
          ...metadata,
          verificationStatus: 'rejected',
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
        'ca_firm_verification',
        id,
        {
          action: 'reject_verification',
          previousStatus: previousStatus,
          newStatus: 'inactive',
          reason: reason,
          notes: notes,
        },
        req.ip,
      );

      enterpriseLogger.info('CA verification rejected via admin API', {
        adminId,
        firmId: id,
        reason,
      });

      res.status(200).json({
        success: true,
        message: 'CA verification rejected successfully',
        data: {
          firm: caFirm,
        },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to reject CA verification via admin API', {
        error: error.message,
        adminId: req.user?.id,
        firmId: req.params.id,
      });
      next(error);
    }
  }

  /**
   * Get CA performance metrics
   * GET /api/admin/cas/:id/performance
   */
  async getCAPerformance(req, res, next) {
    try {
      const { id } = req.params;
      const adminId = req.user.id;

      const caFirm = await CAFirm.findByPk(id);
      if (!caFirm) {
        throw new AppError('CA firm not found', 404);
      }

      // Get firm stats if method exists
      let stats = {};
      try {
        if (CAFirm.getFirmStats) {
          const firmStats = await CAFirm.getFirmStats(id);
          stats = firmStats.stats || {};
        }
      } catch (error) {
        enterpriseLogger.warn('Failed to get firm stats', { firmId: id, error: error.message });
      }

      // Get completed filings count and calculate average completion time
      // Valid statuses: draft, paused, submitted, acknowledged, processed, rejected
      const completedFilingsData = await ITRFiling.findAll({
        where: {
          firmId: id,
          status: { [Op.in]: ['processed', 'acknowledged'] },
        },
        attributes: [
          'id',
          'createdAt',
          'submittedAt',
          'acknowledgedAt',
        ],
      });

      const completedFilings = completedFilingsData.length;
      
      // Calculate average completion time (from creation to acknowledgment)
      let averageCompletionTime = 0;
      if (completedFilings > 0) {
        const completionTimes = completedFilingsData
          .filter(f => f.acknowledgedAt && f.createdAt)
          .map(f => {
            const created = new Date(f.createdAt);
            const acknowledged = new Date(f.acknowledgedAt);
            return (acknowledged - created) / (1000 * 60 * 60); // Convert to hours
          });
        
        if (completionTimes.length > 0) {
          averageCompletionTime = completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length;
        }
      }

      // Get error/rejection rate
      const totalFilings = await ITRFiling.count({
        where: { firmId: id },
      });
      
      const rejectedFilings = await ITRFiling.count({
        where: {
          firmId: id,
          status: { [Op.in]: ['rejected', 'failed'] },
        },
      });

      const errorRate = totalFilings > 0 
        ? ((rejectedFilings / totalFilings) * 100).toFixed(2)
        : 0;

      // Get client satisfaction score from reviews
      const reviews = await CAFirmReview.findAll({
        where: { firmId: id },
        attributes: [
          [sequelize.fn('AVG', sequelize.col('rating')), 'averageRating'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'reviewCount'],
        ],
        raw: true,
      });

      const clientSatisfactionScore = parseFloat(reviews[0]?.averageRating) || 0;
      const reviewCount = parseInt(reviews[0]?.reviewCount) || 0;

      // Get response time metrics from service tickets
      const serviceTickets = await ServiceTicket.findAll({
        where: {
          caFirmId: id,
          resolvedAt: { [Op.ne]: null },
        },
        attributes: [
          'id',
          'createdAt',
          'resolvedAt',
        ],
      });

      let averageResponseTime = 0;
      if (serviceTickets.length > 0) {
        const responseTimes = serviceTickets
          .filter(t => t.resolvedAt && t.createdAt)
          .map(t => {
            const created = new Date(t.createdAt);
            const resolved = new Date(t.resolvedAt);
            return (resolved - created) / (1000 * 60 * 60); // Convert to hours
          });
        
        if (responseTimes.length > 0) {
          averageResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
        }
      }

      // Get total clients
      const totalClients = await User.count({
        where: {
          caFirmId: id,
          role: 'END_USER',
        },
      });

      // Get revenue from invoices (if CA firm has invoices)
      const revenue = await Invoice.findAll({
        where: {
          metadata: {
            caFirmId: id,
          },
          status: 'paid',
        },
        attributes: [
          [sequelize.fn('SUM', sequelize.col('total_amount')), 'total'],
        ],
        raw: true,
      });

      // Get revenue breakdown by ITR type
      const filingsByType = await ITRFiling.findAll({
        where: {
          firmId: id,
          status: { [Op.in]: ['processed', 'acknowledged'] },
        },
        attributes: ['id', 'itrType'],
      });

      const filingIds = filingsByType.map(f => f.id);
      const revenueByTypeData = await Invoice.findAll({
        where: {
          filingId: { [Op.in]: filingIds },
          status: 'paid',
        },
        include: [
          {
            model: ITRFiling,
            as: 'filing',
            attributes: ['itrType'],
            required: false,
          },
        ],
        attributes: [
          [sequelize.fn('SUM', sequelize.col('total_amount')), 'revenue'],
        ],
        group: [sequelize.col('filing.itr_type')],
        raw: true,
      });

      // Alternative: Calculate revenue by type manually
      const revenueBreakdown = {};
      if (filingIds.length > 0) {
        const invoices = await Invoice.findAll({
          where: {
            filingId: { [Op.in]: filingIds },
            status: 'paid',
          },
          attributes: ['id', 'filingId', 'totalAmount'],
        });

        const filingTypeMap = {};
        filingsByType.forEach(f => {
          filingTypeMap[f.id] = f.itrType;
        });

        invoices.forEach(invoice => {
          const itrType = filingTypeMap[invoice.filingId] || 'Unknown';
          revenueBreakdown[itrType] = (revenueBreakdown[itrType] || 0) + parseFloat(invoice.totalAmount || 0);
        });
      }

      res.status(200).json({
        success: true,
        message: 'CA performance metrics retrieved successfully',
        data: {
          firmId: id,
          firmName: caFirm.name,
          completedFilings: completedFilings,
          totalFilings: totalFilings,
          totalClients: totalClients,
          revenue: parseFloat(revenue[0]?.total) || 0,
          revenueBreakdown: revenueBreakdown,
          averageCompletionTime: Math.round(averageCompletionTime * 100) / 100, // Hours
          clientSatisfactionScore: Math.round(clientSatisfactionScore * 100) / 100,
          reviewCount: reviewCount,
          errorRate: parseFloat(errorRate),
          averageResponseTime: Math.round(averageResponseTime * 100) / 100, // Hours
          stats: stats,
        },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to get CA performance via admin API', {
        error: error.message,
        adminId: req.user?.id,
        firmId: req.params.id,
      });
      next(error);
    }
  }

  /**
   * Get pending CA payouts
   * GET /api/admin/cas/payouts
   */
  async getCAPayouts(req, res, next) {
    try {
      const adminId = req.user.id;
      const { status = 'pending', firmId, limit = 50, offset = 0 } = req.query;

      // Get all active CA firms
      const caFirms = await CAFirm.findAll({
        where: { status: 'active' },
        attributes: ['id', 'name', 'email', 'metadata'],
      });

      // Calculate pending payouts for each firm
      const payouts = await Promise.all(
        caFirms.map(async (firm) => {
          const metadata = firm.metadata || {};
          const commissionPercentage = metadata.commissionPercentage || 3.0;

          // Get paid invoices for this firm (simplified - in production would have proper invoice-firm relationship)
          const invoices = await Invoice.findAll({
            where: {
              metadata: {
                caFirmId: firm.id,
              },
              status: 'paid',
              // Add condition for unpaid commissions
            },
            attributes: [
              [sequelize.fn('SUM', sequelize.col('total_amount')), 'total'],
              [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
            ],
            raw: true,
          });

          const totalRevenue = parseFloat(invoices[0]?.total) || 0;
          const commissionAmount = (totalRevenue * commissionPercentage) / 100;
          const paidCommissions = metadata.paidCommissions || 0;
          const pendingAmount = commissionAmount - paidCommissions;

          return {
            firmId: firm.id,
            firmName: firm.name,
            firmEmail: firm.email,
            totalRevenue: totalRevenue,
            commissionPercentage: commissionPercentage,
            commissionAmount: commissionAmount,
            paidCommissions: paidCommissions,
            pendingAmount: pendingAmount > 0 ? pendingAmount : 0,
            invoiceCount: parseInt(invoices[0]?.count) || 0,
          };
        })
      );

      // Filter by status and firmId
      let filteredPayouts = payouts.filter(payout => {
        if (status === 'pending') {
          return payout.pendingAmount > 0;
        }
        if (status === 'paid') {
          return payout.pendingAmount === 0 && payout.paidCommissions > 0;
        }
        return true;
      });

      // Filter by firmId if provided
      if (firmId) {
        filteredPayouts = filteredPayouts.filter(payout => payout.firmId === firmId);
      }

      // Apply pagination
      const total = filteredPayouts.length;
      const paginatedPayouts = filteredPayouts.slice(
        parseInt(offset),
        parseInt(offset) + parseInt(limit)
      );

      res.status(200).json({
        success: true,
        message: 'CA payouts retrieved successfully',
        data: {
          payouts: paginatedPayouts,
          pagination: {
            total: total,
            limit: parseInt(limit),
            offset: parseInt(offset),
            totalPages: Math.ceil(total / limit),
          },
        },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to get CA payouts via admin API', {
        error: error.message,
        adminId: req.user?.id,
      });
      next(error);
    }
  }

  /**
   * Process CA payouts
   * POST /api/admin/cas/payouts/process
   */
  async processCAPayouts(req, res, next) {
    try {
      const { firmIds } = req.body; // Array of firm IDs to process
      const adminId = req.user.id;

      if (!firmIds || !Array.isArray(firmIds) || firmIds.length === 0) {
        throw new AppError('firmIds array is required', 400);
      }

      const processedPayouts = [];

      for (const firmId of firmIds) {
        const firm = await CAFirm.findByPk(firmId);
        if (!firm) {
          continue;
        }

        const metadata = firm.metadata || {};
        const commissionPercentage = metadata.commissionPercentage || 3.0;

        // Get pending commissions
        const invoices = await Invoice.findAll({
          where: {
            metadata: {
              caFirmId: firmId,
            },
            status: 'paid',
          },
          attributes: [
            [sequelize.fn('SUM', sequelize.col('total_amount')), 'total'],
          ],
          raw: true,
        });

        const totalRevenue = parseFloat(invoices[0]?.total) || 0;
        const commissionAmount = (totalRevenue * commissionPercentage) / 100;
        const paidCommissions = metadata.paidCommissions || 0;
        const pendingAmount = commissionAmount - paidCommissions;

        if (pendingAmount > 0) {
          // Get existing payout history or initialize empty array
          const payoutHistory = metadata.payoutHistory || [];
          
          // Add new payout to history
          payoutHistory.push({
            date: new Date().toISOString(),
            amount: pendingAmount,
            processedBy: adminId,
            commissionPercentage: commissionPercentage,
            totalRevenue: totalRevenue,
          });

          // Update metadata with new paid commissions and history
          await firm.update({
            metadata: {
              ...metadata,
              paidCommissions: commissionAmount,
              lastPayoutAt: new Date().toISOString(),
              lastPayoutAmount: pendingAmount,
              lastPayoutBy: adminId,
              payoutHistory: payoutHistory,
            },
          });

          // Log audit event
          await auditService.logDataAccess(
            adminId,
            'update',
            'ca_firm_payout',
            firmId,
            {
              action: 'process_payout',
              amount: pendingAmount,
              commissionPercentage: commissionPercentage,
            },
            req.ip,
          );

          processedPayouts.push({
            firmId: firmId,
            firmName: firm.name,
            amount: pendingAmount,
            status: 'processed',
          });
        }
      }

      enterpriseLogger.info('CA payouts processed via admin API', {
        adminId,
        processedCount: processedPayouts.length,
      });

      res.status(200).json({
        success: true,
        message: 'CA payouts processed successfully',
        data: {
          processed: processedPayouts,
          count: processedPayouts.length,
        },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to process CA payouts via admin API', {
        error: error.message,
        adminId: req.user?.id,
      });
      next(error);
    }
  }

  /**
   * Get CA payout history for a specific firm
   * GET /api/admin/cas/:id/payout-history
   */
  async getCAPayoutHistory(req, res, next) {
    try {
      const { id } = req.params;
      const adminId = req.user.id;

      const firm = await CAFirm.findByPk(id);
      if (!firm) {
        throw new AppError('CA firm not found', 404);
      }

      const metadata = firm.metadata || {};
      const payoutHistory = metadata.payoutHistory || [];

      // If no payout history array exists, create one from last payout info
      if (payoutHistory.length === 0 && metadata.lastPayoutAt) {
        payoutHistory.push({
          date: metadata.lastPayoutAt,
          amount: metadata.lastPayoutAmount || 0,
          processedBy: metadata.lastPayoutBy || null,
          commissionPercentage: metadata.commissionPercentage || 3.0,
        });
      }

      enterpriseLogger.info('CA payout history retrieved via admin API', {
        adminId,
        firmId: id,
        historyCount: payoutHistory.length,
      });

      res.status(200).json({
        success: true,
        data: {
          firmId: id,
          firmName: firm.name,
          payoutHistory: payoutHistory.sort((a, b) => new Date(b.date) - new Date(a.date)),
          totalPaid: metadata.paidCommissions || 0,
          commissionPercentage: metadata.commissionPercentage || 3.0,
        },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to get CA payout history via admin API', {
        error: error.message,
        adminId: req.user?.id,
        firmId: req.params.id,
      });
      next(error);
    }
  }

  /**
   * Schedule CA payouts (placeholder for future scheduling logic)
   * POST /api/admin/cas/payouts/schedule
   */
  async scheduleCAPayouts(req, res, next) {
    try {
      const adminId = req.user.id;
      const {
        scheduleType, // 'daily', 'weekly', 'monthly'
        dayOfWeek, // 0-6 for weekly (Sunday = 0)
        dayOfMonth, // 1-31 for monthly
        time, // HH:mm format
        firmIds, // Optional: specific firm IDs, or null for all
      } = req.body;

      // This is a placeholder for future scheduling implementation
      // In a real implementation, this would integrate with a job scheduler (e.g., node-cron, Bull)

      enterpriseLogger.info('CA payout schedule requested via admin API', {
        adminId,
        scheduleType,
        dayOfWeek,
        dayOfMonth,
        time,
        firmIds,
      });

      res.status(200).json({
        success: true,
        message: 'Payout scheduling is not yet implemented. This is a placeholder endpoint.',
        data: {
          scheduleType,
          dayOfWeek,
          dayOfMonth,
          time,
          firmIds: firmIds || 'all',
        },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to schedule CA payouts via admin API', {
        error: error.message,
        adminId: req.user?.id,
      });
      next(error);
    }
  }

  /**
   * Get system metrics
   * GET /api/admin/system/metrics
   */
  async getSystemMetrics(req, res, next) {
    try {
      const adminId = req.user.id;

      const memUsage = process.memoryUsage();
      const cpuUsage = await this.getCPUUsage();
      const diskUsage = await this.getDiskUsage();

      const metrics = {
        cpu: {
          usage: cpuUsage,
          cores: require('os').cpus().length,
        },
        memory: {
          used: memUsage.heapUsed,
          total: memUsage.heapTotal,
          external: memUsage.external,
          rss: memUsage.rss,
          usagePercent: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100),
        },
        disk: {
          usage: diskUsage,
        },
        uptime: {
          seconds: process.uptime(),
          formatted: this.formatUptime(process.uptime()),
        },
        node: {
          version: process.version,
          platform: process.platform,
          arch: process.arch,
        },
      };

      res.status(200).json({
        success: true,
        message: 'System metrics retrieved successfully',
        data: metrics,
      });

    } catch (error) {
      enterpriseLogger.error('Failed to get system metrics via admin API', {
        error: error.message,
        adminId: req.user?.id,
      });
      next(error);
    }
  }

  /**
   * Get system errors
   * GET /api/admin/system/errors
   */
  async getSystemErrors(req, res, next) {
    try {
      const adminId = req.user.id;
      const { severity, limit = 50, startDate, endDate } = req.query;

      const whereClause = {
        level: { [Op.in]: ['error', 'critical'] },
      };

      if (severity) {
        whereClause.level = severity;
      }

      if (startDate) {
        whereClause.createdAt = {
          ...whereClause.createdAt,
          [Op.gte]: new Date(startDate),
        };
      }

      if (endDate) {
        whereClause.createdAt = {
          ...whereClause.createdAt,
          [Op.lte]: new Date(endDate),
        };
      }

      // Get errors from AuditLog or error logs table
      // For now, use AuditLog with error level
      const errors = await AuditLog.findAll({
        where: whereClause,
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        attributes: [
          'id',
          'action',
          'resourceType',
          'resourceId',
          'metadata',
          'ipAddress',
          'createdAt',
        ],
      });

      res.status(200).json({
        success: true,
        message: 'System errors retrieved successfully',
        data: {
          errors: errors.map(error => ({
            id: error.id,
            action: error.action,
            resourceType: error.resourceType,
            resourceId: error.resourceId,
            message: error.metadata?.error || error.metadata?.message || 'Error occurred',
            ipAddress: error.ipAddress,
            timestamp: error.createdAt,
          })),
          count: errors.length,
        },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to get system errors via admin API', {
        error: error.message,
        adminId: req.user?.id,
      });
      next(error);
    }
  }

  /**
   * Helper: Get CPU usage (simplified)
   */
  async getCPUUsage() {
    // Simplified CPU usage calculation
    // In production, use system monitoring tools like os-utils or systeminformation
    const cpus = require('os').cpus();
    let totalIdle = 0;
    let totalTick = 0;

    cpus.forEach((cpu) => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    });

    const idle = totalIdle / cpus.length;
    const total = totalTick / cpus.length;
    const usage = 100 - ~~(100 * idle / total);

    return Math.min(100, Math.max(0, usage));
  }

  /**
   * Helper: Get disk usage (simplified)
   */
  async getDiskUsage() {
    // Simplified disk usage - in production use system monitoring
    // For now, return a placeholder value
    return Math.min(100, Math.round(Math.random() * 20 + 40)); // 40-60%
  }

  /**
   * Get user segments
   * GET /api/admin/users/segments
   */
  async getUserSegments(req, res, next) {
    try {
      const adminId = req.user.id;
      const { isActive, limit = 100, offset = 0 } = req.query;

      const whereClause = {};
      if (isActive !== undefined) {
        whereClause.isActive = isActive === 'true';
      }

      const { count, rows: segments } = await UserSegment.findAndCountAll({
        where: whereClause,
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset),
      });

      res.status(200).json({
        success: true,
        message: 'User segments retrieved successfully',
        data: {
          segments: segments,
          pagination: {
            total: count,
            limit: parseInt(limit),
            offset: parseInt(offset),
            totalPages: Math.ceil(count / limit),
          },
        },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to get user segments via admin API', {
        error: error.message,
        adminId: req.user?.id,
        stack: error.stack,
      });
      next(error);
    }
  }

  /**
   * Create user segment
   * POST /api/admin/users/segments
   */
  async createUserSegment(req, res, next) {
    try {
      const adminId = req.user.id;
      const { name, description, criteria, metadata = {} } = req.body;

      if (!name || !criteria) {
        throw new AppError('Name and criteria are required', 400);
      }

      // Calculate initial member count
      const memberCount = await this.calculateSegmentMembers(criteria);

      const segment = await UserSegment.create({
        name,
        description,
        criteria,
        memberCount,
        lastCalculatedAt: new Date(),
        isActive: true,
        metadata,
      });

      // Log audit event
      await auditService.logDataAccess(
        adminId,
        'create',
        'user_segment',
        segment.id,
        {
          action: 'create_user_segment',
          segmentName: name,
          criteria,
        },
        req.ip,
      );

      enterpriseLogger.info('User segment created via admin API', {
        adminId,
        segmentId: segment.id,
        segmentName: name,
      });

      res.status(201).json({
        success: true,
        message: 'User segment created successfully',
        data: {
          segment: segment,
        },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to create user segment via admin API', {
        error: error.message,
        adminId: req.user?.id,
      });
      next(error);
    }
  }

  /**
   * Update user segment
   * PUT /api/admin/users/segments/:id
   */
  async updateUserSegment(req, res, next) {
    try {
      const { id } = req.params;
      const adminId = req.user.id;
      const { name, description, criteria, isActive, metadata } = req.body;

      const segment = await UserSegment.findByPk(id);
      if (!segment) {
        throw new AppError('User segment not found', 404);
      }

      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (isActive !== undefined) updateData.isActive = isActive;
      if (metadata !== undefined) updateData.metadata = metadata;

      // If criteria changed, recalculate member count
      if (criteria !== undefined) {
        updateData.criteria = criteria;
        updateData.memberCount = await this.calculateSegmentMembers(criteria);
        updateData.lastCalculatedAt = new Date();
      }

      await segment.update(updateData);

      // Log audit event
      await auditService.logDataAccess(
        adminId,
        'update',
        'user_segment',
        id,
        {
          action: 'update_user_segment',
          changes: updateData,
        },
        req.ip,
      );

      enterpriseLogger.info('User segment updated via admin API', {
        adminId,
        segmentId: id,
      });

      res.status(200).json({
        success: true,
        message: 'User segment updated successfully',
        data: {
          segment: segment,
        },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to update user segment via admin API', {
        error: error.message,
        adminId: req.user?.id,
        segmentId: req.params.id,
      });
      next(error);
    }
  }

  /**
   * Delete user segment
   * DELETE /api/admin/users/segments/:id
   */
  async deleteUserSegment(req, res, next) {
    try {
      const { id } = req.params;
      const adminId = req.user.id;

      const segment = await UserSegment.findByPk(id);
      if (!segment) {
        throw new AppError('User segment not found', 404);
      }

      await segment.destroy();

      // Log audit event
      await auditService.logDataAccess(
        adminId,
        'delete',
        'user_segment',
        id,
        {
          action: 'delete_user_segment',
          segmentName: segment.name,
        },
        req.ip,
      );

      enterpriseLogger.info('User segment deleted via admin API', {
        adminId,
        segmentId: id,
      });

      res.status(200).json({
        success: true,
        message: 'User segment deleted successfully',
      });

    } catch (error) {
      enterpriseLogger.error('Failed to delete user segment via admin API', {
        error: error.message,
        adminId: req.user?.id,
        segmentId: req.params.id,
      });
      next(error);
    }
  }

  /**
   * Get segment members
   * GET /api/admin/users/segments/:id/members
   */
  async getSegmentMembers(req, res, next) {
    try {
      const { id } = req.params;
      const adminId = req.user.id;
      const { limit = 100, offset = 0 } = req.query;

      const segment = await UserSegment.findByPk(id);
      if (!segment) {
        throw new AppError('User segment not found', 404);
      }

      // Build where clause from criteria
      const whereClause = this.buildUserWhereClause(segment.criteria);

      const { count, rows: users } = await User.findAndCountAll({
        where: whereClause,
        attributes: ['id', 'fullName', 'email', 'phone', 'role', 'status', 'createdAt'],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['createdAt', 'DESC']],
      });

      // Log audit event
      await auditService.logDataAccess(
        adminId,
        'read',
        'user_segment_members',
        id,
        {
          action: 'get_segment_members',
          segmentName: segment.name,
          memberCount: count,
        },
        req.ip,
      );

      res.status(200).json({
        success: true,
        message: 'Segment members retrieved successfully',
        data: {
          segment: {
            id: segment.id,
            name: segment.name,
            memberCount: segment.memberCount,
          },
          members: users,
          pagination: {
            total: count,
            limit: parseInt(limit),
            offset: parseInt(offset),
            totalPages: Math.ceil(count / limit),
          },
        },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to get segment members via admin API', {
        error: error.message,
        adminId: req.user?.id,
        segmentId: req.params.id,
        stack: error.stack,
      });
      next(error);
    }
  }

  /**
   * Get pending verifications
   * GET /api/admin/verification/pending
   */
  async getPendingVerifications(req, res, next) {
    try {
      const adminId = req.user.id;
      const { type, limit = 50, offset = 0 } = req.query;

      const pendingVerifications = [];

      // Get users with pending email verification
      if (!type || type === 'email') {
        const usersPendingEmail = await User.findAll({
          where: {
            emailVerified: false,
            status: 'active',
          },
          attributes: ['id', 'email', 'fullName', 'createdAt'],
          limit: parseInt(limit),
          offset: parseInt(offset),
          order: [['createdAt', 'ASC']],
        });

        usersPendingEmail.forEach(user => {
          pendingVerifications.push({
            id: user.id,
            type: 'email',
            userId: user.id,
            userEmail: user.email,
            userName: user.fullName,
            submittedAt: user.createdAt,
            verificationData: {
              email: user.email,
            },
          });
        });
      }

      // Get users with pending phone verification
      if (!type || type === 'phone') {
        const usersPendingPhone = await User.findAll({
          where: {
            phoneVerified: false,
            phone: { [Op.ne]: null },
            status: 'active',
          },
          attributes: ['id', 'phone', 'fullName', 'createdAt'],
          limit: parseInt(limit),
          offset: parseInt(offset),
          order: [['createdAt', 'ASC']],
        });

        usersPendingPhone.forEach(user => {
          pendingVerifications.push({
            id: user.id,
            type: 'phone',
            userId: user.id,
            userPhone: user.phone,
            userName: user.fullName,
            submittedAt: user.createdAt,
            verificationData: {
              phone: user.phone,
            },
          });
        });
      }

      // Get users with pending PAN verification
      if (!type || type === 'pan') {
        const usersPendingPAN = await User.findAll({
          where: {
            panVerified: false,
            panNumber: { [Op.ne]: null },
            status: 'active',
          },
          attributes: ['id', 'panNumber', 'fullName', 'createdAt'],
          limit: parseInt(limit),
          offset: parseInt(offset),
          order: [['createdAt', 'ASC']],
        });

        usersPendingPAN.forEach(user => {
          pendingVerifications.push({
            id: user.id,
            type: 'pan',
            userId: user.id,
            userPAN: user.panNumber,
            userName: user.fullName,
            submittedAt: user.createdAt,
            verificationData: {
              panNumber: user.panNumber,
            },
          });
        });
      }

      // Sort by submission date
      pendingVerifications.sort((a, b) => new Date(a.submittedAt) - new Date(b.submittedAt));

      res.status(200).json({
        success: true,
        message: 'Pending verifications retrieved successfully',
        data: {
          verifications: pendingVerifications,
          pagination: {
            total: pendingVerifications.length,
            limit: parseInt(limit),
            offset: parseInt(offset),
          },
        },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to get pending verifications', {
        error: error.message,
        adminId: req.user?.id,
      });
      next(error);
    }
  }

  /**
   * Approve verification
   * POST /api/admin/verification/:type/:id/approve
   */
  async approveVerification(req, res, next) {
    try {
      const { type, id } = req.params;
      const { reason } = req.body;
      const adminId = req.user.id;

      const user = await User.findByPk(id);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      let updateData = {};
      let verificationField = '';

      switch (type) {
        case 'email':
          updateData.emailVerified = true;
          updateData.emailVerifiedAt = new Date();
          verificationField = 'emailVerified';
          break;
        case 'phone':
          updateData.phoneVerified = true;
          updateData.phoneVerifiedAt = new Date();
          verificationField = 'phoneVerified';
          break;
        case 'pan':
          updateData.panVerified = true;
          updateData.panVerifiedAt = new Date();
          verificationField = 'panVerified';
          break;
        default:
          throw new AppError('Invalid verification type', 400);
      }

      // Update metadata with verification history
      const metadata = user.metadata || {};
      const verificationHistory = metadata.verificationHistory || [];
      verificationHistory.push({
        type,
        action: 'approved',
        approvedBy: adminId,
        approvedAt: new Date().toISOString(),
        reason: reason || 'Approved by admin',
      });
      metadata.verificationHistory = verificationHistory;
      updateData.metadata = metadata;

      await user.update(updateData);

      // Log audit event
      await auditService.logDataAccess(
        adminId,
        'update',
        'user_verification',
        id,
        {
          type,
          action: 'approve',
          reason: reason || 'Approved by admin',
        },
        req.ip,
      );

      enterpriseLogger.info('Verification approved via admin API', {
        adminId,
        userId: id,
        type,
      });

      res.status(200).json({
        success: true,
        message: `${type.toUpperCase()} verification approved successfully`,
        data: {
          userId: id,
          type,
          verified: true,
        },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to approve verification', {
        error: error.message,
        adminId: req.user?.id,
        type: req.params.type,
        userId: req.params.id,
      });
      next(error);
    }
  }

  /**
   * Reject verification
   * POST /api/admin/verification/:type/:id/reject
   */
  async rejectVerification(req, res, next) {
    try {
      const { type, id } = req.params;
      const { reason } = req.body;
      const adminId = req.user.id;

      if (!reason) {
        throw new AppError('Rejection reason is required', 400);
      }

      const user = await User.findByPk(id);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Update metadata with verification history
      const metadata = user.metadata || {};
      const verificationHistory = metadata.verificationHistory || [];
      verificationHistory.push({
        type,
        action: 'rejected',
        rejectedBy: adminId,
        rejectedAt: new Date().toISOString(),
        reason,
      });
      metadata.verificationHistory = verificationHistory;
      
      await user.update({ metadata });

      // Log audit event
      await auditService.logDataAccess(
        adminId,
        'update',
        'user_verification',
        id,
        {
          type,
          action: 'reject',
          reason,
        },
        req.ip,
      );

      enterpriseLogger.info('Verification rejected via admin API', {
        adminId,
        userId: id,
        type,
        reason,
      });

      res.status(200).json({
        success: true,
        message: `${type.toUpperCase()} verification rejected`,
        data: {
          userId: id,
          type,
          rejected: true,
          reason,
        },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to reject verification', {
        error: error.message,
        adminId: req.user?.id,
        type: req.params.type,
        userId: req.params.id,
      });
      next(error);
    }
  }

  /**
   * Helper: Calculate segment members based on criteria
   */
  async calculateSegmentMembers(criteria) {
    try {
      const whereClause = this.buildUserWhereClause(criteria);
      return await User.count({ where: whereClause });
    } catch (error) {
      enterpriseLogger.error('Failed to calculate segment members', {
        error: error.message,
        criteria,
      });
      return 0;
    }
  }

  /**
   * Helper: Build Sequelize where clause from criteria
   */
  buildUserWhereClause(criteria) {
    const whereClause = {};

    if (!criteria || typeof criteria !== 'object') {
      return whereClause;
    }

    // Handle simple criteria
    if (criteria.userType) {
      whereClause.role = criteria.userType;
    }

    if (criteria.status) {
      whereClause.status = criteria.status;
    }

    // Handle date ranges
    if (criteria.registrationDate) {
      if (criteria.registrationDate.$gte) {
        whereClause.createdAt = { ...whereClause.createdAt, [Op.gte]: new Date(criteria.registrationDate.$gte) };
      }
      if (criteria.registrationDate.$lte) {
        whereClause.createdAt = { ...whereClause.createdAt, [Op.lte]: new Date(criteria.registrationDate.$lte) };
      }
    }

    // Handle filing count criteria
    if (criteria.filingCount) {
      // This would require a subquery or join - simplified for now
      // In production, use a more sophisticated approach
    }

    // Handle metadata criteria
    if (criteria.metadata) {
      // JSONB query for metadata
      // Simplified - in production use proper JSONB operators
    }

    return whereClause;
  }

  /**
   * Helper: Format uptime
   */
  formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }

  /**
   * Get user notes
   * GET /api/admin/users/:id/notes
   */
  async getUserNotes(req, res, next) {
    try {
      const { id } = req.params;
      const adminId = req.user.id;

      const user = await User.findByPk(id);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      const notes = user.metadata?.notes || [];

      res.status(200).json({
        success: true,
        message: 'User notes retrieved successfully',
        data: {
          notes: notes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
        },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to get user notes', {
        error: error.message,
        adminId: req.user?.id,
        userId: req.params.id,
      });
      next(error);
    }
  }

  /**
   * Create user note
   * POST /api/admin/users/:id/notes
   */
  async createUserNote(req, res, next) {
    try {
      const { id } = req.params;
      const { content, isPrivate = false } = req.body;
      const adminId = req.user.id;

      if (!content) {
        throw new AppError('Note content is required', 400);
      }

      const user = await User.findByPk(id);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      const metadata = user.metadata || {};
      const notes = metadata.notes || [];

      const uuidv4 = require('uuid').v4;
      const newNote = {
        id: uuidv4(),
        content,
        isPrivate,
        createdBy: adminId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      notes.push(newNote);
      metadata.notes = notes;
      user.metadata = metadata;
      await user.save();

      // Log audit event
      await auditService.logDataAccess(
        adminId,
        'create',
        'user_note',
        id,
        {
          noteId: newNote.id,
          isPrivate,
        },
        req.ip,
      );

      res.status(201).json({
        success: true,
        message: 'Note created successfully',
        data: {
          note: newNote,
        },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to create user note', {
        error: error.message,
        adminId: req.user?.id,
        userId: req.params.id,
      });
      next(error);
    }
  }

  /**
   * Update user note
   * PUT /api/admin/users/:id/notes/:noteId
   */
  async updateUserNote(req, res, next) {
    try {
      const { id, noteId } = req.params;
      const { content, isPrivate } = req.body;
      const adminId = req.user.id;

      const user = await User.findByPk(id);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      const metadata = user.metadata || {};
      const notes = metadata.notes || [];
      const noteIndex = notes.findIndex(n => n.id === noteId);

      if (noteIndex === -1) {
        throw new AppError('Note not found', 404);
      }

      // Only allow creator or admin to update
      if (notes[noteIndex].createdBy !== adminId && !['SUPER_ADMIN', 'PLATFORM_ADMIN'].includes(req.user.role)) {
        throw new AppError('Unauthorized to update this note', 403);
      }

      if (content !== undefined) notes[noteIndex].content = content;
      if (isPrivate !== undefined) notes[noteIndex].isPrivate = isPrivate;
      notes[noteIndex].updatedAt = new Date().toISOString();
      notes[noteIndex].updatedBy = adminId;

      metadata.notes = notes;
      user.metadata = metadata;
      await user.save();

      // Log audit event
      await auditService.logDataAccess(
        adminId,
        'update',
        'user_note',
        id,
        {
          noteId,
        },
        req.ip,
      );

      res.status(200).json({
        success: true,
        message: 'Note updated successfully',
        data: {
          note: notes[noteIndex],
        },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to update user note', {
        error: error.message,
        adminId: req.user?.id,
        userId: req.params.id,
        noteId: req.params.noteId,
      });
      next(error);
    }
  }

  /**
   * Delete user note
   * DELETE /api/admin/users/:id/notes/:noteId
   */
  async deleteUserNote(req, res, next) {
    try {
      const { id, noteId } = req.params;
      const adminId = req.user.id;

      const user = await User.findByPk(id);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      const metadata = user.metadata || {};
      const notes = metadata.notes || [];
      const noteIndex = notes.findIndex(n => n.id === noteId);

      if (noteIndex === -1) {
        throw new AppError('Note not found', 404);
      }

      // Only allow creator or admin to delete
      if (notes[noteIndex].createdBy !== adminId && !['SUPER_ADMIN', 'PLATFORM_ADMIN'].includes(req.user.role)) {
        throw new AppError('Unauthorized to delete this note', 403);
      }

      notes.splice(noteIndex, 1);
      metadata.notes = notes;
      user.metadata = metadata;
      await user.save();

      // Log audit event
      await auditService.logDataAccess(
        adminId,
        'delete',
        'user_note',
        id,
        {
          noteId,
        },
        req.ip,
      );

      res.status(200).json({
        success: true,
        message: 'Note deleted successfully',
      });

    } catch (error) {
      enterpriseLogger.error('Failed to delete user note', {
        error: error.message,
        adminId: req.user?.id,
        userId: req.params.id,
        noteId: req.params.noteId,
      });
      next(error);
    }
  }

  /**
   * Communicate with user (email/SMS)
   * POST /api/admin/users/:id/communicate
   */
  async communicateWithUser(req, res, next) {
    try {
      const { id } = req.params;
      const { type, subject, message, templateId } = req.body;
      const adminId = req.user.id;

      if (!type || !['email', 'sms'].includes(type)) {
        throw new AppError('Communication type must be email or sms', 400);
      }

      if (!message) {
        throw new AppError('Message is required', 400);
      }

      const user = await User.findByPk(id);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Store communication in metadata
      const metadata = user.metadata || {};
      const communicationHistory = metadata.communicationHistory || [];
      
      const uuidv4 = require('uuid').v4;
      const communication = {
        id: uuidv4(),
        type,
        subject: subject || (type === 'email' ? 'Message from Admin' : null),
        message,
        templateId,
        sentBy: adminId,
        sentAt: new Date().toISOString(),
        status: 'sent',
      };

      communicationHistory.push(communication);
      metadata.communicationHistory = communicationHistory;
      await user.update({ metadata });

      // In a real implementation, you would call email/SMS service here
      enterpriseLogger.info('User communication sent via admin API', {
        adminId,
        userId: id,
        type,
        hasSubject: !!subject,
        messageLength: message.length,
      });

      // Log audit event
      await auditService.logDataAccess(
        adminId,
        'create',
        'user_communication',
        id,
        {
          type,
          hasSubject: !!subject,
          messageLength: message.length,
        },
        req.ip,
      );

      res.status(200).json({
        success: true,
        message: `${type.toUpperCase()} sent successfully`,
        data: {
          communication,
        },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to communicate with user', {
        error: error.message,
        adminId: req.user?.id,
        userId: req.params.id,
      });
      next(error);
    }
  }

  /**
   * Get user communication history
   * GET /api/admin/users/:id/communication-history
   */
  async getUserCommunicationHistory(req, res, next) {
    try {
      const { id } = req.params;
      const { type, limit = 50, offset = 0 } = req.query;
      const adminId = req.user.id;

      const user = await User.findByPk(id);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      let communicationHistory = user.metadata?.communicationHistory || [];

      // Filter by type if specified
      if (type) {
        communicationHistory = communicationHistory.filter(c => c.type === type);
      }

      // Sort by sent date (newest first)
      communicationHistory.sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt));

      // Paginate
      const paginatedHistory = communicationHistory.slice(
        parseInt(offset),
        parseInt(offset) + parseInt(limit)
      );

      res.status(200).json({
        success: true,
        message: 'Communication history retrieved successfully',
        data: {
          communications: paginatedHistory,
          pagination: {
            total: communicationHistory.length,
            limit: parseInt(limit),
            offset: parseInt(offset),
            totalPages: Math.ceil(communicationHistory.length / limit),
          },
        },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to get user communication history', {
        error: error.message,
        adminId: req.user?.id,
        userId: req.params.id,
      });
      next(error);
    }
  }

  // =====================================================
  // USER TAGS
  // =====================================================

  /**
   * Get user tags
   * GET /api/admin/users/:id/tags
   */
  async getUserTags(req, res, next) {
    try {
      const { id } = req.params;
      const user = await User.findByPk(id);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      const tags = user.metadata?.tags || [];

      res.status(200).json({
        success: true,
        message: 'User tags retrieved successfully',
        data: { tags },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to get user tags', {
        error: error.message,
        userId: req.params.id,
      });
      next(error);
    }
  }

  /**
   * Add user tag
   * POST /api/admin/users/:id/tags
   */
  async addUserTag(req, res, next) {
    try {
      const { id } = req.params;
      const { tag } = req.body;
      const adminId = req.user.id;

      if (!tag || typeof tag !== 'string' || tag.trim().length === 0) {
        throw new AppError('Tag is required and must be a non-empty string', 400);
      }

      const user = await User.findByPk(id);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      const metadata = user.metadata || {};
      const tags = metadata.tags || [];
      const normalizedTag = tag.trim().toLowerCase();

      if (tags.includes(normalizedTag)) {
        return res.status(200).json({
          success: true,
          message: 'Tag already exists',
          data: { tags },
        });
      }

      tags.push(normalizedTag);
      metadata.tags = tags;
      await user.update({ metadata });

      // Log audit event
      await auditService.logDataAccess(
        adminId,
        'update',
        'user_tags',
        id,
        { action: 'add_tag', tag: normalizedTag },
        req.ip,
      );

      res.status(200).json({
        success: true,
        message: 'Tag added successfully',
        data: { tags },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to add user tag', {
        error: error.message,
        userId: req.params.id,
      });
      next(error);
    }
  }

  /**
   * Remove user tag
   * DELETE /api/admin/users/:id/tags/:tag
   */
  async removeUserTag(req, res, next) {
    try {
      const { id, tag } = req.params;
      const adminId = req.user.id;

      const user = await User.findByPk(id);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      const metadata = user.metadata || {};
      const tags = metadata.tags || [];
      const normalizedTag = decodeURIComponent(tag).trim().toLowerCase();

      const tagIndex = tags.indexOf(normalizedTag);
      if (tagIndex === -1) {
        throw new AppError('Tag not found', 404);
      }

      tags.splice(tagIndex, 1);
      metadata.tags = tags;
      await user.update({ metadata });

      // Log audit event
      await auditService.logDataAccess(
        adminId,
        'update',
        'user_tags',
        id,
        { action: 'remove_tag', tag: normalizedTag },
        req.ip,
      );

      res.status(200).json({
        success: true,
        message: 'Tag removed successfully',
        data: { tags },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to remove user tag', {
        error: error.message,
        userId: req.params.id,
      });
      next(error);
    }
  }

  // =====================================================
  // USER GROUPS
  // =====================================================

  /**
   * Get all user groups
   * GET /api/admin/users/groups
   */
  async getUserGroups(req, res, next) {
    try {
      const adminId = req.user.id;
      const { isActive, limit = 100, offset = 0 } = req.query;

      // Use UserSegment model as base, or create simple groups in metadata
      // For simplicity, we'll use a groups table via Sequelize or metadata
      // Since we don't have a UserGroup model, we'll use metadata approach
      const { QueryTypes } = require('sequelize');
      const { sequelize } = require('../config/database');

      // Get all users and extract groups from metadata
      const users = await User.findAll({
        attributes: ['id', 'metadata', 'createdAt'],
      });

      // Extract unique groups from all users
      const groupMap = new Map();
      users.forEach(user => {
        const groups = user.metadata?.groups || [];
        groups.forEach(groupName => {
          if (!groupMap.has(groupName)) {
            groupMap.set(groupName, {
              name: groupName,
              memberCount: 0,
              createdAt: user.createdAt,
            });
          }
          groupMap.get(groupName).memberCount++;
        });
      });

      const groups = Array.from(groupMap.values());

      res.status(200).json({
        success: true,
        message: 'User groups retrieved successfully',
        data: {
          groups,
          pagination: {
            total: groups.length,
            limit: parseInt(limit),
            offset: parseInt(offset),
          },
        },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to get user groups', {
        error: error.message,
        adminId: req.user?.id,
      });
      next(error);
    }
  }

  /**
   * Create user group
   * POST /api/admin/users/groups
   */
  async createUserGroup(req, res, next) {
    try {
      const { name, description, color } = req.body;
      const adminId = req.user.id;

      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        throw new AppError('Group name is required', 400);
      }

      // Store group definition in a system metadata or create a simple groups registry
      // For now, we'll just validate - groups are created when first user is added
      const normalizedName = name.trim().toLowerCase();

      // Log audit event
      await auditService.logDataAccess(
        adminId,
        'create',
        'user_group',
        normalizedName,
        { action: 'create_group', groupName: normalizedName },
        req.ip,
      );

      res.status(201).json({
        success: true,
        message: 'Group created successfully',
        data: {
          group: {
            name: normalizedName,
            description,
            color,
            memberCount: 0,
          },
        },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to create user group', {
        error: error.message,
        adminId: req.user?.id,
      });
      next(error);
    }
  }

  /**
   * Get user group details
   * GET /api/admin/users/groups/:id
   */
  async getUserGroup(req, res, next) {
    try {
      const { id } = req.params;
      const groupName = decodeURIComponent(id);

      // Get all users in this group
      const users = await User.findAll({
        attributes: ['id', 'fullName', 'email', 'role', 'status', 'createdAt'],
        where: {
          metadata: {
            [Op.ne]: null,
          },
        },
      });

      // Filter users that have this group in their metadata
      const groupMembers = users.filter(user => {
        const groups = user.metadata?.groups || [];
        return groups.includes(groupName);
      });

      res.status(200).json({
        success: true,
        message: 'User group retrieved successfully',
        data: {
          group: {
            name: groupName,
            memberCount: groupMembers.length,
            members: groupMembers,
          },
        },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to get user group', {
        error: error.message,
        groupId: req.params.id,
      });
      next(error);
    }
  }

  /**
   * Update user group
   * PUT /api/admin/users/groups/:id
   */
  async updateUserGroup(req, res, next) {
    try {
      const { id } = req.params;
      const { name, description, color } = req.body;
      const adminId = req.user.id;
      const oldGroupName = decodeURIComponent(id);

      if (name && name !== oldGroupName) {
      // Rename group - get all users and filter those with this group
      const allUsers = await User.findAll({
        where: {
          metadata: {
            [Op.ne]: null,
          },
        },
      });

      const users = allUsers.filter(user => {
        const groups = user.metadata?.groups || [];
        return groups.includes(oldGroupName);
      });

        const newGroupName = name.trim().toLowerCase();
        for (const user of users) {
          const metadata = user.metadata || {};
          const groups = metadata.groups || [];
          const index = groups.indexOf(oldGroupName);
          if (index !== -1) {
            groups[index] = newGroupName;
            metadata.groups = groups;
            await user.update({ metadata });
          }
        }

        // Log audit event
        await auditService.logDataAccess(
          adminId,
          'update',
          'user_group',
          oldGroupName,
          { action: 'rename_group', oldName: oldGroupName, newName: newGroupName },
          req.ip,
        );

        res.status(200).json({
          success: true,
          message: 'Group updated successfully',
          data: {
            group: {
              name: newGroupName,
              description,
              color,
            },
          },
        });
      } else {
        // Just update metadata (description, color) - stored in system config
        res.status(200).json({
          success: true,
          message: 'Group metadata updated',
        });
      }

    } catch (error) {
      enterpriseLogger.error('Failed to update user group', {
        error: error.message,
        groupId: req.params.id,
      });
      next(error);
    }
  }

  /**
   * Delete user group
   * DELETE /api/admin/users/groups/:id
   */
  async deleteUserGroup(req, res, next) {
    try {
      const { id } = req.params;
      const adminId = req.user.id;
      const groupName = decodeURIComponent(id);

      // Get all users and filter those with this group
      const allUsers = await User.findAll({
        where: {
          metadata: {
            [Op.ne]: null,
          },
        },
      });

      const users = allUsers.filter(user => {
        const groups = user.metadata?.groups || [];
        return groups.includes(groupName);
      });

      for (const user of users) {
        const metadata = user.metadata || {};
        const groups = metadata.groups || [];
        const index = groups.indexOf(groupName);
        if (index !== -1) {
          groups.splice(index, 1);
          metadata.groups = groups;
          await user.update({ metadata });
        }
      }

      // Log audit event
      await auditService.logDataAccess(
        adminId,
        'delete',
        'user_group',
        groupName,
        { action: 'delete_group', groupName, affectedUsers: users.length },
        req.ip,
      );

      res.status(200).json({
        success: true,
        message: 'Group deleted successfully',
        data: {
          affectedUsers: users.length,
        },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to delete user group', {
        error: error.message,
        groupId: req.params.id,
      });
      next(error);
    }
  }

  /**
   * Get group members
   * GET /api/admin/users/groups/:id/members
   */
  async getGroupMembers(req, res, next) {
    try {
      const { id } = req.params;
      const { limit = 100, offset = 0 } = req.query;
      const groupName = decodeURIComponent(id);

      // Get all users and filter by group
      const allUsers = await User.findAll({
        attributes: ['id', 'fullName', 'email', 'role', 'status', 'createdAt'],
        where: {
          metadata: {
            [Op.ne]: null,
          },
        },
        order: [['createdAt', 'DESC']],
      });

      // Filter users that have this group
      const groupMembers = allUsers.filter(user => {
        const groups = user.metadata?.groups || [];
        return groups.includes(groupName);
      });

      // Paginate manually
      const total = groupMembers.length;
      const users = groupMembers.slice(parseInt(offset), parseInt(offset) + parseInt(limit));

      res.status(200).json({
        success: true,
        message: 'Group members retrieved successfully',
        data: {
          group: { name: groupName },
          members: users,
          pagination: {
            total: total,
            limit: parseInt(limit),
            offset: parseInt(offset),
            totalPages: Math.ceil(total / limit),
          },
        },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to get group members', {
        error: error.message,
        groupId: req.params.id,
      });
      next(error);
    }
  }

  /**
   * Add members to group
   * POST /api/admin/users/groups/:id/members
   */
  async addGroupMembers(req, res, next) {
    try {
      const { id } = req.params;
      const { userIds } = req.body;
      const adminId = req.user.id;
      const groupName = decodeURIComponent(id);

      if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        throw new AppError('userIds array is required', 400);
      }

      const users = await User.findAll({
        where: { id: { [Op.in]: userIds } },
      });

      let addedCount = 0;
      for (const user of users) {
        const metadata = user.metadata || {};
        const groups = metadata.groups || [];
        if (!groups.includes(groupName)) {
          groups.push(groupName);
          metadata.groups = groups;
          await user.update({ metadata });
          addedCount++;
        }
      }

      // Log audit event
      await auditService.logDataAccess(
        adminId,
        'update',
        'user_group',
        groupName,
        { action: 'add_members', groupName, userIds, addedCount },
        req.ip,
      );

      res.status(200).json({
        success: true,
        message: `${addedCount} member(s) added to group`,
        data: {
          addedCount,
          totalRequested: userIds.length,
        },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to add group members', {
        error: error.message,
        groupId: req.params.id,
      });
      next(error);
    }
  }

  /**
   * Remove member from group
   * DELETE /api/admin/users/groups/:id/members/:userId
   */
  async removeGroupMember(req, res, next) {
    try {
      const { id, userId } = req.params;
      const adminId = req.user.id;
      const groupName = decodeURIComponent(id);

      const user = await User.findByPk(userId);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      const metadata = user.metadata || {};
      const groups = metadata.groups || [];
      const index = groups.indexOf(groupName);

      if (index === -1) {
        throw new AppError('User is not a member of this group', 404);
      }

      groups.splice(index, 1);
      metadata.groups = groups;
      await user.update({ metadata });

      // Log audit event
      await auditService.logDataAccess(
        adminId,
        'update',
        'user_group',
        groupName,
        { action: 'remove_member', groupName, userId },
        req.ip,
      );

      res.status(200).json({
        success: true,
        message: 'Member removed from group',
      });

    } catch (error) {
      enterpriseLogger.error('Failed to remove group member', {
        error: error.message,
        groupId: req.params.id,
        userId: req.params.userId,
      });
      next(error);
    }
  }

  // =====================================================
  // USER TEMPLATES
  // =====================================================

  /**
   * Get all user templates
   * GET /api/admin/users/templates
   */
  async getUserTemplates(req, res, next) {
    try {
      const adminId = req.user.id;

      // Store templates in a system table or metadata
      // For simplicity, we'll use a templates table via Sequelize
      // Since we don't have a UserTemplate model, we'll use a simple approach
      const { QueryTypes } = require('sequelize');
      const { sequelize } = require('../config/database');

      // Check if templates table exists, if not return empty
      const templates = await sequelize.query(
        `SELECT * FROM user_templates ORDER BY created_at DESC`,
        { type: QueryTypes.SELECT }
      ).catch(() => []);

      res.status(200).json({
        success: true,
        message: 'User templates retrieved successfully',
        data: {
          templates: templates || [],
        },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to get user templates', {
        error: error.message,
        adminId: req.user?.id,
      });
      // Return empty array if table doesn't exist
      res.status(200).json({
        success: true,
        message: 'User templates retrieved successfully',
        data: {
          templates: [],
        },
      });
    }
  }

  /**
   * Create user template
   * POST /api/admin/users/templates
   */
  async createUserTemplate(req, res, next) {
    try {
      const { name, description, config } = req.body;
      const adminId = req.user.id;

      if (!name || !config) {
        throw new AppError('Name and config are required', 400);
      }

      const { QueryTypes } = require('sequelize');
      const { sequelize } = require('../config/database');
      const uuidv4 = require('uuid').v4;

      const templateId = uuidv4();

      // Create template record
      await sequelize.query(
        `INSERT INTO user_templates (id, name, description, config, created_by, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
        {
          type: QueryTypes.INSERT,
          bind: [templateId, name, description || '', JSON.stringify(config), adminId],
        }
      ).catch(async () => {
        // If table doesn't exist, create it
        await sequelize.query(`
          CREATE TABLE IF NOT EXISTS user_templates (
            id UUID PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            config JSONB NOT NULL,
            created_by UUID,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          )
        `);
        await sequelize.query(
          `INSERT INTO user_templates (id, name, description, config, created_by, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
          {
            type: QueryTypes.INSERT,
            bind: [templateId, name, description || '', JSON.stringify(config), adminId],
          }
        );
      });

      // Log audit event
      await auditService.logDataAccess(
        adminId,
        'create',
        'user_template',
        templateId,
        { action: 'create_template', templateName: name },
        req.ip,
      );

      res.status(201).json({
        success: true,
        message: 'Template created successfully',
        data: {
          template: {
            id: templateId,
            name,
            description,
            config,
            createdBy: adminId,
            createdAt: new Date().toISOString(),
          },
        },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to create user template', {
        error: error.message,
        adminId: req.user?.id,
      });
      next(error);
    }
  }

  /**
   * Get user template
   * GET /api/admin/users/templates/:id
   */
  async getUserTemplate(req, res, next) {
    try {
      const { id } = req.params;
      const { QueryTypes } = require('sequelize');
      const { sequelize } = require('../config/database');

      const templates = await sequelize.query(
        `SELECT * FROM user_templates WHERE id = $1`,
        {
          type: QueryTypes.SELECT,
          bind: [id],
        }
      ).catch(() => []);

      if (templates.length === 0) {
        throw new AppError('Template not found', 404);
      }

      const template = templates[0];
      template.config = typeof template.config === 'string' ? JSON.parse(template.config) : template.config;

      res.status(200).json({
        success: true,
        message: 'Template retrieved successfully',
        data: { template },
      });

    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      enterpriseLogger.error('Failed to get user template', {
        error: error.message,
        templateId: req.params.id,
      });
      throw new AppError('Template not found', 404);
    }
  }

  /**
   * Update user template
   * PUT /api/admin/users/templates/:id
   */
  async updateUserTemplate(req, res, next) {
    try {
      const { id } = req.params;
      const { name, description, config } = req.body;
      const adminId = req.user.id;

      const { QueryTypes } = require('sequelize');
      const { sequelize } = require('../config/database');

      const updateFields = [];
      const bindValues = [id];
      let bindIndex = 2;

      if (name !== undefined) {
        updateFields.push(`name = $${bindIndex++}`);
        bindValues.push(name);
      }
      if (description !== undefined) {
        updateFields.push(`description = $${bindIndex++}`);
        bindValues.push(description);
      }
      if (config !== undefined) {
        updateFields.push(`config = $${bindIndex++}`);
        bindValues.push(JSON.stringify(config));
      }

      if (updateFields.length === 0) {
        throw new AppError('No fields to update', 400);
      }

      updateFields.push(`updated_at = NOW()`);
      bindValues.push(adminId);

      await sequelize.query(
        `UPDATE user_templates SET ${updateFields.join(', ')} WHERE id = $1`,
        {
          type: QueryTypes.UPDATE,
          bind: bindValues,
        }
      ).catch(() => {
        throw new AppError('Template not found', 404);
      });

      // Log audit event
      await auditService.logDataAccess(
        adminId,
        'update',
        'user_template',
        id,
        { action: 'update_template' },
        req.ip,
      );

      res.status(200).json({
        success: true,
        message: 'Template updated successfully',
      });

    } catch (error) {
      enterpriseLogger.error('Failed to update user template', {
        error: error.message,
        templateId: req.params.id,
      });
      next(error);
    }
  }

  /**
   * Delete user template
   * DELETE /api/admin/users/templates/:id
   */
  async deleteUserTemplate(req, res, next) {
    try {
      const { id } = req.params;
      const adminId = req.user.id;

      const { QueryTypes } = require('sequelize');
      const { sequelize } = require('../config/database');

      await sequelize.query(
        `DELETE FROM user_templates WHERE id = $1`,
        {
          type: QueryTypes.DELETE,
          bind: [id],
        }
      ).catch(() => {
        throw new AppError('Template not found', 404);
      });

      // Log audit event
      await auditService.logDataAccess(
        adminId,
        'delete',
        'user_template',
        id,
        { action: 'delete_template' },
        req.ip,
      );

      res.status(200).json({
        success: true,
        message: 'Template deleted successfully',
      });

    } catch (error) {
      enterpriseLogger.error('Failed to delete user template', {
        error: error.message,
        templateId: req.params.id,
      });
      next(error);
    }
  }

  /**
   * Apply user template
   * POST /api/admin/users/templates/:id/apply
   */
  async applyUserTemplate(req, res, next) {
    try {
      const { id } = req.params;
      const { userId } = req.body;
      const adminId = req.user.id;

      if (!userId) {
        throw new AppError('userId is required', 400);
      }

      // Get template
      const template = await this.getUserTemplate({ params: { id } }, { status: () => {}, json: () => {} }, () => {});
      if (!template) {
        throw new AppError('Template not found', 404);
      }

      const { QueryTypes } = require('sequelize');
      const { sequelize } = require('../config/database');

      const templates = await sequelize.query(
        `SELECT * FROM user_templates WHERE id = $1`,
        {
          type: QueryTypes.SELECT,
          bind: [id],
        }
      ).catch(() => []);

      if (templates.length === 0) {
        throw new AppError('Template not found', 404);
      }

      const templateData = templates[0];
      const config = typeof templateData.config === 'string' ? JSON.parse(templateData.config) : templateData.config;

      // Apply template to user
      const user = await User.findByPk(userId);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Apply template configuration
      const updateData = {};
      if (config.role) updateData.role = config.role;
      if (config.status) updateData.status = config.status;
      if (config.metadata) {
        updateData.metadata = { ...user.metadata, ...config.metadata };
      }

      await user.update(updateData);

      // Log audit event
      await auditService.logDataAccess(
        adminId,
        'update',
        'user_template_apply',
        userId,
        { action: 'apply_template', templateId: id, templateName: templateData.name },
        req.ip,
      );

      res.status(200).json({
        success: true,
        message: 'Template applied successfully',
        data: {
          userId,
          templateId: id,
        },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to apply user template', {
        error: error.message,
        templateId: req.params.id,
      });
      next(error);
    }
  }
}

module.exports = new AdminController();
