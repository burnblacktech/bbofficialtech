#!/usr/bin/env node

/**
 * Database Schema Verification Script
 * Compares Sequelize model definitions with actual database schema
 * 
 * Usage: node scripts/verify-db-schema.js [--model=ModelName] [--fix]
 */

const path = require('path');
// Adjust path based on script location - scripts are in root/scripts
const backendPath = path.resolve(__dirname, '..', 'backend', 'src');
process.chdir(path.resolve(__dirname, '..')); // Change to project root
const { sequelize } = require(backendPath + '/config/database');
const enterpriseLogger = require(backendPath + '/utils/logger');
const models = require(backendPath + '/models');

const args = process.argv.slice(2);
const specificModel = args.find(arg => arg.startsWith('--model='))?.split('=')[1];
const shouldFix = args.includes('--fix');

const results = {
  modelsChecked: 0,
  modelsWithIssues: 0,
  totalIssues: 0,
  issues: [],
  missingFields: [],
  extraFields: [],
  typeMismatches: [],
  constraintMismatches: [],
};

/**
 * Map Sequelize data types to PostgreSQL types
 */
function mapSequelizeToPostgres(sequelizeType) {
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

  if (sequelizeType && sequelizeType.constructor) {
    const typeName = sequelizeType.constructor.name;
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

  return sequelizeType?.toString() || 'unknown';
}

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

    // Get ENUM values if any
    const enumColumns = columns.filter(col => col.udt_name && col.udt_name.includes('enum'));
    for (const col of enumColumns) {
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
        enumValues: col.enum_values,
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
    enterpriseLogger.error(`Failed to get database schema for ${tableName}`, {
      error: error.message,
    });
    return null;
  }
}

/**
 * Compare model with database schema
 */
async function verifyModel(modelName, Model) {
  const tableName = Model.tableName || Model.name.toLowerCase() + 's';
  const modelAttributes = Model.rawAttributes || {};
  const modelIndexes = Model.options?.indexes || [];
  const modelAssociations = Model.associations || {};

  console.log(`\n📋 Verifying ${modelName} (table: ${tableName})...`);

  const dbSchema = await getDatabaseSchema(tableName);
  if (!dbSchema) {
    results.issues.push({
      model: modelName,
      table: tableName,
      severity: 'error',
      message: `Table ${tableName} does not exist in database`,
    });
    results.modelsWithIssues++;
    results.totalIssues++;
    return;
  }

  const dbColumns = dbSchema.columns;
  const dbColumnMap = new Map(dbColumns.map(col => [col.name, col]));
  const modelFieldMap = new Map();

  let modelIssues = [];

  // Check model fields exist in database
  for (const [fieldName, fieldDef] of Object.entries(modelAttributes)) {
    const dbColumnName = fieldDef.field || fieldName;
    modelFieldMap.set(dbColumnName, { fieldName, fieldDef });

    const dbColumn = dbColumnMap.get(dbColumnName);
    if (!dbColumn) {
      modelIssues.push({
        type: 'missing_column',
        field: fieldName,
        dbColumn: dbColumnName,
        message: `Model field ${fieldName} (${dbColumnName}) does not exist in database`,
      });
      results.missingFields.push({
        model: modelName,
        table: tableName,
        field: fieldName,
        dbColumn: dbColumnName,
        type: mapSequelizeToPostgres(fieldDef.type),
      });
    } else {
      // Check type compatibility
      const modelType = mapSequelizeToPostgres(fieldDef.type);
      const dbType = dbColumn.udtName || dbColumn.type;
      
      if (!typesCompatible(modelType, dbType, fieldDef, dbColumn)) {
        modelIssues.push({
          type: 'type_mismatch',
          field: fieldName,
          dbColumn: dbColumnName,
          modelType: modelType,
          dbType: dbType,
          message: `Type mismatch: Model expects ${modelType}, DB has ${dbType}`,
        });
        results.typeMismatches.push({
          model: modelName,
          table: tableName,
          field: fieldName,
          modelType: modelType,
          dbType: dbType,
        });
      }

      // Check nullable constraint
      const modelNullable = fieldDef.allowNull !== false;
      const dbNullable = dbColumn.nullable;
      if (modelNullable !== dbNullable) {
        modelIssues.push({
          type: 'nullable_mismatch',
          field: fieldName,
          dbColumn: dbColumnName,
          modelNullable: modelNullable,
          dbNullable: dbNullable,
          message: `Nullable mismatch: Model allows null=${modelNullable}, DB allows null=${dbNullable}`,
        });
        results.constraintMismatches.push({
          model: modelName,
          table: tableName,
          field: fieldName,
          modelNullable: modelNullable,
          dbNullable: dbNullable,
        });
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
            modelIssues.push({
              type: 'enum_mismatch',
              field: fieldName,
              dbColumn: dbColumnName,
              modelValues: modelEnumValues,
              dbValues: dbEnumValues,
              missingInDb,
              extraInDb,
              message: `ENUM values mismatch: Model has ${modelEnumValues.join(', ')}, DB has ${dbEnumValues.join(', ')}`,
            });
          }
        }
      }
    }
  }

  // Check for extra columns in database
  for (const dbColumn of dbColumns) {
    if (!modelFieldMap.has(dbColumn.name)) {
      // Skip standard columns
      if (['id', 'created_at', 'updated_at', 'deleted_at'].includes(dbColumn.name)) {
        continue;
      }
      modelIssues.push({
        type: 'extra_column',
        dbColumn: dbColumn.name,
        message: `Database column ${dbColumn.name} does not have corresponding model field`,
      });
      results.extraFields.push({
        model: modelName,
        table: tableName,
        dbColumn: dbColumn.name,
        dbType: dbColumn.type,
      });
    }
  }

  if (modelIssues.length > 0) {
    console.log(`  ⚠️  Found ${modelIssues.length} issue(s):`);
    modelIssues.forEach(issue => {
      console.log(`    - ${issue.message}`);
      results.issues.push({
        model: modelName,
        table: tableName,
        severity: issue.type === 'missing_column' ? 'error' : 'warning',
        ...issue,
      });
    });
    results.modelsWithIssues++;
    results.totalIssues += modelIssues.length;
  } else {
    console.log(`  ✅ ${modelName} schema matches database`);
  }

  results.modelsChecked++;
}

/**
 * Check if types are compatible
 */
function typesCompatible(modelType, dbType, fieldDef, dbColumn) {
  // Normalize types
  const normalizedModel = modelType.toLowerCase();
  const normalizedDb = dbType.toLowerCase();

  // Direct match
  if (normalizedModel === normalizedDb) return true;

  // UUID variations
  if ((normalizedModel.includes('uuid') || normalizedModel === 'uuid') &&
      (normalizedDb.includes('uuid') || normalizedDb === 'uuid')) return true;

  // String variations
  if ((normalizedModel.includes('varying') || normalizedModel.includes('character') || normalizedModel === 'text') &&
      (normalizedDb.includes('varying') || normalizedDb.includes('character') || normalizedDb === 'text')) {
    // Check length if specified
    if (fieldDef.type && fieldDef.type.options && fieldDef.type.options.length) {
      return dbColumn.maxLength === null || dbColumn.maxLength >= fieldDef.type.options.length;
    }
    return true;
  }

  // Numeric variations
  if ((normalizedModel.includes('numeric') || normalizedModel.includes('decimal') || normalizedModel.includes('double')) &&
      (normalizedDb.includes('numeric') || normalizedDb.includes('decimal') || normalizedDb.includes('double'))) {
    return true;
  }

  // Integer variations
  if ((normalizedModel.includes('integer') || normalizedModel === 'int') &&
      (normalizedDb.includes('integer') || normalizedDb === 'int' || normalizedDb === 'int4')) return true;

  // Boolean variations
  if ((normalizedModel === 'boolean' || normalizedModel === 'bool') &&
      (normalizedDb === 'boolean' || normalizedDb === 'bool')) return true;

  // Date variations
  if ((normalizedModel.includes('timestamp') || normalizedModel.includes('date') || normalizedModel.includes('time')) &&
      (normalizedDb.includes('timestamp') || normalizedDb.includes('date') || normalizedDb.includes('time'))) return true;

  // JSON variations
  if ((normalizedModel === 'json' || normalizedModel === 'jsonb') &&
      (normalizedDb === 'json' || normalizedDb === 'jsonb')) return true;

  // ENUM
  if (normalizedModel === 'user-defined' && dbColumn.enumValues) return true;

  return false;
}

/**
 * Main execution
 */
async function main() {
  console.log('🔍 Database Schema Verification\n');
  console.log('='.repeat(60));

  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established\n');

    const modelNames = specificModel ? [specificModel] : Object.keys(models);

    for (const modelName of modelNames) {
      const Model = models[modelName];
      if (!Model) {
        console.log(`⚠️  Model ${modelName} not found in models index`);
        continue;
      }

      await verifyModel(modelName, Model);
    }

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Verification Summary');
    console.log('='.repeat(60));
    console.log(`Models checked: ${results.modelsChecked}`);
    console.log(`Models with issues: ${results.modelsWithIssues}`);
    console.log(`Total issues: ${results.totalIssues}`);
    console.log(`  - Missing fields: ${results.missingFields.length}`);
    console.log(`  - Extra fields: ${results.extraFields.length}`);
    console.log(`  - Type mismatches: ${results.typeMismatches.length}`);
    console.log(`  - Constraint mismatches: ${results.constraintMismatches.length}`);

    if (results.issues.length > 0) {
      console.log('\n📋 Detailed Issues:');
      results.issues.forEach((issue, idx) => {
        console.log(`\n${idx + 1}. ${issue.model} (${issue.table})`);
        console.log(`   Severity: ${issue.severity.toUpperCase()}`);
        console.log(`   ${issue.message}`);
      });
    }

    if (shouldFix && results.missingFields.length > 0) {
      console.log('\n🔧 Fix mode: Would generate migration scripts for missing fields');
      // TODO: Generate migration scripts
    }

    process.exit(results.totalIssues > 0 ? 1 : 0);
  } catch (error) {
    enterpriseLogger.error('Schema verification failed', {
      error: error.message,
      stack: error.stack,
    });
    console.error('❌ Verification failed:', error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run verification
main();

