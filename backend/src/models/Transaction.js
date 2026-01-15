// =====================================================
// TRANSACTION MODEL
// Granular financial transactions
// =====================================================

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Transaction = sequelize.define('Transaction', {
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

    // Source Account
    bankAccountId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'bank_account_id',
        references: {
            model: 'bank_accounts',
            key: 'id',
        },
        onDelete: 'SET NULL',
    },

    // Transaction Details
    transactionDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        field: 'transaction_date',
    },
    amount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
    },
    type: {
        type: DataTypes.ENUM('CREDIT', 'DEBIT'),
        allowNull: false,
    },

    // Categorization
    category: {
        type: DataTypes.STRING,
        defaultValue: 'UNCATEGORIZED',
    },
    description: {
        type: DataTypes.STRING,
    },
    narration: {
        type: DataTypes.STRING, // Raw bank statement narration
    },

    // Tax Relevance
    isTaxRelevant: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'is_tax_relevant',
    },
    taxCategory: {
        type: DataTypes.STRING, // e.g., 'SALARY', 'DIVIDEND', 'RENT'
        field: 'tax_category',
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
    tableName: 'transactions',
    timestamps: true,
    underscored: true,
    indexes: [
        {
            fields: ['user_id', 'transaction_date'],
        },
        {
            fields: ['bank_account_id'],
        },
    ],
});

module.exports = Transaction;
