/**
 * AdminFilingService — Filing management for SUPER_ADMIN dashboard
 * Handles create (single + batch), soft-delete, and listing of admin-created filings.
 */

const { Op, literal, fn, col } = require('sequelize');
const { User, ITRFiling, AuditEvent } = require('../../models');
const { sequelize } = require('../../config/database');
const { AppError } = require('../../utils/errorClasses');
const enterpriseLogger = require('../../utils/logger');

const DELETABLE_STATES = ['draft', 'eri_failed'];

class AdminFilingService {
  /**
   * Create a filing on behalf of a user identified by PAN.
   * @param {Object} params - { pan, assessmentYear, itrType }
   * @param {string} adminId - SUPER_ADMIN's user ID
   * @returns {Object} Created filing record
   */
  async createFiling({ pan, assessmentYear, itrType }, adminId) {
    // Look up target user by PAN
    const targetUser = await User.findOne({ where: { panNumber: pan } });
    if (!targetUser) {
      throw new AppError( `No user found for PAN ${pan}`, 404);
    }

    // Check for existing active filing with same combo
    const existing = await ITRFiling.findOne({
      where: {
        createdBy: targetUser.id,
        assessmentYear,
        itrType,
      },
    });
    if (existing) {
      throw new AppError(
        'Active filing already exists for this user, assessment year, and ITR type',
        409,
        'DUPLICATE_FILING',
        { existingFilingId: existing.id },
      );
    }

    let filing;
    try {
      filing = await ITRFiling.create({
        createdBy: targetUser.id,
        userId: targetUser.id,
        taxpayerPan: pan,
        assessmentYear,
        itrType,
        lifecycleState: 'draft',
        jsonPayload: {
          _meta: {
            adminCreatedBy: adminId,
            createdVia: 'admin_api',
          },
        },
      });
    } catch (err) {
      // Race condition: partial unique index catches concurrent duplicates
      if (err.name === 'SequelizeUniqueConstraintError') {
        throw new AppError(
          'Active filing already exists for this user, assessment year, and ITR type',
          409,
          'DUPLICATE_FILING',
        );
      }
      throw err;
    }

    // Audit log (fire-and-forget)
    AuditEvent.logEvent({
      entityType: 'ITRFiling',
      entityId: filing.id,
      eventType: 'FILING_CREATED_BY_ADMIN',
      actorId: adminId,
      actorRole: 'SUPER_ADMIN',
      metadata: { targetPan: pan, assessmentYear, itrType },
    }).catch((err) => {
      enterpriseLogger.error('Audit log failed for FILING_CREATED_BY_ADMIN', { error: err.message });
    });

    return filing;
  }

  /**
   * Batch create filings for multiple PANs.
   * @param {Object} params - { pans, assessmentYear, itrType }
   * @param {string} adminId - SUPER_ADMIN's user ID
   * @returns {{ succeeded: Object[], failed: Object[] }}
   */
  async batchCreateFilings({ pans, assessmentYear, itrType }, adminId) {
    if (pans.length > 50) {
      throw new AppError('Batch size cannot exceed 50 PANs', 400, 'BATCH_SIZE_EXCEEDED');
    }

    const succeeded = [];
    const failed = [];

    for (const pan of pans) {
      try {
        const filing = await this.createFiling({ pan, assessmentYear, itrType }, adminId);
        succeeded.push({ pan, filingId: filing.id });
      } catch (err) {
        failed.push({
          pan,
          reason: err.code || 'UNKNOWN_ERROR',
          message: err.message,
        });
      }
    }

    // Summary audit event (fire-and-forget)
    AuditEvent.logEvent({
      entityType: 'ITRFiling',
      entityId: adminId,
      eventType: 'BATCH_FILING_CREATED',
      actorId: adminId,
      actorRole: 'SUPER_ADMIN',
      metadata: {
        succeededCount: succeeded.length,
        failedCount: failed.length,
        assessmentYear,
        itrType,
      },
    }).catch((err) => {
      enterpriseLogger.error('Audit log failed for BATCH_FILING_CREATED', { error: err.message });
    });

    return { succeeded, failed };
  }

  /**
   * Soft-delete a filing (admin path — no ownership check).
   * @param {string} filingId - UUID of the filing
   * @param {string} adminId - SUPER_ADMIN's user ID
   * @returns {{ message: string }}
   */
  async deleteFiling(filingId, adminId) {
    const filing = await ITRFiling.scope('withDeleted').findByPk(filingId);
    if (!filing || filing.deletedAt) {
      throw new AppError('Filing not found', 404, 'FILING_NOT_FOUND');
    }

    if (!DELETABLE_STATES.includes(filing.lifecycleState)) {
      throw new AppError(
        'FILING_NOT_DELETABLE',
        `Filing cannot be deleted in state "${filing.lifecycleState}". Allowed states: ${DELETABLE_STATES.join(', ')}`,
        403,
      );
    }

    filing.deletedAt = new Date();
    await filing.save();

    // Audit log (fire-and-forget)
    AuditEvent.logEvent({
      entityType: 'ITRFiling',
      entityId: filing.id,
      eventType: 'FILING_DELETED_BY_ADMIN',
      actorId: adminId,
      actorRole: 'SUPER_ADMIN',
      metadata: {
        targetUserId: filing.createdBy,
        lifecycleState: filing.lifecycleState,
      },
    }).catch((err) => {
      enterpriseLogger.error('Audit log failed for FILING_DELETED_BY_ADMIN', { error: err.message });
    });

    return { message: 'Filing deleted' };
  }

  /**
   * List filings created by this admin, with filters and pagination.
   * @param {string} adminId - SUPER_ADMIN's user ID
   * @param {Object} filters - { assessmentYear, itrType, lifecycleState, pan, includeDeleted, page, limit }
   * @returns {{ filings: Object[], total: number, page: number, totalPages: number }}
   */
  async listFilings(adminId, filters = {}) {
    const {
      assessmentYear,
      itrType,
      lifecycleState,
      pan,
      includeDeleted = false,
      page = 1,
      limit = 20,
    } = filters;

    const pg = Math.max(1, parseInt(page) || 1);
    const lim = Math.min(100, Math.max(1, parseInt(limit) || 20));

    const where = {
      [Op.and]: [
        literal(
          `"ITRFiling"."json_payload"->'_meta'->>'adminCreatedBy' = ${sequelize.escape(adminId)}`,
        ),
      ],
    };

    if (assessmentYear) where.assessmentYear = assessmentYear;
    if (itrType) where.itrType = itrType;
    if (lifecycleState) where.lifecycleState = lifecycleState;
    if (pan) where.taxpayerPan = pan;

    const scope = includeDeleted ? 'withDeleted' : undefined;
    const model = scope ? ITRFiling.scope(scope) : ITRFiling;

    const { count, rows } = await model.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['fullName', 'panNumber'],
        },
      ],
      limit: lim,
      offset: (pg - 1) * lim,
      order: [['createdAt', 'DESC']],
    });

    return {
      filings: rows,
      total: count,
      page: pg,
      totalPages: Math.ceil(count / lim),
    };
  }
}

module.exports = new AdminFilingService();
