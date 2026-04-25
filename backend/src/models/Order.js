const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Order = sequelize.define('Order', {
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
  filingId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'filing_id',
  },
  planId: {
    type: DataTypes.STRING(30),
    allowNull: false,
    field: 'plan_id',
  },
  amount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Amount in paise (₹149 = 14900)',
  },
  currency: {
    type: DataTypes.STRING(3),
    defaultValue: 'INR',
  },
  status: {
    type: DataTypes.ENUM('created', 'paid', 'failed', 'refunded', 'expired'),
    defaultValue: 'created',
  },
  razorpayOrderId: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'razorpay_order_id',
  },
  razorpayPaymentId: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'razorpay_payment_id',
  },
  razorpaySignature: {
    type: DataTypes.STRING(128),
    allowNull: true,
    field: 'razorpay_signature',
  },
  couponCode: {
    type: DataTypes.STRING(30),
    allowNull: true,
    field: 'coupon_code',
  },
  discount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Discount in paise',
  },
  gstAmount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'gst_amount',
    comment: 'GST in paise',
  },
  totalAmount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'total_amount',
    comment: 'Final amount in paise (amount - discount + GST)',
  },
  invoiceNumber: {
    type: DataTypes.STRING(20),
    allowNull: true,
    field: 'invoice_number',
  },
  paidAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'paid_at',
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {},
  },
}, {
  tableName: 'orders',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['user_id'] },
    { fields: ['filing_id'] },
    { fields: ['razorpay_order_id'], unique: true },
    { fields: ['invoice_number'], unique: true },
    { fields: ['status'] },
  ],
});

module.exports = Order;
