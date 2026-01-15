const { sequelize } = require('../../config/database');
const { QueryTypes } = require('sequelize');
const enterpriseLogger = require('../../utils/logger');
const DomainCore = require('../../domain/ITRDomainCore');
const TaxRegimeAssembly = require('../tax/TaxRegimeAssembly');
const TaxRegimeCalculatorV2 = require('./TaxRegimeCalculatorV2');
const { ITRFiling, ITRDraft } = require('../../models');
const TaxComputation = require('../../models/TaxComputation');

class ITRComputationService {
    /**
     * Compute tax for a filing
     * @param {string} userId - User ID requesting computation
     * @param {string} draftId - Draft ID
     * @param {object} context - Metadata (correlationId, etc.)
     */
    async compute(userId, draftId, context = {}) {
        const transaction = await sequelize.transaction();
        try {
            // 1. Fetch Draft & Filing
            // We need JSON payload/data from draft/filing to compute.
            // Usually computation is done on DRAFT data? Or Filing Payload?
            // ITRController `computeTax` uses `formData` from body OR draft data.
            // We should enforce computation on PERSISTED draft data to ensure consistency.

            const draft = await ITRDraft.findByPk(draftId, {
                include: [{ model: ITRFiling, as: 'filing' }],
                transaction
            });
            if (!draft || draft.filing.createdBy !== userId) {
                throw { statusCode: 404, message: 'Draft not found' };
            }

            const filing = draft.filing;
            const filingId = filing.id;
            const itrType = filing.itrType || 'ITR-1';
            const assessmentYear = filing.assessmentYear;
            const draftData = draft.data;


            // 2. Domain Check: Can we compute?
            // Typically allowed in DRAFT_IN_PROGRESS, COMPUTATION_DONE (recompute), etc.
            // We can use getAllowedActions or just check state.
            const currentState = await DomainCore.getCurrentState(filingId);
            const isAllowed = await DomainCore.isActionAllowed(filingId, 'compute_tax', { role: 'END_USER' }); // Assuming role

            if (!isAllowed) {
                // Fallback check if domain core rules are strict or if we need to transition first
                // Actually, if we are in DRAFT, we should be able to compute.
                // If DomainCore says no, we abort.
                // But strict locking might prevent recompute.
                if (currentState === 'LOCKED' || currentState === 'FILED') {
                    throw { statusCode: 403, message: `Computation not allowed in state ${currentState}` };
                }
            }

            // V3.4: Freeze Logic - Hard Block if submitted to CA
            if (filing.status === 'SUBMITTED_TO_CA' || filing.status === 'FILED') {
                throw { statusCode: 403, message: 'Filing is locked for CA Review/Submission' };
            }

            // 3. Perform Computation using S24 Adapter
            // SSOT Enforcement: jsonPayload is the canonical source.
            // Data in draft.data is treated as session-local changes that need to be committed to jsonPayload.
            const combinedData = { ...(filing.jsonPayload || {}), ...(draftData || {}) };

            const comparison = TaxRegimeCalculatorV2.compareRegimes(combinedData, assessmentYear);
            const selectedRegime = filing.selectedRegime || comparison.comparison.recommendedRegime;
            const computationResult = selectedRegime === 'new' ? comparison.newRegime : comparison.oldRegime;
            computationResult.comparison = comparison.comparison;
            computationResult.selectedRegime = selectedRegime;

            // ... (Intelligence/Confidence/CA logic remains same as it uses computationResult/draftData)

            // 4. Update Filing via Model (SSOT Enforcement)
            // Sync result and updated facts to jsonPayload.
            const payload = { ...combinedData }; // Everything from session moves to payload
            payload.computed = computationResult;

            filing.jsonPayload = payload;
            filing.changed('jsonPayload', true);

            filing.taxComputation = computationResult;
            filing.taxLiability = computationResult.finalTaxLiability || 0; // Use V2 field name
            filing.refundAmount = computationResult.refundAmount || 0;

            // Sync status
            if (!filing.status || filing.status === 'draft') {
                filing.status = 'processed';
            }

            await filing.save({ transaction });

            // Sync draft if needed (preserving the relationship)
            if (Object.keys(draftData || {}).length > 0) {
                draft.data = payload; // Align draft with updated payload
                await draft.save({ transaction });
            }

            // 4b. Persist to TaxComputation Table (Analytics & Audit)
            // Remove old record for this filing to keep 1:1 sync (or use upsert logic if ID known)
            // Since we want history, we could keep logs, but TaxComputation model is SSOT for current state.
            // Let's destroy old and create new to ensure clean state.
            await TaxComputation.destroy({
                where: { filingId: filing.id },
                transaction
            });

            await TaxComputation.create({
                filingId: filing.id,
                userId: userId,
                regime: selectedRegime === 'new' ? 'NEW' : 'OLD',
                assessmentYear: assessmentYear,

                // Computed Values
                grossTotalIncome: computationResult.grossTotalIncome || 0,
                totalDeductions: computationResult.totalDeductions || 0,
                totalTaxableIncome: computationResult.totalTaxableIncome || 0,

                // Tax Components
                taxOnIncome: computationResult.taxOnIncome || 0,
                rebate87A: computationResult.rebate87A || 0,
                surcharge: computationResult.surcharge || 0,
                healthAndEducationCess: computationResult.cess || 0,
                totalTaxLiability: computationResult.finalTaxLiability || 0,

                // Final Status
                tdsCredit: computationResult.tds || 0,
                advanceTaxPaid: computationResult.advanceTax || 0,
                selfAssessmentTaxPaid: computationResult.selfAssessmentTax || 0,

                refundDue: computationResult.refundAmount || 0,
                taxPayable: computationResult.taxPayable || 0,

                // Metadata
                computationLog: {
                    comparison: comparison.comparison,
                    breakdown: computationResult.breakdown
                }
            }, { transaction });

            // 5. Transition State (if needed)
            // If current state is DRAFT, move to COMPUTATION_DONE
            // Using DomainCore to manage transition
            // We do this AFTER DB update to ensure data is there (Invariant check might check it)
            // But DomainInvariant checks BEFORE? No, validateInvariant checks DB.
            // So we update DB first, then transition.

            // Determine target state. If already > COMPUTATION_DONE (e.g. VALIDATED), maybe don't downgrade?
            // Use DomainCore logic? 
            // For now, straightforward: compute -> COMPUTATION_DONE.
            // But we shouldn't overwrite VALIDATION_SUCCESS unless validation is invalidated.
            // DomainCore logic `requiresStateRollback` handles invalidation on data update.
            // Here we are just computing.

            const { ITR_DOMAIN_STATES } = require('../../domain/states');
            if (currentState !== ITR_DOMAIN_STATES.COMPUTED && currentState !== ITR_DOMAIN_STATES.LOCKED) {
                if (DomainCore.canTransition(currentState, ITR_DOMAIN_STATES.COMPUTED)) {
                    await DomainCore.transitionState(filingId, ITR_DOMAIN_STATES.COMPUTED, { userId });
                }
            }

            await transaction.commit();

            // Create financial snapshot for analytics (async, non-blocking)
            // This runs after transaction commit to not block the main flow
            try {
                const FinancialStoryService = require('../analytics/FinancialStoryService');
                const TimelineService = require('../analytics/TimelineService');
                const InsightsEngine = require('../analytics/InsightsEngine');

                // Create snapshot from filing
                await FinancialStoryService.createSnapshotFromFiling(filingId);

                // Detect milestones
                await TimelineService.detectMilestones(userId, filingId);

                // Generate insights
                await InsightsEngine.generateInsights(userId, filing.assessmentYear);

                enterpriseLogger.info('Financial analytics generated', { filingId, assessmentYear: filing.assessmentYear });
            } catch (analyticsError) {
                // Log but don't fail the computation if analytics fail
                enterpriseLogger.error('Failed to generate financial analytics', {
                    filingId,
                    error: analyticsError.message,
                });
            }

            return {
                success: true,
                filingId,
                computation: computationResult,
                timestamp: new Date()
            };

        } catch (error) {
            if (transaction && !transaction.finished) await transaction.rollback();
            enterpriseLogger.error('Tax computation failed', { error: error.message, draftId });
            throw error;
        }
    }
}

module.exports = new ITRComputationService();
