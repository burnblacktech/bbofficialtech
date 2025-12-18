// =====================================================
// UTILITY FUNCTIONS
// Class name utility and common helpers
// =====================================================

import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge class names with Tailwind conflict resolution
 * @param {...(string | object | undefined)} inputs - Class names to merge
 * @returns {string} Merged class names
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number as Indian currency (₹ prefix, Indian locale)
 * @param {number} amount - Amount to format
 * @returns {string} Formatted currency string
 */
export function formatIndianCurrency(amount) {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '₹0';
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format a number with Indian locale (comma separators)
 * @param {number} num - Number to format
 * @returns {string} Formatted number string
 */
export function formatIndianNumber(num) {
  if (typeof num !== 'number' || isNaN(num)) {
    return '0';
  }
  return new Intl.NumberFormat('en-IN').format(num);
}

/**
 * Parse a formatted Indian number string to number
 * @param {string} str - Formatted number string
 * @returns {number} Parsed number
 */
export function parseIndianNumber(str) {
  if (!str || typeof str !== 'string') {
    return 0;
  }
  return parseInt(str.replace(/,/g, ''), 10) || 0;
}

/**
 * Convert number to words (Indian number system - Lakh, Crore)
 * @param {number} num - Number to convert
 * @returns {string} Number in words
 */
export function numberToWords(num) {
  if (typeof num !== 'number' || isNaN(num) || num === 0) {
    return 'Zero';
  }

  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

  if (num >= 10000000) {
    const crores = Math.floor(num / 10000000);
    const remainder = num % 10000000;
    return `${numberToWords(crores)} Crore${crores !== 1 ? 's' : ''} ${remainder > 0 ? numberToWords(remainder) : ''}`.trim();
  }

  if (num >= 100000) {
    const lakhs = Math.floor(num / 100000);
    const remainder = num % 100000;
    return `${numberToWords(lakhs)} Lakh${lakhs !== 1 ? 's' : ''} ${remainder > 0 ? numberToWords(remainder) : ''}`.trim();
  }

  if (num >= 1000) {
    const thousands = Math.floor(num / 1000);
    const remainder = num % 1000;
    return `${numberToWords(thousands)} Thousand ${remainder > 0 ? numberToWords(remainder) : ''}`.trim();
  }

  if (num >= 100) {
    const hundreds = Math.floor(num / 100);
    const remainder = num % 100;
    return `${ones[hundreds]} Hundred ${remainder > 0 ? numberToWords(remainder) : ''}`.trim();
  }

  if (num >= 20) {
    const tensPlace = Math.floor(num / 10);
    const onesPlace = num % 10;
    return `${tens[tensPlace]} ${onesPlace > 0 ? ones[onesPlace] : ''}`.trim();
  }

  if (num >= 10) {
    return teens[num - 10];
  }

  return ones[num];
}

export default cn;
