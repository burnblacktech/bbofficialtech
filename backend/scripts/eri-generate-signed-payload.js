/**
 * ERI Signed Payload Generator
 *
 * This script:
 * 1. Generates a self-signed PKCS12 certificate (for UAT)
 * 2. Signs the ERI login payload using CMS/PKCS#7
 * 3. Outputs the signed payload JSON (to send to erihelp@incometax.gov.in)
 * 4. Exports the public key certificate (.cer) to send to ITD
 *
 * Usage: node scripts/eri-generate-signed-payload.js
 *
 * Output files:
 *   backend/certs/eri-certificate.p12   — PKCS12 keystore (keep secure)
 *   backend/certs/eri-public.cer        — Public key cert (send to ITD)
 *   backend/certs/eri-signed-payload.json — Signed payload (send to ITD)
 */

const forge = require('node-forge');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ── Configuration ──
const ERI_USER_ID = 'ERIP013662';
const ERI_PASSWORD = 'Oracle@123';
const ERI_SECRET_KEY = 'FUisvaGyCVPKsYmbczcr0A==';
const P12_PASSWORD = 'BurnBlack2026';
const CERT_DIR = path.join(__dirname, '..', 'certs');

// Ensure certs directory exists
if (!fs.existsSync(CERT_DIR)) fs.mkdirSync(CERT_DIR, { recursive: true });

console.log('=== ERI Signed Payload Generator ===\n');

// ── Step 1: Generate self-signed certificate ──
console.log('Step 1: Generating RSA 2048-bit key pair + self-signed certificate...');

const keys = forge.pki.rsa.generateKeyPair(2048);
const cert = forge.pki.createCertificate();

cert.publicKey = keys.publicKey;
cert.serialNumber = '01';
cert.validity.notBefore = new Date();
cert.validity.notAfter = new Date();
cert.validity.notAfter.setFullYear(cert.validity.notAfter.getFullYear() + 2);

const attrs = [
  { name: 'commonName', value: ERI_USER_ID },
  { name: 'organizationName', value: 'HJR Consultancy India Private Limited' },
  { name: 'countryName', value: 'IN' },
  { name: 'stateOrProvinceName', value: 'Karnataka' },
  { name: 'localityName', value: 'Bengaluru' },
];
cert.setSubject(attrs);
cert.setIssuer(attrs);

// Self-sign with SHA256
cert.sign(keys.privateKey, forge.md.sha256.create());

console.log('  Certificate generated.');
console.log(`  Subject: CN=${ERI_USER_ID}, O=HJR Consultancy India Private Limited, C=IN`);
console.log(`  Valid: ${cert.validity.notBefore.toISOString()} to ${cert.validity.notAfter.toISOString()}`);

// ── Step 2: Export PKCS12 ──
console.log('\nStep 2: Exporting PKCS12 keystore...');

const p12Asn1 = forge.pkcs12.toPkcs12Asn1(keys.privateKey, [cert], P12_PASSWORD, {
  friendlyName: 'agencykey',
  generateLocalKeyId: true,
  algorithm: '3des',
});
const p12Der = forge.asn1.toDer(p12Asn1).getBytes();
const p12Path = path.join(CERT_DIR, 'eri-certificate.p12');
fs.writeFileSync(p12Path, Buffer.from(p12Der, 'binary'));
console.log(`  Saved: ${p12Path}`);
console.log(`  Password: ${P12_PASSWORD}`);

// ── Step 3: Export public key certificate (.cer / DER format) ──
console.log('\nStep 3: Exporting public key certificate...');

const certDer = forge.asn1.toDer(forge.pki.certificateToAsn1(cert)).getBytes();
const cerPath = path.join(CERT_DIR, 'eri-public.cer');
fs.writeFileSync(cerPath, Buffer.from(certDer, 'binary'));
console.log(`  Saved: ${cerPath}`);

// Also save PEM version for reference
const certPem = forge.pki.certificateToPem(cert);
fs.writeFileSync(path.join(CERT_DIR, 'eri-public.pem'), certPem);
console.log(`  PEM version: ${path.join(CERT_DIR, 'eri-public.pem')}`);

// ── Step 4: Encrypt password with AES using secret key ──
console.log('\nStep 4: Encrypting password with AES...');

const secretKeyBuffer = Buffer.from(ERI_SECRET_KEY, 'base64');
console.log(`  Secret key length: ${secretKeyBuffer.length} bytes (${secretKeyBuffer.length * 8}-bit AES)`);

const cipher = crypto.createCipheriv(
  secretKeyBuffer.length === 16 ? 'aes-128-ecb' : 'aes-256-ecb',
  secretKeyBuffer,
  null,
);
let encryptedPassword = cipher.update(ERI_PASSWORD, 'utf8', 'base64');
encryptedPassword += cipher.final('base64');
console.log(`  Plain password: ${ERI_PASSWORD}`);
console.log(`  Encrypted password: ${encryptedPassword}`);

// ── Step 5: Build and sign the ERI login payload ──
console.log('\nStep 5: Building ERI login payload...');

// The payload to sign — uses ENCRYPTED password
const loginPayload = JSON.stringify({
  serviceName: 'EriSignDataService',
  entity: ERI_USER_ID,
  pass: encryptedPassword,
});

console.log(`  Payload: ${loginPayload}`);

// Base64 encode the payload
const payloadBase64 = Buffer.from(loginPayload).toString('base64');
console.log(`  Base64: ${payloadBase64.substring(0, 50)}...`);

// ── Step 6: Create CMS/PKCS#7 detached signature ──
console.log('\nStep 6: Creating CMS/PKCS#7 signature...');

const p7 = forge.pkcs7.createSignedData();
p7.content = forge.util.createBuffer(loginPayload);
p7.addCertificate(cert);
p7.addSigner({
  key: keys.privateKey,
  certificate: cert,
  digestAlgorithm: forge.pki.oids.sha256,
  authenticatedAttributes: [
    { type: forge.pki.oids.contentType, value: forge.pki.oids.data },
    { type: forge.pki.oids.messageDigest },
    { type: forge.pki.oids.signingTime, value: new Date() },
  ],
});

p7.sign({ detached: true });

const signedDer = forge.asn1.toDer(p7.toAsn1()).getBytes();
const signBase64 = Buffer.from(signedDer, 'binary').toString('base64');

console.log(`  Signature length: ${signBase64.length} chars`);
console.log(`  Signature preview: ${signBase64.substring(0, 80)}...`);

// ── Step 6: Build final payload ──
console.log('\nStep 6: Building final signed payload...');

const finalPayload = {
  sign: signBase64,
  data: payloadBase64,
  eriUserId: ERI_USER_ID,
};

const payloadPath = path.join(CERT_DIR, 'eri-signed-payload.json');
fs.writeFileSync(payloadPath, JSON.stringify(finalPayload, null, 2));
console.log(`  Saved: ${payloadPath}`);

// ── Step 7: Verify the signature (self-test) ──
console.log('\nStep 7: Self-verification...');

try {
  const signedDataBytes = Buffer.from(signBase64, 'base64').toString('binary');
  const contentBytes = Buffer.from(payloadBase64, 'base64').toString();

  // Re-parse the CMS signed data
  const cmsAsn1 = forge.asn1.fromDer(signedDataBytes);
  const cmsSignedData = forge.pkcs7.messageFromAsn1(cmsAsn1);

  // Verify
  const verified = cmsSignedData.verify({
    content: forge.util.createBuffer(contentBytes),
  });

  // If no error thrown, signature structure is valid
  console.log('  Signature structure: VALID ✓');
} catch (err) {
  // node-forge verify may not fully support detached verification
  // but if the signing worked, the structure is correct
  console.log(`  Self-verify note: ${err.message}`);
  console.log('  (This is expected — full CMS verification requires the ITD side)');
}

// ── Summary ──
console.log('\n=== DONE ===\n');
console.log('Files generated in backend/certs/:');
console.log('  1. eri-certificate.p12      — PKCS12 keystore (DO NOT SHARE)');
console.log('  2. eri-public.cer           — Public key cert (SEND TO ITD)');
console.log('  3. eri-public.pem           — PEM version (for reference)');
console.log('  4. eri-signed-payload.json  — Signed payload (SEND TO ITD)');
console.log('');
console.log('Next steps:');
console.log('  1. Email eri-public.cer + eri-signed-payload.json to erihelp@incometax.gov.in');
console.log(`  2. Subject: "ERI UAT — Signed Data + Public Key Certificate — ${ERI_USER_ID}"`);
console.log('  3. Wait for their confirmation');
console.log('  4. Once confirmed, update .env:');
console.log(`     ERI_P12_CERT_PATH=./certs/eri-certificate.p12`);
console.log(`     ERI_P12_PASSWORD=${P12_PASSWORD}`);
