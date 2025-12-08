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
const RefundTracking = require('../models/RefundTracking');

// Helper function to safely sync tables (handles policy/RLS issues)
const safeSyncTable = async (model, modelName, options = {}) => {
  try {
    await model.sync({ force: false, alter: true, ...options });
    enterpriseLogger.info(`${modelName} table synced`);
    return true;
  } catch (error) {
    const errorMsg = error.message.toLowerCase();
    
    // Handle policy-related errors (Supabase RLS)
    if (errorMsg.includes('policy') || 
        errorMsg.includes('cannot alter type of a column used in a policy') ||
        errorMsg.includes('row-level security')) {
      enterpriseLogger.warn(`${modelName} sync with alter failed due to policy/RLS, trying without alter:`, error.message);
      try {
        await model.sync({ force: false, alter: false, ...options });
        enterpriseLogger.info(`${modelName} table verified (without alter)`);
        return true;
      } catch (syncError) {
        enterpriseLogger.warn(`${modelName} sync failed but continuing:`, syncError.message);
        return false; // Don't throw - continue migration
      }
    }
    
    // Handle SQL syntax errors (USING clause, type conversion issues)
    if (errorMsg.includes('syntax error') ||
        errorMsg.includes('near "using"') ||
        errorMsg.includes('using clause') ||
        errorMsg.includes('cannot be cast') ||
        errorMsg.includes('type conversion')) {
      enterpriseLogger.warn(`${modelName} sync with alter failed due to SQL syntax/type conversion, trying without alter:`, error.message);
      try {
        await model.sync({ force: false, alter: false, ...options });
        enterpriseLogger.info(`${modelName} table verified (without alter)`);
        return true;
      } catch (syncError) {
        enterpriseLogger.warn(`${modelName} sync failed but continuing:`, syncError.message);
        return false;
      }
    }
    
    // Handle other common errors
    if (errorMsg.includes('unterminated quoted string') || 
        errorMsg.includes('comment') ||
        errorMsg.includes('enum')) {
      enterpriseLogger.warn(`${modelName} sync with alter failed, trying without alter:`, error.message);
      try {
        await model.sync({ force: false, alter: false, ...options });
        enterpriseLogger.info(`${modelName} table verified (without alter)`);
        return true;
      } catch (syncError) {
        enterpriseLogger.warn(`${modelName} sync failed but continuing:`, syncError.message);
        return false;
      }
    }
    
    // For other errors, throw
    throw error;
  }
};

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
      
      // Manually add missing columns that might not be synced properly
      await addMissingUserColumns(queryInterface);
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
    await safeSyncTable(UserSession, 'User Sessions');
    await safeSyncTable(UserProfile, 'User Profiles');
    await safeSyncTable(AuditLog, 'Audit Logs');
    await safeSyncTable(PasswordResetToken, 'Password Reset Tokens');
    await safeSyncTable(AccountLinkingToken, 'Account Linking Tokens');
    await safeSyncTable(Invite, 'Invites');

    // 4. Family members (depends on User)
    try {
      const tables = await queryInterface.showAllTables();
      if (tables.includes('family_members')) {
        const currentColumns = await queryInterface.describeTable('family_members');
        const modelAttributes = FamilyMember.rawAttributes;
        const { DataTypes } = require('sequelize');
        
        // Fix ENUM columns before adding new ones or syncing
        const enumColumns = {
          relationship: { values: ['self', 'spouse', 'son', 'daughter', 'father', 'mother', 'other'], defaultValue: 'other' },
          gender: { values: ['male', 'female', 'other'], defaultValue: null },
          marital_status: { values: ['single', 'married', 'widow', 'divorced'], defaultValue: null },
          client_type: { values: ['family', 'ca_client'], defaultValue: 'family' },
          status: { values: ['active', 'inactive', 'archived'], defaultValue: 'active' },
        };
        
        for (const [columnName, enumDef] of Object.entries(enumColumns)) {
          if (currentColumns[columnName]) {
            try {
              // Drop default first to avoid casting issues
              await sequelize.query(`ALTER TABLE family_members ALTER COLUMN ${columnName} DROP DEFAULT;`);
              enterpriseLogger.info(`Dropped default for ${columnName}`);
            } catch (dropError) {
              // Default might not exist, that's okay
              if (!dropError.message.includes('does not exist')) {
                enterpriseLogger.warn(`Could not drop default for ${columnName}:`, dropError.message);
              }
            }
          }
        }
        
        // Add missing columns
        for (const [attrName, attrDef] of Object.entries(modelAttributes)) {
          const dbColumnName = attrDef.field || attrName;
          if (!currentColumns[dbColumnName] && dbColumnName !== 'id' && dbColumnName !== 'created_at' && dbColumnName !== 'updated_at') {
            enterpriseLogger.info(`Adding missing column to family_members: ${dbColumnName}`);
            try {
              const columnDef = {
                type: attrDef.type,
                allowNull: attrDef.allowNull !== false,
              };
              
              // Handle default values (but skip for now, we'll add them after ENUM fix)
              // if (attrDef.defaultValue !== undefined) {
              //   columnDef.defaultValue = attrDef.defaultValue;
              // }
              
              await queryInterface.addColumn('family_members', dbColumnName, columnDef);
              enterpriseLogger.info(`Column ${dbColumnName} added to family_members`);
            } catch (addError) {
              if (addError.message.includes('already exists') || addError.message.includes('duplicate')) {
                enterpriseLogger.info(`Column ${dbColumnName} already exists in family_members`);
              } else {
                enterpriseLogger.warn(`Could not add column ${dbColumnName} to family_members:`, addError.message);
              }
            }
          }
        }
      }
      
      // Re-add defaults after dropping them
      const updatedColumns = await queryInterface.describeTable('family_members');
      const enumDefaults = {
        relationship: 'other',
        client_type: 'family',
        status: 'active',
      };
      
      for (const [columnName, defaultValue] of Object.entries(enumDefaults)) {
        if (updatedColumns[columnName]) {
          try {
            await sequelize.query(`ALTER TABLE family_members ALTER COLUMN ${columnName} SET DEFAULT '${defaultValue}';`);
            enterpriseLogger.info(`Set default for ${columnName}`);
          } catch (defaultError) {
            // Ignore errors - default might already be set or column might not support it
            if (!defaultError.message.includes('already') && !defaultError.message.includes('does not exist')) {
              enterpriseLogger.warn(`Could not set default for ${columnName}:`, defaultError.message);
            }
          }
        }
      }
      
      // Now sync without alter to avoid ENUM casting issues
      // This will just verify table structure and create missing indexes
      try {
        await FamilyMember.sync({ force: false, alter: false });
        enterpriseLogger.info('Family members table verified');
      } catch (syncError) {
        // If sync fails, it's likely because of missing indexes - that's okay, we'll create them manually
        if (syncError.message.includes('does not exist') || syncError.message.includes('relation')) {
          enterpriseLogger.warn('Family members table sync warning (likely missing indexes):', syncError.message);
        } else {
          // For other errors, log but continue
          enterpriseLogger.warn('Family members sync had issues but continuing:', syncError.message);
        }
      }
      
      // Manually create indexes if they don't exist
      try {
        const indexColumns = ['firm_id', 'client_type', 'status'];
        for (const col of indexColumns) {
          if (updatedColumns[col]) {
            try {
              await queryInterface.addIndex('family_members', [col], {
                name: `family_members_${col}_index`,
              });
              enterpriseLogger.info(`Index created on family_members.${col}`);
            } catch (idxError) {
              if (!idxError.message.includes('already exists')) {
                enterpriseLogger.warn(`Could not create index on ${col}:`, idxError.message);
              }
            }
          }
        }
        
        // Composite index
        if (updatedColumns['user_id'] && updatedColumns['client_type']) {
          try {
            await queryInterface.addIndex('family_members', ['user_id', 'client_type'], {
              name: 'family_members_user_id_client_type_index',
            });
            enterpriseLogger.info('Composite index created on family_members');
          } catch (idxError) {
            if (!idxError.message.includes('already exists')) {
              enterpriseLogger.warn('Could not create composite index:', idxError.message);
            }
          }
        }
      } catch (indexError) {
        enterpriseLogger.warn('Index creation had issues:', indexError.message);
      }
      
      enterpriseLogger.info('Family members table synced');
    } catch (error) {
      // Final fallback - just log and continue
      if (error.message.includes('unterminated quoted string') || 
          error.message.includes('comment') ||
          error.message.includes('does not exist') ||
          error.message.includes('cannot be cast') ||
          error.message.includes('enum')) {
        enterpriseLogger.warn('Family members sync had issues but continuing:', error.message);
        // Don't throw - let migration continue
      } else {
        throw error;
      }
    }

    // 5. ITR-related tables (depend on User)
    await safeSyncTable(ITRFiling, 'ITR filings');
    await safeSyncTable(ITRDraft, 'ITR drafts');
    
    // Refund tracking (depends on ITRFiling)
    await safeSyncTable(RefundTracking, 'Refund tracking');

    // 6. Documents (depends on User) - may have RLS policies
    await safeSyncTable(Document, 'Documents');

    // 7. Service tickets (depends on User)
    await safeSyncTable(ServiceTicket, 'Service tickets');
    await safeSyncTable(ServiceTicketMessage, 'Service ticket messages');

    // 8. Invoices (depends on User)
    await safeSyncTable(Invoice, 'Invoices');

  } catch (error) {
    enterpriseLogger.error('Failed to create tables in order', { error: error.message, stack: error.stack });
    throw error;
  }
};

const addMissingUserColumns = async (queryInterface) => {
  try {
    const { DataTypes } = require('sequelize');
    const tableDescription = await queryInterface.describeTable('users');
    
    // Add pan_number column if it doesn't exist
    if (!tableDescription.pan_number) {
      enterpriseLogger.info('Adding pan_number column to users table...');
      await queryInterface.addColumn('users', 'pan_number', {
        type: DataTypes.STRING(10),
        allowNull: true,
      });
    }
    
    // Add pan_verified column if it doesn't exist
    if (!tableDescription.pan_verified) {
      enterpriseLogger.info('Adding pan_verified column to users table...');
      await queryInterface.addColumn('users', 'pan_verified', {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      });
    }
    
    // Add pan_verified_at column if it doesn't exist
    if (!tableDescription.pan_verified_at) {
      enterpriseLogger.info('Adding pan_verified_at column to users table...');
      await queryInterface.addColumn('users', 'pan_verified_at', {
        type: DataTypes.DATE,
        allowNull: true,
      });
    }
    
    // Add last_login_at column if it doesn't exist
    if (!tableDescription.last_login_at) {
      enterpriseLogger.info('Adding last_login_at column to users table...');
      await queryInterface.addColumn('users', 'last_login_at', {
        type: DataTypes.DATE,
        allowNull: true,
      });
    }
    
    // Add onboarding_completed column if it doesn't exist
    if (!tableDescription.onboarding_completed) {
      enterpriseLogger.info('Adding onboarding_completed column to users table...');
      await queryInterface.addColumn('users', 'onboarding_completed', {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      });
    }

    // Add date_of_birth column if it doesn't exist
    if (!tableDescription.date_of_birth) {
      enterpriseLogger.info('Adding date_of_birth column to users table...');
      await queryInterface.addColumn('users', 'date_of_birth', {
        type: DataTypes.DATEONLY,
        allowNull: true,
      });
    }

    // Add metadata column if it doesn't exist
    if (!tableDescription.metadata) {
      enterpriseLogger.info('Adding metadata column to users table...');
      await queryInterface.addColumn('users', 'metadata', {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: {},
      });
      // Add GIN index for metadata column
      try {
        enterpriseLogger.info('Adding GIN index for metadata column...');
        await queryInterface.addIndex('users', ['metadata'], {
          using: 'gin',
          name: 'idx_users_metadata_gin',
          concurrently: false,
        });
      } catch (indexError) {
        // Index might already exist, ignore
        if (!indexError.message.includes('already exists')) {
          enterpriseLogger.warn('Could not add metadata index:', indexError.message);
        }
      }
    }
    
    enterpriseLogger.info('Missing user columns added successfully');
  } catch (error) {
    // Ignore errors if columns already exist
    if (error.message.includes('already exists') || error.message.includes('duplicate')) {
      enterpriseLogger.info('User columns already exist, skipping...');
    } else {
      enterpriseLogger.error('Failed to add missing user columns', { error: error.message });
      throw error;
    }
  }
};

const addIndexes = async () => {
  try {
    const queryInterface = sequelize.getQueryInterface();

    // Check if family_members table exists and get its columns
    const tables = await queryInterface.showAllTables();
    let familyMembersColumns = {};
    if (tables.includes('family_members')) {
      familyMembersColumns = await queryInterface.describeTable('family_members');
    }

    // Add indexes for family_members table (skip if they already exist or column doesn't exist)
    if (familyMembersColumns.pan_number) {
      try {
        await queryInterface.addIndex('family_members', ['pan_number'], {
          unique: true,
          name: 'family_members_pan_number_unique',
        });
        enterpriseLogger.info('Index created: family_members_pan_number_unique');
      } catch (e) {
        if (!e.message.includes('already exists')) {
          enterpriseLogger.warn(`Could not create pan_number index: ${e.message}`);
        }
      }
    }

    if (familyMembersColumns.user_id) {
      try {
        await queryInterface.addIndex('family_members', ['user_id'], {
          name: 'family_members_user_id_index',
        });
        enterpriseLogger.info('Index created: family_members_user_id_index');
      } catch (e) {
        if (!e.message.includes('already exists')) {
          enterpriseLogger.warn(`Could not create user_id index: ${e.message}`);
        }
      }
    }

    if (familyMembersColumns.relationship) {
      try {
        await queryInterface.addIndex('family_members', ['relationship'], {
          name: 'family_members_relationship_index',
        });
        enterpriseLogger.info('Index created: family_members_relationship_index');
      } catch (e) {
        if (!e.message.includes('already exists')) {
          enterpriseLogger.warn(`Could not create relationship index: ${e.message}`);
        }
      }
    }

    // Only create is_dependent index if column exists
    if (familyMembersColumns.is_dependent) {
      try {
        await queryInterface.addIndex('family_members', ['is_dependent'], {
          name: 'family_members_is_dependent_index',
        });
        enterpriseLogger.info('Index created: family_members_is_dependent_index');
      } catch (e) {
        if (!e.message.includes('already exists')) {
          enterpriseLogger.warn(`Could not create is_dependent index: ${e.message}`);
        }
      }
    } else {
      enterpriseLogger.info('Skipping is_dependent index - column does not exist');
    }

    enterpriseLogger.info('Indexes added successfully');
  } catch (error) {
    enterpriseLogger.error('Failed to add indexes', { error: error.message });
    // Don't throw - just log the error and continue
    enterpriseLogger.warn('Continuing migration despite index creation issues');
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