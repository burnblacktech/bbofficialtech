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

    const { pool } = require('../config/database');
    const enterpriseLogger = require('../utils/logger');

    const getDraftQuery = `
      SELECT d.id, d.step, d.data, d.is_completed, d.last_saved_at, d.created_at, d.updated_at,
             f.itr_type, f.status, f.assessment_year
      FROM itr_drafts d
      JOIN itr_filings f ON d.filing_id = f.id
      WHERE d.id = $1 AND f.user_id = $2
    `;

    const draft = await pool.query(getDraftQuery, [draftId, userId]);

    if (draft.rows.length === 0) {
      return res.status(404).json({
        error: 'Draft not found',
      });
    }

    res.json({
      draft: {
        id: draft.rows[0].id,
        itrType: draft.rows[0].itr_type,
        formData: JSON.parse(draft.rows[0].form_data),
        status: draft.rows[0].status,
        createdAt: draft.rows[0].created_at,
        updatedAt: draft.rows[0].updated_at,
      },
    });
  } catch (error) {
    enterpriseLogger.error('Get draft failed', {
      error: error.message,
      userId: req.user?.userId,
      draftId: req.params.draftId,
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

// Get specific filing
router.get('/filings/:filingId', authenticateToken, async (req, res) => {
  try {
    const { filingId } = req.params;
    const userId = req.user.userId;

    const { pool } = require('../config/database');
    const enterpriseLogger = require('../utils/logger');

    const getFilingQuery = `
      SELECT id, itr_type, form_data, tax_computation, status, submitted_at, assessment_year
      FROM itr_filings 
      WHERE id = $1 AND user_id = $2
    `;

    const filing = await pool.query(getFilingQuery, [filingId, userId]);

    if (filing.rows.length === 0) {
      return res.status(404).json({
        error: 'Filing not found',
      });
    }

    res.json({
      filing: {
        id: filing.rows[0].id,
        itrType: filing.rows[0].itr_type,
        formData: JSON.parse(filing.rows[0].form_data),
        taxComputation: JSON.parse(filing.rows[0].tax_computation),
        status: filing.rows[0].status,
        submittedAt: filing.rows[0].submitted_at,
        assessmentYear: filing.rows[0].assessment_year,
      },
    });
  } catch (error) {
    enterpriseLogger.error('Get filing failed', {
      error: error.message,
      userId: req.user?.userId,
      filingId: req.params.filingId,
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
// UTILITY ROUTES
// =====================================================

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

module.exports = router;