// =====================================================
// DEDUCTION SECTION MAPPINGS
// Maps expense categories and investment types to
// their corresponding Income Tax Act deduction sections.
// =====================================================

const EXPENSE_TO_DEDUCTION = {
  rent: 'HRA',
  medical: '80D',
  donations: '80G',
  education_loan: '80E',
  insurance: '80C',
  other: null,
};

const INVESTMENT_TO_DEDUCTION = {
  ppf: '80C',
  elss: '80C',
  nps: '80CCD(1B)',
  lic: '80C',
  sukanya: '80C',
  tax_fd: '80C',
  ulip: '80C',
  other_80c: '80C',
  '80ccd_1b_nps': '80CCD(1B)',
};

const DEDUCTION_LIMITS = {
  '80C': 150000,
  '80CCD(1B)': 50000,
  '80D': 75000, // Senior citizen limit; 25000 for others
  '80G': null, // No fixed limit (100% or 50% of donation)
  '80E': null, // No limit on education loan interest
  HRA: null, // Computed based on salary/rent/city
};

module.exports = {
  EXPENSE_TO_DEDUCTION,
  INVESTMENT_TO_DEDUCTION,
  DEDUCTION_LIMITS,
};
