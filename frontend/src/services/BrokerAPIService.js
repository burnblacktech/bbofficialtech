// =====================================================
// BROKER API SERVICE - COMPREHENSIVE CAPITAL GAINS INTEGRATION
// Real-time API integration with all major Indian brokers
// =====================================================

import { apiClient } from './core/APIClient';

class BrokerAPIService {
  constructor(brokerCode) {
    this.brokerCode = brokerCode;
    this.brokers = {
      ZERODHA: 'zerodha',
      ANGEL_ONE: 'angel_one',
      UPSTOX: 'upstox',
      GROWW: 'groww',
      ICICI_DIRECT: 'icici_direct',
      HDFC_SECURITIES: 'hdfc_securities',
      KOTAK_SECURITIES: 'kotak_securities',
      SBICAP_SECURITIES: 'sbicap_securities'
    };

    this.endpoints = {
      AUTHENTICATE: '/broker/authenticate',
      HOLDINGS: '/broker/holdings',
      POSITIONS: '/broker/positions',
      TRADES: '/broker/trades',
      CAPITAL_GAINS: '/broker/capital-gains',
      STATEMENT: '/broker/statement',
      TAX_REPORT: '/broker/tax-report'
    };

    this.capitalGainsRates = {
      EQUITY: {
        SHORT_TERM: 0.15,    // 15% for holding period < 1 year
        LONG_TERM: 0.10     // 10% for holding period > 1 year (above ₹1 lakh)
      },
      DEBT: {
        SHORT_TERM: 0.30,    // As per income slab
        LONG_TERM: 0.20     // 20% with indexation or 10% without indexation
      },
      OTHER_ASSETS: {
        SHORT_TERM: 0.30,    // As per income slab
        LONG_TERM: 0.20     // 20% with indexation
      }
    };
  }

  /**
   * Authenticate with broker API
   */
  async authenticate(credentials) {
    try {
      console.log(`🔐 Authenticating with ${this.brokerCode}...`);

      const authRequest = {
        brokerCode: this.brokerCode,
        credentials: this.encryptCredentials(credentials),
        timestamp: new Date().toISOString()
      };

      const response = await apiClient.post(this.endpoints.AUTHENTICATE, authRequest);

      if (response.success) {
        console.log(`✅ Successfully authenticated with ${this.brokerCode}`);
        return {
          success: true,
          accessToken: response.data.accessToken,
          refreshToken: response.data.refreshToken,
          expiresAt: response.data.expiresAt,
          userId: response.data.userId
        };
      }

      return { success: false, error: response.message };

    } catch (error) {
      console.error(`❌ Authentication failed for ${this.brokerCode}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Fetch complete transaction history for capital gains calculation
   */
  async fetchTransactionHistory(userId, assessmentYear = '2024-25') {
    try {
      console.log(`📈 Fetching transaction history for ${this.brokerCode}...`);

      const request = {
        userId,
        brokerCode: this.brokerCode,
        assessmentYear,
        includeAllSegments: true
      };

      const response = await apiClient.post(this.endpoints.TRADES, request);

      if (response.success) {
        const transactions = response.data.transactions || [];

        // Process and categorize transactions
        const processedTransactions = this.processTransactions(transactions);

        // Calculate capital gains
        const capitalGains = this.calculateCapitalGains(processedTransactions);

        // Generate tax report
        const taxReport = this.generateTaxReport(processedTransactions, capitalGains);

        console.log(`✅ Processed ${transactions.length} transactions`);
        return {
          success: true,
          transactions: processedTransactions,
          capitalGains,
          taxReport,
          summary: {
            totalTransactions: transactions.length,
            profitableTrades: capitalGains.profitableTrades,
            lossMakingTrades: capitalGains.lossMakingTrades,
            totalGains: capitalGains.totalGains,
            totalLosses: capitalGains.totalLosses,
            netGains: capitalGains.netGains
          }
        };
      }

      return { success: false, error: response.message };

    } catch (error) {
      console.error(`❌ Error fetching transaction history for ${this.brokerCode}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Fetch current holdings with tax implications
   */
  async fetchHoldings(userId) {
    try {
      console.log(`💼 Fetching holdings for ${this.brokerCode}...`);

      const request = {
        userId,
        brokerCode: this.brokerCode
      };

      const response = await apiClient.post(this.endpoints.HOLDINGS, request);

      if (response.success) {
        const holdings = response.data.holdings || [];

        // Process holdings with tax implications
        const processedHoldings = holdings.map(holding => ({
          ...holding,
          taxImplications: this.calculateHoldingTaxImplications(holding),
          unrealizedGains: this.calculateUnrealizedGains(holding)
        }));

        return {
          success: true,
          holdings: processedHoldings,
          summary: this.generateHoldingsSummary(processedHoldings)
        };
      }

      return { success: false, error: response.message };

    } catch (error) {
      console.error(`❌ Error fetching holdings for ${this.brokerCode}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Process transactions for tax calculation
   */
  processTransactions(transactions) {
    const processed = transactions.map(transaction => {
      return {
        ...transaction,
        tradeDate: new Date(transaction.tradeDate),
        settlementDate: new Date(transaction.settlementDate),
        symbol: transaction.symbol?.toUpperCase(),
        exchange: transaction.exchange || 'NSE',
        segment: this.determineSegment(transaction),
        type: transaction.transactionType?.toUpperCase() || 'BUY',
        quantity: Math.abs(transaction.quantity),
        price: parseFloat(transaction.price),
        value: Math.abs(transaction.quantity * parseFloat(transaction.price)),
        brokerage: parseFloat(transaction.brokerage || 0),
        charges: parseFloat(transaction.charges || 0),
        stt: parseFloat(transaction.stt || 0),
        gst: parseFloat(transaction.gst || 0),
        totalCharges: this.calculateTotalCharges(transaction)
      };
    });

    // Sort by date for FIFO processing
    return processed.sort((a, b) => a.tradeDate - b.tradeDate);
  }

  /**
   * Calculate capital gains using FIFO method
   */
  calculateCapitalGains(transactions) {
    const holdings = {};
    const capitalGains = {
      shortTerm: [],
      longTerm: [],
      summary: {
        shortTermGains: 0,
        longTermGains: 0,
        exemptLongTermGains: 0,
        totalGains: 0,
        totalLosses: 0,
        netGains: 0,
        taxLiability: 0
      }
    };

    for (const transaction of transactions) {
      const key = `${transaction.symbol}_${transaction.exchange}_${transaction.segment}`;

      if (!holdings[key]) {
        holdings[key] = [];
      }

      if (transaction.type === 'BUY') {
        // Add to holdings
        holdings[key].push({
          quantity: transaction.quantity,
          price: transaction.price,
          tradeDate: transaction.tradeDate,
          totalCost: transaction.value + transaction.totalCharges,
          totalCharges: transaction.totalCharges
        });
      } else if (transaction.type === 'SELL') {
        // Calculate gains using FIFO
        let remainingQuantity = transaction.quantity;
        let totalCostBasis = 0;
        let sellValue = transaction.value - transaction.totalCharges;

        while (remainingQuantity > 0 && holdings[key].length > 0) {
          const holding = holdings[key][0];
          const sellQuantity = Math.min(remainingQuantity, holding.quantity);

          const costBasis = (sellQuantity / holding.quantity) * holding.totalCost;
          totalCostBasis += costBasis;

          const capitalGain = sellValue * (sellQuantity / transaction.quantity) - costBasis;
          const holdingPeriod = this.calculateHoldingPeriod(holding.tradeDate, transaction.tradeDate);

          const gainType = holdingPeriod > 365 ? 'LONG_TERM' : 'SHORT_TERM';
          const isExempt = gainType === 'LONG_TERM' && transaction.segment === 'EQUITY';

          const gainEntry = {
            symbol: transaction.symbol,
            exchange: transaction.exchange,
            segment: transaction.segment,
            buyDate: holding.tradeDate,
            sellDate: transaction.tradeDate,
            holdingPeriod,
            quantity: sellQuantity,
            buyPrice: holding.price,
            sellPrice: transaction.price,
            costBasis,
            sellValue: sellValue * (sellQuantity / transaction.quantity),
            capitalGain,
            type: gainType,
            exempt: isExempt,
            stt: transaction.stt * (sellQuantity / transaction.quantity),
            tax: this.calculateTaxOnGain(capitalGain, gainType, isExempt, transaction.segment)
          };

          if (gainType === 'LONG_TERM') {
            capitalGains.longTerm.push(gainEntry);
          } else {
            capitalGains.shortTerm.push(gainEntry);
          }

          remainingQuantity -= sellQuantity;
          holding.quantity -= sellQuantity;

          if (holding.quantity === 0) {
            holdings[key].shift();
          }
        }
      }
    }

    // Calculate summary
    capitalGains.summary = this.calculateGainsSummary(capitalGains);

    return capitalGains;
  }

  /**
   * Generate comprehensive tax report
   */
  generateTaxReport(transactions, capitalGains) {
    return {
      assessmentYear: '2024-25',
      broker: this.brokerCode,
      summary: {
        totalTransactions: transactions.length,
        buyTransactions: transactions.filter(t => t.type === 'BUY').length,
        sellTransactions: transactions.filter(t => t.type === 'SELL').length,
        totalValue: transactions.reduce((sum, t) => sum + t.value, 0),
        totalCharges: transactions.reduce((sum, t) => sum + t.totalCharges, 0)
      },
      capitalGains: {
        shortTerm: {
          count: capitalGains.shortTerm.length,
          totalGains: capitalGains.summary.shortTermGains,
          totalLosses: capitalGains.shortTerm.filter(g => g.capitalGain < 0).reduce((sum, g) => sum + g.capitalGain, 0),
          taxLiability: this.calculateSTTaxLiability(capitalGains.shortTerm)
        },
        longTerm: {
          count: capitalGains.longTerm.length,
          totalGains: capitalGains.summary.longTermGains,
          exemptGains: capitalGains.summary.exemptLongTermGains,
          taxableGains: capitalGains.summary.longTermGains - capitalGains.summary.exemptLongTermGains,
          taxLiability: this.calculateLTTaxLiability(capitalGains.longTerm)
        }
      },
      detailedTransactions: [...capitalGains.shortTerm, ...capitalGains.longTerm],
      taxOptimization: this.generateTaxOptimizationSuggestions(capitalGains)
    };
  }

  /**
   * Calculate tax on capital gains
   */
  calculateTaxOnGain(gain, type, isExempt, segment) {
    if (gain <= 0) return 0; // No tax on losses
    if (isExempt) return 0; // Exempt long-term gains

    const rates = this.capitalGainsRates[segment] || this.capitalGainsRates.OTHER_ASSETS;

    if (type === 'SHORT_TERM') {
      return gain * rates.SHORT_TERM;
    } else {
      return gain * rates.LONG_TERM;
    }
  }

  /**
   * Generate tax optimization suggestions
   */
  generateTaxOptimizationSuggestions(capitalGains) {
    const suggestions = [];

    // Check for tax loss harvesting opportunities
    const currentHoldings = this.getCurrentHoldings();
    const lossMakingHoldings = currentHoldings.filter(holding =>
      holding.currentValue < holding.averageCost
    );

    if (lossMakingHoldings.length > 0) {
      suggestions.push({
        type: 'tax_loss_harvesting',
        priority: 'high',
        title: 'Tax Loss Harvesting Opportunity',
        description: `${lossMakingHoldings.length} holdings are showing losses that can be booked to offset gains`,
        potentialSavings: this.calculateLossHarvestingSavings(lossMakingHoldings),
        holdings: lossMakingHoldings.map(h => ({
          symbol: h.symbol,
          currentLoss: h.currentValue - h.averageCost
        }))
      });
    }

    // Check for holding period optimization
    const nearOneYearHoldings = currentHoldings.filter(holding => {
      const holdingDays = this.calculateHoldingPeriod(holding.purchaseDate, new Date());
      return holdingDays >= 300 && holdingDays < 365 && holding.averageCost < holding.currentValue;
    });

    if (nearOneYearHoldings.length > 0) {
      suggestions.push({
        type: 'holding_period_optimization',
        priority: 'medium',
        title: 'Long-Term Capital Gains Benefits Available Soon',
        description: `${nearOneYearHoldings.length} holdings are close to 1-year holding period for lower tax rates`,
        holdings: nearOneYearHoldings.map(h => ({
          symbol: h.symbol,
          daysToLTCG: 365 - this.calculateHoldingPeriod(h.purchaseDate, new Date()),
          taxBenefit: this.calculateLTCGTaxBenefit(h)
        }))
      });
    }

    return suggestions;
  }

  /**
   * Helper methods
   */
  encryptCredentials(credentials) {
    // In production, use proper encryption
    return {
      ...credentials,
      encrypted: true
    };
  }

  determineSegment(transaction) {
    const symbol = transaction.symbol?.toUpperCase() || '';

    if (symbol.endsWith('-EQ') || symbol.includes('EQUITY') || transaction.instrumentType === 'EQUITY') {
      return 'EQUITY';
    } else if (symbol.includes('DEBT') || transaction.instrumentType === 'DEBT') {
      return 'DEBT';
    } else if (symbol.includes('MF') || transaction.instrumentType === 'MUTUAL_FUND') {
      return 'MUTUAL_FUND';
    } else if (symbol.includes('COMMODITY')) {
      return 'COMMODITY';
    } else {
      return 'OTHER';
    }
  }

  calculateTotalCharges(transaction) {
    return parseFloat(transaction.brokerage || 0) +
           parseFloat(transaction.charges || 0) +
           parseFloat(transaction.stt || 0) +
           parseFloat(transaction.gst || 0);
  }

  calculateHoldingPeriod(buyDate, sellDate) {
    return Math.floor((sellDate - buyDate) / (1000 * 60 * 60 * 24));
  }

  calculateGainsSummary(capitalGains) {
    const shortTermGains = capitalGains.shortTerm.reduce((sum, g) => sum + g.capitalGain, 0);
    const longTermGains = capitalGains.longTerm.reduce((sum, g) => sum + g.capitalGain, 0);
    const exemptLongTermGains = capitalGains.longTerm
      .filter(g => g.exempt)
      .reduce((sum, g) => sum + g.capitalGain, 0);

    const totalGains = Math.max(0, shortTermGains) + Math.max(0, longTermGains);
    const totalLosses = Math.min(0, shortTermGains) + Math.min(0, longTermGains);
    const netGains = totalGains + totalLosses;

    const shortTermTax = this.calculateSTTaxLiability(capitalGains.shortTerm);
    const longTermTax = this.calculateLTTaxLiability(capitalGains.longTerm);
    const taxLiability = shortTermTax + longTermTax;

    return {
      shortTermGains: Math.max(0, shortTermGains),
      longTermGains: Math.max(0, longTermGains),
      exemptLongTermGains,
      totalGains,
      totalLosses: Math.abs(totalLosses),
      netGains,
      taxLiability,
      effectiveTaxRate: netGains > 0 ? (taxLiability / netGains) * 100 : 0
    };
  }

  calculateSTTaxLiability(shortTermGains) {
    return shortTermGains
      .filter(g => g.capitalGain > 0)
      .reduce((sum, g) => sum + g.tax, 0);
  }

  calculateLTTaxLiability(longTermGains) {
    return longTermGains
      .filter(g => g.capitalGain > 0 && !g.exempt)
      .reduce((sum, g) => sum + g.tax, 0);
  }

  getCurrentHoldings() {
    // This would fetch current holdings from the broker API
    return [];
  }

  calculateLossHarvestingSavings(lossMakingHoldings) {
    const totalLoss = lossMakingHoldings.reduce((sum, h) =>
      sum + Math.abs(h.currentValue - h.averageCost), 0);
    return totalLoss * 0.15; // Assuming 15% STCG rate
  }

  calculateLTCGTaxBenefit(holding) {
    const unrealizedGain = holding.currentValue - holding.averageCost;
    const stcgTax = unrealizedGain * 0.15; // 15% STCG
    const ltcgTax = Math.max(0, (unrealizedGain - 100000)) * 0.10; // 10% LTCG above ₹1 lakh
    return Math.max(0, stcgTax - ltcgTax);
  }

  calculateHoldingTaxImplications(holding) {
    const holdingPeriod = this.calculateHoldingPeriod(holding.purchaseDate, new Date());
    const isLongTerm = holdingPeriod > 365;
    const unrealizedGain = (holding.currentPrice - holding.averageCost) * holding.quantity;

    return {
      holdingPeriod,
      isLongTerm,
      unrealizedGain,
      taxRate: isLongTerm ?
        (holding.segment === 'EQUITY' ? 0.10 : 0.20) :
        (holding.segment === 'EQUITY' ? 0.15 : 0.30),
      potentialTax: this.calculateTaxOnGain(unrealizedGain, isLongTerm ? 'LONG_TERM' : 'SHORT_TERM', false, holding.segment)
    };
  }

  calculateUnrealizedGains(holding) {
    return (holding.currentPrice - holding.averageCost) * holding.quantity;
  }

  generateHoldingsSummary(holdings) {
    const totalValue = holdings.reduce((sum, h) => sum + h.totalValue, 0);
    const totalUnrealizedGains = holdings.reduce((sum, h) => sum + h.unrealizedGains, 0);
    const totalCost = holdings.reduce((sum, h) => sum + h.averageCost * h.quantity, 0);

    return {
      totalHoldings: holdings.length,
      totalValue,
      totalCost,
      totalUnrealizedGains,
      unrealizedGainPercentage: totalCost > 0 ? (totalUnrealizedGains / totalCost) * 100 : 0
    };
  }
}

// Export singleton instances for each broker
export const createBrokerService = (brokerCode) => new BrokerAPIService(brokerCode);

export default BrokerAPIService;

