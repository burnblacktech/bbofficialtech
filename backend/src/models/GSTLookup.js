const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const GSTLookup = sequelize.define('GSTLookup', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  gstin: {
    type: DataTypes.STRING(15),
    allowNull: false,
    unique: true,
  },
  businessName: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'business_name',
  },
  legalName: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'legal_name',
  },
  status: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  registrationDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'registration_date',
  },
  lastUpdatedDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'last_updated_date',
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  stateCode: {
    type: DataTypes.STRING(2),
    allowNull: true,
    field: 'state_code',
  },
  constitutionOfBusiness: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'constitution_of_business',
  },
  taxpayerType: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'taxpayer_type',
  },
  gstinStatus: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'gstin_status',
  },
  cancellationDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'cancellation_date',
  },
  rawResponse: {
    type: DataTypes.JSONB,
    allowNull: true,
    field: 'raw_response',
  },
  fetchedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'fetched_at',
  },
}, {
  tableName: 'gst_lookups',
  timestamps: true,
  underscored: true,
  indexes: [
    { unique: true, fields: ['gstin'] },
    { fields: ['fetched_at'] },
  ],
});

module.exports = GSTLookup;
