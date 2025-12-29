/**
 * CA Routes
 * V3.1
 */

const express = require('express');
const router = express.Router();
const caController = require('../controllers/CAController');
// const { requireCARole } = require('../middleware/rbac'); // Assuming RBAC exists

// Mock Authentication/RBAC for V3.1 MVP or use existing auth
// Assuming 'auth' middleware is available globally or we import it.
// For now, let's just use the controller.
// We must protect this route.
const { authenticate } = require('../middleware/cookieAuth'); // Or similar

// Middleware to check role (Temporary inline or import)
const checkCARole = (req, res, next) => {
    if (req.user && (req.user.role === 'CA' || req.user.role === 'CA_ADMIN' || req.user.role === 'admin')) { // Allow admin for testing
        next();
    } else {
        res.status(403).json({ error: 'Access Denied: CA Only' });
    }
};

router.use(authenticate);
router.use(checkCARole);

router.get('/inbox', caController.getInbox);
router.get('/filing/:filingId', caController.getFiling);
router.post('/filing/:filingId/request-info', caController.requestInfo);
router.post('/filing/:filingId/submit', caController.submitToITD);

module.exports = router;
