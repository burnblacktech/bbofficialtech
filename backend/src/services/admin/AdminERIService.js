/**
 * AdminERIService — ERI submission monitoring for SUPER_ADMIN dashboard
 * Handles success rate, recent failures, pending queue, and error code frequency.
 */

const { Op, fn, col } = require('sequelize');
const { ERISubmissionAttempt } = require('../../models');
const { sequelize } = require('../../config/database');

class AdminERIService {
  /**
   * Compute ERI monitoring data for the admin dashboard.
   * @returns {{ successRate: number, recentFailures: Array, pendingCount: number, errorCodeFrequency: Array }}
   */
  async getERIMonitoringData() {
    const [successCount, failCount, pendingCount, recentFailures] = await Promise.all([
      ERISubmissionAttempt.count({ where: { status: 'success' } }),
      ERISubmissionAttempt.count({ where: { status: 'terminal_failure' } }),
      ERISubmissionAttempt.count({ where: { status: 'pending' } }),
      ERISubmissionAttempt.findAll({
        where: { status: { [Op.in]: ['retryable_failure', 'terminal_failure'] } },
        order: [['lastAttemptAt', 'DESC']],
        limit: 20,
        attributes: ['id', 'filingId', 'errorCode', 'status', 'attemptNumber', 'lastAttemptAt'],
      }),
    ]);

    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
    const [errorCodes] = await sequelize.query(
      `SELECT error_code, COUNT(*) as count FROM eri_submission_attempts WHERE status IN ('retryable_failure','terminal_failure') AND last_attempt_at >= :since GROUP BY error_code ORDER BY count DESC`,
      { replacements: { since: thirtyDaysAgo } },
    );

    return {
      successRate:
        successCount + failCount > 0
          ? Math.round((successCount / (successCount + failCount)) * 100)
          : 100,
      recentFailures,
      pendingCount,
      errorCodeFrequency: errorCodes,
    };
  }
}

module.exports = new AdminERIService();
