#!/usr/bin/env node
// =====================================================
// RESET AND CREATE ADMIN SCRIPT
// Utility to completely reset users table and create SUPER_ADMIN
// =====================================================

const bcrypt = require('bcryptjs');
const { User } = require('../models');
const { sequelize } = require('../config/database');

// =====================================================
// CONFIGURATION
// =====================================================
const ADMIN_CONFIG = {
  email: 'admin@burnblack.com',
  password: 'admin123!@#', // Change this to a secure password
  fullName: 'Super Admin',
};

// =====================================================
// MAIN EXECUTION FUNCTION
// =====================================================
async function resetAndCreateAdmin() {
  console.log('🚀 Starting admin reset and creation process...');
  console.log('📧 Admin Email:', ADMIN_CONFIG.email);
  console.log('👤 Admin Name:', ADMIN_CONFIG.fullName);
  console.log('');

  try {
    // Step 1: Delete all users
    console.log('🗑️  Deleting all users...');
    await User.destroy({
      truncate: true,
      cascade: true,
    });
    console.log('✅ All users deleted successfully');
    console.log('');

    // Step 2: Create the super admin (password will be hashed by User model hook)
    console.log('👑 Creating super admin user...');
    const superAdmin = await User.create({
      email: ADMIN_CONFIG.email.toLowerCase(),
      passwordHash: ADMIN_CONFIG.password, // Will be hashed by User.beforeCreate hook
      fullName: ADMIN_CONFIG.fullName,
      role: 'SUPER_ADMIN',
      authProvider: 'LOCAL',
      status: 'active',
      emailVerified: true,
    });

    console.log('✅ Super admin created successfully!');
    console.log('');
    console.log('📋 Admin Details:');
    console.log('   ID:', superAdmin.id);
    console.log('   Email:', superAdmin.email);
    console.log('   Name:', superAdmin.fullName);
    console.log('   Role:', superAdmin.role);
    console.log('   Status:', superAdmin.status);
    console.log('   Created:', superAdmin.createdAt);
    console.log('');

    console.log('🎉 Process completed successfully!');
    console.log('');
    console.log('🔑 Login Credentials:');
    console.log('   Email:', ADMIN_CONFIG.email);
    console.log('   Password:', ADMIN_CONFIG.password);
    console.log('');
    console.log('⚠️  IMPORTANT: Change the admin password after first login!');

  } catch (error) {
    console.error('❌ Error during admin creation:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    // Step 4: Clean shutdown
    console.log('🔌 Closing database connection...');
    try {
      await sequelize.close();
      console.log('✅ Database connection closed');
    } catch (closeError) {
      console.error('⚠️  Warning: Error closing database connection:', closeError.message);
    }
    console.log('👋 Script execution completed');
  }
}

// =====================================================
// SCRIPT EXECUTION
// =====================================================
if (require.main === module) {
  console.log('='.repeat(60));
  console.log('🔧 BURNBACK ADMIN RESET UTILITY');
  console.log('='.repeat(60));
  console.log('');

  // Validate configuration
  if (!ADMIN_CONFIG.email || !ADMIN_CONFIG.password) {
    console.error('❌ Error: Admin email and password must be configured');
    process.exit(1);
  }

  // Run the script
  resetAndCreateAdmin()
    .then(() => {
      console.log('');
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('');
      console.error('❌ Script failed:', error.message);
      process.exit(1);
    });
}

// Export for potential use in other scripts
module.exports = {
  resetAndCreateAdmin,
  ADMIN_CONFIG,
};
