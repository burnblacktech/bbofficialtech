/**
 * Financial Event Model
 * Tracks all financial actions (income added, deduction added, document uploaded, etc.)
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const FinancialEvent = sequelize.define('FinancialEvent', {
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
    },
    eventType: {
        type: DataTypes.STRING(50),
        allowNull: false,
        field: 'event_type',
        comment: 'income_added, deduction_added, document_uploaded, etc.',
    },
    eventDate: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'event_date',
    },
    entityType: {
        type: DataTypes.STRING(50),
        field: 'entity_type',
        comment: 'income_source, deduction, document',
    },
    entityId: {
        type: DataTypes.UUID,
        field: 'entity_id',
    },
    amount: {
        type: DataTypes.DECIMAL(15, 2),
    },
    description: {
        type: DataTypes.TEXT,
    },
    source: {
        type: DataTypes.STRING(50),
        comment: 'manual, ocr, api',
    },
    metadata: {
        type: DataTypes.JSONB,
        defaultValue: {},
    },
    createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'created_at',
    },
}, {
    tableName: 'financial_events',
    timestamps: true,
    updatedAt: false, // Events are immutable
    underscored: true,
    indexes: [
        {
            fields: ['user_id', 'event_date'],
        },
        {
            fields: ['event_type'],
        },
        {
            fields: ['entity_type', 'entity_id'],
        },
    ],
});

module.exports = FinancialEvent;
