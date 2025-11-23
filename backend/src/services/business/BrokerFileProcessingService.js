// =====================================================
// BROKER FILE PROCESSING SERVICE (Backend)
// Processes broker files server-side with enhanced validation
// =====================================================

const XLSX = require('xlsx');
const enterpriseLogger = require('../utils/logger');
const { AppError } = require('../middleware/errorHandler');

class BrokerFileProcessingService {
  constructor() {
    this.supportedBrokers = ['zerodha', 'angelone', 'groww', 'upstox', 'icici'];
  }

  async processFile(fileBuffer, brokerId, userId) {
    try {
      if (!this.supportedBrokers.includes(brokerId)) {
        throw new AppError(`Unsupported broker: ${brokerId}`, 400);
      }

      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(worksheet);

      const processor = this.getProcessor(brokerId);
      const result = await processor(data);

      // Validate the processed data
      this.validateCapitalGains(result);

      enterpriseLogger.info('Broker file processed successfully', {
        brokerId,
        userId,
        transactionCount: result.transactions.length
      });

      return result;
    } catch (error) {
      enterpriseLogger.error('Broker file processing failed', {
        brokerId,
        userId,
        error: error.message
      });
      throw error;
    }
  }

  getProcessor(brokerId) {
    const processors = {
      zerodha: this.processZerodha.bind(this),
      angelone: this.processAngelOne.bind(this),
      groww: this.processGroww.bind(this),
      upstox: this.processUpstox.bind(this),
      icici: this.processICICI.bind(this)
    };

    return processors[brokerId];
  }

  processZerodha(data) {
    const transactions = [];
    let shortTermTotal = 0;
    let longTermTotal = 0;
    let exemptLongTermTotal = 0;

    data.forEach(row => {
      const transaction = {
        symbol: row['Symbol'] || row['symbol'],
        buyDate: this.parseDate(row['Buy Date'] || row['buy_date']),
        sellDate: this.parseDate(row['Sell Date'] || row['sell_date']),
        buyPrice: parseFloat(row['Buy Price'] || row['buy_price'] || 0),
        sellPrice: parseFloat(row['Sell Price'] || row['sell_price'] || 0),
        quantity: parseFloat(row['Quantity'] || row['quantity'] || 0),
        profit: parseFloat(row['P&L'] || row['profit'] || 0),
        sttPaid: row['STT Paid'] === 'Yes',
        type: this.determineTransactionType(
          row['Buy Date'] || row['buy_date'],
          row['Sell Date'] || row['sell_date']
        )
      };

      transaction.exempt = this.isExempt(transaction);
      transactions.push(transaction);

      if (transaction.type === 'short_term') {
        shortTermTotal += transaction.profit;
      } else if (transaction.exempt) {
        exemptLongTermTotal += transaction.profit;
      } else {
        longTermTotal += transaction.profit;
      }
    });

    return {
      transactions,
      shortTerm: Math.round(shortTermTotal * 100) / 100,
      longTerm: Math.round(longTermTotal * 100) / 100,
      exemptLongTerm: Math.round(exemptLongTermTotal * 100) / 100,
      totalGains: Math.round((shortTermTotal + longTermTotal + exemptLongTermTotal) * 100) / 100
    };
  }

  processAngelOne(data) {
    const transactions = [];
    let shortTermTotal = 0;
    let longTermTotal = 0;
    let exemptLongTermTotal = 0;

    data.forEach(row => {
      const transaction = {
        symbol: row['Scrip'] || row['Symbol'],
        buyDate: this.parseDate(row['Purchase Date'] || row['Buy Date']),
        sellDate: this.parseDate(row['Sale Date'] || row['Sell Date']),
        buyPrice: parseFloat(row['Purchase Rate'] || 0),
        sellPrice: parseFloat(row['Sale Rate'] || 0),
        quantity: parseFloat(row['Qty'] || 0),
        profit: parseFloat(row['Profit/Loss'] || 0),
        sttPaid: true, // Assume STT paid for Angel One
        type: this.determineTransactionType(
          row['Purchase Date'] || row['Buy Date'],
          row['Sale Date'] || row['Sell Date']
        )
      };

      transaction.exempt = this.isExempt(transaction);
      transactions.push(transaction);

      if (transaction.type === 'short_term') {
        shortTermTotal += transaction.profit;
      } else if (transaction.exempt) {
        exemptLongTermTotal += transaction.profit;
      } else {
        longTermTotal += transaction.profit;
      }
    });

    return {
      transactions,
      shortTerm: Math.round(shortTermTotal * 100) / 100,
      longTerm: Math.round(longTermTotal * 100) / 100,
      exemptLongTerm: Math.round(exemptLongTermTotal * 100) / 100,
      totalGains: Math.round((shortTermTotal + longTermTotal + exemptLongTermTotal) * 100) / 100
    };
  }

  processGroww(data) {
    // Similar structure to Zerodha
    return this.processZerodha(data);
  }

  processUpstox(data) {
    // Similar structure to Zerodha
    return this.processZerodha(data);
  }

  processICICI(data) {
    // Similar structure to Zerodha
    return this.processZerodha(data);
  }

  parseDate(dateString) {
    if (!dateString) return null;
    const date = new Date(dateString);
    return isNaN(date) ? null : date.toISOString().split('T')[0];
  }

  determineTransactionType(buyDate, sellDate) {
    const buy = new Date(buyDate);
    const sell = new Date(sellDate);
    const daysDiff = Math.floor((sell - buy) / (1000 * 60 * 60 * 24));
    
    // Less than 365 days = short term, otherwise long term
    return daysDiff < 365 ? 'short_term' : 'long_term';
  }

  isExempt(transaction) {
    // STT paid on listed securities qualifies for exemption
    return transaction.sttPaid && transaction.type === 'long_term';
  }

  validateCapitalGains(result) {
    if (!result.transactions || !Array.isArray(result.transactions)) {
      throw new AppError('Invalid transaction data', 400);
    }

    if (result.transactions.length === 0) {
      throw new AppError('No transactions found in file', 400);
    }

    // Validate each transaction
    result.transactions.forEach((transaction, index) => {
      if (!transaction.symbol) {
        throw new AppError(`Transaction ${index + 1}: Symbol is required`, 400);
      }
      if (!transaction.buyDate || !transaction.sellDate) {
        throw new AppError(`Transaction ${index + 1}: Buy and sell dates are required`, 400);
      }
      if (transaction.buyPrice < 0 || transaction.sellPrice < 0) {
        throw new AppError(`Transaction ${index + 1}: Invalid price values`, 400);
      }
    });

    return true;
  }
}

module.exports = new BrokerFileProcessingService();

