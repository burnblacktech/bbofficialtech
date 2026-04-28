/**
 * Payment Gate Middleware
 *
 * Checks if a filing has a paid Order or qualifies for the free tier.
 * Returns HTTP 402 PAYMENT_REQUIRED if unpaid.
 * Must run before SubmissionStateMachine.transition() on the submit route.
 */

const Order = require('../models/Order');
const { getRequiredPlan } = require('../constants/pricingPlans');
const { AppError } = require('./errorHandler');
const { ITRFiling } = require('../models');

async function paymentGateMiddleware(req, res, next) {
  try {
    const { filingId } = req.params;

    const filing = await ITRFiling.findByPk(filingId);
    if (!filing) {
      return next(); // Let the route handler deal with 404
    }

    // Check free tier qualification
    const grossIncome = Number(filing.jsonPayload?.income?.salary?.employers?.reduce(
      (sum, e) => sum + (Number(e.grossSalary) || 0), 0,
    ) || 0);
    const plan = getRequiredPlan(filing.itrType || 'ITR-1', grossIncome);
    if (plan.id === 'free') {
      return next();
    }

    // Check for paid order
    const paidOrder = await Order.findOne({
      where: { filingId, status: 'paid' },
    });

    if (paidOrder) {
      return next();
    }

    throw new AppError('Payment required before filing submission', 402, 'PAYMENT_REQUIRED');
  } catch (err) {
    next(err);
  }
}

module.exports = paymentGateMiddleware;
