/**
 * AdminFilingBrowserService — Browse ALL filings on the platform.
 * Unlike AdminFilingService (scoped to admin-created filings), this service
 * queries every ITRFiling with User + Order joins and payment status derivation.
 */

const { Op, literal } = require('sequelize');
const { ITRFiling, User, Order } = require('../../models');
const AppError = require('../../utils/AppError');

class AdminFilingBrowserService {
  /**
   * Paginated list of all filings with user + payment data.
   */
  async list(filters = {}) {
    const {
      search,
      assessmentYear,
      itrType,
      lifecycleState,
      paymentStatus,
      includeDeleted = false,
      page = 1,
      limit = 25,
    } = filters;

    const pg = Math.max(1, parseInt(page) || 1);
    const lim = Math.min(100, Math.max(1, parseInt(limit) || 25));

    const where = {};

    // Dynamic filters
    if (search) {
      where[Op.or] = [
        { taxpayerPan: { [Op.iLike]: `${search}%` } },
        { '$creator.email$': { [Op.iLike]: `%${search}%` } },
      ];
    }
    if (assessmentYear) where.assessmentYear = assessmentYear;
    if (itrType) where.itrType = itrType;
    if (lifecycleState) where.lifecycleState = lifecycleState;

    // Payment status filter via subqueries
    if (paymentStatus === 'free') {
      where.id = {
        [Op.notIn]: literal('(SELECT DISTINCT filing_id FROM orders WHERE filing_id IS NOT NULL)'),
      };
    } else if (paymentStatus === 'paid') {
      where.id = {
        [Op.in]: literal("(SELECT DISTINCT filing_id FROM orders WHERE status = 'paid' AND filing_id IS NOT NULL)"),
      };
    } else if (paymentStatus === 'unpaid') {
      where[Op.and] = [
        ...(where[Op.and] || []),
        { id: { [Op.in]: literal('(SELECT DISTINCT filing_id FROM orders WHERE filing_id IS NOT NULL)') } },
        { id: { [Op.notIn]: literal("(SELECT DISTINCT filing_id FROM orders WHERE status = 'paid' AND filing_id IS NOT NULL)") } },
      ];
    }

    const model = includeDeleted ? ITRFiling.scope('withDeleted') : ITRFiling;

    const { rows, count } = await model.findAndCountAll({
      attributes: { exclude: ['jsonPayload'] },
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'fullName', 'email', 'panNumber'],
        },
        {
          model: Order,
          as: 'orders',
          attributes: ['id', 'status', 'amount', 'totalAmount', 'discount', 'gstAmount', 'paidAt'],
          required: false,
        },
      ],
      where,
      order: [['createdAt', 'DESC']],
      limit: lim,
      offset: (pg - 1) * lim,
      distinct: true,
      subQuery: false,
    });

    const filings = rows.map((f) => this._derivePayment(f));

    return {
      filings,
      total: count,
      page: pg,
      totalPages: Math.ceil(count / lim),
    };
  }

  /**
   * Full detail for a single filing including jsonPayload.
   */
  async detail(filingId) {
    const filing = await ITRFiling.scope('withDeleted').findByPk(filingId, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'fullName', 'email', 'panNumber'],
        },
        {
          model: Order,
          as: 'orders',
        },
      ],
    });

    if (!filing) {
      throw new AppError('FILING_NOT_FOUND', 'Filing not found', 404);
    }

    const orders = filing.orders || [];
    const paidOrder = orders.find((o) => o.status === 'paid');
    const anyOrder = orders.length > 0;
    const paymentStatus = paidOrder ? 'paid' : anyOrder ? 'unpaid' : 'free';

    // Pick best order: paid preferred, else most recent
    let bestOrder = paidOrder || null;
    if (!bestOrder && orders.length > 0) {
      bestOrder = [...orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
    }

    return {
      filing: filing.toJSON(),
      user: filing.creator ? filing.creator.toJSON() : null,
      order: bestOrder ? bestOrder.toJSON() : null,
      paymentStatus,
    };
  }

  /**
   * Export all matching filings (no pagination, max 10,000).
   */
  async exportList(filters = {}) {
    const {
      search,
      assessmentYear,
      itrType,
      lifecycleState,
      paymentStatus,
      includeDeleted = false,
    } = filters;

    const where = {};

    if (search) {
      where[Op.or] = [
        { taxpayerPan: { [Op.iLike]: `${search}%` } },
        { '$creator.email$': { [Op.iLike]: `%${search}%` } },
      ];
    }
    if (assessmentYear) where.assessmentYear = assessmentYear;
    if (itrType) where.itrType = itrType;
    if (lifecycleState) where.lifecycleState = lifecycleState;

    if (paymentStatus === 'free') {
      where.id = {
        [Op.notIn]: literal('(SELECT DISTINCT filing_id FROM orders WHERE filing_id IS NOT NULL)'),
      };
    } else if (paymentStatus === 'paid') {
      where.id = {
        [Op.in]: literal("(SELECT DISTINCT filing_id FROM orders WHERE status = 'paid' AND filing_id IS NOT NULL)"),
      };
    } else if (paymentStatus === 'unpaid') {
      where[Op.and] = [
        ...(where[Op.and] || []),
        { id: { [Op.in]: literal('(SELECT DISTINCT filing_id FROM orders WHERE filing_id IS NOT NULL)') } },
        { id: { [Op.notIn]: literal("(SELECT DISTINCT filing_id FROM orders WHERE status = 'paid' AND filing_id IS NOT NULL)") } },
      ];
    }

    const model = includeDeleted ? ITRFiling.scope('withDeleted') : ITRFiling;

    const { rows, count } = await model.findAndCountAll({
      attributes: { exclude: ['jsonPayload'] },
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'fullName', 'email', 'panNumber'],
        },
        {
          model: Order,
          as: 'orders',
          attributes: ['id', 'status', 'amount', 'totalAmount', 'discount', 'gstAmount', 'paidAt'],
          required: false,
        },
      ],
      where,
      order: [['createdAt', 'DESC']],
      distinct: true,
      subQuery: false,
    });

    if (count > 10000) {
      throw new AppError(
        'EXPORT_LIMIT_EXCEEDED',
        'Export exceeds 10,000 records. Apply additional filters to narrow results.',
        400,
      );
    }

    return rows.map((f) => {
      const plain = this._derivePayment(f);
      return {
        filingId: plain.id,
        userName: plain.creator?.fullName || '',
        userEmail: plain.creator?.email || '',
        taxpayerPan: plain.taxpayerPan,
        assessmentYear: plain.assessmentYear,
        itrType: plain.itrType,
        lifecycleState: plain.lifecycleState,
        paymentStatus: plain.paymentStatus,
        amountPaid: plain.paymentAmount ? (plain.paymentAmount / 100).toFixed(2) : '0.00',
        createdDate: plain.createdAt,
        updatedDate: plain.updatedAt,
      };
    });
  }

  /**
   * Derive paymentStatus and paymentAmount from joined orders.
   */
  _derivePayment(filing) {
    const plain = filing.toJSON();
    const orders = plain.orders || [];
    const paidOrder = orders.find((o) => o.status === 'paid');
    const anyOrder = orders.length > 0;
    plain.paymentStatus = paidOrder ? 'paid' : anyOrder ? 'unpaid' : 'free';
    plain.paymentAmount = paidOrder ? paidOrder.totalAmount : null;
    return plain;
  }
}

module.exports = new AdminFilingBrowserService();
