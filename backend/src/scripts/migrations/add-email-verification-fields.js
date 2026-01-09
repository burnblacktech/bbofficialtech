// =====================================================
// MIGRATION: Add Email Verification Fields to Users Table
// =====================================================
// Run this script to add email_verified and verification_token columns to users table
// Usage: node src/scripts/migrations/add-email-verification-fields.js

const { sequelize } = require('../../config/database');
const enterpriseLogger = require('../../utils/logger');

async function addEmailVerificationFields() {
    try {
        enterpriseLogger.info('Adding email verification fields to users table...');
        console.log('\n=== Adding Email Verification Fields to Users Table ===\n');

        // 1. Add email_verified column
        console.log('Checking for email_verified column...');
        const [emailVerifiedColumns] = await sequelize.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'users'
      AND table_schema = 'public'
      AND column_name = 'email_verified'
    `);

        if (emailVerifiedColumns.length === 0) {
            console.log('Adding email_verified column...');
            await sequelize.query(`
        ALTER TABLE users
        ADD COLUMN email_verified BOOLEAN DEFAULT FALSE
      `);
            console.log('✅ Added email_verified column');
        } else {
            console.log('✅ email_verified column already exists');
        }

        // 2. Add verification_token column
        console.log('Checking for verification_token column...');
        const [tokenColumns] = await sequelize.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'users'
      AND table_schema = 'public'
      AND column_name = 'verification_token'
    `);

        if (tokenColumns.length === 0) {
            console.log('Adding verification_token column...');
            await sequelize.query(`
        ALTER TABLE users
        ADD COLUMN verification_token VARCHAR(255)
      `);
            console.log('✅ Added verification_token column');
        } else {
            console.log('✅ verification_token column already exists');
        }

        // 3. Create index for verification_token
        console.log('Checking for verification_token index...');
        const [indexes] = await sequelize.query(`
      SELECT indexname
      FROM pg_indexes
      WHERE tablename = 'users'
      AND indexname = 'idx_users_verification_token'
    `);

        if (indexes.length === 0) {
            console.log('Creating index on verification_token...');
            await sequelize.query(`
        CREATE INDEX idx_users_verification_token ON users(verification_token)
      `);
            console.log('✅ Created index on verification_token');
        } else {
            console.log('✅ verification_token index already exists');
        }

        // 4. Update existing users to be verified (optional, but good for existing users)
        console.log('Marking existing users as verified...');
        await sequelize.query(`
      UPDATE users SET email_verified = TRUE WHERE email_verified IS NULL OR email_verified = FALSE
    `);
        console.log('✅ Marked existing users as verified');

        enterpriseLogger.info('✅ Email verification fields added successfully');
        console.log('\n✅ Migration completed successfully!');

        process.exit(0);
    } catch (error) {
        enterpriseLogger.error('Migration failed', {
            error: error.message,
            stack: error.stack,
        });
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    }
}

addEmailVerificationFields();
