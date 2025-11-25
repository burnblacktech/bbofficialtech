// =====================================================
// REQUEST VALIDATION MIDDLEWARE
// Validates request body, query, and params using Joi schemas
// =====================================================

const Joi = require('joi');
const enterpriseLogger = require('../utils/logger');
const { AppError } = require('./errorHandler');

/**
 * Validate request data against schema
 * @param {object} schema - Joi schema object
 * @param {string} property - Request property to validate ('body', 'query', 'params')
 * @returns {function} Express middleware function
 */
const validateRequest = (schema, property = 'body') => {
  return (req, res, next) => {
    try {
      const { error, value } = schema.validate(req[property], {
        abortEarly: false,
        allowUnknown: false,
        stripUnknown: true,
      });

      if (error) {
        const errorDetails = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          value: detail.context?.value,
        }));

        enterpriseLogger.warn('Request validation failed', {
          property,
          errors: errorDetails,
          url: req.url,
          method: req.method,
          userId: req.user?.id,
        });

        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errorDetails,
        });
      }

      // Replace the request property with validated and sanitized data
      req[property] = value;

      next();
    } catch (err) {
      enterpriseLogger.error('Validation middleware error', {
        error: err.message,
        property,
        url: req.url,
        method: req.method,
      });

      next(new AppError('Validation error', 500));
    }
  };
};

/**
 * Validate multiple request properties
 * @param {object} schemas - Object with property names as keys and Joi schemas as values
 * @returns {function} Express middleware function
 */
const validateMultiple = (schemas) => {
  return (req, res, next) => {
    try {
      const errors = [];

      for (const [property, schema] of Object.entries(schemas)) {
        if (req[property]) {
          const { error, value } = schema.validate(req[property], {
            abortEarly: false,
            allowUnknown: false,
            stripUnknown: true,
          });

          if (error) {
            const errorDetails = error.details.map(detail => ({
              field: detail.path.join('.'),
              message: detail.message,
              value: detail.context?.value,
              property,
            }));

            errors.push(...errorDetails);
          } else {
            req[property] = value;
          }
        }
      }

      if (errors.length > 0) {
        enterpriseLogger.warn('Multiple validation failed', {
          errors,
          url: req.url,
          method: req.method,
          userId: req.user?.id,
        });

        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors,
        });
      }

      next();
    } catch (err) {
      enterpriseLogger.error('Multiple validation middleware error', {
        error: err.message,
        schemas: Object.keys(schemas),
        url: req.url,
        method: req.method,
      });

      next(new AppError('Validation error', 500));
    }
  };
};

/**
 * Common validation schemas
 */
const commonSchemas = {
  // Pagination
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sort: Joi.string().valid('asc', 'desc').default('desc'),
    sortBy: Joi.string().default('createdAt'),
  }),

  // Search
  search: Joi.object({
    q: Joi.string().min(1).max(100),
    filters: Joi.object().pattern(Joi.string(), Joi.any()),
  }),

  // ID parameter
  idParam: Joi.object({
    id: Joi.string().uuid().required(),
  }),

  // Email
  email: Joi.string().email().required(),

  // Password
  password: Joi.string().min(8).max(128).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/).required(),

  // Phone number
  phone: Joi.string().pattern(/^[6-9]\d{9}$/).required(),

  // PAN number
  pan: Joi.string().pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/).required(),

  // Aadhaar number
  aadhaar: Joi.string().pattern(/^\d{12}$/).required(),
};

/**
 * Create validation middleware for common use cases
 */
const validators = {
  // Auth validators
  login: validateRequest(Joi.object({
    email: commonSchemas.email,
    password: Joi.string().min(1).required(),
  })),

  register: validateRequest(Joi.object({
    email: commonSchemas.email,
    password: commonSchemas.password,
    fullName: Joi.string().min(2).max(100).required(),
    phone: commonSchemas.phone,
    role: Joi.string().valid('END_USER', 'CA', 'CA_FIRM_ADMIN', 'PLATFORM_ADMIN', 'SUPER_ADMIN').required(),
  })),

  // User validators
  updateProfile: validateRequest(Joi.object({
    fullName: Joi.string().min(2).max(100),
    phone: commonSchemas.phone,
    dateOfBirth: Joi.date().max('now'),
    address: Joi.object({
      street: Joi.string().max(200),
      city: Joi.string().max(100),
      state: Joi.string().max(100),
      pincode: Joi.string().pattern(/^\d{6}$/),
      country: Joi.string().max(100).default('India'),
    }),
  })),

  // ITR validators
  createITR: validateRequest(Joi.object({
    itrType: Joi.string().valid('ITR1', 'ITR2', 'ITR3', 'ITR4').required(),
    assessmentYear: Joi.string().pattern(/^\d{4}-\d{2}$/).required(),
    filingData: Joi.object().required(),
  })),

  updateITR: validateRequest(Joi.object({
    filingData: Joi.object().required(),
  })),

  // Document validators
  uploadDocument: validateRequest(Joi.object({
    category: Joi.string().valid('FORM_16', 'PAN_CARD', 'AADHAAR', 'BANK_STATEMENT', 'INVESTMENT_PROOF', 'OTHER').required(),
    description: Joi.string().max(500),
    tags: Joi.array().items(Joi.string().max(50)),
  })),

  // Member validators
  addMember: validateRequest(Joi.object({
    firstName: Joi.string().min(2).max(50).required(),
    lastName: Joi.string().min(2).max(50).required(),
    panNumber: commonSchemas.pan,
    dateOfBirth: Joi.date().max('now').required(),
    relationship: Joi.string().valid('SPOUSE', 'CHILD', 'PARENT', 'SIBLING', 'OTHER').required(),
    email: Joi.string().email(),
    phone: commonSchemas.phone,
  })),

  // CA Bot validators
  cabotMessage: validateRequest(Joi.object({
    message: Joi.string().min(1).max(1000).required(),
    context: Joi.object({
      userType: Joi.string().valid('non_educated', 'educated', 'ultra_educated').required(),
      language: Joi.string().valid('en', 'hi').required(),
      currentStep: Joi.string().required(),
      collectedData: Joi.object(),
      steps: Joi.array().items(Joi.string()),
    }).required(),
  })),

  // Generic validators
  pagination: validateRequest(commonSchemas.pagination, 'query'),
  search: validateRequest(commonSchemas.search, 'query'),
  idParam: validateRequest(commonSchemas.idParam, 'params'),
};

module.exports = {
  validateRequest,
  validateMultiple,
  commonSchemas,
  validators,
};
