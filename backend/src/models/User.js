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
    type: DataTypes.ENUM('SUPER_ADMIN', 'PLATFORM_ADMIN', 'CA_FIRM_ADMIN', 'CA', 'PREPARER', 'REVIEWER', 'END_USER'),
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
      len: [10, 20], // Support international format
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
  panNumber: {
    type: DataTypes.STRING(10),
    allowNull: true,
    validate: {
      len: [10, 10],
      is: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i,
    },
    field: 'pan_number',
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
  dateOfBirth: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'date_of_birth',
    comment: 'User date of birth for tax calculations',
  },
  gender: {
    type: DataTypes.ENUM('MALE', 'FEMALE', 'OTHER'),
    allowNull: true,
    comment: 'User gender for profile and tax calculations',
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {},
    comment: 'Stores user preferences, notification settings, privacy settings, etc.',
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
    {
      fields: ['metadata'],
      using: 'gin',
      name: 'idx_users_metadata_gin',
      comment: 'GIN index for JSONB metadata queries',
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
  // Add computed hasPassword field
  values.hasPassword = !!this.passwordHash;
  return values;
};

// Virtual getter for hasPassword
Object.defineProperty(User.prototype, 'hasPassword', {
  get: function() {
    return !!this.passwordHash;
  },
});

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

// Instance methods for assignments
User.prototype.getAssignedClients = async function() {
  try {
    const { Assignment, FamilyMember } = require('./index');
    const assignments = await Assignment.findAll({
      where: {
        userId: this.id,
        status: 'active',
        role: ['preparer', 'reviewer'],
      },
      include: [{
        model: FamilyMember,
        as: 'client',
        where: { clientType: 'ca_client' },
      }],
    });
    return assignments.map(a => a.client);
  } catch (error) {
    enterpriseLogger.error('Get assigned clients error', {
      userId: this.id,
      error: error.message,
    });
    throw error;
  }
};

User.prototype.canAccessClient = async function(clientId) {
  try {
    // PlatformAdmin/SUPER_ADMIN can access (with audit)
    if (['SUPER_ADMIN', 'PLATFORM_ADMIN'].includes(this.role)) {
      return { allowed: true, reason: 'platform_admin' };
    }

    // FirmAdmin can access clients in their firm
    if (this.role === 'CA_FIRM_ADMIN' && this.caFirmId) {
      const { FamilyMember } = require('./index');
      const client = await FamilyMember.findByPk(clientId);
      if (client && client.firmId === this.caFirmId) {
        return { allowed: true, reason: 'firm_admin' };
      }
    }

    // Preparer/Reviewer can access assigned clients
    if (['PREPARER', 'REVIEWER', 'CA'].includes(this.role)) {
      const { Assignment } = require('./index');
      const assignment = await Assignment.findOne({
        where: {
          userId: this.id,
          clientId,
          status: 'active',
        },
      });
      if (assignment) {
        return { allowed: true, reason: 'assigned', assignment };
      }
    }

    // Client can access their own data
    if (this.role === 'END_USER' && this.id === clientId) {
      return { allowed: true, reason: 'self' };
    }

    return { allowed: false, reason: 'no_access' };
  } catch (error) {
    enterpriseLogger.error('Check client access error', {
      userId: this.id,
      clientId,
      error: error.message,
    });
    return { allowed: false, reason: 'error' };
  }
};

User.prototype.getFirmContext = function() {
  return {
    firmId: this.caFirmId,
    role: this.role,
    isPlatformAdmin: ['SUPER_ADMIN', 'PLATFORM_ADMIN'].includes(this.role),
    isFirmAdmin: this.role === 'CA_FIRM_ADMIN',
    isStaff: ['CA', 'PREPARER', 'REVIEWER'].includes(this.role),
  };
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
