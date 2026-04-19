/**
 * Pricing Plans — Market-breaking pricing
 *
 * Strategy: Undercut ClearTax (₹499+) and Tax2Win (₹1,274+) aggressively.
 * Free tier for low-income filers creates word-of-mouth.
 * Revenue comes from volume + CA-assisted upsell.
 *
 * Competitor reference (AY 2025-26):
 *   ClearTax:   ₹499-999 self, ₹2,539-6,759 CA-assisted
 *   Tax2Win:    ₹49 data-only, ₹1,274-10,624 CA-assisted
 *   MyITReturn: ₹99 self, ₹1,000-6,000 CA-assisted
 *   TaxSpanner: ₹899-6,499 CA-assisted
 */

const PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    tagline: 'For income up to ₹5 lakh',
    price: 0,
    gstRate: 0.18,
    priceWithGst: 0,
    itrTypes: ['ITR-1', 'ITR-4'],
    maxIncome: 500000,
    features: [
      'ITR-1 or ITR-4 filing',
      'Form 16 import',
      'Old vs new regime comparison',
      'JSON download',
      'Tax computation PDF',
    ],
    excludes: ['ERI submission', 'e-Verification', 'CA review', 'Priority support'],
  },

  starter: {
    id: 'starter',
    name: 'Starter',
    tagline: 'Salaried individuals',
    price: 149,
    gstRate: 0.18,
    priceWithGst: 176,
    itrTypes: ['ITR-1', 'ITR-4'],
    maxIncome: null,
    features: [
      'ITR-1 or ITR-4 filing',
      'All document imports (Form 16, 26AS, AIS)',
      'Old vs new regime comparison',
      'Smart validation (catches errors before ITD)',
      'JSON download + computation PDF',
      'ERI direct submission',
      'e-Verification via Aadhaar OTP',
      'ITR-V acknowledgement download',
    ],
    excludes: ['CA review', 'Priority support'],
    popular: true,
  },

  plus: {
    id: 'plus',
    name: 'Plus',
    tagline: 'Capital gains, multiple income sources',
    price: 249,
    gstRate: 0.18,
    priceWithGst: 294,
    itrTypes: ['ITR-1', 'ITR-2', 'ITR-3', 'ITR-4'],
    maxIncome: null,
    features: [
      'All ITR types (1, 2, 3, 4)',
      'Capital gains computation',
      'Broker statement import',
      'All document imports',
      'Smart validation + Tax Brain insights',
      'ERI direct submission + e-Verification',
      'ITR-V acknowledgement download',
      'Email support',
    ],
    excludes: ['CA review'],
  },

  // eslint-disable-next-line camelcase
  ca_assisted: {
    id: 'ca_assisted',
    name: 'CA Assisted',
    tagline: 'Expert CA reviews and files for you',
    price: 799,
    gstRate: 0.18,
    priceWithGst: 943,
    itrTypes: ['ITR-1', 'ITR-2', 'ITR-3', 'ITR-4'],
    maxIncome: null,
    features: [
      'Everything in Plus',
      'Dedicated CA assigned',
      'CA reviews your data before filing',
      'Tax optimization suggestions',
      'Filing done by CA on your behalf',
      'Post-filing support (30 days)',
      'Priority support via chat',
    ],
    excludes: [],
  },

  family: {
    id: 'family',
    name: 'Family Pack',
    tagline: 'Up to 4 family members',
    price: 449,
    gstRate: 0.18,
    priceWithGst: 530,
    itrTypes: ['ITR-1', 'ITR-2', 'ITR-3', 'ITR-4'],
    maxIncome: null,
    maxMembers: 4,
    features: [
      'Up to 4 PANs (family members)',
      'All ITR types',
      'Cross-member tax optimization',
      'All document imports',
      'ERI submission for all members',
      'Family tax summary dashboard',
    ],
    excludes: ['CA review'],
  },
};

/**
 * Determine which plan a user needs based on their filing
 */
function getRequiredPlan(itrType, grossIncome) {
  const income = Number(grossIncome) || 0;

  // Free tier: income ≤ ₹5L and ITR-1/4 only
  if (income <= 500000 && ['ITR-1', 'ITR-4'].includes(itrType)) {
    return PLANS.free;
  }

  // ITR-2/3 need Plus
  if (['ITR-2', 'ITR-3'].includes(itrType)) {
    return PLANS.plus;
  }

  // ITR-1/4 with income > ₹5L
  return PLANS.starter;
}

/**
 * Generate GST-compliant invoice number
 * Format: BB-YYMM-NNNNN (e.g., BB-2526-00001)
 */
function generateInvoiceNumber(sequenceNumber) {
  const now = new Date();
  const fy = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  const fyShort = `${String(fy).slice(2)}${String(fy + 1).slice(2)}`;
  return `BB-${fyShort}-${String(sequenceNumber).padStart(5, '0')}`;
}

module.exports = { PLANS, getRequiredPlan, generateInvoiceNumber };
