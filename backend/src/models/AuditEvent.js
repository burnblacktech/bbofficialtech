/**
 * AuditEvent.js
 * V4.2 Production Hardening
 * Immutable record of critical system events.
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AuditEvent = sequelize.define('AuditEvent', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    entityType: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'entity_type' // Explicit mapping
    },
    entityId: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'entity_id'
    },
    action: {
        type: DataTypes.STRING,
        allowNull: false
    },
    actorId: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'actor_id'
    },
    actorRole: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'actor_role'
    },
    payload: {
        type: DataTypes.JSONB,
        allowNull: true
    },
    ipAddress: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'ip_address'
    },
    timestamp: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'audit_events',
    timestamps: false,
    indexes: [
        { fields: ['entity_id'] }, // Use column name in index def if raw? No, sequelize abstracts this usually, but let's be safe.
        { fields: ['action'] },
        { fields: ['timestamp'] }
    ]
});

module.exports = AuditEvent;

