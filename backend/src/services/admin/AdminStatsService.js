/**
 * AdminStatsService — Filing statistics for SUPER_ADMIN dashboard
 * Handles filing counts by state/type/AY, trends, and avg completion time.
 */

const { fn, col } = require('sequelize');
const { ITRFiling } = require('../../models');
const { sequelize } = require('../../config/database');

class AdminStatsService {
  /**
   * Aggregate filing counts grouped by lifecycleState, itrType, and assessmentYear.
   * Compute avgCompletionTimeHours for filings that reached eri_success.
   */
  async getFilingStats() {
    const [byState, byType, byAssessmentYear, [avgResult]] = await Promise.all([
      ITRFiling.findAll({
        attributes: ['lifecycleState', [fn('COUNT', '*'), 'count']],
        group: ['lifecycleState'],
        raw: true,
      }),
      ITRFiling.findAll({
        attributes: ['itrType', [fn('COUNT', '*'), 'count']],
        group: ['itrType'],
        raw: true,
      }),
      ITRFiling.findAll({
        attributes: ['assessmentYear', [fn('COUNT', '*'), 'count']],
        group: ['assessmentYear'],
        raw: true,
      }),
      sequelize.query(
        `SELECT AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 3600) as avg_hours
         FROM itr_filings
         WHERE lifecycle_state = 'eri_success'`,
      ),
    ]);

    return {
      byState,
      byType,
      byAssessmentYear,
      avgCompletionTimeHours: parseFloat(avgResult[0]?.avg_hours) || null,
    };
  }

  /**
   * Filing trends bucketed by period.
   * @param {'daily'|'weekly'|'monthly'} period
   */
  async getFilingTrends(period = 'daily') {
    const truncMap = { daily: 'day', weekly: 'week', monthly: 'month' };
    const rangeMap = { daily: '30 days', weekly: '84 days', monthly: '365 days' };
    const trunc = truncMap[period] || 'day';
    const range = rangeMap[period] || '30 days';

    const [results] = await sequelize.query(
      `SELECT DATE_TRUNC(:trunc, created_at) as period, COUNT(*) as count
       FROM itr_filings
       WHERE created_at >= NOW() - INTERVAL '${range}'
       GROUP BY period
       ORDER BY period`,
      { replacements: { trunc } },
    );

    return results;
  }
}

module.exports = new AdminStatsService();
