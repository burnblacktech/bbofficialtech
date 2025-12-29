const ErrorCodes = require('../constants/ErrorCodes');
const { AppError } = require('../middleware/errorHandler');

/**
 * Maps ERI/Gateway errors to Canonical AppErrors
 * @param {Error} error - The original error (Axios or other)
 * @returns {AppError} - The mapped AppError
 */
const mapERIError = (error) => {
    // If it's already an AppError, return strictly (don't wrap)
    if (error instanceof AppError) return error;

    const message = error.message || '';
    const responseData = error.response?.data || {};
    const status = error.response?.status;
    const rawCode = responseData.code || responseData.errorCode || '';
    const rawMsg = responseData.message || responseData.errorMessage || message;

    // 1. Session / Auth Errors
    if (status === 401 || rawMsg.includes('session expired') || rawMsg.includes('token expired')) {
        return new AppError(ErrorCodes.UPSTREAM_SESSION_EXPIRED, 'ERI Session Expired. Please retry.', 502, { upstream: rawMsg });
    }

    // 2. Service Availability
    if (status === 503 || status === 504 || rawMsg.includes('timeout') || error.code === 'ECONNABORTED') {
        return new AppError(ErrorCodes.UPSTREAM_UNAVAILABLE, 'ERI Service Unavailable. Please try again later.', 503, { upstream: rawMsg });
    }

    // 3. Known ERI Business Errors
    if (rawMsg.includes('PAN invalid') || rawMsg.includes('Invalid PAN') || rawCode === 'INVALID_PAN') {
        return new AppError(ErrorCodes.INVALID_PAN, 'Invalid PAN reported by IT Department.', 400, { upstream: rawMsg });
    }

    if (rawMsg.includes('Authentication failed') || rawCode === 'AUTH_FAILED') {
        return new AppError(ErrorCodes.UPSTREAM_ERROR, 'ERI Authentication Failed. Check credentials.', 401, { upstream: rawMsg });
    }

    if (rawMsg.includes('Signature invalid') || rawCode === 'SIGNATURE_INVALID') {
        return new AppError(ErrorCodes.UPSTREAM_ERROR, 'Digital Signature Verification Failed.', 400, { upstream: rawMsg });
    }

    if (rawMsg.includes('Duplicate filing') || rawCode === 'DUPLICATE_FILING') {
        return new AppError(ErrorCodes.FILING_ALREADY_SUBMITTED, 'Filing already exists for this PAN and Year.', 409, { upstream: rawMsg });
    }

    if (rawMsg.includes('JSON Schema') || rawCode === 'SCHEMA_ERROR') {
        return new AppError(ErrorCodes.INVALID_JSON, 'ITD Validation Failed (Schema Mismatch).', 400, { upstream: rawMsg });
    }

    // 4. Submission Rejection (Generic 422 or 400 from ERI)
    if (status === 400 || status === 422) {
        return new AppError(ErrorCodes.SUBMISSION_REJECTED, `ITD Rejected Submission: ${rawMsg}`, 422, { upstream: rawMsg, errors: responseData.errors });
    }

    // 5. Default Fallback
    return new AppError(ErrorCodes.UPSTREAM_ERROR, 'Upstream ERI Error', 502, { upstream: rawMsg, status });
};

module.exports = { mapERIError };
