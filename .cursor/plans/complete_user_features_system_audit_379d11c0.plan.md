---
name: Complete User Features System Audit
overview: Comprehensive audit and completion of all user-facing features, replacing mock data with real APIs, ensuring complete validations, field editability logic, JSON download as primary filing method (ERI pending), and full performance optimization.
todos:
  - id: tailwind-colors
    content: Update tailwind.config.js with new Solar Gold / Ember Amber palette
    status: completed
  - id: itr-form-page
    content: Create dedicated ITR form selection page with smart questionnaire
    status: completed
  - id: update-routes
    content: Add /itr/select-form route and update flow navigation
    status: completed
  - id: dashboard-refactor
    content: Apply DesignSystem and new colors to user dashboard components
    status: completed
  - id: regime-comparison
    content: Polish tax computation and regime comparison display
    status: completed
  - id: e-verification
    content: Implement e-verification flow after ITR submission
    status: completed
---

# Complete User Features System Audit & Implementation

## Overview

This plan provides a comprehensive audit of all user-facing features to ensure complete implementation with real API calls, validations, database persistence, and proper field editability. Since ERI license is pending, JSON download will be the primary filing method.

## Current Status Assessment

### ✅ What's Already Implemented

- Backend API routes (`backend/src/routes/itr.js` - 1488 lines)
- ITR models and controllers
- Validation engines (frontend & backend)
- JSON export service (`frontend/src/services/itrJsonExportService.js`)
- ERI integration service (mock/live mode)
- Auto-population services (AIS/26AS/ERI)
- E-verification flow
- Tax computation engine

### ❌ Gaps Identified

- Mock data in 801+ locations across 212 files
- Database migrations status unclear
- Field editability logic incomplete
- Performance/loading states need optimization
- Auto-fetch parallel with manual fallback needs completion

---

## Phase 1: Database & Backend Foundation (P0)

### Task 1.1: Audit Database Schema

**Files to check:**

- `backend/src/models/` - All model definitions
- `backend/src/scripts/` - Migration scripts
- Database connection config

**Actions:**

- Verify all required tables exist (users, itr_filings, itr_drafts, documents, members, etc.)
- Check if migrations are automated or manual
- Ensure indexes exist for performance
- Verify foreign key constraints

**Deliverable:** Database schema audit document

### Task 1.2: Complete Missing Backend Endpoints

**Files:**

- `backend/src/routes/itr.js` (existing routes)
- `backend/src/controllers/ITRController.js`

**Actions:**

- Verify all routes in `itr.js` have controller implementations
- Ensure error handling is consistent
- Add missing endpoints identified from frontend API calls
- Add database transaction handling for critical operations

**Deliverable:** Complete backend API coverage

### Task 1.3: JSON Export Backend Endpoint

**Files:**

- `backend/src/routes/itr.js`
- `backend/src/controllers/ITRController.js`
- `frontend/src/services/itrJsonExportService.js` (already exists)

**Actions:**

- Verify `/api/itr/export` endpoint exists and works
- Ensure JSON format matches ITD schema requirements
- Add validation before export
- Test with all ITR types (1-4)

**Deliverable:** Fully functional JSON export API

---

## Phase 2: Frontend Mock Data Replacement (P0)

### Task 2.1: Audit All Mock Data Usage

**Files to scan:**

- All files matching `mock|Mock|MOCK|placeholder|simulate` (801 matches found)

**Actions:**

- Create inventory of all mock data locations
- Categorize by priority (P0: critical user flows, P1: statistics, P2: admin)
- Identify corresponding backend endpoints
- Document replacement plan

**Priority Files (ITR flow):**

- `frontend/src/pages/ITR/ITRComputation.js`
- `frontend/src/hooks/useFilingStatistics.js`
- `frontend/src/pages/Admin/ServiceTicketManagement.js`
- All ITR form components

**Deliverable:** Mock data inventory spreadsheet

### Task 2.2: Replace Critical Mock Data

**Strategy:**

1. Start with ITR filing flow (highest priority)
2. Replace statistics/dashboard mocks
3. Handle service ticket mocks
4. Admin panel mocks (lower priority)

**Files to update:**

- `frontend/src/hooks/useFilingStatistics.js` - Replace mock with real API
- `frontend/src/pages/ITR/ITRComputation.js` - Remove any mock tax computations
- All components using `setTimeout` for fake delays

**API Integration:**

- Use existing `itrService` from `frontend/src/services/api/itrService.js`
- Ensure error handling and loading states
- Add retry logic for failed requests

**Deliverable:** All P0 mock data replaced with real API calls

### Task 2.3: Implement Proper Loading States

**Files:**

- All ITR form components
- Dashboard components
- Statistics widgets

**Actions:**

- Add loading skeletons for all async operations
- Implement progressive loading (show partial data while fetching)
- Add error boundaries for failed API calls
- Use React Query for caching and retry logic

**Deliverable:** Consistent loading UX across all features

---

## Phase 3: Field Editability & Read-Only Logic (P0)

### Task 3.1: Complete Read-Only Field Logic

**Files:**

- `frontend/src/pages/ITR/ITRComputation.js` (line 247-249 has `isReadOnly` logic)
- All ITR form components

**Current Implementation:**

```javascript
const isReadOnly = viewMode === 'readonly' ||
                   (currentFiling && ['submitted', 'acknowledged', 'processed'].includes(currentFiling.status));
```

**Actions:**

1. Define comprehensive read-only rules:

   - System-calculated fields (tax liability, refund amount)
   - Auto-fetched fields (from AIS/26AS) - allow override with warning
   - Submitted/acknowledged filings - fully read-only
   - Certain fields locked after specific steps

2. Implement field-level read-only:

   - Add `readOnly` prop to all form inputs
   - Visual indicators (grayed out, lock icon)
   - Tooltips explaining why field is locked

3. Auto-fetched fields with manual override:

   - Show source indicator (AIS/26AS/ERI)
   - Allow editing with "Override" button
   - Warn user about discrepancies

**Files to update:**

- `frontend/src/components/ITR/PersonalInfoForm.js`
- `frontend/src/components/ITR/IncomeForm.js`
- All income type forms (Salary, Capital Gains, etc.)
- Deduction forms
- Tax computation displays

**Deliverable:** Complete field editability system

### Task 3.2: Implement Field Source Tagging

**Purpose:** Track where each field value came from (manual, AIS, 26AS, ERI, system-calculated)

**Files to create/update:**

- New: `frontend/src/utils/fieldSourceTracking.js`
- Update all form components to track source

**Actions:**

- Add `source` metadata to each field
- Display source badge on fields
- Show discrepancy warnings when manual value differs from auto-fetched
- Allow users to choose which source to use

**Deliverable:** Field source tracking system

---

## Phase 4: Auto-Fetch with Manual Fallback (P0)

### Task 4.1: Parallel Auto-Fetch Implementation

**Current Status:**

- Services exist: `ITRDataPrefetchService`, `AISForm26ASService`, `ERIIntegrationService`
- Backend route exists: `/api/itr/prefetch/:pan/:assessmentYear`

**Files:**

- `frontend/src/pages/ITR/ITRComputation.js`
- `frontend/src/services/AutoPopulationITRService.js`
- `backend/src/services/business/ITRDataPrefetchService.js`

**Actions:**

1. Implement parallel fetching:
   ```javascript
   // Fetch from all sources in parallel
   const [eriData, aisData, form26asData] = await Promise.allSettled([
     fetchERIData(),
     fetchAISData(),
     fetchForm26ASData()
   ]);
   ```

2. Merge data intelligently:

   - Priority: ERI > AIS > Form26AS > Manual
   - Show user what was auto-filled vs manual
   - Allow selection of preferred source per field

3. Handle failures gracefully:

   - If all auto-fetch fails, allow full manual entry
   - Show partial data if some sources fail
   - Provide refresh/retry mechanism

**Deliverable:** Robust parallel auto-fetch system

### Task 4.2: Manual Fallback UI

**Files:**

- `frontend/src/components/ITR/DataSourceSelector.js` (already exists)
- All income/deduction forms

**Actions:**

- Ensure all forms work with empty data (no auto-fetch)
- Provide clear "Enter manually" option
- Show data source selector even after auto-fetch (to override)
- Make manual entry feel natural, not like a fallback

**Deliverable:** Seamless manual fallback experience

---

## Phase 5: Validations (P0)

### Task 5.1: Audit All Validations

**Files:**

- `frontend/src/components/ITR/core/ITRValidationEngine.js`
- `backend/src/services/core/ValidationEngine.js`
- `frontend/src/pages/ITR/ITRComputation.js` (validation calls)

**Current Status:**

- Validation engines exist
- Real-time validation hooks exist
- Form validation on submit exists

**Actions:**

1. Verify all ITR types have complete validation rules:

   - ITR-1: Salary limit, no capital gains, etc.
   - ITR-2: Capital gains allowed, multiple properties
   - ITR-3: Business income, balance sheet
   - ITR-4: Presumptive limits

2. Ensure validations match backend:

   - Frontend validation must match backend
   - Add cross-validation (e.g., deductions vs income)

3. Test edge cases:

   - Boundary conditions (income limits)
   - Required field combinations
   - Cross-field dependencies

**Deliverable:** Complete validation test suite

### Task 5.2: Real-Time Validation UX

**Files:**

- `frontend/src/hooks/useRealTimeValidation.js`
- All form components

**Actions:**

- Ensure validation errors show immediately
- Provide helpful error messages
- Show warnings vs errors distinction
- Disable submit button until all errors resolved

**Deliverable:** Polished validation UX

---

## Phase 6: JSON Download & Filing (P0)

### Task 6.1: Complete JSON Export Flow

**Files:**

- `frontend/src/services/itrJsonExportService.js` (exists)
- `frontend/src/components/ITR/core/ITRJsonDownload.js` (exists)
- `frontend/src/pages/ITR/ITRComputation.js` (handleDownloadJSON exists)

**Actions:**

1. Ensure JSON format matches ITD requirements:

   - Validate against ITD schema
   - Test with sample data
   - Handle all ITR types

2. Complete download flow:

   - Validate data before export
   - Generate JSON file
   - Trigger browser download
   - Show success message

3. Add export options:

   - Export for manual upload to IT portal
   - Export for CA review
   - Export summary (read-only view)

**Deliverable:** Production-ready JSON export

### Task 6.2: ERI Auto-Filing (Future - When License Available)

**Files:**

- `backend/src/services/business/ERIIntegrationService.js`
- `frontend/src/pages/ITR/ITRComputation.js` (handleFileReturns)

**Actions (deferred until ERI license):**

- Keep existing ERI service structure
- Add feature flag for ERI filing
- When enabled, use ERI upload instead of JSON download
- Show filing status and acknowledgment

**Note:** For now, JSON download is primary method

---

## Phase 7: Performance & Optimization (P1)

### Task 7.1: Performance Audit

**Tools:**

- React DevTools Profiler
- Lighthouse
- Network tab analysis

**Focus Areas:**

1. Bundle size optimization
2. Code splitting for ITR forms
3. Image/asset optimization
4. API request batching
5. Caching strategy (React Query)

**Files to optimize:**

- Large components (`ITRComputation.js` - 2565 lines)
- Heavy calculations (tax computation)
- Form rendering (many fields)

**Deliverable:** Performance optimization report

### Task 7.2: Loading State Optimization

**Actions:**

- Implement skeleton loaders
- Progressive data loading
- Optimistic UI updates
- Debounce/throttle expensive operations

**Deliverable:** Smooth loading experience

---

## Phase 8: Testing & Quality Assurance (P1)

### Task 8.1: End-to-End Testing

**Scenarios:**

1. Complete ITR filing flow (all types)
2. Auto-fetch → manual override
3. Validation → fix errors → submit
4. JSON export → verify format
5. Read-only view of submitted filing

### Task 8.2: Error Handling

**Actions:**

- Test all error scenarios
- Ensure user-friendly error messages
- Add retry mechanisms
- Log errors for debugging

---

## Implementation Priority

### P0 (Critical - Must Complete)

1. Database schema verification
2. Mock data replacement in ITR flow
3. Field editability logic
4. Auto-fetch with manual fallback
5. Complete validations
6. JSON export functionality

### P1 (Important - Should Complete)

7. Performance optimization
8. Loading states
9. Error handling improvements
10. Testing

### P2 (Nice to Have)

11. Advanced features
12. Admin panel mock replacement

---

## Success Criteria

- ✅ Zero mock data in critical user flows
- ✅ All validations working end-to-end
- ✅ Fields properly editable/read-only based on status
- ✅ Auto-fetch works with graceful manual fallback
- ✅ JSON export works for all ITR types
- ✅ Performance meets targets (<3s page load, <500ms interactions)
- ✅ All API calls have proper error handling and loading states

---

## Estimated Timeline

- Phase 1-2: Database & Mock Data Replacement - 3-4 days
- Phase 3-4: Field Logic & Auto-Fetch - 2-3 days
- Phase 5-6: Validations & JSON Export - 2 days
- Phase 7-8: Performance & Testing - 2-3 days

**Total: ~10-12 days of focused development**