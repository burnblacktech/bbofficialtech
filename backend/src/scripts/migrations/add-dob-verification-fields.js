// =====================================================
// MIGRATION: Add DOB verification fields
// =====================================================
// Adds dob_verified and dob_verified_at to users and family_members
// Usage: node backend/src/scripts/migrations/add-dob-verification-fields.js

const { sequelize } = require('../../config/database');
const enterpriseLogger = require('../../utils/logger');
const { DataTypes } = require('sequelize');

async function addDOBVerificationFields() {
    try {
        enterpriseLogger.info('Starting DOB verification fields migration...');
        const queryInterface = sequelize.getQueryInterface();

        // 1. Update USERS table
        enterpriseLogger.info('Updating users table...');
        const userCols = await queryInterface.describeTable('users');

        if (!userCols.dob_verified) {
            await queryInterface.addColumn('users', 'dob_verified', {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
                allowNull: false
            });
            enterpriseLogger.info('Added dob_verified to users');
        }

        if (!userCols.dob_verified_at) {
            await queryInterface.addColumn('users', 'dob_verified_at', {
                type: DataTypes.DATE,
                allowNull: true
            });
            enterpriseLogger.info('Added dob_verified_at to users');
        }

        // 2. Update FAMILY_MEMBERS table
        enterpriseLogger.info('Updating family_members table...');
        const memberCols = await queryInterface.describeTable('family_members');

        if (!memberCols.dob_verified) {
            await queryInterface.addColumn('family_members', 'dob_verified', {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
                allowNull: false
            });
            enterpriseLogger.info('Added dob_verified to family_members');
        }

        if (!memberCols.dob_verified_at) {
            await queryInterface.addColumn('family_members', 'dob_verified_at', {
                type: DataTypes.DATE,
                allowNull: true
            });
            enterpriseLogger.info('Added dob_verified_at to family_members');
        }

        enterpriseLogger.info('DOB verification fields migration completed successfully');
        console.log('✅ DOB verification fields migration completed');

    } catch (error) {
        enterpriseLogger.error('DOB verification fields migration failed', {
            error: error.message,
            stack: error.stack
        });
        throw error;
    }
}

if (require.main === module) {
    addDOBVerificationFields()
        .then(async () => {
            await sequelize.close();
            process.exit(0);
        })
        .catch(async (error) => {
            console.error('Migration failed:', error);
            await sequelize.close();
            process.exit(1);
        });
}

module.exports = addDOBVerificationFields;
