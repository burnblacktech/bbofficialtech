// =====================================================
// DATA INTEGRATION SERVICE - COMPREHENSIVE AUTO-POPULATION
// Bank Statements, AIS, Form 26AS, Broker APIs, Salary Slips, Rent Receipts
// =====================================================

import { apiClient } from './core/APIClient';
import { bankStatementService } from './bankStatementService';
import BrokerAPIService from './BrokerAPIService';
import { BankAPIService } from './BankAPIService';

class DataIntegrationService {
  constructor() {
    this.integrationSources = {
      BANK_STATEMENT: 'bank_statement',
      AIS_FORM26AS: 'ais_form26as',
      BROKER_API: 'broker_api',
      SALARY_SLIP: 'salary_slip',
      RENT_RECEIPT: 'rent_receipt',
      FORM_16: 'form_16'
    };

    this.dataCategories = {
      INCOME_SALARY: 'income_salary',
      INCOME_INTEREST: 'income_interest',
      INCOME_CAPITAL_GAINS: 'income_capital_gains',
      INCOME_OTHER: 'income_other',
      DEDUCTIONS_80C: 'deductions_80c',
      DEDUCTIONS_80D: 'deductions_80d',
      DEDUCTIONS_80E: 'deductions_80e',
      DEDUCTIONS_HOUSING: 'deductions_housing',
      TDS_DEDUCTED: 'tds_deducted',
      TAX_PAID: 'tax_paid'
    };

    this.brokerIntegrations = {
      ZERODHA: 'zerodha',
      ANGEL_ONE: 'angel_one',
      UPSTOX: 'upstox',
      ICICI_DIRECT: 'icici_direct',
      HDFC_SECURITIES: 'hdfc_securities'
    };

    this.bankIntegrations = {
      HDFC: 'hdfc',
      ICICI: 'icici',
      SBI: 'sbi',
      PNB: 'pnb',
      AXIS: 'axis'
    };
  }

  /**
   * Master data synchronization - orchestrates all data sources
   */
  async syncAllFinancialData(userId, assessmentYear = '2024-25') {
    try {
      console.log('🔄 Starting comprehensive financial data synchronization...');

      const syncResults = {
        timestamp: new Date().toISOString(),
        userId,
        assessmentYear,
        results: {},
        summary: {
          totalIncome: 0,
          totalDeductions: 0,
          totalTDS: 0,
          categoriesFound: new Set(),
          dataSourcesConnected: new Set()
        }
      };

      // 1. Bank Statement Integration
      const bankData = await this.syncBankStatementData(userId, assessmentYear);
      if (bankData.success) {
        syncResults.results.bankStatement = bankData;
        syncResults.summary.dataSourcesConnected.add('bank_statement');
        this.accumulateSummary(syncResults.summary, bankData.extractedData);
      }

      // 2. AIS/Form 26AS Integration
      const taxData = await this.syncAISForm26ASData(userId, assessmentYear);
      if (taxData.success) {
        syncResults.results.aisForm26AS = taxData;
        syncResults.summary.dataSourcesConnected.add('ais_form26as');
        this.accumulateSummary(syncResults.summary, taxData.extractedData);
      }

      // 3. Broker API Integration
      const brokerData = await this.syncBrokerData(userId, assessmentYear);
      if (brokerData.success) {
        syncResults.results.brokerData = brokerData;
        syncResults.summary.dataSourcesConnected.add('broker_api');
        this.accumulateSummary(syncResults.summary, brokerData.extractedData);
      }

      // 4. Form 16 Processing
      const form16Data = await this.syncForm16Data(userId, assessmentYear);
      if (form16Data.success) {
        syncResults.results.form16 = form16Data;
        syncResults.summary.dataSourcesConnected.add('form_16');
        this.accumulateSummary(syncResults.summary, form16Data.extractedData);
      }

      // 5. Generate auto-population suggestions
      syncResults.autoPopulationSuggestions = this.generateAutoPopulationSuggestions(syncResults);

      // Save sync results
      await this.saveSyncResults(userId, syncResults);

      console.log('✅ Financial data synchronization completed:', syncResults.summary);
      return syncResults;

    } catch (error) {
      console.error('❌ Error in comprehensive data sync:', error);
      throw new Error(`Data integration failed: ${error.message}`);
    }
  }

  /**
   * Bank Statement Data Integration
   */
  async syncBankStatementData(userId, assessmentYear) {
    try {
      console.log('📊 Processing bank statement data...');

      const result = {
        source: this.integrationSources.BANK_STATEMENT,
        success: false,
        extractedData: {},
        transactions: [],
        insights: {}
      };

      // Get connected bank accounts
      const bankAccounts = await this.getUserBankAccounts(userId);
      if (!bankAccounts.length) {
        result.message = 'No bank accounts connected';
        return result;
      }

      let allTransactions = [];
      let extractedData = {};

      // Process each bank account
      for (const account of bankAccounts) {
        try {
          const bankService = new BankAPIService(account.bankCode);
          const statementData = await bankService.fetchBankStatement(
            account.accountNumber,
            assessmentYear
          );

          if (statementData.success) {
            allTransactions.push(...statementData.transactions);

            // Extract tax-relevant data
            const accountData = this.extractTaxRelevantDataFromTransactions(
              statementData.transactions,
              this.integrationSources.BANK_STATEMENT
            );

            extractedData = this.mergeExtractedData(extractedData, accountData);
          }
        } catch (error) {
          console.error(`Error processing ${account.bankCode}:`, error);
        }
      }

      // Categorize and analyze transactions
      result.transactions = allTransactions;
      result.extractedData = extractedData;
      result.insights = this.generateBankStatementInsights(allTransactions);
      result.success = true;

      console.log(`✅ Processed ${allTransactions.length} transactions`);
      return result;

    } catch (error) {
      console.error('Bank statement sync failed:', error);
      return {
        source: this.integrationSources.BANK_STATEMENT,
        success: false,
        error: error.message
      };
    }
  }

  /**
   * AIS/Form 26AS Data Integration
   */
  async syncAISForm26ASData(userId, assessmentYear) {
    try {
      console.log('🏛️ Fetching AIS/Form 26AS data...');

      const result = {
        source: this.integrationSources.AIS_FORM26AS,
        success: false,
        extractedData: {},
        taxDetails: {}
      };

      // Authenticate with Income Tax Portal
      const authResult = await this.authenticateIncomeTaxPortal(userId);
      if (!authResult.success) {
        result.error = 'Income Tax portal authentication failed';
        return result;
      }

      // Fetch AIS data
      const aisResponse = await apiClient.post('/integrations/ais/form26as', {
        userId,
        assessmentYear,
        authToken: authResult.authToken
      });

      if (aisResponse.success) {
        const aisData = aisResponse.data;

        // Extract relevant tax information
        const extractedData = {
          [this.dataCategories.TDS_DEDUCTED]: this.processTDSEntries(aisData.tdsDetails || []),
          [this.dataCategories.TAX_PAID]: this.processTaxPaidEntries(aisData.taxPaid || []),
          [this.dataCategories.INCOME_INTEREST]: this.processInterestIncome(aisData.interestIncome || []),
          [this.dataCategories.INCOME_OTHER]: this.processOtherIncome(aisData.otherIncome || [])
        };

        result.extractedData = extractedData;
        result.taxDetails = {
          pan: aisData.pan,
          totalTDS: aisData.totalTDS,
          totalTaxPaid: aisData.totalTaxPaid,
          totalRefund: aisData.totalRefund
        };
        result.success = true;

        console.log(`✅ AIS/Form 26AS data: TDS ₹${aisData.totalTDS?.toLocaleString()}`);
      }

      return result;

    } catch (error) {
      console.error('AIS/Form 26AS sync failed:', error);
      return {
        source: this.integrationSources.AIS_FORM26AS,
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Broker API Integration for Capital Gains
   */
  async syncBrokerData(userId, assessmentYear) {
    try {
      console.log('📈 Fetching broker data for capital gains...');

      const result = {
        source: this.integrationSources.BROKER_API,
        success: false,
        extractedData: {},
        brokerData: {},
        capitalGains: {}
      };

      // Get connected broker accounts
      const brokerAccounts = await this.getUserBrokerAccounts(userId);
      if (!brokerAccounts.length) {
        result.message = 'No broker accounts connected';
        return result;
      }

      let allCapitalGains = [];
      let extractedData = {};

      // Process each broker account
      for (const account of brokerAccounts) {
        try {
          const brokerService = new BrokerAPIService(account.brokerCode);
          const brokerData = await brokerService.fetchTransactionHistory(
            account.clientId,
            assessmentYear
          );

          if (brokerData.success) {
            // Calculate capital gains
            const capitalGains = this.calculateCapitalGains(brokerData.transactions);
            allCapitalGains.push(...capitalGains);

            // Extract relevant data
            const accountData = {
              [this.dataCategories.INCOME_CAPITAL_GAINS]: capitalGains
            };

            extractedData = this.mergeExtractedData(extractedData, accountData);
            result.brokerData[account.brokerCode] = brokerData;
          }
        } catch (error) {
          console.error(`Error processing ${account.brokerCode}:`, error);
        }
      }

      // Aggregate capital gains by type
      result.capitalGains = this.aggregateCapitalGains(allCapitalGains);
      result.extractedData = extractedData;
      result.success = true;

      console.log(`✅ Processed ${allCapitalGains.length} capital gains transactions`);
      return result;

    } catch (error) {
      console.error('Broker data sync failed:', error);
      return {
        source: this.integrationSources.BROKER_API,
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Form 16 Data Integration
   */
  async syncForm16Data(userId, assessmentYear) {
    try {
      console.log('📄 Processing Form 16 data...');

      const result = {
        source: this.integrationSources.FORM_16,
        success: false,
        extractedData: {},
        employers: []
      };

      // Get uploaded Form 16 documents
      const form16Docs = await this.getUserForm16Documents(userId, assessmentYear);
      if (!form16Docs.length) {
        result.message = 'No Form 16 documents found';
        return result;
      }

      let extractedData = {};

      // Process each Form 16
      for (const doc of form16Docs) {
        try {
          const form16Data = await this.extractForm16Data(doc.documentId);

          if (form16Data.success) {
            extractedData = this.mergeExtractedData(extractedData, form16Data.extractedData);
            result.employers.push(form16Data.employerInfo);
          }
        } catch (error) {
          console.error(`Error processing Form 16 ${doc.documentId}:`, error);
        }
      }

      result.extractedData = extractedData;
      result.success = true;

      console.log(`✅ Processed ${form16Docs.length} Form 16 documents`);
      return result;

    } catch (error) {
      console.error('Form 16 sync failed:', error);
      return {
        source: this.integrationSources.FORM_16,
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Extract tax-relevant data from bank transactions
   */
  extractTaxRelevantDataFromTransactions(transactions, source) {
    const extractedData = {
      [this.dataCategories.INCOME_INTEREST]: [],
      [this.dataCategories.INCOME_OTHER]: [],
      [this.dataCategories.DEDUCTIONS_HOUSING]: [],
      [this.dataCategories.DEDUCTIONS_80C]: [],
      [this.dataCategories.TAX_PAID]: []
    };

    for (const transaction of transactions) {
      const category = this.categorizeTransactionForTax(transaction);

      switch (category) {
        case 'INTEREST_INCOME':
          extractedData[this.dataCategories.INCOME_INTEREST].push({
            amount: transaction.amount,
            date: transaction.date,
            description: transaction.description,
            source: source,
            confidence: 0.9,
            transactionId: transaction.id
          });
          break;

        case 'RENT_PAYMENT':
          extractedData[this.dataCategories.DEDUCTIONS_HOUSING].push({
            amount: Math.abs(transaction.amount),
            date: transaction.date,
            description: transaction.description,
            source: source,
            confidence: 0.85,
            transactionId: transaction.id
          });
          break;

        case 'INSURANCE_PREMIUM':
          extractedData[this.dataCategories.DEDUCTIONS_80C].push({
            amount: Math.abs(transaction.amount),
            date: transaction.date,
            description: transaction.description,
            source: source,
            confidence: 0.8,
            transactionId: transaction.id,
            subCategory: 'life_insurance'
          });
          break;

        case 'TAX_PAYMENT':
          extractedData[this.dataCategories.TAX_PAID].push({
            amount: Math.abs(transaction.amount),
            date: transaction.date,
            description: transaction.description,
            source: source,
            confidence: 0.95,
            transactionId: transaction.id
          });
          break;
      }
    }

    return extractedData;
  }

  /**
   * Categorize transactions for tax purposes
   */
  categorizeTransactionForTax(transaction) {
    const { description, amount } = transaction;
    const lowerDesc = description.toLowerCase();

    // Interest income patterns
    if (amount > 0 && (
      lowerDesc.includes('interest') ||
      lowerDesc.includes('fd interest') ||
      lowerDesc.includes('savings interest') ||
      lowerDesc.includes('rd interest') ||
      lowerDesc.includes('interest credited')
    )) {
      return 'INTEREST_INCOME';
    }

    // Rent payment patterns
    if (amount < 0 && (
      lowerDesc.includes('rent') ||
      lowerDesc.includes('lease') ||
      lowerDesc.includes('monthly rent') ||
      /rent.*[0-9]+/.test(lowerDesc)
    )) {
      return 'RENT_PAYMENT';
    }

    // Insurance premium patterns
    if (amount < 0 && (
      lowerDesc.includes('insurance') ||
      lowerDesc.includes('lic') ||
      lowerDesc.includes('premium') ||
      lowerDesc.includes('policy') ||
      lowerDesc.includes('term insurance') ||
      lowerDesc.includes('life insurance')
    )) {
      return 'INSURANCE_PREMIUM';
    }

    // Tax payment patterns
    if (amount < 0 && (
      lowerDesc.includes('tax') ||
      lowerDesc.includes('income tax') ||
      lowerDesc.includes('advance tax') ||
      lowerDesc.includes('self assessment tax') ||
      lowerDesc.includes('tds') ||
      /tax.*[0-9]+/.test(lowerDesc)
    )) {
      return 'TAX_PAYMENT';
    }

    return 'OTHER';
  }

  /**
   * Calculate capital gains from broker transactions
   */
  calculateCapitalGains(transactions) {
    const capitalGains = [];
    const holdings = {};

    for (const transaction of transactions) {
      const { symbol, type, quantity, price, date, brokerCode } = transaction;

      if (type === 'BUY') {
        if (!holdings[symbol]) {
          holdings[symbol] = [];
        }
        holdings[symbol].push({
          quantity,
          price,
          date,
          brokerCode
        });
      } else if (type === 'SELL') {
        let remainingQuantity = quantity;
        let totalCost = 0;

        // FIFO matching for sold shares
        while (remainingQuantity > 0 && holdings[symbol]?.length > 0) {
          const holding = holdings[symbol][0];
          const sellQuantity = Math.min(remainingQuantity, holding.quantity);

          totalCost += (sellQuantity * holding.price);
          remainingQuantity -= sellQuantity;
          holding.quantity -= sellQuantity;

          if (holding.quantity === 0) {
            holdings[symbol].shift();
          }
        }

        if (remainingQuantity === 0) {
          const sellValue = quantity * price;
          const capitalGain = sellValue - totalCost;
          const holdingPeriod = this.calculateHoldingPeriod(holdings[symbol]?.[0]?.date, date);

          capitalGains.push({
            symbol,
            type: holdingPeriod > 365 ? 'LONG_TERM' : 'SHORT_TERM',
            saleValue: sellValue,
            costBasis: totalCost,
            capitalGain,
            date,
            brokerCode
          });
        }
      }
    }

    return capitalGains;
  }

  /**
   * Calculate holding period in days
   */
  calculateHoldingPeriod(buyDate, sellDate) {
    if (!buyDate) return 0;
    const buy = new Date(buyDate);
    const sell = new Date(sellDate);
    return Math.floor((sell - buy) / (1000 * 60 * 60 * 24));
  }

  /**
   * Generate auto-population suggestions
   */
  generateAutoPopulationSuggestions(syncResults) {
    const suggestions = [];
    const { extractedData, summary } = syncResults;

    // Income suggestions
    if (summary.totalIncome > 0) {
      suggestions.push({
        category: 'INCOME',
        priority: 'HIGH',
        items: [
          {
            field: 'salary.income',
            label: 'Salary Income',
            suggestedValue: extractedData[this.dataCategories.INCOME_SALARY]?.reduce((sum, item) => sum + item.amount, 0) || 0,
            confidence: 0.95,
            source: 'FORM_16'
          },
          {
            field: 'income.otherInterest',
            label: 'Interest Income',
            suggestedValue: summary.totalIncome.interest || 0,
            confidence: 0.9,
            source: 'BANK_STATEMENT'
          }
        ]
      });
    }

    // Deduction suggestions
    if (summary.totalDeductions > 0) {
      suggestions.push({
        category: 'DEDUCTIONS',
        priority: 'MEDIUM',
        items: [
          {
            field: 'deductions.section80C.lifeInsurance',
            label: 'Life Insurance Premium',
            suggestedValue: summary.totalDeductions.lifeInsurance || 0,
            confidence: 0.8,
            source: 'BANK_STATEMENT'
          },
          {
            field: 'deductions.housing.rentPaid',
            label: 'Rent Paid',
            suggestedValue: summary.totalDeductions.rent || 0,
            confidence: 0.85,
            source: 'BANK_STATEMENT'
          }
        ]
      });
    }

    // TDS suggestions
    if (summary.totalTDS > 0) {
      suggestions.push({
        category: 'TDS',
        priority: 'HIGH',
        items: [
          {
            field: 'taxDetails.tdsFromSalary',
            label: 'TDS Deducted (Salary)',
            suggestedValue: summary.totalTDS.salary || 0,
            confidence: 0.95,
            source: 'FORM_16'
          },
          {
            field: 'taxDetails.tdsOther',
            label: 'TDS Deducted (Other)',
            suggestedValue: summary.totalTDS.other || 0,
            confidence: 0.9,
            source: 'AIS_FORM26AS'
          }
        ]
      });
    }

    return suggestions;
  }

  /**
   * Accumulate summary data from different sources
   */
  accumulateSummary(summary, extractedData) {
    Object.keys(extractedData).forEach(category => {
      const items = extractedData[category];
      if (Array.isArray(items)) {
        const total = items.reduce((sum, item) => sum + (item.amount || 0), 0);
        summary.totalIncome += total;
        summary.categoriesFound.add(category);
      }
    });
  }

  /**
   * Merge extracted data from multiple sources
   */
  mergeExtractedData(existing, newData) {
    const merged = { ...existing };

    Object.keys(newData).forEach(key => {
      if (Array.isArray(newData[key])) {
        merged[key] = [...(merged[key] || []), ...newData[key]];
      } else {
        merged[key] = newData[key];
      }
    });

    return merged;
  }

  /**
   * Save sync results to backend
   */
  async saveSyncResults(userId, syncResults) {
    try {
      await apiClient.post('/data-integration/save-sync-results', {
        userId,
        syncResults
      });
    } catch (error) {
      console.error('Error saving sync results:', error);
    }
  }

  /**
   * Helper methods for data processing
   */
  async getUserBankAccounts(userId) {
    try {
      const response = await apiClient.get(`/users/${userId}/bank-accounts`);
      return response.success ? response.data : [];
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
      return [];
    }
  }

  async getUserBrokerAccounts(userId) {
    try {
      const response = await apiClient.get(`/users/${userId}/broker-accounts`);
      return response.success ? response.data : [];
    } catch (error) {
      console.error('Error fetching broker accounts:', error);
      return [];
    }
  }

  async getUserForm16Documents(userId, assessmentYear) {
    try {
      const response = await apiClient.get(`/users/${userId}/form16-documents`, {
        params: { assessmentYear }
      });
      return response.success ? response.data : [];
    } catch (error) {
      console.error('Error fetching Form 16 documents:', error);
      return [];
    }
  }

  processTDSEntries(tdsDetails) {
    return tdsDetails.map(tds => ({
      amount: tds.amountDeducted,
      date: tds.date,
      deductorName: tds.deductorName,
      deductorPAN: tds.deductorPAN,
      section: tds.section,
      source: this.integrationSources.AIS_FORM26AS,
      confidence: 1.0
    }));
  }

  async authenticateIncomeTaxPortal(userId) {
    try {
      const response = await apiClient.post('/integrations/income-tax/authenticate', {
        userId
      });
      return response.success ? response.data : { success: false };
    } catch (error) {
      console.error('Income Tax portal authentication failed:', error);
      return { success: false };
    }
  }
}

// Export singleton instance
export const dataIntegrationService = new DataIntegrationService();
export default dataIntegrationService;