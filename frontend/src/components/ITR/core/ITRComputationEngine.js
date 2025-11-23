// =====================================================
// UNIFIED ITR COMPUTATION ENGINE
// Single tax calculation system for all ITR types
// FY 2024-25 tax computation rules
// =====================================================

class ITRComputationEngine {
  constructor() {
    this.taxSlabs = {
      '2024-25': {
        individual: [
          { min: 0, max: 250000, rate: 0, cess: 0 },
          { min: 250001, max: 500000, rate: 5, cess: 4 },
          { min: 500001, max: 750000, rate: 10, cess: 4 },
          { min: 750001, max: 1000000, rate: 15, cess: 4 },
          { min: 1000001, max: 1250000, rate: 20, cess: 4 },
          { min: 1250001, max: 1500000, rate: 25, cess: 4 },
          { min: 1500001, max: Infinity, rate: 30, cess: 4 }
        ],
        seniorCitizen: [
          { min: 0, max: 300000, rate: 0, cess: 0 },
          { min: 300001, max: 500000, rate: 5, cess: 4 },
          { min: 500001, max: 750000, rate: 10, cess: 4 },
          { min: 750001, max: 1000000, rate: 15, cess: 4 },
          { min: 1000001, max: 1250000, rate: 20, cess: 4 },
          { min: 1250001, max: 1500000, rate: 25, cess: 4 },
          { min: 1500001, max: Infinity, rate: 30, cess: 4 }
        ],
        superSeniorCitizen: [
          { min: 0, max: 500000, rate: 0, cess: 0 },
          { min: 500001, max: 750000, rate: 5, cess: 4 },
          { min: 750001, max: 1000000, rate: 10, cess: 4 },
          { min: 1000001, max: 1250000, rate: 15, cess: 4 },
          { min: 1250001, max: 1500000, rate: 20, cess: 4 },
          { min: 1500001, max: Infinity, rate: 30, cess: 4 }
        ]
      }
    };

    this.rebate87A = {
      maxIncome: 500000,
      rebate: 12500
    };
  }

  computeTax(formData, assessmentYear = '2024-25') {
    const computation = {
      assessmentYear,
      currency: 'INR',
      computationDate: new Date().toISOString(),
      grossTotalIncome: 0,
      deductions: {},
      taxableIncome: 0,
      taxOnIncome: 0,
      educationCess: 0,
      totalTaxLiability: 0,
      taxesPaid: {},
      balanceTax: 0,
      rebate: {},
      refundOrPayable: 0,
      breakdown: {}
    };

    try {
      // Step 1: Calculate Gross Total Income
      computation.grossTotalIncome = this.calculateGrossTotalIncome(formData);
      computation.breakdown.grossIncome = this.getIncomeBreakdown(formData);

      // Step 2: Calculate Deductions
      computation.deductions = this.calculateDeductions(formData);
      computation.breakdown.deductions = this.getDeductionBreakdown(formData);

      // Step 3: Calculate Taxable Income
      computation.taxableIncome = Math.max(0, computation.grossTotalIncome - computation.deductions.total);

      // Step 4: Calculate Tax on Income
      const age = this.calculateAge(formData.personal_info?.dob);
      const taxResult = this.calculateTaxSlab(computation.taxableIncome, age);
      computation.taxOnIncome = taxResult.tax;
      computation.breakdown.taxSlab = taxResult.breakdown;

      // Step 5: Calculate Education Cess
      computation.educationCess = Math.round(computation.taxOnIncome * 0.04); // 4% education + health cess

      // Step 6: Total Tax Liability
      computation.totalTaxLiability = computation.taxOnIncome + computation.educationCess;

      // Step 7: Calculate Rebate under Section 87A
      computation.rebate = this.calculateRebate87A(computation.totalTaxLiability, computation.taxableIncome);

      // Step 8: Calculate Final Tax Liability
      const finalTaxLiability = Math.max(0, computation.totalTaxLiability - computation.rebate.amount);

      // Step 9: Taxes Paid
      computation.taxesPaid = this.getTaxesPaid(formData);

      // Step 10: Balance Tax (Payable or Refundable)
      computation.balanceTax = finalTaxLiability - computation.taxesPaid.total;

      // Step 11: Determine Refund or Payable
      computation.refundOrPayable = computation.balanceTax;
      computation.breakdown.final = {
        finalTaxLiability,
        taxesPaid: computation.taxesPaid.total,
        balanceTax: computation.balanceTax
      };

    } catch (error) {
      console.error('Tax computation error:', error);
      computation.error = error.message;
    }

    return computation;
  }

  calculateGrossTotalIncome(formData) {
    let total = 0;
    const income = formData.income || {};

    // Salary Income
    total += parseFloat(income.gross_salary || 0);
    total += parseFloat(income.perquisites || 0);
    total += parseFloat(income.profits_in_lieu_of_salary || 0);

    // House Property Income
    if (income.has_house_property) {
      const rentalIncome = parseFloat(income.annual_rental_income || 0);
      const municipalTaxes = parseFloat(income.municipal_taxes || 0);
      const interestOnLoan = parseFloat(income.interest_on_loan || 0);
      const standardDeduction = rentalIncome * 0.3; // 30% standard deduction

      total += Math.max(0, rentalIncome - municipalTaxes - standardDeduction - interestOnLoan);
    }

    // Other Income
    total += parseFloat(income.interest_income || 0);
    total += parseFloat(income.dividend_income || 0);
    total += parseFloat(income.capital_gains || 0);
    total += parseFloat(income.other_sources || 0);

    return Math.round(total);
  }

  calculateDeductions(formData) {
    const deductions = formData.deductions || {};
    const total = parseFloat(deductions.section_80c || 0) +
                  parseFloat(deductions.section_80d || 0) +
                  parseFloat(deductions.section_80e || 0) +
                  parseFloat(deductions.section_80g || 0) +
                  parseFloat(deductions.other_deductions || 0);

    return {
      section_80c: parseFloat(deductions.section_80c || 0),
      section_80d: parseFloat(deductions.section_80d || 0),
      section_80e: parseFloat(deductions.section_80e || 0),
      section_80g: parseFloat(deductions.section_80g || 0),
      other_deductions: parseFloat(deductions.other_deductions || 0),
      total: Math.round(total)
    };
  }

  calculateTaxSlab(taxableIncome, age) {
    if (taxableIncome <= 0) {
      return { tax: 0, breakdown: [] };
    }

    let slab = this.taxSlabs['2024-25'].individual;
    if (age >= 80) {
      slab = this.taxSlabs['2024-25'].superSeniorCitizen;
    } else if (age >= 60) {
      slab = this.taxSlabs['2024-25'].seniorCitizen;
    }

    let remainingIncome = taxableIncome;
    let totalTax = 0;
    const breakdown = [];

    for (const slabItem of slab) {
      if (remainingIncome <= 0) break;

      const slabMax = Math.min(slabItem.max, remainingIncome);
      const slabMin = slabItem.min;
      const taxableAmount = slabMax - slabMin;

      if (taxableAmount > 0) {
        const slabTax = Math.round(taxableAmount * (slabItem.rate / 100));
        totalTax += slabTax;

        breakdown.push({
          slab: `₹${slabMin.toLocaleString('en-IN')} - ₹${slabItem.max === Infinity ? '∞' : slabItem.max.toLocaleString('en-IN')}`,
          rate: `${slabItem.rate}%`,
          taxableAmount: slabMax - slabMin,
          tax: slabTax
        });
      }

      remainingIncome -= taxableAmount;
    }

    return { tax: totalTax, breakdown };
  }

  calculateRebate87A(totalTax, taxableIncome) {
    let rebateAmount = 0;

    if (taxableIncome <= this.rebate87A.maxIncome) {
      rebateAmount = Math.min(this.rebate87A.rebate, totalTax);
    }

    return {
      section: '87A',
      amount: rebateAmount,
      applicable: taxableIncome <= this.rebate87A.maxIncome
    };
  }

  getTaxesPaid(formData) {
    const taxes = formData.taxes_paid || {};

    const advanceTax = parseFloat(taxes.advance_tax || 0);
    const tdsTcs = parseFloat(taxes.tds_tcs || 0);
    const selfAssessmentTax = parseFloat(taxes.self_assessment_tax || 0);

    return {
      advanceTax,
      tdsTcs,
      selfAssessmentTax,
      total: advanceTax + tdsTcs + selfAssessmentTax
    };
  }

  getIncomeBreakdown(formData) {
    const income = formData.income || {};

    return {
      salary: {
        gross_salary: parseFloat(income.gross_salary || 0),
        perquisites: parseFloat(income.perquisites || 0),
        profits_in_lieu_of_salary: parseFloat(income.profits_in_lieu_of_salary || 0),
        total: parseFloat(income.gross_salary || 0) +
               parseFloat(income.perquisites || 0) +
               parseFloat(income.profits_in_lieu_of_salary || 0)
      },
      houseProperty: income.has_house_property ? {
        rentalIncome: parseFloat(income.annual_rental_income || 0),
        deductions: parseFloat(income.municipal_taxes || 0) +
                    parseFloat(income.interest_on_loan || 0) +
                    (parseFloat(income.annual_rental_income || 0) * 0.3),
        net: this.calculateNetHousePropertyIncome(income)
      } : { total: 0 },
      other: {
        interest_income: parseFloat(income.interest_income || 0),
        dividend_income: parseFloat(income.dividend_income || 0),
        capital_gains: parseFloat(income.capital_gains || 0),
        other_sources: parseFloat(income.other_sources || 0),
        total: parseFloat(income.interest_income || 0) +
                parseFloat(income.dividend_income || 0) +
                parseFloat(income.capital_gains || 0) +
                parseFloat(income.other_sources || 0)
      }
    };
  }

  calculateNetHousePropertyIncome(income) {
    const rentalIncome = parseFloat(income.annual_rental_income || 0);
    const municipalTaxes = parseFloat(income.municipal_taxes || 0);
    const interestOnLoan = parseFloat(income.interest_on_loan || 0);
    const standardDeduction = rentalIncome * 0.3;

    return Math.max(0, rentalIncome - municipalTaxes - standardDeduction - interestOnLoan);
  }

  getDeductionBreakdown(formData) {
    const deductions = formData.deductions || {};

    return {
      section_80c: {
        description: 'Investment in PPF, EPF, Life Insurance, etc.',
        amount: parseFloat(deductions.section_80c || 0),
        maxLimit: 150000
      },
      section_80d: {
        description: 'Health Insurance Premium',
        amount: parseFloat(deductions.section_80d || 0),
        maxLimit: 25000
      },
      section_80e: {
        description: 'Education Loan Interest',
        amount: parseFloat(deductions.section_80e || 0),
        maxLimit: 150000
      },
      section_80g: {
        description: 'Donations to Approved Institutions',
        amount: parseFloat(deductions.section_80g || 0)
      },
      other_deductions: {
        description: 'Other Deductions',
        amount: parseFloat(deductions.other_deductions || 0)
      }
    };
  }

  calculateAge(dateOfBirth) {
    if (!dateOfBirth) return 0;

    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  }

  // Generate tax saving suggestions
  generateTaxSavingSuggestions(formData) {
    const suggestions = [];
    const income = this.calculateGrossTotalIncome(formData);
    const deductions = this.calculateDeductions(formData);

    // 80C suggestions
    const current80C = parseFloat(deductions.section_80c || 0);
    if (current80C < 150000 && income > 500000) {
      suggestions.push({
        section: '80C',
        current: current80C,
        maxLimit: 150000,
        additionalPossible: 150000 - current80C,
        potentialSaving: Math.round((150000 - current80C) * 0.05),
        recommendations: [
          'Invest in PPF (up to ₹1.5 lakh)',
          'Contribute to EPF/VPF',
          'Purchase life insurance policies',
          'Invest in ELSS mutual funds',
          'Pay home loan principal',
          'Tuition fees for children\'s education'
        ]
      });
    }

    // 80D suggestions
    const age = this.calculateAge(formData.personal_info?.dob);
    const current80D = parseFloat(deductions.section_80d || 0);
    const max80D = age >= 60 ? 50000 : 25000;

    if (current80D < max80D) {
      suggestions.push({
        section: '80D',
        current: current80D,
        maxLimit: max80D,
        additionalPossible: max80D - current80D,
        potentialSaving: Math.round((max80D - current80D) * 0.05),
        recommendations: [
          'Purchase health insurance for self',
          'Health insurance for spouse/children',
          'Preventive health check-ups (up to ₹5,000)',
          'Parents health insurance (up to ₹25,000 additional)'
        ]
      });
    }

    return suggestions;
  }
}

// Create singleton instance
const itrComputationEngine = new ITRComputationEngine();

export default itrComputationEngine;