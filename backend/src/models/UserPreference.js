// =====================================================
// USER PREFERENCE MODEL
// Stores user-specific settings and preferences
// =====================================================

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const UserPreference = sequelize.define('UserPreference', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'user_id',
        references: {
            model: 'users',
            key: 'id',
        },
        onDelete: 'CASCADE',
    },

    // UI/UX Preferences
    theme: {
        type: DataTypes.ENUM('light', 'dark', 'system'),
        defaultValue: 'system',
    },
    language: {
        type: DataTypes.STRING(10), // e.g., 'en-IN', 'hi-IN'
        defaultValue: 'en-IN',
    },

    // Notification Preferences
    emailNotifications: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'email_notifications',
    },
    smsNotifications: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'sms_notifications',
    },
    whatsappNotifications: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'whatsapp_notifications',
    },
    pushNotifications: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'push_notifications',
    },

    // Marketing Preferences
    marketingEmails: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'marketing_emails',
    },

    // Advanced Settings
    metadata: {
        type: DataTypes.JSONB,
        defaultValue: {},
    },

    createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: 'created_at',
    },
    updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: 'updated_at',
    },
}, {
    tableName: 'user_preferences',
    timestamps: true,
    underscored: true,
    indexes: [
        {
            unique: true,
            fields: ['user_id'],
        },
    ],
});

module.exports = UserPreference;
