// =====================================================
// REPORT BUILDER SERVICE
// Dynamic query builder for analytics and reporting
// =====================================================

const { sequelize } = require('../../config/database');
const { Op } = require('sequelize');
const { User, ITRFiling, ITRDraft, ServiceTicket, BankAccount } = require('../../models');
const enterpriseLogger = require('../../utils/logger');
const { AppError } = require('../../middleware/errorHandler');

class ReportBuilderService {
  /**
   * Build custom report based on metrics, dimensions, filters, and aggregations
   * @param {object} params - Report parameters
   * @param {string[]} params.metrics - Metrics to include (users, filings, revenue, etc.)
   * @param {string[]} params.dimensions - Dimensions to group by (date, user_type, itr_type, etc.)
   * @param {object} params.filters - Filters to apply (date_range, status, etc.)
   * @param {string} params.aggregation - Aggregation type (sum, count, average, etc.)
   * @returns {Promise<object>} - Report data
   */
  async buildCustomReport(params) {
    try {
      const { metrics, dimensions, filters, aggregation = 'count' } = params;

      if (!metrics || metrics.length === 0) {
        throw new AppError('At least one metric is required', 400);
      }

      // Build base query based on primary metric
      const primaryMetric = metrics[0];
      let reportData = null;

      switch (primaryMetric) {
        case 'users':
          reportData = await this.buildUsersReport(metrics, dimensions, filters, aggregation);
          break;
        case 'filings':
          reportData = await this.buildFilingsReport(metrics, dimensions, filters, aggregation);
          break;
        case 'revenue':
          reportData = await this.buildRevenueReport(metrics, dimensions, filters, aggregation);
          break;
        case 'drafts':
          reportData = await this.buildDraftsReport(metrics, dimensions, filters, aggregation);
          break;
        case 'tickets':
          reportData = await this.buildTicketsReport(metrics, dimensions, filters, aggregation);
          break;
        default:
          throw new AppError(`Unsupported metric: ${primaryMetric}`, 400);
      }

      return {
        success: true,
        data: reportData,
        metadata: {
          metrics,
          dimensions,
          filters,
          aggregation,
          generatedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      enterpriseLogger.error('Report builder error', {
        error: error.message,
        params,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Build users report
   */
  async buildUsersReport(metrics, dimensions, filters, aggregation) {
    const whereClause = this.buildWhereClause(filters, 'users');
    const groupBy = this.buildGroupBy(dimensions, 'users');

    let query = User;

    // Apply filters
    if (whereClause) {
      query = query.findAll({ where: whereClause });
    } else {
      query = query.findAll();
    }

    const users = await query;

    // Group by dimensions
    if (groupBy.length > 0) {
      return this.groupData(users, groupBy, aggregation);
    }

    // Return aggregated data
    return {
      total: users.length,
      byStatus: this.aggregateByField(users, 'status', aggregation),
      byRole: this.aggregateByField(users, 'role', aggregation),
      byDate: this.aggregateByDate(users, 'createdAt', aggregation),
    };
  }

  /**
   * Build filings report
   */
  async buildFilingsReport(metrics, dimensions, filters, aggregation) {
    const whereClause = this.buildWhereClause(filters, 'filings');
    const groupBy = this.buildGroupBy(dimensions, 'filings');

    let query = ITRFiling;

    // Apply filters
    if (whereClause) {
      query = query.findAll({ where: whereClause });
    } else {
      query = query.findAll();
    }

    const filings = await query;

    // Group by dimensions
    if (groupBy.length > 0) {
      return this.groupData(filings, groupBy, aggregation);
    }

    // Return aggregated data
    return {
      total: filings.length,
      byStatus: this.aggregateByField(filings, 'status', aggregation),
      byITRType: this.aggregateByField(filings, 'itrType', aggregation),
      byDate: this.aggregateByDate(filings, 'createdAt', aggregation),
      totalTaxLiability: filings.reduce((sum, f) => sum + (parseFloat(f.taxLiability) || 0), 0),
      totalRefund: filings.reduce((sum, f) => sum + (parseFloat(f.refundAmount) || 0), 0),
    };
  }

  /**
   * Build revenue report
   */
  async buildRevenueReport(metrics, dimensions, filters, aggregation) {
    // Revenue data would come from transactions/payments table
    // For now, we'll use filings data as a proxy
    const filings = await ITRFiling.findAll({
      where: this.buildWhereClause(filters, 'filings'),
    });

    return {
      totalRevenue: filings.reduce((sum, f) => sum + (parseFloat(f.taxLiability) || 0), 0),
      byDate: this.aggregateByDate(filings, 'createdAt', 'sum', 'taxLiability'),
      byITRType: this.aggregateByField(filings, 'itrType', 'sum', 'taxLiability'),
    };
  }

  /**
   * Build drafts report
   */
  async buildDraftsReport(metrics, dimensions, filters, aggregation) {
    const whereClause = this.buildWhereClause(filters, 'drafts');
    const drafts = await ITRDraft.findAll({ where: whereClause });

    return {
      total: drafts.length,
      byITRType: this.aggregateByField(drafts, 'itrType', aggregation),
      byDate: this.aggregateByDate(drafts, 'createdAt', aggregation),
    };
  }

  /**
   * Build tickets report
   */
  async buildTicketsReport(metrics, dimensions, filters, aggregation) {
    const whereClause = this.buildWhereClause(filters, 'tickets');
    const tickets = await ServiceTicket.findAll({ where: whereClause });

    return {
      total: tickets.length,
      byStatus: this.aggregateByField(tickets, 'status', aggregation),
      byPriority: this.aggregateByField(tickets, 'priority', aggregation),
      byDate: this.aggregateByDate(tickets, 'createdAt', aggregation),
    };
  }

  /**
   * Build WHERE clause from filters
   */
  buildWhereClause(filters, entityType) {
    if (!filters || Object.keys(filters).length === 0) {
      return null;
    }

    const where = {};

    // Date range filter
    if (filters.dateRange) {
      const { startDate, endDate } = filters.dateRange;
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) {
          where.createdAt[Op.gte] = new Date(startDate);
        }
        if (endDate) {
          where.createdAt[Op.lte] = new Date(endDate);
        }
      }
    }

    // Status filter
    if (filters.status) {
      where.status = filters.status;
    }

    // ITR type filter (for filings)
    if (filters.itrType && entityType === 'filings') {
      where.itrType = filters.itrType;
    }

    // Role filter (for users)
    if (filters.role && entityType === 'users') {
      where.role = filters.role;
    }

    // Assessment year filter (for filings)
    if (filters.assessmentYear && entityType === 'filings') {
      where.assessmentYear = filters.assessmentYear;
    }

    return Object.keys(where).length > 0 ? where : null;
  }

  /**
   * Build GROUP BY clause from dimensions
   */
  buildGroupBy(dimensions, entityType) {
    if (!dimensions || dimensions.length === 0) {
      return [];
    }

    const validDimensions = {
      users: ['status', 'role', 'date', 'month', 'year'],
      filings: ['status', 'itrType', 'assessmentYear', 'date', 'month', 'year'],
      drafts: ['itrType', 'date', 'month', 'year'],
      tickets: ['status', 'priority', 'date', 'month', 'year'],
    };

    return dimensions.filter(dim => validDimensions[entityType]?.includes(dim));
  }

  /**
   * Group data by dimensions
   */
  groupData(data, groupBy, aggregation) {
    const grouped = {};

    data.forEach(item => {
      const key = groupBy.map(dim => {
        switch (dim) {
          case 'date':
            return new Date(item.createdAt).toISOString().split('T')[0];
          case 'month':
            return new Date(item.createdAt).toISOString().substring(0, 7);
          case 'year':
            return new Date(item.createdAt).getFullYear().toString();
          default:
            return item[dim] || 'unknown';
        }
      }).join('|');

      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(item);
    });

    // Aggregate grouped data
    const result = {};
    Object.keys(grouped).forEach(key => {
      result[key] = this.aggregate(grouped[key], aggregation);
    });

    return result;
  }

  /**
   * Aggregate data by field
   */
  aggregateByField(data, field, aggregation, valueField = null) {
    const grouped = {};
    data.forEach(item => {
      const value = item[field] || 'unknown';
      if (!grouped[value]) {
        grouped[value] = [];
      }
      grouped[value].push(item);
    });

    const result = {};
    Object.keys(grouped).forEach(key => {
      result[key] = this.aggregate(grouped[key], aggregation, valueField);
    });

    return result;
  }

  /**
   * Aggregate data by date
   */
  aggregateByDate(data, dateField, aggregation, valueField = null) {
    const grouped = {};
    data.forEach(item => {
      const date = new Date(item[dateField]).toISOString().split('T')[0];
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(item);
    });

    const result = {};
    Object.keys(grouped).forEach(key => {
      result[key] = this.aggregate(grouped[key], aggregation, valueField);
    });

    return result;
  }

  /**
   * Aggregate array of items
   */
  aggregate(items, aggregation, valueField = null) {
    switch (aggregation) {
      case 'count':
        return items.length;
      case 'sum':
        if (valueField) {
          return items.reduce((sum, item) => sum + (parseFloat(item[valueField]) || 0), 0);
        }
        return items.length;
      case 'average':
      case 'avg':
        if (valueField) {
          const sum = items.reduce((sum, item) => sum + (parseFloat(item[valueField]) || 0), 0);
          return items.length > 0 ? sum / items.length : 0;
        }
        return items.length;
      case 'min':
        if (valueField) {
          return Math.min(...items.map(item => parseFloat(item[valueField]) || 0));
        }
        return items.length;
      case 'max':
        if (valueField) {
          return Math.max(...items.map(item => parseFloat(item[valueField]) || 0));
        }
        return items.length;
      default:
        return items.length;
    }
  }

  /**
   * Export report to CSV format
   */
  async exportToCSV(reportData, filename = 'report') {
    // This would use a CSV library like 'csv-writer' or 'fast-csv'
    // For now, return a simple CSV string
    const rows = [];
    
    if (Array.isArray(reportData)) {
      // Array of objects
      if (reportData.length > 0) {
        const headers = Object.keys(reportData[0]);
        rows.push(headers.join(','));
        reportData.forEach(item => {
          rows.push(headers.map(h => item[h] || '').join(','));
        });
      }
    } else {
      // Object - flatten it
      rows.push('Key,Value');
      Object.keys(reportData).forEach(key => {
        const value = typeof reportData[key] === 'object' 
          ? JSON.stringify(reportData[key]) 
          : reportData[key];
        rows.push(`${key},${value}`);
      });
    }

    return rows.join('\n');
  }

  /**
   * Export report to Excel format
   */
  async exportToExcel(reportData, filename = 'report') {
    // This would use 'xlsx' library (already used in AdminAnalytics)
    const XLSX = require('xlsx');
    const worksheet = XLSX.utils.json_to_sheet(Array.isArray(reportData) ? reportData : [reportData]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
    
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }
}

module.exports = new ReportBuilderService();

