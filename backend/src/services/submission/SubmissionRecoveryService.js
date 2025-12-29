/**
 * SubmissionRecoveryService.js
 * V4.4 - Resilience Orchestrator
 * Monitors, diagnoses, and heals failed/stuck filings.
 */

const { sequelize } = require('../../config/database');
const ITRFiling = require('../../models/ITRFiling');
const SubmissionStateMachine = require('../../domain/SubmissionStateMachine');
const STATES = require('../../domain/SubmissionStates');
const AuditService = require('../core/AuditService');
const RecoveryStrategyFactory = require('./RecoveryStrategyFactory');
const SubmissionWorker = require('../../workers/SubmissionWorker');

class SubmissionRecoveryService {

    /**
     * Recover a specific filing based on its failure state.
     * @param {string} filingId 
     */
    async recover(filingId) {
        console.log(`[RecoveryService] Attempting recovery for ${filingId}`);
        const transaction = await sequelize.transaction();

        try {
            const filing = await ITRFiling.findOne({
                where: { id: filingId },
                lock: transaction.LOCK.UPDATE,
                transaction
            });

            if (!filing) throw new Error('Filing not found');

            // 1. Get Failure Context
            const failureReason = filing.rejectionReason || 'Unknown';
            // Store retryCount in jsonPayload to avoid schema change
            const payload = filing.jsonPayload || {};
            const retryCount = payload.retryCount || 0;

            // 2. Get Strategy
            const strategy = RecoveryStrategyFactory.getStrategy(failureReason, retryCount);
            console.log(`[RecoveryService] Strategy selected: ${strategy.action} (${strategy.reason})`);

            await AuditService.log({
                entityType: 'ITR_FILING',
                entityId: filingId,
                action: 'RECOVERY_ATTEMPT',
                actorId: 'SYSTEM',
                payload: { strategy, retryCount }
            }, transaction);

            // 3. Execute Strategy
            if (strategy.action === 'RETRY') {
                if (retryCount >= strategy.maxRetries) {
                    console.warn(`[RecoveryService] Max retries exhausted for ${filingId}`);
                    // Fallback to escalation
                    await this._escalate(filing, 'ERI_FAILED', 'Max Retries Exhausted', transaction);
                } else {
                    // Perform Retry
                    const nextRetry = retryCount + 1;

                    // Update Payload with new retry count
                    const newPayload = { ...payload, retryCount: nextRetry };
                    filing.jsonPayload = newPayload;
                    filing.changed('jsonPayload', true); // Force update

                    // Transition back to ERI_IN_PROGRESS to trigger Worker?
                    // Actually, if we just set ERI_IN_PROGRESS, we need something to Kick the worker.
                    // Or we explicitly call worker here?
                    // Better to reset state to 'ERI_IN_PROGRESS' (or equiv) and let the worker pick it up (or explicit invoke).

                    // We need a valid transition for this. ERI_FAILED -> ERI_IN_PROGRESS
                    await SubmissionStateMachine.transition(filing, STATES.ERI_IN_PROGRESS);

                    await filing.save({ transaction });
                    await transaction.commit();

                    // Async kick the worker
                    SubmissionWorker.processSubmission(filingId);
                    return { status: 'RETRYING', retryCount: nextRetry };
                }
            } else if (strategy.action === 'ESCALATE') {
                await this._escalate(filing, strategy.targetState, strategy.reason, transaction);
            }

            if (!transaction.finished) await transaction.commit();
            return { status: 'ESCALATED', targetState: strategy.targetState };

        } catch (error) {
            if (!transaction.finished) await transaction.rollback();
            console.error('[RecoveryService] Recovery Failed:', error);
            throw error;
        }
    }

    async _escalate(filing, targetState, reason, transaction) {
        // Move to a state requiring human intervention
        await SubmissionStateMachine.transition(filing, targetState);
        filing.rejectionReason = reason; // Update with final reason
        await filing.save({ transaction });

        await AuditService.log({
            entityType: 'ITR_FILING',
            entityId: filing.id,
            action: 'RECOVERY_ESCALATED',
            actorId: 'SYSTEM',
            payload: { reason, targetState }
        }, transaction);

        console.log(`[RecoveryService] Filing ${filing.id} escalated to ${targetState}`);
    }

    /**
     * Stale Detection Scan
     * Finds filings stuck in ERI_IN_PROGRESS for too long (e.g., worker crash).
     */
    async scanForStaleFilings(thresholdMinutes = 15) {
        // Implementation for Cron Job
        // Find filings in ERI_IN_PROGRESS updated_at < NOW - threshold
        // Mark them as FAILED (or attempt retry directly)
        // For V4 MVP, we'll leave this as a placeholder or manual trigger.
        console.log('[RecoveryService] Scanning for stale filings...');
    }
}

module.exports = new SubmissionRecoveryService();
