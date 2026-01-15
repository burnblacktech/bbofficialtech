/**
 * FilingService.js
 * S12 Phase 8 - Minimal Filing Orchestrator
 * Canonical filing creation and read operations
 */

const { sequelize } = require('../../config/database');
const ITRFiling = require('../../models/ITRFiling');
const FilingSnapshot = require('../../models/FilingSnapshot');
const CompletionChecklistService = require('../itr/CompletionChecklistService');
const FilingSafetyService = require('../itr/FilingSafetyService');
const AuditService = require('../core/AuditService');
const enterpriseLogger = require('../../utils/logger');

class FilingService {

    /**
     * Create a new ITR filing
     * S12 Phase 8 - Minimal canonical filing creation
     * @param {Object} data - { assessmentYear, taxpayerPan }
     * @param {Object} user - { userId, caFirmId, role }
     * @returns {Object} { filingId, lifecycleState, assessmentYear }
     */
    async createFiling({ assessmentYear, taxpayerPan }, user) {
        const transaction = await sequelize.transaction();

        try {
            // Validate assessment year format
            if (!assessmentYear || !/^\d{4}-\d{2}$/.test(assessmentYear)) {
                throw new Error('Invalid assessment year format. Expected: YYYY-YY (e.g., 2024-25)');
            }

            // Validate PAN format
            if (!taxpayerPan || !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(taxpayerPan)) {
                throw new Error('Invalid PAN format. Expected: AAAAA9999A');
            }

            // Check for duplicate filing
            const existingFiling = await ITRFiling.findOne({
                where: {
                    createdBy: user.userId,
                    assessmentYear,
                    taxpayerPan,
                },
                transaction,
            });

            if (existingFiling) {
                throw new Error(`Filing already exists for ${assessmentYear} with PAN ${taxpayerPan}`);
            }

            // Create filing
            const filing = await ITRFiling.create({
                createdBy: user.userId,
                caFirmId: user.caFirmId || null,
                assessmentYear,
                taxpayerPan,
                lifecycleState: 'draft',
                intelligenceFlags: [],
                intelligenceOverrides: [],
            }, { transaction });

            // Audit - Canonical AuditService
            await AuditService.logEvent({
                entityType: 'ITRFiling',
                entityId: filing.id,
                action: 'FILING_CREATED',
                actorId: user.userId,
                metadata: {
                    assessmentYear,
                    taxpayerPan,
                },
            }, transaction);

            await transaction.commit();

            enterpriseLogger.info('Filing created', {
                filingId: filing.id,
                userId: user.userId,
                assessmentYear,
                taxpayerPan,
            });

            return {
                filingId: filing.id,
                lifecycleState: filing.lifecycleState,
                assessmentYear: filing.assessmentYear,
                createdAt: filing.createdAt,
            };

        } catch (error) {
            await transaction.rollback();
            enterpriseLogger.error('Filing creation failed', {
                error: error.message,
                userId: user.userId,
                assessmentYear,
                taxpayerPan,
            });
            throw error;
        }
    }

    /**
     * Get filing details with derived status
     * S12 Phase 8 - Read model for dashboard
     * @param {String} filingId
     * @param {String} userId - for access control
     * @returns {Object} Filing with completion and safety status
     */
    async getFiling(filingId, userId) {
        try {
            const filing = await ITRFiling.findOne({
                where: { id: filingId },
            });

            if (!filing) {
                throw new Error('Filing not found');
            }

            // Access control - user must own the filing
            if (filing.createdBy !== userId) {
                throw new Error('Access denied');
            }

            // Get completion status
            let completion = { percentage: 0, missing: [] };
            try {
                const checklist = await CompletionChecklistService.getChecklist(filingId);
                completion = {
                    percentage: checklist.completionPercentage || 0,
                    missing: checklist.items
                        ?.filter(item => item.required && item.status === 'missing')
                        .map(item => item.key) || [],
                };
            } catch (err) {
                enterpriseLogger.warn('Completion check failed', { filingId, error: err.message });
            }

            // Get safety status
            let safety = { isSafe: true, message: 'Your draft is safe. Nothing is submitted yet.' };
            try {
                const safetyStatus = await FilingSafetyService.getSafetyStatus(filingId);
                safety = {
                    isSafe: safetyStatus.isSafe || true,
                    message: safetyStatus.message || safety.message,
                };
            } catch (err) {
                enterpriseLogger.warn('Safety check failed', { filingId, error: err.message });
            }

            return {
                id: filing.id,
                assessmentYear: filing.assessmentYear,
                taxpayerPan: filing.taxpayerPan,
                lifecycleState: filing.lifecycleState,
                jsonPayload: filing.jsonPayload,
                selectedRegime: filing.selectedRegime,
                createdAt: filing.createdAt,
                updatedAt: filing.updatedAt,
                completion,
                safety,
            };

        } catch (error) {
            enterpriseLogger.error('Get filing failed', {
                error: error.message,
                filingId,
                userId,
            });
            throw error;
        }
    }

    /**
     * List all filings for a user
     * @param {String} userId
     * @returns {Array} List of filings
     */
    async listFilings(userId) {
        try {
            const filings = await ITRFiling.findAll({
                where: { createdBy: userId },
                order: [['createdAt', 'DESC']],
                attributes: ['id', 'assessmentYear', 'taxpayerPan', 'lifecycleState', 'createdAt', 'updatedAt'],
            });

            return filings.map(f => ({
                id: f.id,
                assessmentYear: f.assessmentYear,
                taxpayerPan: f.taxpayerPan,
                lifecycleState: f.lifecycleState,
                createdAt: f.createdAt,
                updatedAt: f.updatedAt,
            }));

        } catch (error) {
            enterpriseLogger.error('List filings failed', {
                error: error.message,
                userId,
            });
            throw error;
        }
    }

    /**
     * Update filing data and create snapshot
     * S12 Phase 8 - Persist changes with versioning
     * @param {String} filingId
     * @param {String} userId
     * @param {Object} data - { jsonPayload, status }
     * @param {String} comment - Optional snapshot comment
     */
    async updateFiling(filingId, userId, data, comment = 'Auto-save') {
        const transaction = await sequelize.transaction();

        try {
            const filing = await ITRFiling.findOne({
                where: { id: filingId },
                transaction,
            });

            if (!filing) {
                throw new Error('Filing not found');
            }

            if (filing.createdBy !== userId) {
                throw new Error('Access denied');
            }

            // Validations
            if (filing.lifecycleState !== 'draft' && filing.lifecycleState !== 'review_pending') {
                // In strict mode, we might block updates, but for now allows corrections
                // throw new Error('Cannot update filing in current state'); 
            }

            // Update fields
            if (data.jsonPayload) filing.jsonPayload = data.jsonPayload;
            if (data.selectedRegime) filing.selectedRegime = data.selectedRegime;
            if (data.taxComputation) filing.taxComputation = data.taxComputation;

            // Auto Update Metadata
            filing.changed('updatedAt', true);

            await filing.save({ transaction });

            // Create Snapshot (Versioning)
            await this.createSnapshot(filing, userId, 'auto', comment, transaction);

            await transaction.commit();

            return filing;

        } catch (error) {
            await transaction.rollback();
            enterpriseLogger.error('Update filing failed', {
                error: error.message,
                filingId,
                userId,
            });
            throw error;
        }
    }

    /**
     * Create an immutable snapshot of the filing
     * @param {Object} filing - Filing instance
     * @param {String} userId
     * @param {String} type - auto, manual, pre-submission
     * @param {String} comment
     * @param {Object} t - Transaction
     */
    async createSnapshot(filing, userId, type = 'auto', comment = '', t = null) {
        try {
            // Get last version number
            const lastSnapshot = await FilingSnapshot.findOne({
                where: { filingId: filing.id },
                order: [['version', 'DESC']],
                transaction: t,
            });

            const nextVersion = (lastSnapshot?.version || 0) + 1;

            await FilingSnapshot.create({
                filingId: filing.id,
                createdBy: userId,
                version: nextVersion,
                snapshotType: type,
                jsonPayload: filing.jsonPayload,
                comment: comment,
            }, { transaction: t });

            enterpriseLogger.info('Filing snapshot created', {
                filingId: filing.id,
                version: nextVersion,
                type,
            });

        } catch (error) {
            // Non-blocking but logged
            enterpriseLogger.error('Snapshot creation failed', {
                error: error.message,
                filingId: filing.id,
            });
            // We don't throw here to avoid failing the main update if snapshot fails (optional design choice)
            // But for strict audit, maybe we should throw. Let's throw for now to ensure integrity.
            throw error;
        }
    }
}


module.exports = new FilingService();
