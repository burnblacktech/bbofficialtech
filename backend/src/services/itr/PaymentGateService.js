/**
 * PaymentGateService.js
 * S27 - Tax Payment Gate Enforcement
 * Ensures tax liability is paid before filing submission
 */

const { AppError } = require('../../middleware/errorHandler');
const enterpriseLogger = require('../../utils/logger');
const ITRFiling = require('../../models/ITRFiling');
const TaxPayment = require('../../models/TaxPayment');
const SubmissionStateMachine = require('../../domain/SubmissionStateMachine');
const STATES = require('../../domain/SubmissionStates');

class PaymentGateService {
    /**
     * Check if payment gate is cleared for a filing
     * @param {string} filingId - Filing ID
     * @returns {Promise<Object>} { cleared: boolean, reason: string, liability: number, paid: number }
     */
    async checkPaymentGate(filingId) {
        try {
            const filing = await ITRFiling.findByPk(filingId);
            if (!filing) {
                throw new AppError('Filing not found', 404);
            }

            const taxLiability = parseFloat(filing.taxLiability) || 0;

            // No tax liability = gate automatically cleared
            if (taxLiability <= 0) {
                return {
                    cleared: true,
                    reason: 'No tax liability',
                    liability: 0,
                    paid: 0
                };
            }

            // Calculate total paid
            const jsonPayload = filing.jsonPayload || {};
            const taxesPaid = jsonPayload.taxes_paid || jsonPayload.taxesPaid || {};

            const advanceTaxPaid = this.calculatePaymentTotal(taxesPaid.advanceTax || []);
            const selfAssessmentPaid = this.calculatePaymentTotal(taxesPaid.selfAssessmentTax || []);
            const totalPaid = advanceTaxPaid + selfAssessmentPaid;

            const cleared = totalPaid >= taxLiability;

            return {
                cleared,
                reason: cleared ? 'Payment verified' : `Insufficient payment: ₹${(taxLiability - totalPaid).toFixed(2)} remaining`,
                liability: taxLiability,
                paid: totalPaid,
                breakdown: {
                    advanceTax: advanceTaxPaid,
                    selfAssessmentTax: selfAssessmentPaid
                }
            };
        } catch (error) {
            enterpriseLogger.error('Failed to check payment gate', {
                filingId,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Clear payment gate and transition to ready_for_submission
     * @param {string} filingId - Filing ID
     * @param {string} userId - User ID
     * @returns {Promise<Object>} Updated filing
     */
    async clearPaymentGate(filingId, userId) {
        try {
            const filing = await ITRFiling.findByPk(filingId);
            if (!filing) {
                throw new AppError('Filing not found', 404);
            }

            // Check if user owns filing
            if (filing.userId !== userId && filing.createdBy !== userId) {
                throw new AppError('Unauthorized: You do not own this filing', 403);
            }

            // Check if already cleared
            if (filing.lifecycleState === STATES.READY_FOR_SUBMISSION) {
                return {
                    success: true,
                    message: 'Payment gate already cleared',
                    filing
                };
            }

            // Validate current state
            if (filing.lifecycleState !== STATES.DRAFT) {
                throw new AppError(
                    `Cannot clear payment gate from state: ${filing.lifecycleState}`,
                    400
                );
            }

            // Check payment gate
            const gateStatus = await this.checkPaymentGate(filingId);
            if (!gateStatus.cleared) {
                throw new AppError(
                    `Payment gate not cleared: ${gateStatus.reason}`,
                    403,
                    'PAYMENT_GATE_NOT_CLEARED'
                );
            }

            // Transition to ready_for_submission
            await SubmissionStateMachine.transition(
                filing,
                STATES.READY_FOR_SUBMISSION,
                { userId, role: 'END_USER' }
            );

            await filing.save();

            enterpriseLogger.info('Payment gate cleared', {
                filingId,
                userId,
                liability: gateStatus.liability,
                paid: gateStatus.paid
            });

            return {
                success: true,
                message: 'Payment gate cleared. Filing ready for submission.',
                filing,
                gateStatus
            };
        } catch (error) {
            enterpriseLogger.error('Failed to clear payment gate', {
                filingId,
                userId,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Get payment gate status for user display
     * @param {string} filingId - Filing ID
     * @returns {Promise<Object>} User-friendly status
     */
    async getPaymentGateStatus(filingId) {
        try {
            const gateStatus = await this.checkPaymentGate(filingId);

            return {
                success: true,
                gate: {
                    cleared: gateStatus.cleared,
                    message: this.formatUserMessage(gateStatus),
                    liability: gateStatus.liability,
                    paid: gateStatus.paid,
                    remaining: Math.max(0, gateStatus.liability - gateStatus.paid),
                    breakdown: gateStatus.breakdown
                }
            };
        } catch (error) {
            enterpriseLogger.error('Failed to get payment gate status', {
                filingId,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Calculate total from payment array
     * @param {Array} payments - Array of payment objects
     * @returns {Number} Total amount
     */
    calculatePaymentTotal(payments) {
        if (!Array.isArray(payments)) return 0;

        return payments
            .filter(p => p.verified !== false) // Only count verified payments
            .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    }

    /**
     * Format user-friendly message
     * @param {Object} gateStatus - Gate status object
     * @returns {string} User message
     */
    formatUserMessage(gateStatus) {
        if (gateStatus.cleared) {
            return `Payment verified. Tax liability of ₹${gateStatus.liability.toFixed(2)} has been paid.`;
        }

        const remaining = gateStatus.liability - gateStatus.paid;
        return `Payment required. You have tax payable: ₹${gateStatus.liability.toFixed(2)}. Paid: ₹${gateStatus.paid.toFixed(2)}. Remaining: ₹${remaining.toFixed(2)}.`;
    }
}

module.exports = new PaymentGateService();
