// =====================================================
// ITR DRAFT MODEL
// =====================================================

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const enterpriseLogger = require('../utils/logger');

const ITRDraft = sequelize.define('ITRDraft', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  filingId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'filing_id',
    references: {
      model: 'itr_filings',
      key: 'id',
    },
  },
  step: {
    type: DataTypes.ENUM(
      'personal_info',
      'income_sources',
      'deductions',
      'tax_computation',
      'bank_details',
      'verification',
      'review',
      'submit',
    ),
    allowNull: false,
  },
  data: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'Partial form data for this step',
  },
  isCompleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_completed',
  },
  validationErrors: {
    type: DataTypes.JSONB,
    allowNull: true,
    field: 'validation_errors',
  },
  lastSavedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'last_saved_at',
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
  tableName: 'itr_drafts',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['filing_id'],
    },
    {
      fields: ['step'],
    },
    {
      fields: ['is_completed'],
    },
    {
      fields: ['last_saved_at'],
    },
    {
      unique: true,
      fields: ['filing_id', 'step'],
      name: 'unique_draft_per_step',
    },
  ],
});

// Instance methods
ITRDraft.prototype.markCompleted = async function() {
  try {
    await this.update({
      isCompleted: true,
      lastSavedAt: new Date(),
    });

    enterpriseLogger.info('Draft step marked as completed', {
      draftId: this.id,
      filingId: this.filingId,
      step: this.step,
    });

    return this;
  } catch (error) {
    enterpriseLogger.error('Mark draft completed error', {
      draftId: this.id,
      error: error.message,
    });
    throw error;
  }
};

ITRDraft.prototype.updateData = async function(newData, validationErrors = null) {
  try {
    const updateData = {
      data: newData,
      lastSavedAt: new Date(),
    };

    if (validationErrors !== null) {
      updateData.validationErrors = validationErrors;
    }

    await this.update(updateData);

    enterpriseLogger.info('Draft data updated', {
      draftId: this.id,
      filingId: this.filingId,
      step: this.step,
      hasValidationErrors: !!validationErrors,
    });

    return this;
  } catch (error) {
    enterpriseLogger.error('Update draft data error', {
      draftId: this.id,
      error: error.message,
    });
    throw error;
  }
};

ITRDraft.prototype.clearValidationErrors = async function() {
  try {
    await this.update({
      validationErrors: null,
      lastSavedAt: new Date(),
    });

    return this;
  } catch (error) {
    enterpriseLogger.error('Clear validation errors error', {
      draftId: this.id,
      error: error.message,
    });
    throw error;
  }
};

// Class methods
ITRDraft.findByFiling = async function(filingId) {
  try {
    return await ITRDraft.findAll({
      where: { filingId },
      order: [['step', 'ASC']],
    });
  } catch (error) {
    enterpriseLogger.error('Find drafts by filing error', {
      filingId,
      error: error.message,
    });
    throw error;
  }
};

ITRDraft.findByFilingAndStep = async function(filingId, step) {
  try {
    return await ITRDraft.findOne({
      where: { filingId, step },
    });
  } catch (error) {
    enterpriseLogger.error('Find draft by filing and step error', {
      filingId,
      step,
      error: error.message,
    });
    throw error;
  }
};

ITRDraft.getCompletionStatus = async function(filingId) {
  try {
    const drafts = await ITRDraft.findAll({
      where: { filingId },
      attributes: ['step', 'isCompleted', 'lastSavedAt'],
    });

    const stepOrder = [
      'personal_info',
      'income_sources',
      'deductions',
      'tax_computation',
      'bank_details',
      'verification',
      'review',
      'submit',
    ];

    const status = {
      totalSteps: stepOrder.length,
      completedSteps: 0,
      currentStep: null,
      lastSavedAt: null,
      progress: 0,
    };

    let foundCurrentStep = false;

    for (const step of stepOrder) {
      const draft = drafts.find(d => d.step === step);

      if (draft) {
        if (draft.isCompleted) {
          status.completedSteps++;
        } else if (!foundCurrentStep) {
          status.currentStep = step;
          foundCurrentStep = true;
        }

        if (draft.lastSavedAt && (!status.lastSavedAt || draft.lastSavedAt > status.lastSavedAt)) {
          status.lastSavedAt = draft.lastSavedAt;
        }
      } else if (!foundCurrentStep) {
        status.currentStep = step;
        foundCurrentStep = true;
      }
    }

    status.progress = Math.round((status.completedSteps / status.totalSteps) * 100);

    return status;
  } catch (error) {
    enterpriseLogger.error('Get completion status error', {
      filingId,
      error: error.message,
    });
    throw error;
  }
};

ITRDraft.createOrUpdate = async function(filingId, step, data, validationErrors = null) {
  try {
    const [draft, created] = await ITRDraft.findOrCreate({
      where: { filingId, step },
      defaults: {
        data,
        validationErrors,
        lastSavedAt: new Date(),
      },
    });

    if (!created) {
      await draft.updateData(data, validationErrors);
    }

    enterpriseLogger.info('Draft created or updated', {
      draftId: draft.id,
      filingId,
      step,
      created,
      hasValidationErrors: !!validationErrors,
    });

    return draft;
  } catch (error) {
    enterpriseLogger.error('Create or update draft error', {
      filingId,
      step,
      error: error.message,
    });
    throw error;
  }
};

// Hooks
ITRDraft.beforeCreate(async (draft) => {
  draft.lastSavedAt = new Date();
});

ITRDraft.beforeUpdate(async (draft) => {
  if (draft.changed('data') || draft.changed('validationErrors')) {
    draft.lastSavedAt = new Date();
  }
});

// Associations will be defined in a separate file
// ITRDraft.belongsTo(ITRFiling, { foreignKey: 'filingId', as: 'filing' });

module.exports = ITRDraft;
