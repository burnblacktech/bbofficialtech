// =====================================================
// FINANCIAL READINESS SCORE WEIGHTS
// 7 components summing to 1.0 (100%).
// Used by the readiness score endpoint to compute
// how prepared a user's data is for tax filing.
// =====================================================

const READINESS_WEIGHTS = {
  pan_verified: 0.15,
  income_logged: 0.20,
  form16_present: 0.15,
  investments_logged: 0.15,
  expenses_logged: 0.10,
  documents_uploaded: 0.15,
  profile_complete: 0.10,
};

module.exports = { READINESS_WEIGHTS };
