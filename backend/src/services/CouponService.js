/**
 * CouponService — Database-driven coupon validation and discount computation
 *
 * Replaces the hardcoded _applyCoupon() in PaymentService.
 * All amounts in paise (integer).
 */

const Coupon = require('../models/Coupon');
const { Op } = require('sequelize');
const enterpriseLogger = require('../utils/logger');

class CouponService {
  /**
   * Validate and compute discount for a coupon code.
   * @param {string} code - Coupon code (uppercase)
   * @param {number} baseAmountPaise - Base amount before discount, in paise
   * @returns {{ valid: boolean, discount: number, couponId: string|null, reason?: string }}
   */
  static async applyCoupon(code, baseAmountPaise) {
    if (!code) {
      return { valid: false, discount: 0, couponId: null, reason: 'No coupon code provided' };
    }

    const coupon = await Coupon.findOne({
      where: { code: code.toUpperCase() },
    });

    if (!coupon) {
      return { valid: false, discount: 0, couponId: null, reason: 'Coupon not found' };
    }

    if (!coupon.isActive) {
      return { valid: false, discount: 0, couponId: null, reason: 'Coupon is inactive' };
    }

    const today = new Date().toISOString().split('T')[0];
    if (coupon.validUntil && coupon.validUntil < today) {
      return { valid: false, discount: 0, couponId: null, reason: 'Coupon has expired' };
    }

    if (coupon.maxUses !== null && coupon.currentUses >= coupon.maxUses) {
      return { valid: false, discount: 0, couponId: null, reason: 'Coupon usage limit reached' };
    }

    let discount = 0;

    if (coupon.discountType === 'percent') {
      discount = Math.round(baseAmountPaise * coupon.discountValue / 100);
      if (coupon.maxDiscount !== null && coupon.maxDiscount !== undefined) {
        discount = Math.min(discount, coupon.maxDiscount);
      }
    } else if (coupon.discountType === 'flat') {
      discount = coupon.discountValue;
    }

    // Ensure discount doesn't exceed base amount and is non-negative
    discount = Math.min(discount, baseAmountPaise);
    discount = Math.max(discount, 0);

    return { valid: true, discount, couponId: coupon.id };
  }

  /**
   * Increment currentUses after successful payment.
   * Called inside a transaction when order transitions to 'paid'.
   * @param {string} couponCode - The coupon code
   * @param {import('sequelize').Transaction} transaction - Sequelize transaction
   */
  static async incrementUsage(couponCode, transaction) {
    if (!couponCode) return;

    const [affectedCount] = await Coupon.update(
      { currentUses: require('sequelize').literal('current_uses + 1') },
      {
        where: { code: couponCode.toUpperCase() },
        transaction,
      },
    );

    if (affectedCount === 0) {
      enterpriseLogger.warn('Coupon usage increment failed — coupon not found', { couponCode });
    }
  }
}

module.exports = CouponService;
