# Fixing Vercel 404 NOT_FOUND Error

## Quick Diagnosis

If you're getting `404: NOT_FOUND` after a successful build, the issue is likely:

1. **Frontend build not completing** - Check build logs
2. **Build output not found** - Verify `frontend/build` directory exists
3. **Route configuration issue** - Check route order in `vercel.json`

## Immediate Fix

### Step 1: Check Build Logs

In Vercel dashboard:
1. Go to **Deployments** → Click your deployment
2. Check **Build Logs** tab
3. Look for:
   ```
   Building frontend...
   ✓ Built in X seconds
   ```

If you see build errors, fix those first.

### Step 2: Verify Frontend Build

The frontend build should output to `frontend/build/`. Check if:
- `frontend/build/index.html` exists
- `frontend/build/static/` directory exists

### Step 3: Test Routes

**Test API:**
```bash
curl https://your-domain.vercel.app/api/health
```

**Test Frontend:**
```bash
curl https://your-domain.vercel.app/
```

## Common Solutions

### Solution 1: Add Build Command Explicitly

If using `@vercel/static-build`, ensure your `frontend/package.json` has:

```json
{
  "scripts": {
    "build": "CI=false react-scripts build"
  }
}
```

### Solution 2: Fix Route Order

Routes must be in this order:

```json
{
  "routes": [
    { "src": "/api/(.*)", "dest": "backend/api/index.js" },
    { "src": "/(.*\\.(js|css|...))", "dest": "frontend/build/$1" },
    { "src": "/(.*)", "dest": "frontend/build/index.html" }  // Must be last!
  ]
}
```

### Solution 3: Check distDir

In `vercel.json`, ensure `distDir` matches your build output:

```json
{
  "builds": [
    {
      "src": "frontend/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "build"  // Must match React's build output
      }
    }
  ]
}
```

### Solution 4: Add Missing File Extensions

Update static file route to include all file types:

```json
{
  "src": "/(.*\\.(js|css|woff|woff2|ttf|eot|svg|png|jpg|jpeg|gif|ico|json|map))",
  "dest": "frontend/build/$1"
}
```

## Debugging Checklist

- [ ] Frontend build completes in logs
- [ ] `frontend/build/index.html` exists after build
- [ ] Routes are in correct order (API first, catch-all last)
- [ ] `distDir` matches build output directory
- [ ] All environment variables are set
- [ ] No build errors in logs

## Still Not Working?

1. **Check Function Logs:**
   - Vercel Dashboard → Functions tab
   - Look for runtime errors

2. **Test Locally:**
   ```bash
   cd frontend
   npm run build
   ls -la build/  # Should see index.html
   ```

3. **Redeploy:**
   - Sometimes a fresh deployment fixes routing issues
   - Go to Vercel Dashboard → Deployments → Redeploy

4. **Check Build Output:**
   - In build logs, verify files are being created
   - Look for: `Creating an optimized production build...`

---

**Quick Test:**
```bash
# Should return HTML
curl https://your-domain.vercel.app/

# Should return JSON
curl https://your-domain.vercel.app/api/health
```

