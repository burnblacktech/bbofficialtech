/**
 * Date Helper Utilities
 * Common date manipulation functions
 */

/**
 * Get current financial year in format YYYY-YY
 * Financial year in India runs from April 1 to March 31
 * @returns {string} Financial year (e.g., "2023-24")
 */
const getCurrentFinancialYear = () => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1; // 0-indexed

    // If current month is Jan-Mar, FY is previous year to current year
    // If current month is Apr-Dec, FY is current year to next year
    if (currentMonth >= 4) {
        // Apr-Dec: FY 2023-24 (if current year is 2023)
        return `${currentYear}-${(currentYear + 1).toString().slice(-2)}`;
    } else {
        // Jan-Mar: FY 2022-23 (if current year is 2023)
        return `${currentYear - 1}-${currentYear.toString().slice(-2)}`;
    }
};

/**
 * Get assessment year from financial year
 * AY is always FY + 1
 * @param {string} financialYear - Financial year (e.g., "2023-24")
 * @returns {string} Assessment year (e.g., "2024-25")
 */
const getAssessmentYear = (financialYear) => {
    const [startYear] = financialYear.split('-');
    const start = parseInt(startYear);
    return `${start + 1}-${(start + 2).toString().slice(-2)}`;
};

/**
 * Format date to DD/MM/YYYY
 * @param {Date|string} date - Date object or string
 * @returns {string} Formatted date
 */
const formatDate = (date) => {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
};

/**
 * Check if date is within financial year
 * @param {Date|string} date - Date to check
 * @param {string} financialYear - Financial year (e.g., "2023-24")
 * @returns {boolean} True if date is within FY
 */
const isDateInFinancialYear = (date, financialYear) => {
    const d = new Date(date);
    const [startYear] = financialYear.split('-');
    const fyStart = new Date(`${startYear}-04-01`);
    const fyEnd = new Date(`${parseInt(startYear) + 1}-03-31`);
    return d >= fyStart && d <= fyEnd;
};

module.exports = {
    getCurrentFinancialYear,
    getAssessmentYear,
    formatDate,
    isDateInFinancialYear,
};
