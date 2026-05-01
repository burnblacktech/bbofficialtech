// =====================================================
// ITR DOMAIN CORE — ITR type determination logic
// State management is handled by SubmissionStateMachine.
// =====================================================

/**
 * Determine recommended ITR type based on income signals.
 * Used by the ITR determination wizard.
 */
function determineITR(signals) {
  if (!signals || typeof signals !== 'object') {
    return { recommendedITR: 'ITR-1', confidence: 0.5, reason: 'Insufficient data' };
  }

  const rules = [
    { condition: (d) => d.businessIncome > 0 || d.professionalIncome > 0, recommendedITR: 'ITR-3', reason: 'Business/Professional income detected', priority: 8 },
    { condition: (d) => d.foreignIncome > 0 || d.hasForeignAssets, recommendedITR: 'ITR-2', reason: 'Foreign assets/income detected', priority: 7 },
    { condition: (d) => (d.capitalGains || 0) > 0, recommendedITR: 'ITR-2', reason: 'Capital gains detected', priority: 6 },
    { condition: (d) => (d.agriculturalIncome || 0) > 5000, recommendedITR: 'ITR-2', reason: 'Agricultural income > ₹5,000', priority: 10 },
  ];

  const triggered = rules.filter((r) => r.condition(signals)).sort((a, b) => b.priority - a.priority);

  if (triggered.length > 0) {
    return { recommendedITR: triggered[0].recommendedITR, confidence: 0.9, reason: triggered[0].reason, triggeredRules: triggered };
  }

  return { recommendedITR: 'ITR-1', confidence: 0.8, reason: 'Standard salaried income' };
}

module.exports = { determineITR };
