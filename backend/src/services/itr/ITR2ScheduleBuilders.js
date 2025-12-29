// =====================================================
// ITR-2 SCHEDULE BUILDERS
// Builders for ITR-2 specific schedules (CG, HP, EI, FA, AL)
// =====================================================

const { ForeignAsset } = require('../../models');
const enterpriseLogger = require('../../utils/logger');
const ITRJsonBuilders = require('./ITRJsonBuilders');

// Use formatDateForITD from ITRJsonBuilders
const formatDateForITD = (date) => ITRJsonBuilders.formatDateForITD(date);

class ITR2ScheduleBuilders {
  /**
   * Build Schedule CG (Capital Gains)
   * @param {object} sectionSnapshot - Section snapshot
   * @param {object} computationResult - Computation result (for validation)
   * @returns {object} Schedule CG structure or null if no gains
   */
  buildScheduleCG(sectionSnapshot, computationResult = {}) {
    const income = sectionSnapshot.income || {};
    const capitalGains = income.capitalGains || {};

    // Check if capital gains exist
    const hasSTCG = capitalGains.stcgDetails && Array.isArray(capitalGains.stcgDetails) && capitalGains.stcgDetails.length > 0;
    const hasLTCG = capitalGains.ltcgDetails && Array.isArray(capitalGains.ltcgDetails) && capitalGains.ltcgDetails.length > 0;

    if (!hasSTCG && !hasLTCG) {
      // Return empty schedule structure (required by schema)
      return {
        STCG: {
          entries: [],
          total: '0.00',
        },
        LTCG: {
          entries: [],
          total: '0.00',
        },
        TotalCapitalGains: '0.00',
      };
    }

    // Build STCG entries
    const stcgEntries = [];
    let stcgTotal = 0;

    if (hasSTCG) {
      for (const entry of capitalGains.stcgDetails) {
        const gainAmount = parseFloat(entry.gainAmount || 0);
        stcgTotal += gainAmount;

        // Determine section code (111A for equity/MF, non-111A for others)
        const sectionCode = this.getSTCGSectionCode(entry.assetType);

        stcgEntries.push({
          AssetType: this.formatAssetType(entry.assetType),
          ISIN: entry.isin || entry.ISIN || '',
          PurchaseDate: formatDateForITD(entry.purchaseDate),
          SaleDate: formatDateForITD(entry.saleDate),
          SaleConsideration: this.formatAmount(entry.saleValue || 0),
          CostOfAcquisition: this.formatAmount(entry.purchaseValue || entry.indexedCost || 0),
          ExpensesOnTransfer: this.formatAmount(entry.expenses || 0),
          GainAmount: this.formatAmount(gainAmount),
          SectionCode: sectionCode,
        });
      }
    }

    // Build LTCG entries
    const ltcgEntries = [];
    let ltcgTotal = 0;

    if (hasLTCG) {
      for (const entry of capitalGains.ltcgDetails) {
        const gainAmount = parseFloat(entry.gainAmount || 0);
        ltcgTotal += gainAmount;

        // Determine section code (112A for equity/MF with exemption, 112 for others)
        const sectionCode = this.getLTCGSectionCode(entry.assetType, gainAmount);

        ltcgEntries.push({
          AssetType: this.formatAssetType(entry.assetType),
          ISIN: entry.isin || entry.ISIN || '',
          PurchaseDate: formatDateForITD(entry.purchaseDate),
          SaleDate: formatDateForITD(entry.saleDate),
          SaleConsideration: this.formatAmount(entry.saleValue || 0),
          IndexedCostOfAcquisition: this.formatAmount(entry.indexedCost || entry.purchaseValue || 0),
          ExpensesOnTransfer: this.formatAmount(entry.expenses || 0),
          GainAmount: this.formatAmount(gainAmount),
          SectionCode: sectionCode,
          ExemptionAmount: this.formatAmount(entry.exemptionAmount || 0), // 54, 54F, etc.
        });
      }
    }

    return {
      STCG: {
        entries: stcgEntries,
        total: this.formatAmount(stcgTotal),
      },
      LTCG: {
        entries: ltcgEntries,
        total: this.formatAmount(ltcgTotal),
      },
      TotalCapitalGains: this.formatAmount(stcgTotal + ltcgTotal),
    };
  }

  /**
   * Build Schedule HP (House Property) - Multiple Properties
   * @param {object} sectionSnapshot - Section snapshot
   * @param {object} computationResult - Computation result (for validation)
   * @returns {Array} Array of HP objects
   */
  buildScheduleHP(sectionSnapshot, computationResult = {}) {
    const income = sectionSnapshot.income || {};
    const houseProperty = income.houseProperty || {};

    // ITR-2 allows multiple properties
    let properties = [];

    if (Array.isArray(houseProperty.properties)) {
      properties = houseProperty.properties;
    } else if (houseProperty.properties && typeof houseProperty.properties === 'object') {
      // Single property wrapped in object
      properties = [houseProperty.properties];
    } else if (houseProperty.annualRentalIncome || houseProperty.annualValue) {
      // Single property format
      properties = [houseProperty];
    }

    if (properties.length === 0) {
      return [];
    }

    // Build HP entries for each property
    const hpEntries = [];

    for (const property of properties) {
      const annualValue = parseFloat(property.annualRentalIncome || property.annualValue || 0);
      const municipalTaxes = parseFloat(property.municipalTaxes || 0);
      const interestOnLoan = parseFloat(property.interestOnLoan || 0);
      const isSelfOccupied = property.isSelfOccupied || property.occupancyType === 'self_occupied';

      // Calculate net annual value
      const netAnnualValue = Math.max(0, annualValue - municipalTaxes);

      // Interest deduction u/s 24 (max 200000 for let-out, full for self-occupied)
      let deductionUs24 = 0;
      if (isSelfOccupied) {
        deductionUs24 = interestOnLoan; // Full deduction for self-occupied
      } else {
        deductionUs24 = Math.min(interestOnLoan, 200000); // Max 200000 for let-out
      }

      // Calculate income from house property (can be negative, but show as 0 for self-occupied loss)
      let incomeFromHP = netAnnualValue - deductionUs24;
      if (isSelfOccupied && incomeFromHP < 0) {
        incomeFromHP = 0; // Self-occupied loss is not shown in ITR-2
      }

      hpEntries.push({
        PropertyType: isSelfOccupied ? 'Self-Occupied' : 'Let-Out',
        AnnualValue: this.formatAmount(annualValue),
        MunicipalTaxes: this.formatAmount(municipalTaxes),
        NetAnnualValue: this.formatAmount(netAnnualValue),
        InterestOnLoan: this.formatAmount(interestOnLoan),
        DeductionUs24: this.formatAmount(deductionUs24),
        IncomeFromHP: this.formatAmount(incomeFromHP),
        PropertyAddress: property.address || property.propertyAddress || '',
      });
    }

    return hpEntries;
  }

  /**
   * Build Schedule EI (Exempt Income)
   * @param {object} sectionSnapshot - Section snapshot
   * @returns {object} Schedule EI structure
   */
  buildScheduleEI(sectionSnapshot) {
    const exemptIncome = sectionSnapshot.exemptIncome || sectionSnapshot.exempt_income || {};
    const agriculturalIncome = exemptIncome.agriculturalIncome || {};
    const netAgriculturalIncome = parseFloat(
      agriculturalIncome.netAgriculturalIncome ||
      exemptIncome.netAgriculturalIncome ||
      sectionSnapshot.income?.agriculturalIncome ||
      0
    );

    const entries = [];
    let totalExemptIncome = 0;

    // Agricultural income (critical: must include if > ₹5,000)
    if (netAgriculturalIncome > 0) {
      entries.push({
        IncomeType: 'Agricultural Income',
        Amount: this.formatAmount(netAgriculturalIncome),
        Section: '10(1)',
      });
      totalExemptIncome += netAgriculturalIncome;
    }

    // PPF interest
    if (exemptIncome.ppfInterest) {
      const ppfInterest = parseFloat(exemptIncome.ppfInterest || 0);
      if (ppfInterest > 0) {
        entries.push({
          IncomeType: 'PPF Interest',
          Amount: this.formatAmount(ppfInterest),
          Section: '10(15)',
        });
        totalExemptIncome += ppfInterest;
      }
    }

    // Tax-free bonds
    if (exemptIncome.taxFreeBonds) {
      const taxFreeBonds = parseFloat(exemptIncome.taxFreeBonds || 0);
      if (taxFreeBonds > 0) {
        entries.push({
          IncomeType: 'Tax-Free Bonds',
          Amount: this.formatAmount(taxFreeBonds),
          Section: '10(15)',
        });
        totalExemptIncome += taxFreeBonds;
      }
    }

    // Dividends (if exempt - old regime)
    if (exemptIncome.exemptDividends) {
      const exemptDividends = parseFloat(exemptIncome.exemptDividends || 0);
      if (exemptDividends > 0) {
        entries.push({
          IncomeType: 'Exempt Dividends',
          Amount: this.formatAmount(exemptDividends),
          Section: '10(34)',
        });
        totalExemptIncome += exemptDividends;
      }
    }

    // Other exempt incomes
    if (exemptIncome.exemptIncomes && Array.isArray(exemptIncome.exemptIncomes)) {
      for (const exempt of exemptIncome.exemptIncomes) {
        const amount = parseFloat(exempt.amount || 0);
        if (amount > 0) {
          entries.push({
            IncomeType: exempt.type || exempt.incomeType || 'Other Exempt Income',
            Amount: this.formatAmount(amount),
            Section: exempt.section || '10',
          });
          totalExemptIncome += amount;
        }
      }
    }

    return {
      ExemptIncome: {
        entries,
        total: this.formatAmount(totalExemptIncome),
      },
    };
  }

  /**
   * Build Schedule FA (Foreign Assets) - Conditional
   * @param {object} sectionSnapshot - Section snapshot
   * @param {string} filingId - Filing ID to fetch foreign assets
   * @returns {Promise<object|null>} Schedule FA structure or null if no foreign assets
   */
  async buildScheduleFA(sectionSnapshot, filingId = null) {
    try {
      // Check if scheduleFA exists in snapshot
      let scheduleFA = sectionSnapshot.scheduleFA || sectionSnapshot.schedule_fa;

      // If not in snapshot and filingId provided, fetch from database
      if (!scheduleFA && filingId) {
        try {
          const foreignAssets = await ForeignAsset.findAll({
            where: {
              filingId,
            },
            order: [['created_at', 'ASC']],
          });

          if (foreignAssets && foreignAssets.length > 0) {
            scheduleFA = {
              assets: foreignAssets.map(asset => ({
                assetType: asset.assetType,
                country: asset.country,
                assetDetails: asset.assetDetails,
                valuationDate: asset.valuationDate,
                valuationAmountInr: parseFloat(asset.valuationAmountInr || 0),
                valuationAmountForeign: parseFloat(asset.valuationAmountForeign || 0),
                currency: asset.currency || asset.assetDetails?.currency || '',
              })),
            };
          }
        } catch (dbError) {
          enterpriseLogger.warn('Failed to fetch foreign assets from database', {
            filingId,
            error: dbError.message,
          });
        }
      }

      // If no foreign assets, return null (schedule will be omitted)
      if (!scheduleFA || !scheduleFA.assets || scheduleFA.assets.length === 0) {
        return null;
      }

      // Group assets by type
      const bankAccounts = [];
      const equityHoldings = [];
      const immovableProperties = [];
      const otherAssets = [];
      let totalValue = 0;

      for (const asset of scheduleFA.assets) {
        const assetType = asset.assetType || asset.asset_type;
        const assetDetails = asset.assetDetails || asset.asset_details || {};
        const valuationAmountInr = parseFloat(asset.valuationAmountInr || asset.valuation_amount_inr || 0);
        const valuationAmountForeign = parseFloat(asset.valuationAmountForeign || asset.valuation_amount_foreign || 0);
        const currency = asset.currency || assetDetails.currency || '';

        totalValue += valuationAmountInr;

        const assetData = {
          Country: asset.country || '',
          ValuationDate: formatDateForITD(asset.valuationDate || asset.valuation_date),
          ValuationAmountINR: this.formatAmount(valuationAmountInr),
          ValuationAmountForeign: this.formatAmount(valuationAmountForeign),
          Currency: currency,
        };

        switch (assetType) {
          case 'bank_account':
            bankAccounts.push({
              ...assetData,
              BankName: assetDetails.bankName || assetDetails.bank_name || '',
              AccountNumber: assetDetails.accountNumber || assetDetails.account_number || '',
              AccountType: assetDetails.accountType || assetDetails.account_type || '',
            });
            break;
          case 'equity_holding':
            equityHoldings.push({
              ...assetData,
              CompanyName: assetDetails.companyName || assetDetails.company_name || '',
              NumberOfShares: assetDetails.numberOfShares || assetDetails.number_of_shares || 0,
            });
            break;
          case 'immovable_property':
            immovableProperties.push({
              ...assetData,
              PropertyAddress: assetDetails.address || assetDetails.propertyAddress || '',
              PropertyType: assetDetails.propertyType || assetDetails.property_type || '',
            });
            break;
          case 'other':
            otherAssets.push({
              ...assetData,
              AssetDescription: assetDetails.description || assetDetails.assetDescription || '',
            });
            break;
        }
      }

      return {
        BankAccounts: bankAccounts,
        EquityHoldings: equityHoldings,
        ImmovableProperties: immovableProperties,
        OtherAssets: otherAssets,
        TotalValue: this.formatAmount(totalValue),
      };
    } catch (error) {
      enterpriseLogger.error('Error building Schedule FA', {
        error: error.message,
        stack: error.stack,
        filingId,
      });
      // Return null on error (schedule will be omitted)
      return null;
    }
  }

  /**
   * Build Schedule AL (Assets & Liabilities) - Conditional
   * @param {object} sectionSnapshot - Section snapshot
   * @param {object} computationResult - Computation result (to check income threshold)
   * @returns {object|null} Schedule AL structure or null if not applicable
   */
  buildScheduleAL(sectionSnapshot, computationResult = {}) {
    // Schedule AL is required per schema - always return structure (even if empty)
    // Note: Per ITD rules, Schedule AL is mandatory for ITR-2 and ITR-3
    const grossTotalIncome = parseFloat(computationResult.grossTotalIncome || 0);
    const incomeThreshold = 5000000; // ₹50 lakh

    // If income is below threshold, return empty structure (still required per schema)
    if (grossTotalIncome < incomeThreshold) {
      return {
        Assets: {
          CurrentAssets: { Total: '0.00' },
          FixedAssets: { Total: '0.00' },
          Investments: '0.00',
          LoansAdvances: '0.00',
          TotalAssets: '0.00',
        },
        Liabilities: {
          CurrentLiabilities: { Total: '0.00' },
          LongTermLiabilities: { Total: '0.00' },
          Capital: '0.00',
          TotalLiabilities: '0.00',
        },
      };
    }

    // Get assets and liabilities from snapshot
    const assets = sectionSnapshot.assets || sectionSnapshot.assetsAndLiabilities?.assets || {};
    const liabilities = sectionSnapshot.liabilities || sectionSnapshot.assetsAndLiabilities?.liabilities || {};

    // Build assets structure
    const assetsStructure = {
      CurrentAssets: {
        Cash: this.formatAmount(assets.currentAssets?.cash || 0),
        Bank: this.formatAmount(assets.currentAssets?.bank || 0),
        Inventory: this.formatAmount(assets.currentAssets?.inventory || 0),
        Receivables: this.formatAmount(assets.currentAssets?.receivables || 0),
        Other: this.formatAmount(assets.currentAssets?.other || 0),
        Total: this.formatAmount(assets.currentAssets?.total || 0),
      },
      FixedAssets: {
        Building: this.formatAmount(assets.fixedAssets?.building || 0),
        Machinery: this.formatAmount(assets.fixedAssets?.machinery || 0),
        Vehicles: this.formatAmount(assets.fixedAssets?.vehicles || 0),
        Furniture: this.formatAmount(assets.fixedAssets?.furniture || 0),
        Other: this.formatAmount(assets.fixedAssets?.other || 0),
        Total: this.formatAmount(assets.fixedAssets?.total || 0),
      },
      Investments: this.formatAmount(assets.investments || 0),
      LoansAdvances: this.formatAmount(assets.loansAdvances || assets.loans_advances || 0),
      TotalAssets: this.formatAmount(assets.total || 0),
    };

    // Build liabilities structure
    const liabilitiesStructure = {
      CurrentLiabilities: {
        Creditors: this.formatAmount(liabilities.currentLiabilities?.creditors || 0),
        BankOverdraft: this.formatAmount(liabilities.currentLiabilities?.bankOverdraft || 0),
        ShortTermLoans: this.formatAmount(liabilities.currentLiabilities?.shortTermLoans || 0),
        Other: this.formatAmount(liabilities.currentLiabilities?.other || 0),
        Total: this.formatAmount(liabilities.currentLiabilities?.total || 0),
      },
      LongTermLiabilities: {
        LongTermLoans: this.formatAmount(liabilities.longTermLiabilities?.longTermLoans || 0),
        Other: this.formatAmount(liabilities.longTermLiabilities?.other || 0),
        Total: this.formatAmount(liabilities.longTermLiabilities?.total || 0),
      },
      Capital: this.formatAmount(liabilities.capital || 0),
      TotalLiabilities: this.formatAmount(liabilities.total || 0),
    };

    return {
      Assets: assetsStructure,
      Liabilities: liabilitiesStructure,
    };
  }

  // =====================================================
  // HELPER METHODS
  // =====================================================

  /**
   * Get STCG section code based on asset type
   * @param {string} assetType - Asset type
   * @returns {string} Section code (111A or non-111A)
   */
  getSTCGSectionCode(assetType) {
    // Section 111A applies to equity shares and equity-oriented mutual funds
    if (assetType === 'equity_shares' || assetType === 'mutual_funds') {
      return '111A';
    }
    return 'non-111A';
  }

  /**
   * Get LTCG section code based on asset type and gain amount
   * @param {string} assetType - Asset type
   * @param {number} gainAmount - Gain amount
   * @returns {string} Section code (112A or 112)
   */
  getLTCGSectionCode(assetType, gainAmount) {
    // Section 112A applies to equity shares and equity-oriented mutual funds with exemption up to ₹1 lakh
    if (assetType === 'equity_shares' || assetType === 'mutual_funds') {
      if (gainAmount <= 100000) {
        return '112A'; // Exempt up to ₹1 lakh
      }
      return '112A'; // Still 112A but taxable above ₹1 lakh
    }
    return '112'; // Other assets
  }

  /**
   * Format asset type for ITD
   * @param {string} assetType - Asset type
   * @returns {string} Formatted asset type
   */
  formatAssetType(assetType) {
    const typeMap = {
      'equity_shares': 'Equity Shares',
      'mutual_funds': 'Mutual Funds',
      'property': 'Property',
      'bonds': 'Bonds',
      'other': 'Other',
    };
    return typeMap[assetType] || assetType || 'Other';
  }

  /**
   * Format amount as string with 2 decimal places
   * @param {number|string} amount - Amount to format
   * @returns {string} Formatted amount string
   */
  formatAmount(amount) {
    const numAmount = parseFloat(amount || 0);
    if (isNaN(numAmount)) {
      return '0.00';
    }
    return numAmount.toFixed(2);
  }
}

module.exports = new ITR2ScheduleBuilders();

