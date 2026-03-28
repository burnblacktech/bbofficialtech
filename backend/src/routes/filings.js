/**
 * filings.js
 * S12 Phase 8 - Minimal Filing Orchestrator Routes
 * Canonical filing CRUD endpoints
 */

const express = require('express');
const router = express.Router();
const FilingService = require('../services/core/FilingService');
const { authenticateToken } = require('../middleware/auth');
const { ITRFiling } = require('../models');
const SubmissionStateMachine = require('../domain/SubmissionStateMachine');
const STATES = require('../domain/SubmissionStates');
const ReviewRequirementService = require('../services/itr/ReviewRequirementService');
const ITRApplicabilityService = require('../services/ITRApplicabilityService');
const FilingExportService = require('../services/FilingExportService');
const FinancialStoryService = require('../services/FinancialStoryService');
const FilingSnapshotService = require('../services/itr/FilingSnapshotService');
const FilingSafetyService = require('../services/itr/FilingSafetyService');
const TaxRegimeAssembly = require('../services/tax/TaxRegimeAssembly');
const TaxRegimeCalculatorV2 = require('../services/itr/TaxRegimeCalculatorV2');
const ERIOutcomeService = require('../services/ERIOutcomeService');
const FilingCompletenessService = require('../services/itr/FilingCompletenessService');
const { AppError } = require('../middleware/errorHandler');

/**
 * Create a new ITR filing
 * POST /api/filings
 * @body {string} assessmentYear - e.g., "2024-25"
 * @body {string} taxpayerPan - Required
 */
router.post('/', authenticateToken, async (req, res, next) => {
    try {
        const { assessmentYear, taxpayerPan, itrType, filingType, originalAckNumber } = req.body;

        if (!assessmentYear || !taxpayerPan) {
            return res.status(400).json({
                success: false,
                error: 'assessmentYear and taxpayerPan are required',
            });
        }

        // Revised return flow
        if (filingType === 'revised') {
            if (!originalAckNumber?.trim()) {
                return res.status(400).json({ success: false, error: 'Original acknowledgment number is required for revised returns' });
            }

            // Find the original filing
            const originalFiling = await ITRFiling.findOne({
                where: {
                    createdBy: req.user.userId,
                    assessmentYear,
                    taxpayerPan,
                    filingType: 'original',
                    lifecycleState: ['eri_success', 'submitted_to_eri'],
                },
            });

            if (!originalFiling) {
                return res.status(400).json({ success: false, error: 'No submitted original filing found for this AY. You must submit an original return first.' });
            }

            // Create revised filing with data copied from original
            const user = { userId: req.user.userId, caFirmId: req.user.caFirmId, role: req.user.role };
            const result = await FilingService.createFiling(
                { assessmentYear, taxpayerPan, itrType: itrType || originalFiling.itrType },
                user
            );

            // Set revised fields
            result.filingType = 'revised';
            result.originalAckNumber = originalAckNumber.trim();
            result.originalFilingId = originalFiling.id;
            result.jsonPayload = { ...originalFiling.jsonPayload };
            result.selectedRegime = originalFiling.selectedRegime;
            await result.save();

            return res.status(201).json({ success: true, data: result });
        }

        // Original filing flow — check for existing draft
        const existingFiling = await ITRFiling.findOne({
            where: {
                createdBy: req.user.userId,
                assessmentYear,
                taxpayerPan,
                filingType: 'original',
            },
        });

        // If filing exists, update its ITR type if changed and return it
        if (existingFiling) {
            if (itrType && existingFiling.itrType !== itrType) {
                existingFiling.itrType = itrType;
                await existingFiling.save();
            }
            return res.status(200).json({
                success: true,
                data: existingFiling,
                message: 'Filing already exists for this assessment year',
            });
        }

        const user = {
            userId: req.user.userId,
            caFirmId: req.user.caFirmId,
            role: req.user.role,
        };

        const result = await FilingService.createFiling(
            { assessmentYear, taxpayerPan, itrType },
            user
        );

        res.status(201).json({
            success: true,
            data: result,
        });

    } catch (error) {
        next(error);
    }
});

/**
 * Prefill filing data from ITD/AIS
 * POST /api/filings/prefill
 * @body {string} pan - PAN number
 * @body {string} assessmentYear - e.g., "2024-25"
 */
router.post('/prefill', authenticateToken, async (req, res, next) => {
    try {
        const { pan, assessmentYear, dob } = req.body;
        const userId = req.user.userId;

        if (!pan || !assessmentYear) {
            return res.status(400).json({
                success: false,
                error: 'PAN and assessmentYear are required',
            });
        }

        const ITRDataPrefetchService = require('../services/itr/ITRDataPrefetchService');
        const prefetchService = new ITRDataPrefetchService();

        const prefillData = await prefetchService.prefetchData(userId, pan, assessmentYear, dob);

        res.status(200).json({
            success: true,
            data: prefillData.data,
            sources: prefillData.sources,
        });
    } catch (error) {
        next(error);
    }
});

/**
 * Get filing details
 * GET /api/filings/:id
 */
router.get('/:id', authenticateToken, async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        const filing = await FilingService.getFiling(id, userId);

        res.status(200).json({
            success: true,
            data: filing,
        });

    } catch (error) {
        next(error);
    }
});

/**
 * List all filings for current user
 * GET /api/filings
 */
router.get('/', authenticateToken, async (req, res, next) => {
    try {
        const userId = req.user.userId;

        const filings = await FilingService.listFilings(userId);

        res.status(200).json({
            success: true,
            data: filings,
        });

    } catch (error) {
        next(error);
    }
});

/**
 * Update filing
 * PUT /api/filings/:id
 */
router.put('/:id', authenticateToken, async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        const { jsonPayload, lifecycleState, selectedRegime } = req.body;

        // Get the filing
        const filing = await ITRFiling.findByPk(id);

        if (!filing) {
            throw new AppError('Filing not found', 404);
        }

        // Check ownership
        if (filing.createdBy !== userId) {
            throw new AppError('Not authorized to update this filing', 403);
        }

        // S32: Freeze Enforcement
        // If the filing is not in draft, it is frozen for updates to payload or regime
        if (filing.lifecycleState !== STATES.DRAFT) {
            if (jsonPayload !== undefined || selectedRegime !== undefined) {
                throw new AppError(
                    `Filing is frozen in state: ${filing.lifecycleState}. No further updates allowed to payload or regime choice.`,
                    403,
                    'FILING_FROZEN'
                );
            }
        }

        // Direct lifecycleState updates via PUT are deprecated in favor of State Machine
        if (lifecycleState !== undefined && lifecycleState !== filing.lifecycleState) {
            throw new AppError(
                'Direct state updates are forbidden. Use formal submission or transition endpoints.',
                400,
                'DIRECT_STATE_UPDATE_FORBIDDEN'
            );
        }

        // Update fields
        if (jsonPayload !== undefined) {
            filing.jsonPayload = jsonPayload;
        }
        if (selectedRegime !== undefined) {
            filing.selectedRegime = selectedRegime;
        }

        await filing.save();

        res.status(200).json({
            success: true,
            data: filing,
        });

    } catch (error) {
        next(error);
    }
});

/**
 * Delete a draft filing
 * DELETE /api/filings/:id
 */
router.delete('/:id', authenticateToken, async (req, res, next) => {
    try {
        const filing = await ITRFiling.findByPk(req.params.id);
        if (!filing) throw new AppError('Filing not found', 404);
        if (filing.createdBy !== req.user.userId) throw new AppError('Not authorized', 403);
        if (filing.lifecycleState !== STATES.DRAFT) {
            throw new AppError('Only draft filings can be deleted', 400, 'CANNOT_DELETE_NON_DRAFT');
        }
        await filing.destroy();
        res.json({ success: true, message: 'Filing deleted' });
    } catch (error) { next(error); }
});

/**
 * Validate filing completeness (pre-submission check)
 * GET /api/filings/:filingId/validate
 */
router.get('/:filingId/validate', authenticateToken, async (req, res, next) => {
    try {
        const filing = await ITRFiling.findByPk(req.params.filingId);
        if (!filing) throw new AppError('Filing not found', 404);
        if (filing.createdBy !== req.user.userId) throw new AppError('Not authorized', 403);

        const result = FilingCompletenessService.validate(filing);
        res.json({ success: true, data: result });
    } catch (error) { next(error); }
});

/**
 * Submit filing to ERI (S20.A: Direct submission)
 * POST /api/filings/:filingId/submit
 */
router.post('/:filingId/submit', authenticateToken, async (req, res, next) => {
    try {
        const { filingId } = req.params;
        const filing = await ITRFiling.findByPk(filingId);

        if (!filing) {
            throw new AppError('Filing not found', 404);
        }

        // Check ownership
        if (filing.createdBy !== req.user.userId) {
            throw new AppError('Not authorized to submit this filing', 403);
        }

        // Check current state
        if (filing.lifecycleState !== STATES.DRAFT) {
            throw new AppError(
                `Cannot submit filing in ${filing.lifecycleState} state`,
                400,
                'INVALID_STATE'
            );
        }

        // S22: Filing completeness gate
        const completeness = FilingCompletenessService.validate(filing);
        if (!completeness.complete) {
            throw new AppError(
                `Filing incomplete: ${completeness.errors.map(e => e.message).join('; ')}`,
                400,
                'FILING_INCOMPLETE',
                { errors: completeness.errors, warnings: completeness.warnings }
            );
        }

        // Revised return: must have original ack number
        if (filing.filingType === 'revised' && !filing.originalAckNumber?.trim()) {
            throw new AppError(
                'Original acknowledgment number is required for revised returns',
                400,
                'REVISED_MISSING_ACK'
            );
        }

        // Check review requirement
        const requirement = ReviewRequirementService.deriveRequirement(filing);

        if (requirement === 'mandatory') {
            const explanation = ReviewRequirementService.getRequirementExplanation(filing);
            throw new AppError(
                explanation.message,
                400,
                'CA_REVIEW_REQUIRED',
                { reasons: explanation.reasons }
            );
        }

        // S22: Constitutional submission gate - validate ITR completeness
        const itrApplicability = ITRApplicabilityService.evaluate(filing);

        if (!itrApplicability.safeToSubmit) {
            const missingBlocksMsg = itrApplicability.missingBlocks.length > 0
                ? `Missing required information: ${itrApplicability.missingBlocks.join(', ')}`
                : 'Filing does not meet requirements for any ITR type';

            throw new AppError(
                `Filing incomplete for ${itrApplicability.recommendedITR || 'ITR submission'}. ${missingBlocksMsg}`,
                400,
                'ITR_INCOMPLETE',
                {
                    eligibleITRs: itrApplicability.eligibleITRs,
                    missingBlocks: itrApplicability.missingBlocks,
                    recommendedITR: itrApplicability.recommendedITR
                }
            );
        }

        // Transition to submitted_to_eri
        await SubmissionStateMachine.transition(
            filing,
            STATES.SUBMITTED_TO_ERI,
            {
                userId: req.user.userId,
                role: 'END_USER',
                caFirmId: null
            }
        );

        await filing.save();

        // TODO: Trigger ERI submission worker (Ring 3)

        res.status(200).json({
            success: true,
            message: 'Filing submitted to ERI',
            data: {
                filingId: filing.id,
                lifecycleState: filing.lifecycleState,
                submittedAt: new Date().toISOString(),
                reviewRequirement: requirement
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * Financial Story UX: Overview
 * GET /api/filings/:filingId/overview
 * Screen 1: Your Financial Year at a Glance
 */
router.get('/:filingId/overview', authenticateToken, async (req, res, next) => {
    try {
        const { filingId } = req.params;
        const filing = await ITRFiling.findByPk(filingId);

        if (!filing) {
            throw new AppError('Filing not found', 404);
        }

        // Check ownership
        if (filing.createdBy !== req.user.userId) {
            throw new AppError('Not authorized to view this filing', 403);
        }

        const snapshot = await FilingSnapshotService.getLatestSnapshot(filingId);
        const applicability = ITRApplicabilityService.evaluate(filing);

        // Extract selected income sources from jsonPayload
        const jsonPayload = filing.jsonPayload || {};
        const selectedIncomeSources = jsonPayload.selectedIncomeSources || [];

        res.status(200).json({
            success: true,
            data: {
                identity: {
                    assessmentYear: filing.assessmentYear,
                    taxpayerPan: FinancialStoryService.maskPan(filing.taxpayerPan),
                    itrType: applicability.recommendedITR,
                    eligibleITRs: applicability.eligibleITRs,
                    residencyStatus: filing.isResident ? 'resident' : 'non-resident',
                    selectedIncomeSources: selectedIncomeSources
                },
                incomeSummary: FinancialStoryService.extractIncomeSummary(snapshot?.jsonPayload || {}),
                eligibilityBadge: {
                    status: applicability.safeToSubmit ? 'eligible' : 'incomplete',
                    itrType: applicability.recommendedITR,
                    caRequired: applicability.caRequired,
                    message: `${applicability.safeToSubmit ? 'Eligible for' : 'Incomplete for'} ${applicability.recommendedITR}`
                },
                missingBlocks: applicability.missingBlocks,
                jsonPayload: filing.jsonPayload
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * Financial Story UX: Income Story
 * GET /api/filings/:filingId/income-story
 * Screen 2: Your Income Story
 */
router.get('/:filingId/income-story', authenticateToken, async (req, res, next) => {
    try {
        const { filingId } = req.params;
        const filing = await ITRFiling.findByPk(filingId);

        if (!filing) {
            throw new AppError('Filing not found', 404);
        }

        if (filing.createdBy !== req.user.userId) {
            throw new AppError('Not authorized to view this filing', 403);
        }

        const snapshot = await FilingSnapshotService.getLatestSnapshot(filingId);
        const payload = snapshot?.jsonPayload || {};

        res.status(200).json({
            success: true,
            data: {
                salary: FinancialStoryService.extractSalaryStory(payload.income?.salary),
                capitalGains: FinancialStoryService.extractCapitalGainsStory(payload.income?.capitalGains),
                business: FinancialStoryService.extractBusinessStory(payload.income?.business),
                otherIncome: FinancialStoryService.extractOtherIncomeStory(payload.income || {})
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * Financial Story UX: Tax Breakdown
 * GET /api/filings/:filingId/tax-breakdown
 * Screen 3: How Your Tax Was Calculated
 */
router.get('/:filingId/tax-breakdown', authenticateToken, async (req, res, next) => {
    try {
        const { filingId } = req.params;
        const filing = await ITRFiling.findByPk(filingId);

        if (!filing) {
            throw new AppError('Filing not found', 404);
        }

        if (filing.createdBy !== req.user.userId) {
            throw new AppError('Not authorized to view this filing', 403);
        }

        const snapshot = await FilingSnapshotService.getLatestSnapshot(filingId);
        const jsonPayload = snapshot?.jsonPayload || {};
        const selectedRegime = filing.selectedRegime || 'old';

        // S24: Use formal comparison engine to get both regimes
        const comparison = TaxRegimeCalculatorV2.compareRegimes(jsonPayload);
        const result = selectedRegime === 'old' ? comparison.oldRegime : comparison.newRegime;
        const alternativeResult = selectedRegime === 'old' ? comparison.newRegime : comparison.oldRegime;

        const tdsDeducted = FinancialStoryService.extractTDS(jsonPayload);
        const refundOrPayable = tdsDeducted - result.finalTaxLiability;

        res.status(200).json({
            success: true,
            data: {
                selectedRegime,
                recommendedRegime: comparison.comparison.recommendedRegime,
                savings: comparison.comparison.savings,
                oldRegime: comparison.oldRegime,
                newRegime: comparison.newRegime,
                steps: {
                    taxableIncome: {
                        grossTotalIncome: result.grossTotalIncome,
                        deductions: result.totalDeductions,
                        totalIncome: result.totalIncome,
                        breakdown: result.breakdown.income
                    },
                    taxCalculation: {
                        slabTax: result.taxOnIncome,
                        rebate: result.rebate,
                        surcharge: result.surcharge,
                        cess: result.cess,
                        totalTax: result.finalTaxLiability,
                        slabsApplied: result.breakdown.slabsApplied
                    },
                    finalLiability: {
                        totalTax: result.finalTaxLiability,
                        tdsDeducted,
                        refundOrPayable,
                        isRefund: refundOrPayable > 0
                    }
                },
                notes: result.notes
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * Financial Story UX: Filing Readiness
 * GET /api/filings/:filingId/readiness
 * Screen 5: Is Your Filing Ready?
 */
router.get('/:filingId/readiness', authenticateToken, async (req, res, next) => {
    try {
        const { filingId } = req.params;
        const filing = await ITRFiling.findByPk(filingId);

        if (!filing) {
            throw new AppError('Filing not found', 404);
        }

        if (filing.createdBy !== req.user.userId) {
            throw new AppError('Not authorized to view this filing', 403);
        }

        const safetyStatus = await FilingSafetyService.getSafetyStatus(filingId);
        const snapshot = await FilingSnapshotService.getLatestSnapshot(filingId);

        res.status(200).json({
            success: true,
            data: {
                completionChecklist: FinancialStoryService.deriveChecklist(safetyStatus.itr.missingBlocks, safetyStatus.blockers),
                legalStatus: {
                    safeToSubmit: safetyStatus.safeToSubmit && safetyStatus.itr.safeToSubmit,
                    reason: safetyStatus.itr.safeToSubmit
                        ? 'Filing is complete and ready for submission'
                        : `Missing required information: ${safetyStatus.itr.missingBlocks.join(', ')}`,
                    missingBlocks: safetyStatus.itr.missingBlocks
                },
                caRequirement: {
                    status: safetyStatus.itr.caRequired,
                    explanation: FinancialStoryService.explainCArequirement(
                        safetyStatus.itr.caRequired,
                        safetyStatus.itr.recommendedITR
                    )
                },
                actions: {
                    canSubmit: safetyStatus.safeToSubmit && safetyStatus.itr.safeToSubmit,
                    canDownloadJSON: true,
                    canRequestCAReview: true
                },
                snapshot: snapshot ? {
                    id: snapshot.id,
                    createdAt: snapshot.createdAt,
                    downloadUrl: `/api/filings/${filingId}/export/json`
                } : null
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * Export filing as JSON for manual filing
 * GET /api/filings/:filingId/export/json
 * S23: Snapshot-based canonical export
 */
router.get('/:filingId/export/json', authenticateToken, async (req, res, next) => {
    try {
        const { filingId } = req.params;
        const filing = await ITRFiling.findByPk(filingId);

        if (!filing) {
            throw new AppError('Filing not found', 404);
        }

        // Check ownership
        if (filing.createdBy !== req.user.userId) {
            throw new AppError('Not authorized to export this filing', 403);
        }

        // Generate canonical export from snapshot
        const exportData = await FilingExportService.exportFiling(filingId);

        // Set download headers
        const filename = FilingExportService.getExportFilename(filing);
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        res.status(200).json(exportData);
    } catch (error) {
        next(error);
    }
});

/**
 * ERI Submission Outcome UX: Submission Status
 * GET /api/filings/:filingId/submission-status
 * Read-only projection of ERI submission outcome
 */
router.get('/:filingId/submission-status', authenticateToken, async (req, res, next) => {
    try {
        const { filingId } = req.params;
        const filing = await ITRFiling.findByPk(filingId);

        if (!filing) {
            throw new AppError('Filing not found', 404);
        }

        // Check ownership
        if (filing.createdBy !== req.user.userId) {
            throw new AppError('Not authorized to view this filing', 403);
        }

        const submissionStatus = await ERIOutcomeService.getSubmissionStatus(filingId);

        res.status(200).json({
            success: true,
            data: submissionStatus
        });
    } catch (error) {
        next(error);
    }
});

/**
 * ITR-1 Computation
 * POST /api/filings/:filingId/itr1/compute
 * Returns full tax computation for both regimes
 */
router.post('/:filingId/itr1/compute', authenticateToken, async (req, res, next) => {
    try {
        const { filingId } = req.params;
        const filing = await ITRFiling.findByPk(filingId);

        if (!filing) throw new AppError('Filing not found', 404);
        if (filing.createdBy !== req.user.userId) throw new AppError('Not authorized', 403);

        const ITR1ComputationService = require('../services/itr/ITR1ComputationService');
        const computation = ITR1ComputationService.compute(filing.jsonPayload || {});

        // Save computation result on filing
        await filing.update({ taxComputation: computation });

        res.status(200).json({ success: true, data: computation });
    } catch (error) {
        next(error);
    }
});

/**
 * ITR-1 Validation
 * GET /api/filings/:filingId/itr1/validate
 * Returns field-level validation errors
 */
router.get('/:filingId/itr1/validate', authenticateToken, async (req, res, next) => {
    try {
        const { filingId } = req.params;
        const filing = await ITRFiling.findByPk(filingId);

        if (!filing) throw new AppError('Filing not found', 404);
        if (filing.createdBy !== req.user.userId) throw new AppError('Not authorized', 403);

        const ITR1ComputationService = require('../services/itr/ITR1ComputationService');
        const validation = ITR1ComputationService.validate(filing.jsonPayload || {});

        res.status(200).json({ success: true, data: validation });
    } catch (error) {
        next(error);
    }
});

/**
 * ITR-1 JSON Export (ITD format)
 * GET /api/filings/:filingId/itr1/json
 * Downloads ITD-format JSON for manual upload
 */
router.get('/:filingId/itr1/json', authenticateToken, async (req, res, next) => {
    try {
        const { filingId } = req.params;
        const filing = await ITRFiling.findByPk(filingId);

        if (!filing) throw new AppError('Filing not found', 404);
        if (filing.createdBy !== req.user.userId) throw new AppError('Not authorized', 403);

        // Validate completeness before generating JSON
        const validation = FilingCompletenessService.validate(filing);
        const blockers = (validation.errors || []).filter(e => e.severity === 'blocker' || !e.severity);
        if (blockers.length > 0) {
            return res.status(422).json({
                success: false,
                error: `Filing is incomplete. ${blockers.length} issue(s) must be fixed before downloading JSON.`,
                code: 'FILING_INCOMPLETE',
                issues: blockers.slice(0, 10),
            });
        }

        const ITR1JsonBuilder = require('../services/itr/ITR1JsonBuilder');
        const json = ITR1JsonBuilder.build(filing.jsonPayload || {}, filing.assessmentYear);

        const filename = `ITR1_${filing.taxpayerPan}_AY${filing.assessmentYear}.json`;
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        res.status(200).json(json);
    } catch (error) {
        next(error);
    }
});

// =====================================================
// ITR-2 SPECIFIC ENDPOINTS
// =====================================================

/**
 * ITR-2 Computation
 * POST /api/filings/:filingId/itr2/compute
 */
router.post('/:filingId/itr2/compute', authenticateToken, async (req, res, next) => {
    try {
        const filing = await ITRFiling.findByPk(req.params.filingId);
        if (!filing) throw new AppError('Filing not found', 404);
        if (filing.createdBy !== req.user.userId) throw new AppError('Not authorized', 403);

        const ITR2ComputationService = require('../services/itr/ITR2ComputationService');
        const computation = ITR2ComputationService.compute(filing.jsonPayload || {});
        await filing.update({ taxComputation: computation });
        res.json({ success: true, data: computation });
    } catch (error) { next(error); }
});

/**
 * ITR-2 Validation
 * GET /api/filings/:filingId/itr2/validate
 */
router.get('/:filingId/itr2/validate', authenticateToken, async (req, res, next) => {
    try {
        const filing = await ITRFiling.findByPk(req.params.filingId);
        if (!filing) throw new AppError('Filing not found', 404);
        if (filing.createdBy !== req.user.userId) throw new AppError('Not authorized', 403);

        const ITR2ComputationService = require('../services/itr/ITR2ComputationService');
        const validation = ITR2ComputationService.validate(filing.jsonPayload || {});
        res.json({ success: true, data: validation });
    } catch (error) { next(error); }
});

/**
 * ITR-2 JSON Export
 * GET /api/filings/:filingId/itr2/json
 */
router.get('/:filingId/itr2/json', authenticateToken, async (req, res, next) => {
    try {
        const filing = await ITRFiling.findByPk(req.params.filingId);
        if (!filing) throw new AppError('Filing not found', 404);
        if (filing.createdBy !== req.user.userId) throw new AppError('Not authorized', 403);

        const validation = FilingCompletenessService.validate(filing);
        const blockers = (validation.errors || []).filter(e => e.severity === 'blocker' || !e.severity);
        if (blockers.length > 0) {
            return res.status(422).json({ success: false, error: `Filing incomplete. ${blockers.length} issue(s) to fix.`, code: 'FILING_INCOMPLETE', issues: blockers.slice(0, 10) });
        }

        const ITR2JsonBuilder = require('../services/itr/ITR2JsonBuilder');
        const json = ITR2JsonBuilder.build(filing.jsonPayload || {}, filing.assessmentYear);
        res.setHeader('Content-Disposition', `attachment; filename="ITR2_${filing.taxpayerPan}_AY${filing.assessmentYear}.json"`);
        res.json(json);
    } catch (error) { next(error); }
});

// =====================================================
// ITR-3 SPECIFIC ENDPOINTS
// =====================================================

router.post('/:filingId/itr3/compute', authenticateToken, async (req, res, next) => {
    try {
        const filing = await ITRFiling.findByPk(req.params.filingId);
        if (!filing) throw new AppError('Filing not found', 404);
        if (filing.createdBy !== req.user.userId) throw new AppError('Not authorized', 403);
        const ITR3 = require('../services/itr/ITR3ComputationService');
        const computation = ITR3.compute(filing.jsonPayload || {});
        await filing.update({ taxComputation: computation });
        res.json({ success: true, data: computation });
    } catch (error) { next(error); }
});

router.get('/:filingId/itr3/validate', authenticateToken, async (req, res, next) => {
    try {
        const filing = await ITRFiling.findByPk(req.params.filingId);
        if (!filing) throw new AppError('Filing not found', 404);
        if (filing.createdBy !== req.user.userId) throw new AppError('Not authorized', 403);
        const ITR3 = require('../services/itr/ITR3ComputationService');
        res.json({ success: true, data: ITR3.validate(filing.jsonPayload || {}) });
    } catch (error) { next(error); }
});

router.get('/:filingId/itr3/json', authenticateToken, async (req, res, next) => {
    try {
        const filing = await ITRFiling.findByPk(req.params.filingId);
        if (!filing) throw new AppError('Filing not found', 404);
        if (filing.createdBy !== req.user.userId) throw new AppError('Not authorized', 403);
        const validation = FilingCompletenessService.validate(filing);
        const blockers = (validation.errors || []).filter(e => e.severity === 'blocker' || !e.severity);
        if (blockers.length > 0) {
            return res.status(422).json({ success: false, error: `Filing incomplete. ${blockers.length} issue(s) to fix.`, code: 'FILING_INCOMPLETE', issues: blockers.slice(0, 10) });
        }
        const ITR3Json = require('../services/itr/ITR3JsonBuilder');
        res.setHeader('Content-Disposition', `attachment; filename="ITR3_${filing.taxpayerPan}_AY${filing.assessmentYear}.json"`);
        res.json(ITR3Json.build(filing.jsonPayload || {}, filing.assessmentYear));
    } catch (error) { next(error); }
});

// =====================================================
// ITR-4 SPECIFIC ENDPOINTS
// =====================================================

router.post('/:filingId/itr4/compute', authenticateToken, async (req, res, next) => {
    try {
        const filing = await ITRFiling.findByPk(req.params.filingId);
        if (!filing) throw new AppError('Filing not found', 404);
        if (filing.createdBy !== req.user.userId) throw new AppError('Not authorized', 403);
        const ITR4 = require('../services/itr/ITR4ComputationService');
        const computation = ITR4.compute(filing.jsonPayload || {});
        await filing.update({ taxComputation: computation });
        res.json({ success: true, data: computation });
    } catch (error) { next(error); }
});

router.get('/:filingId/itr4/validate', authenticateToken, async (req, res, next) => {
    try {
        const filing = await ITRFiling.findByPk(req.params.filingId);
        if (!filing) throw new AppError('Filing not found', 404);
        if (filing.createdBy !== req.user.userId) throw new AppError('Not authorized', 403);
        const ITR4 = require('../services/itr/ITR4ComputationService');
        res.json({ success: true, data: ITR4.validate(filing.jsonPayload || {}) });
    } catch (error) { next(error); }
});

router.get('/:filingId/itr4/json', authenticateToken, async (req, res, next) => {
    try {
        const filing = await ITRFiling.findByPk(req.params.filingId);
        if (!filing) throw new AppError('Filing not found', 404);
        if (filing.createdBy !== req.user.userId) throw new AppError('Not authorized', 403);
        const validation = FilingCompletenessService.validate(filing);
        const blockers = (validation.errors || []).filter(e => e.severity === 'blocker' || !e.severity);
        if (blockers.length > 0) {
            return res.status(422).json({ success: false, error: `Filing incomplete. ${blockers.length} issue(s) to fix.`, code: 'FILING_INCOMPLETE', issues: blockers.slice(0, 10) });
        }
        const ITR4Json = require('../services/itr/ITR4JsonBuilder');
        res.setHeader('Content-Disposition', `attachment; filename="ITR4_${filing.taxpayerPan}_AY${filing.assessmentYear}.json"`);
        res.json(ITR4Json.build(filing.jsonPayload || {}, filing.assessmentYear));
    } catch (error) { next(error); }
});

// Mount document import sub-routes
router.use('/', require('./import'));

module.exports = router;
