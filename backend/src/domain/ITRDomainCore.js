// =====================================================
// ITR DOMAIN CORE - SINGLE AUTHORITY FOR ITR DOMAIN LOGIC
// =====================================================

const { ITR_DOMAIN_STATES, VALID_STATE_TRANSITIONS, STATE_ALLOWED_ACTIONS } = require('./states');
const { ITRFiling } = require('../models');
const enterpriseLogger = require('../utils/logger');

/**
 * ITR Domain Core
 * 
 * This module is the single authority for:
 * 1. State transitions - only Domain Core can change state
 * 2. ITR type decisions - only Domain Core can determine/change ITR type
 * 3. Allowed actions - only Domain Core can decide what actions are allowed
 * 4. Recomputation/invalidation - only Domain Core can trigger recomputation
 */
class ITRDomainCore {
  constructor() {
    this.logger = enterpriseLogger;
  }

  /**
   * Get current state of a filing
   * @param {string} filingId
   * @returns {Promise<string>}
   */
  async getCurrentState(filingId) {
    const filing = await ITRFiling.findByPk(filingId, { attributes: ['lifecycle_state'] });
    if (!filing) {
      throw new Error(`Filing not found: ${filingId}`);
    }
    return filing.lifecycle_state || ITR_DOMAIN_STATES.DRAFT_INIT;
  }

  /**
   * Check if transition is allowed
   */
  canTransition(currentState, targetState) {
    if (!currentState || !targetState) return false;
    const allowed = VALID_STATE_TRANSITIONS[currentState] || [];
    return allowed.includes(targetState);
  }

  assertDraftEditable(state, actor) {
    this.assertActionAllowed(state, 'edit_data', actor);
  }

  assertComputable(state, actor) {
    this.assertActionAllowed(state, 'compute_tax', actor);
  }

  assertExportable(state, actor) {
    this.assertActionAllowed(state, 'export_json', actor);
  }

  assertSubmittable(state, actor) {
    this.assertActionAllowed(state, 'file_itr', actor);
  }

  assertActionAllowed(state, action, actor) {
    const allowed = this.getAllowedActions(state, actor);
    if (!allowed.includes(action)) {
      const error = new Error(`Action '${action}' not allowed in state '${state}'`);
      error.statusCode = 400;
      throw error;
    }
  }

  async isActionAllowed(filingId, action, actor) {
    const state = await this.getCurrentState(filingId);
    const allowed = this.getAllowedActions(state, actor);
    return allowed.includes(action);
  }

  /**
   * Determine ITR type based on user data signals
   */
  determineITR(signals) {
    if (!signals || typeof signals !== 'object') {
      return { recommendedITR: 'ITR-1', confidence: 0.5, reason: 'Insufficient data' };
    }

    const rules = [
      {
        id: 'agricultural_income',
        condition: (d) => (d.agriculturalIncome || 0) > 5000,
        recommendedITR: 'ITR-2',
        reason: 'Agricultural income > 5000',
        priority: 10
      },
      {
        id: 'business_income',
        condition: (d) => (d.businessIncome > 0 || d.professionalIncome > 0),
        recommendedITR: 'ITR-3',
        reason: 'Business/Professional income detected',
        priority: 8
      },
      {
        id: 'capital_gains',
        condition: (d) => (d.capitalGains || 0) > 0,
        recommendedITR: 'ITR-2',
        reason: 'Capital gains detected',
        priority: 6
      },
      {
        id: 'foreign_assets',
        condition: (d) => (d.foreignIncome > 0 || d.hasForeignAssets),
        recommendedITR: 'ITR-2',
        reason: 'Foreign assets/income detected',
        priority: 7
      }
    ];

    const results = [];
    for (const rule of rules) {
      if (rule.condition(signals)) {
        results.push(rule);
      }
    }

    // Sort by priority
    results.sort((a, b) => b.priority - a.priority);

    if (results.length > 0) {
      return {
        recommendedITR: results[0].recommendedITR,
        confidence: 0.9,
        reason: results[0].reason,
        triggeredRules: results
      };
    }

    return {
      recommendedITR: 'ITR-1',
      confidence: 0.8,
      reason: 'Standard salaried income'
    };
  }

  getAllowedActions(state, actor = {}) {
    if (!state || !STATE_ALLOWED_ACTIONS[state]) return [];

    const baseActions = STATE_ALLOWED_ACTIONS[state] || [];
    const role = actor.role || 'END_USER';
    const adminRoles = ['SUPER_ADMIN', 'PLATFORM_ADMIN', 'CA_FIRM_ADMIN']; // Expanded for safety

    return baseActions.filter(action => {
      // Basic RBAC
      if (action === 'unlock_filing') return adminRoles.includes(role);
      // CA overrides
      if (action === 'override_values') return adminRoles.includes(role) || role === 'CA';
      return true;
    });
  }

  extractDomainSnapshot(draftData) {
    if (!draftData) return {};
    const income = draftData.income || {};
    const exempt = draftData.exemptIncome || {};

    return {
      salary: income.salary || 0,
      businessIncome: income.businessIncome || 0,
      professionalIncome: income.professionalIncome || 0,
      capitalGains: income.capitalGains || 0,
      foreignIncome: income.foreignIncome || 0,
      agriculturalIncome: income.agriculturalIncome || exempt.netAgriculturalIncome || 0,
      itrType: draftData.itrType || 'ITR-1',
      taxRegime: draftData.taxRegime || 'old'
    };
  }

  requiresStateRollback(currentState, prevSnapshot, newSnapshot) {
    // Basic logic: if critical fields change in a LOCKED/COMPUTED state, rollback to DRAFT
    // Critical fields: ITR Type, Income Heads that change form applicability

    if (currentState === ITR_DOMAIN_STATES.DRAFT_INIT || currentState === ITR_DOMAIN_STATES.DRAFT_IN_PROGRESS) {
      return { required: false };
    }

    // If Computed/Validated, and data changes => Rollback usually required to invalidate computation
    if (currentState === ITR_DOMAIN_STATES.COMPUTATION_DONE || currentState === ITR_DOMAIN_STATES.VALIDATION_SUCCESS) {
      // Compare snapshots - for now, any change in snapshot => rollback
      // A deep equals is better, but here we use simple JSON stringify for the snapshot subset
      if (JSON.stringify(prevSnapshot) !== JSON.stringify(newSnapshot)) {
        return { required: true, targetState: ITR_DOMAIN_STATES.DRAFT_IN_PROGRESS, reason: 'Critical data changed' };
      }
    }

    return { required: false };
  }

  shouldRecompute(prevSnapshot, newSnapshot) {
    // Simple check: if snapshots differ, recompute needed
    return JSON.stringify(prevSnapshot) !== JSON.stringify(newSnapshot);
  }

  async transitionState(filingId, targetState, context = {}) {
    const currentState = await this.getCurrentState(filingId);
    if (!this.canTransition(currentState, targetState)) {
      // Force transition if SYSTEM/Rollback? 
      // For now, if rollback is explicitly requested by DomainCore itself, we might allow it, 
      // but strictly speaking standard transitions should occur.
      // However, 'DRAFT_IN_PROGRESS' should be reachable from 'COMPUTATION_DONE'.
      // If not defined in states.js, we might have an issue.
      // Assuming STATES.js is correct.
      // If strict check fails, we log and throw.
      throw new Error(`Invalid transition ${currentState} -> ${targetState}`);
    }

    if (targetState === ITR_DOMAIN_STATES.LOCKED) {
      await this.validateInvariants(filingId, targetState);
    }

    await ITRFiling.update({
      lifecycle_state: targetState,
      updated_at: new Date(),
      last_action_by: context.userId || 'SYSTEM'
    }, { where: { id: filingId } });

    this.logger.info(`State transition: ${currentState} -> ${targetState}`, { filingId, context });
    return targetState;
  }

  async validateInvariants(filingId, targetState) {
    const filing = await ITRFiling.findByPk(filingId);
    if (targetState === ITR_DOMAIN_STATES.LOCKED) {
      if (!filing.tax_computation) throw new Error('Missing tax computation');
    }
    return true;
  }
}

module.exports = new ITRDomainCore();
