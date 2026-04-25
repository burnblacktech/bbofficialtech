/**
 * TaxBrainService — Backend intelligence for cross-member optimization
 * and post-filing insights that require multi-filing data access.
 *
 * The frontend taxBrain.js handles real-time single-filing whispers.
 * This service handles:
 * - Cross-member family optimization (requires DB access)
 * - Post-filing insights (requires filing + ERI data)
 * - CPC intimation decoding
 * - Refund composition breakdown
 */

const { ITRFiling } = require('../../models');
const enterpriseLogger = require('../../utils/logger');

const n = (v) => Number(v) || 0;
const rs = (v) => `₹${Math.abs(n(v)).toLocaleString('en-IN')}`;

class TaxBrainService {

  /**
   * Analyze cross-member tax optimization opportunities.
   * Called when 2+ family members have filings for the same AY.
   */
  static async analyzeFamilyOptimization(userId, assessmentYear) {
    const whispers = [];

    try {
      // Get all filings for this user's family for the given AY
      const filings = await ITRFiling.findAll({
        where: { createdBy: userId, assessmentYear },
      });

      if (filings.length < 2) return whispers;

      // Analyze 80C allocation across members
      const members = filings.map(f => ({
        id: f.id,
        pan: f.taxpayerPan,
        payload: f.jsonPayload || {},
        regime: f.selectedRegime || 'new',
      }));

      // Check if any member has unused 80C room while another is over-invested
      const memberDeductions = members.map(m => {
        const d = m.payload.deductions || {};
        const raw80C = n(d.ppf) + n(d.elss) + n(d.lic) + n(d.tuitionFees) + n(d.homeLoanPrincipal) + n(d.sukanyaSamriddhi) + n(d.fiveYearFD) + n(d.nsc) + n(d.otherC);
        return { ...m, raw80C, remaining80C: Math.max(0, 150000 - raw80C) };
      });

      const overInvested = memberDeductions.filter(m => m.raw80C > 150000);
      const underInvested = memberDeductions.filter(m => m.remaining80C > 50000 && m.regime === 'old');

      if (overInvested.length > 0 && underInvested.length > 0) {
        const excess = overInvested[0].raw80C - 150000;
        whispers.push({
          id: 'family-80c-realloc',
          type: 'saving',
          message: `One family member has ${rs(excess)} excess 80C investments (over ₹1.5L cap). Another member has ${rs(underInvested[0].remaining80C)} of 80C room. Consider investing in the under-utilized member's name next year.`,
          priority: 2,
        });
      }

      // Check health insurance optimization (80D)
      const memberHealth = members.map(m => {
        const d = m.payload.deductions || {};
        return { ...m, healthSelf: n(d.healthSelf), healthParents: n(d.healthParents) };
      });

      const noHealthClaim = memberHealth.filter(m => m.healthSelf === 0 && m.healthParents === 0 && m.regime === 'old');
      if (noHealthClaim.length > 0 && members.length >= 2) {
        whispers.push({
          id: 'family-80d-distribute',
          type: 'tip',
          message: 'Consider distributing health insurance premium payments across family members. Each member can claim up to ₹25,000 (₹50,000 for seniors) under 80D.',
          priority: 3,
        });
      }

    } catch (error) {
      enterpriseLogger.error('Family optimization analysis failed', { error: error.message });
    }

    return whispers;
  }

  /**
   * Generate post-filing insights for a submitted filing.
   */
  static async generatePostFilingInsights(filingId) {
    const whispers = [];

    try {
      const filing = await ITRFiling.findByPk(filingId);
      if (!filing || filing.lifecycleState !== 'eri_success') return whispers;

      const payload = filing.jsonPayload || {};
      const comp = filing.taxComputation || {};
      const regime = filing.selectedRegime || 'new';
      const best = comp[regime === 'old' ? 'oldRegime' : 'newRegime'] || {};
      const tds = comp.tds || {};

      // Refund explanation
      if (n(best.netPayable) < 0) {
        const refundAmount = Math.abs(n(best.netPayable));
        const composition = this.assembleRefundComposition(filing, comp);
        whispers.push({
          id: 'pf-refund-explain',
          type: 'info',
          message: `Your refund of ${rs(refundAmount)} is because your TDS/advance tax (${rs(tds.total)}) exceeded your actual tax liability (${rs(best.totalTax)}). ${composition.primaryReason}`,
          priority: 1,
        });
      }

      // Tax payable warning
      if (n(best.netPayable) > 0) {
        whispers.push({
          id: 'pf-tax-due',
          type: 'warning',
          message: `You have ${rs(best.netPayable)} tax payable. Pay this as self-assessment tax before filing to avoid interest under Section 234B.`,
          priority: 1,
        });
      }

      // Regime trade-off insight
      if (comp.savings > 0 && regime !== comp.recommended) {
        whispers.push({
          id: 'pf-regime-tradeoff',
          type: 'tip',
          message: `You filed under ${regime} regime, but ${comp.recommended} regime would have saved ${rs(comp.savings)}. Consider switching next year.`,
          priority: 2,
        });
      }

    } catch (error) {
      enterpriseLogger.error('Post-filing insights failed', { error: error.message });
    }

    return whispers;
  }

  /**
   * Decode a CPC Section 143(1) intimation into plain English.
   */
  static decodeCPCIntimation(intimationData) {
    if (!intimationData) return { success: false, message: 'No intimation data provided' };

    try {
      const adjustments = intimationData.adjustments || [];
      const decoded = adjustments.map(adj => {
        const explanations = {
          'INCOME_MISMATCH': 'ITD found a difference between your declared income and what\'s reported in 26AS/AIS.',
          'TDS_MISMATCH': 'The TDS you claimed doesn\'t match ITD\'s records in Form 26AS.',
          'DEDUCTION_DISALLOWED': 'A deduction you claimed was partially or fully disallowed.',
          'INTEREST_234A': 'Interest charged for late filing (after due date).',
          'INTEREST_234B': 'Interest charged for not paying advance tax.',
          'INTEREST_234C': 'Interest charged for deferment of advance tax installments.',
          'FEE_234F': 'Late filing fee charged under Section 234F.',
          'ARITHMETIC_ERROR': 'ITD found a calculation error in your return.',
        };

        return {
          code: adj.code || 'UNKNOWN',
          description: explanations[adj.code] || `Adjustment: ${adj.description || adj.code}`,
          asPerReturn: n(adj.asPerReturn),
          asPerCPC: n(adj.asPerCPC),
          difference: n(adj.asPerCPC) - n(adj.asPerReturn),
        };
      });

      const totalDemand = n(intimationData.demandAmount);
      const totalRefund = n(intimationData.refundAmount);

      return {
        success: true,
        adjustments: decoded,
        demand: totalDemand > 0 ? {
          amount: totalDemand,
          explanation: `ITD has raised a demand of ${rs(totalDemand)} based on the adjustments above.`,
          options: [
            { action: 'accept', label: 'Accept and pay the demand', description: 'Pay the demand amount online via e-Pay Tax.' },
            { action: 'dispute', label: 'Dispute the demand', description: 'File a rectification request under Section 154 if you believe the adjustment is incorrect.' },
            { action: 'revised', label: 'File a revised return', description: 'If you made an error in your original return, file a revised return with correct data.' },
          ],
        } : null,
        refund: totalRefund > 0 ? {
          amount: totalRefund,
          explanation: `ITD has determined a refund of ${rs(totalRefund)} after processing your return.`,
        } : null,
      };
    } catch (error) {
      return { success: false, message: 'Unable to parse CPC intimation format. Please check the ITD portal directly.' };
    }
  }

  /**
   * Assemble refund composition breakdown.
   */
  static assembleRefundComposition(filing, computation) {
    const tds = computation?.tds || {};
    const regime = filing.selectedRegime || 'new';
    const best = computation?.[regime === 'old' ? 'oldRegime' : 'newRegime'] || {};
    const totalTax = n(best.totalTax);
    const totalCredits = n(tds.total);
    const refund = Math.max(0, totalCredits - totalTax);

    const components = [];
    if (n(tds.fromSalary) > 0) components.push({ source: 'TDS on Salary', amount: n(tds.fromSalary) });
    if (n(tds.fromNonSalary) > 0) components.push({ source: 'TDS on Non-Salary', amount: n(tds.fromNonSalary) });
    if (n(tds.advanceTax) > 0) components.push({ source: 'Advance Tax', amount: n(tds.advanceTax) });
    if (n(tds.selfAssessment) > 0) components.push({ source: 'Self-Assessment Tax', amount: n(tds.selfAssessment) });

    // Determine primary reason for refund
    let primaryReason = '';
    if (n(tds.fromSalary) > totalTax) {
      primaryReason = 'Your employer deducted more TDS than your actual tax liability.';
    } else if (n(tds.advanceTax) > 0) {
      primaryReason = 'Your advance tax payments exceeded your final tax liability.';
    } else {
      primaryReason = 'Your total tax credits exceed your computed tax.';
    }

    return {
      refundAmount: refund,
      totalTax,
      totalCredits,
      components,
      primaryReason,
    };
  }
}

module.exports = TaxBrainService;
