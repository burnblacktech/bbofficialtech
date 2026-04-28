// =====================================================
// FILING SNAPSHOT SERVICE (S18)
// Creates immutable snapshots in filing_snapshots table
// =====================================================

const { ITRFiling } = require('../../models');
const FilingSnapshot = require('../../models/FilingSnapshot');
const enterpriseLogger = require('../../utils/logger');
const { AppError } = require('../../middleware/errorHandler');

class FilingSnapshotService {
    /**
     * Create immutable snapshot of filing at transition point
     * Writes to filing_snapshots table (not legacy snapshots array)
     * @param {string} filingId - Filing ID
     * @param {string} trigger - Transition trigger (e.g., 'review_requested', 'approved')
     * @param {string} userId - User who triggered snapshot
     * @returns {Promise<object>} Created snapshot
     */
    async createSnapshot(filingId, trigger, userId) {
        try {
            const filing = await ITRFiling.findByPk(filingId);
            if (!filing) {
                throw new AppError('Filing not found', 404);
            }

            const version = await this.getNextVersion(filingId);

            const snapshot = await FilingSnapshot.create({
                filingId,
                createdBy: userId,
                version,
                snapshotType: trigger === 'pre-submission' ? 'pre-submission' : 'auto',
                jsonPayload: {
                    ...JSON.parse(JSON.stringify(filing.jsonPayload || {})),
                    _snapshotMeta: {
                        trigger,
                        lifecycleState: filing.lifecycleState,
                        assessmentYear: filing.assessmentYear,
                        taxpayerPan: filing.taxpayerPan,
                        snapshotAt: new Date().toISOString(),
                    },
                },
                comment: trigger,
            });

            enterpriseLogger.info('Snapshot created', {
                filingId,
                version,
                trigger,
                userId,
            });

            return {
                id: snapshot.id,
                version: snapshot.version,
                trigger,
                lifecycleState: filing.lifecycleState,
                jsonPayload: snapshot.jsonPayload,
                createdAt: snapshot.createdAt,
                createdBy: userId,
                assessmentYear: filing.assessmentYear,
                taxpayerPan: filing.taxpayerPan,
            };
        } catch (error) {
            enterpriseLogger.error('Create snapshot failed', {
                filingId,
                trigger,
                error: error.message,
            });
            throw error;
        }
    }

    /**
     * Get all snapshots for a filing from filing_snapshots table
     * @param {string} filingId - Filing ID
     * @returns {Promise<Array>}
     */
    async getSnapshots(filingId) {
        try {
            const snapshots = await FilingSnapshot.findAll({
                where: { filingId },
                order: [['version', 'ASC']],
            });

            return snapshots.map(s => ({
                id: s.id,
                version: s.version,
                trigger: s.snapshotType,
                jsonPayload: s.jsonPayload,
                createdAt: s.createdAt,
                createdBy: s.createdBy,
            }));
        } catch (error) {
            enterpriseLogger.error('Get snapshots failed', {
                filingId,
                error: error.message,
            });
            throw error;
        }
    }

    /**
     * Get specific snapshot by version
     * @param {string} filingId - Filing ID
     * @param {number} version - Snapshot version
     * @returns {Promise<object|null>}
     */
    async getSnapshotByVersion(filingId, version) {
        try {
            const snapshot = await FilingSnapshot.findOne({
                where: { filingId, version },
            });
            if (!snapshot) return null;
            return {
                id: snapshot.id,
                version: snapshot.version,
                trigger: snapshot.snapshotType,
                jsonPayload: snapshot.jsonPayload,
                createdAt: snapshot.createdAt,
                createdBy: snapshot.createdBy,
            };
        } catch (error) {
            enterpriseLogger.error('Get snapshot by version failed', {
                filingId,
                version,
                error: error.message,
            });
            throw error;
        }
    }

    /**
     * Get next version number for filing from filing_snapshots table
     * @param {string} filingId - Filing ID
     * @returns {Promise<number>}
     */
    async getNextVersion(filingId) {
        const lastSnapshot = await FilingSnapshot.findOne({
            where: { filingId },
            order: [['version', 'DESC']],
        });
        return (lastSnapshot?.version || 0) + 1;
    }

    /**
     * Get latest snapshot from filing_snapshots table
     * @param {string} filingId - Filing ID
     * @returns {Promise<object|null>}
     */
    async getLatestSnapshot(filingId) {
        const snapshot = await FilingSnapshot.findOne({
            where: { filingId },
            order: [['version', 'DESC']],
        });
        if (!snapshot) return null;
        return {
            id: snapshot.id,
            version: snapshot.version,
            trigger: snapshot.snapshotType,
            jsonPayload: snapshot.jsonPayload,
            createdAt: snapshot.createdAt,
            createdBy: snapshot.createdBy,
        };
    }
}

module.exports = new FilingSnapshotService();
