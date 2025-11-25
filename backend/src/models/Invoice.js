// =====================================================
// INVOICE MODEL
// =====================================================

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const enterpriseLogger = require('../utils/logger');

const Invoice = sequelize.define('Invoice', {
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
  filingId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'filing_id',
    references: {
      model: 'itr_filings',
      key: 'id',
    },
  },
  serviceTicketId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'service_ticket_id',
    references: {
      model: 'service_tickets',
      key: 'id',
    },
  },
  invoiceNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    field: 'invoice_number',
  },
  invoiceDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'invoice_date',
  },
  dueDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'due_date',
  },
  status: {
    type: DataTypes.ENUM('draft', 'sent', 'paid', 'overdue', 'cancelled', 'refunded'),
    allowNull: false,
    defaultValue: 'draft',
  },
  paymentStatus: {
    type: DataTypes.ENUM('pending', 'paid', 'partial', 'failed', 'refunded'),
    allowNull: false,
    defaultValue: 'pending',
    field: 'payment_status',
  },
  subtotal: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  taxAmount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0.00,
    field: 'tax_amount',
  },
  discountAmount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0.00,
    field: 'discount_amount',
  },
  totalAmount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0.00,
    field: 'total_amount',
  },
  paidAmount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0.00,
    field: 'paid_amount',
  },
  currency: {
    type: DataTypes.STRING(3),
    allowNull: false,
    defaultValue: 'INR',
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  lineItems: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: [],
    field: 'line_items',
    comment: 'Array of invoice line items',
  },
  billingAddress: {
    type: DataTypes.JSONB,
    allowNull: true,
    field: 'billing_address',
    comment: 'Billing address information',
  },
  paymentMethod: {
    type: DataTypes.ENUM('offline', 'razorpay', 'stripe', 'bank_transfer', 'cheque'),
    allowNull: true,
    field: 'payment_method',
  },
  paymentReference: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'payment_reference',
  },
  paidAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'paid_at',
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {},
    comment: 'Additional metadata',
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
  tableName: 'invoices',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['invoice_number'],
    },
    {
      fields: ['user_id'],
    },
    {
      fields: ['filing_id'],
    },
    {
      fields: ['service_ticket_id'],
    },
    {
      fields: ['status'],
    },
    {
      fields: ['payment_status'],
    },
    {
      fields: ['invoice_date'],
    },
    {
      fields: ['due_date'],
    },
  ],
});

// Instance methods
Invoice.prototype.addLineItem = async function(item) {
  if (!this.lineItems) {
    this.lineItems = [];
  }

  this.lineItems.push({
    id: Date.now().toString(),
    description: item.description,
    quantity: item.quantity || 1,
    unitPrice: item.unitPrice,
    amount: (item.quantity || 1) * item.unitPrice,
    ...item,
  });

  await this.recalculateTotals();
  await this.save();
};

Invoice.prototype.removeLineItem = async function(itemId) {
  if (this.lineItems) {
    this.lineItems = this.lineItems.filter(item => item.id !== itemId);
    await this.recalculateTotals();
    await this.save();
  }
};

Invoice.prototype.recalculateTotals = async function() {
  if (!this.lineItems || this.lineItems.length === 0) {
    this.subtotal = 0;
    this.totalAmount = 0;
    return;
  }

  this.subtotal = this.lineItems.reduce((sum, item) => sum + (item.amount || 0), 0);
  this.totalAmount = this.subtotal + this.taxAmount - this.discountAmount;

  // Ensure total amount is not negative
  if (this.totalAmount < 0) {
    this.totalAmount = 0;
  }
};

Invoice.prototype.markAsPaid = async function(paymentMethod, paymentReference, paidAmount = null) {
  this.status = 'paid';
  this.paymentStatus = 'paid';
  this.paymentMethod = paymentMethod;
  this.paymentReference = paymentReference;
  this.paidAmount = paidAmount || this.totalAmount;
  this.paidAt = new Date();

  await this.save();

  enterpriseLogger.info('Invoice marked as paid', {
    invoiceId: this.id,
    invoiceNumber: this.invoiceNumber,
    paymentMethod,
    paymentReference,
    paidAmount: this.paidAmount,
  });
};

Invoice.prototype.markAsOverdue = async function() {
  if (this.status === 'sent' && this.paymentStatus === 'pending') {
    this.status = 'overdue';
    await this.save();

    enterpriseLogger.info('Invoice marked as overdue', {
      invoiceId: this.id,
      invoiceNumber: this.invoiceNumber,
      dueDate: this.dueDate,
    });
  }
};

Invoice.prototype.sendInvoice = async function() {
  this.status = 'sent';
  await this.save();

  enterpriseLogger.info('Invoice sent', {
    invoiceId: this.id,
    invoiceNumber: this.invoiceNumber,
    userId: this.userId,
  });
};

Invoice.prototype.cancelInvoice = async function(reason) {
  this.status = 'cancelled';
  this.notes = this.notes ? `${this.notes}\nCancelled: ${reason}` : `Cancelled: ${reason}`;
  await this.save();

  enterpriseLogger.info('Invoice cancelled', {
    invoiceId: this.id,
    invoiceNumber: this.invoiceNumber,
    reason,
  });
};

// Class methods
Invoice.generateInvoiceNumber = function() {
  const prefix = 'INV';
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  const timestamp = Date.now().toString(36).toUpperCase();
  return `${prefix}-${year}${month}-${timestamp}`;
};

Invoice.getOverdueInvoices = async function() {
  const today = new Date();
  return await Invoice.findAll({
    where: {
      status: 'sent',
      paymentStatus: 'pending',
      dueDate: {
        [sequelize.Op.lt]: today,
      },
    },
  });
};

Invoice.getStatsByStatus = async function() {
  const stats = await Invoice.findAll({
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
};

Invoice.getStatsByPaymentStatus = async function() {
  const stats = await Invoice.findAll({
    attributes: [
      'payment_status',
      [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
    ],
    group: ['payment_status'],
    raw: true,
  });

  return stats.reduce((acc, stat) => {
    acc[stat.payment_status] = parseInt(stat.count);
    return acc;
  }, {});
};

Invoice.getRevenueStats = async function(startDate, endDate) {
  const whereClause = {};

  if (startDate && endDate) {
    whereClause.invoice_date = {
      [sequelize.Op.between]: [startDate, endDate],
    };
  }

  const stats = await Invoice.findAll({
    where: whereClause,
    attributes: [
      [sequelize.fn('SUM', sequelize.col('total_amount')), 'totalRevenue'],
      [sequelize.fn('SUM', sequelize.col('paid_amount')), 'paidRevenue'],
      [sequelize.fn('COUNT', sequelize.col('id')), 'totalInvoices'],
    ],
    raw: true,
  });

  return {
    totalRevenue: parseFloat(stats[0].totalRevenue) || 0,
    paidRevenue: parseFloat(stats[0].paidRevenue) || 0,
    totalInvoices: parseInt(stats[0].totalInvoices) || 0,
  };
};

// Hooks
Invoice.beforeCreate(async (invoice) => {
  if (!invoice.invoiceNumber) {
    invoice.invoiceNumber = Invoice.generateInvoiceNumber();
  }

  if (!invoice.dueDate) {
    // Default due date is 30 days from invoice date
    const dueDate = new Date(invoice.invoiceDate);
    dueDate.setDate(dueDate.getDate() + 30);
    invoice.dueDate = dueDate;
  }

  await invoice.recalculateTotals();
});

Invoice.afterCreate(async (invoice) => {
  enterpriseLogger.info('Invoice created', {
    invoiceId: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    userId: invoice.userId,
    totalAmount: invoice.totalAmount,
    status: invoice.status,
  });
});

Invoice.afterUpdate(async (invoice) => {
  if (invoice.changed('status')) {
    enterpriseLogger.info('Invoice status changed', {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      oldStatus: invoice._previousDataValues.status,
      newStatus: invoice.status,
    });
  }
});

enterpriseLogger.info('Invoice model defined');

module.exports = { Invoice };
