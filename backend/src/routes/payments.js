/**
 * Payment Routes — Razorpay order creation, verification, webhooks, history, receipts
 */

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const PaymentService = require('../services/PaymentService');
const InvoiceService = require('../services/InvoiceService');
const { PLANS, getRequiredPlan } = require('../constants/pricingPlans');
const enterpriseLogger = require('../utils/logger');

/**
 * POST /api/payments/webhook
 * Razorpay webhook — no JWT auth, raw body for HMAC verification
 */
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    if (!signature) {
      enterpriseLogger.warn('Webhook: missing signature header');
      return res.status(400).json({ error: 'Missing signature' });
    }

    // Parse raw body
    const body = typeof req.body === 'string' ? req.body : req.body.toString('utf8');
    let payload;
    try {
      payload = JSON.parse(body);
    } catch {
      return res.status(400).json({ error: 'Invalid JSON body' });
    }

    const eventType = payload.event;
    if (!eventType) {
      return res.status(400).json({ error: 'Missing event type' });
    }

    const result = await PaymentService.handleWebhookEvent(eventType, payload, signature, body);
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    if (err.code === 'INVALID_WEBHOOK_SIGNATURE') {
      return res.status(400).json({ error: err.message });
    }
    enterpriseLogger.error('Webhook processing error', { error: err.message });
    return res.status(200).json({ success: false, error: 'Internal processing error' });
  }
});

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
    const { ITRFiling } = require('../models');
    const filing = await ITRFiling.findByPk(req.params.filingId);
    if (!filing || filing.createdBy !== req.user.userId) return res.status(404).json({ success: false, error: 'Filing not found' });
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

    const { ITRFiling } = require('../models');
    const filing = await ITRFiling.findByPk(filingId);
    if (!filing || filing.createdBy !== req.user.userId) return res.status(404).json({ success: false, error: 'Filing not found' });

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

    const result = await PaymentService.verifyPayment(razorpayOrderId, razorpayPaymentId, razorpaySignature, req.user.userId);

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

/**
 * GET /api/payments/history
 * Payment history for authenticated user
 */
router.get('/history', authenticateToken, async (req, res, next) => {
  try {
    const orders = await PaymentService.getPaymentHistory(req.user.userId);
    res.json({ success: true, data: orders });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/payments/:orderId/receipt
 * Download PDF receipt for a paid order
 */
router.get('/:orderId/receipt', authenticateToken, async (req, res, next) => {
  try {
    const order = await PaymentService.getOrderForReceipt(req.params.orderId, req.user.userId);

    // Build invoice data if not already present
    if (!order.metadata?.invoice) {
      const { User } = require('../models');
      const user = await User.findByPk(order.userId);
      await InvoiceService.buildInvoiceData(order, user, order.filing);
      await order.reload();
    }

    const pdfBuffer = await InvoiceService.generatePDF(order);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="invoice-${order.invoiceNumber || order.id}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    res.send(pdfBuffer);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
