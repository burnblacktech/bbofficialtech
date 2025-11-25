const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./User');
const enterpriseLogger = require('../utils/logger');

const UserProfile = sequelize.define('UserProfile', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true,
    references: {
      model: User,
      key: 'id',
    },
    field: 'user_id',
  },
  panNumber: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
    validate: {
      is: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, // PAN format validation
    },
    field: 'pan_number',
  },
  aadhaarNumber: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
    validate: {
      is: /^\d{12}$/, // Aadhaar format validation
    },
    field: 'aadhaar_number',
  },
  dateOfBirth: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'date_of_birth',
  },
  addressLine1: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'address_line_1',
  },
  addressLine2: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'address_line_2',
  },
  city: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  state: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  pincode: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  bankName: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'bank_name',
  },
  accountNumber: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'account_number',
  },
  ifscCode: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'ifsc_code',
  },
  profileCompleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
    field: 'profile_completed',
  },
  completionPercentage: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    field: 'completion_percentage',
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {},
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'created_at',
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'updated_at',
  },
}, {
  tableName: 'user_profiles',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['user_id'], unique: true },
    { fields: ['pan_number'], unique: true },
    { fields: ['aadhaar_number'], unique: true },
    { fields: ['profile_completed'] },
    { fields: ['completion_percentage'] },
  ],
});

// Instance method to calculate completion percentage
UserProfile.prototype.calculateCompletionPercentage = function() {
  let completedFields = 0;
  const totalFields = 10; // PAN, Aadhaar, DOB, Address1, City, State, Pincode, BankName, AccountNumber, IFSCCode

  if (this.panNumber) {completedFields++;}
  if (this.aadhaarNumber) {completedFields++;}
  if (this.dateOfBirth) {completedFields++;}
  if (this.addressLine1 && this.city && this.state && this.pincode) {completedFields++;} // Group address fields
  if (this.bankName && this.accountNumber && this.ifscCode) {completedFields++;} // Group bank fields

  // Add other fields as they become mandatory
  // For now, let's simplify to a few key ones
  if (this.panNumber) {completedFields++;}
  if (this.dateOfBirth) {completedFields++;}
  if (this.addressLine1) {completedFields++;}
  if (this.city) {completedFields++;}
  if (this.state) {completedFields++;}
  if (this.pincode) {completedFields++;}
  if (this.bankName) {completedFields++;}
  if (this.accountNumber) {completedFields++;}
  if (this.ifscCode) {completedFields++;}

  const percentage = Math.min(100, Math.round((completedFields / totalFields) * 100));
  this.completionPercentage = percentage;
  this.profileCompleted = percentage === 100;
};

// Hook to calculate percentage before saving
UserProfile.beforeSave(async (profile) => {
  profile.calculateCompletionPercentage();
});

module.exports = UserProfile;
