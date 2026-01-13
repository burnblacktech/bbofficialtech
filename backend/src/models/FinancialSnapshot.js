// =====================================================
// FINANCIAL SNAPSHOT MODEL
// Stores yearly financial summaries for analytics
// =====================================================

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const FinancialSnapshot = sequelize.define('FinancialSnapshot', {
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
        onDelete: 'CASCADE',
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
    assessmentYear: {
        type: DataTypes.STRING(10),
        allowNull: false,
        field: 'assessment_year',
    },

    // Income breakdown
    totalIncome: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
        field: 'total_income',
    },
    salaryIncome: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
        field: 'salary_income',
    },
    businessIncome: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
        field: 'business_income',
    },
    rentalIncome: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
        field: 'rental_income',
    },
    capitalGains: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
        field: 'capital_gains',
    },
    otherIncome: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
        field: 'other_income',
    },

    // Tax details
    totalTaxPaid: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
        field: 'total_tax_paid',
    },
    tdsPaid: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
        field: 'tds_paid',
    },
    advanceTaxPaid: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
        field: 'advance_tax_paid',
    },
    effectiveTaxRate: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 0,
        field: 'effective_tax_rate',
    },

    // Deductions
    totalDeductions: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
        field: 'total_deductions',
    },
    section80C: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
        field: 'section_80c',
    },
    section80D: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
        field: 'section_80d',
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
    tableName: 'financial_snapshots',
    timestamps: true,
    underscored: true,
    indexes: [
        {
            unique: true,
            fields: ['user_id', 'assessment_year'],
        },
        {
            fields: ['user_id'],
        },
    ],
});

module.exports = FinancialSnapshot;
