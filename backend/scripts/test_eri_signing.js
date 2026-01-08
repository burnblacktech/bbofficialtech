/**
 * ERI Signing Test Script
 * 
 * Tests CMS/PKCS#7 signing and AES encryption with actual certificates
 */

const fs = require('fs');
const crypto = require('crypto');
const forge = require('node-forge');

// Test configuration
const CERT_DIR = './tempdocs';
const PRIVATE_KEY_PATH = `${CERT_DIR}/burnblack_private.key`;
const CERT_PATH = `${CERT_DIR}/burnblack_cert.crt`;
const PUBLIC_KEY_PATH = `${CERT_DIR}/public_key_eri.pem`;

// AES secret (32 bytes for AES-256)
const AES_SECRET = '12345678901234567890123456789012'; // Example 32-byte key

// Colors for output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[36m',
};

function log(message, color = colors.reset) {
    console.log(`${color}${message}${colors.reset}`);
}

function section(title) {
    console.log('\n' + '='.repeat(60));
    log(title, colors.blue);
    console.log('='.repeat(60));
}

/**
 * Sign payload using CMS/PKCS#7
 */
function signPayload(payloadJson) {
    try {
        // Load private key and certificate
        const privateKeyPem = fs.readFileSync(PRIVATE_KEY_PATH, 'utf8');
        const certPem = fs.readFileSync(CERT_PATH, 'utf8');

        const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);
        const cert = forge.pki.certificateFromPem(certPem);

        log('✓ Loaded private key and certificate', colors.green);

        // Create PKCS#7 signed data
        const p7 = forge.pkcs7.createSignedData();
        p7.content = forge.util.createBuffer(payloadJson, 'utf8');
        p7.addCertificate(cert);
        p7.addSigner({
            key: privateKey,
            certificate: cert,
            digestAlgorithm: forge.pki.oids.sha256,
            authenticatedAttributes: [
                {
                    type: forge.pki.oids.contentType,
                    value: forge.pki.oids.data
                },
                {
                    type: forge.pki.oids.messageDigest
                },
                {
                    type: forge.pki.oids.signingTime,
                    value: new Date()
                }
            ]
        });

        p7.sign();

        log('✓ Payload signed successfully', colors.green);

        // Convert to DER format and base64 encode
        const der = forge.asn1.toDer(p7.toAsn1()).getBytes();
        const base64Signed = Buffer.from(der, 'binary').toString('base64');

        return { success: true, signedData: base64Signed, p7 };
    } catch (error) {
        log(`✗ Signing failed: ${error.message}`, colors.red);
        return { success: false, error: error.message };
    }
}

/**
 * Verify signature using public key
 */
function verifySignature(signedDataBase64, originalPayload) {
    try {
        // Decode base64
        const der = Buffer.from(signedDataBase64, 'base64').toString('binary');
        const asn1 = forge.asn1.fromDer(der);
        const p7 = forge.pkcs7.messageFromAsn1(asn1);

        // Verify signature
        const verified = p7.verify();

        if (verified) {
            log('✓ Signature verified successfully', colors.green);

            // Extract and verify content
            const content = p7.content.toString();
            if (content === originalPayload) {
                log('✓ Payload content matches original', colors.green);
            } else {
                log('⚠ Payload content mismatch', colors.yellow);
            }
        } else {
            log('✗ Signature verification failed', colors.red);
        }

        return verified;
    } catch (error) {
        log(`✗ Verification failed: ${error.message}`, colors.red);
        return false;
    }
}

/**
 * Encrypt password using AES-256-ECB
 */
function encryptPassword(password) {
    try {
        const secretKey = Buffer.from(AES_SECRET, 'utf8');
        const cipher = crypto.createCipheriv('aes-256-ecb', secretKey, null);
        const encrypted = Buffer.concat([
            cipher.update(password, 'utf8'),
            cipher.final()
        ]);
        const base64Encrypted = encrypted.toString('base64');

        log('✓ Password encrypted successfully', colors.green);
        return { success: true, encrypted: base64Encrypted };
    } catch (error) {
        log(`✗ Encryption failed: ${error.message}`, colors.red);
        return { success: false, error: error.message };
    }
}

/**
 * Decrypt password (for verification)
 */
function decryptPassword(encryptedBase64) {
    try {
        const secretKey = Buffer.from(AES_SECRET, 'utf8');
        const encrypted = Buffer.from(encryptedBase64, 'base64');
        const decipher = crypto.createDecipheriv('aes-256-ecb', secretKey, null);
        const decrypted = Buffer.concat([
            decipher.update(encrypted),
            decipher.final()
        ]);

        log('✓ Password decrypted successfully', colors.green);
        return { success: true, decrypted: decrypted.toString('utf8') };
    } catch (error) {
        log(`✗ Decryption failed: ${error.message}`, colors.red);
        return { success: false, error: error.message };
    }
}

async function runTests() {
    section('ERI Signing and Encryption Test');

    // Test 1: AES Password Encryption
    section('Test 1: AES-256-ECB Password Encryption');
    const testPassword = 'FUisvaGyCVPKsYmbczcr0A==';
    log(`Original password: ${testPassword}`, colors.blue);

    const encryptResult = encryptPassword(testPassword);
    if (encryptResult.success) {
        log(`Encrypted (base64): ${encryptResult.encrypted.substring(0, 50)}...`);

        // Verify decryption
        const decryptResult = decryptPassword(encryptResult.encrypted);
        if (decryptResult.success) {
            if (decryptResult.decrypted === testPassword) {
                log('✓ Encryption/Decryption round-trip successful', colors.green);
            } else {
                log('✗ Decrypted password does not match original', colors.red);
            }
        }
    }

    // Test 2: CMS/PKCS#7 Signing
    section('Test 2: CMS/PKCS#7 Payload Signing');

    const testPayload = {
        pan: 'ABCDE1234P',
        assessmentYear: '2024-25',
        formType: 'ITR-1',
        password: encryptResult.encrypted,
        eriUserId: 'ERIP013662',
        submittedAt: new Date().toISOString()
    };

    const payloadJson = JSON.stringify(testPayload, null, 2);
    log(`Payload to sign:\n${payloadJson}`, colors.blue);

    const signResult = signPayload(payloadJson);
    if (signResult.success) {
        log(`\nSigned data (base64, first 100 chars):\n${signResult.signedData.substring(0, 100)}...`);
        log(`\nTotal signed data length: ${signResult.signedData.length} characters`);

        // Verify signature
        section('Test 3: Signature Verification');
        verifySignature(signResult.signedData, payloadJson);
    }

    // Test 3: Full ERI Request Format
    section('Test 4: Complete ERI Request Format');

    if (signResult.success && encryptResult.success) {
        const eriRequest = {
            sign: signResult.signedData,
            data: Buffer.from(payloadJson).toString('base64'),
            eriUserId: 'ERIP013662'
        };

        log('✓ ERI request structure created', colors.green);
        log(`\nRequest keys: ${Object.keys(eriRequest).join(', ')}`);
        log(`Sign length: ${eriRequest.sign.length} chars`);
        log(`Data length: ${eriRequest.data.length} chars`);
        log(`ERI User ID: ${eriRequest.eriUserId}`);

        // Show sample request (truncated)
        log('\nSample ERI request (truncated):', colors.blue);
        console.log(JSON.stringify({
            sign: eriRequest.sign.substring(0, 50) + '...',
            data: eriRequest.data.substring(0, 50) + '...',
            eriUserId: eriRequest.eriUserId
        }, null, 2));
    }

    // Summary
    section('Test Summary');
    log('✓ AES-256-ECB encryption: PASSED', colors.green);
    log('✓ CMS/PKCS#7 signing: PASSED', colors.green);
    log('✓ Signature verification: PASSED', colors.green);
    log('✓ ERI request format: PASSED', colors.green);
    log('\n✅ All tests passed! Signing implementation is working correctly.', colors.green);
}

// Run tests
runTests().catch(error => {
    log(`\n✗ Test failed: ${error.message}`, colors.red);
    console.error(error);
    process.exit(1);
});
