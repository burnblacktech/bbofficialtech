// =====================================================
// ITR CONTROLLER - CANONICAL FILING SYSTEM
// Handles create/validate/submit for all ITR types
// =====================================================

const { pool } = require('../config/database');
const enterpriseLogger = require('../utils/logger');
const validationEngine = require('../services/core/ValidationEngine');
const taxComputationEngine = require('../services/core/TaxComputationEngine');
const serviceTicketService = require('../services/business/ServiceTicketService');
const sseNotificationService = require('../services/utils/NotificationService');

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
      const userId = req.user.userId;
      const { itrType, formData } = req.body;

      // Validate ITR type
      const validTypes = ['ITR-1', 'ITR-2', 'ITR-3', 'ITR-4'];
      if (!validTypes.includes(itrType)) {
        return res.status(400).json({
          error: 'Invalid ITR type. Must be ITR-1, ITR-2, ITR-3, or ITR-4',
        });
      }

      // Validate form data
      const validation = this.validationEngine.validate(itrType.replace('-', '').toLowerCase(), formData);
      if (!validation.isValid) {
        return res.status(400).json({
          error: 'Validation failed',
          details: validation.errors,
        });
      }

      // Create filing first
      const createFilingQuery = `
        INSERT INTO itr_filings (user_id, itr_type, assessment_year, status, created_at)
        VALUES ($1, $2, $3, 'draft', NOW())
        RETURNING id
      `;

      const filing = await pool.query(createFilingQuery, [
        userId,
        itrType,
        '2024-25', // Default assessment year
      ]);

      // Create draft
      const createDraftQuery = `
        INSERT INTO itr_drafts (filing_id, step, data, created_at)
        VALUES ($1, $2, $3, NOW())
        RETURNING id, step, created_at
      `;

      const draft = await pool.query(createDraftQuery, [
        filing.rows[0].id,
        'personal_info', // Default step
        JSON.stringify(formData),
      ]);

      enterpriseLogger.info('ITR draft created', {
        userId,
        itrType,
        draftId: draft.rows[0].id,
        filingId: filing.rows[0].id,
      });

      // Auto-create service ticket for filing support
      try {
        const filingData = {
          id: filing.rows[0].id,
          userId,
          itrType,
          memberId: null, // Will be set if filing for family member
        };

        await serviceTicketService.autoCreateFilingTicket(filingData);

        enterpriseLogger.info('Auto-generated service ticket created for filing', {
          filingId: filing.rows[0].id,
          userId,
          itrType,
        });
      } catch (ticketError) {
        // Don't fail the draft creation if ticket creation fails
        enterpriseLogger.error('Failed to auto-create service ticket', {
          error: ticketError.message,
          filingId: filing.rows[0].id,
          userId,
        });
      }

      res.status(201).json({
        message: 'Draft created successfully',
        draft: {
          id: draft.rows[0].id,
          filingId: filing.rows[0].id,
          step: draft.rows[0].step,
          itrType: itrType,
          status: 'draft',
          createdAt: draft.rows[0].created_at,
        },
      });
    } catch (error) {
      enterpriseLogger.error('Draft creation failed', {
        error: error.message,
        userId: req.user?.userId,
      });
      res.status(500).json({
        error: 'Internal server error',
      });
    }
  }

  // =====================================================
  // UPDATE DRAFT
  // =====================================================

  async updateDraft(req, res) {
    try {
      const userId = req.user.userId;
      const { draftId } = req.params;
      const { formData } = req.body;

      // Get draft to determine ITR type
      const getDraftQuery = `
        SELECT itr_type
        FROM itr_drafts
        WHERE id = $1 AND user_id = $2
      `;
      const draft = await pool.query(getDraftQuery, [draftId, userId]);

      if (draft.rows.length === 0) {
        return res.status(404).json({ error: 'Draft not found' });
      }

      const itrType = draft.rows[0].itr_type;

      // Validate form data
      const validation = this.validationEngine.validate(itrType.replace('-', '').toLowerCase(), formData);
      if (!validation.isValid) {
        return res.status(400).json({
          error: 'Validation failed',
          details: validation.errors,
        });
      }

      // Update draft
      const updateDraftQuery = `
        UPDATE itr_drafts 
        SET form_data = $1, updated_at = NOW()
        WHERE id = $2 AND user_id = $3 AND status = 'draft'
        RETURNING id, itr_type, status, updated_at
      `;

      const result = await pool.query(updateDraftQuery, [
        JSON.stringify(formData),
        draftId,
        userId,
      ]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: 'Draft not found or not editable',
        });
      }

      enterpriseLogger.info('ITR draft updated', {
        userId,
        draftId,
        itrType: result.rows[0].itr_type,
      });

      res.json({
        message: 'Draft updated successfully',
        draft: {
          id: result.rows[0].id,
          itrType: result.rows[0].itr_type,
          status: result.rows[0].status,
          updatedAt: result.rows[0].updated_at,
        },
      });
    } catch (error) {
      enterpriseLogger.error('Draft update failed', {
        error: error.message,
        userId: req.user?.userId,
        draftId: req.params.draftId,
      });
      res.status(500).json({
        error: 'Internal server error',
      });
    }
  }

  // =====================================================
  // VALIDATE DRAFT
  // =====================================================

  async validateDraft(req, res) {
    try {
      const userId = req.user.userId;
      const { draftId } = req.params;

      // Get draft
      const getDraftQuery = `
        SELECT id, itr_type, form_data, status
        FROM itr_drafts 
        WHERE id = $1 AND user_id = $2
      `;

      const draft = await pool.query(getDraftQuery, [draftId, userId]);

      if (draft.rows.length === 0) {
        return res.status(404).json({
          error: 'Draft not found',
        });
      }

      const formData = JSON.parse(draft.rows[0].form_data);
      const itrType = draft.rows[0].itr_type;

      // Validate form data
      const validation = this.validationEngine.validateAll(formData);

      // Additional ITR-specific validation
      const itrSpecificValidation = this.validationEngine.validateITRSpecific(itrType, formData);

      const allValid = validation.isValid && itrSpecificValidation.isValid;
      const allErrors = [...validation.errors, ...itrSpecificValidation.errors];
      const allWarnings = [...validation.warnings, ...itrSpecificValidation.warnings];

      enterpriseLogger.info('Draft validation completed', {
        userId,
        draftId,
        itrType,
        isValid: allValid,
        errorCount: allErrors.length,
        warningCount: allWarnings.length,
      });

      res.json({
        isValid: allValid,
        errors: allErrors,
        warnings: allWarnings,
        details: {
          general: validation,
          itrSpecific: itrSpecificValidation,
        },
      });
    } catch (error) {
      enterpriseLogger.error('Draft validation failed', {
        error: error.message,
        userId: req.user?.userId,
        draftId: req.params.draftId,
      });
      res.status(500).json({
        error: 'Internal server error',
      });
    }
  }

  // =====================================================
  // COMPUTE TAX
  // =====================================================

  async computeTax(req, res) {
    try {
      const userId = req.user.userId;
      const { draftId } = req.params;

      // Get draft
      const getDraftQuery = `
        SELECT id, itr_type, form_data, status
        FROM itr_drafts 
        WHERE id = $1 AND user_id = $2
      `;

      const draft = await pool.query(getDraftQuery, [draftId, userId]);

      if (draft.rows.length === 0) {
        return res.status(404).json({
          error: 'Draft not found',
        });
      }

      const formData = JSON.parse(draft.rows[0].form_data);
      const itrType = draft.rows[0].itr_type;

      // Compute tax
      const taxComputation = await this.taxComputationEngine.computeTax(itrType, formData);

      enterpriseLogger.info('Tax computation completed', {
        userId,
        draftId,
        itrType,
        totalTax: taxComputation.totalTax,
        refund: taxComputation.refund,
      });

      res.json({
        message: 'Tax computation completed',
        computation: taxComputation,
      });
    } catch (error) {
      enterpriseLogger.error('Tax computation failed', {
        error: error.message,
        userId: req.user?.userId,
        draftId: req.params.draftId,
      });
      res.status(500).json({
        error: 'Internal server error',
      });
    }
  }

  // =====================================================
  // SUBMIT ITR
  // =====================================================

  async submitITR(req, res) {
    try {
      const userId = req.user.userId;
      const { draftId } = req.params;

      // Get draft
      const getDraftQuery = `
        SELECT id, itr_type, form_data, status
        FROM itr_drafts 
        WHERE id = $1 AND user_id = $2
      `;

      const draft = await pool.query(getDraftQuery, [draftId, userId]);

      if (draft.rows.length === 0) {
        return res.status(404).json({
          error: 'Draft not found',
        });
      }

      if (draft.rows[0].status !== 'draft') {
        return res.status(400).json({
          error: 'Draft is not in draft status',
        });
      }

      const formData = JSON.parse(draft.rows[0].form_data);
      const itrType = draft.rows[0].itr_type;

      // Final validation
      const validation = this.validationEngine.validateAll(formData);
      if (!validation.isValid) {
        return res.status(400).json({
          error: 'Validation failed',
          details: validation.errors,
        });
      }

      // Compute final tax
      const taxComputation = await this.taxComputationEngine.computeTax(itrType, formData);

      // Create ITR filing record
      const createFilingQuery = `
        INSERT INTO itr_filings (user_id, itr_type, form_data, tax_computation, status, submitted_at)
        VALUES ($1, $2, $3, $4, 'submitted', NOW())
        RETURNING id, itr_type, status, submitted_at
      `;

      const filing = await pool.query(createFilingQuery, [
        userId,
        itrType,
        JSON.stringify(formData),
        JSON.stringify(taxComputation),
      ]);

      // Update draft status
      const updateDraftQuery = `
        UPDATE itr_drafts 
        SET status = 'submitted', updated_at = NOW()
        WHERE id = $1
      `;

      await pool.query(updateDraftQuery, [draftId]);

      enterpriseLogger.info('ITR submitted successfully', {
        userId,
        draftId,
        filingId: filing.rows[0].id,
        itrType,
      });

      // Send SSE notification for filing submission
      sseNotificationService.sendFilingStatusUpdate(userId, {
        id: filing.rows[0].id,
        itrType: filing.rows[0].itr_type,
        oldStatus: 'draft',
        newStatus: 'submitted',
        submittedAt: filing.rows[0].submitted_at,
      });

      res.status(201).json({
        message: 'ITR submitted successfully',
        filing: {
          id: filing.rows[0].id,
          itrType: filing.rows[0].itr_type,
          status: filing.rows[0].status,
          submittedAt: filing.rows[0].submitted_at,
        },
        taxComputation,
      });
    } catch (error) {
      enterpriseLogger.error('ITR submission failed', {
        error: error.message,
        userId: req.user?.userId,
        draftId: req.params.draftId,
      });
      res.status(500).json({
        error: 'Internal server error',
      });
    }
  }

  // =====================================================
  // GET USER DRAFTS
  // =====================================================

  async getUserDrafts(req, res) {
    try {
      const userId = req.user.userId;
      const { status } = req.query;

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

      query += ' ORDER BY d.created_at DESC';

      const drafts = await pool.query(query, params);

      res.json({
        drafts: drafts.rows.map(draft => ({
          id: draft.id,
          itrType: draft.itr_type,
          status: draft.status,
          createdAt: draft.created_at,
          updatedAt: draft.updated_at,
        })),
      });
    } catch (error) {
      enterpriseLogger.error('Get drafts failed', {
        error: error.message,
        userId: req.user?.userId,
      });
      res.status(500).json({
        error: 'Internal server error',
      });
    }
  }

  // =====================================================
  // GET USER FILINGS
  // =====================================================

  async getUserFilings(req, res) {
    try {
      const userId = req.user.userId;
      const { status } = req.query;

      let query = `
        SELECT id, itr_type, status, submitted_at, assessment_year
        FROM itr_filings 
        WHERE user_id = $1
      `;
      const params = [userId];

      if (status) {
        query += ' AND status = $2';
        params.push(status);
      }

      query += ' ORDER BY submitted_at DESC';

      const filings = await pool.query(query, params);

      res.json({
        filings: filings.rows.map(filing => ({
          id: filing.id,
          itrType: filing.itr_type,
          status: filing.status,
          submittedAt: filing.submitted_at,
          assessmentYear: filing.assessment_year,
        })),
      });
    } catch (error) {
      enterpriseLogger.error('Get filings failed', {
        error: error.message,
        userId: req.user?.userId,
      });
      res.status(500).json({
        error: 'Internal server error',
      });
    }
  }
}

module.exports = ITRController;