#!/usr/bin/env node

/**
 * API Endpoint Field Handling Verification Script
 * Audits API endpoints to verify they handle all model fields correctly
 * 
 * Usage: node scripts/verify-api-endpoints.js [--endpoint=path] [--model=ModelName]
 */

const fs = require('fs');
const path = require('path');
const models = require(path.join(__dirname, '..', 'backend', 'src', 'models'));

const args = process.argv.slice(2);
const specificEndpoint = args.find(arg => arg.startsWith('--endpoint='))?.split('=')[1];
const specificModel = args.find(arg => arg.startsWith('--model='))?.split('=')[1];

const results = {
  endpointsChecked: 0,
  endpointsWithIssues: 0,
  totalIssues: 0,
  issues: [],
  missingFieldHandling: [],
  missingValidation: [],
};

/**
 * Extract fields from controller method
 */
function extractFieldsFromController(filePath, methodName) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const methodRegex = new RegExp(`(async\\s+)?${methodName}\\s*\\([^)]*\\)\\s*\\{([\\s\\S]*?)(?=\\n\\s*(async\\s+)?\\w+\\s*\\(|\\})`, 'm');
    const match = content.match(methodRegex);
    
    if (!match) return { fields: [], validations: [] };

    const methodBody = match[2];
    const fields = [];
    const validations = [];

    // Extract field assignments (user.field = ... or user.fieldName = ...)
    const fieldAssignRegex = /(?:user|member|draft|filing|model)\.(\w+)\s*=/g;
    let fieldMatch;
    while ((fieldMatch = fieldAssignRegex.exec(methodBody)) !== null) {
      fields.push(fieldMatch[1]);
    }

    // Extract destructured fields from req.body
    const destructureRegex = /const\s*\{\s*([^}]+)\s*\}\s*=\s*req\.body/g;
    let destructureMatch;
    while ((destructureMatch = destructureRegex.exec(methodBody)) !== null) {
      const destructuredFields = destructureMatch[1].split(',').map(f => f.trim());
      fields.push(...destructuredFields);
    }

    // Extract validation checks
    const validationRegex = /(?:if\s*\(|validate|required|\.required\(|yup\.|\.oneOf\()/g;
    if (validationRegex.test(methodBody)) {
      validations.push('Has validation');
    }

    return { fields: [...new Set(fields)], validations };
  } catch (error) {
    return { fields: [], validations: [], error: error.message };
  }
}

/**
 * Get model fields
 */
function getModelFields(modelName) {
  const Model = models[modelName];
  if (!Model) return [];

  const attributes = Model.rawAttributes || {};
  return Object.keys(attributes).filter(field => {
    const attr = attributes[field];
    // Exclude auto-generated fields
    return !['id', 'createdAt', 'updatedAt', 'deletedAt'].includes(field) &&
           attr.field !== 'id' &&
           attr.field !== 'created_at' &&
           attr.field !== 'updated_at' &&
           attr.field !== 'deleted_at';
  });
}

/**
 * Verify endpoint handles model fields
 */
function verifyEndpoint(routePath, method, handler, modelName) {
  const Model = models[modelName];
  if (!Model) {
    console.log(`  ⚠️  Model ${modelName} not found`);
    return;
  }

  const modelFields = getModelFields(modelName);
  const handlerPath = typeof handler === 'string' ? handler : handler.toString();
  
  // Try to find controller file
  const controllerFiles = [
    path.join(__dirname, '..', 'backend', 'src', 'controllers', `${modelName}Controller.js`),
    path.join(__dirname, '..', 'backend', 'src', 'controllers', 'ITRController.js'),
    path.join(__dirname, '..', 'backend', 'src', 'controllers', 'UserController.js'),
    path.join(__dirname, '..', 'backend', 'src', 'controllers', 'MemberController.js'),
  ];

  let handledFields = [];
  let validations = [];

  for (const controllerFile of controllerFiles) {
    if (fs.existsSync(controllerFile)) {
      // Extract method name from handler
      const methodMatch = handlerPath.match(/(\w+)\.(\w+)/) || handlerPath.match(/(\w+)/);
      if (methodMatch) {
        const methodName = methodMatch[2] || methodMatch[1];
        const extracted = extractFieldsFromController(controllerFile, methodName);
        handledFields.push(...extracted.fields);
        validations.push(...extracted.validations);
      }
    }
  }

  handledFields = [...new Set(handledFields)];

  // Compare with model fields
  const missingFields = modelFields.filter(field => {
    const camelCase = field;
    const snakeCase = field.replace(/([A-Z])/g, '_$1').toLowerCase();
    return !handledFields.includes(camelCase) && 
           !handledFields.includes(snakeCase) &&
           !handledFields.includes(field);
  });

  if (missingFields.length > 0) {
    console.log(`  ⚠️  Missing field handling: ${missingFields.join(', ')}`);
    results.missingFieldHandling.push({
      endpoint: `${method} ${routePath}`,
      model: modelName,
      missingFields,
    });
    results.issues.push({
      endpoint: `${method} ${routePath}`,
      model: modelName,
      severity: 'warning',
      message: `Missing field handling: ${missingFields.join(', ')}`,
    });
    results.endpointsWithIssues++;
    results.totalIssues += missingFields.length;
  }

  if (validations.length === 0 && (method === 'POST' || method === 'PUT')) {
    console.log(`  ⚠️  No validation found`);
    results.missingValidation.push({
      endpoint: `${method} ${routePath}`,
      model: modelName,
    });
    results.issues.push({
      endpoint: `${method} ${routePath}`,
      model: modelName,
      severity: 'warning',
      message: 'No validation found',
    });
    results.endpointsWithIssues++;
    results.totalIssues++;
  }
}

/**
 * Scan route files for endpoints
 */
function scanRoutes() {
  const routesDir = path.join(__dirname, '..', 'backend', 'src', 'routes');
  const routeFiles = fs.readdirSync(routesDir).filter(f => f.endsWith('.js'));

  const endpoints = [];

  for (const file of routeFiles) {
    const filePath = path.join(routesDir, file);
    const content = fs.readFileSync(filePath, 'utf8');

    // Match router.METHOD('path', ...)
    const routeRegex = /router\.(get|post|put|patch|delete)\s*\(\s*['"]([^'"]+)['"]/g;
    let match;
    while ((match = routeRegex.exec(content)) !== null) {
      const method = match[1].toUpperCase();
      const routePath = match[2];

      // Determine model from route path
      let modelName = null;
      if (routePath.includes('/profile')) modelName = 'User';
      else if (routePath.includes('/draft')) modelName = 'ITRDraft';
      else if (routePath.includes('/filing')) modelName = 'ITRFiling';
      else if (routePath.includes('/member')) modelName = 'FamilyMember';
      else if (routePath.includes('/document')) modelName = 'Document';
      else if (routePath.includes('/ticket')) modelName = 'ServiceTicket';
      else if (routePath.includes('/invoice')) modelName = 'Invoice';
      else if (routePath.includes('/bank-account')) modelName = 'BankAccount';
      else if (routePath.includes('/ca-firm')) modelName = 'CAFirm';

      if (modelName) {
        endpoints.push({
          file,
          method,
          path: routePath,
          model: modelName,
        });
      }
    }
  }

  return endpoints;
}

/**
 * Main execution
 */
function main() {
  console.log('🔍 API Endpoint Field Handling Verification\n');
  console.log('='.repeat(60));

  const endpoints = scanRoutes();
  const filteredEndpoints = specificEndpoint 
    ? endpoints.filter(e => e.path.includes(specificEndpoint))
    : specificModel
    ? endpoints.filter(e => e.model === specificModel)
    : endpoints;

  console.log(`Found ${filteredEndpoints.length} endpoint(s) to verify\n`);

  for (const endpoint of filteredEndpoints) {
    console.log(`📋 ${endpoint.method} ${endpoint.path} (${endpoint.model})`);
    verifyEndpoint(endpoint.path, endpoint.method, null, endpoint.model);
    results.endpointsChecked++;
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Verification Summary');
  console.log('='.repeat(60));
  console.log(`Endpoints checked: ${results.endpointsChecked}`);
  console.log(`Endpoints with issues: ${results.endpointsWithIssues}`);
  console.log(`Total issues: ${results.totalIssues}`);
  console.log(`  - Missing field handling: ${results.missingFieldHandling.length}`);
  console.log(`  - Missing validation: ${results.missingValidation.length}`);

  if (results.issues.length > 0) {
    console.log('\n📋 Detailed Issues:');
    results.issues.forEach((issue, idx) => {
      console.log(`\n${idx + 1}. ${issue.endpoint} (${issue.model})`);
      console.log(`   Severity: ${issue.severity.toUpperCase()}`);
      console.log(`   ${issue.message}`);
    });
  }

  process.exit(results.totalIssues > 0 ? 1 : 0);
}

// Run verification
main();

