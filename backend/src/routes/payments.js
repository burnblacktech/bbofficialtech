/**
 * Payment Routes — Razorpay order creation + verification
 */

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const PaymentService = require('../services/PaymentService');
const { PLANS, getRequiredPlan } = require('../constants/pricingPlans');
const enterpriseLogger = require('../utils/logger');

/**
 * GET /api/payments/plans
 * Public — returns all pricing plans
 */
router.get('/plans', (req, res) => {
  const plans = Object.values(PLANS).map(p => ({
    id: p.id, name: p.name, tagline: p.tagline,
    price: p.price, priceWithGst: p.priceWithGst,
    itrTypes: p.itrTypes, features: p.features,
    excludes: p.excludes, popular: p.popular || false,
  }));
  res.json({ success: true, data: plans });
});

/**
 * GET /api/payments/required-plan?itrType=ITR-1&grossIncome=800000
 * Returns which plan the user needs based on their filing
 */
router.get('/required-plan', authenticateToken, (req, res) => {
  const { itrType, grossIncome } = req.query;
  const plan = getRequiredPlan(itrType || 'ITR-1', grossIncome || 0);
  res.json({ success: true, data: { plan: { id: plan.id, name: plan.name, price: plan.price, priceWithGst: plan.priceWithGst } } });
});

/**
 * GET /api/payments/status/:filingId
 * Check if a filing has been paid for
 */
router.get('/status/:filingId', authenticateToken, async (req, res, next) => {
  try {
    const result = await PaymentService.getPaymentStatus(req.params.filingId);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

/**
 * POST /api/payments/create-order
 * Create a Razorpay order for a filing
 */
router.post('/create-order', authenticateToken, async (req, res, next) => {
  try {
    const { filingId, itrType, grossIncome, couponCode } = req.body;
    if (!filingId) return res.status(400).json({ success: false, error: 'filingId is required' });

    const result = await PaymentService.createOrder(
      req.user.userId, filingId, itrType || 'ITR-1', grossIncome || 0, couponCode,
    );

    if (result.alreadyPaid) {
      return res.json({ success: true, data: { alreadyPaid: true } });
    }
    if (result.free) {
      return res.json({ success: true, data: { free: true, invoiceNumber: result.order.invoiceNumber } });
    }

    res.json({ success: true, data: result.order });
  } catch (err) {
    enterpriseLogger.error('Create order failed', { error: err.message });
    next(err);
  }
});

/**
 * POST /api/payments/verify
 * Verify Razorpay payment and unlock filing
 */
router.post('/verify', authenticateToken, async (req, res, next) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({ success: false, error: 'Missing payment details' });
    }

    const result = await PaymentService.verifyPayment(razorpayOrderId, razorpayPaymentId, razorpaySignature);

    res.json({
      success: true,
      data: {
        paid: true,
        invoiceNumber: result.order.invoiceNumber,
        amount: result.order.totalAmount / 100,
      },
    });
  } catch (err) {
    enterpriseLogger.error('Payment verification failed', { error: err.message });
    next(err);
  }
});

module.exports = router;
