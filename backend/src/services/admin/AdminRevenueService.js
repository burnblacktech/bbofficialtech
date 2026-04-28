/**
 * AdminRevenueService — Revenue analytics for SUPER_ADMIN dashboard
 * Handles revenue summaries, plan breakdowns, payment success rate,
 * average revenue per user, and coupon usage statistics.
 */

const { Op, fn, col } = require('sequelize');
const { Order } = require('../../models');

class AdminRevenueService {
  /**
   * Compute full revenue data for the admin dashboard.
   * All monetary values are converted from paise to rupees (/ 100).
   */
  async getRevenueData() {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const sumWhere = (start) =>
      Order.sum('totalAmount', {
        where: { status: 'paid', paidAt: { [Op.gte]: start } },
      });

    const [today, thisWeek, thisMonth, allTime] = await Promise.all([
      sumWhere(todayStart),
      sumWhere(weekStart),
      sumWhere(monthStart),
      Order.sum('totalAmount', { where: { status: 'paid' } }),
    ]);

    const [byPlan, paidCount, failedCount, distinctUsers, couponOrders] = await Promise.all([
      Order.findAll({
        where: { status: 'paid' },
        attributes: [
          'planId',
          [fn('COUNT', '*'), 'orderCount'],
          [fn('SUM', col('total_amount')), 'totalRevenue'],
        ],
        group: ['planId'],
        raw: true,
      }),
      Order.count({ where: { status: 'paid' } }),
      Order.count({ where: { status: 'failed' } }),
      Order.count({ where: { status: 'paid' }, distinct: true, col: 'userId' }),
      Order.findAll({
        where: { status: 'paid', couponCode: { [Op.ne]: null } },
        attributes: [
          'couponCode',
          [fn('COUNT', '*'), 'usageCount'],
          [fn('SUM', col('discount')), 'totalDiscount'],
        ],
        group: ['couponCode'],
        raw: true,
      }),
    ]);

    const allTimePaise = allTime || 0;

    return {
      summary: {
        today: (today || 0) / 100,
        thisWeek: (thisWeek || 0) / 100,
        thisMonth: (thisMonth || 0) / 100,
        allTime: allTimePaise / 100,
      },
      byPlan: byPlan.map((p) => ({
        ...p,
        totalRevenue: (p.totalRevenue || 0) / 100,
      })),
      paymentSuccessRate:
        paidCount + failedCount > 0
          ? Math.round((paidCount / (paidCount + failedCount)) * 100)
          : 100,
      avgRevenuePerUser:
        distinctUsers > 0 ? Math.round(allTimePaise / 100 / distinctUsers) : 0,
      couponStats: {
        totalCouponOrders: couponOrders.reduce((s, c) => s + parseInt(c.usageCount), 0),
        totalDiscount: couponOrders.reduce((s, c) => s + ((c.totalDiscount || 0) / 100), 0),
        byCoupon: couponOrders.map((c) => ({
          ...c,
          totalDiscount: (c.totalDiscount || 0) / 100,
        })),
      },
    };
  }
}

module.exports = new AdminRevenueService();
