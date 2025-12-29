const validationEngine = require('../core/ValidationEngine');
const taxAuditChecker = require('./TaxAuditChecker');
const domainCore = require('../../domain/ITRDomainCore');
const { getCurrentDomainState } = require('../../middleware/domainGuard');
const { QueryTypes } = require('sequelize');
const { query: dbQuery } = require('../../utils/dbQuery');

/**
 * Service to handle all ITR validation logic
 * Extracted from ITRController
 */
class ITRValidationService {
    constructor() {
        this.validationEngine = validationEngine;
    }

    /**
     * Normalize ITR type for validation engine (lowercase)
     */
    _normalizeItrTypeForValidation(itrType) {
        if (!itrType) return null;
        return itrType.replace(/[-_]/g, '').toLowerCase();
    }

    /**
     * Internal helper to fetch draft data if not provided
     */
    async _getDraftData(draftId, userId) {
        const getDraftQuery = `
      SELECT d.id, d.data, f.itr_type, f.status, f.id as filing_id
      FROM itr_drafts d
      JOIN itr_filings f ON d.filing_id = f.id
      WHERE d.id = $1 AND f.user_id = $2
    `;
        const draft = await dbQuery(getDraftQuery, [draftId, userId]);
        if (draft.rows.length === 0) return null;

        const row = draft.rows[0];
        const formData = row.data ? (typeof row.data === 'string' ? JSON.parse(row.data) : row.data) : {};
        return {
            formData,
            itrType: row.itr_type,
            filingId: row.filing_id,
            status: row.status
        };
    }

    /**
     * Validate a draft
     * @param {string} draftId 
     * @param {string} userId 
     * @param {object} actor - { role, permissions }
     */
    async validateDraft(draftId, userId, actor = { role: 'END_USER', permissions: [] }) {
        const draftInfo = await this._getDraftData(draftId, userId);
        if (!draftInfo) {
            throw new Error('Draft not found');
        }

        const { formData, itrType, filingId } = draftInfo;

        // Domain Gate Check
        const currentState = await getCurrentDomainState(filingId);
        const allowedActions = domainCore.getAllowedActions(currentState, actor);

        if (!allowedActions.includes('validate_data')) {
            const error = new Error('Validation not allowed in current state');
            error.statusCode = 403;
            error.details = { state: currentState, allowedActions };
            throw error;
        }

        return this.validatePayload(formData, itrType);
    }

    /**
     * Core validation logic for a payload (used by draft validation and submission)
     * @param {object} formData 
     * @param {string} itrType 
     */
    validatePayload(formData, itrType) {
        const normItrType = this._normalizeItrTypeForValidation(itrType);

        // 1. Schema/General Validation
        const validation = this.validationEngine.validateAll(formData, normItrType);

        // 2. ITR Specific Validation
        const itrSpecificValidation = this.validationEngine.validateITRSpecific(itrType, formData);

        const allValid = validation.isValid && itrSpecificValidation.isValid;
        const allErrors = [...validation.errors, ...itrSpecificValidation.errors];
        const allWarnings = [...validation.warnings, ...itrSpecificValidation.warnings];

        return {
            isValid: allValid,
            errors: allErrors,
            warnings: allWarnings,
            details: {
                general: validation,
                itrSpecific: itrSpecificValidation,
            },
        };
    }

    /**
     * Advanced business rule validation (Audit, Balance Sheet, Presumptive Limits)
     * Typically run during submission
     * @param {object} formData 
     * @param {string} itrType 
     */
    validateBusinessRules(formData, itrType) {
        const errors = [];

        // ITR-3 specific validations
        if (domainCore.isSectionApplicable(itrType, 'auditInfo') || domainCore.isSectionApplicable(itrType, 'balanceSheet')) {
            // Audit Applicability
            const auditCheck = taxAuditChecker.checkAuditApplicability(formData);
            if (auditCheck.applicable) {
                const auditValidation = taxAuditChecker.validateAuditReport(formData.auditInfo);
                if (!auditValidation.isValid) {
                    // merge audit reasons
                    Object.assign(errors, ...Object.values(auditValidation.errors).map(e => ({ message: e })));
                    // Keeping consistent format is tricky without seein usage.
                    // pushing standardized error objects
                    Object.entries(auditValidation.errors).forEach(([key, msg]) => {
                        errors.push({ field: `auditInfo.${key}`, message: msg });
                    });
                }
            }

            // Balance Sheet Check
            if (formData.balanceSheet?.hasBalanceSheet) {
                const assetsTotal = parseFloat(formData.balanceSheet.assets?.total || 0);
                const liabilitiesTotal = parseFloat(formData.balanceSheet.liabilities?.total || 0);
                if (Math.abs(assetsTotal - liabilitiesTotal) > 0.01) {
                    errors.push({
                        field: 'balanceSheet',
                        message: 'Balance sheet is not balanced',
                        details: { assetsTotal, liabilitiesTotal, diff: Math.abs(assetsTotal - liabilitiesTotal) }
                    });
                }
            }
        }

        // ITR-4 specific validations (Presumptive)
        if (domainCore.isSectionApplicable(itrType, 'presumptiveIncome')) {
            const businessIncome = parseFloat(formData.income?.businessIncome || formData.income?.presumptiveBusiness || 0);
            const professionalIncome = parseFloat(formData.income?.professionalIncome || formData.income?.presumptiveProfessional || 0);

            // Validate presumptive limits
            if (businessIncome > 2000000) {
                errors.push({
                    field: 'businessIncome',
                    message: 'ITR-4 business income cannot exceed ₹20 lakh. Please use ITR-3 for higher business income.'
                });
            }

            if (professionalIncome > 500000) {
                errors.push({
                    field: 'professionalIncome',
                    message: 'ITR-4 professional income cannot exceed ₹5 lakh. Please use ITR-3 for higher professional income.'
                });
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

module.exports = new ITRValidationService();
