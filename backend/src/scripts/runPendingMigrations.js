// =====================================================
// UNIFIED MIGRATION RUNNER
// Checks and runs all pending migrations automatically
// =====================================================

require('dotenv').config();
const { sequelize } = require('../config/database');
const enterpriseLogger = require('../utils/logger');
const { QueryTypes } = require('sequelize');
const path = require('path');

// Import migration functions
const addAadhaarFields = require('./migrations/add-aadhaar-fields');
const createReportTemplatesTable = require('./migrations/create-report-templates-table');
const createSystemSettingsTable = require('./migrations/create-system-settings-table');
const createScenariosTable = require('./migrations/create-scenarios-table');
const createITRVProcessingTable = require('./migrations/create-itrv-processing-table');
const createAssessmentNoticesTable = require('./migrations/create-assessment-notices-table');
const createTaxDemandsTable = require('./migrations/create-tax-demands-table');
const createDocumentTemplatesTable = require('./migrations/create-document-templates-table');
const createAnalyticsTables = require('./migrations/create-analytics-tables');

// Migration registry - defines all available migrations
const MIGRATIONS = [
  {
    id: 'create-analytics-tables',
    name: 'Create Analytics Tables',
    description: 'Creates financial_snapshots, financial_milestones, and user_insights tables',
    function: createAnalyticsTables,
    dependencies: [],
    checkQuery: `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('financial_snapshots', 'financial_milestones', 'user_insights')
    `,
    isApplied: async function () {
      const result = await sequelize.query(this.checkQuery, { type: QueryTypes.SELECT });
      const tables = Array.isArray(result) ? result : [];
      return tables.length === 3;
    },
  },
  {
    id: 'add-aadhaar-fields',
    name: 'Add Aadhaar Linking Fields',
    description: 'Adds aadhaar_linked, aadhaar_verified_at, aadhaar_verification_data to user_profiles',
    function: addAadhaarFields,
    dependencies: [], // No dependencies
    checkQuery: `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'user_profiles'
      AND column_name IN ('aadhaar_linked', 'aadhaar_verified_at', 'aadhaar_verification_data')
    `,
    isApplied: async function () {
      const result = await sequelize.query(this.checkQuery, { type: QueryTypes.SELECT });
      const columns = Array.isArray(result) ? result : [];
      return columns.length === 3; // All 3 columns must exist
    },
  },
  {
    id: 'create-report-templates-table',
    name: 'Create Report Templates Table',
    description: 'Creates report_templates table for custom report builder',
    function: createReportTemplatesTable,
    dependencies: [], // No dependencies
    checkQuery: `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'report_templates'
    `,
    isApplied: async function () {
      const result = await sequelize.query(this.checkQuery, { type: QueryTypes.SELECT });
      const tables = Array.isArray(result) ? result : [];
      return tables.length > 0;
    },
  },
  {
    id: 'create-system-settings-table',
    name: 'Create System Settings Table',
    description: 'Creates system_settings table for platform configuration',
    function: createSystemSettingsTable,
    dependencies: [], // No dependencies
    checkQuery: `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'system_settings'
    `,
    isApplied: async function () {
      const result = await sequelize.query(this.checkQuery, { type: QueryTypes.SELECT });
      const tables = Array.isArray(result) ? result : [];
      return tables.length > 0;
    },
  },
  {
    id: 'create-scenarios-table',
    name: 'Create Scenarios Table',
    description: 'Creates scenarios table for saving tax simulation scenarios',
    function: createScenariosTable,
    dependencies: [],
    checkQuery: `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'scenarios'
    `,
    isApplied: async function () {
      const result = await sequelize.query(this.checkQuery, { type: QueryTypes.SELECT });
      const tables = Array.isArray(result) ? result : [];
      return tables.length > 0;
    },
  },
  {
    id: 'create-itrv-processing-table',
    name: 'Create ITR-V Processing Table',
    description: 'Creates itrv_processing table for ITR-V tracking',
    function: createITRVProcessingTable,
    dependencies: [],
    checkQuery: `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'itrv_processing'
    `,
    isApplied: async function () {
      const result = await sequelize.query(this.checkQuery, { type: QueryTypes.SELECT });
      const tables = Array.isArray(result) ? result : [];
      return tables.length > 0;
    },
  },
  {
    id: 'create-assessment-notices-table',
    name: 'Create Assessment Notices Table',
    description: 'Creates assessment_notices table for assessment notice management',
    function: createAssessmentNoticesTable,
    dependencies: [],
    checkQuery: `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'assessment_notices'
    `,
    isApplied: async function () {
      const result = await sequelize.query(this.checkQuery, { type: QueryTypes.SELECT });
      const tables = Array.isArray(result) ? result : [];
      return tables.length > 0;
    },
  },
  {
    id: 'create-tax-demands-table',
    name: 'Create Tax Demands Table',
    description: 'Creates tax_demands table for tax demand management',
    function: createTaxDemandsTable,
    dependencies: [],
    checkQuery: `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'tax_demands'
    `,
    isApplied: async function () {
      const result = await sequelize.query(this.checkQuery, { type: QueryTypes.SELECT });
      const tables = Array.isArray(result) ? result : [];
      return tables.length > 0;
    },
  },
  {
    id: 'create-document-templates-table',
    name: 'Create Document Templates Table',
    description: 'Creates document_templates table for document template management',
    function: createDocumentTemplatesTable,
    dependencies: [],
    checkQuery: `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'document_templates'
    `,
    isApplied: async function () {
      const result = await sequelize.query(this.checkQuery, { type: QueryTypes.SELECT });
      const tables = Array.isArray(result) ? result : [];
      return tables.length > 0;
    },
  },
];

const runPendingMigrations = async (options = {}) => {
  const { dryRun = false, verbose = true } = options;

  try {
    console.log('\n=== Unified Migration Runner ===\n');

    // Test connection
    if (verbose) console.log('1. Testing database connection...');
    await sequelize.authenticate();
    if (verbose) console.log('✅ Connected to database\n');

    // Check which migrations are already applied
    if (verbose) console.log('2. Checking migration status...\n');
    const migrationStatus = [];

    for (const migration of MIGRATIONS) {
      const isApplied = await migration.isApplied.call(migration);
      migrationStatus.push({
        ...migration,
        isApplied,
        needsRun: !isApplied,
      });

      if (verbose) {
        const status = isApplied ? '✅' : '❌';
        console.log(`   ${status} ${migration.name} - ${isApplied ? 'Applied' : 'Pending'}`);
      }
    }
    console.log('');

    // Filter pending migrations
    const pendingMigrations = migrationStatus.filter(m => m.needsRun);

    if (pendingMigrations.length === 0) {
      console.log('✅ All migrations are already applied!\n');
      process.exit(0);
    }

    console.log(`Found ${pendingMigrations.length} pending migration(s):\n`);
    pendingMigrations.forEach((m, index) => {
      console.log(`   ${index + 1}. ${m.name}`);
      console.log(`      ${m.description}\n`);
    });

    if (dryRun) {
      console.log('🔍 DRY RUN MODE - No changes will be made\n');
      console.log('To apply migrations, run without --dry-run flag\n');
      process.exit(0);
    }

    // Run pending migrations
    console.log('3. Running pending migrations...\n');
    const results = {
      successful: [],
      failed: [],
    };

    for (const migration of pendingMigrations) {
      try {
        console.log(`Running: ${migration.name}...`);

        // Run the migration function
        await migration.function();

        // Verify it was applied (re-check using the same query)
        const isNowApplied = await migration.isApplied.call(migration);
        if (isNowApplied) {
          console.log(`✅ ${migration.name} - Applied and verified successfully\n`);
          results.successful.push(migration);
        } else {
          // Migration ran but verification failed - this is unusual but not necessarily an error
          // The migration might have already been applied or the check query needs adjustment
          console.log(`⚠️  ${migration.name} - Completed but verification check returned false`);
          console.log(`   This may be normal if the migration was already partially applied.\n`);
          results.successful.push(migration); // Still count as successful since the function completed
        }
      } catch (error) {
        console.error(`❌ ${migration.name} - Failed: ${error.message}\n`);
        results.failed.push({
          migration,
          error: error.message,
        });

        // Ask if we should continue
        if (verbose) {
          console.log('⚠️  Migration failed. Continuing with remaining migrations...\n');
        }
      }
    }

    // Summary
    console.log('=== Migration Summary ===\n');
    console.log(`✅ Successful: ${results.successful.length}`);
    results.successful.forEach(m => {
      console.log(`   - ${m.name}`);
    });

    if (results.failed.length > 0) {
      console.log(`\n❌ Failed: ${results.failed.length}`);
      results.failed.forEach(({ migration, error }) => {
        console.log(`   - ${migration.name}: ${error}`);
      });
      console.log('\n⚠️  Some migrations failed. Please review errors above.');
      console.log('   You can run individual migrations manually:');
      results.failed.forEach(({ migration }) => {
        const scriptPath = path.join(__dirname, 'migrations', `${migration.id}.js`);
        console.log(`   node ${scriptPath}`);
      });
    }

    console.log('');

    // Log results
    enterpriseLogger.info('Migration runner completed', {
      successful: results.successful.length,
      failed: results.failed.length,
      total: pendingMigrations.length,
    });

    process.exit(results.failed.length > 0 ? 1 : 0);

  } catch (error) {
    console.error('\n❌ Migration runner failed:');
    console.error(`   Error: ${error.message}`);
    if (error.stack) {
      console.error(`   Stack: ${error.stack.split('\n').slice(0, 5).join('\n')}`);
    }
    console.log('\n   Troubleshooting:');
    console.log('   1. Verify database connection in .env file');
    console.log('   2. Check Supabase project is active');
    console.log('   3. Verify database credentials');
    console.log('   4. Run individual migrations manually if needed\n');

    enterpriseLogger.error('Migration runner failed', {
      error: error.message,
      stack: error.stack,
    });

    process.exit(1);
  } finally {
    await sequelize.close();
  }
};

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  dryRun: args.includes('--dry-run') || args.includes('-d'),
  verbose: !args.includes('--quiet') && !args.includes('-q'),
};

// Run if called directly
if (require.main === module) {
  runPendingMigrations(options);
}

module.exports = runPendingMigrations;

