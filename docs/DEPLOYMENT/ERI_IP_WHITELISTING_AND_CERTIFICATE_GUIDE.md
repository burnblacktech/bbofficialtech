# ERI IP Whitelisting and Certificate Guide

## Overview

When ITD (Income Tax Department) whitelists your static IP address on AWS Lightsail, you must test and make API calls **only from that whitelisted IP**. This is a security requirement enforced by ITD.

## IP Whitelisting Requirements

### ✅ What This Means

1. **Static IP Required**: ITD whitelists specific static IP addresses for ERI API access
2. **Source IP Validation**: All API calls to ERI must originate from the whitelisted IP
3. **Testing Restriction**: You can **only test** from the whitelisted IP address
4. **Production Deployment**: Your production server must use the whitelisted IP

### 🔒 Security Implications

- **IP-based Access Control**: ITD validates the source IP of every API request
- **Certificate + IP Binding**: Both the certificate (public key) and IP must match ITD's records
- **No Local Testing**: You cannot test ERI APIs from your local development machine (unless it's whitelisted)

## Certificate and Public Key

### PKCS#12 Keystore Structure

The `.p12` certificate file contains:

1. **Private Key**: Used to sign data (CMS/PKCS#7 signatures)
2. **Public Key**: Embedded in the X.509 certificate
3. **Certificate Chain**: May include intermediate and root certificates

### Key Points

- **Alias**: The certificate alias in the keystore is typically `"agencykey"` (as per ERI documentation)
- **Public Key Extraction**: The public key is automatically extracted from the certificate when signing
- **ITD Registration**: ITD has registered your public key (from the certificate) and matches it with your whitelisted IP

### Certificate Validation Flow

```
1. Your server (whitelisted IP) → Signs data with private key
2. Sends signed payload to ERI API
3. ITD validates:
   - Source IP matches whitelist ✅
   - Certificate (public key) matches registered certificate ✅
   - Signature is valid ✅
4. Request is processed
```

## Testing from Whitelisted IP

### Option 1: Test from AWS Lightsail Server

1. **SSH into your Lightsail instance**
2. **Run the test script**:
   ```bash
   cd /path/to/backend
   npm run test:eri
   ```

3. **Or test via API endpoint**:
   ```bash
   curl http://localhost:3002/api/eri/test-connection
   ```

### Option 2: Use VPN/Tunnel to Route Through Whitelisted IP

If you need to test from your local machine:

1. **Set up SSH tunnel**:
   ```bash
   ssh -L 3002:localhost:3002 user@your-lightsail-ip
   ```

2. **Test through the tunnel**:
   ```bash
   curl http://localhost:3002/api/eri/test-connection
   ```

### Option 3: Deploy to Production and Test

1. Deploy your backend to the Lightsail instance
2. Make API calls from the production server
3. Monitor logs for ERI API responses

## Certificate Configuration

### Required Environment Variables

```env
# Certificate Path (relative to backend directory)
ERI_P12_CERT_PATH=./certs/eri-certificate.p12

# Certificate Password
ERI_P12_PASSWORD=your-keystore-password

# ERI User ID (must match ITD registration)
ERI_USER_ID=ERIP007754
```

### Certificate File Location

```
backend/
├── certs/
│   ├── eri-certificate.p12  # Your PKCS#12 certificate
│   └── README.md
└── .env                      # Contains certificate password
```

### Certificate Details

The certificate should:
- Be in PKCS#12 format (`.p12` or `.pfx`)
- Contain the private key and certificate
- Have alias `"agencykey"` (or the alias you registered with ITD)
- Be valid (not expired)
- Match the public key registered with ITD

## Verifying Certificate and IP Setup

### Check Certificate Details

```bash
cd backend
npm run test:eri
```

This will:
- ✅ Validate certificate file exists
- ✅ Verify certificate can be loaded
- ✅ Check certificate validity (not expired)
- ✅ Extract and display certificate information
- ✅ Test signing functionality

### Check IP Address

From your Lightsail server:

```bash
# Check your public IP
curl https://api.ipify.org

# Or
curl https://ifconfig.me
```

**Verify this IP matches the one whitelisted with ITD.**

## Common Issues

### ❌ "IP not whitelisted" Error

**Problem**: Making API calls from a non-whitelisted IP

**Solution**: 
- Ensure you're testing from the whitelisted IP
- Check your server's public IP matches ITD's whitelist
- Use SSH tunnel if testing locally

### ❌ "Certificate not found" Error

**Problem**: Certificate file path is incorrect

**Solution**:
- Verify `ERI_P12_CERT_PATH` in `.env` is correct
- Ensure certificate file exists at the specified path
- Check file permissions (readable by Node.js process)

### ❌ "Invalid certificate" Error

**Problem**: Certificate doesn't match ITD's records

**Solution**:
- Verify you're using the correct certificate file
- Ensure the certificate alias matches (`"agencykey"` or your registered alias)
- Check certificate hasn't expired
- Confirm public key matches ITD's registration

### ❌ "Signature verification failed" Error

**Problem**: Signature doesn't match certificate

**Solution**:
- Verify private key and certificate are from the same keystore
- Check certificate password is correct
- Ensure signing algorithm matches ITD requirements (SHA256withRSA)

## Production Deployment Checklist

- [ ] Static IP is whitelisted with ITD
- [ ] Certificate file is deployed to server
- [ ] Certificate password is set in environment variables
- [ ] `ERI_P12_CERT_PATH` points to correct certificate location
- [ ] `ERI_USER_ID` matches ITD registration
- [ ] Certificate is valid (not expired)
- [ ] Server's public IP matches whitelisted IP
- [ ] Test script passes all checks
- [ ] API connectivity test succeeds

## Testing Workflow

1. **Verify IP Whitelisting**:
   ```bash
   # On Lightsail server
   curl https://api.ipify.org
   # Confirm this matches ITD's whitelist
   ```

2. **Test Certificate**:
   ```bash
   cd backend
   npm run test:eri
   ```

3. **Test API Connection**:
   ```bash
   curl http://localhost:3002/api/eri/test-connection
   ```

4. **Test Signing**:
   ```bash
   curl -X POST http://localhost:3002/api/eri/test-signing
   ```

5. **Test Full Integration**:
   ```bash
   # Make a real API call (e.g., PAN verification)
   curl -X POST http://localhost:3002/api/eri/verify-pan \
     -H "Content-Type: application/json" \
     -d '{"pan": "ABCDE1234F"}'
   ```

## Security Best Practices

1. **Never commit certificates to Git**: Use `.gitignore` to exclude certificate files
2. **Secure certificate storage**: Store certificates in secure location with restricted permissions
3. **Rotate certificates**: Follow ITD guidelines for certificate renewal
4. **Monitor IP changes**: If your static IP changes, update ITD immediately
5. **Use environment variables**: Never hardcode certificate passwords
6. **Restrict access**: Limit who can access the certificate files

## Support

If you encounter issues:

1. **Check ITD Documentation**: Review ERI integration guide
2. **Verify IP Whitelisting**: Confirm your IP is whitelisted with ITD
3. **Validate Certificate**: Ensure certificate matches ITD's records
4. **Review Logs**: Check application logs for detailed error messages
5. **Contact ITD Support**: Reach out to ERI helpdesk if issues persist

---

**Last Updated**: 2025-01-XX
**Version**: 1.0

