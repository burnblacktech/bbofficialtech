/**
 * SubmissionStates.js
 * Canonical list of all possible states for an ITR Filing.
 * V4.1 - Production Hardening
 */

module.exports = Object.freeze({
    // Initial Draft
    DRAFT: 'DRAFT',

    // User Context
    READY_TO_FILE: 'READY_TO_FILE',       // User has completed data entry
    ACTION_REQUIRED: 'ACTION_REQUIRED',   // CA requested info (Loop back)

    // CA Context
    SUBMITTED_TO_CA: 'SUBMITTED_TO_CA',   // Locked for User, CA Reviewing

    // Submission Pipeline (V4)
    CA_APPROVED: 'CA_APPROVED',           // CA clicked "Submit", ready for ERI
    ERI_IN_PROGRESS: 'ERI_IN_PROGRESS',   // Sent to ERI, waiting for response
    ERI_ACK_RECEIVED: 'ERI_ACK_RECEIVED', // Valid ACK received from ITD

    // Terminal States
    FILED: 'FILED',                       // Successfully filed and ACK stored
    ERI_FAILED: 'ERI_FAILED',             // Technical failure (Recoverable)
    CANCELLED: 'CANCELLED'                // Manual override/cancellation
});
