// =====================================================
// PRICING PLAN MODEL
// Manages pricing plans for ITR filing services
// =====================================================

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const enterpriseLogger = require('../utils/logger');

const PricingPlan = sequelize.define('PricingPlan', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [2, 255],
    },
    comment: 'Plan name (e.g., Basic, Premium, Enterprise)',
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Plan description',
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
    validate: {
      min: 0,
    },
    comment: 'Plan price in INR',
  },
  currency: {
    type: DataTypes.STRING(3),
    allowNull: false,
    defaultValue: 'INR',
    comment: 'Currency code',
  },
  features: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: [],
    comment: 'Array of features included in plan: [{name, description, included}]',
  },
  itrTypesAllowed: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: [],
    comment: 'Array of ITR types allowed: ["ITR-1", "ITR-2", etc.]',
  },
  validityPeriod: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 365,
    comment: 'Validity period in days',
  },
  userTypeRestrictions: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: [],
    comment: 'User types allowed: ["individual", "ca", "enterprise"]',
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    field: 'is_active',
    comment: 'Whether plan is currently active',
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {},
    comment: 'Additional plan metadata',
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
  tableName: 'pricing_plans',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['is_active'],
    },
    {
      fields: ['name'],
    },
    {
      fields: ['price'],
    },
  ],
});

// Instance methods
PricingPlan.prototype.activate = async function() {
  try {
    await this.update({ isActive: true });
    return this;
  } catch (error) {
    enterpriseLogger.error('Activate pricing plan error', {
      planId: this.id,
      error: error.message,
    });
    throw error;
  }
};

PricingPlan.prototype.deactivate = async function() {
  try {
    await this.update({ isActive: false });
    return this;
  } catch (error) {
    enterpriseLogger.error('Deactivate pricing plan error', {
      planId: this.id,
      error: error.message,
    });
    throw error;
  }
};

// Class methods
PricingPlan.findActive = async function() {
  try {
    return await PricingPlan.findAll({
      where: { isActive: true },
      order: [['price', 'ASC']],
    });
  } catch (error) {
    enterpriseLogger.error('Find active pricing plans error', {
      error: error.message,
    });
    throw error;
  }
};


module.exports = PricingPlan;

