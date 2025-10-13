/**
 * ERI Controller
 * 
 * Handles ERI (E-Return Intermediary) operations including digital signing
 * and communication with ITD APIs.
 */

const { generateSignedPayload, validateConfiguration, loadCertificate } = require('../services/eriSigningService');
const { savePublicKeyCertificate, getCertificateInfo, validatePEMCertificate } = require('../utils/certificateUtils');
const enterpriseLogger = require('../utils/logger');
const axios = require('axios');

/**
 * Test ERI signing functionality
 * POST /api/eri/test-signing
 */
const testSigning = async (req, res) => {
  try {
    enterpriseLogger.info('ERI signing test requested');

    // Test data using actual ERI credentials
    const testData = {
      serviceName: "EriJsonDataService",
      entity: "ERIP013662",
      pass: "Oracle@123",
      timestamp: new Date().toISOString(),
      testMode: true
    };

    // Generate signed payload
    const signedPayload = generateSignedPayload(testData);

    // Log the result (without sensitive data)
    enterpriseLogger.info('ERI signing test completed successfully', {
      eriUserId: signedPayload.eriUserId,
      dataSize: signedPayload.data.length,
      signatureSize: signedPayload.sign.length
    });

    res.json({
      success: true,
      message: 'ERI signing test completed successfully',
      payload: {
        eriUserId: signedPayload.eriUserId,
        dataSize: signedPayload.data.length,
        signatureSize: signedPayload.sign.length,
        // Include full payload for testing (remove in production)
        fullPayload: signedPayload
      }
    });

  } catch (error) {
    enterpriseLogger.error('ERI signing test failed', { 
      error: error.message,
      stack: error.stack 
    });

    res.status(500).json({
      success: false,
      message: 'ERI signing test failed',
      error: error.message
    });
  }
};

/**
 * Validate ERI configuration
 * GET /api/eri/validate-config
 */
const validateConfig = async (req, res) => {
  try {
    enterpriseLogger.info('ERI configuration validation requested');

    const isValid = validateConfiguration();
    
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'ERI configuration is invalid',
        details: 'Check your .env file for missing ERI configuration'
      });
    }

    // Try to load certificate for additional validation
    const certData = loadCertificate();
    
    if (!certData) {
      return res.status(400).json({
        success: false,
        message: 'ERI certificate could not be loaded',
        details: 'Check certificate file path and password'
      });
    }

    const { certificate } = certData;

    res.json({
      success: true,
      message: 'ERI configuration is valid',
      certificate: {
        subject: certificate.subject.getField('CN')?.value || 'Unknown',
        issuer: certificate.issuer.getField('CN')?.value || 'Unknown',
        validFrom: certificate.validity.notBefore,
        validTo: certificate.validity.notAfter,
        serialNumber: certificate.serialNumber
      }
    });

  } catch (error) {
    enterpriseLogger.error('ERI configuration validation failed', { 
      error: error.message 
    });

    res.status(500).json({
      success: false,
      message: 'Configuration validation failed',
      error: error.message
    });
  }
};

/**
 * Submit ITR data to ITD (example implementation)
 * POST /api/eri/submit-itr
 */
const submitITR = async (req, res) => {
  try {
    const { itrData } = req.body;

    if (!itrData) {
      return res.status(400).json({
        success: false,
        message: 'ITR data is required'
      });
    }

    enterpriseLogger.info('ITR submission requested', {
      userId: req.user?.id,
      itrType: itrData.formType
    });

    // Prepare the data for signing
    const dataToSign = {
      serviceName: "EriJsonDataService",
      entity: process.env.ERI_USER_ID,
      pass: process.env.ERI_API_SECRET,
      itrData: itrData,
      timestamp: new Date().toISOString()
    };

    // Generate signed payload
    const signedPayload = generateSignedPayload(dataToSign);

    // In a real implementation, you would send this to ITD API
    // const itdResponse = await axios.post(process.env.ERI_API_URL, signedPayload);
    
    // For now, just return the signed payload
    enterpriseLogger.info('ITR submission prepared successfully', {
      eriUserId: signedPayload.eriUserId,
      dataSize: signedPayload.data.length
    });

    res.json({
      success: true,
      message: 'ITR submission prepared successfully',
      payload: signedPayload,
      // In production, return the ITD response instead
      // itdResponse: itdResponse.data
    });

  } catch (error) {
    enterpriseLogger.error('ITR submission failed', { 
      error: error.message,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      message: 'ITR submission failed',
      error: error.message
    });
  }
};

/**
 * Get ERI status and configuration info
 * GET /api/eri/status
 */
const getStatus = async (req, res) => {
  try {
    const configValid = validateConfiguration();
    
    let certificateInfo = null;
    if (configValid) {
      const certData = loadCertificate();
      if (certData) {
        const { certificate } = certData;
        certificateInfo = {
          subject: certificate.subject.getField('CN')?.value || 'Unknown',
          issuer: certificate.issuer.getField('CN')?.value || 'Unknown',
          validFrom: certificate.validity.notBefore,
          validTo: certificate.validity.notAfter,
          isValid: new Date() >= certificate.validity.notBefore && new Date() <= certificate.validity.notAfter
        };
      }
    }

    res.json({
      success: true,
      eri: {
        userId: process.env.ERI_USER_ID,
        apiUrl: process.env.ERI_API_URL,
        configurationValid: configValid,
        certificate: certificateInfo
      }
    });

  } catch (error) {
    enterpriseLogger.error('Failed to get ERI status', { 
      error: error.message 
    });

    res.status(500).json({
      success: false,
      message: 'Failed to get ERI status',
      error: error.message
    });
  }
};

/**
 * Extract and save public key certificate from PKCS#12
 * POST /api/eri/extract-public-key
 */
const extractPublicKey = async (req, res) => {
  try {
    enterpriseLogger.info('Public key extraction requested');

    const p12Path = process.env.ERI_P12_CERT_PATH;
    const password = process.env.ERI_P12_PASSWORD;

    if (!p12Path || !password) {
      return res.status(400).json({
        success: false,
        message: 'ERI certificate configuration missing',
        details: 'Check ERI_P12_CERT_PATH and ERI_P12_PASSWORD in .env'
      });
    }

    // Extract and save public key certificate
    const success = savePublicKeyCertificate(p12Path, password);
    
    if (!success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to extract public key certificate'
      });
    }

    // Get certificate information
    const certInfo = getCertificateInfo(p12Path, password);
    
    res.json({
      success: true,
      message: 'Public key certificate extracted successfully',
      certificate: certInfo,
      outputPath: './certs/public_key_eri.pem'
    });

  } catch (error) {
    enterpriseLogger.error('Public key extraction failed', { 
      error: error.message 
    });

    res.status(500).json({
      success: false,
      message: 'Public key extraction failed',
      error: error.message
    });
  }
};

/**
 * Validate existing PEM certificate
 * GET /api/eri/validate-pem
 */
const validatePEM = async (req, res) => {
  try {
    const pemPath = './certs/public_key_eri.pem';
    
    const certInfo = validatePEMCertificate(pemPath);
    
    if (!certInfo) {
      return res.status(400).json({
        success: false,
        message: 'PEM certificate validation failed',
        details: 'Check if public_key_eri.pem exists and is valid'
      });
    }

    res.json({
      success: true,
      message: 'PEM certificate is valid',
      certificate: certInfo
    });

  } catch (error) {
    enterpriseLogger.error('PEM certificate validation failed', { 
      error: error.message 
    });

    res.status(500).json({
      success: false,
      message: 'PEM certificate validation failed',
      error: error.message
    });
  }
};

module.exports = {
  testSigning,
  validateConfig,
  submitITR,
  getStatus,
  extractPublicKey,
  validatePEM
};
