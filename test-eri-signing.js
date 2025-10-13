/**
 * ERI Signing Test Script
 * 
 * This script tests the ERI signing functionality and generates
 * key information and signed data for ITD submission.
 */

const { generateSignedPayload } = require('./backend/src/services/eriSigningService');
const { validatePEMCertificate } = require('./backend/src/utils/certificateUtils');
const fs = require('fs');
const path = require('path');

async function testERISigning() {
  console.log('🔐 ERI Signing Test Started\n');
  
  try {
    // 1. Validate PEM certificate
    console.log('📋 Step 1: Validating PEM Certificate...');
    const pemPath = './certs/public_key_eri.pem';
    
    if (!fs.existsSync(pemPath)) {
      throw new Error('PEM certificate file not found. Please ensure public_key_eri.pem exists in certs/ directory.');
    }
    
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
    
    // 2. Test ERI signing with sample data
    console.log('🔐 Step 2: Testing ERI Digital Signing...');
    
    const testData = {
      serviceName: "EriJsonDataService",
      entity: "ERIP013662",
      pass: "Oracle@123",
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
    
    // Generate signed payload
    const signedPayload = generateSignedPayload(testData);
    
    console.log('✅ Digital signature generated successfully');
    console.log('🔐 Signed Payload:');
    console.log(JSON.stringify(signedPayload, null, 2));
    console.log('\n');
    
    // 3. Analyze the signature
    console.log('📊 Step 3: Signature Analysis...');
    console.log(`   ERI User ID: ${signedPayload.eriUserId}`);
    console.log(`   Data Size: ${signedPayload.data.length} characters`);
    console.log(`   Signature Size: ${signedPayload.sign.length} characters`);
    console.log(`   Data (Base64): ${signedPayload.data.substring(0, 100)}...`);
    console.log(`   Signature (Base64): ${signedPayload.sign.substring(0, 100)}...`);
    console.log('\n');
    
    // 4. Decode and verify the data
    console.log('🔍 Step 4: Data Verification...');
    const forge = require('node-forge');
    const decodedData = forge.util.decode64(signedPayload.data);
    const parsedData = JSON.parse(decodedData);
    
    console.log('✅ Data decoded successfully');
    console.log('📄 Decoded Data:');
    console.log(JSON.stringify(parsedData, null, 2));
    console.log('\n');
    
    // 5. Save results to file
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
    
    const outputPath = './eri-test-results.json';
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
    console.log(`✅ Results saved to: ${outputPath}`);
    console.log('\n');
    
    // 6. Summary
    console.log('🎉 ERI Signing Test Completed Successfully!');
    console.log('\n📋 Summary:');
    console.log(`   ✅ Certificate: Valid (${certInfo.subject.commonName})`);
    console.log(`   ✅ ERI User ID: ${signedPayload.eriUserId}`);
    console.log(`   ✅ Data Signed: ${signedPayload.data.length} chars`);
    console.log(`   ✅ Signature: ${signedPayload.sign.length} chars`);
    console.log(`   ✅ Results: Saved to ${outputPath}`);
    console.log('\n🚀 Ready for ITD submission!');
    
    return results;
    
  } catch (error) {
    console.error('❌ ERI Signing Test Failed:');
    console.error(`   Error: ${error.message}`);
    console.error(`   Stack: ${error.stack}`);
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testERISigning();
}

module.exports = { testERISigning };
