/**
 * CAAssistEngine.js
 * V2.3 Backend-Only CA Routing
 *
 * Responsibilities:
 * - Evaluate 'caContext' based on Trust Score and Signals.
 * - Determine Urgency and Reason Codes.
 * - PURE FUNCTION. No DB access.
 */

class CAAssistEngine {

    /**
     * Evaluate CA Context
     * @param {Object} input - Input context
     * @param {Object} input.confidence - Confidence result { trustScore, confidenceBand, ... }
     * @param {Array} input.signals - Intelligence signals
     * @param {String} input.itrType - ITR Type (ITR-1, ITR-2, etc.)
     * @param {String} input.status - Filing status
     * @returns {Object} CA Context result
     */
    static evaluateCAContext({
        confidence = {},
        signals = [],
        itrType = '',
        status = ''
    }) {
        // Defaults
        const result = {
            caAssistEligible: false,
            caAssistRecommended: false,
            reasonCodes: [],
            urgency: 'LOW',
            createdAt: new Date() // Computed at runtime
        };

        // 1. Eligibility
        // ITR-2, ITR-3, ITR-4 are eligible. ITR-1 (simple) is usually not target unless complexity found.
        // Prompt rule: caAssistEligible = itrType IN ['ITR-2','ITR-3','ITR-4']
        // Note: Check for exact string matching
        const ELIGIBLE_TYPES = ['ITR-2', 'ITR-3', 'ITR-4'];
        result.caAssistEligible = ELIGIBLE_TYPES.includes(itrType);

        // 2. Recommendation
        // caAssistRecommended = caAssistEligible && (confidenceBand !== 'HIGH' || signals.length >= 2)
        const confidenceBand = confidence.confidenceBand || 'LOW';
        const blockingIssues = confidence.blockingIssues === true;

        if (result.caAssistEligible) {
            const hasLowConfidence = confidenceBand !== 'HIGH';
            const hasManySignals = signals.length >= 2;

            if (hasLowConfidence || hasManySignals) {
                result.caAssistRecommended = true;
            }
        }

        // 3. Reason Codes
        // Populate from: LOW_CONFIDENCE, MULTIPLE_WARNINGS, BUSINESS_INCOME, CAPITAL_GAINS_PRESENT, REGIME_AMBIGUOUS
        if (confidenceBand === 'LOW') {
            result.reasonCodes.push('LOW_CONFIDENCE');
        }

        if (signals.length >= 2 && confidenceBand !== 'LOW') { // Avoid redundancy if low confidence already covers it? 
            // Prompt says populate from list.
            result.reasonCodes.push('MULTIPLE_WARNINGS');
        }

        // Infer from ITR Type / Signals
        // ITR-3/4 implies Business Income
        if (itrType === 'ITR-3' || itrType === 'ITR-4') {
            result.reasonCodes.push('BUSINESS_INCOME');
        }

        // ITR-2/3 implies Capital Gains
        if (itrType === 'ITR-2' || itrType === 'ITR-3') {
            result.reasonCodes.push('CAPITAL_GAINS_PRESENT');
        }

        // Check for Regime Ambiguity signal
        const hasRegimeWarning = signals.some(s => s.category === 'regime' && s.severity !== 'info');
        if (hasRegimeWarning) {
            result.reasonCodes.push('REGIME_AMBIGUOUS');
        }

        // Dedupe reason codes
        result.reasonCodes = [...new Set(result.reasonCodes)];

        // 4. Urgency
        // HIGH → blockingIssues === true
        // MEDIUM → confidenceBand === 'LOW'
        // LOW → otherwise
        if (blockingIssues) {
            result.urgency = 'HIGH';
        } else if (confidenceBand === 'LOW') {
            result.urgency = 'MEDIUM';
        } else {
            result.urgency = 'LOW';
        }

        return result;
    }
}

module.exports = CAAssistEngine;
