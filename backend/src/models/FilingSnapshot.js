// =====================================================
// FILING SNAPSHOT MODEL
// Stores immutable snapshots of filing data for versioning and audit
// =====================================================

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const FilingSnapshot = sequelize.define('FilingSnapshot', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    filingId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'filing_id',
        references: {
            model: 'itr_filings',
            key: 'id',
        },
        onDelete: 'CASCADE',
    },
    createdBy: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'created_by',
        references: {
            model: 'users',
            key: 'id',
        },
    },

    // versioning
    version: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    snapshotType: {
        type: DataTypes.ENUM('auto', 'manual', 'pre-submission', 'post-submission', 'restored'),
        defaultValue: 'auto',
        field: 'snapshot_type',
    },

    // Data Storage
    jsonPayload: {
        type: DataTypes.JSONB,
        allowNull: false,
        field: 'json_payload',
        comment: 'Full snapshot of the filing data including income, deductions, and metadata',
    },

    // Meta
    comment: {
        type: DataTypes.STRING,
        allowNull: true,
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
    tableName: 'filing_snapshots',
    timestamps: true,
    underscored: true,
    indexes: [
        {
            fields: ['filing_id'],
        },
        {
            fields: ['filing_id', 'version'],
            unique: true,
        },
    ],
});

module.exports = FilingSnapshot;
