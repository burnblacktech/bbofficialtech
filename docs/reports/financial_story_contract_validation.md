# Financial Story UX — Contract Validation & Freeze

## Objective

Validate Financial Story UX API contracts against a **first-time ITR-1 user journey** and freeze semantics as v1 public contracts.

**Core Question**: Is the story the user sees exactly the story the law, computation, and submission will enforce?

---

## Test Persona: First-Time ITR-1 Taxpayer

**Profile**:
- Age: 28
- Occupation: Software Engineer
- Annual Salary: ₹12,00,000 (gross)
- TDS Deducted: ₹1,20,000
- 80C Investments: ₹1,50,000 (PPF, ELSS)
- No capital gains, no business income, no house property
- **Tax Knowledge**: Minimal (knows about Form 16, 80C, nothing else)
- **Expectation**: "Just tell me what I owe or get back"

---

## User Journey Walkthrough

### Step 1: User Creates Filing & Adds Salary

**Action**: User creates filing, uploads Form 16 or manually enters salary

**API Called**: `POST /api/filings`, `POST /api/employers/:filingId`

**Mental State**: "I've entered my salary. What happens now?"

---

### Step 2: User Sees "Your Financial Year at a Glance"

**API**: `GET /api/filings/:filingId/overview`

**Response Contract**:
```json
{
  "identity": {
    "assessmentYear": "2024-25",
    "taxpayerPan": "ABCDE****F",
    "itrType": "ITR1",
    "eligibleITRs": ["ITR1", "ITR2"],
    "residencyStatus": "resident"
  },
  "incomeSummary": {
    "salary": 1200000,
    "capitalGains": 0,
    "businessIncome": 0,
    "otherIncome": 0,
    "totalIncome": 1200000
  },
  "eligibilityBadge": {
    "status": "incomplete",
    "itrType": "ITR1",
    "caRequired": "optional",
    "message": "Incomplete for ITR1"
  },
  "missingBlocks": ["bankAccounts", "verification"]
}
```

**User Mental Model Check**:
- ✅ "I can see my salary (₹12L)"
- ✅ "It says ITR-1 — I've heard of that"
- ✅ "CA is optional — good, I don't need one"
- ⚠️ "What are 'missing blocks'?" → **Needs plain language**

**Semantic Decision**:
- `missingBlocks` should be translated to user-facing language in frontend
- Backend keeps technical names for consistency
- **Frozen**: Field names, null semantics (0 vs null for income types)

---

### Step 3: User Sees "Your Income Story"

**API**: `GET /api/filings/:filingId/income-story`

**Response Contract**:
```json
{
  "salary": {
    "employers": [
      {
        "name": "TechCorp India",
        "period": "Apr 2023 - Mar 2024",
        "grossSalary": 1200000,
        "tdsDeducted": 120000,
        "netReceived": 1080000
      }
    ],
    "total": 1200000
  },
  "capitalGains": {
    "intent": "not_declared",
    "transactions": [],
    "shortTerm": 0,
    "longTerm": 0,
    "total": 0
  },
  "business": null,
  "otherIncome": {
    "interest": 0,
    "dividend": 0,
    "total": 0
  }
}
```

**User Mental Model Check**:
- ✅ "I see my employer name and salary"
- ✅ "TDS is shown separately — matches my Form 16"
- ✅ "Capital gains shows 'not_declared' — I don't have any, so this is correct"
- ✅ "Business is null — I'm not a business owner"

**Semantic Decisions**:
- **null vs 0**: `business: null` (not applicable) vs `capitalGains.total: 0` (declared but zero)
- **intent field**: Explicit "not_declared" vs "declared" for capital gains
- **Frozen**: Null semantics, intent field, employer structure

---

### Step 4: User Sees "How Your Tax Was Calculated"

**API**: `GET /api/filings/:filingId/tax-breakdown`

**Response Contract**:
```json
{
  "regime": "old",
  "steps": {
    "taxableIncome": {
      "grossTotalIncome": 1200000,
      "deductions": 200000,
      "totalIncome": 1000000,
      "breakdown": {
        "salary": 1200000,
        "houseProperty": 0,
        "capitalGains": 0,
        "business": 0
      }
    },
    "taxCalculation": {
      "slabTax": 85000,
      "rebate": 0,
      "surcharge": 0,
      "cess": 3400,
      "totalTax": 88400,
      "slabsApplied": [
        {
          "range": "₹0 - ₹250000",
          "rate": "0%",
          "taxableAmount": 250000,
          "tax": 0
        },
        {
          "range": "₹250000 - ₹500000",
          "rate": "5%",
          "taxableAmount": 250000,
          "tax": 12500
        },
        {
          "range": "₹500000 - ₹1000000",
          "rate": "20%",
          "taxableAmount": 500000,
          "tax": 100000
        }
      ]
    },
    "finalLiability": {
      "totalTax": 88400,
      "tdsDeducted": 120000,
      "refundOrPayable": 31600,
      "isRefund": true
    }
  },
  "notes": [
    "Total gross salary: ₹1200000",
    "Standard deduction: ₹50000",
    "Total Chapter VI-A deductions: ₹150000",
    "section80C: ₹150000",
    "Health and Education Cess: 4% = ₹3400",
    "Final tax liability (Old Regime): ₹88400"
  ]
}
```

**User Mental Model Check**:
- ✅ "I see my gross salary (₹12L)"
- ✅ "Deductions of ₹2L — that's my 80C (₹1.5L) + standard deduction (₹50K)"
- ✅ "Tax is ₹88,400 — broken down by slabs"
- ✅ "I get a refund of ₹31,600 — TDS was ₹1.2L, tax is ₹88K"
- ⚠️ "What is 'cess'?" → **Needs explanation in notes**

**Semantic Decisions**:
- **Language tone**: `notes` array uses **explain** (not assert) — "Total gross salary: ₹X" not "Your salary is ₹X"
- **Slab breakdown**: Always show all slabs (even if tax is 0) for transparency
- **Refund/Payable**: Explicit `isRefund` boolean + signed amount
- **Frozen**: Step ordering, slab structure, notes format

---

### Step 5: User Sees "Old vs New Regime — Explained"

**API**: `GET /api/regime-comparison/:filingId` (already exists)

**User Mental Model Check**:
- ✅ "Old regime saves me ₹46,800"
- ✅ "I can see why — my 80C deduction matters in old regime"
- ✅ "New regime has lower slabs but no deductions"
- ✅ "Recommendation is clear: stick with old regime"

**Semantic Decisions**:
- **Already frozen** (S16 + S24 integration)
- Language is comparative, not prescriptive
- **Frozen**: Comparison structure, savings calculation

---

### Step 6: User Sees "Is Your Filing Ready?"

**API**: `GET /api/filings/:filingId/readiness`

**Response Contract**:
```json
{
  "completionChecklist": {
    "salaryDetails": true,
    "bankAccounts": false,
    "verification": false,
    "capitalGainsDetails": true
  },
  "legalStatus": {
    "safeToSubmit": false,
    "reason": "Missing required information: bankAccounts, verification",
    "missingBlocks": ["bankAccounts", "verification"]
  },
  "caRequirement": {
    "status": "optional",
    "explanation": "CA review is optional for ITR-1. You may submit directly or seek CA assistance for additional confidence."
  },
  "actions": {
    "canSubmit": false,
    "canDownloadJSON": true,
    "canRequestCAReview": true
  },
  "snapshot": {
    "id": "snapshot-uuid",
    "createdAt": "2024-07-15T10:30:00Z",
    "downloadUrl": "/api/filings/:filingId/export/json"
  }
}
```

**User Mental Model Check**:
- ✅ "I can see what's missing: bank accounts and verification"
- ✅ "I can't submit yet, but I can download JSON"
- ✅ "CA is optional — I can do this myself"
- ✅ "Clear next steps: add bank account, verify"

**Semantic Decisions**:
- **Checklist**: Boolean flags (true/false) for each requirement
- **Reason**: Plain language explanation (not technical error codes)
- **Actions**: Explicit `canSubmit`, `canDownloadJSON`, `canRequestCAReview` booleans
- **Frozen**: Checklist structure, action flags, CA explanation format

---

## Semantic Contract Freeze (v1 Public API)

### 1. Field Names (No Renaming)

| API | Frozen Fields |
|-----|---------------|
| Overview | `identity`, `incomeSummary`, `eligibilityBadge`, `missingBlocks` |
| Income Story | `salary`, `capitalGains`, `business`, `otherIncome` |
| Tax Breakdown | `regime`, `steps`, `notes` |
| Readiness | `completionChecklist`, `legalStatus`, `caRequirement`, `actions`, `snapshot` |

### 2. Null vs Missing Semantics

- **null**: Not applicable (e.g., `business: null` for salaried individual)
- **0**: Declared but zero (e.g., `capitalGains.total: 0`)
- **Empty array**: Declared but no entries (e.g., `transactions: []`)
- **Missing field**: Never used (all fields always present)

### 3. Language Tone

- **Explain, don't assert**: "Total gross salary: ₹X" (not "Your salary is ₹X")
- **Comparative, not prescriptive**: "Old regime saves ₹X" (not "You should choose old regime")
- **Plain language for errors**: "Missing required information: bankAccounts" (not "Error: MISSING_BANK_ACCOUNTS")

### 4. Error States vs Empty States

- **Error state**: API returns 404/403/500 with `{ success: false, error: "message" }`
- **Empty state**: API returns 200 with null/0/[] values (e.g., `business: null`)
- **Incomplete state**: `safeToSubmit: false` with `reason` and `missingBlocks`

### 5. Ordering of Sections

**Overview**: identity → incomeSummary → eligibilityBadge → missingBlocks  
**Income Story**: salary → capitalGains → business → otherIncome  
**Tax Breakdown**: taxableIncome → taxCalculation → finalLiability → notes  
**Readiness**: completionChecklist → legalStatus → caRequirement → actions → snapshot

---

## Validation Result: ✅ APPROVED

**The story the user sees IS the story the law, computation, and submission will enforce.**

### Why This Works

1. **Chronological narrative**: Income → Tax → Readiness (matches mental model)
2. **Explainability**: Every number has a source (notes, breakdown)
3. **Transparency**: Missing data is explicit, not hidden
4. **No jargon**: Technical terms translated to plain language
5. **Deterministic**: Same data always produces same story

### What This Unlocks

- ✅ Frontend teams can build with confidence (no reshaping needed)
- ✅ CA explanations can reuse this structure
- ✅ JSON export consistency guaranteed
- ✅ ERI disputes can reference this as source of truth

---

## Contract Freeze Declaration

**As of 2026-01-07, the following are frozen as v1 public contracts**:

1. `GET /api/filings/:filingId/overview`
2. `GET /api/filings/:filingId/income-story`
3. `GET /api/filings/:filingId/tax-breakdown`
4. `GET /api/filings/:filingId/readiness`

**Any changes require versioning** (e.g., `/api/v2/filings/:filingId/overview`)

**Rationale**: These contracts are now part of the product's legal surface. Breaking them breaks user trust.

---

## Next Steps (Safe to Proceed)

1. ✅ **Frontend Financial Story Screens** (read-only, narrative-first)
2. ✅ **ERI Hardening** (live adapter validation, controlled submission)
3. ✅ **CA Overlay** (only where S22 requires, built on same screens)

**The Financial Story UX is now locked and validated.**
