// =====================================================
// FILING SAFETY SERVICE (S17)
// Psychological safety and submission confidence
// =====================================================

const { ITRFiling } = require('../../models');
const ITRApplicabilityService = require('../ITRApplicabilityService');
const enterpriseLogger = require('../../utils/logger');
const { AppError } = require('../../middleware/errorHandler');

const TaxRegimeCalculatorV2 = require('./TaxRegimeCalculatorV2');

class FilingSafetyService {
    /**
     * Get overall safety status for filing
     * @param {string} filingId - Filing ID
     * @returns {Promise<object>}
     */
    async getSafetyStatus(filingId) {
        try {
            const filing = await ITRFiling.findByPk(filingId);
            if (!filing) {
                throw new AppError('Filing not found', 404);
            }

            const payload = filing.jsonPayload || {};
            const selectedRegime = filing.selectedRegime || 'old';

            // Calculate liability using the selected regime
            const comparison = TaxRegimeCalculatorV2.compareRegimes(payload, filing.assessmentYear);
            const result = selectedRegime === 'new' ? comparison.newRegime : comparison.oldRegime;
            const finalTaxLiability = result.finalTaxLiability;

            const totalTaxesPaid = this.calculateTotalTaxesPaid(payload);
            const netPayable = finalTaxLiability - totalTaxesPaid;

            const blockers = this.detectBlockers(payload, netPayable);
            const warnings = this.detectWarnings(payload);
            const completion = this.calculateCompletion(payload);

            // S22: ITR Applicability & Completeness
            const itrApplicability = ITRApplicabilityService.evaluate(filing);

            return {
                safeToSubmit: blockers.length === 0 && itrApplicability.safeToSubmit,
                blockers,
                warnings,
                completionPercentage: completion,
                filingId,
                assessmentYear: filing.assessmentYear,
                // S22: Legal completeness information
                itr: {
                    eligibleITRs: itrApplicability.eligibleITRs,
                    ineligibleITRs: itrApplicability.ineligibleITRs,
                    recommendedITR: itrApplicability.recommendedITR,
                    missingBlocks: itrApplicability.missingBlocks,
                    caRequired: itrApplicability.caRequired,
                    safeToSubmit: itrApplicability.safeToSubmit
                }
            };
        } catch (error) {
            enterpriseLogger.error('Get safety status failed', {
                filingId,
                error: error.message,
            });
            throw error;
        }
    }

    /**
     * Detect blocking issues that prevent submission
     * @param {object} payload - Filing jsonPayload
     * @param {number} netPayable - Net tax payable (Liability - Paid)
     * @returns {Array}
     */
    detectBlockers(payload, netPayable = 0) {
        const blockers = [];

        // Check for at least one income source
        const hasIncome =
            (payload.income?.salary?.employers?.length > 0) ||
            (payload.income?.capitalGains?.intent?.declared === true) ||
            (payload.income?.houseProperty?.intent === true) || // Added HP
            (payload.income?.other);

        if (!hasIncome) {
            blockers.push({
                code: 'NO_INCOME',
                message: 'No income source declared. Please add salary, capital gains, or other income.',
                severity: 'blocker',
                section: 'income'
            });
        }

        // S27: Tax Payment Hard Gate
        if (netPayable > 0) {
            const selfAssessmentPaid = this._calculateSectionTotal(payload.taxes?.selfAssessment);

            // If there's still a gap after self-assessment entries
            if (netPayable > selfAssessmentPaid) {
                blockers.push({
                    code: 'TAX_PAYMENT_PENDING',
                    message: `You have a pending tax liability of ₹${Math.round(netPayable - selfAssessmentPaid)}. This must be paid before submission.`,
                    severity: 'blocker',
                    section: 'taxPayment'
                });
            }
        }

        return blockers;
    }

    /**
     * Detect warnings (non-blocking but recommended)
     * @param {object} payload - Filing jsonPayload
     * @returns {Array}
     */
    detectWarnings(payload) {
        const warnings = [];

        // Warn if no deductions claimed
        if (!payload.deductions || Object.keys(payload.deductions).length === 0) {
            warnings.push({
                code: 'NO_DEDUCTIONS',
                message: 'No deductions claimed. You may be eligible for 80C, 80D, or other deductions.',
                severity: 'warning',
                section: 'deductions'
            });
        }

        // Warn if capital gains intent not captured
        if (!payload.income?.capitalGains?.intent) {
            warnings.push({
                code: 'CG_INTENT_MISSING',
                message: 'Capital gains intent not captured. Please indicate if you have capital gains.',
                severity: 'warning',
                section: 'capitalGains'
            });
        }

        return warnings;
    }

    /**
     * Calculate completion percentage
     * @param {object} payload - Filing jsonPayload
     * @returns {number} - Percentage (0-100)
     */
    calculateCompletion(payload) {
        const sections = [
            { name: 'salary', completed: !!payload.income?.salary?.employers?.length },
            { name: 'capitalGains', completed: !!payload.income?.capitalGains?.intent },
            { name: 'otherIncome', completed: !!payload.income?.other },
            { name: 'deductions', completed: !!payload.deductions && Object.keys(payload.deductions).length > 0 },
            { name: 'bankDetails', completed: !!payload.bankDetails },
        ];

        const completedCount = sections.filter(s => s.completed).length;
        return Math.round((completedCount / sections.length) * 100);
    }

    /**
     * Get error protections active for this filing
     * @param {string} filingId - Filing ID
     * @returns {Promise<object>}
     */
    async getErrorProtections(filingId) {
        try {
            const filing = await ITRFiling.findByPk(filingId);
            if (!filing) {
                throw new AppError('Filing not found', 404);
            }

            const protections = [
                {
                    name: 'PAN Validation',
                    description: 'PAN format verified at filing creation',
                    active: true
                },
                {
                    name: 'Lifecycle State Machine',
                    description: 'Only authorized transitions allowed',
                    active: true
                },
                {
                    name: 'Data Validation',
                    description: 'All inputs validated before storage',
                    active: true
                },
                {
                    name: 'Draft Auto-Save',
                    description: 'Changes saved automatically, no data loss',
                    active: true
                }
            ];

            return {
                protections,
                totalProtections: protections.length,
                activeProtections: protections.filter(p => p.active).length
            };
        } catch (error) {
            enterpriseLogger.error('Get error protections failed', {
                filingId,
                error: error.message,
            });
            throw error;
        }
    }

    /**
     * Get contextual exit message
     * @param {string} context - Exit context (e.g., 'incomplete', 'complete', 'error')
     * @returns {object}
     */
    getExitMessage(context = 'default') {
        const messages = {
            incomplete: {
                title: 'Your progress is saved',
                message: 'You can return anytime to complete your filing. All your data is securely stored.',
                action: 'Return to Dashboard',
                tone: 'reassuring'
            },
            complete: {
                title: 'Ready to submit',
                message: 'Your filing is complete and ready for submission. Review one last time before submitting.',
                action: 'Review & Submit',
                tone: 'confident'
            },
            error: {
                title: 'Something went wrong',
                message: 'Don\'t worry, your data is safe. Please try again or contact support.',
                action: 'Try Again',
                tone: 'supportive'
            },
            default: {
                title: 'See you soon',
                message: 'Your filing is saved. Come back anytime to continue.',
                action: 'Close',
                tone: 'neutral'
            }
        };

        return messages[context] || messages.default;
    }

    /**
     * Calculate total taxes paid from payload
     * @param {object} payload 
     * @returns {number}
     */
    calculateTotalTaxesPaid(payload) {
        const taxes = payload?.taxes || {};

        const tdsTotal = this._calculateSectionTotal(taxes.tds);
        const advanceTaxTotal = this._calculateSectionTotal(taxes.advanceTax);
        const selfAssessmentTotal = this._calculateSectionTotal(taxes.selfAssessment);

        // Also check salary-specific TDS if not mirrored in taxes.tds
        const salaryTds = (payload.income?.salary?.employers || [])
            .reduce((sum, emp) => sum + (parseFloat(emp.tds || 0)), 0);

        return Math.max(tdsTotal, salaryTds) + advanceTaxTotal + selfAssessmentTotal;
    }

    /**
     * Helper to sum amount in an array of objects
     * @private
     */
    _calculateSectionTotal(entries) {
        if (!entries || !Array.isArray(entries)) return 0;
        return entries.reduce((sum, entry) => sum + (parseFloat(entry.amount || 0)), 0);
    }
}

module.exports = new FilingSafetyService();
