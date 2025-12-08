// =====================================================
// ADMIN FINANCIAL ROUTES
// Financial management routes for admin
// =====================================================

const express = require('express');
const router = express.Router();
const adminFinancialController = require('../../controllers/AdminFinancialController');
const { authenticateToken } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/rbac');

// Apply authentication and admin check to all routes
router.use(authenticateToken);
router.use(requireRole(['SUPER_ADMIN', 'PLATFORM_ADMIN']));

// Transaction Management Routes
router.get('/transactions/stats', adminFinancialController.getTransactionStats);
router.get('/transactions/export', adminFinancialController.exportTransactions);
router.get('/transactions', adminFinancialController.getTransactions);
router.get('/transactions/:id', adminFinancialController.getTransactionDetails);
router.post('/transactions/:id/notes', adminFinancialController.addTransactionNotes);
router.post('/transactions/:id/dispute', adminFinancialController.markAsDisputed);
router.post('/transactions/:id/resolve-dispute', adminFinancialController.resolveDispute);
router.post('/transactions/:id/retry', adminFinancialController.retryFailedPayment);
router.post('/transactions/:id/refund', adminFinancialController.processRefund);

// Refund Management Routes
router.get('/refunds', adminFinancialController.getRefunds);
router.post('/refunds/:id/approve', adminFinancialController.approveRefund);
router.post('/refunds/:id/reject', adminFinancialController.rejectRefund);
router.post('/refunds/:id/process', adminFinancialController.processRefundRequest);

// Pricing Plans Routes
router.get('/pricing/plans', adminFinancialController.getPricingPlans);
router.post('/pricing/plans', adminFinancialController.createPricingPlan);
router.put('/pricing/plans/:id', adminFinancialController.updatePricingPlan);
router.delete('/pricing/plans/:id', adminFinancialController.deletePricingPlan);

// Coupon Management Routes
router.get('/coupons', adminFinancialController.getCoupons);
router.post('/coupons', adminFinancialController.createCoupon);
router.put('/coupons/:id', adminFinancialController.updateCoupon);
router.delete('/coupons/:id', adminFinancialController.deleteCoupon);
router.get('/coupons/:id/usage', adminFinancialController.getCouponUsage);

module.exports = router;

