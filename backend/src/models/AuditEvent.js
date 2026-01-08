// =====================================================
// AUDIT EVENT MODEL - CANONICAL SCHEMA v1.0
// Immutable, append-only audit trail
// =====================================================

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AuditEvent = sequelize.define('AuditEvent', {
    // =====================================================
    // IDENTITY
    // =====================================================
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },

    // =====================================================
    // WHAT HAPPENED?
    // =====================================================
    entityType: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'entity_type',
        comment: 'Type of entity: ITRFiling, User, CAFirm',
    },
    entityId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'entity_id',
        comment: 'ID of the entity that was acted upon',
    },
    eventType: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'event_type',
        comment: 'Type of event: FILING_REVIEWED, STATE_TRANSITION, etc.',
    },

    // =====================================================
    // WHO DID IT?
    // =====================================================
    actorId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id',
        },
        field: 'actor_id',
        comment: 'User who performed the action',
    },
    actorRole: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'actor_role',
        comment: 'Role of the actor at the time of action',
    },

    // =====================================================
    // CONTEXT
    // =====================================================
    metadata: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {},
        comment: 'Additional context: old/new values, reason, etc.',
    },

    // =====================================================
    // WHEN?
    // =====================================================
    createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'created_at',
    },
}, {
    tableName: 'audit_events',
    timestamps: false, // Only createdAt, no updatedAt (immutable)
    indexes: [
        {
            fields: ['entity_type', 'entity_id'],
        },
        {
            fields: ['actor_id'],
        },
        {
            fields: ['event_type'],
        },
        {
            fields: ['created_at'],
        },
        {
            fields: ['metadata'],
            using: 'gin',
        },
    ],
});

// =====================================================
// HARD RULES
// =====================================================

// Prevent updates - audit events are immutable
AuditEvent.beforeUpdate(() => {
    throw new Error('FATAL: Audit events are immutable - updates not allowed');
});

// Prevent deletes - audit events are append-only
AuditEvent.beforeDestroy(() => {
    throw new Error('FATAL: Audit events are append-only - deletes not allowed');
});

// =====================================================
// CLASS METHODS
// =====================================================

AuditEvent.logEvent = async function ({ entityType, entityId, eventType, actorId, actorRole, metadata = {} }) {
    return await this.create({
        entityType,
        entityId,
        eventType,
        actorId,
        actorRole,
        metadata,
    });
};

AuditEvent.getEntityHistory = async function (entityType, entityId) {
    return await this.findAll({
        where: {
            entityType,
            entityId,
        },
        order: [['created_at', 'ASC']],
    });
};

module.exports = AuditEvent;
