// ITR Auto-Detector Rules Engine
// Based on LYRA flows.md specification - Step 2: ITR Type Selector & Auto-Detector

class ITRAutoDetector {
  constructor() {
    this.rules = [
      {
        id: 'business_income',
        condition: (data) => data.businessIncome > 0 || data.professionalIncome > 0,
        recommendedITR: 'ITR-3',
        alternativeITR: 'ITR-4', // if presumptive taxation eligible
        reason: 'Business or professional income detected',
        additionalFields: ['businessIncome', 'professionalIncome', 'businessExpenses', 'depreciation'],
        caReviewRequired: true,
        estimatedTime: '45-60 minutes',
      },
      {
        id: 'capital_gains',
        condition: (data) => data.capitalGains > 0,
        recommendedITR: 'ITR-2',
        reason: 'Capital gains from investments or property',
        additionalFields: ['capitalGains', 'capitalGainsDetails', 'indexationDetails'],
        caReviewRequired: false,
        estimatedTime: '30-45 minutes',
      },
      {
        id: 'multiple_properties',
        condition: (data) => data.houseProperties && data.houseProperties.length > 1,
        recommendedITR: 'ITR-2',
        reason: 'More than one house property',
        additionalFields: ['houseProperties'],
        caReviewRequired: false,
        estimatedTime: '25-35 minutes',
      },
      {
        id: 'foreign_income',
        condition: (data) => data.foreignIncome > 0 || data.isNRI || data.dtaaClaim,
        recommendedITR: 'ITR-2',
        reason: 'Foreign income or NRI status or DTAA claim',
        additionalFields: ['foreignIncome', 'dtaaClaim', 'nriStatus'],
        caReviewRequired: true,
        estimatedTime: '60-90 minutes',
      },
      {
        id: 'agricultural_income',
        condition: (data) => data.agriculturalIncome > 100000, // threshold
        recommendedITR: 'ITR-2',
        reason: 'Agricultural income above threshold',
        additionalFields: ['agriculturalIncome'],
        caReviewRequired: false,
        estimatedTime: '20-30 minutes',
      },
      {
        id: 'director_partner',
        condition: (data) => data.isDirector || data.isPartner,
        recommendedITR: 'ITR-2',
        reason: 'Director or partner status',
        additionalFields: ['directorDetails', 'partnerDetails'],
        caReviewRequired: true,
        estimatedTime: '45-60 minutes',
      },
      {
        id: 'itr1_eligible',
        condition: (data) => {
          return (
            data.salary > 0 &&
            data.interestIncome <= 50000 && // bank interest limit
            (!data.capitalGains || data.capitalGains === 0) &&
            (!data.houseProperties || data.houseProperties.length <= 1) &&
            (!data.businessIncome || data.businessIncome === 0) &&
            (!data.professionalIncome || data.professionalIncome === 0) &&
            (!data.foreignIncome || data.foreignIncome === 0) &&
            !data.isNRI &&
            !data.dtaaClaim &&
            !data.isDirector &&
            !data.isPartner
          );
        },
        recommendedITR: 'ITR-1',
        reason: 'Simple salaried individual with basic income sources',
        additionalFields: [],
        caReviewRequired: false,
        estimatedTime: '15-20 minutes',
      },
    ];
  }

  // Main detection method
  detectITR(userData) {
    const results = [];

    // Check each rule
    for (const rule of this.rules) {
      if (rule.condition(userData)) {
        results.push({
          ...rule,
          triggered: true,
          confidence: this.calculateConfidence(rule, userData),
        });
      }
    }

    // Sort by confidence and priority
    results.sort((a, b) => {
      if (a.confidence !== b.confidence) {
        return b.confidence - a.confidence;
      }
      // Priority order: ITR-3 > ITR-2 > ITR-1
      const priority = { 'ITR-3': 3, 'ITR-2': 2, 'ITR-1': 1 };
      return priority[b.recommendedITR] - priority[a.recommendedITR];
    });

    return {
      recommendedITR: results[0]?.recommendedITR || 'ITR-1',
      confidence: results[0]?.confidence || 0.8,
      reason: results[0]?.reason || 'Default recommendation',
      triggeredRules: results,
      allEligibleITRs: this.getAllEligibleITRs(userData),
      switchRequired: this.isSwitchRequired(userData, results[0]?.recommendedITR),
    };
  }

  // Calculate confidence score
  calculateConfidence(rule, userData) {
    let confidence = 0.9; // Base confidence

    // Adjust based on data completeness
    const requiredFields = rule.additionalFields;
    const availableFields = requiredFields.filter(field =>
      userData[field] !== undefined && userData[field] !== null,
    );

    if (requiredFields.length > 0) {
      confidence = Math.min(confidence, 0.7 + (availableFields.length / requiredFields.length) * 0.3);
    }

    // Adjust based on data values
    if (rule.id === 'business_income') {
      if (userData.businessIncome > 1000000) confidence += 0.1;
      if (userData.professionalIncome > 500000) confidence += 0.1;
    }

    if (rule.id === 'capital_gains') {
      if (userData.capitalGains > 100000) confidence += 0.1;
    }

    return Math.min(confidence, 1.0);
  }

  // Get all eligible ITR types
  getAllEligibleITRs(userData) {
    const eligible = [];

    for (const rule of this.rules) {
      if (rule.condition(userData)) {
        if (!eligible.includes(rule.recommendedITR)) {
          eligible.push(rule.recommendedITR);
        }
        if (rule.alternativeITR && !eligible.includes(rule.alternativeITR)) {
          eligible.push(rule.alternativeITR);
        }
      }
    }

    // Always include ITR-1 as fallback
    if (!eligible.includes('ITR-1')) {
      eligible.push('ITR-1');
    }

    return eligible;
  }

  // Check if switch is required
  isSwitchRequired(userData, recommendedITR) {
    // This would be called when user is already in a different ITR flow
    const currentITR = userData.currentITR;
    return currentITR && currentITR !== recommendedITR;
  }

  // Get switch impact analysis
  getSwitchImpact(currentITR, newITR, userData) {
    const currentFields = this.getITRFields(currentITR);
    const newFields = this.getITRFields(newITR);

    const additionalFields = newFields.filter(field => !currentFields.includes(field));
    const removedFields = currentFields.filter(field => !newFields.includes(field));

    return {
      additionalFields,
      removedFields,
      estimatedTimeIncrease: this.estimateTimeIncrease(additionalFields),
      caReviewRequired: this.requiresCAReview(newITR),
      taxImpact: this.estimateTaxImpact(currentITR, newITR, userData),
    };
  }

  // Get fields required for each ITR
  getITRFields(itrType) {
    const fieldMap = {
      'ITR-1': [
        'personalInfo', 'salary', 'interestIncome', 'houseProperty',
        'deductions', 'taxesPaid',
      ],
      'ITR-2': [
        'personalInfo', 'salary', 'interestIncome', 'capitalGains',
        'houseProperties', 'deductions', 'taxesPaid', 'foreignIncome',
      ],
      'ITR-3': [
        'personalInfo', 'salary', 'businessIncome', 'professionalIncome',
        'businessExpenses', 'depreciation', 'houseProperties',
        'deductions', 'taxesPaid',
      ],
      'ITR-4': [
        'personalInfo', 'salary', 'businessIncome', 'presumptiveTax',
        'houseProperties', 'deductions', 'taxesPaid',
      ],
    };

    return fieldMap[itrType] || [];
  }

  // Estimate time increase
  estimateTimeIncrease(additionalFields) {
    const timeMap = {
      'capitalGains': 15,
      'businessIncome': 20,
      'professionalIncome': 20,
      'foreignIncome': 25,
      'houseProperties': 10,
      'businessExpenses': 15,
      'depreciation': 10,
    };

    return additionalFields.reduce((total, field) => {
      return total + (timeMap[field] || 5);
    }, 0);
  }

  // Check if CA review is required
  requiresCAReview(itrType) {
    const caRequiredITRs = ['ITR-3', 'ITR-4'];
    return caRequiredITRs.includes(itrType);
  }

  // Estimate tax impact (simplified)
  estimateTaxImpact(currentITR, newITR, userData) {
    // This would integrate with the tax computation engine
    // For now, return a placeholder
    return {
      estimatedChange: 0,
      reason: 'Tax impact calculation requires detailed computation',
      requiresDetailedAnalysis: true,
    };
  }

  // Validate user data completeness
  validateDataCompleteness(userData, itrType) {
    const requiredFields = this.getITRFields(itrType);
    const missingFields = [];
    const incompleteFields = [];

    for (const field of requiredFields) {
      if (userData[field] === undefined || userData[field] === null) {
        missingFields.push(field);
      } else if (typeof userData[field] === 'object' && Object.keys(userData[field]).length === 0) {
        incompleteFields.push(field);
      }
    }

    return {
      missingFields,
      incompleteFields,
      completenessScore: (requiredFields.length - missingFields.length - incompleteFields.length) / requiredFields.length,
      isComplete: missingFields.length === 0 && incompleteFields.length === 0,
    };
  }

  // Get ITR descriptions for UI
  getITRDescriptions() {
    return {
      'ITR-1': {
        name: 'ITR-1 (Sahaj)',
        description: 'For individuals with salary, pension, one house property, and other income up to ₹50 lakh',
        eligibleFor: [
          'Salaried employees',
          'Pensioners',
          'One house property (self-occupied or let out)',
          'Interest income from savings accounts',
          'Other income up to ₹50 lakh',
        ],
        notEligibleFor: [
          'Business income',
          'Professional income',
          'Capital gains',
          'More than one house property',
          'Foreign income',
        ],
        estimatedTime: '15-20 minutes',
        caRequired: false,
      },
      'ITR-2': {
        name: 'ITR-2',
        description: 'For individuals and HUFs with income from capital gains, more than one house property, or foreign income',
        eligibleFor: [
          'Capital gains from investments',
          'More than one house property',
          'Foreign income',
          'NRI taxpayers',
          'Director or partner income',
        ],
        notEligibleFor: [
          'Business income',
          'Professional income',
        ],
        estimatedTime: '30-45 minutes',
        caRequired: false,
      },
      'ITR-3': {
        name: 'ITR-3',
        description: 'For individuals and HUFs with business or professional income',
        eligibleFor: [
          'Business income',
          'Professional income',
          'Income from proprietary business',
          'Income from profession',
        ],
        notEligibleFor: [
          'Presumptive taxation (use ITR-4 instead)',
        ],
        estimatedTime: '45-60 minutes',
        caRequired: true,
      },
      'ITR-4': {
        name: 'ITR-4 (Sugam)',
        description: 'For individuals and HUFs with presumptive business income',
        eligibleFor: [
          'Presumptive business income',
          'Income from profession (presumptive)',
          'Small businesses',
        ],
        notEligibleFor: [
          'Regular business accounting',
          'Complex business structures',
        ],
        estimatedTime: '30-40 minutes',
        caRequired: true,
      },
    };
  }
}

export default ITRAutoDetector;
