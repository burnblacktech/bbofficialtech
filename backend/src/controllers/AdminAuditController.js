// =====================================================
// ADMIN AUDIT CONTROLLER
// Handles audit log viewing and management for admin
// =====================================================

const { AuditLog, User } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');
const enterpriseLogger = require('../utils/logger');
const { AppError } = require('../middleware/errorHandler');

class AdminAuditController {
  /**
   * Get audit logs with filters
   * GET /api/admin/audit/logs
   */
  async getAuditLogs(req, res, next) {
    try {
      const adminId = req.user.id;
      const {
        userId,
        action,
        resource,
        resourceId,
        success,
        ipAddress,
        startDate,
        endDate,
        severity,
        search,
        limit = 50,
        offset = 0,
        sortBy = 'timestamp',
        sortOrder = 'DESC',
      } = req.query;

      const whereClause = {};

      if (userId) {
        whereClause.userId = userId;
      }
      if (action) {
        whereClause.action = { [Op.iLike]: `%${action}%` };
      }
      if (resource) {
        whereClause.resource = { [Op.iLike]: `%${resource}%` };
      }
      if (resourceId) {
        whereClause.resourceId = resourceId;
      }
      if (success !== undefined) {
        whereClause.success = success === 'true';
      }
      if (ipAddress) {
        whereClause.ipAddress = { [Op.iLike]: `%${ipAddress}%` };
      }
      if (startDate || endDate) {
        whereClause.timestamp = {};
        if (startDate) {
          whereClause.timestamp[Op.gte] = new Date(startDate);
        }
        if (endDate) {
          whereClause.timestamp[Op.lte] = new Date(endDate);
        }
      }
      if (search) {
        whereClause[Op.or] = [
          { action: { [Op.iLike]: `%${search}%` } },
          { resource: { [Op.iLike]: `%${search}%` } },
          { resourceId: { [Op.iLike]: `%${search}%` } },
        ];
      }

      const { count, rows: logs } = await AuditLog.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'fullName', 'email', 'role'],
            required: false,
          },
        ],
        order: [[sortBy, sortOrder]],
        limit: parseInt(limit),
        offset: parseInt(offset),
      });

      enterpriseLogger.info('Admin retrieved audit logs', {
        adminId,
        count,
        filters: Object.keys(whereClause).length,
      });

      res.status(200).json({
        success: true,
        message: 'Audit logs retrieved successfully',
        data: {
          logs,
          pagination: {
            total: count,
            limit: parseInt(limit),
            offset: parseInt(offset),
            totalPages: Math.ceil(count / limit),
          },
        },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to get audit logs via admin API', {
        error: error.message,
        adminId: req.user?.id,
        stack: error.stack,
      });
      next(error);
    }
  }

  /**
   * Get audit log statistics
   * GET /api/admin/audit/stats
   */
  async getAuditStats(req, res, next) {
    try {
      const adminId = req.user.id;
      const { startDate, endDate, timeRange = '7d' } = req.query;

      // Calculate date range
      let dateFrom, dateTo;
      if (startDate && endDate) {
        dateFrom = new Date(startDate);
        dateTo = new Date(endDate);
      } else {
        dateTo = new Date();
        const days = timeRange === '24h' ? 1 : timeRange === '30d' ? 30 : 7;
        dateFrom = new Date(dateTo - days * 24 * 60 * 60 * 1000);
      }

      const whereClause = {
        timestamp: { [Op.between]: [dateFrom, dateTo] },
      };

      // Get total events
      const totalEvents = await AuditLog.count({ where: whereClause });

      // Get events by action
      const eventsByAction = await AuditLog.findAll({
        where: whereClause,
        attributes: [
          'action',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        ],
        group: ['action'],
        order: [[sequelize.literal('count'), 'DESC']],
        limit: 10,
        raw: true,
      });

      // Get events by resource
      const eventsByResource = await AuditLog.findAll({
        where: whereClause,
        attributes: [
          'resource',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        ],
        group: ['resource'],
        order: [[sequelize.literal('count'), 'DESC']],
        limit: 10,
        raw: true,
      });

      // Get success vs failure
      const successStats = await AuditLog.findAll({
        where: whereClause,
        attributes: [
          'success',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        ],
        group: ['success'],
        raw: true,
      });

      // Get events by day
      const eventsByDay = await sequelize.query(`
        SELECT 
          DATE(timestamp) as date,
          COUNT(*) as count
        FROM audit_logs
        WHERE timestamp BETWEEN :dateFrom AND :dateTo
        GROUP BY DATE(timestamp)
        ORDER BY date ASC
      `, {
        replacements: { dateFrom, dateTo },
        type: sequelize.QueryTypes.SELECT,
      });

      // Get top users
      const topUsers = await AuditLog.findAll({
        where: whereClause,
        attributes: [
          'userId',
          [sequelize.fn('COUNT', sequelize.col('AuditLog.id')), 'count'],
        ],
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['fullName', 'email'],
          },
        ],
        group: ['AuditLog.userId', 'user.id', 'user.fullName', 'user.email'],
        order: [[sequelize.literal('count'), 'DESC']],
        limit: 10,
        raw: false,
      });

      // Get failed events
      const failedEvents = await AuditLog.count({
        where: {
          ...whereClause,
          success: false,
        },
      });

      enterpriseLogger.info('Admin retrieved audit statistics', {
        adminId,
        totalEvents,
        dateRange: { dateFrom, dateTo },
      });

      res.status(200).json({
        success: true,
        message: 'Audit statistics retrieved successfully',
        data: {
          summary: {
            totalEvents,
            failedEvents,
            successRate: totalEvents > 0 ? (((totalEvents - failedEvents) / totalEvents) * 100).toFixed(2) : 100,
          },
          eventsByAction: eventsByAction.map(item => ({
            action: item.action,
            count: parseInt(item.count),
          })),
          eventsByResource: eventsByResource.map(item => ({
            resource: item.resource,
            count: parseInt(item.count),
          })),
          successStats: successStats.reduce((acc, item) => {
            acc[item.success ? 'success' : 'failure'] = parseInt(item.count);
            return acc;
          }, {}),
          eventsByDay,
          topUsers: topUsers.map(item => ({
            userId: item.userId,
            name: item.user?.fullName || 'System',
            email: item.user?.email || 'N/A',
            count: parseInt(item.get('count')),
          })),
          dateRange: { from: dateFrom, to: dateTo },
        },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to get audit stats via admin API', {
        error: error.message,
        adminId: req.user?.id,
        stack: error.stack,
      });
      next(error);
    }
  }

  /**
   * Get security logs (failed logins, suspicious activity)
   * GET /api/admin/audit/security
   */
  async getSecurityLogs(req, res, next) {
    try {
      const adminId = req.user.id;
      const {
        startDate,
        endDate,
        limit = 50,
        offset = 0,
      } = req.query;

      const whereClause = {
        [Op.or]: [
          { success: false },
          { action: { [Op.iLike]: '%login%' } },
          { action: { [Op.iLike]: '%password%' } },
          { action: { [Op.iLike]: '%session%' } },
          { action: { [Op.iLike]: '%2fa%' } },
          { action: { [Op.iLike]: '%impersonate%' } },
        ],
      };

      if (startDate || endDate) {
        whereClause.timestamp = {};
        if (startDate) {
          whereClause.timestamp[Op.gte] = new Date(startDate);
        }
        if (endDate) {
          whereClause.timestamp[Op.lte] = new Date(endDate);
        }
      }

      const { count, rows: logs } = await AuditLog.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'fullName', 'email', 'role'],
            required: false,
          },
        ],
        order: [['timestamp', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset),
      });

      enterpriseLogger.info('Admin retrieved security logs', {
        adminId,
        count,
      });

      res.status(200).json({
        success: true,
        message: 'Security logs retrieved successfully',
        data: {
          logs,
          pagination: {
            total: count,
            limit: parseInt(limit),
            offset: parseInt(offset),
            totalPages: Math.ceil(count / limit),
          },
        },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to get security logs via admin API', {
        error: error.message,
        adminId: req.user?.id,
      });
      next(error);
    }
  }

  /**
   * Get admin activity logs
   * GET /api/admin/audit/admin-activity
   */
  async getAdminActivityLogs(req, res, next) {
    try {
      const adminId = req.user.id;
      const {
        adminUserId,
        startDate,
        endDate,
        limit = 50,
        offset = 0,
      } = req.query;

      const whereClause = {
        [Op.or]: [
          { resource: { [Op.iLike]: '%admin%' } },
          { action: { [Op.iLike]: '%admin%' } },
        ],
      };

      if (adminUserId) {
        whereClause.userId = adminUserId;
      }

      if (startDate || endDate) {
        whereClause.timestamp = {};
        if (startDate) {
          whereClause.timestamp[Op.gte] = new Date(startDate);
        }
        if (endDate) {
          whereClause.timestamp[Op.lte] = new Date(endDate);
        }
      }

      const { count, rows: logs } = await AuditLog.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'fullName', 'email', 'role'],
            required: false,
          },
        ],
        order: [['timestamp', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset),
      });

      enterpriseLogger.info('Admin retrieved admin activity logs', {
        adminId,
        count,
      });

      res.status(200).json({
        success: true,
        message: 'Admin activity logs retrieved successfully',
        data: {
          logs,
          pagination: {
            total: count,
            limit: parseInt(limit),
            offset: parseInt(offset),
            totalPages: Math.ceil(count / limit),
          },
        },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to get admin activity logs via admin API', {
        error: error.message,
        adminId: req.user?.id,
      });
      next(error);
    }
  }

  /**
   * Export audit logs
   * GET /api/admin/audit/export
   */
  async exportAuditLogs(req, res, next) {
    try {
      const adminId = req.user.id;
      const { format = 'csv', ...filters } = req.query;

      const whereClause = {};

      if (filters.userId) {
        whereClause.userId = filters.userId;
      }
      if (filters.action) {
        whereClause.action = { [Op.iLike]: `%${filters.action}%` };
      }
      if (filters.resource) {
        whereClause.resource = { [Op.iLike]: `%${filters.resource}%` };
      }
      if (filters.startDate || filters.endDate) {
        whereClause.timestamp = {};
        if (filters.startDate) {
          whereClause.timestamp[Op.gte] = new Date(filters.startDate);
        }
        if (filters.endDate) {
          whereClause.timestamp[Op.lte] = new Date(filters.endDate);
        }
      }

      const logs = await AuditLog.findAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['fullName', 'email'],
            required: false,
          },
        ],
        order: [['timestamp', 'DESC']],
        limit: 10000, // Max export limit
      });

      enterpriseLogger.info('Admin exported audit logs', {
        adminId,
        count: logs.length,
        format,
      });

      if (format === 'csv') {
        const csvHeader = 'Timestamp,User,Email,Action,Resource,Resource ID,IP Address,Success,Error Message\n';
        const csvRows = logs.map(log => {
          return [
            log.timestamp,
            log.user?.fullName || 'System',
            log.user?.email || 'N/A',
            log.action,
            log.resource || '',
            log.resourceId || '',
            log.ipAddress || '',
            log.success ? 'Yes' : 'No',
            (log.errorMessage || '').replace(/,/g, ';'),
          ].join(',');
        }).join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=audit-logs-${Date.now()}.csv`);
        res.send(csvHeader + csvRows);
      } else {
        res.status(200).json({
          success: true,
          message: 'Audit logs exported successfully',
          data: {
            logs: logs.map(log => ({
              ...log.toJSON(),
              userName: log.user?.fullName || 'System',
              userEmail: log.user?.email || 'N/A',
            })),
            exportedAt: new Date().toISOString(),
          },
        });
      }

    } catch (error) {
      enterpriseLogger.error('Failed to export audit logs via admin API', {
        error: error.message,
        adminId: req.user?.id,
      });
      next(error);
    }
  }
}

module.exports = new AdminAuditController();

