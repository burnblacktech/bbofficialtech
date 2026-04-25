// =====================================================
// ASSESSMENT YEAR CONSTANTS
// Centralized configuration for assessment years
// =====================================================

/**
 * Get the current assessment year
 * Can be overridden by environment variable ASSESSMENT_YEAR
 * @returns {string} Current assessment year (e.g., '2024-25')
 */
const getCurrentAssessmentYear = () => {
  // Allow override via environment variable
  if (process.env.ASSESSMENT_YEAR) {
    return process.env.ASSESSMENT_YEAR;
  }
  
  // Calculate current assessment year based on current date
  const now = new Date();
  const currentYear = now.getFullYear();
  const month = now.getMonth() + 1; // 1-12
  
  // Assessment year runs from April to March
  // If current month is April or later, current AY is currentYear-currentYear+1
  // If current month is Jan-Mar, current AY is previousYear-currentYear
  if (month >= 4) {
    // April onwards: AY is currentYear-nextYear
    const nextYear = (currentYear + 1).toString().slice(-2);
    return `${currentYear}-${nextYear}`;
  } else {
    // Jan-Mar: AY is previousYear-currentYear
    const prevYear = currentYear - 1;
    const currentYearShort = currentYear.toString().slice(-2);
    return `${prevYear}-${currentYearShort}`;
  }
};

/**
 * Get default assessment year (fallback)
 * Used when no assessment year is provided
 * @returns {string} Default assessment year
 */
const getDefaultAssessmentYear = () => {
  return getCurrentAssessmentYear();
};

/**
 * Validate assessment year format
 * @param {string} assessmentYear - Assessment year to validate
 * @returns {boolean} True if valid format
 */
const isValidAssessmentYear = (assessmentYear) => {
  if (!assessmentYear || typeof assessmentYear !== 'string') {
    return false;
  }
  
  // Format: YYYY-YY (e.g., '2024-25')
  const pattern = /^\d{4}-\d{2}$/;
  if (!pattern.test(assessmentYear)) {
    return false;
  }
  
  const [startYear, endYear] = assessmentYear.split('-');
  const start = parseInt(startYear);
  const end = parseInt('20' + endYear);
  
  // End year should be start year + 1
  return end === start + 1;
};

/**
 * Get list of available assessment years
 * @param {number} yearsBack - Number of years to go back (default: 5)
 * @returns {string[]} Array of assessment years
 */
const getAvailableAssessmentYears = (yearsBack = 5) => {
  const currentAY = getCurrentAssessmentYear();
  const [startYear] = currentAY.split('-');
  const start = parseInt(startYear);
  
  const years = [];
  for (let i = 0; i <= yearsBack; i++) {
    const year = start - i;
    const nextYear = (year + 1).toString().slice(-2);
    years.push(`${year}-${nextYear}`);
  }
  
  return years;
};

/**
 * Get previous assessment year
 * @param {string} assessmentYear - Current assessment year
 * @returns {string} Previous assessment year
 */
const getPreviousAssessmentYear = (assessmentYear) => {
  const [startYear] = assessmentYear.split('-');
  const start = parseInt(startYear);
  const prevStart = start - 1;
  const prevEnd = start.toString().slice(-2);
  return `${prevStart}-${prevEnd}`;
};

/**
 * Get next assessment year
 * @param {string} assessmentYear - Current assessment year
 * @returns {string} Next assessment year
 */
const getNextAssessmentYear = (assessmentYear) => {
  const [startYear] = assessmentYear.split('-');
  const start = parseInt(startYear);
  const nextStart = start + 1;
  const nextEnd = (nextStart + 1).toString().slice(-2);
  return `${nextStart}-${nextEnd}`;
};

module.exports = {
  CURRENT_ASSESSMENT_YEAR: getCurrentAssessmentYear(),
  DEFAULT_ASSESSMENT_YEAR: getDefaultAssessmentYear(),
  getCurrentAssessmentYear,
  getDefaultAssessmentYear,
  isValidAssessmentYear,
  getAvailableAssessmentYears,
  getPreviousAssessmentYear,
  getNextAssessmentYear,
};

