// =====================================================
// INPUT SANITIZATION UTILITIES
// Sanitize user inputs to prevent XSS and injection attacks
// =====================================================

/**
 * Sanitize string input by removing potentially dangerous characters
 * @param {string} input - Input string to sanitize
 * @returns {string} Sanitized string
 */
export const sanitizeString = (input) => {
  if (typeof input !== 'string') {
    return '';
  }

  // Remove HTML tags
  let sanitized = input.replace(/<[^>]*>/g, '');

  // Remove script tags and their content
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Remove event handlers (onclick, onerror, etc.)
  sanitized = sanitized.replace(/on\w+="[^"]*"/gi, '');
  sanitized = sanitized.replace(/on\w+='[^']*'/gi, '');

  // Trim whitespace
  sanitized = sanitized.trim();

  return sanitized;
};

/**
 * Sanitize email input
 * @param {string} email - Email to sanitize
 * @returns {string} Sanitized email
 */
export const sanitizeEmail = (email) => {
  if (typeof email !== 'string') {
    return '';
  }

  // Convert to lowercase and trim
  let sanitized = email.toLowerCase().trim();

  // Remove any characters that aren't valid in email addresses
  // Keep only alphanumeric, @, ., -, and _
  sanitized = sanitized.replace(/[^a-z0-9@._-]/g, '');

  return sanitized;
};

/**
 * Sanitize password input (basic sanitization, don't modify too much)
 * @param {string} password - Password to sanitize
 * @returns {string} Sanitized password
 */
export const sanitizePassword = (password) => {
  if (typeof password !== 'string') {
    return '';
  }

  // For passwords, we mainly want to prevent null bytes and control characters
  // but preserve special characters that might be valid in passwords
  let sanitized = password.replace(/\0/g, ''); // Remove null bytes
  // Remove control characters (0x00-0x1F and 0x7F) using character code check
  sanitized = sanitized.split('').filter(char => {
    const code = char.charCodeAt(0);
    return code !== 0x7F && (code > 0x1F || code === 0x09 || code === 0x0A || code === 0x0D);
  }).join('');

  return sanitized;
};

/**
 * Sanitize phone number input
 * @param {string} phone - Phone number to sanitize
 * @returns {string} Sanitized phone number (digits only)
 */
export const sanitizePhone = (phone) => {
  if (typeof phone !== 'string') {
    return '';
  }

  // Keep only digits
  return phone.replace(/\D/g, '');
};

