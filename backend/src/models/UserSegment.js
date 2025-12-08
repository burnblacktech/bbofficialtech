// =====================================================
// USER SEGMENT MODEL
// Manages dynamic user segments for targeting and analytics
// =====================================================

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const enterpriseLogger = require('../utils/logger');

const UserSegment = sequelize.define('UserSegment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [1, 100],
    },
    comment: 'Segment name',
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Segment description',
  },
  criteria: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {},
    comment: 'Segment criteria rules (e.g., { userType: "individual", registrationDate: { $gte: "2024-01-01" } })',
  },
  memberCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    field: 'member_count',
    comment: 'Cached member count',
  },
  lastCalculatedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'last_calculated_at',
    comment: 'Last time member count was calculated',
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    field: 'is_active',
    comment: 'Whether segment is active',
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {},
    comment: 'Additional segment metadata',
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
  tableName: 'user_segments',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['name'],
    },
    {
      fields: ['is_active'],
    },
    {
      fields: ['created_at'],
    },
  ],
});

// Instance methods
UserSegment.prototype.evaluateCriteria = async function() {
  // This method would evaluate the criteria against User model
  // For now, return a placeholder
  return [];
};

UserSegment.prototype.recalculateMemberCount = async function() {
  try {
    // In production, this would query User model based on criteria
    // For now, just update the timestamp
    await this.update({
      lastCalculatedAt: new Date(),
    });
    return this.memberCount;
  } catch (error) {
    enterpriseLogger.error('Recalculate segment member count error', {
      segmentId: this.id,
      error: error.message,
    });
    throw error;
  }
};

module.exports = UserSegment;

