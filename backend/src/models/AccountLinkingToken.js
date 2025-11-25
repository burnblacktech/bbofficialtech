const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./User');
const enterpriseLogger = require('../utils/logger');

const AccountLinkingToken = sequelize.define('AccountLinkingToken', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: 'id',
    },
    field: 'user_id',
  },
  googleId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    field: 'google_id',
  },
  otp: {
    type: DataTypes.STRING,
    allowNull: false,
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
  tableName: 'account_linking_tokens',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['user_id'] },
    { fields: ['google_id'] },
    { fields: ['otp'] },
    { fields: ['expires_at'] },
    { fields: ['used'] },
  ],
});

AccountLinkingToken.createLinkingToken = async function(userId, googleId, otp, expiresInMinutes = 10) {
  const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);
  const [token, created] = await this.findOrCreate({
    where: { userId, googleId },
    defaults: {
      otp,
      expiresAt,
      used: false,
    },
  });

  if (!created) {
    await token.update({
      otp,
      expiresAt,
      used: false,
    });
  }
  enterpriseLogger.info('Account linking token created/updated', { userId, googleId, otp });
  return token;
};

AccountLinkingToken.validateToken = async function(userId, googleId, otp) {
  const { Op } = require('sequelize');
  const token = await this.findOne({
    where: {
      userId,
      googleId,
      otp,
      used: false,
      expiresAt: {
        [Op.gt]: new Date(),
      },
    },
  });

  return {
    valid: !!token,
    token: token,
  };
};

AccountLinkingToken.markAsUsed = async function(id) {
  await this.update({ used: true }, { where: { id } });
  enterpriseLogger.info('Account linking token marked as used', { tokenId: id });
};

module.exports = AccountLinkingToken;
