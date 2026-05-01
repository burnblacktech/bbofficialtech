/**
 * filings.js
 * S12 Phase 8 - Minimal Filing Orchestrator Routes
 * Canonical filing CRUD endpoints
 */

const express = require('express');
const router = express.Router();
const FilingService = require('../services/core/FilingService');
const { authenticateToken } = require('../middleware/auth');
const { ITRFiling, IncomeEntry, ExpenseEntry, InvestmentEntry, AuditEvent } = require('../models');
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
const paymentGateMiddleware = require('../middleware/paymentGate');
const deepMerge = require('../utils/deepMerge');
const computationCache = require('../services/itr/ComputationCache');
const { ComputationCache } = require('../services/itr/ComputationCache');
const enterpriseLogger = require('../utils/logger');

/**
 * mapTrackedDataToPayload
 * Pure function: maps tracked IncomeEntry, ExpenseEntry, InvestmentEntry records
 * into a jsonPayload fragment suitable for merging into a filing.
 * No side effects — testable in isolation.
 */
function mapTrackedDataToPayload(incomeEntries, expenseEntries, investmentEntries) {
  const payload = {};

  // Salary: aggregate salary-type income entries into employers array
  const salaryEntries = incomeEntries.filter(e => e.sourceType === 'salary');
  if (salaryEntries.length > 0) {
    const totalSalary = salaryEntries.reduce((s, e) => s + parseFloat(e.amount || 0), 0);
    payload.income = payload.income || {};
    payload.income.salary = {
      employers: [{
        name: 'From Tracked Data',
        grossSalary: totalSalary,
        tdsDeducted: 0,
        _source: 'tracked',
      }],
    };
  }

  // Other income: map interest/dividend entries
  const interestEntries = incomeEntries.filter(e => e.sourceType === 'interest');
  const dividendEntries = incomeEntries.filter(e => e.sourceType === 'dividend');
  if (interestEntries.length > 0 || dividendEntries.length > 0) {
    payload.income = payload.income || {};
    payload.income.otherSources = {
      savingsInterest: interestEntries.reduce((s, e) => s + parseFloat(e.amount || 0), 0),
      dividendIncome: dividendEntries.reduce((s, e) => s + parseFloat(e.amount || 0), 0),
    };
  }

  // Deductions: map expenses with deductionSection + investments
  const deductions = {};
  for (const exp of expenseEntries) {
    if (!exp.deductionSection) continue;
    if (exp.deductionSection === '80D') {
      deductions.healthSelf = (deductions.healthSelf || 0) + parseFloat(exp.amount || 0);
    }
    // Additional mappings for other deduction sections
    if (exp.deductionSection === '80G') {
      deductions.donations80G = (deductions.donations80G || 0) + parseFloat(exp.amount || 0);
    }
    if (exp.deductionSection === '80E') {
      deductions.educationLoan80E = (deductions.educationLoan80E || 0) + parseFloat(exp.amount || 0);
    }
  }

  const investmentFieldMap = {
    ppf: 'ppf',
    elss: 'elss',
    lic: 'lic',
    nps: 'nps',
    sukanya: 'sukanya',
    tax_fd: 'taxFd',
    ulip: 'ulip',
    other_80c: 'other80c',
    '80ccd_1b_nps': 'nps',
  };

  for (const inv of investmentEntries) {
    const field = investmentFieldMap[inv.investmentType];
    if (field) {
      deductions[field] = (deductions[field] || 0) + parseFloat(inv.amount || 0);
    }
  }

  if (Object.keys(deductions).length > 0) {
    payload.deductions = deductions;
  }

  return payload;
}

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
 * Supports txnOffset and txnLimit query params for capital gains pagination
 */
router.get('/:id', authenticateToken, async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        const filing = await FilingService.getFiling(id, userId);

        // Task 9.4: Paginate capitalGains.transactions if > 100 entries
        const txnOffset = parseInt(req.query.txnOffset) || 0;
        const txnLimit = parseInt(req.query.txnLimit) || 0;
        const transactions = filing.jsonPayload?.income?.capitalGains?.transactions;
        if (Array.isArray(transactions) && transactions.length > 100 && (txnOffset > 0 || txnLimit > 0)) {
            const limit = txnLimit > 0 ? txnLimit : 100;
            const paginatedTxns = transactions.slice(txnOffset, txnOffset + limit);
            // Return paginated view with metadata
            filing.jsonPayload = {
                ...filing.jsonPayload,
                income: {
                    ...filing.jsonPayload.income,
                    capitalGains: {
                        ...filing.jsonPayload.income.capitalGains,
                        transactions: paginatedTxns,
                        _pagination: {
                            total: transactions.length,
                            offset: txnOffset,
                            limit,
                            hasMore: txnOffset + limit < transactions.length,
                        },
                    },
                },
            };
        }

        res.status(200).json({
            success: true,
            data: filing,
        });

    } catch (error) {
        next(error);
    }
});

/**
 * Get paginated snapshots for a filing
 * GET /api/filings/:id/snapshots
 * Query params: page (default 1), limit (default 20)
 */
router.get('/:id/snapshots', authenticateToken, async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
        const offset = (page - 1) * limit;

        // Verify filing exists and user owns it
        const filing = await ITRFiling.findByPk(id);
        if (!filing) throw new AppError('Filing not found', 404);
        if (filing.createdBy !== userId) throw new AppError('Not authorized', 403);

        const FilingSnapshot = require('../models/FilingSnapshot');
        const { count, rows } = await FilingSnapshot.findAndCountAll({
            where: { filingId: id },
            order: [['version', 'DESC']],
            limit,
            offset,
        });

        res.status(200).json({
            success: true,
            data: rows,
            pagination: {
                page,
                limit,
                total: count,
                totalPages: Math.ceil(count / limit),
            },
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
 * Derive the correct ITR type from a filing's merged payload.
 * Checks both actual income data AND selected sources (_selectedSources).
 * Priority: Business (ITR-3) > Presumptive (ITR-4) > Capital Gains/Foreign (ITR-2) > Default (ITR-1)
 */
function deriveITRType(payload) {
    const income = payload?.income || {};
    const sources = payload?._selectedSources || [];

    const hasBusiness = (income.business?.businesses || []).length > 0 || sources.includes('business');
    const hasPresumptive = (income.presumptive?.entries || []).length > 0;
    const hasCapitalGains = (income.capitalGains?.transactions || []).length > 0 || sources.includes('capital_gains');
    const hasForeignIncome = (income.foreignIncome?.incomes || []).length > 0 || sources.includes('foreign');

    if (hasBusiness) {
        // If presumptive entries exist but no full business data, it's ITR-4
        if (hasPresumptive && !(income.business?.businesses || []).length) return 'ITR-4';
        return 'ITR-3';
    }
    if (hasPresumptive) return 'ITR-4';
    if (hasCapitalGains || hasForeignIncome) return 'ITR-2';
    return 'ITR-1';
}

/**
 * Update filing
 * PUT /api/filings/:id
 * Body size limit: 2MB (route-level override)
 */
router.put('/:id', express.json({ limit: '2mb' }), authenticateToken, async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        const { jsonPayload, lifecycleState, selectedRegime, version } = req.body;

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

        // Optimistic locking — mandatory to prevent silent overwrites
        if (version === undefined || version === null) {
            return res.status(400).json({
                success: false,
                error: 'version field is required to prevent concurrent update conflicts',
                code: 'VERSION_REQUIRED',
                currentVersion: filing.version,
            });
        }
        if (version !== filing.version) {
            return res.status(409).json({
                success: false,
                error: 'Filing was modified by another request. Please reload and try again.',
                code: 'VERSION_CONFLICT',
                currentVersion: filing.version,
            });
        }

        // Pre-merge size guard — reject before expensive merge if combined size is clearly too large
        let mergedPayload = filing.jsonPayload;
        if (jsonPayload !== undefined) {
            const patchSize = JSON.stringify(jsonPayload).length;
            const existingSize = JSON.stringify(filing.jsonPayload || {}).length;
            if (patchSize + existingSize > 2097152) { // 2MB combined = definitely over 1MB merged
                return res.status(413).json({ success: false, code: 'PAYLOAD_TOO_LARGE', error: 'Filing data too large' });
            }
            mergedPayload = deepMerge(filing.jsonPayload || {}, jsonPayload);
        }

        // Task 9.3: Reject payloads > 1MB after merge
        if (jsonPayload !== undefined) {
            const payloadSize = JSON.stringify(mergedPayload).length;
            if (payloadSize > 1048576) { // 1MB = 1024 * 1024
                return res.status(413).json({
                    success: false,
                    code: 'PAYLOAD_TOO_LARGE',
                    error: 'Filing data too large',
                    maxSize: '1MB',
                });
            }
        }

        // Payload validation (Task 3.2) — relaxed: log warnings but don't block saves
        // Real validation happens at submission time via ITRApplicabilityService
        const { validatePayload } = require('../validators/payloadValidator');
        const validationResult = validatePayload(mergedPayload);
        if (validationResult.error) {
            enterpriseLogger.warn('Payload validation warning (non-blocking)', {
                filingId: id,
                errors: validationResult.error.details?.map(d => d.message).slice(0, 5),
            });
        }

        // Task 9.2: Warn about inapplicable sections for current ITR type
        const warnings = [];
        const itrType = filing.itrType || 'ITR-1';
        const incomeData = mergedPayload.income || {};

        const ITR_APPLICABLE_SECTIONS = {
            'ITR-1': ['salary', 'houseProperty', 'otherSources'],
            'ITR-2': ['salary', 'houseProperty', 'otherSources', 'capitalGains', 'foreignIncome'],
            'ITR-3': ['salary', 'houseProperty', 'otherSources', 'capitalGains', 'foreignIncome', 'business'],
            'ITR-4': ['salary', 'houseProperty', 'otherSources', 'presumptive'],
        };
        const applicable = ITR_APPLICABLE_SECTIONS[itrType] || ITR_APPLICABLE_SECTIONS['ITR-1'];
        const sectionChecks = {
            salary: () => incomeData.salary?.employers?.length > 0,
            houseProperty: () => incomeData.houseProperty?.type && !['NONE', 'none'].includes(incomeData.houseProperty.type),
            otherSources: () => !!(incomeData.otherSources && Object.values(incomeData.otherSources).some(v => Number(v) > 0)),
            capitalGains: () => incomeData.capitalGains?.transactions?.length > 0,
            foreignIncome: () => incomeData.foreignIncome?.incomes?.length > 0,
            business: () => incomeData.business?.businesses?.length > 0,
            presumptive: () => incomeData.presumptive?.entries?.length > 0,
        };
        for (const [section, hasData] of Object.entries(sectionChecks)) {
            if (!applicable.includes(section) && hasData()) {
                warnings.push(`Section "${section}" contains data but is not applicable to ${itrType}. It will be ignored during computation.`);
            }
        }

        // ── ITR Type Auto-Switch ──
        // Re-evaluate ITR type based on merged payload income signals
        let itrTypeChanged = false;
        let newItrType = null;
        if (jsonPayload !== undefined) {
            const derived = deriveITRType(mergedPayload);
            if (derived && derived !== filing.itrType) {
                filing.itrType = derived;
                itrTypeChanged = true;
                newItrType = derived;
            }
        }

        // Persist
        if (jsonPayload !== undefined) {
            filing.jsonPayload = mergedPayload;
        }
        if (selectedRegime !== undefined) {
            filing.selectedRegime = selectedRegime;
        }

        // Increment version if optimistic lock was used
        if (version !== undefined) {
            filing.version = filing.version + 1;
        }

        await filing.save();

        // Invalidate computation cache for this filing on payload change
        if (jsonPayload !== undefined) {
            computationCache.invalidate(id);
        }

        res.status(200).json({
            success: true,
            data: filing,
            ...(warnings.length > 0 && { warnings }),
            ...(itrTypeChanged && { itrTypeChanged: true, newItrType }),
        });

    } catch (error) {
        next(error);
    }
});

/**
 * Delete a filing (soft-delete)
 * DELETE /api/filings/:id
 * Allowed states: draft, eri_failed
 */
router.delete('/:id', authenticateToken, async (req, res, next) => {
    try {
        const filing = await ITRFiling.findByPk(req.params.id);

        // Ownership check — return 404 (not 403) to prevent information leakage
        if (!filing || filing.createdBy !== req.user.userId) {
            throw new AppError('Filing not found', 404, 'FILING_NOT_FOUND');
        }

        const DELETABLE_STATES = [STATES.DRAFT, STATES.ERI_FAILED];
        if (!DELETABLE_STATES.includes(filing.lifecycleState)) {
            throw new AppError(
                `Filing cannot be deleted in state "${filing.lifecycleState}". Allowed states: ${DELETABLE_STATES.join(', ')}`,
                403,
                'FILING_NOT_DELETABLE',
            );
        }

        // Soft-delete instead of hard-delete
        filing.deletedAt = new Date();
        await filing.save();

        // Audit logging (fire-and-forget)
        AuditEvent.logEvent({
            entityType: 'ITRFiling',
            entityId: filing.id,
            eventType: 'FILING_DELETED_BY_USER',
            actorId: req.user.userId,
            actorRole: req.user.role || 'END_USER',
            metadata: { lifecycleState: filing.lifecycleState },
        }).catch(() => {});

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
router.post('/:filingId/submit', authenticateToken, paymentGateMiddleware, async (req, res, next) => {
    try {
        const { filingId } = req.params;
        const { sequelize } = require('../config/database');

        // Use row-level lock to prevent concurrent submit race condition
        const filing = await sequelize.transaction(async (t) => {
            const f = await ITRFiling.findByPk(filingId, { lock: t.LOCK.UPDATE, transaction: t });
            if (!f) throw new AppError('Filing not found', 404);
            if (f.createdBy !== req.user.userId) throw new AppError('Not authorized to submit this filing', 403);
            if (f.lifecycleState !== STATES.DRAFT) {
                throw new AppError(`Cannot submit filing in ${f.lifecycleState} state`, 400, 'INVALID_STATE');
            }
            return f;
        });

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

        // filing.save() is handled inside transition() within a DB transaction

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
 * Computation PDF Download
 * GET /api/filings/:filingId/computation-pdf
 * Generates and returns ITD-style tax computation sheet as PDF
 */
router.get('/:filingId/computation-pdf', authenticateToken, async (req, res, next) => {
    try {
        const filing = await ITRFiling.findByPk(req.params.filingId);
        if (!filing) throw new AppError('Filing not found', 404);
        if (filing.createdBy !== req.user.userId) throw new AppError('Not authorized', 403);

        // Compute tax for the filing
        const itrType = filing.itrType || 'ITR-1';
        const computeMap = { 'ITR-1': 'ITR1ComputationService', 'ITR-2': 'ITR2ComputationService', 'ITR-3': 'ITR3ComputationService', 'ITR-4': 'ITR4ComputationService' };
        const ServiceName = computeMap[itrType] || 'ITR1ComputationService';
        const ComputeService = require(`../services/itr/${ServiceName}`);
        const computation = ComputeService.compute(filing.jsonPayload || {});

        const ComputationPDFService = require('../services/itr/ComputationPDFService');
        const pdfData = ComputationPDFService.assemblePDFData(filing, computation);
        const pdfBuffer = await ComputationPDFService.generatePDF(pdfData);
        const filename = ComputationPDFService.getFilename(filing.taxpayerPan, filing.assessmentYear);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', pdfBuffer.length);
        res.send(pdfBuffer);
    } catch (error) { next(error); }
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

        // Check computation cache
        const payload = filing.jsonPayload || {};
        const payloadHash = ComputationCache.hashPayload(payload);
        const cached = computationCache.get(filingId, payloadHash);
        if (cached) {
            return res.status(200).json({ success: true, data: cached });
        }

        const ITR1ComputationService = require('../services/itr/ITR1ComputationService');
        const computation = ITR1ComputationService.compute(payload);

        // Save computation result on filing + update taxLiability/refundAmount
        const recommended = computation.recommended || 'new';
        const bestRegime = computation[recommended === 'old' ? 'oldRegime' : 'newRegime'];
        const netPayable = bestRegime?.netPayable || 0;
        await filing.update({
          taxComputation: computation,
          taxLiability: netPayable > 0 ? netPayable : 0,
          refundAmount: netPayable < 0 ? Math.abs(netPayable) : 0,
        });

        // Store in cache
        computationCache.set(filingId, payloadHash, computation);

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
        if (filing.itrType && filing.itrType !== 'ITR-1') throw new AppError(`This filing is ${filing.itrType}, not ITR-1`, 400, 'ITR_TYPE_MISMATCH');

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

        const filename = `ITR1_${filing.taxpayerPan.replace(/^.{5}/, "XXXXX")}_AY${filing.assessmentYear}.json`;
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

        const payload = filing.jsonPayload || {};
        const payloadHash = ComputationCache.hashPayload(payload);
        const cached = computationCache.get(req.params.filingId, payloadHash);
        if (cached) return res.json({ success: true, data: cached });

        const ITR2ComputationService = require('../services/itr/ITR2ComputationService');
        const computation = ITR2ComputationService.compute(payload);
        const rec2 = computation.recommended || 'new';
        const best2 = computation[rec2 === 'old' ? 'oldRegime' : 'newRegime'];
        const net2 = best2?.netPayable || 0;
        await filing.update({ taxComputation: computation, taxLiability: net2 > 0 ? net2 : 0, refundAmount: net2 < 0 ? Math.abs(net2) : 0 });
        computationCache.set(req.params.filingId, payloadHash, computation);
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
        if (filing.itrType && filing.itrType !== 'ITR-2') throw new AppError(`This filing is ${filing.itrType}, not ITR-2`, 400, 'ITR_TYPE_MISMATCH');

        const validation = FilingCompletenessService.validate(filing);
        const blockers = (validation.errors || []).filter(e => e.severity === 'blocker' || !e.severity);
        if (blockers.length > 0) {
            return res.status(422).json({ success: false, error: `Filing incomplete. ${blockers.length} issue(s) to fix.`, code: 'FILING_INCOMPLETE', issues: blockers.slice(0, 10) });
        }

        const ITR2JsonBuilder = require('../services/itr/ITR2JsonBuilder');
        const json = ITR2JsonBuilder.build(filing.jsonPayload || {}, filing.assessmentYear);
        res.setHeader('Content-Disposition', `attachment; filename="ITR2_${filing.taxpayerPan.replace(/^.{5}/, "XXXXX")}_AY${filing.assessmentYear}.json"`);
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

        const payload = filing.jsonPayload || {};
        const payloadHash = ComputationCache.hashPayload(payload);
        const cached = computationCache.get(req.params.filingId, payloadHash);
        if (cached) return res.json({ success: true, data: cached });

        const ITR3 = require('../services/itr/ITR3ComputationService');
        const computation = ITR3.compute(payload);
        const rec3 = computation.recommended || 'new';
        const best3 = computation[rec3 === 'old' ? 'oldRegime' : 'newRegime'];
        const net3 = best3?.netPayable || 0;
        await filing.update({ taxComputation: computation, taxLiability: net3 > 0 ? net3 : 0, refundAmount: net3 < 0 ? Math.abs(net3) : 0 });
        computationCache.set(req.params.filingId, payloadHash, computation);
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
        if (filing.itrType && filing.itrType !== 'ITR-3') throw new AppError(`This filing is ${filing.itrType}, not ITR-3`, 400, 'ITR_TYPE_MISMATCH');
        const validation = FilingCompletenessService.validate(filing);
        const blockers = (validation.errors || []).filter(e => e.severity === 'blocker' || !e.severity);
        if (blockers.length > 0) {
            return res.status(422).json({ success: false, error: `Filing incomplete. ${blockers.length} issue(s) to fix.`, code: 'FILING_INCOMPLETE', issues: blockers.slice(0, 10) });
        }
        const ITR3Json = require('../services/itr/ITR3JsonBuilder');
        res.setHeader('Content-Disposition', `attachment; filename="ITR3_${filing.taxpayerPan.replace(/^.{5}/, "XXXXX")}_AY${filing.assessmentYear}.json"`);
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

        const payload = filing.jsonPayload || {};
        const payloadHash = ComputationCache.hashPayload(payload);
        const cached = computationCache.get(req.params.filingId, payloadHash);
        if (cached) return res.json({ success: true, data: cached });

        const ITR4 = require('../services/itr/ITR4ComputationService');
        const computation = ITR4.compute(payload);
        const rec4 = computation.recommended || 'new';
        const best4 = computation[rec4 === 'old' ? 'oldRegime' : 'newRegime'];
        const net4 = best4?.netPayable || 0;
        await filing.update({ taxComputation: computation, taxLiability: net4 > 0 ? net4 : 0, refundAmount: net4 < 0 ? Math.abs(net4) : 0 });
        computationCache.set(req.params.filingId, payloadHash, computation);
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
        if (filing.itrType && filing.itrType !== 'ITR-4') throw new AppError(`This filing is ${filing.itrType}, not ITR-4`, 400, 'ITR_TYPE_MISMATCH');
        const validation = FilingCompletenessService.validate(filing);
        const blockers = (validation.errors || []).filter(e => e.severity === 'blocker' || !e.severity);
        if (blockers.length > 0) {
            return res.status(422).json({ success: false, error: `Filing incomplete. ${blockers.length} issue(s) to fix.`, code: 'FILING_INCOMPLETE', issues: blockers.slice(0, 10) });
        }
        const ITR4Json = require('../services/itr/ITR4JsonBuilder');
        res.setHeader('Content-Disposition', `attachment; filename="ITR4_${filing.taxpayerPan.replace(/^.{5}/, "XXXXX")}_AY${filing.assessmentYear}.json"`);
        res.json(ITR4Json.build(filing.jsonPayload || {}, filing.assessmentYear));
    } catch (error) { next(error); }
});

/**
 * Pre-fill filing from tracked finance data
 * POST /api/filings/:filingId/prefill-from-tracked
 * Maps IncomeEntry, ExpenseEntry, InvestmentEntry for the filing's FY
 * into the filing's jsonPayload via mapTrackedDataToPayload.
 */
router.post('/:filingId/prefill-from-tracked', authenticateToken, async (req, res, next) => {
    try {
        const { filingId } = req.params;
        const userId = req.user.userId;

        // 1. Verify filing exists
        const filing = await ITRFiling.findByPk(filingId);
        if (!filing) {
            throw new AppError('Filing not found', 404, 'FILING_NOT_FOUND');
        }

        // 2. Verify ownership
        if (filing.createdBy !== userId) {
            throw new AppError('Not authorized to update this filing', 403, 'NOT_AUTHORIZED');
        }

        // 3. Verify draft state
        if (filing.lifecycleState !== 'draft') {
            throw new AppError(
                `Filing is frozen in state: ${filing.lifecycleState}. Pre-fill only works on draft filings.`,
                403,
                'FILING_FROZEN'
            );
        }

        // 4. Read tracked entries for the filing's financialYear and userId
        const fy = filing.financialYear;
        const [incomeEntries, expenseEntries, investmentEntries] = await Promise.all([
            IncomeEntry.findAll({ where: { userId, financialYear: fy } }),
            ExpenseEntry.findAll({ where: { userId, financialYear: fy } }),
            InvestmentEntry.findAll({ where: { userId, financialYear: fy } }),
        ]);

        // 5. Map tracked data to payload fragment
        const prefillPayload = mapTrackedDataToPayload(incomeEntries, expenseEntries, investmentEntries);

        // 6. Merge into existing jsonPayload using deepMerge
        const existingPayload = filing.jsonPayload || {};
        const mergedPayload = deepMerge(existingPayload, prefillPayload);

        await filing.update({ jsonPayload: mergedPayload });

        // 7a. Mark tracked entries as used in this filing (Gap fix #4)
        const entryIds = {
          income: incomeEntries.map(e => e.id),
          expense: expenseEntries.filter(e => e.deductionSection).map(e => e.id),
          investment: investmentEntries.map(e => e.id),
        };
        if (entryIds.income.length > 0) {
          await IncomeEntry.update({ usedInFilingId: filingId }, { where: { id: entryIds.income } });
        }
        if (entryIds.expense.length > 0) {
          await ExpenseEntry.update({ usedInFilingId: filingId }, { where: { id: entryIds.expense } });
        }
        if (entryIds.investment.length > 0) {
          await InvestmentEntry.update({ usedInFilingId: filingId }, { where: { id: entryIds.investment } });
        }

        // 7b. Compute prefill summary
        const incomeTotal = incomeEntries.reduce((s, e) => s + parseFloat(e.amount || 0), 0);
        const deductionsTotal = expenseEntries
            .filter(e => e.deductionSection)
            .reduce((s, e) => s + parseFloat(e.amount || 0), 0);
        const investmentsTotal = investmentEntries.reduce((s, e) => s + parseFloat(e.amount || 0), 0);
        const entriesMapped = incomeEntries.length + expenseEntries.filter(e => e.deductionSection).length + investmentEntries.length;

        res.status(200).json({
            success: true,
            data: {
                id: filing.id,
                jsonPayload: mergedPayload,
                prefillSummary: {
                    incomeTotal,
                    deductionsTotal,
                    investmentsTotal,
                    entriesMapped,
                },
            },
        });
    } catch (error) {
        next(error);
    }
});

// =====================================================
// AUTO-FILL ENDPOINTS (Requirement 1)
// =====================================================

const { AutoFillService } = require('../services/import/AutoFillService');

/**
 * Trigger auto-fill pipeline
 * POST /api/filings/:id/auto-fill
 * Fetches 26AS + AIS via SurePass, maps to filing payload, detects conflicts.
 * Requirements: 1.1, 1.5, 1.6, 1.7
 */
router.post('/:id/auto-fill', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Load filing
    const filing = await ITRFiling.findByPk(id);
    if (!filing) {
      throw new AppError('Filing not found', 404, 'RESOURCE_NOT_FOUND');
    }

    // Ownership check
    if (filing.createdBy !== userId) {
      throw new AppError('Not authorized to auto-fill this filing', 403, 'FORBIDDEN');
    }

    // Draft state check
    if (filing.lifecycleState !== STATES.DRAFT) {
      throw new AppError(
        'Cannot auto-fill a submitted filing. Only draft filings can be auto-filled.',
        400,
        'FILING_NOT_EDITABLE',
      );
    }

    // Delegate to AutoFillService — it handles PAN check, SurePass session,
    // 26AS/AIS fetch, mapping, and conflict detection internally.
    // Throws PAN_NOT_VERIFIED (400), ITR_SESSION_EXPIRED (401),
    // or SUREPASS_SERVICE_UNAVAILABLE (503) on failure.
    const result = await AutoFillService.autoFill(id, userId);

    res.status(200).json({
      success: true,
      data: {
        mappedPayload: result.mappedPayload,
        conflicts: result.conflicts,
        summary: result.summary,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Resolve auto-fill conflicts
 * POST /api/filings/:id/auto-fill/resolve
 * Applies user-chosen resolutions to the filing's jsonPayload.
 * Requirements: 1.7
 */
router.post('/:id/auto-fill/resolve', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const { resolutions } = req.body;

    // Validate request body
    if (!Array.isArray(resolutions) || resolutions.length === 0) {
      throw new AppError(
        'resolutions must be a non-empty array of { field, keepValue }',
        400,
        'INVALID_RESOLUTION',
      );
    }

    // Validate each resolution entry
    for (const r of resolutions) {
      if (!r.field || !['existing', 'new'].includes(r.keepValue)) {
        throw new AppError(
          `Invalid resolution: each entry must have a "field" string and "keepValue" of "existing" or "new"`,
          400,
          'INVALID_RESOLUTION',
        );
      }
    }

    // Load filing
    const filing = await ITRFiling.findByPk(id);
    if (!filing) {
      throw new AppError('Filing not found', 404, 'RESOURCE_NOT_FOUND');
    }

    // Ownership check
    if (filing.createdBy !== userId) {
      throw new AppError('Not authorized to update this filing', 403, 'FORBIDDEN');
    }

    // Draft state check
    if (filing.lifecycleState !== STATES.DRAFT) {
      throw new AppError(
        'Cannot resolve conflicts on a submitted filing.',
        400,
        'FILING_NOT_EDITABLE',
      );
    }

    // Read auto-fill metadata to get the last mapped payload
    const autoFillMeta = filing.jsonPayload?._autoFill || {};
    const existingPayload = filing.jsonPayload || {};

    // Apply resolutions: for 'new', set the field from the mapped payload;
    // for 'existing', leave the current value (no-op).
    const updatedPayload = { ...existingPayload };

    for (const { field, keepValue } of resolutions) {
      if (keepValue === 'new') {
        // Set the new value at the dot-notation path
        _setNestedValue(updatedPayload, field, _getNestedValue(autoFillMeta.lastMappedPayload || {}, field));
      }
      // 'existing' → keep current value, nothing to do
    }

    // Record resolved conflicts in metadata
    updatedPayload._autoFill = {
      ...autoFillMeta,
      conflicts: [
        ...(autoFillMeta.conflicts || []),
        ...resolutions.map(r => ({ field: r.field, resolution: r.keepValue, resolvedAt: new Date().toISOString() })),
      ],
    };

    await filing.update({ jsonPayload: updatedPayload });

    res.status(200).json({
      success: true,
      data: { updatedPayload },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Set a value at a dot-notation path in a nested object.
 * Creates intermediate objects as needed.
 * @param {object} obj - Target object
 * @param {string} path - Dot-notation path (e.g. 'income.salary.employers[0].grossSalary')
 * @param {*} value - Value to set
 */
function _setNestedValue(obj, path, value) {
  const parts = path.replace(/\[(\d+)\]/g, '.$1').split('.');
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];
    const nextKey = parts[i + 1];
    if (current[key] === undefined || current[key] === null) {
      current[key] = /^\d+$/.test(nextKey) ? [] : {};
    }
    current = current[key];
  }
  current[parts[parts.length - 1]] = value;
}

/**
 * Get a value at a dot-notation path from a nested object.
 * @param {object} obj - Source object
 * @param {string} path - Dot-notation path
 * @returns {*} Value at path, or undefined
 */
function _getNestedValue(obj, path) {
  const parts = path.replace(/\[(\d+)\]/g, '.$1').split('.');
  let current = obj;
  for (const part of parts) {
    if (current === undefined || current === null) return undefined;
    current = current[part];
  }
  return current;
}

// Mount document import sub-routes
router.use('/', require('./import'));

module.exports = router;
module.exports.mapTrackedDataToPayload = mapTrackedDataToPayload;
