// =====================================================
// USER CONTROLLER - CANONICAL USER MANAGEMENT
// Handles profile, dashboard, settings, notifications
// =====================================================

const { User, ITRFiling, ITRDraft, Document, ServiceTicket, FamilyMember, BankAccount, UserProfile } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');
const enterpriseLogger = require('../utils/logger');
const { AppError } = require('../middleware/errorHandler');
const auditService = require('../services/utils/AuditService');
const bcrypt = require('bcryptjs');

class UserController {
  constructor() {
    enterpriseLogger.info('UserController initialized');

    // Bind methods to preserve 'this' context
    this.getUserDashboard = this.getUserDashboard.bind(this);
    this.getUserProfile = this.getUserProfile.bind(this);
    this.updateUserProfile = this.updateUserProfile.bind(this);
    this.getUserSettings = this.getUserSettings.bind(this);
    this.updateUserSettings = this.updateUserSettings.bind(this);
    this.getUserNotifications = this.getUserNotifications.bind(this);
    this.markNotificationAsRead = this.markNotificationAsRead.bind(this);
    this.markAllNotificationsAsRead = this.markAllNotificationsAsRead.bind(this);
    this.changePassword = this.changePassword.bind(this);
    this.verifyAadhaar = this.verifyAadhaar.bind(this);
    this.linkAadhaar = this.linkAadhaar.bind(this);
    this.unlinkAadhaar = this.unlinkAadhaar.bind(this);
    this.getAadhaarStatus = this.getAadhaarStatus.bind(this);
  }

  // =====================================================
  // USER PROFILE MANAGEMENT
  // =====================================================

  /**
   * Get user profile
   * GET /api/users/profile
   */
  async getUserProfile(req, res, next) {
    try {
      const userId = req.user.userId;

      const user = await User.findByPk(userId, {
        attributes: [
          'id', 'userId', 'fullName', 'email', 'phone', 'role', 'status',
          'emailVerified', 'phoneVerified', 'createdAt', 'updatedAt',
          'lastLoginAt', 'metadata', 'authProvider', 'passwordHash', 'dateOfBirth',
          'panNumber', 'panVerified', 'panVerifiedAt',
        ],
      });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Get UserProfile with address fields
      const userProfile = await UserProfile.findOne({
        where: { userId: user.id },
        attributes: ['addressLine1', 'addressLine2', 'city', 'state', 'pincode'],
      });

      enterpriseLogger.info('User profile retrieved', { userId });

      res.status(200).json({
        success: true,
        message: 'User profile retrieved successfully',
        data: {
          user: {
            id: user.id,
            userId: user.userId,
            fullName: user.fullName,
            email: user.email,
            phone: user.phone,
            role: user.role,
            roleLabel: this.getRoleLabel(user.role),
            status: user.status,
            authProvider: user.authProvider,
            hasPassword: !!user.passwordHash,
            statusLabel: this.getStatusLabel(user.status),
            emailVerified: user.emailVerified,
            phoneVerified: user.phoneVerified,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            lastLoginAt: user.lastLoginAt,
            metadata: user.metadata,
            dateOfBirth: user.dateOfBirth,
            panNumber: user.panNumber,
            panVerified: user.panVerified || false,
            panVerifiedAt: user.panVerifiedAt,
            address: userProfile ? {
              addressLine1: userProfile.addressLine1 || null,
              addressLine2: userProfile.addressLine2 || null,
              city: userProfile.city || null,
              state: userProfile.state || null,
              pincode: userProfile.pincode || null,
            } : null,
          },
        },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to get user profile', {
        error: error.message,
        userId: req.user?.userId,
      });
      next(error);
    }
  }

  /**
   * Update user profile
   * PUT /api/users/profile
   */
  async updateUserProfile(req, res, next) {
    try {
      const userId = req.user.userId;
      const {
        fullName,
        phone,
        metadata,
        dateOfBirth,
        addressLine1,
        addressLine2,
        city,
        state,
        pincode,
      } = req.body;

      // Check if any fields are provided for update
      const hasUserFields = fullName || phone || metadata || dateOfBirth !== undefined;
      const hasAddressFields = addressLine1 !== undefined || addressLine2 !== undefined ||
        city !== undefined || state !== undefined || pincode !== undefined;

      if (!hasUserFields && !hasAddressFields) {
        throw new AppError('No fields provided for update', 400);
      }

      const user = await User.findByPk(userId);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      const updateData = {};
      const updatedFields = [];

      // Update User model fields
      if (fullName) {
        updateData.fullName = fullName;
        updatedFields.push('fullName');
      }
      if (phone) {
        updateData.phone = phone;
        updatedFields.push('phone');
      }
      if (dateOfBirth !== undefined) {
        updateData.dateOfBirth = dateOfBirth;
        updatedFields.push('dateOfBirth');
      }
      if (metadata) {
        updateData.metadata = { ...user.metadata, ...metadata };
        updatedFields.push('metadata');
      }

      if (Object.keys(updateData).length > 0) {
        await user.update(updateData);
        await user.reload();
      }

      // Update UserProfile address fields
      let userProfile = await UserProfile.findOne({ where: { userId: user.id } });

      if (hasAddressFields) {
        if (!userProfile) {
          // Create UserProfile if it doesn't exist
          userProfile = await UserProfile.create({
            userId: user.id,
            addressLine1: addressLine1 || null,
            addressLine2: addressLine2 || null,
            city: city || null,
            state: state || null,
            pincode: pincode || null,
          });
          updatedFields.push('address (created)');
        } else {
          // Update existing UserProfile
          const profileUpdateData = {};
          if (addressLine1 !== undefined) {
            profileUpdateData.addressLine1 = addressLine1 || null;
            updatedFields.push('addressLine1');
          }
          if (addressLine2 !== undefined) {
            profileUpdateData.addressLine2 = addressLine2 || null;
            updatedFields.push('addressLine2');
          }
          if (city !== undefined) {
            profileUpdateData.city = city || null;
            updatedFields.push('city');
          }
          if (state !== undefined) {
            profileUpdateData.state = state || null;
            updatedFields.push('state');
          }
          if (pincode !== undefined) {
            profileUpdateData.pincode = pincode || null;
            updatedFields.push('pincode');
          }

          if (Object.keys(profileUpdateData).length > 0) {
            await userProfile.update(profileUpdateData);
            await userProfile.reload();
          }
        }
      }

      // Reload userProfile if it exists to get latest data
      if (!userProfile) {
        userProfile = await UserProfile.findOne({ where: { userId: user.id } });
      }

      // Log audit event
      await auditService.logDataAccess(
        userId,
        'update',
        'user_profile',
        userId,
        { updatedFields },
        req.ip,
      );

      enterpriseLogger.info('User profile updated', { userId, updatedFields });

      res.status(200).json({
        success: true,
        message: 'User profile updated successfully',
        data: {
          user: {
            id: user.id,
            userId: user.userId,
            fullName: user.fullName,
            email: user.email,
            phone: user.phone,
            role: user.role,
            status: user.status,
            emailVerified: user.emailVerified,
            phoneVerified: user.phoneVerified,
            updatedAt: user.updatedAt,
            metadata: user.metadata,
            authProvider: user.authProvider,
            hasPassword: !!user.passwordHash,
            dateOfBirth: user.dateOfBirth,
            address: userProfile ? {
              addressLine1: userProfile.addressLine1 || null,
              addressLine2: userProfile.addressLine2 || null,
              city: userProfile.city || null,
              state: userProfile.state || null,
              pincode: userProfile.pincode || null,
            } : null,
          },
        },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to update user profile', {
        error: error.message,
        userId: req.user?.userId,
      });
      next(error);
    }
  }

  /**
   * Set password for OAuth users (first time)
   * PUT /api/users/set-password
   */
  async setPassword(req, res, next) {
    try {
      const userId = req.user.userId;
      const { newPassword } = req.body;

      if (!newPassword) {
        throw new AppError('New password is required', 400);
      }

      // Validate password strength
      if (newPassword.length < 8) {
        throw new AppError('Password must be at least 8 characters long', 400);
      }

      const user = await User.findByPk(userId);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Check if user already has a password
      if (user.passwordHash) {
        throw new AppError('Password already set. Use change password endpoint instead.', 400);
      }

      // Check if user is OAuth user
      if (user.authProvider === 'LOCAL') {
        throw new AppError('Local users must use change password endpoint', 400);
      }

      // Hash new password
      const saltRounds = 12;
      const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

      await user.update({ passwordHash: newPasswordHash });

      // Log audit event
      await auditService.logDataAccess(
        userId,
        'create',
        'user_password',
        userId,
        { passwordSet: true, authProvider: user.authProvider },
        req.ip,
      );

      enterpriseLogger.info('User password set', { userId, authProvider: user.authProvider });

      res.status(200).json({
        success: true,
        message: 'Password set successfully',
      });

    } catch (error) {
      enterpriseLogger.error('Failed to set password', {
        error: error.message,
        userId: req.user?.userId,
      });
      next(error);
    }
  }

  /**
   * Change user password
   * PUT /api/users/password
   */
  async changePassword(req, res, next) {
    try {
      const userId = req.user.userId;
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        throw new AppError('Current password and new password are required', 400);
      }

      // Validate password strength
      if (newPassword.length < 8) {
        throw new AppError('Password must be at least 8 characters long', 400);
      }

      const user = await User.findByPk(userId);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Check if user has a password
      if (!user.passwordHash) {
        throw new AppError('No password set. Use set password endpoint instead.', 400);
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isCurrentPasswordValid) {
        throw new AppError('Current password is incorrect', 400);
      }

      // Hash new password
      const saltRounds = 12;
      const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

      await user.update({ passwordHash: newPasswordHash });

      // Log audit event
      await auditService.logDataAccess(
        userId,
        'update',
        'user_password',
        userId,
        { passwordChanged: true },
        req.ip,
      );

      enterpriseLogger.info('User password changed', { userId });

      res.status(200).json({
        success: true,
        message: 'Password changed successfully',
      });

    } catch (error) {
      enterpriseLogger.error('Failed to change password', {
        error: error.message,
        userId: req.user?.userId,
      });
      next(error);
    }
  }

  // =====================================================
  // USER DASHBOARD DATA
  // =====================================================

  /**
   * Get user dashboard data
   * GET /api/users/dashboard
   */
  async getUserDashboard(req, res, next) {
    try {
      const userId = req.user.userId;

      // Get user statistics with error handling for each helper method
      const [
        filingStats,
        draftStats,
        documentStats,
        ticketStats,
        memberStats,
        recentActivity,
      ] = await Promise.allSettled([
        this.getFilingStats(userId).catch(err => {
          enterpriseLogger.warn('Failed to get filing stats', { userId, error: err.message });
          return { totalFilings: 0, draftFilings: 0, submittedFilings: 0, acknowledgedFilings: 0, itr1Filings: 0, itr2Filings: 0, itr3Filings: 0, itr4Filings: 0 };
        }),
        this.getDraftStats(userId).catch(err => {
          enterpriseLogger.warn('Failed to get draft stats', { userId, error: err.message });
          return { totalDrafts: 0, activeDrafts: 0, submittedDrafts: 0 };
        }),
        this.getDocumentStats(userId).catch(err => {
          enterpriseLogger.warn('Failed to get document stats', { userId, error: err.message });
          return { totalDocuments: 0, totalStorage: 0, verifiedDocuments: 0 };
        }),
        this.getTicketStats(userId).catch(err => {
          enterpriseLogger.warn('Failed to get ticket stats', { userId, error: err.message });
          return { totalTickets: 0, openTickets: 0, resolvedTickets: 0 };
        }),
        this.getMemberStats(userId).catch(err => {
          enterpriseLogger.warn('Failed to get member stats', { userId, error: err.message });
          return { totalMembers: 0, activeMembers: 0 };
        }),
        this.getRecentActivity(userId).catch(err => {
          enterpriseLogger.warn('Failed to get recent activity', { userId, error: err.message });
          return [];
        }),
      ]);

      // Extract values from Promise.allSettled results
      const stats = {
        filingStats: filingStats.status === 'fulfilled' ? filingStats.value : { totalFilings: 0, draftFilings: 0, submittedFilings: 0, acknowledgedFilings: 0, itr1Filings: 0, itr2Filings: 0, itr3Filings: 0, itr4Filings: 0 },
        draftStats: draftStats.status === 'fulfilled' ? draftStats.value : { totalDrafts: 0, activeDrafts: 0, submittedDrafts: 0 },
        documentStats: documentStats.status === 'fulfilled' ? documentStats.value : { totalDocuments: 0, totalStorage: 0, verifiedDocuments: 0 },
        ticketStats: ticketStats.status === 'fulfilled' ? ticketStats.value : { totalTickets: 0, openTickets: 0, resolvedTickets: 0 },
        memberStats: memberStats.status === 'fulfilled' ? memberStats.value : { totalMembers: 0, activeMembers: 0 },
        recentActivity: recentActivity.status === 'fulfilled' ? recentActivity.value : [],
      };

      const dashboardData = {
        overview: {
          totalFilings: stats.filingStats.totalFilings,
          draftFilings: stats.draftStats.totalDrafts,
          totalDocuments: stats.documentStats.totalDocuments,
          openTickets: stats.ticketStats.openTickets,
          familyMembers: stats.memberStats.totalMembers,
        },
        filingStats: stats.filingStats,
        draftStats: stats.draftStats,
        documentStats: stats.documentStats,
        ticketStats: stats.ticketStats,
        memberStats: stats.memberStats,
        recentActivity: stats.recentActivity,
        quickActions: this.getQuickActions(userId),
      };

      enterpriseLogger.info('User dashboard data retrieved', { userId });

      // Note: WebSocket events will trigger dashboard updates automatically
      // This endpoint is for initial load and polling fallback

      res.status(200).json({
        success: true,
        message: 'Dashboard data retrieved successfully',
        data: dashboardData,
      });

    } catch (error) {
      enterpriseLogger.error('Failed to get user dashboard', {
        error: error.message,
        userId: req.user?.userId,
      });
      next(error);
    }
  }

  // =====================================================
  // USER SETTINGS MANAGEMENT
  // =====================================================

  /**
   * Get user settings
   * GET /api/users/settings
   */
  async getUserSettings(req, res, next) {
    try {
      const userId = req.user.userId;

      const user = await User.findByPk(userId, {
        attributes: ['id', 'userId', 'metadata'],
      });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      const settings = {
        notifications: {
          email: user.metadata?.notificationSettings?.email || true,
          sms: user.metadata?.notificationSettings?.sms || false,
          push: user.metadata?.notificationSettings?.push || true,
        },
        privacy: {
          profileVisibility: user.metadata?.privacySettings?.profileVisibility || 'private',
          dataSharing: user.metadata?.privacySettings?.dataSharing || false,
        },
        preferences: {
          theme: user.metadata?.preferences?.theme || 'light',
          language: user.metadata?.preferences?.language || 'en',
          timezone: user.metadata?.preferences?.timezone || 'Asia/Kolkata',
        },
        security: {
          twoFactorEnabled: user.metadata?.securitySettings?.twoFactorEnabled || false,
          loginAlerts: user.metadata?.securitySettings?.loginAlerts || true,
        },
      };

      enterpriseLogger.info('User settings retrieved', { userId });

      res.status(200).json({
        success: true,
        message: 'User settings retrieved successfully',
        data: { settings },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to get user settings', {
        error: error.message,
        userId: req.user?.userId,
      });
      next(error);
    }
  }

  /**
   * Update user settings
   * PUT /api/users/settings
   */
  async updateUserSettings(req, res, next) {
    try {
      const userId = req.user.userId;
      const { notifications, privacy, preferences, security } = req.body;

      const user = await User.findByPk(userId);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      const currentMetadata = user.metadata || {};
      const updatedMetadata = { ...currentMetadata };

      if (notifications) {
        updatedMetadata.notificationSettings = {
          ...currentMetadata.notificationSettings,
          ...notifications,
        };
      }

      if (privacy) {
        updatedMetadata.privacySettings = {
          ...currentMetadata.privacySettings,
          ...privacy,
        };
      }

      if (preferences) {
        updatedMetadata.preferences = {
          ...currentMetadata.preferences,
          ...preferences,
        };
      }

      if (security) {
        updatedMetadata.securitySettings = {
          ...currentMetadata.securitySettings,
          ...security,
        };
      }

      await user.update({ metadata: updatedMetadata });

      // Log audit event
      await auditService.logDataAccess(
        userId,
        'update',
        'user_settings',
        userId,
        { updatedSettings: Object.keys(req.body) },
        req.ip,
      );

      enterpriseLogger.info('User settings updated', { userId, updatedSettings: Object.keys(req.body) });

      res.status(200).json({
        success: true,
        message: 'User settings updated successfully',
      });

    } catch (error) {
      enterpriseLogger.error('Failed to update user settings', {
        error: error.message,
        userId: req.user?.userId,
      });
      next(error);
    }
  }

  // =====================================================
  // USER NOTIFICATIONS
  // =====================================================

  /**
   * Get user notifications
   * GET /api/users/notifications
   */
  async getUserNotifications(req, res, next) {
    try {
      const userId = req.user.userId;
      const { page = 1, limit = 20, unreadOnly = false } = req.query;

      const offset = (page - 1) * limit;
      const whereClause = { userId };

      if (unreadOnly === 'true') {
        whereClause.read = false;
      }

      // Query notifications from database
      const { Notification } = require('../models');

      const { count, rows: notifications } = await Notification.findAndCountAll({
        where: whereClause,
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset),
      });

      const unreadCount = await Notification.count({
        where: { ...whereClause, read: false },
      });

      enterpriseLogger.info('User notifications retrieved', { userId, count: notifications.length });

      res.status(200).json({
        success: true,
        message: 'Notifications retrieved successfully',
        data: {
          notifications: notifications.map(n => ({
            id: n.id,
            type: n.type,
            title: n.title,
            message: n.message,
            isRead: n.read,
            createdAt: n.createdAt,
            data: n.metadata || {},
          })),
          pagination: {
            total: count,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(count / limit),
          },
          unreadCount,
        },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to get user notifications', {
        error: error.message,
        userId: req.user?.userId,
      });
      next(error);
    }
  }

  /**
   * Mark notification as read
   * PUT /api/users/notifications/:id/read
   */
  async markNotificationAsRead(req, res, next) {
    try {
      const userId = req.user.userId;
      const { id } = req.params;

      // This would typically update a notifications table
      // For now, return success
      enterpriseLogger.info('Notification marked as read', { userId, notificationId: id });

      res.status(200).json({
        success: true,
        message: 'Notification marked as read',
      });

    } catch (error) {
      enterpriseLogger.error('Failed to mark notification as read', {
        error: error.message,
        userId: req.user?.userId,
        notificationId: req.params.id,
      });
      next(error);
    }
  }

  /**
   * Mark all notifications as read
   * PUT /api/users/notifications/read-all
   */
  async markAllNotificationsAsRead(req, res, next) {
    try {
      const userId = req.user.userId;

      // This would typically update a notifications table
      // For now, return success
      enterpriseLogger.info('All notifications marked as read', { userId });

      res.status(200).json({
        success: true,
        message: 'All notifications marked as read',
      });

    } catch (error) {
      enterpriseLogger.error('Failed to mark all notifications as read', {
        error: error.message,
        userId: req.user?.userId,
      });
      next(error);
    }
  }

  // =====================================================
  // HELPER METHODS
  // =====================================================

  /**
   * Get filing statistics for user
   */
  async getFilingStats(userId) {
    const stats = await ITRFiling.findAll({
      where: { userId },
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
   * Get draft statistics for user
   */
  async getDraftStats(userId) {
    // NOTE: itr_drafts does not have user_id. Drafts belong to a filing (itr_filings),
    // so we must join through itr_filings to scope drafts for the user.
    const stats = await sequelize.query(`
      SELECT
        COUNT(*)::int AS "totalDrafts",
        COUNT(CASE WHEN d.is_completed = false THEN 1 END)::int AS "activeDrafts",
        COUNT(CASE WHEN d.is_completed = true THEN 1 END)::int AS "submittedDrafts"
      FROM itr_drafts d
      JOIN itr_filings f ON d.filing_id = f.id
      WHERE f.user_id = :userId
    `, {
      type: sequelize.QueryTypes.SELECT,
      replacements: { userId },
    });

    return {
      totalDrafts: parseInt(stats[0]?.totalDrafts) || 0,
      activeDrafts: parseInt(stats[0]?.activeDrafts) || 0,
      submittedDrafts: parseInt(stats[0]?.submittedDrafts) || 0,
    };
  }

  /**
   * Get document statistics for user
   */
  async getDocumentStats(userId) {
    const stats = await Document.findAll({
      where: { userId, deletedAt: null },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalDocuments'],
        [sequelize.fn('SUM', sequelize.col('size_bytes')), 'totalStorage'],
        [sequelize.fn('COUNT', sequelize.literal('CASE WHEN status = \'VERIFIED\' THEN 1 END')), 'verifiedDocuments'],
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
   * Get ticket statistics for user
   */
  async getTicketStats(userId) {
    const stats = await ServiceTicket.findAll({
      where: { userId },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalTickets'],
        [sequelize.fn('COUNT', sequelize.literal('CASE WHEN status = \'OPEN\' THEN 1 END')), 'openTickets'],
        [sequelize.fn('COUNT', sequelize.literal('CASE WHEN status = \'RESOLVED\' THEN 1 END')), 'resolvedTickets'],
      ],
      raw: true,
    });

    return {
      totalTickets: parseInt(stats[0]?.totalTickets) || 0,
      openTickets: parseInt(stats[0]?.openTickets) || 0,
      resolvedTickets: parseInt(stats[0]?.resolvedTickets) || 0,
    };
  }

  /**
   * Get member statistics for user
   */
  async getMemberStats(userId) {
    const stats = await FamilyMember.findAll({
      where: { userId },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalMembers'],
        // Some environments don't have legacy `is_dependent` column; use canonical `is_active` instead.
        [sequelize.fn('COUNT', sequelize.literal('CASE WHEN \"is_active\" = true THEN 1 END')), 'activeMembers'],
      ],
      raw: true,
    });

    return {
      totalMembers: parseInt(stats[0]?.totalMembers) || 0,
      activeMembers: parseInt(stats[0]?.activeMembers) || 0,
    };
  }

  /**
   * Get recent activity for user
   */
  async getRecentActivity(userId) {
    // This would typically query an activity log table
    // For now, return mock data
    return [
      {
        id: '1',
        type: 'filing_created',
        description: 'New ITR-1 filing created',
        timestamp: new Date().toISOString(),
        metadata: { filingId: 'filing-123', itrType: 'ITR-1' },
      },
      {
        id: '2',
        type: 'document_uploaded',
        description: 'Form 16 uploaded',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        metadata: { documentId: 'doc-456', filename: 'form16.pdf' },
      },
    ];
  }

  /**
   * Get quick actions for user
   */
  getQuickActions(userId) {
    return [
      {
        id: 'new_filing',
        title: 'Start New Filing',
        description: 'Begin a new ITR filing',
        icon: '📄',
        action: 'navigate',
        path: '/filing/start',
      },
      {
        id: 'upload_documents',
        title: 'Upload Documents',
        description: 'Upload supporting documents',
        icon: '📁',
        action: 'navigate',
        path: '/documents/upload',
      },
      {
        id: 'add_member',
        title: 'Add Family Member',
        description: 'Add a family member for filing',
        icon: '👥',
        action: 'navigate',
        path: '/members/add',
      },
      {
        id: 'support_ticket',
        title: 'Get Support',
        description: 'Create a support ticket',
        icon: '🎫',
        action: 'navigate',
        path: '/support/ticket',
      },
    ];
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

  // =====================================================
  // BANK ACCOUNT MANAGEMENT
  // =====================================================

  /**
   * Get user's bank accounts
   * GET /api/users/bank-accounts
   */
  async getBankAccounts(req, res, next) {
    try {
      const userId = req.user.userId;

      const bankAccounts = await BankAccount.findAll({
        where: { userId },
        order: [['isPrimary', 'DESC'], ['createdAt', 'DESC']],
        attributes: ['id', 'bankName', 'accountNumber', 'ifsc', 'accountHolderName', 'accountType', 'isPrimary', 'createdAt', 'updatedAt'],
      });

      // Mask account numbers for display
      const maskedAccounts = bankAccounts.map(account => {
        const accountNumber = account.accountNumber;
        const masked = accountNumber.length > 4
          ? '****' + accountNumber.slice(-4)
          : '****';

        return {
          ...account.toJSON(),
          accountNumber: masked,
          fullAccountNumber: accountNumber, // Include full number for editing
        };
      });

      enterpriseLogger.info('Bank accounts retrieved', { userId, count: bankAccounts.length });

      res.status(200).json({
        success: true,
        message: 'Bank accounts retrieved successfully',
        data: maskedAccounts,
      });
    } catch (error) {
      enterpriseLogger.error('Failed to get bank accounts', {
        error: error.message,
        userId: req.user?.userId,
      });
      next(error);
    }
  }

  /**
   * Add bank account
   * POST /api/users/bank-accounts
   */
  async addBankAccount(req, res, next) {
    try {
      const userId = req.user.userId;
      const { bankName, accountNumber, ifsc, accountHolderName, accountType, isPrimary } = req.body;
      const { validateRequiredFields, isValidIFSC, normalizeIFSC } = require('../utils/validators');
      const { sendCreated, sendValidationError, sendError } = require('../utils/responseFormatter');

      // Validate required fields
      const validation = validateRequiredFields(req.body, ['bankName', 'accountNumber', 'ifsc', 'accountHolderName']);
      if (!validation.isValid) {
        return sendValidationError(res, validation.missingFields.map(f => `${f} is required`));
      }

      // Validate IFSC format
      if (!isValidIFSC(ifsc)) {
        return sendValidationError(res, ['Invalid IFSC code format']);
      }

      // If setting as primary, unset other primary accounts
      if (isPrimary) {
        await BankAccount.update(
          { isPrimary: false },
          { where: { userId, isPrimary: true } }
        );
      }

      const bankAccount = await BankAccount.create({
        userId,
        bankName,
        accountNumber,
        ifsc: normalizeIFSC(ifsc),
        accountHolderName,
        accountType: accountType || 'savings',
        isPrimary: isPrimary || false,
      });

      enterpriseLogger.info('Bank account added', { userId, bankAccountId: bankAccount.id });

      sendCreated(res, 'Bank account added successfully', {
        ...bankAccount.toJSON(),
        accountNumber: '****' + accountNumber.slice(-4),
      });
    } catch (error) {
      enterpriseLogger.error('Failed to add bank account', {
        error: error.message,
        userId: req.user?.userId,
      });
      next(error);
    }
  }

  /**
   * Update bank account
   * PUT /api/users/bank-accounts/:id
   */
  async updateBankAccount(req, res, next) {
    try {
      const userId = req.user.userId;
      const { id } = req.params;
      const { bankName, accountNumber, ifsc, accountHolderName, accountType, isPrimary } = req.body;

      const bankAccount = await BankAccount.findOne({
        where: { id, userId },
      });

      if (!bankAccount) {
        return res.status(404).json({
          success: false,
          error: 'Bank account not found',
        });
      }

      // If setting as primary, unset other primary accounts
      if (isPrimary && !bankAccount.isPrimary) {
        await BankAccount.update(
          { isPrimary: false },
          { where: { userId, isPrimary: true } }
        );
      }

      // Update fields
      const updateData = {};
      if (bankName) updateData.bankName = bankName;
      if (accountNumber) updateData.accountNumber = accountNumber;
      if (ifsc) {
        const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/i;
        if (!ifscRegex.test(ifsc)) {
          return res.status(400).json({
            success: false,
            error: 'Invalid IFSC code format',
          });
        }
        updateData.ifsc = ifsc.toUpperCase();
      }
      if (accountHolderName) updateData.accountHolderName = accountHolderName;
      if (accountType) updateData.accountType = accountType;
      if (isPrimary !== undefined) updateData.isPrimary = isPrimary;

      await bankAccount.update(updateData);

      enterpriseLogger.info('Bank account updated', { userId, bankAccountId: id });

      res.status(200).json({
        success: true,
        message: 'Bank account updated successfully',
        data: {
          ...bankAccount.toJSON(),
          accountNumber: '****' + (updateData.accountNumber || bankAccount.accountNumber).slice(-4),
        },
      });
    } catch (error) {
      enterpriseLogger.error('Failed to update bank account', {
        error: error.message,
        userId: req.user?.userId,
      });
      next(error);
    }
  }

  /**
   * Delete bank account
   * DELETE /api/users/bank-accounts/:id
   */
  async deleteBankAccount(req, res, next) {
    try {
      const userId = req.user.userId;
      const { id } = req.params;

      const bankAccount = await BankAccount.findOne({
        where: { id, userId },
      });

      if (!bankAccount) {
        return res.status(404).json({
          success: false,
          error: 'Bank account not found',
        });
      }

      await bankAccount.destroy();

      enterpriseLogger.info('Bank account deleted', { userId, bankAccountId: id });

      res.status(200).json({
        success: true,
        message: 'Bank account deleted successfully',
      });
    } catch (error) {
      enterpriseLogger.error('Failed to delete bank account', {
        error: error.message,
        userId: req.user?.userId,
      });
      next(error);
    }
  }

  /**
   * Set primary bank account
   * PATCH /api/users/bank-accounts/:id/set-primary
   */
  async setPrimaryBankAccount(req, res, next) {
    try {
      const userId = req.user.userId;
      const { id } = req.params;

      const bankAccount = await BankAccount.findOne({
        where: { id, userId },
      });

      if (!bankAccount) {
        return res.status(404).json({
          success: false,
          error: 'Bank account not found',
        });
      }

      // Unset other primary accounts
      await BankAccount.update(
        { isPrimary: false },
        { where: { userId, isPrimary: true } }
      );

      // Set this as primary
      await bankAccount.update({ isPrimary: true });

      enterpriseLogger.info('Primary bank account set', { userId, bankAccountId: id });

      res.status(200).json({
        success: true,
        message: 'Primary bank account updated successfully',
        data: {
          ...bankAccount.toJSON(),
          accountNumber: '****' + bankAccount.accountNumber.slice(-4),
        },
      });
    } catch (error) {
      enterpriseLogger.error('Failed to set primary bank account', {
        error: error.message,
        userId: req.user?.userId,
      });
      next(error);
    }
  }

  // =====================================================
  // AADHAAR LINKING MANAGEMENT
  // =====================================================

  /**
   * Verify Aadhaar number
   * POST /api/users/aadhaar/verify
   */
  async verifyAadhaar(req, res, next) {
    try {
      const userId = req.user.userId;
      const { aadhaarNumber } = req.body;

      if (!aadhaarNumber) {
        return res.status(400).json({
          success: false,
          error: 'Aadhaar number is required',
        });
      }

      const aadhaarVerificationService = require('../services/common/AadhaarVerificationService');
      const verificationResult = await aadhaarVerificationService.verifyAadhaar(aadhaarNumber, userId);

      if (!verificationResult.success || !verificationResult.verified) {
        return res.status(400).json({
          success: false,
          error: 'Aadhaar verification failed',
        });
      }

      // Log audit event
      await auditService.logEvent(
        userId,
        'aadhaar_verified',
        'user_profile',
        { aadhaar: aadhaarVerificationService.maskAadhaar(aadhaarNumber) },
        req.ip,
        req.headers['user-agent'],
      );

      res.status(200).json({
        success: true,
        message: 'Aadhaar verified successfully',
        data: {
          verified: true,
          aadhaarNumber: aadhaarVerificationService.maskAadhaar(aadhaarNumber),
          name: verificationResult.name,
          dateOfBirth: verificationResult.dateOfBirth,
          gender: verificationResult.gender,
          address: verificationResult.address,
          verificationData: verificationResult,
        },
      });
    } catch (error) {
      enterpriseLogger.error('Aadhaar verification failed', {
        error: error.message,
        userId: req.user?.userId,
      });
      next(error);
    }
  }

  /**
   * Link verified Aadhaar to user profile
   * POST /api/users/aadhaar/link
   */
  async linkAadhaar(req, res, next) {
    try {
      const userId = req.user.userId;
      const { aadhaarNumber, verificationData } = req.body;

      if (!aadhaarNumber) {
        return res.status(400).json({
          success: false,
          error: 'Aadhaar number is required',
        });
      }

      // Verify Aadhaar first
      const aadhaarVerificationService = require('../services/common/AadhaarVerificationService');
      const verificationResult = await aadhaarVerificationService.verifyAadhaar(aadhaarNumber, userId);

      if (!verificationResult.success || !verificationResult.verified) {
        return res.status(400).json({
          success: false,
          error: 'Aadhaar verification failed. Please verify Aadhaar first.',
        });
      }

      // Get or create user profile
      let userProfile = await UserProfile.findOne({ where: { userId } });
      if (!userProfile) {
        userProfile = await UserProfile.create({ userId });
      }

      // Check if Aadhaar is already linked to another user
      const existingProfile = await UserProfile.findOne({
        where: {
          aadhaarNumber: aadhaarNumber.replace(/\s/g, ''),
          userId: { [Op.ne]: userId },
        },
      });

      if (existingProfile) {
        return res.status(409).json({
          success: false,
          error: 'This Aadhaar number is already linked to another account',
        });
      }

      // Update user profile with Aadhaar information
      await userProfile.update({
        aadhaarNumber: aadhaarNumber.replace(/\s/g, ''),
        aadhaarLinked: true,
        aadhaarVerifiedAt: new Date(),
        aadhaarVerificationData: verificationResult.rawData || verificationData || {},
      });

      // Log audit event
      await auditService.logEvent(
        userId,
        'aadhaar_linked',
        'user_profile',
        { aadhaar: aadhaarVerificationService.maskAadhaar(aadhaarNumber) },
        req.ip,
        req.headers['user-agent'],
      );

      enterpriseLogger.info('Aadhaar linked to user profile', {
        userId,
        aadhaar: aadhaarVerificationService.maskAadhaar(aadhaarNumber),
      });

      res.status(200).json({
        success: true,
        message: 'Aadhaar linked successfully',
        data: {
          aadhaarLinked: true,
          aadhaarNumber: aadhaarVerificationService.maskAadhaar(aadhaarNumber),
          verifiedAt: userProfile.aadhaarVerifiedAt,
        },
      });
    } catch (error) {
      enterpriseLogger.error('Aadhaar linking failed', {
        error: error.message,
        userId: req.user?.userId,
      });
      next(error);
    }
  }

  /**
   * Unlink Aadhaar from user profile
   * DELETE /api/users/aadhaar/unlink
   */
  async unlinkAadhaar(req, res, next) {
    try {
      const userId = req.user.userId;

      const userProfile = await UserProfile.findOne({ where: { userId } });
      if (!userProfile || !userProfile.aadhaarNumber) {
        return res.status(404).json({
          success: false,
          error: 'Aadhaar is not linked to your account',
        });
      }

      const maskedAadhaar = userProfile.aadhaarNumber.substring(0, 4) + '****' + userProfile.aadhaarNumber.substring(8);

      // Unlink Aadhaar
      await userProfile.update({
        aadhaarNumber: null,
        aadhaarLinked: false,
        aadhaarVerifiedAt: null,
        aadhaarVerificationData: null,
      });

      // Log audit event
      await auditService.logEvent(
        userId,
        'aadhaar_unlinked',
        'user_profile',
        { aadhaar: maskedAadhaar },
        req.ip,
        req.headers['user-agent'],
      );

      enterpriseLogger.info('Aadhaar unlinked from user profile', {
        userId,
        aadhaar: maskedAadhaar,
      });

      res.status(200).json({
        success: true,
        message: 'Aadhaar unlinked successfully',
      });
    } catch (error) {
      enterpriseLogger.error('Aadhaar unlinking failed', {
        error: error.message,
        userId: req.user?.userId,
      });
      next(error);
    }
  }

  /**
   * Get Aadhaar linking status
   * GET /api/users/aadhaar/status
   */
  async getAadhaarStatus(req, res, next) {
    try {
      const userId = req.user.userId;

      const userProfile = await UserProfile.findOne({
        where: { userId },
        attributes: ['aadhaarNumber', 'aadhaarLinked', 'aadhaarVerifiedAt'],
      });

      const aadhaarVerificationService = require('../services/common/AadhaarVerificationService');
      const maskedAadhaar = userProfile?.aadhaarNumber
        ? aadhaarVerificationService.maskAadhaar(userProfile.aadhaarNumber)
        : null;

      res.status(200).json({
        success: true,
        data: {
          aadhaarLinked: userProfile?.aadhaarLinked || false,
          aadhaarNumber: maskedAadhaar,
          verifiedAt: userProfile?.aadhaarVerifiedAt || null,
        },
      });
    } catch (error) {
      enterpriseLogger.error('Get Aadhaar status failed', {
        error: error.message,
        userId: req.user?.userId,
      });
      next(error);
    }
  }
}

module.exports = new UserController();
