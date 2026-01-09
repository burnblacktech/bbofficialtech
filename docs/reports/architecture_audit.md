# Canonical Architecture Compliance Audit

## Status: CRITICAL ISSUES FOUND

---

## Executive Summary

The codebase has **old routes and components still active** that bypass the canonical architecture. This creates:
1. **404 errors** for users
2. **Confusion** about which code paths are active
3. **Maintenance burden** from duplicate code
4. **Risk** of data inconsistency

---

## Critical Issues

### 1. Old Dashboard Still Active ❌

**Location**: `frontend/src/App.js:371`

```javascript
<Route
  path="/dashboard"
  element={
    <Layout>
      <Suspense fallback={<RouteLoader message="Loading dashboard..." />}>
        <UserDashboard />  // ❌ OLD - calls /api/itr/drafts and /api/itr/filings
      </Suspense>
    </Layout>
  }
/>
```

**Problem**:
- Uses old `UserDashboard` component
- Calls non-existent `/api/itr/drafts` endpoint (404)
- Calls non-existent `/api/itr/filings` endpoint (404)
- Should use `UserDashboardV2` which calls `/api/filings`

**Impact**: Users see 404 errors on dashboard load

---

### 2. Old Service Files Still Referenced ❌

**Files calling old `/api/itr/drafts` endpoints**:
- `frontend/src/services/personalInfoService.js` (4 calls)
- `frontend/src/features/pdf-export/services/pdf-export.service.js` (1 call)

**Files calling old `/api/itr/filings` endpoints**:
- `frontend/src/services/RentReceiptOCRService.js`
- `frontend/src/services/itrJsonExportService.js`
- `frontend/src/features/taxes-paid/services/tax-payment.service.js`
- `frontend/src/features/tax-optimizer/services/tax-simulation.service.js`
- `frontend/src/features/pdf-export/services/pdf-export.service.js`
- `frontend/src/features/itr/services/previous-year.service.js`
- `frontend/src/features/foreign-assets/services/foreign-assets.service.js`
- `frontend/src/features/discrepancy/components/discrepancy-report.jsx`

**Problem**: These services will fail with 404 errors

---

## Canonical Architecture (Correct)

### Backend Routes ✅
- `POST /api/filings` - Create filing
- `GET /api/filings` - List filings
- `GET /api/filings/:id` - Get filing details
- `PUT /api/filings/:id` - Update filing
- `GET /api/filings/:id/overview` - Financial Story overview
- `GET /api/filings/:id/income-story` - Income story
- `GET /api/filings/:id/tax-breakdown` - Tax breakdown
- `GET /api/filings/:id/readiness` - Filing readiness
- `GET /api/filings/:id/submission-status` - ERI outcome

### Frontend Components ✅
- `UserDashboardV2` - Calls `/api/filings`
- `IncomeSourcesSelection` - Entry point
- `FilingOverview` - Financial Story screen 1
- `IncomeStory` - Financial Story screen 2
- `SalaryDetails` - Progressive data entry
- `TaxBreakdown` - S24 projection
- `FilingReadiness` - Pre-submission
- `SubmissionStatus` - ERI outcome

---

## Recommendations

### Immediate (Critical)

1. **Replace UserDashboard with UserDashboardV2**
   ```javascript
   // frontend/src/App.js:371
   <UserDashboardV2 />  // ✅ Canonical
   ```

2. **Remove old dashboard import**
   ```javascript
   // Remove this line if it exists
   const UserDashboard = lazy(() => import('./pages/Dashboard/UserDashboard'));
   ```

### Short-term (High Priority)

3. **Audit and update service files**
   - Replace `/api/itr/drafts` with `/api/filings`
   - Replace `/api/itr/filings` with `/api/filings`
   - Or mark as deprecated if not used

4. **Remove unused service files**
   - If services are not imported anywhere, delete them
   - Move to `_deprecated/` folder if unsure

### Long-term (Cleanup)

5. **Create deprecation inventory**
   - List all files in `features/` directory
   - Identify which are used vs unused
   - Move unused to `_deprecated/`

6. **Remove old hooks**
   - `useUserDrafts` - calls `/api/itr/drafts`
   - `useUserFilings` - calls `/api/itr/filings`
   - Replace with direct axios calls to `/api/filings`

---

## Verification Checklist

- [ ] `/dashboard` route uses `UserDashboardV2`
- [ ] No 404 errors on dashboard load
- [ ] All filing operations use `/api/filings` endpoints
- [ ] Old service files marked as deprecated or removed
- [ ] No references to `/api/itr/drafts` in active code
- [ ] No references to `/api/itr/filings` in active code

---

## Files to Update

### High Priority
1. `frontend/src/App.js` - Replace UserDashboard with UserDashboardV2
2. `frontend/src/services/personalInfoService.js` - Update or deprecate
3. `frontend/src/hooks/useUserDashboard.js` - Update or deprecate

### Medium Priority
4. All files in `frontend/src/features/` - Audit for old endpoints
5. `frontend/src/services/` - Audit for old endpoints

---

## Success Criteria

✅ **Zero 404 errors** on dashboard load
✅ **All filing operations** use canonical `/api/filings` endpoints
✅ **No old code paths** active in production
✅ **Clear separation** between active and deprecated code

---

**Next Action**: Replace `UserDashboard` with `UserDashboardV2` in App.js
