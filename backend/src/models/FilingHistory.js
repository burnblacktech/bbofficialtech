// =====================================================
// FILING HISTORY MODEL
// Audit trail for major filing state changes
// =====================================================

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const FilingHistory = sequelize.define('FilingHistory', {
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
    actorId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'actor_id',
        references: {
            model: 'users',
            key: 'id',
        },
    },

    // Change Details
    action: {
        type: DataTypes.STRING,
        allowNull: false, // e.g., 'STATUS_CHANGE', 'PAYLOAD_UPDATE', 'SUBMISSION'
    },
    previousState: {
        type: DataTypes.STRING,
        field: 'previous_state',
    },
    newState: {
        type: DataTypes.STRING,
        field: 'new_state',
    },
    metadata: {
        type: DataTypes.JSONB,
        defaultValue: {},
    },

    createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: 'created_at',
    },
}, {
    tableName: 'filing_histories',
    timestamps: true,
    updatedAt: false, // Immutable audit log
    underscored: true,
    indexes: [
        {
            fields: ['filing_id'],
        },
    ],
});

module.exports = FilingHistory;
