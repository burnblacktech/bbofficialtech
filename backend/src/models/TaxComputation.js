// =====================================================
// TAX COMPUTATION MODEL
// Persisted results of tax calculation engine
// =====================================================

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const TaxComputation = sequelize.define('TaxComputation', {
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
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'user_id',
        references: {
            model: 'users',
            key: 'id',
        },
    },

    // Inputs
    regime: {
        type: DataTypes.ENUM('OLD', 'NEW'),
        allowNull: false,
    },
    assessmentYear: {
        type: DataTypes.STRING(10),
        allowNull: false,
        field: 'assessment_year',
    },

    // Computed Values
    grossTotalIncome: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
        field: 'gross_total_income',
    },
    totalDeductions: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
        field: 'total_deductions',
    },
    totalTaxableIncome: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
        field: 'total_taxable_income',
    },

    // Tax Components
    taxOnIncome: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
        field: 'tax_on_income',
    },
    rebate87A: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
        field: 'rebate_87a',
    },
    surcharge: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
    },
    healthAndEducationCess: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
        field: 'health_education_cess',
    },
    totalTaxLiability: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
        field: 'total_tax_liability',
    },

    // Final Status
    tdsCredit: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
        field: 'tds_credit',
    },
    advanceTaxPaid: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
        field: 'advance_tax_paid',
    },
    selfAssessmentTaxPaid: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
        field: 'self_assessment_tax_paid',
    },

    refundDue: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
        field: 'refund_due',
    },
    taxPayable: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
        field: 'tax_payable',
    },

    // Metadata
    computationLog: {
        type: DataTypes.JSONB,
        defaultValue: {},
        field: 'computation_log',
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
    tableName: 'tax_computations',
    timestamps: true,
    underscored: true,
    indexes: [
        {
            fields: ['filing_id'],
        },
        {
            fields: ['user_id', 'assessment_year'],
        },
    ],
});

module.exports = TaxComputation;
