// =====================================================
// PERMISSION ENGINE - TIME-BASED & MODULE CONTROLS
// Advanced permission management system for CA firms
// =====================================================

import { ROLES, PERMISSION_MODULES, PERMISSION_ACTIONS, TIME_BASED_ACCESS, ACCESS_DURATIONS } from '../constants/roles';

class PermissionEngine {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Check if user has specific module permission
   */
  hasModulePermission(user, module, action) {
    if (!user || !user.role) return false;

    // Check for time-based access override
    const timeBasedAccess = this.checkTimeBasedAccess(user, module);
    if (timeBasedAccess) {
      return this.canPerformAction(timeBasedAccess.permissions, action);
    }

    // Check base role permissions
    const permission = `${module}.${action}`;
    return this.hasPermission(user.role, permission);
  }

  /**
   * Check if user can perform specific action
   */
  canPerformAction(permissions, action) {
    if (Array.isArray(permissions)) {
      return permissions.includes(action) || permissions.includes('*');
    }
    return permissions === action || permissions === '*';
  }

  /**
   * Check time-based access for user
   */
  checkTimeBasedAccess(user, module) {
    if (!user.temporaryAccess || !Array.isArray(user.temporaryAccess)) {
      return null;
    }

    const currentTime = new Date();

    // Find applicable time-based access
    const applicableAccess = user.temporaryAccess.find(access => {
      // Check if access applies to this module
      const moduleMatch = access.modules.includes('*') || access.modules.includes(module);

      if (!moduleMatch) return false;

      // Check if access is still valid
      const expiryTime = new Date(access.expiresAt);
      const startTime = access.startTime ? new Date(access.startTime) : new Date(0);

      return currentTime >= startTime && currentTime <= expiryTime;
    });

    return applicableAccess || null;
  }

  /**
   * Grant temporary access to a user
   */
  async grantTemporaryAccess(userId, accessConfig) {
    try {
      const response = await fetch('/api/permissions/grant-temporary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          ...accessConfig
        })
      });

      if (!response.ok) {
        throw new Error('Failed to grant temporary access');
      }

      // Clear cache to force refresh
      this.cache.clear();

      return await response.json();
    } catch (error) {
      console.error('Error granting temporary access:', error);
      throw error;
    }
  }

  /**
   * Revoke temporary access
   */
  async revokeTemporaryAccess(userId, accessId) {
    try {
      const response = await fetch('/api/permissions/revoke-temporary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, accessId })
      });

      if (!response.ok) {
        throw new Error('Failed to revoke temporary access');
      }

      // Clear cache to force refresh
      this.cache.clear();

      return await response.json();
    } catch (error) {
      console.error('Error revoking temporary access:', error);
      throw error;
    }
  }

  /**
   * Create temporary access configuration
   */
  createTemporaryAccessConfig({
    modules,
    permissions,
    duration,
    startTime,
    reason,
    grantedBy,
    customExpiryDate = null
  }) {
    const now = new Date();
    const expiryDate = customExpiryDate || this.calculateExpiryDate(now, duration);

    return {
      id: this.generateAccessId(),
      type: TIME_BASED_ACCESS.TEMPORARY,
      modules: Array.isArray(modules) ? modules : [modules],
      permissions: Array.isArray(permissions) ? permissions : [permissions],
      startTime: startTime || now.toISOString(),
      expiresAt: expiryDate.toISOString(),
      reason: reason || 'Temporary access granted',
      grantedBy: grantedBy,
      createdAt: now.toISOString(),
      isActive: true
    };
  }

  /**
   * Calculate expiry date based on duration
   */
  calculateExpiryDate(startDate, duration) {
    const expiry = new Date(startDate);

    switch (duration) {
      case ACCESS_DURATIONS.ONE_DAY:
        expiry.setDate(expiry.getDate() + 1);
        break;
      case ACCESS_DURATIONS.ONE_WEEK:
        expiry.setDate(expiry.getDate() + 7);
        break;
      case ACCESS_DURATIONS.ONE_MONTH:
        expiry.setMonth(expiry.getMonth() + 1);
        break;
      case ACCESS_DURATIONS.THREE_MONTHS:
        expiry.setMonth(expiry.getMonth() + 3);
        break;
      case ACCESS_DURATIONS.SIX_MONTHS:
        expiry.setMonth(expiry.getMonth() + 6);
        break;
      case ACCESS_DURATIONS.ONE_YEAR:
        expiry.setFullYear(expiry.getFullYear() + 1);
        break;
      case ACCESS_DURATIONS.CUSTOM:
        // For custom duration, expiryDate should be provided explicitly
        throw new Error('Custom duration requires explicit expiryDate');
      default:
        expiry.setHours(expiry.getHours() + 24); // Default to 1 day
    }

    return expiry;
  }

  /**
   * Get all temporary access for a user
   */
  async getTemporaryAccess(userId) {
    try {
      const response = await fetch(`/api/permissions/temporary/${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch temporary access');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching temporary access:', error);
      return [];
    }
  }

  /**
   * Create scheduled access configuration
   */
  createScheduledAccessConfig({
    modules,
    permissions,
    schedule,
    duration,
    reason,
    grantedBy,
    recurring = false
  }) {
    return {
      id: this.generateAccessId(),
      type: TIME_BASED_ACCESS.SCHEDULED,
      modules: Array.isArray(modules) ? modules : [modules],
      permissions: Array.isArray(permissions) ? permissions : [permissions],
      schedule,
      duration,
      reason: reason || 'Scheduled access',
      grantedBy: grantedBy,
      recurring,
      createdAt: new Date().toISOString(),
      isActive: true
    };
  }

  /**
   * Create seasonal access configuration (for tax season)
   */
  createSeasonalAccessConfig({
    modules,
    permissions,
    season,
    year,
    reason,
    grantedBy
  }) {
    const seasonDates = this.getSeasonDates(season, year);

    return {
      id: this.generateAccessId(),
      type: TIME_BASED_ACCESS.SEASONAL,
      modules: Array.isArray(modules) ? modules : [modules],
      permissions: Array.isArray(permissions) ? permissions : [permissions],
      startTime: seasonDates.start.toISOString(),
      expiresAt: seasonDates.end.toISOString(),
      season,
      year,
      reason: reason || `Seasonal access for ${season}`,
      grantedBy: grantedBy,
      createdAt: new Date().toISOString(),
      isActive: true
    };
  }

  /**
   * Get season dates for tax season
   */
  getSeasonDates(season, year) {
    const currentYear = year || new Date().getFullYear();

    switch (season) {
      case 'TAX_SEASON':
        // July to March (tax season)
        return {
          start: new Date(currentYear, 6, 1), // July 1
          end: new Date(currentYear + 1, 2, 31) // March 31
        };
      case 'QUARTER_END':
        // 15 days before quarter end to 15 days after
        const quarter = Math.floor((new Date().getMonth() + 2) / 3);
        const quarterStart = new Date(currentYear, (quarter - 1) * 3, 1);
        const quarterEnd = new Date(currentYear, quarter * 3, 0);
        return {
          start: new Date(quarterEnd.getTime() - 15 * 24 * 60 * 60 * 1000),
          end: new Date(quarterEnd.getTime() + 15 * 24 * 60 * 60 * 1000)
        };
      default:
        throw new Error(`Unknown season: ${season}`);
    }
  }

  /**
   * Check if user can manage staff permissions
   */
  canManageStaff(user) {
    return [
      ROLES.SUPER_ADMIN,
      ROLES.PLATFORM_ADMIN,
      ROLES.CA_FIRM_ADMIN,
      ROLES.INDEPENDENT_CA_ADMIN
    ].includes(user.role);
  }

  /**
   * Check if user can grant temporary access
   */
  canGrantTemporaryAccess(user) {
    const managerRoles = [
      ROLES.SUPER_ADMIN,
      ROLES.PLATFORM_ADMIN,
      ROLES.CA_FIRM_ADMIN,
      ROLES.INDEPENDENT_CA_ADMIN
    ];

    if (!managerRoles.includes(user.role)) {
      return false;
    }

    // Check if user has explicit permission for temporary access
    return this.hasPermission(user.role, 'grant_temporary_access');
  }

  /**
   * Check base role permission
   */
  hasPermission(role, permission) {
    const rolePermissions = this.getRolePermissions(role);
    return rolePermissions.includes(permission);
  }

  /**
   * Get role permissions (could be extended to fetch from API)
   */
  getRolePermissions(role) {
    // This would typically fetch from your backend
    // For now, return basic permission sets
    const permissions = {
      [ROLES.SUPER_ADMIN]: ['*'],
      [ROLES.PLATFORM_ADMIN]: [
        'users.*', 'ca_firms.*', 'filings.*', 'documents.*',
        'admin.*', 'grant_temporary_access'
      ],
      [ROLES.CA_FIRM_ADMIN]: [
        'staff_management.*', 'user_management.read', 'user_management.update',
        'client_management.*', 'filings.*', 'documents.*',
        'billing_invoicing.*', 'reports_analytics.read',
        'firm.grant_temporary_access'
      ],
      [ROLES.INDEPENDENT_CA_ADMIN]: [
        'staff_management.*', 'user_management.read', 'user_management.update',
        'client_management.*', 'filings.*', 'documents.*',
        'billing_invoicing.*', 'reports_analytics.read',
        'independent.grant_temporary_access'
      ]
    };

    return permissions[role] || [];
  }

  /**
   * Generate unique access ID
   */
  generateAccessId() {
    return `access_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Format expiry date for display
   */
  formatExpiryDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return 'Expired';
    } else if (diffDays === 0) {
      return 'Expires today';
    } else if (diffDays === 1) {
      return 'Expires tomorrow';
    } else if (diffDays < 7) {
      return `Expires in ${diffDays} days`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `Expires in ${weeks} week${weeks > 1 ? 's' : ''}`;
    } else {
      return date.toLocaleDateString();
    }
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Get access summary for user
   */
  async getAccessSummary(user) {
    try {
      const [temporaryAccess] = await Promise.all([
        this.getTemporaryAccess(user.user_id)
      ]);

      const summary = {
        baseRole: user.role,
        basePermissions: this.getRolePermissions(user.role),
        temporaryAccess: temporaryAccess.filter(access => {
          const expiryTime = new Date(access.expiresAt);
          return expiryTime > new Date();
        }),
        activeModules: [],
        expiringSoon: []
      };

      // Check active modules and expiring soon
      temporaryAccess.forEach(access => {
        const expiryTime = new Date(access.expiresAt);
        const now = new Date();
        const timeUntilExpiry = expiryTime - now;
        const twoDaysInMs = 2 * 24 * 60 * 60 * 1000;

        access.modules.forEach(module => {
          if (!summary.activeModules.includes(module)) {
            summary.activeModules.push(module);
          }
        });

        if (timeUntilExpiry > 0 && timeUntilExpiry <= twoDaysInMs) {
          summary.expiringSoon.push({
            ...access,
            timeUntilExpiry: this.formatExpiryDate(access.expiresAt)
          });
        }
      });

      return summary;
    } catch (error) {
      console.error('Error fetching access summary:', error);
      return {
        baseRole: user.role,
        basePermissions: this.getRolePermissions(user.role),
        temporaryAccess: [],
        activeModules: [],
        expiringSoon: []
      };
    }
  }
}

// Create singleton instance
export const permissionEngine = new PermissionEngine();

export default PermissionEngine;