# ERI UAT Credentials

## Overview

This document contains the User Acceptance Testing (UAT) credentials for ERI (E-Return Intermediary) integration with the Income Tax Department.

**Source:** Email from erihelp@incometax.gov.in  
**Date:** July 24, 2025  
**Status:** UAT/Testing Environment

---

## UAT Credentials

### User Credentials

- **User ID:** `ERIP013662`
- **Password:** `Oracle@123`
- **Secret Key:** `FUisvaGyCVPKsYmbczcr0A==`

### Configuration

These credentials should be configured in your `.env` file as follows:

```env
ERI_USER_ID=ERIP013662
ERI_API_SECRET=FUisvaGyCVPKsYmbczcr0A==
ERI_P12_CERT_PATH=./certs/eri-certificate.p12
ERI_P12_PASSWORD=your_certificate_password_here
ERI_API_URL=https://api.incometax.gov.in/eri
```

---

## Certificate Requirements

According to the email from ERI Helpdesk, you need to:

1. **Obtain PKCS12 Certificate:** Get the public key certificate (.p12 file) from the Income Tax FO portal
2. **Place Certificate:** Save the certificate file in `./certs/eri-certificate.p12`
3. **Certificate Password:** The certificate password will be provided separately
4. **Send to ERI:** Send the sign date and public key certificate to ERI Helpdesk for verification

---

## Usage

### Testing ERI Login

The ERI login endpoint uses these credentials:

```bash
POST /api/eri/login
Content-Type: application/json

{
  "pan": "ABCDE1234F",
  "dob": "1990-01-01",
  "password": "user_password_here",
  "assessmentYear": "2024-25"
}
```

The backend will:
1. Encrypt the password using AES encryption with the `ERI_API_SECRET`
2. Generate a CMS/PKCS#7 signed payload using the PKCS12 certificate
3. Send the signed payload to the ERI API

### Testing ERI Configuration

Check if ERI is properly configured:

```bash
GET /api/eri/validate-config
GET /api/eri/status
```

---

## Security Notes

⚠️ **Important Security Considerations:**

1. **UAT vs Production:** These are UAT credentials. Production credentials will be different.
2. **Certificate Security:** Keep the PKCS12 certificate file and password secure. Never commit them to version control.
3. **Secret Key:** The `ERI_API_SECRET` is used for password encryption. Keep it secure.
4. **Environment Variables:** Never commit `.env` files with actual credentials to version control.

---

## Next Steps

1. ✅ UAT credentials received and documented
2. ⏳ Obtain PKCS12 certificate from Income Tax FO portal
3. ⏳ Configure certificate path and password in `.env`
4. ⏳ Test ERI login endpoint
5. ⏳ Test ITR submission via ERI
6. ⏳ Request production credentials when ready

---

## Support

For ERI-related issues, contact:
- **Email:** erihelp@incometax.gov.in
- **Subject:** Include your User ID (ERIP013662) in all communications

---

## Related Documentation

- `docs/ERI data-sig-process-guide.md` - ERI Data Signature Process Guide
- `backend/src/services/business/eriSigningService.js` - ERI Signing Service Implementation
- `backend/src/controllers/eriController.js` - ERI Controller Endpoints

