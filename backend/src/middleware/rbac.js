// =====================================================
// RBAC MIDDLEWARE - ENTERPRISE GRADE
// Role-Based Access Control and Permission Management
// =====================================================

const enterpriseLogger = require('../utils/logger');

// Role hierarchy for permission inheritance
const ROLE_HIERARCHY = {
  'SUPER_ADMIN': 5,
  'PLATFORM_ADMIN': 4,
  'CA_FIRM_ADMIN': 3,
  'CA': 2,
  'END_USER': 1,
};

// Permission definitions
const PERMISSIONS = {
  // User management
  'users.create': ['SUPER_ADMIN', 'PLATFORM_ADMIN'],
  'users.read': ['SUPER_ADMIN', 'PLATFORM_ADMIN', 'CA_FIRM_ADMIN', 'CA'],
  'users.update': ['SUPER_ADMIN', 'PLATFORM_ADMIN', 'CA_FIRM_ADMIN'],
  'users.delete': ['SUPER_ADMIN', 'PLATFORM_ADMIN'],

  // CA Firm management
  'ca_firms.create': ['SUPER_ADMIN', 'PLATFORM_ADMIN'],
  'ca_firms.read': ['SUPER_ADMIN', 'PLATFORM_ADMIN', 'CA_FIRM_ADMIN'],
  'ca_firms.update': ['SUPER_ADMIN', 'PLATFORM_ADMIN', 'CA_FIRM_ADMIN'],
  'ca_firms.delete': ['SUPER_ADMIN', 'PLATFORM_ADMIN'],

  // ITR Filing management
  'filings.create': ['SUPER_ADMIN', 'PLATFORM_ADMIN', 'CA_FIRM_ADMIN', 'CA', 'END_USER'],
  'filings.read': ['SUPER_ADMIN', 'PLATFORM_ADMIN', 'CA_FIRM_ADMIN', 'CA', 'END_USER'],
  'filings.update': ['SUPER_ADMIN', 'PLATFORM_ADMIN', 'CA_FIRM_ADMIN', 'CA', 'END_USER'],
  'filings.delete': ['SUPER_ADMIN', 'PLATFORM_ADMIN'],
  'filings.submit': ['SUPER_ADMIN', 'PLATFORM_ADMIN', 'CA_FIRM_ADMIN', 'CA'],

  // Document management
  'documents.create': ['SUPER_ADMIN', 'PLATFORM_ADMIN', 'CA_FIRM_ADMIN', 'CA', 'END_USER'],
  'documents.read': ['SUPER_ADMIN', 'PLATFORM_ADMIN', 'CA_FIRM_ADMIN', 'CA', 'END_USER'],
  'documents.update': ['SUPER_ADMIN', 'PLATFORM_ADMIN', 'CA_FIRM_ADMIN', 'CA', 'END_USER'],
  'documents.delete': ['SUPER_ADMIN', 'PLATFORM_ADMIN', 'CA_FIRM_ADMIN', 'CA'],

  // Admin functions
  'admin.system_config': ['SUPER_ADMIN'],
  'admin.audit_logs': ['SUPER_ADMIN', 'PLATFORM_ADMIN'],
  'admin.user_sessions': ['SUPER_ADMIN', 'PLATFORM_ADMIN'],
  'admin.feature_flags': ['SUPER_ADMIN', 'PLATFORM_ADMIN'],

  // CA Firm specific
  'ca_firm.staff_manage': ['SUPER_ADMIN', 'PLATFORM_ADMIN', 'CA_FIRM_ADMIN'],
  'ca_firm.clients_assign': ['SUPER_ADMIN', 'PLATFORM_ADMIN', 'CA_FIRM_ADMIN', 'CA'],
  'ca_firm.billing_view': ['SUPER_ADMIN', 'PLATFORM_ADMIN', 'CA_FIRM_ADMIN'],
};

/**
 * Require specific roles for access
 * @param {string|string[]} allowedRoles - Role(s) allowed to access
 * @returns {Function} Express middleware
 */
const requireRole = (allowedRoles) => {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return (req, res, next) => {
    try {
      const userRole = req.user?.role;

      if (!userRole) {
        enterpriseLogger.warn('Role check failed: No user role found', {
          userId: req.user?.userId,
          path: req.path,
          method: req.method,
        });
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
      }

      if (!roles.includes(userRole)) {
        enterpriseLogger.warn('Role check failed: Insufficient permissions', {
          userId: req.user?.userId,
          userRole,
          requiredRoles: roles,
          path: req.path,
          method: req.method,
        });
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions',
          required: roles,
          current: userRole,
        });
      }

      enterpriseLogger.debug('Role check passed', {
        userId: req.user?.userId,
        userRole,
        requiredRoles: roles,
        path: req.path,
      });

      next();
    } catch (error) {
      enterpriseLogger.error('Role middleware error', {
        error: error.message,
        stack: error.stack,
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
 * Require specific permission for access
 * @param {string} permission - Permission required
 * @returns {Function} Express middleware
 */
const requirePermission = (permission) => {
  return (req, res, next) => {
    try {
      const userRole = req.user?.role;

      if (!userRole) {
        enterpriseLogger.warn('Permission check failed: No user role found', {
          userId: req.user?.userId,
          permission,
          path: req.path,
          method: req.method,
        });
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
      }

      const allowedRoles = PERMISSIONS[permission];
      if (!allowedRoles || !allowedRoles.includes(userRole)) {
        enterpriseLogger.warn('Permission check failed: Insufficient permissions', {
          userId: req.user?.userId,
          userRole,
          requiredPermission: permission,
          allowedRoles,
          path: req.path,
          method: req.method,
        });
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions',
          required: permission,
          current: userRole,
        });
      }

      enterpriseLogger.debug('Permission check passed', {
        userId: req.user?.userId,
        userRole,
        permission,
        path: req.path,
      });

      next();
    } catch (error) {
      enterpriseLogger.error('Permission middleware error', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.userId,
        permission,
      });
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  };
};

/**
 * Require CA firm access (user must belong to the specified firm)
 * @param {string} firmIdParam - Parameter name containing firm ID (default: 'firmId')
 * @returns {Function} Express middleware
 */
const requireCAFirmAccess = (firmIdParam = 'firmId') => {
  return (req, res, next) => {
    try {
      const userRole = req.user?.role;
      const userCAFirmId = req.user?.caFirmId;
      const requestedFirmId = req.params[firmIdParam];

      // Super admin and platform admin can access any firm
      if (userRole === 'SUPER_ADMIN' || userRole === 'PLATFORM_ADMIN') {
        return next();
      }

      // CA firm admin and CA staff must belong to the requested firm
      if (userRole === 'CA_FIRM_ADMIN' || userRole === 'CA') {
        if (userCAFirmId !== requestedFirmId) {
          enterpriseLogger.warn('CA firm access denied: User does not belong to requested firm', {
            userId: req.user?.userId,
            userRole,
            userCAFirmId,
            requestedFirmId,
            path: req.path,
            method: req.method,
          });
          return res.status(403).json({
            success: false,
            error: 'Access denied: You can only access your own CA firm',
          });
        }
        return next();
      }

      // End users cannot access CA firm resources
      enterpriseLogger.warn('CA firm access denied: End user attempting to access CA firm resources', {
        userId: req.user?.userId,
        userRole,
        requestedFirmId,
        path: req.path,
        method: req.method,
      });
      return res.status(403).json({
        success: false,
        error: 'Access denied: Insufficient permissions',
      });
    } catch (error) {
      enterpriseLogger.error('CA firm access middleware error', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.userId,
        firmIdParam,
      });
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  };
};

/**
 * Check if user has higher or equal role level
 * @param {string} userRole - User's role
 * @param {string} requiredRole - Required role
 * @returns {boolean} True if user has sufficient role level
 */
const hasRoleLevel = (userRole, requiredRole) => {
  const userLevel = ROLE_HIERARCHY[userRole] || 0;
  const requiredLevel = ROLE_HIERARCHY[requiredRole] || 0;
  return userLevel >= requiredLevel;
};

/**
 * Get user's permissions based on role
 * @param {string} role - User's role
 * @returns {string[]} Array of permissions
 */
const getRolePermissions = (role) => {
  const permissions = [];
  for (const [permission, allowedRoles] of Object.entries(PERMISSIONS)) {
    if (allowedRoles.includes(role)) {
      permissions.push(permission);
    }
  }
  return permissions;
};

module.exports = {
  requireRole,
  requirePermission,
  requireCAFirmAccess,
  hasRoleLevel,
  getRolePermissions,
  ROLE_HIERARCHY,
  PERMISSIONS,
};
