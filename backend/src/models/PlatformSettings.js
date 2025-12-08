// =====================================================
// PLATFORM SETTINGS MODEL
// Stores platform-wide configuration settings
// =====================================================

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const enterpriseLogger = require('../utils/logger');

const PlatformSettings = sequelize.define('PlatformSettings', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  key: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    comment: 'Settings key (e.g., "platform", "billing", "tax_config")',
  },
  value: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {},
    comment: 'Settings value as JSON object',
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Description of what this setting controls',
  },
  updatedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
    field: 'updated_by',
    comment: 'User ID who last updated this setting',
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
  tableName: 'platform_settings',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['key'],
    },
  ],
});

// Class methods
PlatformSettings.getSetting = async function(key, defaultValue = null) {
  try {
    const setting = await PlatformSettings.findOne({ where: { key } });
    return setting ? setting.value : defaultValue;
  } catch (error) {
    enterpriseLogger.error('Get platform setting error', {
      key,
      error: error.message,
    });
    return defaultValue;
  }
};

PlatformSettings.setSetting = async function(key, value, updatedBy = null, description = null) {
  try {
    const [setting, created] = await PlatformSettings.upsert({
      key,
      value,
      description,
      updatedBy,
      updatedAt: new Date(),
    }, {
      returning: true,
    });
    return setting;
  } catch (error) {
    enterpriseLogger.error('Set platform setting error', {
      key,
      error: error.message,
    });
    throw error;
  }
};

PlatformSettings.getAllSettings = async function() {
  try {
    const settings = await PlatformSettings.findAll({
      order: [['key', 'ASC']],
    });
    return settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {});
  } catch (error) {
    enterpriseLogger.error('Get all platform settings error', {
      error: error.message,
    });
    throw error;
  }
};

module.exports = PlatformSettings;

