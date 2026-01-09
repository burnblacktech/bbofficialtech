/**
 * AdminRescueService.js
 * "Break Glass" tooling for Operators.
 */

const { sequelize } = require('../../config/database');
const ITRFiling = require('../../models/ITRFiling');
const AuditService = require('../core/AuditService');
const SubmissionStateMachine = require('../../domain/SubmissionStateMachine');
const STATES = require('../../domain/SubmissionStates');

class AdminRescueService {

    /**
     * Force fail a stuck submission.
     * @param {string} filingId 
     * @param {string} reason 
     * @param {string} adminId 
     */
    async forceFail(filingId, reason, adminId) {
        const transaction = await sequelize.transaction();
        try {
            const filing = await ITRFiling.findOne({ where: { id: filingId }, transaction });
            if (!filing) throw new Error('Not found');

            const oldStatus = filing.lifecycleState;

            // Allow Force Transition even if State Machine would complain?
            // V4 Rules: We prefer using State Machine, but this is Rescue.
            // State Machine likely forbids arbitrary moves unless we add admin bypass.
            // For now, assume ERI_IN_PROGRESS -> ERI_FAILED is valid.

            SubmissionStateMachine.transition(filing, STATES.ERI_FAILED);

            await AuditService.logTransition(filingId, oldStatus, STATES.ERI_FAILED, adminId, 'ADMIN', transaction);

            filing.rejectionReason = `Admin Force Fail: ${reason}`;
            await filing.save({ transaction });

            await transaction.commit();
            return { success: true };
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Force Retry (Back to Resume state)
     * Limit: Can only retry if failed or stuck.
     */
    async forceRetry(filingId, adminId) {
        const transaction = await sequelize.transaction();
        try {
            const filing = await ITRFiling.findOne({ where: { id: filingId }, transaction });
            // Logic: Move back to CA_APPROVED so it can be picked up again?
            // Or move to SUBMITTED_TO_CA?

            // Let's move to CA_APPROVED, so CA/System can re-trigger submitToITD.
            const oldStatus = filing.lifecycleState;

            // Use state machine for proper transition validation
            SubmissionStateMachine.transition(filing, STATES.CA_APPROVED);
            filing.ackNumber = null;
            filing.rejectionReason = null;

            await AuditService.logTransition(filingId, oldStatus, STATES.CA_APPROVED, adminId, 'ADMIN', transaction);

            await filing.save({ transaction });
            await transaction.commit();

            return { success: true, message: 'Filing reset to CA_APPROVED. Please re-trigger submission.' };

        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }
}

module.exports = new AdminRescueService();
