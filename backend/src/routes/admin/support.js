// =====================================================
// ADMIN SUPPORT ROUTES
// Admin-specific routes for managing support tickets
// =====================================================

const express = require('express');
const router = express.Router();
const adminSupportController = require('../../controllers/AdminSupportController');
const authMiddleware = require('../../middleware/auth');
const { requireRole } = require('../../middleware/rbac');

// Apply authentication and admin middleware to all routes
router.use(authMiddleware.authenticateToken);
router.use(requireRole(['SUPER_ADMIN', 'PLATFORM_ADMIN']));

// Get ticket statistics (must be before :id route)
router.get('/tickets/stats', adminSupportController.getTicketStats);

// Get tickets list with admin filters
router.get('/tickets', adminSupportController.getTickets);

// Get single ticket details with full history
router.get('/tickets/:id', adminSupportController.getTicketDetails);

// Update ticket (admin override)
router.put('/tickets/:id', adminSupportController.updateTicket);

// Add reply to ticket
router.post('/tickets/:id/reply', adminSupportController.addReply);

// Add internal note to ticket
router.post('/tickets/:id/note', adminSupportController.addInternalNote);

// Escalate ticket
router.post('/tickets/:id/escalate', adminSupportController.escalateTicket);

// Change priority
router.post('/tickets/:id/priority', adminSupportController.changePriority);

// Assign ticket to agent
router.post('/tickets/:id/assign', adminSupportController.assignTicket);

// Close ticket
router.post('/tickets/:id/close', adminSupportController.closeTicket);

module.exports = router;

