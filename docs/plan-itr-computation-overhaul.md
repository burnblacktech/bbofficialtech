# ITR Computation Page - Complete Overhaul Plan

## Overview

The ITR computation page (`/itr/computation`) needs a comprehensive overhaul to:
1. Fix context-aware back navigation (currently always goes to `/itr/select-person`)
2. Ensure proper field changes for ITR-1, ITR-2, ITR-3, and ITR-4
3. Ensure proportional card design and data display
4. Validate all tax computations are correct
5. Align with UX.md and newUI.md specifications

## Current State Analysis

### Entry Points to Computation Page

1. **From DataSourceSelector** (`/itr/data-source`):
   - Form 16 upload flow → `dataSource: 'form16'`
   - AIS/26AS fetch → `dataSource: 'it-portal'`
   - Expert mode (I Know My ITR) → `dataSource: 'direct-selection'`
   - Guided mode (Guide Me) → `dataSource: 'guided-selection'`
   - Continue from Last Year → `dataSource: 'previous-year'`
   - Revised Return → `dataSource: 'revised-return'`

2. **From ITRDirectSelection** (`/itr/direct-selection`):
   - Expert mode selection → `mode: 'expert'`, `selectedITR`

3. **From IncomeSourceSelector** (`/itr/income-sources`):
   - Guided mode → `mode: 'guided'`, `selectedITR: recommendedITR`

4. **From ITRFormSelection** (`/itr/select-form`):
   - Form selection flow → `fromFormSelection: true`, `selectedITR`, `recommendation`

5. **Direct URL Access**:
   - `/itr/computation?draftId=xxx` - Resume draft
   - `/itr/filing/:filingId/*` - Edit existing filing
   - With `viewMode: 'readonly'` - View completed filing

### Current Issues

1. **Back Navigation**: Always goes to `/itr/select-person` regardless of entry point
2. **ITR Form Differences**: Fields change but need verification for all 4 forms
3. **Card Proportions**: Need to ensure BreathingGrid cards are properly sized
4. **Computation Validation**: Need to verify tax calculations match ITD rules
5. **Design System**: Need to ensure alignment with newUI.md

## Implementation Plan

### Phase 1: Context-Aware Back Navigation

**File:** `frontend/src/pages/ITR/ITRComputation.js`

#### 1.1 Track Entry Point
- Store entry point in component state from `location.state`
- Track `dataSource`, `fromFormSelection`, `mode`, etc.
- Store in localStorage for page refresh recovery

#### 1.2 Implement Smart Back Navigation
- If from `DataSourceSelector` → go back to `/itr/data-source`
- If from `ITRDirectSelection` → go back to `/itr/direct-selection` (or `/itr/data-source` if that was the source)
- If from `IncomeSourceSelector` → go back to `/itr/income-sources`
- If from `ITRFormSelection` → go back to `/itr/select-form`
- If direct URL (draft/filing) → go back to `/dashboard` or `/filing-history`
- Fallback: `/itr/select-person` if no entry point detected

#### 1.3 Update handleBack Function
Replace current `handleBack` (lines 691-706) with context-aware logic.

### Phase 2: ITR Form-Specific Field Changes

**File:** `frontend/src/pages/ITR/ITRComputation.js`

#### 2.1 Verify ITR-1 Fields
- Personal Info ✓
- Income: Salary, House Property (1 only), Other Sources
- NO Capital Gains
- NO Business Income
- NO Professional Income
- NO Multiple House Properties
- NO Foreign Income
- Deductions (Chapter VI-A)
- Taxes Paid
- Bank Details

#### 2.2 Verify ITR-2 Fields
- Personal Info ✓
- Income: Salary, Capital Gains, House Property (multiple), Other Sources, Foreign Income
- Schedule FA (Foreign Assets) - REQUIRED
- NO Business Income
- NO Professional Income
- Deductions (Chapter VI-A)
- Taxes Paid
- Bank Details

#### 2.3 Verify ITR-3 Fields
- Personal Info ✓
- Income: Salary, Business Income, Professional Income, Capital Gains, House Property, Other Sources, Foreign Income
- Business Income Section (P&L, multiple businesses)
- Professional Income Section (P&L, multiple professions)
- Balance Sheet (optional but recommended)
- Audit Information (if applicable)
- Schedule FA (Foreign Assets) - REQUIRED
- Deductions (Chapter VI-A)
- Taxes Paid
- Bank Details

#### 2.4 Verify ITR-4 Fields
- Personal Info ✓
- Income: Salary, Presumptive Income (44AD/44ADA), House Property, Other Sources
- Presumptive Income Section (44AD/44ADA/44AE)
- Goods Carriage Section (44AE)
- NO Capital Gains (unless from house property)
- NO Business Income (presumptive only)
- NO Professional Income (presumptive only)
- NO Balance Sheet
- Deductions (Chapter VI-A, limited)
- Taxes Paid
- Bank Details

#### 2.5 Update Section Rendering Logic
- Ensure `baseSections`, `itr3Sections`, `itr4Sections` are correctly filtered
- Verify `ComputationSection` component handles ITR-specific forms correctly
- Check that ITR-1/ITR-2/ITR-3/ITR-4 income forms are correctly rendered

### Phase 3: Proportional Card Design

**File:** `frontend/src/components/DesignSystem/BreathingGrid.js`

#### 3.1 Verify Card Sizes
- Glance: 72px width (per GRID_CONFIG)
- Summary: 200px width (per GRID_CONFIG)
- Detailed: 480-720px width (per GRID_CONFIG)
- Ensure cards maintain aspect ratios

#### 3.2 Verify Grid Layout
- Desktop: 3-column cards in summary mode
- Expanded: 1 detailed card + 2 glance cards on sides + summary cards below
- Tablet: 2-column cards
- Mobile: 1-column accordion

#### 3.3 Verify Card Content Proportions
- Ensure text sizes are consistent across cards
- Verify amounts display with proper formatting
- Check status badges are properly sized
- Ensure icons are proportional

### Phase 4: Tax Computation Validation

**File:** `frontend/src/components/ITR/core/ITRComputationEngine.js`

#### 4.1 Verify Tax Slabs (FY 2024-25)
- Old Regime: 0-2.5L (0%), 2.5L-5L (5%), 5L-10L (20%), 10L+ (30%)
- New Regime: 0-3L (0%), 3L-7L (5%), 7L-10L (10%), 10L-12L (15%), 12L-15L (20%), 15L+ (30%)

#### 4.2 Verify Rebate 87A
- Applicable if taxable income ≤ ₹5L
- Maximum rebate: ₹12,500
- Only in Old Regime

#### 4.3 Verify Cess Calculation
- Education and Health Cess: 4% of (Tax + Surcharge)
- Verify calculation matches ITD rules

#### 4.4 Verify Surcharge
- 10% if income > ₹50L and ≤ ₹1Cr
- 15% if income > ₹1Cr and ≤ ₹2Cr
- 25% if income > ₹2Cr and ≤ ₹5Cr
- 37% if income > ₹5Cr

#### 4.5 Verify Agricultural Income Partial Integration
- If non-agri income > ₹2.5L AND agri income > ₹5K
- Agricultural income is exempt but affects tax rate
- Tax calculated on non-agri income using rate applicable to (non-agri + agri) income

#### 4.6 Verify Deduction Limits
- 80C: ₹1.5L
- 80CCD(1B): ₹50K (additional to 80C)
- 80D: ₹25K (self) + ₹25K-50K (parents, based on age)
- 80G: As per section
- 80TTA: ₹10K (savings interest)
- 80TTB: ₹50K (senior citizens, savings interest)

### Phase 5: Design System Alignment

**File:** `frontend/src/pages/ITR/ITRComputation.js`

#### 5.1 Update Header Styling
- Use Gold palette for primary elements
- Use Plus Jakarta Sans for headings
- Ensure proper spacing (4px base unit)

#### 5.2 Update Tax Computation Bar
- Verify uses new design system colors
- Check typography matches newUI.md
- Ensure proper spacing and shadows

#### 5.3 Update Section Cards
- Verify use new elevation levels
- Check hover states use Gold accent
- Ensure animations use new easing curves

## Files to Update

1. **`frontend/src/pages/ITR/ITRComputation.js`** - Main computation page
2. **`frontend/src/components/ITR/core/ITRComputationEngine.js`** - Tax calculation engine
3. **`frontend/src/components/DesignSystem/BreathingGrid.js`** - Grid layout
4. **`frontend/src/components/DesignSystem/SectionCard.js`** - Card component
5. **`frontend/src/components/ITR/ComputationSection.js`** - Section forms

## Success Criteria

- [ ] Back button navigates to correct previous page based on entry point
- [ ] ITR-1 shows only allowed fields (no capital gains, business, etc.)
- [ ] ITR-2 shows capital gains, multiple properties, Schedule FA
- [ ] ITR-3 shows business/professional income, balance sheet, audit info
- [ ] ITR-4 shows presumptive income sections
- [ ] Cards are proportionally sized and responsive
- [ ] Tax computations match ITD rules exactly
- [ ] Agricultural income partial integration works correctly
- [ ] Design system colors, typography, spacing match newUI.md
- [ ] All validations pass
- [ ] No regressions in existing functionality

