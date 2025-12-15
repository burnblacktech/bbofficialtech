# Frontend Environment Variables Guide

## Overview

This document describes the environment variables required for the frontend application and how to configure them for different environments (development, preview, production).

## Required Environment Variables

### `REACT_APP_API_URL`

**Description**: Base URL for API requests

**Default Behavior**:
- If not set, the application uses:
  - **Production**: `/api` (relative path, works with Vercel rewrites)
  - **Development**: `http://localhost:3002/api`

**Recommended Values**:
- **Development**: `http://localhost:3002/api` (or leave unset to use default)
- **Production/Preview**: `/api` (relative path recommended for Vercel)

**Why Relative Paths?**
- Relative paths (`/api`) work seamlessly with Vercel's routing configuration
- No need to update when domain changes
- Works with preview deployments automatically
- Avoids CORS issues

## Setting Environment Variables

### Vercel Dashboard

1. Go to your project in Vercel Dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add variable:
   - **Key**: `REACT_APP_API_URL`
   - **Value**: `/api`
   - **Environment**: Select all (Production, Preview, Development)

### Local Development

Create a `.env` file in the `frontend/` directory:

```env
REACT_APP_API_URL=http://localhost:3002/api
```

Or use `.env.local` for local overrides (this file is gitignored):

```env
REACT_APP_API_URL=http://localhost:3002/api
```

## Environment Variable Naming

**Important**: React requires environment variables to be prefixed with `REACT_APP_` to be accessible in the browser.

- ✅ `REACT_APP_API_URL` - Accessible in browser
- ❌ `API_URL` - Not accessible in browser (only in Node.js build process)

## API URL Configuration

The application uses a centralized configuration utility located at:
- `frontend/src/utils/apiConfig.js`

This utility provides the `getApiBaseUrl()` function that:
1. Checks for `REACT_APP_API_URL` environment variable
2. Falls back to `/api` in production
3. Falls back to `http://localhost:3002/api` in development

### Usage in Code

```javascript
import { getApiBaseUrl } from '../utils/apiConfig';

const apiUrl = getApiBaseUrl();
```

## Common Issues

### CORS Errors in Production

**Symptom**: `Access to XMLHttpRequest at 'http://localhost:3002/api/...' has been blocked by CORS policy`

**Cause**: Hardcoded localhost URL or missing `REACT_APP_API_URL` in production

**Solution**: 
1. Set `REACT_APP_API_URL=/api` in Vercel environment variables
2. Ensure all services use `getApiBaseUrl()` from `apiConfig.js`
3. Check for any remaining hardcoded localhost URLs

### API Calls Failing in Production

**Symptom**: All API requests return 404 or fail

**Cause**: Incorrect API URL configuration

**Solution**:
1. Verify `REACT_APP_API_URL` is set to `/api` (relative path)
2. Check Vercel routing configuration in `vercel.json`
3. Ensure backend routes are properly registered

## Best Practices

1. **Always use relative paths in production** (`/api` instead of full URLs)
2. **Use the centralized `apiConfig.js` utility** instead of duplicating logic
3. **Never hardcode localhost URLs** in production code
4. **Test with environment variables** before deploying to production
5. **Document any new environment variables** in this file

## Verification

To verify environment variables are set correctly:

1. **In Browser Console** (production):
   ```javascript
   console.log(process.env.REACT_APP_API_URL);
   // Should log: "/api"
   ```

2. **Check Network Tab**:
   - API requests should go to `/api/...` (relative)
   - Not `http://localhost:3002/api/...`

3. **Build Logs**:
   - Check Vercel build logs for environment variable warnings
   - Ensure variables are available during build time

## Related Documentation

- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Create React App Environment Variables](https://create-react-app.dev/docs/adding-custom-environment-variables/)
- [Vercel Deployment Guide](./VERCEL_DEPLOYMENT_GUIDE.md)

