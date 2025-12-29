/**
 * CAApprovalService.js
 * V3.4 Authority Logic
 */

const { sequelize } = require('../../config/database');
const ITRFiling = require('../../models/ITRFiling');
const SubmissionStateMachine = require('../../domain/SubmissionStateMachine');
const STATES = require('../../domain/SubmissionStates');
const AuditService = require('../core/AuditService');

class CAApprovalService {

    /**
     * User submits filing to CA
     * @param {String} filingId 
     * @param {String} userId 
     */
    async submitToCA(filingId, userId) {
        const transaction = await sequelize.transaction();
        try {
            const filing = await ITRFiling.findOne({ where: { id: filingId }, transaction });

            if (!filing || filing.userId !== userId) throw new Error('Not found or access denied');

            // Check blocking requests
            const caContext = (filing.taxComputation || {}).caContext || {};
            const requests = caContext.requests || [];
            const hasBlocking = requests.some(r => r.blocking && r.status !== 'RESOLVED');

            if (hasBlocking) {
                throw new Error('Cannot submit to CA with unresolved blocking issues');
            }

            const oldStatus = filing.status;

            // V4.1 State Machine Enforcement
            SubmissionStateMachine.transition(filing, STATES.SUBMITTED_TO_CA);

            await filing.save({ transaction });

            // V4.2 Audit
            await AuditService.logTransition(
                filing.id,
                oldStatus,
                STATES.SUBMITTED_TO_CA,
                userId,
                'USER',
                transaction
            );

            await transaction.commit();
            return { success: true, status: filing.status };

        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * CA submits filing to ITD
     * V4.3: Async Submission Pattern (V4.1 State Machine + V4.2 Audit)
     * 1. Updates state to ERI_IN_PROGRESS
     * 2. Triggers Background Worker
     * 3. Returns immediately
     * @param {String} filingId 
     * @param {Object} caUser 
     */
    async submitToITD(filingId, caUser) {
        const transaction = await sequelize.transaction();
        try {
            const filing = await ITRFiling.findOne({ where: { id: filingId }, transaction });

            if (!filing) throw new Error('Not found');

            // Validate Firm Access
            if (filing.firmId && caUser.caFirmId && filing.firmId !== caUser.caFirmId) {
                throw new Error('Access Denied');
            }

            const initialStatus = filing.status;

            // V4.1: State Machine Pipeline
            // 1. CA Approves
            SubmissionStateMachine.transition(filing, STATES.CA_APPROVED);
            await AuditService.logTransition(filingId, initialStatus, STATES.CA_APPROVED, caUser.id, 'CA', transaction);

            // 2. Start ERI (Set State to ERI_IN_PROGRESS)
            SubmissionStateMachine.transition(filing, STATES.ERI_IN_PROGRESS);
            await AuditService.logTransition(filingId, STATES.CA_APPROVED, STATES.ERI_IN_PROGRESS, 'SYSTEM', 'SYSTEM', transaction);

            // Commit state change so worker can see it
            await filing.save({ transaction });
            await transaction.commit();

            // 3. Trigger Background Worker (Fire & Forget)
            const SubmissionWorker = require('../../workers/SubmissionWorker');
            // Background execution
            SubmissionWorker.processSubmission(filingId).catch(err => {
                console.error(`[Background] Worker trigger failed for ${filingId}`, err);
            });

            return { success: true, status: STATES.ERI_IN_PROGRESS, message: 'Submission Initiated' };

        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }
}

module.exports = new CAApprovalService();
