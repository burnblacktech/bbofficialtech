// =====================================================
// ITR FILING MODEL
// =====================================================

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const enterpriseLogger = require('../utils/logger');

const ITRFiling = sequelize.define('ITRFiling', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id',
    },
  },
  memberId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'member_id',
    comment: 'For family/friend profiles',
  },
  itrType: {
    type: DataTypes.ENUM('ITR-1', 'ITR-2', 'ITR-3', 'ITR-4'),
    allowNull: false,
    field: 'itr_type',
  },
  assessmentYear: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'assessment_year',
    validate: {
      is: /^\d{4}-\d{2}$/, // Format: 2024-25
    },
  },
  jsonPayload: {
    type: DataTypes.JSONB,
    allowNull: true,
    field: 'json_payload',
    comment: 'ITD schema compliant JSON',
  },
  status: {
    type: DataTypes.ENUM('draft', 'submitted', 'acknowledged', 'processed', 'rejected'),
    defaultValue: 'draft',
    allowNull: false,
  },
  ackNumber: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'ack_number',
    comment: 'Acknowledgement number from ITD',
  },
  submittedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'submitted_at',
  },
  acknowledgedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'acknowledged_at',
  },
  processedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'processed_at',
  },
  rejectionReason: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'rejection_reason',
  },
  taxLiability: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
    field: 'tax_liability',
  },
  refundAmount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
    field: 'refund_amount',
  },
  balancePayable: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
    field: 'balance_payable',
  },
  serviceTicketId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'service_ticket_id',
    comment: 'Auto-created service ticket for filing',
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
  tableName: 'itr_filings',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['user_id'],
    },
    {
      fields: ['member_id'],
    },
    {
      fields: ['itr_type'],
    },
    {
      fields: ['assessment_year'],
    },
    {
      fields: ['status'],
    },
    {
      fields: ['ack_number'],
    },
    {
      fields: ['created_at'],
    },
    {
      unique: true,
      fields: ['user_id', 'member_id', 'itr_type', 'assessment_year'],
      name: 'unique_filing_per_member',
    },
  ],
});

// Instance methods
ITRFiling.prototype.updateStatus = async function(newStatus, additionalData = {}) {
  try {
    const updateData = { status: newStatus };

    // Set timestamp based on status
    switch (newStatus) {
    case 'submitted':
      updateData.submittedAt = new Date();
      break;
    case 'acknowledged':
      updateData.acknowledgedAt = new Date();
      break;
    case 'processed':
      updateData.processedAt = new Date();
      break;
    }

    // Merge additional data
    Object.assign(updateData, additionalData);

    await this.update(updateData);

    enterpriseLogger.info('ITR filing status updated', {
      filingId: this.id,
      oldStatus: this.status,
      newStatus,
      additionalData,
    });

    return this;
  } catch (error) {
    enterpriseLogger.error('Update filing status error', {
      filingId: this.id,
      newStatus,
      error: error.message,
    });
    throw error;
  }
};

ITRFiling.prototype.canBeSubmitted = function() {
  return this.status === 'draft' && this.jsonPayload !== null;
};

ITRFiling.prototype.canBeModified = function() {
  return ['draft', 'rejected'].includes(this.status);
};

// Class methods
ITRFiling.findByUser = async function(userId, options = {}) {
  try {
    const { assessmentYear, itrType, status } = options;
    const whereClause = { userId };

    if (assessmentYear) {whereClause.assessmentYear = assessmentYear;}
    if (itrType) {whereClause.itrType = itrType;}
    if (status) {whereClause.status = status;}

    return await ITRFiling.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
    });
  } catch (error) {
    enterpriseLogger.error('Find filings by user error', {
      userId,
      options,
      error: error.message,
    });
    throw error;
  }
};

ITRFiling.findByAckNumber = async function(ackNumber) {
  try {
    return await ITRFiling.findOne({ where: { ackNumber } });
  } catch (error) {
    enterpriseLogger.error('Find filing by ack number error', {
      ackNumber,
      error: error.message,
    });
    throw error;
  }
};

ITRFiling.getFilingStats = async function(userId) {
  try {
    const stats = await ITRFiling.findAll({
      where: { userId },
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      group: ['status'],
      raw: true,
    });

    return stats.reduce((acc, stat) => {
      acc[stat.status] = parseInt(stat.count);
      return acc;
    }, {});
  } catch (error) {
    enterpriseLogger.error('Get filing stats error', {
      userId,
      error: error.message,
    });
    throw error;
  }
};

// Hooks
ITRFiling.beforeCreate(async (filing) => {
  // Validate assessment year format
  if (filing.assessmentYear && !/^\d{4}-\d{2}$/.test(filing.assessmentYear)) {
    throw new Error('Invalid assessment year format. Expected: YYYY-YY');
  }
});

ITRFiling.beforeUpdate(async (filing) => {
  // Validate status transitions
  const validTransitions = {
    'draft': ['submitted', 'rejected'],
    'submitted': ['acknowledged', 'rejected'],
    'acknowledged': ['processed', 'rejected'],
    'processed': [],
    'rejected': ['draft'],
  };

  if (filing.changed('status')) {
    const currentStatus = filing._previousDataValues.status;
    const newStatus = filing.status;

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      throw new Error(`Invalid status transition from ${currentStatus} to ${newStatus}`);
    }
  }
});

// Associations will be defined in a separate file
// ITRFiling.belongsTo(User, { foreignKey: 'userId', as: 'user' });
// ITRFiling.hasMany(ITRDraft, { foreignKey: 'filingId', as: 'drafts' });

module.exports = ITRFiling;
