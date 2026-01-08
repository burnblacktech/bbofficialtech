/**
 * SubmissionStates.js
 * Canonical list of all possible states for an ITR Filing.
 * S12 - Aligned with canonical database schema (lowercase)
 */

module.exports = Object.freeze({
    // Initial Draft
    DRAFT: 'draft',

    // Review Workflow
    REVIEW_PENDING: 'review_pending',
    REVIEWED: 'reviewed',

    // Approval
    APPROVED: 'approved',

    // ERI Submission Pipeline
    SUBMITTED_TO_ERI: 'submitted_to_eri',
    ERI_SUCCESS: 'eri_success',
    ERI_FAILED: 'eri_failed',
});
