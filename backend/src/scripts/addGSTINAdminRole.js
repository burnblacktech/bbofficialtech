#!/usr/bin/env node
// =====================================================
// ADD GSTIN_ADMIN ROLE TO DATABASE
// Adds the GSTIN_ADMIN value to the role ENUM type
// =====================================================

require('dotenv').config();

const { sequelize } = require('../config/database');

async function addGSTINAdminRole() {
    console.log('='.repeat(60));
    console.log('🔧 ADD GSTIN_ADMIN ROLE TO DATABASE');
    console.log('='.repeat(60));
    console.log('');

    try {
        console.log('📊 Connecting to database...');

        // Test connection
        await sequelize.authenticate();
        console.log('✅ Database connection established');
        console.log('');

        // Add GSTIN_ADMIN to the ENUM type
        console.log('🔄 Adding GSTIN_ADMIN to role ENUM...');

        // Check if the value already exists
        const [existingValues] = await sequelize.query(`
      SELECT enumlabel 
      FROM pg_enum 
      WHERE enumtypid = (
        SELECT oid 
        FROM pg_type 
        WHERE typname = 'enum_users_role'
      );
    `);

        const hasGSTINAdmin = existingValues.some(row => row.enumlabel === 'GSTIN_ADMIN');

        if (hasGSTINAdmin) {
            console.log('ℹ️  GSTIN_ADMIN role already exists in database');
        } else {
            // Add the new ENUM value
            await sequelize.query(`
        ALTER TYPE "public"."enum_users_role" ADD VALUE 'GSTIN_ADMIN';
      `);
            console.log('✅ GSTIN_ADMIN role added successfully');
        }

        console.log('');
        console.log('📋 Current role values:');
        const [currentValues] = await sequelize.query(`
      SELECT enumlabel 
      FROM pg_enum 
      WHERE enumtypid = (
        SELECT oid 
        FROM pg_type 
        WHERE typname = 'enum_users_role'
      )
      ORDER BY enumsortorder;
    `);
        currentValues.forEach(row => {
            console.log('   -', row.enumlabel);
        });

        console.log('');
        console.log('✅ Migration completed successfully!');
        console.log('');
        console.log('💡 You can now run: npm run gstin:create');

    } catch (error) {
        console.error('');
        console.error('❌ Migration failed:', error.message);
        console.error('');
        if (error.original) {
            console.error('Database error:', error.original.message);
        }
        console.error('Stack trace:', error.stack);
        process.exit(1);
    } finally {
        try {
            await sequelize.close();
            console.log('🔌 Database connection closed');
        } catch (closeError) {
            console.error('⚠️  Warning: Error closing database connection:', closeError.message);
        }
    }
}

// Run the migration
if (require.main === module) {
    addGSTINAdminRole()
        .then(() => {
            console.log('');
            console.log('👋 Migration script completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('');
            console.error('❌ Script failed:', error.message);
            process.exit(1);
        });
}

module.exports = { addGSTINAdminRole };
