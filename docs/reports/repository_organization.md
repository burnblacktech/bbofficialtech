# Repository Organization & Cleanup Plan

## Status: IN PROGRESS

---

## Documentation Organization

### ✅ Created Central Docs Directory

```
docs/
├── architecture/      # System design, module ownership, entrypoints
├── contracts/         # API contracts, lifecycle contracts
├── deployment/        # Deployment guides, ERI setup
└── README.md         # Documentation index
```

### ✅ Moved Documentation Files

**Architecture Docs** → `docs/architecture/`:
- ✅ `SYSTEM_MAP.md` - System architecture overview
- ✅ `MODULE_OWNERSHIP.md` - Module ownership and responsibilities
- ✅ `DEV_ENTRYPOINTS.md` - Development entry points
- ✅ `S15_AUTH_TRUTH.md` - Authentication truth documentation
- ✅ `S15_LAYER1_STRUCTURAL_TRUTH.md` - Layer 1 structural truth

**Contract Docs** → `docs/contracts/`:
- ✅ `LIFECYCLE_CONTRACT.md` - Filing lifecycle contract

**Deployment Docs** → `docs/deployment/`:
- ✅ `ERI_DEPLOYMENT.md` - ERI deployment guide

---

## Files & Folders to Delete

### Backend - Test/Verification Scripts (DELETE)

**Location**: `backend/`

These are old verification scripts that are no longer needed:
- ❌ `eri_stub_verification.js`
- ❌ `s15_flow2_salary_truth.js`
- ❌ `s15_flow3_capital_gains_truth.js`
- ❌ `s15_flow4_regime_truth.js`
- ❌ `s15_flow5_filing_safety_truth.js`
- ❌ `s16_flow4_regime_truth.js`
- ❌ `s18_freeze_truth.js`
- ❌ `s19_state_machine_truth.js`
- ❌ `s20a_direct_submission_truth.js`
- ❌ `s21_eri_worker_truth.js`
- ❌ `s21_minimal_test.js`
- ❌ `s21_model_smoke_test.js`

**Action**: Move to `backend/_deprecated/verification_scripts/` or DELETE

---

### Backend - Migration Scripts (KEEP but organize)

**Location**: `backend/`

These should be moved to `backend/migrations/`:
- `run_eri_attempts_migration.js`
- `run_migration.js`
- `run_snapshots_migration.js`

**Action**: Move to `backend/migrations/manual/`

---

### Backend - Manual Test Scripts (KEEP but organize)

**Location**: `backend/scripts/`

These are useful for manual testing:
- ✅ KEEP: `manual_eri_verification.js`
- ✅ KEEP: `test_eri_query.js`
- ✅ KEEP: `test_eri_signing.js`
- ✅ KEEP: `test_financial_story_ux.js`
- ✅ KEEP: `test_s22_applicability.js`
- ✅ KEEP: `test_s23_export.js`
- ✅ KEEP: `test_s24_tax_computation.js`

**Action**: Already in correct location (`backend/scripts/`)

---

### Frontend - Old Features (DELETE or UPDATE)

**Location**: `frontend/src/features/`

Need to audit each feature directory:

1. **`features/pdf-export/`** - ⚠️ AUDIT
   - Calls old `/api/itr/drafts` and `/api/itr/filings`
   - If used: UPDATE to `/api/filings`
   - If not used: DELETE

2. **`features/tax-optimizer/`** - ⚠️ AUDIT
   - Calls `/api/itr/filings`
   - If used: UPDATE to `/api/filings`
   - If not used: DELETE

3. **`features/foreign-assets/`** - ⚠️ AUDIT
   - Calls `/api/itr/filings`
   - If used: UPDATE to `/api/filings`
   - If not used: DELETE

4. **`features/taxes-paid/`** - ⚠️ AUDIT
   - Calls `/api/itr/filings`
   - If used: UPDATE to `/api/filings`
   - If not used: DELETE

5. **`features/discrepancy/`** - ⚠️ AUDIT
   - Calls `/api/itr/filings`
   - If used: UPDATE to `/api/filings`
   - If not used: DELETE

6. **`features/itr/`** - ⚠️ AUDIT
   - Previous year copy functionality
   - If used: KEEP
   - If not used: DELETE

**Action**: Run audit to check if imported in App.js

---

### Frontend - Old Services (DELETE)

**Location**: `frontend/src/services/`

Already verified as unused:
- ✅ DELETED: `personalInfoService.js`
- ✅ DELETED: `userDashboardService.js`
- ✅ DELETED: `filingListService.js`

**Potentially unused** (need verification):
- ❌ `AutoPopulationService.js`
- ❌ `AutoPopulationITRService.js`
- ❌ `ITRAutoFillService.js`
- ❌ `AISForm26ASService.js`
- ❌ `BankAPIService.js`
- ❌ `BrokerAPIService.js`
- ❌ `CapitalGainsOCRService.js`
- ❌ `DeductionOCRService.js`
- ❌ `RentReceiptOCRService.js`
- ❌ `Form16ExtractionService.js`
- ❌ `DocumentProcessingService.js`
- ❌ `DataIntegrationService.js`
- ❌ `BankStatementService.js`

**Action**: Run grep to check imports, DELETE if not imported

---

### Frontend - Old Hooks (DELETE)

**Location**: `frontend/src/hooks/`

Already verified as unused:
- ✅ DELETED: `useUserDashboard.js`

**Potentially unused** (need verification):
- ❌ `useDraftManagement.js`
- ❌ `useFilingContext.js`
- ❌ `useITRPersistence.js`
- ❌ `useRealtimeSync.js`
- ❌ `useAdminDashboardRealtime.js`
- ❌ `useDashboardRealtime.js`
- ❌ `useSmartPolling.js`
- ❌ `useBulkUpdateFilings.js`
- ❌ `useFinancialBlueprint.js`
- ❌ `useIntakeStore.js`

**Action**: Run grep to check imports, DELETE if not imported

---

### Frontend - Old Pages (DELETE)

**Location**: `frontend/src/pages/ITR/`

Already verified as unused and deleted:
- ✅ DELETED: `YearTypeSelection.js`
- ✅ DELETED: `ITRComputation.js`
- ✅ DELETED: `DetermineITR.js`

**Need verification**:
- ⚠️ `AssessmentNotices.js` - Check if route exists
- ⚠️ `FilingAnalytics.js` - Check if route exists
- ⚠️ `ITRVTracking.js` - Check if route exists
- ⚠️ `RefundTracking.js` - Check if route exists
- ⚠️ `TaxDemands.js` - Check if route exists
- ⚠️ `EVerification.js` - Check if route exists
- ⚠️ `FilingHistory.js` - Check if route exists

**Action**: Check App.js for routes, DELETE if no route

---

### Frontend - Old Dashboards (DELETE)

**Location**: `frontend/src/pages/Dashboard/`

Already verified as unused and deleted:
- ✅ DELETED: `UserDashboard.js`

**Keep**:
- ✅ KEEP: `UserDashboardV2.js` - Canonical dashboard
- ✅ KEEP: `CAFirmAdminDashboard.js` - CA firm admin
- ✅ KEEP: `CAStaffDashboard.js` - CA staff

---

## Clean Repository Structure

### Recommended Final Structure

```
bbofficial/
├── docs/
│   ├── architecture/
│   │   ├── SYSTEM_MAP.md
│   │   ├── MODULE_OWNERSHIP.md
│   │   ├── DEV_ENTRYPOINTS.md
│   │   ├── S15_AUTH_TRUTH.md
│   │   └── S15_LAYER1_STRUCTURAL_TRUTH.md
│   ├── contracts/
│   │   └── LIFECYCLE_CONTRACT.md
│   ├── deployment/
│   │   └── ERI_DEPLOYMENT.md
│   └── README.md
│
├── backend/
│   ├── src/
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   ├── models/          # Database models
│   │   ├── domain/          # Domain logic
│   │   ├── middleware/      # Express middleware
│   │   └── utils/           # Utilities
│   ├── scripts/             # Manual test scripts
│   ├── migrations/          # Database migrations
│   │   └── manual/          # Manual migration scripts
│   ├── _deprecated/         # Old code (not deleted yet)
│   │   └── verification_scripts/
│   └── README.md
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard/   # UserDashboardV2 only
│   │   │   ├── Filing/      # Financial Story UX screens
│   │   │   └── ITR/         # IncomeSourcesSelection, FilingHistory
│   │   ├── components/      # Reusable components
│   │   ├── services/        # API clients (canonical only)
│   │   ├── hooks/           # React hooks (active only)
│   │   ├── utils/           # Utilities
│   │   └── routes/          # Route definitions
│   ├── _deprecated/         # Old code (not deleted yet)
│   │   ├── features/        # Old feature directories
│   │   ├── services/        # Old service files
│   │   └── hooks/           # Old hook files
│   └── README.md
│
└── README.md
```

---

## Execution Plan

### Phase 1: Documentation Organization ✅ COMPLETE

- [x] Create `docs/` directory structure
- [x] Move architecture docs
- [x] Move contract docs
- [x] Move deployment docs

### Phase 2: Backend Cleanup (Next)

- [ ] Move verification scripts to `_deprecated/`
- [ ] Move migration scripts to `migrations/manual/`
- [ ] Delete old test scripts (if not needed)
- [ ] Update README with new structure

### Phase 3: Frontend Feature Audit (Next)

- [ ] Audit `features/` directory
- [ ] Check if each feature is imported in App.js
- [ ] Update or delete based on usage

### Phase 4: Frontend Service Cleanup (Next)

- [ ] Run grep for each service file
- [ ] Delete services not imported anywhere
- [ ] Move deleted services to `_deprecated/`

### Phase 5: Frontend Hook Cleanup (Next)

- [ ] Run grep for each hook file
- [ ] Delete hooks not imported anywhere
- [ ] Move deleted hooks to `_deprecated/`

### Phase 6: Frontend Page Cleanup (Next)

- [ ] Check App.js for ITR page routes
- [ ] Delete pages without routes
- [ ] Move deleted pages to `_deprecated/`

---

## Verification Commands

### Check if file is imported
```bash
grep -r "import.*FileName" frontend/src --exclude-dir=node_modules
```

### Check if service is used
```bash
grep -r "serviceName\." frontend/src --exclude-dir=node_modules
```

### Check if hook is used
```bash
grep -r "hookName(" frontend/src --exclude-dir=node_modules
```

### Check if route exists
```bash
grep "ComponentName" frontend/src/App.js
```

---

## Expected Results

**Files to Delete**: ~60-80 files
**Files to Move**: ~20-30 files
**Directories to Create**: 4 (docs structure)
**Directories to Delete**: ~10-15 feature directories

---

## Next Action

Execute Phase 2 (Backend Cleanup) after user approval.
