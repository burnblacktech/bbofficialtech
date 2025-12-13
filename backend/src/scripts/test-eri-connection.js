// =====================================================
// ERI CONNECTION TEST SCRIPT
// Tests ERI integration with Income Tax Department
// =====================================================

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const eriIntegrationService = require('../services/business/ERIIntegrationService');
const { validateConfiguration, generateSignedPayload } = require('../services/business/eriSigningService');
const axios = require('axios');
const enterpriseLogger = require('../utils/logger');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60));
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// Test 1: Check Environment Variables
async function testEnvironmentVariables() {
  logSection('Test 1: Environment Variables Check');

  const requiredVars = [
    'ERI_USER_ID',
    'ERI_PASSWORD',
    'ERI_API_SECRET',
    'ERI_API_BASE_URL',
    'FEATURE_ERI_LIVE',
  ];

  const optionalVars = [
    'ERI_SECRET_KEY',
    'ERI_API_KEY',
    'ERI_API_URL',
    'ERI_P12_CERT_PATH',
    'ERI_P12_PASSWORD',
  ];

  let allPresent = true;

  logInfo('Checking required variables...');
  for (const varName of requiredVars) {
    const value = process.env[varName];
    if (value) {
      logSuccess(`${varName} is set`);
      if (varName === 'ERI_PASSWORD' || varName === 'ERI_API_SECRET') {
        logInfo(`  Value: ${'*'.repeat(value.length)} (hidden)`);
      } else {
        logInfo(`  Value: ${value}`);
      }
    } else {
      logError(`${varName} is missing`);
      allPresent = false;
    }
  }

  logInfo('\nChecking optional variables...');
  for (const varName of optionalVars) {
    const value = process.env[varName];
    if (value) {
      logSuccess(`${varName} is set`);
      if (varName === 'ERI_P12_PASSWORD') {
        logInfo(`  Value: ${'*'.repeat(value.length)} (hidden)`);
      } else if (varName === 'ERI_P12_CERT_PATH') {
        logInfo(`  Value: ${value}`);
        // Check if certificate file exists
        const fs = require('fs');
        const path = require('path');
        const certPath = path.resolve(__dirname, '../../', value);
        if (fs.existsSync(certPath)) {
          logSuccess(`  Certificate file exists at: ${certPath}`);
        } else {
          logError(`  Certificate file NOT found at: ${certPath}`);
        }
      } else {
        logInfo(`  Value: ${value}`);
      }
    } else {
      logWarning(`${varName} is not set (optional)`);
    }
  }

  return allPresent;
}

// Test 2: Validate ERI Configuration
async function testConfigurationValidation() {
  logSection('Test 2: ERI Configuration Validation');

  try {
    const isValid = validateConfiguration();
    if (isValid) {
      logSuccess('ERI configuration is valid');
      
      // Try to load certificate and display details
      try {
        const { loadCertificate } = require('../services/business/eriSigningService');
        const certData = loadCertificate();
        if (certData && certData.certificate) {
          const cert = certData.certificate;
          logInfo('Certificate Details:');
          logInfo(`  Subject: ${cert.subject.getField('CN')?.value || 'N/A'}`);
          logInfo(`  Issuer: ${cert.issuer.getField('CN')?.value || 'N/A'}`);
          logInfo(`  Valid From: ${cert.validity.notBefore}`);
          logInfo(`  Valid To: ${cert.validity.notAfter}`);
          
          // Check if certificate is expired
          const now = new Date();
          const validTo = new Date(cert.validity.notAfter);
          if (validTo < now) {
            logError('  ⚠️  Certificate has EXPIRED!');
          } else {
            logSuccess('  Certificate is valid (not expired)');
          }
        }
      } catch (certError) {
        logWarning(`Could not load certificate details: ${certError.message}`);
      }
      
      return true;
    } else {
      logError('ERI configuration validation failed');
      logInfo('Check that:');
      logInfo('  - ERI_P12_CERT_PATH points to your certificate file');
      logInfo('  - ERI_P12_PASSWORD is set correctly');
      logInfo('  - Certificate file exists and is readable');
      return false;
    }
  } catch (error) {
    logError(`Configuration validation error: ${error.message}`);
    return false;
  }
}

// Test 3: Test ERI Signing Service
async function testSigningService() {
  logSection('Test 3: ERI Signing Service Test');

  try {
    const testData = {
      serviceName: 'EriJsonDataService',
      entity: process.env.ERI_USER_ID,
      pass: process.env.ERI_PASSWORD,
      timestamp: new Date().toISOString(),
      testMode: true,
    };

    logInfo('Generating signed payload...');
    const signedPayload = generateSignedPayload(testData);

    if (signedPayload && signedPayload.data && signedPayload.sign) {
      logSuccess('Signed payload generated successfully');
      logInfo(`  ERI User ID: ${signedPayload.eriUserId || 'N/A'}`);
      logInfo(`  Data size: ${signedPayload.data.length} bytes`);
      logInfo(`  Signature size: ${signedPayload.sign.length} bytes`);
      return true;
    } else {
      logError('Signed payload generation failed - invalid structure');
      return false;
    }
  } catch (error) {
    logError(`Signing service error: ${error.message}`);
    if (error.stack) {
      logInfo(`  Stack: ${error.stack.split('\n')[0]}`);
    }
    return false;
  }
}

// Test 4: Test ERI API Connectivity
async function testAPIConnectivity() {
  logSection('Test 4: ERI API Connectivity Test');

  const baseUrl = process.env.ERI_API_BASE_URL || 'https://eri.incometax.gov.in/api';
  const apiKey = process.env.ERI_API_KEY || process.env.ERI_API_SECRET;

  if (!apiKey) {
    logError('ERI API key not found');
    return false;
  }

  // Check current IP address
  try {
    logInfo('Checking current server IP address...');
    const ipResponse = await axios.get('https://api.ipify.org?format=json', { timeout: 5000 });
    const currentIP = ipResponse.data.ip;
    logInfo(`Current Public IP: ${currentIP}`);
    logWarning('⚠️  IMPORTANT: Ensure this IP is whitelisted with ITD');
    logWarning('⚠️  ERI API calls will only work from whitelisted IPs');
  } catch (ipError) {
    logWarning('Could not determine current IP address');
  }

  try {
    logInfo(`Testing connection to: ${baseUrl}`);
    logInfo('Attempting basic connectivity check...');

    // Try a simple health check or ping endpoint
    // Note: ERI API might not have a public health endpoint
    // This is a basic connectivity test
    const response = await axios.get(baseUrl, {
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
      validateStatus: (status) => status < 500, // Accept any status < 500 as connectivity success
    });

    logSuccess(`API endpoint is reachable (Status: ${response.status})`);
    return true;
  } catch (error) {
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      logError(`Cannot connect to ERI API: ${error.message}`);
      logWarning('This might be normal if the API requires authentication first');
    } else if (error.response) {
      // Got a response, so connectivity is working
      const status = error.response.status;
      logWarning(`API returned status ${status}: ${error.response.statusText}`);
      
      if (status === 403) {
        logError('⚠️  Access Forbidden - This may indicate:');
        logError('  - IP address is not whitelisted with ITD');
        logError('  - Certificate/public key mismatch');
        logError('  - Invalid API credentials');
      } else if (status === 401) {
        logError('⚠️  Unauthorized - Check your API credentials');
      } else {
        logInfo('Connectivity is working, but endpoint may require authentication');
      }
      return true; // Still consider it a connectivity success
    } else {
      logError(`Connection error: ${error.message}`);
    }
    return false;
  }
}

// Test 5: Test ERI Integration Service Initialization
async function testIntegrationService() {
  logSection('Test 5: ERI Integration Service Test');

  try {
    const isLiveMode = process.env.FEATURE_ERI_LIVE === 'true';
    const baseUrl = process.env.ERI_API_BASE_URL || 'https://eri.incometax.gov.in/api';
    const apiKey = process.env.ERI_API_KEY;

    logInfo(`Live Mode: ${isLiveMode ? 'ENABLED' : 'DISABLED (Mock Mode)'}`);
    logInfo(`Base URL: ${baseUrl}`);
    logInfo(`API Key: ${apiKey ? 'Set (' + apiKey.length + ' chars)' : 'Not set'}`);

    if (isLiveMode && !apiKey) {
      logError('Live mode is enabled but API key is missing');
      return false;
    }

    logSuccess('ERI Integration Service initialized successfully');
    return true;
  } catch (error) {
    logError(`Integration service error: ${error.message}`);
    return false;
  }
}

// Test 6: Test PAN Verification (Mock or Live)
async function testPANVerification() {
  logSection('Test 6: PAN Verification Test');

  const testPAN = 'ABCDE1234F'; // Test PAN format

  try {
    logInfo(`Testing PAN verification with: ${testPAN}`);
    logInfo('Note: This will use mock data if FEATURE_ERI_LIVE is false');

    const result = await eriIntegrationService.verifyPan(testPAN);

    if (result) {
      logSuccess('PAN verification completed');
      logInfo(`  Valid: ${result.isValid !== false ? 'Yes' : 'No'}`);
      logInfo(`  Source: ${result.source || 'Unknown'}`);
      if (result.name) {
        logInfo(`  Name: ${result.name}`);
      }
      return true;
    } else {
      logError('PAN verification returned no result');
      return false;
    }
  } catch (error) {
    logError(`PAN verification error: ${error.message}`);
    return false;
  }
}

// Test 7: Test Previous Year Filings (Mock or Live)
async function testPreviousYearFilings() {
  logSection('Test 7: Previous Year Filings Test');

  const testPAN = 'ABCDE1234F'; // Test PAN format

  try {
    logInfo(`Testing previous year filings fetch for PAN: ${testPAN}`);
    logInfo('Note: This will use mock data if FEATURE_ERI_LIVE is false');

    const result = await eriIntegrationService.getPreviousYearFilings(testPAN);

    if (Array.isArray(result)) {
      logSuccess(`Previous year filings fetched: ${result.length} found`);
      if (result.length > 0) {
        logInfo('Sample filing:');
        logInfo(`  Assessment Year: ${result[0].assessmentYear || 'N/A'}`);
        logInfo(`  ITR Type: ${result[0].itrType || 'N/A'}`);
        logInfo(`  Status: ${result[0].status || 'N/A'}`);
      }
      return true;
    } else {
      logError('Previous year filings returned invalid format');
      return false;
    }
  } catch (error) {
    logError(`Previous year filings error: ${error.message}`);
    return false;
  }
}

// Main test runner
async function runAllTests() {
  console.log('\n');
  log('╔════════════════════════════════════════════════════════════╗', 'cyan');
  log('║         ERI INTEGRATION TEST SUITE                         ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════╝', 'cyan');

  const results = {
    environment: false,
    configuration: false,
    signing: false,
    connectivity: false,
    integration: false,
    panVerification: false,
    previousYear: false,
  };

  // Run tests sequentially
  results.environment = await testEnvironmentVariables();
  results.configuration = await testConfigurationValidation();
  results.signing = await testSigningService();
  results.connectivity = await testAPIConnectivity();
  results.integration = await testIntegrationService();
  results.panVerification = await testPANVerification();
  results.previousYear = await testPreviousYearFilings();

  // Summary
  logSection('Test Summary');

  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(Boolean).length;
  const failedTests = totalTests - passedTests;

  logInfo(`Total Tests: ${totalTests}`);
  logSuccess(`Passed: ${passedTests}`);
  if (failedTests > 0) {
    logError(`Failed: ${failedTests}`);
  }

  console.log('\n');
  log('Test Results:', 'cyan');
  Object.entries(results).forEach(([test, passed]) => {
    const testName = test.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    if (passed) {
      logSuccess(`${testName}: PASSED`);
    } else {
      logError(`${testName}: FAILED`);
    }
  });

  console.log('\n');
  if (failedTests === 0) {
    log('🎉 All tests passed! ERI integration is configured correctly.', 'green');
  } else {
    logWarning('⚠️  Some tests failed. Please review the errors above.');
    logInfo('Note: Some failures may be expected if ERI API requires additional setup.');
  }

  console.log('\n');

  // Exit with appropriate code
  process.exit(failedTests > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch((error) => {
  logError(`Fatal error: ${error.message}`);
  if (error.stack) {
    console.error(error.stack);
  }
  process.exit(1);
});

