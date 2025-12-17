# ITR Save vs Save & Exit (UX Standard)

This document defines the **standard** behavior for saving progress during the ITR journey so users always know what will happen when they click **Save** vs **Save & Exit**.

## Goals

- Keep the user in-flow during data entry (no unnecessary navigation).
- Provide a reliable “return later” path (CA-like, session-based completion).
- Ensure a single, predictable landing destination after exiting.

## Button behavior

### Save

- **What it does**: Persists the latest draft.
- **Where it goes**: **Stays on the same page/step** (no redirect).
- **User feedback**: Shows a short “Saved” confirmation (toast/indicator).

### Save & Exit

- **What it does**: Persists the latest draft.
- **Where it goes**:
  - **END_USER**: redirects to `/dashboard`
  - **All other roles**: redirects to `/home` (role-aware smart redirect)
- **User feedback**: Shows a short “Saved” confirmation, then navigates.

## Resume behavior (Dashboard)

- Dashboard displays a **Resume where you left off** card when a recent draft was saved via Save & Exit and it is not already visible in the “Continue Filing” list.
- Clicking **Resume** opens the computation page with `draftId` (and `filingId` if available).

## Implementation notes

- The latest resumable draft pointer is stored in localStorage under:
  - `itr_last_resume`: `{ draftId, filingId, assessmentYear, itrType, savedAt }`
- Read-only filings (submitted/acknowledged/processed, or `viewMode=readonly`) must not allow editing. If the user chooses “Start fresh”, the UI should **clear** the read-only mode so the new draft is editable.


