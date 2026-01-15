// =====================================================
// TAX REFUND MODEL
// Tracks tax refund status from ITD
// =====================================================

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const TaxRefund = sequelize.define('TaxRefund', {
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

    // Details
    refundAmount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        field: 'refund_amount',
    },
    interestAmount: {
        type: DataTypes.DECIMAL(15, 2), // Interest u/s 244A
        defaultValue: 0,
        field: 'interest_amount',
    },
    totalRefund: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        field: 'total_refund',
    },

    // Status
    status: {
        type: DataTypes.ENUM('DETERMINED', 'ISSUED', 'FAILED', 'PAID', 'ADJUSTED'),
        defaultValue: 'DETERMINED',
    },
    issueDate: {
        type: DataTypes.DATEONLY,
        field: 'issue_date',
    },
    paymentDate: {
        type: DataTypes.DATEONLY,
        field: 'payment_date',
    },

    // Banking
    bankAccountNumber: {
        type: DataTypes.STRING,
        field: 'bank_account_number',
    },
    bankIfsc: {
        type: DataTypes.STRING,
        field: 'bank_ifsc',
    },
    paymentReference: {
        type: DataTypes.STRING, // UTR or Necs ref
        field: 'payment_reference',
    },
    failureReason: {
        type: DataTypes.STRING,
        field: 'failure_reason',
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
    tableName: 'tax_refunds',
    timestamps: true,
    underscored: true,
    indexes: [
        {
            fields: ['filing_id'],
        },
    ],
});

module.exports = TaxRefund;
