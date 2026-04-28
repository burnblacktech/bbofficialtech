const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Coupon = sequelize.define('Coupon', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  code: {
    type: DataTypes.STRING(30),
    allowNull: false,
    unique: true,
    validate: { is: /^[A-Z0-9]{3,30}$/ },
  },
  discountType: {
    type: DataTypes.ENUM('percent', 'flat'),
    allowNull: false,
    field: 'discount_type',
  },
  discountValue: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'discount_value',
  },
  maxUses: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'max_uses',
  },
  currentUses: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'current_uses',
  },
  validFrom: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'valid_from',
  },
  validUntil: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'valid_until',
  },
  maxDiscount: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'max_discount',
    comment: 'Maximum discount in paise for percent-type coupons',
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active',
  },
}, {
  tableName: 'coupons',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['code'], unique: true },
    { fields: ['is_active'] },
    { fields: ['valid_until'] },
  ],
});

module.exports = Coupon;
