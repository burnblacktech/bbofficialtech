// =====================================================
// ITR FILING MODEL - CANONICAL SCHEMA v1.0
// Single source of truth for filing lifecycle
// =====================================================

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const enterpriseLogger = require('../utils/logger');

const ITRFiling = sequelize.define('ITRFiling', {
  // =====================================================
  // IDENTITY
  // =====================================================
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },

  // =====================================================
  // AUTHORITY
  // =====================================================
  // =====================================================
  // IDENTITY & AUTHORITY
  // =====================================================
  caFirmId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'ca_firms',
      key: 'id',
    },
    field: 'ca_firm_id',
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
    field: 'created_by',
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: true, // Shadow field for legacy user_id
    field: 'user_id',
  },
  memberId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'member_id',
  },

  // =====================================================
  // STATE MACHINE & STATUS
  // =====================================================
  lifecycleState: {
    type: DataTypes.ENUM(
      'draft',
      'review_pending',
      'reviewed',
      'approved',
      'submitted_to_eri',
      'eri_success',
      'eri_failed'
    ),
    allowNull: false,
    defaultValue: 'draft',
    field: 'lifecycle_state',
    comment: 'Authoritative state - only SubmissionStateMachine can mutate',
  },
  status: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'status',
    comment: 'Legacy status field for backward compatibility',
  },

  // =====================================================
  // FILING DETAILS (Identifiers)
  // =====================================================
  assessmentYear: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'assessment_year',
    validate: {
      is: /^\d{4}-\d{2}$/,
    },
  },
  taxpayerPan: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'taxpayer_pan',
    validate: {
      len: [10, 10],
      is: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i,
    },
  },
  itrType: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'itr_type',
  },

  // =====================================================
  // FILING DATA (Canonical Aggregate)
  // =====================================================
  jsonPayload: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {},
    field: 'json_payload',
    comment: 'All filing data: income, deductions, capital gains, etc.',
  },

  // =====================================================
  // DERIVED RESULTS (Cached for performance/querying)
  // =====================================================
  taxComputation: {
    type: DataTypes.JSONB,
    allowNull: true,
    field: 'tax_computation',
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
  selectedRegime: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'regime',
  },

  // =====================================================
  // SUBMISSION & TRACKING
  // =====================================================
  ackNumber: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'ack_number',
  },
  acknowledgmentNumber: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'acknowledgment_number',
  },
  idempotencyKey: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'idempotency_key',
  },

  // =====================================================
  // E-VERIFICATION
  // =====================================================
  verificationMethod: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'verification_method',
  },
  verificationStatus: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'verification_status',
  },
  verificationDate: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'verification_date',
  },
  verificationDetails: {
    type: DataTypes.JSONB,
    allowNull: true,
    field: 'verification_details',
  },

  // =====================================================
  // SNAPSHOTS & TRAIL
  // =====================================================
  snapshots: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: [],
    field: 'snapshots',
    comment: 'Immutable snapshots at lifecycle transitions',
  },
  reviewedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'reviewed_by',
  },
  reviewedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'reviewed_at',
  },
  reviewNotes: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'review_notes',
  },
  approvedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'approved_by',
  },
  approvedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'approved_at',
  },
  approvalNotes: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'approval_notes',
  },
  intelligenceFlags: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: [],
    field: 'intelligence_flags',
  },
  intelligenceOverrides: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: [],
    field: 'intelligence_overrides',
  },

  // =====================================================
  // AUDIT
  // =====================================================
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
  // underscored removed - all fields explicitly mapped with field: 'snake_case'
  indexes: [
    {
      fields: ['ca_firm_id'],
    },
    {
      fields: ['created_by'],
    },
    {
      fields: ['lifecycle_state'],
    },
    {
      fields: ['reviewed_by'],
    },
    {
      fields: ['approved_by'],
    },
    {
      fields: ['assessment_year'],
    },
  ],
});

// =====================================================
// INSTANCE METHODS
// =====================================================

ITRFiling.prototype.canBeReviewedBy = function (user) {
  // Only CA role can review
  if (user.role !== 'CA') {
    return { allowed: false, reason: 'Only CA can review filings' };
  }

  // Must be in review_pending state
  if (this.lifecycleState !== 'review_pending') {
    return { allowed: false, reason: 'Filing not in review_pending state' };
  }

  // Must be same firm
  if (user.caFirmId !== this.caFirmId) {
    return { allowed: false, reason: 'User not in same firm' };
  }

  return { allowed: true };
};

ITRFiling.prototype.canBeApprovedBy = function (user) {
  // Only CA role can approve
  if (user.role !== 'CA') {
    return { allowed: false, reason: 'Only CA can approve filings' };
  }

  // Must be in reviewed state
  if (this.lifecycleState !== 'reviewed') {
    return { allowed: false, reason: 'Filing not in reviewed state' };
  }

  // Must be same firm
  if (user.caFirmId !== this.caFirmId) {
    return { allowed: false, reason: 'User not in same firm' };
  }

  return { allowed: true };
};

// =====================================================
// HOOKS
// =====================================================

ITRFiling.beforeCreate(async (filing) => {
  enterpriseLogger.info('Creating ITR Filing', {
    caFirmId: filing.caFirmId,
    createdBy: filing.createdBy,
    assessmentYear: filing.assessmentYear,
  });
});

ITRFiling.afterCreate(async (filing) => {
  enterpriseLogger.info('ITR Filing created', {
    filingId: filing.id,
    lifecycleState: filing.lifecycleState,
  });
});

ITRFiling.beforeUpdate(async (filing) => {
  // Log state changes
  if (filing.changed('lifecycleState')) {
    enterpriseLogger.warn('Direct lifecycleState mutation detected', {
      filingId: filing.id,
      oldState: filing._previousDataValues.lifecycleState,
      newState: filing.lifecycleState,
      stack: new Error().stack,
    });
  }
});

module.exports = ITRFiling;
