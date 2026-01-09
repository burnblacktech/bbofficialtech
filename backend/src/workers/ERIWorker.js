// =====================================================
// ERI WORKER (S21)
// Async executor - polls submitted_to_eri, enforces retry policy
// Constitutional: state machine sole authority, snapshot used, idempotent
// =====================================================

const { ITRFiling } = require('../models');
const ERISubmissionAttempt = require('../models/ERISubmissionAttempt');
const ERISubmissionService = require('../services/eri/ERISubmissionService');
const SubmissionStateMachine = require('../domain/SubmissionStateMachine');
const STATES = require('../domain/SubmissionStates');
const enterpriseLogger = require('../utils/logger');

const MAX_ATTEMPTS = 5;

class ERIWorker {
    /**
     * Run one polling cycle
     * Processes all filings in submitted_to_eri state
     */
    static async runOnce() {
        try {
            const filings = await ITRFiling.findAll({
                where: { lifecycleState: STATES.SUBMITTED_TO_ERI }
            });

            enterpriseLogger.info('ERI Worker polling', {
                pendingFilings: filings.length
            });

            for (const filing of filings) {
                try {
                    await this.processFiling(filing);
                } catch (error) {
                    enterpriseLogger.error('ERI Worker filing processing error', {
                        filingId: filing.id,
                        error: error.message
                    });
                }
            }
        } catch (error) {
            enterpriseLogger.error('ERI Worker polling error', {
                error: error.message
            });
        }
    }

    /**
     * Process single filing
     * @param {ITRFiling} filing
     */
    static async processFiling(filing) {
        // Get or create attempt record
        const attempt = await ERISubmissionAttempt.getOrCreateActive(filing.id);

        // Check if max attempts reached
        if (attempt.attemptNumber > MAX_ATTEMPTS) {
            enterpriseLogger.warn('Max ERI attempts reached', {
                filingId: filing.id,
                attempts: attempt.attemptNumber
            });

            // Transition to eri_failed
            await SubmissionStateMachine.transition(
                filing,
                STATES.ERI_FAILED,
                { userId: 'system', role: 'SYSTEM' }
            );
            await filing.save();

            await attempt.update({ status: 'terminal_failure', errorCode: 'MAX_ATTEMPTS_EXCEEDED' });
            return;
        }

        // Check if retry is due
        if (attempt.nextAttemptAt && new Date() < attempt.nextAttemptAt) {
            enterpriseLogger.debug('ERI retry not yet due', {
                filingId: filing.id,
                nextAttemptAt: attempt.nextAttemptAt
            });
            return;
        }

        // Get latest snapshot (constitutional: use snapshot, not live filing)
        const snapshot = filing.snapshots?.slice(-1)[0];
        if (!snapshot) {
            enterpriseLogger.error('No snapshot available for ERI submission', {
                filingId: filing.id
            });
            throw new Error('No snapshot available for ERI submission');
        }

        enterpriseLogger.info('Submitting to ERI', {
            filingId: filing.id,
            attemptNumber: attempt.attemptNumber,
            taxpayerPan: snapshot.taxpayerPan
        });

        // Submit to ERI (pure function, no side effects)
        const result = await ERISubmissionService.submit(snapshot);

        // Record result in attempt
        await attempt.recordResult(result);

        // Handle outcome via state machine (constitutional authority)
        if (result.outcome === 'SUCCESS') {
            enterpriseLogger.info('ERI submission successful', {
                filingId: filing.id,
                referenceId: result.referenceId
            });

            await SubmissionStateMachine.transition(
                filing,
                STATES.ERI_SUCCESS,
                { userId: 'system', role: 'SYSTEM' }
            );
            await filing.save();
            return;
        }

        if (result.outcome === 'TERMINAL_FAILURE') {
            enterpriseLogger.error('ERI submission terminal failure', {
                filingId: filing.id,
                errorCode: result.errorCode
            });

            await SubmissionStateMachine.transition(
                filing,
                STATES.ERI_FAILED,
                { userId: 'system', role: 'SYSTEM' }
            );
            await filing.save();
            return;
        }

        // RETRYABLE_FAILURE: do nothing to lifecycle
        // Next poll will retry after backoff
        enterpriseLogger.info('ERI submission retryable failure, will retry', {
            filingId: filing.id,
            nextAttemptAt: attempt.nextAttemptAt,
            attemptNumber: attempt.attemptNumber
        });
    }

    /**
     * Start worker with polling interval
     * @param {number} intervalMs - Polling interval in milliseconds (default: 30s)
     */
    static start(intervalMs = 30000) {
        enterpriseLogger.info('Starting ERI Worker', {
            intervalMs
        });

        // Run immediately
        this.runOnce();

        // Then poll at interval
        setInterval(() => {
            this.runOnce();
        }, intervalMs);
    }
}

module.exports = ERIWorker;
