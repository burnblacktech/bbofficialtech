// =====================================================
// DRAFTS ROUTES
// Enterprise-grade draft management
// =====================================================

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const enterpriseLogger = require('../utils/logger');

// =====================================================
// GET USER DRAFTS
// =====================================================

router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Mock draft data
    const drafts = [
      {
        id: 1,
        type: 'ITR-1',
        assessmentYear: '2024-25',
        status: 'draft',
        createdAt: '2024-09-25',
        updatedAt: '2024-09-25',
      },
    ];

    enterpriseLogger.info('User drafts retrieved', {
      userId,
      count: drafts.length,
    });

    res.json({
      success: true,
      data: drafts,
    });
  } catch (error) {
    enterpriseLogger.error('Error fetching drafts', {
      error: error.message,
      userId: req.user?.userId,
    });

    res.status(500).json({
      error: 'Failed to fetch drafts',
    });
  }
});

// =====================================================
// CREATE DRAFT
// =====================================================

router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { type, assessmentYear } = req.body;

    // Mock draft creation
    const draft = {
      id: Date.now(),
      type,
      assessmentYear,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    enterpriseLogger.info('Draft created', {
      userId,
      draftId: draft.id,
      type,
      assessmentYear,
    });

    res.status(201).json({
      success: true,
      data: draft,
    });
  } catch (error) {
    enterpriseLogger.error('Error creating draft', {
      error: error.message,
      userId: req.user?.userId,
    });

    res.status(500).json({
      error: 'Failed to create draft',
    });
  }
});

module.exports = router;
