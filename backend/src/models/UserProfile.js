const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
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
  aadhaarLinked: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
    field: 'aadhaar_linked',
  },
  aadhaarVerifiedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'aadhaar_verified_at',
  },
  aadhaarVerificationData: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {},
    field: 'aadhaar_verification_data',
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

  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {},
  },
  // Deterministic HMAC hashes for indexed lookups on encrypted fields
  // NOTE: These columns are added via migration. If missing, the model still works.
}, {
  tableName: 'user_profiles',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['user_id'], unique: true },
  ],
});

// =====================================================
// FIELD ENCRYPTION HOOKS (PAN, Aadhaar, bank account at rest)
// =====================================================
const { encrypt, decrypt } = require('../utils/fieldEncryption');

const SENSITIVE_FIELDS = ['panNumber', 'aadhaarNumber', 'accountNumber'];

UserProfile.beforeCreate((profile) => {
  for (const field of SENSITIVE_FIELDS) {
    if (profile[field]) profile[field] = encrypt(profile[field]);
  }
});

UserProfile.beforeUpdate((profile) => {
  for (const field of SENSITIVE_FIELDS) {
    if (profile.changed(field) && profile[field]) profile[field] = encrypt(profile[field]);
  }
});

UserProfile.afterFind((result) => {
  const decryptProfile = (p) => {
    if (!p) return;
    for (const field of SENSITIVE_FIELDS) {
      if (p[field]) p.setDataValue(field, decrypt(p[field]));
    }
  };
  if (Array.isArray(result)) result.forEach(decryptProfile);
  else decryptProfile(result);
});

module.exports = UserProfile;
