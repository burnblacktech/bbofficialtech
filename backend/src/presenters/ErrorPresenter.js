/**
 * ErrorPresenter.js
 * Converts technical errors into user-friendly messages
 * Aligned with Doc 19 (Failure & Recovery Paths)
 */

const enterpriseLogger = require('../utils/logger');

class ErrorPresenter {
    /**
     * Format error for user display
     * @param {Error|AppError} error - Error object
     * @returns {Object} User-friendly error response
     */
    static formatForUser(error) {
        const errorCode = error.code || 'UNKNOWN_ERROR';
        const userMessage = this.getUserMessage(errorCode, error);

        enterpriseLogger.debug('Formatting error for user', {
            code: errorCode,
            originalMessage: error.message
        });

        return {
            success: false,
            error: {
                code: errorCode,
                title: userMessage.title,
                message: userMessage.message,
                actions: userMessage.actions || [],
                severity: userMessage.severity || 'error',
                technical: process.env.NODE_ENV === 'development' ? error.message : undefined
            }
        };
    }

    /**
     * Get user-friendly message for error code
     * @param {string} code - Error code
     * @param {Error} error - Original error
     * @returns {Object} Message object
     */
    static getUserMessage(code, error) {
        const messages = {
            // Payment Gate Errors (Category C)
            'PAYMENT_GATE_NOT_CLEARED': {
                title: 'Payment Required',
                message: error.message || 'You have tax payable. You must pay tax before filing.',
                actions: [
                    'Pay now (Challan 280)',
                    'I\'ve already paid (Enter CIN)'
                ],
                severity: 'warning'
            },

            // Filing Freeze Errors (Category B)
            'FILING_FROZEN': {
                title: 'Filing is Locked',
                message: 'Your filing is under review and cannot be edited. Contact your CA to make changes.',
                actions: [
                    'Contact CA',
                    'View filing'
                ],
                severity: 'info'
            },

            // State Machine Errors
            'INVALID_TRANSITION': {
                title: 'Invalid Action',
                message: 'This action is not allowed in the current filing state.',
                actions: ['View filing status'],
                severity: 'error'
            },

            'UNAUTHORIZED_TRANSITION': {
                title: 'Permission Denied',
                message: 'You do not have permission to perform this action.',
                actions: ['Contact support'],
                severity: 'error'
            },

            // Identity & Access Errors (Category A)
            'PAN_VERIFICATION_FAILED': {
                title: 'PAN Verification Failed',
                message: 'We couldn\'t verify your PAN with the Income Tax Department.\n\nPlease check:\n• PAN is correct (10 characters)\n• Date of Birth matches your PAN card\n\nIf details are correct, try again in 5 minutes (ITD systems may be slow).',
                actions: [
                    'Retry verification',
                    'Contact support'
                ],
                severity: 'warning'
            },

            'AUTH_TOKEN_MISSING': {
                title: 'Session Expired',
                message: 'Your session has expired for security. Please log in again.',
                actions: ['Log in'],
                severity: 'info'
            },

            'AUTH_TOKEN_INVALID': {
                title: 'Session Expired',
                message: 'Your session has expired. Please log in again to continue.',
                actions: ['Log in'],
                severity: 'info'
            },

            // Data Validation Errors (Category B)
            'VALIDATION_ERROR': {
                title: 'Invalid Data',
                message: error.message || 'Please check your input and try again.',
                actions: ['Review and correct'],
                severity: 'warning'
            },

            // ERI Errors (Category D)
            'ERI_TIMEOUT': {
                title: 'Submitting Your Return',
                message: 'We\'re still trying to submit your return to the Income Tax Department.\n\nITD servers are slow right now (this is normal during peak season).\n\nWe\'ll keep trying and notify you when it\'s done.\n\nYour return is safe. No action needed.',
                actions: ['Check status later'],
                severity: 'info'
            },

            'ERI_VALIDATION_ERROR': {
                title: 'Submission Error',
                message: 'Income Tax Department couldn\'t process your return.\n\nReason: ' + (error.message || 'Validation failed') + '\n\nNext steps:\n• Review your data\n• Contact support if issue persists',
                actions: [
                    'Review filing',
                    'Contact support',
                    'Download JSON'
                ],
                severity: 'error'
            },

            'ERI_RETRY_EXHAUSTED': {
                title: 'Submission Failed',
                message: 'We couldn\'t submit your return after multiple attempts.\n\nThis is rare and usually means ITD systems are down.\n\nYour return is safe. You can:\n• Download JSON (file manually on ITD portal)\n• Contact support for help\n• Wait for ITD systems to recover (we\'ll notify you)',
                actions: [
                    'Download JSON',
                    'Contact support'
                ],
                severity: 'error'
            },

            // CA Workflow Errors (Category E)
            'CA_NOT_AVAILABLE': {
                title: 'CA Assignment Pending',
                message: 'CA review is required for your return.\n\nWe\'re finding a CA for you (this may take 24-48 hours).\n\nWe\'ll notify you when assigned.\n\nYour data is saved.',
                actions: ['Check status later'],
                severity: 'info'
            },

            // System Errors (Category F)
            'DATABASE_ERROR': {
                title: 'Temporary Issue',
                message: 'We couldn\'t save your changes.\n\nPlease try again in a moment.\n\n(Your previous data is safe.)',
                actions: ['Retry'],
                severity: 'error'
            },

            'COMPUTATION_ERROR': {
                title: 'Calculating Tax',
                message: 'We\'re calculating your tax...\n\n(Taking longer than usual. Please wait.)',
                actions: ['Wait'],
                severity: 'info'
            },

            // Default
            'UNKNOWN_ERROR': {
                title: 'Something Went Wrong',
                message: 'An unexpected error occurred. Please try again or contact support.',
                actions: ['Retry', 'Contact support'],
                severity: 'error'
            }
        };

        return messages[code] || messages['UNKNOWN_ERROR'];
    }

    /**
     * Format validation errors
     * @param {Array} errors - Array of validation errors
     * @returns {Object} Formatted response
     */
    static formatValidationErrors(errors) {
        return {
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                title: 'Please Check Your Input',
                message: 'Some fields need your attention:',
                fields: errors.map(err => ({
                    field: err.field || err.path,
                    message: err.message
                })),
                severity: 'warning'
            }
        };
    }

    /**
     * Format success message
     * @param {string} message - Success message
     * @param {Object} data - Additional data
     * @returns {Object} Success response
     */
    static formatSuccess(message, data = {}) {
        return {
            success: true,
            message,
            ...data
        };
    }
}

module.exports = ErrorPresenter;
