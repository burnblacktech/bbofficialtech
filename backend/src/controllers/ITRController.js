// CONTROLLER IS A ROUTER ONLY.
// ALL BUSINESS LOGIC LIVES IN SERVICES OR DOMAIN CORE.
// DO NOT ADD LOGIC HERE.

// =====================================================
// ITR CONTROLLER - CANONICAL FILING SYSTEM
// Handles create/validate/submit for all ITR types
// =====================================================

const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const { query: dbQuery } = require('../utils/dbQuery');
const enterpriseLogger = require('../utils/logger');
const {
  successResponse,
  errorResponse,
  validationErrorResponse,
  notFoundResponse,
  unauthorizedResponse,
  paginatedResponse,
} = require('../utils/responseFormatter');
const {
  DEFAULT_ASSESSMENT_YEAR,
  getDefaultAssessmentYear,
  isValidAssessmentYear,
} = require('../constants/assessmentYears');
const {
  validateITRType,
  validateRequiredFields,
  validatePagination,
} = require('../utils/validationUtils');
const validationEngine = require('../services/core/ValidationEngine');
const taxComputationEngine = require('../services/core/TaxComputationEngine');
const serviceTicketService = require('../services/common/ServiceTicketService');
const sseNotificationService = require('../services/utils/NotificationService');
const taxAuditChecker = require('../services/itr/TaxAuditChecker');
const eVerificationService = require('../services/eri/EVerificationService');
const refundTrackingService = require('../services/itr/RefundTrackingService');
const dataMatchingService = require('../services/itr/DataMatchingService');
const DiscrepancyResolution = require('../models/DiscrepancyResolution');
const { ITRFiling } = require('../models');
const wsManager = require('../services/websocket/WebSocketManager');
// New ITR-1 JSON Generation Pipeline


const DomainCore = require('../domain/ITRDomainCore');
const itrDraftService = require('../services/itr/ITRDraftService');
const itrComputationService = require('../services/itr/ITRComputationService');
const itrExportService = require('../services/itr/ITRExportService');

/**
 * Normalize ITR type string (uppercase, remove dashes/underscores)
 * @param {string} itrType - ITR type (e.g., 'ITR-1', 'itr1', 'ITR_2')
 * @returns {string|null} Normalized ITR type (e.g., 'ITR1') or null if invalid
 */
function normalizeItrType(itrType) {
  if (!itrType) return null;
  return itrType.toUpperCase().replace(/[-_]/g, '');
}

/**
 * Normalize ITR type for validation engine (lowercase)
 * @param {string} itrType - ITR type
 * @returns {string|null} Normalized ITR type in lowercase
 */
function normalizeItrTypeForValidation(itrType) {
  if (!itrType) return null;
  return itrType.replace(/[-_]/g, '').toLowerCase();
}

class ITRController {
  constructor() {
    this.validationEngine = validationEngine;
    this.taxComputationEngine = taxComputationEngine;
  }

  // =====================================================
  // CREATE DRAFT
  // =====================================================

  async createDraft(req, res) {
    try {
      const userId = req.targetUserId || req.user.userId;
      const correlationId = req.get('x-correlation-id') || null;
      const clientRequestId = req.headers['x-client-request-id'] || null;
      const idempotencyKey = req.headers['x-idempotency-key'] || null;

      const draft = await itrDraftService.createDraft(userId, req.body, { correlationId, clientRequestId });

      if (draft.isExisting) {
        return successResponse(res, { draft: draft.draft }, 'Draft already exists', 200);
      }
      return successResponse(res, { draft }, 'Draft created successfully', 201);
    } catch (error) {
      enterpriseLogger.error('createDraft failed', { error: error.message, userId: req.user?.userId });
      return error.statusCode ? errorResponse(res, error, error.statusCode) : errorResponse(res, error, 500);
    }
  }

  // =====================================================
  // UPDATE DRAFT
  // =====================================================

  async updateDraft(req, res) {
    try {
      const userId = req.targetUserId || req.user.userId;
      const { draftId } = req.params;
      const { formData } = req.body;
      const correlationId = req.get('x-correlation-id') || null;
      const clientRequestId = req.headers['x-client-request-id'] || null;

      if (!formData || typeof formData !== 'object') {
        return validationErrorResponse(res, { formData: 'formData is required and must be an object' });
      }

      const result = await itrDraftService.updateDraft(userId, draftId, formData, { correlationId, clientRequestId });

      return successResponse(res, result, 'Draft updated successfully');
    } catch (error) {
      enterpriseLogger.error('updateDraft failed', { error: error.message, userId: req.user?.userId });
      return error.statusCode ? errorResponse(res, error, error.statusCode) : errorResponse(res, error, 500);
    }
  }

  // =====================================================
  // ITEMIZED DEDUCTIONS (Chapter VI-A) - JSONB-backed
  // =====================================================

  _normalizeDeductionSection(section) {
    const s = String(section || '').trim().toUpperCase();
    // Allow common 80* sections (80C, 80D, 80G, 80TTA, 80TTB, etc.)
    if (!s || s.length > 10 || !/^[0-9A-Z]+$/.test(s)) return null;
    return s;
  }

  _deductionKeyForSection(section) {
    // Store totals in formData.deductions.section80C, section80D, ...
    return `section${section}`;
  }

  _getDeductionLimit(section) {
    const limits = {
      '80C': 150000,
      '80TTA': 10000,
      '80TTB': 50000,
      // 80D is more complex (age/self/parents). We return a conservative default for now.
      '80D': 25000,
    };
    return limits[section] ?? null;
  }

  _extractDeductionAmount(item) {
    if (!item || typeof item !== 'object') return 0;
    const fields = [
      'amount',
      'premiumAmount',
      'donationAmount',
      'interestAmount',
      'rentPaid',
      'contributionAmount',
      'investmentAmount',
      'medicalExpenses',
      'deductionAmount',
    ];
    for (const f of fields) {
      if (item[f] !== undefined && item[f] !== null && item[f] !== '') {
        const n = parseFloat(item[f]);
        if (!Number.isNaN(n)) return Math.max(0, n);
      }
    }
    return 0;
  }

  _extractDeductionAmountForSection(section, item) {
    const s = String(section || '').trim().toUpperCase();
    if (!item || typeof item !== 'object') return 0;

    // Section-specific rules (so totals are meaningful for UI + tax compute)
    if (s === '80CCD') {
      const self = parseFloat(item.selfContribution || 0) || 0;
      const employer = parseFloat(item.employerContribution || 0) || 0;
      return Math.max(0, self + employer);
    }

    if (s === '80E' || s === '80EE' || s === '80EEA') {
      const interest = parseFloat(item.interestPaid || 0) || 0;
      return Math.max(0, interest);
    }

    if (s === '80CCC') {
      const c = parseFloat(item.contributionAmount || 0) || 0;
      return Math.max(0, c);
    }

    if (s === '80GG') {
      const rent = parseFloat(item.rentPaid || item.rentAmount || 0) || 0;
      return Math.max(0, rent);
    }

    if (s === '80DD') {
      const pct = parseFloat(item.disabilityPercentage || 0) || 0;
      if (pct >= 80) return 125000;
      if (pct >= 40) return 75000;
      return 0;
    }

    if (s === '80U') {
      const raw = String(item.disabilityPercentage || '').trim();
      if (raw.includes('80') || raw.includes('80-100')) return 125000;
      if (raw.includes('40') || raw.includes('40-80')) return 75000;
      return 0;
    }

    // Default heuristic
    return this._extractDeductionAmount(item);
  }

  async _getLatestDraftByFilingId(userId, filingId) {
    const q = `
      SELECT d.id, d.data, f.status, f.itr_type
      FROM itr_filings f
      JOIN itr_drafts d ON d.filing_id = f.id
      WHERE f.id = $1 AND f.user_id = $2
      ORDER BY d.updated_at DESC NULLS LAST, d.created_at DESC
      LIMIT 1
    `;
    const result = await dbQuery(q, [filingId, userId]);
    return result.rows?.[0] || null;
  }

  async getDeductions(req, res) {
    try {
      const userId = req.targetUserId || req.user.userId;
      const section = this._normalizeDeductionSection(req.params.section);
      const filingId = req.query.filingId;

      if (!section) {
        return validationErrorResponse(res, { section: 'Invalid deduction section' });
      }
      if (!filingId) {
        return validationErrorResponse(res, { filingId: 'filingId is required' });
      }

      const draftRow = await this._getLatestDraftByFilingId(userId, filingId);
      if (!draftRow) return notFoundResponse(res, 'Draft');

      const formData = draftRow.data ? (typeof draftRow.data === 'string' ? JSON.parse(draftRow.data) : draftRow.data) : {};
      const items = formData?.deductionsItems?.[section] || [];
      const totalAmount = Array.isArray(items) ? items.reduce((sum, it) => sum + this._extractDeductionAmountForSection(String(it?.sectionType || section), it), 0) : 0;

      const limit = this._getDeductionLimit(section);
      const remainingLimit = typeof limit === 'number' ? Math.max(0, limit - totalAmount) : 0;

      return successResponse(res, {
        deductions: Array.isArray(items) ? items : [],
        totalAmount,
        remainingLimit,
        section,
        filingId,
        draftId: draftRow.id,
      }, 'Deductions fetched');
    } catch (error) {
      return errorResponse(res, error, 500);
    }
  }

  async createDeduction(req, res) {
    try {
      const userId = req.targetUserId || req.user.userId;
      const section = this._normalizeDeductionSection(req.params.section);
      const { filingId, ...payload } = req.body || {};

      if (!section) {
        return validationErrorResponse(res, { section: 'Invalid deduction section' });
      }
      if (!filingId) {
        return validationErrorResponse(res, { filingId: 'filingId is required' });
      }

      const draftRow = await this._getLatestDraftByFilingId(userId, filingId);
      if (!draftRow) return notFoundResponse(res, 'Draft');

      if (draftRow.status && ['submitted', 'acknowledged', 'processed'].includes(String(draftRow.status).toLowerCase())) {
        return unauthorizedResponse(res, 'Filing is read-only');
      }

      const formData = draftRow.data ? (typeof draftRow.data === 'string' ? JSON.parse(draftRow.data) : draftRow.data) : {};
      formData.deductionsItems = formData.deductionsItems || {};
      formData.deductions = formData.deductions || {};
      const list = Array.isArray(formData.deductionsItems[section]) ? formData.deductionsItems[section] : [];

      // Extract domain snapshot before mutation
      const domainCore = require('../domain/ITRDomainCore');
      const { getCurrentDomainState } = require('../middleware/domainGuard');
      const prevDomainSnapshot = domainCore.extractDomainSnapshot(formData);
      const currentState = await getCurrentDomainState(filingId);

      const item = {
        id: uuidv4(),
        section,
        ...payload,
        proofs: payload.proofs || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const nextList = [...list, item];
      formData.deductionsItems[section] = nextList;

      const totalsByType = nextList.reduce((acc, it) => {
        const t = String(it?.sectionType || section).trim().toUpperCase();
        acc[t] = (acc[t] || 0) + this._extractDeductionAmountForSection(t, it);
        return acc;
      }, {});
      const totalAmount = nextList.reduce((sum, it) => sum + this._extractDeductionAmountForSection(String(it?.sectionType || section), it), 0);
      // Store combined total under the route section, and per-variant totals when sectionType is used (e.g., 80EE/80EEA)
      formData.deductions[this._deductionKeyForSection(section)] = totalAmount;
      Object.entries(totalsByType).forEach(([t, amt]) => {
        formData.deductions[this._deductionKeyForSection(t)] = amt;
      });

      // Extract domain snapshot after mutation
      const newDomainSnapshot = domainCore.extractDomainSnapshot(formData);

      // Check if recomputation needed
      const needsRecompute = domainCore.shouldRecompute(prevDomainSnapshot, newDomainSnapshot);

      // Optional: Check for rollback (unlikely but possible edge cases)
      const rollbackDecision = domainCore.requiresStateRollback(
        currentState,
        prevDomainSnapshot,
        newDomainSnapshot
      );

      let rollbackApplied = false;
      if (rollbackDecision.required) {
        // Apply rollback (rare case)
        await dbQuery(
          `UPDATE itr_filings SET status = $1, lifecycle_state = $1, tax_computation = NULL, tax_liability = NULL, refund_amount = NULL WHERE id = $2`,
          [rollbackDecision.targetState, filingId]
        );
        enterpriseLogger.info('State rollback triggered by deduction change', {
          filingId,
          fromState: currentState,
          toState: rollbackDecision.targetState,
          reason: rollbackDecision.reason,
          section,
        });
        rollbackApplied = true;
      }

      await dbQuery(
        `UPDATE itr_drafts d
         SET data = $1, updated_at = NOW(), last_saved_at = NOW()
         FROM itr_filings f
         WHERE d.filing_id = f.id AND d.id = $2 AND f.user_id = $3
         RETURNING d.id`,
        [JSON.stringify(formData), draftRow.id, userId],
      );

      // Mark for recomputation if needed
      if (needsRecompute) {
        await dbQuery(
          `UPDATE itr_filings SET needs_recompute = TRUE WHERE id = $1`,
          [filingId]
        );
        enterpriseLogger.info('Deduction changed, recomputation required', {
          draftId: draftRow.id,
          filingId,
          section,
        });
      }

      const limit = this._getDeductionLimit(section);
      const remainingLimit = typeof limit === 'number' ? Math.max(0, limit - totalAmount) : 0;

      return successResponse(res, {
        deduction: item,
        deductions: nextList,
        totalAmount,
        remainingLimit,
        section,
        filingId,
        draftId: draftRow.id,
      }, 'Deduction created', 201);
    } catch (error) {
      return errorResponse(res, error, 500);
    }
  }

  async updateDeduction(req, res) {
    try {
      const userId = req.targetUserId || req.user.userId;
      const section = this._normalizeDeductionSection(req.params.section);
      const { deductionId } = req.params;
      const { filingId, ...payload } = req.body || {};

      if (!section) return validationErrorResponse(res, { section: 'Invalid deduction section' });
      if (!filingId) return validationErrorResponse(res, { filingId: 'filingId is required' });
      if (!deductionId) return validationErrorResponse(res, { deductionId: 'deductionId is required' });

      const draftRow = await this._getLatestDraftByFilingId(userId, filingId);
      if (!draftRow) return notFoundResponse(res, 'Draft');

      if (draftRow.status && ['submitted', 'acknowledged', 'processed'].includes(String(draftRow.status).toLowerCase())) {
        return unauthorizedResponse(res, 'Filing is read-only');
      }

      const formData = draftRow.data ? (typeof draftRow.data === 'string' ? JSON.parse(draftRow.data) : draftRow.data) : {};
      formData.deductionsItems = formData.deductionsItems || {};
      formData.deductions = formData.deductions || {};
      const list = Array.isArray(formData.deductionsItems[section]) ? formData.deductionsItems[section] : [];

      // Extract domain snapshot before mutation
      const domainCore = require('../domain/ITRDomainCore');
      const { getCurrentDomainState } = require('../middleware/domainGuard');
      const prevDomainSnapshot = domainCore.extractDomainSnapshot(formData);
      const currentState = await getCurrentDomainState(filingId);

      const idx = list.findIndex(it => String(it.id) === String(deductionId));
      if (idx === -1) return notFoundResponse(res, 'Deduction');

      const updated = {
        ...list[idx],
        ...payload,
        id: list[idx].id,
        section,
        updatedAt: new Date().toISOString(),
      };

      const nextList = [...list];
      nextList[idx] = updated;
      formData.deductionsItems[section] = nextList;

      const totalsByType = nextList.reduce((acc, it) => {
        const t = String(it?.sectionType || section).trim().toUpperCase();
        acc[t] = (acc[t] || 0) + this._extractDeductionAmountForSection(t, it);
        return acc;
      }, {});
      const totalAmount = nextList.reduce((sum, it) => sum + this._extractDeductionAmountForSection(String(it?.sectionType || section), it), 0);
      formData.deductions[this._deductionKeyForSection(section)] = totalAmount;
      Object.entries(totalsByType).forEach(([t, amt]) => {
        formData.deductions[this._deductionKeyForSection(t)] = amt;
      });

      // Extract domain snapshot after mutation
      const newDomainSnapshot = domainCore.extractDomainSnapshot(formData);

      // Check if recomputation needed
      const needsRecompute = domainCore.shouldRecompute(prevDomainSnapshot, newDomainSnapshot);

      // Optional: Check for rollback (unlikely but possible edge cases)
      const rollbackDecision = domainCore.requiresStateRollback(
        currentState,
        prevDomainSnapshot,
        newDomainSnapshot
      );

      let rollbackApplied = false;
      if (rollbackDecision.required) {
        // Apply rollback (rare case)
        await dbQuery(
          `UPDATE itr_filings SET status = $1, lifecycle_state = $1, tax_computation = NULL, tax_liability = NULL, refund_amount = NULL WHERE id = $2`,
          [rollbackDecision.targetState, filingId]
        );
        enterpriseLogger.info('State rollback triggered by deduction change', {
          filingId,
          fromState: currentState,
          toState: rollbackDecision.targetState,
          reason: rollbackDecision.reason,
          section,
        });
        rollbackApplied = true;
      }

      await dbQuery(
        `UPDATE itr_drafts d
         SET data = $1, updated_at = NOW(), last_saved_at = NOW()
         FROM itr_filings f
         WHERE d.filing_id = f.id AND d.id = $2 AND f.user_id = $3
         RETURNING d.id`,
        [JSON.stringify(formData), draftRow.id, userId],
      );

      // Mark for recomputation if needed
      if (needsRecompute) {
        await dbQuery(
          `UPDATE itr_filings SET needs_recompute = TRUE WHERE id = $1`,
          [filingId]
        );
        enterpriseLogger.info('Deduction changed, recomputation required', {
          draftId: draftRow.id,
          filingId,
          section,
        });
      }

      const limit = this._getDeductionLimit(section);
      const remainingLimit = typeof limit === 'number' ? Math.max(0, limit - totalAmount) : 0;

      return successResponse(res, {
        deduction: updated,
        deductions: nextList,
        totalAmount,
        remainingLimit,
        section,
        filingId,
        draftId: draftRow.id,
      }, 'Deduction updated');
    } catch (error) {
      return errorResponse(res, error, 500);
    }
  }

  async deleteDeduction(req, res) {
    try {
      const userId = req.targetUserId || req.user.userId;
      const section = this._normalizeDeductionSection(req.params.section);
      const { deductionId } = req.params;
      const filingId = req.query.filingId || req.body?.filingId;

      if (!section) return validationErrorResponse(res, { section: 'Invalid deduction section' });
      if (!filingId) return validationErrorResponse(res, { filingId: 'filingId is required' });
      if (!deductionId) return validationErrorResponse(res, { deductionId: 'deductionId is required' });

      const draftRow = await this._getLatestDraftByFilingId(userId, filingId);
      if (!draftRow) return notFoundResponse(res, 'Draft');

      if (draftRow.status && ['submitted', 'acknowledged', 'processed'].includes(String(draftRow.status).toLowerCase())) {
        return unauthorizedResponse(res, 'Filing is read-only');
      }

      const formData = draftRow.data ? (typeof draftRow.data === 'string' ? JSON.parse(draftRow.data) : draftRow.data) : {};
      formData.deductionsItems = formData.deductionsItems || {};
      formData.deductions = formData.deductions || {};
      const list = Array.isArray(formData.deductionsItems[section]) ? formData.deductionsItems[section] : [];

      // Extract domain snapshot before mutation
      const domainCore = require('../domain/ITRDomainCore');
      const { getCurrentDomainState } = require('../middleware/domainGuard');
      const prevDomainSnapshot = domainCore.extractDomainSnapshot(formData);
      const currentState = await getCurrentDomainState(filingId);

      const nextList = list.filter(it => String(it.id) !== String(deductionId));
      if (nextList.length === list.length) return notFoundResponse(res, 'Deduction');

      formData.deductionsItems[section] = nextList;
      const totalsByType = nextList.reduce((acc, it) => {
        const t = String(it?.sectionType || section).trim().toUpperCase();
        acc[t] = (acc[t] || 0) + this._extractDeductionAmountForSection(t, it);
        return acc;
      }, {});
      const totalAmount = nextList.reduce((sum, it) => sum + this._extractDeductionAmountForSection(String(it?.sectionType || section), it), 0);
      formData.deductions[this._deductionKeyForSection(section)] = totalAmount;
      Object.entries(totalsByType).forEach(([t, amt]) => {
        formData.deductions[this._deductionKeyForSection(t)] = amt;
      });

      // Extract domain snapshot after mutation
      const newDomainSnapshot = domainCore.extractDomainSnapshot(formData);

      // Check if recomputation needed
      const needsRecompute = domainCore.shouldRecompute(prevDomainSnapshot, newDomainSnapshot);

      // Optional: Check for rollback (unlikely but possible edge cases)
      const rollbackDecision = domainCore.requiresStateRollback(
        currentState,
        prevDomainSnapshot,
        newDomainSnapshot
      );

      let rollbackApplied = false;
      if (rollbackDecision.required) {
        // Apply rollback (rare case)
        await dbQuery(
          `UPDATE itr_filings SET status = $1, lifecycle_state = $1, tax_computation = NULL, tax_liability = NULL, refund_amount = NULL WHERE id = $2`,
          [rollbackDecision.targetState, filingId]
        );
        enterpriseLogger.info('State rollback triggered by deduction change', {
          filingId,
          fromState: currentState,
          toState: rollbackDecision.targetState,
          reason: rollbackDecision.reason,
          section,
        });
        rollbackApplied = true;
      }

      await dbQuery(
        `UPDATE itr_drafts d
         SET data = $1, updated_at = NOW(), last_saved_at = NOW()
         FROM itr_filings f
         WHERE d.filing_id = f.id AND d.id = $2 AND f.user_id = $3
         RETURNING d.id`,
        [JSON.stringify(formData), draftRow.id, userId],
      );

      // Mark for recomputation if needed
      if (needsRecompute) {
        await dbQuery(
          `UPDATE itr_filings SET needs_recompute = TRUE WHERE id = $1`,
          [filingId]
        );
        enterpriseLogger.info('Deduction changed, recomputation required', {
          draftId: draftRow.id,
          filingId,
          section,
        });
      }

      const limit = this._getDeductionLimit(section);
      const remainingLimit = typeof limit === 'number' ? Math.max(0, limit - totalAmount) : 0;

      return successResponse(res, {
        deductions: nextList,
        totalAmount,
        remainingLimit,
        section,
        filingId,
        draftId: draftRow.id,
      }, 'Deduction deleted');
    } catch (error) {
      return errorResponse(res, error, 500);
    }
  }

  // =====================================================
  // VALIDATE DRAFT
  // =====================================================

  async validateDraft(req, res) {
    try {
      // V4 Migration: Validation is now handled via proper Compute/Domain checks.
      // Returning generic success to maintain UI compatibility until V5.
      const userId = req.targetUserId || req.user.userId;
      const { draftId } = req.params;

      // Basic existence check
      const { ITRFiling } = require('../models');
      const filing = await ITRFiling.findOne({ where: { id: draftId, userId } });
      if (!filing) return notFoundResponse(res, 'Draft');

      return successResponse(res, { valid: true, message: 'Draft is valid (V4 Basic Check)' });
    } catch (error) {
      return errorResponse(res, error, 500);
    }
  }

  // =====================================================
  // COMPUTE TAX
  // =====================================================

  async computeTax(req, res) {
    try {
      const userId = req.targetUserId || req.user.userId;
      const { draftId } = req.params;
      const correlationId = req.get('x-correlation-id') || null;
      const clientRequestId = req.headers['x-client-request-id'] || null;

      const result = await itrComputationService.compute(userId, draftId, { correlationId, clientRequestId });

      return successResponse(res, result.computation, 'Tax computation completed');
    } catch (error) {
      enterpriseLogger.error('computeTax failed', { error: error.message, userId: req.user?.userId });
      return error.statusCode ? errorResponse(res, error, error.statusCode) : errorResponse(res, error, 500);
    }
  }

  // =====================================================
  // SUBMIT ITR
  // =====================================================

  async submitITR(req, res) {
    try {
      const userId = req.targetUserId || req.user.userId;
      const { draftId } = req.params;
      const { verificationMethod, verificationToken } = req.body;

      // V4 Async Submission Pipeline
      const { ITRFiling } = require('../models');
      const SubmissionStateMachine = require('../domain/SubmissionStateMachine');
      const STATES = require('../domain/SubmissionStates');
      const SubmissionWorker = require('../workers/SubmissionWorker');
      const { sequelize } = require('../config/database');

      const result = await sequelize.transaction(async (t) => {
        const filing = await ITRFiling.findOne({
          where: { id: draftId, userId },
          lock: t.LOCK.UPDATE,
          transaction: t
        });

        if (!filing) throw new Error('Filing not found');

        // 1. Transition State (Validates eligibility)
        // Moves from READY_TO_FILE -> ERI_IN_PROGRESS
        // Or from CA_APPROVED -> ERI_IN_PROGRESS
        // For now, assuming direct file flow or post-CA.
        // Force set to ERI_IN_PROGRESS implies we are starting the worker.
        await SubmissionStateMachine.transition(filing, STATES.ERI_IN_PROGRESS);

        filing.verificationMethod = verificationMethod;
        filing.verificationDetails = { token: verificationToken };

        await filing.save({ transaction: t });

        return filing;
      });

      // 2. Trigger Async Worker (Fire & Forget)
      SubmissionWorker.processSubmission(result.id);

      return successResponse(res, {
        filing: result,
        status: 'SUBMISSION_INITIATED',
        message: 'ITR Submission has been queued. Please poll status.'
      }, 'ITR submission initiated successfully');

    } catch (error) {
      enterpriseLogger.error('Submit ITR failed', { error: error.message, stack: error.stack });
      if (error.message === 'Filing not found') return notFoundResponse(res, 'Draft');
      // Handle State Machine Errors
      if (error.code === 'INVALID_TRANSITION') {
        return validationErrorResponse(res, { status: error.message }, 'Invalid State Transition');
      }
      return errorResponse(res, error, 500);
    }
  }

  // =====================================================
  // E-VERIFICATION METHODS
  // =====================================================

  async sendAadhaarOTP(req, res) {
    try {
      const userId = req.targetUserId || req.user.userId;
      const { draftId } = req.params;
      const { aadhaarNumber } = req.body;

      // Get draft and filing info
      const getDraftQuery = `
        SELECT d.id, f.id as filing_id, d.data
        FROM itr_drafts d
        JOIN itr_filings f ON d.filing_id = f.id
        WHERE d.id = $1 AND f.user_id = $2
      `;

      const draft = await dbQuery(getDraftQuery, [draftId, userId]);

      if (draft.rows.length === 0) {
        return notFoundResponse(res, 'Draft');
      }

      let formData = {};
      try {
        formData = draft.rows[0].data ? (typeof draft.rows[0].data === 'string' ? JSON.parse(draft.rows[0].data) : draft.rows[0].data) : {};
      } catch (e) {
        formData = {};
      }
      const pan = formData.personal_info?.pan || formData.personalInfo?.pan || formData.personalInfo?.panNumber || null;

      if (!pan) {
        return validationErrorResponse(res, {
          pan: 'PAN not found in filing data',
        });
      }

      const result = await eVerificationService.sendAadhaarOTP(pan, aadhaarNumber);

      return successResponse(res, result, 'Aadhaar OTP sent successfully');
    } catch (error) {
      enterpriseLogger.error('Send Aadhaar OTP failed', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.userId,
        draftId: req.params.draftId,
      });
      return errorResponse(res, error, error.statusCode || 500);
    }
  }

  async verifyAadhaarOTP(req, res) {
    try {
      const userId = req.targetUserId || req.user.userId;
      const { draftId } = req.params;
      const { aadhaarNumber, otp } = req.body;

      if (!otp || otp.length !== 6) {
        return validationErrorResponse(res, {
          otp: 'Invalid OTP format. OTP must be 6 digits',
        });
      }

      // Get draft and filing info
      const getDraftQuery = `
        SELECT d.id, f.id as filing_id, d.data
        FROM itr_drafts d
        JOIN itr_filings f ON d.filing_id = f.id
        WHERE d.id = $1 AND f.user_id = $2
      `;

      const draft = await dbQuery(getDraftQuery, [draftId, userId]);

      if (draft.rows.length === 0) {
        return notFoundResponse(res, 'Draft');
      }

      let formData = {};
      try {
        formData = draft.rows[0].data ? (typeof draft.rows[0].data === 'string' ? JSON.parse(draft.rows[0].data) : draft.rows[0].data) : {};
      } catch (e) {
        formData = {};
      }
      const pan = formData.personal_info?.pan || formData.personalInfo?.pan || formData.personalInfo?.panNumber || null;
      const filingId = draft.rows[0].filing_id;

      if (!pan) {
        return validationErrorResponse(res, {
          pan: 'PAN not found in filing data',
        });
      }

      const result = await eVerificationService.verifyAadhaarOTP(pan, aadhaarNumber, otp);

      if (result.verified) {
        await eVerificationService.storeVerificationDetails(
          filingId,
          'AADHAAR_OTP',
          result
        );
      }

      return successResponse(res, result, 'Aadhaar OTP verified successfully');
    } catch (error) {
      enterpriseLogger.error('Verify Aadhaar OTP failed', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.userId,
        draftId: req.params.draftId,
      });
      return errorResponse(res, error, error.statusCode || 500);
    }
  }

  async verifyNetBanking(req, res) {
    try {
      const userId = req.targetUserId || req.user.userId;
      const { draftId } = req.params;
      const { bankDetails, credentials } = req.body;

      if (!bankDetails || !credentials) {
        return validationErrorResponse(res, {
          bankDetails: 'Bank details are required',
          credentials: 'Credentials are required',
        }, 'Bank details and credentials are required');
      }

      // Get draft and filing info
      const getDraftQuery = `
        SELECT d.id, f.id as filing_id, d.data
        FROM itr_drafts d
        JOIN itr_filings f ON d.filing_id = f.id
        WHERE d.id = $1 AND f.user_id = $2
      `;

      const draft = await dbQuery(getDraftQuery, [draftId, userId]);

      if (draft.rows.length === 0) {
        return notFoundResponse(res, 'Draft');
      }

      let formData = {};
      try {
        formData = draft.rows[0].data ? (typeof draft.rows[0].data === 'string' ? JSON.parse(draft.rows[0].data) : draft.rows[0].data) : {};
      } catch (e) {
        formData = {};
      }
      const pan = formData.personal_info?.pan || formData.personalInfo?.pan || formData.personalInfo?.panNumber || null;
      const filingId = draft.rows[0].filing_id;

      if (!pan) {
        return validationErrorResponse(res, {
          pan: 'PAN not found in filing data',
        });
      }

      const result = await eVerificationService.verifyNetBanking(pan, bankDetails, credentials);

      if (result.verified) {
        await eVerificationService.storeVerificationDetails(
          filingId,
          'NETBANKING',
          result
        );
      }

      return successResponse(res, result, 'Net Banking verification completed');
    } catch (error) {
      enterpriseLogger.error('Net Banking verification failed', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.userId,
        draftId: req.params.draftId,
      });
      return errorResponse(res, error, error.statusCode || 500);
    }
  }

  async verifyDSC(req, res) {
    try {
      const userId = req.targetUserId || req.user.userId;
      const { draftId } = req.params;
      const { dscDetails } = req.body;

      if (!dscDetails) {
        return validationErrorResponse(res, {
          dscDetails: 'DSC details are required',
        });
      }

      // Get draft and filing info
      const getDraftQuery = `
        SELECT d.id, f.id as filing_id, d.data
        FROM itr_drafts d
        JOIN itr_filings f ON d.filing_id = f.id
        WHERE d.id = $1 AND f.user_id = $2
      `;

      const draft = await dbQuery(getDraftQuery, [draftId, userId]);

      if (draft.rows.length === 0) {
        return notFoundResponse(res, 'Draft');
      }

      let formData = {};
      try {
        formData = draft.rows[0].data ? (typeof draft.rows[0].data === 'string' ? JSON.parse(draft.rows[0].data) : draft.rows[0].data) : {};
      } catch (e) {
        formData = {};
      }
      const pan = formData.personal_info?.pan || formData.personalInfo?.pan || formData.personalInfo?.panNumber || null;
      const filingId = draft.rows[0].filing_id;

      if (!pan) {
        return validationErrorResponse(res, {
          pan: 'PAN not found in filing data',
        });
      }

      const result = await eVerificationService.verifyDSC(pan, dscDetails);

      if (result.verified) {
        await eVerificationService.storeVerificationDetails(
          filingId,
          'DSC',
          result
        );
      }

      return successResponse(res, result, 'DSC verification completed');
    } catch (error) {
      enterpriseLogger.error('DSC verification failed', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.userId,
        draftId: req.params.draftId,
      });
      return errorResponse(res, error, error.statusCode || 500);
    }
  }

  async verifyDemat(req, res) {
    try {
      const userId = req.targetUserId || req.user.userId;
      const { draftId } = req.params;
      const { dematCredentials } = req.body;

      if (!dematCredentials || !dematCredentials.dpId || !dematCredentials.clientId) {
        return validationErrorResponse(res, {
          dpId: 'DP ID is required',
          clientId: 'Client ID is required',
        }, 'DP ID and Client ID are required');
      }

      // Get draft and filing info
      const getDraftQuery = `
        SELECT d.id, f.id as filing_id, d.data
        FROM itr_drafts d
        JOIN itr_filings f ON d.filing_id = f.id
        WHERE d.id = $1 AND f.user_id = $2
      `;

      const draft = await dbQuery(getDraftQuery, [draftId, userId]);

      if (draft.rows.length === 0) {
        return notFoundResponse(res, 'Draft');
      }

      let formData = {};
      try {
        formData = draft.rows[0].data ? (typeof draft.rows[0].data === 'string' ? JSON.parse(draft.rows[0].data) : draft.rows[0].data) : {};
      } catch (e) {
        formData = {};
      }
      const pan = formData.personal_info?.pan || formData.personalInfo?.pan || formData.personalInfo?.panNumber || null;
      const filingId = draft.rows[0].filing_id;

      if (!pan) {
        return validationErrorResponse(res, {
          pan: 'PAN not found in filing data',
        });
      }

      const result = await eVerificationService.verifyDemat(pan, dematCredentials);

      if (result.verified) {
        await eVerificationService.storeVerificationDetails(
          filingId,
          'DEMAT',
          result
        );
      }

      return successResponse(res, result, 'Demat verification completed');
    } catch (error) {
      enterpriseLogger.error('Demat verification failed', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.userId,
        draftId: req.params.draftId,
      });
      return errorResponse(res, error, error.statusCode || 500);
    }
  }

  async sendBankEVC(req, res) {
    try {
      const userId = req.targetUserId || req.user.userId;
      const { draftId } = req.params;
      const { bankDetails } = req.body;

      if (!bankDetails || !bankDetails.accountNumber || !bankDetails.ifsc) {
        return validationErrorResponse(res, {
          accountNumber: 'Account number is required',
          ifsc: 'IFSC code is required',
        }, 'Account number and IFSC code are required');
      }

      // Get draft and filing info
      const getDraftQuery = `
        SELECT d.id, f.id as filing_id, d.data
        FROM itr_drafts d
        JOIN itr_filings f ON d.filing_id = f.id
        WHERE d.id = $1 AND f.user_id = $2
      `;

      const draft = await dbQuery(getDraftQuery, [draftId, userId]);

      if (draft.rows.length === 0) {
        return notFoundResponse(res, 'Draft');
      }

      let formData = {};
      try {
        formData = draft.rows[0].data ? (typeof draft.rows[0].data === 'string' ? JSON.parse(draft.rows[0].data) : draft.rows[0].data) : {};
      } catch (e) {
        formData = {};
      }
      const pan = formData.personal_info?.pan || formData.personalInfo?.pan || formData.personalInfo?.panNumber || null;

      if (!pan) {
        return validationErrorResponse(res, {
          pan: 'PAN not found in filing data',
        });
      }

      const result = await eVerificationService.sendBankEVC(pan, bankDetails);

      return successResponse(res, result, 'Bank EVC sent successfully');
    } catch (error) {
      enterpriseLogger.error('Send Bank EVC failed', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.userId,
        draftId: req.params.draftId,
      });
      return errorResponse(res, error, error.statusCode || 500);
    }
  }

  async verifyBankEVC(req, res) {
    try {
      const userId = req.targetUserId || req.user.userId;
      const { draftId } = req.params;
      const { bankDetails, evc } = req.body;

      if (!evc || evc.length !== 6) {
        return validationErrorResponse(res, {
          evc: 'Invalid EVC format. EVC must be 6 digits',
        });
      }

      if (!bankDetails || !bankDetails.accountNumber || !bankDetails.ifsc) {
        return validationErrorResponse(res, {
          accountNumber: 'Account number is required',
          ifsc: 'IFSC code is required',
        }, 'Account number and IFSC code are required');
      }

      // Get draft and filing info
      const getDraftQuery = `
        SELECT d.id, f.id as filing_id, d.data
        FROM itr_drafts d
        JOIN itr_filings f ON d.filing_id = f.id
        WHERE d.id = $1 AND f.user_id = $2
      `;

      const draft = await dbQuery(getDraftQuery, [draftId, userId]);

      if (draft.rows.length === 0) {
        return notFoundResponse(res, 'Draft');
      }

      let formData = {};
      try {
        formData = draft.rows[0].data ? (typeof draft.rows[0].data === 'string' ? JSON.parse(draft.rows[0].data) : draft.rows[0].data) : {};
      } catch (e) {
        formData = {};
      }
      const pan = formData.personal_info?.pan || formData.personalInfo?.pan || formData.personalInfo?.panNumber || null;
      const filingId = draft.rows[0].filing_id;

      if (!pan) {
        return validationErrorResponse(res, {
          pan: 'PAN not found in filing data',
        });
      }

      const result = await eVerificationService.verifyBankEVC(pan, bankDetails, evc);

      if (result.verified) {
        await eVerificationService.storeVerificationDetails(
          filingId,
          'BANK_EVC',
          result
        );
      }

      return successResponse(res, result, 'Bank EVC verification completed');
    } catch (error) {
      enterpriseLogger.error('Bank EVC verification failed', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.userId,
        draftId: req.params.draftId,
      });
      return errorResponse(res, error, error.statusCode || 500);
    }
  }

  async getVerificationStatus(req, res) {
    try {
      const userId = req.targetUserId || req.user.userId;
      const { filingId } = req.params;

      // Verify filing belongs to user
      const verifyQuery = `
        SELECT id FROM itr_filings WHERE id = $1 AND user_id = $2
      `;
      const verify = await dbQuery(verifyQuery, [filingId, userId]);

      if (verify.rows.length === 0) {
        return notFoundResponse(res, 'Filing');
      }

      const status = await eVerificationService.getVerificationStatus(filingId);

      return successResponse(res, { verification: status }, 'Verification status retrieved successfully');
    } catch (error) {
      enterpriseLogger.error('Get verification status failed', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.userId,
        filingId: req.params.filingId,
      });
      return errorResponse(res, error, error.statusCode || 500);
    }
  }

  // =====================================================
  // GET USER DRAFTS
  // =====================================================

  async getUserDrafts(req, res) {
    try {
      const userId = req.targetUserId || req.user.userId;
      const { status, page = 1, limit = 20 } = req.query;
      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);
      const offset = (pageNum - 1) * limitNum;

      let query = `
        SELECT d.id, d.step, d.is_completed, d.last_saved_at, d.created_at, d.updated_at,
               f.itr_type, f.status, f.assessment_year, f.id as filing_id
        FROM itr_drafts d
        JOIN itr_filings f ON d.filing_id = f.id
        WHERE f.user_id = $1
      `;
      const params = [userId];

      if (status) {
        query += ' AND f.status = $2';
        params.push(status);
      }

      // Get total count for pagination
      const countQuery = query.replace(
        'SELECT d.id, d.step, d.is_completed, d.last_saved_at, d.created_at, d.updated_at,\n               f.itr_type, f.status, f.assessment_year, f.id as filing_id',
        'SELECT COUNT(*) as total'
      );
      const countResult = await dbQuery(countQuery, params);
      const total = parseInt(countResult.rows[0].total, 10);

      query += ' ORDER BY d.created_at DESC';
      query += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limitNum, offset);

      const drafts = await dbQuery(query, params);

      return paginatedResponse(res,
        drafts.rows.map(draft => ({
          id: draft.id,
          filingId: draft.filing_id,
          itrType: draft.itr_type,
          status: draft.status,
          assessmentYear: draft.assessment_year,
          step: draft.step,
          isCompleted: draft.is_completed,
          lastSavedAt: draft.last_saved_at,
          createdAt: draft.created_at,
          updatedAt: draft.updated_at,
        })),
        {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        }
      );
    } catch (error) {
      return errorResponse(res, error, 500);
    }
  }

  // =====================================================
  // GET USER FILINGS
  // =====================================================

  async getUserFilings(req, res) {
    try {
      const userId = req.targetUserId || req.user.userId;
      const userRole = req.user.role || 'END_USER';
      const { status, page = 1, limit = 20 } = req.query;
      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);
      const offset = (pageNum - 1) * limitNum;

      // Get user details for role-based filtering - with eager loading
      const User = require('../models/User');
      const user = await User.findByPk(userId, {
        attributes: ['id', 'role', 'caFirmId'], // Only fetch needed fields
        logging: (msg, timing) => {
          if (timing > 100 || process.env.NODE_ENV === 'development') {
            enterpriseLogger.info('User query executed', {
              duration: `${timing}ms`,
              userId,
            });
          }
        },
      });

      let query = '';
      let params = [];

      // Role-based query construction
      if (userRole === 'END_USER') {
        // END_USER: Own filings + invoice status
        query = `
          SELECT 
            f.id, f.itr_type, f.status, f.submitted_at, f.assessment_year,
            f.created_at, f.updated_at, f.paused_at, f.resumed_at,
            i.id as invoice_id, i.invoice_number, i.status as invoice_status,
            i.payment_status, i.total_amount as invoice_amount, i.due_date
          FROM itr_filings f
          LEFT JOIN invoices i ON f.id = i.filing_id
          WHERE f.user_id = $1
        `;
        params = [userId];
      } else if (['CA', 'CA_FIRM_ADMIN', 'PREPARER', 'REVIEWER'].includes(userRole)) {
        // CA/CA_FIRM: Assigned client filings + review status + billing info
        query = `
          SELECT 
            f.id, f.itr_type, f.status, f.submitted_at, f.assessment_year,
            f.created_at, f.updated_at, f.paused_at, f.review_status,
            f.assigned_to, f.firm_id,
            u.id as client_id, u.full_name as client_name,
            u.pan_number as client_pan,
            assigned_user.full_name as assigned_to_name,
            i.id as invoice_id, i.invoice_number, i.status as invoice_status,
            i.payment_status, i.total_amount as invoice_amount
          FROM itr_filings f
          LEFT JOIN users u ON f.user_id = u.id
          LEFT JOIN users assigned_user ON f.assigned_to = assigned_user.id
          LEFT JOIN invoices i ON f.id = i.filing_id
          WHERE (f.firm_id = $1 OR f.assigned_to = $2)
        `;
        params = [user?.caFirmId || userId, userId];
      } else if (['SUPER_ADMIN', 'PLATFORM_ADMIN'].includes(userRole)) {
        // ADMIN: All filings + platform stats + revenue data
        query = `
          SELECT 
            f.id, f.itr_type, f.status, f.submitted_at, f.assessment_year,
            f.created_at,
            u.id as user_id, u.full_name as user_name, u.email as user_email,
            firm.id as firm_id, firm.name as firm_name,
            i.id as invoice_id, i.invoice_number, i.total_amount as invoice_amount,
            i.status as invoice_status
          FROM itr_filings f
          LEFT JOIN users u ON f.user_id = u.id
          LEFT JOIN ca_firms firm ON f.firm_id = firm.id
          LEFT JOIN invoices i ON f.id = i.filing_id
          WHERE 1=1
        `;
        params = [];
      } else {
        // Default: Own filings only
        query = `
          SELECT id, itr_type, status, submitted_at, assessment_year, created_at, updated_at
          FROM itr_filings 
          WHERE user_id = $1
        `;
        params = [userId];
      }

      if (status) {
        const paramIndex = params.length + 1;
        if (userRole === 'END_USER') {
          query += ` AND f.status = $${paramIndex}`;
        } else if (['CA', 'CA_FIRM_ADMIN', 'PREPARER', 'REVIEWER'].includes(userRole)) {
          query += ` AND f.status = $${paramIndex}`;
        } else if (['SUPER_ADMIN', 'PLATFORM_ADMIN'].includes(userRole)) {
          query += ` AND f.status = $${paramIndex}`;
        } else {
          query += ` AND status = $${paramIndex}`;
        }
        params.push(status);
      }

      // Use appropriate ORDER BY based on query structure
      if (query.includes('FROM itr_filings f') || query.includes('LEFT JOIN')) {
        query += ' ORDER BY f.created_at DESC';
      } else {
        query += ' ORDER BY created_at DESC';
      }

      // Get total count for pagination
      // Remove ORDER BY and LIMIT/OFFSET from count query
      let countQuery = query.replace(
        /SELECT[\s\S]*?FROM/,
        'SELECT COUNT(*) as total FROM'
      );
      // Remove ORDER BY clause from count query
      countQuery = countQuery.replace(/\s+ORDER BY[\s\S]*$/i, '');
      // Remove LIMIT and OFFSET clauses if present
      countQuery = countQuery.replace(/\s+LIMIT[\s\S]*$/i, '');
      const countResult = await dbQuery(countQuery, params);
      const total = parseInt(countResult.rows[0].total, 10);

      // Add pagination
      const paramIndex = params.length + 1;
      query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limitNum, offset);

      const filings = await dbQuery(query, params);

      // Format response based on role
      const formattedFilings = filings.rows.map(filing => {
        const baseFiling = {
          id: filing.id,
          itrType: filing.itr_type,
          status: filing.status,
          submittedAt: filing.submitted_at,
          assessmentYear: filing.assessment_year,
          createdAt: filing.created_at,
          updatedAt: filing.updated_at,
        };

        if (userRole === 'END_USER') {
          return {
            ...baseFiling,
            pausedAt: filing.paused_at,
            resumedAt: filing.resumed_at,
            invoice: filing.invoice_id ? {
              id: filing.invoice_id,
              invoiceNumber: filing.invoice_number,
              status: filing.invoice_status,
              paymentStatus: filing.payment_status,
              amount: filing.invoice_amount,
              dueDate: filing.due_date,
            } : null,
          };
        } else if (['CA', 'CA_FIRM_ADMIN', 'PREPARER', 'REVIEWER'].includes(userRole)) {
          return {
            ...baseFiling,
            pausedAt: filing.paused_at,
            client: {
              id: filing.client_id,
              name: filing.client_name,
              pan: filing.client_pan,
            },
            assignedTo: filing.assigned_to ? {
              id: filing.assigned_to,
              name: filing.assigned_to_name,
            } : null,
            reviewStatus: filing.review_status,
            invoice: filing.invoice_id ? {
              id: filing.invoice_id,
              invoiceNumber: filing.invoice_number,
              status: filing.invoice_status,
              paymentStatus: filing.payment_status,
              amount: filing.invoice_amount,
            } : null,
          };
        } else if (['SUPER_ADMIN', 'PLATFORM_ADMIN'].includes(userRole)) {
          return {
            ...baseFiling,
            user: {
              id: filing.user_id,
              name: filing.user_name,
              email: filing.user_email,
            },
            firm: filing.firm_id ? {
              id: filing.firm_id,
              name: filing.firm_name,
            } : null,
            invoice: filing.invoice_id ? {
              id: filing.invoice_id,
              invoiceNumber: filing.invoice_number,
              amount: filing.invoice_amount,
              status: filing.invoice_status,
            } : null,
          };
        }

        return baseFiling;
      });

      return paginatedResponse(res, formattedFilings, {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      });
    } catch (error) {
      return errorResponse(res, error, 500);
    }
  }

  // =====================================================
  // PAUSE FILING
  // =====================================================

  async pauseFiling(req, res) {
    try {
      const userId = req.targetUserId || req.user.userId;
      const { filingId } = req.params;
      const { reason } = req.body;

      // Get filing
      const getFilingQuery = `
        SELECT id, user_id, status, json_payload
        FROM itr_filings 
        WHERE id = $1 AND user_id = $2
      `;

      const filing = await dbQuery(getFilingQuery, [filingId, userId]);

      if (filing.rows.length === 0) {
        return notFoundResponse(res, 'Filing');
      }

      const filingData = filing.rows[0];

      // Check if filing can be paused
      if (!['draft'].includes(filingData.status)) {
        return validationErrorResponse(res, {
          status: `Filing cannot be paused. Current status: ${filingData.status}`,
        });
      }

      // Save draft before pausing (if jsonPayload exists)
      if (filingData.json_payload) {
        // Draft is already saved in jsonPayload
        enterpriseLogger.info('Draft data preserved before pause', {
          filingId,
          userId,
        });
      }

      // Update filing status to paused
      const pauseQuery = `
        UPDATE itr_filings 
        SET status = 'paused', paused_at = NOW(), pause_reason = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING id, status, paused_at, pause_reason
      `;

      const result = await dbQuery(pauseQuery, [reason || null, filingId]);

      enterpriseLogger.info('Filing paused', {
        filingId,
        userId,
        reason,
        pausedAt: result.rows[0].paused_at,
      });

      return successResponse(res, {
        filing: {
          id: result.rows[0].id,
          status: result.rows[0].status,
          pausedAt: result.rows[0].paused_at,
          pauseReason: result.rows[0].pause_reason,
        },
      }, 'Filing paused successfully');
    } catch (error) {
      enterpriseLogger.error('Pause filing failed', {
        error: error.message,
        userId: req.user?.userId,
        filingId: req.params.filingId,
        stack: error.stack,
      });
      return errorResponse(res, error, 500);
    }
  }

  // =====================================================
  // RESUME FILING
  // =====================================================

  async resumeFiling(req, res) {
    try {
      const userId = req.targetUserId || req.user.userId;
      const { filingId } = req.params;

      // Get filing
      const getFilingQuery = `
        SELECT id, user_id, status, json_payload
        FROM itr_filings 
        WHERE id = $1 AND user_id = $2
      `;

      const filing = await dbQuery(getFilingQuery, [filingId, userId]);

      if (filing.rows.length === 0) {
        return notFoundResponse(res, 'Filing');
      }

      const filingData = filing.rows[0];

      // Check if filing can be resumed
      if (filingData.status !== 'paused') {
        return validationErrorResponse(res, {
          status: `Filing cannot be resumed. Current status: ${filingData.status}`,
        });
      }

      // Update filing status to draft
      const resumeQuery = `
        UPDATE itr_filings 
        SET status = 'draft', resumed_at = NOW(), updated_at = NOW()
        WHERE id = $1
        RETURNING id, status, resumed_at
      `;

      const result = await dbQuery(resumeQuery, [filingId]);

      enterpriseLogger.info('Filing resumed', {
        filingId,
        userId,
        resumedAt: result.rows[0].resumed_at,
      });

      return successResponse(res, {
        filing: {
          id: result.rows[0].id,
          status: result.rows[0].status,
          resumedAt: result.rows[0].resumed_at,
          formData: filingData.json_payload ? JSON.parse(filingData.json_payload) : null,
        },
      }, 'Filing resumed successfully');
    } catch (error) {
      enterpriseLogger.error('Resume filing failed', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.userId,
        filingId: req.params.filingId,
      });
      return errorResponse(res, error, 500);
    }
  }

  // =====================================================
  // REFUND TRACKING METHODS
  // =====================================================

  async getRefundStatus(req, res) {
    try {
      const userId = req.targetUserId || req.user.userId;
      const { filingId } = req.params;

      // Verify filing belongs to user
      const verifyQuery = `
        SELECT id FROM itr_filings WHERE id = $1 AND user_id = $2
      `;
      const verify = await dbQuery(verifyQuery, [filingId, userId]);

      if (verify.rows.length === 0) {
        return notFoundResponse(res, 'Filing');
      }

      const refundStatus = await refundTrackingService.getRefundStatus(filingId);

      return successResponse(res, { refund: refundStatus }, 'Refund status retrieved successfully');
    } catch (error) {
      enterpriseLogger.error('Get refund status failed', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.userId,
        filingId: req.params.filingId,
      });
      return errorResponse(res, error, error.statusCode || 500);
    }
  }

  async getRefundHistory(req, res) {
    try {
      const userId = req.targetUserId || req.user.userId;
      const { assessmentYear } = req.query;

      const refundHistory = await refundTrackingService.getRefundHistory(userId, assessmentYear);

      return successResponse(res, { refunds: refundHistory }, 'Refund history retrieved successfully');
    } catch (error) {
      // If table doesn't exist, return empty array instead of error
      if (error.message && (
        error.message.includes('does not exist') ||
        error.message.includes('relation') ||
        error.message.includes('refund_tracking')
      )) {
        enterpriseLogger.warn('Refund tracking table does not exist, returning empty array', {
          userId: req.user?.userId,
        });
        return successResponse(res, { refunds: [] }, 'Refund history retrieved successfully');
      }

      enterpriseLogger.error('Get refund history failed', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.userId,
      });
      return errorResponse(res, error, error.statusCode || 500);
    }
  }

  async updateRefundBankAccount(req, res) {
    try {
      const userId = req.targetUserId || req.user.userId;
      const { filingId } = req.params;
      const { bankAccount } = req.body;

      if (!bankAccount) {
        return validationErrorResponse(res, {
          bankAccount: 'Bank account details are required',
        });
      }

      // Verify filing belongs to user
      const verifyQuery = `
        SELECT id FROM itr_filings WHERE id = $1 AND user_id = $2
      `;
      const verify = await dbQuery(verifyQuery, [filingId, userId]);

      if (verify.rows.length === 0) {
        return notFoundResponse(res, 'Filing');
      }

      const refundStatus = await refundTrackingService.updateRefundBankAccount(filingId, bankAccount);

      return successResponse(res, { refund: refundStatus }, 'Refund bank account updated successfully');
    } catch (error) {
      enterpriseLogger.error('Update refund bank account failed', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.userId,
        filingId: req.params.filingId,
      });
      return errorResponse(res, error, error.statusCode || 500);
    }
  }

  async requestRefundReissue(req, res) {
    try {
      const userId = req.targetUserId || req.user.userId;
      const { filingId } = req.params;
      const { reason, bankAccount } = req.body;

      // Verify filing belongs to user
      const verifyQuery = `
        SELECT id FROM itr_filings WHERE id = $1 AND user_id = $2
      `;
      const verify = await dbQuery(verifyQuery, [filingId, userId]);

      if (verify.rows.length === 0) {
        return notFoundResponse(res, 'Filing');
      }

      // Update bank account if provided
      if (bankAccount) {
        await refundTrackingService.updateRefundBankAccount(filingId, bankAccount);
      }

      // Update status to processing
      const refundStatus = await refundTrackingService.updateRefundStatus(filingId, 'processing', {
        message: `Refund re-issue requested: ${reason || 'No reason provided'}`,
      });

      enterpriseLogger.info('Refund re-issue requested', {
        filingId,
        userId,
        reason,
      });

      return successResponse(res, { refund: refundStatus }, 'Refund re-issue request submitted successfully');
    } catch (error) {
      enterpriseLogger.error('Request refund reissue failed', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.userId,
        filingId: req.params.filingId,
      });
      return errorResponse(res, error, error.statusCode || 500);
    }
  }

  // =====================================================
  // DISCREPANCY HANDLING METHODS
  // =====================================================

  async getDiscrepancies(req, res) {
    try {
      const userId = req.targetUserId || req.user.userId;
      const { filingId } = req.params;

      // Verify filing belongs to user
      const verifyQuery = `
        SELECT id, json_payload FROM itr_filings WHERE id = $1 AND user_id = $2
      `;
      const verify = await dbQuery(verifyQuery, [filingId, userId]);

      if (verify.rows.length === 0) {
        return notFoundResponse(res, 'Filing');
      }

      const formData = JSON.parse(verify.rows[0].json_payload || '{}');

      // Get uploaded data (would come from document uploads)
      const uploadedData = formData.uploadedData || {};

      // Compare data
      const discrepancies = dataMatchingService.compareData(formData, uploadedData, 'income');

      // Group discrepancies
      const grouped = dataMatchingService.groupDiscrepancies(discrepancies);

      return successResponse(res, {
        discrepancies,
        grouped,
        summary: {
          total: discrepancies.length,
          critical: discrepancies.filter(d => d.severity === 'critical').length,
          warning: discrepancies.filter(d => d.severity === 'warning').length,
          info: discrepancies.filter(d => d.severity === 'info').length,
        },
      }, 'Discrepancies retrieved successfully');
    } catch (error) {
      enterpriseLogger.error('Get discrepancies failed', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.userId,
        filingId: req.params.filingId,
      });
      return errorResponse(res, error, error.statusCode || 500);
    }
  }

  async resolveDiscrepancy(req, res) {
    try {
      const userId = req.targetUserId || req.user.userId;
      const { filingId } = req.params;
      const { discrepancyId, fieldPath, resolutionAction, resolvedValue, explanation } = req.body;

      // Verify filing belongs to user
      const verifyQuery = `
        SELECT id FROM itr_filings WHERE id = $1 AND user_id = $2
      `;
      const verify = await dbQuery(verifyQuery, [filingId, userId]);

      if (verify.rows.length === 0) {
        return notFoundResponse(res, 'Filing');
      }

      // Get discrepancy details (would be passed in request or fetched)
      const discrepancy = req.body.discrepancy || {};

      // Create resolution record
      const resolution = await DiscrepancyResolution.create({
        filingId,
        discrepancyId: discrepancyId || fieldPath,
        fieldPath,
        manualValue: discrepancy.manualValue,
        sourceValue: discrepancy.uploadedValue || discrepancy.sourceValue,
        resolvedValue: resolvedValue || (resolutionAction === 'accept_source' ? discrepancy.uploadedValue : discrepancy.manualValue),
        resolutionAction,
        explanation,
        resolvedBy: userId,
      });

      enterpriseLogger.info('Discrepancy resolved', {
        filingId,
        fieldPath,
        resolutionAction,
        resolvedBy: userId,
      });

      return successResponse(res, { resolution }, 'Discrepancy resolved successfully');
    } catch (error) {
      enterpriseLogger.error('Resolve discrepancy failed', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.userId,
        filingId: req.params.filingId,
      });
      return errorResponse(res, error, error.statusCode || 500);
    }
  }

  async bulkResolveDiscrepancies(req, res) {
    try {
      const userId = req.targetUserId || req.user.userId;
      const { filingId } = req.params;
      const { discrepancyIds, resolutionAction, resolvedValue, explanation } = req.body;

      // Verify filing belongs to user
      const verifyQuery = `
        SELECT id FROM itr_filings WHERE id = $1 AND user_id = $2
      `;
      const verify = await dbQuery(verifyQuery, [filingId, userId]);

      if (verify.rows.length === 0) {
        return notFoundResponse(res, 'Filing');
      }

      // Bulk resolve
      const result = dataMatchingService.bulkResolve(discrepancyIds, resolutionAction, resolvedValue);

      // Create resolution records
      const resolutions = [];
      for (const resolved of result.resolved) {
        const resolution = await DiscrepancyResolution.create({
          filingId,
          discrepancyId: resolved.id,
          fieldPath: resolved.id,
          resolutionAction,
          resolvedValue: resolved.customValue,
          explanation,
          resolvedBy: userId,
        });
        resolutions.push(resolution);
      }

      enterpriseLogger.info('Bulk discrepancies resolved', {
        filingId,
        count: resolutions.length,
        resolvedBy: userId,
      });

      return successResponse(res, {
        resolved: resolutions,
        failed: result.failed,
        totalResolved: result.totalResolved,
      }, 'Discrepancies resolved successfully');
    } catch (error) {
      enterpriseLogger.error('Bulk resolve discrepancies failed', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.userId,
        filingId: req.params.filingId,
      });
      return errorResponse(res, error, error.statusCode || 500);
    }
  }

  async getDiscrepancySuggestions(req, res) {
    try {
      const userId = req.targetUserId || req.user.userId;
      const { filingId } = req.params;

      // Verify filing belongs to user
      const verifyQuery = `
        SELECT id, json_payload FROM itr_filings WHERE id = $1 AND user_id = $2
      `;
      const verify = await dbQuery(verifyQuery, [filingId, userId]);

      if (verify.rows.length === 0) {
        return notFoundResponse(res, 'Filing');
      }

      const formData = JSON.parse(verify.rows[0].json_payload || '{}');
      const uploadedData = formData.uploadedData || {};

      // Get discrepancies
      const discrepancies = dataMatchingService.compareData(formData, uploadedData, 'income');

      // Get suggestions for each discrepancy
      const suggestions = discrepancies.map(discrepancy => ({
        discrepancy,
        suggestion: dataMatchingService.suggestResolution(discrepancy, formData),
      }));

      return successResponse(res, { suggestions }, 'Discrepancy suggestions retrieved successfully');
    } catch (error) {
      enterpriseLogger.error('Get discrepancy suggestions failed', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.userId,
        filingId: req.params.filingId,
      });
      return errorResponse(res, error, error.statusCode || 500);
    }
  }

  async getDiscrepancyHistory(req, res) {
    try {
      const userId = req.targetUserId || req.user.userId;
      const { filingId } = req.params;

      // Verify filing belongs to user
      const verifyQuery = `
        SELECT id FROM itr_filings WHERE id = $1 AND user_id = $2
      `;
      const verify = await dbQuery(verifyQuery, [filingId, userId]);

      if (verify.rows.length === 0) {
        return notFoundResponse(res, 'Filing');
      }

      const history = await dataMatchingService.getDiscrepancyHistory(filingId);

      return successResponse(res, { history }, 'Discrepancy history retrieved successfully');
    } catch (error) {
      enterpriseLogger.error('Get discrepancy history failed', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.userId,
        filingId: req.params.filingId,
      });
      return errorResponse(res, error, error.statusCode || 500);
    }
  }

  // =====================================================
  // PREVIOUS YEAR COPY
  // =====================================================

  /**
   * Get available previous year filings
   * GET /api/itr/previous-years
   */
  async getAvailablePreviousYears(req, res) {
    try {
      const userId = req.targetUserId || req.user.userId;
      const { memberId, currentAssessmentYear } = req.query;

      const previousYearCopyService = require('../services/itr/PreviousYearCopyService');

      const previousYears = await previousYearCopyService.getAvailablePreviousYears(
        userId,
        memberId || null,
        currentAssessmentYear || getDefaultAssessmentYear()
      );

      return successResponse(res, {
        previousYears,
        count: previousYears.length,
      }, 'Available previous years retrieved successfully');
    } catch (error) {
      enterpriseLogger.error('Get available previous years failed', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.userId,
      });
      return errorResponse(res, error, error.statusCode || 500);
    }
  }

  /**
   * Get previous year data for preview
   * GET /api/itr/previous-years/:filingId
   */
  async getPreviousYearData(req, res) {
    try {
      const userId = req.targetUserId || req.user.userId;
      const { filingId } = req.params;

      const previousYearCopyService = require('../services/itr/PreviousYearCopyService');

      // Verify user owns this filing
      const verifyQuery = `
        SELECT user_id FROM itr_filings WHERE id = $1
      `;
      const verifyResult = await dbQuery(verifyQuery, [filingId]);

      if (verifyResult.rows.length === 0) {
        return notFoundResponse(res, 'Previous year filing');
      }

      if (verifyResult.rows[0].user_id !== userId) {
        return unauthorizedResponse(res, 'Unauthorized access to this filing');
      }

      const previousYearData = await previousYearCopyService.getPreviousYearData(filingId);

      return successResponse(res, previousYearData, 'Previous year data retrieved successfully');
    } catch (error) {
      enterpriseLogger.error('Get previous year data failed', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.userId,
        filingId: req.params.filingId,
      });
      return errorResponse(res, error, error.statusCode || 500);
    }
  }

  /**
   * Copy data from previous year to current filing
   * POST /api/itr/filings/:filingId/copy-from-previous
   */
  async copyFromPreviousYear(req, res) {
    try {
      const userId = req.targetUserId || req.user.userId;
      const { filingId } = req.params;
      const { sourceFilingId, sections, reviewData } = req.body;

      // Validate required fields
      if (!sourceFilingId || !sections || !Array.isArray(sections)) {
        return validationErrorResponse(res, {
          sourceFilingId: 'Source filing ID is required',
          sections: 'Sections array is required',
        }, 'Missing required fields: sourceFilingId and sections array');
      }

      // Verify user owns target filing
      const verifyTargetQuery = `
        SELECT user_id, status FROM itr_filings WHERE id = $1
      `;
      const verifyTargetResult = await dbQuery(verifyTargetQuery, [filingId]);

      if (verifyTargetResult.rows.length === 0) {
        return notFoundResponse(res, 'Target filing');
      }

      if (verifyTargetResult.rows[0].user_id !== userId) {
        return unauthorizedResponse(res, 'Unauthorized access to target filing');
      }

      // Check if target filing can be modified
      const targetStatus = verifyTargetResult.rows[0].status;
      if (!['draft', 'paused', 'rejected'].includes(targetStatus)) {
        return validationErrorResponse(res, {
          status: 'Cannot copy to a filing that is already submitted',
        });
      }

      // If source is not 'eri', verify user owns source filing
      if (sourceFilingId !== 'eri') {
        const verifySourceQuery = `
          SELECT user_id FROM itr_filings WHERE id = $1
        `;
        const verifySourceResult = await dbQuery(verifySourceQuery, [sourceFilingId]);

        if (verifySourceResult.rows.length === 0) {
          return notFoundResponse(res, 'Source filing');
        }

        if (verifySourceResult.rows[0].user_id !== userId) {
          return unauthorizedResponse(res, 'Unauthorized access to source filing');
        }
      }

      const previousYearCopyService = require('../services/itr/PreviousYearCopyService');

      const result = await previousYearCopyService.applyCopy(
        filingId,
        sourceFilingId,
        sections,
        reviewData || null
      );

      return successResponse(res, result, 'Data copied successfully');
    } catch (error) {
      enterpriseLogger.error('Copy from previous year failed', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.userId,
        filingId: req.params.filingId,
      });
      return errorResponse(res, error, error.statusCode || 500);
    }
  }

  // =====================================================
  // TAX PAYMENT - CHALLAN GENERATION
  // =====================================================

  /**
   * Generate tax payment challan
   * POST /api/itr/filings/:filingId/taxes-paid/challan
   */
  async generateChallan(req, res) {
    try {
      const userId = req.targetUserId || req.user.userId;
      const { filingId } = req.params;
      const challanData = req.body;

      const taxPaymentService = require('../services/business/TaxPaymentService');

      // Verify user owns this filing
      const verifyQuery = `
        SELECT user_id FROM itr_filings WHERE id = $1
      `;
      const verifyResult = await dbQuery(verifyQuery, [filingId]);

      if (verifyResult.rows.length === 0) {
        return notFoundResponse(res, 'Filing');
      }

      if (verifyResult.rows[0].user_id !== userId) {
        return unauthorizedResponse(res, 'Unauthorized access to filing');
      }

      const result = await taxPaymentService.generateChallan(filingId, challanData);

      return successResponse(res, result, 'Challan generated successfully');
    } catch (error) {
      enterpriseLogger.error('Generate challan failed', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.userId,
        filingId: req.params.filingId,
      });
      return errorResponse(res, error, error.statusCode || 500);
    }
  }

  // =====================================================
  // FOREIGN ASSETS (SCHEDULE FA)
  // =====================================================

  /**
   * Get foreign assets for a filing
   * GET /api/itr/filings/:filingId/foreign-assets
   */
  async getForeignAssets(req, res) {
    try {
      const userId = req.targetUserId || req.user.userId;
      const { filingId } = req.params;

      const ForeignAssetsService = require('../services/itr/ForeignAssetsService');

      // Verify user owns this filing
      const verifyQuery = `
        SELECT user_id, itr_type FROM itr_filings WHERE id = $1
      `;
      const verifyResult = await dbQuery(verifyQuery, [filingId]);

      if (verifyResult.rows.length === 0) {
        return notFoundResponse(res, 'Filing');
      }

      if (verifyResult.rows[0].user_id !== userId) {
        return unauthorizedResponse(res, 'Unauthorized access to filing');
      }

      // Validate ITR type - Foreign Assets are allowed for ITR-2 and ITR-3 (using Domain Core)
      const itrType = verifyResult.rows[0].itr_type;
      const domainCore = require('../domain/ITRDomainCore');
      if (!domainCore.isSectionApplicable(itrType, 'foreignIncome')) {
        return validationErrorResponse(res, {
          itrType: `Foreign assets are not applicable for ${itrType}. This feature is only available for ITR-2 and ITR-3.`,
        });
      }

      const result = await ForeignAssetsService.getForeignAssets(filingId);

      return successResponse(res, result, 'Foreign assets retrieved successfully');
    } catch (error) {
      enterpriseLogger.error('Get foreign assets failed', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.userId,
        filingId: req.params.filingId,
      });
      return errorResponse(res, error, error.statusCode || 500);
    }
  }

  /**
   * Add foreign asset
   * POST /api/itr/filings/:filingId/foreign-assets
   */
  async addForeignAsset(req, res) {
    try {
      const userId = req.targetUserId || req.user.userId;
      const { filingId } = req.params;
      const assetData = req.body;

      const ForeignAssetsService = require('../services/itr/ForeignAssetsService');

      // Verify user owns this filing
      const verifyQuery = `
        SELECT user_id, itr_type FROM itr_filings WHERE id = $1
      `;
      const verifyResult = await dbQuery(verifyQuery, [filingId]);

      if (verifyResult.rows.length === 0) {
        return notFoundResponse(res, 'Filing');
      }

      if (verifyResult.rows[0].user_id !== userId) {
        return unauthorizedResponse(res, 'Unauthorized access to filing');
      }

      // Validate ITR type - Foreign Assets are allowed for ITR-2 and ITR-3 (using Domain Core)
      const itrType = verifyResult.rows[0].itr_type;
      const domainCore = require('../domain/ITRDomainCore');
      if (!domainCore.isSectionApplicable(itrType, 'foreignIncome')) {
        return validationErrorResponse(res, {
          itrType: `Foreign assets are not applicable for ${itrType}. This feature is only available for ITR-2 and ITR-3.`,
        });
      }

      const result = await ForeignAssetsService.addForeignAsset(filingId, userId, assetData);

      return successResponse(res, result, 'Foreign asset added successfully', 201);
    } catch (error) {
      enterpriseLogger.error('Add foreign asset failed', {
        error: error.message,
        userId: req.user?.userId,
        filingId: req.params.filingId,
      });
      return errorResponse(res, error, error.statusCode || 500);
    }
  }

  /**
   * Update foreign asset
   * PUT /api/itr/filings/:filingId/foreign-assets/:assetId
   */
  async updateForeignAsset(req, res) {
    try {
      const userId = req.targetUserId || req.user.userId;
      const { filingId, assetId } = req.params;
      const assetData = req.body;

      const ForeignAssetsService = require('../services/itr/ForeignAssetsService');

      // Verify user owns this filing
      const verifyQuery = `
        SELECT user_id, itr_type FROM itr_filings WHERE id = $1
      `;
      const verifyResult = await dbQuery(verifyQuery, [filingId]);

      if (verifyResult.rows.length === 0) {
        return notFoundResponse(res, 'Filing');
      }

      if (verifyResult.rows[0].user_id !== userId) {
        return unauthorizedResponse(res, 'Unauthorized access to filing');
      }

      // Validate ITR type - Foreign Assets are allowed for ITR-2 and ITR-3 (using Domain Core)
      const itrType = verifyResult.rows[0].itr_type;
      const domainCore = require('../domain/ITRDomainCore');
      if (!domainCore.isSectionApplicable(itrType, 'foreignIncome')) {
        return validationErrorResponse(res, {
          itrType: `Foreign assets are not applicable for ${itrType}. This feature is only available for ITR-2 and ITR-3.`,
        });
      }

      const result = await ForeignAssetsService.updateForeignAsset(assetId, userId, assetData);

      return successResponse(res, result, 'Foreign asset updated successfully');
    } catch (error) {
      enterpriseLogger.error('Update foreign asset failed', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.userId,
        filingId: req.params.filingId,
        assetId: req.params.assetId,
      });
      return errorResponse(res, error, error.statusCode || 500);
    }
  }

  /**
   * Delete foreign asset
   * DELETE /api/itr/filings/:filingId/foreign-assets/:assetId
   */
  async deleteForeignAsset(req, res) {
    try {
      const userId = req.targetUserId || req.user.userId;
      const { filingId, assetId } = req.params;

      const ForeignAssetsService = require('../services/itr/ForeignAssetsService');

      // Verify user owns this filing
      const verifyQuery = `
        SELECT user_id, itr_type FROM itr_filings WHERE id = $1
      `;
      const verifyResult = await dbQuery(verifyQuery, [filingId]);

      if (verifyResult.rows.length === 0) {
        return notFoundResponse(res, 'Filing');
      }

      if (verifyResult.rows[0].user_id !== userId) {
        return unauthorizedResponse(res, 'Unauthorized access to filing');
      }

      // Validate ITR type - Foreign Assets are allowed for ITR-2 and ITR-3 (using Domain Core)
      const itrType = verifyResult.rows[0].itr_type;
      const domainCore = require('../domain/ITRDomainCore');
      if (!domainCore.isSectionApplicable(itrType, 'foreignIncome')) {
        return validationErrorResponse(res, {
          itrType: `Foreign assets are not applicable for ${itrType}. This feature is only available for ITR-2 and ITR-3.`,
        });
      }

      const result = await ForeignAssetsService.deleteForeignAsset(assetId, userId);

      return successResponse(res, result, 'Foreign asset deleted successfully');
    } catch (error) {
      enterpriseLogger.error('Delete foreign asset failed', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.userId,
        filingId: req.params.filingId,
        assetId: req.params.assetId,
      });
      return errorResponse(res, error, error.statusCode || 500);
    }
  }

  /**
   * Upload foreign asset document
   * POST /api/itr/filings/:filingId/foreign-assets/:assetId/documents
   */
  async uploadForeignAssetDocument(req, res) {
    try {
      const userId = req.targetUserId || req.user.userId;
      const { filingId, assetId } = req.params;
      const { documentUrl, documentType } = req.body;

      const ForeignAsset = require('../models/ForeignAsset');

      // Verify user owns this filing
      const verifyQuery = `
        SELECT user_id FROM itr_filings WHERE id = $1
      `;
      const verifyResult = await dbQuery(verifyQuery, [filingId]);

      if (verifyResult.rows.length === 0) {
        return notFoundResponse(res, 'Filing');
      }

      if (verifyResult.rows[0].user_id !== userId) {
        return unauthorizedResponse(res, 'Unauthorized access to filing');
      }

      // Get asset and verify ownership
      const asset = await ForeignAsset.findByPk(assetId);
      if (!asset || asset.filingId !== filingId) {
        return notFoundResponse(res, 'Foreign asset');
      }

      if (asset.userId !== userId) {
        return unauthorizedResponse(res, 'Unauthorized access to asset');
      }

      // Add document
      await asset.addDocument(documentUrl, documentType);

      return successResponse(res, {
        asset: {
          id: asset.id,
          supportingDocuments: asset.supportingDocuments,
        },
      }, 'Document uploaded successfully');
    } catch (error) {
      enterpriseLogger.error('Upload foreign asset document failed', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.userId,
        filingId: req.params.filingId,
        assetId: req.params.assetId,
      });
      return errorResponse(res, error, error.statusCode || 500);
    }
  }

  // =====================================================
  // TAX SIMULATION (WHAT-IF ANALYSIS)
  // =====================================================

  /**
   * Simulate tax scenario
   * POST /api/itr/filings/:filingId/simulate
   */
  async simulateTaxScenario(req, res) {
    try {
      const userId = req.targetUserId || req.user.userId;
      const { filingId } = req.params;
      const { scenario, baseFormData } = req.body;

      const TaxSimulationService = require('../services/itr/TaxSimulationService');

      // Verify user owns this filing
      const verifyQuery = `
        SELECT user_id FROM itr_filings WHERE id = $1
      `;
      const verifyResult = await dbQuery(verifyQuery, [filingId]);

      if (verifyResult.rows.length === 0) {
        return notFoundResponse(res, 'Filing');
      }

      if (verifyResult.rows[0].user_id !== userId) {
        return unauthorizedResponse(res, 'Unauthorized access to filing');
      }

      const result = await TaxSimulationService.simulateScenario(filingId, scenario);

      return successResponse(res, result, 'Tax scenario simulated successfully');
    } catch (error) {
      enterpriseLogger.error('Simulate tax scenario failed', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.userId,
        filingId: req.params.filingId,
      });
      return errorResponse(res, error, error.statusCode || 500);
    }
  }

  /**
   * Compare multiple scenarios
   * POST /api/itr/filings/:filingId/compare-scenarios
   */
  async compareScenarios(req, res) {
    try {
      const userId = req.targetUserId || req.user.userId;
      const { filingId } = req.params;
      const { scenarios } = req.body;

      const TaxSimulationService = require('../services/itr/TaxSimulationService');

      // Verify user owns this filing
      const verifyQuery = `
        SELECT user_id FROM itr_filings WHERE id = $1
      `;
      const verifyResult = await dbQuery(verifyQuery, [filingId]);

      if (verifyResult.rows.length === 0) {
        return notFoundResponse(res, 'Filing');
      }

      if (verifyResult.rows[0].user_id !== userId) {
        return unauthorizedResponse(res, 'Unauthorized access to filing');
      }

      const result = await TaxSimulationService.compareScenarios(filingId, scenarios);

      return successResponse(res, result, 'Scenarios compared successfully');
    } catch (error) {
      enterpriseLogger.error('Compare scenarios failed', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.userId,
        filingId: req.params.filingId,
      });
      return errorResponse(res, error, error.statusCode || 500);
    }
  }

  /**
   * Apply simulation to actual filing
   * POST /api/itr/filings/:filingId/apply-simulation
   */
  async applySimulation(req, res) {
    try {
      const userId = req.targetUserId || req.user.userId;
      const { filingId } = req.params;
      const { scenarioId, changes } = req.body;

      const TaxSimulationService = require('../services/itr/TaxSimulationService');

      // Verify user owns this filing
      const verifyQuery = `
        SELECT user_id FROM itr_filings WHERE id = $1
      `;
      const verifyResult = await dbQuery(verifyQuery, [filingId]);

      if (verifyResult.rows.length === 0) {
        return notFoundResponse(res, 'Filing');
      }

      if (verifyResult.rows[0].user_id !== userId) {
        return unauthorizedResponse(res, 'Unauthorized access to filing');
      }

      const result = await TaxSimulationService.applySimulation(filingId, scenarioId, changes);

      return successResponse(res, result, 'Simulation applied successfully');
    } catch (error) {
      enterpriseLogger.error('Apply simulation failed', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.userId,
        filingId: req.params.filingId,
      });
      return errorResponse(res, error, error.statusCode || 500);
    }
  }

  /**
   * Get optimization opportunities
   * GET /api/itr/filings/:filingId/optimization-opportunities
   */
  async getOptimizationOpportunities(req, res) {
    try {
      const userId = req.targetUserId || req.user.userId;
      const { filingId } = req.params;

      const TaxSimulationService = require('../services/itr/TaxSimulationService');
      const ITRFiling = require('../models/ITRFiling');

      // Verify user owns this filing
      const verifyQuery = `
        SELECT user_id FROM itr_filings WHERE id = $1
      `;
      const verifyResult = await dbQuery(verifyQuery, [filingId]);

      if (verifyResult.rows.length === 0) {
        return notFoundResponse(res, 'Filing');
      }

      if (verifyResult.rows[0].user_id !== userId) {
        return unauthorizedResponse(res, 'Unauthorized access to filing');
      }

      // Get filing data
      const filing = await ITRFiling.findByPk(filingId);
      const formData = filing.jsonPayload || {};
      const itrType = filing.itrType || 'ITR-1';

      const result = await TaxSimulationService.getOptimizationOpportunities(formData, itrType);

      return successResponse(res, result, 'Optimization opportunities retrieved successfully');
    } catch (error) {
      enterpriseLogger.error('Get optimization opportunities failed', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.userId,
        filingId: req.params.filingId,
      });
      return errorResponse(res, error, error.statusCode || 500);
    }
  }

  // =====================================================
  // PDF EXPORT
  // =====================================================

  /**
   * Export draft as PDF
   * GET /api/itr/drafts/:draftId/export/pdf
   */
  async exportDraftPDF(req, res) {
    try {
      const userId = req.targetUserId || req.user.userId;
      const { draftId } = req.params;

      const PDFGenerationService = require('../services/core/PDFGenerationService');
      const ITRFiling = require('../models/ITRFiling');
      const Draft = require('../models/Draft');

      // Get draft
      const draft = await Draft.findByPk(draftId);
      if (!draft) {
        return notFoundResponse(res, 'Draft');
      }

      // Verify user owns this draft
      const filing = await ITRFiling.findByPk(draft.filingId);
      if (!filing || filing.userId !== userId) {
        return unauthorizedResponse(res, 'Unauthorized access to draft');
      }

      const formData = draft.formData || draft.data || {};
      const itrType = filing.itrType || formData.itrType || 'ITR-1';

      // Get tax computation if available
      let taxComputation = null;
      try {
        const TaxComputationEngine = require('../services/core/TaxComputationEngine');
        const filingData = { ...formData, itrType };
        taxComputation = await TaxComputationEngine.computeTax(
          filingData,
          formData.assessmentYear || getDefaultAssessmentYear(),
          filing.assessmentYear || getDefaultAssessmentYear()
        );
      } catch (error) {
        enterpriseLogger.warn('Could not compute tax for PDF', { error: error.message });
      }

      // Generate PDF
      const pdfBuffer = await PDFGenerationService.generateITRDraftPDF(
        draft.filingId || draftId,
        formData,
        taxComputation
      );

      // Set response headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="itr-draft-${draftId}.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length);

      res.send(pdfBuffer);
    } catch (error) {
      enterpriseLogger.error('Export draft PDF failed', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.userId,
        draftId: req.params.draftId,
      });
      return errorResponse(res, error, error.statusCode || 500);
    }
  }

  /**
   * Export tax computation as PDF
   * GET /api/itr/filings/:filingId/tax-computation/pdf
   */
  async exportTaxComputationPDF(req, res) {
    try {
      const userId = req.targetUserId || req.user.userId;
      const { filingId } = req.params;

      const PDFGenerationService = require('../services/core/PDFGenerationService');
      const ITRFiling = require('../models/ITRFiling');
      const TaxComputationEngine = require('../services/core/TaxComputationEngine');

      // Verify user owns this filing
      const verifyQuery = `
        SELECT user_id FROM itr_filings WHERE id = $1
      `;
      const verifyResult = await dbQuery(verifyQuery, [filingId]);

      if (verifyResult.rows.length === 0) {
        return notFoundResponse(res, 'Filing');
      }

      if (verifyResult.rows[0].user_id !== userId) {
        return unauthorizedResponse(res, 'Unauthorized access to filing');
      }

      // Get filing data
      const filing = await ITRFiling.findByPk(filingId);
      const formData = filing.jsonPayload || {};
      const itrType = filing.itrType || 'ITR-1';
      const assessmentYear = filing.assessmentYear || getDefaultAssessmentYear();

      // Compute tax
      const filingData = { ...formData, itrType };
      const taxComputation = await TaxComputationEngine.computeTax(
        filingData,
        assessmentYear
      );

      // Generate PDF
      const pdfBuffer = await PDFGenerationService.generateTaxComputationPDF(
        taxComputation,
        formData
      );

      // Set response headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="tax-computation-${filingId}.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length);

      res.send(pdfBuffer);
    } catch (error) {
      enterpriseLogger.error('Export tax computation PDF failed', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.userId,
        filingId: req.params.filingId,
      });
      return errorResponse(res, error, error.statusCode || 500);
    }
  }

  /**
   * Export discrepancy report as PDF
   * GET /api/itr/filings/:filingId/discrepancies/pdf
   */
  async exportDiscrepancyPDF(req, res) {
    try {
      const userId = req.targetUserId || req.user.userId;
      const { filingId } = req.params;

      const PDFGenerationService = require('../services/core/PDFGenerationService');
      const DiscrepancyService = require('../services/itr/DiscrepancyService');

      // Verify user owns this filing
      const verifyQuery = `
        SELECT user_id FROM itr_filings WHERE id = $1
      `;
      const verifyResult = await dbQuery(verifyQuery, [filingId]);

      if (verifyResult.rows.length === 0) {
        return notFoundResponse(res, 'Filing');
      }

      if (verifyResult.rows[0].user_id !== userId) {
        return unauthorizedResponse(res, 'Unauthorized access to filing');
      }

      // Get discrepancies
      const discrepancies = await DiscrepancyService.getDiscrepancies(filingId, userId);

      // Generate PDF
      const pdfBuffer = await PDFGenerationService.generateDiscrepancyReportPDF(
        discrepancies.discrepancies || [],
        filingId
      );

      // Set response headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="discrepancy-report-${filingId}.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length);

      res.send(pdfBuffer);
    } catch (error) {
      enterpriseLogger.error('Export discrepancy PDF failed', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.userId,
        filingId: req.params.filingId,
      });
      return errorResponse(res, error, error.statusCode || 500);
    }
  }

  /**
   * Send discrepancy report via email
   * POST /api/itr/filings/:filingId/discrepancies/email
   */
  async sendDiscrepancyReportEmail(req, res) {
    try {
      const userId = req.targetUserId || req.user.userId;
      const { filingId } = req.params;
      const { email } = req.body;

      if (!email) {
        return validationErrorResponse(res, {
          email: 'Email address is required',
        });
      }

      const EmailService = require('../services/integration/EmailService');
      const DiscrepancyService = require('../services/itr/DiscrepancyService');

      // Verify user owns this filing
      const verifyQuery = `
        SELECT user_id FROM itr_filings WHERE id = $1
      `;
      const verifyResult = await dbQuery(verifyQuery, [filingId]);

      if (verifyResult.rows.length === 0) {
        return notFoundResponse(res, 'Filing');
      }

      if (verifyResult.rows[0].user_id !== userId) {
        return unauthorizedResponse(res, 'Unauthorized access to filing');
      }

      // Get discrepancies
      const discrepancies = await DiscrepancyService.getDiscrepancies(filingId, userId);
      const discrepancyList = discrepancies.discrepancies || [];

      // Generate report URL
      const reportUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/filings/${filingId}/discrepancies`;

      // Send email
      await EmailService.sendDiscrepancyReportEmail(email, filingId, discrepancyList, reportUrl);

      enterpriseLogger.info('Discrepancy report email sent', {
        userId,
        filingId,
        email,
        discrepancyCount: discrepancyList.length,
      });

      return successResponse(res, null, 'Discrepancy report email sent successfully');
    } catch (error) {
      enterpriseLogger.error('Send discrepancy report email failed', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.userId,
        filingId: req.params.filingId,
      });
      return errorResponse(res, error, error.statusCode || 500);
    }
  }

  /**
   * Share draft with CA or another user for review
   * POST /api/itr/drafts/:filingId/share
   */
  async shareDraft(req, res) {
    try {
      const userId = req.targetUserId || req.user.userId;
      const { filingId } = req.params;
      const { recipientEmail, caEmail, message } = req.body;
      const email = recipientEmail || caEmail; // Support both field names

      if (!email) {
        return validationErrorResponse(res, {
          email: 'Recipient email is required',
        });
      }

      const EmailService = require('../services/integration/EmailService');
      const User = require('../models/User');

      // Verify user owns this filing
      const verifyQuery = `
        SELECT user_id, itr_type, assessment_year FROM itr_filings WHERE id = $1
      `;
      const verifyResult = await dbQuery(verifyQuery, [filingId]);

      if (verifyResult.rows.length === 0) {
        return notFoundResponse(res, 'Filing');
      }

      if (verifyResult.rows[0].user_id !== userId) {
        return unauthorizedResponse(res, 'Unauthorized access to filing');
      }

      // Get sharer details
      const sharer = await User.findByPk(userId);
      if (!sharer) {
        return notFoundResponse(res, 'User');
      }

      // Generate secure share token
      const { generateShareToken } = require('../utils/tokenGenerator');
      const shareToken = generateShareToken(filingId, userId, 168); // 7 days expiration
      const shareLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/filing/${filingId}/review?token=${shareToken}`;

      // Send email notification
      await EmailService.sendDraftSharingEmail(
        recipientEmail,
        filingId,
        sharer.fullName || sharer.email,
        shareLink
      );

      enterpriseLogger.info('Draft shared successfully', {
        userId,
        filingId,
        recipientEmail: email,
        shareLink,
      });

      return successResponse(res, { shareLink }, 'Draft shared successfully');
    } catch (error) {
      enterpriseLogger.error('Share draft failed', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.userId,
        filingId: req.params.filingId,
      });
      return errorResponse(res, error, error.statusCode || 500);
    }
  }

  // =====================================================
  // INCOME ENDPOINTS
  // =====================================================

  /**
   * Get house property income
   * GET /api/itr/filings/:filingId/income/house-property
   */
  async getHouseProperty(req, res) {
    try {
      const userId = req.targetUserId || req.user.userId;
      const { filingId } = req.params;

      const verifyQuery = `SELECT user_id, itr_type, json_payload FROM itr_filings WHERE id = $1`;
      const verifyResult = await dbQuery(verifyQuery, [filingId]);

      if (verifyResult.rows.length === 0) {
        return notFoundResponse(res, 'Filing');
      }

      if (verifyResult.rows[0].user_id !== userId) {
        return unauthorizedResponse(res, 'Unauthorized access to filing');
      }

      // Validate ITR type - House Property is allowed for ITR-1 and ITR-2
      const itrType = verifyResult.rows[0].itr_type;
      if (itrType !== 'ITR-1' && itrType !== 'ITR1' && itrType !== 'ITR-2' && itrType !== 'ITR2') {
        return validationErrorResponse(res, {
          itrType: `House property income is not applicable for ${itrType}. This income type is only available for ITR-1 and ITR-2.`,
        });
      }

      const jsonPayload = verifyResult.rows[0].json_payload || {};
      const houseProperty = jsonPayload.income?.houseProperty || { properties: [] };

      return successResponse(res, {
        properties: houseProperty.properties || [],
        totalIncome: houseProperty.totalIncome || 0,
        totalLoss: houseProperty.totalLoss || 0,
      }, 'House property retrieved successfully');
    } catch (error) {
      enterpriseLogger.error('Get house property failed', { error: error.message, stack: error.stack });
      return errorResponse(res, error, 500);
    }
  }

  /**
   * Update house property income
   * PUT /api/itr/filings/:filingId/income/house-property
   */
  async updateHouseProperty(req, res) {
    try {
      const userId = req.targetUserId || req.user.userId;
      const { filingId } = req.params;
      const housePropertyData = req.body;

      const verifyQuery = `SELECT user_id, itr_type, json_payload FROM itr_filings WHERE id = $1`;
      const verifyResult = await dbQuery(verifyQuery, [filingId]);

      if (verifyResult.rows.length === 0) {
        return notFoundResponse(res, 'Filing');
      }

      if (verifyResult.rows[0].user_id !== userId) {
        return unauthorizedResponse(res, 'Unauthorized access to filing');
      }

      // Validate ITR type - House Property is allowed for ITR-1 and ITR-2
      const itrType = verifyResult.rows[0].itr_type;
      if (itrType !== 'ITR-1' && itrType !== 'ITR1' && itrType !== 'ITR-2' && itrType !== 'ITR2') {
        return validationErrorResponse(res, {
          itrType: `House property income is not applicable for ${itrType}. This income type is only available for ITR-1 and ITR-2.`,
        });
      }

      const jsonPayload = verifyResult.rows[0].json_payload || {};
      if (!jsonPayload.income) jsonPayload.income = {};
      jsonPayload.income.houseProperty = housePropertyData;

      const updateQuery = `UPDATE itr_filings SET json_payload = $1, updated_at = NOW() WHERE id = $2`;
      await dbQuery(updateQuery, [JSON.stringify(jsonPayload), filingId]);

      return successResponse(res, null, 'House property updated successfully');
    } catch (error) {
      enterpriseLogger.error('Update house property failed', { error: error.message, stack: error.stack });
      return errorResponse(res, error, 500);
    }
  }

  /**
   * Get capital gains income
   * GET /api/itr/filings/:filingId/income/capital-gains
   */
  async getCapitalGains(req, res) {
    try {
      const userId = req.targetUserId || req.user.userId;
      const { filingId } = req.params;

      const verifyQuery = `SELECT user_id, itr_type, json_payload FROM itr_filings WHERE id = $1`;
      const verifyResult = await dbQuery(verifyQuery, [filingId]);

      if (verifyResult.rows.length === 0) {
        return notFoundResponse(res, 'Filing');
      }

      if (verifyResult.rows[0].user_id !== userId) {
        return unauthorizedResponse(res, 'Unauthorized access to filing');
      }

      // Validate ITR type - Capital Gains is only allowed for ITR-2 (using Domain Core)
      const itrType = verifyResult.rows[0].itr_type;
      const domainCore = require('../domain/ITRDomainCore');
      // Capital gains is part of income section, but only ITR-2 explicitly supports it
      // For now, we check if income section is applicable (ITR-2 has income section)
      // In future, we can add a more specific check for capital gains
      if (!domainCore.isSectionApplicable(itrType, 'income')) {
        return validationErrorResponse(res, {
          itrType: `Capital gains income is not applicable for ${itrType}. This income type is only available for ITR-2.`,
        });
      }

      const jsonPayload = verifyResult.rows[0].json_payload || {};
      const capitalGains = jsonPayload.income?.capitalGains || {
        hasCapitalGains: false,
        stcgDetails: [],
        ltcgDetails: [],
      };

      return successResponse(res, {
        ...capitalGains,
        totalSTCG: capitalGains.stcgDetails?.reduce((sum, e) => sum + (e.gainAmount || 0), 0) || 0,
        totalLTCG: capitalGains.ltcgDetails?.reduce((sum, e) => sum + (e.gainAmount || 0), 0) || 0,
      }, 'Capital gains retrieved successfully');
    } catch (error) {
      enterpriseLogger.error('Get capital gains failed', { error: error.message, stack: error.stack });
      return errorResponse(res, error, 500);
    }
  }

  /**
   * Update capital gains income
   * PUT /api/itr/filings/:filingId/income/capital-gains
   */
  async updateCapitalGains(req, res) {
    try {
      const userId = req.targetUserId || req.user.userId;
      const { filingId } = req.params;
      const capitalGainsData = req.body;

      const verifyQuery = `SELECT user_id, itr_type, json_payload FROM itr_filings WHERE id = $1`;
      const verifyResult = await dbQuery(verifyQuery, [filingId]);

      if (verifyResult.rows.length === 0) {
        return notFoundResponse(res, 'Filing');
      }

      if (verifyResult.rows[0].user_id !== userId) {
        return unauthorizedResponse(res, 'Unauthorized access to filing');
      }

      // Validate ITR type - Capital Gains is only allowed for ITR-2 (using Domain Core)
      const itrType = verifyResult.rows[0].itr_type;
      const domainCore = require('../domain/ITRDomainCore');
      // Capital gains is part of income section, but only ITR-2 explicitly supports it
      // For now, we check if income section is applicable (ITR-2 has income section)
      // In future, we can add a more specific check for capital gains
      if (!domainCore.isSectionApplicable(itrType, 'income')) {
        return validationErrorResponse(res, {
          itrType: `Capital gains income is not applicable for ${itrType}. This income type is only available for ITR-2.`,
        });
      }

      const jsonPayload = verifyResult.rows[0].json_payload || {};
      if (!jsonPayload.income) jsonPayload.income = {};
      jsonPayload.income.capitalGains = capitalGainsData;

      const updateQuery = `UPDATE itr_filings SET json_payload = $1, updated_at = NOW() WHERE id = $2`;
      await dbQuery(updateQuery, [JSON.stringify(jsonPayload), filingId]);

      return successResponse(res, null, 'Capital gains updated successfully');
    } catch (error) {
      enterpriseLogger.error('Update capital gains failed', { error: error.message, stack: error.stack });
      return errorResponse(res, error, 500);
    }
  }

  /**
   * Get AIS rental income data
   * GET /api/itr/filings/:filingId/ais/rental-income
   */
  async getAISRentalIncome(req, res) {
    try {
      const userId = req.targetUserId || req.user.userId;
      const { filingId } = req.params;
      const { assessmentYear = getDefaultAssessmentYear() } = req.query;

      const verifyQuery = `SELECT user_id, json_payload, assessment_year FROM itr_filings WHERE id = $1`;
      const verifyResult = await dbQuery(verifyQuery, [filingId]);

      if (verifyResult.rows.length === 0) {
        return notFoundResponse(res, 'Filing');
      }

      if (verifyResult.rows[0].user_id !== userId) {
        return unauthorizedResponse(res, 'Unauthorized access to filing');
      }

      // Get user PAN from personal info
      const jsonPayload = verifyResult.rows[0].json_payload || {};
      const personalInfo = jsonPayload.personalInfo || {};
      const pan = personalInfo.panNumber || personalInfo.pan;

      if (!pan) {
        return validationErrorResponse(res, {
          pan: 'PAN number is required to fetch AIS data. Please complete personal information first.',
        });
      }

      // Get assessment year from filing (use database value if available, otherwise use query param)
      const filingAssessmentYear = verifyResult.rows[0].assessment_year || assessmentYear;

      // Fetch AIS rental income using AIS service
      const AISService = require('../services/integration/AISService');
      let rentalIncome = [];
      let source = 'manual';

      try {
        rentalIncome = await AISService.getRentalIncome(pan, filingAssessmentYear);
        source = 'ais';
      } catch (error) {
        enterpriseLogger.warn('AIS rental income fetch failed, using stored data', {
          filingId,
          error: error.message,
        });
        // Fallback to stored AIS data if available
        const aisData = jsonPayload.aisData || {};
        rentalIncome = aisData.rentalIncome || [];
        source = 'stored_ais';
      }

      return successResponse(res, {
        rentalIncome: rentalIncome,
        summary: {
          totalRentalIncome: rentalIncome.reduce((sum, r) => sum + (r.amount || 0), 0),
          properties: rentalIncome.length,
        },
        source: source,
        fetchedAt: new Date().toISOString(),
      }, 'AIS rental income retrieved successfully');
    } catch (error) {
      enterpriseLogger.error('Get AIS rental income failed', { error: error.message, stack: error.stack });
      return errorResponse(res, error, 500);
    }
  }

  /**
   * Apply AIS rental income data to house property form
   * POST /api/itr/filings/:filingId/income/house-property/apply-ais
   */
  async applyAISRentalIncome(req, res) {
    try {
      const userId = req.targetUserId || req.user.userId;
      const { filingId } = req.params;
      const { properties } = req.body;

      const verifyQuery = `SELECT user_id, json_payload FROM itr_filings WHERE id = $1`;
      const verifyResult = await dbQuery(verifyQuery, [filingId]);

      if (verifyResult.rows.length === 0) {
        return notFoundResponse(res, 'Filing');
      }

      if (verifyResult.rows[0].user_id !== userId) {
        return unauthorizedResponse(res, 'Unauthorized access to filing');
      }

      const jsonPayload = verifyResult.rows[0].json_payload || {};
      if (!jsonPayload.income) jsonPayload.income = {};
      if (!jsonPayload.income.houseProperty) jsonPayload.income.houseProperty = { properties: [] };

      // Merge AIS properties with existing properties
      const existingProperties = jsonPayload.income.houseProperty.properties || [];
      const mergedProperties = [...existingProperties, ...properties];

      jsonPayload.income.houseProperty.properties = mergedProperties;

      const updateQuery = `UPDATE itr_filings SET json_payload = $1, updated_at = NOW() WHERE id = $2`;
      await dbQuery(updateQuery, [JSON.stringify(jsonPayload), filingId]);

      return successResponse(res, {
        propertiesAdded: properties.length,
      }, 'AIS rental income data applied successfully');
    } catch (error) {
      enterpriseLogger.error('Apply AIS rental income failed', { error: error.message, stack: error.stack });
      return errorResponse(res, error, 500);
    }
  }

  /**
   * Process rent receipts OCR for house property
   * POST /api/itr/filings/:filingId/income/house-property/ocr-rent-receipts
   */
  async processRentReceiptsOCR(req, res) {
    try {
      const userId = req.targetUserId || req.user.userId;
      const { filingId } = req.params;
      const { receipts, propertyId } = req.body;

      if (!receipts || !Array.isArray(receipts) || receipts.length === 0) {
        return validationErrorResponse(res, {
          receipts: 'Receipts array is required',
        });
      }

      // Verify filing ownership
      const verifyQuery = `SELECT user_id, json_payload FROM itr_filings WHERE id = $1`;
      const verifyResult = await dbQuery(verifyQuery, [filingId]);

      if (verifyResult.rows.length === 0) {
        return notFoundResponse(res, 'Filing');
      }

      if (verifyResult.rows[0].user_id !== userId) {
        return unauthorizedResponse(res, 'Unauthorized access to filing');
      }

      // Process receipts using real OCR service
      const RentReceiptOCRService = require('../services/business/RentReceiptOCRService');
      const processedReceipts = [];

      for (const receipt of receipts) {
        try {
          // If receipt has file buffer, process it
          if (receipt.fileBuffer) {
            const ocrResult = await RentReceiptOCRService.processDocument(
              receipt.fileBuffer,
              receipt.fileName || `receipt-${receipts.indexOf(receipt)}.pdf`
            );

            if (ocrResult.success) {
              processedReceipts.push({
                receiptId: receipt.receiptId || `receipt-${receipts.indexOf(receipt)}`,
                fileName: receipt.fileName || `receipt-${receipts.indexOf(receipt)}.pdf`,
                success: true,
                extractedData: {
                  landlordName: ocrResult.extractedData.landlordName,
                  propertyAddress: ocrResult.extractedData.propertyAddress,
                  rentAmount: ocrResult.extractedData.rentAmount || 0,
                  period: ocrResult.extractedData.period,
                  receiptDate: ocrResult.extractedData.receiptDate,
                  receiptNumber: ocrResult.extractedData.receiptNumber,
                  tdsDeducted: ocrResult.extractedData.tdsDeducted || 0,
                },
                confidence: ocrResult.confidence,
              });
            } else {
              // Fallback to provided data if OCR fails
              processedReceipts.push({
                receiptId: receipt.receiptId || `receipt-${receipts.indexOf(receipt)}`,
                fileName: receipt.fileName || `receipt-${receipts.indexOf(receipt)}.pdf`,
                success: true,
                extractedData: receipt.extractedData || {},
                confidence: receipt.confidence || 0.5,
              });
            }
          } else {
            // If no file buffer, use provided extracted data
            processedReceipts.push({
              receiptId: receipt.receiptId || `receipt-${receipts.indexOf(receipt)}`,
              fileName: receipt.fileName || `receipt-${receipts.indexOf(receipt)}.pdf`,
              success: true,
              extractedData: receipt.extractedData || {},
              confidence: receipt.confidence || 0.85,
            });
          }
        } catch (ocrError) {
          enterpriseLogger.error('Failed to process rent receipt OCR', {
            receiptId: receipt.receiptId,
            error: ocrError.message,
          });
          // Fallback to provided data on error
          processedReceipts.push({
            receiptId: receipt.receiptId || `receipt-${receipts.indexOf(receipt)}`,
            fileName: receipt.fileName || `receipt-${receipts.indexOf(receipt)}.pdf`,
            success: true,
            extractedData: receipt.extractedData || {},
            confidence: 0.5,
          });
        }
      }

      // Update filing with processed receipts
      const jsonPayload = verifyResult.rows[0].json_payload || {};
      if (!jsonPayload.income) jsonPayload.income = {};
      if (!jsonPayload.income.houseProperty) jsonPayload.income.houseProperty = { properties: [] };

      // Link receipts to property if propertyId provided
      if (propertyId !== undefined) {
        const properties = jsonPayload.income.houseProperty.properties || [];
        const propertyIndex = properties.findIndex(p => p.id === propertyId);
        if (propertyIndex >= 0) {
          if (!properties[propertyIndex].receipts) {
            properties[propertyIndex].receipts = [];
          }
          properties[propertyIndex].receipts.push(...processedReceipts);
          jsonPayload.income.houseProperty.properties = properties;
        }
      }

      const updateQuery = `UPDATE itr_filings SET json_payload = $1, updated_at = NOW() WHERE id = $2`;
      await dbQuery(updateQuery, [JSON.stringify(jsonPayload), filingId]);

      enterpriseLogger.info('Rent receipts OCR processed', {
        userId,
        filingId,
        receiptCount: processedReceipts.length,
        propertyId,
      });

      return successResponse(res, {
        receipts: processedReceipts,
        totalProcessed: processedReceipts.length,
      }, `${processedReceipts.length} rent receipt(s) processed successfully`);

    } catch (error) {
      enterpriseLogger.error('Process rent receipts OCR failed', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.userId,
        filingId: req.params.filingId,
      });
      return errorResponse(res, error, 500);
    }
  }

  /**
   * Get AIS capital gains data
   * GET /api/itr/filings/:filingId/ais/capital-gains
   */
  async getAISCapitalGains(req, res) {
    try {
      const userId = req.targetUserId || req.user.userId;
      const { filingId } = req.params;
      const { assessmentYear = getDefaultAssessmentYear() } = req.query;

      const verifyQuery = `SELECT user_id, json_payload, assessment_year FROM itr_filings WHERE id = $1`;
      const verifyResult = await dbQuery(verifyQuery, [filingId]);

      if (verifyResult.rows.length === 0) {
        return notFoundResponse(res, 'Filing');
      }

      if (verifyResult.rows[0].user_id !== userId) {
        return unauthorizedResponse(res, 'Unauthorized access to filing');
      }

      // Get user PAN from personal info
      const jsonPayload = verifyResult.rows[0].json_payload || {};
      const personalInfo = jsonPayload.personalInfo || {};
      const pan = personalInfo.panNumber || personalInfo.pan;

      if (!pan) {
        return validationErrorResponse(res, {
          pan: 'PAN number is required to fetch AIS data. Please complete personal information first.',
        });
      }

      // Get assessment year from filing (use database value if available, otherwise use query param)
      const filingAssessmentYear = verifyResult.rows[0].assessment_year || assessmentYear;

      // Fetch AIS capital gains using AIS service
      const AISService = require('../services/integration/AISService');
      let capitalGainsData = { stcgEntries: [], ltcgEntries: [], allGains: [] };
      let source = 'manual';

      try {
        capitalGainsData = await AISService.getCapitalGains(pan, filingAssessmentYear);
        source = 'ais';
      } catch (error) {
        enterpriseLogger.warn('AIS capital gains fetch failed, using stored data', {
          filingId,
          error: error.message,
        });
        // Fallback to stored AIS data if available
        const aisData = jsonPayload.aisData || {};
        const allGains = aisData.capitalGains || [];
        capitalGainsData = {
          stcgEntries: allGains.filter((g) => (g.holdingPeriod || 0) < 365),
          ltcgEntries: allGains.filter((g) => (g.holdingPeriod || 0) >= 365),
          allGains: allGains,
        };
        source = 'stored_ais';
      }

      return successResponse(res, {
        capitalGains: capitalGainsData.allGains,
        stcgEntries: capitalGainsData.stcgEntries,
        ltcgEntries: capitalGainsData.ltcgEntries,
        summary: {
          totalSTCG: capitalGainsData.stcgEntries.reduce((sum, g) => sum + (g.gainAmount || 0), 0),
          totalLTCG: capitalGainsData.ltcgEntries.reduce((sum, g) => sum + (g.gainAmount || 0), 0),
          transactions: capitalGainsData.allGains.length,
        },
        source: source,
        fetchedAt: new Date().toISOString(),
      }, 'AIS capital gains retrieved successfully');
    } catch (error) {
      enterpriseLogger.error('Get AIS capital gains failed', { error: error.message, stack: error.stack });
      return errorResponse(res, error, 500);
    }
  }

  /**
   * Apply AIS capital gains data to capital gains form
   * POST /api/itr/filings/:filingId/income/capital-gains/apply-ais
   */
  async applyAISCapitalGains(req, res) {
    try {
      const userId = req.targetUserId || req.user.userId;
      const { filingId } = req.params;
      const { stcgEntries, ltcgEntries } = req.body;

      const verifyQuery = `SELECT user_id, json_payload FROM itr_filings WHERE id = $1`;
      const verifyResult = await dbQuery(verifyQuery, [filingId]);

      if (verifyResult.rows.length === 0) {
        return notFoundResponse(res, 'Filing');
      }

      if (verifyResult.rows[0].user_id !== userId) {
        return unauthorizedResponse(res, 'Unauthorized access to filing');
      }

      const jsonPayload = verifyResult.rows[0].json_payload || {};
      if (!jsonPayload.income) jsonPayload.income = {};
      if (!jsonPayload.income.capitalGains) {
        jsonPayload.income.capitalGains = {
          hasCapitalGains: true,
          stcgDetails: [],
          ltcgDetails: [],
        };
      }

      // Merge AIS entries with existing entries
      const existingSTCG = jsonPayload.income.capitalGains.stcgDetails || [];
      const existingLTCG = jsonPayload.income.capitalGains.ltcgDetails || [];
      const mergedSTCG = [...existingSTCG, ...(stcgEntries || [])];
      const mergedLTCG = [...existingLTCG, ...(ltcgEntries || [])];

      jsonPayload.income.capitalGains.stcgDetails = mergedSTCG;
      jsonPayload.income.capitalGains.ltcgDetails = mergedLTCG;
      jsonPayload.income.capitalGains.hasCapitalGains = mergedSTCG.length > 0 || mergedLTCG.length > 0;

      const updateQuery = `UPDATE itr_filings SET json_payload = $1, updated_at = NOW() WHERE id = $2`;
      await dbQuery(updateQuery, [JSON.stringify(jsonPayload), filingId]);

      return successResponse(res, {
        stcgEntriesAdded: (stcgEntries || []).length,
        ltcgEntriesAdded: (ltcgEntries || []).length,
      }, 'AIS capital gains data applied successfully');
    } catch (error) {
      enterpriseLogger.error('Apply AIS capital gains failed', { error: error.message, stack: error.stack });
      return errorResponse(res, error, 500);
    }
  }

  /**
   * Get AIS business income data
   * GET /api/itr/filings/:filingId/ais/business-income
   */
  async getAISBusinessIncome(req, res) {
    try {
      const userId = req.targetUserId || req.user.userId;
      const { filingId } = req.params;
      const { assessmentYear = getDefaultAssessmentYear() } = req.query;

      const verifyQuery = `SELECT user_id, json_payload, assessment_year FROM itr_filings WHERE id = $1`;
      const verifyResult = await dbQuery(verifyQuery, [filingId]);

      if (verifyResult.rows.length === 0) {
        return notFoundResponse(res, 'Filing');
      }

      if (verifyResult.rows[0].user_id !== userId) {
        return unauthorizedResponse(res, 'Unauthorized access to filing');
      }

      // Get user PAN from personal info
      const jsonPayload = verifyResult.rows[0].json_payload || {};
      const personalInfo = jsonPayload.personalInfo || {};
      const pan = personalInfo.panNumber || personalInfo.pan;

      if (!pan) {
        return validationErrorResponse(res, {
          pan: 'PAN number is required to fetch AIS data. Please complete personal information first.',
        });
      }

      // Get assessment year from filing (use database value if available, otherwise use query param)
      const filingAssessmentYear = verifyResult.rows[0].assessment_year || assessmentYear;

      // Fetch AIS business income using AIS service
      const AISService = require('../services/integration/AISService');
      let businessIncome = [];
      let source = 'manual';

      try {
        businessIncome = await AISService.getBusinessIncome(pan, filingAssessmentYear);
        source = 'ais';
      } catch (error) {
        enterpriseLogger.warn('AIS business income fetch failed, using stored data', {
          filingId,
          error: error.message,
        });
        // Fallback to stored AIS data if available
        const aisData = jsonPayload.aisData || {};
        businessIncome = aisData.businessIncome || [];
        source = 'stored_ais';
      }

      const totalGrossReceipts = businessIncome.reduce((sum, b) => sum + (b.grossReceipts || b.pnl?.grossReceipts || 0), 0);
      const totalTDS = businessIncome.reduce((sum, b) => sum + (b.tdsDeducted || b.pnl?.tdsDeducted || 0), 0);

      return successResponse(res, {
        businessIncome: businessIncome,
        summary: {
          totalGrossReceipts: totalGrossReceipts,
          totalTDS: totalTDS,
          businesses: businessIncome.length,
        },
        source: source,
        fetchedAt: new Date().toISOString(),
      }, 'AIS business income retrieved successfully');
    } catch (error) {
      enterpriseLogger.error('Get AIS business income failed', { error: error.message, stack: error.stack });
      return errorResponse(res, error, 500);
    }
  }

  /**
   * Apply AIS business income data to business income form
   * POST /api/itr/filings/:filingId/income/business/apply-ais
   */
  async applyAISBusinessIncome(req, res) {
    try {
      const userId = req.targetUserId || req.user.userId;
      const { filingId } = req.params;
      const { businesses } = req.body;

      const verifyQuery = `SELECT user_id, json_payload FROM itr_filings WHERE id = $1`;
      const verifyResult = await dbQuery(verifyQuery, [filingId]);

      if (verifyResult.rows.length === 0) {
        return notFoundResponse(res, 'Filing');
      }

      if (verifyResult.rows[0].user_id !== userId) {
        return unauthorizedResponse(res, 'Unauthorized access to filing');
      }

      const jsonPayload = verifyResult.rows[0].json_payload || {};
      if (!jsonPayload.income) jsonPayload.income = {};
      if (!jsonPayload.income.business) jsonPayload.income.business = { businesses: [] };

      // Merge AIS businesses with existing businesses
      const existingBusinesses = jsonPayload.income.business.businesses || [];
      const mergedBusinesses = [...existingBusinesses, ...(businesses || [])];

      jsonPayload.income.business.businesses = mergedBusinesses;

      const updateQuery = `UPDATE itr_filings SET json_payload = $1, updated_at = NOW() WHERE id = $2`;
      await dbQuery(updateQuery, [JSON.stringify(jsonPayload), filingId]);

      return successResponse(res, {
        businessesAdded: (businesses || []).length,
      }, 'AIS business income data applied successfully');
    } catch (error) {
      enterpriseLogger.error('Apply AIS business income failed', { error: error.message, stack: error.stack });
      return errorResponse(res, error, 500);
    }
  }

  /**
   * Get AIS professional income data
   * GET /api/itr/filings/:filingId/ais/professional-income
   */
  async getAISProfessionalIncome(req, res) {
    try {
      const userId = req.targetUserId || req.user.userId;
      const { filingId } = req.params;
      const { assessmentYear = getDefaultAssessmentYear() } = req.query;

      const verifyQuery = `SELECT user_id, json_payload, assessment_year FROM itr_filings WHERE id = $1`;
      const verifyResult = await dbQuery(verifyQuery, [filingId]);

      if (verifyResult.rows.length === 0) {
        return notFoundResponse(res, 'Filing');
      }

      if (verifyResult.rows[0].user_id !== userId) {
        return unauthorizedResponse(res, 'Unauthorized access to filing');
      }

      // Get user PAN from personal info
      const jsonPayload = verifyResult.rows[0].json_payload || {};
      const personalInfo = jsonPayload.personalInfo || {};
      const pan = personalInfo.panNumber || personalInfo.pan;

      if (!pan) {
        return validationErrorResponse(res, {
          pan: 'PAN number is required to fetch AIS data. Please complete personal information first.',
        });
      }

      // Get assessment year from filing (use database value if available, otherwise use query param)
      const filingAssessmentYear = verifyResult.rows[0].assessment_year || assessmentYear;

      // Fetch AIS professional income using AIS service
      const AISService = require('../services/integration/AISService');
      let professionalIncome = [];
      let source = 'manual';

      try {
        professionalIncome = await AISService.getProfessionalIncome(pan, filingAssessmentYear);
        source = 'ais';
      } catch (error) {
        enterpriseLogger.warn('AIS professional income fetch failed, using stored data', {
          filingId,
          error: error.message,
        });
        // Fallback to stored AIS data if available
        const aisData = jsonPayload.aisData || {};
        professionalIncome = aisData.professionalIncome || [];
        source = 'stored_ais';
      }

      const totalProfessionalFees = professionalIncome.reduce((sum, p) => sum + (p.professionalFees || p.pnl?.professionalFees || 0), 0);
      const totalTDS = professionalIncome.reduce((sum, p) => sum + (p.tdsDeducted || p.pnl?.tdsDeducted || 0), 0);

      return successResponse(res, {
        professionalIncome: professionalIncome,
        summary: {
          totalProfessionalFees: totalProfessionalFees,
          totalTDS: totalTDS,
          professions: professionalIncome.length,
        },
        source: source,
        fetchedAt: new Date().toISOString(),
      }, 'AIS professional income retrieved successfully');
    } catch (error) {
      enterpriseLogger.error('Get AIS professional income failed', { error: error.message, stack: error.stack });
      return errorResponse(res, error, 500);
    }
  }

  /**
   * Apply AIS professional income data to professional income form
   * POST /api/itr/filings/:filingId/income/professional/apply-ais
   */
  async applyAISProfessionalIncome(req, res) {
    try {
      const userId = req.targetUserId || req.user.userId;
      const { filingId } = req.params;
      const { professions } = req.body;

      const verifyQuery = `SELECT user_id, json_payload FROM itr_filings WHERE id = $1`;
      const verifyResult = await dbQuery(verifyQuery, [filingId]);

      if (verifyResult.rows.length === 0) {
        return notFoundResponse(res, 'Filing');
      }

      if (verifyResult.rows[0].user_id !== userId) {
        return unauthorizedResponse(res, 'Unauthorized access to filing');
      }

      const jsonPayload = verifyResult.rows[0].json_payload || {};
      if (!jsonPayload.income) jsonPayload.income = {};
      if (!jsonPayload.income.professional) jsonPayload.income.professional = { professions: [] };

      // Merge AIS professions with existing professions
      // Note: Frontend uses 'professions' but backend getProfessionalIncome returns 'activities'
      // We'll use 'professions' to match frontend expectations
      const existingProfessions = jsonPayload.income.professional.professions || jsonPayload.income.professional.activities || [];
      const mergedProfessions = [...existingProfessions, ...(professions || [])];

      jsonPayload.income.professional.professions = mergedProfessions;
      // Also update activities for backward compatibility
      jsonPayload.income.professional.activities = mergedProfessions;

      const updateQuery = `UPDATE itr_filings SET json_payload = $1, updated_at = NOW() WHERE id = $2`;
      await dbQuery(updateQuery, [JSON.stringify(jsonPayload), filingId]);

      return successResponse(res, {
        professionsAdded: (professions || []).length,
      }, 'AIS professional income data applied successfully');
    } catch (error) {
      enterpriseLogger.error('Apply AIS professional income failed', { error: error.message, stack: error.stack });
      return errorResponse(res, error, 500);
    }
  }

  /**
   * Get business income
   * GET /api/itr/filings/:filingId/income/business
   */
  async getBusinessIncome(req, res) {
    try {
      const userId = req.targetUserId || req.user.userId;
      const { filingId } = req.params;

      const verifyQuery = `SELECT user_id, itr_type, json_payload FROM itr_filings WHERE id = $1`;
      const verifyResult = await dbQuery(verifyQuery, [filingId]);

      if (verifyResult.rows.length === 0) {
        return notFoundResponse(res, 'Filing');
      }

      if (verifyResult.rows[0].user_id !== userId) {
        return unauthorizedResponse(res, 'Unauthorized access to filing');
      }

      // Validate ITR type - Business Income is allowed for ITR-3 and ITR-4
      const itrType = verifyResult.rows[0].itr_type;
      const domainCore = require('../domain/ITRDomainCore');
      // Business income is part of 'income' section, but only ITR-3 and ITR-4 support it
      // Check if income section is applicable and ITR type is ITR-3 or ITR-4
      if (!domainCore.isSectionApplicable(itrType, 'income') ||
        (itrType !== 'ITR-3' && itrType !== 'ITR3' && itrType !== 'ITR-4' && itrType !== 'ITR4')) {
        return validationErrorResponse(res, {
          itrType: `Business income is not applicable for ${itrType}. This income type is only available for ITR-3 and ITR-4.`,
        });
      }

      const jsonPayload = verifyResult.rows[0].json_payload || {};
      const businessIncome = jsonPayload.income?.business || { businesses: [] };

      return successResponse(res, {
        businesses: businessIncome.businesses || [],
        totalIncome: businessIncome.totalIncome || 0,
      }, 'Business income retrieved successfully');
    } catch (error) {
      enterpriseLogger.error('Get business income failed', { error: error.message, stack: error.stack });
      return errorResponse(res, error, 500);
    }
  }

  /**
   * Update business income
   * PUT /api/itr/filings/:filingId/income/business
   */
  async updateBusinessIncome(req, res) {
    try {
      const userId = req.targetUserId || req.user.userId;
      const { filingId } = req.params;
      const businessIncomeData = req.body;

      const verifyQuery = `SELECT user_id, itr_type, json_payload FROM itr_filings WHERE id = $1`;
      const verifyResult = await dbQuery(verifyQuery, [filingId]);

      if (verifyResult.rows.length === 0) {
        return notFoundResponse(res, 'Filing');
      }

      if (verifyResult.rows[0].user_id !== userId) {
        return unauthorizedResponse(res, 'Unauthorized access to filing');
      }

      // Validate ITR type - Business Income is allowed for ITR-3 and ITR-4
      const itrType = verifyResult.rows[0].itr_type;
      const domainCore = require('../domain/ITRDomainCore');
      // Business income is part of 'income' section, but only ITR-3 and ITR-4 support it
      // Check if income section is applicable and ITR type is ITR-3 or ITR-4
      if (!domainCore.isSectionApplicable(itrType, 'income') ||
        (itrType !== 'ITR-3' && itrType !== 'ITR3' && itrType !== 'ITR-4' && itrType !== 'ITR4')) {
        return validationErrorResponse(res, {
          itrType: `Business income is not applicable for ${itrType}. This income type is only available for ITR-3 and ITR-4.`,
        });
      }

      const jsonPayload = verifyResult.rows[0].json_payload || {};
      if (!jsonPayload.income) jsonPayload.income = {};
      jsonPayload.income.business = businessIncomeData;

      const updateQuery = `UPDATE itr_filings SET json_payload = $1, updated_at = NOW() WHERE id = $2`;
      await dbQuery(updateQuery, [JSON.stringify(jsonPayload), filingId]);

      return successResponse(res, null, 'Business income updated successfully');
    } catch (error) {
      enterpriseLogger.error('Update business income failed', { error: error.message, stack: error.stack });
      return errorResponse(res, error, 500);
    }
  }

  /**
   * Get professional income
   * GET /api/itr/filings/:filingId/income/professional
   */
  async getProfessionalIncome(req, res) {
    try {
      const userId = req.targetUserId || req.user.userId;
      const { filingId } = req.params;

      const verifyQuery = `SELECT user_id, itr_type, json_payload FROM itr_filings WHERE id = $1`;
      const verifyResult = await dbQuery(verifyQuery, [filingId]);

      if (verifyResult.rows.length === 0) {
        return notFoundResponse(res, 'Filing');
      }

      if (verifyResult.rows[0].user_id !== userId) {
        return unauthorizedResponse(res, 'Unauthorized access to filing');
      }

      // Validate ITR type - Professional Income is only allowed for ITR-3
      const itrType = verifyResult.rows[0].itr_type;
      const domainCore = require('../domain/ITRDomainCore');
      // Professional income is part of 'income' section, but only ITR-3 supports it
      if (!domainCore.isSectionApplicable(itrType, 'income') ||
        (itrType !== 'ITR-3' && itrType !== 'ITR3')) {
        return validationErrorResponse(res, {
          itrType: `Professional income is not applicable for ${itrType}. This income type is only available for ITR-3.`,
        });
      }

      const jsonPayload = verifyResult.rows[0].json_payload || {};
      const professionalIncome = jsonPayload.income?.professional || { activities: [] };

      return successResponse(res, {
        activities: professionalIncome.activities || [],
        totalIncome: professionalIncome.totalIncome || 0,
      }, 'Professional income retrieved successfully');
    } catch (error) {
      enterpriseLogger.error('Get professional income failed', { error: error.message, stack: error.stack });
      return errorResponse(res, error, 500);
    }
  }

  /**
   * Update professional income
   * PUT /api/itr/filings/:filingId/income/professional
   */
  async updateProfessionalIncome(req, res) {
    try {
      const userId = req.targetUserId || req.user.userId;
      const { filingId } = req.params;
      const professionalIncomeData = req.body;

      const verifyQuery = `SELECT user_id, itr_type, json_payload FROM itr_filings WHERE id = $1`;
      const verifyResult = await dbQuery(verifyQuery, [filingId]);

      if (verifyResult.rows.length === 0) {
        return notFoundResponse(res, 'Filing');
      }

      if (verifyResult.rows[0].user_id !== userId) {
        return unauthorizedResponse(res, 'Unauthorized access to filing');
      }

      // Validate ITR type - Professional Income is only allowed for ITR-3
      const itrType = verifyResult.rows[0].itr_type;
      const domainCore = require('../domain/ITRDomainCore');
      // Professional income is part of 'income' section, but only ITR-3 supports it
      if (!domainCore.isSectionApplicable(itrType, 'income') ||
        (itrType !== 'ITR-3' && itrType !== 'ITR3')) {
        return validationErrorResponse(res, {
          itrType: `Professional income is not applicable for ${itrType}. This income type is only available for ITR-3.`,
        });
      }

      const jsonPayload = verifyResult.rows[0].json_payload || {};
      if (!jsonPayload.income) jsonPayload.income = {};
      jsonPayload.income.professional = professionalIncomeData;

      const updateQuery = `UPDATE itr_filings SET json_payload = $1, updated_at = NOW() WHERE id = $2`;
      await dbQuery(updateQuery, [JSON.stringify(jsonPayload), filingId]);

      return successResponse(res, null, 'Professional income updated successfully');
    } catch (error) {
      enterpriseLogger.error('Update professional income failed', { error: error.message, stack: error.stack });
      return errorResponse(res, error, 500);
    }
  }

  /**
   * Get balance sheet
   * GET /api/itr/filings/:filingId/balance-sheet
   */
  async getBalanceSheet(req, res) {
    try {
      const userId = req.targetUserId || req.user.userId;
      const { filingId } = req.params;

      const BalanceSheetService = require('../services/itr/BalanceSheetService');

      // Verify user owns this filing
      const verifyQuery = `
        SELECT user_id, itr_type FROM itr_filings WHERE id = $1
      `;
      const verifyResult = await dbQuery(verifyQuery, [filingId]);

      if (verifyResult.rows.length === 0) {
        return notFoundResponse(res, 'Filing');
      }

      if (verifyResult.rows[0].user_id !== userId) {
        return unauthorizedResponse(res, 'Unauthorized access to filing');
      }

      // Validate ITR type - Balance Sheet is only allowed for ITR-3
      const itrType = verifyResult.rows[0].itr_type;
      const domainCore = require('../domain/ITRDomainCore');
      if (!domainCore.isSectionApplicable(itrType, 'balanceSheet')) {
        return validationErrorResponse(res, {
          itrType: `Balance sheet is not applicable for ${itrType}. This feature is only available for ITR-3.`,
        });
      }

      const balanceSheet = await BalanceSheetService.getBalanceSheet(filingId);

      return successResponse(res, { balanceSheet }, 'Balance sheet retrieved successfully');
    } catch (error) {
      enterpriseLogger.error('Get balance sheet failed', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.userId,
        filingId: req.params.filingId,
      });
      return errorResponse(res, error, error.statusCode || 500);
    }
  }

  /**
   * Get audit information
   * GET /api/itr/filings/:filingId/audit-information
   */
  async getAuditInformation(req, res) {
    try {
      const userId = req.targetUserId || req.user.userId;
      const { filingId } = req.params;

      const AuditInformationService = require('../services/itr/AuditInformationService');

      // Verify user owns this filing
      const verifyQuery = `
        SELECT user_id, itr_type FROM itr_filings WHERE id = $1
      `;
      const verifyResult = await dbQuery(verifyQuery, [filingId]);

      if (verifyResult.rows.length === 0) {
        return notFoundResponse(res, 'Filing');
      }

      if (verifyResult.rows[0].user_id !== userId) {
        return unauthorizedResponse(res, 'Unauthorized access to filing');
      }

      // Validate ITR type - Audit Information is only allowed for ITR-3
      const itrType = verifyResult.rows[0].itr_type;
      const domainCore = require('../domain/ITRDomainCore');
      if (!domainCore.isSectionApplicable(itrType, 'auditInfo')) {
        return validationErrorResponse(res, {
          itrType: `Audit information is not applicable for ${itrType}. This feature is only available for ITR-3.`,
        });
      }

      const auditInfo = await AuditInformationService.getAuditInformation(filingId);

      return successResponse(res, {
        auditInfo,
        applicability: auditInfo.applicability,
      }, 'Audit information retrieved successfully');
    } catch (error) {
      enterpriseLogger.error('Get audit information failed', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.userId,
        filingId: req.params.filingId,
      });
      return errorResponse(res, error, error.statusCode || 500);
    }
  }

  /**
   * Update audit information
   * PUT /api/itr/filings/:filingId/audit-information
   */
  async updateAuditInformation(req, res) {
    try {
      const userId = req.targetUserId || req.user.userId;
      const { filingId } = req.params;
      const auditData = req.body;

      const AuditInformationService = require('../services/itr/AuditInformationService');

      // Verify user owns this filing
      const verifyQuery = `
        SELECT user_id, itr_type FROM itr_filings WHERE id = $1
      `;
      const verifyResult = await dbQuery(verifyQuery, [filingId]);

      if (verifyResult.rows.length === 0) {
        return notFoundResponse(res, 'Filing');
      }

      if (verifyResult.rows[0].user_id !== userId) {
        return unauthorizedResponse(res, 'Unauthorized access to filing');
      }

      // Validate ITR type - Audit Information is only allowed for ITR-3
      const itrType = verifyResult.rows[0].itr_type;
      const domainCore = require('../domain/ITRDomainCore');
      if (!domainCore.isSectionApplicable(itrType, 'auditInfo')) {
        return validationErrorResponse(res, {
          itrType: `Audit information is not applicable for ${itrType}. This feature is only available for ITR-3.`,
        });
      }

      const updated = await AuditInformationService.updateAuditInformation(filingId, auditData);

      return successResponse(res, {
        auditInfo: updated,
      }, 'Audit information updated successfully');
    } catch (error) {
      enterpriseLogger.error('Update audit information failed', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.userId,
        filingId: req.params.filingId,
      });
      return errorResponse(res, error, error.statusCode || 500);
    }
  }

  /**
   * Check audit applicability
   * POST /api/itr/filings/:filingId/audit-information/check-applicability
   */
  async checkAuditApplicability(req, res) {
    try {
      const userId = req.targetUserId || req.user.userId;
      const { filingId } = req.params;

      const AuditInformationService = require('../services/itr/AuditInformationService');

      // Verify user owns this filing
      const verifyQuery = `
        SELECT user_id, json_payload FROM itr_filings WHERE id = $1
      `;
      const verifyResult = await dbQuery(verifyQuery, [filingId]);

      if (verifyResult.rows.length === 0) {
        return notFoundResponse(res, 'Filing');
      }

      if (verifyResult.rows[0].user_id !== userId) {
        return unauthorizedResponse(res, 'Unauthorized access to filing');
      }

      const jsonPayload = verifyResult.rows[0].json_payload || {};
      const applicability = AuditInformationService.checkAuditApplicability(
        jsonPayload.income?.business,
        jsonPayload.income?.professional
      );

      return successResponse(res, applicability, 'Audit applicability checked successfully');
    } catch (error) {
      enterpriseLogger.error('Check audit applicability failed', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.userId,
        filingId: req.params.filingId,
      });
      return errorResponse(res, error, error.statusCode || 500);
    }
  }

  /**
   * Update balance sheet
   * PUT /api/itr/filings/:filingId/balance-sheet
   */
  async updateBalanceSheet(req, res) {
    try {
      const userId = req.targetUserId || req.user.userId;
      const { filingId } = req.params;
      const balanceSheetData = req.body;

      const BalanceSheetService = require('../services/itr/BalanceSheetService');

      // Verify user owns this filing
      const verifyQuery = `
        SELECT user_id, itr_type FROM itr_filings WHERE id = $1
      `;
      const verifyResult = await dbQuery(verifyQuery, [filingId]);

      if (verifyResult.rows.length === 0) {
        return notFoundResponse(res, 'Filing');
      }

      if (verifyResult.rows[0].user_id !== userId) {
        return unauthorizedResponse(res, 'Unauthorized access to filing');
      }

      // Validate ITR type - Balance Sheet is only allowed for ITR-3
      const itrType = verifyResult.rows[0].itr_type;
      const domainCore = require('../domain/ITRDomainCore');
      if (!domainCore.isSectionApplicable(itrType, 'balanceSheet')) {
        return validationErrorResponse(res, {
          itrType: `Balance sheet is not applicable for ${itrType}. This feature is only available for ITR-3.`,
        });
      }

      const updated = await BalanceSheetService.updateBalanceSheet(filingId, balanceSheetData);

      return successResponse(res, {
        balanceSheet: updated,
      }, 'Balance sheet updated successfully');
    } catch (error) {
      enterpriseLogger.error('Update balance sheet failed', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.userId,
        filingId: req.params.filingId,
      });
      return errorResponse(res, error, error.statusCode || 500);
    }
  }

  /**
   * Export acknowledgment as PDF
   * GET /api/itr/filings/:filingId/acknowledgment/pdf
   */
  async exportAcknowledgmentPDF(req, res) {
    try {
      const userId = req.targetUserId || req.user.userId;
      const { filingId } = req.params;

      const PDFGenerationService = require('../services/core/PDFGenerationService');

      // Verify user owns this filing
      const verifyQuery = `
        SELECT user_id FROM itr_filings WHERE id = $1
      `;
      const verifyResult = await dbQuery(verifyQuery, [filingId]);

      if (verifyResult.rows.length === 0) {
        return notFoundResponse(res, 'Filing');
      }

      if (verifyResult.rows[0].user_id !== userId) {
        return unauthorizedResponse(res, 'Unauthorized access to filing');
      }

      // Get filing data (DB source of truth; avoids model/column drift)
      const filingQuery = `
        SELECT
          itr_type,
          assessment_year,
          submitted_at,
          acknowledgment_number,
          ack_number,
          verification_status
        FROM itr_filings
        WHERE id = $1
      `;
      const filingResult = await dbQuery(filingQuery, [filingId]);

      if (filingResult.rows.length === 0) {
        return notFoundResponse(res, 'Filing');
      }

      const row = filingResult.rows[0];
      const acknowledgmentNumber = row.acknowledgment_number || row.ack_number || null;

      if (!acknowledgmentNumber) {
        return validationErrorResponse(res, {
          acknowledgmentNumber: 'Filing not yet acknowledged',
        });
      }

      const acknowledgmentData = {
        acknowledgmentNumber,
        submittedAt: row.submitted_at,
        itrType: row.itr_type,
        assessmentYear: row.assessment_year,
        eVerificationStatus: row.verification_status || 'pending',
      };

      // Generate PDF
      const pdfBuffer = await PDFGenerationService.generateAcknowledgmentPDF(acknowledgmentData);

      // Set response headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="acknowledgment-${filingId}.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length);

      res.send(pdfBuffer);
    } catch (error) {
      enterpriseLogger.error('Export acknowledgment PDF failed', {
        error: error.message,
        userId: req.user?.userId,
        filingId: req.params.filingId,
      });
      return errorResponse(res, error, error.statusCode || 500);
    }
  }

  // =====================================================
  // JSON EXPORT
  // =====================================================

  /**
   * Generate ITR-1 JSON using new pipeline (with Form-16 aggregation and validation)
   * @param {object} sectionSnapshot - Section snapshot from draft/filing
   * @param {object} computationResult - Tax computation result
   * @param {string} assessmentYear - Assessment year
   * @param {object} user - User model instance
   * @param {string} filingId - Optional filing ID for Form-16 aggregation
   * @returns {Promise<object>} Generated ITR-1 JSON with validation results
   */
  // =====================================================
  // EXPORT ITR
  // =====================================================

  /**
   * Export ITR data as government-compliant JSON
   * POST /api/itr/export
   */
  async exportITRJson(req, res) {
    try {
      const userId = req.targetUserId || req.user.userId;
      const { filingId } = req.body;

      if (!filingId) {
        return validationErrorResponse(res, { filingId: 'filingId is required' });
      }

      const result = await itrExportService.export(userId, filingId, { role: req.user.role });

      return successResponse(res, result, 'ITR JSON exported successfully');
    } catch (error) {
      enterpriseLogger.error('exportITRJson failed', { error: error.message, userId: req.user?.userId });
      return error.statusCode ? errorResponse(res, error, error.statusCode) : errorResponse(res, error, 500);
    }
  }

  /**
     * Download exported JSON file
     * GET /api/itr/export/download/:fileName
     */
  async downloadExportedJson(req, res) {
    try {
      const { fileName } = req.params;
      const path = require('path');
      const fs = require('fs');

      // Sanitize filename to prevent directory traversal
      const sanitizedFileName = path.basename(fileName);
      const filePath = path.join(__dirname, '../../uploads/local', sanitizedFileName);

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return notFoundResponse(res, 'File');
      }

      // Set response headers
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${sanitizedFileName}"`);

      // Send file
      res.sendFile(filePath);
    } catch (error) {
      enterpriseLogger.error('Download exported JSON failed', {
        error: error.message,
        fileName: req.params.fileName,
      });
      return errorResponse(res, error, error.statusCode || 500);
    }
  }

  /**
  // ITR DETERMINATION
  // =====================================================

  /**
   * Determine suitable ITR type based on user data
   * POST /api/itr/determine-type
   */
  async determineITRType(req, res) {
    try {
      const { formData } = req.body;

      if (!formData || typeof formData !== 'object') {
        return validationErrorResponse(res, { formData: 'Form data is required' });
      }

      // Use Domain Core for pure logic determination
      const determination = DomainCore.determineITR(formData);

      return successResponse(res, determination, 'ITR type determined successfully');
    } catch (error) {
      enterpriseLogger.error('ITR determination failed', {
        error: error.message,
        userId: req.user?.userId
      });
      return errorResponse(res, error, 500);
    }
  }

}

module.exports = ITRController;