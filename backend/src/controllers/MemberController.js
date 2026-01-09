// =====================================================
// MEMBER CONTROLLER - CANONICAL FAMILY MEMBER MANAGEMENT
// Handles CRUD operations for family members
// =====================================================

const { FamilyMember, User, ITRFiling, Document } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');
const enterpriseLogger = require('../utils/logger');
const { AppError } = require('../middleware/errorHandler');
const auditService = require('../services/core/AuditService');
const {
  presentMember,
  presentMemberWithStats,
  presentFiling,
  presentDocument,
  isValidPAN,
} = require('../presenters/member.presenter');

class MemberController {
  constructor() {
    this.maxMembersPerUser = 5; // Maximum family members per user
    enterpriseLogger.info('MemberController initialized');

    // Bind methods to preserve 'this' context
    this.getMembers = this.getMembers.bind(this);
    this.createMember = this.createMember.bind(this);
    this.updateMember = this.updateMember.bind(this);
    this.deleteMember = this.deleteMember.bind(this);
    this.getMemberFilings = this.getMemberFilings.bind(this);
    this.getMemberDocuments = this.getMemberDocuments.bind(this);
  }

  // =====================================================
  // MEMBER CRUD OPERATIONS
  // =====================================================

  /**
   * Get all members for a user
   * GET /api/members
   */
  async getMembers(req, res, next) {
    try {
      const userId = req.targetUserId || req.user.userId;
      const { status, search } = req.query;

      const whereClause = { userId };
      if (status) {
        whereClause.status = status;
      }
      if (search) {
        whereClause[Op.or] = [
          { firstName: { [Op.iLike]: `%${search}%` } },
          { lastName: { [Op.iLike]: `%${search}%` } },
          { panNumber: { [Op.iLike]: `%${search}%` } },
          { relationship: { [Op.iLike]: `%${search}%` } },
        ];
      }

      const members = await FamilyMember.findAll({
        where: whereClause,
        order: [['createdAt', 'DESC']],
        attributes: [
          'id', 'userId', 'firstName', 'lastName', 'panNumber', 'relationship', 'dateOfBirth',
          'gender', 'isActive', 'panVerified', 'createdAt', 'updatedAt',
        ],
      });

      const memberList = members.map(member => ({
        id: member.id,
        userId: member.userId,
        fullName: `${member.firstName} ${member.lastName}`,
        firstName: member.firstName,
        lastName: member.lastName,
        panNumber: member.panNumber,
        relationship: member.relationship,
        relationshipLabel: this.getRelationshipLabel(member.relationship),
        dateOfBirth: member.dateOfBirth,
        gender: member.gender,
        genderLabel: this.getGenderLabel(member.gender),
        isActive: member.isActive,
        panVerified: member.panVerified,
        createdAt: member.createdAt,
        updatedAt: member.updatedAt,
      }));

      enterpriseLogger.info('Members retrieved for user', { userId, count: memberList.length });

      res.status(200).json({
        success: true,
        message: 'Members retrieved successfully',
        data: {
          members: memberList,
          count: memberList.length,
          maxMembers: this.maxMembersPerUser,
        },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to get members', {
        error: error.message,
        userId: req.user?.userId,
      });
      next(error);
    }
  }

  /**
   * Get a specific member by ID
   * GET /api/members/:id
   */
  async getMemberById(req, res, next) {
    try {
      const userId = req.targetUserId || req.user.userId;
      const { id } = req.params;

      const member = await FamilyMember.findOne({
        where: { id, userId },
        attributes: [
          'id', 'userId', 'fullName', 'pan', 'relationship', 'dateOfBirth',
          'gender', 'status', 'createdAt', 'updatedAt', 'metadata',
        ],
      });

      if (!member) {
        throw new AppError('Member not found', 404);
      }

      // Get member statistics
      const [filingStats, documentStats] = await Promise.all([
        this.getMemberFilingStats(member.id),
        this.getMemberDocumentStats(member.id),
      ]);

      const memberDetails = presentMemberWithStats(member, filingStats, documentStats);

      enterpriseLogger.info('Member details retrieved', { userId, memberId: id });

      res.status(200).json({
        success: true,
        message: 'Member details retrieved successfully',
        data: memberDetails,
      });

    } catch (error) {
      enterpriseLogger.error('Failed to get member details', {
        error: error.message,
        userId: req.user?.userId,
        memberId: req.params.id,
      });
      next(error);
    }
  }

  /**
   * Create a new member
   * POST /api/members
   */
  async createMember(req, res, next) {
    try {
      const userId = req.targetUserId || req.user.userId;
      const {
        fullName,
        pan,
        relationship,
        dateOfBirth,
        gender,
        metadata = {},
      } = req.body;

      // Validate required fields
      if (!fullName || !pan || !relationship) {
        throw new AppError('fullName, pan, and relationship are required', 400);
      }

      // Check member limit
      const existingMembersCount = await FamilyMember.count({ where: { userId } });
      if (existingMembersCount >= this.maxMembersPerUser) {
        throw new AppError(`Maximum ${this.maxMembersPerUser} members allowed per user`, 400);
      }

      // Check if PAN already exists for this user
      const existingMember = await FamilyMember.findOne({
        where: { userId, panNumber: pan.toUpperCase() },
      });
      if (existingMember) {
        throw new AppError('Member with this PAN already exists', 400);
      }

      // Validate PAN format (basic validation)
      if (!isValidPAN(pan)) {
        throw new AppError('Invalid PAN format', 400);
      }

      // Verify PAN using SurePass service
      const panVerificationService = require('../services/common/PANVerificationService');
      const verificationResult = await panVerificationService.verifyPAN(pan.toUpperCase(), userId);

      if (!verificationResult.isValid) {
        throw new AppError('PAN verification failed. Please enter a valid PAN number.', 400);
      }

      // Validate relationship
      const validRelationships = ['spouse', 'child', 'parent', 'sibling', 'other'];
      if (!validRelationships.includes(relationship)) {
        throw new AppError(`Invalid relationship. Must be one of: ${validRelationships.join(', ')}`, 400);
      }

      // Validate gender if provided
      if (gender !== undefined) {
        const validGenders = ['male', 'female', 'other'];
        if (!validGenders.includes(gender.toLowerCase())) {
          throw new AppError(`Invalid gender. Must be one of: ${validGenders.join(', ')}`, 400);
        }
      }

      // Parse fullName into firstName and lastName
      const nameParts = (fullName || '').trim().split(/\s+/);
      const firstName = nameParts[0] || '';
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

      if (!firstName || !lastName) {
        throw new AppError('Full name must include both first and last name', 400);
      }

      // Create member with verified PAN
      const member = await FamilyMember.create({
        userId,
        firstName,
        lastName,
        panNumber: pan.toUpperCase(),
        relationship,
        dateOfBirth,
        gender: gender ? gender.toLowerCase() : undefined,
        status: 'active',
        metadata,
        panVerified: true,
        panVerifiedAt: new Date(),
      });

      // Log audit event
      await auditService.logDataAccess(
        userId,
        'create',
        'member',
        member.id,
        {
          memberName: member.fullName,
          pan: member.pan,
          relationship: member.relationship,
        },
        req.ip,
      );

      enterpriseLogger.info('Member created successfully', {
        userId,
        memberId: member.id,
        memberName: member.fullName,
        pan: member.pan,
      });

      res.status(201).json({
        success: true,
        message: 'Member created successfully',
        data: {
          member: presentMember(member),
        },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to create member', {
        error: error.message,
        userId: req.user?.userId,
      });
      next(error);
    }
  }

  /**
   * Update a member
   * PUT /api/members/:id
   */
  async updateMember(req, res, next) {
    try {
      const userId = req.targetUserId || req.user.userId;
      const { id } = req.params;
      const {
        fullName,
        pan,
        relationship,
        dateOfBirth,
        gender,
        status,
        metadata,
      } = req.body;

      const member = await FamilyMember.findOne({
        where: { id, userId },
      });

      if (!member) {
        throw new AppError('Member not found', 404);
      }

      const updateData = {};
      const oldValues = {};

      if (fullName !== undefined) {
        // Parse fullName into firstName and lastName
        const nameParts = (fullName || '').trim().split(/\s+/);
        const firstName = nameParts[0] || '';
        const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

        if (!firstName || !lastName) {
          throw new AppError('Full name must include both first and last name', 400);
        }

        oldValues.fullName = member.getFullName();
        updateData.firstName = firstName;
        updateData.lastName = lastName;
      }
      if (pan !== undefined) {
        if (!isValidPAN(pan)) {
          throw new AppError('Invalid PAN format', 400);
        }

        // If PAN is being changed, verify it via SurePass
        if (pan.toUpperCase() !== member.panNumber) {
          const panVerificationService = require('../services/common/PANVerificationService');
          const verificationResult = await panVerificationService.verifyPAN(pan.toUpperCase(), userId);

          if (!verificationResult.isValid) {
            throw new AppError('PAN verification failed. Please enter a valid PAN number.', 400);
          }

          // Set verified status for new PAN
          updateData.panVerified = true;
          updateData.panVerifiedAt = new Date();
        }

        oldValues.pan = member.panNumber;
        updateData.panNumber = pan.toUpperCase();
      }
      if (relationship !== undefined) {
        const validRelationships = ['spouse', 'child', 'parent', 'sibling', 'other'];
        if (!validRelationships.includes(relationship)) {
          throw new AppError(`Invalid relationship. Must be one of: ${validRelationships.join(', ')}`, 400);
        }
        oldValues.relationship = member.relationship;
        updateData.relationship = relationship;
      }
      if (dateOfBirth !== undefined) {
        oldValues.dateOfBirth = member.dateOfBirth;
        updateData.dateOfBirth = dateOfBirth;
      }
      if (gender !== undefined) {
        // Validate gender value
        const validGenders = ['male', 'female', 'other'];
        if (!validGenders.includes(gender.toLowerCase())) {
          throw new AppError(`Invalid gender. Must be one of: ${validGenders.join(', ')}`, 400);
        }
        oldValues.gender = member.gender;
        updateData.gender = gender.toLowerCase();
      }
      if (status !== undefined) {
        const validStatuses = ['active', 'inactive'];
        if (!validStatuses.includes(status)) {
          throw new AppError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400);
        }
        oldValues.status = member.status;
        updateData.status = status;
      }
      if (metadata !== undefined) {
        updateData.metadata = { ...member.metadata, ...metadata };
      }

      if (Object.keys(updateData).length === 0) {
        throw new AppError('No fields provided for update', 400);
      }

      await member.update(updateData);

      // Log audit event
      await auditService.logDataAccess(
        userId,
        'update',
        'member',
        member.id,
        {
          memberName: member.fullName,
          updatedFields: Object.keys(updateData),
          oldValues,
          newValues: updateData,
        },
        req.ip,
      );

      enterpriseLogger.info('Member updated successfully', {
        userId,
        memberId: member.id,
        updatedFields: Object.keys(updateData),
      });

      res.status(200).json({
        success: true,
        message: 'Member updated successfully',
        data: {
          member: presentMember(member),
        },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to update member', {
        error: error.message,
        userId: req.user?.userId,
        memberId: req.params.id,
      });
      next(error);
    }
  }

  /**
   * Delete a member
   * DELETE /api/members/:id
   */
  async deleteMember(req, res, next) {
    try {
      const userId = req.targetUserId || req.user.userId;
      const { id } = req.params;

      const member = await FamilyMember.findOne({
        where: { id, userId },
      });

      if (!member) {
        throw new AppError('Member not found', 404);
      }

      // Check if member has any active filings
      const activeFilings = await ITRFiling.count({
        where: { userId, memberId: member.id, status: { [Op.in]: ['draft', 'submitted'] } },
      });

      if (activeFilings > 0) {
        throw new AppError('Cannot delete member with active filings. Please complete or cancel the filings first.', 400);
      }

      // Soft delete the member
      await member.destroy();

      // Log audit event
      await auditService.logDataAccess(
        userId,
        'delete',
        'member',
        member.id,
        {
          memberName: member.fullName,
          pan: member.pan,
          relationship: member.relationship,
        },
        req.ip,
      );

      enterpriseLogger.info('Member deleted successfully', {
        userId,
        memberId: member.id,
        memberName: member.fullName,
      });

      res.status(200).json({
        success: true,
        message: 'Member deleted successfully',
      });

    } catch (error) {
      enterpriseLogger.error('Failed to delete member', {
        error: error.message,
        userId: req.user?.userId,
        memberId: req.params.id,
      });
      next(error);
    }
  }

  // =====================================================
  // MEMBER FILING MANAGEMENT
  // =====================================================

  /**
   * Get member's filings
   * GET /api/members/:id/filings
   */
  async getMemberFilings(req, res, next) {
    try {
      const userId = req.targetUserId || req.user.userId;
      const { id: memberId } = req.params;
      const { status, itrType, page = 1, limit = 20 } = req.query;

      // Verify member belongs to user
      const member = await FamilyMember.findOne({
        where: { id: memberId, userId },
      });

      if (!member) {
        throw new AppError('Member not found', 404);
      }

      const offset = (page - 1) * limit;
      const whereClause = { userId, memberId };

      if (status) {
        whereClause.status = status;
      }
      if (itrType) {
        whereClause.itrType = itrType;
      }

      const { count, rows: filings } = await ITRFiling.findAndCountAll({
        where: whereClause,
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset),
        attributes: [
          'id', 'itrType', 'assessmentYear', 'status', 'taxLiability',
          'submittedAt', 'acknowledgedAt', 'createdAt', 'updatedAt',
        ],
      });

      const filingList = filings.map(presentFiling);

      enterpriseLogger.info('Member filings retrieved', {
        userId,
        memberId,
        count: filingList.length,
      });

      res.status(200).json({
        success: true,
        message: 'Member filings retrieved successfully',
        data: {
          filings: filingList,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / limit),
            totalItems: count,
            itemsPerPage: parseInt(limit),
          },
        },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to get member filings', {
        error: error.message,
        userId: req.user?.userId,
        memberId: req.params.id,
      });
      next(error);
    }
  }

  /**
   * Get member's documents
   * GET /api/members/:id/documents
   */
  async getMemberDocuments(req, res, next) {
    try {
      const userId = req.targetUserId || req.user.userId;
      const { id: memberId } = req.params;
      const { category, status, page = 1, limit = 20 } = req.query;

      // Verify member belongs to user
      const member = await FamilyMember.findOne({
        where: { id: memberId, userId },
      });

      if (!member) {
        throw new AppError('Member not found', 404);
      }

      const offset = (page - 1) * limit;
      const whereClause = { userId, memberId, deletedAt: null };

      if (category) {
        whereClause.category = category;
      }
      if (status) {
        whereClause.status = status;
      }

      const { count, rows: documents } = await Document.findAndCountAll({
        where: whereClause,
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset),
        attributes: [
          'id', 'category', 'filename', 'originalFilename', 'mimeType',
          'sizeBytes', 'status', 'verified', 'createdAt', 'updatedAt',
        ],
      });

      const documentList = documents.map(presentDocument);

      enterpriseLogger.info('Member documents retrieved', {
        userId,
        memberId,
        count: documentList.length,
      });

      res.status(200).json({
        success: true,
        message: 'Member documents retrieved successfully',
        data: {
          documents: documentList,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / limit),
            totalItems: count,
            itemsPerPage: parseInt(limit),
          },
        },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to get member documents', {
        error: error.message,
        userId: req.user?.userId,
        memberId: req.params.id,
      });
      next(error);
    }
  }

  // =====================================================
  // HELPER METHODS
  // =====================================================

  /**
   * Get member filing statistics
   */
  async getMemberFilingStats(memberId) {
    const stats = await ITRFiling.findAll({
      where: { memberId },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalFilings'],
        [sequelize.fn('COUNT', sequelize.literal('CASE WHEN status = \'draft\' THEN 1 END')), 'draftFilings'],
        [sequelize.fn('COUNT', sequelize.literal('CASE WHEN status = \'submitted\' THEN 1 END')), 'submittedFilings'],
        [sequelize.fn('COUNT', sequelize.literal('CASE WHEN status = \'acknowledged\' THEN 1 END')), 'acknowledgedFilings'],
      ],
      raw: true,
    });

    return {
      totalFilings: parseInt(stats[0]?.totalFilings) || 0,
      draftFilings: parseInt(stats[0]?.draftFilings) || 0,
      submittedFilings: parseInt(stats[0]?.submittedFilings) || 0,
      acknowledgedFilings: parseInt(stats[0]?.acknowledgedFilings) || 0,
    };
  }

  /**
   * Get member document statistics
   */
  async getMemberDocumentStats(memberId) {
    const stats = await Document.findAll({
      where: { memberId, deletedAt: null },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalDocuments'],
        [sequelize.fn('SUM', sequelize.col('size_bytes')), 'totalStorage'],
        [sequelize.fn('COUNT', sequelize.literal('CASE WHEN status = \'VERIFIED\' THEN 1 END')), 'verifiedDocuments'],
      ],
      raw: true,
    });

    return {
      totalDocuments: parseInt(stats[0]?.totalDocuments) || 0,
      totalStorage: parseInt(stats[0]?.totalStorage) || 0,
      verifiedDocuments: parseInt(stats[0]?.verifiedDocuments) || 0,
    };
  }

}

module.exports = new MemberController();
