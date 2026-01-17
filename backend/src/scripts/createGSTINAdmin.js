#!/usr/bin/env node
// =====================================================
// CREATE GSTIN ADMIN SCRIPT
// Creates a GSTIN_ADMIN user if one doesn't exist
// =====================================================

// Load environment variables first
require('dotenv').config();

const { User } = require('../models');
const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');

// =====================================================
// CONFIGURATION
// =====================================================
const GSTIN_ADMIN_CONFIG = {
    email: 'gstin@burnblack.com',
    password: 'gstin123!@#', // Change this to a secure password
    fullName: 'GSTIN Admin',
};

// =====================================================
// MAIN EXECUTION FUNCTION
// =====================================================
async function createGSTINAdmin() {
    console.log('🚀 Starting GSTIN admin creation process...');
    console.log('📧 Admin Email:', GSTIN_ADMIN_CONFIG.email);
    console.log('👤 Admin Name:', GSTIN_ADMIN_CONFIG.fullName);
    console.log('');

    try {
        // Check if admin already exists
        const existingAdmins = await sequelize.query(
            `SELECT id, email, full_name, role, status FROM public.users WHERE email = :email LIMIT 1`,
            {
                replacements: { email: GSTIN_ADMIN_CONFIG.email.toLowerCase() },
                type: QueryTypes.SELECT,
            }
        );
        const existingAdmin = existingAdmins && existingAdmins.length > 0 ? existingAdmins[0] : null;

        if (existingAdmin) {
            console.log('⚠️  GSTIN admin user already exists!');
            console.log('');
            console.log('📋 Existing Admin Details:');
            console.log('   ID:', existingAdmin.id);
            console.log('   Email:', existingAdmin.email);
            console.log('   Name:', existingAdmin.full_name);
            console.log('   Role:', existingAdmin.role);
            console.log('   Status:', existingAdmin.status);
            console.log('');
            console.log('🔑 Login Credentials:');
            console.log('   Email:', GSTIN_ADMIN_CONFIG.email);
            console.log('   Password: (use existing password or reset it)');
            console.log('');
            return;
        }

        // Create the GSTIN admin using raw SQL
        console.log('👑 Creating GSTIN admin user...');
        const bcrypt = require('bcryptjs');
        const { v4: uuidv4 } = require('uuid');
        const passwordHash = await bcrypt.hash(GSTIN_ADMIN_CONFIG.password, 12);
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
                    email: GSTIN_ADMIN_CONFIG.email.toLowerCase(),
                    passwordHash: passwordHash,
                    fullName: GSTIN_ADMIN_CONFIG.fullName,
                    role: 'GSTIN_ADMIN',
                    authProvider: 'local',
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
        const gstinAdmin = createdUsers && createdUsers.length > 0 ? createdUsers[0] : null;

        if (!gstinAdmin) {
            throw new Error('Failed to retrieve created GSTIN admin user');
        }

        console.log('✅ GSTIN admin created successfully!');
        console.log('');
        console.log('📋 Admin Details:');
        console.log('   ID:', gstinAdmin.id);
        console.log('   Email:', gstinAdmin.email);
        console.log('   Name:', gstinAdmin.full_name);
        console.log('   Role:', gstinAdmin.role);
        console.log('   Status:', gstinAdmin.status);
        console.log('   Created:', gstinAdmin.created_at);
        console.log('');
        console.log('🎉 Process completed successfully!');
        console.log('');
        console.log('🔑 Login Credentials:');
        console.log('   Email:', GSTIN_ADMIN_CONFIG.email);
        console.log('   Password:', GSTIN_ADMIN_CONFIG.password);
        console.log('');
        console.log('⚠️  IMPORTANT: Change the admin password after first login!');
        console.log('');
        console.log('🌐 Access the GSTIN lookup page at: http://localhost:3000/gstin-lookup');

    } catch (error) {
        console.error('❌ Error during GSTIN admin creation:', error.message);
        if (error.original) {
            console.error('Database error:', error.original.message);
        }
        if (error.message.includes('unique') || error.message.includes('duplicate')) {
            console.log('');
            console.log('💡 The GSTIN admin user might already exist. Checking...');
            try {
                const existing = await sequelize.query(
                    `SELECT id, email, full_name, role, status FROM public.users WHERE email = :email LIMIT 1`,
                    {
                        replacements: { email: GSTIN_ADMIN_CONFIG.email.toLowerCase() },
                        type: QueryTypes.SELECT,
                    }
                );
                if (existing && existing.length > 0) {
                    console.log('✅ GSTIN admin user found!');
                    console.log('📋 Admin Details:');
                    console.log('   ID:', existing[0].id);
                    console.log('   Email:', existing[0].email);
                    console.log('   Name:', existing[0].full_name);
                    console.log('   Role:', existing[0].role);
                    console.log('   Status:', existing[0].status);
                    console.log('');
                    console.log('🔑 Login Credentials:');
                    console.log('   Email:', GSTIN_ADMIN_CONFIG.email);
                    console.log('   Password: (use existing password)');
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
    console.log('🔧 BURNBLACK CREATE GSTIN ADMIN');
    console.log('='.repeat(60));
    console.log('');

    // Validate configuration
    if (!GSTIN_ADMIN_CONFIG.email || !GSTIN_ADMIN_CONFIG.password) {
        console.error('❌ Error: Admin email and password must be configured');
        process.exit(1);
    }

    // Run the script
    createGSTINAdmin()
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
    createGSTINAdmin,
    GSTIN_ADMIN_CONFIG,
};
