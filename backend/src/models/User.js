// =====================================================
// USER MODEL
// =====================================================

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');
const enterpriseLogger = require('../utils/logger');

const User = sequelize.define('User', {
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
  passwordHash: {
    type: DataTypes.STRING,
    allowNull: true, // Allow null for OAuth users
    field: 'password_hash',
  },
  role: {
    type: DataTypes.ENUM('SUPER_ADMIN', 'PLATFORM_ADMIN', 'CA_FIRM_ADMIN', 'CA', 'END_USER'),
    defaultValue: 'END_USER',
    allowNull: false,
  },
  fullName: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'full_name',
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      len: [10, 15],
    },
  },
  googleId: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
    field: 'google_id',
  },
  authProvider: {
    type: DataTypes.ENUM('LOCAL', 'GOOGLE', 'OTHER'),
    defaultValue: 'LOCAL',
    allowNull: false,
    field: 'auth_provider',
  },
  providerId: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'provider_id',
  },
  tokenVersion: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    field: 'token_version',
  },
  caFirmId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'ca_firms',
      key: 'id',
    },
    field: 'ca_firm_id',
  },
  emailVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'email_verified',
  },
  phoneVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'phone_verified',
  },
  lastLoginAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'last_login_at',
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'suspended'),
    defaultValue: 'active',
    allowNull: false,
  },
  onboardingCompleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
    field: 'onboarding_completed',
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
  tableName: 'users',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['email'],
    },
    {
      unique: true,
      fields: ['email', 'auth_provider'],
    },
    {
      fields: ['role'],
    },
    {
      fields: ['status'],
    },
    {
      fields: ['auth_provider'],
    },
    {
      fields: ['provider_id'],
    },
    {
      fields: ['ca_firm_id'],
    },
  ],
});

// Instance methods
User.prototype.validatePassword = async function(password) {
  try {
    return await bcrypt.compare(password, this.passwordHash);
  } catch (error) {
    enterpriseLogger.error('Password validation error', {
      userId: this.id,
      error: error.message,
    });
    return false;
  }
};

User.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  delete values.passwordHash;
  return values;
};

// Class methods
User.hashPassword = async function(password) {
  try {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  } catch (error) {
    enterpriseLogger.error('Password hashing error', { error: error.message });
    throw new Error('Password hashing failed');
  }
};

User.findByEmail = async function(email) {
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

User.findActiveUsers = async function() {
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

// Hooks
User.beforeCreate(async (user) => {
  if (user.passwordHash) {
    user.passwordHash = await User.hashPassword(user.passwordHash);
  }
  user.email = user.email.toLowerCase();
});

User.beforeUpdate(async (user) => {
  if (user.changed('passwordHash')) {
    user.passwordHash = await User.hashPassword(user.passwordHash);
  }
  if (user.changed('email')) {
    user.email = user.email.toLowerCase();
  }
});

// Associations will be defined in a separate file
// User.hasMany(ITRFiling, { foreignKey: 'userId', as: 'filings' });

module.exports = User;
