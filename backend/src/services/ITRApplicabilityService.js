// =====================================================
// ITR APPLICABILITY SERVICE (S22)
// Read-only service to determine ITR eligibility and completeness
// Pure derivation - no DB writes, no state mutations
// =====================================================

const ITR_FACT_CONTRACT = require('../domain/ITR_FACT_CONTRACT');
const FactPresenceResolver = require('../utils/FactPresenceResolver');
const enterpriseLogger = require('../utils/logger');

/**
 * S22: ITR Applicability & Completeness Rules
 * 
 * Determines:
 * - Which ITR types are eligible
 * - Which ITR types are disqualified (and why)
 * - What mandatory fact blocks are missing
 * - Whether CA review is required
 * - Whether submission is safe
 * 
 * Constitutional guarantees:
 * - Pure function (no side effects)
 * - No DB writes
 * - No state mutations
 * - Deterministic output
 * - Safe to run at any time
 */
class ITRApplicabilityService {
    /**
     * Evaluate ITR applicability for a filing
     * @param {ITRFiling} filing - Filing to evaluate
     * @returns {Object} Applicability result
     */
    static evaluate(filing) {
        enterpriseLogger.debug('Evaluating ITR applicability', {
            filingId: filing.id,
            assessmentYear: filing.assessmentYear
        });

        const payload = filing.jsonPayload || {};
        const eligibleITRs = [];
        const ineligibleITRs = {};
        const allMissingBlocks = [];

        // Evaluate each ITR type
        for (const [itrType, contract] of Object.entries(ITR_FACT_CONTRACT)) {
            const evaluation = this._evaluateITR(itrType, contract, filing, payload);

            if (evaluation.eligible) {
                eligibleITRs.push(itrType);

                // Track missing blocks even for eligible ITRs
                if (evaluation.missing && evaluation.missing.length > 0) {
                    allMissingBlocks.push(...evaluation.missing);
                }
            } else {
                ineligibleITRs[itrType] = evaluation.reason;
            }
        }

        // Derive CA requirement and submission safety
        const caRequired = this._determineCArequirement(eligibleITRs);
        const missingBlocks = [...new Set(allMissingBlocks)]; // Remove duplicates
        const safeToSubmit = eligibleITRs.length > 0 && missingBlocks.length === 0;
        const recommendedITR = this._recommendITR(eligibleITRs);

        const result = {
            eligibleITRs,
            ineligibleITRs,
            missingBlocks,
            safeToSubmit,
            caRequired,
            recommendedITR
        };

        enterpriseLogger.debug('ITR applicability evaluated', {
            filingId: filing.id,
            eligibleITRs,
            safeToSubmit,
            caRequired,
            missingCount: missingBlocks.length
        });

        return result;
    }

    /**
     * Evaluate single ITR type
     * @private
     */
    static _evaluateITR(itrType, contract, filing, payload) {
        // Step 1: Check forbidden facts
        const forbiddenPaths = contract.forbids || [];
        const forbiddenPath = FactPresenceResolver.getFirstForbiddenPath(payload, forbiddenPaths);

        if (forbiddenPath) {
            return {
                eligible: false,
                reason: `Contains forbidden fact: ${forbiddenPath}`,
                missing: []
            };
        }

        // Step 2: Check conditions
        if (contract.conditions) {
            // Resident condition
            if (contract.conditions.resident !== undefined) {
                // S22: Derive residency from jsonPayload.personalInfo
                const isResident = payload.personalInfo?.isResident !== false;
                if (contract.conditions.resident && !isResident) {
                    return {
                        eligible: false,
                        reason: 'Not a resident individual',
                        missing: []
                    };
                }
            }

            // Max income condition
            if (contract.conditions.maxIncome !== undefined) {
                // S22: Derive total income from taxComputation cache or payload
                const totalIncome = filing.taxLiability !== null ?
                    (filing.taxComputation?.summary?.totalIncome || 0) :
                    (payload.income?.summary?.totalIncome || 0);

                if (totalIncome > contract.conditions.maxIncome) {
                    return {
                        eligible: false,
                        reason: `Total income ₹${totalIncome} exceeds limit of ₹${contract.conditions.maxIncome}`,
                        missing: []
                    };
                }
            }

            // Max turnover condition (for ITR-4)
            if (contract.conditions.maxTurnover !== undefined) {
                // S22: Derive turnover from presumptive income payload
                const turnover = payload.income?.presumptive?.totalTurnover || 0;
                if (turnover > contract.conditions.maxTurnover) {
                    return {
                        eligible: false,
                        reason: `Turnover ₹${turnover} exceeds limit of ₹${contract.conditions.maxTurnover}`,
                        missing: []
                    };
                }
            }
        }

        // Step 2.5: Check primary fact (Intent-based filtering)
        // If an ITR has a primary income fact requirement and it's missing, it's not eligible
        if (contract.primaryFact) {
            const hasPrimaryFact = FactPresenceResolver.hasFactPath(payload, contract.primaryFact);
            if (!hasPrimaryFact) {
                return {
                    eligible: false,
                    reason: `Does not contain primary income fact: ${contract.primaryFact}`,
                    missing: []
                };
            }
        }

        // Step 3: Check required facts
        const requiredPaths = contract.requires || [];
        const missing = FactPresenceResolver.getMissingPaths(payload, requiredPaths);

        return {
            eligible: true,
            reason: null,
            missing
        };
    }

    /**
     * Determine CA requirement based on eligible ITRs
     * @private
     */
    static _determineCArequirement(eligibleITRs) {
        if (eligibleITRs.length === 0) {
            return 'not_applicable';
        }

        // ITR-3 or ITR-4 → CA mandatory
        if (eligibleITRs.includes('ITR3') || eligibleITRs.includes('ITR4')) {
            return 'mandatory';
        }

        // ITR-1 or ITR-2 only → CA optional
        if (eligibleITRs.includes('ITR1') || eligibleITRs.includes('ITR2')) {
            return 'optional';
        }

        return 'not_applicable';
    }

    /**
     * Recommend best ITR type
     * @private
     */
    static _recommendITR(eligibleITRs) {
        if (eligibleITRs.length === 0) {
            return null;
        }

        // Prefer simpler ITRs
        const preferenceOrder = ['ITR1', 'ITR4', 'ITR2', 'ITR3'];

        for (const itr of preferenceOrder) {
            if (eligibleITRs.includes(itr)) {
                return itr;
            }
        }

        return eligibleITRs[0];
    }

    /**
     * Get human-readable explanation of applicability result
     * @param {Object} result - Result from evaluate()
     * @returns {string} Human-readable explanation
     */
    static explainResult(result) {
        if (result.safeToSubmit) {
            return `Filing is complete and eligible for ${result.recommendedITR}. CA review is ${result.caRequired}.`;
        }

        if (result.eligibleITRs.length === 0) {
            return 'Filing is not eligible for any ITR type. Please review income sources and conditions.';
        }

        const missingCount = result.missingBlocks.length;
        return `Filing is eligible for ${result.eligibleITRs.join(', ')} but missing ${missingCount} required fact block(s): ${result.missingBlocks.join(', ')}`;
    }
}

module.exports = ITRApplicabilityService;
