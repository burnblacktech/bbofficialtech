// =====================================================
// MIGRATION: Add Gender Field to Users Table
// =====================================================
// Run this script to add gender column to users table
// Usage: node src/scripts/migrations/add-gender-to-users.js

const { sequelize } = require('../../config/database');
const enterpriseLogger = require('../../utils/logger');

async function addGenderToUsers() {
  try {
    enterpriseLogger.info('Adding gender field to users table...');
    console.log('\n=== Adding Gender Field to Users Table ===\n');

    // Check if gender column already exists
    const [columns] = await sequelize.query(`
      SELECT column_name, data_type, udt_name
      FROM information_schema.columns
      WHERE table_name = 'users'
      AND table_schema = 'public'
      AND column_name = 'gender'
    `);

    if (columns.length > 0) {
      console.log('✅ Gender column already exists in users table');
      console.log(`   Type: ${columns[0].udt_name || columns[0].data_type}`);
      
      // Check if it's the correct type
      const columnType = columns[0].udt_name || columns[0].data_type;
      if (columnType !== 'user_gender_enum') {
        console.log('⚠️  Gender column exists but with different type. Consider updating it.');
      }
      
      enterpriseLogger.info('Gender column already exists');
      process.exit(0);
    }

    // Create ENUM type if it doesn't exist
    console.log('Creating gender ENUM type...');
    try {
      await sequelize.query(`
        DO $$ BEGIN
          CREATE TYPE user_gender_enum AS ENUM ('MALE', 'FEMALE', 'OTHER');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `);
      console.log('✅ Created user_gender_enum type');
    } catch (error) {
      // Check if enum already exists with different values
      const [enumCheck] = await sequelize.query(`
        SELECT t.typname, e.enumlabel
        FROM pg_type t
        JOIN pg_enum e ON t.oid = e.enumtypid
        WHERE t.typname = 'user_gender_enum'
        ORDER BY e.enumsortorder
      `);
      
      if (enumCheck.length > 0) {
        const existingValues = enumCheck.map(e => e.enumlabel);
        console.log(`⚠️  ENUM type exists with values: ${existingValues.join(', ')}`);
        if (!existingValues.includes('MALE') || !existingValues.includes('FEMALE') || !existingValues.includes('OTHER')) {
          console.log('⚠️  ENUM values do not match expected values (MALE, FEMALE, OTHER)');
          console.log('   You may need to manually update the ENUM type');
        }
      } else {
        throw error;
      }
    }

    // Add gender column to users table
    console.log('Adding gender column to users table...');
    await sequelize.query(`
      ALTER TABLE users
      ADD COLUMN gender user_gender_enum NULL
    `);
    console.log('✅ Added gender column to users table');

    // Add comment
    try {
      await sequelize.query(`
        COMMENT ON COLUMN users.gender IS 'User gender for profile and tax calculations: MALE, FEMALE, or OTHER'
      `);
      console.log('✅ Added column comment');
    } catch (commentError) {
      console.warn('⚠️  Could not add comment (non-critical):', commentError.message);
    }

    // Check if we should add an index (optional, for filtering)
    console.log('Checking for gender index...');
    const [indexes] = await sequelize.query(`
      SELECT indexname
      FROM pg_indexes
      WHERE tablename = 'users'
      AND indexname = 'idx_users_gender'
    `);

    if (indexes.length === 0) {
      console.log('Creating index on gender column...');
      await sequelize.query(`
        CREATE INDEX idx_users_gender ON users(gender)
      `);
      console.log('✅ Created index on gender column');
    } else {
      console.log('✅ Gender index already exists');
    }

    enterpriseLogger.info('✅ Gender field added to users table successfully');
    console.log('\n✅ Migration completed successfully!');
    console.log('\nSummary:');
    console.log('  - Created user_gender_enum type (MALE, FEMALE, OTHER)');
    console.log('  - Added gender column to users table (nullable)');
    console.log('  - Created index on gender column');
    console.log('\nNote: Existing users will have NULL gender values.');
    console.log('      Update them through the profile API or admin panel.');
    
    process.exit(0);
  } catch (error) {
    enterpriseLogger.error('Migration failed', {
      error: error.message,
      stack: error.stack,
    });
    console.error('❌ Migration failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Run migration
addGenderToUsers();

