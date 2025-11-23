// =====================================================
// BANK STATEMENT IMPORT SERVICE
// Imports and parses bank statements for auto-categorization
// Another critical feature for competitive advantage
// =====================================================

import { apiClient } from './core/APIClient';

class BankStatementService {
  constructor() {
    this.apiEndpoint = '/api/documents/bank-statement/parse';
    this.transactionPatterns = this.initializeTransactionPatterns();
    this.interestRateRules = this.initializeInterestRateRules();
  }

  /**
   * Initialize transaction categorization patterns
   */
  initializeTransactionPatterns() {
    return {
      // Salary credits patterns
      salary: [
        { regex: /salary/i, weight: 10 },
        { regex: /payroll/i, weight: 10 },
        { regex: /monthly\s+pay/i, weight: 9 },
        { regex: /wage/i, weight: 8 },
        { regex: /payslip/i, weight: 10 },
        { regex: /basic\s+pay/i, weight: 9 },
        { regex: /company\s+name/i, weight: 7 }
      ],

      // Interest income patterns
      interest: [
        { regex: /interest\s+credited/i, weight: 10 },
        { regex: /interest\s+income/i, weight: 10 },
        { regex: /fd\s+interest/i, weight: 10 },
        { regex: /fixed\s+deposit/i, weight: 9 },
        { regex: /recurring\s+deposit/i, weight: 9 },
        { regex: /savings\s+interest/i, weight: 8 },
        { regex: /bank\s+interest/i, weight: 7 },
        { regex: /quarterly\s+interest/i, weight: 9 }
      ],

      // TDS patterns
      tds: [
        { regex: /tds/i, weight: 10 },
        { regex: /tax\s+deducted/i, weight: 10 },
        { regex: /income\s+tax/i, weight: 9 },
        { regex: /tcs/i, weight: 10 },
        { regex: /tax\s+collected/i, weight: 9 },
        { regex: /section\s+194/i, weight: 8 }
      ],

      // Investment patterns
      investment: [
        { regex: /mutual\s+fund/i, weight: 10 },
        { regex: /sip/i, weight: 10 },
        { regex: /systematic\s+investment/i, weight: 9 },
        { regex: /demat/i, weight: 8 },
        { regex: /nsc/i, weight: 9 },
        { regex: /ppf/i, weight: 10 },
        { regex: /elss/i, weight: 10 },
        { regex: /tax\s+saving/i, weight: 8 }
      ],

      // Rent patterns
      rent: [
        { regex: /rent/i, weight: 9 },
        { regex: /lease/i, weight: 8 },
        { regex: /rental/i, weight: 9 },
        { regex: /property\s+income/i, weight: 8 },
        { regex: /house\s+rent/i, weight: 7 }
      ],

      // Professional income patterns
      professional: [
        { regex: /professional\s+fees/i, weight: 10 },
        { regex: /consultancy/i, weight: 9 },
        { regex: /freelance/i, weight: 9 },
        { regex: /contractor/i, weight: 8 },
        { regex: /service\s+charges/i, weight: 8 }
      ]
    };
  }

  /**
   * Initialize bank-specific interest rate rules
   */
  initializeInterestRateRules() {
    return {
      // Savings account interest rates (FY 2024-25)
      savingsAccount: [
        { bank: 'SBI', rate: 2.70, balanceRanges: [{ min: 0, max: 100000 }, { min: 100000, max: Infinity, rate: 3.0 }] },
        { bank: 'HDFC', rate: 3.00, balanceRanges: [{ min: 0, max: 50000 }, { min: 50000, max: Infinity, rate: 3.5 }] },
        { bank: 'ICICI', rate: 3.00, balanceRanges: [{ min: 0, max: 50000 }, { min: 50000, max: Infinity, rate: 3.5 }] },
        { bank: 'Axis', rate: 2.75, balanceRanges: [{ min: 0, max: 50000 }, { min: 50000, max: Infinity, rate: 3.0 }] },
        { bank: 'Kotak', rate: 2.75, balanceRanges: [{ min: 0, max: 50000 }, { min: 50000, max: Infinity, rate: 3.0 }] },
        { bank: 'PNB', rate: 2.75, balanceRanges: [{ min: 0, max: 100000 }, { min: 100000, max: Infinity, rate: 3.25 }] },
        { bank: 'Canara', rate: 2.90, balanceRanges: [{ min: 0, max: 100000 }, { min: 100000, max: Infinity, rate: 3.55 }] },
        { bank: 'Bank of Baroda', rate: 2.75, balanceRanges: [{ min: 0, max: 50000 }, { min: 50000, max: Infinity, rate: 3.35 }] }
      ],

      // Fixed deposit rates (approximate for FY 2024-25)
      fixedDeposit: [
        { duration: '6-12 months', rate: 6.5 },
        { duration: '1-2 years', rate: 6.8 },
        { duration: '2-3 years', rate: 7.0 },
        { duration: '3-5 years', rate: 7.1 },
        { duration: '5+ years', rate: 7.0 }
      ],

      // Recurring deposit rates (approximate)
      recurringDeposit: [
        { duration: '6-12 months', rate: 6.6 },
        { duration: '1-2 years', rate: 6.9 },
        { duration: '2-3 years', rate: 7.1 },
        { duration: '3-5 years', rate: 7.2 }
      ]
    };
  }

  /**
   * Parse bank statement and extract transactions
   */
  async parseBankStatement(file, bankName = 'unknown') {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bankName', bankName);
      formData.append('statementType', 'bank-statement');

      const response = await apiClient.post(this.apiEndpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (!response.success) {
        throw new Error(`Bank statement parsing failed: ${response.message}`);
      }

      // Process and categorize transactions
      const processedData = this.processBankStatementData(response.transactions, bankName);

      return {
        success: true,
        data: processedData,
        metadata: {
          bankName,
          accountType: response.accountType || 'savings',
          period: response.period,
          totalTransactions: response.transactions?.length || 0
        }
      };

    } catch (error) {
      console.error('Bank statement parsing error:', error);
      throw new Error(`Failed to parse bank statement: ${error.message}`);
    }
  }

  /**
   * Process and categorize bank statement transactions
   */
  processBankStatementData(transactions, bankName) {
    if (!transactions || !Array.isArray(transactions)) {
      return this.createEmptyAnalysis();
    }

    const categorizedTransactions = transactions.map(transaction =>
      this.categorizeTransaction(transaction)
    );

    const summary = this.generateSummary(categorizedTransactions);
    const insights = this.generateInsights(categorizedTransactions, bankName);

    return {
      transactions: categorizedTransactions,
      summary,
      insights,
      taxImplications: this.calculateTaxImplications(categorizedTransactions)
    };
  }

  /**
   * Categorize individual transaction
   */
  categorizeTransaction(transaction) {
    const categorized = { ...transaction };

    // Initialize categories with scores
    const categories = {
      salary: 0,
      interest: 0,
      tds: 0,
      investment: 0,
      rent: 0,
      professional: 0,
      other: 0
    };

    const description = (transaction.description || '').toLowerCase();

    // Score each category
    for (const [category, patterns] of Object.entries(this.transactionPatterns)) {
      let score = 0;
      for (const pattern of patterns) {
        if (pattern.regex.test(description)) {
          score += pattern.weight;
        }
      }
      categories[category] = score;
    }

    // Determine primary category
    const maxScore = Math.max(...Object.values(categories));
    categorized.category = maxScore > 0 ?
      Object.keys(categories).find(key => categories[key] === maxScore) :
      'other';

    // Add confidence score
    categorized.confidence = Math.min(100, (maxScore / 15) * 100); // Max weight typically 15

    // Add subcategory for better classification
    categorized.subcategory = this.determineSubcategory(description, categorized.category);

    // Tax relevance flag
    categorized.taxRelevant = this.isTaxRelevant(categorized.category);

    return categorized;
  }

  /**
   * Determine subcategory for better classification
   */
  determineSubcategory(description, category) {
    const subcategories = {
      salary: {
        'basic_salary': /basic\s+pay|basic\s+salary/i,
        'hra': /hra|house\s+rent/i,
        'special_allowance': /special\s+allowance|allowance/i,
        'bonus': /bonus|incentive/i,
        'arrears': /arrears|back\s+pay/i
      },
      interest: {
        'savings_interest': /savings\s+interest/i,
        'fd_interest': /fd|fixed\s+deposit/i,
        'rd_interest': /rd|recurring\s+deposit/i,
        'corporate_fd': /corporate\s+fd/i,
        'post_office': /post\s+office/i
      },
      investment: {
        'mutual_fund': /mutual\s+fund/i,
        'sip': /sip|systematic/i,
        'ppf': /ppf/i,
        'elss': /elss|tax\s+saver/i,
        'nsc': /nsc/i,
        'lic': /lic|life\s+insurance/i
      }
    };

    if (subcategories[category]) {
      for (const [subcategory, pattern] of Object.entries(subcategories[category])) {
        if (pattern.test(description)) {
          return subcategory;
        }
      }
    }

    return 'general';
  }

  /**
   * Check if category is tax relevant
   */
  isTaxRelevant(category) {
    const taxRelevantCategories = [
      'salary', 'interest', 'rent', 'professional', 'tds'
    ];
    return taxRelevantCategories.includes(category);
  }

  /**
   * Generate summary of categorized transactions
   */
  generateSummary(transactions) {
    const summary = {
      totalCredits: 0,
      totalDebits: 0,
      netAmount: 0,
      categories: {},
      taxRelevantAmount: 0,
      interestIncome: 0,
      salaryIncome: 0
    };

    transactions.forEach(transaction => {
      const amount = Math.abs(transaction.amount || 0);

      if (transaction.amount > 0) {
        summary.totalCredits += amount;
      } else {
        summary.totalDebits += amount;
      }

      // Category totals
      if (!summary.categories[transaction.category]) {
        summary.categories[transaction.category] = {
          count: 0,
          totalAmount: 0,
          transactions: []
        };
      }

      summary.categories[transaction.category].count++;
      summary.categories[transaction.category].totalAmount += amount;
      summary.categories[transaction.category].transactions.push(transaction);

      // Tax-relevant totals
      if (transaction.taxRelevant) {
        summary.taxRelevantAmount += amount;

        if (transaction.category === 'interest') {
          summary.interestIncome += amount;
        }

        if (transaction.category === 'salary') {
          summary.salaryIncome += amount;
        }
      }
    });

    summary.netAmount = summary.totalCredits - summary.totalDebits;

    // Calculate percentages
    Object.keys(summary.categories).forEach(category => {
      summary.categories[category].percentage =
        (summary.categories[category].totalAmount / summary.totalCredits) * 100;
    });

    return summary;
  }

  /**
   * Generate insights from bank statement analysis
   */
  generateInsights(transactions, bankName) {
    const insights = [];

    // Salary insights
    const salaryTransactions = transactions.filter(t => t.category === 'salary');
    if (salaryTransactions.length > 0) {
      const monthlySalary = salaryTransactions.reduce((sum, t) => sum + t.amount, 0);
      insights.push({
        type: 'salary',
        title: 'Salary Income Detected',
        description: `Found ${salaryTransactions.length} salary credits totaling ₹${monthlySalary.toLocaleString('en-IN')}`,
        action: 'Add to salary income section in ITR',
        priority: 'high'
      });
    }

    // Interest insights
    const interestTransactions = transactions.filter(t => t.category === 'interest');
    if (interestTransactions.length > 0) {
      const totalInterest = interestTransactions.reduce((sum, t) => sum + t.amount, 0);
      insights.push({
        type: 'interest',
        title: 'Interest Income Detected',
        description: `Found interest income of ₹${totalInterest.toLocaleString('en-IN')} from bank deposits`,
        action: 'Declare under "Income from Other Sources"',
        priority: 'high'
      });
    }

    // TDS insights
    const tdsTransactions = transactions.filter(t => t.category === 'tds');
    if (tdsTransactions.length > 0) {
      const totalTDS = tdsTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
      insights.push({
        type: 'tds',
        title: 'TDS Deducted',
        description: `Total TDS of ₹${totalTDS.toLocaleString('en-IN')} detected`,
        action: 'Claim as tax credit in ITR',
        priority: 'high'
      });
    }

    // Investment insights
    const investmentTransactions = transactions.filter(t => t.category === 'investment');
    if (investmentTransactions.length > 0) {
      const totalInvestment = investmentTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
      insights.push({
        type: 'investment',
        title: 'Tax-Saving Investments',
        description: `Tax-saving investments of ₹${totalInvestment.toLocaleString('en-IN')} detected`,
        action: 'Declare under Section 80C/other deductions',
        priority: 'medium'
      });
    }

    // Rent insights
    const rentTransactions = transactions.filter(t => t.category === 'rent');
    if (rentTransactions.length > 0) {
      const totalRent = rentTransactions.reduce((sum, t) => sum + t.amount, 0);
      insights.push({
        type: 'rent',
        title: 'Rental Income Detected',
        description: `Rental income of ₹${totalRent.toLocaleString('en-IN')} detected`,
        action: 'Declare under "Income from House Property"',
        priority: 'medium'
      });
    }

    // Professional income insights
    const professionalTransactions = transactions.filter(t => t.category === 'professional');
    if (professionalTransactions.length > 0) {
      const totalProfessional = professionalTransactions.reduce((sum, t) => sum + t.amount, 0);
      insights.push({
        type: 'professional',
        title: 'Professional Income Detected',
        description: `Professional fees of ₹${totalProfessional.toLocaleString('en-IN')} detected`,
        action: 'Declare under "Income from Business/Profession"',
        priority: 'medium'
      });
    }

    return insights;
  }

  /**
   * Calculate tax implications
   */
  calculateTaxImplications(transactions) {
    const implications = {
      taxableIncome: {
        salary: 0,
        interest: 0,
        rent: 0,
        professional: 0,
        other: 0,
        total: 0
      },
      taxCredits: {
        tds: 0,
        tcs: 0,
        total: 0
      },
      deductions: {
        investment: 0,
        other: 0,
        total: 0
      }
    };

    transactions.forEach(transaction => {
      const amount = Math.abs(transaction.amount);

      if (transaction.amount > 0) { // Credits
        switch (transaction.category) {
          case 'salary':
            implications.taxableIncome.salary += amount;
            break;
          case 'interest':
            implications.taxableIncome.interest += amount;
            break;
          case 'rent':
            implications.taxableIncome.rent += amount;
            break;
          case 'professional':
            implications.taxableIncome.professional += amount;
            break;
          case 'tds':
            implications.taxCredits.tds += amount;
            break;
          case 'investment':
            implications.deductions.investment += amount;
            break;
        }
      }
    });

    // Calculate totals
    implications.taxableIncome.total =
      implications.taxableIncome.salary +
      implications.taxableIncome.interest +
      implications.taxableIncome.rent +
      implications.taxableIncome.professional +
      implications.taxableIncome.other;

    implications.taxCredits.total =
      implications.taxCredits.tds +
      implications.taxCredits.tcs;

    implications.deductions.total =
      implications.deductions.investment +
      implications.deductions.other;

    return implications;
  }

  /**
   * Create empty analysis structure
   */
  createEmptyAnalysis() {
    return {
      transactions: [],
      summary: {
        totalCredits: 0,
        totalDebits: 0,
        netAmount: 0,
        categories: {},
        taxRelevantAmount: 0,
        interestIncome: 0,
        salaryIncome: 0
      },
      insights: [],
      taxImplications: {
        taxableIncome: { salary: 0, interest: 0, rent: 0, professional: 0, other: 0, total: 0 },
        taxCredits: { tds: 0, tcs: 0, total: 0 },
        deductions: { investment: 0, other: 0, total: 0 }
      }
    };
  }

  /**
   * Get bank statement upload instructions
   */
  getUploadInstructions() {
    return {
      title: 'Upload Bank Statement for Auto-Categorization',
      description: 'We\'ll automatically categorize your transactions and identify tax-relevant entries',
      steps: [
        'Download bank statement from your banking app',
        'Ensure it covers the full financial year (Apr-Mar)',
        'Upload the PDF or Excel file',
        'Review categorized transactions',
        'Add relevant entries to your ITR form'
      ],
      acceptedFormats: ['.pdf', '.xlsx', '.xls', '.csv'],
      maxFileSize: '15MB',
      supportedBanks: [
        'SBI', 'HDFC', 'ICICI', 'Axis', 'Kotak', 'PNB',
        'Canara', 'Bank of Baroda', 'Union Bank', 'Indian Bank'
      ],
      tips: [
        'Download statements for all bank accounts',
        'Ensure statements are password-free',
        'Include all pages of the statement',
        'Check that dates cover the complete financial year'
      ]
    };
  }

  /**
   * Auto-populate ITR form with bank statement data
   */
  autoPopulateITRForm(bankStatementData, currentFormData = {}) {
    const populatedData = { ...currentFormData };

    const { summary, taxImplications } = bankStatementData;

    // Populate income information
    populatedData.income = {
      ...populatedData.income,
      salaryIncome: (populatedData.income?.salaryIncome || 0) + (summary.salaryIncome || 0),
      otherIncome: (populatedData.income?.otherIncome || 0) + (summary.interestIncome || 0),
      bankInterest: summary.interestIncome || 0
    };

    // Populate tax information
    populatedData.taxes = {
      ...populatedData.taxes,
      totalTDS: (populatedData.taxes?.totalTDS || 0) + (taxImplications.taxCredits.tds || 0)
    };

    // Populate deductions
    populatedData.deductions = {
      ...populatedData.deductions,
      section80C: Math.min(150000, (populatedData.deductions?.section80C || 0) + (taxImplications.deductions.investment || 0))
    };

    // Add metadata
    populatedData.bankAnalysis = {
      analysisDate: new Date().toISOString(),
      totalTransactions: summary.categories ? Object.values(summary.categories).reduce((sum, cat) => sum + cat.count, 0) : 0,
      taxRelevantAmount: summary.taxRelevantAmount || 0,
      insights: bankStatementData.insights || []
    };

    return populatedData;
  }

  /**
   * Validate bank statement file
   */
  validateBankStatementFile(file) {
    const validation = {
      isValid: true,
      errors: []
    };

    // Check file type
    const allowedTypes = [
      'application/pdf',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ];
    if (!allowedTypes.includes(file.type)) {
      validation.isValid = false;
      validation.errors.push('Please upload a PDF, Excel, or CSV file');
    }

    // Check file size (15MB limit)
    if (file.size > 15 * 1024 * 1024) {
      validation.isValid = false;
      validation.errors.push('File size must be less than 15MB');
    }

    return validation;
  }
}

export const bankStatementService = new BankStatementService();
export default bankStatementService;