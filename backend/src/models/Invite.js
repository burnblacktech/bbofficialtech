const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./User');
const CAFirm = require('./CAFirm');
const enterpriseLogger = require('../utils/logger');

const Invite = sequelize.define('Invite', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: true,
    },
  },
  token: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  role: {
    type: DataTypes.ENUM('CA_FIRM_ADMIN', 'CA'),
    allowNull: false,
  },
  invitedBy: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: 'id',
    },
    field: 'invited_by',
  },
  caFirmId: {
    type: DataTypes.UUID,
    allowNull: true, // Null for CA_FIRM_ADMIN invites initially
    references: {
      model: CAFirm,
      key: 'id',
    },
    field: 'ca_firm_id',
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'expires_at',
  },
  status: {
    type: DataTypes.ENUM('pending', 'accepted', 'expired', 'revoked'),
    defaultValue: 'pending',
    allowNull: false,
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
  tableName: 'invites',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['email'] },
    { fields: ['role'] },
    { fields: ['invited_by'] },
    { fields: ['ca_firm_id'] },
    { fields: ['token'], unique: true },
    { fields: ['expires_at'] },
    { fields: ['status'] },
  ],
});

Invite.createInvite = async function({ email, role, invitedBy, caFirmId = null, expiresInDays = 7 }) {
  const token = require('crypto').randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

  const invite = await this.create({
    email,
    token,
    role,
    invitedBy,
    caFirmId,
    expiresAt,
  });

  enterpriseLogger.info('Invite created', { inviteId: invite.id, email, role, invitedBy });
  return invite;
};

Invite.validateInvite = async function(token) {
  const { Op } = require('sequelize');
  const invite = await this.findOne({
    where: {
      token,
      status: 'pending',
      expiresAt: {
        [Op.gt]: new Date(),
      },
    },
  });

  if (!invite) {
    enterpriseLogger.warn('Invalid or expired invite token', { token });
    return { valid: false, message: 'Invalid or expired invitation token.' };
  }

  return { valid: true, invite };
};

Invite.acceptInvite = async function(token, userId) {
  const { valid, invite } = await this.validateInvite(token);

  if (!valid) {
    throw new Error('Invalid or expired invitation token.');
  }

  await invite.update({ status: 'accepted' });
  enterpriseLogger.info('Invite accepted', { inviteId: invite.id, userId });

  return invite;
};

Invite.findPendingInvites = async function(email) {
  const { Op } = require('sequelize');
  return await this.findAll({
    where: {
      email,
      status: 'pending',
      expiresAt: {
        [Op.gt]: new Date(),
      },
    },
    order: [['createdAt', 'DESC']],
  });
};

Invite.cleanupExpiredInvites = async function() {
  const { Op } = require('sequelize');
  const result = await this.update(
    { status: 'expired' },
    {
      where: {
        status: 'pending',
        expiresAt: {
          [Op.lt]: new Date(),
        },
      },
    },
  );

  if (result[0] > 0) {
    enterpriseLogger.info('Expired invites cleaned up', {
      count: result[0],
    });
  }

  return result[0];
};

// Hooks
Invite.beforeCreate(async (invite) => {
  // Validate role permissions
  const inviter = await User.findByPk(invite.invitedBy);
  if (!inviter) {
    throw new Error('Inviter user not found.');
  }

  if (invite.role === 'CA_FIRM_ADMIN') {
    if (inviter.role !== 'PLATFORM_ADMIN' && inviter.role !== 'SUPER_ADMIN') {
      throw new Error('Only Platform Admins or Super Admins can invite CA Firm Admins.');
    }
    if (invite.caFirmId) {
      throw new Error('CA Firm Admin invites should not initially be associated with a caFirmId.');
    }
  } else if (invite.role === 'CA') {
    if (inviter.role !== 'CA_FIRM_ADMIN' && inviter.role !== 'SUPER_ADMIN') {
      throw new Error('Only CA Firm Admins or Super Admins can invite CA staff.');
    }
    if (!invite.caFirmId) {
      throw new Error('CA staff invites must be associated with a caFirmId.');
    }
    if (inviter.caFirmId !== invite.caFirmId && inviter.role !== 'SUPER_ADMIN') {
      throw new Error('CA Firm Admin can only invite staff to their own firm.');
    }
  }
});

module.exports = Invite;
