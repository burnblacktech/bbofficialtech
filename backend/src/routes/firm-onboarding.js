// =====================================================
// FIRM ONBOARDING ROUTES
// Handles firm onboarding, client onboarding, and assignments
// =====================================================

const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { requireRole, requirePermission } = require('../middleware/rbac');
const { checkFirmAccess } = require('../middleware/dataIsolation');
const ClientProfileService = require('../services/common/ClientProfileService');
const FirmDashboardService = require('../services/common/FirmDashboardService');
const CAFirm = require('../models/CAFirm');
const User = require('../models/User');
const enterpriseLogger = require('../utils/logger');

const router = express.Router();
const clientProfileService = ClientProfileService;
const firmDashboardService = FirmDashboardService;

// =====================================================
// FIRM ONBOARDING (PlatformAdmin only)
// =====================================================

// Create new CA firm
router.post('/firms/onboard', authenticateToken, requireRole(['SUPER_ADMIN', 'PLATFORM_ADMIN']), async (req, res) => {
  try {
    const { name, gstNumber, address, phone, email } = req.body;
    const createdBy = req.user.userId;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Firm name is required',
      });
    }

    const firm = await CAFirm.create({
      name,
      gstNumber,
      address,
      phone,
      email,
      createdBy,
      status: 'active',
    });

    enterpriseLogger.info('CA firm onboarded', {
      firmId: firm.id,
      name: firm.name,
      createdBy,
    });

    res.json({
      success: true,
      data: firm,
    });
  } catch (error) {
    enterpriseLogger.error('Firm onboarding error', {
      error: error.message,
      stack: error.stack,
    });

    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to onboard firm',
    });
  }
});

// =====================================================
// CLIENT ONBOARDING (FirmAdmin)
// =====================================================

// Onboard new client for a firm
router.post('/firms/:firmId/clients', authenticateToken, checkFirmAccess('firmId'), requirePermission('ca_firm.clients_assign'), async (req, res) => {
  try {
    const { firmId } = req.params;
    const clientData = req.body;
    const createdBy = req.user.userId;

    const client = await clientProfileService.onboardClient(firmId, clientData, createdBy);

    res.json({
      success: true,
      data: client,
    });
  } catch (error) {
    enterpriseLogger.error('Client onboarding error', {
      firmId: req.params.firmId,
      error: error.message,
    });

    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to onboard client',
    });
  }
});

// Get client list for a firm
router.get('/firms/:firmId/clients', authenticateToken, checkFirmAccess('firmId'), requirePermission('ca_firm.clients_view'), async (req, res) => {
  try {
    const { firmId } = req.params;
    const filters = {
      status: req.query.status,
      limit: parseInt(req.query.limit) || 100,
      offset: parseInt(req.query.offset) || 0,
    };

    const clients = await firmDashboardService.getClientList(firmId, filters);

    res.json({
      success: true,
      data: clients,
    });
  } catch (error) {
    enterpriseLogger.error('Get client list error', {
      firmId: req.params.firmId,
      error: error.message,
    });

    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to get client list',
    });
  }
});

// =====================================================
// STAFF MANAGEMENT (FirmAdmin)
// =====================================================

// Add staff member to firm
router.post('/firms/:firmId/staff', authenticateToken, checkFirmAccess('firmId'), requirePermission('ca_firm.staff_manage'), async (req, res) => {
  try {
    const { firmId } = req.params;
    const { userId, role } = req.body;

    if (!userId || !role) {
      return res.status(400).json({
        success: false,
        error: 'User ID and role are required',
      });
    }

    const validRoles = ['CA', 'PREPARER', 'REVIEWER'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        error: `Invalid role. Must be one of: ${validRoles.join(', ')}`,
      });
    }

    // Update user's firm association
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Update role and firm
    await user.update({
      caFirmId: firmId,
      role: role.toUpperCase(),
    });

    enterpriseLogger.info('Staff added to firm', {
      firmId,
      userId,
      role,
    });

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    enterpriseLogger.error('Add staff error', {
      firmId: req.params.firmId,
      error: error.message,
    });

    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to add staff',
    });
  }
});

// Get staff list for a firm
router.get('/firms/:firmId/staff', authenticateToken, checkFirmAccess('firmId'), requirePermission('ca_firm.staff_manage'), async (req, res) => {
  try {
    const { firmId } = req.params;

    const staff = await firmDashboardService.getStaffList(firmId);

    res.json({
      success: true,
      data: staff,
    });
  } catch (error) {
    enterpriseLogger.error('Get staff list error', {
      firmId: req.params.firmId,
      error: error.message,
    });

    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to get staff list',
    });
  }
});

// =====================================================
// CLIENT ASSIGNMENTS (FirmAdmin)
// =====================================================

// Assign client to preparer/reviewer
router.post('/clients/:clientId/assign', authenticateToken, requirePermission('ca_firm.clients_assign'), async (req, res) => {
  try {
    const { clientId } = req.params;
    const { userId, role, activeFrom, activeTo, metadata } = req.body;
    const createdBy = req.user.userId;

    if (!userId || !role) {
      return res.status(400).json({
        success: false,
        error: 'User ID and role are required',
      });
    }

    const assignment = await clientProfileService.assignClient(
      clientId,
      userId,
      role,
      createdBy,
      { activeFrom, activeTo, metadata }
    );

    res.json({
      success: true,
      data: assignment,
    });
  } catch (error) {
    enterpriseLogger.error('Assign client error', {
      clientId: req.params.clientId,
      error: error.message,
    });

    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to assign client',
    });
  }
});

// Get assignments for a client
router.get('/clients/:clientId/assignments', authenticateToken, async (req, res) => {
  try {
    const { clientId } = req.params;
    const userId = req.user.userId;

    // Check access
    const user = await User.findByPk(userId);
    const accessCheck = await user.canAccessClient(clientId);
    if (!accessCheck.allowed) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    const assignments = await clientProfileService.getClientAssignments(clientId);

    res.json({
      success: true,
      data: assignments,
    });
  } catch (error) {
    enterpriseLogger.error('Get client assignments error', {
      clientId: req.params.clientId,
      error: error.message,
    });

    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to get assignments',
    });
  }
});

// Revoke assignment
router.delete('/assignments/:assignmentId', authenticateToken, requirePermission('ca_firm.clients_assign'), async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const revokedBy = req.user.userId;
    const { reason } = req.body;

    const assignment = await clientProfileService.revokeAssignment(assignmentId, revokedBy, reason);

    res.json({
      success: true,
      data: assignment,
    });
  } catch (error) {
    enterpriseLogger.error('Revoke assignment error', {
      assignmentId: req.params.assignmentId,
      error: error.message,
    });

    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to revoke assignment',
    });
  }
});

// =====================================================
// FIRM DASHBOARD (FirmAdmin)
// =====================================================

// Get firm dashboard data
router.get('/firms/:firmId/dashboard', authenticateToken, checkFirmAccess('firmId'), requirePermission('ca_firm.clients_view'), async (req, res) => {
  try {
    const { firmId } = req.params;

    const [stats, queueStats] = await Promise.all([
      firmDashboardService.getFirmStats(firmId),
      firmDashboardService.getQueueStats(firmId),
    ]);

    res.json({
      success: true,
      data: {
        ...stats,
        queue: queueStats,
      },
    });
  } catch (error) {
    enterpriseLogger.error('Get firm dashboard error', {
      firmId: req.params.firmId,
      error: error.message,
    });

    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to get dashboard data',
    });
  }
});

// =====================================================
// CA REVIEW QUEUE ROUTES
// =====================================================

const CAReviewQueueService = require('../services/itr/CAReviewQueueService');

// Get review queue for a firm
router.get('/firms/:firmId/review-queue', authenticateToken, checkFirmAccess('firmId'), requirePermission('ca_firm.queue_view'), async (req, res) => {
  try {
    const { firmId } = req.params;
    const filters = {
      status: req.query.status,
      priority: req.query.priority,
      limit: parseInt(req.query.limit) || 50,
      offset: parseInt(req.query.offset) || 0,
    };

    const queue = await CAReviewQueueService.getFirmQueue(firmId, filters);

    res.json({
      success: true,
      data: queue,
    });
  } catch (error) {
    enterpriseLogger.error('Get review queue error', {
      firmId: req.params.firmId,
      error: error.message,
    });

    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to get review queue',
    });
  }
});

// Assign reviewer to a queue item
router.post('/review-queue/:ticketId/assign', authenticateToken, requirePermission('ca_firm.queue_assign'), async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { reviewerId } = req.body;
    const assignedBy = req.user.userId;

    const ticket = await CAReviewQueueService.assignReviewer(ticketId, reviewerId, assignedBy);

    res.json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    enterpriseLogger.error('Assign reviewer error', {
      ticketId: req.params.ticketId,
      error: error.message,
    });

    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to assign reviewer',
    });
  }
});

// Complete a review
router.post('/review-queue/:ticketId/complete', authenticateToken, requirePermission('filings.review'), async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { decision, comments } = req.body;
    const reviewerId = req.user.userId;

    const result = await CAReviewQueueService.completeReview(ticketId, reviewerId, decision, comments);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    enterpriseLogger.error('Complete review error', {
      ticketId: req.params.ticketId,
      error: error.message,
    });

    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to complete review',
    });
  }
});

module.exports = router;

