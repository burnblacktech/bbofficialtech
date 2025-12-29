// =====================================================
// YEAR SERVICE
// Manages financial years, belated return eligibility,
// due dates, and filing windows
// =====================================================

const enterpriseLogger = require('../../utils/logger');
const { AppError } = require('../../middleware/errorHandler');

class YearService {
  constructor() {
    // Current financial year
    this.currentFY = this.getCurrentFY();
    
    // Belated return filing window (typically 3 years from end of AY)
    this.belatedWindowYears = 3;
  }

  /**
   * Get current financial year
   * @returns {string} Current FY in format 'YYYY-YY' (e.g., '2024-25')
   */
  getCurrentFY() {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-12

    // FY runs from April to March
    // If month is Jan-Mar, FY is previous year
    if (currentMonth >= 1 && currentMonth <= 3) {
      const fyEnd = currentYear;
      const fyStart = currentYear - 1;
      return `${fyStart}-${fyEnd.toString().slice(-2)}`;
    } else {
      const fyStart = currentYear;
      const fyEnd = currentYear + 1;
      return `${fyStart}-${fyEnd.toString().slice(-2)}`;
    }
  }

  /**
   * Get available financial years (current + belated eligible)
   * @returns {array} Array of FY objects with eligibility info
   */
  getAvailableFYs() {
    const currentFY = this.getCurrentFY();
    const [currentStart, currentEnd] = currentFY.split('-').map(Number);
    
    const availableFYs = [];
    const currentYear = new Date().getFullYear();
    
    // Generate FYs from 5 years ago to current year
    for (let i = 5; i >= 0; i--) {
      const fyStart = currentYear - i;
      const fyEnd = fyStart + 1;
      const fy = `${fyStart}-${fyEnd.toString().slice(-2)}`;
      
      const fyInfo = this.getFYInfo(fy);
      if (fyInfo.isEligible) {
        availableFYs.push(fyInfo);
      }
    }

    return availableFYs;
  }

  /**
   * Get financial year information
   * @param {string} fy - Financial year in format 'YYYY-YY'
   * @returns {object} FY information
   */
  getFYInfo(fy) {
    const [startYear, endYear] = fy.split('-').map((part, index) => {
      if (index === 0) return parseInt(part);
      return 2000 + parseInt(part);
    });

    const assessmentYear = `${endYear}-${(endYear + 1).toString().slice(-2)}`;
    const dueDate = this.getDueDate(fy);
    const isBelated = this.isBelatedReturn(fy);
    const lateFee = isBelated ? this.calculateLateFee(fy) : 0;
    const isEligible = this.isEligibleForFiling(fy);

    return {
      fy,
      assessmentYear,
      startDate: new Date(startYear, 3, 1), // April 1
      endDate: new Date(endYear, 2, 31), // March 31
      dueDate,
      isBelated,
      lateFee,
      isEligible,
      daysRemaining: isEligible ? this.getDaysRemaining(dueDate) : null,
    };
  }

  /**
   * Get due date for a financial year
   * @param {string} fy - Financial year
   * @returns {Date} Due date
   */
  getDueDate(fy) {
    const [startYear] = fy.split('-').map(Number);
    const endYear = startYear + 1;
    
    // Due date is typically July 31 of the assessment year
    // For FY 2023-24, AY is 2024-25, due date is July 31, 2024
    return new Date(endYear, 6, 31); // July 31
  }

  /**
   * Check if return is belated
   * @param {string} fy - Financial year
   * @returns {boolean} True if belated
   */
  isBelatedReturn(fy) {
    const dueDate = this.getDueDate(fy);
    const now = new Date();
    return now > dueDate;
  }

  /**
   * Check if FY is eligible for filing
   * @param {string} fy - Financial year
   * @returns {boolean} True if eligible
   */
  isEligibleForFiling(fy) {
    const [startYear] = fy.split('-').map(Number);
    const currentYear = new Date().getFullYear();
    const currentFY = this.getCurrentFY();
    const [currentStart] = currentFY.split('-').map(Number);

    // Can file for current FY or past FYs within belated window
    if (startYear >= currentStart) {
      return true; // Current or future FY
    }

    // Check if within belated window (3 years from end of AY)
    const endYear = startYear + 1;
    const belatedDeadline = new Date(endYear + this.belatedWindowYears, 2, 31); // March 31, 3 years later
    const now = new Date();

    return now <= belatedDeadline;
  }

  /**
   * Calculate late fee for belated return
   * @param {string} fy - Financial year
   * @returns {number} Late fee amount
   */
  calculateLateFee(fy) {
    if (!this.isBelatedReturn(fy)) {
      return 0;
    }

    const dueDate = this.getDueDate(fy);
    const now = new Date();
    const daysLate = Math.floor((now - dueDate) / (1000 * 60 * 60 * 24));

    // Late fee calculation (simplified):
    // ₹5,000 if filed before December 31
    // ₹10,000 if filed after December 31
    const dec31 = new Date(dueDate.getFullYear(), 11, 31);
    
    if (now <= dec31) {
      return 5000;
    } else {
      return 10000;
    }
  }

  /**
   * Get days remaining until due date
   * @param {Date} dueDate - Due date
   * @returns {number} Days remaining (negative if overdue)
   */
  getDaysRemaining(dueDate) {
    const now = new Date();
    const diffTime = dueDate - now;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Validate financial year format
   * @param {string} fy - Financial year
   * @returns {boolean} True if valid format
   */
  validateFY(fy) {
    const pattern = /^\d{4}-\d{2}$/;
    if (!pattern.test(fy)) {
      return false;
    }

    const [start, end] = fy.split('-').map(Number);
    const expectedEnd = (start + 1) % 100;
    
    return end === expectedEnd;
  }

  /**
   * Get assessment year from financial year
   * @param {string} fy - Financial year
   * @returns {string} Assessment year
   */
  getAssessmentYear(fy) {
    const [startYear] = fy.split('-').map(Number);
    const endYear = startYear + 1;
    return `${endYear}-${(endYear + 1).toString().slice(-2)}`;
  }

  /**
   * Get financial year from assessment year
   * @param {string} ay - Assessment year
   * @returns {string} Financial year
   */
  getFYFromAY(ay) {
    const [startYear] = ay.split('-').map(Number);
    const fyStart = startYear - 1;
    return `${fyStart}-${startYear.toString().slice(-2)}`;
  }
}

module.exports = YearService;

