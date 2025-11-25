// =====================================================
// BANK CONTROLLER
// Handles bank API integration and transaction fetching
// =====================================================

const enterpriseLogger = require('../utils/logger');
const { AppError } = require('../middleware/errorHandler');

class BankController {
  constructor() {
    this.supportedBanks = [
      {
        id: 'hdfc',
        name: 'HDFC Bank',
        apiAvailable: true,
        description: 'HDFC Bank API integration',
      },
      {
        id: 'icici',
        name: 'ICICI Bank',
        apiAvailable: true,
        description: 'ICICI Bank API integration',
      },
      {
        id: 'sbi',
        name: 'State Bank of India',
        apiAvailable: false,
        description: 'SBI API integration (coming soon)',
      },
      {
        id: 'axis',
        name: 'Axis Bank',
        apiAvailable: true,
        description: 'Axis Bank API integration',
      },
      {
        id: 'kotak',
        name: 'Kotak Mahindra Bank',
        apiAvailable: false,
        description: 'Kotak Bank API integration (coming soon)',
      },
    ];
  }

  // =====================================================
  // GET SUPPORTED BANKS
  // =====================================================

  async getSupportedBanks(req, res) {
    try {
      res.json({
        success: true,
        data: { banks: this.supportedBanks },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to get supported banks', {
        error: error.message,
      });

      res.status(500).json({
        error: 'Failed to get supported banks',
      });
    }
  }

  // =====================================================
  // BANK API AUTHENTICATION
  // =====================================================

  async authenticateBankAPI(req, res) {
    try {
      const userId = req.user.userId;
      const { bank, credentials } = req.body;

      // Validate bank
      const bankInfo = this.supportedBanks.find(b => b.id === bank);
      if (!bankInfo) {
        return res.status(400).json({
          error: 'Unsupported bank',
        });
      }

      if (!bankInfo.apiAvailable) {
        return res.status(400).json({
          error: 'API not available for this bank',
        });
      }

      // Mock authentication - in production, this would integrate with actual bank APIs
      const mockResponse = {
        authenticated: true,
        accessToken: 'mock_bank_access_token',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        accountInfo: {
          accountNumber: '****1234',
          accountType: 'Savings',
          balance: 50000,
        },
      };

      enterpriseLogger.info('Bank API authenticated', {
        userId,
        bank,
      });

      res.json({
        success: true,
        data: mockResponse,
      });

    } catch (error) {
      enterpriseLogger.error('Bank API authentication failed', {
        userId: req.user.userId,
        error: error.message,
      });

      res.status(500).json({
        error: 'Bank API authentication failed',
        details: error.message,
      });
    }
  }

  // =====================================================
  // FETCH BANK TRANSACTIONS
  // =====================================================

  async fetchTransactions(req, res) {
    try {
      const userId = req.user.userId;
      const { bank } = req.params;
      const { startDate, endDate, accountNumber } = req.query;

      // Validate bank
      const bankInfo = this.supportedBanks.find(b => b.id === bank);
      if (!bankInfo || !bankInfo.apiAvailable) {
        return res.status(400).json({
          error: 'Bank API not available',
        });
      }

      // Mock transaction data - in production, this would fetch from actual bank APIs
      const mockTransactions = [
        {
          id: 'TXN001',
          date: '2024-03-15',
          description: 'LIC Premium Payment',
          amount: -25000,
          type: 'debit',
          category: 'insurance',
          reference: 'LIC123456789',
        },
        {
          id: 'TXN002',
          date: '2024-03-10',
          description: 'PPF Deposit',
          amount: -50000,
          type: 'debit',
          category: 'investment',
          reference: 'PPF987654321',
        },
        {
          id: 'TXN003',
          date: '2024-03-05',
          description: 'School Fees Payment',
          amount: -15000,
          type: 'debit',
          category: 'education',
          reference: 'SCH456789123',
        },
        {
          id: 'TXN004',
          date: '2024-02-28',
          description: 'Home Loan EMI',
          amount: -35000,
          type: 'debit',
          category: 'loan',
          reference: 'HL789123456',
        },
      ];

      enterpriseLogger.info('Bank transactions fetched', {
        userId,
        bank,
        startDate,
        endDate,
        transactionCount: mockTransactions.length,
      });

      res.json({
        success: true,
        data: {
          transactions: mockTransactions,
          totalTransactions: mockTransactions.length,
          dateRange: { startDate, endDate },
          accountInfo: {
            accountNumber: accountNumber || '****1234',
            accountType: 'Savings',
          },
        },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to fetch bank transactions', {
        userId: req.user.userId,
        bank: req.params.bank,
        error: error.message,
      });

      res.status(500).json({
        error: 'Failed to fetch bank transactions',
        details: error.message,
      });
    }
  }

  // =====================================================
  // DETECT DEDUCTIONS FROM TRANSACTIONS
  // =====================================================

  async detectDeductions(req, res) {
    try {
      const userId = req.user.userId;
      const { transactions } = req.body;

      if (!transactions || !Array.isArray(transactions)) {
        return res.status(400).json({
          error: 'Invalid transactions data',
        });
      }

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

      enterpriseLogger.info('Deductions detected from transactions', {
        userId,
        totalTransactions: transactions.length,
        detectedDeductions: Object.values(deductions).flat().length,
      });

      res.json({
        success: true,
        data: { deductions },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to detect deductions', {
        userId: req.user.userId,
        error: error.message,
      });

      res.status(500).json({
        error: 'Failed to detect deductions',
        details: error.message,
      });
    }
  }

  // =====================================================
  // GET ACCOUNT SUMMARY
  // =====================================================

  async getAccountSummary(req, res) {
    try {
      const userId = req.user.userId;
      const { bank } = req.params;

      // Mock account summary
      const mockSummary = {
        accountNumber: '****1234',
        accountType: 'Savings',
        balance: 50000,
        lastUpdated: new Date().toISOString(),
      };

      res.json({
        success: true,
        data: mockSummary,
      });

    } catch (error) {
      enterpriseLogger.error('Failed to get account summary', {
        userId: req.user.userId,
        bank: req.params.bank,
        error: error.message,
      });

      res.status(500).json({
        error: 'Failed to get account summary',
      });
    }
  }

  // =====================================================
  // ACCOUNT AGGREGATOR INTEGRATION (Future)
  // =====================================================

  async connectAccountAggregator(req, res) {
    try {
      const userId = req.user.userId;
      const { consentId, bankId } = req.body;

      // Mock Account Aggregator connection
      const mockResponse = {
        connected: true,
        consentId,
        bankId,
        connectedAt: new Date().toISOString(),
      };

      enterpriseLogger.info('Account Aggregator connected', {
        userId,
        consentId,
        bankId,
      });

      res.json({
        success: true,
        data: mockResponse,
      });

    } catch (error) {
      enterpriseLogger.error('Account Aggregator connection failed', {
        userId: req.user.userId,
        error: error.message,
      });

      res.status(500).json({
        error: 'Account Aggregator connection failed',
        details: error.message,
      });
    }
  }

  // =====================================================
  // HELPER METHODS
  // =====================================================

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
}

module.exports = new BankController();
