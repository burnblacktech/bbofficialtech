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
const { AppError } = require('../middleware/errorHandler');

/**
 * Create a new ITR filing
 * POST /api/filings
 * @body {string} assessmentYear - e.g., "2024-25"
 * @body {string} taxpayerPan - Required
 */
router.post('/', authenticateToken, async (req, res, next) => {
    try {
        const { assessmentYear, taxpayerPan } = req.body;

        if (!assessmentYear || !taxpayerPan) {
            return res.status(400).json({
                success: false,
                error: 'assessmentYear and taxpayerPan are required',
            });
        }

        // Check if filing already exists for this user, year, and PAN
        const existingFiling = await ITRFiling.findOne({
            where: {
                createdBy: req.user.userId,
                assessmentYear,
                taxpayerPan,
            },
        });

        // If filing exists, return it instead of creating a new one
        if (existingFiling) {
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
            { assessmentYear, taxpayerPan },
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

        // Update fields
        if (jsonPayload !== undefined) {
            filing.jsonPayload = jsonPayload;
        }
        if (lifecycleState !== undefined) {
            filing.lifecycleState = lifecycleState;
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

        res.status(200).json({
            success: true,
            data: {
                identity: {
                    assessmentYear: filing.assessmentYear,
                    taxpayerPan: FinancialStoryService.maskPan(filing.taxpayerPan),
                    itrType: applicability.recommendedITR,
                    eligibleITRs: applicability.eligibleITRs,
                    residencyStatus: filing.isResident ? 'resident' : 'non-resident'
                },
                incomeSummary: FinancialStoryService.extractIncomeSummary(snapshot?.jsonPayload || {}),
                eligibilityBadge: {
                    status: applicability.safeToSubmit ? 'eligible' : 'incomplete',
                    itrType: applicability.recommendedITR,
                    caRequired: applicability.caRequired,
                    message: `${applicability.safeToSubmit ? 'Eligible for' : 'Incomplete for'} ${applicability.recommendedITR}`
                },
                missingBlocks: applicability.missingBlocks
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
        const snapshotFacts = TaxRegimeCalculatorV2._prepareSnapshotFacts(snapshot?.jsonPayload || {});
        const regime = filing.selectedRegime || 'old';

        const result = regime === 'old'
            ? TaxRegimeAssembly.computeOldRegime(snapshotFacts)
            : TaxRegimeAssembly.computeNewRegime(snapshotFacts);

        const tdsDeducted = FinancialStoryService.extractTDS(snapshot?.jsonPayload || {});

        res.status(200).json({
            success: true,
            data: {
                regime,
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
                        refundOrPayable: tdsDeducted - result.finalTaxLiability,
                        isRefund: tdsDeducted > result.finalTaxLiability
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

module.exports = router;
