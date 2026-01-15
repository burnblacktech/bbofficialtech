/**
 * Notification Routes
 */

const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Send notification
router.post('/send', notificationController.sendNotification);

// Get history
router.get('/', notificationController.getHistory);

module.exports = router;
