# BurnBlack V4 Architecture

**Version**: 4.0-stable  
**Status**: 🔒 **PRODUCTION LOCKED**  
**Date**: 2025-12-31

---

## Overview

The BurnBlack ITR Platform is an enterprise-grade tax filing system built on a **regulator-defensible architecture**. This document provides a high-level overview of the system's design principles and structural guarantees.

---

## Core Principles

### 1. Single Submission Spine

There is **exactly ONE path** by which a filing can move from draft → filed. All state transitions flow through `SubmissionStateMachine`, ensuring:

- ✅ No hidden state changes
- ✅ No bypass paths
- ✅ Complete audit trail
- ✅ Regulator-defensible flow

### 2. State Machine Authority

The `SubmissionStateMachine` is the **sole arbiter** of valid state transitions. Invalid transitions fail loudly with `INVALID_TRANSITION` errors.

### 3. Audit as Transactional Gate

Every state transition is audited. **Audit failures block the transition**. This ensures:

- ✅ Immutable audit trail
- ✅ No orphaned state changes
- ✅ Complete "who/what/when/why" context

### 4. Thin Controllers

Controllers are orchestration layers only. They:

- ✅ Delegate to services
- ✅ Handle HTTP concerns
- ❌ Do NOT contain business logic
- ❌ Do NOT mutate state directly

### 5. No Legacy Code

The `_legacy/` pattern is retired. Dead code is deleted, not quarantined. Git is the archive.

---

## Architecture Layers

```
┌─────────────────────────────────────────┐
│           HTTP Layer (Routes)           │
│  /auth, /members, /documents, /ca      │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│      Controllers (Orchestration)        │
│  CAController, MemberController, etc.   │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│         Services (Business Logic)       │
│  CAApprovalService, AuditService, etc.  │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│      Domain Layer (State Machine)       │
│     SubmissionStateMachine (SOLE        │
│          AUTHORITY FOR STATE)           │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│      Workers (Async Processing)         │
│  SubmissionWorker, ERIGatewayAdapter    │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│         Database (Persistence)          │
│  ITRFiling, AuditEvent, User, etc.      │
└─────────────────────────────────────────┘
```

---

## Submission Flow

```
User Action
    ↓
Controller (HTTP)
    ↓
Service (Business Logic)
    ↓
State Machine (Validation + Transition)
    ↓
Audit Service (Immutable Log)
    ↓
Database (Persist)
    ↓
Worker (Async ERI Submission)
    ↓
State Machine (Success/Failure Transition)
    ↓
Audit Service (Log Result)
    ↓
Database (Final State)
```

---

## Enforcement Mechanisms

### ESLint Rules (Automated)

1. **No Direct State Mutation**: Blocks `filing.status =` assignments
2. **No Controller DB Access**: Controllers cannot import models directly
3. **Architecture Violations**: Fail CI/CD builds

### Pre-Commit Hooks

1. **Lint Check**: Runs ESLint with architecture rules
2. **Legacy Check**: Blocks creation of `_legacy/` directories
3. **State Mutation Scan**: Detects direct status assignments

### Documentation

- **S7_LOCK.md**: Complete architecture contract (regulator-ready)
- **s6_routes.md**: Route reachability matrix
- **s6_controllers.md**: Controller authority map
- **s6_submission_spine.md**: Submission spine verification

---

## Production Readiness

### Verified Guarantees

✅ **Single Spine**: One path from draft → filed  
✅ **State Machine Authority**: No bypasses (except documented admin rescue)  
✅ **100% Audit Coverage**: Every transition logged  
✅ **Thin Controllers**: No business logic in HTTP layer  
✅ **Zero Legacy Code**: `_legacy/` physically deleted  
✅ **Clean Boot**: Backend starts without errors  
✅ **Automated Enforcement**: ESLint + pre-commit hooks active

### Compliance Artifacts

For auditors, regulators, and compliance teams:

- **Audit Trail**: Query `audit_events` table for complete history
- **State Graph**: Review `SubmissionStateMachine.js` for transition rules
- **Route Inventory**: See `s6_routes.md` for all endpoints
- **Controller Compliance**: See `s6_controllers.md` for delegation patterns
- **Architecture Contract**: See `S7_LOCK.md` for immutable rules

---

## Development Guidelines

### Adding New Features

1. **Routes**: Classify as V1/V3/V4/Infrastructure
2. **Controllers**: Keep thin, delegate to services
3. **Services**: Implement business logic, call domain layer
4. **State Changes**: ALWAYS use `SubmissionStateMachine.transition()`
5. **Audit**: Log all critical actions via `AuditService`

### Prohibited Patterns

❌ Direct state mutation (`filing.status = ...`)  
❌ Controllers importing models  
❌ Business logic in controllers  
❌ Bypassing state machine  
❌ Creating `_legacy/` directories  
❌ Require-time side effects

---

## Architecture Contract

**This architecture is frozen.**

All rules are defined in **S7_LOCK.md** and enforced by tooling. Changes to core contracts require:

1. Architectural review
2. Impact analysis
3. Migration plan
4. Version bump to V5.0

---

## Version History

| Version | Date | Status |
|---------|------|--------|
| 4.0-stable | 2025-12-31 | 🔒 Production Locked |

---

## Contact

For architecture questions or compliance inquiries, refer to:

- **S7_LOCK.md**: Complete architecture contract
- **Development Team**: BurnBlack Engineering

---

**This architecture cannot lie. This architecture cannot drift. This architecture is frozen.**

**Next Phase**: V5 (Revenue & Operations Layer)
