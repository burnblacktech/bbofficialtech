// =====================================================
// SHARED VALIDATION UTILITIES
// Common validation functions to reduce code redundancy
// =====================================================

/**
 * Validate email format
 * @param {string} email - Email address to validate
 * @returns {boolean} - True if valid email format
 */
function isValidEmail(email) {
  if (!email || typeof email !== 'string') {
    return false;
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Normalize email (lowercase and trim)
 * @param {string} email - Email to normalize
 * @returns {string|null} - Normalized email or null if invalid
 */
function normalizeEmail(email) {
  if (!email || typeof email !== 'string') {
    return null;
  }
  return email.trim().toLowerCase();
}

/**
 * Validate phone number (Indian format: 10 digits)
 * @param {string} phone - Phone number to validate
 * @returns {boolean} - True if valid phone format
 */
function isValidPhone(phone) {
  if (!phone || typeof phone !== 'string') {
    return false;
  }
  // Remove spaces, dashes, and country code if present
  const cleaned = phone.replace(/[\s\-+]/g, '').replace(/^91/, '');
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(cleaned);
}

/**
 * Normalize phone number (remove spaces, dashes, country code)
 * @param {string} phone - Phone number to normalize
 * @returns {string|null} - Normalized phone or null if invalid
 */
function normalizePhone(phone) {
  if (!phone || typeof phone !== 'string') {
    return null;
  }
  const cleaned = phone.replace(/[\s\-+]/g, '').replace(/^91/, '');
  if (!/^[6-9]\d{9}$/.test(cleaned)) {
    return null;
  }
  return cleaned;
}

/**
 * Validate PAN number format
 * @param {string} pan - PAN number to validate
 * @returns {boolean} - True if valid PAN format
 */
function isValidPAN(pan) {
  if (!pan || typeof pan !== 'string') {
    return false;
  }
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  return panRegex.test(pan.trim().toUpperCase());
}

/**
 * Normalize PAN number (uppercase and remove spaces)
 * @param {string} pan - PAN number to normalize
 * @returns {string|null} - Normalized PAN or null if invalid
 */
function normalizePAN(pan) {
  if (!pan || typeof pan !== 'string') {
    return null;
  }
  const cleaned = pan.trim().toUpperCase().replace(/\s/g, '');
  if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(cleaned)) {
    return null;
  }
  return cleaned;
}

/**
 * Validate IFSC code format
 * @param {string} ifsc - IFSC code to validate
 * @returns {boolean} - True if valid IFSC format
 */
function isValidIFSC(ifsc) {
  if (!ifsc || typeof ifsc !== 'string') {
    return false;
  }
  const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/i;
  return ifscRegex.test(ifsc.trim());
}

/**
 * Normalize IFSC code (uppercase and remove spaces)
 * @param {string} ifsc - IFSC code to normalize
 * @returns {string|null} - Normalized IFSC or null if invalid
 */
function normalizeIFSC(ifsc) {
  if (!ifsc || typeof ifsc !== 'string') {
    return null;
  }
  const cleaned = ifsc.trim().toUpperCase().replace(/\s/g, '');
  if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(cleaned)) {
    return null;
  }
  return cleaned;
}

/**
 * Validate Aadhaar number format (12 digits)
 * @param {string} aadhaar - Aadhaar number to validate
 * @returns {boolean} - True if valid Aadhaar format
 */
function isValidAadhaar(aadhaar) {
  if (!aadhaar || typeof aadhaar !== 'string') {
    return false;
  }
  const cleaned = aadhaar.replace(/\s/g, '');
  const aadhaarRegex = /^\d{12}$/;
  return aadhaarRegex.test(cleaned);
}

/**
 * Normalize Aadhaar number (remove spaces)
 * @param {string} aadhaar - Aadhaar number to normalize
 * @returns {string|null} - Normalized Aadhaar or null if invalid
 */
function normalizeAadhaar(aadhaar) {
  if (!aadhaar || typeof aadhaar !== 'string') {
    return null;
  }
  const cleaned = aadhaar.replace(/\s/g, '');
  if (!/^\d{12}$/.test(cleaned)) {
    return null;
  }
  return cleaned;
}

/**
 * Validate required fields in an object
 * @param {object} data - Object to validate
 * @param {string[]} requiredFields - Array of required field names
 * @returns {{isValid: boolean, missingFields: string[]}} - Validation result
 */
function validateRequiredFields(data, requiredFields) {
  if (!data || typeof data !== 'object') {
    return {
      isValid: false,
      missingFields: requiredFields,
    };
  }

  const missingFields = requiredFields.filter(field => {
    const value = data[field];
    return value === undefined || value === null || value === '';
  });

  return {
    isValid: missingFields.length === 0,
    missingFields,
  };
}

/**
 * Validate pagination parameters
 * @param {object} query - Query parameters
 * @returns {{page: number, limit: number, offset: number}} - Normalized pagination
 */
function validatePagination(query) {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
  const offset = (page - 1) * limit;

  return { page, limit, offset };
}

/**
 * Validate date range
 * @param {string|Date} startDate - Start date
 * @param {string|Date} endDate - End date
 * @returns {{isValid: boolean, error?: string}} - Validation result
 */
function validateDateRange(startDate, endDate) {
  if (!startDate || !endDate) {
    return { isValid: true }; // Optional validation
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime())) {
    return { isValid: false, error: 'Invalid start date format' };
  }

  if (isNaN(end.getTime())) {
    return { isValid: false, error: 'Invalid end date format' };
  }

  if (start > end) {
    return { isValid: false, error: 'Start date must be before or equal to end date' };
  }

  return { isValid: true };
}

/**
 * Validate UUID format
 * @param {string} uuid - UUID to validate
 * @returns {boolean} - True if valid UUID format
 */
function isValidUUID(uuid) {
  if (!uuid || typeof uuid !== 'string') {
    return false;
  }
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid.trim());
}

module.exports = {
  isValidEmail,
  normalizeEmail,
  isValidPhone,
  normalizePhone,
  isValidPAN,
  normalizePAN,
  isValidIFSC,
  normalizeIFSC,
  isValidAadhaar,
  normalizeAadhaar,
  validateRequiredFields,
  validatePagination,
  validateDateRange,
  isValidUUID,
};

