// =====================================================
// DATABASE MIGRATION SCRIPT - MVP MODELS ONLY
// =====================================================

require('dotenv').config();

const { sequelize } = require('../config/database');
const enterpriseLogger = require('../utils/logger');

// Import only models that actually exist on disk
const User = require('../models/User');
const ITRFiling = require('../models/ITRFiling');
const AuditEvent = require('../models/AuditEvent');
const UserSession = require('../models/UserSession');
const PasswordResetToken = require('../models/PasswordResetToken');
const CAFirm = require('../models/CAFirm');
const UserProfile = require('../models/UserProfile');
const FilingSnapshot = require('../models/FilingSnapshot');
const ERISubmissionAttempt = require('../models/ERISubmissionAttempt');
const Notification = require('../models/Notification');
const Order = require('../models/Order');
const FamilyMember = require('../models/FamilyMember');
const VaultDocument = require('../models/VaultDocument');
const Coupon = require('../models/Coupon');

// Load associations from index.js
require('../models/index');

// Helper function to safely sync tables
const safeSyncTable = async (model, modelName, options = {}) => {
  try {
    await model.sync({ force: false, alter: true, ...options });
    enterpriseLogger.info(`${modelName} table synced`);
    return true;
  } catch (error) {
    enterpriseLogger.warn(`${modelName} sync with alter failed, trying without alter: ${error.message}`);
    try {
      await model.sync({ force: false, alter: false, ...options });
      enterpriseLogger.info(`${modelName} table verified (without alter)`);
      return true;
    } catch (syncError) {
      enterpriseLogger.error(`${modelName} sync failed COMPLETELY: ${syncError.message}`);
      throw syncError;
    }
  }
};

const runMigrations = async () => {
  try {
    await sequelize.authenticate();
    enterpriseLogger.info('Database connection established');

    await createTablesInOrder();
    enterpriseLogger.info('Database tables created successfully');

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

    // Step 1: Create core ENUM types
    const enumTypes = [
      { name: 'enum_users_auth_provider', values: ['local', 'google'] },
      { name: 'enum_users_role', values: ['SUPER_ADMIN', 'CA', 'PREPARER', 'END_USER'] },
      { name: 'enum_users_status', values: ['active', 'disabled'] },
    ];

    for (const et of enumTypes) {
      const valuesList = et.values.map((v) => `'${v}'`).join(', ');
      await sequelize.query(
        `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = '${et.name}') THEN CREATE TYPE ${et.name} AS ENUM(${valuesList}); END IF; END $$;`
      );
    }
    enterpriseLogger.info('Core ENUM types verified');

    // Step 2: Check existing tables
    const tables = await queryInterface.showAllTables();
    const usersExists = tables.includes('users');
    const caFirmsExists = tables.includes('ca_firms');

    // Step 3: Create users table
    if (!usersExists) {
      enterpriseLogger.info('Creating users table...');
      try {
        await User.sync({ force: false, alter: false });
      } catch (e) {
        if (e.message.includes('ca_firms')) {
          enterpriseLogger.info('Initial User.sync failed due to ca_firms dependency (expected on clean slate).');
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
    }

    // Step 5: Finalize users table
    enterpriseLogger.info('Finalizing users table schema...');
    await User.sync({ force: false, alter: true });
    await addMissingUserColumns(queryInterface);
    enterpriseLogger.info('Users table finalized');

    // Step 6: Sync all other tables in dependency order
    await safeSyncTable(UserSession, 'User Sessions');
    await safeSyncTable(UserProfile, 'User Profiles');
    await safeSyncTable(AuditEvent, 'Audit Events');
    await safeSyncTable(PasswordResetToken, 'Password Reset Tokens');
    await safeSyncTable(Notification, 'Notifications');
    await safeSyncTable(Coupon, 'Coupons');
    await safeSyncTable(FamilyMember, 'Family Members');
    await safeSyncTable(ITRFiling, 'ITR Filings');
    await safeSyncTable(FilingSnapshot, 'Filing Snapshots');
    await safeSyncTable(ERISubmissionAttempt, 'ERI Submission Attempts');
    await safeSyncTable(Order, 'Orders');
    await safeSyncTable(VaultDocument, 'Vault Documents');
  } catch (error) {
    enterpriseLogger.error('Failed to create tables in order', {
      error: error.message,
      stack: error.stack,
    });
    throw error;
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
      { name: 'metadata', type: DataTypes.JSONB, allowNull: true, defaultValue: {} },
    ];

    for (const col of columnsToAdd) {
      if (!tableDescription[col.name]) {
        await queryInterface.addColumn('users', col.name, {
          type: col.type,
          allowNull: col.allowNull,
          defaultValue: col.defaultValue,
        });
      }
    }

    try {
      await queryInterface.addIndex('users', ['metadata'], {
        using: 'gin',
        name: 'idx_users_metadata_gin',
      });
    } catch (e) {
      /* index may already exist */
    }
  } catch (e) {
    enterpriseLogger.warn('Error in addMissingUserColumns:', e.message);
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
      { email: 'ca@burnblack.com', passwordHash: hash, fullName: 'CA Professional', role: 'CA', status: 'active', emailVerified: true },
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
    case 'migrate':
      await runMigrations();
      break;
    case 'seed':
      await runSeedData();
      break;
    case 'reset':
      await resetDatabase();
      break;
    default:
      console.log('Usage: node migrate.js [migrate|seed|reset]');
  }
  process.exit(0);
};

if (require.main === module) {
  main().catch((e) => {
    enterpriseLogger.error('Fatal:', e.message);
    process.exit(1);
  });
}

module.exports = { runMigrations, runSeedData, resetDatabase };
