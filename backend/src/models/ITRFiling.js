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
    allowNull: true, // Nullable initially, must be set once determined
    field: 'itr_type',
    comment: 'ITR type (ITR-1, ITR-2, ITR-3, ITR-4). Nullable initially, must be set once determined, must not change after LOCKED state. Domain Core enforces immutability.',
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
    type: DataTypes.ENUM('draft', 'paused', 'submitted', 'acknowledged', 'processed', 'rejected'),
    defaultValue: 'draft',
    allowNull: false,
    comment: 'Deprecated: Use lifecycleState instead. Will be removed in future migration.',
  },
  lifecycleState: {
    type: DataTypes.ENUM(
      'DRAFT_INIT',
      'ITR_DETERMINED',
      'DATA_COLLECTED',
      'DATA_CONFIRMED',
      'COMPUTED',
      'LOCKED',
      'FILED',
      'ACKNOWLEDGED',
      'COMPLETED'
    ),
    allowNull: false,
    defaultValue: 'DRAFT_INIT',
    field: 'lifecycle_state',
    comment: 'Domain Core lifecycle state. This is the authoritative state for ITR filing lifecycle.',
  },
  pausedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'paused_at',
    comment: 'Timestamp when filing was paused',
  },
  resumedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'resumed_at',
    comment: 'Timestamp when filing was resumed',
  },
  pauseReason: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'pause_reason',
    comment: 'Optional reason for pausing the filing',
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
  firmId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'ca_firms',
      key: 'id',
    },
    field: 'firm_id',
    comment: 'CA firm context (derived from User.caFirmId or explicit)',
  },
  assignedTo: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
    field: 'assigned_to',
    comment: 'Assigned preparer/reviewer user ID',
  },
  reviewStatus: {
    type: DataTypes.ENUM('pending', 'in_review', 'approved', 'rejected'),
    allowNull: true,
    field: 'review_status',
    comment: 'CA review status',
  },
  verificationMethod: {
    type: DataTypes.ENUM('AADHAAR_OTP', 'NETBANKING', 'DSC'),
    allowNull: true,
    field: 'verification_method',
    comment: 'E-verification method used',
  },
  verificationStatus: {
    type: DataTypes.ENUM('pending', 'verified', 'failed'),
    allowNull: true,
    defaultValue: 'pending',
    field: 'verification_status',
    comment: 'E-verification status',
  },
  verificationDate: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'verification_date',
    comment: 'Date when verification was completed',
  },
  verificationDetails: {
    type: DataTypes.JSONB,
    allowNull: true,
    field: 'verification_details',
    comment: 'Additional verification details (token, source, etc.)',
  },
  regime: {
    type: DataTypes.ENUM('old', 'new'),
    allowNull: true,
    field: 'regime',
    comment: 'Deprecated: Use regimeSelected instead. Will be removed in future migration.',
  },
  regimeSelected: {
    type: DataTypes.ENUM('old', 'new'),
    allowNull: true,
    field: 'regime_selected',
    comment: 'Tax regime selected for this filing (old or new). Should match regime in return_versions.',
  },
  previousYearFilingId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'previous_year_filing_id',
    references: {
      model: 'itr_filings',
      key: 'id',
    },
    comment: 'Reference to previous year filing for copy feature',
  },
  sharedWith: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: [],
    field: 'shared_with',
    comment: 'Array of draft sharing records: [{email, token, permissions, sharedAt}]',
  },
  taxComputation: {
    type: DataTypes.JSONB,
    allowNull: true,
    field: 'tax_computation',
    comment: 'Stored tax computation result with breakdown',
  },
  lockedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'locked_at',
    comment: 'Timestamp when filing was locked. Domain Core uses this as a guard (not SQL constraint).',
  },
  lockedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'locked_by',
    references: {
      model: 'users',
      key: 'id',
    },
    comment: 'User ID who locked the filing. Domain Core uses this for audit trails.',
  },
  filedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'filed_at',
    comment: 'Timestamp when filing was submitted/filed. Domain Core uses this as a guard (not SQL constraint).',
  },
  filedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'filed_by',
    references: {
      model: 'users',
      key: 'id',
    },
    comment: 'User ID who filed the ITR. Domain Core uses this for audit trails.',
  },
  computationVersion: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 1,
    field: 'computation_version',
    comment: 'Version number of tax computation. Incremented each time tax is recomputed.',
  },
  computedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'computed_at',
    comment: 'Timestamp when tax computation was last performed.',
  },
  computedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'computed_by',
    references: {
      model: 'users',
      key: 'id',
    },
    comment: 'User ID who performed the computation. NULL for system computations.',
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
      fields: ['lifecycle_state'],
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
    {
      fields: ['user_id', 'assessment_year', 'status'],
      name: 'idx_previous_year_queries',
      comment: 'Index for efficient previous year filing queries',
    },
    {
      fields: ['regime'],
    },
    {
      fields: ['previous_year_filing_id'],
    },
  ],
});

// Instance methods
ITRFiling.prototype.updateStatus = async function (newStatus, additionalData = {}) {
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
      case 'paused':
        updateData.pausedAt = new Date();
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

ITRFiling.prototype.canBeSubmitted = function () {
  return this.status === 'draft' && this.jsonPayload !== null;
};

ITRFiling.prototype.canBeModified = function () {
  return ['draft', 'paused', 'rejected'].includes(this.status);
};

ITRFiling.prototype.pause = async function (reason = null) {
  try {
    await this.update({
      status: 'paused',
      pausedAt: new Date(),
      pauseReason: reason,
    });

    enterpriseLogger.info('ITR filing paused', {
      filingId: this.id,
      reason,
      pausedAt: this.pausedAt,
    });

    return this;
  } catch (error) {
    enterpriseLogger.error('Pause filing error', {
      filingId: this.id,
      error: error.message,
    });
    throw error;
  }
};

ITRFiling.prototype.resume = async function () {
  try {
    await this.update({
      status: 'draft',
      resumedAt: new Date(),
    });

    enterpriseLogger.info('ITR filing resumed', {
      filingId: this.id,
      resumedAt: this.resumedAt,
    });

    return this;
  } catch (error) {
    enterpriseLogger.error('Resume filing error', {
      filingId: this.id,
      error: error.message,
    });
    throw error;
  }
};

ITRFiling.prototype.assignTo = async function (userId) {
  try {
    await this.update({
      assignedTo: userId,
      jsonPayload: {
        ...(this.jsonPayload || {}),
        metadata: {
          ...((this.jsonPayload || {}).metadata || {}),
          assignedAt: new Date().toISOString(),
          assignedBy: userId,
        },
      },
    });

    enterpriseLogger.info('ITR filing assigned', {
      filingId: this.id,
      assignedTo: userId,
    });

    return this;
  } catch (error) {
    enterpriseLogger.error('Assign filing error', {
      filingId: this.id,
      userId,
      error: error.message,
    });
    throw error;
  }
};

ITRFiling.prototype.requestReview = async function (reason = null) {
  try {
    await this.update({
      reviewStatus: 'pending',
      jsonPayload: {
        ...(this.jsonPayload || {}),
        metadata: {
          ...((this.jsonPayload || {}).metadata || {}),
          reviewRequestedAt: new Date().toISOString(),
          reviewReason: reason,
        },
      },
    });

    enterpriseLogger.info('ITR filing review requested', {
      filingId: this.id,
      reason,
    });

    return this;
  } catch (error) {
    enterpriseLogger.error('Request review error', {
      filingId: this.id,
      error: error.message,
    });
    throw error;
  }
};

ITRFiling.prototype.approveReview = async function (reviewerId, comments = null) {
  try {
    await this.update({
      reviewStatus: 'approved',
      jsonPayload: {
        ...(this.jsonPayload || {}),
        metadata: {
          ...((this.jsonPayload || {}).metadata || {}),
          reviewedAt: new Date().toISOString(),
          reviewerId,
          reviewComments: comments,
        },
      },
    });

    enterpriseLogger.info('ITR filing review approved', {
      filingId: this.id,
      reviewerId,
    });

    return this;
  } catch (error) {
    enterpriseLogger.error('Approve review error', {
      filingId: this.id,
      reviewerId,
      error: error.message,
    });
    throw error;
  }
};

// Class methods
ITRFiling.findByUser = async function (userId, options = {}) {
  try {
    const { assessmentYear, itrType, status } = options;
    const whereClause = { userId };

    if (assessmentYear) { whereClause.assessmentYear = assessmentYear; }
    if (itrType) { whereClause.itrType = itrType; }
    if (status) { whereClause.status = status; }

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

ITRFiling.findByAckNumber = async function (ackNumber) {
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

ITRFiling.getFilingStats = async function (userId) {
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
  // V4 Migration: Legacy status validation disabled. 
  // State transitions are now enforced by SubmissionStateMachine.js (Domain Layer).
  return;

  /* DEPRECATED
  // Validate status transitions
  const validTransitions = {
    'draft': ['paused', 'submitted', 'rejected'],
    'paused': ['draft', 'rejected'],
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
  */
});

// Associations will be defined in a separate file
// Associations
ITRFiling.associate = (models) => {
  ITRFiling.hasMany(models.ReturnVersion, {
    foreignKey: 'returnId',
    as: 'versions',
  });
};

// ITRFiling.belongsTo(User, { foreignKey: 'userId', as: 'user' });
// ITRFiling.hasMany(ITRDraft, { foreignKey: 'filingId', as: 'drafts' });

module.exports = ITRFiling;
