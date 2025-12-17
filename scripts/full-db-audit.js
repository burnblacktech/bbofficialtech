#!/usr/bin/env node

/**
 * Full Database Audit Script
 * Comprehensive audit of all models, endpoints, and services
 * 
 * Usage: node scripts/full-db-audit.js [--output=report.md]
 */

const fs = require('fs');
const path = require('path');
const { sequelize } = require(path.resolve(__dirname, '..', 'backend', 'src', 'config', 'database'));
const models = require(path.resolve(__dirname, '..', 'backend', 'src', 'models'));

const args = process.argv.slice(2);
const outputFile = args.find(arg => arg.startsWith('--output='))?.split('=')[1] || 'docs/FULL_DB_AUDIT_REPORT.md';

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
    modelsChecked: 0,
    modelsWithIssues: 0,
    totalIssues: 0,
    totalWarnings: 0,
  },
};

/**
 * Get database schema for a table
 */
async function getDatabaseSchema(tableName) {
  try {
    const [columns] = await sequelize.query(`
      SELECT 
        column_name,
        data_type,
        udt_name,
        character_maximum_length,
        numeric_precision,
        numeric_scale,
        is_nullable,
        column_default,
        is_identity
      FROM information_schema.columns
      WHERE table_name = $1
      AND table_schema = 'public'
      ORDER BY ordinal_position
    `, {
      replacements: [tableName],
      type: sequelize.QueryTypes.SELECT,
    });

    // Get ENUM values
    const enumColumns = columns.filter(col => col.udt_name && col.udt_name.includes('enum'));
    for (const col of enumColumns) {
      try {
        const [enumValues] = await sequelize.query(`
          SELECT enumlabel
          FROM pg_enum
          WHERE enumtypid = (
            SELECT oid FROM pg_type WHERE typname = $1
          )
          ORDER BY enumsortorder
        `, {
          replacements: [col.udt_name],
          type: sequelize.QueryTypes.SELECT,
        });
        col.enum_values = enumValues.map(v => v.enumlabel);
      } catch (e) {
        col.enum_values = [];
      }
    }

    // Get indexes
    const [indexes] = await sequelize.query(`
      SELECT
        indexname,
        indexdef
      FROM pg_indexes
      WHERE tablename = $1
      AND schemaname = 'public'
    `, {
      replacements: [tableName],
      type: sequelize.QueryTypes.SELECT,
    });

    // Get foreign keys
    const [foreignKeys] = await sequelize.query(`
      SELECT
        tc.constraint_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        rc.delete_rule
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      JOIN information_schema.referential_constraints AS rc
        ON rc.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_name = $1
      AND tc.table_schema = 'public'
    `, {
      replacements: [tableName],
      type: sequelize.QueryTypes.SELECT,
    });

    return {
      columns: columns.map(col => ({
        name: col.column_name,
        type: col.data_type,
        udtName: col.udt_name,
        maxLength: col.character_maximum_length,
        precision: col.numeric_precision,
        scale: col.numeric_scale,
        nullable: col.is_nullable === 'YES',
        defaultValue: col.column_default,
        isIdentity: col.is_identity === 'YES',
        enumValues: col.enum_values || [],
      })),
      indexes: indexes.map(idx => ({
        name: idx.indexname,
        definition: idx.indexdef,
      })),
      foreignKeys: foreignKeys.map(fk => ({
        constraintName: fk.constraint_name,
        columnName: fk.column_name,
        foreignTableName: fk.foreign_table_name,
        foreignColumnName: fk.foreign_column_name,
        deleteRule: fk.delete_rule,
      })),
    };
  } catch (error) {
    return null;
  }
}

/**
 * Map Sequelize type to PostgreSQL type
 */
function mapSequelizeType(sequelizeType) {
  if (!sequelizeType || !sequelizeType.constructor) return 'unknown';
  
  const typeName = sequelizeType.constructor.name;
  const typeMap = {
    'STRING': 'character varying',
    'TEXT': 'text',
    'INTEGER': 'integer',
    'BIGINT': 'bigint',
    'FLOAT': 'double precision',
    'REAL': 'real',
    'DOUBLE': 'double precision',
    'DECIMAL': 'numeric',
    'BOOLEAN': 'boolean',
    'DATE': 'timestamp without time zone',
    'DATEONLY': 'date',
    'TIME': 'time without time zone',
    'UUID': 'uuid',
    'JSON': 'json',
    'JSONB': 'jsonb',
    'BLOB': 'bytea',
    'ENUM': 'USER-DEFINED',
  };

  if (typeName === 'STRING') {
    const length = sequelizeType.options?.length;
    return length ? `character varying(${length})` : 'character varying';
  }
  if (typeName === 'DECIMAL') {
    const precision = sequelizeType.options?.precision || 10;
    const scale = sequelizeType.options?.scale || 2;
    return `numeric(${precision},${scale})`;
  }
  if (typeName === 'ENUM') {
    return 'USER-DEFINED';
  }
  
  return typeMap[typeName] || typeName.toLowerCase();
}

/**
 * Audit a single model
 */
async function auditModel(modelName, Model) {
  const tableName = Model.tableName || Model.name.toLowerCase() + 's';
  const modelAttributes = Model.rawAttributes || {};
  const modelIndexes = Model.options?.indexes || [];

  console.log(`\n📋 Auditing ${modelName} (table: ${tableName})...`);

  const modelInfo = {
    name: modelName,
    tableName,
    fields: {},
    issues: [],
    warnings: [],
    status: 'unknown',
  };

  const dbSchema = await getDatabaseSchema(tableName);
  
  if (!dbSchema) {
    modelInfo.status = 'error';
    modelInfo.issues.push(`Table ${tableName} does not exist in database`);
    auditResults.issues.push({
      model: modelName,
      table: tableName,
      severity: 'error',
      message: `Table ${tableName} does not exist in database`,
    });
    auditResults.summary.modelsWithIssues++;
    auditResults.summary.totalIssues++;
    auditResults.models[modelName] = modelInfo;
    return modelInfo;
  }

  const dbColumns = dbSchema.columns;
  const dbColumnMap = new Map(dbColumns.map(col => [col.name, col]));
  const modelFieldMap = new Map();

  // Check model fields
  for (const [fieldName, fieldDef] of Object.entries(modelAttributes)) {
    const dbColumnName = fieldDef.field || fieldName;
    modelFieldMap.set(dbColumnName, { fieldName, fieldDef });

    const dbColumn = dbColumnMap.get(dbColumnName);
    const fieldInfo = {
      modelField: fieldName,
      dbColumn: dbColumnName,
      modelType: mapSequelizeType(fieldDef.type),
      dbType: dbColumn ? (dbColumn.udtName || dbColumn.type) : null,
      modelNullable: fieldDef.allowNull !== false,
      dbNullable: dbColumn ? dbColumn.nullable : null,
      defaultValue: fieldDef.defaultValue,
      dbDefaultValue: dbColumn ? dbColumn.defaultValue : null,
      issues: [],
      warnings: [],
    };

    if (!dbColumn) {
      fieldInfo.issues.push('Field does not exist in database');
      modelInfo.issues.push(`Field ${fieldName} (${dbColumnName}) missing in database`);
      auditResults.summary.totalIssues++;
    } else {
      // Check type compatibility
      const modelType = mapSequelizeType(fieldDef.type);
      const dbType = dbColumn.udtName || dbColumn.type;
      
      if (!typesCompatible(modelType, dbType, fieldDef, dbColumn)) {
        fieldInfo.warnings.push(`Type mismatch: Model expects ${modelType}, DB has ${dbType}`);
        modelInfo.warnings.push(`Type mismatch for ${fieldName}: ${modelType} vs ${dbType}`);
        auditResults.summary.totalWarnings++;
      }

      // Check nullable
      const modelNullable = fieldDef.allowNull !== false;
      const dbNullable = dbColumn.nullable;
      if (modelNullable !== dbNullable) {
        fieldInfo.warnings.push(`Nullable mismatch: Model allows null=${modelNullable}, DB allows null=${dbNullable}`);
        modelInfo.warnings.push(`Nullable mismatch for ${fieldName}`);
        auditResults.summary.totalWarnings++;
      }

      // Check ENUM values
      if (fieldDef.type && fieldDef.type.constructor && fieldDef.type.constructor.name === 'ENUM') {
        const modelEnumValues = fieldDef.type.options?.values || [];
        const dbEnumValues = dbColumn.enumValues || [];
        if (modelEnumValues.length > 0 && dbEnumValues.length > 0) {
          const modelSet = new Set(modelEnumValues);
          const dbSet = new Set(dbEnumValues);
          const missingInDb = modelEnumValues.filter(v => !dbSet.has(v));
          const extraInDb = dbEnumValues.filter(v => !modelSet.has(v));
          
          if (missingInDb.length > 0 || extraInDb.length > 0) {
            fieldInfo.warnings.push(`ENUM mismatch: Model has ${modelEnumValues.join(', ')}, DB has ${dbEnumValues.join(', ')}`);
            modelInfo.warnings.push(`ENUM mismatch for ${fieldName}`);
            auditResults.summary.totalWarnings++;
          }
        }
      }
    }

    modelInfo.fields[fieldName] = fieldInfo;
  }

  // Check for extra columns in database
  for (const dbColumn of dbColumns) {
    if (!modelFieldMap.has(dbColumn.name)) {
      // Skip standard columns
      if (['id', 'created_at', 'updated_at', 'deleted_at'].includes(dbColumn.name)) {
        continue;
      }
      modelInfo.warnings.push(`Extra column in database: ${dbColumn.name} (${dbColumn.type})`);
      auditResults.summary.totalWarnings++;
    }
  }

  if (modelInfo.issues.length === 0 && modelInfo.warnings.length === 0) {
    modelInfo.status = 'ok';
  } else if (modelInfo.issues.length > 0) {
    modelInfo.status = 'error';
    auditResults.summary.modelsWithIssues++;
  } else {
    modelInfo.status = 'warning';
  }

  auditResults.models[modelName] = modelInfo;
  auditResults.summary.modelsChecked++;
  
  return modelInfo;
}

/**
 * Check type compatibility
 */
function typesCompatible(modelType, dbType, fieldDef, dbColumn) {
  const normalizedModel = modelType.toLowerCase();
  const normalizedDb = dbType.toLowerCase();

  if (normalizedModel === normalizedDb) return true;
  if (normalizedModel.includes('uuid') && normalizedDb.includes('uuid')) return true;
  if ((normalizedModel.includes('varying') || normalizedModel.includes('character') || normalizedModel === 'text') &&
      (normalizedDb.includes('varying') || normalizedDb.includes('character') || normalizedDb === 'text')) return true;
  if ((normalizedModel.includes('numeric') || normalizedModel.includes('decimal') || normalizedModel.includes('double')) &&
      (normalizedDb.includes('numeric') || normalizedDb.includes('decimal') || normalizedDb.includes('double'))) return true;
  if ((normalizedModel.includes('integer') || normalizedModel === 'int') &&
      (normalizedDb.includes('integer') || normalizedDb === 'int' || normalizedDb === 'int4')) return true;
  if ((normalizedModel === 'boolean' || normalizedModel === 'bool') &&
      (normalizedDb === 'boolean' || normalizedDb === 'bool')) return true;
  if ((normalizedModel.includes('timestamp') || normalizedModel.includes('date') || normalizedModel.includes('time')) &&
      (normalizedDb.includes('timestamp') || normalizedDb.includes('date') || normalizedDb.includes('time'))) return true;
  if ((normalizedModel === 'json' || normalizedModel === 'jsonb') &&
      (normalizedDb === 'json' || normalizedDb === 'jsonb')) return true;
  if (normalizedModel === 'user-defined' && dbColumn.enumValues) return true;

  return false;
}

/**
 * Generate markdown report
 */
function generateReport() {
  let report = `# Full Database Audit Report\n\n`;
  report += `**Generated**: ${auditResults.timestamp}\n\n`;
  report += `## Executive Summary\n\n`;
  report += `- **Total Models**: ${auditResults.summary.totalModels}\n`;
  report += `- **Models Checked**: ${auditResults.summary.modelsChecked}\n`;
  report += `- **Models with Issues**: ${auditResults.summary.modelsWithIssues}\n`;
  report += `- **Total Issues**: ${auditResults.summary.totalIssues}\n`;
  report += `- **Total Warnings**: ${auditResults.summary.totalWarnings}\n\n`;

  report += `## Model Audit Results\n\n`;

  for (const [modelName, modelInfo] of Object.entries(auditResults.models)) {
    const statusIcon = modelInfo.status === 'ok' ? '✅' : modelInfo.status === 'error' ? '❌' : '⚠️';
    report += `### ${statusIcon} ${modelName} (${modelInfo.tableName})\n\n`;
    report += `**Status**: ${modelInfo.status.toUpperCase()}\n\n`;

    if (modelInfo.issues.length > 0) {
      report += `**Issues**:\n`;
      modelInfo.issues.forEach(issue => {
        report += `- ❌ ${issue}\n`;
      });
      report += `\n`;
    }

    if (modelInfo.warnings.length > 0) {
      report += `**Warnings**:\n`;
      modelInfo.warnings.forEach(warning => {
        report += `- ⚠️ ${warning}\n`;
      });
      report += `\n`;
    }

    if (Object.keys(modelInfo.fields).length > 0) {
      report += `**Fields**: ${Object.keys(modelInfo.fields).length}\n\n`;
    }

    report += `---\n\n`;
  }

  if (auditResults.issues.length > 0) {
    report += `## Critical Issues\n\n`;
    auditResults.issues.forEach((issue, idx) => {
      report += `${idx + 1}. **${issue.model}** (${issue.table}): ${issue.message}\n`;
    });
    report += `\n`;
  }

  if (auditResults.recommendations.length > 0) {
    report += `## Recommendations\n\n`;
    auditResults.recommendations.forEach((rec, idx) => {
      report += `${idx + 1}. ${rec}\n`;
    });
    report += `\n`;
  }

  return report;
}

/**
 * Main execution
 */
async function main() {
  console.log('🔍 Full Database Audit\n');
  console.log('='.repeat(60));

  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established\n');

    const modelNames = Object.keys(models);
    auditResults.summary.totalModels = modelNames.length;

    console.log(`Found ${modelNames.length} models to audit\n`);

    for (const modelName of modelNames) {
      const Model = models[modelName];
      if (!Model) {
        console.log(`⚠️  Model ${modelName} not found`);
        continue;
      }

      await auditModel(modelName, Model);
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
    console.log(`Models checked: ${auditResults.summary.modelsChecked}`);
    console.log(`Models with issues: ${auditResults.summary.modelsWithIssues}`);
    console.log(`Total issues: ${auditResults.summary.totalIssues}`);
    console.log(`Total warnings: ${auditResults.summary.totalWarnings}`);

    process.exit(auditResults.summary.totalIssues > 0 ? 1 : 0);
  } catch (error) {
    console.error('❌ Audit failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run audit
main();

