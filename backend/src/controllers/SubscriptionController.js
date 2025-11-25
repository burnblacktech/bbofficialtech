// =====================================================
// SUBSCRIPTION CONTROLLER - CA FIRM SUBSCRIPTION MANAGEMENT
// Comprehensive subscription plan management and processing
// =====================================================

const { CAFirm, User, Invoice } = require('../models');
const enterpriseLogger = require('../utils/logger');

class SubscriptionController {
  /**
   * Get all subscription plans
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getPlans(req, res) {
    try {
      const { limit, offset } = req.query;

      enterpriseLogger.info('SubscriptionController: Getting subscription plans', {
        limit,
        offset,
      });

      // Mock subscription plans (in production, this would come from database)
      const plans = [
        {
          id: 1,
          name: 'Basic Plan',
          clientLimit: 50,
          monthlyPrice: 5000,
          annualPrice: 50000,
          features: [
            'Up to 50 clients',
            'Basic ITR filing support',
            'Email support',
            'Standard templates',
            'Basic analytics',
          ],
          popular: false,
          recommended: false,
        },
        {
          id: 2,
          name: 'Pro Plan',
          clientLimit: 200,
          monthlyPrice: 15000,
          annualPrice: 150000,
          features: [
            'Up to 200 clients',
            'Advanced ITR filing support',
            'Priority support',
            'Custom templates',
            'Bulk operations',
            'Advanced analytics',
            'Team collaboration',
          ],
          popular: true,
          recommended: false,
        },
        {
          id: 3,
          name: 'Enterprise Plan',
          clientLimit: 1000,
          monthlyPrice: 50000,
          annualPrice: 500000,
          features: [
            'Unlimited clients',
            'Full platform access',
            'Dedicated support',
            'Custom integrations',
            'White-label options',
            'Advanced analytics',
            'API access',
            'Custom workflows',
          ],
          popular: false,
          recommended: true,
        },
      ];

      res.json({
        success: true,
        data: {
          plans: plans.slice(offset, offset + limit),
          total: plans.length,
        },
      });

    } catch (error) {
      enterpriseLogger.error('SubscriptionController: Error getting subscription plans', {
        error: error.message,
        stack: error.stack,
      });

      res.status(500).json({
        success: false,
        message: 'Failed to get subscription plans',
      });
    }
  }

  /**
   * Get subscription plan by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getPlan(req, res) {
    try {
      const { planId } = req.params;

      enterpriseLogger.info('SubscriptionController: Getting subscription plan', {
        planId,
      });

      // Mock subscription plan (in production, this would come from database)
      const plans = {
        1: {
          id: 1,
          name: 'Basic Plan',
          clientLimit: 50,
          monthlyPrice: 5000,
          annualPrice: 50000,
          features: [
            'Up to 50 clients',
            'Basic ITR filing support',
            'Email support',
            'Standard templates',
            'Basic analytics',
          ],
          popular: false,
          recommended: false,
        },
        2: {
          id: 2,
          name: 'Pro Plan',
          clientLimit: 200,
          monthlyPrice: 15000,
          annualPrice: 150000,
          features: [
            'Up to 200 clients',
            'Advanced ITR filing support',
            'Priority support',
            'Custom templates',
            'Bulk operations',
            'Advanced analytics',
            'Team collaboration',
          ],
          popular: true,
          recommended: false,
        },
        3: {
          id: 3,
          name: 'Enterprise Plan',
          clientLimit: 1000,
          monthlyPrice: 50000,
          annualPrice: 500000,
          features: [
            'Unlimited clients',
            'Full platform access',
            'Dedicated support',
            'Custom integrations',
            'White-label options',
            'Advanced analytics',
            'API access',
            'Custom workflows',
          ],
          popular: false,
          recommended: true,
        },
      };

      const plan = plans[planId];

      if (!plan) {
        return res.status(404).json({
          success: false,
          message: 'Subscription plan not found',
        });
      }

      res.json({
        success: true,
        data: plan,
      });

    } catch (error) {
      enterpriseLogger.error('SubscriptionController: Error getting subscription plan', {
        error: error.message,
        planId: req.params.planId,
        stack: error.stack,
      });

      res.status(500).json({
        success: false,
        message: 'Failed to get subscription plan',
      });
    }
  }

  /**
   * Create subscription order
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async createOrder(req, res) {
    try {
      const { planId, billingCycle, amount, currency, firmDetails } = req.body;
      const userId = req.user.id;

      enterpriseLogger.info('SubscriptionController: Creating subscription order', {
        userId,
        planId,
        billingCycle,
        amount,
      });

      // Validate plan exists
      const plan = await this.getPlanById(planId);
      if (!plan) {
        return res.status(404).json({
          success: false,
          message: 'Subscription plan not found',
        });
      }

      // Validate amount
      const expectedAmount = billingCycle === 'monthly' ? plan.monthlyPrice : plan.annualPrice;
      if (amount !== expectedAmount * 100) { // Convert to paise
        return res.status(400).json({
          success: false,
          message: 'Invalid amount for selected plan',
        });
      }

      // Create Razorpay order
      const Razorpay = require('razorpay');
      const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      });

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

      enterpriseLogger.info('SubscriptionController: Subscription order created', {
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
      enterpriseLogger.error('SubscriptionController: Error creating subscription order', {
        error: error.message,
        userId: req.user.id,
        stack: error.stack,
      });

      res.status(500).json({
        success: false,
        message: 'Failed to create subscription order',
      });
    }
  }

  /**
   * Verify subscription payment signature
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async verifySignature(req, res) {
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

      enterpriseLogger.info('SubscriptionController: Verifying subscription payment', {
        userId,
        planId,
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
      });

      // Verify payment signature
      const crypto = require('crypto');
      const body = razorpay_order_id + '|' + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest('hex');

      if (expectedSignature !== razorpay_signature) {
        enterpriseLogger.warn('SubscriptionController: Invalid payment signature', {
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

      // Generate invoice
      const InvoiceService = require('../services/InvoiceService');
      const paymentData = {
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        amount: amount,
        paymentMethod: 'razorpay',
      };

      const subscriptionData = {
        id: caFirm.id,
        userId: userId,
        planId: planId,
        planName: firmDetails.planName,
        billingCycle: billingCycle,
        clientLimit: firmDetails.clientLimit,
      };

      const invoiceResult = await InvoiceService.generateSubscriptionInvoice(
        paymentData,
        subscriptionData,
      );

      enterpriseLogger.info('SubscriptionController: Subscription payment verified successfully', {
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
      enterpriseLogger.error('SubscriptionController: Error verifying subscription payment', {
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
   * Get subscription status
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getSubscriptionStatus(req, res) {
    try {
      const userId = req.user.id;

      enterpriseLogger.info('SubscriptionController: Getting subscription status', {
        userId,
      });

      // Get CA firm subscription
      const caFirm = await CAFirm.findOne({
        where: { userId },
        include: [{ model: User }],
      });

      if (!caFirm) {
        return res.status(404).json({
          success: false,
          message: 'No subscription found',
        });
      }

      res.json({
        success: true,
        data: {
          firmId: caFirm.id,
          firmName: caFirm.name,
          subscriptionPlanId: caFirm.subscriptionPlanId,
          subscriptionBillingCycle: caFirm.subscriptionBillingCycle,
          subscriptionStatus: caFirm.subscriptionStatus,
          subscriptionStartDate: caFirm.subscriptionStartDate,
          subscriptionEndDate: caFirm.subscriptionEndDate,
          clientLimit: caFirm.clientLimit,
          currentClients: caFirm.currentClients || 0,
        },
      });

    } catch (error) {
      enterpriseLogger.error('SubscriptionController: Error getting subscription status', {
        error: error.message,
        userId: req.user.id,
        stack: error.stack,
      });

      res.status(500).json({
        success: false,
        message: 'Failed to get subscription status',
      });
    }
  }

  /**
   * Get subscription history
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getSubscriptionHistory(req, res) {
    try {
      const userId = req.user.id;
      const { limit = 50, offset = 0 } = req.query;

      enterpriseLogger.info('SubscriptionController: Getting subscription history', {
        userId,
        limit,
        offset,
      });

      // Get invoices for user
      const invoices = await Invoice.findAll({
        where: {
          userId,
          type: 'ca_subscription',
        },
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset),
      });

      res.json({
        success: true,
        data: {
          subscriptions: invoices.map(invoice => ({
            id: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
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
      enterpriseLogger.error('SubscriptionController: Error getting subscription history', {
        error: error.message,
        userId: req.user.id,
        stack: error.stack,
      });

      res.status(500).json({
        success: false,
        message: 'Failed to get subscription history',
      });
    }
  }

  /**
   * Cancel subscription
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async cancelSubscription(req, res) {
    try {
      const userId = req.user.id;

      enterpriseLogger.info('SubscriptionController: Cancelling subscription', {
        userId,
      });

      // Get CA firm subscription
      const caFirm = await CAFirm.findOne({
        where: { userId },
      });

      if (!caFirm) {
        return res.status(404).json({
          success: false,
          message: 'No subscription found',
        });
      }

      // Update subscription status
      await CAFirm.update(
        {
          subscriptionStatus: 'cancelled',
          subscriptionCancelledAt: new Date(),
        },
        { where: { id: caFirm.id } },
      );

      enterpriseLogger.info('SubscriptionController: Subscription cancelled successfully', {
        userId,
        firmId: caFirm.id,
      });

      res.json({
        success: true,
        message: 'Subscription cancelled successfully',
      });

    } catch (error) {
      enterpriseLogger.error('SubscriptionController: Error cancelling subscription', {
        error: error.message,
        userId: req.user.id,
        stack: error.stack,
      });

      res.status(500).json({
        success: false,
        message: 'Failed to cancel subscription',
      });
    }
  }

  /**
   * Upgrade subscription
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async upgradeSubscription(req, res) {
    try {
      const { planId } = req.body;
      const userId = req.user.id;

      enterpriseLogger.info('SubscriptionController: Upgrading subscription', {
        userId,
        planId,
      });

      // Get CA firm subscription
      const caFirm = await CAFirm.findOne({
        where: { userId },
      });

      if (!caFirm) {
        return res.status(404).json({
          success: false,
          message: 'No subscription found',
        });
      }

      // Validate plan exists
      const plan = await this.getPlanById(planId);
      if (!plan) {
        return res.status(404).json({
          success: false,
          message: 'Subscription plan not found',
        });
      }

      // Update subscription plan
      await CAFirm.update(
        {
          subscriptionPlanId: planId,
          clientLimit: plan.clientLimit,
        },
        { where: { id: caFirm.id } },
      );

      enterpriseLogger.info('SubscriptionController: Subscription upgraded successfully', {
        userId,
        firmId: caFirm.id,
        newPlanId: planId,
      });

      res.json({
        success: true,
        message: 'Subscription upgraded successfully',
      });

    } catch (error) {
      enterpriseLogger.error('SubscriptionController: Error upgrading subscription', {
        error: error.message,
        userId: req.user.id,
        stack: error.stack,
      });

      res.status(500).json({
        success: false,
        message: 'Failed to upgrade subscription',
      });
    }
  }

  /**
   * Get plan by ID (helper method)
   * @param {number} planId - Plan ID
   * @returns {Object} - Plan data
   */
  async getPlanById(planId) {
    // Mock plan data (in production, this would come from database)
    const plans = {
      1: {
        id: 1,
        name: 'Basic Plan',
        clientLimit: 50,
        monthlyPrice: 5000,
        annualPrice: 50000,
        features: [
          'Up to 50 clients',
          'Basic ITR filing support',
          'Email support',
          'Standard templates',
          'Basic analytics',
        ],
      },
      2: {
        id: 2,
        name: 'Pro Plan',
        clientLimit: 200,
        monthlyPrice: 15000,
        annualPrice: 150000,
        features: [
          'Up to 200 clients',
          'Advanced ITR filing support',
          'Priority support',
          'Custom templates',
          'Bulk operations',
          'Advanced analytics',
          'Team collaboration',
        ],
      },
      3: {
        id: 3,
        name: 'Enterprise Plan',
        clientLimit: 1000,
        monthlyPrice: 50000,
        annualPrice: 500000,
        features: [
          'Unlimited clients',
          'Full platform access',
          'Dedicated support',
          'Custom integrations',
          'White-label options',
          'Advanced analytics',
          'API access',
          'Custom workflows',
        ],
      },
    };

    return plans[planId] || null;
  }
}

module.exports = new SubscriptionController();
