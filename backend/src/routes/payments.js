// =====================================================
// PAYMENT ROUTES - PAYMENT GATEWAY INTEGRATION
// API endpoints for payment processing and verification
// =====================================================

const express = require('express');
const router = express.Router();
const Joi = require('joi');
const paymentController = require('../controllers/PaymentController');
const { authenticateToken } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validateRequest');

// Validation schemas
const createOrderSchema = Joi.object({
  amount: Joi.number().integer().min(100).required(),
  currency: Joi.string().valid('INR').default('INR'),
  receipt: Joi.string().required(),
  notes: Joi.object({
    filingId: Joi.string().optional(),
    expertReview: Joi.boolean().optional(),
    service: Joi.string().optional(),
  }).optional(),
});

const verifyPaymentSchema = Joi.object({
  razorpay_order_id: Joi.string().required(),
  razorpay_payment_id: Joi.string().required(),
  razorpay_signature: Joi.string().required(),
  filingId: Joi.string().optional(),
  expertReview: Joi.boolean().optional(),
  amount: Joi.number().required(),
});

const createSubscriptionOrderSchema = Joi.object({
  planId: Joi.number().integer().required(),
  billingCycle: Joi.string().valid('monthly', 'annual').required(),
  amount: Joi.number().integer().min(100).required(),
  currency: Joi.string().valid('INR').default('INR'),
  firmDetails: Joi.object({
    firmName: Joi.string().required(),
    contactPerson: Joi.string().required(),
    email: Joi.string().email().required(),
    phone: Joi.string().required(),
    address: Joi.object({
      street: Joi.string().required(),
      city: Joi.string().required(),
      state: Joi.string().required(),
      pincode: Joi.string().pattern(/^\d{6}$/).required(),
      country: Joi.string().default('India'),
    }).required(),
    gstNumber: Joi.string().optional(),
    panNumber: Joi.string().pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/).required(),
    registrationNumber: Joi.string().optional(),
  }).required(),
});

const verifySubscriptionPaymentSchema = Joi.object({
  razorpay_order_id: Joi.string().required(),
  razorpay_payment_id: Joi.string().required(),
  razorpay_signature: Joi.string().required(),
  planId: Joi.number().integer().required(),
  billingCycle: Joi.string().valid('monthly', 'annual').required(),
  firmDetails: Joi.object({
    firmName: Joi.string().required(),
    contactPerson: Joi.string().required(),
    email: Joi.string().email().required(),
    phone: Joi.string().required(),
    address: Joi.object({
      street: Joi.string().required(),
      city: Joi.string().required(),
      state: Joi.string().required(),
      pincode: Joi.string().pattern(/^\d{6}$/).required(),
      country: Joi.string().default('India'),
    }).required(),
    gstNumber: Joi.string().optional(),
    panNumber: Joi.string().pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/).required(),
    registrationNumber: Joi.string().optional(),
  }).required(),
});

// ITR Filing Payment Routes
router.post('/create-order',
  authenticateToken,
  validateRequest(createOrderSchema),
  paymentController.createITRFilingOrder,
);

router.post('/verify-signature',
  authenticateToken,
  validateRequest(verifyPaymentSchema),
  paymentController.verifyITRFilingPayment,
);

// CA Subscription Payment Routes
router.post('/subscription/create-order',
  authenticateToken,
  validateRequest(createSubscriptionOrderSchema),
  paymentController.createSubscriptionOrder,
);

router.post('/subscription/verify-signature',
  authenticateToken,
  validateRequest(verifySubscriptionPaymentSchema),
  paymentController.verifySubscriptionPayment,
);

// Payment Status and History Routes
router.get('/status/:paymentId',
  authenticateToken,
  paymentController.getPaymentStatus,
);

router.get('/history',
  authenticateToken,
  paymentController.getPaymentHistory,
);

module.exports = router;
