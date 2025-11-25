// =====================================================
// SERVICE TICKET ROUTES
// =====================================================

const express = require('express');
const router = express.Router();
const serviceTicketController = require('../controllers/ServiceTicketController');
const authMiddleware = require('../middleware/auth');
const enterpriseLogger = require('../utils/logger');

// Apply authentication middleware to all routes
router.use(authMiddleware.authenticateToken);

// Create a new service ticket
router.post('/', serviceTicketController.createTicket);

// Get user tickets
router.get('/', serviceTicketController.getUserTickets);

// Get ticket details
router.get('/:id', serviceTicketController.getTicketDetails);

// Add message to ticket
router.post('/:id/messages', serviceTicketController.addMessage);

// Update ticket status
router.put('/:id/status', serviceTicketController.updateTicketStatus);

// Assign ticket
router.put('/:id/assign', serviceTicketController.assignTicket);

// Get ticket statistics
router.get('/stats', serviceTicketController.getTicketStats);

// Get ticket types
router.get('/types', serviceTicketController.getTicketTypes);

// Get ticket priorities
router.get('/priorities', serviceTicketController.getTicketPriorities);

// Get service status
router.get('/status', serviceTicketController.getServiceStatus);

// Auto-create ticket for filing (internal endpoint)
router.post('/auto-create', serviceTicketController.autoCreateFilingTicket);

// Error handling middleware
router.use((error, req, res, next) => {
  enterpriseLogger.error('Service ticket route error', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    userId: req.user?.id,
  });

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  });
});

enterpriseLogger.info('Service ticket routes configured');

module.exports = router;
