# Real-World Test Use-Case Matrix — MANDATORY

## Status: Pre-Launch Acceptance Testing Required

These tests must be executed with **real humans** (not automated tests) before launch.

---

## Test Case A: Simple Salaried User

**Profile**:
- Salary only
- 1 employer
- ₹8L annual income
- No other income sources

**Expected Behavior**:
- [ ] ITR-1 automatically determined
- [ ] No CA requirement flagged
- [ ] Submission allowed (if all data complete)
- [ ] ERI submission succeeds (sandbox)
- [ ] Acknowledgment received

**User Emotion Check**:
- [ ] User feels "this was easy"
- [ ] User trusts the outcome
- [ ] User does not ask "did I do it right?"

---

## Test Case B: Salary + Capital Gains

**Profile**:
- Salary ₹10L
- Mutual fund LTCG ₹1.5L
- No other income

**Expected Behavior**:
- [ ] ITR-2 automatically determined
- [ ] Capital gains section appears in income story
- [ ] User can add CG details (when screen is built)
- [ ] Submission allowed
- [ ] No CA requirement (optional)

**User Emotion Check**:
- [ ] User understands why ITR-2 is needed
- [ ] User does not feel "this is too complex"
- [ ] User completes without CA help

---

## Test Case C: Freelance + Salary

**Profile**:
- Salary ₹6L
- Freelance income ₹4L
- No audit

**Expected Behavior**:
- [ ] ITR-3 automatically determined
- [ ] CA requirement flagged (S22 logic)
- [ ] Submission blocked without CA approval
- [ ] User sees clear message: "CA assistance required"
- [ ] JSON download available

**User Emotion Check**:
- [ ] User understands CA is mandatory (not upsell)
- [ ] User does not feel "trapped"
- [ ] User can download JSON for manual filing

---

## Test Case D: Partial Data Drop-off

**Profile**:
- User selects "Salary" income source
- User does NOT add employer details
- User navigates to readiness screen

**Expected Behavior**:
- [ ] Readiness screen shows "Income details: Not added yet"
- [ ] Submit button is disabled
- [ ] Clear message: "Add income details to enable submission"
- [ ] No panic copy (no "ERROR", no red warnings)

**User Emotion Check**:
- [ ] User feels "I can come back later"
- [ ] User does not feel "I broke something"
- [ ] User understands what's missing

---

## Test Case E: Pause & Resume

**Profile**:
- User starts filing (selects income sources)
- User adds 1 employer (partial data)
- User logs out
- User returns after 7 days

**Expected Behavior**:
- [ ] Filing state intact (employer data preserved)
- [ ] Reassurance visible: "Last updated 7 days ago"
- [ ] User can continue from where they left off
- [ ] No data loss
- [ ] No session timeout panic

**User Emotion Check**:
- [ ] User feels "my data is safe"
- [ ] User does not feel rushed
- [ ] User appreciates self-paced filing

---

## Test Case F: Manual JSON Download

**Profile**:
- User completes filing (all data entered)
- User downloads JSON snapshot

**Expected Behavior**:
- [ ] JSON download succeeds
- [ ] JSON contains all entered data
- [ ] JSON matches UI display (exact match)
- [ ] JSON is deterministic (same data → same JSON)
- [ ] JSON is human-readable (formatted)

**Technical Validation**:
- [ ] Compare JSON with database `jsonPayload`
- [ ] Verify snapshot immutability
- [ ] Verify no PII leakage in metadata

---

## Test Case G: ERI Retry Simulation

**Profile**:
- User submits filing
- ERI returns retryable failure (stub/mock)

**Expected Behavior**:
- [ ] Filing state remains `submitted_to_eri`
- [ ] Submission status shows "Retrying automatically"
- [ ] User sees: "This is normal. We're monitoring it."
- [ ] No user action required
- [ ] Retry happens automatically (background worker)
- [ ] User can download JSON anytime

**User Emotion Check**:
- [ ] User does not panic
- [ ] User trusts the system is handling it
- [ ] User does not call support

---

## Test Case H: Zero Tax Payable

**Profile**:
- Salary ₹3L (below taxable limit)
- No other income

**Expected Behavior**:
- [ ] ITR-1 determined
- [ ] Tax breakdown shows ₹0 tax
- [ ] No refund, no payment
- [ ] Submission allowed
- [ ] User sees "No tax payable"

**User Emotion Check**:
- [ ] User understands they still need to file
- [ ] User does not feel "why am I doing this?"

---

## Test Case I: Refund Case

**Profile**:
- Salary ₹12L
- TDS deducted ₹1.5L
- Actual tax liability ₹1.2L
- Refund due: ₹30,000

**Expected Behavior**:
- [ ] Tax breakdown shows refund amount
- [ ] Bank account required (blocked if missing)
- [ ] User sees: "Refund will be credited to your bank account"
- [ ] Submission succeeds

**User Emotion Check**:
- [ ] User understands refund process
- [ ] User trusts they will receive refund

---

## Test Case J: Multiple Employers (Job Switch)

**Profile**:
- Employer 1: Apr 2023 - Aug 2023 (₹4L)
- Employer 2: Sep 2023 - Mar 2024 (₹6L)
- Total: ₹10L

**Expected Behavior**:
- [ ] User can add 2 employers
- [ ] Both employers shown in list
- [ ] Total salary calculated correctly
- [ ] TDS from both employers aggregated
- [ ] ITR-1 determined

**User Emotion Check**:
- [ ] User does not feel "this is too complex"
- [ ] User understands how to add multiple employers

---

## Execution Checklist

### Pre-Test Setup
- [ ] Sandbox ERI credentials configured
- [ ] Test users created (different profiles)
- [ ] Database backup taken
- [ ] Monitoring dashboards ready

### During Testing
- [ ] Record user screen (with permission)
- [ ] Note where users pause/hesitate
- [ ] Note where users reread copy
- [ ] Note where users ask questions
- [ ] Note where users feel relief

### Post-Test Analysis
- [ ] Identify copy issues (not logic issues)
- [ ] Identify sequencing confusion
- [ ] Identify reassurance gaps
- [ ] Document user quotes
- [ ] Prioritize fixes (copy/sequencing only)

---

## Success Criteria

### Functional
- [ ] All test cases pass
- [ ] No data loss
- [ ] No state machine violations
- [ ] No ERI failures (sandbox)

### Emotional
- [ ] Users feel "this was easier than expected"
- [ ] Users trust the outcome
- [ ] Users do not call support for basic flow
- [ ] Users say "I'll use this next year"

### Trust
- [ ] Users do not ask "did I do it right?"
- [ ] Users do not feel "I need a CA to verify"
- [ ] Users feel safe without talking to a human

---

## Launch Gate

**Do NOT launch until**:
- [ ] All 10 test cases executed
- [ ] All emotional checks passed
- [ ] All copy issues fixed
- [ ] All sequencing issues fixed
- [ ] No logic changes required

**If logic changes are required**: Return to planning phase.

---

## Next Phase After Testing

1. Fix copy/sequencing issues only
2. Re-test affected flows
3. Launch with ITR-1 + ITR-2 only
4. Monitor real user behavior
5. Add CG/rental/business screens iteratively

---

**This is the final gate before real taxpayers.**
