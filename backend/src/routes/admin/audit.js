// =====================================================
// ADMIN AUDIT ROUTES
// Admin-specific routes for viewing audit logs
// =====================================================

const express = require('express');
const router = express.Router();
const adminAuditController = require('../../controllers/AdminAuditController');
const authMiddleware = require('../../middleware/auth');
const { requireRole } = require('../../middleware/rbac');

// Apply authentication and admin middleware to all routes
router.use(authMiddleware.authenticateToken);
router.use(requireRole(['SUPER_ADMIN', 'PLATFORM_ADMIN']));

// Get audit statistics
router.get('/stats', adminAuditController.getAuditStats);

// Get security logs (failed logins, suspicious activity)
router.get('/security', adminAuditController.getSecurityLogs);

// Get admin activity logs
router.get('/admin-activity', adminAuditController.getAdminActivityLogs);

// Export audit logs
router.get('/export', adminAuditController.exportAuditLogs);

// Get audit logs with filters
router.get('/logs', adminAuditController.getAuditLogs);

module.exports = router;

