/**
 * AdminCouponService — Coupon management for SUPER_ADMIN dashboard
 * Handles listing, creation, deactivation, and usage tracking of coupons.
 */

const { Op } = require('sequelize');
const { Coupon, Order, User } = require('../../models');
const AppError = require('../../utils/AppError');

class AdminCouponService {
  /**
   * List coupons with optional active/expired filter.
   * @param {{ active?: string }} params
   * @returns {Promise<Array>} List of coupon records
   */
  async listCoupons({ active } = {}) {
    const where = {};

    if (active === 'true' || active === true) {
      where.isActive = true;
      where.validUntil = { [Op.gt]: new Date() };
    } else if (active === 'false' || active === false) {
      where[Op.or] = [
        { isActive: false },
        { validUntil: { [Op.lte]: new Date() } },
      ];
    }

    return Coupon.findAll({
      where,
      order: [['createdAt', 'DESC']],
    });
  }

  /**
   * Create a new coupon after validation.
   * @param {{ code: string, discountType: string, discountValue: number, maxUses?: number, validFrom: string, validUntil: string }} data
   * @returns {Promise<Object>} Created coupon record
   */
  async createCoupon({ code, discountType, discountValue, maxUses, validFrom, validUntil }) {
    // Check code uniqueness
    const existing = await Coupon.findOne({ where: { code } });
    if (existing) {
      throw new AppError('COUPON_CODE_EXISTS', 'Coupon code already exists', 409);
    }

    const coupon = await Coupon.create({
      code,
      discountType,
      discountValue,
      maxUses: maxUses || null,
      validFrom,
      validUntil,
    });

    return coupon;
  }

  /**
   * Deactivate a coupon by ID.
   * @param {string} couponId - UUID of the coupon
   * @returns {Promise<{ message: string }>}
   */
  async deactivateCoupon(couponId) {
    const coupon = await Coupon.findByPk(couponId);
    if (!coupon) {
      throw AppError.notFound('Coupon');
    }

    coupon.isActive = false;
    await coupon.save();

    return { message: 'Coupon deactivated' };
  }

  /**
   * Get paginated usage details for a coupon (orders that used its code).
   * @param {string} couponId - UUID of the coupon
   * @param {{ page?: number, limit?: number }} params
   * @returns {Promise<{ orders: Array, total: number, page: number, totalPages: number }>}
   */
  async getCouponUsage(couponId, { page = 1, limit = 20 } = {}) {
    const coupon = await Coupon.findByPk(couponId);
    if (!coupon) {
      throw AppError.notFound('Coupon');
    }

    const pg = Math.max(1, parseInt(page));
    const lim = Math.min(100, parseInt(limit) || 20);

    const { count, rows } = await Order.findAndCountAll({
      where: { couponCode: coupon.code, status: 'paid' },
      limit: lim,
      offset: (pg - 1) * lim,
      order: [['paidAt', 'DESC']],
      attributes: ['id', 'userId', 'discount', 'totalAmount', 'paidAt'],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['email'],
        },
      ],
    });

    const orders = rows.map((o) => {
      const json = o.toJSON();
      return {
        orderId: json.id,
        userId: json.userId,
        email: json.user?.email || null,
        discount: (json.discount || 0) / 100,
        totalAmount: (json.totalAmount || 0) / 100,
        paidAt: json.paidAt,
      };
    });

    return {
      orders,
      total: count,
      page: pg,
      totalPages: Math.ceil(count / lim),
    };
  }
}

module.exports = new AdminCouponService();
