/**
 * SubmissionStateMachine.js
 * V4.1 - Centralized State Transition Logic
 * Enforces the "Regulator-Defensible" state graph.
 */

const STATES = require('./SubmissionStates');

// Valid Transitions Graph
const TRANSITIONS = {
    [STATES.DRAFT]: [STATES.READY_TO_FILE, STATES.DRAFT], // Self-loops allowed for saves
    [STATES.READY_TO_FILE]: [STATES.SUBMITTED_TO_CA, STATES.DRAFT, STATES.ACTION_REQUIRED], // ACTION_REQUIRED if CA request exists (handled elsewhere usually but valid)

    // CA Loop
    [STATES.SUBMITTED_TO_CA]: [STATES.CA_APPROVED, STATES.ACTION_REQUIRED, STATES.CANCELLED],
    [STATES.ACTION_REQUIRED]: [STATES.READY_TO_FILE, STATES.SUBMITTED_TO_CA], // User resolves -> Ready/Submitted

    // ERI Pipeline
    [STATES.CA_APPROVED]: [STATES.ERI_IN_PROGRESS, STATES.CANCELLED],
    [STATES.ERI_IN_PROGRESS]: [STATES.ERI_ACK_RECEIVED, STATES.ERI_FAILED],
    [STATES.ERI_ACK_RECEIVED]: [STATES.FILED],

    // Recoverable Failure
    [STATES.ERI_FAILED]: [STATES.ERI_IN_PROGRESS, STATES.CANCELLED], // Retry or Cancel

    // Terminal
    [STATES.FILED]: [], // End of line (unless amended? V5)
    [STATES.CANCELLED]: [STATES.DRAFT] // Reset?
};

class SubmissionStateMachine {

    /**
     * assertTransition
     * Throws error if transition is illegal.
     */
    assertTransition(currentStatus, targetStatus) {
        // Allow same-state transitions (idempotency)? 
        // Strict state machine usually allows self-loop only if explicit.
        if (currentStatus === targetStatus) return;

        const allowed = TRANSITIONS[currentStatus] || [];
        if (!allowed.includes(targetStatus)) {
            const error = new Error(`Illegal State Transition: ${currentStatus} -> ${targetStatus}`);
            error.statusCode = 400;
            error.code = 'INVALID_TRANSITION';
            throw error;
        }
    }

    /**
     * transition
     * Mutates the filing object (in memory) and validates.
     * Does NOT save to DB (Service layer responsibility).
     * @param {Object} filing - Sequelize instance or object
     * @param {String} targetStatus 
     * @returns {Object} filing
     */
    transition(filing, targetStatus) {
        if (!filing.status) throw new Error('Filing object missing status');

        this.assertTransition(filing.status, targetStatus);

        const previousStatus = filing.status;
        filing.status = targetStatus;

        // V4.2 Audit Hook (Placeholder)
        // console.log(`[Audit] State Change: ${previousStatus} -> ${targetStatus}`);

        return filing;
    }

    // Helper to get next allowed states
    getAllowedNextStates(currentStatus) {
        return TRANSITIONS[currentStatus] || [];
    }
}

module.exports = new SubmissionStateMachine();
