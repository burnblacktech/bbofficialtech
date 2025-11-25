// =====================================================
// CA FIRM MODEL - ENTERPRISE GRADE
// Manages CA firm entities and their associations
// =====================================================

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const enterpriseLogger = require('../utils/logger');

const CAFirm = sequelize.define('CAFirm', {
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
  },
  gstNumber: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
    validate: {
      len: [15, 15], // GST number format validation
    },
    field: 'gst_number',
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      len: [10, 15],
    },
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isEmail: true,
    },
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
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'suspended'),
    defaultValue: 'active',
    allowNull: false,
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {},
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
  tableName: 'ca_firms',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['gst_number'],
    },
    {
      fields: ['created_by'],
    },
    {
      fields: ['status'],
    },
    {
      fields: ['name'],
    },
  ],
});

// Instance methods
CAFirm.prototype.getStaffCount = async function() {
  const { User } = require('./index');
  return await User.count({
    where: {
      caFirmId: this.id,
      role: ['CA', 'CA_FIRM_ADMIN'],
      status: 'active',
    },
  });
};

CAFirm.prototype.getClientCount = async function() {
  const { User } = require('./index');
  return await User.count({
    where: {
      caFirmId: this.id,
      role: 'END_USER',
      status: 'active',
    },
  });
};

CAFirm.prototype.getActiveFilingsCount = async function() {
  const { ITRFiling } = require('./index');
  const { User } = require('./index');

  const firmUsers = await User.findAll({
    where: { caFirmId: this.id },
    attributes: ['id'],
  });

  const userIds = firmUsers.map(user => user.id);

  return await ITRFiling.count({
    where: {
      userId: userIds,
      status: ['draft', 'submitted', 'under_review'],
    },
  });
};

// Class methods
CAFirm.findByAdmin = async function(adminUserId) {
  return await this.findOne({
    where: {
      createdBy: adminUserId,
      status: 'active',
    },
  });
};

CAFirm.getFirmStats = async function(firmId) {
  const firm = await this.findByPk(firmId);
  if (!firm) {
    throw new Error('CA Firm not found');
  }

  const [staffCount, clientCount, activeFilingsCount] = await Promise.all([
    firm.getStaffCount(),
    firm.getClientCount(),
    firm.getActiveFilingsCount(),
  ]);

  return {
    firm,
    stats: {
      staffCount,
      clientCount,
      activeFilingsCount,
    },
  };
};

// Hooks
CAFirm.beforeCreate(async (firm, options) => {
  enterpriseLogger.info('Creating CA Firm', {
    name: firm.name,
    createdBy: firm.createdBy,
    gstNumber: firm.gstNumber,
  });
});

CAFirm.afterCreate(async (firm, options) => {
  enterpriseLogger.info('CA Firm created successfully', {
    firmId: firm.id,
    name: firm.name,
    createdBy: firm.createdBy,
  });
});

CAFirm.beforeUpdate(async (firm, options) => {
  enterpriseLogger.info('Updating CA Firm', {
    firmId: firm.id,
    name: firm.name,
    updatedFields: Object.keys(firm.changed()),
  });
});

module.exports = CAFirm;
