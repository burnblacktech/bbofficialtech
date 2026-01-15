const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Deduction = sequelize.define('Deduction', {
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
    },
    financialYear: {
        type: DataTypes.STRING(10),
        allowNull: false,
        field: 'financial_year',
    },
    section: {
        type: DataTypes.STRING(20),
        allowNull: false,
    },
    deductionType: {
        type: DataTypes.STRING(50),
        allowNull: false,
        field: 'deduction_type',
        defaultValue: 'INVESTMENT',
    },
    deductionData: {
        type: DataTypes.JSONB,
        defaultValue: {},
        field: 'deduction_data',
    },
    amount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0,
    },
    verified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
}, {
    tableName: 'deductions',
    timestamps: true,
    underscored: true,
});

module.exports = Deduction;
