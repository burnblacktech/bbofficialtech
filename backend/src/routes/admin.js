/**
 * Admin Routes — SUPER_ADMIN only
 * All endpoints under /api/admin/*
 */

const express = require('express');
const router = express.Router();
const Joi = require('joi');
const { authenticateToken } = require('../middleware/auth');
const requireAdmin = require('../middleware/requireAdmin');
const adminAuditMiddleware = require('../middleware/adminAudit');
const { User } = require('../models');
const enterpriseLogger = require('../utils/logger');
const AdminUserService = require('../services/admin/AdminUserService');
const AdminStatsService = require('../services/admin/AdminStatsService');
const AdminRevenueService = require('../services/admin/AdminRevenueService');
const AdminERIService = require('../services/admin/AdminERIService');
const AdminCouponService = require('../services/admin/AdminCouponService');
const AdminHealthService = require('../services/admin/AdminHealthService');
const AdminFilingService = require('../services/admin/AdminFilingService');

// Apply auth + admin check + audit to all routes
router.use(authenticateToken, requireAdmin, adminAuditMiddleware);

// ══════════════════════════════════════════════════════
// VALIDATION SCHEMAS
// ══════════════════════════════════════════════════════

const listUsersSchema = Joi.object({
  search: Joi.string().max(200).allow('').optional(),
  role: Joi.string().valid('END_USER', 'CA', 'PREPARER', 'SUPER_ADMIN', 'GSTIN_ADMIN').optional(),
  status: Joi.string().valid('active', 'disabled').optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

const filingTrendsSchema = Joi.object({
  period: Joi.string().valid('daily', 'weekly', 'monthly').default('daily'),
});

const auditTrailSchema = Joi.object({
  eventType: Joi.string().max(100).optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(200).default(50),
});

const createCouponSchema = Joi.object({
  code: Joi.string().pattern(/^[A-Z0-9]{3,30}$/).required()
    .messages({ 'string.pattern.base': 'Code must be 3-30 uppercase alphanumeric characters' }),
  discountType: Joi.string().valid('percent', 'flat').required(),
  discountValue: Joi.number().positive().required(),
  maxUses: Joi.number().integer().positive().allow(null).optional(),
  validFrom: Joi.date().iso().required(),
  validUntil: Joi.date().iso().greater(Joi.ref('validFrom')).required()
    .messages({ 'date.greater': 'validUntil must be after validFrom' }),
}).custom((value) => {
  if (value.discountType === 'percent' && (value.discountValue < 1 || value.discountValue > 100)) {
    throw new Error('Percent discount must be between 1 and 100');
  }
  return value;
});

const couponUsageSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

const createFilingSchema = Joi.object({
  pan: Joi.string().pattern(/^[A-Z]{5}[0-9]{4}[A-Z]$/).required()
    .messages({ 'string.pattern.base': 'PAN must be 10 characters: 5 letters, 4 digits, 1 letter' }),
  assessmentYear: Joi.string().pattern(/^\d{4}-\d{2}$/).required()
    .messages({ 'string.pattern.base': 'Assessment year must be YYYY-YY format' }),
  itrType: Joi.string().valid('ITR-1', 'ITR-2', 'ITR-3', 'ITR-4').required(),
});

const batchCreateSchema = Joi.object({
  pans: Joi.array().items(
    Joi.string().pattern(/^[A-Z]{5}[0-9]{4}[A-Z]$/),
  ).min(1).max(50).required(),
  assessmentYear: Joi.string().pattern(/^\d{4}-\d{2}$/).required()
    .messages({ 'string.pattern.base': 'Assessment year must be YYYY-YY format' }),
  itrType: Joi.string().valid('ITR-1', 'ITR-2', 'ITR-3', 'ITR-4').required(),
});

const listAdminFilingsSchema = Joi.object({
  assessmentYear: Joi.string().pattern(/^\d{4}-\d{2}$/).optional(),
  itrType: Joi.string().valid('ITR-1', 'ITR-2', 'ITR-3', 'ITR-4').optional(),
  lifecycleState: Joi.string().valid(
    'draft', 'review_pending', 'reviewed', 'approved_by_ca',
    'submitted_to_eri', 'eri_in_progress', 'eri_success', 'eri_failed',
  ).optional(),
  pan: Joi.string().pattern(/^[A-Z]{5}[0-9]{4}[A-Z]$/).optional(),
  includeDeleted: Joi.boolean().default(false),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

// ══════════════════════════════════════════════════════
// USERS
// ══════════════════════════════════════════════════════

router.get('/users', async (req, res, next) => {
  try {
    const { error, value } = listUsersSchema.validate(req.query, { stripUnknown: true });
    if (error) {
      return res.status(400).json({ success: false, error: error.details[0].message });
    }
    const data = await AdminUserService.listUsers(value);
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

router.get('/users/:userId', async (req, res, next) => {
  try {
    const data = await AdminUserService.getUserDetail(req.params.userId);
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

router.post('/users/:userId/deactivate', async (req, res, next) => {
  try {
    const result = await AdminUserService.deactivateUser(req.params.userId, req.user.userId);
    res.json({ success: true, message: result.message });
  } catch (err) { next(err); }
});

router.post('/users/:userId/reactivate', async (req, res, next) => {
  try {
    const result = await AdminUserService.reactivateUser(req.params.userId, req.user.userId);
    res.json({ success: true, message: result.message });
  } catch (err) { next(err); }
});

router.post('/users/:userId/reset-password', async (req, res, next) => {
  try {
    const result = await AdminUserService.triggerPasswordReset(req.params.userId, req.user.userId);
    res.json({ success: true, message: result.message });
  } catch (err) { next(err); }
});

router.get('/users/:userId/audit', async (req, res, next) => {
  try {
    const { error, value } = auditTrailSchema.validate(req.query, { stripUnknown: true });
    if (error) {
      return res.status(400).json({ success: false, error: error.details[0].message });
    }
    const data = await AdminUserService.getUserAuditTrail(req.params.userId, value);
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

// ══════════════════════════════════════════════════════
// IMPERSONATION — View as any user
// ══════════════════════════════════════════════════════

router.post('/users/:userId/impersonate', async (req, res, next) => {
  try {
    const targetUser = await User.findByPk(req.params.userId);
    if (!targetUser) return res.status(404).json({ success: false, error: 'User not found' });

    // Generate a short-lived token for the target user (30 min)
    const jwt = require('jsonwebtoken');
    const impersonationToken = jwt.sign(
      {
        userId: targetUser.id,
        email: targetUser.email,
        role: targetUser.role,
        caFirmId: targetUser.caFirmId || null,
        impersonatedBy: req.user.userId,
      },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '30m' },
    );

    enterpriseLogger.info('Admin impersonation', {
      adminId: req.user.userId,
      targetUserId: targetUser.id,
      targetEmail: targetUser.email,
    });

    res.json({
      success: true,
      data: {
        accessToken: impersonationToken,
        user: {
          id: targetUser.id,
          email: targetUser.email,
          fullName: targetUser.fullName,
          role: targetUser.role,
          panNumber: targetUser.panNumber,
          panVerified: targetUser.panVerified,
          dateOfBirth: targetUser.dateOfBirth,
          gender: targetUser.gender,
          phone: targetUser.phone,
        },
        expiresIn: '30m',
        isImpersonation: true,
      },
    });
  } catch (err) { next(err); }
});

// ══════════════════════════════════════════════════════
// FILING STATISTICS
// ══════════════════════════════════════════════════════

router.get('/stats/filings', async (req, res, next) => {
  try {
    const data = await AdminStatsService.getFilingStats();
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

router.get('/stats/filings/trends', async (req, res, next) => {
  try {
    const { error, value } = filingTrendsSchema.validate(req.query, { stripUnknown: true });
    if (error) {
      return res.status(400).json({ success: false, error: error.details[0].message });
    }
    const data = await AdminStatsService.getFilingTrends(value.period);
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

// ══════════════════════════════════════════════════════
// REVENUE
// ══════════════════════════════════════════════════════

router.get('/revenue', async (req, res, next) => {
  try {
    const data = await AdminRevenueService.getRevenueData();
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

// ══════════════════════════════════════════════════════
// ERI MONITORING
// ══════════════════════════════════════════════════════

router.get('/eri', async (req, res, next) => {
  try {
    const data = await AdminERIService.getERIMonitoringData();
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

// ══════════════════════════════════════════════════════
// COUPONS
// ══════════════════════════════════════════════════════

router.get('/coupons', async (req, res, next) => {
  try {
    const coupons = await AdminCouponService.listCoupons({ active: req.query.active });
    res.json({ success: true, data: coupons });
  } catch (err) { next(err); }
});

router.post('/coupons', async (req, res, next) => {
  try {
    const { error, value } = createCouponSchema.validate(req.body, { stripUnknown: true });
    if (error) {
      return res.status(400).json({ success: false, error: error.details[0].message });
    }
    const coupon = await AdminCouponService.createCoupon(value);
    res.status(201).json({ success: true, data: coupon });
  } catch (err) { next(err); }
});

router.post('/coupons/:couponId/deactivate', async (req, res, next) => {
  try {
    const result = await AdminCouponService.deactivateCoupon(req.params.couponId);
    res.json({ success: true, message: result.message });
  } catch (err) { next(err); }
});

router.get('/coupons/:couponId/usage', async (req, res, next) => {
  try {
    const { error, value } = couponUsageSchema.validate(req.query, { stripUnknown: true });
    if (error) {
      return res.status(400).json({ success: false, error: error.details[0].message });
    }
    const data = await AdminCouponService.getCouponUsage(req.params.couponId, value);
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

// ══════════════════════════════════════════════════════
// PLATFORM HEALTH
// ══════════════════════════════════════════════════════

router.get('/health', async (req, res, next) => {
  try {
    const data = await AdminHealthService.getHealthData();
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

// ══════════════════════════════════════════════════════
// FILING MANAGEMENT
// ══════════════════════════════════════════════════════

router.post('/filings', async (req, res, next) => {
  try {
    const { error, value } = createFilingSchema.validate(req.body, { stripUnknown: true });
    if (error) {
      return res.status(400).json({ success: false, error: error.details[0].message, code: 'VALIDATION_ERROR' });
    }
    const filing = await AdminFilingService.createFiling(value, req.user.userId);
    res.status(201).json({ success: true, data: filing });
  } catch (err) { next(err); }
});

router.post('/filings/batch', async (req, res, next) => {
  try {
    const { error, value } = batchCreateSchema.validate(req.body, { stripUnknown: true });
    if (error) {
      return res.status(400).json({ success: false, error: error.details[0].message, code: 'VALIDATION_ERROR' });
    }
    const result = await AdminFilingService.batchCreateFilings(value, req.user.userId);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

router.delete('/filings/:filingId', async (req, res, next) => {
  try {
    const result = await AdminFilingService.deleteFiling(req.params.filingId, req.user.userId);
    res.json({ success: true, message: result.message });
  } catch (err) { next(err); }
});

router.get('/filings', async (req, res, next) => {
  try {
    const { error, value } = listAdminFilingsSchema.validate(req.query, { stripUnknown: true });
    if (error) {
      return res.status(400).json({ success: false, error: error.details[0].message, code: 'VALIDATION_ERROR' });
    }
    const data = await AdminFilingService.listFilings(req.user.userId, value);
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

module.exports = router;
