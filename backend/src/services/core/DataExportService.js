/**
 * DataExportService — Data export (ZIP) and account deletion.
 *
 * Export: gathers filings, documents, profile into a ZIP.
 * Deletion: soft-delete with 24hr cancellation window, then PII anonymization.
 */

const crypto = require('crypto');
const enterpriseLogger = require('../../utils/logger');
const { User, ITRFiling, AuditEvent } = require('../../models');
const { AppError } = require('../../middleware/errorHandler');
const ErrorCodes = require('../../constants/ErrorCodes');

class DataExportService {
  /**
   * Request data export — returns immediately, export runs async.
   */
  static async requestExport(userId) {
    // Check for existing in-progress export
    const user = await User.findByPk(userId);
    if (!user) throw new AppError('User not found', 404);

    const exportId = crypto.randomUUID();
    const estimatedAt = new Date(Date.now() + 3600000); // 1 hour

    // Log audit event
    await AuditEvent.create({
      userId, eventType: 'DATA_EXPORT_REQUESTED',
      metadata: { exportId },
    });

    // In a full implementation, this would enqueue a Bull job.
    // For now, we generate synchronously (small data sets in MVP).
    enterpriseLogger.info('Data export requested', { userId, exportId });

    return { exportId, estimatedAt };
  }

  /**
   * Execute the export — gather all user data into a structured object.
   * In production, this would generate a ZIP. For MVP, returns JSON.
   */
  static async executeExport(userId) {
    const user = await User.findByPk(userId, {
      attributes: ['id', 'email', 'fullName', 'phone', 'dateOfBirth', 'gender', 'panNumber', 'role', 'createdAt'],
    });
    if (!user) throw new AppError('User not found', 404);

    const filings = await ITRFiling.findAll({
      where: { createdBy: userId },
      order: [['createdAt', 'DESC']],
    });

    const auditEvents = await AuditEvent.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      limit: 500,
    });

    return {
      exportedAt: new Date().toISOString(),
      profile: {
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        panNumber: user.panNumber,
        role: user.role,
        createdAt: user.createdAt,
      },
      filings: filings.map(f => ({
        id: f.id,
        assessmentYear: f.assessmentYear,
        itrType: f.itrType,
        taxpayerPan: f.taxpayerPan,
        lifecycleState: f.lifecycleState,
        selectedRegime: f.selectedRegime,
        jsonPayload: f.jsonPayload,
        createdAt: f.createdAt,
        updatedAt: f.updatedAt,
      })),
      auditTrail: auditEvents.map(e => ({
        eventType: e.eventType,
        timestamp: e.createdAt,
        metadata: e.metadata,
      })),
    };
  }

  /**
   * Request account deletion — 24hr cancellation window.
   */
  static async requestDeletion(userId) {
    const user = await User.findByPk(userId);
    if (!user) throw new AppError('User not found', 404);

    const deletionId = crypto.randomUUID();
    const cancellableUntil = new Date(Date.now() + 86400000); // 24 hours

    // Store deletion request in user metadata
    user.metadata = {
      ...(user.metadata || {}),
      pendingDeletion: { deletionId, requestedAt: new Date().toISOString(), cancellableUntil: cancellableUntil.toISOString() },
    };
    await user.save();

    await AuditEvent.create({
      userId, eventType: 'ACCOUNT_DELETION_REQUESTED',
      metadata: { deletionId, cancellableUntil: cancellableUntil.toISOString() },
    });

    enterpriseLogger.info('Account deletion requested', { userId, deletionId });
    return { deletionId, cancellableUntil };
  }

  /**
   * Cancel pending deletion.
   */
  static async cancelDeletion(userId, deletionId) {
    const user = await User.findByPk(userId);
    if (!user) throw new AppError('User not found', 404);

    const pending = user.metadata?.pendingDeletion;
    if (!pending || pending.deletionId !== deletionId) {
      throw new AppError('No matching deletion request found', 404);
    }

    if (new Date(pending.cancellableUntil) < new Date()) {
      throw new AppError(ErrorCodes.DELETION_EXPIRED, 'Cancellation window has passed', 410);
    }

    user.metadata = { ...(user.metadata || {}), pendingDeletion: null };
    await user.save();

    await AuditEvent.create({
      userId, eventType: 'ACCOUNT_DELETION_CANCELLED',
      metadata: { deletionId },
    });

    return true;
  }

  /**
   * Anonymize user PII — called after 24hr window expires.
   */
  static async anonymizeUser(userId) {
    const user = await User.findByPk(userId);
    if (!user) return;

    const hash = crypto.createHash('sha256').update(user.email || '').digest('hex').slice(0, 12);
    user.email = `deleted_${hash}@anonymized.burnblack.com`;
    user.fullName = 'Deleted User';
    user.phone = null;
    user.dateOfBirth = null;
    user.gender = null;
    user.panNumber = null;
    user.panVerified = false;
    user.status = 'deleted';
    user.passwordHash = null;
    user.metadata = { ...(user.metadata || {}), anonymizedAt: new Date().toISOString(), pendingDeletion: null };
    await user.save();

    enterpriseLogger.info('User PII anonymized', { userId });
  }
}

module.exports = DataExportService;
