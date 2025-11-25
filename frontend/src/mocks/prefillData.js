/**
 * Mock Data Contract for Dynamic Filing Page
 *
 * This file defines the exact JSON structure that the frontend expects
 * from the backend APIs. The backend team should build their APIs
 * to return data in this exact format.
 */

export const mockPrefillData = {
  // Filing metadata
  filingId: 'filing_2024_001',
  assessmentYear: '2024-25',
  pan: 'ABCDE1234F',
  dateOfBirth: '1990-05-15',
  aadhaarLinked: true,

  // Personal Information (pre-filled from PAN profile)
  personalInfo: {
    fullName: 'John Doe',
    fatherName: 'Robert Doe',
    email: 'john.doe@email.com',
    phone: '+91-9876543210',
    address: {
      line1: '123 Main Street',
      line2: 'Apt 4B',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      country: 'India',
    },
    filingStatus: 'Resident Individual',
    bankAccounts: [
      {
        accountNumber: '1234567890',
        bankName: 'HDFC Bank',
        ifscCode: 'HDFC0000123',
        accountType: 'Savings',
      },
    ],
  },

  // Income Details (pre-filled from AIS and Form 26AS)
  incomeDetails: {
    salary: [
      {
        id: 'salary_001',
        employerName: 'Tech Solutions Pvt Ltd',
        employerTAN: 'BANG12345E',
        grossSalary: 1200000,
        basicSalary: 600000,
        hra: 300000,
        lta: 50000,
        medicalAllowance: 15000,
        otherAllowances: 35000,
        professionalTax: 2500,
        tds: 120000,
        form16Uploaded: true,
        form16Url: '/uploads/form16_001.pdf',
        verified: true,
      },
    ],
    otherSources: [
      {
        id: 'interest_001',
        source: 'HDFC Bank Savings Account',
        amount: 15000,
        tds: 0,
        section: '194A',
        verified: true,
      },
      {
        id: 'dividend_001',
        source: 'Reliance Industries Ltd',
        amount: 25000,
        tds: 2500,
        section: '194',
        verified: true,
      },
    ],
    capitalGains: [],
    businessIncome: [],
    houseProperty: [],
  },

  // Deductions (pre-filled from AIS where applicable)
  deductions: {
    section80C: {
      totalLimit: 150000,
      claimed: 0,
      items: [
        {
          id: 'ppf_001',
          type: 'PPF',
          amount: 0,
          description: 'Public Provident Fund',
          verified: false,
        },
        {
          id: 'elss_001',
          type: 'ELSS',
          amount: 0,
          description: 'Equity Linked Savings Scheme',
          verified: false,
        },
        {
          id: 'life_insurance_001',
          type: 'Life Insurance',
          amount: 0,
          description: 'Life Insurance Premium',
          verified: false,
        },
      ],
    },
    section80D: {
      totalLimit: 25000,
      claimed: 0,
      items: [
        {
          id: 'health_insurance_001',
          type: 'Health Insurance',
          amount: 0,
          description: 'Health Insurance Premium (Self)',
          verified: false,
        },
      ],
    },
    section80TTA: {
      totalLimit: 10000,
      claimed: 0,
      items: [
        {
          id: 'savings_interest_001',
          type: 'Savings Interest',
          amount: 0,
          description: 'Interest on Savings Account',
          verified: false,
        },
      ],
    },
    hra: {
      totalLimit: 0,
      claimed: 0,
      items: [
        {
          id: 'hra_001',
          type: 'HRA',
          amount: 0,
          description: 'House Rent Allowance',
          rentPaid: 0,
          rentReceipts: [],
          verified: false,
        },
      ],
    },
  },

  // Taxes Paid (pre-filled from Form 26AS)
  taxesPaid: {
    tds: [
      {
        id: 'tds_salary_001',
        source: 'Tech Solutions Pvt Ltd',
        section: '192',
        amount: 120000,
        verified: true,
      },
      {
        id: 'tds_dividend_001',
        source: 'Reliance Industries Ltd',
        section: '194',
        amount: 2500,
        verified: true,
      },
    ],
    advanceTax: [],
    selfAssessmentTax: [],
  },

  // AI Suggestions (will be populated by AI API)
  aiSuggestions: [
    {
      id: 'suggestion_001',
      type: 'deduction_opportunity',
      section: 'section80C',
      title: 'Maximize 80C Benefits',
      description: 'You can save ₹6,000 more in tax by investing ₹30,000 in 80C eligible instruments',
      priority: 'high',
      actionable: true,
      estimatedSavings: 6000,
    },
    {
      id: 'suggestion_002',
      type: 'inconsistency',
      section: 'tds',
      title: 'TDS Mismatch Detected',
      description: "TDS in Form 26AS doesn't match your salary details. Please verify.",
      priority: 'medium',
      actionable: true,
    },
  ],

  // Filing status
  status: 'draft',
  lastSaved: '2024-01-15T10:30:00Z',
  completionPercentage: 45,
};

// Mock tax calculation response
export const mockTaxCalculation = {
  totalIncome: 1235000,
  totalDeductions: 0,
  taxableIncome: 1235000,
  taxOnTaxableIncome: 125000,
  cess: 5000,
  totalTaxLiability: 130000,
  totalTaxesPaid: 122500,
  refund: 7500,
  taxDue: 0,
  breakdown: {
    incomeBreakdown: {
      salary: 1200000,
      otherSources: 15000,
      total: 1235000,
    },
    deductionBreakdown: {
      section80C: 0,
      section80D: 0,
      section80TTA: 0,
      hra: 0,
      total: 0,
    },
    taxBreakdown: {
      slab1: 0,      // 0-2.5L
      slab2: 0,      // 2.5L-5L
      slab3: 125000, // 5L-10L
      slab4: 0,      // 10L+
      cess: 5000,
    },
  },
};

// Mock AI suggestions response
export const mockAISuggestions = [
  {
    id: 'ai_suggestion_001',
    type: 'deduction_opportunity',
    section: 'section80C',
    title: 'Maximize 80C Benefits',
    description: 'You can save ₹6,000 more in tax by investing ₹30,000 in 80C eligible instruments',
    priority: 'high',
    actionable: true,
    estimatedSavings: 6000,
    actionUrl: '#section80C',
  },
  {
    id: 'ai_suggestion_002',
    type: 'inconsistency',
    section: 'tds',
    title: 'TDS Mismatch Detected',
    description: "TDS in Form 26AS doesn't match your salary details. Please verify.",
    priority: 'medium',
    actionable: true,
    actionUrl: '#taxesPaid',
  },
  {
    id: 'ai_suggestion_003',
    type: 'optimization',
    section: 'hra',
    title: 'HRA Optimization Available',
    description: "You have HRA component but haven't claimed rent. You could save ₹15,000 in tax.",
    priority: 'medium',
    actionable: true,
    estimatedSavings: 15000,
    actionUrl: '#hra',
  },
];

export default {
  mockPrefillData,
  mockTaxCalculation,
  mockAISuggestions,
};
