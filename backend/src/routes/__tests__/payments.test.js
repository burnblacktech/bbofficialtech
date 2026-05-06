/**
 * Integration tests for payment routes
 * POST /api/payments/create-order, /api/payments/verify, GET /api/payments/status/:filingId
 */

// ── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('../../models', () => ({
  ITRFiling: {
    findByPk: jest.fn(),
  },
}));

jest.mock('../../middleware/auth', () => ({
  authenticateToken: (req, _res, next) => {
    req.user = { userId: 'user-1', role: 'END_USER' };
    next();
  },
}));

jest.mock('../../services/PaymentService', () => ({
  createOrder: jest.fn(),
  verifyPayment: jest.fn(),
  getPaymentStatus: jest.fn(),
  getPaymentHistory: jest.fn(),
  getOrderForReceipt: jest.fn(),
  handleWebhookEvent: jest.fn(),
}));

jest.mock('../../services/InvoiceService', () => ({
  buildInvoiceData: jest.fn(),
  generatePDF: jest.fn(),
}));

jest.mock('../../constants/pricingPlans', () => ({
  PLANS: { BASIC: { id: 'basic', name: 'Basic', price: 499, priceWithGst: 589, itrTypes: ['ITR-1'], features: [], tagline: '' } },
  getRequiredPlan: jest.fn().mockReturnValue({ id: 'basic', name: 'Basic', price: 499, priceWithGst: 589 }),
}));

// ── Setup ────────────────────────────────────────────────────────────────────

const express = require('express');
const request = require('supertest');
const { ITRFiling } = require('../../models');
const PaymentService = require('../../services/PaymentService');

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/payments', require('../payments'));
  app.use((err, _req, res, _next) => {
    res.status(err.statusCode || err.status || 500).json({ success: false, error: err.message });
  });
  return app;
}

const app = buildApp();

// ── Fixtures ─────────────────────────────────────────────────────────────────

const FILING = {
  id: 'filing-1',
  createdBy: 'user-1',
};

const OTHER_FILING = {
  id: 'filing-2',
  createdBy: 'other-user',
};

// ── Tests: POST /api/payments/create-order ──────────────────────────────────

describe('POST /api/payments/create-order', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should return 400 when filingId is missing', async () => {
    const res = await request(app)
      .post('/api/payments/create-order')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should return 404 when filing not found', async () => {
    ITRFiling.findByPk.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/payments/create-order')
      .send({ filingId: 'bad-id' });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('should return 404 when user does not own filing', async () => {
    ITRFiling.findByPk.mockResolvedValue(OTHER_FILING);

    const res = await request(app)
      .post('/api/payments/create-order')
      .send({ filingId: 'filing-2' });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('should create order successfully', async () => {
    ITRFiling.findByPk.mockResolvedValue(FILING);
    PaymentService.createOrder.mockResolvedValue({
      order: { id: 'order_123', amount: 58900, currency: 'INR' },
    });

    const res = await request(app)
      .post('/api/payments/create-order')
      .send({ filingId: 'filing-1', itrType: 'ITR-1' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe('order_123');
  });
});

// ── Tests: POST /api/payments/verify ────────────────────────────────────────

describe('POST /api/payments/verify', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should return 400 when signature fields are missing', async () => {
    const res = await request(app)
      .post('/api/payments/verify')
      .send({ razorpayOrderId: 'order_1' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should verify payment successfully', async () => {
    PaymentService.verifyPayment.mockResolvedValue({
      order: { invoiceNumber: 'INV-001', totalAmount: 58900 },
    });

    const res = await request(app)
      .post('/api/payments/verify')
      .send({
        razorpayOrderId: 'order_1',
        razorpayPaymentId: 'pay_1',
        razorpaySignature: 'sig_valid',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.paid).toBe(true);
  });
});

// ── Tests: GET /api/payments/status/:filingId ───────────────────────────────

describe('GET /api/payments/status/:filingId', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should return 404 when filing not found', async () => {
    ITRFiling.findByPk.mockResolvedValue(null);

    const res = await request(app).get('/api/payments/status/bad-id');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('should return 404 when user does not own filing', async () => {
    ITRFiling.findByPk.mockResolvedValue(OTHER_FILING);

    const res = await request(app).get('/api/payments/status/filing-2');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('should return payment status for owned filing', async () => {
    ITRFiling.findByPk.mockResolvedValue(FILING);
    PaymentService.getPaymentStatus.mockResolvedValue({ paid: true, amount: 589 });

    const res = await request(app).get('/api/payments/status/filing-1');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.paid).toBe(true);
  });
});
