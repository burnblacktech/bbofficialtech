// =====================================================
// INCOME ENTRY MODEL
// Tracks individual income events (salary, freelance,
// rental, etc.) for year-round financial tracking.
// =====================================================

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const IncomeEntry = sequelize.define('IncomeEntry', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'user_id',
  },
  sourceType: {
    type: DataTypes.ENUM('salary', 'freelance', 'rental', 'interest', 'dividend', 'capital_gain', 'other'),
    allowNull: false,
    field: 'source_type',
  },
  amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    validate: { min: 0.01 },
  },
  dateReceived: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'date_received',
  },
  description: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  financialYear: {
    type: DataTypes.STRING(7),
    allowNull: false,
    field: 'financial_year',
  },
  usedInFilingId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'used_in_filing_id',
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {},
  },
}, {
  tableName: 'income_entries',
  timestamps: true,
  underscored: true,
  paranoid: true,
  indexes: [
    { fields: ['user_id', 'financial_year'] },
    { fields: ['user_id', 'source_type'] },
    { fields: ['date_received'] },
  ],
});

module.exports = IncomeEntry;
