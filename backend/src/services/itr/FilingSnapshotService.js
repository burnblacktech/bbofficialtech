// =====================================================
// FILING SNAPSHOT SERVICE (S18)
// Creates immutable snapshots at lifecycle transitions
// =====================================================

const { ITRFiling } = require('../../models');
const enterpriseLogger = require('../../utils/logger');
const { AppError } = require('../../middleware/errorHandler');

class FilingSnapshotService {
    /**
     * Create immutable snapshot of filing at transition point
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

            const snapshot = {
                version,
                trigger,
                lifecycleState: filing.lifecycleState,
                jsonPayload: JSON.parse(JSON.stringify(filing.jsonPayload || {})), // Deep copy
                createdAt: new Date().toISOString(),
                createdBy: userId,
                assessmentYear: filing.assessmentYear,
                taxpayerPan: filing.taxpayerPan
            };

            // Add to snapshots array
            const snapshots = filing.snapshots || [];
            snapshots.push(snapshot);

            filing.snapshots = snapshots;
            filing.changed('snapshots', true);
            await filing.save();

            enterpriseLogger.info('Snapshot created', {
                filingId,
                version,
                trigger,
                userId
            });

            return snapshot;
        } catch (error) {
            enterpriseLogger.error('Create snapshot failed', {
                filingId,
                trigger,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Get all snapshots for a filing
     * @param {string} filingId - Filing ID
     * @returns {Promise<Array>}
     */
    async getSnapshots(filingId) {
        try {
            const filing = await ITRFiling.findByPk(filingId);
            if (!filing) {
                throw new AppError('Filing not found', 404);
            }

            return filing.snapshots || [];
        } catch (error) {
            enterpriseLogger.error('Get snapshots failed', {
                filingId,
                error: error.message
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
            const snapshots = await this.getSnapshots(filingId);
            return snapshots.find(s => s.version === version) || null;
        } catch (error) {
            enterpriseLogger.error('Get snapshot by version failed', {
                filingId,
                version,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Get next version number for filing
     * @param {string} filingId - Filing ID
     * @returns {Promise<number>}
     */
    async getNextVersion(filingId) {
        const snapshots = await this.getSnapshots(filingId);
        return snapshots.length + 1;
    }

    /**
     * Get latest snapshot
     * @param {string} filingId - Filing ID
     * @returns {Promise<object|null>}
     */
    async getLatestSnapshot(filingId) {
        const snapshots = await this.getSnapshots(filingId);
        if (snapshots.length === 0) return null;

        return snapshots[snapshots.length - 1];
    }
}

module.exports = new FilingSnapshotService();
