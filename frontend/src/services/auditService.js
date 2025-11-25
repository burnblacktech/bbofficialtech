// Justification: Frontend Audit Service - Client-side audit operations management
// Provides audit log viewing, filtering, and export functionality
// Essential for admin audit trail management and compliance
// Supports audit log retrieval, filtering, and data export

import api from './api';

class AuditService {
  // Justification: Get Audit Logs - Retrieve audit logs with filtering
  // Provides audit log retrieval with comprehensive filtering options
  // Essential for audit trail investigation and monitoring
  async getAuditLogs(filters = {}) {
    try {
      const response = await api.get('/audit/logs', { params: filters });

      if (response.data.success) {
        return {
          logs: response.data.data.logs,
          pagination: response.data.data.pagination,
          success: true,
        };
      } else {
        throw new Error(response.data.error || 'Failed to get audit logs');
      }
    } catch (error) {
      throw new Error(error.response?.data?.error || error.message || 'Failed to get audit logs');
    }
  }

  // Justification: Get Audit Statistics - Retrieve audit statistics
  // Provides audit statistics for dashboard display
  // Essential for audit overview and monitoring
  async getAuditStatistics() {
    try {
      const response = await api.get('/audit/statistics');

      if (response.data.success) {
        return {
          statistics: response.data.data.statistics,
          success: true,
        };
      } else {
        throw new Error(response.data.error || 'Failed to get audit statistics');
      }
    } catch (error) {
      throw new Error(error.response?.data?.error || error.message || 'Failed to get audit statistics');
    }
  }

  // Justification: Get Event Types - Retrieve available event types
  // Provides event type mapping for filtering
  // Essential for audit log filtering and categorization
  async getEventTypes() {
    try {
      const response = await api.get('/audit/event-types');

      if (response.data.success) {
        return {
          eventTypes: response.data.data.eventTypes,
          success: true,
        };
      } else {
        throw new Error(response.data.error || 'Failed to get event types');
      }
    } catch (error) {
      throw new Error(error.response?.data?.error || error.message || 'Failed to get event types');
    }
  }

  // Justification: Get Audit Levels - Retrieve available audit levels
  // Provides audit level mapping for filtering
  // Essential for audit log filtering and prioritization
  async getAuditLevels() {
    try {
      const response = await api.get('/audit/levels');

      if (response.data.success) {
        return {
          auditLevels: response.data.data.auditLevels,
          success: true,
        };
      } else {
        throw new Error(response.data.error || 'Failed to get audit levels');
      }
    } catch (error) {
      throw new Error(error.response?.data?.error || error.message || 'Failed to get audit levels');
    }
  }

  // Justification: Export Audit Logs - Export audit data
  // Provides audit data export functionality
  // Essential for compliance reporting and external analysis
  async exportAuditLogs(filters = {}, format = 'json') {
    try {
      const response = await api.post('/audit/export', {
        ...filters,
        format,
      }, {
        responseType: format === 'csv' ? 'blob' : 'json',
      });

      if (format === 'csv') {
        return {
          data: response.data,
          filename: 'audit_logs.csv',
          success: true,
        };
      } else {
        return {
          data: response.data.data,
          filename: 'audit_logs.json',
          success: true,
        };
      }
    } catch (error) {
      throw new Error(error.response?.data?.error || error.message || 'Failed to export audit logs');
    }
  }

  // Justification: Get Audit Log Details - Get detailed audit log information
  // Provides detailed audit log information for investigation
  // Essential for detailed audit trail analysis
  async getAuditLogDetails(auditId) {
    try {
      const response = await api.get(`/audit/logs/${auditId}`);

      if (response.data.success) {
        return {
          log: response.data.data.log,
          success: true,
        };
      } else {
        throw new Error(response.data.error || 'Failed to get audit log details');
      }
    } catch (error) {
      throw new Error(error.response?.data?.error || error.message || 'Failed to get audit log details');
    }
  }

  // Justification: Search Audit Logs - Search audit logs with advanced criteria
  // Provides advanced search capabilities for audit logs
  // Essential for complex audit trail investigation
  async searchAuditLogs(searchCriteria) {
    try {
      const response = await api.post('/audit/search', searchCriteria);

      if (response.data.success) {
        return {
          logs: response.data.data.logs,
          pagination: response.data.data.pagination,
          success: true,
        };
      } else {
        throw new Error(response.data.error || 'Failed to search audit logs');
      }
    } catch (error) {
      throw new Error(error.response?.data?.error || error.message || 'Failed to search audit logs');
    }
  }

  // Justification: Get Audit Dashboard Data - Get comprehensive audit dashboard data
  // Provides all audit data needed for dashboard display
  // Essential for audit dashboard initialization
  async getAuditDashboardData() {
    try {
      const [logsRes, statsRes, typesRes, levelsRes] = await Promise.all([
        this.getAuditLogs({ limit: 100, offset: 0 }),
        this.getAuditStatistics(),
        this.getEventTypes(),
        this.getAuditLevels(),
      ]);

      return {
        logs: logsRes.logs,
        pagination: logsRes.pagination,
        statistics: statsRes.statistics,
        eventTypes: typesRes.eventTypes,
        auditLevels: levelsRes.auditLevels,
        success: true,
      };
    } catch (error) {
      throw new Error(error.message || 'Failed to get audit dashboard data');
    }
  }
}

export const auditService = new AuditService();
