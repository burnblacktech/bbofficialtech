// =====================================================
// ITR ROUTES - CANONICAL FILING SYSTEM
// Single entry point for all ITR types (ITR1, ITR2, ITR3, ITR4)
// Uses itrType parameter to decide flow
// =====================================================

const express = require('express');
const ITRController = require('../controllers/ITRController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const itrController = new ITRController();

// =====================================================
// DRAFT MANAGEMENT ROUTES
// =====================================================

// Create new ITR draft
router.post('/drafts', authenticateToken, async (req, res) => {
  await itrController.createDraft(req, res);
});

// Update existing draft
router.put('/drafts/:draftId', authenticateToken, async (req, res) => {
  await itrController.updateDraft(req, res);
});

// Get user's drafts
router.get('/drafts', authenticateToken, async (req, res) => {
  await itrController.getUserDrafts(req, res);
});

// Get specific draft
router.get('/drafts/:draftId', authenticateToken, async (req, res) => {
  try {
    const { draftId } = req.params;
    const userId = req.user.userId;

    const { dbQuery } = require('../utils/dbQuery');
    const enterpriseLogger = require('../utils/logger');

    const getDraftQuery = `
      SELECT d.id, d.step, d.data, d.is_completed, d.last_saved_at, d.created_at, d.updated_at,
             f.itr_type, f.status, f.assessment_year, f.json_payload
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
    let formData = {};
    try {
      if (draftRow.data) {
        formData = typeof draftRow.data === 'string' ? JSON.parse(draftRow.data) : draftRow.data;
      } else if (draftRow.json_payload) {
        formData = typeof draftRow.json_payload === 'string' ? JSON.parse(draftRow.json_payload) : draftRow.json_payload;
      }
    } catch (parseError) {
      enterpriseLogger.error('Failed to parse draft data in GET endpoint', {
        error: parseError.message,
        draftId: req.params.draftId,
        userId: req.user?.userId,
      });
      return res.status(500).json({
        error: 'Invalid draft data format',
      });
    }

    res.json({
      draft: {
        id: draftRow.id,
        itrType: draftRow.itr_type,
        step: draftRow.step,
        formData: formData,
        status: draftRow.status,
        assessmentYear: draftRow.assessment_year,
        isCompleted: draftRow.is_completed,
        lastSavedAt: draftRow.last_saved_at,
        createdAt: draftRow.created_at,
        updatedAt: draftRow.updated_at,
      },
    });
  } catch (error) {
    const enterpriseLogger = require('../utils/logger');
    enterpriseLogger.error('Get draft failed', {
      error: error.message,
      userId: req.user?.userId,
      draftId: req.params.draftId,
      stack: error.stack,
    });
    res.status(500).json({
      error: 'Internal server error',
    });
  }
});

// =====================================================
// VALIDATION ROUTES
// =====================================================

// Validate draft
router.post('/drafts/:draftId/validate', authenticateToken, async (req, res) => {
  await itrController.validateDraft(req, res);
});

// =====================================================
// TAX COMPUTATION ROUTES
// =====================================================

// Compute tax for draft
router.post('/drafts/:draftId/compute', authenticateToken, async (req, res) => {
  await itrController.computeTax(req, res);
});

// Compute tax with regime comparison
router.post('/compute-tax', authenticateToken, async (req, res) => {
  try {
    const { formData, regime, assessmentYear } = req.body;
    const userId = req.user.userId;
    const enterpriseLogger = require('../utils/logger');
    const TaxRegimeCalculator = require('../services/business/TaxRegimeCalculator');

    if (!formData) {
      return res.status(400).json({
        success: false,
        error: 'formData is required',
      });
    }

    const calculator = new TaxRegimeCalculator();
    const selectedRegime = regime || 'old';
    const result = calculator.calculateTax(formData, selectedRegime, assessmentYear || '2024-25');

    enterpriseLogger.info('Tax computed', {
      userId,
      regime: selectedRegime,
      assessmentYear: assessmentYear || '2024-25',
      taxLiability: result.finalTaxLiability,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    const enterpriseLogger = require('../utils/logger');
    enterpriseLogger.error('Tax computation failed', {
      error: error.message,
      userId: req.user?.userId,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      error: error.message || 'Tax computation failed',
    });
  }
});

// Compare tax regimes (Old vs New)
router.post('/compare-regimes', authenticateToken, async (req, res) => {
  try {
    const { formData, assessmentYear } = req.body;
    const userId = req.user.userId;
    const enterpriseLogger = require('../utils/logger');
    const TaxRegimeCalculator = require('../services/business/TaxRegimeCalculator');

    if (!formData) {
      return res.status(400).json({
        success: false,
        error: 'formData is required',
      });
    }

    const calculator = new TaxRegimeCalculator();
    const comparison = calculator.compareRegimes(formData, assessmentYear || '2024-25');

    enterpriseLogger.info('Regime comparison completed', {
      userId,
      assessmentYear: assessmentYear || '2024-25',
      recommendedRegime: comparison.comparison.recommendedRegime,
      savings: comparison.comparison.savings,
    });

    res.json({
      success: true,
      data: comparison,
    });
  } catch (error) {
    const enterpriseLogger = require('../utils/logger');
    enterpriseLogger.error('Regime comparison failed', {
      error: error.message,
      userId: req.user?.userId,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      error: error.message || 'Regime comparison failed',
    });
  }
});

// =====================================================
// E-VERIFICATION ROUTES
// =====================================================

// Send Aadhaar OTP
router.post('/drafts/:draftId/everify/aadhaar', authenticateToken, async (req, res) => {
  await itrController.sendAadhaarOTP(req, res);
});

// Verify Aadhaar OTP
router.post('/drafts/:draftId/everify/aadhaar/verify', authenticateToken, async (req, res) => {
  await itrController.verifyAadhaarOTP(req, res);
});

// Verify Net Banking
router.post('/drafts/:draftId/everify/netbanking', authenticateToken, async (req, res) => {
  await itrController.verifyNetBanking(req, res);
});

// Verify DSC
router.post('/drafts/:draftId/everify/dsc', authenticateToken, async (req, res) => {
  await itrController.verifyDSC(req, res);
});

// Verify Demat Account
router.post('/drafts/:draftId/everify/demat', authenticateToken, async (req, res) => {
  await itrController.verifyDemat(req, res);
});

// Send Bank EVC
router.post('/drafts/:draftId/everify/bank-evc/send', authenticateToken, async (req, res) => {
  await itrController.sendBankEVC(req, res);
});

// Verify Bank EVC
router.post('/drafts/:draftId/everify/bank-evc/verify', authenticateToken, async (req, res) => {
  await itrController.verifyBankEVC(req, res);
});

// Get verification status
router.get('/filings/:filingId/verification', authenticateToken, async (req, res) => {
  await itrController.getVerificationStatus(req, res);
});

// =====================================================
// REFUND TRACKING ROUTES
// =====================================================

// Get refund status
router.get('/filings/:filingId/refund/status', authenticateToken, async (req, res) => {
  await itrController.getRefundStatus(req, res);
});

// Get refund history
router.get('/refunds/history', authenticateToken, async (req, res) => {
  await itrController.getRefundHistory(req, res);
});

// Update refund bank account
router.post('/filings/:filingId/refund/update-account', authenticateToken, async (req, res) => {
  await itrController.updateRefundBankAccount(req, res);
});

// Request refund re-issue
router.post('/filings/:filingId/refund/reissue-request', authenticateToken, async (req, res) => {
  await itrController.requestRefundReissue(req, res);
});

// =====================================================
// DISCREPANCY HANDLING ROUTES
// =====================================================

// Get all discrepancies (grouped)
router.get('/filings/:filingId/discrepancies', authenticateToken, async (req, res) => {
  await itrController.getDiscrepancies(req, res);
});

// Resolve single discrepancy
router.post('/filings/:filingId/discrepancies/resolve', authenticateToken, async (req, res) => {
  await itrController.resolveDiscrepancy(req, res);
});

// Bulk resolve discrepancies
router.post('/filings/:filingId/discrepancies/bulk-resolve', authenticateToken, async (req, res) => {
  await itrController.bulkResolveDiscrepancies(req, res);
});

// Get AI suggestions
router.get('/filings/:filingId/discrepancies/suggestions', authenticateToken, async (req, res) => {
  await itrController.getDiscrepancySuggestions(req, res);
});

// Get resolution history
router.get('/filings/:filingId/discrepancies/history', authenticateToken, async (req, res) => {
  await itrController.getDiscrepancyHistory(req, res);
});

// =====================================================
// SUBMISSION ROUTES
// =====================================================

// Submit ITR
router.post('/drafts/:draftId/submit', authenticateToken, async (req, res) => {
  await itrController.submitITR(req, res);
});

// =====================================================
// FILING HISTORY ROUTES
// =====================================================

// Get user's filings
router.get('/filings', authenticateToken, async (req, res) => {
  await itrController.getUserFilings(req, res);
});

// Pause a filing
router.post('/filings/:filingId/pause', authenticateToken, async (req, res) => {
  await itrController.pauseFiling(req, res);
});

// Resume a paused filing
router.post('/filings/:filingId/resume', authenticateToken, async (req, res) => {
  await itrController.resumeFiling(req, res);
});

// Get specific filing
router.get('/filings/:filingId', authenticateToken, async (req, res) => {
  try {
    const { filingId } = req.params;
    const userId = req.user.userId;

    const { dbQuery } = require('../utils/dbQuery');
    const enterpriseLogger = require('../utils/logger');

    const getFilingQuery = `
      SELECT id, itr_type, json_payload, tax_computation, status, submitted_at, assessment_year, created_at, updated_at
      FROM itr_filings 
      WHERE id = $1 AND user_id = $2
    `;

    const filing = await dbQuery(getFilingQuery, [filingId, userId]);

    if (filing.rows.length === 0) {
      return res.status(404).json({
        error: 'Filing not found',
      });
    }

    const filingRow = filing.rows[0];
    const formData = filingRow.json_payload ? 
                     (typeof filingRow.json_payload === 'string' ? JSON.parse(filingRow.json_payload) : filingRow.json_payload) : {};
    const taxComputation = filingRow.tax_computation ? 
                           (typeof filingRow.tax_computation === 'string' ? JSON.parse(filingRow.tax_computation) : filingRow.tax_computation) : null;

    res.json({
      filing: {
        id: filingRow.id,
        itrType: filingRow.itr_type,
        formData: formData,
        taxComputation: taxComputation,
        status: filingRow.status,
        submittedAt: filingRow.submitted_at,
        assessmentYear: filingRow.assessment_year,
        createdAt: filingRow.created_at,
        updatedAt: filingRow.updated_at,
      },
    });
  } catch (error) {
    const enterpriseLogger = require('../utils/logger');
    enterpriseLogger.error('Get filing failed', {
      error: error.message,
      userId: req.user?.userId,
      filingId: req.params.filingId,
      stack: error.stack,
    });
    res.status(500).json({
      error: 'Internal server error',
    });
  }
});

// =====================================================
// ITR TYPE SPECIFIC ROUTES
// =====================================================

// Get ITR type configuration
router.get('/config/:itrType', authenticateToken, async (req, res) => {
  try {
    const { itrType } = req.params;
    const validTypes = ['ITR1', 'ITR2', 'ITR3', 'ITR4'];

    if (!validTypes.includes(itrType)) {
      return res.status(400).json({
        error: 'Invalid ITR type',
      });
    }

    // Load ITR-specific configuration
    const fs = require('fs');
    const path = require('path');
    const enterpriseLogger = require('../utils/logger');

    try {
      const configPath = path.join(__dirname, '../common/rules', `${itrType.toLowerCase()}.rules.json`);
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

      res.json({
        itrType,
        config,
      });
    } catch (configError) {
      enterpriseLogger.warn('ITR config not found, using default', {
        itrType,
        error: configError.message,
      });

      // Return default configuration
      res.json({
        itrType,
        config: {
          sections: ['personalInfo', 'income', 'deductions', 'taxComputation'],
          requiredFields: ['firstName', 'lastName', 'panNumber'],
          maxDeductions: {
            section80C: 150000,
            section80D: 25000,
            section80G: 100000,
          },
        },
      });
    }
  } catch (error) {
    enterpriseLogger.error('Get ITR config failed', {
      error: error.message,
      itrType: req.params.itrType,
    });
    res.status(500).json({
      error: 'Internal server error',
    });
  }
});

// =====================================================
// PAN VERIFICATION ROUTES
// =====================================================

const panVerificationService = require('../services/business/PANVerificationService');
const FamilyMember = require('../models/Member');
const User = require('../models/User');

// Check PAN verification status
router.get('/pan/status/:panNumber', authenticateToken, async (req, res) => {
  try {
    const { panNumber } = req.params;
    const userId = req.user.userId;
    const enterpriseLogger = require('../utils/logger');

    // Validate PAN format
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!panRegex.test(panNumber.toUpperCase())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid PAN format',
      });
    }

    const normalizedPAN = panNumber.toUpperCase();

    let verified = false;
    let verifiedAt = null;
    let source = null;

    // First check if PAN belongs to the user themselves
    const user = await User.findByPk(userId);
    if (user && user.panNumber && user.panNumber.toUpperCase() === normalizedPAN) {
      verified = user.panVerified || false;
      verifiedAt = user.panVerifiedAt || null;
      source = 'user';
    } else {
      // Check if PAN belongs to a family member
      const familyMember = await FamilyMember.findOne({
        where: {
          userId,
          panNumber: normalizedPAN,
        },
      });

      if (familyMember) {
        verified = familyMember.panVerified || false;
        verifiedAt = familyMember.panVerifiedAt || null;
        source = 'family_member';
      } else {
        // PAN doesn't belong to user or family members
        return res.status(404).json({
          success: false,
          error: 'PAN not found for this user',
        });
      }
    }

    enterpriseLogger.info('PAN status checked', {
      userId,
      panNumber: normalizedPAN,
      verified,
    });

    res.json({
      success: true,
      data: {
        pan: normalizedPAN,
        verified,
        verifiedAt,
        source,
      },
    });
  } catch (error) {
    const enterpriseLogger = require('../utils/logger');
    enterpriseLogger.error('PAN status check failed', {
      error: error.message,
      userId: req.user?.userId,
      panNumber: req.params.panNumber,
    });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// Verify PAN using SurePass
router.post('/pan/verify', authenticateToken, async (req, res) => {
  try {
    const { pan, memberId, memberType } = req.body;
    const userId = req.user.userId;
    const enterpriseLogger = require('../utils/logger');

    if (!pan) {
      return res.status(400).json({
        success: false,
        error: 'PAN number is required',
      });
    }

    // Verify PAN using SurePass service
    const verificationResult = await panVerificationService.verifyPAN(pan, userId);

    if (!verificationResult.isValid) {
      return res.status(400).json({
        success: false,
        error: 'PAN verification failed',
        data: verificationResult,
      });
    }

    // Update verification status in database
    if (memberType === 'family' && memberId) {
      // Update family member PAN verification status
      await FamilyMember.update(
        {
          panVerified: true,
          panVerifiedAt: new Date(),
        },
        {
          where: {
            id: memberId,
            userId,
          },
        }
      );
    } else if (memberType === 'self') {
      // Update user PAN verification status
      await User.update(
        {
          panNumber: pan.toUpperCase(),
          panVerified: true,
          panVerifiedAt: new Date(),
        },
        {
          where: {
            id: userId,
          },
        }
      );
      enterpriseLogger.info('User PAN verified', {
        userId,
        pan,
      });
    }

    enterpriseLogger.info('PAN verified successfully', {
      userId,
      pan,
      memberId,
      memberType,
    });

    res.json({
      success: true,
      message: 'PAN verified successfully',
      data: {
        pan: verificationResult.pan,
        isValid: verificationResult.isValid,
        name: verificationResult.name,
        status: verificationResult.status || 'Active',
        dateOfBirth: verificationResult.dateOfBirth || null,
        verifiedAt: verificationResult.verifiedAt,
        source: verificationResult.source,
      },
    });
  } catch (error) {
    const enterpriseLogger = require('../utils/logger');
    enterpriseLogger.error('PAN verification failed', {
      error: error.message,
      userId: req.user?.userId,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
});

// =====================================================
// RTR (RETURN TYPE RECOMMENDER) ROUTES
// =====================================================

// Recommend ITR form based on minimal user inputs (MVI)
router.post('/rtr/recommend', authenticateToken, async (req, res) => {
  try {
    const { mviInputs, pan, userId: clientUserId } = req.body;
    const userId = req.user.userId;
    const RTRService = require('../services/business/RTRService');
    const { User } = require('../models');
    const enterpriseLogger = require('../utils/logger');

    enterpriseLogger.info('Received RTR recommendation request', { userId, pan, mviInputs });

    // Get user's firm context
    const user = await User.findByPk(userId);
    const firmContext = user ? user.getFirmContext() : null;

    const recommendation = await RTRService.recommendITR(mviInputs);

    // Add firm context to recommendation
    const recommendationWithContext = {
      ...recommendation,
      firmContext: firmContext ? {
        firmId: firmContext.firmId,
        isFirmUser: !!firmContext.firmId,
      } : null,
    };

    res.json({
      success: true,
      data: recommendationWithContext,
    });
  } catch (error) {
    const enterpriseLogger = require('../utils/logger');
    enterpriseLogger.error('RTR recommendation failed', {
      error: error.message,
      userId: req.user?.userId,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      error: 'Internal server error during RTR recommendation',
    });
  }
});

// Request CA Review for a filing
router.post('/ca-review/request', authenticateToken, async (req, res) => {
  try {
    const { filingData, userNotes } = req.body;
    const userId = req.user.userId;
    const ExpertReviewService = require('../services/business/ExpertReviewService');
    const enterpriseLogger = require('../utils/logger');

    enterpriseLogger.info('Received CA review request', { userId, filingData, userNotes });

    // For RTR-triggered reviews, we don't have a filingId yet, so we create a placeholder
    // or link it to the user's current session/draft context.
    // For now, we'll simulate creating a ticket.
    const result = await ExpertReviewService.requestRTRReview({
      userId,
      pan: filingData.pan,
      assessmentYear: filingData.assessmentYear,
      itrType: filingData.itrType,
      reason: filingData.reason,
      userNotes,
      mviInputs: filingData.mviInputs,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    const enterpriseLogger = require('../utils/logger');
    enterpriseLogger.error('CA review request failed', {
      error: error.message,
      userId: req.user?.userId,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      error: 'Internal server error during CA review request',
    });
  }
});

// =====================================================
// ITR FORM RECOMMENDATION ROUTES
// =====================================================

// Recommend ITR form based on user data
router.post('/recommend-form', authenticateToken, async (req, res) => {
  try {
    const { pan, verificationResult, userData } = req.body;
    const userId = req.user.userId;
    const enterpriseLogger = require('../utils/logger');

    // Basic analysis logic (can be enhanced with ML/AI)
    let recommendedITR = 'ITR-1';
    let reason = 'Default recommendation for simple tax structure';
    let confidence = 0.5;
    const allEligibleITRs = ['ITR-1'];

    // Analyze user data
    if (userData) {
      const hasBusinessIncome = (userData.businessIncome || 0) > 0;
      const hasProfessionalIncome = (userData.professionalIncome || 0) > 0;
      const hasCapitalGains = (userData.capitalGains || 0) > 0;
      const hasMultipleProperties = (userData.houseProperties?.length || 0) > 1;
      const hasForeignIncome = (userData.foreignIncome || 0) > 0;
      const isNRI = userData.isNRI || false;
      const isDirector = userData.isDirector || false;
      const isPartner = userData.isPartner || false;

      // ITR-3: Business or professional income
      if (hasBusinessIncome || hasProfessionalIncome) {
        recommendedITR = 'ITR-3';
        reason = 'Business or professional income detected';
        confidence = 0.9;
        allEligibleITRs.push('ITR-3');
        
        // ITR-4: Presumptive taxation (if business income < 2 crores)
        if (hasBusinessIncome && userData.businessIncome < 20000000) {
          allEligibleITRs.push('ITR-4');
        }
      }
      // ITR-2: Capital gains, multiple properties, foreign income, director/partner
      else if (hasCapitalGains || hasMultipleProperties || hasForeignIncome || isNRI || isDirector || isPartner) {
        recommendedITR = 'ITR-2';
        reason = 'Complex income sources detected (capital gains, multiple properties, foreign income, or director/partner status)';
        confidence = 0.85;
        allEligibleITRs.push('ITR-2');
      }
      // ITR-1: Simple salaried individual
      else {
        recommendedITR = 'ITR-1';
        reason = 'Simple salaried individual with basic income sources';
        confidence = 0.8;
      }
    }

    // Check PAN category if available
    if (verificationResult?.category) {
      const category = verificationResult.category.toLowerCase();
      if (category.includes('firm') || category.includes('company') || category.includes('business')) {
        if (!allEligibleITRs.includes('ITR-3')) {
          recommendedITR = 'ITR-3';
          reason = 'PAN category indicates business/professional income';
          confidence = 0.75;
          allEligibleITRs.push('ITR-3');
        }
      }
    }

    enterpriseLogger.info('ITR form recommended', {
      userId,
      pan,
      recommendedITR,
      confidence,
      allEligibleITRs,
    });

    res.json({
      success: true,
      data: {
        recommendedITR,
        reason,
        confidence,
        allEligibleITRs,
        triggeredRules: [],
        caReviewRequired: recommendedITR === 'ITR-3' || recommendedITR === 'ITR-4',
      },
    });
  } catch (error) {
    const enterpriseLogger = require('../utils/logger');
    enterpriseLogger.error('ITR form recommendation failed', {
      error: error.message,
      userId: req.user?.userId,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// =====================================================
// DATA PREFETCH ROUTES
// =====================================================

// Get data sources for a return version
router.get('/returns/:returnId/versions/:versionId/sources', authenticateToken, async (req, res) => {
  try {
    const { returnId, versionId } = req.params;
    const userId = req.user.userId;
    const enterpriseLogger = require('../utils/logger');
    const SourceTaggingService = require('../services/business/SourceTaggingService');

    // Verify return belongs to user
    const { pool } = require('../config/database');
    const returnQuery = await pool.query(
      'SELECT id FROM itr_filings WHERE id = $1 AND user_id = $2',
      [returnId, userId]
    );

    if (returnQuery.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Return not found',
      });
    }

    const sourceService = new SourceTaggingService();
    const sources = await sourceService.getVersionSources(versionId);

    res.json({
      success: true,
      data: sources,
    });
  } catch (error) {
    const enterpriseLogger = require('../utils/logger');
    enterpriseLogger.error('Failed to get data sources', {
      error: error.message,
      returnId: req.params.returnId,
      versionId: req.params.versionId,
      userId: req.user?.userId,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get data sources',
    });
  }
});

// Verify a data source
router.post('/sources/:sourceId/verify', authenticateToken, async (req, res) => {
  try {
    const { sourceId } = req.params;
    const userId = req.user.userId;
    const enterpriseLogger = require('../utils/logger');
    const SourceTaggingService = require('../services/business/SourceTaggingService');

    const sourceService = new SourceTaggingService();
    const source = await sourceService.verifySource(sourceId, userId);

    res.json({
      success: true,
      data: source,
      message: 'Source verified successfully',
    });
  } catch (error) {
    const enterpriseLogger = require('../utils/logger');
    enterpriseLogger.error('Failed to verify source', {
      error: error.message,
      sourceId: req.params.sourceId,
      userId: req.user?.userId,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to verify source',
    });
  }
});

// Prefetch ITR data from ERI/AIS/Form26AS
router.get('/prefetch/:pan/:assessmentYear', authenticateToken, async (req, res) => {
  try {
    const { pan, assessmentYear } = req.params;
    const userId = req.user.userId;
    const enterpriseLogger = require('../utils/logger');
    const ITRDataPrefetchService = require('../services/business/ITRDataPrefetchService');

    const prefetchService = new ITRDataPrefetchService();
    const result = await prefetchService.prefetchData(userId, pan, assessmentYear);

    enterpriseLogger.info('ITR prefetch completed', {
      userId,
      pan,
      assessmentYear,
      sourcesAvailable: Object.values(result.sources).filter(s => s.available).length,
    });

    res.json({
      success: true,
      data: result.data,
      sources: result.sources,
    });
  } catch (error) {
    const enterpriseLogger = require('../utils/logger');
    enterpriseLogger.error('ITR prefetch failed', {
      error: error.message,
      userId: req.user?.userId,
      pan: req.params.pan,
      assessmentYear: req.params.assessmentYear,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to prefetch ITR data',
    });
  }
});

// Verify and compare manual vs uploaded data
router.post('/verify-data', authenticateToken, async (req, res) => {
  try {
    const { manualData, uploadedData } = req.body;
    const userId = req.user.userId;
    const dataMatchingService = require('../services/business/DataMatchingService');

    // Compare data and get discrepancies
    const discrepancies = [];

    // Compare income data
    if (manualData.income && uploadedData.income) {
      const incomeDiscrepancies = dataMatchingService.compareData(
        manualData.income,
        uploadedData.income,
        'income',
      );
      discrepancies.push(...incomeDiscrepancies);
    }

    // Compare capital gains
    if (manualData.income?.capitalGains && uploadedData.income?.capitalGains) {
      const cgDiscrepancies = dataMatchingService.compareData(
        manualData.income.capitalGains,
        uploadedData.income.capitalGains,
        'capitalGains',
      );
      discrepancies.push(...cgDiscrepancies);
    }

    // Compare house property
    if (manualData.income?.houseProperty && uploadedData.income?.houseProperty) {
      const hpDiscrepancies = dataMatchingService.compareData(
        manualData.income.houseProperty,
        uploadedData.income.houseProperty,
        'houseProperty',
      );
      discrepancies.push(...hpDiscrepancies);
    }

    // Compare deductions
    if (manualData.deductions && uploadedData.deductions) {
      const deductionDiscrepancies = dataMatchingService.compareData(
        manualData.deductions,
        uploadedData.deductions,
        'deduction',
      );
      discrepancies.push(...deductionDiscrepancies);
    }

    const summary = dataMatchingService.getDiscrepancySummary(discrepancies);

    enterpriseLogger.info('Data verification completed', {
      userId,
      discrepancyCount: discrepancies.length,
      summary,
    });

    res.json({
      success: true,
      discrepancies,
      summary,
    });
  } catch (error) {
    enterpriseLogger.error('Data verification failed', {
      error: error.message,
      userId: req.user?.userId,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to verify data',
    });
  }
});

// Verify and reconcile prefetch data
router.post('/prefetch/verify', authenticateToken, async (req, res) => {
  try {
    const { prefetchData, formData } = req.body;
    const userId = req.user.userId;
    const enterpriseLogger = require('../utils/logger');

    // Compare prefetch data with form data to identify discrepancies
    const discrepancies = [];
    
    // Check income discrepancies
    if (prefetchData.income && formData.income) {
      Object.keys(prefetchData.income).forEach(key => {
        if (prefetchData.income[key] !== formData.income[key]) {
          discrepancies.push({
            field: `income.${key}`,
            prefetchValue: prefetchData.income[key],
            formValue: formData.income[key],
            type: 'income',
          });
        }
      });
    }

    // Check taxes paid discrepancies
    if (prefetchData.taxesPaid && formData.taxesPaid) {
      Object.keys(prefetchData.taxesPaid).forEach(key => {
        if (prefetchData.taxesPaid[key] !== formData.taxesPaid[key]) {
          discrepancies.push({
            field: `taxesPaid.${key}`,
            prefetchValue: prefetchData.taxesPaid[key],
            formValue: formData.taxesPaid[key],
            type: 'taxesPaid',
          });
        }
      });
    }

    enterpriseLogger.info('Prefetch verification completed', {
      userId,
      discrepanciesCount: discrepancies.length,
    });

    res.json({
      success: true,
      discrepancies,
      verified: discrepancies.length === 0,
    });
  } catch (error) {
    const enterpriseLogger = require('../utils/logger');
    enterpriseLogger.error('Prefetch verification failed', {
      error: error.message,
      userId: req.user?.userId,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to verify prefetch data',
    });
  }
});

// =====================================================
// UTILITY ROUTES
// =====================================================

// Generate AI recommendations
router.post('/recommendations', authenticateToken, async (req, res) => {
  try {
    const { formData, itrType, assessmentYear } = req.body;
    const userId = req.user.userId;
    const enterpriseLogger = require('../utils/logger');
    const aiRecommendationService = require('../services/business/AIRecommendationService');

    if (!formData || !itrType) {
      return res.status(400).json({
        success: false,
        error: 'formData and itrType are required',
      });
    }

    // AIRecommendationService is exported as a singleton instance
    const recommendationService = aiRecommendationService;
    const recommendations = await recommendationService.generateRecommendations(
      formData,
      itrType,
      assessmentYear || '2024-25'
    );

    enterpriseLogger.info('AI recommendations generated', {
      userId,
      itrType,
      count: recommendations.length,
    });

    res.json({
      success: true,
      recommendations,
    });
  } catch (error) {
    const enterpriseLogger = require('../utils/logger');
    enterpriseLogger.error('AI recommendations generation failed', {
      error: error.message,
      userId: req.user?.userId,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate recommendations',
    });
  }
});

// Get return versions
router.get('/returns/:returnId/versions', authenticateToken, async (req, res) => {
  try {
    const { returnId } = req.params;
    const userId = req.user.userId;
    const enterpriseLogger = require('../utils/logger');
    const VersionService = require('../services/business/VersionService');

    // Verify return belongs to user
    const { pool } = require('../config/database');
    const returnQuery = await pool.query(
      'SELECT id FROM itr_filings WHERE id = $1 AND user_id = $2',
      [returnId, userId]
    );

    if (returnQuery.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Return not found',
      });
    }

    const versionService = new VersionService();
    const versions = await versionService.getVersions(returnId);

    res.json({
      success: true,
      data: versions,
    });
  } catch (error) {
    const enterpriseLogger = require('../utils/logger');
    enterpriseLogger.error('Failed to get return versions', {
      error: error.message,
      returnId: req.params.returnId,
      userId: req.user?.userId,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get versions',
    });
  }
});

// Compare two versions
router.get('/versions/:versionId1/compare/:versionId2', authenticateToken, async (req, res) => {
  try {
    const { versionId1, versionId2 } = req.params;
    const enterpriseLogger = require('../utils/logger');
    const VersionService = require('../services/business/VersionService');

    const versionService = new VersionService();
    const comparison = await versionService.compareVersions(versionId1, versionId2);

    res.json({
      success: true,
      data: comparison,
    });
  } catch (error) {
    const enterpriseLogger = require('../utils/logger');
    enterpriseLogger.error('Failed to compare versions', {
      error: error.message,
      versionId1: req.params.versionId1,
      versionId2: req.params.versionId2,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to compare versions',
    });
  }
});

// Revert to a version
router.post('/returns/:returnId/revert/:versionId', authenticateToken, async (req, res) => {
  try {
    const { returnId, versionId } = req.params;
    const userId = req.user.userId;
    const enterpriseLogger = require('../utils/logger');
    const VersionService = require('../services/business/VersionService');

    // Verify return belongs to user
    const { pool } = require('../config/database');
    const returnQuery = await pool.query(
      'SELECT id FROM itr_filings WHERE id = $1 AND user_id = $2',
      [returnId, userId]
    );

    if (returnQuery.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Return not found',
      });
    }

    const versionService = new VersionService();
    const newVersion = await versionService.revertToVersion(returnId, versionId, userId);

    res.json({
      success: true,
      data: newVersion,
      message: 'Return reverted successfully',
    });
  } catch (error) {
    const enterpriseLogger = require('../utils/logger');
    enterpriseLogger.error('Failed to revert return', {
      error: error.message,
      returnId: req.params.returnId,
      versionId: req.params.versionId,
      userId: req.user?.userId,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to revert return',
    });
  }
});

// Get ITR eligibility
router.post('/eligibility', authenticateToken, async (req, res) => {
  try {
    const { incomeSources, deductions, otherIncome } = req.body;
    const enterpriseLogger = require('../utils/logger');

    // Simple eligibility logic
    const eligibleTypes = [];

    // ITR-1: Salary income only, no business/professional income
    if (incomeSources.salary && !incomeSources.business && !incomeSources.professional) {
      eligibleTypes.push('ITR1');
    }

    // ITR-2: Multiple income sources but no business/professional income
    if ((incomeSources.salary || incomeSources.houseProperty || incomeSources.capitalGains || incomeSources.otherIncome)
        && !incomeSources.business && !incomeSources.professional) {
      eligibleTypes.push('ITR2');
    }

    // ITR-3: Business/Professional income
    if (incomeSources.business || incomeSources.professional) {
      eligibleTypes.push('ITR3');
    }

    // ITR-4: Presumptive taxation
    if (incomeSources.business && incomeSources.business < 2000000) {
      eligibleTypes.push('ITR4');
    }

    enterpriseLogger.info('ITR eligibility checked', {
      userId: req.user.userId,
      eligibleTypes,
    });

    res.json({
      eligibleTypes,
      recommendation: eligibleTypes[0] || 'ITR1', // Default recommendation
    });
  } catch (error) {
    enterpriseLogger.error('ITR eligibility check failed', {
      error: error.message,
      userId: req.user?.userId,
    });
    res.status(500).json({
      error: 'Internal server error',
    });
  }
});

// =====================================================
// PREVIOUS YEAR COPY ROUTES
// =====================================================

// Get available previous year filings
router.get('/previous-years', authenticateToken, async (req, res) => {
  await itrController.getAvailablePreviousYears(req, res);
});

// Get previous year data for preview
router.get('/previous-years/:filingId', authenticateToken, async (req, res) => {
  await itrController.getPreviousYearData(req, res);
});

// Copy data from previous year to current filing
router.post('/filings/:filingId/copy-from-previous', authenticateToken, async (req, res) => {
  await itrController.copyFromPreviousYear(req, res);
});

// Tax Payment Challan Generation
router.post('/filings/:filingId/taxes-paid/challan', authenticateToken, async (req, res) => {
  await itrController.generateChallan(req, res);
});

// =====================================================
// FOREIGN ASSETS (SCHEDULE FA) ROUTES
// =====================================================

router.get('/filings/:filingId/foreign-assets', authenticateToken, async (req, res) => {
  await itrController.getForeignAssets(req, res);
});

router.post('/filings/:filingId/foreign-assets', authenticateToken, async (req, res) => {
  await itrController.addForeignAsset(req, res);
});

router.put('/filings/:filingId/foreign-assets/:assetId', authenticateToken, async (req, res) => {
  await itrController.updateForeignAsset(req, res);
});

router.delete('/filings/:filingId/foreign-assets/:assetId', authenticateToken, async (req, res) => {
  await itrController.deleteForeignAsset(req, res);
});

router.post('/filings/:filingId/foreign-assets/:assetId/documents', authenticateToken, async (req, res) => {
  await itrController.uploadForeignAssetDocument(req, res);
});

// =====================================================
// TAX SIMULATION (WHAT-IF ANALYSIS) ROUTES
// =====================================================

router.post('/filings/:filingId/simulate', authenticateToken, async (req, res) => {
  await itrController.simulateTaxScenario(req, res);
});

router.post('/filings/:filingId/compare-scenarios', authenticateToken, async (req, res) => {
  await itrController.compareScenarios(req, res);
});

router.post('/filings/:filingId/apply-simulation', authenticateToken, async (req, res) => {
  await itrController.applySimulation(req, res);
});

router.get('/filings/:filingId/optimization-opportunities', authenticateToken, async (req, res) => {
  await itrController.getOptimizationOpportunities(req, res);
});

// =====================================================
// INCOME ROUTES
// =====================================================

// House Property Income
router.get('/filings/:filingId/income/house-property', authenticateToken, async (req, res) => {
  await itrController.getHouseProperty(req, res);
});

router.put('/filings/:filingId/income/house-property', authenticateToken, async (req, res) => {
  await itrController.updateHouseProperty(req, res);
});

// Capital Gains Income
router.get('/filings/:filingId/income/capital-gains', authenticateToken, async (req, res) => {
  await itrController.getCapitalGains(req, res);
});

router.put('/filings/:filingId/income/capital-gains', authenticateToken, async (req, res) => {
  await itrController.updateCapitalGains(req, res);
});

// AIS Integration Routes
router.get('/filings/:filingId/ais/rental-income', authenticateToken, async (req, res) => {
  await itrController.getAISRentalIncome(req, res);
});

router.post('/filings/:filingId/income/house-property/apply-ais', authenticateToken, async (req, res) => {
  await itrController.applyAISHouseProperty(req, res);
});

// House Property OCR endpoints
router.post('/filings/:filingId/income/house-property/ocr-rent-receipts', authenticateToken, async (req, res) => {
  await itrController.processRentReceiptsOCR(req, res);
});

router.get('/filings/:filingId/ais/capital-gains', authenticateToken, async (req, res) => {
  await itrController.getAISCapitalGains(req, res);
});

router.post('/filings/:filingId/income/capital-gains/apply-ais', authenticateToken, async (req, res) => {
  await itrController.applyAISCapitalGains(req, res);
});

// Business Income AIS Routes
router.get('/filings/:filingId/ais/business-income', authenticateToken, async (req, res) => {
  await itrController.getAISBusinessIncome(req, res);
});

router.post('/filings/:filingId/income/business/apply-ais', authenticateToken, async (req, res) => {
  await itrController.applyAISBusinessIncome(req, res);
});

// Professional Income AIS Routes
router.get('/filings/:filingId/ais/professional-income', authenticateToken, async (req, res) => {
  await itrController.getAISProfessionalIncome(req, res);
});

router.post('/filings/:filingId/income/professional/apply-ais', authenticateToken, async (req, res) => {
  await itrController.applyAISProfessionalIncome(req, res);
});

// Business Income
router.get('/filings/:filingId/income/business', authenticateToken, async (req, res) => {
  await itrController.getBusinessIncome(req, res);
});

router.put('/filings/:filingId/income/business', authenticateToken, async (req, res) => {
  await itrController.updateBusinessIncome(req, res);
});

// Professional Income
router.get('/filings/:filingId/income/professional', authenticateToken, async (req, res) => {
  await itrController.getProfessionalIncome(req, res);
});

router.put('/filings/:filingId/income/professional', authenticateToken, async (req, res) => {
  await itrController.updateProfessionalIncome(req, res);
});

// =====================================================
// PDF EXPORT ROUTES
// =====================================================

router.get('/drafts/:draftId/export/pdf', authenticateToken, async (req, res) => {
  await itrController.exportDraftPDF(req, res);
});

router.get('/filings/:filingId/tax-computation/pdf', authenticateToken, async (req, res) => {
  await itrController.exportTaxComputationPDF(req, res);
});

router.get('/filings/:filingId/discrepancies/pdf', authenticateToken, async (req, res) => {
  await itrController.exportDiscrepancyPDF(req, res);
});

router.post('/filings/:filingId/discrepancies/email', authenticateToken, async (req, res) => {
  await itrController.sendDiscrepancyReportEmail(req, res);
});

// Share draft for CA review
router.post('/drafts/:filingId/share', authenticateToken, async (req, res) => {
  await itrController.shareDraft(req, res);
});

router.get('/filings/:filingId/acknowledgment/pdf', authenticateToken, async (req, res) => {
  await itrController.exportAcknowledgmentPDF(req, res);
});

// =====================================================
// JSON EXPORT ROUTES
// =====================================================

// Export ITR data as JSON
router.post('/export', authenticateToken, async (req, res) => {
  await itrController.exportITRJson(req, res);
});

// Download exported JSON file
router.get('/export/download/:fileName', authenticateToken, async (req, res) => {
  await itrController.downloadExportedJson(req, res);
});

// =====================================================
// BALANCE SHEET ROUTES
// =====================================================

router.get('/filings/:filingId/balance-sheet', authenticateToken, async (req, res) => {
  await itrController.getBalanceSheet(req, res);
});

router.put('/filings/:filingId/balance-sheet', authenticateToken, async (req, res) => {
  await itrController.updateBalanceSheet(req, res);
});

// =====================================================
// AUDIT INFORMATION ROUTES
// =====================================================

router.get('/filings/:filingId/audit-information', authenticateToken, async (req, res) => {
  await itrController.getAuditInformation(req, res);
});

router.put('/filings/:filingId/audit-information', authenticateToken, async (req, res) => {
  await itrController.updateAuditInformation(req, res);
});

router.post('/filings/:filingId/audit-information/check-applicability', authenticateToken, async (req, res) => {
  await itrController.checkAuditApplicability(req, res);
});

module.exports = router;