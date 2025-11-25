// =====================================================
// USER SESSION MODEL
// =====================================================

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const enterpriseLogger = require('../utils/logger');

const UserSession = sequelize.define('UserSession', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
    field: 'user_id',
  },
  refreshTokenHash: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: 'refresh_token_hash',
  },
  deviceInfo: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'device_info',
  },
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'ip_address',
  },
  userAgent: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'user_agent',
  },
  lastActive: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false,
    field: 'last_active',
  },
  revoked: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
  },
  revokedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'revoked_at',
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'expires_at',
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
  tableName: 'user_sessions',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['user_id'],
    },
    {
      fields: ['refresh_token_hash'],
    },
    {
      fields: ['revoked'],
    },
    {
      fields: ['expires_at'],
    },
    {
      fields: ['last_active'],
    },
  ],
});

// Class methods
UserSession.findActiveSessions = async function(userId) {
  try {
    return await UserSession.findAll({
      where: {
        userId,
        revoked: false,
        expiresAt: {
          [sequelize.Sequelize.Op.gt]: new Date(),
        },
      },
      order: [['lastActive', 'DESC']],
    });
  } catch (error) {
    enterpriseLogger.error('Find active sessions error', {
      userId,
      error: error.message,
    });
    throw error;
  }
};

UserSession.revokeAllSessions = async function(userId) {
  try {
    return await UserSession.update(
      {
        revoked: true,
        revokedAt: new Date(),
      },
      {
        where: {
          userId,
          revoked: false,
        },
      },
    );
  } catch (error) {
    enterpriseLogger.error('Revoke all sessions error', {
      userId,
      error: error.message,
    });
    throw error;
  }
};

UserSession.cleanupExpiredSessions = async function() {
  try {
    return await UserSession.destroy({
      where: {
        expiresAt: {
          [sequelize.Sequelize.Op.lt]: new Date(),
        },
      },
    });
  } catch (error) {
    enterpriseLogger.error('Cleanup expired sessions error', {
      error: error.message,
    });
    throw error;
  }
};

// Auto-evict oldest sessions when limit exceeded
UserSession.enforceConcurrentLimit = async function(userId, maxSessions = 3, userEmail = null) {
  try {
    const activeSessions = await this.findActiveSessions(userId);

    if (activeSessions.length >= maxSessions) {
      // Sort by lastActive (oldest first)
      const sortedSessions = activeSessions.sort(
        (a, b) => new Date(a.lastActive) - new Date(b.lastActive),
      );

      // Calculate how many to evict
      const sessionsToEvict = sortedSessions.length - (maxSessions - 1);
      const sessionsToEvictList = sortedSessions.slice(0, sessionsToEvict);

      // Revoke oldest sessions
      for (const session of sessionsToEvictList) {
        await session.update({
          revoked: true,
          revokedAt: new Date(),
        });
      }

      // Send notification email if email provided
      if (userEmail && sessionsToEvictList.length > 0) {
        const evictedDevices = sessionsToEvictList.map(session => session.deviceInfo || 'Unknown Device');

        enterpriseLogger.info('Concurrent session evicted', {
          userId,
          userEmail,
          evictedSessions: sessionsToEvictList.length,
          evictedDevices,
        });

        // TODO: Implement email notification service
        // For now, just log the eviction event for audit
      }

      return sessionsToEvictList.length; // Return count of evicted sessions
    }

    return 0; // No sessions evicted
  } catch (error) {
    enterpriseLogger.error('Concurrent session limit enforcement failed', {
      userId,
      error: error.message,
    });
    throw error;
  }
};

module.exports = UserSession;
