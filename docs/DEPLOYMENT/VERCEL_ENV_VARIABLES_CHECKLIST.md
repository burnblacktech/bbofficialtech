# Vercel Environment Variables Checklist

This document provides a complete list of environment variables required for deploying the Burnblack ITR platform on Vercel.

## How to Add Variables in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable for the appropriate environments:
   - **Production** (required)
   - **Preview** (for pull request previews)
   - **Development** (optional)

---

## Frontend Environment Variables

These variables are prefixed with `REACT_APP_` and are exposed to the browser.

### Required

```env
# API Configuration
REACT_APP_API_URL=https://your-backend-domain.vercel.app/api
REACT_APP_ENVIRONMENT=production

# Authentication
REACT_APP_GOOGLE_CLIENT_ID=your-google-oauth-client-id
REACT_APP_OAUTH_REDIRECT_URI=https://your-frontend-domain.vercel.app/auth/callback
```

### Optional (Feature Flags)

```env
REACT_APP_FEATURE_ERI_LIVE=true
REACT_APP_FEATURE_PAYMENTS=true
REACT_APP_FEATURE_NOTIFICATIONS=true
REACT_APP_FEATURE_OCR=true
```

### Optional (Analytics & Monitoring)

```env
REACT_APP_ANALYTICS_ID=your-analytics-id
REACT_APP_SENTRY_DSN=your-sentry-dsn
```

---

## Backend Environment Variables

These variables are used by the Node.js backend and are NOT exposed to the browser.

### Server Configuration (Required)

```env
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://your-frontend-domain.vercel.app
```

### Database Configuration (Required - Supabase)

```env
# Option 1: Full connection string (recommended)
DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres?sslmode=require

# Option 2: Individual components (alternative)
DB_HOST=aws-0-ap-south-1.pooler.supabase.com
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres.[PROJECT-REF]
DB_PASSWORD=your-supabase-password
DB_SSL=true

# Supabase-specific (if using Supabase client)
SUPABASE_URL=https://[PROJECT-REF].supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
SUPABASE_JWT_SECRET=your-supabase-jwt-secret
SUPABASE_DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:5432/postgres
DIRECT_URI=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
SUPABASE_ACCESS_TOKEN=your-supabase-access-token
```

### JWT & Authentication (Required)

```env
JWT_SECRET=generate-a-strong-secret-min-32-characters-long
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=generate-another-strong-secret-min-32-characters
JWT_REFRESH_EXPIRES_IN=30d
```

**How to Generate JWT Secret:**
- **Windows (PowerShell)**: `cd backend && npm run generate-secrets -- --type=jwt`
- **Linux/Mac**: `openssl rand -hex 64` or `cd backend && npm run generate-secrets -- --type=jwt`
- **Node.js**: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`

### Session & Token Secrets (Required)

```env
SESSION_SECRET=generate-a-strong-session-secret
SHARE_TOKEN_SECRET=generate-a-share-token-secret
PASSWORD_RESET_SECRET=generate-a-password-reset-secret
```

**How to Generate Session Secret:**
- **Windows (PowerShell)**: `cd backend && npm run generate-secrets -- --type=session`
- **Linux/Mac**: `openssl rand -base64 32` or `cd backend && npm run generate-secrets -- --type=session`
- **Node.js**: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`

**Generate All Secrets at Once:**
```bash
cd backend
npm run generate-secrets
```

### OAuth Configuration (Required for Google Login)

```env
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=https://your-backend-domain.vercel.app/api/auth/google/callback
```

### ERI Integration (Required for ITR Filing)

```env
ERI_API_BASE_URL=https://eri.incometax.gov.in/api
ERI_API_KEY=your-eri-api-key
FEATURE_ERI_LIVE=true
```

### SurePass API (Required for PAN/Aadhaar Verification)

```env
SUREPASS_API_KEY=your-surepass-api-key
SUREPASS_API_BASE_URL=https://kyc-api.surepass.io/api/v1
SUREPASS_COMPREHENSIVE_BASE_URL=https://kyc-api.surepass.app/api/v1
SUREPASS_COMPREHENSIVE_ENABLED=false
FEATURE_PAN_VERIFICATION_LIVE=true
```

### Payment Gateway (Required for Payments)

```env
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret
```

### Email Service (Required for Notifications)

```env
EMAIL_SERVICE_API_KEY=your-sendgrid-or-ses-api-key
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=Burnblack ITR
EMAIL_SERVICE_PROVIDER=sendgrid
# Options: sendgrid, ses, nodemailer
```

### AWS S3 (Required for File Storage)

```env
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
AWS_REGION=ap-south-1
AWS_S3_BUCKET_NAME=your-s3-bucket-name
AWS_S3_ENDPOINT=s3.amazonaws.com
```

### Redis (Optional - for caching/sessions)

```env
REDIS_URL=redis://default:password@host:port
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
REDIS_ENABLED=false
```

### Logging & Monitoring (Optional)

```env
LOG_LEVEL=info
SENTRY_DSN=your-sentry-dsn
SENTRY_ENVIRONMENT=production
```

### Rate Limiting (Optional - defaults provided)

```env
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### File Upload Limits (Optional - defaults provided)

```env
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png,application/pdf
```

---

## Quick Setup Commands

### Generate Secrets

```bash
# JWT Secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Session Secret
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Password Reset Secret
openssl rand -base64 32
```

### Generate All Secrets at Once

```bash
#!/bin/bash
echo "JWT_SECRET=$(openssl rand -hex 32)"
echo "JWT_REFRESH_SECRET=$(openssl rand -hex 32)"
echo "SESSION_SECRET=$(openssl rand -base64 32)"
echo "SHARE_TOKEN_SECRET=$(openssl rand -hex 32)"
echo "PASSWORD_RESET_SECRET=$(openssl rand -base64 32)"
```

---

## Priority Checklist

### Critical (Must Have)
- [ ] `NODE_ENV=production`
- [ ] `FRONTEND_URL` (your Vercel frontend URL)
- [ ] `REACT_APP_API_URL` (your Vercel backend API URL)
- [ ] Database credentials (all `DB_*` or `DATABASE_URL`)
- [ ] `JWT_SECRET`
- [ ] `JWT_REFRESH_SECRET`
- [ ] `SESSION_SECRET`
- [ ] `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
- [ ] `SUREPASS_API_KEY`
- [ ] `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`
- [ ] `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`
- [ ] `AWS_S3_BUCKET_NAME`

### Important (Should Have)
- [ ] `ERI_API_KEY` (for ITR filing)
- [ ] `EMAIL_SERVICE_API_KEY` (for notifications)
- [ ] `SHARE_TOKEN_SECRET`
- [ ] `PASSWORD_RESET_SECRET`

### Optional (Nice to Have)
- [ ] `REDIS_*` variables (if using Redis)
- [ ] `SENTRY_DSN` (for error tracking)
- [ ] `REACT_APP_ANALYTICS_ID` (for analytics)

---

## Environment-Specific Values

### Production
```env
NODE_ENV=production
FRONTEND_URL=https://your-frontend-domain.vercel.app
REACT_APP_API_URL=https://your-backend-domain.vercel.app/api
REACT_APP_ENVIRONMENT=production
FEATURE_ERI_LIVE=true
LOG_LEVEL=warn
```

### Preview (Pull Requests)
```env
NODE_ENV=staging
FRONTEND_URL=https://your-preview-branch.vercel.app
REACT_APP_API_URL=https://your-backend-domain.vercel.app/api
REACT_APP_ENVIRONMENT=staging
FEATURE_ERI_LIVE=false
LOG_LEVEL=info
```

---

## Security Notes

1. **Never commit** actual values to Git
2. **Generate unique secrets** for each environment
3. **Rotate secrets** regularly (every 90 days recommended)
4. **Restrict access** to environment variables in Vercel
5. **Use different secrets** for production, staging, and development
6. **Backup secrets** securely (password manager, encrypted storage)

---

## Troubleshooting

### Common Issues

1. **"Missing environment variable" errors**
   - Check that all required variables are set in Vercel
   - Ensure variables are set for the correct environment (Production/Preview)

2. **Database connection failures**
   - Verify `DATABASE_URL` or all `DB_*` variables are correct
   - Check Supabase connection pooling settings
   - Ensure `DB_SSL=true` for Supabase

3. **JWT authentication failures**
   - Verify `JWT_SECRET` is set and matches between deployments
   - Check `JWT_EXPIRES_IN` format (e.g., "7d", "24h")

4. **API calls failing**
   - Verify `REACT_APP_API_URL` points to correct backend URL
   - Check CORS settings in backend if frontend/backend are on different domains

---

## Next Steps

After setting all environment variables:

1. **Redeploy** your application in Vercel
2. **Test** authentication flows
3. **Verify** database connections
4. **Check** API endpoints are accessible
5. **Monitor** logs for any missing variable errors

