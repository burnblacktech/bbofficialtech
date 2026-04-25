// =====================================================
// IN-APP NOTIFICATION MODEL
// Stores in-app notifications (deadlines, expiry
// warnings, filing state changes, security alerts)
// with read/unread state for the notification center.
// =====================================================

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const InAppNotification = sequelize.define('InAppNotification', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'user_id',
  },
  type: {
    type: DataTypes.ENUM('deadline', 'expiry', 'filing_state', 'security'),
    allowNull: false,
  },
  message: {
    type: DataTypes.STRING(500),
    allowNull: false,
  },
  actionUrl: {
    type: DataTypes.STRING(500),
    allowNull: true,
    field: 'action_url',
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_read',
  },
  readAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'read_at',
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {},
  },
}, {
  tableName: 'in_app_notifications',
  timestamps: true,
  updatedAt: false,
  underscored: true,
  indexes: [
    { fields: ['user_id', 'is_read'] },
    { fields: ['user_id', 'created_at'] },
    { fields: ['type'] },
  ],
});

module.exports = InAppNotification;
