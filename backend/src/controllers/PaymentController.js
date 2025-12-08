// =====================================================
// PAYMENT CONTROLLER - PAYMENT GATEWAY INTEGRATION
// Comprehensive payment processing and verification
// =====================================================

const Razorpay = require('razorpay');
const crypto = require('crypto');
const { ITRFiling, User, Invoice, CAFirm, TaxPayment } = require('../models');
const ExpertReviewService = require('../services/business/ExpertReviewService');
const InvoiceService = require('../services/business/InvoiceService');
const TaxPaymentService = require('../services/business/TaxPaymentService');
const ITDPaymentGatewayService = require('../services/integration/ITDPaymentGatewayService');
const Form26ASService = require('../services/integration/Form26ASService');
const enterpriseLogger = require('../utils/logger');
const wsManager = require('../services/websocket/WebSocketManager');

// Initialize Razorpay (conditional on environment variables)
let razorpay = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  try {
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    enterpriseLogger.info('Razorpay initialized successfully');
  } catch (error) {
    enterpriseLogger.warn('Razorpay initialization failed', { error: error.message });
  }
} else {
  enterpriseLogger.warn('Razorpay not configured. Missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET. Payment features will be disabled.');
}

class PaymentController {
  /**
   * Create payment order for ITR filing
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async createITRFilingOrder(req, res) {
    try {
      const { amount, currency, receipt, notes } = req.body;
      const userId = req.user.id;

      enterpriseLogger.info('PaymentController: Creating ITR filing order', {
        userId,
        amount,
        currency,
        receipt,
      });

      // Validate amount
      if (!amount || amount < 100) {
        return res.status(400).json({
          success: false,
          message: 'Invalid amount. Minimum amount is ₹1.00',
        });
      }

      // Check if Razorpay is configured
      if (!razorpay) {
        return res.status(503).json({
          success: false,
          message: 'Payment gateway not configured. Please configure RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.',
        });
      }

      // Create Razorpay order
      const order = await razorpay.orders.create({
        amount: amount,
        currency: currency || 'INR',
        receipt: receipt,
        notes: notes,
      });

      enterpriseLogger.info('PaymentController: Razorpay order created', {
        orderId: order.id,
        amount: order.amount,
      });

      res.json({
        success: true,
        order: {
          id: order.id,
          amount: order.amount,
          currency: order.currency,
          receipt: order.receipt,
        },
      });

    } catch (error) {
      enterpriseLogger.error('PaymentController: Error creating ITR filing order', {
        error: error.message,
        userId: req.user.id,
        stack: error.stack,
      });

      res.status(500).json({
        success: false,
        message: 'Failed to create payment order',
      });
    }
  }

  /**
   * Verify payment signature for ITR filing
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async verifyITRFilingPayment(req, res) {
    try {
      const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        filingId,
        expertReview,
        amount,
      } = req.body;

      const userId = req.user.id;

      enterpriseLogger.info('PaymentController: Verifying ITR filing payment', {
        userId,
        filingId,
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
      });

      // Check if payment bypass is enabled
      const bypassPayment = process.env.BYPASS_PAYMENT === 'true' || process.env.NODE_ENV === 'development';
      
      // Handle bypassed payments (mock orders)
      if (bypassPayment && razorpay_order_id && razorpay_order_id.startsWith('order_bypass_')) {
        enterpriseLogger.warn('PaymentController: Payment verification bypassed (Development Mode)', {
          userId,
          filingId,
          orderId: razorpay_order_id,
        });

        // Mark payment as verified in bypass mode
        // Continue with normal payment processing flow
        // Note: In production, this should never happen
      } else if (bypassPayment && razorpay_signature === 'bypassed') {
        // Explicit bypass signature
        enterpriseLogger.warn('PaymentController: Payment verification bypassed - Development Mode', {
          userId,
          filingId,
          orderId: razorpay_order_id,
        });
      } else {
        // Normal payment verification
        if (!razorpay) {
          if (bypassPayment) {
            // Bypass mode: Accept payment without verification
            enterpriseLogger.warn('PaymentController: Payment verification bypassed - Razorpay not configured', {
              userId,
              filingId,
            });
          } else {
            return res.status(503).json({
              success: false,
              message: 'Payment gateway not configured',
            });
          }
        } else {
          // Verify payment signature
          const body = razorpay_order_id + '|' + razorpay_payment_id;
          const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');

          if (expectedSignature !== razorpay_signature) {
            enterpriseLogger.warn('PaymentController: Invalid payment signature', {
              userId,
              filingId,
              paymentId: razorpay_payment_id,
            });

            return res.status(400).json({
              success: false,
              message: 'Invalid payment signature',
            });
          }
        }
      }

      // Get filing data
      const filing = await ITRFiling.findByPk(filingId, {
        include: [{ model: User }],
      });

      if (!filing) {
        return res.status(404).json({
          success: false,
          message: 'ITR filing not found',
        });
      }

      // Update filing with payment details
      await ITRFiling.update(
        {
          payment_status: 'paid',
          payment_id: razorpay_payment_id,
          payment_order_id: razorpay_order_id,
          payment_amount: amount,
          payment_completed_at: new Date(),
        },
        { where: { id: filingId } },
      );

      // Prepare payment data
      const paymentData = {
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        amount: amount,
        paymentMethod: 'razorpay',
        expertReview: expertReview || false,
      };

      // Generate invoice
      const invoiceResult = await InvoiceService.generateITRFilingInvoice(
        paymentData,
        filing,
      );

      // Handle expert review if requested
      if (expertReview) {
        await ExpertReviewService.flagForExpertReview(filing, paymentData);
      }

      enterpriseLogger.info('PaymentController: ITR filing payment verified successfully', {
        userId,
        filingId,
        paymentId: razorpay_payment_id,
        invoiceId: invoiceResult.invoiceId,
      });

      // Broadcast WebSocket events for payment and revenue updates
      try {
        // Broadcast revenue update to admins
        wsManager.broadcastToAdmins('REVENUE_UPDATE', {
          amount,
          paymentId: razorpay_payment_id,
          invoiceId: invoiceResult.invoiceId,
          userId,
          filingId,
          showToast: false,
        });

        // Broadcast dashboard stats update to user
        wsManager.broadcastToUser(userId, 'DASHBOARD_STATS_UPDATE', {
          userId,
          showToast: false,
        });

        // Broadcast user activity
        wsManager.broadcastToUser(userId, 'USER_ACTIVITY', {
          userId,
          type: 'payment_completed',
          filingId,
          amount,
          showToast: false,
        });
      } catch (wsError) {
        enterpriseLogger.warn('Failed to broadcast WebSocket event for payment', {
          error: wsError.message,
          paymentId: razorpay_payment_id,
        });
      }

      res.json({
        success: true,
        message: 'Payment verified successfully',
        data: {
          paymentId: razorpay_payment_id,
          orderId: razorpay_order_id,
          amount: amount,
          invoiceId: invoiceResult.invoiceId,
          invoiceNumber: invoiceResult.invoiceNumber,
          expertReview: expertReview || false,
        },
      });

    } catch (error) {
      enterpriseLogger.error('PaymentController: Error verifying ITR filing payment', {
        error: error.message,
        userId: req.user.id,
        stack: error.stack,
      });

      res.status(500).json({
        success: false,
        message: 'Failed to verify payment',
      });
    }
  }

  /**
   * Create payment order for CA subscription
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async createSubscriptionOrder(req, res) {
    try {
      const { planId, billingCycle, amount, currency, firmDetails } = req.body;
      const userId = req.user.id;

      enterpriseLogger.info('PaymentController: Creating subscription order', {
        userId,
        planId,
        billingCycle,
        amount,
      });

      // Validate amount
      if (!amount || amount < 100) {
        return res.status(400).json({
          success: false,
          message: 'Invalid amount. Minimum amount is ₹1.00',
        });
      }

      // Check if Razorpay is configured
      if (!razorpay) {
        return res.status(503).json({
          success: false,
          message: 'Payment gateway not configured. Please configure RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.',
        });
      }

      // Create Razorpay order
      const order = await razorpay.orders.create({
        amount: amount,
        currency: currency || 'INR',
        receipt: `subscription_${planId}_${Date.now()}`,
        notes: {
          planId: planId,
          billingCycle: billingCycle,
          firmDetails: firmDetails,
        },
      });

      enterpriseLogger.info('PaymentController: Subscription order created', {
        orderId: order.id,
        amount: order.amount,
      });

      res.json({
        success: true,
        order: {
          id: order.id,
          amount: order.amount,
          currency: order.currency,
          receipt: order.receipt,
        },
      });

    } catch (error) {
      enterpriseLogger.error('PaymentController: Error creating subscription order', {
        error: error.message,
        userId: req.user.id,
        stack: error.stack,
      });

      res.status(500).json({
        success: false,
        message: 'Failed to create payment order',
      });
    }
  }

  /**
   * Verify payment signature for CA subscription
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async verifySubscriptionPayment(req, res) {
    try {
      const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        planId,
        billingCycle,
        firmDetails,
        amount,
      } = req.body;

      const userId = req.user.id;

      enterpriseLogger.info('PaymentController: Verifying subscription payment', {
        userId,
        planId,
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
      });

      // Verify payment signature
      const body = razorpay_order_id + '|' + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest('hex');

      if (expectedSignature !== razorpay_signature) {
        enterpriseLogger.warn('PaymentController: Invalid payment signature', {
          userId,
          planId,
          paymentId: razorpay_payment_id,
        });

        return res.status(400).json({
          success: false,
          message: 'Invalid payment signature',
        });
      }

      // Create CA firm
      const caFirm = await CAFirm.create({
        name: firmDetails.firmName,
        contactPerson: firmDetails.contactPerson,
        email: firmDetails.email,
        phone: firmDetails.phone,
        address: firmDetails.address,
        gstNumber: firmDetails.gstNumber,
        panNumber: firmDetails.panNumber,
        registrationNumber: firmDetails.registrationNumber,
        subscriptionPlanId: planId,
        subscriptionBillingCycle: billingCycle,
        subscriptionStatus: 'active',
        subscriptionStartDate: new Date(),
        subscriptionEndDate: billingCycle === 'monthly'
          ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        paymentId: razorpay_payment_id,
        paymentOrderId: razorpay_order_id,
      });

      // Update user role to CA firm admin
      await User.update(
        { role: 'ca_firm_admin' },
        { where: { id: userId } },
      );

      // Prepare payment data
      const paymentData = {
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        amount: amount,
        paymentMethod: 'razorpay',
      };

      // Prepare subscription data
      const subscriptionData = {
        id: caFirm.id,
        userId: userId,
        planId: planId,
        planName: firmDetails.planName,
        billingCycle: billingCycle,
        clientLimit: firmDetails.clientLimit,
      };

      // Generate invoice
      const invoiceResult = await InvoiceService.generateSubscriptionInvoice(
        paymentData,
        subscriptionData,
      );

      enterpriseLogger.info('PaymentController: Subscription payment verified successfully', {
        userId,
        planId,
        paymentId: razorpay_payment_id,
        firmId: caFirm.id,
        invoiceId: invoiceResult.invoiceId,
      });

      res.json({
        success: true,
        message: 'Payment verified successfully',
        data: {
          paymentId: razorpay_payment_id,
          orderId: razorpay_order_id,
          amount: amount,
          firmId: caFirm.id,
          invoiceId: invoiceResult.invoiceId,
          invoiceNumber: invoiceResult.invoiceNumber,
        },
      });

    } catch (error) {
      enterpriseLogger.error('PaymentController: Error verifying subscription payment', {
        error: error.message,
        userId: req.user.id,
        stack: error.stack,
      });

      res.status(500).json({
        success: false,
        message: 'Failed to verify payment',
      });
    }
  }

  /**
   * Get payment status
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getPaymentStatus(req, res) {
    try {
      const { paymentId } = req.params;
      const userId = req.user.id;

      enterpriseLogger.info('PaymentController: Getting payment status', {
        userId,
        paymentId,
      });

      // Get payment details from Razorpay
      const payment = await razorpay.payments.fetch(paymentId);

      // Get invoice details
      const invoice = await Invoice.findOne({
        where: { paymentId: paymentId },
      });

      res.json({
        success: true,
        data: {
          paymentId: payment.id,
          status: payment.status,
          amount: payment.amount,
          currency: payment.currency,
          method: payment.method,
          createdAt: payment.created_at,
          invoiceId: invoice?.id,
          invoiceNumber: invoice?.invoiceNumber,
        },
      });

    } catch (error) {
      enterpriseLogger.error('PaymentController: Error getting payment status', {
        error: error.message,
        userId: req.user.id,
        stack: error.stack,
      });

      res.status(500).json({
        success: false,
        message: 'Failed to get payment status',
      });
    }
  }

  /**
   * Get user payment history
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getPaymentHistory(req, res) {
    try {
      const userId = req.user.id;
      const { limit = 50, offset = 0 } = req.query;

      enterpriseLogger.info('PaymentController: Getting payment history', {
        userId,
        limit,
        offset,
      });

      // Get invoices for user
      const invoices = await Invoice.findAll({
        where: { userId },
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset),
      });

      res.json({
        success: true,
        data: {
          payments: invoices.map(invoice => ({
            id: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            type: invoice.type,
            status: invoice.status,
            amount: invoice.amount,
            currency: invoice.currency,
            description: invoice.description,
            paymentId: invoice.paymentId,
            createdAt: invoice.createdAt,
          })),
          total: invoices.length,
        },
      });

    } catch (error) {
      enterpriseLogger.error('PaymentController: Error getting payment history', {
        error: error.message,
        userId: req.user.id,
        stack: error.stack,
      });

      res.status(500).json({
        success: false,
        message: 'Failed to get payment history',
      });
    }
  }

  // =====================================================
  // TAX PAYMENT METHODS
  // =====================================================

  /**
   * Create tax payment order (Razorpay)
   * POST /api/payments/tax/create-order
   */
  async createTaxPaymentOrder(req, res) {
    try {
      const userId = req.user.userId || req.user.id;
      const { filingId, paymentId } = req.body;

      enterpriseLogger.info('Creating tax payment order', {
        userId,
        filingId,
        paymentId,
      });

      const result = await TaxPaymentService.createPaymentOrder(filingId, paymentId, req.body);

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      enterpriseLogger.error('Failed to create tax payment order', {
        error: error.message,
        userId: req.user?.userId || req.user?.id,
      });
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Failed to create tax payment order',
      });
    }
  }

  /**
   * Verify tax payment
   * POST /api/payments/tax/verify
   */
  async verifyTaxPayment(req, res) {
    try {
      const userId = req.user.userId || req.user.id;
      const { paymentId, ...verificationData } = req.body;

      enterpriseLogger.info('Verifying tax payment', {
        userId,
        paymentId,
      });

      const result = await TaxPaymentService.verifyPayment(paymentId, verificationData);

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      enterpriseLogger.error('Failed to verify tax payment', {
        error: error.message,
        userId: req.user?.userId || req.user?.id,
      });
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Failed to verify tax payment',
      });
    }
  }

  /**
   * Initiate ITD payment
   * POST /api/payments/tax/itd/initiate
   */
  async initiateITDPayment(req, res) {
    try {
      const userId = req.user.userId || req.user.id;
      const { filingId, paymentId } = req.body;

      enterpriseLogger.info('Initiating ITD payment', {
        userId,
        filingId,
        paymentId,
      });

      const result = await TaxPaymentService.initiateITDPayment(filingId, paymentId);

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      enterpriseLogger.error('Failed to initiate ITD payment', {
        error: error.message,
        userId: req.user?.userId || req.user?.id,
      });
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Failed to initiate ITD payment',
      });
    }
  }

  /**
   * Handle ITD payment callback/webhook
   * POST /api/payments/tax/itd/callback
   */
  async handleITDCallback(req, res) {
    try {
      enterpriseLogger.info('Handling ITD payment callback', {
        callbackData: req.body,
      });

      // Process callback
      const callbackData = await ITDPaymentGatewayService.handleCallback(req.body);

      // Find payment by challan number
      const taxPayment = await TaxPayment.findByChallanNumber(callbackData.challanNumber);
      
      if (!taxPayment) {
        enterpriseLogger.warn('Tax payment not found for ITD callback', {
          challanNumber: callbackData.challanNumber,
        });
        return res.status(404).json({
          success: false,
          error: 'Tax payment not found',
        });
      }

      // Verify payment
      const result = await TaxPaymentService.verifyPayment(taxPayment.id, {
        transaction_id: callbackData.transactionId,
        status: callbackData.status,
        amount: callbackData.amount,
      });

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      enterpriseLogger.error('Failed to handle ITD callback', {
        error: error.message,
      });
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Failed to handle ITD callback',
      });
    }
  }

  /**
   * Upload payment proof
   * POST /api/payments/tax/:paymentId/proof
   */
  async uploadPaymentProof(req, res) {
    try {
      const userId = req.user.userId || req.user.id;
      const { paymentId } = req.params;
      const { proofUrl } = req.body;

      enterpriseLogger.info('Uploading payment proof', {
        userId,
        paymentId,
      });

      // Verify user owns this payment
      const taxPayment = await TaxPayment.findByPk(paymentId);
      if (!taxPayment || taxPayment.userId !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Unauthorized access to payment',
        });
      }

      const result = await TaxPaymentService.uploadPaymentProof(paymentId, proofUrl);

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      enterpriseLogger.error('Failed to upload payment proof', {
        error: error.message,
        userId: req.user?.userId || req.user?.id,
      });
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Failed to upload payment proof',
      });
    }
  }

  /**
   * Verify payment via Form 26AS
   * POST /api/payments/tax/:paymentId/verify-26as
   */
  async verifyVia26AS(req, res) {
    try {
      const userId = req.user.userId || req.user.id;
      const { paymentId } = req.params;

      enterpriseLogger.info('Verifying payment via 26AS', {
        userId,
        paymentId,
      });

      const result = await TaxPaymentService.verifyVia26AS(paymentId);

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      enterpriseLogger.error('Failed to verify payment via 26AS', {
        error: error.message,
        userId: req.user?.userId || req.user?.id,
      });
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Failed to verify payment via 26AS',
      });
    }
  }

  /**
   * Get tax payment status
   * GET /api/payments/tax/:paymentId/status
   */
  async getTaxPaymentStatus(req, res) {
    try {
      const userId = req.user.userId || req.user.id;
      const { paymentId } = req.params;

      const result = await TaxPaymentService.getPaymentStatus(paymentId);

      // Verify user owns this payment
      const taxPayment = await TaxPayment.findByPk(paymentId);
      if (!taxPayment || taxPayment.userId !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Unauthorized access to payment',
        });
      }

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      enterpriseLogger.error('Failed to get tax payment status', {
        error: error.message,
        userId: req.user?.userId || req.user?.id,
      });
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Failed to get tax payment status',
      });
    }
  }

  /**
   * Get tax payment history for a filing
   * GET /api/payments/tax/filing/:filingId/history
   */
  async getTaxPaymentHistory(req, res) {
    try {
      const userId = req.user.userId || req.user.id;
      const { filingId } = req.params;

      // Verify user owns this filing
      const filing = await ITRFiling.findByPk(filingId);
      if (!filing || filing.userId !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Unauthorized access to filing',
        });
      }

      const result = await TaxPaymentService.getPaymentHistory(filingId);

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      enterpriseLogger.error('Failed to get tax payment history', {
        error: error.message,
        userId: req.user?.userId || req.user?.id,
      });
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Failed to get tax payment history',
      });
    }
  }
}

module.exports = new PaymentController();
