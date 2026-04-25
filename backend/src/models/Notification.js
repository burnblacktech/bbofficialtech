const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Notification = sequelize.define('Notification', {
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
  channel: {
    type: DataTypes.ENUM('email', 'sms', 'in_app'),
    allowNull: false,
    defaultValue: 'email',
  },
  templateId: {
    type: DataTypes.STRING(60),
    allowNull: false,
    field: 'template_id',
  },
  status: {
    type: DataTypes.ENUM('pending', 'sent', 'failed', 'cancelled'),
    defaultValue: 'pending',
  },
  scheduledAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'scheduled_at',
  },
  sentAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'sent_at',
  },
  failureReason: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'failure_reason',
  },
  retryCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'retry_count',
  },
  data: {
    type: DataTypes.JSONB,
    defaultValue: {},
    comment: 'Template variables',
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {},
    comment: 'Delivery details (messageId, sid)',
  },
}, {
  tableName: 'notifications',
  timestamps: true,
  updatedAt: false,
  underscored: true,
  indexes: [
    { fields: ['user_id', 'status'] },
    { fields: ['scheduled_at'] },
    { fields: ['template_id'] },
  ],
});

module.exports = Notification;
