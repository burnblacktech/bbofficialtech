// =====================================================
// FILING FREEZE SERVICE (S18)
// Enforces immutability rules for filings
// =====================================================

const { AppError } = require('../../middleware/errorHandler');
const enterpriseLogger = require('../../utils/logger');

class FilingFreezeService {
    /**
     * Check if filing is frozen (immutable)
     * @param {object} filing - ITRFiling instance
     * @returns {boolean}
     */
    isFrozen(filing) {
        const frozenStates = [
            'review_pending',
            'reviewed',
            'approved',
            'submitted_to_eri',
            'eri_success',
            'eri_failed'
        ];

        return frozenStates.includes(filing.lifecycleState);
    }

    /**
     * Assert that filing is mutable (throw if frozen)
     * @param {object} filing - ITRFiling instance
     * @throws {AppError} if filing is frozen
     */
    assertMutable(filing) {
        if (this.isFrozen(filing)) {
            enterpriseLogger.warn('Mutation attempted on frozen filing', {
                filingId: filing.id,
                lifecycleState: filing.lifecycleState
            });

            throw new AppError(
                'Filing is frozen. Cannot modify data after review has started. Please contact your CA to make changes.',
                403,
                'FILING_FROZEN'
            );
        }
    }

    /**
     * Check if user can unfreeze filing
     * @param {object} filing - ITRFiling instance
     * @param {object} user - User instance
     * @returns {object} { allowed: boolean, reason: string }
     */
    canUnfreeze(filing, user) {
        // Only CA role can unfreeze
        if (user.role !== 'CA') {
            return {
                allowed: false,
                reason: 'Only CA can unfreeze filings'
            };
        }

        // Must be same firm
        if (user.caFirmId !== filing.caFirmId) {
            return {
                allowed: false,
                reason: 'User not in same firm as filing'
            };
        }

        // Cannot unfreeze after ERI submission
        const permanentlyFrozen = ['submitted_to_eri', 'eri_success', 'eri_failed'];
        if (permanentlyFrozen.includes(filing.lifecycleState)) {
            return {
                allowed: false,
                reason: 'Cannot unfreeze after ERI submission'
            };
        }

        return { allowed: true };
    }

    /**
     * Get frozen states list
     * @returns {Array<string>}
     */
    getFrozenStates() {
        return [
            'review_pending',
            'reviewed',
            'approved',
            'submitted_to_eri',
            'eri_success',
            'eri_failed'
        ];
    }
}

module.exports = new FilingFreezeService();
