/**
 * PaymentService — Razorpay integration for filing payments
 *
 * Flow:
 * 1. User clicks "Download JSON" or "Submit" → frontend calls POST /api/payments/create-order
 * 2. Backend creates Razorpay order → returns order ID + amount
 * 3. Frontend opens Razorpay checkout → user pays
 * 4. Frontend sends payment details → POST /api/payments/verify
 * 5. Backend verifies signature → marks order as paid → unlocks filing
 */

const crypto = require('crypto');
const enterpriseLogger = require('../utils/logger');
const { AppError } = require('../middleware/errorHandler');
const { PLANS, getRequiredPlan, generateInvoiceNumber } = require('../constants/pricingPlans');
const Order = require('../models/Order');
const CouponService = require('./CouponService');
const { sequelize } = require('../config/database');

let Razorpay;
let razorpayInstance;

function getRazorpay() {
  if (razorpayInstance) return razorpayInstance;
  if (!Razorpay) {
    try { Razorpay = require('razorpay'); } catch {
      enterpriseLogger.warn('razorpay package not installed — payment features disabled');
      return null;
    }
  }
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    enterpriseLogger.warn('RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET not set');
    return null;
  }
  razorpayInstance = new Razorpay({ key_id: keyId, key_secret: keySecret });
  return razorpayInstance;
}

class PaymentService {
  /**
   * Check if a filing is already paid for
   */
  static async isFilingPaid(filingId) {
    const order = await Order.findOne({
      where: { filingId, status: 'paid' },
    });
    return !!order;
  }

  /**
   * Check if a filing qualifies for free tier
   */
  static isFreeTier(itrType, grossIncome) {
    const plan = getRequiredPlan(itrType, grossIncome);
    return plan.id === 'free';
  }

  /**
   * Create a Razorpay order for a filing
   */
  static async createOrder(userId, filingId, itrType, grossIncome, couponCode) {
    // Check if already paid
    const existing = await Order.findOne({ where: { filingId, status: 'paid' } });
    if (existing) return { alreadyPaid: true, order: existing };

    // Determine plan + price
    const plan = getRequiredPlan(itrType, grossIncome);
    if (plan.id === 'free') {
      const order = await Order.create({
        userId, filingId, planId: plan.id,
        amount: 0, totalAmount: 0, gstAmount: 0, status: 'paid', paidAt: new Date(),
        invoiceNumber: generateInvoiceNumber(await this._nextInvoiceSeq()),
      });
      return { alreadyPaid: false, free: true, order };
    }

    const basePaise = plan.price * 100;
    let discount = 0;

    // Apply coupon via CouponService (database-driven)
    if (couponCode) {
      const couponResult = await CouponService.applyCoupon(couponCode, basePaise);
      discount = couponResult.discount;
    }

    const amountAfterDiscount = Math.max(basePaise - discount, 0);
    const gstPaise = Math.round(amountAfterDiscount * plan.gstRate);
    const totalPaise = amountAfterDiscount + gstPaise;

    // Create Razorpay order
    const rz = getRazorpay();
    if (!rz) {
      throw new AppError('Payment gateway not configured', 503);
    }

    const rzOrder = await rz.orders.create({
      amount: totalPaise,
      currency: 'INR',
      receipt: `filing_${filingId}`,
      notes: { userId, filingId, planId: plan.id, itrType },
    });

    // Save order in DB
    const order = await Order.create({
      userId, filingId, planId: plan.id,
      amount: basePaise, discount, gstAmount: gstPaise, totalAmount: totalPaise,
      razorpayOrderId: rzOrder.id, couponCode: couponCode || null, status: 'created',
    });

    enterpriseLogger.info('Payment order created', {
      orderId: order.id, rzOrderId: rzOrder.id, plan: plan.id, total: totalPaise / 100,
    });

    return {
      alreadyPaid: false,
      free: false,
      order: {
        id: order.id,
        razorpayOrderId: rzOrder.id,
        amount: totalPaise,
        currency: 'INR',
        plan: { id: plan.id, name: plan.name, price: plan.price, priceWithGst: Math.round(totalPaise / 100) },
        discount: discount / 100,
        gst: gstPaise / 100,
        razorpayKeyId: process.env.RAZORPAY_KEY_ID,
      },
    };
  }

  /**
   * Verify Razorpay payment signature and mark order as paid
   */
  static async verifyPayment(razorpayOrderId, razorpayPaymentId, razorpaySignature) {
    const order = await Order.findOne({ where: { razorpayOrderId } });
    if (!order) throw new AppError('Order not found', 404);
    if (order.status === 'paid') return { alreadyPaid: true, order };

    // Verify signature
    const secret = process.env.RAZORPAY_KEY_SECRET;
    const body = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expectedSig = crypto.createHmac('sha256', secret).update(body).digest('hex');

    if (expectedSig !== razorpaySignature) {
      order.status = 'failed';
      await order.save();
      throw new AppError('Payment verification failed — signature mismatch', 400);
    }

    // Wrap coupon increment + order update in a single transaction
    const transaction = await sequelize.transaction();
    try {
      order.razorpayPaymentId = razorpayPaymentId;
      order.razorpaySignature = razorpaySignature;
      order.status = 'paid';
      order.paidAt = new Date();
      order.invoiceNumber = generateInvoiceNumber(await this._nextInvoiceSeq());
      await order.save({ transaction });

      // Increment coupon usage atomically
      if (order.couponCode) {
        await CouponService.incrementUsage(order.couponCode, transaction);
      }

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }

    enterpriseLogger.info('Payment verified', {
      orderId: order.id, paymentId: razorpayPaymentId, amount: order.totalAmount / 100,
    });

    return { alreadyPaid: false, order };
  }

  /**
   * Handle Razorpay webhook events
   * @param {string} eventType - e.g. 'payment.captured', 'payment.failed'
   * @param {object} payload - Parsed webhook body
   * @param {string} signature - x-razorpay-signature header
   * @param {string} rawBody - Raw request body string for HMAC verification
   */
  static async handleWebhookEvent(eventType, payload, signature, rawBody) {
    // Verify webhook signature
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) {
      enterpriseLogger.error('RAZORPAY_WEBHOOK_SECRET not configured');
      throw new AppError('Webhook secret not configured', 500);
    }

    const expectedSig = crypto
      .createHmac('sha256', secret)
      .update(rawBody || JSON.stringify(payload))
      .digest('hex');

    if (expectedSig !== signature) {
      enterpriseLogger.warn('Invalid webhook signature', { eventType });
      throw new AppError('Invalid webhook signature', 400, 'INVALID_WEBHOOK_SIGNATURE');
    }

    const paymentEntity = payload.payload?.payment?.entity;
    if (!paymentEntity) {
      enterpriseLogger.warn('Webhook payload missing payment entity', { eventType });
      return { processed: false, reason: 'Missing payment entity' };
    }

    const razorpayOrderId = paymentEntity.order_id;
    const razorpayPaymentId = paymentEntity.id;

    const order = await Order.findOne({ where: { razorpayOrderId } });
    if (!order) {
      enterpriseLogger.warn('Webhook: order not found', { razorpayOrderId, eventType });
      return { processed: false, reason: 'Order not found' };
    }

    if (eventType === 'payment.captured') {
      // Idempotent — skip if already paid
      if (order.status === 'paid') {
        return { processed: true, idempotent: true };
      }

      const transaction = await sequelize.transaction();
      try {
        order.razorpayPaymentId = razorpayPaymentId;
        order.status = 'paid';
        order.paidAt = new Date();
        if (!order.invoiceNumber) {
          order.invoiceNumber = generateInvoiceNumber(await this._nextInvoiceSeq());
        }
        await order.save({ transaction });

        if (order.couponCode) {
          await CouponService.incrementUsage(order.couponCode, transaction);
        }

        await transaction.commit();
      } catch (err) {
        await transaction.rollback();
        throw err;
      }

      enterpriseLogger.info('Webhook: payment captured', { orderId: order.id, razorpayPaymentId });
      return { processed: true };
    }

    if (eventType === 'payment.failed') {
      if (order.status === 'failed') {
        return { processed: true, idempotent: true };
      }
      order.status = 'failed';
      order.razorpayPaymentId = razorpayPaymentId;
      await order.save();

      enterpriseLogger.info('Webhook: payment failed', { orderId: order.id, razorpayPaymentId });
      return { processed: true };
    }

    enterpriseLogger.info('Webhook: unhandled event type', { eventType });
    return { processed: false, reason: `Unhandled event: ${eventType}` };
  }

  /**
   * Get payment history for a user
   * @param {string} userId
   * @returns {Array} orders sorted by createdAt DESC
   */
  static async getPaymentHistory(userId) {
    const orders = await Order.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: require('../models/ITRFiling'),
          as: 'filing',
          attributes: ['assessmentYear', 'itrType'],
          required: false,
        },
      ],
    });

    return orders.map((o) => ({
      orderId: o.id,
      assessmentYear: o.filing?.assessmentYear || null,
      itrType: o.filing?.itrType || null,
      planName: PLANS[o.planId]?.name || o.planId,
      amount: o.amount,
      discount: o.discount,
      gstAmount: o.gstAmount,
      totalAmount: o.totalAmount,
      status: o.status,
      paidAt: o.paidAt,
      invoiceNumber: o.invoiceNumber,
      createdAt: o.createdAt,
    }));
  }

  /**
   * Get a specific order for receipt generation (with ownership check)
   * @param {string} orderId
   * @param {string} userId
   * @returns {object} Order instance
   */
  static async getOrderForReceipt(orderId, userId) {
    const order = await Order.findByPk(orderId, {
      include: [
        {
          model: require('../models/ITRFiling'),
          as: 'filing',
          attributes: ['assessmentYear', 'itrType', 'taxpayerPan'],
          required: false,
        },
      ],
    });

    if (!order) {
      throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');
    }

    if (order.userId !== userId) {
      throw new AppError('You do not have access to this order', 403, 'FORBIDDEN');
    }

    if (order.status !== 'paid') {
      throw new AppError('Receipt available only for paid orders', 400, 'ORDER_NOT_PAID');
    }

    return order;
  }

  /**
   * Get payment status for a filing
   */
  static async getPaymentStatus(filingId) {
    const order = await Order.findOne({
      where: { filingId },
      order: [['createdAt', 'DESC']],
    });
    if (!order) return { paid: false, plan: null };
    return {
      paid: order.status === 'paid',
      plan: PLANS[order.planId] || null,
      order: {
        id: order.id, status: order.status, planId: order.planId,
        amount: (order.totalAmount || 0) / 100, invoiceNumber: order.invoiceNumber,
        paidAt: order.paidAt,
      },
    };
  }

  static async _nextInvoiceSeq() {
    try {
      const [result] = await sequelize.query(
        'SELECT COUNT(*) as cnt FROM orders WHERE invoice_number IS NOT NULL',
      );
      return (Number(result[0]?.cnt) || 0) + 1;
    } catch { return Date.now() % 100000; }
  }
}

module.exports = PaymentService;
