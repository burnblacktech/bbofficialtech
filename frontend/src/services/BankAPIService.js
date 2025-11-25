// =====================================================
// BANK API SERVICE
// Future bank API integration for transaction fetching
// =====================================================

import apiClient from './core/APIClient';
import { enterpriseLogger } from '../utils/logger';

export class BankAPIService {
  constructor(bankId) {
    this.bankId = bankId;
    this.apiEndpoints = {
      hdfc: '/api/bank/hdfc/transactions',
      icici: '/api/bank/icici/transactions',
      sbi: '/api/bank/sbi/transactions',
      axis: '/api/bank/axis/transactions',
      kotak: '/api/bank/kotak/transactions',
    };
  }

  async fetchTransactions(params) {
    try {
      const endpoint = this.apiEndpoints[this.bankId];

      if (!endpoint) {
        throw new Error(`API not available for ${this.bankId}`);
      }

      const response = await apiClient.get(endpoint, { params });

      enterpriseLogger.info('Bank transactions fetched', {
        bank: this.bankId,
        transactionCount: response.data.transactions?.length || 0,
        dateRange: `${params.startDate} to ${params.endDate}`,
      });

      return this.normalizeTransactionData(response.data);
    } catch (error) {
      enterpriseLogger.error('Failed to fetch bank transactions', {
        bank: this.bankId,
        error: error.message,
      });
      throw error;
    }
  }

  async detectDeductions(transactions) {
    try {
      const deductions = {
        ppfDeposits: [],
        licPayments: [],
        tuitionFees: [],
        homeLoanPayments: [],
        other: [],
      };

      transactions.forEach(transaction => {
        const description = transaction.description.toLowerCase();
        const amount = Math.abs(transaction.amount);

        // PPF deposits
        if (description.includes('ppf') || description.includes('public provident fund')) {
          deductions.ppfDeposits.push({
            ...transaction,
            type: 'PPF_INVESTMENT',
            amount: amount,
          });
        }
        // LIC payments
        else if (description.includes('lic') || description.includes('life insurance')) {
          deductions.licPayments.push({
            ...transaction,
            type: 'LIC_PREMIUM',
            amount: amount,
          });
        }
        // Tuition fees
        else if (description.includes('tuition') || description.includes('school fees') || description.includes('college fees')) {
          deductions.tuitionFees.push({
            ...transaction,
            type: 'TUITION_FEES',
            amount: amount,
          });
        }
        // Home loan payments
        else if (description.includes('home loan') || description.includes('housing loan')) {
          deductions.homeLoanPayments.push({
            ...transaction,
            type: 'HOME_LOAN_PRINCIPAL',
            amount: amount,
          });
        }
        // Other potential deductions
        else if (this.isPotentialDeduction(description, amount)) {
          deductions.other.push({
            ...transaction,
            type: 'OTHER_80C',
            amount: amount,
          });
        }
      });

      return deductions;
    } catch (error) {
      enterpriseLogger.error('Failed to detect deductions from transactions', {
        error: error.message,
      });
      throw error;
    }
  }

  isPotentialDeduction(description, amount) {
    // Check if transaction might be a deduction
    const deductionKeywords = [
      'investment', 'deposit', 'premium', 'contribution',
      'mutual fund', 'nsc', 'sukanya', 'elss',
    ];

    return deductionKeywords.some(keyword =>
      description.includes(keyword),
    ) && amount >= 1000; // Minimum amount threshold
  }

  normalizeTransactionData(data) {
    return {
      transactions: data.transactions || [],
      totalTransactions: data.totalTransactions || 0,
      dateRange: data.dateRange || {},
      accountInfo: data.accountInfo || {},
    };
  }

  async authenticate(credentials) {
    try {
      const response = await apiClient.post(`/api/bank/${this.bankId}/auth`, credentials);

      enterpriseLogger.info('Bank API authenticated', {
        bank: this.bankId,
      });

      return response.data;
    } catch (error) {
      enterpriseLogger.error('Bank API authentication failed', {
        bank: this.bankId,
        error: error.message,
      });
      throw error;
    }
  }

  async getAvailableBanks() {
    try {
      const response = await apiClient.get('/api/bank/available');
      return response.data.banks || [];
    } catch (error) {
      enterpriseLogger.error('Failed to fetch available banks', {
        error: error.message,
      });
      return [];
    }
  }

  // RBI Account Aggregator integration (future)
  async connectAccountAggregator(consentId) {
    try {
      const response = await apiClient.post('/api/bank/account-aggregator/connect', {
        consentId,
        bankId: this.bankId,
      });

      enterpriseLogger.info('Account Aggregator connected', {
        bank: this.bankId,
        consentId,
      });

      return response.data;
    } catch (error) {
      enterpriseLogger.error('Account Aggregator connection failed', {
        bank: this.bankId,
        error: error.message,
      });
      throw error;
    }
  }

  async fetchAccountSummary() {
    try {
      const response = await apiClient.get(`/api/bank/${this.bankId}/summary`);

      return {
        accountNumber: response.data.accountNumber,
        accountType: response.data.accountType,
        balance: response.data.balance,
        lastUpdated: response.data.lastUpdated,
      };
    } catch (error) {
      enterpriseLogger.error('Failed to fetch account summary', {
        bank: this.bankId,
        error: error.message,
      });
      throw error;
    }
  }
}

export default BankAPIService;
