// =====================================================
// BROKER FILE PROCESSOR
// Processes Excel/CSV files from various brokers
// =====================================================

import * as XLSX from 'xlsx';
import { enterpriseLogger } from '../utils/logger';

export class BrokerFileProcessor {
  constructor(brokerId) {
    this.brokerId = brokerId;
    this.processors = {
      zerodha: this.processZerodhaFile.bind(this),
      angelone: this.processAngelOneFile.bind(this),
      groww: this.processGrowwFile.bind(this),
      upstox: this.processUpstoxFile.bind(this),
      icici: this.processICICIFile.bind(this),
    };
  }

  async processFile(file) {
    try {
      const processor = this.processors[this.brokerId];
      if (!processor) {
        throw new Error(`Unsupported broker: ${this.brokerId}`);
      }

      const data = await this.readExcelFile(file);
      const result = await processor(data);

      enterpriseLogger.info('Broker file processed', {
        broker: this.brokerId,
        fileName: file.name,
        transactions: result.transactions.length,
      });

      return result;
    } catch (error) {
      enterpriseLogger.error('Broker file processing failed', {
        broker: this.brokerId,
        fileName: file.name,
        error: error.message,
      });
      throw error;
    }
  }

  async readExcelFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = (error) => reject(error);
      reader.readAsArrayBuffer(file);
    });
  }

  processZerodhaFile(data) {
    const transactions = [];
    let shortTermTotal = 0;
    let longTermTotal = 0;
    let exemptLongTermTotal = 0;

    data.forEach(row => {
      const transaction = {
        symbol: row['Symbol'] || row['symbol'],
        buyDate: row['Buy Date'] || row['buy_date'],
        sellDate: row['Sell Date'] || row['sell_date'],
        buyPrice: parseFloat(row['Buy Price'] || row['buy_price'] || 0),
        sellPrice: parseFloat(row['Sell Price'] || row['sell_price'] || 0),
        quantity: parseFloat(row['Quantity'] || row['quantity'] || 0),
        profit: parseFloat(row['P&L'] || row['profit'] || 0),
        type: this.determineTransactionType(row['Buy Date'], row['Sell Date']),
        exempt: this.isExempt(row),
      };

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
      shortTerm: shortTermTotal,
      longTerm: longTermTotal,
      exemptLongTerm: exemptLongTermTotal,
    };
  }

  processAngelOneFile(data) {
    // Similar structure to Zerodha but different column names
    const transactions = [];
    let shortTermTotal = 0;
    let longTermTotal = 0;
    let exemptLongTermTotal = 0;

    data.forEach(row => {
      const transaction = {
        symbol: row['Scrip'] || row['Symbol'],
        buyDate: row['Purchase Date'] || row['Buy Date'],
        sellDate: row['Sale Date'] || row['Sell Date'],
        buyPrice: parseFloat(row['Purchase Rate'] || 0),
        sellPrice: parseFloat(row['Sale Rate'] || 0),
        quantity: parseFloat(row['Qty'] || 0),
        profit: parseFloat(row['Profit/Loss'] || 0),
        type: this.determineTransactionType(row['Purchase Date'], row['Sale Date']),
        exempt: this.isExempt(row),
      };

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
      shortTerm: shortTermTotal,
      longTerm: longTermTotal,
      exemptLongTerm: exemptLongTermTotal,
    };
  }

  processGrowwFile(data) {
    // Groww file format processing
    const transactions = [];
    let shortTermTotal = 0;
    let longTermTotal = 0;
    let exemptLongTermTotal = 0;

    data.forEach(row => {
      const transaction = {
        symbol: row['Stock Name'] || row['Symbol'],
        buyDate: row['Buy Date'],
        sellDate: row['Sell Date'],
        buyPrice: parseFloat(row['Buy Price'] || 0),
        sellPrice: parseFloat(row['Sell Price'] || 0),
        quantity: parseFloat(row['Quantity'] || 0),
        profit: parseFloat(row['Gain/Loss'] || 0),
        type: this.determineTransactionType(row['Buy Date'], row['Sell Date']),
        exempt: this.isExempt(row),
      };

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
      shortTerm: shortTermTotal,
      longTerm: longTermTotal,
      exemptLongTerm: exemptLongTermTotal,
    };
  }

  processUpstoxFile(data) {
    // Similar to Zerodha
    return this.processZerodhaFile(data);
  }

  processICICIFile(data) {
    // ICICI Direct format processing
    return this.processZerodhaFile(data);
  }

  determineTransactionType(buyDate, sellDate) {
    const buy = new Date(buyDate);
    const sell = new Date(sellDate);
    const daysDiff = Math.floor((sell - buy) / (1000 * 60 * 60 * 24));

    // Less than 365 days = short term, otherwise long term
    return daysDiff < 365 ? 'short_term' : 'long_term';
  }

  isExempt(row) {
    // Check if transaction qualifies for exemption (e.g., STT paid, listed securities)
    // This is a simplified check - actual implementation would need more details
    return row['STT Paid'] === 'Yes' || row['stt_paid'] === true;
  }
}

export default BrokerFileProcessor;

