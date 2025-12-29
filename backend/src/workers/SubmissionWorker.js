/**
 * SubmissionWorker.js
 * V4.3 - Async Submission Processor
 * 
 * Handles the "heavy lifting" of talking to ITD.
 * Isolate this from the request-response cycle to prevent timeouts.
 */

const { sequelize } = require('../config/database');
const ITRFiling = require('../models/ITRFiling');
const SubmissionStateMachine = require('../domain/SubmissionStateMachine');
const STATES = require('../domain/SubmissionStates');
const AuditService = require('../services/core/AuditService');
const ERIGateway = require('../gateways/ERIGatewayAdapter');

class SubmissionWorker {

    /**
     * Process a single filing submission
     * @param {String} filingId 
     */
    async processSubmission(filingId) {
        console.log(`[Worker] Picking up job for ${filingId}`);
        const transaction = await sequelize.transaction();

        try {
            // 1. Lock Filing
            const filing = await ITRFiling.findOne({
                where: { id: filingId },
                lock: transaction.LOCK.UPDATE, // DB Row Lock
                transaction
            });

            if (!filing) throw new Error('Filing not found');

            // Sanity Check: specific to V4.3 async flow
            // If worker picks it up, it MUST be in ERI_IN_PROGRESS (set by Controller)
            // Or controller sets CA_APPROVED and worker moves it to ERI_IN_PROGRESS?
            // User plan: "Controller sets ERI_IN_PROGRESS -> Worker picks up"
            if (filing.status !== STATES.ERI_IN_PROGRESS) {
                console.warn(`[Worker] Filing ${filingId} is in ${filing.status}, expected ERI_IN_PROGRESS. Skipping.`);
                await transaction.commit();
                return;
            }

            // 2. Prepare Payload
            const payload = filing.jsonPayload || {};
            // Generate checksum (mock)
            const checksum = 'SHA256_MOCK_' + filingId;

            // 3. Call ERI (The Risky Part)
            // We do this INSIDE the transaction? 
            // NO. Network calls inside DB transactions are bad (hold locks too long).
            // But we need to update state atomically.
            // pattern: 
            //   State: IN_PROGRESS (Committed)
            //   Network Call (No DB Lock)
            //   State: SUCCESS/FAIL (New Transaction)

            // So we commit the Lock first? 
            // Actually, we don't need to hold the lock during the network call if we rely on the state `ERI_IN_PROGRESS` as a lock itself.
            // Let's verify we are the only one processing.
            // Ideally we'd have a `jobId`. For now `status` is sufficient lock.
            await transaction.commit(); // Release DB lock before network call

            // 4. Perform Network Call
            let eriResponse;
            try {
                // Log attempt
                await AuditService.log({
                    entityType: 'ITR_FILING',
                    entityId: filingId,
                    action: 'ERI_CALL_START',
                    actorId: 'SYSTEM',
                    payload: { gateway: 'ITD' }
                }); // Auto-transaction internally

                eriResponse = await ERIGateway.submitITR(payload, checksum);

            } catch (networkError) {
                console.error(`[Worker] Network Failure for ${filingId}:`, networkError.message);

                // Handle Failure
                await this._handleFailure(filingId, networkError.message);
                return;
            }

            // 5. Handle Success
            await this._handleSuccess(filingId, eriResponse);

        } catch (error) {
            // Catch setup errors
            if (!transaction.finished) await transaction.rollback();
            console.error('[Worker] Validaton/Setup Error:', error);
            // If critical, maybe mark FAILED?
        }
    }

    async _handleSuccess(filingId, eriResponse) {
        const t = await sequelize.transaction();
        try {
            const filing = await ITRFiling.findOne({ where: { id: filingId }, transaction: t });

            // 5a. ACK Received
            SubmissionStateMachine.transition(filing, STATES.ERI_ACK_RECEIVED);
            await AuditService.logTransition(filingId, STATES.ERI_IN_PROGRESS, STATES.ERI_ACK_RECEIVED, 'SYSTEM', 'SYSTEM', t);

            // Log raw ERI response evidence
            await AuditService.log({
                entityType: 'ITR_FILING',
                entityId: filingId,
                action: 'ERI_RESPONSE_RAW',
                actorId: 'ITD', // External Actor
                payload: eriResponse
            }, t);

            // 5b. Filed
            SubmissionStateMachine.transition(filing, STATES.FILED);
            await AuditService.logTransition(filingId, STATES.ERI_ACK_RECEIVED, STATES.FILED, 'SYSTEM', 'SYSTEM', t);

            filing.ackNumber = eriResponse.ackNumber;
            filing.filedAt = new Date();

            await filing.save({ transaction: t });
            await t.commit();
            console.log(`[Worker] Filing ${filingId} successfully FILED. Ack: ${eriResponse.ackNumber}`);

        } catch (e) {
            await t.rollback();
            console.error('[Worker] Success Handler Failed (Critical):', e);
            // This is bad - we have ACK but failed to save it. 
            // Retry logic would go here.
        }
    }

    async _handleFailure(filingId, reason) {
        const t = await sequelize.transaction();
        try {
            const filing = await ITRFiling.findOne({ where: { id: filingId }, transaction: t });

            SubmissionStateMachine.transition(filing, STATES.ERI_FAILED);
            await AuditService.logTransition(filingId, STATES.ERI_IN_PROGRESS, STATES.ERI_FAILED, 'SYSTEM', 'SYSTEM', t);

            // Save failure reason in metadata or audit?
            // Usually audit is enough, but UI needs to show it.
            // Using `rejectionReason` field for visibility.
            filing.rejectionReason = reason;

            await filing.save({ transaction: t });
            await t.commit();
            console.log(`[Worker] Filing ${filingId} marked ERI_FAILED.`);

        } catch (e) {
            await t.rollback();
            console.error('[Worker] Failure Handler Failed:', e);
        }
    }
}

module.exports = new SubmissionWorker();
