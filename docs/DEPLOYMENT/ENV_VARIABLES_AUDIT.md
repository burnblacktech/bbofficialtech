# Environment Variables Audit Report

Generated: 2025-12-13

This document compares the required environment variables against what's present in the current `.env` files.

---

## Summary

- **Total Required Variables**: 45+
- **Present in backend/.env**: 20
- **Missing Critical Variables**: 25+
- **Status**: ⚠️ **INCOMPLETE** - Missing several critical variables

---

## Critical Missing Variables

### Backend - Missing in `backend/.env`

#### 1. Session & Token Secrets (CRITICAL)
```env
# MISSING - Required for security
SESSION_SECRET=generate-a-strong-session-secret
SHARE_TOKEN_SECRET=generate-a-share-token-secret
PASSWORD_RESET_SECRET=generate-a-password-reset-secret
```

#### 2. JWT Refresh Secret (CRITICAL)
```env
# MISSING - Only JWT_SECRET present, but JWT_REFRESH_SECRET is missing
JWT_REFRESH_SECRET=generate-another-strong-secret-min-32-characters
```

#### 3. ERI Integration (CRITICAL for ITR Filing)
```env
# MISSING - Required for ITR filing functionality
ERI_API_BASE_URL=https://eri.incometax.gov.in/api
ERI_API_KEY=your-eri-api-key
FEATURE_ERI_LIVE=true
```

#### 4. Payment Gateway - Razorpay (CRITICAL for Payments)
```env
# MISSING - Required for payment processing
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret
```

#### 5. Email Service (CRITICAL for Notifications)
```env
# MISSING - Required for email notifications
EMAIL_SERVICE_API_KEY=your-sendgrid-or-ses-api-key
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=Burnblack ITR
EMAIL_SERVICE_PROVIDER=sendgrid
```

#### 6. AWS S3 (CRITICAL for File Storage)
```env
# MISSING - Required for file uploads and storage
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
AWS_REGION=ap-south-1
AWS_S3_BUCKET_NAME=your-s3-bucket-name
AWS_S3_ENDPOINT=s3.amazonaws.com
```

#### 7. Database SSL Configuration
```env
# MISSING - Should be set for Supabase
DB_SSL=true
```

---

## Present Variables in `backend/.env`

✅ **Server Configuration**
- `PORT=3002`
- `NODE_ENV=development`
- `FRONTEND_URL=http://localhost:3000`

✅ **Database Configuration**
- `DB_HOST=aws-0-ap-south-1.pooler.supabase.com`
- `DB_PORT=5432`
- `DB_NAME=postgres`
- `DB_USER=postgres.cgdafnbmqalyjchvhwsf`
- `DB_PASSWORD=BNZKHp6c4mJddMFm`
- `SUPABASE_URL=https://cgdafnbmqalyjchvhwsf.supabase.co`
- `SUPABASE_ANON_KEY=...`
- `SUPABASE_SERVICE_ROLE_KEY=...`
- `SUPABASE_JWT_SECRET=...`
- `SUPABASE_DATABASE_URL=...`
- `DIRECT_URI=...`
- `SUPABASE_ACCESS_TOKEN=...`

✅ **JWT Configuration**
- `JWT_SECRET=...`
- `JWT_EXPIRES_IN=24h`
- `JWT_REFRESH_EXPIRES_IN=7d`

✅ **OAuth Configuration**
- `GOOGLE_CLIENT_ID=...`
- `GOOGLE_CLIENT_SECRET=...`
- `GOOGLE_CALLBACK_URL=http://localhost:3002/api/auth/google/callback`

✅ **SurePass Configuration**
- `SUREPASS_API_KEY=...`
- `SUREPASS_API_BASE_URL=https://kyc-api.surepass.io/api/v1`
- `SUREPASS_COMPREHENSIVE_BASE_URL=https://kyc-api.surepass.app/api/v1`
- `SUREPASS_COMPREHENSIVE_ENABLED=false`
- `FEATURE_PAN_VERIFICATION_LIVE=true`

---

## Frontend Environment Variables

### Missing in Frontend (No `.env` file found)

All frontend environment variables are missing. These need to be set in Vercel:

```env
# CRITICAL - Missing
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_ENVIRONMENT=development
REACT_APP_GOOGLE_CLIENT_ID=693703405163-5vfd2t7skua2b1401nu2furd3vn7gecp.apps.googleusercontent.com
REACT_APP_OAUTH_REDIRECT_URI=http://localhost:3000/auth/callback

# Optional but Recommended
REACT_APP_FEATURE_ERI_LIVE=true
REACT_APP_FEATURE_PAYMENTS=true
REACT_APP_FEATURE_NOTIFICATIONS=true
REACT_APP_FEATURE_OCR=true
```

---

## Variables Used in Code but Not in .env

Based on code analysis, these variables are referenced but missing:

1. `SESSION_SECRET` - Used in `app.js` for session management
2. `JWT_REFRESH_SECRET` - Used for refresh token generation
3. `SHARE_TOKEN_SECRET` - Used for share token generation
4. `PASSWORD_RESET_SECRET` - Used for password reset tokens
5. `ERI_API_BASE_URL` - Used in ERI integration services
6. `ERI_API_KEY` - Used in ERI integration services
7. `FEATURE_ERI_LIVE` - Used in multiple services
8. `RAZORPAY_KEY_ID` - Used in payment controller
9. `RAZORPAY_KEY_SECRET` - Used in payment controller
10. `EMAIL_SERVICE_API_KEY` - Used for email notifications
11. `EMAIL_FROM` - Used for email sender
12. `EMAIL_FROM_NAME` - Used for email sender name
13. `EMAIL_SERVICE_PROVIDER` - Used to select email provider
14. `AWS_ACCESS_KEY_ID` - Used for S3 file storage
15. `AWS_SECRET_ACCESS_KEY` - Used for S3 file storage
16. `AWS_REGION` - Used for S3 configuration
17. `AWS_S3_BUCKET_NAME` - Used for S3 bucket operations
18. `AWS_S3_ENDPOINT` - Used for S3 endpoint configuration
19. `DB_SSL` - Should be set to `true` for Supabase
20. `MAX_CONCURRENT_SESSIONS` - Used in AdminController (optional, has default)
21. `BCRYPT_ROUNDS` - Used in auth routes (optional, has default)
22. `VERCEL_URL` - Used in app.js for CORS (auto-set by Vercel)

---

## Recommended Action Plan

### Immediate (Critical for Production)

1. **Generate Missing Secrets**
   ```bash
   # Run these commands to generate secrets
   openssl rand -hex 32  # For JWT_REFRESH_SECRET, SHARE_TOKEN_SECRET
   openssl rand -base64 32  # For SESSION_SECRET, PASSWORD_RESET_SECRET
   ```

2. **Add to `backend/.env`**
   ```env
   # Session & Token Secrets
   SESSION_SECRET=<generated-secret>
   SHARE_TOKEN_SECRET=<generated-secret>
   PASSWORD_RESET_SECRET=<generated-secret>
   JWT_REFRESH_SECRET=<generated-secret>
   
   # Database SSL
   DB_SSL=true
   
   # ERI Integration
   ERI_API_BASE_URL=https://eri.incometax.gov.in/api
   ERI_API_KEY=<your-eri-api-key>
   FEATURE_ERI_LIVE=true
   
   # Payment Gateway
   RAZORPAY_KEY_ID=<your-razorpay-key-id>
   RAZORPAY_KEY_SECRET=<your-razorpay-key-secret>
   
   # Email Service
   EMAIL_SERVICE_API_KEY=<your-email-api-key>
   EMAIL_FROM=noreply@yourdomain.com
   EMAIL_FROM_NAME=Burnblack ITR
   EMAIL_SERVICE_PROVIDER=sendgrid
   
   # AWS S3
   AWS_ACCESS_KEY_ID=<your-aws-access-key>
   AWS_SECRET_ACCESS_KEY=<your-aws-secret-key>
   AWS_REGION=ap-south-1
   AWS_S3_BUCKET_NAME=<your-bucket-name>
   AWS_S3_ENDPOINT=s3.amazonaws.com
   ```

3. **Create `frontend/.env`** (for local development)
   ```env
   REACT_APP_API_URL=http://localhost:3002/api
   REACT_APP_ENVIRONMENT=development
   REACT_APP_GOOGLE_CLIENT_ID=693703405163-5vfd2t7skua2b1401nu2furd3vn7gecp.apps.googleusercontent.com
   REACT_APP_OAUTH_REDIRECT_URI=http://localhost:3000/auth/callback
   REACT_APP_FEATURE_ERI_LIVE=true
   REACT_APP_FEATURE_PAYMENTS=true
   REACT_APP_FEATURE_NOTIFICATIONS=true
   REACT_APP_FEATURE_OCR=true
   ```

### For Vercel Deployment

All these variables need to be added in Vercel Dashboard → Settings → Environment Variables for:
- **Production** environment
- **Preview** environment (optional but recommended)

---

## Variables with Defaults (Non-Critical)

These have default values in code, but should be set for production:

- `MAX_CONCURRENT_SESSIONS` (default: 3 for users, 5 for admins)
- `BCRYPT_ROUNDS` (default: 12)
- `LOG_LEVEL` (default: 'info')
- `RATE_LIMIT_WINDOW_MS` (default: 900000)
- `RATE_LIMIT_MAX_REQUESTS` (default: 100)
- `MAX_FILE_SIZE` (default: 10485760)
- `ALLOWED_FILE_TYPES` (default: 'image/jpeg,image/png,application/pdf')

---

## Security Notes

⚠️ **IMPORTANT**: The current `backend/.env` file contains:
- Real database credentials
- Real API keys
- Real OAuth secrets

**DO NOT** commit this file to Git. Ensure it's in `.gitignore`.

For Vercel deployment, add all these as **encrypted environment variables** in the Vercel dashboard.

---

## Next Steps

1. ✅ Generate missing secrets using the commands above
2. ✅ Add all missing variables to `backend/.env`
3. ✅ Create `frontend/.env` with frontend variables
4. ✅ Add all variables to Vercel Dashboard for production
5. ✅ Test locally with new variables
6. ✅ Deploy to Vercel

---

## Quick Reference: All Required Variables

See `docs/DEPLOYMENT/VERCEL_ENV_VARIABLES_CHECKLIST.md` for the complete list with descriptions.

