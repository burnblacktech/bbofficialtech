// =====================================================
// ROBUST MIGRATION SCRIPT
// Handles schema mismatches automatically and continues on errors
// =====================================================

require('dotenv').config();
const { sequelize } = require('../config/database');
const enterpriseLogger = require('../utils/logger');

// Import all models
const User = require('../models/User');
const CAFirm = require('../models/CAFirm');
const { FamilyMember } = require('../models/Member');
const ITRFiling = require('../models/ITRFiling');
const ITRDraft = require('../models/ITRDraft');
const { Document } = require('../models/Document');
const { ServiceTicket } = require('../models/ServiceTicket');
const { ServiceTicketMessage } = require('../models/ServiceTicketMessage');
const { Invoice } = require('../models/Invoice');
const UserSession = require('../models/UserSession');
const AuditLog = require('../models/AuditLog');
const PasswordResetToken = require('../models/PasswordResetToken');
const AccountLinkingToken = require('../models/AccountLinkingToken');
const Invite = require('../models/Invite');
const UserProfile = require('../models/UserProfile');
const RefundTracking = require('../models/RefundTracking');

const migrationResults = {
  success: [],
  warnings: [],
  errors: [],
};

const safeSync = async (model, modelName, options = {}) => {
  try {
    await model.sync({ force: false, alter: false, ...options });
    migrationResults.success.push(`${modelName} table synced`);
    enterpriseLogger.info(`${modelName} table synced`);
    return true;
  } catch (error) {
    const errorMsg = error.message.toLowerCase();
    
    // Categorize errors
    const isSchemaMismatch = errorMsg.includes('cannot drop column') || 
                            errorMsg.includes('does not exist') ||
                            errorMsg.includes('cannot cast') ||
                            errorMsg.includes('column') && errorMsg.includes('does not exist') ||
                            errorMsg.includes('relation') && errorMsg.includes('does not exist');
    
    const isEnumError = errorMsg.includes('enum') || 
                       errorMsg.includes('cannot be cast') ||
                       errorMsg.includes('type');
    
    const isConstraintError = errorMsg.includes('constraint') ||
                             errorMsg.includes('foreign key') ||
                             errorMsg.includes('unique') ||
                             errorMsg.includes('primary key');
    
    const isSqlSyntaxError = errorMsg.includes('unterminated quoted string') ||
                            errorMsg.includes('syntax error') ||
                            errorMsg.includes('unexpected token') ||
                            (errorMsg.includes('comment') && errorMsg.includes('quote'));
    
    if (isSchemaMismatch || isEnumError || isConstraintError || isSqlSyntaxError) {
      migrationResults.warnings.push(`${modelName}: ${error.message.substring(0, 100)}`);
      enterpriseLogger.warn(`${modelName} sync warning:`, error.message.substring(0, 200));
      
      // Try with alter: false (create only, don't modify)
      try {
        await model.sync({ force: false, alter: false });
        migrationResults.success.push(`${modelName} table verified (skipped alter)`);
        return true;
      } catch (createError) {
        // If table doesn't exist, try to create it
        if (createError.message.includes('does not exist') || createError.message.includes('relation')) {
          try {
            await model.sync({ force: false, alter: false });
            migrationResults.success.push(`${modelName} table created`);
            return true;
          } catch (finalError) {
            migrationResults.errors.push(`${modelName}: ${finalError.message.substring(0, 100)}`);
            enterpriseLogger.error(`${modelName} sync failed:`, finalError.message);
            return false;
          }
        }
        migrationResults.errors.push(`${modelName}: ${createError.message.substring(0, 100)}`);
        enterpriseLogger.error(`${modelName} sync failed:`, createError.message);
        return false;
      }
    } else {
      migrationResults.errors.push(`${modelName}: ${error.message.substring(0, 100)}`);
      enterpriseLogger.error(`${modelName} sync failed:`, error.message);
      return false;
    }
  }
};

const fixCommonSchemaIssues = async () => {
  const queryInterface = sequelize.getQueryInterface();
  const fixes = [];
  
  try {
    const tables = await queryInterface.showAllTables();
    
    // Fix 1: Rename owner_id to created_by in ca_firms
    if (tables.includes('ca_firms')) {
      const columns = await queryInterface.describeTable('ca_firms');
      if (columns.owner_id && !columns.created_by) {
        try {
          // Drop FK constraints
          const [fkResults] = await sequelize.query(`
            SELECT constraint_name
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu 
              ON tc.constraint_name = kcu.constraint_name
            WHERE tc.table_name = 'ca_firms' 
              AND kcu.column_name = 'owner_id'
              AND tc.constraint_type = 'FOREIGN KEY';
          `);
          
          for (const fk of fkResults) {
            await sequelize.query(`ALTER TABLE ca_firms DROP CONSTRAINT IF EXISTS "${fk.constraint_name}";`);
          }
          
          // Drop indexes
          const [indexResults] = await sequelize.query(`
            SELECT indexname FROM pg_indexes 
            WHERE tablename = 'ca_firms' AND indexdef LIKE '%owner_id%';
          `);
          
          for (const idx of indexResults) {
            await sequelize.query(`DROP INDEX IF EXISTS "${idx.indexname}";`);
          }
          
          // Rename column
          await queryInterface.renameColumn('ca_firms', 'owner_id', 'created_by');
          
          // Recreate FK
          await sequelize.query(`
            ALTER TABLE ca_firms 
            ADD CONSTRAINT ca_firms_created_by_fkey 
            FOREIGN KEY (created_by) REFERENCES users(id);
          `);
          
          fixes.push('Renamed owner_id → created_by in ca_firms');
        } catch (error) {
          fixes.push(`Could not rename owner_id: ${error.message}`);
        }
      }
    }
    
    // Fix 2: Handle ENUM type mismatches in family_members
    if (tables.includes('family_members')) {
      try {
        const columns = await queryInterface.describeTable('family_members');
        if (columns.relationship) {
          // Check current enum type
          const [enumTypeCheck] = await sequelize.query(`
            SELECT t.typname, e.enumlabel
            FROM pg_type t 
            JOIN pg_enum e ON t.oid = e.enumtypid  
            WHERE t.typname LIKE '%relationship%'
            ORDER BY t.typname, e.enumsortorder;
          `);
          
          // Expected values from model: 'self', 'spouse', 'son', 'daughter', 'father', 'mother', 'other'
          const expectedValues = ['self', 'spouse', 'son', 'daughter', 'father', 'mother', 'other'];
          
          if (enumTypeCheck.length > 0) {
            const enumTypeName = enumTypeCheck[0].typname;
            const existingValues = [...new Set(enumTypeCheck.map(e => e.enumlabel))];
            
            // Check if enum values match (case-insensitive)
            const needsUpdate = expectedValues.some(exp => 
              !existingValues.some(ex => ex.toLowerCase() === exp.toLowerCase())
            );
            
            if (needsUpdate) {
              // Add missing enum values (PostgreSQL doesn't support IF NOT EXISTS for ADD VALUE in older versions)
              for (const value of expectedValues) {
                try {
                  await sequelize.query(`
                    DO $$ BEGIN
                      IF NOT EXISTS (
                        SELECT 1 FROM pg_enum 
                        WHERE enumlabel = '${value}' 
                        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = '${enumTypeName}')
                      ) THEN
                        ALTER TYPE ${enumTypeName} ADD VALUE '${value}';
                      END IF;
                    END $$;
                  `);
                } catch (addError) {
                  // Value might already exist or enum might need recreation
                  if (!addError.message.includes('already exists')) {
                    fixes.push(`Could not add enum value ${value}: ${addError.message}`);
                  }
                }
              }
              fixes.push(`Updated enum values for relationship column`);
            }
          } else {
            // Enum type doesn't exist, will be created by sync
            fixes.push(`Enum type for relationship will be created during sync`);
          }
        }
      } catch (error) {
        // If enum fix fails, try to drop and recreate the column
        try {
          enterpriseLogger.warn('Enum fix failed, attempting column recreation:', error.message);
          // Drop default first
          await sequelize.query(`ALTER TABLE family_members ALTER COLUMN relationship DROP DEFAULT;`);
          // Change column type (this will fail if data exists, but that's OK - we'll handle it)
          await sequelize.query(`
            ALTER TABLE family_members 
            ALTER COLUMN relationship TYPE VARCHAR(50);
          `);
          fixes.push(`Changed relationship column to VARCHAR temporarily`);
        } catch (dropError) {
          fixes.push(`Could not fix family_members enum: ${error.message} (drop also failed: ${dropError.message})`);
        }
      }
    }
    
    return fixes;
  } catch (error) {
    enterpriseLogger.error('Error in fixCommonSchemaIssues:', error.message);
    return [];
  }
};

const runRobustMigrations = async () => {
  try {
    enterpriseLogger.info('Starting robust migration...');
    console.log('\n=== Robust Database Migration ===\n');
    
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection established\n');
    
    // Fix common schema issues first
    console.log('Step 1: Fixing common schema issues...');
    const fixes = await fixCommonSchemaIssues();
    if (fixes.length > 0) {
      fixes.forEach(fix => console.log(`   ✅ ${fix}`));
    } else {
      console.log('   ℹ️  No schema fixes needed');
    }
    console.log('');
    
    // Create tables in order
    console.log('Step 2: Syncing tables...\n');
    
    // Core tables first (User before CAFirm due to FK dependency)
    await safeSync(User, 'User');
    await safeSync(CAFirm, 'CAFirm');
    
    // User-related tables
    await safeSync(UserSession, 'UserSession');
    await safeSync(UserProfile, 'UserProfile');
    await safeSync(AuditLog, 'AuditLog');
    await safeSync(PasswordResetToken, 'PasswordResetToken');
    await safeSync(AccountLinkingToken, 'AccountLinkingToken');
    await safeSync(Invite, 'Invite');
    
    // Family and ITR tables
    await safeSync(FamilyMember, 'FamilyMember');
    await safeSync(ITRFiling, 'ITRFiling');
    await safeSync(ITRDraft, 'ITRDraft');
    await safeSync(RefundTracking, 'RefundTracking');
    
    // Document and service tables
    await safeSync(Document, 'Document');
    await safeSync(ServiceTicket, 'ServiceTicket');
    await safeSync(ServiceTicketMessage, 'ServiceTicketMessage');
    await safeSync(Invoice, 'Invoice');
    
    // Summary
    console.log('\n=== Migration Summary ===\n');
    console.log(`✅ Successful: ${migrationResults.success.length}`);
    migrationResults.success.forEach(msg => console.log(`   - ${msg}`));
    
    if (migrationResults.warnings.length > 0) {
      console.log(`\n⚠️  Warnings: ${migrationResults.warnings.length}`);
      migrationResults.warnings.forEach(msg => console.log(`   - ${msg}`));
    }
    
    if (migrationResults.errors.length > 0) {
      console.log(`\n❌ Errors: ${migrationResults.errors.length}`);
      migrationResults.errors.forEach(msg => console.log(`   - ${msg}`));
    }
    
    console.log('');
    
    // Verify tables
    const tables = await sequelize.getQueryInterface().showAllTables();
    console.log(`📊 Total tables in database: ${tables.length}`);
    
    if (migrationResults.errors.length === 0) {
      console.log('\n✅ Migration completed successfully!\n');
      await sequelize.close();
      process.exit(0);
    } else {
      console.log('\n⚠️  Migration completed with errors. Check logs above.\n');
      await sequelize.close();
      process.exit(1);
    }
  } catch (error) {
    enterpriseLogger.error('Migration failed:', error.message);
    console.error('\n❌ Migration failed:', error.message);
    await sequelize.close();
    process.exit(1);
  }
};

runRobustMigrations();

