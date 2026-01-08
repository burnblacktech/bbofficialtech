/**
 * CARequestInfoService.js
 * V3.3 CA Feedback Loop
 */

const { sequelize } = require('../../config/database');
const ITRFiling = require('../../models/ITRFiling');
const { v4: uuidv4 } = require('uuid');

class CARequestInfoService {

    /**
     * Create a Request for Information
     * @param {String} filingId 
     * @param {Object} payload { reason, category, blocking }
     * @param {Object} caUser 
     */
    async createRequest(filingId, { reason, category, blocking }, caUser) {

        const transaction = await sequelize.transaction();
        try {
            // 1. Fetch Filing
            const filing = await ITRFiling.findOne({ where: { id: filingId }, transaction });
            if (!filing) throw new Error('Filing not found');

            // 2. Validate Access (Firm Scope)
            if (filing.firmId && caUser.caFirmId && filing.firmId !== caUser.caFirmId) {
                throw new Error('Access Denied');
            }

            // 3. Prepare Request Object
            const requestItem = {
                id: uuidv4(),
                createdAt: new Date().toISOString(),
                raisedBy: caUser.id,
                raisedByName: `${caUser.firstName} ${caUser.lastName}`,
                reason,
                category, // DOCUMENT, CLARIFICATION, INCOME
                blocking: blocking === true,
                status: 'PENDING' // PENDING | RESOLVED
            };

            // 4. Update JSONB (Append to tax_computation.caContext.requests)
            let taxComp = filing.taxComputation || {};
            if (!taxComp.caContext) taxComp.caContext = {};
            if (!taxComp.caContext.requests) taxComp.caContext.requests = [];

            taxComp.caContext.requests.push(requestItem);

            // 5. Update Status -> ACTION_REQUIRED
            // Only update status if it's currently IN_REVIEW or similar (or any active CA state)
            // We force it to ACTION_REQUIRED to notify user.

            // Use state machine for canonical transition
            const SubmissionStateMachine = require('../../domain/SubmissionStateMachine');
            const STATES = require('../../domain/SubmissionStates');

            SubmissionStateMachine.transition(filing, STATES.ACTION_REQUIRED);
            filing.taxComputation = taxComp;
            await filing.save({ transaction });

            await transaction.commit();

            return {
                success: true,
                requestId: requestItem.id,
                filingStatus: 'ACTION_REQUIRED'
            };

        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    async resolveRequest(filingId, requestId, userId) {
        // Logic to mark request as RESOLVED
        // Fetch filing, find request in taxComputation.caContext.requests, update status
        const filing = await ITRFiling.findOne({ where: { id: filingId } });
        if (!filing || filing.userId !== userId) throw new Error('Not found or access denied');

        let taxComp = filing.taxComputation || {};
        if (!taxComp.caContext || !taxComp.caContext.requests) throw new Error('No requests found');

        const requests = taxComp.caContext.requests;
        const reqIndex = requests.findIndex(r => r.id === requestId);

        if (reqIndex === -1) throw new Error('Request not found');

        requests[reqIndex].status = 'RESOLVED';
        requests[reqIndex].resolvedAt = new Date().toISOString();

        // Check if ALL blocking requests are resolved
        const hasPendingBlocking = requests.some(r => r.blocking && r.status !== 'RESOLVED');

        const SubmissionStateMachine = require('../../domain/SubmissionStateMachine');
        const STATES = require('../../domain/SubmissionStates');

        let newStatus = filing.lifecycleState;
        if (!hasPendingBlocking && filing.lifecycleState === 'ACTION_REQUIRED') {
            newStatus = 'READY_TO_FILE'; // Or return to previous state?
        }

        // Update DB
        // We need to use update with changed object
        await ITRFiling.update({
            taxComputation: { ...taxComp }, // Ensure generic update
            lifecycleState: newStatus
        }, { where: { id: filingId } });

        return { success: true, status: newStatus };
    }
}

module.exports = new CARequestInfoService();
