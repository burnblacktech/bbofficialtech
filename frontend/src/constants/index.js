// =====================================================
// CORE CONSTANTS - SINGLE SOURCE OF TRUTH
// =====================================================

// API Endpoints - Centralized routing
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    REFRESH: '/api/auth/refresh',
    LOGOUT: '/api/auth/logout',
    PROFILE: '/api/auth/profile',
  },

  // Family Management
  FAMILY: {
    BASE: '/api/family',
    MEMBERS: '/api/family',
    STATS: '/api/family/stats',
  },

  // ITR Filing
  ITR: {
    BASE: '/api/itr',
    SESSIONS: '/api/itr/sessions',
    SECTIONS: {
      '80C': '/api/itr/sections/80c',
      '80D': '/api/itr/sections/80d',
      '80G': '/api/itr/sections/80g',
      '80TTA': '/api/itr/sections/80tta',
      '80EE': '/api/itr/sections/80ee',
      '80EEA': '/api/itr/sections/80eea',
      '80EEB': '/api/itr/sections/80eeb',
      '80U': '/api/itr/sections/80u',
      '80DD': '/api/itr/sections/80dd',
    },
    INCOME: '/api/itr/income',
    TDS: '/api/itr/tds',
    COMPUTATION: '/api/itr/computation',
    EXPORT: '/api/itr/export',
  },

  // Documents
  DOCUMENTS: {
    BASE: '/api/documents',
    UPLOAD: '/api/documents/upload',
    DOWNLOAD: '/api/documents/download',
  },

  // Health
  HEALTH: '/api/health',
};

// ITR Types - Clear enumeration
export const ITR_TYPES = {
  ITR1: 'ITR-1',
  ITR2: 'ITR-2',
  ITR3: 'ITR-3',
  ITR4: 'ITR-4',
};

// Section 80C Deduction Types - Complete list
export const SECTION_80C_TYPES = {
  EPF: 'Employee Provident Fund',
  PPF: 'Public Provident Fund',
  NSC: 'National Savings Certificate',
  ELSS: 'Equity Linked Savings Scheme',
  ULIP: 'Unit Linked Insurance Plan',
  TERM_INSURANCE: 'Term Insurance Premium',
  HOME_LOAN_PRINCIPAL: 'Home Loan Principal Repayment',
  SUKANYA_SAMRIDDHI: 'Sukanya Samriddhi Yojana',
  SENIOR_CITIZEN_SCHEME: 'Senior Citizen Savings Scheme',
  POST_OFFICE_DEPOSIT: 'Post Office Time Deposit',
  BANK_FD: 'Bank Fixed Deposit (5+ years)',
  INFRASTRUCTURE_BONDS: 'Infrastructure Bonds',
  TAX_SAVING_FD: 'Tax Saving Fixed Deposit',
};

// Section 80D Types
export const SECTION_80D_TYPES = {
  SELF_FAMILY: 'Self & Family',
  PARENTS: 'Parents',
  SENIOR_CITIZEN_SELF: 'Senior Citizen Self',
  SENIOR_CITIZEN_PARENTS: 'Senior Citizen Parents',
};

// Income Types
export const INCOME_TYPES = {
  SALARY: 'salary',
  BUSINESS: 'business',
  PROFESSION: 'profession',
  CAPITAL_GAINS: 'capital_gains',
  HOUSE_PROPERTY: 'house_property',
  OTHER_SOURCES: 'other_sources',
};

// Document Types
export const DOCUMENT_TYPES = {
  FORM_16: 'form_16',
  FORM_16A: 'form_16a',
  BANK_STATEMENT: 'bank_statement',
  INVESTMENT_PROOF: 'investment_proof',
  INSURANCE_POLICY: 'insurance_policy',
  DONATION_RECEIPT: 'donation_receipt',
  MEDICAL_CERTIFICATE: 'medical_certificate',
  DISABILITY_CERTIFICATE: 'disability_certificate',
};

// Validation Patterns
export const VALIDATION_PATTERNS = {
  PAN: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
  AADHAR: /^[0-9]{12}$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^[6-9]\d{9}$/,
  ACCOUNT_NUMBER: /^[0-9]{9,18}$/,
};

// Tax Slabs (FY 2023-24)
export const TAX_SLABS = {
  INDIVIDUAL: [
    { min: 0, max: 250000, rate: 0 },
    { min: 250001, max: 500000, rate: 5 },
    { min: 500001, max: 1000000, rate: 20 },
    { min: 1000001, max: Infinity, rate: 30 },
  ],
  SENIOR_CITIZEN: [
    { min: 0, max: 300000, rate: 0 },
    { min: 300001, max: 500000, rate: 5 },
    { min: 500001, max: 1000000, rate: 20 },
    { min: 1000001, max: Infinity, rate: 30 },
  ],
  SUPER_SENIOR_CITIZEN: [
    { min: 0, max: 500000, rate: 0 },
    { min: 500001, max: 1000000, rate: 20 },
    { min: 1000001, max: Infinity, rate: 30 },
  ],
};

// Section Limits (FY 2023-24)
export const SECTION_LIMITS = {
  '80C': 150000,
  '80D': {
    SELF_FAMILY: 25000,
    PARENTS: 25000,
    SENIOR_CITIZEN_SELF: 50000,
    SENIOR_CITIZEN_PARENTS: 50000,
  },
  '80G': 100000, // 50% deduction
  '80TTA': 10000,
  '80EE': 200000,
  '80EEA': 150000,
  '80EEB': 150000,
  '80U': 125000,
  '80DD': 125000,
};

// Response Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
};

// Error Messages - Centralized
export const ERROR_MESSAGES = {
  VALIDATION: {
    REQUIRED_FIELD: 'This field is required',
    INVALID_PAN: 'Invalid PAN number format',
    INVALID_AADHAR: 'Invalid Aadhar number format',
    INVALID_EMAIL: 'Invalid email format',
    INVALID_PHONE: 'Invalid phone number format',
    INVALID_AMOUNT: 'Amount must be a positive number',
    EXCEEDS_LIMIT: 'Amount exceeds maximum limit for this section',
  },
  AUTH: {
    INVALID_CREDENTIALS: 'Invalid email or password',
    TOKEN_EXPIRED: 'Session expired, please login again',
    ACCESS_DENIED: 'Access denied',
  },
  FAMILY: {
    MEMBER_NOT_FOUND: 'Family member not found',
    DUPLICATE_MEMBER: 'Family member already exists',
  },
  ITR: {
    SESSION_NOT_FOUND: 'ITR session not found',
    INVALID_SECTION: 'Invalid tax section',
    COMPUTATION_FAILED: 'Tax computation failed',
  },
};

// Success Messages - Centralized
export const SUCCESS_MESSAGES = {
  FAMILY: {
    MEMBER_ADDED: 'Family member added successfully',
    MEMBER_UPDATED: 'Family member updated successfully',
    MEMBER_DELETED: 'Family member deleted successfully',
  },
  ITR: {
    SESSION_CREATED: 'ITR session created successfully',
    SECTION_SAVED: 'Tax section data saved successfully',
    COMPUTATION_COMPLETE: 'Tax computation completed successfully',
    EXPORT_GENERATED: 'ITR JSON export generated successfully',
  },
};
