// =====================================================
// DATABASE MIGRATION SCRIPT - SEQUELIZE STANDARDIZED
// =====================================================

// Load environment variables first
require('dotenv').config();

const { sequelize } = require('../config/database');
const enterpriseLogger = require('../utils/logger');

// Import all models to ensure they're registered
const User = require('../models/User');
const { FamilyMember } = require('../models/Member');
const ITRFiling = require('../models/ITRFiling');
const ITRDraft = require('../models/ITRDraft');
const Document = require('../models/Document');
const { ServiceTicket } = require('../models/ServiceTicket');
const { ServiceTicketMessage } = require('../models/ServiceTicketMessage');
const { Invoice } = require('../models/Invoice');
const UserSession = require('../models/UserSession');
const AuditEvent = require('../models/AuditEvent');
const PasswordResetToken = require('../models/PasswordResetToken');
const CAFirm = require('../models/CAFirm');
const Invite = require('../models/Invite');
const AccountLinkingToken = require('../models/AccountLinkingToken');
const UserProfile = require('../models/UserProfile');
const RefundTracking = require('../models/RefundTracking');
const Assignment = require('../models/Assignment');
const ReturnVersion = require('../models/ReturnVersion');
const Consent = require('../models/Consent');
const DataSource = require('../models/DataSource');
const TaxPayment = require('../models/TaxPayment');
const Payment = require('../models/Payment');
const ForeignAsset = require('../models/ForeignAsset');
const ITRVProcessing = require('../models/ITRVProcessing');
const AssessmentNotice = require('../models/AssessmentNotice');
const TaxDemand = require('../models/TaxDemand');
const Scenario = require('../models/Scenario');
const DocumentTemplate = require('../models/DocumentTemplate');
const Notification = require('../models/Notification');
const HelpArticle = require('../models/HelpArticle');
const CAMarketplaceInquiry = require('../models/CAMarketplaceInquiry');
const CABooking = require('../models/CABooking');
const CAFirmReview = require('../models/CAFirmReview');
const BankAccount = require('../models/BankAccount');
const PricingPlan = require('../models/PricingPlan');
const Coupon = require('../models/Coupon');
const UserSegment = require('../models/UserSegment');
const PlatformSettings = require('../models/PlatformSettings');
const ERISubmissionAttempt = require('../models/ERISubmissionAttempt');

// Helper function to safely sync tables (handles policy/RLS issues)
const safeSyncTable = async (model, modelName, options = {}) => {
  try {
    await model.sync({ force: false, alter: true, ...options });
    enterpriseLogger.info(`${modelName} table synced`);
    return true;
  } catch (error) {
    enterpriseLogger.warn(`${modelName} sync with alter failed, trying without alter:`, error.message);
    try {
      await model.sync({ force: false, alter: false, ...options });
      enterpriseLogger.info(`${modelName} table verified (without alter)`);
      return true;
    } catch (syncError) {
      enterpriseLogger.error(`${modelName} sync failed COMPLETELY:`, syncError.message);
      throw syncError; // Re-throw to stop migration and show the real error
    }
  }
};

const runMigrations = async () => {
  try {
    // Test connection first
    await sequelize.authenticate();
    enterpriseLogger.info('Database connection established');

    // Create tables in dependency order
    enterpriseLogger.info('Step: createTablesInOrder starting');
    await createTablesInOrder();
    enterpriseLogger.info('Database tables created successfully');

    // Now add indexes manually
    enterpriseLogger.info('Step: addIndexes starting');
    await addIndexes();
    enterpriseLogger.info('Database indexes created successfully');

    // Verify tables exist
    enterpriseLogger.info('Step: final verification starting');
    const tables = await sequelize.getQueryInterface().showAllTables();
    enterpriseLogger.info('Database tables verified', { count: tables.length });

    return true;
  } catch (error) {
    enterpriseLogger.error('Migration failed', { error: error.message, stack: error.stack });
    return false;
  }
};

const createTablesInOrder = async () => {
  try {
    const queryInterface = sequelize.getQueryInterface();

    // Step 1: Create core ENUM types first (always safe)
    const enumTypes = [
      { name: 'enum_users_auth_provider', values: ['local', 'google'] },
      { name: 'enum_users_role', values: ['SUPER_ADMIN', 'CA', 'PREPARER', 'END_USER'] },
      { name: 'enum_users_status', values: ['active', 'disabled'] }
    ];

    for (const et of enumTypes) {
      const valuesList = et.values.map(v => `'${v}'`).join(', ');
      await sequelize.query(`DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = '${et.name}') THEN
          CREATE TYPE ${et.name} AS ENUM(${valuesList});
        END IF;
      END $$;`);
    }
    enterpriseLogger.info('Core ENUM types verified');

    // Step 2: Check existing tables
    const tables = await queryInterface.showAllTables();
    const usersExists = tables.includes('users');
    const caFirmsExists = tables.includes('ca_firms');

    // Step 3: Create users table (partial sync to avoid circular dependency)
    if (!usersExists) {
      enterpriseLogger.info('Creating users table...');
      try {
        await User.sync({ force: false, alter: false });
      } catch (e) {
        if (e.message.includes('ca_firms')) {
          enterpriseLogger.info('Initial User.sync failed due to ca_firms dependency (expected on clean slate).');
          const checkTables = await queryInterface.showAllTables();
          if (!checkTables.includes('users')) {
            enterpriseLogger.info('Users table not created, trying raw SQL creation for basic structure...');
            await sequelize.query(`
              CREATE TABLE IF NOT EXISTS users (
                id UUID PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255),
                full_name VARCHAR(255),
                auth_provider enum_users_auth_provider DEFAULT 'local',
                role enum_users_role DEFAULT 'END_USER',
                status enum_users_status DEFAULT 'active',
                created_at TIMESTAMPTZ NOT NULL,
                updated_at TIMESTAMPTZ NOT NULL
              );
            `);
          }
        } else {
          throw e;
        }
      }
      enterpriseLogger.info('Users table verified');
    }

    // Step 4: Create ca_firms table
    if (!caFirmsExists) {
      enterpriseLogger.info('Creating ca_firms table...');
      await CAFirm.sync({ force: false, alter: false });
      enterpriseLogger.info('CA Firms table created');
    } else {
      enterpriseLogger.info('CA Firms table exists, checking for legacy owner_id column...');
      const caFirmsColumns = await queryInterface.describeTable('ca_firms');
      if (caFirmsColumns.owner_id && !caFirmsColumns.created_by) {
        enterpriseLogger.info('Handling legacy owner_id rename...');
        await handleCAFirmRename(queryInterface);
      }
    }

    // Step 5: Finalize users table (adds ca_firm_id and other missing columns)
    enterpriseLogger.info('Finalizing users table schema...');
    await User.sync({ force: false, alter: true });
    await addMissingUserColumns(queryInterface);
    enterpriseLogger.info('Users table finalized');

    // Step 6: Sync User-related tables (depend on User)
    await safeSyncTable(UserSession, 'User Sessions');
    await safeSyncTable(UserProfile, 'User Profiles');
    await safeSyncTable(AuditEvent, 'Audit Events');
    await safeSyncTable(PasswordResetToken, 'Password Reset Tokens');
    await safeSyncTable(AccountLinkingToken, 'Account Linking Tokens');
    await safeSyncTable(Invite, 'Invites');
    await safeSyncTable(Notification, 'Notifications');
    await safeSyncTable(BankAccount, 'Bank Accounts');
    await safeSyncTable(PricingPlan, 'Pricing Plans');
    await safeSyncTable(Coupon, 'Coupons');

    // Step 7: Family members (depends on User)
    await syncFamilyMembers(queryInterface);

    // Step 8: ITR-related tables
    await safeSyncTable(ITRFiling, 'ITR filings');
    await safeSyncTable(ITRDraft, 'ITR drafts');
    await safeSyncTable(RefundTracking, 'Refund tracking');

    // Step 9: Other models
    await safeSyncTable(Document, 'Documents');
    await safeSyncTable(ServiceTicket, 'Service tickets');
    await safeSyncTable(ServiceTicketMessage, 'Service ticket messages');
    await safeSyncTable(Invoice, 'Invoices');
    await safeSyncTable(Payment, 'Payments');
    await safeSyncTable(HelpArticle, 'Help Articles');
    await safeSyncTable(CAMarketplaceInquiry, 'Marketplace Inquiries');
    await safeSyncTable(CABooking, 'CA Bookings');
    await safeSyncTable(CAFirmReview, 'CA Firm Reviews');
    await safeSyncTable(Assignment, 'Assignments');
    await safeSyncTable(ReturnVersion, 'Return Versions');
    await safeSyncTable(Consent, 'Consents');
    await safeSyncTable(DataSource, 'Data Sources');
    await safeSyncTable(TaxPayment, 'Tax Payments');
    await safeSyncTable(ForeignAsset, 'Foreign Assets');
    await safeSyncTable(ITRVProcessing, 'ITR-V Processing');
    await safeSyncTable(AssessmentNotice, 'Assessment Notices');
    await safeSyncTable(TaxDemand, 'Tax Demands');
    await safeSyncTable(Scenario, 'Scenarios');
    await safeSyncTable(DocumentTemplate, 'Document Templates');
    await safeSyncTable(UserSegment, 'User Segments');
    await safeSyncTable(PlatformSettings, 'Platform Settings');
    await safeSyncTable(ERISubmissionAttempt, 'ERI Submission Attempts');

  } catch (error) {
    enterpriseLogger.error('Failed to create tables in order', { error: error.message, stack: error.stack });
    throw error;
  }
};

const handleCAFirmRename = async (queryInterface) => {
  try {
    const caFirmsColumns = await queryInterface.describeTable('ca_firms');
    if (caFirmsColumns.owner_id && !caFirmsColumns.created_by) {
      enterpriseLogger.info('Renaming owner_id to created_by in ca_firms table...');

      // Drop FK constraints and indexes first
      const [fkResults] = await sequelize.query(`
        SELECT tc.constraint_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'ca_firms' AND kcu.column_name = 'owner_id' AND tc.constraint_type = 'FOREIGN KEY';
      `);

      for (const fk of fkResults) {
        await sequelize.query(`ALTER TABLE ca_firms DROP CONSTRAINT IF EXISTS "${fk.constraint_name}";`);
      }

      await queryInterface.renameColumn('ca_firms', 'owner_id', 'created_by');

      // Re-add FK
      await sequelize.query(`
        ALTER TABLE ca_firms 
        ADD CONSTRAINT ca_firms_created_by_fkey 
        FOREIGN KEY (created_by) REFERENCES users(id);
      `);
      enterpriseLogger.info('owner_id renamed to created_by successfully');
    }
  } catch (e) {
    enterpriseLogger.warn('Error in handleCAFirmRename:', e.message);
  }
};

const syncFamilyMembers = async (queryInterface) => {
  try {
    const tables = await queryInterface.showAllTables();
    if (tables.includes('family_members')) {
      const currentColumns = await queryInterface.describeTable('family_members');

      // Handle ENUM defaults that might block casting
      const enumCols = ['relationship', 'gender', 'marital_status', 'client_type', 'status'];
      for (const col of enumCols) {
        if (currentColumns[col]) {
          await sequelize.query(`ALTER TABLE family_members ALTER COLUMN ${col} DROP DEFAULT;`).catch(() => { });
        }
      }
    }

    await safeSyncTable(FamilyMember, 'Family members');

    // Set defaults back
    await sequelize.query(`ALTER TABLE family_members ALTER COLUMN relationship SET DEFAULT 'other';`).catch(() => { });
    await sequelize.query(`ALTER TABLE family_members ALTER COLUMN client_type SET DEFAULT 'family';`).catch(() => { });
    await sequelize.query(`ALTER TABLE family_members ALTER COLUMN status SET DEFAULT 'active';`).catch(() => { });
  } catch (e) {
    enterpriseLogger.warn('Error in syncFamilyMembers:', e.message);
  }
};

const addMissingUserColumns = async (queryInterface) => {
  try {
    const { DataTypes } = require('sequelize');
    const tableDescription = await queryInterface.describeTable('users');

    const columnsToAdd = [
      { name: 'pan_number', type: DataTypes.STRING(10), allowNull: true },
      { name: 'pan_verified', type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      { name: 'pan_verified_at', type: DataTypes.DATE, allowNull: true },
      { name: 'last_login_at', type: DataTypes.DATE, allowNull: true },
      { name: 'onboarding_completed', type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      { name: 'date_of_birth', type: DataTypes.DATEONLY, allowNull: true },
      { name: 'metadata', type: DataTypes.JSONB, allowNull: true, defaultValue: {} }
    ];

    for (const col of columnsToAdd) {
      if (!tableDescription[col.name]) {
        await queryInterface.addColumn('users', col.name, {
          type: col.type,
          allowNull: col.allowNull,
          defaultValue: col.defaultValue
        });
      }
    }

    // Ensure metadata index
    try {
      await queryInterface.addIndex('users', ['metadata'], {
        using: 'gin',
        name: 'idx_users_metadata_gin'
      });
    } catch (e) { }
  } catch (e) {
    enterpriseLogger.warn('Error in addMissingUserColumns:', e.message);
  }
};

const addIndexes = async () => {
  try {
    const queryInterface = sequelize.getQueryInterface();
    const tables = await queryInterface.showAllTables();
    if (!tables.includes('family_members')) return;

    const cols = await queryInterface.describeTable('family_members');
    const indexConfigs = [
      { col: 'pan_number', unique: true },
      { col: 'user_id', unique: false },
      { col: 'relationship', unique: false },
      { col: 'is_dependent', unique: false }
    ];

    for (const conf of indexConfigs) {
      if (cols[conf.col]) {
        try {
          await queryInterface.addIndex('family_members', [conf.col], {
            name: `family_members_${conf.col}_idx`,
            unique: conf.unique
          });
        } catch (e) { }
      }
    }
  } catch (e) {
    enterpriseLogger.warn('Error in addIndexes:', e.message);
  }
};

const runSeedData = async () => {
  try {
    enterpriseLogger.info('Starting seed data insertion...');
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash('admin123', 12);

    const testUsers = [
      { email: 'admin@burnblack.com', passwordHash: hash, fullName: 'Admin User', role: 'SUPER_ADMIN', status: 'active', emailVerified: true },
      { email: 'user@burnblack.com', passwordHash: hash, fullName: 'Test User', role: 'END_USER', status: 'active', emailVerified: true },
      { email: 'ca@burnblack.com', passwordHash: hash, fullName: 'CA Professional', role: 'CA', status: 'active', emailVerified: true }
    ];

    for (const u of testUsers) {
      await User.findOrCreate({ where: { email: u.email }, defaults: u });
    }
    return true;
  } catch (e) {
    enterpriseLogger.error('Seed data failed:', e.message);
    return false;
  }
};

const resetDatabase = async () => {
  try {
    await sequelize.drop();
    await createTablesInOrder();
    await runSeedData();
    return true;
  } catch (e) {
    enterpriseLogger.error('Reset failed:', e.message);
    return false;
  }
};

const main = async () => {
  const command = process.argv[2] || 'migrate';
  switch (command) {
    case 'migrate': await runMigrations(); break;
    case 'seed': await runSeedData(); break;
    case 'reset': await resetDatabase(); break;
    default: console.log('Usage: node migrate.js [migrate|seed|reset]');
  }
  process.exit(0);
};

if (require.main === module) {
  main().catch(e => {
    enterpriseLogger.error('Fatal:', e.message);
    process.exit(1);
  });
}

module.exports = { runMigrations, runSeedData, resetDatabase };