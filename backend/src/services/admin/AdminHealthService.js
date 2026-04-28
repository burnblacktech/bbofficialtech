/**
 * AdminHealthService — Platform health metrics for SUPER_ADMIN dashboard
 * Checks active users, database, Redis, ERI API status, error rate, and uptime.
 */

const { Op } = require('sequelize');
const { UserSession, ERISubmissionAttempt, AuditEvent } = require('../../models');
const { sequelize } = require('../../config/database');
const RedisService = require('../core/RedisService');

class AdminHealthService {
  /**
   * Gather all platform health metrics.
   * Returns: { activeUsers, database, redis, eriApi, errorRate, uptime }
   */
  async getHealthData() {
    const now = new Date();

    const [activeUsers, database, redis, eriApi, errorRate] = await Promise.all([
      this._getActiveUsers(now),
      this._checkDatabase(),
      this._checkRedis(),
      this._checkEriApi(now),
      this._getErrorRate(now),
    ]);

    return {
      activeUsers,
      database,
      redis,
      eriApi,
      errorRate,
      uptime: Math.round(process.uptime()),
    };
  }

  /**
   * COUNT DISTINCT userId from non-revoked sessions where lastActive within 24h, 7d, 30d.
   */
  async _getActiveUsers(now) {
    const baseWhere = { revoked: false };

    const [last24h, last7d, last30d] = await Promise.all([
      UserSession.count({
        where: { ...baseWhere, lastActive: { [Op.gte]: new Date(now - 24 * 60 * 60 * 1000) } },
        distinct: true,
        col: 'userId',
      }),
      UserSession.count({
        where: { ...baseWhere, lastActive: { [Op.gte]: new Date(now - 7 * 24 * 60 * 60 * 1000) } },
        distinct: true,
        col: 'userId',
      }),
      UserSession.count({
        where: { ...baseWhere, lastActive: { [Op.gte]: new Date(now - 30 * 24 * 60 * 60 * 1000) } },
        distinct: true,
        col: 'userId',
      }),
    ]);

    return { last24h, last7d, last30d };
  }

  /**
   * Execute SELECT 1, measure response time, report connected/responseTimeMs.
   */
  async _checkDatabase() {
    let connected = false;
    let responseTimeMs = 0;
    try {
      const start = Date.now();
      await sequelize.query('SELECT 1');
      responseTimeMs = Date.now() - start;
      connected = true;
    } catch {
      /* silent — report disconnected */
    }
    return { connected, responseTimeMs };
  }

  /**
   * Execute Redis PING, measure response time, report connected/responseTimeMs.
   */
  async _checkRedis() {
    let connected = false;
    let responseTimeMs = 0;
    try {
      const client = RedisService.getClient?.();
      if (client) {
        const start = Date.now();
        await client.ping();
        responseTimeMs = Date.now() - start;
        connected = true;
      }
    } catch {
      /* silent — report disconnected */
    }
    return { connected, responseTimeMs };
  }

  /**
   * Check most recent ERISubmissionAttempt within last hour.
   * 'operational' if success, 'degraded' if failure, 'unknown' if none.
   */
  async _checkEriApi(now) {
    const oneHourAgo = new Date(now - 60 * 60 * 1000);
    const recentERI = await ERISubmissionAttempt.findOne({
      where: { lastAttemptAt: { [Op.gte]: oneHourAgo } },
      order: [['lastAttemptAt', 'DESC']],
    });

    let status = 'unknown';
    if (recentERI) {
      status = recentERI.status === 'success' ? 'operational' : 'degraded';
    }
    return { status };
  }

  /**
   * AuditEvents with 'ERROR' in eventType / total events in last hour, as percentage.
   */
  async _getErrorRate(now) {
    const oneHourAgo = new Date(now - 60 * 60 * 1000);
    const timeFilter = { createdAt: { [Op.gte]: oneHourAgo } };

    const [errorCount, totalCount] = await Promise.all([
      AuditEvent.count({
        where: { ...timeFilter, eventType: { [Op.iLike]: '%ERROR%' } },
      }),
      AuditEvent.count({ where: timeFilter }),
    ]);

    const percentage = totalCount > 0 ? parseFloat(((errorCount / totalCount) * 100).toFixed(2)) : 0;
    return { errorCount, totalCount, percentage };
  }
}

module.exports = new AdminHealthService();
