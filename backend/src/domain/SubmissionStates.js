/**
 * SubmissionStates.js
 * Canonical list of all possible states for an ITR Filing.
 * S12 - Aligned with canonical database schema (lowercase)
 */

module.exports = Object.freeze({
    // Initial Draft
    DRAFT: 'draft',

    // Payment Gate Cleared (S27)
    READY_FOR_SUBMISSION: 'ready_for_submission',

    // Review Workflow
    REVIEW_PENDING: 'review_pending',
    REVIEWED: 'reviewed',

    // Approval
    APPROVED_BY_CA: 'approved_by_ca',

    // ERI Submission Pipeline
    SUBMITTED_TO_ERI: 'submitted_to_eri',
    ERI_IN_PROGRESS: 'eri_in_progress',
    ERI_SUCCESS: 'eri_success',
    ERI_FAILED: 'eri_failed',
});
