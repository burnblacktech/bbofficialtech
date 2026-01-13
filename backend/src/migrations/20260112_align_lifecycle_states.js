/**
 * Migration: Align Lifecycle States with Documentation
 * Date: 2026-01-12
 * 
 * Changes:
 * 1. Rename 'approved' to 'approved_by_ca'
 * 2. Add 'eri_in_progress' state
 * 
 * This migration aligns the database with 03_state_machine_and_lifecycle.md
 */

'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        const transaction = await queryInterface.sequelize.transaction();

        try {
            // Step 1: Add new enum values to the lifecycle_state type
            await queryInterface.sequelize.query(
                `ALTER TYPE "enum_itr_filings_lifecycle_state" ADD VALUE IF NOT EXISTS 'approved_by_ca';`,
                { transaction }
            );

            await queryInterface.sequelize.query(
                `ALTER TYPE "enum_itr_filings_lifecycle_state" ADD VALUE IF NOT EXISTS 'eri_in_progress';`,
                { transaction }
            );

            // Step 2: Update existing 'approved' records to 'approved_by_ca'
            await queryInterface.sequelize.query(
                `UPDATE itr_filings SET lifecycle_state = 'approved_by_ca' WHERE lifecycle_state = 'approved';`,
                { transaction }
            );

            console.log('✓ Migration completed: Lifecycle states aligned with documentation');
            console.log('  - Renamed approved → approved_by_ca');
            console.log('  - Added eri_in_progress state');

            await transaction.commit();
        } catch (error) {
            await transaction.rollback();
            console.error('✗ Migration failed:', error.message);
            throw error;
        }
    },

    down: async (queryInterface, Sequelize) => {
        const transaction = await queryInterface.sequelize.transaction();

        try {
            // Revert: Change approved_by_ca back to approved
            await queryInterface.sequelize.query(
                `UPDATE itr_filings SET lifecycle_state = 'approved' WHERE lifecycle_state = 'approved_by_ca';`,
                { transaction }
            );

            // Note: Cannot remove enum values in PostgreSQL without recreating the type
            // This is acceptable as the old values won't be used

            console.log('✓ Rollback completed: Reverted to old state names');

            await transaction.commit();
        } catch (error) {
            await transaction.rollback();
            console.error('✗ Rollback failed:', error.message);
            throw error;
        }
    }
};
