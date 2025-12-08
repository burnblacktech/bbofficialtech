// =====================================================
// BANK ACCOUNT MODEL
// User bank accounts for refunds and payments
// =====================================================

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const BankAccount = sequelize.define('BankAccount', {
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
  bankName: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'bank_name',
  },
  accountNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'account_number',
  },
  ifsc: {
    type: DataTypes.STRING(11),
    allowNull: false,
    validate: {
      is: /^[A-Z]{4}0[A-Z0-9]{6}$/i,
    },
  },
  accountHolderName: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'account_holder_name',
  },
  accountType: {
    type: DataTypes.ENUM('savings', 'current'),
    allowNull: false,
    defaultValue: 'savings',
    field: 'account_type',
  },
  isPrimary: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_primary',
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
  tableName: 'bank_accounts',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['user_id'],
    },
    {
      fields: ['user_id', 'is_primary'],
    },
  ],
});

module.exports = BankAccount;

