/**
 * Admin Routes — SUPER_ADMIN only
 * All endpoints under /api/admin/*
 */

const express = require('express');
const router = express.Router();
const { Op, fn, col, literal } = require('sequelize');
const { authenticateToken } = require('../middleware/auth');
const requireAdmin = require('../middleware/requireAdmin');
const adminAuditMiddleware = require('../middleware/adminAudit');
const { User, ITRFiling, Order, AuditEvent, ERISubmissionAttempt, UserSession, Coupon } = require('../models');
const { sequelize } = require('../config/database');
const enterpriseLogger = require('../utils/logger');

// Apply auth + admin check + audit to all routes
router.use(authenticateToken, requireAdmin, adminAuditMiddleware);

// ══════════════════════════════════════════════════════
// USERS
// ══════════════════════════════════════════════════════

router.get('/users', async (req, res, next) => {
  try {
    const { search, role, status, page = 1, limit = 20 } = req.query;
    const pg = Math.max(1, parseInt(page));
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
      where, limit: lim, offset: (pg - 1) * lim,
      attributes: ['id', 'email', 'fullName', 'panNumber', 'role', 'status', 'emailVerified', 'authProvider', 'createdAt'],
      order: [['createdAt', 'DESC']],
    });
    res.json({ success: true, data: { users: rows, total: count, page: pg, totalPages: Math.ceil(count / lim) } });
  } catch (err) { next(err); }
});

router.get('/users/:userId', async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.userId, {
      attributes: ['id', 'email', 'fullName', 'phone', 'panNumber', 'panVerified', 'dateOfBirth', 'role', 'status', 'emailVerified', 'authProvider', 'createdAt', 'updatedAt'],
    });
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    const filings = await ITRFiling.findAll({ where: { createdBy: user.id }, order: [['createdAt', 'DESC']] });
    const orders = await Order.findAll({ where: { userId: user.id }, order: [['createdAt', 'DESC']] });
    const sessions = await UserSession.findAll({ where: { userId: user.id, revoked: false, expiresAt: { [Op.gt]: new Date() } } });

    const filingSummary = {
      total: filings.length,
      byState: filings.reduce((acc, f) => { acc[f.lifecycleState] = (acc[f.lifecycleState] || 0) + 1; return acc; }, {}),
      recent: filings.slice(0, 3).map(f => ({ id: f.id, itrType: f.itrType, assessmentYear: f.assessmentYear, lifecycleState: f.lifecycleState, createdAt: f.createdAt })),
    };
    const paidOrders = orders.filter(o => o.status === 'paid');
    const paymentSummary = {
      totalPaid: paidOrders.reduce((s, o) => s + (o.totalAmount || 0), 0) / 100,
      paidOrders: paidOrders.length,
      recent: orders.slice(0, 3).map(o => ({ id: o.id, planId: o.planId, totalAmount: (o.totalAmount || 0) / 100, status: o.status, paidAt: o.paidAt })),
    };

    res.json({ success: true, data: { user, filingSummary, paymentSummary, sessionInfo: { activeSessions: sessions.length, lastSession: sessions[0] || null } } });
  } catch (err) { next(err); }
});

router.post('/users/:userId/deactivate', async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.userId);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    if (user.role === 'SUPER_ADMIN') return res.status(403).json({ success: false, error: 'SUPER_ADMIN accounts cannot be deactivated' });
    if (user.status === 'disabled') return res.status(409).json({ success: false, error: 'Account is already disabled' });
    user.status = 'disabled';
    await user.save();
    await UserSession.update({ revoked: true, revokedAt: new Date() }, { where: { userId: user.id, revoked: false } });
    res.json({ success: true, message: 'User deactivated' });
  } catch (err) { next(err); }
});

router.post('/users/:userId/reactivate', async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.userId);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    if (user.status === 'active') return res.status(409).json({ success: false, error: 'Account is already active' });
    user.status = 'active';
    await user.save();
    res.json({ success: true, message: 'User reactivated' });
  } catch (err) { next(err); }
});

router.post('/users/:userId/reset-password', async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.userId);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    if (user.authProvider === 'google') return res.status(400).json({ success: false, error: 'OAuth-only accounts cannot have passwords reset' });
    const { PasswordResetToken } = require('../models');
    const { v4: uuidv4 } = require('uuid');
    const token = uuidv4();
    await PasswordResetToken.createResetToken(user.id, token, new Date(Date.now() + 3600000), req.ip, req.headers['user-agent']);
    const emailService = require('../services/integration/EmailService');
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
    emailService.sendPasswordResetEmail(user.email, token, resetUrl).catch(() => {});
    res.json({ success: true, message: 'Password reset link sent' });
  } catch (err) { next(err); }
});

router.get('/users/:userId/audit', async (req, res, next) => {
  try {
    const { eventType, page = 1, limit = 50 } = req.query;
    const pg = Math.max(1, parseInt(page));
    const lim = Math.min(200, Math.max(1, parseInt(limit) || 50));
    const where = { userId: req.params.userId };
    if (eventType) where.eventType = eventType;
    const { count, rows } = await AuditEvent.findAndCountAll({
      where, limit: lim, offset: (pg - 1) * lim, order: [['createdAt', 'DESC']],
    });
    res.json({ success: true, data: { events: rows, total: count, page: pg, totalPages: Math.ceil(count / lim) } });
  } catch (err) { next(err); }
});

// ══════════════════════════════════════════════════════
// FILING STATISTICS
// ══════════════════════════════════════════════════════

router.get('/stats/filings', async (req, res, next) => {
  try {
    const byState = await ITRFiling.findAll({ attributes: ['lifecycleState', [fn('COUNT', '*'), 'count']], group: ['lifecycleState'], raw: true });
    const byType = await ITRFiling.findAll({ attributes: ['itrType', [fn('COUNT', '*'), 'count']], group: ['itrType'], raw: true });
    const byAY = await ITRFiling.findAll({ attributes: ['assessmentYear', [fn('COUNT', '*'), 'count']], group: ['assessmentYear'], raw: true });
    const [avgResult] = await sequelize.query(`SELECT AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 3600) as avg_hours FROM itr_filings WHERE lifecycle_state = 'eri_success'`);
    res.json({ success: true, data: { byState, byType, byAssessmentYear: byAY, avgCompletionTimeHours: parseFloat(avgResult[0]?.avg_hours) || null } });
  } catch (err) { next(err); }
});

router.get('/stats/filings/trends', async (req, res, next) => {
  try {
    const period = req.query.period || 'daily';
    const truncMap = { daily: 'day', weekly: 'week', monthly: 'month' };
    const rangeMap = { daily: '30 days', weekly: '84 days', monthly: '365 days' };
    const trunc = truncMap[period] || 'day';
    const range = rangeMap[period] || '30 days';
    const [results] = await sequelize.query(`SELECT DATE_TRUNC('${trunc}', created_at) as period, COUNT(*) as count FROM itr_filings WHERE created_at >= NOW() - INTERVAL '${range}' GROUP BY period ORDER BY period`);
    res.json({ success: true, data: results });
  } catch (err) { next(err); }
});

// ══════════════════════════════════════════════════════
// REVENUE
// ══════════════════════════════════════════════════════

router.get('/revenue', async (req, res, next) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart); weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const sumWhere = (start) => Order.sum('totalAmount', { where: { status: 'paid', paidAt: { [Op.gte]: start } } });
    const [today, thisWeek, thisMonth, allTime] = await Promise.all([
      sumWhere(todayStart), sumWhere(weekStart), sumWhere(monthStart), Order.sum('totalAmount', { where: { status: 'paid' } }),
    ]);

    const byPlan = await Order.findAll({ where: { status: 'paid' }, attributes: ['planId', [fn('COUNT', '*'), 'orderCount'], [fn('SUM', col('total_amount')), 'totalRevenue']], group: ['planId'], raw: true });
    const paidCount = await Order.count({ where: { status: 'paid' } });
    const failedCount = await Order.count({ where: { status: 'failed' } });
    const distinctUsers = await Order.count({ where: { status: 'paid' }, distinct: true, col: 'userId' });

    const couponOrders = await Order.findAll({ where: { status: 'paid', couponCode: { [Op.ne]: null } }, attributes: ['couponCode', [fn('COUNT', '*'), 'usageCount'], [fn('SUM', col('discount')), 'totalDiscount']], group: ['couponCode'], raw: true });

    res.json({
      success: true, data: {
        summary: { today: (today || 0) / 100, thisWeek: (thisWeek || 0) / 100, thisMonth: (thisMonth || 0) / 100, allTime: (allTime || 0) / 100 },
        byPlan: byPlan.map(p => ({ ...p, totalRevenue: (p.totalRevenue || 0) / 100 })),
        paymentSuccessRate: paidCount + failedCount > 0 ? Math.round(paidCount / (paidCount + failedCount) * 100) : 100,
        avgRevenuePerUser: distinctUsers > 0 ? Math.round((allTime || 0) / 100 / distinctUsers) : 0,
        couponStats: { totalCouponOrders: couponOrders.reduce((s, c) => s + parseInt(c.usageCount), 0), byCoupon: couponOrders.map(c => ({ ...c, totalDiscount: (c.totalDiscount || 0) / 100 })) },
      },
    });
  } catch (err) { next(err); }
});

// ══════════════════════════════════════════════════════
// ERI MONITORING
// ══════════════════════════════════════════════════════

router.get('/eri', async (req, res, next) => {
  try {
    const successCount = await ERISubmissionAttempt.count({ where: { status: 'success' } });
    const failCount = await ERISubmissionAttempt.count({ where: { status: 'terminal_failure' } });
    const pendingCount = await ERISubmissionAttempt.count({ where: { status: 'pending' } });
    const recentFailures = await ERISubmissionAttempt.findAll({
      where: { status: { [Op.in]: ['retryable_failure', 'terminal_failure'] } },
      order: [['lastAttemptAt', 'DESC']], limit: 20,
      attributes: ['id', 'filingId', 'errorCode', 'status', 'attemptNumber', 'lastAttemptAt'],
    });
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
    const [errorCodes] = await sequelize.query(`SELECT error_code, COUNT(*) as count FROM eri_submission_attempts WHERE status IN ('retryable_failure','terminal_failure') AND last_attempt_at >= :since GROUP BY error_code ORDER BY count DESC`, { replacements: { since: thirtyDaysAgo } });

    res.json({
      success: true, data: {
        successRate: successCount + failCount > 0 ? Math.round(successCount / (successCount + failCount) * 100) : 100,
        recentFailures, pendingCount, errorCodeFrequency: errorCodes,
      },
    });
  } catch (err) { next(err); }
});

// ══════════════════════════════════════════════════════
// COUPONS
// ══════════════════════════════════════════════════════

router.get('/coupons', async (req, res, next) => {
  try {
    const { active } = req.query;
    const where = {};
    if (active === 'true') { where.isActive = true; where.validUntil = { [Op.gt]: new Date() }; }
    else if (active === 'false') { where[Op.or] = [{ isActive: false }, { validUntil: { [Op.lte]: new Date() } }]; }
    const coupons = await Coupon.findAll({ where, order: [['createdAt', 'DESC']] });
    res.json({ success: true, data: coupons });
  } catch (err) { next(err); }
});

router.post('/coupons', async (req, res, next) => {
  try {
    const { code, discountType, discountValue, maxUses, validFrom, validUntil } = req.body;
    // Validate
    if (!code || !/^[A-Z0-9]{3,30}$/.test(code)) return res.status(400).json({ success: false, error: 'Code must be 3-30 uppercase alphanumeric characters' });
    if (!['percent', 'flat'].includes(discountType)) return res.status(400).json({ success: false, error: 'discountType must be percent or flat' });
    if (!discountValue || discountValue <= 0) return res.status(400).json({ success: false, error: 'discountValue must be positive' });
    if (discountType === 'percent' && (discountValue < 1 || discountValue > 100)) return res.status(400).json({ success: false, error: 'Percent discount must be 1-100' });
    if (!validFrom || !validUntil || new Date(validFrom) >= new Date(validUntil)) return res.status(400).json({ success: false, error: 'validFrom must be before validUntil' });

    const existing = await Coupon.findOne({ where: { code } });
    if (existing) return res.status(409).json({ success: false, error: 'Coupon code already exists' });

    const coupon = await Coupon.create({ code, discountType, discountValue, maxUses: maxUses || null, validFrom, validUntil });
    res.status(201).json({ success: true, data: coupon });
  } catch (err) { next(err); }
});

router.post('/coupons/:couponId/deactivate', async (req, res, next) => {
  try {
    const coupon = await Coupon.findByPk(req.params.couponId);
    if (!coupon) return res.status(404).json({ success: false, error: 'Coupon not found' });
    coupon.isActive = false;
    await coupon.save();
    res.json({ success: true, message: 'Coupon deactivated' });
  } catch (err) { next(err); }
});

router.get('/coupons/:couponId/usage', async (req, res, next) => {
  try {
    const coupon = await Coupon.findByPk(req.params.couponId);
    if (!coupon) return res.status(404).json({ success: false, error: 'Coupon not found' });
    const { page = 1, limit = 20 } = req.query;
    const pg = Math.max(1, parseInt(page));
    const lim = Math.min(100, parseInt(limit) || 20);
    const { count, rows } = await Order.findAndCountAll({
      where: { couponCode: coupon.code, status: 'paid' },
      limit: lim, offset: (pg - 1) * lim, order: [['paidAt', 'DESC']],
      attributes: ['id', 'userId', 'discount', 'totalAmount', 'paidAt'],
    });
    res.json({ success: true, data: { orders: rows.map(o => ({ ...o.toJSON(), discount: (o.discount || 0) / 100, totalAmount: (o.totalAmount || 0) / 100 })), total: count, page: pg, totalPages: Math.ceil(count / lim) } });
  } catch (err) { next(err); }
});

// ══════════════════════════════════════════════════════
// PLATFORM HEALTH
// ══════════════════════════════════════════════════════

router.get('/health', async (req, res, next) => {
  try {
    // Active users
    const now = new Date();
    const activeQuery = (since) => UserSession.count({ where: { revoked: false, expiresAt: { [Op.gt]: now } }, distinct: true, col: 'userId' });
    const [active24h, active7d, active30d] = await Promise.all([
      UserSession.count({ where: { revoked: false, expiresAt: { [Op.gt]: now }, updatedAt: { [Op.gte]: new Date(now - 86400000) } }, distinct: true, col: 'userId' }),
      UserSession.count({ where: { revoked: false, expiresAt: { [Op.gt]: now }, updatedAt: { [Op.gte]: new Date(now - 7 * 86400000) } }, distinct: true, col: 'userId' }),
      UserSession.count({ where: { revoked: false, expiresAt: { [Op.gt]: now }, updatedAt: { [Op.gte]: new Date(now - 30 * 86400000) } }, distinct: true, col: 'userId' }),
    ]);

    // Database check
    let dbConnected = false, dbResponseMs = 0;
    try {
      const start = Date.now();
      await sequelize.query('SELECT 1');
      dbResponseMs = Date.now() - start;
      dbConnected = true;
    } catch { /* silent */ }

    // Redis check
    let redisConnected = false, redisResponseMs = 0;
    try {
      const RedisService = require('../services/core/RedisService');
      const client = RedisService.getClient?.();
      if (client) {
        const start = Date.now();
        await client.ping();
        redisResponseMs = Date.now() - start;
        redisConnected = true;
      }
    } catch { /* silent */ }

    // ERI status
    let eriStatus = 'unknown';
    const recentERI = await ERISubmissionAttempt.findOne({ where: { lastAttemptAt: { [Op.gte]: new Date(now - 3600000) } }, order: [['lastAttemptAt', 'DESC']] });
    if (recentERI) eriStatus = recentERI.status === 'success' ? 'operational' : 'degraded';

    res.json({
      success: true, data: {
        activeUsers: { last24h: active24h, last7d: active7d, last30d: active30d },
        database: { connected: dbConnected, responseTimeMs: dbResponseMs },
        redis: { connected: redisConnected, responseTimeMs: redisResponseMs },
        eriApi: { status: eriStatus },
        uptime: Math.round(process.uptime()),
      },
    });
  } catch (err) { next(err); }
});

module.exports = router;
