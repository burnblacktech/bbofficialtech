// =====================================================
// ROLE CONSTANTS - ENTERPRISE GRADE
// Centralized role definitions matching backend
// =====================================================

export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  PLATFORM_ADMIN: 'PLATFORM_ADMIN',

  // B2B Model - Admin-managed CA firms
  CA_FIRM_ADMIN: 'CA_FIRM_ADMIN',
  CA_FIRM_SENIOR_CA: 'CA_FIRM_SENIOR_CA',
  CA_FIRM_CA: 'CA_FIRM_CA',
  CA_FIRM_JUNIOR_CA: 'CA_FIRM_JUNIOR_CA',
  CA_FIRM_ASSISTANT: 'CA_FIRM_ASSISTANT',

  // Independent CAs - Self-registered
  INDEPENDENT_CA_ADMIN: 'INDEPENDENT_CA_ADMIN',
  INDEPENDENT_CA_SENIOR_CA: 'INDEPENDENT_CA_SENIOR_CA',
  INDEPENDENT_CA: 'INDEPENDENT_CA',
  INDEPENDENT_CA_JUNIOR: 'INDEPENDENT_CA_JUNIOR',
  INDEPENDENT_CA_ASSISTANT: 'INDEPENDENT_CA_ASSISTANT',

  END_USER: 'END_USER'
};

export const ROLE_LABELS = {
  [ROLES.SUPER_ADMIN]: 'Super Administrator',
  [ROLES.PLATFORM_ADMIN]: 'Platform Administrator',

  // B2B Model
  [ROLES.CA_FIRM_ADMIN]: 'CA Firm Administrator',
  [ROLES.CA_FIRM_SENIOR_CA]: 'Senior CA (Firm)',
  [ROLES.CA_FIRM_CA]: 'CA Professional (Firm)',
  [ROLES.CA_FIRM_JUNIOR_CA]: 'Junior CA (Firm)',
  [ROLES.CA_FIRM_ASSISTANT]: 'Assistant (Firm)',

  // Independent CAs
  [ROLES.INDEPENDENT_CA_ADMIN]: 'Independent CA Practice',
  [ROLES.INDEPENDENT_CA_SENIOR_CA]: 'Senior CA (Independent)',
  [ROLES.INDEPENDENT_CA]: 'CA Professional (Independent)',
  [ROLES.INDEPENDENT_CA_JUNIOR]: 'Junior CA (Independent)',
  [ROLES.INDEPENDENT_CA_ASSISTANT]: 'Assistant (Independent)',

  [ROLES.END_USER]: 'End User'
};

export const ROLE_HIERARCHY = {
  [ROLES.SUPER_ADMIN]: 5,
  [ROLES.PLATFORM_ADMIN]: 4,

  // B2B Model Hierarchy
  [ROLES.CA_FIRM_ADMIN]: 3.5,
  [ROLES.CA_FIRM_SENIOR_CA]: 3.2,
  [ROLES.CA_FIRM_CA]: 3.0,
  [ROLES.CA_FIRM_JUNIOR_CA]: 2.5,
  [ROLES.CA_FIRM_ASSISTANT]: 2.0,

  // Independent CA Hierarchy
  [ROLES.INDEPENDENT_CA_ADMIN]: 3.5,
  [ROLES.INDEPENDENT_CA_SENIOR_CA]: 3.2,
  [ROLES.INDEPENDENT_CA]: 3.0,
  [ROLES.INDEPENDENT_CA_JUNIOR]: 2.5,
  [ROLES.INDEPENDENT_CA_ASSISTANT]: 2.0,

  [ROLES.END_USER]: 1
};

export const ROLE_DASHBOARD_ROUTES = {
  [ROLES.SUPER_ADMIN]: '/admin/super',
  [ROLES.PLATFORM_ADMIN]: '/admin/platform',

  // B2B Model Routes
  [ROLES.CA_FIRM_ADMIN]: '/firm/dashboard',
  [ROLES.CA_FIRM_SENIOR_CA]: '/firm/clients',
  [ROLES.CA_FIRM_CA]: '/firm/clients',
  [ROLES.CA_FIRM_JUNIOR_CA]: '/firm/tasks',
  [ROLES.CA_FIRM_ASSISTANT]: '/firm/tasks',

  // Independent CA Routes
  [ROLES.INDEPENDENT_CA_ADMIN]: '/independent/dashboard',
  [ROLES.INDEPENDENT_CA_SENIOR_CA]: '/independent/clients',
  [ROLES.INDEPENDENT_CA]: '/independent/clients',
  [ROLES.INDEPENDENT_CA_JUNIOR]: '/independent/tasks',
  [ROLES.INDEPENDENT_CA_ASSISTANT]: '/independent/tasks',

  [ROLES.END_USER]: '/dashboard'
};

// Module-based permission definitions
export const PERMISSION_MODULES = {
  ITR_FILING: 'itr_filing',
  USER_MANAGEMENT: 'user_management',
  STAFF_MANAGEMENT: 'staff_management',
  BILLING_INVOICING: 'billing_invoicing',
  REPORTS_ANALYTICS: 'reports_analytics',
  SYSTEM_SETTINGS: 'system_settings',
  DOCUMENT_MANAGEMENT: 'document_management',
  CLIENT_MANAGEMENT: 'client_management',
  AUDIT_LOGS: 'audit_logs'
};

export const PERMISSION_ACTIONS = {
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
  SUBMIT: 'submit',
  APPROVE: 'approve',
  ASSIGN: 'assign',
  VIEW_BILLING: 'view_billing',
  EXPORT: 'export'
};

export const ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: [
    // System-wide permissions
    'system.create', 'system.read', 'system.update', 'system.delete',
    'users.create', 'users.read', 'users.update', 'users.delete',
    'ca_firms.create', 'ca_firms.read', 'ca_firms.update', 'ca_firms.delete',

    // All module permissions
    ...Object.values(PERMISSION_MODULES).flatMap(module =>
      Object.values(PERMISSION_ACTIONS).map(action => `${module}.${action}`)
    ),

    // Administrative
    'admin.system_config', 'admin.audit_logs', 'admin.user_sessions', 'admin.feature_flags',
    'admin.grant_temporary_access', 'admin.revoke_access'
  ],

  [ROLES.PLATFORM_ADMIN]: [
    'users.create', 'users.read', 'users.update',
    'ca_firms.create', 'ca_firms.read', 'ca_firms.update',
    `${PERMISSION_MODULES.ITR_FILING}.create`, `${PERMISSION_MODULES.ITR_FILING}.read`,
    `${PERMISSION_MODULES.ITR_FILING}.update`, `${PERMISSION_MODULES.ITR_FILING}.submit`,
    `${PERMISSION_MODULES.DOCUMENT_MANAGEMENT}.create`, `${PERMISSION_MODULES.DOCUMENT_MANAGEMENT}.read`,
    `${PERMISSION_MODULES.DOCUMENT_MANAGEMENT}.update`, `${PERMISSION_MODULES.DOCUMENT_MANAGEMENT}.delete`,
    `${PERMISSION_MODULES.STAFF_MANAGEMENT}.create`, `${PERMISSION_MODULES.STAFF_MANAGEMENT}.read`,
    `${PERMISSION_MODULES.STAFF_MANAGEMENT}.update`,
    `${PERMISSION_MODULES.CLIENT_MANAGEMENT}.assign`,
    `${PERMISSION_MODULES.BILLING_INVOICING}.view_billing`,
    `${PERMISSION_MODULES.REPORTS_ANALYTICS}.read`,
    'admin.audit_logs', 'admin.user_sessions', 'admin.feature_flags'
  ],

  // B2B Model - CA Firm Admin
  [ROLES.CA_FIRM_ADMIN]: [
    `${PERMISSION_MODULES.USER_MANAGEMENT}.read`, `${PERMISSION_MODULES.USER_MANAGEMENT}.update`,
    `${PERMISSION_MODULES.STAFF_MANAGEMENT}.create`, `${PERMISSION_MODULES.STAFF_MANAGEMENT}.read`,
    `${PERMISSION_MODULES.STAFF_MANAGEMENT}.update`, `${PERMISSION_MODULES.STAFF_MANAGEMENT}.delete`,
    `${PERMISSION_MODULES.ITR_FILING}.create`, `${PERMISSION_MODULES.ITR_FILING}.read`,
    `${PERMISSION_MODULES.ITR_FILING}.update`, `${PERMISSION_MODULES.ITR_FILING}.submit`,
    `${PERMISSION_MODULES.DOCUMENT_MANAGEMENT}.create`, `${PERMISSION_MODULES.DOCUMENT_MANAGEMENT}.read`,
    `${PERMISSION_MODULES.DOCUMENT_MANAGEMENT}.update`, `${PERMISSION_MODULES.DOCUMENT_MANAGEMENT}.delete`,
    `${PERMISSION_MODULES.CLIENT_MANAGEMENT}.create`, `${PERMISSION_MODULES.CLIENT_MANAGEMENT}.read`,
    `${PERMISSION_MODULES.CLIENT_MANAGEMENT}.update`, `${PERMISSION_MODULES.CLIENT_MANAGEMENT}.assign`,
    `${PERMISSION_MODULES.BILLING_INVOICING}.read`, `${PERMISSION_MODULES.BILLING_INVOICING}.view_billing`,
    `${PERMISSION_MODULES.REPORTS_ANALYTICS}.read`,
    'firm.grant_temporary_access', 'firm.manage_permissions'
  ],

  // Independent CA Admin
  [ROLES.INDEPENDENT_CA_ADMIN]: [
    `${PERMISSION_MODULES.USER_MANAGEMENT}.read`, `${PERMISSION_MODULES.USER_MANAGEMENT}.update`,
    `${PERMISSION_MODULES.STAFF_MANAGEMENT}.create`, `${PERMISSION_MODULES.STAFF_MANAGEMENT}.read`,
    `${PERMISSION_MODULES.STAFF_MANAGEMENT}.update`, `${PERMISSION_MODULES.STAFF_MANAGEMENT}.delete`,
    `${PERMISSION_MODULES.ITR_FILING}.create`, `${PERMISSION_MODULES.ITR_FILING}.read`,
    `${PERMISSION_MODULES.ITR_FILING}.update`, `${PERMISSION_MODULES.ITR_FILING}.submit`,
    `${PERMISSION_MODULES.DOCUMENT_MANAGEMENT}.create`, `${PERMISSION_MODULES.DOCUMENT_MANAGEMENT}.read`,
    `${PERMISSION_MODULES.DOCUMENT_MANAGEMENT}.update`, `${PERMISSION_MODULES.DOCUMENT_MANAGEMENT}.delete`,
    `${PERMISSION_MODULES.CLIENT_MANAGEMENT}.create`, `${PERMISSION_MODULES.CLIENT_MANAGEMENT}.read`,
    `${PERMISSION_MODULES.CLIENT_MANAGEMENT}.update`, `${PERMISSION_MODULES.CLIENT_MANAGEMENT}.assign`,
    `${PERMISSION_MODULES.BILLING_INVOICING}.read`, `${PERMISSION_MODULES.BILLING_INVOICING}.view_billing`,
    `${PERMISSION_MODULES.REPORTS_ANALYTICS}.read`,
    'independent.grant_temporary_access', 'independent.manage_permissions'
  ],

  // CA Professional (Both Firm and Independent)
  [ROLES.CA_FIRM_CA]: [ROLES.INDEPENDENT_CA]: [
    `${PERMISSION_MODULES.USER_MANAGEMENT}.read`,
    `${PERMISSION_MODULES.ITR_FILING}.create`, `${PERMISSION_MODULES.ITR_FILING}.read`,
    `${PERMISSION_MODULES.ITR_FILING}.update`, `${PERMISSION_MODULES.ITR_FILING}.submit`,
    `${PERMISSION_MODULES.DOCUMENT_MANAGEMENT}.create`, `${PERMISSION_MODULES.DOCUMENT_MANAGEMENT}.read`,
    `${PERMISSION_MODULES.DOCUMENT_MANAGEMENT}.update`, `${PERMISSION_MODULES.DOCUMENT_MANAGEMENT}.delete`,
    `${PERMISSION_MODULES.CLIENT_MANAGEMENT}.read`, `${PERMISSION_MODULES.CLIENT_MANAGEMENT}.assign`,
    `${PERMISSION_MODULES.REPORTS_ANALYTICS}.read`
  ],

  // Junior CAs
  [ROLES.CA_FIRM_JUNIOR_CA]: [ROLES.INDEPENDENT_CA_JUNIOR]: [
    `${PERMISSION_MODULES.ITR_FILING}.read`, `${PERMISSION_MODULES.ITR_FILING}.update`,
    `${PERMISSION_MODULES.DOCUMENT_MANAGEMENT}.create`, `${PERMISSION_MODULES.DOCUMENT_MANAGEMENT}.read`,
    `${PERMISSION_MODULES.DOCUMENT_MANAGEMENT}.update`,
    `${PERMISSION_MODULES.CLIENT_MANAGEMENT}.read`
  ],

  // Assistants
  [ROLES.CA_FIRM_ASSISTANT]: [ROLES.INDEPENDENT_CA_ASSISTANT]: [
    `${PERMISSION_MODULES.ITR_FILING}.read`,
    `${PERMISSION_MODULES.DOCUMENT_MANAGEMENT}.create`, `${PERMISSION_MODULES.DOCUMENT_MANAGEMENT}.read`,
    `${PERMISSION_MODULES.CLIENT_MANAGEMENT}.read`
  ],

  [ROLES.END_USER]: [
    `${PERMISSION_MODULES.ITR_FILING}.create`, `${PERMISSION_MODULES.ITR_FILING}.read`,
    `${PERMISSION_MODULES.ITR_FILING}.update`,
    `${PERMISSION_MODULES.DOCUMENT_MANAGEMENT}.create`, `${PERMISSION_MODULES.DOCUMENT_MANAGEMENT}.read`,
    `${PERMISSION_MODULES.DOCUMENT_MANAGEMENT}.update`
  ]
};

// Time-based permission definitions
export const TIME_BASED_ACCESS = {
  TEMPORARY: 'temporary',
  SCHEDULED: 'scheduled',
  SEASONAL: 'seasonal',
  PROJECT_BASED: 'project_based'
};

export const ACCESS_DURATIONS = {
  ONE_DAY: 1,
  ONE_WEEK: 7,
  ONE_MONTH: 30,
  THREE_MONTHS: 90,
  SIX_MONTHS: 180,
  ONE_YEAR: 365,
  CUSTOM: 'custom'
};

// Helper functions
export const hasRole = (userRole, requiredRole) => {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
};

export const hasPermission = (userRole, permission) => {
  return ROLE_PERMISSIONS[userRole]?.includes(permission) || false;
};

export const hasModulePermission = (userRole, module, action) => {
  const permission = `${module}.${action}`;
  return ROLE_PERMISSIONS[userRole]?.includes(permission) || false;
};

export const canManageStaff = (userRole) => {
  return [
    ROLES.SUPER_ADMIN,
    ROLES.PLATFORM_ADMIN,
    ROLES.CA_FIRM_ADMIN,
    ROLES.INDEPENDENT_CA_ADMIN
  ].includes(userRole);
};

export const canGrantTemporaryAccess = (userRole) => {
  return ROLE_PERMISSIONS[userRole]?.some(p =>
    p.includes('grant_temporary_access') || p.includes('manage_permissions')
  ) || false;
};

export const getRoleLabel = (role) => {
  return ROLE_LABELS[role] || role;
};

export const getDashboardRoute = (role) => {
  return ROLE_DASHBOARD_ROUTES[role] || '/dashboard';
};

export const isAdmin = (role) => {
  return [ROLES.SUPER_ADMIN, ROLES.PLATFORM_ADMIN].includes(role);
};

export const isCAFirmAdmin = (role) => {
  return [ROLES.CA_FIRM_ADMIN, ROLES.INDEPENDENT_CA_ADMIN].includes(role);
};

export const isIndependentCA = (role) => {
  return role && role.startsWith('INDEPENDENT_CA');
};

export const isFirmCA = (role) => {
  return role && role.startsWith('CA_FIRM_');
};

export const isCA = (role) => {
  return [
    ROLES.CA_FIRM_ADMIN, ROLES.CA_FIRM_SENIOR_CA, ROLES.CA_FIRM_CA,
    ROLES.CA_FIRM_JUNIOR_CA, ROLES.CA_FIRM_ASSISTANT,
    ROLES.INDEPENDENT_CA_ADMIN, ROLES.INDEPENDENT_CA_SENIOR_CA,
    ROLES.INDEPENDENT_CA, ROLES.INDEPENDENT_CA_JUNIOR, ROLES.INDEPENDENT_CA_ASSISTANT
  ].includes(role);
};

export const isEndUser = (role) => {
  return role === ROLES.END_USER;
};

export const getRoleCategory = (role) => {
  if (isAdmin(role)) return 'admin';
  if (isIndependentCA(role)) return 'independent_ca';
  if (isFirmCA(role)) return 'firm_ca';
  if (isEndUser(role)) return 'end_user';
  return 'unknown';
};

export const getAvailableRolesForCA = (caType) => {
  if (caType === 'independent') {
    return [
      ROLES.INDEPENDENT_CA_ADMIN,
      ROLES.INDEPENDENT_CA_SENIOR_CA,
      ROLES.INDEPENDENT_CA,
      ROLES.INDEPENDENT_CA_JUNIOR,
      ROLES.INDEPENDENT_CA_ASSISTANT
    ];
  } else {
    return [
      ROLES.CA_FIRM_ADMIN,
      ROLES.CA_FIRM_SENIOR_CA,
      ROLES.CA_FIRM_CA,
      ROLES.CA_FIRM_JUNIOR_CA,
      ROLES.CA_FIRM_ASSISTANT
    ];
  }
};

export default ROLES;
