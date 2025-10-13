/**
 * Certificate Utilities for ERI
 * 
 * Utilities for working with ERI certificates and public keys
 */

const forge = require('node-forge');
const fs = require('fs');
const path = require('path');
const enterpriseLogger = require('./logger');

/**
 * Extract public key from PKCS#12 certificate
 * @param {string} p12Path - Path to PKCS#12 certificate file
 * @param {string} password - Password for the certificate
 * @returns {object} { publicKey, certificate } or null if failed
 */
const extractPublicKeyFromP12 = (p12Path, password) => {
  try {
    const certPath = path.resolve(__dirname, '../../', p12Path);
    
    if (!fs.existsSync(certPath)) {
      throw new Error(`Certificate file not found: ${certPath}`);
    }
    
    // Read the PKCS#12 file
    const p12Asn1 = forge.asn1.fromDer(
      fs.readFileSync(certPath, 'binary')
    );
    
    // Parse the PKCS#12 file with password
    const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password);
    
    // Extract the certificate
    const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
    const certBag = certBags[forge.pki.oids.certBag];
    
    if (!certBag || certBag.length === 0) {
      throw new Error('No certificate found in certificate file');
    }
    
    const certificate = certBag[0].cert;
    const publicKey = certificate.publicKey;
    
    enterpriseLogger.info('Public key extracted from PKCS#12', {
      subject: certificate.subject.getField('CN')?.value || 'Unknown',
      issuer: certificate.issuer.getField('CN')?.value || 'Unknown',
      validFrom: certificate.validity.notBefore,
      validTo: certificate.validity.notAfter
    });
    
    return { publicKey, certificate };
    
  } catch (error) {
    enterpriseLogger.error('Failed to extract public key from PKCS#12', { 
      error: error.message,
      p12Path 
    });
    return null;
  }
};

/**
 * Convert certificate to PEM format
 * @param {object} certificate - Forge certificate object
 * @returns {string} PEM formatted certificate
 */
const certificateToPEM = (certificate) => {
  try {
    const pem = forge.pki.certificateToPem(certificate);
    enterpriseLogger.info('Certificate converted to PEM format');
    return pem;
  } catch (error) {
    enterpriseLogger.error('Failed to convert certificate to PEM', { 
      error: error.message 
    });
    throw new Error('Failed to convert certificate to PEM format');
  }
};

/**
 * Convert public key to PEM format
 * @param {object} publicKey - Forge public key object
 * @returns {string} PEM formatted public key
 */
const publicKeyToPEM = (publicKey) => {
  try {
    const pem = forge.pki.publicKeyToPem(publicKey);
    enterpriseLogger.info('Public key converted to PEM format');
    return pem;
  } catch (error) {
    enterpriseLogger.error('Failed to convert public key to PEM', { 
      error: error.message 
    });
    throw new Error('Failed to convert public key to PEM format');
  }
};

/**
 * Save public key certificate to file
 * @param {string} p12Path - Path to PKCS#12 certificate file
 * @param {string} password - Password for the certificate
 * @param {string} outputPath - Output path for PEM file
 * @returns {boolean} True if successful
 */
const savePublicKeyCertificate = (p12Path, password, outputPath = './certs/public_key_eri.pem') => {
  try {
    const keyData = extractPublicKeyFromP12(p12Path, password);
    
    if (!keyData) {
      throw new Error('Failed to extract public key from certificate');
    }
    
    const { certificate } = keyData;
    const pemCertificate = certificateToPEM(certificate);
    
    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Write PEM certificate to file
    fs.writeFileSync(outputPath, pemCertificate);
    
    enterpriseLogger.info('Public key certificate saved', {
      outputPath,
      subject: certificate.subject.getField('CN')?.value || 'Unknown'
    });
    
    return true;
    
  } catch (error) {
    enterpriseLogger.error('Failed to save public key certificate', { 
      error: error.message,
      p12Path,
      outputPath
    });
    return false;
  }
};

/**
 * Get certificate information
 * @param {string} p12Path - Path to PKCS#12 certificate file
 * @param {string} password - Password for the certificate
 * @returns {object} Certificate information
 */
const getCertificateInfo = (p12Path, password) => {
  try {
    const keyData = extractPublicKeyFromP12(p12Path, password);
    
    if (!keyData) {
      throw new Error('Failed to extract certificate information');
    }
    
    const { certificate } = keyData;
    
    const info = {
      subject: {
        commonName: certificate.subject.getField('CN')?.value || 'Unknown',
        organization: certificate.subject.getField('O')?.value || 'Unknown',
        organizationalUnit: certificate.subject.getField('OU')?.value || 'Unknown',
        country: certificate.subject.getField('C')?.value || 'Unknown'
      },
      issuer: {
        commonName: certificate.issuer.getField('CN')?.value || 'Unknown',
        organization: certificate.issuer.getField('O')?.value || 'Unknown'
      },
      validity: {
        notBefore: certificate.validity.notBefore,
        notAfter: certificate.validity.notAfter,
        isValid: new Date() >= certificate.validity.notBefore && new Date() <= certificate.validity.notAfter
      },
      serialNumber: certificate.serialNumber,
      fingerprint: {
        md5: forge.md.md5.create().update(certificate.der).digest().toHex(),
        sha1: forge.md.sha1.create().update(certificate.der).digest().toHex(),
        sha256: forge.md.sha256.create().update(certificate.der).digest().toHex()
      }
    };
    
    enterpriseLogger.info('Certificate information extracted', {
      subject: info.subject.commonName,
      issuer: info.issuer.commonName,
      isValid: info.validity.isValid
    });
    
    return info;
    
  } catch (error) {
    enterpriseLogger.error('Failed to get certificate information', { 
      error: error.message,
      p12Path
    });
    return null;
  }
};

/**
 * Validate PEM certificate file
 * @param {string} pemPath - Path to PEM certificate file
 * @returns {object} Certificate information or null if invalid
 */
const validatePEMCertificate = (pemPath) => {
  try {
    const certPath = path.resolve(__dirname, '../../', pemPath);
    
    if (!fs.existsSync(certPath)) {
      throw new Error(`PEM certificate file not found: ${certPath}`);
    }
    
    const pemData = fs.readFileSync(certPath, 'utf8');
    const certificate = forge.pki.certificateFromPem(pemData);
    
    const info = {
      subject: {
        commonName: certificate.subject.getField('CN')?.value || 'Unknown',
        organization: certificate.subject.getField('O')?.value || 'Unknown'
      },
      issuer: {
        commonName: certificate.issuer.getField('CN')?.value || 'Unknown',
        organization: certificate.issuer.getField('O')?.value || 'Unknown'
      },
      validity: {
        notBefore: certificate.validity.notBefore,
        notAfter: certificate.validity.notAfter,
        isValid: new Date() >= certificate.validity.notBefore && new Date() <= certificate.validity.notAfter
      },
      serialNumber: certificate.serialNumber
    };
    
    enterpriseLogger.info('PEM certificate validated', {
      subject: info.subject.commonName,
      isValid: info.validity.isValid
    });
    
    return info;
    
  } catch (error) {
    enterpriseLogger.error('Failed to validate PEM certificate', { 
      error: error.message,
      pemPath
    });
    return null;
  }
};

module.exports = {
  extractPublicKeyFromP12,
  certificateToPEM,
  publicKeyToPEM,
  savePublicKeyCertificate,
  getCertificateInfo,
  validatePEMCertificate
};
