// =====================================================
// SUBSCRIPTION ROUTES - CA FIRM SUBSCRIPTION MANAGEMENT
// API endpoints for subscription plan management
// =====================================================

const express = require('express');
const router = express.Router();
const Joi = require('joi');
const subscriptionController = require('../controllers/SubscriptionController');
const { authenticateToken } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validateRequest');

// Validation schemas
const getPlansSchema = Joi.object({
  limit: Joi.number().integer().min(1).max(100).default(50),
  offset: Joi.number().integer().min(0).default(0),
});

const createOrderSchema = Joi.object({
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

const verifySignatureSchema = Joi.object({
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

// Subscription Plan Routes
router.get('/plans',
  validateRequest(getPlansSchema, 'query'),
  subscriptionController.getPlans,
);

router.get('/plans/:planId',
  subscriptionController.getPlan,
);

// Subscription Order Routes
router.post('/create-order',
  authenticateToken,
  validateRequest(createOrderSchema),
  subscriptionController.createOrder,
);

router.post('/verify-signature',
  authenticateToken,
  validateRequest(verifySignatureSchema),
  subscriptionController.verifySignature,
);

// Subscription Management Routes
router.get('/status',
  authenticateToken,
  subscriptionController.getSubscriptionStatus,
);

router.get('/history',
  authenticateToken,
  subscriptionController.getSubscriptionHistory,
);

router.post('/cancel',
  authenticateToken,
  subscriptionController.cancelSubscription,
);

router.post('/upgrade',
  authenticateToken,
  subscriptionController.upgradeSubscription,
);

module.exports = router;
