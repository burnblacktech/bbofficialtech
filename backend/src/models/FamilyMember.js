const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const FamilyMember = sequelize.define('FamilyMember', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'user_id',
    comment: 'Primary account holder',
  },
  pan: {
    type: DataTypes.STRING(10),
    allowNull: false,
    validate: { is: /^[A-Z]{5}[0-9]{4}[A-Z]$/ },
  },
  fullName: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'full_name',
  },
  relationship: {
    type: DataTypes.ENUM('spouse', 'parent', 'child', 'other'),
    allowNull: false,
  },
  dateOfBirth: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'date_of_birth',
  },
  panVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'pan_verified',
  },
  panVerifiedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'pan_verified_at',
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active',
  },
  deletedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'deleted_at',
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {},
  },
}, {
  tableName: 'family_members',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['user_id'] },
    { fields: ['pan'] },
    { fields: ['user_id', 'is_active'] },
  ],
});

module.exports = FamilyMember;
