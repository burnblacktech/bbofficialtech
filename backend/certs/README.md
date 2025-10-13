# ERI Certificate Directory

This directory contains the digital certificates required for ERI (E-Return Intermediary) operations.

## Required Files

### `eri-certificate.p12`
- **Type**: PKCS#12 certificate file
- **Purpose**: Contains the private key and certificate for digital signing
- **Format**: Binary file with .p12 or .pfx extension
- **Password**: Set in `ERI_P12_PASSWORD` environment variable

## Security Notes

⚠️ **IMPORTANT**: This directory contains sensitive cryptographic materials.

1. **Never commit certificate files to version control**
2. **Keep the keystore password secure**
3. **Regularly rotate certificates as per ITD guidelines**
4. **Use strong passwords for the keystore**

## Certificate Setup

1. Obtain your ERI certificate from the Income Tax Department
2. Place the .p12 file in this directory
3. Update the `ERI_P12_CERT_PATH` in your `.env` file
4. Set the `ERI_P12_PASSWORD` in your `.env` file
5. Ensure the `ERI_USER_ID` matches your registered ERI ID

## File Structure

```
backend/certs/
├── README.md                 # This file
├── eri-certificate.p12      # Your ERI certificate (not in git)
└── .gitignore               # Excludes certificate files from git
```

## Testing

Use the test controller at `/api/eri/test-signing` to verify your certificate setup.
