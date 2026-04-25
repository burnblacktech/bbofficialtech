// =====================================================
// INVESTMENT ENTRY MODEL
// Tracks tax-saving investments (80C, 80CCD) for
// year-round deduction tracking and filing pre-fill.
// =====================================================

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const InvestmentEntry = sequelize.define('InvestmentEntry', {
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
  investmentType: {
    type: DataTypes.ENUM(
      'ppf', 'elss', 'nps', 'lic', 'sukanya',
      'tax_fd', 'ulip', 'other_80c', '80ccd_1b_nps'
    ),
    allowNull: false,
    field: 'investment_type',
  },
  amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    validate: { min: 0.01 },
  },
  dateOfInvestment: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'date_of_investment',
  },
  referenceNumber: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'reference_number',
  },
  deductionSection: {
    type: DataTypes.STRING(20),
    allowNull: false,
    field: 'deduction_section',
    comment: 'Auto-mapped: ppf/elss/lic→80C, 80ccd_1b_nps→80CCD(1B)',
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
  tableName: 'investment_entries',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['user_id', 'financial_year'] },
    { fields: ['user_id', 'deduction_section'] },
    { fields: ['date_of_investment'] },
  ],
});

module.exports = InvestmentEntry;
