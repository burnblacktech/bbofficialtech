/**
 * Central Error Code Registry
 * Phase B3.2 - Error Standardization
 */

module.exports = {
    // Core Domain Errors
    AUTH_REQUIRED: 'AUTH_REQUIRED',               // 401
    FORBIDDEN: 'FORBIDDEN',                       // 403
    FILING_LOCKED: 'FILING_LOCKED',               // 423
    COMPUTATION_REQUIRED: 'COMPUTATION_REQUIRED', // 422
    VALIDATION_FAILED: 'VALIDATION_FAILED',       // 422
    PAN_NOT_VERIFIED: 'PAN_NOT_VERIFIED',         // 403
    INVALID_STATE_TRANSITION: 'INVALID_STATE_TRANSITION', // 409
    RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',     // 404
    INTERNAL_ERROR: 'INTERNAL_ERROR',             // 500

    // JSON / ERI / Integration
    JSON_GENERATION_FAILED: 'JSON_GENERATION_FAILED', // 500
    ERI_REJECTED: 'ERI_REJECTED',                 // 422
    ERI_TIMEOUT: 'ERI_TIMEOUT',                   // 504
    ERI_SERVICE_UNAVAILABLE: 'ERI_SERVICE_UNAVAILABLE', // 503

    // Finance / Payment
    PAYMENT_REQUIRED: 'PAYMENT_REQUIRED',         // 402
    PAYMENT_FAILED: 'PAYMENT_FAILED',             // 402

    // ERI Specific
    UPSTREAM_ERROR: 'UPSTREAM_ERROR',             // 502
    UPSTREAM_SESSION_EXPIRED: 'UPSTREAM_SESSION_EXPIRED', // 401/502
    UPSTREAM_UNAVAILABLE: 'UPSTREAM_UNAVAILABLE', // 503
    FILING_ALREADY_SUBMITTED: 'FILING_ALREADY_SUBMITTED', // 409
    INVALID_PAN: 'INVALID_PAN',                   // 400
    INVALID_JSON: 'INVALID_JSON',                 // 400
    SUBMISSION_REJECTED: 'SUBMISSION_REJECTED',   // 422 - Alias for ERI_REJECTED

    // ERI Client Management
    ERI_CLIENT_ALREADY_LINKED: 'ERI_CLIENT_ALREADY_LINKED',   // 409
    ERI_CLIENT_NOT_REGISTERED: 'ERI_CLIENT_NOT_REGISTERED',   // 404
    ERI_OTP_EXPIRED: 'ERI_OTP_EXPIRED',                       // 400
    ERI_OTP_INVALID: 'ERI_OTP_INVALID',                       // 400
    ERI_OTP_LIMIT_EXCEEDED: 'ERI_OTP_LIMIT_EXCEEDED',         // 429
    ERI_PAN_INACTIVE: 'ERI_PAN_INACTIVE',                     // 400
    ERI_PAN_AADHAAR_NOT_LINKED: 'ERI_PAN_AADHAAR_NOT_LINKED', // 400
    ERI_TRANSACTION_INVALID: 'ERI_TRANSACTION_INVALID',       // 400
    ERI_CLIENT_ADD_FAILED: 'ERI_CLIENT_ADD_FAILED',           // 500
    FILING_INCOMPLETE: 'FILING_INCOMPLETE',                   // 422

    // Document Import
    IMPORT_FILE_TOO_LARGE: 'IMPORT_FILE_TOO_LARGE',           // 413
    IMPORT_INVALID_FILE_TYPE: 'IMPORT_INVALID_FILE_TYPE',     // 400
    IMPORT_PARSE_FAILED: 'IMPORT_PARSE_FAILED',               // 422
    IMPORT_INVALID_SCHEMA: 'IMPORT_INVALID_SCHEMA',           // 422
    IMPORT_AY_MISMATCH: 'IMPORT_AY_MISMATCH',                 // 409
    IMPORT_PAN_MISMATCH: 'IMPORT_PAN_MISMATCH',               // 409
    IMPORT_ACCESS_DENIED: 'IMPORT_ACCESS_DENIED',             // 403
    IMPORT_RATE_LIMIT: 'IMPORT_RATE_LIMIT',                   // 429
    IMPORT_MALICIOUS_CONTENT: 'IMPORT_MALICIOUS_CONTENT',     // 400
    IMPORT_NOT_FOUND: 'IMPORT_NOT_FOUND',                     // 404
    IMPORT_FILING_NOT_DRAFT: 'IMPORT_FILING_NOT_DRAFT',       // 409

    // Family Filing
    FAMILY_MEMBER_LIMIT: 'FAMILY_MEMBER_LIMIT',               // 409 — max 4 members
    FAMILY_PAN_INVALID: 'FAMILY_PAN_INVALID',                 // 422 — PAN verification failed
    FAMILY_MEMBER_NOT_FOUND: 'FAMILY_MEMBER_NOT_FOUND',       // 404
    FAMILY_DUPLICATE_PAN: 'FAMILY_DUPLICATE_PAN',             // 409 — PAN already added

    // Document Vault
    VAULT_FILE_TOO_LARGE: 'VAULT_FILE_TOO_LARGE',             // 413 — exceeds 10MB
    VAULT_INVALID_FORMAT: 'VAULT_INVALID_FORMAT',             // 422 — unsupported mime type
    VAULT_DUPLICATE_IMPORT: 'VAULT_DUPLICATE_IMPORT',         // 409 — already imported to this filing
    VAULT_DOC_NOT_FOUND: 'VAULT_DOC_NOT_FOUND',               // 404
    VAULT_OCR_FAILED: 'VAULT_OCR_FAILED',                     // 422 — OCR extraction failed

    // OTP
    OTP_EXPIRED: 'OTP_EXPIRED',                               // 410 — OTP has expired
    OTP_INVALID: 'OTP_INVALID',                               // 401 — wrong code
    OTP_LOCKED_OUT: 'OTP_LOCKED_OUT',                         // 429 — too many attempts
    OTP_DELIVERY_FAILED: 'OTP_DELIVERY_FAILED',               // 502 — SMS/email send failed

    // Post-Filing
    PF_CPC_PARSE_FAILED: 'PF_CPC_PARSE_FAILED',               // 422 — can't parse CPC intimation
    PF_REVISED_DEADLINE: 'PF_REVISED_DEADLINE',               // 409 — past revised return deadline
    PF_REFUND_API_UNAVAIL: 'PF_REFUND_API_UNAVAIL',           // 503 — ITD API unavailable
    PF_NOT_FILED: 'PF_NOT_FILED',                             // 409 — filing not in eri_success state

    // Auto-Fill
    ITR_SESSION_EXPIRED: 'ITR_SESSION_EXPIRED',               // 401 — SurePass session expired
    SUREPASS_SERVICE_UNAVAILABLE: 'SUREPASS_SERVICE_UNAVAILABLE', // 503 — ITD portal down
    FILING_NOT_EDITABLE: 'FILING_NOT_EDITABLE',               // 400 — filing not in draft state
    INVALID_RESOLUTION: 'INVALID_RESOLUTION',                 // 400 — bad conflict resolution

    // PDF Generation
    PDF_GENERATION_FAILED: 'PDF_GENERATION_FAILED',           // 500 — PDFKit error

    // Data Export & Deletion
    EXPORT_IN_PROGRESS: 'EXPORT_IN_PROGRESS',                 // 409 — export already running
    DELETION_IN_PROGRESS: 'DELETION_IN_PROGRESS',             // 409 — deletion already scheduled
    DELETION_EXPIRED: 'DELETION_EXPIRED',                     // 410 — cancellation window passed
};
