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
      // Create a free order (no Razorpay needed)
      const order = await Order.create({
        userId, filingId, planId: plan.id,
        amount: 0, totalAmount: 0, gstAmount: 0, status: 'paid', paidAt: new Date(),
        invoiceNumber: generateInvoiceNumber(await this._nextInvoiceSeq()),
      });
      return { alreadyPaid: false, free: true, order };
    }

    let amountPaise = plan.price * 100;
    let discount = 0;

    // Apply coupon
    if (couponCode) {
      const couponDiscount = this._applyCoupon(couponCode, amountPaise);
      discount = couponDiscount;
      amountPaise = Math.max(amountPaise - discount, 0);
    }

    const gstPaise = Math.round(amountPaise * plan.gstRate);
    const totalPaise = amountPaise + gstPaise;

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
      amount: amountPaise, discount, gstAmount: gstPaise, totalAmount: totalPaise,
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

    // Mark as paid
    order.razorpayPaymentId = razorpayPaymentId;
    order.razorpaySignature = razorpaySignature;
    order.status = 'paid';
    order.paidAt = new Date();
    order.invoiceNumber = generateInvoiceNumber(await this._nextInvoiceSeq());
    await order.save();

    enterpriseLogger.info('Payment verified', {
      orderId: order.id, paymentId: razorpayPaymentId, amount: order.totalAmount / 100,
    });

    return { alreadyPaid: false, order };
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

  // Simple coupon logic — expand later
  static _applyCoupon(code, amountPaise) {
    const coupons = {
      'LAUNCH50': { type: 'percent', value: 50, maxDiscount: 15000 },
      'FIRST100': { type: 'flat', value: 10000 },
      'EARLYBIRD': { type: 'percent', value: 30, maxDiscount: 10000 },
      'FRIEND25': { type: 'percent', value: 25, maxDiscount: 7500 },
    };
    const coupon = coupons[code.toUpperCase()];
    if (!coupon) return 0;
    if (coupon.type === 'flat') return Math.min(coupon.value, amountPaise);
    const disc = Math.round(amountPaise * coupon.value / 100);
    return Math.min(disc, coupon.maxDiscount || disc, amountPaise);
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
