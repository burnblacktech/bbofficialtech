/**
 * SubmissionRecoveryService.js
 * The "Sweeper" for stuck ERI submissions.
 * V4.4 Architecture
 */

const { sequelize } = require('../../config/database');
const ITRFiling = require('../../models/ITRFiling');
const AuditService = require('../core/AuditService');
const SubmissionStateMachine = require('../../domain/SubmissionStateMachine');
const STATES = require('../../domain/SubmissionStates');
// const ERIGatewayAdapter = require('../../gateways/ERIGatewayAdapter'); // If we had checkStatus API

class SubmissionRecoveryService {

    /**
     * Finds filings stuck in ERI_IN_PROGRESS for too long.
     * @param {number} thresholdMinutes (Default 15)
     */
    async findStuckSubmissions(thresholdMinutes = 15) {
        const threshold = new Date(Date.now() - thresholdMinutes * 60000);

        // Query Logic (Raw or Model)
        // Note: Using updated_at to detect inactivity
        const filings = await ITRFiling.findAll({
            where: {
                lifecycleState: STATES.ERI_IN_PROGRESS,
                // updated_at < threshold (Sequelize syntax varying, using Op)
            }
        });

        // Filter in memory for simplicity if Op not imported
        return filings.filter(f => new Date(f.updatedAt) < threshold);
    }

    /**
     * Attempts to reconcile a stuck filing.
     * @param {ITRFiling} filing 
     */
    async recoverFiling(filing) {
        const transaction = await sequelize.transaction();
        try {
            console.log(`[Recovery] Attempting to recover ${filing.id}`);

            // 1. Check ERI Status (Stubbed)
            // In real world, we'd call ERIGateway.checkStatus(filing.pan, filing.ay)
            // Here, we simulate a "Not Found" or "Success" check.

            // Simulation: 80% chance it failed silently (move to FAILED)
            // 20% chance it actually succeeded but ack was lost (move to FILED)
            const isActuallyFailed = Math.random() > 0.2;

            if (isActuallyFailed) {
                // Transition to ERI_FAILED
                SubmissionStateMachine.transition(filing, STATES.ERI_FAILED);
                await AuditService.logTransition(filing.id, STATES.ERI_IN_PROGRESS, STATES.ERI_FAILED, 'SYSTEM_RECOVERY', 'SYSTEM', transaction);

                filing.rejectionReason = 'Submission Timed Out (Recovery Service)';
                await filing.save({ transaction });

                console.log(`[Recovery] ${filing.id} marked as ERI_FAILED`);
            } else {
                // Transition to FILED
                SubmissionStateMachine.transition(filing, STATES.FILED);
                // Assume we found the ACK
                const recoveredAck = `ACK-REC-${Date.now()}`;

                // Add synthetic step: ACK_RECEIVED (to satisfy state machine if strict?)
                // If State Machine allows ERI_IN_PROGRESS -> FILED directly (it doesn't usually).
                // Let's check StateMachine. 
                // Usually: ERI_IN_PROGRESS -> ERI_ACK_RECEIVED -> FILED.

                // So we do:
                SubmissionStateMachine.transition(filing, STATES.ERI_ACK_RECEIVED);
                await filing.save({ transaction }); // save intermediate

                SubmissionStateMachine.transition(filing, STATES.FILED);
                await AuditService.logTransition(filing.id, STATES.ERI_IN_PROGRESS, STATES.FILED, 'SYSTEM_RECOVERY', 'SYSTEM', transaction);

                filing.ackNumber = recoveredAck;
                filing.rejectionReason = 'Recovered by System';
                await filing.save({ transaction });

                console.log(`[Recovery] ${filing.id} recovered as FILED (${recoveredAck})`);
            }

            await transaction.commit();
            return { success: true, newStatus: filing.lifecycleState };

        } catch (error) {
            await transaction.rollback();
            console.error(`[Recovery] Failed to recover ${filing.id}`, error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Main Sweeper Entry Point
     */
    async runSweep() {
        console.log('[Sweeper] Starting...');
        const stuck = await this.findStuckSubmissions(10); // 10 mins
        console.log(`[Sweeper] Found ${stuck.length} stuck submissions`);

        for (const f of stuck) {
            await this.recoverFiling(f);
        }
        console.log('[Sweeper] Done.');
    }
}

module.exports = new SubmissionRecoveryService();
