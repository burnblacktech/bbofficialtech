// =====================================================
// INTELLIGENCE GATE SERVICE (V5.1 Phase 3)
// Enforces intelligence flags as approval gates
// =====================================================

const { ITRFiling, User } = require('../../models');
const IntelligenceEngine = require('../../intelligence/IntelligenceEngine');
const auditService = require('../utils/AuditService');
const enterpriseLogger = require('../../utils/logger');
const { AppError } = require('../../middleware/errorHandler');

class IntelligenceGateService {
    /**
     * Evaluate and persist intelligence flags for a filing
     * @param {string} filingId - Filing ID
     * @returns {Promise<object>} - Flags and critical count
     */
    async evaluateFlags(filingId) {
        try {
            const filing = await ITRFiling.findByPk(filingId);
            if (!filing) {
                throw new AppError('Filing not found', 404);
            }

            // Run intelligence engine
            const flags = IntelligenceEngine.run(
                filing.jsonPayload || {},
                filing.taxComputation || {},
                filing.itrType
            );

            // Persist flags to filing
            filing.intelligenceFlags = flags.map(flag => ({
                ...flag,
                timestamp: new Date().toISOString(),
            }));
            filing.intelligenceVersion = 1; // Hardcoded for now
            await filing.save();

            const criticalCount = flags.filter(f => f.severity === 'important').length;

            enterpriseLogger.info('Intelligence flags evaluated', {
                filingId,
                flagCount: flags.length,
                criticalCount,
            });

            return {
                flags,
                criticalCount,
                hasBlockingFlags: criticalCount > 0,
            };
        } catch (error) {
            enterpriseLogger.error('Evaluate flags failed', {
                filingId,
                error: error.message,
            });
            throw error;
        }
    }

    /**
     * Override a critical intelligence flag
     * @param {string} filingId - Filing ID
     * @param {string} flagId - Flag ID to override
     * @param {string} caId - CA user ID
     * @param {string} reason - Override reason
     * @returns {Promise<ITRFiling>}
     */
    async overrideFlag(filingId, flagId, caId, reason) {
        try {
            // Validate CA
            const ca = await User.findByPk(caId);
            if (!ca || !['CA', 'CA_FIRM_ADMIN'].includes(ca.role)) {
                throw new AppError('Only CA can override flags', 403);
            }

            // Get filing
            const filing = await ITRFiling.findByPk(filingId);
            if (!filing) {
                throw new AppError('Filing not found', 404);
            }

            // Verify flag exists
            const flag = (filing.intelligenceFlags || []).find(f => f.id === flagId);
            if (!flag) {
                throw new AppError('Flag not found', 404);
            }

            // Check if already overridden
            const existingOverride = (filing.intelligenceOverrides || []).find(
                o => o.flagId === flagId
            );
            if (existingOverride) {
                throw new AppError('Flag already overridden', 409);
            }

            // Add override
            const override = {
                flagId,
                overriddenBy: caId,
                reason,
                timestamp: new Date().toISOString(),
            };

            filing.intelligenceOverrides = [
                ...(filing.intelligenceOverrides || []),
                override,
            ];
            await filing.save();

            // Audit trail
            await auditService.logEvent({
                eventType: 'INTELLIGENCE_FLAG_OVERRIDDEN',
                userId: caId,
                resourceType: 'ITRFiling',
                resourceId: filingId,
                metadata: {
                    filingId,
                    flagId,
                    flagMessage: flag.message,
                    reason,
                    caId,
                },
            });

            enterpriseLogger.info('Intelligence flag overridden', {
                filingId,
                flagId,
                caId,
            });

            return filing;
        } catch (error) {
            enterpriseLogger.error('Override flag failed', {
                filingId,
                flagId,
                caId,
                error: error.message,
            });
            throw error;
        }
    }

    /**
     * Check if filing has blocking flags (critical flags without overrides)
     * @param {object} filing - ITRFiling instance
     * @returns {object} - Blocking status and details
     */
    hasBlockingFlags(filing) {
        const flags = filing.intelligenceFlags || [];
        const overrides = filing.intelligenceOverrides || [];

        const criticalFlags = flags.filter(f => f.severity === 'important');
        const overriddenFlagIds = overrides.map(o => o.flagId);

        const blockingFlags = criticalFlags.filter(
            f => !overriddenFlagIds.includes(f.id)
        );

        return {
            hasBlocking: blockingFlags.length > 0,
            blockingFlags,
            criticalCount: criticalFlags.length,
            overrideCount: overrides.length,
        };
    }
}

module.exports = new IntelligenceGateService();
