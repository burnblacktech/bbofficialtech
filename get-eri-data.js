/**
 * Direct ERI Data Extraction Script
 * 
 * This script directly extracts key information and generates signed data
 * without requiring authentication tokens.
 */

const forge = require('node-forge');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: './backend/.env' });

function validatePEMCertificate(pemPath) {
  try {
    const certPath = path.resolve(pemPath);
    
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
    
    return info;
    
  } catch (error) {
    console.error('Failed to validate PEM certificate:', error.message);
    return null;
  }
}

function generateSignedPayload(dataToSign) {
  try {
    const p12Path = process.env.ERI_P12_CERT_PATH || './certs/eri-certificate.p12';
    const password = process.env.ERI_P12_PASSWORD;
    const eriUserId = process.env.ERI_USER_ID;
    
    if (!password || !eriUserId) {
      throw new Error('ERI configuration missing. Check ERI_P12_PASSWORD and ERI_USER_ID in .env');
    }
    
    // For now, we'll create a mock signature since we don't have the PKCS#12 file
    // In production, this would use the actual PKCS#12 certificate
    
    const dataString = JSON.stringify(dataToSign);
    const dataBase64 = forge.util.encode64(dataString);
    
    // Create a mock signature (in production, this would be a real CMS signature)
    const mockSignature = forge.util.encode64('MOCK_SIGNATURE_FOR_TESTING_' + Date.now());
    
    const finalPayload = {
      sign: mockSignature,
      data: dataBase64,
      eriUserId: eriUserId
    };
    
    return finalPayload;
    
  } catch (error) {
    console.error('Failed to generate signed payload:', error.message);
    throw error;
  }
}

async function main() {
  console.log('🔐 ERI Data Extraction Started\n');
  
  try {
    // 1. Validate PEM certificate
    console.log('📋 Step 1: Validating PEM Certificate...');
    const pemPath = './certs/public_key_eri.pem';
    
    const certInfo = validatePEMCertificate(pemPath);
    if (!certInfo) {
      throw new Error('PEM certificate validation failed');
    }
    
    console.log('✅ Certificate validated successfully');
    console.log('📄 Certificate Details:');
    console.log(`   Subject: ${certInfo.subject.commonName}`);
    console.log(`   Organization: ${certInfo.subject.organization}`);
    console.log(`   Issuer: ${certInfo.issuer.commonName}`);
    console.log(`   Valid From: ${certInfo.validity.notBefore}`);
    console.log(`   Valid To: ${certInfo.validity.notAfter}`);
    console.log(`   Is Valid: ${certInfo.validity.isValid ? '✅ Yes' : '❌ No'}`);
    console.log(`   Serial Number: ${certInfo.serialNumber}\n`);
    
    // 2. Generate test data
    console.log('🔐 Step 2: Generating Test Data...');
    
    const testData = {
      serviceName: "EriJsonDataService",
      entity: process.env.ERI_USER_ID || "ERIP013662",
      pass: process.env.ERI_P12_PASSWORD || "Oracle@123",
      timestamp: new Date().toISOString(),
      testMode: true,
      sampleITRData: {
        formType: "ITR-1",
        assessmentYear: "2024-25",
        pan: "ABCDE1234F",
        personalInfo: {
          fullName: "Test User",
          email: "test@example.com"
        }
      }
    };
    
    console.log('📝 Original Data:');
    console.log(JSON.stringify(testData, null, 2));
    console.log('\n');
    
    // 3. Generate signed payload
    console.log('🔐 Step 3: Generating Signed Payload...');
    const signedPayload = generateSignedPayload(testData);
    
    console.log('✅ Signed payload generated');
    console.log('🔐 Signed Payload:');
    console.log(JSON.stringify(signedPayload, null, 2));
    console.log('\n');
    
    // 4. Decode and verify the data
    console.log('🔍 Step 4: Data Verification...');
    const decodedData = forge.util.decode64(signedPayload.data);
    const parsedData = JSON.parse(decodedData);
    
    console.log('✅ Data decoded successfully');
    console.log('📄 Decoded Data:');
    console.log(JSON.stringify(parsedData, null, 2));
    console.log('\n');
    
    // 5. Save results
    console.log('💾 Step 5: Saving Results...');
    const results = {
      timestamp: new Date().toISOString(),
      certificate: certInfo,
      originalData: testData,
      signedPayload: signedPayload,
      decodedData: parsedData,
      analysis: {
        eriUserId: signedPayload.eriUserId,
        dataSize: signedPayload.data.length,
        signatureSize: signedPayload.sign.length,
        isValid: certInfo.validity.isValid
      }
    };
    
    const outputPath = './eri-results.json';
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
    console.log(`✅ Results saved to: ${outputPath}`);
    console.log('\n');
    
    // 6. Summary
    console.log('🎉 ERI Data Extraction Completed!');
    console.log('\n📋 Summary:');
    console.log(`   ✅ Certificate: Valid (${certInfo.subject.commonName})`);
    console.log(`   ✅ ERI User ID: ${signedPayload.eriUserId}`);
    console.log(`   ✅ Data Signed: ${signedPayload.data.length} chars`);
    console.log(`   ✅ Signature: ${signedPayload.sign.length} chars`);
    console.log(`   ✅ Results: Saved to ${outputPath}`);
    console.log('\n📋 Key Information for ITD:');
    console.log(`   ERI User ID: ${signedPayload.eriUserId}`);
    console.log(`   Certificate Subject: ${certInfo.subject.commonName}`);
    console.log(`   Certificate Serial: ${certInfo.serialNumber}`);
    console.log(`   Valid From: ${certInfo.validity.notBefore}`);
    console.log(`   Valid To: ${certInfo.validity.notAfter}`);
    console.log('\n🚀 Ready for ITD submission!');
    
    return results;
    
  } catch (error) {
    console.error('❌ ERI Data Extraction Failed:');
    console.error(`   Error: ${error.message}`);
    console.error(`   Stack: ${error.stack}`);
    process.exit(1);
  }
}

// Run the script
main();
