# Generating Secure Secrets on Windows

Since `openssl` is not available by default on Windows, here are Windows-friendly methods to generate secure secrets for your environment variables.

## Method 1: Using Node.js Script (Recommended)

We've created a custom script that works on all platforms:

```powershell
cd backend
npm run generate-secrets
```

This will generate:
- JWT Secret
- Session Secret
- Password Reset Secret
- Share Token Secret
- Supabase JWT Secret

### Generate Specific Secrets

```powershell
# Generate only JWT secret
npm run generate-secrets -- --type=jwt

# Generate only session secret
npm run generate-secrets -- --type=session
```

## Method 2: Using Node.js Directly

### Generate JWT Secret (64 bytes hex)

```powershell
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Generate Session Secret (32 bytes base64)

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Generate Password Reset Secret

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Method 3: Using PowerShell (Built-in)

### Generate Random Hex String

```powershell
# Generate 64-byte hex string (128 characters) for JWT
-join ((48..57) + (97..102) | Get-Random -Count 128 | ForEach-Object {[char]$_})

# Or using .NET
[Convert]::ToBase64String((1..64 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

### Generate Base64 String

```powershell
# Generate 32-byte base64 string for session secret
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

## Method 4: Install OpenSSL for Windows

If you prefer using `openssl`:

1. **Download OpenSSL for Windows:**
   - Visit: https://slproweb.com/products/Win32OpenSSL.html
   - Download and install the latest version

2. **Add to PATH:**
   - Add OpenSSL installation directory to your system PATH

3. **Use as normal:**
   ```powershell
   openssl rand -hex 64
   openssl rand -base64 32
   ```

## Method 5: Using Git Bash (if installed)

If you have Git for Windows installed, Git Bash includes `openssl`:

```bash
# Open Git Bash
openssl rand -hex 64
openssl rand -base64 32
```

## Recommended Secret Lengths

| Secret Type | Format | Length | Example Command |
|------------|--------|--------|----------------|
| JWT Secret | Hex | 64 bytes (128 chars) | `npm run generate-secrets -- --type=jwt` |
| Session Secret | Base64 | 32 bytes | `npm run generate-secrets -- --type=session` |
| Password Reset | Hex | 32 bytes (64 chars) | `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| Share Token | Hex | 32 bytes (64 chars) | `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |

## Quick Reference

### All Secrets at Once

```powershell
cd backend
npm run generate-secrets
```

### Individual Secrets

```powershell
# JWT Secret
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"

# Session Secret
node -e "console.log('SESSION_SECRET=' + require('crypto').randomBytes(32).toString('base64'))"

# Password Reset Secret
node -e "console.log('PASSWORD_RESET_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
```

## Security Best Practices

1. **Never commit secrets to Git**
   - Add `.env` to `.gitignore`
   - Use `.env.example` for templates

2. **Use different secrets for each environment**
   - Development
   - Staging
   - Production

3. **Rotate secrets regularly**
   - Change secrets every 90 days
   - Update all environments simultaneously

4. **Store secrets securely**
   - Use environment variables
   - Use secret management services (Vercel, AWS Secrets Manager, etc.)
   - Never hardcode in source code

## Example Output

When you run `npm run generate-secrets`, you'll see:

```
╔════════════════════════════════════════════════════════════╗
║         SECURE SECRET GENERATOR                             ║
╚════════════════════════════════════════════════════════════╝

JWT Secret:
JWT_SECRET=c44b103873d3dda3146022a88a0850c0feb72a0994ef969fac4ff3658e41e814

Session Secret:
SESSION_SECRET=Wh136lomtKkVXwCqGEC+dUlDmORuYRSo2xWFiqFHXGg=

Password Reset Secret:
PASSWORD_RESET_SECRET=...

Share Token Secret:
SHARE_TOKEN_SECRET=...

✅ Secrets generated successfully!

⚠️  IMPORTANT: Copy these secrets to your .env file
⚠️  Never commit secrets to version control!
```

## Troubleshooting

### "node is not recognized"
- Install Node.js from https://nodejs.org/
- Restart your terminal after installation

### "npm is not recognized"
- Node.js includes npm, ensure Node.js is installed
- Check that Node.js is in your PATH

### Script not found
- Ensure you're in the `backend` directory
- Run `npm install` if you haven't already

---

**Last Updated**: 2025-01-XX
**Version**: 1.0

