/**
 * FamilyService — Multi-PAN family member management.
 *
 * - Add/remove family members with PAN verification
 * - Enforce max 4 members per Family Pack
 * - Context switching for filing on behalf of family
 * - Soft-delete preserves filings and documents
 */

const { FamilyMember, User, ITRFiling } = require('../../models');
const { AppError } = require('../../middleware/errorHandler');
const ErrorCodes = require('../../constants/ErrorCodes');
const AuditService = require('../core/AuditService');
const enterpriseLogger = require('../../utils/logger');

const MAX_FAMILY_MEMBERS = 4; // including primary user

class FamilyService {

  /**
   * Add a family member (with PAN verification).
   */
  static async addMember(userId, { pan, relationship, name, dob }) {
    if (!pan || !relationship) {
      throw new AppError('PAN and relationship are required', 400);
    }

    const panUpper = pan.toUpperCase();

    // Check member limit
    const canAdd = await this.canAddMember(userId);
    if (!canAdd.allowed) {
      throw new AppError(ErrorCodes.FAMILY_MEMBER_LIMIT, canAdd.reason, 409);
    }

    // Check for duplicate PAN in this family
    const existing = await FamilyMember.findOne({
      where: { userId, pan: panUpper, isActive: true },
    });
    if (existing) {
      throw new AppError(ErrorCodes.FAMILY_DUPLICATE_PAN, 'This PAN is already added as a family member', 409);
    }

    // Verify PAN via SurePass
    let verifiedName = name || '';
    let verifiedDob = dob || null;
    let panVerified = false;

    try {
      const panService = require('../common/PANVerificationService');
      const result = await panService.verifyPAN(panUpper, userId);
      if (result.isValid) {
        verifiedName = result.name || name || '';
        verifiedDob = result.dateOfBirth || dob || null;
        panVerified = true;
      }
    } catch {
      // SurePass unavailable — allow manual entry
      enterpriseLogger.warn('PAN verification unavailable for family member', { pan: panUpper.slice(0, 5) + '****' });
    }

    // Check if PAN is a primary account on the platform
    const existingUser = await User.findOne({ where: { panNumber: panUpper } });
    const hasIndependentAccount = !!existingUser;

    // Create family member
    const member = await FamilyMember.create({
      userId,
      pan: panUpper,
      fullName: verifiedName || name || 'Family Member',
      relationship,
      dateOfBirth: verifiedDob,
      panVerified,
      panVerifiedAt: panVerified ? new Date() : null,
      metadata: { hasIndependentAccount, verificationSource: panVerified ? 'SUREPASS' : 'MANUAL' },
    });

    // Audit
    AuditService.logAuthEvent({
      actorId: userId, action: 'FAMILY_MEMBER_ADDED',
      metadata: { memberId: member.id, pan: panUpper.slice(0, 5) + '****', relationship },
    }).catch(() => {});

    enterpriseLogger.info('Family member added', { userId, memberId: member.id, relationship });

    return {
      ...member.toJSON(),
      notice: hasIndependentAccount ? 'This PAN also has an independent account on BurnBlack.' : null,
    };
  }

  /**
   * List active family members for a user.
   */
  static async listMembers(userId) {
    return FamilyMember.findAll({
      where: { userId, isActive: true },
      order: [['createdAt', 'ASC']],
      attributes: ['id', 'pan', 'fullName', 'relationship', 'dateOfBirth', 'panVerified', 'createdAt', 'metadata'],
    });
  }

  /**
   * Remove (soft-delete) a family member.
   */
  static async removeMember(userId, memberId) {
    const member = await FamilyMember.findOne({ where: { id: memberId, userId, isActive: true } });
    if (!member) throw new AppError(ErrorCodes.FAMILY_MEMBER_NOT_FOUND, 'Family member not found', 404);

    member.isActive = false;
    member.deletedAt = new Date();
    await member.save();

    AuditService.logAuthEvent({
      actorId: userId, action: 'FAMILY_MEMBER_REMOVED',
      metadata: { memberId, pan: member.pan.slice(0, 5) + '****' },
    }).catch(() => {});

    return true;
  }

  /**
   * Get member context — load member's filings only.
   */
  static async getMemberContext(userId, memberId) {
    const member = await FamilyMember.findOne({ where: { id: memberId, userId, isActive: true } });
    if (!member) throw new AppError(ErrorCodes.FAMILY_MEMBER_NOT_FOUND, 'Family member not found', 404);

    const filings = await ITRFiling.findAll({
      where: { createdBy: userId, taxpayerPan: member.pan },
      order: [['createdAt', 'DESC']],
    });

    return { member, filings };
  }

  /**
   * Check if user can add another member.
   */
  static async canAddMember(userId) {
    const count = await FamilyMember.count({ where: { userId, isActive: true } });
    // +1 for the primary user themselves
    if (count + 1 >= MAX_FAMILY_MEMBERS) {
      return { allowed: false, reason: `Maximum ${MAX_FAMILY_MEMBERS} family members (including yourself) allowed per Family Pack.`, memberCount: count };
    }
    return { allowed: true, memberCount: count };
  }

  /**
   * Check family pack eligibility (2+ members).
   */
  static async checkFamilyPackEligibility(userId) {
    const count = await FamilyMember.count({ where: { userId, isActive: true } });
    return { eligible: count >= 1, memberCount: count + 1 }; // +1 for primary
  }
}

module.exports = FamilyService;
