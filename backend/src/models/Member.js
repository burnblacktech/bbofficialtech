// =====================================================
// MEMBER MODEL
// =====================================================

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const enterpriseLogger = require('../utils/logger');

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
    references: {
      model: 'users',
      key: 'id',
    },
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'first_name',
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'last_name',
  },
  panNumber: {
    type: DataTypes.STRING(10),
    allowNull: false,
    field: 'pan_number',
    validate: {
      is: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
    },
  },
  dateOfBirth: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'date_of_birth',
  },
  relationship: {
    type: DataTypes.ENUM('self', 'spouse', 'son', 'daughter', 'father', 'mother', 'other'),
    allowNull: false,
    defaultValue: 'other',
  },
  gender: {
    type: DataTypes.ENUM('male', 'female', 'other'),
    allowNull: false,
  },
  maritalStatus: {
    type: DataTypes.ENUM('single', 'married', 'widow', 'divorced'),
    allowNull: false,
    field: 'marital_status',
  },
  phone: {
    type: DataTypes.STRING(15),
    allowNull: true,
    validate: {
      len: [10, 15],
    },
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isEmail: true,
    },
  },
  address: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'Address information as JSON',
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active',
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
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'created_at',
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'updated_at',
  },
}, {
  tableName: 'family_members',
  timestamps: true,
  underscored: true,
});

// Instance methods
FamilyMember.prototype.getFullName = function() {
  return `${this.firstName} ${this.lastName}`;
};

FamilyMember.prototype.getAge = function() {
  if (!this.dateOfBirth) {return null;}
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
};

FamilyMember.prototype.isSeniorCitizen = function() {
  const age = this.getAge();
  return age >= 60;
};

FamilyMember.prototype.isSuperSeniorCitizen = function() {
  const age = this.getAge();
  return age >= 80;
};

// Class methods
FamilyMember.getTaxpayerType = function(age) {
  if (age >= 80) {return 'superSeniorCitizen';}
  if (age >= 60) {return 'seniorCitizen';}
  return 'individual';
};

FamilyMember.validatePAN = function(pan) {
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  return panRegex.test(pan);
};

// Hooks
FamilyMember.beforeCreate(async (member) => {
  // Validate PAN format
  if (!FamilyMember.validatePAN(member.panNumber)) {
    throw new Error('Invalid PAN format');
  }

  // Check for duplicate PAN
  const existingMember = await FamilyMember.findOne({
    where: { panNumber: member.panNumber },
  });

  if (existingMember) {
    throw new Error('PAN number already exists');
  }
});

FamilyMember.beforeUpdate(async (member) => {
  // Validate PAN format if changed
  if (member.changed('panNumber') && !FamilyMember.validatePAN(member.panNumber)) {
    throw new Error('Invalid PAN format');
  }
});

enterpriseLogger.info('FamilyMember model defined');

module.exports = { FamilyMember };
