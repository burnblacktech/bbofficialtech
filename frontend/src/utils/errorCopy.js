/**
 * errorCopy — Empathetic, solution-oriented error messages.
 *
 * Three rules: empathetic, solution-oriented, never blame the user.
 */

const ERROR_MESSAGES = {
  // Validation errors — gentle, specific
  amountInvalid: 'Please enter a positive amount.',
  dateOutOfRange: 'This date falls outside the {fy} financial year (Apr {startYear} – Mar {endYear}).',
  fileTooLarge: 'This file is over 10MB. Try compressing it or uploading a smaller version.',
  requiredField: 'This field is needed to continue.',
  panInvalid: 'That doesn\'t look like a valid PAN. It should be 10 characters like ABCDE1234F.',

  // Network / server errors — reassuring
  networkError: 'We couldn\'t reach the server. Check your connection and try again.',
  serverError: 'Something went wrong on our end. Your data is safe — please try again in a moment.',
  timeout: 'This is taking longer than expected. Hang tight or try again.',

  // Filing errors — calm, actionable
  filingLocked: 'This filing has been submitted and can\'t be edited. Need to make changes? Start a revised return.',
  entryLocked: 'This entry is linked to a submitted filing and can\'t be changed.',
  limitReached: 'You\'ve reached the {section} deduction limit of ₹{limit}. Additional investments won\'t count toward this deduction.',

  // Auth errors
  sessionExpired: 'Your session has expired. Please log in again to continue.',
  wrongPassword: 'That password didn\'t match. Try again or reset it.',
};

/**
 * Get an error message by key, with optional variable interpolation.
 * @param {string} key - Error message key from ERROR_MESSAGES
 * @param {Record<string, string|number>} [vars] - Template variables
 * @returns {string} The formatted error message, or a generic fallback
 */
export function getErrorMessage(key, vars = {}) {
  const template = ERROR_MESSAGES[key];
  if (!template) {
    return 'Something went wrong. Please try again.';
  }
  return template.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''));
}

/**
 * Map an API error response to a user-friendly message.
 * @param {Error|object} error - Axios error or generic error
 * @returns {string}
 */
export function mapApiError(error) {
  if (!error) return getErrorMessage('serverError');

  const status = error?.response?.status;
  if (!status && !error?.response) return getErrorMessage('networkError');

  if (status === 401) return getErrorMessage('sessionExpired');
  if (status === 408) return getErrorMessage('timeout');
  if (status >= 500) return getErrorMessage('serverError');

  // Try to use backend-provided message
  const serverMsg = error?.response?.data?.message || error?.response?.data?.error;
  if (serverMsg) return serverMsg;

  return getErrorMessage('serverError');
}

export { ERROR_MESSAGES };
export default getErrorMessage;
