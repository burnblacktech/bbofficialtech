// =====================================================
// COMMON VALIDATION UTILITIES
// Reusable validation functions for controllers
// =====================================================

const enterpriseLogger = require('./logger');

/**
 * Validate ITR type
 */
const validateITRType = (itrType) => {
  const validTypes = ['ITR-1', 'ITR-2', 'ITR-3', 'ITR-4'];
  if (!validTypes.includes(itrType)) {
    return {
      isValid: false,
      error: {
        code: 'INVALID_ITR_TYPE',
        message: 'Invalid ITR type. Must be ITR-1, ITR-2, ITR-3, or ITR-4',
      },
    };
  }
  return { isValid: true };
};

/**
 * Validate required fields in an object
 */
const validateRequiredFields = (data, requiredFields) => {
  const errors = {};
  for (const field of requiredFields) {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      errors[field] = `${field} is required`;
    }
  }
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Validate PAN format
 */
const validatePAN = (pan) => {
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  if (!pan || !panRegex.test(pan)) {
    return {
      isValid: false,
      error: {
        code: 'INVALID_PAN',
        message: 'PAN must be in format: ABCDE1234F',
      },
    };
  }
  return { isValid: true };
};

/**
 * Validate Aadhaar format
 */
const validateAadhaar = (aadhaar) => {
  const aadhaarRegex = /^[0-9]{12}$/;
  if (!aadhaar || !aadhaarRegex.test(aadhaar)) {
    return {
      isValid: false,
      error: {
        code: 'INVALID_AADHAAR',
        message: 'Aadhaar must be 12 digits',
      },
    };
  }
  return { isValid: true };
};

/**
 * Validate email format
 */
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return {
      isValid: false,
      error: {
        code: 'INVALID_EMAIL',
        message: 'Invalid email format',
      },
    };
  }
  return { isValid: true };
};

/**
 * Validate phone number (Indian format)
 */
const validatePhone = (phone) => {
  const phoneRegex = /^[6-9][0-9]{9}$/;
  if (!phone || !phoneRegex.test(phone)) {
    return {
      isValid: false,
      error: {
        code: 'INVALID_PHONE',
        message: 'Phone must be 10 digits starting with 6-9',
      },
    };
  }
  return { isValid: true };
};

/**
 * Validate financial year format (YYYY-YY)
 */
const validateFinancialYear = (fy) => {
  const fyRegex = /^[0-9]{4}-[0-9]{2}$/;
  if (!fy || !fyRegex.test(fy)) {
    return {
      isValid: false,
      error: {
        code: 'INVALID_FINANCIAL_YEAR',
        message: 'Financial year must be in format: YYYY-YY (e.g., 2024-25)',
      },
    };
  }
  return { isValid: true };
};

/**
 * Validate numeric range
 */
const validateNumericRange = (value, min, max, fieldName) => {
  if (value === undefined || value === null) {
    return { isValid: true }; // Optional field
  }
  const numValue = Number(value);
  if (isNaN(numValue)) {
    return {
      isValid: false,
      error: {
        code: 'INVALID_NUMBER',
        message: `${fieldName} must be a valid number`,
      },
    };
  }
  if (min !== undefined && numValue < min) {
    return {
      isValid: false,
      error: {
        code: 'VALUE_TOO_LOW',
        message: `${fieldName} must be at least ${min}`,
      },
    };
  }
  if (max !== undefined && numValue > max) {
    return {
      isValid: false,
      error: {
        code: 'VALUE_TOO_HIGH',
        message: `${fieldName} must be at most ${max}`,
      },
    };
  }
  return { isValid: true };
};

/**
 * Validate date format (YYYY-MM-DD)
 */
const validateDate = (dateString, fieldName = 'Date') => {
  if (!dateString) {
    return { isValid: true }; // Optional field
  }
  const dateRegex = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;
  if (!dateRegex.test(dateString)) {
    return {
      isValid: false,
      error: {
        code: 'INVALID_DATE_FORMAT',
        message: `${fieldName} must be in format: YYYY-MM-DD`,
      },
    };
  }
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return {
      isValid: false,
      error: {
        code: 'INVALID_DATE',
        message: `${fieldName} is not a valid date`,
      },
    };
  }
  return { isValid: true };
};

/**
 * Validate JSON string
 */
const validateJSON = (jsonString, fieldName = 'Data') => {
  if (!jsonString) {
    return { isValid: true }; // Optional field
  }
  try {
    JSON.parse(jsonString);
    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      error: {
        code: 'INVALID_JSON',
        message: `${fieldName} must be valid JSON`,
      },
    };
  }
};

/**
 * Validate UUID format
 */
const validateUUID = (uuid, fieldName = 'ID') => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuid || !uuidRegex.test(uuid)) {
    return {
      isValid: false,
      error: {
        code: 'INVALID_UUID',
        message: `${fieldName} must be a valid UUID`,
      },
    };
  }
  return { isValid: true };
};

/**
 * Validate pagination parameters
 */
const validatePagination = (page, limit) => {
  const errors = {};
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);

  if (isNaN(pageNum) || pageNum < 1) {
    errors.page = 'Page must be a positive integer';
  }
  if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
    errors.limit = 'Limit must be between 1 and 100';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    values: {
      page: pageNum || 1,
      limit: limitNum || 10,
    },
  };
};

/**
 * Combine multiple validation results
 */
const combineValidations = (...validations) => {
  const errors = {};
  let isValid = true;

  for (const validation of validations) {
    if (!validation.isValid) {
      isValid = false;
      if (validation.error) {
        errors[validation.error.code] = validation.error.message;
      } else if (validation.errors) {
        Object.assign(errors, validation.errors);
      }
    }
  }

  return {
    isValid,
    errors: Object.keys(errors).length > 0 ? errors : undefined,
  };
};

module.exports = {
  validateITRType,
  validateRequiredFields,
  validatePAN,
  validateAadhaar,
  validateEmail,
  validatePhone,
  validateFinancialYear,
  validateNumericRange,
  validateDate,
  validateJSON,
  validateUUID,
  validatePagination,
  combineValidations,
};

