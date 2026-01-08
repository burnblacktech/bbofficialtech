# ERI Lightsail Deployment Guide

## Overview

This guide covers deploying the ERI Worker to Lightsail with live mode configuration for production ERI submissions.

## Prerequisites

- ✅ Lightsail instance with static IP whitelisted by ITD
- ✅ ERI credentials from ITD (`ERI_USERNAME`, `ERI_SECRET`)
- ✅ TLS certificates:
  - Client certificate (`.pem`)
  - Client private key (`.key`)
  - ITD CA chain (`.pem`)

## Deployment Steps

### 1. Upload TLS Certificates

Create secure directory and upload certificates:

```bash
# SSH into Lightsail instance
ssh -i your-key.pem ubuntu@your-lightsail-ip

# Create secure directory
sudo mkdir -p /secure
sudo chmod 700 /secure

# Upload certificates (from local machine)
scp -i your-key.pem eri_client.pem ubuntu@your-lightsail-ip:/tmp/
scp -i your-key.pem eri_client.key ubuntu@your-lightsail-ip:/tmp/
scp -i your-key.pem itd_ca.pem ubuntu@your-lightsail-ip:/tmp/

# Move to secure directory (on Lightsail)
sudo mv /tmp/eri_client.pem /secure/
sudo mv /tmp/eri_client.key /secure/
sudo mv /tmp/itd_ca.pem /secure/
sudo chmod 600 /secure/*
```

### 2. Configure Environment Variables

Add to production `.env` file:

```bash
# ERI Mode
ERI_MODE=stub  # Start with stub, switch to live after verification

# Live Mode Credentials
ERI_USERNAME=your_actual_eri_username
ERI_SECRET=your_actual_eri_secret

# TLS Certificate Paths
ERI_CERT_PATH=/secure/eri_client.pem
ERI_KEY_PATH=/secure/eri_client.key
ERI_CA_CHAIN=/secure/itd_ca.pem

# Live Mode Endpoint
ERI_ENDPOINT=https://api.incometax.gov.in/eri/v1/submit
```

### 3. Upload Signing Certificates

Upload private key and certificate chain for payload signing:

```bash
# Upload signing certificates (from local machine)
scp -i your-key.pem eri_private.key ubuntu@your-lightsail-ip:/tmp/
scp -i your-key.pem eri_cert_chain.pem ubuntu@your-lightsail-ip:/tmp/

# Move to secure directory (on Lightsail)
sudo mv /tmp/eri_private.key /secure/
sudo mv /tmp/eri_cert_chain.pem /secure/
sudo chmod 600 /secure/eri_private.key
sudo chmod 600 /secure/eri_cert_chain.pem
```

Add signing configuration to production `.env`:

```bash
# ERI Signing Configuration
ERI_PRIVATE_KEY_PATH=/secure/eri_private.key
ERI_CERT_CHAIN_PATH=/secure/eri_cert_chain.pem
ERI_AES_SECRET=your_32_byte_secret_key_here_xxx
```

> **Important**: `ERI_AES_SECRET` must be exactly 32 bytes for AES-256 encryption.

### 4. Verify Stub Mode First

Before enabling live mode, verify the worker executes correctly:

```bash
# Ensure ERI_MODE=stub in .env
node scripts/manual_eri_verification.js
```

**Expected outcomes**:
- Worker polls `submitted_to_eri` filings
- Creates `eri_submission_attempts` records
- State transitions fire correctly
- Snapshots are used (not live filings)

### 5. Enable Live Mode

Once stub mode verification passes:

```bash
# Update .env
ERI_MODE=live

# Restart application
pm2 restart all
```

### 6. Controlled Live Test

Submit one known PAN for live testing:

```bash
# Create test filing with known PAN
# Manually transition to submitted_to_eri state
# Trigger worker manually
node -e "require('./src/workers/ERIWorker').runOnce()"
```

**Verify**:
1. Check logs for TLS handshake success
2. Query `eri_submission_attempts` for ACK number
3. Verify state transition: `submitted_to_eri` → `eri_success`
4. Confirm snapshot preserved

### 7. Start Worker Daemon

Once live mode is verified:

```bash
# Add to application startup
# Worker will poll every 30 seconds (configurable via ERI_POLL_INTERVAL_SECONDS)
```

## Monitoring

### Database Queries

```sql
-- Check recent attempts
SELECT * FROM eri_submission_attempts 
ORDER BY created_at DESC 
LIMIT 10;

-- Check filing states
SELECT id, pan, lifecycle_state, eri_ack_number 
FROM itr_filings 
WHERE lifecycle_state IN ('submitted_to_eri', 'eri_success', 'eri_failed')
ORDER BY updated_at DESC;

-- Check retry queue
SELECT filing_id, attempt_number, next_attempt_at, error_code
FROM eri_submission_attempts
WHERE status = 'retryable_failure'
AND next_attempt_at > NOW();
```

### Logs

```bash
# Watch worker logs
pm2 logs --lines 100 | grep ERI

# Check for errors
grep "ERI live submission error" logs/app.log
```

## Troubleshooting

### TLS Certificate Errors

```
Error: Certificate file not found: /secure/eri_client.pem
```

**Solution**: Verify certificate paths and permissions:
```bash
ls -la /secure/
# Should show 600 permissions
```

### Authentication Errors

```
Error: 401 Unauthorized
```

**Solution**: Verify `ERI_USERNAME` and `ERI_SECRET` match ITD credentials

### IP Whitelist Errors

```
Error: 403 Forbidden
```

**Solution**: Confirm Lightsail static IP is whitelisted with ITD

### Network Errors

```
Error: ETIMEDOUT
```

**Solution**: Check firewall rules, ensure outbound HTTPS allowed

## Rollback to Stub Mode

If live mode encounters issues:

```bash
# Update .env
ERI_MODE=stub

# Restart
pm2 restart all
```

Stub mode will resume deterministic testing behavior.

## Security Notes

- ✅ Never commit certificates to version control
- ✅ Never expose `/secure/` directory via web server
- ✅ Rotate credentials periodically
- ✅ Monitor `eri_submission_attempts` for suspicious patterns
- ✅ Keep CA chain updated per ITD guidance
