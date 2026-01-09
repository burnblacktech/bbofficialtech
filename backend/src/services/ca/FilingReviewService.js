// =====================================================
// FILING REVIEW SERVICE (V5.1 Phase 2)
// Delegation-safe review and approval workflow
// =====================================================

const { ITRFiling, User } = require('../../models');
const auditService = require('../core/AuditService');
const enterpriseLogger = require('../../utils/logger');
const { AppError } = require('../../middleware/errorHandler');

class FilingReviewService {
    /**
     * Mark filing as reviewed by CA
     * @param {string} filingId - Filing ID
     * @param {string} reviewerId - CA user ID
     * @param {object} options - Optional review notes
     * @returns {Promise<ITRFiling>}
     */
    async reviewFiling(filingId, reviewerId, options = {}) {
        try {
            // Validate reviewer is CA
            const reviewer = await User.findByPk(reviewerId);
            if (!reviewer) {
                throw new AppError('Reviewer not found', 404);
            }

            if (!['CA', 'CA_FIRM_ADMIN'].includes(reviewer.role)) {
                throw new AppError('Only CA can review filings', 403);
            }

            // Get filing
            const filing = await ITRFiling.findByPk(filingId);
            if (!filing) {
                throw new AppError('Filing not found', 404);
            }

            // Verify CA belongs to same firm as filing owner (if firm context exists)
            if (filing.firmId && reviewer.caFirmId !== filing.firmId) {
                throw new AppError('CA can only review filings from their own firm', 403);
            }

            // Prevent already-reviewed filing from being re-reviewed (optional - can be relaxed)
            if (filing.reviewedBy && filing.reviewedBy !== reviewerId) {
                throw new AppError('Filing already reviewed by another CA', 409);
            }

            // Mark as reviewed
            filing.reviewedBy = reviewerId;
            filing.reviewedAt = new Date();
            await filing.save();

            // Audit trail
            await auditService.logEvent({
                eventType: 'FILING_REVIEWED',
                userId: reviewerId,
                resourceType: 'ITRFiling',
                resourceId: filingId,
                metadata: {
                    filingId,
                    reviewerId,
                    reviewNotes: options.notes || null,
                    firmId: filing.firmId,
                },
            });

            enterpriseLogger.info('Filing reviewed', {
                filingId,
                reviewerId,
                reviewerRole: reviewer.role,
            });

            return filing;
        } catch (error) {
            enterpriseLogger.error('Review filing failed', {
                filingId,
                reviewerId,
                error: error.message,
            });
            throw error;
        }
    }

    /**
     * Approve filing for submission (requires prior review)
     * @param {string} filingId - Filing ID
     * @param {string} approverId - CA user ID
     * @param {object} options - Optional approval notes
     * @returns {Promise<ITRFiling>}
     */
    async approveFiling(filingId, approverId, options = {}) {
        try {
            // Validate approver is CA
            const approver = await User.findByPk(approverId);
            if (!approver) {
                throw new AppError('Approver not found', 404);
            }

            if (!['CA', 'CA_FIRM_ADMIN'].includes(approver.role)) {
                throw new AppError('Only CA can approve filings', 403);
            }

            // Get filing
            const filing = await ITRFiling.findByPk(filingId);
            if (!filing) {
                throw new AppError('Filing not found', 404);
            }

            // Verify CA belongs to same firm
            if (filing.firmId && approver.caFirmId !== filing.firmId) {
                throw new AppError('CA can only approve filings from their own firm', 403);
            }

            // HARD GATE: Approval requires prior review
            if (!filing.reviewedBy || !filing.reviewedAt) {
                throw new AppError('Filing must be reviewed before approval', 400);
            }

            // V5.1 PHASE 3: HARD GATE - Intelligence flags must be acknowledged
            const intelligenceGateService = require('./IntelligenceGateService');
            const gateStatus = intelligenceGateService.hasBlockingFlags(filing);

            if (gateStatus.hasBlocking) {
                throw new AppError(
                    `Approval blocked: ${gateStatus.blockingFlags.length} critical intelligence flag(s) require override`,
                    400,
                    {
                        blockingFlags: gateStatus.blockingFlags.map(f => ({
                            id: f.id,
                            message: f.message,
                            category: f.category,
                        })),
                    }
                );
            }

            // Optional: Prevent self-approval if preparer is tracked
            // (Currently userId is the filer, not preparer - this can be enhanced)
            // if (filing.userId === approverId) {
            //   throw new AppError('Cannot approve your own filing', 403);
            // }

            // Prevent already-approved filing from being re-approved
            if (filing.approvedBy) {
                throw new AppError('Filing already approved', 409);
            }

            // Mark as approved
            filing.approvedBy = approverId;
            filing.approvedAt = new Date();
            await filing.save();

            // Audit trail
            await auditService.logEvent({
                eventType: 'FILING_APPROVED',
                userId: approverId,
                resourceType: 'ITRFiling',
                resourceId: filingId,
                metadata: {
                    filingId,
                    approverId,
                    reviewerId: filing.reviewedBy,
                    approvalNotes: options.notes || null,
                    firmId: filing.firmId,
                },
            });

            enterpriseLogger.info('Filing approved', {
                filingId,
                approverId,
                reviewerId: filing.reviewedBy,
            });

            return filing;
        } catch (error) {
            enterpriseLogger.error('Approve filing failed', {
                filingId,
                approverId,
                error: error.message,
            });
            throw error;
        }
    }

    /**
     * Get review status for a filing
     * @param {string} filingId - Filing ID
     * @returns {Promise<object>}
     */
    async getReviewStatus(filingId) {
        try {
            const filing = await ITRFiling.findByPk(filingId, {
                attributes: ['id', 'reviewedBy', 'reviewedAt', 'approvedBy', 'approvedAt', 'firmId'],
                include: [
                    {
                        model: User,
                        as: 'reviewer',
                        attributes: ['id', 'fullName', 'email', 'role'],
                        required: false,
                    },
                    {
                        model: User,
                        as: 'approver',
                        attributes: ['id', 'fullName', 'email', 'role'],
                        required: false,
                    },
                ],
            });

            if (!filing) {
                throw new AppError('Filing not found', 404);
            }

            return {
                reviewed: !!filing.reviewedBy,
                reviewedBy: filing.reviewedBy,
                reviewedAt: filing.reviewedAt,
                approved: !!filing.approvedBy,
                approvedBy: filing.approvedBy,
                approvedAt: filing.approvedAt,
                canApprove: !!filing.reviewedBy && !filing.approvedBy,
            };
        } catch (error) {
            enterpriseLogger.error('Get review status failed', {
                filingId,
                error: error.message,
            });
            throw error;
        }
    }
}

module.exports = new FilingReviewService();
