// =====================================================
// ITR CONTROLLER - CANONICAL FILING SYSTEM
// Handles create/validate/submit for all ITR types
// =====================================================

const { sequelize } = require('../config/database');
const { query: dbQuery } = require('../utils/dbQuery');
const enterpriseLogger = require('../utils/logger');
const validationEngine = require('../services/core/ValidationEngine');
const taxComputationEngine = require('../services/core/TaxComputationEngine');
const serviceTicketService = require('../services/business/ServiceTicketService');
const sseNotificationService = require('../services/utils/NotificationService');
const taxAuditChecker = require('../services/business/TaxAuditChecker');
const eVerificationService = require('../services/business/EVerificationService');
const refundTrackingService = require('../services/business/RefundTrackingService');
const dataMatchingService = require('../services/business/DataMatchingService');
const DiscrepancyResolution = require('../models/DiscrepancyResolution');
const wsManager = require('../services/websocket/WebSocketManager');

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

      const filing = await dbQuery(createFilingQuery, [
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

      const draft = await dbQuery(createDraftQuery, [
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

      // Validate formData is provided
      if (!formData || typeof formData !== 'object') {
        return res.status(400).json({
          error: 'formData is required and must be an object',
        });
      }

      // Get draft to determine ITR type (join with itr_filings to get user_id)
      const getDraftQuery = `
        SELECT d.id, f.itr_type
        FROM itr_drafts d
        JOIN itr_filings f ON d.filing_id = f.id
        WHERE d.id = $1 AND f.user_id = $2
      `;
      const draft = await dbQuery(getDraftQuery, [draftId, userId]);

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

      // Update draft (join with itr_filings to verify user_id)
      const updateDraftQuery = `
        UPDATE itr_drafts d
        SET data = $1, updated_at = NOW()
        FROM itr_filings f
        WHERE d.filing_id = f.id 
          AND d.id = $2 
          AND f.user_id = $3
        RETURNING d.id, f.itr_type, d.updated_at
      `;

      const result = await dbQuery(updateDraftQuery, [
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
        success: true,
        message: 'Draft updated successfully',
        draft: {
          id: result.rows[0].id,
          itrType: result.rows[0].itr_type,
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

      // Get draft (join with itr_filings to verify user_id and get itr_type)
      const getDraftQuery = `
        SELECT d.id, d.data, f.itr_type, f.status
        FROM itr_drafts d
        JOIN itr_filings f ON d.filing_id = f.id
        WHERE d.id = $1 AND f.user_id = $2
      `;

      const draft = await dbQuery(getDraftQuery, [draftId, userId]);

      if (draft.rows.length === 0) {
        return res.status(404).json({
          error: 'Draft not found',
        });
      }

      const draftRow = draft.rows[0];
      let formData;
      try {
        formData = draftRow.data ? (typeof draftRow.data === 'string' ? JSON.parse(draftRow.data) : draftRow.data) : {};
      } catch (parseError) {
        enterpriseLogger.error('Failed to parse draft data', {
          error: parseError.message,
          draftId,
          userId,
        });
        return res.status(500).json({
          error: 'Invalid draft data format',
        });
      }
      const itrType = draftRow.itr_type;
      const normalizedItrType = itrType.replace('-', '').toLowerCase();

      // Validate form data
      const validation = this.validationEngine.validateAll(formData, normalizedItrType);

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

      // Get draft (join with itr_filings to verify user_id and get itr_type)
      const getDraftQuery = `
        SELECT d.id, d.data, f.itr_type, f.status, f.assessment_year
        FROM itr_drafts d
        JOIN itr_filings f ON d.filing_id = f.id
        WHERE d.id = $1 AND f.user_id = $2
      `;

      const draft = await dbQuery(getDraftQuery, [draftId, userId]);

      if (draft.rows.length === 0) {
        return res.status(404).json({
          error: 'Draft not found',
        });
      }

      const draftRow = draft.rows[0];
      let formData;
      try {
        formData = draftRow.data ? (typeof draftRow.data === 'string' ? JSON.parse(draftRow.data) : draftRow.data) : {};
      } catch (parseError) {
        enterpriseLogger.error('Failed to parse draft data for tax computation', {
          error: parseError.message,
          draftId,
          userId,
        });
        return res.status(500).json({
          error: 'Invalid draft data format',
        });
      }
      const itrType = draftRow.itr_type;
      const assessmentYear = draftRow.assessment_year || '2024-25';

      // Compute tax
      // Prepare filing data with itrType
      const filingData = { ...formData, itrType };
      const taxComputation = await this.taxComputationEngine.computeTax(filingData, assessmentYear);

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

      // Get draft (join with itr_filings to verify user_id)
      const getDraftQuery = `
        SELECT d.id, d.data, f.itr_type, f.status
        FROM itr_drafts d
        JOIN itr_filings f ON d.filing_id = f.id
        WHERE d.id = $1 AND f.user_id = $2
      `;

      const draft = await dbQuery(getDraftQuery, [draftId, userId]);

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

      const draftData = draft.rows[0].data;
      const formData = typeof draftData === 'string' ? JSON.parse(draftData) : draftData;
      const itrType = draft.rows[0].itr_type;

      // Final validation
      const normalizedItrType = itrType.replace('-', '').toLowerCase();
      const validation = this.validationEngine.validateAll(formData, normalizedItrType);
      if (!validation.isValid) {
        return res.status(400).json({
          error: 'Validation failed',
          details: validation.errors,
        });
      }

      // ITR-specific validations
      const itrSpecificValidation = this.validationEngine.validateITRSpecific(itrType, formData);
      if (!itrSpecificValidation.isValid) {
        return res.status(400).json({
          error: 'ITR-specific validation failed',
          details: itrSpecificValidation.errors,
          warnings: itrSpecificValidation.warnings,
        });
      }

      // ITR-3 specific validations
      if (itrType === 'ITR-3' || itrType === 'ITR3') {
        // Check audit applicability
        const auditCheck = taxAuditChecker.checkAuditApplicability(formData);
        if (auditCheck.applicable) {
          // Validate audit report if applicable
          const auditValidation = taxAuditChecker.validateAuditReport(formData.auditInfo);
          if (!auditValidation.isValid) {
            return res.status(400).json({
              error: 'Audit information validation failed',
              details: auditValidation.errors,
              auditReasons: auditCheck.reasons,
            });
          }
        }

        // Validate balance sheet if maintained
        if (formData.balanceSheet?.hasBalanceSheet) {
          const assetsTotal = formData.balanceSheet.assets?.total || 0;
          const liabilitiesTotal = formData.balanceSheet.liabilities?.total || 0;
          if (Math.abs(assetsTotal - liabilitiesTotal) > 0.01) {
            return res.status(400).json({
              error: 'Balance sheet is not balanced',
              details: {
                assetsTotal,
                liabilitiesTotal,
                difference: Math.abs(assetsTotal - liabilitiesTotal),
              },
            });
          }
        }
      }

      // ITR-4 specific validations (presumptive taxation)
      if (itrType === 'ITR-4' || itrType === 'ITR4') {
        const businessIncome = formData.income?.businessIncome || formData.income?.presumptiveBusiness || 0;
        const professionalIncome = formData.income?.professionalIncome || formData.income?.presumptiveProfessional || 0;
        
        // Validate presumptive limits
        if (businessIncome > 2000000) {
          return res.status(400).json({
            error: 'ITR-4 business income cannot exceed ₹20 lakh. Please use ITR-3 for higher business income.',
          });
        }
        
        if (professionalIncome > 500000) {
          return res.status(400).json({
            error: 'ITR-4 professional income cannot exceed ₹5 lakh. Please use ITR-3 for higher professional income.',
          });
        }
      }

      // Compute final tax
      // Prepare filing data with itrType
      const filingData = { ...formData, itrType };
      const taxComputation = await this.taxComputationEngine.computeTax(filingData, formData.assessmentYear || '2024-25');

      // Create ITR filing record
      const createFilingQuery = `
        INSERT INTO itr_filings (user_id, itr_type, json_payload, status, submitted_at, assessment_year)
        VALUES ($1, $2, $3, 'submitted', NOW(), $4)
        RETURNING id, itr_type, status, submitted_at, assessment_year
      `;

      const assessmentYear = formData.assessmentYear || '2024-25';
      const filing = await dbQuery(createFilingQuery, [
        userId,
        itrType,
        JSON.stringify(formData),
        assessmentYear,
      ]);

      const filingId = filing.rows[0].id;

      // Update draft status
      const updateDraftQuery = `
        UPDATE itr_drafts 
        SET status = 'submitted', updated_at = NOW()
        WHERE id = $1
      `;

      await dbQuery(updateDraftQuery, [draftId]);

      // Create invoice draft if not exists
      let invoiceId = null;
      try {
        const checkInvoiceQuery = `
          SELECT id FROM invoices WHERE filing_id = $1
        `;
        const existingInvoice = await dbQuery(checkInvoiceQuery, [filingId]);

        if (existingInvoice.rows.length === 0) {
          // Generate invoice number
          const invoiceNumber = `INV-ITR-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
          const invoiceDate = new Date();
          const dueDate = new Date();
          dueDate.setDate(dueDate.getDate() + 30); // 30 days from now

          // Calculate invoice amount (default pricing - can be customized)
          const baseAmount = 500; // Base ITR filing fee
          const itrTypeMultiplier = {
            'ITR-1': 1,
            'ITR-2': 1.5,
            'ITR-3': 2,
            'ITR-4': 1.5,
          };
          const invoiceAmount = baseAmount * (itrTypeMultiplier[itrType] || 1);

          const createInvoiceQuery = `
            INSERT INTO invoices (
              user_id, filing_id, invoice_number, invoice_date, due_date,
              status, payment_status, subtotal, total_amount, currency, description
            )
            VALUES ($1, $2, $3, $4, $5, 'draft', 'pending', $6, $6, 'INR', $7)
            RETURNING id, invoice_number
          `;

          const invoice = await dbQuery(createInvoiceQuery, [
            userId,
            filingId,
            invoiceNumber,
            invoiceDate.toISOString().split('T')[0],
            dueDate.toISOString().split('T')[0],
            invoiceAmount,
            `ITR Filing for ${itrType} - Assessment Year ${assessmentYear}`,
          ]);

          invoiceId = invoice.rows[0].id;

          enterpriseLogger.info('Invoice draft created for filing', {
            filingId,
            invoiceId: invoice.rows[0].id,
            invoiceNumber: invoice.rows[0].invoice_number,
            amount: invoiceAmount,
          });
        } else {
          invoiceId = existingInvoice.rows[0].id;
        }
      } catch (invoiceError) {
        // Don't fail filing submission if invoice creation fails
        enterpriseLogger.error('Failed to create invoice for filing', {
          error: invoiceError.message,
          filingId,
          userId,
        });
      }

      enterpriseLogger.info('ITR submitted successfully', {
        userId,
        draftId,
        filingId,
        itrType,
        invoiceId,
      });

      // Send SSE notification for filing submission
      sseNotificationService.sendFilingStatusUpdate(userId, {
        id: filingId,
        itrType: filing.rows[0].itr_type,
        oldStatus: 'draft',
        newStatus: 'submitted',
        submittedAt: filing.rows[0].submitted_at,
      });

      // Broadcast WebSocket event for filing status change
      try {
        wsManager.broadcastToUser(userId, 'FILING_STATUS_CHANGE', {
          filingId,
          status: 'submitted',
          itrType,
          assessmentYear,
          showToast: false,
        });
        
        // Broadcast dashboard stats update
        wsManager.broadcastToUser(userId, 'DASHBOARD_STATS_UPDATE', {
          userId,
          showToast: false,
        });

        // Broadcast to admins
        wsManager.broadcastToAdmins('FILING_STATUS_CHANGE', {
          filingId,
          userId,
          status: 'submitted',
          itrType,
          assessmentYear,
          showToast: false,
        });
      } catch (wsError) {
        enterpriseLogger.warn('Failed to broadcast WebSocket event', {
          error: wsError.message,
          filingId,
        });
      }

      // Send submission confirmation email
      try {
        const EmailService = require('../services/integration/EmailService');
        
        // Get user email
        const getUserQuery = `SELECT email, full_name FROM users WHERE id = $1`;
        const userResult = await dbQuery(getUserQuery, [userId]);
        
        if (userResult.rows.length > 0 && userResult.rows[0].email) {
          const userEmail = userResult.rows[0].email;
          
          // Generate acknowledgment number (mock for now - would come from ERI in production)
          const acknowledgmentNumber = `ACK-${filingId}-${Date.now().toString().slice(-6)}`;
          
          // Update filing with acknowledgment number
          await dbQuery(
            `UPDATE itr_filings SET acknowledgment_number = $1 WHERE id = $2`,
            [acknowledgmentNumber, filingId]
          );
          
          // Generate download URL
          const downloadUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/filings/${filingId}/acknowledgment/pdf`;
          
          // Send email
          await EmailService.sendSubmissionConfirmationEmail(
            userEmail,
            filingId,
            acknowledgmentNumber,
            downloadUrl
          );
          
          enterpriseLogger.info('Submission confirmation email sent', {
            userId,
            filingId,
            email: userEmail,
          });
        }
      } catch (emailError) {
        // Don't fail submission if email fails
        enterpriseLogger.error('Failed to send submission confirmation email', {
          error: emailError.message,
          userId,
          filingId,
        });
      }

      res.status(201).json({
        message: 'ITR submitted successfully',
        filing: {
          id: filingId,
          itrType: filing.rows[0].itr_type,
          status: filing.rows[0].status,
          submittedAt: filing.rows[0].submitted_at,
          assessmentYear: filing.rows[0].assessment_year,
          invoiceId,
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
  // E-VERIFICATION METHODS
  // =====================================================

  async sendAadhaarOTP(req, res) {
    try {
      const userId = req.user.userId;
      const { draftId } = req.params;
      const { aadhaarNumber } = req.body;

      // Get draft and filing info
      const getDraftQuery = `
        SELECT d.id, f.id as filing_id, f.json_payload
        FROM itr_drafts d
        JOIN itr_filings f ON d.filing_id = f.id
        WHERE d.id = $1 AND f.user_id = $2
      `;

      const draft = await dbQuery(getDraftQuery, [draftId, userId]);

      if (draft.rows.length === 0) {
        return res.status(404).json({
          error: 'Draft not found',
        });
      }

      const formData = JSON.parse(draft.rows[0].json_payload || '{}');
      const pan = formData.personal_info?.pan || formData.personalInfo?.pan;

      if (!pan) {
        return res.status(400).json({
          error: 'PAN not found in filing data',
        });
      }

      const result = await eVerificationService.sendAadhaarOTP(pan, aadhaarNumber);

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      enterpriseLogger.error('Send Aadhaar OTP failed', {
        error: error.message,
        userId: req.user?.userId,
        draftId: req.params.draftId,
      });
      res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to send Aadhaar OTP',
      });
    }
  }

  async verifyAadhaarOTP(req, res) {
    try {
      const userId = req.user.userId;
      const { draftId } = req.params;
      const { aadhaarNumber, otp } = req.body;

      if (!otp || otp.length !== 6) {
        return res.status(400).json({
          error: 'Invalid OTP format. OTP must be 6 digits',
        });
      }

      // Get draft and filing info
      const getDraftQuery = `
        SELECT d.id, f.id as filing_id, f.json_payload
        FROM itr_drafts d
        JOIN itr_filings f ON d.filing_id = f.id
        WHERE d.id = $1 AND f.user_id = $2
      `;

      const draft = await dbQuery(getDraftQuery, [draftId, userId]);

      if (draft.rows.length === 0) {
        return res.status(404).json({
          error: 'Draft not found',
        });
      }

      const formData = JSON.parse(draft.rows[0].json_payload || '{}');
      const pan = formData.personal_info?.pan || formData.personalInfo?.pan;
      const filingId = draft.rows[0].filing_id;

      if (!pan) {
        return res.status(400).json({
          error: 'PAN not found in filing data',
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

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      enterpriseLogger.error('Verify Aadhaar OTP failed', {
        error: error.message,
        userId: req.user?.userId,
        draftId: req.params.draftId,
      });
      res.status(error.statusCode || 500).json({
        error: error.message || 'Aadhaar OTP verification failed',
      });
    }
  }

  async verifyNetBanking(req, res) {
    try {
      const userId = req.user.userId;
      const { draftId } = req.params;
      const { bankDetails, credentials } = req.body;

      if (!bankDetails || !credentials) {
        return res.status(400).json({
          error: 'Bank details and credentials are required',
        });
      }

      // Get draft and filing info
      const getDraftQuery = `
        SELECT d.id, f.id as filing_id, f.json_payload
        FROM itr_drafts d
        JOIN itr_filings f ON d.filing_id = f.id
        WHERE d.id = $1 AND f.user_id = $2
      `;

      const draft = await dbQuery(getDraftQuery, [draftId, userId]);

      if (draft.rows.length === 0) {
        return res.status(404).json({
          error: 'Draft not found',
        });
      }

      const formData = JSON.parse(draft.rows[0].json_payload || '{}');
      const pan = formData.personal_info?.pan || formData.personalInfo?.pan;
      const filingId = draft.rows[0].filing_id;

      if (!pan) {
        return res.status(400).json({
          error: 'PAN not found in filing data',
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

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      enterpriseLogger.error('Net Banking verification failed', {
        error: error.message,
        userId: req.user?.userId,
        draftId: req.params.draftId,
      });
      res.status(error.statusCode || 500).json({
        error: error.message || 'Net Banking verification failed',
      });
    }
  }

  async verifyDSC(req, res) {
    try {
      const userId = req.user.userId;
      const { draftId } = req.params;
      const { dscDetails } = req.body;

      if (!dscDetails) {
        return res.status(400).json({
          error: 'DSC details are required',
        });
      }

      // Get draft and filing info
      const getDraftQuery = `
        SELECT d.id, f.id as filing_id, f.json_payload
        FROM itr_drafts d
        JOIN itr_filings f ON d.filing_id = f.id
        WHERE d.id = $1 AND f.user_id = $2
      `;

      const draft = await dbQuery(getDraftQuery, [draftId, userId]);

      if (draft.rows.length === 0) {
        return res.status(404).json({
          error: 'Draft not found',
        });
      }

      const formData = JSON.parse(draft.rows[0].json_payload || '{}');
      const pan = formData.personal_info?.pan || formData.personalInfo?.pan;
      const filingId = draft.rows[0].filing_id;

      if (!pan) {
        return res.status(400).json({
          error: 'PAN not found in filing data',
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

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      enterpriseLogger.error('DSC verification failed', {
        error: error.message,
        userId: req.user?.userId,
        draftId: req.params.draftId,
      });
      res.status(error.statusCode || 500).json({
        error: error.message || 'DSC verification failed',
      });
    }
  }

  async verifyDemat(req, res) {
    try {
      const userId = req.user.userId;
      const { draftId } = req.params;
      const { dematCredentials } = req.body;

      if (!dematCredentials || !dematCredentials.dpId || !dematCredentials.clientId) {
        return res.status(400).json({
          error: 'DP ID and Client ID are required',
        });
      }

      // Get draft and filing info
      const getDraftQuery = `
        SELECT d.id, f.id as filing_id, f.json_payload
        FROM itr_drafts d
        JOIN itr_filings f ON d.filing_id = f.id
        WHERE d.id = $1 AND f.user_id = $2
      `;

      const draft = await dbQuery(getDraftQuery, [draftId, userId]);

      if (draft.rows.length === 0) {
        return res.status(404).json({
          error: 'Draft not found',
        });
      }

      const formData = JSON.parse(draft.rows[0].json_payload || '{}');
      const pan = formData.personal_info?.pan || formData.personalInfo?.pan;
      const filingId = draft.rows[0].filing_id;

      if (!pan) {
        return res.status(400).json({
          error: 'PAN not found in filing data',
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

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      enterpriseLogger.error('Demat verification failed', {
        error: error.message,
        userId: req.user?.userId,
        draftId: req.params.draftId,
      });
      res.status(error.statusCode || 500).json({
        error: error.message || 'Demat verification failed',
      });
    }
  }

  async sendBankEVC(req, res) {
    try {
      const userId = req.user.userId;
      const { draftId } = req.params;
      const { bankDetails } = req.body;

      if (!bankDetails || !bankDetails.accountNumber || !bankDetails.ifsc) {
        return res.status(400).json({
          error: 'Account number and IFSC code are required',
        });
      }

      // Get draft and filing info
      const getDraftQuery = `
        SELECT d.id, f.id as filing_id, f.json_payload
        FROM itr_drafts d
        JOIN itr_filings f ON d.filing_id = f.id
        WHERE d.id = $1 AND f.user_id = $2
      `;

      const draft = await dbQuery(getDraftQuery, [draftId, userId]);

      if (draft.rows.length === 0) {
        return res.status(404).json({
          error: 'Draft not found',
        });
      }

      const formData = JSON.parse(draft.rows[0].json_payload || '{}');
      const pan = formData.personal_info?.pan || formData.personalInfo?.pan;

      if (!pan) {
        return res.status(400).json({
          error: 'PAN not found in filing data',
        });
      }

      const result = await eVerificationService.sendBankEVC(pan, bankDetails);

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      enterpriseLogger.error('Send Bank EVC failed', {
        error: error.message,
        userId: req.user?.userId,
        draftId: req.params.draftId,
      });
      res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to send Bank EVC',
      });
    }
  }

  async verifyBankEVC(req, res) {
    try {
      const userId = req.user.userId;
      const { draftId } = req.params;
      const { bankDetails, evc } = req.body;

      if (!evc || evc.length !== 6) {
        return res.status(400).json({
          error: 'Invalid EVC format. EVC must be 6 digits',
        });
      }

      if (!bankDetails || !bankDetails.accountNumber || !bankDetails.ifsc) {
        return res.status(400).json({
          error: 'Account number and IFSC code are required',
        });
      }

      // Get draft and filing info
      const getDraftQuery = `
        SELECT d.id, f.id as filing_id, f.json_payload
        FROM itr_drafts d
        JOIN itr_filings f ON d.filing_id = f.id
        WHERE d.id = $1 AND f.user_id = $2
      `;

      const draft = await dbQuery(getDraftQuery, [draftId, userId]);

      if (draft.rows.length === 0) {
        return res.status(404).json({
          error: 'Draft not found',
        });
      }

      const formData = JSON.parse(draft.rows[0].json_payload || '{}');
      const pan = formData.personal_info?.pan || formData.personalInfo?.pan;
      const filingId = draft.rows[0].filing_id;

      if (!pan) {
        return res.status(400).json({
          error: 'PAN not found in filing data',
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

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      enterpriseLogger.error('Bank EVC verification failed', {
        error: error.message,
        userId: req.user?.userId,
        draftId: req.params.draftId,
      });
      res.status(error.statusCode || 500).json({
        error: error.message || 'Bank EVC verification failed',
      });
    }
  }

  async getVerificationStatus(req, res) {
    try {
      const userId = req.user.userId;
      const { filingId } = req.params;

      // Verify filing belongs to user
      const verifyQuery = `
        SELECT id FROM itr_filings WHERE id = $1 AND user_id = $2
      `;
      const verify = await dbQuery(verifyQuery, [filingId, userId]);

      if (verify.rows.length === 0) {
        return res.status(404).json({
          error: 'Filing not found',
        });
      }

      const status = await eVerificationService.getVerificationStatus(filingId);

      res.json({
        success: true,
        verification: status,
      });
    } catch (error) {
      enterpriseLogger.error('Get verification status failed', {
        error: error.message,
        userId: req.user?.userId,
        filingId: req.params.filingId,
      });
      res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to get verification status',
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

      const drafts = await dbQuery(query, params);

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
      const userRole = req.user.role || 'END_USER';
      const { status } = req.query;

      // Get user details for role-based filtering
      const User = require('../models/User');
      const user = await User.findByPk(userId);

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

      res.json({
        filings: formattedFilings,
      });
    } catch (error) {
      enterpriseLogger.error('Get filings failed', {
        error: error.message,
        userId: req.user?.userId,
        stack: error.stack,
      });
      res.status(500).json({
        error: 'Internal server error',
      });
    }
  }

  // =====================================================
  // PAUSE FILING
  // =====================================================

  async pauseFiling(req, res) {
    try {
      const userId = req.user.userId;
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
        return res.status(404).json({
          error: 'Filing not found',
        });
      }

      const filingData = filing.rows[0];

      // Check if filing can be paused
      if (!['draft'].includes(filingData.status)) {
        return res.status(400).json({
          error: `Filing cannot be paused. Current status: ${filingData.status}`,
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

      res.json({
        success: true,
        message: 'Filing paused successfully',
        filing: {
          id: result.rows[0].id,
          status: result.rows[0].status,
          pausedAt: result.rows[0].paused_at,
          pauseReason: result.rows[0].pause_reason,
        },
      });
    } catch (error) {
      enterpriseLogger.error('Pause filing failed', {
        error: error.message,
        userId: req.user?.userId,
        filingId: req.params.filingId,
        stack: error.stack,
      });
      res.status(500).json({
        error: 'Internal server error',
      });
    }
  }

  // =====================================================
  // RESUME FILING
  // =====================================================

  async resumeFiling(req, res) {
    try {
      const userId = req.user.userId;
      const { filingId } = req.params;

      // Get filing
      const getFilingQuery = `
        SELECT id, user_id, status, json_payload
        FROM itr_filings 
        WHERE id = $1 AND user_id = $2
      `;

      const filing = await dbQuery(getFilingQuery, [filingId, userId]);

      if (filing.rows.length === 0) {
        return res.status(404).json({
          error: 'Filing not found',
        });
      }

      const filingData = filing.rows[0];

      // Check if filing can be resumed
      if (filingData.status !== 'paused') {
        return res.status(400).json({
          error: `Filing cannot be resumed. Current status: ${filingData.status}`,
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

      res.json({
        success: true,
        message: 'Filing resumed successfully',
        filing: {
          id: result.rows[0].id,
          status: result.rows[0].status,
          resumedAt: result.rows[0].resumed_at,
          formData: filingData.json_payload ? JSON.parse(filingData.json_payload) : null,
        },
      });
    } catch (error) {
      enterpriseLogger.error('Resume filing failed', {
        error: error.message,
        userId: req.user?.userId,
        filingId: req.params.filingId,
        stack: error.stack,
      });
      res.status(500).json({
        error: 'Internal server error',
      });
    }
  }

  // =====================================================
  // REFUND TRACKING METHODS
  // =====================================================

  async getRefundStatus(req, res) {
    try {
      const userId = req.user.userId;
      const { filingId } = req.params;

      // Verify filing belongs to user
      const verifyQuery = `
        SELECT id FROM itr_filings WHERE id = $1 AND user_id = $2
      `;
      const verify = await dbQuery(verifyQuery, [filingId, userId]);

      if (verify.rows.length === 0) {
        return res.status(404).json({
          error: 'Filing not found',
        });
      }

      const refundStatus = await refundTrackingService.getRefundStatus(filingId);

      res.json({
        success: true,
        refund: refundStatus,
      });
    } catch (error) {
      enterpriseLogger.error('Get refund status failed', {
        error: error.message,
        userId: req.user?.userId,
        filingId: req.params.filingId,
      });
      res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to get refund status',
      });
    }
  }

  async getRefundHistory(req, res) {
    try {
      const userId = req.user.userId;
      const { assessmentYear } = req.query;

      const refundHistory = await refundTrackingService.getRefundHistory(userId, assessmentYear);

      res.json({
        success: true,
        refunds: refundHistory,
      });
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
        return res.json({
          success: true,
          refunds: [],
        });
      }

      enterpriseLogger.error('Get refund history failed', {
        error: error.message,
        userId: req.user?.userId,
      });
      res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to get refund history',
      });
    }
  }

  async updateRefundBankAccount(req, res) {
    try {
      const userId = req.user.userId;
      const { filingId } = req.params;
      const { bankAccount } = req.body;

      if (!bankAccount) {
        return res.status(400).json({
          error: 'Bank account details are required',
        });
      }

      // Verify filing belongs to user
      const verifyQuery = `
        SELECT id FROM itr_filings WHERE id = $1 AND user_id = $2
      `;
      const verify = await dbQuery(verifyQuery, [filingId, userId]);

      if (verify.rows.length === 0) {
        return res.status(404).json({
          error: 'Filing not found',
        });
      }

      const refundStatus = await refundTrackingService.updateRefundBankAccount(filingId, bankAccount);

      res.json({
        success: true,
        refund: refundStatus,
      });
    } catch (error) {
      enterpriseLogger.error('Update refund bank account failed', {
        error: error.message,
        userId: req.user?.userId,
        filingId: req.params.filingId,
      });
      res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to update refund bank account',
      });
    }
  }

  async requestRefundReissue(req, res) {
    try {
      const userId = req.user.userId;
      const { filingId } = req.params;
      const { reason, bankAccount } = req.body;

      // Verify filing belongs to user
      const verifyQuery = `
        SELECT id FROM itr_filings WHERE id = $1 AND user_id = $2
      `;
      const verify = await dbQuery(verifyQuery, [filingId, userId]);

      if (verify.rows.length === 0) {
        return res.status(404).json({
          error: 'Filing not found',
        });
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

      res.json({
        success: true,
        message: 'Refund re-issue request submitted successfully',
        refund: refundStatus,
      });
    } catch (error) {
      enterpriseLogger.error('Request refund reissue failed', {
        error: error.message,
        userId: req.user?.userId,
        filingId: req.params.filingId,
      });
      res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to request refund reissue',
      });
    }
  }

  // =====================================================
  // DISCREPANCY HANDLING METHODS
  // =====================================================

  async getDiscrepancies(req, res) {
    try {
      const userId = req.user.userId;
      const { filingId } = req.params;

      // Verify filing belongs to user
      const verifyQuery = `
        SELECT id, json_payload FROM itr_filings WHERE id = $1 AND user_id = $2
      `;
      const verify = await dbQuery(verifyQuery, [filingId, userId]);

      if (verify.rows.length === 0) {
        return res.status(404).json({
          error: 'Filing not found',
        });
      }

      const formData = JSON.parse(verify.rows[0].json_payload || '{}');
      
      // Get uploaded data (would come from document uploads)
      const uploadedData = formData.uploadedData || {};

      // Compare data
      const discrepancies = dataMatchingService.compareData(formData, uploadedData, 'income');
      
      // Group discrepancies
      const grouped = dataMatchingService.groupDiscrepancies(discrepancies);

      res.json({
        success: true,
        discrepancies,
        grouped,
        summary: {
          total: discrepancies.length,
          critical: discrepancies.filter(d => d.severity === 'critical').length,
          warning: discrepancies.filter(d => d.severity === 'warning').length,
          info: discrepancies.filter(d => d.severity === 'info').length,
        },
      });
    } catch (error) {
      enterpriseLogger.error('Get discrepancies failed', {
        error: error.message,
        userId: req.user?.userId,
        filingId: req.params.filingId,
      });
      res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to get discrepancies',
      });
    }
  }

  async resolveDiscrepancy(req, res) {
    try {
      const userId = req.user.userId;
      const { filingId } = req.params;
      const { discrepancyId, fieldPath, resolutionAction, resolvedValue, explanation } = req.body;

      // Verify filing belongs to user
      const verifyQuery = `
        SELECT id FROM itr_filings WHERE id = $1 AND user_id = $2
      `;
      const verify = await dbQuery(verifyQuery, [filingId, userId]);

      if (verify.rows.length === 0) {
        return res.status(404).json({
          error: 'Filing not found',
        });
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

      res.json({
        success: true,
        resolution,
      });
    } catch (error) {
      enterpriseLogger.error('Resolve discrepancy failed', {
        error: error.message,
        userId: req.user?.userId,
        filingId: req.params.filingId,
      });
      res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to resolve discrepancy',
      });
    }
  }

  async bulkResolveDiscrepancies(req, res) {
    try {
      const userId = req.user.userId;
      const { filingId } = req.params;
      const { discrepancyIds, resolutionAction, resolvedValue, explanation } = req.body;

      // Verify filing belongs to user
      const verifyQuery = `
        SELECT id FROM itr_filings WHERE id = $1 AND user_id = $2
      `;
      const verify = await dbQuery(verifyQuery, [filingId, userId]);

      if (verify.rows.length === 0) {
        return res.status(404).json({
          error: 'Filing not found',
        });
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

      res.json({
        success: true,
        resolved: resolutions,
        failed: result.failed,
        totalResolved: result.totalResolved,
      });
    } catch (error) {
      enterpriseLogger.error('Bulk resolve discrepancies failed', {
        error: error.message,
        userId: req.user?.userId,
        filingId: req.params.filingId,
      });
      res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to bulk resolve discrepancies',
      });
    }
  }

  async getDiscrepancySuggestions(req, res) {
    try {
      const userId = req.user.userId;
      const { filingId } = req.params;

      // Verify filing belongs to user
      const verifyQuery = `
        SELECT id, json_payload FROM itr_filings WHERE id = $1 AND user_id = $2
      `;
      const verify = await dbQuery(verifyQuery, [filingId, userId]);

      if (verify.rows.length === 0) {
        return res.status(404).json({
          error: 'Filing not found',
        });
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

      res.json({
        success: true,
        suggestions,
      });
    } catch (error) {
      enterpriseLogger.error('Get discrepancy suggestions failed', {
        error: error.message,
        userId: req.user?.userId,
        filingId: req.params.filingId,
      });
      res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to get discrepancy suggestions',
      });
    }
  }

  async getDiscrepancyHistory(req, res) {
    try {
      const userId = req.user.userId;
      const { filingId } = req.params;

      // Verify filing belongs to user
      const verifyQuery = `
        SELECT id FROM itr_filings WHERE id = $1 AND user_id = $2
      `;
      const verify = await dbQuery(verifyQuery, [filingId, userId]);

      if (verify.rows.length === 0) {
        return res.status(404).json({
          error: 'Filing not found',
        });
      }

      const history = await dataMatchingService.getDiscrepancyHistory(filingId);

      res.json({
        success: true,
        history,
      });
    } catch (error) {
      enterpriseLogger.error('Get discrepancy history failed', {
        error: error.message,
        userId: req.user?.userId,
        filingId: req.params.filingId,
      });
      res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to get discrepancy history',
      });
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
      const userId = req.user.userId;
      const { memberId, currentAssessmentYear } = req.query;

      const previousYearCopyService = require('../services/business/PreviousYearCopyService');

      const previousYears = await previousYearCopyService.getAvailablePreviousYears(
        userId,
        memberId || null,
        currentAssessmentYear || '2024-25'
      );

      res.status(200).json({
        success: true,
        previousYears,
        count: previousYears.length,
      });
    } catch (error) {
      enterpriseLogger.error('Get available previous years failed', {
        error: error.message,
        userId: req.user?.userId,
      });
      res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to get available previous years',
      });
    }
  }

  /**
   * Get previous year data for preview
   * GET /api/itr/previous-years/:filingId
   */
  async getPreviousYearData(req, res) {
    try {
      const userId = req.user.userId;
      const { filingId } = req.params;

      const previousYearCopyService = require('../services/business/PreviousYearCopyService');

      // Verify user owns this filing
      const verifyQuery = `
        SELECT user_id FROM itr_filings WHERE id = $1
      `;
      const verifyResult = await dbQuery(verifyQuery, [filingId]);

      if (verifyResult.rows.length === 0) {
        return res.status(404).json({
          error: 'Previous year filing not found',
        });
      }

      if (verifyResult.rows[0].user_id !== userId) {
        return res.status(403).json({
          error: 'Unauthorized access to this filing',
        });
      }

      const previousYearData = await previousYearCopyService.getPreviousYearData(filingId);

      res.status(200).json({
        success: true,
        data: previousYearData,
      });
    } catch (error) {
      enterpriseLogger.error('Get previous year data failed', {
        error: error.message,
        userId: req.user?.userId,
        filingId: req.params.filingId,
      });
      res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to get previous year data',
      });
    }
  }

  /**
   * Copy data from previous year to current filing
   * POST /api/itr/filings/:filingId/copy-from-previous
   */
  async copyFromPreviousYear(req, res) {
    try {
      const userId = req.user.userId;
      const { filingId } = req.params;
      const { sourceFilingId, sections, reviewData } = req.body;

      // Validate required fields
      if (!sourceFilingId || !sections || !Array.isArray(sections)) {
        return res.status(400).json({
          error: 'Missing required fields: sourceFilingId and sections array',
        });
      }

      // Verify user owns target filing
      const verifyTargetQuery = `
        SELECT user_id, status FROM itr_filings WHERE id = $1
      `;
      const verifyTargetResult = await dbQuery(verifyTargetQuery, [filingId]);

      if (verifyTargetResult.rows.length === 0) {
        return res.status(404).json({
          error: 'Target filing not found',
        });
      }

      if (verifyTargetResult.rows[0].user_id !== userId) {
        return res.status(403).json({
          error: 'Unauthorized access to target filing',
        });
      }

      // Check if target filing can be modified
      const targetStatus = verifyTargetResult.rows[0].status;
      if (!['draft', 'paused', 'rejected'].includes(targetStatus)) {
        return res.status(400).json({
          error: 'Cannot copy to a filing that is already submitted',
        });
      }

      // If source is not 'eri', verify user owns source filing
      if (sourceFilingId !== 'eri') {
        const verifySourceQuery = `
          SELECT user_id FROM itr_filings WHERE id = $1
        `;
        const verifySourceResult = await dbQuery(verifySourceQuery, [sourceFilingId]);

        if (verifySourceResult.rows.length === 0) {
          return res.status(404).json({
            error: 'Source filing not found',
          });
        }

        if (verifySourceResult.rows[0].user_id !== userId) {
          return res.status(403).json({
            error: 'Unauthorized access to source filing',
          });
        }
      }

      const previousYearCopyService = require('../services/business/PreviousYearCopyService');

      const result = await previousYearCopyService.applyCopy(
        filingId,
        sourceFilingId,
        sections,
        reviewData || null
      );

      res.status(200).json({
        success: true,
        message: 'Data copied successfully',
        ...result,
      });
    } catch (error) {
      enterpriseLogger.error('Copy from previous year failed', {
        error: error.message,
        userId: req.user?.userId,
        filingId: req.params.filingId,
      });
      res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to copy from previous year',
      });
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
      const userId = req.user.userId;
      const { filingId } = req.params;
      const challanData = req.body;

      const taxPaymentService = require('../services/business/TaxPaymentService');

      // Verify user owns this filing
      const verifyQuery = `
        SELECT user_id FROM itr_filings WHERE id = $1
      `;
      const verifyResult = await dbQuery(verifyQuery, [filingId]);

      if (verifyResult.rows.length === 0) {
        return res.status(404).json({
          error: 'Filing not found',
        });
      }

      if (verifyResult.rows[0].user_id !== userId) {
        return res.status(403).json({
          error: 'Unauthorized access to filing',
        });
      }

      const result = await taxPaymentService.generateChallan(filingId, challanData);

      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      enterpriseLogger.error('Generate challan failed', {
        error: error.message,
        userId: req.user?.userId,
        filingId: req.params.filingId,
      });
      res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to generate challan',
      });
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
      const userId = req.user.userId;
      const { filingId } = req.params;

      const ForeignAssetsService = require('../services/business/ForeignAssetsService');

      // Verify user owns this filing
      const verifyQuery = `
        SELECT user_id, itr_type FROM itr_filings WHERE id = $1
      `;
      const verifyResult = await dbQuery(verifyQuery, [filingId]);

      if (verifyResult.rows.length === 0) {
        return res.status(404).json({
          error: 'Filing not found',
        });
      }

      if (verifyResult.rows[0].user_id !== userId) {
        return res.status(403).json({
          error: 'Unauthorized access to filing',
        });
      }

      // Validate ITR type - Foreign Assets are allowed for ITR-2 and ITR-3
      const itrType = verifyResult.rows[0].itr_type;
      if (itrType !== 'ITR-2' && itrType !== 'ITR2' && itrType !== 'ITR-3' && itrType !== 'ITR3') {
        return res.status(400).json({
          error: `Foreign assets are not applicable for ${itrType}. This feature is only available for ITR-2 and ITR-3.`,
        });
      }

      const result = await ForeignAssetsService.getForeignAssets(filingId);

      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      enterpriseLogger.error('Get foreign assets failed', {
        error: error.message,
        userId: req.user?.userId,
        filingId: req.params.filingId,
      });
      res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to get foreign assets',
      });
    }
  }

  /**
   * Add foreign asset
   * POST /api/itr/filings/:filingId/foreign-assets
   */
  async addForeignAsset(req, res) {
    try {
      const userId = req.user.userId;
      const { filingId } = req.params;
      const assetData = req.body;

      const ForeignAssetsService = require('../services/business/ForeignAssetsService');

      // Verify user owns this filing
      const verifyQuery = `
        SELECT user_id, itr_type FROM itr_filings WHERE id = $1
      `;
      const verifyResult = await dbQuery(verifyQuery, [filingId]);

      if (verifyResult.rows.length === 0) {
        return res.status(404).json({
          error: 'Filing not found',
        });
      }

      if (verifyResult.rows[0].user_id !== userId) {
        return res.status(403).json({
          error: 'Unauthorized access to filing',
        });
      }

      // Validate ITR type - Foreign Assets are allowed for ITR-2 and ITR-3
      const itrType = verifyResult.rows[0].itr_type;
      if (itrType !== 'ITR-2' && itrType !== 'ITR2' && itrType !== 'ITR-3' && itrType !== 'ITR3') {
        return res.status(400).json({
          error: `Foreign assets are not applicable for ${itrType}. This feature is only available for ITR-2 and ITR-3.`,
        });
      }

      const result = await ForeignAssetsService.addForeignAsset(filingId, userId, assetData);

      res.status(201).json({
        success: true,
        ...result,
      });
    } catch (error) {
      enterpriseLogger.error('Add foreign asset failed', {
        error: error.message,
        userId: req.user?.userId,
        filingId: req.params.filingId,
      });
      res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to add foreign asset',
      });
    }
  }

  /**
   * Update foreign asset
   * PUT /api/itr/filings/:filingId/foreign-assets/:assetId
   */
  async updateForeignAsset(req, res) {
    try {
      const userId = req.user.userId;
      const { filingId, assetId } = req.params;
      const assetData = req.body;

      const ForeignAssetsService = require('../services/business/ForeignAssetsService');

      // Verify user owns this filing
      const verifyQuery = `
        SELECT user_id, itr_type FROM itr_filings WHERE id = $1
      `;
      const verifyResult = await dbQuery(verifyQuery, [filingId]);

      if (verifyResult.rows.length === 0) {
        return res.status(404).json({
          error: 'Filing not found',
        });
      }

      if (verifyResult.rows[0].user_id !== userId) {
        return res.status(403).json({
          error: 'Unauthorized access to filing',
        });
      }

      // Validate ITR type - Foreign Assets are allowed for ITR-2 and ITR-3
      const itrType = verifyResult.rows[0].itr_type;
      if (itrType !== 'ITR-2' && itrType !== 'ITR2' && itrType !== 'ITR-3' && itrType !== 'ITR3') {
        return res.status(400).json({
          error: `Foreign assets are not applicable for ${itrType}. This feature is only available for ITR-2 and ITR-3.`,
        });
      }

      const result = await ForeignAssetsService.updateForeignAsset(assetId, userId, assetData);

      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      enterpriseLogger.error('Update foreign asset failed', {
        error: error.message,
        userId: req.user?.userId,
        filingId: req.params.filingId,
        assetId: req.params.assetId,
      });
      res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to update foreign asset',
      });
    }
  }

  /**
   * Delete foreign asset
   * DELETE /api/itr/filings/:filingId/foreign-assets/:assetId
   */
  async deleteForeignAsset(req, res) {
    try {
      const userId = req.user.userId;
      const { filingId, assetId } = req.params;

      const ForeignAssetsService = require('../services/business/ForeignAssetsService');

      // Verify user owns this filing
      const verifyQuery = `
        SELECT user_id, itr_type FROM itr_filings WHERE id = $1
      `;
      const verifyResult = await dbQuery(verifyQuery, [filingId]);

      if (verifyResult.rows.length === 0) {
        return res.status(404).json({
          error: 'Filing not found',
        });
      }

      if (verifyResult.rows[0].user_id !== userId) {
        return res.status(403).json({
          error: 'Unauthorized access to filing',
        });
      }

      // Validate ITR type - Foreign Assets are allowed for ITR-2 and ITR-3
      const itrType = verifyResult.rows[0].itr_type;
      if (itrType !== 'ITR-2' && itrType !== 'ITR2' && itrType !== 'ITR-3' && itrType !== 'ITR3') {
        return res.status(400).json({
          error: `Foreign assets are not applicable for ${itrType}. This feature is only available for ITR-2 and ITR-3.`,
        });
      }

      const result = await ForeignAssetsService.deleteForeignAsset(assetId, userId);

      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      enterpriseLogger.error('Delete foreign asset failed', {
        error: error.message,
        userId: req.user?.userId,
        filingId: req.params.filingId,
        assetId: req.params.assetId,
      });
      res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to delete foreign asset',
      });
    }
  }

  /**
   * Upload foreign asset document
   * POST /api/itr/filings/:filingId/foreign-assets/:assetId/documents
   */
  async uploadForeignAssetDocument(req, res) {
    try {
      const userId = req.user.userId;
      const { filingId, assetId } = req.params;
      const { documentUrl, documentType } = req.body;

      const ForeignAsset = require('../models/ForeignAsset');

      // Verify user owns this filing
      const verifyQuery = `
        SELECT user_id FROM itr_filings WHERE id = $1
      `;
      const verifyResult = await dbQuery(verifyQuery, [filingId]);

      if (verifyResult.rows.length === 0) {
        return res.status(404).json({
          error: 'Filing not found',
        });
      }

      if (verifyResult.rows[0].user_id !== userId) {
        return res.status(403).json({
          error: 'Unauthorized access to filing',
        });
      }

      // Get asset and verify ownership
      const asset = await ForeignAsset.findByPk(assetId);
      if (!asset || asset.filingId !== filingId) {
        return res.status(404).json({
          error: 'Foreign asset not found',
        });
      }

      if (asset.userId !== userId) {
        return res.status(403).json({
          error: 'Unauthorized access to asset',
        });
      }

      // Add document
      await asset.addDocument(documentUrl, documentType);

      res.status(200).json({
        success: true,
        message: 'Document uploaded successfully',
        asset: {
          id: asset.id,
          supportingDocuments: asset.supportingDocuments,
        },
      });
    } catch (error) {
      enterpriseLogger.error('Upload foreign asset document failed', {
        error: error.message,
        userId: req.user?.userId,
        filingId: req.params.filingId,
        assetId: req.params.assetId,
      });
      res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to upload document',
      });
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
      const userId = req.user.userId;
      const { filingId } = req.params;
      const { scenario, baseFormData } = req.body;

      const TaxSimulationService = require('../services/business/TaxSimulationService');

      // Verify user owns this filing
      const verifyQuery = `
        SELECT user_id FROM itr_filings WHERE id = $1
      `;
      const verifyResult = await dbQuery(verifyQuery, [filingId]);

      if (verifyResult.rows.length === 0) {
        return res.status(404).json({
          error: 'Filing not found',
        });
      }

      if (verifyResult.rows[0].user_id !== userId) {
        return res.status(403).json({
          error: 'Unauthorized access to filing',
        });
      }

      const result = await TaxSimulationService.simulateScenario(filingId, scenario);

      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      enterpriseLogger.error('Simulate tax scenario failed', {
        error: error.message,
        userId: req.user?.userId,
        filingId: req.params.filingId,
      });
      res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to simulate scenario',
      });
    }
  }

  /**
   * Compare multiple scenarios
   * POST /api/itr/filings/:filingId/compare-scenarios
   */
  async compareScenarios(req, res) {
    try {
      const userId = req.user.userId;
      const { filingId } = req.params;
      const { scenarios } = req.body;

      const TaxSimulationService = require('../services/business/TaxSimulationService');

      // Verify user owns this filing
      const verifyQuery = `
        SELECT user_id FROM itr_filings WHERE id = $1
      `;
      const verifyResult = await dbQuery(verifyQuery, [filingId]);

      if (verifyResult.rows.length === 0) {
        return res.status(404).json({
          error: 'Filing not found',
        });
      }

      if (verifyResult.rows[0].user_id !== userId) {
        return res.status(403).json({
          error: 'Unauthorized access to filing',
        });
      }

      const result = await TaxSimulationService.compareScenarios(filingId, scenarios);

      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      enterpriseLogger.error('Compare scenarios failed', {
        error: error.message,
        userId: req.user?.userId,
        filingId: req.params.filingId,
      });
      res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to compare scenarios',
      });
    }
  }

  /**
   * Apply simulation to actual filing
   * POST /api/itr/filings/:filingId/apply-simulation
   */
  async applySimulation(req, res) {
    try {
      const userId = req.user.userId;
      const { filingId } = req.params;
      const { scenarioId, changes } = req.body;

      const TaxSimulationService = require('../services/business/TaxSimulationService');

      // Verify user owns this filing
      const verifyQuery = `
        SELECT user_id FROM itr_filings WHERE id = $1
      `;
      const verifyResult = await dbQuery(verifyQuery, [filingId]);

      if (verifyResult.rows.length === 0) {
        return res.status(404).json({
          error: 'Filing not found',
        });
      }

      if (verifyResult.rows[0].user_id !== userId) {
        return res.status(403).json({
          error: 'Unauthorized access to filing',
        });
      }

      const result = await TaxSimulationService.applySimulation(filingId, scenarioId, changes);

      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      enterpriseLogger.error('Apply simulation failed', {
        error: error.message,
        userId: req.user?.userId,
        filingId: req.params.filingId,
      });
      res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to apply simulation',
      });
    }
  }

  /**
   * Get optimization opportunities
   * GET /api/itr/filings/:filingId/optimization-opportunities
   */
  async getOptimizationOpportunities(req, res) {
    try {
      const userId = req.user.userId;
      const { filingId } = req.params;

      const TaxSimulationService = require('../services/business/TaxSimulationService');
      const ITRFiling = require('../models/ITRFiling');

      // Verify user owns this filing
      const verifyQuery = `
        SELECT user_id FROM itr_filings WHERE id = $1
      `;
      const verifyResult = await dbQuery(verifyQuery, [filingId]);

      if (verifyResult.rows.length === 0) {
        return res.status(404).json({
          error: 'Filing not found',
        });
      }

      if (verifyResult.rows[0].user_id !== userId) {
        return res.status(403).json({
          error: 'Unauthorized access to filing',
        });
      }

      // Get filing data
      const filing = await ITRFiling.findByPk(filingId);
      const formData = filing.jsonPayload || {};
      const itrType = filing.itrType || 'ITR-1';

      const result = await TaxSimulationService.getOptimizationOpportunities(formData, itrType);

      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      enterpriseLogger.error('Get optimization opportunities failed', {
        error: error.message,
        userId: req.user?.userId,
        filingId: req.params.filingId,
      });
      res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to get optimization opportunities',
      });
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
      const userId = req.user.userId;
      const { draftId } = req.params;

      const PDFGenerationService = require('../services/core/PDFGenerationService');
      const ITRFiling = require('../models/ITRFiling');
      const Draft = require('../models/Draft');

      // Get draft
      const draft = await Draft.findByPk(draftId);
      if (!draft) {
        return res.status(404).json({
          error: 'Draft not found',
        });
      }

      // Verify user owns this draft
      const filing = await ITRFiling.findByPk(draft.filingId);
      if (!filing || filing.userId !== userId) {
        return res.status(403).json({
          error: 'Unauthorized access to draft',
        });
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
          formData.assessmentYear || '2024-25',
          filing.assessmentYear || '2024-25'
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
        userId: req.user?.userId,
        draftId: req.params.draftId,
      });
      res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to export PDF',
      });
    }
  }

  /**
   * Export tax computation as PDF
   * GET /api/itr/filings/:filingId/tax-computation/pdf
   */
  async exportTaxComputationPDF(req, res) {
    try {
      const userId = req.user.userId;
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
        return res.status(404).json({
          error: 'Filing not found',
        });
      }

      if (verifyResult.rows[0].user_id !== userId) {
        return res.status(403).json({
          error: 'Unauthorized access to filing',
        });
      }

      // Get filing data
      const filing = await ITRFiling.findByPk(filingId);
      const formData = filing.jsonPayload || {};
      const itrType = filing.itrType || 'ITR-1';
      const assessmentYear = filing.assessmentYear || '2024-25';

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
        userId: req.user?.userId,
        filingId: req.params.filingId,
      });
      res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to export PDF',
      });
    }
  }

  /**
   * Export discrepancy report as PDF
   * GET /api/itr/filings/:filingId/discrepancies/pdf
   */
  async exportDiscrepancyPDF(req, res) {
    try {
      const userId = req.user.userId;
      const { filingId } = req.params;

      const PDFGenerationService = require('../services/core/PDFGenerationService');
      const DiscrepancyService = require('../services/business/DiscrepancyService');

      // Verify user owns this filing
      const verifyQuery = `
        SELECT user_id FROM itr_filings WHERE id = $1
      `;
      const verifyResult = await dbQuery(verifyQuery, [filingId]);

      if (verifyResult.rows.length === 0) {
        return res.status(404).json({
          error: 'Filing not found',
        });
      }

      if (verifyResult.rows[0].user_id !== userId) {
        return res.status(403).json({
          error: 'Unauthorized access to filing',
        });
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
        userId: req.user?.userId,
        filingId: req.params.filingId,
      });
      res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to export PDF',
      });
    }
  }

  /**
   * Send discrepancy report via email
   * POST /api/itr/filings/:filingId/discrepancies/email
   */
  async sendDiscrepancyReportEmail(req, res) {
    try {
      const userId = req.user.userId;
      const { filingId } = req.params;
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          error: 'Email address is required',
        });
      }

      const EmailService = require('../services/integration/EmailService');
      const DiscrepancyService = require('../services/business/DiscrepancyService');

      // Verify user owns this filing
      const verifyQuery = `
        SELECT user_id FROM itr_filings WHERE id = $1
      `;
      const verifyResult = await dbQuery(verifyQuery, [filingId]);

      if (verifyResult.rows.length === 0) {
        return res.status(404).json({
          error: 'Filing not found',
        });
      }

      if (verifyResult.rows[0].user_id !== userId) {
        return res.status(403).json({
          error: 'Unauthorized access to filing',
        });
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

      res.json({
        success: true,
        message: 'Discrepancy report email sent successfully',
      });
    } catch (error) {
      enterpriseLogger.error('Send discrepancy report email failed', {
        error: error.message,
        userId: req.user?.userId,
        filingId: req.params.filingId,
      });
      res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to send email',
      });
    }
  }

  /**
   * Share draft with CA or another user for review
   * POST /api/itr/drafts/:filingId/share
   */
  async shareDraft(req, res) {
    try {
      const userId = req.user.userId;
      const { filingId } = req.params;
      const { recipientEmail, caEmail, message } = req.body;
      const email = recipientEmail || caEmail; // Support both field names

      if (!email) {
        return res.status(400).json({
          error: 'Recipient email is required',
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
        return res.status(404).json({
          error: 'Filing not found',
        });
      }

      if (verifyResult.rows[0].user_id !== userId) {
        return res.status(403).json({
          error: 'Unauthorized access to filing',
        });
      }

      // Get sharer details
      const sharer = await User.findByPk(userId);
      if (!sharer) {
        return res.status(404).json({
          error: 'User not found',
        });
      }

      // Generate share link (in production, this would be a secure, temporary token)
      const shareLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/filing/${filingId}/review?token=TEMP_SHARE_TOKEN`;

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

      res.json({
        success: true,
        message: 'Draft shared successfully',
        shareLink,
      });
    } catch (error) {
      enterpriseLogger.error('Share draft failed', {
        error: error.message,
        userId: req.user?.userId,
        filingId: req.params.filingId,
      });
      res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to share draft',
      });
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
      const userId = req.user.userId;
      const { filingId } = req.params;

      const verifyQuery = `SELECT user_id, itr_type, json_payload FROM itr_filings WHERE id = $1`;
      const verifyResult = await dbQuery(verifyQuery, [filingId]);

      if (verifyResult.rows.length === 0) {
        return res.status(404).json({ error: 'Filing not found' });
      }

      if (verifyResult.rows[0].user_id !== userId) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      // Validate ITR type - House Property is allowed for ITR-1 and ITR-2
      const itrType = verifyResult.rows[0].itr_type;
      if (itrType !== 'ITR-1' && itrType !== 'ITR1' && itrType !== 'ITR-2' && itrType !== 'ITR2') {
        return res.status(400).json({
          error: `House property income is not applicable for ${itrType}. This income type is only available for ITR-1 and ITR-2.`,
        });
      }

      const jsonPayload = verifyResult.rows[0].json_payload || {};
      const houseProperty = jsonPayload.income?.houseProperty || { properties: [] };

      res.json({
        success: true,
        properties: houseProperty.properties || [],
        totalIncome: houseProperty.totalIncome || 0,
        totalLoss: houseProperty.totalLoss || 0,
      });
    } catch (error) {
      enterpriseLogger.error('Get house property failed', { error: error.message, stack: error.stack });
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Update house property income
   * PUT /api/itr/filings/:filingId/income/house-property
   */
  async updateHouseProperty(req, res) {
    try {
      const userId = req.user.userId;
      const { filingId } = req.params;
      const housePropertyData = req.body;

      const verifyQuery = `SELECT user_id, itr_type, json_payload FROM itr_filings WHERE id = $1`;
      const verifyResult = await dbQuery(verifyQuery, [filingId]);

      if (verifyResult.rows.length === 0) {
        return res.status(404).json({ error: 'Filing not found' });
      }

      if (verifyResult.rows[0].user_id !== userId) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      // Validate ITR type - House Property is allowed for ITR-1 and ITR-2
      const itrType = verifyResult.rows[0].itr_type;
      if (itrType !== 'ITR-1' && itrType !== 'ITR1' && itrType !== 'ITR-2' && itrType !== 'ITR2') {
        return res.status(400).json({
          error: `House property income is not applicable for ${itrType}. This income type is only available for ITR-1 and ITR-2.`,
        });
      }

      const jsonPayload = verifyResult.rows[0].json_payload || {};
      if (!jsonPayload.income) jsonPayload.income = {};
      jsonPayload.income.houseProperty = housePropertyData;

      const updateQuery = `UPDATE itr_filings SET json_payload = $1, updated_at = NOW() WHERE id = $2`;
      await dbQuery(updateQuery, [JSON.stringify(jsonPayload), filingId]);

      res.json({ success: true, message: 'House property updated successfully' });
    } catch (error) {
      enterpriseLogger.error('Update house property failed', { error: error.message, stack: error.stack });
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get capital gains income
   * GET /api/itr/filings/:filingId/income/capital-gains
   */
  async getCapitalGains(req, res) {
    try {
      const userId = req.user.userId;
      const { filingId } = req.params;

      const verifyQuery = `SELECT user_id, itr_type, json_payload FROM itr_filings WHERE id = $1`;
      const verifyResult = await dbQuery(verifyQuery, [filingId]);

      if (verifyResult.rows.length === 0) {
        return res.status(404).json({ error: 'Filing not found' });
      }

      if (verifyResult.rows[0].user_id !== userId) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      // Validate ITR type - Capital Gains is only allowed for ITR-2
      const itrType = verifyResult.rows[0].itr_type;
      if (itrType !== 'ITR-2' && itrType !== 'ITR2') {
        return res.status(400).json({
          error: `Capital gains income is not applicable for ${itrType}. This income type is only available for ITR-2.`,
        });
      }

      const jsonPayload = verifyResult.rows[0].json_payload || {};
      const capitalGains = jsonPayload.income?.capitalGains || {
        hasCapitalGains: false,
        stcgDetails: [],
        ltcgDetails: [],
      };

      res.json({
        success: true,
        ...capitalGains,
        totalSTCG: capitalGains.stcgDetails?.reduce((sum, e) => sum + (e.gainAmount || 0), 0) || 0,
        totalLTCG: capitalGains.ltcgDetails?.reduce((sum, e) => sum + (e.gainAmount || 0), 0) || 0,
      });
    } catch (error) {
      enterpriseLogger.error('Get capital gains failed', { error: error.message, stack: error.stack });
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Update capital gains income
   * PUT /api/itr/filings/:filingId/income/capital-gains
   */
  async updateCapitalGains(req, res) {
    try {
      const userId = req.user.userId;
      const { filingId } = req.params;
      const capitalGainsData = req.body;

      const verifyQuery = `SELECT user_id, itr_type, json_payload FROM itr_filings WHERE id = $1`;
      const verifyResult = await dbQuery(verifyQuery, [filingId]);

      if (verifyResult.rows.length === 0) {
        return res.status(404).json({ error: 'Filing not found' });
      }

      if (verifyResult.rows[0].user_id !== userId) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      // Validate ITR type - Capital Gains is only allowed for ITR-2
      const itrType = verifyResult.rows[0].itr_type;
      if (itrType !== 'ITR-2' && itrType !== 'ITR2') {
        return res.status(400).json({
          error: `Capital gains income is not applicable for ${itrType}. This income type is only available for ITR-2.`,
        });
      }

      const jsonPayload = verifyResult.rows[0].json_payload || {};
      if (!jsonPayload.income) jsonPayload.income = {};
      jsonPayload.income.capitalGains = capitalGainsData;

      const updateQuery = `UPDATE itr_filings SET json_payload = $1, updated_at = NOW() WHERE id = $2`;
      await dbQuery(updateQuery, [JSON.stringify(jsonPayload), filingId]);

      res.json({ success: true, message: 'Capital gains updated successfully' });
    } catch (error) {
      enterpriseLogger.error('Update capital gains failed', { error: error.message, stack: error.stack });
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get AIS rental income data
   * GET /api/itr/filings/:filingId/ais/rental-income
   */
  async getAISRentalIncome(req, res) {
    try {
      const userId = req.user.userId;
      const { filingId } = req.params;
      const { assessmentYear = '2024-25' } = req.query;

      const verifyQuery = `SELECT user_id, json_payload FROM itr_filings WHERE id = $1`;
      const verifyResult = await dbQuery(verifyQuery, [filingId]);

      if (verifyResult.rows.length === 0) {
        return res.status(404).json({ error: 'Filing not found' });
      }

      if (verifyResult.rows[0].user_id !== userId) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      // TODO: Integrate with actual AIS service to fetch rental income
      // For now, return structure that can be populated
      const jsonPayload = verifyResult.rows[0].json_payload || {};
      const aisData = jsonPayload.aisData || {};

      res.json({
        success: true,
        rentalIncome: aisData.rentalIncome || [],
        summary: {
          totalRentalIncome: (aisData.rentalIncome || []).reduce((sum, r) => sum + (r.amount || 0), 0),
          properties: (aisData.rentalIncome || []).length,
        },
        source: 'ais',
        fetchedAt: new Date().toISOString(),
      });
    } catch (error) {
      enterpriseLogger.error('Get AIS rental income failed', { error: error.message, stack: error.stack });
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Apply AIS rental income data to house property form
   * POST /api/itr/filings/:filingId/income/house-property/apply-ais
   */
  async applyAISRentalIncome(req, res) {
    try {
      const userId = req.user.userId;
      const { filingId } = req.params;
      const { properties } = req.body;

      const verifyQuery = `SELECT user_id, json_payload FROM itr_filings WHERE id = $1`;
      const verifyResult = await dbQuery(verifyQuery, [filingId]);

      if (verifyResult.rows.length === 0) {
        return res.status(404).json({ error: 'Filing not found' });
      }

      if (verifyResult.rows[0].user_id !== userId) {
        return res.status(403).json({ error: 'Unauthorized' });
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

      res.json({
        success: true,
        message: 'AIS rental income data applied successfully',
        propertiesAdded: properties.length,
      });
    } catch (error) {
      enterpriseLogger.error('Apply AIS rental income failed', { error: error.message, stack: error.stack });
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Process rent receipts OCR for house property
   * POST /api/itr/filings/:filingId/income/house-property/ocr-rent-receipts
   */
  async processRentReceiptsOCR(req, res) {
    try {
      const userId = req.user.userId;
      const { filingId } = req.params;
      const { receipts, propertyId } = req.body;

      if (!receipts || !Array.isArray(receipts) || receipts.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Receipts array is required',
        });
      }

      // Verify filing ownership
      const verifyQuery = `SELECT user_id, json_payload FROM itr_filings WHERE id = $1`;
      const verifyResult = await dbQuery(verifyQuery, [filingId]);

      if (verifyResult.rows.length === 0) {
        return res.status(404).json({ error: 'Filing not found' });
      }

      if (verifyResult.rows[0].user_id !== userId) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      // Process receipts (in production, this would call OCR service)
      const processedReceipts = receipts.map((receipt, index) => {
        // Mock processing - in production, integrate with actual OCR service
        return {
          receiptId: receipt.receiptId || `receipt-${index}`,
          fileName: receipt.fileName || `receipt-${index}.pdf`,
          success: true,
          extractedData: {
            landlordName: receipt.extractedData?.landlordName || 'Extracted Landlord Name',
            propertyAddress: receipt.extractedData?.propertyAddress || 'Extracted Property Address',
            rentAmount: receipt.extractedData?.rentAmount || 25000,
            period: receipt.extractedData?.period || 'January 2024',
            receiptDate: receipt.extractedData?.receiptDate || new Date().toISOString().split('T')[0],
            receiptNumber: receipt.extractedData?.receiptNumber || `R${index + 1}`,
            tdsDeducted: receipt.extractedData?.tdsDeducted || 0,
          },
          confidence: receipt.confidence || 0.85,
        };
      });

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

      res.json({
        success: true,
        message: `${processedReceipts.length} rent receipt(s) processed successfully`,
        receipts: processedReceipts,
        totalProcessed: processedReceipts.length,
      });

    } catch (error) {
      enterpriseLogger.error('Process rent receipts OCR failed', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.userId,
        filingId: req.params.filingId,
      });
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  /**
   * Get AIS capital gains data
   * GET /api/itr/filings/:filingId/ais/capital-gains
   */
  async getAISCapitalGains(req, res) {
    try {
      const userId = req.user.userId;
      const { filingId } = req.params;
      const { assessmentYear = '2024-25' } = req.query;

      const verifyQuery = `SELECT user_id, json_payload FROM itr_filings WHERE id = $1`;
      const verifyResult = await dbQuery(verifyQuery, [filingId]);

      if (verifyResult.rows.length === 0) {
        return res.status(404).json({ error: 'Filing not found' });
      }

      if (verifyResult.rows[0].user_id !== userId) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      // TODO: Integrate with actual AIS service to fetch capital gains
      // For now, return structure that can be populated
      const jsonPayload = verifyResult.rows[0].json_payload || {};
      const aisData = jsonPayload.aisData || {};

      res.json({
        success: true,
        capitalGains: aisData.capitalGains || [],
        summary: {
          totalSTCG: (aisData.capitalGains || []).filter((g) => g.holdingPeriod < 365).reduce((sum, g) => sum + (g.gainAmount || 0), 0),
          totalLTCG: (aisData.capitalGains || []).filter((g) => g.holdingPeriod >= 365).reduce((sum, g) => sum + (g.gainAmount || 0), 0),
          transactions: (aisData.capitalGains || []).length,
        },
        source: 'ais',
        fetchedAt: new Date().toISOString(),
      });
    } catch (error) {
      enterpriseLogger.error('Get AIS capital gains failed', { error: error.message, stack: error.stack });
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Apply AIS capital gains data to capital gains form
   * POST /api/itr/filings/:filingId/income/capital-gains/apply-ais
   */
  async applyAISCapitalGains(req, res) {
    try {
      const userId = req.user.userId;
      const { filingId } = req.params;
      const { stcgEntries, ltcgEntries } = req.body;

      const verifyQuery = `SELECT user_id, json_payload FROM itr_filings WHERE id = $1`;
      const verifyResult = await dbQuery(verifyQuery, [filingId]);

      if (verifyResult.rows.length === 0) {
        return res.status(404).json({ error: 'Filing not found' });
      }

      if (verifyResult.rows[0].user_id !== userId) {
        return res.status(403).json({ error: 'Unauthorized' });
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

      res.json({
        success: true,
        message: 'AIS capital gains data applied successfully',
        stcgEntriesAdded: (stcgEntries || []).length,
        ltcgEntriesAdded: (ltcgEntries || []).length,
      });
    } catch (error) {
      enterpriseLogger.error('Apply AIS capital gains failed', { error: error.message, stack: error.stack });
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get AIS business income data
   * GET /api/itr/filings/:filingId/ais/business-income
   */
  async getAISBusinessIncome(req, res) {
    try {
      const userId = req.user.userId;
      const { filingId } = req.params;
      const { assessmentYear = '2024-25' } = req.query;

      const verifyQuery = `SELECT user_id, json_payload FROM itr_filings WHERE id = $1`;
      const verifyResult = await dbQuery(verifyQuery, [filingId]);

      if (verifyResult.rows.length === 0) {
        return res.status(404).json({ error: 'Filing not found' });
      }

      if (verifyResult.rows[0].user_id !== userId) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      // TODO: Integrate with actual AIS service to fetch business income
      // For now, return structure that can be populated
      const jsonPayload = verifyResult.rows[0].json_payload || {};
      const aisData = jsonPayload.aisData || {};
      const businessIncome = aisData.businessIncome || [];

      const totalGrossReceipts = businessIncome.reduce((sum, b) => sum + (b.pnl?.grossReceipts || 0), 0);
      const totalTDS = businessIncome.reduce((sum, b) => sum + (b.pnl?.tdsDeducted || 0), 0);

      res.json({
        success: true,
        businessIncome: businessIncome,
        summary: {
          totalGrossReceipts: totalGrossReceipts,
          totalTDS: totalTDS,
          businesses: businessIncome.length,
        },
        source: 'ais',
        fetchedAt: new Date().toISOString(),
      });
    } catch (error) {
      enterpriseLogger.error('Get AIS business income failed', { error: error.message, stack: error.stack });
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Apply AIS business income data to business income form
   * POST /api/itr/filings/:filingId/income/business/apply-ais
   */
  async applyAISBusinessIncome(req, res) {
    try {
      const userId = req.user.userId;
      const { filingId } = req.params;
      const { businesses } = req.body;

      const verifyQuery = `SELECT user_id, json_payload FROM itr_filings WHERE id = $1`;
      const verifyResult = await dbQuery(verifyQuery, [filingId]);

      if (verifyResult.rows.length === 0) {
        return res.status(404).json({ error: 'Filing not found' });
      }

      if (verifyResult.rows[0].user_id !== userId) {
        return res.status(403).json({ error: 'Unauthorized' });
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

      res.json({
        success: true,
        message: 'AIS business income data applied successfully',
        businessesAdded: (businesses || []).length,
      });
    } catch (error) {
      enterpriseLogger.error('Apply AIS business income failed', { error: error.message, stack: error.stack });
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get AIS professional income data
   * GET /api/itr/filings/:filingId/ais/professional-income
   */
  async getAISProfessionalIncome(req, res) {
    try {
      const userId = req.user.userId;
      const { filingId } = req.params;
      const { assessmentYear = '2024-25' } = req.query;

      const verifyQuery = `SELECT user_id, json_payload FROM itr_filings WHERE id = $1`;
      const verifyResult = await dbQuery(verifyQuery, [filingId]);

      if (verifyResult.rows.length === 0) {
        return res.status(404).json({ error: 'Filing not found' });
      }

      if (verifyResult.rows[0].user_id !== userId) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      // TODO: Integrate with actual AIS service to fetch professional income
      // For now, return structure that can be populated
      const jsonPayload = verifyResult.rows[0].json_payload || {};
      const aisData = jsonPayload.aisData || {};
      const professionalIncome = aisData.professionalIncome || [];

      const totalProfessionalFees = professionalIncome.reduce((sum, p) => sum + (p.pnl?.professionalFees || 0), 0);
      const totalTDS = professionalIncome.reduce((sum, p) => sum + (p.pnl?.tdsDeducted || 0), 0);

      res.json({
        success: true,
        professionalIncome: professionalIncome,
        summary: {
          totalProfessionalFees: totalProfessionalFees,
          totalTDS: totalTDS,
          professions: professionalIncome.length,
        },
        source: 'ais',
        fetchedAt: new Date().toISOString(),
      });
    } catch (error) {
      enterpriseLogger.error('Get AIS professional income failed', { error: error.message, stack: error.stack });
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Apply AIS professional income data to professional income form
   * POST /api/itr/filings/:filingId/income/professional/apply-ais
   */
  async applyAISProfessionalIncome(req, res) {
    try {
      const userId = req.user.userId;
      const { filingId } = req.params;
      const { professions } = req.body;

      const verifyQuery = `SELECT user_id, json_payload FROM itr_filings WHERE id = $1`;
      const verifyResult = await dbQuery(verifyQuery, [filingId]);

      if (verifyResult.rows.length === 0) {
        return res.status(404).json({ error: 'Filing not found' });
      }

      if (verifyResult.rows[0].user_id !== userId) {
        return res.status(403).json({ error: 'Unauthorized' });
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

      res.json({
        success: true,
        message: 'AIS professional income data applied successfully',
        professionsAdded: (professions || []).length,
      });
    } catch (error) {
      enterpriseLogger.error('Apply AIS professional income failed', { error: error.message, stack: error.stack });
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get business income
   * GET /api/itr/filings/:filingId/income/business
   */
  async getBusinessIncome(req, res) {
    try {
      const userId = req.user.userId;
      const { filingId } = req.params;

      const verifyQuery = `SELECT user_id, itr_type, json_payload FROM itr_filings WHERE id = $1`;
      const verifyResult = await dbQuery(verifyQuery, [filingId]);

      if (verifyResult.rows.length === 0) {
        return res.status(404).json({ error: 'Filing not found' });
      }

      if (verifyResult.rows[0].user_id !== userId) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      // Validate ITR type - Business Income is allowed for ITR-3 and ITR-4
      const itrType = verifyResult.rows[0].itr_type;
      if (itrType !== 'ITR-3' && itrType !== 'ITR3' && itrType !== 'ITR-4' && itrType !== 'ITR4') {
        return res.status(400).json({
          error: `Business income is not applicable for ${itrType}. This income type is only available for ITR-3 and ITR-4.`,
        });
      }

      const jsonPayload = verifyResult.rows[0].json_payload || {};
      const businessIncome = jsonPayload.income?.business || { businesses: [] };

      res.json({
        success: true,
        businesses: businessIncome.businesses || [],
        totalIncome: businessIncome.totalIncome || 0,
      });
    } catch (error) {
      enterpriseLogger.error('Get business income failed', { error: error.message, stack: error.stack });
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Update business income
   * PUT /api/itr/filings/:filingId/income/business
   */
  async updateBusinessIncome(req, res) {
    try {
      const userId = req.user.userId;
      const { filingId } = req.params;
      const businessIncomeData = req.body;

      const verifyQuery = `SELECT user_id, itr_type, json_payload FROM itr_filings WHERE id = $1`;
      const verifyResult = await dbQuery(verifyQuery, [filingId]);

      if (verifyResult.rows.length === 0) {
        return res.status(404).json({ error: 'Filing not found' });
      }

      if (verifyResult.rows[0].user_id !== userId) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      // Validate ITR type - Business Income is allowed for ITR-3 and ITR-4
      const itrType = verifyResult.rows[0].itr_type;
      if (itrType !== 'ITR-3' && itrType !== 'ITR3' && itrType !== 'ITR-4' && itrType !== 'ITR4') {
        return res.status(400).json({
          error: `Business income is not applicable for ${itrType}. This income type is only available for ITR-3 and ITR-4.`,
        });
      }

      const jsonPayload = verifyResult.rows[0].json_payload || {};
      if (!jsonPayload.income) jsonPayload.income = {};
      jsonPayload.income.business = businessIncomeData;

      const updateQuery = `UPDATE itr_filings SET json_payload = $1, updated_at = NOW() WHERE id = $2`;
      await dbQuery(updateQuery, [JSON.stringify(jsonPayload), filingId]);

      res.json({ success: true, message: 'Business income updated successfully' });
    } catch (error) {
      enterpriseLogger.error('Update business income failed', { error: error.message, stack: error.stack });
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get professional income
   * GET /api/itr/filings/:filingId/income/professional
   */
  async getProfessionalIncome(req, res) {
    try {
      const userId = req.user.userId;
      const { filingId } = req.params;

      const verifyQuery = `SELECT user_id, itr_type, json_payload FROM itr_filings WHERE id = $1`;
      const verifyResult = await dbQuery(verifyQuery, [filingId]);

      if (verifyResult.rows.length === 0) {
        return res.status(404).json({ error: 'Filing not found' });
      }

      if (verifyResult.rows[0].user_id !== userId) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      // Validate ITR type - Professional Income is only allowed for ITR-3
      const itrType = verifyResult.rows[0].itr_type;
      if (itrType !== 'ITR-3' && itrType !== 'ITR3') {
        return res.status(400).json({
          error: `Professional income is not applicable for ${itrType}. This income type is only available for ITR-3.`,
        });
      }

      const jsonPayload = verifyResult.rows[0].json_payload || {};
      const professionalIncome = jsonPayload.income?.professional || { activities: [] };

      res.json({
        success: true,
        activities: professionalIncome.activities || [],
        totalIncome: professionalIncome.totalIncome || 0,
      });
    } catch (error) {
      enterpriseLogger.error('Get professional income failed', { error: error.message, stack: error.stack });
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Update professional income
   * PUT /api/itr/filings/:filingId/income/professional
   */
  async updateProfessionalIncome(req, res) {
    try {
      const userId = req.user.userId;
      const { filingId } = req.params;
      const professionalIncomeData = req.body;

      const verifyQuery = `SELECT user_id, itr_type, json_payload FROM itr_filings WHERE id = $1`;
      const verifyResult = await dbQuery(verifyQuery, [filingId]);

      if (verifyResult.rows.length === 0) {
        return res.status(404).json({ error: 'Filing not found' });
      }

      if (verifyResult.rows[0].user_id !== userId) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      // Validate ITR type - Professional Income is only allowed for ITR-3
      const itrType = verifyResult.rows[0].itr_type;
      if (itrType !== 'ITR-3' && itrType !== 'ITR3') {
        return res.status(400).json({
          error: `Professional income is not applicable for ${itrType}. This income type is only available for ITR-3.`,
        });
      }

      const jsonPayload = verifyResult.rows[0].json_payload || {};
      if (!jsonPayload.income) jsonPayload.income = {};
      jsonPayload.income.professional = professionalIncomeData;

      const updateQuery = `UPDATE itr_filings SET json_payload = $1, updated_at = NOW() WHERE id = $2`;
      await dbQuery(updateQuery, [JSON.stringify(jsonPayload), filingId]);

      res.json({ success: true, message: 'Professional income updated successfully' });
    } catch (error) {
      enterpriseLogger.error('Update professional income failed', { error: error.message, stack: error.stack });
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get balance sheet
   * GET /api/itr/filings/:filingId/balance-sheet
   */
  async getBalanceSheet(req, res) {
    try {
      const userId = req.user.userId;
      const { filingId } = req.params;

      const BalanceSheetService = require('../services/business/BalanceSheetService');

      // Verify user owns this filing
      const verifyQuery = `
        SELECT user_id, itr_type FROM itr_filings WHERE id = $1
      `;
      const verifyResult = await dbQuery(verifyQuery, [filingId]);

      if (verifyResult.rows.length === 0) {
        return res.status(404).json({
          error: 'Filing not found',
        });
      }

      if (verifyResult.rows[0].user_id !== userId) {
        return res.status(403).json({
          error: 'Unauthorized access to filing',
        });
      }

      // Validate ITR type - Balance Sheet is only allowed for ITR-3
      const itrType = verifyResult.rows[0].itr_type;
      if (itrType !== 'ITR-3' && itrType !== 'ITR3') {
        return res.status(400).json({
          error: `Balance sheet is not applicable for ${itrType}. This feature is only available for ITR-3.`,
        });
      }

      const balanceSheet = await BalanceSheetService.getBalanceSheet(filingId);

      res.json({
        success: true,
        balanceSheet,
      });
    } catch (error) {
      enterpriseLogger.error('Get balance sheet failed', {
        error: error.message,
        userId: req.user?.userId,
        filingId: req.params.filingId,
      });
      res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to get balance sheet',
      });
    }
  }

  /**
   * Get audit information
   * GET /api/itr/filings/:filingId/audit-information
   */
  async getAuditInformation(req, res) {
    try {
      const userId = req.user.userId;
      const { filingId } = req.params;

      const AuditInformationService = require('../services/business/AuditInformationService');

      // Verify user owns this filing
      const verifyQuery = `
        SELECT user_id, itr_type FROM itr_filings WHERE id = $1
      `;
      const verifyResult = await dbQuery(verifyQuery, [filingId]);

      if (verifyResult.rows.length === 0) {
        return res.status(404).json({
          error: 'Filing not found',
        });
      }

      if (verifyResult.rows[0].user_id !== userId) {
        return res.status(403).json({
          error: 'Unauthorized access to filing',
        });
      }

      // Validate ITR type - Audit Information is only allowed for ITR-3
      const itrType = verifyResult.rows[0].itr_type;
      if (itrType !== 'ITR-3' && itrType !== 'ITR3') {
        return res.status(400).json({
          error: `Audit information is not applicable for ${itrType}. This feature is only available for ITR-3.`,
        });
      }

      const auditInfo = await AuditInformationService.getAuditInformation(filingId);

      res.json({
        success: true,
        auditInfo,
        applicability: auditInfo.applicability,
      });
    } catch (error) {
      enterpriseLogger.error('Get audit information failed', {
        error: error.message,
        userId: req.user?.userId,
        filingId: req.params.filingId,
      });
      res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to get audit information',
      });
    }
  }

  /**
   * Update audit information
   * PUT /api/itr/filings/:filingId/audit-information
   */
  async updateAuditInformation(req, res) {
    try {
      const userId = req.user.userId;
      const { filingId } = req.params;
      const auditData = req.body;

      const AuditInformationService = require('../services/business/AuditInformationService');

      // Verify user owns this filing
      const verifyQuery = `
        SELECT user_id, itr_type FROM itr_filings WHERE id = $1
      `;
      const verifyResult = await dbQuery(verifyQuery, [filingId]);

      if (verifyResult.rows.length === 0) {
        return res.status(404).json({
          error: 'Filing not found',
        });
      }

      if (verifyResult.rows[0].user_id !== userId) {
        return res.status(403).json({
          error: 'Unauthorized access to filing',
        });
      }

      // Validate ITR type - Audit Information is only allowed for ITR-3
      const itrType = verifyResult.rows[0].itr_type;
      if (itrType !== 'ITR-3' && itrType !== 'ITR3') {
        return res.status(400).json({
          error: `Audit information is not applicable for ${itrType}. This feature is only available for ITR-3.`,
        });
      }

      const updated = await AuditInformationService.updateAuditInformation(filingId, auditData);

      res.json({
        success: true,
        auditInfo: updated,
        message: 'Audit information updated successfully',
      });
    } catch (error) {
      enterpriseLogger.error('Update audit information failed', {
        error: error.message,
        userId: req.user?.userId,
        filingId: req.params.filingId,
      });
      res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to update audit information',
      });
    }
  }

  /**
   * Check audit applicability
   * POST /api/itr/filings/:filingId/audit-information/check-applicability
   */
  async checkAuditApplicability(req, res) {
    try {
      const userId = req.user.userId;
      const { filingId } = req.params;

      const AuditInformationService = require('../services/business/AuditInformationService');

      // Verify user owns this filing
      const verifyQuery = `
        SELECT user_id, json_payload FROM itr_filings WHERE id = $1
      `;
      const verifyResult = await dbQuery(verifyQuery, [filingId]);

      if (verifyResult.rows.length === 0) {
        return res.status(404).json({
          error: 'Filing not found',
        });
      }

      if (verifyResult.rows[0].user_id !== userId) {
        return res.status(403).json({
          error: 'Unauthorized access to filing',
        });
      }

      const jsonPayload = verifyResult.rows[0].json_payload || {};
      const applicability = AuditInformationService.checkAuditApplicability(
        jsonPayload.income?.business,
        jsonPayload.income?.professional
      );

      res.json({
        success: true,
        ...applicability,
      });
    } catch (error) {
      enterpriseLogger.error('Check audit applicability failed', {
        error: error.message,
        userId: req.user?.userId,
        filingId: req.params.filingId,
      });
      res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to check audit applicability',
      });
    }
  }

  /**
   * Update balance sheet
   * PUT /api/itr/filings/:filingId/balance-sheet
   */
  async updateBalanceSheet(req, res) {
    try {
      const userId = req.user.userId;
      const { filingId } = req.params;
      const balanceSheetData = req.body;

      const BalanceSheetService = require('../services/business/BalanceSheetService');

      // Verify user owns this filing
      const verifyQuery = `
        SELECT user_id, itr_type FROM itr_filings WHERE id = $1
      `;
      const verifyResult = await dbQuery(verifyQuery, [filingId]);

      if (verifyResult.rows.length === 0) {
        return res.status(404).json({
          error: 'Filing not found',
        });
      }

      if (verifyResult.rows[0].user_id !== userId) {
        return res.status(403).json({
          error: 'Unauthorized access to filing',
        });
      }

      // Validate ITR type - Balance Sheet is only allowed for ITR-3
      const itrType = verifyResult.rows[0].itr_type;
      if (itrType !== 'ITR-3' && itrType !== 'ITR3') {
        return res.status(400).json({
          error: `Balance sheet is not applicable for ${itrType}. This feature is only available for ITR-3.`,
        });
      }

      const updated = await BalanceSheetService.updateBalanceSheet(filingId, balanceSheetData);

      res.json({
        success: true,
        balanceSheet: updated,
        message: 'Balance sheet updated successfully',
      });
    } catch (error) {
      enterpriseLogger.error('Update balance sheet failed', {
        error: error.message,
        userId: req.user?.userId,
        filingId: req.params.filingId,
      });
      res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to update balance sheet',
      });
    }
  }

  /**
   * Export acknowledgment as PDF
   * GET /api/itr/filings/:filingId/acknowledgment/pdf
   */
  async exportAcknowledgmentPDF(req, res) {
    try {
      const userId = req.user.userId;
      const { filingId } = req.params;

      const PDFGenerationService = require('../services/core/PDFGenerationService');
      const ITRFiling = require('../models/ITRFiling');

      // Verify user owns this filing
      const verifyQuery = `
        SELECT user_id FROM itr_filings WHERE id = $1
      `;
      const verifyResult = await dbQuery(verifyQuery, [filingId]);

      if (verifyResult.rows.length === 0) {
        return res.status(404).json({
          error: 'Filing not found',
        });
      }

      if (verifyResult.rows[0].user_id !== userId) {
        return res.status(403).json({
          error: 'Unauthorized access to filing',
        });
      }

      // Get filing data
      const filing = await ITRFiling.findByPk(filingId);
      
      if (!filing.acknowledgmentNumber) {
        return res.status(400).json({
          error: 'Filing not yet acknowledged',
        });
      }

      const acknowledgmentData = {
        acknowledgmentNumber: filing.acknowledgmentNumber,
        submittedAt: filing.submittedAt,
        itrType: filing.itrType,
        assessmentYear: filing.assessmentYear,
        eVerificationStatus: filing.eVerificationStatus || 'Pending',
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
      res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to export PDF',
      });
    }
  }

  // =====================================================
  // JSON EXPORT
  // =====================================================

  /**
   * Export ITR data as government-compliant JSON
   * POST /api/itr/export
   */
  async exportITRJson(req, res) {
    try {
      const userId = req.user.userId;
      const { itrData, itrType, assessmentYear, exportFormat, purpose } = req.body;

      // Validate required fields
      if (!itrData || !itrType) {
        return res.status(400).json({
          success: false,
          error: 'itrData and itrType are required',
        });
      }

      // Validate ITR type
      const validTypes = ['ITR-1', 'ITR-2', 'ITR-3', 'ITR-4', 'ITR1', 'ITR2', 'ITR3', 'ITR4'];
      const normalizedItrType = itrType.toUpperCase().replace('-', '');
      if (!validTypes.includes(itrType) && !validTypes.includes(normalizedItrType)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid ITR type. Must be ITR-1, ITR-2, ITR-3, or ITR-4',
        });
      }

      // Get user information
      const User = require('../models/User');
      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
        });
      }

      // Generate government-compliant JSON
      const jsonPayload = this.generateGovernmentJson(itrData, itrType, assessmentYear || '2024-25', user);

      // Generate filename
      const currentDate = new Date().toISOString().split('T')[0];
      const fileName = `${itrType}_${assessmentYear || '2024-25'}_${currentDate}.json`;

      // Optionally store file in uploads directory
      const fs = require('fs');
      const path = require('path');
      const uploadsDir = path.join(__dirname, '../../uploads/local');
      
      // Ensure uploads directory exists
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const filePath = path.join(uploadsDir, fileName);
      fs.writeFileSync(filePath, JSON.stringify(jsonPayload, null, 2));

      // Generate download URL
      const downloadUrl = `/api/itr/export/download/${encodeURIComponent(fileName)}`;

      enterpriseLogger.info('ITR JSON exported successfully', {
        userId,
        itrType,
        assessmentYear: assessmentYear || '2024-25',
        fileName,
      });

      res.json({
        success: true,
        downloadUrl,
        fileName,
        metadata: {
          itrType,
          assessmentYear: assessmentYear || '2024-25',
          generatedAt: new Date().toISOString(),
          fileSize: JSON.stringify(jsonPayload).length,
          format: exportFormat || 'JSON',
          purpose: purpose || 'FILING',
        },
      });
    } catch (error) {
      enterpriseLogger.error('Export ITR JSON failed', {
        error: error.message,
        userId: req.user?.userId,
        stack: error.stack,
      });
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Failed to export ITR JSON',
      });
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
        return res.status(404).json({
          error: 'File not found',
        });
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
      res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to download file',
      });
    }
  }

  /**
   * Helper: Transform formData to export format
   */
  transformFormDataToExportFormat(formData, itrType) {
    const transformed = {
      personal: {},
      income: {},
      deductions: {},
      taxes: {},
      tds: {},
      bank: {},
      verification: formData.verification || {},
    };

    // Map personalInfo → personal
    if (formData.personalInfo) {
      const nameParts = (formData.personalInfo.name || '').split(' ');
      transformed.personal = {
        pan: formData.personalInfo.pan || '',
        firstName: nameParts[0] || '',
        middleName: nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : '',
        lastName: nameParts.length > 1 ? nameParts[nameParts.length - 1] : '',
        dateOfBirth: formData.personalInfo.dateOfBirth || '',
        gender: formData.personalInfo.gender || '',
        residentialStatus: formData.personalInfo.residentialStatus || 'RESIDENT',
        email: formData.personalInfo.email || '',
        phone: formData.personalInfo.phone || '',
        address: {
          flat: formData.personalInfo.address || '',
          city: formData.personalInfo.city || '',
          state: formData.personalInfo.state || '',
          pincode: formData.personalInfo.pincode || '',
          country: 'INDIA',
        },
      };
    }

    // Map income structure
    if (formData.income) {
      transformed.income.salaryIncome = parseFloat(formData.income.salary || 0);

      // Calculate house property income
      let housePropertyIncome = 0;
      if (formData.income.houseProperty) {
        if (Array.isArray(formData.income.houseProperty)) {
          housePropertyIncome = formData.income.houseProperty.reduce((sum, prop) => {
            return sum + (parseFloat(prop.netRentalIncome || prop || 0) || 0);
          }, 0);
        } else if (formData.income.houseProperty.properties && Array.isArray(formData.income.houseProperty.properties)) {
          housePropertyIncome = formData.income.houseProperty.properties.reduce((sum, prop) => {
            const rentalIncome = parseFloat(prop.annualRentalIncome || 0);
            const municipalTaxes = parseFloat(prop.municipalTaxes || 0);
            const interestOnLoan = parseFloat(prop.interestOnLoan || 0);
            const netIncome = Math.max(0, rentalIncome - municipalTaxes - interestOnLoan);
            return sum + netIncome;
          }, 0);
        } else {
          housePropertyIncome = parseFloat(formData.income.houseProperty || 0);
        }
      }
      transformed.income.housePropertyIncome = housePropertyIncome;

      // Calculate capital gains
      let capitalGainsIncome = 0;
      if (formData.income.capitalGains) {
        if (typeof formData.income.capitalGains === 'object' && formData.income.capitalGains.stcgDetails && formData.income.capitalGains.ltcgDetails) {
          const stcgTotal = (formData.income.capitalGains.stcgDetails || []).reduce(
            (sum, entry) => sum + (parseFloat(entry.gainAmount || 0) || 0),
            0,
          );
          const ltcgTotal = (formData.income.capitalGains.ltcgDetails || []).reduce(
            (sum, entry) => sum + (parseFloat(entry.gainAmount || 0) || 0),
            0,
          );
          capitalGainsIncome = stcgTotal + ltcgTotal;
        } else {
          capitalGainsIncome = parseFloat(formData.income.capitalGains || 0);
        }
      }
      transformed.income.capitalGains = capitalGainsIncome;

      transformed.income.otherIncome = parseFloat(formData.income.otherIncome || 0);

      // Business income
      if (formData.businessIncome?.businesses && Array.isArray(formData.businessIncome.businesses)) {
        const totalBusinessIncome = formData.businessIncome.businesses.reduce((sum, biz) => {
          if (biz.pnl) {
            const pnl = biz.pnl;
            const directExpenses = this.calculateExpenseTotal(pnl.directExpenses);
            const indirectExpenses = this.calculateExpenseTotal(pnl.indirectExpenses);
            const depreciation = this.calculateExpenseTotal(pnl.depreciation);
            const netProfit = (pnl.grossReceipts || 0) +
              (pnl.openingStock || 0) -
              (pnl.closingStock || 0) -
              (pnl.purchases || 0) -
              directExpenses -
              indirectExpenses -
              depreciation -
              (pnl.otherExpenses || 0);
            return sum + netProfit;
          }
          return sum;
        }, 0);
        transformed.income.businessIncome = totalBusinessIncome;
        transformed.businessIncomeDetails = formData.businessIncome;
      } else {
        transformed.income.businessIncome = parseFloat(formData.income.businessIncome || 0);
      }

      // Professional income
      if (formData.professionalIncome?.professions && Array.isArray(formData.professionalIncome.professions)) {
        const totalProfessionalIncome = formData.professionalIncome.professions.reduce((sum, prof) => {
          if (prof.pnl) {
            const pnl = prof.pnl;
            const expensesTotal = this.calculateExpenseTotal(pnl.expenses);
            const depreciationTotal = this.calculateExpenseTotal(pnl.depreciation);
            const netIncome = (pnl.professionalFees || 0) - expensesTotal - depreciationTotal;
            return sum + netIncome;
          }
          return sum;
        }, 0);
        transformed.income.professionalIncome = totalProfessionalIncome;
        transformed.professionalIncomeDetails = formData.professionalIncome;
      } else {
        transformed.income.professionalIncome = parseFloat(formData.income.professionalIncome || 0);
      }

      // ITR-2 specific
      if (itrType === 'ITR-2' || itrType === 'ITR2') {
        transformed.income.capitalGainsDetails = formData.income.capitalGains;
        transformed.income.housePropertyDetails = formData.income.houseProperty;
        transformed.income.foreignIncomeDetails = formData.income.foreignIncome;
        transformed.income.directorPartnerDetails = formData.income.directorPartner;
      }

      // ITR-3 specific
      if (itrType === 'ITR-3' || itrType === 'ITR3') {
        transformed.income.capitalGainsDetails = formData.income.capitalGains;
        transformed.income.housePropertyDetails = formData.income.houseProperty;
        transformed.income.foreignIncomeDetails = formData.income.foreignIncome;
        transformed.income.directorPartnerDetails = formData.income.directorPartner;
        transformed.balanceSheetDetails = formData.balanceSheet;
        transformed.auditInfoDetails = formData.auditInfo;
      }

      // ITR-4 specific
      if (itrType === 'ITR-4' || itrType === 'ITR4') {
        transformed.income.presumptiveBusinessDetails = formData.income.presumptiveBusiness;
        transformed.income.presumptiveProfessionalDetails = formData.income.presumptiveProfessional;
        transformed.income.housePropertyDetails = formData.income.houseProperty;
        const presumptiveBusinessIncome = formData.income.presumptiveBusiness?.presumptiveIncome || 0;
        const presumptiveProfessionalIncome = formData.income.presumptiveProfessional?.presumptiveIncome || 0;
        transformed.income.businessIncome = presumptiveBusinessIncome;
        transformed.income.professionalIncome = presumptiveProfessionalIncome;
      }
    }

    // Map deductions
    if (formData.deductions) {
      transformed.deductions = {
        section80C: parseFloat(formData.deductions.section80C || 0),
        section80D: parseFloat(formData.deductions.section80D || 0),
        section80E: parseFloat(formData.deductions.section80E || 0),
        section80G: parseFloat(formData.deductions.section80G || 0),
        section80TTA: parseFloat(formData.deductions.section80TTA || 0),
        section80TTB: parseFloat(formData.deductions.section80TTB || 0),
        otherDeductions: formData.deductions.otherDeductions || {},
      };
    }

    // Map taxesPaid
    if (formData.taxesPaid) {
      transformed.taxes = {
        advanceTax: parseFloat(formData.taxesPaid.advanceTax || 0),
        selfAssessmentTax: parseFloat(formData.taxesPaid.selfAssessmentTax || 0),
      };
      transformed.tds = {
        totalTDS: parseFloat(formData.taxesPaid.tds || 0),
      };
    }

    // Map bankDetails
    if (formData.bankDetails) {
      transformed.bank = {
        accountNumber: formData.bankDetails.accountNumber || '',
        accountType: formData.bankDetails.accountType || 'SAVINGS',
        bankName: formData.bankDetails.bankName || '',
        branchName: formData.bankDetails.branchName || '',
        ifscCode: formData.bankDetails.ifsc || '',
        micrCode: formData.bankDetails.micr || '',
      };
    }

    return transformed;
  }

  /**
   * Helper: Generate government-compliant JSON
   */
  generateGovernmentJson(itrData, itrType, assessmentYear, user) {
    const currentDate = new Date().toISOString();
    const transformedData = this.transformFormDataToExportFormat(itrData, itrType);

    const baseJson = {
      'ITR_Form': itrType,
      'Assessment_Year': assessmentYear,
      'Filing_Type': 'Original',
      'Date_of_Filing': currentDate.split('T')[0],
      'Acknowledgement_Number': '',
      'Taxpayer_Information': {
        'PAN': transformedData.personal?.pan || user.panNumber || '',
        'Name': {
          'First_Name': transformedData.personal?.firstName || (user.fullName ? user.fullName.split(' ')[0] : '') || '',
          'Middle_Name': transformedData.personal?.middleName || (user.fullName ? user.fullName.split(' ').slice(1, -1).join(' ') : '') || '',
          'Last_Name': transformedData.personal?.lastName || (user.fullName ? user.fullName.split(' ').slice(-1)[0] : '') || '',
        },
        'Date_of_Birth': transformedData.personal?.dateOfBirth || user.dateOfBirth || '',
        'Gender': transformedData.personal?.gender || user.gender || '',
        'Residential_Status': transformedData.personal?.residentialStatus || 'RESIDENT',
        'Contact_Information': {
          'Email_ID': transformedData.personal?.email || user.email || '',
          'Mobile_Number': transformedData.personal?.phone || user.phone || '',
          'Address': {
            'Flat_Door_Block_No': transformedData.personal?.address?.flat || '',
            'Premises_Name_Building': transformedData.personal?.address?.building || '',
            'Road_Street': transformedData.personal?.address?.street || '',
            'Area_Locality': transformedData.personal?.address?.area || '',
            'City_Town': transformedData.personal?.address?.city || '',
            'State': transformedData.personal?.address?.state || '',
            'PIN_Code': transformedData.personal?.address?.pincode || '',
            'Country': transformedData.personal?.address?.country || 'INDIA',
          },
        },
      },
      'Bank_Account_Details': {
        'Account_Number': transformedData.bank?.accountNumber || '',
        'Account_Type': transformedData.bank?.accountType || 'SAVINGS',
        'Bank_Name': transformedData.bank?.bankName || '',
        'Branch_Name': transformedData.bank?.branchName || '',
        'IFSC_Code': transformedData.bank?.ifscCode || '',
        'MICR_Code': transformedData.bank?.micrCode || '',
      },
      'Income_Details': {
        'Income_from_Salary': this.formatAmount(transformedData.income?.salaryIncome || 0),
        'Income_from_House_Property': this.formatAmount(transformedData.income?.housePropertyIncome || 0),
        'Income_from_Other_Sources': this.formatAmount(transformedData.income?.otherIncome || 0),
        'Business_Income': this.formatAmount(transformedData.income?.businessIncome || 0),
        'Capital_Gains': this.formatAmount(transformedData.income?.capitalGains || 0),
        'Total_Gross_Income': 0,
      },
      'Deductions': {
        'Section_80C': this.formatAmount(transformedData.deductions?.section80C || 0),
        'Section_80D': this.formatAmount(transformedData.deductions?.section80D || 0),
        'Section_80E': this.formatAmount(transformedData.deductions?.section80E || 0),
        'Section_80G': this.formatAmount(transformedData.deductions?.section80G || 0),
        'Section_80TTA': this.formatAmount(transformedData.deductions?.section80TTA || 0),
        'Total_Deductions': 0,
      },
      'Tax_Calculation': {
        'Total_Income': 0,
        'Total_Tax_Liability': 0,
        'Education_Cess': 0,
        'Total_Tax_Payable': 0,
        'TDS_TCS': this.formatAmount(transformedData.tds?.totalTDS || 0),
        'Advance_Tax': this.formatAmount(transformedData.taxes?.advanceTax || 0),
        'Self_Assessment_Tax': this.formatAmount(transformedData.taxes?.selfAssessmentTax || 0),
        'Total_Tax_Paid': 0,
      },
      'Verification': {
        'Declaration': 'I declare that the information furnished above is true to the best of my knowledge and belief.',
        'Place': transformedData.verification?.place || user.address?.city || '',
        'Date': currentDate.split('T')[0],
        'Signature_Type': transformedData.verification?.signatureType || 'ELECTRONIC',
      },
    };

    // Calculate derived values
    this.calculateDerivedValues(baseJson);

    // Add ITR type specific fields
    this.addITRTypeSpecificFields(baseJson, transformedData, itrType);

    return baseJson;
  }

  /**
   * Helper: Calculate derived financial values
   */
  calculateDerivedValues(jsonData) {
    const incomeDetails = jsonData.Income_Details;
    const deductions = jsonData.Deductions;

    incomeDetails.Total_Gross_Income = this.formatAmount(
      parseFloat(incomeDetails.Income_from_Salary || 0) +
      parseFloat(incomeDetails.Income_from_House_Property || 0) +
      parseFloat(incomeDetails.Income_from_Other_Sources || 0) +
      parseFloat(incomeDetails.Business_Income || 0) +
      parseFloat(incomeDetails.Capital_Gains || 0)
    );

    deductions.Total_Deductions = this.formatAmount(
      parseFloat(deductions.Section_80C || 0) +
      parseFloat(deductions.Section_80D || 0) +
      parseFloat(deductions.Section_80E || 0) +
      parseFloat(deductions.Section_80G || 0) +
      parseFloat(deductions.Section_80TTA || 0)
    );

    const taxableIncome = parseFloat(incomeDetails.Total_Gross_Income) - parseFloat(deductions.Total_Deductions);

    let taxLiability = 0;
    if (taxableIncome > 0) {
      if (taxableIncome <= 250000) {
        taxLiability = 0;
      } else if (taxableIncome <= 500000) {
        taxLiability = (taxableIncome - 250000) * 0.05;
      } else if (taxableIncome <= 1000000) {
        taxLiability = 12500 + (taxableIncome - 500000) * 0.2;
      } else {
        taxLiability = 112500 + (taxableIncome - 1000000) * 0.3;
      }
    }

    jsonData.Tax_Calculation.Total_Income = this.formatAmount(taxableIncome);
    jsonData.Tax_Calculation.Total_Tax_Liability = this.formatAmount(taxLiability);
    jsonData.Tax_Calculation.Education_Cess = this.formatAmount(taxLiability * 0.04);
    jsonData.Tax_Calculation.Total_Tax_Payable = this.formatAmount(
      parseFloat(jsonData.Tax_Calculation.Total_Tax_Liability) +
      parseFloat(jsonData.Tax_Calculation.Education_Cess)
    );

    jsonData.Tax_Calculation.Total_Tax_Paid = this.formatAmount(
      parseFloat(jsonData.Tax_Calculation.TDS_TCS) +
      parseFloat(jsonData.Tax_Calculation.Advance_Tax) +
      parseFloat(jsonData.Tax_Calculation.Self_Assessment_Tax)
    );
  }

  /**
   * Helper: Add ITR type specific fields
   */
  addITRTypeSpecificFields(jsonData, itrData, itrType) {
    switch (itrType) {
      case 'ITR-1':
      case 'ITR1':
        jsonData.ITR1_Specific = {
          'Income_from_Salary_Detailed': itrData.income?.salaryDetails || {},
          'Income_from_House_Property_Detailed': itrData.income?.housePropertyDetails || {},
          'Business_Income_Already_Covered': 'NO',
          'Capital_Gains_Already_Covered': 'NO',
        };
        break;

      case 'ITR-2':
      case 'ITR2':
        jsonData.ITR2_Specific = {
          'Capital_Gains_Detailed': itrData.income?.capitalGainsDetails || {},
          'House_Property_Detailed': itrData.income?.housePropertyDetails || {},
          'Foreign_Income_Details': itrData.income?.foreignIncomeDetails || {},
          'Director_Partner_Income': itrData.income?.directorPartnerDetails || {},
        };
        break;

      case 'ITR-3':
      case 'ITR3':
        jsonData.ITR3_Specific = {
          'Business_Income_Details': this.formatBusinessIncomeForExport(itrData.businessIncomeDetails || itrData.businessIncome),
          'Professional_Income_Details': this.formatProfessionalIncomeForExport(itrData.professionalIncomeDetails || itrData.professionalIncome),
          'Balance_Sheet_Details': this.formatBalanceSheetForExport(itrData.balanceSheetDetails || itrData.balanceSheet),
          'Audit_Information': this.formatAuditInfoForExport(itrData.auditInfoDetails || itrData.auditInfo),
          'Capital_Gains_Detailed': itrData.income?.capitalGainsDetails || {},
          'House_Property_Detailed': itrData.income?.housePropertyDetails || {},
          'Foreign_Income_Details': itrData.income?.foreignIncomeDetails || {},
          'Director_Partner_Income': itrData.income?.directorPartnerDetails || {},
        };
        break;

      case 'ITR-4':
      case 'ITR4':
        jsonData.ITR4_Specific = {
          'Presumptive_Business_Income': this.formatPresumptiveIncomeForExport(itrData.income?.presumptiveBusinessDetails || itrData.income?.presumptiveBusiness),
          'Presumptive_Professional_Income': this.formatPresumptiveIncomeForExport(itrData.income?.presumptiveProfessionalDetails || itrData.income?.presumptiveProfessional),
          'House_Property_Detailed': itrData.income?.housePropertyDetails || {},
          'Section_44AD_Applicable': itrData.income?.presumptiveBusinessDetails?.hasPresumptiveBusiness || false,
          'Section_44ADA_Applicable': itrData.income?.presumptiveProfessionalDetails?.hasPresumptiveProfessional || false,
        };
        break;
    }
  }

  /**
   * Helper: Format amount
   */
  formatAmount(amount) {
    return parseFloat(amount || 0).toFixed(2);
  }

  /**
   * Helper: Calculate expense total
   */
  calculateExpenseTotal(expenseCategory) {
    if (!expenseCategory || typeof expenseCategory !== 'object') {
      return 0;
    }
    if (typeof expenseCategory.total === 'number') {
      return expenseCategory.total;
    }
    return Object.entries(expenseCategory).reduce((sum, [key, value]) => {
      if (key === 'total') return sum;
      return sum + (typeof value === 'number' ? value : 0);
    }, 0);
  }

  /**
   * Helper: Format business income for export
   */
  formatBusinessIncomeForExport(businessIncome) {
    if (!businessIncome) return {};

    if (businessIncome.businesses && Array.isArray(businessIncome.businesses)) {
      return {
        businesses: businessIncome.businesses.map(biz => ({
          businessName: biz.businessName || '',
          businessNature: biz.businessNature || '',
          businessAddress: biz.businessAddress || '',
          businessPAN: biz.businessPAN || '',
          gstNumber: biz.gstNumber || '',
          profitLossStatement: {
            grossReceipts: this.formatAmount(biz.pnl?.grossReceipts || 0),
            openingStock: this.formatAmount(biz.pnl?.openingStock || 0),
            purchases: this.formatAmount(biz.pnl?.purchases || 0),
            closingStock: this.formatAmount(biz.pnl?.closingStock || 0),
            directExpenses: this.formatAmount(this.calculateExpenseTotal(biz.pnl?.directExpenses)),
            indirectExpenses: this.formatAmount(this.calculateExpenseTotal(biz.pnl?.indirectExpenses)),
            depreciation: this.formatAmount(this.calculateExpenseTotal(biz.pnl?.depreciation)),
            otherExpenses: this.formatAmount(biz.pnl?.otherExpenses || 0),
            netProfit: this.formatAmount(biz.pnl?.netProfit || 0),
          },
        })),
      };
    }

    return {
      netBusinessIncome: this.formatAmount(businessIncome),
    };
  }

  /**
   * Helper: Format professional income for export
   */
  formatProfessionalIncomeForExport(professionalIncome) {
    if (!professionalIncome) return {};

    if (professionalIncome.professions && Array.isArray(professionalIncome.professions)) {
      return {
        professions: professionalIncome.professions.map(prof => ({
          professionName: prof.professionName || '',
          professionType: prof.professionType || '',
          professionAddress: prof.professionAddress || '',
          registrationNumber: prof.registrationNumber || '',
          profitLossStatement: {
            professionalFees: this.formatAmount(prof.pnl?.professionalFees || 0),
            expenses: this.formatAmount(this.calculateExpenseTotal(prof.pnl?.expenses)),
            depreciation: this.formatAmount(this.calculateExpenseTotal(prof.pnl?.depreciation)),
            netIncome: this.formatAmount(prof.pnl?.netIncome || 0),
          },
        })),
      };
    }

    return {
      netProfessionalIncome: this.formatAmount(professionalIncome),
    };
  }

  /**
   * Helper: Format balance sheet for export
   */
  formatBalanceSheetForExport(balanceSheet) {
    if (!balanceSheet || !balanceSheet.hasBalanceSheet) {
      return { maintained: false };
    }

    return {
      maintained: true,
      assets: {
        currentAssets: {
          cash: this.formatAmount(balanceSheet.assets?.currentAssets?.cash || 0),
          bank: this.formatAmount(balanceSheet.assets?.currentAssets?.bank || 0),
          inventory: this.formatAmount(balanceSheet.assets?.currentAssets?.inventory || 0),
          receivables: this.formatAmount(balanceSheet.assets?.currentAssets?.receivables || 0),
          other: this.formatAmount(balanceSheet.assets?.currentAssets?.other || 0),
          total: this.formatAmount(balanceSheet.assets?.currentAssets?.total || 0),
        },
        fixedAssets: {
          building: this.formatAmount(balanceSheet.assets?.fixedAssets?.building || 0),
          machinery: this.formatAmount(balanceSheet.assets?.fixedAssets?.machinery || 0),
          vehicles: this.formatAmount(balanceSheet.assets?.fixedAssets?.vehicles || 0),
          furniture: this.formatAmount(balanceSheet.assets?.fixedAssets?.furniture || 0),
          other: this.formatAmount(balanceSheet.assets?.fixedAssets?.other || 0),
          total: this.formatAmount(balanceSheet.assets?.fixedAssets?.total || 0),
        },
        investments: this.formatAmount(balanceSheet.assets?.investments || 0),
        loansAdvances: this.formatAmount(balanceSheet.assets?.loansAdvances || 0),
        total: this.formatAmount(balanceSheet.assets?.total || 0),
      },
      liabilities: {
        currentLiabilities: {
          creditors: this.formatAmount(balanceSheet.liabilities?.currentLiabilities?.creditors || 0),
          bankOverdraft: this.formatAmount(balanceSheet.liabilities?.currentLiabilities?.bankOverdraft || 0),
          shortTermLoans: this.formatAmount(balanceSheet.liabilities?.currentLiabilities?.shortTermLoans || 0),
          other: this.formatAmount(balanceSheet.liabilities?.currentLiabilities?.other || 0),
          total: this.formatAmount(balanceSheet.liabilities?.currentLiabilities?.total || 0),
        },
        longTermLiabilities: {
          longTermLoans: this.formatAmount(balanceSheet.liabilities?.longTermLiabilities?.longTermLoans || 0),
          other: this.formatAmount(balanceSheet.liabilities?.longTermLiabilities?.other || 0),
          total: this.formatAmount(balanceSheet.liabilities?.longTermLiabilities?.total || 0),
        },
        capital: this.formatAmount(balanceSheet.liabilities?.capital || 0),
        total: this.formatAmount(balanceSheet.liabilities?.total || 0),
      },
    };
  }

  /**
   * Helper: Format audit info for export
   */
  formatAuditInfoForExport(auditInfo) {
    if (!auditInfo || !auditInfo.isAuditApplicable) {
      return { applicable: false };
    }

    return {
      applicable: true,
      auditReason: auditInfo.auditReason || '',
      auditReportNumber: auditInfo.auditReportNumber || '',
      auditReportDate: auditInfo.auditReportDate || '',
      caDetails: {
        caName: auditInfo.caDetails?.caName || '',
        membershipNumber: auditInfo.caDetails?.membershipNumber || '',
        firmName: auditInfo.caDetails?.firmName || '',
        firmAddress: auditInfo.caDetails?.firmAddress || '',
      },
      bookOfAccountsMaintained: auditInfo.bookOfAccountsMaintained || false,
      form3CDFiled: auditInfo.form3CDFiled || false,
    };
  }

  /**
   * Helper: Format presumptive income for export
   */
  formatPresumptiveIncomeForExport(presumptiveIncome) {
    if (!presumptiveIncome) return {};

    return {
      hasPresumptiveIncome: presumptiveIncome.hasPresumptiveBusiness || presumptiveIncome.hasPresumptiveProfessional || false,
      presumptiveIncome: this.formatAmount(presumptiveIncome.presumptiveIncome || 0),
      grossReceipts: this.formatAmount(presumptiveIncome.grossReceipts || 0),
      section: presumptiveIncome.section || '',
    };
  }
}

module.exports = ITRController;