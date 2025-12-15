# ⚠️ CRITICAL: Vercel Environment Variable Setup Required

## Immediate Action Required

**The deployment is still using localhost URLs because the environment variable is not set in Vercel.**

## Step-by-Step Setup

### 1. Go to Vercel Dashboard

1. Navigate to: https://vercel.com/dashboard
2. Select your project: **bbofficialtech** (or your project name)
3. Click on **Settings** tab
4. Click on **Environment Variables** in the left sidebar

### 2. Add Environment Variable

Click **Add New** and enter:

- **Key**: `REACT_APP_API_URL`
- **Value**: `/api`
- **Environment**: 
  - ✅ Production
  - ✅ Preview  
  - ✅ Development

Click **Save**

### 3. Redeploy

After adding the environment variable:

1. Go to **Deployments** tab
2. Click the **⋯** (three dots) on the latest deployment
3. Click **Redeploy**
4. Or push a new commit to trigger a new deployment

## Why This Is Required

React environment variables are **embedded at BUILD time**, not runtime. This means:

- ❌ If `REACT_APP_API_URL` is not set during build → Falls back to localhost
- ✅ If `REACT_APP_API_URL=/api` is set during build → Uses `/api` (relative path)

## Verification

After redeploying, check:

1. **Browser Console**: Should NOT see `http://localhost:3002/api/...` errors
2. **Network Tab**: API requests should go to `/api/...` (relative)
3. **No CORS Errors**: Should not see CORS policy errors

## Current Status

- ✅ Code is fixed to use `/api` in production
- ❌ Environment variable not set in Vercel
- ❌ Build is using localhost fallback

## After Setting Environment Variable

Once you set `REACT_APP_API_URL=/api` and redeploy:

- ✅ All API calls will use `/api` (relative path)
- ✅ No more CORS errors
- ✅ Landing page will load stats and testimonials
- ✅ Web vitals endpoint will work (500 error fixed)

## Quick Test

After redeploying, open browser console and run:

```javascript
console.log(process.env.REACT_APP_API_URL);
// Should log: "/api"
```

If it logs `undefined`, the environment variable is not set correctly.

