// =====================================================
// ERI OUTCOME SERVICE (S25)
// Pure projection helpers for submission outcome
// Maps lifecycle states to user-facing status
// Frozen v1 API Contract
// =====================================================

const { ITRFiling, ERISubmissionAttempt } = require('../models');
const FilingSnapshotService = require('./itr/FilingSnapshotService');
const ITRApplicabilityService = require('./ITRApplicabilityService');

/**
 * ERI Outcome Service (S25)
 * 
 * Pure projection functions to transform ERI submission state
 * into user-facing submission outcomes.
 * 
 * No mutations, no retries, just status projection.
 * Frozen v1 API contract.
 */
class ERIOutcomeService {
    /**
     * Get submission status for a filing
     * Returns frozen v1 API contract
     */
    static async getSubmissionStatus(filingId) {
        const filing = await ITRFiling.findByPk(filingId);
        if (!filing) {
            throw new Error('Filing not found');
        }

        const attempts = await ERISubmissionAttempt.findAll({
            where: { filingId },
            order: [['createdAt', 'DESC']]
        });

        const snapshot = await FilingSnapshotService.getLatestSnapshot(filingId);
        const applicability = ITRApplicabilityService.evaluate(filing);

        const statusData = this.deriveStatus(filing.lifecycleState, attempts);
        const userMessage = this.getNarrativeMessage(statusData.state);

        return {
            meta: {
                filingId: filing.id,
                snapshotId: snapshot?.id || null,
                submittedAt: filing.submittedAt || filing.updatedAt,
                lastUpdatedAt: filing.updatedAt
            },
            status: {
                state: statusData.state,
                label: statusData.label,
                confidence: statusData.confidence
            },
            eri: {
                attempts: attempts.length,
                lastAttemptAt: attempts[0]?.createdAt || null,
                nextRetryAt: this.calculateNextRetryETA(attempts[0], attempts.length),
                acknowledgementRef: filing.acknowledgmentNumber || null
            },
            userMessage: {
                headline: userMessage.headline,
                body: userMessage.body
            },
            actions: {
                downloadJson: !!snapshot,
                retryAllowed: false, // Always false - system-owned
                contactCA: applicability.caRequired === 'mandatory'
            }
        };
    }

    /**
     * Derive status from lifecycle state
     */
    static deriveStatus(lifecycleState, attempts = []) {
        const MAX_RETRIES = 3;

        switch (lifecycleState) {
            case 'submitted_to_eri':
                return {
                    state: 'IN_PROGRESS',
                    label: 'Submitted',
                    confidence: 'high'
                };

            case 'eri_success':
                return {
                    state: 'SUCCESS',
                    label: 'Filed Successfully',
                    confidence: 'high'
                };

            case 'eri_failed':
                if (attempts.length < MAX_RETRIES) {
                    return {
                        state: 'RETRYING',
                        label: 'Retrying Submission',
                        confidence: 'medium'
                    };
                }
                return {
                    state: 'FAILED',
                    label: 'Submission Failed',
                    confidence: 'high'
                };

            default:
                return {
                    state: 'NOT_SUBMITTED',
                    label: 'Not Submitted',
                    confidence: 'high'
                };
        }
    }

    /**
     * Get narrative message for state
     * Trust-preserving language, not deflection
     */
    static getNarrativeMessage(state) {
        const messages = {
            'IN_PROGRESS': {
                headline: 'Your return has been submitted',
                body: "We've securely sent your return to the Income Tax Department. No action is required from you right now."
            },
            'RETRYING': {
                headline: "We're retrying your submission",
                body: "The tax portal didn't respond as expected. We're retrying automatically — your data is safe."
            },
            'SUCCESS': {
                headline: 'Your return has been filed successfully',
                body: 'Your income tax return has been accepted. You can download a copy for your records.'
            },
            'FAILED': {
                headline: "We couldn't submit your return",
                body: "This usually happens due to portal or data issues. You can download your return and file manually, or request CA help."
            },
            'NOT_SUBMITTED': {
                headline: 'Not yet submitted',
                body: 'Your return has not been submitted yet.'
            }
        };

        return messages[state] || messages['NOT_SUBMITTED'];
    }

    /**
     * Calculate next retry ETA based on exponential backoff
     */
    static calculateNextRetryETA(lastAttempt, retryCount) {
        if (!lastAttempt || retryCount >= 3) {
            return null; // No more retries
        }

        // Exponential backoff: 5min, 15min, 30min
        const backoffMinutes = [5, 15, 30];
        const delayMinutes = backoffMinutes[retryCount - 1] || 30;

        const lastAttemptTime = new Date(lastAttempt.createdAt);
        const nextRetry = new Date(lastAttemptTime.getTime() + delayMinutes * 60 * 1000);

        return nextRetry.toISOString();
    }
}

module.exports = ERIOutcomeService;
