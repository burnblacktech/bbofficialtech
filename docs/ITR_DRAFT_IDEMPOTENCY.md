# ITR Draft Creation Idempotency (Robust Save Foundation)

## Problem this solves

Browsers can retry requests and the UI can trigger multiple draft-creation calls before the URL state updates. Without protection, this can create **duplicate filings/drafts** even when the first request succeeded.

## Standard

- `POST /api/itr/drafts` MUST be **idempotent** when the client provides `X-Idempotency-Key`.
- Idempotency is enforced **per user**: the same key is allowed for different users, but not twice for the same user.

## Implementation

### Client (frontend)

- Sends a stable `X-Idempotency-Key` for the initial draft creation attempt.
- Optionally sends `X-Client-Request-Id` for log tracing.

### Server (backend)

- Stores the key on the filing (`itr_filings.idempotency_key`).
- On repeat requests with the same key, returns the **existing** draft instead of creating a new filing.

## Database migration

Run:

- `node backend/src/scripts/migrations/add-itr-filings-idempotency-key.js`

This adds:

- `itr_filings.idempotency_key` (TEXT, nullable)
- Unique index: `(user_id, idempotency_key)` where `idempotency_key IS NOT NULL`


