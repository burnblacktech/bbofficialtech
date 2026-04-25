// =====================================================
// EXPENSE ENTRY MODEL
// Tracks tax-relevant expenses (rent, medical,
// donations, etc.) for year-round deduction tracking.
// =====================================================

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ExpenseEntry = sequelize.define('ExpenseEntry', {
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
  category: {
    type: DataTypes.ENUM('rent', 'medical', 'donations', 'education_loan', 'insurance', 'other'),
    allowNull: false,
  },
  amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    validate: { min: 0.01 },
  },
  datePaid: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'date_paid',
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
  deductionSection: {
    type: DataTypes.STRING(20),
    allowNull: true,
    field: 'deduction_section',
    comment: 'Auto-mapped: rent→HRA, medical→80D, donations→80G, etc.',
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
  tableName: 'expense_entries',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['user_id', 'financial_year'] },
    { fields: ['user_id', 'category'] },
    { fields: ['date_paid'] },
  ],
});

module.exports = ExpenseEntry;
