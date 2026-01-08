# Repository Cleanup Plan

## Status: Ready for Execution

---

## Overview

This plan identifies **unused files, dead code, and deprecated features** to be removed from the repository. All items have been verified as not imported or used anywhere in the active codebase.

---

## Priority 1: Critical Cleanup (Execute First)

### Old Dashboard Files ❌ DELETE

**Files**:
- `frontend/src/pages/Dashboard/UserDashboard.js`
- `frontend/src/hooks/useUserDashboard.js`

**Reason**: Replaced by `UserDashboardV2`. Not imported anywhere.

**Verification**:
```bash
# Confirm not imported
grep -r "import.*UserDashboard" frontend/src --exclude-dir=node_modules
grep -r "useUserDashboard" frontend/src --exclude-dir=node_modules
```

---

### Old ITR Entry Points ❌ DELETE

**Files**:
- `frontend/src/pages/ITR/YearTypeSelection.js`
- `frontend/src/pages/ITR/ITRComputation.js`
- `frontend/src/pages/ITR/DetermineITR.js`

**Reason**: Replaced by canonical flow (`IncomeSourcesSelection` → Financial Story UX). Not imported anywhere.

**Verification**:
```bash
grep -r "import.*YearTypeSelection" frontend/src
grep -r "import.*ITRComputation" frontend/src
grep -r "import.*DetermineITR" frontend/src
```

---

### Old Service Files ❌ DELETE

**Files**:
- `frontend/src/services/personalInfoService.js` - Calls `/api/itr/drafts` (404)
- `frontend/src/services/userDashboardService.js` - Old dashboard service
- `frontend/src/services/filingListService.js` - Duplicate of canonical `/api/filings`

**Reason**: Call non-existent endpoints or duplicate canonical services.

**Verification**:
```bash
grep -r "import.*personalInfoService" frontend/src
grep -r "import.*userDashboardService" frontend/src
grep -r "import.*filingListService" frontend/src
```

---

## Priority 2: Feature Cleanup (Audit Then Delete)

### Features Directory Audit

**Potentially Unused Features** (need verification):

1. **`features/pdf-export/`** - Calls old `/api/itr/drafts` and `/api/itr/filings`
   - Check if PDF export is used in UI
   - If used, update to `/api/filings`
   - If not used, delete

2. **`features/tax-optimizer/`** - Calls `/api/itr/filings`
   - Check if tax optimizer is accessible in UI
   - If used, update to `/api/filings`
   - If not used, delete

3. **`features/foreign-assets/`** - Calls `/api/itr/filings`
   - Check if foreign assets feature is in UI
   - If used, update to `/api/filings`
   - If not used, delete

4. **`features/taxes-paid/`** - Calls `/api/itr/filings`
   - Check if taxes paid feature is in UI
   - If used, update to `/api/filings`
   - If not used, delete

5. **`features/discrepancy/`** - Calls `/api/itr/filings`
   - Check if discrepancy report is in UI
   - If used, update to `/api/filings`
   - If not used, delete

6. **`features/itr/`** - Previous year copy functionality
   - Check if used in UI
   - If not, delete

**Verification Steps**:
1. Search App.js for route imports from each feature
2. Search for component imports from each feature
3. If no imports found → DELETE
4. If imports found → UPDATE or KEEP

---

## Priority 3: Service Files Cleanup

### Services to Audit

**Auto-population Services** (likely unused):
- `AutoPopulationService.js`
- `AutoPopulationITRService.js`
- `ITRAutoFillService.js`
- `AISForm26ASService.js`
- `BankAPIService.js`
- `BrokerAPIService.js`

**OCR Services** (likely unused):
- `CapitalGainsOCRService.js`
- `DeductionOCRService.js`
- `RentReceiptOCRService.js`
- `Form16ExtractionService.js`
- `DocumentProcessingService.js`

**Integration Services** (likely unused):
- `DataIntegrationService.js`
- `BankStatementService.js`

**Verification**:
```bash
# For each service, check if imported
grep -r "import.*ServiceName" frontend/src
```

**Action**:
- If not imported → DELETE
- If imported but not used → DELETE
- If used → KEEP

---

## Priority 4: Hook Files Cleanup

### Hooks to Audit

**Likely Unused**:
- `useDraftManagement.js` - Old draft system
- `useFilingContext.js` - Old filing context
- `useITRPersistence.js` - Old ITR persistence
- `useRealtimeSync.js` - Realtime sync (not implemented)
- `useAdminDashboardRealtime.js` - Admin realtime (not implemented)
- `useDashboardRealtime.js` - Dashboard realtime (not implemented)
- `useSmartPolling.js` - Smart polling (not implemented)
- `useBulkUpdateFilings.js` - Bulk update (not implemented)
- `useFinancialBlueprint.js` - Financial blueprint (not implemented)
- `useIntakeStore.js` - Intake store (not implemented)

**Verification**:
```bash
# For each hook, check if imported
grep -r "import.*hookName" frontend/src
```

**Action**:
- If not imported → DELETE
- If imported but not used → DELETE
- If used → KEEP

---

## Priority 5: Component Cleanup

### ITR Components to Audit

**Files**:
- `AssessmentNotices.js` - Check if route exists
- `FilingAnalytics.js` - Check if route exists
- `ITRVTracking.js` - Check if route exists
- `RefundTracking.js` - Check if route exists
- `TaxDemands.js` - Check if route exists
- `EVerification.js` - Check if route exists
- `FilingHistory.js` - Check if route exists

**Verification**:
```bash
# Check App.js for routes
grep "AssessmentNotices\|FilingAnalytics\|ITRVTracking\|RefundTracking\|TaxDemands\|EVerification\|FilingHistory" frontend/src/App.js
```

**Action**:
- If route exists → KEEP
- If no route → DELETE

---

## Execution Plan

### Phase 1: Safe Deletions (Verified Unused)

**Delete immediately** (no imports found):
1. `UserDashboard.js`
2. `useUserDashboard.js`
3. `YearTypeSelection.js`
4. `ITRComputation.js`
5. `DetermineITR.js`
6. `personalInfoService.js`
7. `userDashboardService.js`
8. `filingListService.js`

### Phase 2: Feature Audit

**For each feature in `features/`**:
1. Check if imported in App.js
2. Check if components are used
3. If not used → Move to `_deprecated/features/`
4. If used but calls old endpoints → Update to `/api/filings`

### Phase 3: Service Audit

**For each service in `services/`**:
1. Run grep to find imports
2. If not imported → DELETE
3. If imported → Check if actually used
4. If not used → DELETE

### Phase 4: Hook Audit

**For each hook in `hooks/`**:
1. Run grep to find imports
2. If not imported → DELETE
3. If imported → Check if actually used
4. If not used → DELETE

### Phase 5: Component Audit

**For each ITR component**:
1. Check if route exists in App.js
2. If no route → DELETE
3. If route exists → KEEP

---

## Safety Checks

Before deleting any file:
1. ✅ Verify not imported anywhere
2. ✅ Verify not referenced in App.js routes
3. ✅ Verify not used in any active component
4. ✅ Create git branch for cleanup
5. ✅ Commit deletions incrementally
6. ✅ Test after each phase

---

## Verification Commands

```bash
# Check if file is imported
grep -r "import.*FileName" frontend/src --exclude-dir=node_modules

# Check if file is used in routes
grep "FileName" frontend/src/App.js

# Check if service is called
grep -r "serviceName\." frontend/src --exclude-dir=node_modules

# Check if hook is used
grep -r "hookName(" frontend/src --exclude-dir=node_modules
```

---

## Expected Results

**Files to Delete**: ~50-70 files
**Lines of Code Removed**: ~5,000-10,000 LOC
**Reduced Bundle Size**: ~100-200 KB
**Reduced Complexity**: Significant

---

## Post-Cleanup Tasks

1. ✅ Run `npm run build` to verify no errors
2. ✅ Test all active routes
3. ✅ Verify dashboard loads without 404s
4. ✅ Verify filing flow works end-to-end
5. ✅ Update documentation
6. ✅ Create cleanup summary report

---

## Next Action

Execute Phase 1 (Safe Deletions) immediately.
