/**
 * Canonical Application Error
 * Phase B3.1 - Error Standardization
 */
const ErrorCodes = require('../constants/ErrorCodes');

class AppError extends Error {
    /**
     * @param {string} code - Enum from ErrorCodes
     * @param {string} message - Human readable message
     * @param {number} statusCode - HTTP status code
     * @param {object} details - Additional structured data
     * @param {boolean} retryable - Hint for frontend retry logic
     */
    constructor(code, message, statusCode = 500, details = {}, retryable = false) {
        super(message);
        this.name = 'AppError';
        this.code = code || ErrorCodes.INTERNAL_ERROR;
        this.statusCode = statusCode;
        this.details = details || {};
        this.retryable = retryable;
        Error.captureStackTrace(this, this.constructor);
    }

    // Pre-defined factories for common errors

    static badRequest(message, code = ErrorCodes.VALIDATION_FAILED, details = {}) {
        return new AppError(code, message, 400, details);
    }

    static validationFailed(details, message = 'Validation failed') {
        return new AppError(ErrorCodes.VALIDATION_FAILED, message, 422, details);
    }

    static unauthorized(message = 'Authentication required') {
        return new AppError(ErrorCodes.AUTH_REQUIRED, message, 401);
    }

    static forbidden(message = 'Access denied', code = ErrorCodes.FORBIDDEN) {
        return new AppError(code, message, 403);
    }

    static notFound(resource = 'Resource', details = {}) {
        return new AppError(ErrorCodes.RESOURCE_NOT_FOUND, `${resource} not found`, 404, details);
    }

    static computationRequired(message = 'Fresh tax computation required', details = {}) {
        return new AppError(ErrorCodes.COMPUTATION_REQUIRED, message, 422, details);
    }

    static filingLocked(message = 'Filing is locked and cannot be modified', details = {}) {
        return new AppError(ErrorCodes.FILING_LOCKED, message, 423, details);
    }

    static invalidState(message = 'Invalid operation for current state', details = {}) {
        return new AppError(ErrorCodes.INVALID_STATE_TRANSITION, message, 409, details);
    }
}

module.exports = AppError;
