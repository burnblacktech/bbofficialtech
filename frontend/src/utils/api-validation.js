// =====================================================
// API RESPONSE VALIDATION UTILITIES
// Validate API responses using runtime type checking
// =====================================================

/**
 * Validate that a value is a number
 * @param {any} value - Value to validate
 * @param {number} defaultValue - Default value if invalid
 * @returns {number} Validated number
 */
export const validateNumber = (value, defaultValue = 0) => {
  const num = typeof value === 'number' ? value : Number(value);
  return isNaN(num) ? defaultValue : num;
};

/**
 * Validate that a value is a string
 * @param {any} value - Value to validate
 * @param {string} defaultValue - Default value if invalid
 * @returns {string} Validated string
 */
export const validateString = (value, defaultValue = '') => {
  return typeof value === 'string' ? value : defaultValue;
};

/**
 * Validate that a value is an array
 * @param {any} value - Value to validate
 * @param {Array} defaultValue - Default value if invalid
 * @returns {Array} Validated array
 */
export const validateArray = (value, defaultValue = []) => {
  return Array.isArray(value) ? value : defaultValue;
};

/**
 * Validate that a value is an object
 * @param {any} value - Value to validate
 * @param {Object} defaultValue - Default value if invalid
 * @returns {Object} Validated object
 */
export const validateObject = (value, defaultValue = {}) => {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? value : defaultValue;
};

/**
 * Validate dashboard stats response structure
 * @param {any} data - API response data
 * @returns {Object} Validated dashboard stats
 */
export const validateDashboardStats = (data) => {
  const validated = {
    overview: validateObject(data?.overview, {}),
    draftStats: validateObject(data?.draftStats, {}),
    recentActivity: validateArray(data?.recentActivity, []),
  };

  // Validate overview stats
  validated.overview = {
    totalFilings: validateNumber(validated.overview.totalFilings, 0),
    draftFilings: validateNumber(validated.overview.draftFilings, 0),
    totalDocuments: validateNumber(validated.overview.totalDocuments, 0),
    familyMembers: validateNumber(validated.overview.familyMembers, 0),
  };

  // Validate draft stats
  validated.draftStats = {
    activeDrafts: validateNumber(validated.draftStats.activeDrafts, 0),
  };

  return validated;
};

/**
 * Validate filings response structure
 * @param {any} data - API response data
 * @returns {Array} Validated filings array
 */
export const validateFilings = (data) => {
  const filings = validateArray(data?.filings || data, []);

  return filings.map(filing => ({
    id: validateString(filing.id, ''),
    itrType: validateString(filing.itrType, ''),
    assessmentYear: validateString(filing.assessmentYear, ''),
    status: validateString(filing.status, 'draft'),
    progress: validateNumber(filing.progress, 0),
    updatedAt: validateString(filing.updatedAt, ''),
    pausedAt: validateString(filing.pausedAt, ''),
    invoice: validateObject(filing.invoice, null),
  }));
};

/**
 * Validate refunds response structure
 * @param {any} data - API response data
 * @returns {Object} Validated refunds data
 */
export const validateRefunds = (data) => {
  const pendingRefunds = validateArray(data?.pendingRefunds || data?.pending || [], []);
  const creditedRefunds = validateArray(data?.creditedRefunds || data?.credited || [], []);

  const totalPendingAmount = pendingRefunds.reduce((sum, refund) => {
    return sum + validateNumber(refund.amount, 0);
  }, 0);

  const totalCreditedAmount = creditedRefunds.reduce((sum, refund) => {
    return sum + validateNumber(refund.amount, 0);
  }, 0);

  return {
    pendingRefunds,
    creditedRefunds,
    totalPendingAmount,
    totalCreditedAmount,
  };
};

/**
 * Safely extract nested property with fallback
 * @param {Object} obj - Object to extract from
 * @param {string} path - Dot-separated path (e.g., 'user.profile.name')
 * @param {any} defaultValue - Default value if path doesn't exist
 * @returns {any} Extracted value or default
 */
export const safeGet = (obj, path, defaultValue = null) => {
  if (!obj || typeof obj !== 'object') return defaultValue;

  const keys = path.split('.');
  let current = obj;

  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return defaultValue;
    }
    current = current[key];
  }

  return current !== undefined ? current : defaultValue;
};

