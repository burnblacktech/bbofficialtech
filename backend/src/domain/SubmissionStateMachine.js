/**
 * SubmissionStateMachine.js
 * S19 - Constitutional Authority for Lifecycle Transitions
 * Enforces snapshot creation, freeze rules, and actor authority
 */

const STATES = require('./SubmissionStates');
const enterpriseLogger = require('../utils/logger');
const FilingSnapshotService = require('../services/itr/FilingSnapshotService');
const { AppError } = require('../middleware/errorHandler');

// Valid Transitions Graph (Canonical)
const TRANSITIONS = {
    [STATES.DRAFT]: [
        STATES.REVIEW_PENDING,   // Mode B/C: User requests CA
        STATES.SUBMITTED_TO_ERI, // Mode A: Direct submission (S20.A)
        STATES.DRAFT             // Self-loop for saves
    ],

    // Review Workflow
    [STATES.REVIEW_PENDING]: [STATES.REVIEWED, STATES.DRAFT],
    [STATES.REVIEWED]: [STATES.APPROVED, STATES.REVIEW_PENDING],

    // Approval & Submission
    [STATES.APPROVED]: [STATES.SUBMITTED_TO_ERI],
    [STATES.SUBMITTED_TO_ERI]: [STATES.ERI_SUCCESS, STATES.ERI_FAILED],

    // Recoverable Failure
    [STATES.ERI_FAILED]: [STATES.SUBMITTED_TO_ERI, STATES.DRAFT], // Retry or reset

    // Terminal
    [STATES.ERI_SUCCESS]: [], // End of line
};

// Action to Trigger Mapping (for snapshot metadata)
const ACTION_TRIGGERS = {
    [STATES.REVIEW_PENDING]: 'review_requested',
    [STATES.REVIEWED]: 'reviewed',
    [STATES.APPROVED]: 'approved',
    [STATES.SUBMITTED_TO_ERI]: 'submitted_to_eri',
    [STATES.ERI_SUCCESS]: 'eri_success',
    [STATES.ERI_FAILED]: 'eri_failed',
    'direct_submit': 'direct_submission', // S20.A: CA-free submission
};

class SubmissionStateMachine {

    /**
     * Assert transition is valid
     * Throws error if transition is illegal
     */
    assertTransition(currentState, targetState) {
        // Allow same-state transitions (idempotency)
        if (currentState === targetState) return;

        const allowed = TRANSITIONS[currentState] || [];
        if (!allowed.includes(targetState)) {
            throw new AppError(
                `Illegal state transition: ${currentState} → ${targetState}`,
                400,
                'INVALID_TRANSITION'
            );
        }
    }

    /**
     * Validate actor authority for transition
     * @param {Object} filing - Filing instance
     * @param {String} targetState - Target state
     * @param {Object} actorContext - { userId, role, caFirmId }
     */
    validateActorAuthority(filing, targetState, actorContext) {
        if (!actorContext) {
            throw new AppError('Actor context required for transition', 400);
        }

        const { userId, role, caFirmId } = actorContext;

        // Authority rules per target state
        const rules = {
            [STATES.REVIEW_PENDING]: () => {
                // User must be filing owner
                return userId === filing.createdBy;
            },
            [STATES.REVIEWED]: () => {
                // Must be CA in same firm
                return role === 'CA' && caFirmId === filing.caFirmId;
            },
            [STATES.APPROVED]: () => {
                // Must be CA in same firm
                return role === 'CA' && caFirmId === filing.caFirmId;
            },
            [STATES.SUBMITTED_TO_ERI]: () => {
                // S20.A: Allow END_USER for direct submission
                // Also allow SYSTEM or CA
                return role === 'SYSTEM' || role === 'CA' || role === 'END_USER';
            },
            [STATES.ERI_SUCCESS]: () => {
                // System only
                return role === 'SYSTEM';
            },
            [STATES.ERI_FAILED]: () => {
                // System only
                return role === 'SYSTEM';
            },
            [STATES.DRAFT]: () => {
                // Rollback allowed for CA or owner
                return role === 'CA' || userId === filing.createdBy;
            }
        };

        const rule = rules[targetState];
        if (!rule || !rule()) {
            throw new AppError(
                `Actor not authorized for transition to ${targetState}`,
                403,
                'UNAUTHORIZED_TRANSITION'
            );
        }
    }

    /**
     * Transition filing to new state
     * S19: Constitutional enforcement with snapshots
     * @param {Object} filing - Sequelize filing instance
     * @param {String} targetState - Target lifecycle state
     * @param {Object} actorContext - { userId, role, caFirmId }
     * @returns {Promise<Object>} filing
     */
    async transition(filing, targetState, actorContext = null) {
        if (!filing.lifecycleState) {
            throw new AppError('Filing missing lifecycleState (canonical field)', 500);
        }

        const previousState = filing.lifecycleState;

        // Validate transition is allowed
        this.assertTransition(previousState, targetState);

        // Validate actor authority (skip for same-state transitions)
        if (previousState !== targetState && actorContext) {
            this.validateActorAuthority(filing, targetState, actorContext);
        }

        // S19: Create snapshot BEFORE transition (if state actually changes)
        if (previousState !== targetState) {
            const trigger = ACTION_TRIGGERS[targetState] || `transition_to_${targetState}`;

            await FilingSnapshotService.createSnapshot(
                filing.id,
                trigger,
                actorContext?.userId || 'system'
            );

            enterpriseLogger.info('Snapshot created for transition', {
                filingId: filing.id,
                from: previousState,
                to: targetState,
                trigger,
                actor: actorContext?.userId
            });
        }

        // Update state
        filing.lifecycleState = targetState;

        // Structured logging
        enterpriseLogger.info('FILING_STATE_TRANSITION', {
            filingId: filing.id,
            from: previousState,
            to: targetState,
            actor: actorContext?.userId || 'system',
            role: actorContext?.role || 'unknown',
            service: 'SubmissionStateMachine',
            timestamp: new Date().toISOString(),
        });

        return filing;
    }

    /**
     * Get allowed next states for current state
     */
    getAllowedNextStates(currentState) {
        return TRANSITIONS[currentState] || [];
    }
}

module.exports = new SubmissionStateMachine();
