# Vercel 404 NOT_FOUND Troubleshooting Guide

## Common Causes

### 1. Frontend Build Not Completing

**Symptom:** 404 error on root URL, but build shows success

**Solution:**
- Check if `frontend/build` directory exists after build
- Verify `frontend/package.json` has a `build` script
- Ensure build command runs successfully

**Check:**
```bash
# In Vercel build logs, look for:
Building frontend...
Build completed
```

### 2. Missing Build Command in vercel.json

**Symptom:** Frontend not building or build output not found

**Solution:** Add build command to `vercel.json`:

```json
{
  "builds": [
    {
      "src": "frontend/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "build"
      }
    }
  ]
}
```

**Note:** `@vercel/static-build` automatically runs `npm run build` if a `build` script exists in `package.json`.

### 3. Incorrect Route Configuration

**Symptom:** Routes not matching correctly

**Solution:** Ensure routes are in correct order in `vercel.json`:

```json
{
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "backend/api/index.js"
    },
    {
      "src": "/(.*\\.(js|css|woff|woff2|ttf|eot|svg|png|jpg|jpeg|gif|ico))",
      "dest": "frontend/build/$1"
    },
    {
      "src": "/(.*)",
      "dest": "frontend/build/index.html"
    }
  ]
}
```

**Important:** The catch-all route `"/(.*)"` must be **last** to serve `index.html` for all non-API routes.

### 4. Build Output Directory Mismatch

**Symptom:** Files not found in expected location

**Solution:** Verify `distDir` matches your build output:

- React apps: `build` (default)
- Next.js: `.next`
- Vue: `dist`

**Check your `frontend/package.json`:**
```json
{
  "scripts": {
    "build": "react-scripts build"  // Outputs to 'build' directory
  }
}
```

### 5. Environment Variables Missing

**Symptom:** Build fails silently or frontend can't connect to API

**Solution:** Ensure all required environment variables are set in Vercel:
- `REACT_APP_API_URL` (for frontend)
- `JWT_SECRET`, `SESSION_SECRET` (for backend)
- Database credentials
- API keys

### 6. CI Environment Variable

**Symptom:** Build fails due to ESLint warnings treated as errors

**Solution:** Set `CI=false` in build environment:

```json
{
  "env": {
    "CI": "false"
  }
}
```

Or in `frontend/package.json`:
```json
{
  "scripts": {
    "build": "CI=false react-scripts build"
  }
}
```

## Debugging Steps

### Step 1: Check Build Logs

In Vercel dashboard:
1. Go to **Deployments**
2. Click on the failed deployment
3. Check **Build Logs** tab
4. Look for errors in:
   - Frontend build
   - Backend build
   - Route configuration

### Step 2: Verify Build Output

Check if files are generated:

```bash
# In Vercel build logs, look for:
✓ Built in X seconds
✓ Output directory: frontend/build
```

### Step 3: Test API Routes

Test if backend is working:

```bash
# Test health endpoint
curl https://your-domain.vercel.app/health

# Test API endpoint
curl https://your-domain.vercel.app/api/health
```

### Step 4: Test Frontend Routes

Test if frontend is being served:

```bash
# Test root route
curl https://your-domain.vercel.app/

# Should return HTML (not 404)
```

### Step 5: Check Route Order

Routes are matched in order. Ensure:
1. API routes come first
2. Static assets come second
3. Catch-all route comes last

## Quick Fixes

### Fix 1: Add Explicit Build Command

If using `@vercel/static-build`, ensure `package.json` has:

```json
{
  "scripts": {
    "build": "react-scripts build"
  }
}
```

### Fix 2: Verify distDir

In `vercel.json`:

```json
{
  "builds": [
    {
      "src": "frontend/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "build"  // Must match your build output
      }
    }
  ]
}
```

### Fix 3: Check Route Pattern

Ensure catch-all route is last:

```json
{
  "routes": [
    { "src": "/api/(.*)", "dest": "backend/api/index.js" },
    { "src": "/(.*\\.(js|css|...))", "dest": "frontend/build/$1" },
    { "src": "/(.*)", "dest": "frontend/build/index.html" }  // Last!
  ]
}
```

### Fix 4: Add Missing Environment Variables

In Vercel dashboard:
1. Go to **Settings** → **Environment Variables**
2. Add all required variables
3. Redeploy

## Common Error Messages

### "404: NOT_FOUND"
- **Cause:** Route not matching or file not found
- **Fix:** Check route configuration and build output

### "Build failed"
- **Cause:** Build script error or missing dependencies
- **Fix:** Check build logs for specific error

### "Module not found"
- **Cause:** Missing dependency or incorrect import path
- **Fix:** Run `npm install` and check import paths

### "Cannot find module"
- **Cause:** Missing file or incorrect path
- **Fix:** Verify file exists and path is correct

## Verification Checklist

- [ ] Frontend build completes successfully
- [ ] `frontend/build` directory exists after build
- [ ] `frontend/build/index.html` exists
- [ ] Routes are in correct order in `vercel.json`
- [ ] `distDir` matches build output directory
- [ ] All environment variables are set
- [ ] API routes work (`/api/health`)
- [ ] Frontend routes work (root `/`)

## Still Not Working?

1. **Check Vercel Function Logs:**
   - Go to **Functions** tab in Vercel dashboard
   - Check for runtime errors

2. **Test Locally:**
   ```bash
   # Build frontend
   cd frontend
   npm run build
   
   # Check if build output exists
   ls -la build/
   ```

3. **Review Build Logs:**
   - Look for warnings or errors
   - Check if all steps complete

4. **Contact Support:**
   - Share build logs
   - Share `vercel.json` configuration
   - Share error message

---

**Last Updated**: 2025-01-XX
**Version**: 1.0

