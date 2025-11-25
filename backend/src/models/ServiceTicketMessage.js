// =====================================================
// SERVICE TICKET MESSAGE MODEL
// =====================================================

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const enterpriseLogger = require('../utils/logger');

const ServiceTicketMessage = sequelize.define('ServiceTicketMessage', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  ticketId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'ticket_id',
    references: {
      model: 'service_tickets',
      key: 'id',
    },
  },
  senderId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'sender_id',
    references: {
      model: 'users',
      key: 'id',
    },
  },
  senderType: {
    type: DataTypes.ENUM(
      'USER',
      'CA',
      'ADMIN',
      'SYSTEM',
    ),
    allowNull: false,
    field: 'sender_type',
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  messageType: {
    type: DataTypes.ENUM(
      'TEXT',
      'ATTACHMENT',
      'STATUS_CHANGE',
      'PRIORITY_CHANGE',
      'ASSIGNMENT_CHANGE',
      'SYSTEM_NOTIFICATION',
    ),
    allowNull: false,
    defaultValue: 'TEXT',
    field: 'message_type',
  },
  isInternal: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'is_internal',
  },
  attachments: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: [],
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {},
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
  isDeleted: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'is_deleted',
  },
  deletedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'deleted_at',
  },
  deletedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'deleted_by',
    references: {
      model: 'users',
      key: 'id',
    },
  },
}, {
  tableName: 'service_ticket_messages',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['ticket_id'],
    },
    {
      fields: ['sender_id'],
    },
    {
      fields: ['created_at'],
    },
    {
      fields: ['is_deleted'],
    },
    {
      fields: ['ticket_id', 'created_at'],
      where: { is_deleted: false },
    },
  ],
});

// Instance methods
ServiceTicketMessage.prototype.getSenderTypeColor = function() {
  const senderTypeColors = {
    'USER': 'blue',
    'CA': 'green',
    'ADMIN': 'purple',
    'SYSTEM': 'gray',
  };
  return senderTypeColors[this.senderType] || 'gray';
};

ServiceTicketMessage.prototype.getSenderTypeIcon = function() {
  const senderTypeIcons = {
    'USER': '👤',
    'CA': '👨‍💼',
    'ADMIN': '👑',
    'SYSTEM': '🤖',
  };
  return senderTypeIcons[this.senderType] || '❓';
};

ServiceTicketMessage.prototype.getMessageTypeIcon = function() {
  const messageTypeIcons = {
    'TEXT': '💬',
    'ATTACHMENT': '📎',
    'STATUS_CHANGE': '🔄',
    'PRIORITY_CHANGE': '⚡',
    'ASSIGNMENT_CHANGE': '👥',
    'SYSTEM_NOTIFICATION': '🔔',
  };
  return messageTypeIcons[this.messageType] || '💬';
};

ServiceTicketMessage.prototype.isFromUser = function() {
  return this.senderType === 'USER';
};

ServiceTicketMessage.prototype.isFromCA = function() {
  return this.senderType === 'CA';
};

ServiceTicketMessage.prototype.isFromAdmin = function() {
  return this.senderType === 'ADMIN';
};

ServiceTicketMessage.prototype.isFromSystem = function() {
  return this.senderType === 'SYSTEM';
};

ServiceTicketMessage.prototype.isSystemMessage = function() {
  return this.messageType !== 'TEXT';
};

ServiceTicketMessage.prototype.hasAttachments = function() {
  return this.attachments && this.attachments.length > 0;
};

ServiceTicketMessage.prototype.getAttachmentCount = function() {
  return this.attachments ? this.attachments.length : 0;
};

ServiceTicketMessage.prototype.formatMessage = function() {
  if (this.isSystemMessage()) {
    return this.formatSystemMessage();
  }
  return this.message;
};

ServiceTicketMessage.prototype.formatSystemMessage = function() {
  const metadata = this.metadata || {};

  switch (this.messageType) {
  case 'STATUS_CHANGE':
    return `Status changed from "${metadata.oldStatus}" to "${metadata.newStatus}"`;
  case 'PRIORITY_CHANGE':
    return `Priority changed from "${metadata.oldPriority}" to "${metadata.newPriority}"`;
  case 'ASSIGNMENT_CHANGE':
    return `Ticket assigned to ${metadata.assignedToName || 'Unknown'}`;
  case 'SYSTEM_NOTIFICATION':
    return this.message;
  default:
    return this.message;
  }
};

// Class methods
ServiceTicketMessage.getSenderTypeLabel = function(senderType) {
  const labels = {
    'USER': 'User',
    'CA': 'CA',
    'ADMIN': 'Admin',
    'SYSTEM': 'System',
  };
  return labels[senderType] || 'Unknown';
};

ServiceTicketMessage.getMessageTypeLabel = function(messageType) {
  const labels = {
    'TEXT': 'Text Message',
    'ATTACHMENT': 'Attachment',
    'STATUS_CHANGE': 'Status Change',
    'PRIORITY_CHANGE': 'Priority Change',
    'ASSIGNMENT_CHANGE': 'Assignment Change',
    'SYSTEM_NOTIFICATION': 'System Notification',
  };
  return labels[messageType] || 'Unknown';
};

ServiceTicketMessage.createSystemMessage = async function(ticketId, message, messageType, metadata = {}) {
  const systemMessage = await ServiceTicketMessage.create({
    ticketId,
    senderId: '00000000-0000-0000-0000-000000000000', // System user ID
    senderType: 'SYSTEM',
    message,
    messageType,
    isInternal: true,
    metadata,
  });

  enterpriseLogger.info('System message created', {
    messageId: systemMessage.id,
    ticketId,
    messageType,
    message,
  });

  return systemMessage;
};

ServiceTicketMessage.createStatusChangeMessage = async function(ticketId, oldStatus, newStatus, changedBy) {
  return await ServiceTicketMessage.createSystemMessage(
    ticketId,
    `Status changed from "${oldStatus}" to "${newStatus}"`,
    'STATUS_CHANGE',
    {
      oldStatus,
      newStatus,
      changedBy,
    },
  );
};

ServiceTicketMessage.createPriorityChangeMessage = async function(ticketId, oldPriority, newPriority, changedBy) {
  return await ServiceTicketMessage.createSystemMessage(
    ticketId,
    `Priority changed from "${oldPriority}" to "${newPriority}"`,
    'PRIORITY_CHANGE',
    {
      oldPriority,
      newPriority,
      changedBy,
    },
  );
};

ServiceTicketMessage.createAssignmentMessage = async function(ticketId, assignedToName, assignedBy) {
  return await ServiceTicketMessage.createSystemMessage(
    ticketId,
    `Ticket assigned to ${assignedToName}`,
    'ASSIGNMENT_CHANGE',
    {
      assignedToName,
      assignedBy,
    },
  );
};

// Hooks
ServiceTicketMessage.afterCreate(async (message) => {
  enterpriseLogger.info('Service ticket message created', {
    messageId: message.id,
    ticketId: message.ticketId,
    senderType: message.senderType,
    messageType: message.messageType,
    isInternal: message.isInternal,
  });
});

enterpriseLogger.info('ServiceTicketMessage model defined');

module.exports = { ServiceTicketMessage };
