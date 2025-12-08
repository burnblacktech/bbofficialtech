#!/usr/bin/env node
// =====================================================
// RESET ADMIN PASSWORD SCRIPT
// Resets password for existing super admin user
// =====================================================

const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/database');

// =====================================================
// CONFIGURATION
// =====================================================
const ADMIN_CONFIG = {
  email: 'admin@burnblack.com',
  newPassword: 'admin123!@#', // Default password - change after first login
};

// =====================================================
// MAIN EXECUTION FUNCTION
// =====================================================
async function resetAdminPassword() {
  console.log('🚀 Starting admin password reset process...');
  console.log('📧 Admin Email:', ADMIN_CONFIG.email);
  console.log('');

  try {
    // Check if admin exists - explicitly use public.users schema
    const [existingAdmins] = await sequelize.query(
      `SELECT id, email, full_name, role, status FROM public.users WHERE email = :email LIMIT 1`,
      {
        replacements: { email: ADMIN_CONFIG.email.toLowerCase() },
      }
    );
    const existingAdmin = existingAdmins && existingAdmins.length > 0 ? existingAdmins[0] : null;

    if (!existingAdmin) {
      console.error('❌ Admin user not found!');
      console.error(`   Email: ${ADMIN_CONFIG.email}`);
      console.error('');
      console.error('💡 To create a new admin user, use: npm run admin:create');
      process.exit(1);
    }

    console.log('✅ Admin user found!');
    console.log('');
    console.log('📋 Admin Details:');
    console.log('   ID:', existingAdmin.id);
    console.log('   Email:', existingAdmin.email);
    console.log('   Name:', existingAdmin.full_name);
    console.log('   Role:', existingAdmin.role);
    console.log('   Status:', existingAdmin.status);
    console.log('');

    // Validate password
    if (!ADMIN_CONFIG.newPassword || ADMIN_CONFIG.newPassword.length < 8) {
      console.error('❌ Error: Password must be at least 8 characters long');
      process.exit(1);
    }

    // Hash the new password
    console.log('🔐 Hashing new password...');
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(ADMIN_CONFIG.newPassword, saltRounds);

    // Update the password - explicitly use public.users schema
    console.log('🔄 Updating admin password...');
    await sequelize.query(
      `UPDATE public.users 
       SET password_hash = :passwordHash, 
           updated_at = NOW() 
       WHERE email = :email`,
      {
        replacements: {
          email: ADMIN_CONFIG.email.toLowerCase(),
          passwordHash: passwordHash,
        },
      }
    );

    console.log('✅ Password reset successfully!');
    console.log('');
    console.log('🔑 New Login Credentials:');
    console.log('   Email:', ADMIN_CONFIG.email);
    console.log('   Password:', ADMIN_CONFIG.newPassword);
    console.log('');
    console.log('⚠️  IMPORTANT: Change the admin password after first login!');

  } catch (error) {
    console.error('❌ Error during password reset:', error.message);
    if (error.original) {
      console.error('Database error:', error.original.message);
    }
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    // Clean shutdown
    console.log('');
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
  console.log('🔧 BURNBACK RESET ADMIN PASSWORD');
  console.log('='.repeat(60));
  console.log('');

  // Validate configuration
  if (!ADMIN_CONFIG.email || !ADMIN_CONFIG.newPassword) {
    console.error('❌ Error: Admin email and new password must be configured');
    process.exit(1);
  }

  // Run the script
  resetAdminPassword()
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
  resetAdminPassword,
  ADMIN_CONFIG,
};

