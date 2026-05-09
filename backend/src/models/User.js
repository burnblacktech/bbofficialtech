// =====================================================
// USER MODEL
// =====================================================

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');
const enterpriseLogger = require('../utils/logger');

const User = sequelize.define('User', {
  // =====================================================
  // IDENTITY
  // =====================================================
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  fullName: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'full_name',
  },

  // =====================================================
  // AUTHENTICATION
  // =====================================================
  passwordHash: {
    type: DataTypes.STRING,
    allowNull: true, // NULL for OAuth-only users
    field: 'password_hash',
  },
  authProvider: {
    type: DataTypes.ENUM('local', 'google'),
    defaultValue: 'local',
    allowNull: false,
    field: 'auth_provider',
  },

  // =====================================================
  // AUTHORIZATION
  // =====================================================
  role: {
    type: DataTypes.ENUM('SUPER_ADMIN', 'GSTIN_ADMIN', 'CA', 'PREPARER', 'END_USER'),
    defaultValue: 'END_USER',
    allowNull: false,
  },
  caFirmId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'ca_firm_id',
  },

  // =====================================================
  // PERSONAL INFO
  // =====================================================
  phone: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  dateOfBirth: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'date_of_birth',
  },
  gender: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  panNumber: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'pan_number',
  },
  panVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
    field: 'pan_verified',
  },
  panVerifiedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'pan_verified_at',
  },
  dobVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
    field: 'dob_verified',
  },
  dobVerifiedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'dob_verified_at',
  },

  // =====================================================
  // LIFECYCLE
  // =====================================================
  status: {
    type: DataTypes.ENUM('active', 'disabled'),
    defaultValue: 'active',
    allowNull: false,
  },
  emailVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
    field: 'email_verified',
  },
  lastLoginAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'last_login_at',
  },
  aadhaarVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
    field: 'aadhaar_verified',
  },
  verificationToken: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'verification_token',
  },
  googleId: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
    field: 'google_id',
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {},
    allowNull: false,
  },
  verifiedPans: {
    type: DataTypes.JSONB,
    defaultValue: [],
    allowNull: false,
    field: 'verified_pans',
    comment: 'Array of verified PANs with labels for multi-PAN support',
    // Structure: [{ pan: String, label: String, verifiedAt: Date, isDefault: Boolean, metadata: {} }]
  },

  // =====================================================
  // AUDIT
  // =====================================================
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
  tableName: 'users',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['email'],
    },
    {
      fields: ['role'],
    },
    {
      fields: ['ca_firm_id'],
    },
  ],
});

User.prototype.toJSON = function () {
  const values = Object.assign({}, this.get());
  delete values.passwordHash;
  // Add computed hasPassword field
  values.hasPassword = !!this.passwordHash;
  return values;
};

// Virtual getter for hasPassword
Object.defineProperty(User.prototype, 'hasPassword', {
  get: function () {
    return !!this.passwordHash;
  },
});

// Class methods
User.hashPassword = async function (password) {
  try {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  } catch (error) {
    enterpriseLogger.error('Password hashing error', { error: error.message });
    throw new Error('Password hashing failed');
  }
};

User.findByEmail = async function (email) {
  try {
    return await User.findOne({ where: { email: email.toLowerCase() } });
  } catch (error) {
    enterpriseLogger.error('Find user by email error', {
      email,
      error: error.message,
    });
    throw error;
  }
};

User.findActiveUsers = async function () {
  try {
    return await User.findAll({
      where: { status: 'active' },
      order: [['createdAt', 'DESC']],
    });
  } catch (error) {
    enterpriseLogger.error('Find active users error', { error: error.message });
    throw error;
  }
};



// =====================================================
// FIELD ENCRYPTION HOOKS (PAN at rest)
// =====================================================
const { encrypt, decrypt } = require('../utils/fieldEncryption');

const encryptSensitiveFields = (user) => {
  if (user.changed('panNumber') && user.panNumber) {
    user.panNumber = encrypt(user.panNumber);
  }
  if (user.changed('verifiedPans') && Array.isArray(user.verifiedPans)) {
    user.verifiedPans = user.verifiedPans.map((entry) =>
      entry.pan ? { ...entry, pan: encrypt(entry.pan) } : entry,
    );
  }
};

const decryptSensitiveFields = (user) => {
  if (!user) return;
  if (user.panNumber) user.setDataValue('panNumber', decrypt(user.panNumber));
  if (Array.isArray(user.verifiedPans)) {
    user.setDataValue('verifiedPans', user.verifiedPans.map((entry) =>
      entry.pan ? { ...entry, pan: decrypt(entry.pan) } : entry,
    ));
  }
};

// Hooks
User.beforeCreate(async (user) => {
  user.email = user.email.toLowerCase();
  encryptSensitiveFields(user);
});

User.beforeUpdate(async (user) => {
  if (user.changed('email')) {
    user.email = user.email.toLowerCase();
  }
  encryptSensitiveFields(user);
});

User.afterFind((result) => {
  if (!result) return;
  if (Array.isArray(result)) {
    result.forEach(decryptSensitiveFields);
  } else {
    decryptSensitiveFields(result);
  }
});

// Associations will be defined in a separate file
// User.hasMany(ITRFiling, { foreignKey: 'userId', as: 'filings' });

module.exports = User;
