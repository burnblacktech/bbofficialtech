/**
 * Migration: Add verified_pans column to users table
 * Date: 2026-01-13
 * Description: Adds JSONB column to store multiple verified PANs with labels
 */

'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addColumn('users', 'verified_pans', {
            type: Sequelize.JSONB,
            allowNull: false,
            defaultValue: [],
            comment: 'Array of verified PANs with labels for multi-PAN support',
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeColumn('users', 'verified_pans');
    },
};
