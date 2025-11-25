// =====================================================
// AUDIT LOG MODEL
// =====================================================

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const enterpriseLogger = require('../utils/logger');

const AuditLog = sequelize.define('AuditLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
    field: 'user_id',
  },
  action: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  resource: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  resourceId: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'resource_id',
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
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
  },
  success: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false,
  },
  errorMessage: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'error_message',
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false,
  },
}, {
  tableName: 'audit_logs',
  timestamps: false,
  underscored: true,
  indexes: [
    {
      fields: ['user_id'],
    },
    {
      fields: ['action'],
    },
    {
      fields: ['resource'],
    },
    {
      fields: ['timestamp'],
    },
    {
      fields: ['success'],
    },
    {
      fields: ['ip_address'],
    },
  ],
});

// Class methods
AuditLog.logAuthEvent = async function(data) {
  try {
    return await AuditLog.create({
      userId: data.userId,
      action: data.action,
      resource: 'auth',
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      metadata: data.metadata,
      success: data.success !== false,
      errorMessage: data.errorMessage,
    });
  } catch (error) {
    enterpriseLogger.error('Audit log creation error', {
      action: data.action,
      error: error.message,
    });
    // Don't throw error to avoid breaking the main flow
  }
};

AuditLog.getUserAuditTrail = async function(userId, limit = 100) {
  try {
    return await AuditLog.findAll({
      where: { userId },
      order: [['timestamp', 'DESC']],
      limit,
    });
  } catch (error) {
    enterpriseLogger.error('Get user audit trail error', {
      userId,
      error: error.message,
    });
    throw error;
  }
};

AuditLog.getSystemAuditTrail = async function(limit = 1000) {
  try {
    return await AuditLog.findAll({
      order: [['timestamp', 'DESC']],
      limit,
    });
  } catch (error) {
    enterpriseLogger.error('Get system audit trail error', {
      error: error.message,
    });
    throw error;
  }
};

AuditLog.cleanupOldLogs = async function(retentionYears = 7) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setFullYear(cutoffDate.getFullYear() - retentionYears);

    const result = await AuditLog.destroy({
      where: {
        timestamp: {
          [sequelize.Sequelize.Op.lt]: cutoffDate,
        },
      },
    });

    enterpriseLogger.info('Audit log cleanup completed', {
      yearsRetained: retentionYears,
      cutoffDate: cutoffDate.toISOString(),
      deletedCount: result,
    });

    return result;
  } catch (error) {
    enterpriseLogger.error('Cleanup old audit logs error', {
      error: error.message,
      retentionYears,
    });
    throw error;
  }
};

// Compliance audit cleanup with configurable retention
AuditLog.performComplianceCleanup = async function() {
  try {
    const retentionYears = parseInt(process.env.AUDIT_LOG_RETENTION_YEARS) || 7;

    enterpriseLogger.info('Starting compliance audit log cleanup', {
      retentionYears,
      timestamp: new Date().toISOString(),
    });

    const deletedCount = await AuditLog.cleanupOldLogs(retentionYears);

    enterpriseLogger.info('Compliance audit cleanup completed', {
      retentionYears,
      deletedLogs: deletedCount,
    });

    return {
      success: true,
      retentionYears,
      deletedCount,
      cleanupDate: new Date().toISOString(),
    };
  } catch (error) {
    enterpriseLogger.error('Compliance audit cleanup failed', {
      error: error.message,
    });
    throw error;
  }
};

module.exports = AuditLog;
