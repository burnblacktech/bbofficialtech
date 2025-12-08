#!/usr/bin/env node
// =====================================================
// CREATE SUPER ADMIN SCRIPT
// Creates a SUPER_ADMIN user if one doesn't exist
// Does NOT delete existing users
// =====================================================

// Load environment variables first (to use same connection as server)
require('dotenv').config();

const { User } = require('../models');
const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');

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
async function createSuperAdmin() {
  console.log('🚀 Starting super admin creation process...');
  console.log('📧 Admin Email:', ADMIN_CONFIG.email);
  console.log('👤 Admin Name:', ADMIN_CONFIG.fullName);
  console.log('');

  try {
    // Check if admin already exists (using raw query to avoid column issues)
    // Explicitly use public.users schema
    const existingAdmins = await sequelize.query(
      `SELECT id, email, full_name, role, status FROM public.users WHERE email = :email LIMIT 1`,
      {
        replacements: { email: ADMIN_CONFIG.email.toLowerCase() },
        type: QueryTypes.SELECT,
      }
    );
    const existingAdmin = existingAdmins && existingAdmins.length > 0 ? existingAdmins[0] : null;

    if (existingAdmin) {
      console.log('⚠️  Admin user already exists!');
      console.log('');
      console.log('📋 Existing Admin Details:');
      console.log('   ID:', existingAdmin.id);
      console.log('   Email:', existingAdmin.email);
      console.log('   Name:', existingAdmin.full_name);
      console.log('   Role:', existingAdmin.role);
      console.log('   Status:', existingAdmin.status);
      console.log('');
      console.log('🔑 Login Credentials:');
      console.log('   Email:', ADMIN_CONFIG.email);
      console.log('   Password: (use existing password or reset it)');
      console.log('');
      console.log('💡 To reset the admin password, use: npm run admin:reset');
      return;
    }

    // Create the super admin using raw SQL to avoid column issues
    console.log('👑 Creating super admin user...');
    const bcrypt = require('bcryptjs');
    const { v4: uuidv4 } = require('uuid');
    const passwordHash = await bcrypt.hash(ADMIN_CONFIG.password, 12);
    const userId = uuidv4();
    
    await sequelize.query(
      `INSERT INTO public.users (
        id, email, password_hash, full_name, role, auth_provider, 
        status, email_verified, created_at, updated_at
      ) VALUES (
        :id, :email, :passwordHash, :fullName, :role, :authProvider,
        :status, :emailVerified, NOW(), NOW()
      )`,
      {
        replacements: {
          id: userId,
          email: ADMIN_CONFIG.email.toLowerCase(),
          passwordHash: passwordHash,
          fullName: ADMIN_CONFIG.fullName,
          role: 'SUPER_ADMIN',
          authProvider: 'LOCAL',
          status: 'active',
          emailVerified: true,
        },
      }
    );
    
    // Fetch the created user
    const createdUsers = await sequelize.query(
      `SELECT id, email, full_name, role, status, created_at FROM public.users WHERE id = :id`,
      {
        replacements: { id: userId },
        type: QueryTypes.SELECT,
      }
    );
    const superAdmin = createdUsers && createdUsers.length > 0 ? createdUsers[0] : null;
    
    if (!superAdmin) {
      throw new Error('Failed to retrieve created admin user');
    }

    console.log('✅ Super admin created successfully!');
    console.log('');
    console.log('📋 Admin Details:');
    console.log('   ID:', superAdmin.id);
    console.log('   Email:', superAdmin.email);
    console.log('   Name:', superAdmin.full_name);
    console.log('   Role:', superAdmin.role);
    console.log('   Status:', superAdmin.status);
    console.log('   Created:', superAdmin.created_at);
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
    if (error.original) {
      console.error('Database error:', error.original.message);
    }
    if (error.message.includes('unique') || error.message.includes('duplicate')) {
      console.log('');
      console.log('💡 The admin user might already exist. Checking...');
      try {
        const existing = await sequelize.query(
          `SELECT id, email, full_name, role, status FROM public.users WHERE email = :email LIMIT 1`,
          {
            replacements: { email: ADMIN_CONFIG.email.toLowerCase() },
            type: QueryTypes.SELECT,
          }
        );
        if (existing && existing.length > 0) {
          console.log('✅ Admin user found!');
          console.log('📋 Admin Details:');
          console.log('   ID:', existing[0].id);
          console.log('   Email:', existing[0].email);
          console.log('   Name:', existing[0].full_name);
          console.log('   Role:', existing[0].role);
          console.log('   Status:', existing[0].status);
          console.log('');
          console.log('🔑 Login Credentials:');
          console.log('   Email:', ADMIN_CONFIG.email);
          console.log('   Password: (use existing password or reset with: npm run admin:reset)');
          await sequelize.close();
          process.exit(0);
        }
      } catch (checkError) {
        console.error('Error checking for existing admin:', checkError.message);
      }
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
  console.log('🔧 BURNBACK CREATE SUPER ADMIN');
  console.log('='.repeat(60));
  console.log('');

  // Validate configuration
  if (!ADMIN_CONFIG.email || !ADMIN_CONFIG.password) {
    console.error('❌ Error: Admin email and password must be configured');
    process.exit(1);
  }

  // Run the script
  createSuperAdmin()
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
  createSuperAdmin,
  ADMIN_CONFIG,
};

