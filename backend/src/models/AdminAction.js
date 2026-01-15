// =====================================================
// ADMIN ACTION MODEL
// Audit log for super-admin actions
// =====================================================

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AdminAction = sequelize.define('AdminAction', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    adminUserId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'admin_user_id',
        references: {
            model: 'users',
            key: 'id',
        },
    },

    // Action Details
    actionType: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'action_type',
    },
    targetType: {
        type: DataTypes.STRING, // schema/table name
        field: 'target_type',
    },
    targetId: {
        type: DataTypes.UUID,
        field: 'target_id',
    },

    // Changes
    changes: {
        type: DataTypes.JSONB,
        comment: 'Diff of changes made',
    },
    reason: {
        type: DataTypes.STRING,
    },
    ipAddress: {
        type: DataTypes.STRING,
        field: 'ip_address',
    },

    createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: 'created_at',
    },
}, {
    tableName: 'admin_actions',
    timestamps: true,
    updatedAt: false, // Immutable log
    underscored: true,
    indexes: [
        {
            fields: ['admin_user_id'],
        },
        {
            fields: ['action_type'],
        },
    ],
});

module.exports = AdminAction;
