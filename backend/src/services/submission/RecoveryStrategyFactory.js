/**
 * RecoveryStrategyFactory.js
 * V4.4 - Resilience Logic
 * Determines HOW to recover from a specific failure type.
 */

class RecoveryStrategyFactory {

    static getStrategy(failureReason, retryCount) {
        // 1. Analyze the error string or code
        const isNetworkError = this._isTransientNetworkError(failureReason);
        const isAuthError = failureReason.includes('AUTH_FAILED') || failureReason.includes('INVALID_TOKEN');
        const isValidationFailure = failureReason.includes('VALIDATION_ERROR') || failureReason.includes('Invalid Schema');

        // 2. Determine Strategy
        if (isNetworkError) {
            return {
                action: 'RETRY',
                maxRetries: 3,
                backoff: 'EXPONENTIAL', // 1min, 5min, 15min
                reason: 'Transient Network Error'
            };
        }

        if (isAuthError) {
            // Token might be expired, retry ONCE with force refresh?
            // For now, fail fast so user/CA can re-login or system can refresh.
            // If we have auto-refresh token logic, we could retry.
            // Let's assume critical failure for V1.
            return {
                action: 'ESCALATE',
                targetState: 'ACTION_REQUIRED',
                reason: 'Authentication Failed - Manual Intervention Needed'
            };
        }

        if (isValidationFailure) {
            return {
                action: 'ESCALATE',
                targetState: 'ACTION_REQUIRED', // User must fix data
                reason: 'Validation Rejected by Gateway'
            };
        }

        // Default: If purely unknown, retry once then fail?
        if (retryCount < 1) {
            return {
                action: 'RETRY',
                maxRetries: 1,
                backoff: 'FIXED', // 1 min
                reason: 'Unknown Error - One-time Retry'
            };
        }

        return {
            action: 'ESCALATE',
            targetState: 'ERI_FAILED', // Final terminal failure
            reason: 'Unknown Error - Retries Exhausted'
        };
    }

    static _isTransientNetworkError(reason) {
        const networkKeywords = ['ETIMEDOUT', 'ECONNRESET', '503', '502', 'Network Error', 'Timeout'];
        return networkKeywords.some(k => reason.includes(k));
    }
}

module.exports = RecoveryStrategyFactory;
