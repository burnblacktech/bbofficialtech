// =====================================================
// DATA ISOLATION MIDDLEWARE
// Enforces firm-level data isolation with PlatformAdmin bypass
// Moderate isolation: Default firm isolation, PlatformAdmin can view aggregates
// =====================================================

const { User, CAFirm } = require('../models');
const enterpriseLogger = require('../utils/logger');
const AuditService = require('../services/core/AuditService');

/**
 * Middleware to automatically filter queries by firmId
 * Adds firm context to request for downstream use
 */
const addFirmContext = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return next();
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return next();
    }

    // Get firm context
    const firmContext = user.getFirmContext();
    req.firmContext = firmContext;

    // Add firm filter to query helpers
    req.addFirmFilter = (query) => {
      // PlatformAdmin can bypass (with audit)
      if (firmContext.isPlatformAdmin) {
        return query; // No filter, but will be audited
      }

      // Add firm filter for firm-scoped users
      if (firmContext.firmId) {
        if (query.where) {
          query.where.firmId = firmContext.firmId;
        } else {
          query.where = { firmId: firmContext.firmId };
        }
      }

      return query;
    };

    next();
  } catch (error) {
    enterpriseLogger.error('Add firm context error', {
      error: error.message,
      userId: req.user?.userId,
    });
    next();
  }
};

/**
 * Middleware to check firm access
 * Ensures user can only access their own firm's data
 */
const checkFirmAccess = (firmIdParam = 'firmId') => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.userId;
      const requestedFirmId = req.params[firmIdParam] || req.body.firmId;
      const user = await User.findByPk(userId);

      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'User not found',
        });
      }

      const firmContext = user.getFirmContext();

      // PlatformAdmin can access (with audit)
      if (firmContext.isPlatformAdmin) {
        // Log cross-firm access
        await AuditService.logAdminAction(
          userId,
          'cross_firm_access',
          'firm',
          {
            requestedFirmId,
            path: req.path,
            method: req.method,
          }
        );
        return next();
      }

      // FirmAdmin/Staff must belong to requested firm
      if (firmContext.firmId && firmContext.firmId !== requestedFirmId) {
        enterpriseLogger.warn('Firm access denied', {
          userId,
          userFirmId: firmContext.firmId,
          requestedFirmId,
          path: req.path,
        });
        return res.status(403).json({
          success: false,
          error: 'Access denied: You can only access your own firm',
        });
      }

      next();
    } catch (error) {
      enterpriseLogger.error('Check firm access error', {
        error: error.message,
        userId: req.user?.userId,
      });
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  };
};

/**
 * Middleware to check client access
 * Ensures user can only access assigned clients or clients in their firm
 */
const checkClientAccess = (clientIdParam = 'clientId') => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.userId;
      const clientId = req.params[clientIdParam] || req.body.clientId;
      const user = await User.findByPk(userId);

      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'User not found',
        });
      }

      // Check access using User model method
      const accessCheck = await user.canAccessClient(clientId);

      if (!accessCheck.allowed) {
        enterpriseLogger.warn('Client access denied', {
          userId,
          clientId,
          reason: accessCheck.reason,
          path: req.path,
        });
        return res.status(403).json({
          success: false,
          error: 'Access denied: You do not have access to this client',
        });
      }

      // Log PlatformAdmin access
      if (accessCheck.reason === 'platform_admin') {
        await AuditService.logAdminAction(
          userId,
          'client_access',
          'client',
          {
            clientId,
            reason: 'platform_admin',
            path: req.path,
            method: req.method,
          }
        );
      }

      req.clientAccess = accessCheck;
      next();
    } catch (error) {
      enterpriseLogger.error('Check client access error', {
        error: error.message,
        userId: req.user?.userId,
      });
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  };
};

/**
 * Helper function to add firm filter to Sequelize query
 */
const addFirmFilter = (query, user) => {
  const firmContext = user.getFirmContext();

  // PlatformAdmin bypass (no filter, but will be audited)
  if (firmContext.isPlatformAdmin) {
    return query;
  }

  // Add firm filter
  if (firmContext.firmId) {
    if (query.where) {
      query.where.firmId = firmContext.firmId;
    } else {
      query.where = { firmId: firmContext.firmId };
    }
  }

  return query;
};

/**
 * Helper function to check if user can access a client
 */
const checkClientAccessHelper = async (user, clientId) => {
  return await user.canAccessClient(clientId);
};

/**
 * Helper function to get firm context from user
 */
const getFirmContext = (user) => {
  return user.getFirmContext();
};

module.exports = {
  addFirmContext,
  checkFirmAccess,
  checkClientAccess,
  addFirmFilter,
  checkClientAccessHelper,
  getFirmContext,
};

