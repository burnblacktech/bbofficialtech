/**
 * CA Routes
 * S14 - Canonical pattern: Routes orchestrate services directly
 */

const express = require('express');
const router = express.Router();
const { authenticateToken, authorize } = require('../middleware/auth');
const { validateMultiple } = require('../middleware/validateRequest');
const {
    addFirmUserSchema,
    updateFirmUserRoleSchema,
    reviewFilingSchema,
    overrideFlagSchema,
} = require('../middleware/validationSchemas');

// Services (canonical pattern)
const CAInboxService = require('../services/ca/CAInboxService');
const FilingReviewService = require('../services/ca/FilingReviewService');
const CAApprovalService = require('../services/ca/CAApprovalService');
const FirmUserService = require('../services/ca/FirmUserService');
const IntelligenceGateService = require('../services/ca/IntelligenceGateService');

// =====================================================
// CA INBOX
// =====================================================

router.get('/inbox', authenticateToken, authorize(['CA', 'CA_FIRM_ADMIN']), async (req, res, next) => {
    try {
        const inbox = await CAInboxService.getInbox(req.user.id, req.user.caFirmId);
        res.json({ success: true, data: inbox });
    } catch (error) {
        next(error);
    }
});

// =====================================================
// FILING REVIEW & APPROVAL
// =====================================================

// Get filing details
router.get('/filings/:filingId', authenticateToken, authorize(['CA', 'CA_FIRM_ADMIN']), async (req, res, next) => {
    try {
        const filing = await FilingReviewService.getFiling(req.params.filingId, req.user);
        res.json({ success: true, data: filing });
    } catch (error) {
        next(error);
    }
});

// Review filing
router.post('/filings/:filingId/review', authenticateToken, authorize(['CA', 'CA_FIRM_ADMIN']), validateMultiple(reviewFilingSchema), async (req, res, next) => {
    try {
        const result = await FilingReviewService.markAsReviewed(req.params.filingId, req.user, req.body.notes);
        res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
});

// Approve filing (submits to ITD)
router.post('/filings/:filingId/approve', authenticateToken, authorize(['CA', 'CA_FIRM_ADMIN']), validateMultiple(reviewFilingSchema), async (req, res, next) => {
    try {
        const result = await CAApprovalService.submitToITD(req.params.filingId, req.user);
        res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
});

// Get review status
router.get('/filings/:filingId/review-status', authenticateToken, authorize(['CA', 'CA_FIRM_ADMIN', 'PREPARER']), async (req, res, next) => {
    try {
        const status = await FilingReviewService.getReviewStatus(req.params.filingId);
        res.json({ success: true, data: status });
    } catch (error) {
        next(error);
    }
});

// =====================================================
// FIRM USER MANAGEMENT
// =====================================================

// Add user to firm
router.post('/firm/users', authenticateToken, authorize(['CA', 'CA_FIRM_ADMIN']), validateMultiple(addFirmUserSchema), async (req, res, next) => {
    try {
        const result = await FirmUserService.addUser(req.user.caFirmId, req.body);
        res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
});

// List firm users
router.get('/firm/users', authenticateToken, authorize(['CA', 'CA_FIRM_ADMIN', 'PREPARER']), async (req, res, next) => {
    try {
        const users = await FirmUserService.listUsers(req.user.caFirmId);
        res.json({ success: true, data: users });
    } catch (error) {
        next(error);
    }
});

// Update user role
router.patch('/firm/users/:userId', authenticateToken, authorize(['CA', 'CA_FIRM_ADMIN']), validateMultiple(updateFirmUserRoleSchema), async (req, res, next) => {
    try {
        const result = await FirmUserService.updateUserRole(req.user.caFirmId, req.params.userId, req.body.role);
        res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
});

// Remove user from firm
router.delete('/firm/users/:userId', authenticateToken, authorize(['CA', 'CA_FIRM_ADMIN']), async (req, res, next) => {
    try {
        const result = await FirmUserService.removeUser(req.user.caFirmId, req.params.userId);
        res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
});

// =====================================================
// INTELLIGENCE GATE
// =====================================================

// Override intelligence flag
router.post('/filings/:filingId/override-flag', authenticateToken, authorize(['CA', 'CA_FIRM_ADMIN']), validateMultiple(overrideFlagSchema), async (req, res, next) => {
    try {
        const result = await IntelligenceGateService.overrideFlag(req.params.filingId, req.user.id, req.body);
        res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
