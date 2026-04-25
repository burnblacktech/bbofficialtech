/**
 * Account Routes — Audit trail, data export, account deletion, notification preferences
 */

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { AuditEvent } = require('../models');
const DataExportService = require('../services/core/DataExportService');
const NotificationService = require('../services/integration/NotificationService');
const { User } = require('../models');
const enterpriseLogger = require('../utils/logger');

/**
 * GET /api/account/audit-trail
 * Paginated audit trail for the current user
 */
router.get('/audit-trail', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const offset = (page - 1) * limit;

    const { count, rows } = await AuditEvent.findAndCountAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      limit,
      offset,
      attributes: ['id', 'eventType', 'metadata', 'createdAt'],
    });

    res.json({
      success: true,
      data: {
        events: rows.map(e => ({
          id: e.id,
          type: e.eventType,
          description: describeEvent(e.eventType, e.metadata),
          timestamp: e.createdAt,
          ip: e.metadata?.ipAddress || null,
          device: e.metadata?.userAgent ? parseDevice(e.metadata.userAgent) : null,
        })),
        pagination: { page, limit, total: count, pages: Math.ceil(count / limit) },
      },
    });
  } catch (err) { next(err); }
});

/**
 * POST /api/account/export
 * Request data export
 */
router.post('/export', authenticateToken, async (req, res, next) => {
  try {
    const result = await DataExportService.requestExport(req.user.userId);

    // Send confirmation email
    const user = await User.findByPk(req.user.userId);
    if (user?.email) {
      NotificationService.sendEmail(req.user.userId, 'data_export_confirm', { email: user.email }).catch(() => {});
    }

    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

/**
 * GET /api/account/export/download
 * Download the exported data (JSON for MVP)
 */
router.get('/export/download', authenticateToken, async (req, res, next) => {
  try {
    const data = await DataExportService.executeExport(req.user.userId);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="burnblack_data_export.json"');
    res.json(data);
  } catch (err) { next(err); }
});

/**
 * POST /api/account/delete
 * Request account deletion (24hr cancellation window)
 */
router.post('/delete', authenticateToken, async (req, res, next) => {
  try {
    const result = await DataExportService.requestDeletion(req.user.userId);

    // Send confirmation email with cancel link
    const user = await User.findByPk(req.user.userId);
    if (user?.email) {
      const cancelLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/account/cancel-deletion?id=${result.deletionId}`;
      NotificationService.sendEmail(req.user.userId, 'data_delete_confirm', { email: user.email, cancelLink }).catch(() => {});
    }

    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

/**
 * POST /api/account/delete/cancel
 * Cancel pending account deletion
 */
router.post('/delete/cancel', authenticateToken, async (req, res, next) => {
  try {
    const { deletionId } = req.body;
    if (!deletionId) return res.status(400).json({ success: false, error: 'deletionId is required' });
    await DataExportService.cancelDeletion(req.user.userId, deletionId);
    res.json({ success: true, message: 'Account deletion cancelled' });
  } catch (err) { next(err); }
});

/**
 * GET /api/account/notification-preferences
 */
router.get('/notification-preferences', authenticateToken, async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.userId);
    const prefs = user?.metadata?.notificationPreferences || {
      email_filing: true, email_security: true, email_reminders: true, email_marketing: false,
    };
    res.json({ success: true, data: prefs });
  } catch (err) { next(err); }
});

/**
 * PATCH /api/account/notification-preferences
 */
router.patch('/notification-preferences', authenticateToken, async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.userId);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    user.metadata = {
      ...(user.metadata || {}),
      notificationPreferences: { ...(user.metadata?.notificationPreferences || {}), ...req.body },
    };
    await user.save();
    res.json({ success: true, data: user.metadata.notificationPreferences });
  } catch (err) { next(err); }
});

// ── Helpers ──

function describeEvent(type, meta) {
  const map = {
    'AUTH_LOGIN_SUCCESS': 'Logged in',
    'AUTH_REGISTER': 'Account created',
    'AUTH_LOGOUT': 'Logged out',
    'AUTH_REVOKE_ALL_SESSIONS': 'All sessions revoked',
    'FILING_CREATED': `Filing created for AY ${meta?.assessmentYear || ''}`,
    'FILING_UPDATED': 'Filing data updated',
    'FILING_SUBMITTED': `Filing submitted for AY ${meta?.assessmentYear || ''}`,
    'FILING_DELETED': 'Filing deleted',
    'DOCUMENT_IMPORTED': `${meta?.documentType || 'Document'} imported`,
    'PAN_VERIFIED': 'PAN verified',
    'DATA_EXPORT_REQUESTED': 'Data export requested',
    'ACCOUNT_DELETION_REQUESTED': 'Account deletion requested',
    'ACCOUNT_DELETION_CANCELLED': 'Account deletion cancelled',
  };
  return map[type] || type.replace(/_/g, ' ').toLowerCase();
}

function parseDevice(ua) {
  if (!ua) return 'Unknown';
  if (ua.includes('Mobile')) return 'Mobile';
  if (ua.includes('Tablet')) return 'Tablet';
  return 'Desktop';
}

module.exports = router;
