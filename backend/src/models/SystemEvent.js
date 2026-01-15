// =====================================================
// SYSTEM EVENT MODEL
// High-level system lifecycle events (maintenance, deployments, critical failures)
// =====================================================

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SystemEvent = sequelize.define('SystemEvent', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },

    // Event Classification
    type: {
        type: DataTypes.ENUM('DEPLOYMENT', 'MAINTENANCE', 'OUTAGE', 'INCIDENT', 'CRON_JOB'),
        allowNull: false,
    },
    severity: {
        type: DataTypes.ENUM('INFO', 'WARNING', 'CRITICAL', 'FATAL'),
        defaultValue: 'INFO',
    },

    // Details
    title: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
    },
    metadata: {
        type: DataTypes.JSONB,
        defaultValue: {},
    },

    // Duration (if applicable)
    startedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: 'started_at',
    },
    endedAt: {
        type: DataTypes.DATE,
        field: 'ended_at',
    },

    // Status
    status: {
        type: DataTypes.STRING, // e.g., 'SUCCESS', 'FAILED', 'IN_PROGRESS'
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
    tableName: 'system_events',
    timestamps: true,
    underscored: true,
    indexes: [
        {
            fields: ['type', 'started_at'],
        },
        {
            fields: ['severity'],
        },
    ],
});

module.exports = SystemEvent;
