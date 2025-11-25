// =====================================================
// USER CONTROLLER - CANONICAL USER MANAGEMENT
// Handles profile, dashboard, settings, notifications
// =====================================================

const { User, ITRFiling, ITRDraft, Document, ServiceTicket, FamilyMember } = require('../models');
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
    if (this.getUserDashboard) {this.getUserDashboard = this.getUserDashboard.bind(this);}
    if (this.getUserProfile) {this.getUserProfile = this.getUserProfile.bind(this);}
    if (this.updateUserProfile) {this.updateUserProfile = this.updateUserProfile.bind(this);}
    if (this.getUserSettings) {this.getUserSettings = this.getUserSettings.bind(this);}
    if (this.updateUserSettings) {this.updateUserSettings = this.updateUserSettings.bind(this);}
    if (this.getUserNotifications) {this.getUserNotifications = this.getUserNotifications.bind(this);}
    if (this.markNotificationAsRead) {this.markNotificationAsRead = this.markNotificationAsRead.bind(this);}
    if (this.markAllNotificationsAsRead) {this.markAllNotificationsAsRead = this.markAllNotificationsAsRead.bind(this);}
    if (this.changePassword) {this.changePassword = this.changePassword.bind(this);}
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
          'lastLoginAt', 'loginCount', 'metadata',
        ],
      });

      if (!user) {
        throw new AppError('User not found', 404);
      }

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
            statusLabel: this.getStatusLabel(user.status),
            emailVerified: user.emailVerified,
            phoneVerified: user.phoneVerified,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            lastLoginAt: user.lastLoginAt,
            loginCount: user.loginCount,
            metadata: user.metadata,
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
      const { fullName, phone, metadata } = req.body;

      if (!fullName && !phone && !metadata) {
        throw new AppError('No fields provided for update', 400);
      }

      const user = await User.findByPk(userId);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      const updateData = {};
      if (fullName) {updateData.fullName = fullName;}
      if (phone) {updateData.phone = phone;}
      if (metadata) {updateData.metadata = { ...user.metadata, ...metadata };}

      await user.update(updateData);

      // Log audit event
      await auditService.logDataAccess(
        userId,
        'update',
        'user_profile',
        userId,
        { updatedFields: Object.keys(updateData) },
        req.ip,
      );

      enterpriseLogger.info('User profile updated', { userId, updatedFields: Object.keys(updateData) });

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

      const user = await User.findByPk(userId);
      if (!user) {
        throw new AppError('User not found', 404);
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

      // Get user statistics
      const [
        filingStats,
        draftStats,
        documentStats,
        ticketStats,
        memberStats,
        recentActivity,
      ] = await Promise.all([
        this.getFilingStats(userId),
        this.getDraftStats(userId),
        this.getDocumentStats(userId),
        this.getTicketStats(userId),
        this.getMemberStats(userId),
        this.getRecentActivity(userId),
      ]);

      const dashboardData = {
        overview: {
          totalFilings: filingStats.totalFilings,
          draftFilings: draftStats.totalDrafts,
          totalDocuments: documentStats.totalDocuments,
          openTickets: ticketStats.openTickets,
          familyMembers: memberStats.totalMembers,
        },
        filingStats,
        draftStats,
        documentStats,
        ticketStats,
        memberStats,
        recentActivity,
        quickActions: this.getQuickActions(userId),
      };

      enterpriseLogger.info('User dashboard data retrieved', { userId });

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
        whereClause.isRead = false;
      }

      // This would typically query a notifications table
      // For now, return mock data
      const notifications = [
        {
          id: '1',
          type: 'filing_status_update',
          title: 'ITR Filing Status Update',
          message: 'Your ITR-1 filing has been submitted successfully',
          isRead: false,
          createdAt: new Date().toISOString(),
          data: { filingId: 'filing-123', status: 'submitted' },
        },
        {
          id: '2',
          type: 'document_verification',
          title: 'Document Verification Complete',
          message: 'Your Form 16 has been verified and processed',
          isRead: true,
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          data: { documentId: 'doc-456', status: 'verified' },
        },
      ];

      const unreadCount = notifications.filter(n => !n.isRead).length;

      enterpriseLogger.info('User notifications retrieved', { userId, count: notifications.length });

      res.status(200).json({
        success: true,
        message: 'Notifications retrieved successfully',
        data: {
          notifications,
          pagination: {
            currentPage: parseInt(page),
            totalPages: 1,
            totalItems: notifications.length,
            itemsPerPage: parseInt(limit),
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
    const stats = await ITRDraft.findAll({
      where: { userId },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalDrafts'],
        [sequelize.fn('COUNT', sequelize.literal('CASE WHEN is_completed = false THEN 1 END')), 'activeDrafts'],
        [sequelize.fn('COUNT', sequelize.literal('CASE WHEN is_completed = true THEN 1 END')), 'submittedDrafts'],
      ],
      raw: true,
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
        [sequelize.fn('COUNT', sequelize.literal('CASE WHEN is_dependent = true THEN 1 END')), 'activeMembers'],
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
}

module.exports = new UserController();
