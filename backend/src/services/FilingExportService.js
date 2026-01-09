// =====================================================
// FILING EXPORT SERVICE (S23)
// Canonical JSON affidavit from snapshots
// Pure projection - no mutations, no tax recomputation
// =====================================================

const { ITRFiling } = require('../models');
const FilingSnapshotService = require('./itr/FilingSnapshotService');
const ITRApplicabilityService = require('./ITRApplicabilityService');
const enterpriseLogger = require('../utils/logger');
const { AppError } = require('../middleware/errorHandler');

/**
 * S23: Snapshot-Based JSON Export
 * 
 * Produces canonical, deterministic, legally usable JSON affidavit
 * for manual ITR upload, CA handoff, and audit.
 * 
 * Constitutional guarantees:
 * - Snapshot is truth (never live jsonPayload)
 * - Pure projection (no mutations)
 * - Deterministic output (same snapshot → same JSON)
 * - Freeze-guaranteed (snapshot immutability)
 */
class FilingExportService {
    /**
     * Export filing as canonical JSON affidavit
     * @param {string} filingId - Filing ID
     * @returns {Promise<Object>} Canonical JSON export
     */
    static async exportFiling(filingId) {
        try {
            enterpriseLogger.info('Exporting filing as JSON', { filingId });

            // 1. Resolve filing
            const filing = await ITRFiling.findByPk(filingId);
            if (!filing) {
                throw new AppError('Filing not found', 404);
            }

            // 2. Resolve latest snapshot (snapshot is truth)
            const snapshot = await FilingSnapshotService.getLatestSnapshot(filingId);
            if (!snapshot) {
                throw new AppError('No snapshot found for filing', 404);
            }

            // 3. Run S22 for ITR type annotation
            const itrApplicability = ITRApplicabilityService.evaluate(filing);

            // 4. Project canonical shape
            const exportData = this._projectCanonicalShape(
                filing,
                snapshot,
                itrApplicability
            );

            enterpriseLogger.info('Filing exported successfully', {
                filingId,
                snapshotId: snapshot.id,
                itrType: exportData.meta.itrType
            });

            return exportData;
        } catch (error) {
            enterpriseLogger.error('Filing export failed', {
                filingId,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Project canonical export shape from snapshot
     * @private
     */
    static _projectCanonicalShape(filing, snapshot, itrApplicability) {
        const payload = snapshot.jsonPayload || {};

        return {
            meta: {
                filingId: filing.id,
                snapshotId: snapshot.id,
                assessmentYear: filing.assessmentYear,
                taxpayerPan: filing.taxpayerPan,
                itrType: itrApplicability.recommendedITR,
                eligibleITRs: itrApplicability.eligibleITRs,
                generatedAt: new Date().toISOString(),
                source: 'burnblack-itr',
                version: '1.0'
            },
            personalInfo: payload.personalInfo || null,
            income: {
                salary: payload.income?.salary || null,
                houseProperty: payload.income?.houseProperty || null,
                capitalGains: payload.income?.capitalGains || null,
                business: payload.income?.business || null,
                presumptive: payload.income?.presumptive || null,
                otherIncome: payload.income?.otherIncome || null
            },
            deductions: payload.deductions || null,
            taxes: payload.taxes || null,
            bankAccounts: payload.bankAccounts || [],
            verification: payload.verification || null
        };
    }

    /**
     * Get export filename for download
     * @param {ITRFiling} filing
     * @returns {string} Filename
     */
    static getExportFilename(filing) {
        const ay = filing.assessmentYear.replace('-', '_');
        const pan = filing.taxpayerPan;
        return `ITR_${ay}_${pan}.json`;
    }
}

module.exports = FilingExportService;
