// =====================================================
// COUPON MODEL
// Manages discount coupons and promotional codes
// =====================================================

const { DataTypes, Op } = require('sequelize');
const { sequelize } = require('../config/database');
const enterpriseLogger = require('../utils/logger');

const Coupon = sequelize.define('Coupon', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  code: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      len: [3, 50],
      isUppercase: true,
    },
    comment: 'Coupon code (uppercase, alphanumeric)',
  },
  discountType: {
    type: DataTypes.ENUM('percentage', 'flat'),
    allowNull: false,
    defaultValue: 'percentage',
    field: 'discount_type',
    comment: 'Discount type: percentage or flat amount',
  },
  discountValue: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0,
    },
    field: 'discount_value',
    comment: 'Discount value (percentage or flat amount)',
  },
  usageLimit: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'usage_limit',
    comment: 'Maximum number of times coupon can be used (null = unlimited)',
  },
  usedCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    field: 'used_count',
    comment: 'Number of times coupon has been used',
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'start_date',
    comment: 'Coupon validity start date',
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'end_date',
    comment: 'Coupon validity end date',
  },
  applicablePlans: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: [],
    field: 'applicable_plans',
    comment: 'Array of plan IDs this coupon applies to (empty = all plans)',
  },
  userRestrictions: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {},
    field: 'user_restrictions',
    comment: 'User restrictions: {userTypes: [], userIds: [], newUsersOnly: false}',
  },
  minimumOrderValue: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
    field: 'minimum_order_value',
    comment: 'Minimum order value required to use coupon',
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    field: 'is_active',
    comment: 'Whether coupon is currently active',
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {},
    comment: 'Additional coupon metadata',
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
  tableName: 'coupons',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['code'],
    },
    {
      fields: ['is_active'],
    },
    {
      fields: ['start_date', 'end_date'],
    },
  ],
});

// Instance methods
Coupon.prototype.isValid = function() {
  const now = new Date();
  return (
    this.isActive &&
    now >= new Date(this.startDate) &&
    now <= new Date(this.endDate) &&
    (this.usageLimit === null || this.usedCount < this.usageLimit)
  );
};

Coupon.prototype.calculateDiscount = function(orderValue) {
  if (!this.isValid() || orderValue < this.minimumOrderValue) {
    return 0;
  }

  if (this.discountType === 'percentage') {
    return (orderValue * this.discountValue) / 100;
  } else {
    return Math.min(this.discountValue, orderValue);
  }
};

Coupon.prototype.incrementUsage = async function() {
  try {
    await this.increment('usedCount');
    return this;
  } catch (error) {
    enterpriseLogger.error('Increment coupon usage error', {
      couponId: this.id,
      error: error.message,
    });
    throw error;
  }
};

Coupon.prototype.activate = async function() {
  try {
    await this.update({ isActive: true });
    return this;
  } catch (error) {
    enterpriseLogger.error('Activate coupon error', {
      couponId: this.id,
      error: error.message,
    });
    throw error;
  }
};

Coupon.prototype.deactivate = async function() {
  try {
    await this.update({ isActive: false });
    return this;
  } catch (error) {
    enterpriseLogger.error('Deactivate coupon error', {
      couponId: this.id,
      error: error.message,
    });
    throw error;
  }
};

// Class methods
Coupon.findByCode = async function(code) {
  try {
    return await Coupon.findOne({
      where: {
        code: code.toUpperCase(),
        isActive: true,
      },
    });
  } catch (error) {
    enterpriseLogger.error('Find coupon by code error', {
      code,
      error: error.message,
    });
    throw error;
  }
};


module.exports = Coupon;

