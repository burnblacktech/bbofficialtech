---
name: ITR 2 Comprehensive Review and Fix
overview: Comprehensive review and fix of ITR 2 filing process covering all entry/exit points, JSON download, draft saving, form filtering, and ITR 2 specific validations and computations.
todos: []
---

# ITR 2 Comprehensive Review and Fix Plan

## Overview

This plan provides a thorough review and fix of the ITR 2 filing process, ensuring all entry/exit points work correctly, JSON download functions properly, drafts save/load correctly, and only ITR 2 specific forms are displayed with proper conditions and computations.

## Current State Analysis

### Entry Points

Same as ITR-1:

1. **From DataSourceSelector** (`/itr/data-source`)
2. **From ITRFormSelection** (`/itr/form-selection`)
3. **From ITRDirectSelection** (`/itr/direct-selection`)
4. **From IncomeSourceSelector** (`/itr/income-sources`)
5. **From DocumentUploadHub** (`/itr/document-upload`)
6. **Direct Access via Draft/Filing ID**
7. **From Dashboard/Filing History**

### Exit Points

Same as ITR-1:

1. **Save Draft** → Stays on page, updates URL with draftId
2. **Submit ITR** → Navigates to `/itr/acknowledgment?filingId=xxx`
3. **Download JSON** → Downloads file, stays on page
4. **Back Navigation** → Returns to previous page based on entry point

### ITR-2 Specific Requirements

**Allowed Income Sources:**

- Salary income
- House property (multiple properties allowed)
- Capital gains (STCG and LTCG)
- Other sources (interest, dividends, etc.)
- Foreign income
- Director/Partner income

**Not Allowed:**

- Business income (must be 0 or undefined)
- Professional income (must be 0 or undefined)
- Presumptive income
- Balance sheet
- Audit information

**Required Sections:**

- Personal Information
- Income Details (with capital gains sub-section)
- Exempt & Agricultural Income
- Deductions
- Taxes Paid
- Tax Computation
- Bank Details
- Schedule FA (if foreign income/assets exist)

### Current Issues Identified

1. **Entry Point Recovery**: Entry point stored in localStorage but may not be properly restored for ITR-2
2. **ITR Type Validation**: ITR type can be changed after entry, but validation may not catch incompatible data for ITR-2
3. **Form Filtering**: `shouldShowSection` function exists but may not cover all edge cases for ITR-2
4. **JSON Export**: ITR 2 specific fields may not be fully populated
5. **Draft Saving**: Draft saving may not preserve all ITR 2 specific data structures
6. **Computation Logic**: ITR 2 specific computations may not be isolated from other ITR types
7. **Schedule FA**: May not be properly linked to foreign income validation

## Implementation Tasks

### Task 1: Entry Points Review and Fix

**Files to Review:**

- `frontend/src/pages/ITR/ITRComputation.js` (lines 125-190, 191-213)
- `frontend/src/components/ITR/DataSourceSelector.js`
- `frontend/src/pages/ITR/ITRFormSelection.js`
- `frontend/src/pages/ITR/ITRDirectSelection.js`
- `frontend/src/pages/ITR/IncomeSourceSelector.js`
- `frontend/src/pages/ITR/DocumentUploadHub.js`

**Actions:**

1. Verify all entry points pass correct state for ITR-2
2. Ensure `selectedITR` is set to 'ITR-2' when appropriate
3. Fix entry point recovery from localStorage on page refresh for ITR-2
4. Add route guard to prevent invalid ITR type changes for ITR-2
5. Ensure `selectedPerson` is always available for ITR-2

**Validation:**

- Test each entry point with ITR-2 selection
- Verify state is correctly passed and restored
- Test page refresh recovery

### Task 2: Exit Points Review and Fix

**Files to Review:**

- `frontend/src/pages/ITR/ITRComputation.js` (lines 2309-2360, 2586-2630, 2732-2804)

**Actions:**

1. Verify draft saving preserves all ITR-2 data
2. Ensure JSON download includes all ITR-2 specific fields
3. Fix submission flow to properly validate ITR-2 before exit
4. Ensure acknowledgment navigation includes all required data
5. Add proper cleanup on exit (clear temporary data, etc.)

**Validation:**

- Test draft save and reload for ITR-2
- Test JSON download for ITR-2
- Test submission and verify acknowledgment page receives correct data

### Task 3: JSON Download Functionality Fix

**Files to Review:**

- `frontend/src/services/itrJsonExportService.js` (lines 1226-1236, 268-274)
- `frontend/src/pages/ITR/ITRComputation.js` (lines 2586-2630)

**Actions:**

1. Verify ITR-2 specific fields are correctly populated in JSON export:

- `ITR2_Specific.Capital_Gains_Detailed`
- `ITR2_Specific.House_Property_Detailed`
- `ITR2_Specific.Foreign_Income_Details`
- `ITR2_Specific.Director_Partner_Income`

2. Ensure capital gains details (STCG and LTCG) are properly mapped
3. Ensure house property details are properly formatted (multiple properties allowed)
4. Ensure foreign income details are properly formatted
5. Ensure Schedule FA data is included if foreign income/assets exist
6. Add validation to ensure JSON is ITR-2 compliant before download
7. Fix any missing field mappings for ITR-2

**Validation:**

- Generate JSON for ITR-2 with all sections filled
- Verify JSON structure matches ITD requirements
- Test JSON validation before download

### Task 4: Draft Saving and Loading Fix

**Files to Review:**

- `frontend/src/pages/ITR/ITRComputation.js` (lines 2309-2360, 2422-2478, 1899-1995)
- `frontend/src/services/api/itrService.js` (lines 21-49)

**Actions:**

1. Ensure draft saving includes:

- `selectedITR` (must be 'ITR-2' or 'ITR2')
- Complete `formData` structure
- `assessmentYear`
- `taxRegime`
- `selectedPerson`
- Schedule FA data if applicable

2. Fix draft loading to restore ITR-2 specific data structures
3. Ensure draft updates preserve ITR-2 constraints
4. Add validation to prevent saving invalid ITR-2 data
5. Fix auto-save functionality for ITR-2

**Validation:**

- Save draft with ITR-2 data
- Reload page and verify draft loads correctly
- Verify all ITR-2 specific fields are preserved
- Test auto-save functionality

### Task 5: ITR-2 Specific Form Filtering

**Files to Review:**

- `frontend/src/pages/ITR/ITRComputation.js` (lines 3068-3084, 2706-2746)
- `frontend/src/components/ITR/ComputationSection.js` (lines 182-220, 547-638)

**Actions:**

1. Verify `shouldShowSection` correctly hides:

- `businessIncome` section
- `professionalIncome` section
- `balanceSheet` section
- `auditInfo` section
- `presumptiveIncome` section
- `goodsCarriage` section

2. Verify `shouldShowSection` correctly shows:

- `scheduleFA` section (if foreign income/assets exist)

3. Ensure income section shows:

- Salary income
- House property (multiple properties allowed)
- Capital gains (STCG and LTCG sub-sections)
- Foreign income sub-section
- Director/Partner income sub-section
- Other sources (interest, dividends, etc.)
- NO business income sub-section
- NO professional income sub-section

4. Add runtime validation to prevent showing hidden sections
5. Ensure section titles are ITR-2 specific

**Validation:**

- Verify only ITR-2 sections are visible
- Test section filtering when ITR type is changed
- Verify section titles are correct for ITR-2
- Verify Schedule FA section appears when foreign income/assets exist

### Task 6: ITR-2 Specific Validations and Computations

**Files to Review:**

- `frontend/src/components/ITR/core/ITRValidationEngine.js` (lines 828-843)
- `frontend/src/pages/ITR/ITRComputation.js` (lines 1061-1135, 2732-2804)

**Actions:**

1. Verify ITR-2 validation rules:

- No business income (must be 0)
- No professional income (must be 0)
- Schedule FA warning if foreign income exists but no Schedule FA
- Capital gains validation (STCG and LTCG)
- Multiple house properties allowed

2. Ensure validation runs on:

- Form data changes
- Before draft save
- Before JSON export
- Before submission

3. Fix computation logic to:

- Only calculate ITR-2 applicable income
- Include capital gains in calculations
- Include foreign income in calculations
- Include director/partner income in calculations
- Handle multiple house properties correctly
- Exclude business/professional income from calculations

4. Add real-time validation feedback for ITR-2 violations

**Validation:**

- Test validation with invalid ITR-2 data (e.g., business income > 0)
- Verify error messages are clear and actionable
- Test computation with ITR-2 specific scenarios
- Test Schedule FA validation with foreign income

### Task 7: Data Structure Consistency

**Files to Review:**

- `frontend/src/pages/ITR/ITRComputation.js` (lines 225-400)
- `frontend/src/services/itrJsonExportService.js`

**Actions:**

1. Ensure formData structure for ITR-2:

- `income.businessIncome` should be `0` (not object)
- `income.professionalIncome` should be `0` (not object)
- `income.capitalGains` should be an object with `stcgDetails` and `ltcgDetails` arrays
- `income.houseProperty.properties` should be an array (multiple properties allowed)
- `income.foreignIncome` should be an object with `foreignIncomeDetails` array
- `income.directorPartner` should be an object with `directorIncome` and `partnerIncome`
- `scheduleFA` should be an object with `assets` array (if foreign income/assets exist)
- No `balanceSheet` object
- No `auditInfo` object

2. Fix initialization to set correct defaults for ITR-2
3. Ensure data structure is consistent across:

- Form state
- Draft saving
- JSON export
- Validation

**Validation:**

- Verify formData structure matches ITR-2 requirements
- Test data consistency across save/load/export

## Testing Checklist

### Entry Points

- [ ] DataSourceSelector → ITR-2 computation
- [ ] ITRFormSelection → ITR-2 computation
- [ ] ITRDirectSelection → ITR-2 computation
- [ ] IncomeSourceSelector → ITR-2 computation
- [ ] DocumentUploadHub → ITR-2 computation
- [ ] Direct draft/filing ID access
- [ ] Dashboard/Filing History → ITR-2 computation
- [ ] Page refresh recovery

### Exit Points

- [ ] Save draft and reload
- [ ] Submit ITR and verify acknowledgment
- [ ] Download JSON and verify structure
- [ ] Back navigation from various entry points

### JSON Download

- [ ] JSON contains all ITR-2 specific fields
- [ ] JSON structure is ITD compliant
- [ ] JSON validation works correctly
- [ ] File download triggers correctly
- [ ] Schedule FA data included if applicable

### Draft Saving

- [ ] Draft saves all ITR-2 data
- [ ] Draft loads correctly on page refresh
- [ ] Draft updates preserve ITR-2 constraints
- [ ] Auto-save works for ITR-2
- [ ] Schedule FA data preserved

### Form Filtering

- [ ] Only ITR-2 sections are visible
- [ ] Hidden sections are not accessible
- [ ] Section titles are ITR-2 specific
- [ ] Income section shows only ITR-2 fields
- [ ] Schedule FA section appears when foreign income/assets exist

### Validations

- [ ] Business income validation (must be 0)
- [ ] Professional income validation (must be 0)
- [ ] Schedule FA warning with foreign income
- [ ] Capital gains validation
- [ ] Multiple house properties validation
- [ ] Real-time validation feedback

### Computations

- [ ] Total income calculation (ITR-2 only)
- [ ] Tax computation (ITR-2 specific)
- [ ] Capital gains included in calculations
- [ ] Foreign income included in calculations
- [ ] Director/Partner income included in calculations
- [ ] Multiple house properties included in calculations
- [ ] Deductions calculation
- [ ] Final tax payable

## Deliverables

1. **Fixed Entry Points**: All entry points correctly initialize ITR-2
2. **Fixed Exit Points**: All exit points work correctly with proper data preservation
3. **Working JSON Download**: ITR-2 JSON export is complete and compliant
4. **Working Draft Save/Load**: Drafts save and load correctly for ITR-2
5. **Proper Form Filtering**: Only ITR-2 sections are displayed
6. **Complete Validations**: All ITR-2 validation rules are enforced
7. **Correct Computations**: All calculations are ITR-2 specific

## Files to Modify

1. `frontend/src/pages/ITR/ITRComputation.js` - Main computation page
2. `frontend/src/services/itrJsonExportService.js` - JSON export service
3. `frontend/src/components/ITR/core/ITRValidationEngine.js` - Validation engine
4. `frontend/src/components/ITR/ComputationSection.js` - Section rendering
5. `frontend/src/services/api/itrService.js` - Draft service (if needed)

## Success Criteria

1. All entry points correctly initialize ITR-2 with proper state
2. JSON download generates complete, ITD-compliant ITR-2 JSON
3. Drafts save and load correctly with all ITR-2 data preserved
4. Only ITR-2 specific forms/sections are displayed
5. All ITR-2 validation rules are enforced with clear error messages
6. All computations are ITR-2 specific and accurate
7. Exit points (save, submit, download) work correctly
8. Schedule FA is properly linked to foreign income validation