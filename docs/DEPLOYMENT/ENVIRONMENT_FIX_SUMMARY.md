# Environment Configuration Fix - Summary

## What Was Fixed

This document summarizes the fixes applied to resolve hardcoded localhost URLs and environment configuration issues.

## Changes Made

### 1. Backend Changes

**File**: `backend/src/routes/api.js`
- ✅ Registered analytics route: `/api/analytics` → `./analytics`
- This fixes the 500 errors on `/api/analytics/web-vitals` endpoint

### 2. Frontend Changes

#### Created Centralized API Configuration

**File**: `frontend/src/utils/apiConfig.js` (NEW)
- Centralized utility for API base URL
- Automatically uses `/api` in production, `http://localhost:3002/api` in development
- All services should import and use `getApiBaseUrl()` from this file

#### Updated Services to Use Centralized Config

**Files Updated**:
- ✅ `frontend/src/services/core/APIClient.js` - Uses `getApiBaseUrl()`
- ✅ `frontend/src/services/surepassService.js` - Replaced all hardcoded URLs with `apiClient` calls
- ✅ `frontend/src/services/api/authService.js` - Uses centralized config
- ✅ `frontend/src/store/index.js` - Uses `getApiBaseUrl()`
- ✅ `frontend/src/services/filingListService.js` - Uses `getApiBaseUrl()`
- ✅ `frontend/src/services/CABotService.js` - Uses `getApiBaseUrl()`

#### Added ESLint Rule

**File**: `frontend/.eslintrc.js`
- ✅ Added `no-restricted-syntax` rule to prevent hardcoded localhost URLs
- Will catch future hardcoded URLs during development

#### Documentation

**File**: `docs/DEPLOYMENT/FRONTEND_ENV_VARIABLES.md` (NEW)
- Complete guide on environment variables
- How to set them in Vercel
- Troubleshooting common issues

## What You Need to Do

### Set Environment Variable in Vercel

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add new variable:
   - **Key**: `REACT_APP_API_URL`
   - **Value**: `/api`
   - **Environment**: Select all (Production, Preview, Development)
3. Redeploy your application

### Why `/api`?

- Relative paths work seamlessly with Vercel's routing
- No CORS issues
- Works automatically with preview deployments
- No need to update when domain changes

## Testing Checklist

After redeploying with the environment variable set:

- [ ] Landing page loads without CORS errors
- [ ] Stats and testimonials load correctly
- [ ] Web vitals endpoint returns 200 (not 500)
- [ ] SurePass service works in production
- [ ] All API calls use `/api` (check browser network tab)
- [ ] No console errors about localhost URLs

## Verification

### Check Environment Variable

In browser console (production):
```javascript
console.log(process.env.REACT_APP_API_URL);
// Should log: "/api"
```

### Check Network Requests

Open browser DevTools → Network tab:
- ✅ API requests should go to `/api/...` (relative)
- ❌ Should NOT see `http://localhost:3002/api/...`

## Prevention

The following measures prevent future issues:

1. **ESLint Rule**: Catches hardcoded localhost URLs during development
2. **Centralized Config**: All services use `apiConfig.js` utility
3. **Documentation**: `FRONTEND_ENV_VARIABLES.md` guides future developers
4. **Code Review**: Check for any remaining hardcoded URLs

## Related Files

- `frontend/src/utils/apiConfig.js` - Centralized API URL configuration
- `docs/DEPLOYMENT/FRONTEND_ENV_VARIABLES.md` - Environment variables guide
- `frontend/.eslintrc.js` - ESLint rules including localhost URL prevention

## Next Steps

1. Set `REACT_APP_API_URL=/api` in Vercel
2. Redeploy application
3. Test all functionality
4. Monitor for any remaining errors

