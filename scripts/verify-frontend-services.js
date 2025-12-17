#!/usr/bin/env node

/**
 * Frontend Service Field Mapping Verification Script
 * Audits frontend services to verify field mappings are correct
 * 
 * Usage: node scripts/verify-frontend-services.js [--service=ServiceName]
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const specificService = args.find(arg => arg.startsWith('--service='))?.split('=')[1];

const results = {
  servicesChecked: 0,
  servicesWithIssues: 0,
  totalIssues: 0,
  issues: [],
  missingFields: [],
  fieldNameMismatches: [],
};

/**
 * Extract fields from service method
 */
function extractFieldsFromService(filePath, methodName) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Find the method
    const methodRegex = new RegExp(`(?:async\\s+)?${methodName}\\s*:\s*(?:async\\s*)?\\([^)]*\\)\\s*=>\\s*\\{([\\s\\S]*?)(?=\\n\\s*\\w+\\s*:|\\})`, 'm');
    const match = content.match(methodRegex);
    
    if (!match) return { sentFields: [], receivedFields: [] };

    const methodBody = match[1];
    const sentFields = [];
    const receivedFields = [];

    // Extract fields sent in requests (apiClient.post/put with data object)
    const sendRegex = /(?:apiClient|axios)\.(?:post|put|patch)\s*\([^,]+,\s*\{([^}]+)\}/g;
    let sendMatch;
    while ((sendMatch = sendRegex.exec(methodBody)) !== null) {
      const dataFields = sendMatch[1].match(/(\w+)\s*:/g);
      if (dataFields) {
        sentFields.push(...dataFields.map(f => f.replace(':', '').trim()));
      }
    }

    // Extract fields from object literals
    const objectRegex = /\{([^}]+)\}/g;
    let objectMatch;
    while ((objectMatch = objectRegex.exec(methodBody)) !== null) {
      const fields = objectMatch[1].match(/(\w+)\s*:/g);
      if (fields) {
        sentFields.push(...fields.map(f => f.replace(':', '').trim()));
      }
    }

    // Extract fields received from responses
    const receiveRegex = /(?:response|data)\.(?:data|result)?\.?(\w+)/g;
    let receiveMatch;
    while ((receiveMatch = receiveRegex.exec(methodBody)) !== null) {
      receivedFields.push(receiveMatch[1]);
    }

    return { 
      sentFields: [...new Set(sentFields)], 
      receivedFields: [...new Set(receivedFields)] 
    };
  } catch (error) {
    return { sentFields: [], receivedFields: [], error: error.message };
  }
}

/**
 * Verify service field mappings
 */
function verifyService(servicePath, serviceName) {
  console.log(`\n📋 Verifying ${serviceName}...`);

  try {
    const content = fs.readFileSync(servicePath, 'utf8');
    const issues = [];

    // Check for common field mapping issues
    const camelCaseRegex = /[a-z][A-Z]\w+/g;
    const snakeCaseRegex = /\w+_\w+/g;
    
    const camelCaseFields = content.match(camelCaseRegex) || [];
    const snakeCaseFields = content.match(snakeCaseRegex) || [];

    // Check for inconsistent naming
    if (camelCaseFields.length > 0 && snakeCaseFields.length > 0) {
      issues.push({
        type: 'naming_inconsistency',
        message: 'Mixed camelCase and snake_case field names detected',
      });
      results.fieldNameMismatches.push({
        service: serviceName,
        issue: 'Mixed naming conventions',
      });
    }

    // Extract API calls
    const apiCallRegex = /(?:apiClient|axios)\.(get|post|put|patch|delete)\s*\(['"]([^'"]+)['"]/g;
    const apiCalls = [];
    let apiMatch;
    while ((apiMatch = apiCallRegex.exec(content)) !== null) {
      apiCalls.push({
        method: apiMatch[1].toUpperCase(),
        path: apiMatch[2],
      });
    }

    // Check for error handling
    if (!content.includes('catch') && !content.includes('try')) {
      issues.push({
        type: 'missing_error_handling',
        message: 'No error handling found',
      });
    }

    // Check for field transformations
    const hasTransformations = content.includes('.map(') || 
                              content.includes('Object.keys') ||
                              content.includes('transform') ||
                              content.includes('normalize');

    if (issues.length > 0) {
      console.log(`  ⚠️  Found ${issues.length} issue(s):`);
      issues.forEach(issue => {
        console.log(`    - ${issue.message}`);
        results.issues.push({
          service: serviceName,
          severity: 'warning',
          ...issue,
        });
      });
      results.servicesWithIssues++;
      results.totalIssues += issues.length;
    } else {
      console.log(`  ✅ ${serviceName} looks good`);
    }

    results.servicesChecked++;
  } catch (error) {
    console.log(`  ❌ Error verifying ${serviceName}: ${error.message}`);
    results.servicesChecked++;
  }
}

/**
 * Scan service files
 */
function scanServices() {
  const servicesDir = path.join(__dirname, '..', 'frontend', 'src', 'services');
  const serviceFiles = [];

  function scanDirectory(dir, basePath = '') {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.join(basePath, entry.name);
      
      if (entry.isDirectory()) {
        scanDirectory(fullPath, relativePath);
      } else if (entry.isFile() && entry.name.endsWith('.js')) {
        serviceFiles.push({
          path: fullPath,
          name: entry.name.replace('.js', ''),
          relativePath: relativePath.replace('.js', ''),
        });
      }
    }
  }

  scanDirectory(servicesDir);
  return serviceFiles;
}

/**
 * Main execution
 */
function main() {
  console.log('🔍 Frontend Service Field Mapping Verification\n');
  console.log('='.repeat(60));

  const services = scanServices();
  const filteredServices = specificService
    ? services.filter(s => s.name.includes(specificService))
    : services;

  console.log(`Found ${filteredServices.length} service file(s) to verify\n`);

  for (const service of filteredServices) {
    verifyService(service.path, service.name);
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Verification Summary');
  console.log('='.repeat(60));
  console.log(`Services checked: ${results.servicesChecked}`);
  console.log(`Services with issues: ${results.servicesWithIssues}`);
  console.log(`Total issues: ${results.totalIssues}`);
  console.log(`  - Field name mismatches: ${results.fieldNameMismatches.length}`);

  if (results.issues.length > 0) {
    console.log('\n📋 Detailed Issues:');
    results.issues.forEach((issue, idx) => {
      console.log(`\n${idx + 1}. ${issue.service}`);
      console.log(`   Severity: ${issue.severity.toUpperCase()}`);
      console.log(`   ${issue.message}`);
    });
  }

  process.exit(results.totalIssues > 0 ? 1 : 0);
}

// Run verification
main();

