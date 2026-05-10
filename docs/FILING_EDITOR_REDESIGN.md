# Filing Editor Redesign — Implementation Instructions

> This document is the authoritative spec for the filing editor redesign.
> Any agent working on the editor MUST read this before making changes.
> Last updated: 2026-05-10

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│ TOP BAR: [AY Dropdown] [Regime Toggle] Filing Info │ Status │ Save     │
├──────────┬──────────────────────────────────────────────┬───────────────┤
│ LEFT NAV │  FIXED VIEWPORT (no scroll)                  │ RIGHT PANEL   │
│ (220px)  │  (height: calc(100vh - topbar - bottombar))  │ (280px)       │
├──────────┼──────────────────────────────────────────────┼───────────────┤
│          │ BOTTOM BAR: Live Computation (fixed)                         │
│          │ Gross │ Deductions │ Taxable │ Tax │ Cess │ TDS │ Result    │
└──────────┴──────────────────────────────────────────────┴───────────────┘
```

---

## 1. Top Bar Behavior

### Assessment Year Dropdown
- **Default state**: Locked, shows current AY (e.g., "AY 2026-27")
- **Activates only if**: User has past filings (check `/api/filings` on load)
- **When activated**: Shows dropdown with AYs that have filings
- **Selecting past AY**: Loads that filing in READ-ONLY mode (all fields locked, "Filed" badge)
- **Current AY**: Editable (normal filing flow)

### Regime Toggle
- Position: Top bar, after AY dropdown
- Two buttons: [Old Regime] [New Regime]
- Active state: filled background
- Switching triggers recomputation
- If switch increases tax: show confirmation dialog

### Filing Info (top bar, right side)
- Name (from personalInfo)
- PAN (masked: XXXXX****F)
- ITR type badge (ITR-1, ITR-2, etc.)
- Save status indicator (dot + "Saved" / "Saving...")

---

## 2. Center Viewport (Fixed Dimensions)

### Rules
- Height: `calc(100vh - 48px topbar - 52px bottombar)` = exactly the remaining space
- Width: fills between left nav and right panel
- **NEVER scrolls** at the page level
- If a section's content exceeds viewport: section scrolls INTERNALLY (overflow-y: auto on the section container)
- Each section is a bordered card with sub-sections inside

### Section Layout Pattern
```
┌─ SECTION TITLE ──────────────────────────────────────────┐
│                                                          │
│  ┌─ Sub-section A ──────┐  ┌─ Sub-section B ──────────┐ │
│  │ Field 1              │  │ Field 4                   │ │
│  │ Field 2              │  │ Field 5                   │ │
│  │ Field 3              │  │ Field 6                   │ │
│  └──────────────────────┘  └──────────────────────────┘ │
│                                                          │
│  ┌─ Sub-section C (full width) ────────────────────────┐ │
│  │ Field 7    │ Field 8    │ Field 9                   │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### Sub-section Visual Design
- Each sub-section: bordered container (1px solid border-light)
- Sub-section header: 11px uppercase bold, gray background strip
- Gap between sub-sections: 12px
- Sub-sections placed side-by-side when they're related (Contact + Address)
- Sub-sections stacked when sequential (Identity → Contact/Address → Filing Details)

---

## 3. Bottom Computation Bar (Fixed)

### Layout
```
┌──────────────────────────────────────────────────────────────────────┐
│ Gross: ₹8,00,000 │ Ded: -₹1,75,000 │ Taxable: ₹6,25,000 │         │
│ Tax: ₹0 │ Cess: ₹0 │ TDS: ₹40,000 │ REFUND: ₹40,000 │ [Submit]  │
└──────────────────────────────────────────────────────────────────────┘
```

### Rules
- Height: 52px (2 rows of numbers + submit button)
- Always visible, never scrolls
- Numbers update live after each save (debounced 800ms)
- Refund in green, Payable in red
- Submit button: right-aligned, disabled until complete
- PDF/JSON: small icon buttons next to Submit

---

## 4. Right Panel Content

### Structure (top to bottom)
1. **Completion Checklist** — sections with ✓/○ status
2. **Tax Saving Tips** — contextual, based on unfilled deductions
3. **Document Upload** — relevant documents for current section
4. **Import History** — past imports with status

### Document Upload Behavior
- Shows documents relevant to the ACTIVE section:
  - Personal Info active → "Upload Aadhaar"
  - Salary active → "Upload Form 16"
  - Bank active → "Upload 26AS"
- Upload → Parse → Review Modal → Confirm → Auto-fill section
- After auto-fill: navigate to the filled section, highlight populated fields

---

## 5. Left Nav Behavior

### Sections
```
INCOME
  ● Personal Info
  ○ Salary
  ○ House Property
  ○ Other Income
  + Add Source

DEDUCTIONS
  ○ 80C · Investments
  ○ 80D · Health
  + Add Deduction

FINALIZE
  ○ Bank & Verify

━━━━━━━━━━━━━━━━
3/8 complete
```

### Deductions Sub-nav
- Each claimed deduction shows as a separate nav item
- "+" button opens a picker showing unclaimed deductions (faded = already added)
- Clicking an already-added deduction: opens that specific deduction editor
- Each deduction item shows amount: "80C · ₹1.5L ✓"

---

## 6. Aadhaar Verification & Lock Behavior

### Flow
1. User enters Aadhaar → clicks "Verify via OTP"
2. OTP verified → auto-fills: name, DOB, gender, address
3. Fields lock with "Verified via Aadhaar" badge
4. Lock persists for THIS FILING YEAR only

### Lock Rules
- Locked fields: firstName, lastName, DOB, gender, address (all from Aadhaar)
- PAN-verified fields: firstName, lastName, DOB, PAN (from PAN verification)
- Lock priority: Aadhaar > PAN (Aadhaar is more authoritative for address)
- Next year: must re-verify (Aadhaar data may have changed)
- User can click "Update" to re-verify (triggers new OTP)

### Storage
- `filing.jsonPayload.personalInfo.aadhaarVerifiedAt` — timestamp of last verification
- `filing.jsonPayload.personalInfo.aadhaarLocked` — boolean
- If `aadhaarVerifiedAt` is in a previous FY → show "Re-verify for this year" prompt

---

## 7. AY Selection & Past Filing Logic

### At Filing Start
1. Check if user has existing filings: `GET /api/filings`
2. If draft exists for current AY → resume it
3. If no draft → create new filing for current AY
4. User does NOT choose AY at start (always current AY for new filings)

### For Past/Revised Filings
- User goes to Filing History → selects a past filing
- If filed (eri_success): opens in READ-ONLY mode
- If user wants to revise: clicks "File Revised Return"
  - Creates new filing with `filingType: 'revised'`
  - Copies data from original
  - Requires original acknowledgment number
  - Filing Status auto-set to "R" (Revised)

### Belated Filing (past due date)
- If current date > July 31 of AY start year:
  - Filing Status auto-set to "B" (Belated)
  - Show warning: "Belated return — interest u/s 234A may apply"
  - Late fee u/s 234F: ₹5,000 (or ₹1,000 if income ≤ ₹5L)

### Updated Return (Section 139(8A))
- Available only for AY 2020-21 onwards
- Must be filed within 24 months from end of relevant AY
- Additional tax: 25% (within 12 months) or 50% (12-24 months)
- Filing Status: "U" (Updated)
- Requires reason selection

---

## 8. Dropdown Width Fix

### Problem
Selects with `max-width: 200px` cut off text like "Private Sector (OTH)"

### Solution
- Filing Details section uses `unit-grid--2col` (wider cells: 280px)
- Or: use abbreviations in dropdown display:
  - "Resident (RES)" → "Resident"
  - "Private Sector (OTH)" → "Private Sector"
  - Show code in parentheses only in the hint text below

---

## 9. Implementation Order

1. ☐ Fix dropdown widths (Filing Details → 2-col grid, wider selects)
2. ☐ Implement bordered sub-sections (Contact + Address side by side)
3. ☐ Move computation to bottom bar (fixed 52px)
4. ☐ Move tips + checklist + documents to right panel
5. ☐ Add AY dropdown to top bar (locked unless past filings exist)
6. ☐ Add regime toggle to top bar
7. ☐ Implement Aadhaar lock behavior (per-filing-year)
8. ☐ Add document upload to right panel (contextual per section)
9. ☐ Implement read-only mode for past filings
10. ☐ Add belated/revised filing logic

---

## 10. Questions Resolved

| Question | Answer |
|----------|--------|
| Where is regime toggle? | Top bar |
| Where is AY dropdown? | Top bar (locked unless past filings) |
| Past filing selected? | Read-only locked form |
| Section exceeds viewport? | Internal scroll within section container |
| Deductions layout? | Each deduction = separate nav item |
| Document upload? | Right panel, contextual per active section |
| Aadhaar lock? | Per filing year, re-verify annually |
| Bottom bar content? | Full computation breakdown + Submit + PDF/JSON |
