// =====================================================
// ADMIN ROUTES
// =====================================================

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/AdminController');
const adminFinancialRoutes = require('./admin/financial');
const adminSupportRoutes = require('./admin/support');
const adminAuditRoutes = require('./admin/audit');
const authMiddleware = require('../middleware/auth');
const enterpriseLogger = require('../utils/logger');
const rateLimit = require('express-rate-limit');
const { progressiveRateLimit, recordFailedAttempt } = require('../middleware/progressiveRateLimit');
const { auditFailedAuth } = require('../middleware/auditLogger');

// =====================================================
// ADMIN LOGIN ROUTE (PUBLIC - NO AUTH REQUIRED)
// =====================================================

/**
 * @route POST /api/admin/login
 * @description Admin login endpoint - authenticates SUPER_ADMIN and PLATFORM_ADMIN users
 * @access Public
 */
router.post('/login',
  process.env.NODE_ENV === 'production' ? progressiveRateLimit() : (req, res, next) => next(),
  process.env.NODE_ENV === 'production' ? recordFailedAttempt : (req, res, next) => next(),
  process.env.NODE_ENV === 'production' ? auditFailedAuth('admin_login') : (req, res, next) => next(),
  adminController.login.bind(adminController)
);

// =====================================================
// PROTECTED ADMIN ROUTES (AUTH REQUIRED)
// =====================================================

// Apply authentication middleware to all routes below
router.use(authMiddleware.authenticateToken);

// Middleware to check admin role
const requireAdmin = (req, res, next) => {
  console.log('Admin middleware - User:', req.user);
  console.log('Admin middleware - Role:', req.user?.role);

  if (!['SUPER_ADMIN', 'PLATFORM_ADMIN'].includes(req.user.role)) {
    console.log('Admin access denied for role:', req.user.role);
    return res.status(403).json({
      success: false,
      message: 'Admin access required',
    });
  }
  console.log('Admin access granted for role:', req.user.role);
  next();
};

// Apply admin role check to all routes
router.use(requireAdmin);

// Test route after middleware
router.get('/test', (req, res) => {
  res.json({ message: 'Admin test route working', user: req.user });
});

// =====================================================
// IMPERSONATION ROUTES
// =====================================================

router.post('/auth/impersonate/:userId', adminController.impersonateUser);
router.post('/auth/stop-impersonation', adminController.stopImpersonation);

// User Management Routes
router.get('/users', adminController.getUsers);
router.get('/users/export', adminController.exportUsers);
router.get('/users/:id', adminController.getUserDetails);
router.put('/users/:id', adminController.updateUser);
router.put('/users/:id/status', adminController.updateUserStatus);
router.put('/users/:id/role', adminController.updateUserRole);
router.post('/users/:id/activate', adminController.activateUser);
router.post('/users/:id/deactivate', adminController.deactivateUser);
router.post('/users/:id/suspend', adminController.suspendUser);
router.post('/users/:id/reset-password', adminController.resetPassword);
router.post('/users/:id/invalidate-sessions', adminController.invalidateSessions);
router.get('/users/:id/activity', adminController.getUserActivity);
router.get('/users/:id/filings', adminController.getUserFilings);
router.get('/users/:id/transactions', adminController.getUserTransactions);
router.post('/users/bulk', adminController.bulkOperations);
router.delete('/users/:id', adminController.deleteUser);

// User Notes
router.get('/users/:id/notes', adminController.getUserNotes);
router.post('/users/:id/notes', adminController.createUserNote);
router.put('/users/:id/notes/:noteId', adminController.updateUserNote);
router.delete('/users/:id/notes/:noteId', adminController.deleteUserNote);

// User Verification Queue
router.get('/verification/pending', adminController.getPendingVerifications);
router.post('/verification/:type/:id/approve', adminController.approveVerification);
router.post('/verification/:type/:id/reject', adminController.rejectVerification);

// User Communication
router.post('/users/:id/communicate', adminController.communicateWithUser);
router.get('/users/:id/communication-history', adminController.getUserCommunicationHistory);

// User Tags
router.get('/users/:id/tags', adminController.getUserTags);
router.post('/users/:id/tags', adminController.addUserTag);
router.delete('/users/:id/tags/:tag', adminController.removeUserTag);

// User Groups
router.get('/users/groups', adminController.getUserGroups);
router.post('/users/groups', adminController.createUserGroup);
router.get('/users/groups/:id', adminController.getUserGroup);
router.put('/users/groups/:id', adminController.updateUserGroup);
router.delete('/users/groups/:id', adminController.deleteUserGroup);
router.get('/users/groups/:id/members', adminController.getGroupMembers);
router.post('/users/groups/:id/members', adminController.addGroupMembers);
router.delete('/users/groups/:id/members/:userId', adminController.removeGroupMember);

// User Templates
router.get('/users/templates', adminController.getUserTemplates);
router.post('/users/templates', adminController.createUserTemplate);
router.get('/users/templates/:id', adminController.getUserTemplate);
router.put('/users/templates/:id', adminController.updateUserTemplate);
router.delete('/users/templates/:id', adminController.deleteUserTemplate);
router.post('/users/templates/:id/apply', adminController.applyUserTemplate);

// System Statistics Routes
router.get('/stats', adminController.getSystemStats);
router.get('/activity', adminController.getRecentActivity);

// Filing Management Routes
router.get('/filings', adminController.getFilings);
router.get('/filings/export', adminController.exportFilings);
router.get('/filings/issues', adminController.getFilingIssues);
router.get('/filings/stats', adminController.getFilingStats);
router.get('/filings/analytics', adminController.getFilingAnalytics);
router.get('/filings/:id', adminController.getFilingDetails);
router.put('/filings/:id', adminController.updateFiling);
router.post('/filings/:id/reprocess', adminController.reprocessFiling);
router.post('/filings/:id/cancel', adminController.cancelFiling);
router.get('/filings/:id/audit-log', adminController.getFilingAuditLog);
router.get('/filings/:id/documents', adminController.getFilingDocuments);
router.post('/filings/:id/override-validation', adminController.overrideValidation);
router.post('/filings/:id/flag-review', adminController.flagForReview);
router.post('/filings/:id/add-notes', adminController.addAdminNotes);

// Document Management Routes
router.get('/documents', adminController.getDocuments);
router.get('/documents/storage', adminController.getStorageStats);
router.get('/documents/:id', adminController.getDocumentDetails);
router.delete('/documents/:id', adminController.deleteDocument);
router.post('/documents/:id/reprocess', adminController.reprocessDocument);
router.get('/documents/:id/extracted-data', adminController.getExtractedData);
router.put('/documents/:id/extracted-data', adminController.updateExtractedData);
router.get('/documents/templates', adminController.getDocumentTemplates);
router.post('/documents/templates', adminController.createDocumentTemplate);
router.put('/documents/templates/:id', adminController.updateDocumentTemplate);

// Dashboard & Analytics Routes
router.get('/dashboard/stats', adminController.getDashboardStats.bind(adminController));
router.get('/dashboard/charts/:type', adminController.getChartData.bind(adminController));
router.get('/dashboard/alerts', adminController.getSystemAlerts.bind(adminController));
router.get('/analytics', adminController.getAnalytics.bind(adminController));
router.get('/analytics/users', adminController.getUserAnalytics.bind(adminController));
router.get('/analytics/revenue', adminController.getRevenueAnalytics.bind(adminController));
router.get('/analytics/ca', adminController.getCAAnalytics.bind(adminController));
router.get('/platform/stats', adminController.getPlatformStats);

// Settings Routes
router.get('/settings', adminController.getSettings);
router.put('/settings', adminController.updateSettings);

// Mount financial routes
router.use('/financial', adminFinancialRoutes);

// Mount support routes
router.use('/support', adminSupportRoutes);

// Mount audit routes
router.use('/audit', adminAuditRoutes);

// CA Firms Stats Route
router.get('/ca-firms/stats', adminController.getCAFirmsStats);

// User Limits Route
router.get('/users/limits', adminController.getUserLimits);

// System Health Routes
router.get('/system/health', adminController.getSystemHealth.bind(adminController));
router.get('/system/metrics', adminController.getSystemMetrics.bind(adminController));
router.get('/system/errors', adminController.getSystemErrors.bind(adminController));

// Top Performers Route
router.get('/cas/top-performers', adminController.getTopPerformers.bind(adminController));

// CA Management Routes
router.post('/cas/:id/approve', adminController.approveCA);
router.post('/cas/:id/reject', adminController.rejectCA);
router.post('/cas/:id/suspend', adminController.suspendCA);
router.get('/cas/:id/performance', adminController.getCAPerformance);
router.get('/cas/payouts', adminController.getCAPayouts);
router.post('/cas/payouts/process', adminController.processCAPayouts);
router.get('/cas/:id/payout-history', adminController.getCAPayoutHistory);
router.post('/cas/payouts/schedule', adminController.scheduleCAPayouts);
router.get('/cas/verification-queue', adminController.getCAVerificationQueue);
router.post('/cas/verification/:id/approve', adminController.approveCAVerification);
router.post('/cas/verification/:id/reject', adminController.rejectCAVerification);

// User Segments Routes
router.get('/users/segments', adminController.getUserSegments);
router.post('/users/segments', adminController.createUserSegment);
router.put('/users/segments/:id', adminController.updateUserSegment);
router.delete('/users/segments/:id', adminController.deleteUserSegment);
router.get('/users/segments/:id/members', adminController.getSegmentMembers);

// Error handling middleware
router.use((error, req, res, next) => {
  enterpriseLogger.error('Admin route error', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    adminId: req.user?.id,
  });

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  });
});

enterpriseLogger.info('Admin routes configured');

module.exports = router;