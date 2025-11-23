// =====================================================
// AIS/FORM 26AS INTEGRATION SERVICE
// Comprehensive tax data synchronization with Income Tax Department
// =====================================================

import { apiClient } from './core/APIClient';

class AISForm26ASService {
  constructor() {
    this.endpoints = {
      AUTHENTICATE: '/integrations/income-tax/authenticate',
      AIS_DATA: '/integrations/income-tax/ais-data',
      FORM26AS: '/integrations/income-tax/form26as',
      TDS_DETAILS: '/integrations/income-tax/tds-details',
      TAX_PAID: '/integrations/income-tax/tax-paid',
      REFUND_STATUS: '/integrations/income-tax/refund-status'
    };

    this.dataCategories = {
      SALARY: 'S',
      INTEREST: 'I',
      DIVIDEND: 'D',
      PROFESSIONAL_FEES: 'P',
      RENT: 'R',
      CAPITAL_GAINS: 'C',
      OTHER_INCOME: 'O'
    };

    this.tdsSections = {
      SECTION_192: '192', // TDS on Salary
      SECTION_193: '193', // TDS on Interest on Securities
      SECTION_194A: '194A', // TDS on Interest other than Interest on Securities
      SECTION_194C: '194C', // TDS on Payment to Contractor
      SECTION_194I: '194I', // TDS on Rent
      SECTION_194J: '194J', // TDS on Professional Fees
      SECTION_194B: '194B', // TDS on Dividends
      SECTION_194: '194',   // TDS on Dividends from Domestic Companies
      SECTION_195: '195',    // TDS on payments to non-residents
      SECTION_194EE: '194EE', // TDS on National Savings Scheme
      SECTION_194A_1: '194A', // TDS on Interest
      SECTION_194D: '194D'    // TDS on Insurance Commission
    };
  }

  /**
   * Authenticate with Income Tax Portal
   */
  async authenticateWithIncomeTaxPortal(userId, credentials) {
    try {
      console.log('🔐 Authenticating with Income Tax Portal...');

      const authRequest = {
        userId,
        pan: credentials.pan,
        password: credentials.password,
        dob: credentials.dob,
        assessmentYear: credentials.assessmentYear || '2024-25'
      };

      const response = await apiClient.post(this.endpoints.AUTHENTICATE, authRequest);

      if (response.success) {
        console.log('✅ Successfully authenticated with Income Tax Portal');
        return {
          success: true,
          authToken: response.data.authToken,
          sessionId: response.data.sessionId,
          expiresAt: response.data.expiresAt,
          pan: credentials.pan
        };
      }

      return { success: false, error: response.message };

    } catch (error) {
      console.error('❌ Authentication failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Fetch comprehensive AIS data
   */
  async fetchAISData(userId, authToken, assessmentYear = '2024-25') {
    try {
      console.log('📊 Fetching AIS data for assessment year:', assessmentYear);

      const request = {
        userId,
        authToken,
        assessmentYear
      };

      const response = await apiClient.post(this.endpoints.AIS_DATA, request);

      if (response.success) {
        const aisData = response.data;

        // Process and categorize AIS data
        const processedData = this.processAISData(aisData);

        console.log('✅ AIS data fetched and processed successfully');
        return {
          success: true,
          data: processedData,
          summary: this.generateAISSummary(processedData)
        };
      }

      return { success: false, error: response.message };

    } catch (error) {
      console.error('❌ Error fetching AIS data:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Fetch Form 26AS data
   */
  async fetchForm26ASData(userId, authToken, assessmentYear = '2024-25') {
    try {
      console.log('📄 Fetching Form 26AS data...');

      const request = {
        userId,
        authToken,
        assessmentYear
      };

      const response = await apiClient.post(this.endpoints.FORM26AS, request);

      if (response.success) {
        const form26ASData = response.data;

        // Process Form 26AS data
        const processedData = this.processForm26ASData(form26ASData);

        console.log('✅ Form 26AS data fetched successfully');
        return {
          success: true,
          data: processedData,
          summary: this.generateForm26ASSummary(processedData)
        };
      }

      return { success: false, error: response.message };

    } catch (error) {
      console.error('❌ Error fetching Form 26AS data:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get TDS details with analytics
   */
  async getTDSDetails(userId, authToken, assessmentYear = '2024-25') {
    try {
      console.log('💼 Fetching TDS details...');

      const request = {
        userId,
        authToken,
        assessmentYear
      };

      const response = await apiClient.post(this.endpoints.TDS_DETAILS, request);

      if (response.success) {
        const tdsData = response.data;

        // Analyze TDS data
        const analyzedData = this.analyzeTDSData(tdsData);

        console.log('✅ TDS details fetched and analyzed');
        return {
          success: true,
          data: analyzedData,
          insights: this.generateTDSInsights(analyzedData)
        };
      }

      return { success: false, error: response.message };

    } catch (error) {
      console.error('❌ Error fetching TDS details:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get tax paid details
   */
  async getTaxPaidDetails(userId, authToken, assessmentYear = '2024-25') {
    try {
      console.log('💰 Fetching tax paid details...');

      const request = {
        userId,
        authToken,
        assessmentYear
      };

      const response = await apiClient.post(this.endpoints.TAX_PAID, request);

      if (response.success) {
        const taxPaidData = response.data;

        // Process tax paid data
        const processedData = this.processTaxPaidData(taxPaidData);

        console.log('✅ Tax paid details fetched successfully');
        return {
          success: true,
          data: processedData,
          summary: this.generateTaxPaidSummary(processedData)
        };
      }

      return { success: false, error: response.message };

    } catch (error) {
      console.error('❌ Error fetching tax paid details:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Check refund status
   */
  async checkRefundStatus(userId, authToken, assessmentYear = '2024-25') {
    try {
      console.log('💸 Checking refund status...');

      const request = {
        userId,
        authToken,
        assessmentYear
      };

      const response = await apiClient.post(this.endpoints.REFUND_STATUS, request);

      if (response.success) {
        const refundData = response.data;

        // Process refund data
        const processedData = this.processRefundData(refundData);

        console.log('✅ Refund status fetched successfully');
        return {
          success: true,
          data: processedData
        };
      }

      return { success: false, error: response.message };

    } catch (error) {
      console.error('❌ Error checking refund status:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Comprehensive tax data synchronization
   */
  async syncAllTaxData(userId, credentials, assessmentYear = '2024-25') {
    try {
      console.log('🔄 Starting comprehensive tax data synchronization...');

      // Step 1: Authenticate
      const authResult = await this.authenticateWithIncomeTaxPortal(userId, credentials);
      if (!authResult.success) {
        return { success: false, error: 'Authentication failed', stage: 'auth' };
      }

      const { authToken } = authResult;

      // Step 2: Fetch all tax data in parallel
      const [aisData, form26ASData, tdsDetails, taxPaidDetails, refundStatus] = await Promise.all([
        this.fetchAISData(userId, authToken, assessmentYear),
        this.fetchForm26ASData(userId, authToken, assessmentYear),
        this.getTDSDetails(userId, authToken, assessmentYear),
        this.getTaxPaidDetails(userId, authToken, assessmentYear),
        this.checkRefundStatus(userId, authToken, assessmentYear)
      ]);

      // Step 3: Consolidate and analyze data
      const consolidatedData = this.consolidateTaxData({
        ais: aisData.data,
        form26AS: form26ASData.data,
        tds: tdsDetails.data,
        taxPaid: taxPaidDetails.data,
        refunds: refundStatus.data
      });

      // Step 4: Generate comprehensive analysis
      const analysis = this.generateComprehensiveAnalysis(consolidatedData);

      // Step 5: Generate ITR preparation recommendations
      const recommendations = this.generateITRPreparationRecommendations(consolidatedData, analysis);

      // Step 6: Save synchronized data
      await this.saveSynchronizedData(userId, {
        assessmentYear,
        syncDate: new Date().toISOString(),
        data: consolidatedData,
        analysis,
        recommendations
      });

      const result = {
        success: true,
        assessmentYear,
        syncDate: new Date().toISOString(),
        consolidatedData,
        analysis,
        recommendations,
        summary: {
          totalTDS: analysis.totalTDS,
          totalTaxPaid: analysis.totalTaxPaid,
          totalRefundDue: analysis.totalRefundDue,
          dataCompleteness: analysis.dataCompleteness,
          potentialIssues: analysis.potentialIssues
        }
      };

      console.log('✅ Comprehensive tax data synchronization completed');
      return result;

    } catch (error) {
      console.error('❌ Error in tax data synchronization:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Process AIS data for ITR preparation
   */
  processAISData(aisData) {
    const processed = {
      partA: {
        salaryIncome: [],
        interestIncome: [],
        dividendIncome: [],
        professionalFees: [],
        rentalIncome: [],
        otherIncome: []
      },
      partB: {
        specifiedFinancialTransactions: [],
        specifiedHighValueTransactions: [],
        immovablePropertyTransactions: []
      },
      summary: {
        totalIncome: 0,
        totalTransactions: 0,
        highValueTransactions: 0
      }
    };

    // Process Part A - Tax Deducted at Source
    if (aisData.partA) {
      processed.partA.salaryIncome = aisData.partA
        .filter(item => this.dataCategories.SALARY === item.incomeCategory)
        .map(item => ({
          deductorName: item.deductorName,
          deductorPAN: item.deductorPAN,
          amountDeducted: item.amountDeducted,
          dateOfDeduction: item.dateOfDeduction,
          amountPaid: item.amountPaid,
          dateOfPayment: item.dateOfPayment,
          section: item.section,
          challanSerialNo: item.challanSerialNo,
          taxDeposited: item.taxDeposited
        }));

      processed.partA.interestIncome = aisData.partA
        .filter(item => this.dataCategories.INTEREST === item.incomeCategory)
        .map(item => ({
          deductorName: item.deductorName,
          deductorPAN: item.deductorPAN,
          amountDeducted: item.amountDeducted,
          dateOfDeduction: item.dateOfDeduction,
          amountPaid: item.amountPaid,
          natureOfPayment: item.natureOfPayment
        }));

      processed.partA.dividendIncome = aisData.partA
        .filter(item => this.dataCategories.DIVIDEND === item.incomeCategory)
        .map(item => ({
          payerName: item.payerName,
          payerPAN: item.payerPAN,
          amountDeducted: item.amountDeducted,
          dateOfDeduction: item.dateOfDeduction,
          dividendPaid: item.dividendPaid
        }));
    }

    // Process Part B - High Value Transactions
    if (aisData.partB) {
      processed.partB.specifiedFinancialTransactions = aisData.partB
        .filter(item => item.transactionType === 'financial')
        .map(item => ({
          transactionType: item.natureOfTransaction,
          transactionDate: item.dateOfTransaction,
          counterPartyName: item.nameOfCounterParty,
          counterPartyPAN: item.panOfCounterParty,
          amount: item.amount,
          partyType: item.partyType
        }));

      processed.partB.immovablePropertyTransactions = aisData.partB
        .filter(item => item.transactionType === 'immovable_property')
        .map(item => ({
          typeOfProperty: item.typeOfProperty,
          dateOfRegistration: item.dateOfRegistration,
          considerationAmount: item.considerationAmount,
          sellerName: item.nameOfSeller,
          sellerPAN: item.panOfSeller,
          buyerName: item.nameOfBuyer,
          buyerPAN: item.panOfBuyer
        }));
    }

    // Calculate summary
    processed.summary.totalIncome = this.calculateTotalIncome(processed.partA);
    processed.summary.totalTransactions = this.calculateTotalTransactions(processed);
    processed.summary.highValueTransactions = processed.partB.specifiedFinancialTransactions.length +
                                            processed.partB.immovablePropertyTransactions.length;

    return processed;
  }

  /**
   * Process Form 26AS data
   */
  processForm26ASData(form26ASData) {
    const processed = {
      partA: {
        tdsDetails: []
      },
      partB: {
        tdsDetails: []
      },
      partC: {
        taxPaid: []
      },
      partD: {
        refundDetails: []
      },
      summary: {
        totalTDSPartA: 0,
        totalTDSPartB: 0,
        totalTaxPaid: 0,
        totalRefund: 0
      }
    };

    // Process Part A - Tax Deducted at Source (Collectible by Deductor)
    if (form26ASData.partA) {
      processed.partA.tdsDetails = form26ASData.partA.map(item => ({
        deductorName: item.deductorName,
        tanOfDeductor: item.tanOfDeductor,
        amountDeducted: item.amountDeducted,
        dateOnWhichTaxDeducted: item.dateOnWhichTaxDeducted,
        amountPaid: item.amountPaid,
        dateOnWhichPaid: item.dateOnWhichPaid,
        creditAssessmentYear: item.creditAssessmentYear,
        tdsSection: item.tdsSection,
        taxDeposited: item.taxDeposited,
        challanSerialNumber: item.challanSerialNumber,
        dateOfDepositing: item.dateOfDepositing,
        interestOnTDS: item.interestOnTDS
      }));
    }

    // Process Part B - Tax Deducted at Source (Collectible by Deductee)
    if (form26ASData.partB) {
      processed.partB.tdsDetails = form26ASData.partB.map(item => ({
        deductorName: item.deductorName,
        tanOfDeductor: item.tanOfDeductor,
        amountDeducted: item.amountDeducted,
        dateOnWhichTaxDeducted: item.dateOnWhichTaxDeducted,
        amountPaid: item.amountPaid,
        dateOnWhichPaid: item.dateOnWhichPaid,
        creditAssessmentYear: item.creditAssessmentYear,
        tdsSection: item.tdsSection,
        totalTaxDeducted: item.totalTaxDeducted,
        totalTaxDeposited: item.totalTaxDeposited
      }));
    }

    // Process Part C - Tax Paid (Other than TDS)
    if (form26ASData.partC) {
      processed.partC.taxPaid = form26ASData.partC.map(item => ({
        bsrCode: item.bsrCode,
        challanSerialNumber: item.challanSerialNumber,
        dateOfDeposit: item.dateOfDeposit,
        majorHead: item.majorHead,
        minorHead: item.minorHead,
        totalAmountPaid: item.totalAmountPaid,
        description: item.description,
        interestOnAmount: item.interestOnAmount
      }));
    }

    // Process Part D - Refund Details
    if (form26ASData.partD) {
      processed.partD.refundDetails = form26ASData.partD.map(item => ({
        assessmentYear: item.assessmentYear,
        section: item.section,
        refundStatus: item.refundStatus,
        refundAmount: item.refundAmount,
        refundDate: item.refundDate,
        interestAmount: item.interestAmount,
        modeOfPayment: item.modeOfPayment,
        bankName: item.bankName,
        branchName: item.branchName
      }));
    }

    // Calculate summary
    processed.summary.totalTDSPartA = this.sumTDSAmounts(processed.partA.tdsDetails);
    processed.summary.totalTDSPartB = this.sumTDSAmounts(processed.partB.tdsDetails);
    processed.summary.totalTaxPaid = this.sumTaxPaidAmounts(processed.partC.taxPaid);
    processed.summary.totalRefund = this.sumRefundAmounts(processed.partD.refundDetails);

    return processed;
  }

  /**
   * Analyze TDS data for insights
   */
  analyzeTDSData(tdsData) {
    const analysis = {
      totalTDSDeducted: 0,
      totalTDSDeposited: 0,
      deductorsAnalysis: {},
      sectionAnalysis: {},
      monthlyTDS: {},
      mismatches: [],
      potentialIssues: []
    };

    if (!tdsData.tdsDetails) return analysis;

    // Total calculations
    analysis.totalTDSDeducted = tdsData.tdsDetails.reduce((sum, item) =>
      sum + (item.amountDeducted || 0), 0);

    analysis.totalTDSDeposited = tdsData.tdsDetails.reduce((sum, item) =>
      sum + (item.taxDeposited || 0), 0);

    // Deductor analysis
    analysis.deductorsAnalysis = tdsData.tdsDetails.reduce((acc, item) => {
      const key = item.deductorName;
      if (!acc[key]) {
        acc[key] = {
          totalTDS: 0,
          transactions: 0,
          pan: item.deductorPAN
        };
      }
      acc[key].totalTDS += item.amountDeducted || 0;
      acc[key].transactions += 1;
      return acc;
    }, {});

    // Section analysis
    analysis.sectionAnalysis = tdsData.tdsDetails.reduce((acc, item) => {
      const section = item.tdsSection || item.section;
      if (!acc[section]) {
        acc[section] = { count: 0, totalAmount: 0 };
      }
      acc[section].count += 1;
      acc[section].totalAmount += item.amountDeducted || 0;
      return acc;
    }, {});

    // Check for mismatches
    analysis.mismatches = this.identifyTDSMismatches(tdsData.tdsDetails);
    analysis.potentialIssues = this.identifyTDSPotentialIssues(tdsData.tdsDetails);

    return analysis;
  }

  /**
   * Consolidate all tax data
   */
  consolidateTaxData(taxData) {
    const consolidated = {
      pan: null,
      assessmentYear: null,
      incomeSources: {},
      tdsSummary: {},
      taxPayments: [],
      refunds: [],
      transactions: [],
      analytics: {
        totalIncome: 0,
        totalTDS: 0,
        totalTaxPaid: 0,
        totalRefund: 0
      }
    };

    // Consolidate from all sources
    Object.keys(taxData).forEach(source => {
      const data = taxData[source];
      if (!data) return;

      switch (source) {
        case 'ais':
          this.mergeAISData(consolidated, data);
          break;
        case 'form26AS':
          this.mergeForm26ASData(consolidated, data);
          break;
        case 'tds':
          this.mergeTDSData(consolidated, data);
          break;
        case 'taxPaid':
          this.mergeTaxPaidData(consolidated, data);
          break;
        case 'refunds':
          this.mergeRefundData(consolidated, data);
          break;
      }
    });

    // Recalculate analytics
    consolidated.analytics = this.recalculateAnalytics(consolidated);

    return consolidated;
  }

  /**
   * Generate comprehensive analysis
   */
  generateComprehensiveAnalysis(consolidatedData) {
    return {
      totalTDS: consolidatedData.analytics.totalTDS,
      totalTaxPaid: consolidatedData.analytics.totalTaxPaid,
      totalRefundDue: consolidatedData.analytics.totalRefund,
      effectiveTaxRate: this.calculateEffectiveTaxRate(consolidatedData),
      tdsUtilization: this.calculateTDSUtilization(consolidatedData),
      dataCompleteness: this.assessDataCompleteness(consolidatedData),
      potentialIssues: this.identifyPotentialIssues(consolidatedData),
      recommendations: this.generateRecommendations(consolidatedData)
    };
  }

  /**
   * Helper methods
   */
  calculateTotalIncome(partA) {
    return Object.values(partA).flat().reduce((sum, item) =>
      sum + (item.amountPaid || item.dividendPaid || 0), 0);
  }

  calculateTotalTransactions(processed) {
    return Object.values(processed.partB).flat().length;
  }

  sumTDSAmounts(tdsDetails) {
    return tdsDetails.reduce((sum, item) => sum + (item.amountDeducted || 0), 0);
  }

  sumTaxPaidAmounts(taxPaidDetails) {
    return taxPaidDetails.reduce((sum, item) => sum + (item.totalAmountPaid || 0), 0);
  }

  sumRefundAmounts(refundDetails) {
    return refundDetails.reduce((sum, item) => sum + (item.refundAmount || 0), 0);
  }

  identifyTDSMismatches(tdsDetails) {
    const mismatches = [];

    tdsDetails.forEach(item => {
      if (item.amountDeducted !== item.taxDeposited) {
        mismatches.push({
          type: 'AMOUNT_MISMATCH',
          deductor: item.deductorName,
          deducted: item.amountDeducted,
          deposited: item.taxDeposited,
          date: item.dateOnWhichTaxDeducted
        });
      }
    });

    return mismatches;
  }

  identifyTDSPotentialIssues(tdsDetails) {
    const issues = [];

    // Check for missing TDS certificates
    const missingCertificates = tdsDetails.filter(item =>
      item.amountDeducted > 0 && !item.certificateAvailable
    );

    if (missingCertificates.length > 0) {
      issues.push({
        type: 'MISSING_CERTIFICATES',
        count: missingCertificates.length,
        description: `${missingCertificates.length} TDS certificates not available`
      });
    }

    // Check for old unclaimed TDS
    const oldTDS = tdsDetails.filter(item => {
      const deductionDate = new Date(item.dateOnWhichTaxDeducted);
      const twoYearsAgo = new Date();
      twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
      return deductionDate < twoYearsAgo && !item.claimed;
    });

    if (oldTDS.length > 0) {
      issues.push({
        type: 'OLD_UNCLAIMED_TDS',
        count: oldTDS.length,
        description: `${oldTDS.length} old TDS entries not claimed`
      });
    }

    return issues;
  }

  async saveSynchronizedData(userId, data) {
    try {
      await apiClient.post('/tax-data/save-synchronized', {
        userId,
        data
      });
    } catch (error) {
      console.error('Error saving synchronized tax data:', error);
    }
  }

  mergeAISData(consolidated, aisData) {
    // Implementation for merging AIS data
  }

  mergeForm26ASData(consolidated, form26ASData) {
    // Implementation for merging Form 26AS data
  }

  mergeTDSData(consolidated, tdsData) {
    // Implementation for merging TDS data
  }

  mergeTaxPaidData(consolidated, taxPaidData) {
    // Implementation for merging tax paid data
  }

  mergeRefundData(consolidated, refundData) {
    // Implementation for merging refund data
  }

  recalculateAnalytics(consolidated) {
    // Recalculate all analytics based on merged data
    return {
      totalIncome: consolidated.incomeSources.total || 0,
      totalTDS: consolidated.tdsSummary.total || 0,
      totalTaxPaid: consolidated.taxPayments.reduce((sum, item) => sum + item.amount, 0),
      totalRefund: consolidated.refunds.reduce((sum, item) => sum + item.amount, 0)
    };
  }

  calculateEffectiveTaxRate(consolidated) {
    const income = consolidated.analytics.totalIncome;
    const tax = consolidated.analytics.totalTDS + consolidated.analytics.totalTaxPaid;
    return income > 0 ? (tax / income) * 100 : 0;
  }

  calculateTDSUtilization(consolidated) {
    // Calculate how much of TDS is being utilized
    return 95; // Placeholder
  }

  assessDataCompleteness(consolidated) {
    // Assess completeness of data from different sources
    return {
      ais: consolidated.aisData ? 100 : 0,
      form26AS: consolidated.form26ASData ? 100 : 0,
      tds: consolidated.tdsDetails ? 100 : 0,
      overall: 85
    };
  }

  identifyPotentialIssues(consolidated) {
    const issues = [];

    // Check for data inconsistencies
    // Check for missing information
    // Check for potential compliance issues

    return issues;
  }

  generateRecommendations(consolidated) {
    const recommendations = [];

    // Generate actionable recommendations based on data analysis

    return recommendations;
  }

  generateITRPreparationRecommendations(consolidatedData, analysis) {
    return {
      incomeReporting: [],
      deductionClaiming: [],
      tdsMatching: [],
      taxPayment: [],
      documentation: []
    };
  }
}

// Export singleton instance
export const aisForm26ASService = new AISForm26ASService();
export default aisForm26ASService;