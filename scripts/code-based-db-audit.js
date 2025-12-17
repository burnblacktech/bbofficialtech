#!/usr/bin/env node

/**
 * Code-Based Database Audit
 * Comprehensive static analysis of models, endpoints, and services
 * Does not require database connection
 */

const fs = require('fs');
const path = require('path');
const models = require(path.resolve(__dirname, '..', 'backend', 'src', 'models'));

const args = process.argv.slice(2);
const outputFile = args.find(arg => arg.startsWith('--output='))?.split('=')[1] || 'docs/CODE_BASED_DB_AUDIT_REPORT.md';

const auditResults = {
  timestamp: new Date().toISOString(),
  models: {},
  endpoints: {},
  services: {},
  issues: [],
  warnings: [],
  recommendations: [],
  summary: {
    totalModels: 0,
    modelsAnalyzed: 0,
    totalFields: 0,
    totalEndpoints: 0,
    totalServices: 0,
  },
};

/**
 * Analyze a model
 */
function analyzeModel(modelName, Model) {
  const tableName = Model.tableName || Model.name.toLowerCase() + 's';
  const attributes = Model.rawAttributes || {};
  const indexes = Model.options?.indexes || [];
  const associations = Model.associations || {};

  const modelInfo = {
    name: modelName,
    tableName,
    fields: {},
    indexes: indexes.length,
    associations: Object.keys(associations).length,
    enums: [],
    foreignKeys: [],
    jsonbFields: [],
    issues: [],
    warnings: [],
  };

  // Analyze fields
  for (const [fieldName, fieldDef] of Object.entries(attributes)) {
    const dbColumnName = fieldDef.field || fieldName;
    
    const fieldInfo = {
      modelField: fieldName,
      dbColumn: dbColumnName,
      type: fieldDef.type?.constructor?.name || 'unknown',
      allowNull: fieldDef.allowNull !== false,
      defaultValue: fieldDef.defaultValue,
      unique: fieldDef.unique || false,
      primaryKey: fieldDef.primaryKey || false,
      references: fieldDef.references,
      validate: fieldDef.validate,
    };

    // Check for ENUM
    if (fieldDef.type && fieldDef.type.constructor && fieldDef.type.constructor.name === 'ENUM') {
      const enumValues = fieldDef.type.options?.values || [];
      modelInfo.enums.push({
        field: fieldName,
        values: enumValues,
      });
      fieldInfo.enumValues = enumValues;
    }

    // Check for JSONB
    if (fieldDef.type && fieldDef.type.constructor && fieldDef.type.constructor.name === 'JSONB') {
      modelInfo.jsonbFields.push(fieldName);
    }

    // Check for foreign keys
    if (fieldDef.references) {
      modelInfo.foreignKeys.push({
        field: fieldName,
        model: fieldDef.references.model,
        key: fieldDef.references.key,
      });
    }

    modelInfo.fields[fieldName] = fieldInfo;
    auditResults.summary.totalFields++;
  }

  auditResults.models[modelName] = modelInfo;
  auditResults.summary.modelsAnalyzed++;
  
  return modelInfo;
}

/**
 * Scan route files for endpoints
 */
function scanEndpoints() {
  const routesDir = path.resolve(__dirname, '..', 'backend', 'src', 'routes');
  const endpoints = [];

  function scanFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const routeRegex = /router\.(get|post|put|patch|delete)\s*\(\s*['"]([^'"]+)['"]/g;
      let match;
      while ((match = routeRegex.exec(content)) !== null) {
        endpoints.push({
          method: match[1].toUpperCase(),
          path: match[2],
          file: path.basename(filePath),
        });
      }
    } catch (error) {
      // Skip files that can't be read
    }
  }

  function scanDirectory(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanDirectory(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.js')) {
        scanFile(fullPath);
      }
    }
  }

  scanDirectory(routesDir);
  auditResults.summary.totalEndpoints = endpoints.length;
  return endpoints;
}

/**
 * Scan frontend services
 */
function scanServices() {
  const servicesDir = path.resolve(__dirname, '..', 'frontend', 'src', 'services');
  const services = [];

  function scanFile(filePath, basePath = '') {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const relativePath = path.relative(servicesDir, filePath).replace(/\\/g, '/');
      services.push({
        name: path.basename(filePath, '.js'),
        path: relativePath,
        hasApiCalls: /(apiClient|axios)\.(get|post|put|patch|delete)/.test(content),
        hasErrorHandling: /(catch|try|errorHandler)/.test(content),
      });
    } catch (error) {
      // Skip files that can't be read
    }
  }

  function scanDirectory(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanDirectory(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.js')) {
        scanFile(fullPath);
      }
    }
  }

  scanDirectory(servicesDir);
  auditResults.summary.totalServices = services.length;
  return services;
}

/**
 * Generate comprehensive report
 */
function generateReport() {
  let report = `# Code-Based Database Audit Report\n\n`;
  report += `**Generated**: ${auditResults.timestamp}\n\n`;
  report += `**Note**: This is a static code analysis. For database schema verification, run migrations and use \`scripts/full-db-audit.js\`\n\n`;

  report += `## Executive Summary\n\n`;
  report += `- **Total Models**: ${auditResults.summary.totalModels}\n`;
  report += `- **Models Analyzed**: ${auditResults.summary.modelsAnalyzed}\n`;
  report += `- **Total Fields**: ${auditResults.summary.totalFields}\n`;
  report += `- **Total Endpoints**: ${auditResults.summary.totalEndpoints}\n`;
  report += `- **Total Services**: ${auditResults.summary.totalServices}\n\n`;

  report += `## Model Analysis\n\n`;

  // Group models by status
  const modelsByCategory = {
    core: ['User', 'UserProfile', 'UserSession', 'FamilyMember'],
    itr: ['ITRFiling', 'ITRDraft', 'ITRVProcessing', 'ReturnVersion'],
    documents: ['Document', 'DocumentTemplate'],
    support: ['ServiceTicket', 'ServiceTicketMessage', 'HelpArticle'],
    financial: ['Invoice', 'TaxPayment', 'TaxDemand', 'RefundTracking', 'BankAccount'],
    ca: ['CAFirm', 'CABooking', 'CAMarketplaceInquiry', 'CAFirmReview', 'Assignment'],
    system: ['AuditLog', 'Notification', 'PlatformSettings', 'UserSegment'],
    auth: ['PasswordResetToken', 'AccountLinkingToken', 'Invite', 'Consent'],
    other: [],
  };

  // Categorize models
  for (const modelName of Object.keys(auditResults.models)) {
    let categorized = false;
    for (const [category, modelList] of Object.entries(modelsByCategory)) {
      if (modelList.includes(modelName)) {
        categorized = true;
        break;
      }
    }
    if (!categorized) {
      modelsByCategory.other.push(modelName);
    }
  }

  // Report by category
  for (const [category, modelList] of Object.entries(modelsByCategory)) {
    if (modelList.length === 0) continue;

    report += `### ${category.toUpperCase()} Models\n\n`;
    for (const modelName of modelList) {
      const modelInfo = auditResults.models[modelName];
      if (!modelInfo) continue;

      report += `#### ${modelName} (${modelInfo.tableName})\n\n`;
      report += `- **Fields**: ${Object.keys(modelInfo.fields).length}\n`;
      report += `- **Indexes**: ${modelInfo.indexes}\n`;
      report += `- **Foreign Keys**: ${modelInfo.foreignKeys.length}\n`;
      report += `- **ENUMs**: ${modelInfo.enums.length}\n`;
      report += `- **JSONB Fields**: ${modelInfo.jsonbFields.length}\n\n`;

      if (modelInfo.enums.length > 0) {
        report += `**ENUM Values**:\n`;
        modelInfo.enums.forEach(enumInfo => {
          report += `- \`${enumInfo.field}\`: ${enumInfo.values.join(', ')}\n`;
        });
        report += `\n`;
      }

      if (modelInfo.foreignKeys.length > 0) {
        report += `**Foreign Keys**:\n`;
        modelInfo.foreignKeys.forEach(fk => {
          report += `- \`${fk.field}\` → ${fk.model}.${fk.key}\n`;
        });
        report += `\n`;
      }

      if (modelInfo.jsonbFields.length > 0) {
        report += `**JSONB Fields**: ${modelInfo.jsonbFields.join(', ')}\n\n`;
      }
    }
    report += `---\n\n`;
  }

  // Endpoints summary
  const endpoints = scanEndpoints();
  report += `## API Endpoints Summary\n\n`;
  report += `Total endpoints found: ${endpoints.length}\n\n`;
  
  const endpointsByMethod = {};
  endpoints.forEach(ep => {
    if (!endpointsByMethod[ep.method]) {
      endpointsByMethod[ep.method] = [];
    }
    endpointsByMethod[ep.method].push(ep);
  });

  for (const [method, methodEndpoints] of Object.entries(endpointsByMethod)) {
    report += `### ${method} (${methodEndpoints.length})\n\n`;
    methodEndpoints.slice(0, 20).forEach(ep => {
      report += `- \`${ep.method} ${ep.path}\` (${ep.file})\n`;
    });
    if (methodEndpoints.length > 20) {
      report += `- ... and ${methodEndpoints.length - 20} more\n`;
    }
    report += `\n`;
  }

  // Services summary
  const services = scanServices();
  report += `## Frontend Services Summary\n\n`;
  report += `Total services found: ${services.length}\n\n`;
  
  services.slice(0, 30).forEach(svc => {
    const apiIcon = svc.hasApiCalls ? '✅' : '⚠️';
    const errorIcon = svc.hasErrorHandling ? '✅' : '⚠️';
    report += `- ${apiIcon}${errorIcon} \`${svc.path}\`\n`;
  });
  if (services.length > 30) {
    report += `- ... and ${services.length - 30} more\n`;
  }
  report += `\n`;

  // ENUM consistency check
  report += `## ENUM Consistency Analysis\n\n`;
  const enumMap = {};
  for (const [modelName, modelInfo] of Object.entries(auditResults.models)) {
    modelInfo.enums.forEach(enumInfo => {
      const key = `${enumInfo.field}:${enumInfo.values.join(',')}`;
      if (!enumMap[key]) {
        enumMap[key] = [];
      }
      enumMap[key].push(modelName);
    });
  }

  for (const [enumDef, models] of Object.entries(enumMap)) {
    if (models.length > 1) {
      report += `✅ Consistent ENUM \`${enumDef}\` used in: ${models.join(', ')}\n`;
    } else {
      report += `ℹ️  ENUM \`${enumDef}\` used in: ${models.join(', ')}\n`;
    }
  }
  report += `\n`;

  // Recommendations
  report += `## Recommendations\n\n`;
  report += `1. Run database migrations to create all tables\n`;
  report += `2. Run \`scripts/full-db-audit.js\` after migrations to verify schema\n`;
  report += `3. Review ENUM value consistency (e.g., User.gender vs FamilyMember.gender)\n`;
  report += `4. Verify all foreign key relationships exist in database\n`;
  report += `5. Check that all indexes are created for performance\n`;
  report += `6. Validate JSONB field structures match expected schemas\n`;

  return report;
}

/**
 * Main execution
 */
function main() {
  console.log('🔍 Code-Based Database Audit\n');
  console.log('='.repeat(60));

  const modelNames = Object.keys(models);
  auditResults.summary.totalModels = modelNames.length;

  console.log(`Found ${modelNames.length} models to analyze\n`);

  for (const modelName of modelNames) {
    const Model = models[modelName];
    if (!Model) {
      console.log(`⚠️  Model ${modelName} not found`);
      continue;
    }

    console.log(`📋 Analyzing ${modelName}...`);
    analyzeModel(modelName, Model);
  }

  // Generate report
  const report = generateReport();
  
  // Write report
  const reportPath = path.resolve(__dirname, '..', outputFile);
  fs.writeFileSync(reportPath, report, 'utf8');
  console.log(`\n✅ Audit report written to: ${outputFile}`);

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Audit Summary');
  console.log('='.repeat(60));
  console.log(`Models analyzed: ${auditResults.summary.modelsAnalyzed}`);
  console.log(`Total fields: ${auditResults.summary.totalFields}`);
  console.log(`Total endpoints: ${auditResults.summary.totalEndpoints}`);
  console.log(`Total services: ${auditResults.summary.totalServices}`);
}

// Run audit
main();

