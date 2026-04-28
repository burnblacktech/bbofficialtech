/**
 * AdminUserService — User management for SUPER_ADMIN dashboard
 * Handles listing, detail, deactivation, reactivation, password reset, and audit trail.
 */

const { Op, fn, col, literal } = require('sequelize');
const { User, ITRFiling, Order, AuditEvent, UserSession, PasswordResetToken } = require('../../models');
const { sequelize } = require('../../config/database');
const AppError = require('../../utils/AppError');
const enterpriseLogger = require('../../utils/logger');

class AdminUserService {
  /**
   * List users with optional search, role/status filters, and pagination.
   * Joins UserSession for lastActive (MAX of last_active where revoked=false).
   */
  async listUsers({ search, role, status, page = 1, limit = 20 }) {
    const pg = Math.max(1, parseInt(page) || 1);
    const lim = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const where = {};

    if (role) where.role = role;
    if (status) where.status = status;
    if (search) {
      where[Op.or] = [
        { email: { [Op.iLike]: `%${search}%` } },
        { fullName: { [Op.iLike]: `%${search}%` } },
        { panNumber: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { count, rows } = await User.findAndCountAll({
      where,
      limit: lim,
      offset: (pg - 1) * lim,
      attributes: [
        'id', 'email', 'fullName', 'panNumber', 'role', 'status',
        'emailVerified', 'authProvider', 'createdAt',
        [
          literal(`(
            SELECT MAX(us.last_active)
            FROM user_sessions us
            WHERE us.user_id = "User".id AND us.revoked = false
          )`),
          'lastActive',
        ],
      ],
      order: [['createdAt', 'DESC']],
    });

    return { users: rows, total: count, page: pg, totalPages: Math.ceil(count / lim) };
  }

  /**
   * Get detailed user profile with filing summary, payment summary, and session info.
   */
  async getUserDetail(userId) {
    const user = await User.findByPk(userId, {
      attributes: [
        'id', 'email', 'fullName', 'phone', 'panNumber', 'panVerified',
        'dateOfBirth', 'role', 'status', 'emailVerified', 'authProvider',
        'createdAt', 'updatedAt',
      ],
    });
    if (!user) {
      throw new AppError('USER_NOT_FOUND', 'User not found', 404);
    }

    // Filing summary
    const filings = await ITRFiling.findAll({
      where: { createdBy: user.id },
      order: [['createdAt', 'DESC']],
    });
    const filingSummary = {
      total: filings.length,
      byState: filings.reduce((acc, f) => {
        acc[f.lifecycleState] = (acc[f.lifecycleState] || 0) + 1;
        return acc;
      }, {}),
      recentFilings: filings.slice(0, 3).map((f) => ({
        id: f.id,
        itrType: f.itrType,
        assessmentYear: f.assessmentYear,
        lifecycleState: f.lifecycleState,
        createdAt: f.createdAt,
      })),
    };

    // Payment summary
    const orders = await Order.findAll({
      where: { userId: user.id },
      order: [['createdAt', 'DESC']],
    });
    const paidOrders = orders.filter((o) => o.status === 'paid');
    const paymentSummary = {
      totalPaid: paidOrders.reduce((s, o) => s + (o.totalAmount || 0), 0) / 100,
      paidOrders: paidOrders.length,
      recentOrders: orders.slice(0, 3).map((o) => ({
        id: o.id,
        planId: o.planId,
        totalAmount: (o.totalAmount || 0) / 100,
        status: o.status,
        paidAt: o.paidAt,
      })),
    };

    // Session info
    const now = new Date();
    const sessions = await UserSession.findAll({
      where: {
        userId: user.id,
        revoked: false,
        expiresAt: { [Op.gt]: now },
      },
      order: [['lastActive', 'DESC']],
    });
    const sessionInfo = {
      activeSessions: sessions.length,
      lastSession: sessions[0]
        ? { lastActive: sessions[0].lastActive, deviceInfo: sessions[0].deviceInfo }
        : null,
    };

    return { user, filingSummary, paymentSummary, sessionInfo };
  }

  /**
   * Deactivate a user account — set status disabled, revoke all sessions.
   * Rejects if already disabled (409) or target is SUPER_ADMIN (403).
   */
  async deactivateUser(userId, adminId) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new AppError('USER_NOT_FOUND', 'User not found', 404);
    }
    if (user.role === 'SUPER_ADMIN') {
      throw new AppError('CANNOT_DEACTIVATE_ADMIN', 'SUPER_ADMIN accounts cannot be deactivated', 403);
    }
    if (user.status === 'disabled') {
      throw new AppError('USER_ALREADY_DISABLED', 'Account is already disabled', 409);
    }

    user.status = 'disabled';
    await user.save();
    await UserSession.update(
      { revoked: true, revokedAt: new Date() },
      { where: { userId: user.id, revoked: false } },
    );

    return { message: 'User deactivated' };
  }

  /**
   * Reactivate a user account — set status active.
   * Rejects if already active (409).
   */
  async reactivateUser(userId, adminId) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new AppError('USER_NOT_FOUND', 'User not found', 404);
    }
    if (user.status === 'active') {
      throw new AppError('USER_ALREADY_ACTIVE', 'Account is already active', 409);
    }

    user.status = 'active';
    await user.save();

    return { message: 'User reactivated' };
  }

  /**
   * Trigger a password reset for a user — create token, send email.
   * Rejects if user's authProvider is 'google' (400).
   */
  async triggerPasswordReset(userId, adminId) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new AppError('USER_NOT_FOUND', 'User not found', 404);
    }
    if (user.authProvider === 'google') {
      throw new AppError('OAUTH_NO_PASSWORD_RESET', 'OAuth-only accounts cannot have passwords reset', 400);
    }

    const { v4: uuidv4 } = require('uuid');
    const token = uuidv4();
    await PasswordResetToken.createResetToken(user.id, token, new Date(Date.now() + 3600000));

    const emailService = require('../integration/EmailService');
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
    emailService.sendPasswordResetEmail(user.email, token, resetUrl).catch((err) => {
      enterpriseLogger.error('Password reset email failed', { userId, error: err.message });
    });

    return { message: 'Password reset link sent' };
  }

  /**
   * Get paginated audit trail for a user.
   */
  async getUserAuditTrail(userId, { eventType, page = 1, limit = 50 }) {
    const pg = Math.max(1, parseInt(page) || 1);
    const lim = Math.min(200, Math.max(1, parseInt(limit) || 50));
    const where = { actorId: userId };
    if (eventType) where.eventType = eventType;

    const { count, rows } = await AuditEvent.findAndCountAll({
      where,
      limit: lim,
      offset: (pg - 1) * lim,
      order: [['createdAt', 'DESC']],
    });

    return { events: rows, total: count, page: pg, totalPages: Math.ceil(count / lim) };
  }
}

module.exports = new AdminUserService();
