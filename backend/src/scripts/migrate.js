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
const { Document } = require('../models/Document');
const { ServiceTicket } = require('../models/ServiceTicket');
const { ServiceTicketMessage } = require('../models/ServiceTicketMessage');
const { Invoice } = require('../models/Invoice');
const UserSession = require('../models/UserSession');
const AuditLog = require('../models/AuditLog');
const PasswordResetToken = require('../models/PasswordResetToken');
const CAFirm = require('../models/CAFirm');
const Invite = require('../models/Invite');
const AccountLinkingToken = require('../models/AccountLinkingToken');
const UserProfile = require('../models/UserProfile');

const runMigrations = async () => {
  try {
    // Test connection first
    await sequelize.authenticate();
    enterpriseLogger.info('Database connection established');

    // Create tables in dependency order
    await createTablesInOrder();
    enterpriseLogger.info('Database tables created successfully');

    // Now add indexes manually
    await addIndexes();
    enterpriseLogger.info('Database indexes created successfully');

    // Verify tables exist
    const tables = await sequelize.getQueryInterface().showAllTables();
    enterpriseLogger.info('Database tables verified', { tables });

    return true;
  } catch (error) {
    enterpriseLogger.error('Migration failed', { error: error.message, stack: error.stack });
    return false;
  }
};

const createTablesInOrder = async () => {
  try {
    const queryInterface = sequelize.getQueryInterface();
    
    // Handle circular dependency: User <-> CAFirm
    // Strategy: Create User first (without ca_firm_id FK), then CAFirm, then add FK to User
    
    // Step 1: Check existing tables
    const tables = await queryInterface.showAllTables();
    const usersExists = tables.includes('users');
    const caFirmsExists = tables.includes('ca_firms');
    
    // Step 2: Create User table first (ca_firm_id is nullable, so FK can be added later)
    if (!usersExists) {
      enterpriseLogger.info('Creating users table...');
      // Create without FK constraints first
      await User.sync({ force: false, alter: false });
      enterpriseLogger.info('Users table created');
    } else {
      enterpriseLogger.info('Users table exists, checking schema...');
      // Sync to add missing columns (but skip FK if ca_firms doesn't exist)
      try {
        await User.sync({ force: false, alter: true });
        enterpriseLogger.info('Users table synced');
      } catch (error) {
        if (error.message.includes('ca_firms') && !caFirmsExists) {
          enterpriseLogger.info('Users table synced (FK will be added after ca_firms is created)');
        } else {
          throw error;
        }
      }
    }
    
    // Step 3: Create CAFirm table (now users exists, so created_by FK can be added)
    if (!caFirmsExists) {
      enterpriseLogger.info('Creating ca_firms table...');
      await CAFirm.sync({ force: false, alter: false });
      enterpriseLogger.info('CA Firms table created');
    } else {
      enterpriseLogger.info('CA Firms table exists, checking schema...');
      // Check if owner_id exists and needs to be renamed to created_by
      // IMPORTANT: Do this BEFORE calling sync, as sync will try to drop owner_id
      const caFirmsColumns = await queryInterface.describeTable('ca_firms');
      
      if (caFirmsColumns.owner_id && !caFirmsColumns.created_by) {
        enterpriseLogger.info('Renaming owner_id to created_by in ca_firms table...');
        try {
          // First, find all constraints and indexes that depend on owner_id
          const [fkResults] = await sequelize.query(`
            SELECT tc.constraint_name, tc.constraint_type
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu 
              ON tc.constraint_name = kcu.constraint_name
            WHERE tc.table_name = 'ca_firms' 
              AND kcu.column_name = 'owner_id';
          `);
          
          const [indexResults] = await sequelize.query(`
            SELECT indexname 
            FROM pg_indexes 
            WHERE tablename = 'ca_firms' 
              AND indexdef LIKE '%owner_id%';
          `);
          
          enterpriseLogger.info(`Found ${fkResults.length} constraints and ${indexResults.length} indexes on owner_id`);
          
          // Drop foreign key constraints
          for (const fk of fkResults) {
            if (fk.constraint_type === 'FOREIGN KEY') {
              enterpriseLogger.info(`Dropping FK constraint: ${fk.constraint_name}`);
              await queryInterface.sequelize.query(
                `ALTER TABLE ca_firms DROP CONSTRAINT IF EXISTS "${fk.constraint_name}";`
              );
            }
          }
          
          // Drop indexes
          for (const idx of indexResults) {
            enterpriseLogger.info(`Dropping index: ${idx.indexname}`);
            await queryInterface.sequelize.query(
              `DROP INDEX IF EXISTS "${idx.indexname}";`
            );
          }
          
          // Now rename the column
          enterpriseLogger.info('Renaming column owner_id to created_by...');
          await queryInterface.renameColumn('ca_firms', 'owner_id', 'created_by');
          enterpriseLogger.info('Column renamed successfully');
          
          // Recreate FK constraint
          enterpriseLogger.info('Recreating foreign key constraint...');
          await queryInterface.sequelize.query(`
            ALTER TABLE ca_firms 
            ADD CONSTRAINT ca_firms_created_by_fkey 
            FOREIGN KEY (created_by) REFERENCES users(id);
          `);
          enterpriseLogger.info('Foreign key constraint recreated');
        } catch (error) {
          enterpriseLogger.error('Error renaming column:', error.message);
          enterpriseLogger.error('Stack:', error.stack);
          // If rename fails, try to add created_by as new column and copy data
          if (!caFirmsColumns.created_by) {
            enterpriseLogger.info('Adding created_by column instead (fallback)...');
            try {
              await queryInterface.addColumn('ca_firms', 'created_by', {
                type: require('sequelize').DataTypes.UUID,
                allowNull: true, // Allow null initially
              });
              // Copy data from owner_id to created_by
              await queryInterface.sequelize.query(`
                UPDATE ca_firms SET created_by = owner_id WHERE owner_id IS NOT NULL;
              `);
              // Now make it NOT NULL and add FK
              await queryInterface.changeColumn('ca_firms', 'created_by', {
                type: require('sequelize').DataTypes.UUID,
                allowNull: false,
                references: {
                  model: 'users',
                  key: 'id',
                },
              });
              enterpriseLogger.info('created_by column added and FK constraint created');
            } catch (addError) {
              enterpriseLogger.error('Could not add created_by column:', addError.message);
              throw addError;
            }
          }
        }
      }
      
      // After rename, manually add any missing columns instead of using alter: true
      // (alter: true would try to drop owner_id if rename failed)
      enterpriseLogger.info('Checking for missing columns in ca_firms table...');
      const currentColumns = await queryInterface.describeTable('ca_firms');
      const modelAttributes = CAFirm.rawAttributes;
      
      // Check for missing columns from model
      for (const [attrName, attrDef] of Object.entries(modelAttributes)) {
        const dbColumnName = attrDef.field || attrName;
        if (!currentColumns[dbColumnName] && dbColumnName !== 'id' && dbColumnName !== 'created_at' && dbColumnName !== 'updated_at') {
          enterpriseLogger.info(`Adding missing column: ${dbColumnName}`);
          try {
            await queryInterface.addColumn('ca_firms', dbColumnName, {
              type: attrDef.type,
              allowNull: attrDef.allowNull !== false,
              defaultValue: attrDef.defaultValue,
              ...(attrDef.references ? {
                references: attrDef.references,
              } : {}),
            });
            enterpriseLogger.info(`Column ${dbColumnName} added`);
          } catch (error) {
            enterpriseLogger.warn(`Could not add column ${dbColumnName}:`, error.message);
          }
        }
      }
      
      enterpriseLogger.info('CA Firms table synced');
    }
    
    // Step 4: Now ensure User has ca_firm_id column and FK (ca_firms now exists)
    try {
      const userColumns = await queryInterface.describeTable('users');
      if (!userColumns.ca_firm_id) {
        enterpriseLogger.info('Adding ca_firm_id column to users table...');
        await queryInterface.addColumn('users', 'ca_firm_id', {
          type: require('sequelize').DataTypes.UUID,
          allowNull: true,
          references: {
            model: 'ca_firms',
            key: 'id',
          },
        });
        enterpriseLogger.info('ca_firm_id column added to users');
      }
    } catch (error) {
      if (error.message.includes('already exists') || error.message.includes('duplicate')) {
        enterpriseLogger.info('ca_firm_id column already exists in users');
      } else {
        enterpriseLogger.warn('Could not add ca_firm_id to users:', error.message);
      }
    }

    // 3. User-related tables (depend on User)
    await UserSession.sync({ force: false, alter: true });
    enterpriseLogger.info('User Sessions table synced');
    
    await UserProfile.sync({ force: false, alter: true });
    enterpriseLogger.info('User Profiles table synced');
    
    await AuditLog.sync({ force: false, alter: true });
    enterpriseLogger.info('Audit Logs table synced');
    
    await PasswordResetToken.sync({ force: false, alter: true });
    enterpriseLogger.info('Password Reset Tokens table synced');
    
    await AccountLinkingToken.sync({ force: false, alter: true });
    enterpriseLogger.info('Account Linking Tokens table synced');
    
    await Invite.sync({ force: false, alter: true });
    enterpriseLogger.info('Invites table synced');

    // 4. Family members (depends on User)
    await FamilyMember.sync({ force: false, alter: true });
    enterpriseLogger.info('Family members table synced');

    // 5. ITR-related tables (depend on User)
    await ITRFiling.sync({ force: false, alter: true });
    enterpriseLogger.info('ITR filings table synced');

    await ITRDraft.sync({ force: false, alter: true });
    enterpriseLogger.info('ITR drafts table synced');

    // 6. Documents (depends on User)
    await Document.sync({ force: false, alter: true });
    enterpriseLogger.info('Documents table synced');

    // 7. Service tickets (depends on User)
    await ServiceTicket.sync({ force: false, alter: true });
    enterpriseLogger.info('Service tickets table synced');

    await ServiceTicketMessage.sync({ force: false, alter: true });
    enterpriseLogger.info('Service ticket messages table synced');

    // 8. Invoices (depends on User)
    await Invoice.sync({ force: false, alter: true });
    enterpriseLogger.info('Invoices table synced');

  } catch (error) {
    enterpriseLogger.error('Failed to create tables in order', { error: error.message, stack: error.stack });
    throw error;
  }
};

const addIndexes = async () => {
  try {
    const queryInterface = sequelize.getQueryInterface();

    // Add indexes for family_members table (skip if they already exist)
    try {
      await queryInterface.addIndex('family_members', ['pan_number'], {
        unique: true,
        name: 'family_members_pan_number_unique',
      });
    } catch (e) {
      if (!e.message.includes('already exists')) {throw e;}
    }

    try {
      await queryInterface.addIndex('family_members', ['user_id'], {
        name: 'family_members_user_id_index',
      });
    } catch (e) {
      if (!e.message.includes('already exists')) {throw e;}
    }

    try {
      await queryInterface.addIndex('family_members', ['relationship'], {
        name: 'family_members_relationship_index',
      });
    } catch (e) {
      if (!e.message.includes('already exists')) {throw e;}
    }

    try {
      await queryInterface.addIndex('family_members', ['is_dependent'], {
        name: 'family_members_is_dependent_index',
      });
    } catch (e) {
      if (!e.message.includes('already exists')) {throw e;}
    }

    enterpriseLogger.info('Indexes added successfully');
  } catch (error) {
    enterpriseLogger.error('Failed to add indexes', { error: error.message });
    throw error;
  }
};

const runSeedData = async () => {
  try {
    enterpriseLogger.info('Starting seed data insertion...');

    // Create test users with correct password hashes
    const bcrypt = require('bcryptjs');
    const adminPasswordHash = await bcrypt.hash('admin123', 12);
    const userPasswordHash = await bcrypt.hash('admin123', 12);
    const caPasswordHash = await bcrypt.hash('admin123', 12);
    const platformPasswordHash = await bcrypt.hash('admin123', 12);
    const charteredPasswordHash = await bcrypt.hash('admin123', 12);

    const testUsers = [
      {
        email: 'admin@burnblack.com',
        passwordHash: adminPasswordHash,
        fullName: 'Admin User',
        role: 'super_admin',
        status: 'active',
        emailVerified: true,
      },
      {
        email: 'user@burnblack.com',
        passwordHash: userPasswordHash,
        fullName: 'Test User',
        role: 'user',
        status: 'active',
        emailVerified: true,
      },
      {
        email: 'ca@burnblack.com',
        passwordHash: caPasswordHash,
        fullName: 'CA Professional',
        role: 'ca_firm_admin',
        status: 'active',
        emailVerified: true,
      },
      {
        email: 'platform@burnblack.com',
        passwordHash: platformPasswordHash,
        fullName: 'Platform Admin',
        role: 'platform_admin',
        status: 'active',
        emailVerified: true,
      },
      {
        email: 'chartered@burnblack.com',
        passwordHash: charteredPasswordHash,
        fullName: 'Chartered Accountant',
        role: 'ca',
        status: 'active',
        emailVerified: true,
      },
    ];

    for (const userData of testUsers) {
      await User.findOrCreate({
        where: { email: userData.email },
        defaults: userData,
      });
    }

    enterpriseLogger.info('Seed data inserted successfully');
    return true;
  } catch (error) {
    enterpriseLogger.error('Seed data insertion failed', { error: error.message });
    return false;
  }
};

const resetDatabase = async () => {
  try {
    enterpriseLogger.info('Resetting database...');

    // Drop all tables
    await sequelize.drop();
    enterpriseLogger.info('All tables dropped');

    // Recreate tables
    await sequelize.sync({ force: true });
    enterpriseLogger.info('Tables recreated');

    // Insert seed data
    await runSeedData();

    enterpriseLogger.info('Database reset completed successfully');
    return true;
  } catch (error) {
    enterpriseLogger.error('Database reset failed', { error: error.message });
    return false;
  }
};

// Main execution
const main = async () => {
  // Default to 'migrate' if no argument provided
  const command = process.argv[2] || 'migrate';

  enterpriseLogger.info('Migration script started', { command, args: process.argv });

  switch (command) {
  case 'migrate': {
    enterpriseLogger.info('Running migrations...');
    const migrateResult = await runMigrations();
    if (migrateResult) {
      enterpriseLogger.info('Migrations completed successfully');
    } else {
      enterpriseLogger.error('Migrations failed');
    }
    process.exit(migrateResult ? 0 : 1);
    break;
  }

  case 'seed': {
    enterpriseLogger.info('Running seed data...');
    const seedResult = await runSeedData();
    if (seedResult) {
      enterpriseLogger.info('Seed data inserted successfully');
    } else {
      enterpriseLogger.error('Seed data insertion failed');
    }
    process.exit(seedResult ? 0 : 1);
    break;
  }

  case 'reset': {
    enterpriseLogger.info('Resetting database...');
    const resetResult = await resetDatabase();
    if (resetResult) {
      enterpriseLogger.info('Database reset completed successfully');
    } else {
      enterpriseLogger.error('Database reset failed');
    }
    process.exit(resetResult ? 0 : 1);
    break;
  }

  default:
    console.log('Usage: node migrate.js [migrate|seed|reset]');
    console.log(`Unknown command: ${command}`);
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    enterpriseLogger.error('Migration script failed', { error: error.message });
    process.exit(1);
  });
}

module.exports = {
  runMigrations,
  runSeedData,
  resetDatabase,
};