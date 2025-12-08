---
name: Auto-save and Data Persistence Flow
overview: Implement comprehensive auto-save and data persistence across the entire user journey from login to JSON download, ensuring all form inputs are saved to database, forms load with prefilled data, verified fields are locked, and data flows seamlessly through the application.
todos:
  - id: "1"
    content: Review and verify frontend ComputationSection component handles all ITR-3 (12) and ITR-4 (9) sections correctly, including ITR3IncomeForm, ITR4IncomeForm, and ITR-specific forms
    status: completed
  - id: "2"
    content: "Verify ITR-3 specific fields: business income (multiple businesses), professional income (multiple professions), balance sheet, audit info"
    status: in_progress
    dependencies:
      - "1"
  - id: "3"
    content: "Verify ITR-4 specific fields: presumptive income (44AD/44ADA), goods carriage (44AE), gross receipts limits"
    status: completed
    dependencies:
      - "1"
  - id: "4"
    content: Test and verify all API endpoints (GET/PUT drafts, compute tax, validate) work correctly for ITR-3 and ITR-4 with nested data structures
    status: in_progress
    dependencies:
      - "1"
      - "2"
      - "3"
  - id: "5"
    content: Review database operations in ITRController - verify SQL queries handle ITR-3/ITR-4 nested structures (arrays, objects) correctly
    status: pending
    dependencies:
      - "4"
  - id: "6"
    content: Verify tax calculation includes all ITR-3 income sources (business, professional) and ITR-4 income sources (presumptive, goods carriage)
    status: pending
    dependencies:
      - "2"
      - "3"
  - id: "7"
    content: "Test end-to-end flow: create ITR-3 draft (12 sections) and ITR-4 draft (9 sections), fill all sections, save, reload, verify persistence"
    status: pending
    dependencies:
      - "1"
      - "2"
      - "3"
      - "4"
      - "5"
      - "6"
  - id: "8"
    content: Verify error handling for invalid ITR-3/ITR-4 data, missing required fields, unauthorized access, database errors, and ITR-4 gross receipts limits
    status: completed
    dependencies:
      - "4"
      - "5"
---

# Auto-Save and Data Persistence Flow - Complete Implementation Plan

## Overview

Implement end-to-end auto-save and data persistence across the entire user journey, ensuring:

1. All form inputs are automatically saved to database
2. Forms load with prefilled data from database
3. Verified fields are locked and cannot be edited without confirmation
4. Seamless data flow from login → profile → PAN verification → ITR computation → JSON download

## Current State Analysis

### Existing Implementation

- **Auto-save**: Partially implemented in `ITRComputation.js` with debounced saves to `itr_drafts` table
- **Data Loading**: Draft data loaded via `GET /api/itr/drafts/:draftId`
- **Field Locking**: `FieldLockService` exists but may not be consistently applied
- **Profile Management**: User profile saves to `users` and `user_profiles` tables
- **PAN Verification**: Saves to `users.pan_verified` and `family_members.pan_verified`

### Gaps Identified

1. Not all forms consistently save data on change
2. Not all forms load prefilled data on mount
3. Field locking not consistently applied across all forms
4. Auto-save may not cover all sections (especially ITR-3/ITR-4 specific sections)
5. Profile data may not be properly loaded into ITR forms
6. Verified field unlock mechanism not implemented

## Implementation Plan

### Phase 1: Core Auto-Save Infrastructure

#### 1.1 Enhanced Auto-Save Hook

**File**: `frontend/src/hooks/useAutoSave.js` (enhance existing)

- Add field blur handler (immediate save)
- Add debounced change handler (2-3 seconds)
- Add section change handler
- Add offline support with localStorage backup
- Add retry logic for failed saves
- Add visual indicators (saving/saved/error states)

**Key Features**:

- Debounce timer: 2000ms for field changes
- Immediate save on field blur
- Immediate save on section change
- localStorage backup for offline support
- Retry with exponential backoff

#### 1.2 Universal Form Data Service

**File**: `frontend/src/services/FormDataService.js` (new)

- Centralized service for all form data operations
- Methods:
  - `saveFormData(section, data, draftId)` - Save section data
  - `loadFormData(draftId)` - Load all form data
  - `loadSectionData(draftId, section)` - Load specific section
  - `mergeFormData(existing, updates)` - Merge updates with existing
  - `validateBeforeSave(data, section)` - Validate before saving

### Phase 2: Profile and PAN Verification Flow

#### 2.1 Profile Creation/Update Forms

**Files**:

- `frontend/src/pages/User/ProfileSettings.js`
- `frontend/src/pages/User/UserProfile.js`

**Changes**:

- Add auto-save on field blur and debounced changes
- Load prefilled data from `users` and `user_profiles` tables on mount
- Save to `PUT /api/users/profile` on every change (debounced)
- Lock verified fields (PAN, email, phone if verified)
- Show verification status indicators

**API Endpoints**:

- `GET /api/users/profile` - Load profile data
- `PUT /api/users/profile` - Update profile (already exists)
- `PATCH /api/users/pan` - Update PAN (already exists)

#### 2.2 PAN Verification Integration

**Files**:

- `frontend/src/components/ITR/PANVerification.js`
- `frontend/src/components/ITR/PANVerificationInline.js`

**Changes**:

- After successful verification, save to database immediately
- Update `users.pan_verified = true` and `users.pan_verified_at`
- Update `family_members.pan_verified = true` for family members
- Lock PAN field in all forms after verification
- Prefill verified PAN data in ITR forms

**API Endpoints**:

- `POST /api/itr/pan/verify` - Verify PAN (already exists)
- `POST /api/members/:id/verify-pan` - Verify family member PAN (already exists)

### Phase 3: Family Member Management

#### 3.1 Family Member Forms

**Files**:

- `frontend/src/components/ITR/FilingPersonSelector.js`
- Family member creation/update forms

**Changes**:

- Auto-save family member data on field changes
- Load prefilled data from `family_members` table
- Lock verified fields (PAN, name, DOB if verified)
- Save to `POST /api/members` (create) and `PUT /api/members/:id` (update)

**API Endpoints**:

- `GET /api/members` - List family members (already exists)
- `POST /api/members` - Create family member (already exists)
- `PUT /api/members/:id` - Update family member (verify exists)
- `GET /api/members/:id` - Get family member details (verify exists)

### Phase 4: ITR Computation Screen - Comprehensive Auto-Save

#### 4.1 ITR Computation Page Updates

**File**: `frontend/src/pages/ITR/ITRComputation.js`

**Changes**:

- Enhance existing auto-save to cover ALL sections (including ITR-3/ITR-4 specific)
- Load draft data on mount: `GET /api/itr/drafts/:draftId`
- Save on every section update: `PUT /api/itr/drafts/:draftId`
- Implement field-level auto-save (not just section-level)
- Add visual save indicators per section
- Handle offline mode with localStorage backup

**Key Sections to Cover**:

- Personal Info
- Income (all ITR types)
- Business Income (ITR-3)
- Professional Income (ITR-3)
- Balance Sheet (ITR-3)
- Audit Info (ITR-3)
- Presumptive Income (ITR-4)
- Goods Carriage (ITR-4)
- Exempt Income (Agricultural Income)
- Deductions
- Taxes Paid
- Tax Computation
- Bank Details
- Schedule FA (ITR-2/ITR-3)

#### 4.2 Computation Section Component

**File**: `frontend/src/components/ITR/ComputationSection.js`

**Changes**:

- Ensure all child forms call `onUpdate` on field changes
- Pass `fieldVerificationStatuses` to all forms
- Pass `readOnly` prop based on field lock status
- Add field-level save indicators

#### 4.3 Individual Form Components

**Files**: All form components in `frontend/src/features/`

**Changes Required**:

- **PersonalInfoForm**: Auto-save on blur, load from draft, lock verified fields
- **SalaryForm**: Auto-save on change, load from draft
- **HousePropertyForm**: Auto-save on change, load from draft
- **CapitalGainsForm**: Auto-save on change, load from draft
- **ForeignIncomeForm**: Auto-save on change, load from draft
- **DirectorPartnerIncomeForm**: Auto-save on change, load from draft
- **BusinessIncomeForm**: Auto-save on change, load from draft
- **ProfessionalIncomeForm**: Auto-save on change, load from draft
- **BalanceSheetForm**: Auto-save on change, load from draft
- **AuditInformationForm**: Auto-save on change, load from draft
- **PresumptiveIncomeForm**: Auto-save on change, load from draft
- **Section44AEForm**: Auto-save on change, load from draft
- **AgriculturalIncomeForm**: Auto-save on change, load from draft
- **DeductionsManager**: Auto-save on change, load from draft
- **TaxesPaidForm**: Auto-save on change, load from draft
- **BankDetailsForm**: Auto-save on change, load from draft, lock verified accounts

**Pattern for All Forms**:

```javascript
// On mount: Load data from draft
useEffect(() => {
  if (draftId && draftData) {
    setFormState(draftData[section] || {});
  }
}, [draftId, draftData]);

// On change: Auto-save (debounced + blur)
const handleChange = (field, value) => {
  const updates = { [field]: value };
  setFormState(prev => ({ ...prev, ...updates }));
  onUpdate(updates); // Triggers auto-save in parent
};

// On blur: Immediate save
const handleBlur = (field, value) => {
  onUpdate({ [field]: value }); // Immediate save
};
```

### Phase 5: Field Locking and Verification

#### 5.1 Enhanced Field Lock Service

**File**: `frontend/src/services/FieldLockService.js` (enhance existing)

**Changes**:

- Add unlock mechanism with confirmation
- Add unlock request handler
- Track unlock history
- Add visual indicators for locked/unlocked state

**New Methods**:

- `requestUnlock(section, field, reason)` - Request unlock with reason
- `unlockField(section, field, confirmed)` - Unlock field after confirmation
- `isFieldLocked(section, field)` - Check if field is locked
- `getLockReason(section, field)` - Get reason for lock

#### 5.2 Field Lock UI Components

**Files**:

- `frontend/src/components/ITR/FieldLockIndicator.js` (enhance existing)
- `frontend/src/components/ITR/UnlockFieldModal.js` (new)

**Features**:

- Show lock icon for locked fields
- Show unlock button with confirmation modal
- Display verification status badge
- Show data source badge
- Disable input fields when locked

#### 5.3 Verification Status Management

**File**: `frontend/src/services/VerificationStatusService.js` (new)

**Purpose**: Centralized service to manage field verification statuses

**Methods**:

- `getVerificationStatus(section, field)` - Get verification status
- `setVerificationStatus(section, field, status, source)` - Set verification status
- `loadVerificationStatuses(draftId)` - Load from database
- `saveVerificationStatuses(draftId, statuses)` - Save to database

**Storage**: Store in `itr_drafts.data.verificationStatuses` (JSONB)

### Phase 6: Data Loading and Prefilling

#### 6.1 Draft Data Loading

**File**: `frontend/src/pages/ITR/ITRComputation.js` (enhance existing)

**Changes**:

- On mount, load draft data: `GET /api/itr/drafts/:draftId`
- Merge with auto-populated data (AIS, Form 16, previous year)
- Apply field verification statuses
- Lock verified fields
- Show data source badges

**Data Priority**:

1. Verified data (highest priority, locked)
2. Draft data (saved user input)
3. Auto-populated data (AIS, Form 16, previous year)
4. User profile data
5. Empty/default values

#### 6.2 Auto-Population Integration

**File**: `frontend/src/services/AutoPopulationService.js` (enhance existing)

**Changes**:

- Ensure auto-populated data is saved to draft
- Track data sources for each field
- Respect field locks (don't overwrite locked fields)
- Show data source badges

### Phase 7: Backend API Enhancements

#### 7.1 Draft API Updates

**File**: `backend/src/controllers/ITRController.js`

**Changes**:

- Ensure `updateDraft` saves all sections correctly
- Ensure `getDraftById` returns all sections
- Add field-level update endpoint (optional, for granular saves)
- Store verification statuses in draft data

**Endpoints**:

- `PUT /api/itr/drafts/:draftId` - Update draft (already exists, verify handles all sections)
- `GET /api/itr/drafts/:draftId` - Get draft (already exists, verify returns all sections)
- `PATCH /api/itr/drafts/:draftId/sections/:section` - Update specific section (new, optional)

#### 7.2 Profile API Verification

**Files**:

- `backend/src/routes/user.js`
- `backend/src/controllers/UserController.js`

**Verify**:

- `GET /api/users/profile` returns all profile data including verification statuses
- `PUT /api/users/profile` saves all fields correctly
- PAN verification updates are persisted

### Phase 8: Testing and Validation

#### 8.1 Test Scenarios

1. **Profile Flow**:

   - Create profile → Save → Reload → Verify data persists
   - Update profile → Auto-save → Reload → Verify updates persist
   - Verify PAN → Lock PAN field → Reload → Verify PAN remains locked

2. **Family Member Flow**:

   - Create family member → Save → Reload → Verify data persists
   - Verify family member PAN → Lock PAN → Reload → Verify lock persists

3. **ITR Computation Flow**:

   - Fill all sections → Auto-save → Reload → Verify all data persists
   - Change field → Auto-save → Reload → Verify change persists
   - Verify field → Lock field → Try to edit → Verify lock works
   - Unlock field → Confirm → Edit → Verify unlock works

4. **Offline Mode**:

   - Fill form → Go offline → Auto-save → Verify localStorage backup
   - Come online → Verify data syncs to database

#### 8.2 Data Integrity Checks

- Verify all form data is saved to correct database tables
- Verify all form data loads correctly on page refresh
- Verify verified fields remain locked across sessions
- Verify data sources are tracked correctly

## Files to Modify

### Frontend

1. `frontend/src/hooks/useAutoSave.js` - Enhance auto-save hook
2. `frontend/src/services/FormDataService.js` - New universal form data service
3. `frontend/src/services/VerificationStatusService.js` - New verification status service
4. `frontend/src/services/FieldLockService.js` - Add unlock mechanism
5. `frontend/src/pages/ITR/ITRComputation.js` - Enhance auto-save and data loading
6. `frontend/src/components/ITR/ComputationSection.js` - Ensure all forms call onUpdate
7. `frontend/src/components/ITR/FieldLockIndicator.js` - Add unlock functionality
8. `frontend/src/components/ITR/UnlockFieldModal.js` - New unlock confirmation modal
9. `frontend/src/pages/User/ProfileSettings.js` - Add auto-save and data loading
10. `frontend/src/pages/User/UserProfile.js` - Add auto-save and data loading
11. All form components in `frontend/src/features/` - Add auto-save and data loading

### Backend

1. `backend/src/controllers/ITRController.js` - Verify draft save/load handles all sections
2. `backend/src/controllers/UserController.js` - Verify profile save/load
3. `backend/src/routes/user.js` - Verify profile endpoints
4. `backend/src/routes/itr.js` - Verify draft endpoints

## Success Criteria

1. ✅ All form inputs auto-save to database within 2-3 seconds of change
2. ✅ All forms load with prefilled data from database on mount
3. ✅ Verified fields are locked and cannot be edited without confirmation
4. ✅ Field unlock requires confirmation and is logged
5. ✅ Data persists across page refreshes and browser sessions
6. ✅ Offline mode works with localStorage backup
7. ✅ Data sources are tracked and displayed
8. ✅ All ITR types (1-4) are fully supported
9. ✅ All sections (including ITR-3/ITR-4 specific) are covered
10. ✅ Performance is acceptable (no lag on typing)

## Implementation Order

1. **Phase 1**: Core auto-save infrastructure (hooks, services)
2. **Phase 2**: Profile and PAN verification flow
3. **Phase 3**: Family member management
4. **Phase 4**: ITR computation screen (main focus)
5. **Phase 5**: Field locking and verification
6. **Phase 6**: Data loading and prefilling
7. **Phase 7**: Backend API verification
8. **Phase 8**: Testing and validation