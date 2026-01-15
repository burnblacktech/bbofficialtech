const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const IncomeSource = sequelize.define('IncomeSource', {
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
    sourceType: {
        type: DataTypes.STRING(50),
        allowNull: false,
        field: 'source_type',
    },
    sourceData: {
        type: DataTypes.JSONB,
        defaultValue: {},
        field: 'source_data',
    },
    amount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0,
    },
    dataSource: {
        type: DataTypes.STRING(20),
        defaultValue: 'MANUAL',
        field: 'data_source',
    },
    verified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
}, {
    tableName: 'income_sources',
    timestamps: true,
    underscored: true,
});

module.exports = IncomeSource;
