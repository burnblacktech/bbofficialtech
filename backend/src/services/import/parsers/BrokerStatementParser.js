/**
 * BrokerStatementParser — Parses CSV exports from Indian brokers into capital gains transactions.
 * Supports: Zerodha, Groww, Angel One, Upstox, and generic CSV auto-detection.
 */

const { AppError } = require('../../../middleware/errorHandler');
const ErrorCodes = require('../../../constants/ErrorCodes');

const BROKER_HEADERS = {
  zerodha: ['trade_date', 'symbol', 'trade_type', 'quantity', 'price', 'trade_value', 'brokerage'],
  groww: ['symbol', 'buy date', 'buy price', 'sell date', 'sell price', 'quantity', 'p&l'],
  angelone: ['scripname', 'buydate', 'buyrate', 'selldate', 'sellrate', 'qty', 'profit'],
};

const GENERIC_COL_MAP = {
  symbol: ['symbol', 'scrip', 'scripname', 'stock', 'instrument', 'name'],
  buyDate: ['buy date', 'buydate', 'purchase date', 'buy_date'],
  sellDate: ['sell date', 'selldate', 'sale date', 'sell_date', 'trade_date'],
  buyPrice: ['buy price', 'buyprice', 'buyrate', 'purchase price', 'buy_price', 'cost'],
  sellPrice: ['sell price', 'sellprice', 'sellrate', 'sale price', 'sell_price', 'price'],
  quantity: ['quantity', 'qty', 'units', 'shares'],
  brokerage: ['brokerage', 'charges', 'commission', 'expenses'],
  pnl: ['p&l', 'profit', 'pnl', 'gain', 'profit/loss'],
};

const n = (v) => {
  if (v == null || v === '') return 0;
  const cleaned = String(v).replace(/[₹,\s]/g, '');
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : 0;
};

const parseDate = (v) => {
  if (!v) return null;
  const s = String(v).trim();
  // DD-MM-YYYY or DD/MM/YYYY
  const dmy = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmy) return new Date(+dmy[3], +dmy[2] - 1, +dmy[1]);
  // YYYY-MM-DD
  const ymd = s.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/);
  if (ymd) return new Date(+ymd[1], +ymd[2] - 1, +ymd[3]);
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
};

const parseCSV = (text) => {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (!lines.length) return { headers: [], rows: [] };
  const headers = lines[0].split(',').map((h) => h.trim().replace(/^["']|["']$/g, ''));
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const vals = lines[i].split(',').map((v) => v.trim().replace(/^["']|["']$/g, ''));
    if (vals.every((v) => !v)) continue;
    const row = {};
    headers.forEach((h, idx) => (row[h] = vals[idx] || ''));
    rows.push(row);
  }
  return { headers, rows };
};

class BrokerStatementParser {
  static async parse(buffer, brokerHint) {
    const text = Buffer.isBuffer(buffer) ? buffer.toString('utf-8') : String(buffer);
    const { headers, rows } = parseCSV(text);

    if (!headers.length) {
      throw new AppError('Empty or unreadable CSV file', 400, ErrorCodes?.VALIDATION_ERROR || 'VALIDATION_ERROR');
    }

    const broker = brokerHint || this.detectBroker(headers);
    const warnings = [];
    let transactions;

    switch (broker) {
      case 'zerodha':
        transactions = this.parseZerodha(rows, warnings);
        break;
      case 'groww':
        transactions = this.parseGroww(rows, warnings);
        break;
      case 'angelone':
        transactions = this.parseAngelOne(rows, warnings);
        break;
      default:
        transactions = this.parseGeneric(headers, rows, warnings);
    }

    const summary = { totalSTCG: 0, totalLTCG: 0, totalGain: 0 };
    for (const t of transactions) {
      if (t.gainType === 'STCG') summary.totalSTCG += t.gain;
      else summary.totalLTCG += t.gain;
      summary.totalGain += t.gain;
    }

    const result = { transactions, summary, broker, warnings };
    return result;
  }

  static detectBroker(headers) {
    const lower = headers.map((h) => h.toLowerCase());
    for (const [broker, keys] of Object.entries(BROKER_HEADERS)) {
      if (keys.every((k) => lower.includes(k))) return broker;
    }
    return 'generic';
  }

  static parseZerodha(rows, warnings) {
    // Zerodha P&L exports have buy/sell as separate rows — pair them by symbol
    const buys = {};
    const transactions = [];

    for (const row of rows) {
      const type = (row.trade_type || '').toLowerCase();
      const symbol = row.symbol || '';
      if (!symbol) continue;

      if (type === 'buy') {
        if (!buys[symbol]) buys[symbol] = [];
        buys[symbol].push(row);
      } else if (type === 'sell') {
        const buyRow = buys[symbol]?.shift();
        const buyDate = parseDate(buyRow?.trade_date);
        const sellDate = parseDate(row.trade_date);
        const qty = n(row.quantity);
        const sellPrice = n(row.price);
        const buyPrice = n(buyRow?.price);
        const brokerage = n(row.brokerage) + n(buyRow?.brokerage);

        if (!buyRow) {
          warnings.push(`No matching buy for sell of ${symbol}`);
        }

        transactions.push({
          symbol,
          assetType: this._classifyAsset(symbol, row.segment),
          buyDate,
          sellDate,
          quantity: qty,
          purchaseValue: buyPrice * qty,
          saleValue: sellPrice * qty,
          expenses: brokerage,
          gain: sellPrice * qty - buyPrice * qty - brokerage,
          gainType: this.classifyHoldingPeriod(buyDate, sellDate),
        });
      }
    }
    return transactions;
  }

  static parseGroww(rows, warnings) {
    return rows.map((row) => {
      const buyDate = parseDate(row['Buy Date']);
      const sellDate = parseDate(row['Sell Date']);
      const qty = n(row['Quantity']);
      const buyPrice = n(row['Buy Price']);
      const sellPrice = n(row['Sell Price']);
      const pnl = n(row['P&L']);
      const purchaseValue = buyPrice * qty;
      const saleValue = sellPrice * qty;

      if (!buyDate || !sellDate) {
        warnings.push(`Missing date for ${row['Symbol'] || 'unknown'}`);
      }

      return {
        symbol: row['Symbol'] || '',
        assetType: this._classifyAsset(row['Symbol']),
        buyDate,
        sellDate,
        quantity: qty,
        purchaseValue,
        saleValue,
        expenses: 0,
        gain: pnl || saleValue - purchaseValue,
        gainType: this.classifyHoldingPeriod(buyDate, sellDate),
      };
    });
  }

  static parseAngelOne(rows, warnings) {
    return rows.map((row) => {
      const buyDate = parseDate(row['BuyDate']);
      const sellDate = parseDate(row['SellDate']);
      const qty = n(row['Qty']);
      const buyRate = n(row['BuyRate']);
      const sellRate = n(row['SellRate']);
      const profit = n(row['Profit']);
      const purchaseValue = buyRate * qty;
      const saleValue = sellRate * qty;

      if (!buyDate || !sellDate) {
        warnings.push(`Missing date for ${row['ScripName'] || 'unknown'}`);
      }

      return {
        symbol: row['ScripName'] || '',
        assetType: this._classifyAsset(row['ScripName']),
        buyDate,
        sellDate,
        quantity: qty,
        purchaseValue,
        saleValue,
        expenses: 0,
        gain: profit || saleValue - purchaseValue,
        gainType: this.classifyHoldingPeriod(buyDate, sellDate),
      };
    });
  }

  static parseGeneric(headers, rows, warnings) {
    const colMap = {};
    const lower = headers.map((h) => h.toLowerCase());

    for (const [field, aliases] of Object.entries(GENERIC_COL_MAP)) {
      const idx = lower.findIndex((h) => aliases.includes(h));
      if (idx !== -1) colMap[field] = headers[idx];
    }

    if (!colMap.symbol && !colMap.sellPrice) {
      throw new AppError('No recognizable columns found in CSV', 400, ErrorCodes?.VALIDATION_ERROR || 'VALIDATION_ERROR');
    }

    return rows.map((row) => {
      const buyDate = parseDate(row[colMap.buyDate]);
      const sellDate = parseDate(row[colMap.sellDate]);
      const qty = n(row[colMap.quantity]);
      const buyPrice = n(row[colMap.buyPrice]);
      const sellPrice = n(row[colMap.sellPrice]);
      const brokerage = n(row[colMap.brokerage]);
      const pnl = n(row[colMap.pnl]);
      const purchaseValue = buyPrice * qty;
      const saleValue = sellPrice * qty;

      if (!buyDate && !sellDate) {
        warnings.push(`Missing dates for ${row[colMap.symbol] || 'unknown'}`);
      }

      return {
        symbol: row[colMap.symbol] || '',
        assetType: this._classifyAsset(row[colMap.symbol]),
        buyDate,
        sellDate,
        quantity: qty,
        purchaseValue,
        saleValue,
        expenses: brokerage,
        gain: pnl || saleValue - purchaseValue - brokerage,
        gainType: this.classifyHoldingPeriod(buyDate, sellDate),
      };
    });
  }

  static classifyHoldingPeriod(buyDate, sellDate) {
    if (!buyDate || !sellDate) return 'STCG';
    const ms = sellDate.getTime() - buyDate.getTime();
    const months = ms / (1000 * 60 * 60 * 24 * 30.44);
    return months >= 12 ? 'LTCG' : 'STCG';
  }

  static validate(result) {
    const errors = [];
    if (!result.transactions?.length) errors.push('No transactions parsed');
    for (let i = 0; i < (result.transactions?.length || 0); i++) {
      const t = result.transactions[i];
      if (!t.symbol) errors.push(`Row ${i + 1}: missing symbol`);
      if (!t.sellDate && !t.buyDate) errors.push(`Row ${i + 1}: missing both dates`);
    }
    return { valid: errors.length === 0, errors };
  }

  static _classifyAsset(symbol, segment) {
    if (!symbol) return 'other';
    const s = (symbol + ' ' + (segment || '')).toLowerCase();
    if (s.includes('mf') || s.includes('mutual') || s.includes('fund') || s.includes('nfo')) return 'mutual_fund';
    return 'equity';
  }
}

module.exports = BrokerStatementParser;
