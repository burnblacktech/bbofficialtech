# ERI Submission Outcome UX — Implementation Plan

## Objective

Close the experiential gap: **"What happens after I submit?"**

Provide read-only visibility into ERI submission status using existing lifecycle states, attempt records, and snapshots. No new logic, pure projection.

---

## User Review Required

> [!IMPORTANT]
> This is the final piece of the end-user journey. After this, users can:
> - Submit their return
> - See what happened (in progress, success, failed)
> - Download acknowledgment or JSON
> - Know their next steps
>
> Only after this should CA workflows be built.

---

## Proposed Changes

### Backend API

#### [NEW] `GET /api/filings/:filingId/submission-status`

**Purpose**: Project submission outcome from lifecycle state and ERI attempts

**Response Shape**:
```json
{
  "status": "submitted_in_progress" | "submitted_success" | "submitted_failed_retrying" | "submitted_failed_terminal",
  "submittedAt": "ISO timestamp",
  "attemptCount": 3,
  "lastAttemptAt": "ISO timestamp",
  "nextRetryAt": "ISO timestamp | null",
  "acknowledgmentNumber": "string | null",
  "failureReason": "plain language string | null",
  "snapshot": {
    "id": "uuid",
    "createdAt": "ISO timestamp",
    "downloadUrl": "/api/filings/:filingId/export/json"
  },
  "actions": {
    "canDownloadJSON": true,
    "canDownloadAcknowledgment": false,
    "canRetryManually": false
  }
}
```

**Data Sources**:
- `ITRFiling.lifecycleState`
- `ERISubmissionAttempt` records (count, timestamps, errors)
- `FilingSnapshot` (latest)

**Logic**:
- `submitted_to_eri` → `submitted_in_progress`
- `eri_success` → `submitted_success`
- `eri_failed` + retry pending → `submitted_failed_retrying`
- `eri_failed` + max retries → `submitted_failed_terminal`

---

### Frontend Screen

#### [NEW] `SubmissionStatus.js`

**Route**: `/filing/:filingId/submission-status`

**States to Handle**:

1. **Submitted — In Progress**
   - Icon: Clock (animated)
   - Message: "Your return has been submitted and is being processed by the Income Tax Department."
   - Show: Submission date, attempt count, snapshot reference
   - CTA: None (wait)

2. **Submitted — Success**
   - Icon: CheckCircle (green)
   - Message: "Your return has been successfully filed."
   - Show: Acknowledgment number, filing date
   - CTA: Download acknowledgment, Download JSON

3. **Submitted — Failed (Retrying)**
   - Icon: AlertCircle (yellow)
   - Message: "We're retrying submission due to a technical issue."
   - Show: Last attempt time, next retry ETA
   - Reassurance: "No action needed — we'll keep trying"
   - CTA: Download JSON (fallback)

4. **Submitted — Failed (Terminal)**
   - Icon: XCircle (red)
   - Message: "We couldn't submit your return."
   - Show: Reason (plain language), attempt count
   - Next steps:
     - Download JSON and file manually
     - Contact support
     - Contact CA (if S22 requires)
   - CTA: Download JSON, Contact support

**Constraints**:
- ❌ No retry button
- ❌ No ERI jargon
- ❌ No raw error codes
- ❌ No false reassurance
- ✅ Read-only
- ✅ Snapshot-based
- ✅ Plain language

---

### Supporting Service

#### [NEW] `ERIOutcomeService.js`

**Purpose**: Pure projection helpers for submission outcome

**Methods**:
- `getSubmissionStatus(filingId)` → status object
- `deriveStatusFromLifecycle(lifecycleState, attempts)` → status enum
- `translateErrorToPlainLanguage(eriError)` → user-friendly message
- `calculateNextRetryETA(lastAttempt, retryCount)` → timestamp

---

## Files to Create

**Backend**:
1. `src/services/ERIOutcomeService.js` (new)
2. `src/routes/filings.js` (add submission-status route)

**Frontend**:
1. `src/pages/Filing/SubmissionStatus.js` (new)
2. `src/App.js` (add route)

---

## Verification Plan

### Manual Testing
1. Create filing
2. Submit (mock ERI success)
3. Verify "Success" screen shows acknowledgment
4. Mock ERI failure
5. Verify "Failed (Retrying)" screen shows retry ETA
6. Mock terminal failure
7. Verify "Failed (Terminal)" screen shows download JSON option

### Automated Tests
- Unit test `ERIOutcomeService.deriveStatusFromLifecycle()`
- Unit test error translation
- API test for `/submission-status` endpoint

---

## Next Steps After This

Once ERI Submission Outcome UX is complete:
1. ✅ End-user journey is complete
2. ✅ Product is usable end-to-end without CA
3. ✅ ERI is visible and trustworthy

**Then** build:
- CA inbox
- Review workflows
- Paid assistance
- Enterprise features

---

## Constitutional Compliance

- ✅ Read-only (no mutations)
- ✅ Snapshot-based (no live data)
- ✅ No new logic (pure projection)
- ✅ No ERI jargon (plain language)
- ✅ No false reassurance (honest status)
