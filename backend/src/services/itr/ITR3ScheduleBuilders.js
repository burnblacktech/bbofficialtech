// =====================================================
// ITR-3 SCHEDULE BUILDERS
// Builders for ITR-3 specific schedules (BP, P&L, BS, DEP, CYLA, BFLA)
// =====================================================

const enterpriseLogger = require('../../utils/logger');
const ITRJsonBuilders = require('./ITRJsonBuilders');
const BusinessIncomeCalculator = require('./BusinessIncomeCalculator');
const ProfessionalIncomeCalculator = require('./ProfessionalIncomeCalculator');

// Use formatDateForITD from ITRJsonBuilders
const formatDateForITD = (date) => ITRJsonBuilders.formatDateForITD(date);

class ITR3ScheduleBuilders {
  /**
   * Build Schedule BP (Business/Profession)
   * @param {object} sectionSnapshot - Section snapshot
   * @param {object} computationResult - Computation result (for validation)
   * @returns {object} Schedule BP structure
   */
  buildScheduleBP(sectionSnapshot, computationResult = {}) {
    const income = sectionSnapshot.income || {};
    const businessIncome = income.businessIncome || {};
    const professionalIncome = income.professionalIncome || {};

    const businesses = [];
    const professions = [];
    let totalBusinessIncome = 0;
    let totalProfessionalIncome = 0;

    // Process businesses
    if (businessIncome.businesses && Array.isArray(businessIncome.businesses)) {
      for (const business of businessIncome.businesses) {
        const pnl = business.pnl || {};
        const netProfit = parseFloat(pnl.netProfit || 0);
        
        // If netProfit not provided, calculate it
        const calculatedNetProfit = netProfit !== 0 ? netProfit : 
          BusinessIncomeCalculator.calculateNetBusinessIncome(business);

        totalBusinessIncome += calculatedNetProfit;

        businesses.push({
          BusinessName: business.businessName || business.business_name || '',
          NatureOfBusiness: business.businessNature || business.business_nature || '',
          BusinessPAN: business.businessPAN || business.business_pan || '',
          GSTNumber: business.gstNumber || business.gst_number || '',
          GrossReceipts: this.formatAmount(pnl.grossReceipts || 0),
          NetProfit: this.formatAmount(calculatedNetProfit),
          SectionCode: '28', // Section 28 - Business income
        });
      }
    }

    // Process professions
    if (professionalIncome.professions && Array.isArray(professionalIncome.professions)) {
      for (const profession of professionalIncome.professions) {
        const pnl = profession.pnl || {};
        const netIncome = parseFloat(pnl.netIncome || pnl.netProfit || 0);
        
        // If netIncome not provided, calculate it
        const calculatedNetIncome = netIncome !== 0 ? netIncome :
          ProfessionalIncomeCalculator.calculateNetProfessionalIncome(profession);

        totalProfessionalIncome += calculatedNetIncome;

        professions.push({
          ProfessionName: profession.professionName || profession.profession_name || '',
          ProfessionType: profession.professionType || profession.profession_type || '',
          ProfessionalFees: this.formatAmount(pnl.professionalFees || pnl.professional_fees || 0),
          NetIncome: this.formatAmount(calculatedNetIncome),
          SectionCode: '28', // Section 28 - Profession income
        });
      }
    }

    return {
      Businesses: businesses,
      Professions: professions,
      TotalBusinessIncome: this.formatAmount(totalBusinessIncome),
      TotalProfessionalIncome: this.formatAmount(totalProfessionalIncome),
    };
  }

  /**
   * Build Profit & Loss Account (PartA_PL) - MANDATORY
   * @param {object} sectionSnapshot - Section snapshot
   * @param {object} computationResult - Computation result (for validation)
   * @returns {object} PartA_PL structure
   */
  buildProfitAndLoss(sectionSnapshot, computationResult = {}) {
    const income = sectionSnapshot.income || {};
    const businessIncome = income.businessIncome || {};
    const professionalIncome = income.professionalIncome || {};

    // Aggregate P&L from all businesses and professions
    let totalTurnover = 0;
    let totalOpeningStock = 0;
    let totalPurchases = 0;
    let totalClosingStock = 0;
    let totalDirectExpenses = 0;
    let totalIndirectExpenses = 0;
    let totalDepreciation = 0;
    let totalOtherExpenses = 0;

    // Aggregate from businesses
    if (businessIncome.businesses && Array.isArray(businessIncome.businesses)) {
      for (const business of businessIncome.businesses) {
        const pnl = business.pnl || {};
        totalTurnover += parseFloat(pnl.grossReceipts || 0);
        totalOpeningStock += parseFloat(pnl.openingStock || 0);
        totalPurchases += parseFloat(pnl.purchases || 0);
        totalClosingStock += parseFloat(pnl.closingStock || 0);
        totalDirectExpenses += BusinessIncomeCalculator.calculateExpenseTotal(pnl.directExpenses);
        totalIndirectExpenses += BusinessIncomeCalculator.calculateExpenseTotal(pnl.indirectExpenses);
        totalDepreciation += BusinessIncomeCalculator.calculateExpenseTotal(pnl.depreciation);
        totalOtherExpenses += parseFloat(pnl.otherExpenses || 0);
      }
    }

    // Aggregate from professions
    if (professionalIncome.professions && Array.isArray(professionalIncome.professions)) {
      for (const profession of professionalIncome.professions) {
        const pnl = profession.pnl || {};
        totalTurnover += parseFloat(pnl.professionalFees || pnl.professional_fees || 0);
        totalIndirectExpenses += BusinessIncomeCalculator.calculateExpenseTotal(pnl.expenses);
        totalDepreciation += BusinessIncomeCalculator.calculateExpenseTotal(pnl.depreciation);
        totalOtherExpenses += parseFloat(pnl.otherExpenses || 0);
      }
    }

    // Calculate net profit/loss
    const netProfit = totalTurnover +
      totalOpeningStock -
      totalClosingStock -
      totalPurchases -
      totalDirectExpenses -
      totalIndirectExpenses -
      totalDepreciation -
      totalOtherExpenses;

    return {
      Turnover: this.formatAmount(totalTurnover),
      OpeningStock: this.formatAmount(totalOpeningStock),
      Purchases: this.formatAmount(totalPurchases),
      ClosingStock: this.formatAmount(totalClosingStock),
      DirectExpenses: {
        RawMaterials: this.formatAmount(this.getDirectExpenseTotal(businessIncome, professionalIncome, 'rawMaterials')),
        Wages: this.formatAmount(this.getDirectExpenseTotal(businessIncome, professionalIncome, 'wages')),
        PowerFuel: this.formatAmount(this.getDirectExpenseTotal(businessIncome, professionalIncome, 'powerFuel')),
        Freight: this.formatAmount(this.getDirectExpenseTotal(businessIncome, professionalIncome, 'freight')),
        Other: this.formatAmount(this.getDirectExpenseTotal(businessIncome, professionalIncome, 'other')),
        Total: this.formatAmount(totalDirectExpenses),
      },
      IndirectExpenses: {
        Rent: this.formatAmount(this.getIndirectExpenseTotal(businessIncome, professionalIncome, 'rent')),
        Salary: this.formatAmount(this.getIndirectExpenseTotal(businessIncome, professionalIncome, 'salary')),
        Utilities: this.formatAmount(this.getIndirectExpenseTotal(businessIncome, professionalIncome, 'utilities')),
        Insurance: this.formatAmount(this.getIndirectExpenseTotal(businessIncome, professionalIncome, 'insurance')),
        Advertising: this.formatAmount(this.getIndirectExpenseTotal(businessIncome, professionalIncome, 'advertising')),
        ProfessionalFees: this.formatAmount(this.getIndirectExpenseTotal(businessIncome, professionalIncome, 'professionalFees')),
        Other: this.formatAmount(this.getIndirectExpenseTotal(businessIncome, professionalIncome, 'other')),
        Total: this.formatAmount(totalIndirectExpenses),
      },
      Depreciation: this.formatAmount(totalDepreciation),
      OtherExpenses: this.formatAmount(totalOtherExpenses),
      NetProfit: this.formatAmount(netProfit),
    };
  }

  /**
   * Build Balance Sheet (PartA_BS) - MANDATORY
   * @param {object} sectionSnapshot - Section snapshot
   * @param {object} computationResult - Computation result (for validation)
   * @returns {object} PartA_BS structure
   */
  buildBalanceSheet(sectionSnapshot, computationResult = {}) {
    const balanceSheet = sectionSnapshot.balanceSheet || sectionSnapshot.balance_sheet || {};
    const assets = balanceSheet.assets || {};
    const liabilities = balanceSheet.liabilities || {};

    // Build Assets structure
    const currentAssets = assets.currentAssets || assets.current_assets || {};
    const fixedAssets = assets.fixedAssets || assets.fixed_assets || {};

    const assetsStructure = {
      CurrentAssets: {
        Cash: this.formatAmount(currentAssets.cash || 0),
        Bank: this.formatAmount(currentAssets.bank || 0),
        Inventory: this.formatAmount(currentAssets.inventory || 0),
        Receivables: this.formatAmount(currentAssets.receivables || 0),
        Other: this.formatAmount(currentAssets.other || 0),
        Total: this.formatAmount(currentAssets.total || 0),
      },
      FixedAssets: {
        Building: this.formatAmount(fixedAssets.building || 0),
        Machinery: this.formatAmount(fixedAssets.machinery || 0),
        Vehicles: this.formatAmount(fixedAssets.vehicles || 0),
        Furniture: this.formatAmount(fixedAssets.furniture || 0),
        Other: this.formatAmount(fixedAssets.other || 0),
        Total: this.formatAmount(fixedAssets.total || 0),
      },
      Investments: this.formatAmount(assets.investments || 0),
      LoansAdvances: this.formatAmount(assets.loansAdvances || assets.loans_advances || 0),
      TotalAssets: this.formatAmount(assets.total || 0),
    };

    // Build Liabilities structure
    const currentLiabilities = liabilities.currentLiabilities || liabilities.current_liabilities || {};
    const longTermLiabilities = liabilities.longTermLiabilities || liabilities.long_term_liabilities || {};

    const liabilitiesStructure = {
      CurrentLiabilities: {
        Creditors: this.formatAmount(currentLiabilities.creditors || 0),
        BankOverdraft: this.formatAmount(currentLiabilities.bankOverdraft || currentLiabilities.bank_overdraft || 0),
        ShortTermLoans: this.formatAmount(currentLiabilities.shortTermLoans || currentLiabilities.short_term_loans || 0),
        Other: this.formatAmount(currentLiabilities.other || 0),
        Total: this.formatAmount(currentLiabilities.total || 0),
      },
      LongTermLiabilities: {
        LongTermLoans: this.formatAmount(longTermLiabilities.longTermLoans || longTermLiabilities.long_term_loans || 0),
        Other: this.formatAmount(longTermLiabilities.other || 0),
        Total: this.formatAmount(longTermLiabilities.total || 0),
      },
      Capital: this.formatAmount(liabilities.capital || 0),
      TotalLiabilities: this.formatAmount(liabilities.total || 0),
    };

    return {
      Assets: assetsStructure,
      Liabilities: liabilitiesStructure,
    };
  }

  /**
   * Build Schedule DEP (Depreciation) - Conditional
   * @param {object} sectionSnapshot - Section snapshot
   * @param {object} balanceSheet - Balance sheet structure (from buildBalanceSheet)
   * @returns {object|null} Schedule DEP or null if no depreciable assets
   */
  buildScheduleDEP(sectionSnapshot, balanceSheet = null) {
    const income = sectionSnapshot.income || {};
    const businessIncome = income.businessIncome || {};
    const professionalIncome = income.professionalIncome || {};

    // Aggregate depreciation from all businesses and professions
    let totalBuildingDep = 0;
    let totalMachineryDep = 0;
    let totalVehiclesDep = 0;
    let totalFurnitureDep = 0;
    let totalOtherDep = 0;

    // Aggregate from businesses
    if (businessIncome.businesses && Array.isArray(businessIncome.businesses)) {
      for (const business of businessIncome.businesses) {
        const pnl = business.pnl || {};
        const depreciation = pnl.depreciation || {};
        totalBuildingDep += parseFloat(depreciation.building || 0);
        totalMachineryDep += parseFloat(depreciation.machinery || 0);
        totalVehiclesDep += parseFloat(depreciation.vehicles || 0);
        totalFurnitureDep += parseFloat(depreciation.furniture || 0);
        totalOtherDep += parseFloat(depreciation.other || 0);
      }
    }

    // Aggregate from professions
    if (professionalIncome.professions && Array.isArray(professionalIncome.professions)) {
      for (const profession of professionalIncome.professions) {
        const pnl = profession.pnl || {};
        const depreciation = pnl.depreciation || {};
        totalBuildingDep += parseFloat(depreciation.building || 0);
        totalMachineryDep += parseFloat(depreciation.machinery || 0);
        totalVehiclesDep += parseFloat(depreciation.vehicles || 0);
        totalFurnitureDep += parseFloat(depreciation.furniture || 0);
        totalOtherDep += parseFloat(depreciation.other || 0);
      }
    }

    const totalDepreciation = totalBuildingDep + totalMachineryDep + totalVehiclesDep + totalFurnitureDep + totalOtherDep;

    // Only return schedule if depreciation exists
    if (totalDepreciation === 0) {
      return null;
    }

    return {
      Building: this.formatAmount(totalBuildingDep),
      Machinery: this.formatAmount(totalMachineryDep),
      Vehicles: this.formatAmount(totalVehiclesDep),
      Furniture: this.formatAmount(totalFurnitureDep),
      Other: this.formatAmount(totalOtherDep),
      TotalDepreciation: this.formatAmount(totalDepreciation),
    };
  }

  /**
   * Build Schedule CYLA (Carry Forward Losses) - Conditional
   * @param {object} sectionSnapshot - Section snapshot
   * @returns {object} Schedule CYLA (empty structure for now)
   */
  buildScheduleCYLA(sectionSnapshot) {
    // TODO: Implement carry forward losses logic when needed
    // For now, return empty structure as per schema requirement
    return {};
  }

  /**
   * Build Schedule BFLA (Brought Forward Losses) - Conditional
   * @param {object} sectionSnapshot - Section snapshot
   * @returns {object} Schedule BFLA (empty structure for now)
   */
  buildScheduleBFLA(sectionSnapshot) {
    // TODO: Implement brought forward losses logic when needed
    // For now, return empty structure as per schema requirement
    return {};
  }

  // =====================================================
  // HELPER METHODS
  // =====================================================

  /**
   * Get total for a specific direct expense category
   * @param {object} businessIncome - Business income object
   * @param {object} professionalIncome - Professional income object
   * @param {string} category - Expense category name
   * @returns {number} Total expense for category
   */
  getDirectExpenseTotal(businessIncome, professionalIncome, category) {
    let total = 0;

    if (businessIncome.businesses && Array.isArray(businessIncome.businesses)) {
      for (const business of businessIncome.businesses) {
        const pnl = business.pnl || {};
        const directExpenses = pnl.directExpenses || {};
        total += parseFloat(directExpenses[category] || 0);
      }
    }

    return total;
  }

  /**
   * Get total for a specific indirect expense category
   * @param {object} businessIncome - Business income object
   * @param {object} professionalIncome - Professional income object
   * @param {string} category - Expense category name
   * @returns {number} Total expense for category
   */
  getIndirectExpenseTotal(businessIncome, professionalIncome, category) {
    let total = 0;

    if (businessIncome.businesses && Array.isArray(businessIncome.businesses)) {
      for (const business of businessIncome.businesses) {
        const pnl = business.pnl || {};
        const indirectExpenses = pnl.indirectExpenses || {};
        total += parseFloat(indirectExpenses[category] || 0);
      }
    }

    if (professionalIncome.professions && Array.isArray(professionalIncome.professions)) {
      for (const profession of professionalIncome.professions) {
        const pnl = profession.pnl || {};
        const expenses = pnl.expenses || {};
        total += parseFloat(expenses[category] || 0);
      }
    }

    return total;
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

module.exports = new ITR3ScheduleBuilders();

