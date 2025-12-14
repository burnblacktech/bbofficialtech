# Vercel Deployment Error Troubleshooting

## Common Errors and Solutions

### 1. "Cannot create deployment" - General Error

**Possible Causes:**
- Configuration validation error in `vercel.json`
- Missing required files
- Git connection issues
- Project settings conflict

**Solutions:**

#### Check Configuration Syntax
```bash
# Validate JSON syntax
cat vercel.json | jq .
```

#### Verify Required Files Exist
- `backend/api/index.js` - Serverless function entry point
- `frontend/package.json` - Frontend build configuration
- `vercel.json` - Root configuration

#### Check Vercel Dashboard
1. Go to **Project Settings** → **General**
2. Check **Root Directory** - should be `/` (root)
3. Check **Build Command** - should be auto-detected or empty
4. Check **Output Directory** - should be auto-detected

### 2. "Invalid configuration" Error

**Cause:** `vercel.json` has invalid properties or syntax

**Fix:** Ensure:
- No `routes` when using `rewrites`, `headers`, etc.
- Valid JSON syntax
- Correct property names (`source` not `src` in rewrites)

### 3. "Build failed" Error

**Cause:** Build command fails or dependencies can't be installed

**Fix:**
- Check `installCommand` syntax
- Verify `package.json` files exist in both `backend/` and `frontend/`
- Ensure Node.js version is compatible (>=18.0.0)

### 4. "Function not found" Error

**Cause:** Serverless function entry point doesn't exist

**Fix:**
- Verify `backend/api/index.js` exists
- Check file exports Express app correctly
- Ensure `includeFiles` in build config includes necessary files

### 5. "Static build failed" Error

**Cause:** Frontend build fails

**Fix:**
- Check `frontend/package.json` has `build` script
- Verify `distDir: "build"` matches actual build output
- Check for build errors in logs

## Quick Diagnostic Steps

1. **Validate JSON:**
   ```bash
   node -e "JSON.parse(require('fs').readFileSync('vercel.json', 'utf8'))"
   ```

2. **Check File Structure:**
   ```bash
   ls -la backend/api/index.js
   ls -la frontend/package.json
   ```

3. **Test Locally:**
   ```bash
   # Install dependencies
   cd backend && npm install
   cd ../frontend && npm install
   
   # Build frontend
   cd frontend && npm run build
   ```

4. **Check Vercel CLI:**
   ```bash
   vercel --version
   vercel inspect
   ```

## Current Configuration Checklist

- [x] `vercel.json` uses `version: 2`
- [x] `builds` array has backend and frontend entries
- [x] No `routes` property (using `rewrites` instead)
- [x] `rewrites` has API and SPA routing
- [x] `headers` for static assets
- [x] `installCommand` uses `cd` commands
- [x] `env` variables set (NODE_ENV, CI)

## If Still Failing

1. **Check Vercel Dashboard Error Message:**
   - Go to **Deployments** → **Latest Deployment**
   - Check **Build Logs** for specific error
   - Check **Function Logs** for runtime errors

2. **Try Simplified Configuration:**
   Remove optional properties and test:
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "backend/api/index.js",
         "use": "@vercel/node"
       },
       {
         "src": "frontend/package.json",
         "use": "@vercel/static-build",
         "config": {
           "distDir": "build"
         }
       }
     ],
     "rewrites": [
       {
         "source": "/api/(.*)",
         "destination": "/api/index"
       },
       {
         "source": "/(.*)",
         "destination": "/index.html"
       }
     ]
   }
   ```

3. **Contact Support:**
   - Share exact error message
   - Share `vercel.json` content
   - Share build logs

