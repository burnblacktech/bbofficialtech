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
// Aligned with 03_state_machine_and_lifecycle.md
const TRANSITIONS = {
    [STATES.DRAFT]: [
        STATES.READY_FOR_SUBMISSION, // S27: After payment gate cleared
        STATES.REVIEW_PENDING,        // Mode B/C: User requests CA
        STATES.DRAFT                  // Self-loop for saves
    ],

    // Payment Gate Cleared
    [STATES.READY_FOR_SUBMISSION]: [
        STATES.SUBMITTED_TO_ERI,      // Direct submission (S20.A)
        STATES.REVIEW_PENDING,        // User requests CA review
        STATES.DRAFT                  // Rollback to edit
    ],

    // Review Workflow
    [STATES.REVIEW_PENDING]: [STATES.REVIEWED, STATES.DRAFT],
    [STATES.REVIEWED]: [STATES.APPROVED_BY_CA, STATES.REVIEW_PENDING],

    // Approval & Submission
    [STATES.APPROVED_BY_CA]: [STATES.SUBMITTED_TO_ERI],
    [STATES.SUBMITTED_TO_ERI]: [STATES.ERI_IN_PROGRESS],

    // ERI Processing
    [STATES.ERI_IN_PROGRESS]: [STATES.ERI_SUCCESS, STATES.ERI_FAILED],

    // Recoverable Failure
    [STATES.ERI_FAILED]: [STATES.SUBMITTED_TO_ERI, STATES.DRAFT], // Retry or reset

    // Terminal
    [STATES.ERI_SUCCESS]: [], // End of line
};

// Action to Trigger Mapping (for snapshot metadata)
const ACTION_TRIGGERS = {
    [STATES.READY_FOR_SUBMISSION]: 'payment_gate_cleared',
    [STATES.REVIEW_PENDING]: 'review_requested',
    [STATES.REVIEWED]: 'reviewed',
    [STATES.APPROVED_BY_CA]: 'approved_by_ca',
    [STATES.SUBMITTED_TO_ERI]: 'submitted_to_eri',
    [STATES.ERI_IN_PROGRESS]: 'eri_in_progress',
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
            [STATES.READY_FOR_SUBMISSION]: () => {
                // User or system can transition after payment gate
                return userId === filing.createdBy || role === 'SYSTEM';
            },
            [STATES.REVIEW_PENDING]: () => {
                // User must be filing owner
                return userId === filing.createdBy;
            },
            [STATES.REVIEWED]: () => {
                // Must be CA in same firm
                return role === 'CA' && caFirmId === filing.caFirmId;
            },
            [STATES.APPROVED_BY_CA]: () => {
                // Must be CA in same firm
                return role === 'CA' && caFirmId === filing.caFirmId;
            },
            [STATES.SUBMITTED_TO_ERI]: () => {
                // S20.A: Allow END_USER for direct submission
                // Also allow SYSTEM or CA
                return role === 'SYSTEM' || role === 'CA' || role === 'END_USER';
            },
            [STATES.ERI_IN_PROGRESS]: () => {
                // System only (worker picks up)
                return role === 'SYSTEM';
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
     * Validate payment gate (S27)
     * Ensures tax liability is paid before submission
     * @param {Object} filing - Filing instance
     * @param {String} targetState - Target state
     * @throws {AppError} if payment gate not cleared
     */
    validatePaymentGate(filing, targetState) {
        // Only enforce for transitions that require payment clearance
        const requiresPaymentGate = [
            STATES.READY_FOR_SUBMISSION,
            STATES.SUBMITTED_TO_ERI
        ];

        if (!requiresPaymentGate.includes(targetState)) {
            return; // No payment check needed
        }

        const taxLiability = parseFloat(filing.taxLiability) || 0;

        // If no tax liability, payment gate is automatically cleared
        if (taxLiability <= 0) {
            enterpriseLogger.debug('Payment gate cleared: No tax liability', {
                filingId: filing.id,
                taxLiability
            });
            return;
        }

        // Check if payment exists and is verified
        const jsonPayload = filing.jsonPayload || {};
        const taxesPaid = jsonPayload.taxes_paid || jsonPayload.taxesPaid || {};

        // Calculate total paid from all payment types
        const advanceTaxPaid = this.calculatePaymentTotal(taxesPaid.advanceTax || []);
        const selfAssessmentPaid = this.calculatePaymentTotal(taxesPaid.selfAssessmentTax || []);
        const totalPaid = advanceTaxPaid + selfAssessmentPaid;

        enterpriseLogger.debug('Payment gate validation', {
            filingId: filing.id,
            taxLiability,
            totalPaid,
            advanceTaxPaid,
            selfAssessmentPaid
        });

        if (totalPaid < taxLiability) {
            throw new AppError(
                `Payment required. Tax liability: ₹${taxLiability.toFixed(2)}, Paid: ₹${totalPaid.toFixed(2)}. Please pay the remaining ₹${(taxLiability - totalPaid).toFixed(2)} before filing.`,
                403,
                'PAYMENT_GATE_NOT_CLEARED'
            );
        }

        enterpriseLogger.info('Payment gate cleared', {
            filingId: filing.id,
            taxLiability,
            totalPaid
        });
    }

    /**
     * Calculate total from payment array
     * @param {Array} payments - Array of payment objects
     * @returns {Number} Total amount
     */
    calculatePaymentTotal(payments) {
        if (!Array.isArray(payments)) return 0;

        return payments
            .filter(p => p.verified !== false) // Only count verified payments
            .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
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

        // S27: Validate payment gate BEFORE transition
        this.validatePaymentGate(filing, targetState);

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
