// =====================================================
// PASSWORD RESET TOKEN MODEL
// =====================================================

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const enterpriseLogger = require('../utils/logger');

const PasswordResetToken = sequelize.define('PasswordResetToken', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
    field: 'user_id',
  },
  token: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  tokenHash: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'token_hash',
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'expires_at',
  },
  used: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
  },
  usedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'used_at',
  },
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'ip_address',
  },
  userAgent: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'user_agent',
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
  tableName: 'password_reset_tokens',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['token'],
    },
    {
      fields: ['user_id'],
    },
    {
      fields: ['expires_at'],
    },
    {
      fields: ['used'],
    },
  ],
});

// Class methods
PasswordResetToken.createResetToken = async function(userId, token, expiresAt, ipAddress, userAgent) {
  try {
    const bcrypt = require('bcryptjs');
    const tokenHash = await bcrypt.hash(token, 12);

    return await PasswordResetToken.create({
      userId,
      token,
      tokenHash,
      expiresAt,
      ipAddress,
      userAgent,
    });
  } catch (error) {
    enterpriseLogger.error('Create reset token error', {
      userId,
      error: error.message,
    });
    throw error;
  }
};

PasswordResetToken.validateToken = async function(token) {
  try {
    const resetToken = await PasswordResetToken.findOne({
      where: {
        token,
        used: false,
        expiresAt: {
          [sequelize.Sequelize.Op.gt]: new Date(),
        },
      },
    });

    if (!resetToken) {
      return { valid: false, token: null };
    }

    return { valid: true, token: resetToken };
  } catch (error) {
    enterpriseLogger.error('Validate reset token error', {
      error: error.message,
    });
    throw error;
  }
};

PasswordResetToken.markAsUsed = async function(token) {
  try {
    return await PasswordResetToken.update(
      {
        used: true,
        usedAt: new Date(),
      },
      {
        where: { token },
      },
    );
  } catch (error) {
    enterpriseLogger.error('Mark reset token as used error', {
      error: error.message,
    });
    throw error;
  }
};

PasswordResetToken.cleanupExpiredTokens = async function() {
  try {
    return await PasswordResetToken.destroy({
      where: {
        expiresAt: {
          [sequelize.Sequelize.Op.lt]: new Date(),
        },
      },
    });
  } catch (error) {
    enterpriseLogger.error('Cleanup expired reset tokens error', {
      error: error.message,
    });
    throw error;
  }
};

module.exports = PasswordResetToken;
