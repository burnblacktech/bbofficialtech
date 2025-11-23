/**
 * ERI Data Signing Service
 * 
 * This service replicates the Java ERI Data Signature functionality for Node.js.
 * It creates CMS/PKCS#7 digital signatures for secure communication with ITD APIs.
 * 
 * Based on the official ITD ERI Data Signature Guide
 */

const forge = require('node-forge');
const fs = require('fs');
const path = require('path');
const enterpriseLogger = require('../utils/logger');

// Configuration - These must be in your .env file
const P12_CERT_PATH = process.env.ERI_P12_CERT_PATH || './certs/eri-certificate.p12';
const P12_PASSWORD = process.env.ERI_P12_PASSWORD;
const ERI_USER_ID = process.env.ERI_USER_ID;

/**
 * Validates ERI configuration
 * @returns {boolean} True if configuration is valid
 */
const validateConfiguration = () => {
  const errors = [];
  
  if (!P12_PASSWORD) {
    errors.push('ERI_P12_PASSWORD is required');
  }
  
  if (!ERI_USER_ID) {
    errors.push('ERI_USER_ID is required');
  }
  
  if (!fs.existsSync(path.resolve(__dirname, '../../', P12_CERT_PATH))) {
    errors.push(`ERI certificate file not found: ${P12_CERT_PATH}`);
  }
  
  if (errors.length > 0) {
    enterpriseLogger.error('ERI Configuration Validation Failed', { errors });
    return false;
  }
  
  return true;
};

/**
 * Loads and validates the PKCS#12 certificate
 * @returns {object} { privateKey, certificate } or null if failed
 */
const loadCertificate = () => {
  try {
    const certPath = path.resolve(__dirname, '../../', P12_CERT_PATH);
    
    if (!fs.existsSync(certPath)) {
      throw new Error(`Certificate file not found: ${certPath}`);
    }
    
    // Read the PKCS#12 file
    const p12Asn1 = forge.asn1.fromDer(
      fs.readFileSync(certPath, 'binary')
    );
    
    // Parse the PKCS#12 file with password
    const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, P12_PASSWORD);
    
    // Extract the private key
    const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
    const keyBag = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag];
    
    if (!keyBag || keyBag.length === 0) {
      throw new Error('No private key found in certificate file');
    }
    
    const privateKey = keyBag[0].key;
    
    // Extract the certificate
    const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
    const certBag = certBags[forge.pki.oids.certBag];
    
    if (!certBag || certBag.length === 0) {
      throw new Error('No certificate found in certificate file');
    }
    
    const certificate = certBag[0].cert;
    
    enterpriseLogger.info('ERI Certificate loaded successfully', {
      subject: certificate.subject.getField('CN').value,
      issuer: certificate.issuer.getField('CN').value,
      validFrom: certificate.validity.notBefore,
      validTo: certificate.validity.notAfter
    });
    
    return { privateKey, certificate };
    
  } catch (error) {
    enterpriseLogger.error('Failed to load ERI certificate', { 
      error: error.message,
      certPath: P12_CERT_PATH 
    });
    return null;
  }
};

/**
 * Creates a CMS/PKCS#7 detached signature for the given data
 * @param {string} dataString - The data to sign (JSON string)
 * @param {object} privateKey - The private key for signing
 * @param {object} certificate - The certificate for signing
 * @returns {string} Base64 encoded signature
 */
const createCMSSignature = (dataString, privateKey, certificate) => {
  try {
    // Create a PKCS#7 signed-data message
    const p7 = forge.pkcs7.createSignedData();
    
    // Set the content to the data we want to sign
    p7.content = forge.util.createBuffer(dataString, 'utf8');
    
    // Add the certificate to the signature
    p7.addCertificate(certificate);
    
    // Add the signer with authenticated attributes
    p7.addSigner({
      key: privateKey,
      certificate: certificate,
      digestAlgorithm: forge.pki.oids.sha256,
      authenticatedAttributes: [{
        type: forge.pki.oids.contentType,
        value: forge.pki.oids.data
      }, {
        type: forge.pki.oids.messageDigest
      }, {
        type: forge.pki.oids.signingTime,
        value: new Date()
      }]
    });
    
    // Sign the content (detached signature)
    p7.sign({ detached: true });
    
    // Convert to ASN.1 DER format
    const signedDataAsn1 = forge.pkcs7.messageToAsn1(p7);
    const signedDataDer = forge.asn1.toDer(signedDataAsn1).getBytes();
    
    // Encode to Base64
    const signatureBase64 = forge.util.encode64(signedDataDer);
    
    enterpriseLogger.info('CMS signature created successfully', {
      dataLength: dataString.length,
      signatureLength: signatureBase64.length
    });
    
    return signatureBase64;
    
  } catch (error) {
    enterpriseLogger.error('Failed to create CMS signature', { 
      error: error.message 
    });
    throw new Error('Failed to create digital signature');
  }
};

/**
 * Generates the complete, signed payload required for ERI API calls
 * @param {object} dataToSign - The plain JavaScript object to be signed
 * @returns {object} The final payload with base64 encoded sign, data, and eriUserId
 */
const generateSignedPayload = (dataToSign) => {
  try {
    // Validate configuration
    if (!validateConfiguration()) {
      throw new Error('ERI configuration is invalid');
    }
    
    // Load certificate
    const certData = loadCertificate();
    if (!certData) {
      throw new Error('Failed to load ERI certificate');
    }
    
    const { privateKey, certificate } = certData;
    
    // Convert data to JSON string
    const dataString = JSON.stringify(dataToSign);
    
    // Create CMS signature
    const signatureBase64 = createCMSSignature(dataString, privateKey, certificate);
    
    // Base64 encode the original data
    const dataBase64 = forge.util.encode64(dataString);
    
    // Construct the final payload
    const finalPayload = {
      sign: signatureBase64,
      data: dataBase64,
      eriUserId: ERI_USER_ID
    };
    
    enterpriseLogger.info('ERI signed payload generated successfully', {
      eriUserId: ERI_USER_ID,
      dataSize: dataString.length,
      signatureSize: signatureBase64.length
    });
    
    return finalPayload;
    
  } catch (error) {
    enterpriseLogger.error('ERI Signing Error', { 
      error: error.message,
      stack: error.stack 
    });
    throw new Error(`Failed to generate ERI signature: ${error.message}`);
  }
};

/**
 * Validates a signed payload structure
 * @param {object} payload - The payload to validate
 * @returns {boolean} True if payload structure is valid
 */
const validateSignedPayload = (payload) => {
  if (!payload || typeof payload !== 'object') {
    return false;
  }
  
  const requiredFields = ['sign', 'data', 'eriUserId'];
  return requiredFields.every(field => payload.hasOwnProperty(field));
};

/**
 * Extracts and decodes the original data from a signed payload
 * @param {object} signedPayload - The signed payload
 * @returns {object} The original data object
 */
const extractDataFromPayload = (signedPayload) => {
  try {
    if (!validateSignedPayload(signedPayload)) {
      throw new Error('Invalid signed payload structure');
    }
    
    // Decode the base64 data
    const dataString = forge.util.decode64(signedPayload.data);
    
    // Parse the JSON
    const originalData = JSON.parse(dataString);
    
    return originalData;
    
  } catch (error) {
    enterpriseLogger.error('Failed to extract data from signed payload', { 
      error: error.message 
    });
    throw new Error(`Failed to extract data: ${error.message}`);
  }
};

module.exports = {
  generateSignedPayload,
  validateSignedPayload,
  extractDataFromPayload,
  validateConfiguration,
  loadCertificate
};
