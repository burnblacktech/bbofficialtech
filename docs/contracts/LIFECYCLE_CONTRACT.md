# LIFECYCLE CONTRACT v1.0

**Authority:** This document defines the canonical lifecycle state machine for ITR filings. No code may violate these rules.

---

## State Diagram

```
draft
  │
  └─[submit_for_review]──> review_pending
                              │
                              └─[mark_reviewed]──> reviewed
                                                      │
                                                      └─[approve]──> approved
                                                                       │
                                                                       └─[submit_to_eri]──> submitted_to_eri
                                                                                              │
                                                                                              ├─[eri_success]──> eri_success (TERMINAL)
                                                                                              │
                                                                                              └─[eri_failed]──> eri_failed
                                                                                                                  │
                                                                                                                  └─[retry_submission]──> submitted_to_eri
```

---

## Transition Rules

### 1. `draft` → `review_pending`

**Action:** `submit_for_review`  
**Actor:** `USER` (filing owner)  
**Preconditions:**
- Filing must have minimum required data (salary OR capital gains intent)
- Filing must not be frozen

**Effects:**
- Create snapshot (trigger: `review_requested`)
- Filing becomes frozen (no further data mutations)
- `lifecycleState` = `review_pending`

**Invariants:**
- `jsonPayload` must not be empty
- `taxpayerPan` must be valid

---

### 2. `review_pending` → `reviewed`

**Action:** `mark_reviewed`  
**Actor:** `CA` (same firm as filing)  
**Preconditions:**
- Actor must have CA role
- Actor must be in same `caFirmId` as filing
- Filing must be in `review_pending` state

**Effects:**
- Create snapshot (trigger: `reviewed`)
- Set `reviewedBy` = actor.id
- Set `reviewedAt` = current timestamp
- `lifecycleState` = `reviewed`

**Invariants:**
- `reviewedBy` must be set
- `reviewedAt` must be set

---

### 3. `reviewed` → `approved`

**Action:** `approve`  
**Actor:** `CA` (same firm as filing)  
**Preconditions:**
- Actor must have CA role
- Actor must be in same `caFirmId` as filing
- Filing must be in `reviewed` state

**Effects:**
- Create snapshot (trigger: `approved`)
- Set `approvedBy` = actor.id
- Set `approvedAt` = current timestamp
- `lifecycleState` = `approved`

**Invariants:**
- `approvedBy` must be set
- `approvedAt` must be set
- Filing remains frozen

---

### 4. `approved` → `submitted_to_eri`

**Action:** `submit_to_eri`  
**Actor:** `SYSTEM` (automated)  
**Preconditions:**
- Filing must be in `approved` state
- Filing must be frozen
- ERI gateway must be available

**Effects:**
- Create snapshot (trigger: `submitted_to_eri`)
- `lifecycleState` = `submitted_to_eri`
- Initiate ERI submission worker

**Invariants:**
- Snapshot payload matches submitted payload (byte-for-byte)
- Filing is permanently frozen (no unfreeze allowed)

---

### 5. `submitted_to_eri` → `eri_success`

**Action:** `eri_success`  
**Actor:** `SYSTEM` (ERI callback)  
**Preconditions:**
- Filing must be in `submitted_to_eri` state
- ERI acknowledgement received

**Effects:**
- Create snapshot (trigger: `eri_success`)
- `lifecycleState` = `eri_success` (TERMINAL)
- Store ERI acknowledgement number

**Invariants:**
- Filing is permanently frozen
- No further transitions allowed

---

### 6. `submitted_to_eri` → `eri_failed`

**Action:** `eri_failed`  
**Actor:** `SYSTEM` (ERI callback)  
**Preconditions:**
- Filing must be in `submitted_to_eri` state
- ERI rejection received

**Effects:**
- Create snapshot (trigger: `eri_failed`)
- `lifecycleState` = `eri_failed`
- Store ERI error details

**Invariants:**
- Error details must be captured
- Filing remains frozen

---

### 7. `eri_failed` → `submitted_to_eri`

**Action:** `retry_submission`  
**Actor:** `CA` or `SYSTEM`  
**Preconditions:**
- Filing must be in `eri_failed` state
- Error must be retryable (not validation error)
- Actor must have authority

**Effects:**
- Create snapshot (trigger: `retry_submission`)
- `lifecycleState` = `submitted_to_eri`
- Initiate ERI submission worker

**Invariants:**
- Same payload as previous submission (no data changes)

---

## Freeze Enforcement

**Frozen States:** `review_pending`, `reviewed`, `approved`, `submitted_to_eri`, `eri_success`, `eri_failed`

**Enforcement:**
- All mutation services MUST call `FilingFreezeService.assertMutable(filing)` before any `jsonPayload` changes
- State machine MUST enforce freeze automatically during transitions
- No unfreeze allowed after `submitted_to_eri`

---

## Snapshot Policy

**Every transition creates a snapshot** with:
- `version`: Auto-incremented
- `trigger`: Transition action name
- `lifecycleState`: State at time of snapshot
- `jsonPayload`: Deep copy of filing data
- `createdAt`: ISO timestamp
- `createdBy`: Actor ID

**Snapshots are immutable** — no deletion, no modification.

---

## Authority Rules

**ONLY `SubmissionStateMachine` may:**
- Change `lifecycleState`
- Create snapshots during transitions
- Enforce freeze rules
- Validate actor authority

**Services MUST:**
- Request transitions via `SubmissionStateMachine.transition()`
- Never mutate `lifecycleState` directly
- Never bypass freeze enforcement

---

## Invariants (Constitutional)

1. **Single Source of Truth:** Only `SubmissionStateMachine` mutates `lifecycleState`
2. **Snapshot on Transition:** Every state change creates snapshot
3. **Freeze Enforcement:** Frozen filings cannot be mutated
4. **Actor Authority:** Transitions validate actor role and permissions
5. **Audit Trail:** All transitions logged with actor, timestamp, trigger

---

## Violation Handling

**Direct `lifecycleState` mutation:**
- ❌ FAIL — Code review rejection
- ❌ FAIL — Runtime error if detected

**Transition without snapshot:**
- ❌ FAIL — State machine throws error
- ❌ FAIL — Transaction rollback

**Bypass freeze enforcement:**
- ❌ FAIL — Service throws `FILING_FROZEN` error
- ❌ FAIL — Transaction rollback

---

**Version:** 1.0  
**Status:** CANONICAL  
**Authority:** Constitutional — no exceptions
