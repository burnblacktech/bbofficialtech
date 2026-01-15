// =====================================================
// INVESTMENT MODEL
// Investment records for deductions and capital gains
// =====================================================

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Investment = sequelize.define('Investment', {
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

    // Classification
    type: {
        type: DataTypes.ENUM(
            'MUTUAL_FUND', 'STOCK', 'FD', 'PPF', 'NPS', 'INSURANCE', 'REAL_ESTATE', 'GOLD', 'OTHER'
        ),
        allowNull: false,
    },
    category: {
        type: DataTypes.ENUM('DEDUCTION_80C', 'CAPITAL_ASSET', 'EXEMPT_INCOME'),
        allowNull: false,
    },

    // Details
    assetName: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'asset_name',
    },
    folioNumber: {
        type: DataTypes.STRING,
        field: 'folio_number',
    },

    // Valuation
    purchaseDate: {
        type: DataTypes.DATEONLY,
        field: 'purchase_date',
    },
    purchasePrice: {
        type: DataTypes.DECIMAL(15, 2),
        field: 'purchase_price',
    },
    currentValue: {
        type: DataTypes.DECIMAL(15, 2),
        field: 'current_value',
    },

    // Proof
    documentId: {
        type: DataTypes.UUID,
        field: 'document_id',
        references: {
            model: 'documents',
            key: 'id',
        },
        onDelete: 'SET NULL',
    },
    isVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'is_verified',
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
    tableName: 'investments',
    timestamps: true,
    underscored: true,
    indexes: [
        {
            fields: ['user_id', 'type'],
        },
    ],
});

module.exports = Investment;
