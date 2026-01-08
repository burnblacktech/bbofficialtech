// =====================================================
// CAPITAL GAINS INTENT SERVICE (F1.2.3)
// Tracks user intent and reconciles with AIS data
// =====================================================

const { ITRFiling } = require('../../models');
const enterpriseLogger = require('../../utils/logger');
const { AppError } = require('../../middleware/errorHandler');
const FilingFreezeService = require('./FilingFreezeService'); // S18

class CapitalGainsIntentService {
    /**
     * Record user's capital gains intent
     * @param {string} filingId - Filing ID
     * @param {string} userResponse - "yes" | "no" | "not_sure"
     * @returns {Promise<object>}
     */
    async recordIntent(filingId, userResponse) {
        try {
            const filing = await ITRFiling.findByPk(filingId);
            if (!filing) {
                throw new AppError('Filing not found', 404);
            }

            // S18: Freeze guard - prevent mutations after draft
            FilingFreezeService.assertMutable(filing);

            // Validate response
            const validResponses = ['yes', 'no', 'not_sure'];
            if (!validResponses.includes(userResponse)) {
                throw new AppError('Invalid response. Must be: yes, no, or not_sure', 400);
            }

            // Determine source
            const aisData = filing.jsonPayload?.ais || {};
            const aisHasCG = aisData.capitalGains && (
                (aisData.capitalGains.stcg && aisData.capitalGains.stcg > 0) ||
                (aisData.capitalGains.ltcg && aisData.capitalGains.ltcg > 0)
            );

            // Build intent object
            const intent = {
                declared: userResponse === 'yes',
                source: aisHasCG ? 'AIS' : 'USER',
                confidence: userResponse === 'not_sure' ? 0.5 : 1.0,
                userResponse,
                recordedAt: new Date().toISOString(),
            };

            // Update filing with canonical path: jsonPayload.income.capitalGains
            const jsonPayload = filing.jsonPayload || {};
            const income = jsonPayload.income || {};

            filing.jsonPayload = {
                ...jsonPayload,
                income: {
                    ...income,
                    capitalGains: {
                        intent,
                        transactions: income.capitalGains?.transactions || [],
                        metadata: income.capitalGains?.metadata || {},
                    },
                },
            };

            // Mark jsonPayload as changed (required for Sequelize JSONB persistence)
            filing.changed('jsonPayload', true);

            await filing.save();

            enterpriseLogger.info('Capital gains intent recorded', {
                filingId,
                userResponse,
                source: intent.source,
            });

            return {
                intent,
                aisHasCG,
                requiresReconciliation: aisHasCG && userResponse === 'no',
            };
        } catch (error) {
            enterpriseLogger.error('Record CG intent failed', {
                filingId,
                error: error.message,
            });
            throw error;
        }
    }

    /**
     * Reconcile user intent with AIS data
     * @param {string} filingId - Filing ID
     * @returns {Promise<object>}
     */
    async reconcileWithAIS(filingId) {
        try {
            const filing = await ITRFiling.findByPk(filingId);
            if (!filing) {
                throw new AppError('Filing not found', 404);
            }

            const intent = filing.jsonPayload?.capitalGainsIntent || {};
            const aisData = filing.jsonPayload?.ais || {};
            const aisHasCG = aisData.capitalGains && (
                (aisData.capitalGains.stcg && aisData.capitalGains.stcg > 0) ||
                (aisData.capitalGains.ltcg && aisData.capitalGains.ltcg > 0)
            );

            const warnings = [];

            // Mismatch: User says "No" but AIS has CG
            if (intent.declared === false && aisHasCG) {
                const aisAmount = (aisData.capitalGains?.stcg || 0) + (aisData.capitalGains?.ltcg || 0);
                warnings.push({
                    code: 'CG_AIS_MISMATCH',
                    severity: 'warning',
                    message: `AIS shows ₹${aisAmount.toLocaleString('en-IN')} in capital gains but you indicated 'No'`,
                    aisAmount,
                    userResponse: intent.userResponse,
                });
            }

            // Mismatch: User says "Yes" but no AIS data
            if (intent.declared === true && !aisHasCG) {
                warnings.push({
                    code: 'CG_NO_AIS',
                    severity: 'info',
                    message: 'No capital gains found in AIS. Please ensure you provide complete details.',
                });
            }

            return {
                hasWarnings: warnings.length > 0,
                warnings,
                intent,
                aisHasCG,
            };
        } catch (error) {
            enterpriseLogger.error('Reconcile CG with AIS failed', {
                filingId,
                error: error.message,
            });
            throw error;
        }
    }

    /**
     * Get mismatch warnings for a filing
     * @param {string} filingId - Filing ID
     * @returns {Promise<Array>}
     */
    async getMismatchWarnings(filingId) {
        try {
            const reconciliation = await this.reconcileWithAIS(filingId);
            return reconciliation.warnings || [];
        } catch (error) {
            enterpriseLogger.error('Get CG mismatch warnings failed', {
                filingId,
                error: error.message,
            });
            throw error;
        }
    }

    /**
     * Get capital gains intent for a filing
     * @param {string} filingId - Filing ID
     * @returns {Promise<object>}
     */
    async getIntent(filingId) {
        try {
            const filing = await ITRFiling.findByPk(filingId);
            if (!filing) {
                throw new AppError('Filing not found', 404);
            }

            const intent = filing.jsonPayload?.capitalGainsIntent || {
                declared: null,
                source: 'UNKNOWN',
                confidence: 0,
                userResponse: null,
            };

            return intent;
        } catch (error) {
            enterpriseLogger.error('Get CG intent failed', {
                filingId,
                error: error.message,
            });
            throw error;
        }
    }
}

module.exports = new CapitalGainsIntentService();
