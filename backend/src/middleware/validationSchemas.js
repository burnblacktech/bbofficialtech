// =====================================================
// INPUT VALIDATION SCHEMAS
// Joi validation schemas for request validation
// =====================================================

const Joi = require('joi');

/**
 * CA Firm User Management Validation
 */
const addFirmUserSchema = {
    body: Joi.object({
        email: Joi.string().email().required().messages({
            'string.email': 'Please provide a valid email address',
            'any.required': 'Email is required',
        }),
        fullName: Joi.string().trim().min(2).max(100).required().messages({
            'string.min': 'Full name must be at least 2 characters',
            'string.max': 'Full name cannot exceed 100 characters',
            'any.required': 'Full name is required',
        }),
        role: Joi.string().valid('OWNER', 'PARTNER', 'PREPARER', 'REVIEWER').required().messages({
            'any.only': 'Role must be one of: OWNER, PARTNER, PREPARER, REVIEWER',
            'any.required': 'Role is required',
        }),
    }),
};

const updateFirmUserRoleSchema = {
    body: Joi.object({
        role: Joi.string().valid('OWNER', 'PARTNER', 'PREPARER', 'REVIEWER').required().messages({
            'any.only': 'Role must be one of: OWNER, PARTNER, PREPARER, REVIEWER',
            'any.required': 'Role is required',
        }),
    }),
    params: Joi.object({
        userId: Joi.string().uuid().required().messages({
            'string.guid': 'Invalid user ID format',
            'any.required': 'User ID is required',
        }),
    }),
};

/**
 * Admin Financial Validation
 */
const processRefundSchema = {
    body: Joi.object({
        amount: Joi.number().positive().when('refundType', {
            is: 'partial',
            then: Joi.required(),
            otherwise: Joi.optional(),
        }).messages({
            'number.positive': 'Refund amount must be positive',
            'any.required': 'Amount is required for partial refunds',
        }),
        reason: Joi.string().trim().min(10).max(500).required().messages({
            'string.min': 'Reason must be at least 10 characters',
            'string.max': 'Reason cannot exceed 500 characters',
            'any.required': 'Refund reason is required',
        }),
        refundType: Joi.string().valid('full', 'partial').default('full').messages({
            'any.only': 'Refund type must be either "full" or "partial"',
        }),
    }),
    params: Joi.object({
        id: Joi.string().uuid().required().messages({
            'string.guid': 'Invalid transaction ID format',
            'any.required': 'Transaction ID is required',
        }),
    }),
};

const createCouponSchema = {
    body: Joi.object({
        code: Joi.string().trim().uppercase().min(3).max(20).required().messages({
            'string.min': 'Coupon code must be at least 3 characters',
            'string.max': 'Coupon code cannot exceed 20 characters',
            'any.required': 'Coupon code is required',
        }),
        discountType: Joi.string().valid('percentage', 'fixed').required().messages({
            'any.only': 'Discount type must be either "percentage" or "fixed"',
            'any.required': 'Discount type is required',
        }),
        discountValue: Joi.number().positive().required().when('discountType', {
            is: 'percentage',
            then: Joi.number().max(100),
        }).messages({
            'number.positive': 'Discount value must be positive',
            'number.max': 'Percentage discount cannot exceed 100',
            'any.required': 'Discount value is required',
        }),
        validFrom: Joi.date().iso().required().messages({
            'date.format': 'Valid from date must be in ISO format',
            'any.required': 'Valid from date is required',
        }),
        validUntil: Joi.date().iso().greater(Joi.ref('validFrom')).required().messages({
            'date.format': 'Valid until date must be in ISO format',
            'date.greater': 'Valid until date must be after valid from date',
            'any.required': 'Valid until date is required',
        }),
        maxUses: Joi.number().integer().positive().optional().messages({
            'number.integer': 'Max uses must be an integer',
            'number.positive': 'Max uses must be positive',
        }),
        minPurchaseAmount: Joi.number().positive().optional().messages({
            'number.positive': 'Minimum purchase amount must be positive',
        }),
    }),
};

/**
 * Filing Review Validation
 */
const reviewFilingSchema = {
    body: Joi.object({
        notes: Joi.string().trim().max(1000).optional().messages({
            'string.max': 'Notes cannot exceed 1000 characters',
        }),
    }),
    params: Joi.object({
        filingId: Joi.string().uuid().required().messages({
            'string.guid': 'Invalid filing ID format',
            'any.required': 'Filing ID is required',
        }),
    }),
};

const overrideFlagSchema = {
    body: Joi.object({
        flagId: Joi.string().required().messages({
            'any.required': 'Flag ID is required',
        }),
        reason: Joi.string().trim().min(20).max(500).required().messages({
            'string.min': 'Reason must be at least 20 characters',
            'string.max': 'Reason cannot exceed 500 characters',
            'any.required': 'Override reason is required',
        }),
    }),
    params: Joi.object({
        filingId: Joi.string().uuid().required().messages({
            'string.guid': 'Invalid filing ID format',
            'any.required': 'Filing ID is required',
        }),
    }),
};

module.exports = {
    // CA Firm
    addFirmUserSchema,
    updateFirmUserRoleSchema,

    // Admin Financial
    processRefundSchema,
    createCouponSchema,

    // Filing Review
    reviewFilingSchema,
    overrideFlagSchema,
};
