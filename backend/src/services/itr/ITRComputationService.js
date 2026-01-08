const { sequelize } = require('../../config/database');
const { QueryTypes } = require('sequelize');
const enterpriseLogger = require('../../utils/logger');
const DomainCore = require('../../domain/ITRDomainCore');
const TaxComputationEngine = require('../core/TaxComputationEngine');
const { ITRFiling, ITRDraft } = require('../../models');

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

            // 3. Perform Computation
            // Inject itrType into draftData as expected by computeTax
            const computationResult = await TaxComputationEngine.computeTax({ ...draftData, itrType }, assessmentYear);

            // V2 Intelligence: Generate Signals
            try {
                const IntelligenceEngine = require('../../intelligence/IntelligenceEngine');
                const signals = IntelligenceEngine.run(draftData, computationResult, itrType);
                computationResult.signals = signals;
                enterpriseLogger.info('Intelligence signals generated', { count: signals.length, filingId });
            } catch (intelligenceError) {
                // Intelligence failure should not block core computation
                enterpriseLogger.error('Intelligence Engine failed', { error: intelligenceError.message, filingId });
                computationResult.signals = []; // Fallback
            }

            // V2.2 Confidence Engine: Evaluate Trust Score
            try {
                const ConfidenceEngine = require('../../intelligence/ConfidenceEngine');

                // Construct metadata for confidence scoring
                // Assuming metadata might be passed in context or derived
                const metadata = {
                    sources: draftData.metadata?.sources || [],
                    panVerified: draftData.personalInfo?.panVerified === true || draftData.personalInfo?.verificationStatus === 'VERIFIED',
                    bankVerified: (draftData.bankDetails?.accounts || []).some(acc => acc.isVerified || acc.verificationStatus === 'VERIFIED')
                };

                const confidenceResult = ConfidenceEngine.evaluate({
                    signals: computationResult.signals || [],
                    formData: draftData,
                    taxComputation: computationResult,
                    metadata
                });

                computationResult.confidence = confidenceResult; // Persist under tax_computation.confidence
                enterpriseLogger.info('Confidence score generated', {
                    score: confidenceResult.trustScore,
                    band: confidenceResult.confidenceBand,
                    filingId
                });

            } catch (confidenceError) {
                enterpriseLogger.error('Confidence Engine failed', { error: confidenceError.message, filingId });
                // Do not block computation, but maybe set a default low confidence?
                computationResult.confidence = { trustScore: 0, confidenceBand: 'LOW', error: 'Evaluation Failed' };
            }


            // V2.3 CA Assist Engine: Determine CA Context
            try {
                const CAAssistEngine = require('../../intelligence/CAAssistEngine');

                const caContext = CAAssistEngine.evaluateCAContext({
                    confidence: computationResult.confidence,
                    signals: computationResult.signals || [],
                    itrType,
                    status: filing.status
                });

                // V3.3: Preserve existing CA Requests (Manual override/Feedback loop)
                // If we recompute, we must not lose the active requests.
                const existingContext = (draftData.taxComputation || {}).caContext || (filing.taxComputation || {}).caContext || {};
                if (existingContext.requests && Array.isArray(existingContext.requests)) {
                    caContext.requests = existingContext.requests;
                }

                computationResult.caContext = caContext; // Persist under tax_computation.caContext
                enterpriseLogger.info('CA Context evaluated', {
                    eligible: caContext.caAssistEligible,
                    recommended: caContext.caAssistRecommended,
                    urgency: caContext.urgency,
                    filingId
                });

            } catch (caError) {
                enterpriseLogger.error('CA Assist Engine failed', { error: caError.message, filingId });
                computationResult.caContext = null;
            }

            // 4. Update Filing with Computation Result
            // Also update status to COMPUTATION_DONE?
            // Or DOMAIN STATE transition.

            // 4. Update Filing via Model (SSOT Enforcement)
            // Sync result to jsonPayload.computed and top-level derived columns (Canonical Cache)
            const payload = { ...(filing.jsonPayload || {}) };
            payload.computed = computationResult;

            filing.jsonPayload = payload;
            filing.changed('jsonPayload', true);

            filing.taxComputation = computationResult;
            filing.taxLiability = computationResult.finalTax || 0;
            filing.refundAmount = computationResult.refundAmount || 0;

            // Sync status if it was legacy
            if (!filing.status || filing.status === 'draft') {
                filing.status = 'processed';
            }

            await filing.save({ transaction });

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
