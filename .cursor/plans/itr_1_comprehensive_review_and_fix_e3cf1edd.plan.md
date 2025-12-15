---
name: ITR 1 Comprehensive Review and Fix
overview: Comprehensive review and fix of ITR 1 filing process covering all entry/exit points, JSON download, draft saving, form filtering, and ITR 1 specific validations and computations.
todos:
  - id: nav-route-verification
    content: Verify all routes in App.js are accessible and properly configured
    status: in_progress
  - id: nav-header-audit
    content: Audit Header.js navigation links and fix broken routes
    status: pending
  - id: nav-sidebar-audit
    content: Audit Sidebar.js navigation links and verify all paths exist
    status: pending
  - id: nav-footer-audit
    content: Audit Footer.js links and verify all routes are defined
    status: pending
  - id: nav-itr-flow
    content: Review ITR journey navigation flow and fix broken state passing
    status: pending
  - id: color-help-center
    content: Replace non-brand colors in HelpCenter.js (royal, green, purple, red) with brand colors
    status: pending
  - id: color-footer
    content: Replace blue-purple gradient in Footer.js with aurora-gradient
    status: pending
  - id: color-header-sidebar
    content: Replace burn-gradient in Header.js and Sidebar.js with aurora-gradient
    status: pending
  - id: color-scan-pages
    content: Scan all pages for non-brand colors and replace with brand colors
    status: pending
  - id: color-scan-components
    content: Scan all components for non-brand colors and replace with brand colors
    status: pending
  - id: ui-spacing-audit
    content: Audit spacing across all pages and ensure 4px base unit consistency
    status: pending
  - id: ui-typography-audit
    content: Audit typography and ensure consistent heading/body text sizes
    status: pending
  - id: ui-border-radius
    content: Audit border radius and ensure consistent rounding patterns
    status: pending
  - id: ui-shadows
    content: Audit shadows/elevation and ensure consistent usage
    status: pending
  - id: ui-responsive
    content: Audit responsive design and ensure mobile-first consistency
    status: pending
---

# ITR 1 Comprehensive Review and Fix Plan

## Overview

This plan provides a thorough review and fix of the ITR 1 (SAHAJ) filing process, ensuring all entry/exit points work correctly, JSON download functions properly, drafts save/load correctly, and only ITR 1 specific forms are displayed with proper conditions and computations.

## Current State Analysis

### Entry Points

1. **From DataSourceSelector** (`/itr/data-source`)

- State passed: `selectedPerson`, `dataSource`, `selectedITR`, `mode`
- Route: `/itr/computation`

2. **From ITRFormSelection** (`/itr/form-selection`)

- State passed: `selectedITR`, `selectedPerson`, `mode`
- Route: `/itr/computation`

3. **From ITRDirectSelection** (`/itr/direct-selection`)

- State passed: `selectedITR`, `selectedPerson`, `userProfile`, `mode`
- Route: `/itr/computation`

4. **From IncomeSourceSelector** (`/itr/income-sources`)

- State passed: `recommendedITR`, `selectedPerson`, `selectedSources`, `mode`
- Route: `/itr/computation`

5. **From DocumentUploadHub** (`/itr/document-upload`)

- State passed: `selectedPerson`, `documents`, `dataSource`
- Route: `/itr/computation`

6. **Direct Access via Draft/Filing ID**

- URL params: `?draftId=xxx` or `?filingId=xxx`
- Route: `/itr/computation`

7. **From Dashboard/Filing History**

- URL params: `?filingId=xxx`
- Route: `/itr/computation`

### Exit Points

1. **Save Draft** → Stays on page, updates URL with draftId
2. **Submit ITR** → Navigates to `/itr/acknowledgment?filingId=xxx`
3. **Download JSON** → Downloads file, stays on page
4. **Back Navigation** → Returns to previous page based on entry point

### Current Issues Identified

1. **Entry Point Recovery**: Entry point stored in localStorage but may not be properly restored on page refresh
2. **ITR Type Validation**: ITR type can be changed after entry, but validation may not catch incompatible data
3. **Form Filtering**: `shouldShowSection` function exists but may not cover all edge cases
4. **JSON Export**: ITR 1 specific fields may not be fully populated
5. **Draft Saving**: Draft saving may not preserve all ITR 1 specific data structures
6. **Computation Logic**: ITR 1 specific computations may not be isolated from other ITR types

## Implementation Tasks

### Task 1: Entry Points Review and Fix

**Files to Review:**

- `frontend/src/pages/ITR/ITRComputation.js` (lines 125-190, 138-165)
- `frontend/src/components/ITR/DataSourceSelector.js`
- `frontend/src/pages/ITR/ITRFormSelection.js`
- `frontend/src/pages/ITR/ITRDirectSelection.js`
- `frontend/src/pages/ITR/IncomeSourceSelector.js`
- `frontend/src/pages/ITR/DocumentUploadHub.js`

**Actions:**

1. Verify all entry points pass correct state for ITR 1
2. Ensure `selectedITR` is set to 'ITR-1' when appropriate
3. Fix entry point recovery from localStorage on page refresh
4. Add route guard to prevent invalid ITR type changes for ITR 1
5. Ensure `selectedPerson` is always available for ITR 1

**Validation:**

- Test each entry point with ITR 1 selection
- Verify state is correctly passed and restored
- Test page refresh recovery

### Task 2: Exit Points Review and Fix

**Files to Review:**

- `frontend/src/pages/ITR/ITRComputation.js` (lines 2238-2295, 2480-2525, 2664-2704)

**Actions:**

1. Verify draft saving preserves all ITR 1 data
2. Ensure JSON download includes all ITR 1 specific fields
3. Fix submission flow to properly validate ITR 1 before exit
4. Ensure acknowledgment navigation includes all required data
5. Add proper cleanup on exit (clear temporary data, etc.)

**Validation:**

- Test draft save and reload for ITR 1
- Test JSON download for ITR 1
- Test submission and verify acknowledgment page receives correct data

### Task 3: JSON Download Functionality Fix

**Files to Review:**

- `frontend/src/services/itrJsonExportService.js` (lines 1212-1267)
- `frontend/src/pages/ITR/ITRComputation.js` (lines 2480-2525)

**Actions:**

1. Verify ITR 1 specific fields are correctly populated in JSON export:

- `ITR1_Specific.Income_from_Salary_Detailed`
- `ITR1_Specific.Income_from_House_Property_Detailed`
- `ITR1_Specific.Business_Income_Already_Covered` (should be 'NO')
- `ITR1_Specific.Capital_Gains_Already_Covered` (should be 'NO')

2. Ensure salary details from Form 16 are properly mapped
3. Ensure house property details are properly formatted (only one property allowed)
4. Add validation to ensure JSON is ITR 1 compliant before download
5. Fix any missing field mappings for ITR 1

**Validation:**

- Generate JSON for ITR 1 with all sections filled
- Verify JSON structure matches ITD requirements
- Test JSON validation before download

### Task 4: Draft Saving and Loading Fix

**Files to Review:**

- `frontend/src/pages/ITR/ITRComputation.js` (lines 2238-2295, 2422-2478, 1899-1995)
- `frontend/src/services/api/itrService.js` (lines 21-49)

**Actions:**

1. Ensure draft saving includes:

- `selectedITR` (must be 'ITR-1' or 'ITR1')
- Complete `formData` structure
- `assessmentYear`
- `taxRegime`
- `selectedPerson`

2. Fix draft loading to restore ITR 1 specific data structures
3. Ensure draft updates preserve ITR 1 constraints
4. Add validation to prevent saving invalid ITR 1 data
5. Fix auto-save functionality for ITR 1

**Validation:**

- Save draft with ITR 1 data
- Reload page and verify draft loads correctly
- Verify all ITR 1 specific fields are preserved
- Test auto-save functionality

### Task 5: ITR 1 Specific Form Filtering

**Files to Review:**

- `frontend/src/pages/ITR/ITRComputation.js` (lines 2831-2904, 2706-2746)
- `frontend/src/components/ITR/ComputationSection.js`

**Actions:**

1. Verify `shouldShowSection` correctly hides:

- `businessIncome` section
- `professionalIncome` section
- `balanceSheet` section
- `auditInfo` section
- `scheduleFA` section
- `presumptiveIncome` section
- `goodsCarriage` section

2. Ensure income section only shows:

- Salary income (from Form 16)
- House property (max 1 property)
- Other sources (interest, dividends, etc.)
- NO capital gains sub-section
- NO business income sub-section
- NO professional income sub-section

3. Add runtime validation to prevent showing hidden sections
4. Ensure section titles are ITR 1 specific (e.g., "Salary Income (From Form 16)")

**Validation:**

- Verify only ITR 1 sections are visible
- Test section filtering when ITR type is changed
- Verify section titles are correct for ITR 1

### Task 6: ITR 1 Specific Validations and Computations

**Files to Review:**

- `frontend/src/components/ITR/core/ITRValidationEngine.js` (lines 789-826)
- `frontend/src/pages/ITR/ITRComputation.js` (lines 391-1046, 2566-2662)

**Actions:**

1. Verify ITR 1 validation rules:

- Total income ≤ ₹50 lakhs
- Agricultural income ≤ ₹5,000
- No business income
- No capital gains
- Maximum 1 house property

2. Ensure validation runs on:

- Form data changes
- Before draft save
- Before JSON export
- Before submission

3. Fix computation logic to:

- Only calculate ITR 1 applicable income
- Exclude business/professional income from calculations
- Exclude capital gains from calculations
- Handle single house property correctly

4. Add real-time validation feedback for ITR 1 violations

**Validation:**

- Test validation with invalid ITR 1 data (e.g., business income > 0)
- Verify error messages are clear and actionable
- Test computation with ITR 1 specific scenarios

### Task 7: Data Structure Consistency

**Files to Review:**

- `frontend/src/pages/ITR/ITRComputation.js` (lines 225-400)
- `frontend/src/services/itrJsonExportService.js`

**Actions:**

1. Ensure formData structure for ITR 1:

- `income.businessIncome` should be `0` (not object)
- `income.professionalIncome` should be `0` (not object)
- `income.capitalGains` should be `0` (not object)
- `income.houseProperty.properties` should be array with max 1 item
- No `balanceSheet` object
- No `auditInfo` object
- No `scheduleFA` object

2. Fix initialization to set correct defaults for ITR 1
3. Ensure data structure is consistent across:

- Form state
- Draft saving
- JSON export
- Validation

**Validation:**

- Verify formData structure matches ITR 1 requirements
- Test data consistency across save/load/export

## Testing Checklist

### Entry Points

- [ ] DataSourceSelector → ITR 1 computation
- [ ] ITRFormSelection → ITR 1 computation
- [ ] ITRDirectSelection → ITR 1 computation
- [ ] IncomeSourceSelector → ITR 1 computation
- [ ] DocumentUploadHub → ITR 1 computation
- [ ] Direct draft/filing ID access
- [ ] Dashboard/Filing History → ITR 1 computation
- [ ] Page refresh recovery

### Exit Points

- [ ] Save draft and reload
- [ ] Submit ITR and verify acknowledgment
- [ ] Download JSON and verify structure
- [ ] Back navigation from various entry points

### JSON Download

- [ ] JSON contains all ITR 1 specific fields
- [ ] JSON structure is ITD compliant
- [ ] JSON validation works correctly
- [ ] File download triggers correctly

### Draft Saving

- [ ] Draft saves all ITR 1 data
- [ ] Draft loads correctly on page refresh
- [ ] Draft updates preserve ITR 1 constraints
- [ ] Auto-save works for ITR 1

### Form Filtering

- [ ] Only ITR 1 sections are visible
- [ ] Hidden sections are not accessible
- [ ] Section titles are ITR 1 specific
- [ ] Income section shows only ITR 1 fields

### Validations

- [ ] Total income validation (≤ ₹50L)
- [ ] Agricultural income validation (≤ ₹5,000)
- [ ] Business income validation (must be 0)
- [ ] Capital gains validation (must be 0)
- [ ] House property validation (max 1)
- [ ] Real-time validation feedback

### Computations

- [ ] Total income calculation (ITR 1 only)
- [ ] Tax computation (ITR 1 specific)
- [ ] Deductions calculation
- [ ] Final tax payable

## Deliverables

1. **Fixed Entry Points**: All entry points correctly initialize ITR 1
2. **Fixed Exit Points**: All exit points work correctly with proper data preservation
3. **Working JSON Download**: ITR 1 JSON export is complete and compliant
4. **Working Draft Save/Load**: Drafts save and load correctly for ITR 1
5. **Proper Form Filtering**: Only ITR 1 sections are displayed
6. **Complete Validations**: All ITR 1 validation rules are enforced
7. **Correct Computations**: All calculations are ITR 1 specific

## Files to Modify

1. `frontend/src/pages/ITR/ITRComputation.js` - Main computation page
2. `frontend/src/services/itrJsonExportService.js` - JSON export service
3. `frontend/src/components/ITR/core/ITRValidationEngine.js` - Validation engine
4. `frontend/src/components/ITR/ComputationSection.js` - Section rendering
5. `frontend/src/services/api/itrService.js` - Draft service (if needed)

## Success Criteria

1. All entry points correctly initialize ITR 1 with proper state
2. JSON download generates complete, ITD-compliant ITR 1 JSON
3. Drafts save and load correctly with all ITR 1 data preserved
4. Only ITR 1 specific forms/sections are displayed
5. All ITR 1 validation rules are enforced with clear error messages
6. All computations are ITR 1 specific and accurate
7. Exit points (save, submit, download) work correctly