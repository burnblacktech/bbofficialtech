const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const VaultDocument = sequelize.define('VaultDocument', {
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
  memberId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'member_id',
    comment: 'Optional: for family member documents',
  },
  s3Key: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    field: 's3_key',
  },
  fileName: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'file_name',
  },
  fileSize: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'file_size',
    comment: 'Bytes',
  },
  mimeType: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'mime_type',
  },
  category: {
    type: DataTypes.ENUM('salary', 'investments', 'insurance', 'rent', 'donations', 'medical', 'capital_gains', 'business', 'other'),
    allowNull: false,
  },
  financialYear: {
    type: DataTypes.STRING(7),
    allowNull: false,
    field: 'financial_year',
    comment: 'e.g., 2024-25',
  },
  expiryDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'expiry_date',
  },
  ocrStatus: {
    type: DataTypes.ENUM('pending', 'completed', 'failed', 'not_applicable'),
    defaultValue: 'not_applicable',
    field: 'ocr_status',
  },
  ocrData: {
    type: DataTypes.JSONB,
    defaultValue: {},
    field: 'ocr_data',
  },
  ocrRawText: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'ocr_raw_text',
  },
  usedInFilings: {
    type: DataTypes.JSONB,
    defaultValue: [],
    field: 'used_in_filings',
    comment: '[{ filingId, assessmentYear, importedAt }]',
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {},
  },
}, {
  tableName: 'vault_documents',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['user_id', 'financial_year'] },
    { fields: ['user_id', 'category'] },
    { fields: ['s3_key'], unique: true },
    { fields: ['expiry_date'] },
  ],
});

module.exports = VaultDocument;
