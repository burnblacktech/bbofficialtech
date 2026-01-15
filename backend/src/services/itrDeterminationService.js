/**
 * ITR Determination Service
 * Determines the appropriate ITR form based on user profile and income sources
 */

const enterpriseLogger = require('../utils/logger');
const { sequelize } = require('../config/database');
const ITRDetermination = require('../models/ITRDetermination');

/**
 * ITR Form metadata
 */
const ITR_FORMS = {
    'ITR-1': {
        name: 'Sahaj',
        description: 'For salaried individuals with income up to ₹50 lakhs',
        complexity: 'Low',
        estimatedTime: '15 minutes',
        eligibilityCriteria: [
            'Resident individual',
            'Total income ≤ ₹50 lakhs',
            'Income from salary/pension',
            'One house property (no losses brought forward)',
            'Income from other sources',
        ],
        notEligibleIf: [
            'Director in a company',
            'Unlisted equity shares',
            'Agricultural income > ₹5,000',
            'Business/profession income',
            'Capital gains',
            'Foreign assets/income',
            'More than one house property',
        ],
        benefits: [
            'Simplest form',
            'Fastest processing',
            'E-verification available',
            'No audit required',
        ],
    },
    'ITR-2': {
        name: 'ITR-2',
        description: 'For individuals with capital gains or multiple properties',
        complexity: 'Medium',
        estimatedTime: '30 minutes',
        eligibilityCriteria: [
            'Individuals/HUFs without business income',
            'Income from salary/pension',
            'Multiple house properties',
            'Capital gains (shares, property, etc.)',
            'Foreign assets/income',
        ],
        notEligibleIf: [
            'Business/profession income',
            'Presumptive taxation',
        ],
        benefits: [
            'Handles capital gains',
            'Multiple property support',
            'Foreign income reporting',
        ],
    },
    'ITR-3': {
        name: 'ITR-3',
        description: 'For individuals with business or professional income',
        complexity: 'High',
        estimatedTime: '60+ minutes',
        eligibilityCriteria: [
            'Income from business/profession',
            'Partner in a firm',
            'Can have salary, property, capital gains',
        ],
        notEligibleIf: [
            'Using presumptive taxation (use ITR-4)',
        ],
        benefits: [
            'Complete business reporting',
            'Detailed P&L and Balance Sheet',
            'Depreciation schedules',
        ],
    },
    'ITR-4': {
        name: 'Sugam',
        description: 'For presumptive taxation (business turnover < ₹2 Cr)',
        complexity: 'Low',
        estimatedTime: '20 minutes',
        eligibilityCriteria: [
            'Resident individuals/HUFs/Firms',
            'Total income ≤ ₹50 lakhs',
            'Business income (presumptive - Section 44AD/44ADA)',
            'Business turnover ≤ ₹2 Cr',
            'One house property',
        ],
        notEligibleIf: [
            'Income > ₹50 lakhs',
            'More than one house property',
            'Capital gains',
            'Foreign assets/income',
            'LLP',
        ],
        benefits: [
            'Simplified business reporting',
            'No need for books of accounts',
            'Presumptive income calculation',
        ],
    },
};

/**
 * Determine ITR form based on profile and income sources
 * @param {Object} profile - User profile data
 * @param {Array} incomeSources - Selected income sources
 * @param {Object} additionalInfo - Additional information
 * @returns {Object} Determination result
 */
const determineITR = async (profile, incomeSources, additionalInfo = {}, userId = null, assessmentYear = '2024-25') => {
    try {
        const {
            isResident = true,
            age = 30,
            isDirector = false,
            hasForeignAssets = false,
            totalIncome = 0,
        } = profile;

        const {
            housePropertyCount = 0,
            hasPropertyLosses = false,
            businessTurnover = 0,
            wantsPresumptive = false,
            maintainsBooks = false,
        } = additionalInfo;

        // Check each ITR form eligibility
        const eligibility = {
            'ITR-1': checkITR1Eligibility(profile, incomeSources, additionalInfo),
            'ITR-2': checkITR2Eligibility(profile, incomeSources, additionalInfo),
            'ITR-3': checkITR3Eligibility(profile, incomeSources, additionalInfo),
            'ITR-4': checkITR4Eligibility(profile, incomeSources, additionalInfo),
        };

        // Determine recommended ITR (priority order: ITR-1 > ITR-4 > ITR-2 > ITR-3)
        let recommendedITR = null;
        if (eligibility['ITR-1'].eligible) {
            recommendedITR = 'ITR-1';
        } else if (eligibility['ITR-4'].eligible) {
            recommendedITR = 'ITR-4';
        } else if (eligibility['ITR-2'].eligible) {
            recommendedITR = 'ITR-2';
        } else if (eligibility['ITR-3'].eligible) {
            recommendedITR = 'ITR-3';
        }

        // If no ITR is eligible, default to ITR-2 (most flexible)
        if (!recommendedITR) {
            recommendedITR = 'ITR-2';
            eligibility['ITR-2'].eligible = true;
            eligibility['ITR-2'].reasons.push('Default fallback for complex cases');
        }

        const result = {
            recommendedITR,
            eligibility,
            explanation: getExplanation(recommendedITR, eligibility[recommendedITR]),
            formDetails: ITR_FORMS[recommendedITR],
        };

        // Persist logic if userId is provided
        if (userId) {
            try {
                // Remove existing determination for this AY to avoid clutter (optional, but good for cleanliness)
                // Or just keep history. Let's just create new one for audit trail.
                await ITRDetermination.create({
                    userId,
                    assessmentYear,
                    recommendedForm: recommendedITR,
                    eligibleForms: Object.keys(eligibility).filter(k => eligibility[k].eligible),
                    incomeSources: { list: incomeSources }, // Wrap in object as defined in model
                    residentialStatus: isResident ? 'RESIDENT' : 'NON_RESIDENT',
                    totalIncomeEstimate: totalIncome,
                    determinationLog: result, // Store full logic explanation
                });
            } catch (dbError) {
                // Non-blocking
                enterpriseLogger.error('Failed to persist ITR determination', {
                    userId,
                    error: dbError.message,
                });
            }
        }

        enterpriseLogger.info('ITR determined', {
            recommendedITR,
            incomeSources,
            profile: { isResident, isDirector, hasForeignAssets },
            userId: userId || 'anonymous',
        });

        return result;
    } catch (error) {
        enterpriseLogger.error('ITR determination error', {
            error: error.message,
            stack: error.stack,
        });
        throw error;
    }
};

/**
 * Check ITR-1 eligibility
 */
const checkITR1Eligibility = (profile, incomeSources, additionalInfo) => {
    const reasons = [];
    let eligible = true;

    // Must be resident
    if (!profile.isResident) {
        eligible = false;
        reasons.push('Not a resident of India');
    }

    // Income limit
    if (profile.totalIncome > 5000000) {
        eligible = false;
        reasons.push('Total income exceeds ₹50 lakhs');
    }

    // Cannot be director
    if (profile.isDirector) {
        eligible = false;
        reasons.push('Director in a company');
    }

    // Cannot have foreign assets
    if (profile.hasForeignAssets) {
        eligible = false;
        reasons.push('Has foreign assets or income');
    }

    // Cannot have business income
    if (incomeSources.includes('business')) {
        eligible = false;
        reasons.push('Has business/profession income');
    }

    // Cannot have capital gains
    if (incomeSources.includes('capitalGains')) {
        eligible = false;
        reasons.push('Has capital gains');
    }

    // House property restrictions
    if (additionalInfo.housePropertyCount > 1) {
        eligible = false;
        reasons.push('More than one house property');
    }

    if (additionalInfo.hasPropertyLosses) {
        eligible = false;
        reasons.push('Has property losses brought forward');
    }

    // Add positive reasons if eligible
    if (eligible) {
        if (incomeSources.includes('salary')) {
            reasons.push('Has salary income');
        }
        if (profile.totalIncome <= 5000000) {
            reasons.push('Total income within ₹50 lakh limit');
        }
        reasons.push('Simplest form available');
    }

    return { eligible, reasons };
};

/**
 * Check ITR-2 eligibility
 */
const checkITR2Eligibility = (profile, incomeSources, additionalInfo) => {
    const reasons = [];
    let eligible = true;

    // Cannot have business income (unless using ITR-3)
    if (incomeSources.includes('business')) {
        eligible = false;
        reasons.push('Has business/profession income (use ITR-3 or ITR-4)');
    }

    // Add positive reasons if eligible
    if (eligible) {
        if (incomeSources.includes('capitalGains')) {
            reasons.push('Has capital gains');
        }
        if (additionalInfo.housePropertyCount > 1) {
            reasons.push('Has multiple house properties');
        }
        if (profile.hasForeignAssets) {
            reasons.push('Has foreign assets or income');
        }
        if (profile.isDirector) {
            reasons.push('Director in a company');
        }
        if (!incomeSources.includes('capitalGains') &&
            additionalInfo.housePropertyCount <= 1 &&
            !profile.hasForeignAssets) {
            reasons.push('Flexible form for various income types');
        }
    }

    return { eligible, reasons };
};

/**
 * Check ITR-3 eligibility
 */
const checkITR3Eligibility = (profile, incomeSources, additionalInfo) => {
    const reasons = [];
    let eligible = false;

    // Must have business income
    if (incomeSources.includes('business')) {
        eligible = true;
        reasons.push('Has business/profession income');

        // Check if presumptive is better option
        if (additionalInfo.businessTurnover <= 20000000 &&
            profile.totalIncome <= 5000000 &&
            additionalInfo.wantsPresumptive) {
            reasons.push('Note: ITR-4 (presumptive) may be simpler');
        }

        if (additionalInfo.maintainsBooks) {
            reasons.push('Maintains books of accounts');
        }
    } else {
        reasons.push('No business/profession income');
    }

    return { eligible, reasons };
};

/**
 * Check ITR-4 eligibility
 */
const checkITR4Eligibility = (profile, incomeSources, additionalInfo) => {
    const reasons = [];
    let eligible = true;

    // Must be resident
    if (!profile.isResident) {
        eligible = false;
        reasons.push('Not a resident of India');
    }

    // Income limit
    if (profile.totalIncome > 5000000) {
        eligible = false;
        reasons.push('Total income exceeds ₹50 lakhs');
    }

    // Must have business income
    if (!incomeSources.includes('business')) {
        eligible = false;
        reasons.push('No business/profession income');
    }

    // Business turnover limit
    if (additionalInfo.businessTurnover > 20000000) {
        eligible = false;
        reasons.push('Business turnover exceeds ₹2 Cr');
    }

    // Cannot have capital gains
    if (incomeSources.includes('capitalGains')) {
        eligible = false;
        reasons.push('Has capital gains');
    }

    // Cannot have foreign assets
    if (profile.hasForeignAssets) {
        eligible = false;
        reasons.push('Has foreign assets or income');
    }

    // House property restrictions
    if (additionalInfo.housePropertyCount > 1) {
        eligible = false;
        reasons.push('More than one house property');
    }

    // Must want presumptive taxation
    if (!additionalInfo.wantsPresumptive && eligible) {
        eligible = false;
        reasons.push('Not opting for presumptive taxation');
    }

    // Add positive reasons if eligible
    if (eligible) {
        reasons.push('Eligible for presumptive taxation');
        reasons.push('Simplified business reporting');
        reasons.push('No need for detailed books of accounts');
    }

    return { eligible, reasons };
};

/**
 * Get explanation for recommended ITR
 */
const getExplanation = (itrForm, eligibilityData) => {
    const formData = ITR_FORMS[itrForm];

    return {
        title: `${itrForm} (${formData.name})`,
        description: formData.description,
        benefits: formData.benefits,
        requirements: eligibilityData.reasons.filter(r => !r.startsWith('Note:')),
        notes: eligibilityData.reasons.filter(r => r.startsWith('Note:')),
        complexity: formData.complexity,
        estimatedTime: formData.estimatedTime,
    };
};

/**
 * Get all ITR form details
 */
const getAllITRForms = () => {
    return Object.keys(ITR_FORMS).map(form => ({
        form,
        ...ITR_FORMS[form],
    }));
};

/**
 * Validate ITR eligibility with complete user data
 */
const validateITREligibility = (itrForm, userData) => {
    try {
        const { profile, incomeSources, additionalInfo } = userData;

        let eligibilityCheck;
        switch (itrForm) {
            case 'ITR-1':
                eligibilityCheck = checkITR1Eligibility(profile, incomeSources, additionalInfo);
                break;
            case 'ITR-2':
                eligibilityCheck = checkITR2Eligibility(profile, incomeSources, additionalInfo);
                break;
            case 'ITR-3':
                eligibilityCheck = checkITR3Eligibility(profile, incomeSources, additionalInfo);
                break;
            case 'ITR-4':
                eligibilityCheck = checkITR4Eligibility(profile, incomeSources, additionalInfo);
                break;
            default:
                throw new Error(`Invalid ITR form: ${itrForm}`);
        }

        const violations = eligibilityCheck.eligible ? [] : eligibilityCheck.reasons;
        const warnings = [];

        // Add warnings for edge cases
        if (itrForm === 'ITR-1' && profile.totalIncome > 4000000) {
            warnings.push('Income close to ₹50L limit - consider tax planning');
        }

        return {
            isEligible: eligibilityCheck.eligible,
            violations,
            warnings,
        };
    } catch (error) {
        enterpriseLogger.error('ITR eligibility validation error', {
            error: error.message,
            itrForm,
        });
        throw error;
    }
};

module.exports = {
    determineITR,
    getAllITRForms,
    validateITREligibility,
    ITR_FORMS,
};
