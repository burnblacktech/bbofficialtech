// =====================================================
// ITR DOMAIN STATES - AUTHORITATIVE ENUM
// These are the ONLY valid lifecycle states for ITR filings
// =====================================================

/**
 * ITR Domain Lifecycle States
 * 
 * State transitions must be validated by Domain Core.
 * Only Domain Core can decide state transitions, ITR type changes,
 * allowed actions, and recomputation/invalidation.
 */

const ITR_DOMAIN_STATES = {
  /**
   * DRAFT_INIT
   * - Initial draft creation
   * - No ITR type determined yet
   * - No data collected
   * - Allowed actions: determine ITR type, collect initial data
   */
  DRAFT_INIT: 'DRAFT_INIT',

  /**
   * ITR_DETERMINED
   * - ITR type has been determined (ITR-1, ITR-2, ITR-3, or ITR-4)
   * - ITR type is now immutable (unless Domain Core allows override)
   * - Allowed actions: collect data, validate data
   */
  ITR_DETERMINED: 'ITR_DETERMINED',

  /**
   * DATA_COLLECTED
   * - User data has been collected
   * - All required sections have data
   * - Allowed actions: confirm data, validate data, compute tax
   */
  DATA_COLLECTED: 'DATA_COLLECTED',

  /**
   * DATA_CONFIRMED
   * - Data has been confirmed/validated
   * - User has reviewed and confirmed data
   * - Allowed actions: compute tax, lock filing
   */
  DATA_CONFIRMED: 'DATA_CONFIRMED',

  /**
   * COMPUTED
   * - Tax has been computed
   * - Tax liability, refund, balance payable are calculated
   * - Allowed actions: review computation, lock filing, override (with reason)
   * - CA/Admin can override values (with audit trail)
   */
  COMPUTED: 'COMPUTED',

  /**
   * LOCKED
   * - Filing is locked (no more edits)
   * - Data is immutable
   * - Allowed actions: file/submit ITR, unlock (admin only, with reason)
   * - Overrides NOT allowed (except admin unlock)
   */
  LOCKED: 'LOCKED',

  /**
   * FILED
   * - ITR has been filed/submitted to Income Tax Department
   * - Submission timestamp recorded
   * - Allowed actions: e-verify, track submission
   */
  FILED: 'FILED',

  /**
   * ACKNOWLEDGED
   * - ITR has been acknowledged by ITD
   * - Acknowledgment number received
   * - Allowed actions: track refund, track ITR-V, view acknowledgment
   */
  ACKNOWLEDGED: 'ACKNOWLEDGED',

  /**
   * COMPLETED
   * - Filing process is complete
   * - Final state (no further transitions)
   * - Allowed actions: view history, download documents
   */
  COMPLETED: 'COMPLETED',
};

/**
 * Valid State Transitions
 * Maps each state to its allowed next states
 */
const VALID_STATE_TRANSITIONS = {
  [ITR_DOMAIN_STATES.DRAFT_INIT]: [
    ITR_DOMAIN_STATES.ITR_DETERMINED,
  ],
  [ITR_DOMAIN_STATES.ITR_DETERMINED]: [
    ITR_DOMAIN_STATES.DATA_COLLECTED,
    ITR_DOMAIN_STATES.DRAFT_INIT, // Can reset if ITR type changes
  ],
  [ITR_DOMAIN_STATES.DATA_COLLECTED]: [
    ITR_DOMAIN_STATES.DATA_CONFIRMED,
    ITR_DOMAIN_STATES.ITR_DETERMINED, // Can go back to collect more data
  ],
  [ITR_DOMAIN_STATES.DATA_CONFIRMED]: [
    ITR_DOMAIN_STATES.COMPUTED,
    ITR_DOMAIN_STATES.DATA_COLLECTED, // Can go back to edit data
  ],
  [ITR_DOMAIN_STATES.COMPUTED]: [
    ITR_DOMAIN_STATES.LOCKED,
    ITR_DOMAIN_STATES.DATA_CONFIRMED, // Can recompute if data changes
  ],
  [ITR_DOMAIN_STATES.LOCKED]: [
    ITR_DOMAIN_STATES.FILED,
    ITR_DOMAIN_STATES.COMPUTED, // Admin unlock (with reason)
  ],
  [ITR_DOMAIN_STATES.FILED]: [
    ITR_DOMAIN_STATES.ACKNOWLEDGED,
  ],
  [ITR_DOMAIN_STATES.ACKNOWLEDGED]: [
    ITR_DOMAIN_STATES.COMPLETED,
  ],
  [ITR_DOMAIN_STATES.COMPLETED]: [
    // No further transitions (final state)
  ],
};

/**
 * State-based Allowed Actions
 * Maps each state to actions that are allowed in that state
 */
const STATE_ALLOWED_ACTIONS = {
  [ITR_DOMAIN_STATES.DRAFT_INIT]: [
    'determine_itr_type',
    'collect_initial_data',
    'cancel_draft',
  ],
  [ITR_DOMAIN_STATES.ITR_DETERMINED]: [
    'collect_data',
    'validate_data',
    'change_itr_type', // Only Domain Core can do this
  ],
  [ITR_DOMAIN_STATES.DATA_COLLECTED]: [
    'confirm_data',
    'validate_data',
    'edit_data',
    'compute_tax',
  ],
  [ITR_DOMAIN_STATES.DATA_CONFIRMED]: [
    'compute_tax',
    'lock_filing',
    'edit_data', // Can go back to edit
  ],
  [ITR_DOMAIN_STATES.COMPUTED]: [
    'review_computation',
    'lock_filing',
    'override_values', // CA/Admin only, with reason
    'recompute_tax', // If data changes
    'export_json',
    'edit_data', // Allow editing to trigger re-computation/rollback
  ],
  [ITR_DOMAIN_STATES.LOCKED]: [
    'file_itr',
    'unlock_filing', // Admin only, with reason
    'export_json',
  ],
  [ITR_DOMAIN_STATES.FILED]: [
    'e_verify',
    'track_submission',
    'download_acknowledgment',
    'export_json',
  ],
  [ITR_DOMAIN_STATES.ACKNOWLEDGED]: [
    'track_refund',
    'track_itrv',
    'view_acknowledgment',
    'mark_completed',
    'export_json',
  ],
  [ITR_DOMAIN_STATES.COMPLETED]: [
    'view_history',
    'download_documents',
    'export_json',
  ],
};

/**
 * Fields that should be immutable after specific states
 */
const IMMUTABLE_FIELDS_BY_STATE = {
  [ITR_DOMAIN_STATES.ITR_DETERMINED]: [
    'itrType', // Cannot change ITR type after determination (unless Domain Core allows)
  ],
  [ITR_DOMAIN_STATES.LOCKED]: [
    'jsonPayload', // Cannot change payload after locked
    'data', // Cannot change draft data after locked
  ],
  [ITR_DOMAIN_STATES.COMPUTED]: [
    'taxLiability', // Cannot change without recomputation
    'refundAmount', // Cannot change without recomputation
    'balancePayable', // Cannot change without recomputation
  ],
};

module.exports = {
  ITR_DOMAIN_STATES,
  VALID_STATE_TRANSITIONS,
  STATE_ALLOWED_ACTIONS,
  IMMUTABLE_FIELDS_BY_STATE,
};

