/**
 * ITR Type Detection & Management
 * Smart auto-detection of ITR type based on income sources
 */

export const ITR_TYPES = {
    ITR1: {
        code: '1',
        name: 'ITR-1 (Sahaj)',
        description: 'For salaried individuals with income up to ₹50 lakhs',
        maxIncome: 5000000,
        allowedSources: ['salary', 'houseProperty', 'interestIncome', 'dividendIncome', 'otherIncome'],
        restrictions: {
            housePropertyCount: 1,
            noCapitalGains: true,
            noBusinessIncome: true,
            noForeignIncome: true,
            agriculturalIncomeLimit: 5000,
        },
    },
    ITR2: {
        code: '2',
        name: 'ITR-2',
        description: 'For individuals/HUFs not having business income',
        allowedSources: ['salary', 'houseProperty', 'capitalGains', 'interestIncome', 'dividendIncome', 'otherIncome', 'agriculturalIncome', 'foreignIncome'],
        restrictions: {
            noBusinessIncome: true,
        },
    },
    ITR3: {
        code: '3',
        name: 'ITR-3',
        description: 'For individuals/HUFs with business/professional income',
        allowedSources: ['salary', 'houseProperty', 'capitalGains', 'businessIncome', 'professionalIncome', 'interestIncome', 'dividendIncome', 'otherIncome', 'agriculturalIncome', 'foreignIncome'],
        restrictions: {},
    },
    ITR4: {
        code: '4',
        name: 'ITR-4 (Sugam)',
        description: 'For presumptive business/professional income',
        allowedSources: ['salary', 'houseProperty', 'presumptiveBusinessIncome', 'presumptiveProfessionalIncome', 'interestIncome', 'otherIncome'],
        restrictions: {
            noCapitalGains: true,
            noForeignIncome: true,
            presumptiveOnly: true,
        },
    },
};

/**
 * Detect appropriate ITR type based on filing data
 */
export const detectITRType = (filingData) => {
    const { income = {}, totalIncome = 0 } = filingData;

    // Check for presumptive income (ITR-4)
    if (income.presumptiveBusiness?.total > 0 || income.presumptiveProfessional?.total > 0) {
        return {
            type: 'ITR4',
            code: '4',
            reason: 'Presumptive business/professional income',
            confidence: 'high',
        };
    }

    // Check for business/professional income (ITR-3)
    if (income.business?.total > 0 || income.professional?.total > 0) {
        return {
            type: 'ITR3',
            code: '3',
            reason: 'Business or professional income',
            confidence: 'high',
        };
    }

    // Check for ITR-2 disqualifiers
    const itr2Triggers = [];

    if (income.capitalGains?.total > 0) {
        itr2Triggers.push('Capital gains income');
    }

    if (income.houseProperty?.properties?.length > 1) {
        itr2Triggers.push('Multiple house properties');
    }

    if (income.foreign?.total > 0) {
        itr2Triggers.push('Foreign income');
    }

    if ((income.agricultural?.total || 0) > 5000) {
        itr2Triggers.push('Agricultural income > ₹5,000');
    }

    if (totalIncome > 5000000) {
        itr2Triggers.push('Total income > ₹50 lakhs');
    }

    if (income.lottery?.total > 0 || income.gambling?.total > 0) {
        itr2Triggers.push('Lottery/gambling income');
    }

    if (itr2Triggers.length > 0) {
        return {
            type: 'ITR2',
            code: '2',
            reason: itr2Triggers.join(', '),
            confidence: 'high',
        };
    }

    // Eligible for ITR-1
    return {
        type: 'ITR1',
        code: '1',
        reason: 'Simple salary income with one house property',
        confidence: 'high',
    };
};

/**
 * Check if adding a new income source will change ITR type
 */
export const willITRTypeChange = (currentITRType, newIncomeSource, currentFilingData) => {
    // Simulate adding the new income source
    const simulatedData = {
        ...currentFilingData,
        income: {
            ...currentFilingData.income,
            [newIncomeSource]: { total: 1 }, // Dummy value to trigger detection
        },
    };

    const newDetection = detectITRType(simulatedData);

    return {
        willChange: newDetection.code !== currentITRType,
        newITRType: newDetection.code,
        reason: newDetection.reason,
    };
};

/**
 * Get human-readable reason for ITR type change
 */
export const getITRChangeReason = (incomeSource) => {
    const reasons = {
        capitalGains: 'ITR-1 does not support capital gains. You need ITR-2 to report gains from equity, mutual funds, or property sales.',
        business: 'ITR-1 and ITR-2 do not support business income. You need ITR-3 for business or professional income.',
        professional: 'ITR-1 and ITR-2 do not support professional income. You need ITR-3 for business or professional income.',
        foreign: 'ITR-1 does not support foreign income. You need ITR-2 to report income from foreign sources.',
        agricultural: 'ITR-1 does not support agricultural income above ₹5,000. You need ITR-2 for higher agricultural income.',
        presumptiveBusiness: 'You can use ITR-4 (Sugam) for presumptive business income, which is simpler than ITR-3.',
        presumptiveProfessional: 'You can use ITR-4 (Sugam) for presumptive professional income, which is simpler than ITR-3.',
    };

    return reasons[incomeSource] || 'This income source requires a different ITR form.';
};

/**
 * Get available income sources for an ITR type
 */
export const getAvailableIncomeSources = (itrType) => {
    const itrConfig = ITR_TYPES[`ITR${itrType}`];
    return itrConfig ? itrConfig.allowedSources : [];
};

/**
 * Check if an income source is available for an ITR type
 */
export const isIncomeSourceAvailable = (itrType, incomeSource) => {
    const availableSources = getAvailableIncomeSources(itrType);
    return availableSources.includes(incomeSource);
};

/**
 * Migrate data when ITR type changes
 */
export const migrateDataBetweenITRTypes = (data, fromITR, toITR) => {
    const migrated = JSON.parse(JSON.stringify(data)); // Deep clone

    // ITR-2/3/4 → ITR-1: Remove incompatible data
    if (toITR === '1') {
        delete migrated.income.capitalGains;
        delete migrated.income.foreign;
        delete migrated.income.business;
        delete migrated.income.professional;
        delete migrated.income.presumptiveBusiness;
        delete migrated.income.presumptiveProfessional;

        // Keep only first house property
        if (migrated.income.houseProperty?.properties?.length > 1) {
            migrated.income.houseProperty.properties = [migrated.income.houseProperty.properties[0]];
        }

        // Remove agricultural income if > ₹5,000
        if ((migrated.income.agricultural?.total || 0) > 5000) {
            delete migrated.income.agricultural;
        }
    }

    // ITR-3/4 → ITR-2: Remove business income
    if (toITR === '2') {
        delete migrated.income.business;
        delete migrated.income.professional;
        delete migrated.income.presumptiveBusiness;
        delete migrated.income.presumptiveProfessional;
    }

    // ITR-1/2 → ITR-4: Remove incompatible sources
    if (toITR === '4') {
        delete migrated.income.capitalGains;
        delete migrated.income.foreign;
        delete migrated.income.business;
        delete migrated.income.professional;
    }

    return migrated;
};

/**
 * Get ITR type description
 */
export const getITRDescription = (itrType) => {
    const itrConfig = ITR_TYPES[`ITR${itrType}`];
    return itrConfig ? itrConfig.description : '';
};

/**
 * Get ITR type name
 */
export const getITRName = (itrType) => {
    const itrConfig = ITR_TYPES[`ITR${itrType}`];
    return itrConfig ? itrConfig.name : `ITR-${itrType}`;
};

export default {
    detectITRType,
    willITRTypeChange,
    getITRChangeReason,
    getAvailableIncomeSources,
    isIncomeSourceAvailable,
    migrateDataBetweenITRTypes,
    getITRDescription,
    getITRName,
    ITR_TYPES,
};
