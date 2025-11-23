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
  [ROLES.CA_FIRM_ADMIN]: 'CA Firm Administrator',
  [ROLES.CA]: 'CA Professional',
  [ROLES.END_USER]: 'End User'
};

export const ROLE_HIERARCHY = {
  [ROLES.SUPER_ADMIN]: 5,
  [ROLES.PLATFORM_ADMIN]: 4,
  [ROLES.CA_FIRM_ADMIN]: 3,
  [ROLES.CA]: 2,
  [ROLES.END_USER]: 1
};

export const ROLE_DASHBOARD_ROUTES = {
  [ROLES.SUPER_ADMIN]: '/admin/super',
  [ROLES.PLATFORM_ADMIN]: '/admin/platform',
  [ROLES.CA_FIRM_ADMIN]: '/firm/dashboard',
  [ROLES.CA]: '/ca/clients',
  [ROLES.END_USER]: '/dashboard'
};

export const ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: [
    'users.create', 'users.read', 'users.update', 'users.delete',
    'ca_firms.create', 'ca_firms.read', 'ca_firms.update', 'ca_firms.delete',
    'filings.create', 'filings.read', 'filings.update', 'filings.delete', 'filings.submit',
    'documents.create', 'documents.read', 'documents.update', 'documents.delete',
    'admin.system_config', 'admin.audit_logs', 'admin.user_sessions', 'admin.feature_flags',
    'ca_firm.staff_manage', 'ca_firm.clients_assign', 'ca_firm.billing_view'
  ],
  [ROLES.PLATFORM_ADMIN]: [
    'users.create', 'users.read', 'users.update',
    'ca_firms.create', 'ca_firms.read', 'ca_firms.update',
    'filings.create', 'filings.read', 'filings.update', 'filings.submit',
    'documents.create', 'documents.read', 'documents.update', 'documents.delete',
    'admin.audit_logs', 'admin.user_sessions', 'admin.feature_flags',
    'ca_firm.staff_manage', 'ca_firm.clients_assign', 'ca_firm.billing_view'
  ],
  [ROLES.CA_FIRM_ADMIN]: [
    'users.read', 'users.update',
    'ca_firms.read', 'ca_firms.update',
    'filings.create', 'filings.read', 'filings.update', 'filings.submit',
    'documents.create', 'documents.read', 'documents.update', 'documents.delete',
    'ca_firm.staff_manage', 'ca_firm.clients_assign', 'ca_firm.billing_view'
  ],
  [ROLES.CA]: [
    'users.read',
    'filings.create', 'filings.read', 'filings.update', 'filings.submit',
    'documents.create', 'documents.read', 'documents.update', 'documents.delete',
    'ca_firm.clients_assign'
  ],
  [ROLES.END_USER]: [
    'filings.create', 'filings.read', 'filings.update',
    'documents.create', 'documents.read', 'documents.update'
  ]
};

// Helper functions
export const hasRole = (userRole, requiredRole) => {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
};

export const hasPermission = (userRole, permission) => {
  return ROLE_PERMISSIONS[userRole]?.includes(permission) || false;
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

export const isCA = (role) => {
  return [ROLES.CA_FIRM_ADMIN, ROLES.CA].includes(role);
};

export const isEndUser = (role) => {
  return role === ROLES.END_USER;
};

export default ROLES;
