// =====================================================
// AUDIT SERVICE
// =====================================================

const enterpriseLogger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

class AuditService {
  constructor() {
    this.auditLogs = []; // In production, this would be a database table
    enterpriseLogger.info('AuditService initialized');
  }

  /**
   * Log audit event
   * @param {string} userId - User ID
   * @param {string} action - Action performed
   * @param {string} resource - Resource affected
   * @param {object} details - Additional details
   * @param {string} ipAddress - IP address
   * @param {string} userAgent - User agent
   * @returns {Promise<void>}
   */
  async logEvent(userId, action, resource, details = {}, ipAddress = null, userAgent = null) {
    try {
      const auditEvent = {
        id: uuidv4(),
        userId,
        action,
        resource,
        details: JSON.stringify(details),
        ipAddress,
        userAgent,
        timestamp: new Date().toISOString(),
        severity: this.getSeverity(action)
      };

      // In production, save to database
      this.auditLogs.push(auditEvent);

      enterpriseLogger.info('Audit event logged', {
        auditId: auditEvent.id,
        userId,
        action,
        resource,
        severity: auditEvent.severity
      });

      // Log to enterprise logger with structured data
      enterpriseLogger.logAudit(action, {
        userId,
        resource,
        details,
        ipAddress,
        userAgent,
        auditId: auditEvent.id
      });

    } catch (error) {
      enterpriseLogger.error('Failed to log audit event', {
        error: error.message,
        userId,
        action,
        resource
      });
    }
  }

  /**
   * Log authentication events
   * @param {string} userId - User ID
   * @param {string} action - Login, logout, failed_login, etc.
   * @param {object} details - Additional details
   * @param {string} ipAddress - IP address
   * @param {string} userAgent - User agent
   */
  async logAuthEvent(userId, action, details = {}, ipAddress = null, userAgent = null) {
    await this.logEvent(userId, action, 'authentication', details, ipAddress, userAgent);
  }

  /**
   * Log ITR filing events
   * @param {string} userId - User ID
   * @param {string} action - Create, update, submit, etc.
   * @param {string} filingId - Filing ID
   * @param {object} details - Additional details
   * @param {string} ipAddress - IP address
   */
  async logFilingEvent(userId, action, filingId, details = {}, ipAddress = null) {
    await this.logEvent(userId, action, 'itr_filing', {
      filingId,
      ...details
    }, ipAddress);
  }

  /**
   * Log admin actions
   * @param {string} adminId - Admin user ID
   * @param {string} action - Admin action
   * @param {string} targetResource - Target resource
   * @param {object} details - Additional details
   * @param {string} ipAddress - IP address
   */
  async logAdminAction(adminId, action, targetResource, details = {}, ipAddress = null) {
    await this.logEvent(adminId, action, `admin_${targetResource}`, {
      targetResource,
      ...details
    }, ipAddress);
  }

  /**
   * Log data access events
   * @param {string} userId - User ID
   * @param {string} action - Read, update, delete
   * @param {string} dataType - Type of data accessed
   * @param {string} dataId - ID of data accessed
   * @param {object} details - Additional details
   * @param {string} ipAddress - IP address
   */
  async logDataAccess(userId, action, dataType, dataId, details = {}, ipAddress = null) {
    await this.logEvent(userId, action, `data_${dataType}`, {
      dataId,
      ...details
    }, ipAddress);
  }

  /**
   * Log system events
   * @param {string} action - System action
   * @param {string} component - System component
   * @param {object} details - Additional details
   */
  async logSystemEvent(action, component, details = {}) {
    await this.logEvent('SYSTEM', action, `system_${component}`, details);
  }

  /**
   * Get audit logs for a user
   * @param {string} userId - User ID
   * @param {object} filters - Filter options
   * @returns {Promise<Array>} - Audit logs
   */
  async getUserAuditLogs(userId, filters = {}) {
    try {
      let logs = this.auditLogs.filter(log => log.userId === userId);

      // Apply filters
      if (filters.action) {
        logs = logs.filter(log => log.action === filters.action);
      }
      if (filters.resource) {
        logs = logs.filter(log => log.resource === filters.resource);
      }
      if (filters.startDate) {
        logs = logs.filter(log => new Date(log.timestamp) >= new Date(filters.startDate));
      }
      if (filters.endDate) {
        logs = logs.filter(log => new Date(log.timestamp) <= new Date(filters.endDate));
      }
      if (filters.severity) {
        logs = logs.filter(log => log.severity === filters.severity);
      }

      // Sort by timestamp (newest first)
      logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      // Apply pagination
      if (filters.limit) {
        logs = logs.slice(0, filters.limit);
      }

      enterpriseLogger.info('Retrieved user audit logs', {
        userId,
        count: logs.length,
        filters
      });

      return logs;
    } catch (error) {
      enterpriseLogger.error('Failed to retrieve user audit logs', {
        error: error.message,
        userId,
        filters
      });
      throw error;
    }
  }

  /**
   * Get audit logs for admin review
   * @param {object} filters - Filter options
   * @returns {Promise<Array>} - Audit logs
   */
  async getAdminAuditLogs(filters = {}) {
    try {
      let logs = this.auditLogs;

      // Apply filters
      if (filters.userId) {
        logs = logs.filter(log => log.userId === filters.userId);
      }
      if (filters.action) {
        logs = logs.filter(log => log.action === filters.action);
      }
      if (filters.resource) {
        logs = logs.filter(log => log.resource === filters.resource);
      }
      if (filters.startDate) {
        logs = logs.filter(log => new Date(log.timestamp) >= new Date(filters.startDate));
      }
      if (filters.endDate) {
        logs = logs.filter(log => new Date(log.timestamp) <= new Date(filters.endDate));
      }
      if (filters.severity) {
        logs = logs.filter(log => log.severity === filters.severity);
      }

      // Sort by timestamp (newest first)
      logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      // Apply pagination
      if (filters.limit) {
        logs = logs.slice(0, filters.limit);
      }

      enterpriseLogger.info('Retrieved admin audit logs', {
        count: logs.length,
        filters
      });

      return logs;
    } catch (error) {
      enterpriseLogger.error('Failed to retrieve admin audit logs', {
        error: error.message,
        filters
      });
      throw error;
    }
  }

  /**
   * Get audit statistics
   * @param {object} filters - Filter options
   * @returns {Promise<object>} - Audit statistics
   */
  async getAuditStatistics(filters = {}) {
    try {
      let logs = this.auditLogs;

      // Apply filters
      if (filters.startDate) {
        logs = logs.filter(log => new Date(log.timestamp) >= new Date(filters.startDate));
      }
      if (filters.endDate) {
        logs = logs.filter(log => new Date(log.timestamp) <= new Date(filters.endDate));
      }

      const stats = {
        totalEvents: logs.length,
        eventsByAction: {},
        eventsByResource: {},
        eventsBySeverity: {},
        eventsByUser: {},
        eventsByDay: {}
      };

      logs.forEach(log => {
        // Count by action
        stats.eventsByAction[log.action] = (stats.eventsByAction[log.action] || 0) + 1;
        
        // Count by resource
        stats.eventsByResource[log.resource] = (stats.eventsByResource[log.resource] || 0) + 1;
        
        // Count by severity
        stats.eventsBySeverity[log.severity] = (stats.eventsBySeverity[log.severity] || 0) + 1;
        
        // Count by user
        stats.eventsByUser[log.userId] = (stats.eventsByUser[log.userId] || 0) + 1;
        
        // Count by day
        const day = log.timestamp.split('T')[0];
        stats.eventsByDay[day] = (stats.eventsByDay[day] || 0) + 1;
      });

      enterpriseLogger.info('Generated audit statistics', {
        totalEvents: stats.totalEvents,
        filters
      });

      return stats;
    } catch (error) {
      enterpriseLogger.error('Failed to generate audit statistics', {
        error: error.message,
        filters
      });
      throw error;
    }
  }

  /**
   * Determine severity level for action
   * @param {string} action - Action performed
   * @returns {string} - Severity level
   */
  getSeverity(action) {
    const highSeverityActions = [
      'delete', 'remove', 'suspend', 'terminate', 'submit', 'approve', 'reject'
    ];
    
    const mediumSeverityActions = [
      'update', 'modify', 'create', 'login', 'logout', 'upload', 'download'
    ];

    if (highSeverityActions.some(highAction => action.toLowerCase().includes(highAction))) {
      return 'HIGH';
    }
    
    if (mediumSeverityActions.some(mediumAction => action.toLowerCase().includes(mediumAction))) {
      return 'MEDIUM';
    }
    
    return 'LOW';
  }

  /**
   * Export audit logs
   * @param {object} filters - Filter options
   * @param {string} format - Export format (json, csv)
   * @returns {Promise<string>} - Exported data
   */
  async exportAuditLogs(filters = {}, format = 'json') {
    try {
      const logs = await this.getAdminAuditLogs(filters);
      
      if (format === 'csv') {
        const csv = this.convertToCSV(logs);
        return csv;
      }
      
      return JSON.stringify(logs, null, 2);
    } catch (error) {
      enterpriseLogger.error('Failed to export audit logs', {
        error: error.message,
        filters,
        format
      });
      throw error;
    }
  }

  /**
   * Convert logs to CSV format
   * @param {Array} logs - Audit logs
   * @returns {string} - CSV data
   */
  convertToCSV(logs) {
    if (logs.length === 0) return '';
    
    const headers = ['id', 'userId', 'action', 'resource', 'details', 'ipAddress', 'userAgent', 'timestamp', 'severity'];
    const csvRows = [headers.join(',')];
    
    logs.forEach(log => {
      const row = headers.map(header => {
        const value = log[header] || '';
        return `"${value.toString().replace(/"/g, '""')}"`;
      });
      csvRows.push(row.join(','));
    });
    
    return csvRows.join('\n');
  }
}

module.exports = new AuditService();
