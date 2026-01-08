// =====================================================
// REVIEW REQUIREMENT SERVICE (S20.A)
// Derives CA requirement from filing data
// Pure computation - no storage
// =====================================================

const enterpriseLogger = require('../../utils/logger');

class ReviewRequirementService {
    /**
     * Derive review requirement from filing data
     * @param {Object} filing - ITRFiling instance
     * @returns {string} 'none' | 'optional' | 'mandatory'
     */
    deriveRequirement(filing) {
        const payload = filing.jsonPayload || {};
        const income = payload.income || {};

        enterpriseLogger.info('Deriving review requirement', {
            filingId: filing.id,
            hasCapitalGains: !!income.capitalGains,
            hasBusiness: !!income.business,
            employerCount: income.salary?.employers?.length || 0
        });

        // Mandatory CA if:
        // - Capital gains present
        // - Business income present
        // - High-value salary (> 50L)
        if (income.capitalGains?.transactions?.length > 0) {
            return 'mandatory';
        }

        if (income.business) {
            return 'mandatory';
        }

        if (income.salary?.employers?.some(e => e.gross > 5000000)) {
            return 'mandatory'; // > 50L salary
        }

        // Optional CA if:
        // - Multiple employers
        // - Deductions claimed
        if (income.salary?.employers?.length > 1) {
            return 'optional';
        }

        if (payload.deductions && Object.keys(payload.deductions).length > 0) {
            return 'optional';
        }

        // Default: no CA needed
        return 'none';
    }

    /**
     * Check if direct submission is allowed
     * @param {Object} filing - ITRFiling instance
     * @returns {boolean}
     */
    canSubmitDirectly(filing) {
        const requirement = this.deriveRequirement(filing);
        return requirement === 'none' || requirement === 'optional';
    }

    /**
     * Get human-readable explanation of requirement
     * @param {Object} filing - ITRFiling instance
     * @returns {Object}
     */
    getRequirementExplanation(filing) {
        const requirement = this.deriveRequirement(filing);
        const payload = filing.jsonPayload || {};
        const income = payload.income || {};

        const explanations = {
            none: {
                requirement: 'none',
                message: 'You can submit this return directly without CA review',
                canSubmitDirectly: true,
                reasons: ['Simple salary return', 'No complex income sources']
            },
            optional: {
                requirement: 'optional',
                message: 'CA review is optional but recommended',
                canSubmitDirectly: true,
                reasons: []
            },
            mandatory: {
                requirement: 'mandatory',
                message: 'CA review is required for this return',
                canSubmitDirectly: false,
                reasons: []
            }
        };

        const result = explanations[requirement];

        // Add specific reasons for optional
        if (requirement === 'optional') {
            if (income.salary?.employers?.length > 1) {
                result.reasons.push('Multiple employers detected');
            }
            if (payload.deductions) {
                result.reasons.push('Deductions claimed');
            }
        }

        // Add specific reasons for mandatory
        if (requirement === 'mandatory') {
            if (income.capitalGains?.transactions?.length > 0) {
                result.reasons.push('Capital gains transactions present');
            }
            if (income.business) {
                result.reasons.push('Business income present');
            }
            if (income.salary?.employers?.some(e => e.gross > 5000000)) {
                result.reasons.push('High-value salary (> ₹50L)');
            }
        }

        return result;
    }
}

module.exports = new ReviewRequirementService();
