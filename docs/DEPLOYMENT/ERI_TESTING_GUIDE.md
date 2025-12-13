# ERI Integration Testing Guide

This guide explains how to test the ERI (E-Return Intermediary) integration with the Income Tax Department.

---

## Quick Test Methods

### Method 1: Run Test Script (Recommended)

Run the comprehensive test script:

```bash
cd backend
npm run test:eri
```

This will run 7 tests:
1. ✅ Environment Variables Check
2. ✅ Configuration Validation
3. ✅ Signing Service Test
4. ✅ API Connectivity Test
5. ✅ Integration Service Test
6. ✅ PAN Verification Test
7. ✅ Previous Year Filings Test

---

### Method 2: Test via API Endpoints

#### 1. Test ERI Configuration

```bash
# Test configuration validation
curl http://localhost:3002/api/eri/validate-config
```

**Expected Response:**
```json
{
  "success": true,
  "message": "ERI configuration is valid",
  "certificate": {
    "subject": "...",
    "issuer": "...",
    "validFrom": "...",
    "validTo": "..."
  }
}
```

#### 2. Test ERI Signing

```bash
# Test signing functionality
curl -X POST http://localhost:3002/api/eri/test-signing
```

**Expected Response:**
```json
{
  "success": true,
  "message": "ERI signing test completed successfully",
  "payload": {
    "eriUserId": "ERIP007754",
    "dataSize": 1234,
    "signatureSize": 5678
  }
}
```

#### 3. Test Connection

```bash
# Test basic connection and configuration
curl http://localhost:3002/api/eri/test-connection
```

**Expected Response:**
```json
{
  "success": true,
  "message": "ERI connection test completed",
  "data": {
    "isLiveMode": true,
    "baseUrl": "https://eri.incometax.gov.in/api",
    "hasApiKey": true,
    "userId": "Set",
    "password": "Set",
    "secretKey": "Set",
    "panVerificationTest": "Success"
  }
}
```

#### 4. Test PAN Verification (Requires Authentication)

```bash
# First, get auth token (login)
TOKEN=$(curl -X POST http://localhost:3002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"yourpassword"}' \
  | jq -r '.token')

# Then test PAN verification
curl -X POST http://localhost:3002/api/eri/validate-pan \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"pan":"ABCDE1234F"}'
```

---

## What Each Test Checks

### 1. Environment Variables Test
- ✅ Checks if all required ERI variables are set
- ✅ Verifies `ERI_USER_ID`, `ERI_PASSWORD`, `ERI_API_SECRET`, etc.

### 2. Configuration Validation Test
- ✅ Validates ERI configuration structure
- ✅ Checks certificate file (if using P12 certificate)

### 3. Signing Service Test
- ✅ Tests digital signature generation
- ✅ Verifies payload signing with ERI credentials

### 4. API Connectivity Test
- ✅ Tests connection to ERI API endpoint
- ✅ Verifies network connectivity

### 5. Integration Service Test
- ✅ Tests ERI Integration Service initialization
- ✅ Verifies live mode configuration

### 6. PAN Verification Test
- ✅ Tests PAN verification functionality
- ✅ Uses mock data if `FEATURE_ERI_LIVE=false`
- ✅ Uses live API if `FEATURE_ERI_LIVE=true`

### 7. Previous Year Filings Test
- ✅ Tests fetching previous year ITR data
- ✅ Uses mock data if `FEATURE_ERI_LIVE=false`
- ✅ Uses live API if `FEATURE_ERI_LIVE=true`

---

## ⚠️ IMPORTANT: IP Whitelisting Requirement

**ITD requires that all ERI API calls originate from a whitelisted static IP address.**

### What This Means

1. **Static IP Required**: Your server's public IP must be whitelisted with ITD
2. **Testing Restriction**: You can **only test** from the whitelisted IP
3. **Local Development**: You cannot test ERI APIs from your local machine (unless it's whitelisted)
4. **Certificate + IP Binding**: Both your certificate (public key) and IP must match ITD's records

### How to Test from Whitelisted IP

**Option 1: Test from AWS Lightsail Server**
```bash
# SSH into your Lightsail instance
ssh user@your-lightsail-ip

# Run tests
cd /path/to/backend
npm run test:eri
```

**Option 2: Use SSH Tunnel**
```bash
# Create tunnel from local machine
ssh -L 3002:localhost:3002 user@your-lightsail-ip

# Test through tunnel
curl http://localhost:3002/api/eri/test-connection
```

**Option 3: Check Your IP**
```bash
# On your server, check public IP
curl https://api.ipify.org

# Verify this matches ITD's whitelist
```

### Certificate and Public Key

The `.p12` certificate file contains:
- **Private Key**: Used to sign data
- **Public Key**: Embedded in the X.509 certificate
- **Certificate Chain**: May include intermediate certificates

**Key Points:**
- The public key in your certificate must match ITD's registration
- The certificate alias is typically `"agencykey"` (as per ERI docs)
- ITD validates both the IP address and certificate for each request

📖 **See detailed guide**: `docs/DEPLOYMENT/ERI_IP_WHITELISTING_AND_CERTIFICATE_GUIDE.md`

---

## Understanding Test Results

### ✅ All Tests Pass
- ERI integration is properly configured
- Ready for production use (if live mode is enabled)
- **Note**: Ensure you're testing from the whitelisted IP

### ⚠️ Some Tests Fail

**Common Issues:**

1. **Missing Environment Variables**
   - Solution: Add missing variables to `.env` file
   - See `docs/DEPLOYMENT/VERCEL_ENV_VARIABLES_CHECKLIST.md`

2. **Certificate Not Found**
   - Solution: If using P12 certificate, ensure `ERI_P12_CERT_PATH` points to correct file
   - Note: Some ERI implementations may not require P12 certificate

3. **API Connectivity Failed / 403 Forbidden**
   - **Most Common**: IP address is not whitelisted with ITD
   - Solution: Ensure you're testing from the whitelisted static IP
   - Check your server's public IP matches ITD's whitelist
   - This is normal if ERI API requires authentication first
   - The signing test should still work

4. **Live Mode Disabled**
   - If `FEATURE_ERI_LIVE=false`, tests will use mock data
   - This is expected behavior for development

5. **IP Not Whitelisted Error**
   - Error: `403 Forbidden` or `IP not authorized`
   - Solution: Contact ITD to whitelist your static IP
   - Verify your server's public IP matches the whitelisted IP

---

## Testing Live Mode

To test with actual ERI API:

1. **Enable Live Mode**
   ```env
   FEATURE_ERI_LIVE=true
   ```

2. **Ensure All Credentials Are Set**
   ```env
   ERI_USER_ID=ERIP007754
   ERI_PASSWORD=Oracle@123
   ERI_API_SECRET=FUisvaGyCVPKsYmbczcr0A==
   ERI_API_BASE_URL=https://eri.incometax.gov.in/api
   ```

3. **Run Tests**
   ```bash
   npm run test:eri
   ```

4. **Check Logs**
   - Look for "LIVE" mode indicators in logs
   - Check for actual API responses (not mock data)

---

## Testing Specific Features

### Test PAN Verification
```bash
# Via API (requires auth)
curl -X POST http://localhost:3002/api/eri/validate-pan \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"pan":"ABCDE1234F"}'
```

### Test Previous Year Data
```bash
# Via API (requires auth)
curl http://localhost:3002/api/eri/prefill/ABCDE1234F/2023-24 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test ITR Submission
```bash
# Via API (requires auth and complete ITR data)
curl -X POST http://localhost:3002/api/eri/submit \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "itrData": {...},
    "itrType": "ITR-1",
    "assessmentYear": "2024-25"
  }'
```

---

## Troubleshooting

### Issue: "ERI configuration is invalid"
**Solution:**
- Check that `ERI_USER_ID` and `ERI_PASSWORD` are set
- If using P12 certificate, ensure `ERI_P12_CERT_PATH` and `ERI_P12_PASSWORD` are set

### Issue: "Cannot connect to ERI API"
**Solution:**
- Verify `ERI_API_BASE_URL` is correct
- Check network connectivity
- Verify API key is set correctly

### Issue: "Signing test failed"
**Solution:**
- Verify `ERI_API_SECRET` or `ERI_SECRET_KEY` is set
- Check that secret key matches ERI portal credentials
- Ensure certificate file exists (if using P12)

### Issue: "Live mode enabled but API key missing"
**Solution:**
- Set `ERI_API_KEY` or `ERI_API_SECRET` in `.env`
- Or set `FEATURE_ERI_LIVE=false` for development

---

## Next Steps

After successful testing:

1. ✅ Verify all environment variables are set
2. ✅ Test with actual PAN numbers (if available)
3. ✅ Test ITR submission flow
4. ✅ Add variables to Vercel for production
5. ✅ Monitor logs for any errors

---

## Additional Resources

- ERI API Documentation: [Income Tax Department Portal](https://www.incometax.gov.in)
- Environment Variables: `docs/DEPLOYMENT/VERCEL_ENV_VARIABLES_CHECKLIST.md`
- Deployment Guide: `docs/DEPLOYMENT/VERCEL_DEPLOYMENT_GUIDE.md`

