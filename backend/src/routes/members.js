// =====================================================
// MEMBER ROUTES - CANONICAL FAMILY MEMBER MANAGEMENT API
// =====================================================

const express = require('express');
const router = express.Router();
const memberController = require('../controllers/MemberController');
const authMiddleware = require('../middleware/auth');
const enterpriseLogger = require('../utils/logger');
const { Op } = require('sequelize');
const { AppError } = require('../middleware/errorHandler');
const { FamilyMember } = require('../models');

// Apply authentication middleware to all routes
router.use(authMiddleware.authenticateToken);

// =====================================================
// MEMBER CRUD ROUTES
// =====================================================

/**
 * @route GET /api/members
 * @description Get all members for the authenticated user
 * @access Private (User)
 * @query {string} status - Filter by member status (active, inactive)
 * @query {string} search - Search by name, PAN, or relationship
 */
router.get('/', memberController.getMembers);

/**
 * @route GET /api/members/:id
 * @description Get a specific member by ID
 * @access Private (User)
 * @param {string} id - Member ID
 */
router.get('/:id', memberController.getMemberById);

/**
 * @route POST /api/members
 * @description Create a new family member
 * @access Private (User)
 * @body {string} fullName - Member's full name
 * @body {string} pan - Member's PAN number
 * @body {string} relationship - Relationship to user (spouse, child, parent, sibling, other)
 * @body {string} dateOfBirth - Member's date of birth (optional)
 * @body {string} gender - Member's gender (male, female, other) (optional)
 * @body {object} metadata - Additional member metadata (optional)
 */
router.post('/', memberController.createMember);

/**
 * @route PUT /api/members/:id
 * @description Update a family member
 * @access Private (User)
 * @param {string} id - Member ID
 * @body {string} fullName - Member's full name (optional)
 * @body {string} pan - Member's PAN number (optional)
 * @body {string} relationship - Relationship to user (optional)
 * @body {string} dateOfBirth - Member's date of birth (optional)
 * @body {string} gender - Member's gender (optional)
 * @body {string} status - Member status (active, inactive) (optional)
 * @body {object} metadata - Additional member metadata (optional)
 */
router.put('/:id', memberController.updateMember);

/**
 * @route DELETE /api/members/:id
 * @description Delete a family member
 * @access Private (User)
 * @param {string} id - Member ID
 */
router.delete('/:id', memberController.deleteMember);

// =====================================================
// MEMBER FILING ROUTES
// =====================================================

/**
 * @route GET /api/members/:id/filings
 * @description Get all filings for a specific member
 * @access Private (User)
 * @param {string} id - Member ID
 * @query {string} status - Filter by filing status (draft, submitted, acknowledged, processed, rejected)
 * @query {string} itrType - Filter by ITR type (ITR-1, ITR-2, ITR-3, ITR-4)
 * @query {number} page - Page number for pagination (default: 1)
 * @query {number} limit - Items per page (default: 20)
 */
router.get('/:id/filings', memberController.getMemberFilings);

/**
 * @route GET /api/members/:id/documents
 * @description Get all documents for a specific member
 * @access Private (User)
 * @param {string} id - Member ID
 * @query {string} category - Filter by document category (FORM_16, BANK_STATEMENT, etc.)
 * @query {string} status - Filter by document status (UPLOADED, VERIFIED, etc.)
 * @query {number} page - Page number for pagination (default: 1)
 * @query {number} limit - Items per page (default: 20)
 */
router.get('/:id/documents', memberController.getMemberDocuments);

// =====================================================
// MEMBER STATISTICS ROUTES
// =====================================================

/**
 * @route GET /api/members/:id/stats
 * @description Get comprehensive statistics for a member
 * @access Private (User)
 * @param {string} id - Member ID
 */
router.get('/:id/stats', async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { id: memberId } = req.params;

    // Verify member belongs to user
    const member = await FamilyMember.findOne({
      where: { id: memberId, userId },
    });

    if (!member) {
      throw new AppError('Member not found', 404);
    }

    const [filingStats, documentStats] = await Promise.all([
      memberController.getMemberFilingStats(memberId),
      memberController.getMemberDocumentStats(memberId),
    ]);

    const memberStats = {
      member: {
        id: member.id,
        fullName: member.fullName,
        pan: member.pan,
        relationship: member.relationship,
        status: member.status,
      },
      filings: filingStats,
      documents: documentStats,
      summary: {
        totalFilings: filingStats.totalFilings,
        totalDocuments: documentStats.totalDocuments,
        totalStorage: documentStats.totalStorage,
        verifiedDocuments: documentStats.verifiedDocuments,
      },
    };

    enterpriseLogger.info('Member statistics retrieved', { userId, memberId });

    res.status(200).json({
      success: true,
      message: 'Member statistics retrieved successfully',
      data: memberStats,
    });

  } catch (error) {
    enterpriseLogger.error('Failed to get member statistics', {
      error: error.message,
      userId: req.user?.userId,
      memberId: req.params.id,
    });
    next(error);
  }
});

// =====================================================
// MEMBER VALIDATION ROUTES
// =====================================================

/**
 * @route POST /api/members/validate-pan
 * @description Validate PAN format and check availability
 * @access Private (User)
 * @body {string} pan - PAN number to validate
 * @body {string} memberId - Optional member ID to exclude from duplicate check
 */
router.post('/validate-pan', async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { pan, memberId } = req.body;

    if (!pan) {
      throw new AppError('PAN is required', 400);
    }

    // Validate PAN format
    const isValidFormat = memberController.isValidPAN(pan);
    if (!isValidFormat) {
      return res.status(200).json({
        success: true,
        message: 'PAN validation result',
        data: {
          isValid: false,
          error: 'Invalid PAN format. PAN should be in format: ABCDE1234F',
        },
      });
    }

    // Check for duplicates
    const whereClause = { userId, pan: pan.toUpperCase() };
    if (memberId) {
      whereClause.id = { [Op.ne]: memberId };
    }

    const existingMember = await FamilyMember.findOne({ where: whereClause });

    res.status(200).json({
      success: true,
      message: 'PAN validation result',
      data: {
        isValid: !existingMember,
        isDuplicate: !!existingMember,
        message: existingMember
          ? `PAN already exists for member: ${existingMember.fullName}`
          : 'PAN is available',
      },
    });

  } catch (error) {
    enterpriseLogger.error('Failed to validate PAN', {
      error: error.message,
      userId: req.user?.userId,
    });
    next(error);
  }
});

// =====================================================
// MEMBER BULK OPERATIONS ROUTES
// =====================================================

/**
 * @route POST /api/members/bulk-create
 * @description Create multiple members at once
 * @access Private (User)
 * @body {array} members - Array of member objects to create
 */
router.post('/bulk-create', async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { members } = req.body;

    if (!Array.isArray(members) || members.length === 0) {
      throw new AppError('Members array is required', 400);
    }

    if (members.length > 5) {
      throw new AppError('Maximum 5 members can be created at once', 400);
    }

    // Check current member count
    const currentCount = await FamilyMember.count({ where: { userId } });
    if (currentCount + members.length > 5) {
      throw new AppError('Total members cannot exceed 5', 400);
    }

    const createdMembers = [];
    const errors = [];

    for (const memberData of members) {
      try {
        const member = await FamilyMember.create({
          userId,
          fullName: memberData.fullName,
          pan: memberData.pan.toUpperCase(),
          relationship: memberData.relationship,
          dateOfBirth: memberData.dateOfBirth,
          gender: memberData.gender,
          status: 'active',
          metadata: memberData.metadata || {},
        });

        createdMembers.push({
          id: member.id,
          fullName: member.fullName,
          pan: member.pan,
          relationship: member.relationship,
        });
      } catch (error) {
        errors.push({
          member: memberData,
          error: error.message,
        });
      }
    }

    enterpriseLogger.info('Bulk member creation completed', {
      userId,
      created: createdMembers.length,
      errors: errors.length,
    });

    res.status(201).json({
      success: true,
      message: 'Bulk member creation completed',
      data: {
        createdMembers,
        errors,
        summary: {
          total: members.length,
          created: createdMembers.length,
          failed: errors.length,
        },
      },
    });

  } catch (error) {
    enterpriseLogger.error('Failed to create members in bulk', {
      error: error.message,
      userId: req.user?.userId,
    });
    next(error);
  }
});

// =====================================================
// ERROR HANDLING MIDDLEWARE
// =====================================================

router.use((error, req, res, next) => {
  enterpriseLogger.error('Member route error', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    userId: req.user?.userId,
  });

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  });
});

enterpriseLogger.info('Member routes configured');

module.exports = router;
