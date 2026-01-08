# Launch Readiness Checklist — ITR Filing Feature

## Status: Production-Grade Complete, Pre-Launch Validation Pending

---

## Phase 1: Reality Validation (Non-Negotiable)

### Real Filing Tests (10-20 Cases)

**Test Scenarios**:
- [ ] Salary only (₹8-12L, one employer)
- [ ] Salary + Capital Gains (equity)
- [ ] Job switch (2 employers in same year)
- [ ] Zero tax payable
- [ ] Refund case
- [ ] Partial data entry → save → resume
- [ ] Drop-off at income story → return next day
- [ ] Drop-off at readiness → return and submit
- [ ] Multiple income sources (salary + CG + other)
- [ ] Edge case: Very high income (₹50L+)

**Observation Points**:
- [ ] Where users pause (hesitation points)
- [ ] Where they reread copy (confusion signals)
- [ ] Where they feel relief (trust moments)
- [ ] Where they ask questions (clarity gaps)
- [ ] Time to complete (pacing validation)

**Fix Only**:
- [ ] Copy refinement (not logic changes)
- [ ] Sequencing adjustments (not new features)
- [ ] Reassurance placement (not computation)

---

## Phase 2: ERI Live Rollout (Controlled)

### Pre-Rollout Checklist

**Environment**:
- [ ] ERI credentials verified (sandbox first)
- [ ] ERI endpoint connectivity tested
- [ ] Retry logic validated (manual trigger)
- [ ] Error handling verified (all 4 states)

**Test Case (Single PAN)**:
- [ ] Select 1 known PAN
- [ ] Select 1 ITR type (ITR-1 recommended)
- [ ] Known expected outcome (success or specific error)
- [ ] Monitor submission → retry → outcome
- [ ] Verify acknowledgment number (if success)
- [ ] Verify JSON download (always)

**Rollout Strategy**:
- [ ] 1 PAN → observe 24 hours
- [ ] 5 PANs → observe 48 hours
- [ ] 20 PANs → observe 1 week
- [ ] General availability (if all green)

**Abort Criteria**:
- [ ] >20% retry rate
- [ ] >5% terminal failures
- [ ] Any data corruption
- [ ] Any state machine violation

---

## Phase 3: CA Overlay (Now Safe)

### CA Features (Additive Only)

**CA Review Inbox**:
- [ ] CA can view assigned filings
- [ ] CA can add comments
- [ ] CA can approve/reject
- [ ] User sees CA feedback

**CA Requirement Enforcement**:
- [ ] S22 mandates CA for complex cases
- [ ] User cannot submit without CA approval
- [ ] CA positioned as safety net, not upsell

**Paid Assistance (Optional)**:
- [ ] CA help request flow
- [ ] Pricing transparency
- [ ] Payment integration
- [ ] CA assignment logic

**Critical**: CA features must NOT destabilize core filing flow.

---

## Phase 4: Pricing & Monetization

### Pricing Model (Recommendation)

**Free Tier**:
- Self-filing (ITR-1, ITR-2)
- JSON download
- Basic support

**Paid Tier**:
- CA review (₹999-1999)
- Priority support
- Audit assistance

**Enterprise**:
- Bulk filing
- Dedicated CA
- Custom integrations

**Principle**: Never paywall safety features (JSON download, submission status).

---

## Phase 5: Marketing & Positioning

### Messaging (Trust-First)

**Primary Message**:
"File your taxes with confidence. We handle the complexity."

**NOT**:
- "Save ₹X in taxes" (optimization-first)
- "AI-powered filing" (tech-first)
- "Faster than CAs" (speed-first)

**Trust Anchors**:
- Snapshot-based truth
- JSON always available
- CA optionality
- Plain language explanations

**Target Audience**:
- Salaried (₹8-25L)
- First-time filers
- CA-hesitant users
- Tech-comfortable taxpayers

---

## Phase 6: Failure Scenario Simulation

### Simulate Real-World Failures

**ERI Failures**:
- [ ] ERI timeout (retry logic)
- [ ] ERI rejection (terminal failure)
- [ ] Network failure (retry logic)
- [ ] Invalid credentials (abort)

**User Errors**:
- [ ] Incomplete data submission attempt (blocked)
- [ ] Edit after freeze (blocked)
- [ ] Invalid PAN (validation)
- [ ] Missing bank account (blocked)

**System Failures**:
- [ ] Database outage (graceful degradation)
- [ ] S24 engine failure (fallback)
- [ ] Snapshot creation failure (abort submission)

**Recovery Paths**:
- [ ] JSON download always available
- [ ] CA escalation path
- [ ] Manual retry option (for terminal failures)

---

## Critical Success Metrics

### User Metrics
- [ ] Completion rate (start → submit)
- [ ] Drop-off points (where users abandon)
- [ ] Time to complete (pacing)
- [ ] Return rate (multi-session filing)

### Technical Metrics
- [ ] ERI success rate (target: >95%)
- [ ] Retry rate (target: <10%)
- [ ] Terminal failure rate (target: <2%)
- [ ] Snapshot integrity (target: 100%)

### Trust Metrics
- [ ] User feedback (qualitative)
- [ ] Support ticket volume (lower is better)
- [ ] CA escalation rate (should be low for simple cases)
- [ ] JSON download rate (indicates trust in fallback)

---

## What NOT to Build (Discipline)

❌ **More Income Types** (until current flow validated)
❌ **AI Suggestions** (trust erosion risk)
❌ **Optimization Tips** (scope creep)
❌ **Notifications Spam** (annoyance)
❌ **Gamification** (wrong tone for tax)
❌ **Social Features** (privacy violation)

**Principle**: The product is calm, authoritative, and boring. Keep it that way.

---

## Launch Readiness Gates

### Gate 1: Reality Validation
- [ ] 10+ real filings completed
- [ ] No critical copy issues
- [ ] No sequencing confusion
- [ ] Users report feeling "safe"

### Gate 2: ERI Live Validation
- [ ] 1 PAN successful
- [ ] 5 PANs successful
- [ ] 20 PANs successful
- [ ] No state machine violations

### Gate 3: CA Overlay Validation
- [ ] CA review flow tested
- [ ] CA approval/rejection tested
- [ ] User feedback incorporated
- [ ] No core flow destabilization

### Gate 4: Launch
- [ ] All gates passed
- [ ] Support team trained
- [ ] Monitoring dashboards ready
- [ ] Rollback plan documented

---

## Final Checklist

- [ ] ITR filing feature is production-grade complete
- [ ] Reality validation plan documented
- [ ] ERI rollout strategy defined
- [ ] CA overlay scope frozen
- [ ] Pricing model proposed
- [ ] Marketing messaging drafted
- [ ] Failure scenarios simulated
- [ ] Success metrics defined
- [ ] Discipline maintained (no overbuilding)

---

## Next Action

**Immediate**: Begin Phase 1 (Reality Validation)
**Timeline**: 2-3 weeks
**Owner**: Product + Engineering
**Success Criteria**: Users feel safe without talking to a human

---

**The ITR filing feature is complete. The next phase is validation, not building.**
