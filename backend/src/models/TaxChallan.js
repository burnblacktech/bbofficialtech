// =====================================================
// TAX CHALLAN MODEL
// Records tax payments (Self Assessment/Advance Tax)
// =====================================================

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const TaxChallan = sequelize.define('TaxChallan', {
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
    filingId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'filing_id',
        references: {
            model: 'itr_filings',
            key: 'id',
        },
        onDelete: 'SET NULL',
    },

    // Challan Details
    bsrCode: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'bsr_code',
    },
    challanNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'challan_number',
    },
    tenderDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        field: 'tender_date',
    },

    // Payment Details
    amount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
    },
    taxType: {
        type: DataTypes.ENUM('ADVANCE_TAX_100', 'SELF_ASSESSMENT_300', 'REGULAR_ASSESSMENT_400'),
        allowNull: false,
        field: 'tax_type',
    },
    minorHead: {
        type: DataTypes.STRING, // usually same as taxType, kept for flexibility
        field: 'minor_head',
    },

    // Verification
    cin: {
        type: DataTypes.STRING, // Challan Identification Number (BSR + Date + Serial)
        comment: 'Derived unique key from BSR+Date+Serial',
    },
    isVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'is_verified',
    },
    verifiedAt: {
        type: DataTypes.DATE,
        field: 'verified_at',
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
    tableName: 'tax_challans',
    timestamps: true,
    underscored: true,
    indexes: [
        {
            fields: ['user_id', 'tender_date'],
        },
        {
            fields: ['filing_id'],
        },
        {
            unique: true,
            fields: ['bsr_code', 'challan_number', 'tender_date'],
        },
    ],
});

module.exports = TaxChallan;
